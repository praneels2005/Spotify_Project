import { Button } from "@/components/ui/button";
import { Music, Play, Shuffle, Heart } from "lucide-react";
import heroImage from "@/assets/hero-music.jpg";
// import { getPlaylists, startAuth } from "@/lib/api";
// import { Navigate } from "react-router-dom";
// import React, { useState, useEffect } from "react";

const LandingPage = ({ onStartAuth }: { onStartAuth: () => void }) => {
  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Music waves"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-dark/80" />
      </div>
      
      {/* Floating Icons */}
      <div className="absolute top-20 left-10 animate-bounce-gentle">
        <Music className="w-8 h-8 text-music-purple opacity-60" />
      </div>
      <div className="absolute top-40 right-20 animate-pulse-slow">
        <Play className="w-6 h-6 text-spotify-green opacity-40" />
      </div>
      <div className="absolute bottom-40 left-20 animate-bounce-gentle delay-300">
        <Shuffle className="w-7 h-7 text-music-orange opacity-50" />
      </div>
      <div className="absolute bottom-20 right-10 animate-pulse-slow delay-500">
        <Heart className="w-5 h-5 text-music-pink opacity-60" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Logo/Brand */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-music rounded-full shadow-glow">
                <Music className="w-8 h-8 text-background" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                PlaylistAI
              </h1>
            </div>
          </div>

          {/* Hero Heading */}
          <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Generate Spotify
            <span className="block bg-gradient-music bg-clip-text text-transparent">
              Playlists
            </span>
            <span className="text-2xl md:text-3xl font-normal text-muted-foreground block mt-2">
              Based on Your Taste
            </span>
          </h2>

          {/* Description */}
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Discover your next favorite songs with AI-powered playlist generation. 
            Connect your Spotify account and let us create the perfect mix for any mood, 
            genre, or moment.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="spotify" 
              size="lg" 
              onClick={onStartAuth}
              className="text-lg px-8 py-6"
            >
              <Music className="w-5 h-5" />
              Log in with Spotify
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Learn More
            </Button>
          </div>

          {/* Features Preview */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="p-3 bg-card rounded-full w-fit mx-auto mb-4 border border-border">
                <Shuffle className="w-6 h-6 text-music-purple" />
              </div>
              <h3 className="font-semibold mb-2">Smart Mixing</h3>
              <p className="text-sm text-muted-foreground">
                AI analyzes your taste to create perfect track combinations
              </p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-card rounded-full w-fit mx-auto mb-4 border border-border">
                <Heart className="w-6 h-6 text-music-pink" />
              </div>
              <h3 className="font-semibold mb-2">Mood Matching</h3>
              <p className="text-sm text-muted-foreground">
                Select your vibe and get songs that match your energy
              </p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-card rounded-full w-fit mx-auto mb-4 border border-border">
                <Play className="w-6 h-6 text-spotify-green" />
              </div>
              <h3 className="font-semibold mb-2">Instant Sync</h3>
              <p className="text-sm text-muted-foreground">
                Playlists appear directly in your Spotify library
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;