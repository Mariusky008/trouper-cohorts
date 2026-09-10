// 👻 OÙ EST MON FANTÔME — la mémoire des endroits où on s'est posé.
//
// ═══ CE QUE CE FICHIER RÉPARE, ET C'EST LA PROMESSE DU CONCEPT ════════════
//
// « Comment accéder au mur du commerçant si on n'a plus accès à son profil ?
// Il faudrait que lorsqu'on a laissé un fantôme quelque part, on puisse accéder
// à sa page depuis quelque part. »
//
// LA QUESTION EN CACHAIT UNE PLUS GRAVE. Les dépôts vivaient dans un `useState`
// remis à zéro à chaque changement de mur : le fantôme qu'on venait de laisser
// disparaissait à la seconde où l'on quittait la feuille. Or la définition
// verrouillée dans `fantomes.ts` dit :
//
//   « LE FANTÔME, C'EST VOUS QUAND VOUS N'ÊTES PAS LÀ. […] Elle y reste
//     quelques heures. […] Et votre fantôme revient vous raconter ce qui s'est
//     passé. »
//
// « QUAND VOUS N'ÊTES PAS LÀ » ÉTAIT EXACTEMENT CE QUE LA MAQUETTE NE SAVAIT PAS
// FAIRE. Le quota de trois n'avait aucun sens non plus — on ne peut pas être à
// plus de trois endroits à la fois si l'on n'est nulle part une seconde après.
//
// ═══ ET LA RÉPONSE À L'ACCÈS EN DÉCOULE, SANS RIEN INVENTER ═══════════════
//
// Pas de favoris, pas de signets, pas d'historique : LE FANTÔME QU'ON A LAISSÉ
// EST LA PORTE. Un lieu où l'on s'est posé est par définition un lieu qu'on veut
// pouvoir rouvrir — et c'est vrai même quand le commerce a quitté le paquet
// parce qu'il est fermé, ce qui est précisément le cas qui posait problème.
//
// ═══ POURQUOI SUR LE TÉLÉPHONE ET NULLE PART AILLEURS ═════════════════════
//
// L'onglet « Profil » dit : « Vous, sans compte. Aucun nom, aucun numéro, aucune
// adresse. Ce que vous gardez et ce que vous écrivez reste sur ce téléphone. »
// Cette phrase est la raison pour laquelle une amie peut ouvrir un salon depuis
// un lien sans s'inscrire. On ne va pas la casser pour retenir trois adresses.

/** De quoi rouvrir un mur sans le paquet : voir `murDuSouvenir`. */
export type Souvenir = {
  /** La clé du mur — l'identifiant de la carte, pas celui du modèle. */
  cle: string;
  /** La clé du modèle de mur (`margot`, `bar`, `ongles`, `bijoux`, `bougies`). */
  modele: string;
  lieu: string;
  metier: string;
  ville: string;
  distance: string;
  note: string;
  avis: number;
  photoLieu: string;
};

export type FantomePose = {
  /** Unique : plusieurs dépôts peuvent viser le même lieu. */
  id: string;
  souvenir: Souvenir;
  /** Ce qu'on a laissé, en une ligne, tel qu'il s'affiche sur le mur. */
  mot: string;
  /** La photo du dépôt, quand il y en a une. */
  photo?: string;
  /** Pour un essai : la pièce essayée et le verdict. */
  essai?: { quoi: string; verdict: "pris" | "passe" | null };
  depose: number;
  /** Quand la trace s'éteint. Voir `HEURES_PAR_DEFAUT` et la durée des essais. */
  jusqua: number;
};

const CLE = "clikme-fantomes-v1";

/** Lire sans jamais lever : un stockage refusé ne doit pas casser un écran. */
function lire(): FantomePose[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = window.localStorage.getItem(CLE);
    if (!brut) return [];
    const v = JSON.parse(brut);
    return Array.isArray(v) ? (v as FantomePose[]) : [];
  } catch {
    return [];
  }
}

/**
 * L'ÉVÉNEMENT QUI PRÉVIENT LE RESTE DE L'ÉCRAN.
 *
 * Le mur est monté DANS une feuille, et le compte s'affiche sur le fantôme de la
 * barre : deux endroits qui ne se connaissent pas. Sans ce signal, le chiffre
 * n'apparaissait qu'au rechargement de la page — mesuré, et c'est exactement le
 * genre de retard qui fait croire que rien ne s'est passé.
 *
 * Un événement de fenêtre plutôt qu'un état remonté : le mur sert à deux
 * endroits différents de l'application, et lui faire porter les besoins
 * d'affichage de chacun le lierait à tous.
 */
export const SIGNAL = "clikme-fantomes";

function ecrire(v: FantomePose[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(v));
  } catch {
    /* navigation privée, stockage plein : on continue sans mémoire */
  }
  try {
    window.dispatchEvent(new Event(SIGNAL));
  } catch {
    /* rien à faire : l'affichage se rattrapera au prochain montage */
  }
}

/**
 * LES FANTÔMES ENCORE EN VIE, DU PLUS RÉCENT AU PLUS ANCIEN.
 *
 * LA PURGE SE FAIT À LA LECTURE, et c'est volontaire : une trace qui s'éteint le
 * fait toute seule, sans que rien n'ait besoin de tourner en arrière-plan. C'est
 * aussi ce qui garantit qu'on ne propose jamais de rouvrir un lieu où l'on n'est
 * plus.
 */
export function mesFantomes(): FantomePose[] {
  const maintenant = Date.now();
  const vivants = lire()
    .filter((f) => f && f.jusqua > maintenant)
    .sort((a, b) => b.depose - a.depose);
  if (vivants.length !== lire().length) ecrire(vivants);
  return vivants;
}

/**
 * POSER SON FANTÔME QUELQUE PART.
 *
 * LE QUOTA EST APPLIQUÉ ICI, ET C'EST SA VRAIE PLACE. Il vivait dans l'écran,
 * donc il ne comptait que les dépôts de la session en cours ; « votre fantôme ne
 * peut pas être à plus de trois endroits à la fois » n'avait alors aucun sens.
 * Compté sur la mémoire, il redevient la règle annoncée.
 */
export function poserFantome(f: FantomePose, quota: number): FantomePose[] {
  const vivants = mesFantomes();
  if (vivants.length >= quota) return vivants;
  const suite = [f, ...vivants];
  ecrire(suite);
  return suite;
}

/** Rappeler son fantôme : la trace s'efface, la place se libère. */
export function rappelerFantome(id: string): FantomePose[] {
  const suite = mesFantomes().filter((f) => f.id !== id);
  ecrire(suite);
  return suite;
}

/** Ce qui a été laissé ICI, pour le remettre en tête du mur en le rouvrant. */
export function fantomesDuLieu(cle: string): FantomePose[] {
  return mesFantomes().filter((f) => f.souvenir.cle === cle);
}

/**
 * COMBIEN DE TEMPS IL RESTE, DIT COMME ON LE DIRAIT.
 *
 * Pas d'horodatage : ce qui compte est « est-ce que c'est encore là », et une
 * heure absolue oblige à faire la soustraction soi-même.
 */
export function tempsRestant(f: FantomePose): string {
  const min = Math.max(0, Math.round((f.jusqua - Date.now()) / 60000));
  if (min < 60) return `encore ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `encore ${h} h`;
  const j = Math.round(h / 24);
  return `encore ${j} jour${j > 1 ? "s" : ""}`;
}
