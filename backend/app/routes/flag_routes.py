import time
import logging
from flask import Blueprint, request, g
from flask_login import login_required, current_user
from app.services.flag_service import FlagService
from app.schemas import FlagCreateSchema, FlagToggleSchema
from app.utils.helpers import api_response, format_error
from pydantic import ValidationError

logger = logging.getLogger(__name__)

flags_bp = Blueprint("flags", __name__)

# Simple in-memory cache for analytics to reduce DB load
_cache = {
    "analytics": {"data": None, "expiry": 0},
    "logs": {"data": None, "expiry": 0}
}
CACHE_TTL = 5 

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
        return api_response(True, "Feature defined successfully", new_flag.to_dict(), 201)
    except ValidationError as e:
        return api_response(False, "Schema Violation", {"errors": e.errors()}, 400)

@flags_bp.route("/<int:flag_id>/audit", methods=["POST"])
@login_required
def audit_flag(flag_id: int):
    """
    Manually triggers an AI Audit for a specific flag.
    Often used for pre-deployment checks.
    """
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
    """
    Toggles flag state. Logic includes an AI Guardrail check.
    If the AI Risk Score is too high, only managers can proceed.
    """
    try:
        json_data = request.get_json()
        data = FlagToggleSchema(**json_data)
        
        # FlagService handles the AI Check and Role Validation
        result, error_data = FlagService.toggle_status(flag_id, data, current_user)
        
        if error_data:
            # error_data contains the AI assessment that blocked the action
            return api_response(False, "AI Guardrail Blocked Action", error_data, 403)
            
        return api_response(True, "State updated safely", result.to_dict(), 200)
    except Exception as e:
        logger.exception(f"Toggle failure for flag {flag_id}")
        return api_response(False, "System Error", format_error("Deployment failure"), 500)

@flags_bp.route("/evaluate/<string:key>", methods=["GET"])
def track_traffic(key: str):
    """
    Public endpoint for SDKs to check flag status and report traffic.
    This feeds the 'Blast Radius' data used by the AI Agent.
    """
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
    """Returns hit counts per flag for the dashboard."""
    now = time.time()
    if _cache["analytics"]["data"] and now < _cache["analytics"]["expiry"]:
        return api_response(True, "Analytics retrieved (cached)", _cache["analytics"]["data"], 200)

    stats = FlagService.get_traffic_stats()
    _cache["analytics"]["data"] = stats
    _cache["analytics"]["expiry"] = now + CACHE_TTL
    return api_response(True, "Analytics retrieved", stats, 200)

@flags_bp.route("/logs", methods=["GET"])
@login_required
def get_audit_trail():
    """Returns the historical log of all toggles and AI interventions."""
    now = time.time()
    if _cache["logs"]["data"] and now < _cache["logs"]["expiry"]:
        return api_response(True, "Audit trail retrieved (cached)", _cache["logs"]["data"], 200)

    logs = FlagService.get_audit_history()
    log_dicts = [l.to_dict() for l in logs]
    _cache["logs"]["data"] = log_dicts
    _cache["logs"]["expiry"] = now + CACHE_TTL
    return api_response(True, "Audit trail retrieved", log_dicts, 200)