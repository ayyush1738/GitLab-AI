from flask import jsonify
from datetime import datetime, timezone

def api_response(success, message, data=None, status_code=200):
    """
    🛰️ Global API Response Wrapper
    Matches the 'ApiResponse' interface in our Next.js types/api.d.ts
    """
    response = {
        "success": success,
        "message": message,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    return jsonify(response), status_code

def format_error(error_message, error_code="INTERNAL_ERROR", details=None):
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
    dictionary for the frontend to render in toast notifications.
    """
    errors = {}
    for error in e.errors():
        # Get the field name from the error loc (location)
        field = error['loc'][-1]
        errors[field] = error['msg']
    return errors