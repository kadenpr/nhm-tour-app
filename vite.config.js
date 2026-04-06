import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icon.svg", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "NHM Tour Planner",
        short_name: "NHM Tour",
        description: "AI-powered personalised routes for the Natural History Museum London",
        theme_color: "#C67A1E",
        background_color: "#fafaf7",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Cache the app shell and static assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        // Don't cache API calls — those need to be live
        navigateFallback: "/",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/en\.wikipedia\.org\//,
            handler: "CacheFirst",
            options: {
              cacheName: "wikipedia-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
});
