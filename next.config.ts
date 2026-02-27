import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const config: NextConfig = {
  /* config options here */
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
  skipWaiting: true,
  disable: false, // Always enable for now to fix SW generation
  importScripts: ["/sw-push.js"],
  // Custom workbox options
  workboxOptions: {
    disableDevLogs: true,
  },
})(config);
