import os
from flask import Blueprint, request, jsonify
from flask_login import current_user
from app.services.ai_agent import SafeConfigAgent
from app.services.traffic_service import TrafficService
from app.utils.helpers import api_response, format_error
from loguru import logger

ai_bp = Blueprint("ai", __name__)

@ai_bp.route("/analyze-risk", methods=["POST"])
def analyze_deployment_risk():
    """
    Primary endpoint for GitLab Duo Agent & Next.js Manual Audit.
    Analyzes code diffs, correlates with Redis traffic, and enforces RBAC.
    """
    # 1. Security Handshake: Check for GitLab Token or Authenticated Session
    agent_token = request.headers.get("X-SafeConfig-Agent-Token")
    is_gitlab_request = (agent_token and agent_token == os.getenv("GITLAB_AGENT_TOKEN"))

    if not is_gitlab_request and not current_user.is_authenticated:
        logger.warning("Unauthorized risk analysis attempt.")
        return api_response(
            success=False,
            message="Unauthorized: Provide a valid GitLab Token or Login.",
            status_code=401
        )

    if not request.is_json:
        return api_response(success=False, message="Invalid Format: JSON required", status_code=415)

    try:
        json_data = request.get_json()
        feature_key = json_data.get("feature_key")
        environment = json_data.get("environment", "Production").capitalize()
        code_diff = json_data.get("code_diff", "") 
        description = json_data.get("description", "Audit triggered via GitLab Duo.")

        if not feature_key:
            return api_response(success=False, message="Missing 'feature_key' in request body.", status_code=400)

        # 2. Correlate with 'Blast Radius' (The Live Context)
        # This gives the AI Agent a snapshot of current traffic intensity
        traffic_stats = TrafficService.get_live_traffic_context(feature_key, environment)
        
        # 3. Invoke the Multi-Model Agent (Claude 3.5 + Gemini 1.5)
        assessment = SafeConfigAgent.run_audit(
            feature_key=feature_key,
            environment=environment,
            code_diff=code_diff,
            description=description
        )
        
        # 4. Enrich Response with Identity & Traffic Data
        user_identity = "GitLab-Duo-Agent" if is_gitlab_request else current_user.email
        assessment["triggered_by"] = user_identity
        assessment["blast_radius"] = traffic_stats.get("hits_24h", 0)

        # 5. The "Safety Firewall" Enforcement Logic
        risk_score = assessment.get("risk_score", 0)
        
        # Determine if the requester has Manager privileges
        is_manager = False
        if not is_gitlab_request:
            is_manager = (current_user.role == "manager")

        # 🚀 Logic: High Risk (>= 8) + Non-Manager = HARD BLOCK
        if risk_score >= 8:
            if is_manager:
                assessment["status"] = "PASSED_WITH_OVERRIDE"
                assessment["requires_override"] = False
                message = "Manager Override: High Risk change approved locally."
            else:
                assessment["status"] = "BLOCKED"
                assessment["requires_override"] = True
                message = f"AI Guardrail: High Traffic ({assessment['blast_radius']} users) & High Risk score. Gated."
        else:
            assessment["status"] = "PASSED"
            assessment["requires_override"] = False
            message = "AI Audit: Risk is within acceptable thresholds."

        return api_response(
            success=True, 
            message=message, 
            data=assessment, 
            status_code=200
        )

    except Exception as e:
        logger.error(f"SafeConfig Logic Error: {e}")
        # 🛡️ Fail-Safe: Always block if the AI engine is unstable (Hackathon best practice)
        return api_response(
            success=True, 
            message="SafeConfig Fail-safe Active: Manual Review Required", 
            data={
                "risk_score": 10,
                "status": "BLOCKED",
                "reasoning": f"Internal Reasoning Engine Error: {str(e)}",
                "requires_override": True,
                "sustainability_score": 5
            }, 
            status_code=200 
        )

@ai_bp.route("/agent-status", methods=["GET"])
def get_agent_status():
    """Health check for the Reasoning Engine."""
    return jsonify({
        "agent": "SafeConfig Duo",
        "models": ["Claude-3.5-Sonnet", "Gemini-1.5-Flash"],
        "governance_mode": "RBAC_ENFORCED",
        "region": "jaipur-in-west-1",
        "status": "online"
    }), 200