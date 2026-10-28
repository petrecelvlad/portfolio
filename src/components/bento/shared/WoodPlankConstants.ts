// Wood-plank bar constants — trimmed from the former DeskBoardConstants.ts (2026-08-26) down to
// just what Navbar.tsx's own plank-styled bar actually consumes. The rest of that file (rail/post
// geometry, rivet sizing, assertPlankGeometryInSync) only existed for the heritage DeskBoard
// frame, which has been removed — see src/laboratory/frames/ (external archive) for that code.
import { BOARD_COLOR, darken, lighten } from './palette';

export const OUTLINE_COLOR = '#6B4423';
export const OUTLINE_WIDTH_PX = 3;
export const OUTLINE_WIDTH = `${OUTLINE_WIDTH_PX}px`;

export const ELEVATION_HEIGHT_PX = 6;
export const ELEVATION_DARKEN_PCT = 20;
export const HIGHLIGHT_HEIGHT_PX = 2;

export const BOARD_ELEVATION_COLOR = darken(BOARD_COLOR, ELEVATION_DARKEN_PCT);
export const BOARD_HIGHLIGHT_COLOR = lighten(BOARD_COLOR, ELEVATION_DARKEN_PCT);
