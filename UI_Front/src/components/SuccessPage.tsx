import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ExternalLink, Share2, Music, RotateCcw, Home } from "lucide-react";

interface SuccessPageProps {
  playlistName: string;
  trackCount: number;
  playlistUrl?: string;
  onCreateAnother: () => void;
  onBackHome: () => void;
}

const SuccessPage = ({ 
  playlistName, 
  trackCount, 
  playlistUrl = "#",
  onCreateAnother,
  onBackHome 
}: SuccessPageProps) => {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Check out my new playlist: ${playlistName}`,
        text: `I just created an amazing ${trackCount}-song playlist using PlaylistAI!`,
        url: playlistUrl,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`Check out my new playlist "${playlistName}" - ${playlistUrl}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Animation */}
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-spotify-green/20 rounded-full animate-ping"></div>
            <div className="relative bg-spotify-green rounded-full p-6 w-32 h-32 mx-auto flex items-center justify-center shadow-glow">
              <CheckCircle className="w-16 h-16 text-background" />
            </div>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Playlist Successfully
          <span className="block bg-gradient-music bg-clip-text text-transparent">
            Added to Spotify!
          </span>
        </h1>

        <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto">
          Your personalized playlist "{playlistName}" with {trackCount} amazing tracks 
          is now ready to play in your Spotify library.
        </p>

        {/* Playlist Info Card */}
        <Card className="bg-card border-border mb-8 max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-music rounded-lg p-3">
                <Music className="w-8 h-8 text-background" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-lg">{playlistName}</h3>
                <p className="text-muted-foreground">{trackCount} songs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="spotify"
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => playlistUrl !== "#" && window.open(playlistUrl, '_blank')}
              disabled={playlistUrl === "#"}
            >
              <ExternalLink className="w-5 h-5" />
              Open in Spotify
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6"
              onClick={handleShare}
              disabled={playlistUrl === "#"}
            >
              <Share2 className="w-5 h-5" />
              Share Playlist
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="gradient"
              size="lg"
              className="text-lg px-8 py-6"
              onClick={onCreateAnother}
            >
              <RotateCcw className="w-5 h-5" />
              Create Another Playlist
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-lg px-8 py-6"
              onClick={onBackHome}
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Button>
          </div>
        </div>

        {/* Feature Suggestions */}
        <div className="mt-12 p-6 bg-card/50 rounded-lg border border-border">
          <h3 className="font-semibold mb-3">What's Next?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-music-purple mb-1">🎵</div>
              <p>Try different moods and genres for your next playlist</p>
            </div>
            <div className="text-center">
              <div className="text-music-orange mb-1">🎲</div>
              <p>Use "Surprise Me" for unexpected musical discoveries</p>
            </div>
            <div className="text-center">
              <div className="text-spotify-green mb-1">🎧</div>
              <p>Share your playlists with friends and family</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;