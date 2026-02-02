import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // disable: process.env.NODE_ENV === "development", // Removed - always enable PWA
  register: true,
  cacheOnFrontEndNav: true, // Cache pages during client-side navigation
  aggressiveFrontEndNavCaching: true, // Pre-cache pages aggressively
  reloadOnOnline: true, // Reload page when coming back online
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      // Cache HTML pages (navigation requests)
      {
        urlPattern: ({ request, url }) => {
          const isSameOrigin = self.location.origin === url.origin;
          const isNavigationRequest = request.mode === 'navigate';
          return isSameOrigin && isNavigationRequest;
        },
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 3,
        },
      },
      // Cache page data (Next.js data requests)
      {
        urlPattern: /\/_next\/data\/.+\.json$/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "next-data-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60,
          },
          networkTimeoutSeconds: 3,
        },
      },
      // Cache static assets (JS, CSS)
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      // Cache API routes
      {
        urlPattern: /\/api\/.*\//i,
        handler: "NetworkFirst",
        method: "GET",
        options: {
          cacheName: "api-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60, // 1 hour
          },
          networkTimeoutSeconds: 3,
        },
      },
      // Cache images
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "image-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {}, // Enable Turbopack and silence compatibility warning
};

export default withPWA(nextConfig);
