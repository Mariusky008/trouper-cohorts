"use client";

// 👻 LA MAQUETTE DE JUGEMENT — cinq murs côte à côte, sur une page à part.
//
// ═══ CE QU'ELLE EST, ET CE QU'ELLE N'EST PAS ══════════════════════════════
//
// ELLE N'EST PAS LE PRODUIT. Dans le produit, le mur est une FEUILLE qui monte
// sur l'annonce qu'on regarde, sans la quitter — c'est `MurContenu`, monté dans
// le paquet par le fantôme de la barre du bas. « Une page qui n'a rien à voir
// avec l'annonce » était le défaut, et il est corrigé là-bas.
//
// ELLE SERT À UNE SEULE CHOSE, ET ELLE EST UTILE POUR ÇA : comparer cinq
// commerces en trois secondes, sans traverser le paquet à chaque fois. Un
// restaurant dont le mur parle surtout d'autre chose, un bar où ce qui compte
// est l'humeur, une onglerie, une bijoutière et une cirière où le fantôme est un
// essai. Si le même écran tient les cinq sans se tordre, le concept tient.
//
// ELLE DISPARAÎT À L'ATTERRISSAGE, comme le sélecteur qu'elle porte.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MURS, modeleDeLaBranche } from "@/lib/direct/fantomes";
import { MurContenu } from "@/components/direct/mur-contenu";

/**
 * QUEL MUR OUVRIR, QUAND ON ARRIVE AVEC UN MÉTIER DANS L'ADRESSE.
 *
 * LA TABLE DE ROUTAGE ÉTAIT RECOPIÉE ICI, ET ELLE A DIVERGÉ. Le coiffeur et le
 * prêt-à-porter ont reçu leur mur dans `fantomes.ts` sans que cette copie soit
 * touchée : la maquette qui sert justement à JUGER les murs montrait encore les
 * anciens replis. Elle appelle maintenant `modeleDeLaBranche`, qui est la seule
 * table qui existe.
 */
export function Mur() {
  const [cle, setCle] = useState("margot");
  const mur = useMemo(() => MURS.find((m) => m.cle === cle) ?? MURS[0], [cle]);

  /**
   * MONTE APRÈS LE PREMIER RENDU, et pas avant. Lire l'adresse pendant le rendu
   * du serveur donnerait deux résultats différents des deux côtés, et React
   * refuserait l'hydratation.
   */
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("metier");
    if (m) setCle(modeleDeLaBranche(m));
  }, []);

  return (
    <div className="mu">
      <div className="mu-maq">
        {MURS.map((m) => (
          <button
            key={m.cle}
            type="button"
            className={m.cle === mur.cle ? "on" : ""}
            onClick={() => setCle(m.cle)}
          >
            {m.lieu}
          </button>
        ))}
      </div>

      {/* La page du commerce, derrière : elle donne son sens au mot « ici ». */}
      <header className="mu-fond">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mur.photoLieu} alt="" />
        <div className="mu-fond-v" aria-hidden="true" />
        <div className="mu-fond-b">
          <Link className="mu-fond-r" href="/autour-de-moi" prefetch={false}>
            ←
          </Link>
          <b>{mur.lieu}</b>
          <span className="mu-fond-c" aria-hidden="true">
            ♡
          </span>
        </div>
        <div className="mu-fond-t">
          <span className="mu-fond-k">{mur.metier}</span>
          <h1>{mur.lieu}</h1>
          <p>
            <i aria-hidden="true">★</i>
            <b>{mur.note}</b>
            <s>({mur.avis} avis)</s>
            <i aria-hidden="true">📍</i>
            {mur.distance}
          </p>
          <div className="mu-fond-e">
            {mur.etiquettes.map((e) => (
              <span key={e}>{e}</span>
            ))}
          </div>
        </div>
      </header>

      <section className="mu-feuille" aria-label="Votre fantôme">
        <MurContenu key={mur.cle} mur={mur} />
      </section>
    </div>
  );
}
