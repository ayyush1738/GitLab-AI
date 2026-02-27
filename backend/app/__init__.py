import os
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

def create_app():
    app = Flask(__name__)
    
    # 1. Configuration
    app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    # 2. OAuth Setup (GitHub Blueprint)
    # This automatically creates /login/github and /login/github/authorized
    github_bp = make_github_blueprint(
        client_id=os.getenv("GITHUB_ID"),
        client_secret=os.getenv("GITHUB_SECRET"),
        scope="user:email",
        # Custom storage links GitHub tokens to our local User models
        storage=SQLAlchemyStorage(
            OAuth, # We'll define this in models.py
            db.session,
            user=current_user
        )
    )
    
    # 3. Security & CORS
    CORS(app, supports_credentials=True)
    
    # 4. Initialize Plugins
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = "github.login" # Redirect to GitHub if unauthorized

    # 5. Register Blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.ai_routes import ai_bp
    from app.routes.flag_routes import flags_bp

    app.register_blueprint(github_bp, url_prefix="/login")
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(flags_bp, url_prefix="/api/flags")

    # 6. User Loader for Flask-Login
    @login_manager.user_loader
    def load_user(user_id):
        from app.models import User
        return User.query.get(int(user_id))

    return app

# Import models at bottom to avoid circular imports
from app.models import User, OAuth