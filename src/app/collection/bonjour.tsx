"use client";

/**
 * 🎙️ « MON BONJOUR », AVEC SA VOIX (le chantier « Ma figurine », lot 4 ; `lib/direct/bonjour.ts` ;
 * `docs/univers/ma-figurine.md`, section 6).
 *
 *   · `jouerBonjour(src)` : le bonjour de quelqu'un, quand on touche sa figurine (le fil, un salon, Autour) — un seul à la
 *     fois (le suivant coupe le précédent). Il prévient la page (`clikme:bonjour`) : sa figurine dit « 👋 ».
 *   · `MonBonjour` : l'enregistrer dans « Mon double du jour » — « 🎙️ Enregistrer » (cinq secondes au plus, « ■ C'est
 *     dit » pour finir avant), l'écouter, le garder ou le refaire ; l'enlever.
 * Jamais de voix de synthèse : seulement la sienne, au micro.
 */
import { useEffect, useRef, useState } from "react";
import { BONJOUR, PHRASES_BONJOUR as P, type BonjourVu } from "@/lib/direct/bonjour";

let lecteur: HTMLAudioElement | null = null;

/** Faire entendre le bonjour de quelqu'un (rien : il n'en a pas — `false`). À appeler dans le toucher lui-même. */
export function jouerBonjour(src: string | null | undefined): boolean {
  if (!src || typeof window === "undefined") return false;
  try {
    if (!lecteur) lecteur = new Audio();
    lecteur.pause();
    lecteur.src = src;
    void lecteur.play().catch(() => undefined);
    window.dispatchEvent(new CustomEvent("clikme:bonjour", { detail: { src } }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Toucher une figurine qui a un bonjour : on l'entend, et elle dit « 👋 » un instant. `vu` : la clé de celle qui le dit
 * (rien : personne).
 */
export function useBonjour(): [string, (src: string | null | undefined, cle: string) => void] {
  const [vu, setVu] = useState("");
  useEffect(() => {
    if (!vu) return;
    const t = window.setTimeout(() => setVu(""), 1800);
    return () => window.clearTimeout(t);
  }, [vu]);
  return [vu, (src, cle) => void (jouerBonjour(src) && setVu(cle))];
}

/** Le « 👋 » au-dessus de sa figurine, pendant son bonjour (posé dans ce qui la porte, en `position: relative`). */
export function DitBonjour() {
  return (
    <i className="bj-dit" aria-hidden="true" data-dit-bonjour>
      {P.dit}
      <style>{`.bj-dit{position:absolute;left:50%;top:-6%;z-index:6;transform:translate(-50%,-100%);padding:.2em .45em;border-radius:999px;background:#fff4e6;font-style:normal;font-size:22px;line-height:1.1;box-shadow:0 6px 14px -6px rgba(0,0,0,.6);animation:bj-dit 1.8s ease-out both;pointer-events:none}@keyframes bj-dit{0%{opacity:0;transform:translate(-50%,-80%) scale(.6)}15%{opacity:1;transform:translate(-50%,-100%) scale(1.1)}25%{transform:translate(-50%,-100%) scale(1)}85%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){.bj-dit{animation:none}}`}</style>
    </i>
  );
}

/** L'horloge du micro (hors du rendu : seulement dans ses gestes). */
const horloge = () => performance.now();
const TYPES_SON = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
type Prise = { r: MediaRecorder; flux: MediaStream; t0: number; morceaux: Blob[]; fin: number; tic: number };
type Pret = { blob: Blob; url: string; duree: number };

const enDataUrl = (b: Blob) =>
  new Promise<string>((ok, ko) => {
    const l = new FileReader();
    l.onload = () => ok(String(l.result));
    l.onerror = () => ko(new Error(""));
    l.readAsDataURL(b);
  });
const secondes = (d: number) => `${d.toFixed(1).replace(".", ",")} s`;

export function MonBonjour({ bonjour, envoyer }: { bonjour?: BonjourVu; envoyer: (corps: object, phrase: string) => Promise<boolean> }) {
  const [etat, setEtat] = useState<"rien" | "micro" | "envoi">("rien");
  const [reste, setReste] = useState<number>(BONJOUR.max);
  const [pret, setPret] = useState<Pret | null>(null);
  const [message, setMessage] = useState("");
  const prise = useRef<Prise | null>(null);
  const ecoute = useRef<HTMLAudioElement | null>(null);

  const couper = () => {
    const p = prise.current;
    if (!p) return;
    window.clearTimeout(p.fin);
    window.clearInterval(p.tic);
    p.flux.getTracks().forEach((t) => t.stop());
  };
  useEffect(
    () => () => {
      couper();
      prise.current = null;
    },
    [],
  );
  useEffect(() => () => (pret ? URL.revokeObjectURL(pret.url) : undefined), [pret]);

  async function enregistrer() {
    if (etat !== "rien") return;
    setMessage("");
    setPret(null);
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = TYPES_SON.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(t));
      const r = new MediaRecorder(flux, { ...(type ? { mimeType: type } : {}), audioBitsPerSecond: 48_000 });
      const p: Prise = { r, flux, t0: horloge(), morceaux: [], fin: 0, tic: 0 };
      r.ondataavailable = (ev) => ev.data.size && p.morceaux.push(ev.data);
      r.onstop = () => {
        couper();
        const duree = Math.min(BONJOUR.max, (horloge() - p.t0) / 1000);
        prise.current = null;
        setEtat("rien");
        if (duree < BONJOUR.min || !p.morceaux.length) return setMessage(P.court);
        const blob = new Blob(p.morceaux, { type: r.mimeType || "audio/webm" });
        setPret({ blob, url: URL.createObjectURL(blob), duree: Math.round(duree * 100) / 100 });
      };
      prise.current = p;
      r.start(250);
      setReste(BONJOUR.max);
      setEtat("micro");
      p.fin = window.setTimeout(() => finir(), BONJOUR.max * 1000);
      p.tic = window.setInterval(() => setReste(Math.max(0, Math.ceil(BONJOUR.max - (horloge() - p.t0) / 1000))), 200);
    } catch {
      setEtat("rien");
      setMessage(P.refus);
    }
  }
  function finir() {
    const p = prise.current;
    if (p && p.r.state !== "inactive") p.r.stop();
  }
  async function garder() {
    if (!pret || etat !== "rien") return;
    setEtat("envoi");
    try {
      const son = await enDataUrl(pret.blob);
      if (await envoyer({ action: "bonjour", son, duree: pret.duree }, P.garde)) setPret(null);
    } catch {
      setMessage(P.rate);
    }
    setEtat("rien");
  }
  const ecouter = (src: string) => {
    if (src === pret?.url) {
      if (!ecoute.current) ecoute.current = new Audio();
      ecoute.current.src = src;
      void ecoute.current.play().catch(() => undefined);
    } else jouerBonjour(src);
  };

  return (
    <section data-panneau="bonjour">
      <h2>{P.titre}</h2>
      <p>{P.chapo}</p>
      {etat === "micro" ? (
        <div className="mb-micro" data-bonjour-micro>
          <i aria-hidden="true" />
          <b data-reste={reste}>{reste} s</b>
          <button type="button" className="md-ambre" onClick={finir} data-bonjour-fini>
            ■ C’est dit
          </button>
        </div>
      ) : pret ? (
        <div className="mb-pret" data-bonjour-pret={pret.duree}>
          <p className="md-fort">{P.pret}</p>
          <div className="md-puces">
            <button type="button" className="md-puce" onClick={() => ecouter(pret.url)} data-bonjour-ecouter-nouveau>
              {P.ecouter} ({secondes(pret.duree)})
            </button>
            <button type="button" className="md-ambre" disabled={etat === "envoi"} onClick={() => void garder()} data-bonjour-garder>
              {etat === "envoi" ? "…" : P.garder}
            </button>
          </div>
          <button type="button" className="md-discret" onClick={() => void enregistrer()} data-bonjour-refaire>
            {P.refaire}
          </button>
        </div>
      ) : (
        <>
          {bonjour ? (
            <div className="md-puces" data-bonjour-sien={bonjour.duree}>
              <button type="button" className="md-puce on" onClick={() => ecouter(bonjour.src)} data-bonjour-ecouter>
                {P.ecouter} · {P.sien} ({secondes(bonjour.duree)})
              </button>
            </div>
          ) : (
            <p className="md-attente" data-bonjour-sans>
              {P.sans}
            </p>
          )}
          <button type="button" className="md-ambre mb-enregistrer" onClick={() => void enregistrer()} data-bonjour-enregistrer>
            🎙️ {bonjour ? "Refaire mon bonjour" : "Enregistrer mon bonjour"}
          </button>
          {bonjour && (
            <button type="button" className="md-discret" onClick={() => void envoyer({ action: "bonjour", son: "" }, P.enleve)} data-bonjour-enlever>
              {P.enlever}
            </button>
          )}
        </>
      )}
      {message && (
        <p className="md-erreur" role="alert" data-bonjour-message>
          {message}
        </p>
      )}
      <style>{STYLES_BONJOUR}</style>
    </section>
  );
}

const STYLES_BONJOUR = `
.mb-micro{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:18px;background:#261b16;box-shadow:inset 0 0 0 1px rgba(255,90,90,.35)}
.mb-micro i{width:14px;height:14px;border-radius:50%;background:#ff4b4b;animation:mb-bat 1s ease-in-out infinite}
.mb-micro b{flex:1;font-family:var(--font-clikme),Poppins,system-ui,sans-serif;font-weight:800;font-size:20px}
@keyframes mb-bat{0%,100%{opacity:1}50%{opacity:.35}}
.mb-enregistrer{display:block;width:100%;margin-top:12px}
@media (prefers-reduced-motion: reduce){.mb-micro i{animation:none}}
`;
