from flask import Flask
from flask_session import Session
from flask_cors import CORS
from .config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize Session
    Session(app)
    
    # Initialize CORS
    # Allowing specific origins as per main2.py but simplified
    CORS(app, 
         resources={r"/*": {"origins": ["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:8081", "http://127.0.0.1:8081"]}},
         supports_credentials=True)

    # Register Blueprints
    from .routes.auth import auth_bp
    from .routes.playlist import playlist_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(playlist_bp)
    
    @app.route('/')
    def health_check():
        return {"status": "ok", "service": "Spotify AI Backend"}

    return app
