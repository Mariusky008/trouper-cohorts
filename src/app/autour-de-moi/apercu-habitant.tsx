"use client";

// L'APPLICATION, TELLE QU'ELLE SERAIT — une grande photo, et tout le reste au
// scroll.
//
// CE QUE C'EST. Une maquette jouable de ce que verrait un habitant, faite pour
// savoir si l'idée lui parle avant qu'on la construise. Ce qu'elle met en scène
// et qui n'existe pas est listé en tête de `lib/direct/apercu-habitant.ts` — et
// NULLE PART à l'écran : les gens à qui on la montre savent déjà que c'est un
// essai, et le leur répéter les met en position de juger une démonstration au
// lieu d'essayer une application.
//
// ── CE QUI CHANGE DANS CETTE VERSION, ET POURQUOI ──────────────────────────
//
// 1. LA CARTE ÉTAIT PETITE ET CHARGÉE. Elle était bridée à son rapport 3/4,15 —
//    la proportion d'un encart dans une page — et elle empilait le nom, le
//    métier, la ville, la distance, le social, l'offre, trois lignes, le prix,
//    l'étiquette et les avis. Sur un téléphone, ça fait dix informations à
//    lire avant de pouvoir décider quoi que ce soit.
//
//    Happn et Tinder ont résolu ça il y a longtemps : UNE GRANDE PHOTO,
//    presque rien dessus, et on descend si ça nous plaît. On reprend
//    exactement ce modèle. La carte occupe désormais toute la hauteur
//    disponible, elle porte le strict nécessaire, et le détail vit sous le
//    pli — le programme de la journée, les avis, la fiche du commerce.
//
// 2. LES FEUILLES « AVIS » ET « LE PRO » DISPARAISSENT. Elles montaient
//    par-dessus l'application pour dire ce que le scroll dit mieux : dans le
//    même geste, sans quitter la carte, sans rien à refermer. Il ne reste que
//    deux feuilles — choisir son métier, et réserver — c'est-à-dire les deux
//    seuls moments où l'on fait autre chose que regarder.
//
// 3. UNE ANNONCE PAR COMMERCE ET PAR JOUR, avec ses moments horodatés. Le
//    raisonnement complet est en tête de `MomentJour` : le produit demandait
//    cinq gestes au commerçant, aux heures précises où il est en service. Il
//    en pose un seul le matin, et la carte affiche toute seule CE QUI VIENT.
//
// LE GESTE HORIZONTAL ET LE GESTE VERTICAL COHABITENT, et c'est le seul endroit
// délicat : on verrouille la direction au premier mouvement, et le balayage est
// désactivé dès qu'on a commencé à descendre. Sans ça, lire le programme ferait
// partir la carte.
import { useRef, useState, useSyncExternalStore } from "react";
import { CarteSwipe, StylesDirect } from "@/components/direct/carte-swipe";
import {
  ENVIES,
  HEURE_MAX,
  HEURE_MIN,
  METIERS,
  QUANDS,
  SORTIES,
  autourDeMoi,
  carteAffichee,
  carteDeReponse,
  comptesParMetier,
  momentsRestants,
  moyenneAvis,
  repondeurs,
  seJoueMaintenant,
  selonEnvies,
  type AvisPlat,
  type CarteAutour,
  type CleMetier,
  type MomentJour,
} from "@/lib/direct/apercu-habitant";
import { MARQUE } from "@/lib/marque";

/** Au-delà de cette distance en pixels, le doigt a décidé : la carte part. */
const SEUIL = 84;
/** Le déplacement à partir duquel on sait si le geste est horizontal ou vertical. */
const VERROU = 8;
/** La durée de l'envol, la même qu'en CSS. */
const VOL_MS = 420;
/** La durée du vol du cœur vers les favoris, la même qu'en CSS. */
const COEUR_MS = 900;
/** Le temps que dure l'écran « envoyé aux commerces » avant la première réponse. */
const ENVOI_MS = 3400;
/** LA MAQUETTE COMPRESSE LES MINUTES EN SECONDES. Dans la vraie vie une réponse
 *  arrive en une à trois minutes ; ici on multiplie par ça, sinon on montre un
 *  écran d'attente à quelqu'un qui a le téléphone dans la main. L'ordre et
 *  l'échelonnement sont conservés — c'est eux qui font sentir que les réponses
 *  VIENNENT de commerces différents. */
const RYTHME = 700;

// ── LES AVIS QUE LE VISITEUR LAISSE, GARDÉS DANS SON NAVIGATEUR ────────────
//
// Il note, il ferme, il revient : son avis est toujours là. Sans ça, « les avis
// sont mémorisés » reste une phrase. `useSyncExternalStore` plutôt qu'un effet :
// le stockage local n'existe pas côté serveur et lire pendant le rendu casserait
// l'hydratation. Lecture et écriture sous `try` — la navigation privée refuse
// les deux, et la page doit continuer.
const CLE_LOCALE = "clikme-avis-plat-v1";
const VIDE: Record<string, AvisPlat[]> = {};
let memoire: Record<string, AvisPlat[]> | null = null;
const abonnes = new Set<() => void>();

function chargerAvis(): Record<string, AvisPlat[]> {
  if (memoire) return memoire;
  try {
    memoire = JSON.parse(window.localStorage.getItem(CLE_LOCALE) || "{}");
  } catch {
    memoire = {};
  }
  return memoire ?? VIDE;
}
function abonnerAvis(f: () => void) {
  abonnes.add(f);
  return () => void abonnes.delete(f);
}
function ajouterAvis(cle: string, avis: AvisPlat) {
  const avant = chargerAvis();
  memoire = { ...avant, [cle]: [avis, ...(avant[cle] ?? [])] };
  try {
    window.localStorage.setItem(CLE_LOCALE, JSON.stringify(memoire));
  } catch {
    /* Refusé : l'avis vit quand même le temps de la visite. */
  }
  abonnes.forEach((f) => f());
}

function Etoiles({ note }: { note: number }) {
  return (
    <span className="ap-et" aria-label={`${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={n <= Math.round(note) ? "on" : ""} aria-hidden="true">
          ★
        </i>
      ))}
    </span>
  );
}

export function ApercuHabitant() {
  // L'HEURE DU VISITEUR, SANS CASSER L'HYDRATATION : le serveur ne connaît pas
  // son fuseau. Instantané serveur à midi, instantané client réel.
  const heureVraie = useSyncExternalStore(
    () => () => {},
    () => new Date().getHours() + new Date().getMinutes() / 60,
    () => 12,
  );
  const heure = heureVraie >= HEURE_MIN && heureVraie <= HEURE_MAX ? heureVraie : 12;

  const [branche, setBranche] = useState<CleMetier>("restaurant");
  const [envies, setEnvies] = useState<string[]>([]);
  const [passees, setPassees] = useState<string[]>([]);
  const [gardees, setGardees] = useState<string[]>([]);
  const [reserves, setReserves] = useState<string[]>([]);
  const [dx, setDx] = useState(0);
  const [sortant, setSortant] = useState<"" | "gauche" | "droite">("");
  const [aJoue, setAJoue] = useState(false);
  const [descendu, setDescendu] = useState(false);
  const [coeurVole, setCoeurVole] = useState(false);
  const [feuille, setFeuille] = useState<"" | "metier" | "resa" | "sortie" | "jyvais">("");
  /** La sortie annoncée : ce pour quoi on sort, et quand. Rien : on regarde. */
  const [sortie, setSortie] = useState<{ quoi: CleMetier; quand: string } | null>(null);
  const [phase, setPhase] = useState<"" | "envoi" | "reponses">("");
  /** Les commerces qui ont répondu, DANS L'ORDRE D'ARRIVÉE — c'est cet ordre
   *  qui décide de la pile, pas la distance. */
  const [arrivees, setArrivees] = useState<string[]>([]);
  /** L'étape en cours dans la feuille « je sors » : le quoi, puis le quand. */
  const [sortiePour, setSortiePour] = useState<CleMetier | "">("");
  const [notes, setNotes] = useState<Record<string, number>>({});
  const [creneau, setCreneau] = useState("");
  const prise = useRef<{ x0: number; y0: number; axe: "" | "x" | "y" } | null>(null);
  const minuteries = useRef<number[]>([]);
  const defilement = useRef<HTMLDivElement | null>(null);

  const miens = useSyncExternalStore(abonnerAvis, chargerAvis, () => VIDE);

  const dispoBrut = selonEnvies(autourDeMoi(heure, branche), envies, heure);
  /** UNE RÉPONSE PASSE DEVANT TOUT LE RESTE, et dans l'ordre où elle est
   *  arrivée. Triée par distance comme les autres, elle se noierait au milieu
   *  du paquet et on ne verrait pas qu'elle vient de tomber. */
  const rang = (c: CarteAutour) => {
    const i = arrivees.indexOf(c.id);
    return i < 0 ? 999 : i;
  };
  const dispo = sortie
    ? [...dispoBrut].sort((a, b) => rang(a) - rang(b) || a.metres - b.metres)
    : dispoBrut;
  const pile = dispo.filter((c) => !passees.includes(c.id));
  const estReponse = (c: CarteAutour) => !!sortie && arrivees.includes(c.id);
  const combienSollicites = sortie ? autourDeMoi(heure, sortie.quoi).length : 0;
  const dessus = pile[0];
  const dessous = pile[1];
  const comptes = comptesParMetier(heure);
  const metier = METIERS.find((m) => m.cle === branche) ?? METIERS[0];
  const restants = dessus ? momentsRestants(dessus, heure) : [];

  /** La clé d'un moment dans le carnet local : le commerce et son intitulé. */
  const cleMoment = (c: CarteAutour, m: MomentJour) => `${c.id}|${m.titre}`;
  const avisDe = (c: CarteAutour, m: MomentJour): AvisPlat[] => [
    ...(miens[cleMoment(c, m)] ?? []),
    ...(m.avis ?? []),
  ];

  function remettre() {
    minuteries.current.forEach(clearTimeout);
    minuteries.current = [];
    setPassees([]);
    setDx(0);
    setSortant("");
    setCoeurVole(false);
    setDescendu(false);
    defilement.current?.scrollTo({ top: 0 });
  }

  function partir(sens: "gauche" | "droite") {
    if (!dessus || sortant) return;
    setAJoue(true);
    setSortant(sens);
    setDx(sens === "droite" ? 420 : -420);
    const id = dessus.id;
    if (sens === "droite") setCoeurVole(true);
    minuteries.current.push(
      window.setTimeout(() => {
        if (sens === "droite") setGardees((g) => (g.includes(id) ? g : [...g, id]));
        setPassees((p) => [...p, id]);
        setDx(0);
        setSortant("");
        setDescendu(false);
        defilement.current?.scrollTo({ top: 0 });
      }, VOL_MS),
    );
    if (sens === "droite") {
      minuteries.current.push(window.setTimeout(() => setCoeurVole(false), COEUR_MS));
    }
  }

  /**
   * ANNONCER SA SORTIE — et c'est l'inversion du produit.
   *
   * Jusqu'ici l'habitant regardait ce que les commerces avaient publié. Là il
   * dit qu'il sort, et ce sont les commerces qui viennent à lui. Rien n'existe
   * avant qu'il demande : ce ne sont pas des résultats filtrés, ce sont des
   * réponses, et elles arrivent une par une.
   */
  function lancerSortie(quoi: CleMetier, quand: string) {
    minuteries.current.forEach(clearTimeout);
    minuteries.current = [];
    setBranche(quoi);
    setEnvies([]);
    setPassees([]);
    setDx(0);
    setSortant("");
    setDescendu(false);
    setSortie({ quoi, quand });
    setArrivees([]);
    setPhase("envoi");
    setFeuille("");
    setSortiePour("");
    defilement.current?.scrollTo({ top: 0 });
    // L'ÉCRAN D'ENVOI DURE LE TEMPS QU'IL FAUT POUR Y CROIRE, puis la première
    // réponse tombe. Trop court, on ne voit rien partir ; trop long, on repose
    // le téléphone.
    minuteries.current.push(window.setTimeout(() => setPhase("reponses"), ENVOI_MS));
    for (const c of repondeurs(heure, quoi)) {
      const quandArrive = Math.max(ENVOI_MS + 200, (c.reponse?.apres ?? 0) * RYTHME);
      minuteries.current.push(
        window.setTimeout(
          () => setArrivees((a) => (a.includes(c.id) ? a : [...a, c.id])),
          quandArrive,
        ),
      );
    }
  }

  function annulerSortie() {
    minuteries.current.forEach(clearTimeout);
    minuteries.current = [];
    setSortie(null);
    setPhase("");
    setArrivees([]);
    setPassees([]);
    setDx(0);
    setSortant("");
  }

  /** Le bouton « Détails » et l'indice sous la photo font la même chose. */
  function versLeBas() {
    const el = defilement.current;
    if (el) el.scrollTo({ top: el.clientHeight - 90, behavior: "smooth" });
  }

  const listeEnvies = ENVIES[branche];
  const aReserver = restants.filter((m) => m.action && (m.places ?? 1) > 0);

  return (
    <div className="ap">
      <StylesDirect />
      <div className="ap-tel">
        <div className="ap-app">
          <div className="ap-haut">
            {/* Le bandeau du produit — mêmes classes, donc même allure — mais
                ses pastilles sont ici de vrais boutons. */}
            <div className="cd-barre">
              <span className="cd-marque">{MARQUE}</span>
              <button
                type="button"
                className="cd-puce ap-metier"
                onClick={() => setFeuille("metier")}
                aria-label="Changer de métier"
              >
                <i aria-hidden="true">{metier.emoji}</i>
                {metier.label}
                <em aria-hidden="true">▾</em>
              </button>
              {reserves.length > 0 && (
                <span className="cd-puce">
                  <i aria-hidden="true">📅</i>
                  <b>{reserves.length}</b>
                </span>
              )}
              <span className={`cd-puce vert ap-fav${coeurVole ? " pop" : ""}`}>
                <i aria-hidden="true">💚</i>
                <b>{gardees.length}</b>
              </span>
            </div>

            {/* LA BANDE DU HAUT CHANGE DE NATURE PENDANT UNE SORTIE. Les envies
                servent à trier ce qui existe ; quand on a annoncé qu'on sort,
                ce qui compte n'est plus le tri mais l'attente — combien ont été
                prévenus, combien ont répondu. Les deux ne peuvent pas cohabiter
                sur une seule ligne sans que l'écran redevienne illisible. */}
            {sortie ? (
              <div className="ap-sortie">
                <span className="ap-s-quoi">
                  <i aria-hidden="true">
                    {SORTIES.find((x) => x.cle === sortie.quoi)?.emoji}
                  </i>
                  {SORTIES.find((x) => x.cle === sortie.quoi)?.label} ·{" "}
                  {sortie.quand.toLowerCase()}
                </span>
                <span className="ap-s-etat" aria-live="polite">
                  {phase === "envoi"
                    ? `Envoyé à ${combienSollicites}`
                    : `${arrivees.length} réponse${arrivees.length > 1 ? "s" : ""}`}
                </span>
                <button
                  type="button"
                  className="ap-s-x"
                  aria-label="Annuler ma sortie"
                  onClick={annulerSortie}
                >
                  ✕
                </button>
              </div>
            ) : (
            <div className="ap-envies">
              {/* LE GESTE PRINCIPAL EST LA PREMIÈRE PASTILLE, pas un bouton de
                  plus sous les filtres : il est dans la zone du pouce, il ne
                  coûte pas une ligne de hauteur, et sa couleur le distingue de
                  tout ce qui trie. */}
              <button
                type="button"
                className="ap-e ap-sors"
                onClick={() => {
                  setSortiePour("");
                  setFeuille("sortie");
                }}
              >
                <i aria-hidden="true">⚡</i>Je sors
              </button>
              {listeEnvies.map((e) => {
                const on = envies.includes(e.cle);
                return (
                  <button
                    key={e.cle}
                    type="button"
                    aria-pressed={on}
                    className={`ap-e${on ? " on" : ""}`}
                    onClick={() => {
                      setEnvies((v) =>
                        v.includes(e.cle) ? v.filter((x) => x !== e.cle) : [...v, e.cle],
                      );
                      remettre();
                    }}
                  >
                    <i aria-hidden="true">{e.emoji}</i>
                    {e.label}
                  </button>
                );
              })}
            </div>
            )}
          </div>

          <div className="ap-vue">
            {phase === "envoi" ? (
              /* L'ATTENTE EST L'ÉMOTION, PAS UN DÉFAUT. C'est le moment où l'on
                 comprend que quelque chose part vers de vraies personnes, et
                 c'est ce que ne procure aucune recherche. Une liste qui
                 apparaît instantanément, on sait que c'est une base de données ;
                 des réponses qui tombent une par une, on sait que ce sont des
                 gens. */
              <div className="ap-envoi">
                <span className="ap-envoi-e" aria-hidden="true">⚡</span>
                <b>Envoyé à {combienSollicites} commerces</b>
                <i>à moins de 500 m, ouverts maintenant</i>
                <div className="ap-points" aria-hidden="true">
                  {Array.from({ length: combienSollicites }).map((_, i) => (
                    <span key={i} style={{ animationDelay: `${i * 0.13}s` }} />
                  ))}
                </div>
              </div>
            ) : dessus ? (
              <div className="ap-pile">
                {dessous && (
                  <CarteSwipe
                    key={`d-${dessous.id}`}
                    carte={
                      estReponse(dessous)
                        ? carteDeReponse(dessous)
                        : carteAffichee(dessous, heure)
                    }
                    className="ap-carte dessous"
                  />
                )}
                <div
                  className={`ap-dessus${sortant ? ` vole ${sortant}` : ""}${
                    estReponse(dessus) ? " pour-vous" : ""
                  }`}
                  style={{ transform: `translate3d(${dx}px,0,0) rotate(${dx * 0.04}deg)` }}
                  onPointerDown={(e) => {
                    if (sortant) return;
                    // PAS DE CAPTURE ICI. La capture au premier contact volerait
                    // le défilement au navigateur : on ne la prend qu'une fois
                    // sûr que le geste est horizontal.
                    prise.current = { x0: e.clientX, y0: e.clientY, axe: "" };
                  }}
                  onPointerMove={(e) => {
                    const p = prise.current;
                    if (!p) return;
                    const ddx = e.clientX - p.x0;
                    const ddy = e.clientY - p.y0;
                    if (!p.axe) {
                      if (Math.abs(ddx) < VERROU && Math.abs(ddy) < VERROU) return;
                      // Le premier mouvement décide, et il décide pour tout le
                      // geste : sinon un doigt qui dérive fait partir la carte
                      // au milieu d'une lecture.
                      p.axe = Math.abs(ddx) > Math.abs(ddy) && !descendu ? "x" : "y";
                      if (p.axe === "x") e.currentTarget.setPointerCapture(e.pointerId);
                    }
                    if (p.axe === "x") setDx(ddx);
                  }}
                  onPointerUp={() => {
                    const p = prise.current;
                    prise.current = null;
                    if (!p || p.axe !== "x") return;
                    if (dx > SEUIL) partir("droite");
                    else if (dx < -SEUIL) partir("gauche");
                    else setDx(0);
                  }}
                  onPointerCancel={() => {
                    prise.current = null;
                    setDx(0);
                  }}
                >
                  {/* LE DÉFILEMENT EST DANS LA CARTE, pas dans la page. La
                      première hauteur d'écran est la photo ; tout ce qui suit
                      est le détail, et on y va d'un pouce. */}
                  <div
                    className="ap-scroll"
                    ref={defilement}
                    onScroll={(e) => {
                      const y = (e.target as HTMLDivElement).scrollTop;
                      setDescendu(y > 24);
                    }}
                  >
                    <div className="ap-un">
                      <CarteSwipe
                        carte={
                          estReponse(dessus)
                            ? carteDeReponse(dessus)
                            : carteAffichee(dessus, heure)
                        }
                        className="ap-carte"
                      >
                        {/* LA PASTILLE NE RÉPÈTE PAS « il vous répond » — c'est
                            déjà écrit deux lignes plus haut. Elle dit ce qu'on
                            ne sait pas encore : que d'autres ont répondu aussi,
                            et qu'il faut balayer pour les voir. */}
                        {estReponse(dessus) && arrivees.length > 1 && (
                          <span className="ap-badge-vous">
                            <i aria-hidden="true">⚡</i>
                            {arrivees.length - 1} autre
                            {arrivees.length > 2 ? "s" : ""} ont répondu aussi
                          </span>
                        )}
                        {!estReponse(dessus) && restants.length > 1 && (
                          <button
                            type="button"
                            className="ap-vers-bas"
                            onPointerDown={(ev) => ev.stopPropagation()}
                            onClick={versLeBas}
                          >
                            {restants.length} moments aujourd&apos;hui
                            <i aria-hidden="true">⌄</i>
                          </button>
                        )}
                      </CarteSwipe>
                    </div>

                    {/* ── SOUS LE PLI ── */}
                    <div className="ap-plus">
                      <div className="ap-bloc">
                        <h3>La journée</h3>
                        <ol className="ap-prog">
                          {restants.map((m) => {
                            const av = avisDe(dessus, m);
                            const maNote = notes[cleMoment(dessus, m)] ?? 0;
                            return (
                              <li
                                key={m.titre}
                                className={seJoueMaintenant(m, heure) ? "on" : ""}
                              >
                                <div className="ap-prog-h">
                                  <b>{m.quand}</b>
                                  {seJoueMaintenant(m, heure) && <span className="ap-live">en cours</span>}
                                </div>
                                <div className="ap-prog-t">
                                  <i aria-hidden="true">{m.icone}</i>
                                  {m.titre}
                                </div>
                                {!!m.lignes?.length && (
                                  <div className="ap-prog-l">
                                    {m.lignes.map((l) => (
                                      <span key={l}>{l}</span>
                                    ))}
                                  </div>
                                )}
                                <div className="ap-prog-p">
                                  {m.prix && <b>{m.prix}</b>}
                                  {m.prixBarre && <s>{m.prixBarre}</s>}
                                  {m.etiquette && <em>{m.etiquette}</em>}
                                  {m.places != null && <span>{m.places} restantes</span>}
                                </div>

                                {/* LES AVIS SONT SOUS LE MOMENT QU'ILS CONCERNENT,
                                    pas sous le commerce : c'est le plat qu'on
                                    note, et c'est lui qui les remporte quand il
                                    revient à la carte. */}
                                {av.length > 0 && (
                                  <div className="ap-prog-av">
                                    <div className="ap-prog-av-h">
                                      <Etoiles note={moyenneAvis(av)} />
                                      <b>{moyenneAvis(av).toString().replace(".", ",")}</b>
                                      <span>· {av.length} avis</span>
                                    </div>
                                    {av.slice(0, 2).map((a, n) => (
                                      <p key={`${a.qui}-${n}`}>
                                        <b>{a.qui}</b> {a.texte}
                                      </p>
                                    ))}
                                  </div>
                                )}

                                {/* LE GESTE DE RETOUR TIENT EN UN APPUI. Une
                                    vidéo ou un texte demandés à chaque fois ne
                                    seraient jamais donnés ; cinq étoiles, si. */}
                                <div className="ap-noter">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <button
                                      key={n}
                                      type="button"
                                      className={`ap-n${n <= maNote ? " on" : ""}`}
                                      aria-label={`Noter ${n} sur 5`}
                                      onPointerDown={(ev) => ev.stopPropagation()}
                                      onClick={() => {
                                        const cle = cleMoment(dessus, m);
                                        setNotes((v) => ({ ...v, [cle]: n }));
                                        ajouterAvis(cle, {
                                          note: n,
                                          texte: "",
                                          qui: "Vous",
                                          quand: "à l'instant",
                                        });
                                      }}
                                    >
                                      ★
                                    </button>
                                  ))}
                                  <span>{maNote ? "Noté" : "J'y suis allé"}</span>
                                </div>

                                {m.action && (m.places ?? 1) > 0 && (
                                  <button
                                    type="button"
                                    className="ap-prog-b"
                                    onPointerDown={(ev) => ev.stopPropagation()}
                                    onClick={() => {
                                      setCreneau(m.titre);
                                      setFeuille("resa");
                                    }}
                                  >
                                    {m.action}
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ol>
                      </div>

                      <div className="ap-bloc">
                        <h3>Le commerce</h3>
                        <p className="ap-mot">{dessus.fiche.mot}</p>
                        <div className="ap-l">
                          <i aria-hidden="true">📍</i>
                          {dessus.fiche.ou} · {dessus.distance}
                        </div>
                        <div className="ap-l">
                          <i aria-hidden="true">🕘</i>
                          {dessus.fiche.horaires}
                        </div>
                        <a
                          className="ap-yaller"
                          href={dessus.itineraire}
                          target="_blank"
                          rel="noreferrer noopener"
                          onPointerDown={(ev) => ev.stopPropagation()}
                        >
                          🧭 Y aller
                        </a>
                      </div>
                    </div>
                  </div>

                  <span
                    className="ap-tampon non"
                    style={{ opacity: Math.min(1, Math.max(0, -dx / SEUIL)) }}
                    aria-hidden="true"
                  >
                    ✕
                  </span>
                  <span
                    className="ap-tampon oui"
                    style={{ opacity: Math.min(1, Math.max(0, dx / SEUIL)) }}
                    aria-hidden="true"
                  >
                    ♥
                  </span>
                  {!aJoue && !descendu && <span className="ap-doigt" aria-hidden="true">👆</span>}
                </div>
              </div>
            ) : (
              <div className="ap-vide">
                <span className="ap-vide-e" aria-hidden="true">
                  {dispo.length === 0 ? "🔎" : "✨"}
                </span>
                <b>
                  {dispo.length === 0
                    ? "Personne ne le propose là."
                    : gardees.length > 0
                      ? `${gardees.length} ${gardees.length > 1 ? "gardés" : "gardé"}`
                      : "Vous avez tout vu"}
                </b>
                <button type="button" className="ap-cta" onClick={remettre}>
                  ↻ Revoir
                </button>
              </div>
            )}
          </div>

          {coeurVole && <span className="ap-coeur" aria-hidden="true">♥</span>}

          <div className="cd-gestes ap-gestes">
            <button type="button" className="cd-g" onClick={() => partir("gauche")} disabled={!dessus}>
              <i aria-hidden="true">✕</i>
              <em>Passer</em>
            </button>
            <button
              type="button"
              className="cd-g grand"
              onClick={() => partir("droite")}
              disabled={!dessus}
            >
              <i aria-hidden="true">♥</i>
              <em>Je garde</em>
            </button>
            {/* SUR UNE RÉPONSE, LE BOUTON CHANGE DE SENS. On ne « réserve » pas
                une proposition qu'on vient de recevoir : on y va, et le
                commerçant qui l'a faite doit le savoir tout de suite. */}
            <button
              type="button"
              className="cd-g ambre"
              onClick={() => {
                if (dessus && estReponse(dessus)) {
                  setFeuille("jyvais");
                  return;
                }
                setCreneau("");
                setFeuille("resa");
              }}
              disabled={dessus && estReponse(dessus) ? false : !aReserver.length}
            >
              <i aria-hidden="true">{dessus && estReponse(dessus) ? "🚶" : "📅"}</i>
              <em>{dessus && estReponse(dessus) ? "J'y vais" : "Réserver"}</em>
            </button>
            <button type="button" className="cd-g" onClick={versLeBas} disabled={!dessus}>
              <i aria-hidden="true">↓</i>
              <em>Détails</em>
            </button>
          </div>

          {feuille && (
            <>
              <button
                type="button"
                className="ap-fond"
                aria-label="Fermer"
                onClick={() => setFeuille("")}
              />
              <div className="ap-feuille" role="dialog">
                <span className="ap-poignee" aria-hidden="true" />
                <button
                  type="button"
                  className="ap-f-x"
                  aria-label="Fermer"
                  onClick={() => setFeuille("")}
                >
                  ✕
                </button>

                {feuille === "metier" && (
                  <>
                    <div className="ap-f-tete">
                      <b>Autour de vous</b>
                    </div>
                    <ul className="ap-f-liste">
                      {METIERS.map((m) => (
                        <li key={m.cle}>
                          <button
                            type="button"
                            className={`ap-m${m.cle === branche ? " on" : ""}`}
                            onClick={() => {
                              setBranche(m.cle);
                              setEnvies([]);
                              remettre();
                              setFeuille("");
                            }}
                          >
                            <i aria-hidden="true">{m.emoji}</i>
                            <span>{m.label}</span>
                            <b>{comptes[m.cle]}</b>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {feuille === "sortie" && (
                  <>
                    <div className="ap-f-tete">
                      <b>{sortiePour ? "C'est pour quand ?" : "Vous sortez pour quoi ?"}</b>
                    </div>
                    <ul className="ap-f-liste">
                      {!sortiePour
                        ? SORTIES.map((x) => (
                            <li key={x.cle}>
                              <button
                                type="button"
                                className="ap-m"
                                onClick={() => setSortiePour(x.cle)}
                              >
                                <i aria-hidden="true">{x.emoji}</i>
                                <span>{x.label}</span>
                                <b>{autourDeMoi(heure, x.cle).length}</b>
                              </button>
                            </li>
                          ))
                        : QUANDS.map((q) => (
                            <li key={q}>
                              <button
                                type="button"
                                className="ap-m"
                                onClick={() => lancerSortie(sortiePour, q)}
                              >
                                <i aria-hidden="true">🕐</i>
                                <span>{q}</span>
                              </button>
                            </li>
                          ))}
                    </ul>
                  </>
                )}

                {feuille === "jyvais" && dessus && (
                  <>
                    {reserves.includes(`vais|${dessus.id}`) ? (
                      <div className="ap-r-ok">
                        <span aria-hidden="true">✓</span>
                        <b>Il vous attend.</b>
                        <i>
                          {dessus.nom} · {dessus.distance}
                        </i>
                        <a
                          className="ap-cta"
                          href={dessus.itineraire}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          🧭 Y aller
                        </a>
                      </div>
                    ) : (
                      <>
                        <div className="ap-f-tete">
                          <b>{dessus.nom}</b>
                          <span className="simple">{dessus.metier} · {dessus.distance}</span>
                        </div>
                        <div className="ap-f-corps">
                          <p className="ap-mot">« {dessus.reponse?.texte} »</p>
                          <div className="ap-l">
                            <i aria-hidden="true">⏳</i>
                            Tenu jusqu&apos;à {dessus.reponse?.tenu}
                          </div>
                        </div>
                        <div className="ap-f-deux">
                          <button
                            type="button"
                            className="ap-b2 plein"
                            onClick={() =>
                              setReserves((r) => {
                                const cle = `vais|${dessus.id}`;
                                return r.includes(cle) ? r : [...r, cle];
                              })
                            }
                          >
                            Je viens
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}

                {feuille === "resa" && dessus && (
                  <>
                    {reserves.includes(`${dessus.id}|${creneau}`) ? (
                      <div className="ap-r-ok">
                        <span aria-hidden="true">✓</span>
                        <b>C&apos;est réservé.</b>
                        <i>
                          {dessus.nom} · {creneau}
                        </i>
                        <button type="button" className="ap-cta" onClick={() => setFeuille("")}>
                          Revenir
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="ap-f-tete">
                          <b>{dessus.nom}</b>
                          <span className="simple">Quel moment&nbsp;?</span>
                        </div>
                        <ul className="ap-f-liste">
                          {aReserver.map((m) => (
                            <li key={m.titre}>
                              <button
                                type="button"
                                className={`ap-m${creneau === m.titre ? " on" : ""}`}
                                onClick={() => setCreneau(m.titre)}
                              >
                                <i aria-hidden="true">{m.icone}</i>
                                <span>
                                  {m.quand} — {m.titre}
                                  {m.prix ? ` · ${m.prix}` : ""}
                                </span>
                                <b>{m.places}</b>
                              </button>
                            </li>
                          ))}
                        </ul>
                        <div className="ap-f-deux">
                          <button
                            type="button"
                            className="ap-b2 plein"
                            disabled={!creneau}
                            onClick={() =>
                              setReserves((r) => {
                                const cle = `${dessus.id}|${creneau}`;
                                return r.includes(cle) ? r : [...r, cle];
                              })
                            }
                          >
                            Confirmer
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
           litteral de gabarit et un seul terminerait la chaine. */

        .ap{height:100dvh;overflow:hidden;background:#05090C;
          font-family:'Inter',system-ui,-apple-system,sans-serif;color:#EAF2EC;
          display:flex;align-items:center;justify-content:center;}
        .ap-tel{width:100%;height:100%;}
        .ap-app{position:relative;height:100%;display:flex;flex-direction:column;
          background:radial-gradient(120% 40% at 50% 0%,#13202C 0%,#080D0B 62%),#080D0B;}

        .ap-haut{flex:none;padding:10px 12px 0;display:flex;flex-direction:column;gap:8px;}
        .ap-haut .cd-barre{max-width:none;}

        .ap-metier{font:inherit;font-size:11.5px;font-weight:700;cursor:pointer;
          transition:transform .12s ease;}
        .ap-metier em{font-style:normal;font-size:10px;opacity:.65;margin-left:1px;}
        .ap-metier:active{transform:scale(.95);}
        .ap-fav{transition:transform .28s cubic-bezier(.34,1.5,.64,1);}
        .ap-fav.pop{transform:scale(1.18);}

        /* ── ANNONCER SA SORTIE ── */

        /* La pastille du geste principal ne se confond avec aucun filtre : elle
           est pleine, ambre, et toujours la premiere de la rangee. */
        .ap-sors{color:#0A1410!important;font-weight:850!important;border-color:transparent!important;
          background:linear-gradient(140deg,#F7C948,#E09B18)!important;
          box-shadow:0 10px 22px -12px rgba(240,180,41,.9);}

        .ap-sortie{display:flex;align-items:center;gap:9px;padding:9px 12px;
          background:rgba(240,180,41,.1);border:1px solid rgba(240,180,41,.32);
          border-radius:999px;}
        .ap-s-quoi{display:flex;align-items:center;gap:7px;flex:1;min-width:0;
          font-size:12.5px;font-weight:800;color:#F7C948;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .ap-s-quoi i{font-style:normal;font-size:14px;}
        .ap-s-etat{flex:none;font-size:11.5px;font-weight:850;color:#0A1410;
          background:#F7C948;border-radius:999px;padding:3px 9px;}
        .ap-s-x{flex:none;font:inherit;font-size:13px;line-height:1;cursor:pointer;
          color:#F0C05A;background:none;border:0;padding:2px 4px;}

        /* L'ecran d'envoi : ce qu'on regarde pendant que ca part. Les points
           s'allument un par un — un par commerce prevenu. */
        .ap-envoi{flex:1;display:flex;flex-direction:column;align-items:center;
          justify-content:center;gap:10px;text-align:center;padding:0 26px;
          border:1px dashed rgba(240,180,41,.3);border-radius:26px;
          background:rgba(240,180,41,.04);}
        .ap-envoi-e{font-size:40px;line-height:1;animation:apPulse 1.4s ease-in-out infinite;}
        @keyframes apPulse{0%,100%{transform:scale(1);opacity:.85;}50%{transform:scale(1.12);opacity:1;}}
        .ap-envoi b{font-size:20px;font-weight:850;color:#fff;letter-spacing:-.02em;}
        .ap-envoi i{font-style:normal;font-size:14px;color:#93A8A0;}
        .ap-points{display:flex;flex-wrap:wrap;justify-content:center;gap:7px;margin-top:8px;
          max-width:220px;}
        .ap-points span{width:9px;height:9px;border-radius:50%;background:rgba(240,180,41,.2);
          animation:apPoint 1.6s ease-in-out infinite;}
        @keyframes apPoint{0%,100%{background:rgba(240,180,41,.18);}50%{background:#F7C948;}}

        /* Une reponse ne ressemble pas a une annonce : elle est cerclee de vert
           et porte son propre bandeau. Sans ca, on la balaie sans voir qu'elle
           s'adressait a nous. */
        .ap-dessus.pour-vous .cd-carte{box-shadow:inset 0 0 0 2px #3DE2A6,
          0 0 40px -12px rgba(61,226,166,.55);}
        .ap-badge-vous{display:inline-flex;align-items:center;gap:7px;margin-top:11px;
          font-size:12px;font-weight:850;letter-spacing:.02em;color:#04150E;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);border-radius:999px;
          padding:8px 14px;}
        .ap-badge-vous i{font-style:normal;font-size:13px;}

        .ap-envies{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;
          margin:0 -12px;padding:1px 12px 2px;}
        .ap-envies::-webkit-scrollbar{display:none;}
        .ap-e{flex:none;display:inline-flex;align-items:center;gap:6px;font:inherit;
          font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap;color:#B9C6CE;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.11);
          border-radius:999px;padding:8px 13px;
          transition:transform .12s ease,background .25s ease,color .25s ease;}
        .ap-e i{font-style:normal;font-size:13px;}
        .ap-e:active{transform:scale(.94);}
        .ap-e.on{color:#04150E;font-weight:850;border-color:transparent;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);}

        /* LA CARTE PREND TOUTE LA PLACE. Plus de rapport 3/4,15 impose : c'est
           la proportion d'un encart dans une page, pas celle d'un ecran. */
        .ap-vue{flex:1;min-height:0;display:flex;padding:8px 12px 0;}
        .ap-pile{position:relative;flex:1;min-height:0;}
        .ap-carte{position:absolute;inset:0;max-width:none;}
        .ap-carte.dessous{transform:scale(.955) translateY(9px);filter:brightness(.7);}
        .ap-dessus{position:absolute;inset:0;touch-action:pan-y;cursor:grab;
          will-change:transform;}
        .ap-dessus:active{cursor:grabbing;}
        .ap-dessus.vole{transition:transform ${VOL_MS}ms cubic-bezier(.4,0,.6,1),opacity ${VOL_MS}ms ease;
          opacity:0;}
        .ap-dessus.vole.droite{transform:translate3d(420px,-30px,0) rotate(17deg)!important;}
        .ap-dessus.vole.gauche{transform:translate3d(-420px,-30px,0) rotate(-17deg)!important;}

        /* LE DEFILEMENT EST DANS LA CARTE. overscroll-behavior empeche le
           mouvement de se propager a la page quand on arrive au bout. */
        .ap-scroll{height:100%;overflow-y:auto;overscroll-behavior:contain;
          border-radius:26px;scrollbar-width:none;}
        .ap-scroll::-webkit-scrollbar{display:none;}
        .ap-un{height:100%;position:relative;}
        .ap-un .cd-carte{position:absolute;inset:0;aspect-ratio:auto;max-width:none;}

        /* L'INDICE DE DEFILEMENT. Sans lui, personne ne devine que la carte
           continue : Happn a la meme pastille, au meme endroit. */
        .ap-vers-bas{display:inline-flex;align-items:center;gap:7px;margin-top:11px;
          font:inherit;font-size:12.5px;font-weight:750;color:#EAF2EC;cursor:pointer;
          background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.18);
          border-radius:999px;padding:8px 14px;
          -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
          animation:apRespire 2.6s ease-in-out infinite;}
        .ap-vers-bas i{font-style:normal;font-size:14px;line-height:1;}
        @keyframes apRespire{
          0%,100%{transform:translateY(0);}
          50%{transform:translateY(3px);}
        }

        /* ── SOUS LE PLI ── */
        /* LE PANNEAU EST OPAQUE, et ce n'est pas cosmetique : sans fond, la
           carte SUIVANTE — posee derriere celle qu'on lit — transparaissait a
           travers le programme, et deux commerces se superposaient. */
        .ap-plus{position:relative;background:#0A1210;padding:14px 0 24px;
          display:flex;flex-direction:column;gap:12px;}
        .ap-bloc{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);
          border-radius:20px;padding:16px;}
        .ap-bloc h3{margin:0 0 12px;font-size:11px;font-weight:850;letter-spacing:.14em;
          text-transform:uppercase;color:#7F988B;}

        .ap-prog{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px;}
        .ap-prog li{padding:13px 0;border-top:1px solid rgba(255,255,255,.08);}
        .ap-prog li:first-child{border-top:0;padding-top:0;}
        /* Le moment en cours se distingue par une barre, pas par une couleur de
           fond : la liste doit rester lisible d'un coup d'oeil. */
        .ap-prog li.on{border-left:3px solid #3DE2A6;padding-left:12px;margin-left:-15px;}
        .ap-prog-h{display:flex;align-items:center;gap:8px;margin-bottom:5px;}
        .ap-prog-h b{font-size:12px;font-weight:850;letter-spacing:.08em;color:#F0B429;
          font-variant-numeric:tabular-nums;}
        .ap-live{font-size:9.5px;font-weight:850;letter-spacing:.1em;text-transform:uppercase;
          color:#04150E;background:#3DE2A6;border-radius:5px;padding:2px 6px;}
        .ap-prog-t{display:flex;align-items:center;gap:8px;font-size:17px;font-weight:850;
          letter-spacing:-.02em;color:#fff;}
        .ap-prog-t i{font-style:normal;font-size:16px;}
        .ap-prog-l{display:flex;flex-direction:column;margin-top:4px;font-size:14px;
          line-height:1.45;color:#93A8A0;}
        .ap-prog-p{display:flex;align-items:baseline;flex-wrap:wrap;gap:9px;margin-top:7px;}
        .ap-prog-p b{font-size:20px;font-weight:850;color:#3DE2A6;letter-spacing:-.02em;}
        .ap-prog-p s{font-size:13px;color:#6C8078;}
        .ap-prog-p em{font-style:normal;font-size:10.5px;font-weight:850;letter-spacing:.08em;
          color:#0A1410;background:#F0B429;border-radius:5px;padding:3px 7px;}
        .ap-prog-p span{font-size:12px;color:#7F988B;}

        .ap-prog-av{margin-top:10px;padding:9px 11px;border-radius:12px;
          background:rgba(255,255,255,.05);}
        .ap-prog-av-h{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#B9C6CE;}
        .ap-prog-av-h b{font-weight:850;color:#fff;}
        .ap-prog-av p{margin:6px 0 0;font-size:13px;line-height:1.4;color:#93A8A0;}
        .ap-prog-av p b{color:#C7D8CE;font-weight:800;margin-right:4px;}

        .ap-noter{display:flex;align-items:center;gap:2px;margin-top:9px;}
        .ap-n{font:inherit;font-size:20px;line-height:1;cursor:pointer;background:none;
          border:0;padding:0 1px;color:rgba(255,255,255,.2);
          transition:color .18s ease,transform .18s cubic-bezier(.34,1.4,.64,1);}
        .ap-n.on{color:#F0B429;transform:scale(1.06);}
        .ap-noter span{margin-left:8px;font-size:11.5px;color:#6C8078;}

        .ap-prog-b{margin-top:11px;font:inherit;font-size:14px;font-weight:850;color:#0A1410;
          border:0;border-radius:12px;padding:12px 20px;cursor:pointer;
          background:linear-gradient(140deg,#F7C948,#E09B18);}
        .ap-prog-b:active{transform:scale(.97);}

        .ap-mot{margin:0 0 12px;font-size:14.5px;line-height:1.5;color:#C7D8CE;}
        .ap-l{display:flex;align-items:flex-start;gap:9px;font-size:13.5px;line-height:1.45;
          color:#B9C6CE;padding:8px 0;border-top:1px solid rgba(255,255,255,.08);}
        .ap-l i{font-style:normal;font-size:14px;flex:none;}
        .ap-yaller{display:inline-flex;align-items:center;gap:7px;margin-top:12px;
          font-size:14px;font-weight:850;color:#EAF2EC;text-decoration:none;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);
          border-radius:12px;padding:12px 18px;}

        .ap-tampon{position:absolute;top:26px;font-size:34px;font-weight:900;line-height:1;
          border:4px solid currentColor;border-radius:14px;padding:8px 16px;pointer-events:none;}
        .ap-tampon.non{right:20px;color:#FF6B6B;transform:rotate(15deg);}
        .ap-tampon.oui{left:20px;color:#3DE2A6;transform:rotate(-15deg);}

        .ap-doigt{position:absolute;left:50%;margin-left:-16px;top:26%;z-index:3;font-size:32px;
          pointer-events:none;filter:drop-shadow(0 4px 10px rgba(0,0,0,.7));
          animation:apDoigt 2.4s ease-in-out infinite;}
        @keyframes apDoigt{
          0%,100%{transform:translate3d(0,0,0);opacity:.35;}
          25%{transform:translate3d(-46px,0,0);opacity:1;}
          55%{transform:translate3d(38px,0,0);opacity:1;}
          80%{transform:translate3d(0,0,0);opacity:.35;}
        }

        /* Le coeur vise la pastille des favoris : on anime la position, pas une
           translation en pixels, pour que l'arrivee tombe juste sur tous les
           formats. */
        .ap-coeur{position:absolute;left:50%;top:55%;z-index:7;font-size:44px;color:#3DE2A6;
          pointer-events:none;filter:drop-shadow(0 6px 18px rgba(18,185,129,.7));
          animation:apCoeur ${COEUR_MS}ms cubic-bezier(.5,0,.35,1) forwards;}
        @keyframes apCoeur{
          0%{left:50%;top:55%;transform:translate(-50%,-50%) scale(.4);opacity:0;}
          22%{left:50%;top:55%;transform:translate(-50%,-50%) scale(1.25);opacity:1;}
          100%{left:calc(100% - 30px);top:34px;transform:translate(-50%,-50%) scale(.3);opacity:.1;}
        }

        .ap-vide{flex:1;display:flex;flex-direction:column;align-items:center;
          justify-content:center;gap:11px;text-align:center;padding:0 24px;
          border:1px dashed rgba(255,255,255,.15);border-radius:26px;}
        .ap-vide-e{font-size:34px;line-height:1;}
        .ap-vide b{font-size:20px;font-weight:850;color:#fff;letter-spacing:-.02em;}
        .ap-cta{font:inherit;font-size:15px;font-weight:850;color:#04150E;border:0;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);border-radius:999px;
          padding:13px 24px;cursor:pointer;box-shadow:0 14px 30px -14px rgba(18,185,129,.9);}

        .ap-et{display:inline-flex;gap:1px;font-size:11px;line-height:1;}
        .ap-et i{font-style:normal;color:rgba(255,255,255,.25);}
        .ap-et i.on{color:#F0B429;}

        .ap-gestes{flex:none;gap:14px;margin:6px 0 max(12px, env(safe-area-inset-bottom));}
        .ap-gestes .cd-g{font:inherit;background:none;border:0;padding:0;cursor:pointer;}
        .ap-gestes .cd-g:active i{transform:scale(.92);}
        .ap-gestes .cd-g:disabled{cursor:default;opacity:.32;}
        .ap-gestes .cd-g:disabled:active i{transform:none;}
        .ap-gestes .cd-g:focus-visible{outline:2px solid #3DE2A6;outline-offset:4px;border-radius:12px;}
        /* Reserver est la seule action qui engage : ambre, parce que le vert est
           deja celui du balayage et que deux boutons verts se confondent. */
        .ap-gestes .cd-g.ambre i{color:#0A1410;border:0;
          background:linear-gradient(140deg,#F7C948,#E09B18);
          box-shadow:0 12px 26px -14px rgba(240,180,41,.9);}
        .ap-gestes .cd-g.ambre em{color:#F0C05A;}

        /* ── LES DEUX FEUILLES QUI RESTENT ── */
        .ap-fond{position:absolute;inset:0;z-index:8;border:0;padding:0;cursor:pointer;
          background:rgba(3,7,6,.7);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);
          animation:apFond .25s ease;}
        @keyframes apFond{from{opacity:0;}to{opacity:1;}}
        .ap-feuille{position:absolute;left:0;right:0;bottom:0;z-index:9;
          max-height:86%;display:flex;flex-direction:column;
          background:#0E1714;border-top:1px solid rgba(255,255,255,.13);
          border-radius:22px 22px 0 0;padding:8px 16px max(16px, env(safe-area-inset-bottom));
          box-shadow:0 -24px 60px -20px rgba(0,0,0,.9);
          animation:apMonte .32s cubic-bezier(.16,1,.3,1);}
        @keyframes apMonte{from{transform:translate3d(0,100%,0);}to{transform:none;}}
        .ap-poignee{align-self:center;width:38px;height:4px;border-radius:999px;
          background:rgba(255,255,255,.22);margin-bottom:12px;}
        .ap-f-x{position:absolute;top:14px;right:12px;width:32px;height:32px;font:inherit;
          font-size:15px;line-height:1;cursor:pointer;color:#B9C6CE;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);
          border-radius:50%;}
        .ap-f-tete{flex:none;margin-bottom:12px;padding-right:40px;}
        .ap-f-tete b{display:block;font-size:19px;font-weight:850;color:#fff;
          letter-spacing:-.02em;}
        .ap-f-tete span.simple{display:block;margin-top:4px;font-size:13px;color:#93A8A0;}
        .ap-f-liste{flex:1;min-height:0;overflow-y:auto;list-style:none;margin:0;padding:0;}

        .ap-m{width:100%;display:flex;align-items:center;gap:12px;font:inherit;font-size:15px;
          font-weight:750;color:#EAF2EC;cursor:pointer;text-align:left;
          background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
          border-radius:14px;padding:13px 14px;margin-bottom:8px;
          transition:transform .12s ease,border-color .25s ease,background .25s ease;}
        .ap-m i{font-style:normal;font-size:19px;line-height:1;}
        .ap-m span{flex:1;min-width:0;}
        .ap-m b{font-size:13px;font-weight:850;color:#7F988B;font-variant-numeric:tabular-nums;}
        .ap-m:active{transform:scale(.98);}
        .ap-m.on{border-color:rgba(61,226,166,.45);background:rgba(61,226,166,.12);}
        .ap-m.on b{color:#8FE9C4;}

        .ap-f-deux{flex:none;display:flex;gap:9px;margin-top:10px;padding-top:12px;
          border-top:1px solid rgba(255,255,255,.1);}
        .ap-b2{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;
          font:inherit;font-size:15px;font-weight:850;cursor:pointer;
          color:#EAF2EC;background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.13);border-radius:14px;padding:14px 10px;}
        .ap-b2.plein{color:#0A1410;border-color:transparent;
          background:linear-gradient(140deg,#F7C948,#E09B18);}
        .ap-b2.plein:disabled{opacity:.35;cursor:default;}

        .ap-r-ok{display:flex;flex-direction:column;align-items:center;justify-content:center;
          gap:9px;text-align:center;padding:22px 10px 10px;
          animation:apOk .4s cubic-bezier(.16,1,.3,1);}
        @keyframes apOk{from{opacity:0;transform:scale(.94);}to{opacity:1;transform:none;}}
        .ap-r-ok span{font-size:34px;color:#8FE9C4;line-height:1;}
        .ap-r-ok b{font-size:21px;font-weight:850;color:#fff;letter-spacing:-.02em;}
        .ap-r-ok i{font-style:normal;font-size:14px;color:#93A8A0;}

        @media (min-width:720px){
          .ap{padding:24px;background:radial-gradient(90% 60% at 50% 0%,#101A22,#05090C 70%),#05090C;}
          .ap-tel{width:390px;height:min(844px, calc(100dvh - 48px));
            border:1px solid rgba(255,255,255,.14);border-radius:42px;padding:9px;
            background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.01));
            box-shadow:0 0 0 1px rgba(0,0,0,.6),0 50px 90px -40px rgba(0,0,0,.95);}
          .ap-app{border-radius:34px;overflow:hidden;}
        }
        @media (prefers-reduced-motion:reduce){
          .ap-doigt,.ap-vers-bas,.ap-envoi-e,.ap-points span{animation:none;}
          .ap-dessus.vole{transition-duration:.01ms;}
          .ap-feuille,.ap-fond,.ap-coeur,.ap-r-ok{animation:none;}
          .ap-coeur{display:none;}
        }
      `,
        }}
      />
    </div>
  );
}
