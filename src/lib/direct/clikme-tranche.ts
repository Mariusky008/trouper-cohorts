/**
 * ✨ « CLIKME TRANCHE » — l'avis franc de ClikMe sur un essai, dans son salon.
 * FICHIER SERVEUR.
 *
 * « Il manque aussi la possibilité d'ouvrir un salon de discussion sans ami
 * ni consulter tout Vevey, pour juste être avec ClikMe qui tranche et aide. »
 *
 * CLIKME REGARDE LA PHOTO DE L'ESSAI, celle que les amis voient, et dit ce
 * qu'il en pense en trois phrases : le verdict d'abord, puis pourquoi, puis un
 * conseil. Ensuite il répond aux questions qu'on lui pose dans le salon, en
 * tenant compte de ce qui s'y est dit.
 *
 * CE QU'IL NE FAIT JAMAIS : parler du corps (poids, taille, âge, beauté),
 * inventer un prix, un stock ou une taille. Il juge la pièce SUR la personne
 * — couleur, coupe, longueur, proportions, style — et le dit avec chaleur.
 *
 * UN SALON NE LE FAIT PAS PARLER SANS FIN : voir `CLIKME_MAX` dans
 * `avis-amis.ts`. Sans clé d'IA, ou si le modèle ne répond pas, rien n'est
 * écrit dans le salon : celui qui a demandé l'apprend, les autres non.
 */
import sharp from "sharp";
import { regarderImage } from "@/lib/direct/dressing-serveur";

export type VerdictClikMe = "oui" | "non" | "hesite";

export type ContexteClikMe = {
  quoi: string;
  prix?: string;
  magasin?: string;
  /** Les derniers mots du salon, du plus ancien au plus récent. */
  mots: { q: string; x: string; clikme?: boolean }[];
  /** La question posée ; absente, c'est le verdict qu'on demande. */
  question?: string;
};

const s = (v: unknown, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

/** La consigne. Le marqueur « ClikMe, a frank and kind personal stylist » identifie cette question. */
function consigne(c: ContexteClikMe): string {
  const piece = `«${c.quoi}»${c.prix ? ` (${c.prix})` : ""}${c.magasin ? ` from the shop «${c.magasin}»` : ""}`;
  const regles =
    'You are ClikMe, a frank and kind personal stylist chatting in French inside a small private group chat. ' +
    `The image is a virtual try-on: the person is wearing ${piece}. ` +
    'Rules: write in French, informal "tu", warm and honest, at most 3 short sentences and under 320 characters, no emoji except at most one at the start. ' +
    'Judge only the garment on this person: colour against skin and hair, cut, length, proportions, style coherence. ' +
    'Never comment on body weight, body size, age or attractiveness. Never invent prices, stock or sizes. ' +
    'If the image is too unclear to judge, say so simply.';
  if (!c.question) {
    return (
      `${regles} Give your verdict on whether it suits them, then why, then one concrete tip (what to pair it with, or what to try instead). ` +
      'Return only JSON: {"verdict":"oui"|"non"|"hesite","texte":"..."} where texte starts with your verdict in a few words.'
    );
  }
  const fil = c.mots
    .slice(-8)
    .map((m) => `${m.clikme ? "ClikMe" : m.q || "Ami"}: ${m.x}`)
    .join("\n");
  return (
    `${regles}${fil ? ` Recent messages in the chat:\n${fil}\n` : " "}` +
    `Someone now asks you: «${s(c.question, 280)}». Answer it directly. ` +
    'Return only JSON: {"texte":"..."}'
  );
}

/** L'essai réduit pour le modèle : 768 points suffisent pour juger une tenue. */
async function reduite(image: Buffer): Promise<{ type: string; donnees: string } | null> {
  try {
    const jpeg = await sharp(image).rotate().resize(768, 960, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
    return { type: "image/jpeg", donnees: jpeg.toString("base64") };
  } catch {
    return null;
  }
}

/** Ce que ClikMe répond. `erreur` : personne n'a pu regarder la photo. */
export async function demanderAClikMe(
  image: Buffer,
  c: ContexteClikMe,
): Promise<{ texte: string; verdict?: VerdictClikMe } | { erreur: string }> {
  const img = await reduite(image);
  if (!img) return { erreur: "image" };
  const r = await regarderImage(img, consigne(c));
  if ("erreur" in r && typeof r.erreur === "string") return { erreur: r.erreur };
  const texte = s((r as Record<string, unknown>).texte, 420);
  if (!texte) return { erreur: "réponse vide" };
  const v = (r as Record<string, unknown>).verdict;
  return { texte, ...(v === "oui" || v === "non" || v === "hesite" ? { verdict: v } : {}) };
}
