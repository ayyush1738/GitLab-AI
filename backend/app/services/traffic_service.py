import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from app.models import db, FlagEvaluation, FeatureFlag

logger = logging.getLogger(__name__)

class TrafficService:
    """
    Observability Layer: Correlates real-world traffic data 
    with AI risk assessments.
    """

    @staticmethod
    def get_live_traffic_context(feature_key: str, environment: str = "Production") -> dict:
        """
        Calculates the 'Blast Radius' for the AI Agent.
        Returns hit counts for the last 24 hours and total historical hits.
        """
        try:
            # 1. Find the flag
            flag = FeatureFlag.query.filter_by(key=feature_key).first()
            if not flag:
                logger.warning(f"Traffic lookup failed: Flag key '{feature_key}' not found.")
                return {"hits_24h": 0, "total_hits": 0, "status": "no_data"}

            # 2. Set time window (Last 24 Hours)
            time_threshold = datetime.now(timezone.utc) - timedelta(hours=24)

            # 3. Query hit counts
            hits_24h = db.session.query(func.count(FlagEvaluation.id)).filter(
                FlagEvaluation.flag_id == flag.id,
                FlagEvaluation.environment_name == environment.capitalize(),
                FlagEvaluation.timestamp >= time_threshold
            ).scalar() or 0

            total_hits = db.session.query(func.count(FlagEvaluation.id)).filter(
                FlagEvaluation.flag_id == flag.id,
                FlagEvaluation.environment_name == environment.capitalize()
            ).scalar() or 0

            # 4. Contextualize for the AI
            # High traffic (e.g. > 1000) will trigger higher risk scores in ai_agent.py
            context = {
                "hits_24h": hits_24h,
                "total_hits": total_hits,
                "environment": environment,
                "intensity": "high" if hits_24h > 1000 else "low",
                "status": "active" if hits_24h > 0 else "dormant"
            }

            logger.info(f"Traffic Context for {feature_key}: {hits_24h} hits/24h.")
            return context

        except Exception as e:
            logger.error(f"Traffic Service Query Error: {e}")
            return {"hits_24h": 0, "total_hits": 0, "status": "error"}

    @staticmethod
    def get_global_traffic_distribution() -> list:
        """
        Aggregates traffic across all features for the Dashboard.
        Used to identify 'Hotspots' in the architecture.
        """
        stats = db.session.query(
            FeatureFlag.key, 
            func.count(FlagEvaluation.id).label('hit_count')
        ).join(
            FlagEvaluation, 
            FeatureFlag.id == FlagEvaluation.flag_id
        ).group_by(
            FeatureFlag.key
        ).all()
        
        return [{"key": s.key, "hits": s.hit_count} for s in stats]

    @staticmethod
    def cleanup_old_metrics(days: int = 30):
        """
        Maintenance: Removes metrics older than X days to keep DB fast.
        Important for 'Sustainable Design' prize ($3,000 bonus).
        """
        try:
            cutoff = datetime.now(timezone.utc) - timedelta(days=days)
            deleted = db.session.query(FlagEvaluation).filter(
                FlagEvaluation.timestamp < cutoff
            ).delete()
            db.session.commit()
            logger.info(f"Sustainability Task: Purged {deleted} old traffic records.")
        except Exception as e:
            db.session.rollback()
            logger.error(f"Metric cleanup failed: {e}")