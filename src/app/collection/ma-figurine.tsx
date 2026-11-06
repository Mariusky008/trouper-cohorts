"use client";

/**
 * 🗣️ « TA FIGURINE QUI PARLE », LE HAUT DE « MA COLLECTION » — refait le 4 novembre 2026 (« on s'y perd, on ne sait pas
 * quoi y faire… la section qui devrait être le wow de la page, “Ta propre figurine”, n'est pas du tout ce que je
 * voulais : les émotions devaient être réelles, avec des expressions du visage, et pas un décor ; on devrait pouvoir la
 * faire parler avec une voix en mettant un texte, et l'envoyer à quelqu'un via WhatsApp »).
 *
 * UN SEUL ÉCRAN, UN SEUL GESTE : la figurine en grand ; dessous, ce qu'elle ressent (SON visage change) ; puis ce
 * qu'elle dit — un texte lu par une voix au choix, ou sa propre voix — ; « Écouter » ; « Envoyer » (WhatsApp d'abord).
 *   · `StudioMoi` : la sienne, quand elle est prête (son visage de joie se fabrique tout seul ; les autres, à la
 *     demande) ; tout y est ouvert dès le départ (5 novembre 2026, le lot 3) — `MesOptions` n'est plus qu'une liste de
 *     « premiers pas », sans cadenas : la progression, c'est sa figurine du mois (`figurine-du-mois.tsx`) ;
 *   · `OngletFigurine` : l'onglet entier — l'accueil du guide, la figurine du patron de ClikMe (`guide.tsx`), la quête
 *     `EnvoiPhoto` (« Crée ta figurine », dès le départ, sans compte), `FabricationAuto` (le moteur la fabrique, le guide raconte),
 *     `Annonce` (sans moteur : ClikMe la fait à la main). La démonstration qu'on faisait parler (`StudioDemo`) est
 *     partie le 5 novembre 2026 : « elle ne sert plus à rien maintenant ».
 * La règle est dans `lib/direct/ma-figurine.ts`.
 */
import { useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ACCORD_PUBLIC,
  DUREE_MAX_MESSAGE,
  PRENOM_MAX,
  SENTIMENTS,
  TEXTE_MAX,
  UNIVERS_MAX,
  VOIX_DE_BASE,
  VOIX_FIGURINE,
  sentimentDe,
  type CleVoix,
  type EtatMaFigurine,
  type Sentiment,
} from "@/lib/direct/ma-figurine";
import { reduireImage } from "@/lib/direct/reduire-image";
import { FigurineQuiParle, STYLES_FIGURINE_QUI_PARLE, type FigurineHandle } from "./figurine-qui-parle";
import { Guide, GuideDit, OngletVisible, STYLES_GUIDE, useVoixPablito } from "./guide";
import { lancerMusiqueDanse } from "@/lib/direct/musique-danse";
import { fabriquerMeme, memePossible } from "@/lib/direct/meme";
import { PREMIER_MEME, memesDuMoment, type MemePret } from "@/lib/direct/memes-prets";
import { createClient } from "@/lib/supabase/client";
import { SONS_PABLITO } from "@/lib/direct/guide";
import { ETAPES, prochaineEtape } from "@/lib/direct/etapes";
import { ProtegerFigurine } from "./connaitre";
import { ApercuDuMois, useMois } from "./figurine-du-mois";
import { EVT_VERS_LE_STUDIO, prendreVersLeStudio, type VersLeStudio } from "./vers-le-studio";
import { moisEnClair, type FigurineDuMois } from "@/lib/direct/figurine-du-mois";

type Reponse = { error?: string; etat?: EtatMaFigurine; lien?: string; son?: string; enCours?: boolean };

/** 💬 Le mème auquel il répond (en duo), venu de `?repondre=<id>` : gardé sur l'appareil (il crée d'abord sa figurine). */
const CLE_REPONDRE = "clikme-repondre-v1";
type MemeARepondre = { id: string; prenom: string; images: { n: string; p: string }; son: string; texte?: string };
function idARepondre(): string {
  try {
    const u = new URL(window.location.href).searchParams.get("repondre");
    if (u && /^[a-z0-9]{12}$/.test(u)) return u;
    return window.localStorage.getItem(CLE_REPONDRE) ?? "";
  } catch {
    return "";
  }
}
function oublierLaReponse() {
  try {
    window.localStorage.removeItem(CLE_REPONDRE);
    const u = new URL(window.location.href);
    if (u.searchParams.has("repondre")) {
      u.searchParams.delete("repondre");
      window.history.replaceState(window.history.state, "", u.toString());
    }
  } catch {
    /* rien */
  }
}
/** 📈 Un geste autour d'un mème (la mesure) : jamais bloquant. */
const noterGeste = (type: "partage" | "nouveau", id: string) =>
  void fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "meme-evenement", type, id }) }).catch(() => undefined);

async function demander(corps: Record<string, unknown>): Promise<Reponse> {
  const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as Reponse;
  if (!r.ok) throw new Error(j.error || "Ça n’est pas parti. Réessaie dans un instant.");
  return j;
}

/** La durée d'un son (une adresse `data:` ou `blob:`), lue par le navigateur. */
function dureeDe(url: string): Promise<number> {
  return new Promise((ok) => {
    const a = new Audio();
    const fin = () => ok(Number.isFinite(a.duration) ? a.duration : 0);
    a.onloadedmetadata = fin;
    a.onerror = () => ok(0);
    a.preload = "metadata";
    a.src = url;
    window.setTimeout(fin, 4000);
  });
}

// ─── ce qu'elle ressent : son visage ────────────────────────────────────────────────────────────

/**
 * Ce qu'elle ressent : tous ses visages, ouverts dès le départ (le lot 3 — plus de cadenas). Un visage que le moteur
 * est en train de faire (« cours ») ne se choisit pas encore : il le dit (6 novembre 2026 : « toute la carte bouge
 * parce que l'expression n'est pas prête : prévenir qu'elle est en cours de création, et ne pas laisser cliquer ») ;
 * un visage pas encore fait (« creer ») porte une étincelle : le toucher le fait fabriquer.
 */
function ChoixExpression({ valeur, onChoix, etats = {} }: { valeur: Sentiment | null; onChoix: (s: Sentiment | null) => void; etats?: Partial<Record<Sentiment, "cours" | "creer">> }) {
  return (
    <div className="tf-expr" role="radiogroup" aria-label="Ce qu’elle ressent">
      {[{ cle: null, emoji: "🙂", court: "Normal" }, ...SENTIMENTS].map((x) => {
        const e = x.cle ? etats[x.cle] : undefined;
        return (
          <button
            key={x.cle ?? "normal"}
            type="button"
            role="radio"
            aria-checked={valeur === x.cle}
            className={`${valeur === x.cle ? "pris" : ""}${e ? ` ${e}` : ""}`}
            disabled={e === "cours"}
            aria-label={e === "cours" ? `${x.court} : en création` : e === "creer" ? `${x.court} : à créer` : x.court}
            onClick={() => onChoix(x.cle)}
          >
            <span aria-hidden="true">{x.emoji}</span>
            {x.court}
            {e === "cours" && <em className="tf-expr-cours">en création…</em>}
            {e === "creer" && (
              <i className="tf-expr-neuf" aria-hidden="true">
                ✨
              </i>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Sa voix : toutes ouvertes dès le départ. */
function ChoixVoix({ valeur, onChoix, desactive }: { valeur: CleVoix; onChoix: (v: CleVoix) => void; desactive?: boolean }) {
  return (
    <div className="tf-voix" role="radiogroup" aria-label="Sa voix">
      {VOIX_FIGURINE.map((v) => (
        <button key={v.cle} type="button" role="radio" aria-checked={valeur === v.cle} className={valeur === v.cle ? "pris" : ""} disabled={desactive} onClick={() => onChoix(v.cle)}>
          <span aria-hidden="true">{v.emoji}</span>
          {v.nom}
        </button>
      ))}
    </div>
  );
}

/**
 * 🎁 SES CADEAUX DE CLIKME (`etapes.ts`) : les étapes à franchir dans l'app (cochées), et ses options — la n-ième
 * s'ouvre au n-ième cadeau ; la prochaine brille. Plus aucun achat (5 novembre 2026 : « ça ressemble trop à de
 * l'achat forcé »).
 */
export function MesOptions({ etapes }: { cadeaux?: number; etapes: readonly string[] }) {
  // 👣 TES PREMIERS PAS (5 novembre 2026, le lot 3 : « tout ouvrir dès le départ ») — plus aucun cadenas : les étapes
  // guident le nouveau venu, sans rien bloquer ; la progression, c'est sa figurine du mois. Repliés (6 novembre 2026 :
  // « c'est très compact, ça en devient confus ») : une ligne, et son prochain pas.
  const prochaine = prochaineEtape(etapes);
  if (!prochaine) return null;
  const faites = ETAPES.filter((e) => etapes.includes(e.cle)).length;
  return (
    <details className="tf-options" aria-label="Tes premiers pas">
      <summary>
        <span aria-hidden="true">👣</span> Tes premiers pas{" "}
        <em>
          {faites}/{ETAPES.length}
        </em>
        <small>
          Prochain : {prochaine.emoji} {prochaine.titre}
        </small>
      </summary>
      <ul className="tf-kdo" aria-label="Tes étapes">
        {ETAPES.map((e) => {
          const faite = etapes.includes(e.cle);
          return (
            <li key={e.cle} className={faite ? "faite" : e.cle === prochaine.cle ? "suivante" : ""}>
              <span aria-hidden="true">{faite ? "✅" : e.emoji}</span> {e.titre}
            </li>
          );
        })}
      </ul>
      <p className="tf-options-dit">
        Ton prochain pas :{" "}
        <a href={`#${prochaine.onglet}`}>
          {prochaine.emoji} {prochaine.titre}
        </a>
      </p>
    </details>
  );
}

// ─── l'envoi : WhatsApp d'abord ─────────────────────────────────────────────────────────────────
/** Le lien est prêt : WhatsApp en grand, puis « Partager… », SMS, copier ; et ce que l'autre verra. */
export function PanneauEnvoi({ lien, texte, titre = "Ton message est prêt ✓" }: { lien: string; texte: string; titre?: string }) {
  const [copie, setCopie] = useState(false);
  const partager = async () => {
    try {
      await navigator.share({ title: texte, text: texte, url: lien });
    } catch {
      /* il a fermé la feuille de partage */
    }
  };
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
    } catch {
      setCopie(false);
    }
  };
  return (
    <div className="tf-pret">
      <b>{titre}</b>
      <a className="tf-wa" href={`https://wa.me/?text=${encodeURIComponent(`${texte} ${lien}`)}`} target="_blank" rel="noopener noreferrer">
        Envoyer sur WhatsApp
      </a>
      <div className="tf-autres">
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button type="button" onClick={partager}>
            Partager…
          </button>
        )}
        <a className="tf-sms" href={`sms:?&body=${encodeURIComponent(`${texte} ${lien}`)}`}>
          SMS
        </a>
        <button type="button" onClick={copier}>
          {copie ? "Lien copié ✓" : "Copier le lien"}
        </button>
      </div>
      <input className="tf-adresse" readOnly value={lien} aria-label="Le lien" onFocus={(e) => e.target.select()} />
      <a className="tf-voir" href={lien} target="_blank" rel="noopener noreferrer">
        Voir ce qu’on recevra ›
      </a>
    </div>
  );
}


// ─── la sienne ──────────────────────────────────────────────────────────────────────────────────
const TYPES_SON = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
/** Le son prêt à partir : l'adresse à jouer, ce qui part au serveur, sa durée, et d'où il vient (pour ne pas le refaire). */
type Son = { url: string; data: string; duree: number; cle: string; texte?: string; voix?: CleVoix };

export function StudioMoi({ etat: etat0, onEtat }: { etat: EtatMaFigurine; onEtat?: (e: EtatMaFigurine) => void }) {
  const fig = useRef<FigurineHandle>(null);
  const [etat, setEtat] = useState(etat0);
  const [mode, setMode] = useState<"ecrire" | "voix">(etat0.voixTexte ? "ecrire" : "voix");
  const [refaire, setRefaire] = useState(false);
  const [univers, setUnivers] = useState(etat0.univers ?? "");
  // (tout est ouvert dès le départ, le lot 3 : ses visages, ses voix, sa propre voix, le cadre doré)
  const or = true;
  // 🎁 SON PREMIER MÈME, DÉJÀ ÉCRIT (« le premier mème en moins de deux minutes ») : il n'a plus qu'à l'écouter
  const [texte, setTexte] = useState(() => (etat0.messages.length ? "" : PREMIER_MEME));
  // 💬 LE MÈME AUQUEL IL RÉPOND (en duo) ; et les mèmes prêts du moment
  const [reponse, setReponse] = useState<MemeARepondre | null>(null);
  const [prets] = useState<MemePret[]>(() => memesDuMoment());
  useEffect(() => {
    const id = idARepondre();
    if (!id) return;
    let fini = false;
    void fetch(`/api/direct/ma-figurine?repondre=${id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { meme?: MemeARepondre } | null) => {
        if (fini) return;
        if (j?.meme) setReponse(j.meme);
        else oublierLaReponse();
      })
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, []);
  // SA VOIX : celle qu'il a choisie (« une voix d'homme ou de femme ? », demandé une fois ; jamais devinée)
  const [voix, setVoix] = useState<CleVoix | null>(etat0.maVoix ?? null);
  function choisirVoix(v: CleVoix) {
    if (!voix) setVoixOuvertes(true);
    setVoix(v);
    // (gardée : ce sera sa voix la prochaine fois)
    void demander({ action: "ma-voix", voix: v }).catch(() => undefined);
  }
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [danse, setDanse] = useState(false);
  // 🗓️ SES LOOKS (7 novembre 2026 : « on devrait pouvoir utiliser celle qu'on veut pour l'envoyer en faisant dire quelque
  // chose ») : ses figurines du mois, qui parlent dans ses mèmes. `look` : celui qu'il a pris ("" : sa figurine de tous
  // les jours) ; `lookCours` : celui qui apprend à parler (le moteur lui ouvre la bouche, une fois) ; `lookVoulu` : celui
  // qu'on lui a demandé d'un autre onglet, en attendant que ses looks soient là
  const [mois, annoncerMois] = useMois();
  const looks: FigurineDuMois[] = mois ? [mois.courante, ...mois.passees].filter((f) => f.etat === "prete" && f.image) : [];
  const [look, setLook] = useState("");
  const [lookCours, setLookCours] = useState("");
  const [lookVoulu, setLookVoulu] = useState("");
  const sonLook = look ? (looks.find((f) => f.mois === look) ?? null) : null;
  // 🎵 SA MUSIQUE (6 novembre 2026 : « il faut y associer une musique qu'on entend, autrement c'est plat ») : lancée au
  // toucher ; `rythme`, son premier temps (le ressort s'écrase sur la grosse caisse)
  const musique = useRef<ReturnType<typeof lancerMusiqueDanse> | null>(null);
  const [rythme, setRythme] = useState(0);
  const visible = useContext(OngletVisible);
  // (ses voix : la liste se replie une fois choisie — « Voix : Posée · changer »)
  const [voixOuvertes, setVoixOuvertes] = useState(false);
  // (un visage demandé, pas encore fait : il s'affichera tout seul dès qu'il sera prêt)
  const [attendu, setAttendu] = useState<Sentiment | null>(null);
  const [rejoue, setRejoue] = useState(0);
  const [son, setSon] = useState<Son | null>(null);
  const [parle, setParle] = useState(false);
  const [enreg, setEnreg] = useState(false);
  const [secondes, setSecondes] = useState(0);
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState<{ lien: string; cle: string; id: string } | null>(null);
  // 🎭 SON MÈME (6 novembre 2026) : la vidéo, fabriquée ici, puis partagée telle quelle
  // (`duo` : une réponse en duo — elle reste entre eux, jamais dans « Découvrir » ; `public` : il l'y a montré)
  const [meme, setMeme] = useState<{ cle: string; etat: "fabrication" | "pret" | "sans"; p?: number; url?: string; fichier?: File; duo?: boolean; public?: boolean } | null>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  const [erreur, setErreur] = useState("");
  const [expressionsEnCours, setExpressionsEnCours] = useState(Boolean(etat0.expressionsAFaire));
  // (le visage qu'il vient de choisir et qui n'est pas encore fait : le moteur le fait à la demande)
  const [veut, setVeut] = useState<{ s: Sentiment | null; n: number }>({ s: null, n: 0 });
  const micro = useRef<{ rec: MediaRecorder; flux: MediaStream; t0: number; minuteur: number } | null>(null);

  // 🎭 SES EXPRESSIONS : le moteur d'image les fait (deux tours ; la page attend en arrière-plan) — la joie d'office,
  // et chaque autre visage la première fois qu'il le choisit (`veut`)
  useEffect(() => {
    if (!etat0.expressionsAFaire && !veut.s) return;
    let fini = false;
    (async () => {
      for (let k = 0; k < 4 && !fini; k++) {
        try {
          const j = await demander({ action: "expressions", ...(veut.s ? { veut: veut.s } : {}) });
          if (fini) return;
          if (j.etat) setEtat(j.etat);
          if (!j.etat?.expressionsAFaire || (j.error && !j.enCours)) break;
          if (j.enCours) await new Promise((ok) => window.setTimeout(ok, 30_000));
        } catch {
          break;
        }
      }
      if (!fini) setExpressionsEnCours(false);
    })();
    return () => {
      fini = true;
    };
  }, [etat0.expressionsAFaire, veut]);

  useEffect(
    () => () => {
      const m = micro.current;
      if (m) {
        window.clearInterval(m.minuteur);
        m.flux.getTracks().forEach((t) => t.stop());
      }
      musique.current?.arreter();
    },
    [],
  );

  // 🕺 LA DANSE ET SA MUSIQUE : au toucher (le son ne démarre que dans le geste, sur iPhone)
  function basculerDanse() {
    if (danse) {
      musique.current?.arreter();
      musique.current = null;
      setDanse(false);
      return;
    }
    musique.current = lancerMusiqueDanse(setRythme);
    musique.current.baisser(parle);
    setDanse(true);
  }
  // (elle parle : la musique se fait discrète ; il change d'onglet ou range son téléphone : elle s'arrête)
  useEffect(() => {
    musique.current?.baisser(parle);
  }, [parle]);
  useEffect(() => {
    const couper = () => {
      if (!musique.current) return;
      musique.current.arreter();
      musique.current = null;
      void Promise.resolve().then(() => setDanse(false));
    };
    if (!visible) couper();
    const cache = () => document.visibilityState === "hidden" && couper();
    document.addEventListener("visibilitychange", cache);
    return () => document.removeEventListener("visibilitychange", cache);
  }, [visible]);

  // 🎭 SES VISAGES : prêt, en création (le moteur le fait), ou à créer (le toucher le fait faire)
  const enCreation = new Set<Sentiment>(expressionsEnCours ? [...(etat.visagesEnCours ?? []), ...(veut.s ? [veut.s] : [])] : []);
  const etatsVisages: Partial<Record<Sentiment, "cours" | "creer">> =
    etat.auto === false || !etat.visagesEnCours ? {} : Object.fromEntries(SENTIMENTS.filter((x) => !etat.expressions?.[x.cle]).map((x) => [x.cle, enCreation.has(x.cle) ? "cours" : "creer"]));
  // le visage demandé est prêt : il s'affiche
  if (attendu && etat.expressions?.[attendu]) {
    setAttendu(null);
    setSentiment(attendu);
    setRejoue((n) => n + 1);
  }
  function choisirVisage(s: Sentiment | null) {
    if (s && etatsVisages[s] === "creer") {
      setExpressionsEnCours(true);
      setVeut((v) => ({ s, n: v.n + 1 }));
      setAttendu(s);
      return;
    }
    setSentiment(s);
    setRejoue((n) => n + 1);
  }

  // 🗓️ UN LOOK : il parle tout de suite s'il sait déjà parler ; sinon, il apprend (une minute environ), puis il s'affiche
  function choisirLook(m: string) {
    if (!m) {
      setLook("");
      setRejoue((n) => n + 1);
      return;
    }
    const l = looks.find((f) => f.mois === m);
    if (!l) return;
    if (l.parle) {
      setLook(m);
      // (son visage, c'est celui du mois)
      setSentiment(null);
      setRejoue((n) => n + 1);
      return;
    }
    if (!lookCours) setLookCours(m);
  }
  useEffect(() => {
    if (!lookCours) return;
    let fini = false;
    (async () => {
      for (let k = 0; k < 8 && !fini; k++) {
        const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "look-parle", look: lookCours }) }).catch(() => null);
        const j = (await r?.json().catch(() => ({}))) as { mois?: typeof mois; enCours?: boolean; error?: string } | undefined;
        if (fini) return;
        if (j?.mois) annoncerMois(j.mois);
        const pret = j?.mois && [j.mois.courante, ...j.mois.passees].some((f) => f.mois === lookCours && f.parle);
        if (pret) {
          setLook(lookCours);
          setSentiment(null);
          setRejoue((n) => n + 1);
          break;
        }
        if (j?.error || !j?.enCours) {
          if (j?.error) setErreur(j.error);
          break;
        }
        await new Promise((ok) => window.setTimeout(ok, 15_000));
      }
      if (!fini) setLookCours("");
    })();
    return () => {
      fini = true;
    };
  }, [lookCours, annoncerMois]);
  // un look demandé d'un autre onglet (« Fais-la parler ») : dès que ses looks sont là
  if (lookVoulu && looks.some((f) => f.mois === lookVoulu)) {
    const m = lookVoulu;
    setLookVoulu("");
    choisirLook(m);
  }
  // 🎭 VERS LE STUDIO : un texte (une réplique de sa figurine dans un épisode) ou un look, demandé d'un autre onglet
  useEffect(() => {
    const appliquer = (x: VersLeStudio | null) => {
      if (!x) return;
      if (typeof x.texte === "string" && x.texte.trim()) {
        setMode("ecrire");
        setTexte(x.texte.trim().slice(0, TEXTE_MAX));
      }
      if (typeof x.look === "string") setLookVoulu(x.look);
    };
    void Promise.resolve().then(() => appliquer(prendreVersLeStudio()));
    const ecoute = (e: Event) => {
      prendreVersLeStudio();
      appliquer((e as CustomEvent<VersLeStudio>).detail);
    };
    window.addEventListener(EVT_VERS_LE_STUDIO, ecoute);
    return () => window.removeEventListener(EVT_VERS_LE_STUDIO, ecoute);
  }, []);

  const cleEnvoi = (s: Son | null) => (s ? `${s.cle}|${sentiment ?? ""}|${danse ? "danse" : ""}|${look}` : "");

  // ✍️ son texte, lu par la voix choisie : fabriqué au toucher, joué dès qu'il arrive
  function ecouterTexte(dit?: string) {
    setErreur("");
    const t = (dit ?? texte).trim();
    if (!t) return setErreur("Écris d’abord ce qu’elle doit dire.");
    if (!voix) return setErreur("Choisis d’abord sa voix.");
    const cle = `${voix}|${t}`;
    if (son?.cle === cle) return void fig.current?.jouer(son.url);
    void fig.current?.jouer(async () => {
      const j = await demander({ action: "voix", texte: t, voix });
      if (!j.son) throw new Error("La voix n’a pas pu lire ce texte.");
      setSon({ url: j.son, data: j.son, duree: await dureeDe(j.son), cle, texte: t, voix });
      return j.son;
    });
  }

  // 🎙️ sa propre voix
  async function commencer() {
    setErreur("");
    let flux: MediaStream;
    try {
      flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      return setErreur("Autorise le micro pour enregistrer ta voix.");
    }
    const type = typeof MediaRecorder !== "undefined" ? TYPES_SON.find((t) => MediaRecorder.isTypeSupported?.(t)) : undefined;
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(flux, type ? { mimeType: type } : undefined);
    } catch {
      flux.getTracks().forEach((t) => t.stop());
      return setErreur("Ce téléphone ne sait pas enregistrer ici. Essaie avec un autre navigateur.");
    }
    const morceaux: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
    rec.onstop = () => {
      const m = micro.current;
      micro.current = null;
      if (m) window.clearInterval(m.minuteur);
      flux.getTracks().forEach((t) => t.stop());
      setEnreg(false);
      const duree = Math.min(DUREE_MAX_MESSAGE, (performance.now() - (m?.t0 ?? performance.now())) / 1000);
      const blob = new Blob(morceaux, { type: rec.mimeType || type || "audio/webm" });
      const lecteur = new FileReader();
      lecteur.onload = () => setSon({ url: URL.createObjectURL(blob), data: String(lecteur.result), duree, cle: `micro-${Date.now()}` });
      lecteur.readAsDataURL(blob);
    };
    const t0 = performance.now();
    const minuteur = window.setInterval(() => {
      const t = (performance.now() - t0) / 1000;
      setSecondes(t);
      if (t >= DUREE_MAX_MESSAGE) arreter();
    }, 100);
    micro.current = { rec, flux, t0, minuteur };
    setSecondes(0);
    setSon(null);
    rec.start(250);
    setEnreg(true);
  }
  function arreter() {
    const m = micro.current;
    if (m && m.rec.state !== "inactive") m.rec.stop();
  }

  /** ✨ UN MÈME PRÊT : son texte, son visage (et la danse) — et sa figurine le dit aussitôt (sa voix est choisie). */
  function choisirPret(m: MemePret) {
    setMode("ecrire");
    setTexte(m.texte);
    if (m.sentiment) choisirVisage(m.sentiment);
    if (Boolean(m.danse) !== danse) basculerDanse();
    if (voix) ecouterTexte(m.texte);
  }

  /** Le message (sa voix) : son lien. Déjà parti avec les mêmes réglages : le même. */
  async function leMessage(s: Son): Promise<{ lien: string; id: string }> {
    const cle = cleEnvoi(s);
    if (envoye?.cle === cle) return envoye;
    const j = await demander({
      action: "message",
      son: s.data,
      duree: s.duree,
      commerces: [],
      ...(sentiment ? { sentiment } : {}),
      ...(danse ? { danse: true } : {}),
      ...(s.texte ? { texte: s.texte, voix: s.voix } : {}),
      ...(reponse ? { repondA: reponse.id } : {}),
      ...(sonLook ? { look: sonLook.mois } : {}),
    });
    const lien = `${window.location.origin}${j.lien}`;
    const id = String(j.lien).split("/").pop() ?? "";
    setEnvoye({ lien, cle, id });
    setEtat((e) => ({ ...e, messages: [{ id, le: new Date().toISOString(), ecoutes: 0, signale: false, sentiment, ...(s.texte ? { texte: s.texte } : {}) }, ...e.messages] }));
    return { lien, id };
  }

  /**
   * 🎭 SON MÈME — la vidéo de sa figurine qui parle (`meme.ts`) : elle se fabrique sous ses yeux (et ses oreilles), part
   * au seau, et il la partage TELLE QUELLE (la feuille de partage du téléphone : WhatsApp la montre et la rejoue). Un
   * téléphone qui ne sait pas faire de vidéo : le lien seul (la page joue sa figurine).
   */
  async function creerMeme() {
    if (!son) return;
    const cle = cleEnvoi(son);
    // (le son s'ouvre DANS le toucher : sur iPhone, c'est maintenant ou jamais)
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const ctx = memePossible() && AC ? new AC() : null;
    void ctx?.resume().catch(() => undefined);
    setEnvoi(true);
    setErreur("");
    try {
      const { id } = await leMessage(son);
      if (!ctx || !toile.current) {
        setMeme({ cle, etat: "sans" });
        return;
      }
      setMeme({ cle, etat: "fabrication", p: 0 });
      // (son look, s'il en a pris un : sa figurine du mois, qui parle)
      const visage =
        sonLook?.image && sonLook.parle
          ? { n: sonLook.image, p: sonLook.parle }
          : sentiment && etat.expressions?.[sentiment]
            ? etat.expressions[sentiment]!
            : { n: etat.neutre!, p: etat.parle! };
      const m = await fabriquerMeme({
        ctx,
        toile: toile.current,
        images: visage,
        son: son.url,
        texte: son.texte,
        emoji: sentiment ? (sentimentDe(sentiment)?.emoji ?? "") : "",
        danse,
        ecouter: true,
        surProgres: (p) => setMeme((x) => (x && x.etat === "fabrication" ? { ...x, p } : x)),
        // 💬 EN DUO : sa figurine à lui en haut, qui parle d'abord ; la sienne en bas, qui répond
        ...(reponse ? { duo: { images: reponse.images, son: reponse.son, texte: reponse.texte, prenom: reponse.prenom, moi: etat.prenom } } : {}),
      });
      // la vidéo part au seau (directement), puis elle est rangée avec le message
      const a = await demander({ action: "meme-envoi", id, type: m.type });
      const ext = m.type.includes("mp4") ? "mp4" : "webm";
      const envoi = a as unknown as { seau: string; chemin: string; jeton: string };
      const { error } = await createClient().storage.from(envoi.seau).uploadToSignedUrl(envoi.chemin, envoi.jeton, m.blob, { contentType: m.type });
      if (error) throw new Error("Ton mème n’a pas pu partir. Réessaie.");
      await demander({ action: "meme-pose", id, type: m.type });
      setMeme({ cle, etat: "pret", url: URL.createObjectURL(m.blob), fichier: new File([m.blob], `mon-meme-clikme.${ext}`, { type: m.type }), duo: Boolean(reponse) });
      // (sa réponse est partie : la suivante sera un mème à lui)
      if (reponse) {
        oublierLaReponse();
        setReponse(null);
      }
    } catch (e) {
      setErreur((e as Error).message);
      setMeme((x) => (x?.cle === cle && x.etat === "fabrication" ? { cle, etat: "sans" } : x));
    } finally {
      setEnvoi(false);
      void ctx?.close().catch(() => undefined);
    }
  }

  /** 📲 Le mème part TEL QUEL (sans texte) : la feuille de partage du téléphone, avec la vidéo. */
  async function partagerMeme() {
    if (!meme?.fichier) return;
    if (envoye) noterGeste("partage", envoye.id);
    try {
      await navigator.share({ files: [meme.fichier] });
    } catch {
      /* il a fermé la feuille de partage */
    }
  }
  /** 🌍 Le montrer dans « Découvrir », pour les gens de sa ville (son accord, demandé) — ou le retirer. */
  async function basculerPublic() {
    if (!envoye || !meme) return;
    setErreur("");
    if (!meme.public && !window.confirm(ACCORD_PUBLIC)) return;
    try {
      const j = (await demander({ action: "public", id: envoye.id, public: !meme.public })) as Reponse & { public?: boolean };
      setMeme((x) => (x ? { ...x, public: Boolean(j.public) } : x));
    } catch (e) {
      setErreur((e as Error).message);
    }
  }
  const partageFichier = typeof navigator !== "undefined" && Boolean(meme?.fichier) && typeof navigator.canShare === "function" && navigator.canShare({ files: [meme!.fichier!] });

  const saVoix = voix ? VOIX_FIGURINE.find((v) => v.cle === voix) : null;
  const refaireOuvert = refaire && (etat.refaire ?? 0) > 0;

  // UNE PAGE EN TROIS TEMPS (6 novembre 2026 : « c'est très compact, ça en devient confus ») : sa figurine en grand,
  // avec ses deux gestes (danser, la refaire) ; ses visages, sur une ligne ; « Fais-la parler », une seule carte ; puis,
  // repliés, ses premiers pas et ses messages
  return (
    <div className="tf tf-moi">
      <div className="tf-scene">
        <div className="tf-hero">
          <FigurineQuiParle
            key={sonLook ? `look-${sonLook.mois}` : "moi"}
            ref={fig}
            neutre={sonLook?.image && sonLook.parle ? sonLook.image : etat.neutre!}
            parle={sonLook?.image && sonLook.parle ? sonLook.parle : etat.parle!}
            expressions={sonLook ? undefined : etat.expressions}
            sentiment={sonLook ? null : sentiment}
            danse={danse}
            rythme={rythme}
            rejoue={rejoue}
            onJoue={setParle}
            className={`tf-fig${or ? " tf-or" : ""}`}
          />
          <div className="tf-gestes">
            {/* 🕺 ELLE DANSE, EN MUSIQUE : dès le départ, avec n'importe quel visage */}
            <button type="button" className={`tf-danse${danse ? " pris" : ""}`} aria-pressed={danse} onClick={basculerDanse}>
              <span aria-hidden="true">{danse ? "⏹" : "🕺"}</span>
              {danse ? "Stop" : "Danser"}
            </button>
            {(etat.refaire ?? 0) > 0 && (
              <button type="button" className={`tf-refaire-lien${refaireOuvert ? " pris" : ""}`} aria-expanded={refaireOuvert} onClick={() => setRefaire((x) => !x)}>
                <span aria-hidden="true">🔁</span>
                La refaire
              </button>
            )}
          </div>
        </div>
        {refaireOuvert && (
          <div className="tf-refaire">
            <b>Elle ne te ressemble pas ?</b>
            <label className="tf-refaire-univers">
              <span>Ce qui te ressemble : ton métier ou ta passion (facultatif)</span>
              <input className="tf-univers" value={univers} maxLength={UNIVERS_MAX} onChange={(e) => setUnivers(e.target.value)} placeholder="Artisan, boulangère, fan de vélo…" />
            </label>
            <button
              type="button"
              onClick={async () => {
                try {
                  const j = await demander({ action: "refaire", univers: univers.trim() });
                  if (j.etat) onEtat?.(j.etat);
                } catch (e) {
                  setErreur((e as Error).message);
                }
              }}
            >
              🔁 Une nouvelle, avec la même photo ({etat.refaire} aujourd’hui)
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const j = await demander({ action: "refaire", autrePhoto: true, univers: univers.trim() });
                  if (j.etat) onEtat?.(j.etat);
                } catch (e) {
                  setErreur((e as Error).message);
                }
              }}
            >
              📸 Avec une autre photo
            </button>
          </div>
        )}
        {/* 🗓️ SES LOOKS : ses figurines du mois, qui parlent dans ses mèmes */}
        {looks.length > 0 && (
          <>
            <b className="tf-q tf-q-visage">Son look</b>
            <div className="tf-looks" role="radiogroup" aria-label="Son look">
              <button type="button" role="radio" aria-checked={!sonLook} className={!sonLook ? "pris" : ""} onClick={() => choisirLook("")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={etat.neutre} alt="" />
                <span>De tous les jours</span>
              </button>
              {looks.map((l) => {
                const cours = lookCours === l.mois;
                const nom = moisEnClair(l.mois).replace(/\s\d{4}$/, "");
                return (
                  <button
                    key={l.mois}
                    type="button"
                    role="radio"
                    aria-checked={sonLook?.mois === l.mois}
                    className={`${sonLook?.mois === l.mois ? "pris" : ""}${cours ? " cours" : ""}`}
                    disabled={cours}
                    aria-label={cours ? `${nom} : il apprend à parler` : `${nom}, ${l.edition.nom}`}
                    onClick={() => choisirLook(l.mois)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.image} alt="" />
                    <span>
                      {l.edition.emoji} {nom.charAt(0).toUpperCase() + nom.slice(1)}
                    </span>
                    {cours && <em>il apprend à parler…</em>}
                  </button>
                );
              })}
            </div>
          </>
        )}
        {sonLook ? (
          <p className="tf-note">
            🗓️ Son visage du mois : <b>{sonLook.expression}</b>. Pour changer d’expression, reprends ta figurine de tous les jours.
          </p>
        ) : (
          <>
            <b className="tf-q tf-q-visage">Son visage</b>
            <ChoixExpression valeur={sentiment} onChoix={choisirVisage} etats={etatsVisages} />
            {enCreation.size > 0 && (
              <p className="tf-note" role="status">
                🎭 Ta figurine apprend {enCreation.size > 1 ? "ces visages" : "ce visage"}… une minute environ : {enCreation.size > 1 ? "ils s’afficheront" : "il s’affichera"} tout seul.
              </p>
            )}
          </>
        )}
        {lookCours && (
          <p className="tf-note" role="status">
            🗓️ Ton look apprend à parler… une minute environ : il s’affichera tout seul.
          </p>
        )}
      </div>

      <div className="tf-panneau">
        <div className="tf-parle-tete">
          <b className="tf-q">💬 Fais-la parler</b>
          {etat.voixTexte && (
            <div className="tf-modes" role="tablist" aria-label="Comment elle parle">
              <button type="button" role="tab" aria-selected={mode === "ecrire"} className={mode === "ecrire" ? "pris" : ""} onClick={() => setMode("ecrire")}>
                ✍️ J’écris
              </button>
              <button type="button" role="tab" aria-selected={mode === "voix"} className={mode === "voix" ? "pris" : ""} onClick={() => setMode("voix")}>
                🎙️ Ma voix
              </button>
            </div>
          )}
        </div>

        {/* 💬 IL RÉPOND À UN MÈME : son mème sera un duo */}
        {reponse && (
          <div className="tf-reponse" role="status">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={reponse.images.n} alt="" />
            <span>
              <b>↩️ Tu réponds à {reponse.prenom || "ce mème"}</b>
              {reponse.texte && <small>« {reponse.texte} »</small>}
              <em>Ton mème sera un duo : sa figurine parle, puis la tienne lui répond.</em>
            </span>
            <button
              type="button"
              aria-label="Ne pas répondre à ce mème"
              onClick={() => {
                oublierLaReponse();
                setReponse(null);
              }}
            >
              ✕
            </button>
          </div>
        )}
        {mode === "ecrire" && etat.voixTexte ? (
          <>
            {/* ✨ LES MÈMES PRÊTS : un toucher, et elle le dit */}
            <div className="tf-prets" role="group" aria-label="Des mèmes prêts à partir">
              {prets.map((m) => (
                <button key={m.cle} type="button" className={texte === m.texte ? "pris" : ""} onClick={() => choisirPret(m)}>
                  <span aria-hidden="true">{m.emoji}</span> {m.nom}
                </button>
              ))}
            </div>
            {texte === PREMIER_MEME && !reponse && <p className="tf-premier">🎁 Ton premier mème est déjà écrit : {voix ? "écoute-le, et partage-le !" : "choisis sa voix, écoute, partage !"}</p>}
            <label className="tf-texte">
              <textarea
                value={texte}
                maxLength={TEXTE_MAX}
                rows={3}
                placeholder="Coucou ! On se voit ce soir ?"
                onChange={(e) => setTexte(e.target.value)}
                aria-label="Ce qu’elle doit dire"
              />
              <small>
                {texte.length} / {TEXTE_MAX}
              </small>
            </label>
            {voix && saVoix ? (
              voixOuvertes ? (
                <ChoixVoix
                  valeur={voix}
                  onChoix={(v) => {
                    choisirVoix(v);
                  }}
                />
              ) : (
                <button type="button" className="tf-voix-choisie" onClick={() => setVoixOuvertes(true)}>
                  <span aria-hidden="true">{saVoix.emoji}</span> Voix : <b>{saVoix.nom}</b> <em>changer</em>
                </button>
              )
            ) : (
              <div className="tf-quelle-voix" role="group" aria-label="Sa voix">
                <b>Ta figurine parle avec…</b>
                <span>
                  <button type="button" onClick={() => choisirVoix(VOIX_DE_BASE.homme)}>
                    👨 Une voix d’homme
                  </button>
                  <button type="button" onClick={() => choisirVoix(VOIX_DE_BASE.femme)}>
                    👩 Une voix de femme
                  </button>
                </span>
              </div>
            )}
            <button type="button" className="tf-ecouter" onClick={() => ecouterTexte()} disabled={parle || !texte.trim() || !voix}>
              {parle ? "🔊 Elle parle…" : "▶ Écouter"}
            </button>
          </>
        ) : enreg ? (
          <>
            <span className="tf-temps" aria-live="polite">
              <i style={{ width: `${Math.min(1, secondes / DUREE_MAX_MESSAGE) * 100}%` } as CSSProperties} />
              <b>
                ● {Math.floor(secondes)} s / {DUREE_MAX_MESSAGE} s
              </b>
            </span>
            <button type="button" className="tf-ecouter tf-stop" onClick={arreter}>
              ■ J’ai fini
            </button>
          </>
        ) : (
          <>
            <p className="tf-aide">Enregistre {DUREE_MAX_MESSAGE} secondes au plus, avec ta voix : c’est elle qui parlera.</p>
            <div className="tf-ligne">
              <button type="button" className="tf-micro" onClick={commencer}>
                🎙️ {son && !son.texte ? "Refaire" : "Enregistrer"}
              </button>
              {son && !son.texte && (
                <button type="button" className="tf-ecouter" onClick={() => void fig.current?.jouer(son.url)} disabled={parle}>
                  {parle ? "🔊 Elle parle…" : "▶ Écouter"}
                </button>
              )}
            </div>
          </>
        )}

        {/* 🎭 SON MÈME : il se fabrique sous ses yeux, puis part tel quel (la vidéo, sans texte) */}
        <canvas ref={toile} className={`tf-meme-toile${meme?.etat === "fabrication" && meme.cle === cleEnvoi(son) ? " visible" : ""}`} aria-hidden="true" />
        {son && (mode === "voix" ? !son.texte : son.texte === texte.trim() && son.voix === voix) && (
          <div className="tf-envoi">
            {meme?.cle === cleEnvoi(son) && meme.etat === "fabrication" ? (
              <div className="tf-meme-cours" role="status">
                <b>🎬 Ton mème se fabrique…</b>
                <span className="tf-meme-jauge">
                  <i style={{ width: `${Math.round((meme.p ?? 0) * 100)}%` }} />
                </span>
              </div>
            ) : meme?.cle === cleEnvoi(son) && meme.etat === "pret" && meme.url ? (
              <div className="tf-meme-pret">
                <b>Ton mème est prêt ✓</b>
                <video className="tf-meme-video" src={meme.url} autoPlay loop muted playsInline onClick={(e) => (e.currentTarget.muted = !e.currentTarget.muted)} />
                {partageFichier ? (
                  <button type="button" className="tf-wa tf-partager-meme" onClick={partagerMeme}>
                    📲 Partager mon mème
                  </button>
                ) : (
                  <a className="tf-wa" href={`https://wa.me/?text=${encodeURIComponent(envoye?.lien ?? "")}`} target="_blank" rel="noopener noreferrer">
                    Envoyer sur WhatsApp
                  </a>
                )}
                <div className="tf-autres">
                  {partageFichier && (
                    <a className="tf-sms" href={`https://wa.me/?text=${encodeURIComponent(envoye?.lien ?? "")}`} target="_blank" rel="noopener noreferrer">
                      Le lien
                    </a>
                  )}
                  <a className="tf-sms" href={meme.url} download={meme.fichier?.name ?? "mon-meme-clikme.mp4"}>
                    ⬇️ La vidéo
                  </a>
                </div>
                {envoye && <input className="tf-adresse" readOnly value={envoye.lien} aria-label="Le lien" onFocus={(e) => e.target.select()} />}
                {/* 🌍 S'IL LE VEUT : les gens de sa ville le verront dans « Découvrir » (jamais un duo) */}
                {envoye && !meme.duo && (
                  <button type="button" className={`tf-public${meme.public ? " pris" : ""}`} aria-pressed={Boolean(meme.public)} onClick={basculerPublic}>
                    {meme.public ? "✓ Dans « Découvrir » · le retirer" : "🌍 Le montrer aussi dans « Découvrir »"}
                  </button>
                )}
              </div>
            ) : meme?.cle === cleEnvoi(son) && meme.etat === "sans" && envoye ? (
              <PanneauEnvoi lien={envoye.lien} texte="" titre="Ton mème est prêt ✓" />
            ) : (
              <button type="button" className="tf-envoyer" onClick={creerMeme} disabled={envoi}>
                {envoi ? "Un instant…" : "🎭 Créer mon mème"}
              </button>
            )}
          </div>
        )}
        {erreur && (
          <p className="tf-erreur" role="alert">
            {erreur}
          </p>
        )}
      </div>

      {/* REPLIÉS : ses premiers pas (ses mèmes sont dans « Mes mèmes ») */}
      <div className="tf-replis">
        <MesOptions cadeaux={etat.cadeaux} etapes={etat.etapes} />
      </div>
    </div>
  );
}

// ─── sa figurine à créer : l'accueil du guide, la quête, puis l'attente ──────────────────────────────────────
/** Ce que le guide annonce quand il n'y a rien à faire tout de suite (sans moteur : ClikMe la fait à la main). */
export function Annonce({ titre, children }: { titre: string; emoji?: string; children: ReactNode }) {
  return (
    <div className="tf-annonce">
      <span className="tf-annonce-clik" aria-hidden="true">
        <Guide salue />
      </span>
      <b>{titre}</b>
      <p>{children}</p>
    </div>
  );
}

/**
 * 📸 « CRÉE TA FIGURINE », UNE PETITE QUÊTE — 5 novembre 2026 (« inciter directement à créer sa figurine, en encore plus
 * gamifié, accueillant et chaleureux ») : trois étapes qui se cochent (sa photo ; son prénom et sa ville, s'il n'a pas
 * encore de compte : la photo le lui ouvre ; « c'est bien moi »), une jauge qui se remplit, et « Donner vie à ma
 * figurine ». Le moteur d'image la fabrique ensuite (`FabricationAuto`) ; sans moteur, ClikMe la fait à la main.
 */
export function EnvoiPhoto({ etat, villes = [], onEnvoye }: { etat: EtatMaFigurine; villes?: { slug: string; nom: string }[]; onEnvoye: (e: EtatMaFigurine) => void }) {
  const [photo, setPhoto] = useState("");
  const [accord, setAccord] = useState(false);
  const [prenom, setPrenom] = useState("");
  const [ville, setVille] = useState(villes.length === 1 ? villes[0].slug : "");
  // SON UNIVERS (facultatif) : son métier ou sa passion — sa figurine s'habille en conséquence
  const [univers, setUnivers] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const demandePrenom = !etat.prenom;
  const demandeVille = !etat.compte && villes.length > 1;
  const sansVille = !etat.compte && villes.length > 0 && !ville;
  const etapes = [Boolean(photo), ...(demandePrenom || demandeVille ? [Boolean((!demandePrenom || prenom.trim()) && !sansVille)] : []), accord];
  const faites = etapes.filter(Boolean).length;
  async function choisir(f: File | undefined) {
    setErreur("");
    if (!f) return;
    try {
      setPhoto(await reduireImage(f, 1600));
    } catch {
      setErreur("Cette photo n’a pas pu être lue. Essaie une autre photo.");
    }
  }
  async function partir() {
    setEnvoi(true);
    setErreur("");
    try {
      const j = await demander({
        action: "photo",
        photo,
        accord,
        ...(prenom.trim() ? { prenom: prenom.trim() } : {}),
        ...(etat.compte ? {} : { ville }),
        ...(univers.trim() ? { univers: univers.trim() } : {}),
      });
      // 📈 la mesure : quelqu'un arrivé par un mème crée sa figurine
      const origine = !etat.compte ? idARepondre() : "";
      if (origine) noterGeste("nouveau", origine);
      if (j.etat) onEnvoye(j.etat);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
    }
  }
  let n = 0;
  return (
    <div className="tf-photo tf-quete" id="creer">
      <header className="tf-quete-tete">
        <small>TA QUÊTE · {etat.auto === false ? "QUELQUES JOURS" : "1 MINUTE"} · GRATUIT</small>
        <b className="tf-titre">Crée ta figurine</b>
        <span className="tf-quete-jauge" role="progressbar" aria-valuemin={0} aria-valuemax={etapes.length} aria-valuenow={faites}>
          <i style={{ width: `${(faites / etapes.length) * 100}%` } as CSSProperties} />
        </span>
      </header>
      {etat.refus && (
        <p className="tf-refus" role="alert">
          Ta photo précédente n’a pas pu servir : {etat.refus}
        </p>
      )}
      <ol className="tf-etapes">
        <li className={photo ? "fait" : "maintenant"}>
          <span className="tf-num">{photo ? "✓" : ++n}</span>
          <div>
            <b>Ta photo</b>
            <small>De face, bien éclairée, seul{"(e)"} sur la photo. Un sourire ? Encore mieux.</small>
            <label className="tf-choisir">
              <input type="file" accept="image/*" onChange={(e) => choisir(e.target.files?.[0])} />
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Ta photo" />
              ) : (
                <span>📷 Choisir ma photo</span>
              )}
            </label>
          </div>
        </li>
        {(demandePrenom || demandeVille) && (
          <li className={etapes[1] ? "fait" : photo ? "maintenant" : ""}>
            <span className="tf-num">{etapes[1] ? "✓" : ++n}</span>
            <div>
              <b>Toi</b>
              {demandePrenom && (
                <input
                  className="tf-prenom-photo"
                  value={prenom}
                  maxLength={PRENOM_MAX}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Ton prénom (tes proches le verront)"
                  aria-label="Ton prénom"
                  autoComplete="given-name"
                />
              )}
              {demandeVille && (
                <select className="tf-ville" value={ville} onChange={(e) => setVille(e.target.value)} aria-label="Ta ville">
                  <option value="">Ta ville…</option>
                  {villes.map((v) => (
                    <option key={v.slug} value={v.slug}>
                      {v.nom}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </li>
        )}
        <li className={univers.trim() ? "fait" : ""}>
          <span className="tf-num">{univers.trim() ? "✓" : "✨"}</span>
          <div>
            <b>Ce qui te ressemble</b>
            <small>Ton métier ou ta passion : ta figurine s’habille en conséquence. Facultatif.</small>
            <input
              className="tf-univers"
              value={univers}
              maxLength={UNIVERS_MAX}
              onChange={(e) => setUnivers(e.target.value)}
              placeholder="Artisan, boulangère, fan de vélo, musicien…"
              aria-label="Ton métier ou ta passion"
            />
          </div>
        </li>
        <li className={accord ? "fait" : ""}>
          <span className="tf-num">{accord ? "✓" : ++n}</span>
          <label className="tf-accord">
            <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} />
            <span>C’est bien moi sur la photo, et j’accepte que ClikMe en fasse ma figurine.</span>
          </label>
        </li>
      </ol>
      <button type="button" className={`tf-envoyer tf-go${faites === etapes.length ? " pret" : ""}`} disabled={!photo || !accord || sansVille || envoi} onClick={partir}>
        {envoi ? "Envoi…" : "✨ Donner vie à ma figurine"}
      </button>
      {erreur && (
        <p className="tf-erreur" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}

/** Ce que dit le guide pendant que le moteur fabrique (selon le temps passé). */
const PENDANT = [
  { s: 0, dit: "Je regarde ta photo… je vois déjà ta figurine ! 👀" },
  { s: 15, dit: "Je sculpte ta tête. Et ta coiffure, avec soin 💇" },
  { s: 55, dit: "Je peins tes yeux, tes joues… presque fini !" },
  { s: 90, dit: "Je lui apprends à parler 🗣️ Encore un instant…" },
];

/**
 * 🛠️ SA FIGURINE SE FABRIQUE (le moteur d'image) : le guide raconte ce qui se passe ; la page rappelle le serveur tant que ce
 * n'est pas fini — sa figurine, puis sa bouche ouverte —, avec une jauge qui avance (deux minutes environ).
 */
export function FabricationAuto({ etat, onEtat }: { etat: EtatMaFigurine; onEtat: (e: EtatMaFigurine) => void }) {
  const boite = useRef<HTMLDivElement>(null);
  const [erreur, setErreur] = useState("");
  // elle vient à l'écran (on était plus bas, sur le formulaire de la photo) — entre accolades : les navigateurs récents
  // rendent une promesse de `scrollIntoView`, que React prenait pour son nettoyage (« destroy is not a function » : la
  // page plantait, 5 novembre 2026)
  useEffect(() => {
    void boite.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);
  const [tour, setTour] = useState(0);
  const [secondes, setSecondes] = useState(0);
  // 5 novembre 2026 (« une fois que la figurine est faite, le site bug ») : la page n'abandonne plus au bout de dix
  // appels (elle restait figée à 95 %) ; elle attend tant que le serveur fabrique, et une coupure (réseau, serveur
  // trop long) ne l'arrête pas : elle rappelle. Seule une vraie erreur du serveur s'affiche.
  useEffect(() => {
    let fini = false;
    const t0 = Date.now();
    const minuteur = window.setInterval(() => setSecondes((Date.now() - t0) / 1000), 1000);
    const pause = (ms: number) => new Promise((ok) => window.setTimeout(ok, ms));
    (async () => {
      let coupures = 0;
      while (!fini && Date.now() - t0 < 15 * 60_000) {
        let r: Response;
        let j: Reponse;
        try {
          r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "fabriquer" }) });
          j = (await r.json().catch(() => ({}))) as Reponse;
        } catch {
          // (le réseau a coupé : on rappelle)
          if (++coupures > 6) break;
          await pause(10_000);
          continue;
        }
        if (fini) return;
        if (j.etat && j.etat.etape !== "fabrication") return onEtat(j.etat);
        if (!r.ok) {
          // UNE VRAIE ERREUR DU SERVEUR (photo refusée, plus d'essais…) : elle s'affiche ; une coupure (pas de message) : on rappelle
          if (j.error && r.status < 500) return setErreur(j.error);
          if (j.error && r.status === 502) return setErreur(j.error);
          if (++coupures > 6) break;
          await pause(10_000);
          continue;
        }
        coupures = 0;
        await pause(j.enCours ? 12_000 : 3_000);
      }
      if (!fini) setErreur("Ta figurine prend plus de temps que prévu. Touche « Réessayer » : elle est peut-être déjà prête.");
    })();
    return () => {
      fini = true;
      window.clearInterval(minuteur);
    };
  }, [tour, onEtat]);
  const avance = Math.min(0.95, secondes / 150);
  const pas = secondes < 8 ? 0 : secondes < 75 ? 1 : 2;
  const k = Math.max(0, PENDANT.filter((x) => secondes >= x.s).length - 1);
  const dit = PENDANT[k].dit;
  // 🎙️ PABLITO LE DIT À VOIX HAUTE (ses enregistrements), étape après étape ; « Oups… » si ça n'a pas marché
  const sonFab = SONS_PABLITO[erreur ? "pablito-fabrication-oups" : `pablito-fabrication-${k + 1}`];
  const parleFab = useVoixPablito(sonFab);
  return (
    <div className="tf-fab" aria-live="polite" ref={boite}>
      <div className="tf-fab-scene">
        <span className="tf-fab-clik" aria-hidden="true">
          <Guide key={erreur || dit} parle={sonFab ? parleFab : !erreur} bref={!sonFab} visage={erreur ? "tristesse" : "joie"} />
        </span>
        <p className="tf-fab-bulle">{erreur ? "Oups… ça n’a pas marché cette fois." : dit}</p>
      </div>
      <b className="tf-titre">{erreur ? "Ta figurine n’a pas pu être faite" : "On fabrique ta figurine…"}</b>
      {erreur ? (
        <>
          <p className="tf-erreur" role="alert">
            {erreur}
          </p>
          <div className="tf-refaire">
            <button
              type="button"
              onClick={() => {
                setErreur("");
                setSecondes(0);
                setTour((x) => x + 1);
              }}
            >
              🔁 Réessayer
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const j = await demander({ action: "refaire", autrePhoto: true });
                  if (j.etat) onEtat(j.etat);
                } catch (e) {
                  setErreur((e as Error).message);
                }
              }}
            >
              📸 Une autre photo
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="tf-fab-jauge" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(avance * 100)}>
            <i style={{ width: `${avance * 100}%` } as CSSProperties} />
          </span>
          <ol>
            <li className="fait">✓ Ta photo est arrivée</li>
            <li className={pas > 1 ? "fait" : pas === 1 ? "maintenant" : ""}>{pas > 1 ? "✓" : "🎨"} On sculpte ta figurine{etat.prenom ? `, ${etat.prenom}` : ""}</li>
            <li className={pas === 2 ? "maintenant" : ""}>🗣️ On lui apprend à parler</li>
          </ol>
          <p className="tf-note">Deux minutes environ. Tu peux rester ici : elle apparaît toute seule.</p>
        </>
      )}
    </div>
  );
}

/**
 * 🗣️ L'ONGLET « MA FIGURINE » — sa figurine prête : où en est sa figurine du mois, la faire parler (`StudioMoi`) ;
 * sinon, l'accueil du guide (ce qu'il faut faire, et ce que ça permettra ensuite), la quête « Crée ta figurine » (5 novembre
 * 2026 : la démonstration a quitté la page ; 6 novembre : « Comment ça marche » aussi, le guide l'explique déjà).
 */
export function OngletFigurine({ etat, villes, onEtat }: { etat: EtatMaFigurine | null; villes: { slug: string; nom: string }[]; onEtat: (e: EtatMaFigurine) => void }) {
  // 💬 `?repondre=<id>` : gardé sur l'appareil — sans figurine, il la crée d'abord, et sa réponse l'attend
  useEffect(() => {
    try {
      const u = new URL(window.location.href).searchParams.get("repondre");
      if (u && /^[a-z0-9]{12}$/.test(u)) window.localStorage.setItem(CLE_REPONDRE, u);
    } catch {
      /* rien */
    }
  }, []);
  if (!etat)
    return (
      <div className="mc-attente" aria-label="Chargement">
        <i />
      </div>
    );
  if (etat.etape === "prete" && etat.neutre && etat.parle)
    return (
      <>
        <header className="og-tete og-tete-fig">
          <span>
            <small>TA FIGURINE</small>
            <h1>Fais-la parler.</h1>
          </span>
          {/* 🗓️ sa figurine du mois (lot 3) : où il en est, en une pastille */}
          <ApercuDuMois />
        </header>
        <StudioMoi key={etat.neutre} etat={etat} onEtat={onEtat} />
        {/* 🔐 son adresse protège sa figurine (lot 2) : un autre téléphone la retrouve avec un code */}
        <ProtegerFigurine mode="proteger" protegee={etat.protegee} />
      </>
    );
  if (etat.etape === "fabrication")
    return etat.auto ? (
      <FabricationAuto etat={etat} onEtat={onEtat} />
    ) : (
      <Annonce titre="On fabrique ta figurine 🛠️">Ta photo est bien arrivée. Ta figurine sera ici dans quelques jours : tu pourras la faire parler et l’envoyer à tes proches.</Annonce>
    );
  if (etat.etape === "bientot") return <Annonce titre="Ta figurine arrive très bientôt 🛠️">Reviens ici dans quelques jours pour envoyer ta photo.</Annonce>;
  return (
    <>
      {/* SES MOTS (5 novembre 2026, du patron : « orienter directement les avantages, comme ceci ») */}
      <GuideDit
        cle="pablito-accueil"
        popup
        actionDehors={false}
        repliques={[
          { t: "Salut ! Moi, c’est Pablito !", v: "joie", apres: "louche" },
          { t: "Ici, tu vas créer TA figurine, à partir de ton visage. C’est gratuit et ça prend 1 minute !", v: "neutre" },
          { t: "Elle pourra parler à ta place, changer d’expression, danser, rire et faire des grimaces. Bref, elle te ressemble… en plus drôle !", v: "rire", apres: "grimace" },
          { t: "Et après ? Tu peux lui faire dire et faire faire ce que tu veux, et l’envoyer à tes amis.", v: "joie" },
          {
            t: "Et 1 fois par jour, elle pourra rencontrer la figurine d’un ami ou d’une nouvelle personne près de chez toi. Pendant quelques minutes, vos 2 figurines discuteront, réagiront et s’amuseront ensemble : tu seras juste spectateur.",
            v: "neutre",
          },
          { t: "Et à la fin, tu pourras découvrir ce qui a été partagé et, si vous êtes d’accord, échanger vos impressions.", v: "joie" },
          { t: "À chaque rencontre, une carte souvenir est créée. De quoi enrichir ta collection et faire évoluer ton univers !", v: "euphorie" },
          { t: "Allez, à toi de jouer !", v: "joie", apres: "louche" },
        ]}
      >
        <a className="og-go" href="#creer">
          📸 Je crée ma figurine
        </a>
      </GuideDit>
      <EnvoiPhoto etat={etat} villes={villes} onEnvoye={onEtat} />
      {/* 🔎 elle existe déjà sur un autre téléphone : un code à six chiffres la retrouve (lot 2) */}
      {!etat.compte && <ProtegerFigurine mode="retrouver" />}
    </>
  );
}

export const STYLES_MA_FIGURINE =
  STYLES_FIGURINE_QUI_PARLE +
  STYLES_GUIDE +
  `
.tf{display:grid;gap:18px}
.tf > *{min-width:0}
.tf-scene{display:flex;flex-direction:column;align-items:center;gap:14px}
.tf-fig .fqp-fig{width:min(300px,76vw);border-radius:30px;box-shadow:0 30px 60px -24px rgba(0,0,0,.95),0 0 0 1px rgba(255,255,255,.08)}
.tf-expr{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;width:100%;max-width:420px}
.tf-danse{padding:9px 16px;border-radius:999px;border:1.5px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:14px;font-weight:900;cursor:pointer}
.tf-danse.pris{border-color:#F2C46B;background:rgba(242,196,107,.2)}
.tf-expr button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 2px 7px;border-radius:16px;border:0;background:rgba(255,255,255,.07);color:#E8D3DC;font:inherit;font-size:11.5px;font-weight:800;cursor:pointer;transition:transform .15s,background .2s,color .2s}
.tf-expr button span{font-size:26px;line-height:1.1}
.tf-expr button.pris{background:#FFF4E6;color:#2A0F1F;transform:translateY(-2px)}
.tf-panneau{display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:24px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}
.tf-q{font-size:13px;font-weight:900;letter-spacing:.02em;color:#F2C46B}
.tf-q small{font-weight:700;color:#A88E99}
.tf-scene .tf-panneau .tf-voir{align-self:center;font-size:13px;font-weight:800;color:#FF9FD2;text-decoration:none}
.tf-texte textarea:disabled{opacity:.6}
.tf-voix{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.tf-refaire-univers{display:flex;flex-direction:column;gap:6px;width:100%;font-size:13px;color:#D9C3CB;text-align:left}
.tf-quelle-voix{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:16px;background:rgba(255,46,154,.1);border:1.5px solid rgba(255,46,154,.45)}
.tf-quelle-voix b{font-size:15px;font-weight:900}
.tf-quelle-voix span{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.tf-quelle-voix button{padding:12px 6px;border-radius:14px;border:1.5px solid rgba(255,255,255,.18);background:rgba(0,0,0,.2);color:#FFF4E6;font:inherit;font-size:14px;font-weight:900;cursor:pointer}
.tf-voix button{display:flex;flex-direction:column;align-items:center;gap:1px;padding:8px 2px;border-radius:14px;border:1.5px solid rgba(255,255,255,.12);background:rgba(0,0,0,.18);color:#FFF4E6;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
.tf-voix button span{font-size:20px}
.tf-voix button.pris{border-color:#FF2E9A;background:rgba(255,46,154,.16)}
.tf-voix button:disabled{opacity:.4;cursor:default}
.tf-modes{display:grid;grid-template-columns:1fr 1fr;padding:4px;border-radius:999px;background:rgba(0,0,0,.25)}
.tf-modes button{padding:10px;border:0;border-radius:999px;background:none;color:#D9C3CB;font:inherit;font-size:14px;font-weight:800;cursor:pointer}
.tf-modes button.pris{background:#FFF4E6;color:#2A0F1F}
.tf-texte{position:relative;display:block}
.tf-texte textarea{display:block;width:100%;box-sizing:border-box;padding:12px 14px 24px;border-radius:16px;border:1.5px solid rgba(255,255,255,.15);background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:16px;line-height:1.4;resize:none}
.tf-texte textarea:focus{outline:none;border-color:#FF2E9A}
.tf-texte small{position:absolute;right:12px;bottom:8px;font-size:11px;color:#A88E99}
.tf-ecouter,.tf-envoyer,.tf-micro{padding:15px 22px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}
.tf-ecouter:disabled,.tf-envoyer:disabled{opacity:.55;box-shadow:none}
.tf-micro{background:#FFF4E6;color:#2A0F1F;box-shadow:none}
.tf-stop{background:#E34948}
.tf-ligne{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.tf-aide,.tf-note{margin:0;font-size:13px;line-height:1.4;color:#D9C3CB}
.tf-note{text-align:center}
.tf-temps{position:relative;display:block;height:46px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}
.tf-temps i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,rgba(227,73,72,.55),rgba(255,46,154,.55))}
.tf-temps b{position:relative;display:grid;place-items:center;height:100%;font-size:15px}
.tf-envoi{display:flex;flex-direction:column;gap:10px;margin-top:4px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)}
.tf-cites{margin:0;padding:0;border:0;display:flex;flex-wrap:wrap;gap:6px}
.tf-cites legend{margin-bottom:6px;padding:0;font-size:13px;font-weight:900;color:#F2C46B}
.tf-cites label{position:relative;display:flex;align-items:center;gap:6px;padding:5px 12px 5px 5px;border-radius:999px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.14);font-size:13px;font-weight:700;cursor:pointer}
.tf-cites label.pris{background:rgba(255,46,154,.18);border-color:#FF2E9A}
.tf-cites input{position:absolute;opacity:0;pointer-events:none}
.tf-cites img{width:26px;height:26px;border-radius:50%;object-fit:contain;background:rgba(255,255,255,.1)}
.tf-pret{display:flex;flex-direction:column;gap:8px;text-align:center}
.tf-wa{display:block;padding:16px;border-radius:999px;background:#1FA855;color:#fff;font-size:17px;font-weight:900;text-decoration:none;box-shadow:0 12px 26px -12px rgba(31,168,85,.9)}
.tf-wa::before{content:"💬 "}
.tf-autres{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
.tf-autres a,.tf-autres button{padding:10px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:14px;font-weight:800;text-decoration:none;cursor:pointer}
.tf-adresse{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.3);color:#A88E99;font:inherit;font-size:12.5px;text-align:center}
.tf-erreur,.tf-refus{margin:0;font-size:13.5px;color:#FFB4B4}
.tf-messages summary{padding:6px 0;font-size:13.5px;font-weight:800;cursor:pointer;color:#D9C3CB}
.tf-messages ul{margin:6px 0 0;padding:0;list-style:none;display:grid;gap:6px}
.tf-messages li{display:flex;justify-content:space-between;gap:10px;font-size:13px;color:#A88E99}
.tf-messages a{color:#FFF4E6;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tf-expr button,.tf-voix button{position:relative}
.tf-expr button.ferme,.tf-voix button.ferme{opacity:.55;filter:grayscale(.6)}
.tf-modes button.ferme{opacity:.6}
.tf-cadenas{position:absolute;right:3px;top:2px;font-style:normal;font-size:11px}
.tf-nudge{margin:0;padding:9px 14px;border-radius:14px;background:rgba(242,196,107,.14);border:1px solid rgba(242,196,107,.45);font-size:13px;line-height:1.4;text-align:center;color:#FFE7B8;animation:tf-vu .4s cubic-bezier(.2,1.5,.4,1)}
.tf-nudge a{color:#FF9FD2;font-weight:900}
.tf-refaire-lien{border:0;background:none;color:#A88E99;font:inherit;font-size:12.5px;text-decoration:underline;cursor:pointer}
.tf-refaire{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}
.tf-refaire button{padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
.tf-fig.tf-or .fqp-fig{box-shadow:0 0 0 4px #F2C46B,0 0 40px rgba(255,214,120,.55),0 30px 60px -24px rgba(0,0,0,.95)}
.tf-options{min-width:0;display:flex;flex-direction:column;gap:8px;margin-top:6px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)}
.tf-options ol{display:flex;gap:6px;max-width:100%;margin:0;padding:0 0 4px;list-style:none;overflow-x:auto;scrollbar-width:none}
.tf-options ol::-webkit-scrollbar{display:none}
.tf-options li{flex:none;display:flex;flex-direction:column;align-items:center;gap:1px;width:86px;padding:9px 4px 8px;border-radius:16px;text-align:center;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}
.tf-options li > span{font-size:22px;line-height:1.1}
.tf-options li b{font-size:11.5px;line-height:1.15}
.tf-options li small{font-size:10.5px;font-weight:800;color:#A88E99}
.tf-options li.ouverte{background:rgba(61,226,166,.1);border-color:rgba(61,226,166,.45)}
.tf-options li.ouverte small{color:#7FF0C4}
.tf-options li.suivante{border:1.5px solid #F2C46B;box-shadow:0 0 18px -4px rgba(242,196,107,.7);animation:ab-pouls 2s ease-in-out infinite}
.tf-options li.suivante small{color:#F2C46B}
.tf-options li.fermee{opacity:.55}
.tf-options-dit{margin:0;font-size:13px;line-height:1.4;color:#D9C3CB}
.tf-kdo{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.tf-options .tf-kdo li{flex:0 1 auto;max-width:100%;min-width:0;display:inline-flex;flex-direction:row;align-items:center;gap:5px;width:auto;padding:5px 11px 5px 8px;border-radius:999px;text-align:left;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);font-size:12px;font-weight:800;line-height:1.25;color:#D9C3CB;opacity:1;animation:none;box-shadow:none}
.tf-options .tf-kdo li span{font-size:14px}
.tf-options .tf-kdo li.faite{background:rgba(61,226,166,.1);border-color:rgba(61,226,166,.45);color:#BFF7E2}
.tf-options .tf-kdo li.suivante{border-color:#F2C46B;color:#FFF4E6;box-shadow:0 0 14px -4px rgba(242,196,107,.7)}
.tf-options-dit a{color:#FF9FD2;font-weight:900}
.tf-fab{display:flex;flex-direction:column;align-items:center;gap:12px;padding:22px 18px;border-radius:24px;text-align:center;background:rgba(255,255,255,.06);border:1px solid rgba(242,196,107,.35)}
.tf-fab ol{display:grid;gap:6px;margin:0;padding:0;list-style:none;text-align:left}
.tf-fab li{font-size:14px;color:#A88E99}
.tf-fab li.fait{color:#7FF0C4}
.tf-fab li.maintenant{color:#FFF4E6;font-weight:800}
.tf-fab-jauge{position:relative;display:block;width:100%;max-width:300px;height:8px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
.tf-fab-jauge i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B);transition:width 1s linear}
.tf-prenom-photo,.tf-ville,.tf-univers{width:100%;max-width:340px;box-sizing:border-box;padding:12px 14px;border-radius:14px;border:1.5px solid rgba(255,255,255,.15);background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:16px}
.tf-ville option{color:#2A0F1F}
.tf-jauge{position:relative;display:block;height:10px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
.tf-jauge i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B)}
.tf-annonce-clik{display:block;width:120px;filter:drop-shadow(0 12px 14px rgba(0,0,0,.45))}
.tf-photo.tf-quete{align-items:stretch;text-align:left;gap:14px;background:linear-gradient(180deg,rgba(255,46,154,.12),rgba(255,255,255,.04));border:1.5px solid rgba(255,46,154,.45);box-shadow:0 24px 50px -30px rgba(255,46,154,.8)}
.tf-quete-tete{display:flex;flex-direction:column;gap:4px}
.tf-quete-tete small{font-size:11px;font-weight:900;letter-spacing:.12em;color:#F2C46B}
.tf-quete .tf-titre{font-size:26px;letter-spacing:-.02em}
.tf-quete-jauge{position:relative;display:block;height:10px;margin-top:4px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
.tf-quete-jauge i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B);transition:width .5s cubic-bezier(.2,1.2,.4,1)}
.tf-etapes{display:grid;gap:10px;margin:0;padding:0;list-style:none}
.tf-etapes li{display:grid;grid-template-columns:34px minmax(0,1fr);gap:10px;align-items:start;padding:12px;border-radius:18px;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.08);transition:border-color .3s,background .3s}
.tf-etapes li.maintenant{border-color:rgba(242,196,107,.7);background:rgba(242,196,107,.08)}
.tf-etapes li.fait{border-color:rgba(61,226,166,.45)}
.tf-etapes li > div{display:flex;flex-direction:column;gap:8px;min-width:0}
.tf-etapes li b{font-size:16px;font-weight:900}
.tf-etapes li small{font-size:12.5px;line-height:1.35;color:#D9C3CB}
.tf-num{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.1);font-weight:900;font-size:15px}
.tf-etapes li.maintenant .tf-num{background:#F2C46B;color:#2A1408;animation:tf-pouls 1.6s ease-in-out infinite}
.tf-etapes li.fait .tf-num{background:#3DE2A6;color:#08301F;animation:tf-coche .45s cubic-bezier(.2,1.6,.4,1)}
.tf-etapes .tf-choisir{margin-top:0;width:100%;max-width:220px;height:180px}
.tf-etapes .tf-accord{max-width:none;align-items:center}
.tf-go{font-size:18px;padding:17px 22px}
.tf-go.pret{animation:tf-brille 1.8s ease-in-out infinite}
.tf-fab-scene{display:grid;grid-template-columns:110px minmax(0,1fr);align-items:center;gap:8px;width:100%;max-width:380px}
.tf-fab-clik{display:block;filter:drop-shadow(0 12px 14px rgba(0,0,0,.45))}
.tf-fab-bulle{position:relative;margin:0;padding:12px 14px;border-radius:18px 18px 18px 6px;background:#FFF4E6;color:#2A0F1F;font-size:15px;font-weight:800;line-height:1.35;text-align:left}
.og-tete{display:flex;flex-direction:column;gap:4px;margin:0 0 16px}
.og-tete small{font-size:11.5px;font-weight:900;letter-spacing:.14em;color:#F2C46B}
.og-tete h1,.og-tete h2{margin:0;font-size:32px;line-height:1.04;font-weight:900;letter-spacing:-.035em;background:linear-gradient(135deg,#fff,#FFC8E6 50%,#F2C46B);-webkit-background-clip:text;background-clip:text;color:transparent}
.og-tete p{margin:2px 0 0;color:#D9C3CB}
.og-go{display:block;padding:15px 20px;border-radius:999px;background:#FF2E9A;color:#fff;font-size:16px;font-weight:900;text-align:center;text-decoration:none;box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}
.og-pouvoirs{margin-top:22px}
.og-pouvoirs h2{margin:0 0 6px;font-size:20px;font-weight:900}
.og-pouvoirs .tf-options{margin-top:0;padding-top:0;border-top:0}
.mqd + .tf-quete{margin-top:20px}
@keyframes tf-vu{from{transform:scale(.96)}}
@keyframes tf-pouls{0%,100%{box-shadow:0 0 0 0 rgba(242,196,107,.6)}50%{box-shadow:0 0 0 7px rgba(242,196,107,0)}}
@keyframes tf-coche{from{transform:scale(.3) rotate(-30deg)}}
@keyframes tf-brille{0%,100%{box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}50%{box-shadow:0 0 0 6px rgba(255,46,154,.25),0 16px 34px -10px rgba(255,46,154,1)}}
.tf-annonce,.tf-photo{display:flex;flex-direction:column;align-items:center;gap:8px;padding:22px 18px;border-radius:24px;text-align:center;background:rgba(255,255,255,.06);border:1px solid rgba(242,196,107,.35)}
.tf-annonce-emoji{font-size:42px;line-height:1}
.tf-annonce b,.tf-titre{font-size:20px;line-height:1.2;font-weight:900}
.tf-annonce p,.tf-photo p{margin:0;max-width:340px;font-size:14px;line-height:1.45;color:#D9C3CB}
.tf-choisir{position:relative;display:grid;place-items:center;width:170px;height:210px;margin-top:6px;border-radius:20px;border:2px dashed rgba(255,255,255,.3);background:rgba(255,255,255,.05);overflow:hidden;cursor:pointer;font-weight:800}
.tf-choisir input{position:absolute;inset:0;opacity:0;cursor:pointer}
.tf-choisir img{width:100%;height:100%;object-fit:cover}
.tf-accord{display:flex;gap:10px;align-items:flex-start;max-width:340px;text-align:left;font-size:13px;line-height:1.4;color:#D9C3CB}
.tf-accord input{flex:none;width:20px;height:20px;margin:0;accent-color:#FF2E9A}
/* ─── 6 novembre 2026 : la page en trois temps (sa figurine, son visage, « Fais-la parler »), le reste replié ─── */
.og-tete-fig{gap:10px}
.og-tete-fig .fm-apercu{align-self:flex-start;max-width:100%;box-sizing:border-box;gap:10px;padding:7px 12px 7px 9px;border-radius:999px}
.og-tete-fig .fm-apercu > span:first-child{font-size:20px}
.og-tete-fig .fm-apercu > span:nth-child(2){flex-direction:row;flex-wrap:wrap;align-items:center;column-gap:8px;row-gap:2px}
.og-tete-fig .fm-apercu b{font-size:13px}
.og-tete-fig .fm-apercu .fm-jours{order:3;flex-basis:100%;gap:3px}
.og-tete-fig .fm-apercu .fm-jours i{height:5px;max-width:14px}
.og-tete-fig .fm-apercu small{font-size:11.5px;font-weight:700;letter-spacing:0;color:#D9C3CB}
.og-tete-fig .fm-apercu em{font-size:12px}
.tf-hero{position:relative;display:flex;flex-direction:column;align-items:center}
.tf-gestes{position:relative;z-index:2;display:flex;justify-content:center;gap:10px;margin-top:-24px}
.tf-gestes button{display:inline-flex;align-items:center;gap:7px;padding:11px 18px;border:0;border-radius:999px;font:inherit;font-size:14.5px;font-weight:900;cursor:pointer;-webkit-tap-highlight-color:transparent;text-decoration:none;transition:transform .2s cubic-bezier(.2,1.6,.4,1)}
.tf-gestes button:active{transform:scale(.94)}
.tf-gestes button span{font-size:18px;line-height:1}
.tf-gestes .tf-danse{background:#FFF4E6;color:#2A0F1F;box-shadow:0 12px 26px -10px rgba(0,0,0,.9)}
.tf-gestes .tf-danse.pris{border:0;background:linear-gradient(135deg,#FF2E9A,#F2C46B);color:#fff;animation:tf-bat .6s ease-in-out infinite}
.tf-gestes .tf-refaire-lien{background:rgba(30,10,24,.82);color:#FFF4E6;text-decoration:none;font-size:13.5px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16),0 12px 26px -10px rgba(0,0,0,.9);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.tf-gestes .tf-refaire-lien.pris{box-shadow:inset 0 0 0 1.5px #F2C46B}
.tf-refaire{flex-direction:column;align-items:stretch;width:100%;max-width:420px;box-sizing:border-box;padding:14px;border-radius:20px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}
.tf-refaire > b{font-size:15px}
.tf-q-visage{align-self:flex-start;margin:4px 0 -6px}
.tf-scene .tf-expr{display:flex;gap:8px;max-width:100%;padding:6px 2px 10px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;-webkit-mask-image:linear-gradient(90deg,#000 88%,transparent);mask-image:linear-gradient(90deg,#000 88%,transparent)}
.tf-scene .tf-expr::-webkit-scrollbar{display:none}
.tf-scene .tf-expr button{flex:none;width:74px;min-height:72px;scroll-snap-align:start;justify-content:center;border-radius:20px}
.tf-scene .tf-expr button span{font-size:28px}
.tf-expr button.cours{cursor:default;color:#F2C46B;background:rgba(242,196,107,.08)}
.tf-expr button.cours span{opacity:.45;filter:grayscale(.5)}
.tf-expr button.cours::after{content:"";position:absolute;inset:4px;border-radius:16px;border:2px solid transparent;border-top-color:#F2C46B;border-right-color:rgba(242,196,107,.35);animation:tf-tourne 1s linear infinite}
.tf-expr-cours{font-style:normal;font-size:9.5px;font-weight:800;line-height:1.1}
.tf-expr-neuf{position:absolute;top:4px;right:6px;font-style:normal;font-size:12px}
.tf-scene .tf-note{margin:0;padding:8px 12px;border-radius:14px;background:rgba(242,196,107,.1);font-size:12.5px;color:#FFE7B8}
/* 🗓️ ses looks : ses figurines du mois, en vignettes */
.tf-looks{display:flex;gap:8px;max-width:100%;padding:6px 2px 10px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none}
.tf-looks::-webkit-scrollbar{display:none}
.tf-looks button{position:relative;flex:none;display:flex;flex-direction:column;align-items:center;gap:4px;width:86px;padding:6px 6px 8px;border-radius:20px;border:2px solid transparent;background:rgba(255,255,255,.07);color:#E8D3DC;font:inherit;font-size:11.5px;font-weight:800;cursor:pointer;scroll-snap-align:start;transition:transform .15s,border-color .2s}
.tf-looks img{width:70px;height:84px;object-fit:cover;object-position:50% 20%;border-radius:14px;background:#2a0f1f}
.tf-looks button.pris{border-color:#FF2E9A;background:rgba(255,46,154,.16);color:#FFF4E6;transform:translateY(-2px);box-shadow:0 10px 20px -10px rgba(255,46,154,.9)}
.tf-looks button.cours{cursor:default;color:#F2C46B}
.tf-looks button.cours img{opacity:.5;filter:grayscale(.4)}
.tf-looks button.cours::after{content:"";position:absolute;left:50%;top:34px;width:26px;height:26px;margin-left:-13px;border-radius:50%;border:3px solid transparent;border-top-color:#F2C46B;animation:tf-tourne 1s linear infinite}
.tf-looks em{font-style:normal;font-size:9.5px;line-height:1.1;text-align:center}
.tf-parle-tete{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.tf-parle-tete .tf-q{font-size:17px;letter-spacing:0;color:#FFF4E6}
.tf-parle-tete .tf-modes{display:inline-grid;grid-template-columns:auto auto}
.tf-parle-tete .tf-modes button{padding:8px 12px;font-size:13px}
.tf-voix-choisie{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.22);color:#D9C3CB;font:inherit;font-size:13.5px;cursor:pointer}
.tf-voix-choisie b{color:#FFF4E6}
.tf-voix-choisie em{font-style:normal;font-weight:800;color:#FF9FD2;margin-left:4px}
.tf-replis{display:flex;flex-direction:column;gap:8px}
.tf-replis details{border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}
.tf-replis .tf-options{display:block;margin:0;padding:0 14px;border-top:0}
.tf-replis summary{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:13px 0;list-style:none;cursor:pointer;font-size:14.5px;font-weight:900;color:#FFF4E6}
.tf-replis summary::-webkit-details-marker{display:none}
.tf-replis summary::after{content:"›";margin-left:auto;font-size:20px;line-height:1;color:#A88E99;transition:transform .2s}
.tf-replis details[open] summary::after{transform:rotate(90deg)}
.tf-replis summary em{font-style:normal;padding:1px 8px;border-radius:999px;background:rgba(255,46,154,.2);color:#FFC8E6;font-size:12px}
.tf-replis summary small{order:3;flex-basis:100%;font-size:12.5px;font-weight:700;color:#A88E99}
.tf-replis .tf-kdo{padding-bottom:10px}
.tf-replis .tf-options-dit{padding-bottom:14px}
.tf-replis .tf-messages{padding:0 14px}
.tf-replis .tf-messages summary{padding:13px 0;font-size:14.5px;color:#FFF4E6}
.tf-replis .tf-messages ul{padding-bottom:12px}
.tf-meme-toile{display:none;width:min(260px,70vw);aspect-ratio:9/16;height:auto;margin:4px auto 0;border-radius:22px;background:#1E0918;box-shadow:0 0 0 3px #F2C46B,0 24px 44px -18px rgba(0,0,0,.95)}
.tf-meme-toile.visible{display:block;animation:tf-vu .4s cubic-bezier(.2,1.5,.4,1)}
.tf-meme-cours{display:flex;flex-direction:column;align-items:center;gap:8px;padding:6px 0}
.tf-meme-cours b{font-size:15px}
.tf-meme-jauge{display:block;width:100%;max-width:260px;height:8px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden}
.tf-meme-jauge i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B);transition:width .2s linear}
.tf-meme-pret{display:flex;flex-direction:column;align-items:center;gap:10px}
.tf-meme-pret > b{font-size:16px;font-weight:900;color:#7FF0C4}
.tf-meme-video{display:block;width:min(240px,64vw);aspect-ratio:9/16;border-radius:20px;object-fit:cover;background:#1E0918;box-shadow:0 0 0 3px #F2C46B,0 24px 44px -18px rgba(0,0,0,.95);cursor:pointer}
.tf-partager-meme{background:linear-gradient(135deg,#FF2E9A,#FF7A59)!important}
.tf-partager-meme::before{content:none!important}
.tf-meme-pret .tf-wa{width:100%;box-sizing:border-box;border:0;font:inherit;font-size:16px;font-weight:900;cursor:pointer}
.tf-meme-pret .tf-autres{justify-content:center}
.tf-meme-pret .tf-adresse{width:100%;box-sizing:border-box}
.tf-public{padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#E8D3DC;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer}
.tf-public.pris{border-color:rgba(61,226,166,.6);background:rgba(61,226,166,.12);color:#9BF2CF}
.tf-reponse{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:18px;background:linear-gradient(135deg,rgba(255,46,154,.2),rgba(242,196,107,.14));border:1.5px solid rgba(242,196,107,.5)}
.tf-reponse img{flex:none;width:48px;height:64px;border-radius:12px;object-fit:cover;background:#2A0F1F}
.tf-reponse span{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.tf-reponse b{font-size:15px;font-weight:900}
.tf-reponse small{font-size:12.5px;color:#FFE7B8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tf-reponse em{font-style:normal;font-size:12px;color:#D9C3CB}
.tf-reponse button{flex:none;width:32px;height:32px;border:0;border-radius:50%;background:rgba(0,0,0,.3);color:#fff;font-size:14px;cursor:pointer}
.tf-prets{display:flex;gap:6px;margin:0 -16px;padding:2px 16px 6px;overflow-x:auto;scrollbar-width:none}
.tf-prets::-webkit-scrollbar{display:none}
.tf-prets button{flex:none;display:inline-flex;align-items:center;gap:5px;padding:8px 13px;border-radius:999px;border:1.5px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#FFF4E6;font:inherit;font-size:13px;font-weight:800;white-space:nowrap;cursor:pointer}
.tf-prets button:first-child{border-color:rgba(242,196,107,.7);background:rgba(242,196,107,.14)}
.tf-prets button.pris{border-color:#FF2E9A;background:rgba(255,46,154,.22)}
.tf-premier{margin:0;padding:8px 12px;border-radius:14px;background:rgba(127,240,196,.1);border:1px solid rgba(127,240,196,.35);font-size:13px;font-weight:700;color:#BFF7E2}
@keyframes tf-tourne{to{transform:rotate(360deg)}}
@keyframes tf-bat{0%,100%{transform:scale(1)}15%{transform:scale(1.07)}}
@media (min-width:860px){
  .tf{grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center;gap:40px}
  .tf-fig .fqp-fig{width:340px}
  .tf-panneau{padding:22px}
  .tf-replis{grid-column:1/-1}
}
`;
