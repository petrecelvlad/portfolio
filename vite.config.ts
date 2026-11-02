import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {responsiveImages} from './tools/vite-plugins/responsiveImages';
import {staticDocument} from './tools/vite-plugins/staticDocument';
import {cvPdf} from './tools/vite-plugins/cvPdf';

export default defineConfig({
  base: '/portfolio/',
  plugins: [react(), tailwindcss(), responsiveImages(), staticDocument(), cvPdf()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
