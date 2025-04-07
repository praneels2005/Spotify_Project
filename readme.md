Spotify Playlist Generator is a personalized playlist creation tool that uses AI to generate mood- or activity-based playlists directly in a user's Spotify account. 
By integrating the Spotify Web API with Google’s Gemini API, users can input specific prompts with their own twists:

- “chill study beats”
- “10 Latest songs by <artist name>”
- “Workout with 2000s rock”
- "Generate a playlist for a rainy afternoon with indie and acoustic vibes"

The output is a directly recieved curated set of tracks in the user's spotify account tailored to their musical taste and current mood.

Key features include:
- OAuth 2.0 Authentication: Seamless Spotify login via OAuth flow, allowing users to securely connect their Spotify accounts.
- Flask Backend: Python Flask server with routes for authentication, token management, and API interaction.
- AI-Powered Suggestions: Playlist generation via the Google Gemini API based on natural language prompts (e.g., mood, activity, genre).
- Playlist Creation: Automatically creates and populates a new Spotify playlist directly in the user’s library.
- Scalable Foundation: Modular backend structure ready for frontend integration or further expansion (e.g., saving prompt history, user analytics).

