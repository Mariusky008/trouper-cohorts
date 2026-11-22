/**
 * 📷 LES CINQ EXPRESSIONS DE CHAQUE FIGURINE, LE SERVEUR (le lot V1 ; `docs/univers/decouvrir.md`, sections 28.2 et
 * 28.6 ; l'essai du lot V0 : `visage-essai-serveur.ts`, qui se sert des mêmes outils).
 *
 * Pour chaque habitant qui a sa figurine assise du nouveau style : 😊 le sourire, 😂 le rire, 😮 la surprise, 😑 le bof,
 * 😝 la grimace — **la tête seulement**. Chacune est faite par le moteur sur la figurine entière (« la tête exactement à
 * la même place, de la même taille, sous le même angle : seul le visage change ») ; sa tête y est découpée là où elle
 * est vraiment (`recaler`), au cadrage de la tête habituelle (ses calques, le lot S1). Posée sur **le corps sans sa tête**
 * (le haut de la boîte de la tête effacé, le cou reste), elle remplace le visage sans que rien ne se double.
 *
 * **Quand** : après « C'est moi ! », avec ses calques (`/api/direct/nouvelle-figurine`, action `valider`) ; s'il en
 * manque, à l'ouverture de l'appli (le `GET` de `/api/direct/ma-figurine`, après la réponse) et la nuit, par petits
 * paquets (`/api/cron/expressions-figurines`). Un passage raté se reprend, pas avant une demi-heure. Une nouvelle image de
 * sa figurine (une autre empreinte, comme ses calques) : elles se refont.
 *
 * **Rangées à côté de ses calques** (`<habitant>/calques/`) : `<empreinte>-expression-<e>.png` (l'expression entière,
 * telle que le moteur l'a faite : sa tête s'y redécoupe sans repasser par le moteur), `<empreinte>-tete-<e>.png` (sa
 * tête), `<empreinte>-corps-sans-tete.png`, et `<empreinte>-expressions.json` (leurs adresses stables, publiées une fois
 * en WebP par `imageSalon`). Un seul passage à la fois par habitant (`<habitant>/expressions-verrou/`).
 *
 * FICHIER SERVEUR.
 */
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { DECOUPE_TETE, PART_SANS_TETE, boiteDuCorps, calquesDeFigurine, cheminFigurineAssise, corpsSansTete, empreinteDe } from "./calques-figurine-serveur";
import { LARGEURS_CALQUES } from "./figurine-calques";
import { depotDans, telecharger } from "./ma-figurine-serveur";
import { demanderUneImage } from "./moteur-images-serveur";
import { consigneVisageAssiseLibre } from "./perso-consignes";
import { prendre, rendre } from "./pieces-duo-serveur";
import { imageSalon } from "./salon-fichiers-serveur";
import { EXPRESSIONS_VISAGE, type ExpressionVisage } from "./visage-essai";
import { RATTRAPAGE_EXPRESSIONS, type EtatExpressionsHabitants, type ExpressionsFigurine, type ExpressionsHabitantVue, type FigurineVivante } from "./expressions-figurine";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cle = () => s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";

// ═══ LES OUTILS (communs à l'essai du lot V0 et aux figurines des habitants) ═══

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

// (la part de la tête effacée du corps, et le corps sans sa tête : `calques-figurine-serveur.ts`, une seule règle — la
// messagerie s'en sert aussi depuis le 22 novembre 2026)
export { PART_SANS_TETE, corpsSansTete };

/**
 * Le cadrage d'une figurine, en pixels de son image : `boite`, où le corps y est découpé ; `tetePx`, la tête dans le
 * corps ; `taille`, la taille de l'image.
 */
export type Cadrage = { boite: [number, number, number, number]; tetePx: [number, number, number, number]; taille: [number, number] };

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
export async function teteAuMemeEndroit(image: Buffer, figurine: Buffer, r: Cadrage): Promise<Buffer> {
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

// ═══ LES EXPRESSIONS DES HABITANTS (le lot V1) ═══

const dossier = (h: string) => `${h}/calques`;
const NOMS = {
  etat: (k: string) => `${k}-expressions.json`,
  entiere: (k: string, e: ExpressionVisage) => `${k}-expression-${e}.png`,
  tete: (k: string, e: ExpressionVisage) => `${k}-tete-${e}.png`,
  sansTete: (k: string) => `${k}-corps-sans-tete.png`,
};
const lesCinq = EXPRESSIONS_VISAGE.map((x) => x.cle);

async function lireEtat(supabase: Supabase, h: string, k: string): Promise<ExpressionsFigurine> {
  const b = await depotDans(supabase, dossier(h))
    .lire(NOMS.etat(k))
    .catch(() => null);
  let o: Partial<ExpressionsFigurine> = {};
  try {
    o = JSON.parse(b?.toString() || "{}") as Partial<ExpressionsFigurine>;
  } catch {
    o = {};
  }
  if (o.empreinte !== k) return { empreinte: k, tetes: {} };
  const tetes: ExpressionsFigurine["tetes"] = {};
  for (const e of lesCinq) if (s(o.tetes?.[e])) tetes[e] = s(o.tetes?.[e]);
  return { empreinte: k, tetes, ...(s(o.corpsSansTete) ? { corpsSansTete: s(o.corpsSansTete) } : {}), ...(s(o.le) ? { le: s(o.le) } : {}), ...(s(o.rate) ? { rate: s(o.rate) } : {}), ...(s(o.erreur) ? { erreur: s(o.erreur) } : {}), ...(Number(o.decoupe) > 1 ? { decoupe: Number(o.decoupe) } : {}) };
}
/** (les cinq et le corps sans sa tête, découpés sur des calques de la règle d'aujourd'hui) */
const complet = (e: ExpressionsFigurine) => Boolean(e.corpsSansTete) && lesCinq.every((x) => e.tetes[x]) && (e.decoupe ?? 1) === DECOUPE_TETE;
/** (🧍 22 novembre 2026 : découpées sur ces calques-là — la même règle de découpe de la tête) */
const memeDecoupe = (e: ExpressionsFigurine, c: { decoupe?: number }) => (e.decoupe ?? 1) === (c.decoupe ?? 1);
const enPause = (e: ExpressionsFigurine) => Boolean(e.rate) && Date.now() - Date.parse(e.rate ?? "") < RATTRAPAGE_EXPRESSIONS.recommencerApres;

/**
 * 📷 Ses expressions, pour son image d'aujourd'hui (rien : pas de figurine assise du nouveau style). `completes` : les
 * cinq et le corps sans sa tête sont prêts.
 */
export async function sesExpressions(supabase: Supabase, h: string): Promise<{ etat: ExpressionsFigurine; completes: boolean } | null> {
  const chemin = await cheminFigurineAssise(supabase, h);
  if (!chemin) return null;
  const etat = await lireEtat(supabase, h, empreinteDe(chemin));
  return { etat, completes: complet(etat) };
}

/**
 * 📷 SA FIGURINE VIVANTE (le lot V2) : ses calques et ses cinq expressions, s'ils sont prêts pour son image d'aujourd'hui
 * (rien n'est fabriqué ici) ; sinon `null` — elle s'affiche alors comme avant, d'une seule image.
 */
export async function figurineVivante(supabase: Supabase, h: string): Promise<FigurineVivante | null> {
  const chemin = await cheminFigurineAssise(supabase, h);
  if (!chemin) return null;
  const [calques, etat] = await Promise.all([calquesDeFigurine(supabase, h, { fabriquer: false }).catch(() => null), lireEtat(supabase, h, empreinteDe(chemin))]);
  if (!calques || !etat.corpsSansTete || !lesCinq.every((x) => etat.tetes[x]) || !memeDecoupe(etat, calques)) return null;
  const e = etat.tetes as Record<ExpressionVisage, string>;
  return { ratio: calques.ratio, corps: etat.corpsSansTete, tete: { src: calques.tete.fichier, boite: calques.tete.boite, pivot: calques.tete.pivot }, expressions: { sourire: e.sourire, rire: e.rire, surprise: e.surprise, bof: e.bof, grimace: e.grimace } };
}

export type PassageExpressions = { faites: ExpressionVisage[]; manquent: ExpressionVisage[]; rien?: "sans-figurine" | "deja" | "en-pause" | "en-cours"; erreur?: string };

/**
 * 🛠️ Ce qui manque de ses expressions (le corps sans sa tête, puis les expressions qui manquent, toutes à la fois), avant
 * `avant`. `force` : même si le dernier passage a raté il y a moins d'une demi-heure.
 */
export async function fabriquerExpressionsDeTete(supabase: Supabase, h: string, o: { avant: number; force?: boolean }): Promise<PassageExpressions> {
  const chemin = await cheminFigurineAssise(supabase, h);
  if (!chemin) return { faites: [], manquent: [], rien: "sans-figurine" };
  const k = empreinteDe(chemin);
  const avantTout = await lireEtat(supabase, h, k);
  if (complet(avantTout)) return { faites: [], manquent: [], rien: "deja" };
  if (!o.force && enPause(avantTout)) return { faites: [], manquent: lesCinq.filter((e) => !avantTout.tetes[e]), rien: "en-pause" };
  const verrou = depotDans(supabase, `${h}/expressions-verrou`);
  const qui = await prendre(verrou);
  if (!qui) return { faites: [], manquent: lesCinq.filter((e) => !avantTout.tetes[e]), rien: "en-cours" };
  const d = depotDans(supabase, dossier(h));
  try {
    // (relue sous le verrou : un autre passage vient peut-être de finir)
    const etat = await lireEtat(supabase, h, k);
    if (complet(etat)) return { faites: [], manquent: [], rien: "deja" };
    const ecrire = (x: ExpressionsFigurine) => d.ecrire(NOMS.etat(k), Buffer.from(JSON.stringify(x)), "application/json");
    const rater = async (erreur: string, faites: ExpressionVisage[] = []) => {
      await ecrire({ ...etat, rate: new Date().toISOString(), erreur });
      return { faites, manquent: lesCinq.filter((e) => !etat.tetes[e]), erreur };
    };
    // (ses calques d'abord — faits ici s'ils ne le sont pas encore : le cadrage de sa tête habituelle)
    const calques = await calquesDeFigurine(supabase, h).catch(() => null);
    if (!calques?.sources) return rater("Ses calques ne sont pas prêts.");
    // (🧍 22 novembre 2026 : sa tête a été refaite dans une boîte plus juste — ses expressions et son corps sans tête se
    // redécoupent à la nouvelle boîte, d'après les expressions entières déjà faites : sans le moteur)
    if (!memeDecoupe(etat, calques)) {
      etat.tetes = {};
      delete etat.corpsSansTete;
    }
    etat.decoupe = calques.decoupe ?? 1;
    const [figurine, corps] = await Promise.all([telecharger(supabase, chemin), telecharger(supabase, calques.sources.corps)]);
    if (!figurine || !corps) return rater("Sa figurine est introuvable.");
    const [boite, m] = await Promise.all([boiteDuCorps(figurine), sharp(figurine).metadata()]);
    if (!boite || !m.width || !m.height) return rater("Sa figurine n’a pas pu être relue.");
    const [tx, ty, tw, th] = calques.tete.boite;
    const r: Cadrage = { boite, tetePx: [Math.round(tx * boite[2]), Math.round(ty * boite[3]), Math.max(1, Math.round(tw * boite[2])), Math.max(1, Math.round(th * boite[3]))], taille: [m.width, m.height] };
    // (le corps sans sa tête : sans le moteur)
    if (!etat.corpsSansTete) {
      await d.ecrire(NOMS.sansTete(k), await corpsSansTete(corps, r), "image/png");
      const img = await imageSalon(supabase, `${dossier(h)}/${NOMS.sansTete(k)}`, LARGEURS_CALQUES.corps).catch(() => null);
      if (!img) return rater("Son corps sans sa tête n’a pas pu être publié.");
      etat.corpsSansTete = img.src;
    }
    // (les expressions qui manquent, toutes à la fois : une expression entière déjà faite se redécoupe sans le moteur)
    const manquent = lesCinq.filter((e) => !etat.tetes[e]);
    const rendus = await Promise.all(
      manquent.map(async (e): Promise<{ e: ExpressionVisage; src?: string; erreur?: string }> => {
        try {
          let entiere = await d.lire(NOMS.entiere(k, e)).catch(() => null);
          if (!entiere) {
            if (!cle()) return { e, erreur: "Le moteur d’image n’est pas branché ici." };
            const img = await demanderUneImage({ images: [figurine], consigne: consigneExpression(e), transparent: true, fidelite: "high", avant: o.avant, cle: cle(), base: base(), qualite: "medium" });
            if ("erreur" in img) return { e, erreur: img.erreur };
            entiere = await sharp(img.png).png().toBuffer();
            await d.ecrire(NOMS.entiere(k, e), entiere, "image/png");
          }
          await d.ecrire(NOMS.tete(k, e), await teteAuMemeEndroit(entiere, figurine, r), "image/png");
          const pub = await imageSalon(supabase, `${dossier(h)}/${NOMS.tete(k, e)}`, LARGEURS_CALQUES.tete);
          return pub ? { e, src: pub.src } : { e, erreur: "Sa tête n’a pas pu être publiée." };
        } catch {
          return { e, erreur: "Ça n’a pas marché." };
        }
      }),
    );
    for (const x of rendus) if (x.src) etat.tetes[x.e] = x.src;
    const faites = rendus.filter((x) => x.src).map((x) => x.e);
    const rate = rendus.find((x) => x.erreur);
    if (rate?.erreur) return rater(rate.erreur, faites);
    await ecrire({ empreinte: k, tetes: etat.tetes, corpsSansTete: etat.corpsSansTete, le: new Date().toISOString(), ...(etat.decoupe && etat.decoupe > 1 ? { decoupe: etat.decoupe } : {}) });
    return { faites, manquent: [] };
  } catch {
    await d
      .ecrire(NOMS.etat(k), Buffer.from(JSON.stringify({ ...avantTout, rate: new Date().toISOString(), erreur: "Ça n’a pas marché." })), "application/json")
      .catch(() => false);
    return { faites: [], manquent: lesCinq.filter((e) => !avantTout.tetes[e]), erreur: "Ça n’a pas marché." };
  } finally {
    await rendre(verrou, qui);
  }
}

/** Les habitants dont la figurine de l'appli est prête (le pont posé), les plus récents d'abord. */
async function figurinesPretes(supabase: Supabase, n: number): Promise<{ h: string; prenom: string; le: string }[]> {
  const { data } = await supabase.from("clik_ma_figurine").select("habitant_id, prenom, prete_le, updated_at").not("prete_le", "is", null).order("updated_at", { ascending: false }).limit(n);
  return ((Array.isArray(data) ? data : []) as Record<string, unknown>[]).map((x) => ({ h: s(x.habitant_id), prenom: s(x.prenom), le: s(x.updated_at) || s(x.prete_le) })).filter((x) => /^[0-9a-f-]{36}$/i.test(x.h));
}

/** (quelques-unes à la fois : relire mille fiches une à une prendrait toute la nuit) */
async function parPaquets<T, R>(l: T[], n: number, f: (x: T) => Promise<R>): Promise<R[]> {
  const r: R[] = [];
  for (let i = 0; i < l.length; i += n) r.push(...(await Promise.all(l.slice(i, i + n).map(f))));
  return r;
}

/**
 * 🌙 LE RATTRAPAGE (la nuit, ou « Rattraper maintenant » sur la page de l'administrateur) : les figurines prêtes dont il
 * manque des expressions (relues vingt-cinq à la fois), deux à la fois, tant qu'il reste le temps d'une figurine avant
 * `fin` — huit au plus par défaut. Celles en pause (un passage raté il y a moins d'une demi-heure) attendent.
 */
export async function rattraperLesExpressions(supabase: Supabase, o: { fin: number; max?: number }): Promise<{ vues: number; rattrapees: number; ratees: number; restent: number }> {
  const max = o.max ?? RATTRAPAGE_EXPRESSIONS.parNuit;
  const gens = await figurinesPretes(supabase, 1000);
  const etats = await parPaquets(gens, 25, async ({ h }) => ({ h, x: await sesExpressions(supabase, h).catch(() => null) }));
  const aFaire = etats.filter((e) => e.x && !e.x.completes);
  const file = aFaire.filter((e) => !enPause(e.x!.etat)).map((e) => e.h);
  let [rattrapees, ratees, prises] = [0, 0, 0];
  const ouvrier = async () => {
    while (file.length && prises < max && o.fin - Date.now() >= RATTRAPAGE_EXPRESSIONS.tempsParFigurine) {
      const h = file.shift()!;
      prises += 1;
      const p = await fabriquerExpressionsDeTete(supabase, h, { avant: o.fin - 5_000 }).catch(() => ({ erreur: "Ça n’a pas marché." }) as PassageExpressions);
      if (p.erreur) ratees += 1;
      else if (!p.rien) rattrapees += 1;
    }
  };
  await Promise.all([ouvrier(), ouvrier()]);
  return { vues: aFaire.length, rattrapees, ratees, restent: aFaire.length - rattrapees };
}

/** (la page de l'administrateur) où en sont les expressions des habitants : les comptes, et les dernières figurines. */
export async function etatExpressionsHabitants(supabase: Supabase): Promise<EtatExpressionsHabitants> {
  const gens = await figurinesPretes(supabase, 300);
  const vus = (await parPaquets(gens, 25, async (g) => ({ g, x: await sesExpressions(supabase, g.h).catch(() => null) }))).filter((v) => v.x !== null);
  const dernieres: ExpressionsHabitantVue[] = vus.slice(0, 8).map(({ g, x }) => ({ prenom: g.prenom || "Quelqu’un", le: x?.etat.le ?? g.le, empreinte: x?.etat.empreinte ?? "", tetes: x?.etat.tetes ?? {}, ...(x?.etat.erreur && !x.completes ? { erreur: x.etat.erreur } : {}) }));
  return {
    total: vus.length,
    pretes: vus.filter((v) => v.x?.completes).length,
    ratees: vus.filter((v) => !v.x?.completes && v.x?.etat.rate).length,
    enCours: vus.filter((v) => !v.x?.completes && !v.x?.etat.rate).length,
    dernieres,
  };
}
