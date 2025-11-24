import React, { useState,useEffect, createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music, Zap, Clock, Users, ArrowRight, Shuffle } from "lucide-react";
// import axios from "axios";
import { playlistService } from "@/lib/api"; // Updated import
import type { Preferences } from "@/lib/api";
 


interface PreferenceInputProps {
  onGenerate: (playlist) => void;
}

export const PreferenceInput: React.FC<PreferenceInputProps> = ({ onGenerate }) => {
  const [preferences, setPreferences] = useState<Preferences>({
    genres: [],
    moods: [],
    artists: [],
    decades: [],
    energy: [50],
    danceability: [50],
    playlistLength: [25],
  });


  const [customArtist, setCustomArtist] = useState("");
  // const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const genres = [
    "Pop", "Rock", "Hip-Hop", "Electronic", "Jazz", "Classical", 
    "R&B", "Country", "Indie", "Alternative", "Funk", "Blues"
  ];

  const moods = [
    "Energetic", "Chill", "Happy", "Melancholic", "Romantic", "Focus",
    "Party", "Workout", "Relaxing", "Nostalgic", "Uplifting", "Dreamy"
  ];

  const decades = ["2020s", "2010s", "2000s", "90s", "80s", "70s", "60s", "50s"];

  // Add useEffect to get token from URL
// useEffect(() => {
//   // Get session token from URL parameter
//   const params = new URLSearchParams(window.location.search);
//   const token = params.get('session_token');
  
//   if (token) {
//     setSessionToken(token);
//     // Store in localStorage for persistence
//     localStorage.setItem('spotify_session_token', token);
//     // Clean URL
//     window.history.replaceState({}, '', '/preferences');
//   } else {
//     // Try to get from localStorage
//     const stored = localStorage.getItem('spotify_session_token');
//     if (stored) {
//       setSessionToken(stored);
//     }
//   }
// }, []);
  
  const toggleSelection = (category: keyof Pick<Preferences, 'genres' | 'moods' | 'decades'>, item: string) => {
    setPreferences(prev => ({
      ...prev,
      [category]: prev[category].includes(item)
        ? prev[category].filter(i => i !== item)
        : [...prev[category], item]
    }));
  };

  const addArtist = () => {
    if (customArtist.trim() && !preferences.artists.includes(customArtist.trim())) {
      setPreferences(prev => ({
        ...prev,
        artists: [...prev.artists, customArtist.trim()]
      }));
      setCustomArtist("");
    }
  };

  const removeArtist = (artist: string) => {
    setPreferences(prev => ({
      ...prev,
      artists: prev.artists.filter(a => a !== artist)
    }));
  };

  const handleSurpriseMe = () => {
    // Generate random preferences
    const randomGenres = genres.sort(() => 0.5 - Math.random()).slice(0, 3);
    const randomMoods = moods.sort(() => 0.5 - Math.random()).slice(0, 2);
    const randomDecade = decades[Math.floor(Math.random() * decades.length)];
    
    const surprisePrefs: Preferences = {
      genres: randomGenres,
      moods: randomMoods,
      artists: [],
      decades: [randomDecade],
      energy: [Math.floor(Math.random() * 100)],
      danceability: [Math.floor(Math.random() * 100)],
      playlistLength: [20 + Math.floor(Math.random() * 30)],
    };
    
    setPreferences(surprisePrefs);
  };

  const handleGenerate = async () => {
    // Validation
    if (preferences.genres.length === 0) {
      setError('Please select at least one genre');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await playlistService.generatePlaylist(preferences);
      
      // Validate response structure
      if (!response || !response.Tracks || !Array.isArray(response.Tracks)) {
        throw new Error('Invalid response from server: missing tracks data');
      }
      
      const playlist = {
        name: generatePlaylistName(preferences),
        NumSongs: preferences.playlistLength,
        Tracks: response.Tracks,
        totalDuration: calculateDuration(response.Tracks.length),
        genres: preferences.genres.slice(0, 3),
        playlist_id: response.playlist_id,
      };

      // Clear any previous errors since we successfully generated the playlist
      setError(null);
      
      // Call onGenerate and handle any errors it might throw
      try {
        onGenerate(playlist);
      } catch (generateError) {
        console.error('Error in onGenerate callback:', generateError);
        // Don't show error to user if playlist was successfully created
        // Just proceed to preview step
      }
    } catch (err) {
      setError(err.message || 'Failed to generate playlist');
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };
  const generatePlaylistName = (preferences: Preferences): string => {
    const moodName = preferences.moods[0] || "Amazing";
    const genreName = preferences.genres[0] || "Music";
    const names = [
      `${moodName} ${genreName} Vibes`,
      `My ${moodName} Mix`,
      `${genreName} Discovery`,
      `${moodName} ${genreName} Journey`,
      `Perfect ${moodName} Playlist`,
    ];
    return names[Math.floor(Math.random() * names.length)];
  };
  const calculateDuration = (trackCount: number): string => {
    // Estimate 3 minutes per track
    const totalMinutes = trackCount * 3;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}:00` : `${minutes}:00`;
  };

  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Customize Your 
            <span className="bg-gradient-music bg-clip-text text-transparent"> Playlist</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Tell us what you're in the mood for and we'll create the perfect mix
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Genres */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5 text-music-purple" />
                Genres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <Badge
                    key={genre}
                    variant={preferences.genres.includes(genre) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      preferences.genres.includes(genre) 
                        ? "bg-music-purple hover:bg-music-purple/80" 
                        : "hover:bg-music-purple/20"
                    }`}
                    onClick={() => toggleSelection('genres', genre)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Moods */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-music-orange" />
                Moods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {moods.map(mood => (
                  <Badge
                    key={mood}
                    variant={preferences.moods.includes(mood) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      preferences.moods.includes(mood) 
                        ? "bg-music-orange hover:bg-music-orange/80" 
                        : "hover:bg-music-orange/20"
                    }`}
                    onClick={() => toggleSelection('moods', mood)}
                  >
                    {mood}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Artists */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-spotify-green" />
                Favorite Artists
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Add an artist..."
                  value={customArtist}
                  onChange={(e) => setCustomArtist(e.target.value)}
                  className="bg-muted border-border"
                />
                <Button onClick={addArtist} size="sm">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.artists.map(artist => (
                  <Badge
                    key={artist}
                    className="bg-spotify-green hover:bg-spotify-green/80 cursor-pointer"
                    onClick={() => removeArtist(artist)}
                  >
                    {artist} ×
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Decades */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-music-pink" />
                Decades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {decades.map(decade => (
                  <Badge
                    key={decade}
                    variant={preferences.decades.includes(decade) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      preferences.decades.includes(decade) 
                        ? "bg-music-pink hover:bg-music-pink/80" 
                        : "hover:bg-music-pink/20"
                    }`}
                    onClick={() => toggleSelection('decades', decade)}
                  >
                    {decade}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm">Energy Level</CardTitle>
            </CardHeader>
            <CardContent>
              <Slider
                value={preferences.energy}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, energy: value }))}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="text-center mt-2 text-sm text-muted-foreground">
                {preferences.energy[0]}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm">Danceability</CardTitle>
            </CardHeader>
            <CardContent>
              <Slider
                value={preferences.danceability}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, danceability: value }))}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="text-center mt-2 text-sm text-muted-foreground">
                {preferences.danceability[0]}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm">Playlist Length</CardTitle>
            </CardHeader>
            <CardContent>
              <Slider
                value={preferences.playlistLength}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, playlistLength: value }))}
                min={10}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="text-center mt-2 text-sm text-muted-foreground">
                {preferences.playlistLength[0]} songs
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center">
            {error}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button
            variant="gradient"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="text-lg px-8 py-6"
          >
            <ArrowRight className="w-5 h-5" />
            {isGenerating ? 'Generating...' : 'Generate Playlist'}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleSurpriseMe}
            className="text-lg px-8 py-6"
          >
            <Shuffle className="w-5 h-5" />
            Surprise Me!
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PreferenceInput;