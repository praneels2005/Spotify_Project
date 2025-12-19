import { useState, useEffect } from "react";
import LandingPage from "./LandingPage";
import PreferenceInput from "./PreferenceInput";
import PlaylistPreview from "./PlaylistPreview";
import SuccessPage from "./SuccessPage";
import { getPlaylists, startAuth } from "@/lib/api";
import { Navigate } from "react-router-dom";
import {
  CLIENT_ID,
  SPOTIFY_AUTHORIZE_ENDPOINT,
  REDIRECT_URL_AFTER_LOGIN,
  scope,
  responseType,
  showDialog,
} from "@/config/spotify";
import { authService } from "@/lib/api";
import { usePreferences } from "@/context/PreferencesContext";

type AppStep = "landing" | "auth" | "preferences" | "preview" | "success";

interface Preferences {
  genres: string[];
  moods: string[];
  artists: string[];
  decades: string[];
  energy: number[];
  danceability: number[];
  playlistLength: number[];
}

interface GeneratedPlaylist {
  name: string;
  NumSongs: number[];
  totalDuration: string;
  Tracks: string[];
  genres: string[];
  playlist_id?: string;
}

const LOCAL_STORAGE_KEY = "spotify_playlist_generator_state";

const SpotifyPlaylistGenerator = () => {
  const { preferences, setPreferences } = usePreferences();
  const [currentStep, setCurrentStep] = useState<AppStep>("landing");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<GeneratedPlaylist | null>(null);

useEffect(()=>{
  checkAuthentication();
},[]);

  // ---- Load state from localStorage on first render ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        currentStep?: AppStep;
        preferences?: Preferences;
        generatedPlaylist?: GeneratedPlaylist | null;
      };

      if (parsed.currentStep) {
        setCurrentStep(parsed.currentStep);
      }

      if (parsed.preferences) {
        setPreferences(parsed.preferences);
      }

      if (parsed.generatedPlaylist) {
        setGeneratedPlaylist(parsed.generatedPlaylist);
      }
    } catch (err) {
      console.error("Failed to load persisted app state:", err);
    }
  }, [setPreferences]);

  // ---- Persist state to localStorage whenever it changes ----
  useEffect(() => {
    try {
      const stateToStore = {
        currentStep,
        preferences,
        generatedPlaylist,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToStore));
    } catch (err) {
      console.error("Failed to persist app state:", err);
    }
  }, [currentStep, preferences, generatedPlaylist]);

  const clearPersistedState = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (err) {
      console.error("Failed to clear persisted app state:", err);
    }
  };

  // ---- NEW: Check authentication status ----
  const checkAuthentication = async () => {
    setIsCheckingAuth(true);
    
    try {
      const authed = await authService.checkAuthStatus();
      setIsAuthenticated(authed);
      
      // If authenticated and on landing page, go to preferences
      if (authed && currentStep === "landing") {
        setCurrentStep("preferences");
      }

     // If not authenticated and not on landing page, go to landing
      if (!authed && currentStep !== "landing") {
        setCurrentStep("landing");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };
  // const getReturnedParamsFromURL = (url: string) => {
  //   const hash = url.split("#")[1];
  //   const params = new URLSearchParams(hash);
  //   console.log("access Token: ", params.get("access_token"));
  //   console.log("token type: ", params.get("token_type"));
  //   console.log("expires in: ", params.get("expires_in"));
  //   return {
  //     accessToken: params.get("access_token"),
  //     tokenType: params.get("token_type"),
  //     expiresIn: params.get("expires_in"),
  //   };
  // };

  const handleStartAuth = () => {
    console.log("Starting Spotify OAuth...");

    // const authUrl = `${SPOTIFY_AUTHORIZE_ENDPOINT}?client_id=${CLIENT_ID}&response_type=${responseType}&redirect_uri=${REDIRECT_URL_AFTER_LOGIN}&scope=${encodeURIComponent(
    //   scope
    // )}&show_dialog=${showDialog}`;
    // location.assign(authUrl);

authService.initiateLogin()
    // After redirect back from Spotify, you'd parse the hash and continue.
    // setTimeout(() => {
    //   setCurrentStep("preferences");
    // }, 1000);
  };

  const handleGeneratePlaylist = (playlist: GeneratedPlaylist) => {
    try {
      console.log("Received generated playlist:", playlist);
      // The API call is already made in PreferenceInput component
      // This function just updates the state with the received playlist
      if (!playlist || !playlist.Tracks) {
        console.error("Invalid playlist data received:", playlist);
        return;
      }
      setGeneratedPlaylist(playlist);
      setCurrentStep("preview");
    } catch (error) {
      console.error("Error handling generated playlist:", error);
      // Don't throw - the playlist was already created successfully
    }
  };

  const handleSavePlaylist = (name: string, tracks: []) => {
    console.log("Saving playlist:", name, tracks);
    setCurrentStep("success");
  };

  const handleRegeneratePlaylist = () => {
    setCurrentStep("preferences");
  };

  const handleCreateAnother = () => {
    setCurrentStep("preferences");
    setGeneratedPlaylist(null);
    // keep preferences here so they can tweak them; if you want a totally clean slate:
    // setPreferences({
    //   genres: [],
    //   moods: [],
    //   artists: [],
    //   decades: [],
    //   energy: [],
    //   danceability: [],
    //   playlistLength: [],
    // });
  };

  const handleBackHome = async () => {
    await authService.logout();

    setIsAuthenticated(false);
    setCurrentStep("landing");
    setGeneratedPlaylist(null);
    // full wipe: preferences + localStorage
    setPreferences({
      genres: [],
      moods: [],
      artists: [],
      decades: [],
      energy: [],
      danceability: [],
      playlistLength: [],
    });
    clearPersistedState();
  };

  const generatePlaylistName = (prefs: Preferences): string => {
    const moodName = prefs.moods[0] || "Amazing";
    const genreName = prefs.genres[0] || "Music";
    const names = [
      `${moodName} ${genreName} Vibes`,
      `My ${moodName} Mix`,
      `${genreName} Discovery`,
      `${moodName} ${genreName} Journey`,
      `Perfect ${moodName} Playlist`,
    ];
    return names[Math.floor(Math.random() * names.length)];
  };

   // NEW: Helper to calculate duration
  const calculateDuration = (trackCount: number): string => {
    const totalMinutes = trackCount * 3; // Estimate 3 minutes per track
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 
      ? `${hours}:${minutes.toString().padStart(2, '0')}:00` 
      : `${minutes}:00`;
  };
   // ---- Show loading while checking auth ----
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spotify-green mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Render based on current step
  switch (currentStep) {
    case "landing":
      return <LandingPage onStartAuth={handleStartAuth} />;

    case "preferences":
      /// Protect this route - require authentication
      if (!isAuthenticated) {
        return <LandingPage onStartAuth={handleStartAuth} />;
      }
      return <PreferenceInput onGenerate={handleGeneratePlaylist} />;

    case "preview":
      if(!isAuthenticated){
        return <LandingPage onStartAuth={handleStartAuth} />;
      }
      return generatedPlaylist ? (
        <PlaylistPreview
          playlist={generatedPlaylist}
          onSave={handleSavePlaylist}
          onRegenerate={handleRegeneratePlaylist}
        />
      ) : null;

    case "success": {
      if (!isAuthenticated) {
        return <LandingPage onStartAuth={handleStartAuth} />;
      }
      // Construct Spotify playlist URL from playlist_id
      const playlistUrl = generatedPlaylist?.playlist_id
        ? `https://open.spotify.com/playlist/${generatedPlaylist.playlist_id}`
        : "#";
      
      
      // Use actual track count from Tracks array, not requested length
      const actualTrackCount =
      generatedPlaylist?.Tracks?.length ||
      generatedPlaylist?.NumSongs?.[0] ||
      25;      
      return (
        <SuccessPage
          playlistName={generatedPlaylist?.name || "Your Playlist"}
          trackCount={actualTrackCount}
          playlistUrl={playlistUrl}
          onCreateAnother={handleCreateAnother}
          onBackHome={handleBackHome}
        />
      );
    }

    default:
      return <LandingPage onStartAuth={handleStartAuth} />;
  }
};

export default SpotifyPlaylistGenerator;
