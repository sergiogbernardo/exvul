import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the project under /exvul/. Keep the base in sync with the
// repository name so asset URLs resolve correctly in production.
export default defineConfig({
  base: '/exvul/',
  plugins: [react()],
});
