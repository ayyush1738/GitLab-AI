import os
from flask import Blueprint, redirect, url_for, flash, session, current_app
from flask_login import login_user, logout_user, login_required
from flask_dance.consumer import oauth_authorized
from sqlalchemy.orm.exc import NoResultFound

from app import db
from app.models import User, OAuth

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash("You have been logged out.")
    return redirect(url_for("health_check"))

# --- GITHUB OAUTH SIGNALS ---
# This "Signal" catches the moment GitHub authorizes the user.
# It handles both User creation and Session login in one go.

@oauth_authorized.connect
def github_logged_in(blueprint, token):
    if not token:
        flash("Failed to log in with GitHub.", category="error")
        return False

    # 1. Fetch user info from GitHub API using the current OAuth session
    resp = blueprint.session.get("/user")
    if not resp.ok:
        flash("Failed to fetch user info from GitHub.", category="error")
        return False
    
    github_info = resp.json()
    github_user_id = str(github_info["id"])
    github_login = github_info["login"] # e.g., "ayush-rathore"

    # 2. Check if this GitHub account is already linked to a User
    query = OAuth.query.filter_by(
        provider=blueprint.name,
        provider_user_id=github_user_id,
    )
    try:
        oauth = query.one()
    except NoResultFound:
        # 3. Create a new OAuth record if it doesn't exist
        oauth = OAuth(
            provider=blueprint.name,
            provider_user_id=github_user_id,
            token=token,
        )

    # 4. Handle Account Linking & Login
    if oauth.user:
        login_user(oauth.user)
        flash("Successfully signed in with GitHub.")
    else:
        # If the user is logged in, link this GitHub to their account
        # Otherwise, create a NEW local user for this GitHub identity
        email = github_info.get("email")
        user = User(
            email=email or f"{github_login}@github.com",
            role="developer" # Default role for new signups
        )
        
        oauth.user = user
        db.session.add_all([user, oauth])
        db.session.commit()
        login_user(user)
        flash("Successfully created account and signed in with GitHub.")

    # 5. Disable Flask-Dance's default token storage (we handled it manually)
    return False

# --- ERROR HANDLING ---
from flask_dance.consumer import oauth_error

@oauth_error.connect
def github_error(blueprint, error, error_description=None, error_uri=None):
    msg = f"OAuth error from {blueprint.name}! error={error} description={error_description}"
    flash(msg, category="error")