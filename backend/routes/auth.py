from flask import Blueprint, request, session, redirect, jsonify, current_app
from ..config import Config
from ..services.spotify import SpotifyService
import secrets
import time
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login')
def login():
    # Verify config
    Config.validate()
    
    # Check redirect URI validity (security best practice)
    redirect_uri = Config.SPOTIFY_REDIRECT_URI
    if not redirect_uri:
        return jsonify({"error": "Server misconfiguration"}), 500

    # Create State
    state = secrets.token_urlsafe(16)
    session['oauth_state'] = state
    
    # Store where to go after login (defaulting to frontend)
    # In main2.py this was hardcoded or parameter driven. 
    # Adapting to safe defaults.
    # If the user is on localhost:8080 (dev), we redirect there.
    frontend_url = request.args.get('redirect', 'http://127.0.0.1:8080/preferences')
    session['frontend_redirect'] = frontend_url
    
    # Force session save
    session.modified = True

    # Construct Auth URL
    scope = "user-read-email playlist-modify-public playlist-modify-private"
    params = {
        "client_id": Config.SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "scope": scope,
        "redirect_uri": redirect_uri,
        "state": state,
        "show_dialog": "true"
    }
    
    # Manual query string construction to ensure encoding
    from urllib.parse import urlencode
    auth_url = f"https://accounts.spotify.com/authorize?{urlencode(params)}"
    
    return redirect(auth_url)

@auth_bp.route('/callback')
def callback():
    # detailed logging available in backend logs if needed
    
    # Validate State
    stored_state = session.get('oauth_state')
    received_state = request.args.get('state')
    
    if not stored_state or stored_state != received_state:
        return jsonify({"error": "Invalid state parameter", "details": "Session may have expired or cross-site request detected."}), 400
        
    error = request.args.get('error')
    if error:
        return jsonify({"error": error}), 400
        
    code = request.args.get('code')
    if not code:
        return jsonify({"error": "No code provided"}), 400
        
    # Exchange Code
    spotify = SpotifyService(Config.SPOTIFY_CLIENT_ID, Config.SPOTIFY_CLIENT_SECRET)
    try:
        token_info = spotify.exchange_code_for_token(code, Config.SPOTIFY_REDIRECT_URI)
    except Exception as e:
        return jsonify({"error": "Token exchange failed", "details": str(e)}), 500
        
    # Store Session
    session['access_token'] = token_info.get('access_token')
    session['refresh_token'] = token_info.get('refresh_token')
    expires_in = token_info.get('expires_in', 3600)
    session['expires_at'] = datetime.now().timestamp() + expires_in
    
    # Get User Profile immediately to store ID
    try:
        profile = spotify.get_user_profile(session['access_token'])
        session['spotify_user_id'] = profile.get('id')
        session['spotify_display_name'] = profile.get('display_name')
    except Exception as e:
        print(f"Warning: Failed to fetch profile on login: {e}")
        
    session.modified = True
    
    # Redirect back to frontend
    redirect_url = session.get('frontend_redirect', 'http://127.0.0.1:8080/')
    return redirect(redirect_url)

@auth_bp.route('/auth/status')
def auth_status():
    if 'access_token' not in session:
        return jsonify({"authenticated": False}), 401
        
    # Check expiry
    expires_at = session.get('expires_at', 0)
    if datetime.now().timestamp() > expires_at:
        # Try refresh
        if 'refresh_token' in session:
            try:
                spotify = SpotifyService(Config.SPOTIFY_CLIENT_ID, Config.SPOTIFY_CLIENT_SECRET)
                new_tokens = spotify.refresh_token(session['refresh_token'])
                
                session['access_token'] = new_tokens.get('access_token')
                # Refresh token might not always be returned in a refresh flow, keep old one if so
                if 'refresh_token' in new_tokens:
                    session['refresh_token'] = new_tokens.get('refresh_token')
                    
                session['expires_at'] = datetime.now().timestamp() + new_tokens.get('expires_in', 3600)
                session.modified = True
            except Exception as e:
                print(f"Refresh failed: {e}")
                session.clear()
                return jsonify({"authenticated": False}), 401
        else:
            session.clear()
            return jsonify({"authenticated": False}), 401
            
    return jsonify({
        "authenticated": True,
        "user": session.get('spotify_display_name'),
        "expires_at": session.get('expires_at')
    })

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})
