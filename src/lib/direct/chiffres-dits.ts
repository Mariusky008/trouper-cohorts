// LES CHIFFRES DANS UNE PHRASE DITE À VOIX HAUTE.
//
// POURQUOI ÇA COMPTE PLUS QUE LE RESTE DE LA TRANSCRIPTION. Si l'assistante
// écrit « magré » au lieu de « magret », le commerçant sourit et corrige. Si
// elle écrit « 4 € » au lieu de « 14 € », il publie un prix faux à toute une
// ville, un client arrive avec quatre euros, et il n'y revient jamais. La
// question n'est donc pas « est-ce que la transcription est jolie » mais
// « EST-CE QUE LES CHIFFRES SURVIVENT ».
//
// ET ILS NE SE COMPTENT PAS EN LISANT DES CHIFFRES. Selon le moteur, « quatorze
// euros » ressort tantôt « 14 € », tantôt « quatorze euros ». Comparer les deux
// chemins sans convertir les mots reviendrait à dire « aucun chiffre trouvé »
// devant une transcription parfaite. On lit donc les deux formes.

/** Ce qui se dit et vaut un nombre. Voir plus bas pour l'absence de « un ». */
const MOTS: Record<string, number> = {
  zero: 0,
  deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9,
  dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16,
  vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60,
  cent: 100, cents: 100, mille: 1000,
  demi: 0.5, demie: 0.5,
};

/**
 * « UN » ET « UNE » NE SONT PAS COMPTÉS, ET C'EST DÉLIBÉRÉ.
 *
 * Ce sont d'abord des articles : « un magret », « une portion », « un client ».
 * Les compter ferait sortir dix nombres d'une phrase qui en contient deux, et
 * l'écran servirait à comparer du bruit. Le chiffre « 1 » écrit en chiffre,
 * lui, est bien lu — c'est celui qu'un commerçant dicte quand il veut dire un.
 */

const SANS_ACCENT = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * TOUS LES NOMBRES D'UNE PHRASE, dans l'ordre, en chiffres et en lettres.
 *
 * La règle d'assemblage est celle du français parlé : les nombres composés se
 * suivent sans rien entre eux (« quatre-vingt-dix », « soixante-quinze »), et
 * le premier mot qui n'est pas un nombre ferme celui qu'on était en train de
 * lire. « Quatorze euros trente portions » rend donc 14 puis 30, et jamais
 * 1430.
 */
export function chiffresDits(texte: string): number[] {
  const out: number[] = [];
  let cour: number | null = null;
  const poser = () => {
    if (cour != null) out.push(cour);
    cour = null;
  };

  // LA PONCTUATION DE FIN DE PHRASE N'EST PAS UNE DÉCIMALE, et la confondre
  // coûtait un nombre entier. Le point et la virgule doivent survivre au
  // découpage — « 14,50 » est un prix — mais « préparé trente. » sortait le
  // jeton « trente. », introuvable dans la table, donc trente perdu. On ne
  // garde donc le point et la virgule QUE lorsqu'un chiffre les suit.
  const propre = SANS_ACCENT(texte).replace(/[.,](?!\d)/g, " ");

  for (const jeton of propre.split(/[^a-z0-9,.]+/).filter(Boolean)) {
    // ── EN CHIFFRES ──
    // « 14 », « 14,50 », « 14.50 ». La virgule est le séparateur décimal
    // français, et c'est celui que les moteurs écrivent pour un prix.
    const n = /^\d+(?:[,.]\d+)?$/.exec(jeton);
    if (n) {
      poser();
      out.push(Number(n[0].replace(",", ".")));
      continue;
    }

    // « et » ne ferme rien : « soixante et onze » est un seul nombre.
    if (jeton === "et") continue;

    const v = MOTS[jeton];
    if (v == null) {
      poser();
      continue;
    }

    if (cour == null) {
      cour = v;
      continue;
    }
    // Les multiplicateurs : « deux cents », « trois mille ».
    if (v === 100 || v === 1000) {
      cour = (cour || 1) * v;
      continue;
    }
    // « quatre-vingt » — le seul cas où un petit nombre en multiplie un autre.
    if (cour === 4 && v === 20) {
      cour = 80;
      continue;
    }
    // « soixante-quinze », « quatre-vingt-douze », « dix-sept ».
    if ((cour === 60 || cour === 80 || cour === 10) && v >= 1 && v <= 19) {
      cour += v;
      continue;
    }
    // « vingt-deux », « cinquante-trois ».
    if (cour % 10 === 0 && cour >= 20 && cour <= 50 && v >= 1 && v <= 9) {
      cour += v;
      continue;
    }
    // « quatorze euros » puis « trente » : deux nombres, pas un.
    //
    // ON NE RECOLLE PAS LES CENTIMES, ET C'EST UN CHOIX. « Quatre euros
    // cinquante » veut dire 4,50 € et rend ici 4 puis 50. On pourrait les
    // fondre — mais « quatorze euros trente portions » deviendrait alors 14,30
    // et la quantité disparaîtrait. Les deux phrases ont la même forme et pas
    // le même sens, et cet outil sert à savoir si un nombre a SURVÉCU : le
    // rendre deux fois ne coûte rien, en perdre un fausse la mesure.
    poser();
    cour = v;
  }
  poser();
  return out;
}

/**
 * CE QU'ON CHERCHAIT EST-IL LÀ — et l'ordre n'entre pas en ligne de compte.
 *
 * On ne demande pas au moteur de rendre la phrase mot pour mot : on lui demande
 * de ne pas perdre les nombres qui deviendront un prix et une quantité.
 */
export function chiffresRetrouves(texte: string, attendus: number[]): number[] {
  const dits = chiffresDits(texte);
  return attendus.filter((a) => dits.includes(a));
}
