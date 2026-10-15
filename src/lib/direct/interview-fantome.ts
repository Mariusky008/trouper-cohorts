/**
 * 🎙️ L'INTERVIEW DU FANTÔME — ce qu'il dit, combien de temps on se donne, et
 * comment la vidéo se monte à la fin.
 *
 * « Est-ce que ça serait pas super que l'assistant fantôme lui pose des
 * questions et que le commerçant y réponde ? » Le commerçant pose son
 * téléphone, le fantôme est déjà à l'écran, à l'endroit où il lui a dit de
 * regarder, et il lui pose trois questions en direct. Une minute, pas plus.
 * Puis le téléphone monte la vidéo lui-même, « comme la dernière » : l'ardoise
 * qui s'écrit à la craie, le fantôme qui ouvre, qui pose ses questions et qui
 * dit au revoir.
 *
 * CE FICHIER NE TOUCHE NI À LA CAMÉRA NI AU SON. Il porte les règles —
 * répliques, budget de temps, fenêtre de parole, plan du montage — pour
 * qu'elles se lisent et se vérifient sans téléphone. Le direct est dans
 * l'écran d'essai, le montage dans `interview-montage.ts`.
 */

/* ═══ CE QUE DIT LE FANTÔME ════════════════════════════════════════════════
 *
 * UNE VOIX DE SYNTHÈSE, ET C'EST LA SIENNE. On ne fait jamais dire au
 * commerçant une phrase qu'il n'a pas dite (voir `public/direct/voix/
 * LISEZ-MOI.md`) : le fantôme parle avec sa voix à lui, le chef avec la
 * sienne, enregistrée par son téléphone. Les fichiers sont dans
 * `public/direct/interview/voix/`, et le texte ci-dessous est exactement ce
 * qu'ils disent — c'est lui qui s'affiche dans la bulle.
 */
export const REPLIQUES = {
  "place-droite": "Pose ton téléphone face à toi. Moi, je suis là, à droite ! Quand tu réponds, regarde-moi.",
  "place-gauche": "Pose ton téléphone face à toi. Moi, je suis là, à gauche ! Quand tu réponds, regarde-moi.",
  bonjour: "Bonjour ! Moi, c'est le fantôme du Bordeaux. Aujourd'hui, je pose trois questions au chef !",
  q1: "Alors chef, c'est quoi, le plat du jour ?",
  q2: "Et c'est quoi, ton secret, pour qu'il soit si bon ?",
  q3: "Dernière question : si ton plat était une chanson, ce serait laquelle ?",
  merci: "Merci chef ! Je m'occupe du montage.",
  "a-demain": "À demain, au Bordeaux !",
} as const;
export type IdReplique = keyof typeof REPLIQUES;
export const IDS_REPLIQUES = Object.keys(REPLIQUES) as IdReplique[];

/**
 * TROIS QUESTIONS, TROIS TONS : une utile, une sérieuse, une pour rire. Le
 * `titre` est ce que l'ardoise écrit pendant la réponse — c'est lui qui dit de
 * quoi on parle à celui qui regarde sans le son, et c'est la majorité.
 */
export const QUESTIONS = [
  { id: "q1", titre: "Le plat du jour ?" },
  { id: "q2", titre: "Son secret ?" },
  { id: "q3", titre: "Si c'était une chanson…" },
] as const satisfies readonly { id: IdReplique; titre: string }[];
export type IdQuestion = (typeof QUESTIONS)[number]["id"];

/* ═══ LE TEMPS ═════════════════════════════════════════════════════════════
 *
 * UNE MINUTE POUR TOUTE L'INTERVIEW, questions comprises. Au-delà, ce n'est
 * plus une annonce qu'on regarde jusqu'au bout, et c'est surtout une minute de
 * plus prise au commerçant au milieu de son service.
 */
export const BUDGET_S = 60;
/** Une réponse ne prend jamais plus que ça, même s'il reste du budget. */
export const REPONSE_MAX_S = 20;
/** Ce qu'on garde pour chaque question encore à poser (sa voix + un souffle). */
export const PAR_QUESTION_A_VENIR_S = 4.5;
/**
 * LE SILENCE QUI DIT « J'AI FINI » — plus long que celui de l'assistante
 * (`voix-micro.ts`, sept cents millisecondes). Là-bas, on attend une
 * phrase ; ici, on attend une réponse filmée, et un chef qui réfléchit deux
 * secondes devant la caméra n'a pas fini : il cherche le bon mot, et c'est
 * souvent ce qui vient après qui est le meilleur.
 */
export const SILENCE_FIN_S = 2.2;
/** Le même seuil que l'assistante : il a été mesuré dans un commerce. */
export const SEUIL_VOIX = 0.012;
/** Sans un mot au bout de ce temps, on passe à la suite plutôt que d'attendre. */
export const ATTENTE_SANS_PAROLE_S = 9;

/**
 * Le temps laissé à la réponse `index` (0, 1, 2) quand il reste `restant`
 * secondes de budget : jamais plus que `REPONSE_MAX_S`, et toujours de quoi
 * poser les questions suivantes. Cinq secondes au moins, sinon autant ne pas
 * poser la question.
 */
export function tempsDeReponse(index: number, restant: number): number {
  const aVenir = QUESTIONS.length - 1 - index;
  return Math.max(5, Math.min(REPONSE_MAX_S, restant - aVenir * (PAR_QUESTION_A_VENIR_S + 5)));
}

/* ═══ OÙ EST LE FANTÔME ════════════════════════════════════════════════════
 *
 * À L'ÉCRAN, LA CAMÉRA DU DEVANT EST UN MIROIR. Le fantôme est posé à droite
 * de l'aperçu ; le chef regarde vers sa droite à lui pour le voir. Dans la
 * vidéo enregistrée, qui n'est PAS en miroir (sinon l'écriture de son tablier
 * se lirait à l'envers), sa droite passe à gauche de l'image. Pour qu'il
 * regarde toujours le fantôme, le montage pose donc le fantôme du côté
 * opposé à celui de l'aperçu.
 */
export type Cote = "droite" | "gauche";
export const coteDuMontage = (apercu: Cote): Cote => (apercu === "droite" ? "gauche" : "droite");

/* ═══ CE QUE L'ENREGISTREMENT A ENTENDU ═══════════════════════════════════ */

/**
 * LA FENÊTRE OÙ IL PARLE, dans une prise : premier et dernier instant de voix
 * après `depuis` (la fin de la question). `rms` est l'énergie du son par pas
 * de `pas` secondes. Trois pas de suite au-dessus du seuil font une parole —
 * un claquement de porte n'en est pas une.
 */
export function fenetreDeParole(
  rms: ArrayLike<number>,
  pas: number,
  depuis: number,
  seuil = SEUIL_VOIX,
): { debut: number; fin: number } | null {
  let debut = -1;
  let fin = -1;
  let suite = 0;
  for (let i = Math.max(0, Math.floor(depuis / pas)); i < rms.length; i++) {
    if (rms[i] > seuil) {
      suite += 1;
      if (suite >= 3) {
        if (debut < 0) debut = i - 2;
        fin = i;
      }
    } else suite = 0;
  }
  return debut < 0 ? null : { debut: debut * pas, fin: (fin + 1) * pas };
}

/**
 * LES SOUS-TITRES À LA CRAIE : la réponse transcrite, coupée en morceaux qui
 * tiennent sur deux lignes d'ardoise, puis répartis sur le temps où il parle,
 * au prorata de leur longueur. Ce n'est pas un minutage au mot près — le
 * service de transcription ne le donne pas — mais à l'œil, un morceau
 * apparaît quand on l'entend.
 */
export function decouperSousTitres(texte: string, max = 46): string[] {
  const mots = texte.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const morceaux: string[] = [];
  let cur = "";
  for (const m of mots) {
    const essai = cur ? `${cur} ${m}` : m;
    if (cur && essai.length > max) {
      morceaux.push(cur);
      cur = m;
    } else cur = essai;
    // une phrase qui se termine ferme le morceau, s'il a déjà de la matière
    if (/[.!?…]$/.test(m) && cur.length > max * 0.45) {
      morceaux.push(cur);
      cur = "";
    }
  }
  if (cur) morceaux.push(cur);
  return morceaux;
}

export type SousTitre = { texte: string; debut: number; fin: number };

export function horairesSousTitres(morceaux: string[], debut: number, fin: number): SousTitre[] {
  const total = morceaux.reduce((s, m) => s + m.length + 6, 0);
  if (!total || fin <= debut) return [];
  let t = debut;
  return morceaux.map((m) => {
    const d = ((m.length + 6) / total) * (fin - debut);
    const st = { texte: m, debut: t, fin: t + d };
    t += d;
    return st;
  });
}

/**
 * « CE MIDI AU / BORDEAUX » — l'article du nom se contracte, comme on l'écrit à
 * la main sur une ardoise. « Ce midi au Le Bordeaux » se lit comme une faute
 * de frappe ; un nom sans article passe par « chez ».
 */
export function enteteArdoise(commerce: string): { avant: string; nom: string } {
  const n = commerce.trim();
  const m = /^(les|le|la)\s+(.+)$/i.exec(n);
  if (m) {
    const art = m[1].toLowerCase();
    return { avant: art === "le" ? "Ce midi au" : art === "les" ? "Ce midi aux" : "Ce midi à la", nom: m[2] };
  }
  const l = /^l['’]\s*(.+)$/i.exec(n);
  if (l) return { avant: "Ce midi à l'", nom: l[1] };
  // « Chez Bergine » porte déjà son « chez »
  if (/^chez\s/i.test(n)) return { avant: "Ce midi", nom: n };
  return { avant: "Ce midi chez", nom: n };
}

/* ═══ LE PLAN DU MONTAGE ═══════════════════════════════════════════════════
 *
 * Trois temps, comme l'épisode de l'ardoise : l'OUVERTURE (l'ardoise du jour
 * s'écrit, le fantôme arrive et dit bonjour), les PRISES (le fantôme pose sa
 * question par-dessus l'image du chef qui écoute, puis se fait petit au coin
 * de l'ardoise pendant qu'il répond), la FIN (le nom du commerce, le logo, « à
 * demain »). Les durées des prises ne sont connues qu'en les jouant — on
 * coupe quand la vidéo atteint la fin de la parole — donc le plan donne des
 * durées, pas des heures.
 */
export const OUVERTURE = {
  /** Le fantôme commence à parler quand l'ardoise a presque fini de s'écrire. */
  voix: 1.1,
  apres: 0.7,
} as const;
export const FIN = { voix: 0.6, apres: 2.8 } as const;

export const dureeOuverture = (bonjour: number) => OUVERTURE.voix + bonjour + OUVERTURE.apres;
export const dureeFin = (aDemain: number) => FIN.voix + aDemain + FIN.apres;

/**
 * OÙ COUPER UNE PRISE (en secondes depuis son début) : sept dixièmes après la
 * dernière parole, pour ne pas lui couper la fin du mot ; s'il n'a rien dit,
 * deux secondes et demie après la question — un sourire, puis la suite.
 */
export function coupeDeLaPrise(p: { duree: number; questionFin: number; paroleFin: number | null }): number {
  const voulu = p.paroleFin != null ? p.paroleFin + 0.7 : p.questionFin + 2.5;
  return Math.max(p.questionFin + 0.8, Math.min(p.duree, voulu));
}
