/**
 * 🏙️ LA VRAIE VILLE — ce que `/ville/<ville>` montre, lu dans la base.
 *
 * « clikme.fr/autour-de-moi : il y a d'abord la démo, et quand on clique sur
 * le petit fantôme en haut à droite on tombe sur la véritable app, qui devra
 * être répliquée au niveau UX, UI et fonctionnalités sur clikme.fr/ville/dax. »
 *
 * C'EST DONC L'APPLICATION ELLE-MÊME (`apercu-habitant.tsx`) QUI S'OUVRE ICI,
 * et ce fichier ne fait que lui donner ses cartes : les commerçants validés
 * comme clients de la ville (« seulement les commerçants validés »), au lieu
 * des commerces inventés de la démonstration. Voir `source-ville.ts` pour la
 * façon dont l'application les reçoit.
 *
 * ═══ UNE CARTE, C'EST SA FICHE, PLUS SES MOMENTS ═══════════════════════════
 *
 * LA FICHE suit la même recette que sa page (`construireFiche` puis
 * `carteDepuisFiche`) : la ville dit de lui exactement ce que sa page dit.
 *
 * LES MOMENTS, ELLE NE LES AVAIT PAS, et c'est tout le sujet. Le Direct ne
 * montre que ce qui se passe maintenant (`momentsRestants`) : une fiche sans
 * moment n'entre pas dans le paquet. Ses moments sont ce qu'il a publié depuis
 * son comptoir et qui est encore vrai :
 *
 *   · « Il en reste ! » — un FLASH, avec son compte à rebours, comme dans la
 *     démonstration (`comptoir-ville.ts`) ;
 *   · son plat du jour (son Expérience restaurant), jusqu'à sa fin ;
 *   · la pièce à essayer, le livre conseillé ;
 *   · son annonce en cours, quelle qu'elle soit.
 *
 * UN COMMERÇANT QUI N'A RIEN PUBLIÉ N'EST PAS DANS LE DIRECT — c'est la règle
 * de l'application (« celui qui n'a rien publié n'est pas dans le paquet »),
 * pas une exception. « La page est vide au départ. »
 *
 * ═══ LA MAIRIE, DANS LE DIRECT ════════════════════════════════════════════
 *
 * « Le Direct montre ce que les commerçants et la mairie annoncent. » Ses
 * messages (les publications « Ma ville » du fil) deviennent des cartes
 * d'événement — la forme que l'application réserve déjà à la mairie, à
 * l'office de tourisme, aux associations. Les événements publiés sans
 * commerce suivent le même chemin.
 *
 * FICHIER SERVEUR : il lit la base avec la clé d'administration.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { COLONNES_FICHE, construireFiche } from "@/lib/site-internet/fiche-du-site";
import { carteDepuisFiche } from "@/lib/site-internet/carte-depuis-fiche";
import { experienceDuDiagnostic, platEnCours } from "@/lib/site-internet/experience-donnees";
import { filDeVille } from "@/lib/direct/publications";
import { configVille, nomDeVille, villeSlug } from "@/lib/direct/ville";
import { momentDuFlash } from "@/lib/direct/flash";
import type { CarteAutour, EvenementVille, MomentJour } from "@/lib/direct/apercu-habitant";

const str = (v: unknown) => (v == null ? "" : String(v));

export type VilleReelle = {
  slug: string;
  nom: string;
  cartes: CarteAutour[];
  evenements: EvenementVille[];
};

/** L'heure de Paris d'un instant, en heures décimales — et si c'est aujourd'hui. */
function heureParis(iso: string | undefined, maintenant: number): { h: number; auj: boolean } | null {
  const t = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return null;
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(
    new Date(t),
  );
  const n = (k: string) => Number(p.find((x) => x.type === k)?.value ?? 0);
  const jour = (x: number) => new Date(x).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  return { h: n("hour") + n("minute") / 60, auj: jour(t) === jour(maintenant) };
}

/** « 16 h », « 16 h 30 ». */
const enHeure = (h: number) => {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh} h${mm ? ` ${String(mm).padStart(2, "0")}` : ""}`;
};

/** Jusqu'où va un moment aujourd'hui : son échéance si elle tombe aujourd'hui, sinon la fin de journée. */
function finDuJour(iso: string | undefined, maintenant: number): number {
  const f = heureParis(iso, maintenant);
  return f && f.auj ? Math.min(23.9, Math.max(f.h, 0.1)) : 23.9;
}

/** « Il en reste ! Plus que 5 parts · Magret · 12 € » → ses morceaux. */
function lireLaRelance(texte: string): { detail: string; nom: string; prix?: string } {
  const morceaux = texte
    .replace(/^il en reste\s*!?\s*[·:-]?\s*/i, "")
    .split(" · ")
    .map((x) => x.trim())
    .filter(Boolean);
  const prix = morceaux.length > 1 && /\d\s*€/.test(morceaux[morceaux.length - 1]) ? morceaux.pop() : undefined;
  const nom = morceaux.length > 1 ? morceaux.slice(1).join(" · ") : (morceaux[0] ?? "");
  const detail = morceaux.length > 1 ? morceaux[0] : "";
  return { detail, nom, prix };
}

/** Une photo affichable dans une carte. */
const affichable = (u?: string | null) => (u && /^(https?:\/\/|data:image\/|\/)/i.test(u) ? u : undefined);

/**
 * LES MOMENTS D'UN COMMERÇANT : ce qu'il a publié depuis son comptoir et qui
 * est encore vrai. Voir l'ordre en tête de fichier.
 */
export function momentsDuCommercant(
  row: Record<string, unknown>,
  carte: CarteAutour,
  maintenant = Date.now(),
): MomentJour[] {
  const out: MomentJour[] = [];
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  const now = heureParis(new Date(maintenant).toISOString(), maintenant)?.h ?? 12;

  // ── SON ANNONCE EN COURS (`current_offer`) ──
  const o = (row.current_offer && typeof row.current_offer === "object" ? row.current_offer : null) as Record<string, unknown> | null;
  const texte = str(o?.text).replace(/\s+/g, " ").trim();
  const jusqua = str(o?.until) || undefined;
  const enCours = texte && (!jusqua || Date.parse(jusqua) > maintenant);
  const lance = heureParis(str(o?.created_at), maintenant);
  const publie = lance?.auj ? lance.h : undefined;
  const photoOffre = affichable(str(o?.photo));
  const reste = enCours && /^il en reste/i.test(texte);

  if (reste) {
    // « IL EN RESTE ! » : UN FLASH, comme le comptoir de la démonstration.
    const r = lireLaRelance(texte);
    out.push({
      ...momentDuFlash({
        quoi: r.nom || carte.menu?.plat || "Les dernières",
        avantage: r.detail || "Les dernières",
        apres: r.prix,
        combien: Number(r.detail.match(/\d+/)?.[0] ?? 0) || undefined,
        photo: photoOffre || carte.menu?.photo,
        lance: lance?.auj ? lance.h : Math.max(0, now - 0.1),
        fin: finDuJour(jusqua, maintenant),
      }),
      etiquette: "Il en reste !",
      ...(publie !== undefined ? { publie } : {}),
    });
  }

  // ── SON PLAT DU JOUR ──
  // QUAND « IL EN RESTE » PARLE DE LUI, LE FLASH LE PORTE DÉJÀ — photo, prix,
  // ce qu'il en reste. Deux moments du même nom se liraient comme un doublon.
  const plat = platEnCours(experienceDuDiagnostic(diag)?.plat, maintenant);
  if (plat && !out.some((m) => m.titre.toLowerCase() === plat.nom.toLowerCase())) {
    out.push({
      de: 0,
      a: finDuJour(plat.fin, maintenant),
      quand: "aujourd’hui",
      icone: "🍽️",
      titre: plat.nom,
      lignes: ["Le plat du jour", ...(plat.phrase || plat.voixTexte ? [`« ${plat.phrase || plat.voixTexte} »`] : [])],
      ...(plat.prix ? { prix: plat.prix } : {}),
      photo: plat.photo,
      etiquette: "Le plat du jour",
      action: "Réserver",
      envies: [],
    });
  }

  // ── LA PIÈCE À ESSAYER, LE LIVRE CONSEILLÉ ──
  // Ce sont les pièces du comptoir en tête de son catalogue : ses prestations
  // portent l'identifiant de sa page (`<slug>-s0`), pas elles, et n'ont pas de photo.
  const pieces = (carte.catalogue ?? []).filter((a) => a.photo && /^https:\/\//i.test(a.photo) && !a.id.startsWith(`${carte.id}-`));
  for (const p of pieces.slice(0, 2)) {
    out.push({
      de: 0,
      a: 23.9,
      quand: "aujourd’hui",
      icone: carte.branche === "librairie" ? "📚" : "✨",
      titre: p.nom,
      lignes: [p.rayon || "À essayer", ...(p.detail ? [p.detail] : [])],
      ...(p.prix ? { prix: p.prix } : {}),
      photo: p.photo,
      etiquette: p.rayon || "À essayer",
      action: carte.branche === "librairie" ? "Me le garder" : "L’essayer",
      envies: [],
    });
  }

  // ── SON ANNONCE, QUAND CE N'EST NI LA RELANCE NI SON PLAT ──
  const dejaDit = (t: string) => out.some((m) => t.toLowerCase().includes(m.titre.toLowerCase()));
  if (enCours && !reste && !dejaDit(texte)) {
    out.push({
      de: lance?.auj ? lance.h : 0,
      a: finDuJour(jusqua, maintenant),
      quand: jusqua && heureParis(jusqua, maintenant)?.auj ? `jusqu’à ${enHeure(finDuJour(jusqua, maintenant))}` : "aujourd’hui",
      icone: "📣",
      titre: texte.length > 80 ? `${texte.slice(0, 78).trimEnd()}…` : texte,
      lignes: [],
      ...(photoOffre ? { photo: photoOffre } : {}),
      etiquette: "En ce moment",
      action: "J’y vais",
      envies: [],
      ...(publie !== undefined ? { publie } : {}),
    });
  }
  return out;
}

/** Un message de la mairie, ou un événement sans commerce, en carte d'événement. */
function evenementDe(p: Awaited<ReturnType<typeof filDeVille>>[number], nom: string, maintenant: number): EvenementVille {
  const lance = heureParis(p.publieLe, maintenant);
  const a = finDuJour(p.expireLe ?? undefined, maintenant);
  const auj = !p.expireLe || Boolean(heureParis(p.expireLe, maintenant)?.auj) || Date.parse(p.expireLe) > maintenant;
  const premiere = p.texte.split(/[.!?\n]/)[0].trim();
  return {
    id: `ville-${p.id}`,
    quoi: premiere.length > 60 ? `${premiere.slice(0, 58).trimEnd()}…` : premiere || "Un mot de la ville",
    lignes: p.texte.length > premiere.length + 2 ? [p.texte.slice(premiere.length + 1).trim().slice(0, 120)] : [],
    qui: p.auteurNom || (p.famille === "ville" ? `Mairie de ${nom}` : "Dans la ville"),
    typeQui: p.famille === "ville" ? "mairie" : "organisateur",
    ...(affichable(p.photo) ? { photo: affichable(p.photo) } : {}),
    jour: "Aujourd’hui",
    heure: p.expireLe && heureParis(p.expireLe, maintenant)?.auj ? `Jusqu’à ${enHeure(a)}` : "",
    de: lance?.auj ? lance.h : 0,
    a,
    aujourdhui: auj,
    lieu: nom,
    metres: 0,
    distance: "",
    itineraire: p.lien || `https://www.google.com/maps/search/${encodeURIComponent(nom)}`,
    mot: p.texte,
    pratique: [],
    ...(p.famille === "ville" ? { message: true } : {}),
  };
}

/** LIRE LA VILLE. Une base absente rend une ville vide — l'application le dit. */
export async function lireLaVilleReelle(ville: string, maintenant = Date.now()): Promise<VilleReelle> {
  const slug = villeSlug(ville);
  const vide: VilleReelle = { slug, nom: nomDeVille(slug.replace(/-/g, " ")) || ville, cartes: [], evenements: [] };
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return vide;
  }
  const cfg = await configVille(supabase, slug).catch(() => null);
  const nom = cfg?.nom || vide.nom;

  // ── LES COMMERÇANTS VALIDÉS DE LA VILLE ──
  // Même filtre large puis fin que `configVille` : le champ dit « Dax »,
  // « Dax, France » ou « 40100 Dax », et seul le slug tranche.
  const colle = (c: string) => {
    const cs = villeSlug(c);
    return cs === slug || cs.startsWith(`${slug}-`) || cs.endsWith(`-${slug}`);
  };
  let rows: Record<string, unknown>[] = [];
  try {
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select(`${COLONNES_FICHE}, slug`)
      .eq("channel", "letter")
      .eq("est_client", true)
      .ilike("city", `%${slug.replace(/-/g, " ")}%`)
      .limit(300);
    rows = ((Array.isArray(data) ? data : []) as Record<string, unknown>[]).filter((r) => colle(str(r.city)));
  } catch {
    rows = [];
  }

  // SES PRESTATIONS, en une lecture pour tous — colonne récente, lue à part.
  const services = new Map<string, unknown>();
  if (rows.length) {
    try {
      const { data } = await supabase.from("human_vitrine_sites").select("id, services").in("id", rows.map((r) => str(r.id)));
      for (const r of (Array.isArray(data) ? data : []) as Record<string, unknown>[]) services.set(str(r.id), r.services);
    } catch {
      /* colonne non migrée */
    }
  }

  const cartes: CarteAutour[] = [];
  for (const r of rows) {
    const s = str(r.slug);
    if (!s) continue;
    try {
      const { fiche } = construireFiche(s, r, { services: services.get(str(r.id)) });
      const carte = carteDepuisFiche(fiche);
      const moments = momentsDuCommercant(r, carte, maintenant);
      // CELUI QUI N'A RIEN PUBLIÉ N'EST PAS DANS LE DIRECT — voir l'en-tête.
      if (moments.length) cartes.push({ ...carte, moments });
    } catch {
      /* une fiche illisible ne vide pas la ville */
    }
  }

  // ── LA MAIRIE, ET LES ÉVÉNEMENTS QUI NE SONT PAS D'UN COMMERCE ──
  const evenements: EvenementVille[] = [];
  try {
    const pubs = await filDeVille(supabase, slug, { fenetreLarge: true });
    for (const p of pubs) {
      if (p.famille === "ville" || (p.famille === "evenement" && !p.siteId)) evenements.push(evenementDe(p, nom, maintenant));
    }
  } catch {
    /* fil indisponible → pas de message, la ville reste */
  }

  return { slug, nom, cartes, evenements: evenements.slice(0, 12) };
}
