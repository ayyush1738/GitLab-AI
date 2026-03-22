import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from app.models import db, FlagEvaluation, FeatureFlag
from loguru import logger

class TrafficService:
    """
    Observability Layer: Correlates real-world traffic data 
    with AI risk assessments for the 'Safety Firewall'.
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

            # 🚀 PRO-TIP: Check Redis first for the absolute latest "Hot" data
            from app import cache
            redis_hits = 0
            if cache:
                redis_hits = int(cache.get(f"traffic:{feature_key}") or 0)

            # 2. Set time window (Last 24 Hours)
            time_threshold = datetime.now(timezone.utc) - timedelta(hours=24)

            # 3. Query hit counts from DB
            hits_24h_db = db.session.query(func.count(FlagEvaluation.id)).filter(
                FlagEvaluation.flag_id == flag.id,
                FlagEvaluation.environment_name == environment.capitalize(),
                FlagEvaluation.timestamp >= time_threshold
            ).scalar() or 0

            total_hits = db.session.query(func.count(FlagEvaluation.id)).filter(
                FlagEvaluation.flag_id == flag.id,
                FlagEvaluation.environment_name == environment.capitalize()
            ).scalar() or 0

            # 4. Contextualize for the AI
            # We combine DB history with Redis real-time spikes for the most accurate Blast Radius
            final_hits_24h = max(hits_24h_db, redis_hits)

            context = {
                "hits_24h": final_hits_24h,
                "total_hits": total_hits,
                "environment": environment,
                "intensity": "high" if final_hits_24h > 1000 else "low",
                "status": "active" if final_hits_24h > 0 else "dormant"
            }

            logger.info(f"Blast Radius for {feature_key}: {final_hits_24h} hits (Source: Hybrid)")
            return context

        except Exception as e:
            logger.error(f"Traffic Service Query Error: {e}")
            return {"hits_24h": 0, "total_hits": 0, "status": "error"}

    @staticmethod
    def get_global_traffic_distribution() -> list:
        """
        Aggregates traffic across all features for the Next.js Dashboard.
        Identifies 'High-Risk Hotspots' in the architecture.
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
    def cleanup_old_metrics(days: int = 7):
        """
        Maintenance: Removes metrics older than X days.
        Optimized to 7 days for the 'Sustainable Design' prize to minimize DB bloat.
        """
        try:
            cutoff = datetime.now(timezone.utc) - timedelta(days=days)
            deleted = FlagEvaluation.query.filter(FlagEvaluation.timestamp < cutoff).delete()
            db.session.commit()
            logger.info(f"Sustainability Task: Purged {deleted} old traffic records.")
            return deleted
        except Exception as e:
            db.session.rollback()
            logger.error(f"Metric cleanup failed: {e}")
            return 0