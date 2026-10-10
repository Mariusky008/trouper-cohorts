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
// ═══ L'APRÈS ARRIVE AU BOUT DE TROIS SECONDES, TOUJOURS ═══════════════════
//
// « On attend une minute sans que rien ne se passe, on attend que l'après
// arrive mais il n'arrive pas, et il arrive une fois que la démo est
// terminée. Il vaut mieux avoir l'avant dès le départ, et un après au bout de
// trois secondes, déjà préparé. »
//
// DEUX PAIRES, ET ON NE FAIT PLUS JAMAIS ATTENDRE :
//   · SA PIÈCE, quand le moteur l'a déjà habillée (voir `essai-vitrine.ts`) :
//     « Avec votre pièce », sa vignette, son nom ;
//   · sinon L'EXEMPLE, déjà fabriqué — la même personne, avant et avec un
//     blazer rose —, marqué « Exemple » sans rien prétendre de sa boutique.
//     Le rendu de sa pièce continue derrière ; dès qu'il arrive, il remplace
//     l'exemple et se rejoue.
//
// ═══ EN GRAND PENDANT QUE LÉA EN PARLE, PUIS À SA PLACE ═══════════════════
//
// « On ne voit pas l'animation dans son entier, et pourtant j'ai un grand
// écran : elle pourrait être en pop-up plein écran, et une fois terminée elle
// se met dans son espace sous "La pièce qui vous plaît". »
//
// Quand la présentation arrive à cette étape (`clikme:montrer`), les deux
// photos s'ouvrent en grand par-dessus la page ; l'après se révèle à trois
// secondes ; puis le tout rétrécit et glisse exactement à sa place dans la
// page (on mesure les deux cadres et on anime la différence). « Voir en
// grand » rouvre la même chose à la main.
//
// SON MOT : SA voix s'il l'a enregistrée, sinon l'emplacement vide où elle
// ira — jamais une voix prêtée à la propriétaire. Et « Simulation d'essayage
// · Rendu indicatif », en toutes lettres.
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CarteAutour } from "@/lib/direct/apercu-habitant";
import type { EssaiVitrineCarte } from "@/lib/site-internet/essai-vitrine-donnees";

/** L'exemple déjà fabriqué : la même personne, avant et avec un blazer rose. */
const EXEMPLE = { avant: "/direct/accueil/moi-mode-sans.jpg", apres: "/direct/accueil/moi-mode-avec.jpg" };
/** Combien de temps on demande où en est le rendu de sa pièce, au plus. */
const ATTENTE_MAX = 5 * 60_000;
/** En grand : l'après se révèle à 3 s, l'apparition finit vers 5,8 s ; on le laisse regarder, puis on range. */
const RANGER_A = 8400;
const DUREE_RANGEMENT = 850;
/** Les hauteurs de l'onde du mot — fixes : une onde qui change à chaque rendu clignote. */
const ONDE = [30, 55, 40, 80, 60, 95, 45, 70, 35, 85, 50, 65, 30, 75, 55, 90, 40, 60, 35, 70, 45, 80, 30, 50];

/**
 * ═══ LA DEMANDE DE LÉA, GARDÉE POUR CELUI QUI N'ÉTAIT PAS ENCORE LÀ ═══════
 *
 * « En mode téléphone, à l'étape 2, on ne voit pas du tout l'animation avant
 * après. »
 *
 * SUR LA PAGE À ONGLETS, L'ESSAYAGE N'EXISTE PAS ENCORE QUAND LÉA LE DEMANDE.
 * La présentation envoie `clikme:montrer` ; la page à onglets ouvre alors son
 * onglet Expérience — et c'est seulement là que ce bloc naît. Il arrivait une
 * fraction de seconde APRÈS le signal, ne l'entendait jamais, et restait en
 * bas de l'onglet, hors de l'écran du téléphone, sans jouer.
 *
 * ON NOTE DONC LA DEMANDE ICI, dès que ce fichier est chargé (il l'est avec la
 * page) : le bloc qui arrive dans les trois secondes la sert à sa naissance.
 * Celui qui était déjà là la sert tout de suite, et la marque servie — elle
 * ne s'ouvre jamais deux fois.
 */
const demande = { at: 0, servie: true };
if (typeof window !== "undefined") {
  window.addEventListener("clikme:montrer", (e) => {
    if ((e as CustomEvent).detail !== "essayer") return;
    demande.at = Date.now();
    demande.servie = false;
  });
}

/** Une demande de Léa attend encore son bloc : elle a moins de trois secondes. */
function demandeEnAttente() {
  return !demande.servie && Date.now() - demande.at < 3000;
}

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

type Mode = "repos" | "joue" | "fini";

/** Les deux cadres : l'avant, et l'après qui se révèle par-dessus l'avant. */
function Cadres({ avant, apres, badge, mode, n, alt }: { avant: string; apres: string; badge: string; mode: Mode; n: number; alt: string }) {
  return (
    <>
      <figure className="aa-cadre">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avant} alt="Avant : la personne dans ses vêtements" />
        <figcaption className="aa-badge">Avant</figcaption>
      </figure>
      <figure className="aa-cadre apres">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avant} alt="" aria-hidden="true" />
        <div key={n} className={`aa-revele ${mode}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={apres} alt={alt} />
          <span className="aa-pendant" aria-hidden="true">
            L’IA l’habille…
          </span>
          <i className="aa-scan" aria-hidden="true" />
          <span className="aa-etincelles" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <figcaption className="aa-badge or">{badge}</figcaption>
        </div>
      </figure>
    </>
  );
}

export function AvantApresVitrine({ c, essai: depart }: { c: CarteAutour; essai: EssaiVitrineCarte }) {
  const [essai, setEssai] = useState<EssaiVitrineCarte>(depart);
  /** L'animation dans la page : au repos (après caché), qui joue, ou finie (après visible). */
  const [jeu, setJeu] = useState<{ mode: Mode; n: number }>({ mode: "repos", n: 0 });
  /**
   * En grand, par-dessus la page : ouvert, puis en train de se ranger à sa place.
   *
   * ═══ NÉ D'UNE DEMANDE DE LÉA, LE BLOC NAÎT DÉJÀ EN GRAND ═══════════════
   *
   * « Au départ de l'étape 2, quand Léa dit "Et voilà ce qu'…", on voit
   * pendant moins d'une seconde "La pièce qui vous plaît, sur vous avant
   * d'entrer", les trois étapes et l'image en dessous, puis l'image devient
   * toute grande. J'aimerais qu'on ait directement l'image en grand. »
   *
   * C'ÉTAIT L'ORDRE DES CHOSES : l'onglet Expérience s'ouvrait, se peignait,
   * et le plein écran ne venait qu'une demi-seconde plus tard, en fondu. Le
   * bloc qui naît d'une demande en attente naît donc ouvert (`net` : ni fondu
   * ni montée), dans la même image que l'onglet — rien ne se peint avant.
   */
  const [plein, setPlein] = useState<{ n: number; range: boolean; net?: boolean } | null>(() =>
    demandeEnAttente() ? { n: 1, range: false, net: true } : null,
  );
  /** Le glissement vers sa place : la différence entre le cadre en grand et celui de la page. */
  const [vol, setVol] = useState<{ tx: number; ty: number; s: number } | null>(null);
  const racine = useRef<HTMLElement | null>(null);
  const cadresPage = useRef<HTMLDivElement | null>(null);
  const cadresPlein = useRef<HTMLDivElement | null>(null);
  const minuteurs = useRef<number[]>([]);
  const dejaJoue = useRef(false);

  const pret = essai.etat === "prete" && Boolean(essai.apres);
  const exemple = !pret;
  const avant = pret ? (essai.avant ?? EXEMPLE.avant) : EXEMPLE.avant;
  const apres = pret ? (essai.apres as string) : EXEMPLE.apres;
  const badge = exemple ? "Exemple" : "Avec votre pièce";
  const alt = exemple
    ? "Exemple : la même personne, avec une autre tenue"
    : `Après : la même personne, avec ${essai.nom ? essai.nom.toLowerCase() : "une pièce"} de ${c.nom}`;

  const jouerIci = useCallback(() => {
    dejaJoue.current = true;
    setJeu((j) => ({ mode: "joue", n: j.n + 1 }));
  }, []);

  /* ═══ RANGER : le cadre en grand rétrécit et glisse à sa place ═══ */
  const ranger = useCallback(() => {
    minuteurs.current.forEach((t) => window.clearTimeout(t));
    minuteurs.current = [];
    /* SA PLACE DOIT ÊTRE À L'ÉCRAN AVANT QU'IL S'Y POSE. Sur un téléphone, le
       bloc est au bas de l'onglet, sous le fantôme : le cadre glissait hors de
       l'écran, et l'on croyait qu'il avait disparu. On amène sa place à
       l'écran d'abord, et on ne mesure qu'APRÈS le défilement (deux images
       plus tard) : mesuré tout de suite, le cadre visait l'ancienne place. */
    const ici = cadresPage.current?.getBoundingClientRect();
    const defile = Boolean(ici && (ici.top < 60 || ici.bottom > window.innerHeight - 120));
    if (defile) cadresPage.current?.scrollIntoView({ block: "center", behavior: "auto" });
    const poser = () => {
      /* ON VISE LE CADRE DE L'APRÈS, PAS LA GRILLE. Sur un téléphone, le
         plein écran ne montre que lui (voir les styles) : la grille en grand
         et celle de la page n'ont plus la même forme. Le cadre de l'après, si.
         Le glissement part du coin de la grille (transform-origin) : on en
         déduit le déplacement qui pose l'après exactement sur le sien. */
      const grille = cadresPlein.current?.getBoundingClientRect();
      const de = cadresPlein.current?.querySelector(".aa-cadre.apres")?.getBoundingClientRect();
      const vers = cadresPage.current?.querySelector(".aa-cadre.apres")?.getBoundingClientRect();
      if (grille && de && vers && de.width > 0) {
        const s = vers.width / de.width;
        setVol({ tx: vers.left - grille.left - s * (de.left - grille.left), ty: vers.top - grille.top - s * (de.top - grille.top), s });
      }
      setPlein((p) => (p ? { ...p, range: true } : p));
      setJeu((j) => ({ mode: "fini", n: j.n + 1 }));
      minuteurs.current.push(
        window.setTimeout(() => {
          setPlein(null);
          setVol(null);
        }, DUREE_RANGEMENT),
      );
    };
    if (defile) requestAnimationFrame(() => requestAnimationFrame(poser));
    else poser();
  }, []);

  /* ═══ OUVRIR EN GRAND ═══ L'après se révèle à trois secondes, puis on range.
     `net` : à la demande de Léa, d'un coup, sans fondu. */
  const ouvrir = useCallback(
    (net = false) => {
      minuteurs.current.forEach((t) => window.clearTimeout(t));
      dejaJoue.current = true;
      setVol(null);
      setPlein({ n: Date.now(), range: false, net });
      minuteurs.current = [window.setTimeout(ranger, RANGER_A)];
    },
    [ranger],
  );

  useEffect(
    () => () => {
      minuteurs.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  /* NÉ OUVERT (voir `plein`) : la demande est servie, et le rangement se
     programme comme si l'on venait d'ouvrir. Une fois, à la naissance. */
  useEffect(() => {
    if (!plein?.net || plein.n !== 1) return;
    demande.servie = true;
    dejaJoue.current = true;
    minuteurs.current = [window.setTimeout(ranger, RANGER_A)];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ÉCHAP REFERME, comme toute fenêtre. */
  useEffect(() => {
    if (!plein || plein.range) return;
    const touche = (e: KeyboardEvent) => e.key === "Escape" && ranger();
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [plein, ranger]);

  /* ═══ TANT QUE SA PIÈCE N'EST PAS PRÊTE, ON DEMANDE OÙ ELLE EN EST ═══
     L'exemple tient la place ; dès que sa pièce arrive, elle le remplace et
     se rejoue dans la page. Cinq minutes au plus. */
  const attend = essai.etat === "en-cours" || essai.etat === "echec";
  useEffect(() => {
    if (!attend) return;
    const debut = Date.now();
    let fini = false;
    const t = window.setInterval(async () => {
      if (Date.now() - debut > ATTENTE_MAX) {
        window.clearInterval(t);
        return;
      }
      try {
        const r = await fetch(`/api/site-internet/essai-vitrine?slug=${encodeURIComponent(c.id)}`, { cache: "no-store" });
        const j = (await r.json()) as { etat: string; avant?: string; apres?: string; piece?: string; nom?: string; raison?: string; erreur?: string };
        if (fini) return;
        if (j.etat === "prete" && j.apres) {
          window.clearInterval(t);
          setEssai({ etat: "prete", avant: j.avant, apres: j.apres, piece: j.piece, nom: j.nom });
          setJeu((x) => ({ mode: "joue", n: x.n + 1 }));
        } else if (j.etat === "en-cours") {
          setEssai((e) => ({ ...e, etat: "en-cours", piece: j.piece ?? e.piece, nom: j.nom ?? e.nom }));
        } else if ((j.etat === "echec" || j.etat === "aucune") && j.raison) {
          setEssai((e) => ({ ...e, etat: "echec", raison: j.raison, detail: j.erreur, piece: j.piece ?? e.piece, nom: j.nom ?? e.nom }));
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

  /* ═══ DANS LA PAGE, ELLE JOUE QUAND ON LA VOIT ; EN GRAND QUAND LÉA EN PARLE ═══ */
  useEffect(() => {
    const el = racine.current;
    if (!el) return;
    let o: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      o = new IntersectionObserver(
        (entrees) => {
          if (entrees.some((e) => e.isIntersecting) && !dejaJoue.current) jouerIci();
        },
        { threshold: 0.45 },
      );
      o.observe(el);
    }
    /* DÉJÀ LÀ QUAND LÉA EN PARLE : en grand tout de suite, sans la
       demi-seconde d'avant — c'est elle qui laissait voir la page. */
    const montrer = (e: Event) => {
      if ((e as CustomEvent).detail !== "essayer") return;
      demande.servie = true;
      ouvrir(true);
    };
    window.addEventListener("clikme:montrer", montrer);
    /* UNE DEMANDE ARRIVÉE ENTRE LA NAISSANCE ET CET EFFET : servie aussi. */
    if (demandeEnAttente()) {
      demande.servie = true;
      window.setTimeout(() => ouvrir(true), 0);
    }
    return () => {
      o?.disconnect();
      window.removeEventListener("clikme:montrer", montrer);
    };
  }, [jouerIci, ouvrir]);

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

  const plein_ =
    plein && typeof document !== "undefined"
      ? createPortal(
          <div className={`aa-plein${plein.range ? " range" : ""}${plein.net ? " net" : ""}`} role="dialog" aria-label={`L’essayage virtuel · ${c.nom}`}>
            <StylesAvantApres />
            <div className="aa-plein-fond" onClick={ranger} />
            <div className="aa-plein-scene">
              <p className="aa-plein-k">
                L’essayage virtuel · {exemple ? "exemple" : `une pièce de ${c.nom}`}
              </p>
              <div
                ref={cadresPlein}
                className="aa-plein-cadres"
                style={vol ? { transform: `translate(${vol.tx}px, ${vol.ty}px) scale(${vol.s})` } : undefined}
              >
                <Cadres avant={avant} apres={apres} badge={badge} mode="joue" n={plein.n} alt={alt} />
              </div>
              <p className="aa-plein-pied">Simulation d’essayage · Rendu indicatif</p>
              <button type="button" className="aa-plein-x" onClick={ranger} aria-label="Fermer">
                ✕
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <section ref={racine} className="aa" aria-label={`L’essayage virtuel, avec une pièce de ${c.nom}`}>
      <StylesAvantApres />
      <p className="aa-k">L’essayage virtuel</p>
      <div ref={cadresPage} className={`aa-cadres${plein ? " cache" : ""}`}>
        <Cadres avant={avant} apres={apres} badge={badge} mode={jeu.mode} n={jeu.n} alt={alt} />
      </div>

      <div className="aa-bas">
        {!exemple && essai.piece ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="aa-piece" src={essai.piece} alt={essai.nom ?? `Une pièce de ${c.nom}`} />
        ) : (
          <span className="aa-piece vide" aria-hidden="true">
            👗
          </span>
        )}
        <div className="aa-info">
          {exemple ? (
            <>
              <small>Exemple d’essayage</small>
              <b>{essai.etat === "echec" && essai.raison ? essai.raison : "Votre pièce, prise sur votre fiche Google, arrive ici."}</b>
            </>
          ) : (
            <>
              <small>Une pièce de {c.nom}</small>
              <b>{essai.nom ?? "Prise sur votre fiche Google"}</b>
              {essai.nom && <span>Prise sur votre fiche Google</span>}
            </>
          )}
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
        <button type="button" onClick={() => ouvrir()}>
          ⤢ Voir en grand
        </button>
      </p>
      {plein_}
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
.aa-cadres.cache{visibility:hidden;}
.aa-cadre{position:relative;margin:0;aspect-ratio:2 / 3;border-radius:16px;overflow:hidden;background:#261B16;}
.aa-cadre img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.aa-badge{position:absolute;top:10px;left:10px;z-index:3;padding:6px 12px;border-radius:999px;font-size:13px;font-weight:700;
  color:#FFF4E6;background:rgba(18,12,9,.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}
.aa-badge.or{left:auto;right:10px;background:rgba(160,82,18,.88);}
.aa-revele{position:absolute;inset:0;}
.aa-revele > img{clip-path:inset(0 0 100% 0);}
.aa-revele.fini > img{clip-path:none;}
.aa-revele.joue > img{animation:aa-devoile 2.6s cubic-bezier(.65,.05,.3,1) 3s both;}
.aa-revele .aa-badge{opacity:0;}
.aa-revele.fini .aa-badge{opacity:1;}
.aa-revele.joue .aa-badge{animation:aa-arrive .5s ease-out 5.5s both;}
.aa-pendant{position:absolute;left:50%;bottom:14px;z-index:3;transform:translateX(-50%);white-space:nowrap;opacity:0;
  padding:7px 12px;border-radius:12px;background:rgba(18,12,9,.72);font-size:13px;font-weight:700;color:#FFF4E6;}
.aa-revele.joue .aa-pendant{animation:aa-pendant 3.6s ease both;}
.aa-scan{position:absolute;left:-10%;right:-10%;top:0;height:3px;z-index:2;opacity:0;pointer-events:none;
  background:linear-gradient(90deg,transparent,#FFD9A8 20%,#fff 50%,#FF8CC8 80%,transparent);
  box-shadow:0 0 18px 6px rgba(255,170,90,.55),0 0 46px 14px rgba(255,46,154,.28);}
.aa-revele.joue .aa-scan{animation:aa-balaye 2.6s cubic-bezier(.65,.05,.3,1) 3s both;}
.aa-etincelles i{position:absolute;z-index:2;width:8px;height:8px;opacity:0;border-radius:50%;
  background:radial-gradient(circle,#fff 0 30%,rgba(255,217,168,.9) 45%,transparent 70%);}
.aa-etincelles i:nth-child(1){left:22%;top:28%;}
.aa-etincelles i:nth-child(2){left:70%;top:44%;}
.aa-etincelles i:nth-child(3){left:38%;top:66%;}
.aa-etincelles i:nth-child(4){left:62%;top:82%;}
.aa-revele.joue .aa-etincelles i{animation:aa-brille 1.1s ease-out both;}
.aa-revele.joue .aa-etincelles i:nth-child(1){animation-delay:3.6s;}
.aa-revele.joue .aa-etincelles i:nth-child(2){animation-delay:4.1s;}
.aa-revele.joue .aa-etincelles i:nth-child(3){animation-delay:4.6s;}
.aa-revele.joue .aa-etincelles i:nth-child(4){animation-delay:5.1s;}
.aa-detail{margin:10px 2px 0;font-size:12px;color:#A8927F;}
.aa-detail summary{cursor:pointer;}
.aa-detail code{display:block;margin-top:6px;padding:8px 10px;border-radius:10px;background:rgba(18,12,9,.6);
  white-space:pre-wrap;word-break:break-word;font-size:11.5px;color:#CDB8A4;}
@keyframes aa-devoile{from{clip-path:inset(0 0 100% 0);}to{clip-path:inset(0 0 0 0);}}
@keyframes aa-balaye{0%{top:0;opacity:0;}8%{opacity:1;}92%{opacity:1;}100%{top:100%;opacity:0;}}
@keyframes aa-brille{0%{opacity:0;transform:scale(.2);}40%{opacity:1;transform:scale(1.6);}100%{opacity:0;transform:scale(.6);}}
@keyframes aa-arrive{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:none;}}
@keyframes aa-pendant{0%{opacity:0;}15%{opacity:1;}80%{opacity:1;}100%{opacity:0;}}
.aa-bas{display:grid;grid-template-columns:72px minmax(0,1fr);gap:12px;align-items:center;margin-top:12px;}
.aa-piece{width:72px;height:96px;border-radius:12px;object-fit:cover;background:#261B16;border:1px solid rgba(255,196,140,.16);}
.aa-piece.vide{display:grid;place-items:center;font-size:28px;border-style:dashed;}
.aa-info{display:flex;flex-direction:column;gap:3px;min-width:0;}
.aa-info small,.aa-info span{font-size:12px;color:#CDB8A4;}
.aa-info > b{font-family:var(--font-clikme),sans-serif;font-size:15px;line-height:1.3;color:#FFF4E6;}
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
.aa-pied{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px 12px;margin:10px 0 2px;font-size:12px;color:#A8927F;}
.aa-pied button{border:0;background:none;padding:4px 6px;color:#F5A23A;font:inherit;font-weight:700;cursor:pointer;}
.aa-plein{position:fixed;inset:0;z-index:89;display:flex;align-items:center;justify-content:center;
  padding:calc(env(safe-area-inset-top,0px) + 92px) 20px calc(env(safe-area-inset-bottom,0px) + 140px);}
.aa-plein-fond{position:absolute;inset:0;background:rgba(10,6,4,.84);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  animation:aa-fondu .35s ease both;}
.aa-plein.range .aa-plein-fond{animation:aa-efface .8s ease both;}
/* À LA DEMANDE DE LÉA, EN GRAND D'UN COUP : ni fondu ni montée (voir « plein »). */
.aa-plein.net:not(.range) .aa-plein-fond,.aa-plein.net .aa-plein-scene{animation:none;}
.aa-plein-scene{position:relative;display:flex;flex-direction:column;align-items:center;gap:12px;animation:aa-monte .45s cubic-bezier(.2,.8,.2,1) both;}
.aa-plein-k{margin:0;font-size:13px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#F5A23A;text-align:center;}
.aa-plein-cadres{--l:min(calc((100vh - 330px) * 2 / 3), calc((100vw - 54px) / 2), 430px);
  display:grid;grid-template-columns:repeat(2,var(--l));gap:14px;transform-origin:top left;
  transition:transform .8s cubic-bezier(.65,.05,.3,1);}
.aa-plein-cadres .aa-cadre{border-radius:22px;box-shadow:0 30px 80px rgba(0,0,0,.5);}
.aa-plein-cadres .aa-badge{top:14px;left:14px;font-size:15px;padding:8px 14px;}
.aa-plein-cadres .aa-badge.or{left:auto;right:14px;}
.aa-plein-cadres .aa-pendant{font-size:15px;bottom:20px;}
.aa-plein-pied{margin:0;font-size:12.5px;color:#BFA88F;}
.aa-plein-x{position:absolute;top:-8px;right:-8px;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,196,140,.3);
  background:rgba(18,12,9,.8);color:#FFF4E6;font-size:15px;cursor:pointer;}
.aa-plein.range .aa-plein-k,.aa-plein.range .aa-plein-pied,.aa-plein.range .aa-plein-x{opacity:0;transition:opacity .25s;}
/* SUR UN TÉLÉPHONE, UNE SEULE GRANDE IMAGE. Côte à côte, les deux photos
   n'avaient que 168 px de large : l'effet se perdait. Le cadre de l'après
   porte déjà l'avant sous lui — on voit la personne, puis le balayage
   l'habille, au même endroit et en grand. L'avant à part revient dans la page. */
@media (max-width:620px){
  .aa-plein{padding-left:16px;padding-right:16px;}
  .aa-plein-k{padding:0 40px;font-size:11.5px;letter-spacing:.14em;}
  .aa-plein-cadres{--l:min(calc((100vh - 360px) * 2 / 3), calc(100vw - 48px), 430px);grid-template-columns:var(--l);}
  .aa-plein-cadres .aa-cadre:not(.apres){display:none;}
  .aa-plein-cadres .aa-cadre.apres::before{content:"Avant";position:absolute;top:14px;left:14px;z-index:1;padding:8px 14px;border-radius:999px;
    font-size:15px;font-weight:700;color:#FFF4E6;background:rgba(18,12,9,.62);animation:aa-sort .3s ease 3s forwards;}
}
@keyframes aa-sort{to{opacity:0;}}
@keyframes aa-fondu{from{opacity:0;}to{opacity:1;}}
@keyframes aa-efface{from{opacity:1;}to{opacity:0;}}
@keyframes aa-monte{from{opacity:0;transform:scale(.94);}to{opacity:1;transform:none;}}
@media (prefers-reduced-motion:reduce){
  .aa-revele.joue > img,.aa-revele.joue .aa-scan,.aa-revele.joue .aa-etincelles i,.aa-mot.joue .aa-onde i,.aa-revele.joue .aa-badge,.aa-revele.joue .aa-pendant{animation:none;}
  .aa-revele > img{clip-path:none;}
  .aa-revele .aa-badge{opacity:1;}
  .aa-plein-cadres{transition:none;}
}
`,
      }}
    />
  );
}
