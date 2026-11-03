/**
 * 🪀 SA FIGURINE, CÔTÉ SERVEUR — voir `figurine-pro.ts` pour la règle.
 *
 * LE MOTEUR : celui de l'essayage (`moteur-image.ts`), le plus proche de ChatGPT que le compte peut appeler, avec ses
 * replis : un modèle refusé fait passer au suivant ; un réglage inconnu est retiré et la demande rejouée. On demande
 * un FOND TRANSPARENT ; un moteur qui ne sait pas le faire rend un fond vert uni, que `detourerSurFondUni` retire.
 *
 * LE STOCKAGE : un seau public à elle, `figurines-pros` (elle passe dans des vidéos publiques), créé au premier dépôt.
 * Une adresse impossible à deviner par image. Son état (`<site>/etat.json`) : celle qu'il a validée, celle qui attend
 * son « C'est moi », ses essais du jour. SON SELFIE N'Y VA JAMAIS : il sert à la fabrication, puis il est oublié.
 *
 * FICHIER SERVEUR.
 */
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { FamilleDouble } from "./double-metiers";
import { ESSAIS_PAR_JOUR, consigneFigurine, jourDe, type EtatFigurinePro } from "./figurine-pro";
import { moteurRefuse, moteursDImage, noterRefus } from "./moteur-image";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

export const SEAU_FIGURINES_PROS = s(process.env.FIGURINES_PROS_BUCKET) || "figurines-pros";
const essaisParJour = () => Math.max(1, Number(s(process.env.FIGURINE_ESSAIS_PAR_JOUR)) || ESSAIS_PAR_JOUR);

type Etat = {
  validee?: { chemin: string; le: string } | null;
  proposee?: { chemin: string; le: string; modele: string } | null;
  essais?: { jour: string; n: number };
};

// ─── le stockage ────────────────────────────────────────────────────────────────────────────────

async function seauPret(supabase: Supabase): Promise<void> {
  const { data } = await supabase.storage.getBucket(SEAU_FIGURINES_PROS);
  if (data) return;
  const { error } = await supabase.storage.createBucket(SEAU_FIGURINES_PROS, { public: true });
  if (error && !/exist/i.test(error.message)) throw new Error(error.message);
}

const cheminEtat = (siteId: string) => `${siteId}/etat.json`;

export async function lireEtat(supabase: Supabase, siteId: string): Promise<Etat> {
  try {
    const { data } = await supabase.storage.from(SEAU_FIGURINES_PROS).download(cheminEtat(siteId));
    if (!data) return {};
    return JSON.parse(await data.text()) as Etat;
  } catch {
    return {};
  }
}

export async function ecrireEtat(supabase: Supabase, siteId: string, e: Etat): Promise<void> {
  await seauPret(supabase);
  const corps = Buffer.from(JSON.stringify(e));
  const { error } = await supabase.storage.from(SEAU_FIGURINES_PROS).upload(cheminEtat(siteId), corps, { contentType: "application/json", upsert: true });
  if (error) throw new Error(error.message);
}

export async function deposerImage(supabase: Supabase, siteId: string, png: Buffer): Promise<string> {
  await seauPret(supabase);
  const chemin = `${siteId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.png`;
  const { error } = await supabase.storage.from(SEAU_FIGURINES_PROS).upload(chemin, png, { contentType: "image/png", upsert: false });
  if (error) throw new Error(error.message);
  return chemin;
}

const urlDe = (supabase: Supabase, chemin: string | undefined) => (chemin ? supabase.storage.from(SEAU_FIGURINES_PROS).getPublicUrl(chemin).data.publicUrl : null);

export function etatPublic(supabase: Supabase, e: Etat, maintenant = new Date()): EtatFigurinePro {
  const faits = e.essais?.jour === jourDe(maintenant) ? e.essais.n : 0;
  return {
    validee: urlDe(supabase, e.validee?.chemin),
    proposee: urlDe(supabase, e.proposee?.chemin),
    essaisRestants: Math.max(0, essaisParJour() - faits),
  };
}

// ─── le détourage ───────────────────────────────────────────────────────────────────────────────

/**
 * RETIRER UN FOND UNI — le vert qu'on a demandé quand le moteur ne sait pas rendre de fond transparent.
 *
 * PAS UNE CLÉ DE COULEUR, UN REMPLISSAGE DEPUIS LES BORDS. Une clé de couleur retire tout ce qui ressemble au fond, où
 * que ce soit : sur une figurine au teint rosé ou en chemise bordeaux, elle ronge le visage (essayé : la moitié de la
 * figurine du chef est partie). Ici, on part des bords de l'image et l'on n'avance que de proche en proche, sur ce qui
 * ressemble au fond : ce qui est entouré par la figurine reste à elle. Puis on adoucit le bord (un pixel) et l'on
 * retire le reflet du fond sur ce bord.
 */
export async function detourerSurFondUni(img: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(img).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const px = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
  // la couleur du fond : la médiane des bords
  const bords: number[][] = [[], [], []];
  for (let x = 0; x < w; x += 2)
    for (const y of [0, 1, h - 2, h - 1]) for (let c = 0; c < 3; c++) bords[c].push(px[(y * w + x) * 4 + c]);
  for (let y = 0; y < h; y += 2)
    for (const x of [0, 1, w - 2, w - 1]) for (let c = 0; c < 3; c++) bords[c].push(px[(y * w + x) * 4 + c]);
  const fond = bords.map((l) => l.sort((a, b) => a - b)[Math.floor(l.length / 2)]);
  /* LA DISTANCE SE MESURE SUR LA TEINTE, PAS SUR LA LUMIÈRE. En rouge-vert-bleu, un magenta foncé est aussi près
     d'une chemise olive que d'un pli du fond (essayé : le remplissage a traversé la figurine). En chrominance (Cb, Cr),
     la peau, le noir, l'olive et le magenta sont loin les uns des autres, et une ombre sur le fond reste du fond : la
     lumière ne compte que pour un tiers. */
  const ycc = (r: number, g: number, b: number) => [0.299 * r + 0.587 * g + 0.114 * b, 128 - 0.1687 * r - 0.3313 * g + 0.5 * b, 128 + 0.5 * r - 0.4187 * g - 0.0813 * b];
  const [fy, fcb, fcr] = ycc(fond[0], fond[1], fond[2]);
  const dist = (i: number, y0: number, cb0: number, cr0: number) => {
    const [y, cb, cr] = ycc(px[i], px[i + 1], px[i + 2]);
    return Math.hypot(cb - cb0, cr - cr0, 0.35 * (y - y0));
  };
  const auFond = (i: number) => dist(i, fy, fcb, fcr);
  /* LES SEUILS SUIVENT LE FOND MESURÉ : un fond généré bien plat (un vert d'incrustation) n'a presque aucun écart, on
     peut serrer ; un fond photographié (un feutre, un dégradé) en a, on desserre juste ce qu'il faut. */
  const ecarts: number[] = [];
  for (let x = 0; x < w; x += 3) for (const y of [0, h - 1]) ecarts.push(auFond((y * w + x) * 4));
  for (let y = 0; y < h; y += 3) for (const x of [0, w - 1]) ecarts.push(auFond((y * w + x) * 4));
  ecarts.sort((a, b) => a - b);
  const p95 = ecarts[Math.floor(ecarts.length * 0.95)] ?? 0;
  const LOIN = Math.min(14, Math.max(6, p95 * 1.5)); // assez près du fond : c'est du fond
  const VOISIN = 3; // ou presque pareil que son voisin de fond (un dégradé, une ombre douce)…
  const PLAFOND = LOIN * 1.6; // …sans jamais s'en éloigner trop

  const estFond = new Uint8Array(w * h);
  const file = new Int32Array(w * h);
  let debut = 0;
  let fin = 0;
  const pousser = (k: number) => {
    estFond[k] = 1;
    file[fin++] = k;
  };
  for (let x = 0; x < w; x++)
    for (const y of [0, h - 1]) {
      const k = y * w + x;
      if (!estFond[k] && auFond(k * 4) < PLAFOND) pousser(k);
    }
  for (let y = 0; y < h; y++)
    for (const x of [0, w - 1]) {
      const k = y * w + x;
      if (!estFond[k] && auFond(k * 4) < PLAFOND) pousser(k);
    }
  while (debut < fin) {
    const k = file[debut++];
    const x = k % w;
    const y = (k - x) / w;
    const i = k * 4;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const n = ny * w + nx;
      if (estFond[n]) continue;
      const j = n * 4;
      const aFond = auFond(j);
      const [vy, vcb, vcr] = ycc(px[i], px[i + 1], px[i + 2]);
      const aVoisin = dist(j, vy, vcb, vcr);
      if (aFond < LOIN || (aVoisin < VOISIN && aFond < PLAFOND)) pousser(n);
    }
  }
  // le fond s'efface ; le bord de la figurine s'adoucit et perd le reflet du fond
  for (let k = 0; k < w * h; k++) {
    const i = k * 4;
    if (estFond[k]) {
      px[i + 3] = 0;
      continue;
    }
    const x = k % w;
    const y = (k - x) / w;
    const auBord = (x > 0 && estFond[k - 1]) || (x < w - 1 && estFond[k + 1]) || (y > 0 && estFond[k - w]) || (y < h - 1 && estFond[k + w]);
    if (!auBord) continue;
    const a = Math.min(1, Math.max(0.25, (auFond(i) - LOIN / 2) / (2 * LOIN)));
    px[i + 3] = Math.round(255 * a);
    // le reflet : on retire au pixel la part de fond qu'il porte
    const part = 1 - a;
    for (let c = 0; c < 3; c++) px[i + c] = Math.max(0, Math.min(255, Math.round((px[i + c] - part * fond[c]) / Math.max(0.25, a))));
  }
  return sharp(Buffer.from(px.buffer, px.byteOffset, px.length), { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

/** Un fond déjà transparent ? Les quatre coins le disent. */
async function dejaTransparente(img: Buffer): Promise<boolean> {
  const { data, info } = await sharp(img).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const coins = [0, w - 1, (h - 1) * w, h * w - 1];
  return coins.every((k) => data[k * 4 + 3] < 16);
}

/** La figurine seule : rognée au plus près (un peu de marge), 1 100 pixels de haut au plus. */
export async function rogner(img: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(img).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > 24) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) throw new Error("Image vide");
  const m = Math.round(0.02 * Math.max(x1 - x0, y1 - y0));
  const left = Math.max(0, x0 - m);
  const top = Math.max(0, y0 - m);
  const width = Math.min(w - left, x1 - x0 + 1 + 2 * m);
  // LE BAS AU RAS DE LA COUPELLE : c'est là que le ressort s'accroche
  const height = Math.min(h - top, y1 + 1 - top);
  return sharp(img).extract({ left, top, width, height }).resize({ height: 1100, withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();
}

// ─── la fabrication ─────────────────────────────────────────────────────────────────────────────

export type Fabrication = { png: Buffer; modele: string } | { erreur: string; statut: number };

/**
 * DU SELFIE À LA FIGURINE. `avant` : l'heure limite (la fonction a cinq minutes ; on abandonne avant, avec une
 * raison, plutôt qu'un 504 muet).
 */
export async function fabriquerFigurine(o: { selfie: Buffer; famille: FamilleDouble; avant: number }): Promise<Fabrication> {
  const cle = s(process.env.OPENAI_API_KEY);
  if (!cle) return { erreur: "La fabrication des figurines n'est pas encore branchée ici (moteur d'image absent).", statut: 503 };
  const base = s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
  let photo: Buffer;
  try {
    // LE SENS DE LA PHOTO : celui du téléphone (EXIF), puis 1 024 pixels au plus
    photo = await sharp(o.selfie).rotate().resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true }).png().toBuffer();
  } catch {
    return { erreur: "Ce selfie ne s'ouvre pas. Reprenez-le, ou choisissez une photo JPEG.", statut: 400 };
  }
  const { liste } = await moteursDImage(cle, base);
  let derniere = "Le moteur d'image n'a pas répondu.";
  for (let m = 0; m < liste.length; m++) {
    const modele = liste[m];
    const reglages: Record<string, string> = {
      size: "1024x1536",
      quality: s(process.env.FIGURINE_QUALITE) || "high",
      input_fidelity: "high",
      background: "transparent",
      output_format: "png",
    };
    for (let essai = 0; essai < 4; essai++) {
      const fond = reglages.background === "transparent" ? "transparent" : "vert";
      const forme = new FormData();
      forme.append("model", modele);
      forme.append("prompt", consigneFigurine(o.famille, fond));
      forme.append("n", "1");
      for (const [k, v] of Object.entries(reglages)) forme.append(k, v);
      forme.append("image[]", new File([new Uint8Array(photo)], "selfie.png", { type: "image/png" }));
      const reste = o.avant - Date.now();
      if (reste < 20_000) return { erreur: "La fabrication a pris trop de temps. Réessayez dans un instant.", statut: 504 };
      let r: Response;
      try {
        r = await fetch(`${base}/v1/images/edits`, { method: "POST", headers: { authorization: `Bearer ${cle}` }, body: forme, signal: AbortSignal.timeout(reste - 10_000) });
      } catch {
        return { erreur: "La fabrication a pris trop de temps. Réessayez dans un instant.", statut: 504 };
      }
      if (r.ok) {
        const j = (await r.json().catch(() => null)) as { data?: { b64_json?: string }[] } | null;
        const b64 = j?.data?.[0]?.b64_json;
        if (!b64) return { erreur: "Le moteur d'image n'a pas rendu d'image.", statut: 502 };
        try {
          let png: Buffer = Buffer.from(b64, "base64");
          if (!(await dejaTransparente(png))) png = await detourerSurFondUni(png);
          return { png: await rogner(png), modele };
        } catch {
          return { erreur: "L'image rendue n'a pas pu être préparée. Réessayez.", statut: 502 };
        }
      }
      const txt = await r.text().catch(() => "");
      derniere = `Le moteur d'image a répondu ${r.status}.`;
      if (r.status === 400) {
        // UN RÉGLAGE INCONNU DE CE MOTEUR : on le retire et on rejoue (sans fond transparent → fond vert, détouré ici)
        const inconnus = Object.keys(reglages).filter((k) =>
          new RegExp(`(unknown|unsupported|unrecognized|not supported|invalid)[^.]{0,60}${k}|${k}[^.]{0,60}(unknown|unsupported|not supported|invalid)`, "i").test(txt),
        );
        if (inconnus.length) {
          for (const k of inconnus) delete reglages[k];
          continue;
        }
        if (/safety|rejected|moderation/i.test(txt))
          return { erreur: "Le moteur d'image a refusé cette photo. Essayez un autre selfie : de face, bien éclairé, vous seul.", statut: 422 };
      }
      if (m < liste.length - 1 && moteurRefuse(r.status, txt)) {
        noterRefus(modele);
        break;
      }
      console.error("[figurine] refus du moteur", JSON.stringify({ modele, statut: r.status, pourquoi: txt.slice(0, 300) }));
      return { erreur: derniere, statut: 502 };
    }
  }
  return { erreur: derniere, statut: 502 };
}
