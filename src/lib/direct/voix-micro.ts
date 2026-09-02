// LE MICRO DE L'ASSISTANTE — le téléphone d'abord, le serveur en filet.
//
// ─── LA DÉCISION VIENT D'UNE MESURE, PAS D'UN AVIS ────────────────────────
//
// `/autour-de-moi/essai-voix` a fait parler les deux chemins en même temps, sur
// la même phrase, sur un vrai iPhone : LES DEUX TIENNENT. C'est le meilleur cas,
// et il commande l'architecture qui suit.
//
//   · LE TÉLÉPHONE EN PREMIER, parce qu'il sait faire une chose que le serveur
//     ne saura jamais : ÉCRIRE PENDANT QU'ON PARLE. Voir les mots apparaître est
//     ce qui apprend au commerçant qu'il est entendu — sans ça, il parle à un
//     bouton et il s'arrête au bout de trois mots pour vérifier.
//
//   · LE SERVEUR EN FILET, parce que le moteur du navigateur se coupe. C'est son
//     défaut connu : un silence de deux secondes — celui de quelqu'un qui
//     réfléchit — et il rend la main. On enregistre donc TOUJOURS en parallèle,
//     et si le téléphone ne rend rien d'exploitable, le serveur reprend la
//     phrase entière, celle qu'on a captée en entier.
//
// ON N'EN CHOISIT PAS UN : on garde les deux, et le filet ne coûte que lorsqu'il
// sert. L'enregistrement n'est envoyé au serveur QUE si le téléphone a échoué.
//
// ─── ET RIEN DE TOUT ÇA NE DISPENSE DE LA VALIDATION ──────────────────────
//
// Aucune transcription n'est fiable à cent pour cent dans un commerce en
// activité — le four, la machine à café, trois clients. « Quatorze euros »
// entendu « quatre euros » et publié à toute une ville coûte un commerçant.
// La carte de validation n'est donc pas un confort : c'est la condition qui
// autorise le vocal à exister.

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
 * UNE ÉCOUTE. On l'ouvre, elle écrit en direct, on l'arrête, elle rend le texte.
 *
 * `enDirect` reçoit les mots au fur et à mesure — c'est ce qui va à l'écran
 * pendant qu'il parle. La promesse de la fonction, elle, n'est tenue qu'à
 * l'arrêt, et elle est tenue MÊME si tout échoue : elle rend alors un texte vide
 * et une raison, jamais une exception. Un micro qui lève une erreur au milieu
 * d'une démonstration ferme l'écran.
 */
export function ouvrirEcoute(enDirect: (t: string) => void): {
  arreter: () => Promise<Ecoute>;
  annuler: () => void;
} {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let rec: any = null;
  let flux: MediaStream | null = null;
  let enr: MediaRecorder | null = null;
  const bouts: Blob[] = [];
  let fini = "";
  let vivant = "";
  let coupe = false;

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
      // existe. La signaler ferait paniquer pour un cas qui se rattrape seul.
      r.start();
      rec = r;
    } catch {
      rec = null;
    }
  }

  // L'ENREGISTREMENT TOURNE TOUJOURS, même quand la dictée marche. On ne peut
  // pas savoir qu'elle a échoué avant qu'elle échoue, et on ne va pas demander
  // au commerçant de répéter sa phrase.
  const pretFlux = (async () => {
    try {
      const f = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (coupe) {
        f.getTracks().forEach((t) => t.stop());
        return;
      }
      flux = f;
      const type = conteneur();
      const m = type ? new MediaRecorder(f, { mimeType: type }) : new MediaRecorder(f);
      m.ondataavailable = (ev) => {
        if (ev.data && ev.data.size) bouts.push(ev.data);
      };
      m.start();
      enr = m;
    } catch {
      /* Micro refusé : la dictée peut encore marcher, et sinon on le dira. */
    }
  })();

  const fermer = () => {
    try {
      rec?.stop();
    } catch {
      /* déjà arrêté */
    }
    rec = null;
    flux?.getTracks().forEach((t) => t.stop());
    flux = null;
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
      await pretFlux;
      // L'ENREGISTREMENT S'ARRÊTE EN PREMIER, la dictée après : le moteur du
      // navigateur rend souvent son dernier morceau au moment où on le coupe, et
      // le couper trop tôt perdrait la fin de la phrase.
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
      await new Promise((r) => setTimeout(r, 300));
      const duTelephone = (fini || vivant).trim();
      fermer();

      // ── CE QUE LE TÉLÉPHONE A DONNÉ SUFFIT-IL ? ──
      // Le seuil est bas et il est en MOTS, pas en signes : « oui » est une
      // réponse complète, « ma » est un début de phrase coupée. Sous deux mots,
      // on préfère le filet — il ne coûte qu'une seconde et il a la phrase
      // entière.
      if (duTelephone.split(/\s+/).filter(Boolean).length >= 2) {
        return { texte: duTelephone, par: "telephone" };
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
