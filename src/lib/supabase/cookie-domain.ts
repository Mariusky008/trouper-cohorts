// Le domaine sur lequel poser les cookies de session — en UN seul endroit.
//
// La règle : `popey.academy` et `www.popey.academy` doivent partager la même
// session, sinon on est déconnecté en passant de l'un à l'autre. On pose donc
// le cookie sur `.popey.academy`.
//
// Cette fonction était recopiée à l'identique dans client.ts, server.ts et
// middleware.ts. À l'ajout de clikme.fr, en oublier une seule suffisait à
// déconnecter les gens de façon aléatoire — le genre de panne qu'on met des
// jours à reproduire. Un seul endroit, donc.
//
// LISTE EXPLICITE, et pas « les deux derniers labels du nom d'hôte » : sur un
// domaine de prévisualisation (`xxx.vercel.app`), la déduction donnerait
// `.vercel.app`, que les navigateurs refusent — c'est un suffixe public, et
// poser un cookie dessus reviendrait à le partager avec tous les projets
// hébergés là. Un domaine inconnu renvoie donc `undefined`, ce qui laisse le
// navigateur poser le cookie sur l'hôte exact : le comportement sûr.
const DOMAINES = ["popey.academy", "clikme.fr"] as const;

const echappe = (d: string) => d.replace(/[.]/g, "\\.");

/** `.popey.academy` · `.clikme.fr` · `undefined` si l'hôte n'est pas des nôtres. */
export function cookieDomainForHost(host: string | null | undefined): string | undefined {
  const hostname = String(host || "").split(":")[0].toLowerCase();
  if (!hostname) return undefined;
  for (const d of DOMAINES) {
    if (new RegExp(`(^|\\.)${echappe(d)}$`).test(hostname)) return `.${d}`;
  }
  return undefined;
}
