"use client";

// LE DÉFILÉ DES CARTES DU JOUR.
//
// UN MENU PAR ÉCRAN, ET ON GLISSE. C'est le geste qu'on fait déjà mille fois par
// jour, et c'est le seul qui permette de comparer six menus sans les oublier au
// fur et à mesure. L'alternative — une liste de vignettes — obligerait à ouvrir
// et fermer chaque photo, c'est-à-dire exactement ce qu'on cherche à supprimer.
//
// POURQUOI DU CSS ET PAS UNE BIBLIOTHÈQUE DE CARROUSEL. `scroll-snap` est
// natif : l'inertie est celle du système, elle est parfaite sur téléphone, elle
// ne charge rien, et elle ne casse pas le jour où le navigateur change. Aucune
// bibliothèque de swipe n'égale l'inertie native, et toutes désactivent le
// défilement de la page pour y arriver.
//
// UNE ARDOISE DÉFILE AUSSI VERTICALEMENT. Elle est haute et couverte de texte :
// la faire tenir dans la hauteur de l'écran la rendrait illisible. Chaque volet
// défile donc dans sa propre colonne — glisser à l'horizontale change de
// restaurant, glisser à la verticale descend dans le menu.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loupe } from "../_ui/loupe";
import type { MenuDuJour } from "@/lib/direct/menus-du-jour";
import { lienReserverTable } from "@/lib/direct/reserver";
import { prixCourt } from "@/lib/direct/prix";
import { BoutonPartage } from "../_ui/partage";

export function MenusDefile({
  menus,
  ville,
  villeNom,
  vise,
}: {
  menus: MenuDuJour[];
  ville: string;
  villeNom: string;
  /** La carte à montrer d'emblée — celle d'un lien partagé. "" sinon. */
  vise?: string;
}) {
  const depart = Math.max(0, menus.findIndex((m) => m.id === vise));
  const [actif, setActif] = useState(depart);
  /** La carte qu'on regarde en entier. `null` : aucune. */
  const [loupe, setLoupe] = useState<string | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);

  // QUEL MENU EST DEVANT LES YEUX. Le compteur « 2 / 6 » est la seule chose qui
  // dise qu'il y en a d'autres : sans lui, on croit être arrivé au bout dès le
  // premier. On l'observe plutôt que de le calculer à chaque pixel de
  // défilement — un `onScroll` sur un rail à inertie déclenche cent fois par
  // glissement.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const obs = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.i);
          if (Number.isFinite(i)) setActif(i);
        }
      },
      { root: rail, threshold: 0.6 }
    );
    for (const v of rail.querySelectorAll(".mn-v")) obs.observe(v);
    return () => obs.disconnect();
  }, [menus.length]);

  // LE LIEN PARTAGÉ ATTERRIT SUR LA BONNE CARTE.
  //
  // Recevoir « regarde ce midi » et tomber sur le premier restaurant de la
  // liste, ce n'est pas le menu qu'on nous a envoyé — c'est un lien qu'on
  // n'ouvre pas deux fois. On place donc le rail sur la carte visée.
  //
  // SANS ANIMATION (`behavior: "instant"`) : un défilement animé au chargement
  // se lit comme un bug, et il entre en conflit avec l'aimantation qui est en
  // train de se mettre en place.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || depart <= 0) return;
    const cible = rail.querySelectorAll<HTMLElement>(".mn-v")[depart];
    if (cible) rail.scrollTo({ left: cible.offsetLeft, behavior: "instant" as ScrollBehavior });
  }, [depart]);

  return (
    <>
      {loupe && <Loupe src={loupe} alt="Carte du jour" onFermer={() => setLoupe(null)} />}
      <div className="mn-compte" aria-live="polite">
        {actif + 1} / {menus.length}
      </div>

      <div className="mn-rail" ref={railRef}>
        {menus.map((m, i) => {
          const resa = lienReserverTable(m.telephone, m.commerce);
          return (
            <section className="mn-v" key={m.id} data-i={i} aria-label={`Carte du jour de ${m.commerce}`}>
              <div className="mn-zone">
                <div className="mn-qui">
                  <b>{m.commerce}</b>
                  {m.metier ? <span>{m.metier}</span> : null}
                  {/* LE PRIX EN TÊTE DE VOLET. Sur une page faite pour comparer
                      six menus en dix secondes, c'est l'information qui tranche
                      — et la seule qu'on ne pouvait trouver qu'en lisant
                      l'ardoise jusqu'en bas. */}
                  {prixCourt(m.prix) ? <b className="mn-prix">{prixCourt(m.prix)}</b> : null}
                </div>
                {/* LA PHOTO TIENT DANS L'ÉCRAN, ET LE TEXTE EST TOUJOURS LÀ.
                    Deux défauts corrigés d'un coup :
                    · l'image était rendue à sa hauteur naturelle. Une photo de
                      plat en portrait faisait deux fois la hauteur du volet :
                      il fallait faire défiler pour la voir, sur une page dont
                      tout l'intérêt est de comparer six menus d'un coup d'œil.
                      Elle est bornée, sans rognage — une ardoise photographiée
                      ne doit surtout pas être rognée — et un appui l'ouvre en
                      entier pour la lire ;
                    · le texte n'apparaissait QUE s'il n'y avait pas de photo.
                      Or un restaurateur qui photographie son assiette écrit
                      quand même son menu : on affichait la photo, et le menu
                      lui-même — les plats, ce qu'il y a dedans — restait
                      invisible. Les deux se complètent, ils ne s'excluent pas. */}
                {m.photo ? (
                  <button
                    type="button"
                    className="mn-shot"
                    onClick={() => setLoupe(m.photo)}
                    aria-label={`Voir la carte du jour de ${m.commerce} en entier`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="mn-img" src={m.photo} alt={`Carte du jour de ${m.commerce}`} />
                    <span className="mn-loupe" aria-hidden="true">🔍 Voir en entier</span>
                  </button>
                ) : null}
                {m.texte ? <div className="mn-txt">{m.texte}</div> : null}
              </div>

              {/* LES DEUX SORTIES, sur toutes les cartes et à la même place :
                  réserver, ou aller voir l'annonce dans le fil. Les déplacer
                  d'un volet à l'autre obligerait à les chercher à chaque
                  glissement. */}
              <div className="mn-act">
                {resa ? (
                  <a className="mn-resa" href={resa} target="_blank" rel="noreferrer noopener">
                    🍽️ Je réserve une table
                  </a>
                ) : (
                  /* Sans numéro, on ne promet pas une réservation qui n'ouvrirait
                     aucune conversation : on renvoie là où l'annonce entière se
                     lit, avec ses façons d'en profiter s'il y en a. */
                  <Link className="mn-resa mn-off" href={`/ville/${ville}?onglet=dejeuner#p-${m.id}`} prefetch={false}>
                    Voir chez {m.commerce}
                  </Link>
                )}
                {/* LE SECOND RANG : les deux gestes de côté.
                    PARTAGER n'est pas caché dans un menu — « Ça te dit ça ce
                    midi ? » à un collègue est le geste le plus naturel de cette
                    page, et il marche dès le premier jour : il lui faut deux
                    amis, pas soixante-dix restaurants. */}
                <div className="mn-act-b">
                  <BoutonPartage
                    id={m.id}
                    ville={ville}
                    villeNom={villeNom}
                    commerce={m.commerce}
                    prix={m.prix}
                  />
                  <Link className="mn-annonce" href={`/ville/${ville}?onglet=dejeuner#p-${m.id}`} prefetch={false}>
                    Voir l&apos;annonce ›
                  </Link>
                </div>
              </div>
            </section>
          );
        })}
      </div>

    </>
  );
}
