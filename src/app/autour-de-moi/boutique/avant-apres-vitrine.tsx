"use client";

// 👗 L'AVANT / APRÈS DE SA VITRINE — une de ses pièces, sur quelqu'un qu'elle
// n'a jamais vu.
//
// « À l'étape 2, c'est dommage de ne pas montrer la véritable plus-value
// visuellement : on a Léa qui parle et explique, mais visuellement aucun effet
// wow. Il aurait fallu une petite animation où l'on voit une personne avec ses
// vêtements normaux, et exactement la même pose avec les vêtements de Lili
// Ross by me, pris sur sa fiche Google. »
//
// CE QU'ON VOIT, DANS L'ORDRE :
//   · deux cadres côte à côte, la même personne, la même pose ;
//   · dans le second, un trait de lumière descend et, derrière lui, la pièce
//     de SA boutique apparaît sur la personne — c'est le moment que Léa
//     commente (`clikme:montrer`, envoyé par la démonstration, relance
//     l'animation au bon moment) ;
//   · dessous, la pièce elle-même, recadrée sur sa photo Google, et son mot :
//     SA voix s'il l'a enregistrée, sinon l'emplacement vide où elle ira.
//     Jamais une voix prêtée à la propriétaire.
//
// CE QUI EST DIT EN TOUTES LETTRES : « Simulation d'essayage · Rendu
// indicatif ». La personne n'existe pas — c'est celle de l'essayage de
// démonstration —, la pièce est la sienne.
//
// LE RENDU PEUT ÊTRE EN ROUTE à la première visite (le moteur travaille après
// la page, voir `essai-vitrine.ts`) : le second cadre le dit, la page demande
// où il en est, et l'animation part dès qu'il arrive.
//
// S'IL ÉCHOUE, LE BLOC LE DIT. « Le après n'a jamais marché, et ensuite à
// l'étape 2 je n'ai pas eu d'avant ou d'après » : il s'effaçait sans un mot,
// et personne ne pouvait savoir pourquoi. Il garde l'avant, dit la raison en
// clair, et replie le détail technique dessous. Et il continue de demander :
// un nouvel essai part dès que ses photos Google sont lues.
//
// LA VISITE DE LÉA L'ATTEND : l'état est annoncé à la fenêtre
// (`clikme:essai`), et l'étape 2 patiente quelques secondes quand le rendu
// est en route — voir `attendreLEssai` dans `demo-tour.tsx`.
import { useCallback, useEffect, useRef, useState } from "react";
import type { CarteAutour } from "@/lib/direct/apercu-habitant";
import type { EssaiVitrineCarte } from "@/lib/site-internet/essai-vitrine-donnees";

/** Combien de temps on attend le rendu, au plus. */
const ATTENTE_MAX = 5 * 60_000;

/** L'état de l'essai, annoncé à la fenêtre pour la visite de Léa. */
function annoncer(etat: string) {
  try {
    (window as unknown as { __clikmeEssai?: string }).__clikmeEssai = etat;
    window.dispatchEvent(new CustomEvent("clikme:essai", { detail: etat }));
  } catch {
    /* rien */
  }
}
/** Les hauteurs de l'onde du mot — fixes : une onde qui change à chaque rendu clignote. */
const ONDE = [30, 55, 40, 80, 60, 95, 45, 70, 35, 85, 50, 65, 30, 75, 55, 90, 40, 60, 35, 70, 45, 80, 30, 50];

/** Son mot, rejoué depuis le début ; rend vrai s'il joue. */
async function depuisLeDebut(a: HTMLAudioElement, fin: () => void): Promise<boolean> {
  a.onended = fin;
  a.currentTime = 0;
  try {
    await a.play();
    return true;
  } catch {
    return false;
  }
}

export function AvantApresVitrine({ c, essai: depart }: { c: CarteAutour; essai: EssaiVitrineCarte }) {
  const [essai, setEssai] = useState<EssaiVitrineCarte | null>(depart);
  /** Chaque tour de l'animation : il la remonte, donc la rejoue depuis le début. */
  const [tour, setTour] = useState(0);
  const racine = useRef<HTMLElement | null>(null);
  const rejouer = useCallback(() => setTour((t) => t + 1), []);

  /* ═══ TANT QU'IL N'EST PAS PRÊT, ON DEMANDE OÙ IL EN EST ═══ Toutes les
     cinq secondes, cinq minutes au plus — en cours comme après un échec : un
     nouvel essai part dès que ses photos Google sont lues. « Absent » au
     début est normal : la route qui le fabrique vient à peine d'être sonnée. */
  const attend = essai?.etat === "en-cours" || essai?.etat === "echec";
  useEffect(() => {
    if (!attend) return;
    const debut = Date.now();
    let fini = false;
    const t = window.setInterval(async () => {
      if (Date.now() - debut > ATTENTE_MAX) {
        window.clearInterval(t);
        if (!fini)
          setEssai((e) =>
            e?.etat === "en-cours" ? { ...e, etat: "echec", raison: "Le rendu prend plus de temps que prévu : il sera là à votre prochaine visite." } : e,
          );
        return;
      }
      try {
        const r = await fetch(`/api/site-internet/essai-vitrine?slug=${encodeURIComponent(c.id)}`, { cache: "no-store" });
        const j = (await r.json()) as { etat: string; avant?: string; apres?: string; piece?: string; nom?: string; raison?: string; erreur?: string };
        if (fini) return;
        if (j.etat === "prete" && j.apres) {
          window.clearInterval(t);
          setEssai({ etat: "prete", avant: j.avant, apres: j.apres, piece: j.piece, nom: j.nom });
          setTour((x) => x + 1);
        } else if (j.etat === "en-cours") {
          setEssai((e) => ({ ...(e ?? {}), etat: "en-cours", piece: j.piece ?? e?.piece, nom: j.nom ?? e?.nom }));
        } else if ((j.etat === "echec" || j.etat === "aucune") && j.raison) {
          setEssai((e) => ({ ...(e ?? {}), etat: "echec", raison: j.raison, detail: j.erreur, piece: j.piece ?? e?.piece, nom: j.nom ?? e?.nom }));
        }
      } catch {
        /* réseau coupé : au tour suivant */
      }
    }, 5000);
    return () => {
      fini = true;
      window.clearInterval(t);
    };
  }, [attend, c.id]);

  /* L'ÉTAT, ANNONCÉ À LA VISITE DE LÉA — voir `attendreLEssai`. */
  const etat = essai?.etat ?? "absent";
  useEffect(() => {
    annoncer(etat);
  }, [etat]);

  /* ═══ L'ANIMATION PART QUAND ON LA VOIT, ET QUAND LÉA EN PARLE ═══ */
  useEffect(() => {
    const el = racine.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let vue = false;
    const o = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((e) => e.isIntersecting) && !vue) {
          vue = true;
          rejouer();
        }
      },
      { threshold: 0.45 },
    );
    o.observe(el);
    const montrer = (e: Event) => {
      if ((e as CustomEvent).detail === "essayer") window.setTimeout(rejouer, 700);
    };
    window.addEventListener("clikme:montrer", montrer);
    return () => {
      o.disconnect();
      window.removeEventListener("clikme:montrer", montrer);
    };
  }, [rejouer]);

  /* ═══ SON MOT, À SA VOIX — s'il l'a enregistré, et seulement alors ═══ */
  const voix = c.voix?.extrait;
  const prenom = c.voix?.prenom?.trim();
  const son = useRef<HTMLAudioElement | null>(null);
  const [joue, setJoue] = useState(false);
  useEffect(() => () => son.current?.pause(), []);
  const ecouter = () => {
    if (!voix) return;
    if (joue) {
      son.current?.pause();
      setJoue(false);
      return;
    }
    son.current = son.current ?? new Audio(voix);
    void depuisLeDebut(son.current, () => setJoue(false)).then(setJoue);
  };

  if (!essai) return null;
  const pret = essai.etat === "prete" && essai.apres;
  const avant = essai.avant ?? "/direct/accueil/moi-mode-sans.jpg";

  return (
    <section ref={racine} className="aa" aria-label={`L’essayage virtuel, avec une pièce de ${c.nom}`}>
      <StylesAvantApres />
      <p className="aa-k">L’essayage virtuel</p>
      <div className="aa-cadres">
        <figure className="aa-cadre">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avant} alt="Avant : la personne dans ses vêtements" />
          <figcaption className="aa-badge">Avant</figcaption>
        </figure>
        <figure className={`aa-cadre apres${pret ? "" : " attend"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avant} alt="" aria-hidden="true" />
          {pret ? (
            <div key={tour} className={`aa-revele${tour ? " joue" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={essai.apres} alt={`Après : la même personne, avec ${essai.nom ? essai.nom.toLowerCase() : "une pièce"} de ${c.nom}`} />
              <i className="aa-scan" aria-hidden="true" />
              <span className="aa-etincelles" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
              <figcaption className="aa-badge or">Avec votre pièce</figcaption>
            </div>
          ) : essai.etat === "echec" ? (
            <div className="aa-route rate">
              <p>{essai.raison ?? "Le rendu n’a pas abouti cette fois."}</p>
            </div>
          ) : (
            <div className="aa-route">
              <i className="aa-scan boucle" aria-hidden="true" />
              <p>L’IA l’habille avec une de vos pièces…</p>
            </div>
          )}
        </figure>
      </div>

      <div className="aa-bas">
        {essai.piece ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="aa-piece" src={essai.piece} alt={essai.nom ?? `Une pièce de ${c.nom}`} />
        ) : (
          <span className="aa-piece vide" aria-hidden="true" />
        )}
        <div className="aa-info">
          <small>Une pièce de {c.nom}</small>
          <b>{essai.nom ?? (pret ? "Prise sur votre fiche Google" : "Choisie sur votre fiche Google…")}</b>
          {essai.nom && <span>Prise sur votre fiche Google</span>}
        </div>
        {/* SON MOT, SUR TOUTE LA LARGEUR : à côté de la vignette, l'onde n'avait plus de place sur un téléphone. */}
        {voix ? (
          <button type="button" className={`aa-mot${joue ? " joue" : ""}`} onClick={ecouter} aria-label={joue ? "Arrêter" : `Écouter le mot${prenom ? ` de ${prenom}` : ""}`}>
            <span className="aa-play" aria-hidden="true">
              {joue ? "❚❚" : "▶"}
            </span>
            <span className="aa-mot-t">{prenom ? `Le mot de ${prenom}` : "Votre mot"}</span>
            <span className="aa-onde" aria-hidden="true">
              {ONDE.map((h, i) => (
                <i key={i} style={{ height: `${h}%`, animationDelay: `${(i % 6) * 0.09}s` }} />
              ))}
            </span>
          </button>
        ) : (
          <div className="aa-mot vide">
            <span className="aa-micro" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
              </svg>
            </span>
            <span>
              <b>Ici, votre mot à votre voix</b>
              <em>Dix secondes enregistrées sur chaque pièce : vos clientes vous entendent en l’essayant.</em>
            </span>
          </div>
        )}
      </div>

      {essai.etat === "echec" && essai.detail && (
        <details className="aa-detail">
          <summary>Détail technique</summary>
          <code>{essai.detail}</code>
        </details>
      )}

      <p className="aa-pied">
        <span>Simulation d’essayage · Rendu indicatif</span>
        {pret && (
          <button type="button" onClick={rejouer}>
            ↻ Revoir
          </button>
        )}
      </p>
    </section>
  );
}

function StylesAvantApres() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.aa{position:relative;margin:22px auto 0;max-width:560px;padding:14px 14px 10px;border-radius:24px;
  background:linear-gradient(180deg,rgba(255,244,230,.06),rgba(255,244,230,.025));border:1px solid rgba(255,196,140,.16);
  box-shadow:0 24px 60px rgba(0,0,0,.35);}
.aa-k{margin:2px 4px 12px;font-size:12px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#F5A23A;}
.aa-cadres{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.aa-cadre{position:relative;margin:0;aspect-ratio:2 / 3;border-radius:16px;overflow:hidden;background:#261B16;}
.aa-cadre img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.aa-badge{position:absolute;top:10px;left:10px;z-index:3;padding:6px 12px;border-radius:999px;font-size:13px;font-weight:700;
  color:#FFF4E6;background:rgba(18,12,9,.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}
.aa-badge.or{left:auto;right:10px;background:rgba(160,82,18,.88);}
.aa-revele{position:absolute;inset:0;}
.aa-revele > img{clip-path:inset(0 0 100% 0);}
.aa-revele.joue > img{animation:aa-devoile 2.6s cubic-bezier(.65,.05,.3,1) .45s both;}
.aa-revele .aa-badge{opacity:0;}
.aa-revele.joue .aa-badge{animation:aa-arrive .5s ease-out 2.9s both;}
.aa-scan{position:absolute;left:-10%;right:-10%;top:0;height:3px;z-index:2;opacity:0;pointer-events:none;
  background:linear-gradient(90deg,transparent,#FFD9A8 20%,#fff 50%,#FF8CC8 80%,transparent);
  box-shadow:0 0 18px 6px rgba(255,170,90,.55),0 0 46px 14px rgba(255,46,154,.28);}
.aa-revele.joue .aa-scan{animation:aa-balaye 2.6s cubic-bezier(.65,.05,.3,1) .45s both;}
.aa-scan.boucle{animation:aa-balaye 2.4s ease-in-out infinite;}
.aa-etincelles i{position:absolute;z-index:2;width:8px;height:8px;opacity:0;border-radius:50%;
  background:radial-gradient(circle,#fff 0 30%,rgba(255,217,168,.9) 45%,transparent 70%);}
.aa-etincelles i:nth-child(1){left:22%;top:28%;}
.aa-etincelles i:nth-child(2){left:70%;top:44%;}
.aa-etincelles i:nth-child(3){left:38%;top:66%;}
.aa-etincelles i:nth-child(4){left:62%;top:82%;}
.aa-revele.joue .aa-etincelles i{animation:aa-brille 1.1s ease-out both;}
.aa-revele.joue .aa-etincelles i:nth-child(1){animation-delay:1.1s;}
.aa-revele.joue .aa-etincelles i:nth-child(2){animation-delay:1.6s;}
.aa-revele.joue .aa-etincelles i:nth-child(3){animation-delay:2.1s;}
.aa-revele.joue .aa-etincelles i:nth-child(4){animation-delay:2.6s;}
.aa-cadre.attend > img{filter:blur(3px) saturate(.5) brightness(.7);transform:scale(1.04);}
.aa-route{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;padding:14px;}
.aa-route p{position:relative;z-index:3;margin:0;padding:8px 12px;border-radius:12px;background:rgba(18,12,9,.7);
  font-size:13px;font-weight:700;color:#FFF4E6;text-align:center;}
.aa-route.rate{align-items:center;}
.aa-route.rate p{font-weight:600;line-height:1.4;background:rgba(18,12,9,.82);}
.aa-detail{margin:10px 2px 0;font-size:12px;color:#A8927F;}
.aa-detail summary{cursor:pointer;}
.aa-detail code{display:block;margin-top:6px;padding:8px 10px;border-radius:10px;background:rgba(18,12,9,.6);
  white-space:pre-wrap;word-break:break-word;font-size:11.5px;color:#CDB8A4;}
@keyframes aa-devoile{from{clip-path:inset(0 0 100% 0);}to{clip-path:inset(0 0 0 0);}}
@keyframes aa-balaye{0%{top:0;opacity:0;}8%{opacity:1;}92%{opacity:1;}100%{top:100%;opacity:0;}}
@keyframes aa-brille{0%{opacity:0;transform:scale(.2);}40%{opacity:1;transform:scale(1.6);}100%{opacity:0;transform:scale(.6);}}
@keyframes aa-arrive{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:none;}}
.aa-bas{display:grid;grid-template-columns:72px minmax(0,1fr);gap:12px;align-items:center;margin-top:12px;}
.aa-piece{width:72px;height:96px;border-radius:12px;object-fit:cover;background:#261B16;border:1px solid rgba(255,196,140,.16);}
.aa-piece.vide{display:block;}
.aa-info{display:flex;flex-direction:column;gap:3px;min-width:0;}
.aa-info small,.aa-info span{font-size:12px;color:#CDB8A4;}
.aa-info > b{font-family:var(--font-clikme),sans-serif;font-size:15.5px;line-height:1.25;color:#FFF4E6;}
.aa-mot{grid-column:1 / -1;display:grid;grid-template-columns:40px auto minmax(0,1fr);align-items:center;gap:10px;padding:8px 12px 8px 8px;
  border-radius:16px;border:1px solid rgba(255,196,140,.2);background:rgba(18,12,9,.45);color:#FFF4E6;font:inherit;text-align:left;cursor:pointer;}
.aa-play{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:#F5A23A;color:#1B0F08;font-size:14px;font-weight:900;}
.aa-mot-t{font-size:14px;font-weight:700;white-space:nowrap;}
.aa-onde{display:flex;align-items:center;gap:2px;height:28px;overflow:hidden;}
.aa-onde i{flex:1;min-width:2px;max-width:3px;border-radius:2px;background:rgba(255,217,168,.55);}
.aa-mot.joue .aa-onde i{animation:aa-onde .7s ease-in-out infinite alternate;background:#FFD9A8;}
@keyframes aa-onde{from{transform:scaleY(.45);}to{transform:scaleY(1);}}
.aa-mot.vide{grid-template-columns:40px minmax(0,1fr);cursor:default;border-style:dashed;}
.aa-micro{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:rgba(255,46,154,.16);}
.aa-micro svg{width:20px;height:20px;fill:none;stroke:#FF8CC8;stroke-width:2;stroke-linecap:round;}
.aa-micro svg rect{fill:#FF8CC8;stroke:none;}
.aa-mot.vide b{display:block;font-size:13.5px;color:#FFF4E6;}
.aa-mot.vide em{display:block;font-style:normal;font-size:12.5px;line-height:1.35;color:#CDB8A4;}
.aa-pied{display:flex;align-items:center;justify-content:center;gap:12px;margin:10px 0 2px;font-size:12px;color:#A8927F;}
.aa-pied button{border:0;background:none;padding:4px 6px;color:#F5A23A;font:inherit;font-weight:700;cursor:pointer;}
@media (prefers-reduced-motion:reduce){
  .aa-revele.joue > img,.aa-revele.joue .aa-scan,.aa-revele.joue .aa-etincelles i,.aa-scan.boucle,.aa-mot.joue .aa-onde i,.aa-revele.joue .aa-badge{animation:none;}
  .aa-revele > img{clip-path:none;}
  .aa-revele .aa-badge{opacity:1;}
}
`,
      }}
    />
  );
}
