"use client";

// 🏛️ LA VILLE — le fil social local.
//
// « "La ville" fait découvrir et réagir. » Trois sortes de publications :
// les essais partagés (« Essai virtuel »), les découvertes (« Vécu sur
// place » quand l'auteur le dit), et la vie locale (une question, une photo,
// un mot vocal, une sortie ouverte à tous).
//
// ═══ CE QUI A CHANGÉ : LE FIL DES MAQUETTES ══════════════════════════════
//
// « Une seule page avec un fil varié. » Le même en-tête partout (le logo,
// « La ville », la recherche, les notifications, les trois filtres) reste
// collé en haut pendant qu'on fait défiler. Chaque publication est une carte
// séparée : l'auteur, la date, le lieu, le contenu, la légende, les
// réactions, et UNE action qui dépend de ce qu'elle montre — « Essayer sur
// moi » sous un essai, « En parler à mes amis » sous un plat, « Proposer à
// mes amis » sous une sortie, « Voir le commerce » sous une trouvaille.
//
// LA VARIÉTÉ VIENT DE CE QUI EST PUBLIÉ : un essai entre dans la vitrine de
// son commerce, un plat s'affiche tel quel, un mot vocal reste un mot vocal.
// La présentation est choisie par `scenes-ville.ts` au moment du partage, et
// figée dans la publication : rien ne se refabrique quand on fait défiler.
//
// LE FANTÔME DE LA BARRE OUVRE TROIS CHOIX — un de mes essais, une
// découverte, un message sur la ville — et chacun finit sur un APERÇU, une
// légende, et le choix de l'audience (« Mes amis » d'abord). Rien n'est
// publié sans ce dernier appui.
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { CarteAutour } from "@/lib/direct/apercu-habitant";
import {
  abonnerVus,
  AUCUN_VU,
  caMInteresse,
  chargerVus,
  comprendre,
  ilYA,
  marquerVu,
  NATURES,
  publierDansLaVille,
  reagirVille,
  repondreVille,
  resteDit,
  retirerDeLaVille,
  type MessageVille,
} from "@/lib/direct/la-ville";
import {
  estUnLieuDeSortie,
  etiquetteDuMenu,
  jourDe,
  sceneDAmbiance,
  sceneDeVitrine,
  type ContenuPartage,
  type SceneVille,
} from "@/lib/direct/scenes-ville";
import { reduirePhoto } from "@/lib/site-internet/reduire-photo";
import type { Salon } from "@/lib/direct/salons";
import { CarteSimple, SceneDuFil } from "./scene-ville";

const TEINTES = ["#FF5FA8", "#F5A23A", "#7FB7FF", "#7BD3A8", "#C99BFF", "#FF8A65"];
function hache(nom: string): number {
  let h = 0;
  for (const c of nom) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
const teinte = (nom: string) => TEINTES[hache(nom) % TEINTES.length];

type Filtre = "pour-toi" | "amis" | "autour";
type Audience = "amis" | "public";

/** Une ligne de « La suite de vos échanges » : une nouveauté qui me concerne. */
export type Suite = { cle: string; qui: string; texte: string; ouvrir: () => void };

/**
 * UN ESSAI QU'ON PEUT PARTAGER — un rendu de soi, réellement enregistré : une
 * pièce gardée avec son rendu, ou la trace d'un essai. Le commerce et la pièce
 * y sont déjà associés.
 */
export type EssaiPartageable = { cle: string; image: string; nom: string; carte: string; lieu: string; piece?: string };

/** Un salon où je suis, où l'on peut partager une publication. */
export type SalonPartageable = { cle: string; sujet: string; prive: boolean; photo?: string };

/** Où partager une publication dans Ensemble : un salon à moi, ou un nouveau. */
export type CibleSalon = { cle: string } | { prive: boolean };

export function LaVille({
  messages,
  amis,
  sorties,
  suites,
  essais,
  commerces,
  mesSalons,
  onEssayer,
  onPremierEssai,
  onPage,
  onPartagerSalon,
  onSortie,
  onOuvrirSalon,
  onSignaler,
  onMaison,
  demandePartage = 0,
  preselection,
}: {
  messages: MessageVille[];
  /** Les gens avec qui je partage des conversations : mes amis. */
  amis: string[];
  /** Les sorties ouvertes à tous où je ne suis pas encore. */
  sorties: Salon[];
  /** Les nouveautés qui me concernent (calculées par l'application). */
  suites: Suite[];
  /** Mes essais réellement enregistrés — jamais publiés tout seuls. */
  essais: EssaiPartageable[];
  /** Les commerces autour, pour « Une découverte ». */
  commerces: CarteAutour[];
  /** Les salons où je suis : on peut y partager une publication. */
  mesSalons: SalonPartageable[];
  onEssayer: (ref: { carte: string; piece: string }) => void;
  /** « Faire un premier essai », quand je n'en ai aucun. */
  onPremierEssai: () => void;
  onPage: (id: string) => void;
  /** « En parler à mes amis », « Proposer à mes amis » : vers Ensemble. */
  onPartagerSalon: (m: MessageVille, cible: CibleSalon) => void;
  /** Un « cherche » qui devient une sortie, avec ceux que ça intéresse. */
  onSortie: (m: MessageVille) => void;
  onOuvrirSalon: (cle: string) => void;
  /** Le fantôme de la barre a été touché : on ouvre « Tu veux partager quoi ? ». */
  demandePartage?: number;
  /**
   * ARRIVÉ DEPUIS UNE FICHE OU UNE ANNONCE : la découverte s'ouvre avec ce
   * commerce (et ce contenu) déjà choisis. `n` change à chaque demande.
   */
  preselection?: { commerce: string; contenu?: string; n: number };
  /**
   * SIGNALER UNE PUBLICATION — dans la vraie ville seulement, où elle vient
   * d'un autre habitant. Voir `ville-sync.ts`.
   */
  onSignaler?: (m: MessageVille) => void;
  /**
   * OUVRIR LA VRAIE MAISON D'UN HABITANT, par une de ses publications — dans
   * la vraie ville seulement. Sans elle, la feuille « Chez … » reste celle de
   * la maquette. Voir `maison-sync.ts`.
   */
  onMaison?: (m: MessageVille) => void;
}) {
  const vus = useSyncExternalStore(abonnerVus, chargerVus, () => AUCUN_VU);
  const [filtre, setFiltre] = useState<Filtre>("pour-toi");
  const [ouvertes, setOuvertes] = useState<string[]>([]);
  const [reponse, setReponse] = useState<Record<string, string>>({});
  const [chezQui, setChezQui] = useState<string | null>(null);
  const [compose, setCompose] = useState<null | Etape>(null);
  const [suiteDe, setSuiteDe] = useState<MessageVille | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [cherche, setCherche] = useState<string | null>(null);
  const [cloche, setCloche] = useState(false);
  const [versEnsemble, setVersEnsemble] = useState<{ m: MessageVille; sortie: boolean } | null>(null);
  const [preVue, setPreVue] = useState(preselection?.n ?? 0);
  // LE FANTÔME DE LA BARRE EST LE BOUTON « PARTAGER » DE CETTE PAGE. Une
  // demande nouvelle se voit pendant le rendu, sans effet.
  const [demandeVue, setDemandeVue] = useState(demandePartage);
  if (demandePartage !== demandeVue) {
    setDemandeVue(demandePartage);
    setSuiteDe(null);
    setCompose("choix");
  }
  if (preselection && preselection.n !== preVue) {
    setPreVue(preselection.n);
    setSuiteDe(null);
    setCompose("decouverte");
  }
  /** L'heure d'ouverture de l'écran : une sortie sans date se range une demi-heure avant. */
  const [ouverture] = useState(() => Date.now());

  const estAmi = (q: string) => amis.includes(q);
  const visible = (m: MessageVille) => m.visibilite !== "amis" || m.qui === "Vous" || estAmi(m.qui);
  const vivants = messages.filter(visible);

  type Entree = { cle: string; a: number; m?: MessageVille; salon?: Salon; score: number };
  const entrees: Entree[] = [
    ...vivants.map((m) => ({
      cle: m.id,
      a: m.a,
      m,
      // UN CLASSEMENT SIMPLE : le plus récent, et les amis remontent de deux heures.
      score: m.a + (estAmi(m.qui) || m.qui === "Vous" ? 2 * 3600_000 : 0),
    })),
    // LES SORTIES OUVERTES À TOUS, EN IDÉES DE SORTIE — elles quittent Ensemble.
    ...sorties.map((x) => {
      const a = x.activite ?? ouverture - 30 * 60_000;
      return { cle: x.cle, a, salon: x, score: a };
    }),
  ];
  const q = (cherche ?? "").trim().toLowerCase();
  const correspond = (e: Entree) =>
    !q ||
    [e.m?.texte, e.m?.qui, e.m?.ou, e.m?.commerce?.nom, e.m?.contenu?.nom, e.salon?.sujet, e.salon?.ou, e.salon?.annonce]
      .filter(Boolean)
      .some((t) => String(t).toLowerCase().includes(q));
  const fil = (
    filtre === "amis"
      ? entrees.filter((e) => e.m && (estAmi(e.m.qui) || e.m.qui === "Vous")).sort((a, b) => b.a - a.a)
      : filtre === "autour"
        ? entrees
            .filter((e) => e.salon || (e.m && e.m.visibilite !== "amis"))
            .sort((a, b) => b.a - a.a || (a.m?.metres ?? 0) - (b.m?.metres ?? 0))
        : entrees.sort((a, b) => b.score - a.score)
  ).filter(correspond);

  const basculerReponses = (m: MessageVille) => {
    setOuvertes((o) => (o.includes(m.id) ? o.filter((x) => x !== m.id) : [...o, m.id]));
    if (m.qui === "Vous") marquerVu(m.id, m.reponses.length);
  };

  // MES PUBLICATIONS QUI ONT DE NOUVELLES RÉPONSES — la suite de mes échanges.
  const reponduesAMoi: Suite[] = messages
    .filter((m) => m.qui === "Vous" && m.reponses.length > (vus[m.id] ?? 0))
    .map((m) => ({
      cle: `rep:${m.id}`,
      qui: m.reponses[m.reponses.length - 1].qui,
      texte: `a répondu à « ${m.texte.slice(0, 40)}${m.texte.length > 40 ? "…" : ""} »`,
      ouvrir: () => {
        setFiltre("pour-toi");
        setCherche(null);
        setOuvertes((o) => [...new Set([...o, m.id])]);
        marquerVu(m.id, m.reponses.length);
        window.setTimeout(() => document.getElementById(`lv-${m.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
      },
    }));
  const toutesSuites = [...reponduesAMoi, ...suites];

  const parId = (id: string) => commerces.find((c) => c.id === id);

  return (
    <div className="lv">
      <StylesLaVille />
      {/* ═══ LE MÊME EN-TÊTE SUR TOUT LE FIL ═══ — collé en haut. */}
      <div className="lv-haut">
        <header className="lv-tete">
          <span className="lv-tete-g" aria-hidden="true" />
          <div className="lv-marque">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/clikme-logo-blanc.png" alt="Clikme" />
            <h1>La ville</h1>
          </div>
          <div className="lv-outils">
            <button
              type="button"
              className={cherche !== null ? "on" : ""}
              aria-label="Rechercher dans le fil"
              onClick={() => {
                setCloche(false);
                setCherche((c) => (c === null ? "" : null));
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.5 4.5" />
              </svg>
            </button>
            <button
              type="button"
              className={cloche ? "on" : ""}
              aria-label={toutesSuites.length ? `${toutesSuites.length} nouveautés` : "Notifications"}
              onClick={() => {
                setCherche(null);
                setCloche((c) => !c);
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15l1.5-2Z" />
                <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
              </svg>
              {toutesSuites.length > 0 && <b>{toutesSuites.length}</b>}
            </button>
          </div>
        </header>

        <nav className="lv-filtres" aria-label="Filtrer le fil">
          <button type="button" className={filtre === "pour-toi" ? "on" : ""} onClick={() => setFiltre("pour-toi")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 3.5 11.6 8 16 9.6 11.6 11.2 10 15.7 8.4 11.2 4 9.6 8.4 8Z" />
              <path d="M17.5 13.5 18.3 15.7 20.5 16.5 18.3 17.3 17.5 19.5 16.7 17.3 14.5 16.5 16.7 15.7Z" />
            </svg>
            Pour toi
          </button>
          <button type="button" className={filtre === "amis" ? "on" : ""} onClick={() => setFiltre("amis")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="9" cy="8" r="3.2" />
              <circle cx="17" cy="9" r="2.6" />
              <path d="M3 20c.6-3.4 3-5.4 6-5.4s5.4 2 6 5.4M15.5 14.8c2.6.2 4.6 2 5 5.2" />
            </svg>
            Mes amis
          </button>
          <button type="button" className={filtre === "autour" ? "on" : ""} onClick={() => setFiltre("autour")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" />
              <circle cx="12" cy="10" r="2.3" />
            </svg>
            Autour de moi
          </button>
        </nav>

        {cherche !== null && (
          <div className="lv-cherche">
            <input
              autoFocus
              value={cherche}
              onChange={(e) => setCherche(e.target.value)}
              placeholder="Un commerce, un plat, une personne…"
              aria-label="Rechercher dans le fil"
            />
            <button type="button" aria-label="Fermer la recherche" onClick={() => setCherche(null)}>
              ✕
            </button>
          </div>
        )}

        {/* ═══ LA CLOCHE : LA SUITE DE VOS ÉCHANGES ═══ — seulement du vrai. */}
        {cloche && (
          <section className="lv-suites" aria-label="La suite de vos échanges">
            {toutesSuites.length === 0 ? (
              <p className="lv-note">Rien de neuf pour l’instant. Les réponses à tes publications arriveront ici.</p>
            ) : (
              toutesSuites.slice(0, 5).map((s) => (
                <button
                  key={s.cle}
                  type="button"
                  className="lv-suite"
                  onClick={() => {
                    setCloche(false);
                    s.ouvrir();
                  }}
                >
                  <Avatar qui={s.qui} petit />
                  <span>
                    <b>{s.qui}</b> {s.texte}
                  </span>
                  <s aria-hidden="true">›</s>
                </button>
              ))
            )}
          </section>
        )}
      </div>

      <div className="lv-fil">
        {fil.length === 0 && (
          <p className="lv-vide">
            {q
              ? `Rien ne correspond à « ${cherche} » dans le fil.`
              : filtre === "amis"
                ? amis.length
                  ? "Tes amis n’ont encore rien partagé. Partage le premier : touche le fantôme."
                  : "Tu n’as pas encore d’amis ici. Invite-les depuis Ma maison, ou partage le premier."
                : "Rien pour l’instant autour de toi. Sois le premier à dire ce qui se passe : touche le fantôme."}
          </p>
        )}

        {fil.map((e) =>
          e.salon ? (
            <CarteSortie key={e.cle} s={e.salon} onOuvrir={() => onOuvrirSalon(e.salon!.cle)} onQui={setChezQui} />
          ) : (
            <CartePublication
              key={e.cle}
              m={e.m!}
              branche={e.m!.commerce ? parId(e.m!.commerce.id)?.branche : undefined}
              suiteDeQuoi={e.m!.suite ? messages.find((x) => x.id === e.m!.suite) : undefined}
              ouverte={ouvertes.includes(e.m!.id)}
              menuOuvert={menu === e.m!.id}
              setMenu={(o) => setMenu(o ? e.m!.id : null)}
              reponse={reponse[e.m!.id] ?? ""}
              setReponse={(t) => setReponse((r) => ({ ...r, [e.m!.id]: t }))}
              onReponses={() => basculerReponses(e.m!)}
              onQui={setChezQui}
              onEssayer={onEssayer}
              onPage={onPage}
              onEnsemble={(sortie) => setVersEnsemble({ m: e.m!, sortie })}
              onSortie={onSortie}
              onSuite={() => {
                setSuiteDe(e.m!);
                setCompose(e.m!.genre === "essai" ? "essai" : "decouverte");
              }}
              onSignaler={onSignaler}
            />
          ),
        )}
      </div>

      {compose && (
        <Composeur
          etape={compose}
          setEtape={setCompose}
          essais={essais}
          commerces={commerces}
          suiteDe={suiteDe}
          preselection={preselection}
          onPremierEssai={() => {
            setCompose(null);
            onPremierEssai();
          }}
          onFermer={() => {
            setCompose(null);
            setSuiteDe(null);
          }}
          onPublie={(visibilite) => {
            setCompose(null);
            setSuiteDe(null);
            setCherche(null);
            setFiltre(visibilite === "amis" ? "amis" : "pour-toi");
            window.setTimeout(() => document.querySelector(".lv")?.scrollTo({ top: 0, behavior: "smooth" }), 60);
          }}
        />
      )}

      {versEnsemble && (
        <VersEnsemble
          m={versEnsemble.m}
          sortie={versEnsemble.sortie}
          mesSalons={mesSalons}
          onFermer={() => setVersEnsemble(null)}
          onPartager={(cible) => {
            const m = versEnsemble.m;
            setVersEnsemble(null);
            onPartagerSalon(m, cible);
          }}
        />
      )}

      {chezQui && (
        <ChezQuelquun
          qui={chezQui}
          publications={vivants.filter((m) => m.qui === chezQui)}
          onFermer={() => setChezQui(null)}
          onPage={onPage}
          onMaison={
            onMaison
              ? (m) => {
                  setChezQui(null);
                  onMaison(m);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

/* ═══ L'AVATAR : UN FANTÔME, ET LA COULEUR DE LA PERSONNE ═══════════════════
   Pas de visage — l'anonymat reste celui d'ailleurs ici : un prénom et un
   fantôme. Le fantôme varie d'une personne à l'autre, sa couleur l'entoure. */
const FANTOMES_AVATAR = [
  "/direct/ville/client-ravi.webp",
  "/direct/ville/client-rit.webp",
  "/direct/ville/client-curieux.webp",
  "/direct/ville/client-main-tendue.webp",
];
function Avatar({ qui, onQui, petit, vocal }: { qui: string; onQui?: (q: string) => void; petit?: boolean; vocal?: boolean }) {
  const moi = qui === "Vous";
  const src = moi ? FANTOMES_AVATAR[0] : FANTOMES_AVATAR[hache(qui) % FANTOMES_AVATAR.length];
  const contenu = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" />
      {vocal && <i aria-hidden="true">♪</i>}
    </>
  );
  const style = { borderColor: moi ? "#F5A23A" : teinte(qui) };
  if (!onQui || moi) {
    return (
      <span className={`lv-av${petit ? " petit" : ""}`} style={style} aria-hidden={petit ? true : undefined} aria-label={petit ? undefined : moi ? "Toi" : qui}>
        {contenu}
      </span>
    );
  }
  return (
    <button type="button" className={`lv-av${petit ? " petit" : ""}`} style={style} onClick={() => onQui(qui)} aria-label={`La maison de ${qui}`}>
      {contenu}
    </button>
  );
}

/** « 2 h », « 12 min », « à l'instant » — court, comme sur les maquettes. */
function quand(m: MessageVille): string {
  const t = ilYA(m);
  return t === "à l'instant" ? "à l’instant" : t;
}

/* ═══ CE QUE LA PUBLICATION EST, DIT EN TROIS MOTS ═══ — à côté du prénom. */
function typeDe(m: MessageVille, branche?: CarteAutour["branche"]): string {
  if (m.genre === "essai") return "Essai partagé";
  if (m.genre === "decouverte") {
    if (estUnLieuDeSortie(branche) || m.nature === "evenement") return "Une idée de sortie";
    if (branche === "fleuriste" || branche === "artisan" || branche === "librairie") return "Ma trouvaille du jour";
    return "Une découverte";
  }
  if (m.audio) return "Dans ma ville";
  if (m.nature === "evenement") return "Une idée de sortie";
  if (m.nature === "cherche") return NATURES.cherche.label;
  if (m.nature === "question") return "Une question";
  return "Dans ma ville";
}

/** Le mot qui désigne le commerce dans « Voir le … ». */
function motDuCommerce(branche?: CarteAutour["branche"]): string {
  const mots: Partial<Record<CarteAutour["branche"], string>> = {
    fleuriste: "Voir le fleuriste",
    librairie: "Voir la librairie",
    restaurant: "Voir le menu",
    bar: "Voir le bar",
    artisan: "Voir l’atelier",
  };
  return (branche && mots[branche]) || "Voir le commerce";
}

/* ═══ LE CONTENU PRINCIPAL D'UNE PUBLICATION ═══════════════════════════════
   La scène figée s'il y en a une ; sinon la photo, telle quelle ; sinon le
   mot vocal ; sinon rien — un message texte reste léger. */
function Contenu({ m, cadre }: { m: MessageVille; cadre?: boolean }) {
  const miniature = m.commerce?.photo;
  if (m.photo && m.scene) {
    return <SceneDuFil scene={m.scene} photo={m.photo} repli={{ commerce: m.commerce?.nom, miniature, essai: m.genre === "essai" }} />;
  }
  if (m.photo && m.genre === "essai") return <CarteSimple photo={m.photo} commerce={m.commerce?.nom} miniature={miniature} essai />;
  if (m.photo) {
    const plat = m.contenu?.type === "plat";
    return (
      <div className={`lv-photo${cadre ? " cadre" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.photo} alt="" loading="lazy" />
        {plat && (
          <span className="lv-pastille">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 3c-1.7 1.2-2.5 3.3-2.5 6.2V13H16v8" />
            </svg>
            {etiquetteDuMenu(m.contenu?.jour)}
          </span>
        )}
      </div>
    );
  }
  if (m.audio) return <LecteurVocal id={m.id} src={m.audio.src} duree={m.audio.duree} />;
  return null;
}

/* ═══ LE MOT VOCAL ═══ — une forme d'onde dessinée une fois, qui se remplit. */
function LecteurVocal({ id, src, duree }: { id: string; src: string; duree: number }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [joue, setJoue] = useState(false);
  const [part, setPart] = useState(0);
  const [temps, setTemps] = useState(0);
  const barres = Array.from({ length: 34 }, (_, i) => 0.25 + (((hache(`${id}${i}`) % 100) / 100) * 0.75) * (0.55 + 0.45 * Math.sin((i / 34) * Math.PI)));
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
  return (
    <div className="lv-vocal">
      <button
        type="button"
        aria-label={joue ? "Mettre en pause" : "Écouter le mot vocal"}
        onClick={() => {
          const a = ref.current;
          if (!a) return;
          if (a.paused) void a.play().catch(() => setJoue(false));
          else a.pause();
        }}
      >
        {joue ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14M16 5v14" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5.5v13l10.5-6.5Z" />
          </svg>
        )}
      </button>
      <span className="lv-onde" aria-hidden="true">
        {barres.map((h, i) => (
          <i key={i} className={i / barres.length < part ? "lu" : ""} style={{ height: `${Math.round(h * 100)}%` }} />
        ))}
      </span>
      <em>{mmss(joue ? temps : duree)}</em>
      <audio
        ref={ref}
        src={src}
        preload="none"
        onPlay={() => setJoue(true)}
        onPause={() => setJoue(false)}
        onEnded={() => {
          setJoue(false);
          setPart(0);
        }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          const d = Number.isFinite(a.duration) && a.duration > 0 ? a.duration : duree;
          setPart(d ? a.currentTime / d : 0);
          setTemps(a.currentTime);
        }}
      />
    </div>
  );
}

function CartePublication({
  m,
  branche,
  suiteDeQuoi,
  ouverte,
  menuOuvert,
  setMenu,
  reponse,
  setReponse,
  onReponses,
  onQui,
  onEssayer,
  onPage,
  onEnsemble,
  onSortie,
  onSuite,
  onSignaler,
}: {
  m: MessageVille;
  branche?: CarteAutour["branche"];
  suiteDeQuoi?: MessageVille;
  ouverte: boolean;
  menuOuvert: boolean;
  setMenu: (o: boolean) => void;
  reponse: string;
  setReponse: (t: string) => void;
  onReponses: () => void;
  onQui: (q: string) => void;
  onEssayer: (ref: { carte: string; piece: string }) => void;
  onPage: (id: string) => void;
  onEnsemble: (sortie: boolean) => void;
  onSortie: (m: MessageVille) => void;
  onSuite: () => void;
  onSignaler?: (m: MessageVille) => void;
}) {
  const moi = m.qui === "Vous";
  const reste = resteDit(m);
  const media = Boolean(m.photo);
  const envoyer = () => {
    const x = reponse.trim();
    if (!x) return;
    repondreVille(m.id, x);
    setReponse("");
  };
  const lieu = m.ou && m.ou !== "Autour de vous" ? m.ou : moi ? "Autour de toi" : "";
  const sortie = m.nature === "evenement" || estUnLieuDeSortie(branche) || m.nature === "cherche";

  /* ═══ UNE ACTION, ET CELLE QUI CORRESPOND ═══ — jamais toutes partout. */
  let action: ReactNode = null;
  if (m.genre === "essai") {
    if (m.reference && !moi) {
      action = (
        <button type="button" className="lv-cta" onClick={() => onEssayer(m.reference!)}>
          <Etincelle /> Essayer sur moi
        </button>
      );
    } else if (m.commerce && !moi) {
      action = (
        <button type="button" className="lv-cta" onClick={() => onPage(m.commerce!.id)}>
          <Etincelle /> Voir cet essai
        </button>
      );
    }
  } else if (m.nature === "cherche" && !m.genre) {
    action = (
      <button type="button" className="lv-cta" onClick={() => onSortie(m)}>
        <Avion /> Proposer à mes amis
      </button>
    );
  } else if (sortie) {
    action = (
      <button type="button" className="lv-cta" onClick={() => onEnsemble(true)}>
        <Avion /> Proposer à mes amis
      </button>
    );
  } else if (m.genre === "decouverte" && m.contenu?.type === "plat") {
    action = (
      <button type="button" className="lv-cta" onClick={() => onEnsemble(false)}>
        <Fleche /> En parler à mes amis
      </button>
    );
  } else if (m.genre === "decouverte" && m.commerce) {
    action = (
      <button type="button" className="lv-cta creux" onClick={() => onPage(m.commerce!.id)}>
        {motDuCommerce(branche)} →
      </button>
    );
  }
  const messageLocal = !m.genre;

  return (
    <article className="lv-carte" id={`lv-${m.id}`}>
      <header className="lv-h">
        <Avatar qui={m.qui} onQui={onQui} vocal={Boolean(m.audio)} />
        <div className="lv-h-t">
          <p className="lv-nom">
            <b>{moi ? "Toi" : m.qui}</b>
            <em> · {typeDe(m, branche)}</em>
          </p>
          <p className="lv-lieu">
            {lieu && (
              <>
                <Epingle />
                <span>{m.commerce && m.genre ? m.commerce.nom : lieu}</span>
              </>
            )}
            {/* « MES AMIS » SE DIT ; le public est le cas courant du fil. */}
            {m.visibilite === "amis" && <i>· 👥 Amis</i>}
          </p>
        </div>
        <span className="lv-quand">{quand(m)}</span>
        <div className="lv-menu">
          <button type="button" className="lv-points" aria-label="Plus d’options" aria-expanded={menuOuvert} onClick={() => setMenu(!menuOuvert)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="5.5" r="1.7" />
              <circle cx="12" cy="12" r="1.7" />
              <circle cx="12" cy="18.5" r="1.7" />
            </svg>
          </button>
          {menuOuvert && (
            <>
              <button type="button" className="lv-menu-fond" aria-label="Fermer" onClick={() => setMenu(false)} />
              <div className="lv-menu-l" role="menu">
                {m.commerce && (
                  <button type="button" role="menuitem" onClick={() => (setMenu(false), onPage(m.commerce!.id))}>
                    Voir {m.commerce.nom}
                  </button>
                )}
                {!moi && (
                  <button type="button" role="menuitem" onClick={() => (setMenu(false), onQui(m.qui))}>
                    Chez {m.qui}
                  </button>
                )}
                {moi && m.genre && (
                  <button type="button" role="menuitem" onClick={() => (setMenu(false), onSuite())}>
                    ↪ Publier la suite
                  </button>
                )}
                {moi && (
                  <button type="button" role="menuitem" onClick={() => (setMenu(false), retirerDeLaVille(m.id))}>
                    Retirer ma publication
                  </button>
                )}
                {/* SIGNALER, ET SEULEMENT CHEZ LES AUTRES : on demande
                    confirmation, puis la publication quitte mon fil et
                    l'administrateur la voit. */}
                {onSignaler && !moi && (
                  <button
                    type="button"
                    role="menuitem"
                    className="lv-signaler"
                    onClick={() => {
                      setMenu(false);
                      if (window.confirm("Signaler cette publication ? Elle disparaîtra de ton fil, et ClikMe la vérifiera.")) onSignaler(m);
                    }}
                  >
                    Signaler
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {suiteDeQuoi && <p className="lv-suitede">↪ Suite de : « {suiteDeQuoi.texte.slice(0, 50)} »</p>}

      {/* UN MESSAGE SANS PHOTO SE LIT D'ABORD : le texte, puis le vocal. */}
      {!media && <p className="lv-texte grand">{m.texte}</p>}
      <Contenu m={m} />
      {media && m.texte && <p className="lv-texte">{m.texte}</p>}
      {m.contenu && (m.contenu.type === "plat" || m.contenu.prix) && (
        <p className="lv-sous">
          {m.contenu.nom}
          {m.contenu.detail ? ` & ${m.contenu.detail.toLowerCase()}` : ""}
          {m.contenu.prix && <b> · {m.contenu.prix}</b>}
        </p>
      )}
      {m.vecu && <p className="lv-vecu">📍 Vécu sur place</p>}

      <footer className="lv-pied">
        <button type="button" className={`lv-pill coeur${m.monCoeur ? " on" : ""}`} onClick={() => reagirVille(m.id)} aria-pressed={Boolean(m.monCoeur)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" />
          </svg>
          {m.coeurs > 0 ? m.coeurs : ""}
        </button>
        <button type="button" className="lv-pill" onClick={onReponses}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4.5 18.5 6 15a7.5 7.5 0 1 1 3 2.6Z" />
          </svg>
          {/* AVEC UNE ACTION À CÔTÉ, LE CHIFFRE SEUL : la ligne tient sur un téléphone. */}
          {m.reponses.length > 0 ? m.reponses.length : action ? "" : messageLocal ? "Répondre" : "Commenter"}
        </button>
        {m.nature === "cherche" && !m.genre && (
          <button type="button" className={`lv-pill${(m.interesses ?? []).includes("Vous") ? " on" : ""}`} onClick={() => caMInteresse(m.id)}>
            🙋 {(m.interesses ?? []).length || ""}
          </button>
        )}
        <span className="lv-espace" />
        {action}
      </footer>
      {reste && (
        <p className="lv-bas">
          <span>s’efface dans {reste}</span>
        </p>
      )}

      {ouverte && (
        <div className="lv-reponses">
          {m.reponses.map((r) => (
            <p key={r.id}>
              <b>{r.qui === "Vous" ? "Toi" : r.qui}</b>
              {r.officiel && <u>{r.officiel}</u>} {r.texte}
            </p>
          ))}
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              envoyer();
            }}
          >
            <input value={reponse} onChange={(ev) => setReponse(ev.target.value)} placeholder="Ta réponse…" maxLength={280} />
            <button type="submit" disabled={!reponse.trim()} aria-label="Envoyer">
              ↑
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

function CarteSortie({ s, onOuvrir, onQui }: { s: Salon; onOuvrir: () => void; onQui: (q: string) => void }) {
  return (
    <article className="lv-carte">
      <header className="lv-h">
        <Avatar qui={s.parQui} onQui={onQui} />
        <div className="lv-h-t">
          <p className="lv-nom">
            <b>{s.parQui === "Vous" ? "Toi" : s.parQui}</b>
            <em> · Une idée de sortie</em>
          </p>
          <p className="lv-lieu">
            {s.ou && <Epingle />}
            {s.ou && <span>{s.ou}</span>}
            <i>{s.ou ? "· " : ""}🌍 Ouvert à tous</i>
          </p>
        </div>
        <span className="lv-quand">{s.quand}</span>
      </header>
      {s.photo && (
        <div className="lv-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.photo} alt="" loading="lazy" />
        </div>
      )}
      <p className={`lv-texte${s.photo ? "" : " grand"}`}>{s.annonce ?? s.sujet}</p>
      <p className="lv-sous">
        {s.viennent.length} {s.viennent.length > 1 ? "viennent" : "vient"}
        {s.reste ? ` · ${s.reste}` : ""}
      </p>
      <footer className="lv-pied">
        <button type="button" className="lv-pill" onClick={onOuvrir}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4.5 18.5 6 15a7.5 7.5 0 1 1 3 2.6Z" />
          </svg>
          En discuter
        </button>
        <span className="lv-espace" />
        <button type="button" className="lv-cta" onClick={onOuvrir}>
          <Avion /> Je viens
        </button>
      </footer>
    </article>
  );
}

/* ═══ LES PETITS DESSINS ═══ */
const Etincelle = () => (
  <svg className="lv-ic" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10 3.5 11.6 8 16 9.6 11.6 11.2 10 15.7 8.4 11.2 4 9.6 8.4 8Z" />
    <path d="M17.5 13.5 18.3 15.7 20.5 16.5 18.3 17.3 17.5 19.5 16.7 17.3 14.5 16.5 16.7 15.7Z" />
  </svg>
);
const Avion = () => (
  <svg className="lv-ic trait" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21 3 3 10.5l7.5 2.4L13 21 21 3Z" />
  </svg>
);
const Fleche = () => (
  <svg className="lv-ic" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M14 5l7 6.5-7 6.5v-4c-5 0-8.5 1.5-11 5 1-5.2 4-9.5 11-10.2Z" />
  </svg>
);
const Epingle = () => (
  <svg className="lv-pin" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.3" />
  </svg>
);

/* ═══ « TU VEUX PARTAGER QUOI ? » ═══════════════════════════════════════════
   Trois choix, puis UNE page qui finit toujours de la même façon : l'aperçu,
   la légende, l'audience, « Publier dans La ville ». On ne choisit jamais de
   modèle graphique : la présentation vient du contenu. */
type Etape = "choix" | "essai" | "decouverte" | "message";

/** Ce qu'on peut montrer d'un commerce dans « Une découverte ». */
function contenusDe(c: CarteAutour): (ContenuPartage & { cle: string })[] {
  const l: (ContenuPartage & { cle: string })[] = [];
  const resto = c.branche === "restaurant";
  const jour = jourDe();
  if (c.menu?.photo) {
    l.push({ cle: "menu", type: "plat", nom: c.menu.plat, detail: c.menu.description?.split("·")[0]?.trim() || undefined, prix: c.menu.prix, photo: c.menu.photo, jour });
  }
  for (const [i, mo] of (c.moments ?? []).entries()) {
    if (!mo.photo || !mo.titre || l.some((x) => x.nom === mo.titre)) continue;
    l.push({ cle: `moment-${i}`, type: resto ? "plat" : "produit", nom: mo.titre, prix: mo.prix, photo: mo.photo, ...(resto ? { jour } : {}) });
  }
  for (const a of c.catalogue ?? []) {
    if (!a.photo || l.some((x) => x.nom === a.nom)) continue;
    // UN PLAT DE SA CARTE N'EST PAS LE MENU DU JOUR : pas de jour, donc « À la carte ».
    l.push({ cle: `cat-${a.id}`, type: resto ? "plat" : "produit", nom: a.nom, detail: a.detail, prix: a.prix, photo: a.photo });
  }
  const salle = (c.sesPhotos ?? []).find((p) => /salle|terrasse|lieu|boutique|atelier|int[ée]rieur/i.test(p.quoi));
  const lieu = salle?.src ?? c.couverture ?? c.photo;
  if (lieu) l.push({ cle: "lieu", type: "lieu", nom: salle?.quoi ?? "Le lieu", photo: lieu });
  return l.slice(0, 12);
}

function Composeur({
  etape,
  setEtape,
  essais,
  commerces,
  suiteDe,
  preselection,
  onPremierEssai,
  onFermer,
  onPublie,
}: {
  etape: Etape;
  setEtape: (e: Etape) => void;
  essais: EssaiPartageable[];
  commerces: CarteAutour[];
  suiteDe: MessageVille | null;
  preselection?: { commerce: string; contenu?: string; n: number };
  onPremierEssai: () => void;
  onFermer: () => void;
  onPublie: (v: Audience) => void;
}) {
  const parId = (id?: string) => (id ? commerces.find((c) => c.id === id) : undefined);
  const [essai, setEssai] = useState<EssaiPartageable | null>(essais[0] ?? null);
  const [commerce, setCommerce] = useState<CarteAutour | null>(parId(suiteDe?.commerce?.id ?? preselection?.commerce) ?? null);
  const [contenu, setContenu] = useState<string>(preselection?.contenu ?? "");
  const [maPhoto, setMaPhoto] = useState<string | null>(null);
  // LA LÉGENDE PROPOSÉE N'EXISTE QUE POUR UN ESSAI : elle se pose en y entrant.
  const suggestion = (e: EssaiPartageable) => `${e.nom} sur moi, vous en pensez quoi ?`;
  const [texte, setTexte] = useState(etape === "essai" && essais[0] && !suiteDe ? suggestion(essais[0]) : "");
  const [vecu, setVecu] = useState(false);
  const [lieu, setLieu] = useState("");
  const [voirLieu, setVoirLieu] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  // « MES AMIS » D'ABORD : le public se choisit, et le choix est toujours montré.
  const [visibilite, setVisibilite] = useState<Audience>("amis");
  const vocal = useEnregistreur();
  /** L'instant de l'aperçu : la publication dira « à l'instant ». */
  const [maintenant] = useState(() => Date.now());
  const pics = useRef<HTMLDivElement | null>(null);

  /* ─── CE QUE LA PUBLICATION SERA ─── calculé ici, montré en aperçu, publié tel quel. */
  const commerceEssai = essai ? parId(essai.carte) : undefined;
  const sceneEssai: SceneVille | undefined = commerceEssai ? (sceneDeVitrine(commerceEssai) ?? undefined) : undefined;

  const options = commerce ? contenusDe(commerce) : [];
  const choisi = maPhoto ? null : (options.find((o) => o.cle === contenu) ?? options[0] ?? null);
  const photoDecouverte = maPhoto ?? choisi?.photo ?? suiteDe?.photo;
  // UNE PHOTO PRISE SUR PLACE RESTE UNE PHOTO : l'ambiance illustrée ne se pose
  // que sur la photo de la salle d'un bar, jamais sur celle d'un habitant.
  const sceneDecouverte: SceneVille | undefined =
    !maPhoto && choisi?.type === "lieu" && estUnLieuDeSortie(commerce?.branche) ? sceneDAmbiance() : undefined;
  const contenuDecouverte: ContenuPartage | undefined = maPhoto
    ? { type: "photo", nom: commerce ? `Chez ${commerce.nom}` : "Ma photo" }
    : choisi
      ? (({ cle: _c, ...x }) => (void _c, x))(choisi)
      : undefined;

  const miniature = (c?: CarteAutour) => (c ? (c.sesPhotos?.[0]?.src ?? c.photo) : undefined);

  const apercu: MessageVille | null = (() => {
    const base = {
      id: "apercu",
      qui: "Vous",
      distance: "0 m",
      metres: 0,
      a: maintenant,
      dure: 180,
      coeurs: 0,
      reponses: [],
      visibilite,
      texte: texte.trim(),
    };
    if (etape === "essai" && (essai || suiteDe)) {
      return {
        ...base,
        ou: commerceEssai?.nom ?? essai?.lieu ?? suiteDe?.ou ?? "",
        nature: "question",
        genre: "essai",
        photo: essai?.image ?? suiteDe?.photo,
        scene: essai ? sceneEssai : suiteDe?.scene,
        commerce: essai ? { id: essai.carte, nom: commerceEssai?.nom ?? essai.lieu, photo: miniature(commerceEssai) } : suiteDe?.commerce,
      } as MessageVille;
    }
    if (etape === "decouverte" && (commerce || suiteDe)) {
      return {
        ...base,
        ou: commerce?.nom ?? suiteDe?.ou ?? "",
        nature: estUnLieuDeSortie(commerce?.branche) ? "evenement" : "coup-de-coeur",
        genre: "decouverte",
        photo: photoDecouverte,
        scene: sceneDecouverte,
        contenu: contenuDecouverte,
        vecu,
        commerce: commerce ? { id: commerce.id, nom: commerce.nom, photo: miniature(commerce) } : suiteDe?.commerce,
      } as MessageVille;
    }
    if (etape === "message") {
      return {
        ...base,
        ou: lieu.trim() || "Autour de vous",
        nature: comprendre(texte),
        photo: photoMessage ?? undefined,
        audio: vocal.son ?? undefined,
      } as MessageVille;
    }
    return null;
  })();

  const pret =
    etape === "message"
      ? texte.trim().length > 0 || Boolean(photoMessage) || Boolean(vocal.son)
      : Boolean(apercu && (apercu.photo || apercu.texte));

  const publier = () => {
    if (!apercu || !pret) return;
    publierDansLaVille({
      texte: apercu.texte || (etape === "message" && vocal.son ? "Un mot vocal" : ""),
      genre: apercu.genre,
      nature: apercu.nature,
      visibilite,
      photo: apercu.photo,
      commerce: apercu.commerce,
      reference:
        etape === "essai"
          ? essai?.piece
            ? { carte: essai.carte, piece: essai.piece, nom: essai.nom }
            : suiteDe?.reference
          : undefined,
      vecu: apercu.vecu,
      suite: suiteDe?.id,
      scene: apercu.scene,
      contenu: apercu.contenu,
      audio: apercu.audio,
      ou: etape === "message" ? lieu : undefined,
    });
    onPublie(visibilite);
  };

  const titre =
    etape === "essai" ? (suiteDe ? "La suite de mon essai" : "Partager mon essai") : etape === "decouverte" ? (suiteDe ? "La suite" : "Une découverte") : "Un message sur la ville";

  if (etape === "choix") {
    return (
      <div className="lv-fond" role="dialog" aria-label="Tu veux partager quoi ?" onClick={onFermer}>
        <div className="lv-feuille lv-choix-f" onClick={(e) => e.stopPropagation()}>
          <span className="lv-poignee" aria-hidden="true" />
          <button type="button" className="lv-x" aria-label="Fermer" onClick={onFermer}>
            ✕
          </button>
          <div className="lv-bulle-l">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/direct/ville/client-rit.webp" alt="" />
            <p>Tu veux partager quoi&nbsp;?</p>
          </div>
          <button
            type="button"
            className="lv-choix"
            onClick={() => {
              setTexte(essai ? suggestion(essai) : "");
              setEtape("essai");
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={essais[0]?.image ?? "/direct/accueil/coiffure-apres.jpg"} alt="" />
            <span>
              <b>Un de mes essais</b>
              <em>Choisis ta coupe, ta tenue ou tes lunettes.</em>
            </span>
            <s aria-hidden="true">›</s>
          </button>
          <button
            type="button"
            className="lv-choix"
            onClick={() => {
              setTexte("");
              setEtape("decouverte");
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/direct/plat-garbure-servi.jpeg" alt="" />
            <span>
              <b>Une découverte</b>
              <em>Un plat, une création, un lieu qui te plaît.</em>
            </span>
            <s aria-hidden="true">›</s>
          </button>
          <button
            type="button"
            className="lv-choix"
            onClick={() => {
              setTexte("");
              setEtape("message");
            }}
          >
            <span className="lv-choix-msg" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/direct/concert-kiosque.jpg" alt="" />
              <i>•••</i>
            </span>
            <span>
              <b>Un message sur la ville</b>
              <em>Une question, une photo ou un mot vocal.</em>
            </span>
            <s aria-hidden="true">›</s>
          </button>
          <p className="lv-garde">🔒 Tu verras un aperçu avant de publier.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lv-page" role="dialog" aria-label={titre}>
      <header className="lv-page-h">
        <button type="button" aria-label="Retour" onClick={() => (suiteDe ? onFermer() : setEtape("choix"))}>
          ‹
        </button>
        <div>
          <h2>{titre}</h2>
          <small>2/2</small>
        </div>
        <button type="button" aria-label="Fermer" onClick={onFermer}>
          ✕
        </button>
      </header>

      <div className="lv-page-c">
        {/* ─── UN DE MES ESSAIS ─── */}
        {etape === "essai" && !suiteDe && essais.length === 0 && (
          <div className="lv-aucun">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/direct/ville/client-curieux.webp" alt="" />
            <p>
              Tu n’as pas encore d’essai enregistré. Essaie une coupe, une tenue ou des lunettes chez un commerçant : tu pourras ensuite choisir de le
              partager ici.
            </p>
            <button type="button" className="lv-publier" onClick={onPremierEssai}>
              ✨ Faire un premier essai
            </button>
          </div>
        )}
        {etape === "essai" && !suiteDe && essais.length > 0 && (
          <>
            <h3>Un de mes essais</h3>
            <div className="lv-picks" ref={pics}>
              {essais.map((p) => (
                <button
                  key={p.cle}
                  type="button"
                  className={`lv-pick${essai?.cle === p.cle ? " on" : ""}`}
                  aria-pressed={essai?.cle === p.cle}
                  onClick={() => {
                    setEssai(p);
                    if (!texte || essais.some((x) => texte === suggestion(x))) setTexte(suggestion(p));
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.nom} />
                </button>
              ))}
            </div>
            {essai && (
              <div className="lv-ligne">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={essai.image} alt="" />
                <span>
                  <b>{essai.nom}</b> · {commerceEssai?.nom ?? essai.lieu}
                </span>
                <button type="button" onClick={() => pics.current?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                  Changer ›
                </button>
              </div>
            )}
          </>
        )}

        {/* ─── UNE DÉCOUVERTE ─── */}
        {etape === "decouverte" && !suiteDe && (
          <>
            <h3>Le commerce</h3>
            <div className="lv-commerces">
              {[...commerces]
                .sort((x, y) => x.metres - y.metres)
                .slice(0, 60)
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={commerce?.id === c.id ? "on" : ""}
                    aria-pressed={commerce?.id === c.id}
                    onClick={() => {
                      setCommerce(c);
                      setContenu("");
                      setMaPhoto(null);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {miniature(c) ? <img src={miniature(c)} alt="" /> : <span aria-hidden="true">📍</span>}
                    <b>{c.nom}</b>
                  </button>
                ))}
            </div>
            {commerce && (
              <>
                <h3>Ce que tu partages</h3>
                <div className="lv-picks">
                  {options.map((o) => (
                    <button
                      key={o.cle}
                      type="button"
                      className={`lv-pick avec-mot${!maPhoto && choisi?.cle === o.cle ? " on" : ""}`}
                      aria-pressed={!maPhoto && choisi?.cle === o.cle}
                      onClick={() => {
                        setMaPhoto(null);
                        setContenu(o.cle);
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={o.photo} alt="" />
                      <span>{o.nom}</span>
                    </button>
                  ))}
                  <label className={`lv-pick avec-mot ajout${maPhoto ? " on" : ""}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {maPhoto ? <img src={maPhoto} alt="" /> : <i aria-hidden="true">📷</i>}
                    <span>Ma photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) setMaPhoto(await reduirePhoto(f, 1400).catch(() => null));
                      }}
                    />
                  </label>
                </div>
              </>
            )}
          </>
        )}

        {/* ─── UN MESSAGE SUR LA VILLE ─── */}
        {etape === "message" && (
          <>
            <h3>Ton message</h3>
            <textarea
              className="lv-zone"
              value={texte}
              onChange={(e) => setTexte(e.target.value.slice(0, 220))}
              rows={3}
              autoFocus
              placeholder="Il se passe quoi en ville ? Une question, un bon plan…"
            />
            <div className="lv-ajouts">
              <label className={photoMessage ? "on" : ""}>
                📷 {photoMessage ? "Photo ajoutée" : "Une photo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setPhotoMessage(await reduirePhoto(f, 1400).catch(() => null));
                  }}
                />
              </label>
              {vocal.etat === "enregistre" ? (
                <button type="button" className="on rouge" onClick={vocal.arreter}>
                  ⏹ {vocal.secondes} s
                </button>
              ) : (
                <button type="button" className={vocal.son ? "on" : ""} onClick={vocal.son ? vocal.effacer : vocal.demarrer}>
                  🎙️ {vocal.son ? "Effacer le vocal" : "Un mot vocal"}
                </button>
              )}
              <button type="button" className={voirLieu || lieu ? "on" : ""} onClick={() => setVoirLieu((v) => !v)}>
                📍 {lieu ? lieu.slice(0, 18) : "Un lieu"}
              </button>
            </div>
            {vocal.erreur && <p className="lv-attention">{vocal.erreur}</p>}
            {photoMessage && (
              <button type="button" className="lv-lien" onClick={() => setPhotoMessage(null)}>
                Retirer la photo
              </button>
            )}
            {voirLieu && (
              <input className="lv-zone une" value={lieu} onChange={(e) => setLieu(e.target.value.slice(0, 60))} placeholder="Facultatif : près des Halles, aux Arènes…" />
            )}
          </>
        )}

        {/* ─── L'APERÇU, TOUJOURS ─── */}
        {apercu && (etape !== "message" || pret) && (
          <section className="lv-apercu" aria-label="Aperçu">
            <h3>Aperçu</h3>
            {etape === "message" ? (
              <div className="lv-apercu-msg">
                {!apercu.photo && apercu.texte && <p className="lv-texte grand">{apercu.texte}</p>}
                <Contenu m={apercu} />
                {apercu.photo && apercu.texte && <p className="lv-texte">{apercu.texte}</p>}
              </div>
            ) : (
              <Contenu m={apercu} />
            )}
            {etape === "essai" && apercu.photo && (
              <p className="lv-note-ic">
                <Epingle />
                {apercu.scene ? "Ton essai prend place dans la vitrine du commerce." : "Ton essai s’affiche avec le nom du commerce."}
              </p>
            )}
            {etape === "decouverte" && apercu.contenu?.type === "plat" && (
              <p className="lv-note-ic">🍴 {apercu.contenu.jour ? "Le plat du jour, daté : demain, la publication dira son jour." : "Un plat de sa carte."}</p>
            )}
            {etape === "decouverte" && apercu.scene && <p className="lv-note-ic">✨ La salle du commerçant, avec deux fantômes : « Ambiance illustrée ».</p>}
          </section>
        )}

        {apercu && etape !== "message" && (
          <>
            <div className="lv-legende-h">
              <h3>Légende</h3>
              <small>{texte.length}/220</small>
            </div>
            <textarea
              className="lv-zone"
              value={texte}
              onChange={(e) => setTexte(e.target.value.slice(0, 220))}
              rows={2}
              placeholder={etape === "essai" ? "Et si je passais au carré ?" : "Ça vous tente pour ce midi ?"}
            />
            {etape === "decouverte" && (
              <label className="lv-coche">
                <input type="checkbox" checked={vecu} onChange={(e) => setVecu(e.target.checked)} />
                J’y suis allé·e (la publication dira « Vécu sur place »)
              </label>
            )}
          </>
        )}
        {etape === "message" && <small className="lv-compte">{texte.length}/220</small>}

        {(apercu || etape === "message") && (
          <>
            <div className="lv-audience">
              <span>Visible par :</span>
              <div role="radiogroup" aria-label="Qui la voit">
                <button type="button" role="radio" aria-checked={visibilite === "amis"} className={visibilite === "amis" ? "on" : ""} onClick={() => setVisibilite("amis")}>
                  👥 Mes amis
                </button>
                <button type="button" role="radio" aria-checked={visibilite === "public"} className={visibilite === "public" ? "on" : ""} onClick={() => setVisibilite("public")}>
                  🌍 Public
                </button>
              </div>
            </div>
            {visibilite === "public" && etape === "essai" && (
              <p className="lv-attention">⚠️ Ta photo — et donc ton visage — sera visible par tous les habitants de ta ville.</p>
            )}
            <button type="button" className="lv-publier" disabled={!pret} onClick={publier}>
              <Etincelle /> Publier dans La ville
            </button>
            <p className="lv-garde">🔒 Rien n’est publié sans ton accord.</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══ LE MOT VOCAL : ENREGISTRER, RÉÉCOUTER, EFFACER ═════════════════════════
   Une minute au plus. Le son reste dans le téléphone jusqu'à la publication ;
   dans la vraie ville, il part alors au serveur (`ville-sync.ts`). Un micro
   refusé ne bloque rien : on le dit, et le message part sans vocal. */
function useEnregistreur() {
  const [etat, setEtat] = useState<"repos" | "enregistre">("repos");
  const [secondes, setSecondes] = useState(0);
  const [son, setSon] = useState<{ src: string; duree: number } | null>(null);
  const [erreur, setErreur] = useState("");
  const rec = useRef<MediaRecorder | null>(null);
  const debut = useRef(0);
  const minuteur = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (minuteur.current) window.clearInterval(minuteur.current);
      rec.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const arreter = () => {
    if (minuteur.current) window.clearInterval(minuteur.current);
    minuteur.current = null;
    if (rec.current && rec.current.state !== "inactive") rec.current.stop();
    setEtat("repos");
  };

  const demarrer = async () => {
    setErreur("");
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErreur("Ce téléphone ne sait pas enregistrer ici. Écris ton message, ou ajoute une photo.");
      return;
    }
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(flux);
      const morceaux: Blob[] = [];
      r.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
      r.onstop = () => {
        flux.getTracks().forEach((t) => t.stop());
        const duree = Math.max(1, Math.round((Date.now() - debut.current) / 1000));
        const blob = new Blob(morceaux, { type: r.mimeType || "audio/webm" });
        const lecteur = new FileReader();
        lecteur.onload = () => setSon({ src: String(lecteur.result), duree });
        lecteur.readAsDataURL(blob);
      };
      rec.current = r;
      debut.current = Date.now();
      setSecondes(0);
      r.start();
      setEtat("enregistre");
      minuteur.current = window.setInterval(() => {
        const s = Math.round((Date.now() - debut.current) / 1000);
        setSecondes(s);
        if (s >= 60) arreter();
      }, 500);
    } catch {
      setErreur("Le micro n’est pas disponible. Écris ton message, ou ajoute une photo.");
    }
  };

  return { etat, secondes, son, erreur, demarrer, arreter, effacer: () => setSon(null) };
}

/* ═══ VERS ENSEMBLE ══════════════════════════════════════════════════════════
   « En parler à mes amis » ou « Proposer à mes amis » ouvre une discussion
   avec le contenu déjà associé : un nouveau salon (privé par défaut), ou un
   salon où je suis déjà. Le choix public/privé du salon n'est pas l'audience
   de la publication — et un contenu réservé à mes amis ne part pas dans un
   salon public sans que je le confirme. */
function VersEnsemble({
  m,
  sortie,
  mesSalons,
  onFermer,
  onPartager,
}: {
  m: MessageVille;
  sortie: boolean;
  mesSalons: SalonPartageable[];
  onFermer: () => void;
  onPartager: (c: CibleSalon) => void;
}) {
  const [prive, setPrive] = useState(true);
  const [confirmer, setConfirmer] = useState<CibleSalon | null>(null);
  const reserve = m.visibilite === "amis";
  const essayer = (c: CibleSalon, publicCible: boolean) => {
    if (reserve && publicCible) setConfirmer(c);
    else onPartager(c);
  };
  return (
    <div className="lv-fond" role="dialog" aria-label={sortie ? "Proposer à mes amis" : "En parler à mes amis"} onClick={onFermer}>
      <div className="lv-feuille" onClick={(e) => e.stopPropagation()}>
        <span className="lv-poignee" aria-hidden="true" />
        <h2>{sortie ? "Proposer à mes amis" : "En parler à mes amis"}</h2>
        <div className="lv-ligne">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {m.photo ? <img src={m.photo} alt="" /> : <span className="lv-ligne-ic">💬</span>}
          <span>
            <b>{m.commerce?.nom ?? m.ou}</b> · {m.texte.slice(0, 60)}
          </span>
        </div>

        {confirmer ? (
          <>
            <p className="lv-attention">
              Cette publication n’est visible que par tes amis. La partager dans un salon public la montrera à tous ceux qui y entrent.
            </p>
            <button type="button" className="lv-publier" onClick={() => onPartager(confirmer)}>
              Oui, la partager quand même
            </button>
            <button type="button" className="lv-retour" onClick={() => setConfirmer(null)}>
              Annuler
            </button>
          </>
        ) : (
          <>
            <h3>Nouveau salon</h3>
            <div className="lv-qui" role="radiogroup" aria-label="Qui peut entrer">
              <button type="button" role="radio" aria-checked={prive} className={prive ? "on" : ""} onClick={() => setPrive(true)}>
                🔒 Privé · sur invitation
              </button>
              <button type="button" role="radio" aria-checked={!prive} className={!prive ? "on" : ""} onClick={() => setPrive(false)}>
                🌍 Public · ouvert à tous
              </button>
            </div>
            <button type="button" className="lv-publier" onClick={() => essayer({ prive }, !prive)}>
              Créer le salon
            </button>
            {mesSalons.length > 0 && (
              <>
                <h3>Ou dans un salon où tu es</h3>
                <div className="lv-salons">
                  {mesSalons.slice(0, 6).map((s) => (
                    <button key={s.cle} type="button" onClick={() => essayer({ cle: s.cle }, !s.prive)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {s.photo ? <img src={s.photo} alt="" /> : <span aria-hidden="true">💬</span>}
                      <b>{s.sujet}</b>
                      <em>{s.prive ? "🔒 Privé" : "🌍 Public"}</em>
                    </button>
                  ))}
                </div>
              </>
            )}
            <p className="lv-garde">Le salon se retrouve ensuite dans Ensemble.</p>
          </>
        )}
      </div>
    </div>
  );
}

/* LA MAISON D'UN HABITANT — dans la maquette, ce qu'il a rendu visible ici. */
function ChezQuelquun({
  qui,
  publications,
  onFermer,
  onPage,
  onMaison,
}: {
  qui: string;
  publications: MessageVille[];
  onFermer: () => void;
  onPage: (id: string) => void;
  onMaison?: (m: MessageVille) => void;
}) {
  // DANS LA VRAIE VILLE, SA MAISON EXISTE : on la retrouve par une de ses publications.
  const parOu = onMaison && qui !== "Vous" ? publications[0] : undefined;
  const adresses = [...new Map(publications.filter((m) => m.commerce).map((m) => [m.commerce!.id, m.commerce!])).values()];
  return (
    <div className="lv-fond" role="dialog" aria-label={`Chez ${qui}`} onClick={onFermer}>
      <div className="lv-feuille" onClick={(e) => e.stopPropagation()}>
        <span className="lv-poignee" aria-hidden="true" />
        <div className="lv-chez">
          <Avatar qui={qui} />
          <div>
            <h2>Chez {qui}</h2>
            <p className="lv-note">Ce que {qui} partage avec toi.</p>
          </div>
        </div>
        {adresses.length > 0 && (
          <>
            <h3>Ses adresses</h3>
            <div className="lv-adresses">
              {adresses.map((c) => (
                <button key={c.id} type="button" onClick={() => onPage(c.id)}>
                  {c.nom} ›
                </button>
              ))}
            </div>
          </>
        )}
        <h3>Ses publications</h3>
        {publications.length === 0 ? (
          <p className="lv-note">Rien de visible pour toi en ce moment.</p>
        ) : (
          publications.map((m) => (
            <p key={m.id} className="lv-pub">
              {m.genre === "essai" ? "✨" : m.genre === "decouverte" ? "📍" : NATURES[m.nature].emoji} {m.texte}
            </p>
          ))
        )}
        {parOu ? (
          <button type="button" className="lv-publier" onClick={() => onMaison?.(parOu)}>
            🏠 Voir sa maison
          </button>
        ) : (
          <p className="lv-note petite">Sa maison complète s’ouvrira quand les comptes existeront : dans la maquette, chacun garde la sienne sur son téléphone.</p>
        )}
        <button type="button" className="lv-retour" onClick={onFermer}>
          Fermer
        </button>
      </div>
    </div>
  );
}

function StylesLaVille() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.lv{flex:1;min-height:0;min-width:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;overscroll-behavior:contain;
  padding:0 2px calc(28px + env(safe-area-inset-bottom,0px));color:#FFF4E6;font-family:var(--font-clikme),system-ui,sans-serif;}
.lv::-webkit-scrollbar{display:none;}
.lv-haut{position:sticky;top:0;z-index:30;margin:0 -2px;padding:0 2px 10px;
  background:linear-gradient(180deg,#0A0F0D 0%,rgba(14,13,11,.97) 85%,rgba(14,13,11,.9) 100%);
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid rgba(255,214,170,.08);}
.lv-tete{display:grid;grid-template-columns:76px 1fr 76px;align-items:center;}
.lv-marque{display:flex;flex-direction:column;align-items:center;gap:1px;}
.lv-marque img{height:30px;width:auto;display:block;}
.lv-marque h1{margin:0;font-size:19px;font-weight:800;line-height:1.1;color:#F5A23A;letter-spacing:.01em;}
.lv-outils{display:flex;justify-content:flex-end;gap:4px;}
.lv-outils button{position:relative;width:38px;height:38px;border-radius:50%;border:0;background:none;color:#FFF4E6;cursor:pointer;display:grid;place-items:center;}
.lv-outils button.on{background:rgba(245,162,58,.16);color:#FFC46B;}
.lv-outils svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;}
.lv-outils b{position:absolute;top:2px;right:2px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#FF3E8E;color:#fff;font-size:11px;font-weight:800;
  display:grid;place-items:center;box-shadow:0 0 0 2px #160F0C;}
.lv-filtres{display:flex;gap:6px;margin-top:10px;}
.lv-filtres button{flex:1 1 auto;min-width:0;display:inline-flex;align-items:center;justify-content:center;gap:5px;height:40px;padding:0 8px;border-radius:999px;cursor:pointer;
  font:inherit;font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;color:#EADBC8;background:rgba(255,255,255,.04);border:1px solid rgba(255,214,170,.2);}
.lv-filtres button.on{color:#2A1608;background:linear-gradient(180deg,#F8B451,#E8932A);border-color:transparent;box-shadow:0 6px 18px rgba(232,147,42,.32);}
.lv-filtres svg{width:15px;height:15px;flex:none;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linejoin:round;stroke-linecap:round;}
.lv-filtres button.on svg{fill:currentColor;stroke-width:1.2;}
.lv-cherche{display:flex;gap:8px;margin-top:10px;}
.lv-cherche input{flex:1;min-width:0;height:42px;padding:0 16px;border-radius:999px;border:1px solid rgba(255,214,170,.25);background:#1C1411;color:#FFF4E6;font:inherit;font-size:15px;}
.lv-cherche button{width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,214,170,.2);background:none;color:#FFF4E6;cursor:pointer;}
.lv-suites{display:grid;gap:6px;margin-top:10px;}
.lv-suite{display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;border-radius:16px;cursor:pointer;text-align:left;font:inherit;font-size:14px;color:#EADBC8;
  background:#241A15;border:1px solid rgba(245,162,58,.28);}
.lv-suite span{flex:1;min-width:0;}
.lv-suite b{color:#FFF4E6;}
.lv-suite s{text-decoration:none;color:#F5A23A;font-size:20px;}

.lv-fil{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;padding-top:14px;}
.lv-vide{margin:24px 4px;text-align:center;font-size:15px;color:#CDB9A5;line-height:1.5;}
.lv-carte{position:relative;padding:14px 14px 12px;border-radius:24px;background:linear-gradient(180deg,#221915,#1B1411);border:1px solid rgba(255,214,170,.13);
  box-shadow:0 10px 30px rgba(0,0,0,.28);}
.lv-h{display:flex;align-items:center;gap:11px;margin-bottom:11px;}
.lv-av{position:relative;flex:none;width:52px;height:52px;padding:0;border-radius:50%;border:2.5px solid #F5A23A;background:radial-gradient(circle at 50% 35%,#3a2b23,#1d1511);
  overflow:visible;cursor:pointer;display:block;}
.lv-av img{width:100%;height:100%;object-fit:cover;object-position:50% 12%;border-radius:50%;display:block;}
.lv-av i{position:absolute;right:-4px;bottom:-3px;width:22px;height:22px;border-radius:50%;background:#FF3E8E;color:#fff;font-style:normal;font-size:13px;font-weight:800;
  display:grid;place-items:center;box-shadow:0 0 0 2px #1E1612;}
.lv-av.petit{width:34px;height:34px;border-width:2px;}
.lv-h-t{flex:1;min-width:0;}
.lv-nom{margin:0;font-size:16px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.lv-nom b{font-weight:800;}
.lv-nom em{font-style:normal;font-weight:700;color:#F5A23A;font-size:14px;}
.lv-lieu{margin:3px 0 0;display:flex;align-items:center;gap:5px;font-size:13.5px;color:#CDB9A5;white-space:nowrap;overflow:hidden;}
.lv-lieu span{overflow:hidden;text-overflow:ellipsis;}
.lv-lieu i{font-style:normal;font-size:12px;color:#9C8775;flex:none;margin-left:2px;}
.lv-pin{width:14px;height:14px;flex:none;fill:none;stroke:currentColor;stroke-width:2;}
.lv-quand{flex:none;align-self:flex-start;margin-top:5px;font-size:13px;color:#9C8775;white-space:nowrap;}
.lv-menu{position:relative;align-self:flex-start;}
.lv-points{width:30px;height:30px;margin-right:-6px;border:0;border-radius:50%;background:none;color:#CDB9A5;cursor:pointer;display:grid;place-items:center;}
.lv-points svg{width:20px;height:20px;fill:currentColor;}
.lv-menu-fond{position:fixed;inset:0;z-index:40;border:0;background:transparent;cursor:default;}
.lv-menu-l{position:absolute;right:0;top:34px;z-index:41;min-width:210px;padding:6px;border-radius:16px;background:#2A1F1A;border:1px solid rgba(255,214,170,.2);
  box-shadow:0 14px 36px rgba(0,0,0,.5);display:grid;}
.lv-menu-l button{padding:11px 12px;border:0;border-radius:10px;background:none;color:#FFF4E6;font:inherit;font-size:14.5px;font-weight:600;text-align:left;cursor:pointer;}
.lv-menu-l button:hover{background:rgba(255,255,255,.06);}
.lv-menu-l .lv-signaler{color:#FF9DB0;}
.lv-suitede{margin:0 0 8px;font-size:13px;color:#F5A23A;}
.lv-texte{margin:12px 2px 2px;font-size:18px;font-weight:800;line-height:1.3;color:#FFF4E6;overflow-wrap:anywhere;}
.lv-texte.grand{margin:2px 2px 10px;font-size:19px;}
.lv-sous{margin:4px 2px 0;font-size:15px;color:#CDB9A5;}
.lv-sous b{color:#FFC46B;font-weight:800;}
.lv-vecu{margin:6px 2px 0;font-size:13px;color:#F5A23A;font-weight:700;}
.lv-photo{position:relative;border-radius:18px;overflow:hidden;background:#241A15;}
.lv-photo img{display:block;width:100%;aspect-ratio:16/11;max-height:420px;object-fit:cover;}
.lv-pastille{position:absolute;left:12px;top:12px;display:inline-flex;align-items:center;gap:7px;padding:7px 13px;border-radius:999px;
  background:rgba(20,13,9,.78);color:#FFF4E6;font-size:14px;font-weight:700;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}
.lv-pastille svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;}
.lv-vocal{display:flex;align-items:center;gap:12px;padding:10px 16px 10px 10px;border-radius:999px;background:rgba(255,255,255,.04);border:1px solid rgba(255,214,170,.18);}
.lv-vocal button{flex:none;width:46px;height:46px;border-radius:50%;border:0;background:linear-gradient(180deg,#F8B451,#E8932A);color:#2A1608;cursor:pointer;display:grid;place-items:center;}
.lv-vocal button svg{width:20px;height:20px;fill:currentColor;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;}
.lv-onde{flex:1;min-width:0;height:34px;display:flex;align-items:center;gap:3px;}
.lv-onde i{flex:1;min-width:2px;border-radius:2px;background:rgba(255,244,230,.45);}
.lv-onde i.lu{background:#F5A23A;}
.lv-vocal em{flex:none;font-style:normal;font-size:14px;color:#EADBC8;font-variant-numeric:tabular-nums;}

.lv-pied{display:flex;align-items:center;gap:7px;margin-top:12px;min-width:0;}
.lv-espace{flex:1;}
.lv-pill{flex:none;display:inline-flex;align-items:center;gap:6px;height:42px;padding:0 12px;border-radius:999px;cursor:pointer;font:inherit;font-size:14.5px;font-weight:700;
  color:#EADBC8;background:rgba(255,255,255,.03);border:1px solid rgba(255,214,170,.2);white-space:nowrap;}
.lv-pill svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linejoin:round;}
.lv-pill.coeur svg{stroke:#FF5A7A;}
.lv-pill.coeur.on{color:#FF8FA6;}
.lv-pill.coeur.on svg{fill:#FF4F72;stroke:#FF4F72;}
.lv-pill.on{border-color:rgba(245,162,58,.55);}
.lv-cta{min-width:0;flex:0 1 auto;overflow:hidden;text-overflow:ellipsis;display:inline-flex;align-items:center;gap:6px;height:44px;padding:0 13px;border-radius:999px;border:0;cursor:pointer;font:inherit;font-size:14.5px;font-weight:800;
  color:#2A1608;background:linear-gradient(180deg,#F8B451,#E8932A);box-shadow:0 6px 18px rgba(232,147,42,.3);white-space:nowrap;}
.lv-cta.creux{color:#FFC46B;background:none;border:1.5px solid #F5A23A;box-shadow:none;}
.lv-ic{width:17px;height:17px;flex:none;fill:currentColor;}
.lv-ic.trait{fill:none;stroke:currentColor;stroke-width:2;stroke-linejoin:round;}
.lv-bas{display:flex;gap:10px;justify-content:flex-end;margin:8px 4px 0;font-size:12px;color:#9C8775;}
.lv-ami{color:#F5A23A;font-weight:700;}
.lv-reponses{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,214,170,.12);}
.lv-reponses p{margin:0 0 7px;font-size:14px;color:#EADBC8;line-height:1.4;}
.lv-reponses p b{color:#FFF4E6;margin-right:4px;}
.lv-reponses p u{text-decoration:none;font-size:11px;padding:1px 6px;border-radius:6px;background:rgba(245,162,58,.18);color:#FFC46B;margin-right:4px;}
.lv-reponses form{display:flex;gap:8px;margin-top:6px;}
.lv-reponses input{flex:1;min-width:0;height:42px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,214,170,.22);background:#17100D;color:#FFF4E6;font:inherit;font-size:14px;}
.lv-reponses form button{width:42px;height:42px;border-radius:50%;border:0;background:#F5A23A;color:#2A1608;font-weight:800;cursor:pointer;}
.lv-reponses form button:disabled{opacity:.4;}

.lv-fond{position:fixed;inset:0;z-index:60;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,6,4,.62);}
.lv-feuille{position:relative;width:min(520px,100%);max-height:88vh;overflow-y:auto;padding:10px 16px calc(18px + env(safe-area-inset-bottom,0px));
  border-radius:28px 28px 0 0;background:#1C1411;border:1px solid rgba(255,214,170,.18);color:#FFF4E6;font-family:var(--font-clikme),system-ui,sans-serif;
  animation:lvMonte .25s ease both;}
@keyframes lvMonte{from{transform:translateY(30px);opacity:0;}to{transform:none;opacity:1;}}
.lv-poignee{display:block;width:44px;height:5px;margin:0 auto 10px;border-radius:99px;background:rgba(255,244,230,.25);}
.lv-feuille h2{margin:0 0 12px;font-size:22px;font-weight:800;}
.lv-feuille h3,.lv-page h3{margin:16px 0 8px;font-size:15px;color:#FFF4E6;font-weight:800;}
.lv-x{position:absolute;right:14px;top:14px;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,214,170,.25);background:rgba(255,255,255,.04);
  color:#FFF4E6;font-size:17px;cursor:pointer;}
.lv-bulle-l{display:flex;align-items:center;justify-content:center;gap:6px;margin:4px 0 12px;}
.lv-bulle-l img{height:120px;width:auto;filter:drop-shadow(0 8px 16px rgba(0,0,0,.4));}
.lv-bulle-l p{position:relative;margin:0;padding:14px 18px;border-radius:24px;background:#FBEBD8;color:#2A1608;font-size:19px;font-weight:800;line-height:1.2;max-width:180px;text-align:center;}
.lv-bulle-l p::before{content:"";position:absolute;left:-8px;bottom:16px;border:9px solid transparent;border-right-color:#FBEBD8;border-left:0;}
.lv-choix{display:flex;align-items:center;gap:14px;width:100%;margin-bottom:10px;padding:10px;border-radius:22px;cursor:pointer;text-align:left;color:inherit;font:inherit;
  background:rgba(255,255,255,.03);border:1px solid rgba(255,214,170,.16);}
.lv-choix > img,.lv-choix-msg{flex:none;width:96px;height:80px;border-radius:16px;object-fit:cover;position:relative;overflow:hidden;display:block;}
.lv-choix-msg img{width:100%;height:100%;object-fit:cover;filter:brightness(.8);}
.lv-choix-msg i{position:absolute;left:10px;top:12px;padding:3px 10px;border-radius:14px;background:#FFF4E6;color:#2A1608;font-style:normal;font-weight:900;font-size:15px;letter-spacing:.06em;}
.lv-choix span{flex:1;min-width:0;display:grid;gap:3px;}
.lv-choix b{font-size:17px;font-weight:800;}
.lv-choix em{font-style:normal;font-size:13.5px;color:#CDB9A5;line-height:1.35;}
.lv-choix s{flex:none;width:40px;height:40px;border-radius:50%;background:#F5A23A;color:#2A1608;text-decoration:none;font-size:24px;font-weight:800;display:grid;place-items:center;}
.lv-garde{margin:10px 0 0;text-align:center;font-size:13px;color:#9C8775;}

.lv-page{position:fixed;inset:0;z-index:62;overflow-y:auto;background:#160F0C;color:#FFF4E6;font-family:var(--font-clikme),system-ui,sans-serif;animation:lvMonte .22s ease both;}
.lv-page-h{position:sticky;top:0;z-index:2;display:grid;grid-template-columns:44px 1fr 44px;align-items:center;padding:calc(10px + env(safe-area-inset-top,0px)) 12px 8px;
  background:linear-gradient(180deg,#160F0C 75%,rgba(22,15,12,0));}
.lv-page-h > button{width:44px;height:44px;border:0;background:none;color:#FFF4E6;font-size:26px;cursor:pointer;}
.lv-page-h div{text-align:center;}
.lv-page-h h2{margin:0;font-size:22px;font-weight:800;}
.lv-page-h small{display:block;color:#F5A23A;font-weight:800;font-size:14px;}
.lv-page-c{max-width:520px;margin:0 auto;padding:0 16px calc(120px + env(safe-area-inset-bottom,0px));}
.lv-picks{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 8px;scrollbar-width:none;}
.lv-pick{flex:none;position:relative;width:104px;height:116px;padding:0;border-radius:16px;cursor:pointer;overflow:hidden;border:2.5px solid transparent;background:#2A1F1B;}
.lv-pick img{width:100%;height:100%;object-fit:cover;display:block;}
.lv-pick.on{border-color:#F5A23A;box-shadow:0 0 0 3px rgba(245,162,58,.25);}
.lv-pick.avec-mot span{position:absolute;left:0;right:0;bottom:0;padding:16px 7px 6px;font-size:11.5px;font-weight:700;color:#FFF4E6;text-align:left;line-height:1.2;
  background:linear-gradient(transparent,rgba(0,0,0,.85));}
.lv-pick.ajout{display:grid;place-items:center;border:2px dashed rgba(255,214,170,.35);}
.lv-pick.ajout i{font-style:normal;font-size:28px;margin-bottom:16px;}
.lv-pick input,.lv-ajouts input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;}
.lv-ligne{display:flex;align-items:center;gap:12px;margin:8px 0 4px;padding:9px 12px 9px 9px;border-radius:18px;background:rgba(255,255,255,.03);border:1px solid rgba(255,214,170,.16);}
.lv-ligne img,.lv-ligne-ic{flex:none;width:46px;height:46px;border-radius:50%;object-fit:cover;display:grid;place-items:center;background:#2A1F1B;}
.lv-ligne span{flex:1;min-width:0;font-size:14.5px;color:#EADBC8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.lv-ligne b{color:#FFF4E6;font-size:16px;}
.lv-ligne button{flex:none;border:0;background:none;color:#F5A23A;font:inherit;font-weight:800;font-size:14.5px;cursor:pointer;}
.lv-commerces{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none;}
.lv-commerces button{flex:none;display:flex;align-items:center;gap:8px;max-width:210px;padding:5px 14px 5px 5px;border-radius:999px;cursor:pointer;font:inherit;font-size:13.5px;
  color:#EADBC8;background:rgba(255,255,255,.03);border:1px solid rgba(255,214,170,.2);}
.lv-commerces button.on{border-color:#F5A23A;background:rgba(245,162,58,.14);color:#FFF4E6;}
.lv-commerces img,.lv-commerces span{width:32px;height:32px;border-radius:50%;object-fit:cover;flex:none;display:grid;place-items:center;}
.lv-commerces b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;}
.lv-apercu{margin-top:14px;padding:12px;border-radius:22px;background:rgba(255,255,255,.025);border:1px solid rgba(255,214,170,.14);}
.lv-apercu h3{margin:0 0 8px;}
.lv-apercu-msg .lv-texte.grand{margin-top:0;}
.lv-note-ic{display:flex;align-items:center;gap:7px;margin:10px 2px 0;font-size:13.5px;color:#CDB9A5;}
.lv-note-ic .lv-pin{color:#F5A23A;}
.lv-legende-h{display:flex;align-items:baseline;justify-content:space-between;}
.lv-legende-h small,.lv-compte{color:#9C8775;font-size:12.5px;}
.lv-compte{display:block;text-align:right;margin-top:4px;}
.lv-zone{width:100%;padding:13px 16px;border-radius:18px;border:1px solid rgba(255,214,170,.22);background:#1C1411;color:#FFF4E6;font:inherit;font-size:16px;resize:none;}
.lv-zone.une{margin-top:8px;border-radius:999px;}
.lv-ajouts{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;}
.lv-ajouts label,.lv-ajouts button{position:relative;display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 14px;border-radius:999px;cursor:pointer;font:inherit;
  font-size:14px;font-weight:700;color:#EADBC8;background:rgba(255,255,255,.03);border:1px solid rgba(255,214,170,.22);}
.lv-ajouts .on{border-color:#F5A23A;color:#FFC46B;}
.lv-ajouts .rouge{border-color:#FF5A7A;color:#FF9DB0;}
.lv-lien{margin-top:8px;border:0;background:none;color:#F5A23A;font:inherit;font-size:13.5px;font-weight:700;cursor:pointer;padding:0;}
.lv-audience{display:flex;align-items:center;gap:10px;margin-top:16px;flex-wrap:wrap;}
.lv-audience > span{font-weight:800;font-size:15px;}
.lv-audience div{display:flex;gap:6px;}
.lv-audience button{height:40px;padding:0 14px;border-radius:999px;cursor:pointer;font:inherit;font-size:14px;font-weight:700;color:#EADBC8;
  background:rgba(255,255,255,.03);border:1px solid rgba(255,214,170,.22);}
.lv-audience button.on{color:#2A1608;background:linear-gradient(180deg,#F8B451,#E8932A);border-color:transparent;}
.lv-aucun{display:grid;justify-items:center;gap:8px;text-align:center;margin-top:20px;}
.lv-aucun img{height:130px;width:auto;}
.lv-aucun p{margin:0;color:#CDB9A5;line-height:1.45;font-size:15px;}
.lv-coche{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:14px;color:#EADBC8;}
.lv-qui{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px;}
.lv-qui button{min-height:48px;padding:6px 10px;border-radius:16px;cursor:pointer;font:inherit;font-size:14px;font-weight:700;color:#FFF4E6;background:#211813;border:1px solid rgba(255,214,170,.22);}
.lv-qui button.on{color:#2A1608;background:linear-gradient(180deg,#F8B451,#E8932A);border-color:transparent;}
.lv-salons{display:grid;gap:8px;}
.lv-salons button{display:flex;align-items:center;gap:10px;padding:8px 12px 8px 8px;border-radius:16px;cursor:pointer;font:inherit;text-align:left;color:#FFF4E6;
  background:rgba(255,255,255,.03);border:1px solid rgba(255,214,170,.16);}
.lv-salons img,.lv-salons span{width:40px;height:40px;border-radius:12px;object-fit:cover;flex:none;display:grid;place-items:center;background:#2A1F1B;}
.lv-salons b{flex:1;min-width:0;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.lv-salons em{font-style:normal;font-size:12px;color:#CDB9A5;flex:none;}
.lv-attention{margin:10px 0 0;padding:10px 12px;border-radius:12px;font-size:13.5px;color:#FFD9EC;background:rgba(255,46,154,.12);border:1px solid rgba(255,46,154,.35);line-height:1.4;}
.lv-publier{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;height:56px;margin-top:16px;border:0;border-radius:999px;cursor:pointer;
  font:inherit;font-size:18px;font-weight:800;color:#2A1608;background:linear-gradient(180deg,#F8B451,#E8932A);box-shadow:0 10px 26px rgba(232,147,42,.3);}
.lv-publier .lv-ic{width:22px;height:22px;}
.lv-publier:disabled{opacity:.4;box-shadow:none;}
.lv-retour{display:block;width:100%;margin-top:8px;padding:12px;border-radius:999px;border:1px solid rgba(255,244,230,.3);background:none;color:#FFF4E6;font:inherit;font-weight:700;cursor:pointer;}
.lv-note{margin:0 0 10px;font-size:14px;color:#CDB9A5;line-height:1.4;}
.lv-note.petite{margin-top:14px;font-size:12px;color:#9C8775;}
.lv-chez{display:flex;align-items:center;gap:14px;margin-bottom:6px;}
.lv-chez h2{margin:0;}
.lv-adresses{display:flex;flex-wrap:wrap;gap:8px;}
.lv-adresses button{padding:8px 12px;border-radius:999px;border:1px solid rgba(245,162,58,.5);background:none;color:#FFC46B;font:inherit;font-size:13px;font-weight:700;cursor:pointer;}
.lv-pub{margin:0 0 8px;padding:10px 12px;border-radius:12px;background:#241A15;font-size:14px;}
@media (max-width:370px){.lv-filtres button{font-size:12.5px;padding:0 6px;gap:3px;}.lv-filtres svg{display:none;}.lv-pill{padding:0 11px;}.lv-cta{padding:0 13px;font-size:14px;}}
`,
      }}
    />
  );
}
