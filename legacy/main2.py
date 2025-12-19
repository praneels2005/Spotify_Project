#Authorization code flow
#client secret is a sensitive key or password that is used in OAuth 2.0 and other authentication protocols to secure communication between a client (like a mobile app, web app, or service) and an authentication server. It is typically used in the context of an OAuth authorization flow
#Authorization code gives access to user's resources(playlists, albums, etc.)
#Able to refresh the access token
#https://developer.spotify.com/documentation/web-api/tutorials/code-flow
'''
1. App sends request to server to recieve authorization code
2. App recieves authorization code
3. Authorization code, client ID, and client Secret are included in request message to obtain access token and refresh token from spotify server
4. Access token is use in all request messages to obtain user information from spotify
5. Once access token is expired, use refresh token to obtain new access token
'''

#GET method is used to retrieve data from a server.
#POST method is used to create new resources on a server
import google.generativeai as genai
from google.generativeai import caching
from google import genai
import datetime
from dotenv import load_dotenv
import os
import base64
import secrets
import re
import requests
import json
import spotipy
from flask import Flask,redirect, request, jsonify, session
from flask_session import Session
from flask_cors import CORS, cross_origin
from datetime import datetime, timedelta
import urllib.parse
import time
load_dotenv()

#Intialize Flask app
app = Flask(__name__)

app.config.update(
    SECRET_KEY=os.getenv('FLASK_SECRET_KEY', 'praneel2005-' + secrets.token_hex(16)),
    SESSION_TYPE='filesystem',  # Stores sessions on disk
    SESSION_PERMANENT=True,
    SESSION_USE_SIGNER=True,
    SESSION_FILE_DIR='./flask_session',  # Directory for session files
    PERMANENT_SESSION_LIFETIME=timedelta(hours=1),
    
    #Cookie Settings
    SESSION_COOKIE_NAME='spotify_session',
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=False,
    SESSION_COOKIE_SAMESITE='None',
    SESSION_COOKIE_DOMAIN=None,
    SESSION_COOKIE_PATH='/',
)

Session(app)

CORS(app, 
     resources={r"/*": {
         "origins": ["http://127.0.0.1:8080", "http://127.0.0.1:8081", "http://localhost:8080", "http://localhost:8081"],  # Support multiple ports and localhost variants
         "methods": ["GET", "POST", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "Accept"],
         "supports_credentials": True,
         "expose_headers": ["Set-Cookie"],
         "max_age": 3600,
     }},
     supports_credentials=True)

# CRITICAL: Ensure session cookie is set on all responses
@app.after_request
def after_request(response):
    """Ensure session cookie is properly set in all responses"""
    # Check all Set-Cookie headers (case-insensitive)
    set_cookie_headers = []
    for header_name, header_value in response.headers:
        if header_name.lower() == 'set-cookie':
            set_cookie_headers.append(header_value)
    
    if set_cookie_headers:
        for cookie_header in set_cookie_headers:
            print(f"🍪 Set-Cookie header: {cookie_header[:100]}...")
    else:
        # If session was modified but no cookie is set, log it
        if session and session.modified:
            print(f"⚠️ Session modified but NO Set-Cookie header found!")
            print(f"   Session keys: {list(session.keys())}")
            print(f"   Session cookie name: {app.config.get('SESSION_COOKIE_NAME', 'session')}")
    
    return response

# CRITICAL FIX #4: Make session permanent on every request
@app.before_request
def make_session_permanent():
    session.permanent = True
    # Ensure session is marked as modified if it has data
    if session:
        session.modified = True

# Ensure CORS headers are set on all responses
# @app.after_request
# def after_request(response):
#     # Check if the header is already present to prevent duplication
#     if 'Access-Control-Allow-Origin' not in response.headers:
#         response.headers['Access-Control-Allow-Origin'] = 'http://localhost:8080'
#     response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
#     response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
#     response.headers['Access-Control-Allow-Credentials'] = 'true' # If needed
#     return response
    
client_id = os.getenv("CLIENT_ID")
client_secret = os.getenv("CLIENT_SECRET")
redirect_uri = os.getenv("REDIRECT_URI")
user_id = os.getenv("USER_ID")
#Server with that will return authorization code
AUTH_URL = "https://accounts.spotify.com/authorize"

#Server that will return access token, refresh token, and expires in
token_url = "https://accounts.spotify.com/api/token"

#Server that returns user information from spotify website 
api_base_url = "https://api.spotify.com/v1/"

@app.route('/')
#Redirects to spotify login
def index():
    return "Welcome to my Spotiy App"

@app.route('/login')
def login():
    # Validate required environment variables
    if not client_id or not client_secret or not redirect_uri:
        return jsonify({"error": "Missing required OAuth configuration. Check CLIENT_ID, CLIENT_SECRET, and REDIRECT_URI in .env"}), 500
    
    # CRITICAL: Validate redirect_uri format
    # The redirect_uri must exactly match what's registered in Spotify Dashboard
    if not redirect_uri.startswith(('http://', 'https://')):
        return jsonify({"error": "REDIRECT_URI must be a valid URL starting with http:// or https://"}), 500
    
    # IMPORTANT: Spotify no longer allows 'localhost' - must use 127.0.0.1 or [::1]
    # See: https://developer.spotify.com/documentation/web-api/concepts/redirect_uri
    if 'localhost' in redirect_uri.lower():
        return jsonify({
            "error": "REDIRECT_URI cannot use 'localhost'. Use '127.0.0.1' or '[::1]' instead. See: https://developer.spotify.com/documentation/web-api/concepts/redirect_uri"
        }), 500
        
    # After line 119, add:
    if redirect_uri.startswith('http://'):
        is_loopback = '127.0.0.1' in redirect_uri or '[::1]' in redirect_uri
        if not is_loopback:
            return jsonify({
                "error": "Non-loopback redirect URIs must use HTTPS. Use 'https://' or switch to loopback address (127.0.0.1 or [::1])"
            }), 500
    
    state = secrets.token_urlsafe(16)
    session['oauth_state'] = state
    session['frontend_redirect'] = request.args.get('redirect', 'http://127.0.0.1:8080/preferences')
    
    # CRITICAL: Force session to be saved before redirecting to Spotify
    session.modified = True
    session.permanent = True
    
    # WORKAROUND: Also store state in a temporary file as backup
    # This helps if session cookie is not sent (browser blocking)
    # Remove this in production if session cookies work properly
    try:
        import json
        state_backup_file = './flask_session/oauth_state_backup.json'
        os.makedirs('./flask_session', exist_ok=True)
        with open(state_backup_file, 'w') as f:
            json.dump({
                'state': state,
                'frontend_redirect': session.get('frontend_redirect'),
                'timestamp': datetime.now().timestamp()
            }, f)
        print(f"✅ State backed up to file")
    except Exception as e:
        print(f"⚠️ Could not backup state to file: {e}")
    
    # Debug: Verify session is saved
    print(f"🔍 === Login Route Debug ===")
    print(f"✅ State generated: {state[:20]}...")
    print(f"✅ Frontend redirect: {session.get('frontend_redirect')}")
    print(f"✅ Session ID before redirect: {request.cookies.get('spotify_session', 'NOT SET YET')}")
    print(f"✅ Session cookie (session): {request.cookies.get('session', 'NOT SET YET')}")
    print(f"✅ Session keys: {list(session.keys())}")
    print(f"✅ Session modified: {session.modified}")
    
    # CRITICAL: This redirect_uri MUST exactly match:
    # 1. What's registered in Spotify Developer Dashboard
    # 2. The redirect_uri used in /callback when exchanging code for token (line 158)
    # Any mismatch (case, trailing slash, etc.) will cause OAuth to fail
    params = {
        "client_id":client_id,
        "response_type":"code",
        "scope":"user-read-email playlist-modify-public playlist-modify-private",
        "redirect_uri": redirect_uri,
        "state": state,
        'show_dialog': "true"
    }
    
    auth_url = f"{AUTH_URL}?{urllib.parse.urlencode(params)}"
    return redirect(auth_url)

@app.route('/callback')
def callback():
    # Debug: Check session state immediately
    print(f"🔍 === Callback Route Debug ===")
    print(f"🔍 All cookies received: {dict(request.cookies)}")
    print(f"🔍 Session cookie (spotify_session): {request.cookies.get('spotify_session', 'NOT FOUND')}")
    print(f"🔍 Session cookie (session): {request.cookies.get('session', 'NOT FOUND')}")
    print(f"🔍 Session keys available: {list(session.keys())}")
    print(f"🔍 Full session dict: {dict(session)}")
    
    state = request.args.get('state')
    stored_state = session.get('oauth_state')
    stored_frontend_redirect = session.get('frontend_redirect')
    
    print(f"🔍 Received state from Spotify: {state}")
    print(f"🔍 Stored state in session: {stored_state}")
    
    # WORKAROUND: If session state is missing, try to load from backup file
    if not stored_state:
        print("⚠️ oauth_state not found in session, trying backup file...")
        try:
            import json
            state_backup_file = './flask_session/oauth_state_backup.json'
            if os.path.exists(state_backup_file):
                with open(state_backup_file, 'r') as f:
                    backup_data = json.load(f)
                    # Check if backup is recent (within 10 minutes)
                    backup_age = datetime.now().timestamp() - backup_data.get('timestamp', 0)
                    if backup_age < 600:  # 10 minutes
                        stored_state = backup_data.get('state')
                        if not stored_frontend_redirect:
                            stored_frontend_redirect = backup_data.get('frontend_redirect')
                        # Restore to session
                        session['oauth_state'] = stored_state
                        session['frontend_redirect'] = stored_frontend_redirect
                        session.modified = True
                        print(f"✅ Restored state from backup file: {stored_state[:20]}...")
                        # Clean up backup file
                        os.remove(state_backup_file)
                    else:
                        print(f"⚠️ Backup file too old ({backup_age:.0f} seconds), ignoring")
                        os.remove(state_backup_file)
        except Exception as e:
            print(f"⚠️ Could not load backup state: {e}")
    
    if not stored_state:
        print("❌ CRITICAL: oauth_state not found in session or backup!")
        print("❌ This means the session cookie was not sent or session was lost")
        print("❌ Possible causes:")
        print("   1. Session cookie not being sent by browser")
        print("   2. Session cookie blocked by browser (SAMESITE/SECURE mismatch)")
        print("   3. Session expired or cleared")
        return jsonify({
            "error": "Session expired. Please try logging in again.",
            "details": "The OAuth state was not found in session. This usually means the session cookie was not sent or was blocked."
        }), 400
    
    if state != stored_state:
        print("❌ State mismatch!")
        print(f"   Expected: {stored_state}")
        print(f"   Received: {state}")
        return jsonify({"error": "Invalid state parameter"}), 400
    
    print("✅ State validation passed!")
    
    if 'error' in request.args:
        print(f"❌ OAuth error: {request.args.get('error')}")
        return jsonify({"error": request.args.get('error')}), 400
    
    code = request.args.get('code')
    print(f"Authorization code: {code}")
    
    if not code:
        return jsonify({"error": "No authorization code received"}), 400
        
    auth_header = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode("ascii")
    # print(auth_header)
    headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded"
    }
        
    # CRITICAL: redirect_uri here MUST exactly match the redirect_uri used in /login (line 119)
    # This is used for validation only - Spotify verifies it matches the initial authorization request
    # Any difference (case, trailing slash, etc.) will cause token exchange to fail with INVALID_CLIENT
    data = {
            'code': code,
            'redirect_uri': redirect_uri,
            'grant_type': "authorization_code"
    }
    print("🔄 Exchanging code for tokens...")
    response = requests.post(token_url, data=data, headers=headers)
    if response.status_code != 200:
        print(f"❌ Token exchange failed: {response.text}")
        return jsonify({"error": "Failed to exchange authorization code"}), response.status_code
    
    token_info = response.json()
    
    session['access_token']= token_info.get('access_token')
    session['refresh_token']= token_info.get('refresh_token')
    session['expires_at'] = datetime.now().timestamp() + token_info.get('expires_in', 3600)
    
    # Fetch and store user profile information for later playlist actions
    user_profile_headers = {
        "Authorization": f"Bearer {session['access_token']}",
        "Content-Type": "application/json"
    }
    profile_response = requests.get(api_base_url + 'me', headers=user_profile_headers)
    if profile_response.status_code == 200:
        user_profile = profile_response.json()
        session['spotify_user_id'] = user_profile.get('id')
        session['spotify_display_name'] = user_profile.get('display_name')
        session['spotify_email'] = user_profile.get('email')
    else:
        print(f"⚠️ Failed to fetch user profile: {profile_response.text}")
    
    # CRITICAL: Ensure session is saved before redirecting
    session.modified = True
    session.permanent = True
    
    print("✅ Session set successfully")
    print(f"✅ Session ID after storing: {request.cookies.get('spotify_session', 'NOT FOUND')}")
    access_preview = session.get('access_token', '')[:20]
    print(f"✅ Access token (first 20): {access_preview}...")
    print(f"✅ Session contents: {list(session.keys())}")
    print(f"✅ Session has access_token: {'access_token' in session}")
    
    # Get frontend redirect (use stored value from session or backup)
    frontend_redirect = session.pop('frontend_redirect', None) or stored_frontend_redirect or 'http://127.0.0.1:8080/preferences'
    print(f"✅ Redirecting to frontend: {frontend_redirect}")
    
    # CRITICAL: Force session to be saved before redirect
    # Flask-Session saves automatically, but we ensure it's marked as modified
    session.modified = True
    session.permanent = True
    
    # Create redirect response
    response = redirect(frontend_redirect)
    
    # Flask-Session will automatically set the cookie in the response
    # The after_request handler will log if the cookie is set
    
    return response

@app.route('/auth/status')
def auth_status():
    """Check if user is authenticated"""
    print("=== Auth Status Check ===")
    print(f"🔍 All cookies received: {dict(request.cookies)}")
    print(f"🔍 Session cookie (spotify_session): {request.cookies.get('spotify_session', 'NOT FOUND')}")
    print(f"🔍 Session cookie (session): {request.cookies.get('session', 'NOT FOUND')}")
    print(f"🔍 Session keys: {list(session.keys())}")
    print(f"🔍 Session contents: {dict(session)}")
    print(f"🔍 Has access_token: {'access_token' in session}")
    
    if 'access_token' not in session:
        print("❌ No access token in session")
        print("❌ Possible causes:")
        print("   1. User hasn't completed OAuth flow")
        print("   2. Session cookie not being sent by browser")
        print("   3. Session expired or cleared")
        return jsonify({"authenticated": False}), 401
    
    # Check if token is expired
    expires_at = session.get('expires_at', 0)
    current_time = datetime.now().timestamp()
    if expires_at < current_time:
        # Try to refresh
        try:
            print("⏳ Attempting to refresh token...")
            refresh_token_internal()
            print("✅ Token refreshed successfully")

            return jsonify({
                "authenticated": True,
                "expires_at": session['expires_at']
            })
        except Exception as e:
            print(f"❌ Token refresh failed: {e}")
            return jsonify({"authenticated": False}), 401
    print("✅ User is authenticated")
    return jsonify({
        "authenticated": True,
        "expires_at": session.get('expires_at')
    }) 
    
@app.route('/logout', methods=['POST'])
def logout():
    """Clear user session"""
    session.clear()
    return jsonify({"message": "Logged out successfully"})
    
def refresh_token_internal():
    """Internal function to refresh token without redirect"""
    if 'refresh_token' not in session:
        raise Exception('NO refresh token')
    
    #Send request to obtian new access token
    req_body = {
            'grant_type': 'refresh_token',
            'refresh_token': session['refresh_token'],
            'client_id': client_id,
            'client_secret': client_secret
        }
        
    response = requests.post(token_url, data=req_body)
    
    if response.status_code != 200:
        raise Exception("Token refresh failed")
    
    new_token_info = response.json()
        
        #Override the info of the current access token
    session['access_token'] = new_token_info['access_token']
    session['expires_at'] = datetime.now().timestamp()+new_token_info['expires_in']

def ensure_valid_session():
    if 'access_token' not in session:
        raise Exception("Not authenticated")
    if session.get('expires_at', 0) < datetime.now().timestamp():
        refresh_token_internal()

def get_spotify_user_id():
    spotify_user_id = session.get('spotify_user_id')
    if spotify_user_id:
        return spotify_user_id
    ensure_valid_session()
    headers = {
        'Authorization': f"Bearer {session['access_token']}",
        'Content-Type': 'application/json'
    }
    response = requests.get(api_base_url + 'me', headers=headers)
    if response.status_code == 200:
        data = response.json()
        spotify_user_id = data.get('id')
        session['spotify_user_id'] = spotify_user_id
        return spotify_user_id
    raise Exception('Unable to fetch Spotify user profile')

def create_spotify_playlist(name="Opium Playlist", description="Yuh", public=True):
    """Helper to create a playlist for the authenticated Spotify user."""
    ensure_valid_session()
    spotify_user_id = get_spotify_user_id()
    
    headers = {
        'Authorization': f"Bearer {session['access_token']}",
        'Content-Type': 'application/json'
    }
    form_data = {
        "name": name,
        "description": description,
        "public": public
    }
    response = requests.post(api_base_url + f'users/{spotify_user_id}/playlists',
                             headers=headers, json=form_data)
    response.raise_for_status()
    new_playlist = response.json()
    return new_playlist.get("id")

@app.route('/Get_Playlists', defaults={'playlist_id': None}, methods=['GET'])
@app.route('/Get_Playlists/<playlist_id>', methods=['GET'])
def get_playlists(playlist_id):
    try:
        ensure_valid_session()
    except Exception:
        return jsonify({"error": "Not authenticated"}), 401
    
    headers = {
        'Authorization': f"Bearer {session['access_token']}",
        'Accept': 'application/json'
    }
    
    if playlist_id:
        if not is_valid_base62(playlist_id):
            return jsonify({"error": "Invalid playlist ID"}), 400
        response = requests.get(api_base_url + f'playlists/{playlist_id}', headers=headers)
    else:
        response = requests.get(api_base_url + 'me/playlists', headers=headers)
    
    if response.status_code != 200:
        print(f"Failed to fetch playlists: {response.text}")
        return jsonify({"error": "Failed to fetch playlists"}), response.status_code
    
    return jsonify(response.json())

@app.route('/Create_Playlist',methods=['POST'])
def create_playlist_route():
    
    try:
        ensure_valid_session()
    except Exception:
        return jsonify({"error": "Not authenticated"}), 401
    
    payload = request.get_json(silent=True) or {}
    name = payload.get("name", "Opium Playlist")
    description = payload.get("description", "Yuh")
    public = payload.get("public", True)
    
    try:
        playlist_id = create_spotify_playlist(name=name, description=description, public=public)
        return jsonify({"playlist_id": playlist_id})
    except Exception as e:
        print(e)
        return jsonify({"error": "Failed to create playlist", "details": str(e)}), 500
    
    
def getTrack(ids):
    headers = {
        'Authorization': f"Bearer {session['access_token']}"
    }
    Songs = []
    for id in ids:
        URL = api_base_url+"tracks/"+id
        response = requests.get(URL, headers=headers)
        Songs.append(((response.json())["name"], (response.json())["artists"][0]["name"]))
        
    return Songs

def is_valid_base62(id):
    # Regex to match only base62 characters
    pattern = r'^[A-Za-z0-9]+$'
    return bool(re.match(pattern, id))

#Implement caching system that avoids song repeats in playlist
def generate_songs(Number_Songs, Prefs, Curr_songs):
    api_key = os.getenv("GENAI_API_KEY")
    if not api_key:
        raise Exception("GENAI_API_KEY environment variable is not set")
    
    client = genai.Client(api_key=api_key)
    
    

    #Hard coded # of songs to generate for playlist and genre
    #The formatting of the list genereated by AI is manipulated
    prompt = f"""You are a playlist generator service. Give me a unique list of {Number_Songs} songs that satisfy the following user-preferences listed in this JSON file: {Prefs}. Reference songs from ALL of the artist's albums. Ensure no songs are repeated from the given context file: {Curr_songs}. Provide the list in the following format:

<Song Name> - <Song Artist>

DO NOT PRECEDE OR FOLLOW THE LIST WITH ANY DESCRIPTION."""

    #response = model.generate_content(f"You are a playlist generator service. Give me a new list of {Number_Songs} songs that are {genre} and provide their names followed by the artists. Do NOT follow the list with any description.")
    try:
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
    except Exception as e:
        error_msg = str(e)
        if "404" in error_msg or "not found" in error_msg.lower():
            raise Exception(f"Gemini model not found. Please check the model name. Error: {error_msg}")
        elif "429" in error_msg or "rate limit" in error_msg.lower():
            raise Exception("Gemini API rate limit exceeded. Please try again later.")
        elif "401" in error_msg or "403" in error_msg or "invalid" in error_msg.lower():
            raise Exception(f"Gemini API authentication error. Please check your API key. Error: {error_msg}")
        else:
            raise Exception(f"Gemini API error: {error_msg}")
    
    if not response or not response.text:
        raise Exception("Gemini API returned empty response")
    
    songs = []
    #for chunk in response:
    #    print(chunk.text, end = ' ')
    #Gets a list of the generated songs and their artist
    for i in response.text.splitlines():
        #songs.append(' '.join(i.split()[1:]).split(' - '))
        songs.append(' '.join(i.split()).split(' - '))
    if [''] in songs:
        songs.remove([''])
    return songs


#Method to generate songs
@app.route('/Playlist_Generator', methods=["POST", "OPTIONS"])
def playlist_generation():
    print("POST request received at /Playlist_Generator")
    if request.method == "OPTIONS":
        # Flask-CORS will automatically add the necessary CORS headers
        return jsonify({'status': 'ok'}), 200
    
    # Check authentication
    try:
        ensure_valid_session()
    except Exception as e:
        print(f"Authentication check failed: {e}")
        return jsonify({"error": "Not authenticated", "redirect": "/login"}), 401
        
    data = request.get_json()
    preferences = data.get('preferences')
    print(f"Received preferences: {preferences}")

    
    if not preferences:
        return jsonify({"error": "No preferences provided"}), 400
    # if 'access_token' not in session:
    #     return redirect('/login')
    
    #Example URL: https://api.spotify.com/v1/search?q=track%3ATimeless+artist%3AThe+Weeknd&type=track&market=US&limit=1&offset=0
    # Num_Songs = 20
    # genre = "Rock"
    # print(jsonify(preferences))
    playlist_length = preferences.get("playlistLength", [20])
    if isinstance(playlist_length, list):
        playlist_length = playlist_length[0]
    
    Playlist_URIs = []
    Playlist_ids = []
    tracks = []
    headers = {
        'Accept': 'application/json',
        'Authorization': f"Bearer {session['access_token']}"
    }
    print("access token works")
    #Songs that are not found are asked to be replaced newly generated songs by Google Gemini. This process repeats until the desired number of songs the user would like in their playlist has been met.
    while len(Playlist_URIs) != playlist_length:
        songs = generate_songs(playlist_length-len(Playlist_URIs), preferences,tracks)
        print(songs)
        if('' not in songs):
            for song_name,song_artist in songs:
                #Check if songs are available on spotify
                #Additional check for blank song_name and song_artist
                if song_name != '' and song_artist != '':
                    URL = api_base_url + "search?q=track%3A"+("+".join(song_name.split(' ')))+"+artist%3A"+("+".join(song_artist.split(' '))) + "&type=track&market=US&limit=1&offset=0"
                    Search_Item_Response = requests.get(URL,headers=headers)
                    if Search_Item_Response.status_code == 200:
                        track = Search_Item_Response.json()
                        try:
                            if(track["tracks"]["items"][0]["name"] not in tracks):
                                tracks.append(track["tracks"]["items"][0]["name"])
                                Playlist_URIs.append(track["tracks"]["items"][0]["uri"])
                            #Playlist_ids.append(track["tracks"]["items"][0]["id"])
                        except Exception as e:
                            print("This song could not be found")
    #return jsonify(tracks)
    #print(f"{Song_Artist}")
    #print(f"{Playlist_URIs}")
    print(f"{tracks}")
    #[len(track["tracks"]["items"])-1]

    URIs = {"uris": Playlist_URIs}
    try:
        playlist_id = create_spotify_playlist(name="PlaylistAI Mix", description="Generated by PlaylistAI", public=True)
    except Exception as e:
        print(f"Failed to create playlist: {e}")
        return jsonify({"error": "Failed to create playlist"}), 500
    print(playlist_id)
    try:
        #uris = str('%3A'.join(("%2C+".join(Playlist_URIs)).split(':')))
        #uris = "spotify%3Atrack%3A4iV5W9uYEdYUVa79Axb7Rh%2C+spotify%3Atrack%3A1301WleyT98MSxVHPZCA6M%2C+spotify%3Aepisode%3A512ojhOuo1ktJprKbVcKyQ"
        body = {
            "uris": Playlist_URIs,
            "position": 0
        }
        #ID = "3cn1uAOvjf7nBqXsIJKwCQ?si=eb391261806541c0"
        ID = str(playlist_id)
        #my_url = api_base_url+'playlists/'+ID+'/tracks?position=0&uris='+uris
        my_url = api_base_url+'playlists/'+ID+'/tracks'
        
        #Pass URIS through json payload
        Add_Item_Response = requests.post(my_url,headers=headers,json=URIs)
        #Add_Item_Response = requests.post(api_base_url+'playlists/'+ID+'/tracks?uris='+uris,headers=headers)
        response = Add_Item_Response.json()
        if(Add_Item_Response.status_code == 201):
            # Flask-CORS will automatically add the necessary CORS headers
            return jsonify({"Tracks": tracks, "URIs": Playlist_URIs, "playlist_id": playlist_id})
        else:
            # Flask-CORS will automatically add the necessary CORS headers
            return jsonify({"error": "Failed to add tracks", "details": response}), 400
    except Exception as e:
        print(e)
        # Flask-CORS will automatically add the necessary CORS headers
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    os.makedirs('./flask_session', exist_ok=True)
    app.run(host='0.0.0.0', debug=True,port=5000)