import { useEffect, useRef } from 'react';
import { createProgram } from './webgl';

// The live WebGL implementations of the 4 Hero achievement-card animations (Cartridge, Level-Up,
// Factory, Teamslead). This file is dynamically imported (see AchievementShaderCanvas.tsx's
// dispatcher) and only reaches the browser at all when the "Live Shader" animation path is
// selected — Vite splits a dynamic import() into its own chunk, so none of this GLSL, and none
// of the WebGL context/compile cost it triggers at runtime, is fetched or executed for anyone
// who never picks that path.
//
// Also the regeneration source of truth for the baked assets in `public/achievements/` (used by
// the default "Baked" path): if the visual design changes, edit the GLSL below, then re-run
// `node tools/shader-capture/capture.mjs <shader> <sprite|video>` (see
// `cone/project/specs/Achievement_Shader_Loop_Periods.md` for each shader's loop window and
// `cone/project/roadmap/board/T-018-remaining-shader-bakes.md` for the exact commands used) and
// copy the regenerated output over the corresponding file in `public/achievements/`.

function CartridgeShaderCanvas({ className, isVisible = true }: { className?: string; isVisible?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;

      #define COLOR_BG          vec3(0.008, 0.518, 0.780)
      #define COLOR_GOLD        vec3(0.961, 0.620, 0.043)
      #define COLOR_GOLD_LIGHT  vec3(0.988, 0.827, 0.302)
      #define COLOR_EXTRUDE     vec3(0.706, 0.325, 0.035)
      #define COLOR_WHITE       vec3(1.000, 1.000, 1.000)
      #define COLOR_DARK        vec3(0.100, 0.120, 0.180)
      #define COLOR_LED         vec3(0.063, 0.725, 0.506)
      #define COLOR_STICKER_RED vec3(0.890, 0.240, 0.200)
      #define COLOR_CYAN        vec3(0.220, 0.741, 0.973)
      #define COLOR_RED         vec3(0.937, 0.267, 0.267)

      int getAlienPixel(int x, int y) {
          if (x > 3) x = 7 - x;
          if (y == 0) return (x == 3) ? 1 : 0;
          if (y == 1) return (x >= 2) ? 1 : 0;
          if (y == 2) return (x >= 1) ? 1 : 0;
          if (y == 3) return (x == 2) ? 2 : ((x >= 0) ? 1 : 0);
          if (y == 4) return 1;
          if (y == 5) return (x == 1 || x == 3) ? 1 : 0;
          if (y == 6) return (x == 0 || x == 2) ? 1 : 0;
          if (y == 7) return (x == 1) ? 1 : 0;
          return 0;
      }

      mat2 rot2D(float angle) {
          float c = cos(angle);
          float s = sin(angle);
          return mat2(c, -s, s, c);
      }

      float sdBox(vec3 p, vec3 b) {
          vec3 q = abs(p) - b;
          return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
      }

      float sdSegment(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
      }

      float drawChar(int code, vec2 p) {
          float d = 1e5;
          if (code == 1) {
              d = min(d, sdSegment(p, vec2(-0.024, -0.035), vec2(-0.024, 0.035)));
              d = min(d, sdSegment(p, vec2(-0.024, 0.035), vec2(0.0, -0.005)));
              d = min(d, sdSegment(p, vec2(0.0, -0.005), vec2(0.024, 0.035)));
              d = min(d, sdSegment(p, vec2(0.024, 0.035), vec2(0.024, -0.035)));
          } else if (code == 2) {
              d = min(d, sdSegment(p, vec2(-0.022, -0.035), vec2(0.0, 0.035)));
              d = min(d, sdSegment(p, vec2(0.0, 0.035), vec2(0.022, -0.035)));
              d = min(d, sdSegment(p, vec2(-0.014, -0.005), vec2(0.014, -0.005)));
          } else if (code == 3) {
              d = min(d, sdSegment(p, vec2(-0.020, -0.035), vec2(-0.020, 0.035)));
              d = min(d, sdSegment(p, vec2(-0.020, 0.035), vec2(0.008, 0.035)));
              d = min(d, sdSegment(p, vec2(-0.020, -0.035), vec2(0.008, -0.035)));
              d = min(d, sdSegment(p, vec2(0.008, 0.035), vec2(0.022, 0.018)));
              d = min(d, sdSegment(p, vec2(0.022, 0.018), vec2(0.022, -0.018)));
              d = min(d, sdSegment(p, vec2(0.022, -0.018), vec2(0.008, -0.035)));
          } else if (code == 4) {
              d = min(d, sdSegment(p, vec2(-0.020, -0.035), vec2(-0.020, 0.035)));
              d = min(d, sdSegment(p, vec2(-0.020, 0.035), vec2(0.020, 0.035)));
              d = min(d, sdSegment(p, vec2(-0.020, 0.0), vec2(0.014, 0.0)));
              d = min(d, sdSegment(p, vec2(-0.020, -0.035), vec2(0.020, -0.035)));
          } else if (code == 5) {
              d = min(d, sdSegment(p, vec2(0.0, -0.035), vec2(0.0, 0.035)));
              d = min(d, sdSegment(p, vec2(-0.014, 0.035), vec2(0.014, 0.035)));
              d = min(d, sdSegment(p, vec2(-0.014, -0.035), vec2(0.014, -0.035)));
          } else if (code == 6) {
              d = min(d, sdSegment(p, vec2(-0.022, -0.035), vec2(-0.022, 0.035)));
              d = min(d, sdSegment(p, vec2(-0.022, 0.035), vec2(0.022, -0.035)));
              d = min(d, sdSegment(p, vec2(0.022, -0.035), vec2(0.022, 0.035)));
          } else if (code == 7) {
              d = min(d, sdSegment(p, vec2(-0.022, -0.035), vec2(-0.022, 0.035)));
              d = min(d, sdSegment(p, vec2(-0.022, 0.035), vec2(0.012, 0.035)));
              d = min(d, sdSegment(p, vec2(-0.022, 0.005), vec2(0.012, 0.005)));
              d = min(d, sdSegment(p, vec2(0.012, 0.035), vec2(0.022, 0.020)));
              d = min(d, sdSegment(p, vec2(0.022, 0.020), vec2(0.012, 0.005)));
              d = min(d, sdSegment(p, vec2(-0.005, 0.005), vec2(0.022, -0.035)));
          } else if (code == 8) {
              d = min(d, sdSegment(p, vec2(-0.012, 0.035), vec2(0.012, 0.035)));
              d = min(d, sdSegment(p, vec2(-0.012, -0.035), vec2(0.012, -0.035)));
              d = min(d, sdSegment(p, vec2(-0.022, -0.020), vec2(-0.022, 0.020)));
              d = min(d, sdSegment(p, vec2(0.022, -0.020), vec2(0.022, 0.020)));
              d = min(d, sdSegment(p, vec2(-0.022, 0.020), vec2(-0.012, 0.035)));
              d = min(d, sdSegment(p, vec2(0.012, 0.035), vec2(0.022, 0.020)));
              d = min(d, sdSegment(p, vec2(-0.022, -0.020), vec2(-0.012, -0.035)));
              d = min(d, sdSegment(p, vec2(0.012, -0.035), vec2(0.022, -0.020)));
          }
          return d;
      }

      float drawMadeInRomania(vec2 p) {
          float d = 1e5;
          vec2 p1 = p - vec2(0.0, 0.07);
          d = min(d, drawChar(1, p1 - vec2(-0.20, 0.0)));
          d = min(d, drawChar(2, p1 - vec2(-0.13, 0.0)));
          d = min(d, drawChar(3, p1 - vec2(-0.06, 0.0)));
          d = min(d, drawChar(4, p1 - vec2( 0.01, 0.0)));
          d = min(d, drawChar(5, p1 - vec2( 0.12, 0.0)));
          d = min(d, drawChar(6, p1 - vec2( 0.19, 0.0)));

          vec2 p2 = p - vec2(0.0, -0.07);
          d = min(d, drawChar(7, p2 - vec2(-0.20, 0.0)));
          d = min(d, drawChar(8, p2 - vec2(-0.13, 0.0)));
          d = min(d, drawChar(1, p2 - vec2(-0.06, 0.0)));
          d = min(d, drawChar(2, p2 - vec2( 0.01, 0.0)));
          d = min(d, drawChar(6, p2 - vec2( 0.08, 0.0)));
          d = min(d, drawChar(5, p2 - vec2( 0.14, 0.0)));
          d = min(d, drawChar(2, p2 - vec2( 0.20, 0.0)));
          return d;
      }

      float mapCartridge(vec3 p) {
          vec3 mainBox = vec3(0.55, 0.42, 0.08);
          float dMain = sdBox(p, mainBox);

          vec3 pNotch = p;
          pNotch.x = abs(pNotch.x) - 0.42;
          pNotch.y -= 0.38;
          float dNotch = sdBox(pNotch, vec3(0.08, 0.1, 0.1));
          
          float dCart = max(dMain, -dNotch);

          vec3 pLip = p - vec3(0.0, -0.2, 0.04);
          float dLip = sdBox(pLip, vec3(0.48, 0.18, 0.06));
          
          return min(dCart, dLip);
      }

      vec3 getNormal(vec3 p) {
          vec2 e = vec2(0.002, 0.0);
          return normalize(vec3(
              mapCartridge(p + e.xyy) - mapCartridge(p - e.xyy),
              mapCartridge(p + e.yxy) - mapCartridge(p - e.yxy),
              mapCartridge(p + e.yyx) - mapCartridge(p - e.yyx)
          ));
      }

      void main() {
          vec2 pixelRes = vec2(320.0, 180.0);
          vec2 st = gl_FragCoord.xy / u_resolution.xy;
          vec2 pPixel = (floor(st * pixelRes) + 0.5) / pixelRes;
          
          vec2 uv = (pPixel - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
          vec2 rawUV = st - 0.5;

          vec3 color = COLOR_BG;
          
          vec2 gridUV = fract(uv * 24.0) - 0.5;
          float gridPattern = step(0.44, max(abs(gridUV.x), abs(gridUV.y)));
          color = mix(color, color * 1.12, gridPattern * 0.25);
          
          vec2 particlePos = fract(uv * 4.0 + vec2(u_time * 0.159155, u_time * 0.159155));
          float particle = step(0.96, particlePos.x) * step(0.96, particlePos.y);
          color = mix(color, COLOR_WHITE * 0.6, particle * 0.3);

          float pathY = sin(uv.x * 3.0 + u_time * 1.0) * 0.18 - 0.1;
          float distToPath = abs(uv.y - pathY);
          float dashPattern = step(0.5, fract(uv.x * 12.0 - u_time * 2.069027));
          float pathMask = step(distToPath, 0.008) * dashPattern;
          color = mix(color, COLOR_WHITE, pathMask * 0.85);

          vec3 camPos = vec3(0.0, 0.1, 2.2);
          vec3 rayDir = normalize(vec3(uv, -1.6));
          
          vec3 cartPos = vec3(0.0, sin(u_time * 2.0) * 0.05, 0.0);
          
          float t = 0.0;
          float minRayDist = 100.0;
          bool hit = false;
          vec3 hitP = vec3(0.0);
          
          float rotY = u_time * 1.0;
          float tiltX = 0.35;
          
          for (int i = 0; i < 45; i++) {
              vec3 p = camPos + t * rayDir - cartPos;
              p.yz *= rot2D(tiltX);
              p.xz *= rot2D(rotY);
              
              float d = mapCartridge(p);
              minRayDist = min(minRayDist, d);
              
              if (d < 0.001) {
                  hit = true;
                  hitP = p;
                  break;
              }
              t += d;
              if (t > 4.0) break;
          }

          if (!hit && minRayDist < 0.022) {
              color = COLOR_WHITE;
          }

          if (hit) {
              vec3 norm = getNormal(hitP);
              
              vec3 lightDir = normalize(vec3(-0.4, 0.8, 0.6));
              float diff = dot(norm, lightDir);
              
              vec3 cartColor = COLOR_GOLD;
              if (norm.y < -0.2 || norm.z < -0.3) {
                  cartColor = COLOR_EXTRUDE;
              } else if (diff > 0.4) {
                  cartColor = COLOR_GOLD_LIGHT;
              }

              if (hitP.z > 0.075 && abs(hitP.x) < 0.42 && hitP.y > -0.22 && hitP.y < 0.28) {
                  cartColor = COLOR_DARK;
                  
                  vec2 stickerUV = hitP.xy;
                  if (abs(stickerUV.x) < 0.38 && stickerUV.y > -0.18 && stickerUV.y < 0.24) {
                      cartColor = COLOR_DARK * 0.7;
                      
                      vec2 stNorm = vec2((stickerUV.x + 0.38) / 0.76, (stickerUV.y + 0.18) / 0.42);
                      
                      if (stNorm.x >= 0.15 && stNorm.x <= 0.85 && stNorm.y >= 0.10 && stNorm.y <= 0.90) {
                          vec2 alienUV = vec2((stNorm.x - 0.15) / 0.70, (stNorm.y - 0.10) / 0.80);
                          int px = int(floor(alienUV.x * 8.0));
                          int py = int(floor((1.0 - alienUV.y) * 8.0));
                          
                          if (px >= 0 && px < 8 && py >= 0 && py < 8) {
                              int spr = getAlienPixel(px, py);
                              if (spr == 1) cartColor = COLOR_CYAN;
                              if (spr == 2) cartColor = COLOR_RED;
                          }
                      }
                  }
              }

              if (hitP.z < -0.075 && abs(hitP.x) < 0.45 && hitP.y > -0.25 && hitP.y < 0.25) {
                  vec2 bTextUV = vec2(-hitP.x, hitP.y - 0.01) * 0.93;
                  float dText = drawMadeInRomania(bTextUV);
                  if (dText < 0.004) {
                      cartColor = mix(cartColor, COLOR_DARK, 0.50);
                  } else if (dText < 0.007) {
                      float shadowFactor = (1.0 - (dText - 0.004) / 0.003) * 0.25;
                      cartColor = mix(cartColor, COLOR_DARK, shadowFactor);
                  }
              }

              float glarePos = hitP.x + hitP.y * 1.5;
              float glare = step(0.88, sin(glarePos * 12.0 - u_time * 3.0)) * step(0.0, norm.z);
              cartColor = mix(cartColor, COLOR_WHITE, glare * 0.75);

              color = cartColor;
          }

          float vignette = length(rawUV);
          color *= smoothstep(1.1, 0.35, vignette);

          gl_FragColor = vec4(color, 1.0);
      }
    `;

    const program = createProgram(gl, vsSource, fsSource);
    if (!program) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPositionLoc = gl.getAttribLocation(program, 'a_position');
    const uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');

    let animId: number;
    const startTime = performance.now();

    const render = (time: number) => {
      if (!isVisibleRef.current) {
        animId = requestAnimationFrame(render);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const w = Math.max(80, Math.floor(rect.width));
      const h = Math.max(50, Math.floor(rect.height));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.useProgram(program);

      gl.enableVertexAttribArray(aPositionLoc);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
      gl.uniform1f(uTimeLoc, (time - startTime) * 0.001);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className={`w-full h-full block object-cover ${className}`} />;
}

function LevelUpShaderCanvas({ className, isVisible = true }: { className?: string; isVisible?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;

      uniform vec2 u_resolution;
      uniform float u_time;

      #define PI 3.14159265359

      // Signed Distance Function for a rounded box
      float sdRoundedBox(vec2 p, vec2 b, float r) {
          vec2 q = abs(p) - b + r;
          return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
      }

      // 16-Bit Pixel Typography for "LEVEL UP"
      float drawLevelUpText(vec2 uvText) {
          if(uvText.x < 0.0 || uvText.x > 32.0 || uvText.y < 0.0 || uvText.y > 7.0) return 0.0;
          
          int ix = int(floor(uvText.x));
          int iy = int(floor(uvText.y)) - 1; // 0..4 for letter body
          
          if(iy < 0 || iy > 4) return 0.0;
          
          // L: x 1..3
          if(ix >= 1 && ix <= 3) {
              int cx = ix - 1;
              if(cx == 0 || iy == 0) return 1.0;
          }
          // E: x 5..7
          else if(ix >= 5 && ix <= 7) {
              int cx = ix - 5;
              if(cx == 0 || iy == 0 || iy == 2 || iy == 4) return 1.0;
          }
          // V: x 9..11
          else if(ix >= 9 && ix <= 11) {
              int cx = ix - 9;
              if((cx == 0 && iy >= 2) || (cx == 2 && iy >= 2) || (cx == 1 && (iy == 0 || iy == 1))) return 1.0;
          }
          // E: x 13..15
          else if(ix >= 13 && ix <= 15) {
              int cx = ix - 13;
              if(cx == 0 || iy == 0 || iy == 2 || iy == 4) return 1.0;
          }
          // L: x 17..19
          else if(ix >= 17 && ix <= 19) {
              int cx = ix - 17;
              if(cx == 0 || iy == 0) return 1.0;
          }
          // U: x 23..25
          else if(ix >= 23 && ix <= 25) {
              int cx = ix - 23;
              if(cx == 0 || cx == 2 || iy == 0) return 1.0;
          }
          // P: x 27..29
          else if(ix >= 27 && ix <= 29) {
              int cx = ix - 27;
              if(cx == 0 || iy == 2 || iy == 4 || (cx == 2 && iy >= 2)) return 1.0;
          }
          
          return 0.0;
      }

      // Draw a single massive 3D Primitive Chevron Arrow
      float drawPrimitiveChevron(vec2 p, float scale, out vec3 colorOut, vec3 colCyan, vec3 colBlue) {
          vec2 cp = p / scale;

          float px = abs(cp.x);
          float sum = px + cp.y;
          
          float w = 0.85;      // Broad 16-bit chevron width
          float thick = 0.22;  // Deep 3D face thickness

          bool inCyan = (sum <= 0.0) && (sum >= -thick) && (px <= w) && (px - cp.y <= w * 1.5);
          bool inShadow = (sum <= -0.02) && (sum >= -thick - 0.12) && (px <= w + 0.04) && (px - cp.y <= w * 1.5 + 0.06);
          bool inHighlight = (sum <= 0.0) && (sum >= -0.04) && (px <= w * 0.85) && (px - cp.y <= w * 1.3);
          bool inOutline = (sum <= 0.04) && (sum >= -thick - 0.16) && (px <= w + 0.06) && (px - cp.y <= w * 1.5 + 0.08);

          if(inHighlight) {
              colorOut = vec3(1.0); // Specular Highlight White
              return 1.0;
          } else if(inCyan) {
              colorOut = colCyan; // Electric Cyan Face
              return 1.0;
          } else if(inShadow) {
              colorOut = colBlue; // Deep Extrusion Blue
              return 1.0;
          } else if(inOutline) {
              colorOut = vec3(0.04, 0.07, 0.14); // Dark Contour Line
              return 0.85;
          }
          
          return 0.0;
      }

      void main() {
          // 16:9 normalized coordinate system (-1.0 to 1.0 on Y axis)
          vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
          uv *= 2.0; // scale to roughly -1.77 to 1.77 horizontally, -1.0 to 1.0 vertically

          // Colors
          vec3 col_bg = vec3(0.117, 0.106, 0.294); // #1E1B4B royal navy
          vec3 col_rim = vec3(0.918, 0.702, 0.031); // #EAB308 gold rim
          vec3 col_interior = vec3(0.059, 0.090, 0.165); // #0F172A dark interior
          vec3 col_fill = vec3(0.980, 0.800, 0.043); // #FACC15 / #F59E0B energy
          vec3 col_cyan = vec3(0.220, 0.741, 0.973); // #38BDF8
          vec3 col_blue = vec3(0.114, 0.306, 0.847); // #1D4ED8

          vec3 finalColor = col_bg;

          // Vignette
          float vig = length(uv * 0.5);
          finalColor *= mix(1.2, 0.4, vig);

          // --- TIMING CYCLE (6.5 seconds total - Snappy, Fast-Looping Reward) ---
          float cycleTime = mod(u_time, 6.5);
          
          // STAGE 1: EXP Bar fills from 0.0s to 3.0s
          float fillProgress = clamp(cycleTime / 3.0, 0.0, 1.0);
          // STAGE 4: EXP Bar resets between 5.0s and 5.5s
          if (cycleTime > 5.0) {
              fillProgress = 1.0 - clamp((cycleTime - 5.0) / 0.5, 0.0, 1.0);
          }

          // --- STAGGERED TIMING CONTROL ---
          // 1. "LEVEL UP" Text: Slides down at 3.0s, holds, retracts at 5.1s
          float textProgress = smoothstep(3.0, 3.5, cycleTime) * (1.0 - smoothstep(5.1, 5.7, cycleTime));

          // 2. Flare & Particle Aura: Activates cleanly at 3.0s, and fades rapidly right after chevrons exit (5.0s to 5.6s)!
          float flareProgress = smoothstep(3.0, 3.5, cycleTime) * (1.0 - smoothstep(5.0, 5.6, cycleTime));


          // --- FLANKING ORNAMENTS (Dashed Elevator Velocity Lines) ---
          float dashLineX = 1.25;
          for(float side = -1.0; side <= 1.0; side += 2.0) {
              float xDist = abs(uv.x - side * dashLineX);
              if(xDist < 0.03) {
                  float dash = mod(uv.y * 15.0 - u_time * 4.0 * side, 2.0);
                  if(dash < 1.0) {
                      finalColor += vec3(0.8) * (0.03 - xDist) * 15.0;
                  }
              }
          }

          // --- FLOATING ENERGY PARTICLES ---
          float speedMult = mix(0.5, 1.35, flareProgress);
          for(int i = 0; i < 18; i++) {
              float id = float(i);
              float t = mod(cycleTime * speedMult + id * 0.4, 3.2);
              float px = sin(id * 43.1 + u_time * 0.5) * 1.35;
              float py = -1.1 + t * 0.85;
              vec2 pPos = vec2(px, py);
              float pDist = length(uv - pPos);
              if(pDist < 0.055) {
                  float glow = 0.055 / (pDist + 0.01);
                  finalColor += col_cyan * glow * (0.15 + 0.15 * flareProgress);
              }
          }

          // --- BACKGROUND CELEBRATION AURA & SHOCKWAVES ---
          if(flareProgress > 0.001) {
              // Celestial Flare behind upper sky
              vec2 flareUv = uv - vec2(0.0, 0.35);
              float flareDist = length(flareUv);
              float flare = (1.0 - flareDist * 1.1) * flareProgress;
              finalColor += (col_rim + col_cyan) * max(0.0, flare) * 0.65;

              // Shockwave 1: Triggers at 3.1s with Arrow 1 Ease-In launch
              float shockTime1 = clamp((cycleTime - 3.1) / 0.9, 0.0, 1.0);
              if(shockTime1 > 0.0 && shockTime1 < 1.0) {
                  float r1 = shockTime1 * 1.5;
                  float ringDist1 = abs(length(uv - vec2(0.0, 0.25)) - r1);
                  if(ringDist1 < 0.035) {
                      finalColor = mix(finalColor, col_cyan, (1.0 - shockTime1) * 0.85);
                  }
              }

              // Shockwave 2: STAGGERED! Triggers at 3.38s with Arrow 2 Ease-In launch (~280ms delay)
              float shockTime2 = clamp((cycleTime - 3.38) / 0.9, 0.0, 1.0);
              if(shockTime2 > 0.0 && shockTime2 < 1.0) {
                  float r2 = shockTime2 * 1.5;
                  float ringDist2 = abs(length(uv - vec2(0.0, 0.40)) - r2);
                  if(ringDist2 < 0.035) {
                      finalColor = mix(finalColor, col_cyan, (1.0 - shockTime2) * 0.85);
                  }
              }

              // Floating streaming micro-chevrons rising in background
              for(int s = 0; s < 6; s++) {
                  float sf = float(s);
                  float st = mod(u_time * 1.107692 + sf * 0.3, 1.8);
                  vec2 sp = uv - vec2((sf - 2.5) * 0.3, -0.4 + st * 0.8);
                  float spx = abs(sp.x);
                  float ssum = spx + sp.y;
                  if(ssum <= 0.0 && ssum >= -0.05 && spx <= 0.18 && spx - sp.y <= 0.25) {
                      float alpha = (1.0 - st / 1.8) * 0.5 * flareProgress;
                      finalColor = mix(finalColor, col_cyan, alpha);
                  }
              }
          }

          // --- GOLD COIN TOKENS BURST ---
          if(flareProgress > 0.001) {
              for(int c = 0; c < 7; c++) {
                  float cId = float(c);
                  float cOffsetTime = mod((cycleTime - 3.1) * 0.9 + cId * 0.14, 1.0);
                  vec2 coinPos = vec2(sin(cId * 2.2) * 0.85, -0.3 + cOffsetTime * 1.15);
                  float coinDist = length(uv - coinPos);
                  if(coinDist < 0.045) {
                      finalColor = col_fill * flareProgress;
                      if(coinDist > 0.032) finalColor = vec3(1.0) * flareProgress;
                  }
              }
          }


          // --- HIGH-SPEED TEMPORALLY STAGGERED 3D CHEVRONS (2X SPEED, MATCHING EASE-IN CURVES) ---
          // MASK CONSTRAINT: uv.y >= -0.08 ensures chevrons NEVER render below the EXP bar!

          // ARROW 1: Primary Lower Chevron Arrow (Launches FIRST at 3.10s with Ease-In acceleration at 2x speed!)
          if(cycleTime >= 3.10 && cycleTime < 5.40 && uv.y >= -0.08) {
              float dt1 = cycleTime - 3.10;
              float normT1 = clamp(dt1 / 1.4, 0.0, 1.0); // 1.4s total flight time
              
              // Ease-In Exponential Motion: Starts gracefully, accelerates rapidly into upper sky
              float easeIn1 = pow(normT1, 2.0);
              float c1Y = mix(-0.08, 1.45, easeIn1);
              
              // Smooth emergence behind bar & quick fade near upper sky
              float alpha1 = smoothstep(0.0, 0.12, normT1) * (1.0 - smoothstep(0.70, 0.98, normT1));
              
              if(alpha1 > 0.001) {
                  vec2 c1Center = vec2(0.0, c1Y);
                  vec2 p1 = uv - c1Center;

                  // Micro 3D float wobble
                  float wobble1 = sin(u_time * 6.0) * 0.03;
                  p1.x *= (1.0 + wobble1);
                  p1.y *= (1.0 - wobble1);

                  vec3 c1Color;
                  float c1Hit = drawPrimitiveChevron(p1, 0.95, c1Color, col_cyan, col_blue); // MASSIVE 0.95 scale!
                  if(c1Hit > 0.0) {
                      finalColor = mix(finalColor, c1Color, alpha1 * c1Hit);
                  }
              }
          }

          // ARROW 2: Primary Upper Chevron Arrow (STAGGERED LAUNCH second at 3.38s [280ms DELAY!] with matching Ease-In at 2x speed!)
          if(cycleTime >= 3.38 && cycleTime < 5.68 && uv.y >= -0.08) {
              float dt2 = cycleTime - 3.38;
              float normT2 = clamp(dt2 / 1.4, 0.0, 1.0); // 1.4s total flight time
              
              // Matching Ease-In Exponential Motion
              float easeIn2 = pow(normT2, 2.0);
              float c2Y = mix(-0.08, 1.55, easeIn2);
              
              // Smooth emergence behind bar & quick fade near upper sky
              float alpha2 = smoothstep(0.0, 0.12, normT2) * (1.0 - smoothstep(0.70, 0.98, normT2));
              
              if(alpha2 > 0.001) {
                  vec2 c2Center = vec2(0.0, c2Y);
                  vec2 p2 = uv - c2Center;

                  // Micro 3D float wobble (out-of-phase with Arrow 1 for organic feel)
                  float wobble2 = sin(u_time * 6.0 + 1.5) * 0.03;
                  p2.x *= (1.0 + wobble2);
                  p2.y *= (1.0 - wobble2);

                  vec3 c2Color;
                  float c2Hit = drawPrimitiveChevron(p2, 0.82, c2Color, col_cyan, col_blue); // Sleek 0.82 scale!
                  if(c2Hit > 0.0) {
                      finalColor = mix(finalColor, c2Color, alpha2 * c2Hit);
                  }
              }
          }


          // --- SLIDING "LEVEL UP" TEXT (UNDER THE GAUGE BAR - NO BOX PANEL) ---
          if(textProgress > 0.001) {
              float currentY = mix(-0.15, -0.58, textProgress);
              vec2 textCenter = vec2(0.0, currentY);
              vec2 textPos = uv - textCenter;

              // Large pixel coordinate scale
              vec2 pixelUv = vec2((textPos.x + 0.882) * 17.0, (textPos.y + 0.12) * 25.0);
              
              float mainText = drawLevelUpText(pixelUv);
              if(mainText > 0.5) {
                  finalColor = vec3(1.0); // Crisp Capslock White
              } else {
                  // 8-neighbor dark outline for crisp contrast
                  float outline = 0.0;
                  outline += drawLevelUpText(pixelUv + vec2(0.8, 0.0));
                  outline += drawLevelUpText(pixelUv + vec2(-0.8, 0.0));
                  outline += drawLevelUpText(pixelUv + vec2(0.0, 0.8));
                  outline += drawLevelUpText(pixelUv + vec2(0.0, -0.8));
                  outline += drawLevelUpText(pixelUv + vec2(0.8, 0.8));
                  outline += drawLevelUpText(pixelUv + vec2(-0.8, 0.8));
                  outline += drawLevelUpText(pixelUv + vec2(0.8, -0.8));
                  outline += drawLevelUpText(pixelUv + vec2(-0.8, -0.8));
                  
                  if(outline > 0.5) {
                      finalColor = vec3(0.02, 0.02, 0.06); // Dark 16-bit contour line
                  }
              }
          }


          // --- CENTRAL EXPERIENCE GAUGE TUBE (With Escalating Step Bump & Violent Tension Shake) ---
          float totalTicks = fillProgress * 8.0;
          float currentTick = floor(totalTicks);
          float tickFrac = fract(totalTicks);

          // Steam & Tension Release: Smooth, gradual ease-out as chevrons soar upward (3.1s to 4.3s)
          float coolOff = smoothstep(3.1, 4.3, cycleTime);
          float tensionMult = 1.0 - coolOff;

          float urgencyFactor = clamp(currentTick / 7.0, 0.0, 1.0) * tensionMult; // 0.0 on 1st tick -> 1.0 on 8th tick, then cools down!

          // Escalating Step Bump: Bar 1 gives a light tap, Bar 8 gives a MASSIVE explosive pop!
          float bumpAmplitude = (0.02 + pow(clamp(currentTick / 7.0, 0.0, 1.0), 2.0) * 0.09) * tensionMult;
          float tickBump = exp(-tickFrac * 10.0) * sin(tickFrac * 24.0) * bumpAmplitude;

          // Escalating Violent Shake: High frequency chaotic jitter that builds exponentially up to bar 8, then immediately releases!
          float shakeIntensity = pow(fillProgress, 2.5) * 0.025 * tensionMult;
          vec2 tensionShake = vec2(
              sin(u_time * 75.0 + currentTick * 12.0),
              cos(u_time * 90.0 + currentTick * 8.0)
          ) * shakeIntensity;

          vec2 gaugeCenter = vec2(tensionShake.x, -0.1 + tickBump + tensionShake.y);
          vec2 gaugeSize = vec2(1.1 + tickBump * 0.7 + shakeIntensity * 0.3, 0.22 + tickBump * 0.5 + shakeIntensity * 0.2);
          
          // Drop shadow
          vec2 shadowUv = uv - gaugeCenter + vec2(0.0, -0.05);
          float shadowBox = sdRoundedBox(shadowUv, gaugeSize, 0.05);
          if(shadowBox < 0.0) {
              finalColor *= 0.6;
          }

          // Outer Rim (Shifts from Gold to Hot Orange/Crimson on full charge, cools back to Gold on launch!)
          vec2 tubeUv = uv - gaugeCenter;
          tubeUv.x += tubeUv.y * 0.2; // 3D slant
          
          float outerBox = sdRoundedBox(tubeUv, gaugeSize, 0.06);
          float innerBox = sdRoundedBox(tubeUv, gaugeSize - vec2(0.04, 0.04), 0.03);
          
          // Escalating outer energy aura around the tube (fades on cool off)
          if (outerBox > 0.0 && outerBox < 0.12) {
              float auraGlow = (1.0 - outerBox / 0.12) * pow(fillProgress, 2.0) * 0.7 * tensionMult;
              vec3 auraColor = mix(col_rim, vec3(0.98, 0.2, 0.1), urgencyFactor);
              finalColor += auraColor * auraGlow;
          }

          if(outerBox < 0.0) {
              if(innerBox > 0.0) {
                  // Rim shifts color with increasing tension, cools back to pristine gold
                  vec3 dynamicRim = mix(col_rim, vec3(1.0, 0.3, 0.1), pow(urgencyFactor, 1.5));
                  finalColor = dynamicRim;
                  if(tubeUv.y > 0.08 && tubeUv.x < 0.0) {
                      finalColor = mix(vec3(1.0), vec3(1.0, 0.8, 0.6), urgencyFactor); // Glare intensity
                  }
              } else {
                  // Interior Dark Background
                  finalColor = col_interior;

                  // 8 Discrete LED Tick Bars (Octo Homage with Yellow -> Orange -> Crimson Red Gradient)
                  float numTicks = 8.0;
                  float innerWidth = gaugeSize.x - 0.08;
                  float tickWidth = (innerWidth * 2.0) / numTicks;
                  
                  float localX = tubeUv.x + innerWidth;
                  if(localX >= 0.0 && localX <= innerWidth * 2.0) {
                      float tickIndex = floor(localX / tickWidth);
                      float tickLocalCoord = mod(localX, tickWidth);
                      
                      if(tickLocalCoord > 0.010 && tickLocalCoord < tickWidth - 0.010) {
                          float activeThreshold = (tickIndex + 1.0) / numTicks;
                          
                          if(fillProgress >= (tickIndex / numTicks)) {
                              // COLOR PROGRESSION: Yellow -> Flame Orange -> Crimson Red on 8th bar!
                              float tColor = tickIndex / 7.0; // 0.0 to 1.0
                              vec3 colYellow = vec3(0.980, 0.850, 0.050); // Tick 1: Electric Yellow
                              vec3 colOrange = vec3(0.980, 0.450, 0.020); // Tick 4/5: Flame Orange
                              vec3 colRed    = vec3(0.980, 0.050, 0.120); // Tick 8: Crimson Red

                              vec3 tickCol;
                              if (tColor < 0.5) {
                                  tickCol = mix(colYellow, colOrange, tColor * 2.0);
                              } else {
                                  tickCol = mix(colOrange, colRed, (tColor - 0.5) * 2.0);
                              }

                              // Active tick pulsing urgency: frequency & glow accelerate exponentially per bar
                              float barUrgency = tickIndex / 7.0;
                              float pulseSpeed = 16.0 + barUrgency * 35.0;
                              float pulse = sin(u_time * pulseSpeed) * (0.15 + barUrgency * 0.35) + 0.85;
                              
                              // Scale brightness & hot center flash for higher bars
                              tickCol *= (1.0 + barUrgency * 0.5);
                              
                              if(fillProgress >= activeThreshold - 0.15 && fillProgress < activeThreshold + 0.05) {
                                  tickCol *= pulse * (1.3 + barUrgency * 0.6); // Explosive brightness punch on current bar!
                              }
                              finalColor = tickCol;
                          }
                      }
                  }
                  
                  // Scanline effect inside tube - speeds up with tension
                  float scanline = sin(uv.y * (120.0 + urgencyFactor * 60.0) + u_time * urgencyFactor * 10.0) * 0.08;
                  finalColor -= vec3(scanline);
              }
          }

          // Outer contour highlight
          if(outerBox < 0.01 && outerBox > 0.0) {
              finalColor = vec3(1.0);
          }


          // --- 16-BIT RETRO COLOR QUANTIZATION ---
          finalColor = floor(finalColor * 16.0) / 16.0;

          gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const program = createProgram(gl, vsSource, fsSource);
    if (!program) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPositionLoc = gl.getAttribLocation(program, 'a_position');
    const uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');

    let animId: number;
    const startTime = performance.now();

    const render = (time: number) => {
      if (!isVisibleRef.current) {
        animId = requestAnimationFrame(render);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const w = Math.max(80, Math.floor(rect.width));
      const h = Math.max(50, Math.floor(rect.height));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.useProgram(program);

      gl.enableVertexAttribArray(aPositionLoc);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
      gl.uniform1f(uTimeLoc, (time - startTime) * 0.001);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className={`w-full h-full block object-cover ${className}`} />;
}

function FactoryShaderCanvas({ className, isVisible = true }: { className?: string; isVisible?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;

      // SDF for rounded box with outline
      float sdRoundedBox(vec2 p, vec2 b, vec4 r) {
          r.xy = (p.x > 0.0) ? r.xy : r.zw;
          r.x  = (p.y > 0.0) ? r.x  : r.y;
          vec2 q = abs(p) - b + r.x;
          return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
      }

      // Circle SDF
      float sdCircle(vec2 p, float r) {
          return length(p) - r;
      }

      // Segment SDF for lines
      float sdSegment(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
      }

      // Arc SDF with smooth rounded caps (aperture is half-angle of arc)
      float sdArc(vec2 p, float aperture, float ra, float rb) {
          vec2 q = p;
          q.x = abs(q.x);
          vec2 sc = vec2(sin(aperture), cos(aperture));
          float isPast = dot(q, vec2(sc.y, sc.x));
          if (isPast > 0.0) {
              return length(q - ra * vec2(sc.x, -sc.y)) - rb;
          } else {
              return abs(length(q) - ra) - rb;
          }
      }

      // Eye shape SDF supporting 4 distinct varieties: 0=Dot, 1=Sharp ^ Caret, 2=Round Arch ∩, 3=Vertical Prolonged |
      float getEyeSDF(vec2 p, int eyeType) {
          if (eyeType == 1) { // 1: Sharp ^ Caret eye (50% thicker stroke)
              vec2 pM = vec2(abs(p.x), p.y);
              return sdSegment(pM, vec2(0.0, 0.007), vec2(0.008, -0.005)) - 0.0042;
          } else if (eyeType == 2) { // 2: Round Arch ∩ eye (50% thicker stroke)
              vec2 q = vec2(p.x, -p.y + 0.002);
              return sdArc(q, 1.25, 0.007, 0.0042);
          } else if (eyeType == 3) { // 3: Vertically prolonged | eye (50% thicker stroke)
              return sdSegment(p, vec2(0.0, -0.008), vec2(0.0, 0.008)) - 0.0048;
          }
          // 0: Default circular dot eye
          return length(p) - 0.0095;
      }

      // 2D Rotation matrix
      mat2 rotate2d(float angle) {
          float s = sin(angle), c = cos(angle);
          return mat2(c, -s, s, c);
      }

      // Draw bold white "FUN" text with clean segment SDF font
      float drawFUN(vec2 p) {
          float d = 1e5;
          float w = 0.12; // Stroke thickness

          // --- Letter 'F' ---
          d = min(d, sdSegment(p, vec2(-1.25, -0.65), vec2(-1.25, 0.65))); // Stem
          d = min(d, sdSegment(p, vec2(-1.25, 0.65), vec2(-0.75, 0.65)));  // Top bar
          d = min(d, sdSegment(p, vec2(-1.25, 0.05), vec2(-0.85, 0.05)));  // Mid bar

          // --- Letter 'U' ---
          d = min(d, sdSegment(p, vec2(-0.32, -0.65), vec2(-0.32, 0.65))); // Left stem
          d = min(d, sdSegment(p, vec2(0.32, -0.65), vec2(0.32, 0.65)));   // Right stem
          d = min(d, sdSegment(p, vec2(-0.32, -0.65), vec2(0.32, -0.65))); // Bottom bar

          // --- Letter 'N' ---
          d = min(d, sdSegment(p, vec2(0.75, -0.65), vec2(0.75, 0.65)));   // Left stem
          d = min(d, sdSegment(p, vec2(1.30, -0.65), vec2(1.30, 0.65)));   // Right stem
          d = min(d, sdSegment(p, vec2(0.75, 0.65), vec2(1.30, -0.65)));   // Diagonal

          return step(d, w);
      }

      // SDF for "+1" text (doubled size)
      float sdPlusOne(vec2 p) {
          // Plus sign '+'
          float dPlus = min(
              sdSegment(p, vec2(-0.090, 0.0), vec2(-0.030, 0.0)),
              sdSegment(p, vec2(-0.060, -0.030), vec2(-0.060, 0.030))
          );
          // Number '1'
          float dOne = min(
              min(
                  sdSegment(p, vec2(0.060, -0.044), vec2(0.060, 0.044)), // Stem
                  sdSegment(p, vec2(0.036, 0.020), vec2(0.060, 0.044))   // Top hook
              ),
              sdSegment(p, vec2(0.036, -0.044), vec2(0.084, -0.044))     // Base
          );
          return min(dPlus, dOne);
      }

      void main() {
          // Normalized pixel coordinates (from -1 to 1, aspect corrected)
          vec2 st = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
          
          // Background color (Deep dark purple hint)
          vec3 col = vec3(0.12, 0.08, 0.18);
          
          // Subtle grid/scanlines background
          float grid = sin(st.x * 40.0) * sin(st.y * 40.0);
          col += vec3(grid * 0.018, grid * 0.012, grid * 0.024);

          // --- Time scaling ---
          float t_conveyor = u_time * 0.27;

          // Calculate cannon recoil/stretch based on box spawning
          float launchPhase = 0.0;
          for(int i = 0; i < 4; i++) {
              float offset = float(i) * 0.45 + 0.684;
              float bx = mod(t_conveyor + offset, 1.8) - 0.9;
              if (bx >= -0.80 && bx <= -0.60) {
                  float p = (bx - (-0.80)) / 0.20;
                  launchPhase = max(launchPhase, sin(p * 3.14159));
              }
          }
          float hStretchY = 1.0 + launchPhase * 0.22; // Stretch vertically on charge/recoil
          float hStretchX = 1.0 - launchPhase * 0.15; // Compress horizontally

          // --- STAGE 2: Conveyor Belt & Turning Gears ---
          // Conveyor Gears/Pulleys (drawn FIRST so they are behind the conveyor belt)
          vec2 gear1Pos = st - vec2(-0.71, -0.25);
          vec2 gear2Pos = st - vec2(0.71, -0.25);
          float g1 = sdCircle(gear1Pos, 0.09);
          float g2 = sdCircle(gear2Pos, 0.09);
          if (g1 < 0.0 || g2 < 0.0) {
              col = vec3(0.39, 0.45, 0.55);
              // Spoke cutouts
              vec2 gp = g1 < 0.0 ? gear1Pos : gear2Pos;
              gp *= rotate2d(t_conveyor * 6.283185);
              if (abs(mod(atan(gp.y, gp.x), 1.57) - 0.78) < 0.3 && length(gp) < 0.07) {
                  col = vec3(0.18, 0.22, 0.3);
              }
          }
          if (abs(g1) < 0.01 || abs(g2) < 0.01) {
              col = vec3(0.12, 0.16, 0.23);
          }

          // Conveyor Belt (drawn over gears)
          vec2 beltPos = st - vec2(0.0, -0.2);
          float beltD = sdRoundedBox(beltPos, vec2(0.8, 0.06), vec4(0.03));
          if (beltD < 0.0) {
              // Belt metal texture lines scrolling
              float pattern = fract(beltPos.x * 10.0 - t_conveyor * 3.0);
              vec3 beltColor = (pattern < 0.2) ? vec3(0.25, 0.3, 0.4) : vec3(0.18, 0.22, 0.3);
              col = beltColor;
          }
          if (abs(beltD) < 0.015) {
              col = vec3(0.12, 0.16, 0.23);
          }

          // --- STAGE 3: Heavy Arcade Stamping Press Cadence Calculation ---
          // Slowed down time with rhythmic industrial cadence
          float cycle = fract(u_time * 0.6);
          float stampProgress = 0.0; // 0.0 = Top (Rest), 1.0 = Bottom (Impact)

          if (cycle < 0.40) {
              // Pause / hold at top
              stampProgress = 0.0;
          } else if (cycle < 0.48) {
              // Fast drop slam (accelerating downwards BAM!)
              float dropT = (cycle - 0.40) / 0.08;
              stampProgress = dropT * dropT;
          } else if (cycle < 0.58) {
              // Short impact dwell / pause at bottom
              stampProgress = 1.0;
          } else {
              // Slow retreat back to top (ease out)
              float retreatT = (cycle - 0.58) / 0.42;
              stampProgress = 1.0 - smoothstep(0.0, 1.0, retreatT);
          }

          float stampY = mix(0.28, -0.01, stampProgress);

          // --- MOVING GAME BLOCKS (Perpetual Assembly) ---
          // Loop blocks along the conveyor
          for(int i = 0; i < 4; i++) {
              float offset = float(i) * 0.45 + 0.684;
              float bx = mod(t_conveyor + offset, 1.8) - 0.9;
              
              float by = -0.12;
              float curBx = bx;
              float squishX = 1.0;
              float squishY = 1.0;
              
              // Spew / Drop animation from Cannon at x = -0.60
              if (bx < -0.60) {
                  if (bx < -0.78) {
                      // Hide box before it shoots out of cannon
                      continue;
                  }
                  float dropProgress = (bx - (-0.78)) / 0.18; // 0.0 to 1.0
                  float dropT = smoothstep(0.0, 1.0, dropProgress);
                  by = mix(0.20, -0.12, dropT); // Drop vertically from moderately elevated cannon nozzle to conveyor
                  curBx = -0.60; // Strictly straight vertical drop at x = -0.60
                  
                  // Stretch vertically as box shoots out
                  squishY = 1.0 + (1.0 - dropT) * 0.25;
                  squishX = 1.0 - (1.0 - dropT) * 0.18;
              } else {
                  // Momentary pause / deceleration at stamping station (x = 0.0)
                  float pauseFactor = 1.0 - smoothstep(0.0, 0.07, abs(bx));
                  curBx = mix(bx, 0.0, pauseFactor * 0.88);
              }

              // Squish and press physics near stamp (x = 0.0)
              if (abs(curBx) < 0.15) {
                  float distFactor = 1.0 - (abs(curBx) / 0.15);
                  // Box flattens ONLY when stamper reaches lowest point (cycle >= 0.48)
                  float flattenProgress = (cycle >= 0.48) ? stampProgress : 0.0;
                  float squishAmt = flattenProgress * distFactor;
                  by -= squishAmt * 0.008; // Subtle vertical nudge
                  squishX = 1.0 + squishAmt * 0.12; // Subtle horizontal expansion
                  squishY = 1.0 - squishAmt * 0.10; // Subtle vertical compression
              }

              // Collect animation (scale up & fade out) past second wheel (x >= 0.71)
              float collectAlpha = 1.0;
              if (curBx >= 0.71) {
                  float collectProgress = clamp((curBx - 0.71) / 0.18, 0.0, 1.0);
                  float collectScale = 1.0 + collectProgress * 0.45;
                  squishX *= collectScale;
                  squishY *= collectScale;
                  collectAlpha = 1.0 - smoothstep(0.0, 0.95, collectProgress);
              }

              vec3 preBlockCol = col;
              vec2 blockPos = (st - vec2(curBx, by)) * vec2(1.0 / squishX, 1.0 / squishY);
              float blockD = sdRoundedBox(blockPos, vec2(0.09), vec4(0.02));

              if (blockD < 0.0) {
                  // Alternate colors per block index
                  vec3 bCol = vec3(0.29, 0.87, 0.5); // Green base
                  if (i == 1) bCol = vec3(0.98, 0.8, 0.08); // Yellow
                  if (i == 2) bCol = vec3(0.22, 0.74, 0.97); // Blue
                  if (i == 3) bCol = vec3(0.75, 0.52, 0.99); // Purple
                  
                  // 3D bottom lip shading
                  if (blockPos.y < -0.05) {
                      bCol *= 0.6;
                  }
                  col = bCol;

                  // Draw smiley face on boxes after they have been stamped (curBx >= 0.015, ~100ms after stamp strike)
                  if (curBx >= 0.015) {
                      // Parameter spectrum per box index i for unique expressions and eye shapes
                      float eyeX = 0.032;
                      float eyeY = 0.022;
                      float mouthRadius = 0.028;
                      float aperture = 1.0;
                      float mouthOffsetY = 0.008;
                      float mouthRb = 0.0052;
                      int eyeType = 0; // 0=Dot, 1=Sharp ^, 2=Round Arch ∩, 3=Vertical |

                      if (i == 0) { // Green box: wide eye placement, dot circular eyes, cute compact smile
                          eyeX = 0.042;
                          eyeY = 0.024;
                          mouthRadius = 0.024;
                          aperture = 0.85;
                          mouthOffsetY = 0.006;
                          mouthRb = 0.0048;
                          eyeType = 0; // Circular dot eyes
                      } else if (i == 1) { // Yellow box: normal eye placement, cute ^ ^ caret eyes, big wide open grin
                          eyeX = 0.033;
                          eyeY = 0.022;
                          mouthRadius = 0.032;
                          aperture = 1.20;
                          mouthOffsetY = 0.008;
                          mouthRb = 0.0057;
                          eyeType = 1; // Sharp ^ Caret eyes
                      } else if (i == 2) { // Blue box: closer eye placement, round arch ∩ eyes, high cheerful smile
                          eyeX = 0.026;
                          eyeY = 0.025;
                          mouthRadius = 0.026;
                          aperture = 0.95;
                          mouthOffsetY = 0.011;
                          mouthRb = 0.0048;
                          eyeType = 2; // Round Arch ∩ eyes
                      } else if (i == 3) { // Purple box: moderately wide placement, vertically prolonged | eyes, soft pleasant grin
                          eyeX = 0.038;
                          eyeY = 0.020;
                          mouthRadius = 0.028;
                          aperture = 1.05;
                          mouthOffsetY = 0.005;
                          mouthRb = 0.0051;
                          eyeType = 3; // Vertically prolonged | eyes
                      }

                      float dEyeL = getEyeSDF(blockPos - vec2(-eyeX, eyeY), eyeType);
                      float dEyeR = getEyeSDF(blockPos - vec2(eyeX, eyeY), eyeType);
                      float dEyes = min(dEyeL, dEyeR);

                      vec2 mouthPos = blockPos - vec2(0.0, mouthOffsetY);
                      float dMouth = sdArc(mouthPos, aperture, mouthRadius, mouthRb);

                      float dFace = min(dEyes, dMouth);
                      float faceAlpha = 1.0 - smoothstep(-0.001, 0.001, dFace);
                      col = mix(col, vec3(0.12, 0.16, 0.23), faceAlpha);
                  }
              }
              if (abs(blockD) < 0.012) {
                  col = vec3(0.12, 0.16, 0.23); // Dark outline
              }

              // Apply box collect fade-out (opacity 1.0 -> 0.0)
              if (curBx >= 0.71) {
                  col = mix(preBlockCol, col, collectAlpha);
              }

              // Floating "+1" text emission at the second wheel on the right (stationary x = 0.71)
              if (curBx >= 0.71 && curBx <= 0.89) {
                  float pProgress = (curBx - 0.71) / 0.18;
                  float textX = 0.71; // Fixed horizontal position over the second wheel
                  float textY = by + 0.20 + pProgress * 0.16; // Rises vertically starting higher above box
                  vec2 pText = st - vec2(textX, textY);
                  float dText = sdPlusOne(pText);

                  float innerAlpha = 1.0 - smoothstep(0.009, 0.011, dText);
                  float outerAlpha = 1.0 - smoothstep(0.024, 0.026, dText);
                  if (outerAlpha > 0.0) {
                      vec3 tCol = mix(vec3(0.12, 0.16, 0.23), vec3(1.0, 1.0, 1.0), innerAlpha);
                      float fadeAlpha = (1.0 - smoothstep(0.2, 1.0, pProgress)) * outerAlpha;
                      col = mix(col, tCol, fadeAlpha);
                  }
              }
          }

          // --- STAGE 1 (LAYERED OVER BLOCKS): Hopper & Dispenser Cannon (Left) ---
          vec2 hopperPos = (st - vec2(-0.6, 0.28)) * vec2(1.0 / hStretchX, 1.0 / hStretchY);
          // Rotated 90 degrees to the right so the curved side faces UP
          vec2 rotHopperP = (hopperPos + vec2(0.0, -0.1)) * rotate2d(1.5707963);
          float hopperD = sdRoundedBox(rotHopperP, vec2(0.15, 0.2), vec4(0.02, 0.02, 0.1, 0.1));
          // Hopper outline & fill
          if (hopperD < 0.0) {
              // Base metallic silver gradient
              col = mix(vec3(0.55, 0.59, 0.66), vec3(0.82, 0.85, 0.90), hopperPos.y + 0.2);

              // Vertical specular metallic highlight stripe
              if (abs(hopperPos.x - 0.02) < 0.04) {
                  col = mix(col, vec3(0.95, 0.97, 1.0), 0.6);
              }

              // Top metallic glow / shine rim (smaller size)
              if (hopperPos.y > 0.15) {
                  col = vec3(0.88, 0.94, 1.0);
              }

              // Bottom hazard stripe band (black & yellow diagonal lines)
              if (hopperPos.y < 0.005 && hopperPos.y > -0.13) {
                  float hazardPattern = fract((hopperPos.x + hopperPos.y) * 25.0);
                  if (hazardPattern < 0.5) {
                      col = vec3(0.98, 0.82, 0.05); // Industrial Hazard Yellow
                  } else {
                      col = vec3(0.12, 0.14, 0.18); // Industrial Black
                  }
              }

              // Bottom dark metallic shadow rim
              if (hopperPos.y <= -0.13) {
                  col = vec3(0.35, 0.38, 0.44);
              }
          }
          // Hopper outline stroke
          if (abs(hopperD) < 0.015) {
              col = vec3(0.12, 0.16, 0.23);
          }

          // --- STAGE 3 (DRAWING): Piston Pipe & Red Stamper Press ---
          // 1. Piston Rod Pipe (drawn FIRST so the red stamper covers its bottom end)
          // Extended high up (centered at stampY + 0.6 with half-height 0.6 -> reaches past screen top)
          vec2 rodPos = st - vec2(0.0, stampY + 0.6);
          float rodD = sdRoundedBox(rodPos, vec2(0.035, 0.6), vec4(0.01));
          if (rodD < 0.0) {
              col = vec3(0.60, 0.65, 0.72); // Metallic pipe
              // Metallic highlight stripe
              if (rodPos.x > 0.005 && rodPos.x < 0.02) {
                  col = vec3(0.85, 0.88, 0.95);
              }
          }
          if (abs(rodD) < 0.01) {
              col = vec3(0.12, 0.16, 0.23); // Dark outline
          }

          // 2. Red Stamper Press (drawn SECOND so it covers the bottom of the piston rod)
          vec2 stampPos = st - vec2(0.0, stampY);
          float stampD = sdRoundedBox(stampPos, vec2(0.12, 0.08), vec4(0.03));
          
          if (stampD < 0.0) {
              col = vec3(0.9, 0.2, 0.3); // Red mechanical press
              
              // Dark red bottom impact plate (darker shade of stamper red)
              if (stampPos.y < -0.04) {
                  col = vec3(0.52, 0.08, 0.14);
              }
              // Top metallic socket ring
              if (stampPos.y > 0.05) {
                  col = vec3(0.75, 0.15, 0.22);
              }

              // Bold white "FUN" text (moved slightly higher on stamper)
              vec2 funPos = stampPos - vec2(0.0, 0.009);
              if (funPos.y > -0.030 && funPos.y < 0.045 && abs(funPos.x) < 0.09) {
                  vec2 textUV = funPos.xy / vec2(0.045, 0.035);
                  if (drawFUN(textUV) > 0.5) {
                      col = vec3(1.0, 1.0, 1.0); // Bold white text
                  }
              }
          }
          if (abs(stampD) < 0.015) {
              col = vec3(0.12, 0.16, 0.23); // Dark outline
          }


          // --- STAGE 4 & 5: Scoreboard Banner (Top) ---
          vec2 boardPos = st - vec2(0.0, 0.7);
          float boardD = sdRoundedBox(boardPos, vec2(0.45, 0.08), vec4(0.04));
          if (boardD < 0.0) {
              col = vec3(0.15, 0.2, 0.3);
          }
          if (abs(boardD) < 0.015) {
              col = vec3(0.98, 0.8, 0.08); // Golden border
          }

          // Simple pseudo-text glowing lines in scoreboard
          vec2 textPos = boardPos + vec2(0.0, 0.0);
          float textBar1 = sdRoundedBox(textPos + vec2(-0.15, 0.0), vec2(0.12, 0.02), vec4(0.01));
          float textBar2 = sdRoundedBox(textPos + vec2(0.18, 0.0), vec2(0.08, 0.02), vec4(0.01));
          if (textBar1 < 0.0 || textBar2 < 0.0) {
              col = vec3(0.95, 0.95, 1.0);
          }

          // Output final color
          gl_FragColor = vec4(col, 1.0);
      }
    `;

    const program = createProgram(gl, vsSource, fsSource);
    if (!program) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPositionLoc = gl.getAttribLocation(program, 'a_position');
    const uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');

    let animId: number;
    const startTime = performance.now();

    const render = (time: number) => {
      if (!isVisibleRef.current) {
        animId = requestAnimationFrame(render);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const w = Math.max(80, Math.floor(rect.width));
      const h = Math.max(50, Math.floor(rect.height));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.useProgram(program);

      gl.enableVertexAttribArray(aPositionLoc);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
      gl.uniform1f(uTimeLoc, (time - startTime) * 0.001);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className={`w-full h-full block object-cover ${className}`} />;
}

function TeamsLeadShaderCanvas({ className, isVisible = true }: { className?: string; isVisible?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // =========================================================================
    // PLACE YOUR GLSL FRAGMENT SHADER CODE HERE BETWEEN THE BACKTICKS (``)
    // =========================================================================
    const fsSource = `
      precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

// Color Palette
#define WATER_BASE vec3(0.008, 0.518, 0.780)  // #0284C7
#define WATER_SHALLOW vec3(0.220, 0.741, 0.973) // #38BDF8
#define FOAM vec3(1.0, 1.0, 1.0)              // #FFFFFF
#define SAND_TOP vec3(0.961, 0.620, 0.043)    // #F59E0B
#define SAND_CLIFF vec3(0.706, 0.325, 0.035)  // #B45309
#define GRASS_TOP vec3(0.133, 0.773, 0.369)   // #22C55E
#define GRASS_CLIFF vec3(0.082, 0.502, 0.239) // #15803D
#define STONE_TOP vec3(0.392, 0.455, 0.545)  // #64748B
#define STONE_CLIFF vec3(0.200, 0.250, 0.320)
#define BADGE_RED vec3(0.937, 0.267, 0.267)
#define BADGE_GOLD vec3(0.980, 0.800, 0.080)

// Noise Functions
vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                   dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
               mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                   dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    for (int i = 0; i < 4; ++i) {
        v += a * noise(p);
        p = p * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

// Stage Waypoint Centers (Spaced evenly across screen)
#define NODE1 vec2(-0.58, -0.22)
#define NODE2 vec2(-0.20,  0.20)
#define NODE3 vec2( 0.20, -0.20)
#define NODE4 vec2( 0.58,  0.22)

// Distance to line segment
float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

// Single organic island height field using smooth blob union + FBM coastline noise
float islandHeight(vec2 p, vec2 c1, vec2 c2, float r1, float r2) {
    float d1 = length(p - c1) - r1;
    float d2 = length(p - c2) - r2;
    float d = min(d1, d2);
    // Natural coastline organic noise
    float n = fbm(p * 3.2) * 0.10 + noise(p * 8.0) * 0.03;
    float dOrganic = d - n;
    return clamp(0.70 - dOrganic * 2.2, 0.0, 1.0);
}

// Small decorative islet height field
float isletHeight(vec2 p, vec2 center, float radius) {
    float d = length(p - center) - radius;
    float n = noise(p * 7.0) * 0.035;
    float dOrg = d - n;
    return clamp(0.55 - dOrg * 2.8, 0.0, 1.0);
}

// Heightmap defining 4 distinct organic archipelago islands + tiny decorative islets
float mapHeightRaw(vec2 p) {
    // 4 Main stage islands centered on NODE1..NODE4 with natural secondary lobes
    float h1 = islandHeight(p, NODE1, NODE1 + vec2(-0.08,  0.07), 0.14, 0.09);
    float h2 = islandHeight(p, NODE2, NODE2 + vec2( 0.09, -0.06), 0.15, 0.10);
    float h3 = islandHeight(p, NODE3, NODE3 + vec2(-0.07, -0.08), 0.14, 0.09);
    float h4 = islandHeight(p, NODE4, NODE4 + vec2( 0.08,  0.07), 0.15, 0.10);
    
    // Decorative tiny rocks/islets in open water
    float t1 = isletHeight(p, vec2(-0.65,  0.25), 0.025);
    float t2 = isletHeight(p, vec2(-0.35, -0.38), 0.030);
    float t3 = isletHeight(p, vec2( 0.02,  0.38), 0.028);
    float t4 = isletHeight(p, vec2( 0.62, -0.32), 0.026);
    float t5 = isletHeight(p, vec2(-0.02, -0.05), 0.022);

    float hIslands = max(max(h1, h2), max(h3, h4));
    float hTiny = max(max(max(t1, t2), max(t3, t4)), t5);
    
    return clamp(max(hIslands, hTiny), 0.0, 1.0);
}

// Discrete Height Tiers (0: Water, 1: Sand, 2: Grass, 3: High Grass/Stone)
int getTier(float h) {
    if (h < 0.40) return 0;
    if (h < 0.49) return 1;
    if (h < 0.68) return 2;
    return 3;
}

// Distance to nearest shoreline threshold
float distToWaterEdge(vec2 p) {
    float h = mapHeightRaw(p);
    return abs(h - 0.40);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    
    // 2.5D Projection Shift setup
    vec2 p = uv;
    vec2 cliffOffset = vec2(0.0, 0.045); // Vertical extrusion vector
    
    // Sample terrain at current position and projected position for 2.5D cliff rendering
    float hTop = mapHeightRaw(p);
    float hExtrude = mapHeightRaw(p + cliffOffset);
    
    int tierTop = getTier(hTop);
    int tierExtrude = getTier(hExtrude);
    
    vec3 color = vec3(0.0);
    
    // ------------------------------------------------------------------
    // 1. WATER CANVAS & CAUSTICS
    // ------------------------------------------------------------------
    vec2 wUv = p * 4.0;
    float wNoise = noise(wUv + vec2(u_time * 0.4, u_time * 0.3)) * 0.5 + 
                 noise(wUv * 2.0 - vec2(u_time * 0.2, u_time * 0.5)) * 0.5;
                 
    color = mix(WATER_BASE, WATER_SHALLOW, clamp(wNoise + 0.3, 0.0, 1.0));
    
    // Wave crest patterns in water
    float wavePattern = sin(p.x * 25.0 + p.y * 15.0 + u_time * 2.0 + wNoise * 4.0);
    if (tierTop == 0 && wavePattern > 0.88) {
        color = mix(color, WATER_SHALLOW + vec3(0.15), 0.6);
    }

    // ------------------------------------------------------------------
    // 2. 2.5D TERRACED ELEVATIONS & CLIFF FACES
    // ------------------------------------------------------------------
    bool isCliff = false;
    vec3 terrainColor = WATER_BASE;
    
    // Render top faces or extruded cliff faces based on height differential
    if (tierTop > 0) {
        // We are on a flat top surface
        if (tierTop == 1) terrainColor = SAND_TOP;
        else if (tierTop == 2) terrainColor = GRASS_TOP;
        else if (tierTop == 3) terrainColor = STONE_TOP;
        
        // Micro vegetation details on grass
        if (tierTop == 2) {
            float detailNoise = noise(p * 45.0);
            if (detailNoise > 0.35) {
                terrainColor = mix(terrainColor, GRASS_CLIFF, 0.25); // Grass blades accent
            }
            // Small bushes
            float bushNoise = noise(p * 80.0);
            if (bushNoise > 0.55 && noise(p * 15.0) > 0.1) {
                terrainColor = mix(GRASS_CLIFF * 0.7, vec3(0.1, 0.4, 0.15), 0.9);
            }
        }
    } else if (tierExtrude > 0) {
        // We are on a vertical 2.5D cliff drop-off
        isCliff = true;
        if (tierExtrude == 1) terrainColor = SAND_CLIFF;
        else if (tierExtrude == 2) terrainColor = GRASS_CLIFF;
        else if (tierExtrude == 3) terrainColor = STONE_CLIFF;
        
        // Add subtle horizontal stride texture to cliffs
        float stripe = sin(p.y * 180.0);
        terrainColor *= (0.9 + 0.1 * stripe);
    }
    
    if (tierTop > 0 || isCliff) {
        color = terrainColor;
    }

    // ------------------------------------------------------------------
    // 3. SHORELINE FOAM OUTLINE
    // ------------------------------------------------------------------
    // Thick white foam contour framing islands/rocks
    float edgeDist = distToWaterEdge(p);
    float foamPulse = sin(u_time * 3.0 + noise(p * 10.0) * 6.28) * 0.005;
    float foamWidth = 0.022 + foamPulse;
    
    if (edgeDist < foamWidth && (tierTop == 0 || tierTop == 1) && !isCliff) {
        color = FOAM;
    }
    
    // Additional foam outline at cliff bases touching water
    if (isCliff && tierTop == 0 && mapHeightRaw(p + vec2(0.0, 0.01)) < 0.40) {
        color = FOAM;
    }

    // ------------------------------------------------------------------
    // 4. NAVIGATION PATH (WHITE DASHED LINES)
    // ------------------------------------------------------------------
    // Stage Waypoints
    vec2 node1 = NODE1;
    vec2 node2 = NODE2;
    vec2 node3 = NODE3;
    vec2 node4 = NODE4;

    // Segment distances
    float dSeg1 = sdSegment(p, node1, node2);
    float dSeg2 = sdSegment(p, node2, node3);
    float dSeg3 = sdSegment(p, node3, node4);
    float dPath = min(min(dSeg1, dSeg2), dSeg3);

    // Calculate parameter along total path for animated dashing
    float pathDist = 0.0;
    if (dPath == dSeg1) {
        pathDist = length(p - node1);
    } else if (dPath == dSeg2) {
        pathDist = length(node2 - node1) + length(p - node2);
    } else {
        pathDist = length(node2 - node1) + length(node3 - node2) + length(p - node3);
    }

    // Dashed pattern rendering (2x size dashes & thickness)
    float dashPeriod = 0.090;
    float dashRatio = 0.5;
    bool isDash = fract((pathDist - u_time * 0.018) / dashPeriod) < dashRatio;

    if (dPath < 0.014 && isDash) {
        color = FOAM;
    }

    // ------------------------------------------------------------------
    // 5. TRAVELING CHARACTER / MOVING HERO PAWN
    // ------------------------------------------------------------------
    float tLoop = mod(u_time * 0.15, 3.0);
    vec2 boatPos = vec2(0.0);
    if (tLoop < 1.0) boatPos = mix(node1, node2, fract(tLoop));
    else if (tLoop < 2.0) boatPos = mix(node2, node3, fract(tLoop));
    else boatPos = mix(node3, node4, fract(tLoop));

    float dBoat = length(p - boatPos);
    
    // Large Prominent Pulsing Outer Rings (Radar / Hero beacon effect)
    float pulse1 = mod(u_time * 1.8, 1.0);
    float rPulse1 = 0.025 + pulse1 * 0.065;
    float alphaPulse1 = (1.0 - pulse1) * 0.75;
    if (abs(dBoat - rPulse1) < 0.007) {
        color = mix(color, BADGE_GOLD, alphaPulse1);
    }

    float pulse2 = mod(u_time * 1.8 + 0.5, 1.0);
    float rPulse2 = 0.025 + pulse2 * 0.065;
    float alphaPulse2 = (1.0 - pulse2) * 0.75;
    if (abs(dBoat - rPulse2) < 0.007) {
        color = mix(color, FOAM, alphaPulse2);
    }

    // Hero Character Drop Shadow
    float dCharShadow = length(p - (boatPos - vec2(0.006, 0.008)));
    if (dCharShadow < 0.038) {
        color = mix(color, vec3(0.05, 0.10, 0.15), 0.55);
    }

    // Hero Character Outer Dark Outline (Thick for visibility anywhere)
    if (dBoat < 0.036) {
        color = vec3(0.1, 0.12, 0.18);
    }
    
    // Hero Character Bright Outer Ring (Vibrant Gold)
    if (dBoat < 0.030) {
        color = BADGE_GOLD;
    }

    // Hero Character Inner Core (Bright White / Red Hero Pawn)
    if (dBoat < 0.022) {
        float bob = sin(u_time * 8.0) * 0.15 + 0.85;
        color = BADGE_RED * bob;
    }

    // Top Emblem / Star Core
    if (dBoat < 0.010) {
        color = FOAM;
    }

    // ------------------------------------------------------------------
    // 6. STAGE NODES & BADGES
    // ------------------------------------------------------------------
    vec2 nodes[4];
    nodes[0] = node1;
    nodes[1] = node2;
    nodes[2] = node3;
    nodes[3] = node4;

    for (int i = 0; i < 4; i++) {
        float dNode = length(p - nodes[i]);
        
        // Badge Drop Shadow (2x size)
        float dShadow = length(p - (nodes[i] - vec2(0.008, 0.012)));
        if (dShadow < 0.064) {
            color = mix(color, vec3(0.05, 0.15, 0.2), 0.5);
        }
        
        // Thick Outer Dark Border (2x size)
        if (dNode < 0.064) {
            color = vec3(0.1, 0.1, 0.15);
        }
        // White Outer Ring (2x size)
        if (dNode < 0.054) {
            color = FOAM;
        }
        // Inner Badge Fill (Gold for completed/active, Red for current) (2x size)
        if (dNode < 0.040) {
            if (i == 2) {
                // Pulsing Active Node
                float pulse = 0.8 + 0.2 * sin(u_time * 6.0);
                color = BADGE_RED * pulse;
            } else if (i < 2) {
                color = BADGE_GOLD;
            } else {
                color = STONE_TOP;
            }
        }
        // Center Icon Dot / Star core (2x size)
        if (dNode < 0.014) {
            color = FOAM;
        }
        
        // Exclamation / Callout Notification Badge on current node (2x size)
        if (i == 2) {
            vec2 calloutPos = nodes[i] + vec2(0.045, 0.060) + vec2(0.0, sin(u_time * 4.0) * 0.008);
            float dCallout = length(p - calloutPos);
            if (dCallout < 0.032) color = vec3(0.1);
            if (dCallout < 0.024) color = BADGE_GOLD;
            // Exclamation mark dot
            if (length(p - (calloutPos - vec2(0.0, 0.008))) < 0.006) color = vec3(0.1);
            if (abs(p.x - calloutPos.x) < 0.004 && p.y > calloutPos.y - 0.002 && p.y < calloutPos.y + 0.012) color = vec3(0.1);
        }
    }

    // Vignette for clean map framing
    vec2 q = gl_FragCoord.xy / u_resolution.xy;
    float vignette = pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.15);
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
}
    `;
    // =========================================================================

    const program = createProgram(gl, vsSource, fsSource);
    if (!program) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPositionLoc = gl.getAttribLocation(program, 'a_position');
    const uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');

    let animId: number;
    const startTime = performance.now();

    const render = (time: number) => {
      if (!isVisibleRef.current) {
        animId = requestAnimationFrame(render);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const w = Math.max(80, Math.floor(rect.width));
      const h = Math.max(50, Math.floor(rect.height));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.useProgram(program);

      gl.enableVertexAttribArray(aPositionLoc);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
      gl.uniform1f(uTimeLoc, (time - startTime) * 0.001);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className={`w-full h-full block object-cover ${className}`} />;
}

export type LiveShaderType = 'cartridge' | 'levelup' | 'factory' | 'teamslead';

function LiveAchievementShader({ type, className, isVisible = true }: { type: LiveShaderType; className?: string; isVisible?: boolean }) {
  if (type === 'cartridge') return <CartridgeShaderCanvas className={className} isVisible={isVisible} />;
  if (type === 'levelup') return <LevelUpShaderCanvas className={className} isVisible={isVisible} />;
  if (type === 'factory') return <FactoryShaderCanvas className={className} isVisible={isVisible} />;
  return <TeamsLeadShaderCanvas className={className} isVisible={isVisible} />;
}

export default LiveAchievementShader;
