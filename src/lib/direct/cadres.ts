/**
 * 🖼️ LES CADRES DE LA PIÈCE DU DUO (`docs/univers/salon-du-duo.md`, sections 4.8 et 4.9 ; le lot S6) — leurs photos
 * accrochées au mur : « 🖼️ L'accrocher au mur ? » sous une photo envoyée, 🖼️ Accrocher (🛋️ Ensemble). Elle s'envole
 * dans un cadre vide d'abord ; les cadres pleins, chacun son tour (celui accroché depuis le plus longtemps). Toucher un
 * cadre : la photo en grand (« Accrochée par toi · aujourd'hui ») et « 🖼️ Une autre photo ici ».
 *
 * Les cadres sont ceux de la pièce (`emplacements.cadres`, quatre au plus) ; ce qui y est accroché est gardé par numéro de
 * cadre (`fils/<paire>/cadres.json`) : une pièce qui en a moins montre les premiers.
 *
 * Ce fichier est partagé (l'écran et le serveur).
 */

/** Les cadres d'une pièce, au plus (`pieces-duo.ts` en relève quatre au plus). */
export const CADRES_MAX = 4;

/** Une photo accrochée, telle qu'on la voit : son cadre, son message, son adresse signée, par qui, quand. */
export type CadreVu = { cadre: number; message: string; url: string; l: number; h: number; legende?: string; par: "moi" | "lui"; le: string };

export const PHRASES_CADRES = {
  accrocher: "🖼️ L’accrocher au mur ?",
  accrochee: "🖼️ Accrochée !",
  accrocheePar: (prenom: string) => `🖼️ ${prenom} a accroché une photo`,
  autre: "🖼️ Une autre photo ici",
  titre: "Accrocher une photo au mur",
  telephone: "📷 Une photo de ton téléphone",
  vosPhotos: "Ou l’une de vos photos",
  aucune: "Pas encore de photo entre vous : envoie-en une.",
  pasUnePhoto: "Seule une photo s’accroche au mur.",
  dejaLa: "🖼️ Elle est déjà au mur",
} as const;

/** Le cadre où va une nouvelle photo : le premier vide, sinon celui accroché depuis le plus longtemps. */
export function cadreLibre(cadres: readonly Pick<CadreVu, "cadre" | "le">[], n: number): number {
  const total = Math.max(0, Math.min(CADRES_MAX, n));
  if (!total) return 0;
  for (let i = 0; i < total; i++) if (!cadres.some((c) => c.cadre === i)) return i;
  const ici = cadres.filter((c) => c.cadre < total).sort((a, b) => (Date.parse(a.le) || 0) - (Date.parse(b.le) || 0));
  return ici[0]?.cadre ?? 0;
}

/** « Accrochée par toi · aujourd'hui », « Accrochée par Sam · hier », « … · le 12 nov. ». */
export function ditAccrochee(c: Pick<CadreVu, "par" | "le">, prenom: string, maintenant = new Date()): string {
  const jour = (d: Date) => d.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
  const quand = new Date(c.le);
  const auj = jour(maintenant);
  const hier = jour(new Date(maintenant.getTime() - 86_400_000));
  const j = Number.isNaN(quand.getTime()) ? "" : jour(quand);
  const dit = j === auj ? "aujourd’hui" : j === hier ? "hier" : j ? `le ${quand.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" })}` : "";
  return `Accrochée par ${c.par === "moi" ? "toi" : prenom}${dit ? ` · ${dit}` : ""}`;
}
