// LA JOURNÉE QUE L'ASSISTANTE A PUBLIÉE.
//
// ─── LE RENVERSEMENT QUE CE FICHIER SERT ──────────────────────────────────
//
// « Le commerçant ne publie plus. Il raconte sa journée à son assistante.
// L'assistante s'occupe du reste. »
//
// Tout ce qu'on a construit jusqu'ici demandait au commerçant de REMPLIR :
// un formulaire de préparation, un écran « mon commerce », une photo d'ardoise.
// Chaque champ est une occasion de renoncer, et à midi moins dix personne ne
// remplit six champs quatre jours de suite. Ici il parle, et c'est tout.
//
// ─── CE QUE CE MAGASIN CONTIENT, ET CE QU'IL NE CONTIENT PAS ──────────────
//
// IL CONTIENT LA JOURNÉE D'UN SEUL COMMERCE : celui à qui appartient le
// téléphone. Pas un flux, pas une base — la journée d'aujourd'hui, et rien
// d'hier. C'est volontaire : une annonce qui survit à sa journée est exactement
// ce qui a tué les pages Facebook des commerçants, où l'on tombe en novembre
// sur le menu de juin.
//
// IL NE CONTIENT RIEN QUI N'AIT ÉTÉ VALIDÉ. L'assistante propose, le commerçant
// appuie sur « C'est bon », et alors seulement ça entre ici. Voir la carte de
// validation dans l'écran : c'est elle qui rend le vocal acceptable — « quatorze
// euros » entendu « quatre euros » et publié à toute une ville coûte un
// commerçant, et aucune transcription n'est fiable à cent pour cent dans un
// commerce en activité.
//
// TOUT RESTE DANS L'APPAREIL, comme la préparation. Il n'y a pas encore de
// compte commerçant — c'est le manque le plus sérieux du produit et il est noté
// — donc rien ne part sur un serveur au nom de quelqu'un qui n'a rien signé.

import type { CarteAutour, CleMetier, MomentJour } from "@/lib/direct/apercu-habitant";

const CLE = "clikme.journee.v1";

/** Le commerce à qui l'assistante parle. */
export type CommerceAssiste = {
  id: string;
  /** Le prénom du commerçant, tel qu'il se présente. */
  prenom: string;
  nom: string;
  /** Le libellé du métier, dans ses mots — « Boulangerie », pas un code. */
  metier: string;
  branche: CleMetier;
  adresse: string;
  horaires: string;
  distance: string;
  metres: number;
  photo?: string;
};

/** Un tour de conversation, tel qu'il se relit le lendemain matin. */
export type TourDit = { role: "user" | "assistant"; content: string };

/** Ce qui a été publié aujourd'hui, et à quelle date — pour ne pas le ressortir demain. */
export type Journee = {
  commerce: CommerceAssiste;
  /** La date du jour, en `AAAA-MM-JJ`. */
  jour: string;
  moments: MomentJour[];
  /**
   * LA CONVERSATION ELLE-MÊME, ET ELLE SURVIT À LA FERMETURE.
   *
   * LE DÉFAUT QU'ELLE CORRIGE : « même quand je quitte totalement l'assistante,
   * si je reviens ça a gardé en mémoire mon ancien menu apparemment mais sans
   * vraiment que je le voie ». C'était exact et c'était le pire des deux mondes.
   * Ce qui est publié survivait — donc Léa le savait — mais l'échange, lui,
   * disparaissait avec la page. Le commerçant revenait devant un écran vierge
   * en face de quelqu'un qui se souvenait de tout : « ce n'est pas très clair,
   * et si je veux lui dire de mettre autre chose ça a l'air compliqué ».
   *
   * Les deux vivent maintenant ensemble et meurent ensemble, à la même date.
   */
  conversation?: TourDit[];
};

/**
 * LA JOURNÉE VIDE EST UNE CONSTANTE, ET LE CACHE N'EST PAS UNE OPTIMISATION.
 *
 * `useSyncExternalStore` compare les instantanés PAR IDENTITÉ : une fonction qui
 * rend un objet neuf à chaque appel déclare un changement à chaque rendu, et
 * React boucle jusqu'à l'écran blanc. C'est arrivé une fois dans ce produit,
 * l'application ne s'ouvrait plus du tout, et la règle vaut pour tout magasin
 * qu'on ajoute.
 */
export const AUCUNE_JOURNEE: Journee | null = null;
let cache: Journee | null = null;
let lu = false;

const aujourdhui = () => new Date().toISOString().slice(0, 10);

export function chargerJournee(): Journee | null {
  if (typeof window === "undefined") return AUCUNE_JOURNEE;
  if (lu) return cache;
  lu = true;
  try {
    const brut = window.localStorage.getItem(CLE);
    const j = brut ? (JSON.parse(brut) as Journee) : null;
    // HIER N'EST PAS AUJOURD'HUI. Une annonce qui traîne d'un jour sur l'autre
    // fait mentir tout le paquet : le pain de la veille n'est plus chaud.
    cache = j && j.jour === aujourdhui() ? j : AUCUNE_JOURNEE;
  } catch {
    cache = AUCUNE_JOURNEE;
  }
  return cache;
}

export function journeeVide(): Journee | null {
  return AUCUNE_JOURNEE;
}

const abonnes = new Set<() => void>();

export function abonnerJournee(f: () => void): () => void {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

function garder(j: Journee | null) {
  cache = j;
  lu = true;
  try {
    if (j) window.localStorage.setItem(CLE, JSON.stringify(j));
    else window.localStorage.removeItem(CLE);
  } catch {
    /* Quota plein : on garde en mémoire, l'écran continue. */
  }
  abonnes.forEach((f) => f());
}

/** Le commerce à qui l'on parle — le premier geste, avant toute conversation. */
export function ouvrirJournee(commerce: CommerceAssiste) {
  const j = chargerJournee();
  garder(
    j && j.commerce.id === commerce.id
      ? { ...j, commerce }
      : { commerce, jour: aujourdhui(), moments: [] },
  );
}

/**
 * PUBLIER CE QU'IL VIENT DE VALIDER.
 *
 * L'HORODATAGE EST POSÉ ICI ET NULLE PART AILLEURS. `publie` dit quand il l'a
 * DIT — c'est ce qui fait remonter la carte en tête du paquet avec sa pastille
 * « à l'instant » (voir `MomentJour.publie`). Le laisser à l'assistante
 * reviendrait à laisser un modèle décider de l'heure qu'il est.
 */
export function publierMoment(m: Omit<MomentJour, "publie">, heure: number): Journee | null {
  const j = chargerJournee();
  if (!j) return null;
  const neuf: Journee = {
    ...j,
    moments: [...j.moments, { ...m, publie: heure }],
  };
  garder(neuf);
  return neuf;
}

/**
 * METTRE À JOUR CE QUI EST DÉJÀ EN LIGNE — « il m'en reste trois ».
 *
 * UNE ANNONCE N'EST PAS UN BILLET, ELLE VIT. À 10 h il y a trente portions, à
 * 12 h 30 il en reste huit, à 13 h 15 les trois dernières à neuf euros, à
 * 13 h 45 c'est épuisé. Publier quatre annonces séparées remplirait le paquet
 * de quatre fois le même plat ; c'est la MÊME annonce qui change. Et elle se
 * ré-horodate, parce que « il en reste trois » vient d'être dit.
 */
export function majMoment(
  titre: string,
  changement: Partial<MomentJour>,
  heure: number,
): Journee | null {
  const j = chargerJournee();
  if (!j) return null;
  let touche = false;
  const moments = j.moments.map((m) => {
    if (touche || m.titre !== titre) return m;
    touche = true;
    return { ...m, ...changement, titre: m.titre, publie: heure };
  });
  if (!touche) return j;
  const neuf: Journee = { ...j, moments };
  garder(neuf);
  return neuf;
}

/**
 * GARDER L'ÉCHANGE — bornée, parce qu'une journée bavarde ne doit pas remplir
 * le stockage au point de faire perdre les photos des annonces.
 */
export function garderConversation(conversation: TourDit[]) {
  const j = chargerJournee();
  if (!j) return;
  garder({ ...j, conversation: conversation.slice(-40) });
}

/** Tout effacer — le bouton de remise à zéro d'une démonstration. */
export function viderJournee() {
  garder(null);
}

/**
 * LA CARTE, TELLE QUE LE PAQUET L'ATTEND.
 *
 * ELLE N'EST PAS MARQUÉE « PRÉPARÉE ». La carte de l'outil de démarchage porte
 * « prête à publier, pas encore en ligne », parce qu'elle montre le commerce de
 * quelqu'un qui n'a rien signé. Celle-ci est publiée par le commerçant lui-même :
 * elle est dans le paquet comme les autres, et c'est tout l'intérêt — il voit ce
 * que ses clients voient, sans distinction.
 */
export function carteDeLaJournee(j: Journee): CarteAutour | null {
  if (!j.moments.length) return null;
  const c = j.commerce;
  return {
    id: c.id,
    branche: c.branche,
    photo: c.photo,
    cadrage: "50%",
    nom: c.nom,
    metier: c.metier,
    ville: "Dax",
    itineraire: "https://www.google.com/maps/dir/?api=1&destination=Dax",
    metres: c.metres,
    distance: c.distance,
    fiche: { ou: c.adresse, horaires: c.horaires, mot: "" },
    moments: j.moments,
    voix: { prenom: c.prenom },
  };
}
