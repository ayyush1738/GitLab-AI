import os
import logging
from app import create_app, db
from app.models import Environment, User
from loguru import logger

# Initialize the Flask App Factory
app = create_app()

def seed_database_internal():
    """
    Initializes the system with default environments and 
    a default manager for the judging period.
    """
    try:
        # 1. Create Default Environments
        if not Environment.query.first():
            logger.info("Initializing core environments: Dev, Staging, Production...")
            envs = [
                Environment(name="Development"),
                Environment(name="Staging"),
                Environment(name="Production")
            ]
            db.session.add_all(envs)
            db.session.commit()
            logger.success("Environments initialized.")

        # 2. Create a Default Manager for Judges
        # This allows judges to test the 'Manager Override' feature immediately.
        if not User.query.filter_by(role="manager").first():
            logger.info("Provisioning default manager account...")
            manager = User(
                email="judge@safeconfig.ai", 
                role="manager"
            )
            db.session.add(manager)
            db.session.commit()
            logger.success("Judge account provisioned: judge@safeconfig.ai")
            
    except Exception as e:
        db.session.rollback()
        logger.error(f"Database seeding failed: {e}")

@app.route('/api/setup-db')
def setup_db():
    """
    Emergency/Setup Route:
    Synchronizes the database schema and applies default seeds.
    """
    try:
        with app.app_context():
            # Creates tables if they don't exist
            db.create_all()
            seed_database_internal()
        return {
            "status": "success", 
            "message": "SafeConfig Schema and Seeds applied successfully."
        }, 200
    except Exception as e:
        logger.error(f"Setup-db endpoint failed: {e}")
        return {"status": "error", "message": str(e)}, 500

# Entry point for local development and Cloud Run
if __name__ == "__main__":
    # Local development settings
    # OAUTHLIB_INSECURE_TRANSPORT allows OAuth over HTTP (Local only)
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
    
    # 🚀 CLOUD RUN OPTIMIZATION:
    # Google Cloud Run injects the PORT environment variable.
    # We default to 5000 for local dev but must use os.environ for the cloud.
    port = int(os.environ.get("PORT", 5000))
    
    logger.info(f"SafeConfig AI Backend starting on port {port}...")
    app.run(
        host="0.0.0.0", 
        port=port, 
        debug=True
    )