"use client";

/**
 * 🎭 L'ÉCRAN DE CLIKME (`/collection`) — en ONGLETS depuis le 5 novembre 2026 ; RESSERRÉ SUR LE MÈME le 7 novembre 2026
 * (le patron : « le concept part un peu dans tous les sens » ; « la page album, on a du mal à voir à quoi elle sert » ;
 * « “où les gagner”, ce n'est pas clair du tout »). Une seule question pour chaque écran : est-ce qu'il aide à faire un
 * mème, ou donne une raison d'en envoyer un ? Le menu en bas, comme les applis de vidéos que tout le monde connaît
 * (l'étape 2, le même jour : « Découvrir » est arrivé) :
 *   🔥 DÉCOUVRIR — les mèmes du jour des commerçants de sa ville (`decouvrir.tsx`) ;
 *   💬 RENCONTRES — l'épisode du jour (`rencontre.tsx`), et sa figurine du mois qui s'y mérite (`figurine-du-mois.tsx`) ;
 *   🎭 CRÉER, au milieu, en gros — sa figurine qui parle (`ma-figurine.tsx`) : ses looks, ses mèmes prêts, le duo ;
 *   📥 MES MÈMES — ce que ses mèmes deviennent : vus, les réponses en duo, ceux qu'il a reçus (`mes-memes.tsx`) ;
 *   🃏 MOI — sa carte de personnage (c'est elle qui fait parler ses épisodes), la question du jour (`personnage.tsx`).
 * « Ce mois-ci » et l'album des commerçants sont partis de l'appli (les cartes de fidélité commencées restent sur la page
 * de chaque commerçant, `/f/<slug>`) ; ses figurines du mois sont devenues des LOOKS de son studio.
 * Chaque onglet a son adresse (`#decouvrir`, `#rencontre`, `#figurine`, `#memes`, `#personnage`), et les anciens liens
 * retombent sur le bon (`#creer` → « Créer », `#mois` → sa figurine du mois, dans « Rencontres », `#album` → « Mes mèmes »).
 * 📲 LE LOT 3 : l'appli sur l'écran d'accueil et le mème du jour à 11 h 30 (`mon-telephone.tsx`) — `#jour` mène au mème
 * du jour (la notification), `#installer` ouvre le geste à faire (iPhone, après le rechargement avec son jeton).
 * Un onglet ne se charge qu'à sa première ouverture, puis il reste là.
 */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { OngletFigurine, STYLES_MA_FIGURINE } from "./ma-figurine";
import { OngletVisible } from "./guide";
import { MonPersonnage, STYLES_PERSONNAGE } from "./personnage";
import { RencontreDuJour, STYLES_RENCONTRE } from "./rencontre";
import { STYLES_CONNAITRE } from "./connaitre";
import { MaFigurineDuMois, STYLES_FIGURINE_DU_MOIS } from "./figurine-du-mois";
import { MesMemes, STYLES_MES_MEMES } from "./mes-memes";
import { Decouvrir, STYLES_DECOUVRIR } from "./decouvrir";
import { STYLES_MES_REACTIONS } from "./mes-reactions";
import { STYLES_THEME_DU_JOUR } from "./theme-du-jour";
import { FeuilleInstaller, MonTelephone, STYLES_MON_TELEPHONE } from "./mon-telephone";
import { capterLaProposition, lierSiBesoin, ouvrirInstallation } from "@/lib/direct/appli-collection";
import type { EtatMaFigurine } from "@/lib/direct/ma-figurine";

/** Le menu du bas : cinq boutons, « Créer » au milieu. */
const MENU = [
  { cle: "decouvrir", nom: "Découvrir" },
  { cle: "rencontre", nom: "Rencontres" },
  { cle: "figurine", nom: "Créer" },
  { cle: "memes", nom: "Mes mèmes" },
  { cle: "personnage", nom: "Moi" },
] as const;
type Onglet = (typeof MENU)[number]["cle"];
type Vue = Onglet;
/** Les adresses qui mènent à une vue (et, pour certaines, à un endroit dedans). */
const ALIAS: Record<string, Vue> = {
  decouvrir: "decouvrir",
  moi: "personnage",
  figurine: "figurine",
  creer: "figurine",
  // (🔥 le mème du jour, en haut de « Créer » : là où mène la notification de 11 h 30)
  jour: "figurine",
  // (⚡ ses réactions, en haut de « Créer » : là où l'app installée pourra s'ouvrir)
  reactions: "figurine",
  personnage: "personnage",
  rencontre: "rencontre",
  rencontres: "rencontre",
  // (sa figurine du mois se mérite dans « Rencontres » : elle y est)
  mois: "rencontre",
  edition: "rencontre",
  "ou-gagner": "rencontre",
  memes: "memes",
  album: "memes",
};
const CLE_VUE = "clikme-rencontre-vue";
const aujourdhuiParis = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

export function MaCollection({ villes = [] }: { villes?: { slug: string; nom: string }[] }) {
  const [etat, setEtat] = useState<EtatMaFigurine | null>(null);
  const [charge, setCharge] = useState(false);
  const [vue, setVue] = useState<Vue>("figurine");
  const [ouverts, setOuverts] = useState<Set<Vue>>(() => new Set(["figurine"]));
  // (sa carte faite ou refaite : la rencontre du jour se recharge ; et le menu sait s'il en a une)
  const [versionCarte, setVersionCarte] = useState(0);
  const [aCarte, setACarte] = useState<boolean | null>(null);
  const [rencontreVue, setRencontreVue] = useState(true);
  // (stable : la fabrication rappelle le serveur dans un effet qui en dépend)
  const poserEtat = useCallback((e: EtatMaFigurine) => setEtat(e), []);

  useEffect(() => {
    let fini = false;
    // 📲 (Android : la proposition d'installer arrive quand le téléphone le décide ; on la garde pour le bon moment.
    // iPhone : l'appli posée s'ouvre pour la première fois avec son jeton, qui lui rend SA figurine.)
    capterLaProposition();
    void lierSiBesoin();
    fetch("/api/direct/ma-figurine", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { etat?: EtatMaFigurine }) => {
        if (fini) return;
        setEtat(j.etat ?? null);
        setCharge(true);
      })
      .catch(() => {
        if (fini) return;
        setCharge(true);
      });
    // (après le premier rendu : la page est aussi rendue sur le serveur, qui ne sait rien de l'appareil)
    void Promise.resolve().then(() => {
      try {
        if (!fini) setRencontreVue(window.localStorage.getItem(CLE_VUE) === aujourdhuiParis());
      } catch {
        /* rien de gardé */
      }
    });
    return () => {
      fini = true;
    };
  }, []);

  /** Ouvre une vue ; `ancre` : un endroit dedans (« creer », « mois »). */
  const aller = useCallback((v: Vue, ancre?: string, garderDefilement = false) => {
    setVue(v);
    setOuverts((o) => (o.has(v) ? o : new Set([...o, v])));
    try {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${ancre ?? v}`);
    } catch {
      /* rien */
    }
    if (v === "rencontre") {
      setRencontreVue(true);
      try {
        window.localStorage.setItem(CLE_VUE, aujourdhuiParis());
      } catch {
        /* rien */
      }
    }
    // (un endroit dedans : il peut arriver un peu après, le temps que l'onglet se charge)
    let essais = 0;
    const defiler = () => {
      const el = ancre && ancre !== v ? document.getElementById(ancre) : null;
      if (el) return el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (ancre && ancre !== v && ++essais < 12) return void window.setTimeout(defiler, 250);
      if (!garderDefilement && essais === 0) window.scrollTo({ top: 0 });
    };
    window.setTimeout(defiler, 60);
  }, []);
  const allerA = useCallback((o: string) => {
    const v = ALIAS[o];
    if (v) aller(v, o);
  }, [aller]);

  // l'adresse décide de la vue (à l'arrivée, et quand un lien de la page change l'ancre)
  useEffect(() => {
    const lire = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      const v = ALIAS[h];
      if (v) aller(v, h, false);
      // 📲 la page s'est rechargée avec son jeton, juste avant d'installer (iPhone) : le geste à faire
      else if (h === "installer") ouvrirInstallation();
      // le lien d'un ami (`?ami=<code>`) : droit aux rencontres
      else if (new URLSearchParams(window.location.search).get("ami")) aller("rencontre");
    };
    lire();
    window.addEventListener("hashchange", lire);
    return () => window.removeEventListener("hashchange", lire);
  }, [aller]);

  const onglet = vue;
  const compte = charge ? Boolean(etat?.compte) : null;
  const prete = etat?.etape === "prete";
  // ce qui attend dans chaque onglet (un point qui pulse)
  const pastilles: Partial<Record<Onglet, string>> = {
    ...(charge && !prete && etat?.etape !== "fabrication" ? { figurine: "!" } : {}),
    ...(compte && !rencontreVue ? { rencontre: "1" } : {}),
    ...(compte && aCarte === false ? { personnage: "!" } : {}),
  };

  return (
    <main className="mc">
      <header className="mc-barre">
        <Link className="mc-logo" href="/">
          Clik<b>Me</b>
        </Link>
        <span className="mc-moi">{etat?.prenom ? `🎭 ${etat.prenom}` : "🎭 Ta figurine qui parle"}</span>
      </header>

      <div className="mc-onglets">
        {/* 🎭 CRÉER */}
        <section className="mc-onglet" id="o-figurine" hidden={vue !== "figurine"} aria-label="Créer">
          <OngletVisible.Provider value={vue === "figurine"}>
            <OngletFigurine etat={charge ? (etat ?? { total: 0, cadeaux: 0, etapes: [], etape: "photo", prenom: "", compte: false, commerces: [], messages: [] }) : null} villes={villes} onEtat={poserEtat} />
          </OngletVisible.Provider>
        </section>

        {/* 🔥 DÉCOUVRIR */}
        {ouverts.has("decouvrir") && (
          <section className="mc-onglet" id="o-decouvrir" hidden={vue !== "decouvrir"} aria-label="Découvrir">
            <OngletVisible.Provider value={vue === "decouvrir"}>
              <Decouvrir allerA={allerA} />
            </OngletVisible.Provider>
          </section>
        )}

        {/* 💬 RENCONTRES */}
        {ouverts.has("rencontre") && (
          <section className="mc-onglet" id="o-rencontre" hidden={vue !== "rencontre"} aria-label="Rencontres">
            <OngletVisible.Provider value={vue === "rencontre"}>
              <RencontreDuJour
                compte={compte}
                version={versionCarte}
                allerA={allerA}
                // 🗓️ sa figurine du mois se mérite ici (10 jours de rencontres), juste sous l'épisode du jour
                sousLEpisode={<MaFigurineDuMois />}
              />
            </OngletVisible.Provider>
          </section>
        )}
        {ouverts.has("personnage") && (
          <section className="mc-onglet" id="o-personnage" hidden={vue !== "personnage"} aria-label="Mon personnage">
            <OngletVisible.Provider value={vue === "personnage"}>
              <MonPersonnage
                compte={compte}
                onCarte={() => {
                  setACarte(true);
                  setVersionCarte((v) => v + 1);
                }}
                onSait={setACarte}
                allerA={allerA}
              />
              {/* 📱 l'appli sur son écran d'accueil, et le mème du jour à 11 h 30 (il le coupe ici) — le lot 3 */}
              {compte && <MonTelephone />}
            </OngletVisible.Provider>
          </section>
        )}

        {/* 📥 MES MÈMES */}
        {ouverts.has("memes") && (
          <section className="mc-onglet" id="o-memes" hidden={vue !== "memes"} aria-label="Mes mèmes">
            <OngletVisible.Provider value={vue === "memes"}>
              <MesMemes compte={compte} allerA={allerA} />
            </OngletVisible.Provider>
          </section>
        )}
      </div>

      {/* 📲 « Comment la mettre sur ton écran d'accueil » (ouverte par « Installer ») */}
      <FeuilleInstaller />

      {/* LE MENU, EN BAS (6 novembre 2026 : « il faut qu'on voie en un coup d'œil qu'on est différent ») : un dock qui flotte ;
          « Créer », le cœur de l'app, en gros bouton rond au milieu, avec SA figurine dedans (7 novembre 2026) */}
      <nav className="mc-nav" aria-label="ClikMe">
        {MENU.map((o) => (
          <button key={o.cle} type="button" className={`mc-nav-${o.cle}${onglet === o.cle ? " pris" : ""}`} aria-current={onglet === o.cle ? "page" : undefined} onClick={() => aller(o.cle)}>
            <span className="mc-nav-ico" aria-hidden="true">
              {o.cle === "figurine" && prete && etat?.neutre ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={etat.neutre} alt="" draggable={false} />
              ) : (
                <IconeOnglet cle={o.cle} />
              )}
              {pastilles[o.cle] && <i className={pastilles[o.cle] === "!" || pastilles[o.cle] === "1" ? "pulse" : ""}>{pastilles[o.cle]}</i>}
            </span>
            <small>{o.nom}</small>
          </button>
        ))}
      </nav>
      <style>{STYLES_MC + STYLES_MA_FIGURINE + STYLES_PERSONNAGE + STYLES_RENCONTRE + STYLES_CONNAITRE + STYLES_FIGURINE_DU_MOIS + STYLES_MES_MEMES + STYLES_DECOUVRIR + STYLES_MES_REACTIONS + STYLES_THEME_DU_JOUR + STYLES_MON_TELEPHONE}</style>
    </main>
  );
}

/** Les icônes du menu, dessinées pour ClikMe (une flamme, deux bulles, un « + » sur son ressort, une pile de mèmes, une carte). */
function IconeOnglet({ cle }: { cle: Onglet }) {
  const trait = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <svg viewBox="0 0 24 24" width="24" height="24">
      {cle === "figurine" ? (
        <>
          <path d="M12 4.5v9M7.5 9h9" {...trait} />
          <path d="M8.5 16.6h7M10 16.6l-1 1.3 6 1.2-6 1.2" {...trait} />
        </>
      ) : cle === "decouvrir" ? (
        <>
          <path d="M12 21c-4 0-6.5-2.7-6.5-6.2 0-3.6 2.6-5.4 3.6-8.8.4 1.9 1.4 3 2.6 3.6.3-2.6 1.4-5 3.3-6.6-.2 2.9 1.2 4.6 2.3 6.2 1 1.4 1.7 2.8 1.7 4.8C19 18.2 16.2 21 12 21z" {...trait} />
          <path d="M12 21c-1.7 0-2.8-1.1-2.8-2.7 0-1.8 1.6-2.6 2.1-4.3 1 .8 3.5 2.2 3.5 4.3 0 1.6-1.1 2.7-2.8 2.7z" {...trait} />
        </>
      ) : cle === "personnage" ? (
        <>
          <rect x="4.5" y="3" width="15" height="18" rx="3" {...trait} />
          <path d="M12 7.6l1.3 2.7 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z" {...trait} />
        </>
      ) : cle === "rencontre" ? (
        <>
          <path d="M3.5 10.5a6 5 0 0 1 6-5h1a6 5 0 0 1 0 10H8l-3.2 2.4.7-3.2a5 5 0 0 1-2-4.2z" {...trait} />
          <path d="M14.8 8.6h.7a5 4.3 0 0 1 3.1 7.7l.6 2.7-2.8-1.9h-1.6a5.2 4.4 0 0 1-3.9-1.6" {...trait} />
        </>
      ) : (
        <>
          <rect x="6.5" y="3.5" width="13" height="16" rx="3" {...trait} />
          <path d="M4.5 6.5v12a2.5 2.5 0 0 0 2.5 2.5h9" {...trait} />
          <path d="M11.5 8.7v5.6l4.5-2.8z" {...trait} />
        </>
      )}
    </svg>
  );
}

const STYLES_MC = `
.mc{min-height:100dvh;box-sizing:border-box;padding:calc(10px + env(safe-area-inset-top)) 0 calc(118px + env(safe-area-inset-bottom));max-width:1180px;margin:0 auto;
  background:radial-gradient(100% 38% at 50% 0%,rgba(255,46,154,.22),transparent 72%),linear-gradient(180deg,#1E0C18,#12060F 40%);color:#FFF4E6;
  font-family:var(--font-clikme),Poppins,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15px;line-height:1.45;-webkit-font-smoothing:antialiased}
body{background:#12060F}
.mc-barre{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;
  background:rgba(18,6,15,.72);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
.mc-logo{font-size:19px;font-weight:900;color:#FFF4E6;text-decoration:none;letter-spacing:-.02em}
.mc-logo b{color:#FF2E9A}
.mc-moi{min-width:0;overflow:hidden;text-overflow:ellipsis;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.08);font-size:13px;font-weight:700;color:#D9C3CB;white-space:nowrap}
.mc-onglets{padding:14px 16px 0}
.mc-onglet{animation:mc-entre .35s cubic-bezier(.2,.9,.3,1)}
.mc-onglet[hidden]{display:none}
.mc-attente{display:grid;margin:8px 0 0}
.mc-attente i{height:420px;border-radius:30px;background:linear-gradient(100deg,rgba(255,255,255,.04) 30%,rgba(255,255,255,.1) 50%,rgba(255,255,255,.04) 70%);background-size:200% 100%;animation:mc-reflet 1.4s linear infinite}
.mc-vide{margin:28px 0 0;padding:18px;border-radius:20px;background:rgba(255,255,255,.05);text-align:center;color:#D9C3CB}
.mc-total{display:inline-grid;place-items:center;min-width:30px;height:30px;margin-left:6px;padding:0 8px;box-sizing:border-box;border-radius:999px;background:#FF2E9A;color:#fff;font-size:15px;vertical-align:2px;-webkit-text-fill-color:#fff;box-shadow:0 8px 18px -8px rgba(255,46,154,.9)}
/* le menu, en bas : un dock qui flotte, « Créer » en gros bouton rond au milieu */
.mc-nav{position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:20;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:end;max-width:540px;margin:0 auto;padding:7px 6px 6px;
  border-radius:28px;background:linear-gradient(180deg,rgba(46,16,36,.9),rgba(22,7,17,.94));-webkit-backdrop-filter:blur(20px) saturate(1.4);backdrop-filter:blur(20px) saturate(1.4);
  box-shadow:0 18px 40px -14px rgba(0,0,0,.95),inset 0 0 0 1px rgba(255,255,255,.09),inset 0 1px 0 rgba(255,200,230,.14)}
.mc-nav::before{content:"";position:absolute;left:18%;right:18%;top:-1px;height:1px;background:linear-gradient(90deg,transparent,rgba(255,46,154,.85),rgba(242,196,107,.85),transparent)}
.mc-nav button{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0;padding:4px 0 2px;border:0;background:none;color:#9C8290;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color .2s}
.mc-nav button.pris{color:#FFF4E6}
.mc-nav-ico{position:relative;display:grid;place-items:center;width:44px;height:34px;border-radius:14px;transition:transform .3s cubic-bezier(.2,1.6,.4,1),background .25s}
.mc-nav-ico svg{display:block;opacity:.9}
.mc-nav button.pris .mc-nav-ico{transform:translateY(-3px);background:linear-gradient(135deg,rgba(255,46,154,.32),rgba(242,196,107,.22));box-shadow:0 8px 18px -8px rgba(255,46,154,.9)}
.mc-nav button.pris .mc-nav-ico svg{color:#FFF4E6;opacity:1}
.mc-nav small{font-size:11px;font-weight:800;letter-spacing:-.01em;white-space:nowrap}
.mc-nav button.pris small{background:linear-gradient(90deg,#FFC8E6,#F2C46B);-webkit-background-clip:text;background-clip:text;color:transparent}
/* « Créer » : le gros bouton rond, au milieu, avec SA figurine dedans */
.mc-nav-figurine .mc-nav-ico{width:62px;height:62px;margin-top:-32px;border-radius:50%;color:#fff;background:conic-gradient(from 210deg,#FF2E9A,#FF7A59,#F2C46B,#FF2E9A);box-shadow:0 0 0 5px #1d0a17,0 14px 26px -8px rgba(255,46,154,.95)}
.mc-nav-figurine .mc-nav-ico svg{width:30px;height:30px;color:#fff;opacity:1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.25))}
.mc-nav-figurine .mc-nav-ico img{width:54px;height:54px;border-radius:50%;object-fit:cover;object-position:50% 16%;background:#3a1530}
.mc-nav-figurine.pris .mc-nav-ico{transform:translateY(-4px) scale(1.06);background:conic-gradient(from 210deg,#FF2E9A,#FF7A59,#F2C46B,#FF2E9A);box-shadow:0 0 0 5px #1d0a17,0 0 28px rgba(255,46,154,.85)}
.mc-nav-figurine:has(i.pulse) .mc-nav-ico{animation:mc-appel 2.2s ease-in-out infinite}
.mc-nav-ico i{position:absolute;right:-4px;top:-5px;display:grid;place-items:center;min-width:18px;height:18px;padding:0 4px;box-sizing:border-box;border-radius:999px;background:#FF2E9A;color:#fff;font-style:normal;font-size:10.5px;font-weight:900;box-shadow:0 0 0 2px #1d0a17}
.mc-nav-figurine .mc-nav-ico i{right:-2px;top:-2px;background:#F2C46B;color:#2A0F1F}
.mc-nav-ico i.pulse{animation:mc-pastille 1.6s ease-in-out infinite}
@media (min-width:860px){
  .mc-barre{padding:14px 32px}
  .mc-onglets{padding:28px 32px 0}
  .og-tete h1,.og-tete h2{font-size:48px}
  .mc-nav{bottom:16px}
}
@keyframes mc-entre{from{opacity:0;transform:translateY(10px)}}
@keyframes mc-reflet{to{background-position:-200% 0}}
@keyframes mc-pastille{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
@keyframes mc-appel{0%,100%{box-shadow:0 0 0 5px #1d0a17,0 14px 26px -8px rgba(255,46,154,.95)}50%{box-shadow:0 0 0 5px #1d0a17,0 0 0 11px rgba(255,46,154,.28),0 14px 30px -6px rgba(255,46,154,1)}}
@media (prefers-reduced-motion:reduce){.mc *{animation:none!important}}
`;
