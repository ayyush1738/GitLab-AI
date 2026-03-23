from pydantic import BaseModel, Field, field_validator, ConfigDict, EmailStr
from typing import Optional, Literal, List

# --- Auth Schemas ---

class UserSchema(BaseModel):
    """
    Schema for returning user data.
    Ensures Next.js knows the User ID and Role for protected routes.
    """
    id: int
    email: EmailStr
    role: Literal["manager", "developer"]
    username: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

# --- Feature Flag Schemas ---

class FlagCreateSchema(BaseModel):
    """
    Validation for creating a new feature flag.
    Strictly enforces naming conventions to avoid SDLC friction.
    """
    name: str = Field(..., min_length=3, max_length=50, description="Human-friendly name")
    key: str = Field(..., pattern=r"^[a-zA-Z0-9_]+$", description="Machine-readable key") 
    description: Optional[str] = Field(None, max_length=200)

    model_config = ConfigDict(str_strip_whitespace=True)

    @field_validator('key')
    @classmethod
    def key_must_not_contain_spaces(cls, v: str) -> str:
        if " " in v:
            raise ValueError("Key must not contain spaces")
        return v

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
    The input schema for the AI Reasoner (Claude/Gemini).
    Includes 'Blast Radius' data from the Jaipur Node Redis instance.
    """
    feature_key: str
    environment: str = "Production"
    description: Optional[str] = None
    code_diff: Optional[str] = None
    requested_by: Optional[str] = None  # 🚀 Added for identity-aware auditing
    
    # Live Context from Redis
    current_traffic: Optional[int] = Field(0, description="Live user count from Redis")
    affected_endpoints: List[str] = Field(default_factory=list)

    model_config = ConfigDict(str_strip_whitespace=True)

class AIAssessmentResponseSchema(BaseModel):
    """
    The structured output required from the AI Reasoning Engine.
    Ensures the GitLab UI can consistently render risk scores and advice.
    """
    risk_score: int = Field(..., ge=1, le=10)
    risk_level: Literal["low", "medium", "high"]
    reasoning: str = Field(..., description="The 'Why' behind the score")
    status: Literal["PASSED", "BLOCKED", "WARNING"]
    requires_override: bool = False

    # 🚀 'Green Agent' Prize compatibility ($3,000 Bonus Category)
    sustainability_score: Optional[int] = Field(default=5, ge=1, le=10)
    carbon_impact_estimate: Optional[str] = "Neutral"

    # 🏗️ GitLab Integration Fields
    gitlab_comment_id: Optional[int] = None
    pipeline_gate_active: bool = True

    model_config = ConfigDict(from_attributes=True)

# --- Governance & Overrides ---

class ManualOverrideSchema(BaseModel):
    """
    Schema for a Manager to approve a blocked flag change.
    """
    audit_id: int
    approver_email: EmailStr
    override_reason: str = Field(..., min_length=10)
    status: Literal["APPROVED", "REJECTED"]

    model_config = ConfigDict(str_strip_whitespace=True)