"use client";

// L'APPLICATION, TELLE QU'ELLE SERAIT — un seul écran, rien à lire.
//
// CE QUE C'EST. Une maquette jouable de ce que verrait un habitant. Elle sert à
// savoir si l'idée lui parle avant qu'on la construise. Ce qu'elle met en scène
// et qui n'existe pas encore est listé en tête de `lib/direct/apercu-habitant.ts`
// — et NULLE PART à l'écran : les gens à qui on la montre savent déjà que c'est
// un essai, le leur répéter dans un bandeau ne fait que les mettre en position
// de juger une démonstration au lieu d'essayer une application. La page est en
// `noindex` pour que personne ne tombe dessus sans qu'on le lui ait tendue.
//
// LA PREMIÈRE VERSION ÉTAIT UNE PAGE, PAS UNE APP, et c'est le défaut qu'on
// corrige ici. Elle empilait un titre, un sous-titre, un bandeau d'avertis-
// sement, un curseur d'heures, une section « et si vous pouviez demander »,
// une section verdict : on la LISAIT avant de pouvoir la toucher, et les
// filtres vivaient dans la page, en dessous de l'application, ce qui ne
// ressemble à aucune application existante.
//
// TROIS RÈGLES POUR CETTE VERSION :
//
//  1. UN ÉCRAN, PLEIN CADRE, QUI NE DÉFILE PAS. Tout tient dans la hauteur du
//     téléphone : le bandeau, les filtres, la carte, les trois gestes. On ne
//     fait jamais défiler une application de swipe.
//  2. LES FILTRES SONT DANS L'APPLICATION. En haut, à portée de pouce, comme
//     dans n'importe quelle application qu'on a déjà utilisée. Le temps est
//     devenu deux onglets — « Maintenant » et « Ce soir » — plutôt qu'un
//     curseur : un curseur est un objet de démonstration, deux onglets sont un
//     objet de produit.
//  3. AUCUNE PHRASE EXPLICATIVE. Le seul texte à l'écran, hors carte, est :
//     deux onglets, cinq pastilles, une ligne de comptage, trois intitulés de
//     gestes. Ce qui doit se comprendre se comprend en touchant.
import { useRef, useState, useSyncExternalStore } from "react";
import { BarreDirect, CarteSwipe, StylesDirect } from "@/components/direct/carte-swipe";
import {
  ENVIES,
  HEURE_MAX,
  HEURE_MIN,
  autourDeMoi,
  moyenneAvis,
  selonEnvies,
  type AvisPlat,
  type CarteAutour,
  type CleEnvie,
} from "@/lib/direct/apercu-habitant";
import { MARQUE } from "@/lib/marque";

/** Au-delà de cette distance en pixels, le doigt a décidé : la carte part. */
const SEUIL = 84;
/** La durée de l'envol, la même qu'en CSS. */
const VOL_MS = 420;
/** L'heure que montre l'onglet « Ce soir ». */
const HEURE_SOIR = 20;

// ── LES AVIS QUE LE VISITEUR LAISSE, GARDÉS DANS SON NAVIGATEUR ────────────
//
// C'est ce qui rend la démonstration crédible : il note un plat, il ferme, il
// revient — son avis est toujours là, au-dessus de ceux des autres. Sans ça,
// « les avis sont mémorisés » reste une phrase.
//
// `useSyncExternalStore` plutôt qu'un effet : le stockage local n'existe pas
// côté serveur, et lire pendant le rendu casserait l'hydratation. L'instantané
// serveur est vide, le client charge une fois, et les écritures préviennent les
// abonnés. La lecture comme l'écriture sont sous `try` — un navigateur en
// navigation privée peut refuser les deux, et la page doit continuer.
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

export function ApercuHabitant({ contact, ville }: { contact: string; ville: string }) {
  // L'HEURE DU VISITEUR, SANS CASSER L'HYDRATATION. Le serveur ne connaît pas
  // son fuseau : rendre `new Date().getHours()` des deux côtés produit deux
  // HTML différents. `useSyncExternalStore` est fait pour ça — un instantané
  // serveur (midi), un instantané client. Pas d'abonnement : l'heure ne bougera
  // pas pendant la visite.
  const heureVraie = useSyncExternalStore(
    () => () => {},
    () => new Date().getHours(),
    () => 12,
  );
  const maintenant = heureVraie >= HEURE_MIN && heureVraie <= HEURE_MAX ? heureVraie : 12;

  const [quand, setQuand] = useState<"now" | "soir">("now");
  const [envies, setEnvies] = useState<CleEnvie[]>([]);
  const [passees, setPassees] = useState<string[]>([]);
  const [gardees, setGardees] = useState<string[]>([]);
  const [dx, setDx] = useState(0);
  const [sortant, setSortant] = useState<"" | "gauche" | "droite">("");
  const [aJoue, setAJoue] = useState(false);
  const [alerte, setAlerte] = useState(false);
  /** Le plat dont on lit les avis. Rien : la feuille est fermée. */
  const [ouvert, setOuvert] = useState<CarteAutour | null>(null);
  const [maNote, setMaNote] = useState(0);
  const [monMot, setMonMot] = useState("");
  const prise = useRef<{ x0: number } | null>(null);
  const minuteries = useRef<number[]>([]);

  const miens = useSyncExternalStore(abonnerAvis, chargerAvis, () => VIDE);
  /** Les avis d'un plat : les siens d'abord, puis ceux déjà là. */
  const avisDe = (c: CarteAutour): AvisPlat[] => [...(miens[c.id] ?? []), ...(c.avis ?? [])];

  const heure = quand === "soir" ? HEURE_SOIR : maintenant;
  const dispo = selonEnvies(autourDeMoi(heure), envies);
  const pile = dispo.filter((c) => !passees.includes(c.id));
  const dessus = pile[0];
  const dessous = pile[1];

  /** Remet le paquet à zéro. Tout changement de filtre est un nouveau paquet. */
  function remettre() {
    minuteries.current.forEach(clearTimeout);
    minuteries.current = [];
    setPassees([]);
    setDx(0);
    setSortant("");
    setAlerte(false);
  }

  function partir(sens: "gauche" | "droite") {
    if (!dessus || sortant) return;
    setAJoue(true);
    setSortant(sens);
    setDx(sens === "droite" ? 420 : -420);
    const id = dessus.id;
    minuteries.current.push(
      window.setTimeout(() => {
        if (sens === "droite") setGardees((g) => (g.includes(id) ? g : [...g, id]));
        setPassees((p) => [...p, id]);
        setDx(0);
        setSortant("");
      }, VOL_MS),
    );
  }

  const plusProche = dispo.length ? Math.min(...dispo.map((c) => c.metres)) : 0;

  return (
    <div className="ap">
      <StylesDirect />
      <div className="ap-tel">
        <div className="ap-app">
          <div className="ap-haut">
            <BarreDirect marque={MARQUE} ville={ville} gardees={gardees.length} />

            {/* LE TEMPS, EN DEUX ONGLETS. C'était un curseur de 11 h à 22 h :
                joli, et reconnaissable entre mille comme un objet de
                démonstration. Deux onglets, c'est ce qu'on trouve en haut de
                toutes les applications qu'ils ont déjà dans la poche. */}
            <div className="ap-quand">
              {(
                [
                  ["now", "Maintenant"],
                  ["soir", "Ce soir"],
                ] as const
              ).map(([cle, label]) => (
                <button
                  key={cle}
                  type="button"
                  aria-pressed={quand === cle}
                  className={`ap-q${quand === cle ? " on" : ""}`}
                  onClick={() => {
                    setQuand(cle);
                    remettre();
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* LES ENVIES SONT DANS L'APPLICATION, pas dans une section de page
                en dessous. Une rangée qui défile latéralement : la sixième
                pastille dépasse volontairement du bord, c'est ce qui dit qu'il
                y en a d'autres sans avoir à l'écrire. */}
            <div className="ap-envies">
              {ENVIES.map((e) => {
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
                {/* La main montre le geste tant qu'on n'a rien balayé, et
                    disparaît pour de bon au premier : un tutoriel qui se répète
                    devient un reproche. Elle vit dans le tiers haut, la seule
                    bande de la carte où il n'y a jamais rien à lire. */}
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
                    {/* LES AVIS SUR LE PLAT, sur la carte elle-même.
                        Ils ne sont posés que sur la carte du DESSUS : sur celle
                        de derrière, à moitié cachée, ce serait un deuxième
                        bouton invisible et pourtant cliquable.
                        `stopPropagation` sur le pointeur est indispensable —
                        sans lui, le doigt qui appuie sur la ligne commence un
                        balayage, et on ne peut jamais l'ouvrir au toucher. */}
                    {!!dessus.avis?.length && (
                      <button
                        type="button"
                        className="ap-avis-l"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => {
                          setOuvert(dessus);
                          setMaNote(0);
                          setMonMot("");
                        }}
                      >
                        <Etoiles note={moyenneAvis(avisDe(dessus))} />
                        <b>{moyenneAvis(avisDe(dessus)).toString().replace(".", ",")}</b>
                        <span>· {avisDe(dessus).length} avis sur le plat</span>
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
                 une alerte, le second un retour en arrière. Les confondre, c'est
                 proposer de prévenir quelqu'un qui vient simplement de finir. */
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
                    {/* LE SEUL LIEN SORTANT DE L'APPLICATION, et il est ici
                        parce que c'est le seul moment où l'on a fini quelque
                        chose. Discret : la page sert d'abord à être essayée. */}
                    <a className="ap-avis" href={contact} target="_blank" rel="noreferrer noopener">
                      Donner mon avis
                    </a>
                  </>
                )}
              </div>
            )}
          </div>

          {/* LES GESTES DU PRODUIT, CLIQUABLES. Au clavier et à la souris, le
              balayage n'existe pas : sans eux, la moitié des gens ne peuvent
              pas jouer. On garde les classes du composant, donc son allure. */}
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
            <button type="button" className="cd-g" disabled aria-hidden="true" tabIndex={-1}>
              <i>↑</i>
              <em>Le pro</em>
            </button>
          </div>

          {/* ── LES AVIS DU PLAT ──
              Une feuille qui monte par-dessus l'application, pas une autre
              page : on lit trois avis et on revient à sa carte. Elle est DANS
              le cadre du téléphone (position absolue sur `.ap-app`), donc sur
              ordinateur elle monte dans l'appareil et pas sur le bureau. */}
          {ouvert && (
            <>
              <button
                type="button"
                className="ap-fond"
                aria-label="Fermer les avis"
                onClick={() => setOuvert(null)}
              />
              <div className="ap-feuille" role="dialog" aria-label={`Avis sur ${ouvert.quoi}`}>
                <span className="ap-poignee" aria-hidden="true" />
                {/* UNE CROIX, MÊME AVEC LE FOND CLIQUABLE. Le fond ferme la
                    feuille, mais il n'est visible qu'au-dessus d'elle : celui
                    qui a le pouce en bas de l'écran n'a rien à toucher. */}
                <button
                  type="button"
                  className="ap-f-x"
                  aria-label="Fermer"
                  onClick={() => setOuvert(null)}
                >
                  ✕
                </button>
                <div className="ap-f-tete">
                  <b>{ouvert.lignes?.[0] ?? ouvert.quoi}</b>
                  <span>
                    <Etoiles note={moyenneAvis(avisDe(ouvert))} />
                    {moyenneAvis(avisDe(ouvert)).toString().replace(".", ",")} ·{" "}
                    {avisDe(ouvert).length} avis
                  </span>
                  {/* LA LIGNE QUI PORTE TOUTE L'IDÉE. Les avis ne suivent pas
                      l'annonce du jour, ils suivent LE PLAT : quand il revient
                      à la carte, ils reviennent avec lui. Six mots suffisent à
                      le faire comprendre, une explication n'aurait pas sa
                      place ici. */}
                  <i>Sur ce plat, à chaque fois qu&apos;il revient.</i>
                </div>

                <ul className="ap-f-liste">
                  {avisDe(ouvert).map((a, n) => (
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
                    ajouterAvis(ouvert.id, {
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
           pas une : le doigt ne sait plus s'il tire la carte ou la page. Tout
           tient dans la hauteur, et le corps est bloque. */
        .ap{height:100dvh;overflow:hidden;background:#05090C;
          font-family:'Inter',system-ui,-apple-system,sans-serif;color:#EAF2EC;
          display:flex;align-items:center;justify-content:center;}
        .ap-tel{width:100%;height:100%;}
        .ap-app{position:relative;height:100%;display:flex;flex-direction:column;
          background:radial-gradient(120% 40% at 50% 0%,#13202C 0%,#080D0B 62%),#080D0B;
          /* La hauteur prise par le haut et par les gestes, MESUREE au
             navigateur (232 px + 98 px), pas estimee : sous-evaluee, la carte
             passait sous les gestes ; sur-evaluee, elle flottait au milieu de
             deux bandes noires. */
          --chrome:340px;
          --dispo:calc(100dvh - var(--chrome));
        }

        .ap-haut{flex:none;padding:10px 12px 0;display:flex;flex-direction:column;gap:9px;}

        /* Le bandeau du produit garde sa largeur native ; ici il vit dans un
           ecran plein cadre, donc il s'etale au lieu d'etre centre a 340. */
        .ap-haut .cd-barre{max-width:none;}

        .ap-quand{display:flex;gap:4px;background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.09);border-radius:999px;padding:3px;}
        .ap-q{flex:1;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer;
          color:#8FA3B0;background:none;border:0;border-radius:999px;padding:9px 0;
          transition:color .2s ease,background .25s ease;}
        .ap-q.on{color:#04150E;background:linear-gradient(140deg,#3DE2A6,#0BA97B);}

        /* La rangee deborde volontairement du bord droit : c'est ce qui dit
           qu'il y en a d'autres, sans ecrire « faites defiler ». */
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
           La largeur se deduit de la hauteur disponible ET de la largeur de
           l'ecran : sans le min(), un telephone court montrait une carte plus
           haute que la fenetre, et son bas passait sous les gestes. */
        .ap-vue{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;
          padding:8px 14px;}
        /* LA CARTE PREND TOUTE LA LARGEUR DISPONIBLE. Elle etait plafonnee a
           340 px — la valeur du composant, faite pour un encart dans une page —
           et flottait au milieu de l'ecran avec 60 px de vide en haut et en
           bas. Dans une application de swipe, la carte EST l'ecran. */
        .ap-pile,.ap-vide{position:relative;
          width:min(100%, calc(var(--dispo) * 3 / 4.15));
          aspect-ratio:3/4.15;}
        .ap-pile .ap-carte{max-width:none;}

        /* ET LA PLACE RESTANTE SE MESURE, ELLE NE S'ESTIME PLUS. Le calcul
           ci-dessus part d'une constante (--chrome) : juste sur un ecran de
           860 px, elle sur-reservait 48 px sur un 640 et la carte y perdait un
           cinquieme de sa taille. Une requete de conteneur donne la hauteur
           REELLE laissee par les elements du dessus et du dessous, quelle que
           soit la hauteur de l'ecran ou le retour a la ligne des pastilles.
           Le calcul precedent reste : c'est le repli des vieux navigateurs. */
        @supports (container-type:size){
          .ap-vue{container-type:size;}
          .ap-pile,.ap-vide{width:min(100cqw, calc(100cqh * 3 / 4.15));}
        }
        .ap-pile{overflow:hidden;border-radius:26px;}
        .ap-carte{position:absolute;left:0;right:0;top:0;margin-inline:auto;}
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
        .ap-avis{font-size:12.5px;color:#7F988B;text-decoration:underline;
          text-underline-offset:3px;}

        /* ── LES AVIS SUR LE PLAT ── */

        /* La ligne vit DANS la carte, sous le prix. Elle a l'air d'un bouton
           parce qu'elle en est un : sans le chevron et le fond, personne
           n'essaie d'appuyer sur une note. */
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

        .ap-fond{position:absolute;inset:0;z-index:8;border:0;padding:0;cursor:pointer;
          background:rgba(3,7,6,.7);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);
          animation:apFond .25s ease;}
        @keyframes apFond{from{opacity:0;}to{opacity:1;}}

        /* La feuille est POSEE SUR L'APPLICATION, pas sur la page : dans le
           cadre de telephone du bureau, elle monte dans l'appareil. */
        .ap-feuille{position:absolute;left:0;right:0;bottom:0;z-index:9;
          max-height:82%;display:flex;flex-direction:column;
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
        .ap-f-tete i{display:block;margin-top:6px;font-style:normal;font-size:11.5px;
          color:#7F988B;}

        .ap-f-liste{flex:1;min-height:0;overflow-y:auto;list-style:none;margin:0;padding:0;
          display:flex;flex-direction:column;gap:1px;}
        .ap-f-liste li{padding:11px 0;border-top:1px solid rgba(255,255,255,.08);}
        .ap-f-h{display:flex;align-items:center;gap:8px;}
        .ap-f-h b{font-size:13px;font-weight:850;color:#fff;}
        .ap-f-h span{font-size:11.5px;color:#7F988B;}
        .ap-f-liste p{margin:5px 0 0;font-size:14px;line-height:1.4;color:#C7D8CE;}

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

        .ap-gestes{flex:none;margin:0 0 max(14px, env(safe-area-inset-bottom));}
        .ap-gestes .cd-g{font:inherit;background:none;border:0;padding:0;cursor:pointer;}
        .ap-gestes .cd-g:active i{transform:scale(.92);}
        .ap-gestes .cd-g:disabled{cursor:default;opacity:.32;}
        .ap-gestes .cd-g:disabled:active i{transform:none;}
        .ap-gestes .cd-g:focus-visible{outline:2px solid #3DE2A6;outline-offset:4px;border-radius:12px;}

        /* SUR ORDINATEUR, L'APPLICATION EST DANS UN TELEPHONE. Etalee sur
           1280 px de large, elle n'a plus l'air de rien ; posee dans un cadre
           de 390 x 844, on sait tout de suite ce qu'on regarde. */
        @media (min-width:720px){
          .ap{padding:24px;background:radial-gradient(90% 60% at 50% 0%,#101A22,#05090C 70%),#05090C;}
          .ap-tel{width:390px;height:min(844px, calc(100dvh - 48px));
            border:1px solid rgba(255,255,255,.14);border-radius:42px;padding:9px;
            background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.01));
            box-shadow:0 0 0 1px rgba(0,0,0,.6),0 50px 90px -40px rgba(0,0,0,.95);}
          .ap-app{border-radius:34px;overflow:hidden;
            --dispo:calc(min(844px, 100dvh - 48px) - var(--chrome));}
        }
        @media (prefers-reduced-motion:reduce){
          .ap-doigt{animation:none;}
          .ap-feuille,.ap-fond{animation:none;}
          .ap-dessus.vole{transition-duration:.01ms;}
          .ap-vide{animation:none;}
        }
      `,
        }}
      />
    </div>
  );
}
