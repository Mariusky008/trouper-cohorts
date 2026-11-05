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
 *   📅 CE MOIS-CI — l'édition du mois, expliquée par le guide dans sa tenue, et où la gagner (`decouvrir.tsx`) ;
 *   📒 ALBUM — ses figurines, une page par commerce (`album.tsx`).
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
import { GuideDit } from "./guide";
import { MonPersonnage, STYLES_PERSONNAGE } from "./personnage";
import { RencontreDuJour, STYLES_RENCONTRE } from "./rencontre";
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
          <OngletFigurine etat={charge ? (etat ?? { total: 0, etape: "photo", prenom: "", compte: false, commerces: [], messages: [] }) : null} villes={villes} onEtat={poserEtat} />
        </section>

        {/* 🃏 PERSONNAGE */}
        {ouverts.has("personnage") && (
          <section className="mc-onglet" id="o-personnage" hidden={onglet !== "personnage"} aria-label="Mon personnage">
            <MonPersonnage
              compte={compte}
              onCarte={() => {
                setACarte(true);
                setVersionCarte((v) => v + 1);
              }}
              onSait={setACarte}
              allerA={(o) => aller(o as Onglet)}
            />
          </section>
        )}

        {/* 💬 RENCONTRES */}
        {ouverts.has("rencontre") && (
          <section className="mc-onglet" id="o-rencontre" hidden={onglet !== "rencontre"} aria-label="Rencontres">
            <RencontreDuJour compte={compte} version={versionCarte} allerA={(o) => aller(o as Onglet)} />
          </section>
        )}

        {/* 📅 CE MOIS-CI */}
        {ouverts.has("mois") && (
          <section className="mc-onglet" id="o-mois" hidden={onglet !== "mois"} aria-label="Ce mois-ci">
            <OngletMois aujourdhui={aujourdhui} commerces={commerces.filter((c) => !avec.some((f) => f.slug === c.slug))} dejaChez={avec.length > 0} />
          </section>
        )}

        {/* 📒 ALBUM */}
        {ouverts.has("album") && (
          <section className="mc-onglet" id="o-album" hidden={onglet !== "album"} aria-label="Mes figurines">
            <header className="og-tete">
              <small>MON ALBUM</small>
              <h2>
                Mes figurines <span className="mc-total">{total}</span>
              </h2>
            </header>
            {ennui && <p className="mc-vide">Ta collection n’a pas pu s’afficher. Réessaie dans un instant.</p>}
            {avec.length > 0 ? (
              <Album familles={avec} />
            ) : (
              familles && (
                <GuideDit
                  cle="album-vide"
                  repliques={[
                    { t: "Ton album est vide… pour l’instant ! 📒", v: "tristesse" },
                    { t: "À chaque achat chez un commerce ClikMe, je colle sa figurine du mois ici. Dix chez le même commerce, et c’est la figurine d’or 🏆", v: "euphorie" },
                  ]}
                >
                  <button type="button" className="og-go" onClick={() => aller("mois")}>
                    📅 Voir la figurine de ce mois-ci
                  </button>
                  <p className="dc-deja">Tu as déjà des figurines ? Ouvre cette page sur le téléphone où tu as libéré ton fantôme.</p>
                </GuideDit>
              )
            )}
            <p className="mc-regle">
              On ne gagne une figurine qu’en venant : elles ne s’achètent pas. Une édition manquée est manquée ; les éditions rares se gagnent quand le commerce annonce une
              place libre.
            </p>
          </section>
        )}
      </div>

      {/* LE MENU, EN BAS */}
      <nav className="mc-nav" aria-label="Ma collection">
        {ONGLETS.map((o) => (
          <button key={o.cle} type="button" className={onglet === o.cle ? "pris" : ""} aria-current={onglet === o.cle ? "page" : undefined} onClick={() => aller(o.cle)}>
            <span className="mc-nav-emoji" aria-hidden="true">
              {o.emoji}
              {pastilles[o.cle] && <i className={pastilles[o.cle] === "!" || pastilles[o.cle] === "1" ? "pulse" : ""}>{pastilles[o.cle]}</i>}
            </span>
            <small>{o.nom}</small>
          </button>
        ))}
      </nav>
      <style>{STYLES_MC + STYLES_MA_FIGURINE + STYLES_COLLECTION + STYLES_DECOUVRIR + STYLES_ALBUM + STYLES_PERSONNAGE + STYLES_RENCONTRE}</style>
    </main>
  );
}

const STYLES_MC = `
.mc{min-height:100dvh;box-sizing:border-box;padding:calc(10px + env(safe-area-inset-top)) 0 calc(96px + env(safe-area-inset-bottom));max-width:1180px;margin:0 auto;
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
.mc-regle{margin:34px 4px 0;font-size:12px;line-height:1.5;color:#8D7580;text-align:center}
/* le menu, en bas */
.mc-nav{position:fixed;left:0;right:0;bottom:0;z-index:20;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:2px;max-width:640px;margin:0 auto;padding:6px 8px calc(6px + env(safe-area-inset-bottom));
  background:rgba(24,8,19,.86);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);border-top:1px solid rgba(255,255,255,.1);border-radius:22px 22px 0 0;box-shadow:0 -14px 30px -12px rgba(0,0,0,.8)}
.mc-nav button{position:relative;display:flex;flex-direction:column;align-items:center;gap:1px;padding:7px 2px 6px;border:0;border-radius:16px;background:none;color:#A88E99;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .2s,color .2s}
.mc-nav button.pris{background:rgba(255,46,154,.16);color:#FFF4E6}
.mc-nav-emoji{position:relative;font-size:23px;line-height:1.1;transition:transform .25s cubic-bezier(.2,1.6,.4,1)}
.mc-nav button.pris .mc-nav-emoji{transform:translateY(-2px) scale(1.15)}
.mc-nav small{font-size:10.5px;font-weight:800;white-space:nowrap}
.mc-nav-emoji i{position:absolute;right:-12px;top:-4px;display:grid;place-items:center;min-width:17px;height:17px;padding:0 4px;box-sizing:border-box;border-radius:999px;background:#FF2E9A;color:#fff;font-style:normal;font-size:10.5px;font-weight:900;box-shadow:0 0 0 2px #180813}
.mc-nav-emoji i.pulse{animation:mc-pastille 1.6s ease-in-out infinite}
@media (min-width:860px){
  .mc-barre{padding:14px 32px}
  .mc-onglets{padding:28px 32px 0}
  .og-tete h1,.og-tete h2{font-size:48px}
  .mc-regle{font-size:13px;max-width:640px;margin-left:auto;margin-right:auto}
  .mc-nav{bottom:14px;border-radius:22px;border:1px solid rgba(255,255,255,.12)}
}
@keyframes mc-entre{from{opacity:0;transform:translateY(10px)}}
@keyframes mc-reflet{to{background-position:-200% 0}}
@keyframes mc-pastille{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
@media (prefers-reduced-motion:reduce){.mc *{animation:none!important}}
`;
