// 🎬 LES SCÈNES DE L'EXPÉRIENCE RESTAURANT, FABRIQUÉES PAR LE MOTEUR D'IMAGES.
//
// « Je les fais fabriquer automatiquement par le moteur d'images, comme la
// photo ClikMe de la devanture, en lui donnant tes maquettes comme modèle. »
//
// DEUX SCÈNES, DEUX MAQUETTES :
//   · le PLAT (étape 2) : sa photo du plat, servie sur une table de bistro, son
//     fantôme assis derrière l'assiette — la maquette 2 ;
//   · le CUISINIER (étape 3) : sa photo, et le fantôme assis à table, à
//     droite, qu'on ne voit qu'à moitié — la maquette 3.
// Son nom est brodé sur la casquette et le tablier, comme sur les maquettes.
//
// « LE MOTEUR REDESSINE LA PHOTO : LE PLAT PEUT LÉGÈREMENT CHANGER. » La
// consigne lui demande de garder l'assiette et la personne telles quelles,
// mais ce n'est pas sa photo au pixel près. Le restaurateur voit donc chaque
// scène dans son espace commerçant et peut la REFUSER : sa page reprend alors
// sa photo d'origine. Il peut aussi la reprendre, ou en demander une autre.
//
// RIEN NE LÈVE. Une scène ratée laisse sa photo d'origine sur sa page, et la
// visite suivante relance le moteur (trois essais à dix minutes d'écart, puis
// un par jour — voir `sceneAFaire`).
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { boiteDansLImage } from "@/lib/site-internet/couverture";
import { jourParis } from "@/lib/jour-paris";
import {
  experienceDuDiagnostic,
  platEnCours,
  sceneAFaire,
  sceneARefaire,
  SCENE_CHEF,
  VERSION_SCENE_CHEF,
  SCENE_PLAT,
  type EtatScene,
  type ExperienceResto,
  type PlatDuChef,
} from "@/lib/site-internet/experience-donnees";

const s = (v: unknown) => (v == null ? "" : String(v)).trim();

/** Le seau des photos ClikMe : ses photos et ses scènes y vivent à côté. */
const SEAU = s(process.env.COUVERTURE_BUCKET) || "marketplace-privilege-offers";
const DOSSIER = "experience-clikme";
const DELAI_RENDU_MS = 200_000;

type Img = { type: string; donnees: string };
export type Quoi = "plat" | "chef";

// ═══ LA LIGNE DU SITE ═══════════════════════════════════════════════════════

async function laLigne(slug: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, slug, business_name, activite, pro_token, diagnostic")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? null;
  if (!row) return null;
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  return {
    id: s(row.id),
    nom: s(row.business_name),
    jeton: s(row.pro_token),
    diag,
    experience: experienceDuDiagnostic(diag) ?? {},
  };
}

/* ON ÉCRIT UNE CHOSE À LA FOIS, SUR LE DIAGNOSTIC RELU. Les deux scènes se
   fabriquent en même temps (la route s'arrête à cinq minutes, un rendu en
   prend jusqu'à trois) : sans file, la seconde à finir effacerait la
   première. */
let file: Promise<unknown> = Promise.resolve();

function modifier(slug: string, maj: (e: ExperienceResto) => ExperienceResto | null): Promise<ExperienceResto | null> {
  const tache = file.then(async () => {
    const l = await laLigne(slug);
    if (!l) return null;
    const suite = maj(l.experience);
    if (!suite) return l.experience;
    await createAdminClient()
      .from("human_vitrine_sites")
      .update({ diagnostic: { ...l.diag, experience: suite } })
      .eq("id", l.id);
    return suite;
  });
  file = tache.catch(() => undefined);
  return tache;
}

// ═══ SES PHOTOS ═════════════════════════════════════════════════════════════

/**
 * UNE PHOTO QU'IL ENVOIE : rangée chez nous, à une adresse stable.
 *
 * Elle arrive en `data:` depuis son espace (déjà réduite par le navigateur,
 * ou pas) — on la ramène à 1600 pixels au plus et on la range. Une adresse
 * https déjà à nous est gardée telle quelle.
 *
 * RANGÉE SOUS SON EMPREINTE. La même photo renvoyée — il corrige un prix, le
 * comptoir republie tout — retombe à la même adresse : sa scène n'est pas
 * refaite, et le moteur n'est pas payé deux fois pour la même assiette.
 */
export async function rangerPhoto(slug: string, quoi: Quoi, valeur: string): Promise<string | { erreur: string }> {
  const v = s(valeur);
  if (/^https:\/\//i.test(v)) return v;
  const m = /^data:(image\/(?:jpeg|jpg|png|webp|heic|heif));base64,(.+)$/i.exec(v);
  if (!m) return { erreur: "photo illisible (attendu : une image en data: ou une adresse https)" };
  const brut = Buffer.from(m[2], "base64");
  if (brut.length > 12 * 1024 * 1024) return { erreur: "photo trop lourde (12 Mo au plus)" };
  let octets: Buffer;
  try {
    octets = await sharp(brut).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 86 }).toBuffer();
  } catch {
    return { erreur: "photo illisible" };
  }
  const supabase = createAdminClient();
  const empreinte = createHash("sha1").update(brut).digest("hex").slice(0, 16);
  const chemin = `${DOSSIER}/${slug}-${quoi}-photo-${empreinte}.jpg`;
  const { error } = await supabase.storage.from(SEAU).upload(chemin, octets, { contentType: "image/jpeg", upsert: true });
  if (error) return { erreur: `stockage : ${error.message}` };
  return supabase.storage.from(SEAU).getPublicUrl(chemin).data.publicUrl;
}

/* ═══ SA VOIX ═══════════════════════════════════════════════════════════════
   Ce que le comptoir enregistre : du webm/opus sur Android et Chrome, du mp4
   (AAC) sur iPhone. Rangé tel quel — aucun convertisseur sur le serveur.
   Un téléphone qui ne sait pas lire le fichier (un iPhone ancien face à du
   webm) entend à la place `voixTexte`, redit par sa voix clonée : voir
   `repli` dans la carte. */
const EXT_AUDIO: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};

export async function rangerVoix(slug: string, valeur: string): Promise<string | { erreur: string }> {
  const v = s(valeur);
  if (/^https:\/\//i.test(v)) return v;
  const m = /^data:(audio\/[a-z0-9.+-]+)(?:;[^,;]*)*;base64,(.+)$/i.exec(v);
  const type = m?.[1].toLowerCase() ?? "";
  if (!m || !EXT_AUDIO[type]) return { erreur: "enregistrement illisible (attendu : du son en data:audio/…;base64)" };
  const octets = Buffer.from(m[2], "base64");
  // TROIS MÉGAOCTETS, C'EST PLUS D'UNE MINUTE DE PAROLE : son mot en dure dix.
  if (octets.length > 3 * 1024 * 1024) return { erreur: "enregistrement trop long (3 Mo au plus)" };
  if (octets.length < 1000) return { erreur: "enregistrement vide" };
  const supabase = createAdminClient();
  const empreinte = createHash("sha1").update(octets).digest("hex").slice(0, 16);
  const chemin = `${DOSSIER}/${slug}-voix-${empreinte}.${EXT_AUDIO[type]}`;
  const { error } = await supabase.storage.from(SEAU).upload(chemin, octets, { contentType: type, upsert: true });
  if (error) return { erreur: `stockage : ${error.message}` };
  return supabase.storage.from(SEAU).getPublicUrl(chemin).data.publicUrl;
}

/**
 * LA FIN DU PLAT, À L'HEURE DE PARIS. « 1 jour » veut dire jusqu'à ce soir
 * 23 h 59 chez lui — la même règle que `finApres` dans le comptoir —, quel
 * que soit le fuseau du serveur. Une fin donnée (ISO, ou millisecondes) est
 * prise telle quelle.
 */
export function finDuPlat(fin: unknown, jours: unknown, maintenant = new Date()): string | undefined {
  if (typeof fin === "number" && Number.isFinite(fin) && fin > 0) return new Date(fin).toISOString();
  if (typeof fin === "string" && Number.isFinite(Date.parse(fin))) return new Date(fin).toISOString();
  const n = Math.round(Number(jours));
  if (!Number.isFinite(n) || n < 1) return undefined;
  const jour = jourParis(maintenant);
  // L'HEURE SEULE, LUE DANS SES MORCEAUX : en français, le format rend « 23 h ».
  const heureParis = (d: Date) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hourCycle: "h23" })
      .formatToParts(d)
      .find((x) => x.type === "hour")?.value;
  // 23 H 59 À PARIS : +02:00 l'été, +01:00 l'hiver — on garde celui qui tombe juste.
  const ce_soir =
    [2, 1].map((h) => new Date(`${jour}T23:59:00+0${h}:00`)).find((d) => heureParis(d) === "23" && jourParis(d) === jour) ??
    new Date(`${jour}T23:59:00+01:00`);
  return new Date(ce_soir.getTime() + (Math.min(n, 365) - 1) * 86_400_000).toISOString();
}

export async function lirePhoto(url: string): Promise<Img | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!r.ok) return null;
    const brut = Buffer.from(await r.arrayBuffer());
    // UNE TAILLE QUE LE MOTEUR ACCEPTE SANS RECHIGNER.
    const petit = await sharp(brut).rotate().resize(1280, 1280, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
    return { type: "image/jpeg", donnees: petit.toString("base64") };
  } catch {
    return null;
  }
}

/** LES RÉFÉRENCES, SUR LE DISQUE : ses maquettes et le fantôme assis. */
const refs = new Map<string, Img | null>();
async function reference(chemin: string, cote = 768): Promise<Img | null> {
  if (refs.has(chemin)) return refs.get(chemin) ?? null;
  let img: Img | null = null;
  try {
    const octets = readFileSync(join(process.cwd(), "public", chemin.replace(/^\//, "")));
    const petit = await sharp(octets).resize(cote, cote, { fit: "inside" }).png().toBuffer();
    img = { type: "image/png", donnees: petit.toString("base64") };
  } catch {
    img = null;
  }
  refs.set(chemin, img);
  return img;
}

// ═══ LES CONSIGNES ══════════════════════════════════════════════════════════

/** LE NOM BRODÉ — comme sur ses maquettes, et rien d'autre d'écrit. */
const broderie = (nom: string) =>
  `TEXT: the front of the ghost's black cap shows the words "${nom}" embroidered in thin cream-coloured elegant italic serif letters, ` +
  `following the curve of the cap; the bib of its black apron shows "${nom}" embroidered smaller in the same style. ` +
  `Spell it exactly "${nom}". No other text anywhere: no logo, no watermark, no caption, no speech bubble, no label, no interface.`;

function consignePlat(nom: string, plat: PlatDuChef): string {
  return [
    "Compose ONE photorealistic restaurant photograph.",
    `IMAGE 1 — THE RESTAURANT'S OWN DISH ("${plat.nom}", restaurant "${nom}"). Keep the food and the plate as they are: the same food items, ` +
      "the same quantities, arrangement, colours, sauce and garnish, the same plate or bowl. Do not add, remove, replace or restyle any food. " +
      "Only the camera framing, the table and the background around the plate may change.",
    "IMAGE 2 — THE COMPOSITION MODEL. Copy its framing, camera height and angle, light and mood: the plate of food in the foreground, large, " +
      "on a warm polished wooden bistro table, seen from slightly above; behind the plate, on the right, a small cute white ghost mascot sits " +
      "on the table, its lower body hidden behind the plate; a warm, softly blurred restaurant interior behind. Do NOT copy the food, the plate " +
      "or any letters of image 2.",
    "IMAGE 3 — THE GHOST. Character reference only (ignore its background): the same white ghost, seated, with a black cap and a black apron.",
    broderie(nom),
    "Natural proportions: the plate is the normal size of a dinner plate on a table, and the seated ghost is small, about as tall as a wine glass. " +
      "Appetising, warm evening light, shallow depth of field. Landscape format, 5:4.",
  ].join("\n");
}

/**
 * LA SCÈNE DU CUISINIER, RECOMPOSÉE COMME LA MAQUETTE 3.
 *
 * « Le parcours en 3 étapes côté restaurant n'est pas bon […] voir photo 1 et
 * photo 2, c'est à quoi ça devrait ressembler. » La consigne demandait de
 * GARDER LE CADRAGE de sa photo : une photo prise sur le pas de la porte, le
 * cuisinier au bord du cadre, restait un visage coupé à droite de l'écran.
 * Elle demande maintenant SA MISE EN SCÈNE : lui, entier jusqu'à la taille,
 * penché derrière une chaise vide qu'il nous tend, la table au premier plan,
 * son fantôme assis à droite. Ce qui ne change pas : son visage, ses
 * vêtements — c'est lui, pas un autre. Et il peut toujours refuser la scène.
 */
function consigneChef(nom: string): string {
  return [
    "Create ONE photorealistic vertical photograph (9:16) by recomposing the scene of IMAGE 2 with the person of IMAGE 1.",
    `IMAGE 1 — THE RESTAURANT'S COOK, of the restaurant "${nom}". Keep this person's identity exactly: the same face and features, ` +
      "skin, hair, beard, age, build and the same clothes and apron. Do not beautify, age or change the person. Only the pose, the place " +
      "in the picture and the light change.",
    "IMAGE 2 — THE COMPOSITION MODEL. Copy its composition, camera height, lens and warm evening light (ignore its speech bubble and its " +
      "small label): the cook stands in the upper middle-left of the picture, visible from the head to the waist, leaning slightly forward " +
      "behind an EMPTY leather chair at a polished wooden table, one hand on the back of the chair, the other arm stretched out towards the " +
      "chair in a welcoming gesture, smiling at the camera. The table fills the lower part of the picture in the foreground, with a candle " +
      "in a glass, a water glass, a pepper mill and a small bunch of dried flowers on the left, and a folded napkin with a fork and knife " +
      "on a plate at the bottom right. Behind: a warm bistro dining room with soft globe lights, blurred, a few guests far away.",
    "On the right, at the table, a small cute white ghost mascot sits facing the camera and waves with one hand; the near edge of the table " +
      "hides its lower half, so only its upper half shows — exactly where it sits in IMAGE 2.",
    "IMAGE 3 — THE GHOST. Character reference only (ignore its background): the white ghost with a black cap and a black apron, waving.",
    broderie(nom),
    "Natural proportions: the seated ghost is small, its head about the size of the cook's head. Vertical format, 9:16.",
  ].join("\n");
}

// ═══ LE MOTEUR ══════════════════════════════════════════════════════════════

export async function parGemini(
  parties: ({ text: string } | { inlineData: { mimeType: string; data: string } })[],
  format: string,
): Promise<{ image: Img; modele: string } | { erreur: string }> {
  const cle = s(process.env.GEMINI_API_KEY) || s(process.env.GOOGLE_API_KEY);
  if (!cle) return { erreur: "aucune clé Gemini sur le serveur" };
  const modele = s(process.env.GEMINI_IMAGE_MODEL) || "gemini-2.5-flash-image";
  const base = s(process.env.GEMINI_BASE_URL) || "https://generativelanguage.googleapis.com";
  const corps = (avecFormat: boolean) =>
    JSON.stringify({
      contents: [{ role: "user", parts: parties }],
      // LE FORMAT EST DEMANDÉ, ET RETIRÉ S'IL EST REFUSÉ — la même règle que la
      // photo ClikMe : la scène est de toute façon remise aux dimensions.
      generationConfig: avecFormat
        ? { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: format } }
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
    const j = (await r.json()) as { candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[] };
    const p = (j.candidates?.[0]?.content?.parts ?? []).find((x) => x.inlineData?.data);
    if (!p?.inlineData?.data) return { erreur: "le moteur d'image n'a pas rendu d'image" };
    return { image: { type: p.inlineData.mimeType || "image/png", donnees: p.inlineData.data }, modele };
  } catch (e) {
    return { erreur: `appel au moteur d'image impossible : ${e instanceof Error ? e.message : "erreur"}` };
  }
}

/**
 * LA SCÈNE RENDUE, AUX DIMENSIONS DE SA MAQUETTE — sans la ranger. La page du
 * commerçant la range dans son seau (`fabriquer`) ; la démonstration la sert
 * depuis le réseau (`/api/direct/scene-chef`).
 */
export async function rendreScene(
  quoi: Quoi,
  nom: string,
  photo: Img,
  plat?: PlatDuChef,
): Promise<{ octets: Buffer; modele: string; boite?: EtatScene["boite"] } | { erreur: string }> {
  const modeleImg = await reference(quoi === "plat" ? "/direct/table/restaurant/scene-magret.webp" : "/direct/table/restaurant/chef-fantome.webp");
  const fantome = await reference(quoi === "plat" ? "/direct/double/assis/repos.webp" : "/direct/double/assis/salut.webp", 512);
  if (!modeleImg || !fantome) return { erreur: "références introuvables sur le serveur" };
  if (quoi === "plat" && !plat) return { erreur: "pas de plat" };
  const r = await parGemini(
    [
      { text: quoi === "plat" ? "IMAGE 1 — THE DISH:" : "IMAGE 1 — THE COOK:" },
      { inlineData: { mimeType: photo.type, data: photo.donnees } },
      { text: "IMAGE 2 — THE COMPOSITION MODEL:" },
      { inlineData: { mimeType: modeleImg.type, data: modeleImg.donnees } },
      { text: "IMAGE 3 — THE GHOST:" },
      { inlineData: { mimeType: fantome.type, data: fantome.donnees } },
      { text: quoi === "plat" ? consignePlat(nom, plat!) : consigneChef(nom) },
    ],
    quoi === "plat" ? "5:4" : "9:16",
  );
  if ("erreur" in r) return r;
  // AUX DIMENSIONS EXACTES DE LA MAQUETTE : la page compose en pour cent.
  const dim = quoi === "plat" ? SCENE_PLAT : SCENE_CHEF;
  let octets: Buffer;
  try {
    octets = await sharp(Buffer.from(r.image.donnees, "base64")).resize(dim.l, dim.h, { fit: "cover" }).webp({ quality: 86 }).toBuffer();
  } catch {
    return { erreur: "la scène rendue est illisible" };
  }
  // À L'ÉTAPE 3, ON LE TOUCHE POUR LUI PARLER : il faut savoir où il est assis.
  let boite: EtatScene["boite"];
  if (quoi === "chef") {
    const t = await boiteDansLImage(
      { type: "image/webp", donnees: octets.toString("base64") },
      'In this picture, find the small cute white ghost mascot with a black cap. Answer only with JSON {"box_2d":[ymin,xmin,ymax,xmax]} normalised to 0-1000, tight around the visible part of the ghost, cap included. If there is none, answer {"box_2d":[]}.',
    );
    if (t.boite) boite = { x: t.boite.x, y: t.boite.y, l: t.boite.w, h: t.boite.h };
  }
  return { octets, modele: r.modele, boite };
}

/** UNE PHOTO DU DOSSIER `public`, à la taille que le moteur accepte. */
export async function photoDuDisque(chemin: string): Promise<Img | null> {
  try {
    const octets = readFileSync(join(process.cwd(), "public", chemin.replace(/^\//, "")));
    const petit = await sharp(octets).rotate().resize(1280, 1280, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
    return { type: "image/jpeg", donnees: petit.toString("base64") };
  } catch {
    return null;
  }
}

/** LA SCÈNE FAITE, AUX DIMENSIONS DE SA MAQUETTE, ET RANGÉE. */
async function fabriquer(
  slug: string,
  quoi: Quoi,
  nom: string,
  photo: Img,
  plat: PlatDuChef | undefined,
): Promise<{ url: string; modele: string; boite?: EtatScene["boite"]; erreur?: undefined } | { erreur: string }> {
  const r = await rendreScene(quoi, nom, photo, plat);
  if ("erreur" in r) return r;
  const supabase = createAdminClient();
  const chemin = `${DOSSIER}/${slug}-${quoi}-scene-${Date.now()}.webp`;
  const { error } = await supabase.storage.from(SEAU).upload(chemin, r.octets, { contentType: "image/webp", upsert: true });
  if (error) return { erreur: `stockage : ${error.message}` };
  return { url: supabase.storage.from(SEAU).getPublicUrl(chemin).data.publicUrl, modele: r.modele, boite: r.boite };
}

const cleScene = (quoi: Quoi) => (quoi === "plat" ? "scenePlat" : "sceneChef") as "scenePlat" | "sceneChef";
const photoDe = (e: ExperienceResto, quoi: Quoi) => (quoi === "plat" ? e.plat?.photo : e.chef?.photo);

/** UNE SCÈNE, SI ELLE EST À FAIRE. Rien ne lève. */
async function completerUne(slug: string, quoi: Quoi): Promise<void> {
  const l = await laLigne(slug);
  if (!l) return;
  const scene = l.experience[cleScene(quoi)];
  const photo = photoDe(l.experience, quoi);
  if (!photo || !scene || scene.source !== photo || !sceneARefaire(scene, quoi)) return;
  // UN PLAT DONT LA JOURNÉE EST FINIE N'A PLUS BESOIN DE SCÈNE.
  if (quoi === "plat" && !platEnCours(l.experience.plat)) return;
  // ON NOTE L'ESSAI AVANT DE PAYER : deux visites rapprochées n'en paient qu'un.
  const essais = (scene.essais ?? 0) + 1;
  await modifier(slug, (e) => {
    const sc = e[cleScene(quoi)];
    if (!sc || sc.source !== photo || !sceneARefaire(sc, quoi)) return null;
    return { ...e, [cleScene(quoi)]: { ...sc, etat: "en-cours", essais, at: new Date().toISOString(), erreur: undefined } };
  });
  const img = await lirePhoto(photo);
  const r = img ? await fabriquer(slug, quoi, l.nom, img, l.experience.plat) : { erreur: "sa photo n'a pas pu être lue" };
  if ("erreur" in r && r.erreur) console.warn("[experience]", JSON.stringify({ slug, quoi, erreur: r.erreur }));
  await modifier(slug, (e) => {
    const sc = e[cleScene(quoi)];
    // IL A CHANGÉ DE PHOTO PENDANT LE RENDU : cette scène ne vaut plus rien.
    if (!sc || sc.source !== photo) return null;
    const fait: EtatScene =
      "url" in r && r.url
        ? {
            ...sc,
            etat: "prete",
            url: r.url,
            modele: r.modele,
            boite: r.boite,
            at: new Date().toISOString(),
            erreur: undefined,
            v: quoi === "chef" ? VERSION_SCENE_CHEF : undefined,
          }
        : { ...sc, etat: "echec", at: new Date().toISOString(), erreur: ("erreur" in r && r.erreur) || "inconnue" };
    return { ...e, [cleScene(quoi)]: fait };
  });
}

/** LES DEUX SCÈNES, EN MÊME TEMPS — elles tiennent ainsi dans les cinq minutes d'une route. */
export async function completerScenes(slug: string): Promise<void> {
  await Promise.all([completerUne(slug, "plat").catch(() => undefined), completerUne(slug, "chef").catch(() => undefined)]);
}

// ═══ CE QUE SON ESPACE COMMERÇANT DEMANDE ═══════════════════════════════════

export type DemandeExperience = {
  /** `null` retire le plat. */
  plat?: {
    nom?: unknown;
    prix?: unknown;
    /** Une photo, ou `photos` : jusqu'à quatre, la principale d'abord. */
    photo?: unknown;
    photos?: unknown;
    phrase?: unknown;
    phraseFort?: unknown;
    /** Son mot enregistré (data:audio/…;base64), ce qu'il a dit, sa durée. */
    voix?: unknown;
    voixTexte?: unknown;
    voixSecondes?: unknown;
    /** Jusqu'à quand : `fin` (ISO ou millisecondes) ou `jours` (1 = jusqu'à ce soir). */
    fin?: unknown;
    jours?: unknown;
  } | null;
  /** `null` retire la photo du cuisinier. */
  chef?: { photo?: unknown } | null;
};

/** LE JETON DE SON ESPACE, ET LA LIGNE QUI VA AVEC — ou rien. */
export async function ligneDuCommercant(slug: string, jeton: string) {
  if (!/^[a-z0-9-]{2,120}$/i.test(slug) || !jeton) return null;
  const l = await laLigne(slug);
  return l && l.jeton && l.jeton === jeton ? l : null;
}

/**
 * IL POSE SON PLAT, SA PHOTO DE CUISINIER — ou les retire.
 *
 * UNE PHOTO NEUVE APPELLE UNE SCÈNE NEUVE ; un nom, un prix ou une phrase
 * changés gardent la scène (elle ne montre que la photo).
 */
export async function poserExperience(slug: string, d: DemandeExperience): Promise<{ experience: ExperienceResto | null; erreur?: string }> {
  let plat: PlatDuChef | null | undefined;
  if (d.plat === null) plat = null;
  else if (d.plat) {
    const nom = s(d.plat.nom).slice(0, 80);
    if (!nom) return { experience: null, erreur: "le nom du plat manque" };
    // SES PHOTOS : `photos` (le comptoir en prend quatre), ou `photo` seule.
    const brutes = (Array.isArray(d.plat.photos) ? d.plat.photos : [d.plat.photo]).map((x) => s(x)).filter(Boolean).slice(0, 4);
    if (!brutes.length) return { experience: null, erreur: "la photo du plat manque" };
    const photos: string[] = [];
    for (const b of brutes) {
      const u = await rangerPhoto(slug, "plat", b);
      if (typeof u !== "string") return { experience: null, erreur: `photo du plat : ${u.erreur}` };
      photos.push(u);
    }
    let voix: string | undefined;
    if (s(d.plat.voix)) {
      const v = await rangerVoix(slug, s(d.plat.voix));
      if (typeof v !== "string") return { experience: null, erreur: `voix : ${v.erreur}` };
      voix = v;
    }
    const secondes = Number(d.plat.voixSecondes);
    plat = {
      nom,
      prix: s(d.plat.prix).slice(0, 20) || undefined,
      photo: photos[0],
      photos,
      phrase: s(d.plat.phrase).slice(0, 220) || undefined,
      phraseFort: s(d.plat.phraseFort).slice(0, 120) || undefined,
      voix,
      voixTexte: s(d.plat.voixTexte).slice(0, 400) || undefined,
      voixSecondes: Number.isFinite(secondes) && secondes > 0 ? Math.round(secondes) : undefined,
      fin: finDuPlat(d.plat.fin, d.plat.jours),
    };
  }
  let chef: { photo: string } | null | undefined;
  if (d.chef === null) chef = null;
  else if (d.chef) {
    const photo = await rangerPhoto(slug, "chef", s(d.chef.photo));
    if (typeof photo !== "string") return { experience: null, erreur: `photo du cuisinier : ${photo.erreur}` };
    chef = { photo };
  }
  const experience = await modifier(slug, (e) => {
    const suite: ExperienceResto = { ...e };
    if (plat === null) {
      delete suite.plat;
      delete suite.scenePlat;
    } else if (plat) {
      suite.plat = plat;
      if (e.scenePlat?.source !== plat.photo) suite.scenePlat = { etat: "attente", source: plat.photo };
    }
    if (chef === null) {
      delete suite.chef;
      delete suite.sceneChef;
    } else if (chef) {
      suite.chef = chef;
      if (e.sceneChef?.source !== chef.photo) suite.sceneChef = { etat: "attente", source: chef.photo };
    }
    return suite;
  });
  return { experience };
}

/**
 * IL DÉCIDE DE SA SCÈNE.
 *   · `refuser`   : sa page reprend sa photo d'origine (la scène est gardée) ;
 *   · `reprendre` : la scène revient sur sa page ;
 *   · `refaire`   : le moteur en fait une autre.
 */
export async function deciderScene(
  slug: string,
  quoi: Quoi,
  action: "refuser" | "reprendre" | "refaire",
): Promise<{ experience: ExperienceResto | null; erreur?: string }> {
  let erreur = "";
  const experience = await modifier(slug, (e) => {
    const sc = e[cleScene(quoi)];
    const photo = photoDe(e, quoi);
    if (!sc || !photo || sc.source !== photo) {
      erreur = "aucune scène pour cette photo";
      return null;
    }
    if (action === "refuser") {
      if (!sc.url) {
        erreur = "la scène n'est pas encore faite";
        return null;
      }
      return { ...e, [cleScene(quoi)]: { ...sc, etat: "refusee" } };
    }
    if (action === "reprendre") {
      if (!sc.url) {
        erreur = "la scène n'est pas encore faite";
        return null;
      }
      return { ...e, [cleScene(quoi)]: { ...sc, etat: "prete" } };
    }
    if (sc.etat === "en-cours" && !sceneAFaire(sc)) {
      erreur = "une scène est déjà en train de se faire";
      return null;
    }
    // UNE AUTRE. Il a jugé celle-ci : sa photo d'origine revient en attendant.
    return { ...e, [cleScene(quoi)]: { etat: "attente", source: photo, essais: 0 } };
  });
  return erreur ? { experience, erreur } : { experience };
}
