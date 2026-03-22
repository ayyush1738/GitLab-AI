from app.extensions import db
from datetime import datetime, timezone
from flask_login import UserMixin
from sqlalchemy.dialects.postgresql import JSONB

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(100), unique=True, nullable=True) # For GitHub/GitLab SSO matching
    role = db.Column(db.String(20), default='developer', nullable=False) 
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    tokens = db.relationship("OAuth", backref="user", cascade="all, delete-orphan")

class OAuth(db.Model):
    __tablename__ = 'oauth'
    id = db.Column(db.Integer, primary_key=True)
    provider = db.Column(db.String(50), nullable=False)
    provider_user_id = db.Column(db.String(256), unique=True, nullable=False)
    token = db.Column(JSONB, nullable=False) 
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

class Environment(db.Model):
    """
    🌍 Deployment Environment
    Stores the targets: 'Development', 'Staging', 'Production'.
    Required for the FlagStatus mapping.
    """
    __tablename__ = 'environments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    
    statuses = db.relationship('FlagStatus', backref='environment', lazy=True)

class FeatureFlag(db.Model):
    __tablename__ = 'feature_flags'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    key = db.Column(db.String(50), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    
    # 🚀 Integration Hook: Track which GitLab MR last touched this flag
    last_mr_id = db.Column(db.String(50), nullable=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    statuses = db.relationship('FlagStatus', backref='feature_flag', lazy=True, cascade="all, delete-orphan")

class FlagStatus(db.Model):
    """
    ⚡ Flag State Per Environment
    The link between a Flag and an Environment (e.g., Flag A is ON in Dev but OFF in Prod).
    """
    __tablename__ = 'flag_statuses'
    id = db.Column(db.Integer, primary_key=True)
    flag_id = db.Column(db.Integer, db.ForeignKey('feature_flags.id'), nullable=False)
    environment_id = db.Column(db.Integer, db.ForeignKey('environments.id'), nullable=False)
    is_enabled = db.Column(db.Boolean, default=False, nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class AuditLog(db.Model):
    """
    🛡️ The Compliance Ledger
    Stores the Duo-Agent reports (Claude + Gemini).
    """
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    flag_id = db.Column(db.Integer, db.ForeignKey('feature_flags.id'))
    env_name = db.Column(db.String(50))
    
    # 📊 Risk Metrics for the $10k Prize Dashboard
    risk_score = db.Column(db.Integer) # 1-10
    sustainability_score = db.Column(db.Integer) # 1-10 (For the Green Prize)
    blast_radius = db.Column(db.Integer) # Live user count from Redis at time of audit
    
    action = db.Column(db.String(100)) # e.g., 'AI_BLOCK', 'MANAGER_OVERRIDE'
    reason = db.Column(db.Text)
    
    # 🏗️ GitLab Pipeline State
    gitlab_pipeline_id = db.Column(db.String(100), nullable=True)
    is_resolved = db.Column(db.Boolean, default=False)
    
    ai_metadata = db.Column(JSONB, nullable=True) 
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    

class FlagEvaluation(db.Model):
    """
    📊 Real-time Traffic Telemetry
    Maps to the 'flag_evaluations' table. 
    Used by TrafficService to calculate the Blast Radius for Claude 3.5.
    """
    __tablename__ = 'flag_evaluations'
    id = db.Column(db.Integer, primary_key=True)
    flag_id = db.Column(db.Integer, db.ForeignKey('feature_flags.id'), nullable=False)
    env_name = db.Column(db.String(50), nullable=False) # 'Development', 'Staging', 'Production'
    
    # Telemetry Data
    request_count = db.Column(db.Integer, default=0)
    last_eval_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship back to the main Flag
    flag = db.relationship('FeatureFlag', backref=db.backref('evaluations', lazy=True))