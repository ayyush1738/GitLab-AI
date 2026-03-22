import os
import redis
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, current_user
from flask_cors import CORS
from flask_dance.contrib.github import make_github_blueprint
from flask_dance.consumer.storage.sqla import SQLAlchemyStorage
from werkzeug.middleware.proxy_fix import ProxyFix
from dotenv import load_dotenv

# Initialize Extensions
load_dotenv()
db = SQLAlchemy()
login_manager = LoginManager()

# Global Redis instance (Initialized with a connection pool for stability)
cache = None

def create_app():
    global cache
    app = Flask(__name__)
    
    # 🚀 CLOUD RUN FIX: Handle HTTPS redirects behind Google's Proxy
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)
    
    # 1. Core Configuration
    app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    # 2. Resilient Redis Initialization
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    try:
        # Use a connection pool to prevent 'Connection Closed' errors during spikes
        pool = redis.ConnectionPool.from_url(redis_url, decode_responses=True)
        cache = redis.Redis(connection_pool=pool)
        cache.ping() 
    except Exception as e:
        logging.error(f"⚠️ Redis unavailable: {e}. AI Blast Radius will default to 0.")
        cache = None # Routes must handle 'if cache:' checks

    # 3. Import Models
    from app.models import User, OAuth

    # 4. GitHub OAuth Setup
    # Note: storage is initialized but user link happens in auth_routes.py signals
    github_bp = make_github_blueprint(
        client_id=os.getenv("GITHUB_ID"),
        client_secret=os.getenv("GITHUB_SECRET"),
        scope="user:email",
        storage=SQLAlchemyStorage(OAuth, db.session, user=current_user)
    )
    
    # 5. Security & Infrastructure
    # CORS must allow the Next.js frontend origin
    CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = "github.login" # Redirect to GitHub login by default

    # 6. Blueprint Registration
    from app.routes.auth_routes import auth_bp
    from app.routes.ai_routes import ai_bp
    from app.routes.flag_routes import flags_bp

    app.register_blueprint(github_bp, url_prefix="/login")
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(flags_bp, url_prefix="/api/flags")

    # 7. User Loader
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    return app