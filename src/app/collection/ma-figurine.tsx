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
 *     demande) ; tout y est ouvert dès le départ (5 novembre 2026, le lot 3) ; la progression, c'est sa figurine du
 *     mois (`figurine-du-mois.tsx`) — « Tes premiers pas » et le mème du jour ont quitté la page le 8 novembre 2026 ;
 *   · `OngletFigurine` : l'onglet entier — l'accueil du guide, la figurine du patron de ClikMe (`guide.tsx`), la quête
 *     `EnvoiPhoto` (« Crée ta figurine », dès le départ, sans compte), `FabricationAuto` (le moteur la fabrique, le guide raconte),
 *     `Annonce` (sans moteur : ClikMe la fait à la main). La démonstration qu'on faisait parler (`StudioDemo`) est
 *     partie le 5 novembre 2026 : « elle ne sert plus à rien maintenant ».
 * La règle est dans `lib/direct/ma-figurine.ts`.
 *
 * 🧭 « CRÉER » EN TROIS ÉTAPES (9 novembre 2026, un ami du propriétaire : « on a beaucoup d'options, on s'y perd, on ne
 * sait pas à quoi elles servent ») : en haut, sa figurine seule — l'aperçu de son mème, qui se fait vignette quand on
 * fait défiler (`tf-mini`) ; deux onglets nommés par ce qu'on veut faire, « 💬 Faire un mème » et « ⚡ Répondre vite » ;
 * le mème en trois étapes numérotées — ① ce qu'elle dit (« 🎲 Pas d'idée ? » ouvre les aides, dans une `Feuille`), ②
 * comment elle le dit (les trois façons ; « son visage, au choix » dans une `Feuille`), ③ sa voix, et « Elle danse en
 * parlant » — ; puis « 🎬 Créer mon mème ». « Visage », « Animer » et « La refaire » ont quitté le dessous de la
 * figurine (les gags sont dans « Répondre vite », « La refaire » dans « Moi » : `RefaireMaFigurine`). Voir
 * `docs/figurines.md`, 9.0 unvicies (avant : les tiroirs, 9.0 decitricies).
 *
 * 🪜 ÉCRAN PAR ÉCRAN (10 novembre 2026, le propriétaire : « c'est encore très confus quand on fait défiler ; ne
 * faudrait-il pas un seul écran, on valide une action, alors un autre écran arrive ? ») : une seule étape à l'écran
 * (`etape`), sous sa figurine ; la barre « 1 Ce qu'elle dit · 2 Le ton · 3 Sa voix » (une étape faite se rouvre d'un
 * toucher) ; en bas, toujours à portée, « Suivant ➔ » et « ‹ Retour » ; à la ③, « 🎬 Créer mon mème ». La ② est
 * facultative ; on ne passe la ① qu'avec une phrase (ou sa voix enregistrée). Le tuto ouvre l'étape dont il parle
 * (`EVT_TUTO_OUVRIR`). Voir `docs/figurines.md`, 9.0 tervicies.
 */
import { useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ATTESTATION_AGE,
  ATTITUDES,
  REFUS_AGE,
  DUREE_MAX_MESSAGE,
  PRENOM_MAX,
  SENTIMENTS,
  TEXTE_MAX,
  UNIVERS_MAX,
  VOIX_DE_BASE,
  VISAGES_FIGURINE,
  VOIX_FIGURINE,
  estAttitude,
  sentimentDe,
  voixValide,
  type CleVoix,
  type EtatMaFigurine,
  type Sentiment,
} from "@/lib/direct/ma-figurine";
import { reduireImage } from "@/lib/direct/reduire-image";
import { FigurineQuiParle, STYLES_FIGURINE_QUI_PARLE, type FigurineHandle } from "./figurine-qui-parle";
import { Guide, OngletVisible, STYLES_GUIDE, useVoixPablito } from "./guide";
import { AtelierPablito, type Atelier } from "./atelier";
import { lancerMusiqueDanse } from "@/lib/direct/musique-danse";
import { fabriquerMeme, memePossible } from "@/lib/direct/meme";
import { STYLES_RENDU, motPour, type Rendu } from "@/lib/direct/rendus";
import { FACONS, TroisRendus } from "./trois-rendus";
import { PREMIER_MEME, memesDuMoment, type MemePret } from "@/lib/direct/memes-prets";
import type { Surprise } from "@/lib/direct/meme-surprise";
import { createClient } from "@/lib/supabase/client";
import { SONS_PABLITO } from "@/lib/direct/guide";
import { ProtegerFigurine } from "./connaitre";
import { demanderSonAge } from "./age";
import { useMois } from "./figurine-du-mois";
import { EVT_VERS_LE_STUDIO, prendreVersLeStudio, type PourAutour, type VersLeStudio } from "./vers-le-studio";
import { oublierLeDepot, revenirAuDepot } from "./depot-autour";
import { moisEnClair, type FigurineDuMois } from "@/lib/direct/figurine-du-mois";
import { MesReactions } from "./mes-reactions";
import { EVT_TUTO_OUVRIR } from "./tuto";
import { accordPublic } from "./fenetre";
import { InviterAppli } from "./mon-telephone";
import { nomVille, themeDuJour, type Theme } from "@/lib/direct/theme-du-jour";

type Reponse = { error?: string; etat?: EtatMaFigurine; lien?: string; son?: string; enCours?: boolean };

/** L'écran va à un endroit d'un onglet (« reactions », « jour »…) : `ma-collection.tsx` le dit, l'onglet suit. */
export const EVT_ANCRE = "clikme-ancre";

/**
 * 🪟 UNE FEUILLE, EN BAS DE L'ÉCRAN (son mème prêt ; « Ne perds jamais ta figurine ») : elle monte par-dessus la page,
 * se ferme d'un toucher sur le fond, sur ✕ ou avec « Échap ». Fermée, elle reste là, cachée (son mème continue de se
 * fabriquer dedans).
 */
export function Feuille({ ouverte, onFermer, titre, className = "", children }: { ouverte: boolean; onFermer: () => void; titre: string; className?: string; children: ReactNode }) {
  useEffect(() => {
    if (!ouverte) return;
    // (l'atelier de Pablito, par-dessus, se ferme d'abord : la feuille reste)
    const echap = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector(".atl-voile") && onFermer();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [ouverte, onFermer]);
  return (
    <div className={`tf-feuille${ouverte ? " ouverte" : ""}${className ? ` ${className}` : ""}`} role="dialog" aria-modal={ouverte} aria-label={titre} aria-hidden={!ouverte} inert={!ouverte}>
      <div className="tf-feuille-fond" onClick={onFermer} />
      <div className="tf-feuille-corps">
        <span className="tf-feuille-poignee" aria-hidden="true" />
        <button type="button" className="tf-feuille-fermer" aria-label="Fermer" onClick={onFermer}>
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

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
  const j = (await r.json().catch(() => ({}))) as Reponse & { age?: boolean };
  // (🔞 `age` : il n'a pas encore déclaré son âge — `age.ts` le lui demande)
  if (!r.ok) throw Object.assign(new Error(j.error || "Ça n’est pas parti. Réessaie dans un instant."), { age: Boolean(j.age) });
  return j;
}

/**
 * 🎁 SON PREMIER MÈME, PRÉPARÉ PENDANT LA FABRICATION (7 novembre 2026 : « le premier mème en moins d'une minute après
 * la révélation ; les 2 minutes de fabrication sont le moment le plus fragile ») : son texte, sa voix, et ce texte déjà
 * lu par sa voix — gardés sur ce téléphone jusqu'à son premier mème. À la révélation : « 🎭 Créer mon premier mème ».
 */
const CLE_PREMIER_MEME = "clikme-premier-meme-v1";
type PremierMeme = { texte: string; voix: CleVoix; son: string; duree: number };
function lirePremierMeme(): PremierMeme | null {
  try {
    const x = JSON.parse(window.localStorage.getItem(CLE_PREMIER_MEME) ?? "null") as Partial<PremierMeme> | null;
    if (!x || typeof x.texte !== "string" || !x.texte.trim() || typeof x.son !== "string" || !x.son.startsWith("data:audio")) return null;
    const voix = voixValide(x.voix);
    return voix ? { texte: x.texte, voix, son: x.son, duree: Number(x.duree) || 3 } : null;
  } catch {
    return null;
  }
}
function garderPremierMeme(p: PremierMeme | null) {
  try {
    if (p) window.localStorage.setItem(CLE_PREMIER_MEME, JSON.stringify(p));
    else window.localStorage.removeItem(CLE_PREMIER_MEME);
  } catch {
    /* (un navigateur privé : il le refera en un toucher) */
  }
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

/** 🧭 L'en-tête d'une étape (9 novembre 2026) : son numéro, ce qu'on y fait, à quoi ça sert ; à droite, un geste. */
function EnteteEtape({ n, id, titre, dit, children }: { n: number; id: string; titre: string; dit: string; children?: ReactNode }) {
  return (
    <div className="tf-etape-tete">
      <span className="tf-etape-n" aria-hidden="true">
        {n}
      </span>
      <span className="tf-etape-quoi">
        <b id={id}>{titre}</b>
        <small>{dit}</small>
      </span>
      {children}
    </div>
  );
}

/**
 * Ce qu'elle ressent : tous ses visages, ouverts dès le départ (le lot 3 — plus de cadenas). Un visage que le moteur
 * est en train de faire (« cours ») ne se choisit pas encore : il le dit (6 novembre 2026 : « toute la carte bouge
 * parce que l'expression n'est pas prête : prévenir qu'elle est en cours de création, et ne pas laisser cliquer ») —
 * le toucher rouvre l'atelier de Pablito, où il se fabrique (9 novembre 2026, `atelier.tsx`) ;
 * un visage pas encore fait (« creer ») porte une étincelle : le toucher le fait fabriquer. 🙆 SES ATTITUDES (8 novembre
 * 2026) : la même chose, dans leur propre rangée (`attitudes`) — un seul choix pour les deux.
 */
function ChoixExpression({ valeur, onChoix, etats = {}, attitudes = false }: { valeur: Sentiment | null; onChoix: (s: Sentiment | null) => void; etats?: Partial<Record<Sentiment, "cours" | "creer">>; attitudes?: boolean }) {
  const liste: readonly { cle: Sentiment | null; emoji: string; court: string }[] = attitudes ? ATTITUDES : [{ cle: null, emoji: "🙂", court: "Normal" }, ...VISAGES_FIGURINE];
  return (
    <div className={attitudes ? "tf-att" : "tf-expr"} role="radiogroup" aria-label={attitudes ? "Son attitude" : "Ce qu’elle ressent"}>
      {liste.map((x) => {
        const e = x.cle ? etats[x.cle] : undefined;
        return (
          <button
            key={x.cle ?? "normal"}
            type="button"
            role="radio"
            aria-checked={valeur === x.cle}
            className={`${valeur === x.cle ? "pris" : ""}${e ? ` ${e}` : ""}`}
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

export function StudioMoi({ etat: etat0 }: { etat: EtatMaFigurine; onEtat?: (e: EtatMaFigurine) => void }) {
  const fig = useRef<FigurineHandle>(null);
  const [etat, setEtat] = useState(etat0);
  const [mode, setMode] = useState<"ecrire" | "voix">(etat0.voixTexte ? "ecrire" : "voix");
  // 🧭 EN TROIS ÉTAPES (9 novembre 2026) : sa figurine en haut, deux onglets (`vue`) ; deux feuilles qui montent —
  // « Pas d'idée ? » (`feuilleIdee`) et son visage, au choix (`feuilleTete`) — ; son mème prêt, dans la sienne (`feuille`)
  const [vue, setVue] = useState<"parler" | "reactions">(() => (typeof window !== "undefined" && window.location.hash === "#reactions" ? "reactions" : "parler"));
  const [feuilleIdee, setFeuilleIdee] = useState(false);
  const [feuilleTete, setFeuilleTete] = useState(false);
  // 🪜 ÉCRAN PAR ÉCRAN (10 novembre 2026 : « ne voir qu'une section après l'autre ») : l'étape à l'écran, et d'où l'on
  // vient (pour qu'elle glisse du bon côté)
  const [etape, setEtape] = useState<1 | 2 | 3>(1);
  const [sens, setSens] = useState<"avant" | "arriere">("avant");
  // (le tuto de Pablito montre une étape : elle s'ouvre)
  useEffect(() => {
    const ouvrir = (e: Event) => {
      const m = /^creer-([123])$/.exec(String((e as CustomEvent<string>).detail ?? ""));
      if (!m) return;
      setVue("parler");
      setSens("avant");
      setEtape(Number(m[1]) as 1 | 2 | 3);
    };
    window.addEventListener(EVT_TUTO_OUVRIR, ouvrir);
    return () => window.removeEventListener(EVT_TUTO_OUVRIR, ouvrir);
  }, []);
  // (sa figurine est sortie de l'écran par le haut : sa vignette prend le relais, sous la barre du haut)
  const [mini, setMini] = useState<number | null>(null);
  const [feuille, setFeuille] = useState(false);
  const [copie, setCopie] = useState(false);
  // (sa ville, pour « Poster sur le fil de Dax » : celle du mème du jour — 8 novembre 2026 : sa carte a quitté « Créer »,
  // elle est dans « Découvrir » ; on ne lit plus que sa ville)
  const [villeJour, setVilleJour] = useState("");
  useEffect(() => {
    let fini = false;
    void fetch("/api/direct/ma-figurine?jour=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { jour?: { ville?: string } } | null) => !fini && j?.jour?.ville && setVilleJour(j.jour.ville))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, []);
  const scene = useRef<HTMLDivElement>(null);
  // (tout est ouvert dès le départ, le lot 3 : ses visages, ses voix, sa propre voix, le cadre doré)
  const or = true;
  // 🎁 SON PREMIER MÈME : préparé pendant la fabrication (son texte, lu par sa voix), sinon déjà écrit (« le premier
  // mème en moins de deux minutes ») — il n'a plus qu'à l'écouter
  const [premier] = useState<PremierMeme | null>(() => (etat0.messages.length ? null : lirePremierMeme()));
  const [texte, setTexte] = useState(() => premier?.texte ?? (etat0.messages.length ? "" : PREMIER_MEME));
  // 💬 LE MÈME AUQUEL IL RÉPOND (en duo) ; et les mèmes prêts du moment
  const [reponse, setReponse] = useState<MemeARepondre | null>(null);
  const [prets] = useState<MemePret[]>(() => memesDuMoment());
  // 🎲 « SURPRENDS-MOI ! » : ClikMe écrit son mème d'après sa carte de personnage ; il le lit, puis le choisit (ou un autre)
  const [surprise, setSurprise] = useState<Surprise | null>(null);
  const [surpriseCharge, setSurpriseCharge] = useState(false);
  const surprisesVues = useRef<string[]>([]);
  // 🔥 LE MÈME DU JOUR (le lot 2) : il y répond — le thème, ses idées ; `postee` : le mème posté (visible par sa ville)
  const [themeJour, setThemeJour] = useState<{ theme: Theme; ville: string; postee: string } | null>(null);
  // 📍 SON MÈME POUR UN LIEU D'« AUTOUR » : il y répond « avec sa tête » ; son dépôt l'attend (`depot-autour.ts`)
  const [pourAutour, setPourAutour] = useState<PourAutour | null>(null);
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
  const [voix, setVoix] = useState<CleVoix | null>(premier?.voix ?? etat0.maVoix ?? null);
  function choisirVoix(v: CleVoix) {
    if (!voix) setVoixOuvertes(true);
    setVoix(v);
    // (gardée : ce sera sa voix la prochaine fois)
    void demander({ action: "ma-voix", voix: v }).catch(() => undefined);
  }
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [danse, setDanse] = useState(false);
  // 🎬 TROIS FAÇONS DE LE DIRE (8 novembre 2026, `trois-rendus.tsx`) : l'interprétation qu'il a choisie — son graphisme
  // (la BD, le cinéma, l'affiche) ; son visage, c'est `sentiment` (le choix le pose). Il vaut pour la phrase qu'il
  // disait : une autre phrase, un autre mème (rien de choisi en douce, qu'on ne verrait plus)
  const [renduPris, setRenduPris] = useState<{ r: Rendu; texte: string } | null>(null);
  const rendu = renduPris && renduPris.texte === texte.trim() ? renduPris.r : null;
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
  const [son, setSon] = useState<Son | null>(() =>
    premier ? { url: premier.son, data: premier.son, duree: premier.duree, cle: `${premier.voix}|${premier.texte}`, texte: premier.texte, voix: premier.voix } : null,
  );
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
  // 🛠️ l'atelier de Pablito ouvert (ce qu'il fabrique), et quand chaque visage y est entré
  const [atelier, setAtelier] = useState<Atelier | null>(null);
  const debutsAtelier = useRef<Partial<Record<Sentiment, number>>>({});
  const micro = useRef<{ rec: MediaRecorder; flux: MediaStream; t0: number; minuteur: number } | null>(null);

  // 🎭 SES EXPRESSIONS : le moteur d'image les fait (deux tours ; la page attend en arrière-plan) — chaque visage la
  // première fois qu'il le choisit (`veut`), la joie aussi (9 novembre 2026 : plus rien d'office, voir `visagesVoulus`)
  useEffect(() => {
    if (!etat0.expressionsAFaire && !veut.s) return;
    let fini = false;
    (async () => {
      for (let k = 0; k < 4 && !fini; k++) {
        try {
          const j = await demander({ action: "expressions", ...(veut.s ? { veut: veut.s } : {}) });
          if (fini) return;
          if (j.etat) setEtat(j.etat);
          // (un pépin : l'atelier ouvert le dit)
          if (j.error && !j.enCours) setAtelier((a) => (a && !a.erreur ? { ...a, erreur: j.error } : a));
          if (!j.etat?.expressionsAFaire || (j.error && !j.enCours)) break;
          if (j.enCours) await new Promise((ok) => window.setTimeout(ok, 30_000));
        } catch {
          if (!fini) setAtelier((a) => (a && !a.erreur ? { ...a, erreur: "La connexion a lâché. Réessaie dans un moment." } : a));
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
      // 🛠️ L'ATELIER DE PABLITO (`atelier.tsx`) : il le fabrique sous ses yeux, et le fait patienter avec le sourire
      const debut = Date.now();
      debutsAtelier.current[s] = debut;
      setAtelier({ quoi: s, debut, ouvert: debut });
      setExpressionsEnCours(true);
      setVeut((v) => ({ s, n: v.n + 1 }));
      setAttendu(s);
      return;
    }
    // (un visage déjà à l'atelier : la fenêtre se rouvre, sa barre où elle en était)
    if (s && etatsVisages[s] === "cours") {
      const ouvert = Date.now();
      setAtelier({ quoi: s, debut: debutsAtelier.current[s] ?? ouvert, ouvert });
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
        setVue("parler");
        setMode("ecrire");
        setTexte(x.texte.trim().slice(0, TEXTE_MAX));
      }
      if (typeof x.look === "string") {
        setLookVoulu(x.look);
        // (son look s'affiche dans la feuille « Son visage », ouverte)
        setFeuilleTete(true);
      }
      if (typeof x.theme === "string" && x.theme === themeDuJour().cle) {
        setVue("parler");
        setMode("ecrire");
        setTexte("");
        setPourAutour(null);
        setThemeJour({ theme: themeDuJour(), ville: typeof x.ville === "string" ? x.ville : "", postee: "" });
      }
      if (x.autour && typeof x.autour === "object") {
        const a = x.autour;
        setVue("parler");
        setMode("ecrire");
        setThemeJour(null);
        // (un mème pour la ville, pas un duo : le duo en cours, s'il y en avait un, est laissé)
        oublierLaReponse();
        setReponse(null);
        setPourAutour({ nom: typeof a.nom === "string" ? a.nom.slice(0, 60) : "", emoji: typeof a.emoji === "string" ? a.emoji.slice(0, 8) : "", reponse: a.reponse === true });
      }
    };
    void Promise.resolve().then(() => appliquer(prendreVersLeStudio()));
    const ecoute = (e: Event) => {
      prendreVersLeStudio();
      appliquer((e as CustomEvent<VersLeStudio>).detail);
    };
    window.addEventListener(EVT_VERS_LE_STUDIO, ecoute);
    return () => window.removeEventListener(EVT_VERS_LE_STUDIO, ecoute);
  }, []);

  // 🗂️ L'ADRESSE CHOISIT L'ONGLET : `#reactions` (ses réactions)
  useEffect(() => {
    const lire = (e?: Event) => {
      const ancre = (e as CustomEvent<string> | undefined)?.detail ?? window.location.hash.slice(1);
      if (ancre === "reactions") setVue("reactions");
    };
    window.addEventListener("hashchange", lire);
    window.addEventListener(EVT_ANCRE, lire);
    return () => {
      window.removeEventListener("hashchange", lire);
      window.removeEventListener(EVT_ANCRE, lire);
    };
  }, []);
  // 🖼️ SA VIGNETTE (9 novembre 2026, l'ami : « que la figurine s'amenuise quand on fait défiler, pour laisser la place
  // aux choix et au bouton ») : sa figurine sort de l'écran par le haut — sa vignette apparaît sous la barre du haut, avec
  // ce qu'il a choisi ; un toucher remonte. (Sur un grand écran, sa figurine reste à gauche : pas de vignette.)
  useEffect(() => {
    const el = scene.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const haut = () => Math.round(document.querySelector(".mc-barre")?.getBoundingClientRect().bottom ?? 0);
    const o = new IntersectionObserver(([e]) => setMini(e && !e.isIntersecting && e.boundingClientRect.top < 0 ? haut() : null), { rootMargin: `-${haut() + 8}px 0px 0px 0px` });
    o.observe(el);
    return () => o.disconnect();
  }, []);

  const cleEnvoi = (s: Son | null) => (s ? `${s.cle}|${sentiment ?? ""}|${danse ? "danse" : ""}|${look}|${rendu ? `${rendu.style}-${rendu.teinte}-${rendu.cadrage}` : ""}` : "");
  /** 🎬 Une interprétation : son graphisme, et le visage qui va avec (sa figurine du mois laisse place à la sienne). */
  function choisirRendu(r: Rendu | null) {
    setRenduPris(r ? { r, texte: texte.trim() } : null);
    if (!r) return;
    if (sonLook) setLook("");
    choisirVisage(r.visage);
  }

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

  /** 🎲 Un mème écrit par ClikMe : rien n'est dit tant qu'il ne l'a pas choisi (« C'est moi ✓ »). */
  async function surprendreMoi() {
    if (surpriseCharge) return;
    setSurpriseCharge(true);
    setErreur("");
    try {
      const j = (await demander({ action: "surprise", sauf: surprisesVues.current, ...(themeJour ? { theme: themeJour.theme.cle } : {}) })) as Reponse & Partial<Surprise>;
      if (!j.texte) throw new Error("Pas de surprise cette fois. Réessaie.");
      surprisesVues.current = [...surprisesVues.current, j.texte].slice(-20);
      setSurprise({ texte: j.texte, sentiment: j.sentiment ?? "joie", danse: Boolean(j.danse), par: j.par ?? "local", carte: Boolean(j.carte) });
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setSurpriseCharge(false);
    }
  }
  function cEstMoi() {
    if (!surprise) return;
    setFeuilleIdee(false);
    choisirPret({ cle: "surprise", emoji: "🎲", nom: "Surprends-moi", texte: surprise.texte, sentiment: surprise.sentiment, danse: surprise.danse });
    setSurprise(null);
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
      ...(rendu && !reponse && s.texte ? { rendu: rendu.style } : {}),
    });
    const lien = `${window.location.origin}${j.lien}`;
    const id = String(j.lien).split("/").pop() ?? "";
    setEnvoye({ lien, cle, id });
    // (son premier mème est parti : celui qu'il avait préparé n'attend plus)
    garderPremierMeme(null);
    setEtat((e) => ({ ...e, messages: [{ id, le: new Date().toISOString(), ecoutes: 0, signale: false, sentiment, ...(s.texte ? { texte: s.texte } : {}) }, ...e.messages] }));
    return { lien, id };
  }

  /**
   * 🎭 SON MÈME — la vidéo de sa figurine qui parle (`meme.ts`) : elle se fabrique sous ses yeux (et ses oreilles), part
   * au seau, et il la partage TELLE QUELLE (la feuille de partage du téléphone : WhatsApp la montre et la rejoue). Un
   * téléphone qui ne sait pas faire de vidéo : le lien seul (la page joue sa figurine).
   */
  /** (le son s'ouvre DANS le toucher : sur iPhone, c'est maintenant ou jamais) */
  function ouvrirLeSon(): AudioContext | null {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const ctx = memePossible() && AC ? new AC() : null;
    void ctx?.resume().catch(() => undefined);
    return ctx;
  }
  async function creerMeme(leSon: Son | null = son, ouvert?: AudioContext | null) {
    if (!leSon) return;
    const son = leSon;
    const cle = cleEnvoi(son);
    const ctx = ouvert === undefined ? ouvrirLeSon() : ouvert;
    setEnvoi(true);
    setErreur("");
    try {
      const { id } = await leMessage(son);
      // (la feuille monte : il le voit se fabriquer, puis prêt, avec de quoi le partager)
      setFeuille(true);
      setCopie(false);
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
        // 🎬 son interprétation : la BD, le cinéma, l'affiche (pas en duo ; avec ses mots)
        ...(rendu && !reponse && son.texte ? { rendu: { style: rendu.style, cadrage: rendu.cadrage, onomatopee: rendu.onomatopee, mot: motPour(son.texte, rendu.mot), teinte: rendu.teinte } } : {}),
      });
      // la vidéo part au seau (directement), puis elle est rangée avec le message
      const a = await demander({ action: "meme-envoi", id, type: m.type });
      const ext = m.type.includes("mp4") ? "mp4" : "webm";
      const envoi = a as unknown as { seau: string; chemin: string; jeton: string };
      const { error } = await createClient().storage.from(envoi.seau).uploadToSignedUrl(envoi.chemin, envoi.jeton, m.blob, { contentType: m.type });
      if (error) throw new Error("Ton mème n’a pas pu partir. Réessaie.");
      await demander({ action: "meme-pose", id, type: m.type });
      setMeme({ cle, etat: "pret", url: URL.createObjectURL(m.blob), fichier: new File([m.blob], `mon-meme-clikme.${ext}`, { type: m.type }), duo: Boolean(reponse) });
      setFeuille(true);
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

  /**
   * 🎬 « CRÉER MON MÈME », LE BOUTON DU BAS (9 novembre 2026 : il dit ce qu'on obtient) : plus besoin d'« Écouter »
   * d'abord — sa phrase est lue par sa voix s'il ne l'a pas encore entendue, puis son mème se fabrique. Avec sa propre
   * voix : celle qu'il a enregistrée.
   */
  /** 🪜 Vers une étape : en avant, il faut avoir dit quelque chose (l'étape ② est facultative) ; sa figurine reste en vue. */
  function versEtape(n: 1 | 2 | 3) {
    if (n > 1 && !premiereFaite) {
      setEtape(1);
      setErreur(ecrit ? "Écris d’abord ce qu’elle doit dire." : "Enregistre d’abord ta voix.");
      return;
    }
    setErreur("");
    setSens(n >= etape ? "avant" : "arriere");
    setEtape(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function creerMonMeme() {
    setErreur("");
    if (mode !== "ecrire" || !etat.voixTexte) return void creerMeme();
    const t = texte.trim();
    if (!t) {
      versEtape(1);
      return setErreur("Écris d’abord ce qu’elle doit dire.");
    }
    if (!voix) return setErreur("Choisis d’abord sa voix, juste au-dessus.");
    const cle = `${voix}|${t}`;
    if (son?.cle === cle) return void creerMeme();
    const ctx = ouvrirLeSon();
    setEnvoi(true);
    try {
      const j = await demander({ action: "voix", texte: t, voix });
      if (!j.son) throw new Error("La voix n’a pas pu lire ce texte.");
      const s: Son = { url: j.son, data: j.son, duree: await dureeDe(j.son), cle, texte: t, voix };
      setSon(s);
      await creerMeme(s, ctx);
    } catch (e) {
      setErreur((e as Error).message);
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
  /** 🔥 Sa réponse au mème du jour : postée, visible par les gens de sa ville (c'est écrit sur le bouton : son accord). */
  async function posterAuJour() {
    if (!envoye || !meme || !themeJour) return;
    setErreur("");
    const poster = () => demander({ action: "public", id: envoye.id, public: true, duJour: true });
    try {
      try {
        await poster();
      } catch (e) {
        // 🔞 il n'a pas encore déclaré son âge : une fois, puis le geste repart
        if (!(e as { age?: boolean }).age) throw e;
        if (!(await demanderSonAge())) return setErreur(REFUS_AGE);
        await poster();
      }
      setMeme((x) => (x ? { ...x, public: true } : x));
      setThemeJour((t) => (t ? { ...t, postee: envoye.id } : t));
    } catch (e) {
      setErreur((e as Error).message);
    }
  }
  /** 🌍 Le montrer dans « Découvrir », pour les gens de sa ville (son accord, demandé) — ou le retirer. */
  async function basculerPublic() {
    if (!envoye || !meme) return;
    setErreur("");
    if (!meme.public && !(await accordPublic())) return;
    const basculer = () => demander({ action: "public", id: envoye.id, public: !meme.public }) as Promise<Reponse & { public?: boolean }>;
    try {
      let j: Reponse & { public?: boolean };
      try {
        j = await basculer();
      } catch (e) {
        // 🔞 il n'a pas encore déclaré son âge : une fois, puis le geste repart
        if (!(e as { age?: boolean }).age) throw e;
        if (!(await demanderSonAge())) return setErreur(REFUS_AGE);
        j = await basculer();
      }
      setMeme((x) => (x ? { ...x, public: Boolean(j.public) } : x));
    } catch (e) {
      setErreur((e as Error).message);
    }
  }
  // 🎉 LA RÉVÉLATION : son premier mème est prêt (préparé pendant la fabrication) — un toucher, et il se fabrique
  const premierPret = Boolean(premier && !envoye && !meme && son && son.texte === premier.texte && son.voix === premier.voix && texte.trim() === premier.texte && voix === premier.voix);
  /** 🔗 Son lien, copié (pour le coller où il veut). */
  async function copierLien() {
    if (!envoye) return;
    try {
      await navigator.clipboard.writeText(envoye.lien);
      setCopie(true);
    } catch {
      setCopie(false);
    }
  }
  const partageFichier = typeof navigator !== "undefined" && Boolean(meme?.fichier) && typeof navigator.canShare === "function" && navigator.canShare({ files: [meme!.fichier!] });

  const saVoix = voix ? VOIX_FIGURINE.find((v) => v.cle === voix) : null;
  // (il écrit sa phrase, lue par une voix ; sinon, c'est sa propre voix)
  const ecrit = mode === "ecrire" && Boolean(etat.voixTexte);
  // (l'étape ① est faite : sa phrase est écrite, ou sa voix enregistrée)
  const premiereFaite = ecrit ? Boolean(texte.trim()) : Boolean(son && !son.texte) && !enreg;
  // (son visage : son look, ou ce qu'elle ressent ; un point qui tourne quand un visage ou un look se prépare)
  const sonVisage = sonLook ? `${sonLook.edition.emoji} ${sonLook.edition.nom}` : sentiment ? `${sentimentDe(sentiment)?.emoji ?? ""} ${sentimentDe(sentiment)?.court ?? ""}` : "";
  const sePrepare = enCreation.size > 0 || Boolean(lookCours);
  // (son mème du moment : celui qu'il vient de faire avec CETTE phrase, CETTE voix et ces réglages)
  const sonAJour = Boolean(son && (ecrit ? son.texte === texte.trim() && son.voix === voix : !son.texte));
  const memeIci = son && sonAJour && meme?.cle === cleEnvoi(son) ? meme : null;
  const saVille = nomVille(themeJour?.ville || villeJour) || "ta ville";
  // 🖼️ sa vignette : sa tête du moment, et ce qu'il a choisi, en une ligne
  const imageMini = sonLook?.image || (sentiment ? etat.expressions?.[sentiment]?.n : "") || etat.neutre || "";
  const faconPrise = rendu ? STYLES_RENDU.find((s) => s.cle === rendu.style) : null;
  const choix = [
    sonVisage,
    faconPrise ? `${faconPrise.emoji} ${(FACONS[faconPrise.cle] ?? faconPrise.nom).toLowerCase()}` : "",
    ecrit ? (saVoix ? `${saVoix.emoji} ${saVoix.nom}` : "") : son && !son.texte ? "🎙️ ta voix" : "",
    danse ? "🕺 elle danse" : "",
  ]
    .filter(Boolean)
    .join(" · ");
  // 🎲 « Pas d'idée ? » : le mème du jour à part, les phrases toutes prêtes ensemble ; choisir ferme la feuille
  const pretDuJour = prets.find((m) => m.cle === "du-jour") ?? null;
  const phrasesPretes = prets.filter((m) => m.cle !== "du-jour");
  function prendreUnPret(m: MemePret) {
    setFeuilleIdee(false);
    choisirPret(m);
  }
  const chevron = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );

  // 🧭 « CRÉER » EN TROIS ÉTAPES (9 novembre 2026, voir l'en-tête du fichier) : sa figurine, l'aperçu de son mème, en
  // haut ; deux onglets ; ① ce qu'elle dit, ② comment elle le dit, ③ sa voix ; « 🎬 Créer mon mème » ; deux feuilles
  // (« Pas d'idée ? », son visage au choix) ; son mème prêt monte dans la sienne ; tout en bas, sa figurine du mois
  return (
    <div className="tf tf-moi">
      {atelier && visible && (
        <AtelierPablito
          atelier={atelier}
          image={etat.expressions?.[atelier.quoi]?.n}
          onFermer={() => {
            // (sa nouvelle tête est prête : elle se joue en haut, sous ses yeux)
            if (etat.expressions?.[atelier.quoi]) setRejoue((n) => n + 1);
            setAtelier(null);
          }}
        />
      )}
      <div className="tf-scene" ref={scene}>
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
        </div>
        <small className="tf-hero-dit">Elle montre ton mème en direct</small>
      </div>
      {/* 🖼️ SA VIGNETTE, quand sa figurine est sortie de l'écran par le haut : un toucher remonte */}
      {mini !== null && visible && vue === "parler" && (
        <button type="button" className="tf-mini" style={{ top: `${mini}px` }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Revoir ta figurine en grand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageMini} alt="" />
          <span>
            <b>Ton mème</b>
            {choix ? ` · ${choix}` : ""}
          </span>
          {sePrepare && <i className="tf-g-cours" aria-label="en préparation" />}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
      )}

      <div className="tf-onglets" role="tablist" aria-label="Ce que tu veux faire">
        <button type="button" role="tab" id="tf-o-parler" aria-selected={vue === "parler"} aria-controls="tf-parler" className={vue === "parler" ? "pris" : ""} onClick={() => setVue("parler")}>
          💬 Faire un mème
        </button>
        <button type="button" role="tab" id="tf-o-reactions" aria-selected={vue === "reactions"} aria-controls="tf-reactions" className={vue === "reactions" ? "pris" : ""} onClick={() => setVue("reactions")}>
          ⚡ Répondre vite
        </button>
      </div>

      {/* 💬 FAIRE UN MÈME, EN TROIS ÉTAPES */}
      <div className="tf-parler" id="tf-parler" role="tabpanel" aria-labelledby="tf-o-parler" hidden={vue !== "parler"}>
        {premierPret && premier && (
          <div className="tf-revele" role="status">
            <b>🎉 La voilà ! Ton premier mème est prêt.</b>
            <span>« {premier.texte} »</span>
            <button type="button" className="tf-go tf-revele-go" onClick={() => void creerMeme()}>
              🎭 Créer mon premier mème
            </button>
          </div>
        )}
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
        {/* 🔥 IL RÉPOND AU MÈME DU JOUR : le thème, et trois idées (un toucher : elle le dit) */}
        {themeJour && (
          <div className="tf-theme" id="theme-du-jour" role="group" aria-label="Le mème du jour">
            <span className="tf-theme-tete">
              <b>
                🔥 Le mème du jour : {themeJour.theme.emoji} {themeJour.theme.titre}
              </b>
              <button type="button" aria-label="Ne pas répondre au mème du jour" onClick={() => setThemeJour(null)}>
                ✕
              </button>
            </span>
            {mode === "ecrire" && etat.voixTexte && (
              <span className="tf-theme-idees">
                {themeJour.theme.idees.map((t, k) => (
                  <button key={k} type="button" className={texte === t ? "pris" : undefined} onClick={() => choisirPret({ cle: `idee-${k}`, emoji: "💡", nom: "", texte: t, sentiment: "joie" })}>
                    💡 {t}
                  </button>
                ))}
              </span>
            )}
          </div>
        )}
        {/* 📍 SON MÈME POUR UN LIEU D'« AUTOUR » : sa tête, sa phrase (ou « 🎲 Surprends-moi ! »), puis il le dépose là-bas */}
        {pourAutour && (
          <div className="tf-theme tf-pour-autour" id="pour-autour" role="group" aria-label="Ton mème pour « Autour »">
            <span className="tf-theme-tete">
              <b>
                {pourAutour.reponse ? "↩️ Ta réponse" : "📍 Ton mème"} {pourAutour.nom ? `pour ${pourAutour.emoji || "📍"} ${pourAutour.nom}` : "pour « Autour »"}
              </b>
              <button
                type="button"
                aria-label="Ne plus le faire pour « Autour »"
                onClick={() => {
                  setPourAutour(null);
                  oublierLeDepot();
                }}
              >
                ✕
              </button>
            </span>
            <small>Choisis ta tête, écris ta phrase ou « 🎲 Surprends-moi ! » : ton mème prêt, tu le déposes là-bas.</small>
          </div>
        )}

        {/* 🪜 LES TROIS ÉTAPES, UNE À LA FOIS : où il en est ; une étape faite se rouvre d'un toucher */}
        <nav className="tf-pas" aria-label="Les étapes de ton mème">
          {(
            [
              [1, ecrit ? "Sa phrase" : "Ta voix"],
              [2, "Le ton"],
              [3, ecrit ? "Sa voix" : "La danse"],
            ] as const
          ).map(([n, nom]) => (
            <button
              key={n}
              type="button"
              className={`${etape === n ? "pris" : ""}${n < etape ? " fait" : ""}`}
              aria-current={etape === n ? "step" : undefined}
              disabled={n > 1 && !premiereFaite}
              onClick={() => versEtape(n)}
            >
              <i aria-hidden="true">{n < etape ? "✓" : n}</i>
              <span>{nom}</span>
            </button>
          ))}
        </nav>

        {/* ① CE QU'ELLE DIT */}
        <section className="tf-etape tf-etape-1" aria-labelledby="tf-e1" hidden={etape !== 1} data-sens={sens}>
          <EnteteEtape n={1} id="tf-e1" titre="Ce qu’elle dit" dit="Ta phrase, ou ta voix : c’est elle qui la dira." />
          {etat.voixTexte && (
            <div className="tf-modes" role="tablist" aria-label="Comment elle parle">
              <button type="button" role="tab" aria-selected={mode === "ecrire"} className={mode === "ecrire" ? "pris" : ""} onClick={() => setMode("ecrire")}>
                ✍️ J’écris
              </button>
              <button type="button" role="tab" aria-selected={mode === "voix"} className={mode === "voix" ? "pris" : ""} onClick={() => setMode("voix")}>
                🎙️ Avec ma voix
              </button>
            </div>
          )}

          {ecrit ? (
            <>
              {texte === PREMIER_MEME && !reponse && <p className="tf-premier">🎁 Ton premier mème est déjà écrit : {voix ? "touche « Créer mon mème », et partage-le !" : "choisis sa voix, puis touche « Créer mon mème » !"}</p>}
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
              <button type="button" className="tf-pas-idee" onClick={() => setFeuilleIdee(true)}>
                <span>
                  <b>🎲 Pas d’idée ?</b>
                  <small>Je t’en propose une, ou des phrases toutes prêtes</small>
                </span>
                {chevron}
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
        </section>

        {/* ② COMMENT ELLE LE DIT : le ton et trois mèmes proposés ; ou son visage, choisi par lui */}
        <section className="tf-etape tf-etape-2" aria-labelledby="tf-e2" hidden={etape !== 2} data-sens={sens}>
          <EnteteEtape n={2} id="tf-e2" titre="Comment elle le dit" dit={ecrit && !reponse ? "Facultatif : choisis le ton, je te propose trois mèmes." : "Facultatif : ce qu’elle ressent pendant qu’elle parle."} />
          {ecrit && !reponse && etat.neutre && <TroisRendus texte={texte} expressions={etat.expressions} neutre={etat.neutre} choisi={rendu} onChoisir={choisirRendu} onIdee={(t) => setTexte(t.slice(0, TEXTE_MAX))} />}
          <button type="button" className="tf-sa-tete" onClick={() => setFeuilleTete(true)}>
            🎭 {ecrit && !reponse ? "Ou je choisis son visage moi-même" : "Je choisis son visage"}
            {chevron}
          </button>
          {(sonVisage || sePrepare) && (
            <small className="tf-sa-tete-dit" role="status">
              {sonVisage ? `Son visage : ${sonVisage}` : ""}
              {sePrepare ? `${sonVisage ? " · " : ""}🛠️ un visage se prépare…` : ""}
            </small>
          )}
        </section>

        {/* ③ SA VOIX (et elle danse, si on veut) */}
        <section className="tf-etape tf-etape-3" aria-labelledby="tf-e3" hidden={etape !== 3} data-sens={sens}>
          <EnteteEtape n={3} id="tf-e3" titre={ecrit ? "Sa voix" : "Elle danse ?"} dit={ecrit ? "Celle qui lira ta phrase." : "En musique, dans ton mème."}>
            {ecrit && (
              <button type="button" className="tf-ecouter" onClick={() => ecouterTexte()} disabled={parle || !texte.trim() || !voix}>
                {parle ? "🔊 Elle parle…" : "▶ Écouter"}
              </button>
            )}
          </EnteteEtape>
          {ecrit && (
            <>
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
                  <span>
                    <button type="button" onClick={() => choisirVoix(VOIX_DE_BASE.homme)}>
                      👨 Voix d’homme
                    </button>
                    <button type="button" onClick={() => choisirVoix(VOIX_DE_BASE.femme)}>
                      👩 Voix de femme
                    </button>
                  </span>
                </div>
              )}
            </>
          )}
          <span className="tf-danse-ligne">
            <span>
              <b>🕺 Elle danse en parlant</b>
              <small>En musique, et dans ton mème</small>
            </span>
            <button type="button" role="switch" aria-checked={danse} aria-label="Elle danse en parlant" className={`tf-danse${danse ? " pris" : ""}`} onClick={basculerDanse}>
              <i />
            </button>
          </span>
        </section>

        {/* 🪜 EN BAS, TOUJOURS À PORTÉE : « Suivant », « Retour » ; à la dernière étape, le but, écrit sur le bouton */}
        <div className={`tf-suite${etape === 3 ? " tf-envoi" : ""}`}>
          {etape > 1 && (
            <button type="button" className="tf-retour" onClick={() => versEtape(etape === 3 ? 2 : 1)} aria-label="Retour à l’étape d’avant">
              ‹ Retour
            </button>
          )}
          {etape < 3 ? (
            <button type="button" className="tf-suivant" onClick={() => versEtape(etape === 1 ? 2 : 3)} disabled={!premiereFaite}>
              {etape === 2 && !rendu && !sonVisage ? "Passer ➔" : "Suivant ➔"}
            </button>
          ) : memeIci ? (
            <button type="button" className="tf-revoir" onClick={() => setFeuille(true)}>
              {memeIci.etat === "fabrication" ? `🎬 Ton mème se fabrique… ${Math.round((memeIci.p ?? 0) * 100)} %` : "✅ Ton mème est prêt · le revoir"}
            </button>
          ) : (
            <button type="button" className="tf-envoyer" onClick={() => void creerMonMeme()} disabled={envoi || (ecrit ? !texte.trim() : !son || Boolean(son.texte))}>
              <b>{envoi ? "Un instant…" : "🎬 Créer mon mème"}</b>
              <small>Une vidéo à envoyer où tu veux</small>
            </button>
          )}
        </div>
        {erreur && !feuille && (
          <p className="tf-erreur" role="alert">
            {erreur}
          </p>
        )}
      </div>

      {/* 🎲 « PAS D'IDÉE ? » : toutes les aides au même endroit — choisir remplit sa phrase */}
      <Feuille ouverte={feuilleIdee} onFermer={() => setFeuilleIdee(false)} titre="Pas d’idée ?" className="tf-feuille-idee">
        <b className="tf-feuille-titre">🎲 Pas d’idée ?</b>
        <small className="tf-feuille-dit">Choisis : ça remplit ta phrase, et tu peux tout changer après.</small>
        <button type="button" className={`tf-idee tf-surprends${surpriseCharge ? " tourne" : ""}`} onClick={surprendreMoi} aria-busy={surpriseCharge}>
          <span aria-hidden="true">🎲</span>
          <span>
            <b>Surprends-moi</b>
            <small>Une phrase drôle, inventée pour toi</small>
          </span>
        </button>
        {/* 🎲 CE QUE CLIKME A ÉCRIT POUR LUI : il le lit ; sa figurine ne le dit que s'il le choisit */}
        {(surprise || surpriseCharge) && (
          <div className="tf-surprise" role="status" aria-live="polite">
            {!surprise ? (
              <p className="tf-surprise-attente">
                <span aria-hidden="true">🎲</span> ClikMe t’écrit un mème…
              </p>
            ) : (
              <>
                <small>🎲 ClikMe l’a écrit pour toi{surprise.carte ? ", d’après ta carte" : ""}</small>
                <p className="tf-surprise-texte">« {surprise.texte} »</p>
                <span className="tf-surprise-humeur">
                  {sentimentDe(surprise.sentiment)?.emoji} {sentimentDe(surprise.sentiment)?.court}
                  {surprise.danse ? " · 🕺 elle danse" : ""}
                </span>
                <span className="tf-surprise-boutons">
                  <button type="button" className="tf-surprise-encore" disabled={surpriseCharge} onClick={surprendreMoi}>
                    {surpriseCharge ? "🎲 …" : "🎲 Encore"}
                  </button>
                  <button type="button" className="tf-surprise-oui" disabled={surpriseCharge} onClick={cEstMoi}>
                    C’est moi ✓
                  </button>
                </span>
                {!surprise.carte && (
                  <a className="tf-surprise-carte" href="#personnage">
                    🃏 Fais ta carte de personnage : tes surprises te ressembleront
                  </a>
                )}
                <button type="button" className="tf-surprise-fermer" aria-label="Fermer" onClick={() => setSurprise(null)}>
                  ✕
                </button>
              </>
            )}
          </div>
        )}
        {pretDuJour && (
          <button type="button" className="tf-idee du-jour" onClick={() => prendreUnPret(pretDuJour)}>
            <span aria-hidden="true">🔥</span>
            <span>
              <b>Le mème du jour</b>
              <small>Le même thème pour toute ta ville, aujourd’hui</small>
            </span>
          </button>
        )}
        <b className="tf-q">Des phrases toutes prêtes</b>
        <div className="tf-prets" role="group" aria-label="Des phrases toutes prêtes">
          {phrasesPretes.map((m) => (
            <button key={m.cle} type="button" className={texte === m.texte ? "pris" : undefined} onClick={() => prendreUnPret(m)}>
              <span aria-hidden="true">{m.emoji}</span> {m.nom}
            </button>
          ))}
        </div>
      </Feuille>

      {/* 🎭 SON VISAGE, AU CHOIX : son look, ses humeurs, ses attitudes (un visage pas encore fait : l'atelier de Pablito) */}
      <Feuille ouverte={feuilleTete} onFermer={() => setFeuilleTete(false)} titre="Son visage, au choix" className="tf-feuille-tete">
        <b className="tf-feuille-titre">🎭 Son visage, au choix</b>
        <small className="tf-feuille-dit">Ce qu’elle ressent pendant qu’elle parle.</small>
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
            <b className="tf-q tf-q-visage">Son humeur</b>
            <ChoixExpression valeur={sentiment} onChoix={choisirVisage} etats={etatsVisages} />
            <b className="tf-q tf-q-visage">Son attitude</b>
            <ChoixExpression valeur={sentiment} onChoix={choisirVisage} etats={etatsVisages} attitudes />
            {enCreation.size > 0 && (
              <p className="tf-note" role="status">
                🎭 Ta figurine apprend{" "}
                {enCreation.size > 1 ? "tout ça" : [...enCreation].some(estAttitude) ? "cette attitude" : "ce visage"}… une minute environ : {enCreation.size > 1 ? "ça s’affichera tout seul" : [...enCreation].some(estAttitude) ? "elle s’affichera toute seule" : "il s’affichera tout seul"}.
              </p>
            )}
          </>
        )}
        {lookCours && (
          <p className="tf-note" role="status">
            🗓️ Ton look apprend à parler… une minute environ : il s’affichera tout seul.
          </p>
        )}
        {etat.auto !== false && Object.keys(etatsVisages).length > 0 && (
          <p className="tf-note tf-note-atelier">
            ✨ Pas encore fait : Pablito le fabrique en une minute environ, et il est à toi <b>pour toujours</b>.
          </p>
        )}
        <button type="button" className="tf-garder" onClick={() => setFeuilleTete(false)}>
          C’est bon, je garde ce visage
        </button>
      </Feuille>

      {/* ⚡ SES RÉACTIONS ET SES GAGS */}
      <div className="tf-reactions" id="tf-reactions" role="tabpanel" aria-labelledby="tf-o-reactions" hidden={vue !== "reactions"}>
        <MesReactions />
      </div>

      {/* 🎭 SON MÈME, DANS UNE FEUILLE QUI MONTE : il s'y fabrique sous ses yeux, puis « Ton mème est prêt ✅ » — le
          partager (la vidéo telle quelle), son lien, la vidéo ; et le geste qui compte : le poster sur le fil de sa ville
          (ou sa réponse au mème du jour, ou le déposer dans « Autour ») */}
      <Feuille ouverte={feuille && Boolean(meme)} onFermer={() => setFeuille(false)} titre="Ton mème" className="tf-feuille-meme">
        {meme?.etat === "fabrication" && (
          <div className="tf-meme-cours" role="status">
            <b>🎬 Ton mème se fabrique…</b>
            <span className="tf-meme-jauge">
              <i style={{ width: `${Math.round((meme.p ?? 0) * 100)}%` }} />
            </span>
          </div>
        )}
        <canvas ref={toile} className={`tf-meme-toile${meme?.etat === "fabrication" ? " visible" : ""}`} aria-hidden="true" />
        {meme?.etat === "pret" && meme.url ? (
          <div className="tf-meme-pret">
            <b className="tf-meme-titre">Ton mème est prêt ✅</b>
            <div className="tf-meme-cote">
              <video className="tf-meme-video" src={meme.url} autoPlay loop muted playsInline onClick={(e) => (e.currentTarget.muted = !e.currentTarget.muted)} />
              <div className="tf-meme-partage">
                {partageFichier ? (
                  <button type="button" className="tf-wa tf-partager-meme" onClick={partagerMeme}>
                    📲 Partager
                  </button>
                ) : (
                  <a className="tf-wa" href={`https://wa.me/?text=${encodeURIComponent(envoye?.lien ?? "")}`} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                )}
                {envoye && (
                  <button type="button" className="tf-copier" onClick={copierLien}>
                    {copie ? "✓ Lien copié" : "🔗 Le lien"}
                  </button>
                )}
                <a className="tf-sms" href={meme.url} download={meme.fichier?.name ?? "mon-meme-clikme.mp4"}>
                  ⬇️ La vidéo
                </a>
                {envoye && <input className="tf-adresse" readOnly value={envoye.lien} aria-label="Le lien" onFocus={(e) => e.target.select()} />}
              </div>
            </div>
            {/* 📍 POUR « AUTOUR » : il le dépose là-bas (son dépôt l'attend, le mème déjà choisi) */}
            {/* 🔥 SA RÉPONSE AU MÈME DU JOUR : « Poster ma réponse (visible par les gens de Dax) » — puis voir les leurs */}
            {envoye && !meme.duo && pourAutour ? (
              <button
                type="button"
                className="tf-vers-autour"
                onClick={() => {
                  revenirAuDepot(envoye.id);
                  setPourAutour(null);
                  setFeuille(false);
                }}
              >
                📍 {pourAutour.reponse ? "Répondre avec ce mème" : "Le déposer"}
                {pourAutour.nom ? ` · ${pourAutour.nom}` : ""} ›
              </button>
            ) : envoye && !meme.duo && themeJour && themeJour.postee === envoye.id ? (
              <>
                <a className="tf-postee" href="#decouvrir" onClick={() => setFeuille(false)}>
                  ✓ Ta réponse est postée ! Voir celles de {nomVille(themeJour.ville) || "ta ville"} →
                </a>
                {/* 🔔 le bon moment (le lot 3) : « Demain, un nouveau thème. Je te préviens vers 11 h 30 ? » */}
                <InviterAppli apres="postee" />
              </>
            ) : envoye && !meme.duo && themeJour ? (
              <button type="button" className="tf-poster-jour" onClick={posterAuJour}>
                🔥 Poster ma réponse (visible par les gens de {nomVille(themeJour.ville) || "ta ville"})
              </button>
            ) : (
              /* 🌍 S'IL LE VEUT : sur le fil de sa ville — « Découvrir » (jamais un duo) */
              envoye &&
              !meme.duo && (
                <>
                  <button type="button" className={`tf-public${meme.public ? " pris" : ""}`} aria-pressed={Boolean(meme.public)} onClick={basculerPublic}>
                    {meme.public ? `✓ Sur le fil de ${saVille} · le retirer` : `🌍 Poster sur le fil de ${saVille}`}
                  </button>
                  {!meme.public && <small className="tf-public-dit">Les gens de {saVille} le verront dans « Découvrir ». Tu le retires quand tu veux.</small>}
                </>
              )
            )}
          </div>
        ) : meme?.etat === "sans" && envoye ? (
          <PanneauEnvoi lien={envoye.lien} texte="" titre="Ton mème est prêt ✅" />
        ) : null}
        {erreur && feuille && (
          <p className="tf-erreur" role="alert">
            {erreur}
          </p>
        )}
      </Feuille>
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
  // 🔞 réservée aux 15 ans et plus (`AGE_MINIMUM`) : une case de plus, jamais cochée d'avance
  const [majeur, setMajeur] = useState(false);
  const [prenom, setPrenom] = useState("");
  const [ville, setVille] = useState(villes.length === 1 ? villes[0].slug : "");
  // SON UNIVERS (facultatif) : son métier ou sa passion — sa figurine s'habille en conséquence
  const [univers, setUnivers] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  // (9 novembre 2026, le propriétaire : « sur mobile, on n'a pas le réflexe de faire défiler vers le bas pour cocher les
  // cases et donner vie à sa figurine » — sa photo choisie, la page descend toute seule vers la suite)
  const suite = useRef<HTMLLIElement>(null);
  const demandePrenom = !etat.prenom;
  const demandeVille = !etat.compte && villes.length > 1;
  const sansVille = !etat.compte && villes.length > 0 && !ville;
  const etapes = [Boolean(photo), ...(demandePrenom || demandeVille ? [Boolean((!demandePrenom || prenom.trim()) && !sansVille)] : []), accord && majeur];
  const faites = etapes.filter(Boolean).length;
  async function choisir(f: File | undefined) {
    setErreur("");
    if (!f) return;
    try {
      setPhoto(await reduireImage(f, 1600));
      window.setTimeout(() => suite.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
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
        majeur,
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
          <li className={etapes[1] ? "fait" : photo ? "maintenant" : ""} ref={suite}>
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
        <li className={univers.trim() ? "fait" : ""} ref={demandePrenom || demandeVille ? undefined : suite}>
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
        <li className={accord && majeur ? "fait" : ""}>
          <span className="tf-num">{accord && majeur ? "✓" : ++n}</span>
          <span className="tf-accords">
            <label className="tf-accord">
              <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} />
              <span>C’est bien moi sur la photo, et j’accepte que ClikMe en fasse ma figurine.</span>
            </label>
            <label className="tf-accord tf-majeur">
              <input type="checkbox" checked={majeur} onChange={(e) => setMajeur(e.target.checked)} />
              <span>{ATTESTATION_AGE}</span>
            </label>
          </span>
        </li>
      </ol>
      <button type="button" className={`tf-envoyer tf-go${faites === etapes.length ? " pret" : ""}`} disabled={!photo || !accord || !majeur || sansVille || envoi} onClick={partir}>
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
/**
 * ⏱️ EN ATTENDANT : SON PREMIER MÈME (7 novembre 2026) — pendant que sa figurine se fabrique, il choisit ce qu'elle dira
 * en premier (une idée, « 🎲 Surprends-moi ! », ou ses mots) et sa voix ; « ▶ L'écouter » : sa voix le lit, et c'est
 * gardé. Dès qu'elle apparaît : « 🎭 Créer mon premier mème ». Rien n'est envoyé ici.
 */
// (9 novembre 2026 : plus montré pendant la fabrication — « l'écran est trop chargé sur mobile » ; gardé s'il revient)
export function PremierMemePendant({ etat }: { etat: EtatMaFigurine }) {
  const [deja] = useState<PremierMeme | null>(() => lirePremierMeme());
  const [texte, setTexte] = useState(deja?.texte ?? PREMIER_MEME);
  const [voix, setVoix] = useState<CleVoix | null>(deja?.voix ?? etat.maVoix ?? null);
  const [pret, setPret] = useState<PremierMeme | null>(deja);
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState("");
  const [idees] = useState<MemePret[]>(() => memesDuMoment().slice(0, 4));
  const lecteur = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => lecteur.current?.pause(), []);
  const aJour = Boolean(pret && pret.texte === texte.trim() && pret.voix === voix);
  if (!etat.voixTexte) return null;
  function choisirVoix(v: CleVoix) {
    setVoix(v);
    // (gardée : ce sera sa voix dans le studio)
    void demander({ action: "ma-voix", voix: v }).catch(() => undefined);
  }
  function jouer(url: string) {
    lecteur.current?.pause();
    const a = new Audio(url);
    lecteur.current = a;
    void a.play().catch(() => undefined);
  }
  async function surprendreMoi() {
    setErreur("");
    setCharge(true);
    try {
      const j = (await demander({ action: "surprise" })) as Reponse & { texte?: string };
      if (j.texte) setTexte(j.texte);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setCharge(false);
    }
  }
  async function ecouter() {
    const t = texte.trim();
    if (!t) return setErreur("Écris d’abord ce qu’elle dira.");
    if (!voix) return setErreur("Choisis d’abord sa voix.");
    setErreur("");
    if (aJour && pret) return jouer(pret.son);
    setCharge(true);
    try {
      const j = await demander({ action: "voix", texte: t, voix });
      if (!j.son) throw new Error("La voix n’a pas pu lire ce texte.");
      const p: PremierMeme = { texte: t, voix, son: j.son, duree: await dureeDe(j.son) };
      garderPremierMeme(p);
      setPret(p);
      jouer(j.son);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setCharge(false);
    }
  }
  return (
    <section className="tf-pendant" aria-label="Ton premier mème">
      <b className="tf-pendant-titre">⏱️ En attendant : ton premier mème</b>
      <p className="tf-note">Choisis ce qu’elle dira en premier, et sa voix. Dès qu’elle apparaît, tu l’envoies.</p>
      <div className="tf-prets" role="group" aria-label="Des idées">
        <button type="button" className={`tf-surprends${charge ? " tourne" : ""}`} onClick={surprendreMoi} disabled={charge}>
          <span aria-hidden="true">🎲</span> Surprends-moi !
        </button>
        {idees.map((m) => (
          <button key={m.cle} type="button" className={texte === m.texte ? "pris" : undefined} onClick={() => setTexte(m.texte)}>
            <span aria-hidden="true">{m.emoji}</span> {m.nom}
          </button>
        ))}
      </div>
      <label className="tf-texte">
        <textarea value={texte} maxLength={TEXTE_MAX} rows={3} onChange={(e) => setTexte(e.target.value)} aria-label="Ce qu’elle dira en premier" />
        <small>
          {texte.length} / {TEXTE_MAX}
        </small>
      </label>
      {voix ? (
        <ChoixVoix valeur={voix} onChoix={choisirVoix} />
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
      <button type="button" className="tf-ecouter" onClick={ecouter} disabled={charge || !texte.trim() || !voix}>
        {charge ? "🔊 Un instant…" : aJour ? "▶ Réécouter" : "▶ L’écouter"}
      </button>
      {aJour && (
        <p className="tf-pendant-pret" role="status">
          ✓ Ton premier mème est prêt : il partira dès qu’elle apparaît.
        </p>
      )}
      {erreur && (
        <p className="tf-erreur" role="alert">
          {erreur}
        </p>
      )}
    </section>
  );
}

/**
 * 🔁 « REFAIRE MA FIGURINE » (9 novembre 2026 : elle quitte le dessous de sa figurine, dans « Créer », pour « Moi », avec
 * ses réglages) : elle ne lui ressemble pas — une nouvelle avec la même photo (3 par jour, le moteur d'image), ou une
 * autre photo ; « ce qui lui ressemble » (son métier, sa passion) habille la nouvelle. `onFait` : on va la voir se faire.
 */
export function RefaireMaFigurine({ etat, onEtat, onFait }: { etat: EtatMaFigurine; onEtat: (e: EtatMaFigurine) => void; onFait?: () => void }) {
  const [ouvert, setOuvert] = useState(false);
  const [univers, setUnivers] = useState(etat.univers ?? "");
  const [erreur, setErreur] = useState("");
  if (etat.etape !== "prete") return null;
  const restants = etat.refaire ?? 0;
  async function refaire(autrePhoto: boolean) {
    setErreur("");
    try {
      const j = await demander({ action: "refaire", univers: univers.trim(), ...(autrePhoto ? { autrePhoto: true } : {}) });
      if (j.etat) onEtat(j.etat);
      onFait?.();
    } catch (e) {
      setErreur((e as Error).message);
    }
  }
  return (
    <section className="rf" aria-label="Refaire ma figurine">
      <style>{STYLES_REFAIRE}</style>
      <button type="button" className="rf-tete" aria-expanded={ouvert} onClick={() => setOuvert((o) => !o)}>
        <span aria-hidden="true">🔁</span>
        <span>
          <b>Refaire ma figurine</b>
          <small>Elle ne te ressemble pas ? Une nouvelle, ou une autre photo.</small>
        </span>
      </button>
      {ouvert && (
        <div className="rf-corps">
          <label className="rf-univers">
            <span>Ce qui te ressemble : ton métier ou ta passion (facultatif)</span>
            <input value={univers} maxLength={UNIVERS_MAX} onChange={(e) => setUnivers(e.target.value)} placeholder="Artisan, boulangère, fan de vélo…" />
          </label>
          {restants > 0 && (
            <button type="button" className="rf-meme" onClick={() => void refaire(false)}>
              🔁 Une nouvelle, avec la même photo ({restants} aujourd’hui)
            </button>
          )}
          <button type="button" className="rf-photo" onClick={() => void refaire(true)}>
            📸 Avec une autre photo
          </button>
          {erreur && (
            <p className="rf-erreur" role="alert">
              {erreur}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
const STYLES_REFAIRE = `
.rf{display:flex;flex-direction:column;gap:10px;margin:14px 0 0;padding:14px 16px;border-radius:24px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
.rf-tete{display:flex;align-items:center;gap:12px;width:100%;padding:0;border:0;background:none;color:#FFF4E6;font:inherit;text-align:left;cursor:pointer}
.rf-tete > span:first-child{font-size:24px;line-height:1}
.rf-tete > span:last-child{display:flex;flex-direction:column;gap:2px}
.rf-tete b{font-size:15px;font-weight:900}
.rf-tete small{font-size:12.5px;color:#CDB4C0}
.rf-corps{display:flex;flex-direction:column;gap:8px}
.rf-univers{display:flex;flex-direction:column;gap:6px;font-size:13px;color:#D9C3CB}
.rf-univers input{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:14px;border:1.5px solid rgba(255,255,255,.15);background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:16px}
.rf-corps button{padding:13px 14px;border-radius:999px;border:1.5px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:14.5px;font-weight:800;cursor:pointer}
.rf-erreur{margin:0;font-size:13px;color:#FF9C9C}
`;

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
  // (sa figurine prête : le studio, tout entier — le mème du jour, ses réactions et sa figurine du mois y sont rangés ;
  // « Ne perds jamais ta figurine » est devenu un cadenas doré, en haut, à côté de son prénom : `ma-collection.tsx`)
  if (etat.etape === "prete" && etat.neutre && etat.parle) return <StudioMoi key={etat.neutre} etat={etat} onEtat={onEtat} />;
  if (etat.etape === "fabrication")
    return etat.auto ? (
      <FabricationAuto etat={etat} onEtat={onEtat} />
    ) : (
      <Annonce titre="On fabrique ta figurine 🛠️">Ta photo est bien arrivée. Ta figurine sera ici dans quelques jours : tu pourras la faire parler et l’envoyer à tes proches.</Annonce>
    );
  if (etat.etape === "bientot") return <Annonce titre="Ta figurine arrive très bientôt 🛠️">Reviens ici dans quelques jours pour envoyer ta photo.</Annonce>;
  return (
    <>
      {/* (9 novembre 2026 : l'accueil de Pablito est devenu la bienvenue du tuto, `tuto.tsx`, ouverte une seule fois) */}
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
.tf-expr,.tf-att{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;width:100%;max-width:420px}
.tf-danse{padding:9px 16px;border-radius:999px;border:1.5px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:14px;font-weight:900;cursor:pointer}
.tf-danse.pris{border-color:#F2C46B;background:rgba(242,196,107,.2)}
.tf-expr button,.tf-att button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 2px 7px;border-radius:16px;border:0;background:rgba(255,255,255,.07);color:#E8D3DC;font:inherit;font-size:11.5px;font-weight:800;cursor:pointer;transition:transform .15s,background .2s,color .2s}
.tf-expr button span,.tf-att button span{font-size:26px;line-height:1.1}
.tf-expr button.pris,.tf-att button.pris{background:#FFF4E6;color:#2A0F1F;transform:translateY(-2px)}
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
.tf-expr button,.tf-voix button,.tf-att button{position:relative}
.tf-expr button.ferme,.tf-voix button.ferme,.tf-att button.ferme{opacity:.55;filter:grayscale(.6)}
.tf-modes button.ferme{opacity:.6}
.tf-cadenas{position:absolute;right:3px;top:2px;font-style:normal;font-size:11px}
.tf-nudge{margin:0;padding:9px 14px;border-radius:14px;background:rgba(242,196,107,.14);border:1px solid rgba(242,196,107,.45);font-size:13px;line-height:1.4;text-align:center;color:#FFE7B8;animation:tf-vu .4s cubic-bezier(.2,1.5,.4,1)}
.tf-nudge a{color:#FF9FD2;font-weight:900}
.tf-refaire-lien{border:0;background:none;color:#A88E99;font:inherit;font-size:12.5px;text-decoration:underline;cursor:pointer}
.tf-refaire{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}
.tf-refaire button{padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
.tf-fig.tf-or .fqp-fig{box-shadow:0 0 0 4px #F2C46B,0 0 40px rgba(255,214,120,.55),0 30px 60px -24px rgba(0,0,0,.95)}
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
.tf-etapes li{scroll-margin-top:72px}
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
.tf-accords{display:flex;flex-direction:column;gap:8px;min-width:0}
.tf-pour-autour{background:rgba(255,46,154,.1);border-color:rgba(255,46,154,.6)}
.tf-pour-autour small{font-size:13px;line-height:1.35;color:#E8D3DC}
.tf-vers-autour{width:100%;padding:14px 16px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:15px;font-weight:900;cursor:pointer;box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}
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
.tf-scene .tf-expr,.tf-scene .tf-att{display:flex;gap:8px;max-width:100%;padding:6px 2px 10px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;-webkit-mask-image:linear-gradient(90deg,#000 88%,transparent);mask-image:linear-gradient(90deg,#000 88%,transparent)}
.tf-scene .tf-expr::-webkit-scrollbar,.tf-scene .tf-att::-webkit-scrollbar{display:none}
.tf-scene .tf-expr button,.tf-scene .tf-att button{flex:none;width:74px;min-height:72px;scroll-snap-align:start;justify-content:center;border-radius:20px}
.tf-scene .tf-expr button span,.tf-scene .tf-att button span{font-size:28px}
.tf-expr button.cours,.tf-att button.cours{color:#F2C46B;background:rgba(242,196,107,.08)}
.tf-expr button.cours span,.tf-att button.cours span{opacity:.45;filter:grayscale(.5)}
.tf-expr button.cours::after,.tf-att button.cours::after{content:"";position:absolute;inset:4px;border-radius:16px;border:2px solid transparent;border-top-color:#F2C46B;border-right-color:rgba(242,196,107,.35);animation:tf-tourne 1s linear infinite}
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
.tf-voix-choisie{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.22);color:#D9C3CB;font:inherit;font-size:13.5px;cursor:pointer}
.tf-voix-choisie b{color:#FFF4E6}
.tf-voix-choisie em{font-style:normal;font-weight:800;color:#FF9FD2;margin-left:4px}
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
.tf-pendant{display:flex;flex-direction:column;gap:10px;width:100%;box-sizing:border-box;margin-top:6px;padding:16px;border-radius:22px;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,46,154,.4);text-align:left}
.tf-pendant-titre{font-size:17px;font-weight:900}
.tf-pendant .tf-note{margin:0}
.tf-pendant .tf-prets{margin:0;padding:2px 0 6px}
.tf-pendant-pret{margin:0;font-size:14px;font-weight:900;color:#7FF0C4}
.tf-revele{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;box-sizing:border-box;padding:16px;border-radius:22px;background:radial-gradient(90% 70% at 50% 0%,rgba(61,226,166,.22),transparent 70%),rgba(255,255,255,.05);border:1.5px solid rgba(61,226,166,.55);text-align:center}
.tf-revele b{font-size:18px;font-weight:900}
.tf-revele span{font-size:14.5px;color:#E8D3DC}
.tf-revele-go{width:100%;border:0;border-radius:999px;background:linear-gradient(135deg,#FF2E9A,#FF7A59);color:#fff;font:inherit;font-weight:900;cursor:pointer;box-shadow:0 12px 26px -12px rgba(255,46,154,.95);animation:tf-brille 1.8s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.tf-revele-go{animation:none}}
.tf-prets{display:flex;gap:6px;margin:0 -16px;padding:2px 16px 6px;overflow-x:auto;scrollbar-width:none}
.tf-prets::-webkit-scrollbar{display:none}
.tf-prets button{flex:none;display:inline-flex;align-items:center;gap:5px;padding:8px 13px;border-radius:999px;border:1.5px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#FFF4E6;font:inherit;font-size:13px;font-weight:800;white-space:nowrap;cursor:pointer}
.tf-prets button.du-jour{border-color:rgba(242,196,107,.7);background:rgba(242,196,107,.14)}
.tf-prets .tf-surprends{border-color:transparent;background:linear-gradient(135deg,#FF2E9A,#FF7A59);color:#fff;font-weight:900;box-shadow:0 8px 18px -10px rgba(255,46,154,.9)}
.tf-prets .tf-surprends.tourne span{display:inline-block;animation:tf-de .6s linear infinite}
@keyframes tf-de{to{transform:rotate(360deg)}}
.tf-surprise{position:relative;display:flex;flex-direction:column;gap:8px;padding:14px 16px 14px;border-radius:20px;background:radial-gradient(90% 70% at 50% 0%,rgba(255,46,154,.22),transparent 70%),rgba(255,255,255,.06);border:1.5px solid rgba(255,46,154,.45)}
.tf-surprise small{padding-right:28px;font-size:12px;font-weight:800;letter-spacing:.02em;color:#F7B9D6}
.tf-surprise-texte{margin:0;font-size:18px;font-weight:900;line-height:1.3;color:#FFF4E6}
.tf-surprise-humeur{font-size:12.5px;color:#D9C3CB}
.tf-surprise-attente{margin:0;font-size:14.5px;font-weight:800;color:#F7B9D6}
.tf-surprise-attente span{display:inline-block;animation:tf-de .6s linear infinite}
.tf-surprise-boutons{display:flex;gap:8px}
.tf-surprise-boutons button{flex:1;padding:11px 12px;border-radius:999px;font:inherit;font-size:14.5px;font-weight:900;cursor:pointer}
.tf-surprise-encore{border:1.5px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:#FFF4E6}
.tf-surprise-oui{border:0;background:linear-gradient(135deg,#3DE2A6,#21B98A);color:#0B2A20}
.tf-surprise-boutons button:disabled{opacity:.6;cursor:default}
.tf-surprise-carte{font-size:12.5px;font-weight:800;color:#F2C46B;text-decoration:none}
.tf-surprise-fermer{position:absolute;top:8px;right:8px;width:30px;height:30px;border-radius:50%;border:0;background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:13px;cursor:pointer}
@media (prefers-reduced-motion:reduce){.tf-prets .tf-surprends.tourne span,.tf-surprise-attente span{animation:none}}
.tf-prets button.pris{border-color:#FF2E9A;background:rgba(255,46,154,.22)}
.tf-premier{margin:0;padding:8px 12px;border-radius:14px;background:rgba(127,240,196,.1);border:1px solid rgba(127,240,196,.35);font-size:13px;font-weight:700;color:#BFF7E2}
@keyframes tf-tourne{to{transform:rotate(360deg)}}
@keyframes tf-bat{0%,100%{transform:scale(1)}15%{transform:scale(1.07)}}
/* ─── 9 novembre 2026 : « CRÉER » EN TROIS ÉTAPES (l'avis d'un ami) — sa figurine en haut, l'aperçu de son mème ; sa
   vignette quand elle sort de l'écran ; deux onglets ; trois étapes numérotées ; « Créer mon mème » ; deux feuilles ─── */
/* (une étape glisse depuis le côté : rien ne doit dépasser de l'écran pendant qu'elle arrive — « clip », pas « hidden »,
   pour garder le bas collé au-dessus du menu) */
.tf-moi{gap:14px;overflow-x:clip}
.tf-parler[hidden],.tf-reactions[hidden]{display:none}
.tf-moi .tf-scene{position:relative;gap:4px;margin:-14px -16px 0;padding:8px 16px 4px}
.tf-moi .tf-fig .fqp-fig{width:min(180px,46vw);width:clamp(124px,19dvh,190px);transition:width .3s cubic-bezier(.2,.9,.3,1)}
.tf-moi:has(.tf-texte textarea:focus) .tf-fig .fqp-fig{width:clamp(96px,13dvh,130px)}
.tf-hero-dit{font-size:12px;font-weight:700;color:#B49AA8}
/* sa vignette : sous la barre du haut, quand sa figurine est sortie de l'écran */
.tf-mini{position:fixed;left:0;right:0;z-index:30;display:flex;align-items:center;gap:10px;height:56px;padding:0 14px 0 10px;box-sizing:border-box;border:0;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(18,6,15,.94);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);color:#E8D3DC;font:inherit;text-align:left;cursor:pointer;animation:tf-mini .22s ease-out}
.tf-mini img{flex:none;width:40px;height:40px;border-radius:12px;object-fit:cover;object-position:50% 12%;background:#FF2E9A;box-shadow:0 0 0 2px rgba(242,196,107,.55)}
.tf-mini span{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:13px;font-weight:700}
.tf-mini span b{color:#FFF4E6}
.tf-mini .tf-g-cours{position:static;flex:none}
.tf-g-cours{position:absolute;top:-4px;right:-4px;width:14px;height:14px;box-sizing:border-box;border-radius:50%;border:2.5px solid rgba(242,196,107,.25);border-top-color:#F2C46B;animation:tf-tourne 1s linear infinite}
@keyframes tf-mini{from{transform:translateY(-100%)}}
/* trois étapes : une carte chacune, son numéro, ce qu'on y fait, à quoi ça sert */
.tf-etape{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:24px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);min-width:0}
.tf-etape-tete{display:flex;align-items:center;gap:10px}
.tf-etape-n{display:grid;place-items:center;flex:none;width:30px;height:30px;border-radius:50%;background:#FF2E9A;color:#fff;font-size:15px;font-weight:900}
.tf-etape-quoi{display:flex;flex-direction:column;flex:1;min-width:0}
.tf-etape-quoi b{font-size:17px;font-weight:900;line-height:1.2}
.tf-etape-quoi small{font-size:12.5px;line-height:1.35;color:#CDB4C0}
.tf-etape-tete .tf-ecouter{flex:none;padding:9px 14px;font-size:13.5px;box-shadow:none;background:rgba(255,46,154,.18);color:#FFD1E8;border:1.5px solid rgba(255,46,154,.55)}
.tf-etape > .tf-modes{align-self:stretch}
.tf-etape > .tf-modes button{padding:9px 10px;font-size:13.5px}
.tf-pas-idee{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:11px 14px;border-radius:16px;border:1px solid rgba(242,196,107,.35);background:rgba(242,196,107,.1);color:#F2C46B;font:inherit;text-align:left;cursor:pointer}
.tf-pas-idee span{display:flex;flex-direction:column;gap:1px}
.tf-pas-idee b{font-size:14.5px;font-weight:900}
.tf-pas-idee small{font-size:12px;color:#E5D2B0}
/* « Ou je choisis son visage moi-même » : un lien, pas une vignette de plus */
.tf-sa-tete{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 4px;border:0;background:none;color:#F2C46B;font:inherit;font-size:14px;font-weight:800;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.tf-sa-tete-dit{margin-top:-6px;font-size:12.5px;color:#D9C3CB}
.tf-etape .tf-quelle-voix{padding:0;border:0;background:none}
/* elle danse en parlant : un interrupteur */
.tf-danse-ligne{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:4px}
.tf-danse-ligne > span{display:flex;flex-direction:column;gap:1px}
.tf-danse-ligne b{font-size:14.5px;font-weight:800}
.tf-danse-ligne small{font-size:12px;color:#B49AA8}
.tf-danse{position:relative;flex:none;width:52px;height:30px;padding:0;border:0;border-radius:999px;background:rgba(255,255,255,.16);cursor:pointer;transition:background .2s}
.tf-danse i{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#FFF4E6;box-shadow:0 2px 6px rgba(0,0,0,.5);transition:transform .2s}
.tf-danse.pris{background:linear-gradient(135deg,#FF2E9A,#F2C46B)}
.tf-danse.pris i{transform:translateX(22px)}
/* le but, écrit sur le bouton */
.tf-moi .tf-envoi{margin-top:0;padding-top:0;border-top:0}
.tf-envoi .tf-envoyer{display:flex;flex-direction:column;align-items:center;gap:1px;padding:13px 18px;background:linear-gradient(135deg,#FF2E9A,#FF7A59)}
.tf-envoi .tf-envoyer b{font-size:17px;font-weight:900}
.tf-envoi .tf-envoyer small{font-size:12px;font-weight:600;opacity:.92}
/* 🪜 écran par écran : la barre des étapes, une étape à la fois (elle glisse du bon côté), le bas toujours à portée */
.tf-pas{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.tf-pas button{position:relative;display:flex;align-items:center;justify-content:center;gap:6px;min-width:0;height:40px;padding:0 8px;border:0;border-radius:999px;background:rgba(255,255,255,.05);color:#9C8290;font:inherit;font-size:12.5px;font-weight:800;cursor:pointer;-webkit-tap-highlight-color:transparent}
.tf-pas button i{display:grid;place-items:center;flex:none;width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.12);font-style:normal;font-size:12px;font-weight:900;color:#E8D3DC}
.tf-pas button span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.tf-pas button.pris{background:rgba(255,46,154,.16);color:#FFF4E6;box-shadow:inset 0 0 0 1.5px rgba(255,46,154,.65)}
.tf-pas button.pris i{background:#FF2E9A;color:#fff}
.tf-pas button.fait{color:#E8D3DC}
.tf-pas button.fait i{background:#7CE0C3;color:#12060F}
.tf-pas button:disabled{opacity:.45;cursor:default}
.tf-etape[hidden]{display:none}
.tf-etape:not([hidden]){animation:tf-entre .3s cubic-bezier(.2,.8,.2,1)}
.tf-etape[data-sens="arriere"]:not([hidden]){animation-name:tf-entre-g}
@keyframes tf-entre{from{opacity:0;transform:translateX(32px)}}
@keyframes tf-entre-g{from{opacity:0;transform:translateX(-32px)}}
@media (prefers-reduced-motion:reduce){.tf-etape:not([hidden]){animation:none}}
.tf-moi .tf-suite{position:sticky;bottom:calc(98px + env(safe-area-inset-bottom));z-index:6;display:flex;flex-direction:row;align-items:stretch;gap:10px;margin:0;padding:10px 0 6px;border-top:0;background:linear-gradient(180deg,rgba(18,6,15,0),rgba(18,6,15,.94) 32%)}
.tf-suite > button{min-height:56px}
.tf-retour{flex:none;padding:0 16px;border:1.5px solid rgba(255,255,255,.22);border-radius:999px;background:rgba(18,6,15,.7);color:#FFF4E6;font:inherit;font-size:14px;font-weight:800;cursor:pointer;-webkit-tap-highlight-color:transparent}
.tf-suivant{flex:1;min-width:0;padding:0 18px;border:0;border-radius:999px;background:linear-gradient(135deg,#FF2E9A,#FF7A59);color:#fff;font:inherit;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 14px 30px -12px rgba(255,46,154,.9);-webkit-tap-highlight-color:transparent}
.tf-suivant:disabled{opacity:.45;box-shadow:none;cursor:default}
.tf-suite .tf-envoyer,.tf-suite .tf-revoir{flex:1;min-width:0}
/* les deux feuilles : « Pas d'idée ? », son visage au choix */
.tf-feuille-idee .tf-feuille-corps,.tf-feuille-tete .tf-feuille-corps{display:flex;flex-direction:column;gap:10px}
.tf-feuille-titre{padding-right:44px;font-size:20px;font-weight:900}
.tf-feuille-dit{margin-top:-6px;font-size:13px;line-height:1.4;color:#CDB4C0}
.tf-idee{display:flex;align-items:center;gap:12px;width:100%;padding:14px;border-radius:20px;border:1.5px solid rgba(255,46,154,.5);background:linear-gradient(135deg,rgba(255,46,154,.26),rgba(255,122,89,.16));color:#FFF4E6;font:inherit;text-align:left;cursor:pointer}
.tf-idee > span:first-child{font-size:28px;line-height:1}
.tf-idee > span:last-child{display:flex;flex-direction:column;gap:1px}
.tf-idee b{font-size:15.5px;font-weight:900}
.tf-idee small{font-size:12.5px;color:#F0DCE5}
.tf-idee.du-jour{border-color:rgba(242,196,107,.45);background:rgba(242,196,107,.1)}
.tf-idee.tourne > span:first-child{animation:tf-tourne 1s linear infinite}
.tf-feuille-idee .tf-prets{flex-wrap:wrap;margin:0;padding:0;overflow:visible}
.tf-feuille-tete .tf-note{margin:0;padding:8px 12px;border-radius:14px;background:rgba(242,196,107,.1);font-size:12.5px;color:#FFE7B8;text-align:left}
.tf-feuille-tete .tf-note-atelier b{color:#F2C46B}
.tf-garder{margin-top:4px;padding:14px 18px;border:0;border-radius:999px;background:linear-gradient(135deg,#FF2E9A,#FF7A59);color:#fff;font:inherit;font-size:15.5px;font-weight:900;cursor:pointer}
/* deux onglets */
.tf-onglets{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}
.tf-onglets button{min-width:0;padding:11px 4px;border:0;border-radius:999px;background:none;color:#D9C3CB;font:inherit;font-size:14px;font-weight:900;white-space:nowrap;cursor:pointer;transition:background .2s,color .2s}
.tf-onglets button.pris{background:linear-gradient(135deg,#FF2E9A,#FF7A59);color:#fff;box-shadow:0 8px 18px -10px rgba(255,46,154,.9)}
.tf-parler,.tf-reactions{display:flex;flex-direction:column;gap:12px;min-width:0}
.tf-moi .tf-panneau{gap:10px}
.tf-panneau > .tf-modes{align-self:flex-start;display:inline-grid;grid-template-columns:auto auto}
.tf-panneau > .tf-modes button{padding:8px 14px;font-size:13px}
.tf-revoir{padding:14px 18px;border-radius:999px;border:1.5px solid rgba(61,226,166,.55);background:rgba(61,226,166,.12);color:#BFF7E2;font:inherit;font-size:15px;font-weight:900;cursor:pointer}
/* en bas, repliés */
/* (le haut de l'endroit visé reste visible sous la barre du haut et sa vignette) */
.tf-moi [id]{scroll-margin-top:128px}
/* 🪟 une feuille qui monte, en bas de l'écran */
.tf-feuille{position:fixed;inset:0;z-index:40;display:flex;flex-direction:column;justify-content:flex-end;visibility:hidden;pointer-events:none;transition:visibility 0s .35s}
.tf-feuille.ouverte{visibility:visible;pointer-events:auto;transition:none}
.tf-feuille-fond{position:absolute;inset:0;background:rgba(8,2,6,.62);opacity:0;touch-action:none;transition:opacity .3s}
.tf-feuille.ouverte .tf-feuille-fond{opacity:1}
.tf-feuille-corps{position:relative;width:100%;max-width:560px;max-height:calc(100dvh - 48px);margin:0 auto;box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;padding:10px 16px calc(18px + env(safe-area-inset-bottom));border-radius:28px 28px 0 0;background:linear-gradient(180deg,#2C1024,#180713 70%);color:#FFF4E6;box-shadow:0 -24px 60px -12px rgba(0,0,0,.95),inset 0 1px 0 rgba(255,200,230,.2);transform:translateY(105%);transition:transform .35s cubic-bezier(.2,.9,.3,1)}
.tf-feuille.ouverte .tf-feuille-corps{transform:none}
.tf-feuille-poignee{display:block;width:44px;height:5px;margin:0 auto 12px;border-radius:999px;background:rgba(255,255,255,.22)}
.tf-feuille-fermer{position:absolute;top:10px;right:12px;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.09);color:#FFF4E6;font:inherit;font-size:14px;cursor:pointer}
.tf-feuille-meme .tf-feuille-corps{display:flex;flex-direction:column;align-items:center;gap:10px}
.tf-feuille-meme .tf-meme-toile{width:min(210px,54vw);margin:0 auto}
.tf-feuille-meme .tf-meme-pret{width:100%}
.tf-meme-titre{font-size:19px;font-weight:900;color:#7FF0C4}
.tf-meme-cote{display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px;align-items:center;width:100%}
.tf-meme-cote .tf-meme-video{width:clamp(110px,34vw,156px)}
.tf-meme-partage{display:flex;flex-direction:column;gap:8px;min-width:0}
.tf-meme-partage .tf-wa{padding:13px 10px;font-size:15.5px;text-align:center}
.tf-meme-partage .tf-copier,.tf-meme-partage .tf-sms{display:block;padding:10px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:14px;font-weight:800;text-align:center;text-decoration:none;cursor:pointer}
.tf-meme-partage .tf-adresse{padding:7px 8px;font-size:11px}
.tf-meme-pret .tf-public{width:100%;padding:15px 16px;border:0;border-radius:999px;background:linear-gradient(135deg,#FF7A59,#FF2E9A);color:#fff;font-size:16px;font-weight:900;box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}
.tf-meme-pret .tf-public.pris{padding:11px 14px;border:1px solid rgba(61,226,166,.6);background:rgba(61,226,166,.12);color:#9BF2CF;font-size:14px;box-shadow:none}
.tf-public-dit{margin-top:-4px;font-size:12px;line-height:1.35;color:#A88E99;text-align:center}
@media (prefers-reduced-motion:reduce){.tf-feuille-corps,.tf-moi .tf-fig .fqp-fig,.tf-g-cours,.tf-mini,.tf-idee.tourne > span:first-child,.tf-danse,.tf-danse i{animation:none;transition:none}}
@media (min-width:860px){
  .tf-moi{grid-template-columns:minmax(0,5fr) minmax(0,6fr);column-gap:40px;align-items:start}
  .tf-moi > *{grid-column:2}
  .tf-moi .tf-scene{position:sticky;grid-column:1;grid-row:1/span 6;top:84px;margin:0;padding:0 0 12px}
  .tf-mini{display:none}
  .tf-moi .tf-fig .fqp-fig,.tf-moi:has(.tf-texte textarea:focus) .tf-fig .fqp-fig{width:min(340px,30vw)}
  .tf-moi .tf-etape{padding:18px}
  .tf-moi [id]{scroll-margin-top:96px}
  .tf-feuille-corps{margin-bottom:24px;border-radius:28px}
}
`;
