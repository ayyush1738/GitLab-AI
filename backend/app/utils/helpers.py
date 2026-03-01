from flask import jsonify
from loguru import logger
import json

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
        "timestamp": None # Optional: Add ISO timestamp here if needed
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
    return [
        {"field": str(err["loc"][-1]), "message": err["msg"]}
        for err in validation_error.errors()
    ]

def clean_llm_json(raw_text: str) -> dict:
    """
    Specialized helper for the AI Agent.
    LLMs often wrap JSON in markdown blocks (```json ... ```).
    This function extracts and parses the raw JSON string safely.
    """
    try:
        # Remove potential Markdown formatting
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0].strip()
        
        return json.loads(raw_text)
    except (ValueError, IndexError, json.JSONDecodeError) as e:
        logger.error(f"Failed to parse LLM JSON: {e} | Raw: {raw_text}")
        return {
            "risk_score": 5,
            "advice": "Error parsing AI response. Defaulting to manual review.",
            "risk_level": "medium"
        }