import os
from flask import Blueprint, redirect, url_for, flash, session, current_app, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from flask_dance.consumer import oauth_authorized, oauth_error
from sqlalchemy.orm.exc import NoResultFound
from loguru import logger

from app import db
from app.models import User, OAuth

auth_bp = Blueprint("auth", __name__)

# --- IDENTITY ENDPOINTS ---

@auth_bp.route("/me")
def get_current_user():
    """
    Identity Endpoint: Essential for the Next.js Frontend to 
    verify user state and roles (Developer vs Manager).
    """
    if current_user.is_authenticated:
        return jsonify({
            "logged_in": True,
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "role": current_user.role,
                "username": getattr(current_user, 'username', None)
            }
        }), 200
    return jsonify({"logged_in": False}), 401

@auth_bp.route("/logout")
@login_required
def logout():
    """Ends the local session."""
    logout_user()
    return jsonify({"success": True, "message": "Logged out successfully"}), 200

# --- GITHUB OAUTH SIGNALS ---

@oauth_authorized.connect
def github_logged_in(blueprint, token):
    """
    The Handshake: Syncs GitHub tokens with local PostgreSQL users.
    Implements the 'Automatic Manager' promotion for the hackathon judge.
    """
    if not token:
        logger.error("OAuth failed: No token received.")
        return False

    # 1. Fetch GitHub Profile
    resp = blueprint.session.get("/user")
    if not resp.ok:
        logger.error(f"GitHub API Error: {resp.status_code}")
        return False
    
    github_info = resp.json()
    github_user_id = str(github_info["id"])
    github_login = github_info["login"]
    github_email = github_info.get("email")

    # 2. Match or Create OAuth Link
    query = OAuth.query.filter_by(
        provider=blueprint.name,
        provider_user_id=github_user_id,
    )
    try:
        oauth = query.one()
        logger.info(f"Existing user found: {github_login}")
    except NoResultFound:
        oauth = OAuth(
            provider=blueprint.name,
            provider_user_id=github_user_id,
            token=token,
        )

    # 3. Handle User Logic & Role Assignment
    if oauth.user:
        login_user(oauth.user)
    else:
        # Check if this user should be a Manager (Matches our index.py seeding)
        admin_email = os.environ.get("ADMIN_EMAIL", "judge@safeconfig.ai")
        is_admin = (github_email == admin_email)
        
        # Check if a user with this email already exists (seeded via index.py)
        user = User.query.filter_by(email=github_email).first()
        
        if not user:
            logger.info(f"Creating new user record for {github_login}")
            user = User(
                email=github_email or f"{github_login}@github.com",
                username=github_login,
                role="manager" if is_admin else "developer"
            )
        else:
            # Update existing seeded user with GitHub details
            user.username = github_login
            if is_admin:
                user.role = "manager"

        oauth.user = user
        db.session.add_all([user, oauth])
        db.session.commit()
        login_user(user)
        logger.success(f"User {github_login} linked with role: {user.role}")

    # Return False to tell Flask-Dance we handled the login/session manually
    return False

@oauth_error.connect
def github_error(blueprint, error, error_description=None, **kwargs):
    logger.error(f"OAuth Error from {blueprint.name}: {error_description}")
    return False