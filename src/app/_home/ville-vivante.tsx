"use client";

// LA VILLE QUI S'ALLUME AUTOUR DU FORMULAIRE.
//
// CE QU'ELLE RÉSOUT. Le titre promet « votre commerce, en direct dans votre
// ville » et la page montrait un formulaire de création de site. On comprenait
// ce qu'on allait obtenir ; on ne sentait pas le réseau derrière.
//
// DESSINÉE, PAS PHOTOGRAPHIÉE. La maquette d'origine posait une vue aérienne de
// Dax en fond. Trois raisons de ne pas le faire : cette page sert TOUTES les
// villes — un boulanger bordelais verrait Dax, et ça se remarque ; une photo
// aérienne nocturne pleine largeur est du poids au chargement sur le seul écran
// où la vitesse décide ; et la force de cette maquette ne venait pas de la
// photo mais des étiquettes flottantes reliées à des points. Ça se dessine, et
// c'est juste dans toutes les villes.
//
// ELLE S'ALLUME EN TROIS TEMPS, au rythme de la saisie : éteinte au départ, un
// point au nom, un deuxième à l'activité, et la ville entière quand il tape sa
// ville — avec CE QUI S'Y PASSE VRAIMENT.
//
// SUR TÉLÉPHONE, ELLE NE COÛTE PAS UN PIXEL AU-DESSUS DU CHAMP. Mesuré : sur un
// iPhone SE, le champ « Nom de votre établissement » commence déjà à 557 px sur
// 667 px d'écran. Il n'y a plus de place. Les points passent donc SOUS le
// bouton — et le schéma « autour du formulaire », qui n'a pas de « autour » sur
// 390 px de large, ne s'applique qu'à partir de 960 px.
import { useCallback, useEffect, useRef, useState } from "react";
import type { PoulsAccueil, PointVille } from "@/lib/direct/pouls-accueil";

/** Les gestes possibles, quand la ville n'a encore rien publié.
 *
 *  CE NE SONT PAS DES DONNÉES et ils ne portent AUCUN nombre : ce sont les
 *  choses qu'on peut dire. Y mettre des compteurs serait exactement le mensonge
 *  qu'on refuse — un chiffre inventé sur le premier écran que voit un
 *  commerçant. Sans nombre, c'est une promesse de mécanisme, et elle est vraie. */
const GESTES: PointVille[] = [
  { heure: "", qui: "", quoi: "Une place qui se libère", emoji: "🗓️" },
  { heure: "", qui: "", quoi: "La carte du jour", emoji: "🍽️" },
  { heure: "", qui: "", quoi: "Ce qu'il reste ce soir", emoji: "🏷️" },
  { heure: "", qui: "", quoi: "Une nouveauté en boutique", emoji: "🛍️" },
];

/** Où se pose chaque étiquette autour du formulaire, sur grand écran.
 *  Quatre ancrages fixes : les faire varier ferait sauter la page à chaque
 *  frappe, et on lit mal une chose qui bouge. */
const ANCRES = ["a1", "a2", "a3", "a4"] as const;

export function VilleVivante() {
  /** 0 = éteinte · 1 = le nom · 2 = l'activité · 3 = la ville est connue */
  const [palier, setPalier] = useState(0);
  const [pouls, setPouls] = useState<PoulsAccueil | null>(null);
  const dernier = useRef("");

  /** Ranger le résultat, à part de l'appel : une fonction qui appelle ET pose
   *  l'état dans le même effet fait tracer au compilateur React une mise à
   *  jour d'état depuis un effet. Deux fonctions, et le sujet disparaît.
   *
   *  UNE SEULE LECTURE POUR DEUX AFFICHAGES. La ligne d'état vit ailleurs dans
   *  la page (près du formulaire) alors que la constellation est en fond : deux
   *  composants, mais une seule requête, relayée par un événement. Deux appels
   *  séparés finiraient par afficher deux vérités différentes de la même ville. */
  const ranger = useCallback((p: PoulsAccueil | null) => {
    setPouls(p);
    window.dispatchEvent(new CustomEvent("clikme-pouls", { detail: p }));
  }, []);

  useEffect(() => {
    // LA SAISIE ARRIVE PAR ÉVÉNEMENT, et pas par une remontée d'état : le hero
    // est rendu par le serveur (c'est ce qui le rend rapide), et le passer en
    // composant client pour partager trois chaînes coûterait cette rapidité
    // sur le seul écran où elle décide.
    let minuteur = 0;
    let vivant = true;

    const surChamps = (e: Event) => {
      const d = (e as CustomEvent).detail as { nom?: string; activite?: string; ville?: string };
      const nom = (d?.nom || "").trim();
      const act = (d?.activite || "").trim();
      const ville = (d?.ville || "").trim();
      setPalier(ville.length >= 2 ? 3 : act.length >= 2 ? 2 : nom.length >= 1 ? 1 : 0);

      if (ville.length < 2) {
        dernier.current = "";
        ranger(null);
        return;
      }
      if (ville === dernier.current) return;
      dernier.current = ville;
      // ATTENDRE QU'IL AIT FINI DE TAPER. Sans ce délai, « Dax » produit trois
      // requêtes, dont deux pour des villes qui n'existent pas — et la
      // dernière arrivée gagne, pas la bonne.
      window.clearTimeout(minuteur);
      minuteur = window.setTimeout(async () => {
        try {
          const r = await fetch(`/api/direct/pouls-accueil?ville=${encodeURIComponent(ville)}`);
          const j = (await r.json()) as PoulsAccueil;
          // La ville a pu changer pendant l'attente du réseau : on ne pose que
          // la réponse encore attendue.
          if (vivant && j && dernier.current === ville) ranger(j);
        } catch {
          /* la ville reste éteinte : la page n'en dépend pas */
        }
      }, 480);
    };

    window.addEventListener("clikme-champs", surChamps as EventListener);
    return () => {
      vivant = false;
      window.clearTimeout(minuteur);
      window.removeEventListener("clikme-champs", surChamps as EventListener);
    };
  }, [ranger]);

  // CE QU'ON MONTRE. Des points VRAIS quand la ville en a ; les gestes
  // possibles sinon — jamais un nombre inventé pour combler.
  const vraie = Boolean(pouls?.vivante);
  const points = (vraie ? pouls!.points : GESTES).slice(0, 4);
  // Combien sont allumés : c'est le dévoilement progressif.
  const allumes = palier === 0 ? 0 : palier === 1 ? 1 : palier === 2 ? 2 : points.length;

  return (
    <div className={`vv vv-p${palier}`} aria-hidden="true">
      {/* AUCUN TEXTE UTILE N'EST ENFERMÉ ICI. `aria-hidden` parce que c'est une
          illustration : le lecteur d'écran entend déjà la promesse dans le
          titre, et lui lire quatre étiquettes flottantes à chaque frappe
          rendrait le formulaire impraticable. La ligne d'état ci-dessous, elle,
          est annoncée — c'est une information, pas un décor. */}
      <div className="vv-champ">
        {points.map((p, i) => (
          <span key={`${p.quoi}-${i}`} className={`vv-pt ${ANCRES[i]}${i < allumes ? " on" : ""}`}>
            <i className="vv-dot" />
            <span className="vv-fil" />
            <span className="vv-tag">
              <span className="vv-emo">{p.emoji}</span>
              <span className="vv-txt">
                {p.heure ? <b>{p.heure}</b> : null}
                <span>{p.qui ? `${p.qui} · ${p.quoi.toLowerCase()}` : p.quoi}</span>
              </span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * LA LIGNE QUI DIT LA VÉRITÉ SUR LA VILLE.
 *
 * Séparée de la constellation, et VISIBLE des lecteurs d'écran : c'est la seule
 * partie qui porte une information et non une décoration.
 *
 * LES DEUX ÉTATS SONT BONS, et c'est le cœur de cette fonctionnalité. Une ville
 * qui bouge le prouve ; une ville vide n'est pas un aveu, c'est une place à
 * prendre — « personne n'a encore rien publié aujourd'hui, vous seriez le
 * premier » est vrai, vérifiable, et plus motivant qu'un compteur gonflé.
 */
export function VilleEtat() {
  const [etat, setEtat] = useState<{ nom: string; vivante: boolean; total: number } | null>(null);
  const poser = useCallback((v: { nom: string; vivante: boolean; total: number } | null) => setEtat(v), []);

  useEffect(() => {
    const surPouls = (e: Event) => {
      const p = (e as CustomEvent).detail as PoulsAccueil | null;
      poser(p && p.nom ? { nom: p.nom, vivante: p.vivante, total: p.total } : null);
    };
    window.addEventListener("clikme-pouls", surPouls as EventListener);
    return () => window.removeEventListener("clikme-pouls", surPouls as EventListener);
  }, [poser]);

  if (!etat) return null;
  return (
    <p className="vv-etat" aria-live="polite">
      {etat.vivante ? (
        <>
          À <b>{etat.nom}</b>, en ce moment&nbsp;: {etat.total} chose{etat.total > 1 ? "s" : ""} à saisir.
        </>
      ) : (
        <>
          À <b>{etat.nom}</b>, personne n&apos;a encore rien publié aujourd&apos;hui. Vous seriez le premier.
        </>
      )}
    </p>
  );
}
