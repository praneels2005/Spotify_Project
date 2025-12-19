import os
import secrets
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask Settings
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY') or secrets.token_hex(32)
    # Ensure usage of 127.0.0.1 for localhost consistency
    SERVER_NAME = os.getenv('SERVER_NAME') # Optional, helpful for url_for
    
    # Session Settings
    SESSION_TYPE = 'filesystem'
    SESSION_FILE_DIR = os.path.join(os.getcwd(), 'flask_session')
    SESSION_PERMANENT = True
    PERMANENT_SESSION_LIFETIME = timedelta(hours=1)
    SESSION_USE_SIGNER = True
    
    # Cookie Settings - Production vs Dev
    SESSION_COOKIE_NAME = 'spotify_session'
    SESSION_COOKIE_HTTPONLY = True
    
    # In production (non-localhost), these should be strict
    # We detect if we are running locally based on DEBUG or explicit env var
    IS_PRODUCTION = os.getenv('FLASK_ENV') == 'production'
    
    if IS_PRODUCTION:
        SESSION_COOKIE_SECURE = True
        SESSION_COOKIE_SAMESITE = 'None' # Required for cross-site if frontend/backend are separate domains
        SESSION_COOKIE_DOMAIN = os.getenv('COOKIE_DOMAIN') # e.g., ".mydomain.com"
    else:
        # Localhost development
        SESSION_COOKIE_SECURE = False # HTTPS not usually set up for localhost
        SESSION_COOKIE_SAMESITE = 'Lax' # Better for localhost
        SESSION_COOKIE_DOMAIN = None

    # Spotify OAuth
    SPOTIFY_CLIENT_ID = os.getenv("CLIENT_ID")
    SPOTIFY_CLIENT_SECRET = os.getenv("CLIENT_SECRET")
    SPOTIFY_REDIRECT_URI = os.getenv("REDIRECT_URI")
    
    # AI / Gemini
    GENAI_API_KEY = os.getenv("GENAI_API_KEY")

    @classmethod
    def validate(cls):
        """Ensure critical config exists"""
        missing = []
        if not cls.SPOTIFY_CLIENT_ID: missing.append("CLIENT_ID")
        if not cls.SPOTIFY_CLIENT_SECRET: missing.append("CLIENT_SECRET")
        if not cls.SPOTIFY_REDIRECT_URI: missing.append("REDIRECT_URI")
        if not cls.GENAI_API_KEY: missing.append("GENAI_API_KEY")
        
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
