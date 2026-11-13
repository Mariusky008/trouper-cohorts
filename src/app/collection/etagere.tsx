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
 *
 * LE MOT : à l'écran, « souvenir » ; dans le code, `objet`.
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Feuille } from "./ma-figurine";
import { retenirMemePour } from "./meme-pour";
import { versLeStudio } from "./vers-le-studio";
import {
  ETAGERE_E2,
  RAYONS,
  REGLES_ETAGERE,
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
async function agir(corps: Record<string, unknown>): Promise<void> {
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok || j.error) throw new Error(j.error || "Ça n’a pas marché. Réessaie.");
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
export type JeuEtagere = { note: { qui: "moi" | "lui"; n: string } | null; bulle: { qui: "moi" | "lui"; texte: string; n: string } | null; saute?: ("moi" | "lui")[] };

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
  const [vol, setVol] = useState("");
  const [arrive, setArrive] = useState("");
  const [jeu, setJeu] = useState<JeuEtagere>({ note: null, bulle: null });
  const envols = useRef(0);
  const enCours = useRef(false);
  const derniere = useRef("");
  const minuteurs = useRef<number[]>([]);
  const plusTard = (ms: number, f: () => void) => minuteurs.current.push(window.setTimeout(f, ms));
  useEffect(() => () => minuteurs.current.forEach((t) => window.clearTimeout(t)), []);

  const objets = (scene?.objets ?? []).filter((o) => !retires.has(o.id));
  const attente = (scene?.nouveaux ?? []).filter((id) => !poses.has(id) && objets.some((o) => o.id === id));
  // 🃏 (lot E2) les cartes du fil, et celles qu'il n'a pas encore vues se jouer ; ✨ (lot E3) se rallumer
  const cartes = (scene?.cartes ?? []).filter((c) => !retires.has(c.objet.id));
  const rallumes = scene?.rallumes ?? [];
  const aFeter = [...cartes.filter((c) => c.nouvelle && !fetees.has(c.id)).map((c) => `c:${c.id}`), ...rallumes.filter((r) => r.nouvelle && !fetees.has(r.id)).map((r) => `c:${r.id}`)];
  const cleAttente = [...attente, ...aFeter].join(",");

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
    const ids = tous.filter((x) => !x.startsWith("c:"));
    const aJouer = tous.filter((x) => x.startsWith("c:")).map((x) => x.slice(2));
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
  const faire = useCallback((action: "reussi" | "tenue" | "annuler-tenue", id: string) => agir({ action, avec: cle, id }), [cle]);
  return { objets, cartes, rallumes, attente: new Set(attente.filter((id) => id !== vol)), vol, arrive, jeu, retirer, oublier, faire, tenues: scene?.tenues ?? 0, pause: scene?.pause ?? null, etat: scene?.etat ?? null, poussiere: scene?.poussiere ?? null };
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
        <b className="et-entete">📌 NOTÉ SUR VOTRE ÉTAGÈRE</b>
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
        <small className="et-pied">Noté par vos figurines · IA · visible de {prenom} et toi</small>
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
        <blockquote>
          « {o.citation} »<cite>{o.de === "moi" ? "Toi" : o.ditPar}, {leJourLong(o.ditLe)}</cite>
        </blockquote>
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
        <div key={`${r.cas}-${r.id}`} className={`et-rappel${r.cas === "encourage" ? " moi" : ""}`} data-objet={r.id}>
          {r.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.image} alt="" draggable={false} />
          ) : (
            <span aria-hidden="true">{r.emoji}</span>
          )}
          <div>
            <small>{r.cas === "encourage" ? "💪 DE TA FIGURINE" : `📌 DE VOTRE ÉTAGÈRE, ${r.prenom.toLocaleUpperCase("fr-FR")} ET TOI`}</small>
            <p>{r.texte}</p>
            {r.cas !== "encourage" &&
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
}: {
  o: ObjetVu | null;
  prenom: string;
  onFermer: () => void;
  onRetirer: (o: ObjetVu) => Promise<void>;
  onDate: (o: ObjetVu, quand: string) => Promise<void>;
  onFaire?: (o: ObjetVu, action: "reussi" | "tenue" | "annuler-tenue") => Promise<void>;
  onMeme?: (texte: string) => void;
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
          <blockquote>
            « {o.citation} »<cite>Dit par {o.de === "moi" ? "toi" : o.ditPar} · {momentCourt(o.ditLe)}</cite>
          </blockquote>
          <small className="et-pied">Noté par vos figurines · IA · visible de {prenom} et toi</small>
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
            Retirer de l’étagère
          </button>
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
    </div>
  );
  return typeof document === "undefined" ? null : createPortal(contenu, document.body);
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
@keyframes et-pose{0%{transform:translateY(-10px) scale(1.5)}60%{transform:translateY(2px) scale(.9)}100%{transform:none}}
@keyframes et-monte{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.et-rang span.arrive,.pr-fil li.et-carte-fil > div,.pv-calque .et-note{animation:none}}
`;
