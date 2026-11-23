"use client";

/**
 * 🎞️ DÉCOUVRIR, LE FIL « DE PIÈCE EN PIÈCE » (le lot F1, 23 novembre 2026 ; `lib/direct/fil-decouvrir.ts`,
 * `docs/univers/fil.md`).
 *
 * L'onglet Découvrir s'ouvre sur un fil plein écran : on glisse vers le haut, et chaque écran est UNE PIÈCE OÙ IL Y A
 * QUELQU'UN — un salon en direct (son gradin, ses figurines, leurs bulles), le salon de la musique, une figurine posée
 * dans Autour avec son mot du jour, l'humeur de ses proches. Sa figurine est au bord de la pièce (en bas à droite) :
 * toucher deux fois l'écran (ou la toucher, elle) et elle réagit — dans un salon, pour de vrai : elle s'y assoit le
 * temps qu'on y est, sa réaction part au salon, et ceux qui sont là la voient. Chaque bouton ouvre ce qui existe déjà.
 * L'ancienne page de Découvrir (ma télé du jour, tous les salons) est derrière « Tous les salons » (`#salons`).
 */
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { OngletVisible } from "./guide";
import { FigurineAssise } from "./autour";
import { MEMOIRE_FIL, ecrireMemoire, lireMemoire } from "./memoire-locale";
import { vignetteYouTube } from "@/lib/direct/tele";
import { PLAN_GRADIN, type PlaceGradin } from "@/lib/direct/salons-gradins";
import { GESTES_SALON, PLACES_SALON, REACTIONS_SALON, type MessageSalon, type PresentSalon } from "@/lib/direct/salons-ouverts";
import { REACTIONS_MUSIQUE } from "@/lib/direct/platine";
import { PHRASES_FIL as P, reactionDuFil, type BulleFil, type FilVue, type PieceFil, type SalonFil } from "@/lib/direct/fil-decouvrir";

const ROUTE = "/api/direct/fil-decouvrir";
const SALONS = "/api/direct/salons-ouverts";
/** La mémoire du fil ne vaut que dix minutes : ce qui était en direct ne l'est plus. */
const MEMOIRE_MS = 10 * 60_000;
const CLE_INDICE = "clikme-fil-indice-vu";

const cleDe = (p: PieceFil) => (p.sorte === "salon" ? `s:${p.theme}` : p.sorte === "autour" ? `a:${p.figurine.id}` : "h");
const heuresRestantes = (fin: string) => Math.max(1, Math.round((Date.parse(fin) - Date.now()) / 3600_000));
const texteDe = (m: MessageSalon) =>
  m.sorte === "texte" ? (m.texte ?? "") : m.sorte === "reaction" ? ([...REACTIONS_SALON, ...REACTIONS_MUSIQUE].find((r) => r.cle === m.cle)?.e ?? "") : (GESTES_SALON.find((g) => g.cle === m.cle)?.e ?? "");
const enPresent = (p: PresentSalon) => ({ q: p.q, prenom: p.prenom, src: p.figurine?.src ?? "", place: p.place });

/**
 * Les nouvelles du serveur : les pièces déjà là gardent leur place (on ne bouge pas sous son doigt) — seulement leur
 * contenu, à jour ; celles qui n'y sont plus restent jusqu'au prochain retour ; les nouvelles s'ajoutent à la fin.
 */
function fusionner(avant: PieceFil[], apres: PieceFil[]): PieceFil[] {
  const neuves = new Map(apres.map((p) => [cleDe(p), p]));
  const gardees = avant.map((p) => neuves.get(cleDe(p)) ?? p);
  const deja = new Set(avant.map(cleDe));
  return [...gardees, ...apres.filter((p) => !deja.has(cleDe(p)))];
}

type Reaction = { k: string; e: string; texte: string; n: number };

export function FilDecouvrir({ onTousLesSalons, onAutour, onConversation }: { onTousLesSalons: () => void; onAutour: () => void; onConversation: (cle: string) => void }) {
  const visible = useContext(OngletVisible);
  const [fil, setFil] = useState<FilVue | null>(null);
  const [pieces, setPieces] = useState<PieceFil[]>([]);
  const [courante, setCourante] = useState("");
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [toast, setToast] = useState("");
  const [indice, setIndice] = useState(false);
  const [version, setVersion] = useState(0);
  const boite = useRef<HTMLDivElement>(null);
  /** les salons où sa figurine est entrée depuis le fil (thème → identifiant), et le dernier « je suis là » */
  const entres = useRef(new Map<string, string>());
  const tapes = useRef<{ k: string; t: number } | null>(null);
  const appui = useRef<{ x: number; y: number } | null>(null);

  const dire = useCallback((t: string) => {
    setToast(t);
    window.setTimeout(() => setToast((x) => (x === t ? "" : x)), 2600);
  }, []);

  // ce que le fil montrait il y a moins de dix minutes, tout de suite ; puis le serveur (et toutes les 30 s, en direct)
  useEffect(() => {
    if (!visible) return;
    let fini = false;
    const deja = lireMemoire<FilVue>(MEMOIRE_FIL, MEMOIRE_MS);
    if (deja && !fil)
      void Promise.resolve().then(() => {
        if (fini) return;
        setFil(deja);
        setPieces(deja.pieces);
      });
    const charger = () =>
      fetch(ROUTE, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { fil?: FilVue } | null) => {
          if (fini || !j?.fil) return;
          const f = j.fil;
          setFil(f);
          setPieces((avant) => (avant.length ? fusionner(avant, f.pieces) : f.pieces));
          ecrireMemoire(MEMOIRE_FIL, f);
        })
        .catch(() => undefined);
    void charger();
    const t = window.setInterval(() => document.visibilityState === "visible" && void charger(), 30_000);
    return () => {
      fini = true;
      window.clearInterval(t);
    };
    // (la mémoire seulement à la première ouverture)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, version]);

  // 💡 la première fois : le seul mode d'emploi
  useEffect(() => {
    if (!visible) return;
    let vu = true;
    try {
      vu = window.localStorage.getItem(CLE_INDICE) === "1";
    } catch {
      /* rien */
    }
    if (!vu) void Promise.resolve().then(() => setIndice(true));
  }, [visible]);
  const indiceVu = useCallback(() => {
    setIndice(false);
    try {
      window.localStorage.setItem(CLE_INDICE, "1");
    } catch {
      /* rien */
    }
  }, []);

  // la pièce qu'on regarde : celle qui remplit l'écran
  useEffect(() => {
    const b = boite.current;
    if (!b || !pieces.length) return;
    const io = new IntersectionObserver(
      (vus) => {
        for (const v of vus) if (v.isIntersecting) setCourante((v.target as HTMLElement).dataset.k ?? "");
      },
      { root: b, threshold: 0.6 },
    );
    b.querySelectorAll<HTMLElement>("[data-k]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pieces, fil?.age]);
  // (en glissant, l'indice s'en va ; sa réaction aussi)
  const premiere = useRef("");
  useEffect(() => {
    if (!courante) return;
    if (!premiere.current) premiere.current = courante;
    else if (courante !== premiere.current && indice) indiceVu();
    void Promise.resolve().then(() => setReaction((r) => (r && r.k !== courante ? null : r)));
  }, [courante, indice, indiceVu]);

  // 🚪 sa figurine quitte le salon quand on glisse plus loin (ou que l'onglet se cache)
  useEffect(() => {
    for (const [theme, id] of entres.current) {
      if (visible && courante === `s:${theme}`) continue;
      entres.current.delete(theme);
      void fetch(SALONS, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "sortir", salon: id }), keepalive: true }).catch(() => undefined);
    }
  }, [courante, visible]);

  // 💓 dans le salon où elle est entrée : il redit qu'il est là, et les nouvelles bulles arrivent (toutes les 6 s)
  useEffect(() => {
    if (!visible || !courante.startsWith("s:")) return;
    const theme = courante.slice(2);
    let depuis = Date.now() - 60_000;
    const battre = () => {
      const id = entres.current.get(theme);
      if (!id || document.visibilityState !== "visible") return;
      void fetch(`${SALONS}?salon=${encodeURIComponent(id)}&depuis=${depuis}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { pouls?: { ici: string[]; nouveaux: PresentSalon[]; messages: MessageSalon[]; maintenant: number } } | null) => {
          const p = j?.pouls;
          if (!p) return;
          depuis = Math.max(depuis, ...p.messages.map((m) => m.le));
          setPieces((l) =>
            l.map((x) => {
              if (x.sorte !== "salon" || x.theme !== theme) return x;
              const ici = new Set(p.ici);
              const presents = [...x.presents.filter((y) => ici.has(y.q)), ...p.nouveaux.filter((n) => !x.presents.some((y) => y.q === n.q)).map(enPresent)];
              const neuves: BulleFil[] = p.messages.filter((m) => !x.bulles.some((b) => b.id === m.id)).map((m) => ({ id: m.id, q: m.de, prenom: m.prenom, texte: texteDe(m), le: m.le }));
              return { ...x, presents, bulles: [...x.bulles, ...neuves].filter((b) => b.texte).slice(-6) };
            }),
          );
        })
        .catch(() => undefined);
    };
    const t = window.setInterval(battre, 6000);
    return () => window.clearInterval(t);
  }, [visible, courante]);

  const piecesParCle = useMemo(() => new Map(pieces.map((p) => [cleDe(p), p])), [pieces]);

  /** ✨ Sa figurine réagit dans la pièce qu'on regarde ; dans un salon, pour de vrai. */
  const reagir = useCallback(
    async (k: string) => {
      const p = piecesParCle.get(k);
      if (!p) return;
      if (indice) indiceVu();
      const r = reactionDuFil(p);
      const n = p.sorte === "salon" ? p.presents.length : 0;
      setReaction({ k, e: r.e, texte: p.sorte === "salon" ? P.teVoient(n) : "", n: Date.now() });
      if (p.sorte !== "salon") return;
      const poster = (corps: unknown) => fetch(SALONS, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) }).then(async (x) => ({ ok: x.ok, j: ((await x.json().catch(() => ({}))) ?? {}) as Record<string, unknown> }));
      let id = entres.current.get(p.theme);
      if (!id) {
        const e = await poster({ action: "entrer", theme: p.theme });
        const o = e.j.ouverture as { salon?: { id?: string }; presents?: PresentSalon[] } | undefined;
        if (!e.ok || !o?.salon?.id) {
          setReaction(null);
          if (e.j.age) return void setVersion((v) => v + 1);
          return dire(e.j.figurine ? P.sansFigurine : String(e.j.error ?? "Ça n’a pas marché."));
        }
        id = o.salon.id;
        entres.current.set(p.theme, id);
        // (sa figurine s'assoit dans le gradin, à sa place)
        setPieces((l) => l.map((x) => (x.sorte === "salon" && x.theme === p.theme ? { ...x, id: id!, presents: (o.presents ?? []).map(enPresent) } : x)));
      }
      await poster({ action: "ecrire", salon: id, sorte: "reaction", cle: r.cle });
    },
    [piecesParCle, indice, indiceVu, dire],
  );

  // toucher deux fois l'écran (pas un bouton, pas un lien)
  const surAppui = (e: React.PointerEvent) => {
    appui.current = { x: e.clientX, y: e.clientY };
  };
  const surLacher = (e: React.PointerEvent) => {
    const a = appui.current;
    appui.current = null;
    if (!a || Math.hypot(e.clientX - a.x, e.clientY - a.y) > 12) return;
    const el = e.target as HTMLElement;
    if (el.closest("a,button,input")) return;
    const k = el.closest<HTMLElement>("[data-k]")?.dataset.k;
    if (!k) return;
    const t = Date.now();
    if (tapes.current && tapes.current.k === k && t - tapes.current.t < 340) {
      tapes.current = null;
      void reagir(k);
    } else tapes.current = { k, t };
  };

  const repondreAge = async (adulte: boolean) => {
    await fetch(SALONS, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "age", adulte }) }).catch(() => undefined);
    setFil((f) => (f ? { ...f, age: undefined } : f));
    setVersion((v) => v + 1);
  };

  const moi = fil?.moi;
  const vide = fil && !fil.age && !pieces.length;
  return (
    <div className="fd" data-fil data-pieces={pieces.length}>
      <div className="fd-boite" ref={boite} onPointerDown={surAppui} onPointerUp={surLacher} onPointerCancel={() => (appui.current = null)}>
        {!fil && <div className="fd-carte fd-attente" aria-hidden="true" />}
        {fil?.age && (
          <section className="fd-carte fd-age" data-k="age" data-piece="age">
            <div className="fd-milieu">
              <h2>{P.age}</h2>
              <p>{P.ageChapo}</p>
              <button type="button" className="fd-bouton" data-age="adulte" onClick={() => void repondreAge(true)}>
                {P.adulte}
              </button>
              <button type="button" className="fd-bouton fd-second" data-age="jeune" onClick={() => void repondreAge(false)}>
                {P.jeune}
              </button>
            </div>
          </section>
        )}
        {pieces.map((p) => {
          const k = cleDe(p);
          return p.sorte === "salon" ? (
            <PieceSalon key={k} k={k} p={p} />
          ) : p.sorte === "autour" ? (
            <section key={k} className="fd-carte fd-autour" data-k={k} data-piece="autour" data-pose={p.figurine.id}>
              <span className="fd-etiquette">📍 {P.autourEtiquette(p.nomLieu)}</span>
              <div className="fd-milieu fd-pose">
                <p className="fd-mot" data-mot>
                  {p.figurine.mot}
                </p>
                <FigurineAssise f={p.figurine} hauteur={230} />
              </div>
              <div className="fd-bas">
                <h2>{P.autourTitre(p.figurine.prenom)}</h2>
                <p>{P.autourSous(heuresRestantes(p.figurine.fin))}</p>
                <a className="fd-bouton" href={`/collection?autour=${encodeURIComponent(p.lieu)}&pose=${p.figurine.id}#autour`} data-asseoir-a-cote>
                  {P.asseoirACote}
                </a>
              </div>
            </section>
          ) : (
            <section key={k} className="fd-carte fd-humeur" data-k={k} data-piece="humeur">
              <span className="fd-etiquette">☀️ {P.humeurEtiquette}</span>
              <div className="fd-milieu fd-proches">
                {p.proches.map((x) => (
                  <button key={x.cle} type="button" className={`fd-proche${x.doux ? " doux" : ""}`} data-proche={x.cle} onClick={() => onConversation(x.cle)} aria-label={P.repondreA(x.prenom)}>
                    <span className="fd-bulle-fixe">
                      {x.emoji} {x.nom}
                    </span>
                    <FigurineAssise f={x.figurine} hauteur={p.proches.length > 2 ? 120 : 170} />
                    <small>{x.prenom}</small>
                  </button>
                ))}
              </div>
              <div className="fd-bas">
                <h2>{P.humeurTitre(p.proches[0].prenom, p.proches[0].nom)}</h2>
                <p>{p.proches[0].doux ? P.humeurDouce : P.humeurSous}</p>
                <button type="button" className="fd-bouton" data-repondre={p.proches[0].cle} onClick={() => onConversation(p.proches[0].cle)}>
                  {P.repondreA(p.proches[0].prenom)}
                </button>
              </div>
            </section>
          );
        })}
        {vide && (
          <section className="fd-carte fd-vide" data-k="vide" data-piece="vide">
            <div className="fd-milieu">
              <h2>{P.videTitre}</h2>
              <p>{P.videSous}</p>
              <button type="button" className="fd-bouton" onClick={onAutour}>
                {P.poserAutour}
              </button>
              <button type="button" className="fd-bouton fd-second" onClick={onTousLesSalons}>
                {P.tousLesSalons}
              </button>
            </div>
          </section>
        )}
      </div>

      {/* en haut : ce qui l'attend ailleurs, et « Tous les salons » */}
      <div className="fd-haut">
        {fil?.invitation ? (
          <a className="fd-pastille" href={`/univers/salons?chez=${encodeURIComponent(fil.invitation.cle)}`} data-invitation>
            {P.invitation(fil.invitation.prenom)}
          </a>
        ) : fil?.demandes ? (
          <button type="button" className="fd-pastille" data-demandes onClick={onTousLesSalons}>
            {P.demandes(fil.demandes)} · {P.voir}
          </button>
        ) : (
          <span />
        )}
        <button type="button" className="fd-tous" data-tous-les-salons onClick={onTousLesSalons}>
          {P.tousLesSalons}
        </button>
      </div>

      {/* 🧍 sa figurine, au bord de la pièce : la toucher, c'est réagir */}
      {moi?.figurine && (
        <div className="fd-moi" data-moi>
          {reaction && reaction.k === courante && (
            <span className="fd-reaction" key={reaction.n} data-reaction>
              <b>{reaction.e}</b>
              {reaction.texte && <small data-vu-par>{reaction.texte}</small>}
            </span>
          )}
          <button type="button" className={reaction && reaction.k === courante ? (reaction.e === "💃" ? "danse" : "saute") : ""} aria-label="Ma figurine : réagir" onClick={() => courante && void reagir(courante)}>
            <FigurineAssise f={moi.figurine} hauteur={92} />
            <small>Toi</small>
          </button>
        </div>
      )}

      {indice && pieces.length > 0 && (
        <div className="fd-indice" data-indice aria-live="polite">
          <span className="fd-fleche" aria-hidden="true">
            ︿
          </span>
          <b>{P.indice}</b>
          <small>{P.indiceDouble}</small>
        </div>
      )}
      {toast && (
        <p className="fd-toast" role="status" data-toast>
          {toast}
        </p>
      )}
    </div>
  );
}

/** 🛋️ Un salon en direct : sa télé, son gradin, ceux qui y sont, leurs dernières bulles. */
function PieceSalon({ k, p }: { k: string; p: SalonFil }) {
  const plan: readonly PlaceGradin[] = p.gradin?.places.length ? p.gradin.places : PLAN_GRADIN;
  const musique = p.theme === "musique";
  // (la dernière bulle de chacun de ceux qui sont là)
  const bulles = new Map<string, BulleFil>();
  for (const b of p.bulles) bulles.set(b.q, b);
  const libres = Math.max(0, PLACES_SALON - p.presents.length);
  return (
    <section className="fd-carte fd-salon" data-k={k} data-piece="salon" data-theme={p.theme} data-salon={p.id}>
      <span className="fd-etiquette">
        <i className="fd-direct" aria-hidden="true" />
        {P.enDirect(p.presents.length)}
        {p.mien ? ` · ${P.tesPassions}` : ""}
      </span>
      <div className="fd-tele" data-tele>
        {p.video ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vignetteYouTube(p.video.id)} alt="" referrerPolicy="no-referrer" loading="lazy" draggable={false} />
        ) : (
          <span className="fd-neige" aria-hidden="true" />
        )}
        <span className="fd-tele-titre">{musique ? (p.morceau ? P.choix(p.morceau.prenom) : P.radio) : p.video?.titre ?? ""}</span>
      </div>
      <div className="fd-scene">
        <div className="fd-gradin" style={p.gradin ? { backgroundImage: `url(${p.gradin.flou})` } : undefined} data-gradin={p.gradin ? "1" : "plan"}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.gradin && <img className="fd-gradin-img" src={p.gradin.src} alt="" draggable={false} loading="lazy" />}
          {p.presents.map((x, i) => {
            const g = plan[x.place % plan.length] ?? plan[i % plan.length];
            const b = bulles.get(x.q);
            return (
              <span key={x.q} className={`fd-fig${musique ? " danse" : ""}`} data-q={x.q} style={{ left: `${g.x * 100}%`, top: `${g.y * 100}%`, height: `${g.hauteur * 100}%`, animationDelay: `${(i % 4) * 0.18}s` }}>
                {b && (
                  <span className="fd-bulle" key={b.id} data-bulle style={{ animationDelay: `${(i % 3) * 1.6}s` }}>
                    {b.texte}
                  </span>
                )}
                {x.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={x.src} alt="" draggable={false} />
                ) : (
                  <span className="fd-sans" aria-hidden="true" />
                )}
                <small>{x.prenom}</small>
              </span>
            );
          })}
        </div>
      </div>
      <div className="fd-bas">
        <h2>
          {p.e} {p.nom}
        </h2>
        <p>{P.places(libres)}</p>
        <a className="fd-bouton" href={`/univers/salons?theme=${p.theme}`} data-asseoir>
          {musique ? P.entrerDanser : P.asseoir}
        </a>
      </div>
    </section>
  );
}

export const STYLES_FIL = `
.fd{position:relative}
.fd-boite{position:fixed;inset:0;z-index:1;overflow-y:auto;overscroll-behavior:contain;scroll-snap-type:y mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;background:#0B0409}
.fd-boite::-webkit-scrollbar{display:none}
.fd-carte{position:relative;height:100dvh;box-sizing:border-box;scroll-snap-align:start;scroll-snap-stop:always;display:flex;flex-direction:column;gap:10px;
  padding:calc(64px + env(safe-area-inset-top)) 16px calc(112px + env(safe-area-inset-bottom));overflow:hidden;touch-action:manipulation;-webkit-user-select:none;user-select:none;
  background:radial-gradient(90% 50% at 50% 35%,rgba(255,46,154,.16),transparent 70%),#0B0409}
.fd-salon[data-theme="musique"]{background:radial-gradient(90% 50% at 50% 35%,rgba(122,92,255,.22),transparent 70%),#130A1E}
.fd-autour{background:radial-gradient(80% 45% at 50% 40%,rgba(242,196,107,.2),transparent 70%),#1E120E}
.fd-humeur{background:radial-gradient(80% 45% at 50% 40%,rgba(255,122,192,.18),transparent 70%),#1A0C18}
.fd-attente{background:linear-gradient(100deg,#0B0409 30%,#1A0D16 50%,#0B0409 70%);background-size:200% 100%;animation:mc-reflet 1.4s linear infinite}
.fd-etiquette{align-self:flex-start;display:inline-flex;align-items:center;gap:7px;max-width:calc(100% - 150px);padding:5px 12px 5px 10px;border-radius:999px;background:rgba(255,255,255,.12);font-size:12.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fd-direct{width:8px;height:8px;border-radius:50%;background:#FF4D6D;animation:fd-direct 1.4s ease-in-out infinite}
.fd-tele{position:relative;flex:none;width:100%;max-width:520px;align-self:center;aspect-ratio:16/9;max-height:26dvh;border-radius:16px;overflow:hidden;background:#140A12;box-shadow:inset 0 0 0 5px #1E1420}
.fd-tele img{width:100%;height:100%;object-fit:cover;display:block}
.fd-neige{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.04) 0 2px,transparent 2px 4px)}
.fd-tele-titre{position:absolute;left:0;right:0;bottom:0;padding:16px 12px 8px;background:linear-gradient(transparent,rgba(0,0,0,.78));font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fd-scene{flex:1 1 auto;min-height:0;display:flex;justify-content:center;align-items:flex-end}
.fd-gradin{position:relative;height:100%;max-height:100%;aspect-ratio:1/1;max-width:100%;border-radius:18px;overflow:visible;background:radial-gradient(70% 60% at 50% 70%,rgba(255,255,255,.06),transparent 70%);background-size:cover;background-position:center}
.fd-gradin-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:18px}
.fd-fig{position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;transform-origin:50% 100%}
.fd-fig img{height:100%;width:auto;max-width:none;filter:drop-shadow(0 6px 8px rgba(0,0,0,.5));-webkit-user-drag:none}
.fd-fig.danse img{animation:fd-danse .8s ease-in-out infinite;transform-origin:50% 100%}
.fd-fig small{position:absolute;bottom:2px;left:50%;transform:translateX(-50%);padding:1px 7px;border-radius:999px;background:rgba(0,0,0,.62);font-size:10.5px;font-weight:800;white-space:nowrap}
.fd-sans{display:block;height:100%;aspect-ratio:.6;border-radius:40% 40% 14px 14px;background:rgba(255,255,255,.1)}
.fd-bulle{position:absolute;bottom:calc(100% - 6px);left:50%;transform:translateX(-50%);z-index:2;max-width:170px;padding:6px 10px;border-radius:14px;background:#fff;color:#1A0D14;font-size:12.5px;font-weight:800;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  box-shadow:0 6px 16px rgba(0,0,0,.35);opacity:0;animation:fd-bulle 5s ease-in-out infinite}
.fd-milieu{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center}
.fd-milieu h2{margin:0;font-size:22px;font-weight:800;line-height:1.2}
.fd-milieu p{margin:0;font-size:14.5px;color:#D9C3CB}
.fd-pose{gap:10px}
.fd-milieu .fd-mot{position:relative;margin:0;max-width:300px;padding:16px 20px;border-radius:22px;background:#fff;color:#1A0D14;font-size:22px;font-weight:900;line-height:1.2;box-shadow:0 14px 30px rgba(0,0,0,.45)}
.fd-mot::after{content:"";position:absolute;left:50%;bottom:-12px;margin-left:-10px;border:12px solid transparent;border-bottom:0;border-top-color:#fff}
.fd-proches{flex-direction:row;flex-wrap:wrap;align-items:center;align-content:center;gap:10px 16px}
.fd-proche{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;padding:0;border:0;background:none;color:#fff;font:inherit;cursor:pointer}
.fd-proche small{padding:1px 8px;border-radius:999px;background:rgba(0,0,0,.6);font-size:11.5px;font-weight:800}
.fd-bulle-fixe{max-width:150px;padding:6px 10px;border-radius:14px;background:#fff;color:#1A0D14;font-size:12px;font-weight:800;line-height:1.2}
.fd-proche.doux .fd-bulle-fixe{background:#FFE3F1}
.fd-bas{flex:none;display:flex;flex-direction:column;align-items:flex-start;gap:5px;padding-right:104px}
.fd-bas h2{margin:0;font-size:19px;font-weight:800;line-height:1.25}
.fd-bas p{margin:0 0 4px;font-size:13.5px;color:#E6D8DF}
.fd-bouton{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 22px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:15.5px;font-weight:800;text-decoration:none;cursor:pointer;box-shadow:0 10px 22px -8px rgba(255,46,154,.9)}
.fd-second{background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}
.fd-haut{position:fixed;left:0;right:0;top:calc(58px + env(safe-area-inset-top));z-index:3;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:0 12px;pointer-events:none}
.fd-haut>*{pointer-events:auto}
.fd-tous,.fd-pastille{min-height:36px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.28);background:rgba(11,4,9,.55);color:#fff;font:inherit;font-size:13px;font-weight:700;display:inline-flex;align-items:center;text-decoration:none;cursor:pointer;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.fd-pastille{background:#FF2E9A;border-color:transparent;max-width:62vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fd-moi{position:fixed;right:10px;bottom:calc(104px + env(safe-area-inset-bottom));z-index:4;display:flex;flex-direction:column;align-items:center}
.fd-moi>button{display:flex;flex-direction:column;align-items:center;padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;transform-origin:50% 100%}
.fd-moi>button small{margin-top:-4px;padding:1px 10px;border-radius:999px;background:#FF2E9A;color:#fff;font-size:11px;font-weight:900}
.fd-moi>button.saute{animation:fd-saute .5s cubic-bezier(.2,1.4,.4,1) 2}
.fd-moi>button.danse{animation:fd-danse .7s ease-in-out 4}
.fd-reaction{position:absolute;bottom:calc(100% + 18px);right:0;z-index:2;display:flex;flex-direction:column;align-items:flex-end;gap:4px;animation:fd-surgit .35s cubic-bezier(.2,1.4,.4,1)}
.fd-reaction b{padding:6px 12px;border-radius:16px;background:#fff;font-size:26px;line-height:1.1}
.fd-reaction small{padding:3px 9px;border-radius:10px;background:rgba(11,4,9,.85);color:#fff;font-size:11.5px;font-weight:800;white-space:nowrap}
.fd-indice{position:fixed;left:50%;top:42%;z-index:5;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;text-align:center;width:max-content;max-width:calc(100vw - 32px)}
.fd-indice b{padding:9px 16px;border-radius:999px;background:rgba(11,4,9,.85);font-size:14.5px;font-weight:800}
.fd-indice small{padding:5px 12px;border-radius:999px;background:rgba(11,4,9,.75);font-size:12.5px;font-weight:700;color:#F2DDE7}
.fd-fleche{font-size:34px;line-height:1;animation:fd-flotte 1.6s ease-in-out infinite}
.fd-toast{position:fixed;left:50%;top:calc(104px + env(safe-area-inset-top));z-index:6;transform:translateX(-50%);margin:0;padding:10px 16px;border-radius:14px;background:rgba(20,6,14,.95);color:#fff;font-size:14px;max-width:calc(100vw - 32px);text-align:center;box-shadow:0 10px 30px -10px #000}
@media (min-width:860px){.fd-carte{padding-left:max(16px,calc(50vw - 300px));padding-right:max(16px,calc(50vw - 300px))}}
@keyframes fd-direct{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes fd-bulle{0%,8%{opacity:0;transform:translate(-50%,6px) scale(.85)}14%,72%{opacity:1;transform:translate(-50%,0)}86%,100%{opacity:0;transform:translate(-50%,-4px)}}
@keyframes fd-danse{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg) translateY(-4px)}}
@keyframes fd-saute{0%,100%{transform:none}40%{transform:translateY(-16px) scale(1.06)}}
@keyframes fd-surgit{from{opacity:0;transform:translateY(10px) scale(.6)}}
@keyframes fd-flotte{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@media (prefers-reduced-motion:reduce){.fd *{animation:none!important}.fd-bulle{opacity:1}}
`;
