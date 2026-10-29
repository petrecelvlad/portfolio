import { createContext, useContext } from 'react';

// 1 is a later project, -1 an earlier one, 0 no swap yet (or no stage at all: mobile lays every
// project out on its own, so nothing ever swaps there).
export type SwapDirection = -1 | 0 | 1;

export interface ProjectSwap {
  key: string;
  direction: SwapDirection;
}

// Seconds after a swap each piece starts moving, so the change reads as one sequence:
// clipboard, then phone, achievement and sticky notes.
export const SWAP_DELAY = { screen: 0.07, achievement: 0.15, notes: 0.23 } as const;

const ProjectSwapContext = createContext<ProjectSwap>({ key: 'static', direction: 0 });

export const ProjectSwapProvider = ProjectSwapContext.Provider;

export function useProjectSwap(): ProjectSwap {
  return useContext(ProjectSwapContext);
}
