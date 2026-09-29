"use client";

/**
 * 👻 LE DOUBLE DU CHEF — on appuie sur le fantôme, on parle au restaurant.
 *
 * ═══ CE QUE L'ÉCRAN FAIT, EN DEUX TEMPS ════════════════════════════════════
 *
 * « Le fantôme deviendra un endroit où l'on pourrait discuter avec le chef du
 * restaurant. »
 *
 *   · À L'ARRIVÉE, le spectacle : le double derrière son comptoir, qui dit
 *     bonjour avec une voix, trois questions à toucher et un grand micro.
 *   · DÈS LE PREMIER ÉCHANGE, une messagerie : l'en-tête se replie en une
 *     bande, le fantôme passe en miniature — et continue de bouger —, et la
 *     conversation prend toute la place. Un écran qui garderait le grand
 *     fantôme n'aurait plus de place pour le troisième message.
 *
 * ═══ CE QUI VIENT D'OÙ ═════════════════════════════════════════════════════
 *
 * Les réponses viennent de `/api/direct/double`, qui ne connaît que la fiche
 * du commerce. Les cartes posées dans la conversation — le plat, la
 * réservation, les horaires — sont lues ICI dans les mêmes données : le
 * modèle dit laquelle montrer, jamais ce qu'elle contient.
 *
 * LA VOIX EST CELLE DU TÉLÉPHONE pour l'instant. La voix reproduite du
 * commerçant viendra avec son accord et son enregistrement ; le badge le dit
 * déjà, et c'est le seul changement qu'il faudra faire ici.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MotMarque } from "@/components/direct/mot-marque";
import type { CarteAutour } from "@/lib/direct/apercu-habitant";
import {
  accueilDuDouble,
  ficheDuDouble,
  repondreSansIA,
  suggestionsDeDepart,
  type CarteDouble,
  type ReponseDouble,
} from "@/lib/direct/double-chef";
import { onSpeakingChange, speak, speechSupported, stopSpeaking, unlockAudio } from "@/lib/site-internet/speech";

const D = "/direct/double/";
const POSES = {
  accueil: `${D}accueil.webp`,
  content: `${D}content.webp`,
  ecoute: `${D}ecoute.webp`,
  reflechit: `${D}reflechit.webp`,
};
/** Les trois bouches, jouées l'une après l'autre quand il parle. */
const BOUCHES = [`${D}parle-1.webp`, `${D}parle-3.webp`, `${D}parle-2.webp`, `${D}parle-3.webp`];

type Bulle =
  | { id: number; de: "double" | "client"; texte: string; heure: string; provisoire?: boolean }
  | { id: number; de: "carte"; carte: CarteDouble; heure: string };

/** Une bulle avant qu'on lui donne son numéro et son heure — pour chaque sorte. */
type SansHeure<T> = T extends unknown ? Omit<T, "id" | "heure"> : never;

/** Une espace insécable avant « ? ! : », pour qu'ils ne partent jamais seuls à la ligne. */
function fr(t: string): string {
  return t.replace(/ ([?!:;])/g, "\u00a0$1");
}

/** « 14:21 » — l'heure d'un message, comme dans toutes les messageries. */
function maintenant(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Les sept prochains jours, écrits comme on les dit. */
function jours(): { cle: string; mot: string }[] {
  const l: { cle: string; mot: string }[] = [];
  const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  for (let k = 0; k < 7; k++) {
    const d = new Date();
    d.setDate(d.getDate() + k);
    const mot = k === 0 ? "Aujourd’hui" : k === 1 ? "Demain" : `${d.getDate()} ${mois[d.getMonth()]}`;
    l.push({ cle: String(k), mot });
  }
  return l;
}
const HEURES = ["12 h", "12 h 30", "13 h", "13 h 30", "19 h 30", "20 h", "20 h 30", "21 h"];

/**
 * CE QUE LA PHRASE DIT DÉJÀ, POUR PRÉ-REMPLIR LA RÉSERVATION.
 *
 * « Je voudrais venir à deux demain midi » : trois réponses sont dans la
 * phrase, et les redemander dans un formulaire donne l'impression de ne pas
 * avoir été écouté.
 */
function preRemplir(phrase: string): { jour: string; heure: string; personnes: number } {
  const q = phrase.toLowerCase();
  const nombres: Record<string, number> = { un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8 };
  let personnes = 2;
  const chiffre = /(\d+)\s*(pers|couverts|$|\b)/.exec(q);
  if (chiffre) personnes = Math.min(12, Math.max(1, Number(chiffre[1])));
  for (const [mot, n] of Object.entries(nombres)) if (new RegExp(`\\b(à|a|on est|nous sommes) ${mot}\\b`).test(q)) personnes = n;
  const jour = /demain/.test(q) ? "1" : "0";
  const heure = /soir|dîner|diner/.test(q) ? "20 h" : /midi|déjeuner|dejeuner/.test(q) ? "12 h 30" : new Date().getHours() >= 15 ? "20 h" : "12 h 30";
  return { jour, heure, personnes };
}

/** La reconnaissance de la parole, là où le navigateur la connaît. */
type Reco = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
function nouvelleReco(): Reco | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Reco; webkitSpeechRecognition?: new () => Reco };
  const C = w.SpeechRecognition || w.webkitSpeechRecognition;
  return C ? new C() : null;
}

export function DoubleChef({
  carte,
  prenomClient,
  onFermer,
  onDecouvrir,
}: {
  carte: CarteAutour;
  prenomClient?: string;
  onFermer: () => void;
  /** Ouvre le parcours du plat — le même que « Découvrir ce plat » sur l'annonce. */
  onDecouvrir: () => void;
}) {
  const fiche = useMemo(() => ficheDuDouble(carte), [carte]);
  const idSuivant = useRef(1);
  const [bulles, setBulles] = useState<Bulle[]>(() => [
    { id: 0, de: "double", texte: accueilDuDouble(prenomClient), heure: maintenant() },
  ]);
  const [suggestions, setSuggestions] = useState<string[]>(suggestionsDeDepart);
  /** « arrivee » tant que personne n'a rien dit ; « conversation » ensuite. */
  const [phase, setPhase] = useState<"arrivee" | "conversation">("arrivee");
  const [saisie, setSaisie] = useState("");
  const [clavier, setClavier] = useState(false);
  const [son, setSon] = useState(true);
  const [parle, setParle] = useState(false);
  const [ecoute, setEcoute] = useState(false);
  const [reflechit, setReflechit] = useState(false);
  const [content, setContent] = useState(false);
  const [bouche, setBouche] = useState(0);
  const [menu, setMenu] = useState(false);
  const [resa, setResa] = useState(() => preRemplir(""));
  const [resaFaite, setResaFaite] = useState(false);
  const fil = useRef<HTMLDivElement | null>(null);
  const reco = useRef<Reco | null>(null);
  const champ = useRef<HTMLInputElement | null>(null);
  const joursListe = useMemo(jours, []);
  const lui = fiche.prenomConnu ? fiche.prenom : "le chef";

  /* ═══ IL DIT BONJOUR, AVEC SA VOIX, DÈS L'ARRIVÉE ═════════════════════
     L'appui sur le fantôme qui a ouvert cet écran est un geste de la
     personne : le téléphone autorise donc le son. C'est ce premier « Salut
     Marius ! » entendu qui fait l'effet — pas le texte. */
  const dire = useCallback(
    (texte: string) => {
      if (!son) return;
      if (speechSupported()) {
        speak(texte);
      } else {
        /* SANS VOIX SUR CE TÉLÉPHONE, LA BOUCHE BOUGE QUAND MÊME le temps
           qu'on lise : un double muet et immobile ressemble à une panne. */
        setParle(true);
        window.setTimeout(() => setParle(false), Math.min(6000, 600 + texte.length * 55));
      }
    },
    [son],
  );

  useEffect(() => {
    const off = onSpeakingChange(setParle);
    unlockAudio();
    const t = window.setTimeout(() => dire(accueilDuDouble(prenomClient)), 450);
    return () => {
      off();
      window.clearTimeout(t);
      stopSpeaking();
      reco.current?.stop();
    };
    // Une seule fois, à l'ouverture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* LA BOUCHE BOUGE TANT QU'IL PARLE : quatre dessins en boucle, à peu près
     au rythme d'une syllabe. */
  useEffect(() => {
    if (!parle) return undefined;
    const b = window.setInterval(() => setBouche((k) => (k + 1) % BOUCHES.length), 150);
    return () => window.clearInterval(b);
  }, [parle]);

  /* TOUTES LES POSES SONT CHARGÉES D'AVANCE : une bouche qui arrive après
     la syllabe, c'est un fantôme qui clignote. */
  useEffect(() => {
    for (const src of [...Object.values(POSES), ...BOUCHES]) {
      const i = new Image();
      i.src = src;
    }
  }, []);

  /* LE FIL DESCEND TOUT SEUL au dernier message. */
  useEffect(() => {
    const f = fil.current;
    if (f) f.scrollTo({ top: f.scrollHeight, behavior: "smooth" });
  }, [bulles, reflechit]);

  const pose = parle
    ? BOUCHES[bouche]
    : content
      ? POSES.content
      : ecoute
        ? POSES.ecoute
        : reflechit
          ? POSES.reflechit
          : POSES.accueil;
  const etat = parle ? "Il te parle…" : ecoute ? "Il t’écoute…" : reflechit ? "Il réfléchit…" : "En ligne";

  const ajouter = (b: SansHeure<Bulle>) =>
    setBulles((l) => [...l, { ...b, id: idSuivant.current++, heure: maintenant() } as Bulle]);

  /** Envoie une question, et fait répondre le double. */
  const envoyer = async (texte: string) => {
    const t = texte.trim();
    if (!t || reflechit) return;
    stopSpeaking();
    setPhase("conversation");
    setSaisie("");
    setMenu(false);
    const historique = [
      ...bulles.filter((b): b is Extract<Bulle, { texte: string }> => b.de !== "carte" && !b.provisoire),
      { de: "client" as const, texte: t },
    ].map((b) => ({ de: b.de === "client" ? "client" : "double", texte: b.texte }));
    ajouter({ de: "client", texte: t });
    setReflechit(true);
    let r: ReponseDouble;
    try {
      const rep = await fetch("/api/direct/double", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: carte.id, messages: historique, prenom: prenomClient ?? "" }),
      });
      r = rep.ok ? ((await rep.json()) as ReponseDouble) : repondreSansIA(t, fiche);
    } catch {
      r = repondreSansIA(t, fiche);
    }
    setReflechit(false);
    ajouter({ de: "double", texte: r.texte });
    if (r.carte) {
      if (r.carte === "reservation") {
        setResa(preRemplir(t));
        setResaFaite(false);
      }
      ajouter({ de: "carte", carte: r.carte });
    }
    if (r.suggestions?.length) setSuggestions(r.suggestions);
    dire(r.texte);
  };

  /* ═══ LE MICRO : APPUYER, PARLER, RELÂCHER ═══════════════════════════════
     Les mots s'écrivent en direct dans le champ pendant qu'on parle — c'est
     la preuve qu'on est écouté. Sans reconnaissance vocale sur ce téléphone,
     le micro ouvre le clavier : on n'affiche jamais un bouton qui ne fait
     rien. */
  const ecouter = () => {
    if (ecoute) {
      reco.current?.stop();
      return;
    }
    const r = nouvelleReco();
    if (!r) {
      setClavier(true);
      window.setTimeout(() => champ.current?.focus(), 30);
      return;
    }
    stopSpeaking();
    reco.current = r;
    r.lang = "fr-FR";
    r.interimResults = true;
    r.continuous = false;
    let dernier = "";
    r.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      dernier = t;
      setSaisie(t);
    };
    r.onend = () => {
      setEcoute(false);
      reco.current = null;
      if (dernier.trim()) void envoyer(dernier);
    };
    r.onerror = () => {
      setEcoute(false);
      reco.current = null;
    };
    setEcoute(true);
    setClavier(true);
    try {
      r.start();
    } catch {
      setEcoute(false);
    }
  };

  const confirmer = () => {
    const jour = joursListe.find((j) => j.cle === resa.jour)?.mot.toLowerCase() ?? "aujourd’hui";
    setResaFaite(true);
    ajouter({
      de: "client",
      texte: `Une table pour ${resa.personnes}, ${jour} à ${resa.heure}.`,
    });
    const texte = `C’est noté ! Je transmets ta demande à ${lui}. Tu auras la confirmation ici même.`;
    window.setTimeout(() => {
      ajouter({ de: "double", texte });
      setContent(true);
      window.setTimeout(() => setContent(false), 2600);
      setSuggestions(["Le plat du jour ?", "C'est où ?"]);
      dire(texte);
    }, 500);
  };

  const plat = fiche.plat;

  const carteHtml = (c: CarteDouble) => {
    if (c === "plat" && plat)
      return (
        <div className="dc-plat">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={plat.photo} alt="" />
          <div>
            <b>{plat.nom}</b>
            <span>{plat.detail.split("·")[0].trim()} · {plat.prix}</span>
            <div className="dc-plat-b">
              <button type="button" className="plein" onClick={onDecouvrir}>
                Découvrir <i aria-hidden="true">→</i>
              </button>
              <button type="button" onClick={() => void envoyer("Je voudrais réserver une table")}>
                Réserver
              </button>
            </div>
          </div>
        </div>
      );
    if (c === "reservation")
      return (
        <div className={resaFaite ? "dc-resa faite" : "dc-resa"}>
          <div className="dc-resa-t">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3.2" y="5" width="17.6" height="16" rx="3" />
              <path d="M3.2 10h17.6M8 2.8v4.4M16 2.8v4.4" />
            </svg>
            <span>
              <b>Réservation</b>
              <em>{fiche.nom}</em>
            </span>
          </div>
          <label>
            <span>Date</span>
            <select value={resa.jour} disabled={resaFaite} onChange={(e) => setResa({ ...resa, jour: e.target.value })}>
              {joursListe.map((j) => (
                <option key={j.cle} value={j.cle}>
                  {j.mot}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Heure souhaitée</span>
            <select value={resa.heure} disabled={resaFaite} onChange={(e) => setResa({ ...resa, heure: e.target.value })}>
              {HEURES.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <div className="dc-resa-n">
            <span>Personnes</span>
            <div>
              <button type="button" disabled={resaFaite || resa.personnes <= 1} onClick={() => setResa({ ...resa, personnes: resa.personnes - 1 })} aria-label="Une personne de moins">
                −
              </button>
              <b>{resa.personnes}</b>
              <button type="button" disabled={resaFaite || resa.personnes >= 12} onClick={() => setResa({ ...resa, personnes: resa.personnes + 1 })} aria-label="Une personne de plus">
                +
              </button>
            </div>
          </div>
          <button type="button" className="dc-resa-ok" disabled={resaFaite} onClick={confirmer}>
            {resaFaite ? "Demande envoyée ✓" : "Confirmer"}
          </button>
          <small>Sous réserve de confirmation du restaurant</small>
        </div>
      );
    if (c === "horaires")
      return (
        <div className="dc-info">
          <b>{fiche.nom}</b>
          {fiche.ou && <span>📍 {fiche.ou} · {fiche.distance}</span>}
          {fiche.horaires && <span>🕐 {fiche.horaires}</span>}
        </div>
      );
    if (c === "carte")
      return (
        <div className="dc-info">
          <b>La carte</b>
          {fiche.carte.slice(0, 6).map((l) => (
            <span key={l.nom} className="dc-ligne">
              {l.nom}
              {l.prix && <s>{l.prix}</s>}
            </span>
          ))}
        </div>
      );
    return null;
  };

  const titre = fiche.prenomConnu ? (
    <>
      Parle avec le double de <em>{fiche.prenom}</em>
    </>
  ) : (
    <>
      Parle avec le double <em>du chef</em>
    </>
  );

  const boutonSon = (
    <button
      type="button"
      className="dc-rond"
      aria-label={son ? "Couper le son" : "Remettre le son"}
      onClick={() => {
        if (son) stopSpeaking();
        setSon(!son);
      }}
    >
      {son ? "🔊" : "🔇"}
    </button>
  );

  const barre = (
    <div className="dc-saisie">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void envoyer(saisie);
        }}
      >
        <span aria-hidden="true">⌨</span>
        <input
          ref={champ}
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder={`Écris à ${fiche.prenomConnu ? fiche.prenom : "son double"}…`}
          aria-label="Ton message"
        />
        {saisie.trim() && !ecoute ? (
          <button type="submit" className="dc-go" aria-label="Envoyer">
            ➤
          </button>
        ) : (
          <button type="button" className={ecoute ? "dc-go micro on" : "dc-go micro"} onClick={ecouter} aria-label={ecoute ? "Arrêter" : "Parler"}>
            <Micro />
          </button>
        )}
      </form>
    </div>
  );

  const pastilles = (
    <div className="dc-sugg">
      {suggestions.map((s) => (
        <button key={s} type="button" onClick={() => void envoyer(s)}>
          {fr(s)}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`dc ${phase}`}>
      <span className="dc-fond" aria-hidden="true" />

      {phase === "arrivee" ? (
        <div className="dc-arr">
          <div className="dc-barre">
            <button type="button" className="dc-rond" aria-label="Revenir à l’annonce" onClick={onFermer}>
              ‹
            </button>
            <MotMarque className="dc-logo" encre="#FFFFFF" />
            {boutonSon}
          </div>
          <h1 className="dc-t">{titre}</h1>
          <div className="dc-id">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {fiche.portrait && <img src={fiche.portrait} alt="" />}
            <div>
              <b>
                {fiche.prenomConnu ? fiche.prenom : "Le chef"} <span>· {fiche.nom}</span>
              </b>
              <em>🎙️ Double IA · il répond pour {fiche.prenomConnu ? fiche.prenom : "le restaurant"}</em>
            </div>
          </div>
          <div className="dc-scene">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="dc-fant" src={pose} alt={`Le double de ${lui}`} />
            <span className={parle ? "dc-etat on" : "dc-etat"} aria-live="polite">
              <i aria-hidden="true">
                {Array.from({ length: 9 }, (_, k) => (
                  <s key={k} style={{ animationDelay: `${k * 70}ms` }} />
                ))}
              </i>
              {etat}
            </span>
          </div>
          <div className="dc-bas">
            <div className="dc-l double">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="dc-av" src={POSES.accueil} alt="" />
              <p>{bulles[0].de !== "carte" ? fr(bulles[0].texte) : ""}</p>
            </div>
            {pastilles}
            {clavier ? (
              barre
            ) : (
              <div className="dc-micro">
                <button type="button" className={ecoute ? "on" : ""} onClick={ecouter} aria-label="Appuie et parle">
                  <Micro />
                </button>
                <b>{ecoute ? "Je t’écoute…" : "Appuie et parle"}</b>
                <button type="button" className="dc-ecris" onClick={() => {
                  setClavier(true);
                  window.setTimeout(() => champ.current?.focus(), 30);
                }}>
                  ou écris-lui
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="dc-conv">
          <div className="dc-bande">
            <button type="button" className="dc-rond" aria-label="Revenir à l’annonce" onClick={onFermer}>
              ‹
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="dc-mini" src={pose} alt="" />
            <div className="dc-qui">
              <b>
                {fiche.prenomConnu ? fiche.prenom : "Le chef"} <span>· {fiche.nom}</span>
              </b>
              <em>
                <i aria-hidden="true">🎙️</i> Double IA · {etat.toLowerCase()}
              </em>
            </div>
            {boutonSon}
            <button type="button" className="dc-rond" aria-label="Plus" aria-expanded={menu} onClick={() => setMenu(!menu)}>
              ⋯
            </button>
            {menu && (
              <div className="dc-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => void envoyer("Je voudrais réserver une table")}>
                  📅 Réserver une table
                </button>
                {plat && (
                  <button type="button" role="menuitem" onClick={() => { setMenu(false); onDecouvrir(); }}>
                    🍽️ Découvrir le plat du jour
                  </button>
                )}
                <button type="button" role="menuitem" onClick={() => void envoyer("Tu peux me montrer la carte ?")}>
                  📖 Voir la carte
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    setSaisie(`Message pour ${lui} : `);
                    window.setTimeout(() => champ.current?.focus(), 30);
                  }}
                >
                  ✉️ Laisser un message à {lui}
                </button>
              </div>
            )}
          </div>
          <div className="dc-fil" ref={fil}>
            {bulles.map((b) =>
              b.de === "carte" ? (
                <div key={b.id} className="dc-l carte">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="dc-av" src={POSES.accueil} alt="" />
                  {carteHtml(b.carte)}
                </div>
              ) : (
                <div key={b.id} className={`dc-l ${b.de}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="dc-av" src={b.de === "double" ? POSES.accueil : "/clikme-fantome.png"} alt="" />
                  <p>
                    {fr(b.texte)}
                    <small>{b.heure}</small>
                  </p>
                  {b.de === "double" && (
                    <button type="button" className="dc-rejoue" aria-label="Réécouter" onClick={() => { stopSpeaking(); speak(b.texte); }}>
                      ▶
                    </button>
                  )}
                </div>
              ),
            )}
            {reflechit && (
              <div className="dc-l double">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="dc-av" src={POSES.accueil} alt="" />
                <p className="dc-points" aria-label="Il réfléchit">
                  <s /> <s /> <s />
                </p>
              </div>
            )}
          </div>
          {!saisie.trim() && pastilles}
          {barre}
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: FEUILLE }} />
    </div>
  );
}

function Micro() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8.6" y="2.6" width="6.8" height="12" rx="3.4" />
      <path d="M5.2 11.2a6.8 6.8 0 0 0 13.6 0M12 18v3.2M8.6 21.2h6.8" />
    </svg>
  );
}

/* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
   litteral de gabarit et un seul terminerait la chaine. */
const FEUILLE = `
.dc{position:absolute;inset:0;z-index:80;overflow:hidden;color:#fff;letter-spacing:normal;
  font-family:var(--font-clikme),"Poppins",system-ui,sans-serif;container-type:size;
  background:#140710;isolation:isolate;--dc-or:#F5A23A;--dc-rose:#FF2E9A;}
/* LE COMPTOIR EST LE MEME DANS LES DEUX TEMPS ; seul son voile fonce quand la
   conversation commence, pour que les bulles se lisent. */
/* LE COMPTOIR DESCEND A MI-ECRAN. Sur la photo il est a quarante et un pour
   cent de la hauteur : le fantome pose dessus aurait eu la tete dans le titre.
   Agrandie de vingt pour cent depuis le haut, la photo le met a quarante-neuf,
   la ou la maquette le dessine. */
.dc-fond{position:absolute;inset:0;z-index:0;transform:scale(1.2);transform-origin:50% 0;
  background:url("/direct/double/comptoir.jpg") center/cover no-repeat;}
.dc-fond::after{content:"";position:absolute;inset:-2px;transition:background .4s ease;
  background:linear-gradient(to bottom,rgba(20,6,16,.62),rgba(20,6,16,.18) 26%,rgba(20,6,16,.2) 46%,rgba(20,6,16,.82) 64%,rgba(20,6,16,.94));}
.dc.conversation .dc-fond::after{background:rgba(20,6,16,.72);}
.dc button{font:inherit;cursor:pointer;}
.dc-rond{flex:none;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;
  border:1px solid rgba(255,255,255,.28);background:rgba(20,8,18,.55);color:#fff;font-size:22px;line-height:1;
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}

/* ═══ L'ARRIVEE ═══ */
.dc-arr{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;
  padding:calc(12px + var(--ap-haut,0px)) 16px calc(14px + var(--ap-bas,0px));}
.dc-barre{display:flex;align-items:center;justify-content:space-between;}
.dc-logo{font-size:22px;font-weight:900;}
.dc-t{margin:8px 0 0;text-align:center;font-weight:800;line-height:1.08;letter-spacing:-.02em;
  font-size:clamp(22px,min(7.4cqw,3.6cqh),32px);text-shadow:0 3px 18px rgba(0,0,0,.6);}
.dc-t em{font-style:normal;color:var(--dc-or);}
.dc-id{display:flex;align-items:center;gap:12px;margin:10px auto 0;}
.dc-id>img{width:58px;height:58px;border-radius:50%;object-fit:cover;border:3px solid var(--dc-or);
  box-shadow:0 0 18px rgba(245,162,58,.5);}
.dc-id b{display:block;font-size:15px;font-weight:800;}
.dc-id b span,.dc-qui b span{font-weight:500;opacity:.85;}
.dc-id em{display:inline-block;margin-top:4px;font-style:normal;font-size:10.5px;font-weight:600;
  padding:4px 10px;border-radius:999px;border:1px solid var(--dc-rose);background:rgba(255,46,154,.12);}
/* LE FANTOME EST POSE SUR LE COMPTOIR DE LA PHOTO : sa base tombe sur le bois,
   a mi-hauteur de l'ecran, la ou le fond place le comptoir. */
/* LE FANTOME EST POSE SUR LE COMPTOIR : sa base tombe sur le bois, a
   quarante-neuf pour cent de la hauteur — voir le fond. Il est mesure sur
   l'ecran entier, pas sur l'espace qui reste : c'est le comptoir qui decide
   ou il se tient, pas le titre au-dessus. */
.dc-scene{flex:1 1 auto;min-height:0;}
.dc-fant{position:absolute;left:50%;transform:translateX(-50%);z-index:0;
  height:min(26cqh,62cqw);width:auto;top:calc(49.5cqh - min(26cqh,62cqw));
  filter:drop-shadow(0 0 26px rgba(255,120,220,.45));}
.dc-etat{position:absolute;right:16px;top:calc(49.5cqh - 15cqh);display:grid;justify-items:center;gap:4px;
  font-size:11.5px;font-weight:600;opacity:.9;z-index:1;}
.dc-etat i{display:flex;gap:2px;height:22px;align-items:center;}
.dc-etat s{display:block;width:3px;height:30%;border-radius:2px;background:var(--dc-rose);}
.dc-etat.on s{animation:dcOnde .6s ease-in-out infinite alternate;}
@keyframes dcOnde{from{height:25%}to{height:100%}}
.dc-bas{display:grid;gap:12px;padding-top:12px;position:relative;z-index:1;}
/* LES TROIS QUESTIONS DU DEBUT TIENNENT SUR UNE LIGNE, en trois colonnes
   egales : la troisieme coupee au bord ne se lit pas comme une question. */
.dc-arr .dc-sugg{display:grid;grid-template-columns:repeat(3,1fr);overflow:visible;}
.dc-arr .dc-sugg button{padding:6px 8px;line-height:1.2;min-width:0;}

/* ═══ LES BULLES ═══ */
.dc-l{display:flex;align-items:flex-end;gap:8px;max-width:100%;}
.dc-av{flex:none;width:36px;height:36px;border-radius:50%;object-fit:cover;object-position:50% 20%;
  background:#2A0F24;border:2px solid var(--dc-rose);}
.dc-l p{margin:0;padding:10px 14px 8px;border-radius:18px;font-size:15px;font-weight:600;line-height:1.3;
  background:rgba(58,14,44,.82);border:1px solid rgba(255,46,154,.55);max-width:78%;}
.dc-l p small{display:block;margin-top:2px;font-size:10px;font-weight:500;opacity:.6;text-align:right;}
.dc-l.client{flex-direction:row-reverse;}
.dc-l.client .dc-av{border-color:#4FD1C5;background:#0E3A3A;object-fit:contain;padding:3px;}
.dc-l.client p{background:linear-gradient(100deg,#FF2E9A,#E0399B);border-color:transparent;}
.dc-arr .dc-l p{font-size:clamp(15px,4.4cqw,18px);}
.dc-rejoue{flex:none;width:28px;height:28px;border-radius:50%;border:1px solid rgba(255,255,255,.35);
  background:rgba(20,8,18,.5);color:#fff;font-size:10px;margin-bottom:6px;}
.dc-points{display:flex;gap:5px;padding:14px 16px!important;}
.dc-points s{width:7px;height:7px;border-radius:50%;background:#fff;opacity:.4;animation:dcPoint 1s infinite;}
.dc-points s:nth-child(2){animation-delay:.15s;}
.dc-points s:nth-child(3){animation-delay:.3s;}
@keyframes dcPoint{50%{opacity:1;transform:translateY(-3px)}}

/* ═══ LES QUESTIONS A TOUCHER ═══ */
.dc-sugg{flex:none;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px 0;}
.dc-sugg::-webkit-scrollbar{display:none;}
.dc-sugg button{flex:none;min-height:40px;padding:0 14px;border-radius:14px;color:#fff;
  font-size:13px;font-weight:600;border:1.5px solid var(--dc-or);background:rgba(40,14,20,.7);}

/* ═══ LE GRAND MICRO, SEULEMENT A L'ARRIVEE ═══ */
.dc-micro{display:grid;justify-items:center;gap:6px;}
.dc-micro>button:first-child{width:84px;height:84px;border-radius:50%;border:0;color:#fff;
  background:radial-gradient(circle at 40% 35%,#FF5CB3,#FF1F8F 60%,#D0127A);
  box-shadow:0 0 0 8px rgba(255,46,154,.16),0 0 38px rgba(255,46,154,.75);
  animation:dcAppel 2.4s ease-in-out infinite;display:grid;place-items:center;}
.dc-micro>button:first-child.on{animation:dcEcoute .9s ease-in-out infinite;}
.dc-micro svg,.dc-go svg{width:44%;height:44%;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;}
.dc-micro svg rect,.dc-go svg rect{fill:#fff;stroke:none;}
.dc-micro b{font-size:17px;font-weight:800;}
.dc-ecris{border:0;background:none;color:rgba(255,255,255,.7);font-size:13px;text-decoration:underline;}
@keyframes dcAppel{50%{box-shadow:0 0 0 14px rgba(255,46,154,.1),0 0 50px rgba(255,46,154,.9)}}
@keyframes dcEcoute{50%{transform:scale(1.08)}}

/* ═══ LA CONVERSATION ═══ */
.dc-conv{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;
  padding:calc(10px + var(--ap-haut,0px)) 12px calc(12px + var(--ap-bas,0px));
  animation:dcEntre .4s ease both;}
@keyframes dcEntre{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.dc-bande{position:relative;display:flex;align-items:center;gap:8px;padding-bottom:10px;
  border-bottom:1px solid rgba(255,255,255,.1);}
.dc-mini{flex:none;width:48px;height:48px;border-radius:50%;object-fit:cover;object-position:50% 20%;
  border:2px solid var(--dc-or);background:#2A0F24;}
.dc-qui{flex:1;min-width:0;}
.dc-qui b{display:block;font-size:15px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dc-qui em{display:block;font-style:normal;font-size:11px;font-weight:600;color:rgba(255,255,255,.75);}
.dc-menu{position:absolute;right:0;top:48px;z-index:5;display:grid;min-width:230px;padding:6px;border-radius:16px;
  background:rgba(30,10,26,.96);border:1px solid rgba(255,255,255,.14);box-shadow:0 18px 40px rgba(0,0,0,.5);}
.dc-menu button{border:0;background:none;color:#fff;text-align:left;padding:11px 12px;border-radius:10px;font-size:14px;font-weight:600;}
.dc-menu button:hover{background:rgba(255,255,255,.08);}
.dc-fil{flex:1 1 auto;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding:14px 2px;
  scrollbar-width:none;}
.dc-fil::-webkit-scrollbar{display:none;}
.dc-conv .dc-sugg{margin-bottom:10px;}

/* ═══ LA BARRE DE SAISIE, UNE SEULE ═══ */
.dc-saisie{flex:none;}
.dc-saisie form{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 14px;border-radius:999px;
  background:rgba(40,14,34,.86);border:1px solid rgba(255,46,154,.45);}
.dc-saisie form>span{opacity:.7;font-size:16px;}
.dc-saisie input{flex:1;min-width:0;border:0;background:none;color:#fff;font:inherit;font-size:15px;outline:none;}
.dc-saisie input::placeholder{color:rgba(255,255,255,.55);}
.dc-go{flex:none;width:44px;height:44px;border-radius:50%;border:0;display:grid;place-items:center;color:#fff;
  font-size:17px;background:linear-gradient(135deg,#FF4DAA,#E0127F);}
.dc-go.micro.on{animation:dcEcoute .9s ease-in-out infinite;}

/* ═══ LES CARTES POSEES DANS LA CONVERSATION ═══ */
.dc-l.carte{align-items:flex-start;}
.dc-plat{display:flex;gap:10px;flex:1;min-width:0;padding:10px;border-radius:18px;
  background:rgba(58,14,44,.86);border:1px solid rgba(255,46,154,.55);}
.dc-plat img{width:42%;max-width:130px;aspect-ratio:1;object-fit:cover;border-radius:12px;}
.dc-plat>div{min-width:0;display:flex;flex-direction:column;gap:3px;}
.dc-plat b{font-size:16px;font-weight:800;}
.dc-plat span{font-size:12.5px;opacity:.8;}
.dc-plat-b{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto;padding-top:8px;}
.dc-plat-b button{padding:8px 12px;border-radius:12px;font-size:13px;font-weight:700;color:var(--dc-or);
  border:1.5px solid var(--dc-or);background:none;}
.dc-plat-b button.plein{color:#fff;border-color:transparent;background:linear-gradient(100deg,#FF2E9A,#E0399B);}
.dc-resa{flex:1;min-width:0;display:grid;gap:10px;padding:16px;border-radius:22px;
  background:rgba(58,14,44,.9);border:1px solid rgba(255,46,154,.6);box-shadow:0 0 30px rgba(255,46,154,.25);}
.dc-resa-t{display:flex;gap:12px;align-items:center;}
.dc-resa-t svg{width:34px;height:34px;fill:none;stroke:var(--dc-or);stroke-width:1.8;stroke-linecap:round;}
.dc-resa-t b{display:block;font-size:19px;font-weight:800;}
.dc-resa-t em{font-style:normal;font-size:13px;opacity:.8;}
.dc-resa label,.dc-resa-n{display:grid;gap:5px;font-size:12px;font-weight:600;color:rgba(255,255,255,.75);}
.dc-resa select{appearance:none;-webkit-appearance:none;width:100%;padding:11px 12px;border-radius:12px;
  font:inherit;font-size:15px;font-weight:600;color:#fff;background:rgba(20,6,16,.6);border:1px solid rgba(255,255,255,.18);}
.dc-resa-n>div{display:flex;align-items:center;justify-content:space-between;padding:6px;border-radius:12px;
  background:rgba(20,6,16,.6);border:1px solid rgba(255,255,255,.18);}
.dc-resa-n button{width:34px;height:34px;border-radius:50%;border:0;color:#fff;font-size:18px;background:rgba(255,46,154,.35);}
.dc-resa-n button:disabled{opacity:.35;}
.dc-resa-n b{font-size:17px;color:#fff;}
.dc-resa-ok{padding:14px;border-radius:999px;border:0;color:#fff;font-size:16px;font-weight:800;
  background:linear-gradient(100deg,#FF2E9A,#E0399B);box-shadow:0 10px 26px -8px rgba(255,46,154,.8);}
.dc-resa.faite .dc-resa-ok{background:#1F9E6B;box-shadow:none;}
.dc-resa small{text-align:center;font-size:11px;opacity:.6;}
.dc-info{display:grid;gap:5px;padding:12px 14px;border-radius:18px;font-size:13.5px;
  background:rgba(58,14,44,.86);border:1px solid rgba(245,162,58,.6);max-width:82%;}
.dc-info b{font-size:15px;}
.dc-ligne{display:flex;justify-content:space-between;gap:12px;}
.dc-ligne s{text-decoration:none;color:var(--dc-or);font-weight:700;}
@media (prefers-reduced-motion:reduce){
  .dc-micro>button:first-child,.dc-etat.on s,.dc-conv{animation:none;}
}
`;
