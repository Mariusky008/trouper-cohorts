"use client";

// 👥 LA SECTION DU MUR — ce que le produit a de plus fort, et qui manquait.
//
// ═══ POURQUOI ELLE EXISTE ══════════════════════════════════════════════════
//
// « Maintenant qu'on a pas mal d'exemples et que le concept a évolué, fais les
// modifs nécessaires et les écrans différents qu'on a poussés. »
//
// LA PAGE S'ARRÊTAIT À L'ESSAI, ET LE PRODUIT NE S'Y ARRÊTE PLUS. Elle disait
// trois choses : votre ville bouge, essayez sur vous, puis vos amis en parlent.
// C'était vrai le jour où elle a été écrite. Depuis, la chose la plus rare que
// ce produit sache faire est ailleurs : DOUZE PERSONNES PORTENT LE MÊME DESSIN,
// et on peut les voir avant de décider.
//
// AUCUNE SIMULATION NE VAUT ÇA, et c'est le seul argument de cette page qu'un
// concurrent ne peut pas copier en un trimestre. Une IA qui pose un tatouage
// sur une photo, tout le monde en aura une l'an prochain. Douze personnes de
// Dax qui portent ce tatouage-là et disent où elles l'ont mis, personne ne les
// a — il faut les avoir tatouées.
//
// ═══ ET C'EST AUSSI LA RÈGLE DU FANTÔME, MONTRÉE PLUTÔT QU'ÉCRITE ══════════
//
// « Le fantôme amène sur l'essayage quand personne n'a encore essayé, mais
// quand une ou plusieurs personnes ont essayé, alors il amène sur le mur des
// clients. » C'est une règle simple et elle ne se raconte pas : on la MONTRE en
// deux temps — le mur vide qui propose d'essayer, le mur rempli qui propose de
// regarder — et on comprend sans légende.
//
// ═══ CE QUE CETTE SECTION NE FAIT PAS ══════════════════════════════════════
//
// ELLE N'INVENTE AUCUN NOMBRE. Douze photos dans le dépôt, douze vignettes ici,
// « douze » écrit dans le titre. Le jour où il y en a trente, on change les
// trois au même endroit. Fabriquer « 324 essayages » sur une page d'accueil est
// exactement ce qu'on a refusé de faire dans l'application.

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Fantome } from "./fantome";

/**
 * LES DOUZE, ET CE QU'ELLES DISENT.
 *
 * CE SONT LES MÊMES QUE DANS L'APPLICATION — mêmes photos, mêmes prénoms,
 * mêmes endroits du corps que le mur du tatoueur dans `fantomes.ts`. Deux
 * listes auraient divergé au premier ajout, et la page aurait fini par montrer
 * des gens que l'application ne connaît pas.
 *
 * ON N'EN MONTRE QUE SIX ICI, et le compte dit qu'il y en a douze : une page
 * d'accueil montre assez pour donner envie d'ouvrir, pas tout.
 */
const PORTENT: { photo: string; qui: string; ou: string; alt: string }[] = [
  { photo: "/direct/tatouB.jpg", qui: "Yanis", ou: "Avant-bras", alt: "Le tatouage sur un avant-bras, avec un fond de nuages bleus." },
  { photo: "/direct/tatouA.jpg", qui: "Maëlys", ou: "Cuisse", alt: "Le même tatouage sur une cuisse." },
  { photo: "/direct/tatouC.jpg", qui: "Brice", ou: "Mollet", alt: "Le même tatouage sur un mollet." },
  { photo: "/direct/tatouG.jpg", qui: "Théo", ou: "Noir et gris", alt: "Le même tatouage, réalisé en noir et gris, sur un avant-bras." },
  { photo: "/direct/tatouD.jpg", qui: "Lou", ou: "Poignet", alt: "Le même tatouage en petit format, sur un poignet." },
  { photo: "/direct/tatouK.jpg", qui: "Eliott", ou: "Grand format", alt: "Le même tatouage en grand format sur un mollet." },
];

/** Ce que le compte dit, et il dit la vérité : voir l'en-tête. */
const COMBIEN = 12;

/**
 * LES DEUX TEMPS DE LA RÈGLE.
 *
 * ILS NE SE RACONTENT PAS, ILS S'ALTERNENT. Le premier montre un fantôme sur
 * une annonce que personne n'a encore essayée : il mène à l'essai. Le second
 * montre la même annonce une fois que des gens l'ont fait : le même fantôme
 * mène à leur mur. C'est la même image, le même geste, et la conséquence
 * change — c'est exactement ce qu'il faut comprendre.
 */
const TEMPS: { titre: string; quoi: string; geste: string }[] = [
  {
    titre: "Personne n’a encore essayé",
    quoi: "Le Fantôme vous emmène l’essayer sur vous.",
    geste: "Essayer sur moi",
  },
  {
    titre: "Douze personnes l’ont fait",
    quoi: "Le même Fantôme vous emmène le voir sur elles.",
    geste: "Voir les douze",
  },
];

export function Mur() {
  const [temps, setTemps] = useState(0);
  const [part, setPart] = useState(false);
  const racine = useRef<HTMLDivElement | null>(null);

  /**
   * ELLE NE DÉMARRE QU'UNE FOIS ARRIVÉE À L'ÉCRAN, comme la section 3 : une
   * alternance qui tourne depuis trois minutes quand on arrive dessus a déjà
   * raconté son histoire à personne.
   */
  useEffect(() => {
    const el = racine.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setTemps(1);
      return;
    }
    const o = new IntersectionObserver(
      (e) => {
        if (e.some((x) => x.isIntersecting)) {
          setPart(true);
          o.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    o.observe(el);
    return () => o.disconnect();
  }, []);

  useEffect(() => {
    if (!part) return;
    // TROIS SECONDES SUR LE PREMIER, QUATRE SUR LE SECOND. Le second porte la
    // nouveauté — c'est lui qu'on doit avoir le temps de lire.
    const t = window.setTimeout(() => setTemps((v) => (v + 1) % 2), temps === 0 ? 3000 : 4200);
    return () => window.clearTimeout(t);
  }, [part, temps]);

  const t = TEMPS[temps];

  return (
    <div className="ld-mur" ref={racine}>
      <div className="ld-mur-g">
        <p className="ld-oeil v" data-r>
          Avant de vous décider
        </p>
        <h2 className="ld-t2" data-r style={{ "--d": "70ms" } as React.CSSProperties}>
          Voyez-le sur
          <span>de vraies personnes.</span>
        </h2>
        <p className="ld-p" data-r style={{ "--d": "140ms" } as React.CSSProperties}>
          Un tatouage ne se refait pas. Une coupe, on la garde trois mois. Avant
          de décider, on veut voir ce que ça donne ailleurs que sur une
          planche&nbsp;: sur des gens, à des endroits différents, en vrai.
        </p>

        {/* ═══ LA RÈGLE DU FANTÔME, MONTRÉE EN DEUX TEMPS ══════════════════
            Elle ne se raconte pas : le même geste, deux situations, et la
            conséquence change. On comprend sans légende. */}
        <div className="ld-mur-r" data-r style={{ "--d": "210ms" } as React.CSSProperties}>
          <div className="ld-mur-rf" aria-hidden="true">
            <Fantome classe="ld-f-mur" />
          </div>
          <div className="ld-mur-rt" aria-live="polite">
            <b>{t.titre}</b>
            <em>{t.quoi}</em>
            <s>
              {t.geste}
              <i aria-hidden="true">→</i>
            </s>
          </div>
        </div>
      </div>

      {/* ═══ LE MUR LUI-MÊME, AVEC SES VRAIES PHOTOS ════════════════════════
          Six vignettes et un compte qui dit combien il y en a vraiment. Le
          chiffre vient du dépôt, pas d'une envie de faire nombre. */}
      <div className="ld-mur-d" data-r style={{ "--d": "120ms" } as React.CSSProperties}>
        <p className="ld-mur-t">
          <b>
            {COMBIEN} personnes portent déjà ce dessin
          </b>
          <em>Chez un tatoueur de Dax · Le même flash, douze endroits du corps</em>
        </p>
        <ul className="ld-mur-gr">
          {PORTENT.map((p) => (
            <li key={p.photo}>
              <Image src={p.photo} alt={p.alt} width={220} height={260} sizes="(max-width:760px) 32vw, 160px" />
              <span>
                <b>{p.qui}</b>
                <em>{p.ou}</em>
              </span>
            </li>
          ))}
        </ul>
        <p className="ld-mur-p">
          <Fantome classe="ld-f-mur2" />
          Et {COMBIEN - PORTENT.length} autres, avec ce qu’elles en ont pensé.
        </p>
      </div>
    </div>
  );
}
