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
    // Les DEUX lettres du parcours commerçant lisent leurs gabarits par un
    // chemin construit à l'exécution (type de diagnostic, recto/verso) : le
    // traçage de Next ne peut pas les deviner, et sans cette ligne le fichier
    // manque en production alors qu'il est là en local.
    "/admin/humain/site-internet/lettre/[slug]": ["./src/templates/**"],
    "/admin/humain/site-internet/lettres/[ville]": ["./src/templates/**"],
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
        // TOUT LE SITE RESTE INCADRABLE, sauf la démonstration ci-dessous.
        // L'exception est écrite comme une exclusion de ce motif, et pas comme
        // une deuxième règle : Next AJOUTE les en-têtes de chaque règle qui
        // correspond, donc deux règles sur le même chemin poseraient DEUX
        // `X-Frame-Options`, et un navigateur qui en voit deux refuse le cadre.
        // L'exception ne servirait alors à rien, en silence.
        source: "/((?!autour-de-moi).*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
      {
        // ─── LA DÉMONSTRATION PEUT ÊTRE ENCADRÉE, ET ELLE SEULE ───
        //
        // POURQUOI ON DESSERRE ICI. Le deck investisseur doit montrer
        // l'application EN VRAI, manipulable pendant la présentation, et pas
        // une capture. Sans cette exception, le cadre reste blanc : c'est notre
        // propre en-tête qui le refuse, pas celui de l'hébergeur.
        //
        // POURQUOI ÇA NE COÛTE RIEN. `frame-ancestors 'self'` protège du
        // clickjacking — faire cliquer quelqu'un sur un bouton qu'il ne voit
        // pas. Cette page-ci n'a ni compte, ni paiement, ni action destructrice :
        // tout ce qu'un attaquant obtiendrait, c'est de faire balayer une carte.
        // Le tableau de bord, l'authentification et l'espace commerçant restent
        // couverts par la règle du dessus.
        //
        // X-FRAME-OPTIONS EST ABSENT ET C'EST VOULU : il ne sait pas dire « ces
        // origines-là » (`ALLOW-FROM` est mort et ignoré partout). Le laisser à
        // SAMEORIGIN annulerait `frame-ancestors` sur les navigateurs qui
        // lisent les deux. C'est la CSP qui décide, seule.
        //
        // CE QUI A ÉTÉ MESURÉ, ET QUI CORRIGE UNE ERREUR DE DIAGNOSTIC.
        // Les deux refus possibles n'affichent pas le même écran, et on les a
        // reproduits l'un et l'autre dans un navigateur :
        //   · la CIBLE refuse (X-Frame-Options, frame-ancestors) →
        //     « <hôte> refused to connect. »
        //   · la PAGE QUI AFFICHE refuse (sa propre CSP `frame-src`) →
        //     « Ce contenu est bloqué. Contactez le propriétaire du site. »
        // C'est la seconde phrase que montrait la présentation : le refus ne
        // venait pas d'ici. Aucun en-tête posé sur ce site n'aurait pu la
        // faire disparaître.
        //
        // CE QUI RESTE VRAI MALGRÉ TOUT. Le deck doit pouvoir encadrer cette
        // page depuis le site lui-même (`'self'`, le cas qui marche), et
        // depuis n'importe quelle page servie en HTTPS le jour où il est
        // hébergé ailleurs. `https:` évite d'avoir à deviner cette origine à
        // chaque présentation ; il interdit toujours l'encadrement depuis une
        // page en clair.
        source: "/autour-de-moi",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self' https:" },
        ],
      },
    ];
  },
  async redirects() {
    // Anciens produits (réseau local, cohortes, dashboard/audit, club, privilège…) :
    // on redirige tout vers l'accueil pour aligner le domaine sur le concept actuel
    // (site + assistante pour commerçants).
    //
    // 301 ET NON PLUS 307, ET C'EST UN CORRECTIF DE RÉFÉRENCEMENT. La
    // redirection était temporaire « pour rester réversible ». Traduction pour
    // Google : « repasse plus tard, cette page va revenir ». Il gardait donc ces
    // adresses en attente indéfiniment, et Search Console les comptait
    // indéfiniment sous « Page avec redirection » — sept sur un domaine, quatre
    // sur l'autre. Un 301 lui dit que c'est fini : il les retire, et transfère
    // l'ancienneté au nouvel emplacement au lieu de la laisser dormir.
    //
    // CE QUE ÇA COÛTE, ET C'EST ASSUMÉ : un navigateur met un 301 en cache très
    // durablement. Ressusciter une de ces adresses demanderait de vider le cache
    // de chaque visiteur qui l'a connue — autant dire que c'est définitif. Ces
    // produits ne reviennent pas.
    const toHome = (source: string) => ({ source, destination: "/", permanent: true });
    const OLD = [
      "dashboard", "mon-reseau-local", "privilege", "cohorts-demo",
      "programme-commando", "quiz-statut-business", "marketplace", "entrepreneur",
      "alliance", "cm-dashboard", "radar-elite-preview", "side-project", "personnel",
    ];

    // `/popey-human` NE PEUT PAS être enterré en bloc : c'est là que vivent les
    // deux SEULES pages de connexion du site, dont celle de l'administration.
    // Tant qu'il était dans la liste ci-dessus, `/popey-human/admin-login`
    // partait en 307 vers l'accueil — plus aucun formulaire de connexion n'était
    // atteignable, et le bouton « Se déconnecter » de l'admin (qui renvoie vers
    // `/popey-human/login`) achevait d'enfermer dehors.
    const GARDE_HUMAN = ["login", "admin-login", "app"];
    const gardeHuman = GARDE_HUMAN.map((r) => `${r}$|${r}/`).join("|");
    const ancienHuman = [
      toHome("/popey-human"),
      // les sous-pages de l'ancien produit, SAUF authentification et espace membre
      toHome(`/popey-human/:path((?!${gardeHuman}).*)`),
    ];
    // L'ANCIEN DOMAINE REDIRIGE VERS LE NOUVEAU, en 301 (permanent).
    //
    // Tant que popey.academy sert les mêmes pages que clikme.fr, Google voit
    // deux sites identiques et n'en indexe qu'un — c'est l'ancien qui gagne,
    // parce qu'il a l'ancienneté. Une redirection permanente transfère cette
    // ancienneté au lieu de la mettre en concurrence.
    //
    // Le CHEMIN est conservé : un QR code déjà imprimé sur une lettre, un lien
    // dans un e-mail envoyé le mois dernier, un favori d'espace pro — tous
    // continuent d'arriver au bon endroit, sur le nouveau domaine.
    //
    // 301 et non 307 : c'est le seul code que Google traite comme un
    // déménagement définitif. En 307, il garderait les deux domaines en
    // concurrence indéfiniment.
    // CE QUI N'EST PAS REDIRIGÉ : l'administration, l'authentification et les
    // routes d'API.
    //
    // Les cookies de session sont cloisonnés par domaine (`.popey.academy` et
    // `.clikme.fr` sont deux mondes séparés). Rediriger une page authentifiée
    // fait donc arriver la personne SANS sa session, sur un écran qui lui dit
    // qu'elle n'a pas les droits — ce qui s'est produit.
    //
    // Ces routes n'ont par ailleurs aucune valeur de référencement : une
    // redirection permanente n'y gagne rien et coûte l'accès. Et un 301 sur une
    // route d'API transforme un POST en GET chez certains clients.
    const PRIVE = ["admin", "auth", "api", "popey-human", "p"];
    const exclusion = PRIVE.map((r) => `${r}$|${r}/`).join("|");

    // Le motif couvre aussi la racine (`path` y vaut la chaîne vide) : pas de
    // règle séparée, vérifié au motif compilé.
    const ancienDomaine = ["www.popey.academy", "popey.academy"].map((host) => ({
      source: `/:path((?!${exclusion}).*)`,
      has: [{ type: "host" as const, value: host }],
      destination: `https://www.clikme.fr/:path`,
      permanent: true,
    }));

    return [
      // L'ancien domaine EN PREMIER : la redirection doit s'appliquer avant
      // toute autre règle, sinon une ancienne page redirigerait vers l'accueil
      // de l'ancien domaine au lieu de partir sur le nouveau.
      ...ancienDomaine,
      // chaque ancien produit : la racine ET ses sous-pages
      ...OLD.flatMap((s) => [toHome(`/${s}`), toHome(`/${s}/:path*`)]),
      ...ancienHuman,
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
