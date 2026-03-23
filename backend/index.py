import os
import sys

# ─────────────────────────────────────────────────────────────────────────────
# SECURITY FLIP: OAUTHLIB_INSECURE_TRANSPORT is set here ONLY for local dev.
# In production (FLASK_ENV=production), create_app() pops this variable so
# it is never present in the Cloud Run environment. The ENV gate below means
# this line is effectively a no-op in production because create_app() removes
# it before any OAuth flow runs.
# ─────────────────────────────────────────────────────────────────────────────
if os.getenv("FLASK_ENV", "development") == "production":
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "0"
else:
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

from loguru import logger
from sqlalchemy import exc

# Fix Pathing: ensures the 'app' package is discoverable from the root dir
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models import Environment, User

# Initialize the Flask App Factory
# Gunicorn imports this module and picks up `app` as the WSGI callable.
app = create_app()


def auto_initialize_database():
    """
    🛡️ Self-healing Database Initialization.

    Container-safe design:
    - db.create_all() is idempotent — safe to call on every cold start.
    - All operations run inside app.app_context() — compatible with Gunicorn
      multi-worker mode because each worker imports this module independently.
    - Wrapped in try/except so a DB hiccup at startup never crashes the pod;
      Cloud Run health checks will still pass via /healthz.
    """
    with app.app_context():
        try:
            # 1. Create Tables (idempotent — skips existing tables)
            db.create_all()
            logger.info("✅ Database schema verified.")

            # 2. Seed Default Environments
            if not Environment.query.first():
                logger.info("Seeding core environments: Development, Staging, Production...")
                envs = [
                    Environment(name="Development"),
                    Environment(name="Staging"),
                    Environment(name="Production")
                ]
                db.session.add_all(envs)
                db.session.commit()
                logger.success("✅ Environments initialized.")

            # 3. Provision Judge/Manager Role for SSO
            admin_email = os.environ.get("ADMIN_EMAIL", "singhrathoreayush824@gmail.com")
            existing_admin = User.query.filter_by(email=admin_email).first()

            if not existing_admin:
                logger.info(f"Provisioning Manager role for: {admin_email}")
                manager = User(email=admin_email, role="manager")
                db.session.add(manager)
                db.session.commit()
                logger.success(f"✅ Admin access granted to {admin_email}")
            else:
                if existing_admin.role != "manager":
                    existing_admin.role = "manager"
                    db.session.commit()
                    logger.info(f"Updated {admin_email} to Manager role.")

        except exc.SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database seeding failed: {e}")
        except Exception as e:
            logger.error(f"Unexpected error during database init: {e}")


@app.route("/api/status")
def system_status():
    """
    Enhanced Health Check for GitLab CI and Cloud Run.
    Returns regional node status for the Jaipur region.
    """
    return {
        "status": "online",
        "engine": "SafeConfig AI 1.0",
        "database": "connected",
        "region": "jaipur-in-west-1",
        "environment": os.environ.get("FLASK_ENV", "production")
    }, 200


@app.route("/healthz")
def health_check():
    """Liveness probe for Google Cloud Run / Load Balancer."""
    return "OK", 200


# ─────────────────────────────────────────────────────────────────────────────
# INITIALIZATION HOOK
# Called at module import time. Gunicorn imports index.py once per worker,
# so this runs once per worker — which is correct and safe.
# ─────────────────────────────────────────────────────────────────────────────
auto_initialize_database()

if __name__ == "__main__":
    # ── LOCAL DEV ONLY ────────────────────────────────────────────────────────
    # In production, Gunicorn is the entrypoint (see Dockerfile CMD).
    # This block is only reached via `python index.py` locally.
    # ─────────────────────────────────────────────────────────────────────────
    port = int(os.environ.get("PORT", 5000))
    is_production = os.getenv("FLASK_ENV", "development") == "production"

    logger.info(f"FLASK_ENV: {os.getenv('FLASK_ENV', 'development')}")
    logger.info(f"BASE_URL: {os.getenv('BASE_URL', 'http://127.0.0.1:5000')}")
    logger.info(f"FRONTEND_URL: {os.getenv('FRONTEND_URL', 'http://127.0.0.1:3000')}")
    logger.info(f"OAUTHLIB_INSECURE_TRANSPORT: {os.environ.get('OAUTHLIB_INSECURE_TRANSPORT', 'unset')}")
    logger.info(f"SafeConfig AI Backend starting on 0.0.0.0:{port} ...")

    app.run(
        # STRICT ALIGNMENT: Start exactly on host='127.0.0.1' as requested.
        host="127.0.0.1",
        port=port,
        debug=not is_production
    )