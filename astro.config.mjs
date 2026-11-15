import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  devToolbar: {
    enabled: false,
  },
  vite: {
    server: {
      watch: {
        ignored: [
          '**/.chrome-*/**',
          '**/.edge-qa/**',
          '**/.opencode/**',
          '**/.qodo/**',
          '**/.agents/**',
          '**/artifacts/**',
          '**/character-playground/**',
          '**/dist/**',
          '**/node_modules/**',
          '**/.astro/**'
        ]
      }
    }
  }
});
