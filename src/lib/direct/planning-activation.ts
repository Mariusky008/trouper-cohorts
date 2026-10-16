/**
 * 📅 LE JOUR VENU, L'ANNONCE PROGRAMMÉE PART — par le chemin de toujours.
 *
 * Voir `planning-annonces.ts` pour les règles. Ici, ce qui se passe quand son
 * premier jour arrive :
 *
 *   · LE FIL DE SA VILLE (`human_publications`), avec sa fin — Le Direct, les
 *     alertes, les menus du jour la voient comme n'importe quelle annonce ;
 *   · LE BANDEAU DE SA PAGE (`current_offer`), que lisent sa page et
 *     `/ville/<ville>` ;
 *   · SON PLAT DU JOUR, ses photos et SA VOIX dans son Expérience (restaurant) ;
 *   · SA PIÈCE À ESSAYER — la coupe, la veste qui reste quatre jours, le
 *     livre conseillé — dans son catalogue, avec son mot.
 *
 * Elle a été préparée au comptoir, avec son fantôme : elle part exactement
 * comme s'il touchait « Publier » ce matin-là (`comptoir-en-ligne.ts`).
 *
 * ─── QUI LA FAIT PARTIR ───────────────────────────────────────────────────
 *
 * Personne n'attend devant une horloge : le compte n'autorise qu'un passage
 * automatique par jour. Elle part donc AU PREMIER QUI REGARDE — la page de sa
 * ville, sa page, son Espace Pro chargent sa fiche de toute façon, et la
 * vérification ne coûte rien quand rien n'est dû —, et le passage du matin
 * (`/api/cron/direct-planning`) rattrape celles que personne n'a vues.
 *
 * ─── LE BANDEAU NE MONTRE QU'UNE CHOSE ────────────────────────────────────
 *
 * `current_offer` est un objet unique. Quand deux annonces programmées se
 * chevauchent (la veste du lundi au jeudi, la soirée du mardi au samedi), la
 * plus récente le prend ; quand elle se termine, celle qui court encore le
 * reprend (`planning_en_cours`). Une annonce qu'il publie à la main, elle, n'est
 * jamais recouverte tant qu'elle court.
 *
 * FICHIER SERVEUR.
 */
import { publier, limiterVivantes } from "@/lib/direct/publications";
import { villeSlug } from "@/lib/direct/ville";
import { saisirPrix } from "@/lib/direct/prix";
import { envoyerAlertes } from "@/lib/direct/envoi-alertes";
import { publierSurSesReseauxEnFond } from "@/lib/reseaux/intermediaire";
import { MAX_PIECES, piecesDuDiagnostic, type PieceComptoir } from "@/lib/site-internet/pieces-comptoir";
import { poserExperience } from "@/lib/site-internet/experience-scenes";
import { lireEnCours, lirePlanning, MAX_PAR_JOUR, type AnnonceEnCours, type AnnoncePlanifiee } from "@/lib/direct/planning-annonces";

type Supabase = { from: (t: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

const s = (v: unknown) => String(v ?? "").trim();
const objet = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

/** Son bandeau court-il encore ? Sans fin, il court : c'est lui qui l'a voulu ainsi. */
function bandeauCourt(o: unknown, maintenant: number): boolean {
  const b = objet(o);
  if (!s(b.text)) return false;
  const fin = Date.parse(s(b.until));
  return !s(b.until) || !Number.isFinite(fin) || fin > maintenant;
}

/** Le bandeau d'une annonce du planning. `depuis` : l'heure où elle est partie (« publiée à 7 h » sur sa page). */
const bandeauDe = (a: { texte: string; photo: string; fin: string }, depuis: string) => ({
  text: a.texte,
  until: a.fin,
  photo: a.photo || null,
  clicks: 0,
  created_at: depuis,
});

/** Y a-t-il quelque chose à faire pour cette fiche ? Sans écrire, sans lire la base. */
export function planningAFaire(row: Record<string, unknown>, maintenant = Date.now()): boolean {
  const diag = objet(row.diagnostic);
  if (lirePlanning(diag).some((a) => Date.parse(a.debut) <= maintenant)) return true;
  // LE BANDEAU À RENDRE : le sien est fini, une annonce du planning court encore.
  return !bandeauCourt(row.current_offer, maintenant) && lireEnCours(diag, maintenant).length > 0;
}

/**
 * MET EN LIGNE CE QUI EST DÛ pour cette fiche, et rend la fiche à jour (pour
 * que l'écran qui l'a lue montre l'annonce tout de suite).
 *
 * `row` : au moins `id`, `slug`, `business_name`, `city`, `activite`,
 * `diagnostic`, `current_offer`. Ne fait rien, et ne lit rien, quand rien n'est dû.
 */
export async function activerPlanning(
  supabase: Supabase,
  row: Record<string, unknown>,
  maintenant = Date.now(),
): Promise<{ row: Record<string, unknown>; activees: AnnoncePlanifiee[] }> {
  if (!planningAFaire(row, maintenant)) return { row, activees: [] };
  const id = s(row.id);
  if (!id) return { row, activees: [] };

  // ON RELIT SA FICHE JUSTE AVANT D'ÉCRIRE : d'autres routes y rangent ses
  // pièces, son plat, ses réglages. Écrire sur une copie ancienne les effacerait.
  let diag = objet(row.diagnostic);
  let bandeau: unknown = row.current_offer;
  let slug = s(row.slug);
  try {
    const { data } = await supabase.from("human_vitrine_sites").select("diagnostic, current_offer, slug").eq("id", id).maybeSingle();
    if (data) {
      diag = objet((data as Record<string, unknown>).diagnostic);
      bandeau = (data as Record<string, unknown>).current_offer;
      slug = s((data as Record<string, unknown>).slug) || slug;
    }
  } catch {
    /* on travaille sur ce qu'on a */
  }

  const planning = lirePlanning(diag);
  const dues = planning.filter((a) => Date.parse(a.debut) <= maintenant);
  // FINIE SANS AVOIR ÉTÉ VUE (le serveur dormait toute la semaine) : elle ne part pas en retard.
  const aPublier = dues.filter((a) => Date.parse(a.fin) > maintenant);
  const restantes = planning.filter((a) => !dues.includes(a));

  const enCours: AnnonceEnCours[] = [
    ...lireEnCours(diag, maintenant).filter((x) => !aPublier.some((a) => a.id === x.id)),
    ...aPublier.map((a) => ({ id: a.id, texte: a.texte, photo: a.photo, debut: a.debut, fin: a.fin })),
  ];

  // SA PIÈCE : devant son catalogue, jusqu'à sa fin — comme `/api/site-internet/pro/pieces`
  // la pose quand il publie : son rayon, sa cible d'essai, son mot à sa voix.
  const avecPiece = aPublier.flatMap((a) => (a.comptoir?.rayon ? [{ a, c: a.comptoir }] : []));
  let pieces: PieceComptoir[] | undefined;
  if (avecPiece.length) {
    const publieLe = new Date(maintenant).toISOString();
    const nouvelles: PieceComptoir[] = avecPiece.map(({ a, c }) => {
      return {
        id: a.id,
        nom: c.nom,
        ...(c.prix ? { prix: c.prix } : {}),
        photo: c.photos[0],
        rayon: c.rayon ?? "À essayer",
        ...(c.decrire ? { decrire: c.decrire } : {}),
        ...(c.voixTexte ? { detail: c.voixTexte } : {}),
        ...(c.voix ? { voix: c.voix, ...(c.voixSecondes ? { voixSecondes: c.voixSecondes } : {}), ...(c.voixTexte ? { voixTexte: c.voixTexte } : {}) } : {}),
        publieLe,
        fin: a.fin,
      };
    });
    const vivantes = piecesDuDiagnostic(diag).filter((x) => !x.fin || Date.parse(x.fin) > maintenant);
    pieces = [...nouvelles, ...vivantes.filter((x) => !nouvelles.some((n) => n.id === x.id))].slice(0, MAX_PIECES);
  }

  // LE BANDEAU : la plus récente qui part aujourd'hui ; à défaut, celle qui court
  // encore, si le sien est fini. Jamais par-dessus une annonce qui court.
  const maj: Record<string, unknown> = {};
  const recente = [...aPublier].sort((a, b) => b.debut.localeCompare(a.debut))[0];
  if (recente) maj.current_offer = bandeauDe(recente, new Date(maintenant).toISOString());
  else if (!bandeauCourt(bandeau, maintenant)) {
    // REPRISE : elle tourne depuis son premier jour, elle ne redevient pas « nouvelle ».
    const reprise = [...enCours].sort((a, b) => b.debut.localeCompare(a.debut))[0];
    if (reprise) maj.current_offer = bandeauDe(reprise, reprise.debut);
  }

  // RIEN N'A BOUGÉ (son bandeau court encore, rien n'est dû) : on n'écrit pas.
  const enCoursAvant = Array.isArray(diag.planning_en_cours) ? diag.planning_en_cours.length : 0;
  if (!dues.length && !maj.current_offer && enCoursAvant === enCours.length) return { row, activees: [] };

  const nouveauDiag: Record<string, unknown> = { ...diag, planning: restantes, planning_en_cours: enCours };
  if (pieces) nouveauDiag.pieces_comptoir = pieces;
  maj.diagnostic = nouveauDiag;

  // ON ÉCRIT D'ABORD, ON PUBLIE ENSUITE. Sortie du planning avant d'entrer dans
  // le fil : un deuxième visiteur au même instant la trouve déjà partie, et
  // ne la publie pas une seconde fois.
  try {
    const { error } = await supabase.from("human_vitrine_sites").update(maj).eq("id", id);
    if (error) throw new Error(s((error as { message?: string }).message) || "écriture refusée");
  } catch (e) {
    console.error("[planning] mise en ligne impossible :", String((e as Error)?.message ?? e));
    return { row, activees: [] };
  }

  // LE PLAT DU JOUR DU COMPTOIR : son Expérience, ses photos, sa voix — comme « Publier ».
  // Écrit APRÈS la fiche : `poserExperience` relit et réécrit son diagnostic.
  let platPose = false;
  for (const a of [...aPublier].sort((x, y) => x.debut.localeCompare(y.debut))) {
    const c = a.comptoir;
    if (!c?.plat || !slug) continue;
    const r = await poserExperience(slug, {
      plat: {
        nom: c.nom,
        prix: c.prix,
        photos: c.photos,
        ...(c.voix ? { voix: c.voix, voixSecondes: c.voixSecondes } : {}),
        ...(c.voixTexte ? { voixTexte: c.voixTexte } : {}),
        fin: a.fin,
      },
    }).catch((e: unknown) => ({ erreur: String((e as Error)?.message ?? e) }));
    if ("erreur" in r && r.erreur) console.error("[planning] le plat programmé n'a pas pu partir :", r.erreur);
    else platPose = true;
  }
  // LA PAGE QUI L'A FAIT PARTIR LE MONTRE TOUT DE SUITE : on rend la fiche avec son plat.
  if (platPose) {
    try {
      const { data } = await supabase.from("human_vitrine_sites").select("diagnostic").eq("id", id).maybeSingle();
      const relu = (data as Record<string, unknown> | null)?.diagnostic;
      if (relu && typeof relu === "object") maj.diagnostic = relu;
    } catch {
      /* la visite suivante le verra */
    }
  }

  const ville = s(row.city);
  if (aPublier.length && ville) {
    const slugVille = villeSlug(ville);
    for (const a of [...aPublier].sort((x, y) => x.debut.localeCompare(y.debut))) {
      // LA MÊME BORNE QUE « FAIRE UNE ANNONCE » : trois en même temps, la plus ancienne s'efface.
      await limiterVivantes(supabase, id, MAX_PAR_JOUR - 1);
      const pub = await publier(supabase, {
        ville,
        villeSlug: slugVille,
        famille: a.famille,
        texte: a.texte,
        photo: a.photo,
        expireLe: a.fin,
        prix: saisirPrix(a.prix),
        site: { id, slug: s(row.slug), nom: s(row.business_name), activite: s(row.activite) },
      }).catch(() => null);
      if (!pub?.id) console.error("[planning] le fil a refusé l'annonce programmée :", pub?.erreur ?? "raison inconnue");
      // 📣 LE JOUR VENU, ELLE PART AUSSI SUR SES RÉSEAUX — s'il les a connectés.
      // SES MOTS À SON MICRO ET SA PIÈCE, comme une annonce publiée au comptoir : la légende
      // les cite, la porte ouvre l'essai de cette pièce-là (voir `porteDuPost`).
      await publierSurSesReseauxEnFond(
        { id, slug: s(row.slug), nom: s(row.business_name), ville, activite: s(row.activite) },
        {
          texte: a.texte,
          photo: a.photo,
          ...(a.comptoir?.voixTexte ? { mots: a.comptoir.voixTexte } : {}),
          ...(a.comptoir?.rayon ? { piece: a.id } : {}),
        },
      ).catch(() => null);
    }
    try {
      await envoyerAlertes(supabase, slugVille);
    } catch {
      /* le filet quotidien rattrapera */
    }
  }

  return { row: { ...row, ...maj }, activees: aPublier };
}

/**
 * IL RETIRE UNE ANNONCE (ou toutes) depuis « Mes annonces » : celle du planning
 * qui court ne doit pas revenir prendre son bandeau à la visite suivante.
 */
export async function oublierEnCours(supabase: Supabase, siteId: string, texte?: string): Promise<void> {
  if (!siteId) return;
  try {
    const { data } = await supabase.from("human_vitrine_sites").select("diagnostic").eq("id", siteId).maybeSingle();
    const diag = objet((data as Record<string, unknown> | null)?.diagnostic);
    const avant = Array.isArray(diag.planning_en_cours) ? diag.planning_en_cours : [];
    if (!avant.length) return;
    const apres = texte ? avant.filter((x) => s(objet(x).texte) !== texte.trim()) : [];
    if (apres.length === avant.length) return;
    await supabase.from("human_vitrine_sites").update({ diagnostic: { ...diag, planning_en_cours: apres } }).eq("id", siteId);
  } catch {
    /* au pire, son bandeau revient une fois : il pourra le retirer de nouveau */
  }
}
