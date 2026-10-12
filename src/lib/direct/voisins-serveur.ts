/**
 * 🏘️ LA RUE D'UN VRAI COMMERÇANT — ses deux voisins, lus dans la base. FICHIER SERVEUR.
 *
 * Les voisins sont des commerces CLIENTS de ClikMe (`est_client`) : ce sont
 * eux qui ont une page où l'on peut essayer, goûter, réserver. Leur position
 * vient de leur adresse, localisée par la tâche `direct-geocoder` ; le choix
 * suit `choisirLesVoisins` (`voisins.ts`) — les siens d'abord
 * (`metadata.voisins`, réglés depuis son espace pro), puis les plus proches.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { COLONNES_FICHE, construireFiche } from "@/lib/site-internet/fiche-du-site";
import { carteDepuisFiche } from "@/lib/site-internet/carte-depuis-fiche";
import { momentsDuCommercant } from "@/lib/direct/ville-reelle";
import { villeSlug } from "@/lib/direct/ville";
import { fantomeDe } from "@/lib/direct/copains";
import { BOUTON_VOISIN, aPied, choisirLesVoisins, distanceM, raisonDuVoisin, type Candidat, type Point } from "@/lib/direct/voisins";
import type { CarteAutour } from "@/lib/direct/apercu-habitant";

/** Ce que la rue montre d'un voisin. */
export type Voisin = {
  id: string;
  nom: string;
  metier: string;
  photo: string;
  fantome: string;
  /** « À 2 min à pied » — absent tant que l'adresse n'est pas localisée. */
  aPied?: string;
  /** Pourquoi y aller, en une ligne. */
  raison: string;
  bouton: string;
  /** Sa page, ouverte en visiteur envoyé par un voisin. */
  page: string;
};

export type LaRue = {
  moi: { id: string; nom: string; metier: string; ville: string; villeSlug: string; fantome: string };
  voisins: Voisin[];
};

/** Un commerce proche, pour le choix dans l'espace pro. */
export type Proche = { id: string; nom: string; metier: string; aPied?: string };

const str = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number.NaN);
const pointDe = (r: Record<string, unknown>): Point | undefined => {
  const lat = num(r.latitude);
  const lng = num(r.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0) ? { lat, lng } : undefined;
};
const meta = (r: Record<string, unknown>) => (r.metadata && typeof r.metadata === "object" ? r.metadata : {}) as Record<string, unknown>;

/** Ceux qu'il a choisis lui-même — deux au plus, des adresses de page. */
export function voisinsChoisis(r: Record<string, unknown>): string[] {
  const v = meta(r).voisins;
  return Array.isArray(v) ? v.map(str).filter((x) => /^[a-z0-9-]{2,90}$/.test(x)).slice(0, 2) : [];
}

const memeVille = (a: string, b: string) => {
  const x = villeSlug(a);
  const y = villeSlug(b);
  return Boolean(x && y) && (x === y || x.startsWith(`${y}-`) || y.startsWith(`${x}-`) || x.endsWith(`-${y}`) || y.endsWith(`-${x}`));
};

/** À plus de 3 km, ce n'est plus la rue : on n'en fait pas un voisin d'office. */
const RAYON_M = 3000;

type Lu = { row: Record<string, unknown>; carte: CarteAutour; point?: Point };

function lire(r: Record<string, unknown>): Lu | null {
  const s = str(r.slug);
  if (!s) return null;
  try {
    const { fiche } = construireFiche(s, r);
    const carte = carteDepuisFiche(fiche);
    return { row: r, carte: { ...carte, moments: momentsDuCommercant(r, carte, Date.now()) }, point: pointDe(r) };
  } catch {
    return null;
  }
}

async function lesClients(supabase: ReturnType<typeof createAdminClient>): Promise<Record<string, unknown>[]> {
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select(`${COLONNES_FICHE}, slug, latitude, longitude`)
    .eq("channel", "letter")
    .eq("est_client", true)
    .limit(500);
  return (Array.isArray(data) ? data : []) as Record<string, unknown>[];
}

/** Les candidats autour de lui : dans le rayon, ou de sa ville quand on ne sait pas encore où ils sont. */
function autour(moi: Lu, tous: Lu[]): Lu[] {
  return tous.filter((x) => {
    if (x.carte.id === moi.carte.id) return false;
    if (moi.point && x.point) return distanceM(moi.point, x.point) <= RAYON_M;
    return memeVille(str(moi.row.city), str(x.row.city));
  });
}

/** SA RUE : lui, et ses deux voisins. `null` : commerce inconnu. */
export async function lireLaRue(slug: string): Promise<LaRue | null> {
  if (!/^[a-z0-9-]{2,90}$/.test(slug)) return null;
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return null;
  }
  try {
    const { data } = await supabase.from("human_vitrine_sites").select(`${COLONNES_FICHE}, slug, latitude, longitude`).eq("slug", slug).eq("channel", "letter").maybeSingle();
    const moi = data ? lire(data as Record<string, unknown>) : null;
    if (!moi) return null;
    const tous = (await lesClients(supabase)).map(lire).filter((x): x is Lu => Boolean(x));
    const choisis = voisinsChoisis(moi.row);
    // SES CHOIX PEUVENT ÊTRE PLUS LOIN QUE LE RAYON : c'est lui qui sait.
    const proches = autour(moi, tous);
    const candidats: Lu[] = [...proches, ...tous.filter((x) => choisis.includes(x.carte.id) && !proches.includes(x))];
    const parId = new Map(candidats.map((x) => [x.carte.id, x]));
    const pris = choisirLesVoisins(
      { id: moi.carte.id, branche: moi.carte.branche, point: moi.point },
      candidats.map((x): Candidat => ({ id: x.carte.id, branche: x.carte.branche, ...(x.point ? { point: x.point } : {}) })),
      choisis,
    );
    const voisins: Voisin[] = [];
    for (const p of pris) {
      const x = parId.get(p.id);
      if (!x) continue;
      const c = x.carte;
      const offre = c.moments.find((m) => m.titre)?.titre;
      voisins.push({
        id: c.id,
        nom: c.nom,
        metier: c.metier,
        photo: c.photoAccueil || c.photo || c.sesPhotos?.[0]?.src || "",
        fantome: fantomeDe(c),
        ...(p.distance !== undefined ? { aPied: aPied(p.distance) } : {}),
        raison: raisonDuVoisin(moi.carte.branche, c.branche, offre),
        bouton: BOUTON_VOISIN[c.branche] ?? "Découvrir",
        page: `/site-internet/apercu/${encodeURIComponent(c.id)}?via=voisin`,
      });
    }
    const ville = str(moi.row.city) || moi.carte.ville || "";
    return {
      moi: { id: moi.carte.id, nom: moi.carte.nom, metier: moi.carte.metier, ville: moi.carte.ville || ville, villeSlug: villeSlug(ville), fantome: fantomeDe(moi.carte) },
      voisins,
    };
  } catch {
    return null;
  }
}

/** Les commerces ClikMe autour de lui, du plus proche au plus loin — pour qu'il choisisse ses deux voisins. */
export async function lesProches(slug: string): Promise<{ proches: Proche[]; choisis: string[] } | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("human_vitrine_sites").select(`${COLONNES_FICHE}, slug, latitude, longitude`).eq("slug", slug).eq("channel", "letter").maybeSingle();
    const moi = data ? lire(data as Record<string, unknown>) : null;
    if (!moi) return null;
    const tous = (await lesClients(supabase)).map(lire).filter((x): x is Lu => Boolean(x));
    const loin = (x: Lu) => (moi.point && x.point ? distanceM(moi.point, x.point) : Number.POSITIVE_INFINITY);
    const proches = autour(moi, tous)
      .sort((a, b) => loin(a) - loin(b))
      .slice(0, 12)
      .map((x) => ({ id: x.carte.id, nom: x.carte.nom, metier: x.carte.metier, ...(Number.isFinite(loin(x)) ? { aPied: aPied(loin(x)) } : {}) }));
    return { proches, choisis: voisinsChoisis(moi.row) };
  } catch {
    return null;
  }
}
