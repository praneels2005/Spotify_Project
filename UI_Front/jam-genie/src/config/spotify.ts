export const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? "";
export const SPOTIFY_AUTHORIZE_ENDPOINT = "https://accounts.spotify.com/authorize";
export const REDIRECT_URL_AFTER_LOGIN = import.meta.env.VITE_SPOTIFY_REDIRECT_URI ?? "http://localhost:5000/callback";
export const scope = "user-read-email playlist-modify-public playlist-modify-private";
export const responseType = "code";
export const showDialog = "true";