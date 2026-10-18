/**
 * 📣 L'INTERMÉDIAIRE QUI PUBLIE SUR SES RÉSEAUX — PostPeer, côté serveur.
 *
 * Voir `reseaux-donnees.ts` pour le pourquoi. Ici, le comment :
 *
 *   1. un PROFIL par commerçant chez l'intermédiaire (`creerProfil`) — ses
 *      comptes y sont rangés, à part de ceux des autres commerçants ;
 *   2. un LIEN DE CONNEXION par réseau (`lienDeConnexion`) : le commerçant
 *      l'ouvre, se connecte à SON Instagram comme d'habitude, accepte, et
 *      revient — nous ne voyons jamais son mot de passe ;
 *   3. la LISTE de ses comptes connectés (`comptesConnectes`) ;
 *   4. PUBLIER (`publierPartout`) : un texte, une image en https, ses comptes.
 *
 * ── CE QUI EST VÉRIFIÉ, ET D'OÙ VIENNENT LES CHAMPS ──────────────────────
 * Les publications partent en vrai sur des comptes de commerçants : profils,
 * connexions et `/posts` répondent comme écrit ici. Les champs ajoutés
 * ensuite — le texte par réseau (`platforms[].content`), le bouton du post
 * Google et la couverture d'un Reel (`platforms[].platformSpecificData`), la
 * vidéo (`mediaItems[].type: "video"`) — suivent les types du SDK officiel
 * (`@postpeer/node` 0.9.0). Les lectures restent DÉFENSIVES (plusieurs noms
 * de champ acceptés), et chaque échec remonte avec le message de
 * l'intermédiaire. Rien ne part tant que `POSTPEER_API_KEY` n'est pas posée
 * sur Vercel.
 *
 * SERVEUR SEULEMENT : la clé ne doit jamais atteindre un navigateur.
 */
import { createHash } from "crypto";
import sharp from "sharp";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site-url";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import {
  legendeReseaux,
  lienDeLaPorte,
  PLATEFORMES_PAR_DEFAUT,
  porteDuPost,
  reseauxDuDiagnostic,
  type CompteReseau,
  type DernierePublication,
  type Reseaux,
} from "@/lib/reseaux/reseaux-donnees";

const s = (v: unknown) => String(v ?? "").trim();
const CLE = () => s(process.env.POSTPEER_API_KEY);
const BASE = () => (s(process.env.POSTPEER_BASE_URL) || "https://api.postpeer.dev/v1").replace(/\/+$/, "");
const SEAU = s(process.env.COUVERTURE_BUCKET) || "marketplace-privilege-offers";
const DOSSIER = "comptoir-clikme";

/** L'intermédiaire est branché : sa clé est posée sur Vercel. */
export const reseauxConfigures = () => Boolean(CLE());

/**
 * Les réseaux proposés au commerçant. `RESEAUX_PLATEFORMES` (« instagram,
 * facebook,linkedin ») permet d'en ajouter un sans toucher au code — une
 * variable sur Vercel, puis un redéploiement.
 */
export function plateformesProposees(): string[] {
  const env = s(process.env.RESEAUX_PLATEFORMES)
    .toLowerCase()
    .split(/[\s,;]+/)
    .filter((x) => /^[a-z0-9_-]{2,30}$/.test(x));
  return env.length ? [...new Set(env)] : PLATEFORMES_PAR_DEFAUT;
}

type Reponse = { ok: boolean; status: number; json: unknown; erreur?: string; location?: string };

async function appeler(chemin: string, init: { method?: string; corps?: unknown; delai?: number; manuel?: boolean } = {}): Promise<Reponse> {
  if (!CLE()) return { ok: false, status: 0, json: null, erreur: "intermédiaire non configuré" };
  const ctl = new AbortController();
  const minuteur = setTimeout(() => ctl.abort(), init.delai ?? 20_000);
  try {
    const r = await fetch(`${BASE()}${chemin}`, {
      method: init.method ?? "GET",
      headers: { "x-access-key": CLE(), accept: "application/json", ...(init.corps ? { "content-type": "application/json" } : {}) },
      ...(init.corps ? { body: JSON.stringify(init.corps) } : {}),
      ...(init.manuel ? { redirect: "manual" as const } : {}),
      signal: ctl.signal,
      cache: "no-store",
    });
    const texte = await r.text().catch(() => "");
    let json: unknown = null;
    try {
      json = texte ? JSON.parse(texte) : null;
    } catch {
      json = texte;
    }
    const location = r.headers.get("location") ?? undefined;
    if (!r.ok && !(init.manuel && r.status >= 300 && r.status < 400)) {
      return { ok: false, status: r.status, json, erreur: messageDe(json) || `erreur ${r.status}` };
    }
    return { ok: true, status: r.status, json, location };
  } catch (e) {
    return { ok: false, status: 0, json: null, erreur: (e as Error)?.name === "AbortError" ? "délai dépassé" : String((e as Error)?.message ?? e) };
  } finally {
    clearTimeout(minuteur);
  }
}

/** Le message d'erreur de l'intermédiaire, où qu'il l'ait rangé. */
function messageDe(j: unknown): string {
  if (typeof j === "string") return j.slice(0, 200);
  if (!j || typeof j !== "object") return "";
  const o = j as Record<string, unknown>;
  for (const k of ["message", "error", "erreur", "detail", "reason"]) {
    const v = o[k];
    if (typeof v === "string" && v) return v.slice(0, 200);
    if (v && typeof v === "object") {
      const m = messageDe(v);
      if (m) return m;
    }
  }
  return "";
}

const objet = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** Le premier identifiant trouvé : `id`, `profileId`, `_id`, à la racine ou sous `data`/`profile`. */
function identifiant(j: unknown): string {
  const o = objet(j);
  for (const c of [o, objet(o.data), objet(o.profile), objet(objet(o.data).profile)]) {
    for (const k of ["id", "profileId", "_id"]) if (s(c[k])) return s(c[k]);
  }
  return "";
}

/** Crée son profil chez l'intermédiaire. */
export async function creerProfil(nom: string): Promise<{ profil?: string; erreur?: string }> {
  const r = await appeler("/profiles", { method: "POST", corps: { name: nom.slice(0, 80) || "Commerce ClikMe" } });
  if (!r.ok) return { erreur: r.erreur };
  const profil = identifiant(r.json);
  return profil ? { profil } : { erreur: "profil créé, mais son identifiant est introuvable dans la réponse" };
}

/** La première adresse https d'une réponse, de préférence sous une clé qui parle d'URL. */
function premiereUrl(j: unknown, profondeur = 0): string {
  if (profondeur > 4) return "";
  if (typeof j === "string") return /^https:\/\//i.test(j) ? j : "";
  if (Array.isArray(j)) {
    for (const x of j) {
      const u = premiereUrl(x, profondeur + 1);
      if (u) return u;
    }
    return "";
  }
  const o = objet(j);
  const cles = Object.keys(o).sort((a, b) => Number(/url|link|auth/i.test(b)) - Number(/url|link|auth/i.test(a)));
  for (const k of cles) {
    const u = premiereUrl(o[k], profondeur + 1);
    if (u) return u;
  }
  return "";
}

/**
 * LE LIEN QU'IL OUVRE POUR CONNECTER UN RÉSEAU. `retour` : la page où le
 * ramener une fois connecté (son comptoir) — transmis à l'intermédiaire, qui
 * peut l'ignorer : le comptoir sait de toute façon relire ses comptes.
 */
export async function lienDeConnexion(plateforme: string, profil: string, retour?: string): Promise<{ url?: string; erreur?: string }> {
  const q = new URLSearchParams({ profileId: profil });
  if (retour) q.set("redirectUri", retour);
  const r = await appeler(`/connect/${encodeURIComponent(plateforme)}?${q}`, { manuel: true });
  if (!r.ok) return { erreur: r.erreur };
  const url = r.location && /^https:\/\//i.test(r.location) ? r.location : premiereUrl(r.json);
  return url ? { url } : { erreur: "l'intermédiaire n'a pas rendu de lien de connexion" };
}

/** Ses comptes connectés, rangés dans SON profil — jamais ceux d'un autre. */
export async function comptesConnectes(profil: string): Promise<{ comptes?: CompteReseau[]; erreur?: string }> {
  const r = await appeler(`/connect/integrations?${new URLSearchParams({ profileId: profil })}`);
  if (!r.ok) return { erreur: r.erreur };
  const o = objet(r.json);
  const liste = [o.integrations, o.accounts, o.data, objet(o.data).integrations, r.json].find(Array.isArray) as unknown[] | undefined;
  const comptes: CompteReseau[] = [];
  for (const x of liste ?? []) {
    const c = objet(x);
    // UN COMPTE QUI DIT APPARTENIR À UN AUTRE PROFIL N'EST PAS LE SIEN.
    const sonProfil = s(c.profileId ?? c.profile_id);
    if (sonProfil && sonProfil !== profil) continue;
    const id = s(c.id ?? c.accountId ?? c._id ?? c.integrationId);
    const plateforme = s(c.platform ?? c.provider ?? c.type).toLowerCase();
    if (!id || !plateforme) continue;
    const nom = s(c.username ?? c.name ?? c.displayName ?? c.pageName);
    comptes.push({ id, plateforme, ...(nom ? { nom: nom.slice(0, 80) } : {}) });
  }
  return { comptes };
}

/**
 * PUBLIER SUR SES COMPTES. Rend les réseaux où c'est parti et ceux qui ont
 * refusé, avec la raison. Une réponse sans détail par réseau mais acceptée
 * compte comme partie partout : c'est ce que l'intermédiaire nous dit.
 */
/** Une photo ou une vidéo, en https chez nous. `thumbnail` : l'image d'une vidéo sur Facebook. */
export type Media = { type: "image" | "video"; url: string; thumbnail?: string };

/** Ce qui change d'un réseau à l'autre dans un même envoi : son texte, ses réglages. */
export type ParReseau = { content?: string; platformSpecificData?: Record<string, unknown> };

export async function publierPartout(p: {
  texte: string;
  images?: string[];
  /** À la place des images : une vidéo (un Reel sur Instagram), ou des photos. */
  medias?: Media[];
  comptes: CompteReseau[];
  /** Le texte et les réglages propres à un réseau — voir `ParReseau`. */
  pour?: (c: CompteReseau) => ParReseau | undefined;
}): Promise<Omit<DernierePublication, "at" | "texte">> {
  const medias: Media[] = p.medias ?? (p.images ?? []).map((url) => ({ type: "image" as const, url }));
  const r = await appeler("/posts", {
    method: "POST",
    // UNE VIDÉO SE TÉLÉCHARGE PUIS SE TRAITE CHEZ INSTAGRAM : plus long qu'une photo.
    delai: medias.some((m) => m.type === "video") ? 120_000 : 45_000,
    corps: {
      content: p.texte,
      platforms: p.comptes.map((c) => {
        const en = p.pour?.(c);
        return {
          platform: c.plateforme,
          accountId: c.id,
          ...(en?.content ? { content: en.content } : {}),
          ...(en?.platformSpecificData && Object.keys(en.platformSpecificData).length ? { platformSpecificData: en.platformSpecificData } : {}),
        };
      }),
      publishNow: true,
      // PLUSIEURS PHOTOS : un carrousel sur Instagram, un album sur Facebook.
      // UNE VIDÉO VERTICALE : un Reel sur Instagram (l'intermédiaire le décide seul).
      mediaItems: medias.map((m) => ({ type: m.type, url: m.url, ...(m.thumbnail ? { thumbnail: m.thumbnail } : {}) })),
    },
  });
  const toutes = p.comptes.map((c) => c.plateforme);
  if (!r.ok) return { ok: [], erreurs: toutes.map((plateforme) => ({ plateforme, message: r.erreur ?? "refusé" })) };
  const o = objet(r.json);
  const detail = [o.results, o.platforms, objet(o.data).platforms, objet(o.data).results, objet(o.post).platforms].find(Array.isArray) as unknown[] | undefined;
  if (!detail?.length) return { ok: toutes, erreurs: [] };
  const ok: string[] = [];
  const erreurs: { plateforme: string; message: string }[] = [];
  for (const x of detail) {
    const c = objet(x);
    const plateforme = s(c.platform ?? c.provider).toLowerCase();
    if (!plateforme) continue;
    const etat = s(c.status ?? c.state).toLowerCase();
    const rate = c.success === false || /fail|error|reject/.test(etat) || Boolean(s(c.error));
    if (rate) erreurs.push({ plateforme, message: messageDe(c) || etat || "refusé" });
    else ok.push(plateforme);
  }
  return ok.length || erreurs.length ? { ok, erreurs } : { ok: toutes, erreurs: [] };
}

/* ═══ L'IMAGE QUE LES RÉSEAUX ACCEPTENT ════════════════════════════════════
   Instagram refuse une photo plus haute que 4:5 ou plus large que 1,91:1 — or
   une photo de téléphone en hauteur fait 3:4 ou 9:16, et c'est presque toutes
   celles du comptoir.

   ON NE COUPE PLUS, ON ENCADRE. « Le haut de la photo sur Facebook et Instagram
   apparaît coupé, alors que sur la page commerçant elle est ok. » La première
   version recadrait sur « ce qui attire l'œil » : chez Lili Ross, le sac et
   les ballerines rouges — et la tête de la cliente sortait du cadre. Une
   pièce de mode se juge en entier, de la tête aux pieds. La photo est donc
   posée ENTIÈRE au centre d'un cadre 4:5 (ou 1,91:1 pour une photo très
   large), sur un fond fait d'elle-même, flouté et assombri : pas de bandes
   blanches, et rien ne manque.

   En JPEG, à 1080 points, rangée chez nous : l'intermédiaire va la chercher
   par son adresse. */
async function octetsDe(photo: string): Promise<Buffer | null> {
  const m = /^data:image\/[a-z+.-]+;base64,(.+)$/i.exec(photo);
  if (m) return Buffer.from(m[1], "base64");
  if (!/^https:\/\//i.test(photo)) return null;
  const ctl = new AbortController();
  const minuteur = setTimeout(() => ctl.abort(), 12_000);
  try {
    const r = await fetch(photo, { signal: ctl.signal });
    if (!r.ok) return null;
    const b = Buffer.from(await r.arrayBuffer());
    return b.length <= 15 * 1024 * 1024 ? b : null;
  } catch {
    return null;
  } finally {
    clearTimeout(minuteur);
  }
}

/**
 * La photo, telle que les réseaux l'acceptent — entière. Exportée pour être essayée seule.
 *
 * `voulu` IMPOSE LE FORMAT, et c'est pour deux raisons :
 *   · UN CARROUSEL A LE FORMAT DE SA PREMIÈRE PHOTO. Instagram recadre toutes
 *     les suivantes à son format : une photo en largeur après une photo en
 *     hauteur perdait ses côtés. Elles sont donc toutes posées, entières, dans
 *     le cadre de la première (`publierSurSesReseaux`).
 *   · GOOGLE MONTRE SES POSTS EN LARGEUR (4:3) : une photo en hauteur y perdait
 *     son haut et son bas. Sa fiche reçoit sa propre version, 1200 × 900.
 *   · LA COUVERTURE D'UN REEL est verticale (9:16), comme la vidéo.
 * Même règle partout : on ne coupe pas, on encadre, sur un fond fait d'elle-même.
 */
export async function cadrerPourReseaux(brut: Buffer, voulu?: { ratio: number; largeur?: number }): Promise<Buffer> {
  // `rotate()` d'abord : une photo de téléphone porte son sens dans ses
  // métadonnées. `flatten()` : un PNG détouré passerait sur fond noir en JPEG.
  const droite = await sharp(brut).rotate().flatten({ background: "#ffffff" }).toBuffer();
  const meta = await sharp(droite).metadata();
  const ratio = (meta.width ?? 1080) / (meta.height ?? 1080);
  const largeur = voulu?.largeur ?? 1080;
  const cible = voulu ? voulu.ratio : ratio < 0.8 ? 0.8 : ratio > 1.91 ? 1.91 : ratio;
  if (Math.abs(ratio - cible) / cible < 0.015) {
    // DÉJÀ AU BON FORMAT : on la réduit, on n'y touche pas.
    return sharp(droite).resize(largeur, Math.round(largeur / cible), { fit: "cover" }).jpeg({ quality: 88 }).toBuffer();
  }
  const hauteur = Math.round(largeur / cible);
  const fond = await sharp(droite).resize(largeur, hauteur, { fit: "cover" }).blur(36).modulate({ brightness: 0.62 }).toBuffer();
  const photoEntiere = await sharp(droite).resize(largeur, hauteur, { fit: "inside" }).toBuffer();
  return sharp(fond).composite([{ input: photoEntiere, gravity: "centre" }]).jpeg({ quality: 88 }).toBuffer();
}

/** La photo cadrée, rangée chez nous : son adresse, et le format qu'elle a pris. */
export async function imagePourReseaux(
  slug: string,
  photo: string,
  voulu?: { ratio: number; largeur?: number },
): Promise<{ url: string; ratio: number } | { erreur: string }> {
  const brut = await octetsDe(s(photo));
  if (!brut) return { erreur: "photo introuvable" };
  let octets: Buffer;
  let ratio: number;
  try {
    octets = await cadrerPourReseaux(brut, voulu);
    const m = await sharp(octets).metadata();
    ratio = (m.width ?? 1080) / (m.height ?? 1080);
  } catch {
    return { erreur: "photo illisible" };
  }
  const supabase = createAdminClient();
  const chemin = `${DOSSIER}/${slug}-reseaux-${createHash("sha1").update(octets).digest("hex").slice(0, 16)}.jpg`;
  const { error } = await supabase.storage.from(SEAU).upload(chemin, octets, { contentType: "image/jpeg", upsert: true });
  if (error) return { erreur: `stockage : ${error.message}` };
  return { url: supabase.storage.from(SEAU).getPublicUrl(chemin).data.publicUrl, ratio };
}

/** Le format des posts d'une fiche Google : en largeur. */
const GOOGLE = { ratio: 4 / 3, largeur: 1200 };
/** La couverture d'un Reel : le format de la vidéo. */
const REEL = { ratio: 9 / 16, largeur: 1080 };

/**
 * ═══ UNE VIDÉO PART EN REEL QUAND ELLE EN EST UN ═══════════════════════════
 *
 * Instagram et Facebook la prennent en MP4 (H.264) et de 3 à 90 secondes : le
 * format qu'un téléphone écrit et que l'intermédiaire accepte en Reel. En
 * dehors — un WebM d'un navigateur qui ne sait pas écrire de MP4, une
 * interview de quatre questions —, c'est sa couverture qui part en photo, avec
 * le même texte : le post existe quand même, et la vidéo entière est dans Le
 * Direct. Google n'en prend jamais (trente secondes au plus, et elle n'y
 * apparaît pas dans les posts) : sa fiche reçoit la photo.
 */
export const REEL_MAX_S = 90;
export const enReel = (v: { secondes: number; mp4: boolean } | undefined) => Boolean(v && v.mp4 && v.secondes >= 3 && v.secondes <= REEL_MAX_S);

/* ═══ SA FICHE ═══════════════════════════════════════════════════════════ */

/** Relire son diagnostic, changer ses réseaux, écrire — sans effacer le reste. */
export async function changerReseaux(siteId: string, maj: (r: Reseaux) => Reseaux): Promise<Reseaux> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("human_vitrine_sites").select("diagnostic").eq("id", siteId).maybeSingle();
  const diag = objet((data as Record<string, unknown> | null)?.diagnostic);
  const suite = maj(reseauxDuDiagnostic(diag));
  const { error } = await supabase.from("human_vitrine_sites").update({ diagnostic: { ...diag, reseaux: suite } }).eq("id", siteId);
  if (error) throw new Error(error.message);
  return suite;
}

/**
 * ═══ CE QU'IL VIENT DE PUBLIER PART SUR SES RÉSEAUX ═══════════════════════
 *
 * Appelé après chaque annonce (le comptoir, « Faire une annonce », son
 * planning le jour venu). Ne fait rien si l'intermédiaire n'est pas branché,
 * s'il n'a connecté aucun compte, ou s'il a éteint l'envoi. Ne lève jamais :
 * son annonce est déjà en ligne chez nous, ses réseaux sont un plus.
 */
export async function publierSurSesReseaux(
  site: { id: string; slug: string; nom: string; ville?: string; activite?: string },
  annonce: {
    texte: string;
    photo: string | null;
    autres?: string[];
    /** Ce qu'il a dit à son micro, transcrit — ses mots, entre guillemets (voir `legendeReseaux`). */
    mots?: string;
    /** La pièce de son catalogue que montre ce post : la porte ouvre SON essai. */
    piece?: string;
    /** Son interview, chez nous (https) : un Reel quand elle en est un (`enReel`), sa couverture sinon. */
    video?: { url: string; secondes: number; mp4: boolean };
    /** SON CHOIX pour cette annonce (« juste Instagram », « juste ClikMe ») : ces réseaux-là seulement,
     *  même si l'envoi automatique est en pause. Absent : tous ses réseaux, s'ils partent tout seuls. */
    plateformes?: string[];
  },
): Promise<DernierePublication | null> {
  try {
    if (!reseauxConfigures() || !site.id || !annonce.photo) return null;
    const { data } = await createAdminClient().from("human_vitrine_sites").select("diagnostic").eq("id", site.id).maybeSingle();
    const reseaux = reseauxDuDiagnostic((data as Record<string, unknown> | null)?.diagnostic);
    const choisis = annonce.plateformes;
    const comptes = choisis ? reseaux.comptes.filter((c) => choisis.includes(c.plateforme)) : reseaux.comptes;
    if ((!reseaux.auto && !choisis) || !comptes.length) return null;

    const texte = annonce.texte.trim();
    const reel = enReel(annonce.video) ? annonce.video : undefined;
    const [image, imageGoogle, couverture] = await Promise.all([
      imagePourReseaux(site.slug, annonce.photo),
      imagePourReseaux(site.slug, annonce.photo, GOOGLE),
      reel ? imagePourReseaux(site.slug, annonce.photo, REEL) : null,
    ]);
    // SES AUTRES PHOTOS (trois au plus), AU FORMAT DE LA PREMIÈRE : celles qui ne passent pas sont laissées, pas l'annonce.
    const premiere = "url" in image ? image : null;
    const suite = premiere
      ? (await Promise.all((annonce.autres ?? []).slice(0, 3).map((x) => imagePourReseaux(site.slug, x, { ratio: premiere.ratio }))))
          .flatMap((x) => ("url" in x ? [x.url] : []))
      : [];

    // ═══ LA PORTE DE CE POST — voir `porteDuPost` ═══
    const metier = site.activite ? resolveMetier(site.activite).entry?.label ?? "" : "";
    const porte = porteDuPost({ branche: brancheDuMetier(site.activite ?? ""), metier: site.activite, piece: Boolean(annonce.piece) });
    const lien = lienDeLaPorte(SITE_URL, site.slug, porte.essai ? annonce.piece : undefined);
    const legende = (reseau: string) =>
      legendeReseaux({ texte, mots: annonce.mots, nom: site.nom, ville: site.ville, metier, porte: porte.mot, lien, reseau });
    const pour = (c: CompteReseau): ParReseau => ({
      content: legende(c.plateforme),
      // LA COUVERTURE DU REEL : l'image que le montage a choisie, pas la première de la vidéo (une ardoise vide).
      ...(reel && couverture && "url" in couverture
        ? {
            platformSpecificData:
              c.plateforme === "instagram" ? { coverUrl: couverture.url } : c.plateforme === "facebook" ? { videoThumbnailUrl: couverture.url } : {},
          }
        : {}),
    });

    // SA FICHE GOOGLE REÇOIT SES MOTS, ET RIEN D'AUTRE DANS LE TEXTE. Le post
    // est déjà sur SA fiche, sous son nom et son adresse : « 📍 nom · ville »
    // et les mots-dièse y feraient doublon, et Google n'aime pas les liens dans
    // le texte d'un post. LA PORTE EST DANS SON BOUTON (« Réserver », « En
    // savoir plus »). Un appel par groupe : Instagram et Facebook d'un côté,
    // Google de l'autre — leurs images ne sont pas les mêmes.
    const google = comptes.filter((c) => c.plateforme === "googlebusiness");
    const autres = comptes.filter((c) => c.plateforme !== "googlebusiness");
    // UN CARROUSEL REFUSÉ REPART EN UNE PHOTO : mieux vaut sa première photo
    // sur Instagram que rien du tout parce que la troisième ne plaisait pas.
    // UN REEL REFUSÉ REPART EN PHOTO, la même raison.
    const versAutres = async (medias: Media[], repli?: Media[]) => {
      const r = await publierPartout({ texte: legende("facebook"), medias, comptes: autres, pour });
      if (!r.erreurs.length || !repli) return r;
      const rates = autres.filter((c) => r.erreurs.some((e) => e.plateforme === c.plateforme));
      const encore = await publierPartout({ texte: legende("facebook"), medias: repli, comptes: rates, pour: (c) => ({ content: legende(c.plateforme) }) });
      return { ok: [...r.ok, ...encore.ok], erreurs: encore.erreurs };
    };
    // UN BOUTON REFUSÉ NE FAIT PAS TOMBER LE POST : sa fiche le reçoit sans bouton.
    const versGoogle = async (url: string) => {
      const cta = { callToActionType: porte.bouton, callToActionUrl: lien };
      const r = await publierPartout({ texte: legende("googlebusiness"), images: [url], comptes: google, pour: () => ({ platformSpecificData: cta }) });
      if (!r.erreurs.length) return r;
      const encore = await publierPartout({ texte: legende("googlebusiness"), images: [url], comptes: google });
      return encore.erreurs.length ? r : encore;
    };
    const photos: Media[] = premiere ? [premiere.url, ...suite].map((url) => ({ type: "image", url })) : [];
    const envois = premiere
      ? await Promise.all([
          autres.length
            ? reel
              ? versAutres(
                  [{ type: "video", url: reel.url, ...(couverture && "url" in couverture ? { thumbnail: couverture.url } : {}) }],
                  photos.slice(0, 1),
                )
              : versAutres(photos, photos.length > 1 ? photos.slice(0, 1) : undefined)
            : null,
          google.length ? versGoogle("url" in imageGoogle ? imageGoogle.url : premiere.url) : null,
        ])
      : [];
    const resultat = premiere
      ? {
          ok: envois.flatMap((e) => e?.ok ?? []),
          erreurs: envois.flatMap((e) => e?.erreurs ?? []),
        }
      : { ok: [], erreurs: comptes.map((c) => ({ plateforme: c.plateforme, message: "erreur" in image ? image.erreur : "photo illisible" })) };
    const derniere: DernierePublication = { at: new Date().toISOString(), texte: texte.slice(0, 300), ...resultat };
    if (resultat.erreurs.length) console.warn("[reseaux] publication incomplète :", JSON.stringify(resultat.erreurs));
    await changerReseaux(site.id, (r) => ({ ...r, derniere })).catch(() => null);
    return derniere;
  } catch (e) {
    console.error("[reseaux] publication impossible :", String((e as Error)?.message ?? e));
    return null;
  }
}

/**
 * La même chose, APRÈS la réponse quand on est dans une requête : le
 * commerçant ne doit pas attendre qu'Instagram ait répondu pour voir sa fête.
 * Hors requête (un script), on attend simplement.
 */
export async function publierSurSesReseauxEnFond(...args: Parameters<typeof publierSurSesReseaux>): Promise<void> {
  if (!reseauxConfigures() || !args[1].photo) return;
  const travail = publierSurSesReseaux(...args);
  try {
    after(travail);
  } catch {
    await travail;
  }
}
