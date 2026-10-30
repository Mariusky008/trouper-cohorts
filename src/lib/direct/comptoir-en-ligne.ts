/**
 * 🌐 LE COMPTOIR D'UN VRAI COMMERÇANT — ce qu'il publie part en base.
 *
 * « Une fois que le commerçant aura créé son annonce, ça partira sur sa page
 * commerçant et sur le catalogue de la ville. »
 *
 * DEUX ROUTES DE L'ESPACE PRO, LE MÊME JETON (celui de son lien pro) :
 *
 *   · `/api/site-internet/pro/experience` — LE PLAT DU RESTAURANT, l'étape 2
 *     de son Expérience : son nom, son prix, ses photos (la scène est faite
 *     d'après la première), SA VOIX telle que le micro l'enregistre, et sa fin.
 *     Le mode d'emploi est dans `docs/experience-restaurant-espace-pro.md`.
 *   · `/api/site-internet/pro/pieces` — LA PIÈCE À ESSAYER (coupe, pose,
 *     monture, pièce, création) ou LE LIVRE CONSEILLÉ, avec sa photo : elle
 *     entre en tête de son catalogue, donc dans l'essayage de sa page et dans
 *     « Ton prochain livre ». Voir `pieces-comptoir.ts`.
 *   · `/api/site-internet/pro/offer` (`set`) — L'ANNONCE, pour tous les
 *     métiers : elle entre dans Le Direct de sa ville et s'affiche en bandeau
 *     sur sa page. « Il en reste ! » passe par là, avec son échéance de deux
 *     heures.
 *
 * UNE REQUÊTE TIENT EN 4,5 MO (limite de Vercel). Les photos du comptoir sont
 * réduites à mille points et un mot de dix secondes pèse une centaine de
 * kilo-octets : un plat entier y tient largement. La voix part avec le plat
 * et avec la pièce (le livre conseillé, la coupe), jamais avec l'annonce.
 *
 * FICHIER NAVIGATEUR.
 */
import { createClient } from "@/lib/supabase/client";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import type { Publication } from "@/lib/direct/comptoir";
import type { Mission } from "@/lib/direct/missions-commercant";

/** `reseaux` : ses réseaux sociaux vers lesquels l'annonce est EN ROUTE (elle y part après la réponse). */
export type ResultatEnvoi = { ok: boolean; ou: string[]; erreur?: string; reseaux?: string[] };

/** Les métiers dont la pièce entre au catalogue avec sa photo. */
export const AVEC_PIECE = ["coiffure", "ongles", "lunettes", "mode", "createur", "librairie"];

async function poster(url: string, corps: unknown): Promise<{ ok: boolean; erreur?: string; json?: Record<string, unknown> }> {
  try {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
    const json = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    if (!r.ok) return { ok: false, erreur: String(json.error ?? json.erreur ?? `Erreur ${r.status}`), json };
    return { ok: true, json };
  } catch {
    return { ok: false, erreur: "Pas de connexion. Réessaie dans un instant." };
  }
}

/** Le texte de l'annonce dans Le Direct : 140 signes au plus, dans les mots du métier. */
export function texteDeLAnnonce(c: CommerceComptoir, mission: Mission, p: Publication): string {
  const prix = p.prix ? ` · ${p.prix}` : "";
  let t: string;
  if (p.genre === "relance") t = `Il en reste ! ${p.detail ?? ""} · ${p.nom}${prix}`;
  else if (c.famille === "table") t = `${p.nom}${prix}`;
  else if (c.famille === "librairie") t = `Le conseil du libraire : ${p.nom}${prix}`;
  else if (["coiffure", "ongles", "lunettes", "mode"].includes(c.famille)) t = `${mission.quoi} : ${p.nom}${prix}`;
  else t = `${p.nom}${prix}`;
  return t.replace(/\s+/g, " ").replace(/ · ·/g, " ·").trim().slice(0, 140);
}

/** Une annonce telle que la base la rend : ce qui tourne vraiment dans Le Direct. */
export type AnnonceDeLaBase = { id: string; texte: string; photo: string | null; publieLe: string; expireLe: string | null };

/**
 * L'INVERSE DE `texteDeLAnnonce` — « En ligne maintenant » sur tous ses
 * téléphones. Une annonce publiée depuis un autre appareil, ou partie de son
 * planning pendant la nuit, n'est pas dans la mémoire de CE téléphone : on la
 * relit dans la base et elle redevient une carte du comptoir — son nom, son
 * prix, « il en reste ». Une annonce écrite à la main ailleurs garde son texte
 * entier comme nom.
 */
export function publicationDeLaBase(c: CommerceComptoir, mission: Mission, a: AnnonceDeLaBase): Publication {
  let t = a.texte.replace(/\s+/g, " ").trim();
  const relance = /^Il en reste !/i.test(t);
  if (relance) t = t.replace(/^Il en reste !\s*(·\s*)?/i, "");
  for (const debut of [`${mission.quoi} : `, "Le conseil du libraire : "]) if (t.startsWith(debut)) t = t.slice(debut.length);
  const morceaux = t.split(" · ").map((x) => x.trim()).filter(Boolean);
  const dernier = morceaux[morceaux.length - 1] ?? "";
  const prix = morceaux.length > 1 && /\d/.test(dernier) && dernier.length <= 20 ? dernier : "";
  if (prix) morceaux.pop();
  // « Il en reste ! Plus que 5 parts · Magret · 12 € » : le détail d'abord, le plat ensuite.
  const detail = relance && morceaux.length > 1 ? morceaux.shift() : undefined;
  const publieLe = Date.parse(a.publieLe) || Date.now();
  const finLe = a.expireLe && Number.isFinite(Date.parse(a.expireLe)) ? Date.parse(a.expireLe) : publieLe + 3 * 86_400_000;
  return {
    id: `base-${a.id}`,
    famille: c.famille,
    genre: relance ? "relance" : "principal",
    nom: morceaux.join(" · ") || mission.quoi,
    prix,
    ...(detail ? { detail } : {}),
    photos: a.photo ? [a.photo] : [],
    jours: Math.max(1, Math.round((finLe - publieLe) / 86_400_000)),
    publieLe,
    finLe,
    serveurId: a.id,
  };
}

/**
 * RETIRER UNE ANNONCE QUE CE TÉLÉPHONE N'A PAS PUBLIÉE : Le Direct par son
 * identifiant, et ce qui l'accompagnait — le plat de son Expérience s'il est
 * bien celui-là, la pièce de son catalogue qui porte ce nom (jamais une photo
 * de sa vitrine, qui reste).
 */
export async function retirerDeLaBase(c: CommerceComptoir, p: Publication): Promise<void> {
  if (!c.reel || !p.serveurId) return;
  const { slug, token } = c.reel;
  await poster("/api/site-internet/pro/offer", { slug, token, action: "retirer_annonce", id: p.serveurId });
  if (p.genre !== "principal") return;
  if (c.famille === "table") {
    try {
      const r = await fetch(`/api/site-internet/pro/experience?slug=${encodeURIComponent(slug)}&token=${encodeURIComponent(token)}`);
      const j = (await r.json().catch(() => ({}))) as { experience?: { plat?: { nom?: string } } };
      if (j.experience?.plat?.nom === p.nom) await poster("/api/site-internet/pro/experience", { slug, token, action: "poser", plat: null });
    } catch {
      /* hors ligne : son plat finira le soir de lui-même */
    }
  }
  if (AVEC_PIECE.includes(c.famille)) {
    const l = await poster("/api/site-internet/pro/pieces", { slug, token, action: "lire" });
    const pieces = (l.json?.pieces ?? []) as { id: string; nom: string; vitrine?: boolean }[];
    for (const x of pieces.filter((x) => !x.vitrine && x.nom === p.nom)) {
      await poster("/api/site-internet/pro/pieces", { slug, token, action: "retirer", id: x.id });
    }
  }
}

/**
 * PUBLIER EN LIGNE. Rend où c'est arrivé (« ta page », « Le Direct ») ou la
 * raison de l'échec — le comptoir l'affiche, avec « Réessayer ».
 */
export async function envoyerEnLigne(
  c: CommerceComptoir,
  mission: Mission,
  p: Publication,
  principal?: Publication,
  /**
   * 🎬 Le film du reporter (il n'a pas voulu parler) : il part avec l'annonce, comme une interview. Et 🎞️ son
   * Reel de 10 s (`reel`) : c'est lui que reçoivent ses réseaux ; s'il n'a pas pu partir, ils prennent le film.
   */
  film?: { blob: Blob; type: string; duree: number; reel?: { blob: Blob; type: string; duree: number } | null },
): Promise<ResultatEnvoi> {
  if (!c.reel) return { ok: false, ou: [], erreur: "Ce commerce n'a pas de lien pro." };
  const { slug, token } = c.reel;
  const ou: string[] = [];
  const erreurs: string[] = [];
  let reseaux: string[] = [];
  // LE FILM D'ABORD : son adresse part avec l'annonce. Un film qui n'a pas pu partir n'empêche pas l'annonce.
  let video: Record<string, string | number | boolean> | null = null;
  if (film && p.genre === "principal") {
    const depot = await deposerVideo(c, film.blob, film.type);
    if ("erreur" in depot) erreurs.push(`Le film du reporter n'a pas pu partir : ${depot.erreur}`);
    else {
      video = { video: depot.url, videoSecondes: Math.round(film.duree * 10) / 10, videoMp4: enMp4(film.type) };
      const reel = film.reel ? await deposerVideo(c, film.reel.blob, film.reel.type) : null;
      if (film.reel && reel && "url" in reel)
        video = { ...video, videoReseaux: reel.url, videoReseauxSecondes: Math.round(film.reel.duree * 10) / 10, videoReseauxMp4: enMp4(film.reel.type) };
    }
  }

  // ── LE PLAT DU RESTAURANT : SA PAGE, ÉTAPE 2 ──
  if (c.famille === "table" && p.genre === "principal") {
    const r = await poster("/api/site-internet/pro/experience", {
      slug,
      token,
      action: "poser",
      plat: {
        nom: p.nom,
        prix: p.prix,
        photos: p.photos.slice(0, 4),
        ...(p.voix ? { voix: p.voix, voixSecondes: p.voixSecondes } : {}),
        ...(p.voixTexte ? { voixTexte: p.voixTexte } : {}),
        fin: p.finLe,
      },
    });
    if (r.ok) ou.push("ta page");
    else erreurs.push(r.erreur ?? "Le plat n'a pas pu partir.");
  }

  // ── LA PIÈCE À ESSAYER, LE LIVRE CONSEILLÉ : SON CATALOGUE ──
  if (AVEC_PIECE.includes(c.famille) && p.genre === "principal" && p.photos[0]) {
    const r = await poster("/api/site-internet/pro/pieces", {
      slug,
      token,
      action: "poser",
      piece: {
        id: p.id,
        nom: p.nom,
        prix: p.prix,
        photo: p.photos[0],
        rayon: c.famille === "librairie" ? "Ses coups de cœur" : mission.quoi,
        ...(c.famille !== "librairie" ? { decrire: p.nom } : {}),
        ...(p.voixTexte ? { detail: p.voixTexte } : {}),
        // SA VOIX PART AVEC LE LIVRE : « la libraire peut mettre un petit
        // message vocal […] mais je ne la vois pas apparaître ». Elle restait
        // dans le comptoir ; elle suit maintenant la pièce.
        ...(p.voix ? { voix: p.voix, voixSecondes: p.voixSecondes, voixTexte: p.voixTexte } : {}),
        fin: p.finLe,
      },
    });
    if (r.ok) ou.push(c.famille === "librairie" ? "« Ton prochain livre »" : "ton essayage");
    else erreurs.push(r.erreur ?? "La pièce n'a pas pu partir.");
  }

  // ── L'ANNONCE : LE DIRECT, ET LE BANDEAU DE SA PAGE ──
  const photo = p.photos[0] ?? (p.genre === "relance" ? principal?.photos[0] : undefined);
  if (photo) {
    const r = await poster("/api/site-internet/pro/offer", {
      slug,
      token,
      action: "set",
      text: texteDeLAnnonce(c, mission, p),
      photo,
      until: new Date(p.genre === "relance" ? Math.min(p.finLe, Date.now() + 2 * 3600_000) : p.finLe).toISOString(),
      famille: c.famille === "table" && p.genre === "principal" ? "menu" : "offre",
      // « IL EN RESTE ! » NE PART PAS SUR SES RÉSEAUX : deux heures chez nous,
      // des mois en haut de son Instagram. Voir `lib/reseaux/intermediaire.ts`.
      // SINON, SON CHOIX (« juste Instagram », « juste ClikMe » = []) ; sans choix, tous.
      reseaux: p.genre === "relance" ? false : (p.reseaux ?? true),
      // SES AUTRES PHOTOS PARTENT EN CARROUSEL SUR SES RÉSEAUX (Le Direct garde la première).
      ...(p.genre !== "relance" && p.photos.length > 1 ? { photosReseaux: p.photos.slice(1, 4) } : {}),
      // CE QU'IL A DIT À SON MICRO, POUR SES RÉSEAUX : la légende le cite entre guillemets —
      // Le Direct, lui, garde ses 140 signes. Et LA PIÈCE que la porte du post fait essayer.
      ...(p.genre !== "relance" && p.voixTexte ? { mots: p.voixTexte } : {}),
      ...(p.genre === "principal" && AVEC_PIECE.includes(c.famille) ? { piece: p.id } : {}),
      ...(video ?? {}),
    });
    // UNE ANNONCE PARTIE SANS RÉSEAUX N'EST PAS UNE ERREUR : l'ancien « sinon » prenait l'absence
    // de réseaux (rien de connecté, ou « juste ClikMe ») pour un échec — « une partie n'a pas suivi :
    // l'annonce n'a pas pu partir », alors qu'elle était dans Le Direct.
    if (r.ok) {
      ou.push("Le Direct");
      if (Array.isArray(r.json?.reseaux)) reseaux = (r.json.reseaux as unknown[]).map(String);
    } else erreurs.push(r.erreur ?? "L'annonce n'a pas pu partir.");
  }

  const enRoute = reseaux.length ? { reseaux } : {};
  return erreurs.length ? { ok: ou.length > 0, ou, erreur: erreurs.join(" "), ...enRoute } : { ok: true, ou, ...enRoute };
}

/** Une vidéo que les réseaux prennent en Reel : du MP4 en H.264, pas du WebM. */
export const enMp4 = (type: string) => /mp4/i.test(type) && !/vp0?8|vp0?9|av01|opus/i.test(type);

/** Le titre de son interview dans Le Direct : 140 signes au plus. */
export function texteDeLInterview(nom: string, prix: string): string {
  return `L’interview du jour : ${nom.trim()}${prix.trim() ? ` · ${prix.trim()}` : ""}`.replace(/\s+/g, " ").slice(0, 140);
}

/**
 * ═══ SON INTERVIEW PART EN LIGNE ══════════════════════════════════════════
 *
 * « Envoyer l'interview dans Le Direct et en Reels Instagram et Facebook. »
 * Trois temps, parce que la vidéo pèse trop lourd pour passer par le site :
 *
 *   1. une adresse signée, contre son jeton pro (`/api/site-internet/pro/interview`) ;
 *   2. la vidéo déposée DIRECTEMENT dans notre stockage depuis son téléphone ;
 *   3. l'annonce, par le chemin de toutes les annonces : Le Direct (la vidéo,
 *      son image en vignette), puis ses réseaux — un Reel quand la vidéo en
 *      est un (MP4, 90 secondes au plus), son image sinon ; Google prend
 *      toujours l'image, avec son bouton.
 *
 * `mots` : ce qu'il a répondu à la première question, transcrit — ses mots,
 * cités dans la légende de ses posts. `reel` : 🎞️ le Reel du jour (une dizaine de
 * secondes, `reel-montage.ts`) — c'est lui que reçoivent ses réseaux ; s'il n'a pas
 * pu partir, ils prennent l'interview, comme avant.
 */
/**
 * LA VIDÉO DÉPOSÉE DANS NOTRE STOCKAGE, depuis son téléphone : une adresse signée contre son jeton pro,
 * puis le fichier directement dans le seau. Rend l'adresse publique de la vidéo, ou l'erreur à dire.
 */
async function deposerVideo(c: CommerceComptoir, blob: Blob, typeBrut: string): Promise<{ url: string } | { erreur: string }> {
  if (!c.reel) return { erreur: "Ce commerce n'a pas de lien pro." };
  const { slug, token } = c.reel;
  const type = typeBrut.split(";")[0];
  const signe = await poster("/api/site-internet/pro/interview", { slug, token, type, taille: blob.size });
  const s = signe.json as { seau?: string; chemin?: string; jeton?: string; url?: string } | undefined;
  if (!signe.ok || !s?.seau || !s.chemin || !s.jeton || !s.url) return { erreur: signe.erreur ?? "L'envoi n'a pas pu commencer." };
  try {
    // LE TYPE NU (« video/mp4 », sans « ;codecs=… ») : c'est celui que le seau accepte.
    const fichier = new Blob([blob], { type });
    const { error } = await createClient().storage.from(s.seau).uploadToSignedUrl(s.chemin, s.jeton, fichier, { contentType: type });
    if (error) throw new Error(error.message);
  } catch {
    return { erreur: "La vidéo n'a pas pu partir. Réessaie, de préférence en wifi." };
  }
  return { url: s.url };
}

export async function envoyerInterview(
  c: CommerceComptoir,
  i: { nom: string; prix: string; blob: Blob; type: string; duree: number; affiche: string; mots?: string; reel?: { blob: Blob; type: string; duree: number } | null },
): Promise<ResultatEnvoi> {
  if (!c.reel) return { ok: false, ou: [], erreur: "Ce commerce n'a pas de lien pro." };
  const { slug, token } = c.reel;
  const depot = await deposerVideo(c, i.blob, i.type);
  if ("erreur" in depot) return { ok: false, ou: [], erreur: depot.erreur };
  const s = depot;
  const reel = i.reel ? await deposerVideo(c, i.reel.blob, i.reel.type) : null;
  // SA VIDÉO VIT JUSQU'À CE SOIR, COMME SON PLAT DU JOUR.
  const ceSoir = new Date();
  ceSoir.setHours(23, 59, 0, 0);
  const r = await poster("/api/site-internet/pro/offer", {
    slug,
    token,
    action: "set",
    text: texteDeLInterview(i.nom, i.prix),
    photo: i.affiche,
    video: s.url,
    videoSecondes: Math.round(i.duree * 10) / 10,
    videoMp4: enMp4(i.type),
    ...(i.reel && reel && "url" in reel
      ? { videoReseaux: reel.url, videoReseauxSecondes: Math.round(i.reel.duree * 10) / 10, videoReseauxMp4: enMp4(i.reel.type) }
      : {}),
    until: ceSoir.toISOString(),
    famille: c.famille === "table" ? "menu" : "offre",
    ...(i.mots ? { mots: i.mots } : {}),
  });
  if (!r.ok) return { ok: false, ou: [], erreur: r.erreur ?? "L'annonce n'a pas pu partir." };
  const reseaux = Array.isArray(r.json?.reseaux) ? (r.json.reseaux as unknown[]).map(String) : [];
  return { ok: true, ou: ["Le Direct", "ta page"], ...(reseaux.length ? { reseaux } : {}) };
}

/**
 * ═══ SON ÉPISODE PART EN LIGNE ════════════════════════════════════════════
 *
 * Le chemin de l'interview (`deposerVideo`, puis l'annonce), avec deux films :
 * l'ÉPISODE entier (deux à quatre minutes) pour Le Direct et sa page, et la
 * BANDE-ANNONCE pour ses réseaux — Instagram et Facebook ne prennent en Reel
 * que 90 secondes au plus (`REEL_MAX_S`). Un épisode assez court part tel quel
 * partout (`bande` absente).
 */
export async function envoyerEpisode(
  c: CommerceComptoir,
  e: { texte: string; affiche: string; episode: { blob: Blob; type: string; duree: number }; bande?: { blob: Blob; type: string; duree: number } | null },
): Promise<ResultatEnvoi> {
  if (!c.reel) return { ok: false, ou: [], erreur: "Ce commerce n'a pas de lien pro." };
  const { slug, token } = c.reel;
  const film = await deposerVideo(c, e.episode.blob, e.episode.type);
  if ("erreur" in film) return { ok: false, ou: [], erreur: film.erreur };
  const bande = e.bande ? await deposerVideo(c, e.bande.blob, e.bande.type) : null;
  const ceSoir = new Date();
  ceSoir.setHours(23, 59, 0, 0);
  const r = await poster("/api/site-internet/pro/offer", {
    slug,
    token,
    action: "set",
    text: e.texte,
    photo: e.affiche,
    video: film.url,
    videoSecondes: Math.round(e.episode.duree * 10) / 10,
    videoMp4: enMp4(e.episode.type),
    // LA BANDE-ANNONCE, POUR SES RÉSEAUX : si elle n'a pas pu partir, ses réseaux prennent l'image
    ...(e.bande && bande && "url" in bande
      ? { videoReseaux: bande.url, videoReseauxSecondes: Math.round(e.bande.duree * 10) / 10, videoReseauxMp4: enMp4(e.bande.type) }
      : {}),
    until: ceSoir.toISOString(),
    famille: c.famille === "table" ? "menu" : "offre",
  });
  if (!r.ok) return { ok: false, ou: [], erreur: r.erreur ?? "L'annonce n'a pas pu partir." };
  const reseaux = Array.isArray(r.json?.reseaux) ? (r.json.reseaux as unknown[]).map(String) : [];
  return { ok: true, ou: ["Le Direct", "ta page"], ...(reseaux.length ? { reseaux } : {}) };
}

/** Retirer en ligne : le plat de sa page, et l'annonce du Direct qui porte ce texte. */
export async function retirerEnLigne(c: CommerceComptoir, mission: Mission, p: Publication): Promise<void> {
  if (!c.reel) return;
  const { slug, token } = c.reel;
  if (c.famille === "table" && p.genre === "principal") {
    await poster("/api/site-internet/pro/experience", { slug, token, action: "poser", plat: null });
  }
  if (AVEC_PIECE.includes(c.famille) && p.genre === "principal") {
    await poster("/api/site-internet/pro/pieces", { slug, token, action: "retirer", id: p.id });
  }
  const liste = await poster("/api/site-internet/pro/offer", { slug, token, action: "annonces" });
  const texte = texteDeLAnnonce(c, mission, p);
  const annonces = (liste.json?.annonces ?? []) as { id: string; texte: string }[];
  const cible = annonces.find((a) => a.texte.trim() === texte);
  if (cible) await poster("/api/site-internet/pro/offer", { slug, token, action: "retirer_annonce", id: cible.id });
}
