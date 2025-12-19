Spotify Playlist Generator is a personalized playlist creation tool that uses AI to generate mood- or activity-based playlists directly in a user's Spotify account. By integrating the Spotify Web API with Google’s Gemini API, users can input prompts with their own personalized twists.

The output is a directly recieved curated set of tracks in the user's spotify account tailored to their musical taste and current mood.

**Set-up**

**1. Set up your Environment**

git clone https://github.com/praneels2005/Spotify_Project.git
cd Spotify_Project
pip install -r requirements.txt

**2. Configure environment variables**

SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5000/callback
GEMINI_API_KEY=your_google_gemini_api_key

**3. Prompt Google Gemini API**
User inputs a mood, genre, or activity (e.g., “hype gym pop”).

This prompt is passed to the Gemini API to return a list of recommended artists, moods, and potential tracks.

**Prompt example:**

- "Generate a playlist for a rainy afternoon with indie and acoustic vibes"
- “10 Latest songs by <artist name>”
- “chill study beats”

**4. Spotify Playlist Creation**

The Flask backend searches for relevant tracks via Spotify’s search endpoint.

A new playlist is created and populated in the user's account

