import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const config: NextConfig = {
  /* config options here */
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.simpleicons.org",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
  // turbopack: { // Turbopack does not support webpack plugins yet (like next-pwa)
  //   root: __dirname,
  // },
};

export default withPWA({
  dest: "public",
  register: true,
  // skipWaiting is now part of workboxOptions in newer versions or handled automatically
  disable: false, 
  // Custom workbox options
  workboxOptions: {
    skipWaiting: true, // Moved here
    disableDevLogs: true,
    importScripts: ["/sw-push.js"], // Moved here as well for better compatibility
  },
})(config);
