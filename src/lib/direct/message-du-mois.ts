/**
 * 📬 LE MESSAGE DU MOIS — pour sa liste de diffusion WhatsApp, ses amis d'ici.
 *
 * « Un petit guide facile, et chaque mois lui préparer un message à diffuser sur
 * sa liste de diffusion. Ce sont ses amis personnels locaux, pas des clients. »
 *
 * TOUT PAR SON WHATSAPP, JAMAIS PAR CLIKME : ClikMe prépare le texte, il le relit,
 * le change s'il veut, et l'envoie lui-même à sa liste. Le lien est le sien
 * (`/b/<sa-page>?via=diffusion`) : chaque ouverture compte dans « diffusion »
 * (`20261025130000_compteurs_diffusion.sql`), et le comptoir lui dit combien de
 * ses amis sont venus.
 *
 * LE TON EST LE SIEN, PAS CELUI D'UNE PUB : des amis, une fois par mois, ce qu'il
 * a fait de neuf, et une ligne pour dire qu'on peut ne plus le recevoir. Rien
 * n'est inventé : seules ses vraies annonces du mois sont citées.
 *
 * Ce fichier ne contient que des règles : il sert au serveur et au navigateur.
 */
import type { FamilleDouble } from "./double-metiers";

export type Nouveaute = { nom: string; prix?: string };

/** « 2026-10 » : le mois de Paris d'un instant (la clé du « déjà envoyé »). */
export const moisDe = (t: number) => new Date(t).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }).slice(0, 7);

/** « octobre », le mois de Paris d'un instant. */
export const nomDuMois = (t: number) => new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "Europe/Paris" }).format(new Date(t));
/** « d’octobre », « de novembre » : l'élision devant une voyelle. */
export const duMois = (t: number) => {
  const m = nomDuMois(t);
  return /^[aeiouyéèêh]/i.test(m) ? `d’${m}` : `de ${m}`;
};

/** Ce qu'on trouve sur sa page, dans les mots de son métier. */
const SUR_MA_PAGE: Partial<Record<FamilleDouble, string>> = {
  table: "Chaque jour un nouveau plat du jour : tu le vois là avant de venir.",
  bar: "Ce qui se passe au bar cette semaine, c’est là.",
  coiffure: "Les coupes du moment, et tu peux les essayer sur ta photo.",
  ongles: "Les poses du moment, à essayer sur ta main en photo.",
  mode: "Mes nouvelles pièces, à essayer sur ta photo avant de passer.",
  lunettes: "Les montures du moment, à essayer sur ton visage en photo.",
  fleurs: "Les bouquets de la semaine, c’est là.",
  librairie: "Mes coups de cœur du moment, c’est là.",
  createur: "Mes nouvelles créations, c’est là.",
};

/** Une annonce du Direct (« Veste en jean brut · 79 € ») rendue en nom et prix. */
export function nouveauteDuTexte(texte: string): Nouveaute | null {
  const t = texte.replace(/\s+/g, " ").replace(/^il en reste\s*!\s*(·\s*)?/i, "").trim();
  if (!t) return null;
  const morceaux = t.split(" · ").map((x) => x.trim()).filter(Boolean);
  const prix = morceaux.find((m) => /\d\s*€/.test(m));
  const nom = morceaux.filter((m) => m !== prix).join(" · ").replace(/^[^:]{2,30} : /, "").slice(0, 60);
  return nom ? { nom, ...(prix ? { prix } : {}) } : null;
}

/** Ses annonces du mois, sans doublon, les plus récentes d'abord, trois au plus. */
export function nouveautesDuMois(textes: string[], max = 3): Nouveaute[] {
  const vues = new Set<string>();
  const sortie: Nouveaute[] = [];
  for (const t of textes) {
    const n = nouveauteDuTexte(t);
    if (!n || vues.has(n.nom.toLowerCase())) continue;
    vues.add(n.nom.toLowerCase());
    sortie.push(n);
    if (sortie.length >= max) break;
  }
  return sortie;
}

/** LE MESSAGE, tel qu'il part : il le relit et le change s'il veut. */
export function messageDuMois(o: {
  commerce: string;
  famille: FamilleDouble;
  prenom?: string;
  maintenant: number;
  nouveautes: Nouveaute[];
  lien: string;
}): string {
  const lignes: string[] = [];
  lignes.push("Coucou ! 😊");
  lignes.push(`Mon petit message du mois ${duMois(o.maintenant)}, de ${o.commerce} :`);
  if (o.nouveautes.length) {
    lignes.push("");
    lignes.push("Ce mois-ci :");
    for (const n of o.nouveautes) lignes.push(`• ${n.nom}${n.prix ? ` (${n.prix})` : ""}`);
  }
  lignes.push("");
  lignes.push(SUR_MA_PAGE[o.famille] ?? "Toutes mes nouveautés sont là.");
  lignes.push(`👉 ${o.lien}`);
  lignes.push("");
  lignes.push(`À très vite !${o.prenom ? ` ${o.prenom}` : ""}`);
  lignes.push("(Tu préfères ne plus recevoir ce petit message ? Dis-le-moi, sans souci.)");
  return lignes.join("\n");
}

/** Le lien de son message : sa porte courte, comptée à part. */
export const lienDuMessage = (origine: string, slug: string) => `${origine.replace(/\/+$/, "")}/b/${encodeURIComponent(slug)}?via=diffusion`;
