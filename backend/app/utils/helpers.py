from flask import jsonify
from datetime import datetime, timezone

def api_response(success: bool, message: str, data=None, status_code: int = 200, error=None):
    """
    🛰️ Global API Response Wrapper
    Ensures every response from the Jaipur Node follows the same contract.
    Matches the 'ApiResponse' interface in the Next.js frontend.
    """
    response = {
        "success": success,
        "message": message,
        "data": data,
        "error": error, # 🚀 Added for easier frontend error handling
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    return jsonify(response), status_code

def format_error(error_message: str, error_code: str = "INTERNAL_ERROR", details=None):
    """
    🛡️ Standardized Error Formatter
    Used by AI Routes to send detailed 'BLOCK' reasons back to the UI.
    """
    return {
        "error_code": error_code,
        "message": error_message,
        "details": details
    }

def parse_pydantic_errors(e):
    """
    🧪 Pydantic Error Parser
    Converts complex Pydantic ValidationErrors into a simple 
    dictionary for the frontend to render.
    """
    errors = {}
    for error in e.errors():
        # Get the field name from the error loc (location)
        # e.g., ('body', 'key') -> 'key'
        field = str(error['loc'][-1])
        errors[field] = error['msg']
    return errors