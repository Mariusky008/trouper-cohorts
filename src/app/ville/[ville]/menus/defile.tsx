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
import type { MenuDuJour } from "@/lib/direct/menus-du-jour";
import { lienReserverTable } from "@/lib/direct/reserver";

export function MenusDefile({ menus, ville }: { menus: MenuDuJour[]; ville: string }) {
  const [actif, setActif] = useState(0);
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

  return (
    <>
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
                </div>
                {m.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="mn-img" src={m.photo} alt={`Carte du jour de ${m.commerce}`} />
                ) : (
                  /* SANS PHOTO, LE TEXTE EST LA CARTE. Un restaurateur qui a
                     tapé son menu au clavier ne doit pas être absent d'un écran
                     qui s'appelle « les cartes du jour ». Les retours à la ligne
                     sont préservés : c'est la mise en page qu'il a choisie. */
                  <div className="mn-txt">{m.texte}</div>
                )}
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
                <Link className="mn-annonce" href={`/ville/${ville}?onglet=dejeuner#p-${m.id}`} prefetch={false}>
                  Voir l&apos;annonce ›
                </Link>
              </div>
            </section>
          );
        })}
      </div>

    </>
  );
}
