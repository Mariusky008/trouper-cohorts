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
    // Anciens produits (réseau local, cohortes, dashboard/audit, club, privilège…) :
    // on redirige tout vers l'accueil pour aligner le domaine sur le concept actuel
    // (site + assistante pour commerçants). Temporaire (307) → réversible.
    const toHome = (source: string) => ({ source, destination: "/", permanent: false });
    const OLD = [
      "dashboard", "mon-reseau-local", "popey-human", "privilege", "cohorts-demo",
      "programme-commando", "quiz-statut-business", "marketplace", "entrepreneur",
      "alliance", "cm-dashboard", "radar-elite-preview", "side-project", "personnel",
    ];
    return [
      // chaque ancien produit : la racine ET ses sous-pages
      ...OLD.flatMap((s) => [toHome(`/${s}`), toHome(`/${s}/:path*`)]),
      // L'app cliente v3 (/m/<ville>) est retirée. Une icône restée sur un écran
      // d'accueil doit atterrir sur le catalogue actuel, pas sur une erreur.
      { source: "/m/:ville", destination: "/ville/:ville", permanent: false },
      toHome("/inscription/spheres"),
      toHome("/popey-human-test"),
      toHome("/popey-human-test-v2"),
      toHome("/popey-human-test-v3"),
      toHome("/popey-human-test-v4"),
      toHome("/popey-human-test-v6"),
      toHome("/popey-business-test"),
      toHome("/popey-business-v3"),
      // anciens alias déjà en place
      toHome("/emploi"),
      toHome("/connexion"),
      toHome("/login"),
    ];
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
