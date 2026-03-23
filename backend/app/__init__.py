import os
import redis
import logging
from flask import Flask, jsonify
from flask_login import current_user
from flask_cors import CORS
from flask_dance.contrib.gitlab import make_gitlab_blueprint
from flask_dance.consumer.storage.sqla import SQLAlchemyStorage
from flask_dance.consumer import oauth_authorized, oauth_error
from werkzeug.middleware.proxy_fix import ProxyFix
from dotenv import load_dotenv

# 🔗 Import singletons from extensions.py
from app.extensions import db, login_manager, migrate

load_dotenv()

# Global Redis instance for Jaipur Node Telemetry
cache = None

def create_app():
    global cache
    app = Flask(__name__)

    # ─────────────────────────────────────────────────────────────────────────
    # ENVIRONMENT DETECTION
    # Controls security toggles between local dev and Cloud Run production.
    # ─────────────────────────────────────────────────────────────────────────
    is_production = os.getenv("FLASK_ENV", "development") == "production"

    # ─────────────────────────────────────────────────────────────────────────
    # SECURITY FLIP: In production (Cloud Run + HTTPS), cookies MUST be Secure.
    # In development (HTTP + 127.0.0.1), Secure=False allows local testing.
    # OAUTHLIB_INSECURE_TRANSPORT is only set in development — production uses
    # HTTPS termination at the Cloud Run load balancer, so it must be unset.
    # ─────────────────────────────────────────────────────────────────────────
    if is_production:
        # Production: enforce HTTPS cookies, NEVER allow insecure OAuth transport
        os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "0"
        cookie_secure = True
    else:
        # Development: allow HTTP cookies and insecure OAuth over 127.0.0.1
        os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
        cookie_secure = False

    # 1. Base Configuration & Security
    app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")

    # ─────────────────────────────────────────────────────────────────────────
    # DYNAMIC CORS & COOKIE DOMAIN
    # ─────────────────────────────────────────────────────────────────────────
    base_url = os.getenv("BASE_URL", "http://127.0.0.1:5000")
    frontend_url = os.getenv("FRONTEND_URL", "http://127.0.0.1:3000")
    
    from urllib.parse import urlparse
    parsed_domain = urlparse(base_url).hostname

    app.config.update(
        # SESSION PERSISTENCE: Lax allows the cookie to travel on the GitLab
        # redirect (top-level navigation). Secure flips based on environment.
        SESSION_COOKIE_DOMAIN=parsed_domain,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=cookie_secure,
        SESSION_COOKIE_HTTPONLY=True,
        REMEMBER_COOKIE_SAMESITE="Lax",
        REMEMBER_COOKIE_SECURE=cookie_secure,
        PERMANENT_SESSION_LIFETIME=86400,
        SQLALCHEMY_DATABASE_URI=os.getenv("DATABASE_URL"),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SQLALCHEMY_ENGINE_OPTIONS={
            # Prevent Cloud SQL connection timeouts in long-idle Cloud Run instances
            "pool_pre_ping": True,
            "pool_recycle": 300,
        }
    )

    # ─────────────────────────────────────────────────────────────────────────
    # PROXY INTEGRITY: ProxyFix is mandatory for Cloud Run.
    # Google's Load Balancer terminates TLS and forwards requests as HTTP.
    # Without this, Flask sees http:// and generates http:// redirect URIs,
    # which breaks the GitLab OAuth callback (GitLab always redirects to https://).
    # x_proto=1 trusts the X-Forwarded-Proto header to reconstruct the scheme.
    # ─────────────────────────────────────────────────────────────────────────
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

    # 2. Bind Extensions
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)

    # (Already declared base_url and frontend_url earlier for the cookie domain)

    CORS(app,
         resources={r"/*": {
             "origins": [frontend_url]
         }},
         supports_credentials=True,
         allow_headers=["Content-Type", "X-SafeConfig-Source", "Authorization"],
         methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
         expose_headers=["Content-Type", "X-SafeConfig-Source"])

    # 3. Resilient Redis Initialization
    redis_url = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
    try:
        cache = redis.from_url(redis_url, decode_responses=True)
        cache.ping()
        logging.info("🚀 Redis Connected: Jaipur Node Telemetry active.")
    except Exception as e:
        logging.warning(f"⚠️ Redis unavailable: {e}. AI Blast Radius metrics disabled.")
        cache = None

    # 4. Import Models
    from app.models import User, OAuth

    # 5. GitLab OAuth Setup
    # ─────────────────────────────────────────────────────────────────────────
    # ANONYMOUS HANDSHAKE FIX: user_required=False lets Flask-Dance persist the
    # token to SQLAlchemy BEFORE login_user() is called. Without this, the
    # storage layer raises a ValueError because current_user is AnonymousUser.
    # ─────────────────────────────────────────────────────────────────────────
    storage = SQLAlchemyStorage(
        OAuth,
        db.session,
        user=current_user,
        user_required=False
    )

    # STRICT ALIGNMENT: Hardcoding redirect_url to 127.0.0.1 to absolutely
    # prevent the invalid_grant / localhost mismatch bug.
    gitlab_redirect_url = "http://127.0.0.1:5000/login/gitlab/authorized"

    gitlab_bp = make_gitlab_blueprint(
        client_id=os.getenv("GITLAB_ID"),
        client_secret=os.getenv("GITLAB_SECRET"),
        scope=["read_user", "openid", "profile", "email"],
        redirect_url=gitlab_redirect_url,
        storage=storage
    )

    # API TUNNEL FIX: Override default base_url so blueprint.session.get("/user")
    # hits https://gitlab.com/api/v4/user (JSON) instead of the HTML profile page.
    # Without this the response is text/html, causing JSONDecodeError.
    gitlab_bp.session.base_url = "https://gitlab.com/api/v4/"

    # ─────────────────────────────────────────────────────────────────────────
    # SIGNAL SCOPING FIX: Connect the authorized handler with sender=gitlab_bp.
    # This prevents the signal from firing for any other OAuth blueprints and
    # guarantees the handler runs AFTER base_url is set on the blueprint session.
    # ─────────────────────────────────────────────────────────────────────────
    from app.routes.auth_routes import gitlab_logged_in, gitlab_error_handler
    oauth_authorized.connect(gitlab_logged_in, sender=gitlab_bp)
    oauth_error.connect(gitlab_error_handler, sender=gitlab_bp)

    # 🛡️ API SECURITY: Return JSON 401 instead of a login-page redirect.
    # Prevents Next.js from receiving an HTML body it tries to JSON.parse().
    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({
            "logged_in": False,
            "message": "Shields Up: Authorization required."
        }), 401

    # 6. Blueprint Registration
    from app.routes.auth_routes import auth_bp
    from app.routes.ai_routes import ai_bp
    from app.routes.flag_routes import flags_bp

    app.register_blueprint(gitlab_bp, url_prefix="/login")
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(flags_bp, url_prefix="/api/flags")

    # 7. User Loader for Flask-Login
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    logging.info(f"🌍 SafeConfig AI initialized | env={'production' if is_production else 'development'}")
    logging.info(f"🔗 BASE_URL={base_url} | FRONTEND_URL={frontend_url}")
    logging.info(f"🔑 GitLab redirect URI: {gitlab_redirect_url}")

    return app