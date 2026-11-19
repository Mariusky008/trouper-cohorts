"use client";

/**
 * 🎙️ LE MICRO DE LA SAISIE (`docs/univers/salon-du-duo.md`, section 4.6 ; le lot S4) — on le garde appuyé et on parle :
 * la barre devient ● rouge, le temps (0:04), la forme de la voix en direct, « ‹ glisse pour effacer » ; le bouton
 * grossit, rouge. On relâche : le vocal part (`onFin`). On glisse à gauche : effacé. Un toucher trop court : l'astuce.
 * Au clavier : Espace ou Entrée, gardés enfoncés.
 *
 * Le talkie de la scène démarre à l'appui, sans attendre le micro (moins de 150 ms) : tant que le micro n'a pas
 * répondu, la tête parle au rythme d'une voix ; ensuite, au niveau du micro (`onNiveau`, toutes les 60 ms). Ces niveaux
 * partent avec le vocal.
 */
import { useEffect, useRef, useState } from "react";
import { PHRASES_VOCAL, VOCAL, niveauFaux, tempsDit } from "@/lib/direct/vocal";

type Fenetre = Window & { webkitAudioContext?: typeof AudioContext };
/** L'horloge du micro (hors du rendu : seulement dans ses gestes). */
const maintenant = () => performance.now();
const TYPES_SON = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];

/** Ce que rend un enregistrement : un vocal, un effacé, un toucher trop court, ou une erreur (le micro refusé). */
export type FinMicro = { vocal: { blob: Blob; duree: number; niveaux: number[] } } | { annule: true } | { court: true } | { erreur: string };

type Enreg = {
  t0: number;
  niveaux: number[];
  dernier: number;
  fini: boolean;
  rec?: MediaRecorder;
  flux?: MediaStream;
  ctx?: AudioContext;
  analyse?: AnalyserNode;
  donnees?: Uint8Array<ArrayBuffer>;
  morceaux: Blob[];
  erreur?: string;
  raf: number;
};

export function BoutonMicro({
  prenom,
  desactive,
  rappel = false,
  onDebut,
  onNiveau,
  onFin,
}: {
  prenom: string;
  desactive?: boolean;
  /** le bouton bat deux fois (« garde-le appuyé ») */
  rappel?: boolean;
  onDebut: () => void;
  onNiveau: (n: number) => void;
  onFin: (f: FinMicro) => void;
}) {
  const [actif, setActif] = useState(false);
  const enreg = useRef<Enreg | null>(null);
  const appui = useRef<{ x: number; id: number } | null>(null);
  const barre = useRef<HTMLDivElement>(null);
  const temps = useRef<HTMLElement>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  const rappels = useRef({ onDebut, onNiveau, onFin });
  useEffect(() => {
    rappels.current = { onDebut, onNiveau, onFin };
  });

  /** (tout s'éteint : le micro, l'analyse, la boucle) */
  const eteindre = (e: Enreg) => {
    cancelAnimationFrame(e.raf);
    e.flux?.getTracks().forEach((t) => t.stop());
    void e.ctx?.close().catch(() => undefined);
  };
  // (on s'en va pendant un vocal : il est effacé)
  useEffect(
    () => () => {
      const e = enreg.current;
      enreg.current = null;
      if (!e) return;
      e.fini = true;
      if (e.rec && e.rec.state !== "inactive") {
        e.rec.onstop = null;
        e.rec.stop();
      }
      eteindre(e);
    },
    [],
  );

  /** Le niveau du micro, de 0 à 1 (`null` : pas d'analyse). */
  const niveauMicro = (e: Enreg): number | null => {
    if (!e.analyse || !e.donnees) return null;
    e.analyse.getByteTimeDomainData(e.donnees);
    let somme = 0;
    for (const v of e.donnees) somme += ((v - 128) / 128) ** 2;
    return Math.min(1, Math.sqrt(somme / e.donnees.length) * 3.4);
  };
  /** La forme de la voix, en direct (les dernières mesures, de droite à gauche). */
  const dessiner = (l: readonly number[]) => {
    const c = toile.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const w = Math.round(c.clientWidth * 2);
    const h = Math.round(c.clientHeight * 2);
    if (c.width !== w) c.width = w;
    if (c.height !== h) c.height = h;
    ctx.clearRect(0, 0, w, h);
    const pas = 9;
    const n = Math.floor(w / pas);
    const debut = Math.max(0, l.length - n);
    ctx.fillStyle = "#ff8fb4";
    for (let i = debut; i < l.length; i++) {
      const bh = Math.max(4, l[i] * h * 0.95);
      ctx.fillRect((i - debut) * pas, (h - bh) / 2, 5, bh);
    }
  };

  function demarrer() {
    if (enreg.current || desactive) return;
    const e: Enreg = { t0: maintenant(), niveaux: [], dernier: 0, fini: false, morceaux: [], raf: 0 };
    enreg.current = e;
    setActif(true);
    barre.current?.style.setProperty("--dx", "0px");
    rappels.current.onDebut();
    // (le micro : déjà autorisé, il répond vite ; refusé ou absent, tout s'arrête et on le dit)
    const echec = (erreur: string) => {
      e.erreur = erreur;
      if (e.fini || enreg.current !== e) return;
      e.fini = true;
      enreg.current = null;
      appui.current = null;
      setActif(false);
      eteindre(e);
      rappels.current.onFin({ erreur });
    };
    const ouvrir = async () => {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return echec(PHRASES_VOCAL.pasDeMicro);
      let flux: MediaStream;
      try {
        flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      } catch {
        return echec(PHRASES_VOCAL.micro(prenom));
      }
      if (e.fini) {
        flux.getTracks().forEach((t) => t.stop());
        return;
      }
      e.flux = flux;
      const type = TYPES_SON.find((t) => MediaRecorder.isTypeSupported?.(t));
      try {
        e.rec = new MediaRecorder(flux, { ...(type ? { mimeType: type } : {}), audioBitsPerSecond: VOCAL.debit });
      } catch {
        return echec(PHRASES_VOCAL.pasDeMicro);
      }
      e.rec.ondataavailable = (ev) => {
        if (ev.data.size) e.morceaux.push(ev.data);
      };
      e.rec.start(250);
      try {
        const C = window.AudioContext ?? (window as Fenetre).webkitAudioContext;
        if (C) {
          e.ctx = new C();
          void e.ctx.resume().catch(() => undefined);
          e.analyse = e.ctx.createAnalyser();
          e.analyse.fftSize = 512;
          e.donnees = new Uint8Array(new ArrayBuffer(e.analyse.fftSize));
          e.ctx.createMediaStreamSource(flux).connect(e.analyse);
        }
      } catch {
        e.analyse = undefined;
      }
    };
    void ouvrir();
    const tic = (now: number) => {
      if (enreg.current !== e || e.fini) return;
      if (now - e.dernier >= VOCAL.pasMs) {
        e.dernier = now;
        const t = (now - e.t0) / 1000;
        const m = e.rec ? niveauMicro(e) : null;
        const n = m ?? niveauFaux(t, 2);
        e.niveaux.push(n);
        rappels.current.onNiveau(n);
        if (temps.current) temps.current.textContent = tempsDit(t);
        dessiner(e.niveaux);
        if (t >= VOCAL.max) return void finir(false);
      }
      e.raf = requestAnimationFrame(tic);
    };
    e.raf = requestAnimationFrame(tic);
  }

  /** On relâche (ou on glisse : `annule`). */
  function finir(annule: boolean) {
    const e = enreg.current;
    if (!e || e.fini) return;
    e.fini = true;
    enreg.current = null;
    appui.current = null;
    setActif(false);
    const duree = (maintenant() - e.t0) / 1000;
    const rendre = (f: FinMicro) => {
      eteindre(e);
      rappels.current.onFin(f);
    };
    if (annule) {
      if (e.rec && e.rec.state !== "inactive") {
        e.rec.onstop = null;
        e.rec.stop();
      }
      return rendre({ annule: true });
    }
    if (duree < VOCAL.min) {
      if (e.rec && e.rec.state !== "inactive") {
        e.rec.onstop = null;
        e.rec.stop();
      }
      return rendre({ court: true });
    }
    if (!e.rec) return rendre({ erreur: e.erreur ?? PHRASES_VOCAL.micro(prenom) });
    const rec = e.rec;
    rec.onstop = () => {
      const blob = e.morceaux.length ? new Blob(e.morceaux, { type: rec.mimeType || "audio/webm" }) : null;
      rendre(blob ? { vocal: { blob, duree: Math.min(VOCAL.max, duree), niveaux: e.niveaux } } : { erreur: PHRASES_VOCAL.pasParti });
    };
    try {
      if (rec.state !== "inactive") rec.stop();
      else rec.onstop?.(new Event("stop"));
    } catch {
      rendre({ erreur: PHRASES_VOCAL.pasParti });
    }
  }

  return (
    <>
      {actif && (
        <div ref={barre} className="sd-enreg" data-enreg aria-live="polite">
          <i className="sd-pt-rouge" aria-hidden />
          <b ref={temps}>0:00</b>
          <canvas ref={toile} aria-hidden />
          <span className="sd-glisse">{PHRASES_VOCAL.glisse}</span>
        </div>
      )}
      <button
        type="button"
        className={`sd-envoyer sd-micro${actif ? " actif" : ""}${rappel && !actif ? " rappel" : ""}`}
        aria-label={PHRASES_VOCAL.bouton}
        data-micro
        disabled={desactive}
        onPointerDown={(ev) => {
          if (ev.button > 0) return;
          ev.preventDefault();
          try {
            ev.currentTarget.setPointerCapture(ev.pointerId);
          } catch {
            // (sans capture : le relâché hors du bouton finit quand même, par pointercancel)
          }
          appui.current = { x: ev.clientX, id: ev.pointerId };
          demarrer();
        }}
        onPointerMove={(ev) => {
          const a = appui.current;
          if (!a || ev.pointerId !== a.id || !enreg.current) return;
          const dx = Math.min(0, ev.clientX - a.x);
          barre.current?.style.setProperty("--dx", `${dx * 0.6}px`);
          if (dx < -VOCAL.glisse) finir(true);
        }}
        onPointerUp={(ev) => {
          if (appui.current && ev.pointerId === appui.current.id) finir(false);
        }}
        onPointerCancel={(ev) => {
          if (appui.current && ev.pointerId === appui.current.id) finir(true);
        }}
        onContextMenu={(ev) => ev.preventDefault()}
        onKeyDown={(ev) => {
          if (ev.key !== " " && ev.key !== "Enter") return;
          ev.preventDefault();
          if (!ev.repeat && !enreg.current) demarrer();
        }}
        onKeyUp={(ev) => {
          if (ev.key !== " " && ev.key !== "Enter") return;
          ev.preventDefault();
          finir(false);
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <rect x="9" y="3" width="6" height="11" rx="3" fill="#fff" />
          <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      </button>
    </>
  );
}
