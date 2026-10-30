/** Le code d'un bon de la surprise du chef : quatre signes faciles à lire (ni 0/O, ni 1/I). Partagé page et serveur. */
export const SIGNES_BON = "ACDEFGHJKMNPQRTUVWXY3479";
export const codeBonPropre = (brut: string) => String(brut ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
