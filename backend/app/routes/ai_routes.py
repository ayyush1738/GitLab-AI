import logging
from flask import Blueprint, request, jsonify, g
from flask_login import login_required, current_user
from app.services.langchain_agent import SafeConfigAgent
from app.services.traffic_service import TrafficService
from app.utils.helpers import api_response, format_error

logger = logging.getLogger(__name__)

ai_bp = Blueprint("ai", __name__)

@ai_bp.route("/analyze-risk", methods=["POST"])
@login_required
def analyze_deployment_risk():
    """
    Primary endpoint for the GitLab Duo Agent.
    Analyzes code diffs and correlates with live traffic.
    """
    if not request.is_json:
        return api_response(
            success=False, 
            message="Unsupported Media Type", 
            data=format_error("Request must be a JSON object"), 
            status_code=415
        )

    try:
        json_data = request.get_json()
        
        # GitLab Duo Agent passes these parameters
        feature_key = json_data.get("feature_key")
        environment = json_data.get("environment", "Production").capitalize()
        # In a real GitLab Agent Flow, this 'code_diff' comes from the GitLab Toolkit
        code_diff = json_data.get("code_diff", "") 
        description = json_data.get("description", "Automated audit triggered via GitLab Duo.")

        # 1. Fetch real-time context (Blast Radius) from our Traffic Service
        traffic_stats = TrafficService.get_live_traffic_context(feature_key, environment)
        
        # 2. Invoke the LangChain Agent (The Reasoning Engine)
        # This replaces the static Groq prompt with a dynamic ReAct agent
        assessment = SafeConfigAgent.run_audit(
            feature_key=feature_key,
            environment=environment,
            code_diff=code_diff,
            description=description,
            traffic_context=traffic_stats
        )
        
        # 3. Add metadata for the UI/GitLab Comment
        assessment["triggered_by"] = current_user.email
        assessment["blast_radius_hits"] = traffic_stats.get("hits_24h", 0)

        # 4. Check for Blocked Status (Governance Layer)
        if assessment.get("risk_score", 0) >= 8 and current_user.role != "manager":
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
        
        # Fail-safe mode (Graceful Degradation)
        fail_safe_data = {
            "risk_score": 5, 
            "advice": "AI Reasoning Engine temporarily offline. Manual security review required.",
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
@login_required
def get_agent_status():
    """Returns the current configuration and health of the AI Agent."""
    return jsonify({
        "agent_name": "SafeConfig Duo",
        "capabilities": ["MR_AUDIT", "TRAFFIC_CORRELATION", "GOVERNANCE_ENFORCEMENT"],
        "connected_llms": ["Anthropic Claude 3.5 Sonnet", "Google Gemini 1.5 Pro"],
        "status": "active"
    }), 200