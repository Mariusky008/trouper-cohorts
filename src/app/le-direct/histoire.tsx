"use client";

// 🏠 LA PAGE D'ACCUEIL — d'après la maquette du propriétaire du produit.
//
// ═══ CE QU'ELLE REMPLACE, ET POURQUOI ══════════════════════════════════════
//
// « Oula, c'est beaucoup trop compliqué à comprendre, ça manque de simplicité !
// J'ai fait un mock-up que tu peux répliquer et animer. »
//
// MA VERSION AVAIT SIX CHAPITRES, ET CHACUN DÉMONTRAIT UNE CHOSE VRAIE. Il en
// résultait une page qu'il fallait LIRE, et personne ne lit une page d'accueil.
// La maquette dit la même chose en quatre écrans et trois phrases, et elle
// donne un objet à manipuler au lieu d'un argumentaire. Elle a raison.
//
// CE QUI EST REPRIS DE LA MAQUETTE, TRAIT POUR TRAIT : l'alternance sombre /
// clair / clair / sombre / clair, le titre en deux tons, le téléphone incliné
// dans l'ouverture, la colonne des métiers cliquables, la rangée d'icônes de la
// bande sombre, les annotations manuscrites, et le violet comme couleur
// dominante.
//
// ═══ TROIS ÉCARTS, ET CHACUN EST MOTIVÉ ═══════════════════════════════════
//
//   1. « TÉLÉCHARGER L'APP » ET LES DEUX BADGES DE MAGASIN NE MÈNENT NULLE
//      PART, parce qu'il n'y a pas d'application à télécharger. Un bouton de
//      téléchargement qui ne télécharge rien est la seule chose qu'une page
//      d'accueil ne peut pas se permettre : c'est la promesse la plus concrète
//      qu'elle fait, et la rompre coûte tout le reste. Les badges restent
//      DESSINÉS mais marqués « bientôt », et le bouton de la barre ouvre
//      l'essai — ce qui est ce que la page promet vraiment.
//   2. LE TITRE REVIENT AU DIRECT (« Votre ville bouge »), alors qu'on avait
//      arbitré l'inverse deux échanges plus tôt : l'essai en titre parce qu'il
//      est l'hameçon, le direct en second parce qu'il est la rétention. La
//      maquette tranche autrement et c'est le droit de son auteur ; l'essai
//      reste en section 2, très haut. Signalé plutôt que corrigé en douce.
//   3. PAS DE PHOTO DE VILLE EN FOND. Le dépôt n'en contient aucune qui
//      respecte sa propre règle — ni enseigne lisible, ni visage. On pose donc
//      une texture chaude, floutée et assombrie, et le jour où une photo de Dax
//      arrive elle prend sa place en une ligne.

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Essayer } from "./essayer";
import { EncresDuFantome, Fantome } from "./fantome";
import { Ouverture } from "./ouverture";
import { Suite } from "./suite";

/**
 * L'ADRESSE DU BOUTON, ÉCRITE UNE FOIS.
 *
 * `?essai=1` OUVRE L'APPLICATION DIRECTEMENT SUR L'ESSAI. Un bouton qui promet
 * « essayez sur vous » et livre vingt-quatre annonces perd la moitié des gens
 * entre la promesse et la preuve.
 */
const ESSAYER = "/autour-de-moi?carte=coif-centre&essai=1";
const OUVRIR = "/autour-de-moi";

/**
 * LES SEPT FAMILLES DE LA BANDE SOMBRE.
 *
 * ELLES DISENT L'ÉTENDUE, ET RIEN D'AUTRE. C'est le seul endroit de la page où
 * l'on énumère — et il est placé tout à la fin, après trois démonstrations,
 * parce qu'une énumération placée avant une preuve se lit comme un catalogue.
 */
const FAMILLES: [string, string][] = [
  ["🍽️", "Restaurants"],
  ["👗", "Mode"],
  ["🍸", "Bars"],
  ["✂️", "Services"],
  ["🎪", "Événements"],
  ["✨", "Créateurs"],
  ["···", "Et bien plus…"],
];

/**
 * CE QUI APPARAÎT QUAND ON ARRIVE DESSUS.
 *
 * Un seul observateur pour toute la page, et il LÂCHE ce qu'il a révélé :
 * l'animation ne se rejoue pas quand on remonte. Une page qui se réanime à
 * chaque passage donne le mal de mer et empêche de relire.
 */
function useRevelation() {
  const racine = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = racine.current;
    if (!el) return;
    const cibles = el.querySelectorAll<HTMLElement>("[data-r]");
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      cibles.forEach((c) => c.classList.add("vu"));
      return;
    }
    const o = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("vu");
          o.unobserve(e.target);
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );
    cibles.forEach((c) => o.observe(c));
    return () => o.disconnect();
  }, []);
  return racine;
}

/**
 * LA MARQUE, ET C'EST LE VRAI LOGO.
 *
 * « Le logo de ClikMe n'est pas le bon, il me semble. » Il ne l'était pas : la
 * barre portait une GOUTTE DE CARTE dessinée à la main, violette, suivie du mot
 * « ClikMe » en caractères de la page. Un repère de carte est le logo de tout le
 * monde ; celui de ClikMe existe depuis le début du dépôt — le mot en minuscules
 * dont le K est une flèche de curseur verte, c'est-à-dire le clic qui donne son
 * nom au produit.
 *
 * DEUX FICHIERS PARCE QU'IL Y A DEUX FONDS : les lettres sont blanches sur la
 * barre sombre, encre sur le pied clair. La flèche verte est la même dans les
 * deux. Les redessiner en SVG « pour économiser une image » ferait un troisième
 * logo qui divergerait au premier ajustement, et c'est toujours celui qu'on ne
 * regarde pas qui prend du retard.
 */
function Marque({ clair = false }: { clair?: boolean }) {
  return (
    <Link href="/le-direct" className={`ld-marque${clair ? " grand" : ""}`}>
      <Image
        src={clair ? "/clikme-logo.png" : "/clikme-logo-blanc.png"}
        alt="ClikMe"
        width={800}
        height={322}
        priority={!clair}
        sizes={clair ? "168px" : "112px"}
      />
    </Link>
  );
}

export function Histoire() {
  const racine = useRevelation();

  /**
   * L'APPLICATION S'OUVRE DANS LA PAGE, ET NON À LA PLACE.
   *
   * LE DÉFAUT, ET IL EST DE CEUX QUI COÛTENT TOUT : « quand je clique dessus
   * je pars sur une autre page et je ne peux pas revenir facilement, et sur
   * téléphone on sait que si la personne part elle ne reviendra plus ». Une
   * page d'accueil dont le seul bouton est une porte de sortie sans poignée de
   * retour dépense en une seconde tout ce qu'elle a mis deux minutes à
   * construire.
   *
   * LE LIEN RESTE UN VRAI LIEN. On intercepte l'appui, mais l'adresse est
   * écrite : un appui long, un clic du milieu ou « ouvrir dans un nouvel
   * onglet » continuent de marcher, et la page reste utilisable sans
   * JavaScript.
   */
  const [essai, setEssai] = useState<string | null>(null);
  useEffect(() => {
    if (!essai) return;
    /* ON FIGE LA PAGE À SA POSITION, ON NE COUPE PAS SON DÉFILEMENT. DÉFAUT
       MESURÉ : overflow:hidden sur le corps bloque bien, mais fait retomber le
       document à zéro — 968 points avant, 0 après. Quelqu'un qui essayait
       depuis le bas de la page la refermait tout en haut, c'est-à-dire nulle
       part. */
    const y = window.scrollY;
    const avant = {
      position: document.body.style.position,
      top: document.body.style.top,
      largeur: document.body.style.width,
    };
    document.body.style.position = "fixed";
    document.body.style.top = `-${y}px`;
    document.body.style.width = "100%";
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEssai(null);
    };
    window.addEventListener("keydown", auClavier);
    return () => {
      document.body.style.position = avant.position;
      document.body.style.top = avant.top;
      document.body.style.width = avant.largeur;
      // INSTANTANÉ : la feuille globale du site pose scroll-behavior:smooth sur
      // la racine, et sans ce mot refermer l'essai déclenchait un défilement
      // animé d'une seconde depuis le haut — mesuré, 75 points à 200 ms.
      window.scrollTo({ top: y, behavior: "instant" });
      window.removeEventListener("keydown", auClavier);
    };
  }, [essai]);

  const ouvrir = (url: string) => (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setEssai(url);
  };

  return (
    <div ref={racine}>
      {/* LES ENCRES DU FANTÔME, UNE FOIS POUR TOUTE LA PAGE, ET TOUT EN HAUT.
          Elles étaient dans chaque fantôme, avec les mêmes identifiants : le
          navigateur ne retenait que le premier, et le premier de cette page est
          celui de l'ouverture, caché en dessous de 900 points. Résultat mesuré
          sur téléphone — tous les fantômes de la page étaient sans corps et sans
          yeux. Le raisonnement complet est dans `fantome.tsx`. */}
      <EncresDuFantome />

      {/* ═══ LA BARRE ═════════════════════════════════════════════════════ */}
      <header className="ld-nav">
        <Marque />
        <nav className="ld-nav-l" aria-label="Sections">
          <a href="#essayer">Découvrir</a>
          <a href="#ensemble">Comment ça marche</a>
          {/* LE BOUTON DE LA BARRE OUVRE L'ESSAI, PAS UN TÉLÉCHARGEMENT. Voir
              l'en-tête : il n'y a pas d'application à télécharger, et un bouton
              de téléchargement qui ne télécharge rien est la promesse la plus
              concrète qu'une page puisse rompre. */}
          <Link href={ESSAYER} className="ld-cta petit" onClick={ouvrir(ESSAYER)}>
            Essayer l’app
            <s aria-hidden="true">→</s>
          </Link>
        </nav>
      </header>

      {/* ═══ 1 · L'OUVERTURE ══════════════════════════════════════════════ */}
      <section className="ld-hero">
        <div className="ld-hero-fond" aria-hidden="true" />
        <div className="ld-hero-in">
          <div className="ld-hero-mot">
            <p className="ld-oeil" data-r>
              Commerçants, événements, services, sorties…
            </p>
            {/* LE TITRE ET SA SUITE SONT DE SA MAIN, MOT POUR MOT. « Votre ville
                bouge. Voyez ce qui s'y passe. » — et la phrase dessous dit la
                seule chose que personne d'autre ne fait. C'est pour elle que le
                verbe est mis en avant : on peut voir ce qui se passe autour de
                soi dans dix applications, on ne peut l'ESSAYER nulle part. */}
            <h1 className="ld-t1" data-r style={{ "--d": "70ms" } as React.CSSProperties}>
              Votre ville bouge.
              <span>Voyez ce qui s’y passe.</span>
            </h1>
            <p className="ld-s" data-r style={{ "--d": "140ms" } as React.CSSProperties}>
              <b>Le Direct</b> vous montre en temps réel ce qui est disponible
              autour de vous et vous permet de l’<b className="ld-fort">essayer</b>{" "}
              virtuellement.
            </p>
            <div className="ld-hero-b" data-r style={{ "--d": "210ms" } as React.CSSProperties}>
              <Link href={OUVRIR} className="ld-cta grand" onClick={ouvrir(OUVRIR)}>
                Découvrir le Direct
                <s aria-hidden="true">→</s>
              </Link>
            </div>
            {/* LE FANTÔME OUVRE LA PAGE, ET IL REGARDE LE TÉLÉPHONE. C'est le
                même personnage que le bouton vert de la barre du bas, sur la
                capture à côté : on le voit ici en grand, puis on le retrouve à
                sa place dans l'application, et on comprend sans légende sur quoi
                il faut appuyer. */}
            <div className="ld-hero-f" aria-hidden="true">
              <Fantome classe="ld-f-hero" regarde="droite" />
              <p className="ld-main f">
                C’est lui qui
                <br />
                vous essaie tout.
              </p>
            </div>
          </div>

          {/* LE TÉLÉPHONE DE LA MAQUETTE, ET IL MONTRE LE GESTE. « J'aurais aimé
              plutôt qu'il ait le fantôme et la barre de menu du bas, pour
              montrer dans l'animation que lorsqu'on clique sur le fantôme on
              peut essayer le produit. » */}
          <div className="ld-hero-tel" data-r style={{ "--d": "280ms" } as React.CSSProperties}>
            <Ouverture />
          </div>
        </div>
      </section>

      {/* ═══ 2 · L'ESSAI — LA SECTION QU'ON MANIPULE ══════════════════════ */}
      <section className="ld-clair" id="essayer">
        <div className="ld-deux">
          <div className="ld-deux-g" data-r>
            <Essayer />
          </div>
          <div className="ld-deux-d">
            <p className="ld-oeil v" data-r>
              Essayez avant de vous déplacer
            </p>
            <h2 className="ld-t2" data-r style={{ "--d": "70ms" } as React.CSSProperties}>
              Visualisez le résultat
              <span>sur vous.</span>
            </h2>
            <p className="ld-p" data-r style={{ "--d": "140ms" } as React.CSSProperties}>
              Une coupe, une tenue, des ongles, un tatouage… Découvrez à quoi ça
              ressemble sur vous, grâce à l’IA.
            </p>
            <Link
              href={ESSAYER}
              className="ld-creux"
              data-r
              style={{ "--d": "210ms" } as React.CSSProperties}
              onClick={ouvrir(ESSAYER)}
            >
              Voir comment ça marche
              <s aria-hidden="true">→</s>
            </Link>
          </div>
          <div className="ld-deux-f" aria-hidden="true">
            <p className="ld-main b">
              Il essaie pour vous,
              <br />
              avant que vous sortiez.
            </p>
            <Fantome classe="ld-f-marge" regarde="gauche" />
          </div>
        </div>
      </section>

      {/* ═══ 3 · CE QUI SE PASSE APRÈS L'ESSAI ════════════════════════════
          LA SECTION LA PLUS IMPORTANTE DE LA PAGE, et c'est lui qui l'a dit :
          « cette étape est cruciale pour que l'histoire narrative ait un sens ».
          Elle est jouée et non racontée — son raisonnement complet est dans
          `suite.tsx`, qui tient à la fois le chemin de A à Z et le téléphone. */}
      <section className="ld-clair gris" id="ensemble">
        <Suite />
        <p className="ld-suite-b">
          <Link href={ESSAYER} className="ld-creux" onClick={ouvrir(ESSAYER)}>
            Faire tout ça maintenant
            <s aria-hidden="true">→</s>
          </Link>
        </p>
      </section>

      {/* ═══ 4 · PARTOUT AVEC VOUS ════════════════════════════════════════ */}
      <section className="ld-bande">
        <div className="ld-bande-fond" aria-hidden="true" />
        <div className="ld-bande-in">
          <p className="ld-oeil" data-r>
            Partout avec vous
          </p>
          <h2 className="ld-t2" data-r style={{ "--d": "70ms" } as React.CSSProperties}>
            Une ville plus vivante,
            <span>plus proche.</span>
          </h2>
          <ul className="ld-fam" aria-label="Ce qu’on y trouve">
            {FAMILLES.map(([i, t], k) => (
              <li key={t} data-r style={{ "--d": `${k * 55}ms` } as React.CSSProperties}>
                <i aria-hidden="true">{i}</i>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <div className="ld-bande-f" aria-hidden="true">
            <p className="ld-main d">
              Laissez aussi vos fantômes
              <br />
              et découvrez ceux des autres.
            </p>
            <Fantome classe="ld-f-bande" />
          </div>
        </div>
      </section>

      {/* ═══ LE PIED ══════════════════════════════════════════════════════ */}
      <footer className="ld-pied">
        <Marque clair />
        <p className="ld-slogan" data-r>
          Voyez. Essayez. Décidez.
        </p>
        <p className="ld-pied-s" data-r>
          Votre ville, comme vous ne l’avez jamais vue.
        </p>

        {/* ═══ LES DEUX BADGES NE SONT PAS DES BOUTONS ═══════════════════════

            IL N'Y A PAS D'APPLICATION À TÉLÉCHARGER. Un badge « App Store » qui
            ne mène nulle part est la promesse la plus concrète qu'une page
            d'accueil puisse faire, et la rompre au premier appui coûte tout ce
            qu'elle a construit au-dessus.

            ILS RESTENT DESSINÉS PARCE QU'ILS DISENT OÙ ÇA VA, et ils portent le
            seul mot honnête : bientôt. Ce ne sont ni des liens ni des boutons —
            on ne peut donc pas appuyer dessus et être déçu. */}
        <p className="ld-magasins" aria-hidden="true">
          <span className="ld-mag">
            <i></i>
            <em>
              Bientôt sur<b>l’App Store</b>
            </em>
          </span>
          <span className="ld-mag">
            <i>▶</i>
            <em>
              Bientôt sur<b>Google Play</b>
            </em>
          </span>
        </p>

        <Link href={OUVRIR} className="ld-cta grand" data-r onClick={ouvrir(OUVRIR)}>
          Découvrir ClikMe
          <s aria-hidden="true">→</s>
        </Link>
        {/* IL FERME LA PAGE COMME IL L'A OUVERTE. C'est le même personnage à
            l'ouverture, dans la marge de l'essai, sur le chemin de la section 3,
            dans la bande, et ici : on ne le présente jamais, et pourtant on le
            connaît en arrivant en bas. */}
        <div className="ld-pied-f" aria-hidden="true">
          <Fantome classe="ld-f-pied" />
          <p className="ld-main e">
            On se retrouve
            <br />
            sur ClikMe&nbsp;!
          </p>
        </div>

        {/* ON DIT QUE C'EST UNE MAQUETTE, ET ON LE DIT ICI PLUTÔT QU'À
            L'INTÉRIEUR. Quelqu'un qui ouvre et tombe sur « Chez Bergine »
            comprend tout seul qu'on lui a raconté une histoire — autant le
            devancer. Le point faible devient une preuve : les commerces sont
            inventés, l'essai ne l'est pas. */}
        <p className="ld-pied-n">
          Maquette jouable&nbsp;: les commerces, les prénoms et les heures sont
          inventés. <b>L’essai sur votre photo, non.</b> Aucun compte, aucune
          donnée ne quitte votre téléphone — sauf la photo de l’essai, le temps
          du rendu, et elle n’est pas conservée.
        </p>
      </footer>

      {/* ─── L'APPLICATION, PAR-DESSUS ───
          Même origine que cette page, donc le cadre est autorisé : la règle
          d'en-têtes du site pose frame-ancestors 'self' sur /autour-de-moi.
          Il n'est monté qu'à l'ouverture — une application entière chargée
          d'avance coûterait à tout le monde le prix de ceux qui l'essaient. */}
      {essai && (
        <div className="ld-essai" role="dialog" aria-modal="true" aria-label="ClikMe">
          <iframe src={essai} title="ClikMe — essayer sur soi" />
          <button type="button" className="ld-essai-x" onClick={() => setEssai(null)}>
            <i aria-hidden="true">✕</i>
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
