import json
import logging
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import cache  # 🚀 Global Redis Client
from app.services.flag_service import FlagService
from app.schemas import FlagCreateSchema, FlagToggleSchema
from app.utils.helpers import api_response, format_error
from pydantic import ValidationError

logger = logging.getLogger(__name__)

flags_bp = Blueprint("flags", __name__)

# Cache Configuration
CACHE_TTL = 300  # 5 Minutes

@flags_bp.route("", methods=["GET"])
@login_required
def list_flags():
    """Retrieves all defined feature flags."""
    flags = FlagService.get_all_flags()
    return api_response(True, "Flags retrieved", [f.to_dict() for f in flags])

@flags_bp.route("", methods=["POST"])
@login_required
def create_flag():
    """Defines a new feature flag. Restricted to Managers."""
    if current_user.role != "manager":
        logger.warning(f"Unauthorized creation attempt by: {current_user.email}")
        return api_response(False, "Forbidden", format_error("Managerial privileges required"), 403)

    try:
        json_data = request.get_json()
        data = FlagCreateSchema(**json_data)
        new_flag = FlagService.create_new_flag(data)
        
        # Invalidate analytics cache on new flag creation
        if cache:
            cache.delete("analytics_data")
            
        return api_response(True, "Feature defined successfully", new_flag.to_dict(), 201)
    except ValidationError as e:
        return api_response(False, "Schema Violation", {"errors": e.errors()}, 400)

@flags_bp.route("/<int:flag_id>/audit", methods=["POST"])
@login_required
def audit_flag(flag_id: int):
    """Manually triggers an AI Audit for a specific flag."""
    try:
        json_data = request.get_json()
        reason = json_data.get("reason", "Manual pre-flight audit")
        env_id = json_data.get("environment_id")

        if not env_id:
            return api_response(False, "Input Error", format_error("environment_id required"), 400)

        report, err = FlagService.audit_flag(flag_id, env_id, reason)
        if err: 
            return api_response(False, "Audit Failed", format_error(err), 400)

        return api_response(True, "Audit completed", report, 200)
    except Exception as e:
        logger.exception(f"Audit failure for flag {flag_id}")
        return api_response(False, "System Error", format_error("Internal audit failure"), 500)

@flags_bp.route("/<int:flag_id>/toggle", methods=["PATCH"])
@login_required
def toggle_flag(flag_id: int):
    """Toggles flag state with AI Guardrail enforcement."""
    try:
        json_data = request.get_json()
        data = FlagToggleSchema(**json_data)
        
        # FlagService handles AI Risk and Role Validation
        result, error_data = FlagService.toggle_status(flag_id, data, current_user)
        
        if error_data:
            return api_response(False, "AI Guardrail Blocked Action", error_data, 403)
            
        # Invalidate logs cache on state change
        if cache:
            cache.delete("audit_logs")
            
        return api_response(True, "State updated safely", result.to_dict(), 200)
    except Exception as e:
        logger.exception(f"Toggle failure for flag {flag_id}")
        return api_response(False, "System Error", format_error("Deployment failure"), 500)

@flags_bp.route("/evaluate/<string:key>", methods=["GET"])
def track_traffic(key: str):
    """SDK endpoint that feeds Blast Radius data to the AI Agent."""
    env_name = request.args.get('env', 'Production').capitalize()
    
    # Record the hit for Blast Radius metrics
    FlagService.track_evaluation(key, env_name)
    
    status_data = FlagService.get_flag_status_by_key(key, env_name)
    if not status_data:
        return api_response(False, "Flag or Environment not found", None, 404)
        
    return api_response(True, f"Status retrieved for {env_name}", status_data, 200)

@flags_bp.route("/analytics", methods=["GET"])
@login_required
def get_traffic_analytics():
    """Returns hit counts using Redis for distributed consistency."""
    if cache:
        cached_data = cache.get("analytics_data")
        if cached_data:
            return api_response(True, "Analytics retrieved (Redis)", json.loads(cached_data), 200)

    stats = FlagService.get_traffic_stats()
    
    if cache:
        cache.setex("analytics_data", CACHE_TTL, json.dumps(stats))
        
    return api_response(True, "Analytics retrieved", stats, 200)

@flags_bp.route("/logs", methods=["GET"])
@login_required
def get_audit_trail():
    """Returns historical logs with Redis caching."""
    if cache:
        cached_logs = cache.get("audit_logs")
        if cached_logs:
            return api_response(True, "Audit trail retrieved (Redis)", json.loads(cached_logs), 200)

    logs = [l.to_dict() for l in FlagService.get_audit_history()]
    
    if cache:
        cache.setex("audit_logs", CACHE_TTL, json.dumps(logs))
        
    return api_response(True, "Audit trail retrieved", logs, 200)