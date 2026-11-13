"use client";

/**
 * 👋 LA BIENVENUE DE CLIKME, REFAITE POUR L'UNIVERS — 13 novembre 2026, le propriétaire : « le concept a beaucoup évolué
 * vers un ClikMe, c'est un peu comme WhatsApp, mais ça crée des univers communs entre les gens qui se parlent ! C'est-à-
 * dire ? Eh bien, chaque personne a sa figurine qui, au fil des conversations, range les souvenirs, les rappels, les
 * infos… OK, et quoi d'autre ? Au fil des conversations, elle crée un univers qui s'agrandit et te définit mieux que tu
 * ne pourrais l'imaginer, avec des endroits secrets et des portes à ta personnalité… Le premier tuto doit retranscrire
 * cette idée, pour expliquer à quoi s'attendre. » Puis : « que je sois debout, que je prenne tout l'écran, et que
 * ma bouche parle en même temps que le texte » : chaque bulle s'écrit au rythme de sa voix. La maquette (« Le premier tuto de ClikMe ») et les six bulles sont
 * validées le même jour ; leur voix, enregistrée par lui (`tuto-bienvenue-1`, puis `tuto-univers-2` à `-6`).
 *
 * À la toute première arrivée (pas encore de figurine), une seule fois sur ce téléphone (`clikme-tuto-bienvenue`, comme
 * avant) : une conversation avec Pablito, présentée comme sur WhatsApp — on touche sa question (« C'est quoi, ClikMe ? »,
 * « C'est-à-dire ? »…), il répond. Au-dessus, un univers grandit à chaque réponse :
 *   1. Pablito, debout et en grand, salue — sa bouche bouge pendant qu'il parle (la scène prend presque tout l'écran) ;
 *   2. deux figurines se parlent (« On se fait un ciné jeudi ? ») : leur univers commun apparaît entre elles ;
 *   3. l'étagère : un souvenir déjà là, puis un rappel et une info qui s'envolent de la conversation pour s'y poser ;
 *   4. l'univers s'agrandit : ta chanson, tes films, tes photos, l'étagère, un endroit secret, ta porte — « Qui peut
 *      entrer » passe par ses quatre réglages ;
 *   5. Léa frappe à ta porte, et un nouvel endroit apparaît ;
 *   6. le chemin : ton selfie, ta figurine, 5 minutes avec Pablito, ton univers ; puis « 📸 Je crée ma figurine ».
 * « Passer » (en haut) et « Plus tard » (à la fin) la ferment ; ensuite, le logo ouvre la visite (`tuto.tsx`).
 * Toi et Léa sont de petits personnages dessinés : le nouveau venu n'a pas encore sa figurine.
 */
import { useEffect, useRef, useState } from "react";
import { SONS_PABLITO, imagePablitoDebout } from "@/lib/direct/guide";
import { Guide, debloquerLaVoix, useVoixBulle, type Visage } from "./guide";

/**
 * Les bulles de Pablito (son visage, son enregistrement et sa durée, en secondes : la bulle s'écrit au rythme de sa voix),
 * et ce qu'on lui répond — la dernière : « Je crée ma figurine ».
 */
export const BIENVENUE: { t: string; v: Visage; son: string; duree: number; toi?: string }[] = [
  { t: "Salut ! Moi, c’est Pablito, le patron de ClikMe. Bienvenue !", v: "joie", son: "tuto-bienvenue-1", duree: 4.05, toi: "C’est quoi, ClikMe ?" },
  { t: "ClikMe, c’est un peu comme WhatsApp : tu parles avec tes proches. Mais ici, vos conversations créent un univers commun entre vous.", v: "euphorie", son: "tuto-univers-2", duree: 6.69, toi: "C’est-à-dire ?" },
  { t: "Chaque personne a sa figurine, faite à partir de son selfie. Au fil de vos conversations, elle range tout : les souvenirs, les rappels, les infos.", v: "joie", son: "tuto-univers-3", duree: 8.67, toi: "Et quoi d’autre ?" },
  { t: "Ton univers s’agrandit à chaque conversation. De nouveaux endroits apparaissent, certains secrets, avec des portes que tu n’ouvres qu’à qui tu veux.", v: "euphorie", son: "tuto-univers-4", duree: 7.71, toi: "Et ensuite ?" },
  { t: "Petit à petit, il te définit mieux que tu ne pourrais l’imaginer. Tes proches peuvent le visiter… et toi, visiter les leurs.", v: "joie", son: "tuto-univers-5", duree: 7.63, toi: "Ça commence comment ?" },
  { t: "Par toi ! Un selfie pour ta figurine, puis on discute cinq minutes, et je dessine les premiers endroits de ton univers.", v: "joie", son: "tuto-univers-6", duree: 6.11 },
];
/** Qui peut entrer : les quatre réglages de la porte, l'un après l'autre. */
const ACCES = ["🌍 Tout le monde", "💞 Mes proches", "✋ Sur demande", "🔒 Rien que moi"];

const mouvementReduit = () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
const heureDuTelephone = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/** Un petit personnage dessiné (grosse tête, petit corps) : toi, ou Léa. */
function Perso({ qui }: { qui: "toi" | "lea" }) {
  const toi = qui === "toi";
  return (
    <span className={`bv-perso ${qui}`}>
      <svg viewBox="0 0 64 86" aria-hidden="true">
        <rect x="22" y="52" width="20" height="22" rx="8" fill={toi ? "#FF2E9A" : "#F2C46B"} />
        <rect x="23" y="72" width="7" height="10" rx="3" fill="#3A1230" />
        <rect x="34" y="72" width="7" height="10" rx="3" fill="#3A1230" />
        <circle cx="32" cy="30" r="25" fill={toi ? "#F2C9A5" : "#C98C64"} />
        {toi ? <path d="M8 26c2-16 14-22 25-21 12 1 22 8 23 21-6-6-14-9-24-9S14 20 8 26z" fill="#4A2A1A" /> : <path d="M7 34C5 14 18 4 32 5s27 10 25 29c-3-9-8-14-14-16-6 5-17 7-28 6-3 3-6 6-8 10z" fill="#1E120C" />}
        <circle cx="23" cy={toi ? 32 : 33} r="3" fill="#22091B" />
        <circle cx="41" cy={toi ? 32 : 33} r="3" fill="#22091B" />
        <path d={toi ? "M24 41q8 7 16 0" : "M25 42q7 6 14 0"} stroke="#22091B" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </svg>
      <small>{toi ? "Toi" : "Léa"}</small>
    </span>
  );
}

/**
 * 🧍 PABLITO DEBOUT, EN GRAND (13 novembre 2026, le propriétaire : « que je sois debout, que je prenne tout l'écran, au
 * lieu d'un petit carré où je suis assis, et que ma bouche parle en même temps que le texte ») : sa figurine debout,
 * bouche fermée et bouche ouverte, l'une sur l'autre ; tant qu'il parle, la bouche s'ouvre et se ferme.
 */
function PablitoDebout({ parle }: { parle: boolean }) {
  return (
    <span className={`bv-debout${parle ? " parle" : ""}`}>
      <span className="bv-debout-corps">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bv-debout-n" src={imagePablitoDebout("n")} alt="" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bv-debout-p" src={imagePablitoDebout("p")} alt="" draggable={false} />
      </span>
      <span className="bv-salut">👋</span>
    </span>
  );
}

/** 🌍 L'univers qui grandit, au-dessus de la conversation (ce qu'il montre suit la bulle : les classes `d1` à `d6`). */
function Scene({ i, parle, acces }: { i: number; parle: boolean; acces: number }) {
  return (
    <div className="bv-scene" aria-hidden="true">
      <span className="bv-etoiles" />
      <span className="bv-projecteur" />
      <PablitoDebout parle={i === 0 && parle} />

      <span className="bv-ile">
        <span className="bv-roche" />
        <span className="bv-sol" />
        <span className="bv-lueur" />
        <span className="bv-ile-nom">votre univers</span>
        <span className="bv-lieu l-etagere"><b>📚</b><small>L’étagère</small></span>
        <span className="bv-lieu l-chanson"><b>🎵</b><small>Ta chanson</small></span>
        <span className="bv-lieu l-films"><b>🎞️</b><small>Tes films cultes</small></span>
        <span className="bv-lieu l-photos"><b>🖼️</b><small>Tes photos</small></span>
        <span className="bv-lieu l-porte"><b>🚪</b><small>Ta porte</small></span>
        <span className="bv-lieu l-secret"><b>❔</b><small>Un endroit secret</small></span>
        <span className="bv-lieu l-concert"><b>🎸</b><small>Le coin des concerts</small><span className="bv-nouveau">nouveau</span></span>
      </span>

      <Perso qui="toi" />
      <Perso qui="lea" />
      <span className="bv-dit toi">On se fait un ciné jeudi ?</span>
      <span className="bv-dit lea">Carrément ! Et après, pizza à la gare 🍕</span>

      <span className="bv-etagere">
        <span className="bv-objets"><span className="bv-obj">📸</span><span className="bv-obj vole v1">🎬</span><span className="bv-obj vole v2">🍕</span></span>
        <span className="bv-planche" />
        <span className="bv-etiquettes">
          <span><i>Souvenir</i>Nice, l’été dernier</span>
          <span className="e1"><i>Rappel</i>Jeudi : ciné</span>
          <span className="e2"><i>Info</i>Léa adore la pizzeria de la gare</span>
        </span>
      </span>

      <span className="bv-acces">
        <small>Qui peut entrer</small>
        <span key={acces}>{ACCES[acces]}</span>
      </span>
      <span className="bv-toc">🚪 Léa frappe à ta porte</span>

      <span className="bv-chemin">
        <span className="bv-etape toi"><b>📸</b><small>Ton selfie</small></span>
        <span className="bv-fleche">›</span>
        <span className="bv-etape"><b>🧸</b><small>Ta figurine</small></span>
        <span className="bv-fleche">›</span>
        <span className="bv-etape"><b>💬</b><small>5 minutes avec Pablito</small></span>
        <span className="bv-fleche">›</span>
        <span className="bv-etape"><b>🌍</b><small>Ton univers</small></span>
      </span>
    </div>
  );
}

/** 👋 LA BIENVENUE, à la toute première arrivée : la conversation avec Pablito, l'univers qui grandit, « Je crée ma figurine ». */
export function BienvenueTuto({ onFini, onCreer }: { onFini: () => void; onCreer: () => void }) {
  const [reduit] = useState(mouvementReduit);
  // la bulle en cours ; « Pablito écrit… » (les trois points) avant elle ; ses lettres déjà écrites
  const [i, setI] = useState(0);
  const [ecrit, setEcrit] = useState(() => !mouvementReduit());
  const [n, setN] = useState(0);
  const [acces, setAcces] = useState(0);
  const [heure] = useState(heureDuTelephone);
  const fil = useRef<HTMLDivElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  const b = BIENVENUE[i];
  const derniere = i === BIENVENUE.length - 1;
  const vu = reduit ? b.t.length : n;
  // (au rythme de sa voix : deux lettres à la fois, la bulle finit avec elle ; sans enregistrement, vite)
  const rythme = SONS_PABLITO[b.son] ? Math.min(140, Math.max(22, (b.duree * 1000 * 0.92) / Math.ceil(b.t.length / 2))) : 22;
  const tape = !ecrit && vu < b.t.length;
  const dit = !ecrit && !tape;
  // sa voix part avec sa bulle (les enregistrements du patron ; une bulle sans enregistrement s'écrirait sans voix)
  const voix = useVoixBulle(ecrit ? undefined : SONS_PABLITO[b.son]);

  // « Pablito écrit… », puis sa bulle
  useEffect(() => {
    if (!ecrit) return;
    const t = window.setTimeout(() => setEcrit(false), 750);
    return () => window.clearTimeout(t);
  }, [ecrit, i]);
  // la bulle se tape, deux lettres à la fois
  useEffect(() => {
    if (ecrit || reduit || n >= b.t.length) return;
    const t = window.setTimeout(() => setN((x) => Math.min(b.t.length, x + 2)), rythme);
    return () => window.clearTimeout(t);
  }, [ecrit, n, b.t.length, reduit, rythme]);
  // la porte : qui peut entrer, ses quatre réglages l'un après l'autre (pendant la bulle 4)
  useEffect(() => {
    if (i !== 3) return;
    const t = window.setInterval(() => setAcces((a) => (a + 1) % ACCES.length), 1500);
    return () => window.clearInterval(t);
  }, [i]);
  // la conversation reste en bas ; sa réponse prend la main
  useEffect(() => {
    const f = fil.current;
    if (f) f.scrollTop = f.scrollHeight;
  }, [i, vu, ecrit, dit]);
  useEffect(() => {
    if (dit) bouton.current?.focus({ preventScroll: true });
  }, [dit, i]);
  // « Échap » : passer
  const fini = useRef(onFini);
  useEffect(() => {
    fini.current = onFini;
  });
  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === "Escape" && fini.current();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, []);

  const repondre = () => {
    // (pendant ce toucher : sa voix débloquée, pour la bulle qui arrive)
    debloquerLaVoix();
    setI((x) => Math.min(BIENVENUE.length - 1, x + 1));
    setN(0);
    setEcrit(!reduit);
  };
  // (un toucher sur la conversation : la bulle s'écrit d'un coup ; sa voix, si le téléphone l'a bloquée)
  const toucherFil = () => {
    if (voix.bloque) return voix.rejouer();
    if (tape) setN(b.t.length);
  };

  const etapes = Array.from({ length: i + 1 }, (_, k) => `d${k + 1}`).join(" ");
  return (
    <div className={`tu bv ${etapes}`} role="dialog" aria-modal="true" aria-label="Pablito te présente ClikMe" data-rang={i + 1} data-dit={dit ? "oui" : "non"}>
      <div className="bv-app">
        <header className="bv-haut">
          <span className="bv-logo" aria-hidden="true">
            Clik<b>Me</b>
          </span>
          <span className="bv-points" aria-hidden="true">
            {BIENVENUE.map((_, k) => (
              <i key={k} className={k < i ? "fait" : k === i ? "la" : undefined} />
            ))}
          </span>
          {!derniere && (
            <button type="button" className="tu-passer" onClick={onFini}>
              Passer
            </button>
          )}
        </header>

        <Scene i={i} parle={tape || voix.parle} acces={acces} />

        <div className="bv-fil" ref={fil} aria-live="polite" aria-label="Ta conversation avec Pablito" onClick={toucherFil}>
          <span className="bv-jour">Aujourd’hui</span>
          {BIENVENUE.slice(0, i + 1).map((x, k) => {
            const enCours = k === i;
            return (
              <div key={k} className="bv-msgs">
                <div className="bv-msg pablito">
                  <span className="bv-tete">
                    <Guide visage={x.v} parle={enCours && (tape || voix.parle)} />
                  </span>
                  <div className="bv-bulle">
                    {k === 0 && <span className="bv-qui">Pablito</span>}
                    {enCours && ecrit ? (
                      <span className="bv-ecrit" aria-label="Pablito écrit">
                        <i />
                        <i />
                        <i />
                      </span>
                    ) : (
                      <>
                        <span className="bv-texte">{enCours ? x.t.slice(0, vu) : x.t}</span>
                        {enCours && tape && <i className="bv-curseur" aria-hidden="true" />}
                        {(!enCours || dit) && <span className="bv-heure">{heure}</span>}
                        {enCours && voix.bloque && (
                          <button type="button" className="tu-ecouter" onClick={voix.rejouer}>
                            🔊 Touche pour l’entendre
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {k < i && x.toi && (
                  <div className="bv-msg moi">
                    <div className="bv-bulle">
                      {x.toi}
                      <span className="bv-heure">
                        {heure}
                        <span className="bv-lu">✓✓</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <footer className="bv-reponses">
          {dit &&
            (b.toi ? (
              <span className="bv-choix">
                <button type="button" className="bv-repondre" ref={bouton} onClick={repondre}>
                  {b.toi}
                </button>
              </span>
            ) : (
              <span className="bv-choix bv-fin">
                <button type="button" className="tu-creer" ref={bouton} onClick={onCreer}>
                  📸 Je crée ma figurine
                </button>
                <button type="button" className="bv-plus-tard" onClick={onFini}>
                  Plus tard
                </button>
                <span className="bv-indice">
                  Une question ? Touche le logo <b>ClikMe</b>, en haut, quand tu veux.
                </span>
              </span>
            ))}
        </footer>
      </div>
    </div>
  );
}

export const STYLES_BIENVENUE = `
.tu.bv{display:flex;justify-content:center;background:#12040E;color:#FFF4E6;cursor:default}
.bv-app{position:relative;display:flex;flex-direction:column;width:100%;max-width:440px;height:100%;background:linear-gradient(180deg,#22091B 0%,#12040E 100%);overflow:hidden}
.bv button{font-family:inherit;line-height:inherit;-webkit-tap-highlight-color:transparent}
.bv button:focus-visible{outline:2px solid #FFF4E6;outline-offset:2px}
/* le haut : le logo, où on en est, « Passer » */
.bv-haut{position:relative;z-index:5;display:flex;align-items:center;gap:12px;min-height:52px;padding:calc(6px + env(safe-area-inset-top)) 16px 6px}
.bv-logo{font-weight:900;font-size:19px;letter-spacing:-.02em}
.bv-logo b{color:#FF2E9A}
.bv-points{display:flex;flex:1;justify-content:center;gap:5px}
.bv-points i{width:7px;height:7px;border-radius:999px;background:rgba(255,255,255,.16);transition:width .3s,background .3s}
.bv-points i.fait{background:#FF8FCB}
.bv-points i.la{width:20px;background:#FF2E9A}
.bv-haut .tu-passer{margin-left:auto}

/* 🌍 la scène : l'univers qui grandit */
.bv-scene{position:relative;flex:0 0 44%;min-height:240px;overflow:hidden;
  background:radial-gradient(120% 80% at 50% 100%,rgba(255,46,154,.22),transparent 60%),radial-gradient(90% 60% at 50% 0%,#2C0C25,transparent 70%)}
.bv-scene > *{position:absolute}
.bv-etoiles{inset:0;opacity:.75;animation:bv-scintille 4s ease-in-out infinite alternate;
  background-image:radial-gradient(1.4px 1.4px at 12% 18%,#fff,transparent),radial-gradient(1px 1px at 28% 42%,#ffd9ee,transparent),radial-gradient(1.6px 1.6px at 46% 12%,#fff,transparent),radial-gradient(1px 1px at 63% 30%,#fff,transparent),radial-gradient(1.3px 1.3px at 81% 16%,#ffe7b8,transparent),radial-gradient(1px 1px at 90% 44%,#fff,transparent),radial-gradient(1.2px 1.2px at 8% 60%,#fff,transparent),radial-gradient(1px 1px at 72% 58%,#ffd9ee,transparent),radial-gradient(1.5px 1.5px at 37% 70%,#fff,transparent)}
/* 1 · Pablito debout, en grand, salue ; la scène prend presque tout l'écran */
.bv-app .bv-scene{transition:flex-basis .7s cubic-bezier(.3,.9,.3,1)}
.bv:not(.d2) .bv-scene{flex-basis:62%}
.bv-projecteur{left:50%;bottom:-6%;width:120%;height:90%;transform:translateX(-50%);background:radial-gradient(50% 55% at 50% 70%,rgba(255,196,140,.32),rgba(255,46,154,.14) 55%,transparent 75%);transition:opacity .5s}
.bv.d2 .bv-projecteur{opacity:0}
.bv-debout{left:50%;bottom:2%;height:94%;aspect-ratio:2/3;max-width:92%;transform:translateX(-50%);transform-origin:50% 100%;transition:opacity .5s,transform .7s cubic-bezier(.2,1.2,.4,1)}
.bv-debout::after{content:"";position:absolute;left:22%;right:22%;bottom:-1%;height:5%;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.55),transparent);z-index:-1}
.bv-debout-corps{position:absolute;inset:0;transform-origin:50% 100%;animation:bv-respire 3.4s ease-in-out infinite}
.bv-debout-corps img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:50% 100%;border-radius:18px}
.bv-debout-p{opacity:0}
.bv-debout.parle .bv-debout-p{animation:bv-bouche .28s steps(1) infinite}
.bv-salut{position:absolute;right:2%;top:16%;font-size:34px;line-height:1;transform-origin:70% 85%;animation:bv-salut .5s ease-in-out infinite alternate;filter:drop-shadow(0 4px 4px rgba(0,0,0,.4))}
.bv.d2 .bv-debout{opacity:0;transform:translateX(-50%) scale(.5)}
/* l'île : votre univers commun, qui s'agrandit */
.bv-ile{left:50%;bottom:9%;width:270px;height:150px;opacity:0;transform:translateX(-50%) scale(.1);transform-origin:50% 60%;transition:transform 1s cubic-bezier(.2,1.1,.3,1),opacity .6s,bottom 1s}
.bv.d2 .bv-ile{opacity:1;bottom:4%;transform:translateX(-50%) scale(.42)}
.bv.d3 .bv-ile{bottom:6%;transform:translateX(-50%) scale(.72)}
.bv.d4 .bv-ile{bottom:10%;transform:translateX(-50%) scale(1.22)}
.bv.d6 .bv-ile{opacity:.18;transform:translateX(-50%) scale(1.05)}
.bv-ile > *{position:absolute}
.bv-sol{left:0;right:0;top:40px;height:78px;border-radius:50%;background:radial-gradient(60% 70% at 45% 35%,#7C3B8F,#4A1D5C 60%,#2E0F3A);box-shadow:0 0 0 2px rgba(255,143,203,.35),0 0 40px rgba(255,46,154,.35)}
.bv-roche{left:18%;right:18%;top:84px;height:66px;clip-path:polygon(0 0,100% 0,72% 70%,52% 100%,34% 66%);background:linear-gradient(#5A2448,#22091B)}
.bv-lueur{left:50%;top:-6px;width:8px;height:8px;border-radius:50%;background:#F2C46B;box-shadow:0 0 18px 6px rgba(242,196,107,.6);transform:translateX(-50%)}
.bv-ile-nom{left:50%;top:126px;transform:translateX(-50%);white-space:nowrap;font-size:24px;font-weight:800;color:#FF8FCB;transition:opacity .4s}
.bv.d3 .bv-ile-nom{opacity:0}
/* les deux figurines dessinées */
.bv-perso{bottom:16%;width:64px;text-align:center;opacity:0;transition:opacity .5s,transform .8s cubic-bezier(.2,1.1,.3,1),bottom .9s}
.bv-perso svg{display:block;width:64px;height:86px;margin:0 auto;filter:drop-shadow(0 8px 10px rgba(0,0,0,.5));animation:bv-dodeline 2.4s ease-in-out infinite}
.bv-perso.lea svg{animation-delay:-1.2s}
.bv-perso small{display:inline-block;margin-top:2px;padding:1px 8px;border-radius:999px;background:rgba(0,0,0,.35);font-size:11px;font-weight:800;color:#FFF4E6}
.bv-perso.toi{left:8%;transform:translateX(-30px)}
.bv-perso.lea{right:8%;transform:translateX(30px)}
.bv.d2 .bv-perso{opacity:1;transform:none}
.bv.d3 .bv-perso{bottom:3%}
.bv.d4 .bv-perso.toi,.bv.d4 .bv-perso.lea{opacity:0}
/* 2 · ce qu'ils se disent */
.bv-dit{max-width:150px;padding:7px 11px;border-radius:16px;font-size:12.5px;font-weight:600;line-height:1.3;opacity:0;transform:translateY(8px);transition:opacity .4s,transform .4s}
.bv-dit.toi{left:6%;top:7%;border-bottom-left-radius:4px;background:#C21D78;color:#fff}
.bv-dit.lea{right:6%;top:21%;border-bottom-right-radius:4px;background:#FFF4E6;color:#22091B}
.bv.d2 .bv-dit.toi{opacity:1;transform:none;transition-delay:.5s}
.bv.d2 .bv-dit.lea{opacity:1;transform:none;transition-delay:1.3s}
.bv.d4 .bv-dit.toi,.bv.d4 .bv-dit.lea{opacity:0;transition-delay:0s}
/* 3 · l'étagère : un souvenir déjà là ; un rappel et une info arrivent de la conversation */
.bv-etagere{left:50%;top:44%;width:min(250px,68%);opacity:0;transform:translateX(-50%);transition:opacity .4s,transform .7s}
.bv.d3 .bv-etagere{opacity:1}
.bv.d4 .bv-etagere{opacity:0;transform:translate(-50%,40px) scale(.4)}
.bv-planche{display:block;height:9px;margin-top:-2px;border-radius:4px;background:linear-gradient(#C68A4E,#7A4A22);box-shadow:0 6px 10px -4px rgba(0,0,0,.6)}
.bv-objets,.bv-etiquettes{display:flex}
.bv-objets{align-items:flex-end;height:40px}
.bv-objets > span,.bv-etiquettes > span{flex:1;text-align:center}
.bv-obj{font-size:30px;line-height:1}
.bv-obj.vole{opacity:0}
.bv.d3 .bv-obj.vole{animation:bv-pose 1s cubic-bezier(.2,1.3,.4,1) forwards}
.bv.d3 .bv-obj.v1{animation-delay:.6s;--de-x:-100px;--de-y:-110px}
.bv.d3 .bv-obj.v2{animation-delay:1.7s;--de-x:40px;--de-y:-60px}
.bv-etiquettes{gap:6px;margin-top:6px}
.bv-etiquettes > span{font-size:10.5px;font-weight:700;line-height:1.25;color:#FFF4E6;transition:opacity .4s}
.bv-etiquettes i{display:block;font-style:normal;font-size:8.5px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#F2C46B}
.bv-etiquettes .e1,.bv-etiquettes .e2{opacity:0}
.bv.d3 .bv-etiquettes .e1{opacity:1;transition-delay:1.4s}
.bv.d3 .bv-etiquettes .e2{opacity:1;transition-delay:2.5s}
/* 4 · les endroits qui apparaissent */
.bv-lieu{display:flex;flex-direction:column;align-items:center;gap:1px;opacity:0;transform:scale(.3) translateY(10px);transition:opacity .4s,transform .6s cubic-bezier(.2,1.4,.4,1)}
.bv-lieu b{display:grid;place-items:center;width:30px;height:30px;border-radius:10px;background:rgba(18,4,14,.75);box-shadow:0 0 0 1.5px rgba(255,143,203,.5),0 0 14px rgba(255,46,154,.45);font-size:17px}
.bv-lieu small{white-space:nowrap;padding:0 5px;border-radius:999px;background:rgba(18,4,14,.6);font-size:8px;font-weight:800;color:#FFF4E6}
.bv.d4 .bv-lieu{opacity:1;transform:none}
.l-chanson{left:0;top:42px}
.l-films{left:15%;top:12px}
.l-etagere{left:calc(50% - 22px);top:0}
.l-photos{right:15%;top:12px}
.l-porte{right:0;top:42px}
.l-secret{left:calc(50% - 22px);top:56px}
.l-concert{left:5%;top:90px}
.bv.d4 .l-etagere{transition-delay:.1s}
.bv.d4 .l-chanson{transition-delay:.5s}
.bv.d4 .l-films{transition-delay:.9s}
.bv.d4 .l-photos{transition-delay:1.3s}
.bv.d4 .l-porte{transition-delay:1.8s}
.bv.d4 .l-secret{transition-delay:2.5s}
.l-secret b{background:linear-gradient(135deg,#2E0F3A,#5A1E5E);animation:bv-mystere 1.6s ease-in-out infinite}
.bv .bv-lieu.l-concert{opacity:0;transform:scale(.3)}
.bv.d5 .bv-lieu.l-concert{opacity:1;transform:none;transition-delay:1.2s}
.l-concert b{box-shadow:0 0 0 1.5px #7FE8AE,0 0 16px rgba(127,232,174,.6)}
.bv-nouveau{position:absolute;top:-9px;right:-14px;padding:0 4px;border-radius:999px;background:#7FE8AE;color:#22091B;font-size:6.5px;font-weight:900;letter-spacing:.04em;text-transform:uppercase}
/* la porte : qui peut entrer */
.bv-acces{right:4%;top:14%;display:flex;flex-direction:column;align-items:flex-end;gap:4px;opacity:0;transition:opacity .5s}
.bv.d4 .bv-acces{opacity:1;transition-delay:2.2s}
.bv.d5 .bv-acces{opacity:0;transition-delay:0s}
.bv-acces small{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#CDB4C0}
.bv-acces span{padding:5px 11px;border-radius:999px;background:#3A1230;border:1.5px solid rgba(255,143,203,.55);font-size:12.5px;font-weight:800;white-space:nowrap;animation:bv-change .45s ease-out}
/* 5 · Léa frappe : la porte tremble */
.bv-toc{left:50%;top:10px;display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:#FFF4E6;color:#22091B;font-size:13px;font-weight:800;white-space:nowrap;box-shadow:0 12px 24px -10px #000;transform:translate(-50%,-70px);transition:transform .6s cubic-bezier(.2,1.3,.4,1)}
.bv.d5 .bv-toc{transform:translate(-50%,0);transition-delay:.4s}
.bv.d6 .bv-toc{transform:translate(-50%,-70px);transition-delay:0s}
.bv.d5 .l-porte b{animation:bv-toc .45s ease-in-out 1.1s 4}
/* 6 · par où ça commence */
.bv-chemin{left:0;right:0;top:50%;display:flex;justify-content:center;align-items:flex-start;gap:4px;padding:0 16px;transform:translateY(-50%)}
.bv-etape{display:flex;flex-direction:column;align-items:center;gap:6px;width:76px;text-align:center;opacity:0;transform:translateY(14px);transition:opacity .4s,transform .5s cubic-bezier(.2,1.3,.4,1)}
.bv-etape b{display:grid;place-items:center;width:54px;height:54px;border-radius:18px;background:#3A1230;border:1.5px solid rgba(255,143,203,.5);font-size:26px;box-shadow:0 10px 20px -10px #000}
.bv-etape.toi b{border-color:#F2C46B;box-shadow:0 0 0 3px rgba(242,196,107,.25),0 10px 20px -10px #000}
.bv-etape small{font-size:11.5px;font-weight:700;line-height:1.25;color:#FFF4E6}
.bv-fleche{align-self:center;margin-top:-30px;color:#FF8FCB;font-size:24px;font-weight:900;opacity:0;transition:opacity .4s}
.bv.d6 .bv-etape,.bv.d6 .bv-fleche{opacity:1;transform:none}
.bv.d6 .bv-chemin > :nth-child(1){transition-delay:.2s}
.bv.d6 .bv-chemin > :nth-child(2){transition-delay:.5s}
.bv.d6 .bv-chemin > :nth-child(3){transition-delay:.7s}
.bv.d6 .bv-chemin > :nth-child(4){transition-delay:1s}
.bv.d6 .bv-chemin > :nth-child(5){transition-delay:1.2s}
.bv.d6 .bv-chemin > :nth-child(6){transition-delay:1.5s}
.bv.d6 .bv-chemin > :nth-child(7){transition-delay:1.7s}

/* 💬 la conversation avec Pablito */
.bv-fil{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:14px 16px 8px;scroll-behavior:smooth;border-top:1px solid rgba(255,143,203,.12);
  background:linear-gradient(180deg,rgba(18,4,14,0),rgba(18,4,14,.6) 30px),repeating-linear-gradient(45deg,rgba(255,255,255,.012) 0 12px,transparent 12px 24px)}
.bv-jour{align-self:center;padding:3px 10px;border-radius:8px;background:rgba(255,255,255,.07);font-size:11px;font-weight:700;color:#CDB4C0}
.bv-msgs{display:flex;flex-direction:column;gap:8px}
.bv-msg{display:flex;align-items:flex-end;gap:8px;max-width:88%;animation:bv-entre .35s cubic-bezier(.2,1.3,.4,1)}
.bv-msg.pablito{align-self:flex-start}
.bv-msg.moi{align-self:flex-end}
.bv-tete{flex:none;display:block;width:34px}
.bv-tete .mq-cadre{aspect-ratio:1;border-radius:50%;box-shadow:0 0 0 2px rgba(255,46,154,.7)}
.bv-tete .mq-i{object-position:50% 10%;transform:scale(1.7);transform-origin:50% 18%}
.bv-bulle{position:relative;min-width:0;padding:8px 12px 6px;border-radius:18px;font-size:15px;font-weight:600;line-height:1.38}
.bv-msg.pablito .bv-bulle{border-bottom-left-radius:5px;background:#FFF4E6;color:#2A0F1F}
.bv-msg.moi .bv-bulle{border-bottom-right-radius:5px;background:#C21D78;color:#fff}
.bv-qui{display:block;font-size:11px;font-weight:800;color:#FF2E9A}
.bv-heure{float:right;margin:6px 0 -2px 10px;font-size:10.5px;font-weight:600;opacity:.6}
.bv-lu{margin-left:3px;color:#8FD3FF}
.bv-curseur{display:inline-block;width:2px;height:1em;margin-left:2px;vertical-align:-2px;background:#FF2E9A;animation:tu-curseur .6s steps(1) infinite}
.bv-ecrit{display:flex;gap:4px;padding:6px 2px}
.bv-ecrit i{width:7px;height:7px;border-radius:50%;background:#B79AAA;animation:bv-saute 1s infinite}
.bv-ecrit i:nth-child(2){animation-delay:.15s}
.bv-ecrit i:nth-child(3){animation-delay:.3s}
.bv-bulle .tu-ecouter{display:block;margin-top:6px}

/* ce qu'on lui répond */
.bv-reponses{display:flex;flex-direction:column;gap:8px;min-height:80px;padding:10px 16px calc(14px + env(safe-area-inset-bottom));background:#12040E;border-top:1px solid rgba(255,255,255,.06)}
.bv-choix{display:flex;justify-content:flex-end;animation:bv-monte .3s ease-out}
.bv-repondre{min-height:48px;padding:0 20px;border:1.5px solid #FF2E9A;border-radius:999px;background:rgba(255,46,154,.12);color:#FFF4E6;font-size:15.5px;font-weight:800;cursor:pointer;animation:bv-appelle 1.8s ease-in-out infinite}
.bv-repondre::after{content:" ➤";color:#FF2E9A}
.bv-fin{flex-direction:column;align-items:stretch;gap:2px}
.bv .tu-creer{width:100%;min-height:54px;margin:0;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font-size:17px;font-weight:900;cursor:pointer;box-shadow:0 12px 26px -10px rgba(255,46,154,.95)}
.bv-plus-tard{min-height:40px;border:0;background:none;color:#CDB4C0;font-size:14px;font-weight:700;cursor:pointer}
.bv-indice{text-align:center;font-size:12.5px;color:#CDB4C0}
.bv-indice b{color:#FFF4E6}

@keyframes bv-scintille{to{opacity:.4}}
@keyframes bv-respire{50%{transform:scale(1.012,.992) rotate(-.6deg)}}
@keyframes bv-bouche{0%{opacity:1}50%{opacity:0}}
@keyframes bv-salut{from{transform:rotate(-14deg)}to{transform:rotate(16deg)}}
@keyframes bv-dodeline{50%{transform:rotate(-4deg) translateY(-2px)}}
@keyframes bv-pose{0%{opacity:0;transform:translate(var(--de-x),var(--de-y)) scale(.4) rotate(-30deg)}50%{opacity:1}100%{opacity:1;transform:none}}
@keyframes bv-mystere{50%{box-shadow:0 0 0 1.5px #F2C46B,0 0 22px rgba(242,196,107,.8)}}
@keyframes bv-change{from{opacity:0;transform:translateY(-6px)}}
@keyframes bv-toc{25%{transform:rotate(-9deg)}75%{transform:rotate(9deg)}}
@keyframes bv-entre{from{opacity:0;transform:translateY(10px) scale(.97)}}
@keyframes bv-saute{30%{transform:translateY(-4px)}}
@keyframes bv-monte{from{opacity:0;transform:translateY(8px)}}
@keyframes bv-appelle{50%{box-shadow:0 0 0 6px rgba(255,46,154,.12)}}
@media (prefers-reduced-motion:reduce){.bv *{animation:none!important;transition:none!important}.bv.d3 .bv-obj.vole{opacity:1}}
`;
