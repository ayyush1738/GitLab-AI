import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from app.extensions import db
from app.models import FlagEvaluation, FeatureFlag
from loguru import logger

class TrafficService:
    """
    Observability Layer: Correlates real-world traffic data 
    with AI risk assessments for the 'Safety Firewall'.
    """

    @staticmethod
    def get_live_traffic(feature_key: str) -> int:
        """
        🚀 Simple Wrapper for the AI Agent.
        Returns the most current 24h hit count for a specific feature.
        """
        context = TrafficService.get_live_traffic_context(feature_key)
        return context.get("hits_24h", 0)

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

            # 🚀 PRO-TIP: Check Jaipur Node Redis first for "Hot" data
            from app import cache
            redis_hits = 0
            if cache:
                try:
                    val = cache.get(f"traffic:{feature_key}")
                    redis_hits = int(val) if val else 0
                except (ValueError, TypeError):
                    redis_hits = 0

            # 2. Set time window (Last 24 Hours)
            time_threshold = datetime.now(timezone.utc) - timedelta(hours=24)

            # 3. Query hit counts from DB (Synced with models.py columns)
            hits_24h_db = db.session.query(func.sum(FlagEvaluation.request_count)).filter(
                FlagEvaluation.flag_id == flag.id,
                FlagEvaluation.env_name == environment,
                FlagEvaluation.last_eval_at >= time_threshold
            ).scalar() or 0

            total_hits_db = db.session.query(func.sum(FlagEvaluation.request_count)).filter(
                FlagEvaluation.flag_id == flag.id,
                FlagEvaluation.env_name == environment
            ).scalar() or 0

            # 4. Contextualize for the AI
            # Combining DB history with Redis real-time spikes for accuracy
            final_hits_24h = max(int(hits_24h_db), redis_hits)

            context = {
                "hits_24h": final_hits_24h,
                "total_hits": int(total_hits_db),
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
            func.sum(FlagEvaluation.request_count).label('hit_count')
        ).join(
            FlagEvaluation, 
            FeatureFlag.id == FlagEvaluation.flag_id
        ).group_by(
            FeatureFlag.key
        ).all()
        
        return [{"key": s.key, "hits": int(s.hit_count or 0)} for s in stats]

    @staticmethod
    def cleanup_old_metrics(days: int = 7):
        """
        Maintenance: Removes metrics older than X days.
        Optimized for the 'Sustainable Design' prize to minimize DB bloat.
        """
        try:
            cutoff = datetime.now(timezone.utc) - timedelta(days=days)
            deleted = FlagEvaluation.query.filter(FlagEvaluation.last_eval_at < cutoff).delete()
            db.session.commit()
            logger.info(f"Sustainability Task: Purged {deleted} old traffic records.")
            return deleted
        except Exception as e:
            db.session.rollback()
            logger.error(f"Metric cleanup failed: {e}")
            return 0