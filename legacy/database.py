import os
import base64
import json
import time
import random
from datetime import datetime, timedelta

from dotenv import load_dotenv
import requests
import google.generativeai as genai

from flask import Flask, redirect, request, jsonify, session as session1
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

# -------------------------------------------------------------------
#  Load environment variables
# -------------------------------------------------------------------
load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
GENAI_API_KEY = os.getenv("GENAI_API_KEY")
FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-key") # need to pin this to the actual secret key... 
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///spotify_app.db")

AUTH_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"
API_BASE_URL = "https://api.spotify.com/v1/"

# -------------------------------------------------------------------
#  Flask app + CORS + DB setup
# -------------------------------------------------------------------
app = Flask(__name__)

CORS(
    app,
    resources={
        r"/*": {
            "origins": ["http://localhost:8080"],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "max_age": 3600,
        }
    },
)

app.secret_key = FLASK_SECRET_KEY
app.permanent_session_lifetime = timedelta(hours=1)
app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=True,   # for dev on http this is technically overkill but okay
    SESSION_COOKIE_HTTPONLY=True,
)

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# -------------------------------------------------------------------
#  DB models: User + Playlist
# -------------------------------------------------------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    spotify_id = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(255))
    display_name = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    playlists = db.relationship("Playlist", backref="user", lazy=True)


class Playlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    spotify_playlist_id = db.Column(db.String(64), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)

    track_count = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


# -------------------------------------------------------------------
#  Spotify OAuth helpers
# -------------------------------------------------------------------
def refresh_token_internal():
    """Refresh the access token using the refresh token stored in session."""
    if "refresh_token" not in session1:
        raise Exception("No refresh token in session")

    req_body = {
        "grant_type": "refresh_token",
        "refresh_token": session1["refresh_token"],
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }
    response = requests.post(TOKEN_URL, data=req_body)
    response.raise_for_status()
    new_token_info = response.json()

    session1["access_token"] = new_token_info["access_token"]
    session1["expires_at"] = datetime.now().timestamp() + new_token_info["expires_in"]


def ensure_access_token():
    """Ensure there is a valid access token in the session."""
    if "access_token" not in session1:
        raise Exception("Not authenticated")

    if session1.get("expires_at", 0) < datetime.now().timestamp():
        refresh_token_internal()


# -------------------------------------------------------------------
#  Gemini: generate song suggestions
# -------------------------------------------------------------------
def generate_songs(number_songs, prefs, curr_songs):
    """
    Call Gemini to generate a list of (song_name, artist_name) pairs.

    number_songs: int
    prefs: dict (your preferences JSON)
    curr_songs: list of song names already in the playlist
    """
    if not GENAI_API_KEY:
        raise Exception("GENAI_API_KEY is not set in environment")

    genai.configure(api_key=GENAI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-pro-001")

    prompt = f"""You are a playlist generator service. 
Give me a unique list of {number_songs} songs that satisfy the following user-preferences listed in this JSON file: {json.dumps(prefs)}. 
Reference songs from ALL of the artist's albums. 
Ensure no songs are repeated from the given context file: {json.dumps(curr_songs)}. 
Provide the list in the following format:

<Song Name> - <Song Artist>

Do NOT precede or follow the list with any description."""

    response = model.generate_content(prompt)
    songs = []

    for line in response.text.splitlines():
        line = line.strip()
        if not line:
            continue
        # Expect "<Song> - <Artist>"
        parts = line.split(" - ")
        if len(parts) < 2:
            continue
        song_name = parts[0].strip()
        artist_name = parts[1].strip()
        if song_name and artist_name:
            songs.append((song_name, artist_name))

    return songs


def generate_playlist_name(preferences: dict) -> str:
    moods = preferences.get("moods") or []
    genres = preferences.get("genres") or []

    mood_name = moods[0] if moods else "Amazing"
    genre_name = genres[0] if genres else "Music"

    options = [
        f"{mood_name} {genre_name} Vibes",
        f"My {mood_name} Mix",
        f"{genre_name} Discovery",
        f"{mood_name} {genre_name} Journey",
        f"Perfect {mood_name} Playlist",
    ]
    return random.choice(options)


# -------------------------------------------------------------------
#  Spotify: create playlist for logged-in user and store in DB
# -------------------------------------------------------------------
def create_playlist(name="Playlist", description="Generated by PlaylistAI", public=True):
    ensure_access_token()

    headers = {
        "Authorization": f"Bearer {session1['access_token']}",
        "Content-Type": "application/json",
    }

    spotify_user_id = session1.get("spotify_user_id")
    if not spotify_user_id:
        raise Exception("No Spotify user ID in session")

    form_data = {
        "name": name,
        "description": description,
        "public": public,
    }

    response = requests.post(
        API_BASE_URL + "users/" + spotify_user_id + "/playlists",
        headers=headers,
        json=form_data,
    )
    response.raise_for_status()
    new_playlist = response.json()

    spotify_playlist_id = new_playlist["id"]
    playlist_name = new_playlist["name"]
    playlist_desc = new_playlist.get("description")

    # upsert user in DB (should exist already, but safe)
    user = User.query.filter_by(spotify_id=spotify_user_id).first()
    if not user:
        user = User(spotify_id=spotify_user_id)
        db.session.add(user)

    playlist = Playlist(
        user=user,
        spotify_playlist_id=spotify_playlist_id,
        name=playlist_name,
        description=playlist_desc,
        track_count=0,
    )
    db.session.add(playlist)
    db.session.commit()

    return spotify_playlist_id


# -------------------------------------------------------------------
#  Routes
# -------------------------------------------------------------------
@app.route("/")
def index():
    return "Backend is running"


@app.route("/login")
def login():
    """
    Redirect user to Spotify's authorization page.
    Frontend can pass ?redirect=http://localhost:8080/preferences if needed.
    """
    session1["frontend_redirect"] = request.args.get(
        "redirect", "http://localhost:8080/preferences"
    )

    params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "scope": "user-read-email playlist-modify-public",
        "redirect_uri": REDIRECT_URI,
        "show_dialog": "true",
    }

    # Build URL: AUTH_URL?key=value...
    parts = "&".join(f"{k}={requests.utils.quote(str(v))}" for k, v in params.items())
    auth_url = f"{AUTH_URL}?{parts}"
    return redirect(auth_url)


@app.route("/callback")
def callback():
    """Spotify redirect URI. Handles authorization code -> access token."""
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "No authorization code received"}), 400

    auth_header = base64.b64encode(
        f"{CLIENT_ID}:{CLIENT_SECRET}".encode("utf-8")
    ).decode("ascii")

    headers = {
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    data = {
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    response = requests.post(TOKEN_URL, headers=headers, data=data)
    if response.status_code != 200:
        return jsonify({"error": "Failed to exchange code", "details": response.text}), 400

    token_info = response.json()

    # Save tokens in session
    access_token = token_info.get("access_token")
    refresh_token = token_info.get("refresh_token")
    expires_in = token_info.get("expires_in", 3600)

    session1["access_token"] = access_token
    session1["refresh_token"] = refresh_token
    session1["expires_at"] = datetime.now().timestamp() + expires_in

    # Fetch user profile from Spotify
    me_headers = {"Authorization": f"Bearer {access_token}"}
    me_resp = requests.get(API_BASE_URL + "me", headers=me_headers)
    if me_resp.status_code != 200:
        return jsonify({"error": "Failed to fetch user profile"}), 400

    me_data = me_resp.json()
    spotify_user_id = me_data["id"]
    email = me_data.get("email")
    display_name = me_data.get("display_name")

    # Store in session
    session1["spotify_user_id"] = spotify_user_id

    # Upsert user in DB
    user = User.query.filter_by(spotify_id=spotify_user_id).first()
    if not user:
        user = User(spotify_id=spotify_user_id)
        db.session.add(user)

    user.email = email
    user.display_name = display_name
    db.session.commit()

    frontend_redirect = session1.pop(
        "frontend_redirect", "http://localhost:8080/preferences"
    )
    return redirect(f"{frontend_redirect}?auth=success")


@app.route("/auth/status")
def auth_status():
    """Check whether the user is authenticated and token is valid / refreshed."""
    if "access_token" not in session1:
        return jsonify({"authenticated": False}), 401

    if session1.get("expires_at", 0) < datetime.now().timestamp():
        try:
            refresh_token_internal()
        except Exception:
            return jsonify({"authenticated": False}), 401

    return jsonify(
        {
            "authenticated": True,
            "expires_at": session1["expires_at"],
        }
    )


@app.route("/Playlist_Generator", methods=["POST"])
def playlist_generation():
    """
    Main endpoint your frontend calls.
    - Reads preferences JSON
    - Calls Gemini to generate songs
    - Searches Spotify for those songs
    - Creates a playlist on Spotify
    - Stores playlist in DB
    - Returns track names + URIs + playlist info
    """
    print("POST /Playlist_Generator")

    if "access_token" not in session1:
        return jsonify({"error": "Not authenticated"}), 401

    # Refresh if needed
    if session1.get("expires_at", 0) < datetime.now().timestamp():
        try:
            refresh_token_internal()
        except Exception:
            return jsonify({"error": "Session expired"}), 401

    payload = request.get_json()
    print("Raw payload:", payload)

    if not payload:
        return jsonify({"error": "No preferences provided"}), 400

    # Accept both { preferences: {...} } and {...} directly
    preferences = payload.get("preferences", payload)
    print("Preferences used:", preferences)

    playlist_length = preferences.get("playlistLength", [20])
    if isinstance(playlist_length, list):
        playlist_length = playlist_length[0]

    playlist_length = int(playlist_length)

    playlist_uris = []
    track_names = []

    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {session1['access_token']}",
    }

    # Generate enough songs to fill the playlist length
    while len(playlist_uris) < playlist_length:
        songs_to_generate = playlist_length - len(playlist_uris)
        songs = generate_songs(songs_to_generate, preferences, track_names)
        print("Gemini songs:", songs)

        for song_name, song_artist in songs:
            if not song_name or not song_artist:
                continue

            query = f"track:{song_name} artist:{song_artist}"
            params = {
                "q": query,
                "type": "track",
                "market": "US",
                "limit": 1,
                "offset": 0,
            }
            search_resp = requests.get(
                API_BASE_URL + "search", headers=headers, params=params
            )
            if search_resp.status_code != 200:
                continue

            track_data = search_resp.json()
            items = track_data.get("tracks", {}).get("items", [])
            if not items:
                continue

            item = items[0]
            track_name = item["name"]
            uri = item["uri"]

            if track_name in track_names:
                continue

            track_names.append(track_name)
            playlist_uris.append(uri)

            if len(playlist_uris) >= playlist_length:
                break

    # Create playlist on Spotify
    playlist_name = generate_playlist_name(preferences)
    description = "Generated by PlaylistAI"
    spotify_playlist_id = create_playlist(
        name=playlist_name,
        description=description,
        public=True,
    )

    # Add tracks to playlist
    add_url = API_BASE_URL + f"playlists/{spotify_playlist_id}/tracks"
    body = {"uris": playlist_uris, "position": 0}
    add_resp = requests.post(add_url, headers=headers, json=body)

    try:
        add_resp_json = add_resp.json()
    except Exception:
        add_resp_json = {}

    if add_resp.status_code == 201:
        # Update track_count in DB
        try:
            playlist = Playlist.query.filter_by(
                spotify_playlist_id=spotify_playlist_id
            ).first()
            if playlist:
                playlist.track_count = len(playlist_uris)
                db.session.commit()
        except Exception as e:
            print("Failed to update track_count:", e)

        resp = jsonify(
            {
                "Tracks": track_names,
                "URIs": playlist_uris,
                "playlistName": playlist_name,
                "spotifyPlaylistId": spotify_playlist_id,
            }
        )
        resp.headers.add("Access-Control-Allow-Origin", "http://localhost:8080")
        resp.headers.add("Access-Control-Allow-Credentials", "true")
        return resp

    error_resp = jsonify(
        {
            "error": "Failed to add tracks to Spotify playlist",
            "details": add_resp_json,
        }
    )
    error_resp.headers.add("Access-Control-Allow-Origin", "http://localhost:8080")
    error_resp.headers.add("Access-Control-Allow-Credentials", "true")
    return error_resp, 400


# -------------------------------------------------------------------
#  Entrypoint
# -------------------------------------------------------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", debug=True, port=5000)
    