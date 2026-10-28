import { createContext, useContext, useState, ReactNode } from 'react';

interface VideoPrefs {
  isMuted: boolean;
  autoPlay: boolean;
  setMuted: (v: boolean) => void;
  setAutoPlay: (v: boolean) => void;
}

const VideoPrefsContext = createContext<VideoPrefs>({
  isMuted: true,
  autoPlay: true,
  setMuted: () => {},
  setAutoPlay: () => {},
});

export function VideoPrefsProvider({ children }: { children: ReactNode }) {
  const [isMuted, setMuted] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  return (
    <VideoPrefsContext.Provider value={{ isMuted, autoPlay, setMuted, setAutoPlay }}>
      {children}
    </VideoPrefsContext.Provider>
  );
}

export function useVideoPrefs() {
  return useContext(VideoPrefsContext);
}
