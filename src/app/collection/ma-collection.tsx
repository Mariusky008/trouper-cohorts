"use client";

/**
 * 🎭 L'ÉCRAN DE CLIKME (`/collection`) — en ONGLETS depuis le 5 novembre 2026 ; RESSERRÉ SUR LE MÈME le 7 novembre 2026
 * (le patron : « le concept part un peu dans tous les sens » ; « la page album, on a du mal à voir à quoi elle sert » ;
 * « “où les gagner”, ce n'est pas clair du tout »). Une seule question pour chaque écran : est-ce qu'il aide à faire un
 * mème, ou donne une raison d'en envoyer un ? Le menu en bas, comme les applis de vidéos que tout le monde connaît
 * (l'étape 2, le même jour : « Découvrir » est arrivé) :
 *   🔥 DÉCOUVRIR — les mèmes du jour des commerçants de sa ville (`decouvrir.tsx`) ;
 *   📍 AUTOUR — les mèmes laissés dans la ville, sur une carte (`autour.tsx`) ; il a pris la place de 💬 RENCONTRES ;
 *   🎭 CRÉER, au milieu, en gros — sa figurine qui parle (`ma-figurine.tsx`) : ses looks, ses mèmes prêts, le duo ;
 *      depuis le 7 novembre 2026, « le studio et ses tiroirs » (sa figurine toujours en vue, deux onglets, son mème dans
 *      une feuille) ; « Ne perds jamais ta figurine » est un cadenas doré, ici, en haut à côté de son prénom ;
 *   📥 MES MÈMES — ce que ses mèmes deviennent : vus, les réponses en duo, ceux qu'il a reçus (`mes-memes.tsx`) ;
 *   🎙️ PROCHES — le talkie-walkie des figurines (`proches.tsx`, 8 novembre 2026) : leurs figurines, « Lui parler », la
 *      conversation en petite pièce de théâtre. Il a pris la place de « Moi » dans le menu ;
 *   🃏 MOI — sous son prénom, en haut : sa carte de personnage, la question du jour (`personnage.tsx`), sa figurine du
 *      mois, qui se mérite en 10 jours sur ClikMe (`figurine-du-mois.tsx`), ses réglages.
 * « Ce mois-ci » et l'album des commerçants sont partis de l'appli (les cartes de fidélité commencées restent sur la page
 * de chaque commerçant, `/f/<slug>`) ; ses figurines du mois sont devenues des LOOKS de son studio.
 * Chaque onglet a son adresse (`#decouvrir`, `#autour`, `#figurine`, `#memes`, `#proches`, `#personnage`), et les anciens liens
 * retombent sur le bon (`#creer` → « Créer », `#mois` → sa figurine du mois, dans « Moi », `#album` → « Mes mèmes »).
 * 📲 LE LOT 3 : l'appli sur l'écran d'accueil et le mème du jour à 11 h 30 (`mon-telephone.tsx`) — `#jour` mène au mème
 * du jour (la notification), `#installer` ouvre le geste à faire (iPhone, après le rechargement avec son jeton).
 * 📍 « AUTOUR » REMPLACE « RENCONTRES » DANS LE MENU (7 novembre 2026, à la demande du propriétaire) : les mèmes laissés
 * dans la ville, sur une carte (`autour.tsx`, `#autour`). PUIS « RENCONTRES » EST EFFACÉ (le même jour, sa réponse :
 * « effacer ») : l'épisode du jour, les personnages, les membres, les impressions, les cartes souvenirs. Ses anciennes
 * adresses (`#rencontre`, le lien d'un ami `?ami=`) ouvrent « Créer » ; sa figurine du mois est dans « Moi ».
 * Un onglet ne se charge qu'à sa première ouverture, puis il reste là. 🟢 Tant que la page est visible, elle dit au
 * serveur « il est là » toutes les minutes (« Là maintenant » chez ses proches, s'il le veut) et apprend ses messages non
 * lus (la pastille de « Proches »).
 */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EVT_ANCRE, Feuille, OngletFigurine, STYLES_MA_FIGURINE } from "./ma-figurine";
import { STYLES_TROIS_RENDUS } from "./trois-rendus";
import { OngletVisible } from "./guide";
import { MonPersonnage, STYLES_PERSONNAGE } from "./personnage";
import { ProtegerFigurine, STYLES_CONNAITRE } from "./connaitre";
import { MaFigurineDuMois, STYLES_FIGURINE_DU_MOIS } from "./figurine-du-mois";
import { MesMemes, STYLES_MES_MEMES } from "./mes-memes";
import { Decouvrir, STYLES_DECOUVRIR } from "./decouvrir";
import { STYLES_MES_REACTIONS } from "./mes-reactions";
import { STYLES_THEME_DU_JOUR } from "./theme-du-jour";
import { FeuilleInstaller, MonTelephone, STYLES_MON_TELEPHONE } from "./mon-telephone";
import { Autour, STYLES_AUTOUR } from "./autour";
import { MaPresence, Proches, STYLES_PROCHES } from "./proches";
import { capterLaProposition, lierSiBesoin, ouvrirInstallation } from "@/lib/direct/appli-collection";
import type { EtatMaFigurine } from "@/lib/direct/ma-figurine";

/** Le menu du bas : cinq boutons, « Créer » au milieu ; « Proches » a pris la place de « Moi » (8 novembre 2026). */
const MENU = [
  { cle: "decouvrir", nom: "Découvrir" },
  { cle: "autour", nom: "Autour" },
  { cle: "figurine", nom: "Créer" },
  { cle: "memes", nom: "Mes mèmes" },
  { cle: "proches", nom: "Proches" },
] as const;
type Onglet = (typeof MENU)[number]["cle"];
/** Les vues : les onglets du menu, et « Moi » (sous son prénom, en haut). */
type Vue = Onglet | "personnage";
/** Les adresses qui mènent à une vue (et, pour certaines, à un endroit dedans). */
const ALIAS: Record<string, Vue> = {
  decouvrir: "decouvrir",
  autour: "autour",
  "autour-de-moi": "autour",
  moi: "personnage",
  figurine: "figurine",
  creer: "figurine",
  // (🔥 le mème du jour, dans « Découvrir » : là où mène la notification de 11 h 30 — il a quitté « Créer » le 8 novembre 2026)
  jour: "decouvrir",
  // (⚡ ses réactions, en haut de « Créer » : là où l'app installée pourra s'ouvrir)
  reactions: "figurine",
  personnage: "personnage",
  // (« Rencontres » est effacé : ses anciens liens ouvrent « Créer »)
  rencontre: "figurine",
  rencontres: "figurine",
  // (sa figurine du mois : dans « Moi », sous sa carte)
  mois: "personnage",
  edition: "personnage",
  "ou-gagner": "personnage",
  memes: "memes",
  album: "memes",
  // (🎙️ le talkie-walkie : la notification « Léa t'a parlé ! » et le lien d'un proche y mènent)
  proches: "proches",
  parler: "proches",
  presence: "personnage",
};

export function MaCollection({ villes = [] }: { villes?: { slug: string; nom: string }[] }) {
  const [etat, setEtat] = useState<EtatMaFigurine | null>(null);
  const [charge, setCharge] = useState(false);
  const [vue, setVue] = useState<Vue>("figurine");
  const [ouverts, setOuverts] = useState<Set<Vue>>(() => new Set(["figurine"]));
  // (sa carte faite ou refaite : le menu sait s'il en a une)
  const [aCarte, setACarte] = useState<boolean | null>(null);
  // 🔒 « NE PERDS JAMAIS TA FIGURINE » (7 novembre 2026, l'avis d'un ami) : un cadenas doré, en haut à côté de son prénom,
  // tant que son adresse ne la protège pas ; il ouvre une feuille (null : jamais ouverte, rien n'y est encore monté)
  const [proteger, setProteger] = useState<boolean | null>(null);
  // 🎙️ ses messages non lus (la pastille de « Proches »)
  const [nonLus, setNonLus] = useState(0);
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
    // (l'onglet suit : « #reactions » ouvre ses réactions, dans le studio)
    window.dispatchEvent(new CustomEvent<string>(EVT_ANCRE, { detail: ancre ?? v }));
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
      // le lien d'un ami (`?ami=<code>`, du temps de « Rencontres ») : « Créer »
      else if (new URLSearchParams(window.location.search).get("ami")) aller("figurine");
    };
    lire();
    window.addEventListener("hashchange", lire);
    return () => window.removeEventListener("hashchange", lire);
  }, [aller]);

  const onglet = vue;
  const compte = charge ? Boolean(etat?.compte) : null;
  const prete = etat?.etape === "prete";

  // 🟢 « LÀ MAINTENANT » : toutes les minutes, tant que la page est visible — et ses messages non lus
  useEffect(() => {
    if (!compte || !prete) return;
    let fini = false;
    const battre = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "la" }) })
        .then((r) => r.json())
        .then((j: { nonLus?: number }) => !fini && typeof j.nonLus === "number" && setNonLus(j.nonLus))
        .catch(() => undefined);
    };
    battre();
    const t = window.setInterval(battre, 60_000);
    document.addEventListener("visibilitychange", battre);
    return () => {
      fini = true;
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", battre);
    };
  }, [compte, prete]);
  // ce qui attend dans chaque onglet (un point qui pulse)
  const pastilles: Partial<Record<Onglet, string>> = {
    ...(charge && !prete && etat?.etape !== "fabrication" ? { figurine: "!" } : {}),
    ...(nonLus > 0 ? { proches: nonLus > 9 ? "9+" : String(nonLus) } : {}),
  };

  return (
    <main className="mc">
      <header className="mc-barre">
        <Link className="mc-logo" href="/">
          Clik<b>Me</b>
        </Link>
        <span className="mc-droite">
          {/* 🃏 « MOI », SOUS SON PRÉNOM (8 novembre 2026 : « Proches » a pris sa place dans le menu) */}
          {compte ? (
            <button type="button" className={`mc-moi${vue === "personnage" ? " pris" : ""}`} aria-label="Moi : ta carte, tes réglages" aria-current={vue === "personnage" ? "page" : undefined} onClick={() => aller("personnage")}>
              {prete && etat?.neutre ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={etat.neutre} alt="" draggable={false} />
              ) : (
                <span aria-hidden="true">🎭</span>
              )}
              {etat?.prenom || "Moi"}
              {aCarte === false && <i aria-hidden="true">!</i>}
            </button>
          ) : (
            <span className="mc-moi">🎭 Ta figurine qui parle</span>
          )}
          {prete && etat && !etat.protegee && (
            <button type="button" className="mc-cadenas" aria-label="Sauvegarder ma figurine : ne la perds jamais" onClick={() => setProteger(true)}>
              <span aria-hidden="true">🔒</span>
              <small>Sauvegarder</small>
            </button>
          )}
        </span>
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

        {/* 📍 AUTOUR DE MOI : la carte des mèmes de la ville (plein écran, sous la barre du haut et le menu) */}
        {ouverts.has("autour") && (
          <section className="mc-onglet mc-autour" id="o-autour" hidden={vue !== "autour"} aria-label="Autour de moi">
            <OngletVisible.Provider value={vue === "autour"}>
              <Autour allerA={allerA} />
            </OngletVisible.Provider>
          </section>
        )}

        {ouverts.has("personnage") && (
          <section className="mc-onglet" id="o-personnage" hidden={vue !== "personnage"} aria-label="Mon personnage">
            <OngletVisible.Provider value={vue === "personnage"}>
              <MonPersonnage
                compte={compte}
                onCarte={() => setACarte(true)}
                onSait={setACarte}
                allerA={allerA}
              />
              {/* 🗓️ sa figurine du mois : elle se mérite en 10 jours sur ClikMe (`#mois` mène ici) */}
              {compte && <MaFigurineDuMois />}
              {/* 📱 l'appli sur son écran d'accueil, et le mème du jour à 11 h 30 (il le coupe ici) — le lot 3 */}
              {compte && <MonTelephone />}
              {/* 🟢 « Là maintenant » chez ses proches : il le coupe ici */}
              {compte && prete && <MaPresence />}
            </OngletVisible.Provider>
          </section>
        )}

        {/* 🎙️ PROCHES : le talkie-walkie des figurines */}
        {ouverts.has("proches") && (
          <section className="mc-onglet" id="o-proches" hidden={vue !== "proches"} aria-label="Proches">
            <OngletVisible.Provider value={vue === "proches"}>
              <Proches compte={compte} prete={prete} allerA={allerA} onNonLus={setNonLus} />
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

      {/* 🔒 son adresse protège sa figurine : un code suffit pour la retrouver sur un autre téléphone */}
      {prete && proteger !== null && (
        <Feuille ouverte={proteger} onFermer={() => setProteger(false)} titre="Ne perds jamais ta figurine" className="mc-feuille-proteger">
          <ProtegerFigurine mode="proteger" protegee={etat?.protegee} onFait={(a) => setEtat((e) => (e ? { ...e, protegee: a } : e))} />
        </Feuille>
      )}

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
              {pastilles[o.cle] && <i className={pastilles[o.cle] === "!" || pastilles[o.cle] === "1" || o.cle === "proches" ? "pulse" : ""}>{pastilles[o.cle]}</i>}
            </span>
            <small>{o.nom}</small>
          </button>
        ))}
      </nav>
      <style>{STYLES_MC + STYLES_MA_FIGURINE + STYLES_TROIS_RENDUS + STYLES_PERSONNAGE + STYLES_CONNAITRE + STYLES_FIGURINE_DU_MOIS + STYLES_MES_MEMES + STYLES_DECOUVRIR + STYLES_MES_REACTIONS + STYLES_THEME_DU_JOUR + STYLES_MON_TELEPHONE + STYLES_AUTOUR + STYLES_PROCHES}</style>
    </main>
  );
}

/** Les icônes du menu, dessinées pour ClikMe (une flamme, une épingle, un « + » sur son ressort, une pile de mèmes, deux personnages). */
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
      ) : cle === "proches" ? (
        <>
          {/* deux personnages, l'un devant l'autre */}
          <circle cx="9" cy="8" r="3.4" {...trait} />
          <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0" {...trait} />
          <circle cx="17" cy="9" r="2.5" {...trait} />
          <path d="M16.2 14.4a5 5 0 0 1 5.3 5.1" {...trait} />
        </>
      ) : cle === "autour" ? (
        <>
          {/* une épingle de carte, et la zone floue autour */}
          <path d="M12 21.2s-5.6-5.5-5.6-10.1a5.6 5.6 0 0 1 11.2 0c0 4.6-5.6 10.1-5.6 10.1z" {...trait} />
          <circle cx="12" cy="11" r="2.1" {...trait} />
          <path d="M5 18.6c-1.3.5-2 1-2 1.6 0 1.4 4 2.3 9 2.3s9-.9 9-2.3c0-.6-.7-1.1-2-1.6" {...trait} strokeDasharray="2 2.4" />
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
button.mc-moi{position:relative;display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:3px 13px 3px 4px;border:0;font:inherit;font-size:14px;font-weight:800;color:#FFF4E6;overflow:visible;cursor:pointer;-webkit-tap-highlight-color:transparent}
button.mc-moi.pris{background:linear-gradient(135deg,rgba(255,46,154,.32),rgba(242,196,107,.22))}
button.mc-moi img,button.mc-moi > span{flex:none;display:grid;place-items:center;width:32px;height:32px;border-radius:50%;object-fit:cover;object-position:50% 16%;background:#FF2E9A;font-size:16px}
button.mc-moi i{position:absolute;right:-3px;top:-4px;display:grid;place-items:center;min-width:16px;height:16px;border-radius:999px;background:#F2C46B;color:#2A0F1F;font-style:normal;font-size:10px;font-weight:900}
.mc-droite{display:flex;align-items:center;gap:8px;min-width:0}
/* 🔒 le cadenas doré : sa figurine n'est pas encore protégée par son adresse */
.mc-cadenas{flex:none;display:inline-flex;align-items:center;gap:5px;padding:5px 11px 5px 8px;border-radius:999px;border:1px solid rgba(242,196,107,.65);background:linear-gradient(135deg,rgba(242,196,107,.24),rgba(255,122,89,.12));color:#FFE7B8;font:inherit;cursor:pointer;box-shadow:0 0 16px -6px rgba(242,196,107,.85);-webkit-tap-highlight-color:transparent}
.mc-cadenas span{font-size:14px;line-height:1}
.mc-cadenas small{font-size:12px;font-weight:900}
@media (max-width:359px){.mc-cadenas small{display:none}}
.mc-feuille-proteger .cn-proteger{padding:2px 0 4px;border:0;background:none}
.mc-feuille-proteger .cn-proteger > b{padding-right:40px;font-size:19px}
.mc-onglets{padding:14px 16px 0}
.mc-onglet{animation:mc-entre .35s cubic-bezier(.2,.9,.3,1)}
.mc-onglet[hidden]{display:none}
/* (« Autour » est en plein écran, en position fixe : pas d'entrée animée, qui ferait bouger la carte) */
.mc-onglet.mc-autour{animation:none}
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
