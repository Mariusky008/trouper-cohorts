"use client";

/**
 * 📚 L'ÉTAGÈRE, À L'ÉCRAN — lot E1 « Noté ! » (`lib/direct/etagere.ts` pour les règles ; le cahier :
 * `docs/univers/etagere.md` ; la maquette validée : `docs/univers/maquettes/etagere.html`).
 *
 *   · `useEtagere` : dans la conversation, ce que leurs figurines ont noté (relu avec la conversation vivante) ; un objet
 *     qu'il n'a pas encore vu se poser s'envole — la figurine de celui qui l'a dit brandit « 📌 Noté ! », l'emoji vole
 *     jusqu'à l'étagère au mur, se pose, la carte apparaît dans le fil, et l'autre figurine dit une phrase. Une fois par
 *     personne ; trois envols au plus d'affilée (les autres se posent sans vol) ; sans mouvement si le téléphone le
 *     demande (`prefers-reduced-motion`) ;
 *   · `MurEtagere` : la planche en haut de la scène, les cinq derniers, « 📚 Votre étagère · 6 » ;
 *   · `PastilleEtagere` : « 📚 6 », dans l'en-tête de la conversation ;
 *   · `CarteNote` : « 📌 NOTÉ SUR VOTRE ÉTAGÈRE », dans le fil ;
 *   · `PageEtagere` : « Votre étagère » (les trois rayons, les règles, la pause) ; `FicheObjet` : un souvenir en grand
 *     (la phrase exacte, qui l'a dite, quand ; changer la date ; le retirer, pour les deux).
 *   · 📅 LOT E2 « PLUS TARD » : `CarteEtagere` — dans le fil, la fierté (« 🏆 RANGÉ EN HAUT DE VOTRE ÉTAGÈRE », « 🎁 Lui
 *     offrir un cadeau »), la promesse tenue (« ✅ PROMESSE TENUE »), la relance (« VOS FIGURINES SE SOUVIENNENT », « 🪧
 *     Ce soir ? », « ✅ C'est fait ! ») ; et la première fois qu'il la voit, la scène fait la fête (des confettis, les
 *     figurines qui sautent, une phrase) ; la fiche : « 🏆 C'est réussi », « ✅ C'est fait ! », « Annuler » (24 h) ;
 *     `RappelsDuMatin` : sur « Chez moi », le rappel de sa figurine (« Aujourd'hui, c'est le permis de Léa 🚗 »),
 *     « 🎭 Un mème », « 🎙️ Un vocal », puis « ✓ Envoyé à Léa ».
 *   · 🕸️ LOT E3 « LA POUSSIÈRE ET LES IDÉES » : l'étagère qui prend la poussière (la scène grise, les toiles, les
 *     figurines endormies, le meuble terne ; `CartePoussiere` : rien que pour lui, de sa figurine) ; « ✨ L'ÉTAGÈRE SE
 *     RALLUME » (`CarteRallume`, la scène qui se réveille) ; « 🎭 Un mème avec votre blague » ; l'état sur la page.
 *   · 🏡 LOT E4 « MON ÉTAGÈRE » (le 14 novembre 2026) : `EtagereChezMoi`, la planche sous la fenêtre de mon univers
 *     (« 📚 Mon étagère ») ; `PageMonEtagere` : ce qui me concerne dans toutes mes conversations (d'où ça vient) et ce que
 *     j'ai déposé, « 👀 Montrer à mes visiteurs » souvenir par souvenir ; `FeuilleDeposer` : « ＋ Déposer », sur la mienne
 *     ou sur la nôtre (pour moi, pour lui, pour nous deux).
 *   · 📌 LOT E5 « JE LE RANGE ? » (le 14 novembre 2026, `docs/univers/etagere-accord.md`) : la figurine demande avant de
 *     ranger. Dans la scène, une fois par conversation et par jour, la figurine de celui qui l'a dit brandit « 📌 Je le
 *     range ? », l'objet dans les mains, et dit ce qu'elle a entendu ; `CarteQuestion` : « 📌 TA FIGURINE TE DEMANDE »
 *     dans le fil (« ✓ Oui, range-le », « Non », « Changer la date ») ; au « oui », l'envol d'aujourd'hui ; au « non »,
 *     « D'accord, j'oublie. » ; « ✨ À ranger » en haut de « Mon étagère » ; `RangeSansDemander` : le réglage, dans « Moi ».
 *
 * LE MOT : à l'écran, « souvenir » ; dans le code, `objet`.
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Feuille } from "./ma-figurine";
import { retenirMemePour } from "./meme-pour";
import { versLeStudio } from "./vers-le-studio";
import {
  CATALOGUE,
  EMOJI_DU_GENRE,
  PANNEAU_QUESTION,
  PHRASE_NON,
  REGLAGE_RANGE_SEUL,
  oubliDans,
  type QuestionVue,
  ETAGERE,
  ETAGERE_E2,
  GENRES_DEPOT,
  RAYONS,
  RAYONS_MIENS,
  REGLES_ETAGERE,
  REGLES_MON_ETAGERE,
  SORTES_DEPOT,
  type GenreDepot,
  type MonEtagereVue,
  type SorteDate,
  dureeRelance,
  ecartJours,
  jourDe,
  leJourLong,
  momentCourt,
  phraseDeNote,
  phraseFierte,
  phraseTenue,
  phrasesRelance,
  PHRASES_RALLUME,
  memeDeLaBlague,
  type CarteVue,
  type EtagereScene,
  type EtagereVue,
  type ObjetVu,
  type RappelVu,
} from "@/lib/direct/etagere";

const ROUTE = "/api/direct/etagere";
async function agir(corps: Record<string, unknown>): Promise<{ demande?: boolean }> {
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as { error?: string; demande?: boolean };
  if (!r.ok || j.error) throw new Error(j.error || "Ça n’a pas marché. Réessaie.");
  return j;
}
const calme = () => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};
const aujourdhui = () => jourDe(Date.now());

/** Ce qui se joue par-dessus une figurine pendant qu'un objet se pose (et, lot E2, pendant une fête : qui saute). */
export type JeuEtagere = { note: { qui: "moi" | "lui"; n: string; texte?: string; emoji?: string } | null; bulle: { qui: "moi" | "lui"; texte: string; n: string } | null; saute?: ("moi" | "lui")[] };

/** 🎉 Des confettis, dans la scène (pas si le téléphone préfère moins de mouvement). */
function confettis(zone: HTMLElement | null) {
  if (!zone || calme()) return;
  const cols = ["#FF2E9A", "#F2C46B", "#3DDC84", "#9fd8ff", "#ffffff"];
  const w = zone.clientWidth;
  const h = zone.clientHeight;
  for (let i = 0; i < 36; i++) {
    const c = document.createElement("span");
    c.className = "et-confetti";
    c.style.background = cols[i % cols.length];
    c.style.left = `${w / 2}px`;
    c.style.top = `${h * 0.35}px`;
    zone.appendChild(c);
    const a = Math.random() * Math.PI * 2;
    const d = 60 + Math.random() * w * 0.45;
    c.animate([{ transform: "translate(0,0) rotate(0)", opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * 0.6 + 80}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }], {
      duration: 1300 + Math.random() * 600,
      easing: "cubic-bezier(.2,.7,.4,1)",
      fill: "forwards",
    });
    window.setTimeout(() => c.remove(), 2100);
  }
}

/**
 * 📌 L'ÉTAGÈRE DANS LA CONVERSATION : les objets (sans ceux qu'il vient de retirer), ceux qui attendent de s'envoler,
 * l'envol en cours ; `retirer` (pour les deux, tout de suite).
 */
export function useEtagere(cle: string, scene: EtagereScene | undefined, refScene: RefObject<HTMLElement | null>, prenom = "", pret = true) {
  const [retires, setRetires] = useState<ReadonlySet<string>>(() => new Set());
  const [poses, setPoses] = useState<ReadonlySet<string>>(() => new Set());
  const [fetees, setFetees] = useState<ReadonlySet<string>>(() => new Set());
  // 📌 (lot E5) les questions auxquelles il vient de répondre ; celle que la scène vient de jouer
  const [repondues, setRepondues] = useState<ReadonlySet<string>>(() => new Set());
  const [jouee, setJouee] = useState("");
  const [vol, setVol] = useState("");
  const [arrive, setArrive] = useState("");
  const [jeu, setJeu] = useState<JeuEtagere>({ note: null, bulle: null });
  const envols = useRef(0);
  const enCours = useRef(false);
  const derniere = useRef("");
  // 📌 (lot E5) finir la question qui se joue (au bout du temps, ou dès qu'il répond)
  const finQuestion = useRef<(() => void) | null>(null);
  const minuteurs = useRef<number[]>([]);
  const plusTard = (ms: number, f: () => void) => minuteurs.current.push(window.setTimeout(f, ms));
  useEffect(() => () => minuteurs.current.forEach((t) => window.clearTimeout(t)), []);

  const objets = (scene?.objets ?? []).filter((o) => !retires.has(o.id));
  const attente = (scene?.nouveaux ?? []).filter((id) => !poses.has(id) && objets.some((o) => o.id === id));
  // 🃏 (lot E2) les cartes du fil, et celles qu'il n'a pas encore vues se jouer ; ✨ (lot E3) se rallumer
  const cartes = (scene?.cartes ?? []).filter((c) => !retires.has(c.objet.id));
  const rallumes = scene?.rallumes ?? [];
  const aFeter = [...cartes.filter((c) => c.nouvelle && !fetees.has(c.id)).map((c) => `c:${c.id}`), ...rallumes.filter((r) => r.nouvelle && !fetees.has(r.id)).map((r) => `c:${r.id}`)];
  // 📌 (lot E5) ses questions ; celle du jour se joue dans la scène (après les envols et les fêtes)
  const questions = (scene?.questions ?? []).filter((q) => !repondues.has(q.id));
  const aJouerQ = scene?.aJouer && !jouee && questions.some((q) => q.id === scene.aJouer) ? scene.aJouer : "";
  const cleAttente = [...attente, ...aFeter, ...(aJouerQ ? [`q:${aJouerQ}`] : [])].join(",");

  const poser = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;
      setPoses((p) => new Set([...p, ...ids]));
      void agir({ action: "vu", avec: cle, ids }).catch(() => undefined);
    },
    [cle],
  );

  const feter = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;
      setFetees((p) => new Set([...p, ...ids]));
      void agir({ action: "vu", avec: cle, ids }).catch(() => undefined);
    },
    [cle],
  );

  useEffect(() => {
    // (rien ne se joue avant que la conversation soit là : la scène, les figurines, son prénom)
    if (!pret || enCours.current || !cleAttente) return;
    const tous = cleAttente.split(",");
    const ids = tous.filter((x) => !x.startsWith("c:") && !x.startsWith("q:"));
    const aJouer = tous.filter((x) => x.startsWith("c:")).map((x) => x.slice(2));
    // 📌 (lot E5) « Je le range ? » : la figurine brandit le panneau, l'objet dans les mains, puis dit ce qu'elle a entendu
    const question = !ids.length && !aJouer.length ? questions.find((q) => `q:${q.id}` === tous.find((x) => x.startsWith("q:"))) : undefined;
    if (question) {
      const marquer = () => {
        setJouee(question.id);
        void agir({ action: "question-jouee", avec: cle }).catch(() => undefined);
        // (le suivant, s'il y en a : un souvenir qu'il vient de ranger s'envole)
        setPoses((p) => new Set(p));
      };
      if (calme()) return void Promise.resolve().then(marquer);
      enCours.current = true;
      const n = `q-${question.id}`;
      const finir = () => {
        if (finQuestion.current !== finir) return;
        finQuestion.current = null;
        setJeu((j) => (j.note?.n === n || j.bulle?.n === n ? { note: null, bulle: null } : j));
        enCours.current = false;
        marquer();
      };
      finQuestion.current = finir;
      plusTard(800, () => finQuestion.current === finir && setJeu({ note: { qui: question.qui, n, texte: PANNEAU_QUESTION, emoji: question.objet.emoji }, bulle: null }));
      plusTard(1400, () => finQuestion.current === finir && setJeu((j) => ({ ...j, bulle: { qui: question.qui, texte: question.phrase, n } })));
      plusTard(7400, finir);
      return;
    }
    // 🎉 (lot E2) une carte qu'il n'a pas encore vue se jouer : la fierté, la promesse tenue, la relance
    if (!ids.length) {
      // ✨ (lot E3) l'étagère se rallume : les toiles s'envolent, les deux figurines sursautent, l'une parle
      const r = rallumes.find((x) => x.id === aJouer[0]);
      if (r) {
        if (calme()) return void Promise.resolve().then(() => feter([r.id]));
        enCours.current = true;
        void Promise.resolve().then(() => setJeu({ note: null, bulle: { qui: "lui", texte: PHRASES_RALLUME[r.id.length % PHRASES_RALLUME.length], n: r.id }, saute: ["moi", "lui"] }));
        plusTard(4200, () => {
          setJeu({ note: null, bulle: null });
          enCours.current = false;
          feter([r.id]);
        });
        return;
      }
      const c = cartes.find((x) => x.id === aJouer[0]);
      if (!c) return;
      if (calme() || envols.current >= 3) return void Promise.resolve().then(() => feter(aJouer));
      enCours.current = true;
      envols.current += 1;
      const fini = (ms: number) =>
        plusTard(ms, () => {
          setJeu({ note: null, bulle: null });
          enCours.current = false;
          feter([c.id]);
        });
      const sc = refScene.current;
      if (c.genre === "fierte") {
        confettis(sc);
        const qui = c.objet.pourMoi || c.objet.deux ? "lui" : "moi";
        void Promise.resolve().then(() => setJeu({ note: null, bulle: { qui, texte: phraseFierte(c.objet.pourMoi || c.objet.deux ? null : prenom), n: c.id }, saute: [qui] }));
        fini(4800);
      } else if (c.genre === "tenue") {
        confettis(sc);
        void Promise.resolve().then(() => setJeu({ note: null, bulle: { qui: "moi", texte: phraseTenue(c.n ?? scene?.tenues ?? 1), n: c.id }, saute: ["moi", "lui"] }));
        fini(4800);
      } else {
        const [p1, p2] = phrasesRelance(c.n ?? 0, c.objet.emoji, c.id);
        void Promise.resolve().then(() => setJeu({ note: null, bulle: { qui: "lui", texte: p1, n: `${c.id}-1` } }));
        plusTard(3600, () => setJeu({ note: null, bulle: { qui: "moi", texte: p2, n: `${c.id}-2` } }));
        fini(6800);
      }
      return;
    }
    // (sans mouvement, ou déjà trois envols : ils se posent sans vol)
    if (calme() || envols.current >= 3) return void Promise.resolve().then(() => poser(ids));
    const o = (scene?.objets ?? []).find((x) => x.id === ids[0]);
    if (!o) return;
    enCours.current = true;
    envols.current += 1;
    const qui = o.de;
    const autre = qui === "moi" ? "lui" : "moi";
    void Promise.resolve().then(() => setJeu((j) => ({ ...j, note: { qui, n: o.id } })));
    plusTard(700, () => {
      setVol(o.id);
      // (le vol : de la figurine de celui qui l'a dit jusqu'à sa place sur l'étagère)
      window.requestAnimationFrame(() => {
        const sc = refScene.current;
        const depart = sc?.querySelector(`.pv-calque.${qui}`);
        const cible = sc?.querySelector(`.et-mur [data-objet="${o.id}"]`);
        const fin = () => {
          setVol("");
          setArrive(o.id);
          poser([o.id]);
          plusTard(500, () => {
            const texte = phraseDeNote(o.genre, o.id, derniere.current);
            derniere.current = texte;
            setJeu({ note: null, bulle: { qui: autre, texte, n: o.id } });
          });
          plusTard(5200, () => {
            setJeu((j) => (j.bulle?.n === o.id ? { ...j, bulle: null } : j));
            setArrive("");
            enCours.current = false;
            // (le suivant, s'il y en a)
            setPoses((p) => new Set(p));
          });
        };
        if (!sc || !depart || !cible) return fin();
        // (par-dessus tout l'écran : rien ne le coupe en route)
        const a = depart.getBoundingClientRect();
        const b = cible.getBoundingClientRect();
        const x0 = a.left + a.width * 0.42;
        const y0 = a.top + a.height * 0.35;
        const x1 = b.left;
        const y1 = b.top;
        const v = document.createElement("span");
        v.className = "et-vol";
        v.textContent = o.emoji;
        v.setAttribute("aria-hidden", "true");
        document.body.appendChild(v);
        const anim = v.animate(
          [
            { transform: `translate(${x0}px,${y0}px) scale(.5)`, opacity: 0 },
            { transform: `translate(${x0}px,${y0 - 34}px) scale(1.6)`, opacity: 1, offset: 0.25 },
            { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 40}px) scale(1.3)`, opacity: 1, offset: 0.6 },
            { transform: `translate(${x1}px,${y1}px) scale(.85)`, opacity: 1 },
          ],
          { duration: 1100, easing: "cubic-bezier(.35,.6,.4,1)", fill: "forwards" },
        );
        anim.onfinish = () => {
          v.remove();
          fin();
        };
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleAttente, poses, fetees, pret]);

  const retirer = useCallback(
    async (id: string) => {
      await agir({ action: "retirer", avec: cle, id });
      setRetires((r) => new Set([...r, id]));
    },
    [cle],
  );
  /** (retiré ailleurs — la page : il s'en va d'ici aussi) */
  const oublier = useCallback((id: string) => setRetires((r) => new Set([...r, id])), []);
  /** ✋ (lot E2) « 🏆 C'est réussi », « ✅ C'est fait ! », « Annuler » : la scène le montre à la relecture suivante. */
  const faire = useCallback(async (action: "reussi" | "tenue" | "annuler-tenue", id: string) => void (await agir({ action, avec: cle, id })), [cle]);
  /**
   * 📌 (lot E5) sa réponse : « oui » (le souvenir s'envole à la relecture suivante, comme un souvenir noté) ; « non » :
   * la figurine range l'objet dans sa poche (« D'accord, j'oublie. ») ; `quand` : le jour corrigé, et rangé.
   */
  const repondre = useCallback(
    async (q: QuestionVue, oui: boolean, quand?: string) => {
      await agir(quand ? { action: "date", avec: cle, id: q.id, quand } : { action: oui ? "oui" : "non", avec: cle, id: q.id });
      setRepondues((r) => new Set([...r, q.id]));
      // (il a répondu : le panneau se baisse tout de suite)
      finQuestion.current?.();
      if (oui || calme()) return;
      const n = `non-${q.id}`;
      setJeu((j) => ({ ...j, note: null, bulle: { qui: q.qui, texte: PHRASE_NON, n } }));
      plusTard(3400, () => setJeu((j) => (j.bulle?.n === n ? { ...j, bulle: null } : j)));
    },
    [cle],
  );
  return { objets, cartes, rallumes, questions, repondre, attente: new Set(attente.filter((id) => id !== vol)), vol, arrive, jeu, retirer, oublier, faire, tenues: scene?.tenues ?? 0, pause: scene?.pause ?? null, etat: scene?.etat ?? null, poussiere: scene?.poussiere ?? null };
}

/** 📚 La planche, en haut de la scène : les cinq derniers posés ; « 📚 Votre étagère · 6 ». Vide : rien. */
export function MurEtagere({ objets, attente, vol, arrive, onOuvrir, poussiere = false }: { objets: ObjetVu[]; attente: ReadonlySet<string>; vol: string; arrive: string; onOuvrir: () => void; poussiere?: boolean }) {
  const la = objets.filter((o) => !attente.has(o.id) || o.id === vol);
  const n = la.filter((o) => o.id !== vol).length;
  if (!la.length) return null;
  return (
    <>
      {/* 🕸️ (lot E3) la poussière : deux toiles d'araignée */}
      {poussiere && (
        <>
          <span className="et-toile g" aria-hidden="true">
            🕸️
          </span>
          <span className="et-toile d" aria-hidden="true">
            🕸️
          </span>
        </>
      )}
    <button type="button" className={`et-mur${poussiere ? " terne" : ""}`} onClick={onOuvrir} aria-label={`Votre étagère : ${n} souvenir${n > 1 ? "s" : ""}`}>
      <span className="et-rang">
        {la.slice(-5).map((o) => (
          <span key={o.id} data-objet={o.id} className={o.id === vol ? "vient" : o.id === arrive ? "arrive" : ""}>
            {o.emoji}
          </span>
        ))}
      </span>
      <span className="et-planche" aria-hidden="true" />
      <small>📚 Votre étagère · {n}</small>
    </button>
    </>
  );
}

/** 🕸️ (lot E3) « RIEN QUE POUR TOI, DE TA FIGURINE » : douze jours sans un mot, et une accroche tirée de l'étagère. */
export function CartePoussiere({ texte, bouton, onParler }: { texte: string; bouton: string; onParler: () => void }) {
  return (
    <li className="et-carte-fil prive">
      <div>
        <b className="et-entete">🕸️ RIEN QUE POUR TOI, DE TA FIGURINE</b>
        <p className="et-texte">{texte}</p>
        <span className="et-actions boutons">
          <button type="button" className="et-petit" onClick={onParler}>
            {bouton}
          </button>
        </span>
      </div>
    </li>
  );
}

/** ✨ (lot E3) « L'ÉTAGÈRE SE RALLUME » : ils se sont reparlé, après la poussière. */
export function CarteRallume({ prenom }: { prenom: string }) {
  return (
    <li className="et-carte-fil trophee">
      <div>
        <b className="et-entete">✨ L’ÉTAGÈRE SE RALLUME</b>
        <p className="et-texte">{prenom} et toi, c’est reparti.</p>
      </div>
    </li>
  );
}

/** « 📚 6 », dans l'en-tête de la conversation. */
export function PastilleEtagere({ n, onOuvrir }: { n: number; onOuvrir: () => void }) {
  if (!n) return null;
  return (
    <button type="button" className="et-pastille" onClick={onOuvrir} aria-label={`Votre étagère : ${n} souvenir${n > 1 ? "s" : ""}`}>
      📚 <span>{n}</span>
    </button>
  );
}

/** 📌 La carte dans le fil, visible des deux, à l'heure où c'est noté. */
export function CarteNote({ o, prenom, onVoir, onRetirer }: { o: ObjetVu; prenom: string; onVoir: () => void; onRetirer: () => void }) {
  return (
    <li className="et-carte-fil" data-objet={o.id}>
      <div>
        <b className="et-entete">{o.depose ? "✋ DÉPOSÉ SUR VOTRE ÉTAGÈRE" : "📌 NOTÉ SUR VOTRE ÉTAGÈRE"}</b>
        <span className="et-objet">
          <span className="et-e" aria-hidden="true">
            {o.emoji}
          </span>
          <span>
            <b>{o.titre}</b>
            <small>{o.detail}</small>
          </span>
        </span>
        <span className="et-actions">
          <button type="button" onClick={onVoir}>
            Voir l’étagère
          </button>
          <button type="button" className="doux" onClick={onRetirer}>
            Retirer
          </button>
        </span>
        <small className="et-pied">
          {o.depose ? `Déposé par ${o.de === "moi" ? "toi" : o.ditPar}` : "Noté par vos figurines · IA"} · visible de {prenom} et toi
        </small>
      </div>
    </li>
  );
}

/**
 * 📌 (lot E5) « TA FIGURINE TE DEMANDE », dans le fil, à l'heure où la question est née — visible de celui qui décide
 * (des deux pour un souvenir commun) : le souvenir, la phrase dite et qui l'a dite, « ✓ Oui, range-le », « Non », et
 * pour une date « Changer la date » (le jour se corrige avant de ranger : ça vaut un « oui »).
 */
export function CarteQuestion({ q, onRepondre }: { q: QuestionVue; onRepondre: (oui: boolean, quand?: string) => Promise<void> }) {
  const [changer, setChanger] = useState(false);
  const [quand, setQuand] = useState(q.objet.quand ?? "");
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");
  const o = q.objet;
  const date = !q.issue && (o.genre === "date" || o.genre === "promesse") && Boolean(o.quand);
  async function faire(oui: boolean, jour?: string) {
    setOccupe(true);
    setErreur("");
    try {
      await onRepondre(oui, jour);
    } catch (e) {
      setErreur((e as Error).message || "Ça n’a pas marché. Réessaie.");
      setOccupe(false);
    }
  }
  return (
    <li className="et-carte-fil question" data-question={q.id}>
      <div>
        <b className="et-entete">📌 TA FIGURINE TE DEMANDE</b>
        <span className="et-objet">
          <span className="et-e" aria-hidden="true">
            {q.issue ? "🏆" : o.emoji}
          </span>
          <span>
            <b>{o.titre}</b>
            {o.detail && <small>{o.detail}</small>}
          </span>
        </span>
        {q.issue || q.depot || !o.citation ? (
          <p className="et-texte">{q.phrase}</p>
        ) : (
          <blockquote>
            « {o.citation} »<cite>{o.de === "moi" ? "Toi" : o.ditPar}, {leJourLong(o.ditLe)}</cite>
          </blockquote>
        )}
        <span className="et-actions boutons">
          <button type="button" className="et-petit or" disabled={occupe} onClick={() => void faire(true)}>
            ✓ Oui, range-le
          </button>
          <button type="button" className="et-petit clair" disabled={occupe} onClick={() => void faire(false)}>
            Non
          </button>
          {date && !changer && (
            <button type="button" className="et-petit clair" disabled={occupe} onClick={() => setChanger(true)}>
              📅 Changer la date
            </button>
          )}
        </span>
        {changer && (
          <span className="et-date">
            <input type="date" aria-label="Le bon jour" min={aujourdhui()} value={quand} onChange={(e) => setQuand(e.target.value)} />
            <button type="button" className="et-bouton" disabled={!quand || occupe} onClick={() => void faire(true, quand)}>
              Ranger à ce jour
            </button>
          </span>
        )}
        {erreur && (
          <p className="et-erreur" role="alert">
            {erreur}
          </p>
        )}
        <small className="et-pied">
          Sans réponse, elle oublie {oubliDans(q.jusqua, aujourdhui())} · {q.depot ? `Déposé par ${o.ditPar}` : "Noté par vos figurines · IA"}
        </small>
      </div>
    </li>
  );
}

/**
 * 🃏 (lot E2) UNE CARTE DU FIL : la fierté, la promesse tenue, la relance — visible des deux, à son heure. `onCadeau` :
 * « 🎁 Lui offrir un cadeau » ; `onPanneau` : « 🪧 Ce soir ? » ; `onTenue` : « ✅ C'est fait ! ».
 */
export function CarteEtagere({ c, prenom, tenues, onVoir, onCadeau, onPanneau, onTenue }: { c: CarteVue; prenom: string; tenues: number; onVoir: () => void; onCadeau: () => void; onPanneau: () => void; onTenue: () => void }) {
  const o = c.objet;
  if (c.genre === "fierte")
    return (
      <li className="et-carte-fil trophee" data-carte={c.id}>
        <div>
          <b className="et-entete">🏆 RANGÉ EN HAUT DE VOTRE ÉTAGÈRE</b>
          <span className="et-objet">
            <span className="et-e" aria-hidden="true">
              🏆
            </span>
            <span>
              <b>{o.titre}</b>
              <small>{o.detail}</small>
            </span>
          </span>
          <span className="et-actions boutons">
            {!o.pourMoi && (
              <button type="button" className="et-petit" onClick={onCadeau}>
                🎁 Lui offrir un cadeau
              </button>
            )}
            <button type="button" className="et-petit clair" onClick={onVoir}>
              Voir l’étagère
            </button>
          </span>
        </div>
      </li>
    );
  if (c.genre === "tenue")
    return (
      <li className="et-carte-fil trophee" data-carte={c.id}>
        <div>
          <b className="et-entete">✅ PROMESSE TENUE</b>
          <span className="et-objet">
            <span className="et-e" aria-hidden="true">
              {o.emoji}
            </span>
            <span>
              <b>{o.titre}</b>
              <small>
                {c.n ?? tenues} promesse{(c.n ?? tenues) > 1 ? "s" : ""} tenue{(c.n ?? tenues) > 1 ? "s" : ""} entre vous
              </small>
            </span>
          </span>
        </div>
      </li>
    );
  const enCours = o.etat === "actif" || o.etat === "sommeil";
  return (
    <li className="et-carte-fil" data-carte={c.id}>
      <div>
        <b className="et-entete">{o.emoji} VOS FIGURINES SE SOUVIENNENT</b>
        {o.depose ? (
          <p className="et-texte">
            {o.titre} <small className="et-pied">· déposé par {o.de === "moi" ? "toi" : o.ditPar}, {leJourLong(o.ditLe)}</small>
          </p>
        ) : (
          <blockquote>
            « {o.citation} »<cite>{o.de === "moi" ? "Toi" : o.ditPar}, {leJourLong(o.ditLe)}</cite>
          </blockquote>
        )}
        <span className="et-duree">{dureeRelance(c.n ?? 0)}</span>
        {enCours ? (
          <span className="et-actions boutons">
            <button type="button" className="et-petit" onClick={onPanneau}>
              🪧 Ce soir ?
            </button>
            <button type="button" className="et-petit or" onClick={onTenue}>
              ✅ C’est fait !
            </button>
          </span>
        ) : (
          o.etat === "tenue" && <small className="et-tenue-ok">✅ Promesse tenue</small>
        )}
        <small className="et-pied">Visible de {prenom} et toi</small>
      </div>
    </li>
  );
}

/**
 * ☀️ (lot E2) LES RAPPELS DU MATIN, sur « Chez moi », sous la fenêtre de son univers : sa figurine le lui rappelle
 * (« Aujourd'hui, c'est le permis de Léa 🚗 Un petit mot avant le départ ? ») ; « 🎭 Un mème » (le studio, les mots
 * écrits, pour elle), « 🎙️ Un vocal » (leur conversation, le micro prêt) ; dès qu'il lui a écrit : « ✓ Envoyé à Léa ».
 * Le jour J, celui que ça concerne lit l'encouragement de SA figurine.
 */
export function RappelsDuMatin({ actif, onParler }: { actif: boolean; onParler: (cle: string) => void }) {
  const [rappels, setRappels] = useState<RappelVu[] | null>(null);
  useEffect(() => {
    if (!actif) return;
    let fini = false;
    fetch(`${ROUTE}?rappels=1`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { rappels?: RappelVu[] }) => !fini && setRappels(Array.isArray(j.rappels) ? j.rappels : []))
      .catch(() => !fini && setRappels([]));
    return () => {
      fini = true;
    };
  }, [actif]);
  if (!rappels?.length) return null;
  return (
    <div className="et-rappels">
      {rappels.map((r) => (
        <div key={`${r.cas}-${r.id}`} className={`et-rappel${r.cas === "encourage" || r.cas === "mien" ? " moi" : ""}`} data-objet={r.id}>
          {r.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.image} alt="" draggable={false} />
          ) : (
            <span aria-hidden="true">{r.emoji}</span>
          )}
          <div>
            <small>{r.cas === "encourage" ? "💪 DE TA FIGURINE" : r.cas === "mien" ? "📌 DE TON ÉTAGÈRE" : `📌 DE VOTRE ÉTAGÈRE, ${r.prenom.toLocaleUpperCase("fr-FR")} ET TOI`}</small>
            <p>{r.texte}</p>
            {r.cas !== "encourage" &&
              r.cas !== "mien" &&
              (r.fait ? (
                <p className="et-fait">✓ Envoyé à {r.prenom}</p>
              ) : (
                <span className="et-actions boutons">
                  <button type="button" className="et-petit" onClick={() => (retenirMemePour({ cle: r.cle, prenom: r.prenom }), versLeStudio({ texte: r.meme }))}>
                    🎭 Un mème
                  </button>
                  <button type="button" className="et-petit clair" onClick={() => onParler(r.cle)}>
                    🎙️ Un vocal
                  </button>
                </span>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** 🔎 Un souvenir en grand : la phrase exacte, qui l'a dite, quand ; changer la date ; le retirer, pour les deux. */
export function FicheObjet({
  o,
  prenom,
  onFermer,
  onRetirer,
  onDate,
  onFaire,
  onMeme,
  mienne = false,
  onMontrer,
}: {
  o: ObjetVu | null;
  prenom: string;
  onFermer: () => void;
  onRetirer: (o: ObjetVu) => Promise<void>;
  onDate: (o: ObjetVu, quand: string) => Promise<void>;
  onFaire?: (o: ObjetVu, action: "reussi" | "tenue" | "annuler-tenue") => Promise<void>;
  onMeme?: (texte: string) => void;
  /** 🏡 (lot E4) sur « Mon étagère » : d'où il vient, « Montrer à mes visiteurs », « Ne plus le garder chez moi ». */
  mienne?: boolean;
  onMontrer?: (o: ObjetVu, oui: boolean) => Promise<void>;
}) {
  const [changer, setChanger] = useState(false);
  const [quand, setQuand] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");
  const id = o?.id ?? "";
  useEffect(() => {
    void Promise.resolve().then(() => {
      setChanger(false);
      setErreur("");
      setQuand("");
    });
  }, [id]);
  const faire = async (f: () => Promise<void>) => {
    setOccupe(true);
    setErreur("");
    try {
      await f();
    } catch (e) {
      setErreur((e as Error).message || "Ça n’a pas marché. Réessaie.");
    } finally {
      setOccupe(false);
    }
  };
  const avenir = Boolean(o?.quand) && ecartJours(aujourdhui(), o?.quand ?? "") >= 0 && o?.etat === "actif";
  // 🏆 (lot E2) son épreuve : le jour est arrivé (jusqu'à trois jours après) ; ✅ une promesse ; « Annuler » 24 h
  const ecart = o?.quand ? ecartJours(o.quand, aujourdhui()) : -1;
  const reussir = Boolean(o && onFaire && o.genre === "date" && o.sorte === "epreuve" && o.etat === "actif" && (o.pourMoi || o.deux) && ecart >= 0 && ecart <= 3);
  const tenir = Boolean(o && onFaire && o.genre === "promesse" && (o.etat === "actif" || o.etat === "sommeil"));
  const annuler = Boolean(o && onFaire && o.etat === "tenue" && o.tenueLe && Date.now() - Date.parse(o.tenueLe) < ETAGERE_E2.annuler);
  return (
    <Feuille ouverte={Boolean(o)} onFermer={onFermer} titre={o ? o.titre : "Un souvenir"} className="et-feuille">
      {o && (
        <div className="et-fiche">
          <span className="et-e" aria-hidden="true">
            {o.emoji}
          </span>
          <b className="et-fiche-titre">{o.titre}</b>
          <small className="et-fiche-detail">{o.detail}</small>
          {o.depose ? (
            <p className="et-depose">
              ✋ Déposé par {o.de === "moi" ? "toi" : o.ditPar} · {momentCourt(o.ditLe)}
            </p>
          ) : (
            <blockquote>
              « {o.citation} »<cite>Dit par {o.de === "moi" ? "toi" : o.ditPar} · {momentCourt(o.ditLe)}</cite>
            </blockquote>
          )}
          <small className="et-pied">
            {mienne
              ? o.avec
                ? `${o.depose ? "Sur" : "Noté sur"} votre étagère, ${o.avec.prenom} et toi${o.depose ? "" : " · IA"}`
                : `Sur ton étagère · ${o.montre ? "tes visiteurs le voient" : "rien que pour toi"}`
              : `${o.depose ? "Déposé à la main" : "Noté par vos figurines · IA"} · visible de ${prenom} et toi`}
          </small>
          {/* 👀 (lot E4) ce qui ne concerne que moi : mes visiteurs peuvent le voir (jamais la phrase, ni avec qui) */}
          {mienne && onMontrer && o.peutMontrer && (
            <button type="button" className={`et-bouton${o.montre ? " clair" : " or"}`} disabled={occupe} onClick={() => void faire(() => onMontrer(o, !o.montre))}>
              {o.montre ? "🙈 Ne plus le montrer à mes visiteurs" : "👀 Montrer à mes visiteurs"}
            </button>
          )}
          {mienne && o.avec && !o.peutMontrer && <p className="et-note-douce">🤝 Il est à vous deux : il reste entre {o.avec.prenom} et toi.</p>}
          {o.genre === "date" && avenir && !reussir && <p className="et-note-douce">⏰ Ta figurine te le rappellera le jour venu, au moment de ton humeur du matin.</p>}
          {reussir && (
            <button type="button" className="et-bouton or" disabled={occupe} onClick={() => void faire(() => onFaire!(o, "reussi"))}>
              🏆 C’est réussi
            </button>
          )}
          {tenir && (
            <button type="button" className="et-bouton or" disabled={occupe} onClick={() => void faire(() => onFaire!(o, "tenue"))}>
              ✅ C’est fait !
            </button>
          )}
          {annuler && (
            <button type="button" className="et-bouton clair" disabled={occupe} onClick={() => void faire(() => onFaire!(o, "annuler-tenue"))}>
              Annuler (elle n’est pas tenue)
            </button>
          )}
          {o.genre === "gout" && <p className="et-note-douce">🎁 Une idée de cadeau, quand le moment viendra.</p>}
          {o.etat === "fierte" && <p className="et-note-douce">🏆 Rangé tout en haut, avec vos fiertés.</p>}
          {o.genre === "blague" && onMeme && (
            <button type="button" className="et-bouton" onClick={() => onMeme(memeDeLaBlague(o))}>
              🎭 En faire un mème
            </button>
          )}
          {(o.genre === "date" || o.genre === "promesse") && o.etat === "actif" && o.quand && !reussir && (
            <>
              {changer ? (
                <span className="et-date">
                  <input type="date" aria-label="Le nouveau jour" min={aujourdhui()} value={quand} onChange={(e) => setQuand(e.target.value)} />
                  <button type="button" className="et-bouton" disabled={!quand || occupe} onClick={() => void faire(async () => (await onDate(o, quand), setChanger(false)))}>
                    Garder ce jour
                  </button>
                </span>
              ) : (
                <button type="button" className="et-bouton clair" onClick={() => (setQuand(o.quand ?? ""), setChanger(true))}>
                  📅 Changer la date
                </button>
              )}
            </>
          )}
          <button type="button" className="et-bouton clair" disabled={occupe} onClick={() => void faire(() => onRetirer(o))}>
            {mienne ? (o.avec ? "Ne plus le garder chez moi" : "Retirer de mon étagère") : "Retirer de l’étagère"}
          </button>
          {mienne && o.avec && <small className="et-pied">(Il reste sur votre étagère, {o.avec.prenom} et toi.)</small>}
          {erreur && (
            <p className="et-erreur" role="alert">
              {erreur}
            </p>
          )}
        </div>
      )}
    </Feuille>
  );
}

/**
 * 📚 « VOTRE ÉTAGÈRE » : « Léa et toi » ; les compteurs ; le meuble et ses trois rayons (« Nos fiertés », « À venir »,
 * « Ce qu'on aime ») ; les règles en clair ; la pause. Un toucher sur un souvenir : sa fiche.
 */
export function PageEtagere({ cle, onFermer, onRetire, onMeme }: { cle: string; onFermer: () => void; onRetire?: (id: string) => void; onMeme?: (texte: string) => void }) {
  const [vue, setVue] = useState<EtagereVue | null>(null);
  const [erreur, setErreur] = useState("");
  const [fiche, setFiche] = useState<ObjetVu | null>(null);
  const [info, setInfo] = useState("");
  const [tour, setTour] = useState(0);
  const [depot, setDepot] = useState(false);
  useEffect(() => {
    let fini = false;
    fetch(`${ROUTE}?avec=${cle}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { etagere?: EtagereVue; error?: string }) => {
        if (fini) return;
        if (j.etagere) setVue(j.etagere);
        else setErreur(j.error || "Votre étagère ne s’ouvre pas. Réessaie.");
      })
      .catch(() => !fini && setErreur("Votre étagère ne s’ouvre pas. Réessaie."));
    return () => {
      fini = true;
    };
  }, [cle, tour]);
  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector(".et-feuille.ouverte") && onFermer();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [onFermer]);
  async function retirer(o: ObjetVu) {
    await agir({ action: "retirer", avec: cle, id: o.id });
    setFiche(null);
    setInfo(`${o.emoji} Retiré de votre étagère, pour vous deux`);
    onRetire?.(o.id);
    setTour((t) => t + 1);
  }
  async function dater(o: ObjetVu, quand: string) {
    await agir({ action: "date", avec: cle, id: o.id, quand });
    setFiche(null);
    setInfo(`📅 C’est noté : ${o.titre.charAt(0).toLowerCase()}${o.titre.slice(1)}, à la nouvelle date`);
    setTour((t) => t + 1);
  }
  async function faireSur(o: ObjetVu, action: "reussi" | "tenue" | "annuler-tenue") {
    await agir({ action, avec: cle, id: o.id });
    setFiche(null);
    setInfo(action === "reussi" ? "🏆 Rangé tout en haut, avec vos fiertés !" : action === "tenue" ? `✅ ${o.titre} : promesse tenue !` : "Annulé : elle attend encore d’être tenue.");
    setTour((t) => t + 1);
  }
  async function pause(oui: boolean) {
    try {
      await agir({ action: "pause", avec: cle, oui });
      setInfo(oui ? "⏸️ En pause : vos figurines ne notent plus rien entre vous deux." : "▶️ C’est reparti : vos figurines notent de nouveau.");
      setTour((t) => t + 1);
    } catch (e) {
      setErreur((e as Error).message);
    }
  }
  const objets = vue?.objets ?? [];
  const blague = objets.find((o) => o.genre === "blague");
  const rayon = (cleRayon: string) => {
    const l = objets.filter((o) => o.rayon === cleRayon);
    // (« À venir » : la plus proche d'abord ; « Ce qu'on aime » : le plus récent d'abord)
    if (cleRayon === "avenir") return l.sort((a, b) => (a.quand ?? "9999").localeCompare(b.quand ?? "9999"));
    return l.sort((a, b) => b.le.localeCompare(a.le));
  };
  const contenu = (
    <div className="et-page" role="dialog" aria-modal="true" aria-label={vue ? `Votre étagère, ${vue.prenom} et toi` : "Votre étagère"}>
      <header className="et-tete">
        <button type="button" className="et-retour" aria-label="Revenir à la conversation" onClick={onFermer}>
          ←
        </button>
        <span className="et-qui">
          <b>{vue ? `${vue.prenom} et toi` : "Votre étagère"}</b>
          <small>Votre étagère</small>
        </span>
        {vue?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="et-avatar" src={vue.image} alt="" draggable={false} />
        )}
      </header>
      {!vue && !erreur && (
        <div className="mc-attente">
          <i />
        </div>
      )}
      {erreur && (
        <p className="et-erreur" role="alert">
          {erreur}
        </p>
      )}
      {vue && (
        <>
          {/* 🕸️ (lot E3) l'état de leur relation : la relation, pas un message */}
          {vue.phraseEtat && <p className={`et-etat${vue.etat === "poussiere" ? " gris" : ""}`}>{vue.phraseEtat}</p>}
          <div className="et-compteurs">
            <div>
              <b>{objets.length}</b>
              <span>souvenir{objets.length > 1 ? "s" : ""}</span>
            </div>
            <div>
              <b>{vue.tenues}</b>
              <span>promesse{vue.tenues > 1 ? "s" : ""} tenue{vue.tenues > 1 ? "s" : ""}</span>
            </div>
            <div>
              <b>{blague ? blague.emoji : "–"}</b>
              <span>{blague ? "votre blague" : "pas de blague"}</span>
            </div>
          </div>
          <div className={`et-meuble${vue.etat === "poussiere" ? " poussiere" : ""}`}>
            {RAYONS.map((r) => {
              const l = rayon(r.cle);
              return (
                <div key={r.cle} className="et-rayon" data-rayon={r.cle}>
                  <span className="et-nom-rayon">{r.nom}</span>
                  {l.length ? (
                    l.map((o) => (
                      <button key={o.id} type="button" className={`et-objet-rayon${o.etat === "fierte" ? " haut" : ""}`} data-objet={o.id} onClick={() => setFiche(o)} aria-label={`${o.titre}, ${o.detail}`}>
                        <span className="et-e" aria-hidden="true">
                          {o.emoji}
                        </span>
                        <span className="et-etiquette">{o.titre}</span>
                        {o.etat === "tenue" && <i className="et-tenue">✓</i>}
                      </button>
                    ))
                  ) : (
                    <span className="et-rien">rien encore</span>
                  )}
                </div>
              );
            })}
          </div>
          {info && (
            <p className="et-info" role="status">
              {info}
            </p>
          )}
          {/* ✋ (lot E4) déposer à la main, sur la nôtre */}
          <button type="button" className="et-bouton et-deposer" onClick={() => setDepot(true)}>
            ＋ Déposer sur votre étagère
          </button>
          <p className="et-regles">{REGLES_ETAGERE}</p>
          {/* 🎭 (lot E3) leur blague, en mème */}
          {blague && onMeme && (
            <button type="button" className="et-bouton clair" onClick={() => onMeme(memeDeLaBlague(blague))}>
              🎭 Un mème avec votre blague
            </button>
          )}
          <div className="et-reglage">
            {vue.pause ? (
              vue.pause.moi ? (
                <button type="button" className="et-bouton clair" onClick={() => void pause(false)}>
                  ▶️ Relancer l’étagère
                </button>
              ) : (
                <p className="et-pause-autre">⏸️ {vue.prenom} a mis l’étagère en pause.</p>
              )
            ) : (
              <button type="button" className="et-lien" onClick={() => void pause(true)}>
                ⚙️ Mettre l’étagère en pause
              </button>
            )}
          </div>
        </>
      )}
      <FicheObjet o={fiche} prenom={vue?.prenom ?? ""} onFermer={() => setFiche(null)} onRetirer={retirer} onDate={dater} onFaire={faireSur} onMeme={onMeme} />
      <FeuilleDeposer
        ouverte={depot}
        avec={vue ? { cle, prenom: vue.prenom } : undefined}
        onFermer={() => setDepot(false)}
        onPose={(t, demande) => {
          setDepot(false);
          setInfo(demande ? `📌 ${t} : ${vue?.prenom ?? "Ton proche"} recevra la question. Rien ne se range sans son oui.` : `✋ ${t} : posé sur votre étagère. ${vue?.prenom ?? "Ton proche"} le verra dans votre conversation.`);
          setTour((x) => x + 1);
        }}
      />
    </div>
  );
  return typeof document === "undefined" ? null : createPortal(contenu, document.body);
}

/**
 * ✋ (lot E4) « ＋ DÉPOSER » : ce que c'est (une date, une promesse, un goût, une envie, une blague), son nom, son jour,
 * son objet (le catalogue) ; sur la nôtre : pour qui ; sur la mienne : le montrer, ou non, à mes visiteurs.
 */
export function FeuilleDeposer({
  ouverte,
  avec,
  visiteurs = false,
  onFermer,
  onPose,
}: {
  ouverte: boolean;
  avec?: { cle: string; prenom: string };
  /** (sur la mienne, quand j'ai un univers) « 👀 Mes visiteurs peuvent le voir » */
  visiteurs?: boolean;
  onFermer: () => void;
  /** `demande` : (lot E5) déposé pour l'autre, c'est une question à l'autre. */
  onPose: (titre: string, demande?: boolean) => void;
}) {
  const [genre, setGenre] = useState<GenreDepot | "">("");
  const [sorte, setSorte] = useState<SorteDate>("evenement");
  const [titre, setTitre] = useState("");
  const [quand, setQuand] = useState("");
  const [emoji, setEmoji] = useState("");
  const [pour, setPour] = useState<"moi" | "lui" | "deux">("deux");
  const [montre, setMontre] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");
  // (rouverte : tout repart de zéro)
  useEffect(() => {
    if (!ouverte) return;
    void Promise.resolve().then(() => {
      setGenre("");
      setSorte("evenement");
      setTitre("");
      setQuand("");
      setEmoji("");
      setPour("deux");
      setMontre(false);
      setErreur("");
    });
  }, [ouverte]);
  const g = GENRES_DEPOT.find((x) => x.cle === genre);
  const objet = emoji || (genre ? EMOJI_DU_GENRE[genre === "envie" ? "gout" : genre] : "📦");
  const dateExigee = genre === "date";
  const pret = Boolean(genre) && titre.trim().length >= 2 && (!dateExigee || Boolean(quand));
  async function poser() {
    setOccupe(true);
    setErreur("");
    try {
      const r = await agir({
        action: "deposer",
        genre,
        titre,
        emoji: objet,
        ...(quand && (genre === "date" || genre === "promesse") ? { quand } : {}),
        ...(genre === "date" ? { sorte } : {}),
        ...(avec ? { avec: avec.cle, pour } : { montre: visiteurs && montre }),
      });
      onPose(`${objet} ${titre.trim()}`, Boolean(r.demande));
    } catch (e) {
      setErreur((e as Error).message || "Ça n’a pas marché. Réessaie.");
    } finally {
      setOccupe(false);
    }
  }
  return (
    <Feuille ouverte={ouverte} onFermer={onFermer} titre={avec ? `Déposer sur votre étagère, ${avec.prenom} et toi` : "Déposer sur mon étagère"} className="et-feuille et-feuille-depot">
      <div className="et-depot">
        <b className="et-fiche-titre">{avec ? `Sur votre étagère, ${avec.prenom} et toi` : "Sur mon étagère"}</b>
        <span className="et-depot-libelle">C’est…</span>
        <span className="et-puces" role="radiogroup" aria-label="Ce que c’est">
          {GENRES_DEPOT.map((x) => (
            <button key={x.cle} type="button" role="radio" aria-checked={genre === x.cle} className={`et-puce${genre === x.cle ? " prise" : ""}`} data-genre={x.cle} onClick={() => setGenre(x.cle)}>
              {x.emoji} {x.nom}
            </button>
          ))}
        </span>
        {genre === "date" && (
          <span className="et-puces petites" role="radiogroup" aria-label="Quel jour">
            {SORTES_DEPOT.map((x) => (
              <button key={x.cle} type="button" role="radio" aria-checked={sorte === x.cle} className={`et-puce${sorte === x.cle ? " prise" : ""}`} data-sorte={x.cle} onClick={() => setSorte(x.cle)}>
                {x.nom}
              </button>
            ))}
          </span>
        )}
        <label className="et-champ">
          <span className="et-depot-libelle">Son nom</span>
          <input type="text" maxLength={ETAGERE.titreMax} value={titre} onChange={(e) => setTitre(e.target.value)} placeholder={g?.indice ?? "Le concert"} aria-label="Son nom" />
          <small>
            {titre.trim().length}/{ETAGERE.titreMax}
          </small>
        </label>
        {(genre === "date" || genre === "promesse") && (
          <label className="et-champ">
            <span className="et-depot-libelle">{genre === "date" ? (sorte === "fete" ? "Le jour (il revient tous les ans)" : "Le jour") : "Pour quand ? (si c’est prévu)"}</span>
            <input type="date" value={quand} min={sorte === "fete" && genre === "date" ? undefined : aujourdhui()} onChange={(e) => setQuand(e.target.value)} aria-label="Le jour" />
          </label>
        )}
        <span className="et-depot-libelle">
          Son objet <b className="et-objet-choisi">{objet}</b>
        </span>
        <span className="et-catalogue" role="radiogroup" aria-label="Son objet">
          {CATALOGUE.map((e) => (
            <button key={e} type="button" role="radio" aria-checked={objet === e} aria-label={e} className={objet === e ? "pris" : ""} onClick={() => setEmoji(e)}>
              {e}
            </button>
          ))}
        </span>
        {avec ? (
          <>
            <span className="et-depot-libelle">C’est pour qui ?</span>
            <span className="et-puces" role="radiogroup" aria-label="Pour qui">
              {(
                [
                  ["moi", "Moi"],
                  ["lui", avec.prenom],
                  ["deux", "Nous deux"],
                ] as const
              ).map(([c, n]) => (
                <button key={c} type="button" role="radio" aria-checked={pour === c} className={`et-puce${pour === c ? " prise" : ""}`} data-pour={c} onClick={() => setPour(c)}>
                  {n}
                </button>
              ))}
            </span>
            {/* 📌 (lot E5) pour l'autre : c'est l'autre qui dit oui */}
            {pour === "lui" && <p className="et-note-douce et-depot-question">📌 {avec.prenom} recevra la question : rien ne se range sans son oui.</p>}
          </>
        ) : (
          visiteurs && (
            <label className="et-coche">
              <input type="checkbox" checked={montre} onChange={(e) => setMontre(e.target.checked)} />
              <span>👀 Mes visiteurs peuvent le voir</span>
            </label>
          )
        )}
        <button type="button" className="et-bouton" disabled={!pret || occupe} onClick={() => void poser()}>
          {occupe ? "…" : "Poser sur l’étagère"}
        </button>
        {erreur && (
          <p className="et-erreur" role="alert">
            {erreur}
          </p>
        )}
      </div>
    </Feuille>
  );
}

/** 🏡 (lot E4) Ma page : la charger, et la recharger après un geste. */
function useMonEtagere(actif: boolean) {
  const [vue, setVue] = useState<MonEtagereVue | null>(null);
  const [erreur, setErreur] = useState("");
  const [tour, setTour] = useState(0);
  useEffect(() => {
    if (!actif) return;
    let fini = false;
    fetch(`${ROUTE}?moi=1`, { cache: "no-store" })
      .then(async (r) => ({
        ok: r.ok,
        j: (await r.json().catch(() => ({}))) as {
          etagere?: MonEtagereVue;
          error?: string;
        },
      }))
      .then(({ ok, j }) => {
        if (fini) return;
        if (ok && j.etagere) {
          setVue(j.etagere);
          setErreur("");
        } else setErreur(j.error || "Ton étagère ne s’ouvre pas. Réessaie.");
      })
      .catch(() => !fini && setErreur("Ton étagère ne s’ouvre pas. Réessaie."));
    return () => {
      fini = true;
    };
  }, [actif, tour]);
  // (il revient sur l'appli : un proche a peut-être déposé quelque chose entre-temps)
  useEffect(() => {
    if (!actif) return;
    const revient = () => document.visibilityState === "visible" && setTour((t) => t + 1);
    document.addEventListener("visibilitychange", revient);
    return () => document.removeEventListener("visibilitychange", revient);
  }, [actif]);
  return { vue, erreur, recharger: () => setTour((t) => t + 1) };
}

/**
 * 📚 (lot E4) SOUS LA FENÊTRE DE MON UNIVERS : ma planche (les six derniers posés) ; « 📚 Mon étagère · 7 » ; « ＋ ».
 * Un toucher : la page « Mon étagère ».
 */
export function EtagereChezMoi({ actif }: { actif: boolean }) {
  const [ouverte, setOuverte] = useState(false);
  const [depot, setDepot] = useState(false);
  const { vue, erreur, recharger } = useMonEtagere(actif && !ouverte);
  // (le frein, ou pas encore lue : rien)
  if (!vue || erreur) return null;
  const objets = vue?.objets ?? [];
  const n = objets.length;
  const aRanger = vue.aRanger?.length ?? 0;
  return (
    <div className="et-chez" data-n={n}>
      <button type="button" className="et-chez-planche" onClick={() => setOuverte(true)} aria-label={`Mon étagère : ${n} souvenir${n > 1 ? "s" : ""}`}>
        <span className="et-rang">
          {n ? (
            objets.slice(-6).map((o) => (
              <span key={o.id} data-objet={o.id}>
                {o.emoji}
              </span>
            ))
          ) : (
            <span className="et-chez-vide">📚</span>
          )}
        </span>
        <span className="et-planche" aria-hidden="true" />
        <span className="et-chez-texte">
          <b>📚 Mon étagère{n ? ` · ${n}` : ""}</b>
          <small>
            {aRanger ? <b className="et-chez-ranger">✨ {aRanger} à ranger · </b> : null}
            {n ? (vue?.montres ? `${vue.montres} montré${vue.montres > 1 ? "s" : ""} à tes visiteurs` : "Rien que pour toi") : "Ce que tes figurines notent sur toi, et ce que tu y poses"}
          </small>
        </span>
      </button>
      <button type="button" className="et-chez-plus" aria-label="Déposer sur mon étagère" onClick={() => setDepot(true)}>
        ＋
      </button>
      {ouverte && <PageMonEtagere onFermer={() => (setOuverte(false), recharger())} />}
      {typeof document !== "undefined" &&
        createPortal(
          <FeuilleDeposer
            ouverte={depot}
            visiteurs={vue.univers}
            onFermer={() => setDepot(false)}
            onPose={() => {
              setDepot(false);
              recharger();
            }}
          />,
          document.body,
        )}
    </div>
  );
}

/**
 * 🏡 (lot E4) « MON ÉTAGÈRE » : mes fiertés, ce qui m'attend, ce que j'aime — notés dans toutes mes conversations (d'où ça
 * vient, dans la fiche) et déposés par moi ; 👀 ceux que mes visiteurs voient ; « ＋ Déposer » ; ce que voient mes
 * visiteurs (mon univers, vu par eux).
 */
export function PageMonEtagere({ onFermer }: { onFermer: () => void }) {
  const { vue, erreur, recharger } = useMonEtagere(true);
  const [fiche, setFiche] = useState<ObjetVu | null>(null);
  const [info, setInfo] = useState("");
  const [depot, setDepot] = useState(false);
  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector(".et-feuille.ouverte") && onFermer();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [onFermer]);
  // (un geste sur un souvenir d'une étagère partagée part sur la nôtre ; sur ce que j'ai déposé, sur la mienne)
  const ou = (o: ObjetVu) => (o.avec ? { avec: o.avec.cle } : { mien: true });
  const apres = (texte: string) => {
    setFiche(null);
    setInfo(texte);
    recharger();
  };
  async function retirer(o: ObjetVu) {
    await agir(o.avec ? { action: "cacher", avec: o.avec.cle, id: o.id } : { action: "retirer", mien: true, id: o.id });
    apres(o.avec ? `${o.emoji} Il n’est plus chez toi (il reste sur votre étagère, ${o.avec.prenom} et toi)` : `${o.emoji} Retiré de ton étagère`);
  }
  async function dater(o: ObjetVu, quand: string) {
    await agir({ action: "date", ...ou(o), id: o.id, quand });
    apres(`📅 C’est noté : ${o.titre.charAt(0).toLowerCase()}${o.titre.slice(1)}, à la nouvelle date`);
  }
  async function faireSur(o: ObjetVu, action: "reussi" | "tenue" | "annuler-tenue") {
    await agir({ action, ...ou(o), id: o.id });
    apres(action === "reussi" ? "🏆 Rangé tout en haut, avec tes fiertés !" : action === "tenue" ? `✅ ${o.titre} : promesse tenue !` : "Annulé : elle attend encore d’être tenue.");
  }
  /** 📌 (lot E5) « ✨ À ranger » : oui, non, depuis ma page (la question part sur l'étagère d'où elle vient). */
  async function repondre(q: QuestionVue, oui: boolean) {
    if (!q.objet.avec) return;
    try {
      await agir({ action: oui ? "oui" : "non", avec: q.objet.avec.cle, id: q.id });
      apres(oui ? `${q.issue ? "🏆" : q.objet.emoji} ${q.objet.titre} : rangé sur votre étagère, ${q.objet.avec.prenom} et toi` : `🤷 ${PHRASE_NON}`);
    } catch (e) {
      apres((e as Error).message || "Ça n’a pas marché. Réessaie.");
    }
  }
  async function montrer(o: ObjetVu, oui: boolean) {
    await agir({
      action: "montrer",
      id: o.id,
      oui,
      ...(o.avec ? { avec: o.avec.cle } : {}),
    });
    apres(oui ? `👀 ${o.titre} : tes visiteurs le voient maintenant` : `🙈 ${o.titre} : rien que pour toi`);
  }
  const objets = vue?.objets ?? [];
  const rayon = (cleRayon: string) => {
    const l = objets.filter((o) => o.rayon === cleRayon);
    if (cleRayon === "avenir") return l.sort((a, b) => (a.quand ?? "9999").localeCompare(b.quand ?? "9999"));
    return l.sort((a, b) => b.le.localeCompare(a.le));
  };
  const fiertes = objets.filter((o) => o.rayon === "fiertes").length;
  const contenu = (
    <div className="et-page et-mienne" role="dialog" aria-modal="true" aria-label="Mon étagère">
      <header className="et-tete">
        <button type="button" className="et-retour" aria-label="Revenir chez moi" onClick={onFermer}>
          ←
        </button>
        <span className="et-qui">
          <b>Mon étagère</b>
          <small>Chez moi, dans mon univers</small>
        </span>
        {vue?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="et-avatar" src={vue.image} alt="" draggable={false} />
        )}
      </header>
      {!vue && !erreur && (
        <div className="mc-attente">
          <i />
        </div>
      )}
      {erreur && (
        <p className="et-erreur" role="alert">
          {erreur}
        </p>
      )}
      {vue && (
        <>
          {/* 📌 (lot E5) mes questions en attente, de toutes mes conversations : on répond à plusieurs d'un coup */}
          {vue.aRanger?.length ? (
            <div className="et-a-ranger" aria-label="À ranger">
              <b className="et-entete">✨ À RANGER</b>
              {vue.aRanger.map((q) => (
                <div key={q.id} className="et-q" data-question={q.id}>
                  <span className="et-e" aria-hidden="true">
                    {q.issue ? "🏆" : q.objet.emoji}
                  </span>
                  <span className="et-q-texte">
                    <b>{q.objet.titre}</b>
                    <small>
                      {q.issue ? "c’est réussi : dans vos fiertés ?" : q.depot ? `déposé par ${q.objet.avec?.prenom}` : `noté avec ${q.objet.avec?.prenom}`}
                      {q.objet.detail && !q.issue ? ` · ${q.objet.detail}` : ""}
                    </small>
                  </span>
                  <button type="button" className="et-q-oui" aria-label={`Oui, ranger ${q.objet.titre}`} onClick={() => void repondre(q, true)}>
                    ✓
                  </button>
                  <button type="button" className="et-q-non" onClick={() => void repondre(q, false)}>
                    Non
                  </button>
                </div>
              ))}
              <small className="et-pied">Rien ne se range sans ton oui. Sans réponse, ta figurine oublie au bout de 2 jours.</small>
            </div>
          ) : null}
          <div className="et-compteurs">
            <div>
              <b>{objets.length}</b>
              <span>souvenir{objets.length > 1 ? "s" : ""}</span>
            </div>
            <div>
              <b>{fiertes}</b>
              <span>fierté{fiertes > 1 ? "s" : ""}</span>
            </div>
            <div>
              <b>{vue.montres}</b>
              <span>montré{vue.montres > 1 ? "s" : ""} aux visiteurs</span>
            </div>
          </div>
          <div className="et-meuble">
            {RAYONS_MIENS.map((r) => {
              const l = rayon(r.cle);
              return (
                <div key={r.cle} className="et-rayon" data-rayon={r.cle}>
                  <span className="et-nom-rayon">{r.nom}</span>
                  {l.length ? (
                    l.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        className={`et-objet-rayon${o.etat === "fierte" ? " haut" : ""}`}
                        data-objet={o.id}
                        data-avec={o.avec?.prenom ?? ""}
                        onClick={() => setFiche(o)}
                        aria-label={`${o.titre}, ${o.detail}${o.avec ? `, noté avec ${o.avec.prenom}` : ""}`}
                      >
                        <span className="et-e" aria-hidden="true">
                          {o.emoji}
                        </span>
                        <span className="et-etiquette">{o.titre}</span>
                        {o.etat === "tenue" && <i className="et-tenue">✓</i>}
                        {o.montre && (
                          <i className="et-vu" aria-label="Tes visiteurs le voient">
                            👀
                          </i>
                        )}
                      </button>
                    ))
                  ) : (
                    <span className="et-rien">rien encore</span>
                  )}
                </div>
              );
            })}
          </div>
          {info && (
            <p className="et-info" role="status">
              {info}
            </p>
          )}
          <button type="button" className="et-bouton et-deposer" onClick={() => setDepot(true)}>
            ＋ Déposer sur mon étagère
          </button>
          <p className="et-regles">{REGLES_MON_ETAGERE}</p>
          {vue.univers && vue.cle && vue.montres > 0 && (
            <a className="et-lien et-voir-visiteurs" href={`/univers/chez/${vue.cle}`}>
              👀 Voir ce que voient mes visiteurs
            </a>
          )}
          {!vue.univers && <p className="et-regles">🏡 Quand tu auras ton univers, tu pourras y montrer tes souvenirs à tes visiteurs.</p>}
        </>
      )}
      <FicheObjet o={fiche} prenom="" mienne onFermer={() => setFiche(null)} onRetirer={retirer} onDate={dater} onFaire={faireSur} onMontrer={vue?.univers ? montrer : undefined} />
      <FeuilleDeposer
        ouverte={depot}
        visiteurs={Boolean(vue?.univers)}
        onFermer={() => setDepot(false)}
        onPose={(t) => {
          setDepot(false);
          setInfo(`✋ ${t} : posé sur ton étagère`);
          recharger();
        }}
      />
    </div>
  );
  return typeof document === "undefined" ? null : createPortal(contenu, document.body);
}

/**
 * ⚙️ (lot E5) DANS « MOI » : « Ma figurine range sans me demander » (éteint d'office) — ce qui le concerne se range tout
 * de suite ; ce qu'un proche dépose pour lui se demande toujours. Le frein de l'étagère : rien.
 */
export function RangeSansDemander() {
  const [oui, setOui] = useState<boolean | null>(null);
  useEffect(() => {
    let fini = false;
    fetch(`${ROUTE}?reglage=1`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { rangeSeul?: unknown } | null) => !fini && typeof j?.rangeSeul === "boolean" && setOui(j.rangeSeul))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, []);
  if (oui === null) return null;
  async function basculer() {
    const v = !oui;
    setOui(v);
    try {
      await agir({ action: "range-seul", oui: v });
    } catch {
      setOui(!v);
    }
  }
  return (
    <div className="rt-reglage" id="range-seul">
      <span>
        <b>{REGLAGE_RANGE_SEUL.titre}</b>
        <small>{REGLAGE_RANGE_SEUL.aide}</small>
      </span>
      <button type="button" role="switch" aria-checked={oui} aria-label={REGLAGE_RANGE_SEUL.titre} className={oui ? "oui" : ""} onClick={() => void basculer()}>
        <i />
      </button>
    </div>
  );
}

export const STYLES_ETAGERE = `
.et-mur{position:absolute;top:10px;left:50%;z-index:4;translate:-50% 0;display:flex;flex-direction:column;align-items:center;gap:3px;border:0;background:none;padding:0;cursor:pointer;font:inherit;-webkit-tap-highlight-color:transparent}
.et-rang{display:flex;align-items:flex-end;justify-content:center;gap:5px;min-width:132px;height:32px;padding:0 10px}
.et-rang span{font-size:24px;line-height:1;filter:drop-shadow(0 3px 2px rgba(0,0,0,.5))}
.et-rang span.vient{visibility:hidden}
.et-rang span.arrive{animation:et-pose .5s cubic-bezier(.2,.8,.3,1.5)}
.et-planche{width:100%;height:7px;border-radius:2px;background:linear-gradient(180deg,#a5683a,#6b3f1f);box-shadow:0 5px 8px -3px rgba(0,0,0,.7)}
.pr-scene.avec-etagere:not(.chez){padding-top:80px}
.pr-scene.avec-etagere:not(.chez) .pv-calque{top:80px}
.et-mur small{margin-top:3px;padding:2px 8px;border-radius:999px;background:rgba(18,6,15,.62);font-size:11px;font-weight:800;color:#F2C46B;white-space:nowrap}
.et-vol{position:fixed;left:0;top:0;z-index:90;font-size:30px;line-height:1;pointer-events:none;filter:drop-shadow(0 4px 4px rgba(0,0,0,.5))}
.et-pastille{flex:none;display:inline-flex;align-items:center;gap:5px;padding:7px 11px;border:1px solid rgba(242,196,107,.45);border-radius:999px;background:rgba(242,196,107,.12);color:#F2C46B;font:inherit;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap}
.pv-calque .et-note{position:absolute;left:50%;top:0;z-index:4;translate:-50% 0;padding:7px 12px;border-radius:9px;background:#F2C46B;color:#2A1220;font-size:16px;font-weight:900;white-space:nowrap;box-shadow:0 0 0 3px #2A1220,0 10px 22px rgba(0,0,0,.4);animation:pv-brandit 2.6s cubic-bezier(.2,1.4,.4,1) both}
.pv-calque .et-note::after{content:"";position:absolute;left:50%;top:100%;width:5px;height:30px;margin-left:-2.5px;border-radius:3px;background:#8A5A2B}
.pv-calque .et-bulle{animation-duration:4.8s}
.pr-fil li.et-carte-fil{justify-content:center}
.pr-fil li.et-carte-fil > div{display:flex;flex-direction:column;gap:7px;width:min(94%,430px);padding:11px 13px;border-radius:18px;background:rgba(242,196,107,.1);border:1px dashed rgba(242,196,107,.55);animation:et-monte .4s ease-out both}
.et-entete{font-size:12px;font-weight:900;letter-spacing:.04em;color:#F2C46B}
.et-objet{display:flex;align-items:center;gap:10px}
.et-objet .et-e{font-size:30px;line-height:1}
.et-objet b{display:block;font-size:15.5px;line-height:1.25}
.et-objet small{display:block;font-size:13px;color:#CDB4C0}
.et-actions{display:flex;flex-wrap:wrap;gap:14px}
.et-actions button,.et-lien{border:0;background:none;padding:0;color:#F2C46B;font:inherit;font-size:13px;font-weight:800;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.et-actions button.doux{color:#9C8592}
.et-pied{font-size:11px;color:#8F7884}
.et-page{position:fixed;inset:0;z-index:70;display:flex;flex-direction:column;gap:12px;max-width:560px;margin:0 auto;padding:calc(8px + env(safe-area-inset-top)) 16px calc(20px + env(safe-area-inset-bottom));box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;color:#FFF4E6;background:#1E0C18;font-family:var(--font-clikme),Poppins,system-ui,sans-serif}
.et-tete{display:flex;align-items:center;gap:10px;min-height:52px}
.et-retour{flex:none;width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#FFF4E6;font-size:20px;font-weight:800;cursor:pointer}
.et-qui{flex:1;min-width:0;display:flex;flex-direction:column}
.et-qui b{font-size:17px;font-weight:900;line-height:1.2}
.et-qui small{font-size:12.5px;color:#BFA6B3}
.et-avatar{flex:none;width:44px;height:44px;border-radius:50%;object-fit:cover;object-position:50% 12%;background:#3a1630}
.et-compteurs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.et-compteurs div{padding:10px 6px;border-radius:16px;background:rgba(255,255,255,.055);text-align:center}
.et-compteurs b{display:block;font-size:22px;font-weight:900;line-height:1.15;font-variant-numeric:tabular-nums}
.et-compteurs span{font-size:11.5px;font-weight:600;color:#BFA6B3}
.et-meuble{position:relative;padding:12px 12px 4px;border-radius:14px;background:linear-gradient(180deg,#3d2412,#2a170b);border:6px solid #4d2e16;box-shadow:inset 0 0 40px rgba(0,0,0,.6),0 20px 30px -18px rgba(0,0,0,.9)}
.et-meuble::before{content:"";position:absolute;inset:0;border-radius:8px;background:radial-gradient(ellipse at 50% -10%,rgba(255,214,140,.32),transparent 65%);pointer-events:none}
.et-rayon{position:relative;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-around;gap:6px 4px;min-height:104px;padding:16px 2px 18px}
.et-rayon::after{content:"";position:absolute;left:-12px;right:-12px;bottom:6px;height:12px;background:linear-gradient(180deg,#a5683a,#6b3f1f);box-shadow:0 6px 8px -3px rgba(0,0,0,.7)}
.et-nom-rayon{position:absolute;left:0;top:-2px;font-family:var(--font-main-levee),"Caveat",cursive;font-size:17px;color:rgba(251,240,217,.6)}
.et-objet-rayon{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:3px;width:31%;max-width:110px;border:0;background:none;padding:12px 0 0;color:inherit;font:inherit;cursor:pointer}
.et-objet-rayon .et-e{font-size:40px;line-height:1;filter:drop-shadow(0 5px 3px rgba(0,0,0,.55));transition:transform .2s}
.et-objet-rayon:active .et-e{transform:scale(1.12) rotate(-4deg)}
.et-objet-rayon.haut .et-e{filter:drop-shadow(0 0 12px rgba(255,214,140,.8)) drop-shadow(0 5px 3px rgba(0,0,0,.55))}
.et-etiquette{max-width:100%;padding:1px 7px 2px;border-radius:3px;background:#fbf0d9;color:#2b1a0c;font-family:var(--font-main-levee),"Caveat",cursive;font-size:17px;font-weight:600;line-height:1.05;text-align:center;rotate:-2deg;box-shadow:0 2px 3px rgba(0,0,0,.4);overflow-wrap:anywhere}
.et-objet-rayon:nth-child(2n) .et-etiquette{rotate:2deg}
.et-tenue{position:absolute;top:6px;right:14%;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#3DDC84;color:#0f2a19;font-size:12px;font-style:normal;font-weight:900}
.et-rien{align-self:center;font-family:var(--font-main-levee),"Caveat",cursive;font-size:19px;color:rgba(251,240,217,.42)}
.et-regles{margin:2px 2px 0;font-size:12.5px;line-height:1.5;color:#9C8592}
.et-reglage{display:flex;justify-content:center;padding-top:4px}
.et-pause-autre{margin:0;font-size:13.5px;color:#BFA6B3}
.et-info{margin:0;padding:10px 12px;border-radius:14px;background:rgba(242,196,107,.12);color:#F2C46B;font-size:13.5px;font-weight:700}
.et-erreur{margin:0;color:#FFB4A8;font-size:13.5px}
.et-feuille .tf-feuille-corps{z-index:80}
.et-feuille{z-index:80}
.et-fiche{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding-bottom:6px}
.et-fiche .et-e{font-size:64px;line-height:1.1;filter:drop-shadow(0 8px 6px rgba(0,0,0,.5))}
.et-fiche-titre{font-size:20px;font-weight:900;line-height:1.2}
.et-fiche-detail{font-size:14px;color:#CDB4C0}
.et-fiche blockquote{align-self:stretch;margin:8px 0 2px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.06);font-size:15px;font-style:italic}
.et-fiche cite{display:block;margin-top:4px;font-size:12.5px;font-style:normal;color:#BFA6B3}
.et-note-douce{align-self:stretch;margin:6px 0 0;padding:10px 12px;border-radius:12px;background:rgba(242,196,107,.1);color:#F2C46B;font-size:13px;font-weight:600}
.et-bouton{align-self:stretch;min-height:48px;margin-top:4px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:15px;font-weight:900;cursor:pointer}
.et-bouton.clair{background:rgba(255,255,255,.09);color:#FFF4E6}
.et-bouton:disabled{opacity:.55}
.et-date{align-self:stretch;display:flex;flex-direction:column;gap:6px}
.et-date input{min-height:46px;padding:0 12px;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:#2A1422;color:#FFF4E6;font:inherit;font-size:16px;color-scheme:dark}
.pr-scene.et-poussiere{filter:grayscale(.75) brightness(.6) sepia(.2);transition:filter 1.2s ease}
.pr-scene{transition:filter 1.2s ease}
.et-toile{position:absolute;top:6px;z-index:4;font-size:26px;opacity:.85;pointer-events:none}
.et-toile.g{left:18%}
.et-toile.d{right:16%;top:22px;transform:scaleX(-1)}
.et-mur.terne .et-rang span{filter:grayscale(1) brightness(.7)}
.et-etat{margin:0;padding:9px 12px;border-radius:14px;background:rgba(242,196,107,.12);color:#F2C46B;font-size:13.5px;font-weight:700}
.et-etat.gris{background:rgba(255,255,255,.06);color:#BFA6B3}
.et-meuble.poussiere{filter:grayscale(.8) brightness(.7)}
.et-meuble.poussiere::before{display:none}
.pr-fil li.et-carte-fil.prive > div{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.18)}
.pr-fil li.et-carte-fil.prive .et-entete{color:#BFA6B3}
.et-texte{margin:0;font-size:15px;line-height:1.4}
.et-idees{margin:0 0 4px;padding:9px 12px;border-radius:12px;background:rgba(242,196,107,.12);color:#F2C46B;font-size:13.5px;font-weight:700}
.cm-avatar.gris img{filter:grayscale(.85) brightness(.75)}
.et-confetti{position:absolute;z-index:9;width:8px;height:12px;border-radius:2px;pointer-events:none}
.pr-fil li.et-carte-fil.trophee > div{background:linear-gradient(140deg,rgba(242,196,107,.22),rgba(255,46,154,.12));border-style:solid}
.et-actions.boutons{gap:8px}
.et-actions .et-petit,.et-petit{display:inline-flex;align-items:center;gap:6px;padding:8px 13px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:13.5px;font-weight:800;text-decoration:none;cursor:pointer}
.et-actions .et-petit.clair,.et-petit.clair{background:rgba(255,255,255,.1);color:#FFF4E6}
.et-actions .et-petit.or,.et-petit.or{background:#F2C46B;color:#2b1a0c}
.et-bouton.or{background:#F2C46B;color:#2b1a0c}
.pr-fil li.et-carte-fil blockquote{margin:2px 0 0;padding:0 0 0 10px;border-left:3px solid rgba(242,196,107,.5);font-size:14px}
.pr-fil li.et-carte-fil blockquote cite{display:block;margin-top:2px;font-style:normal;font-size:12px;color:#CDB4C0}
.et-duree{font-size:13.5px;font-weight:700}
.et-tenue-ok{font-size:13px;font-weight:800;color:#9FF0C4}
.et-rappels{display:flex;flex-direction:column;gap:10px;margin:12px 0 4px}
.et-rappel{display:grid;grid-template-columns:48px minmax(0,1fr);gap:12px;padding:14px;border-radius:20px;background:linear-gradient(140deg,rgba(242,196,107,.18),rgba(255,46,154,.14));border:1px solid rgba(242,196,107,.35);animation:et-monte .5s cubic-bezier(.2,.8,.3,1.2) both}
.et-rappel img,.et-rappel > span{width:48px;height:48px;border-radius:50%;object-fit:cover;object-position:50% 12%;background:#3a1630;display:grid;place-items:center;font-size:24px}
.et-rappel small{display:block;font-size:11.5px;font-weight:800;letter-spacing:.02em;color:#F2C46B}
.et-rappel p{margin:3px 0 10px;font-size:15.5px;font-weight:600;line-height:1.35}
.et-rappel.moi p{margin-bottom:0}
.et-rappel .et-fait{margin:0;font-size:13.5px;font-weight:800;color:#9FF0C4}
/* 🏡 (lot E4) mon étagère, sous la fenêtre de mon univers ; la page ; « ＋ Déposer » */
.et-chez{position:relative;display:flex;align-items:stretch;gap:8px;margin:12px 0 2px}
.et-chez-planche{flex:1;min-width:0;display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto auto;column-gap:12px;align-items:center;padding:10px 12px;border:0;border-radius:20px;background:linear-gradient(180deg,#3d2412,#2a170b);box-shadow:inset 0 0 26px rgba(0,0,0,.5),0 12px 22px -16px rgba(0,0,0,.9);color:#FFF4E6;font:inherit;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent}
.et-chez-planche .et-rang{grid-row:1;grid-column:1;min-width:0;max-width:44vw;height:30px;padding:0 4px;justify-content:flex-start;gap:3px;overflow:hidden}
.et-chez-planche .et-rang span{font-size:22px}
.et-chez-planche .et-planche{grid-row:2;grid-column:1;height:6px}
.et-chez-texte{grid-row:1 / span 2;grid-column:2;display:flex;flex-direction:column;gap:2px;min-width:0}
.et-chez-texte b{font-size:15.5px;font-weight:900;color:#F2C46B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.et-chez-texte small{font-size:12.5px;line-height:1.3;color:#E9D5DD}
.et-chez-vide{opacity:.55}
.et-chez-plus{flex:none;width:52px;border:0;border-radius:18px;background:#FF2E9A;color:#fff;font:inherit;font-size:26px;font-weight:900;cursor:pointer;box-shadow:0 8px 18px -8px rgba(255,46,154,.9)}
.et-chez-plus:active{transform:scale(.96)}
.et-vu{position:absolute;top:4px;left:12%;font-size:15px;font-style:normal;filter:drop-shadow(0 2px 2px rgba(0,0,0,.6))}
.et-deposer{margin-top:0}
.et-depose{align-self:stretch;margin:8px 0 2px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.06);font-size:14px;color:#E9D5DD}
.et-voir-visiteurs{align-self:center;font-size:14px}
.et-depot{display:flex;flex-direction:column;gap:9px;padding-bottom:8px}
.et-depot .et-fiche-titre{text-align:center;margin-bottom:2px}
.et-depot-libelle{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#CDB4C0}
.et-objet-choisi{font-size:24px;letter-spacing:0;text-transform:none}
.et-puces{display:flex;flex-wrap:wrap;gap:7px}
.et-puce{padding:8px 12px;border:1px solid rgba(255,255,255,.16);border-radius:999px;background:rgba(255,255,255,.06);color:#FFF4E6;font:inherit;font-size:14px;font-weight:800;cursor:pointer}
.et-puce.prise{border-color:#F2C46B;background:#F2C46B;color:#2b1a0c}
.et-puces.petites .et-puce{padding:6px 10px;font-size:13px}
.et-champ{display:flex;flex-direction:column;gap:6px}
.et-champ input{min-height:46px;padding:0 12px;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:#2A1422;color:#FFF4E6;font:inherit;font-size:16px;color-scheme:dark;box-sizing:border-box;width:100%}
.et-champ small{align-self:flex-end;font-size:11.5px;color:#9C8592}
.et-catalogue{display:grid;grid-template-columns:repeat(auto-fill,minmax(40px,1fr));gap:4px;max-height:142px;overflow-y:auto;padding:6px;border-radius:14px;background:rgba(255,255,255,.04);overscroll-behavior:contain}
.et-catalogue button{height:40px;border:0;border-radius:10px;background:none;font-size:23px;line-height:1;cursor:pointer}
.et-catalogue button.pris{background:rgba(242,196,107,.28);box-shadow:inset 0 0 0 2px #F2C46B}
.et-coche{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.05);font-size:14.5px;font-weight:700;cursor:pointer}
.et-coche input{width:20px;height:20px;accent-color:#F2C46B}
/* 📌 (lot E5) « Je le range ? » : le panneau, l'objet dans les mains, la bulle dessous ; la carte ; « À ranger » */
.pv-calque .et-note.question{animation-duration:6.4s}
.pv-calque .et-tient{position:absolute;left:50%;top:46%;z-index:4;translate:-50% 0;font-size:46px;line-height:1;filter:drop-shadow(0 6px 4px rgba(0,0,0,.55));animation:et-tient 6.4s cubic-bezier(.2,1.4,.4,1) both}
.pv-calque .et-bulle.sous{top:62px}
.pr-fil li.et-carte-fil.question > div{background:linear-gradient(140deg,rgba(242,196,107,.2),rgba(255,46,154,.08));border-style:solid}
.et-depot-question{margin:0}
.et-chez-ranger{color:#F2C46B;font-weight:900}
.et-a-ranger{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:18px;background:linear-gradient(140deg,rgba(242,196,107,.18),rgba(255,46,154,.1));border:1px solid rgba(242,196,107,.4)}
.et-q{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:10px}
.et-q .et-e{font-size:28px;line-height:1}
.et-q-texte{display:flex;flex-direction:column;min-width:0}
.et-q-texte b{font-size:15px;line-height:1.25;overflow-wrap:anywhere}
.et-q-texte small{font-size:12.5px;color:#CDB4C0}
.et-q-oui{width:42px;height:42px;border:0;border-radius:50%;background:#F2C46B;color:#2b1a0c;font:inherit;font-size:18px;font-weight:900;cursor:pointer}
.et-q-non{min-height:42px;padding:0 12px;border:0;border-radius:999px;background:rgba(255,255,255,.1);color:#FFF4E6;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer}
@keyframes et-tient{0%{transform:translateY(30px) scale(.4);opacity:0}14%{transform:translateY(0) scale(1.15);opacity:1}22%,86%{transform:scale(1)}100%{transform:translateY(16px) scale(.8);opacity:0}}
@keyframes et-pose{0%{transform:translateY(-10px) scale(1.5)}60%{transform:translateY(2px) scale(.9)}100%{transform:none}}
@keyframes et-monte{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.et-rang span.arrive,.pr-fil li.et-carte-fil > div,.pv-calque .et-note,.pv-calque .et-tient{animation:none}}
`;
