"use client";

// L'APPLICATION, TELLE QU'ELLE SERAIT — un seul écran, rien à lire.
//
// CE QUE C'EST. Une maquette jouable de ce que verrait un habitant. Elle sert à
// savoir si l'idée lui parle avant qu'on la construise. Ce qu'elle met en scène
// et qui n'existe pas encore est listé en tête de `lib/direct/apercu-habitant.ts`
// — et NULLE PART à l'écran : les gens à qui on la montre savent déjà que c'est
// un essai, le leur répéter dans un bandeau ne fait que les mettre en position
// de juger une démonstration au lieu d'essayer une application.
//
// TROIS RÈGLES :
//
//  1. UN ÉCRAN, PLEIN CADRE, QUI NE DÉFILE PAS. Tout tient dans la hauteur du
//     téléphone. On ne fait jamais défiler une application de swipe.
//  2. TOUT SE PASSE DANS L'APPLICATION. Le choix du métier est une pastille du
//     bandeau, les envies une rangée sous elle, les détails et la réservation
//     des feuilles qui montent par-dessus. Rien ne vit « dans la page ».
//  3. AUCUNE PHRASE EXPLICATIVE. Le seul texte hors carte : le métier choisi,
//     les pastilles d'envie, une ligne de comptage, quatre gestes.
//
// CE QUI A ÉTÉ RETIRÉ POUR GAGNER DE LA PLACE. Les onglets « Maintenant / Ce
// soir » prenaient une rangée entière pour dire ce qu'une application dit
// gratuitement : ce qu'on voit, c'est ce qui se passe MAINTENANT. L'heure
// vient de l'horloge du visiteur, et les cinquante pixels sont passés à la
// carte.
import { useRef, useState, useSyncExternalStore } from "react";
import { CarteSwipe, StylesDirect } from "@/components/direct/carte-swipe";
import {
  ENVIES,
  HEURE_MAX,
  HEURE_MIN,
  METIERS,
  autourDeMoi,
  comptesParMetier,
  moyenneAvis,
  selonEnvies,
  type AvisPlat,
  type CarteAutour,
  type CleMetier,
} from "@/lib/direct/apercu-habitant";
import { MARQUE } from "@/lib/marque";

/** Au-delà de cette distance en pixels, le doigt a décidé : la carte part. */
const SEUIL = 84;
/** La durée de l'envol, la même qu'en CSS. */
const VOL_MS = 420;
/** La durée du vol du cœur vers les favoris, la même qu'en CSS. */
const COEUR_MS = 900;

// ── LES AVIS QUE LE VISITEUR LAISSE, GARDÉS DANS SON NAVIGATEUR ────────────
//
// C'est ce qui rend la démonstration crédible : il note un plat, il ferme, il
// revient — son avis est toujours là, au-dessus de ceux des autres. Sans ça,
// « les avis sont mémorisés » reste une phrase.
//
// `useSyncExternalStore` plutôt qu'un effet : le stockage local n'existe pas
// côté serveur, et lire pendant le rendu casserait l'hydratation. L'instantané
// serveur est vide, le client charge une fois, et les écritures préviennent les
// abonnés. Lecture et écriture sous `try` — la navigation privée refuse les
// deux, et la page doit continuer.
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
function ajouterAvis(id: string, avis: AvisPlat) {
  const avant = chargerAvis();
  memoire = { ...avant, [id]: [avis, ...(avant[id] ?? [])] };
  try {
    window.localStorage.setItem(CLE_LOCALE, JSON.stringify(memoire));
  } catch {
    /* Refusé : l'avis vit quand même le temps de la visite. */
  }
  abonnes.forEach((f) => f());
}

/** Les étoiles, en lecture seule. */
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

/** Le nom de ce qu'on note, selon le métier — un plat se goûte, pas une coupe. */
function motAvis(c: CarteAutour): string {
  return c.branche === "restaurant" || c.branche === "bar" ? "avis sur le plat" : "avis";
}

type Feuille = "" | "metier" | "avis" | "pro" | "resa";

export function ApercuHabitant() {
  // L'HEURE DU VISITEUR, SANS CASSER L'HYDRATATION. Le serveur ne connaît pas
  // son fuseau : rendre `new Date().getHours()` des deux côtés produit deux
  // HTML différents. Instantané serveur à midi, instantané client réel.
  const heureVraie = useSyncExternalStore(
    () => () => {},
    () => new Date().getHours(),
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
  const [alerte, setAlerte] = useState(false);
  const [coeurVole, setCoeurVole] = useState(false);
  const [feuille, setFeuille] = useState<Feuille>("");
  const [maNote, setMaNote] = useState(0);
  const [monMot, setMonMot] = useState("");
  const [creneau, setCreneau] = useState("");
  const prise = useRef<{ x0: number } | null>(null);
  const minuteries = useRef<number[]>([]);

  const miens = useSyncExternalStore(abonnerAvis, chargerAvis, () => VIDE);
  /** Les avis d'un plat : les siens d'abord, puis ceux déjà là. */
  const avisDe = (c: CarteAutour): AvisPlat[] => [...(miens[c.id] ?? []), ...(c.avis ?? [])];

  const dispo = selonEnvies(autourDeMoi(heure, branche), envies);
  const pile = dispo.filter((c) => !passees.includes(c.id));
  const dessus = pile[0];
  const dessous = pile[1];
  const comptes = comptesParMetier(heure);
  const metier = METIERS.find((m) => m.cle === branche) ?? METIERS[0];

  /** Remet le paquet à zéro. Tout changement de filtre est un nouveau paquet. */
  function remettre() {
    minuteries.current.forEach(clearTimeout);
    minuteries.current = [];
    setPassees([]);
    setDx(0);
    setSortant("");
    setAlerte(false);
    setCoeurVole(false);
  }

  function partir(sens: "gauche" | "droite") {
    if (!dessus || sortant) return;
    setAJoue(true);
    setSortant(sens);
    setDx(sens === "droite" ? 420 : -420);
    const id = dessus.id;
    // LE CŒUR PART AVANT LA CARTE, pas après : c'est ce qui fait comprendre que
    // le geste RANGE quelque chose quelque part. Sans le trajet, le compteur
    // en haut à droite change tout seul et personne ne fait le lien.
    if (sens === "droite") setCoeurVole(true);
    minuteries.current.push(
      window.setTimeout(() => {
        if (sens === "droite") setGardees((g) => (g.includes(id) ? g : [...g, id]));
        setPassees((p) => [...p, id]);
        setDx(0);
        setSortant("");
      }, VOL_MS),
    );
    if (sens === "droite") {
      minuteries.current.push(window.setTimeout(() => setCoeurVole(false), COEUR_MS));
    }
  }

  function ouvrir(f: Feuille) {
    setFeuille(f);
    setMaNote(0);
    setMonMot("");
    setCreneau("");
  }

  const plusProche = dispo.length ? Math.min(...dispo.map((c) => c.metres)) : 0;
  const listeEnvies = ENVIES[branche];

  return (
    <div className="ap">
      <StylesDirect />
      <div className="ap-tel">
        <div className="ap-app">
          <div className="ap-haut">
            {/* LE BANDEAU EST CELUI DU PRODUIT — mêmes classes, donc même
                allure — mais ses pastilles sont ici de vrais boutons. On ne
                monte donc pas `BarreDirect`, qui ne rend que du texte : le
                choix du métier et les favoris doivent réagir au doigt. */}
            <div className="cd-barre">
              <span className="cd-marque">{MARQUE}</span>
              <button
                type="button"
                className="cd-puce ap-metier"
                onClick={() => ouvrir("metier")}
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
              <span
                className={`cd-puce vert ap-fav${coeurVole ? " pop" : ""}`}
                id="ap-favoris"
              >
                <i aria-hidden="true">💚</i>
                <b>{gardees.length}</b>
              </span>
            </div>

            {/* LES ENVIES SONT DANS L'APPLICATION, et elles CHANGENT AVEC LE
                MÉTIER : on ne cherche pas « à emporter » chez un coiffeur. La
                rangée déborde volontairement du bord droit, c'est ce qui dit
                qu'il y en a d'autres sans avoir à l'écrire. */}
            <div className="ap-envies">
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

            <div className="ap-compte" aria-live="polite">
              {dispo.length > 0 ? (
                <>
                  <b>{dispo.length}</b> autour de vous · la plus proche à {plusProche} m
                </>
              ) : (
                <>Rien qui corresponde</>
              )}
            </div>
          </div>

          <div className="ap-vue">
            {dessus ? (
              <div className="ap-pile">
                {dessous && (
                  <CarteSwipe key={`d-${dessous.id}`} carte={dessous} className="ap-carte dessous" />
                )}
                {!aJoue && <span className="ap-doigt" aria-hidden="true">👆</span>}
                <div
                  className={`ap-dessus${sortant ? ` vole ${sortant}` : ""}`}
                  style={{ transform: `translate3d(${dx}px,0,0) rotate(${dx * 0.045}deg)` }}
                  onPointerDown={(e) => {
                    if (sortant) return;
                    prise.current = { x0: e.clientX };
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (!prise.current) return;
                    setDx(e.clientX - prise.current.x0);
                  }}
                  onPointerUp={() => {
                    if (!prise.current) return;
                    prise.current = null;
                    if (dx > SEUIL) partir("droite");
                    else if (dx < -SEUIL) partir("gauche");
                    else setDx(0);
                  }}
                  onPointerCancel={() => {
                    prise.current = null;
                    setDx(0);
                  }}
                >
                  <CarteSwipe key={dessus.id} carte={dessus} className="ap-carte">
                    {/* LES AVIS, sur la carte elle-même. `stopPropagation` sur
                        le pointeur est indispensable : sans lui, le doigt qui
                        appuie commence un balayage et on ne peut jamais
                        l'ouvrir au toucher. La ligne n'est posée que sur la
                        carte du DESSUS — sur celle de derrière, à moitié
                        cachée, ce serait un bouton invisible et cliquable. */}
                    {!!dessus.avis?.length && (
                      <button
                        type="button"
                        className="ap-avis-l"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => ouvrir("avis")}
                      >
                        <Etoiles note={moyenneAvis(avisDe(dessus))} />
                        <b>{moyenneAvis(avisDe(dessus)).toString().replace(".", ",")}</b>
                        <span>
                          · {avisDe(dessus).length} {motAvis(dessus)}
                        </span>
                        <i aria-hidden="true">›</i>
                      </button>
                    )}
                  </CarteSwipe>
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
                </div>
              </div>
            ) : (
              /* DEUX ÉCRANS VIDES, PAS UN. « Aucun résultat » et « vous avez
                 tout vu » ne demandent pas la même chose : le premier appelle
                 une alerte, le second un retour en arrière. */
              <div className="ap-vide">
                {dispo.length === 0 ? (
                  alerte ? (
                    <>
                      <span className="ap-vide-e" aria-hidden="true">✓</span>
                      <b>On vous préviendra.</b>
                      <i>Dès que quelqu&apos;un le propose autour de vous.</i>
                    </>
                  ) : (
                    <>
                      <span className="ap-vide-e" aria-hidden="true">🔎</span>
                      <b>Personne ne le propose là.</b>
                      <button type="button" className="ap-cta" onClick={() => setAlerte(true)}>
                        🔔 Prévenez-moi
                      </button>
                    </>
                  )
                ) : (
                  <>
                    <span className="ap-vide-e" aria-hidden="true">✨</span>
                    <b>
                      {gardees.length > 0
                        ? `${gardees.length} ${gardees.length > 1 ? "gardées" : "gardée"}`
                        : "Vous avez tout vu"}
                    </b>
                    <button type="button" className="ap-cta" onClick={remettre}>
                      ↻ Revoir
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* LE CŒUR QUI PART SE RANGER. C'est le trajet qui explique la
              fonction : sans lui, le compteur du bandeau passerait de 1 à 2
              dans un coin et personne ne ferait le lien. */}
          {coeurVole && <span className="ap-coeur" aria-hidden="true">♥</span>}

          {/* QUATRE GESTES. Le grand du milieu reste « Je garde » : c'est lui
              que le balayage vers la droite déclenche, et déplacer cette
              correspondance rendrait le geste illisible. « Réserver » prend la
              place suivante, en ambre, parce que c'est la seule action qui
              engage vraiment — et « Le pro » ouvre la fiche au lieu de ne rien
              faire. */}
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
            <button
              type="button"
              className="cd-g ambre"
              onClick={() => ouvrir("resa")}
              disabled={!dessus?.creneaux?.length}
            >
              <i aria-hidden="true">📅</i>
              <em>Réserver</em>
            </button>
            <button type="button" className="cd-g" onClick={() => ouvrir("pro")} disabled={!dessus}>
              <i aria-hidden="true">↑</i>
              <em>Le pro</em>
            </button>
          </div>

          {/* ── LES FEUILLES ──
              Elles montent par-dessus l'application, DANS le cadre du
              téléphone : sur ordinateur elles restent dans l'appareil. Une
              seule à la fois, une seule variable d'état. */}
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
                    <ul className="ap-f-liste sans-trait">
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

                {feuille === "avis" && dessus && (
                  <>
                    <div className="ap-f-tete">
                      <b>{dessus.lignes?.[0] ?? dessus.quoi}</b>
                      <span>
                        <Etoiles note={moyenneAvis(avisDe(dessus))} />
                        {moyenneAvis(avisDe(dessus)).toString().replace(".", ",")} ·{" "}
                        {avisDe(dessus).length} avis
                      </span>
                      {/* LA LIGNE QUI PORTE TOUTE L'IDÉE : les avis suivent le
                          plat, pas l'annonce du jour. Six mots, pas une
                          explication. */}
                      <i>Sur ce plat, à chaque fois qu&apos;il revient.</i>
                    </div>
                    <ul className="ap-f-liste">
                      {avisDe(dessus).map((a, n) => (
                        <li key={`${a.qui}-${a.quand}-${n}`}>
                          <div className="ap-f-h">
                            <Etoiles note={a.note} />
                            <b>{a.qui}</b>
                            <span>{a.quand}</span>
                          </div>
                          {a.texte && <p>{a.texte}</p>}
                        </li>
                      ))}
                    </ul>
                    <form
                      className="ap-f-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!maNote) return;
                        ajouterAvis(dessus.id, {
                          note: maNote,
                          texte: monMot.trim(),
                          qui: "Vous",
                          quand: "à l'instant",
                        });
                        setMaNote(0);
                        setMonMot("");
                      }}
                    >
                      <div className="ap-f-notes">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className={`ap-f-n${n <= maNote ? " on" : ""}`}
                            aria-label={`${n} sur 5`}
                            onClick={() => setMaNote(n)}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <div className="ap-f-saisie">
                        <input
                          value={monMot}
                          onChange={(e) => setMonMot(e.target.value)}
                          maxLength={90}
                          placeholder="Un mot ?"
                          aria-label="Votre avis en une phrase"
                        />
                        <button type="submit" disabled={!maNote}>
                          Envoyer
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {feuille === "pro" && dessus && (
                  <>
                    <div className="ap-f-tete">
                      <b>{dessus.nom}</b>
                      <span className="simple">
                        {dessus.metier} · {dessus.distance}
                      </span>
                    </div>
                    <div className="ap-f-corps">
                      {dessus.fiche && (
                        <>
                          <p className="ap-p-mot">{dessus.fiche.mot}</p>
                          <div className="ap-p-l">
                            <i aria-hidden="true">📍</i>
                            {dessus.fiche.ou}
                          </div>
                          <div className="ap-p-l">
                            <i aria-hidden="true">🕘</i>
                            {dessus.fiche.horaires}
                          </div>
                        </>
                      )}
                      <div className="ap-p-l">
                        <i aria-hidden="true">{dessus.icone}</i>
                        {dessus.quoi}
                        {dessus.prix ? ` · ${dessus.prix}` : ""}
                      </div>
                      {!!avisDe(dessus).length && (
                        <button type="button" className="ap-p-avis" onClick={() => ouvrir("avis")}>
                          <Etoiles note={moyenneAvis(avisDe(dessus))} />
                          {moyenneAvis(avisDe(dessus)).toString().replace(".", ",")} ·{" "}
                          {avisDe(dessus).length} {motAvis(dessus)}
                          <i aria-hidden="true">›</i>
                        </button>
                      )}
                    </div>
                    <div className="ap-f-deux">
                      <a
                        className="ap-b2"
                        href={dessus.itineraire}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        🧭 Y aller
                      </a>
                      <button
                        type="button"
                        className="ap-b2 plein"
                        onClick={() => ouvrir("resa")}
                        disabled={!dessus.creneaux?.length}
                      >
                        📅 Réserver
                      </button>
                    </div>
                  </>
                )}

                {feuille === "resa" && dessus && (
                  <>
                    {reserves.includes(dessus.id) ? (
                      <div className="ap-r-ok">
                        <span aria-hidden="true">✓</span>
                        <b>C&apos;est réservé.</b>
                        <i>
                          {dessus.nom} · {creneau || dessus.creneaux?.[0]}
                        </i>
                        <button type="button" className="ap-cta" onClick={() => setFeuille("")}>
                          Revenir
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="ap-f-tete">
                          <b>{dessus.quoi}</b>
                          <span className="simple">
                            {dessus.nom} · {dessus.distance}
                            {dessus.prix ? ` · ${dessus.prix}` : ""}
                          </span>
                        </div>
                        <div className="ap-f-corps">
                          <div className="ap-r-cren">
                            {dessus.creneaux?.map((h) => (
                              <button
                                key={h}
                                type="button"
                                aria-pressed={creneau === h}
                                className={`ap-r-c${creneau === h ? " on" : ""}`}
                                onClick={() => setCreneau(h)}
                              >
                                {h}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="ap-f-deux">
                          <button
                            type="button"
                            className="ap-b2 plein seul"
                            disabled={!creneau}
                            onClick={() =>
                              setReserves((r) =>
                                r.includes(dessus.id) ? r : [...r, dessus.id],
                              )
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

        /* L'ECRAN NE DEFILE PAS. Une application de swipe qui defile n'en est
           pas une : le doigt ne sait plus s'il tire la carte ou la page. */
        .ap{height:100dvh;overflow:hidden;background:#05090C;
          font-family:'Inter',system-ui,-apple-system,sans-serif;color:#EAF2EC;
          display:flex;align-items:center;justify-content:center;}
        .ap-tel{width:100%;height:100%;}
        .ap-app{position:relative;height:100%;display:flex;flex-direction:column;
          background:radial-gradient(120% 40% at 50% 0%,#13202C 0%,#080D0B 62%),#080D0B;}

        .ap-haut{flex:none;padding:10px 12px 0;display:flex;flex-direction:column;gap:8px;}
        .ap-haut .cd-barre{max-width:none;}

        /* La pastille du metier est un bouton : c'est par elle qu'on change de
           branche, et le chevron est ce qui le dit. */
        .ap-metier{font:inherit;font-size:11.5px;font-weight:700;cursor:pointer;
          transition:transform .12s ease,border-color .25s ease;}
        .ap-metier em{font-style:normal;font-size:10px;opacity:.65;margin-left:1px;}
        .ap-metier:active{transform:scale(.95);}
        /* La pastille des favoris grossit quand le coeur y arrive. */
        .ap-fav{transition:transform .28s cubic-bezier(.34,1.5,.64,1);}
        .ap-fav.pop{transform:scale(1.18);}

        .ap-envies{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;
          margin:0 -12px;padding:1px 12px 2px;}
        .ap-envies::-webkit-scrollbar{display:none;}
        .ap-e{flex:none;display:inline-flex;align-items:center;gap:6px;font:inherit;
          font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap;color:#B9C6CE;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.11);
          border-radius:999px;padding:8px 13px;
          transition:transform .12s ease,background .25s ease,border-color .25s ease,color .25s ease;}
        .ap-e i{font-style:normal;font-size:13px;}
        .ap-e:active{transform:scale(.94);}
        .ap-e.on{color:#04150E;font-weight:850;border-color:transparent;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);}

        .ap-compte{font-size:11.5px;color:#7F988B;font-variant-numeric:tabular-nums;}
        .ap-compte b{color:#EAF2EC;font-weight:850;}

        /* LA CARTE PREND TOUTE LA PLACE QUI RESTE, en gardant ses proportions.
           La place restante se MESURE (requete de conteneur) au lieu de se
           deviner : une constante juste sur un ecran de 860 px en sur-reservait
           48 sur un 640. Le calcul en dur reste comme repli. */
        .ap-vue{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;
          padding:8px 14px;--dispo:calc(100dvh - 300px);}
        .ap-pile,.ap-vide{position:relative;
          width:min(100%, calc(var(--dispo) * 3 / 4.15));
          aspect-ratio:3/4.15;}
        @supports (container-type:size){
          .ap-vue{container-type:size;}
          .ap-pile,.ap-vide{width:min(100cqw, calc(100cqh * 3 / 4.15));}
        }
        .ap-pile{overflow:hidden;border-radius:26px;}
        .ap-carte{position:absolute;left:0;right:0;top:0;margin-inline:auto;}
        .ap-pile .ap-carte{max-width:none;}
        .ap-carte.dessous{transform:scale(.955) translateY(9px);filter:brightness(.72);}
        .ap-dessus{position:absolute;inset:0;touch-action:pan-y;cursor:grab;will-change:transform;}
        .ap-dessus:active{cursor:grabbing;}
        .ap-dessus.vole{transition:transform ${VOL_MS}ms cubic-bezier(.4,0,.6,1),opacity ${VOL_MS}ms ease;
          opacity:0;}
        .ap-dessus.vole.droite{transform:translate3d(420px,-30px,0) rotate(19deg)!important;}
        .ap-dessus.vole.gauche{transform:translate3d(-420px,-30px,0) rotate(-19deg)!important;}

        .ap-tampon{position:absolute;top:26px;font-size:34px;font-weight:900;line-height:1;
          border:4px solid currentColor;border-radius:14px;padding:8px 16px;pointer-events:none;}
        .ap-tampon.non{right:20px;color:#FF6B6B;transform:rotate(15deg);}
        .ap-tampon.oui{left:20px;color:#3DE2A6;transform:rotate(-15deg);}

        .ap-doigt{position:absolute;left:50%;margin-left:-16px;top:30%;z-index:3;font-size:32px;
          pointer-events:none;filter:drop-shadow(0 4px 10px rgba(0,0,0,.7));
          animation:apDoigt 2.4s ease-in-out infinite;}
        @keyframes apDoigt{
          0%,100%{transform:translate3d(0,0,0);opacity:.35;}
          25%{transform:translate3d(-46px,0,0);opacity:1;}
          55%{transform:translate3d(38px,0,0);opacity:1;}
          80%{transform:translate3d(0,0,0);opacity:.35;}
        }

        /* LE COEUR VA SE RANGER EN HAUT A DROITE. Il part du milieu de la carte
           et finit sur la pastille verte du bandeau : c'est le trajet, pas le
           chiffre, qui fait comprendre ou va ce qu'on garde. */
        /* IL VISE LA PASTILLE, PAS UN POINT CALCULE. La premiere version
           deplacait le coeur d'un nombre de pixels deduit de la taille de la
           fenetre : juste sur un telephone, court de cent pixels dans le cadre
           du bureau, et faux sur un petit ecran. En animant la position
           plutot qu'une translation, l'arrivee est ecrite en clair — le coin
           haut droit de l'application — et elle tombe juste partout.
           (Et pas d'accent grave ici : ce bloc est un litteral de gabarit,
           un seul terminerait la chaine — c'est ce qui vient de casser la
           compilation.) */
        .ap-coeur{position:absolute;left:50%;top:55%;z-index:7;font-size:44px;color:#3DE2A6;
          pointer-events:none;filter:drop-shadow(0 6px 18px rgba(18,185,129,.7));
          animation:apCoeur ${COEUR_MS}ms cubic-bezier(.5,0,.35,1) forwards;}
        @keyframes apCoeur{
          0%{left:50%;top:55%;transform:translate(-50%,-50%) scale(.4);opacity:0;}
          22%{left:50%;top:55%;transform:translate(-50%,-50%) scale(1.25);opacity:1;}
          100%{left:calc(100% - 30px);top:34px;transform:translate(-50%,-50%) scale(.3);opacity:.1;}
        }

        .ap-vide{display:flex;flex-direction:column;align-items:center;justify-content:center;
          gap:11px;text-align:center;padding:0 24px;
          border:1px dashed rgba(255,255,255,.15);border-radius:26px;
          animation:apVide .45s cubic-bezier(.16,1,.3,1);}
        @keyframes apVide{from{opacity:0;transform:scale(.96);}to{opacity:1;transform:none;}}
        .ap-vide-e{font-size:34px;line-height:1;}
        .ap-vide b{font-size:20px;font-weight:850;color:#fff;letter-spacing:-.02em;}
        .ap-vide i{font-style:normal;font-size:14px;color:#93A8A0;line-height:1.45;}
        .ap-cta{font:inherit;font-size:15px;font-weight:850;color:#04150E;border:0;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);border-radius:999px;
          padding:13px 24px;cursor:pointer;box-shadow:0 14px 30px -14px rgba(18,185,129,.9);
          transition:transform .15s ease;}
        .ap-cta:active{transform:scale(.96);}

        /* ── LA LIGNE D'AVIS, SUR LA CARTE ── */
        .ap-avis-l{display:inline-flex;align-items:center;gap:6px;margin-top:9px;font:inherit;
          font-size:12px;color:#D6DEE4;cursor:pointer;text-align:left;
          background:rgba(0,0,0,.42);border:1px solid rgba(255,255,255,.16);
          border-radius:999px;padding:7px 12px;
          -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
          transition:transform .15s ease,border-color .25s ease;}
        .ap-avis-l:active{transform:scale(.96);}
        .ap-avis-l b{font-weight:850;color:#fff;}
        .ap-avis-l span{color:#B9C6CE;}
        .ap-avis-l i{font-style:normal;font-size:15px;color:#8FA3B0;margin-left:1px;}

        .ap-et{display:inline-flex;gap:1px;font-size:11px;line-height:1;}
        .ap-et i{font-style:normal;color:rgba(255,255,255,.25);}
        .ap-et i.on{color:#F0B429;}

        /* ── LES QUATRE GESTES ── */
        .ap-gestes{flex:none;gap:14px;margin:0 0 max(14px, env(safe-area-inset-bottom));}
        .ap-gestes .cd-g{font:inherit;background:none;border:0;padding:0;cursor:pointer;}
        .ap-gestes .cd-g:active i{transform:scale(.92);}
        .ap-gestes .cd-g:disabled{cursor:default;opacity:.32;}
        .ap-gestes .cd-g:disabled:active i{transform:none;}
        .ap-gestes .cd-g:focus-visible{outline:2px solid #3DE2A6;outline-offset:4px;border-radius:12px;}
        /* Reserver est la seule action qui engage : elle ne peut pas avoir la
           meme couleur que « passer ». Ambre, pas vert — le vert est deja pris
           par le geste du balayage, et deux boutons verts se confondent. */
        .ap-gestes .cd-g.ambre i{color:#0A1410;border:0;
          background:linear-gradient(140deg,#F7C948,#E09B18);
          box-shadow:0 12px 26px -14px rgba(240,180,41,.9);}
        .ap-gestes .cd-g.ambre em{color:#F0C05A;}

        /* ── LES FEUILLES ── */
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
        .ap-f-x:active{transform:scale(.92);}

        .ap-f-tete{flex:none;margin-bottom:12px;padding-right:40px;}
        .ap-f-tete b{display:block;font-size:19px;font-weight:850;color:#fff;
          letter-spacing:-.02em;}
        .ap-f-tete span{display:flex;align-items:center;gap:7px;margin-top:5px;
          font-size:13px;font-weight:750;color:#C7D8CE;}
        .ap-f-tete span.simple{font-weight:600;color:#93A8A0;}
        .ap-f-tete i{display:block;margin-top:6px;font-style:normal;font-size:11.5px;
          color:#7F988B;}

        .ap-f-liste{flex:1;min-height:0;overflow-y:auto;list-style:none;margin:0;padding:0;
          display:flex;flex-direction:column;gap:1px;}
        .ap-f-liste li{padding:11px 0;border-top:1px solid rgba(255,255,255,.08);}
        .ap-f-liste.sans-trait li{padding:0;border:0;}
        .ap-f-h{display:flex;align-items:center;gap:8px;}
        .ap-f-h b{font-size:13px;font-weight:850;color:#fff;}
        .ap-f-h span{font-size:11.5px;color:#7F988B;}
        .ap-f-liste p{margin:5px 0 0;font-size:14px;line-height:1.4;color:#C7D8CE;}

        .ap-f-corps{flex:1;min-height:0;overflow-y:auto;}

        /* Le choix du metier : une ligne par branche, avec ce qu'elle a en
           ligne maintenant. Le chiffre est la moitie de l'information. */
        .ap-m{width:100%;display:flex;align-items:center;gap:12px;font:inherit;font-size:16px;
          font-weight:750;color:#EAF2EC;cursor:pointer;text-align:left;
          background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
          border-radius:14px;padding:13px 14px;margin-bottom:8px;
          transition:transform .12s ease,border-color .25s ease,background .25s ease;}
        .ap-m i{font-style:normal;font-size:20px;line-height:1;}
        .ap-m span{flex:1;min-width:0;}
        .ap-m b{font-size:13px;font-weight:850;color:#7F988B;font-variant-numeric:tabular-nums;}
        .ap-m:active{transform:scale(.98);}
        .ap-m.on{border-color:rgba(61,226,166,.45);background:rgba(61,226,166,.12);}
        .ap-m.on b{color:#8FE9C4;}

        /* La fiche du pro. */
        .ap-p-mot{margin:0 0 12px;font-size:14.5px;line-height:1.5;color:#C7D8CE;}
        .ap-p-l{display:flex;align-items:flex-start;gap:9px;font-size:13.5px;line-height:1.45;
          color:#B9C6CE;padding:8px 0;border-top:1px solid rgba(255,255,255,.08);}
        .ap-p-l i{font-style:normal;font-size:14px;flex:none;}
        .ap-p-avis{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font:inherit;
          font-size:12.5px;color:#D6DEE4;cursor:pointer;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);
          border-radius:999px;padding:8px 13px;}
        .ap-p-avis i{font-style:normal;font-size:15px;color:#8FA3B0;}

        .ap-f-deux{flex:none;display:flex;gap:9px;margin-top:14px;padding-top:12px;
          border-top:1px solid rgba(255,255,255,.1);}
        .ap-b2{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;
          font:inherit;font-size:15px;font-weight:850;cursor:pointer;text-decoration:none;
          color:#EAF2EC;background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.13);border-radius:14px;padding:14px 10px;
          transition:transform .15s ease;}
        .ap-b2:active{transform:scale(.97);}
        .ap-b2.plein{color:#0A1410;border-color:transparent;
          background:linear-gradient(140deg,#F7C948,#E09B18);}
        .ap-b2.plein:disabled{opacity:.35;cursor:default;}

        /* La reservation : des creneaux, et rien d'autre a remplir. */
        .ap-r-cren{display:flex;flex-wrap:wrap;gap:8px;}
        .ap-r-c{font:inherit;font-size:14px;font-weight:800;cursor:pointer;color:#C7D8CE;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.13);
          border-radius:12px;padding:12px 16px;
          transition:transform .12s ease,background .25s ease,color .25s ease,border-color .25s ease;}
        .ap-r-c:active{transform:scale(.95);}
        .ap-r-c.on{color:#0A1410;border-color:transparent;
          background:linear-gradient(140deg,#F7C948,#E09B18);}
        .ap-r-ok{display:flex;flex-direction:column;align-items:center;justify-content:center;
          gap:9px;text-align:center;padding:22px 10px 10px;
          animation:apOk .4s cubic-bezier(.16,1,.3,1);}
        @keyframes apOk{from{opacity:0;transform:scale(.94);}to{opacity:1;transform:none;}}
        .ap-r-ok span{font-size:34px;color:#8FE9C4;line-height:1;}
        .ap-r-ok b{font-size:21px;font-weight:850;color:#fff;letter-spacing:-.02em;}
        .ap-r-ok i{font-style:normal;font-size:14px;color:#93A8A0;}

        .ap-f-form{flex:none;margin-top:12px;padding-top:12px;
          border-top:1px solid rgba(255,255,255,.1);}
        .ap-f-notes{display:flex;gap:4px;margin-bottom:9px;}
        .ap-f-n{font:inherit;font-size:26px;line-height:1;cursor:pointer;background:none;
          border:0;padding:0 2px;color:rgba(255,255,255,.22);
          transition:color .18s ease,transform .18s cubic-bezier(.34,1.4,.64,1);}
        .ap-f-n.on{color:#F0B429;transform:scale(1.08);}
        .ap-f-saisie{display:flex;gap:8px;}
        .ap-f-saisie input{flex:1;min-width:0;font:inherit;font-size:14px;color:#EAF2EC;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.13);
          border-radius:12px;padding:11px 13px;}
        .ap-f-saisie input::placeholder{color:#6C8078;}
        .ap-f-saisie input:focus{outline:2px solid rgba(61,226,166,.5);outline-offset:0;}
        .ap-f-saisie button{flex:none;font:inherit;font-size:14px;font-weight:850;color:#04150E;
          border:0;border-radius:12px;padding:11px 18px;cursor:pointer;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);}
        .ap-f-saisie button:disabled{opacity:.3;cursor:default;}

        /* SUR ORDINATEUR, L'APPLICATION EST DANS UN TELEPHONE. Etalee sur
           1280 px de large, elle n'a plus l'air de rien. */
        @media (min-width:720px){
          .ap{padding:24px;background:radial-gradient(90% 60% at 50% 0%,#101A22,#05090C 70%),#05090C;}
          .ap-tel{width:390px;height:min(844px, calc(100dvh - 48px));
            border:1px solid rgba(255,255,255,.14);border-radius:42px;padding:9px;
            background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.01));
            box-shadow:0 0 0 1px rgba(0,0,0,.6),0 50px 90px -40px rgba(0,0,0,.95);}
          .ap-app{border-radius:34px;overflow:hidden;}
          .ap-vue{--dispo:calc(min(844px, 100dvh - 48px) - 300px);}
        }
        @media (prefers-reduced-motion:reduce){
          .ap-doigt{animation:none;}
          .ap-dessus.vole{transition-duration:.01ms;}
          .ap-vide,.ap-feuille,.ap-fond,.ap-coeur,.ap-r-ok{animation:none;}
          .ap-coeur{display:none;}
        }
      `,
        }}
      />
    </div>
  );
}
