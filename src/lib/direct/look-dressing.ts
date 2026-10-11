// 🧥 LE LOOK AVEC MON DRESSING — la pièce de la boutique, portée avec les
// siennes. FICHIER SERVEUR.
//
// ═══ CE QUE L'IMAGE DOIT MONTRER ═══════════════════════════════════════════
//
// « Je le vois avec ce que j'ai déjà. » Une seule photo, en pied, où la veste
// du magasin est portée sur SA chemise, SON jean, SES baskets. Pas un collage :
// un rendu, par le même moteur que l'essayage (`moteur-image.ts`), Gemini
// d'abord, OpenAI ensuite.
//
// SUR QUI. Sur la personne elle-même quand elle vient de se photographier pour
// l'essai de cette boutique (la photo de la visite, `photo-essai.ts`) ; sinon
// sur la personne de démonstration du magasin (homme ou femme), celle de la
// vitrine. L'écran dit lequel des deux.
//
// RIEN N'EST GARDÉ ICI. Le rendu repart vers le téléphone ; c'est lui qui le
// range dans les pièces gardées si la personne le met de côté.
import { moteurRefuse, moteursDImage, noterRefus } from "@/lib/direct/moteur-image";
import { lirePhoto, parGemini, photoDuDisque } from "@/lib/site-internet/experience-scenes";
import { AVANT_ELLE, AVANT_LUI } from "@/lib/site-internet/essai-vitrine-donnees";
import { NOM_SORTE, type SorteVetement } from "@/lib/direct/dressing";

type Img = { type: string; donnees: string };
export type PieceDuLook = { nom: string; image: Img; sorte?: SorteVetement };

const s = (v: unknown) => (v == null ? "" : String(v).trim());
const cleGemini = () => s(process.env.GEMINI_API_KEY) || s(process.env.GOOGLE_API_KEY);
const cleOpenAI = () => s(process.env.OPENAI_API_KEY);
export const moteurLookConfigure = () => Boolean(cleGemini() || cleOpenAI());

/** Les noms sont écrits par l'habitant ou l'analyse : on les borne avant de les mettre dans une consigne. */
const propre = (n: string) => n.replace(/["\n\r]/g, " ").replace(/\s+/g, " ").slice(0, 48);

/**
 * LA CONSIGNE. L'ordre des images est l'ordre de la phrase : la personne, la
 * pièce de la boutique, puis les siennes. Chaque pièce est nommée — le nom
 * donne la cible, l'image la matière.
 */
export function consigneLook(boutique: PieceDuLook, siennes: PieceDuLook[], surElle: boolean): string {
  const lignes = [
    `IMAGE 2 — "${propre(boutique.nom)}", THE SHOP'S PIECE (the one for sale): it must be clearly visible, well lit, and copied exactly.`,
    ...siennes.map(
      (p, i) => `IMAGE ${i + 3} — "${propre(p.nom)}", the person's own ${p.sorte ? NOM_SORTE[p.sorte].toLowerCase() : "garment"}: copy it exactly.`,
    ),
  ];
  const chaussures = siennes.some((p) => p.sorte === "chaussures");
  return [
    "Create ONE photorealistic photograph: a full-length shot, from head to shoes, of THE PERSON of IMAGE 1, standing naturally in a pleasant shopping street in soft daylight, relaxed pose, looking at the camera.",
    surElle
      ? "IMAGE 1 — THE PERSON (a real customer). Keep exactly the same person: face, features, expression, hair, skin, age and body shape. Only the clothes change."
      : "IMAGE 1 — THE PERSON. Keep the same face, features, hair, skin, age and body shape. Only the clothes change.",
    "The outfit is made of EXACTLY these garments, each copied faithfully (type of garment, cut, length, colour, fabric, texture, details), worn the way people really wear them, with natural folds and fit. Nothing else is added:",
    ...lignes,
    chaussures ? "" : "No shoes are listed: choose discreet, neutral shoes that match the outfit.",
    "The garment photos are references only: never copy a hanger, a mannequin, a background, a hand or a person from them. The clothes the person wears in IMAGE 1 are replaced entirely by this outfit.",
    "No text, no logo, no watermark, no label. Portrait format, 2:3.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** La personne de démonstration du magasin, sur le disque — ou par le réseau en repli. */
async function personneDeDemo(pour: "homme" | "femme", origine: string): Promise<Img | null> {
  const chemin = pour === "homme" ? AVANT_LUI : AVANT_ELLE;
  return (await photoDuDisque(chemin)) ?? (origine ? await lirePhoto(`${origine}${chemin}`) : null);
}

async function parOpenAI(images: Img[], consigne: string, cle: string): Promise<{ image: Img; modele: string } | { erreur: string }> {
  const base = s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
  const erreurs: string[] = [];
  for (const modele of (await moteursDImage(cle, base)).liste) {
    const forme = new FormData();
    forme.append("model", modele);
    images.forEach((im, i) => forme.append("image[]", new File([Buffer.from(im.donnees, "base64")], `image-${i + 1}.jpg`, { type: im.type })));
    forme.append("prompt", consigne);
    forme.append("size", "1024x1536");
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
      return { erreur: `OpenAI a répondu ${r.status}` };
    }
    const j = (await r.json()) as { data?: { b64_json?: string }[] };
    const b64 = j.data?.[0]?.b64_json;
    return b64 ? { image: { type: "image/png", donnees: b64 }, modele } : { erreur: "OpenAI n'a pas rendu d'image." };
  }
  return { erreur: erreurs.join(" ; ") || "Aucun moteur OpenAI disponible." };
}

/**
 * LE RENDU. `personne` : la photo de la visite, si elle existe. Rend l'image,
 * ou la raison pour laquelle il n'y en a pas — l'écran montre alors les pièces
 * côte à côte et le dit.
 */
export async function rendreLook(p: {
  pour: "homme" | "femme";
  personne: Img | null;
  boutique: PieceDuLook;
  siennes: PieceDuLook[];
  origine: string;
}): Promise<{ image: Img; modele: string; surElle: boolean } | { erreur: string }> {
  const surElle = Boolean(p.personne);
  const personne = p.personne ?? (await personneDeDemo(p.pour, p.origine));
  if (!personne) return { erreur: "la photo de la personne est introuvable" };
  const consigne = consigneLook(p.boutique, p.siennes, surElle);
  const images = [personne, p.boutique.image, ...p.siennes.map((x) => x.image)];
  const erreurs: string[] = [];
  if (cleGemini()) {
    const g = await parGemini(
      [
        ...images.flatMap((im, i) => [{ text: `IMAGE ${i + 1}:` }, { inlineData: { mimeType: im.type, data: im.donnees } }]),
        { text: consigne },
      ],
      "2:3",
    );
    if ("erreur" in g) erreurs.push(g.erreur);
    else return { ...g, surElle };
  }
  if (cleOpenAI()) {
    const o = await parOpenAI(images, consigne, cleOpenAI());
    if ("erreur" in o) erreurs.push(o.erreur);
    else return { ...o, surElle };
  }
  return { erreur: erreurs.join(" ; ") || "aucun moteur d'image" };
}
