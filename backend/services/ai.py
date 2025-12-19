import os
import json
import google.generativeai as genai
from ..config import Config

class AIService:
    def __init__(self):
        if Config.GENAI_API_KEY:
            genai.configure(api_key=Config.GENAI_API_KEY)
            self.model = genai.GenerativeModel('gemini-2.0-flash')
        else:
            self.model = None

    def generate_playlist_params(self, preferences, count=20, exclude_tracks=None):
        """
        Generates a list of songs based on preferences.
        Returns a list of dictionaries: [{"name": "Song Name", "artist": "Artist Name"}]
        """
        if not self.model:
            raise Exception("AI Service not configured (missing API Key)")

        exclude_text = ""
        if exclude_tracks:
            exclude_text = f"Ensure no songs are repeated from this list: {json.dumps(exclude_tracks)}."

        prompt = f"""
        You are a professional DJ and playlist curator.
        Generate a unique list of {count} songs based on the following preferences: {json.dumps(preferences)}.
        {exclude_text}
        
        The output must be a strict JSON array of objects.
        Each object must have exactly these keys: "name", "artist".
        Do not include markdown formatting like ```json ... ```. 
        Just return the raw JSON array.
        """
        
        try:
            # Using generation_config to enforce JSON if possible, or just relying on the prompt
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            if not response.text:
                raise Exception("Empty response from AI")
                
            songs = json.loads(response.text)
            
            # basic validation
            if not isinstance(songs, list):
                raise ValueError("AI did not return a list")
                
            return songs
            
        except Exception as e:
            print(f"AI Generation Error: {e}")
            raise Exception(f"Failed to generate playlist: {str(e)}")
