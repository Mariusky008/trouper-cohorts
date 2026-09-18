// 🔊 LES SONS DE CLIKME — une signature, déclinée sur les gestes qui comptent.
//
// ═══ CE QU'IL A DEMANDÉ ════════════════════════════════════════════════════
//
// « Enfin il faut rajouter des sons qui seront spécifiques à ClikMe et
// distinctifs pour améliorer l'expérience utilisateur. »
//
// ═══ ILS SONT SYNTHÉTISÉS, ET C'EST LA DÉCISION PRINCIPALE ════════════════
//
// PAS UN SEUL FICHIER AUDIO. Un son libre de droits se télécharge, s'héberge,
// se cite, et se révèle un jour sous une licence qui n'était pas celle qu'on
// croyait. Il pèse aussi quelques dizaines de kilo-octets par son, sur une
// application qu'on ouvre au marché avec deux barres de réseau.
//
// ICI TOUT EST CALCULÉ À LA VOLÉE par le navigateur : quelques oscillateurs,
// une enveloppe, un filtre. Zéro octet transféré, zéro question de licence,
// zéro requête qui peut échouer — et surtout, une signature qui n'appartient
// qu'à ce produit parce que personne d'autre n'a écrit ces douze lignes.
//
// ═══ LA SIGNATURE, ET POURQUOI CELLE-LÀ ═══════════════════════════════════
//
// DEUX NOTES QUI MONTENT D'UNE QUINTE, en onde triangle, avec une très courte
// attaque et une longue retombée. C'est la forme d'un carillon, pas d'une
// alerte : une quinte ascendante est l'intervalle que l'oreille lit comme
// « ouverture », là où une seconde mineure lit « attention » et une tierce
// descendante lit « fini ».
//
// ELLE SE DÉCLINE, ELLE NE SE RÉPÈTE PAS. Le même intervalle, transposé et
// raccourci, donne le petit « clic » d'un appui ; étiré et doublé à l'octave,
// il donne la révélation du rendu. On reconnaît la même main sans jamais
// entendre deux fois le même son — c'est ce que fait une identité sonore, par
// opposition à un bip collé partout.
//
// ═══ TROIS RÈGLES QU'ON NE NÉGOCIE PAS ════════════════════════════════════
//
//   · ON NE FAIT AUCUN BRUIT AVANT QU'ON AIT TOUCHÉ L'ÉCRAN. C'est une
//     contrainte des navigateurs — un contexte audio créé sans geste reste
//     suspendu — et c'est surtout la bonne manière : une application qui parle
//     toute seule dans un silence se ferme.
//   · ÇA SE COUPE, ET LE CHOIX SURVIT À LA FERMETURE. Voir `SONS_COUPES`.
//   · RIEN NE CASSE SI L'AUDIO EST INDISPONIBLE. Navigateur ancien, contexte
//     refusé, onglet en arrière-plan : tout est enveloppé, et l'absence de son
//     n'empêche jamais un geste d'aboutir. Un son est un ornement ; le traiter
//     autrement transforme un agrément en panne.

/** La clé du réglage. Sa valeur est « 1 » quand on a coupé le son. */
const CLE = "clikme-son-v1";

let ctx: AudioContext | null = null;
let maitre: GainNode | null = null;
let coupe: boolean | null = null;

/**
 * LE SON EST-IL COUPÉ ?
 *
 * LU UNE FOIS PUIS GARDÉ EN MÉMOIRE. `localStorage` est synchrone et touche le
 * disque : le relire à chaque note, sur une page qui en joue plusieurs par
 * seconde pendant un balayage de cartes, se paie en saccades.
 */
export function sonCoupe(): boolean {
  if (coupe !== null) return coupe;
  try {
    coupe = window.localStorage.getItem(CLE) === "1";
  } catch {
    coupe = false;
  }
  return coupe;
}

/** Coupe ou rallume, et le retient. Rend le nouvel état. */
export function basculerLeSon(): boolean {
  const v = !sonCoupe();
  coupe = v;
  try {
    window.localStorage.setItem(CLE, v ? "1" : "0");
  } catch {
    // UN NAVIGATEUR QUI REFUSE LE STOCKAGE GARDE QUAND MÊME LE CHOIX POUR LA
    // VISITE : la variable en mémoire suffit jusqu'à la fermeture, et c'est
    // mieux que de faire semblant que le bouton n'a rien fait.
  }
  if (v && maitre) maitre.gain.value = 0;
  else if (maitre) maitre.gain.value = VOLUME;
  return v;
}

/**
 * LE VOLUME GÉNÉRAL, ET IL EST BAS EXPRÈS.
 *
 * CES SONS ACCOMPAGNENT, ILS N'ANNONCENT PAS. À plein régime, un carillon sur
 * chaque appui devient insupportable au bout de trente secondes — c'est le
 * défaut de toutes les applications qui ont ajouté du son sans en enlever
 * ensuite. Un quart de l'échelle laisse le son perceptible dans une rue et
 * discret dans un salon.
 */
const VOLUME = 0.26;

function moteur(): { ctx: AudioContext; sortie: GainNode } | null {
  if (typeof window === "undefined") return null;
  if (sonCoupe()) return null;
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      maitre = ctx.createGain();
      maitre.gain.value = VOLUME;
      maitre.connect(ctx.destination);
    }
    /**
     * ON LE RÉVEILLE À CHAQUE FOIS, ET C'EST NÉCESSAIRE.
     *
     * Un contexte créé avant le premier geste naît suspendu ; il se suspend
     * aussi tout seul quand l'onglet part en arrière-plan sur certains
     * téléphones. Sans ce réveil, tout marche à la première visite et plus
     * jamais après un retour d'accueil — et ça ne se voit qu'en le refaisant.
     */
    if (ctx.state === "suspended") void ctx.resume();
    return maitre ? { ctx, sortie: maitre } : null;
  } catch {
    return null;
  }
}

/**
 * UNE VOIX : une note, son enveloppe, son filtre.
 *
 * L'ENVELOPPE EST CE QUI FAIT LE TIMBRE, bien plus que la forme d'onde. Une
 * attaque de quelques millisecondes et une retombée exponentielle donnent une
 * percussion ; une attaque lente donne un souffle. C'est le même oscillateur
 * dans les deux cas.
 *
 * LA RETOMBÉE EST EXPONENTIELLE ET NON LINÉAIRE : l'oreille entend le volume
 * en décibels, donc une décroissance droite s'entend comme une coupure nette
 * à la fin. C'est la différence entre une cloche et un bip.
 */
function voix(
  m: { ctx: AudioContext; sortie: GainNode },
  {
    hz,
    depart = 0,
    duree = 0.3,
    attaque = 0.006,
    niveau = 1,
    forme = "triangle",
    vers,
    coupure,
  }: {
    hz: number;
    depart?: number;
    duree?: number;
    attaque?: number;
    niveau?: number;
    forme?: OscillatorType;
    /** La note glisse vers cette fréquence — le « whoosh » d'un envoi. */
    vers?: number;
    /** Un passe-bas, pour arrondir. Sans lui, le triangle siffle dans l'aigu. */
    coupure?: number;
  },
): void {
  const t = m.ctx.currentTime + depart;
  const o = m.ctx.createOscillator();
  o.type = forme;
  o.frequency.setValueAtTime(hz, t);
  if (vers) o.frequency.exponentialRampToValueAtTime(Math.max(20, vers), t + duree);
  const g = m.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, niveau), t + attaque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  let fin: AudioNode = g;
  if (coupure) {
    const f = m.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = coupure;
    g.connect(f);
    fin = f;
  }
  o.connect(g);
  fin.connect(m.sortie);
  o.start(t);
  o.stop(t + duree + 0.04);
}

/**
 * UN SOUFFLE — du bruit filtré, très court.
 *
 * IL NE S'ENTEND PAS TOUT SEUL, ET C'EST SON RÔLE. Posé sous une note, il lui
 * donne une attaque : c'est ce qui sépare un son d'instrument d'un son de
 * synthétiseur des années quatre-vingt. Deux centièmes de seconde suffisent.
 */
function souffle(
  m: { ctx: AudioContext; sortie: GainNode },
  { depart = 0, duree = 0.08, niveau = 0.16, coupure = 2600 } = {},
): void {
  const n = Math.max(1, Math.floor(m.ctx.sampleRate * duree));
  const tampon = m.ctx.createBuffer(1, n, m.ctx.sampleRate);
  const d = tampon.getChannelData(0);
  for (let i = 0; i < n; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = m.ctx.createBufferSource();
  s.buffer = tampon;
  const f = m.ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = coupure;
  f.Q.value = 0.8;
  const g = m.ctx.createGain();
  const t = m.ctx.currentTime + depart;
  g.gain.setValueAtTime(niveau, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  s.connect(f);
  f.connect(g);
  g.connect(m.sortie);
  s.start(t);
}

/**
 * ═══ LA GAMME, ET ELLE EST PENTATONIQUE ══════════════════════════════════
 *
 * CINQ NOTES QUI NE PEUVENT PAS SONNER FAUX ENSEMBLE. Une pentatonique majeure
 * n'a ni demi-ton ni triton : deux de ses notes jouées au hasard, dans
 * n'importe quel ordre, font toujours un accord agréable. C'est exactement ce
 * qu'il faut quand les sons se déclenchent sur les gestes de quelqu'un, donc
 * dans un ordre qu'on ne contrôle pas — un balayage rapide de cartes enchaîne
 * cinq sons en une seconde, et il ne doit jamais en sortir une dissonance.
 */
const LA = 440;
const D = (n: number) => LA * Math.pow(2, n / 12);
const MI = D(-5); // 329,6
const SOL = D(-2); // 392
const SI = D(2); // 493,9
const RE = D(5); // 587,3
const MI2 = D(7); // 659,3
const SOL2 = D(10);
const SI2 = D(14);

/** Les gestes qui ont un son. Voir chaque cas pour ce qu'il dit. */
export type Geste =
  | "ouvrir"
  | "toc"
  | "passer"
  | "garder"
  | "essai"
  | "revele"
  | "fantome"
  | "note"
  | "souci";

/**
 * JOUER UN GESTE.
 *
 * ELLE NE REND RIEN ET NE LÈVE JAMAIS. Un appelant ne doit pas avoir à se
 * demander si le son a marché : ce n'est pas une information qui sert à
 * quelque chose, et le vérifier ajouterait une condition à chaque geste du
 * produit pour un ornement.
 */
export function jouer(geste: Geste): void {
  const m = moteur();
  if (!m) return;
  try {
    switch (geste) {
      /**
       * ═══ LA SIGNATURE ════════════════════════════════════════════════════
       *
       * TROIS NOTES QUI MONTENT, MI-SI-MI, avec un souffle sous la première.
       * C'est LE son de ClikMe : celui qu'on entend en entrant, et le seul qui
       * soit joué en entier. Tous les autres en sont des fragments.
       *
       * LA TROISIÈME EST À L'OCTAVE DE LA PREMIÈRE, et c'est ce qui donne la
       * sensation d'arrivée : on repart du même degré, plus haut. Une quinte
       * seule laisse la phrase en suspens, ce qui est parfait pour un appui et
       * mauvais pour une ouverture.
       */
      case "ouvrir":
        souffle(m, { niveau: 0.2, duree: 0.13, coupure: 1800 });
        voix(m, { hz: MI, duree: 0.42, niveau: 0.5, coupure: 3400 });
        voix(m, { hz: SI, depart: 0.075, duree: 0.42, niveau: 0.45, coupure: 3800 });
        voix(m, { hz: MI2, depart: 0.15, duree: 0.68, niveau: 0.5, coupure: 4600 });
        // L'HARMONIQUE À L'OCTAVE, très bas : elle ne s'entend pas, elle fait
        // briller. Sans elle, la note finale est mate.
        voix(m, { hz: MI2 * 2, depart: 0.15, duree: 0.5, niveau: 0.09, forme: "sine" });
        break;

      /**
       * L'APPUI — un seul degré de la gamme, très court.
       *
       * IL EST DISCRET AU POINT QU'ON NE L'ENTEND PAS VRAIMENT : on le SENT.
       * Un appui qui chante attire l'attention sur le doigt au lieu de la
       * laisser sur l'écran, et devient odieux à la vingtième fois.
       */
      case "toc":
        voix(m, { hz: SI2, duree: 0.07, niveau: 0.2, attaque: 0.003, coupure: 5200 });
        break;

      /**
       * PASSER — deux notes qui DESCENDENT.
       *
       * LE SENS DE L'INTERVALLE EST LE SENS DU GESTE, et c'est tout ce qu'il y
       * a à comprendre : ce qui monte accepte, ce qui descend écarte. On
       * n'apprend pas cette convention, on l'a déjà.
       */
      case "passer":
        voix(m, { hz: SOL, duree: 0.13, niveau: 0.26, coupure: 2200 });
        voix(m, { hz: MI, depart: 0.055, duree: 0.2, niveau: 0.22, coupure: 2000 });
        break;

      /** GARDER — les deux mêmes notes, à l'endroit. */
      case "garder":
        voix(m, { hz: SOL, duree: 0.13, niveau: 0.26, coupure: 3000 });
        voix(m, { hz: RE, depart: 0.055, duree: 0.26, niveau: 0.28, coupure: 3600 });
        break;

      /**
       * L'ESSAI QUI PART — un glissement vers le haut, avec son souffle.
       *
       * IL N'A PAS DE NOTE FIXE, ET C'EST VOULU : ce geste n'est pas une
       * conclusion, c'est un départ. Une hauteur qui monte sans s'arrêter
       * laisse la phrase ouverte, et c'est la révélation qui la fermera.
       */
      case "essai":
        souffle(m, { niveau: 0.14, duree: 0.22, coupure: 1400 });
        voix(m, {
          hz: MI,
          vers: MI2,
          duree: 0.46,
          niveau: 0.3,
          attaque: 0.05,
          forme: "sine",
          coupure: 3200,
        });
        break;

      /**
       * ═══ LA RÉVÉLATION ═══════════════════════════════════════════════════
       *
       * LA SIGNATURE, MAIS PLUS LARGE ET PLUS LENTE. C'est le seul moment du
       * produit qui mérite un son entier : on a attendu une minute, et l'image
       * arrive. Quatre notes au lieu de trois, un souffle plus grave dessous,
       * et une retombée longue qui laisse l'écran respirer.
       *
       * ELLE MONTE DE MI À SI À L'OCTAVE — la même phrase que l'ouverture,
       * continuée. Entrer dans l'application et voir son rendu sont les deux
       * bouts du même geste ; les deux sons doivent s'appeler.
       */
      case "revele":
        souffle(m, { niveau: 0.18, duree: 0.2, coupure: 900 });
        voix(m, { hz: MI, duree: 0.6, niveau: 0.34, attaque: 0.012, coupure: 3000 });
        voix(m, { hz: SOL2, depart: 0.09, duree: 0.6, niveau: 0.3, coupure: 3600 });
        voix(m, { hz: SI2, depart: 0.18, duree: 0.7, niveau: 0.34, coupure: 4400 });
        voix(m, { hz: MI2 * 2, depart: 0.27, duree: 1.05, niveau: 0.28, coupure: 5200 });
        voix(m, { hz: MI2 * 4, depart: 0.27, duree: 0.8, niveau: 0.05, forme: "sine" });
        break;

      /**
       * LE FANTÔME QU'ON DÉPOSE — une note tenue, avec un léger vibrato de
       * hauteur. Il flotte, donc son son flotte : c'est la seule voix du jeu
       * qui ne soit pas percussive.
       */
      case "fantome":
        voix(m, {
          hz: SI,
          vers: SI * 1.02,
          duree: 0.5,
          niveau: 0.24,
          attaque: 0.09,
          forme: "sine",
          coupure: 2400,
        });
        voix(m, { hz: RE, depart: 0.11, duree: 0.46, niveau: 0.14, forme: "sine" });
        break;

      /**
       * LA NOTE QU'ON DONNE — un degré aigu et sec.
       *
       * ELLE NE MONTE PAS AVEC LE NOMBRE DE FANTÔMES, et j'ai failli le faire.
       * Ce serait joli une fois et faux au fond : une note de 2/5 n'est pas
       * « moins » qu'une de 5/5, c'est un avis. Un son qui s'élève avec la
       * note féliciterait celui qui met cinq et sanctionnerait celui qui met
       * deux — exactement ce que cet écran promet de ne pas faire.
       */
      case "note":
        voix(m, { hz: MI2, duree: 0.1, niveau: 0.22, attaque: 0.003, coupure: 4800 });
        voix(m, { hz: SI2, depart: 0.02, duree: 0.14, niveau: 0.12, forme: "sine" });
        break;

      /**
       * LE SOUCI — deux notes basses et rondes, JAMAIS UN BUZZER.
       *
       * QUELQU'UN DONT L'ESSAI VIENT D'ÉCHOUER N'A PAS BESOIN QU'ON LE GRONDE.
       * Le son dit « ça n'a pas marché », pas « vous avez fait une erreur » :
       * d'où la tierce descendante douce, filtrée bas, et un volume plus faible
       * que tous les autres. C'est la même règle que les textes d'erreur de ce
       * produit.
       */
      case "souci":
        voix(m, { hz: SOL, duree: 0.2, niveau: 0.18, attaque: 0.02, forme: "sine", coupure: 1200 });
        voix(m, {
          hz: MI,
          depart: 0.1,
          duree: 0.36,
          niveau: 0.16,
          attaque: 0.02,
          forme: "sine",
          coupure: 1000,
        });
        break;
    }
  } catch {
    // VOIR L'EN-TÊTE : un son est un ornement. Rien de ce qui se passe ici ne
    // doit pouvoir empêcher le geste qui l'a déclenché d'aboutir.
  }
}
