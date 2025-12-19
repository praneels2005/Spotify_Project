import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Edit3, Clock, Music, Save, Shuffle, X, Plus, Search } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  image: string;
  preview?: string;
}

interface PlaylistData {
  name: string;
    NumSongs: number[];
    totalDuration: string;
    Tracks: string[];
    genres: string[];
}

const PlaylistPreview = ({ 
  playlist, 
  onSave, 
  onRegenerate 
}: { 
  playlist: PlaylistData;
  onSave: (name: string, tracks: Track[]) => void;
  onRegenerate: () => void;
}) => {
  const [playlistName, setPlaylistName] = useState(playlist.name);
  const [tracks, setTracks] = useState(playlist.Tracks);
  const [isEditing, setIsEditing] = useState(false);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock track data for demo
  const mockTracks: Track[] = [
    {
      id: "1",
      title: "Blinding Lights",
      artist: "The Weeknd",
      album: "After Hours",
      duration: "3:20",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop"
    },
    {
      id: "2", 
      title: "Good 4 U",
      artist: "Olivia Rodrigo",
      album: "SOUR",
      duration: "2:58",
      image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=100&h=100&fit=crop"
    },
    {
      id: "3",
      title: "Levitating",
      artist: "Dua Lipa",
      album: "Future Nostalgia",
      duration: "3:23",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop"
    },
    {
      id: "4",
      title: "Stay",
      artist: "The Kid LAROI, Justin Bieber",
      album: "F*CK LOVE 3",
      duration: "2:21",
      image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=100&h=100&fit=crop"
    },
    {
      id: "5",
      title: "Industry Baby",
      artist: "Lil Nas X ft. Jack Harlow",
      album: "MONTERO",
      duration: "3:32",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop"
    }
  ];

  const displayTracks = tracks.length > 0 ? tracks : mockTracks;

  // Additional mock tracks for search/add functionality
  const availableTracks: Track[] = [
    {
      id: "6",
      title: "Heat Waves",
      artist: "Glass Animals",
      album: "Dreamland",
      duration: "3:58",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop"
    },
    {
      id: "7",
      title: "Watermelon Sugar",
      artist: "Harry Styles", 
      album: "Fine Line",
      duration: "2:54",
      image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=100&h=100&fit=crop"
    },
    {
      id: "8",
      title: "drivers license",
      artist: "Olivia Rodrigo",
      album: "SOUR", 
      duration: "4:02",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop"
    },
    {
      id: "9",
      title: "Peaches",
      artist: "Justin Bieber ft. Daniel Caesar",
      album: "Justice",
      duration: "3:18",
      image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=100&h=100&fit=crop"
    },
    {
      id: "10",
      title: "Anti-Hero",
      artist: "Taylor Swift",
      album: "Midnights",
      duration: "3:20",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop"
    }
  ];

  const filteredAvailableTracks = availableTracks.filter(track => 
    !displayTracks.some(existingTrack => existingTrack.id === track.id) &&
    (track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     track.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const togglePlay = (trackId: string) => {
    setPlayingTrack(playingTrack === trackId ? null : trackId);
  };

  const handleSave = () => {
    onSave(playlistName, displayTracks);
  };

  const moveTrack = (fromIndex: number, toIndex: number) => {
    const newTracks = [...displayTracks];
    const [movedTrack] = newTracks.splice(fromIndex, 1);
    newTracks.splice(toIndex, 0, movedTrack);
    setTracks(newTracks);
  };

  const removeTrack = (trackId: string) => {
    const newTracks = displayTracks.filter(track => track.id !== trackId);
    setTracks(newTracks);
  };

  const addTrack = (track: Track) => {
    const newTracks = [...displayTracks, track];
    setTracks(newTracks);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Your Generated 
            <span className="bg-gradient-music bg-clip-text text-transparent"> Playlist</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Preview, customize, and save your personalized playlist
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Playlist Info */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border sticky top-6">
              <CardHeader>
                <div className="aspect-square bg-gradient-music rounded-lg mb-4 flex items-center justify-center">
                  <Music className="w-16 h-16 text-background" />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                        className="text-lg font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0"
                        disabled={!isEditing}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {displayTracks.length} songs • {playlist.totalDuration || "15:34"}
                    </p>
                  </div>

                  {/* Genres */}
                  <div>
                    <Label className="text-sm font-medium">Genres</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(playlist.genres || ["Pop", "Electronic", "Indie"]).map(genre => (
                        <Badge key={genre} variant="outline" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Average: 3:05 per song</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Music className="w-4 h-4 text-muted-foreground" />
                      <span>Energy: High</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Track List */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Track List</span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowAddSongs(!showAddSongs)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Songs
                    </Button>
                    <Button variant="outline" size="sm" onClick={onRegenerate}>
                      <Shuffle className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Add Songs Section */}
                {showAddSongs && (
                  <div className="p-4 border-b border-border bg-muted/30">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search for songs to add..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      
                      {searchQuery && (
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {filteredAvailableTracks.map((track) => (
                            <div
                              key={track.id}
                              className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded transition-colors"
                            >
                              <img
                                src={track.image}
                                alt={track.album}
                                className="w-8 h-8 rounded object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{track.title}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {track.artist}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addTrack(track)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                          {filteredAvailableTracks.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                              No songs found matching "{searchQuery}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  {displayTracks.map((track, index) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-4 p-3 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="text-muted-foreground text-sm w-6 text-center">
                        {index + 1}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => togglePlay(track.id)}
                      >
                        {playingTrack === track.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>

                      <img
                        src={track.image}
                        alt={track.album}
                        className="w-12 h-12 rounded object-cover"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{track.title}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {track.artist}
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground hidden sm:block">
                        {track.album}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {track.duration}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => removeTrack(track.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button
            variant="spotify"
            size="lg"
            onClick={handleSave}
            className="text-lg px-8 py-6"
          >
            <Save className="w-5 h-5" />
            Save to Spotify
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onRegenerate}
            className="text-lg px-8 py-6"
          >
            <RotateCcw className="w-5 h-5" />
            Generate Different Mix
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlaylistPreview;