from pydantic import BaseModel, Field, field_validator, ConfigDict, EmailStr
from typing import Optional, Literal

# --- Auth Schemas ---

class UserSchema(BaseModel):
    """Schema for returning user data."""
    email: EmailStr
    role: str
    
    # 🚀 v2 Config: Allows Pydantic to read data from SQLAlchemy models directly
    model_config = ConfigDict(from_attributes=True)

# --- Feature Flag Schemas ---

class FlagCreateSchema(BaseModel):
    """
    Validation for creating a new feature flag.
    Strictly enforces naming conventions to avoid SDLC friction.
    """
    name: str = Field(..., min_length=3, max_length=50, description="Human-friendly name")
    
    # 🛡️ Pattern ensures key is snake_case: lowercase, numbers, and underscores only
    key: str = Field(..., pattern=r"^[a-z0-9_]+$", description="Machine-readable key") 
    
    description: Optional[str] = Field(None, max_length=200)

    model_config = ConfigDict(str_strip_whitespace=True)

    @field_validator('key')
    @classmethod
    def key_must_be_snake_case(cls, v: str) -> str:
        if " " in v:
            raise ValueError("Key must not contain spaces")
        return v.lower()

class FlagToggleSchema(BaseModel):
    """
    Validation for state changes.
    Enforces that a reason is provided for the AI Audit Log.
    """
    environment_id: int
    reason: str = Field(..., min_length=5, description="Business justification for the change")

    model_config = ConfigDict(str_strip_whitespace=True)

# --- AI & Audit Schemas ---

class RiskAnalysisSchema(BaseModel):
    """
    The input schema for the GitLab Duo Agent tool.
    This defines what the Agent 'sees' when it decides to run an audit.
    """
    feature_key: str
    environment: str = "Production"
    description: Optional[str] = None
    code_diff: Optional[str] = None

    model_config = ConfigDict(str_strip_whitespace=True)

class AIAssessmentResponseSchema(BaseModel):
    """
    The structured output required from the AI Reasoning Engine.
    Ensures the GitLab UI can consistently render risk scores and advice.
    """
    risk_score: int = Field(..., ge=1, le=10)
    risk_level: Literal["low", "medium", "high"]
    advice: str
    status: Literal["PASSED", "BLOCKED", "WARNING"]
    requires_override: bool = False

    # 🚀 Enables 'Green Agent' Prize compatibility ($3,000 Bonus)
    sustainability_score: Optional[int] = Field(None, ge=1, le=10)

    model_config = ConfigDict(from_attributes=True)