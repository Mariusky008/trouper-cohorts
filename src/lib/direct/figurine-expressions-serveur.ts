/**
 * 🎭 SES EXPRESSIONS, FAITES PAR LE MOTEUR D'IMAGE — 4 novembre 2026 : « les émotions devaient être réelles, avec des
 * expressions du visage de la figurine, et pas un décor ». À partir de SA figurine (bouche fermée), le moteur d'OpenAI
 * en fidélité haute (celui qui recopie le visage) fait, pour chaque sentiment (`SENTIMENTS`), son visage bouche
 * fermée (`<sentiment>-n`) ; puis, à partir de celle-ci, la même bouche ouverte (`<sentiment>-p`), pour qu'elle
 * parle sans que rien d'autre ne bouge. Huit images, une seule fois par figurine.
 *
 * EN DEUX TOURS, pour tenir dans le temps d'une requête : d'abord les visages qui manquent (en même temps), puis leurs
 * bouches ouvertes. La page rappelle tant qu'il en manque (`fabriquerUnTour`).
 *
 * LE CADRE NE BOUGE PAS : l'image est posée au format du moteur (2:3, 1024 × 1536), complétée par la couleur de ses
 * bords, puis chaque image rendue est remise exactement dans le cadre d'origine — sinon, en passant d'une expression à
 * l'autre, la figurine sauterait.
 *
 * FICHIER SERVEUR. Le stockage est donné par l'appelant (`Depot`) : la figurine d'un client (seau privé) ou celle de la
 * démonstration.
 */
import sharp from "sharp";
import { moteurRefuse, moteursDImage, noterRefus } from "./moteur-image";
import { SENTIMENTS, type Expressions, type Sentiment } from "./ma-figurine";

const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const L = 1024;
const H = 1536;

/** Ce que l'appelant sait faire de ses fichiers (des noms courts : « joie-n.webp », « verrou.json »). */
export type Depot = {
  lister: () => Promise<string[]>;
  lire: (nom: string) => Promise<Buffer | null>;
  ecrire: (nom: string, octets: Buffer, type: string) => Promise<boolean>;
  effacer: (nom: string) => Promise<void>;
};

/** Le visage de chaque sentiment, en anglais (c'est là que le moteur est le plus précis). */
const VISAGES: Record<Sentiment, string> = {
  joie: "radiant JOY: a big warm smile, cheeks raised, eyes slightly squinting with happiness, eyebrows relaxed and lifted",
  colere: "clear ANGER: eyebrows sharply lowered and drawn together into a deep frown, eyes narrowed and fierce, nostrils flared, lips pressed tight — a funny cartoon anger, but unmistakable",
  tristesse: "deep SADNESS: inner eyebrows raised, eyes glossy and looking slightly down, the corners of the mouth turned down in a pout",
  euphorie: "EUPHORIA: eyes wide open and sparkling, eyebrows very high, a huge open-mouthed grin of pure excitement",
};

const GARDER =
  "Keep EVERYTHING ELSE EXACTLY IDENTICAL: the same person and identity, the same face shape, the same hair, the same outfit and accessories, the same pose and arms, " +
  "the same spring and base, the same rendering style and materials, the same lighting, the same background, the same camera framing: the figurine stays at exactly the same place and size in the image. " +
  "No text, nothing added.";

const consigneVisage = (x: Sentiment) =>
  `This is a collectible bobblehead figurine. Change ONLY its facial expression to ${VISAGES[x]}. The expression must be strong and readable at a glance, on THIS face (it must still be clearly the same person). ${GARDER}`;
const consigneBouche = (x: Sentiment) =>
  `This is a collectible bobblehead figurine with a ${x === "colere" ? "angry" : x === "tristesse" ? "sad" : x === "euphorie" ? "euphoric" : "joyful"} expression. ` +
  `Change ONLY its mouth: open it as if the figurine is in the middle of saying a word, keeping the same expression on the rest of the face (eyes, eyebrows, cheeks). ${GARDER}`;

// ─── le cadre ───────────────────────────────────────────────────────────────────────────────────
type Cadre = { left: number; top: number; width: number; height: number; w0: number; h0: number };

/** La couleur des bords (la moyenne des quatre coins), pour compléter l'image au format du moteur. */
async function couleurDesBords(img: Buffer): Promise<{ r: number; g: number; b: number }> {
  const { data, info } = await sharp(img).removeAlpha().resize(32, 32, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  const px = (x: number, y: number) => (y * info.width + x) * info.channels;
  const coins = [px(0, 0), px(31, 0), px(0, 31), px(31, 31)];
  const moy = (k: number) => Math.round(coins.reduce((n, i) => n + data[i + k], 0) / coins.length);
  return { r: moy(0), g: moy(1), b: moy(2) };
}

/** Sa figurine posée au format 2:3 du moteur ; et où elle se trouve dedans (pour l'y reprendre). */
export async function poserAuFormat(src: Buffer): Promise<{ png: Buffer; cadre: Cadre }> {
  const img = await sharp(src).rotate().flatten({ background: await couleurDesBords(src) }).png().toBuffer();
  const m = await sharp(img).metadata();
  const w0 = m.width ?? L;
  const h0 = m.height ?? H;
  const k = Math.min(L / w0, H / h0);
  const width = Math.max(1, Math.round(w0 * k));
  const height = Math.max(1, Math.round(h0 * k));
  const left = Math.floor((L - width) / 2);
  const top = Math.floor((H - height) / 2);
  const fond = await couleurDesBords(img);
  const png = await sharp(img)
    .resize(width, height)
    .extend({ left, top, right: L - width - left, bottom: H - height - top, background: fond })
    .png()
    .toBuffer();
  return { png, cadre: { left, top, width, height, w0, h0 } };
}

/** L'image rendue, remise dans le cadre d'origine, en WebP (900 px de large au plus). */
async function reprendre(rendu: Buffer, cadre: Cadre): Promise<Buffer> {
  const plein = await sharp(rendu).resize(L, H, { fit: "fill" }).png().toBuffer();
  return sharp(plein)
    .extract({ left: cadre.left, top: cadre.top, width: cadre.width, height: cadre.height })
    .resize({ width: Math.min(900, cadre.w0), withoutEnlargement: false })
    .webp({ quality: 88 })
    .toBuffer();
}

// ─── le moteur ──────────────────────────────────────────────────────────────────────────────────
/** Une image demandée au moteur, à partir d'une image (fidélité haute, format 2:3). */
async function editer(image: Buffer, consigne: string, avant: number): Promise<Buffer | { erreur: string }> {
  const cle = s(process.env.OPENAI_API_KEY);
  if (!cle) return { erreur: "Le moteur d'image n'est pas branché ici." };
  const base = s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
  const { liste } = await moteursDImage(cle, base);
  let derniere = "Le moteur d'image n'a pas répondu.";
  for (let m = 0; m < liste.length; m++) {
    const reglages: Record<string, string> = { size: `${L}x${H}`, quality: s(process.env.FIGURINE_QUALITE) || "high", input_fidelity: "high", output_format: "png" };
    for (let essai = 0; essai < 4; essai++) {
      const reste = avant - Date.now();
      if (reste < 15_000) return { erreur: "Le temps de la requête est passé." };
      const forme = new FormData();
      forme.append("model", liste[m]);
      forme.append("prompt", consigne);
      forme.append("n", "1");
      for (const [k, v] of Object.entries(reglages)) forme.append(k, v);
      forme.append("image[]", new File([new Uint8Array(image)], "figurine.png", { type: "image/png" }));
      let r: Response;
      try {
        r = await fetch(`${base}/v1/images/edits`, { method: "POST", headers: { authorization: `Bearer ${cle}` }, body: forme, signal: AbortSignal.timeout(reste - 8_000) });
      } catch {
        return { erreur: "Le moteur d'image a mis trop de temps." };
      }
      if (r.ok) {
        const b64 = ((await r.json().catch(() => null)) as { data?: { b64_json?: string }[] } | null)?.data?.[0]?.b64_json;
        return b64 ? Buffer.from(b64, "base64") : { erreur: "Le moteur d'image n'a pas rendu d'image." };
      }
      const txt = await r.text().catch(() => "");
      derniere = `Le moteur d'image a répondu ${r.status}.`;
      if (r.status === 400) {
        // un réglage inconnu de ce moteur : on le retire et on rejoue
        const inconnus = Object.keys(reglages).filter((k) => new RegExp(`(unknown|unsupported|unrecognized|not supported|invalid)[^.]{0,60}${k}|${k}[^.]{0,60}(unknown|unsupported|not supported|invalid)`, "i").test(txt));
        if (inconnus.length) {
          for (const k of inconnus) delete reglages[k];
          continue;
        }
      }
      if (m < liste.length - 1 && moteurRefuse(r.status, txt)) {
        noterRefus(liste[m]);
        break;
      }
      console.error("[expressions] refus du moteur", JSON.stringify({ modele: liste[m], statut: r.status, pourquoi: txt.slice(0, 300) }));
      return { erreur: derniere };
    }
  }
  return { erreur: derniere };
}

// ─── un tour ────────────────────────────────────────────────────────────────────────────────────
const VERROU = "verrou.json";
const DUREE_VERROU = 4 * 60_000;

/** Les expressions présentes dans le dépôt : { joie: { n: "joie-n.webp", p: "joie-p.webp" }, … } (des noms). */
export function expressionsDe(noms: string[]): Expressions {
  const e: Expressions = {};
  for (const { cle } of SENTIMENTS) if (noms.includes(`${cle}-n.webp`) && noms.includes(`${cle}-p.webp`)) e[cle] = { n: `${cle}-n.webp`, p: `${cle}-p.webp` };
  return e;
}
export const expressionsCompletes = (e: Expressions) => SENTIMENTS.every(({ cle }) => Boolean(e[cle]));

/**
 * UN TOUR DE FABRICATION : les visages qui manquent (bouche fermée), sinon leurs bouches ouvertes. Un verrou (quatre
 * minutes) empêche deux tours en même temps — deux pages ouvertes ne paient pas deux fois. Rend où l'on en est.
 */
export async function fabriquerUnTour(depot: Depot, source: Buffer, avant: number): Promise<{ complete: boolean; enCours?: boolean; erreur?: string }> {
  let noms = await depot.lister();
  if (expressionsCompletes(expressionsDe(noms))) return { complete: true };
  if (noms.includes(VERROU)) {
    const v = await depot.lire(VERROU);
    const le = Number((JSON.parse(v?.toString() || "{}") as { le?: number }).le) || 0;
    if (Date.now() - le < DUREE_VERROU) return { complete: false, enCours: true };
  }
  await depot.ecrire(VERROU, Buffer.from(JSON.stringify({ le: Date.now() })), "application/json");
  try {
    const visages = SENTIMENTS.map((x) => x.cle).filter((x) => !noms.includes(`${x}-n.webp`));
    const erreurs: string[] = [];
    if (visages.length) {
      const { png, cadre } = await poserAuFormat(source);
      await Promise.all(
        visages.map(async (x) => {
          const r = await editer(png, consigneVisage(x), avant);
          if (!Buffer.isBuffer(r)) return void erreurs.push(r.erreur);
          await depot.ecrire(`${x}-n.webp`, await reprendre(r, cadre), "image/webp");
        }),
      );
    } else {
      const bouches = SENTIMENTS.map((x) => x.cle).filter((x) => !noms.includes(`${x}-p.webp`));
      await Promise.all(
        bouches.map(async (x) => {
          const visage = await depot.lire(`${x}-n.webp`);
          if (!visage) return void erreurs.push("visage introuvable");
          const { png, cadre } = await poserAuFormat(visage);
          const r = await editer(png, consigneBouche(x), avant);
          if (!Buffer.isBuffer(r)) return void erreurs.push(r.erreur);
          await depot.ecrire(`${x}-p.webp`, await reprendre(r, cadre), "image/webp");
        }),
      );
    }
    noms = await depot.lister();
    return { complete: expressionsCompletes(expressionsDe(noms)), ...(erreurs.length ? { erreur: erreurs[0] } : {}) };
  } finally {
    await depot.effacer(VERROU);
  }
}
