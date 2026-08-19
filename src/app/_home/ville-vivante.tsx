"use client";

// LA VILLE QUI S'ALLUME AUTOUR DU FORMULAIRE.
//
// CE QU'ELLE RÉSOUT. Le titre promet « votre commerce, en direct dans votre
// ville » et la page montrait un formulaire de création de site. On comprenait
// ce qu'on allait obtenir ; on ne sentait pas le réseau derrière.
//
// ELLE MONTRE LA VILLE À PLEIN RÉGIME, PAS LE RELEVÉ DU JOUR — et c'est une
// décision de produit assumée. Elle lisait d'abord le fil réel de la ville
// tapée dans le formulaire : au lancement, ce fil est vide, et le premier
// restaurateur qui regardait recevait la démonstration qu'il n'avait aucune
// raison de s'inscrire. Il vient précisément pour voir ce qu'il rejoint.
//
// CE QUI REND ÇA HONNÊTE : la ligne sous le formulaire est AU FUTUR. « Voilà ce
// que Le Direct de Dax montrera » est vrai ; « à Dax, en ce moment » ne
// l'aurait pas été. Le prospect voit une projection annoncée comme telle.
//
// DESSINÉE, PAS PHOTOGRAPHIÉE. La maquette d'origine posait une vue aérienne de
// Dax en fond. Trois raisons de ne pas le faire : cette page sert TOUTES les
// villes — un boulanger bordelais verrait Dax, et ça se remarque ; une photo
// aérienne nocturne pleine largeur est du poids au chargement sur le seul écran
// où la vitesse décide ; et la force de cette maquette ne venait pas de la
// photo mais des étiquettes reliées à des points. Ça se dessine, et c'est juste
// dans toutes les villes.
//
// ELLE S'ALLUME EN TROIS TEMPS, au rythme de la saisie : éteinte au départ, un
// point au nom, un deuxième à l'activité, et la ville entière à la ville.
//
// SUR TÉLÉPHONE, ELLE NE COÛTE PAS UN PIXEL AU-DESSUS DU CHAMP. Mesuré : le
// champ « Nom de votre établissement » commence déjà à 473 px sur les 667 px
// d'un iPhone SE. Les points passent donc SOUS le bouton — et le schéma
// « autour du formulaire », qui n'a pas de « autour » sur 390 px de large, ne
// s'applique qu'à partir de 960 px.
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { villeVitrine, phraseVitrine, type EvenementVitrine } from "@/lib/direct/ville-vitrine";

/** L'INSTANT DU VISITEUR, FIGÉ AU CHARGEMENT.
 *
 *  La vitrine dépend de l'heure — les menus à midi, les créneaux l'après-midi —
 *  donc le serveur et le navigateur ne calculeraient pas la même liste, et React
 *  remonterait tout le bloc à l'hydratation. `useSyncExternalStore` est fait
 *  exactement pour ça : il rend l'instantané du serveur pendant l'hydratation,
 *  puis celui du client. Aucun avertissement, aucune remontée.
 *
 *  Et il est FIGÉ : un instantané qui changerait à chaque lecture ferait boucler
 *  le rendu. Une vitrine n'a pas besoin de suivre l'horloge à la seconde. */
const CLIENT_MS = typeof window === "undefined" ? 0 : Date.now();
const jamais = () => () => {};

/** Où se pose chaque étiquette autour du formulaire, sur grand écran.
 *  Quatre ancrages fixes : les faire varier ferait sauter la page à chaque
 *  frappe, et on lit mal une chose qui bouge. */
const ANCRES = ["a1", "a2", "a3", "a4"] as const;

export function VilleVivante() {
  /** 0 = éteinte · 1 = le nom · 2 = l'activité · 3 = la ville est nommée */
  const [palier, setPalier] = useState(0);
  // Les cartes, à l'heure du visiteur. Calculées pendant le rendu et non dans
  // un effet : poser un état depuis un effet est précisément ce que le
  // compilateur React refuse, et l'instantané ci-dessus rend la chose inutile.
  const ms = useSyncExternalStore(jamais, () => CLIENT_MS, () => 0);
  const cartes: EvenementVitrine[] = useMemo(() => villeVitrine(new Date(ms), 4), [ms]);

  useEffect(() => {
    // LA SAISIE ARRIVE PAR ÉVÉNEMENT, et pas par une remontée d'état : le hero
    // est rendu par le serveur (c'est ce qui le rend rapide), et le passer en
    // composant client pour partager trois chaînes coûterait cette rapidité
    // sur le seul écran où elle décide.
    const surChamps = (e: Event) => {
      const d = (e as CustomEvent).detail as { nom?: string; activite?: string; ville?: string };
      const nom = (d?.nom || "").trim();
      const act = (d?.activite || "").trim();
      const ville = (d?.ville || "").trim();
      setPalier(ville.length >= 2 ? 3 : act.length >= 2 ? 2 : nom.length >= 1 ? 1 : 0);
    };
    window.addEventListener("clikme-champs", surChamps as EventListener);
    return () => window.removeEventListener("clikme-champs", surChamps as EventListener);
  }, []);

  // Combien sont allumées : c'est le dévoilement progressif.
  const allumes = palier === 0 ? 0 : palier === 1 ? 1 : palier === 2 ? 2 : cartes.length;

  return (
    <div className={`vv vv-p${palier}`} aria-hidden="true">
      {/* AUCUN TEXTE UTILE N'EST ENFERMÉ ICI. `aria-hidden` parce que c'est une
          illustration : le lecteur d'écran entend déjà la promesse dans le
          titre, et lui lire quatre étiquettes flottantes à chaque frappe
          rendrait le formulaire impraticable. La ligne d'état ci-dessous, elle,
          est annoncée — c'est une information, pas un décor. */}
      <div className="vv-champ">
        {cartes.map((c, i) => (
          <span key={`${c.quoi}-${i}`} className={`vv-pt ${ANCRES[i]}${i < allumes ? " on" : ""}${c.urgent ? " vv-u" : ""}`}>
            <i className="vv-dot" />
            <span className="vv-fil" />
            <span className="vv-tag">
              <span className="vv-emo">{c.emoji}</span>
              <span className="vv-txt">
                <b>{c.heure}</b>
                <span>
                  <em>{c.nombre}</em> {c.quoi}
                </span>
              </span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * LA LIGNE QUI DIT CE QU'ON REGARDE.
 *
 * Séparée de la constellation, et VISIBLE des lecteurs d'écran : c'est la seule
 * partie qui porte une information et non une décoration.
 *
 * ELLE EST AU FUTUR, et c'est tout ce qui sépare une projection d'une fausse
 * mesure. Les chiffres de la constellation ne sont pas relevés : ils montrent
 * ce que Le Direct affichera quand les commerces de la ville y seront. Écrire
 * « en ce moment » au-dessus des mêmes chiffres serait un relevé inventé.
 */
export function VilleEtat() {
  const [ville, setVille] = useState("");
  const poser = useCallback((v: string) => setVille(v), []);

  useEffect(() => {
    const surChamps = (e: Event) => {
      const d = (e as CustomEvent).detail as { ville?: string };
      const v = (d?.ville || "").trim();
      poser(v.length >= 2 ? v : "");
    };
    window.addEventListener("clikme-champs", surChamps as EventListener);
    return () => window.removeEventListener("clikme-champs", surChamps as EventListener);
  }, [poser]);

  if (!ville) return null;
  return (
    <p className="vv-etat" aria-live="polite">
      {phraseVitrine(ville)}
    </p>
  );
}
