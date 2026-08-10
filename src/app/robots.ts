// robots.txt — servi par Next, plus par un fichier statique.
//
// POURQUOI CE CHANGEMENT. Le `robots.txt` était fabriqué par `next-sitemap` en
// `postbuild`, qui l'écrit dans `public/`. Deux défauts, et le second est
// silencieux :
//
//   1. Le domaine y était figé AU MOMENT DE LA COMPILATION. `NEXT_PUBLIC_*` est
//      remplacé dans le bundle au build : un déploiement construit avant que
//      `NEXT_PUBLIC_SITE_URL` ne soit posée sur Vercel annonçait encore
//      popey.academy — c'est-à-dire qu'il désignait à Google le domaine qu'on
//      venait justement d'abandonner.
//   2. Un fichier de `public/` a la PRIORITÉ sur une route d'application. Tant
//      que `postbuild` en écrivait un, aucune correction faite ici n'aurait pris
//      effet, sans le moindre message d'erreur.
//
// Ici, le domaine est lu à l'exécution : il suit la variable d'environnement
// sans qu'il faille reconstruire, et il ne peut plus diverger du site servi.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Ce qui n'a rien à faire dans un index de recherche : l'administration,
        // l'authentification, les espaces privés atteints par lien magique, et
        // les API. Ces pages portent déjà `noindex`, mais l'interdire ici évite
        // en plus de dépenser le budget d'exploration à les visiter.
        disallow: [
          "/admin",
          "/api/",
          "/auth/",
          "/popey-human/",
          "/p/",
          "/pro",
          "/saisie/",
          "/avis/",
          "/site-internet/pro/",
          "/site-internet/apercu/",
          "/direct-ville/",
          "/ville/confirmer/",
          "/ville/stop/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
