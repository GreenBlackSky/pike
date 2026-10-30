import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

/* `npm run dev` serves the app with instant reload; `npm run build` writes
   dist/, the folder that gets uploaded to hosting. The PWA plugin adds what
   Android needs to install it from the browser: a manifest and a service
   worker that keeps the app working offline. */
export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Pike',
        short_name: 'Pike',
        description: 'Batch-cooking recipes, pantry, shopping list and a random pick.',
        theme_color: '#0B1622',
        background_color: '#0B1622',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  server: { port: 5182, strictPort: true },
});
