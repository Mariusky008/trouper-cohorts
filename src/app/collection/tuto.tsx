"use client";

/**
 * 🧭 LE TUTO DE CLIKME — 9 novembre 2026, le propriétaire : « quand je clique sur le logo ClikMe, je devrais avoir plutôt
 * un tuto des pages et des fonctionnalités ; tous les Pablito qui expliquent par page, comme ça ils peuvent disparaître
 * des pages et libérer un peu de place » ; puis : « la première fois, juste un message de bienvenue ; et pour tout le
 * reste : si tu as besoin de plus d'infos, tu pourras toujours cliquer ici ». La maquette et chaque texte sont validés
 * le même jour (le canvas « Le tuto »).
 *
 *   · LA BIENVENUE : à la toute première arrivée (pas encore de figurine), une seule fois sur ce téléphone, trois
 *     bulles ; à la troisième, la lumière se pose sur le logo (« Touche ici, quand tu veux ») ; puis « Je crée ma
 *     figurine ». Les pages n'ouvrent plus aucune fenêtre d'elles-mêmes.
 *   · LA VISITE (un toucher sur le logo) : une carte par page, « Vue » une fois visitée ; un point rose sur le logo
 *     jusqu'à la première visite.
 *   · UNE PAGE : Pablito la montre SUR LA VRAIE PAGE — l'écran s'assombrit, sauf ce dont il parle ; sa voix (les
 *     enregistrements du patron, `TUTO_ENREGISTRES` dans `lib/direct/guide.ts` : une bulle sans enregistrement s'écrit
 *     sans voix) ; « Suivant », « Passer » ; à la fin, la page suivante.
 * Ce qu'il montre est cherché dans la page (`cible`, des sélecteurs ; `sinon`, si rien de la cible n'est à l'écran).
 * Rien du tout (une page vide, pas encore de figurine) : la bulle parle sans lumière.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { SONS_PABLITO } from "@/lib/direct/guide";
import { Guide, useVoixBulle, type Visage } from "./guide";

export type PageTuto = "creer" | "decouvrir" | "autour" | "memes" | "proches" | "moi";
/** Les vues de `ma-collection.tsx` où vit chaque page. */
export type VueTuto = "figurine" | "decouvrir" | "autour" | "memes" | "proches" | "personnage";
/** (`son` : l'enregistrement de cette bulle, s'il n'est pas « tuto-<page>-<rang> » — une bulle déplacée, ou réécrite et
 * pas encore enregistrée : elle s'écrit alors sans voix) */
export type EtapeTuto = { t: string; v: Visage; cible?: string[]; sinon?: string[]; son?: string };

/** 👋 La bienvenue : trois bulles, la dernière montre le logo. */
export const BIENVENUE: EtapeTuto[] = [
  { t: "Salut ! Moi, c’est Pablito, le patron de ClikMe. Bienvenue !", v: "joie" },
  { t: "Ici, tu fabriques ta figurine à partir d’un selfie, et c’est elle qui parle à ta place. C’est gratuit, et ça prend une minute.", v: "euphorie" },
  { t: "Besoin de plus d’infos sur les fonctionnalités ? Touche ici, quand tu veux : je te fais visiter.", v: "joie", cible: [".mc-barre .mc-logo"] },
];
/** Sa bulle, en haut de la visite. */
export const VISITE_DIT = "Je te fais visiter ? Touche une page : je te la montre sur place.";

/** 🗺️ Les pages, dans l'ordre de la visite : ce qu'on y fait, et ce que Pablito y montre. */
export const PAGES_TUTO: { cle: PageTuto; vue: VueTuto; nom: string; dit: string; etapes: EtapeTuto[] }[] = [
  {
    cle: "creer",
    vue: "figurine",
    nom: "Créer",
    dit: "Fais parler ta figurine : sa tête, son attitude, trois façons de le dire.",
    etapes: [
      // (9 novembre 2026, « Créer » en trois étapes : « Visage » et « Animer » ont quitté le dessous de la figurine — les
      // bulles suivent les étapes ; la dernière est réécrite, en attendant son enregistrement : `tuto-creer-4b`)
      { t: "Ici, tu fais parler ta figurine. Écris ta phrase, ou dis-la avec ta voix.", v: "joie", cible: ["#o-figurine .tf-etape-1"], sinon: ["#o-figurine #creer"] },
      { t: "Pas d’idée ? Choisis ce que tu veux dire, et je te propose trois façons : en BD, en film ou en affiche.", v: "joie", cible: ["#o-figurine .tr-intentions", "#o-figurine .tr-choix"], sinon: ["#o-figurine .tf-etape-2"], son: "tuto-creer-3" },
      { t: "« Visage » : choisis l’émotion que tu veux faire passer… ou l’attitude : la tête dans les mains, bras croisés, victorieux…", v: "euphorie", cible: ["#o-figurine .tf-sa-tete"], son: "tuto-creer-2" },
      { t: "Choisis sa voix, fais-la danser si tu veux… puis touche « Créer mon mème » : il part où tu veux.", v: "rire", cible: ["#o-figurine .tf-etape-3", "#o-figurine .tf-envoi"], son: "tuto-creer-4b" },
    ],
  },
  {
    cle: "decouvrir",
    vue: "decouvrir",
    nom: "Découvrir",
    dit: "Le mème du jour, et ceux des gens de ta ville.",
    etapes: [
      { t: "Chaque jour, un mème du jour : le même thème pour tout le monde. Réponds-y avec ta figurine !", v: "euphorie", cible: ["#o-decouvrir .dv-jour-carte"], sinon: ["#o-decouvrir .dv-jour"] },
      { t: "Glisse vers le haut : voilà les mèmes des gens de ta ville.", v: "joie", cible: ["#o-decouvrir .dv-glisse"], sinon: ["#o-decouvrir .dv-fil .dv-carte"] },
      { t: "Ça te fait rire ? Dis-le d’un toucher… ou réponds en duo : ta figurine à côté de la sienne.", v: "rire", cible: ["#o-decouvrir .dv-fil .dv-rail"] },
    ],
  },
  {
    cle: "autour",
    vue: "autour",
    nom: "Autour",
    dit: "La carte de ta ville : dépose un mème dans un lieu.",
    etapes: [
      { t: "Autour, c’est la carte de ta ville, avec les mèmes que les gens ont laissés dans les lieux.", v: "joie", cible: ["#o-autour .atr-carte-fond"] },
      { t: "Cherche un endroit, la gare, les arènes… et dépose le tien, pour ceux qui passent par là.", v: "euphorie", cible: ["#o-autour .atr-recherche"] },
      { t: "Un mème te plaît ? Réponds-lui avec ta tête, ou ajoute la personne à tes proches.", v: "joie", cible: ["#o-autour .atr-dernier"], sinon: ["#o-autour .atr-feuille"] },
    ],
  },
  {
    cle: "memes",
    vue: "memes",
    nom: "Mes mèmes",
    dit: "Qui a vu tes mèmes, et qui t’a répondu.",
    etapes: [
      { t: "Ici, tous tes mèmes : combien de fois ils ont été vus, et qui t’a répondu.", v: "joie", cible: ['#o-memes section[aria-label="Mes mèmes"] .mm-carte'], sinon: ["#o-memes .mm-vide"] },
      { t: "Ceux qu’on t’envoie t’attendent ici aussi. Et un mème que tu regrettes, tu peux l’effacer.", v: "neutre", cible: ['#o-memes section[aria-label="Reçus"]'], sinon: ["#o-memes .mm-effacer"] },
    ],
  },
  {
    cle: "proches",
    vue: "proches",
    nom: "Proches",
    dit: "Le talkie-walkie : tu parles, ta figurine traduit.",
    etapes: [
      { t: "Proches, c’est ton talkie-walkie : les figurines de tes amis vivent ici.", v: "joie", cible: ["#o-proches .pr-grille"], sinon: ["#o-proches .pr-vide"] },
      { t: "Touche « Lui parler » et parle vingt secondes : ta figurine écrit tes sous-titres et fait les bonnes têtes.", v: "euphorie", cible: ["#o-proches .pr-lui-parler"] },
      { t: "Ton ami n’a pas ClikMe ? Envoie-lui ton message par WhatsApp : il te répond avec sa figurine.", v: "joie", cible: ["#o-proches .pr-wa"] },
    ],
  },
  {
    cle: "moi",
    vue: "personnage",
    nom: "Moi, sous ton prénom",
    dit: "Ta carte de personnage, et tes réglages.",
    etapes: [
      { t: "Sous ton prénom, en haut : ta carte de personnage. Sept questions, et je devine qui tu es.", v: "euphorie", cible: ["#o-personnage .pc-scene"], sinon: [".mc-barre .mc-moi"] },
      { t: "Et tes réglages : les notifications, sauvegarder ta figurine, la refaire.", v: "joie", cible: ["#o-personnage .ct-moi"], sinon: [".mc-barre .mc-cadenas"] },
    ],
  },
];
export const pageTuto = (cle: PageTuto) => PAGES_TUTO.find((p) => p.cle === cle)!;
/** À peu près le temps de sa visite (pour la carte : « ▶ 30 s »). */
const duree = (etapes: EtapeTuto[]) => Math.max(10, Math.round(etapes.reduce((s, e) => s + e.t.length, 0) / 14 / 5) * 5);
/** Son enregistrement pour cette bulle (`tuto-creer-2`…), s'il est arrivé. */
const sonDe = (nom: string) => SONS_PABLITO[nom];

// ─── ce qu'on retient sur ce téléphone ───────────────────────────────────────────────────────────
export type SouvenirTuto = { bienvenue: boolean; visite: boolean; vues: PageTuto[] };
const CLES = { bienvenue: "clikme-tuto-bienvenue", visite: "clikme-tuto-visite", vues: "clikme-tuto-vues" } as const;
/** (l'ancien accueil de Pablito, déjà vu : pas de bienvenue — il connaît Pablito) */
const ANCIEN_ACCUEIL = "clikme-clik-pablito-accueil";
export function lireTuto(): SouvenirTuto {
  try {
    if (typeof window === "undefined") return { bienvenue: false, visite: false, vues: [] };
    const s = window.localStorage;
    const vues = JSON.parse(s.getItem(CLES.vues) || "[]") as unknown;
    return {
      bienvenue: Boolean(s.getItem(CLES.bienvenue) || s.getItem(ANCIEN_ACCUEIL)),
      visite: Boolean(s.getItem(CLES.visite)),
      vues: Array.isArray(vues) ? vues.filter((v): v is PageTuto => PAGES_TUTO.some((p) => p.cle === v)) : [],
    };
  } catch {
    return { bienvenue: false, visite: false, vues: [] };
  }
}
export function ecrireTuto(s: SouvenirTuto): void {
  try {
    if (s.bienvenue) window.localStorage.setItem(CLES.bienvenue, "1");
    if (s.visite) window.localStorage.setItem(CLES.visite, "1");
    window.localStorage.setItem(CLES.vues, JSON.stringify(s.vues));
  } catch {
    /* (navigation privée : on ne retient rien, ce n'est pas grave) */
  }
}

// ─── la lumière : ce dont il parle ───────────────────────────────────────────────────────────────
type Boite = { x: number; y: number; l: number; h: number };
const MARGE = 6;
/** Le premier élément à l'écran pour chaque sélecteur, et la boîte qui les entoure tous. */
function trouver(selecteurs: string[] | undefined): { boite: Boite; el: HTMLElement } | null {
  if (!selecteurs?.length) return null;
  let premier: HTMLElement | null = null;
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const sel of selecteurs) {
    let el: HTMLElement | null = null;
    try {
      el = [...document.querySelectorAll<HTMLElement>(sel)].find((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }) ?? null;
    } catch {
      el = null;
    }
    if (!el) continue;
    premier ??= el;
    const r = el.getBoundingClientRect();
    x1 = Math.min(x1, r.left);
    y1 = Math.min(y1, r.top);
    x2 = Math.max(x2, r.right);
    y2 = Math.max(y2, r.bottom);
  }
  if (!premier) return null;
  return { el: premier, boite: { x: x1 - MARGE, y: y1 - MARGE, l: x2 - x1 + 2 * MARGE, h: y2 - y1 + 2 * MARGE } };
}
const pareil = (a: Boite | null, b: Boite | null) => (!a || !b ? a === b : Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.l - b.l) < 1 && Math.abs(a.h - b.h) < 1);

/**
 * 💡 UNE BULLE DE PABLITO, PAR-DESSUS LA VRAIE PAGE : la lumière sur ce dont il parle (cherchée sans cesse : la page se
 * charge, défile, change de taille), sa bulle tapée lettre après lettre, sa voix. Remontée à chaque bulle (`key`).
 */
function Pas({
  etape,
  son,
  titre,
  rang,
  total,
  dernier,
  grand,
  onSuite,
  onPasser,
  fin,
}: {
  etape: EtapeTuto;
  son?: string;
  titre: string;
  rang: number;
  total: number;
  dernier: boolean;
  grand: boolean;
  onSuite: () => void;
  onPasser: () => void;
  fin: ReactNode;
}) {
  const [boite, setBoite] = useState<Boite | null>(null);
  const [n, setN] = useState(0);
  const [reduit] = useState(() => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches));
  const voix = useVoixBulle(son);
  const suivant = useRef<HTMLButtonElement>(null);
  const texte = etape.t;
  const vu = reduit ? texte.length : n;
  const tape = vu < texte.length;

  // la lumière : cherchée tout de suite, puis sans cesse (un onglet qui se charge, une page qui défile)
  useEffect(() => {
    if (!etape.cible?.length) return;
    let amene = false;
    const mesurer = () => {
      const t = trouver(etape.cible) ?? trouver(etape.sinon);
      if (t && !amene) {
        amene = true;
        // (hors de l'écran, ou sous la barre du haut : on l'amène au milieu)
        const r = t.el.getBoundingClientRect();
        if (r.top < 64 || r.bottom > window.innerHeight - 110) t.el.scrollIntoView({ behavior: reduit ? "auto" : "smooth", block: r.height > window.innerHeight * 0.6 ? "start" : "center" });
      }
      const b = t?.boite ?? null;
      setBoite((avant) => (pareil(avant, b) ? avant : b));
    };
    const premiere = window.requestAnimationFrame(mesurer);
    const encore = window.setInterval(mesurer, 150);
    return () => {
      window.cancelAnimationFrame(premiere);
      window.clearInterval(encore);
    };
  }, [etape, reduit]);

  // la bulle se tape, deux lettres à la fois
  useEffect(() => {
    if (reduit || n >= texte.length) return;
    const t = window.setTimeout(() => setN((x) => Math.min(texte.length, x + 2)), 22);
    return () => window.clearTimeout(t);
  }, [n, texte.length, reduit]);

  // « Échap » : passer ; le bouton « Suivant » prend la main
  const passer = useRef(onPasser);
  useEffect(() => {
    passer.current = onPasser;
  });
  useEffect(() => {
    suivant.current?.focus({ preventScroll: true });
    const echap = (e: KeyboardEvent) => e.key === "Escape" && passer.current();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, []);

  const avancer = () => {
    if (tape) return setN(texte.length);
    if (!dernier) onSuite();
  };
  // (un toucher n'importe où : sa voix si le téléphone l'a bloquée, sinon la suite)
  const toucherFond = () => {
    if (voix.bloque) return voix.rejouer();
    avancer();
  };

  // très grande (la carte d'« Autour ») : pas de lumière, un voile léger
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const vw = typeof window !== "undefined" ? window.innerWidth : 400;
  const enGrand = boite && boite.l * boite.h > vw * vh * 0.55;
  const lumiere = boite && !enGrand ? boite : null;
  const place = !lumiere ? (grand ? "centre" : "bas") : lumiere.y + lumiere.h / 2 > vh / 2 ? "haut" : "bas";
  const style = lumiere ? ({ left: lumiere.x, top: lumiere.y, width: lumiere.l, height: lumiere.h } as CSSProperties) : undefined;
  return (
    <div className="tu" role="dialog" aria-modal="true" aria-label={`Pablito : ${titre}`} onClick={toucherFond} data-rang={rang} data-lumiere={lumiere ? "oui" : "non"}>
      {lumiere ? <div className="tu-lumiere" style={style} aria-hidden="true" /> : <div className={`tu-voile${enGrand ? " doux" : ""}`} aria-hidden="true" />}
      <div className={`tu-carte ${place}${place === "centre" ? " grand" : ""}`} onClick={(e) => e.stopPropagation()}>
        <span className="tu-pablito">
          <Guide visage={etape.v} parle={tape || voix.parle} salue={place === "centre" && rang === 1} />
        </span>
        <div className="tu-dit">
          <small className="tu-qui">
            Pablito{titre ? ` · ${titre}` : ""}
            {total > 1 ? ` · ${rang} / ${total}` : ""}
          </small>
          <p className="tu-texte" aria-live="polite">
            {texte.slice(0, vu)}
            {tape && <i className="tu-curseur" aria-hidden="true" />}
          </p>
          {voix.bloque && (
            <button type="button" className="tu-ecouter" onClick={voix.rejouer}>
              🔊 Touche pour l’entendre
            </button>
          )}
        </div>
        <div className="tu-gestes">
          {!dernier && (
            <button type="button" className="tu-passer" onClick={onPasser}>
              Passer
            </button>
          )}
          {dernier && !tape ? (
            fin
          ) : (
            <button type="button" className="tu-suivant" ref={suivant} onClick={avancer}>
              Suivant ›
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** 👋 LA BIENVENUE, à la toute première arrivée : trois bulles, la lumière sur le logo, puis « Je crée ma figurine ». */
export function BienvenueTuto({ onFini, onCreer }: { onFini: () => void; onCreer: () => void }) {
  const [i, setI] = useState(0);
  return (
    <Pas
      key={i}
      etape={BIENVENUE[i]}
      son={sonDe(`tuto-bienvenue-${i + 1}`)}
      titre=""
      rang={i + 1}
      total={BIENVENUE.length}
      dernier={i === BIENVENUE.length - 1}
      grand
      onSuite={() => setI((x) => Math.min(BIENVENUE.length - 1, x + 1))}
      onPasser={onFini}
      fin={
        <span className="tu-fin">
          <button type="button" className="tu-suivant tu-creer" onClick={onCreer}>
            📸 Je crée ma figurine
          </button>
        </span>
      }
    />
  );
}

/** 💡 PABLITO MONTRE UNE PAGE, sur la vraie page ; à la fin, la page suivante (ou « C'est compris »). */
export function PageEnVisite({ page, onVue, onSuivante, onFermer }: { page: PageTuto; onVue: (p: PageTuto) => void; onSuivante: (p: PageTuto) => void; onFermer: () => void }) {
  const [i, setI] = useState(0);
  const p = pageTuto(page);
  const k = PAGES_TUTO.findIndex((x) => x.cle === page);
  const suivante = PAGES_TUTO[k + 1];
  return (
    <Pas
      key={`${page}-${i}`}
      etape={p.etapes[i]}
      son={sonDe(p.etapes[i].son ?? `tuto-${page}-${i + 1}`)}
      titre={p.nom}
      rang={i + 1}
      total={p.etapes.length}
      dernier={i === p.etapes.length - 1}
      grand={false}
      onSuite={() => setI((x) => Math.min(p.etapes.length - 1, x + 1))}
      onPasser={onFermer}
      fin={
        <span className="tu-fin">
          <button
            type="button"
            className="tu-passer"
            onClick={() => {
              onVue(page);
              onFermer();
            }}
          >
            C’est compris
          </button>
          {suivante && (
            <button
              type="button"
              className="tu-suivant"
              onClick={() => {
                onVue(page);
                onSuivante(suivante.cle);
              }}
            >
              La suite : {suivante.nom.split(",")[0]} ›
            </button>
          )}
        </span>
      }
    />
  );
}

/** 🗺️ LA VISITE (un toucher sur le logo) : sa bulle, où il en est, une carte par page, « Tout visiter ». */
export function VisiteTuto({ ouverte, vues, icone, onPage }: { ouverte: boolean; vues: PageTuto[]; icone: (p: PageTuto) => ReactNode; onPage: (p: PageTuto) => void }) {
  const voix = useVoixBulle(sonDe("tuto-visite-1"), ouverte);
  const faites = PAGES_TUTO.filter((p) => vues.includes(p.cle)).length;
  const prochaine = PAGES_TUTO.find((p) => !vues.includes(p.cle)) ?? PAGES_TUTO[0];
  return (
    <div className="tu-som">
      <div className="tu-som-pablito">
        <span className="tu-pablito">
          <Guide visage="joie" parle={voix.parle} />
        </span>
        <p>
          {VISITE_DIT}
          {voix.bloque && (
            <button type="button" className="tu-ecouter" onClick={voix.rejouer}>
              🔊 Touche pour l’entendre
            </button>
          )}
        </p>
      </div>
      <div className="tu-som-progres">
        <span aria-hidden="true">
          <i style={{ width: `${(100 * faites) / PAGES_TUTO.length}%` }} />
        </span>
        <small>
          {faites} page{faites > 1 ? "s" : ""} vue{faites > 1 ? "s" : ""} sur {PAGES_TUTO.length}
        </small>
      </div>
      <ul className="tu-pages">
        {PAGES_TUTO.map((p) => {
          const vue = vues.includes(p.cle);
          return (
            <li key={p.cle}>
              <button type="button" className={`tu-page${vue ? " vue" : ""}`} data-page={p.cle} onClick={() => onPage(p.cle)}>
                <span className="tu-page-ico" aria-hidden="true">
                  {icone(p.cle)}
                </span>
                <span className="tu-page-txt">
                  <b>{p.nom}</b>
                  <small>{p.dit}</small>
                </span>
                <span className="tu-page-etat">{vue ? "✓ Vue" : `▶ ${duree(p.etapes)} s`}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="og-go tu-tout" onClick={() => onPage(prochaine.cle)}>
        ▶ {faites ? "Continuer la visite" : "Tout visiter, page par page"}
      </button>
    </div>
  );
}

export const STYLES_TUTO = `
.tu{position:fixed;inset:0;z-index:1100;cursor:pointer;-webkit-tap-highlight-color:transparent}
.tu-voile{position:fixed;inset:0;background:rgba(10,3,8,.8);animation:tu-voile .25s ease-out}
.tu-voile.doux{background:rgba(10,3,8,.3)}
.tu-lumiere{position:fixed;border-radius:18px;pointer-events:none;box-shadow:0 0 0 200vmax rgba(10,3,8,.8),0 0 0 3px #FF2E9A,0 0 28px 6px rgba(255,46,154,.6);
  transition:left .35s cubic-bezier(.2,.9,.3,1),top .35s cubic-bezier(.2,.9,.3,1),width .35s cubic-bezier(.2,.9,.3,1),height .35s cubic-bezier(.2,.9,.3,1);animation:tu-voile .25s ease-out}
.tu-carte{position:fixed;left:12px;right:12px;max-width:460px;margin:0 auto;display:grid;grid-template-columns:60px minmax(0,1fr);align-items:start;gap:10px 12px;padding:14px 14px 12px;box-sizing:border-box;
  border-radius:24px;background:linear-gradient(180deg,#3A1230,#22091B);border:1.5px solid rgba(255,46,154,.55);box-shadow:0 26px 60px -18px rgba(0,0,0,.95);cursor:default;animation:tu-entre .35s cubic-bezier(.2,1.3,.4,1)}
.tu-carte.bas{bottom:calc(14px + env(safe-area-inset-bottom))}
.tu-carte.haut{top:calc(12px + env(safe-area-inset-top))}
.tu-carte.centre{top:50%;transform:translateY(-50%);grid-template-columns:minmax(0,1fr);justify-items:center;text-align:center;padding:22px 18px 16px;animation:tu-entre-c .45s cubic-bezier(.2,1.3,.4,1)}
.tu-pablito{display:block;width:60px}
.tu-pablito .mq-cadre{aspect-ratio:1;border-radius:50%;box-shadow:0 0 0 2px rgba(255,46,154,.7)}
.tu-pablito .mq-i{object-position:50% 10%;transform:scale(1.7);transform-origin:50% 18%}
.tu-carte.grand .tu-pablito{width:min(170px,46vw)}
.tu-carte.grand .tu-pablito .mq-cadre{aspect-ratio:852/1024;border-radius:26px;box-shadow:0 16px 30px -14px rgba(0,0,0,.85),0 0 0 2px rgba(255,255,255,.14)}
.tu-carte.grand .tu-pablito .mq-i{object-position:50% 40%;transform:scale(1.04);transform-origin:50% 50%}
.tu-dit{display:flex;flex-direction:column;gap:6px;min-width:0}
.tu-carte.grand .tu-dit{align-items:center}
.tu-qui{font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#FF8FCB}
.tu-texte{margin:0;min-height:2.8em;font-size:16px;line-height:1.4;font-weight:700;color:#FFF4E6}
.tu-carte.grand .tu-texte{font-size:17.5px}
.tu-curseur{display:inline-block;width:2px;height:1em;margin-left:2px;vertical-align:-2px;background:#FF2E9A;animation:tu-curseur .6s steps(1) infinite}
.tu-ecouter{align-self:flex-start;margin-top:2px;padding:6px 12px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:12.5px;font-weight:900;cursor:pointer}
.tu-gestes{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%}
.tu-fin{display:flex;flex:1;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.tu-carte.grand .tu-fin{justify-content:center}
.tu-passer{min-height:44px;padding:0 8px;border:0;background:none;color:#CDB4C0;font:inherit;font-size:14px;font-weight:800;cursor:pointer}
.tu-suivant{margin-left:auto;min-height:46px;padding:0 20px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:15px;font-weight:900;cursor:pointer;box-shadow:0 10px 22px -10px rgba(255,46,154,.95)}
.tu-creer{margin:0 auto;padding:0 26px;font-size:16px}
.tu-suivant:focus-visible,.tu-passer:focus-visible{outline:2px solid #FFF4E6;outline-offset:2px}
/* 🗺️ la visite */
.tu-som{display:flex;flex-direction:column;gap:12px}
.tu-som-pablito{display:flex;align-items:flex-end;gap:10px}
.tu-som-pablito .tu-pablito{flex:none;width:56px}
.tu-som-pablito p{display:flex;flex-direction:column;gap:6px;margin:0;padding:10px 13px;border-radius:18px 18px 18px 6px;background:#FFF4E6;color:#2A0F1F;font-size:14.5px;font-weight:700;line-height:1.38}
.tu-som-progres{display:flex;align-items:center;gap:10px}
.tu-som-progres > span{flex:1;height:6px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
.tu-som-progres i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B)}
.tu-som-progres small{font-size:12.5px;font-weight:700;color:#CDB4C0;white-space:nowrap}
.tu-pages{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}
.tu-page{display:flex;align-items:center;gap:12px;width:100%;min-height:66px;padding:9px 12px;box-sizing:border-box;border-radius:20px;border:1.5px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);color:#FFF4E6;font:inherit;text-align:left;cursor:pointer}
.tu-page:hover{border-color:rgba(255,46,154,.55)}
.tu-page-ico{display:grid;place-items:center;flex:none;width:44px;height:44px;border-radius:14px;background:rgba(255,46,154,.14);color:#FF8FCB}
.tu-page-txt{display:flex;flex:1;flex-direction:column;gap:1px;min-width:0}
.tu-page-txt b{font-size:15px;font-weight:900}
.tu-page-txt small{font-size:12.5px;line-height:1.35;color:#CDB4C0}
.tu-page-etat{flex:none;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.08);color:#FFC2E3;font-size:12px;font-weight:900;white-space:nowrap}
.tu-page.vue .tu-page-etat{background:rgba(61,220,132,.14);color:#7FE8AE}
.tu-tout{border:0;font:inherit;font-weight:900;cursor:pointer}
@keyframes tu-voile{from{opacity:0}}
@keyframes tu-entre{from{opacity:0;transform:translateY(14px) scale(.97)}}
@keyframes tu-entre-c{from{opacity:0;transform:translateY(calc(-50% + 24px)) scale(.95)}}
@keyframes tu-curseur{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){.tu *,.tu-som *{animation:none!important;transition:none!important}}
`;
