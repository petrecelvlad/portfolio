/**
 * @propolis
 * {
 *   "role": "UI_COMPONENT",
 *   "constraints": [
 *     "C-008: video and WebGL, so drawing each frame is the exception the rule allows",
 *     "C-009: always on; measured on the reference PC 2026-10-18 (+42% to +7% CPU vs the VP9 WebM)",
 *     "C-010: the caller passes isVisible=false under reduced motion; the first frame is still drawn",
 *     "C-011: draws only when the video presents a frame, so a paused video costs nothing",
 *     "C-012: drawn at its displayed size, never above the source"
 *   ],
 *   "agent_instructions": "Plays transparent video the GPU can decode (stacked-alpha H.264). The WebM fallback is CPU-decoded on many GPUs, so it's only for browsers without WebGL or requestVideoFrameCallback."
 * }
 */
import { useEffect, useRef, useState } from 'react';

interface StackedAlphaVideoProps {
  /** H.264 video twice as wide as tall: the color frame on the left half, its alpha mask as grayscale on the right. */
  src: string;
  /** A video with its own alpha channel (e.g. VP9 WebM), shown when WebGL can't be used. */
  fallbackSrc: string;
  isVisible: boolean;
  className?: string;
}

const VERTEX_SHADER = `
  attribute vec2 position;
  varying vec2 uv;
  void main() {
    uv = vec2((position.x + 1.0) * 0.5, (1.0 - position.y) * 0.5);
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 uv;
  uniform sampler2D frame;
  void main() {
    vec3 color = texture2D(frame, vec2(uv.x * 0.5, uv.y)).rgb;
    float alpha = texture2D(frame, vec2(0.5 + uv.x * 0.5, uv.y)).r;
    gl_FragColor = vec4(color * alpha, alpha);
  }
`;

// Transparent video that the GPU can decode: browsers only hardware-decode H.264, which has no
// alpha channel, while alpha-capable VP9 is CPU-decoded on many GPUs (an Intel HD 4600 among
// them). So the alpha ships as a second picture beside the color one, and a one-quad shader
// recombines them.
export function StackedAlphaVideo({ src, fallbackSrc, isVisible, className = '' }: StackedAlphaVideoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useFallback, setUseFallback] = useState(() => !('requestVideoFrameCallback' in HTMLVideoElement.prototype));

  useEffect(() => {
    if (useFallback) return;
    const canvas = canvasRef.current!;
    const video = videoRef.current!;
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false });
    if (!gl) {
      setUseFallback(true);
      return;
    }

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(program);
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Drawn at the size it's shown, never above the source: the GPU would otherwise color every
    // source pixel each frame only for the browser to throw most of them away when scaling down.
    let displayWidth = 0;
    let displayHeight = 0;
    const sizeObserver = new ResizeObserver(([entry]) => {
      displayWidth = entry.contentRect.width * window.devicePixelRatio;
      displayHeight = entry.contentRect.height * window.devicePixelRatio;
    });
    sizeObserver.observe(canvas);

    const drawFrame = () => {
      const sourceWidth = video.videoWidth / 2;
      const sourceHeight = video.videoHeight;
      const scale = displayWidth > 0 && displayHeight > 0
        ? Math.min(1, displayWidth / sourceWidth, displayHeight / sourceHeight)
        : 1;
      const width = Math.round(sourceWidth * scale);
      const height = Math.round(sourceHeight * scale);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    // Draws once per decoded video frame, so a paused video costs nothing.
    let frameRequest = 0;
    const handleVideoFrame = () => {
      drawFrame();
      frameRequest = video.requestVideoFrameCallback(handleVideoFrame);
    };
    frameRequest = video.requestVideoFrameCallback(handleVideoFrame);
    // A video kept paused (reduced motion) presents no frames, so its first frame is drawn on load.
    video.addEventListener('loadeddata', drawFrame);

    // Weak GPUs can drop the context under memory pressure or a driver reset; without this the
    // character would vanish until reload.
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setUseFallback(true);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);

    return () => {
      video.cancelVideoFrameCallback(frameRequest);
      video.removeEventListener('loadeddata', drawFrame);
      sizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
    };
  }, [useFallback]);

  // play() rather than the autoplay attribute: Chrome pauses attribute-autoplayed muted videos it
  // considers not visible, and the stacked source is never displayed itself.
  useEffect(() => {
    const video = videoRef.current!;
    if (isVisible) {
      video.defaultMuted = true;
      video.muted = true;
      // AbortError just means the element was swapped out (fallback) or paused before playback began.
      video.play().catch((err) => {
        if (err.name !== 'AbortError') console.warn('Video autoplay prevented:', err);
      });
    } else {
      video.pause();
    }
  }, [isVisible, useFallback]);

  if (useFallback) {
    return (
      <video ref={videoRef} key="fallback" src={fallbackSrc} loop muted playsInline preload="metadata" className={className} />
    );
  }

  return (
    <>
      <video ref={videoRef} key="stacked" src={src} loop muted playsInline preload="auto" hidden />
      <canvas ref={canvasRef} width={1} height={1} className={className} />
    </>
  );
}
