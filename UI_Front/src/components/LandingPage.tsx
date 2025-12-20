import { Button } from "@/components/ui/button";
import { Music, Play, Shuffle, Heart, Sparkles, Globe, Headphones } from "lucide-react";
import heroImage from "@/assets/hero-music.jpg";

const LandingPage = ({ onStartAuth, isAuthenticated = false }: { onStartAuth: () => void; isAuthenticated?: boolean }) => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-spotify-green/30">

      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={heroImage}
          alt="Music waves"
          className="w-full h-full object-cover opacity-[0.03] scale-105 animate-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-music-purple/20 rounded-full blur-[128px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-spotify-green/10 rounded-full blur-[128px] animate-bounce-gentle" />
      </div>

      {/* Navbar Mock */}
      <nav className="absolute top-0 w-full p-6 z-50 flex justify-between items-center max-w-7xl mx-auto left-0 right-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-music flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">PlaylistAI</span>
        </div>
        {/* <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Features</a>
          <a href="#" className="hover:text-foreground transition-colors">Community</a>
          <a href="#" className="hover:text-foreground transition-colors">Pricing</a>
        </div> */}
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-spotify-green flex items-center justify-center text-white font-bold text-xs">
              U
            </div>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={onStartAuth}>Sign In</Button>
        )}
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="max-w-5xl mx-auto pt-20">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-music-orange" />
            <span className="text-sm font-medium bg-gradient-to-r from-music-orange to-music-pink bg-clip-text text-transparent">
              Now with AI-Powered Mood Analysis
            </span>
          </div>

          {/* Hero Heading */}
          <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tight leading-[1.1] animate-fade-in-up [animation-delay:200ms]">
            Curate Your
            <span className="block bg-gradient-hero bg-clip-text text-transparent pb-4">
              Sonic Identity
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up [animation-delay:400ms]">
            Transform your mood into the perfect Spotify playlist.
            Powered by advanced AI to understand your unique music taste.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up [animation-delay:600ms]">
            <Button
              variant="spotify"
              size="lg"
              onClick={onStartAuth}
              className="text-lg px-8 py-6 rounded-full shadow-music hover:shadow-glow transition-all duration-500"
            >
              <Music className="w-5 h-5" />
              {isAuthenticated ? "Continue to App" : "Connect Spotify"}
            </Button>
            {/* <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 rounded-full hover:bg-white/5 border-white/10 backdrop-blur-sm"
            >
              View Demo
            </Button> */}
          </div>

          {/* Stats / Social Proof */}
          <div className="mt-20 pt-10 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in-up [animation-delay:800ms]">
            {[
              { label: "Active Users", value: "10k+" },
              { label: "Playlists Created", value: "500k+" },
              { label: "Songs Analyzed", value: "2M+" },
              { label: "Happy Vibes", value: "∞" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Features Preview Cards */}
          <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group p-8 rounded-3xl bg-card/30 backdrop-blur-md border border-white/5 hover:bg-card/40 transition-all duration-500 hover:-translate-y-2">
              <div className="w-12 h-12 bg-music-purple/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <Globe className="w-6 h-6 text-music-purple" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Global Discovery</h3>
              <p className="text-muted-foreground leading-relaxed">
                Explore trending genres from Tokyo to Toronto. Our AI finds hidden gems worldwide.
              </p>
            </div>
            <div className="group p-8 rounded-3xl bg-card/30 backdrop-blur-md border border-white/5 hover:bg-card/40 transition-all duration-500 hover:-translate-y-2">
              <div className="w-12 h-12 bg-music-pink/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <Heart className="w-6 h-6 text-music-pink" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Deep Personalization</h3>
              <p className="text-muted-foreground leading-relaxed">
                We learn what makes your ears perk up. Every playlist is uniquely yours.
              </p>
            </div>
            <div className="group p-8 rounded-3xl bg-card/30 backdrop-blur-md border border-white/5 hover:bg-card/40 transition-all duration-500 hover:-translate-y-2">
              <div className="w-12 h-12 bg-spotify-green/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <Headphones className="w-6 h-6 text-spotify-green" />
              </div>
              <h3 className="text-xl font-semibold mb-3">High Fidelity</h3>
              <p className="text-muted-foreground leading-relaxed">
                Optimized for the best listening experience. Seamless integration with your library.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
