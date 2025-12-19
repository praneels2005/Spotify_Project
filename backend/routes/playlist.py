from flask import Blueprint, request, session, jsonify
import concurrent.futures
from ..config import Config
from ..services.spotify import SpotifyService
from ..services.ai import AIService

playlist_bp = Blueprint('playlist', __name__)

@playlist_bp.route('/Playlist_Generator', methods=['POST'])
def generate_playlist():
    # 1. Auth Check
    if 'access_token' not in session:
        return jsonify({"error": "Not authenticated", "redirect": "/login"}), 401
    
    # 2. Get Params
    data = request.get_json() or {}
    preferences = data.get('preferences')
    if not preferences:
        return jsonify({"error": "No preferences provided"}), 400
        
    playlist_length = preferences.get("playlistLength", 20)
    # Handle if frontend sends a list (legacy support)
    if isinstance(playlist_length, list):
        playlist_length = playlist_length[0]
        
    try:
        playlist_length = int(playlist_length)
    except:
        playlist_length = 20

    # 3. AI Generation
    # Request extra songs to buffer against those not found on Spotify
    buffer_count = max(5, int(playlist_length * 0.5)) # Request 50% more or at least 5
    target_ai_count = playlist_length + buffer_count
    
    ai_service = AIService()
    spotify_service = SpotifyService(Config.SPOTIFY_CLIENT_ID, Config.SPOTIFY_CLIENT_SECRET)
    
    try:
        # Generate raw song list with buffer
        ai_songs = ai_service.generate_playlist_params(preferences, count=target_ai_count)
    except Exception as e:
        return jsonify({"error": "AI Generation failed", "details": str(e)}), 500

    # 4. Spotify Search (Parallelized)
    found_tracks = []
    
    # Extract token from session in the main thread
    access_token = session['access_token']
    
    def search_worker(token, song_info):
        return spotify_service.search_track(
            token, 
            song_info.get('name'), 
            song_info.get('artist')
        )

    # Use ThreadPool to search faster
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        # Pass access_token explicitely to avoid context issues
        future_to_song = {executor.submit(search_worker, access_token, song): song for song in ai_songs}
        
        for future in concurrent.futures.as_completed(future_to_song):
            try:
                track = future.result()
                if track:
                    found_tracks.append(track)
            except Exception as e:
                print(f"Search error: {e}")

    # If we didn't get enough songs, we could potentially loop back to AI, 
    # but for now we'll just proceed with what we found (or the user's requested amount)
    if not found_tracks:
        return jsonify({"error": "No songs found on Spotify matching the criteria"}), 404
        
    # Trim to requested length if we found extra
    found_tracks = found_tracks[:playlist_length]

    track_uris = [t['uri'] for t in found_tracks]
    track_names = [f"{t['name']} - {t['artists'][0]['name']}" for t in found_tracks]

    # 5. Create Playlist
    try:
        user_id = session.get('spotify_user_id')
        if not user_id:
            # Try to fetch if missing
            profile = spotify_service.get_user_profile(session['access_token'])
            user_id = profile['id']
            session['spotify_user_id'] = user_id

        playlist = spotify_service.create_playlist(
            session['access_token'],
            user_id,
            name="AI Generated Mix",
            description=f"Generated based on: {preferences}",
            public=True
        )
        
        # 6. Add Tracks
        spotify_service.add_tracks_to_playlist(
            session['access_token'],
            playlist['id'],
            track_uris
        )
        
        return jsonify({
            "playlist_id": playlist['id'],
            "tracks": track_names,
            "count": len(found_tracks)
        })

    except Exception as e:
        print(f"Playlist creation failed: {e}")
        return jsonify({"error": "Failed to create playlist on Spotify", "details": str(e)}), 500

@playlist_bp.route('/Get_Playlists', methods=['GET'])
def get_playlists():
    if 'access_token' not in session:
        return jsonify({"error": "Not authenticated"}), 401
        
    spotify_service = SpotifyService(Config.SPOTIFY_CLIENT_ID, Config.SPOTIFY_CLIENT_SECRET)
    try:
        # Simplified for now, just getting user's playlists
        # Logic from main2.py could be adapted if specific playlist fetching is needed
        # But this route seemed generic in main2.py
        
        params = {"limit": 50}
        response = requests.get(
            f"{SpotifyService.BASE_URL}/me/playlists",
            headers=spotify_service.get_auth_headers(session['access_token']),
            params=params
        )
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500
