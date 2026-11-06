"use client";

/**
 * 🏆 MA COLLECTION — l'écran, en ONGLETS depuis le 5 novembre 2026 (« au lieu d'avoir tout sur la même page, ce qui rend
 * très difficile à comprendre le fonctionnement, il faut mettre un menu en bas avec les différentes sections »). Un
 * menu en bas, toujours là, comme une application ; chaque onglet a son adresse (`#figurine`, `#personnage`…), et les
 * anciens liens retombent sur le bon (`#creer` → « Ma figurine », `#ou-gagner` → « Ce mois-ci ») :
 *   🗣️ MA FIGURINE — l'accueil du guide (la figurine du patron de ClikMe, `guide.tsx`), la quête « Crée ta figurine », puis la sienne
 *      qui parle (`ma-figurine.tsx`) ;
 *   🃏 PERSONNAGE — sa carte (`personnage.tsx`) ;
 *   💬 RENCONTRES — la rencontre du jour, un ami à inviter, un membre à rencontrer (`rencontre.tsx`) ;
 *   📅 CE MOIS-CI — SA figurine du mois, méritée en dix jours de rencontres (`figurine-du-mois.tsx`, le lot 3) ; puis
 *      l'édition du mois des commerçants, expliquée par le guide dans sa tenue, et où la gagner (`decouvrir.tsx`) ;
 *   📒 ALBUM — ses figurines du mois (lui, mois après mois), puis celles des commerçants, une page par commerce (`album.tsx`).
 * Un onglet ne se charge qu'à sa première ouverture (la rencontre du jour n'est écrite que si on va la lire), puis il
 * reste là (on n'y perd rien en changeant d'onglet).
 * Ses familles viennent de `/api/direct/famille?moi=1` (`famillesDe`) ; sa figurine, de `/api/direct/ma-figurine`.
 */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { MaFamille } from "@/lib/direct/famille";
import { STYLES_COLLECTION } from "@/app/f/[slug]/collection";
import { Album, STYLES_ALBUM } from "./album";
import { OngletMois, STYLES_DECOUVRIR, type CommerceACollectionner } from "./decouvrir";
import { OngletFigurine, STYLES_MA_FIGURINE } from "./ma-figurine";
import { GuideDit, OngletVisible } from "./guide";
import { MonPersonnage, STYLES_PERSONNAGE } from "./personnage";
import { CLE_VOIR_RENCONTRE, MesSouvenirs, RencontreDuJour, STYLES_RENCONTRE } from "./rencontre";
import { STYLES_CONNAITRE } from "./connaitre";
import { MesFigurinesDuMois, STYLES_FIGURINE_DU_MOIS } from "./figurine-du-mois";
import { figurinesEnTout, type EtatMaFigurine } from "@/lib/direct/ma-figurine";

type Familles = { familles: MaFamille[] } | null;

const ONGLETS = [
  { cle: "figurine", emoji: "🗣️", nom: "Ma figurine" },
  { cle: "personnage", emoji: "🃏", nom: "Personnage" },
  { cle: "rencontre", emoji: "💬", nom: "Rencontres" },
  { cle: "mois", emoji: "📅", nom: "Ce mois-ci" },
  { cle: "album", emoji: "📒", nom: "Album" },
] as const;
type Onglet = (typeof ONGLETS)[number]["cle"];
/** Les adresses qui mènent à un onglet (et, pour certaines, à un endroit dedans). */
const ALIAS: Record<string, Onglet> = {
  figurine: "figurine",
  creer: "figurine",
  personnage: "personnage",
  rencontre: "rencontre",
  rencontres: "rencontre",
  mois: "mois",
  edition: "mois",
  "ou-gagner": "mois",
  album: "album",
};
const CLE_VUE = "clikme-rencontre-vue";
const aujourdhuiParis = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

export function MaCollection({ aujourdhui, commerces, villes = [] }: { aujourdhui: string; commerces: CommerceACollectionner[]; villes?: { slug: string; nom: string }[] }) {
  const [familles, setFamilles] = useState<Familles>(null);
  const [ennui, setEnnui] = useState(false);
  const [etat, setEtat] = useState<EtatMaFigurine | null>(null);
  const [charge, setCharge] = useState(false);
  const [onglet, setOnglet] = useState<Onglet>("figurine");
  const [ouverts, setOuverts] = useState<Set<Onglet>>(() => new Set(["figurine"]));
  // (sa carte faite ou refaite : la rencontre du jour se recharge ; et le menu sait s'il en a une)
  const [versionCarte, setVersionCarte] = useState(0);
  const [aCarte, setACarte] = useState<boolean | null>(null);
  const [rencontreVue, setRencontreVue] = useState(true);
  // (stable : la fabrication rappelle le serveur dans un effet qui en dépend)
  const poserEtat = useCallback((e: EtatMaFigurine) => setEtat(e), []);

  useEffect(() => {
    let fini = false;
    fetch("/api/direct/famille?moi=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { familles?: MaFamille[] }) => !fini && setFamilles({ familles: Array.isArray(j.familles) ? j.familles : [] }))
      .catch(() => !fini && setEnnui(true));
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

  /** Ouvre un onglet ; `ancre` : un endroit dedans (« creer », « ou-gagner »). */
  const aller = useCallback((o: Onglet, ancre?: string, garderDefilement = false) => {
    setOnglet(o);
    setOuverts((v) => (v.has(o) ? v : new Set([...v, o])));
    try {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${ancre ?? o}`);
    } catch {
      /* rien */
    }
    if (o === "rencontre") {
      setRencontreVue(true);
      try {
        window.localStorage.setItem(CLE_VUE, aujourdhuiParis());
      } catch {
        /* rien */
      }
    }
    window.setTimeout(() => {
      const el = ancre && ancre !== o ? document.getElementById(ancre) : null;
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else if (!garderDefilement) window.scrollTo({ top: 0 });
    }, 60);
  }, []);

  // l'adresse décide de l'onglet (à l'arrivée, et quand un lien de la page change l'ancre)
  useEffect(() => {
    const lire = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      const o = ALIAS[h];
      if (o) aller(o, h, false);
      // le lien d'un ami (`?ami=<code>`) : droit aux rencontres
      else if (new URLSearchParams(window.location.search).get("ami")) aller("rencontre");
    };
    lire();
    window.addEventListener("hashchange", lire);
    return () => window.removeEventListener("hashchange", lire);
  }, [aller]);

  const avec = (familles?.familles ?? [])
    .filter((f) => f.collection)
    .sort((a, b) => b.collection!.gagnees + b.collection!.trophees.length * 10 - (a.collection!.gagnees + a.collection!.trophees.length * 10));
  const total = figurinesEnTout(avec); // (les collections finies comptent leurs 10, comme pour « Ma figurine »)
  const ors = avec.reduce((n, f) => n + f.collection!.trophees.length, 0);
  const compte = charge ? Boolean(etat?.compte) : null;
  const prete = etat?.etape === "prete";
  // ce qui attend dans chaque onglet (un point qui pulse)
  const pastilles: Partial<Record<Onglet, string>> = {
    ...(charge && !prete && etat?.etape !== "fabrication" ? { figurine: "!" } : {}),
    ...(compte && aCarte === false ? { personnage: "!" } : {}),
    ...(compte && !rencontreVue ? { rencontre: "1" } : {}),
    ...(total > 0 ? { album: String(total) } : {}),
  };

  return (
    <main className="mc">
      <header className="mc-barre">
        <Link className="mc-logo" href="/">
          Clik<b>Me</b>
        </Link>
        <span className="mc-moi">
          Ma collection
          {familles && avec.length > 0 && (
            <>
              {" · "}
              <b>{total}</b>
              {ors > 0 && <em> · 🏆 {ors}</em>}
            </>
          )}
        </span>
      </header>

      <div className="mc-onglets">
        {/* 🗣️ MA FIGURINE */}
        <section className="mc-onglet" id="o-figurine" hidden={onglet !== "figurine"} aria-label="Ma figurine">
          <OngletVisible.Provider value={onglet === "figurine"}>
            <OngletFigurine etat={charge ? (etat ?? { total: 0, cadeaux: 0, etapes: [], etape: "photo", prenom: "", compte: false, commerces: [], messages: [] }) : null} villes={villes} onEtat={poserEtat} />
          </OngletVisible.Provider>
        </section>

        {/* 🃏 PERSONNAGE */}
        {ouverts.has("personnage") && (
          <section className="mc-onglet" id="o-personnage" hidden={onglet !== "personnage"} aria-label="Mon personnage">
            <OngletVisible.Provider value={onglet === "personnage"}>
              <MonPersonnage
                compte={compte}
                onCarte={() => {
                  setACarte(true);
                  setVersionCarte((v) => v + 1);
                }}
                onSait={setACarte}
                allerA={(o) => aller(o as Onglet)}
              />
            </OngletVisible.Provider>
          </section>
        )}

        {/* 💬 RENCONTRES */}
        {ouverts.has("rencontre") && (
          <section className="mc-onglet" id="o-rencontre" hidden={onglet !== "rencontre"} aria-label="Rencontres">
            <OngletVisible.Provider value={onglet === "rencontre"}>
              <RencontreDuJour compte={compte} version={versionCarte} allerA={(o) => aller(o as Onglet)} />
            </OngletVisible.Provider>
          </section>
        )}

        {/* 📅 CE MOIS-CI */}
        {ouverts.has("mois") && (
          <section className="mc-onglet" id="o-mois" hidden={onglet !== "mois"} aria-label="Ce mois-ci">
            <OngletVisible.Provider value={onglet === "mois"}>
              <OngletMois aujourdhui={aujourdhui} commerces={commerces.filter((c) => !avec.some((f) => f.slug === c.slug))} dejaChez={avec.length > 0} />
            </OngletVisible.Provider>
          </section>
        )}

        {/* 📒 ALBUM */}
        {ouverts.has("album") && (
          <section className="mc-onglet" id="o-album" hidden={onglet !== "album"} aria-label="Mes figurines">
            <OngletVisible.Provider value={onglet === "album"}>
              <header className="og-tete">
                <small>MON ALBUM</small>
                <h2>
                  Mes figurines <span className="mc-total">{total}</span>
                </h2>
              </header>
              {/* 🗓️ D'ABORD, LES SIENNES (lot 3) : une figurine de lui par mois vécu ; les commerçants, en plus */}
              <MesFigurinesDuMois />
              <h3 className="mc-sous-titre">🏪 Mes commerçants partenaires</h3>
              {ennui && <p className="mc-vide">Ta collection n’a pas pu s’afficher. Réessaie dans un instant.</p>}
              {avec.length > 0 ? (
                <Album familles={avec} />
              ) : (
                familles && (
                  <GuideDit
                    cle="album-vide"
                    popup
                    repliques={[
                      { t: "Ton album est vide… pour l’instant ! 📒", v: "tristesse" },
                      { t: "Quand tu passes chez un commerce ClikMe, je colle sa figurine du mois ici. Dix chez le même commerce, et c’est la figurine d’or 🏆", v: "euphorie" },
                    ]}
                  >
                    <button type="button" className="og-go" onClick={() => aller("mois")}>
                      📅 Voir la figurine de ce mois-ci
                    </button>
                    <p className="dc-deja">Tu as déjà des figurines ? Ouvre cette page sur le téléphone où tu as libéré ton fantôme.</p>
                  </GuideDit>
                )
              )}
              {/* 🎞️ SES CARTES SOUVENIRS (une par rencontre) : la toucher rouvre la rencontre */}
              {compte && (
                <MesSouvenirs
                  onVoir={(id) => {
                    try {
                      window.sessionStorage.setItem(CLE_VOIR_RENCONTRE, id);
                    } catch {
                      /* rien */
                    }
                    window.dispatchEvent(new Event(CLE_VOIR_RENCONTRE));
                    aller("rencontre");
                  }}
                />
              )}
              <p className="mc-regle">
                On ne gagne une figurine qu’en venant : elles ne s’achètent pas. Une édition manquée est manquée ; les éditions rares se gagnent quand le commerce annonce une
                place libre.
              </p>
            </OngletVisible.Provider>
          </section>
        )}
      </div>

      {/* LE MENU, EN BAS */}
      {/* LE MENU, EN BAS (6 novembre 2026 : « il faut qu'on voie en un coup d'œil qu'on est différent, et ça doit se voir
          aussi avec le menu du bas ») : un dock qui flotte ; SA figurine en icône de « Ma figurine » ; « Rencontres », le
          cœur de l'app, en gros bouton rond au milieu ; des icônes dessinées pour ClikMe */}
      <nav className="mc-nav" aria-label="Ma collection">
        {ONGLETS.map((o) => (
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
      <style>{STYLES_MC + STYLES_MA_FIGURINE + STYLES_COLLECTION + STYLES_DECOUVRIR + STYLES_ALBUM + STYLES_PERSONNAGE + STYLES_RENCONTRE + STYLES_CONNAITRE + STYLES_FIGURINE_DU_MOIS}</style>
    </main>
  );
}

/** Les icônes du menu, dessinées pour ClikMe (une figurine sur son ressort, une carte, deux bulles, le mois, l'album). */
function IconeOnglet({ cle }: { cle: Onglet }) {
  const trait = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <svg viewBox="0 0 24 24" width="24" height="24">
      {cle === "figurine" ? (
        <>
          <circle cx="12" cy="7" r="4.2" {...trait} />
          <path d="M8.5 13.2h7M10 13.2l-1.2 1.6 6.4 1.4-6.4 1.4 6.4 1.4L14 20.6" {...trait} />
          <path d="M7 21.5h10" {...trait} />
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
      ) : cle === "mois" ? (
        <>
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" {...trait} />
          <path d="M3.5 9.5h17M8 3v4M16 3v4" {...trait} />
          <path d="M12 12.2l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" {...trait} />
        </>
      ) : (
        <>
          <rect x="6.5" y="3.5" width="13" height="16" rx="2.5" {...trait} />
          <path d="M4.5 6.5v12a2.5 2.5 0 0 0 2.5 2.5h9" {...trait} />
          <path d="M10 8.5h6M10 12h4" {...trait} />
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
.mc-moi{padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.08);font-size:13px;font-weight:700;color:#D9C3CB;white-space:nowrap}
.mc-moi b{color:#FFF4E6}
.mc-moi em{font-style:normal;color:#F2C46B}
.mc-onglets{padding:14px 16px 0}
.mc-onglet{animation:mc-entre .35s cubic-bezier(.2,.9,.3,1)}
.mc-onglet[hidden]{display:none}
.mc-attente{display:grid;margin:8px 0 0}
.mc-attente i{height:420px;border-radius:30px;background:linear-gradient(100deg,rgba(255,255,255,.04) 30%,rgba(255,255,255,.1) 50%,rgba(255,255,255,.04) 70%);background-size:200% 100%;animation:mc-reflet 1.4s linear infinite}
.mc-vide{margin:28px 0 0;padding:18px;border-radius:20px;background:rgba(255,255,255,.05);text-align:center;color:#D9C3CB}
.mc-total{display:inline-grid;place-items:center;min-width:34px;height:34px;margin-left:6px;padding:0 9px;box-sizing:border-box;border-radius:999px;background:#FF2E9A;color:#fff;font-size:17px;vertical-align:4px;-webkit-text-fill-color:#fff;box-shadow:0 8px 18px -8px rgba(255,46,154,.9)}
.mc-sous-titre{margin:28px 0 12px;font-size:18px;font-weight:900}
.mc-regle{margin:34px 4px 0;font-size:12px;line-height:1.5;color:#8D7580;text-align:center}
/* le menu, en bas : un dock qui flotte, « Rencontres » en gros bouton rond au milieu */
.mc-nav{position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:20;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:end;max-width:560px;margin:0 auto;padding:7px 6px 6px;
  border-radius:28px;background:linear-gradient(180deg,rgba(46,16,36,.9),rgba(22,7,17,.94));-webkit-backdrop-filter:blur(20px) saturate(1.4);backdrop-filter:blur(20px) saturate(1.4);
  box-shadow:0 18px 40px -14px rgba(0,0,0,.95),inset 0 0 0 1px rgba(255,255,255,.09),inset 0 1px 0 rgba(255,200,230,.14)}
.mc-nav::before{content:"";position:absolute;left:18%;right:18%;top:-1px;height:1px;background:linear-gradient(90deg,transparent,rgba(255,46,154,.85),rgba(242,196,107,.85),transparent)}
.mc-nav button{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0;padding:4px 0 2px;border:0;background:none;color:#9C8290;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color .2s}
.mc-nav button.pris{color:#FFF4E6}
.mc-nav-ico{position:relative;display:grid;place-items:center;width:44px;height:34px;border-radius:14px;transition:transform .3s cubic-bezier(.2,1.6,.4,1),background .25s}
.mc-nav-ico svg{display:block;opacity:.9}
.mc-nav button.pris .mc-nav-ico{transform:translateY(-3px);background:linear-gradient(135deg,rgba(255,46,154,.32),rgba(242,196,107,.22));box-shadow:0 8px 18px -8px rgba(255,46,154,.9)}
.mc-nav button.pris .mc-nav-ico svg{color:#FFF4E6;opacity:1}
.mc-nav small{font-size:10.5px;font-weight:800;letter-spacing:-.01em;white-space:nowrap}
.mc-nav button.pris small{background:linear-gradient(90deg,#FFC8E6,#F2C46B);-webkit-background-clip:text;background-clip:text;color:transparent}
/* « Ma figurine » : SA figurine, sa tête en médaillon */
.mc-nav-figurine .mc-nav-ico img{width:32px;height:32px;border-radius:50%;object-fit:cover;object-position:50% 16%;background:#3a1530;box-shadow:0 0 0 2px rgba(255,255,255,.18)}
.mc-nav-figurine.pris .mc-nav-ico{background:none;box-shadow:none}
.mc-nav-figurine.pris .mc-nav-ico img{box-shadow:0 0 0 2.5px #FF2E9A,0 0 16px rgba(255,46,154,.75)}
/* « Rencontres » : le gros bouton rond, au milieu */
.mc-nav-rencontre .mc-nav-ico{width:58px;height:58px;margin-top:-30px;border-radius:50%;color:#fff;background:conic-gradient(from 210deg,#FF2E9A,#FF7A59,#F2C46B,#FF2E9A);box-shadow:0 0 0 5px #1d0a17,0 14px 26px -8px rgba(255,46,154,.95)}
.mc-nav-rencontre .mc-nav-ico svg{width:28px;height:28px;color:#fff;opacity:1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.25))}
.mc-nav-rencontre.pris .mc-nav-ico{transform:translateY(-4px) scale(1.06);background:conic-gradient(from 210deg,#FF2E9A,#FF7A59,#F2C46B,#FF2E9A);box-shadow:0 0 0 5px #1d0a17,0 0 28px rgba(255,46,154,.85)}
.mc-nav-rencontre:has(i.pulse) .mc-nav-ico{animation:mc-appel 2.2s ease-in-out infinite}
.mc-nav-ico i{position:absolute;right:-4px;top:-5px;display:grid;place-items:center;min-width:18px;height:18px;padding:0 4px;box-sizing:border-box;border-radius:999px;background:#FF2E9A;color:#fff;font-style:normal;font-size:10.5px;font-weight:900;box-shadow:0 0 0 2px #1d0a17}
.mc-nav-rencontre .mc-nav-ico i{right:-2px;top:-2px;background:#F2C46B;color:#2A0F1F}
.mc-nav-ico i.pulse{animation:mc-pastille 1.6s ease-in-out infinite}
@media (min-width:860px){
  .mc-barre{padding:14px 32px}
  .mc-onglets{padding:28px 32px 0}
  .og-tete h1,.og-tete h2{font-size:48px}
  .mc-regle{font-size:13px;max-width:640px;margin-left:auto;margin-right:auto}
  .mc-nav{bottom:16px}
}
@keyframes mc-entre{from{opacity:0;transform:translateY(10px)}}
@keyframes mc-reflet{to{background-position:-200% 0}}
@keyframes mc-pastille{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
@keyframes mc-appel{0%,100%{box-shadow:0 0 0 5px #1d0a17,0 14px 26px -8px rgba(255,46,154,.95)}50%{box-shadow:0 0 0 5px #1d0a17,0 0 0 11px rgba(255,46,154,.28),0 14px 30px -6px rgba(255,46,154,1)}}
@media (prefers-reduced-motion:reduce){.mc *{animation:none!important}}
`;
