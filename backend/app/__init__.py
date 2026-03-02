import os
import redis
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, current_user
from flask_cors import CORS
from flask_dance.contrib.github import make_github_blueprint
from flask_dance.consumer.storage.sqla import SQLAlchemyStorage
from dotenv import load_dotenv

# Initialize Extensions
load_dotenv()
db = SQLAlchemy()
login_manager = LoginManager()

# 🚀 REDIS CLOUD CONFIGURATION
# Initialized globally for access across routes (e.g., Blast Radius tracking)
cache = None

def create_app():
    global cache
    app = Flask(__name__)
    
    # 1. Core Configuration
    app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    # 2. Redis Initialization
    # Critical for the AI Agent's stateless tracking
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    try:
        cache = redis.from_url(redis_url, decode_responses=True)
        cache.ping() # Verify connection
    except Exception as e:
        print(f"⚠️ Redis connection failed: {e}. Falling back to limited functionality.")

    # 3. Import Models inside factory to prevent circular imports
    from app.models import User, OAuth

    # 4. OAuth Setup (GitHub Blueprint)
    # Links GitHub tokens to local PostgreSQL models
    github_bp = make_github_blueprint(
        client_id=os.getenv("GITHUB_ID"),
        client_secret=os.getenv("GITHUB_SECRET"),
        scope="user:email",
        storage=SQLAlchemyStorage(
            OAuth, 
            db.session,
            user=current_user
        )
    )
    
    # 5. Security & Infrastructure
    CORS(app, supports_credentials=True)
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"

    # 6. Blueprint Registration
    # Order matters: Services must be importable before blueprints load
    from app.routes.auth_routes import auth_bp
    from app.routes.ai_routes import ai_bp
    from app.routes.flag_routes import flags_bp

    app.register_blueprint(github_bp, url_prefix="/login")
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(flags_bp, url_prefix="/api/flags")

    # 7. User Loader for Flask-Login
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    return app