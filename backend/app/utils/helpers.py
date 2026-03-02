import json
import logging
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
        "timestamp": datetime.now(timezone.utc).isoformat() # 🚀 Added for Professional Audit Trails
    }
    return jsonify(response), status_code

def format_error(message: str, details: any = None):
    """Formats internal error messages for client-side consumption."""
    return {
        "error": message,
        "details": details
    }

def parse_pydantic_errors(validation_error):
    """
    Converts complex Pydantic validation objects into a simple 
    list of field-specific errors for the UI.
    """
    try:
        return [
            {"field": str(err["loc"][-1]), "message": err["msg"]}
            for err in validation_error.errors()
        ]
    except Exception as e:
        logger.error(f"Pydantic parse failed: {e}")
        return [{"field": "unknown", "message": "Validation failed"}]

def clean_llm_json(raw_text: str) -> dict:
    """
    Specialized helper for the AI Agent.
    LLMs often wrap JSON in markdown blocks (```json ... ```).
    This extracts and parses the raw JSON string safely.
    """
    try:
        # Step 1: Remove potential Markdown formatting
        cleaned = raw_text.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()
        
        # Step 2: Parse and return
        return json.loads(cleaned)
        
    except (ValueError, IndexError, json.JSONDecodeError) as e:
        logger.error(f"Failed to parse LLM JSON: {e} | Raw text received: {raw_text[:100]}...")
        
        # 🛡️ Fail-Safe: Never return a raw error to the Agent logic
        return {
            "risk_score": 5,
            "advice": "AI response was malformed. Defaulting to safe manual review.",
            "risk_level": "medium",
            "status": "PARSE_ERROR"
        }