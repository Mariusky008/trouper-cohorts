
// CRÉER LES FAÇONS D'UNE ANNONCE.
//
// Deux chemins mènent ici — le panneau « Faire venir du monde » et le parcours
// « Faire une annonce » — et ils doivent produire exactement la même chose.
// Recopier la validation dans les deux routes, c'est se garantir qu'elles
// divergeront : l'une refusera un express plus cher que le prix normal, l'autre
// l'acceptera, et la carte du fil deviendra incompréhensible sans qu'on
// comprenne pourquoi.
//
// LES GARDE-FOUS SONT ICI, PAS DANS LES ÉCRANS. Un formulaire se contourne.

import { conditionNormalisee } from "@/lib/direct/condition-achat";
const s = (v: unknown) => String(v ?? "").trim();

const n = (v: unknown): number => {
  const x = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(x) ? x : NaN;
};

/** Bornes du groupe. En dessous de deux ce n'est pas un collectif ; au-delà de
 *  cinquante, aucun commerce de centre-ville ne peut absorber la vague. */
export const OBJECTIF_MIN = 2;
export const OBJECTIF_MAX = 50;
/** Un stock d'avantages reste un geste, pas une distribution de bons. */
export const STOCK_MAX = 200;
/** L'express récompense la vitesse : au-delà de trois heures il ne récompense
 *  plus rien et devient une remise ordinaire. */
export const EXPRESS_MAX_MIN = 180;

export type Entree = {
  /** Le prix habituel. Facultatif : un « à prendre » n'en a pas. */
  prixNormal?: unknown;
  simple?: unknown;
  cadeau?: unknown;
  cadeauQuantite?: unknown;
  cadeauLibelle?: unknown;
  cadeauCondition?: unknown;
  express?: unknown;
  expressPrix?: unknown;
  expressMinutes?: unknown;
  partage?: unknown;
  partagePrix?: unknown;
  partageObjectif?: unknown;
  partageNom?: unknown;
};

export type Facon = {
  ligne: Record<string, unknown>;
  lots: Array<{ libelle: string; condition_achat: string }>;
};

export type Preparation = { ok: true; facons: Facon[] } | { ok: false; erreur: string };

/**
 * Valide les façons demandées et prépare les lignes à écrire.
 *
 * Rien n'est écrit ici : la validation doit être complète AVANT qu'une annonce
 * parte dans la ville, sinon on publie puis on refuse, et le commerçant se
 * retrouve avec une annonce sans porte.
 */
export function preparerFacons(p: Entree, contexte: { finGenerale: string }): Preparation {
  const prixNormal = n(p.prixNormal);
  const aPrix = Number.isFinite(prixNormal) && prixNormal > 0;
  const facons: Facon[] = [];
  const base: Record<string, unknown> = aPrix ? { prix_initial: prixNormal } : {};

  // ── « À PRENDRE » — ni prix, ni cadeau, ni groupe ────────────────────────
  // Elle est EXCLUSIVE : proposer « à prendre » à côté d'un prix de groupe
  // reviendrait à dire « payez plein tarif ou moins cher », ce qui n'est pas un
  // choix mais une insulte. Un créneau qui se libère n'a rien à comparer.
  if (p.simple) {
    return {
      ok: true,
      facons: [{ ligne: { ...base, type: "simple", ordre: 0, echeance: contexte.finGenerale }, lots: [] }],
    };
  }

  // ── 🎁 LE CADEAU ────────────────────────────────────────────────────────
  if (p.cadeau) {
    const quantite = Math.round(n(p.cadeauQuantite));
    const libelle = s(p.cadeauLibelle).slice(0, 120);
    // NORMALISÉE À L'ÉCRITURE. Le commerçant a tapé « 12 », et l'écran de
    // confirmation affichait « valable 12 ». La base porte désormais une phrase
    // lisible, et les écrans qui la relisent n'ont plus à la deviner.
    const condition = conditionNormalisee(p.cadeauCondition);
    if (!Number.isFinite(quantite) || quantite < 1 || quantite > STOCK_MAX) {
      return { ok: false, erreur: `Le cadeau : indiquez combien, entre 1 et ${STOCK_MAX}.` };
    }
    if (!libelle) return { ok: false, erreur: "Le cadeau : dites ce que les premiers reçoivent." };
    // LA RÈGLE QUI REND L'OPÉRATION TENABLE, tenue aussi par un `NOT NULL` en
    // base : sans condition d'achat, on donne à des gens qui n'achètent rien.
    if (!condition) return { ok: false, erreur: "Le cadeau : indiquez à partir de quel achat il s'applique." };
    facons.push({
      ligne: { ...base, type: "cadeau", ordre: 1, echeance: contexte.finGenerale },
      lots: Array.from({ length: quantite }, () => ({ libelle, condition_achat: condition })),
    });
  }

  // ── ⚡ L'EXPRESS ────────────────────────────────────────────────────────
  if (p.express) {
    if (!aPrix) return { ok: false, erreur: "L'express : indiquez d'abord votre prix habituel." };
    const prix = n(p.expressPrix);
    const minutes = Math.min(EXPRESS_MAX_MIN, Math.max(10, Math.round(n(p.expressMinutes) || 60)));
    if (!Number.isFinite(prix) || prix <= 0) return { ok: false, erreur: "L'express : indiquez le prix réduit." };
    if (prix >= prixNormal) {
      return { ok: false, erreur: "L'express : le prix doit être inférieur à votre prix habituel." };
    }
    facons.push({
      ligne: {
        ...base, type: "express", ordre: 2, prix_groupe: prix,
        echeance: new Date(Date.now() + minutes * 60_000).toISOString(),
      },
      lots: [],
    });
  }

  // ── 👥 LE COLLECTIF ─────────────────────────────────────────────────────
  if (p.partage) {
    if (!aPrix) return { ok: false, erreur: "Le collectif : indiquez d'abord votre prix habituel." };
    const objectif = Math.round(n(p.partageObjectif));
    const prix = n(p.partagePrix);
    if (!Number.isFinite(objectif) || objectif < OBJECTIF_MIN || objectif > OBJECTIF_MAX) {
      return { ok: false, erreur: `Le collectif : entre ${OBJECTIF_MIN} et ${OBJECTIF_MAX} personnes.` };
    }
    if (!Number.isFinite(prix) || prix <= 0 || prix >= prixNormal) {
      return { ok: false, erreur: "Le collectif : le prix doit être inférieur à votre prix habituel." };
    }
    facons.push({
      ligne: {
        ...base, type: "collectif", ordre: 3, objectif, prix_groupe: prix,
        nom_facon: s(p.partageNom).slice(0, 40) || null,
        echeance: contexte.finGenerale,
      },
      lots: [],
    });
  }

  if (!facons.length) return { ok: false, erreur: "Choisissez au moins une façon d'en profiter." };

  // LA DESCENTE DES PRIX est ce qui rend la carte lisible : une façon plus
  // engageante mais plus chère que la précédente casse le sens de la colonne.
  const prix = facons
    .map((f) => (f.ligne.prix_groupe ?? f.ligne.prix_initial) as number | undefined)
    .filter((x): x is number => typeof x === "number");
  if (prix.some((v, i) => i > 0 && v >= prix[i - 1])) {
    return { ok: false, erreur: "Les prix doivent descendre : le cadeau au prix normal, l'express en dessous, le collectif encore en dessous." };
  }

  return { ok: true, facons };
}

/**
 * Écrit les façons et leurs lots, une fois l'annonce publiée.
 *
 * Le stock du cadeau est MÉLANGÉ avant d'être écrit : la séquence est figée à
 * la création puis distribuée dans l'ordre, si bien que le serveur ne choisit
 * rien au moment du clic. Ça rend la distribution vérifiable et interdit tout
 * favoritisme. Avec des lots identiques le mélange ne change rien — il compte
 * le jour où ils différeront, et mieux vaut qu'il soit déjà là.
 */
export async function ecrireFacons(
  supabase: { from: (t: string) => any }, // eslint-disable-line @typescript-eslint/no-explicit-any
  facons: readonly Facon[],
  commun: { siteId: string; villeSlug: string; titre: string; publicationId: string | null }
): Promise<string[]> {
  const lignes: Array<Record<string, unknown>> = facons.map((f) => ({
    ...f.ligne,
    site_id: commun.siteId,
    ville_slug: commun.villeSlug,
    titre: commun.titre,
    statut: "active",
    publication_id: commun.publicationId,
  }));

  // DEUX ESSAIS, ET LE SECOND EST LE FILET.
  //
  // `ordre` et `nom_facon` sont des colonnes de confort : l'ordre retombe sur
  // l'ordre canonique du type, et le nom sur le libellé générique. Mais tant
  // que la migration n'est pas passée, leur simple présence dans l'insert fait
  // échouer les TROIS façons d'un coup — le commerçant les renseigne, elles
  // n'apparaissent nulle part, et rien ne dit pourquoi. C'est exactement ce qui
  // s'est produit.
  //
  // On réessaie donc sans elles plutôt que de tout perdre pour un agrément.
  const OPTIONNELLES = ["ordre", "nom_facon"];
  const inserer = (l: Array<Record<string, unknown>>) =>
    supabase.from("clik_campaign").insert(l).select("id, type");

  let { data, error } = await inserer(lignes);
  if (error && /ordre|nom_facon/.test(String(error.message))) {
    const sobres = lignes.map((l) => {
      const c = { ...l };
      for (const k of OPTIONNELLES) delete c[k];
      return c;
    });
    ({ data, error } = await inserer(sobres));
  }
  if (error) throw new Error(error.message);
  const creees = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
  if (!creees.length) throw new Error("façons non créées");

  const lots: Array<Record<string, unknown>> = [];
  for (const f of facons) {
    if (!f.lots.length) continue;
    const cible = creees.find((c) => s(c.type) === s(f.ligne.type));
    if (!cible) continue;
    const melange = [...f.lots];
    for (let i = melange.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [melange[i], melange[j]] = [melange[j], melange[i]];
    }
    melange.forEach((l, i) =>
      lots.push({ campagne_id: s(cible.id), position: i, libelle: l.libelle, condition_achat: l.condition_achat })
    );
  }
  if (lots.length) {
    const { error: e2 } = await supabase.from("clik_reward").insert(lots);
    if (e2) throw new Error(e2.message);
  }
  return creees.map((c) => s(c.id));
}
