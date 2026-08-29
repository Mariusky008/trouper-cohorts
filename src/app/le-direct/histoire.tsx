"use client";

// LA PAGE D'ACCUEIL DES HABITANTS — QUATRE HISTOIRES, PAS UNE LISTE.
//
// CE QUI NE MARCHAIT PAS, ET C'EST LE DÉFAUT QUI A TOUT RÉÉCRIT : « les écrans
// que tu as mis sont hyper compliqués et il manque La Ville ». La page
// racontait UNE boucle abstraite — je regarde, je trouve, j'en parle, on
// décide — illustrée par des captures qu'il fallait déchiffrer. Personne ne se
// reconnaît dans une boucle. On se reconnaît dans une situation.
//
// LA FORME EST DONC : UNE SITUATION, DEUX OU TROIS ÉCRANS, UNE FIN. À midi on
// mange où. Cet après-midi une place se libère chez la coiffeuse. Ce soir il y
// a un concert. En ce moment, la boutique d'à côté cherche quelqu'un le
// samedi. Chaque cas se lit en quelques secondes et doit provoquer une seule
// pensée : « ça, je vais l'utiliser ».
//
// LA FIN COMPTE PLUS QUE LE DÉBUT, ET C'EST LE POINT DE TOUTE LA PAGE. Voir ce
// qui se passe, n'importe quelle application le fait. Ce que personne ne fait,
// c'est CONCLURE : une table réservée pour quatre et confirmée par le
// restaurant, un vote tranché pendant que Camille est encore dans le fauteuil,
// quatre personnes qui se retrouvent au kiosque, un patron qu'on va voir un
// mardi sans CV. Chaque cas se termine donc sur son écran de conclusion, et
// c'est celui qui est mis en avant.
//
// LES ÉCRANS SONT DE VRAIES CAPTURES de l'application qui tourne — voir
// `capture-ld.mjs`. Une page d'accueil qui redessine son produit en plus joli
// promet un écran qui n'existe pas, et la première ouverture dément la
// publicité. Les commerces, les prénoms, les heures et les prix sont ceux de
// la maquette, à l'heure du service.
//
// ELLE EST ANIMÉE PARCE QU'ELLE S'ADRESSE À DES CLIENTS, pas à un jury. Mais
// tout ce qui bouge se déclenche à l'entrée dans l'écran et ne se répète pas :
// une page qui s'agite en continu fatigue avant d'avoir convaincu. Et rien ne
// bouge du tout si le système demande des animations réduites.

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MARQUE } from "@/lib/marque";

/** Un écran de l'application, avec son rang dans l'histoire et sa légende. */
type Ecran = {
  src: string;
  alt: string;
  /** Ce qu'on voit, en une phrase. Jamais une description de l'interface. */
  dit: string;
  /**
   * CE À QUOI ÇA ABOUTIT, EN TROIS MOTS — et c'est le libellé du dernier
   * écran d'un cas.
   *
   * IL EST CONCRET ET DIFFÉRENT À CHAQUE FOIS, et ce n'est pas cosmétique.
   * La première version répétait la même phrase cinq fois, « et voilà ce qui
   * n'existe nulle part ailleurs » : répétée, une phrase longue devient du
   * remplissage et on cesse de la lire dès le deuxième cas. « Table réservée
   * pour quatre », « Décidé en dix minutes », « Rendez-vous mardi, sans CV » :
   * chacun dit ce que CE cas-là produit, et c'est la variété qui prouve
   * l'étendue.
   */
  fin?: string;
};

type Cas = {
  cle: string;
  /** Le moment de la journée. C'est lui qui fait qu'on se reconnaît. */
  quand: string;
  titre: string;
  /** La question qu'on se pose vraiment, dans ces termes-là. */
  sous: string;
  ecrans: Ecran[];
  /**
   * CE QUE ÇA APPORTE, EN DEUX OU TROIS POINTS — et c'est ce qui manquait.
   *
   * Les écrans montrent CE QUI SE PASSE ; ils ne disent pas ce qu'on y gagne.
   * Quelqu'un qui regarde trois captures comprend le mécanisme et referme la
   * page sans avoir su pourquoi il installerait ça. Chaque avantage est donc
   * écrit du point de vue de celui qui lit — « tous les menus de la ville en
   * trente secondes », pas « moteur de découverte géolocalisé » — et il doit
   * être VRAI de ce que l'application fait aujourd'hui.
   */
  atouts: [string, string, string][];
  /** Ce qu'on retient — et ce que personne d'autre ne fait. */
  chute: string;
  teinte: "menthe" | "or" | "rose" | "bleu";
};

const CAS: Cas[] = [
  {
    cle: "midi",
    quand: "11 h 45",
    titre: "On mange où&nbsp;?",
    sous:
      "La question de tous les midis. Elle se règle en trois gestes, et personne n’a ouvert trois applications.",
    teinte: "menthe",
    ecrans: [
      {
        src: "/le-direct/resto-annonce.jpg",
        alt: "L’annonce du jour de Chez Bergine : garbure landaise et magret grillé, 19 €, à 400 mètres.",
        dit: "La garbure de Chez Bergine, servie aujourd’hui, à quatre cents mètres.",
      },
      {
        src: "/le-direct/resto-balayage.jpg",
        alt: "La carte glissée vers la droite, le tampon vert « En parler » apparaît.",
        dit: "Je balaie à droite. Un salon s’ouvre sur cette annonce-là.",
      },
      {
        src: "/le-direct/resto-salon.jpg",
        alt: "Le salon : Pauline a réservé pour 4 personnes, confirmé par Chez Bergine.",
        dit: "Pauline réserve pour quatre. Le restaurant confirme. On se retrouve à 12 h 30.",
        fin: "Table réservée pour quatre",
      },
    ],
    atouts: [
      ["⚡", "Tous les menus de la ville en trente secondes",
       "Un balayage par restaurant, la photo en grand et le prix. Vous avez fait le tour du centre avant d’avoir fini de descendre l’escalier."],
      ["👥", "On décide à quatre sans y passer vingt minutes",
       "Chacun propose autre chose, chacun voit ce que les autres proposent, et la conversation reste collée à l’annonce."],
      ["📅", "Et on réserve depuis la conversation",
       "Personne n’appelle, personne ne rouvre un site. La table est prise pour tout le monde, d’un seul appui."],
    ],
    chute:
      "Vingt minutes de « je sais pas, et toi ? » remplacées par quatre messages et une table.",
  },
  {
    cle: "coiffeur",
    quand: "14 h 10",
    titre: "Une place vient de se libérer.",
    sous:
      "Un désistement chez la coiffeuse, à deux cents mètres. Sans Clikme, personne ne l’aurait jamais su.",
    teinte: "or",
    ecrans: [
      {
        src: "/le-direct/coiffeur-annonce.jpg",
        alt: "Une place libre chez un salon du centre : coupe et brushing, 28 €, à 220 mètres.",
        dit: "Coupe et brushing, 28 €, cet après-midi. À trois minutes à pied.",
      },
      {
        src: "/le-direct/coiffeur-salon.jpg",
        alt: "Le direct de Camille depuis le salon, et le vote de ses amies : naturel 27 %, plus clair 73 %.",
        dit: "Camille y est, et elle le montre en direct. Ses amies regardent et tranchent : naturel, ou plus clair ? Onze voix.",
        fin: "Décidé en dix minutes",
      },
    ],
    atouts: [
      ["🔔", "Les créneaux qui se libèrent, personne ne les annonce",
       "Un désistement à quatorze heures se sait à quatorze heures deux. Ailleurs, il reste vide."],
      ["📺", "Vous montrez, ils tranchent",
       "Le direct depuis le fauteuil, et le vote de ceux qui ne sont pas là. C’est ce qu’on fait déjà par SMS, en dix fois plus lent."],
      ["✂️", "Prendre le même, sans savoir le nommer",
       "Vous avez vu la coupe de quelqu’un : un bouton réserve exactement cette prestation-là, chez la même personne."],
    ],
    chute:
      "Elle est en direct, ils regardent, ils votent — et elle a sa réponse avant que la couleur ne prenne.",
  },
  {
    cle: "soir",
    quand: "19 h",
    titre: "Un concert au kiosque. Gratuit.",
    sous:
      "Ce que votre ville organise ce soir, et que vous apprenez d’habitude le lendemain par une photo.",
    teinte: "rose",
    ecrans: [
      {
        src: "/le-direct/evenement-annonce.jpg",
        alt: "L’annonce du concert au kiosque du parc Théodore-Denis, trio de jazz, ce soir 19 h.",
        dit: "Trio de jazz au kiosque, ce soir, à quatre cent cinquante mètres.",
      },
      {
        src: "/le-direct/evenement-salon.jpg",
        alt: "Le salon du concert : Thomas l’a ouvert, quatre personnes viennent.",
        dit: "Thomas l’a lancé. Ils sont quatre à y aller. Vous savez avec qui vous y serez.",
        fin: "Quatre personnes au kiosque",
      },
    ],
    atouts: [
      ["🎪", "Tout ce que la ville organise, au même endroit",
       "La mairie, le musée, les associations, les salles. Plus d’affiche vue trop tard ni de page Facebook à surveiller."],
      ["🕗", "Prévenu le jour même, pas le lendemain",
       "Un concert s’annonce le matin pour le soir. C’est justement ce qu’aucun agenda papier ne sait faire."],
      ["👥", "On y va à plusieurs, pas tout seul",
       "Vous voyez qui vient avant de sortir — et c’est presque toujours ça qui décide."],
    ],
    chute:
      "La mairie, le musée, les associations publient ici. Vous ne l’apprenez plus après coup.",
  },
  {
    cle: "emploi",
    quand: "En ce moment",
    titre: "Ils cherchent quelqu’un.",
    sous:
      "Les commerçants d’à côté recrutent pour un samedi, une saison, un coup de main. Sans plateforme entre eux et vous.",
    teinte: "bleu",
    ecrans: [
      {
        src: "/le-direct/emploi-annonce.jpg",
        alt: "Une boutique cherche quelqu’un le samedi : 480 € net par mois, à 210 mètres.",
        dit: "Quelqu’un le samedi. 480 € net par mois, à deux cent dix mètres.",
      },
      {
        src: "/le-direct/emploi-detail.jpg",
        alt: "Le poste en détail : pas de CV, pas de lettre, passez un mardi ou un mercredi après-midi.",
        dit: "Pas de CV, pas de lettre. Vous passez un mardi après-midi, et vous parlez à la patronne.",
        fin: "Rendez-vous mardi, sans CV",
      },
    ],
    atouts: [
      ["📍", "Le travail à dix minutes à pied",
       "Pas une offre à trente kilomètres : la boutique de la rue piétonne, avec sa distance affichée."],
      ["📄", "Rien à envoyer",
       "Pas de CV, pas de lettre, pas de compte à créer. On vous dit quel jour passer, et vous passez."],
      ["🗣️", "Dit par celui qui embauche",
       "« Le samedi je suis seule et je ne peux pas m’occuper de trois personnes en cabine. » Ses mots, pas ceux d’une annonce."],
    ],
    chute:
      "Le travail d’à côté, dit par celui qui embauche, et sans rien à envoyer.",
  },
];

const GESTES = [
  { i: "👀", t: "Je vois", d: "ce qui se passe autour de moi, maintenant" },
  { i: "💬", t: "J’en parle", d: "à mes amis, sans quitter l’annonce" },
  { i: "🎉", t: "On y va", d: "ensemble, et c’est réservé" },
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
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    cibles.forEach((c) => o.observe(c));
    return () => o.disconnect();
  }, []);
  return racine;
}

function Telephone({ e, rang }: { e: Ecran; rang: number }) {
  return (
    <figure className={`ld-ec${e.fin ? " fin" : ""}`} data-r style={{ "--d": `${rang * 90}ms` } as React.CSSProperties}>
      <div className="ld-tel">
        <span className="ld-rang">{rang + 1}</span>
        <Image
          src={e.src}
          alt={e.alt}
          width={720}
          height={1502}
          sizes="(max-width:760px) 66vw, 300px"
          className="ld-img"
        />
      </div>
      <figcaption className="ld-dit">
        {e.fin && (
          <b className="ld-fin-b">
            <i aria-hidden="true">✓</i>
            {e.fin}
          </b>
        )}
        {e.dit}
      </figcaption>
    </figure>
  );
}

export function Histoire() {
  const racine = useRevelation();

  /**
   * L'APPLICATION S'OUVRE DANS LA PAGE, ET NON À LA PLACE.
   *
   * LE DÉFAUT, ET IL EST DE CEUX QUI COÛTENT TOUT : « quand je clique dessus
   * je pars sur une autre page et je ne peux pas revenir facilement, et sur
   * téléphone on sait que si la personne part elle ne reviendra plus ». C'est
   * exact. Une page d'accueil dont le seul bouton est une porte de sortie sans
   * poignée de retour dépense en une seconde tout ce qu'elle a mis deux
   * minutes à construire.
   *
   * L'ESSAI SE POSE DONC PAR-DESSUS, plein écran, avec une seule chose en
   * plus : « ✕ Fermer ». On essaie, on ferme, on est exactement là où on
   * s'était arrêté — même position dans la page, même section.
   *
   * LE LIEN RESTE UN VRAI LIEN. On intercepte l'appui, mais l'adresse est
   * écrite : un appui long, un clic du milieu ou « ouvrir dans un nouvel
   * onglet » continuent de marcher, et la page reste utilisable sans
   * JavaScript.
   */
  const [essai, setEssai] = useState(false);
  useEffect(() => {
    if (!essai) return;
    /* LA PAGE NE DOIT PAS DÉFILER DERRIÈRE — sur téléphone, le doigt qui
       balaie une carte de l'application ferait autrement glisser la page
       d'accueil sous elle.

       ON LA FIGE À SA POSITION, ON NE COUPE PAS SON DÉFILEMENT. DÉFAUT MESURÉ
       PAR LE TEST : `overflow:hidden` sur le corps de page suffit à bloquer,
       mais il fait retomber le document à zéro — mesuré, 968 avant, 0 après.
       Quelqu'un qui essayait l'application depuis la section du coiffeur la
       refermait tout en haut de la page, c'est-à-dire nulle part. C'est
       exactement le défaut qu'on venait de corriger, déplacé d'un cran.
       On décale donc le corps de sa propre hauteur de défilement, et on la
       rend en fermant. */
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
      if (e.key === "Escape") setEssai(false);
    };
    window.addEventListener("keydown", auClavier);
    return () => {
      document.body.style.position = avant.position;
      document.body.style.top = avant.top;
      document.body.style.width = avant.largeur;
      // INSTANTANÉ, ET C'EST NÉCESSAIRE : la feuille globale du site pose
      // scroll-behavior:smooth sur la racine. Sans ce mot, refermer l'essai
      // déclenchait un défilement animé d'une seconde depuis le haut de la
      // page — mesuré : 75 points à 200 ms, 420 à 1 200 ms. On revient d'où
      // l'on vient, on n'y retourne pas en voiture.
      window.scrollTo({ top: y, behavior: "instant" });
      window.removeEventListener("keydown", auClavier);
    };
  }, [essai]);

  const ouvrir = (e: React.MouseEvent) => {
    // On laisse passer tout ce qui veut un autre onglet.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setEssai(true);
  };

  return (
    <div ref={racine}>
      {/* ─── LA BARRE ───
          Elle ne sert qu'à deux choses : dire de quelle application on parle,
          et donner la porte. Une page qui commence par un menu de six entrées
          fait attendre son sujet. */}
      <header className="ld-nav">
        <span className="ld-marque">
          <i aria-hidden="true">⚡</i>
          {MARQUE}
        </span>
        <Link href="/autour-de-moi" className="ld-cta petit" onClick={ouvrir}>
          Ouvrir
        </Link>
      </header>

      {/* ─── L'OUVERTURE ───
          Le titre demandé, mot pour mot, et un sous-titre qui dit ce que
          « le direct » veut dire pour quelqu'un qui n'a jamais vu le produit. */}
      <section className="ld-hero">
        <div className="ld-halo" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="ld-hero-mot">
          <p className="ld-oeil" data-r>
            L’application de votre ville
          </p>
          <h1 className="ld-t1" data-r style={{ "--d": "80ms" } as React.CSSProperties}>
            Le direct de votre ville.
          </h1>
          <p className="ld-s" data-r style={{ "--d": "160ms" } as React.CSSProperties}>
            Ce qui se passe autour de vous, <b>à l’instant où ça se passe</b>. Vous
            le voyez, vous en parlez à vos amis, et vous décidez ensemble. En
            trois gestes.
          </p>
          <div className="ld-hero-b" data-r style={{ "--d": "240ms" } as React.CSSProperties}>
            <Link href="/autour-de-moi" className="ld-cta grand" onClick={ouvrir}>
              Voir ce qui se passe autour de moi
            </Link>
            <p className="ld-n">Sans compte, sans numéro, rien à installer.</p>
          </div>
        </div>

        {/* LES TROIS GESTES, EN UNE LIGNE. C'est le sommaire de tout ce qui
            suit : quatre cas différents, toujours les mêmes trois gestes. */}
        <ul className="ld-gestes" data-r style={{ "--d": "320ms" } as React.CSSProperties}>
          {GESTES.map((g, i) => (
            <li key={g.t}>
              <i aria-hidden="true">{g.i}</i>
              <b>{g.t}</b>
              <em>{g.d}</em>
              {i < GESTES.length - 1 && (
                <s className="ld-fleche" aria-hidden="true">
                  →
                </s>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ─── LES QUATRE SITUATIONS ─── */}
      {CAS.map((c) => (
        <section key={c.cle} className={`ld-cas t-${c.teinte}`} aria-labelledby={`t-${c.cle}`}>
          <div className="ld-cas-h">
            <p className="ld-quand" data-r>
              <i aria-hidden="true">●</i>
              {c.quand}
            </p>
            <h2
              id={`t-${c.cle}`}
              className="ld-t2"
              data-r
              style={{ "--d": "60ms" } as React.CSSProperties}
              dangerouslySetInnerHTML={{ __html: c.titre }}
            />
            <p className="ld-s" data-r style={{ "--d": "120ms" } as React.CSSProperties}>
              {c.sous}
            </p>
          </div>

          {/* LES ÉCRANS DÉFILENT AU DOIGT SUR TÉLÉPHONE, et se rangent côte à
              côte au-delà. Trois captures empilées verticalement font une page
              interminable ; alignées, elles se lisent comme une bande dessinée
              — et c'est exactement ce qu'elles sont. */}
          <div className="ld-bande">
            {c.ecrans.map((e, i) => (
              <Telephone key={e.src} e={e} rang={i} />
            ))}
          </div>

          {/* CE QU'ON Y GAGNE, APRÈS AVOIR VU CE QUI SE PASSE. Les captures
              montrent le mécanisme ; sans ces trois points, on comprend
              comment ça marche et on referme sans savoir pourquoi on
              l'installerait. */}
          <ul className="ld-atouts cas" aria-label="Ce que ça apporte">
            {c.atouts.map(([i, t, d], k) => (
              <li key={t} data-r style={{ "--d": `${k * 70}ms` } as React.CSSProperties}>
                <i aria-hidden="true">{i}</i>
                <span>
                  <b>{t}</b>
                  {d}
                </span>
              </li>
            ))}
          </ul>

          <p className="ld-chute" data-r>
            {c.chute}
          </p>
        </section>
      ))}

      {/* ─── LA VILLE ───
          Elle manquait, et ce n'était pas un oubli de présentation : c'est la
          seule partie du produit où ce ne sont ni les commerces ni la mairie
          qui parlent, mais les habitants. Sans elle, Clikme est un annuaire
          d'annonces. */}
      <section className="ld-cas t-ville" aria-labelledby="t-ville">
        <div className="ld-cas-h">
          <p className="ld-quand" data-r>
            <i aria-hidden="true">●</i>
            En ce moment
          </p>
          <h2 id="t-ville" className="ld-t2" data-r style={{ "--d": "60ms" } as React.CSSProperties}>
            La Ville&nbsp;: ce que les habitants disent.
          </h2>
          <p className="ld-s" data-r style={{ "--d": "120ms" } as React.CSSProperties}>
            Une question, un bon plan, un groupe qui joue place de la Fontaine
            chaude. Ce que personne n’annonce et que tout le monde aimerait
            savoir.
          </p>
        </div>

        <div className="ld-bande une">
          <Telephone
            e={{
              src: "/le-direct/laville.jpg",
              alt: "La Ville : Camille demande pourquoi il y a du monde devant les Arènes, Thomas poste la photo d’un groupe qui joue.",
              dit: "Six messages en ce moment. Chacun porte un lieu, une heure, et s’efface au bout de quelques heures.",
              fin: "Ce qui se dit maintenant",
            }}
            rang={0}
          />
          <ul className="ld-atouts">
            {[
              ["🧹", "Tout s’efface", "Au bout de quelques heures. Pas de fil sans fin, rien à rattraper le soir."],
              ["📍", "Un lieu, une heure", "On ne dit pas « quelque part en ville » : on dit où, et à quelle distance."],
              ["🚫", "Aucune publicité", "Ni promotion déguisée, ni compte à faire grossir."],
              ["🕊️", "Un prénom suffit", "Pas de profil, pas de numéro, rien qui quitte le téléphone."],
            ].map(([i, t, d], k) => (
              <li key={t} data-r style={{ "--d": `${k * 70}ms` } as React.CSSProperties}>
                <i aria-hidden="true">{i}</i>
                <span>
                  <b>{t}</b>
                  {d}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── LES DEUX SALONS ───
          POURQUOI ICI ET PAS PLUS HAUT. Les cinq situations d'avant montrent
          toutes le même salon : celui qu'on ouvre avec ses amis. On peut donc
          maintenant nommer les deux portes sans rien expliquer — la première
          vient d'être vue cinq fois, la seconde se comprend par contraste.

          LA SECONDE PORTE EST CE QUE PERSONNE D'AUTRE NE FAIT. Ailleurs, un
          prix est un prix. Ici, ce qu'un commerçant ne peut pas offrir à une
          personne, il peut l'offrir à dix : le seuil ne lui coûte rien parce
          que l'affaire n'existe QUE si le groupe existe. Et comme le prix
          tombe aussi pour ceux qui s'étaient inscrits les premiers, chacun a
          intérêt à en parler autour de lui — sinon les premiers attendent au
          lieu de recruter, et la jauge ne monte jamais.

          LE MOT « BIENTÔT » N'EST PAS UNE PRÉCAUTION DE STYLE. Le salon
          public n'est pas encore dans l'application, et cette page ouvre
          l'application juste à côté. Annoncer sans ce mot enverrait quelqu'un
          chercher un bouton qui n'existe pas ; il tombe le jour où il existe.

          CE QUI EMPÊCHE DE SE TROMPER DE SALON : les deux portes ne sont
          jamais au même endroit sur l'annonce, l'une en bas, l'autre en haut.
          Et chaque salon dit en permanence QUI PEUT VOUS LIRE — le vrai
          danger n'est pas d'appuyer sur le mauvais bouton, c'est de confier a
          des inconnus ce qu'on croyait dire a ses amis. */}
      <section className="ld-salons" aria-labelledby="t-salons">
        <div className="ld-cas-h">
          <p className="ld-quand" data-r>
            Le salon
          </p>
          <h2 id="t-salons" className="ld-t2" data-r style={{ "--d": "60ms" } as React.CSSProperties}>
            On n’y va plus seul.
          </h2>
          <p className="ld-s" data-r style={{ "--d": "120ms" } as React.CSSProperties}>
            Sur chaque annonce, deux portes — et jamais au même endroit. On{" "}
            <b>ouvre</b> une conversation avec ses amis, ou on <b>rejoint</b> des gens
            qu’on ne connaît pas pour obtenir ce qu’aucun d’eux n’obtiendrait seul.
          </p>
        </div>

        <div className="ld-portes">
          <article className="ld-porte prive" data-r>
            <p className="ld-porte-e">
              <b>💬 En parler</b>
              <em>en bas de l’annonce</em>
            </p>
            <h3>Avec mes amis.</h3>
            <p className="ld-porte-p">
              On se décide à quatre, chacun propose autre chose, et la table est prise
              depuis la conversation. Elle vit le temps de l’annonce, puis elle s’éteint.
            </p>

            {/* LE PENDANT DE LA JAUGE, DU COTE PRIVE. Sans lui, la carte de
                gauche etait un grand trou a cote d'une carte pleine, et le
                desequilibre se lisait comme un desequilibre d'importance —
                alors que ces deux salons comptent autant l'un que l'autre. */}
            <div className="ld-fil" aria-hidden="true">
              <p className="ld-f-q">Le menu du jour · Chez Bergine</p>
              <ul className="ld-f-l">
                <li>
                  <b>Julie</b>Je peux vous rejoindre à 12 h 30.
                </li>
                <li>
                  <b>Marc</b>Pas ce midi — gardez-moi ça pour jeudi.
                </li>
                <li className="moi">
                  <b>Pauline</b>Parfait, je réserve pour quatre.
                </li>
              </ul>
              <p className="ld-f-c">
                <i>📅</i> Table réservée pour 4 <s>confirmé par Chez Bergine</s>
              </p>
            </div>

            <p className="ld-porte-q">
              <i aria-hidden="true">🔒</i> Vous et 3 amis
            </p>
          </article>

          <article
            className="ld-porte public"
            data-r
            style={{ "--d": "120ms" } as React.CSSProperties}
          >
            <p className="ld-porte-e">
              <b>👋 Rejoindre</b>
              <em>en haut de l’annonce</em>
              <s>Bientôt</s>
            </p>
            <h3>Avec des inconnus, pour payer moins.</h3>
            <p className="ld-porte-p">
              Le commerçant pose une règle le matin et n’y revient jamais. À dix, le prix
              tombe — <b>pour tout le monde</b>, ceux qui s’étaient inscrits les premiers
              compris. Alors on en parle autour de soi&nbsp;: chaque personne de plus fait
              baisser la vôtre.
            </p>

            {/* LA JAUGE — le seul objet nouveau, et le même partout. Elle se
                remplit en arrivant a l'ecran plutot qu'au chargement : figee,
                elle demanderait d'imaginer la suite ; animee, elle la montre. */}
            <div className="ld-jauge" aria-hidden="true">
              <p className="ld-j-q">Pantalon en lin · Chez Marot</p>
              <div className="ld-pts">
                {Array.from({ length: 10 }, (_, k) => (
                  <i key={k} className={k < 7 ? "pris" : `libre l${k - 6}`} />
                ))}
              </div>
              <p className="ld-j-n">
                <span className="ld-j-g">
                  <b className="av">7</b>
                  <b className="ap">10</b>
                </span>
                <em>sur 10</em>
                <s>50 €</s>
                <u>45 €</u>
              </p>
              <p className="ld-j-x">
                <span className="av">Encore 3 et le prix tombe.</span>
                <span className="ap">C’est fait. Il est tombé pour les dix.</span>
              </p>
            </div>

            <p className="ld-porte-q">
              <i aria-hidden="true">👁️</i> 7 personnes que vous ne connaissez pas
            </p>
          </article>
        </div>

        {/* LA MÊME JAUGE NE SERT PAS QU'A FAIRE BAISSER UN PRIX. Quatre
            exemples suffisent a le dire : ce qui est en jeu change de metier
            en metier, la forme ne change jamais. C'est ce qui permet d'en
            apprendre UN et de le retrouver dans toute la ville. */}
        <ul className="ld-seuils" aria-label="Ce que le nombre débloque, selon le commerce">
          {[
            ["9 / 12", "et le boulanger lance une fournée à 17 h"],
            ["11 / 14", "et le boucher découpe une bête entière"],
            ["4 / 6", "et le menu du soir passe de 21 à 18 €"],
            ["12 / 15", "et le caviste fait venir le vigneron jeudi"],
          ].map(([n, d], k) => (
            <li key={n} data-r style={{ "--d": `${k * 70}ms` } as React.CSSProperties}>
              <b>{n}</b>
              <em>{d}</em>
            </li>
          ))}
        </ul>

        <p className="ld-chute" data-r>
          Ce qu’un commerçant ne peut pas offrir à une personne, il peut l’offrir à dix.
        </p>
      </section>

      {/* ─── CE QUI N'EXISTE NULLE PART AILLEURS ───
          Placé ici, après quatre démonstrations, ce n'est plus une promesse :
          c'est le nom de ce qu'on vient de voir quatre fois. */}
      <section className="ld-final">
        <p className="ld-oeil" data-r>
          La différence
        </p>
        <h2 className="ld-t2" data-r style={{ "--d": "60ms" } as React.CSSProperties}>
          Partout ailleurs, ça s’arrête à l’information.
          <span>Ici, ça finit par une décision.</span>
        </h2>
        <ul className="ld-preuves">
          {[
            ["🍽️", "Une table réservée pour quatre", "et confirmée par le restaurant"],
            ["✂️", "Un vote tranché", "pendant qu’elle est encore dans le fauteuil"],
            ["🎷", "Quatre personnes au kiosque", "qui savent avec qui elles y seront"],
            ["👋", "Un patron qu’on va voir mardi", "sans CV et sans plateforme"],
          ].map(([i, t, d], k) => (
            <li key={t} data-r style={{ "--d": `${k * 80}ms` } as React.CSSProperties}>
              <i aria-hidden="true">{i}</i>
              <b>{t}</b>
              <em>{d}</em>
            </li>
          ))}
        </ul>
        <Link href="/autour-de-moi" className="ld-cta grand" data-r onClick={ouvrir}>
          Ouvrir Le Direct
        </Link>
        <p className="ld-n" data-r>
          Dax, aujourd’hui. Votre ville, ensuite.
        </p>
      </section>

      {/* ─── L'ESSAI, PAR-DESSUS ───
          Même origine que cette page, donc le cadre est autorisé : la règle
          d'en-têtes du site pose frame-ancestors 'self' sur /autour-de-moi.
          Il n'est monté qu'à l'ouverture — une application entière chargée
          d'avance dans une page d'accueil coûterait à tout le monde le prix
          de ceux qui l'essaient. */}
      {essai && (
        <div className="ld-essai" role="dialog" aria-modal="true" aria-label="Clikme">
          <iframe src="/autour-de-moi" title="Clikme — le direct de votre ville" />
          <button type="button" className="ld-essai-x" onClick={() => setEssai(false)}>
            <i aria-hidden="true">✕</i>
            Fermer
          </button>
        </div>
      )}

      {/* ─── LE PIED DE PAGE ─── */}
      <footer className="ld-pied">
        <div className="ld-pied-h">
          <span className="ld-marque grand">
            <i aria-hidden="true">⚡</i>
            {MARQUE}
          </span>
          <p>Le direct de votre ville.</p>
        </div>
        {/* TROIS LIENS, ET ILS EXISTENT TOUS. Un pied de page qui promet une
            page « commerçants » qui n'est pas écrite fait un 404 au moment
            précis où quelqu'un s'intéresse assez pour cliquer. */}
        <nav className="ld-pied-l" aria-label="Pied de page">
          <Link href="/autour-de-moi" onClick={ouvrir}>Ouvrir l’application</Link>
          <Link href="/essai-annonce">L’annonce, de près</Link>
          <Link href="/">Le site</Link>
        </nav>
        <p className="ld-pied-n">
          Maquette jouable&nbsp;: les commerces, les prénoms et les heures sont
          inventés. Aucun compte, aucune donnée ne quitte votre téléphone.
        </p>
      </footer>
    </div>
  );
}
