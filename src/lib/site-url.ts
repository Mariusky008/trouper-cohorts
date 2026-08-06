// L'adresse publique du site, en UN seul endroit.
//
// Elle vient de la variable d'environnement Vercel `NEXT_PUBLIC_SITE_URL`.
// Le repli sert au développement local et aux prévisualisations, et il reste
// volontairement sur l'ANCIEN domaine : tant que la variable n'est pas posée
// sur Vercel, le site continue de fabriquer des liens qui fonctionnent. Basculer
// le repli avant que clikme.fr ne réponde produirait des QR codes et des e-mails
// pointant vers un domaine mort. La bascule se fait par la variable, pas ici.
//
// Sans « / » final : tout le code concatène des chemins qui commencent par « / ».
export const SITE_URL = String(process.env.NEXT_PUBLIC_SITE_URL || "https://www.popey.academy").replace(/\/+$/, "");

/** L'hôte seul, pour l'affichage (pied d'image de partage, lettres…). */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "").replace(/^www\./, "");
