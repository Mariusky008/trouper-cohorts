// L'adresse publique du site, en UN seul endroit.
//
// Elle vient de la variable d'environnement Vercel `NEXT_PUBLIC_SITE_URL`.
//
// LE REPLI EST PASSÉ SUR clikme.fr, ET C'EST UN CORRECTIF, pas un rangement.
// Il visait l'ancien domaine, avec une raison qui était juste à l'époque : ne
// pas fabriquer de QR codes vers un domaine qui ne répondait pas encore. Cette
// raison est morte le jour où clikme.fr est devenu le site servi, et le repli
// s'est retourné : faute de variable en production, le site annonçait à Google
// une canonique et un sitemap sur `www.popey.academy` — c'est-à-dire sur une
// adresse qui ne fait plus que rediriger en 301 vers celle-ci. Une page dont la
// canonique désigne une redirection ne peut pas être indexée, et c'est
// exactement ce que Search Console rapportait.
//
// La règle générale : un repli doit désigner ce qui est VRAI quand on ne sait
// pas, jamais ce qui l'était avant. Ici, le domaine servi.
//
// Attention, `NEXT_PUBLIC_*` est inséré dans le code À LA COMPILATION, y compris
// côté serveur : changer la variable sur Vercel ne suffit pas, il faut
// redéployer pour qu'elle prenne effet.
//
// Sans « / » final : tout le code concatène des chemins qui commencent par « / ».
export const SITE_URL = String(process.env.NEXT_PUBLIC_SITE_URL || "https://www.clikme.fr").replace(/\/+$/, "");

/** L'hôte seul, pour l'affichage (pied d'image de partage, lettres…). */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "").replace(/^www\./, "");

/**
 * Les domaines qui NOUS appartiennent.
 *
 * Sert à deux endroits qui, s'ils divergent, cassent le site de façons très
 * différentes et également pénibles à diagnostiquer :
 *   · le domaine des cookies de session (sinon : déconnexions aléatoires) ;
 *   · le routage du proxy (sinon : tout hôte inconnu est pris pour le domaine
 *     personnalisé d'un commerçant, et la racine affiche « Site en préparation »).
 *
 * C'est exactement ce qui est arrivé à clikme.fr : le DNS marchait, Vercel
 * servait, et le proxy renvoyait le résolveur de domaines de commerçants.
 */
export const NOS_DOMAINES = ["popey.academy", "clikme.fr"] as const;

/** `true` si l'hôte est l'un des nôtres (sous-domaines compris). */
export function estNotreHote(host: string | null | undefined): boolean {
  const h = String(host || "").split(":")[0].toLowerCase();
  if (!h) return false;
  return NOS_DOMAINES.some((d) => h === d || h.endsWith(`.${d}`));
}
