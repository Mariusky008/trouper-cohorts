"use client";

// 👻 LA NOTE EN FANTÔMES — un à cinq, le signe du produit à la place des étoiles.
//
// ═══ POURQUOI ELLE EXISTE ICI, ET PLUS SEULEMENT DANS LE MUR ═══════════════
//
// « C'est dommage, parce qu'on manque l'essentiel de ce que les autres ont pu
// mettre comme commentaires quand ils l'ont essayé, et aussi ils ont mis 1 à 5
// fantômes pour dire s'ils l'ont aimé, comme on l'a fait sur l'app démo. »
//
// LE DESSIN ÉTAIT ENFERMÉ DANS `mur-contenu.tsx`, en fonction locale. Les
// écrans de démarrage ne pouvaient donc pas l'utiliser, et la troisième étape
// des parcours montrait trois photos muettes là où l'application, elle, montre
// qui a essayé, ce que la personne en a dit, et combien de fantômes elle a mis.
// C'est la même extraction que le mot-marque et le Fantôme d'accueil, tirée
// pour la même raison : un dessin qui ne vit que dans un fichier n'existe que
// sur un écran.
//
// ═══ CINQ FANTÔMES PLUTÔT QU'UN CHIFFRE ═══════════════════════════════════
//
// « 4/5 » se lit comme une note de service. Quatre fantômes allumés sur cinq se
// lisent d'un coup d'œil ET disent de quel produit on parle — c'est le
// raisonnement écrit dans `mur-contenu.tsx`, et il vaut ici aussi.
//
// LE TRACÉ EST CELUI DU MUR, AU POINT PRÈS : mêmes coordonnées, mêmes classes
// internes `mu-f-*`. C'est ce qui permet au mur d'importer `SigneFantome` sans
// changer une seule de ses règles de style — elles visent ces noms-là.
//
// CE QUI DIFFÈRE, C'EST LA FEUILLE. Le mur peint ses fantômes depuis la
// feuille de l'application ; `NoteFantomes` porte la sienne, parce que les
// écrans de démarrage ne chargent pas cette feuille-là. Même leçon que la carte
// du Direct, sortie de la feuille de l'app le mois dernier : un composant qui
// dépend d'une feuille lointaine s'affiche nu dès qu'on le déplace.

/**
 * LE PICTOGRAMME DU FANTÔME — corps, deux yeux, une bouche.
 *
 * `coeur` remplace les yeux par deux cœurs : c'est le cinquième de la rangée.
 * « Coup de cœur » n'est pas « cinq sur cinq », et cinq dessins identiques
 * auraient rendu cette différence invisible.
 */
export function SigneFantome({ classe, coeur }: { classe?: string; coeur?: boolean }) {
  return (
    <svg className={classe} viewBox="0 0 40 44" aria-hidden="true">
      <path
        className="mu-f-corps"
        d="M20 2.5c-8.7 0-15.6 6.6-15.6 15.1v18.6c0 2.2 2.3 3.3 3.9 1.9l2.4-2.1c.9-.8 2.2-.8 3.1 0l2.3 2c.9.8 2.2.8 3.1 0l2.3-2c.9-.8 2.2-.8 3.1 0l2.4 2.1c1.6 1.4 3.9.3 3.9-1.9V17.6C35.6 9.1 28.7 2.5 20 2.5Z"
      />
      {coeur ? (
        <>
          <path
            className="mu-f-oeil"
            d="M14.4 21.1 11.9 18.7a1.75 1.75 0 0 1 0-2.5 1.75 1.75 0 0 1 2.5 0 1.75 1.75 0 0 1 2.5 0 1.75 1.75 0 0 1 0 2.5Z"
          />
          <path
            className="mu-f-oeil"
            d="M25.6 21.1 23.1 18.7a1.75 1.75 0 0 1 0-2.5 1.75 1.75 0 0 1 2.5 0 1.75 1.75 0 0 1 2.5 0 1.75 1.75 0 0 1 0 2.5Z"
          />
        </>
      ) : (
        <>
          <ellipse className="mu-f-oeil" cx="14.4" cy="18.4" rx="2.1" ry="2.6" />
          <ellipse className="mu-f-oeil" cx="25.6" cy="18.4" rx="2.1" ry="2.6" />
        </>
      )}
      <path className="mu-f-bouche" d="M16.2 25.6c1 1.5 2.3 2.2 3.8 2.2s2.8-.7 3.8-2.2" />
    </svg>
  );
}

/**
 * LA RANGÉE DE CINQ, dont `note` sont allumés.
 *
 * ELLE PORTE SON NOM POUR LES LECTEURS D'ÉCRAN, parce que cinq dessins muets ne
 * se lisent pas à la voix. « Quatre fantômes sur cinq » dit la même chose que
 * la rangée, dans l'autre sens.
 */
export function NoteFantomes({ note, classe = "" }: { note: number; classe?: string }) {
  return (
    <>
      {/* LA FEUILLE EST A COTE DE LA RANGEE, PAS DEDANS. Placee dans le <b>,
          elle en devenait le contenu texte : tout lecteur qui demandait « que
          dit cette legende ? » recevait le CSS. C'est invisible a l'ecran et
          faux partout ailleurs — dans un lecteur d'ecran, dans un copier-
          coller, dans une garde qui relit la page. */}
      <b className={`nf ${classe}`.trim()} aria-label={`${note} fantômes sur 5`}>
        {Array.from({ length: 5 }, (_, k) => (
          <SigneFantome key={k} classe={k < note ? "nf-s on" : "nf-s"} coeur={k === 4} />
        ))}
      </b>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
           litteral de gabarit et un seul terminerait la chaine.
           npm run verifier:styles le mesure avant chaque construction. */
        .nf{display:inline-flex;align-items:center;gap:1.5px;flex:none;}
        /* ETEINTS, ILS RESTENT VISIBLES. Les faire apparaitre a la selection
           rendrait la rangee impossible a anticiper — or c'est son travail :
           on doit voir qu'il y en a cinq avant d'en compter quatre. */
        .nf-s{width:12.5px;height:13.5px;opacity:.32;}
        .nf-s .mu-f-corps{fill:#8A93A8;}
        .nf-s .mu-f-oeil{fill:#0A1210;}
        .nf-s .mu-f-bouche{fill:none;stroke:#0A1210;stroke-width:2.2;
          stroke-linecap:round;}
        /* ALLUMES, ILS PRENNENT LE FUCHSIA DE LA CHARTE — le meme que le halo
           du Fantome d'accueil et le trait sous le titre. */
        .nf-s.on{opacity:1;}
        .nf-s.on .mu-f-corps{fill:#FF2E9A;}
        .nf-s.on .mu-f-oeil{fill:#1A0416;}
        .nf-s.on .mu-f-bouche{stroke:#1A0416;}
      `,
        }}
      />
    </>
  );
}
