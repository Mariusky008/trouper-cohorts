// LA CLÔTURE D'UNE CAMPAGNE ÉCHUE.
//
// LE DÉFAUT : une campagne dont l'heure est passée gardait ses participations
// en « engagé », pour toujours. Conséquences des deux côtés :
//
//   • l'habitant voyait s'empiler dans « Mes Clics » des réservations d'hier,
//     d'avant-hier, de la semaine dernière ;
//   • le commerçant lisait dans « Mes réservations » des gens qui ne viendront
//     plus — c'est-à-dire exactement l'information qu'il ne faut pas lui donner.
//
// CE QUE FAIT LA CLÔTURE, et rien de plus :
//
//   1. La campagne passe à `terminee`.
//   2. Les participations vivantes passent à `confirme` — pas à `absent`. On ne
//      SAIT PAS si la personne est venue : le seul témoin est le commerçant, et
//      il n'a rien coché. Écrire « absent » serait une accusation inventée.
//   3. Le PRIX OBTENU est fixé : c'est le filet de sécurité du §8. Un groupe
//      atteint donne le prix de groupe ; un groupe qui n'a pas abouti laisse la
//      place valable AU PRIX HABITUEL. Rejoindre n'est jamais un pari perdant,
//      et c'est ici que ça se joue vraiment.
//   4. Les listes d'attente passent à `annule` : la place ne s'est pas libérée,
//      elles n'ont jamais eu lieu.
//
// CE QU'ELLE NE FAIT PAS : envoyer quoi que ce soit. Prévenir de la clôture
// serait un message de plus pour dire qu'il ne se passe rien.
const str = (v: unknown) => (v == null ? "" : String(v));
const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

type Supabase = {
  from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type Bilan = {
  campagnes: number;
  confirmees: number;
  annulees: number;
  /** Combien de groupes ont atteint leur objectif — le chiffre qui compte. */
  groupesReussis: number;
};

/** Les statuts qui veulent encore dire quelque chose au moment de clôturer. */
const VIVANTS = ["engage", "liste_attente", "confirme"];

/**
 * Clôture les campagnes dont l'échéance est passée.
 *
 * `max` borne le travail d'un passage : un cron qui tente de rattraper six mois
 * d'un coup dépasse son temps d'exécution et ne clôture rien du tout. Le
 * passage suivant prend la suite.
 */
export async function cloturerEchues(supabase: unknown, max = 200): Promise<Bilan> {
  const sb = supabase as Supabase;
  const bilan: Bilan = { campagnes: 0, confirmees: 0, annulees: 0, groupesReussis: 0 };
  const maintenant = new Date().toISOString();

  // ── 1. Ce qui est échu mais encore ouvert ────────────────────────────────
  let campagnes: Record<string, unknown>[] = [];
  try {
    const { data, error } = await sb
      .from("clik_campaign")
      .select("id, type, objectif, participants, prix_initial, prix_groupe, statut, echeance")
      .in("statut", ["active", "debloquee"])
      .lt("echeance", maintenant)
      .limit(max);
    if (error || !Array.isArray(data)) return bilan;
    campagnes = data as Record<string, unknown>[];
  } catch {
    // Table absente : rien à clôturer, et surtout pas d'erreur qui ferait
    // sonner un cron toutes les nuits.
    return bilan;
  }
  if (!campagnes.length) return bilan;

  const ids = campagnes.map((c) => str(c.id));

  // ── 2. Leurs participations, en UNE lecture ──────────────────────────────
  const parCampagne = new Map<string, Array<{ habitantId: string; statut: string }>>();
  try {
    const { data } = await sb
      .from("clik_participation")
      .select("campagne_id, habitant_id, statut")
      .in("campagne_id", ids);
    for (const r of (Array.isArray(data) ? data : []) as Record<string, unknown>[]) {
      const statut = str(r.statut);
      if (!VIVANTS.includes(statut)) continue;
      const k = str(r.campagne_id);
      const l = parCampagne.get(k) ?? [];
      l.push({ habitantId: str(r.habitant_id), statut });
      parCampagne.set(k, l);
    }
  } catch {
    /* sans participations, on ferme quand même les campagnes */
  }

  // ── 3. Clôture, campagne par campagne ────────────────────────────────────
  for (const c of campagnes) {
    const id = str(c.id);
    const type = str(c.type);
    const objectif = num(c.objectif) ?? 0;
    const participants = num(c.participants) ?? 0;
    const prixInitial = num(c.prix_initial);
    const prixGroupe = num(c.prix_groupe);
    const lignes = parCampagne.get(id) ?? [];

    // LE FILET DE SÉCURITÉ, appliqué ici et nulle part ailleurs. Un groupe qui
    // n'a pas abouti ne fait perdre sa place à personne : elle reste valable au
    // prix habituel.
    const groupeReussi = type === "collectif" ? objectif > 0 && participants >= objectif : true;
    if (type === "collectif" && groupeReussi) bilan.groupesReussis += 1;
    const prixObtenu = type === "collectif" ? (groupeReussi ? (prixGroupe ?? prixInitial) : prixInitial) : (prixGroupe ?? prixInitial);

    const enAttente = lignes.filter((l) => l.statut === "liste_attente").map((l) => l.habitantId);
    const dedans = lignes.filter((l) => l.statut !== "liste_attente").map((l) => l.habitantId);

    // Les listes d'attente n'ont jamais eu lieu : la place ne s'est pas libérée.
    if (enAttente.length) {
      try {
        await sb
          .from("clik_participation")
          .update({ statut: "annule", resolu_le: maintenant })
          .eq("campagne_id", id)
          .in("habitant_id", enAttente);
        bilan.annulees += enAttente.length;
      } catch {
        /* on continue : une campagne qui résiste ne doit pas bloquer les autres */
      }
    }

    // `confirme`, JAMAIS `absent`. Personne n'a coché que la personne n'est pas
    // venue ; l'inventer serait une accusation.
    if (dedans.length) {
      try {
        const maj: Record<string, unknown> = { statut: "confirme", resolu_le: maintenant };
        if (prixObtenu != null) maj.prix_obtenu = prixObtenu;
        await sb
          .from("clik_participation")
          .update(maj)
          .eq("campagne_id", id)
          .in("habitant_id", dedans);
        bilan.confirmees += dedans.length;
      } catch {
        /* idem */
      }
    }

    try {
      await sb
        .from("clik_campaign")
        .update({ statut: type === "collectif" && !groupeReussi ? "echouee" : "terminee" })
        .eq("id", id);
      bilan.campagnes += 1;
    } catch {
      /* la campagne sera reprise au passage suivant */
    }
  }

  return bilan;
}
