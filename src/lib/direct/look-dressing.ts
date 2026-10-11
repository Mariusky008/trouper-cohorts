// 🧥 LE LOOK AVEC MON DRESSING — la pièce de la boutique, portée avec les
// siennes. FICHIER SERVEUR.
//
// ═══ CE QUE L'IMAGE DOIT MONTRER ═══════════════════════════════════════════
//
// « Je le vois avec ce que j'ai déjà. » Une seule photo, en pied, où la veste
// du magasin est portée sur SA chemise, SON jean, SES baskets. Pas un collage :
// un rendu, par le même moteur que l'essayage et DANS LE MÊME ORDRE : OpenAI
// d'abord (le moteur de ChatGPT, `moteur-image.ts`, avec `input_fidelity`
// qui garde la personne), Gemini en repli. `ESSAI_FOURNISSEUR=gemini` renverse
// les deux, pour le look comme pour l'essai — voir `api/direct/essayer`.
//
// SUR QUI. Sur la personne elle-même quand elle vient de se photographier pour
// l'essai de cette boutique (la photo de la visite, `photo-essai.ts`) ; sinon
// sur la personne de démonstration du magasin (homme ou femme), celle de la
// vitrine. L'écran dit lequel des deux.
//
// RIEN N'EST GARDÉ ICI. Le rendu repart vers le téléphone ; c'est lui qui le
// range dans les pièces gardées si la personne le met de côté.
import sharp from "sharp";
import { moteurRefuse, moteursDImage, noterRefus } from "@/lib/direct/moteur-image";
import { lirePhoto, parGemini, photoDuDisque } from "@/lib/site-internet/experience-scenes";
import { AVANT_ELLE, AVANT_LUI } from "@/lib/site-internet/essai-vitrine-donnees";
import { NOM_SORTE, type SorteVetement } from "@/lib/direct/dressing";

type Img = { type: string; donnees: string };
export type PieceDuLook = { nom: string; image: Img; sorte?: SorteVetement; decrire?: string };

const s = (v: unknown) => (v == null ? "" : String(v).trim());
const cleGemini = () => s(process.env.GEMINI_API_KEY) || s(process.env.GOOGLE_API_KEY);
const cleOpenAI = () => s(process.env.OPENAI_API_KEY);
export const moteurLookConfigure = () => Boolean(cleGemini() || cleOpenAI());

/** Les noms sont écrits par l'habitant ou l'analyse : on les borne avant de les mettre dans une consigne. */
const propre = (n: string, max = 48) => n.replace(/["\n\r]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

/**
 * LA CONSIGNE. L'ordre des images est l'ordre de la phrase : la personne, la
 * pièce de la boutique, puis les siennes. Chaque pièce est nommée — le nom
 * donne la cible, l'image la matière.
 *
 * SANS LA PHOTO DU MAGASIN (`boutiqueEnImage` faux) : c'est le repli quand le
 * filtre d'OpenAI refuse la paire « une personne + la photo d'un mannequin
 * qui porte la veste » — lue de l'extérieur, un transfert d'identité. La pièce
 * est alors dite en toutes lettres (son nom, la description du commerçant),
 * et les images suivantes se renumérotent.
 */
export function consigneLook(boutique: PieceDuLook, siennes: PieceDuLook[], surElle: boolean, boutiqueEnImage = true): string {
  const decalage = boutiqueEnImage ? 3 : 2;
  const decrite = propre(boutique.decrire ?? "", 300);
  const lignes = [
    boutiqueEnImage
      ? `IMAGE 2 — "${propre(boutique.nom)}", THE SHOP'S PIECE (the one for sale): it must be clearly visible, well lit, and copied exactly.`
      : `THE SHOP'S PIECE (the one for sale, no photo given): "${propre(boutique.nom)}"${decrite ? ` — ${decrite}` : ""}. It must be clearly visible and well lit.`,
    ...siennes.map(
      (p, i) => `IMAGE ${i + decalage} — "${propre(p.nom)}", the person's own ${p.sorte ? NOM_SORTE[p.sorte].toLowerCase() : "garment"}: copy it exactly.`,
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

/**
 * ═══ LE TEMPS, COMPTÉ DEPUIS L'ARRIVÉE DE LA DEMANDE ══════════════════════
 *
 * La route a cinq minutes (`maxDuration`). On s'arrête quinze secondes avant
 * pour répondre en JSON plutôt qu'en page d'erreur, et on ne lance pas un
 * appel qu'on sait déjà perdu. Le même raisonnement que l'essai.
 */
const BUDGET_MS = 285_000;
const reste = (debut: number) => BUDGET_MS - (Date.now() - debut);
const PLUS_LEGER: Record<string, string> = { high: "medium", medium: "low" };

type Rendu = { image: Img; modele: string } | { erreur: string; refusFiltre?: boolean };

async function parOpenAI(
  images: Img[],
  consigne: string,
  cle: string,
  debut: number,
  qualite: string,
  modeles: string[],
): Promise<Rendu> {
  const base = s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
  const [modele, ...suivants] = modeles;
  if (!modele) return { erreur: "Aucun moteur OpenAI disponible." };
  const forme = new FormData();
  forme.append("model", modele);
  images.forEach((im, i) => forme.append("image[]", new File([Buffer.from(im.donnees, "base64")], `image-${i + 1}.jpg`, { type: im.type })));
  forme.append("prompt", consigne);
  forme.append("size", "1024x1536");
  forme.append("quality", qualite);
  // CE QUI GARDE LA PERSONNE — le réglage qui a départagé les deux fournisseurs pour l'essai.
  forme.append("input_fidelity", "high");
  // EN JPEG : un PNG de photo dépasserait ce qu'une réponse de fonction a le droit de peser.
  forme.append("output_format", "jpeg");
  forme.append("output_compression", "95");
  const envoyer = () =>
    fetch(`${base}/v1/images/edits`, {
      method: "POST",
      headers: { authorization: `Bearer ${cle}` },
      body: forme,
      signal: AbortSignal.timeout(Math.max(5_000, reste(debut) - 10_000)),
    });
  let r: Response;
  try {
    r = await envoyer();
    // UN RÉGLAGE QUE CE MOTEUR NE CONNAÎT PAS : on le retire, une fois, et on rejoue.
    if (r.status === 400) {
      const txt = await r.clone().text().catch(() => "");
      const inconnus = ["input_fidelity", "size", "quality", "output_format", "output_compression"].filter((k) =>
        new RegExp(`(unknown|unsupported|unrecognized|not supported)[^.]{0,60}${k}|${k}[^.]{0,60}(unknown|unsupported|not supported|invalid)`, "i").test(txt),
      );
      if (inconnus.length) {
        inconnus.forEach((k) => forme.delete(k));
        r = await envoyer();
      }
    }
  } catch (e) {
    return { erreur: `OpenAI injoignable : ${e instanceof Error ? e.message : "erreur"}` };
  }
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    if (suivants.length && moteurRefuse(r.status, txt)) {
      noterRefus(modele);
      return parOpenAI(images, consigne, cle, debut, qualite, suivants);
    }
    if (r.status === 400 && /safety|rejected|moderation/i.test(txt)) return { erreur: "refusé par le filtre d'OpenAI", refusFiltre: true };
    return { erreur: `OpenAI a répondu ${r.status}` };
  }
  const j = (await r.json().catch(() => ({}))) as { data?: { b64_json?: string }[] };
  const b64 = j.data?.[0]?.b64_json;
  if (!b64) return { erreur: "OpenAI n'a pas rendu d'image." };
  const type = b64.startsWith("/9j/") ? "image/jpeg" : b64.startsWith("UklGR") ? "image/webp" : "image/png";
  return { image: { type, donnees: b64 }, modele };
}

/** Le rendu repart en JPEG, quel que soit le moteur : la réponse a un poids maximal. */
async function enJpeg(im: Img): Promise<Img> {
  if (im.type === "image/jpeg") return im;
  try {
    const b = await sharp(Buffer.from(im.donnees, "base64")).jpeg({ quality: 90 }).toBuffer();
    return { type: "image/jpeg", donnees: b.toString("base64") };
  } catch {
    return im;
  }
}

/**
 * LE RENDU. `personne` : la photo de la visite, si elle existe. Rend l'image,
 * ou la raison pour laquelle il n'y en a pas — l'écran montre alors les pièces
 * côte à côte et le dit.
 *
 * L'ORDRE EST CELUI DE L'ESSAI : OpenAI en haute qualité, puis Gemini, puis
 * OpenAI allégé s'il reste du temps (`ESSAI_FOURNISSEUR=gemini` met Gemini
 * devant). Si le filtre d'OpenAI refuse, on rejoue UNE fois sans la photo du
 * magasin, la pièce dite en toutes lettres.
 */
export async function rendreLook(p: {
  pour: "homme" | "femme";
  personne: Img | null;
  boutique: PieceDuLook;
  siennes: PieceDuLook[];
  origine: string;
  debut?: number;
}): Promise<{ image: Img; modele: string; surElle: boolean } | { erreur: string }> {
  const debut = p.debut ?? Date.now();
  const surElle = Boolean(p.personne);
  const personne = p.personne ?? (await personneDeDemo(p.pour, p.origine));
  if (!personne) return { erreur: "la photo de la personne est introuvable" };
  const consigne = consigneLook(p.boutique, p.siennes, surElle);
  const images = [personne, p.boutique.image, ...p.siennes.map((x) => x.image)];
  const erreurs: string[] = [];
  const qualite = s(process.env.OPENAI_IMAGE_QUALITY) || "high";

  const openai = async (q: string): Promise<Rendu> => {
    const cle = cleOpenAI();
    const modeles = (await moteursDImage(cle, s(process.env.OPENAI_BASE_URL) || "https://api.openai.com")).liste;
    const o = await parOpenAI(images, consigne, cle, debut, q, modeles);
    if ("erreur" in o && o.refusFiltre && reste(debut) > 30_000) {
      const sansBoutique = [personne, ...p.siennes.map((x) => x.image)];
      return parOpenAI(sansBoutique, consigneLook(p.boutique, p.siennes, surElle, false), cle, debut, q, modeles);
    }
    return o;
  };
  const gemini = async (): Promise<Rendu> =>
    parGemini(
      [...images.flatMap((im, i) => [{ text: `IMAGE ${i + 1}:` }, { inlineData: { mimeType: im.type, data: im.donnees } }]), { text: consigne }],
      "2:3",
    );

  type Chemin = { nom: string; aller: () => Promise<Rendu> };
  const chemins: Chemin[] = [];
  if (cleOpenAI()) chemins.push({ nom: "openai", aller: () => openai(qualite) });
  if (cleGemini()) chemins.push({ nom: "gemini", aller: gemini });
  if (s(process.env.ESSAI_FOURNISSEUR).toLowerCase() === "gemini") chemins.reverse();
  const leger = PLUS_LEGER[qualite];
  if (cleOpenAI() && leger) chemins.push({ nom: "openai-leger", aller: () => openai(leger) });

  for (const c of chemins) {
    if (reste(debut) < 25_000) {
      erreurs.push(`${c.nom} : plus assez de temps`);
      break;
    }
    const r = await c.aller();
    if ("erreur" in r) {
      erreurs.push(`${c.nom} : ${r.erreur}`);
      continue;
    }
    return { image: await enJpeg(r.image), modele: r.modele, surElle };
  }
  return { erreur: erreurs.join(" ; ") || "aucun moteur d'image" };
}
