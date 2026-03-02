import os
from flask import Blueprint, redirect, url_for, flash, session, current_app, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from flask_dance.consumer import oauth_authorized, oauth_error
from sqlalchemy.orm.exc import NoResultFound

from app import db
from app.models import User, OAuth

auth_bp = Blueprint("auth", __name__)

# --- LOGIN & LOGOUT ROUTES ---

@auth_bp.route("/login")
def login():
    """
    Trigger Route: Redirects the user to GitHub for authentication.
    The 'github' name refers to the blueprint registered in __init__.py.
    """
    return redirect(url_for("github.login"))

@auth_bp.route("/logout")
@login_required
def logout():
    """
    Ends the local session and clears the login cookie.
    FIX: Points to auth.login or a home route to avoid BuildErrors.
    """
    logout_user()
    flash("You have been logged out.")
    # If you have a landing page, use that; otherwise, redirect to login
    return redirect(url_for("auth.login"))

@auth_bp.route("/me")
def get_current_user():
    """
    Identity Endpoint: Essential for the React Frontend to 
    verify user state and roles (Developer vs Manager).
    """
    if current_user.is_authenticated:
        return jsonify({
            "logged_in": True,
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "role": current_user.role
            }
        }), 200
    return jsonify({"logged_in": False}), 401

# --- GITHUB OAUTH SIGNALS ---

@oauth_authorized.connect
def github_logged_in(blueprint, token):
    """
    The Handshake: Catches the OAuth token from GitHub and syncs it 
    with our local PostgreSQL User table.
    """
    if not token:
        flash("Failed to log in with GitHub.", category="error")
        return False

    # 1. Fetch user info from GitHub API
    resp = blueprint.session.get("/user")
    if not resp.ok:
        flash("Failed to fetch user info from GitHub.", category="error")
        return False
    
    github_info = resp.json()
    github_user_id = str(github_info["id"])
    github_login = github_info["login"]

    # 2. Check for existing link in the OAuth table
    query = OAuth.query.filter_by(
        provider=blueprint.name,
        provider_user_id=github_user_id,
    )
    try:
        oauth = query.one()
    except NoResultFound:
        oauth = OAuth(
            provider=blueprint.name,
            provider_user_id=github_user_id,
            token=token,
        )

    # 3. Handle Account Linking or Creation
    if oauth.user:
        login_user(oauth.user)
    else:
        # Fallback for email if GitHub profile is private
        email = github_info.get("email")
        
        # 🚀 SECURITY GATEKEEPER:
        # Default role is 'developer'. Promotion to 'manager' 
        # happens via DB seeding or manual admin action.
        user = User(
            email=email or f"{github_login}@github.com",
            role="developer" 
        )
        
        oauth.user = user
        db.session.add_all([user, oauth])
        db.session.commit()
        login_user(user)
        flash("Account created via GitHub.")

    # 4. Disable Flask-Dance's default storage to use our manual logic
    return False

@oauth_error.connect
def github_error(blueprint, error, error_description=None, error_uri=None):
    msg = f"OAuth error from {blueprint.name}! description={error_description}"
    flash(msg, category="error")