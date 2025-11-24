from google import genai
from google.genai import types
from google.genai import Client
import os

client = genai.Client(api_key=os.getenv("GENAI_API_KEY"))
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents='Are you able to generate a list of 10 songs that are from the artist "The Weeknd"?',
)
print(response.text)