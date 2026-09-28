// 📌 MES ANNONCES — ce sur quoi j'ai agi, et par où y revenir.
//
// ═══ CE QUE CE FICHIER EXISTE POUR RÉPARER ════════════════════════════════
//
// « Dans "Mes propositions", j'aimerais qu'on puisse retrouver toutes les
// annonces dans lesquelles on a interagi pour pouvoir y accéder de nouveau,
// surtout les sorties en tout premier pour pouvoir voir l'évolution du chat
// live, et ensuite le reste des annonces dans lesquelles on a pu interagir
// (essayage…). »
//
// L'ONGLET NE MONTRAIT QUE DES SALONS. Or un salon est une CONVERSATION, et la
// plupart des gestes du produit n'en ouvrent aucun : essayer une pièce, la
// mettre de côté, laisser son fantôme quelque part, garder une annonce. Tout
// cela se rangeait ailleurs — dans la poche du cœur, dans le mur d'un
// commerce — c'est-à-dire à trois endroits qu'il faut connaître. On repartait
// donc chercher dans le paquet une annonce qu'on avait déjà touchée.
//
// ═══ ON NE STOCKE RIEN DE NEUF, ON RELIT CE QUI EXISTE ════════════════════
//
// LA TENTATION ÉTAIT D'AJOUTER UN CARNET et d'aller l'écrire à chaque geste.
// C'est la mauvaise façon, pour une raison vérifiable : un carnet qu'il faut
// penser à remplir a autant d'oublis que de points d'appel, et le jour où
// quelqu'un ajoute un geste sans écrire la ligne, l'annonce disparaît de cette
// page sans que rien ne casse. Un défaut silencieux est le plus cher de tous.
//
// LES TROIS MÉMOIRES EXISTENT DÉJÀ, et chacune EST la preuve d'un geste :
//
//   · `salons`          — j'en ai parlé, ou je suis dans la conversation ;
//   · `pieces-gardees`  — je l'ai essayée, je l'ai mise de côté ;
//   · `mes-fantomes`    — j'ai laissé mon fantôme sur ce mur.
//
// Ce module les met bout à bout et les range. Il n'écrit rien : c'est une
// LECTURE, donc elle ne peut pas se désynchroniser de ce qu'elle décrit.
//
// ═══ ET LES SORTIES PASSENT DEVANT ════════════════════════════════════════
//
// « Surtout les sorties en tout premier pour pouvoir voir l'évolution du chat
// live. »
//
// C'EST LA SEULE LIGNE QUI BOUGE PENDANT QU'ON NE REGARDE PAS. Une pièce mise
// de côté sera la même ce soir ; un salon de sortie aura dix messages de plus,
// et quelqu'un y sera peut-être en direct. Ce qui change vite se met en haut —
// sinon il faut scruter une liste pour trouver la seule chose qui a bougé.

/** Ce qu'on a fait de cette annonce. Sert au mot affiché et au rangement. */
export type GesteAnnonce = "sortie" | "parle" | "essai" | "trace";

/** De quoi rouvrir une annonce sans avoir à la retrouver dans le paquet. */
export type MonAnnonce = {
  /** Unique dans la liste. Sert de clé de rendu et de dédoublonnage. */
  cle: string;
  titre: string;
  /** Le commerce, l'organisateur, le lieu — ce qui répond à « où ». */
  ou: string;
  /** Une ligne de contexte : l'heure, le prix, le nombre de messages. */
  detail: string;
  geste: GesteAnnonce;
  /** Le mot du geste, tel qu'il s'écrit sous le titre. */
  mot: string;
  photo?: string;
  /** Le plus récent devant, à geste égal. */
  quand: number;
  /**
   * PAR OÙ ON Y RETOURNE, ET UNE SEULE DE CES TROIS EST REMPLIE.
   *
   * L'écran qui affiche la liste n'a pas à deviner : il lit celle qui est là.
   * Trois champs plutôt qu'un champ « type » plus un identifiant, parce qu'un
   * couple type/identifiant se dénoue par un `switch` qu'il faut tenir à jour
   * — alors qu'un champ rempli désigne son ouverture tout seul.
   */
  salon?: string;
  piece?: { carte: string; piece: string };
  mur?: string;
};

/** Les formes lues, réduites à ce dont ce module a besoin. */
type SalonLu = {
  cle: string;
  sujet: string;
  annonce?: string;
  ou: string;
  quand: string;
  photo?: string;
  messages: unknown[];
  ouvert: boolean;
  enDirect?: unknown;
};
type PieceLue = {
  carte: string;
  lieu: string;
  piece: string;
  nom: string;
  prix?: string;
  image?: string;
  quand: number;
};
type TraceLue = {
  id: string;
  mot: string;
  photo?: string;
  depose: number;
  souvenir: { cle: string; lieu: string; metier: string; ville: string };
};

/**
 * UNE SORTIE SE RECONNAÎT À SA CLÉ, PAS À SON SUJET.
 *
 * `ev|…` est le préfixe posé par `cleSalonEv` dans l'application : un salon
 * d'événement. Un salon où quelqu'un est EN DIRECT compte aussi — c'est
 * exactement la chose qu'on vient voir évoluer, quel que soit le commerce.
 *
 * LE TEST PORTE SUR LA FORME DE LA DONNÉE ET PAS SUR DES MOTS. Chercher
 * « soirée » ou « concert » dans le sujet aurait marché sur les trois exemples
 * d'aujourd'hui et sur rien d'autre.
 */
export function estUneSortie(s: SalonLu): boolean {
  return s.cle.startsWith("ev|") || !!s.enDirect;
}

/** Le mot du geste, sous le titre. Il dit ce qu'on a fait, pas ce que c'est. */
export const MOT_DU_GESTE: Record<GesteAnnonce, string> = {
  sortie: "Vous y êtes",
  parle: "Vous en parlez",
  essai: "Essayé sur vous",
  trace: "Votre fantôme y est",
};

/**
 * LA LISTE, RANGÉE : les sorties d'abord, le plus récent devant.
 *
 * LE DÉDOUBLONNAGE EST FAIT SUR LA CLÉ et il compte : une même annonce peut
 * avoir un salon ET une pièce essayée. On garde alors la première rencontrée,
 * donc la sortie s'il y en a une — c'est la porte qui mène au chat live, et
 * c'est celle qu'il ne faut pas perdre.
 */
export function mesAnnoncesDe(source: {
  salons: SalonLu[];
  pieces: PieceLue[];
  traces: TraceLue[];
  /** L'instant de lecture, injecté pour que la fonction reste pure. */
  maintenant?: number;
}): MonAnnonce[] {
  const maintenant = source.maintenant ?? Date.now();
  const out: MonAnnonce[] = [];

  for (const s of source.salons) {
    const sortie = estUneSortie(s);
    out.push({
      cle: `salon:${s.cle}`,
      titre: s.annonce ?? s.sujet,
      ou: s.ou,
      detail: `${s.quand} · ${s.messages.length} message${s.messages.length > 1 ? "s" : ""}`,
      geste: sortie ? "sortie" : "parle",
      mot: MOT_DU_GESTE[sortie ? "sortie" : "parle"],
      photo: s.photo,
      /* UN SALON N'A PAS D'HORODATAGE : on se sert de son état. Ouvert, il est
         d'aujourd'hui ; fermé, il est derrière. Deviner une heure à partir de
         sa phrase — « ce soir », « demain midi » — aurait produit un ordre qui
         ment dès que quelqu'un écrit autrement. */
      quand: s.ouvert ? maintenant : 0,
      salon: s.cle,
    });
  }

  for (const p of source.pieces) {
    out.push({
      cle: `piece:${p.carte}|${p.piece}`,
      titre: p.nom,
      ou: p.lieu,
      detail: p.prix ?? "",
      geste: "essai",
      mot: MOT_DU_GESTE.essai,
      photo: p.image,
      quand: p.quand,
      piece: { carte: p.carte, piece: p.piece },
    });
  }

  for (const t of source.traces) {
    out.push({
      cle: `trace:${t.id}`,
      titre: t.mot || t.souvenir.lieu,
      ou: t.souvenir.lieu,
      detail: `${t.souvenir.metier} · ${t.souvenir.ville}`,
      geste: "trace",
      mot: MOT_DU_GESTE.trace,
      photo: t.photo,
      quand: t.depose,
      mur: t.souvenir.cle,
    });
  }

  const vues = new Set<string>();
  return out
    .sort((a, b) => {
      const sa = a.geste === "sortie" ? 0 : 1;
      const sb = b.geste === "sortie" ? 0 : 1;
      return sa !== sb ? sa - sb : b.quand - a.quand;
    })
    .filter((a) => {
      if (vues.has(a.cle)) return false;
      vues.add(a.cle);
      return true;
    });
}
