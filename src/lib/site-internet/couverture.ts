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
import sharp from "sharp";
import { join } from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import { moteursDImage, moteurRefuse, noterRefus } from "@/lib/direct/moteur-image";
import type { CleMetier } from "@/lib/direct/apercu-habitant";
import { tenueDu } from "@/lib/direct/double-metiers";

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
  /**
   * OÙ SE TIENT L'HÔTE SUR LA PHOTO, en fractions de l'image (0 à 1). C'est là
   * qu'on le touche pour entrer, et c'est de là que part le zoom à travers la
   * porte. Repéré par un modèle qui voit, juste après le rendu.
   */
  hote?: { x: number; y: number; w: number; h: number };
  /** La photo sur laquelle on a cherché l'hôte, et combien de fois. */
  hoteCherche?: string;
  hoteEssais?: number;
  hoteAt?: string;
  /** Pourquoi le dernier repérage n'a rien donné — lu dans l'administration. */
  hoteErreur?: string;
  /** Posé à la main dans l'administration : le modèle ne le remplace plus. */
  hoteMain?: boolean;
  /**
   * LA MÊME PHOTO, SANS LUI — l'entrée vide, là où il était peint.
   *
   * « On a le fantôme propriétaire et tout à coup un autre fantôme qui se
   * superpose, au lieu d'avoir le même fantôme qui s'anime. » Ses poses posées
   * par-dessus son portrait peint laissaient dépasser un bras, une ombre : deux
   * fantômes. Sur cette photo-là il n'y en a plus qu'un — le sien, animé, posé
   * par la page à sa place dès l'arrivée.
   */
  sansHote?: string;
  /** Pour quelle photo et quel cadre elle a été faite — un autre cadre la refait. */
  sansHotePour?: string;
  sansHoteEssais?: number;
  sansHoteAt?: string;
  sansHoteErreur?: string;
};

/**
 * TROIS ESSAIS, À DIX MINUTES D'ÉCART. Un seul essai par photo, c'était un
 * fantôme intouchable pour toujours dès que le modèle avait hésité une fois —
 * ce qui est arrivé sur la toute première vraie inscription.
 */
const HOTE_ESSAIS_MAX = 3;
const HOTE_ECART_MS = 10 * 60_000;

function lireBoite(v: unknown): EtatCouverture["hote"] {
  const b = v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  if (!b) return undefined;
  const n = (k: string) => Number(b[k]);
  const [x, y, w, h] = [n("x"), n("y"), n("w"), n("h")];
  return [x, y, w, h].every((z) => Number.isFinite(z) && z >= 0 && z <= 1) && w > 0.02 && h > 0.02 ? { x, y, w, h } : undefined;
}

/**
 * ═══ OÙ EST L'HÔTE ? ══════════════════════════════════════════════════════
 *
 * « Le meilleur wow serait que le fantôme te fasse entrer dans le restaurant :
 * au toucher, il pousse la porte, et la photo zoome à travers. »
 *
 * SUR LA PHOTO CLIKME, L'HÔTE EST PEINT DANS L'IMAGE — et sa place change à
 * chaque rendu. Pour qu'on puisse le toucher, et que le zoom parte de lui, on
 * demande une fois à un modèle qui voit où il se tient. Il répond une boîte en
 * millièmes de l'image (`box_2d`, le format qu'il connaît le mieux). Sans
 * réponse claire, rien n'est rangé : la page passe alors par son bouton.
 */
/** La dernière raison d'un repérage vide — voir `hoteErreur`. */
let raisonHote = "";

async function trouverLHote(image: { type: string; donnees: string }): Promise<EtatCouverture["hote"]> {
  raisonHote = "";
  // D'ABORD L'HÔTE EN TENUE ; S'IL NE LE RECONNAÎT PAS, le fantôme le plus près
  // de l'entrée — c'est là que la consigne de la photo le place.
  return (
    (await chercherUneBoite(
      image,
      'In this picture, find the ghost mascot who is the HOST of the shop. The customer ghosts sit at tables or browse, and their caps show the shop name embroidered in letters. The HOST is standing, usually in the open doorway, at the entrance or behind the counter, often waving, and the front of its cap shows a small trade emblem (fork, scissors, flower...) instead of letters. Answer only with JSON {"box_2d":[ymin,xmin,ymax,xmax]} normalised to 0-1000, the box tightly around the whole host ghost from cap to bottom. If there is no such ghost, answer {"box_2d":[]}.',
    )) ??
    (await chercherUneBoite(
      image,
      'In this picture there are small cute white ghost mascots. Find the one standing closest to the door or entrance (if unsure, the largest one). Answer only with JSON {"box_2d":[ymin,xmin,ymax,xmax]} normalised to 0-1000. If there is no ghost at all, answer {"box_2d":[]}.',
    ))
  );
}

async function chercherUneBoite(image: { type: string; donnees: string }, question: string): Promise<EtatCouverture["hote"]> {
  const cle = s(process.env.GEMINI_API_KEY) || s(process.env.GOOGLE_API_KEY);
  if (!cle) {
    raisonHote = "aucune clé Gemini sur le serveur";
    return undefined;
  }
  const base = s(process.env.GEMINI_BASE_URL) || "https://generativelanguage.googleapis.com";
  const modele = s(process.env.GEMINI_VISION_MODEL) || "gemini-2.5-flash";
  try {
    const r = await fetch(`${base}/v1beta/models/${modele}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": cle },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: image.type, data: image.donnees } },
              { text: question },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!r.ok) {
      raisonHote = `le modèle a répondu ${r.status} : ${(await r.text().catch(() => "")).slice(0, 160)}`;
      return undefined;
    }
    const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const texte = (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    raisonHote = `le modèle n'a pas trouvé l'hôte (réponse : ${texte.slice(0, 120) || "vide"})`;
    const m = /"box_2d"\s*:\s*\[\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*\]/.exec(texte);
    if (!m) return undefined;
    const [ymin, xmin, ymax, xmax] = m.slice(1).map((v) => Number(v) / 1000);
    return lireBoite({ x: xmin, y: ymin, w: xmax - xmin, h: ymax - ymin });
  } catch (e) {
    raisonHote = `appel au modèle impossible : ${e instanceof Error ? e.message : "erreur"}`;
    return undefined;
  }
}

/**
 * L'HÔTE PAS ENCORE REPÉRÉ — photo faite avant cette étape, ou modèle qui a
 * hésité au rendu : la page le redemande après s'être affichée, jusqu'à
 * trois fois par photo, à dix minutes d'écart.
 */
export async function completerLHote(slug: string): Promise<void> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, diagnostic")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? null;
  if (!row) return;
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  const etat = couvertureDuDiagnostic(diag);
  if (!etat || !hoteACherche(etat)) return;
  // ON NOTE L'ESSAI AVANT DE PAYER : deux visites rapprochées n'en paient qu'un.
  const essais = etat.hoteCherche === etat.url ? (etat.hoteEssais ?? 1) + 1 : 1;
  await ecrireEtat(s(row.id), diag, { ...etat, hoteCherche: etat.url, hoteEssais: essais, hoteAt: new Date().toISOString() });
  let image: { type: string; donnees: string } | null = null;
  let raison = "";
  try {
    const r = await fetch(s(etat.url), { signal: AbortSignal.timeout(20_000) });
    if (r.ok) image = { type: (r.headers.get("content-type") || "image/png").split(";")[0], donnees: Buffer.from(await r.arrayBuffer()).toString("base64") };
    else raison = `photo ClikMe illisible (${r.status})`;
  } catch (e) {
    image = null;
    raison = `photo ClikMe illisible : ${e instanceof Error ? e.message : "erreur"}`;
  }
  const hote = image ? await trouverLHote(image) : undefined;
  if (!hote) raison = raison || raisonHote || "rien trouvé";
  const { data: frais } = await supabase.from("human_vitrine_sites").select("diagnostic").eq("id", s(row.id)).maybeSingle();
  const d2 = ((frais as Record<string, unknown> | null)?.diagnostic ?? diag) as Record<string, unknown>;
  const e2 = couvertureDuDiagnostic(d2);
  // POSÉ À LA MAIN ENTRE-TEMPS : le modèle ne repasse pas par-dessus.
  if (!e2 || e2.url !== etat.url || e2.hoteMain) return;
  // L'ÉCHEC AUSSI EST ÉCRIT : c'est ce que l'administration montre.
  await ecrireEtat(s(row.id), d2, hote ? { ...e2, hote, hoteCherche: etat.url, hoteErreur: undefined } : { ...e2, hoteErreur: raison });
}

/* ═══ LA PHOTO SANS LUI ════════════════════════════════════════════════════
   Le moteur d'image retouche la photo ClikMe : il retire le fantôme
   propriétaire du cadre et prolonge ce qu'il y a derrière — l'embrasure, le
   sol, la salle. Rien d'autre ne doit bouger : la page pose ensuite à la même
   place le fantôme animé, et les coordonnées du cadre restent justes parce
   que le résultat est remis aux dimensions exactes de l'original. */
const RAPPORTS: [string, number][] = [
  ["1:1", 1], ["2:3", 2 / 3], ["3:2", 3 / 2], ["3:4", 3 / 4], ["4:3", 4 / 3],
  ["4:5", 4 / 5], ["5:4", 5 / 4], ["9:16", 9 / 16], ["16:9", 16 / 9],
];

async function effacerLHote(
  image: { type: string; donnees: string },
  hote: { x: number; y: number; w: number; h: number },
): Promise<{ type: string; donnees: string } | { erreur: string }> {
  const cle = s(process.env.GEMINI_API_KEY) || s(process.env.GOOGLE_API_KEY);
  if (!cle) return { erreur: "aucune clé Gemini sur le serveur" };
  const modele = s(process.env.GEMINI_IMAGE_MODEL) || "gemini-2.5-flash-image";
  const base = s(process.env.GEMINI_BASE_URL) || "https://generativelanguage.googleapis.com";
  const brut = Buffer.from(image.donnees, "base64");
  const meta = await sharp(brut).metadata();
  const L = meta.width ?? 0;
  const H = meta.height ?? 0;
  if (!L || !H) return { erreur: "photo ClikMe illisible" };
  const rapport = RAPPORTS.reduce((a, b) => (Math.abs(b[1] - L / H) < Math.abs(a[1] - L / H) ? b : a))[0];
  const pc = (v: number) => Math.round(v * 100);
  // UN PEU DE MARGE AUTOUR DU CADRE : un bras levé, une ombre au sol.
  const m = 0.04;
  const zone = {
    x0: Math.max(0, hote.x - m), x1: Math.min(1, hote.x + hote.w + m),
    y0: Math.max(0, hote.y - m), y1: Math.min(1, hote.y + hote.h + m / 2),
  };
  const consigne = [
    "Edit this picture.",
    `In the area from ${pc(zone.x0)}% to ${pc(zone.x1)}% of the width (from the left) and from ${pc(zone.y0)}% to ${pc(zone.y1)}% of the height (from the top) stands a white ghost mascot: the host of the shop.`,
    "Remove that ghost completely — its body, cap, clothes, arms and shadow — and fill the area with what would naturally be behind it: the doorway, the floor, the walls or the interior, continuing the lines, the light and the textures around it.",
    "Change NOTHING else: same framing and size, same colours and light, the same other ghosts exactly where they are, the same signs and letters.",
  ].join(" ");
  const corps = (avecFormat: boolean) =>
    JSON.stringify({
      contents: [{ role: "user", parts: [{ inlineData: { mimeType: image.type, data: image.donnees } }, { text: consigne }] }],
      generationConfig: avecFormat
        ? { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: rapport } }
        : { responseModalities: ["IMAGE", "TEXT"] },
    });
  const appeler = (avecFormat: boolean) =>
    fetch(`${base}/v1beta/models/${modele}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": cle },
      body: corps(avecFormat),
      signal: AbortSignal.timeout(DELAI_RENDU_MS),
    });
  try {
    let r = await appeler(true);
    if (r.status === 400) r = await appeler(false);
    if (!r.ok) return { erreur: `le moteur d'image a répondu ${r.status} : ${(await r.text().catch(() => "")).slice(0, 160)}` };
    const j = (await r.json()) as { candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[] };
    const donnees = (j.candidates?.[0]?.content?.parts ?? []).find((x) => x.inlineData?.data)?.inlineData?.data;
    if (!donnees) return { erreur: "le moteur d'image n'a pas rendu d'image" };
    // AUX DIMENSIONS EXACTES DE L'ORIGINAL : le cadre de l'hôte y retombe juste.
    const remis = await sharp(Buffer.from(donnees, "base64")).resize(L, H, { fit: "fill" }).png().toBuffer();
    return { type: "image/png", donnees: remis.toString("base64") };
  } catch (e) {
    return { erreur: `appel au moteur d'image impossible : ${e instanceof Error ? e.message : "erreur"}` };
  }
}

/** Fait la photo sans hôte pour ce site, si elle manque. Rien ne lève. */
export async function completerSansHote(slug: string): Promise<void> {
  const l = await ligneDuSite(slug);
  const e = l?.etat ?? null;
  if (!l || !e || !sansHoteAFaire(e)) return;
  const pour = empreinte(e);
  const essais = e.sansHotePour === pour ? (e.sansHoteEssais ?? 1) + 1 : 1;
  // ON NOTE L'ESSAI AVANT DE PAYER : deux visites rapprochées n'en paient qu'un.
  await ecrireEtat(l.id, l.diag, { ...e, sansHotePour: pour, sansHoteEssais: essais, sansHoteAt: new Date().toISOString() });
  let image: { type: string; donnees: string } | null = null;
  try {
    const r = await fetch(s(e.url), { signal: AbortSignal.timeout(20_000) });
    if (r.ok) image = { type: (r.headers.get("content-type") || "image/png").split(";")[0], donnees: Buffer.from(await r.arrayBuffer()).toString("base64") };
  } catch {
    image = null;
  }
  const rendu = image ? await effacerLHote(image, e.hote!) : { erreur: "photo ClikMe illisible" };
  let url = "";
  let erreur = "erreur" in rendu ? rendu.erreur : "";
  if (!("erreur" in rendu)) {
    const supabase = createAdminClient();
    const chemin = `${DOSSIER}/${slug}-sans-hote-${Date.now()}.png`;
    const { error } = await supabase.storage
      .from(SEAU)
      .upload(chemin, Buffer.from(rendu.donnees, "base64"), { contentType: "image/png", upsert: true });
    if (error) erreur = `stockage : ${error.message}`;
    else url = supabase.storage.from(SEAU).getPublicUrl(chemin).data.publicUrl;
  }
  // RELU JUSTE AVANT D'ÉCRIRE : un autre cadre a pu être posé entre-temps.
  const frais = await ligneDuSite(slug);
  if (!frais?.etat || empreinte(frais.etat) !== pour) return;
  await ecrireEtat(
    frais.id,
    frais.diag,
    url ? { ...frais.etat, sansHote: url, sansHotePour: pour, sansHoteErreur: undefined } : { ...frais.etat, sansHoteErreur: erreur },
  );
}

/* ═══ L'HÔTE, À LA MAIN — voir `/admin/hote-photo` ══════════════════════════
   « J'ai cliqué sur le fantôme et je n'ai vu aucune animation. » Le repérage
   par le modèle peut échouer — et sans sa place, le fantôme propriétaire ne
   bouge pas. L'administration montre ce qui s'est passé, relance le modèle,
   ou pose la place à la main : on entoure le fantôme sur la photo, c'est
   enregistré, et c'est définitif pour cette photo. */

async function ligneDuSite(slug: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, business_name, diagnostic")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? null;
  if (!row) return null;
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  return { id: s(row.id), nom: s(row.business_name), diag, etat: couvertureDuDiagnostic(diag) };
}

/** Ce que l'administration montre : la photo, l'hôte s'il est repéré, et les essais. */
export async function etatDeLHote(slug: string) {
  const l = await ligneDuSite(slug);
  if (!l) return null;
  return { nom: l.nom, etat: l.etat };
}

/** On l'entoure à la main : enregistré tel quel, et le modèle ne le remplace plus. */
export async function poserLHote(slug: string, boite: unknown) {
  const l = await ligneDuSite(slug);
  const hote = lireBoite(boite);
  if (!l?.etat?.url || !hote) return null;
  const etat: EtatCouverture = {
    ...l.etat,
    hote,
    hoteMain: true,
    hoteCherche: l.etat.url,
    hoteErreur: undefined,
    sansHoteEssais: undefined,
    sansHoteAt: undefined,
    sansHoteErreur: undefined,
  };
  await ecrireEtat(l.id, l.diag, etat);
  // ET LA PHOTO SANS LUI, POUR CE CADRE-LÀ, tout de suite.
  await completerSansHote(slug);
  return (await ligneDuSite(slug))?.etat ?? etat;
}

/** La photo sans lui, refaite tout de suite, en oubliant les essais passés. */
export async function refaireSansHote(slug: string) {
  const l = await ligneDuSite(slug);
  if (!l?.etat?.url || !l.etat.hote) return null;
  await ecrireEtat(l.id, l.diag, {
    ...l.etat,
    sansHote: undefined,
    sansHotePour: undefined,
    sansHoteEssais: undefined,
    sansHoteAt: undefined,
    sansHoteErreur: undefined,
  });
  await completerSansHote(slug);
  return (await ligneDuSite(slug))?.etat ?? null;
}

/** On redemande au modèle, tout de suite, en oubliant les essais passés. */
export async function relancerLHote(slug: string) {
  const l = await ligneDuSite(slug);
  if (!l?.etat?.url) return null;
  await ecrireEtat(l.id, l.diag, {
    ...l.etat,
    hote: undefined,
    hoteMain: undefined,
    hoteCherche: undefined,
    hoteEssais: undefined,
    hoteAt: undefined,
    hoteErreur: undefined,
  });
  await completerLHote(slug);
  await completerSansHote(slug);
  return (await ligneDuSite(slug))?.etat ?? null;
}

/** Faut-il (re)chercher l'hôte sur cette photo ? Lu par la page avant d'appeler `completerLHote`. */
export function hoteACherche(etat: EtatCouverture | null): boolean {
  if (!etat?.url || etat.hote || etat.etat === "originale") return false;
  if (etat.hoteCherche !== etat.url) return true;
  const n = etat.hoteEssais ?? 1;
  const dernier = Date.parse(etat.hoteAt ?? "");
  const depuis = Number.isFinite(dernier) ? Date.now() - dernier : Infinity;
  // TROIS ESSAIS À DIX MINUTES, PUIS UN PAR JOUR : un hôte jamais repéré, c'est
  // un fantôme qui ne bouge jamais — on ne renonce pas pour de bon.
  return n < HOTE_ESSAIS_MAX ? depuis >= HOTE_ECART_MS : depuis >= 24 * 3_600_000;
}

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
    hote: lireBoite(c.hote),
    hoteCherche: s(c.hoteCherche) || undefined,
    hoteEssais: Number(c.hoteEssais) || undefined,
    hoteAt: s(c.hoteAt) || undefined,
    hoteErreur: s(c.hoteErreur) || undefined,
    hoteMain: c.hoteMain === true || undefined,
    sansHote: s(c.sansHote) || undefined,
    sansHotePour: s(c.sansHotePour) || undefined,
    sansHoteEssais: Number(c.sansHoteEssais) || undefined,
    sansHoteAt: s(c.sansHoteAt) || undefined,
    sansHoteErreur: s(c.sansHoteErreur) || undefined,
  };
}

/** L'empreinte d'une photo et d'un cadre : la photo sans hôte n'est valable que pour eux. */
const empreinte = (e: EtatCouverture) =>
  e.url && e.hote ? `${e.url}#${[e.hote.x, e.hote.y, e.hote.w, e.hote.h].map((v) => v.toFixed(4)).join(",")}` : "";

/** La photo sans hôte qui va avec CETTE photo et CE cadre, s'il y en a une. */
export function photoSansHote(e: EtatCouverture | null): string | undefined {
  return e?.sansHote && e.sansHotePour === empreinte(e) ? e.sansHote : undefined;
}

/** Faut-il (re)faire la photo sans hôte ? Trois essais à dix minutes, puis un par jour. */
export function sansHoteAFaire(e: EtatCouverture | null): boolean {
  if (!e?.url || !e.hote || e.etat === "originale" || photoSansHote(e)) return false;
  const pour = empreinte(e);
  if (e.sansHotePour !== pour) return true;
  const n = e.sansHoteEssais ?? 1;
  const dernier = Date.parse(e.sansHoteAt ?? "");
  const depuis = Number.isFinite(dernier) ? Date.now() - dernier : Infinity;
  return n < HOTE_ESSAIS_MAX ? depuis >= HOTE_ECART_MS : depuis >= 24 * 3_600_000;
}

/**
 * ═══ CE QUE FONT LES FANTOMES, METIER PAR METIER — DEDANS OU DEVANT ═════════
 *
 * SES DEUX EXEMPLES DISAIENT LA RÈGLE DE LA DEVANTURE : au café, deux
 * fantômes prennent un café en terrasse et un troisième accueille à la porte ;
 * chez le fleuriste, l'un emballe un bouquet, l'autre s'en émerveille.
 *
 * « Si c'est un métier dont on voit la photo de l'intérieur, alors c'est une
 * mise en situation, avec le propriétaire fantôme qui exerce son métier ; et
 * si c'est devant un magasin, ce sont des fantômes qui marchent ou qui parlent
 * devant le commerce. » DEUX SCÈNES PAR MÉTIER, DONC :
 *   · DEDANS — l'hôte, en tenue, FAIT son métier sur un client fantôme (la
 *     coupe, la pose de vernis, le verre servi), un autre client attend ou
 *     regarde ;
 *   · DEVANT — l'hôte accueille à la porte, les clients passent et discutent
 *     devant la vitrine.
 * C'est le modèle qui voit la photo : il choisit la scène qui va avec (voir
 * le point 4 de la consigne). On ne lui demande jamais d'ajouter une pièce
 * qui n'est pas sur la photo — des fantômes, pas des meubles.
 */
type Scene = { hote: string; clients: string };
const SCENES: Record<CleMetier, { dedans: Scene; devant: Scene }> = {
  restaurant: {
    dedans: {
      hote: "walks between the tables carrying a steaming dish, or stands behind the counter, in the middle of service",
      clients: "Two customer ghosts sit at a table, enjoying their meal; if there is room, a third one chats at the counter.",
    },
    devant: {
      hote: "stands in the open entrance door, waving to welcome guests",
      clients: "If the photo shows a terrace or outdoor tables, two customer ghosts sit at a table in the foreground, enjoying a coffee or a dish; otherwise two customer ghosts chat in front of the entrance.",
    },
  },
  bar: {
    dedans: {
      hote: "stands behind the bar, pouring a drink or shaking a cocktail",
      clients: "Customer ghosts lean on the bar or sit at a table and raise their glasses together.",
    },
    devant: {
      hote: "stands in the open entrance door, waving to welcome guests",
      clients: "If the photo shows a terrace or outdoor tables, two customer ghosts sit at a table in the foreground and raise their glasses together; otherwise two customer ghosts chat in front of the entrance.",
    },
  },
  fleuriste: {
    dedans: {
      hote: "stands at the work table inside the shop, wrapping a bouquet in kraft paper",
      clients: "A customer ghost admires the bouquet with delight; another browses the buckets of flowers.",
    },
    devant: {
      hote: "stands at a wooden table in front of the shop, wrapping a bouquet in kraft paper",
      clients: "A customer ghost stands next to the table and admires the bouquet; another walks by and stops to smell the flowers.",
    },
  },
  coiffeur: {
    dedans: {
      hote: "stands behind a salon chair, cutting the hair of a customer ghost with scissors and a comb",
      clients: "That customer ghost sits in the salon chair, wearing a hairdressing cape, facing the mirror and delighted. Another customer ghost waits on a bench reading a magazine, or leans back at the shampoo basin.",
    },
    devant: {
      hote: "stands at the entrance door, waving to welcome clients",
      clients: "Two customer ghosts walk past the salon and chat; one of them admires its fresh haircut in the window reflection.",
    },
  },
  ongles: {
    dedans: {
      hote: "sits at the manicure table, carefully painting the nails of a customer ghost seated opposite",
      clients: "That customer ghost holds out its hand, delighted. Another customer ghost waits on a chair, choosing a colour from the nail polish display.",
    },
    devant: {
      hote: "stands at the entrance door, waving to welcome clients",
      clients: "In front of the shop, a customer ghost proudly shows its freshly painted nails to a friend ghost.",
    },
  },
  mode: {
    dedans: {
      hote: "stands near the clothes racks, presenting a garment to a customer ghost",
      clients: "A customer ghost holds a garment against itself in front of a mirror; another carries a small shopping bag.",
    },
    devant: {
      hote: "stands at the entrance door, waving to welcome clients",
      clients: "Two customer ghosts walk past with small shopping bags, chatting and looking at the window display.",
    },
  },
  artisan: {
    dedans: {
      hote: "works at the workbench, finishing a handmade piece",
      clients: "A customer ghost watches the work with curiosity; another admires the pieces on display.",
    },
    devant: {
      hote: "stands at the entrance door, waving to welcome visitors",
      clients: "Two customer ghosts chat in front of the window, admiring the handmade pieces on display.",
    },
  },
  /* LE LIBRAIRE CONSEILLE : il tend un livre, il ne fabrique rien. Rangé chez
     les artisans, il recevait un marteau. */
  librairie: {
    dedans: {
      hote: "stands between the bookshelves, holding out an open book to recommend it, with a warm smile",
      clients: "A customer ghost reads the back cover of a book with delight; another browses the shelves or the table of new releases.",
    },
    devant: {
      hote: "stands at the entrance door, holding a book against its chest and waving to welcome readers",
      clients: "If the photo shows book bins or a table in front of the window, two customer ghosts browse them, one reading a page; otherwise two customer ghosts admire the books in the window.",
    },
  },
  lunetier: {
    dedans: {
      hote: "stands at the counter, adjusting a pair of glasses on the face of a customer ghost",
      clients: "That customer ghost smiles at its reflection in a small mirror; another browses the frames on the wall.",
    },
    devant: {
      hote: "stands at the entrance door, waving to welcome clients",
      clients: "In front of the shop, a customer ghost tries on new glasses and shows them to a friend ghost.",
    },
  },
};

/**
 * ═══ CE QU'IL Y A SUR LEUR CASQUETTE ═══════════════════════════════════════
 *
 * « Les fantômes ne devraient pas avoir sur la casquette le logo ClikMe, mais
 * plutôt le logo du métier qu'on consulte, ou encore mieux le nom du
 * commerce. »
 *
 * SON NOM QUAND IL EST COURT, L'EMBLÈME DU MÉTIER SINON. Un nom brodé sur une
 * casquette de quelques centimètres n'est lisible — et recopiable sans faute
 * par le modèle — que s'il tient en peu de lettres. Au-delà de dix-huit
 * signes, on brode l'emblème de son métier : une faute sur son nom serait pire
 * qu'un symbole juste. Le logo ClikMe de l'image de référence est remplacé
 * dans les deux cas.
 */
const EMBLEMES: Record<CleMetier, string> = {
  restaurant: "a crossed fork and knife",
  bar: "a cocktail glass",
  fleuriste: "a flower",
  coiffeur: "a pair of scissors",
  ongles: "a nail polish bottle",
  mode: "a clothes hanger",
  artisan: "a small hammer",
  lunetier: "a pair of glasses",
  librairie: "an open book",
};
export function casquette(nom: string, branche: CleMetier): string {
  const court = nom.trim().length >= 2 && nom.trim().length <= 18;
  return court
    ? `Instead of the ClikMe logo of IMAGE 2, the front of every customer's cap shows the shop name "${nom.trim()}" embroidered in small pink letters, spelled exactly like that, letter for letter.`
    : `Instead of the ClikMe logo of IMAGE 2, the front of every customer's cap shows a small pink embroidered emblem: ${EMBLEMES[branche] ?? EMBLEMES.restaurant}.`;
}

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
export function consigneCouverture(
  nom: string,
  metier: string,
  ville: string,
  branche: CleMetier,
  refs: { tenue: boolean; action: boolean; clients: number } = { tenue: true, action: false, clients: 0 },
): string {
  const scene = SCENES[branche] ?? SCENES.restaurant;
  const n = numeros(refs);
  const tenueDit = n.tenue
    ? `the ghost of IMAGE ${n.tenue}, wearing exactly the outfit of IMAGE ${n.tenue} (same clothes, same cap and emblem — the outfit of this trade)`
    : "the ClikMe ghost of IMAGE 2, dressed for this trade";
  const actionDit = n.action
    ? ` IMAGE ${n.action} shows this host in action with the tool of the trade: give the host that pose, that gesture and that tool${n.tenue ? ` (its clothes follow IMAGE ${n.tenue} where they differ)` : ""}.`
    : "";
  const clientsDit = n.clients.length
    ? ` IMAGE${n.clients.length > 1 ? "S" : ""} ${n.clients.join(", ")} show customer ghosts in poses (seated, waiting, walking, delighted): reuse the poses that fit the scene you chose, same character as IMAGE 2.`
    : "";
  const lieu = [nom && `"${nom}"`, metier && `a ${metier.toLowerCase()}`, ville && `in ${ville}`].filter(Boolean).join(", ");
  return [
    `Transform IMAGE 1 (the real photo of ${lieu || "a local shop"}) into the ClikMe photographic signature: a warm, enchanting, premium photo where the ClikMe ghosts from IMAGE 2 are part of the scene.`,
    "",
    "1. KEEP THE PLACE. Same building or same room, same architecture, same shopfront or interior, same furniture, awning and colours, same camera viewpoint. Someone who knows this place must recognise it at first glance.",
    "2. KEEP EVERY SIGN EXACTLY. Every word on the sign, awning, windows or walls stays exactly as in IMAGE 1: same spelling, same letters, same position. Never invent, translate, correct or add any text, logo or brand. If a text is unreadable in IMAGE 1, leave it unreadable rather than guessing.",
    "3. LIGHT AND COLOUR. Warm, enchanting light: outside, late-afternoon golden hour on the facade with glowing lamps inside; inside, warm inviting lamplight and soft daylight from the windows. Rich and luminous but natural colours, soft depth of field, crisp details. Tidy clutter (bins, cars, boxes) only where it does not alter the place.",
    `4. INSIDE OR IN FRONT? Look at IMAGE 1. If it shows the INSIDE of the shop, the ghosts are at work inside: the host ${scene.dedans.hote}. ${scene.dedans.clients} If it shows the OUTSIDE (shopfront, street, terrace): the host ${scene.devant.hote}. ${scene.devant.clients}`,
    `5. THE HOST. Exactly one ghost is the shop's host: ${tenueDit}, clearly visible and the most prominent ghost.${actionDit}`,
    `6. THE CUSTOMERS. The other ghosts are customers: the ghost character from IMAGE 2 (soft white rounded ghost, big glossy purple eyes, pink cheeks, a black cap), NOT dressed like the host. ${casquette(nom, branche)}${clientsDit}`,
    "7. ALL GHOSTS must truly belong to the photo: realistic scale next to doors, chairs and furniture, matching perspective, light direction and colour temperature, soft contact shadows, reflections in windows and mirrors where relevant. Cute, friendly, polished 3D finish; host and customers are the same kind of character. Never add furniture, rooms or a terrace that are not in IMAGE 1: only ghosts.",
    "8. PEOPLE. Real people already present may stay, unchanged and not in focus. Do not add any new person.",
    "9. FRAMING. Vertical 4:5 framing, centred on the entrance outside or on the host at work inside. Keep the top fifth calm (facade, wall, ceiling or sky), because a title is written over it.",
    "No ClikMe logo anywhere. No watermark, no border, no caption, and no added text other than what is asked on the caps.",
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
 * C'est la mascotte à casquette ClikMe, la même que sur ses deux exemples :
 * elle habille LES CLIENTS. L'hôte, lui, porte la tenue de son métier — voir
 * `laTenue` juste dessous. Le fichier est déclaré à
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
 * ═══ LA TENUE DE SON MÉTIER, POUR LE FANTÔME QUI ACCUEILLE ═════════════════
 *
 * « Le premier fantôme doit être habillé dans le métier du commerçant, et les
 * deux autres sont des clients, qui restent comme ils sont, avec la casquette
 * et le nom du commerce. »
 *
 * LE FANTÔME QUI ACCUEILLE, C'EST LUI : son double, dans la tenue que la page
 * lui donne déjà partout (le tablier et la casquette brodée du restaurant, la
 * blouse du fleuriste…). On montre donc au moteur une troisième image — ce
 * double en tenue — et il habille l'hôte ainsi ; les clients gardent la
 * mascotte à casquette. Fichiers déclarés à `outputFileTracingIncludes`.
 */
function laTenue(branche: CleMetier, metier: string): { type: string; donnees: string } | null {
  const t = tenueDu({ branche, metier });
  if (!t) return null;
  try {
    // SA POSE EN PIED, QUAND IL L'A : c'est ce personnage-là qui s'animera
    // devant la porte, c'est donc lui que la photo doit peindre.
    const fichier = t.enPied ? `${t.enPied}repos.webp` : `${t.dossier}accueil.webp`;
    const octets = readFileSync(join(process.cwd(), "public", fichier.replace(/^\//, "")));
    return { type: "image/webp", donnees: octets.toString("base64") };
  } catch {
    return null;
  }
}

/**
 * ═══ SES FANTÔMES EN SITUATION — dessinés par lui ══════════════════════════
 *
 * « Si tu as besoin que je te fasse des fantômes en PNG, je peux te les
 * faire. » Il les a faits : l'hôte en action pour chaque métier (le coiffeur
 * ciseaux et peigne, la prothésiste au pinceau, le barman au shaker…) et les
 * clients en pose (de dos au fauteuil avec la cape, la main tendue pour la
 * manucure, le magazine, le sac de courses, le verre levé). Le moteur les
 * reçoit comme RÉFÉRENCES DE POSE : la scène « dedans » ne s'invente plus,
 * elle reprend ses gestes. Voir `public/direct/fantomes/`.
 *
 * TROIS CLIENTS AU PLUS, et dans l'ordre de la scène la plus probable : les
 * poses de l'intérieur d'abord, puis une de la devanture — c'est le moteur
 * qui choisit la scène selon la photo (point 4 de la consigne).
 */
const POSES_SCENE: Record<CleMetier, { hote: string; clients: string[] }> = {
  restaurant: { hote: "hote-serveur", clients: ["client-verre", "client-ravi", "client-rit"] },
  bar: { hote: "hote-barman", clients: ["client-verre", "client-rit", "client-ravi"] },
  coiffeur: { hote: "hote-coiffeur", clients: ["client-fauteuil-cape", "client-magazine", "client-sac"] },
  ongles: { hote: "hote-onglerie", clients: ["client-main-tendue", "client-magazine", "client-sac"] },
  lunetier: { hote: "hote-opticien", clients: ["client-ravi", "client-curieux", "client-sac"] },
  mode: { hote: "hote-mode", clients: ["client-sac", "client-curieux", "client-rit"] },
  fleuriste: { hote: "hote-fleuriste", clients: ["client-ravi", "client-curieux", "client-sac"] },
  artisan: { hote: "hote-artisan", clients: ["client-curieux", "client-ravi", "client-sac"] },
  // SA POSE EST `hote-libraire.png`. Tant qu'elle n'est pas déposée, la photo
  // se fait sans pose d'hôte (voir `unePose`) — jamais avec le marteau de
  // l'artisan.
  librairie: { hote: "hote-libraire", clients: ["client-curieux", "client-ravi", "client-sac"] },
};

type Img = { type: string; donnees: string };
const posesLues = new Map<string, Img | null>();
/** Une pose, réduite à 512 points : une référence, pas un tirage. Gardée en mémoire. */
async function unePose(nom: string): Promise<Img | null> {
  if (posesLues.has(nom)) return posesLues.get(nom) ?? null;
  let img: Img | null = null;
  try {
    const octets = readFileSync(join(process.cwd(), "public", "direct", "fantomes", `${nom}.png`));
    const petit = await sharp(octets).resize(512, 512, { fit: "inside" }).png().toBuffer();
    img = { type: "image/png", donnees: petit.toString("base64") };
  } catch {
    img = null;
  }
  posesLues.set(nom, img);
  return img;
}

export type PosesDeScene = { hote: Img | null; clients: Img[] };
export async function lesPoses(branche: CleMetier, metier = ""): Promise<PosesDeScene> {
  const p = POSES_SCENE[branche] ?? POSES_SCENE.restaurant;
  const clients = (await Promise.all(p.clients.map(unePose))).filter((x): x is Img => Boolean(x));
  // L'HÔTE EN ACTION, DANS SA SÉRIE EN PIED quand elle existe — il salue : le
  // même personnage que celui qui s'animera devant la porte. Le libraire garde
  // sa pose au livre ouvert, qui est de cette même série.
  const t = tenueDu({ branche, metier });
  const hote =
    t?.enPied && branche !== "librairie" ? await unePoseEnPied(`${t.enPied}salut-1.webp`) : await unePose(p.hote);
  return { hote: hote ?? (await unePose(p.hote)), clients };
}

/** Une pose en pied (webp, sous `public/`), réduite comme les autres. */
async function unePoseEnPied(chemin: string): Promise<Img | null> {
  if (posesLues.has(chemin)) return posesLues.get(chemin) ?? null;
  let img: Img | null = null;
  try {
    const octets = readFileSync(join(process.cwd(), "public", chemin.replace(/^\//, "")));
    const petit = await sharp(octets).resize(512, 512, { fit: "inside" }).png().toBuffer();
    img = { type: "image/png", donnees: petit.toString("base64") };
  } catch {
    img = null;
  }
  posesLues.set(chemin, img);
  return img;
}

/** La numérotation des images, la même pour la consigne et pour l'envoi. */
function numeros(r: { tenue: boolean; action: boolean; clients: number }) {
  let n = 3;
  const tenue = r.tenue ? n++ : 0;
  const action = r.action ? n++ : 0;
  const clients = Array.from({ length: r.clients }, () => n++);
  return { tenue, action, clients };
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
  tenue: { type: string; donnees: string } | null,
  poses: PosesDeScene,
): Promise<{ image: { type: string; donnees: string }; modele: string } | { erreur: string }> {
  const n = numeros({ tenue: Boolean(tenue), action: Boolean(poses.hote), clients: poses.clients.length });
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
            ...(tenue
              ? [
                  { text: `IMAGE ${n.tenue} — THE HOST'S OUTFIT. The same ghost, dressed for this trade: the host wears exactly this. Its background is not part of the result.` },
                  { inlineData: { mimeType: tenue.type, data: tenue.donnees } },
                ]
              : []),
            ...(poses.hote
              ? [
                  { text: `IMAGE ${n.action} — THE HOST IN ACTION. Pose, gesture and tool reference for the host only.` },
                  { inlineData: { mimeType: poses.hote.type, data: poses.hote.donnees } },
                ]
              : []),
            ...poses.clients.flatMap((c, i) => [
              { text: `IMAGE ${n.clients[i]} — A CUSTOMER POSE. Pose reference for a customer ghost.` },
              { inlineData: { mimeType: c.type, data: c.donnees } },
            ]),
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
  tenue: { type: string; donnees: string } | null,
  poses: PosesDeScene,
): Promise<{ image: { type: string; donnees: string }; modele: string } | { erreur: string }> {
  const n = numeros({ tenue: Boolean(tenue), action: Boolean(poses.hote), clients: poses.clients.length });
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
    if (tenue) forme.append("image[]", fichier(tenue, "hote.webp"));
    if (poses.hote) forme.append("image[]", fichier(poses.hote, "hote-action.png"));
    poses.clients.forEach((c, i) => forme.append("image[]", fichier(c, `client-${i + 1}.png`)));
    const roles = [
      "IMAGE 1 is the real place",
      "IMAGE 2 is the ClikMe ghost (customers)",
      n.tenue ? `IMAGE ${n.tenue} is the host's outfit` : "",
      n.action ? `IMAGE ${n.action} is the host in action (pose and tool)` : "",
      n.clients.length ? `IMAGES ${n.clients.join(", ")} are customer poses` : "",
    ].filter(Boolean);
    forme.append("prompt", `${roles.join("; ")} (character references only).\n${consigne}`);
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
  tenue: { type: string; donnees: string } | null,
  poses: PosesDeScene = { hote: null, clients: [] },
): Promise<{ image: { type: string; donnees: string }; modele: string } | { erreur: string }> {
  const gemini = s(process.env.GEMINI_API_KEY) || s(process.env.GOOGLE_API_KEY);
  const openai = s(process.env.OPENAI_API_KEY);
  if (!gemini && !openai) return { erreur: "Aucune clé d'image (GEMINI_API_KEY ou OPENAI_API_KEY) sur ce serveur." };
  const ordre = s(process.env.COUVERTURE_FOURNISSEUR).toLowerCase() === "openai" ? ["openai", "gemini"] : ["gemini", "openai"];
  const erreurs: string[] = [];
  for (const f of ordre) {
    try {
      const r =
        f === "gemini"
          ? gemini
            ? await parGemini(gemini, photo, consigne, tenue, poses)
            : null
          : openai
            ? await parOpenAI(openai, photo, consigne, tenue, poses)
            : null;
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
  const tenue = laTenue(branche, metier);
  const poses = await lesPoses(branche, metier);
  const r = await rendre(
    photo,
    consigneCouverture(nom, metier, s(row.city), branche, {
      tenue: Boolean(tenue),
      action: Boolean(poses.hote),
      clients: poses.clients.length,
    }),
    tenue,
    poses,
  );
  if ("erreur" in r) return echouer(r.erreur);

  const ext = r.image.type.includes("jpeg") ? "jpg" : r.image.type.includes("webp") ? "webp" : "png";
  const chemin = `${DOSSIER}/${slug}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(SEAU)
    .upload(chemin, Buffer.from(r.image.donnees, "base64"), { contentType: r.image.type, upsert: true });
  if (error) return echouer(`stockage : ${error.message}`);
  const url = supabase.storage.from(SEAU).getPublicUrl(chemin).data.publicUrl;
  // OÙ SE TIENT L'HÔTE : là qu'on le touchera pour entrer — voir `trouverLHote`.
  const hote = await trouverLHote(r.image);

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
    hote,
    hoteCherche: url,
    hoteEssais: 1,
    hoteAt: new Date().toISOString(),
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
