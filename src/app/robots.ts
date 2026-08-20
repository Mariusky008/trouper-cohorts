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
//
// ══════════════════════════════════════════════════════════════════════════
// INTERDIRE ET METTRE `noindex` SUR LA MÊME PAGE NE FAIT PAS DEUX FOIS MIEUX :
// ÇA FAIT MOINS BIEN. C'est le défaut que corrige cette version.
//
// La liste précédente interdisait `/site-internet/apercu/`, `/direct-ville/`,
// `/avis/`, `/saisie/`, `/ville/confirmer/` et `/ville/stop/` — c'est-à-dire
// exactement les pages qui portent DÉJÀ `noindex` dans leur `metadata`.
//
// Or `noindex` est une instruction écrite DANS la page. Pour la lire, il faut
// avoir le droit de la télécharger. En interdisant l'exploration, on empêchait
// Google de lire la seule instruction qui lui ordonne de ne pas indexer. Il
// n'obéit alors qu'à l'interdiction d'ENTRER, pas à l'interdiction de
// RÉFÉRENCER : l'adresse peut rester dans l'index, sans titre ni description,
// et Search Console la range sous « Bloquée par le fichier robots.txt » —
// cinq pages dans ce cas au dernier relevé, indéfiniment, car rien ne peut
// plus résoudre la situation tant que l'interdiction tient.
//
// LA RÈGLE, DÉSORMAIS :
//   · la page existe et doit disparaître de l'index → `noindex` SEUL, et on
//     laisse Google la lire ;
//   · il n'y a aucune page pour porter l'instruction (une API, une
//     redirection de suivi) → `Disallow` SEUL.
//
// Le budget d'exploration économisé par la double protection était de toute
// façon théorique : ces pages ne sont liées de nulle part.
//
// UNE EXCEPTION ASSUMÉE : LES LIENS À JETON. Ils gardent les deux, et
// `Disallow` y est le plus fort des deux — non pas pour l'indexation, mais
// parce que EXPLORER un lien à usage unique, c'est le CONSOMMER. Une
// confirmation d'inscription ouverte par un robot est une inscription que
// l'habitant n'a jamais validée. Le `noindex` de ces pages restera donc
// illisible pour Google, et les rares adresses qui fuitent par un référent
// pourront apparaître sous « Bloquée par le fichier robots.txt » — c'est le
// prix, et il est très inférieur à celui d'un jeton brûlé.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // ── DES ROUTES SANS PAGE, donc sans endroit où écrire `noindex`.
          "/api/",
          // Les redirections de suivi : elles comptent un clic et repartent
          // aussitôt. Aucun document n'est rendu, `noindex` n'a nulle part où
          // s'inscrire, et chaque exploration fausse un compteur réel.
          "/offre/",
          "/o/",
          // Les liens à jeton, à usage unique et nominatifs. Les explorer, c'est
          // les consommer.
          "/p/",
          "/saisie/",
          "/ville/confirmer/",
          "/ville/stop/",
          "/site-internet/stop/",
          // ── L'ADMINISTRATION ET L'AUTHENTIFICATION. Rien à indexer, et on
          //    préfère qu'un robot n'aille pas y frapper du tout.
          "/admin",
          "/auth/",
          "/popey-human/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
