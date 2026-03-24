import json
from flask import Blueprint, request
from flask_login import login_required, current_user
from app.services.flag_service import FlagService
from app.services.traffic_service import TrafficService
from app.schemas import FlagCreateSchema, FlagToggleSchema
from app.utils.helpers import api_response, format_error, parse_pydantic_errors
from pydantic import ValidationError
from loguru import logger

flags_bp = Blueprint("flags", __name__)

# Cache TTL: 5 Minutes for high-performance dashboard scaling
CACHE_TTL = 300  

@flags_bp.route("", methods=["GET"])
@login_required
def list_flags():
    """Retrieves all defined feature flags for the dashboard."""
    flags = FlagService.get_all_flags()
    
    # Manually serialize to avoid SQLAlchemy recursion errors
    data = [{
        "id": f.id,
        "name": f.name,
        "key": f.key,
        "description": f.description,
        "statuses": [
            {
                "environment_id": s.environment_id,
                "environment_name": s.environment.name,
                "is_enabled": s.is_enabled,
                "updated_at": s.updated_at.isoformat() if hasattr(s, 'updated_at') and s.updated_at else None
            } 
            for s in f.statuses
        ]
    } for f in flags]
    
    return api_response(True, "Flags retrieved", data)

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
        
        # 🚀 Cache Invalidation
        from app import cache
        if cache:
            cache.delete("analytics_data")
            
        return api_response(True, "Feature defined successfully", {"id": new_flag.id, "key": new_flag.key}, 201)
    except ValidationError as e:
        return api_response(False, "Validation Error", parse_pydantic_errors(e), 400)

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
        
        # FlagService handles AI Risk and RBAC check
        result, error_data = FlagService.toggle_status(flag_id, data, current_user)
        
        if error_data:
            # AI Guardrail triggered a block or a manager override was required
            return api_response(False, "AI Guardrail Blocked Action", error_data, 403)
            
        # 🚀 Invalidate Caches to keep dashboard fresh
        from app import cache
        if cache:
            cache.delete("audit_logs")
            cache.delete("analytics_data")
            
        return api_response(True, "State updated safely", {"id": result.id, "is_enabled": result.is_enabled}, 200)
    except ValidationError as e:
         return api_response(False, "Validation Error", parse_pydantic_errors(e), 400)
    except Exception as e:
        logger.error(f"Toggle failure for flag {flag_id}: {e}")
        return api_response(False, "System Error", format_error(str(e)), 500)

@flags_bp.route("/evaluate/<string:key>", methods=["GET"])
def evaluate_flag(key: str):
    # Normalize input: strip whitespace and match your DB casing (usually lowercase)
    # If your DB uses "Development", keep it as .title(), if "development", use .lower()
    env = request.args.get("env", "Production").strip() 
    
    # 🔍 PRO-TIP: Print this to your terminal to see exactly what the SDK is sending
    # logger.info(f"Evaluating {key} for environment: {env}")

    result = FlagService.get_flag_status_by_key(key, env)
    
    if result is None:
        return api_response(False, f"Flag '{key}' in '{env}' not found.", {"enabled": False}, 404)
        
    FlagService.track_evaluation(key, env)
    
    # Check if 'result' is a dictionary or a SQLAlchemy object
    is_on = False
    if hasattr(result, 'is_enabled'):
        is_on = result.is_enabled
    elif isinstance(result, dict):
        is_on = result.get('is_enabled', False) or result.get('enabled', False)

    return api_response(True, "Flag Evaluation", {"enabled": is_on}, 200)

@flags_bp.route("/analytics", methods=["GET"])
@login_required
def get_traffic_analytics():
    """Returns hit counts. Uses 'Cache-Aside' pattern for performance."""
    from app import cache
    if cache:
        cached_data = cache.get("analytics_data")
        if cached_data:
            return api_response(True, "Analytics (Cached)", json.loads(cached_data), 200)

    # Aggregates from TrafficService (Hybrid Redis/Postgres)
    stats = TrafficService.get_global_traffic_distribution()
    
    if cache:
        cache.setex("analytics_data", CACHE_TTL, json.dumps(stats))
        
    return api_response(True, "Analytics (Fresh)", stats, 200)

@flags_bp.route("/logs", methods=["GET"])
@login_required
def get_audit_trail():
    """Returns the central compliance ledger for the 'Audit' tab."""
    from app import cache
    if cache:
        cached_logs = cache.get("audit_logs")
        if cached_logs:
            return api_response(True, "Audit trail (Cached)", json.loads(cached_logs), 200)

    logs = FlagService.get_audit_history()
    
    # Format logs for frontend consumption
    formatted_logs = [{
        "id": l.id,
        "flag_key": l.feature_flag.key if l.feature_flag else "System",
        "env": l.env_name,
        "action": l.action,
        "risk": l.risk_score,
        "sustainability": l.sustainability_score, # 🌱 Green Software Prize Data
        "timestamp": l.timestamp.isoformat()
    } for l in logs]
    
    if cache:
        cache.setex("audit_logs", CACHE_TTL, json.dumps(formatted_logs))
        
    return api_response(True, "Audit trail (Fresh)", formatted_logs, 200)