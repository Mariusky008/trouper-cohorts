"use client";

// 🪟 LA VITRINE VIVANTE — la vraie carte du produit, dans la page d'accueil.
//
// ═══ POURQUOI ELLE EXISTE ══════════════════════════════════════════════════
//
// « La page d'accueil est désuète. Il faut créer une ambiance très très sympa
// pour montrer le concept, qui est très novateur. »
//
// LE DÉFAUT N'ÉTAIT PAS LE GOÛT, C'ÉTAIT LA MÉTHODE. La page EXPLIQUAIT le
// produit — un titre, une phrase, trois petites boîtes « je vois / j'en parle /
// on y va », puis neuf mille points de captures d'écran commentées. Or ce
// produit ne se raconte pas : il se regarde. Une carte qui change de métier
// sous les yeux dit en quatre secondes ce que trois paragraphes ne disent pas.
//
// ═══ C'EST LA VRAIE CARTE, PAS UNE IMAGE ═══════════════════════════════════
//
// On monte `CarteSwipe` avec les vraies données du paquet. Une capture d'écran
// aurait vieilli au premier changement de design — et c'est exactement ce qui
// est arrivé à cette page, qui montrait encore un produit d'il y a deux mois et
// ne parlait ni de l'essai ni du fantôme. Ici, la vitrine ne peut pas mentir :
// elle affiche le composant que l'application affiche.
//
// ET ELLE DÉMONTRE LES NEUF LANGAGES SANS UN MOT. Un restaurant orange, un bar
// rose, une onglerie rose pâle, un tatoueur cuivre : le passage de l'un à
// l'autre EST la démonstration que chaque métier a sa voix. L'expliquer aurait
// demandé un paragraphe que personne ne lit.

import { useEffect, useMemo, useState } from "react";
import { CarteSwipe, StylesDirect } from "@/components/direct/carte-swipe";
import { carteAffichee, toutesLesCartes } from "@/lib/direct/apercu-habitant";

/**
 * L'HEURE EST FIXE, ET C'EST UNE OBLIGATION, PAS UN CHOIX.
 *
 * Cette page est prérendue : son HTML est écrit à la compilation. Calculer la
 * carte sur l'heure réelle donnerait un serveur à midi et un navigateur à dix-
 * huit heures, donc deux cartes différentes, donc une hydratation cassée — le
 * défaut exact trouvé sur la page de boutique, où « plutôt le jeudi » était le
 * jour du déploiement.
 *
 * MIDI EST AUSSI LA BONNE HEURE POUR UNE VITRINE : c'est le moment où le
 * produit a le plus à montrer.
 */
const HEURE = 12.5;

/** Le temps qu'une carte reste avant de céder la place. */
const TEMPS = 3400;

/**
 * QUI PASSE DANS LA VITRINE, ET L'ORDRE EST LE MESSAGE.
 *
 * UN RESTAURANT D'ABORD — c'est ce que tout le monde comprend sans effort, et
 * c'est la porte d'entrée du produit. PUIS TROIS MÉTIERS QU'ON N'ATTEND PAS
 * dans une application de ville : une onglerie, un tatoueur, une fleuriste.
 * C'est là que le visiteur comprend que ce n'est pas un guide de restaurants.
 *
 * QUATRE, PAS HUIT. Une vitrine qui montre tout ne montre rien : au-delà de
 * quatre, on cesse de regarder et on attend que ça s'arrête.
 *
 * LES NOMS SONT CEUX DU PAQUET, PAS CEUX DU MÉTIER. La fleuriste s'appelle
 * « fleur-marche ». Écrit « fleuriste », le filtre la jetait en silence et la
 * vitrine tournait à trois cartes sans que rien ne se plaigne — d'où la garde
 * plus bas, qui exige que les quatre soient trouvées.
 */
const VITRINE = ["emporter", "ongle-institut", "tatoueur", "fleur-marche"];

export function VitrineVivante() {
  const cartes = useMemo(() => {
    const toutes = toutesLesCartes();
    return VITRINE.map((id) => toutes.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => !!c)
      .map((c) => carteAffichee(c, HEURE));
  }, []);

  const [rang, setRang] = useState(0);
  /**
   * ON NE TOURNE QU'APRÈS LE MONTAGE, ET SEULEMENT SI L'ON VEUT BIEN DU
   * MOUVEMENT.
   *
   * Le premier rendu est le même des deux côtés — la première carte, toujours.
   * Et quelqu'un qui a demandé moins d'animations dans son système n'a pas
   * demandé moins d'informations : la vitrine s'arrête sur la première carte,
   * la page reste entière, et le reste de l'écran dit la même chose en mots.
   */
  useEffect(() => {
    if (cartes.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setRang((r) => (r + 1) % cartes.length), TEMPS);
    return () => window.clearInterval(t);
  }, [cartes.length]);

  if (!cartes.length) return null;

  return (
    <div className="ld-vitrine" aria-hidden="true">
      <StylesDirect />
      {/* LE CADRE DE TÉLÉPHONE EST DESSINÉ, PAS PHOTOGRAPHIÉ. Une image de
          téléphone pèse deux cents kilo-octets, vieillit avec les modèles, et
          impose sa propre couleur. Deux bordures arrondies suffisent, et elles
          s'adaptent à la largeur qu'on leur laisse. */}
      <div className="ld-vt">
        <span className="ld-vt-encoche" />
        <div className="ld-vt-ecran">
          {cartes.map((c, i) => (
            <div
              key={c.nom + i}
              className={`ld-vt-c${i === rang ? " on" : ""}`}
              // ON NE DÉMONTE PAS LES CARTES QUI ATTENDENT : leurs photos
              // restent chargées, donc le passage est instantané. Démonter
              // rechargerait l'image à chaque tour, et le premier tour serait
              // le seul beau.
            >
              <CarteSwipe carte={c} variante="seconde" />
            </div>
          ))}
        </div>
      </div>
      {/* LES PASTILLES DISENT COMBIEN IL EN RESTE. Sans elles, on ne sait pas
          si la vitrine tourne en boucle ou si elle s'est arrêtée. */}
      <div className="ld-vitrine-p">
        {cartes.map((c, i) => (
          <i key={c.nom + i} className={i === rang ? "on" : ""} />
        ))}
      </div>
    </div>
  );
}
