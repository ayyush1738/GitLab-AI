import os
from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from app.services.ai_agent import GitGuardianAgent
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
    agent_token = request.headers.get("X-GitGuardian-Agent-Token")
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

        # 2. Correlate with 'Blast Radius' from Jaipur Node Redis
        traffic_stats = TrafficService.get_live_traffic_context(feature_key, environment)
        
        # 3. Invoke the Multi-Model Agent (Claude 3.5 + Gemini 1.5)
        assessment = GitGuardianAgent.run_audit(
            feature_key=feature_key,
            environment=environment,
            code_diff=code_diff,
            description=description,
            blast_radius=traffic_stats.get("hits_24h", 0)
        )
        
        # 4. Enrich Response with Identity
        user_identity = "GitLab-Duo-Agent" if is_gitlab_request else current_user.email
        assessment["triggered_by"] = user_identity
        assessment["blast_radius"] = traffic_stats.get("hits_24h", 0)

        # 5. The "Anti-Gravity" Safety Firewall
        risk_score = assessment.get("risk_score", 0)
        is_manager = False if is_gitlab_request else (current_user.role == "manager")

        # Logic: High Risk (>= 8) + Non-Manager = HARD BLOCK
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
        logger.error(f"GitGuardian Logic Error: {e}")
        return api_response(
            success=True, 
            message="GitGuardian Fail-safe Active: Manual Review Required", 
            data={
                "risk_score": 10,
                "status": "BLOCKED",
                "reasoning": f"Internal Reasoning Engine Error: {str(e)}",
                "requires_override": True
            }, 
            status_code=200 
        )

@ai_bp.route("/pre-flight", methods=["POST"])
@login_required
def pre_flight_audit():
    """
    Dashboard-specific audit. Generates a risk preview before 
    a user confirms a Production toggle.
    """
    # ðŸ”— Ensure DB is available for the lookup
    from app.extensions import db
    from app.models import FeatureFlag

    try:
        json_data = request.get_json()
        flag_id = json_data.get("flag_id")

        # 1. Resilient Lookup: Using session.get for modern SQLAlchemy compatibility
        flag = db.session.get(FeatureFlag, flag_id)

        if not flag:
            logger.error(f"Pre-flight Fail: Flag ID {flag_id} not found in DB.")
            return api_response(False, "Flag identity not found", status_code=404)

        # 2. Traffic Context: Don't let a Redis timeout kill the whole request
        try:
            traffic_stats = TrafficService.get_live_traffic_context(flag.key, "Production")
            blast_radius = traffic_stats.get("hits_24h", 0)
        except Exception as redis_err:
            logger.warning(f"Telemetry Offline: {redis_err}. Defaulting blast radius to 0.")
            blast_radius = 0

        # 3. AI Reasoning: Wrapped in a try-except to prevent 500s if LLM keys are missing
        try:
            assessment = GitGuardianAgent.run_audit(
                feature_key=flag.key,
                environment="Production",
                code_diff="Dashboard State Toggle",
                description=f"Pre-deployment check for {flag.key}",
                blast_radius=blast_radius
            )
        except Exception as ai_err:
            logger.error(f"AI Reasoning Engine Failure: {ai_err}")
            # ðŸ›¡ï¸ THE FAIL-SAFE REPORT (Prevents the 500 error)
            assessment = {
                "risk_score": 5,
                "summary": "AI Audit Engine is currently stabilizing. Manual risk assessment required.",
                "advice": "Review previous audit logs before confirming.",
                "risk_level": "medium"
            }

        return api_response(
            success=True,
            message="Pre-flight audit complete",
            data={"report": assessment},
            status_code=200
        )

    except Exception as e:
        logger.critical(f"ðŸ›‘ Critical Crash in /pre-flight: {str(e)}")
        return api_response(False, "Internal Node Error. Check Flask terminal.", status_code=500)

@ai_bp.route("/agent-status", methods=["GET"])
def get_agent_status():
    """Health check for the Reasoning Engine."""
    return jsonify({
        "agent": "GitGuardian Duo",
        "models": ["Claude-3.5-Sonnet", "Gemini-1.5-Flash"],
        "governance_mode": "RBAC_ENFORCED",
        "region": "jaipur-in-west-1",
        "status": "online"
    }), 200