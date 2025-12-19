# Spotify Playlist Generator

Spotify Playlist Generator (also referred to as **Jam Genie**) is a full-stack tool that turns natural-language prompts and listening preferences into curated Spotify playlists. The Flask backend handles Spotify OAuth, talks to Google Gemini to propose tracks, and assembles playlists in the user’s Spotify account, while the Vite + React frontend guides users through authentication, preference capture, preview, and confirmation.

## Features
- **AI-assisted track selection** using Google Gemini to translate moods, artists, and activity prompts into candidate songs.
- **Secure Spotify OAuth** with session-backed login, refresh handling, and logout endpoints.
- **Playlist generation pipeline** that buffers AI results, parallelizes Spotify searches, and creates playlists with the requested length in the user’s account.
- **React experience** with saved state between reloads, guided preference entry, playlist previews, and success confirmation flows.

## Tech Stack
- **Backend:** Python 3, Flask, Flask-Session, Flask-CORS, Google Generative AI, Requests.
- **Frontend:** React 18, TypeScript, Vite, React Router, React Query, Tailwind CSS, shadcn/ui components.
- **Integrations:** Spotify Web API for auth + playlist management, Google Gemini for playlist suggestions.

## Repository Structure
```
Spotify_Project/
├── backend/               # Flask application factory, routes, and services
│   ├── app.py             # create_app() configuring sessions and CORS
│   ├── config.py          # environment-driven settings and validation
│   ├── routes/            # auth and playlist blueprints
│   └── services/          # Spotify and AI helper classes
├── UI_Front/jam-genie/    # Vite + React frontend (primary UI)
│   ├── src/components/    # Playlist workflow components
│   ├── src/lib/api.ts     # Frontend API client targeting the Flask backend
│   └── package.json       # Frontend dependencies and scripts
├── run.py                 # Backend entry point (starts Flask on :5000)
└── requirements.txt       # Python dependencies
```

## Prerequisites
- Python 3.8+
- Node.js 16+ and npm
- Spotify Developer credentials (Client ID and Client Secret)
- Google Gemini API key

## Backend Setup
1. **Create a virtual environment and install dependencies**
   ```bash
   cd Spotify_Project
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
2. **Configure environment variables** by creating a `.env` file in the project root:
   ```env
   CLIENT_ID=your_spotify_client_id
   CLIENT_SECRET=your_spotify_client_secret
   REDIRECT_URI=http://127.0.0.1:5000/callback
   GENAI_API_KEY=your_google_gemini_api_key
   FLASK_SECRET_KEY=your_flask_secret_key
   SERVER_NAME= # optional, useful for url_for in some deployments
   ```
3. **Run the Flask server**
   ```bash
   python run.py
   ```
   The server listens on `http://0.0.0.0:5000/` and stores sessions under `flask_session/` by default.

## Frontend Setup
1. **Install dependencies**
   ```bash
   cd Spotify_Project/UI_Front/jam-genie
   npm install
   ```
2. **Create a frontend `.env` file** in `UI_Front/jam-genie` to wire Spotify OAuth redirect values:
   ```env
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5000/callback
   ```
3. **Start the React dev server**
   ```bash
   npm run dev
   ```
   Vite defaults to `http://localhost:8080/` and communicates with the backend at `http://localhost:5000/` via the API client.

## Usage Flow
1. Start the **backend** and **frontend** in separate terminals.
2. From the web UI, click **Get started** to launch Spotify OAuth (handled by `/login`).
3. After authentication, visit `/preferences` to select moods, genres, artists, and playlist length; progress is persisted in local storage between refreshes.
4. Submit preferences to trigger AI track selection and Spotify search/creation. Preview the resulting track list and follow the success link to open the new playlist in Spotify.
5. Use the **Log out** control to clear the Flask session when finished.

## API Endpoints (Backend)
- `GET /login` – Start Spotify OAuth and redirect to the authorization page.
- `GET /callback` – Handle Spotify redirect, exchange the code for tokens, and store the user session.
- `GET /auth/status` – Check if the session is authenticated and refresh tokens when needed.
- `POST /Playlist_Generator` – Generate a playlist based on user preferences and create it in Spotify.
- `GET /Get_Playlists` – Fetch the authenticated user’s playlists from Spotify.
- `POST /logout` – Clear the session and remove cookies.

## Troubleshooting
- **Authentication failures:** Ensure `.env` contains valid Spotify credentials and that the redirect URI matches both Spotify app settings and the frontend `.env` value.
- **CORS or cookie issues:** The backend enables CORS for `localhost:8080` and uses signed session cookies; run both services on localhost to simplify development.
- **Missing AI responses:** Confirm `GENAI_API_KEY` is set; otherwise the AI service is disabled.

## Scripts
- **Backend:** `python run.py` (development server).
- **Frontend:** `npm run dev` (development), `npm run build` (production build), `npm run lint` (frontend linting).

## License
This project is provided as-is for personal experimentation with Spotify’s Web API and Google Gemini. Review Spotify’s Developer Terms and API usage policies before deploying publicly.
