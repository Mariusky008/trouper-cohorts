"use client";

// L'ESSAI VOCAL — la mesure qu'on fait AVANT de construire l'assistante.
//
// ─── CE QU'IL FAUT DÉCIDER, ET POURQUOI ON NE PEUT PAS LE DÉCIDER ICI ──────
//
// L'espace commerçant tient sur une phrase : « il raconte sa journée,
// l'assistante s'occupe du reste ». Donc tout tient sur le micro. Et il y a
// deux façons de transformer sa voix en texte, avec des défauts opposés :
//
//   A · LE TÉLÉPHONE SEUL — gratuit, instantané, rien n'est envoyé. Mais sur
//       iPhone le moteur du navigateur est capricieux : il se coupe, il
//       supporte mal les silences, il n'existe pas partout. Ce qui lâche
//       pendant une démarche lâche DEVANT LE PROSPECT.
//
//   B · LE SERVEUR — fiable, identique partout, meilleur sur les accents et le
//       bruit. Une à deux secondes d'attente, et ça se paie à la minute.
//
// AUCUNE DOCUMENTATION NE RÉPOND À ÇA. La réponse est dans une boulangerie à
// sept heures du matin, avec le four, la machine à café et trois clients. Cette
// page fait donc parler les deux EN MÊME TEMPS, sur la même phrase, et affiche
// ce que chacun a compris. Cinq minutes sur un vrai téléphone valent mieux que
// deux jours de discussion.
//
// ─── ET CE QU'ELLE MESURE VRAIMENT, C'EST LE CHIFFRE ───────────────────────
//
// « Magré » au lieu de « magret » fait sourire. « 4 € » au lieu de « 14 € »
// publie un prix faux à toute une ville. La page compte donc les nombres
// retrouvés, pas les mots — voir `chiffres-dits.ts`. C'est aussi ce qui décide
// si la carte de validation est un confort ou une condition d'existence.
import { useCallback, useEffect, useRef, useState } from "react";
import { chiffresDits, chiffresRetrouves } from "@/lib/direct/chiffres-dits";

/**
 * LA PHRASE DE RÉFÉRENCE — et elle n'est pas choisie au hasard.
 *
 * Elle contient tout ce qui casse : un mot de métier (« magret »), un prix à
 * deux syllabes qui se confond avec un autre (« quatorze » / « quatre »), une
 * quantité, et une liaison. C'est aussi, mot pour mot, ce qu'un restaurateur
 * dirait à son assistante le matin — on ne teste pas une phrase de laboratoire.
 */
const PHRASE =
  "Aujourd'hui c'est magret de canard avec des frites maison, " +
  "à quatorze euros, j'en ai préparé trente.";
const ATTENDUS = [14, 30];

/** Ce qui est demandé au micro, et rien de plus. */
const CONTRAINTES: MediaStreamConstraints = { audio: true };

/**
 * LE CONTENEUR QUE L'APPAREIL SAIT ÉCRIRE.
 *
 * iPhone produit du `audio/mp4`, Chrome du `audio/webm`. Demander le mauvais ne
 * lève pas toujours d'erreur : on obtient un fichier vide, c'est-à-dire un test
 * qui échoue pour une raison qui n'a rien à voir avec la voix. On demande donc
 * le premier que l'appareil déclare savoir faire, et on laisse le navigateur
 * choisir en dernier recours.
 */
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
      /* Un navigateur ancien n'a pas la fonction : on laisse le défaut. */
    }
  }
  return "";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function moteurDuTelephone(): any {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

type Resultat = {
  texte: string;
  ms: number;
  erreur?: string;
  modele?: string;
};

type Essai = {
  id: string;
  quand: string;
  /** Le chemin A, celui du téléphone. */
  tel: Resultat | null;
  /** Le chemin B, celui du serveur. */
  serveur: Resultat | null;
  /** Le poids de l'enregistrement, pour savoir ce que ça coûterait. */
  octets: number;
};

const CLE = "clikme.essai-voix.v1";

/** Deux chiffres attendus, combien sont revenus. */
function score(r: Resultat | null): string {
  if (!r || r.erreur || !r.texte) return "—";
  const ok = chiffresRetrouves(r.texte, ATTENDUS);
  return `${ok.length}/${ATTENDUS.length}`;
}

export function EssaiVoix() {
  const [pret, setPret] = useState(false);
  const [aDispo, setADispo] = useState(false);
  const [format, setFormat] = useState("");
  const [etat, setEtat] = useState<"repos" | "ecoute" | "envoi">("repos");
  const [vivant, setVivant] = useState("");
  const [essais, setEssais] = useState<Essai[]>([]);
  const [echo, setEcho] = useState("");
  // « UN SEUL À LA FOIS » : les deux moteurs se partagent le micro, et sur
  // certains iPhone l'un empêche l'autre de capter. Si les deux reviennent
  // vides ensemble alors qu'ils marchent séparément, c'est ça — et il faut
  // pouvoir le constater sans deviner.
  const [separe, setSepare] = useState<"" | "tel" | "serveur">("");

  const flux = useRef<MediaStream | null>(null);
  const enr = useRef<MediaRecorder | null>(null);
  const bouts = useRef<Blob[]>([]);
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const rec = useRef<any>(null);
  const tel = useRef<Resultat | null>(null);
  const debut = useRef(0);

  useEffect(() => {
    setPret(true);
    setADispo(!!moteurDuTelephone());
    setFormat(conteneur());
    try {
      const brut = localStorage.getItem(CLE);
      const l = brut ? JSON.parse(brut) : null;
      if (Array.isArray(l)) setEssais(l as Essai[]);
    } catch {
      /* Un historique illisible ne doit pas empêcher un nouvel essai. */
    }
  }, []);

  const garder = useCallback((e: Essai) => {
    setEssais((v) => {
      const l = [e, ...v].slice(0, 30);
      try {
        localStorage.setItem(CLE, JSON.stringify(l));
      } catch {
        /* Quota plein : on garde à l'écran, on ne casse rien. */
      }
      return l;
    });
  }, []);

  /** Tout couper, quoi qu'il arrive — un micro resté ouvert est une lampe rouge
   *  allumée sur le téléphone de quelqu'un. */
  const couper = useCallback(() => {
    try {
      rec.current?.stop();
    } catch {
      /* déjà arrêté */
    }
    rec.current = null;
    try {
      if (enr.current && enr.current.state !== "inactive") enr.current.stop();
    } catch {
      /* déjà arrêté */
    }
    flux.current?.getTracks().forEach((t) => t.stop());
    flux.current = null;
  }, []);

  useEffect(() => couper, [couper]);

  const demarrer = useCallback(async () => {
    setEcho("");
    setVivant("");
    tel.current = null;
    bouts.current = [];
    debut.current = Date.now();

    // ── LE CHEMIN A · LE TÉLÉPHONE ──
    const Moteur = moteurDuTelephone();
    if (Moteur && separe !== "serveur") {
      try {
        const r = new Moteur();
        r.lang = "fr-FR";
        // CONTINU ET INTERMÉDIAIRE : un commerçant qui réfléchit deux secondes
        // ne doit pas voir sa phrase coupée en deux. C'est précisément le
        // réglage qui tient mal sur iPhone, et c'est ce qu'on mesure.
        r.continuous = true;
        r.interimResults = true;
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        r.onresult = (ev: any) => {
          let fini = "";
          let cours = "";
          for (let i = 0; i < ev.results.length; i++) {
            const t = ev.results[i][0]?.transcript ?? "";
            if (ev.results[i].isFinal) fini += t;
            else cours += t;
          }
          setVivant((fini + cours).trim());
          if (fini.trim()) {
            tel.current = { texte: fini.trim(), ms: Date.now() - debut.current };
          }
        };
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        r.onerror = (ev: any) => {
          tel.current = {
            texte: "",
            ms: Date.now() - debut.current,
            erreur: String(ev?.error || "erreur du moteur"),
          };
        };
        r.start();
        rec.current = r;
      } catch (e) {
        tel.current = {
          texte: "",
          ms: 0,
          erreur: `refus au démarrage : ${(e as Error)?.message || "inconnu"}`,
        };
      }
    }

    // ── LE CHEMIN B · L'ENREGISTREMENT ──
    if (separe !== "tel") {
      try {
        const f = await navigator.mediaDevices.getUserMedia(CONTRAINTES);
        flux.current = f;
        const type = conteneur();
        const m = type ? new MediaRecorder(f, { mimeType: type }) : new MediaRecorder(f);
        m.ondataavailable = (ev) => {
          if (ev.data && ev.data.size) bouts.current.push(ev.data);
        };
        m.start();
        enr.current = m;
      } catch (e) {
        setEcho(`Micro refusé : ${(e as Error)?.message || "autorisation manquante"}.`);
        couper();
        setEtat("repos");
        return;
      }
    }

    setEtat("ecoute");
  }, [couper, separe]);

  const arreter = useCallback(async () => {
    setEtat("envoi");
    const attendu = separe !== "tel";
    let audio = "";
    let octets = 0;

    if (attendu && enr.current) {
      const m = enr.current;
      await new Promise<void>((r) => {
        m.onstop = () => r();
        try {
          m.stop();
        } catch {
          r();
        }
      });
      const b = new Blob(bouts.current, { type: m.mimeType || "audio/webm" });
      octets = b.size;
      audio = await new Promise<string>((r) => {
        const l = new FileReader();
        l.onload = () => r(String(l.result));
        l.onerror = () => r("");
        l.readAsDataURL(b);
      });
    }

    // LE MOTEUR DU TÉLÉPHONE S'ARRÊTE APRÈS, pas avant : il rend souvent son
    // dernier morceau au moment où on le coupe, et le couper trop tôt perdrait
    // la fin de la phrase — un défaut qu'on prendrait pour une erreur du moteur.
    try {
      rec.current?.stop();
    } catch {
      /* déjà arrêté */
    }
    await new Promise((r) => setTimeout(r, 350));
    rec.current = null;
    flux.current?.getTracks().forEach((t) => t.stop());
    flux.current = null;

    // Ce que le moteur a dit en direct sans jamais le marquer « définitif ».
    const vu = vivant.trim();
    const resTel: Resultat | null =
      separe === "serveur"
        ? null
        : (tel.current ??
          (vu
            ? { texte: vu, ms: Date.now() - debut.current }
            : { texte: "", ms: 0, erreur: "rien capté" }));

    let resServeur: Resultat | null = null;
    if (attendu) {
      if (!audio || octets < 1000) {
        resServeur = { texte: "", ms: 0, erreur: "enregistrement vide" };
      } else {
        const t0 = Date.now();
        try {
          const rep = await fetch("/api/direct/transcrire", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ audio }),
          });
          const d = await rep.json();
          resServeur = rep.ok
            ? { texte: String(d.texte || ""), ms: Date.now() - t0, modele: d.modele }
            : { texte: "", ms: Date.now() - t0, erreur: String(d.erreur || `HTTP ${rep.status}`) };
        } catch (e) {
          resServeur = {
            texte: "",
            ms: Date.now() - t0,
            erreur: (e as Error)?.message || "réseau",
          };
        }
      }
    }

    garder({
      id: `e-${Date.now().toString(36)}`,
      quand: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      tel: resTel,
      serveur: resServeur,
      octets,
    });
    setVivant("");
    setEtat("repos");
  }, [garder, separe, vivant]);

  if (!pret) return null;

  const dernier = essais[0];

  return (
    <div className="ev">
      <header className="ev-h">
        <div>
          <h1>Essai vocal</h1>
          <p>
            Avant de construire l&apos;assistante, on mesure la seule chose dont
            elle dépend&nbsp;: <b>est-ce que le micro tient</b>. Les deux chemins
            écoutent la même phrase en même temps et disent ce qu&apos;ils ont
            compris.
          </p>
        </div>
        <a className="ev-retour" href="/autour-de-moi">
          Le direct
        </a>
      </header>

      {/* ─── CE QUE CE TÉLÉPHONE-CI SAIT FAIRE ───
          En premier, parce que c'est déjà une réponse : si le moteur du
          navigateur n'existe pas sur son iPhone, le chemin A est mort avant
          d'avoir parlé, et ça se sait en ouvrant la page. */}
      <section className="ev-bloc">
        <h2>Ce téléphone</h2>
        <ul className="ev-dispo">
          <li className={aDispo ? "oui" : "non"}>
            <b>Dictée du navigateur</b>
            <em>{aDispo ? "disponible" : "absente sur cet appareil"}</em>
          </li>
          <li className={format || typeof MediaRecorder !== "undefined" ? "oui" : "non"}>
            <b>Enregistrement</b>
            <em>{format || "format par défaut du navigateur"}</em>
          </li>
        </ul>
      </section>

      <section className="ev-bloc">
        <h2>La phrase à dire</h2>
        <p className="ev-phrase">{PHRASE}</p>
        <p className="ev-n">
          Dites-la normalement, comme vous la diriez à quelqu&apos;un. On ne
          vérifie pas les mots&nbsp;: on vérifie que <b>14</b> et <b>30</b>{" "}
          survivent — un prix faux publié à toute une ville coûte un commerçant,
          un mot mal orthographié ne coûte rien.
        </p>
      </section>

      <section className="ev-bloc ev-act">
        <button
          type="button"
          className={`ev-micro${etat === "ecoute" ? " on" : ""}`}
          disabled={etat === "envoi"}
          onClick={() => (etat === "ecoute" ? arreter() : demarrer())}
        >
          {etat === "ecoute" ? "■ J’ai fini" : etat === "envoi" ? "…" : "🎙 Parler"}
        </button>
        {etat === "ecoute" && (
          <p className="ev-vivant">{vivant || "J’écoute…"}</p>
        )}
        {etat === "envoi" && <p className="ev-n">Transcription en cours…</p>}
        {echo && <p className="ev-echo">{echo}</p>}

        {/* LE RÉGLAGE DE SECOURS. Les deux moteurs se partagent un seul micro ;
            si l'un empêche l'autre de capter, on doit pouvoir le constater au
            lieu de conclure que le vocal ne marche pas. */}
        <div className="ev-sep">
          {([
            ["", "Les deux en même temps"],
            ["tel", "Téléphone seul"],
            ["serveur", "Serveur seul"],
          ] as const).map(([v, l]) => (
            <button
              key={v || "deux"}
              type="button"
              className={separe === v ? "on" : ""}
              disabled={etat !== "repos"}
              onClick={() => setSepare(v)}
            >
              {l}
            </button>
          ))}
        </div>
      </section>

      {dernier && (
        <section className="ev-bloc">
          <h2>Le dernier essai</h2>
          <div className="ev-duo">
            {([
              ["A · Le téléphone", dernier.tel, "instantané, gratuit"],
              ["B · Le serveur", dernier.serveur, "fiable, payant"],
            ] as const).map(([titre, r, note]) => (
              <div key={titre} className={`ev-c${r?.erreur ? " ko" : r?.texte ? " ok" : ""}`}>
                <h3>
                  {titre}
                  <i>{note}</i>
                </h3>
                {r ? (
                  r.erreur ? (
                    <p className="ev-ko">{r.erreur}</p>
                  ) : (
                    <>
                      <p className="ev-t">{r.texte || "(rien)"}</p>
                      <p className="ev-m">
                        <b>{score(r)}</b> chiffres retrouvés
                        {" · "}
                        {chiffresDits(r.texte).join(", ") || "aucun"}
                        {" · "}
                        {(r.ms / 1000).toFixed(1)} s
                        {r.modele ? ` · ${r.modele}` : ""}
                      </p>
                    </>
                  )
                ) : (
                  <p className="ev-n">non testé</p>
                )}
              </div>
            ))}
          </div>
          {dernier.octets > 0 && (
            <p className="ev-n">
              Enregistrement&nbsp;: {(dernier.octets / 1024).toFixed(0)} Ko.
            </p>
          )}
        </section>
      )}

      {essais.length > 1 && (
        <section className="ev-bloc">
          <h2>Les essais précédents</h2>
          {/* UN SEUL ESSAI NE DÉCIDE DE RIEN. Ce qui décide, c'est dix essais
              dans un endroit bruyant : un moteur qui réussit huit fois sur dix
              n'est pas le même produit qu'un moteur qui réussit dix fois. */}
          <table className="ev-tab">
            <thead>
              <tr>
                <th>h</th>
                <th>Téléphone</th>
                <th>Serveur</th>
              </tr>
            </thead>
            <tbody>
              {essais.slice(1).map((e) => (
                <tr key={e.id}>
                  <td>{e.quand}</td>
                  <td className={e.tel?.erreur ? "ko" : ""}>
                    {e.tel ? (e.tel.erreur ? "✗" : score(e.tel)) : "—"}
                  </td>
                  <td className={e.serveur?.erreur ? "ko" : ""}>
                    {e.serveur ? (e.serveur.erreur ? "✗" : score(e.serveur)) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            className="ev-vider"
            onClick={() => {
              setEssais([]);
              try {
                localStorage.removeItem(CLE);
              } catch {
                /* rien à faire */
              }
            }}
          >
            Effacer les essais
          </button>
        </section>
      )}

      <p className="ev-rappel">
        <b>Rien n&apos;est publié.</b> L&apos;enregistrement part au service de
        transcription puis il est oublié&nbsp;; les résultats restent sur cet
        appareil. Cette page est un instrument de mesure, pas une fonction du
        produit — elle sert une fois, à décider.
      </p>
    </div>
  );
}
