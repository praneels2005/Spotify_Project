import React from "react";

const API_BASE = 'http://localhost:5000';


//Authentication Service

export interface Preferences {
  genres: string[];
  moods: string[];
  artists: string[];
  decades: string[];
  energy: number[];
  danceability: number[];
  playlistLength: number[];
}


export interface AuthStatus {
  authenticated: boolean;
  expires_at?: number;
}

export const authService = {
  /**
   * Redirect user to backend login endpoint to start OAuth flow
   */
  initiateLogin() {
    const redirectUrl = encodeURIComponent('http://localhost:8080/preferences');
    window.location.href = `${API_BASE}/login?redirect=${redirectUrl}`;
  },

  /**
   * Check if user is authenticated with valid session
   */
  async checkAuthStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/auth/status`, {
        method: 'GET',
        credentials: 'include', // CRITICAL: This sends the session cookie
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data: AuthStatus = await response.json();
        return data.authenticated;
      }
      
      return false;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  },
  /**
   * Logout user and clear session
   */
  async logout() {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        credentials: 'include',
         headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
};

//Playlist Service

export interface PlaylistGenerationResponse {
  Tracks: string[];
  URIs: string[];
  playlist_id?: string;
  playlist_url?: string;
}

export interface PlaylistData {
  id: string;
  name: string;
  description: string;
  tracks: {
    total: number;
  };
}

export const playlistService = {
  /**
   * Generate playlist based on user preferences
   */
  async generatePlaylist(preferences: Preferences): Promise<PlaylistGenerationResponse> {
    try {
      console.log('Sending playlist generation request with preferences:', preferences);

      const response = await fetch(`${API_BASE}/Playlist_Generator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Critical: includes session cookie
        body: JSON.stringify({ preferences }),
      });

      // Handle authentication errors
      if (response.status === 401) {
        const errorData = await response.json();
        
        // Check if we need to redirect to login
        if (errorData.redirect === '/login') {
          authService.initiateLogin();
          throw new Error('Session expired. Redirecting to login...');
        }
        
        throw new Error('Not authenticated');
      }

      // Handle other errors
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate playlist');
      }

      const data: PlaylistGenerationResponse = await response.json();
      console.log('Playlist generation successful:', data);

      return data;
    } catch (error) {
      console.error('Playlist generation error:', error);
      throw error;
    }
  },

  /**
   * Get user's playlists from Spotify
   * @param playlistId Optional playlist ID to get specific playlist
   */
  async getPlaylists(playlistId?: string): Promise<PlaylistData | PlaylistData[]> {
    try {
      const endpoint = playlistId 
        ? `${API_BASE}/Get_Playlists/${playlistId}`
        : `${API_BASE}/Get_Playlists`;
      
      const response = await fetch(endpoint, {
        credentials: 'include',
      });

      if (response.status === 401) {
        authService.initiateLogin();
        throw new Error('Not authenticated');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch playlists');
      }

      return response.json();
    } catch (error) {
      console.error('Get playlists error:', error);
      throw error;
    }
  }
};

export async function startAuth(){
  authService.initiateLogin();
}

export async function getPlaylists(){
  return playlistService.getPlaylists();
}

export class APIError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

// export async function getPlaylists() {
//   const res = await fetch("http://localhost:5000/Get_Playlists");
//   return res.json();
// }

// export async function startAuth() {
//   const res = await fetch("http://localhost:5000/");
//   // Check if the response is a redirect and get the Location header
//   if (res.redirected && res.url) {
//     // Redirect the browser to the Spotify authorization URL
//     window.location.href = res.url;
//   } else {
//     // Handle cases where the server did not return a redirect as expected
//     console.error("Authentication failed: Expected a redirect.");
//   }
// }