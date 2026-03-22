import json
import logging
from flask import Blueprint, request
from flask_login import login_required, current_user
from app import cache  
from app.services.flag_service import FlagService
from app.schemas import FlagCreateSchema, FlagToggleSchema
from app.utils.helpers import api_response, format_error, parse_pydantic_errors
from pydantic import ValidationError
from loguru import logger

flags_bp = Blueprint("flags", __name__)

# Cache Configuration
CACHE_TTL = 300  # 5 Minutes

@flags_bp.route("", methods=["GET"])
@login_required
def list_flags():
    """Retrieves all defined feature flags for the dashboard."""
    flags = FlagService.get_all_flags()
    return api_response(True, "Flags retrieved", [f.to_dict() for f in flags])

@flags_bp.route("", methods=["POST"])
@login_required
def create_flag():
    """Defines a new feature flag. Restricted to Managers for SDLC integrity."""
    if current_user.role != "manager":
        logger.warning(f"Unauthorized creation attempt by: {current_user.email}")
        return api_response(False, "Forbidden", format_error("Managerial privileges required"), 403)

    try:
        json_data = request.get_json()
        data = FlagCreateSchema(**json_data)
        new_flag = FlagService.create_new_flag(data)
        
        # 🚀 Pro-Active Cache Invalidation
        if cache:
            cache.delete("analytics_data")
            
        return api_response(True, "Feature defined successfully", new_flag.to_dict(), 201)
    except ValidationError as e:
        return api_response(False, "Validation Error", {"errors": parse_pydantic_errors(e)}, 400)

@flags_bp.route("/<int:flag_id>/toggle", methods=["PATCH"])
@login_required
def toggle_flag(flag_id: int):
    """
    Toggles flag state with AI Guardrail enforcement.
    If the AI blocks a Developer, the Manager can use this same route to Override.
    """
    try:
        json_data = request.get_json()
        data = FlagToggleSchema(**json_data)
        
        # FlagService handles the heavy lifting of AI Risk and RBAC check
        result, error_data = FlagService.toggle_status(flag_id, data, current_user)
        
        if error_data:
            # If error_data is returned, it means the AI Guardrail triggered a block
            return api_response(False, "AI Guardrail Blocked Action", error_data, 403)
            
        # 🚀 Cache Invalidation: Ensure the dashboard logs and analytics update immediately
        if cache:
            cache.delete("audit_logs")
            cache.delete("analytics_data")
            
        return api_response(True, "State updated safely", result.to_dict(), 200)
    except ValidationError as e:
         return api_response(False, "Validation Error", {"errors": parse_pydantic_errors(e)}, 400)
    except Exception as e:
        logger.error(f"Toggle failure for flag {flag_id}: {e}")
        return api_response(False, "System Error", format_error("Toggle operation failed"), 500)

@flags_bp.route("/evaluate/<string:key>", methods=["GET"])
def track_traffic(key: str):
    """
    SDK endpoint used by the actual application.
    Increments Redis 'Blast Radius' and returns current flag state.
    """
    env_name = request.args.get('env', 'Production').capitalize()
    
    # 🚀 Crucial: Records the hit in Redis/DB before returning status
    FlagService.track_evaluation(key, env_name)
    
    status_data = FlagService.get_flag_status_by_key(key, env_name)
    if not status_data:
        return api_response(False, "Flag or Environment not found", None, 404)
        
    return api_response(True, f"Status retrieved for {env_name}", status_data, 200)

@flags_bp.route("/analytics", methods=["GET"])
@login_required
def get_traffic_analytics():
    """Returns hit counts. Uses 'Cache-Aside' pattern for performance."""
    if cache:
        cached_data = cache.get("analytics_data")
        if cached_data:
            return api_response(True, "Analytics (Cached)", json.loads(cached_data), 200)

    stats = FlagService.get_traffic_stats()
    
    if cache:
        # Serializing the result set from get_traffic_stats
        formatted_stats = [{"key": s[0], "hits": s[1]} for s in stats]
        cache.setex("analytics_data", CACHE_TTL, json.dumps(formatted_stats))
        return api_response(True, "Analytics (Fresh)", formatted_stats, 200)
        
    return api_response(True, "Analytics", stats, 200)

@flags_bp.route("/logs", methods=["GET"])
@login_required
def get_audit_trail():
    """Returns the central compliance ledger."""
    if cache:
        cached_logs = cache.get("audit_logs")
        if cached_logs:
            return api_response(True, "Audit trail (Cached)", json.loads(cached_logs), 200)

    logs = [l.to_dict() for l in FlagService.get_audit_history()]
    
    if cache:
        cache.setex("audit_logs", CACHE_TTL, json.dumps(logs))
        
    return api_response(True, "Audit trail (Fresh)", logs, 200)