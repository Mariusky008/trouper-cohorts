/**
 * 🏠 « MA MAISON » — LE SERVEUR (`ma-maison.ts`, `docs/univers/ma-maison.md` ; le lot M1).
 *
 * - **Sa pièce** : `<habitant>/ma-piece/piece.json` ({ piece, le }). On ne choisit qu'une pièce prête (son panorama fait,
 *   le lot M0) ; on en change quand on veut (⚙️ « Changer de pièce »).
 * - **Sa scène** : le panorama de la pièce dans la lumière de l'heure de Paris (la sienne si cette lumière n'est pas
 *   faite), à adresse stable et en deux largeurs (`imageSalon`, `LARGEURS_PANORAMA`) ; ses emplacements posés à la main
 *   (`pieces-duo/<pièce>/large/releve.json`) ; son centre (la place de la figurine).
 * - **Sa figurine** : sa figurine assise dans son fauteuil (sa fiche, `references.assise`), détourée au plus près une
 *   fois (`<habitant>/ma-piece/figurine.png`, refaite si sa figurine change), à adresse stable. En attendant les calques
 *   de la figurine (le lot S1, la session des messages), elle est posée entière.
 * - **Le catalogue** : les neuf pièces dans l'ordre de son âge, chacune avec sa vignette si elle est prête.
 *
 * Rien n'est généré ici (aucun moteur d'image) : `sharp` seulement, une fois.
 *
 * FICHIER SERVEUR.
 */
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { lireFichePerso } from "./fiches-serveur";
import { depotDans, ecrireJson, lireJson } from "./ma-figurine-serveur";
import { objetsDeMaMaison } from "./etagere-serveur";
import {
  CENTRE_PAR_DEFAUT,
  LARGEURS_FIGURINE,
  LARGEURS_PANORAMA,
  LARGEURS_VIGNETTE,
  piecesDansLOrdre,
  placerChezMoi,
  type CatalogueMaison,
  type MaMaisonVue,
  type ScenePiece,
} from "./ma-maison";
import { emplacementsValides, fichierLarge, momentDuoDe, pieceDuoDe, pieceDuoValide, type MomentDuo, type PieceDuo } from "./pieces-duo";
import { imageSalon } from "./salon-fichiers-serveur";
import { sesDixHuitAns } from "./voeu-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const json = (b: Buffer | null) => {
  try {
    return JSON.parse(b?.toString() || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
};
const dossierMaison = (h: string) => `${h}/ma-piece`;
const dossierLarge = (p: PieceDuo) => `pieces-duo/${p}/large`;
/** L'heure de Paris (0 à 23). */
const heureDeParis = (d: Date) => Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hour12: false, timeZone: "Europe/Paris" }).format(d)) % 24;

/** Sa pièce ; `null` s'il n'en a pas encore choisi. */
export async function lireSaPiece(supabase: Supabase, h: string): Promise<PieceDuo | null> {
  const d = depotDans(supabase, dossierMaison(h));
  if (!(await d.lister().catch(() => [] as string[])).includes("piece.json")) return null;
  const p = json(await d.lire("piece.json").catch(() => null)).piece;
  return pieceDuoValide(p) ? p : null;
}

/** La pièce est prête : son panorama est fait (dans sa lumière à elle). */
async function estPrete(supabase: Supabase, p: PieceDuo): Promise<boolean> {
  return (await depotDans(supabase, dossierLarge(p)).lister().catch(() => [] as string[])).includes(fichierLarge("panorama"));
}

/** 🛋️ Choisir sa pièce (ou en changer) : une pièce du catalogue, prête. */
export async function choisirSaPiece(supabase: Supabase, h: string, p: unknown): Promise<{ error?: string }> {
  if (!pieceDuoValide(p)) return { error: "Quelle pièce ?" };
  if (!(await estPrete(supabase, p))) return { error: "Cette pièce n’est pas encore prête." };
  await depotDans(supabase, dossierMaison(h)).ecrire("piece.json", Buffer.from(JSON.stringify({ piece: p, le: new Date().toISOString() })), "application/json");
  return {};
}

/**
 * 🛋️ La scène d'une pièce, à cette heure : son panorama dans la lumière de l'heure (sinon dans la sienne), ses
 * emplacements, son centre. `null` si son panorama n'est pas fait.
 */
export async function sceneDeLaMaison(supabase: Supabase, p: PieceDuo, maintenant = new Date()): Promise<ScenePiece | null> {
  const dl = depotDans(supabase, dossierLarge(p));
  const noms = await dl.lister().catch(() => [] as string[]);
  const x = pieceDuoDe(p);
  const voulu = momentDuoDe(heureDeParis(maintenant));
  const nomDe = (m: MomentDuo) => fichierLarge(m === x.moment ? "panorama" : `panorama-${m}`);
  const moment: MomentDuo = noms.includes(nomDe(voulu)) ? voulu : x.moment;
  if (!noms.includes(nomDe(moment))) return null;
  const [panorama, releve] = await Promise.all([
    imageSalon(supabase, `${dossierLarge(p)}/${nomDe(moment)}`, LARGEURS_PANORAMA),
    noms.includes("releve.json") ? dl.lire("releve.json").catch(() => null) : Promise.resolve(null),
  ]);
  if (!panorama) return null;
  const r = json(releve);
  const emplacements = r.emplacements ? emplacementsValides(r.emplacements) : null;
  // (le centre posé à la main : la boîte de la figurine dans son fauteuil, de la tête au sol)
  const centre = r.ajuste === true && emplacements?.places[0] ? emplacements.places[0] : CENTRE_PAR_DEFAUT;
  return { piece: p, nom: x.nom, emoji: x.emoji, moment, panorama, emplacements, centre };
}

/**
 * 🪑 Sa figurine assise dans son fauteuil, détourée au plus près (une fois ; refaite quand sa figurine change), à adresse
 * stable. `null` s'il n'a pas encore sa figurine du nouveau style.
 */
export async function figurineDeLaMaison(supabase: Supabase, h: string): Promise<MaMaisonVue["figurine"]> {
  const perso = await lireFichePerso(supabase, h).catch(() => ({ fiche: null }));
  const source = perso.fiche?.style === "collection-1" ? s(perso.fiche.references.assise?.chemin) : "";
  if (!source) return null;
  const d = depotDans(supabase, dossierMaison(h));
  const noms = await d.lister().catch(() => [] as string[]);
  const deja = noms.includes("figurine.json") && noms.includes("figurine.png") && json(await d.lire("figurine.json").catch(() => null)).source === source;
  if (!deja) {
    const octets = await depotDans(supabase, source.slice(0, source.lastIndexOf("/")))
      .lire(source.slice(source.lastIndexOf("/") + 1))
      .catch(() => null);
    if (!octets) return null;
    let detouree: Buffer;
    try {
      // (au plus près : le vide transparent autour d'elle, retiré ; la plus grande, 1200 points de haut)
      detouree = await sharp(await sharp(octets).ensureAlpha().trim({ threshold: 1 }).png().toBuffer())
        .resize({ height: 1200, withoutEnlargement: true })
        .png()
        .toBuffer();
    } catch {
      detouree = await sharp(octets).png().toBuffer();
    }
    await d.ecrire("figurine.png", detouree, "image/png");
    await d.ecrire("figurine.json", Buffer.from(JSON.stringify({ source, le: new Date().toISOString() })), "application/json");
  }
  return imageSalon(supabase, `${dossierMaison(h)}/figurine.png`, LARGEURS_FIGURINE);
}

/** ✨ (lot M2) sa dernière visite chez lui (`<habitant>/ma-piece/vu.json`) : ce qui a été gardé depuis s'annonce à l'arrivée. */
const cheminVu = (h: string) => `${dossierMaison(h)}/vu.json`;

/**
 * 🏠 Sa maison : sa pièce, sa scène à cette heure, sa figurine ; (lot M2) ce qu'il a gardé, à ses emplacements
 * (`placerChezMoi`), et sa dernière visite (`vuLe`).
 */
export async function maMaison(supabase: Supabase, h: string, maintenant = new Date()): Promise<MaMaisonVue> {
  const piece = await lireSaPiece(supabase, h);
  const [scene, figurine, objets, vu] = await Promise.all([
    piece ? sceneDeLaMaison(supabase, piece, maintenant).catch(() => null) : Promise.resolve(null),
    figurineDeLaMaison(supabase, h).catch(() => null),
    piece ? objetsDeMaMaison(supabase, h).catch(() => []) : Promise.resolve([]),
    lireJson<{ le?: number }>(supabase, cheminVu(h)).catch(() => ({}) as { le?: number }),
  ]);
  if (!scene) return { piece, scene, figurine };
  return { piece, scene, figurine, contenu: placerChezMoi(objets, scene.emplacements?.cadres.length ?? 0), vuLe: Number(vu.le) || 0 };
}

/** ✨ (lot M2) Il est venu chez lui (après l'arrivée) : ce qu'il a gardé jusqu'ici ne s'annoncera plus. */
export async function maMaisonVue(supabase: Supabase, h: string): Promise<void> {
  await ecrireJson(supabase, cheminVu(h), { le: Date.now() });
}

/** 📋 Le catalogue : les neuf pièces dans l'ordre de son âge, chacune avec sa vignette si elle est prête. */
export async function catalogueDeLaMaison(supabase: Supabase, h: string): Promise<CatalogueMaison> {
  const [adulte, piece] = await Promise.all([sesDixHuitAns(supabase, h).catch(() => null), lireSaPiece(supabase, h)]);
  const pieces = await Promise.all(
    piecesDansLOrdre(adulte).map(async (p) => ({
      cle: p.cle,
      nom: p.nom,
      pour: p.pour,
      emoji: p.emoji,
      vignette: (await estPrete(supabase, p.cle)) ? await imageSalon(supabase, `${dossierLarge(p.cle)}/${fichierLarge("panorama")}`, LARGEURS_VIGNETTE).catch(() => null) : null,
    })),
  );
  return { pieces, piece };
}
