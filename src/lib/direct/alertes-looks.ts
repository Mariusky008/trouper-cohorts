// 🔔 « M'ALERTER QUAND UNE PIÈCE DANS CET ESPRIT ARRIVE »
//
// ═══ CE QUE CETTE CASE PROMET, ET CE QU'ELLE NE PROMET PAS ══════════════════
//
// « ClikMe ne dit pas : je sais mieux que vous ce qui vous va. ClikMe dit :
// j'apprends ce que vous aimez et je vous aide à découvrir d'autres pièces qui
// pourraient vous plaire. »
//
// LA NUANCE DÉCIDE DE TOUT LE CANAL. Une alerte fondée sur ce que la machine
// estime « adapté » est une alerte qu'on coupe à la deuxième erreur — et un
// canal coupé ne revient pas, voir `alertes.ts`. Une alerte fondée sur ce que
// la personne a RÉELLEMENT exprimé — la pièce qu'elle a notée, celle qu'elle a
// fait mettre de côté — reste justifiable même quand elle tombe à côté : on
// peut toujours répondre « parce que vous aviez adoré la veste kaki ».
//
// D'OÙ CE QU'ON GARDE ICI, ET SEULEMENT ÇA : la pièce qui a déclenché l'envie,
// le commerce où elle est, et la note qu'on lui a donnée. Pas un profil, pas un
// vecteur de goût, pas une morphologie. Le jour où il y a un dos, c'est cette
// forme-là qui part — et elle est lisible par la personne qui l'a produite.
//
// ═══ CE QUE CE FICHIER N'EST PAS ════════════════════════════════════════════
//
// Il n'envoie rien. Il garde une intention dans le stockage local du
// navigateur, exactement comme les remises du boulanger et la mise en avant du
// matin. L'envoi demande un dos, un canal et les quatre règles de rythme de
// `alertes.ts` ; ce qui se décide ici, c'est la PERMISSION, et elle se décide
// au seul moment où elle a du sens : devant une pièce qu'on vient d'aimer.

export type AlerteLook = {
  /** Le commerce chez qui on veut être prévenu. */
  carte: string;
  /** La pièce qui a donné l'envie — c'est elle qui rend l'alerte explicable. */
  piece: string;
  /** Son nom, pour pouvoir l'écrire dans la notification. */
  nom: string;
  /** Ce qu'on en a pensé, de un à cinq. Zéro : on n'a pas noté. */
  note: number;
  /** Quand on l'a demandée. */
  quand: number;
};

const CLE = "clikme-alertes-looks-v1";
const abonnes = new Set<() => void>();
let cache: AlerteLook[] | null = null;

export const AUCUNE_ALERTE: AlerteLook[] = [];

export function chargerAlertesLooks(): AlerteLook[] {
  if (cache) return cache;
  if (typeof window === "undefined") return AUCUNE_ALERTE;
  try {
    const brut = window.localStorage.getItem(CLE);
    const l = brut ? JSON.parse(brut) : null;
    cache = Array.isArray(l) && l.length ? (l as AlerteLook[]) : AUCUNE_ALERTE;
  } catch {
    cache = AUCUNE_ALERTE;
  }
  return cache;
}

export function alertesLooksVides(): AlerteLook[] {
  return AUCUNE_ALERTE;
}

export function abonnerAlertesLooks(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

function ecrire(l: AlerteLook[]) {
  cache = l.length ? l : AUCUNE_ALERTE;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(l));
  } catch {
    /* Stockage refusé : la session continue en mémoire. */
  }
  abonnes.forEach((f) => f());
}

/**
 * UNE SEULE PAR PIÈCE, ET ELLE SE RETIRE DU MÊME GESTE.
 *
 * La cloche est un interrupteur, pas un formulaire : on appuie pour demander,
 * on rappuie pour annuler. Demander deux fois la même chose ne doit pas donner
 * deux alertes — c'est le genre de doublon qu'on ne voit qu'une fois le canal
 * devenu insupportable.
 */
export function basculerAlerteLook(a: Omit<AlerteLook, "quand">) {
  const l = chargerAlertesLooks();
  const deja = l.some((x) => x.carte === a.carte && x.piece === a.piece);
  ecrire(
    deja
      ? l.filter((x) => !(x.carte === a.carte && x.piece === a.piece))
      : [...l, { ...a, quand: Date.now() }],
  );
}
