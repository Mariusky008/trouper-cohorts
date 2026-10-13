// 👔 MON DRESSING, CÔTÉ SERVEUR — les vêtements de L'HABITANT DU COOKIE, et
// rien d'autre. FICHIER SERVEUR.
//
// ═══ OÙ ILS VIVENT ═════════════════════════════════════════════════════════
//
// Dans la Maison privée, déjà prévue pour eux : la table
// `human_maison_elements` (« ce qu'il y dépose : un vêtement, sa photo pour les
// essais… ») et le seau `maison-privee`, sans aucune adresse publique. Voir la
// migration `20261014120000_maison_privee.sql`. Rien de neuf à créer en base.
//
// ═══ QUI LES VOIT ══════════════════════════════════════════════════════════
//
// LUI SEUL. Aucune fonction ici ne prend un identifiant d'habitant venu du
// navigateur : la route passe celui du cookie (`habitant.ts`). Les photos ne
// sortent jamais par une adresse signée qu'on pourrait recopier : elles
// passent par `/api/direct/ma-maison/dressing/photo`, qui revérifie le cookie
// à chaque image. Et aucune route côté commerçant ne lit ces tables — la
// boutique voit qu'on a fait un look, jamais le placard.
//
// ═══ L'ANALYSE ═════════════════════════════════════════════════════════════
//
// Le modèle qui voit dit ce qu'est la pièce, dans un VOCABULAIRE FERMÉ
// (`dressing.ts`) : il choisit une place et une couleur dans des listes, il
// n'invente pas une catégorie. Gemini d'abord, OpenAI ensuite — la règle de
// l'essayage et de la photo ClikMe. La photo part chez lui et n'y est pas
// gardée ; l'écran le dit.
import { randomUUID } from "crypto";
import sharp from "sharp";
import { SEAU_MAISON } from "@/lib/direct/maison-serveur";
import {
  CLES_COULEUR,
  lireFiche,
  lireVetement,
  PIECES_MAX,
  SAISONS,
  SORTES_VETEMENT,
  STYLES,
  type Fiche,
  type Vetement,
} from "@/lib/direct/dressing";

type Supabase = { from: (t: string) => any; storage: any }; // eslint-disable-line @typescript-eslint/no-explicit-any

const str = (v: unknown) => (v == null ? "" : String(v).trim());
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const estUnId = (v: unknown) => UUID.test(str(v));

/** L'adresse d'une photo : la nôtre, qui revérifie le cookie. `v` casse le cache quand la pièce change. */
const adressePhoto = (id: string, t: number) => `/api/direct/ma-maison/dressing/photo?id=${id}&v=${t}`;

function versVetement(r: Record<string, unknown>): Vetement | null {
  const donnees = (r.donnees && typeof r.donnees === "object" ? r.donnees : {}) as Record<string, unknown>;
  const t = Date.parse(str(r.cree_le)) || 0;
  return lireVetement({ ...donnees, sorte: r.sorte, id: str(r.id), photo: adressePhoto(str(r.id), Date.parse(str(r.maj_le)) || t), ajouteLe: t });
}

/** Ses vêtements, du plus récent au plus ancien. `null` : la table n'est pas là (la Maison reste sur le téléphone). */
export async function listerDressing(supabase: Supabase, habitant: string): Promise<Vetement[] | null> {
  try {
    const { data, error } = await supabase
      .from("human_maison_elements")
      .select("id, sorte, donnees, cree_le, maj_le")
      .eq("habitant", habitant)
      .eq("piece", "dressing")
      // LES VÊTEMENTS SEULS : les demandes de mise de côté vivent dans la même pièce (`mise-de-cote.ts`).
      .in("sorte", [...SORTES_VETEMENT])
      .order("cree_le", { ascending: false })
      .limit(PIECES_MAX);
    if (error) return null;
    return ((Array.isArray(data) ? data : []) as Record<string, unknown>[]).map(versVetement).filter((v): v is Vetement => Boolean(v));
  } catch {
    return null;
  }
}

/** Ce qu'on garde d'une fiche : la place va dans sa colonne, le reste dans `donnees`. */
function donneesDe(f: Fiche): Record<string, unknown> {
  const { sorte: _sorte, ...reste } = f; // eslint-disable-line @typescript-eslint/no-unused-vars
  return reste;
}

/**
 * RANGER UNE PIÈCE. La photo est remise d'aplomb, ramenée à 900 points et
 * réécrite en WebP : ce qu'on garde, c'est de quoi la reconnaître et la
 * montrer à un modèle, pas un original de douze mégapixels. Les métadonnées
 * de l'appareil (le lieu de la prise de vue) disparaissent avec la réécriture.
 */
export async function ajouterAuDressing(
  supabase: Supabase,
  habitant: string,
  octets: Buffer,
  fiche: Fiche,
): Promise<Vetement | { erreur: "plein" | "image" | "base" }> {
  try {
    const { data: deja, error: errCompte } = await supabase.from("human_maison_elements").select("id").eq("habitant", habitant).eq("piece", "dressing").in("sorte", [...SORTES_VETEMENT]);
    if (errCompte) return { erreur: "base" };
    if (Array.isArray(deja) && deja.length >= PIECES_MAX) return { erreur: "plein" };
    let webp: Buffer;
    try {
      webp = await sharp(octets).rotate().resize(900, 900, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    } catch {
      return { erreur: "image" };
    }
    const chemin = `${habitant}/dressing/${randomUUID()}.webp`;
    const { error: errPhoto } = await supabase.storage.from(SEAU_MAISON).upload(chemin, webp, { contentType: "image/webp", upsert: false });
    if (errPhoto) return { erreur: "base" };
    const maintenant = new Date().toISOString();
    const { data, error } = await supabase
      .from("human_maison_elements")
      .insert({ habitant, piece: "dressing", sorte: fiche.sorte, donnees: donneesDe(fiche), photo: chemin, cree_le: maintenant, maj_le: maintenant })
      .select("id, sorte, donnees, cree_le, maj_le")
      .maybeSingle();
    if (error || !data) {
      await supabase.storage.from(SEAU_MAISON).remove([chemin]);
      return { erreur: "base" };
    }
    return versVetement(data as Record<string, unknown>) ?? { erreur: "base" };
  } catch {
    return { erreur: "base" };
  }
}

/** Corriger ce que l'analyse a dit (« ce n'est pas un pull, c'est un gilet »). */
export async function modifierDansDressing(supabase: Supabase, habitant: string, id: string, fiche: Fiche): Promise<Vetement | null> {
  if (!estUnId(id)) return null;
  try {
    const { data, error } = await supabase
      .from("human_maison_elements")
      .update({ sorte: fiche.sorte, donnees: donneesDe(fiche), maj_le: new Date().toISOString() })
      .eq("id", id)
      .eq("habitant", habitant)
      .eq("piece", "dressing")
      .in("sorte", [...SORTES_VETEMENT])
      .select("id, sorte, donnees, cree_le, maj_le");
    const r = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
    return error || !r ? null : versVetement(r);
  } catch {
    return null;
  }
}

/** Retirer une pièce : la photo d'abord, la ligne ensuite (une ligne sans photo ne fuit rien). */
export async function retirerDuDressing(supabase: Supabase, habitant: string, id: string): Promise<boolean> {
  if (!estUnId(id)) return false;
  try {
    const { data } = await supabase.from("human_maison_elements").select("photo").eq("id", id).eq("habitant", habitant).eq("piece", "dressing").maybeSingle();
    const chemin = str((data as Record<string, unknown> | null)?.photo);
    if (chemin) await supabase.storage.from(SEAU_MAISON).remove([chemin]);
    const { error } = await supabase.from("human_maison_elements").delete().eq("id", id).eq("habitant", habitant).eq("piece", "dressing").in("sorte", [...SORTES_VETEMENT]);
    return !error;
  } catch {
    return false;
  }
}

/** La photo d'UNE pièce, si elle est bien à cet habitant. */
export async function photoDuDressing(supabase: Supabase, habitant: string, id: string): Promise<Buffer | null> {
  if (!estUnId(id)) return null;
  try {
    const { data } = await supabase.from("human_maison_elements").select("photo").eq("id", id).eq("habitant", habitant).eq("piece", "dressing").maybeSingle();
    const chemin = str((data as Record<string, unknown> | null)?.photo);
    if (!chemin) return null;
    const { data: blob, error } = await supabase.storage.from(SEAU_MAISON).download(chemin);
    if (error || !blob) return null;
    return Buffer.from(await (blob as Blob).arrayBuffer());
  } catch {
    return null;
  }
}

// ─── L'ANALYSE ─────────────────────────────────────────────────────────────

type Img = { type: string; donnees: string };

/** La question, dans le vocabulaire de `dressing.ts` — et rien d'autre n'est accepté en retour. */
export const QUESTION_VETEMENT =
  "A person photographed ONE of their own garments to add it to their digital wardrobe. Look at the single main garment. " +
  "Answer only with JSON, no prose. If the photo does not show a garment, shoes or a fashion accessory, answer {\"vetement\": false}. Otherwise: " +
  '{"vetement": true, ' +
  `"sorte": one of ${JSON.stringify(SORTES_VETEMENT)} — dessus = jacket, coat, blazer, overshirt; haut = shirt, t-shirt, top, blouse, polo; ` +
  "maille = sweater, cardigan, sweatshirt, hoodie; bas = jeans, trousers, skirt, shorts; robe = dress, jumpsuit; chaussures = any shoes; " +
  "accessoire = bag, cap, hat, belt, scarf, jewellery, sunglasses, " +
  '"nom": a short natural French name of 2 to 4 words, first letter upper case, colour agreed in gender and number, e.g. "Chemise blanche", ' +
  '"Jean bleu brut", "Baskets blanches", "Pull col roulé marine", ' +
  `"couleur": the main colour, one of ${JSON.stringify(CLES_COULEUR)} (jean = denim blue, ecru = off-white/cream, multicolore = patterned with several colours), ` +
  `"style": one of ${JSON.stringify(Object.keys(STYLES))}, ` +
  '"matiere": the main fabric as one lower-case French word (coton, lin, laine, cuir, denim, maille, soie, synthétique) or "", ' +
  `"saison": one of ${JSON.stringify(Object.keys(SAISONS))}}.`;

const cleGemini = () => str(process.env.GEMINI_API_KEY) || str(process.env.GOOGLE_API_KEY);
const cleOpenAI = () => str(process.env.OPENAI_API_KEY);

/** L'analyse est-elle branchée ? Sans clé, l'écran demande la place et garde la couleur mesurée. */
export const analyseConfiguree = () => Boolean(cleGemini() || cleOpenAI());

async function voirParGemini(img: Img, cle: string, question = QUESTION_VETEMENT): Promise<string | { erreur: string }> {
  const base = str(process.env.GEMINI_BASE_URL) || "https://generativelanguage.googleapis.com";
  const modele = str(process.env.GEMINI_VISION_MODEL) || "gemini-2.5-flash";
  const r = await fetch(`${base}/v1beta/models/${modele}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": cle },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ inlineData: { mimeType: img.type, data: img.donnees } }, { text: question }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!r.ok) return { erreur: `Gemini ${r.status}` };
  const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
}

async function voirParOpenAI(img: Img, cle: string, question = QUESTION_VETEMENT): Promise<string | { erreur: string }> {
  const base = str(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
  const modele = str(process.env.OPENAI_VISION_MODEL) || str(process.env.OPENAI_DOUBLE_MODEL) || "gpt-5.4-mini";
  const r = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${cle}` },
    body: JSON.stringify({
      model: modele,
      response_format: { type: "json_object" },
      max_completion_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${img.type};base64,${img.donnees}` } },
            { type: "text", text: question },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!r.ok) return { erreur: `OpenAI ${r.status}` };
  const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
  return j.choices?.[0]?.message?.content ?? "";
}

/**
 * UNE IMAGE, UNE QUESTION, UNE RÉPONSE JSON — le premier modèle qui répond.
 * Le même chemin que l'analyse d'un vêtement, pour une autre question (voir
 * « ClikMe tranche », `lib/direct/clikme-tranche.ts`).
 */
export async function regarderImage(img: Img, question: string): Promise<Record<string, unknown> | { erreur: string }> {
  const erreurs: string[] = [];
  for (const [cle, voir] of [
    [cleGemini(), voirParGemini],
    [cleOpenAI(), voirParOpenAI],
  ] as const) {
    if (!cle) continue;
    try {
      const r = await voir(img, cle, question);
      if (typeof r !== "string") {
        erreurs.push(r.erreur);
        continue;
      }
      const o = JSON.parse(r.replace(/^```json|```$/g, "").trim()) as unknown;
      if (o && typeof o === "object") return o as Record<string, unknown>;
      erreurs.push("réponse illisible");
    } catch (e) {
      erreurs.push(e instanceof Error ? e.message : String(e));
    }
  }
  return { erreur: erreurs.join(" ; ") || "aucune clé d'IA" };
}

/**
 * CE QU'EST LA PIÈCE. `fiche: null` avec `vetement: false` : la photo ne
 * montre pas un vêtement. `erreur` : aucun modèle n'a répondu — l'écran passe
 * alors aux deux questions qu'il sait poser lui-même.
 */
export async function analyserVetement(img: Img): Promise<{ vetement: boolean; fiche: Fiche | null } | { erreur: string }> {
  const erreurs: string[] = [];
  for (const [cle, voir] of [
    [cleGemini(), voirParGemini],
    [cleOpenAI(), voirParOpenAI],
  ] as const) {
    if (!cle) continue;
    try {
      const r = await voir(img, cle);
      if (typeof r !== "string") {
        erreurs.push(r.erreur);
        continue;
      }
      const o = JSON.parse(r.replace(/^```json|```$/g, "").trim()) as Record<string, unknown>;
      if (o.vetement === false) return { vetement: false, fiche: null };
      const fiche = lireFiche(o);
      if (fiche) return { vetement: true, fiche };
      erreurs.push("réponse hors vocabulaire");
    } catch (e) {
      erreurs.push(e instanceof Error ? e.message : String(e));
    }
  }
  return { erreur: erreurs.join(" ; ") || "aucune clé d'IA" };
}

/** Une image `data:` bornée, ou rien. */
export function lireImage(v: unknown, max: number): Img | null {
  const m = /^data:(image\/(?:jpeg|png|webp|heic|heif));base64,([A-Za-z0-9+/=]+)$/.exec(str(v));
  if (!m || m[2].length > max) return null;
  return { type: m[1], donnees: m[2] };
}
