import * as THREE from 'three';

/**
 * @propolis
 * {
 *   "role": "UTILITY",
 *   "constraints": [
 *     "Original pixel art in the style of Duck Hunt's ducks (T-070), never Nintendo's own sprites",
 *     "Every frame is the same size; flying frames face right and the scene mirrors them to face left,",
 *     "the falling frame alternates with its mirror image to spin"
 *   ],
 *   "agent_instructions": "Edit the art by editing DUCK_FRAMES: one character per pixel, keys in DUCK_PALETTE, '.' is transparent. The sheet is built once per scene and shared by every duck through texture clones."
 * }
 */

const DUCK_PALETTE: Record<string, string> = {
  B: '#000000',
  H: '#005000',
  W: '#fcfcfc',
  S: '#fc7460',
};

const WINGS_UP = [
  '..................................',
  '............WBBB..................',
  '...........WBBBBB.................',
  '..........WBBBBBB.................',
  '..........WBBBBBBB...HHHH...S.....',
  '..........WBBBBBBB..HHHWWWSSS.....',
  '..........WBBBBBBB..HHHWBWSSSS....',
  '..........WBBBBBBBBHHHHWBWSSWWWW..',
  '..........WBBBBBBBBHHHHWWWSWBBBW..',
  '..........WBBBBBBBB.HHHHHH.BBBW...',
  '..........WBBBBBBBBBHHHHHHWBBBW...',
  '..........WBBBBBBBBB.HHHHWBBBW....',
  '..........WBBBBBBBBBWWWWWBBBBW....',
  '..........WBBBBBBBBBBW.WBBBBW.....',
  '..........WBBBBBBBBBBBWBBBBW......',
  '..........WBBBBBBBBBBBBBBBW.......',
  '..........WBBB.BBBBBBBBBBBW.......',
  '..........W..BBBBBBBBBBWBW........',
  '............BBBBBBBBBBW...........',
  '...........BBBBBBBBBBW............',
  '..........BBBBBBBBBBBW............',
  '.........BBBBBBBBBBBW.............',
  '.........BBBBBBBBBBW..............',
  '........BBBBBBBBBBW...............',
  '.......BBBBBBBBBWW................',
  '.......BBBBBBBBW..................',
  '......WBBBWWWWW...................',
  '.......WWWS..SS...................',
  '........SS..SS....................',
  '..................................',
  '..................................',
  '..................................',
  '..................................',
  '..................................',
];

const WINGS_MID = [
  '..................................',
  '..................................',
  '..................................',
  '..................................',
  '.....................HHHH...S.....',
  '....................HHHWWWSSS.....',
  '....................HHHWBWSSSS....',
  '...................HHHHWBWSS......',
  '...................HHHHWWWS.......',
  '....................HHHHHH........',
  '....................HHHHHH........',
  '..WWWW...............HHHH.........',
  '.WBBBBWWW...........WWWW..........',
  '.BBBBBBBBWWWW.....BBBW............',
  '.BBBBBBBBBBBBWW..BBBBBW...........',
  '..BBBBBBBBBBBBB.BBBBBBBW..WWWWWWW.',
  '...BBBBBBBBBBBBBBBBBBBWWWWBBBBBBB.',
  '....BBBBBBBBBBBBBBBBBBBBBBBBBBBBB.',
  '.......BBBBBBBBBBBBBBBBBBBBBBBBBB.',
  '..........BBBBBBBBBBBWBBBBBBBBBBB.',
  '..........BBBBBBBBBBBWBBBBBBBBB...',
  '.........BBBBBBBBBBBW.............',
  '.........BBBBBBBBBBW..............',
  '........BBBBBBBBBBW...............',
  '.......BBBBBBBBBWW................',
  '.......BBBBBBBBW..................',
  '......WBBBWWWWW...................',
  '.......WWWS..SS...................',
  '........SS..SS....................',
  '..................................',
  '..................................',
  '..................................',
  '..................................',
  '..................................',
];

const WINGS_DOWN = [
  '..................................',
  '..................................',
  '..................................',
  '..................................',
  '.....................HHHH...S.....',
  '....................HHHWWWSSS.....',
  '....................HHHWBWSSSS....',
  '...................HHHHWBWSS......',
  '...................HHHHWWWS.......',
  '....................HHHHHH........',
  '....................HHHHHH........',
  '.....................HHHH.........',
  '....................WWWW..........',
  '..................BBBW............',
  '.................BBBBBW...........',
  '................BBBBBBBW..........',
  '...............BBBBBBBBW..........',
  '.............BBBBBBBBBBW..........',
  '...........WBBBBBBBBBBW...........',
  '..........WBBBBBBBBBBW............',
  '.........WBBBBBBBBBBBBW...........',
  '........WBBBBBBBBBBBBBBW..........',
  '.......WBBBBBBBBBBBWBBBBW.........',
  '......WBBBBBBBBBBBW.WBBBBW........',
  '.....WBBBBBBBBBBWW...WBBBBW.......',
  '.....WBBBBBBBBBW......WBBBBW......',
  '....WBWBBBWWWWW........WBBBBW.....',
  '...WBBBWWWW..SS.........WBBBBW....',
  '...WBBBBBW..SS...........WBBW.....',
  '....WBBWW.................WBW.....',
  '.....WW....................W......',
  '..................................',
  '..................................',
  '..................................',
];

const HIT = [
  '..................................',
  '..................................',
  '..................................',
  '.............................W....',
  '....WB..........HH............B...',
  '.....W........HHWWHH........W.....',
  '.............HHWWWWHH.............',
  '.............HWWWBWWH.............',
  '.............HWWWBWWH.............',
  '..W..........HHWWWWHSSS........W..',
  '.WBW.........HHHWWHHSSSSS....WWBW.',
  '.WBBWW.......HHHHHHHSSSSS...WBBBW.',
  '.WBBBBWW......HHHHHH......WWBBBBW.',
  '.WBBBBBBW.....BBHHBB....WWBBBBBBW.',
  '..WBBBBBBWW..BBBBBBBB..WBBBBBBBW..',
  '...WBBBBBBBWBBBBBBBBBBWBBBBBBBW...',
  '....WBBBBBBBBBBBBBBBBBBBBBBBBW....',
  '.....WBBBBBBBBWWWWWWBBBBBBBBW.....',
  '.......WBBBBBBWWWWWWBBBBBBW.......',
  '.........WBBBWWWWWWWWBBBW.........',
  '...........BBWWWWWWWWBB...........',
  '...........BBWWWWWWWWBB........W..',
  '..WB........BWWWWWWWWB........B...',
  '.............BWWWWWWB.............',
  '..............WWWWWW..............',
  '..................................',
  '.............SS....SS.............',
  '.............SS....SS.............',
  '............SSSS..SSSS............',
  '..................................',
  '......W....................W......',
  '..................................',
  '..................................',
  '..................................',
];

const FALLING = [
  '..................................',
  '.......WWWWW.........WWWWW........',
  '......WBBBBBW........BBBBBW.......',
  '......WBBBBBB........BBBBW........',
  '.......WBBBBBSSS.SSS.BBBW.........',
  '.......WBBBBBBSS..SS.BW...........',
  '........WBBBBBSS..SSWW............',
  '.........WBBBBBWWW..W.............',
  '.........WBBBBBBBW.W..............',
  '..........WBBBWBBBWW..............',
  '..........WBBBBBBBWW..............',
  '...........WBWBBBBBW..............',
  '...........WBBBBBBBW..............',
  '............WBBBBBBW..............',
  '............WBBBBBBBW.............',
  '............BBBBBBBBW.............',
  '............BBBBBBBBW.............',
  '............BBBBBBBBW.............',
  '............BBBBBBBBW.............',
  '............BBBBBBBW..............',
  '.............BBBBBBW..............',
  '.............BBBBBBW..............',
  '.............BBBBBBW..............',
  '.............BWWWWWW..............',
  '..............HHHHH...............',
  '.............HHHHHHH..............',
  '.............HHHHHHH..............',
  '.............HHWWWHH..............',
  '.............HHWBWSH..............',
  '.............HHWBWSSS.............',
  '..............HWWWSSS.............',
  '...............HHH.SS.............',
  '....................S.............',
  '..................................',
];

const DUCK_FRAMES = [WINGS_UP, WINGS_MID, WINGS_DOWN, HIT, FALLING] as const;
export const DUCK_FRAME = { wingsUp: 0, wingsMid: 1, wingsDown: 2, hit: 3, falling: 4 } as const;
export type DuckFrameIndex = (typeof DUCK_FRAME)[keyof typeof DUCK_FRAME];

const FRAME_WIDTH = WINGS_UP[0].length;
const FRAME_HEIGHT = WINGS_UP.length;
export const DUCK_ASPECT = FRAME_WIDTH / FRAME_HEIGHT;

export function createDuckSpriteSheet(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_WIDTH * DUCK_FRAMES.length;
  canvas.height = FRAME_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Duck sprite sheet: the browser returned no 2D canvas context');

  DUCK_FRAMES.forEach((frame, frameIndex) => {
    frame.forEach((row, y) => {
      [...row].forEach((pixel, x) => {
        if (pixel === '.') return;
        context.fillStyle = DUCK_PALETTE[pixel];
        context.fillRect(frameIndex * FRAME_WIDTH + x, y, 1, 1);
      });
    });
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

/** Points a duck's own texture clone at one frame of the sheet, mirrored when it flies left. */
export function showDuckFrame(texture: THREE.Texture, frame: DuckFrameIndex, isFacingLeft: boolean): void {
  const frameShare = 1 / DUCK_FRAMES.length;
  texture.repeat.x = isFacingLeft ? -frameShare : frameShare;
  texture.offset.x = (isFacingLeft ? frame + 1 : frame) * frameShare;
}
