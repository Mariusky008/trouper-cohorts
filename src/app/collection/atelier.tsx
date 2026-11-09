"use client";

/**
 * 🛠️ L'ATELIER DE PABLITO — 9 novembre 2026, le propriétaire : « lorsqu'on appuie sur une émotion, une expression… qui
 * n'est pas encore faite, une pop-up pour dire : en cours de fabrication, et une fois faite elle sera à vous pour
 * toujours. Elle doit être vraiment marrante et sympa à regarder : c'est un peu long, il faut arriver à les faire
 * patienter avec le sourire. »
 *
 * TROIS MOMENTS, une seule fenêtre :
 *   · À L'ATELIER : Pablito s'entraîne à faire sa tête (il passe d'une grimace à l'autre), ses outils tournent autour de
 *     lui, ce qu'il fait s'écrit une phrase après l'autre, une barre avance (environ une minute). On peut le chatouiller :
 *     il rit, et il râle. « Une fois faite, elle est à toi pour toujours. » « Je fais autre chose en attendant » la ferme :
 *     la fabrication continue, et sa tête s'affichera toute seule (`ma-figurine.tsx`).
 *   · TADAAA : sa nouvelle tête, la sienne, qui saute dans la fenêtre, des confettis, le tampon « À toi pour toujours ».
 *   · UN PÉPIN : Pablito tout triste, et ce que le serveur a dit.
 *
 * Sans voix : Pablito ne parle qu'avec ses enregistrements, et il n'y en a pas pour l'atelier. Le mouvement suffit.
 *
 * FICHIER NAVIGATEUR.
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { imageVisage } from "@/lib/direct/guide";
import { estAttitude, sentimentDe, type Sentiment } from "@/lib/direct/ma-figurine";
import { Guide, type Visage } from "./guide";

/**
 * Ce que Pablito fabrique, depuis quand (une fenêtre rouverte reprend sa barre où elle en était), quand la fenêtre s'est
 * ouverte (sa barre part de là, sans repasser par zéro), et son pépin.
 */
export type Atelier = { quoi: Sentiment; debut: number; ouvert: number; erreur?: string };

/** Ce qu'il fait, une phrase toutes les quatre secondes et demie : un premier tour, dans l'ordre… */
const PHRASES = [
  "Je sors la pâte à modeler…",
  "Je m’entraîne à faire ta tête devant le miroir 🪞",
  "Je sculpte, je gratte, je lisse…",
  "Un petit coup de pinceau sur les joues 🎨",
  "Je vérifie que c’est bien toi… Oui, c’est bien toi.",
  "Je resserre le ressort, pour que ça rebondisse.",
  "Pause café de l’artiste ☕ Deux secondes, promis.",
  "Le vernis sèche… Souffle dessus si tu veux 💨",
  "Dernières retouches : on y est presque !",
];
/** … puis, si c'est plus long, celles-ci, en boucle. */
const ENCORE = ["Ça arrive, ça arrive… 🥁", "L’artiste peaufine : il est perfectionniste.", "Encore un petit coup de chiffon…", "On y est presque, promis juré !"];
/** Quand on le chatouille. */
const CHATOUILLES = [
  "Hé ! Ça chatouille !",
  "Arrête, je vais rater ton sourcil !",
  "Hihi… Non. Concentration.",
  "Encore une fois et je te dessine une moustache.",
  "Tu la veux réussie, oui ou non ? 😤",
  "D’accord, d’accord : je me remets au travail !",
];
/** Les têtes qu'il essaie en travaillant. */
const ESSAIS: readonly Visage[] = ["grimace", "louche", "euphorie", "colere", "rire", "amour", "tristesse", "joie"];
const PAR_PHRASE = 4500;
const PAR_TETE = 1700;
/** La barre : vite au début, puis de plus en plus lentement — elle ne touche le bout que quand c'est prêt. */
const avance = (ms: number) => 0.95 * (1 - Math.exp(-ms / 35_000));
/** Les confettis : chacun sa direction, sa distance, sa couleur (fixés une fois pour toutes). */
const CONFETTIS = Array.from({ length: 28 }, (_, i) => ({
  a: Math.round((i * 360) / 28 + ((i * 47) % 13)),
  d: 90 + ((i * 37) % 70),
  c: ["#FF2E9A", "#F2C46B", "#7CE0C3", "#FF7A59", "#B892FF"][i % 5],
  r: (i * 53) % 360,
  t: ((i * 7) % 10) * 0.025,
}));

export function AtelierPablito({ atelier, image, onFermer }: { atelier: Atelier; image?: string; onFermer: () => void }) {
  const s = sentimentDe(atelier.quoi);
  const nom = `« ${s?.court ?? ""} »`;
  const quoi = estAttitude(atelier.quoi) ? `ton attitude ${nom}` : `ta tête ${nom}`;
  const Quoi = quoi.charAt(0).toUpperCase() + quoi.slice(1);
  const phase: "atelier" | "prete" | "pepin" = image ? "prete" : atelier.erreur ? "pepin" : "atelier";
  const [maintenant, setMaintenant] = useState(atelier.ouvert);
  const [chatouille, setChatouille] = useState({ n: 0, jusqua: 0 });
  const bouton = useRef<HTMLButtonElement>(null);

  // (l'horloge de la fenêtre : la barre, les phrases, ses têtes)
  useEffect(() => {
    if (phase !== "atelier") return;
    const h = window.setInterval(() => setMaintenant(Date.now()), 250);
    return () => window.clearInterval(h);
  }, [phase]);
  // (Échap ferme ; le bouton du moment prend la main)
  useEffect(() => {
    bouton.current?.focus({ preventScroll: true });
    const echap = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [phase, onFermer]);
  // (ses têtes, chargées d'avance : pas de blanc quand il en change)
  useEffect(() => {
    for (const v of [...ESSAIS, "neutre", "euphorie"] as Visage[])
      for (const b of ["n", "p"] as const) {
        const i = new Image();
        i.src = imageVisage(v, b);
      }
  }, []);

  const passe = Math.max(0, maintenant - atelier.debut);
  const chatouille_ = maintenant < chatouille.jusqua;
  const visage: Visage = phase === "pepin" ? "tristesse" : phase === "prete" ? "euphorie" : chatouille_ ? "rire" : ESSAIS[Math.floor(passe / PAR_TETE) % ESSAIS.length];
  const tour = Math.floor(passe / PAR_PHRASE);
  const phrase = tour < PHRASES.length ? PHRASES[tour] : ENCORE[(tour - PHRASES.length) % ENCORE.length];
  const pour100 = Math.round((phase === "prete" ? 1 : avance(passe)) * 100);

  function chatouiller() {
    setChatouille((c) => ({ n: c.n + 1, jusqua: Date.now() + 1800 }));
    setMaintenant(Date.now());
  }

  return createPortal(
    <div className="atl-voile">
      <style>{STYLES_ATELIER}</style>
      <div className="atl-fond" onClick={onFermer} />
      <div className={`atl atl-${phase}`} role="dialog" aria-modal="true" aria-labelledby="atl-titre">
        {phase === "atelier" && (
          <>
            <span className="atl-kicker">🛠️ À l’atelier</span>
            <b id="atl-titre">Pablito fabrique {quoi}</b>
            <button type="button" className={`atl-pablito${chatouille_ ? " rit" : ""}`} onClick={chatouiller} aria-label="Chatouiller Pablito">
              <span className="atl-outils" aria-hidden="true">
                <i>🔨</i>
                <i>🎨</i>
                <i>✏️</i>
                <i>🪄</i>
              </span>
              <span className="atl-etincelles" aria-hidden="true">
                <i>✨</i>
                <i>✨</i>
                <i>✨</i>
              </span>
              <Guide visage={visage} parle={!chatouille_} className="atl-tete" />
              {chatouille_ && <span className="atl-bulle">{CHATOUILLES[(chatouille.n - 1) % CHATOUILLES.length]}</span>}
            </button>
            {chatouille.n === 0 && <small className="atl-psst">Psst… touche-le, pendant qu’il travaille 😏</small>}
            <p className="atl-phrase" key={phrase} aria-live="polite">
              {phrase}
            </p>
            <span className="atl-barre" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pour100} aria-label="Fabrication">
              <i style={{ width: `${pour100}%` }} />
            </span>
            <small className="atl-temps">Environ une minute</small>
            <p className="atl-toujours">
              <span aria-hidden="true">💝</span> Une fois faite, elle est à toi <b>pour toujours</b> : plus jamais d’attente pour celle-là.
            </p>
            <button type="button" className="atl-non" ref={bouton} onClick={onFermer}>
              Je fais autre chose en attendant
            </button>
            <small className="atl-seule">Elle s’affichera toute seule.</small>
          </>
        )}
        {phase === "prete" && (
          <>
            <span className="atl-confettis" aria-hidden="true">
              {CONFETTIS.map((c, i) => (
                <i key={i} style={{ "--a": `${c.a}deg`, "--d": `${c.d}px`, "--r": `${c.r}deg`, background: c.c, animationDelay: `${c.t}s` } as React.CSSProperties} />
              ))}
            </span>
            <span className="atl-kicker">✨ Tadaaa !</span>
            <b id="atl-titre">{Quoi} est prête !</b>
            <span className="atl-nouvelle">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={`Ta figurine : ${s?.nom ?? ""}`} />
              <span className="atl-tampon">À toi pour toujours</span>
            </span>
            <button type="button" className="atl-oui" ref={bouton} onClick={onFermer}>
              {s?.emoji} Je l’essaie !
            </button>
          </>
        )}
        {phase === "pepin" && (
          <>
            <Guide visage={visage} className="atl-tete atl-triste" fixe />
            <b id="atl-titre">Oups, petit pépin à l’atelier</b>
            <p className="atl-phrase">{atelier.erreur}</p>
            <button type="button" className="atl-oui" ref={bouton} onClick={onFermer}>
              D’accord
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

const STYLES_ATELIER = `
.atl-voile{position:fixed;inset:0;z-index:950;display:flex;align-items:flex-end;justify-content:center;padding:0 12px calc(14px + env(safe-area-inset-bottom));box-sizing:border-box;font-family:var(--font-clikme),Poppins,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.atl-fond{position:absolute;inset:0;background:rgba(8,2,6,.7);touch-action:none;animation:atl-fond .2s ease-out}
.atl{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;max-width:420px;max-height:calc(100dvh - 28px);overflow:hidden auto;box-sizing:border-box;padding:20px 18px 14px;border-radius:28px;text-align:center;color:#FFF4E6;background:radial-gradient(120% 60% at 50% 0%,rgba(255,46,154,.26),transparent 65%),radial-gradient(80% 50% at 50% 100%,rgba(242,196,107,.12),transparent 70%),linear-gradient(180deg,#2C1024,#1A0815);box-shadow:0 30px 70px -20px rgba(0,0,0,.95),inset 0 1px 0 rgba(255,200,230,.2),0 0 0 1px rgba(255,255,255,.08);animation:atl-monte .32s cubic-bezier(.2,1.3,.4,1)}
.atl-kicker{font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#F2C46B}
.atl b#atl-titre{font-size:19px;font-weight:900;line-height:1.25;letter-spacing:-.01em;max-width:340px}
.atl-pablito{position:relative;display:grid;place-items:center;width:150px;height:150px;margin:6px 0 2px;padding:0;border:0;border-radius:50%;background:radial-gradient(circle at 50% 45%,rgba(255,46,154,.28),rgba(255,46,154,0) 68%);cursor:pointer;-webkit-tap-highlight-color:transparent}
.atl-pablito:focus-visible{outline:2px solid #F2C46B;outline-offset:4px}
.atl .atl-tete{width:100px;animation:atl-bosse 1.7s ease-in-out infinite}
.atl .atl-tete .mq-cadre{border-radius:30px}
.atl-pablito.rit .atl-tete{animation:atl-rit .3s ease-in-out infinite}
.atl-outils{position:absolute;inset:0;animation:atl-tourne 7s linear infinite}
.atl-outils i{position:absolute;font-style:normal;font-size:22px;filter:drop-shadow(0 4px 6px rgba(0,0,0,.5))}
.atl-outils i:nth-child(1){top:-2px;left:50%;transform:translateX(-50%)}
.atl-outils i:nth-child(2){top:50%;right:-4px;transform:translateY(-50%)}
.atl-outils i:nth-child(3){bottom:-2px;left:50%;transform:translateX(-50%)}
.atl-outils i:nth-child(4){top:50%;left:-4px;transform:translateY(-50%)}
.atl-etincelles i{position:absolute;font-style:normal;font-size:14px;opacity:0;animation:atl-brille 2.4s ease-in-out infinite}
.atl-etincelles i:nth-child(1){top:18px;right:22px}
.atl-etincelles i:nth-child(2){bottom:26px;left:16px;animation-delay:.8s}
.atl-etincelles i:nth-child(3){top:30px;left:26px;animation-delay:1.6s}
.atl-bulle{position:absolute;top:-8px;left:50%;z-index:2;transform:translateX(-50%);width:max-content;max-width:230px;padding:7px 12px;border-radius:16px;background:#FFF4E6;color:#2A0F1F;font-size:12.5px;font-weight:800;line-height:1.25;box-shadow:0 10px 20px -8px rgba(0,0,0,.6);animation:atl-pop .25s cubic-bezier(.2,1.6,.4,1)}
.atl-bulle::after{content:"";position:absolute;bottom:-6px;left:50%;transform:translateX(-50%) rotate(45deg);width:12px;height:12px;background:#FFF4E6;border-radius:2px}
.atl-psst{font-size:11.5px;color:#B79AA6;font-weight:700}
.atl-phrase{margin:4px 0 0;min-height:2.6em;max-width:330px;font-size:15px;font-weight:800;line-height:1.35;color:#FFF4E6;animation:atl-phrase .45s ease-out}
.atl-barre{position:relative;display:block;width:100%;max-width:320px;height:12px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.5)}
.atl-barre i{position:absolute;inset:0 auto 0 0;border-radius:inherit;background:repeating-linear-gradient(-45deg,#FF2E9A 0 10px,#FF6FB8 10px 20px);background-size:28px 28px;transition:width .4s ease-out;animation:atl-rayures .8s linear infinite;box-shadow:0 0 14px rgba(255,46,154,.6)}
.atl-temps{font-size:11.5px;font-weight:700;color:#B79AA6}
.atl-toujours{margin:6px 0 2px;max-width:330px;padding:10px 12px;border-radius:16px;background:rgba(242,196,107,.1);border:1px solid rgba(242,196,107,.25);font-size:13px;line-height:1.4;color:#F5E2B8}
.atl-toujours b{color:#F2C46B}
.atl-non,.atl-oui{width:100%;max-width:340px;margin-top:4px;padding:14px 12px;border-radius:999px;font:inherit;font-size:15px;font-weight:900;cursor:pointer;-webkit-tap-highlight-color:transparent}
.atl-non{border:1.5px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#FFF4E6}
.atl-oui{border:0;background:linear-gradient(135deg,#FF2E9A,#FF7A59);color:#fff;box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}
.atl-non:focus-visible,.atl-oui:focus-visible{outline:2px solid #F2C46B;outline-offset:2px}
.atl-seule{font-size:11px;color:#9C7F8B}
.atl-prete b#atl-titre{font-size:21px}
.atl-confettis{position:absolute;top:120px;left:50%;width:0;height:0;pointer-events:none;z-index:3}
.atl-confettis i{position:absolute;width:8px;height:12px;border-radius:2px;opacity:0;animation:atl-confetti 1.3s cubic-bezier(.15,.8,.3,1) forwards}
.atl-nouvelle{position:relative;display:block;width:190px;height:240px;margin:4px 0 6px;border-radius:24px;background:radial-gradient(circle at 50% 40%,rgba(255,46,154,.35),rgba(255,46,154,.05) 70%);box-shadow:0 0 0 2px rgba(242,196,107,.5),0 0 40px rgba(255,46,154,.45);animation:atl-saute .7s cubic-bezier(.2,1.5,.35,1) both}
.atl-nouvelle img{width:100%;height:100%;object-fit:contain;border-radius:inherit}
.atl-tampon{position:absolute;right:-14px;bottom:14px;padding:6px 10px;border-radius:10px;border:2.5px solid #F2C46B;background:rgba(26,8,21,.85);color:#F2C46B;font-size:11.5px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;transform:rotate(-10deg);animation:atl-tampon .45s .55s cubic-bezier(.2,1.6,.4,1) both}
.atl-pepin .atl-tete{animation:none;margin:6px 0}
@keyframes atl-monte{from{transform:translateY(40px) scale(.96);opacity:0}}
@keyframes atl-fond{from{opacity:0}}
@keyframes atl-bosse{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-6px) rotate(3deg)}}
@keyframes atl-rit{0%,100%{transform:translateY(0) rotate(-7deg) scale(1.04)}50%{transform:translateY(-5px) rotate(7deg) scale(1.08)}}
@keyframes atl-tourne{to{transform:rotate(360deg)}}
@keyframes atl-brille{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.15)}}
@keyframes atl-pop{from{transform:translateX(-50%) scale(.5);opacity:0}}
@keyframes atl-phrase{from{transform:translateY(8px);opacity:0}}
@keyframes atl-rayures{to{background-position:28px 0}}
@keyframes atl-saute{0%{transform:scale(.2) rotate(-12deg);opacity:0}60%{transform:scale(1.08) rotate(3deg);opacity:1}100%{transform:scale(1) rotate(0)}}
@keyframes atl-tampon{from{transform:rotate(-30deg) scale(2.2);opacity:0}}
@keyframes atl-confetti{0%{opacity:1;transform:rotate(var(--a)) translateY(0) rotate(0)}100%{opacity:0;transform:rotate(var(--a)) translateY(calc(-1 * var(--d))) rotate(var(--r))}}
@media (prefers-reduced-motion:reduce){.atl,.atl-fond,.atl .atl-tete,.atl-outils,.atl-etincelles i,.atl-barre i,.atl-nouvelle,.atl-tampon,.atl-phrase,.atl-confettis{animation:none}.atl-confettis{display:none}.atl-etincelles i{opacity:.8}}
`;
