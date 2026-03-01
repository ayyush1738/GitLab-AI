import os
import logging
from flask import Blueprint, request, jsonify, current_app
from flask_login import current_user
from app.services.langchain_agent import SafeConfigAgent
from app.services.traffic_service import TrafficService
from app.utils.helpers import api_response, format_error

logger = logging.getLogger(__name__)

ai_bp = Blueprint("ai", __name__)

@ai_bp.route("/analyze-risk", methods=["POST"])
def analyze_deployment_risk():
    """
    Primary endpoint for the GitLab Duo Agent.
    Analyzes code diffs and correlates with live traffic.
    """
    # 1. Security Handshake: Allow GitLab Service Account OR Logged-in User
    agent_token = request.headers.get("X-Gitlab-Agent-Token")
    is_gitlab_request = (agent_token == os.getenv("GITLAB_AGENT_TOKEN"))

    if not is_gitlab_request and not current_user.is_authenticated:
        logger.warning("Unauthorized access attempt to /analyze-risk")
        return api_response(
            success=False,
            message="Unauthorized: Valid GitLab Token or Login required",
            status_code=401
        )

    if not request.is_json:
        return api_response(
            success=False, 
            message="Unsupported Media Type", 
            data=format_error("Request must be a JSON object"), 
            status_code=415
        )

    try:
        json_data = request.get_json()
        
        # GitLab Duo Agent parameters
        feature_key = json_data.get("feature_key")
        environment = json_data.get("environment", "Production").capitalize()
        code_diff = json_data.get("code_diff", "") 
        description = json_data.get("description", "Automated audit triggered via GitLab Duo.")

        # 2. Fetch real-time context (Blast Radius)
        traffic_stats = TrafficService.get_live_traffic_context(feature_key, environment)
        
        # 3. Invoke the LangChain Agent (The Reasoning Engine)
        assessment = SafeConfigAgent.run_audit(
            feature_key=feature_key,
            environment=environment,
            code_diff=code_diff,
            description=description,
            traffic_context=traffic_stats
        )
        
        # 4. Metadata for Auditing
        user_identity = "GitLab-Duo-Agent" if is_gitlab_request else current_user.email
        assessment["triggered_by"] = user_identity
        assessment["blast_radius_hits"] = traffic_stats.get("hits_24h", 0)

        # 5. Governance Layer: Block high risk if user is not a Manager
        risk_score = assessment.get("risk_score", 0)
        is_manager = (not is_gitlab_request and current_user.role == "manager")

        if risk_score >= 8 and not is_manager:
            assessment["status"] = "BLOCKED"
            assessment["requires_override"] = True
            message = "AI Guardrail: High Risk Detected. Deployment Blocked."
        else:
            assessment["status"] = "PASSED"
            assessment["requires_override"] = False
            message = f"AI Audit Complete for {environment}"

        return api_response(
            success=True, 
            message=message, 
            data=assessment, 
            status_code=200
        )

    except Exception as e:
        logger.exception(f"LangChain Agent Failure: {e}")
        
        # Fail-safe mode: Block by default on AI failure for safety
        fail_safe_data = {
            "risk_score": 5, 
            "advice": "AI Engine offline. Manual security review required.",
            "risk_level": "medium",
            "status": "WARNING",
            "requires_override": True
        }
        return api_response(
            success=True, 
            message="SafeConfig Fail-safe Active", 
            data=fail_safe_data, 
            status_code=200 
        )

@ai_bp.route("/agent-status", methods=["GET"])
def get_agent_status():
    """Returns the current configuration and health of the AI Agent."""
    return jsonify({
        "agent_name": "SafeConfig Duo",
        "capabilities": ["MR_AUDIT", "TRAFFIC_CORRELATION", "GOVERNANCE_ENFORCEMENT"],
        "connected_llms": ["Anthropic Claude 3.5 Sonnet", "Google Gemini 1.5 Pro"],
        "status": "active"
    }), 200