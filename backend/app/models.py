from app import db
from datetime import datetime, timezone
from flask_login import UserMixin
from sqlalchemy.dialects.postgresql import JSONB

class User(db.Model, UserMixin):
    """
    Standard User model linked to GitHub OAuth.
    Includes role-based access for the AI Guardrail.
    """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    # role can be 'developer' or 'manager'
    role = db.Column(db.String(20), default='developer', nullable=False) 
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    tokens = db.relationship("OAuth", backref="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role
        }

class OAuth(db.Model):
    """
    Stores GitHub OAuth tokens.
    Required by flask-dance to keep users logged in.
    """
    __tablename__ = 'oauth'

    id = db.Column(db.Integer, primary_key=True)
    provider = db.Column(db.String(50), nullable=False)
    provider_user_id = db.Column(db.String(256), unique=True, nullable=False)
    token = db.Column(JSONB, nullable=False) # Native PG JSONB for performance
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

class FeatureFlag(db.Model):
    """
    Represents a specific feature or code block being audited.
    """
    __tablename__ = 'feature_flags'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    key = db.Column(db.String(50), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    statuses = db.relationship('FlagStatus', backref='feature_flag', lazy=True, cascade="all, delete-orphan")
    evaluations = db.relationship('FlagEvaluation', backref='feature_flag', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "key": self.key,
            "description": self.description,
            "statuses": [s.to_dict() for s in self.statuses]
        }

class Environment(db.Model):
    """Deployment targets: Development, Staging, Production."""
    __tablename__ = 'environments'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False) 

class FlagStatus(db.Model):
    """The current state (ON/OFF) of a flag in a specific environment."""
    __tablename__ = 'flag_statuses'
    
    id = db.Column(db.Integer, primary_key=True)
    flag_id = db.Column(db.Integer, db.ForeignKey('feature_flags.id'), nullable=False)
    env_id = db.Column(db.Integer, db.ForeignKey('environments.id'), nullable=False)
    is_enabled = db.Column(db.Boolean, default=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    env = db.relationship('Environment')

    def to_dict(self):
        return {
            "environment_name": self.env.name,
            "is_enabled": self.is_enabled,
            "updated_at": self.updated_at.isoformat()
        }

class FlagEvaluation(db.Model):
    """
    Traffic Capture: Stores real-time hits for Blast Radius calculation.
    This is the data the AI Agent uses to judge risk.
    """
    __tablename__ = 'flag_evaluations'
    
    id = db.Column(db.Integer, primary_key=True)
    flag_id = db.Column(db.Integer, db.ForeignKey('feature_flags.id'), nullable=False)
    environment_name = db.Column(db.String(50), default="Production")
    # Indexed for high-speed time-series queries
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

class AuditLog(db.Model):
    """
    The Compliance Ledger.
    Stores every toggle, including the AI's risk reasoning.
    """
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    flag_id = db.Column(db.Integer, db.ForeignKey('feature_flags.id'))
    env_name = db.Column(db.String(50))
    action = db.Column(db.String(100)) # e.g., 'AI_BLOCK', 'MANAGER_OVERRIDE'
    reason = db.Column(db.Text)
    ai_metadata = db.Column(JSONB, nullable=True) # Full LangChain audit report
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "action": self.action,
            "reason": self.reason,
            "ai_report": self.ai_metadata,
            "timestamp": self.timestamp.isoformat()
        }