import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from app.models import db, FeatureFlag, Environment, FlagStatus, AuditLog, FlagEvaluation

# 🚀 DEFERRED IMPORT: 'SafeConfigAgent' is now imported inside methods 
# to prevent Circular Dependency 'ImportError'

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
                status = FlagStatus(feature_flag=new_flag, env=env, is_enabled=False)
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
    def audit_flag(flag_id, environment_id, reason):
        """Triggers the LangChain Agent for a pre-flight risk check."""
        # ✅ BREAK CIRCULAR DEPENDENCY HERE
        from app.services.ai_agent import SafeConfigAgent

        flag = FeatureFlag.query.get(flag_id)
        env = Environment.query.get(environment_id)

        if not flag or not env:
            return None, "Invalid Flag or Environment target."

        # Perform the Agentic Audit
        ai_report = SafeConfigAgent.run_audit(
            feature_key=flag.key,
            environment=env.name,
            code_diff="[Manual Audit Request]", 
            description=f"{reason} | Flag Desc: {flag.description}",
            traffic_context={} 
        )

        return ai_report, None

    @staticmethod
    def toggle_status(flag_id, data, user):
        """
        The Core Governance Logic.
        Intercepts toggles, checks AI risk, and enforces Role-Based Access Control.
        """
        # ✅ BREAK CIRCULAR DEPENDENCY HERE
        from app.services.ai_agent import SafeConfigAgent

        flag = FeatureFlag.query.get(flag_id)
        env = Environment.query.get(data.environment_id)
        
        if not flag or not env:
            return None, "Invalid Flag or Environment target."

        # 1. Trigger AI Audit for Production changes
        ai_report = None
        if env.name.lower() == "production":
            ai_report = SafeConfigAgent.run_audit(
                feature_key=flag.key,
                environment=env.name,
                code_diff="[Toggle Request]",
                description=data.reason,
                traffic_context={}
            )
            
            # 2. ENFORCEMENT: If risk is high, only a Manager can proceed
            risk_score = ai_report.get('risk_score', 0)
            if risk_score >= 8 and user.role != 'manager':
                blocked_log = AuditLog(
                    flag_id=flag_id,
                    env_name=env.name,
                    action="AI_BLOCK",
                    reason=f"[SECURITY BLOCK] {data.reason}",
                    ai_metadata=ai_report
                )
                db.session.add(blocked_log)
                db.session.commit()
                return None, {"message": "Blocked by AI Guardrail. Manager override required.", "report": ai_report}

        # 3. Process the toggle if checks pass
        try:
            status = FlagStatus.query.filter_by(flag_id=flag_id, env_id=data.environment_id).first()
            status.is_enabled = not status.is_enabled
            new_state = "ON" if status.is_enabled else "OFF"
            
            log_action = f"TOGGLE_{new_state}"
            if ai_report and ai_report.get('risk_score', 0) >= 8:
                log_action = f"MANAGER_OVERRIDE_{new_state}"

            success_log = AuditLog(
                flag_id=flag_id,
                env_name=env.name,
                action=log_action,
                reason=data.reason,
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
        """Records a real-world user hit for Blast Radius calculation."""
        flag = FeatureFlag.query.filter_by(key=key).first()
        if not flag: return False
        
        hit = FlagEvaluation(flag_id=flag.id, environment_name=env_name)
        db.session.add(hit)
        db.session.commit()
        return True

    @staticmethod
    def get_traffic_stats():
        """Aggregates hits per flag for the dashboard."""
        return db.session.query(
            FeatureFlag.key, 
            func.count(FlagEvaluation.id).label('hit_count')
        ).join(FlagEvaluation, FeatureFlag.id == FlagEvaluation.flag_id).group_by(FeatureFlag.key).all()

    @staticmethod
    def get_audit_history():
        """Retrieves the last 30 log entries for the audit trail."""
        return AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(30).all()