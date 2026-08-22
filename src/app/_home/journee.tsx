"use client";

// LA JOURNÉE D'UN COMMERCE, HEURE PAR HEURE — la rupture visuelle de la page.
//
// CE QU'ELLE RÉSOUT. Tout le haut de la page explique un MÉCANISME : vous le
// dites, on le fait savoir. C'est juste, et ça reste abstrait tant qu'on n'a
// pas vu ce que « le faire savoir » produit. Le commerçant lit « votre
// actualité paraît dans Le Direct de votre ville » et n'a aucune image de ce
// que ça donne.
//
// Cette section montre l'objet : quatre moments d'une journée ordinaire, et à
// chaque fois la carte que ses voisins reçoivent. Ce n'est pas une illustration
// dessinée pour la page — c'est LE composant du produit, celui du fil de la
// ville et de la démonstration. Le jour où la carte change, elle change ici
// aussi, et il devient impossible de promettre en page d'accueil un écran qui
// n'existe pas.
//
// LE TROISIÈME MOMENT EST LE PLUS IMPORTANT, et il a son propre temps : on y
// voit la phrase du commerçant — « Il me reste 8 lasagnes. » — devenir
// l'annonce. C'est la seule chose que la page doit faire comprendre, et une
// phrase ne suffisait pas à la faire comprendre.
//
// LES CARTES DÉCRIVENT SON COMMERCE À LUI, pas un voisin inventé : elles
// portent « Votre restaurant », qui s'adresse au lecteur. Nommer un faux
// commerce serait fabriquer un concurrent ; mettre un vrai nom sans son accord
// serait pire.
import { CarteSwipe, StylesDirect, type CarteDirect } from "@/components/direct/carte-swipe";
import { MARQUE } from "@/lib/marque";

/** Un moment de la journée : l'heure, ce qu'il fait, et ce que ça donne. */
type Moment = {
  heure: string;
  /** Ce qu'il se passe chez lui, dans ses mots à lui. */
  titre: string;
  /** La couleur du moment — la même grammaire que l'acte 7 de la démonstration. */
  teinte: string;
  carte: CarteDirect;
  /** Le libellé du geste attendu, sous la carte. */
  action: string;
};

const NOM = "Votre restaurant";
const VILLE = "votre ville";
const DISTANCE = "350 m";

const MOMENTS: Moment[] = [
  {
    heure: "11 h 30",
    titre: "Votre menu",
    teinte: "#F0B429",
    action: "Voir le menu",
    carte: {
      photo: "/direct/plat-du-jour.jpg",
      cadrage: "68%",
      nom: NOM,
      metier: "Restaurant",
      ville: VILLE,
      distance: DISTANCE,
      reste: "Jusqu'à 14 h",
      icone: "🍽️",
      quoi: "Menu du jour",
      lignes: ["Magret grillé", "Frites maison", "Dessert du jour"],
      prix: "19 €",
    },
  },
  {
    heure: "13 h 30",
    titre: "Votre heure creuse",
    teinte: "#38BDF8",
    action: "Réserver",
    carte: {
      photo: "/direct/tables-libres.jpg",
      cadrage: "100%",
      nom: NOM,
      metier: "Restaurant",
      ville: VILLE,
      distance: DISTANCE,
      reste: "Jusqu'à 14 h",
      icone: "☕",
      quoi: "Café offert",
      lignes: ["Pour toute table réservée", "de 13 h 30 à 14 h"],
    },
  },
  {
    heure: "14 h 30",
    titre: "Il vous en reste ?",
    teinte: "#D2604A",
    action: "J'en prends une",
    carte: {
      // LA MÊME PHOTO QU'À 11 H 30, ET C'EST ASSUMÉ. Les quatre illustrations
      // disponibles ne couvrent que deux moments d'un restaurant — l'assiette
      // et la salle ; les deux autres montrent une boulangerie et une devanture
      // de nuit. Une part de lasagnes se montre par une assiette, pas par une
      // façade. La règle qu'on s'est donnée ailleurs tient ici aussi : le
      // métier passe avant la variété, et jamais deux fois DE SUITE.
      photo: "/direct/plat-du-jour.jpg",
      cadrage: "68%",
      nom: NOM,
      metier: "Restaurant",
      ville: VILLE,
      distance: DISTANCE,
      reste: "Jusqu'à épuisement",
      icone: "🔥",
      quoi: "Dernières portions",
      lignes: ["Lasagnes maison", "À emporter"],
      prix: "8 €",
      etiquette: "IL EN RESTE 8",
    },
  },
  {
    heure: "19 h 00",
    titre: "Une table à remplir ?",
    teinte: "#9B7BFF",
    action: "Réserver",
    carte: {
      // La devanture éclairée du soir : c'est le moment, et c'est la seule des
      // quatre images qui ne montre le métier de personne en particulier.
      photo: "/direct/vitrine-du-soir.jpg",
      cadrage: "72%",
      nom: NOM,
      metier: "Restaurant",
      ville: VILLE,
      distance: DISTANCE,
      reste: "Ce soir",
      icone: "🍽️",
      quoi: "Table à partager",
      lignes: ["6 places", "17 € par personne"],
    },
  },
];

export function Journee() {
  return (
    <section className="jrn">
      <StylesDirect />
      <div className="wrap">
        {/* CE QUI SE PASSE DE L'AUTRE CÔTÉ. La page n'a parlé que de lui
            jusqu'ici ; ces trois lignes montrent la demande qui existe déjà,
            sans lui et sans nous. C'est ce qui rend la suite nécessaire. */}
        <div className="jrn-avant reveal">
          <p className="jrn-a1">
            Chaque jour, des habitants autour de vous cherchent quoi faire, quoi acheter ou où aller.
          </p>
          <p className="jrn-a2">Mais ils ne savent pas forcément ce qui se passe chez vous.</p>
          <div className="jrn-q">
            <span>«&nbsp;Où manger&nbsp;?&nbsp;»</span>
            <span>«&nbsp;Qu&apos;est-ce qu&apos;on mange aujourd&apos;hui&nbsp;?&nbsp;»</span>
          </div>
          <p className="jrn-a3">
            <b>{MARQUE} leur montre ce qui se passe maintenant autour d&apos;eux.</b>
          </p>
        </div>

        <ol className="jrn-fil">
          {MOMENTS.map((m, i) => (
            <li
              className="jrn-m reveal"
              key={m.heure}
              style={{ ["--teinte" as string]: m.teinte, ["--i" as string]: i }}
            >
              <div className="jrn-h">
                <b>{m.heure}</b>
                <span>{m.titre}</span>
              </div>

              {/* LE TEMPS DE LA TRANSFORMATION, et il n'existe qu'ici.
                  Les trois autres moments montrent un résultat ; celui-ci
                  montre le geste qui le produit. C'est la seule chose que la
                  page doit faire comprendre — « vous dites une phrase, elle
                  devient une annonce » — et elle ne se comprend pas en la
                  lisant, seulement en la voyant arriver. */}
              {i === 2 && (
                <div className="jrn-tr">
                  <span className="jrn-dit">
                    <i aria-hidden="true">🎙️</i>«&nbsp;Il me reste 8 lasagnes.&nbsp;»
                  </span>
                  <span className="jrn-fl" aria-hidden="true" />
                  <span className="jrn-fait">{MARQUE} en fait une annonce, tout seul.</span>
                </div>
              )}

              <div className="jrn-c">
                <CarteSwipe carte={m.carte} className="jrn-carte" />
                <span className="jrn-go">{m.action} →</span>
              </div>
            </li>
          ))}
        </ol>

        <p className="jrn-fin reveal">
          {MARQUE} transforme chaque moment de votre journée
          <b> en occasion de faire venir quelqu&apos;un.</b>
        </p>
        {/* LE BOUTON EST ICI PARCE QUE C'EST ICI QU'ON EST CONVAINCU. La page
            n'en avait qu'un, tout en haut, avant d'avoir rien montré : celui
            qui descend jusqu'au bout de la journée devait remonter l'écran
            entier pour agir. Il ramène au formulaire, il n'en ouvre pas un
            second — deux endroits pour créer son site, c'est deux endroits à
            tenir à jour et un doute de plus. */}
        <a className="jrn-cta reveal" href="#top">✨ Créer mon site gratuitement</a>
        <p className="jrn-note reveal">60 secondes · Sans inscription · À partir de vos informations Google</p>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* LE FOND SOMBRE EST LA RUPTURE. Le reste de la page est clair et parle
           du commerçant ; ici on passe de l'autre côté, dans l'écran de ses
           clients. Sans ce changement de monde, la section se lirait comme une
           quatrième liste d'arguments. */
        .jrn{background:radial-gradient(120% 60% at 50% 0%,#12241D 0%,#080D0B 62%),#080D0B;
          color:#EAF2EC;padding:74px 0 78px;}
        .jrn .wrap{max-width:760px;margin:0 auto;padding:0 20px;}

        .jrn-avant{text-align:center;max-width:560px;margin:0 auto 46px;}
        .jrn-a1{font-size:19px;line-height:1.5;color:#C7D8CE;margin:0;text-wrap:balance;}
        .jrn-a2{font-size:19px;line-height:1.5;color:#7F988B;margin:8px 0 0;text-wrap:balance;}
        .jrn-q{display:flex;flex-wrap:wrap;justify-content:center;gap:9px;margin:20px 0 22px;}
        .jrn-q span{font-family:Georgia,serif;font-size:16px;color:#fff;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);
          border-radius:999px;padding:9px 16px;}
        .jrn-a3{font-size:21px;line-height:1.35;margin:0;text-wrap:balance;}
        .jrn-a3 b{font-weight:850;letter-spacing:-.02em;color:#fff;}

        /* LA JOURNÉE EST UNE LIGNE VERTICALE. C'est elle qui dit « ce sont
           quatre moments du MÊME jour » — sans elle on lirait quatre exemples
           interchangeables, c'est-à-dire quatre fonctions. */
        .jrn-fil{position:relative;list-style:none;margin:0;padding:0 0 0 26px;}
        .jrn-fil::before{content:"";position:absolute;left:5px;top:6px;bottom:26px;width:2px;
          background:linear-gradient(180deg,rgba(126,230,192,.05),rgba(126,230,192,.5) 12%,rgba(126,230,192,.5) 88%,rgba(126,230,192,.05));}
        .jrn-m{position:relative;padding-bottom:38px;}
        .jrn-m::before{content:"";position:absolute;left:-26px;top:7px;width:12px;height:12px;border-radius:50%;
          background:var(--teinte,#3DE2A6);box-shadow:0 0 0 4px rgba(8,13,11,1),0 0 18px var(--teinte,#3DE2A6);}
        .jrn-h{display:flex;align-items:baseline;gap:11px;flex-wrap:wrap;}
        .jrn-h b{font-family:'Inter',system-ui,sans-serif;font-size:13px;font-weight:850;letter-spacing:.1em;
          color:var(--teinte,#3DE2A6);font-variant-numeric:tabular-nums;white-space:nowrap;}
        .jrn-h span{font-size:19px;font-weight:800;letter-spacing:-.02em;color:#fff;}

        /* LA PHRASE QUI DEVIENT UNE ANNONCE. Les deux moitiés arrivent l'une
           après l'autre : d'abord ce qu'il dit, puis ce que ça devient. Posées
           ensemble, on lit une équation ; posées à la suite, on voit une
           transformation. */
        .jrn-tr{display:flex;flex-direction:column;gap:9px;margin:15px 0 4px;}
        .jrn-dit{align-self:flex-start;display:inline-flex;align-items:center;gap:9px;
          font-family:Georgia,serif;font-size:17px;color:#fff;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);
          border-radius:14px;padding:11px 16px;
          opacity:0;transform:translate3d(-10px,0,0);transition:opacity .5s ease,transform .6s cubic-bezier(.16,1,.3,1);}
        .jrn-dit i{font-style:normal;font-size:14px;line-height:1;opacity:.8;}
        .jrn-fl{align-self:flex-start;margin-left:19px;width:2px;height:0;
          background:linear-gradient(180deg,rgba(126,230,192,0),#3DE2A6);
          transition:height .45s cubic-bezier(.16,1,.3,1) .35s;}
        .jrn-fait{align-self:flex-start;font-size:13.5px;font-weight:800;color:#8FE9C4;
          opacity:0;transform:translate3d(0,6px,0);transition:opacity .5s ease .6s,transform .5s cubic-bezier(.16,1,.3,1) .6s;}
        .reveal-in .jrn-dit{opacity:1;transform:none;}
        .reveal-in .jrn-fl{height:22px;}
        .reveal-in .jrn-fait{opacity:1;transform:none;}

        .jrn-c{display:flex;flex-direction:column;align-items:flex-start;gap:12px;margin-top:14px;}
        /* La carte est réduite EN ENTIER, pas étranglée en largeur : à 200 px
           de large, le nom du commerce reste écrit en 25 px et passe par-dessus
           le compte à rebours. Le zoom garde les proportions du vrai écran. */
        .jrn-carte{zoom:.78;box-shadow:0 0 0 2px color-mix(in srgb,var(--teinte,#3DE2A6) 45%,transparent),
          0 34px 60px -30px rgba(0,0,0,.95);}
        .jrn-go{font-size:13.5px;font-weight:850;color:#04150E;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);border-radius:999px;padding:9px 17px;
          box-shadow:0 12px 26px -12px rgba(18,185,129,.85);}

        .jrn-fin{margin:12px 0 0;font-size:23px;line-height:1.32;letter-spacing:-.02em;
          text-align:center;color:#C7D8CE;text-wrap:balance;}
        .jrn-fin b{display:block;color:#fff;font-weight:850;}

        .jrn-cta{display:block;width:max-content;max-width:100%;margin:26px auto 0;text-decoration:none;
          font-size:16px;font-weight:850;letter-spacing:-.01em;color:#04150E;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);border-radius:16px;padding:16px 28px;
          box-shadow:0 20px 44px -18px rgba(18,185,129,.9);}
        .jrn-note{margin:13px 0 0;text-align:center;font-size:12.5px;color:#7F988B;}

        @media (min-width:720px){
          .jrn{padding:96px 0 100px;}
          .jrn-carte{zoom:.9;}
          .jrn-fin{font-size:28px;}
        }
        @media (prefers-reduced-motion:reduce){
          .jrn-dit,.jrn-fl,.jrn-fait{transition:none;opacity:1;transform:none;height:auto;}
          .jrn-fl{height:22px;}
        }
      `,
        }}
      />
    </section>
  );
}
