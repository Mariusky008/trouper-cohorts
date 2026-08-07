// L'HABITANT — identité progressive.
//
// La règle du produit : consulter Le Direct ne demande rien. Aucune ligne n'est
// créée pour lire. L'identité n'apparaît qu'au premier geste qui engage, et elle
// arrive en deux temps :
//
//   1. UN APPAREIL. Au premier ♥, on pose un jeton dans un cookie et on crée la
//      ligne. Rien n'est demandé, rien n'est promis. Sans cette étape, le
//      premier geste ouvrirait un formulaire — et le geste serait perdu.
//   2. UNE PERSONNE. Le jour où l'habitant veut recevoir le résumé du jour, il
//      donne une adresse. Elle se pose sur la MÊME ligne : les offres gardées et
//      les commerces suivis sont déjà là, rien n'est à refaire.
//
// CANAL : e-mail. Le SMS coûte à l'envoi ; à trois cents abonnés et un envoi par
// jour, la facture arrive avant le premier euro de revenu. C'est l'arbitrage
// déjà retenu pour human_ville_abonnes. La colonne `telephone` existe et reste
// nulle : activer le SMS plus tard sera un canal à brancher, pas une table à
// réécrire.
import { cookies } from "next/headers";

const str = (v: unknown) => (v == null ? "" : String(v));
type Supabase = { from: (t: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

export const COOKIE_HABITANT = "clikme_habitant";
const UN_AN = 60 * 60 * 24 * 365;

export type Habitant = {
  id: string;
  deviceToken: string;
  email: string | null;
  prenom: string;
  villeSlug: string;
  quartier: string;
  rayonM: number;
  categories: string[];
  recoitResume: boolean;
  recoitAlertes: boolean;
  recoitSuivis: boolean;
  recoitVilleInfos: boolean;
  silenceAvant: number;
  silenceApres: number;
  confirme: boolean;
  unsubToken: string;
};

function lire(r: Record<string, unknown>): Habitant {
  return {
    id: str(r.id),
    deviceToken: str(r.device_token),
    email: str(r.email) || null,
    prenom: str(r.prenom),
    villeSlug: str(r.ville_slug),
    quartier: str(r.quartier),
    rayonM: typeof r.rayon_m === "number" ? r.rayon_m : 2000,
    categories: Array.isArray(r.categories) ? r.categories.map(str) : [],
    recoitResume: r.recoit_resume !== false,
    recoitAlertes: r.recoit_alertes !== false,
    recoitSuivis: r.recoit_suivis !== false,
    recoitVilleInfos: r.recoit_ville_infos === true,
    silenceAvant: typeof r.silence_avant === "number" ? r.silence_avant : 9,
    silenceApres: typeof r.silence_apres === "number" ? r.silence_apres : 20,
    confirme: Boolean(r.confirmed_at),
    unsubToken: str(r.unsub_token),
  };
}

const CHAMPS =
  "id, device_token, email, prenom, ville_slug, quartier, rayon_m, categories, recoit_resume, recoit_alertes, recoit_suivis, recoit_ville_infos, silence_avant, silence_apres, confirmed_at, unsub_token";

/**
 * L'habitant courant, s'il existe. **N'en crée jamais.** C'est ce qui garantit
 * que lire Le Direct ne pose aucune ligne en base : les pages appellent cette
 * fonction, seules les routes d'action appellent `assurerHabitant`.
 */
export async function habitantCourant(supabase: Supabase): Promise<Habitant | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_HABITANT)?.value?.trim();
  if (!token) return null;
  try {
    const { data } = await supabase.from("human_habitants").select(CHAMPS).eq("device_token", token).maybeSingle();
    const r = data as Record<string, unknown> | null;
    return r ? lire(r) : null;
  } catch {
    return null;
  }
}

/**
 * L'habitant courant, créé au besoin. Appelée UNIQUEMENT depuis une route
 * d'action (garder, suivre, régler) — jamais depuis le rendu d'une page.
 *
 * Le cookie ne peut être posé que dans une route ou une action serveur ; c'est
 * une raison de plus pour que la création ne vive pas dans le rendu.
 */
export async function assurerHabitant(supabase: Supabase, villeSlug: string): Promise<Habitant | null> {
  const dejaLa = await habitantCourant(supabase);
  if (dejaLa) return dejaLa;
  try {
    const { data, error } = await supabase
      .from("human_habitants")
      .insert({ ville_slug: villeSlug })
      .select(CHAMPS)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const r = data as Record<string, unknown> | null;
    if (!r) return null;
    const h = lire(r);
    const jar = await cookies();
    jar.set(COOKIE_HABITANT, h.deviceToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: UN_AN,
    });
    return h;
  } catch {
    return null;
  }
}

/**
 * Replie l'habitant `source` dans `cible`, puis supprime `source`.
 *
 * Le cas : quelqu'un garde deux offres sans rien donner (ligne d'appareil), puis
 * s'abonne avec une adresse déjà connue dans cette ville (ligne d'e-mail). Deux
 * lignes décrivent alors la même personne. Sans ce repli, ses deux gardées
 * disparaissent au moment précis où elle nous fait confiance — c'est le pire
 * moment possible pour perdre quelque chose.
 *
 * Les gardées et les suivis sont déplacés en `upsert` : la personne peut avoir
 * gardé la même offre des deux côtés, et un conflit de clé ne doit pas faire
 * échouer une inscription.
 */
export async function fusionner(supabase: Supabase, sourceId: string, cibleId: string): Promise<void> {
  if (!sourceId || !cibleId || sourceId === cibleId) return;
  try {
    const { data: g } = await supabase.from("human_gardees").select("publication_id").eq("habitant_id", sourceId);
    const gardees = ((Array.isArray(g) ? g : []) as Array<Record<string, unknown>>).map((r) => str(r.publication_id)).filter(Boolean);
    if (gardees.length) {
      await supabase
        .from("human_gardees")
        .upsert(gardees.map((publication_id) => ({ habitant_id: cibleId, publication_id })), {
          onConflict: "habitant_id,publication_id",
          ignoreDuplicates: true,
        });
    }

    const { data: s } = await supabase.from("human_suivis").select("site_id, visites, created_at").eq("habitant_id", sourceId);
    const suivisSource = ((Array.isArray(s) ? s : []) as Array<Record<string, unknown>>).map((r) => ({
      habitant_id: cibleId,
      site_id: str(r.site_id),
      visites: typeof r.visites === "number" ? r.visites : 0,
      created_at: str(r.created_at) || new Date().toISOString(),
    }));
    if (suivisSource.length) {
      // `ignoreDuplicates` : si la cible suit déjà ce commerce, son compteur de
      // visites est le sien et fait foi. Additionner les deux gonflerait une
      // relation qui n'a pas eu lieu — et les cœurs doivent rester adossés à des
      // visites réelles.
      await supabase.from("human_suivis").upsert(suivisSource, { onConflict: "habitant_id,site_id", ignoreDuplicates: true });
    }

    await supabase.from("human_habitants").delete().eq("id", sourceId);
  } catch {
    // Le repli a échoué : on ne supprime rien. Mieux vaut deux lignes qu'une
    // personne qui perd ses gardées.
  }
}

/** Pose le cookie d'appareil sur la réponse courante. */
export async function poserCookie(deviceToken: string): Promise<void> {
  if (!deviceToken) return;
  const jar = await cookies();
  jar.set(COOKIE_HABITANT, deviceToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UN_AN,
  });
}

/** Les identifiants des publications gardées. Set : l'écran teste l'appartenance
 *  une fois par carte. */
export async function gardees(supabase: Supabase, habitantId: string): Promise<Set<string>> {
  if (!habitantId) return new Set();
  try {
    const { data } = await supabase.from("human_gardees").select("publication_id").eq("habitant_id", habitantId);
    return new Set(((Array.isArray(data) ? data : []) as Array<Record<string, unknown>>).map((r) => str(r.publication_id)));
  } catch {
    return new Set();
  }
}

export type Suivi = { siteId: string; visites: number; depuis: string };

export async function suivis(supabase: Supabase, habitantId: string): Promise<Suivi[]> {
  if (!habitantId) return [];
  try {
    const { data } = await supabase
      .from("human_suivis")
      .select("site_id, visites, created_at")
      .eq("habitant_id", habitantId);
    return ((Array.isArray(data) ? data : []) as Array<Record<string, unknown>>).map((r) => ({
      siteId: str(r.site_id),
      visites: typeof r.visites === "number" ? r.visites : 0,
      depuis: str(r.created_at),
    }));
  } catch {
    return [];
  }
}

// ── Le niveau de relation ───────────────────────────────────────────────────
//
// Cinq cœurs, adossés au nombre de VISITES RÉELLES depuis Le Direct. Rien
// d'inventé : un compteur incrémenté sur un geste, et un palier annoncé qu'on
// peut tenir. Le bloc reste discret, en pied de carte — c'est une relation qui
// se constate, pas un jeu qu'on impose.
export const PALIER_AVANTAGE = 5;

export function coeurs(visites: number): { pleins: number; resteAvantAvantage: number } {
  const pleins = Math.max(0, Math.min(5, Math.round((visites / PALIER_AVANTAGE) * 5)));
  return { pleins, resteAvantAvantage: Math.max(0, PALIER_AVANTAGE - visites) };
}

/** « ♥♥♡♡♡ » — la barre de relation, sans dépendance ni image. */
export function barreCoeurs(visites: number): string {
  const { pleins } = coeurs(visites);
  return "♥".repeat(pleins) + "♡".repeat(5 - pleins);
}
