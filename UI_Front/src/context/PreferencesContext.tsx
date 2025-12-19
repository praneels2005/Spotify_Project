import React, { createContext, useContext, useState } from "react";

export interface Preferences {
  genres: string[];
  moods: string[];
  artists: string[];
  decades: string[];
  energy: number[];
  danceability: number[];
  playlistLength: number[];
}

const PreferencesContext = createContext<{
  preferences: Preferences;
  setPreferences: React.Dispatch<React.SetStateAction<Preferences>>;
} | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<Preferences>({
    genres: [],
    moods: [],
    artists: [],
    decades: [],
    energy: [50],
    danceability: [50],
    playlistLength: [25],
  });

  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences must be used within PreferencesProvider");
  return context;
};