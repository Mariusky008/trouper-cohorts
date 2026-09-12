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
import { VitrineVivante } from "./vitrine";

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

/** Le fantôme de la maquette : dessiné, pas photographié. */
function Fantome({ classe }: { classe?: string }) {
  return (
    <span className={`ld-f3${classe ? ` ${classe}` : ""}`} aria-hidden="true">
      <svg viewBox="0 0 64 72" fill="none">
        <defs>
          <linearGradient id="ldFcorps" x1="32" y1="4" x2="32" y2="68">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#E4DCFF" />
          </linearGradient>
        </defs>
        <path
          fill="url(#ldFcorps)"
          d="M32 4C18.7 4 8 14.7 8 28v30.5c0 3 3.5 4.6 5.8 2.7l4.6-3.9a4 4 0 0 1 5.2 0l4 3.4a4 4 0 0 0 5.2 0l4-3.4a4 4 0 0 1 5.2 0l4.2 3.6c2.3 2 5.8.3 5.8-2.7V28C56 14.7 45.3 4 32 4z"
        />
        <ellipse cx="23" cy="30" rx="3.4" ry="4.2" fill="#2A1E4D" />
        <ellipse cx="41" cy="30" rx="3.4" ry="4.2" fill="#2A1E4D" />
        <path d="M26 41c1.8 2.4 4 3.6 6 3.6s4.2-1.2 6-3.6" stroke="#2A1E4D" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    </span>
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
      {/* ═══ LA BARRE ═════════════════════════════════════════════════════ */}
      <header className="ld-nav">
        <Link href="/le-direct" className="ld-marque">
          <i aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2.5c-4 0-7.2 3.2-7.2 7.2 0 5.2 6.3 11.2 6.6 11.4a.9.9 0 0 0 1.2 0c.3-.2 6.6-6.2 6.6-11.4 0-4-3.2-7.2-7.2-7.2z"
                fill="currentColor"
              />
              <circle cx="12" cy="9.6" r="2.7" fill="#fff" />
            </svg>
          </i>
          Clik<b>Me</b>
        </Link>
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
            <h1 className="ld-t1" data-r style={{ "--d": "70ms" } as React.CSSProperties}>
              Votre ville bouge.
              <span>Voyez ce qui se passe.</span>
            </h1>
            <p className="ld-s" data-r style={{ "--d": "140ms" } as React.CSSProperties}>
              <b>Le Direct</b> vous montre en temps réel ce qui est disponible
              autour de vous.
            </p>
            <div className="ld-hero-b" data-r style={{ "--d": "210ms" } as React.CSSProperties}>
              <Link href={OUVRIR} className="ld-cta grand" onClick={ouvrir(OUVRIR)}>
                Découvrir le Direct
                <s aria-hidden="true">→</s>
              </Link>
            </div>
          </div>

          {/* LE TÉLÉPHONE DE LA MAQUETTE. Il y montre une vraie carte ; ici il
              en montre quatre, qui tournent — c'est le composant du produit, et
              il prouve du même coup que les métiers ne se ressemblent pas. */}
          <div className="ld-hero-tel" data-r style={{ "--d": "280ms" } as React.CSSProperties}>
            <VitrineVivante />
            <p className="ld-main a" aria-hidden="true">
              Un swipe.
              <br />
              Une envie.
              <br />
              Une réponse.
            </p>
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
              Votre fantôme
              <br />
              vous accompagne
            </p>
            <Fantome />
          </div>
        </div>
      </section>

      {/* ═══ 3 · ENSEMBLE ═════════════════════════════════════════════════ */}
      <section className="ld-clair gris" id="ensemble">
        <div className="ld-deux inverse">
          <div className="ld-deux-d">
            <p className="ld-oeil v" data-r>
              Ensemble, c’est mieux
            </p>
            <h2 className="ld-t2" data-r style={{ "--d": "70ms" } as React.CSSProperties}>
              Ne choisissez
              <span>plus seul.</span>
            </h2>
            <p className="ld-p" data-r style={{ "--d": "140ms" } as React.CSSProperties}>
              Proposez ce que vous trouvez à vos amis. Ils peuvent changer votre
              choix. Et quand vous êtes d’accord, ClikMe s’occupe du reste.
            </p>
            <Link
              href={OUVRIR}
              className="ld-creux"
              data-r
              style={{ "--d": "210ms" } as React.CSSProperties}
              onClick={ouvrir(OUVRIR)}
            >
              Explorer les propositions
              <s aria-hidden="true">→</s>
            </Link>
          </div>
          <div className="ld-deux-g" data-r style={{ "--d": "90ms" } as React.CSSProperties}>
            {/* UNE VRAIE CAPTURE DU SALON, dans le téléphone dessiné. La
                maquette y met une conversation redessinée ; on préfère celle
                qui existe, parce qu'une page qui redessine son produit en plus
                joli promet un écran qui n'existe pas. */}
            <div className="ld-sal">
              <div className="ld-vt">
                <div className="ld-vt-ecran">
                  <Image
                    src="/le-direct/resto-salon.jpg"
                    alt="Une conversation privée sur une annonce : trois amis répondent, et la table est réservée pour quatre."
                    width={720}
                    height={1502}
                    sizes="(max-width:900px) 62vw, 280px"
                  />
                </div>
              </div>
              <p className="ld-main c" aria-hidden="true">
                Vos amis donnent leur avis,
                <br />
                vous décidez.
              </p>
            </div>
          </div>
        </div>
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
            <Fantome classe="petit" />
          </div>
        </div>
      </section>

      {/* ═══ LE PIED ══════════════════════════════════════════════════════ */}
      <footer className="ld-pied">
        <Link href="/le-direct" className="ld-marque grand">
          <i aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2.5c-4 0-7.2 3.2-7.2 7.2 0 5.2 6.3 11.2 6.6 11.4a.9.9 0 0 0 1.2 0c.3-.2 6.6-6.2 6.6-11.4 0-4-3.2-7.2-7.2-7.2z"
                fill="currentColor"
              />
              <circle cx="12" cy="9.6" r="2.7" fill="#fff" />
            </svg>
          </i>
          Clik<b>Me</b>
        </Link>
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
        <p className="ld-main e" aria-hidden="true">
          On se retrouve
          <br />
          sur ClikMe !
        </p>

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
