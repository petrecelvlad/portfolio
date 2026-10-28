import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {responsiveImages} from './tools/vite-plugins/responsiveImages';

export default defineConfig({
  base: '/portfolio/',
  plugins: [react(), tailwindcss(), responsiveImages()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
