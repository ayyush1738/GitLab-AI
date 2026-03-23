import os
from flask import Blueprint, redirect, url_for, session, jsonify, current_app
from flask_login import login_user, logout_user, login_required, current_user
from sqlalchemy.orm.exc import NoResultFound
from loguru import logger
from oauthlib.oauth2.rfc6749.errors import InvalidGrantError

# 🔗 Singleton imports
from app.extensions import db
from app.models import User, OAuth

auth_bp = Blueprint("auth", __name__)

# --- IDENTITY ENDPOINTS ---

@auth_bp.route("/me")
def get_current_user():
    """
    Identity Endpoint: Essential for Next.js hydration.
    The Next.js withCredentials: true client calls this after redirect
    to determine if the session cookie was delivered successfully.
    """
    if current_user.is_authenticated:
        # ── SESSION PERSISTENCE FIX ──
        # Verify the user actually exists in the DB. Sometimes the session cookie
        # outlives the database record, causing silent failures.
        user = User.query.get(current_user.id)
        if user:
            return jsonify({
                "logged_in": True,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role,
                    "username": getattr(user, 'username', None)
                }
            }), 200
        else:
            # If the session says authenticated but no DB record exists, force logout.
            logout_user()
    return jsonify({"logged_in": False}), 401

@auth_bp.route("/logout")
@login_required
def logout():
    """Ends the local session."""
    logout_user()
    return jsonify({"success": True, "message": "Logged out successfully"}), 200


# ─────────────────────────────────────────────────────────────────────────────
# GITLAB OAUTH SIGNAL HANDLERS
#
# These are plain functions — NOT decorated with @oauth_authorized.connect.
# The connection is established in create_app() using:
#
#     oauth_authorized.connect(gitlab_logged_in, sender=gitlab_bp)
#
# This is the CORRECT pattern because:
#   1. It scopes the handler to only the gitlab blueprint (not all blueprints).
#   2. It guarantees the connection happens AFTER gitlab_bp is fully built,
#      meaning gitlab_bp.session.base_url is already set to the API endpoint.
# ─────────────────────────────────────────────────────────────────────────────

def gitlab_logged_in(blueprint, token):
    """
    The Handshake: Syncs GitLab tokens with local PostgreSQL users.

    Called by the oauth_authorized signal ONLY for the GitLab blueprint.
    Returns a redirect Response so Flask-Dance uses our redirect instead of
    its default. Returning False would suppress token storage entirely.
    """
    if not token:
        logger.error("OAuth failed: No token received from GitLab.")
        return False

    # ── Step 1: Fetch GitLab Profile via API ─────────────────────────────────
    # STRICT ALIGNMENT: Using blueprint.session.get('user') exactly as requested.
    # Because we omit the leading slash, urljoin correctly appends 'user' to
    # the 'https://gitlab.com/api/v4/' base_url defined in __init__.py.
    resp = blueprint.session.get("user")

    if not resp.ok:
        logger.error(f"GitLab API Error: HTTP {resp.status_code}")
        logger.error(f"Response body: {resp.text[:500]}")
        return False

    try:
        gitlab_info = resp.json()
    except Exception as e:
        logger.error(f"Critical: Failed to decode GitLab JSON. Error: {e}")
        logger.error(f"Raw body: {resp.text[:500]}")
        return False

    gitlab_user_id = str(gitlab_info.get("id"))
    gitlab_username = gitlab_info.get("username")
    gitlab_email = gitlab_info.get("email")

    if not gitlab_user_id:
        logger.error("GitLab response missing 'id' field.")
        return False

    # ── Step 2: Match or Create OAuth Link ───────────────────────────────────
    query = OAuth.query.filter_by(
        provider=blueprint.name,
        provider_user_id=gitlab_user_id,
    )

    try:
        oauth = query.one()
        logger.info(f"Existing GitLab link found for: {gitlab_username}")
    except NoResultFound:
        oauth = OAuth(
            provider=blueprint.name,
            provider_user_id=gitlab_user_id,
            token=token,
        )

    # ── Step 3: Handle User Logic & Role Assignment ───────────────────────────
    admin_email = os.environ.get("ADMIN_EMAIL", "singhrathoreayush824@gmail.com")
    is_admin = (gitlab_email == admin_email)

    user = User.query.filter_by(email=gitlab_email).first()

    if not user:
        logger.info(f"Provisioning new GitLab user record for {gitlab_username}")
        user = User(
            email=gitlab_email or f"{gitlab_username}@gitlab.com",
            username=gitlab_username,
            role="manager" if is_admin else "developer"
        )
        db.session.add(user)
    else:
        user.username = gitlab_username
        if is_admin:
            user.role = "manager"

    oauth.user = user
    db.session.add(oauth)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Database commit failed during auth: {e}")
        return False

    # ── Step 4: Finalize Local Session ────────────────────────────────────────
    # remember=True sets a persistent cookie so Next.js withCredentials: true
    # can read it across the 3000→5000 port boundary on 127.0.0.1.
    login_user(user, remember=True)
    logger.success(f"✅ User '{gitlab_username}' authenticated | role: {user.role}")

    # ── Step 5: Redirect to Next.js Dashboard ─────────────────────────────────
    # DOMAIN UNITY: Default to 127.0.0.1 (not localhost) so the browser
    # delivers the session cookie correctly to the Next.js client.
    frontend_url = os.environ.get("FRONTEND_URL", "http://127.0.0.1:3000")
    return redirect(f"{frontend_url}/dashboard")


def gitlab_error_handler(blueprint, error, error_description=None, **kwargs):
    """
    Handles standard OAuth errors emitted by GitLab.
    """
    logger.error(f"OAuth Handshake Error from {blueprint.name}: {error_description}")
    frontend_url = os.environ.get("FRONTEND_URL", "http://127.0.0.1:3000")
    return redirect(f"{frontend_url}/login?error=oauth_fail")

# ─────────────────────────────────────────────────────────────────────────────
# INVALID GRANT EXCEPTION HANDLER
# ─────────────────────────────────────────────────────────────────────────────
# Flask-Dance bubbles up oauthlib exceptions if the token exchange fails
# (e.g., if the redirect_uri we send to exchange the code doesn't exactly
# match what GitLab thinks our redirect_uri is, or if the code is expired).
@auth_bp.app_errorhandler(InvalidGrantError)
def handle_invalid_grant(error):
    logger.critical("🔥 InvalidGrantError: OAuth token exchange failed.")
    
    # ── SPECIFIC ERROR LOGGING (Equivalent to try/except around authorize_access_token) ──
    logger.critical(f"GitLab rejected the token exchange! Details:")
    logger.critical(f"  Description: {getattr(error, 'description', str(error))}")
    logger.critical(f"  Status Code: {getattr(error, 'status_code', 'Unknown')}")
    
    # Check for the raw response body if available (sometimes oauthlib attaches it)
    if hasattr(error, 'response'):
        logger.critical(f"  Raw Body: {error.response}")

    logger.critical(f"This is almost ALWAYS a Redirect URI mismatch or a duplicate code exchange.")
    logger.critical(f"Flask expected this EXPLICIT Redirect URI: {url_for('gitlab.authorized', _external=True)}")
    
    frontend_url = os.environ.get("FRONTEND_URL", "http://127.0.0.1:3000")
    return redirect(f"{frontend_url}/login?error=invalid_grant")