/**
 * 📷 « TA FIGURINE, C'EST TON VISAGE » — L'ESSAI, LE SERVEUR (le lot V0 ; `visage-essai.ts`, `docs/univers/decouvrir.md`,
 * section 28). Réservé à l'administrateur.
 *
 * Rangé à part de tout habitant : `essais-visage/<id>/` — `fiche.json` ({ id, prenom, moi, le, accord }), `photo.jpg`
 * (effacée dès que la figurine est faite), `figurine.png` (assise, détourée), `corps.png` et `tete.png` (les calques du
 * lot S1, `decouperFigurine`), `reperes.json` (la boîte de la tête, son pivot, et où le corps a été découpé), puis
 * `tete-<expression>.png` : chaque expression est faite sur la figurine entière (`expression-<expression>.png`, gardée
 * telle que le moteur l'a faite), puis **sa tête est découpée au même endroit** que la tête habituelle — posée
 * par-dessus, elle remplace le visage sans que le corps bouge.
 *
 * (21 novembre 2026, le propriétaire : « pour une ou deux expressions la figurine se double […] quand il utilise une
 * autre expression elle se juxtapose et si c'est en biais alors on voit les deux figurines ». Le moteur ne garde pas
 * toujours le cadrage au pixel près : la tête découpée « au même endroit » était décalée, et la tête habituelle, restée
 * sur le corps, dépassait. Désormais : la boîte est **recalée** sur l'image de l'expression (`recaler` : là où sa
 * silhouette colle le mieux à celle de la tête habituelle — quelques pixels de côté, un peu plus grande ou plus petite) ;
 * et le salon d'essai montre **le corps sans sa tête** (`corps-sans-tete.png` : le haut de la boîte de la tête effacé,
 * le cou reste) — ce qui dépasse d'une expression ne laisse plus voir l'autre tête.)
 *
 * Un passage fait une étape : la figurine (d'après la photo), la découpe (sans moteur), puis une expression.
 *
 * FICHIER SERVEUR.
 */
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { analyseConfiguree } from "./dressing-serveur";
import { decrireTraits } from "./figurine-pro-serveur";
import { depotDans, signer } from "./ma-figurine-serveur";
import { demanderUneImage } from "./moteur-images-serveur";
import { motInterdit } from "./mots-interdits";
import { consigneSculptee, consigneVisageAssiseLibre } from "./perso-consignes";
import { prendre, rendre } from "./pieces-duo-serveur";
import { decouperFigurine, type Reperes } from "./calques-figurine-serveur";
import { LARGEURS_CALQUES } from "./figurine-calques";
import { imageSalon } from "./salon-fichiers-serveur";
import { gradinDuSalon } from "./salons-gradins-serveur";
import { PLAN_GRADIN } from "./salons-gradins";
import { lireSelection } from "./selection-serveur";
import { jourParis } from "@/lib/jour-paris";
import {
  ETAPES_ESSAI,
  EXPRESSIONS_VISAGE,
  PERSONNES_ESSAI_MAX,
  PRENOM_ESSAI_MAX,
  type EtapeEssai,
  type EtatEssaiVisage,
  type ExpressionVisage,
  type FigurineEssai,
  type PersonneEssaiVue,
  type SalonEssai,
} from "./visage-essai";
import type { IdTheme } from "./decouvrir";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cle = () => s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
const RACINE = "essais-visage";
const dossier = (id: string) => `${RACINE}/${id}`;
const idValide = (x: unknown): x is string => typeof x === "string" && /^[0-9a-f]{12}$/.test(x);
const json = (b: Buffer | null) => {
  try {
    return JSON.parse(b?.toString() || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
};
type FicheEssai = { id: string; prenom: string; moi: boolean; le: string; accord: true; erreur?: string };
type ReperesEssai = { ratio: number; reperes: Reperes; boite: [number, number, number, number]; tetePx: [number, number, number, number]; taille: [number, number] };

/**
 * 🎭 Les cinq expressions, pour le moteur (en anglais) : le visage seulement, **la tête exactement à la même place, de
 * la même taille, sous le même angle** — sa tête est ensuite découpée au même endroit que la tête habituelle.
 */
const VISAGES: Record<ExpressionVisage, string> = {
  sourire: "a big, warm, happy SMILE: cheeks raised, eyes slightly squinting with happiness, eyebrows relaxed and lifted",
  rire: "a big burst of LAUGHTER: eyes squeezed shut into happy crescents, cheeks pushed up, a wide open laughing mouth",
  surprise: "a big SURPRISE: eyes wide open, eyebrows raised very high, the mouth open in a round « oh! »",
  bof: "an UNIMPRESSED « meh »: eyelids half lowered, one eyebrow slightly raised, the mouth flat and pressed, a little sideways look",
  grimace: "a funny GRIMACE: tongue sticking out, one eye squeezed shut, nose wrinkled",
};
export const consigneExpression = (e: ExpressionVisage) =>
  consigneVisageAssiseLibre(`${VISAGES[e]}. The head keeps EXACTLY the same position, size and angle (no tilt, no turn): only the face changes`);

const nomTete = (e: ExpressionVisage) => `tete-${e}.png`;
/** (l'expression entière, telle que le moteur l'a faite : sa tête s'y redécoupe sans repasser par le moteur) */
const nomExpression = (e: ExpressionVisage) => `expression-${e}.png`;
const CORPS_SANS_TETE = "corps-sans-tete.png";
/** La part de la boîte de la tête effacée du corps (en partant du haut) : le cou reste, sous la tête qui penche. */
const PART_SANS_TETE = 0.88;
/** Les étapes faites, d'après les fichiers. */
const faitesDe = (noms: string[]): EtapeEssai[] =>
  ETAPES_ESSAI.filter((e) => (e === "figurine" ? noms.includes("figurine.png") : e === "calques" ? noms.includes("reperes.json") && noms.includes("tete.png") : noms.includes(nomTete(e))));

async function lireFiche(supabase: Supabase, id: string): Promise<FicheEssai | null> {
  const f = json(await depotDans(supabase, dossier(id)).lire("fiche.json").catch(() => null));
  return s(f.id) === id && s(f.prenom) ? ({ id, prenom: s(f.prenom), moi: f.moi === true, le: s(f.le), accord: true, ...(s(f.erreur) ? { erreur: s(f.erreur) } : {}) } as FicheEssai) : null;
}
const ecrireFiche = (supabase: Supabase, f: FicheEssai) => depotDans(supabase, dossier(f.id)).ecrire("fiche.json", Buffer.from(JSON.stringify(f)), "application/json");
/** Les personnes de l'essai (les plus anciennes d'abord). */
async function lesPersonnes(supabase: Supabase): Promise<FicheEssai[]> {
  const ids = (await depotDans(supabase, RACINE).lister().catch(() => [] as string[])).filter(idValide);
  const l = (await Promise.all(ids.map((id) => lireFiche(supabase, id)))).filter((f): f is FicheEssai => f !== null);
  return l.sort((a, b) => a.le.localeCompare(b.le));
}

/** L'état de l'essai (la page de l'administrateur). */
export async function etatEssaiVisage(supabase: Supabase): Promise<EtatEssaiVisage> {
  const personnes: PersonneEssaiVue[] = await Promise.all(
    (await lesPersonnes(supabase)).map(async (f) => {
      const noms = await depotDans(supabase, dossier(f.id)).lister().catch(() => [] as string[]);
      const signe = (n: string) => (noms.includes(n) ? signer(supabase, `${dossier(f.id)}/${n}`) : Promise.resolve(""));
      const expressions: PersonneEssaiVue["expressions"] = {};
      for (const e of EXPRESSIONS_VISAGE) {
        const u = await signe(nomTete(e.cle));
        if (u) expressions[e.cle] = u;
      }
      const [figurine, tete] = await Promise.all([signe("figurine.png"), signe("tete.png")]);
      return {
        id: f.id,
        prenom: f.prenom,
        moi: f.moi,
        le: f.le,
        faites: faitesDe(noms),
        photo: noms.includes("photo.jpg"),
        expressions,
        ...(figurine ? { figurine } : {}),
        ...(tete ? { tete } : {}),
        ...(f.erreur ? { erreur: f.erreur } : {}),
      };
    }),
  );
  return { personnes, moteurs: { image: Boolean(cle()), regard: analyseConfiguree() } };
}

/** ➕ Une personne : un prénom, une photo (une adresse `data:`), son accord ; « c'est moi » (une seule à la fois). */
export async function ajouterPersonne(supabase: Supabase, x: Record<string, unknown>): Promise<{ id?: string; erreur?: string }> {
  const prenom = s(x.prenom).replace(/\s+/g, " ");
  if (!prenom || [...prenom].length > PRENOM_ESSAI_MAX) return { erreur: `Un prénom (${PRENOM_ESSAI_MAX} lettres au plus).` };
  if (motInterdit(prenom)) return { erreur: "Choisis un autre prénom." };
  if (x.accord !== true) return { erreur: "Il faut son accord." };
  const m = /^data:image\/(?:jpeg|jpg|png|webp|heic|heif);base64,(.+)$/i.exec(s(x.photo));
  const brut = m ? Buffer.from(m[1], "base64") : null;
  if (!brut?.length || brut.length > 10 * 1024 * 1024) return { erreur: "Une photo de face (10 Mo au plus)." };
  const photo = await sharp(brut)
    .rotate()
    .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toBuffer()
    .catch(() => null);
  if (!photo) return { erreur: "Cette photo ne se lit pas : essaie une autre (JPEG ou PNG)." };
  const deja = await lesPersonnes(supabase);
  if (deja.length >= PERSONNES_ESSAI_MAX) return { erreur: `${PERSONNES_ESSAI_MAX} personnes au plus : efface-en une d’abord.` };
  const id = randomBytes(6).toString("hex");
  const moi = x.moi === true;
  if (moi) for (const f of deja.filter((y) => y.moi)) await ecrireFiche(supabase, { ...f, moi: false });
  await depotDans(supabase, dossier(id)).ecrire("photo.jpg", photo, "image/jpeg");
  await ecrireFiche(supabase, { id, prenom, moi, le: new Date().toISOString(), accord: true });
  return { id };
}

/** 🙋 C'est moi : sa figurine fera ma tête (une seule personne à la fois). */
export async function choisirMoi(supabase: Supabase, id: unknown): Promise<{ erreur?: string }> {
  if (!idValide(id)) return { erreur: "Qui ?" };
  const l = await lesPersonnes(supabase);
  if (!l.some((f) => f.id === id)) return { erreur: "Qui ?" };
  for (const f of l) if (f.moi !== (f.id === id)) await ecrireFiche(supabase, { ...f, moi: f.id === id });
  return {};
}

/** 🗑️ Tout effacer d'une personne (sa photo si elle est encore là, sa figurine, ses expressions). */
export async function effacerPersonne(supabase: Supabase, id: unknown): Promise<{ erreur?: string }> {
  if (!idValide(id)) return { erreur: "Qui ?" };
  const d = depotDans(supabase, dossier(id));
  for (const n of await d.lister().catch(() => [] as string[])) await d.effacer(n).catch(() => undefined);
  return {};
}

/** ↺ Refaire : ses expressions, ou sa découpe (et donc ses expressions). La figurine reste. */
export async function refairePersonne(supabase: Supabase, id: unknown, quoi: unknown): Promise<{ erreur?: string }> {
  if (!idValide(id) || (quoi !== "expressions" && quoi !== "calques")) return { erreur: "Refaire quoi ?" };
  const d = depotDans(supabase, dossier(id));
  const noms = EXPRESSIONS_VISAGE.map((e) => nomTete(e.cle));
  // (refaire la découpe : les expressions entières restent — leurs têtes se redécoupent sans le moteur ; refaire les
  // expressions : tout est refait)
  const entieres = EXPRESSIONS_VISAGE.map((e) => nomExpression(e.cle));
  for (const n of quoi === "calques" ? ["corps.png", CORPS_SANS_TETE, "tete.png", "reperes.json", ...noms] : [...noms, ...entieres]) await d.effacer(n).catch(() => undefined);
  return {};
}

type Pixels = { data: Buffer; w: number; h: number };
const pixels = async (image: Buffer, taille?: [number, number]): Promise<Pixels> => {
  const { data, info } = await (taille ? sharp(image).resize(taille[0], taille[1], { fit: "fill" }) : sharp(image)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
};
/**
 * (où est la tête dans une autre image de la même figurine : la boîte habituelle `[x, y, l, h]` décalée de `dx`, `dy`
 * pixels et agrandie de `e` autour de son centre — là où sa silhouette, le haut de la boîte, colle le mieux à celle de la
 * tête habituelle ; d'abord à grands pas, puis au pixel près. Sans mieux net : la boîte telle quelle.)
 */
export function recaler(orig: Pixels, autre: Pixels, boite: [number, number, number, number]): { dx: number; dy: number; e: number } {
  const [x0, y0, l, h] = boite;
  const G = 40;
  const rangs = Math.max(1, Math.round(G * PART_SANS_TETE));
  const pts: { x: number; y: number; a: number }[] = [];
  for (let gy = 0; gy < rangs; gy++)
    for (let gx = 0; gx < G; gx++) {
      const x = x0 + ((gx + 0.5) / G) * l;
      const y = y0 + ((gy + 0.5) / G) * h;
      const xi = Math.min(orig.w - 1, Math.max(0, Math.round(x)));
      const yi = Math.min(orig.h - 1, Math.max(0, Math.round(y)));
      pts.push({ x, y, a: orig.data[(yi * orig.w + xi) * 4 + 3] });
    }
  const [cx, cy] = [x0 + l / 2, y0 + h / 2];
  const ecart = (dx: number, dy: number, e: number) => {
    let somme = 0;
    for (const p of pts) {
      const x = Math.round(cx + dx + (p.x - cx) * e);
      const y = Math.round(cy + dy + (p.y - cy) * e);
      const a = x < 0 || y < 0 || x >= autre.w || y >= autre.h ? 0 : autre.data[(y * autre.w + x) * 4 + 3];
      somme += Math.abs(a - p.a);
    }
    return somme / pts.length;
  };
  const pas = Math.max(1, Math.round(l / G));
  const portee = Math.max(pas, Math.round(l * 0.12));
  const tel = ecart(0, 0, 1);
  let mieux = { dx: 0, dy: 0, e: 1, v: tel };
  for (let e = 0.9; e <= 1.1001; e += 0.025)
    for (let dy = -portee; dy <= portee; dy += pas)
      for (let dx = -portee; dx <= portee; dx += pas) {
        const v = ecart(dx, dy, e);
        if (v < mieux.v) mieux = { dx, dy, e, v };
      }
  const gros = mieux;
  for (let e = gros.e - 0.0125; e <= gros.e + 0.01251; e += 0.00625)
    for (let dy = gros.dy - pas; dy <= gros.dy + pas; dy++)
      for (let dx = gros.dx - pas; dx <= gros.dx + pas; dx++) {
        const v = ecart(dx, dy, e);
        if (v < mieux.v) mieux = { dx, dy, e, v };
      }
  // (un mieux trop petit — moins de 3 points d'alpha sur 255 en moyenne : la boîte telle quelle, rien ne bouge)
  return tel - mieux.v < 3 ? { dx: 0, dy: 0, e: 1 } : { dx: mieux.dx, dy: mieux.dy, e: Math.round(mieux.e * 10000) / 10000 };
}

/**
 * La tête d'une autre image de la même figurine (l'expression entière), découpée **là où elle est vraiment** : la boîte
 * de la tête habituelle, recalée sur cette image (`recaler`), ramenée à la taille habituelle, fondue en bas.
 */
async function teteAuMemeEndroit(image: Buffer, figurine: Buffer, r: ReperesEssai): Promise<Buffer> {
  const [W, H] = r.taille;
  const [orig, autre] = await Promise.all([pixels(figurine, [W, H]), pixels(image, [W, H])]);
  const [bx, by] = r.boite;
  const [px, py, pw, ph] = r.tetePx;
  const boite: [number, number, number, number] = [bx + px, by + py, pw, ph];
  const { dx, dy, e } = recaler(orig, autre, boite);
  // (la boîte recalée, dans l'image agrandie d'une marge transparente : elle peut déborder un peu du cadre)
  const marge = Math.ceil(Math.max(pw, ph) * 0.3);
  const [lw, lh] = [Math.max(1, Math.round(pw * e)), Math.max(1, Math.round(ph * e))];
  const gauche = Math.round(boite[0] + pw / 2 + dx - lw / 2) + marge;
  const haut = Math.round(boite[1] + ph / 2 + dy - lh / 2) + marge;
  const etendue = await sharp(autre.data, { raw: { width: W, height: H, channels: 4 } })
    .extend({ top: marge, bottom: marge, left: marge, right: marge, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const { data } = await sharp(etendue)
    .extract({ left: Math.max(0, gauche), top: Math.max(0, haut), width: Math.min(lw, W + 2 * marge - Math.max(0, gauche)), height: Math.min(lh, H + 2 * marge - Math.max(0, haut)) })
    .resize(pw, ph, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let y = 0; y < ph; y++) {
    const fondu = Math.min(1, (ph - y) / 2);
    if (fondu >= 1) continue;
    for (let x = 0; x < pw; x++) data[(y * pw + x) * 4 + 3] = Math.round(data[(y * pw + x) * 4 + 3] * fondu);
  }
  return sharp(data, { raw: { width: pw, height: ph, channels: 4 } }).png().toBuffer();
}

/** Le corps sans sa tête habituelle : le haut de la boîte de la tête effacé (le cou reste, sous la tête qui penche). */
async function corpsSansTete(corps: Buffer, r: ReperesEssai): Promise<Buffer> {
  const c = await pixels(corps);
  const [px, py, pw, ph] = r.tetePx;
  const fin = Math.min(c.h, py + Math.round(ph * PART_SANS_TETE));
  for (let y = Math.max(0, py); y < fin; y++) for (let x = Math.max(0, px); x < Math.min(c.w, px + pw); x++) c.data[(y * c.w + x) * 4 + 3] = 0;
  return sharp(c.data, { raw: { width: c.w, height: c.h, channels: 4 } }).png().toBuffer();
}

/** 🛠️ Un passage : la prochaine étape qui manque. `fait` : ce qui vient d'être fait (rien : tout est fait). */
export async function fabriquerPersonne(supabase: Supabase, id: unknown, avant: number): Promise<{ fait?: EtapeEssai; erreur?: string }> {
  if (!idValide(id)) return { erreur: "Qui ?" };
  const fiche = await lireFiche(supabase, id);
  if (!fiche) return { erreur: "Qui ?" };
  const d = depotDans(supabase, dossier(id));
  const noms = await d.lister().catch(() => [] as string[]);
  const etape = ETAPES_ESSAI.find((e) => !faitesDe(noms).includes(e));
  if (!etape) return {};
  const qui = await prendre(d);
  if (!qui) return { erreur: "Un passage est déjà en train pour cette personne : patiente une minute." };
  const rater = async (erreur: string) => {
    await ecrireFiche(supabase, { ...fiche, erreur });
    return { erreur };
  };
  try {
    if (etape === "figurine") {
      if (!cle()) return { erreur: "Le moteur d’image n’est pas branché ici." };
      const photo = await d.lire("photo.jpg");
      if (!photo) return rater("La photo n’est plus là : efface cette personne et ajoute-la de nouveau.");
      const traits = analyseConfiguree() ? await decrireTraits(photo).catch(() => null) : null;
      const r = await demanderUneImage({ images: [photo], consigne: consigneSculptee(traits), transparent: true, fidelite: "high", avant, cle: cle(), base: base(), qualite: "high" });
      if ("erreur" in r) return rater(r.erreur);
      await d.ecrire("figurine.png", await sharp(r.png).png().toBuffer(), "image/png");
      // (la photo ne sert plus : elle s'efface)
      await d.effacer("photo.jpg").catch(() => undefined);
    } else {
      const figurine = await d.lire("figurine.png");
      if (!figurine) return rater("Sa figurine n’est plus là.");
      if (etape === "calques") {
        const c = await decouperFigurine(figurine).catch(() => null);
        if (!c) return rater("Sa figurine n’a pas pu être découpée.");
        const m = await sharp(figurine).metadata();
        const r: ReperesEssai = { ratio: c.ratio, reperes: c.reperes, boite: c.boite, tetePx: c.tetePx, taille: [m.width ?? 0, m.height ?? 0] };
        await d.ecrire("corps.png", c.corps, "image/png");
        await d.ecrire(CORPS_SANS_TETE, await corpsSansTete(c.corps, r), "image/png");
        await d.ecrire("tete.png", c.tete, "image/png");
        await d.ecrire("reperes.json", Buffer.from(JSON.stringify(r)), "application/json");
      } else {
        const r = json(await d.lire("reperes.json").catch(() => null)) as unknown as ReperesEssai;
        if (!Array.isArray(r.boite) || !Array.isArray(r.tetePx) || !Array.isArray(r.taille) || !r.reperes) return rater("Sa découpe est à refaire.");
        // (l'expression entière déjà faite — une découpe refaite : sa tête se redécoupe, sans le moteur)
        let entiere = noms.includes(nomExpression(etape)) ? await d.lire(nomExpression(etape)).catch(() => null) : null;
        if (!entiere) {
          if (!cle()) return { erreur: "Le moteur d’image n’est pas branché ici." };
          const img = await demanderUneImage({ images: [figurine], consigne: consigneExpression(etape), transparent: true, fidelite: "high", avant, cle: cle(), base: base(), qualite: "medium" });
          if ("erreur" in img) return rater(img.erreur);
          entiere = await sharp(img.png).png().toBuffer();
          await d.ecrire(nomExpression(etape), entiere, "image/png");
        }
        await d.ecrire(nomTete(etape), await teteAuMemeEndroit(entiere, figurine, r), "image/png");
      }
    }
    if (fiche.erreur) await ecrireFiche(supabase, { ...fiche, erreur: undefined } as FicheEssai);
    return { fait: etape };
  } finally {
    await rendre(d, qui);
  }
}

/** Le décor du salon d'essai : la salle de cinéma si elle est validée, sinon le premier gradin validé. */
async function decorDEssai(supabase: Supabase) {
  for (const t of ["series", "humour", "foot", "musique", "jeux", "cuisine", "mode", "animaux", "manga", "revisions", "parents"] as IdTheme[]) {
    const g = await gradinDuSalon(supabase, t).catch(() => null);
    if (g) return g;
  }
  return null;
}

/**
 * 🎬 LE SALON D'ESSAI : les figurines prêtes (leur découpe faite ; leurs expressions faites, une à une), « moi » d'abord
 * (au premier rang, au milieu) ; le décor ; une vidéo pour commencer (la première de l'humour du jour, s'il y en a une).
 */
export async function salonEssai(supabase: Supabase): Promise<SalonEssai> {
  const fiches = await lesPersonnes(supabase);
  const figurines = (
    await Promise.all(
      fiches.map(async (f): Promise<FigurineEssai | null> => {
        const d = depotDans(supabase, dossier(f.id));
        const noms = await d.lister().catch(() => [] as string[]);
        if (!noms.includes("reperes.json") || !noms.includes("corps.png") || !noms.includes("tete.png")) return null;
        const r = json(await d.lire("reperes.json").catch(() => null)) as unknown as ReperesEssai;
        if (!r.reperes || !Array.isArray(r.reperes.tete)) return null;
        // (le corps sans sa tête : fait ici pour les figurines découpées avant le 21 novembre)
        let sansTete = noms.includes(CORPS_SANS_TETE);
        if (!sansTete && Array.isArray(r.tetePx)) {
          const c = await d.lire("corps.png").catch(() => null);
          sansTete = Boolean(c && (await d.ecrire(CORPS_SANS_TETE, await corpsSansTete(c, r), "image/png").catch(() => false)));
        }
        const [corps, tete] = await Promise.all([imageSalon(supabase, `${dossier(f.id)}/${sansTete ? CORPS_SANS_TETE : "corps.png"}`, LARGEURS_CALQUES.corps), imageSalon(supabase, `${dossier(f.id)}/tete.png`, LARGEURS_CALQUES.tete)]);
        if (!corps || !tete) return null;
        const expressions: FigurineEssai["expressions"] = {};
        for (const e of EXPRESSIONS_VISAGE)
          if (noms.includes(nomTete(e.cle))) {
            const img = await imageSalon(supabase, `${dossier(f.id)}/${nomTete(e.cle)}`, LARGEURS_CALQUES.tete).catch(() => null);
            if (img) expressions[e.cle] = img;
          }
        return { id: f.id, prenom: f.prenom, moi: f.moi, corps, ratio: r.ratio, tete: { image: tete, boite: r.reperes.tete, pivot: r.reperes.pivot }, expressions };
      }),
    )
  ).filter((x): x is FigurineEssai => x !== null);
  const [gradin, selection] = await Promise.all([decorDEssai(supabase), lireSelection(supabase, jourParis(), "humour", false).catch(() => null)]);
  return {
    figurines: [...figurines.filter((x) => x.moi), ...figurines.filter((x) => !x.moi)],
    gradin,
    places: gradin?.places ?? [...PLAN_GRADIN],
    video: selection?.videos?.[0]?.id ?? null,
  };
}
