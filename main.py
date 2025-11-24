#Client credential flow
#- can't access user data
#- Cannot refresh access token(Only lasts for an hour)
#The Client Credentials Flow is specifically designed for non-user-specific access, where the application itself authenticates and retrieves an access token to access resources
from dotenv import load_dotenv
import os
import base64
import requests
#from requests import post
import json
import spotipy
load_dotenv()

client_id = os.getenv("CLIENT_ID")
client_secret = os.getenv("CLIENT_SECRET")


#1st step
#This is what is used IN future headers to send requests to the API to get information from spotify
#Access token gives app developer authorization to acccess information from spotify
def get_token():
    
    auth_string = client_id + ":" + client_secret
    
    #Passed to spotify service with http request header
    auth_bytes = auth_string.encode('utf-8')
    #Converting authorization string into base64
    auth_base64 = str(base64.b64encode(auth_bytes), "utf-8")

    #Request message will be sent to this endpoint URL
    url = "https://accounts.spotify.com/api/token"
    headers = {
        "Authorization":"Basic " + auth_base64,
        "Content-Type":"application/x-www-form-urlencoded"
    }
    
    data = {"grant_type":"client_credentials"}
    #Sends back http response message
    result = requests.post(url, headers=headers, data=data)
    if result.status_code == 200:
        '''    
        # Access the response content
            content = result.content  # Raw bytes
            text = result.text        # Decoded as a string
            json_data = result.json()  # Parsed as JSON (if applicable)
        '''
        #Converting into a python dictionary
        json_result = result.json()
    
    #accessing "access_token" within returned json file
    #token expires in 1 hour
        token = json_result['access_token']
        #print(json_result)
        return token
    else:
        print("Response failed, will status code:", result.status_code)
        
# performs the API call to the Get Current User's Profile endpoint to retrieve the user profile related information
def get_auth_header(access_token):
    return {"Authorization": "Bearer "+access_token}

#Search for an artist, find the artist we are looking for, get their ID, and get the tracks associated with them
def search_for_artist(token, artist_name):
    url = "https://api.spotify.com/v1/search"
    headers = get_auth_header(token)
    #Querying for artist
    query = f"q={artist_name}&type=artist&limit=1"
    
    #Example Query: 'https://api.spotify.com/v1/search?q=remaster%2520track%3ADoxy%2520artist%3AMiles%2520Davis&type=artist'
    query_url = url + "?" + query 
    result = requests.get(query_url, headers=headers)
    json_result = result.json()["artists"]["items"]
    if(len(json_result) == 0):
        print("No artist with this name exists")
        return None
    return json_result[0]

def get_songs_by_artist(token, artist_id):
    url = "https://api.spotify.com/v1/artists/"+artist_id+"/top-tracks?country=US"
    headers = get_auth_header(token)
    
    result = requests.get(url, headers=headers)
    json_result = result.json()
    return json_result["tracks"]

def get_user_id(token):
    url = "https://api.spotify.com/v1/me"
    headers = get_auth_header(token)
    
    result = requests.get(url, headers=headers)
    return result.json()
    
    

token = get_token()

result = search_for_artist(token, "Michael Jackson")
#print(result["name"])
artist_id = result["id"]
songs = get_songs_by_artist(token, artist_id)
#print(songs[0]['name'])
#print(get_user_id(token))
index = 1
for i in songs:
    print(str(index) + ". " + i["name"])
    index+=1