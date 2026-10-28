import { createContext, useContext, useState, ReactNode } from 'react';

export const ANIMATION_PATHS = [
  { id: 'svg', label: 'SVG' },
  { id: 'baked', label: 'Baked MP4/PNG' },
  { id: 'shader', label: 'Live Shader' },
] as const;

export type AnimationPathId = typeof ANIMATION_PATHS[number]['id'];

interface AnimationPathPrefs {
  animationPath: AnimationPathId;
  setAnimationPath: (v: AnimationPathId) => void;
}

const AnimationPathContext = createContext<AnimationPathPrefs>({
  animationPath: 'svg',
  setAnimationPath: () => {},
});

export function AnimationPathProvider({ children }: { children: ReactNode }) {
  const [animationPath, setAnimationPath] = useState<AnimationPathId>('svg');

  return (
    <AnimationPathContext.Provider value={{ animationPath, setAnimationPath }}>
      {children}
    </AnimationPathContext.Provider>
  );
}

export function useAnimationPath() {
  return useContext(AnimationPathContext);
}
