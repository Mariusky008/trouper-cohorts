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
 * ── CE QUI N'EST PAS VÉRIFIÉ ─────────────────────────────────────────────
 * La documentation de PostPeer n'était pas joignable depuis l'atelier : les
 * chemins et les champs ci-dessous viennent de ses extraits publics. Chaque
 * lecture est donc DÉFENSIVE (plusieurs noms de champ acceptés), et chaque
 * échec remonte avec le message de l'intermédiaire, pour être corrigé en une
 * ligne au premier essai réel. Rien ne part tant que `POSTPEER_API_KEY` n'est
 * pas posée sur Vercel.
 *
 * SERVEUR SEULEMENT : la clé ne doit jamais atteindre un navigateur.
 */
import { createHash } from "crypto";
import sharp from "sharp";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site-url";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";
import {
  legendeReseaux,
  PLATEFORMES_PAR_DEFAUT,
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
export async function publierPartout(p: { texte: string; images: string[]; comptes: CompteReseau[] }): Promise<Omit<DernierePublication, "at" | "texte">> {
  const r = await appeler("/posts", {
    method: "POST",
    delai: 45_000,
    corps: {
      content: p.texte,
      platforms: p.comptes.map((c) => ({ platform: c.plateforme, accountId: c.id })),
      publishNow: true,
      // PLUSIEURS PHOTOS : un carrousel sur Instagram, un album sur Facebook.
      mediaItems: p.images.map((url) => ({ type: "image", url })),
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

/** La photo, telle que les réseaux l'acceptent — entière. Exportée pour être essayée seule. */
export async function cadrerPourReseaux(brut: Buffer): Promise<Buffer> {
  // `rotate()` d'abord : une photo de téléphone porte son sens dans ses
  // métadonnées. `flatten()` : un PNG détouré passerait sur fond noir en JPEG.
  const droite = await sharp(brut).rotate().flatten({ background: "#ffffff" }).toBuffer();
  const meta = await sharp(droite).metadata();
  const ratio = (meta.width ?? 1080) / (meta.height ?? 1080);
  const largeur = 1080;
  if (ratio >= 0.8 && ratio <= 1.91) {
    // DÉJÀ DANS LES CLOUS : on la réduit, on n'y touche pas.
    return sharp(droite).resize(largeur, Math.round(largeur / ratio), { fit: "fill" }).jpeg({ quality: 88 }).toBuffer();
  }
  const hauteur = Math.round(largeur / (ratio < 0.8 ? 0.8 : 1.91));
  const fond = await sharp(droite).resize(largeur, hauteur, { fit: "cover" }).blur(36).modulate({ brightness: 0.62 }).toBuffer();
  const photoEntiere = await sharp(droite).resize(largeur, hauteur, { fit: "inside" }).toBuffer();
  return sharp(fond).composite([{ input: photoEntiere, gravity: "centre" }]).jpeg({ quality: 88 }).toBuffer();
}

export async function imagePourReseaux(slug: string, photo: string): Promise<string | { erreur: string }> {
  const brut = await octetsDe(s(photo));
  if (!brut) return { erreur: "photo introuvable" };
  let octets: Buffer;
  try {
    octets = await cadrerPourReseaux(brut);
  } catch {
    return { erreur: "photo illisible" };
  }
  const supabase = createAdminClient();
  const chemin = `${DOSSIER}/${slug}-reseaux-${createHash("sha1").update(octets).digest("hex").slice(0, 16)}.jpg`;
  const { error } = await supabase.storage.from(SEAU).upload(chemin, octets, { contentType: "image/jpeg", upsert: true });
  if (error) return { erreur: `stockage : ${error.message}` };
  return supabase.storage.from(SEAU).getPublicUrl(chemin).data.publicUrl;
}

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
  annonce: { texte: string; photo: string | null; autres?: string[] },
): Promise<DernierePublication | null> {
  try {
    if (!reseauxConfigures() || !site.id || !annonce.photo) return null;
    const { data } = await createAdminClient().from("human_vitrine_sites").select("diagnostic").eq("id", site.id).maybeSingle();
    const reseaux = reseauxDuDiagnostic((data as Record<string, unknown> | null)?.diagnostic);
    if (!reseaux.auto || !reseaux.comptes.length) return null;

    const texte = annonce.texte.trim();
    const image = await imagePourReseaux(site.slug, annonce.photo);
    // SES AUTRES PHOTOS (trois au plus) : celles qui ne passent pas sont laissées, pas l'annonce.
    const suite = (await Promise.all((annonce.autres ?? []).slice(0, 3).map((x) => imagePourReseaux(site.slug, x)))).filter(
      (x): x is string => typeof x === "string",
    );
    const metier = site.activite ? resolveMetier(site.activite).entry?.label ?? "" : "";
    const legende = legendeReseaux({
      texte,
      nom: site.nom,
      ville: site.ville,
      metier,
      lien: `${SITE_URL.replace(/^https?:\/\/(www\.)?/, "")}/site-internet/apercu/${site.slug}`,
    });
    // SA FICHE GOOGLE REÇOIT SES MOTS, ET RIEN D'AUTRE. Le post est déjà sur
    // SA fiche, sous son nom et son adresse : « 📍 nom · ville » et les
    // mots-dièse y feraient doublon, et Google n'aime pas les liens dans le
    // texte d'un post. Un seul appel par groupe : Instagram et Facebook d'un côté,
    // Google de l'autre.
    const google = reseaux.comptes.filter((c) => c.plateforme === "googlebusiness");
    const autres = reseaux.comptes.filter((c) => c.plateforme !== "googlebusiness");
    // GOOGLE PREND LA PREMIÈRE SEULEMENT : un post de fiche montre une photo.
    // UN CARROUSEL REFUSÉ REPART EN UNE PHOTO : mieux vaut sa première photo
    // sur Instagram que rien du tout parce que la troisième ne plaisait pas.
    const versAutres = async (images: string[]) => {
      const r = await publierPartout({ texte: legende, images, comptes: autres });
      if (images.length < 2 || !r.erreurs.length) return r;
      const rates = autres.filter((c) => r.erreurs.some((e) => e.plateforme === c.plateforme));
      const encore = await publierPartout({ texte: legende, images: images.slice(0, 1), comptes: rates });
      return { ok: [...r.ok, ...encore.ok], erreurs: encore.erreurs };
    };
    const envois =
      typeof image === "string"
        ? await Promise.all([
            autres.length ? versAutres([image, ...suite]) : null,
            google.length ? publierPartout({ texte, images: [image], comptes: google }) : null,
          ])
        : [];
    const resultat =
      typeof image === "string"
        ? {
            ok: envois.flatMap((e) => e?.ok ?? []),
            erreurs: envois.flatMap((e) => e?.erreurs ?? []),
          }
        : { ok: [], erreurs: reseaux.comptes.map((c) => ({ plateforme: c.plateforme, message: image.erreur })) };
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
