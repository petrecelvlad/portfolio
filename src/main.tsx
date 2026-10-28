import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {HelmetProvider} from 'react-helmet-async';
import {MotionConfig} from 'motion/react';
import App from './App.tsx';
import { VideoPrefsProvider } from './context/VideoPrefsContext.tsx';
import { AnimationPathProvider } from './context/AnimationPathContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      {/* Motion ignores the system's reduce-motion setting by default; "user" skips its x/y/scale moves when it's on. */}
      <MotionConfig reducedMotion="user">
        <VideoPrefsProvider>
          <AnimationPathProvider>
            <App />
          </AnimationPathProvider>
        </VideoPrefsProvider>
      </MotionConfig>
    </HelmetProvider>
  </StrictMode>,
);
