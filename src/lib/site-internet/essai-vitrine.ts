// 👗 L'ESSAYAGE DE SA VITRINE, FABRIQUÉ PAR LE MOTEUR D'IMAGES.
//
// « Une personne avec ses vêtements normaux, et exactement la même pose avec
// les vêtements de Lili Ross by me, qu'on aura pris sur sa fiche Google : il y
// aura un véritable effet wow, parce que la propriétaire reconnaîtra ses
// vêtements sur une personne qu'elle n'a jamais vue. »
//
// TROIS GESTES, APRÈS LA PAGE (voir `api/site-internet/hote`) :
//
//   1. CHOISIR LA PIÈCE. Ses photos sont montrées à un modèle qui voit : il
//      désigne celle où un vêtement se voit le mieux en entier (porté, sur
//      un mannequin, sur un cintre), dit ce que c'est en quelques mots, si
//      c'est une pièce de femme ou d'homme, et où elle se trouve dans l'image.
//   2. LA RECADRER SUR ELLE, tête exclue. C'est la leçon de `LISEZ-MOI.md` :
//      une référence où l'on voit un visage tire le rendu vers ce visage.
//      Recadrée sur le vêtement, elle ne transmet que le vêtement.
//   3. HABILLER L'AVANT. La personne de l'essayage de démonstration (une
//      photo du dépôt, la même pour toutes les boutiques) garde son visage,
//      sa pose, son décor ; seuls ses vêtements deviennent la pièce. L'après
//      est remis aux dimensions exactes de l'avant : à l'écran, ils se
//      superposent au pixel près.
//
// CE QUI EST VRAI, ET CE QUI NE L'EST PAS. La pièce est la sienne, prise sur
// sa fiche. La personne n'existe pas — elle sert d'avant à tout l'essayage de
// démonstration. Le rendu est une simulation, et l'écran le dit. Et il n'est
// montré qu'à lui, sur sa propre page : un passant ne le voit jamais.
//
// RIEN NE LÈVE : un échec laisse la page comme avant, et la visite suivante
// relance (voir `essaiVitrineAFaire`).
//
// FICHIER SERVEUR.
import { createHash } from "crypto";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import { photosCandidates } from "@/lib/site-internet/couverture";
import { lirePhoto, parGemini, photoDuDisque } from "@/lib/site-internet/experience-scenes";
import { piecesDuDiagnostic } from "@/lib/site-internet/pieces-comptoir";
import {
  AVANT_ELLE,
  AVANT_LUI,
  essaiVitrineAFaire,
  essaiVitrineDuDiagnostic,
  type EssaiVitrine,
} from "@/lib/site-internet/essai-vitrine-donnees";

const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const SEAU = s(process.env.COUVERTURE_BUCKET) || "marketplace-privilege-offers";
const DOSSIER = "experience-clikme";

type Img = { type: string; donnees: string };

/** Les dimensions de chaque avant, pour remettre l'après au pixel près. */
const DIMENSIONS: Record<string, { l: number; h: number }> = {
  [AVANT_ELLE]: { l: 900, h: 1350 },
  [AVANT_LUI]: { l: 1024, h: 1536 },
};

/** Cette boutique est-elle concernée : du prêt-à-porter, sans pièce mise à essayer par lui. */
export function boutiqueAEssayer(activite: string, diag: unknown): boolean {
  return brancheDuMetier(activite) === "mode" && piecesDuDiagnostic(diag).length === 0;
}

/* ON ÉCRIT SUR LE DIAGNOSTIC RELU, une chose à la fois : la photo ClikMe et
   les autres travaux de la même route écrivent dans la même colonne. */
async function ecrire(id: string, maj: (e: EssaiVitrine | undefined) => EssaiVitrine | null): Promise<void> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("human_vitrine_sites").select("diagnostic").eq("id", id).maybeSingle();
  const diag = ((data as Record<string, unknown> | null)?.diagnostic ?? {}) as Record<string, unknown>;
  const suite = maj(essaiVitrineDuDiagnostic(diag));
  if (!suite) return;
  await supabase.from("human_vitrine_sites").update({ diagnostic: { ...diag, essai_vitrine: suite } }).eq("id", id);
}

type Choix = { index: number; nom: string; genre: "femme" | "homme"; boite?: { x: number; y: number; w: number; h: number } };

/**
 * ═══ 1. LA PIÈCE ═══ Le modèle qui voit, et rien d'autre : une fraction de
 * centime. Sans réponse claire, aucune pièce — on n'habille personne avec la
 * photo d'une façade.
 */
async function choisirLaPiece(photos: Img[]): Promise<Choix | "aucune" | { erreur: string }> {
  const cle = s(process.env.GEMINI_API_KEY) || s(process.env.GOOGLE_API_KEY);
  if (!cle) return { erreur: "aucune clé Gemini sur le serveur" };
  if (!photos.length) return "aucune";
  const base = s(process.env.GEMINI_BASE_URL) || "https://generativelanguage.googleapis.com";
  const modele = s(process.env.GEMINI_VISION_MODEL) || "gemini-2.5-flash";
  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];
  photos.forEach((p, i) => parts.push({ text: `PHOTO ${i}` }, { inlineData: { mimeType: p.type, data: p.donnees } }));
  parts.push({
    text:
      "These photos come from the Google listing of a clothing shop. Choose the ONE photo that shows a single garment or outfit " +
      "most clearly and completely, so that it can be used to dress another person: worn by someone, on a mannequin, on a hanger " +
      "or laid flat. Prefer a photo where the whole garment is visible and well lit; avoid shop fronts, crowded racks of many " +
      "clothes, accessories alone, shoes alone and bags. Answer only with JSON: " +
      '{"index": <photo number, or -1 if no photo shows a usable garment>, ' +
      '"nom": "<short French name of the garment, 2 to 5 words, lower case after the first letter, e.g. Ensemble en dentelle corail>", ' +
      '"genre": "femme" or "homme", ' +
      '"box_2d": [ymin, xmin, ymax, xmax] normalised to 0-1000, tight around the garment only, EXCLUDING the head and face of the person wearing it}.',
  });
  try {
    const r = await fetch(`${base}/v1beta/models/${modele}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": cle },
      body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json" } }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!r.ok) return { erreur: `le modèle qui voit a répondu ${r.status}` };
    const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const texte = (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    const o = JSON.parse(texte.replace(/^```json|```$/g, "").trim()) as { index?: unknown; nom?: unknown; genre?: unknown; box_2d?: unknown };
    const index = Number(o.index);
    if (!Number.isInteger(index) || index < 0 || index >= photos.length) return "aucune";
    const b = Array.isArray(o.box_2d) ? o.box_2d.map(Number) : [];
    const boite =
      b.length === 4 && b.every((v) => Number.isFinite(v)) && b[2] > b[0] && b[3] > b[1]
        ? { x: b[1] / 1000, y: b[0] / 1000, w: (b[3] - b[1]) / 1000, h: (b[2] - b[0]) / 1000 }
        : undefined;
    const nom = s(o.nom).replace(/["«»]/g, "").slice(0, 60);
    return { index, nom: nom ? nom[0].toUpperCase() + nom.slice(1) : "", genre: o.genre === "homme" ? "homme" : "femme", boite };
  } catch (e) {
    return { erreur: `choix de la pièce impossible : ${e instanceof Error ? e.message : "erreur"}` };
  }
}

/** Le moteur est-il branché ? Sans clé, la page ne promet rien. */
export function moteurEssaiConfigure(): boolean {
  return Boolean(s(process.env.GEMINI_API_KEY) || s(process.env.GOOGLE_API_KEY));
}

/** ═══ 2. RECADRÉE SUR ELLE ═══ Une marge de six pour cent ; une boîte trop petite ou absente garde la photo entière. */
async function recadrer(photo: Img, boite: Choix["boite"]): Promise<Buffer> {
  const brut = Buffer.from(photo.donnees, "base64");
  const img = sharp(brut).rotate();
  const m = await img.metadata();
  const L = m.width ?? 0;
  const H = m.height ?? 0;
  if (!boite || !L || !H || boite.w < 0.12 || boite.h < 0.12) return sharp(brut).rotate().jpeg({ quality: 90 }).toBuffer();
  const marge = 0.06;
  const x0 = Math.max(0, Math.floor((boite.x - marge) * L));
  const y0 = Math.max(0, Math.floor((boite.y - marge / 2) * H));
  const x1 = Math.min(L, Math.ceil((boite.x + boite.w + marge) * L));
  const y1 = Math.min(H, Math.ceil((boite.y + boite.h + marge) * H));
  return sharp(brut).rotate().extract({ left: x0, top: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0) }).jpeg({ quality: 90 }).toBuffer();
}

/** ═══ 3. LA CONSIGNE ═══ La personne ne bouge pas ; seuls ses vêtements deviennent la pièce. */
function consigneEssai(nom: string, boutique: string): string {
  return [
    "Edit IMAGE 1 so that the same person wears the garment of IMAGE 2. Output ONE photorealistic photograph.",
    "IMAGE 1 — THE PERSON AND THE SCENE. Keep exactly the same person: face, features, expression, hair, skin, age, body shape and hands. " +
      "Keep the same pose, the same framing and camera, the same background and the same light. Only the clothes change.",
    `IMAGE 2 — THE SHOP'S GARMENT${nom ? ` ("${nom}")` : ""}, from the shop "${boutique}". Copy it faithfully: the same type of garment, cut, ` +
      "length, colour, pattern, fabric and texture (lace, knit, print), neckline, sleeves and details. If it is a full outfit (a dress, a " +
      "jumpsuit, a matching set), it replaces all the clothes of IMAGE 1; if it is only a top, keep the trousers or skirt of IMAGE 1; if it " +
      "is only a bottom, keep the top of IMAGE 1. IMAGE 2 is a garment reference only: never copy any face, hair, skin, body, hands, phone, " +
      "mirror, hanger, mannequin or background from it.",
    "The garment fits this person's body naturally, with realistic folds, drape and shadows matching the light of IMAGE 1. Keep the shoes of " +
      "IMAGE 1 unless the garment covers them.",
    "No text, no logo, no watermark, no label. Portrait format, 2:3, exactly the framing of IMAGE 1.",
  ].join("\n");
}

async function ranger(chemin: string, octets: Buffer, type: string): Promise<string | { erreur: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(SEAU).upload(chemin, octets, { contentType: type, upsert: true });
  if (error) return { erreur: `stockage : ${error.message}` };
  return supabase.storage.from(SEAU).getPublicUrl(chemin).data.publicUrl;
}

/** L'ESSAYAGE DE SA VITRINE, S'IL EST À FAIRE. Rien ne lève. */
export async function completerEssaiVitrine(slug: string): Promise<void> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, business_name, activite, diagnostic, gallery_photos")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? null;
  if (!row || !moteurEssaiConfigure() || !boutiqueAEssayer(s(row.activite), row.diagnostic)) return;
  const id = s(row.id);
  const avant = essaiVitrineDuDiagnostic(row.diagnostic);
  if (!essaiVitrineAFaire(avant)) return;
  // ON NOTE L'ESSAI AVANT DE PAYER : deux visites rapprochées n'en paient qu'un.
  const essais = (avant?.essais ?? 0) + 1;
  const debut = new Date().toISOString();
  await ecrire(id, (e) => (e && !essaiVitrineAFaire(e) ? null : { ...(e ?? {}), etat: "en-cours", essais, at: debut, erreur: undefined }));

  const echec = (erreur: string, etat: EssaiVitrine["etat"] = "echec") =>
    ecrire(id, (e) => (e?.at !== debut ? null : { ...e, etat, at: new Date().toISOString(), erreur }));

  try {
    // ── 1. SES PHOTOS, EN PETIT, ET LA PIÈCE ──
    const urls = photosCandidates(row).slice(0, 10);
    const grandes = await Promise.all(urls.map((u) => lirePhoto(u)));
    const lues = grandes.map((g, i) => ({ g, url: urls[i] })).filter((x): x is { g: Img; url: string } => Boolean(x.g));
    if (!lues.length) return void (await echec("aucune photo lisible sur sa fiche", "aucune"));
    const petites = await Promise.all(
      lues.map(async (x) => ({
        type: "image/jpeg",
        donnees: (await sharp(Buffer.from(x.g.donnees, "base64")).resize(640, 640, { fit: "inside" }).jpeg({ quality: 80 }).toBuffer()).toString("base64"),
      })),
    );
    const choix = await choisirLaPiece(petites);
    if (choix === "aucune") return void (await echec("aucune de ses photos ne montre une pièce à essayer", "aucune"));
    if ("erreur" in choix) return void (await echec(choix.erreur));
    const source = lues[choix.index];

    // ── 2. RECADRÉE SUR ELLE ──
    const piece = await recadrer(source.g, choix.boite);
    const empreinte = createHash("sha1").update(piece).digest("hex").slice(0, 12);
    const urlPiece = await ranger(`${DOSSIER}/${slug}-essai-piece-${empreinte}.jpg`, piece, "image/jpeg");
    if (typeof urlPiece !== "string") return void (await echec(urlPiece.erreur));

    // ── 3. L'AVANT, HABILLÉ ──
    const cheminAvant = choix.genre === "homme" ? AVANT_LUI : AVANT_ELLE;
    const imgAvant = await photoDuDisque(cheminAvant);
    if (!imgAvant) return void (await echec("la photo de l'avant est introuvable sur le serveur"));
    const r = await parGemini(
      [
        { text: "IMAGE 1 — THE PERSON:" },
        { inlineData: { mimeType: imgAvant.type, data: imgAvant.donnees } },
        { text: "IMAGE 2 — THE SHOP'S GARMENT:" },
        { inlineData: { mimeType: "image/jpeg", data: piece.toString("base64") } },
        { text: consigneEssai(choix.nom, s(row.business_name)) },
      ],
      "2:3",
    );
    if ("erreur" in r) return void (await echec(r.erreur));
    const dim = DIMENSIONS[cheminAvant];
    const octets = await sharp(Buffer.from(r.image.donnees, "base64")).resize(dim.l, dim.h, { fit: "cover" }).webp({ quality: 86 }).toBuffer();
    const urlApres = await ranger(`${DOSSIER}/${slug}-essai-apres-${Date.now()}.webp`, octets, "image/webp");
    if (typeof urlApres !== "string") return void (await echec(urlApres.erreur));

    await ecrire(id, (e) =>
      e?.at !== debut
        ? null
        : {
            etat: "prete",
            essais,
            at: new Date().toISOString(),
            source: /^https:\/\//i.test(source.url) ? source.url : undefined,
            piece: urlPiece,
            nom: choix.nom || undefined,
            genre: choix.genre,
            avant: cheminAvant,
            apres: urlApres,
            modele: r.modele,
          },
    );
  } catch (e) {
    await echec(e instanceof Error ? e.message : "erreur");
  }
}
