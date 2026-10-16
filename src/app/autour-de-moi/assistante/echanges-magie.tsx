"use client";

// ✨ LA MAGIE DE L'ÉCHANGE — sons, scène « C'est à toi ! », pièces qui tintent.
//
// « Il y a peu de magie et d'animations dans ce Tinder commerçant, et quand on
// prend quelque chose il n'y a aucune magie comme sur Tinder, et aucun son. »
//
// LES SONS SONT FABRIQUÉS PAR LE TÉLÉPHONE (Web Audio), aucun fichier à
// charger : un souffle quand la carte part, un carillon quand c'est à toi, une
// pièce quand tu gagnes. Un bouton 🔊 / 🔇 les coupe, et c'est retenu.
//
// « IL N'Y A AUCUN SON. » Deux raisons, toutes deux sur iPhone :
//   1. LE SON N'ÉTAIT PAS DÉBLOQUÉ. Un navigateur ne joue un son qu'après un
//      geste, et sur un écran tactile, POSER le doigt n'en est pas un (seul le
//      fait de le LEVER compte). On débloquait au moment où le doigt se pose :
//      le son restait suspendu. Désormais, le PREMIER geste reconnu n'importe
//      où sur l'écran (doigt levé, clic, touche) réveille le son et joue un
//      silence d'un échantillon, ce qu'exige Safari ; ensuite tout part.
//   2. LE MODE SILENCIEUX. Par défaut, Safari range ces sons parmi les sons
//      « d'ambiance », que le bouton silencieux coupe. On les déclare comme
//      une lecture (`navigator.audioSession.type = "playback"`, iOS 17) : ils
//      s'entendent comme le son d'une vidéo. Le 🔇 de l'écran reste là pour
//      les couper.
// Et chaque son attend que le son soit vraiment réveillé avant de partir.
//
// MOUVEMENT RÉDUIT : si le téléphone le demande, pas de confettis ni de
// rebonds — la scène s'affiche, simplement.
//
// Partagé par la démonstration (`echanges-comptoir.tsx`) et le vrai comptoir
// (`echanges-reels.tsx`).
import { useEffect, useRef, useSyncExternalStore } from "react";

/* ═══ LE SON ══════════════════════════════════════════════════════════════ */
const CLE_MUET = "clikme-echanges-muet";
let muet: boolean | null = null;
const abonnes = new Set<() => void>();
const lireMuet = () => {
  if (muet === null) {
    try {
      muet = window.localStorage.getItem(CLE_MUET) === "1";
    } catch {
      muet = false;
    }
  }
  return muet;
};
function ecrireMuet(v: boolean) {
  muet = v;
  try {
    window.localStorage.setItem(CLE_MUET, v ? "1" : "0");
  } catch {
    /* retenu le temps de la visite */
  }
  abonnes.forEach((f) => f());
}
const sAbonner = (f: () => void) => {
  abonnes.add(f);
  return () => abonnes.delete(f);
};
export const useMuet = () => useSyncExternalStore(sAbonner, lireMuet, () => false);

let audio: AudioContext | null = null;
/** À appeler sur un geste (doigt levé, clic) : le son ne part qu'ensuite. */
export function debloquerSon() {
  if (typeof window === "undefined") return null;
  try {
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session && session.type !== "playback") session.type = "playback";
    if (!audio) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      audio = new Ctx();
    }
    if (audio.state !== "running") {
      void audio.resume().catch(() => undefined);
      // Safari ne réveille vraiment le son qu'en jouant quelque chose pendant le geste : un silence suffit.
      // Rejoué à chaque appel tant qu'il dort : un appel hors geste (doigt posé) ne compte pas.
      const vide = audio.createBufferSource();
      vide.buffer = audio.createBuffer(1, 1, 22050);
      vide.connect(audio.destination);
      vide.start(0);
    }
    return audio;
  } catch {
    return null;
  }
}

/* LE PREMIER GESTE, OÙ QU'IL SOIT : on écoute la page entière jusqu'à ce que
   le son soit réveillé, puis on n'écoute plus. */
let ecoute = false;
const GESTES = ["touchend", "pointerup", "click", "keydown", "mousedown"] as const;
function auGeste() {
  const a = debloquerSon();
  if (a?.state === "running") {
    GESTES.forEach((g) => document.removeEventListener(g, auGeste, true));
    ecoute = false;
  }
}
export function ecouterLePremierGeste() {
  if (ecoute || typeof document === "undefined" || audio?.state === "running") return;
  ecoute = true;
  GESTES.forEach((g) => document.addEventListener(g, auGeste, { capture: true, passive: true }));
}

/** Une note : forme d'onde, fréquence, départ, durée, volume. */
function note(a: AudioContext, sortie: AudioNode, type: OscillatorType, f: number, t: number, duree: number, vol: number) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  o.connect(g).connect(sortie);
  o.start(t);
  o.stop(t + duree + 0.02);
}

/** Un souffle : du bruit filtré dont la hauteur glisse (la carte qui part). */
function souffle(a: AudioContext, sortie: AudioNode, t: number, de: number, vers: number, duree: number, vol: number) {
  const n = Math.floor(a.sampleRate * duree);
  const tampon = a.createBuffer(1, n, a.sampleRate);
  const d = tampon.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = tampon;
  const filtre = a.createBiquadFilter();
  filtre.type = "bandpass";
  filtre.Q.value = 1.4;
  filtre.frequency.setValueAtTime(de, t);
  filtre.frequency.exponentialRampToValueAtTime(vers, t + duree);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + duree * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  src.connect(filtre).connect(g).connect(sortie);
  src.start(t);
  src.stop(t + duree + 0.02);
}

export type Son = "prend" | "passe" | "match" | "piece" | "tic";

export function jouer(son: Son) {
  if (lireMuet()) return;
  const a = debloquerSon();
  if (!a) return;
  // Pas encore réveillé : on attend qu'il le soit (sinon le son se perd).
  if (a.state !== "running") {
    ecouterLePremierGeste();
    a.resume()
      .then(() => composer(a, son))
      .catch(() => undefined);
    return;
  }
  composer(a, son);
}

function composer(a: AudioContext, son: Son) {
  // Un compresseur en sortie : plus fort sur un haut-parleur de téléphone, sans saturer.
  const comp = a.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 6;
  const sortie = a.createGain();
  sortie.gain.value = 1.6;
  sortie.connect(comp).connect(a.destination);
  const t = a.currentTime + 0.01;
  if (son === "tic") note(a, sortie, "sine", 1320, t, 0.06, 0.15);
  if (son === "passe") souffle(a, sortie, t, 1600, 380, 0.2, 0.35);
  if (son === "prend") {
    souffle(a, sortie, t, 500, 3200, 0.24, 0.4);
    note(a, sortie, "triangle", 880, t + 0.12, 0.18, 0.12);
  }
  if (son === "piece") {
    // La pièce : deux notes vives, la seconde qui sonne.
    note(a, sortie, "square", 988, t, 0.09, 0.08);
    note(a, sortie, "triangle", 1319, t + 0.08, 0.5, 0.22);
    note(a, sortie, "sine", 2637, t + 0.08, 0.35, 0.06);
  }
  if (son === "match") {
    // Le carillon : un arpège qui monte, chaque note en cloche.
    [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) => {
      const ti = t + i * 0.075;
      note(a, sortie, "sine", f, ti, 1.1, 0.22);
      note(a, sortie, "triangle", f * 2, ti, 0.5, 0.05);
    });
    note(a, sortie, "sine", 2093, t + 0.5, 1.4, 0.08);
  }
}

/** Une vibration courte, là où le téléphone sait le faire (pas sur iPhone). */
export function vibrer(motif: number | number[]) {
  try {
    navigator.vibrate?.(motif);
  } catch {
    /* sans vibreur */
  }
}

export function BoutonSon() {
  const coupe = useMuet();
  // Affiché dans l'en-tête de l'échange : à partir de là, le premier geste réveille le son.
  useEffect(() => ecouterLePremierGeste(), []);
  return (
    <button
      type="button"
      className="mg-son"
      aria-pressed={!coupe}
      aria-label={coupe ? "Remettre le son" : "Couper le son"}
      onClick={() => {
        ecrireMuet(!coupe);
        if (coupe) {
          debloquerSon();
          setTimeout(() => jouer("tic"), 30);
        }
      }}
    >
      {coupe ? "🔇" : "🔊"}
    </button>
  );
}

/* ═══ LA SCÈNE « C'EST À TOI ! » ══════════════════════════════════════════
   Comme le « It's a Match » : l'écran s'illumine, ta photo et la sienne
   arrivent chacune de leur côté et se rencontrent, une onde part, les
   confettis éclatent, le carillon sonne, et le titre s'écrit lettre à
   lettre. Puis : « Voir mon QR code » ou « Continuer à découvrir ». */
const TITRE = "C’est à toi !";

export function FeteDuMatch({
  moi,
  eux,
  titre,
  commerce,
  prix,
  onQr,
  onFermer,
}: {
  moi: string;
  eux: string;
  titre: string;
  commerce: string;
  prix: number;
  onQr: () => void;
  onFermer: () => void;
}) {
  useEffect(() => {
    // Le son et la vibration au moment où les deux photos se rencontrent.
    const t = window.setTimeout(() => {
      jouer("match");
      vibrer([30, 60, 90]);
    }, 420);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="mg-fete" role="dialog" aria-label={TITRE}>
      <Confettis />
      <div className="mg-fete-c">
        <h2 className="mg-titre" aria-label={TITRE}>
          {[...TITRE].map((ch, i) => (
            <span key={i} aria-hidden="true" style={{ animationDelay: `${0.5 + i * 0.045}s` }}>
              {ch === " " ? "\u00a0" : ch}
            </span>
          ))}
        </h2>
        <div className="mg-duo" aria-hidden="true">
          <span className="mg-onde" />
          <span className="mg-onde deux" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="mg-g" src={moi} alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="mg-d" src={eux} alt="" />
          <span className="mg-lien-coeur">🤝</span>
        </div>
        <p className="mg-quoi">
          <b>{titre}</b>
          <span>
            chez {commerce} · {prix} €
          </span>
        </p>
        <button type="button" className="mg-go" onClick={onQr}>
          Voir mon QR code
        </button>
        <button type="button" className="mg-plus" onClick={onFermer}>
          Continuer à découvrir
        </button>
      </div>
      <StylesMagie />
    </div>
  );
}

function Confettis() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = c.clientWidth;
    const H = c.clientHeight;
    c.width = W * dpr;
    c.height = H * dpr;
    ctx.scale(dpr, dpr);
    const couleurs = ["#F5A23A", "#FF2E9A", "#FFF4E6", "#7CF0A2", "#FFD27A", "#FF8FB8"];
    const parts = Array.from({ length: 150 }, (_, i) => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const vitesse = 6 + Math.random() * 11;
      return {
        x: W / 2,
        y: H * 0.42,
        vx: Math.cos(angle) * vitesse,
        vy: Math.sin(angle) * vitesse,
        r: 5 + Math.random() * 6,
        a: Math.random() * Math.PI * 2,
        va: (Math.random() - 0.5) * 0.35,
        c: couleurs[i % couleurs.length],
        forme: i % 3,
      };
    });
    const depart = performance.now() + 420;
    let raf = 0;
    const dessiner = (t: number) => {
      const e = t - depart;
      ctx.clearRect(0, 0, W, H);
      if (e > 0) {
        for (const p of parts) {
          p.vy += 0.28;
          p.vx *= 0.985;
          p.x += p.vx;
          p.y += p.vy;
          p.a += p.va;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.a);
          ctx.globalAlpha = Math.max(0, 1 - e / 2800);
          ctx.fillStyle = p.c;
          if (p.forme === 0) ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
          else if (p.forme === 1) {
            ctx.beginPath();
            ctx.arc(0, 0, p.r / 2.4, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Une petite étoile à quatre branches.
            ctx.beginPath();
            for (let k = 0; k < 8; k++) {
              const rr = k % 2 ? p.r / 5 : p.r / 1.6;
              ctx.lineTo(Math.cos((k * Math.PI) / 4) * rr, Math.sin((k * Math.PI) / 4) * rr);
            }
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }
      }
      if (e < 2900) raf = requestAnimationFrame(dessiner);
    };
    raf = requestAnimationFrame(dessiner);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="mg-confettis" aria-hidden="true" />;
}

/** « +60 € » qui monte du solde, avec des pièces : rejouée à chaque nouvelle `cle`. */
export function GainQuiMonte({ montant }: { montant: number }) {
  return (
    <span className="mg-gain" aria-hidden="true">
      <b>+{montant} €</b>
      {[0, 1, 2, 3, 4].map((i) => (
        <i key={i} style={{ left: `${18 + i * 16}%`, animationDelay: `${i * 0.07}s` }}>
          🪙
        </i>
      ))}
    </span>
  );
}

export function StylesMagie() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.mg-son{width:40px;height:40px;border-radius:50%;border:1px solid var(--trait,rgba(255,196,140,.14));background:var(--nappe,#1C1411);font-size:18px;line-height:1;}
.mg-fete{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;overflow:hidden;
  padding:calc(20px + env(safe-area-inset-top,0px)) 20px calc(20px + env(safe-area-inset-bottom,0px));
  background:radial-gradient(120% 85% at 50% 38%,#FF5AB4 0%,#D81B7E 30%,#5A1236 62%,#1A0E0B 88%);
  animation:mg-fond .45s ease-out both;}
@keyframes mg-fond{from{opacity:0;}to{opacity:1;}}
.mg-confettis{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
.mg-fete-c{position:relative;width:100%;max-width:420px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;}
.mg-titre{margin:0;font-family:var(--font-clikme),sans-serif;font-size:44px;font-weight:900;line-height:1;color:#fff;
  text-shadow:0 4px 30px rgba(255,46,154,.7),0 0 2px rgba(0,0,0,.3);white-space:nowrap;}
.mg-titre span{display:inline-block;opacity:0;animation:mg-lettre .5s cubic-bezier(.2,1.6,.4,1) both;}
@keyframes mg-lettre{from{opacity:0;transform:translateY(24px) scale(.4) rotate(-12deg);}to{opacity:1;transform:none;}}
.mg-duo{position:relative;width:260px;height:150px;margin:8px 0;}
.mg-duo img{position:absolute;top:10px;width:130px;height:130px;border-radius:50%;object-fit:cover;background:#261B16;
  border:4px solid #fff;box-shadow:0 14px 40px -10px rgba(0,0,0,.7);}
.mg-g{left:6px;animation:mg-gauche .55s cubic-bezier(.3,1.5,.5,1) both;}
.mg-d{right:6px;animation:mg-droite .55s cubic-bezier(.3,1.5,.5,1) both;}
@keyframes mg-gauche{from{transform:translateX(-160px) rotate(-30deg);opacity:0;}70%{transform:translateX(14px) rotate(4deg);opacity:1;}to{transform:rotate(-6deg);}}
@keyframes mg-droite{from{transform:translateX(160px) rotate(30deg);opacity:0;}70%{transform:translateX(-14px) rotate(-4deg);opacity:1;}to{transform:rotate(6deg);}}
.mg-lien-coeur{position:absolute;left:50%;top:50%;width:58px;height:58px;margin:-29px 0 0 -29px;border-radius:50%;display:grid;place-items:center;
  font-size:28px;background:linear-gradient(140deg,#FF2E9A,#F5A23A);box-shadow:0 0 0 4px #fff,0 10px 30px rgba(255,46,154,.6);z-index:2;
  animation:mg-coeur .5s .42s cubic-bezier(.2,1.8,.4,1) both,mg-bat 1.2s 1s ease-in-out infinite;}
@keyframes mg-coeur{from{transform:scale(0) rotate(-90deg);}to{transform:none;}}
@keyframes mg-bat{0%,100%{transform:scale(1);}50%{transform:scale(1.12);}}
.mg-onde{position:absolute;left:50%;top:50%;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:50%;border:3px solid rgba(255,255,255,.85);
  opacity:0;animation:mg-onde 1s .42s ease-out both;}
.mg-onde.deux{animation-delay:.62s;border-color:rgba(245,162,58,.9);}
@keyframes mg-onde{from{transform:scale(.4);opacity:.9;}to{transform:scale(6);opacity:0;}}
.mg-quoi{margin:0;display:flex;flex-direction:column;gap:4px;color:#FFF4E6;animation:mg-monte .5s .9s ease-out both;}
.mg-quoi b{font-family:var(--font-clikme),sans-serif;font-size:21px;line-height:1.2;}
.mg-quoi span{font-size:15px;color:#FFE2C2;}
.mg-go{width:100%;height:56px;border:0;border-radius:999px;background:#fff;color:#C8136F;font-weight:900;font-size:17px;
  box-shadow:0 14px 34px -12px rgba(0,0,0,.6);animation:mg-monte .5s 1.05s ease-out both;}
.mg-plus{border:0;background:none;color:#FFF4E6;font-weight:800;font-size:15px;text-decoration:underline;text-underline-offset:4px;
  padding:8px;animation:mg-monte .5s 1.15s ease-out both;}
@keyframes mg-monte{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;}}
.mg-gain{position:absolute;left:0;right:0;top:12px;height:0;pointer-events:none;}
.mg-gain b{position:absolute;left:50%;top:0;transform:translateX(-50%);font-family:var(--font-clikme),sans-serif;font-size:26px;font-weight:900;
  color:#7CF0A2;text-shadow:0 2px 14px rgba(124,240,162,.6);animation:mg-gagne 1.6s ease-out both;}
.mg-gain i{position:absolute;top:10px;font-style:normal;font-size:20px;animation:mg-piece 1.2s ease-out both;}
@keyframes mg-gagne{0%{opacity:0;transform:translate(-50%,10px) scale(.6);}20%{opacity:1;transform:translate(-50%,-8px) scale(1.15);}
  100%{opacity:0;transform:translate(-50%,-34px) scale(1);}}
@keyframes mg-piece{0%{opacity:0;transform:translateY(16px) rotate(0);}25%{opacity:1;}100%{opacity:0;transform:translateY(-60px) rotate(260deg);}}
@media (prefers-reduced-motion: reduce){
  .mg-fete,.mg-titre span,.mg-g,.mg-d,.mg-lien-coeur,.mg-quoi,.mg-go,.mg-plus{animation:none !important;opacity:1;}
  .mg-onde,.mg-gain{display:none;}
}
`,
      }}
    />
  );
}
