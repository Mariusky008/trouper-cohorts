/**
 * 🏠 « MA MAISON » — LE SERVEUR (`ma-maison.ts`, `docs/univers/ma-maison.md` ; le lot M1).
 *
 * - **Sa pièce** : `<habitant>/ma-piece/piece.json` ({ piece, le }). On ne choisit qu'une pièce prête (son image faite,
 *   le lot M0) ; on en change quand on veut (⚙️ « Changer de pièce »).
 * - **Sa scène** (le propriétaire, 20 novembre 2026 : « le panorama, les images se chevauchent […] on pourrait tout avoir
 *   sur une seule image comme celle de la messagerie ») : L'IMAGE DE LA PIÈCE, CELLE DE LA MESSAGERIE (en hauteur,
 *   `pieces-duo/<pièce>/decor.png`), dans la lumière de l'heure de Paris (`lumiere-<moment>.png` ; la sienne si cette
 *   lumière n'est pas faite), à adresse stable ; ses emplacements (`pieces-duo/<pièce>/releve.json`) ; son centre : la
 *   place de gauche du duo (sa figurine dans son fauteuil, de la tête au sol). Le panorama n'est plus servi.
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
import { SEAU_FIGURINES, depotDans, ecrireJson, lireJson, lireLigne } from "./ma-figurine-serveur";
import { jourParis } from "@/lib/jour-paris";
import { humeurDe } from "./rituel";
import { objetDe } from "./visites";
import type { Sentiment } from "./ma-figurine";
import { objetsDeMaMaison } from "./etagere-serveur";
import { questionChezMoi } from "./question-maison-serveur";
import { poserProfil } from "./talkie-serveur";
import { VISIBILITES, type Visibilite } from "./monde";
import {
  CENTRE_PAR_DEFAUT,
  LARGEURS_FIGURINE,
  LARGEURS_PANORAMA,
  LARGEURS_VIGNETTE,
  piecesDansLOrdre,
  placerChezMoi,
  TABLE_MAX,
  type CadeauMaison,
  type CatalogueMaison,
  type MaMaisonVue,
  type ScenePiece,
} from "./ma-maison";
import { emplacementsValides, momentDuoDe, pieceDuoDe, pieceDuoValide, type MomentDuo, type PieceDuo } from "./pieces-duo";
import { imageSalon } from "./salon-fichiers-serveur";
import { sesDixHuitAns } from "./majorite-serveur";
import { themeDe } from "./decouvrir";
import { INVITATION_MS, type MonSalon } from "./salons-ouverts";
import type { PropositionRegarder } from "./regarder-a-deux";
import { maBoiteARevoir } from "./revoir-serveur";

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
const dossierPiece = (p: PieceDuo) => `pieces-duo/${p}`;
const nomLumiere = (m: MomentDuo) => `lumiere-${m}.png`;
/** L'heure de Paris (0 à 23). */
const heureDeParis = (d: Date) => Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hour12: false, timeZone: "Europe/Paris" }).format(d)) % 24;

/** Sa pièce ; `null` s'il n'en a pas encore choisi. */
export async function lireSaPiece(supabase: Supabase, h: string): Promise<PieceDuo | null> {
  const d = depotDans(supabase, dossierMaison(h));
  if (!(await d.lister().catch(() => [] as string[])).includes("piece.json")) return null;
  const p = json(await d.lire("piece.json").catch(() => null)).piece;
  return pieceDuoValide(p) ? p : null;
}

/** La pièce est prête : son image est faite (celle de la messagerie, dans sa lumière à elle). */
async function estPrete(supabase: Supabase, p: PieceDuo): Promise<boolean> {
  return (await depotDans(supabase, dossierPiece(p)).lister().catch(() => [] as string[])).includes("decor.png");
}

/** 🛋️ Choisir sa pièce (ou en changer) : une pièce du catalogue, prête. */
export async function choisirSaPiece(supabase: Supabase, h: string, p: unknown): Promise<{ error?: string }> {
  if (!pieceDuoValide(p)) return { error: "Quelle pièce ?" };
  if (!(await estPrete(supabase, p))) return { error: "Cette pièce n’est pas encore prête." };
  await depotDans(supabase, dossierMaison(h)).ecrire("piece.json", Buffer.from(JSON.stringify({ piece: p, le: new Date().toISOString() })), "application/json");
  return {};
}

/**
 * 🛋️ La scène d'une pièce, à cette heure : son image (celle de la messagerie) dans la lumière de l'heure (sinon dans la
 * sienne), ses emplacements, son centre (la place de gauche du duo ; sans relevé, `CENTRE_PAR_DEFAUT`). `null` si son
 * image n'est pas faite. (`panorama` garde son nom : c'est l'image de la pièce, en hauteur désormais.)
 */
export async function sceneDeLaMaison(supabase: Supabase, p: PieceDuo, maintenant = new Date()): Promise<ScenePiece | null> {
  const d = depotDans(supabase, dossierPiece(p));
  const noms = await d.lister().catch(() => [] as string[]);
  if (!noms.includes("decor.png")) return null;
  const x = pieceDuoDe(p);
  const voulu = momentDuoDe(heureDeParis(maintenant));
  const moment: MomentDuo = voulu !== x.moment && noms.includes(nomLumiere(voulu)) ? voulu : x.moment;
  const [panorama, releve] = await Promise.all([
    imageSalon(supabase, `${dossierPiece(p)}/${moment === x.moment ? "decor.png" : nomLumiere(moment)}`, LARGEURS_PANORAMA),
    noms.includes("releve.json") ? d.lire("releve.json").catch(() => null) : Promise.resolve(null),
  ]);
  if (!panorama) return null;
  const r = json(releve);
  const emplacements = r.emplacements ? emplacementsValides(r.emplacements) : null;
  // (sa figurine, dans son fauteuil : la place de gauche des deux places du duo — de la tête au sol)
  const gauche = emplacements?.places.length ? [...emplacements.places].sort((a, b) => a.x - b.x)[0] : null;
  const centre = gauche ?? CENTRE_PAR_DEFAUT;
  return { piece: p, nom: x.nom, emoji: x.emoji, moment, panorama, emplacements, centre };
}

/**
 * 🪑 Sa figurine assise dans son fauteuil, détourée au plus près (une fois ; refaite quand sa figurine change), à adresse
 * stable. `null` s'il n'a pas encore sa figurine du nouveau style.
 */
export async function figurineDeLaMaison(supabase: Supabase, h: string): Promise<MaMaisonVue["figurine"]> {
  const d = depotDans(supabase, dossierMaison(h));
  // (⚡ 21 novembre 2026, « la vitesse » : sa fiche et la note de sa figurine détourée, lues en même temps ; puis son
  // image, à adresse stable — trois allers-retours en moins à chaque écran qui la montre)
  const [perso, note] = await Promise.all([lireFichePerso(supabase, h).catch(() => ({ fiche: null })), d.lire("figurine.json").catch(() => null)]);
  const source = perso.fiche?.style === "collection-1" ? s(perso.fiche.references.assise?.chemin) : "";
  if (!source) return null;
  if (json(note).source === source) {
    const deja = await imageSalon(supabase, `${dossierMaison(h)}/figurine.png`, LARGEURS_FIGURINE);
    if (deja) return deja;
  }
  {
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

/** 🚪 (lot M4) qui peut entrer chez lui (`<habitant>/ma-piece/visibilite.json`) : ses proches, d'office. */
export const cheminVisibiliteMaison = (h: string) => `${dossierMaison(h)}/visibilite.json`;
export async function visibiliteDeLaMaison(supabase: Supabase, h: string): Promise<Visibilite> {
  const v = (await lireJson<{ v?: string }>(supabase, cheminVisibiliteMaison(h)).catch(() => ({}) as { v?: string })).v;
  return (VISIBILITES as readonly string[]).includes(s(v)) ? (v as Visibilite) : "proches";
}
/** Il a déclaré 18 ans ou plus (`<habitant>/adulte.json`, le lot 6 des visites). */
const aDitSesDixHuitAns = async (supabase: Supabase, h: string) => Boolean(s((await lireJson<{ le?: string }>(supabase, `${h}/adulte.json`).catch(() => ({}) as { le?: string })).le));
/** 🏡 (lot M4) la vignette de sa pièce, pour « Les univers à visiter ». */
export async function vignetteDeLaPiece(supabase: Supabase, p: PieceDuo): Promise<string> {
  return (await imageSalon(supabase, `${dossierPiece(p)}/decor.png`, LARGEURS_VIGNETTE).catch(() => null))?.src ?? "";
}

/**
 * 🙂🚪🎁 (lot M5) CE QUI VIT DANS SA MAISON : son humeur du jour (`<habitant>/humeur.json`, celle du rituel) ; qui a
 * frappé depuis `depuis` (ms ; des prénoms, jamais un nombre) ; les cadeaux de ses proches sur la table basse (les
 * souvenirs du lot 6 : `<habitant>/monde/souvenirs.json`) — à ouvrir d'abord, puis gardés. `visiteur` : seulement ce
 * qui est posé (pas ce qui attend), et pas de « pendant ton absence ».
 */
export async function vieDeLaMaison(supabase: Supabase, h: string, o: { depuis?: number; visiteur?: boolean } = {}): Promise<Pick<MaMaisonVue, "humeur" | "absence" | "table">> {
  const [hum, visites, souvenirs] = await Promise.all([
    lireJson<{ jour?: string; visage?: string }>(supabase, `${h}/humeur.json`).catch(() => ({}) as { jour?: string; visage?: string }),
    o.visiteur ? Promise.resolve({} as { liste?: unknown }) : lireJson<{ liste?: unknown }>(supabase, `${h}/monde/visites.json`).catch(() => ({}) as { liste?: unknown }),
    lireJson<{ liste?: unknown }>(supabase, `${h}/monde/souvenirs.json`).catch(() => ({}) as { liste?: unknown }),
  ]);
  const visage = hum.jour === jourParis() ? humeurDe(s(hum.visage) as Sentiment) : null;
  type Brut = { id?: string; de?: string; objet?: string; mot?: string; le?: string; accepte_le?: string };
  const l = (Array.isArray(souvenirs.liste) ? (souvenirs.liste as Brut[]) : []).filter((x) => s(x?.id) && s(x?.de) && objetDe(x.objet));
  const attente = o.visiteur ? [] : l.filter((x) => !x.accepte_le).sort((a, b) => s(a.le).localeCompare(s(b.le)));
  const poses = l.filter((x) => x.accepte_le).sort((a, b) => s(b.accepte_le).localeCompare(s(a.accepte_le)));
  const surTable = [...attente, ...poses].slice(0, TABLE_MAX);
  const passes = (Array.isArray(visites.liste) ? (visites.liste as { de?: string; le?: string }[]) : []).filter((v) => s(v?.de) && s(v.de) !== h && (Date.parse(s(v.le)) || 0) > (o.depuis ?? Date.now()));
  const ids = [...new Set([...surTable.map((x) => s(x.de)), ...passes.map((v) => s(v.de))])];
  const prenoms = new Map(await Promise.all(ids.map(async (id) => [id, s((await lireLigne(supabase, id)).ligne?.prenom) || "Quelqu’un"] as const)));
  const absence = [...new Set(passes.reverse().map((v) => prenoms.get(s(v.de)) ?? "Quelqu’un"))].slice(0, 3);
  return {
    ...(visage ? { humeur: { emoji: visage.emoji, nom: visage.court } } : {}),
    ...(absence.length ? { absence } : {}),
    ...(surTable.length
      ? {
          table: surTable.map((x): CadeauMaison => {
            const ob = objetDe(x.objet)!;
            return { id: s(x.id), emoji: ob.emoji, nom: ob.nom, ...(x.mot ? { mot: s(x.mot) } : {}), de: prenoms.get(s(x.de)) ?? "Quelqu’un", le: s(x.accepte_le) || s(x.le), ...(x.accepte_le ? {} : { attente: true as const }) };
          }),
        }
      : {}),
  };
}

/** ✨ (lot M2) sa dernière visite chez lui (`<habitant>/ma-piece/vu.json`) : ce qui a été gardé depuis s'annonce à l'arrivée. */
const cheminVu = (h: string) => `${dossierMaison(h)}/vu.json`;

/**
 * 🏠 Sa maison : sa pièce, sa scène à cette heure, sa figurine ; (lot M2) ce qu'il a gardé, à ses emplacements
 * (`placerChezMoi`), et sa dernière visite (`vuLe`).
 */
/** 🏠 (lot D5 de Découvrir) « Mes salons » : les salons ouverts où il va (écrit à chaque entrée, une fois par heure). */
export const cheminMesSalons = (h: string) => `${h}/mes-salons.json`;
/** 🏠 « Mes salons » : les six plus récents, en fanions dans ma pièce. */
export async function mesSalons(supabase: Supabase, h: string): Promise<MonSalon[]> {
  const f = await lireJson<{ themes?: Record<string, { dernier?: number }> }>(supabase, cheminMesSalons(h)).catch(() => ({}) as { themes?: Record<string, { dernier?: number }> });
  return Object.entries(f.themes ?? {})
    .map(([t, v]) => ({ t: themeDe(t), dernier: Number(v?.dernier) || 0 }))
    .filter((x): x is { t: NonNullable<ReturnType<typeof themeDe>>; dernier: number } => Boolean(x.t))
    .sort((a, b) => b.dernier - a.dernier)
    .slice(0, 6)
    .map((x) => ({ theme: x.t.id, e: x.t.e, nom: x.t.nom }));
}

/**
 * 🎬 (« Regarder à deux », section 24) Les vidéos que mes proches me proposent de regarder avec eux : leurs invitations
 * devant leur télé qui portent une vidéo (`<habitant>/invitations-tele/<q>.json`, six heures).
 */
export async function propositionsDeRegarder(supabase: Supabase, h: string): Promise<PropositionRegarder[]> {
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list(`${h}/invitations-tele`, { limit: 20, sortBy: { column: "name", order: "desc" } });
  const lus = await Promise.all((data ?? []).filter((e) => e.name.endsWith(".json")).map((e) => lireJson<Partial<PropositionRegarder>>(supabase, `${h}/invitations-tele/${e.name}`).catch(() => ({}) as Partial<PropositionRegarder>)));
  return lus
    .filter((x) => s(x.cle) && s(x.titre) && Date.now() - (Number(x.le) || 0) < INVITATION_MS)
    .map((x) => ({ cle: s(x.cle), prenom: s(x.prenom) || "Ton proche", titre: s(x.titre), le: Number(x.le) }))
    .sort((a, b) => b.le - a.le)
    .slice(0, 3);
}

export async function maMaison(supabase: Supabase, h: string, maintenant = new Date()): Promise<MaMaisonVue> {
  const piece = await lireSaPiece(supabase, h);
  const [scene, figurine, objets, vu, visibilite, adulte, cle] = await Promise.all([
    piece ? sceneDeLaMaison(supabase, piece, maintenant).catch(() => null) : Promise.resolve(null),
    figurineDeLaMaison(supabase, h).catch(() => null),
    piece ? objetsDeMaMaison(supabase, h).catch(() => []) : Promise.resolve([]),
    lireJson<{ le?: number }>(supabase, cheminVu(h)).catch(() => ({}) as { le?: number }),
    visibiliteDeLaMaison(supabase, h),
    aDitSesDixHuitAns(supabase, h),
    poserProfil(supabase, h).catch(() => ""),
  ]);
  if (!scene) return { piece, scene, figurine };
  const vuLe = Number(vu.le) || 0;
  // (🙂🚪🎁 lot M5 : son humeur, qui a frappé depuis sa dernière visite, les cadeaux sur la table)
  const [vie, question, salons, regarder, aRevoir] = await Promise.all([
    vieDeLaMaison(supabase, h, { depuis: vuLe || Date.now() }).catch(() => ({})),
    // (💬 lot M5 : ce que mes proches ont répondu à ma question du jour)
    questionChezMoi(supabase, h).catch(() => null),
    // (🏠 lot D5 : mes salons, en fanions)
    mesSalons(supabase, h).catch(() => []),
    // (🎬 « Regarder à deux » : les vidéos que mes proches me proposent)
    propositionsDeRegarder(supabase, h).catch(() => []),
    // (📼 « Revoir » : mes vidéos vues où des amis ont réagi depuis)
    maBoiteARevoir(supabase, h).catch(() => []),
  ]);
  return { piece, scene, figurine, contenu: placerChezMoi(objets, scene.emplacements?.cadres.length ?? 0), vuLe, visibilite, adulte, ...(cle ? { cle } : {}), ...vie, ...(question ? { question } : {}), ...(salons.length ? { salons } : {}), ...(regarder.length ? { regarder } : {}), ...(aRevoir.length ? { aRevoir: aRevoir.slice(0, 5).map((x) => ({ id: x.id, titre: x.titre, de: x.de })) } : {}) };
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
      vignette: (await estPrete(supabase, p.cle)) ? await imageSalon(supabase, `${dossierPiece(p.cle)}/decor.png`, LARGEURS_VIGNETTE).catch(() => null) : null,
    })),
  );
  return { pieces, piece };
}
