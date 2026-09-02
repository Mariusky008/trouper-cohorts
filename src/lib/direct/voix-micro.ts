// LE MICRO DE L'ASSISTANTE — branché une fois, gardé toute la conversation.
//
// ─── LA DÉCISION DE DÉPART VIENT D'UNE MESURE ─────────────────────────────
//
// `/autour-de-moi/essai-voix` a fait parler les deux chemins en même temps, sur
// la même phrase, sur un vrai iPhone : LES DEUX TIENNENT.
//
//   · LE TÉLÉPHONE EN PREMIER, parce qu'il sait faire une chose que le serveur
//     ne saura jamais : ÉCRIRE PENDANT QU'ON PARLE. Voir les mots apparaître est
//     ce qui apprend au commerçant qu'il est entendu — sans ça, il parle à un
//     bouton et il s'arrête au bout de trois mots pour vérifier.
//
//   · LE SERVEUR EN FILET, parce que le moteur du navigateur se coupe. On
//     enregistre donc TOUJOURS en parallèle, et si le téléphone ne rend rien
//     d'exploitable, le serveur reprend la phrase entière.
//
// ─── ET LE MICRO NE SE REDEMANDE PLUS À CHAQUE TOUR ───────────────────────
//
// LE DÉFAUT MESURÉ, ET IL TUAIT LA CONVERSATION : « à partir du deuxième
// message elle ne m'entend plus, elle m'entend seulement la première fois quand
// j'autorise le micro ». La question qui suivait était la bonne : « peut-on
// toujours avoir le micro branché sans avoir à autoriser ? »
//
// OUI, ET C'EST MÊME LA SEULE FAÇON QUE ÇA MARCHE. On réclamait un flux neuf à
// chaque prise de parole, et on coupait ses pistes à la fin. Sur iPhone, chaque
// nouvelle demande rouvre la session audio — et une session qu'on rouvre juste
// après avoir joué la voix de Léa revient parfois muette, sans erreur et sans
// refus visible. La première fonctionnait parce qu'elle suivait l'autorisation ;
// les suivantes tombaient dans ce trou.
//
// LE FLUX EST DONC OUVERT UNE FOIS ET GARDÉ. Entre deux tours on n'arrête que
// l'enregistreur, jamais le micro lui-même. L'autorisation n'est demandée qu'une
// fois, la session ne bascule plus, et le deuxième tour entend exactement comme
// le premier. Le micro n'est relâché qu'en quittant l'écran — voir
// `libererMicro`.
//
// ─── ET RIEN DE TOUT ÇA NE DISPENSE DE LA VALIDATION ──────────────────────
//
// Aucune transcription n'est fiable à cent pour cent dans un commerce en
// activité. « Quatorze euros » entendu « quatre euros » et publié à toute une
// ville coûte un commerçant : la carte de validation est ce qui autorise le
// vocal à exister.

/** Ce qu'une écoute a produit, et par quel chemin. */
export type Ecoute = {
  texte: string;
  /** « telephone » ou « serveur » — utile pour comprendre après coup. */
  par: "telephone" | "serveur" | "rien";
  erreur?: string;
};

const CONTENEURS = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/ogg;codecs=opus",
];

function conteneur(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const t of CONTENEURS) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t;
    } catch {
      /* Navigateur ancien : on laissera le défaut. */
    }
  }
  return "";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function moteur(): any {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Vrai si ce téléphone sait dicter tout seul. Sert à l'affichage, pas au flux :
 *  le filet s'occupe du cas contraire sans qu'on ait à le demander. */
export function dicteeDisponible(): boolean {
  return !!moteur();
}

/**
 * LE SILENCE QUI DIT « J'AI FINI ».
 *
 * LE SEUIL EST BAS ET L'ATTENTE EST GÉNÉREUSE, et les deux vont ensemble. Un
 * commerçant s'interrompt : il compte ses portions, il sert quelqu'un, il
 * cherche un mot. Couper au bout de six cents millisecondes lui vole la moitié
 * de sa phrase, et une assistante qui coupe la parole ne se fait pas pardonner.
 * Mille deux cents laisse passer une hésitation sans faire attendre.
 *
 * ET ON NE COUPE QU'APRÈS AVOIR ENTENDU QUELQUE CHOSE. Sans ça, un micro ouvert
 * dans une pièce calme se fermerait aussitôt. S'il ne dit rien du tout, on rend
 * la main après huit secondes plutôt que de laisser une lampe rouge allumée.
 */
const SEUIL = 0.012;
/**
 * NEUF CENTS. « Ça manque de rythme et de naturel, c'est moins naturel que
 * lorsque je parle avec ChatGPT. » Une part de l'écart tient à ce seul nombre :
 * c'est le blanc entre la fin de sa phrase et le départ de la réponse, et on
 * l'entend à chaque tour. Mille cinq cents était prudent, mille deux cents
 * encore perceptible. Neuf cents laisse passer une hésitation courte sans faire
 * attendre — en dessous, on lui coupe la parole, et ça ne se pardonne pas.
 */
const SILENCE_MS = 900;
const RIEN_MS = 8000;

/** En dessous, ce n'est pas quelqu'un qui parle bas : c'est un micro sourd. */
const SOURD = 0.002;

// ─── CE QUI VIT PLUS LONGTEMPS QU'UNE ÉCOUTE ─────────────────────────────
// Le flux du micro et le contexte d'analyse sont ouverts une fois et gardés
// pour toute la visite. C'est tout le correctif : voir l'en-tête du fichier.
let fluxPartage: MediaStream | null = null;
let demande: Promise<MediaStream | null> | null = null;
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
let ctxSon: any = null;
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
let analyseur: any = null;

async function obtenirMicro(): Promise<MediaStream | null> {
  // UN FLUX VIVANT SE REDONNE TEL QUEL. On vérifie qu'il l'est encore : le
  // système peut le couper tout seul (appel entrant, écran verrouillé), et on
  // en redemande alors un — c'est le seul cas où l'on redemande.
  if (fluxPartage && fluxPartage.getAudioTracks().some((t) => t.readyState === "live")) {
    return fluxPartage;
  }
  fluxPartage = null;
  if (!demande) {
    demande = navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((f) => {
        fluxPartage = f;
        return f;
      })
      .catch(() => null)
      .finally(() => {
        demande = null;
      });
  }
  return demande;
}

/**
 * L'OREILLE QUI GUETTE LE SILENCE, elle aussi montée une seule fois.
 *
 * On mesure le NIVEAU, pas les mots : dix lignes, ça marche partout, là où le
 * moteur de dictée ne dit pas toujours quand il considère qu'une phrase est
 * finie. Le contexte s'ouvre en sommeil quand un son vient d'être joué — et Léa
 * vient justement de parler — donc on le réveille à chaque fois.
 */
async function preparerOreille(flux: MediaStream) {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!ctxSon) {
    ctxSon = new AC();
    analyseur = ctxSon.createAnalyser();
    analyseur.fftSize = 1024;
    ctxSon.createMediaStreamSource(flux).connect(analyseur);
  }
  if (ctxSon.state === "suspended") {
    try {
      await ctxSon.resume();
    } catch {
      /* Refusé : on écoutera quand même, sans détection de silence. */
    }
  }
  return analyseur;
}

/** Tout relâcher — en quittant l'écran, et nulle part ailleurs. */
export function libererMicro() {
  fluxPartage?.getTracks().forEach((t) => t.stop());
  fluxPartage = null;
  try {
    ctxSon?.close();
  } catch {
    /* déjà fermé */
  }
  ctxSon = null;
  analyseur = null;
}

/** Vrai si le micro est déjà branché — l'autorisation ne sera pas redemandée. */
export function microBranche(): boolean {
  return !!fluxPartage?.getAudioTracks().some((t) => t.readyState === "live");
}

export type Reglages = {
  /** Appelé quand il s'est tu — c'est ce qui remplace le deuxième appui. */
  surSilence?: () => void;
};

/**
 * UNE ÉCOUTE. On l'ouvre, elle écrit en direct, on l'arrête, elle rend le texte.
 *
 * La promesse n'est tenue qu'à l'arrêt, et elle est tenue MÊME si tout échoue :
 * elle rend alors un texte vide et une raison, jamais une exception. Un micro
 * qui lève une erreur au milieu d'une démonstration ferme l'écran.
 */
export function ouvrirEcoute(
  enDirect: (t: string) => void,
  reglages: Reglages = {},
): {
  arreter: () => Promise<Ecoute>;
  annuler: () => void;
} {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let rec: any = null;
  let enr: MediaRecorder | null = null;
  const bouts: Blob[] = [];
  let fini = "";
  let vivant = "";
  let coupe = false;
  let guet = 0;
  let aParle = false;
  /** Le niveau le plus fort entendu — un zéro strict vaut un diagnostic. */
  let niveauMax = 0;

  const Moteur = moteur();
  if (Moteur) {
    try {
      const r = new Moteur();
      r.lang = "fr-FR";
      r.continuous = true;
      r.interimResults = true;
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      r.onresult = (ev: any) => {
        let f = "";
        let c = "";
        for (let i = 0; i < ev.results.length; i++) {
          const t = ev.results[i][0]?.transcript ?? "";
          if (ev.results[i].isFinal) f += t;
          else c += t;
        }
        fini = f.trim();
        vivant = (f + c).trim();
        enDirect(vivant);
      };
      // ON NE TRAITE PAS L'ERREUR : elle est normale. « no-speech », « aborted »,
      // « audio-capture » arrivent, et c'est exactement pour ça que le filet
      // existe.
      r.start();
      rec = r;
    } catch {
      rec = null;
    }
  }

  const pret = (async () => {
    const flux = await obtenirMicro();
    if (!flux || coupe) return;
    try {
      const type = conteneur();
      const m = type
        ? new MediaRecorder(flux, { mimeType: type })
        : new MediaRecorder(flux);
      m.ondataavailable = (ev) => {
        if (ev.data && ev.data.size) bouts.push(ev.data);
      };
      m.start();
      enr = m;
    } catch {
      return;
    }

    if (!reglages.surSilence) return;
    const an = await preparerOreille(flux);
    if (!an || coupe) return;
    const tampon = new Float32Array(an.fftSize);
    const debut = Date.now();
    let dernierSon = 0;
    guet = window.setInterval(() => {
      an.getFloatTimeDomainData(tampon);
      let somme = 0;
      for (let i = 0; i < tampon.length; i++) somme += tampon[i] * tampon[i];
      const niveau = Math.sqrt(somme / tampon.length);
      if (niveau > niveauMax) niveauMax = niveau;
      const t = Date.now();
      if (niveau > SEUIL) {
        aParle = true;
        dernierSon = t;
        return;
      }
      const termine = aParle
        ? dernierSon && t - dernierSon > SILENCE_MS
        : t - debut > RIEN_MS;
      if (termine) {
        window.clearInterval(guet);
        guet = 0;
        reglages.surSilence?.();
      }
    }, 120);
  })();

  /**
   * ON FERME L'ENREGISTREUR, JAMAIS LE MICRO. C'est tout le correctif : couper
   * les pistes entre deux tours obligeait à redemander un flux, et le deuxième
   * revenait muet.
   */
  const fermer = () => {
    if (guet) {
      window.clearInterval(guet);
      guet = 0;
    }
    try {
      rec?.stop();
    } catch {
      /* déjà arrêté */
    }
    rec = null;
  };

  return {
    annuler: () => {
      coupe = true;
      try {
        if (enr && enr.state !== "inactive") enr.stop();
      } catch {
        /* déjà arrêté */
      }
      enr = null;
      fermer();
    },
    arreter: async () => {
      await pret;
      let audio = "";
      if (enr) {
        const m = enr;
        await new Promise<void>((r) => {
          m.onstop = () => r();
          try {
            m.stop();
          } catch {
            r();
          }
        });
        const b = new Blob(bouts, { type: m.mimeType || "audio/webm" });
        if (b.size > 1000) {
          audio = await new Promise<string>((r) => {
            const l = new FileReader();
            l.onload = () => r(String(l.result));
            l.onerror = () => r("");
            l.readAsDataURL(b);
          });
        }
      }
      enr = null;
      // LE MOTEUR DU TÉLÉPHONE S'ARRÊTE APRÈS L'ENREGISTREUR : il rend souvent
      // son dernier morceau au moment où on le coupe, et le couper trop tôt
      // perdrait la fin de la phrase.
      await new Promise((r) => setTimeout(r, 300));
      const duTelephone = (fini || vivant).trim();
      const sourd = !!reglages.surSilence && niveauMax < SOURD;
      fermer();

      // CE QUE LE TÉLÉPHONE A DONNÉ SUFFIT-IL ? Le seuil est en MOTS : « oui »
      // est une réponse complète, « ma » est un début de phrase coupée.
      if (duTelephone.split(/\s+/).filter(Boolean).length >= 2) {
        return { texte: duTelephone, par: "telephone" };
      }

      // ─── ON N'ENVOIE PAS DU SILENCE AU SERVEUR ───
      // Sur un enregistrement muet, le service de transcription rend le texte de
      // contexte qu'on lui a soufflé, et cet écho partait dans la conversation
      // comme si le commerçant l'avait dit. La route le filtre aussi, mais le
      // vrai correctif est ici : ne rien envoyer quand il n'y a rien.
      if (sourd) {
        return {
          texte: duTelephone,
          par: duTelephone ? "telephone" : "rien",
          erreur: duTelephone
            ? undefined
            : "Le micro n’a capté aucun son. Vérifiez qu’il est autorisé pour ce site.",
        };
      }

      if (!audio) {
        return {
          texte: duTelephone,
          par: duTelephone ? "telephone" : "rien",
          erreur: duTelephone ? undefined : "Je n’ai rien entendu.",
        };
      }

      try {
        const rep = await fetch("/api/direct/transcrire", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ audio }),
        });
        const d = await rep.json();
        const t = String(d?.texte || "").trim();
        if (rep.ok && t) return { texte: t, par: "serveur" };
        return {
          texte: duTelephone,
          par: duTelephone ? "telephone" : "rien",
          erreur: duTelephone ? undefined : String(d?.erreur || "Je n’ai rien compris."),
        };
      } catch {
        return {
          texte: duTelephone,
          par: duTelephone ? "telephone" : "rien",
          erreur: duTelephone ? undefined : "Je n’ai pas pu vous entendre.",
        };
      }
    },
  };
}
