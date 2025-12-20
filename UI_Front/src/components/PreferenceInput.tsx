import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Music, Zap, Clock, Users, ArrowRight, Shuffle, Plus, Waves, Activity, Sparkles, X, PenTool } from "lucide-react";
import { playlistService } from "@/lib/api";
import type { Preferences } from "@/lib/api";
import { SonicIdentity } from "./SonicIdentity";

interface PreferenceInputProps {
  onGenerate: (playlist: any) => void;
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
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Computed values for Sonic Identity
  const identityData = {
    energy: preferences.energy[0],
    danceability: preferences.danceability[0],
    length: (preferences.playlistLength[0] / 100) * 100, // Normalize to 100
    variety: Math.min((preferences.genres.length * 20), 100), // 5 genres = 100%
    mood: Math.min((preferences.moods.length * 30), 100),
  };

  const genres = [
    { name: "Pop", color: "from-pink-500 to-rose-500" },
    { name: "Rock", color: "from-red-600 to-orange-700" },
    { name: "Hip-Hop", color: "from-orange-500 to-amber-500" },
    { name: "Electronic", color: "from-blue-500 to-cyan-500" },
    { name: "Jazz", color: "from-yellow-500 to-amber-600" },
    { name: "Classical", color: "from-indigo-500 to-purple-600" },
    { name: "R&B", color: "from-purple-500 to-pink-600" },
    { name: "Country", color: "from-amber-600 to-orange-700" },
    { name: "Indie", color: "from-teal-500 to-emerald-500" },
    { name: "Alternative", color: "from-cyan-500 to-blue-600" },
    { name: "Funk", color: "from-lime-500 to-green-600" },
    { name: "Blues", color: "from-sky-600 to-blue-700" }
  ];

  const moods = [
    "Energetic", "Chill", "Happy", "Melancholic", "Romantic", "Focus",
    "Party", "Workout", "Relaxing", "Nostalgic", "Uplifting", "Dreamy"
  ];

  const decades = ["2020s", "2010s", "2000s", "90s", "80s", "70s", "60s", "50s"];

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
    const randomGenres = genres.sort(() => 0.5 - Math.random()).slice(0, 3).map(g => g.name);
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
    if (preferences.genres.length === 0) {
      setError('Please select at least one genre');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const prefsToSend = {
        ...preferences,
        playlistName: playlistName.trim() || generatePlaylistName(preferences),
        playlistDescription: playlistDescription.trim()
      };

      const response = await playlistService.generatePreview(prefsToSend);
      // New backend returns { tracks: Track[], count: number }

      const playlist = {
        name: prefsToSend.playlistName,
        description: prefsToSend.playlistDescription,
        NumSongs: preferences.playlistLength,
        Tracks: response.tracks,
        totalDuration: response.totalDuration || "Unknown",
        genres: preferences.genres.slice(0, 3),
        playlist_id: "preview", // Placeholder
      };

      onGenerate(playlist);
    } catch (err: any) {
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
    const totalMinutes = trackCount * 3;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}:00` : `${minutes}:00`;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Col: Main Controls */}
        <div className="lg:col-span-8 space-y-8">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Craft Your
              <span className="bg-gradient-music bg-clip-text text-transparent ml-3">Mix</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Fine-tune parameters to create your perfect sonic journey.
            </p>
          </div>

          {/* Genres Grid */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Music className="w-5 h-5 text-music-purple" />
              <h2 className="text-xl font-semibold">Select Genres</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {genres.map(genre => {
                const isSelected = preferences.genres.includes(genre.name);
                return (
                  <div
                    key={genre.name}
                    onClick={() => toggleSelection('genres', genre.name)}
                    className={`
                      cursor-pointer p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group h-24 flex items-end
                      ${isSelected
                        ? "border-transparent ring-2 ring-white/20 shadow-lg scale-[1.02]"
                        : "border-border/50 hover:border-white/20 bg-card hover:bg-card/80"}
                    `}
                  >
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${genre.color} opacity-0 transition-opacity duration-300 ${isSelected ? 'opacity-20' : 'group-hover:opacity-10'}`} />

                    {/* Animated Glow */}
                    {isSelected && (
                      <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br ${genre.color} blur-2xl opacity-40`} />
                    )}

                    <span className={`font-medium relative z-10 transition-colors ${isSelected ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'}`}>
                      {genre.name}
                    </span>

                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <CheckCircleIcon className="w-5 h-5 text-white drop-shadow-md" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Moods Chips */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-music-orange" />
              <h2 className="text-xl font-semibold">Vibe & Mood</h2>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {moods.map(mood => (
                <button
                  key={mood}
                  onClick={() => toggleSelection('moods', mood)}
                  className={`
                    px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border
                    ${preferences.moods.includes(mood)
                      ? "bg-music-orange text-white border-music-orange shadow-lg shadow-music-orange/25 scale-105"
                      : "bg-card border-border hover:border-music-orange/50 hover:bg-accent text-muted-foreground hover:text-foreground"}
                  `}
                >
                  {mood}
                </button>
              ))}
            </div>
          </section>

          {/* Sliders Section */}
          <section className="bg-card/30 rounded-3xl p-8 border border-white/5 backdrop-blur-sm shadow-xl">
            <h2 className="text-xl font-semibold mb-8 flex items-center gap-2">
              <Activity className="w-5 h-5 text-music-pink" />
              Parameters
            </h2>
            <div className="space-y-10">
              {/* Energy */}
              <div className="relative">
                <div className="flex justify-between mb-4">
                  <Label className="text-base font-medium">Energy Level</Label>
                  <span className="text-music-purple font-mono bg-music-purple/10 px-2 py-0.5 rounded text-sm">{preferences.energy}%</span>
                </div>
                <Slider
                  value={preferences.energy}
                  onValueChange={(val) => setPreferences(p => ({ ...p, energy: val }))}
                  max={100}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
                  <span>Chill</span>
                  <span>Intense</span>
                </div>
              </div>

              {/* Danceability */}
              <div className="relative">
                <div className="flex justify-between mb-4">
                  <Label className="text-base font-medium">Danceability</Label>
                  <span className="text-music-orange font-mono bg-music-orange/10 px-2 py-0.5 rounded text-sm">{preferences.danceability}%</span>
                </div>
                <Slider
                  value={preferences.danceability}
                  onValueChange={(val) => setPreferences(p => ({ ...p, danceability: val }))}
                  max={100}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
                  <span>Lounge</span>
                  <span>Club</span>
                </div>
              </div>

              {/* Playlist Length */}
              <div className="relative">
                <div className="flex justify-between mb-4">
                  <Label className="text-base font-medium">Playlist Length</Label>
                  <span className="text-spotify-green font-mono bg-spotify-green/10 px-2 py-0.5 rounded text-sm">{preferences.playlistLength} Songs</span>
                </div>
                <Slider
                  value={preferences.playlistLength}
                  onValueChange={(val) => setPreferences(p => ({ ...p, playlistLength: val }))}
                  min={10}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
                  <span>EP</span>
                  <span>Marathon</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Col: Visualization & Secondary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Sonic Identity Radar */}
          <div className="bg-card/30 rounded-3xl p-6 border border-white/5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Your Playlist Visualized</h3>
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="h-[300px]">
              <SonicIdentity {...identityData} />
            </div>

          </div>

          {/* Playlist Details */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <PenTool className="w-4 h-4 text-music-purple" />
                Mix Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground ml-1">Name</Label>
                <Input
                  placeholder="e.g. Late Night Vibes"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className="bg-background/50 border-white/10"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground ml-1">Description</Label>
                <Textarea
                  placeholder="Provide a story for your mix..."
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  className="bg-background/50 border-white/10 min-h-[60px] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Artists */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4 text-spotify-green" />
                Must-Have Artists
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="e.g. The Weeknd"
                  value={customArtist}
                  onChange={(e) => setCustomArtist(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addArtist()}
                  className="bg-background/50 border-white/10"
                />
                <Button size="icon" onClick={addArtist} className="shrink-0 bg-spotify-green hover:bg-spotify-green/90 transition-colors">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[2rem]">
                {preferences.artists.map(artist => (
                  <Badge
                    key={artist}
                    variant="secondary"
                    className="pl-3 pr-1 py-1.5 flex items-center gap-1 hover:bg-destructive hover:text-white transition-colors cursor-pointer group"
                    onClick={() => removeArtist(artist)}
                  >
                    {artist}
                    <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                  </Badge>
                ))}
                {preferences.artists.length === 0 && (
                  <span className="text-xs text-muted-foreground italic p-1">No specific artists selected</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Decades - Time Travel */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4 text-music-pink" />
                Time Travel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {decades.map(decade => {
                  const isSelected = preferences.decades.includes(decade);
                  return (
                    <div
                      key={decade}
                      onClick={() => toggleSelection('decades', decade)}
                      className={`
                            cursor-pointer rounded-md text-center py-2 text-sm font-medium transition-all duration-200 border
                            ${isSelected
                          ? "bg-music-pink text-white border-music-pink shadow-md transform scale-105"
                          : "bg-background/50 border-border/50 text-muted-foreground hover:bg-accent hover:border-music-pink/30 hover:text-foreground"}
                        `}
                    >
                      {decade}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Error & Actions */}
          <div className="pt-4 space-y-3">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm text-center animate-shake">
                {error}
              </div>
            )}

            <Button
              variant="gradient"
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full text-lg h-14 shadow-music hover:shadow-glow hover:-translate-y-0.5 transition-all duration-300 rounded-xl"
            >
              {isGenerating ? (
                <>
                  <Waves className="w-5 h-5 mr-2 animate-spin" />
                  Synthesizing Mix...
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Generate Playlist
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleSurpriseMe}
              className="w-full border-white/10 hover:bg-white/5 h-12 rounded-xl text-muted-foreground hover:text-foreground"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Surprise Me
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
  </svg>
);

export default PreferenceInput;
