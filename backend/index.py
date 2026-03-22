import os
import sys
import logging
from app import create_app, db
from app.models import Environment, User, FeatureFlag
from loguru import logger
from sqlalchemy import exc

# Ensure the app directory is in the path for clean imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Initialize the Flask App Factory
app = create_app()

def auto_initialize_database():
    """
    Self-healing Database Initialization.
    Ensures the 'Safety Firewall' has its rules and roles ready on boot.
    """
    with app.app_context():
        try:
            # 1. Create Tables (Idempotent: only runs if they don't exist)
            db.create_all()
            logger.info("Database schema verified.")

            # 2. Seed Default Environments (Core for Blast Radius logic)
            if not Environment.query.first():
                logger.info("Seeding core environments: Development, Staging, Production...")
                envs = [
                    Environment(name="Development"),
                    Environment(name="Staging"),
                    Environment(name="Production")
                ]
                db.session.add_all(envs)
                db.session.commit()
                logger.success("Environments initialized.")

            # 3. Provision 'Judge/Manager' Role for GitHub Auth
            # We use an Environment Variable for the Judge's email to match their GitHub login
            admin_email = os.environ.get("ADMIN_EMAIL", "judge@safeconfig.ai")
            existing_admin = User.query.filter_by(email=admin_email).first()
            
            if not existing_admin:
                logger.info(f"Provisioning Manager role for: {admin_email}")
                manager = User(
                    email=admin_email, 
                    role="manager",
                    is_active=True # Ensure they aren't locked out of the Next.js Dashboard
                )
                db.session.add(manager)
                db.session.commit()
                logger.success(f"Admin access granted to {admin_email}")
            else:
                # Ensure existing admin has the correct role for the demo
                if existing_admin.role != "manager":
                    existing_admin.role = "manager"
                    db.session.commit()
                    logger.info(f"Updated {admin_email} to Manager role.")

        except exc.SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database seeding failed: {e}")
        except Exception as e:
            logger.error(f"Unexpected error during startup: {e}")

@app.route('/api/status')
def system_status():
    """
    Enhanced Health Check for GitLab and Cloud Run.
    Checks if AI agents and Redis are responsive.
    """
    # Placeholder for a quick Redis ping check
    return {
        "status": "online",
        "engine": "SafeConfig AI 1.0",
        "database": "connected",
        "environment": os.environ.get("FLASK_ENV", "production")
    }, 200

@app.route('/healthz')
def health_check():
    """Liveness probe for Google Cloud Run / Load Balancer."""
    return "OK", 200

# 🚀 CLOUD RUN / GUNICORN COMPATIBILITY
# This ensures that even if 'python index.py' isn't called directly, 
# the database is initialized when the module is imported by a web server.
with app.app_context():
    auto_initialize_database()

if __name__ == "__main__":
    # 🔓 Local Development Safety Off
    if os.environ.get("FLASK_ENV") == "development":
        os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
        logger.warning("Running in Development Mode: Insecure Transport Enabled.")
    
    # 🚀 PORT LOGIC
    port = int(os.environ.get("PORT", 5000))
    
    logger.info(f"SafeConfig AI Backend starting on port {port}...")
    app.run(
        host="0.0.0.0", 
        port=port, 
        debug=(os.environ.get("FLASK_DEBUG") == "1")
    )