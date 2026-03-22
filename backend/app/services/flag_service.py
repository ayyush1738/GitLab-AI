import logging
from datetime import datetime, timezone
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from app.models import db, FeatureFlag, Environment, FlagStatus, AuditLog, FlagEvaluation

logger = logging.getLogger(__name__)

class FlagService:

    @staticmethod
    def get_all_flags():
        """Retrieves all defined feature flags."""
        return FeatureFlag.query.all()

    @staticmethod
    def create_new_flag(data):
        """Creates a flag and initializes its status across all environments."""
        try:
            new_flag = FeatureFlag(
                name=data.name,
                key=data.key,
                description=data.description
            )
            db.session.add(new_flag)
            db.session.flush() 

            envs = Environment.query.all()
            for env in envs:
                status = FlagStatus(flag_id=new_flag.id, env_id=env.id, is_enabled=False)
                db.session.add(status)
            
            db.session.commit()
            return new_flag
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Persistence error during flag creation: {e}")
            raise

    @staticmethod
    def get_flag_status_by_key(key, env_name):
        """Helper for SDKs to check if a feature is enabled."""
        flag = FeatureFlag.query.filter_by(key=key).first()
        env = Environment.query.filter_by(name=env_name).first()
        if not flag or not env:
            return None
            
        status = FlagStatus.query.filter_by(flag_id=flag.id, env_id=env.id).first()
        return {"enabled": status.is_enabled if status else False}

    @staticmethod
    def toggle_status(flag_id, data, user):
        """
        The Core Governance Logic.
        Interceptors toggles, checks AI risk, and enforces Manager Overrides.
        """
        # ✅ DEFERRED IMPORT to prevent circular dependency
        from app.services.ai_agent import SafeConfigAgent
        from app.utils.helpers import get_blast_radius

        flag = FeatureFlag.query.get(flag_id)
        env = Environment.query.get(data.environment_id)
        
        if not flag or not env:
            return None, "Invalid Flag or Environment target."

        # 1. Fetch live Blast Radius from Redis for the AI to analyze
        current_traffic = get_blast_radius(flag.key)

        # 2. Trigger AI Audit for Production changes
        ai_report = None
        if env.name.lower() == "production":
            ai_report = SafeConfigAgent.run_audit(
                feature_key=flag.key,
                environment=env.name,
                code_diff="[Toggle Request]",
                description=f"Manual toggle requested via dashboard. Reason: {data.reason}"
            )
            
            # 3. ENFORCEMENT: If risk is high, only a Manager can proceed
            risk_score = ai_report.get('risk_score', 0)
            if risk_score >= 8 and user.role != 'manager':
                blocked_log = AuditLog(
                    flag_id=flag_id,
                    env_name=env.name,
                    action="AI_BLOCK",
                    reason=f"[SECURITY BLOCK] {data.reason}",
                    risk_score=risk_score,
                    blast_radius=current_traffic,
                    ai_metadata=ai_report
                )
                db.session.add(blocked_log)
                db.session.commit()
                return None, {"message": "High Risk: Manager override required.", "report": ai_report}

        # 4. Process the toggle if checks pass or if user is Manager
        try:
            status = FlagStatus.query.filter_by(flag_id=flag_id, env_id=data.environment_id).first()
            status.is_enabled = not status.is_enabled
            new_state = "ON" if status.is_enabled else "OFF"
            
            risk_val = ai_report.get('risk_score') if ai_report else 0
            log_action = f"MANAGER_OVERRIDE_{new_state}" if risk_val >= 8 else f"TOGGLE_{new_state}"

            success_log = AuditLog(
                flag_id=flag_id,
                env_name=env.name,
                action=log_action,
                reason=data.reason,
                risk_score=risk_val,
                blast_radius=current_traffic,
                ai_metadata=ai_report 
            )
            
            db.session.add(success_log)
            db.session.commit()
            return status, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Toggle transaction failed: {e}")
            return None, "Database transaction failed."

    @staticmethod
    def track_evaluation(key, env_name):
        """
        Hybrid Tracking: Increments Redis for speed, persists to DB for history.
        """
        from app import cache
        flag = FeatureFlag.query.filter_by(key=key).first()
        if not flag: return False
        
        # 🚀 Redis increment (The 'Grand Prize' Live Traffic Logic)
        if cache:
            cache.incr(f"traffic:{key}")
        
        # Persistent DB Hit (Background or Periodic is better, but this works for demo)
        hit = FlagEvaluation(flag_id=flag.id, environment_name=env_name)
        db.session.add(hit)
        db.session.commit()
        return True

    @staticmethod
    def get_audit_history():
        """Retrieves the compliance ledger for the dashboard."""
        return AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(30).all()