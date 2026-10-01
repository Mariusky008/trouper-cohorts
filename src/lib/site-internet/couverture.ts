/**
 * 📸 LA PHOTO CLIKME — la devanture du commerçant, passée dans l'univers ClikMe.
 *
 * ═══ POURQUOI ELLE EXISTE ═════════════════════════════════════════════════
 *
 * « On a le fantôme qui semble perdu dans l'image et pas du tout incorporé. Tu
 * ne pourrais pas uniformiser les photos de couverture de tous les commerces
 * dès le départ de la création, avec le petit fantôme à l'entrée ou quelque
 * part où il serait intégré parfaitement à l'image, de manière à ce que tous
 * les commerces présents sur ClikMe aient la même identité photographique ? »
 *
 * UN FANTOME POSE PAR-DESSUS UNE PHOTO RESTERA TOUJOURS POSE PAR-DESSUS. On a
 * essayé de l'y fondre — halo, flaque de lumière, base effacée dans le pavé —
 * et c'est ce qu'il a regardé en disant « perdu dans l'image ». La lumière
 * d'une photo, sa perspective, ses ombres ne se calculent pas dans une feuille
 * de style : elles se RENDENT. Exactement la leçon de l'essayage.
 *
 * LA PHOTO EST DONC REFAITE UNE FOIS, A LA CREATION, PAR LE MEME MOTEUR QUE
 * L'ESSAYAGE (Gemini d'abord, OpenAI en repli). Sa propre devanture reste la
 * sienne — même façade, même enseigne, même point de vue —, la lumière passe à
 * l'heure dorée, et les fantômes ClikMe y prennent place comme s'ils y avaient
 * toujours été : à la porte pour accueillir, à une table, devant l'étal.
 *
 * ═══ CE QU'ON NE FAIT PAS ══════════════════════════════════════════════════
 *
 * ON NE FABRIQUE PAS DE DEVANTURE A UN COMMERCE QUI N'A AUCUNE PHOTO. « Si
 * elle n'existe pas, en créer une » : une façade inventée, présentée sur la
 * page qui porte son nom, enverrait ses clients chercher une porte qui n'existe
 * pas. Sans photo, la page garde le décor de son métier, et c'est le
 * commerçant qui peut déposer la sienne — à l'inscription ou depuis sa page.
 *
 * ON NE TOUCHE PAS A SON ENSEIGNE. Un nom mal recopié sur l'auvent, c'est son
 * nom mal écrit, en grand, sur sa propre page. La consigne l'interdit en
 * toutes lettres, et les photos d'origine restent visibles dans « Le lieu en
 * images » : la photo ClikMe est une couverture, pas une preuve.
 *
 * ═══ CE QUE ÇA COÛTE, ET OU C'EST BORNE ═══════════════════════════════════
 *
 * Quelques centimes par rendu. UNE couverture par commerce à la création ;
 * quelques essais de plus s'il veut en changer (`ESSAIS_MAX`) ; et un plafond
 * par jour pour tout le site (`COUVERTURE_PAR_JOUR`). L'état vit dans le
 * `diagnostic` du site — aucune migration à appliquer — et l'image dans le
 * stockage public de Supabase.
 *
 * FICHIER SERVEUR.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import { moteursDImage, moteurRefuse, noterRefus } from "@/lib/direct/moteur-image";
import type { CleMetier } from "@/lib/direct/apercu-habitant";

const s = (v: unknown) => (v == null ? "" : String(v)).trim();

/** Où dort l'image. Le seau public existant, sous un dossier à elle. */
const SEAU = s(process.env.COUVERTURE_BUCKET) || "marketplace-privilege-offers";
const DOSSIER = "couvertures-clikme";
/** Combien de rendus un même commerce peut demander, la création comprise. */
export const ESSAIS_MAX = Number(process.env.COUVERTURE_ESSAIS_MAX) || 4;
const PAR_JOUR = Number(process.env.COUVERTURE_PAR_JOUR) || 120;
/** Un rendu « en cours » depuis plus longtemps que ça est mort en route. */
const EN_COURS_PERIME_MS = 6 * 60_000;
/** Le rendu doit laisser le temps d'écrire la réponse avant la coupure. */
const DELAI_RENDU_MS = 200_000;

export type EtatCouverture = {
  /**
   * `en_cours` : le moteur travaille. `prete` : `url` est la couverture.
   * `echec` : le dernier rendu n'a pas abouti (`erreur` dit pourquoi).
   * `originale` : il a choisi de garder sa photo telle quelle.
   */
  etat: "en_cours" | "prete" | "echec" | "originale";
  url?: string;
  /** L'adresse de la photo de départ — celle qu'on a transformée. */
  source?: string;
  at: string;
  essais: number;
  modele?: string;
  erreur?: string;
  /** Quand le dernier rendu a été LANCÉ — c'est ce que compte le plafond du jour. */
  lance?: string;
  /**
   * LA PHOTO DE DEVANTURE QU'IL A ENVOYÉE DEPUIS SA PAGE, rangée dans le
   * stockage. Elle passe en tête des photos de départ.
   */
  depot?: string;
};

/** L'état rangé dans le diagnostic, s'il y en a un et qu'il est lisible. */
export function couvertureDuDiagnostic(diag: unknown): EtatCouverture | null {
  const d = diag && typeof diag === "object" ? (diag as Record<string, unknown>) : {};
  const c = d.couverture && typeof d.couverture === "object" ? (d.couverture as Record<string, unknown>) : null;
  if (!c) return null;
  const etat = s(c.etat);
  if (!["en_cours", "prete", "echec", "originale"].includes(etat)) return null;
  return {
    etat: etat as EtatCouverture["etat"],
    url: s(c.url) || undefined,
    source: s(c.source) || undefined,
    at: s(c.at),
    essais: Number(c.essais) || 0,
    modele: s(c.modele) || undefined,
    erreur: s(c.erreur) || undefined,
    lance: s(c.lance) || undefined,
    depot: s(c.depot) || undefined,
  };
}

/**
 * ═══ CE QUE FONT LES FANTOMES, METIER PAR METIER ═══════════════════════════
 *
 * SES DEUX EXEMPLES DISENT LA REGLE : au café, deux fantômes prennent un café
 * en terrasse et un troisième accueille à la porte ; chez le fleuriste, l'un
 * emballe un bouquet, l'autre s'en émerveille, un troisième salue du fond de la
 * boutique. Toujours UN à l'entrée qui accueille — c'est le rôle que la page
 * lui donne — et les autres font ce qu'on vient faire chez lui.
 *
 * « SI LA PHOTO LE PERMET » EST ECRIT A CHAQUE FOIS. Une devanture sans
 * terrasse ne doit pas en recevoir une : on ajoute des fantômes, pas des
 * tables.
 */
const SCENES: Record<CleMetier, string> = {
  restaurant:
    "One ghost stands in the open entrance door, waving to welcome guests. If the photo shows a terrace or outdoor tables, two more ghosts sit at a table in the foreground, enjoying a coffee or a dish.",
  bar:
    "One ghost waves from the entrance door. If the photo shows a terrace or outdoor tables, two more ghosts sit at a table in the foreground and raise their glasses together.",
  fleuriste:
    "In front of the shop, one ghost wearing a florist apron wraps a bouquet in kraft paper on a wooden table, while a second ghost admires it with delight. A third, smaller ghost waves from inside the open door.",
  coiffeur:
    "One ghost stands at the entrance door, waving to welcome clients. Through the window, a second ghost sits in a salon chair, delighted with its fresh haircut.",
  ongles:
    "One ghost stands at the entrance door, waving to welcome clients. Near the window, a second ghost proudly shows its freshly painted nails.",
  mode:
    "One ghost stands at the entrance door, waving, holding a small shopping bag. A second ghost looks at the window display with wonder.",
  artisan:
    "One ghost stands at the entrance door, waving to welcome visitors. A second ghost admires the handmade pieces displayed in the window.",
  lunetier:
    "One ghost stands at the entrance door, waving to welcome clients. Near the window, a second ghost tries on a pair of glasses and smiles at its reflection.",
};

/**
 * ═══ LA CONSIGNE ═══════════════════════════════════════════════════════════
 *
 * EN ANGLAIS, PARCE QUE C'EST LA LANGUE QUE CES MODELES SUIVENT LE PLUS
 * FIDELEMENT pour les interdits de détail — et l'interdit qui compte le plus
 * ici est un détail : ne pas toucher une lettre de son enseigne.
 *
 * L'ORDRE EST CELUI DES PRIORITES : le lieu d'abord (il doit se reconnaître),
 * l'enseigne ensuite (elle ne doit pas changer), la lumière, puis seulement les
 * fantômes. Un rendu magnifique d'un autre restaurant serait un échec complet.
 */
export function consigneCouverture(nom: string, metier: string, ville: string, branche: CleMetier): string {
  const lieu = [nom && `"${nom}"`, metier && `a ${metier.toLowerCase()}`, ville && `in ${ville}`].filter(Boolean).join(", ");
  return [
    `Transform IMAGE 1 (the real photo of ${lieu || "a local shop"}) into the ClikMe photographic signature: a warm, enchanting, premium photo where the ClikMe ghosts from IMAGE 2 are part of the scene.`,
    "",
    "1. KEEP THE PLACE. Same building, same architecture, same shopfront, same awning and colours, same terrace layout, same camera viewpoint. Someone who knows this place must recognise it at first glance.",
    "2. KEEP EVERY SIGN EXACTLY. Every word on the sign, awning or windows stays exactly as in IMAGE 1: same spelling, same letters, same position. Never invent, translate, correct or add any text, logo or brand. If a text is unreadable in IMAGE 1, leave it unreadable rather than guessing.",
    "3. LIGHT AND COLOUR. Late-afternoon golden hour: warm sunlight on the facade, glowing warm lamps inside, rich and luminous but natural colours, soft depth of field, crisp details. Tidy the street (bins, cars, clutter) only where it does not alter the building.",
    `4. THE GHOSTS. Use the ghost character from IMAGE 2: a soft white rounded ghost, big glossy purple eyes, pink cheeks, a black cap with the pink ClikMe logo. ${SCENES[branche] ?? SCENES.restaurant} They must truly belong to the photo: realistic scale next to doors and furniture, matching perspective, light direction and colour temperature, soft contact shadows, reflections in windows where relevant. Cute, friendly, polished 3D finish; every ghost is the same character.`,
    "5. PEOPLE. Real people already present may stay, unchanged and not in focus. Do not add any new person.",
    "6. FRAMING. Vertical 4:5 framing centred on the entrance. Keep the top fifth calm (facade or sky), because a title is written over it.",
    "No watermark, no border, no caption, no added text.",
  ].join("\n");
}

/** `data:image/jpeg;base64,…` → les deux morceaux qu'attendent les API. */
function decoder(src: string): { type: string; donnees: string } | null {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(src.trim());
  return m ? { type: m[1], donnees: m[2] } : null;
}

/**
 * LE FANTOME DE REFERENCE, LU SUR LE DISQUE DU SERVEUR.
 *
 * C'est la mascotte à casquette ClikMe, la même que sur ses deux exemples — et
 * pas le double en tenue de métier : la photo ClikMe est la signature de la
 * marque, commune à tous les commerces. Le fichier est déclaré à
 * `outputFileTracingIncludes` : sans ça, il manquerait en production.
 */
let fantome: { type: string; donnees: string } | null = null;
function leFantome(): { type: string; donnees: string } {
  if (!fantome) {
    const octets = readFileSync(join(process.cwd(), "public", "clikme-fantome.png"));
    fantome = { type: "image/png", donnees: octets.toString("base64") };
  }
  return fantome;
}

/**
 * LIT LA PHOTO DE DEPART, D'OU QU'ELLE VIENNE.
 *
 * Déposée par lui : elle est déjà là, en `data:`. Venue de Google : on la
 * demande à NOTRE route `/api/photo-fiche`, qui sait déjà quelles écritures
 * essayer, avec quels en-têtes, et qui garde la liste fermée des hôtes — on
 * ne réécrit pas une seconde porte vers l'extérieur.
 */
async function lireSource(src: string, origine: string): Promise<{ type: string; donnees: string } | null> {
  const d = decoder(src);
  if (d) return d;
  let adresse = "";
  // NOTRE PROPRE STOCKAGE (une photo qu'il a envoyée) se lit directement :
  // ce n'est pas une adresse de Google, la route photo-fiche la refuserait.
  const stockage = `${s(process.env.NEXT_PUBLIC_SUPABASE_URL)}/storage/v1/object/public/`;
  if (s(process.env.NEXT_PUBLIC_SUPABASE_URL) && src.startsWith(stockage)) adresse = src;
  else if (/^https?:\/\//i.test(src)) adresse = `${origine}/api/photo-fiche?u=${encodeURIComponent(src)}`;
  else if (src.startsWith("/")) adresse = `${origine}${src}`;
  if (!adresse) return null;
  try {
    const r = await fetch(adresse, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    const type = r.headers.get("content-type") || "";
    if (!r.ok || !type.startsWith("image/")) return null;
    const octets = Buffer.from(await r.arrayBuffer());
    if (octets.length < 2_000 || octets.length > 8_000_000) return null;
    return { type: type.split(";")[0], donnees: octets.toString("base64") };
  } catch {
    return null;
  }
}

type PartieGemini = { text?: string; inlineData?: { mimeType?: string; data?: string } };

/**
 * ═══ QUELLE PHOTO EST SA DEVANTURE ? ══════════════════════════════════════
 *
 * LA PREMIERE PHOTO D'UNE FICHE GOOGLE N'EST PAS TOUJOURS LA FACADE. Chez un
 * restaurant, c'est souvent une assiette ; et « un fantôme qui accueille à la
 * porte » posé sur une entrecôte ne veut rien dire. On montre donc les
 * premières photos à un modèle qui VOIT, et il désigne celle qui montre
 * l'extérieur et l'entrée. Une fraction de centime, et la couverture part du
 * bon endroit.
 *
 * SANS REPONSE CLAIRE, LA PREMIERE. C'est celle que Google met en avant — et
 * celle qu'il a déposée lui-même passe toujours en tête.
 */
async function choisirLaDevanture(
  photos: { type: string; donnees: string }[],
  cle: string,
): Promise<number> {
  if (photos.length < 2 || !cle) return 0;
  const base = s(process.env.GEMINI_BASE_URL) || "https://generativelanguage.googleapis.com";
  const modele = s(process.env.GEMINI_VISION_MODEL) || "gemini-2.5-flash";
  const parts: PartieGemini[] = [];
  photos.forEach((p, i) => {
    parts.push({ text: `PHOTO ${i}` }, { inlineData: { mimeType: p.type, data: p.donnees } });
  });
  parts.push({
    text: 'Which photo best shows the OUTSIDE of the shop: its facade, shopfront or entrance seen from the street? Answer only with JSON like {"index": 2}. If none shows the outside, answer {"index": -1}.',
  });
  try {
    const r = await fetch(`${base}/v1beta/models/${modele}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": cle },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!r.ok) return 0;
    const j = (await r.json()) as { candidates?: { content?: { parts?: PartieGemini[] } }[] };
    const texte = (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    const n = Number((/"index"\s*:\s*(-?\d+)/.exec(texte) ?? [])[1]);
    return Number.isInteger(n) && n >= 0 && n < photos.length ? n : 0;
  } catch {
    return 0;
  }
}

async function parGemini(
  cle: string,
  photo: { type: string; donnees: string },
  consigne: string,
): Promise<{ image: { type: string; donnees: string }; modele: string } | { erreur: string }> {
  const modele = s(process.env.GEMINI_IMAGE_MODEL) || "gemini-2.5-flash-image";
  const base = s(process.env.GEMINI_BASE_URL) || "https://generativelanguage.googleapis.com";
  const ref = leFantome();
  const corps = (avecFormat: boolean) =>
    JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: "IMAGE 1 — THE REAL PLACE. This is the shop to keep, recognisable." },
            { inlineData: { mimeType: photo.type, data: photo.donnees } },
            { text: "IMAGE 2 — THE CLIKME GHOST. Character reference only: its background is not part of the result." },
            { inlineData: { mimeType: ref.type, data: ref.donnees } },
            { text: consigne },
          ],
        },
      ],
      // LE FORMAT VERTICAL EST DEMANDE, ET RETIRE S'IL EST REFUSE : un modèle
      // qui ne connaît pas `imageConfig` répond 400 en le nommant, et une
      // couverture carrée vaut mieux que pas de couverture.
      generationConfig: avecFormat
        ? { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "4:5" } }
        : { responseModalities: ["IMAGE", "TEXT"] },
    });
  const appeler = (avecFormat: boolean) =>
    fetch(`${base}/v1beta/models/${modele}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": cle },
      body: corps(avecFormat),
      signal: AbortSignal.timeout(DELAI_RENDU_MS),
    });
  let r = await appeler(true);
  if (r.status === 400) r = await appeler(false);
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    return { erreur: `Gemini a répondu ${r.status}${txt ? ` : ${txt.slice(0, 200)}` : ""}` };
  }
  const j = (await r.json()) as { candidates?: { content?: { parts?: PartieGemini[] } }[] };
  for (const p of j.candidates?.[0]?.content?.parts ?? []) {
    const d = p.inlineData?.data;
    if (d) return { image: { type: p.inlineData?.mimeType || "image/png", donnees: d }, modele };
  }
  return { erreur: "Gemini n'a pas rendu d'image." };
}

async function parOpenAI(
  cle: string,
  photo: { type: string; donnees: string },
  consigne: string,
): Promise<{ image: { type: string; donnees: string }; modele: string } | { erreur: string }> {
  const base = s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
  const ref = leFantome();
  const fichier = (p: { type: string; donnees: string }, nom: string) =>
    new File([Buffer.from(p.donnees, "base64")], nom, { type: p.type });
  const erreurs: string[] = [];
  for (const modele of (await moteursDImage(cle, base)).liste) {
    const forme = new FormData();
    forme.append("model", modele);
    forme.append("image[]", fichier(photo, `lieu.${photo.type.split("/")[1] || "jpg"}`));
    forme.append("image[]", fichier(ref, "fantome.png"));
    forme.append("prompt", `IMAGE 1 is the real place; IMAGE 2 is the ClikMe ghost (character reference only).\n${consigne}`);
    forme.append("size", "1024x1536");
    forme.append("quality", s(process.env.OPENAI_IMAGE_QUALITY) || "high");
    const r = await fetch(`${base}/v1/images/edits`, {
      method: "POST",
      headers: { authorization: `Bearer ${cle}` },
      body: forme,
      signal: AbortSignal.timeout(DELAI_RENDU_MS),
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      if (moteurRefuse(r.status, txt)) {
        noterRefus(modele);
        erreurs.push(`${modele} refusé`);
        continue;
      }
      return { erreur: `OpenAI a répondu ${r.status}${txt ? ` : ${txt.slice(0, 200)}` : ""}` };
    }
    const j = (await r.json()) as { data?: { b64_json?: string }[] };
    const b64 = j.data?.[0]?.b64_json;
    if (b64) return { image: { type: "image/png", donnees: b64 }, modele };
    return { erreur: "OpenAI n'a pas rendu d'image." };
  }
  return { erreur: erreurs.join(" ; ") || "Aucun moteur OpenAI disponible." };
}

/** Gemini d'abord, OpenAI ensuite — la même règle que l'essayage. */
async function rendre(
  photo: { type: string; donnees: string },
  consigne: string,
): Promise<{ image: { type: string; donnees: string }; modele: string } | { erreur: string }> {
  const gemini = s(process.env.GEMINI_API_KEY) || s(process.env.GOOGLE_API_KEY);
  const openai = s(process.env.OPENAI_API_KEY);
  if (!gemini && !openai) return { erreur: "Aucune clé d'image (GEMINI_API_KEY ou OPENAI_API_KEY) sur ce serveur." };
  const ordre = s(process.env.COUVERTURE_FOURNISSEUR).toLowerCase() === "openai" ? ["openai", "gemini"] : ["gemini", "openai"];
  const erreurs: string[] = [];
  for (const f of ordre) {
    try {
      const r = f === "gemini" ? (gemini ? await parGemini(gemini, photo, consigne) : null) : openai ? await parOpenAI(openai, photo, consigne) : null;
      if (!r) continue;
      if ("image" in r) return r;
      erreurs.push(r.erreur);
    } catch (e) {
      erreurs.push(`${f} : ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { erreur: erreurs.join(" | ").slice(0, 400) };
}

/** Les photos qu'on peut transformer : les siennes d'abord, puis celles de Google. */
export function photosCandidates(row: Record<string, unknown>): string[] {
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  const siennes = (Array.isArray(row.gallery_photos) ? row.gallery_photos : []).map(s).filter((u) => /^data:image\//i.test(u));
  const google = (Array.isArray(diag.photos) ? diag.photos : []).map(s).filter((u) => /^https?:\/\//i.test(u));
  const depot = couvertureDuDiagnostic(diag)?.depot;
  return [...new Set([...(depot ? [depot] : []), ...siennes, ...google])].slice(0, 12);
}

async function ecrireEtat(id: string, diag: Record<string, unknown>, etat: EtatCouverture): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("human_vitrine_sites")
    .update({ diagnostic: { ...diag, couverture: etat } })
    .eq("id", id);
}

export type Demande = {
  /**
   * LE RANG d'une photo dans `photosCandidates` ; sinon on choisit la devanture.
   * Un rang et pas une adresse : ses photos à lui voyagent en `data:`, et on
   * ne fait pas remonter un mégaoctet pour désigner une image que le serveur a
   * déjà.
   */
  source?: number;
  /** Refaire même si une couverture est prête (compte comme un essai). */
  refaire?: boolean;
  /** Revenir à la photo d'origine, sans rendu. */
  originale?: boolean;
  /** Reprendre la couverture ClikMe déjà faite, après être revenu à l'originale. */
  reprendre?: boolean;
  /**
   * UNE PHOTO DE SA DEVANTURE, ENVOYÉE DEPUIS SA PAGE (`data:`, déjà réduite
   * par le navigateur). Elle est rangée, puis transformée tout de suite.
   */
  depot?: string;
};

/** LA COUVERTURE QU'ON MONTRE : une image faite, sauf s'il a choisi l'originale. */
export function couvertureAffichee(e: EtatCouverture | null): string | undefined {
  return e?.url && e.etat !== "originale" ? e.url : undefined;
}

export type Preparation = {
  etat: EtatCouverture | null;
  raison?: string;
  /**
   * LE RENDU LUI-MEME, A LANCER APRES AVOIR REPONDU. Présent seulement quand il
   * y a vraiment quelque chose à faire : la route le confie à `after()`, et
   * l'écran interroge l'état pendant ce temps — un téléphone qui perd le
   * réseau au bout de quarante secondes ne fait pas perdre le rendu.
   */
  travail?: () => Promise<{ etat: EtatCouverture | null; raison?: string }>;
};

/**
 * ═══ PREPARE LA COUVERTURE D'UN SITE, OU DIT POURQUOI PAS ═════════════════
 *
 * IDEMPOTENTE TANT QU'ON NE DEMANDE PAS DE REFAIRE : appelée deux fois — par
 * l'inscription puis par la page —, elle ne paie qu'un rendu. Un rendu « en
 * cours » depuis plus de six minutes est réputé mort et peut être relancé.
 */
export async function preparerCouverture(
  slug: string,
  origine: string,
  demande: Demande = {},
): Promise<Preparation> {
  if (!/^[a-z0-9-]{2,120}$/i.test(slug)) return { etat: null, raison: "adresse illisible" };
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, business_name, city, activite, diagnostic, gallery_photos")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? null;
  if (!row) return { etat: null, raison: "site introuvable" };
  const id = s(row.id);
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  const avant = couvertureDuDiagnostic(diag);
  const maintenant = new Date().toISOString();

  if (demande.originale) {
    const etat: EtatCouverture = { ...avant, essais: avant?.essais ?? 0, etat: "originale", at: maintenant };
    await ecrireEtat(id, diag, etat);
    return { etat };
  }
  if (demande.reprendre && avant?.url) {
    const etat: EtatCouverture = { ...avant, etat: "prete", at: maintenant };
    await ecrireEtat(id, diag, etat);
    return { etat };
  }
  if (avant?.etat === "en_cours" && Date.now() - Date.parse(avant.at) < EN_COURS_PERIME_MS) {
    return { etat: avant, raison: "déjà en cours" };
  }
  const designee = typeof demande.source === "number" || Boolean(demande.depot);
  if (avant?.etat === "prete" && !demande.refaire && !designee) return { etat: avant };
  if (avant?.etat === "originale" && !demande.refaire && !designee) return { etat: avant };
  const essais = avant?.essais ?? 0;
  if (essais >= ESSAIS_MAX) return { etat: avant, raison: `plafond de ${ESSAIS_MAX} rendus atteint pour ce commerce` };

  /**
   * ═══ LA PHOTO QU'IL ENVOIE DEPUIS SA PAGE ═══════════════════════════════
   *
   * « J'ai rentré un restaurant et le résultat est le même qu'avant. » Sa
   * fiche n'avait aucune photo utilisable : rien à transformer, donc rien de
   * fait — et rien ne le lui disait. Il peut maintenant envoyer la photo de sa
   * devanture d'où il est, et c'est elle qui part.
   */
  let depot = avant?.depot;
  if (demande.depot) {
    const d = decoder(demande.depot);
    if (!d || d.donnees.length > 6_000_000) return { etat: avant, raison: "photo illisible ou trop lourde" };
    const ext = d.type.includes("png") ? "png" : d.type.includes("webp") ? "webp" : "jpg";
    const cheminDepot = `${DOSSIER}/depots/${slug}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from(SEAU)
      .upload(cheminDepot, Buffer.from(d.donnees, "base64"), { contentType: d.type, upsert: true });
    if (error) return { etat: avant, raison: `stockage : ${error.message}` };
    depot = supabase.storage.from(SEAU).getPublicUrl(cheminDepot).data.publicUrl;
  }
  const candidates = [...new Set([...(depot ? [depot] : []), ...photosCandidates(row)])];
  if (!candidates.length) return { etat: avant, raison: "aucune photo de départ" };
  if (demande.depot) demande = { ...demande, source: 0 };

  // LE PLAFOND DU JOUR, POUR TOUT LE SITE. Compté sur les rendus lancés.
  try {
    const depuis = new Date(Date.now() - 24 * 3_600_000).toISOString();
    const { count } = await supabase
      .from("human_vitrine_sites")
      .select("id", { count: "exact", head: true })
      .gte("diagnostic->couverture->>lance", depuis);
    if ((count ?? 0) >= PAR_JOUR) return { etat: avant, raison: "plafond du jour atteint" };
  } catch {
    /* compteur illisible : on continue, le plafond par commerce tient */
  }

  // ON POSE « EN COURS » AVANT DE PAYER, pour qu'un second appel n'en lance pas un autre.
  const enCours: EtatCouverture = { ...avant, depot, etat: "en_cours", at: maintenant, essais: essais + 1, lance: maintenant };
  await ecrireEtat(id, diag, enCours);

  const avecDepot = avant || depot ? { ...(avant ?? { etat: "echec" as const, at: maintenant, essais: 0 }), depot } : null;
  return { etat: enCours, travail: () => rendreEtRanger(slug, origine, demande, row, diag, avecDepot, candidates, maintenant) };
}

async function rendreEtRanger(
  slug: string,
  origine: string,
  demande: Demande,
  row: Record<string, unknown>,
  diag: Record<string, unknown>,
  avant: EtatCouverture | null,
  candidates: string[],
  maintenant: string,
): Promise<{ etat: EtatCouverture | null; raison?: string }> {
  const supabase = createAdminClient();
  const id = s(row.id);
  const essais = avant?.essais ?? 0;

  const echouer = async (erreur: string) => {
    // UN NOUVEL ECHEC NE FAIT PAS PERDRE UNE COUVERTURE DEJA PRETE.
    const etat: EtatCouverture = {
      ...avant,
      etat: avant?.url && avant.etat === "prete" ? "prete" : "echec",
      at: new Date().toISOString(),
      essais: essais + 1,
      lance: maintenant,
      erreur,
    };
    await ecrireEtat(id, diag, etat);
    console.warn("[couverture]", JSON.stringify({ slug, erreur }));
    return { etat, raison: erreur };
  };

  // LA PHOTO DE DEPART : celle qu'il a désignée, sinon la devanture parmi les premières.
  let source = typeof demande.source === "number" ? (candidates[demande.source] ?? "") : "";
  let photo: { type: string; donnees: string } | null = null;
  if (source) {
    photo = await lireSource(source, origine);
  } else {
    const lues: { src: string; p: { type: string; donnees: string } }[] = [];
    for (const src of candidates.slice(0, 6)) {
      const p = await lireSource(src, origine);
      if (p) lues.push({ src, p });
    }
    if (lues.length) {
      const cle = s(process.env.GEMINI_API_KEY) || s(process.env.GOOGLE_API_KEY);
      const i = await choisirLaDevanture(lues.map((l) => l.p), cle);
      source = lues[i].src;
      photo = lues[i].p;
    }
  }
  if (!photo) return echouer("la photo de départ n'a pas pu être lue");

  const nom = s(row.business_name);
  const metier = s(row.activite);
  const branche = brancheDuMetier(metier);
  const r = await rendre(photo, consigneCouverture(nom, metier, s(row.city), branche));
  if ("erreur" in r) return echouer(r.erreur);

  const ext = r.image.type.includes("jpeg") ? "jpg" : r.image.type.includes("webp") ? "webp" : "png";
  const chemin = `${DOSSIER}/${slug}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(SEAU)
    .upload(chemin, Buffer.from(r.image.donnees, "base64"), { contentType: r.image.type, upsert: true });
  if (error) return echouer(`stockage : ${error.message}`);
  const url = supabase.storage.from(SEAU).getPublicUrl(chemin).data.publicUrl;

  const etat: EtatCouverture = {
    etat: "prete",
    url,
    // L'ADRESSE DE DEPART, PAS LA PHOTO. Une photo déposée voyage en `data:` —
    // des centaines de kilo-octets que la page relirait à chaque visite, dans
    // le diagnostic. On note d'où elle vient, et c'est tout ce qu'il faut.
    source: source.startsWith("data:") ? "photo déposée" : source,
    at: new Date().toISOString(),
    essais: essais + 1,
    lance: maintenant,
    modele: r.modele,
    depot: avant?.depot,
  };
  // ON RELIT LE DIAGNOSTIC AVANT D'ECRIRE : le rendu a duré, quelqu'un a pu y toucher.
  const { data: frais } = await supabase.from("human_vitrine_sites").select("diagnostic").eq("id", id).maybeSingle();
  const diagFrais = ((frais as Record<string, unknown> | null)?.diagnostic ?? diag) as Record<string, unknown>;
  await ecrireEtat(id, diagFrais, etat);
  return { etat };
}

/** Les deux temps d'un coup — pour qui peut attendre (l'inscription, en arrière-plan). */
export async function fabriquerCouverture(slug: string, origine: string, demande: Demande = {}) {
  const p = await preparerCouverture(slug, origine, demande);
  return p.travail ? p.travail() : { etat: p.etat, raison: p.raison };
}
