/**
 * 🎙️ L'INTERVIEW DU FANTÔME — ce qu'il dit, combien de temps on se donne, et
 * comment la vidéo se monte à la fin.
 *
 * « Est-ce que ça serait pas super que l'assistant fantôme lui pose des
 * questions et que le commerçant y réponde ? » Le commerçant pose son
 * téléphone, le fantôme reporter de ClikMe est déjà à l'écran, à l'endroit où
 * il lui a dit de regarder, et il lui pose ses questions en direct. Puis le
 * téléphone monte la vidéo lui-même : l'émission « Face au fantôme », avec
 * son nom en géant, une carte par question et la carte de fin (voir
 * `interview-signature.ts`).
 *
 * DEUXIÈME VERSION, après le premier essai sur un téléphone :
 *   · le reporter parle avec « la voix de Jean-Marie » — Liam, d'ElevenLabs,
 *     celle de l'enregistrement du magret (voir `api/direct/interview/voix`) ;
 *   · une à quatre questions, au choix, trente secondes au plus chacune ;
 *   · une photo ou une vidéo par question, ajoutée après l'interview ;
 *   · le chef qui ne veut pas se montrer est remplacé par SON fantôme, qui
 *     parle avec sa voix à lui.
 *
 * CE FICHIER NE TOUCHE NI À LA CAMÉRA NI AU SON. Il porte les règles —
 * répliques, formats, temps, fenêtre de parole, plan du montage — pour
 * qu'elles se lisent et se vérifient sans téléphone, et le serveur y lit les
 * textes que la voix a le droit de dire.
 */

/* ═══ CE QUE DIT LE REPORTER ═══════════════════════════════════════════════
 *
 * UNE VOIX DE SYNTHÈSE, ET C'EST LA SIENNE. On ne fait jamais dire au
 * commerçant une phrase qu'il n'a pas dite (voir `public/direct/voix/
 * LISEZ-MOI.md`) : le reporter parle avec sa voix à lui, le chef avec la
 * sienne, enregistrée par son téléphone — même quand c'est son fantôme qui
 * est à l'écran.
 *
 * LE TEXTE AFFICHÉ ET LE TEXTE DIT PEUVENT DIFFÉRER : la bulle écrit « ClikMe »,
 * la voix doit le prononcer comme on le dit (« Clic Mi ») — une voix de
 * synthèse qui lit le nom de la marque lettre à lettre ne se rattrape pas.
 */
export const REPLIQUES = {
  "place-droite": "Pose ton téléphone face à toi. Moi, je suis là, à droite ! Quand tu réponds, regarde-moi.",
  "place-gauche": "Pose ton téléphone face à toi. Moi, je suis là, à gauche ! Quand tu réponds, regarde-moi.",
  "place-fantome": "Pose ton téléphone, et parle-moi comme à un ami. Ton fantôme répondra à ta place !",
  bonjour: "Bonjour ! Ici le fantôme reporter de ClikMe. Aujourd'hui, je suis au Bordeaux, avec le chef !",
  q1: "Alors chef, c'est quoi, le plat du jour ?",
  q2: "Et c'est quoi, ton secret, pour qu'il soit si bon ?",
  q3: "Si ton plat était une chanson, ce serait laquelle ?",
  q4: "Et toi, chef : qu'est-ce qui t'a donné envie de faire ce métier ?",
  derniere: "Dernière question !",
  merci: "Merci chef ! Je m'occupe du montage.",
  "a-demain": "À demain, au Bordeaux !",
  // LES MÊMES, SANS NOM DE LIEU : pour tout autre restaurant. La voix ne lit
  // que des textes fixes (voir la route) — un nom de restaurant tapé par
  // quelqu'un n'y passe pas ; son nom est écrit sur l'ardoise.
  "bonjour-chef": "Bonjour ! Ici le fantôme reporter de ClikMe. Aujourd'hui, je suis en cuisine, avec le chef !",
  "a-demain-chef": "À demain, et bon appétit !",

  // ═══ LES AUTRES MÉTIERS — TEXTES VALIDÉS ═══════════════════════════════
  // « Le gros du travail, c'est d'écrire ces textes par métier. Je te les
  // ferai valider avant. » — « Tu valides les questions ? — Oui. » Un métier
  // ajouté ici ne s'ouvre chez un vrai commerçant qu'une fois ses textes
  // validés (`INTERVIEW_VALIDEE`). Changer un texte → `VERSION_VOIX`.
  "q4-metier": "Et toi : qu'est-ce qui t'a donné envie de faire ce métier ?",
  "merci-tous": "Merci ! Je m'occupe du montage.",
  "bonjour-coiffure": "Bonjour ! Ici le fantôme reporter de ClikMe. Aujourd'hui, je suis dans un salon de coiffure !",
  "q1-coiffure": "Alors, c'est quoi, la coupe du moment ?",
  "q2-coiffure": "Et à qui elle va le mieux, cette coupe ?",
  "q3-coiffure": "Si cette coupe était une chanson, ce serait laquelle ?",
  "a-bientot-coiffure": "À bientôt, au salon !",
  "bonjour-ongles": "Bonjour ! Ici le fantôme reporter de ClikMe. Aujourd'hui, je suis à l'onglerie !",
  "q1-ongles": "Alors, c'est quoi, la pose du moment ?",
  "q2-ongles": "Et ton secret, pour qu'elle tienne aussi longtemps ?",
  "q3-ongles": "Si cette couleur était une chanson, ce serait laquelle ?",
  "a-bientot-ongles": "À bientôt, à l'onglerie !",
  "bonjour-mode": "Bonjour ! Ici le fantôme reporter de ClikMe. Aujourd'hui, je suis en boutique !",
  "q1-mode": "Alors, c'est quoi, la pièce du moment ?",
  "q2-mode": "Et tu la porterais avec quoi ?",
  "q3-mode": "Si cette pièce était une chanson, ce serait laquelle ?",
  "a-bientot-mode": "À bientôt, en boutique !",
  "bonjour-lunettes": "Bonjour ! Ici le fantôme reporter de ClikMe. Aujourd'hui, je suis chez l'opticien !",
  "q1-lunettes": "Alors, c'est quoi, la monture du moment ?",
  "q2-lunettes": "Et à quel visage elle va le mieux ?",
  "q3-lunettes": "Si cette monture était une chanson, ce serait laquelle ?",
  "a-bientot-lunettes": "À bientôt, chez l'opticien !",
  "bonjour-fleurs": "Bonjour ! Ici le fantôme reporter de ClikMe. Aujourd'hui, je suis chez le fleuriste !",
  "q1-fleurs": "Alors, c'est quoi, le bouquet du jour ?",
  "q2-fleurs": "Et ton secret, pour qu'il tienne longtemps ?",
  "q3-fleurs": "Si ce bouquet était une chanson, ce serait laquelle ?",
  "a-bientot-fleurs": "À bientôt, chez le fleuriste !",
  "bonjour-createur": "Bonjour ! Ici le fantôme reporter de ClikMe. Aujourd'hui, je suis à l'atelier !",
  "q1-createur": "Alors, c'est quoi, ta création du moment ?",
  "q2-createur": "Et comment tu la fabriques ?",
  "q3-createur": "Si ta création était une chanson, ce serait laquelle ?",
  "a-bientot-createur": "À bientôt, à l'atelier !",
  "bonjour-librairie": "Bonjour ! Ici le fantôme reporter de ClikMe. Aujourd'hui, je suis à la librairie !",
  "q1-librairie": "Alors, c'est quoi, le livre que tu conseilles ?",
  "q2-librairie": "Et à qui tu l'offrirais ?",
  "q3-librairie": "Si ce livre était une chanson, ce serait laquelle ?",
  "a-bientot-librairie": "À bientôt, et bonne lecture !",
  "bonjour-bar": "Bonjour ! Ici le fantôme reporter de ClikMe. Aujourd'hui, je suis au bar !",
  "q1-bar": "Alors, qu'est-ce qui se passe ce soir ?",
  "q2-bar": "Et qu'est-ce que tu nous sers, avec ça ?",
  "q3-bar": "Si ta soirée était une chanson, ce serait laquelle ?",
  "a-bientot-bar": "À ce soir, au bar !",
} as const;
export type IdReplique = keyof typeof REPLIQUES;
export const IDS_REPLIQUES = Object.keys(REPLIQUES) as IdReplique[];

/** Le bonjour et l'au revoir du reporter : il ne nomme que le restaurant dont il a la réplique. */
// LE BORDEAUX N'A PLUS SES PHRASES À LUI : « À demain, au Bordeaux ! » n'est pas
// enregistré dans la voix du fantôme, et il ne change pas de voix pour une phrase.
export function repliquesDuLieu(_commerce: string, script: ScriptInterview = SCRIPTS.table): { bonjour: IdReplique; adieu: IdReplique } {
  return { bonjour: script.bonjour, adieu: script.adieu };
}

/**
 * QUATRE QUESTIONS, ET LE FORMAT CHOISIT COMBIEN ON EN POSE : une (sérieuse),
 * deux (sérieuses), trois (la troisième pour rire), quatre (la quatrième
 * personnelle). Le `titre` est ce que la carte de la question écrit en grand —
 * c'est lui qui dit de quoi on parle à celui qui regarde sans le son, et c'est
 * la majorité.
 */
export const QUESTIONS = [
  { id: "q1", ton: "sérieuse", titre: "Le plat du jour ?" },
  { id: "q2", ton: "sérieuse", titre: "Son secret ?" },
  { id: "q3", ton: "pour rire", titre: "Si c'était une chanson…" },
  { id: "q4", ton: "personnelle", titre: "Pourquoi ce métier ?" },
] as const satisfies readonly { id: IdReplique; ton: string; titre: string }[];
export type IdQuestion = (typeof QUESTIONS)[number]["id"];
export type Question = (typeof QUESTIONS)[number];

export const FORMATS = [1, 2, 3, 4] as const;
export type Format = (typeof FORMATS)[number];

/* ═══ CHAQUE MÉTIER SON INTERVIEW ══════════════════════════════════════════
 *
 * « Le mode "en interview" peut-il aussi aller pour les autres types de
 * commerçants ? » Le moteur, oui — caméra, questions, montage, fantôme. Ce qui
 * était du restaurant, ce sont ses MOTS : « Bonjour chef », « le plat du
 * jour », « Ce midi au… », « bon appétit », et la cloche. Ils sont ici, métier
 * par métier.
 *
 * LES QUESTIONS GARDENT LEUR PLACE (`q1` à `q4` : la sérieuse, la seconde
 * sérieuse, celle pour rire, la personnelle) ; c'est leur TEXTE qui change
 * (`replique`) et ce que sa carte en écrit (`titre`). Une prise reste « la
 * réponse à q1 » d'un métier à l'autre.
 */
export type QuestionDuScript = { id: IdQuestion; replique: IdReplique; ton: string; titre: string };
export type ScriptInterview = {
  bonjour: IdReplique;
  adieu: IdReplique;
  merci: IdReplique;
  questions: readonly QuestionDuScript[];
  /** « Ce midi au Bordeaux », « Ce soir au Comptoir », « Aujourd'hui chez Lou » — voir `enteteArdoise`. */
  quand: string;
  /** Ce qu'il met en avant : le titre de la section, et l'ardoise quand il n'a rien écrit. */
  quoi: string;
  /** L'étiquette du champ où il l'écrit. */
  champ: string;
  /** La cloche du restaurant, après le bonjour : seulement à table. */
  cloche: boolean;
  /** Ce qu'on souffle au service de transcription : du vocabulaire, pas du contenu. */
  contexte: string;
  /** Le titre du partage : « l'interview du chef ». */
  appel: string;
};

const q = (id: IdQuestion, replique: IdReplique, ton: string, titre: string): QuestionDuScript => ({ id, replique, ton, titre });
const autre = (
  m: "coiffure" | "ongles" | "mode" | "lunettes" | "fleurs" | "createur" | "librairie" | "bar",
  o: { quoi: string; titres: [string, string]; contexte: string; quand?: string; champ?: string },
): ScriptInterview => ({
  bonjour: `bonjour-${m}`,
  adieu: `a-bientot-${m}`,
  merci: "merci-tous",
  questions: [
    q("q1", `q1-${m}`, "sérieuse", o.titres[0]),
    q("q2", `q2-${m}`, "sérieuse", o.titres[1]),
    q("q3", `q3-${m}`, "pour rire", "Si c'était une chanson…"),
    q("q4", "q4-metier", "personnelle", "Pourquoi ce métier ?"),
  ],
  quand: o.quand ?? "Aujourd'hui",
  quoi: o.quoi,
  champ: o.champ ?? "Ce que tu mets en avant",
  cloche: false,
  contexte: `${o.contexte} Une chanson, et pourquoi ce métier. Prix en euros.`,
  appel: "l'interview",
});

export const SCRIPTS = {
  table: {
    bonjour: "bonjour-chef",
    adieu: "a-demain-chef",
    // « Merci ! Je m'occupe du montage. » — celle de tous : elle est enregistrée dans la voix du fantôme
    merci: "merci-tous",
    questions: QUESTIONS.map((x) => q(x.id, x.id, x.ton, x.titre)),
    quand: "Ce midi",
    quoi: "Le plat du jour",
    champ: "Ce qu'il y a ce midi",
    cloche: true,
    contexte:
      "Interview d'un chef de restaurant à Dax : son plat du jour, son secret de cuisine, une chanson, pourquoi il fait ce métier. Prix en euros.",
    appel: "l'interview du chef",
  },
  coiffure: autre("coiffure", { quoi: "La coupe du moment", titres: ["La coupe du moment ?", "À qui elle va ?"], contexte: "Interview d'un salon de coiffure : la coupe du moment, à qui elle va." }),
  ongles: autre("ongles", { quoi: "La pose du moment", titres: ["La pose du moment ?", "Son secret ?"], contexte: "Interview d'une onglerie : la pose et la couleur du moment, ce qui la fait tenir." }),
  mode: autre("mode", { quoi: "La pièce du moment", titres: ["La pièce du moment ?", "Avec quoi la porter ?"], contexte: "Interview d'une boutique de vêtements : la pièce du moment, avec quoi la porter." }),
  lunettes: autre("lunettes", { quoi: "La monture du moment", titres: ["La monture du moment ?", "À quel visage ?"], contexte: "Interview d'un opticien : la monture du moment, à quel visage elle va." }),
  fleurs: autre("fleurs", { quoi: "Le bouquet du jour", titres: ["Le bouquet du jour ?", "Son secret ?"], contexte: "Interview d'un fleuriste : le bouquet du jour, ce qui le fait tenir." }),
  createur: autre("createur", { quoi: "La création du moment", titres: ["La création du moment ?", "Comment c'est fait ?"], contexte: "Interview d'un atelier de création : la création du moment, comment elle est fabriquée." }),
  librairie: autre("librairie", { quoi: "Le livre conseillé", titres: ["Le livre conseillé ?", "À qui l'offrir ?"], contexte: "Interview d'un libraire : le livre qu'il conseille, à qui l'offrir." }),
  bar: autre("bar", { quoi: "Ce soir", quand: "Ce soir", champ: "Ce qui se passe ce soir", titres: ["Ce soir ?", "Ce qu'on boit ?"], contexte: "Interview d'un bar : la soirée, ce qu'on y boit." }),
} satisfies Record<string, ScriptInterview>;
export type MetierInterview = keyof typeof SCRIPTS;

/**
 * LES MÉTIERS DONT LES TEXTES SONT VALIDÉS — tous ceux d'aujourd'hui. Un
 * métier qu'on ajoute à `SCRIPTS` sans le mettre ici a son interview au
 * comptoir de démonstration, pour l'essayer et relire ses questions, mais
 * pas encore chez un vrai commerçant.
 */
export const INTERVIEW_VALIDEE: readonly MetierInterview[] = ["table", "coiffure", "ongles", "mode", "lunettes", "fleurs", "createur", "librairie", "bar"];

/** Le script d'un métier — celui du restaurant pour un métier qui n'en a pas. */
export const scriptDe = (famille: string | undefined): ScriptInterview => SCRIPTS[(famille ?? "table") as MetierInterview] ?? SCRIPTS.table;

/** L'interview s'ouvre-t-elle au comptoir de ce métier ? `reel` : un vrai commerçant (pas la démonstration). */
export const interviewOuverte = (famille: string, reel: boolean): boolean =>
  famille in SCRIPTS && (!reel || INTERVIEW_VALIDEE.includes(famille as MetierInterview));

/** Toutes les répliques qu'une interview de ce métier peut faire dire au reporter — et elles seules. */
export function repliquesDuScript(script: ScriptInterview, commerce = ""): IdReplique[] {
  const lieu = repliquesDuLieu(commerce, script);
  return [...new Set<IdReplique>(["place-droite", "place-gauche", "place-fantome", "derniere", lieu.bonjour, lieu.adieu, script.merci, ...script.questions.map((x) => x.replique)])];
}

/** Le blanc laissé entre deux répliques enchaînées (« Dernière question ! » … la question). */
export const ENTRE_DEUX_S = 0.18;

/**
 * LE TEMPS DE LIRE UNE QUESTION QUE LE FANTÔME NE DIT PAS — pas encore
 * enregistrée dans sa voix : elle est écrite à l'écran, et on lui laisse le
 * temps de la lire avant d'écouter sa réponse.
 */
export const dureeDeLecture = (texte: string) => Math.min(6, Math.max(2.4, 1.4 + 0.06 * texte.trim().length));

/**
 * QUI RÉPOND À L'ÉCRAN : le chef lui-même, filmé, ou son fantôme — « si le
 * commerçant ne veut pas montrer son visage ». Dans les deux cas c'est SA voix.
 */
export type Mode = "camera" | "fantome";

/* ═══ LE TEMPS ═════════════════════════════════════════════════════════════
 *
 * TRENTE SECONDES PAR RÉPONSE AU PLUS. « Une minute, c'est peut-être un peu
 * court » : avec quatre questions, l'interview monte à deux minutes — c'est le
 * format qui décide de la longueur, plus un budget commun.
 */
export const REPONSE_MAX_S = 30;
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
export const ATTENTE_SANS_PAROLE_S = 10;

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

/* ═══ LA SIGNATURE « FACE AU FANTÔME » : CE QUI SE CALCULE SANS TÉLÉPHONE ══
 *
 * « Est-ce que le mode interview a bien été pensé pour que le résultat soit à
 * la hauteur de ce que tu viens de réaliser ? » Non : l'ardoise à la craie
 * n'avait ni le nom géant au clic, ni les cartes de questions, ni les mots qui
 * s'allument un à un. Le dessin est dans `interview-signature.ts` ; ici, les
 * règles qui se vérifient (`scripts/verifier-signature-interview.mjs`).
 */

/** Un mot dit, et quand : `a` son début, `b` sa fin, en secondes depuis le début de la prise. */
export type MotDit = { m: string; a: number; b: number; fort?: boolean };

/**
 * LES MOTS UN À UN. Le service de transcription donne des phrases, pas des
 * mots : chaque sous-titre est réparti sur son temps au prorata de la longueur
 * de ses mots. Ce n'est pas un minutage au mot près, mais à l'œil, le mot
 * s'allume quand on l'entend. `forts` : les mots à mettre en rose (son plat,
 * son prix).
 */
export function motsDesSousTitres(sousTitres: readonly SousTitre[], forts: ((mot: string) => boolean) | null = null): MotDit[] {
  const out: MotDit[] = [];
  for (const s of sousTitres) {
    // « moment ? » : le point d'interrogation reste collé à son mot
    const mots = s.texte
      .replace(/\s+/g, " ")
      .trim()
      .replace(/ ([?!:;»])/g, "\u202F$1")
      .replace(/« /g, "«\u202F")
      .split(" ")
      .filter(Boolean);
    const poids = mots.map((m) => m.length + 2);
    const total = poids.reduce((a, b) => a + b, 0);
    if (!total || s.fin <= s.debut) continue;
    let t = s.debut;
    mots.forEach((m, k) => {
      const d = (poids[k] / total) * (s.fin - s.debut);
      out.push({ m, a: t, b: t + d, ...(forts?.(m) ? { fort: true } : {}) });
      t += d;
    });
  }
  return out;
}

/** Un morceau de sous-titre : quelques mots, montrés ensemble, de `de` à `fin`. */
export type MorceauDit = { mots: MotDit[]; de: number; fin: number };

/**
 * LES MORCEAUX À L'ÉCRAN : dix-sept signes au plus — deux lignes de gros mots
 * sur un téléphone —, coupés aussi sur un silence ou une ponctuation, comme
 * dans l'épisode de Lou. Un morceau reste jusqu'au suivant, sans le chevaucher.
 */
export function morceauxDeMots(mots: readonly MotDit[], max = 17): MorceauDit[] {
  const groupes: MotDit[][] = [];
  let cur: MotDit[] = [];
  for (const w of mots) {
    const prev = cur[cur.length - 1];
    const longueur = cur.map((x) => x.m).join(" ").length + 1 + w.m.length;
    if (cur.length && (longueur > max || w.a - prev.b > 0.35 || /[,.;:!?…]$/.test(prev.m))) {
      groupes.push(cur);
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) groupes.push(cur);
  return groupes.map((g, k) => {
    const suivant = groupes[k + 1];
    const fin = g[g.length - 1].b + 0.32;
    return { mots: g, de: g[0].a - 0.06, fin: suivant ? Math.min(fin, suivant[0].a - 0.06) : fin };
  });
}

/**
 * UNE RÉPONSE DE QUATRE MOTS AU PLUS NE SE SOUS-TITRE PAS : ELLE FRAPPE. « Ta
 * boutique en trois mots ? — Douce. Vraie. Pleine de surprises. » Chaque mot
 * passe en plein écran, au moment où il est dit.
 */
export const enFrappes = (mots: readonly MotDit[]): boolean => mots.length >= 1 && mots.length <= 4;

/** Une frappe : un mot (ou un petit mot et le suivant), de `a` à `fin`. */
export type Frappe = { m: string; a: number; fin: number };

/**
 * LES FRAPPES D'UNE RÉPONSE COURTE. Un petit mot (« le », « en », « et »)
 * ne frappe pas seul : « LE » en plein écran ne veut rien dire. Il se colle au
 * mot qui suit (« LE MAGRET »). Chaque frappe reste jusqu'à la suivante, une
 * seconde au plus.
 */
export function frappesDesMots(mots: readonly MotDit[]): Frappe[] {
  const groupes: MotDit[][] = [];
  let cur: MotDit[] = [];
  for (const w of mots) {
    cur.push(w);
    const nu = w.m.replace(/[^0-9A-Za-zÀ-ÖØ-öø-ÿŒœ]/g, "");
    if (nu.length > 3 || /[,.;:!?…]$/.test(w.m)) {
      groupes.push(cur);
      cur = [];
    }
  }
  if (cur.length) {
    if (groupes.length) groupes[groupes.length - 1].push(...cur);
    else groupes.push(cur);
  }
  return groupes.map((g, k) => {
    const a = g[0].a;
    const suivant = groupes[k + 1];
    return { m: g.map((w) => w.m).join(" "), a, fin: suivant ? Math.min(suivant[0].a - 0.12, a + 0.95) : a + 0.75 };
  });
}

/** Les mots de son plat (quatre lettres et plus) et son prix : ils s'écrivent en rose. */
export function motsForts(plat: string, prix: string): ((mot: string) => boolean) | null {
  const sans = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const racines = [...new Set(sans(plat).split(/[^a-z0-9]+/).filter((m) => m.length >= 4))];
  const chiffres = (prix.match(/\d+/) ?? [])[0];
  const parties = racines.map((r) => r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (chiffres) parties.push(`${chiffres}(?:[,.]\\d+)?\\s*(?:€|euros?)?`);
  if (!parties.length) return null;
  const motif = new RegExp(`^(?:${parties.join("|")})`, "i");
  return (m: string) => motif.test(sans(m).replace(/^[«"'(]+/, ""));
}

/** Une ligne coupée en deux, au plus près du milieu (en signes) — une ligne seule si elle est courte. */
export function enDeuxLignes(texte: string, seuleJusqua = 12): [string, string] {
  // les espaces ordinaires seulement : l'espace fine colle « ? » à son mot
  const mots = texte.trim().split(/[ \t\r\n]+/).filter(Boolean);
  if (mots.length < 2 || texte.trim().length <= seuleJusqua) return [texte.trim(), ""];
  let mieux: [string, string] = [mots.join(" "), ""];
  let ecart = Infinity;
  for (let k = 1; k < mots.length; k++) {
    const a = mots.slice(0, k).join(" ");
    const b = mots.slice(k).join(" ");
    const e = Math.max(a.length, b.length);
    if (e < ecart) {
      ecart = e;
      mieux = [a, b];
    }
  }
  return mieux;
}

/** Ce que la carte d'une question écrit : son numéro, son titre en deux lignes, la question dite. */
export type CarteDeQuestion = { num: string; l1: string; l2: string; fin: string; sous: [string, string] };

/**
 * LA CARTE DE LA QUESTION `k` SUR `n` : « QUESTION 1 / 3 », le titre en très
 * gros (« LA PIÈCE / DU MOMENT ? »), et dessous ce que le fantôme demande
 * vraiment. La dernière d'une série s'annonce comme telle.
 */
export function carteDeQuestion(titre: string, k: number, n: number, dite: string): CarteDeQuestion {
  const t = titre.trim();
  const fin = /…$/.test(t) ? "…" : /\?$/.test(t) ? "?" : "";
  const corps = t.replace(/\s*[?…]$/, "").trim();
  const [l1, l2] = enDeuxLignes(corps.toLocaleUpperCase("fr-FR"), 9);
  // « JEAN OU ROBE ? » en très gros n'a pas besoin d'être écrit une seconde fois dessous
  const nu = (x: string) => x.toLowerCase().replace(/[^a-zà-ÿœ0-9]+/g, "");
  const repete = nu(corps) === nu(dite);
  return {
    num: n >= 2 && k === n - 1 ? "DERNIÈRE QUESTION" : `QUESTION ${k + 1} / ${n}`,
    l1,
    l2,
    fin,
    sous: repete ? ["", ""] : enDeuxLignes(dite.replace(/\s+([?!:;])/g, "\u202F$1"), 22),
  };
}

/**
 * « CE MIDI AU / BORDEAUX » — l'article du nom se contracte, comme on l'écrit à
 * la main sur une ardoise. « Ce midi au Le Bordeaux » se lit comme une faute
 * de frappe ; un nom sans article passe par « chez ».
 */
export function enteteArdoise(commerce: string, quand = "Ce midi"): { avant: string; nom: string } {
  const n = commerce.trim();
  const m = /^(les|le|la)\s+(.+)$/i.exec(n);
  if (m) {
    const art = m[1].toLowerCase();
    return { avant: `${quand} ${art === "le" ? "au" : art === "les" ? "aux" : "à la"}`, nom: m[2] };
  }
  const l = /^l['’]\s*(.+)$/i.exec(n);
  if (l) return { avant: `${quand} à l'`, nom: l[1] };
  // « Chez Bergine » porte déjà son « chez »
  if (/^chez\s/i.test(n)) return { avant: quand, nom: n };
  return { avant: `${quand} chez`, nom: n };
}

/* ═══ LE PLAN DU MONTAGE ═══════════════════════════════════════════════════
 *
 * L'émission Face au fantôme, en quatre temps (`interview-montage.ts`) : le
 * TITRE (le clic, son nom en géant), la CLOCHE pour un restaurant qui a sa
 * photo, les PRISES (la carte de la question, que le reporter pose avec sa
 * voix, puis sa réponse en plein écran), la FIN (la carte postale, son prix,
 * le bouton, « à bientôt »). Les durées des prises ne sont connues qu'en les
 * jouant — on coupe quand la vidéo atteint la fin de la parole — donc le plan
 * donne des durées, pas des heures.
 */

/**
 * LA CLOCHE, ENTRE LE TITRE ET LA PREMIÈRE QUESTION — pour un restaurant
 * qui a donné la photo de son plat. « Utiliser l'animation de la découverte,
 * juste l'étape 1 avec la cloche, parce que c'est esthétique et beau » : la
 * salle, son fantôme assis qui la montre, la cloche qui s'envole — puis,
 * comme dans l'application, l'étape 2 : le plat en grand (« si tu n'y arrives
 * pas dans une assiette, mets-le en pleine page »). Puis viennent les
 * questions. `leve` : quand la cloche se soulève ; `duree` : tout le moment.
 */
export const CLOCHE = { leve: 1.35, duree: 6 } as const;

/**
 * LE DÉBIT DU MONTAGE — QU'IL TIENNE DANS SON ENVOI. La vidéo part de son
 * téléphone vers notre stockage (`api/site-internet/pro/interview`, cinquante
 * mégaoctets au plus) puis vers Instagram. Quatre mégabits par seconde, c'est
 * trente mégaoctets la minute : une interview de deux minutes et demie n'y
 * tenait pas. Le débit baisse donc avec la longueur prévue, pour viser
 * quarante mégaoctets — des cartes, un visage qui parle et un fantôme ne
 * demandent pas plus de deux mégabits en 720 × 1280.
 */
export const OCTETS_VISES = 40_000_000;
export const DEBIT_SON = 128_000;
export function debitDuMontage(secondesPrevues: number): number {
  const d = Math.max(1, secondesPrevues);
  return Math.round(Math.min(4_000_000, Math.max(1_200_000, (OCTETS_VISES * 8) / d - DEBIT_SON)));
}

/**
 * OÙ COUPER UNE PRISE (en secondes depuis son début) : sept dixièmes après la
 * dernière parole, pour ne pas lui couper la fin du mot ; s'il n'a rien dit,
 * deux secondes et demie après la question — un sourire, puis la suite.
 */
export function coupeDeLaPrise(p: { duree: number; questionFin: number; paroleFin: number | null }): number {
  const voulu = p.paroleFin != null ? p.paroleFin + 0.7 : p.questionFin + 2.5;
  return Math.max(p.questionFin + 0.8, Math.min(p.duree, voulu));
}
