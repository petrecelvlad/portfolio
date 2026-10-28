import React, { createContext, useContext, useState } from 'react';

export interface IslandPositionConfig {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export const DEFAULT_ISLAND_POSITION: IslandPositionConfig = {
  offsetX: -18,
  offsetY: 190,
  scale: 1.1,
};

interface IslandPositionContextType {
  config: IslandPositionConfig;
  updateConfig: (updates: Partial<IslandPositionConfig>) => void;
  resetConfig: () => void;
  isEditorOpen: boolean;
  setIsEditorOpen: (open: boolean) => void;
  toggleEditor: () => void;
}

const IslandPositionContext = createContext<IslandPositionContextType | undefined>(undefined);

export const IslandPositionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<IslandPositionConfig>(DEFAULT_ISLAND_POSITION);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const updateConfig = (updates: Partial<IslandPositionConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const resetConfig = () => {
    setConfig(DEFAULT_ISLAND_POSITION);
  };

  const toggleEditor = () => {
    setIsEditorOpen((prev) => !prev);
  };

  return (
    <IslandPositionContext.Provider
      value={{ config, updateConfig, resetConfig, isEditorOpen, setIsEditorOpen, toggleEditor }}
    >
      {children}
    </IslandPositionContext.Provider>
  );
};

export const useIslandPosition = () => {
  const context = useContext(IslandPositionContext);
  if (!context) {
    throw new Error('useIslandPosition must be used within an IslandPositionProvider');
  }
  return context;
};
