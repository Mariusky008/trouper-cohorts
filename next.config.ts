import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const config: NextConfig = {
  /* config options here */
  output: "standalone",
  // Force l'inclusion des templates HTML de la lettre dans le bundle serverless :
  // ils sont lus via readFileSync avec un chemin dynamique (couleur/N&B), que le
  // file-tracing de Next ne détecte pas automatiquement.
  outputFileTracingIncludes: {
    "/admin/rejoindre/lettre/[slug]": ["./src/templates/**"],
  },
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
  async headers() {
    // En-têtes de sécurité de base. On se limite volontairement à `frame-ancestors`
    // côté CSP (anti-clickjacking) pour ne PAS casser les scripts/handlers inline
    // du catalogue. Le catalogue est servi same-origin → SAMEORIGIN n'empêche pas
    // l'iframe interne. Élargir la CSP (script-src…) plus tard, après tests.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/emploi',
        destination: '/',
        permanent: false,
      },
      {
        source: '/mon-reseau-local/connexion',
        destination: '/',
        permanent: false,
      },
      {
        source: '/connexion',
        destination: '/',
        permanent: false,
      },
      {
        source: '/login',
        destination: '/',
        permanent: false,
      },
      {
        source: '/popey-business-test',
        destination: '/popey-human',
        permanent: true,
      },
      {
        source: '/popey-business-v3',
        destination: '/popey-human',
        permanent: true,
      },
      {
        source: '/popey-human-test',
        destination: '/popey-human',
        permanent: true,
      },
      {
        source: '/popey-human-test-v2',
        destination: '/popey-human',
        permanent: true,
      },
      {
        source: '/popey-human-test-v3',
        destination: '/popey-human',
        permanent: true,
      },
      {
        source: '/popey-human-test-v6',
        destination: '/popey-human',
        permanent: true,
      },
      {
        source: '/popey-human-test-v4',
        destination: '/popey-human',
        permanent: true,
      }
    ]
  },
};

// export default config;

export default withPWA({
  dest: "public",
  register: false,
  // skipWaiting is now part of workboxOptions in newer versions or handled automatically
  disable: true,
  // Custom workbox options
  workboxOptions: {
    skipWaiting: true, // Moved here
    disableDevLogs: true,
    importScripts: ["/sw-push.js"], // Moved here as well for better compatibility
  },
})(config);
