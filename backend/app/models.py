from app.extensions import db
from datetime import datetime, timezone
from flask_login import UserMixin
from sqlalchemy.dialects.postgresql import JSONB

class User(db.Model, UserMixin):
    """
    👤 User Identity & Role Management
    Supports Developer vs Manager roles for the Safety Firewall.
    """
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(100), unique=True, nullable=True) # For GitLab/GitHub SSO
    role = db.Column(db.String(20), default='developer', nullable=False) 
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship to OAuth tokens
    tokens = db.relationship("OAuth", backref="user", cascade="all, delete-orphan")

class OAuth(db.Model):
    """
    🔑 SSO Handshake Storage
    Stores encrypted tokens from GitLab/GitHub.
    """
    __tablename__ = 'oauth'
    id = db.Column(db.Integer, primary_key=True)
    provider = db.Column(db.String(50), nullable=False)
    provider_user_id = db.Column(db.String(256), unique=True, nullable=False)
    token = db.Column(JSONB, nullable=False)
    # ANONYMOUS HANDSHAKE: nullable=True allows Flask-Dance to write the token
    # row before login_user() has associated a User. The signal handler in
    # auth_routes.py then links oauth.user = user and commits in one transaction.
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

class Environment(db.Model):
    """
    🌍 Deployment Environment Targets
    Required for granular 'Blast Radius' logic (Dev vs Prod).
    """
    __tablename__ = 'environments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    
    # Backref provides 'statuses' to Environment instances
    statuses = db.relationship('FlagStatus', backref='environment', lazy=True)

class FeatureFlag(db.Model):
    """
    🚩 Core Feature Flag Definition
    The central point for all governance and status checks.
    """
    __tablename__ = 'feature_flags'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    key = db.Column(db.String(50), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    
    # 🏗️ GitLab Integration: Track which MR last modified this flag
    last_mr_id = db.Column(db.String(50), nullable=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    statuses = db.relationship('FlagStatus', backref='feature_flag', lazy=True, cascade="all, delete-orphan")

class FlagStatus(db.Model):
    """
    ⚡ Flag State Matrix
    Maps specific Flag IDs to specific Environments.
    """
    __tablename__ = 'flag_statuses'
    id = db.Column(db.Integer, primary_key=True)
    flag_id = db.Column(db.Integer, db.ForeignKey('feature_flags.id'), nullable=False)
    environment_id = db.Column(db.Integer, db.ForeignKey('environments.id'), nullable=False)
    is_enabled = db.Column(db.Boolean, default=False, nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class AuditLog(db.Model):
    """
    🛡️ AI Governance Ledger
    The 'Evidence' table for the judges showing how AI blocked high-risk changes.
    """
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    flag_id = db.Column(db.Integer, db.ForeignKey('feature_flags.id'))
    env_name = db.Column(db.String(50))
    
    # 📊 Prize Analytics
    risk_score = db.Column(db.Integer) 
    sustainability_score = db.Column(db.Integer) # 🌱 $3,000 Green Prize Entry
    blast_radius = db.Column(db.Integer) # Snapshot of traffic from Redis
    
    action = db.Column(db.String(100)) # 'AI_BLOCK', 'MANAGER_OVERRIDE'
    reason = db.Column(db.Text)
    
    # 🏗️ Pipeline Gates
    gitlab_pipeline_id = db.Column(db.String(100), nullable=True)
    is_resolved = db.Column(db.Boolean, default=False)
    
    ai_metadata = db.Column(JSONB, nullable=True) # Full JSON response from Claude/Gemini
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

class FlagEvaluation(db.Model):
    """
    📈 Live Telemetry Hub
    Syncs with Redis to provide Claude 3.5 with real-time risk data.
    """
    __tablename__ = 'flag_evaluations'
    id = db.Column(db.Integer, primary_key=True)
    flag_id = db.Column(db.Integer, db.ForeignKey('feature_flags.id'), nullable=False)
    env_name = db.Column(db.String(50), nullable=False)
    
    request_count = db.Column(db.Integer, default=0)
    last_eval_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Reverse relationship to the Flag
    flag = db.relationship('FeatureFlag', backref=db.backref('evaluations', lazy=True))