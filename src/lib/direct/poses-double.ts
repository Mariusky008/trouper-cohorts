/**
 * 🎭 LES NOUVELLES POSES DU DOUBLE — fabriquées par l'IA, validées par un humain.
 *
 * « Faire se retourner le fantôme pour pousser la porte, ou faire bouger ses
 * yeux, demande de nouvelles images pour chacune des tenues. » — « Oui, vas-y. »
 *
 * TROIS POSES PAR TENUE, À PARTIR DE CELLE QUI EXISTE (`accueil.webp`) :
 *   · « regard-gauche », « regard-droite » : le même fantôme, les pupilles
 *     tournées — la page passe de l'une à l'autre selon le doigt ou la souris :
 *     ses yeux le suivent ;
 *   · « pousse-porte » : de trois quarts dos, le bras tendu qui pousse — la
 *     pose qu'il prend au toucher, juste avant que la façade s'ouvre.
 *
 * RIEN N'EST MONTRÉ SANS AVOIR ÉTÉ VALIDÉ. Une pose générée est une PROPOSITION ;
 * elle n'apparaît sur les pages qu'une fois validée dans l'administration
 * (`/admin/poses-double`). Une tenue sans pose validée garde le comportement
 * d'avant : le penché vers le doigt, l'effacement dans la lumière.
 *
 * L'INDEX VIT DANS LE STOCKAGE (un fichier JSON) : aucune migration. Les images
 * sont détourées (fond transparent), au format exact des poses existantes
 * (512 × 512), pour se substituer à elles sans bouger d'un point.
 *
 * FICHIER SERVEUR.
 */
import { readFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENUES } from "@/lib/direct/double-metiers";
import { moteursDImage, moteurRefuse, noterRefus } from "@/lib/direct/moteur-image";

const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const SEAU = s(process.env.COUVERTURE_BUCKET) || "marketplace-privilege-offers";
const DOSSIER = "poses-double";
const INDEX = `${DOSSIER}/index.json`;

export const POSES = ["regard-gauche", "regard-droite", "pousse-porte"] as const;
export type PoseNouvelle = (typeof POSES)[number];

/** Les tenues, par leur dossier — celui que la page connaît déjà (`tenue.dossier`). */
export function lesTenues(): { dossier: string; nom: string }[] {
  const vues = new Set<string>();
  const out: { dossier: string; nom: string }[] = [];
  for (const [famille, t] of Object.entries(TENUES)) {
    if (t && !vues.has(t.dossier)) {
      vues.add(t.dossier);
      out.push({ dossier: t.dossier, nom: famille });
    }
  }
  if (!vues.has("/direct/double/tatouage/")) out.push({ dossier: "/direct/double/tatouage/", nom: "tatouage" });
  return out;
}

const CONSIGNES: Record<PoseNouvelle, string> = {
  "regard-gauche":
    "Same character, same outfit, same pose, same framing, same size and same position in the canvas. The ONLY change: its eyes look to the LEFT side of the picture (pupils moved to the left of each eye), as if following something on the left. Keep the cute smile.",
  "regard-droite":
    "Same character, same outfit, same pose, same framing, same size and same position in the canvas. The ONLY change: its eyes look to the RIGHT side of the picture (pupils moved to the right of each eye), as if following something on the right. Keep the cute smile.",
  "pousse-porte":
    "Same character and same outfit, same size and same position in the canvas, but now seen in three-quarter view FROM BEHIND, turned toward the back of the picture, one arm stretched forward as if pushing a door open to enter. We see its back, the back of its cap and the straps of its outfit.",
};

export type EntreePose = { proposee?: string; validee?: string; at?: string; erreur?: string };
export type IndexPoses = Record<string, Partial<Record<PoseNouvelle, EntreePose>>>;

/**
 * L'INDEX, OU UNE ERREUR — JAMAIS UN INDEX VIDE PAR DÉFAUT.
 *
 * « Pas encore d'index » et « le stockage n'a pas répondu » ne sont pas la même
 * chose. Les confondre (rendre `{}` dans les deux cas) avait une conséquence
 * grave : un stockage lent au moment d'un « Valider », et l'atelier réécrivait
 * un index VIDE par-dessus le vrai — toutes les poses validées effacées d'un
 * coup. Désormais seul un index réellement absent vaut `{}` ; une panne lève
 * une erreur, et rien n'est réécrit.
 */
export async function lireIndex(delaiMs = 15_000): Promise<IndexPoses> {
  const seau = createAdminClient().storage.from(SEAU);
  const trop = new Promise<never>((_, non) => setTimeout(() => non(new Error("le stockage ne répond pas")), delaiMs));
  const { data, error } = await Promise.race([seau.download(INDEX), trop]);
  if (error || !data) {
    // ABSENT, OU EN PANNE ? On regarde le dossier : s'il se lit et que
    // l'index n'y est pas, c'est qu'il n'a encore jamais été écrit.
    const liste = await Promise.race([seau.list(DOSSIER, { search: "index.json" }), trop]);
    if (!liste.error && !(liste.data ?? []).some((f) => f.name === "index.json")) return {};
    throw new Error(`index des poses illisible : ${error?.message || liste.error?.message || "réponse vide"}`);
  }
  const j = JSON.parse(await data.text()) as unknown;
  return j && typeof j === "object" ? (j as IndexPoses) : {};
}

async function ecrireIndex(index: IndexPoses): Promise<void> {
  const { error } = await createAdminClient()
    .storage.from(SEAU)
    .upload(INDEX, Buffer.from(JSON.stringify(index)), { contentType: "application/json", upsert: true, cacheControl: "60" });
  if (error) throw new Error(`index des poses non enregistré : ${error.message}`);
}

/**
 * CE QUE LES PAGES ONT LE DROIT DE MONTRER : les poses VALIDÉES, et elles seules.
 *
 * DEMANDÉ PAR CHAQUE VISITE, DONC JAMAIS BLOQUANT. Un stockage qui traîne
 * laissait la requête pendre sans fin — et la page avec elle. On attend trois
 * secondes au plus, on garde la réponse une minute en mémoire, et en cas de
 * panne on rend la dernière connue (ou rien : le fantôme garde ses gestes
 * d'avant, rien ne se dégrade).
 */
let memoire: { at: number; poses: Record<string, Partial<Record<PoseNouvelle, string>>> } | null = null;
export async function posesValidees(): Promise<Record<string, Partial<Record<PoseNouvelle, string>>>> {
  if (memoire && Date.now() - memoire.at < 60_000) return memoire.poses;
  try {
    const index = await lireIndex(3_000);
    const out: Record<string, Partial<Record<PoseNouvelle, string>>> = {};
    for (const [dossier, poses] of Object.entries(index)) {
      for (const p of POSES) {
        const v = poses?.[p]?.validee;
        if (v) (out[dossier] ??= {})[p] = v;
      }
    }
    memoire = { at: Date.now(), poses: out };
    return out;
  } catch {
    // On retente dans une demi-minute, pas à chaque visite.
    memoire = { at: Date.now() - 30_000, poses: memoire?.poses ?? {} };
    return memoire.poses;
  }
}

/** La pose de référence, sur le disque (déclarée à `outputFileTracingIncludes`). */
function laReference(dossier: string): Buffer {
  return readFileSync(join(process.cwd(), "public", `${dossier}accueil.webp`.replace(/^\//, "")));
}

/** Détoure un fond vert uni (le repli Gemini, qui ne sait pas rendre la transparence). */
async function detourerVert(png: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const vert = g - Math.max(r, b);
    if (vert > 70) data[i + 3] = 0;
    else if (vert > 30) {
      // LE BORD : on adoucit et on retire le reflet vert.
      data[i + 3] = Math.round(data[i + 3] * (1 - (vert - 30) / 40));
      data[i + 1] = Math.max(r, b);
    }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

async function parOpenAI(cle: string, ref: Buffer, consigne: string): Promise<Buffer | { erreur: string }> {
  const base = s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
  const png = await sharp(ref).png().toBuffer();
  const erreurs: string[] = [];
  for (const modele of (await moteursDImage(cle, base)).liste) {
    const forme = new FormData();
    forme.append("model", modele);
    forme.append("image[]", new File([new Uint8Array(png)], "fantome.png", { type: "image/png" }));
    forme.append("prompt", `${consigne}\nTransparent background. No text, no logo change, no shadow on the ground.`);
    forme.append("size", "1024x1024");
    forme.append("background", "transparent");
    forme.append("output_format", "png");
    forme.append("quality", s(process.env.OPENAI_IMAGE_QUALITY) || "high");
    const r = await fetch(`${base}/v1/images/edits`, {
      method: "POST",
      headers: { authorization: `Bearer ${cle}` },
      body: forme,
      signal: AbortSignal.timeout(200_000),
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      if (moteurRefuse(r.status, txt)) {
        noterRefus(modele);
        erreurs.push(`${modele} refusé`);
        continue;
      }
      return { erreur: `OpenAI ${r.status} : ${txt.slice(0, 200)}` };
    }
    const j = (await r.json()) as { data?: { b64_json?: string }[] };
    const b64 = j.data?.[0]?.b64_json;
    return b64 ? Buffer.from(b64, "base64") : { erreur: "OpenAI n'a pas rendu d'image." };
  }
  return { erreur: erreurs.join(" ; ") || "Aucun moteur OpenAI." };
}

async function parGemini(cle: string, ref: Buffer, consigne: string): Promise<Buffer | { erreur: string }> {
  const base = s(process.env.GEMINI_BASE_URL) || "https://generativelanguage.googleapis.com";
  const modele = s(process.env.GEMINI_IMAGE_MODEL) || "gemini-2.5-flash-image";
  const png = await sharp(ref).flatten({ background: "#00FF00" }).png().toBuffer();
  const r = await fetch(`${base}/v1beta/models/${modele}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": cle },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/png", data: png.toString("base64") } },
            { text: `${consigne}\nKeep the plain pure green background (#00FF00) exactly, nothing else in the picture. Square image.` },
          ],
        },
      ],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
    signal: AbortSignal.timeout(200_000),
  });
  if (!r.ok) return { erreur: `Gemini ${r.status} : ${(await r.text().catch(() => "")).slice(0, 200)}` };
  const j = (await r.json()) as { candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[] };
  const d = (j.candidates?.[0]?.content?.parts ?? []).find((p) => p.inlineData?.data)?.inlineData?.data;
  return d ? detourerVert(Buffer.from(d, "base64")) : { erreur: "Gemini n'a pas rendu d'image." };
}

/**
 * FABRIQUE UNE PROPOSITION pour une tenue et une pose, et la range — sans la
 * montrer à personne tant qu'elle n'est pas validée.
 */
export async function proposerUnePose(dossier: string, pose: PoseNouvelle): Promise<EntreePose> {
  if (!lesTenues().some((t) => t.dossier === dossier) || !POSES.includes(pose)) return { erreur: "tenue ou pose inconnue" };
  const openai = s(process.env.OPENAI_API_KEY);
  const gemini = s(process.env.GEMINI_API_KEY) || s(process.env.GOOGLE_API_KEY);
  const ref = laReference(dossier);
  // OPENAI D'ABORD : il rend un vrai fond transparent ; Gemini en repli, détouré.
  let rendu: Buffer | { erreur: string } = { erreur: "Aucune clé d'image sur ce serveur." };
  const erreurs: string[] = [];
  if (openai) {
    rendu = await parOpenAI(openai, ref, CONSIGNES[pose]);
    if (!Buffer.isBuffer(rendu)) erreurs.push(rendu.erreur);
  }
  if (!Buffer.isBuffer(rendu) && gemini) {
    rendu = await parGemini(gemini, ref, CONSIGNES[pose]);
    if (!Buffer.isBuffer(rendu)) erreurs.push(rendu.erreur);
  }
  const index = await lireIndex();
  const avant = index[dossier]?.[pose] ?? {};
  if (!Buffer.isBuffer(rendu)) {
    const e: EntreePose = { ...avant, erreur: erreurs.join(" | ").slice(0, 300) || rendu.erreur, at: new Date().toISOString() };
    (index[dossier] ??= {})[pose] = e;
    await ecrireIndex(index);
    return e;
  }
  // AU FORMAT EXACT DES POSES EXISTANTES : 512 × 512, transparent.
  const final = await sharp(rendu)
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const nom = dossier.replace(/^\/direct\/double\/?/, "").replace(/\/$/, "") || "table";
  const chemin = `${DOSSIER}/${nom}/${pose}-${Date.now()}.png`;
  const { error } = await createAdminClient().storage.from(SEAU).upload(chemin, final, { contentType: "image/png", upsert: true });
  if (error) return { ...avant, erreur: `stockage : ${error.message}` };
  const url = createAdminClient().storage.from(SEAU).getPublicUrl(chemin).data.publicUrl;
  const e: EntreePose = { ...avant, proposee: url, at: new Date().toISOString(), erreur: undefined };
  const frais = await lireIndex();
  (frais[dossier] ??= {})[pose] = e;
  await ecrireIndex(frais);
  return e;
}

/** VALIDER (la proposition devient la pose montrée) ou RETIRER (plus rien de montré). */
export async function deciderUnePose(dossier: string, pose: PoseNouvelle, decision: "valider" | "retirer"): Promise<EntreePose> {
  const index = await lireIndex();
  const avant = index[dossier]?.[pose] ?? {};
  const e: EntreePose =
    decision === "valider" ? (avant.proposee ? { ...avant, validee: avant.proposee } : avant) : { ...avant, validee: undefined };
  (index[dossier] ??= {})[pose] = e;
  await ecrireIndex(index);
  return e;
}
