import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useAnimationPath } from '@/src/context/AnimationPathContext';
import { AchievementFactorySvg, AchievementLevelUpSvg, AchievementTeamsLeadSvg, AchievementCartridgeSvg } from './AchievementSvgPlaceholders';
import type { LiveShaderType } from './AchievementLiveShaders';

const LiveAchievementShader = lazy(() => import('./AchievementLiveShaders'));

export type ShaderType = 'grid' | 'plasma' | 'matrix' | 'polyhedron' | 'animate' | 'cartridge' | 'levelup' | 'factory' | 'teamslead';

interface AchievementShaderCanvasProps {
  type: ShaderType;
  className?: string;
  isVisible?: boolean;
}

function AnimateKineticAnimation() {
  const [prefixText, setPrefixText] = useState('Any');
  const [isEveryMode, setIsEveryMode] = useState(false);

  useEffect(() => {
    let lastTime = performance.now();
    let wordIndex = 0; // 0: "Any", 1: "Every"
    const words = ["Any", "Every"];
    let charIndex = 3;
    let isDeleting = false;
    let isWaiting = true;
    let waitTimer = 0;
    let timer = 0;
    let animId: number;

    const loop = (timestamp: number) => {
      const delta = timestamp - lastTime;
      lastTime = timestamp;

      const currentWord = words[wordIndex];
      const targetSpeed = isDeleting ? 50 : 100;

      if (isWaiting) {
        waitTimer += delta;
        if (waitTimer > 1500) {
          isWaiting = false;
          isDeleting = true;
          waitTimer = 0;
        }
      } else {
        timer += delta;
        if (timer > targetSpeed) {
          timer = 0;
          if (isDeleting) {
            charIndex--;
            if (charIndex === 0) {
              isDeleting = false;
              wordIndex = (wordIndex + 1) % 2;
              setIsEveryMode(wordIndex === 1);
            }
          } else {
            charIndex++;
            if (charIndex === currentWord.length) {
              isWaiting = true;
            }
          }
          setPrefixText(currentWord.substring(0, charIndex));
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="w-full h-full bg-[#020617] text-[#f8fafc] flex flex-col justify-center items-center p-2 select-none overflow-hidden font-sans">
      <div className="flex flex-col items-start leading-[0.85] font-black tracking-tighter text-[1rem] sm:text-[1.15rem] md:text-[1.25rem] lg:text-[1.35rem] whitespace-nowrap">
        <div>Animate</div>
        <div>
          <span
            className="transition-colors duration-400 ease-in-out"
            style={{ color: isEveryMode ? '#3b82f6' : '#f59e0b' }}
          >
            {prefixText}
          </span>
          thing
        </div>
      </div>
    </div>
  );
}


// Baked replacements for the 4 shaders above (T-019) — see the regeneration comment before
// CartridgeShaderCanvas. Manifests come straight from each shader's spritesheet.json.

interface SpriteManifest {
  src: string;
  cols: number;
  rows: number;
  frameCount: number;
  fps: number;
}

const SPRITE_MANIFESTS: Record<'levelup' | 'factory' | 'teamslead', SpriteManifest> = {
  levelup: { src: `${import.meta.env.BASE_URL}achievements/levelup.png`, cols: 9, rows: 9, frameCount: 78, fps: 12 },
  factory: { src: `${import.meta.env.BASE_URL}achievements/factory.png`, cols: 15, rows: 14, frameCount: 200, fps: 6 },
  teamslead: { src: `${import.meta.env.BASE_URL}achievements/teamslead.png`, cols: 16, rows: 15, frameCount: 240, fps: 12 },
};

function SpriteLoopCanvas({ manifest, className, isVisible = true }: { manifest: SpriteManifest; className?: string; isVisible?: boolean }) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const durationMs = (manifest.frameCount / manifest.fps) * 1000;
    const startTime = performance.now();
    let animId: number;

    const render = (time: number) => {
      if (!isVisibleRef.current) {
        animId = requestAnimationFrame(render);
        return;
      }

      const cellW = el.clientWidth;
      const cellH = el.clientHeight;
      if (cellW === 0 || cellH === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      const elapsed = (time - startTime) % durationMs;
      const frame = Math.min(manifest.frameCount - 1, Math.floor((elapsed / durationMs) * manifest.frameCount));
      const col = frame % manifest.cols;
      const row = Math.floor(frame / manifest.cols);

      el.style.backgroundSize = `${manifest.cols * cellW}px ${manifest.rows * cellH}px`;
      el.style.backgroundPosition = `${-col * cellW}px ${-row * cellH}px`;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [manifest]);

  return (
    <div
      ref={elRef}
      className={`w-full h-full block object-cover ${className ?? ''}`}
      style={{ backgroundImage: `url(${manifest.src})`, backgroundRepeat: 'no-repeat' }}
    />
  );
}

function CartridgeVideoCanvas({ className, isVisible = true }: { className?: string; isVisible?: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isVisible) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isVisible]);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      className={`w-full h-full block object-cover ${className ?? ''}`}
    >
      <source src={`${import.meta.env.BASE_URL}achievements/cartridge.webm`} type="video/webm" />
      <source src={`${import.meta.env.BASE_URL}achievements/cartridge.mp4`} type="video/mp4" />
    </video>
  );
}

export function AchievementShaderCanvas({ type, className = '', isVisible = true }: AchievementShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { animationPath } = useAnimationPath();

  useEffect(() => {
    if (type === 'animate' || type === 'cartridge' || type === 'levelup' || type === 'factory' || type === 'teamslead') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let startTime = performance.now();

    // Resize handler with pixel density scaling
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(80, Math.floor(rect.width));
      const h = Math.max(50, Math.floor(rect.height));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    updateSize();

    const render = (time: number) => {
      updateSize();
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      const t = (time - startTime) * 0.001;

      ctx.clearRect(0, 0, w, h);

      if (type === 'grid') {
        // --- SHADER 1: Retro Grid Tunnel ---
        ctx.fillStyle = '#0f0a1c';
        ctx.fillRect(0, 0, w, h);

        const horizon = h * 0.45;

        // Horizon Sun
        const grad = ctx.createRadialGradient(w / 2, horizon, 2, w / 2, horizon, w * 0.35);
        grad.addColorStop(0, '#ff9e00');
        grad.addColorStop(0.5, '#ff0055');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(w / 2, horizon, w * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1;

        // Perspective lines
        const numPerspective = 12;
        ctx.beginPath();
        for (let i = 0; i <= numPerspective; i++) {
          const xTop = (w / numPerspective) * i;
          ctx.moveTo(xTop, horizon);
          const xBot = w / 2 + (xTop - w / 2) * 2.8;
          ctx.lineTo(xBot, h);
        }
        ctx.stroke();

        // Horizontal scrolling grid lines
        ctx.strokeStyle = '#ff00aa';
        const numH = 8;
        const speed = (t * 30) % 20;
        ctx.beginPath();
        for (let i = 0; i < numH; i++) {
          const yProgress = (i * 12 + speed) / 100;
          const y = horizon + Math.pow(yProgress, 1.8) * (h - horizon);
          if (y > horizon && y < h) {
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
          }
        }
        ctx.stroke();

      } else if (type === 'plasma') {
        // --- SHADER 2: Arcade Fire / Plasma Fluid ---
        ctx.fillStyle = '#140303';
        ctx.fillRect(0, 0, w, h);

        const cols = 16;
        const rows = 10;
        const cellW = w / cols;
        const cellH = h / rows;

        for (let x = 0; x < cols; x++) {
          for (let y = 0; y < rows; y++) {
            const v1 = Math.sin(x * 0.4 + t * 2.5);
            const v2 = Math.sin(y * 0.5 + t * 1.8);
            const v3 = Math.sin((x + y) * 0.3 + t * 3.0);
            const val = (v1 + v2 + v3 + 3) / 6;

            const r = Math.floor(255 * val);
            const g = Math.floor(120 * (1 - val) + 60 * Math.sin(t));
            const b = Math.floor(200 * Math.cos(val * Math.PI));

            ctx.fillStyle = `rgb(${r},${Math.max(0, g)},${Math.max(0, b)})`;
            ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
          }
        }

        // Overlay glowing particle dots
        ctx.fillStyle = '#ffea00';
        for (let i = 0; i < 6; i++) {
          const px = (Math.sin(i * 1.7 + t * 2) * 0.4 + 0.5) * w;
          const py = (Math.cos(i * 2.3 + t * 1.5) * 0.4 + 0.5) * h;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (type === 'matrix') {
        // --- SHADER 3: 8-Bit Matrix / Level Cascade ---
        ctx.fillStyle = '#051a0e';
        ctx.fillRect(0, 0, w, h);

        const numCols = 14;
        const colW = w / numCols;

        for (let i = 0; i < numCols; i++) {
          const speed = 1.5 + (i % 5) * 0.8;
          const offset = (t * speed * 25 + i * 17) % (h + 30);
          const yHead = offset - 15;

          for (let j = 0; j < 6; j++) {
            const py = yHead - j * 8;
            if (py > 0 && py < h) {
              const alpha = 1 - j / 6;
              ctx.fillStyle = j === 0 ? '#ffffff' : `rgba(34, 211, 238, ${alpha})`;
              ctx.fillRect(i * colW + 1, py, colW - 2, 6);
            }
          }
        }

        // Horizontal Scanlines
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        for (let y = 0; y < h; y += 3) {
          ctx.fillRect(0, y, w, 1);
        }

      } else if (type === 'polyhedron') {
        // --- SHADER 4: Celestial 3D Wireframe Polyhedron ---
        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(0, 0, w, h);

        // Starfield background
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 15; i++) {
          const sx = (Math.sin(i * 88.3 + t * 0.2) * 0.5 + 0.5) * w;
          const sy = (Math.cos(i * 44.1 + t * 0.3) * 0.5 + 0.5) * h;
          const size = (i % 3) === 0 ? 1.5 : 1;
          ctx.fillRect(sx, sy, size, size);
        }

        // Rotating 3D Polyhedron / Gem
        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(w, h) * 0.28;

        const rx = t * 1.2;
        const ry = t * 1.8;

        // Octahedron 6 vertices
        const rawVerts = [
          [0, -1, 0],
          [1, 0, 0],
          [0, 0, 1],
          [-1, 0, 0],
          [0, 0, -1],
          [0, 1, 0],
        ];

        // Rotate & project vertices
        const projVerts = rawVerts.map(([vx, vy, vz]) => {
          // Y rotation
          let x1 = vx * Math.cos(ry) + vz * Math.sin(ry);
          let z1 = -vx * Math.sin(ry) + vz * Math.cos(ry);
          let y1 = vy;

          // X rotation
          let y2 = y1 * Math.cos(rx) - z1 * Math.sin(rx);
          let z2 = y1 * Math.sin(rx) + z1 * Math.cos(rx);
          let x2 = x1;

          const scale = 1 / (1 + z2 * 0.3);
          return [cx + x2 * radius * scale, cy + y2 * radius * scale];
        });

        const edges = [
          [0, 1], [0, 2], [0, 3], [0, 4],
          [5, 1], [5, 2], [5, 3], [5, 4],
          [1, 2], [2, 3], [3, 4], [4, 1]
        ];

        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        edges.forEach(([i1, i2]) => {
          ctx.moveTo(projVerts[i1][0], projVerts[i1][1]);
          ctx.lineTo(projVerts[i2][0], projVerts[i2][1]);
        });
        ctx.stroke();

        // Vertex glow points
        ctx.fillStyle = '#38bdf8';
        projVerts.forEach(([px, py]) => {
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [type]);

  if (type === 'animate') {
    return <AnimateKineticAnimation />;
  }

  if (type === 'cartridge' || type === 'levelup' || type === 'factory' || type === 'teamslead') {
    const liveType: LiveShaderType = type;

    if (animationPath === 'svg') {
      if (type === 'factory') {
        return <AchievementFactorySvg className={className} isVisible={isVisible} />;
      }
      if (type === 'levelup') {
        return <AchievementLevelUpSvg className={className} isVisible={isVisible} />;
      }
      if (type === 'teamslead') {
        return <AchievementTeamsLeadSvg className={className} isVisible={isVisible} />;
      }
      return <AchievementCartridgeSvg className={className} isVisible={isVisible} />;
    }

    if (animationPath === 'shader') {
      return (
        <Suspense fallback={null}>
          <LiveAchievementShader type={liveType} className={className} isVisible={isVisible} />
        </Suspense>
      );
    }

    // 'baked' (default) - pre-recorded video/sprite assets in public/achievements/
    if (type === 'cartridge') {
      return <CartridgeVideoCanvas className={className} isVisible={isVisible} />;
    }
    return <SpriteLoopCanvas manifest={SPRITE_MANIFESTS[type]} className={className} isVisible={isVisible} />;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block object-cover ${className}`}
    />
  );
}
