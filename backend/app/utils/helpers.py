import json
import logging
import re
from datetime import datetime, timezone
from flask import jsonify
from loguru import logger

def api_response(success: bool, message: str, data: any = None, status_code: int = 200):
    """
    Standardized API Response Wrapper.
    Ensures the Frontend and GitLab Duo Agent receive a consistent JSON structure.
    """
    if success:
        logger.info(f"API Success [{status_code}]: {message}")
    else:
        logger.warning(f"API Error [{status_code}]: {message}")

    response = {
        "success": success,
        "message": message,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    return jsonify(response), status_code

def get_blast_radius(feature_key: str):
    """
    Helper to fetch live traffic from Redis.
    Centralizes the 'Grand Prize' logic for the AI Agent.
    """
    from app import cache
    if not cache:
        return 0
    try:
        # Assuming a key structure like 'traffic:billing_engine'
        traffic = cache.get(f"traffic:{feature_key}")
        return int(traffic) if traffic else 0
    except Exception as e:
        logger.error(f"Redis Blast Radius lookup failed: {e}")
        return 0

def clean_llm_json(raw_text: str) -> dict:
    """
    Advanced AI JSON Extraction.
    Handles Markdown blocks, trailing commas, and prefix text.
    """
    try:
        # 1. Targeted Extraction using Regex (More robust than split)
        json_match = re.search(r"(\{.*\})", raw_text, re.DOTALL)
        if json_match:
            cleaned = json_match.group(1)
        else:
            cleaned = raw_text.strip()

        # 2. Basic 'Dirty' JSON Fixes (Common LLM mistakes)
        cleaned = cleaned.replace(",}", "}").replace(",]", "]")
        
        return json.loads(cleaned)
        
    except (ValueError, json.JSONDecodeError) as e:
        logger.error(f"LLM JSON Parse Failed: {e} | Snippet: {raw_text[:50]}")
        
        # 🛡️ Fail-Safe for the 'Safety Firewall' narrative
        return {
            "risk_score": 10,  # Fail-safe to High Risk if AI is incoherent
            "risk_level": "high",
            "advice": "CRITICAL: AI Audit Response was malformed. Manual verification required.",
            "status": "BLOCKED",
            "requires_override": True
        }

def parse_pydantic_errors(validation_error):
    """Converts Pydantic errors into a UI-friendly list."""
    try:
        return [
            {"field": str(err["loc"][-1]), "message": err["msg"]}
            for err in validation_error.errors()
        ]
    except Exception:
        return [{"field": "form", "message": "Invalid input data provided."}]