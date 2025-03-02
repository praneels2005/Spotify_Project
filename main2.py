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
import datetime
from dotenv import load_dotenv
import os
import base64
import re
import requests
#from requests import post
import json
import spotipy
from flask import Flask,redirect, request, jsonify, session
from datetime import datetime, timedelta
import urllib.parse
from openai import OpenAI
import time
load_dotenv()

#Intialize Flask app
app = Flask(__name__)
app.secret_key = 'praneel2005'

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
    return "Welcome to my Spotiy App <a href='/login'>Login with Spotify</a>"

@app.route('/login')
def login():
    #scope = 'user-read-private user-read-email'
    scope = 'user-read-email playlist-modify-public'
    
    params = {
        "client_id":client_id,
        "response_type":"code",
        "scope":scope,
        "redirect_uri": redirect_uri,
        'show_dialog': True
    }
    
    #Creates authorization URL for get request to spotify API
    auth_url = f"{AUTH_URL}?{urllib.parse.urlencode(params)}"
    
    #Returns response to the request sent from Flask server
    return redirect(auth_url)

@app.route('/callback')
def callback():
    #Respponses returned to flask from spotify
    if 'error' in request.args:
        return jsonify({"error": request.args['error']})
    
    if 'code' in request.args:
        req_body = {
            'code': request.args['code'],
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri,
            'client_id': client_id,
            'client_secret': client_secret
        }
        
        response = requests.post(token_url, data=req_body)
        token_info = response.json()
        
        #Reuqests to spotify API
        session['access_token']= access_token = token_info['access_token']
        
        #Refresh access token
        session['refresh_token']=refresh_token = token_info['refresh_token']
        
        #Validity of access token
        session['expires_at'] = datetime.now().timestamp()+token_info['expires_in']
        
        #return redirect('/Create_Playlist')
        return redirect('/Playlist_Generator')
    
@app.route('/Get_Playlists')
def get_playlists(Playlist_ID):
    if 'access_token' not in session:
        return redirect('/login')
    
    if session['expires_at'] < datetime.now().timestamp():
        return redirect('/refresh-token')
    
    headers = {
        'Authorization': f"Bearer {session['access_token']}"
    }
    
    response = requests.get(api_base_url + 'me/playlists/'+Playlist_ID, headers=headers)
    playlists = response.json()
    
    return playlists

@app.route('/Create_Playlist')
def create_playlist():
    
    if 'access_token' not in session:
        return redirect('/login')
    
    if session['expires_at'] < datetime.now().timestamp():
        return redirect('/refresh-token')

    headers = {
        'Authorization': f"Bearer {session['access_token']}"
    }
    

    form_data = {
        "name": "Opium Playlist",
        "description": "Yuh",
        "public": True
    }
    
    #The documentation states how the body must be passed in the request message(e.g. application/json)
    try:
        response = requests.post(api_base_url+'users/'+user_id+'/playlists',headers=headers, json=form_data)
        new_playlist = response.json()
        playlist_id = new_playlist["id"]
        
        #print(playlist_id)
        return playlist_id
    except Exception as e:
        print(e)
    
    
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
def generate_songs(Number_Songs, genre, Curr_songs):
    genai.configure(api_key=os.getenv("GENAI_API_KEY"))
    model = genai.GenerativeModel("gemini-1.5-pro-001")
    #Hard coded # of songs to generate for playlist and genre
    #The formatting of the list genereated by AI is manipulated
    prompt = f"""You are a playlist generator service. Give me a unique list of {Number_Songs} songs that are either by Travis Scott or The Weeknd and provide their names followed by the artists. Reference songs from ALL of the artist's albums. Ensure no songs are repeated from the given context file: {Curr_songs}. Provide the list in the following format:

<Song Name> - <Song Artist>

Do NOT precede or follow the list with any description."""

    #response = model.generate_content(f"You are a playlist generator service. Give me a new list of {Number_Songs} songs that are {genre} and provide their names followed by the artists. Do NOT follow the list with any description.")
    response = model.generate_content(f"{prompt}")
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

@app.route('/Playlist_Generator')
def playlist_generation():
    #Example URL: https://api.spotify.com/v1/search?q=track%3ATimeless+artist%3AThe+Weeknd&type=track&market=US&limit=1&offset=0
    Num_Songs = 20
    genre = "Rock"
    Playlist_URIs = []
    Playlist_ids = []
    tracks = []
    headers = {
        'Accept': 'application/json',
        'Authorization': f"Bearer {session['access_token']}"
    }
    #Songs that are not found are asked to be replaced newly generated songs by Google Gemini. This process repeats until the desired number of songs the user would like in their playlist has been met.
    while len(Playlist_URIs) != Num_Songs:
        songs = generate_songs(Num_Songs-len(Playlist_URIs), genre,tracks)
        print(songs)
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
    print(f"{Playlist_URIs}")
    #[len(track["tracks"]["items"])-1]

    URIs = {"uris": Playlist_URIs}
    playlist_id = create_playlist()
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
                #return jsonify(getTrack(Playlist_ids))
        if(Add_Item_Response.status_code == 201):
            return jsonify(response)
        else:
            return jsonify(getTrack(Playlist_ids))
        #return jsonify("Invalid base62 ID" + my_url)
    except Exception as e:
        print(e)
    

@app.route('/refresh-token')
def get_refresh_token():
    if 'refresh_token' not in session:
        return redirect('/login')
    
    if session['expires_at'] < datetime.now().timestamp():
        #Send request to obtian new access token
        req_body = {
            'grant_type': 'refresh_token',
            'refresh_token': session['refresh_token'],
            'client_id': client_id,
            'client_secret': client_secret
        }
        
        response = requests.post(token_url, data=req_body)
        new_token_info = response.json()
        
        #Override the info of the current access token
        session['access_token'] = new_token_info['access_token']
        session['expires_at'] = datetime.now().timestamp()+new_token_info['expires_in']
        
        return redirect('/Playlist_Generator')
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
