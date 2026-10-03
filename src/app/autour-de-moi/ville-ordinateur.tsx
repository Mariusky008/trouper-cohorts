"use client";

// 🖥️ LA VILLE SUR UN ORDINATEUR — un carrousel qui prend toute la page.
//
// « Le passage de l'écran des copains à l'application est très brutal dès
// qu'on clique sur l'un des commerçants ou sur toute la ville. Pour le format
// ordinateur, est-ce qu'on ne pourrait pas avoir quelque chose qui occupe
// davantage la page, dans l'esprit de la photo 3 ? En mode téléphone, on
// reste sur ce qu'on a. »
//
// L'APPLICATION EST DESSINÉE POUR UN POUCE. Sur un ordinateur, on la posait
// dans un téléphone au milieu d'un écran noir : on passait d'une page large
// (les copains) à une vignette de 390 points, et c'est ce saut qui était
// brutal. Ici, il n'y a plus de saut : LES COPAINS ET LA VILLE SONT LE MÊME
// ÉCRAN. Le carrousel s'ouvre sur les deux copains, et « Toute la ville »
// le fait simplement glisser plus loin.
//
// LA MAQUETTE, ÉLÉMENT PAR ÉLÉMENT :
//   · en haut, le retour chez le commerce d'où l'on vient, le mot ClikMe et sa
//     devise, et « Mes envies » (les cœurs qu'on a posés) ;
//   · au milieu, une carte en grand — sa photo, son nom, son offre, son prix,
//     son fantôme, un grand bouton rose — et ses voisines, estompées, de
//     part et d'autre ; des flèches, des points, « Copain 1/2 » ;
//   · sur la carte, quatre gestes : RDV, J'aime, Partager, En parler ;
//   · en bas à gauche, le fantôme du commerce qui présente ses copains ;
//   · en bas, les catégories et la recherche.
//
// LE GRAND BOUTON N'EMMÈNE NULLE PART : il ouvre l'atelier en plein écran,
// par-dessus le carrousel (`AtelierPleinEcran`), et « Retour » y ramène.
// RDV et En parler mènent chez le commerce, sur sa page.
//
// RIEN N'Y EST INVENTÉ EN SILENCE : ces commerces sont ceux de la
// démonstration, et chaque carte porte « Démonstration ».
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { MotMarque } from "@/components/direct/mot-marque";
import { AtelierPleinEcran, type RenduEssai } from "@/components/direct/atelier-plein-ecran";
import {
  HEURE_MAX,
  HEURE_MIN,
  momentEnCours,
  toutesLesCartes,
  type CarteAutour,
  type CleMetier,
} from "@/lib/direct/apercu-habitant";
import { partager } from "@/lib/direct/partager";
import { tenueDu } from "@/lib/direct/double-metiers";
import { cleSalonBoutique, ecrireDansSalon, heureCourte, monPrenom, ouvrirSalon } from "@/lib/direct/salons";

export type VilleOrdinateurProps = {
  /** Le commerce d'où l'on vient (« Explorer ma ville »), s'il y en a un. */
  moi?: { id: string; nom: string; ville: string; fantome: string };
  /** Ses deux copains, dans l'ordre où il les présente. */
  copains: string[];
  /** Où revenir : sa page. */
  retour?: string;
};

// ═══ LES MOTS DE CHAQUE MÉTIER, SUR LA CARTE DU MILIEU ═════════════════════
// « Ces couleurs, sur tes ongles ? » — la question que la carte pose, puis le
// bouton qui y répond.
const MOTS: Record<CleMetier, { question: string; bouton: string; fantome: string; rdv: string }> = {
  ongles: { question: "Ces couleurs, sur tes ongles ?", bouton: "Essayer sur mes ongles", fantome: "hote-onglerie", rdv: "RDV" },
  coiffeur: { question: "Cette coupe, sur toi ?", bouton: "Essayer cette coupe", fantome: "hote-coiffeur", rdv: "RDV" },
  mode: { question: "Cette pièce, sur toi ?", bouton: "Essayer cette tenue", fantome: "hote-mode", rdv: "RDV" },
  lunetier: { question: "Ces lunettes, sur ton nez ?", bouton: "Essayer ces lunettes", fantome: "hote-opticien", rdv: "RDV" },
  restaurant: { question: "Ça te tente, aujourd'hui ?", bouton: "Voir ce qu'on mange", fantome: "hote-serveur", rdv: "Réserver" },
  bar: { question: "On y passe ce soir ?", bouton: "Voir la soirée", fantome: "hote-barman", rdv: "Réserver" },
  fleuriste: { question: "Ce bouquet, chez toi ?", bouton: "Voir les bouquets", fantome: "hote-fleuriste", rdv: "RDV" },
  artisan: { question: "Cette pièce, chez toi ?", bouton: "Découvrir l'atelier", fantome: "hote-artisan", rdv: "RDV" },
  librairie: { question: "Ton prochain livre ?", bouton: "Trouver mon prochain livre", fantome: "hote-libraire", rdv: "Réserver" },
};
const motsDe = (b: string) => MOTS[b as CleMetier] ?? MOTS.artisan;

// ═══ LES CATÉGORIES DU BAS ═══════════════════════════════════════════════
type Categorie = "tout" | "table" | "mode" | "beaute" | "sorties" | "createurs" | "envies";
const CATEGORIES: { cle: Exclude<Categorie, "envies">; nom: string; branches: string[] }[] = [
  { cle: "tout", nom: "Tout", branches: [] },
  { cle: "table", nom: "À table", branches: ["restaurant"] },
  { cle: "mode", nom: "Mode", branches: ["mode", "lunetier"] },
  { cle: "beaute", nom: "Coiffure & ongles", branches: ["coiffeur", "ongles"] },
  { cle: "sorties", nom: "Sorties", branches: ["bar"] },
  { cle: "createurs", nom: "Créateurs", branches: ["fleuriste", "artisan"] },
];

const sansAccent = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** « Les copains de Chez Bergine », « du Bocal », « de L'Atelier ». */
function lesCopainsDe(nom: string): string {
  if (/^(Un|Une)\s/.test(nom)) return "Les copains du quartier";
  if (/^Le\s/.test(nom)) return `Les copains du ${nom.slice(3)}`;
  if (/^Les\s/.test(nom)) return `Les copains des ${nom.slice(4)}`;
  return `Les copains de ${nom}`;
}

// ═══ MES ENVIES — les cœurs, gardés dans ce navigateur ═══════════════════
const CLE_ENVIES = "clikme-envies-v1";
const ecouteurs = new Set<() => void>();
function lireEnvies(): string {
  try {
    return localStorage.getItem(CLE_ENVIES) || "[]";
  } catch {
    return "[]";
  }
}
function basculerEnvie(id: string) {
  let liste: string[] = [];
  try {
    liste = JSON.parse(lireEnvies());
  } catch {
    liste = [];
  }
  const suite = liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id];
  try {
    localStorage.setItem(CLE_ENVIES, JSON.stringify(suite));
  } catch {
    /* navigation privée : le cœur vit le temps de la page */
  }
  ecouteurs.forEach((f) => f());
}
function abonnerEnvies(f: () => void) {
  ecouteurs.add(f);
  return () => {
    ecouteurs.delete(f);
  };
}

/** Une carte du carrousel : le commerce, et ce que sa carte montre maintenant. */
type Fiche = {
  c: CarteAutour;
  photo: string;
  offre?: string;
  detail?: string;
  prix?: string;
  copain: boolean;
};

export function VilleOrdinateur({ moi, copains, retour }: VilleOrdinateurProps) {
  /* L'HEURE APRÈS LE PREMIER RENDU, comme partout : le serveur ne connaît
     pas l'heure du visiteur. */
  const [heure, setHeure] = useState(12);
  useEffect(() => {
    const d = new Date();
    const h = d.getHours() + d.getMinutes() / 60;
    setHeure(h >= HEURE_MIN && h <= HEURE_MAX ? h : 12);
  }, []);

  const cartes = useMemo(() => toutesLesCartes().filter((c) => !c.prepare && c.id !== moi?.id), [moi?.id]);
  const fiches = useMemo<Fiche[]>(() => {
    const fiche = (c: CarteAutour, copain: boolean): Fiche => {
      const m = momentEnCours(c, heure) ?? c.moments.find((x) => x.titre) ?? null;
      return {
        c,
        photo: m?.photo || c.photoAccueil || c.photo || c.sesPhotos?.[0]?.src || "",
        offre: m?.titre,
        detail: m?.lignes?.[0],
        prix: m?.prix,
        copain,
      };
    };
    const siens = copains.flatMap((id) => {
      const c = cartes.find((x) => x.id === id);
      return c ? [fiche(c, true)] : [];
    });
    // LA VILLE ENSUITE : ceux qui ont quelque chose aujourd'hui d'abord, puis
    // du plus près au plus loin.
    const metres = (d?: string) => {
      const n = parseFloat(String(d || "").replace(",", "."));
      return /km/.test(String(d)) ? n * 1000 : Number.isFinite(n) ? n : 9999;
    };
    const ville = cartes
      .filter((c) => !copains.includes(c.id))
      .map((c) => fiche(c, false))
      .sort((a, b) => Number(Boolean(b.offre)) - Number(Boolean(a.offre)) || metres(a.c.distance) - metres(b.c.distance));
    return [...siens, ...ville];
  }, [cartes, copains, heure]);
  const nbCopains = fiches.filter((f) => f.copain).length;

  const enviesBrut = useSyncExternalStore(abonnerEnvies, lireEnvies, () => "[]");
  const envies = useMemo<string[]>(() => {
    try {
      return JSON.parse(enviesBrut);
    } catch {
      return [];
    }
  }, [enviesBrut]);

  // ═══ CE QU'ON REGARDE ═══
  const [categorie, setCategorie] = useState<Categorie>("tout");
  const [cherche, setCherche] = useState("");
  const liste = useMemo(() => {
    const q = sansAccent(cherche.trim());
    const cat = CATEGORIES.find((x) => x.cle === categorie);
    return fiches.filter((f) => {
      if (categorie === "envies" && !envies.includes(f.c.id)) return false;
      if (cat && cat.branches.length && !cat.branches.includes(f.c.branche)) return false;
      if (q && !sansAccent(`${f.c.nom} ${f.c.metier} ${f.offre ?? ""}`).includes(q)) return false;
      return true;
    });
  }, [fiches, categorie, cherche, envies]);
  const filtre = categorie !== "tout" || cherche.trim() !== "";
  const [index, setIndex] = useState(0);
  // UN NOUVEAU FILTRE REPART DU DÉBUT — et le carrousel « respire » pour le dire.
  const [vague, setVague] = useState(0);
  useEffect(() => {
    setIndex(0);
    setVague((v) => v + 1);
  }, [categorie, cherche]);
  const i = Math.min(index, Math.max(0, liste.length - 1));
  const ici = liste[i];
  const aller = useCallback((n: number) => setIndex(Math.max(0, Math.min(liste.length - 1, n))), [liste.length]);
  const suivant = useCallback(() => setIndex((x) => Math.min(liste.length - 1, x + 1)), [liste.length]);
  const precedent = useCallback(() => setIndex((x) => Math.max(0, x - 1)), []);

  // ═══ L'ATELIER, ET CE QUI MÈNE CHEZ LE COMMERCE ═══
  const [atelier, setAtelier] = useState<CarteAutour | null>(null);
  const fermer = useCallback(() => setAtelier(null), []);
  const pageDe = (c: CarteAutour, salon = false) => `/autour-de-moi/boutique?c=${encodeURIComponent(c.id)}${salon ? "&salon=1" : ""}`;
  const [dit, setDit] = useState("");
  useEffect(() => {
    if (!dit) return;
    const t = window.setTimeout(() => setDit(""), 2600);
    return () => window.clearTimeout(t);
  }, [dit]);
  const ouvrirLeSalon = (f: Fiche) =>
    ouvrirSalon({
      cle: cleSalonBoutique(f.c.id),
      sujet: `Chez ${f.c.nom}`,
      ou: f.c.nom,
      parQui: monPrenom() || "Vous",
      quand: "Aujourd’hui",
      annonce: f.offre || f.c.metier,
      prix: f.prix,
      distance: f.c.distance,
      photo: f.photo,
      boutique: { id: f.c.id, nom: f.c.nom, lien: `${window.location.origin}${pageDe(f.c)}` },
    });
  const enParler = (f: Fiche) => {
    ouvrirLeSalon(f);
    window.location.assign(pageDe(f.c, true));
  };
  const partagerLe = async (f: Fiche) => {
    const r = await partager({
      titre: f.c.nom,
      texte: f.offre ? `${f.offre} — chez ${f.c.nom}` : `Regarde : ${f.c.nom}`,
      lien: `${window.location.origin}${pageDe(f.c)}`,
    });
    if (r === "copie") setDit("Lien copié : collez-le à qui vous voulez.");
    else if (r === "echec") setDit("Le partage n’a pas abouti.");
  };
  const montrerAuxAmis = (f: Fiche, o: RenduEssai) => {
    ouvrirLeSalon(f);
    const qui = monPrenom() || "Vous";
    ecrireDansSalon(cleSalonBoutique(f.c.id), {
      qui,
      voix: "moi",
      texte: o.note
        ? `J’ai essayé « ${o.quoi} »${o.prix ? ` (${o.prix})` : ""} sur moi. Je mets ${o.note}/5 — vous en pensez quoi ?`
        : `J’ai essayé « ${o.quoi} »${o.prix ? ` (${o.prix})` : ""} sur moi. Ça me va ou pas ?`,
      quand: heureCourte(),
      photo: o.image,
    });
    window.location.assign(pageDe(f.c, true));
  };

  // ═══ LE CLAVIER, LA MOLETTE, LE DOIGT ═══
  useEffect(() => {
    if (atelier) return;
    const touche = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowRight") suivant();
      if (e.key === "ArrowLeft") precedent();
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [atelier, suivant, precedent]);
  const derniereMolette = useRef(0);
  const molette = (e: React.WheelEvent) => {
    // UN PAVÉ TACTILE GLISSE DE CÔTÉ : une carte par geste, pas dix.
    if (Math.abs(e.deltaX) < 24 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    const t = Date.now();
    if (t - derniereMolette.current < 550) return;
    derniereMolette.current = t;
    if (e.deltaX > 0) suivant();
    else precedent();
  };
  const appui = useRef<number | null>(null);

  const dansLesCopains = !filtre && i < nbCopains;
  const titre = filtre
    ? categorie === "envies"
      ? "Mes envies"
      : cherche.trim()
        ? `« ${cherche.trim()} »`
        : `${CATEGORIES.find((x) => x.cle === categorie)?.nom ?? ""} · ${moi?.ville && nbCopains ? moi.ville : "Dax"}`
    : dansLesCopains && moi
      ? lesCopainsDe(moi.nom)
      : moi && !nbCopains
        ? "En attendant, l’exemple de Dax"
        : "Toute la ville, en ce moment";
  const bulle = dansLesCopains
    ? "Je te présente mes deux copains !"
    : moi && !nbCopains
      ? "Mes voisins arrivent bientôt ! Voici Dax."
      : moi
        ? "Et toute la ville, à deux pas !"
        : "Qu’est-ce qui te tente aujourd’hui ?";
  const compte = dansLesCopains ? `Copain ${i + 1}/${nbCopains}` : liste.length ? `${i + 1} sur ${liste.length}` : "";

  return (
    <div className="vo">
      <StylesVille />
      <div className="vo-aurore" aria-hidden="true">
        <i />
        <i />
      </div>

      {/* ═══ EN HAUT ═══ */}
      <header className="vo-haut">
        {retour && moi ? (
          <Link className="vo-pilule" href={retour}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 12H5.5M11 5.5 4.5 12l6.5 6.5" />
            </svg>
            <span>{moi.nom}</span>
          </Link>
        ) : (
          <span />
        )}
        <div className="vo-marque">
          <MotMarque className="vo-mot" encre="#FFF4E6" />
          <p>Les bonnes adresses près de toi</p>
        </div>
        <button
          type="button"
          className={`vo-pilule vo-envies${categorie === "envies" ? " on" : ""}`}
          onClick={() => setCategorie((x) => (x === "envies" ? "tout" : "envies"))}
          aria-pressed={categorie === "envies"}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.4 3.8 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.2 0 5.4 2.9 4.2 6.2C19.5 15.4 12 20 12 20Z" />
          </svg>
          <span>Mes envies</span>
          {envies.length > 0 && <b>{envies.length}</b>}
        </button>
      </header>

      {/* ═══ LE TITRE, ET LE PASSAGE À TOUTE LA VILLE ═══ */}
      <div className="vo-titre" key={titre}>
        <h1>{titre}</h1>
        {!filtre && nbCopains > 0 && (
          <button type="button" className="vo-lien" onClick={() => aller(dansLesCopains ? nbCopains : 0)}>
            {dansLesCopains ? (
              <>
                Toute la ville <s aria-hidden="true">→</s>
              </>
            ) : (
              <>
                <s aria-hidden="true">←</s> Ses copains
              </>
            )}
          </button>
        )}
      </div>

      {/* ═══ LE CARROUSEL ═══ */}
      <div
        className="vo-scene"
        onWheel={molette}
        onPointerDown={(e) => {
          appui.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (appui.current == null) return;
          const dx = e.clientX - appui.current;
          appui.current = null;
          if (dx < -60) suivant();
          if (dx > 60) precedent();
        }}
      >
        {liste.length === 0 ? (
          <div className="vo-rien">
            <b>{categorie === "envies" ? "Aucune envie pour l’instant." : "Rien de ce côté-là."}</b>
            <p>
              {categorie === "envies"
                ? "Touchez le cœur d’une carte : elle vous attendra ici."
                : "Essayez une autre catégorie, ou un autre mot."}
            </p>
            <button type="button" onClick={() => (setCategorie("tout"), setCherche(""))}>
              Revoir toute la ville
            </button>
          </div>
        ) : (
          <div className="vo-piste" key={vague}>
            {liste.map((f, k) => {
              const o = k - i;
              if (Math.abs(o) > 2) return null;
              const mots = motsDe(f.c.branche);
              const aime = envies.includes(f.c.id);
              const centre = o === 0;
              return (
                <article
                  key={f.c.id}
                  className={`vo-carte${centre ? " centre" : " cote"}`}
                  style={{
                    transform: `translateX(${o * 64}%) scale(${centre ? 1 : Math.abs(o) === 1 ? 0.76 : 0.6}) rotateY(${-o * 7}deg)`,
                    zIndex: 10 - Math.abs(o),
                    opacity: Math.abs(o) === 2 ? 0 : 1,
                    ["--k" as string]: Math.abs(o),
                  }}
                  aria-hidden={!centre}
                  onClick={centre ? undefined : () => aller(k)}
                >
                  <div className="vo-photo" style={f.photo ? { backgroundImage: `url("${f.photo}")` } : undefined} />
                  <div className="vo-voile" />
                  <header className="vo-c-haut">
                    <span
                      className="vo-avatar"
                      style={{ backgroundImage: `url("${f.c.photoAccueil || f.c.photo || f.photo}")` }}
                    />
                    <span className="vo-nom">
                      <b>{f.c.nom}</b>
                      <i>
                        {f.c.metier} · {f.c.distance}
                      </i>
                    </span>
                    {centre && <em className="vo-demo">Démonstration</em>}
                  </header>

                  <div className="vo-c-bas">
                    {centre && <h2>{mots.question}</h2>}
                    {f.offre && (
                      <p className="vo-offre">
                        {f.offre}
                        {centre && f.detail ? <span> · {f.detail}</span> : null}
                      </p>
                    )}
                    {f.prix && <p className="vo-prix">{f.prix}</p>}
                    {centre && (
                      <button
                        type="button"
                        className="vo-go"
                        onClick={() =>
                          // LE LIBRAIRE N'A PAS D'ATELIER D'ESSAI : son conseil vit sur sa page.
                          f.c.branche === "librairie" ? window.location.assign(pageDe(f.c)) : setAtelier(f.c)
                        }
                      >
                        <span>{mots.bouton}</span>
                        <s aria-hidden="true">→</s>
                      </button>
                    )}
                  </div>

                  {/* LES GESTES EN HAUT, SON FANTÔME EN BAS, DANS UNE MÊME
                      COLONNE : posés chacun à sa hauteur, le fantôme tombait
                      sur « Partager » dès que l'écran était moins haut. */}
                  {centre && (
                    <div className="vo-droite">
                      <nav className="vo-gestes" aria-label={`Chez ${f.c.nom}`}>
                        <a href={pageDe(f.c)} title={mots.rdv}>
                          <span>
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <rect x="3.5" y="5" width="17" height="15" rx="3" />
                              <path d="M3.5 10h17M8 3v4M16 3v4" />
                            </svg>
                          </span>
                          {mots.rdv}
                        </a>
                        <button
                          type="button"
                          className={aime ? "aime" : ""}
                          onClick={() => basculerEnvie(f.c.id)}
                          aria-pressed={aime}
                          title="J’aime"
                        >
                          <span>
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.4 3.8 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.2 0 5.4 2.9 4.2 6.2C19.5 15.4 12 20 12 20Z" />
                            </svg>
                          </span>
                          J’aime
                        </button>
                        <button type="button" onClick={() => partagerLe(f)} title="Partager">
                          <span>
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M12 15V3.5M7.5 8 12 3.5 16.5 8M5 12.5v6A2 2 0 0 0 7 20.5h10a2 2 0 0 0 2-2v-6" />
                            </svg>
                          </span>
                          Partager
                        </button>
                        <button type="button" onClick={() => enParler(f)} title="En parler avec mes amis">
                          <span>
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.5A7.5 7.5 0 1 1 20 11.5Z" />
                              <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
                            </svg>
                          </span>
                          En parler
                        </button>
                      </nav>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="vo-son-fantome"
                        src={
                          // SA POSE EN PIED : le même personnage que sur sa page.
                          tenueDu(f.c)?.enPied ? `${tenueDu(f.c)!.enPied}repos.webp` : `/direct/fantomes/${mots.fantome}.png`
                        }
                        alt=""
                        onError={(e) => {
                          // UN FANTÔME PAS ENCORE DESSINÉ (le libraire) : celui de ClikMe.
                          const i = e.currentTarget;
                          if (!i.src.endsWith("/clikme-fantome.png")) i.src = "/clikme-fantome.png";
                        }}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {liste.length > 1 && (
          <>
            <button type="button" className="vo-fleche gauche" onClick={precedent} disabled={i === 0} aria-label="Précédent">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 5 8 12l7 7" />
              </svg>
            </button>
            <button
              type="button"
              className="vo-fleche droite"
              onClick={suivant}
              disabled={i >= liste.length - 1}
              aria-label="Suivant"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 5 7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* ═══ OÙ L'ON EN EST ═══ */}
      <div className="vo-ou">
        <div className="vo-points" aria-hidden="true">
          {(dansLesCopains ? fiches.slice(0, nbCopains) : liste.slice(Math.max(0, i - 4), Math.max(0, i - 4) + 9)).map((f) => (
            <i key={f.c.id} className={f.c.id === ici?.c.id ? "on" : ""} />
          ))}
        </div>
        <p>{compte}</p>
      </div>

      {/* ═══ LE FANTÔME QUI PRÉSENTE ═══ */}
      <div className="vo-hote" aria-hidden="true">
        <p className="vo-bulle" key={bulle}>
          {bulle}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={moi?.fantome || "/clikme-fantome.png"} alt="" />
      </div>

      {/* ═══ LES CATÉGORIES ET LA RECHERCHE ═══ */}
      <nav className="vo-bas" aria-label="Catégories">
        <div className="vo-cats">
          {CATEGORIES.map((x) => (
            <button
              key={x.cle}
              type="button"
              className={categorie === x.cle ? "on" : ""}
              onClick={() => setCategorie(x.cle)}
              aria-pressed={categorie === x.cle}
            >
              <IconeCategorie cle={x.cle} />
              {x.nom}
            </button>
          ))}
        </div>
        <label className="vo-cherche">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            type="search"
            value={cherche}
            onChange={(e) => setCherche(e.target.value)}
            placeholder="Rechercher une adresse…"
            aria-label="Rechercher une adresse"
          />
        </label>
      </nav>

      {dit && (
        <p className="vo-dit" role="status">
          {dit}
        </p>
      )}

      {atelier && (
        <AtelierPleinEcran
          c={atelier}
          onFermer={fermer}
          onReserver={() => window.location.assign(pageDe(atelier))}
          onSalon={(o) => {
            const f = fiches.find((x) => x.c.id === atelier.id);
            if (f) montrerAuxAmis(f, o);
          }}
        />
      )}
    </div>
  );
}

function IconeCategorie({ cle }: { cle: string }) {
  const d: Record<string, React.ReactNode> = {
    tout: (
      <>
        <rect x="4" y="4" width="7" height="7" rx="2" />
        <rect x="13" y="4" width="7" height="7" rx="2" />
        <rect x="4" y="13" width="7" height="7" rx="2" />
        <rect x="13" y="13" width="7" height="7" rx="2" />
      </>
    ),
    table: <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2 1.5-3 4-3 7v2h3" />,
    mode: <path d="M6 8h12l1 12.5H5L6 8ZM9 8V6.5a3 3 0 0 1 6 0V8" />,
    beaute: (
      <>
        <circle cx="6.5" cy="17.5" r="2.5" />
        <circle cx="17.5" cy="17.5" r="2.5" />
        <path d="M8.3 15.8 19 4M15.7 15.8 5 4" />
      </>
    ),
    sorties: <path d="M5 4h14l-7 8-7-8ZM12 12v8M8 20.5h8" />,
    createurs: (
      <path d="M12 21c-4.5-2.5-7-5.6-7-9.5C5 8 7.5 5.5 12 3c4.5 2.5 7 5 7 8.5 0 3.9-2.5 7-7 9.5ZM12 21V9" />
    ),
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{d[cle]}</svg>;
}

/* LA FEUILLE DE LA VILLE. La charte des pages : nuit brune (#120C09),
   crème (#FFF4E6), ambre (#F5A23A) pour ce qui s'allume, rose (#FF2E9A) pour
   ce qu'on touche. */
function StylesVille() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        html,body{background:#120C09;}
        .vo{position:fixed;inset:0;overflow:hidden;display:flex;flex-direction:column;
          background:radial-gradient(80% 60% at 50% 38%,#2A1A12 0%,#120C09 62%,#0B0705 100%);
          color:#FFF4E6;font-family:var(--font-geist-sans),system-ui,sans-serif;
          --vo-w:min(700px,48vw);}
        .vo *{box-sizing:border-box;}
        .vo button{font:inherit;color:inherit;}
        .vo-aurore{position:absolute;inset:0;pointer-events:none;z-index:0;}
        .vo-aurore i{position:absolute;width:46vw;aspect-ratio:1;border-radius:50%;filter:blur(90px);opacity:.42;}
        .vo-aurore i:first-child{left:-8vw;top:8vh;background:radial-gradient(circle,rgba(245,162,58,.6),transparent 65%);
          animation:voDerive 18s ease-in-out infinite alternate;}
        .vo-aurore i:last-child{right:-10vw;bottom:-6vh;background:radial-gradient(circle,rgba(255,46,154,.45),transparent 65%);
          animation:voDerive 22s ease-in-out -8s infinite alternate-reverse;}
        @keyframes voDerive{from{transform:translate(0,0) scale(1);}to{transform:translate(6vw,5vh) scale(1.15);}}
        .vo>*{position:relative;z-index:1;}

        /* EN HAUT */
        .vo-haut{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px;
          padding:18px 36px 0;animation:voDescend .7s cubic-bezier(.16,1,.3,1) both;}
        .vo-pilule{justify-self:start;display:inline-flex;align-items:center;gap:10px;max-width:100%;
          padding:12px 20px;border-radius:999px;cursor:pointer;text-decoration:none;color:#FFF4E6;
          font-size:16px;font-weight:600;background:rgba(28,20,17,.75);border:1px solid rgba(255,196,140,.28);
          transition:background .2s ease,border-color .2s ease,transform .2s ease;}
        .vo-pilule:hover{background:rgba(255,244,230,.08);border-color:rgba(255,196,140,.45);transform:translateY(-1px);}
        .vo-pilule span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:26vw;}
        .vo-pilule svg{flex:none;width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.9;
          stroke-linecap:round;stroke-linejoin:round;}
        .vo-envies{justify-self:end;}
        .vo-envies svg{stroke:#FF2E9A;}
        .vo-envies.on{background:rgba(255,46,154,.16);border-color:rgba(255,46,154,.6);}
        .vo-envies.on svg{fill:#FF2E9A;}
        .vo-envies b{display:grid;place-items:center;min-width:22px;height:22px;padding:0 6px;border-radius:999px;
          font-size:12.5px;background:#FF2E9A;color:#fff;}
        .vo-marque{display:flex;flex-direction:column;align-items:center;}
        .vo-mot{font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:clamp(34px,3.4vw,48px);line-height:1;}
        .vo-marque p{position:relative;margin:2px 0 0;padding-bottom:6px;
          font-family:var(--font-main-levee),cursive;font-size:clamp(19px,1.6vw,24px);color:#FFF4E6;transform:rotate(-3deg);}
        .vo-marque p::after{content:"";position:absolute;left:18%;right:18%;bottom:0;height:3px;border-radius:99px;
          background:linear-gradient(90deg,transparent,#FF2E9A 30%,#FF2E9A 70%,transparent);}

        /* LE TITRE */
        .vo-titre{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding:6px 40px 0;
          animation:voMonte .6s cubic-bezier(.16,1,.3,1) both;}
        .vo-titre h1{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;
          font-size:clamp(26px,2.4vw,36px);letter-spacing:-.02em;line-height:1.1;}
        .vo-lien{flex:none;padding:6px 0;border:0;background:none;cursor:pointer;font-weight:700;font-size:17px;
          color:#FF4FB0 !important;border-bottom:2px solid #FF2E9A;}
        .vo-lien s{text-decoration:none;display:inline-block;margin:0 4px;transition:transform .2s ease;}
        .vo-lien:hover s{transform:translateX(4px);}

        /* LE CARROUSEL */
        .vo-scene{flex:1;min-height:0;margin-top:14px;perspective:1600px;touch-action:pan-y;}
        .vo-piste{position:absolute;inset:0;animation:voArrive .8s cubic-bezier(.16,1,.3,1) both;}
        .vo-carte{position:absolute;top:0;bottom:0;left:50%;width:var(--vo-w);margin-left:calc(var(--vo-w) / -2);
          border-radius:30px;overflow:hidden;background:#1C1411;cursor:pointer;
          border:1px solid rgba(255,196,140,.18);
          box-shadow:0 40px 90px -30px rgba(0,0,0,.9),0 0 0 1px rgba(0,0,0,.4);
          transition:transform .65s cubic-bezier(.22,1,.36,1),opacity .5s ease,filter .5s ease;
          filter:brightness(calc(1 - var(--k,0) * .38)) saturate(calc(1 - var(--k,0) * .25));}
        .vo-carte.centre{cursor:default;border-color:rgba(255,196,140,.32);
          box-shadow:0 50px 110px -30px rgba(0,0,0,.95),0 0 80px -20px rgba(245,162,58,.25);}
        .vo-photo{position:absolute;inset:0;background:#2A1F1B center / cover no-repeat;
          transition:transform 6s ease;}
        .vo-carte.centre .vo-photo{animation:voZoom 14s ease-in-out infinite alternate;}
        @keyframes voZoom{from{transform:scale(1);}to{transform:scale(1.07);}}
        .vo-voile{position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,12,9,.6) 0%,rgba(18,12,9,0) 22%,
          rgba(18,12,9,0) 42%,rgba(18,12,9,.72) 66%,rgba(18,12,9,.96) 100%);}
        .vo-c-haut{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;gap:14px;padding:22px 24px;}
        .vo-avatar{flex:none;width:clamp(48px,5vw,74px);aspect-ratio:1;border-radius:50%;
          background:#2A1F1B center / cover no-repeat;border:3px solid rgba(255,244,230,.85);
          box-shadow:0 8px 20px rgba(0,0,0,.5);}
        .vo-carte.cote .vo-avatar{display:none;}
        .vo-nom{min-width:0;display:flex;flex-direction:column;}
        .vo-nom b{font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:clamp(19px,1.8vw,26px);
          line-height:1.1;text-shadow:0 2px 12px rgba(0,0,0,.6);}
        .vo-nom i{font-style:normal;font-size:clamp(14px,1.1vw,17px);color:#F3E2D0;text-shadow:0 1px 8px rgba(0,0,0,.6);}
        .vo-demo{margin-left:auto;align-self:flex-start;flex:none;padding:7px 14px;border-radius:999px;font-style:normal;
          font-size:13px;color:#E8D5C2;background:rgba(28,20,17,.7);border:1px solid rgba(255,196,140,.3);}
        .vo-carte.cote .vo-c-haut{padding:28px;}
        .vo-carte.cote .vo-c-bas{padding:0 28px 28px;}
        .vo-c-bas{position:absolute;left:0;right:0;bottom:0;padding:0 24px 24px;}
        .vo-carte.centre .vo-c-bas{padding-right:clamp(140px,12vw,176px);}
        .vo-c-bas h2{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;
          font-size:clamp(28px,3vw,46px);line-height:1.04;letter-spacing:-.025em;text-wrap:balance;
          text-shadow:0 4px 24px rgba(0,0,0,.55);animation:voMonte .6s cubic-bezier(.16,1,.3,1) .1s both;}
        .vo-offre{margin:8px 0 0;font-size:clamp(15px,1.2vw,18px);color:#FFF4E6;line-height:1.35;}
        .vo-offre span{color:#E8D5C2;}
        .vo-carte.cote .vo-offre{display:none;}
        .vo-prix{margin:6px 0 0;font-family:var(--font-clikme),sans-serif;font-weight:800;
          font-size:clamp(32px,3.6vw,54px);line-height:1;color:#F5A23A;letter-spacing:-.02em;
          text-shadow:0 4px 24px rgba(245,162,58,.3);}
        .vo-carte.cote .vo-prix{font-size:clamp(28px,2.6vw,40px);}
        .vo-go{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:12px;
          width:100%;margin-top:clamp(12px,2vh,20px);padding:clamp(14px,1.8vh,19px) 24px;border:0;border-radius:999px;cursor:pointer;
          font-family:var(--font-clikme),sans-serif !important;font-weight:800;font-size:clamp(17px,1.5vw,21px);color:#fff !important;
          background:linear-gradient(135deg,#FF4FB0,#FF2E9A 60%,#E0187F);
          box-shadow:0 18px 40px -12px rgba(255,46,154,.75);transition:transform .2s cubic-bezier(.34,1.4,.64,1);}
        .vo-go:hover{transform:translateY(-2px) scale(1.01);}
        .vo-go s{text-decoration:none;font-size:22px;transition:transform .2s ease;}
        .vo-go:hover s{transform:translateX(4px);}
        .vo-go::after{content:"";position:absolute;inset:0;
          background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.45) 50%,transparent 65%);
          transform:translateX(-120%);animation:voReflet 3.6s cubic-bezier(.16,1,.3,1) 1.2s infinite;}
        @keyframes voReflet{0%{transform:translateX(-120%);}55%,100%{transform:translateX(120%);}}
        .vo-droite{position:absolute;right:14px;top:72px;bottom:10px;width:clamp(116px,10vw,150px);
          display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:8px;pointer-events:none;}
        .vo-droite>*{pointer-events:auto;}
        .vo-son-fantome{flex:none;width:100%;height:clamp(100px,16vh,160px);object-fit:contain;
          object-position:bottom;pointer-events:none !important;filter:drop-shadow(0 14px 22px rgba(0,0,0,.6));
          animation:voFlotte 4.4s ease-in-out infinite,voSurgit .7s cubic-bezier(.34,1.56,.64,1) .3s both;}
        @keyframes voFlotte{0%,100%{translate:0 0;rotate:-2deg;}50%{translate:0 -10px;rotate:2deg;}}
        @keyframes voSurgit{from{opacity:0;transform:scale(.4) translateY(30px);}to{opacity:1;transform:none;}}

        /* LES QUATRE GESTES */
        .vo-gestes{flex:0 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:clamp(6px,1.1vh,12px);
          animation:voGlisse .6s cubic-bezier(.16,1,.3,1) .2s both;}
        .vo-gestes a,.vo-gestes button{display:flex;flex-direction:column;align-items:center;gap:5px;padding:0;border:0;
          background:none;cursor:pointer;text-decoration:none;color:#FFF4E6;font-size:14px;font-weight:600;
          text-shadow:0 1px 8px rgba(0,0,0,.7);}
        .vo-gestes span{display:grid;place-items:center;width:clamp(44px,5.6vh,56px);aspect-ratio:1;border-radius:50%;
          background:rgba(18,12,9,.72);border:1px solid rgba(255,244,230,.22);backdrop-filter:blur(8px);
          -webkit-backdrop-filter:blur(8px);transition:transform .2s cubic-bezier(.34,1.4,.64,1),background .2s ease;}
        .vo-gestes a:hover span,.vo-gestes button:hover span{transform:scale(1.08);background:rgba(255,46,154,.25);}
        .vo-gestes svg{width:26px;height:26px;fill:none;stroke:#FFF4E6;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
        .vo-gestes .aime span{background:rgba(255,46,154,.3);border-color:rgba(255,46,154,.7);animation:voCoeur .45s cubic-bezier(.34,1.56,.64,1);}
        .vo-gestes .aime svg{fill:#FF2E9A;stroke:#FF2E9A;}
        @keyframes voCoeur{0%{transform:scale(1);}40%{transform:scale(1.25);}100%{transform:scale(1);}}

        .vo-fleche{position:absolute;top:50%;z-index:20;display:grid;place-items:center;width:64px;height:64px;margin-top:-32px;
          border-radius:50%;cursor:pointer;background:rgba(28,20,17,.85);border:1.5px solid rgba(255,196,140,.45);
          box-shadow:0 12px 30px rgba(0,0,0,.5);transition:transform .2s ease,background .2s ease,opacity .2s ease;}
        .vo-fleche.gauche{left:calc(50% - var(--vo-w) * .5 - min(23vw,330px));}
        .vo-fleche.droite{right:calc(50% - var(--vo-w) * .5 - min(23vw,330px));}
        .vo-fleche:hover:not(:disabled){transform:scale(1.07);background:rgba(255,46,154,.22);}
        .vo-fleche:disabled{opacity:.25;cursor:default;}
        .vo-fleche svg{width:28px;height:28px;fill:none;stroke:#FFF4E6;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}

        .vo-rien{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(460px,80vw);padding:30px;
          text-align:center;border-radius:26px;border:1px dashed rgba(255,196,140,.35);background:rgba(28,20,17,.7);}
        .vo-rien b{font-family:var(--font-clikme),sans-serif;font-size:22px;}
        .vo-rien p{margin:8px 0 18px;color:#CDB8A4;}
        .vo-rien button{padding:12px 22px;border-radius:999px;border:0;cursor:pointer;background:#FF2E9A;color:#fff;font-weight:700;}

        /* OÙ L'ON EN EST */
        .vo-ou{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 0 8px;}
        .vo-points{display:flex;gap:9px;}
        .vo-points i{width:10px;height:10px;border-radius:50%;background:rgba(255,244,230,.28);
          transition:background .3s ease,transform .3s ease;}
        .vo-points i.on{background:#FF2E9A;transform:scale(1.35);box-shadow:0 0 12px rgba(255,46,154,.7);}
        .vo-ou p{margin:0;font-size:15px;color:#E8D5C2;min-height:20px;}

        /* LE FANTÔME QUI PRÉSENTE */
        .vo-hote{position:absolute !important;left:28px;bottom:104px;z-index:25 !important;display:flex;flex-direction:column;
          align-items:flex-start;
          pointer-events:none;animation:voSurgit .8s cubic-bezier(.34,1.56,.64,1) .5s both;}
        .vo-hote img{width:clamp(110px,10vw,150px);height:auto;filter:drop-shadow(0 14px 24px rgba(0,0,0,.6));
          animation:voFlotte 5s ease-in-out infinite;}
        .vo-bulle{position:relative;order:-1;margin:0 0 6px 40px;padding:12px 18px;border-radius:20px;
          max-width:min(230px,calc(50vw - var(--vo-w) / 2 - 80px));background:#FFF4E6;color:#1A0F08;font-family:var(--font-main-levee),cursive;font-size:23px;
          font-weight:600;line-height:1.15;box-shadow:0 14px 30px -10px rgba(0,0,0,.6);
          animation:voBulle .5s cubic-bezier(.34,1.56,.64,1) both;}
        .vo-bulle::after{content:"";position:absolute;left:30px;bottom:-7px;width:16px;height:16px;background:#FFF4E6;
          transform:rotate(45deg);border-radius:3px;}
        @keyframes voBulle{from{opacity:0;transform:translateY(8px) scale(.9);}to{opacity:1;transform:none;}}

        /* LES CATÉGORIES ET LA RECHERCHE */
        .vo-bas{display:flex;align-items:center;gap:14px;margin:0 32px 22px;padding:10px;border-radius:26px;
          background:rgba(28,20,17,.82);border:1px solid rgba(255,196,140,.2);backdrop-filter:blur(12px);
          -webkit-backdrop-filter:blur(12px);animation:voMonte .7s cubic-bezier(.16,1,.3,1) .15s both;}
        .vo-cats{display:flex;gap:4px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;}
        .vo-cats::-webkit-scrollbar{display:none;}
        .vo-cats button{flex:none;display:flex;align-items:center;gap:9px;padding:12px 18px;border-radius:18px;cursor:pointer;
          font-size:16px;font-weight:600;background:transparent;border:1px solid transparent;color:#F3E2D0;
          transition:background .2s ease,border-color .2s ease;}
        .vo-cats button:hover{background:rgba(255,244,230,.06);}
        .vo-cats button.on{background:rgba(255,46,154,.16);border-color:rgba(255,46,154,.55);color:#FFF4E6;}
        .vo-cats svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
        .vo-cats button.on svg{stroke:#FF2E9A;}
        .vo-cherche{flex:0 1 340px;display:flex;align-items:center;gap:10px;padding:0 18px;height:50px;border-radius:999px;
          border-left:1px solid rgba(255,196,140,.2);background:rgba(18,12,9,.6);border:1px solid rgba(255,196,140,.22);}
        .vo-cherche svg{flex:none;width:22px;height:22px;fill:none;stroke:#E8D5C2;stroke-width:1.9;stroke-linecap:round;}
        .vo-cherche input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;color:#FFF4E6;
          font:inherit;font-size:16px;}
        .vo-cherche input::placeholder{color:#B9A594;}
        .vo-cherche:focus-within{border-color:rgba(255,46,154,.6);}

        .vo-dit{position:absolute !important;left:50%;bottom:110px;z-index:40 !important;transform:translateX(-50%);margin:0;
          padding:12px 20px;border-radius:999px;background:#FFF4E6;color:#1A0F08;font-weight:600;
          box-shadow:0 14px 30px -10px rgba(0,0,0,.6);animation:voBulle .35s ease both;}

        @keyframes voDescend{from{opacity:0;transform:translateY(-14px);}to{opacity:1;transform:none;}}
        @keyframes voMonte{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;}}
        @keyframes voGlisse{from{opacity:0;transform:translateX(16px);}to{opacity:1;transform:none;}}
        @keyframes voArrive{from{opacity:0;transform:translateY(40px) scale(.96);filter:blur(8px);}to{opacity:1;transform:none;filter:none;}}

        /* UN ÉCRAN PLUS BAS : on serre, sans rien retirer. */
        @media (max-height:820px){
          .vo-haut{padding-top:12px;}
          .vo-mot{font-size:34px;}
          .vo-marque p{font-size:18px;}
          .vo-titre h1{font-size:26px;}
          .vo-bas{margin-bottom:14px;padding:7px;}
          .vo-cats button{padding:10px 15px;}
          .vo-cherche{height:44px;}
          .vo-hote{bottom:86px;}
          .vo-hote img{width:110px;}
          .vo-bulle{font-size:20px;max-width:200px;}
          /* LES MOTS DES GESTES S'EFFACENT, LES RONDS RESTENT : sans quoi le
             fantôme de la carte n'avait plus la place d'exister. */
          .vo-gestes a,.vo-gestes button{font-size:0;gap:0;}
          .vo-gestes span{width:44px;}
        }
        @media (max-width:1240px){
          .vo{--vo-w:min(620px,52vw);}
          .vo-cats button{padding:10px 12px;font-size:15px;}
        }
        @media (prefers-reduced-motion:reduce){
          .vo *,.vo *::before,.vo *::after{animation:none !important;transition-duration:.01ms !important;}
        }
        `,
      }}
    />
  );
}
