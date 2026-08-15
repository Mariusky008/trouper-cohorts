// POURQUOI MES FAÇONS N'APPARAISSENT PAS.
//
// Un commerçant coche ses trois options, elles s'enregistrent, et le fil n'en
// montre aucune. De l'extérieur, rien ne distingue les six causes possibles —
// et j'en ai déduit la mauvaise faute d'avoir regardé la vraie base.
//
// Ce module ne répare rien : il CONSTATE, sur les données réelles, et nomme la
// cause. Chaque vérification reproduit exactement une condition du chemin de
// lecture du fil, dans son ordre :
//
//   1. la colonne existe-t-elle ?            (migration appliquée ou non)
//   2. la façon est-elle rattachée à une annonce ?   (`publication_id`)
//   3. son `ville_slug` est-il celui du fil ?
//   4. son statut la laisse-t-il passer ?
//   5. son échéance est-elle encore devant ?
//   6. l'annonce qui la porte est-elle vivante ?
//
// La première qui échoue est LA cause : les suivantes ne sont plus atteintes.

const str = (v: unknown) => (v == null ? "" : String(v));

type Supabase = {
  from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type VerdictFacon = {
  campagneId: string;
  type: string;
  titre: string;
  /** `true` si elle s'affiche bien dans le fil. */
  visible: boolean;
  /** Ce qui la bloque, en clair. Vide si elle est visible. */
  cause: string;
  /** Le détail technique, pour pouvoir corriger sans deviner. */
  detail: string;
};

export type Diagnostic = {
  /** Les colonnes récentes que la base connaît. */
  colonnes: { ordre: boolean; nom_facon: boolean; reste: boolean; ardoise: boolean };
  /** Les types que la contrainte de la base accepte réellement. */
  typesAcceptes: { simple: boolean; express: boolean };
  villeDuFil: string;
  facons: VerdictFacon[];
  /** Le résumé en une phrase. */
  resume: string;
};

/** Une colonne existe-t-elle ? On la demande seule : si elle manque, PostgREST
 *  répond une erreur, et c'est la réponse. */
async function colonneExiste(sb: Supabase, table: string, colonne: string): Promise<boolean> {
  try {
    const { error } = await sb.from(table).select(colonne).limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Le type est-il accepté par la contrainte de la base ?
 *
 * On ne peut pas lire une contrainte CHECK depuis PostgREST. On regarde donc
 * s'il existe DÉJÀ des lignes de ce type : c'est une preuve positive, jamais
 * une preuve d'absence — d'où le libellé prudent côté écran.
 */
async function typeDejaVu(sb: Supabase, type: string): Promise<boolean> {
  try {
    const { data, error } = await sb.from("clik_campaign").select("id").eq("type", type).limit(1);
    return !error && Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

export async function diagnostiquerFacons(
  supabase: unknown,
  siteId: string,
  villeSlugAttendu: string
): Promise<Diagnostic> {
  const sb = supabase as Supabase;
  const [ordre, nomFacon, reste, ardoise, vuSimple, vuExpress] = await Promise.all([
    colonneExiste(sb, "clik_campaign", "ordre"),
    colonneExiste(sb, "clik_campaign", "nom_facon"),
    colonneExiste(sb, "human_publications", "reste"),
    colonneExiste(sb, "human_publications", "ardoise"),
    typeDejaVu(sb, "simple"),
    typeDejaVu(sb, "express"),
  ]);

  const colonnes = { ordre, nom_facon: nomFacon, reste, ardoise };
  const typesAcceptes = { simple: vuSimple, express: vuExpress };

  // Ses campagnes, avec le même repli que la lecture du fil.
  const champs = "id, publication_id, ville_slug, type, titre, statut, echeance, created_at";
  let lignes: Record<string, unknown>[] = [];
  try {
    let { data, error } = await sb
      .from("clik_campaign")
      .select(ordre ? `${champs}, ordre` : champs)
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) ({ data, error } = await sb.from("clik_campaign").select(champs).eq("site_id", siteId).limit(30));
    lignes = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
  } catch {
    lignes = [];
  }

  // Les annonces concernées : une façon rattachée à une annonce retirée ou
  // expirée ne s'affiche pas, même si elle est parfaite par ailleurs.
  const pubIds = Array.from(new Set(lignes.map((r) => str(r.publication_id)).filter(Boolean)));
  const pubs = new Map<string, { retire: boolean; expire: string; ville: string }>();
  if (pubIds.length) {
    try {
      const { data } = await sb
        .from("human_publications")
        .select("id, retire_le, expire_le, ville_slug")
        .in("id", pubIds);
      for (const r of (Array.isArray(data) ? data : []) as Record<string, unknown>[]) {
        pubs.set(str(r.id), {
          retire: str(r.retire_le) !== "",
          expire: str(r.expire_le),
          ville: str(r.ville_slug),
        });
      }
    } catch {
      /* sans les annonces, on ne pourra pas trancher la dernière condition */
    }
  }

  const maintenant = Date.now();
  const facons: VerdictFacon[] = lignes.map((r) => {
    const id = str(r.id);
    const type = str(r.type);
    const titre = str(r.titre);
    const pubId = str(r.publication_id);
    const ville = str(r.ville_slug);
    const statut = str(r.statut);
    const fin = Date.parse(str(r.echeance));
    const v = (cause: string, detail: string): VerdictFacon => ({ campagneId: id, type, titre, visible: false, cause, detail });

    if (!pubId) {
      return v(
        "Elle n'est rattachée à aucune annonce.",
        "`publication_id` est vide : le fil accroche les façons aux annonces, une façon sans annonce n'a nulle part où s'afficher."
      );
    }
    if (ville !== villeSlugAttendu) {
      return v(
        `Elle est enregistrée pour « ${ville || "(vide)"} », pas pour « ${villeSlugAttendu} ».`,
        "Le fil ne lit que les façons de sa ville."
      );
    }
    if (!["active", "debloquee"].includes(statut)) {
      return v(`Son statut est « ${statut} ».`, "Seules les façons « active » ou « debloquee » s'affichent.");
    }
    if (Number.isFinite(fin) && fin <= maintenant) {
      return v(
        "Son échéance est passée.",
        `Elle se terminait le ${new Date(fin).toLocaleString("fr-FR")}. Une façon terminée est retirée du fil, jamais grisée.`
      );
    }
    const pub = pubs.get(pubId);
    if (pub?.retire) {
      return v("L'annonce qui la porte a été retirée.", "Retirer une annonce retire ce qu'elle proposait.");
    }
    if (pub && pub.expire && Date.parse(pub.expire) <= maintenant) {
      return v("L'annonce qui la porte est terminée.", `Elle expirait le ${new Date(Date.parse(pub.expire)).toLocaleString("fr-FR")}.`);
    }
    if (pub && pub.ville !== villeSlugAttendu) {
      return v(
        `L'annonce est enregistrée pour « ${pub.ville || "(vide)"} ».`,
        "L'annonce et la façon doivent être dans la même ville que le fil."
      );
    }
    return { campagneId: id, type, titre, visible: true, cause: "", detail: "" };
  });

  const visibles = facons.filter((f) => f.visible).length;
  const manquantes = Object.entries(colonnes)
    .filter(([, ok]) => !ok)
    .map(([c]) => c);
  const resume = manquantes.length
    ? `Colonnes absentes de la base : ${manquantes.join(", ")}. Migration à appliquer.`
    : facons.length === 0
      ? "Aucune façon enregistrée pour ce commerce."
      : visibles === facons.length
        ? `${visibles} façon${visibles > 1 ? "s" : ""} visible${visibles > 1 ? "s" : ""} dans le fil.`
        : `${visibles} visible${visibles > 1 ? "s" : ""} sur ${facons.length}.`;

  return { colonnes, typesAcceptes, villeDuFil: villeSlugAttendu, facons, resume };
}
