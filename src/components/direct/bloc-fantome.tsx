"use client";

// ✨ LE BLOC « À ESSAYER » — le cœur de la page commerçant, tel qu'il est dessiné.
//
// ═══ POURQUOI CE FICHIER EXISTE ════════════════════════════════════════════
//
// « Le design n'a rien à voir avec le design que je t'ai donné. Il faut que ce
// soit absolument identique. Étudie-le bien d'abord. »
//
// IL AVAIT RAISON, ET LE DÉFAUT N'ÉTAIT PAS COSMÉTIQUE. La page montait
// `MurContenu` tel quel dans un cadre sombre : on obtenait l'écran du FIL,
// posé sur une page de commerce. Or ses maquettes ne montrent pas cet écran-là.
// Elles montrent une VITRINE : un panneau rose clair, un fantôme qui tient
// l'outil du métier, une question en grand, un bouton, et une bande de styles
// qu'on parcourt du pouce.
//
// LA DIFFÉRENCE EST DE NATURE. Dans le fil, on est arrivé par un fantôme et
// l'écran doit se présenter. Ici, on est ENTRÉ CHEZ QUELQU'UN et l'onglet qu'on
// a touché s'appelle « À essayer » : il ne reste rien à présenter, il reste à
// donner envie et à ouvrir l'appareil photo.
//
// ═══ CE QUI CHANGE D'UN MÉTIER À L'AUTRE, ET CE QUI NE CHANGE JAMAIS ═══════
//
// « 80 % de structure identique, 20 % d'expérience métier. »
//
// NE CHANGE JAMAIS : le panneau, la place du fantôme, la question en deux
// lignes dont la fin est en couleur, le grand bouton, le « ou », le bouton
// d'import, les deux polaroïds, la bande de styles.
//
// CHANGE : l'outil que tient le fantôme, le nom de la chose qu'on essaie, le
// verbe du bouton, ce que montrent les vignettes. Tout vient de
// `Mur.essai.mots` et du catalogue — donc du métier, pas d'un réglage écrit ici.

import { useMemo, useRef, useState } from "react";
import { FantomeMetier, outilDuMetier } from "@/components/direct/fantome-metier";
import type { Mur } from "@/lib/direct/fantomes";

/**
 * LA CHOSE QU'ON ESSAIE, DANS LA QUESTION.
 *
 * « Quel STYLE D'ONGLES vous fait envie aujourd'hui ? » · « Quelle PIÈCE DE
 * VIANDE avez-vous envie de cuisiner aujourd'hui ? » · « Quel LOOK vous fait
 * envie aujourd'hui ? »
 *
 * LE GENRE EST DANS LA TABLE, PAS DEVINÉ. « Quel » ou « Quelle » se décide sur
 * le nom qui suit, et aucune règle ne le déduit d'une chaîne : un accord faux
 * en tête de page, en vingt-huit points, est la première chose qu'on lit.
 *
 * `verbe` EXISTE PARCE QUE LE BOUCHER NE S'ESSAIE PAS SUR SOI. On ne porte pas
 * une côte de bœuf : on la cuisine. Sa maquette écrit « avez-vous envie de
 * cuisiner », et c'est le seul des trois qui ne dit pas « vous fait envie ».
 */
const CHOSES: { quand: RegExp; quel: string; chose: string; verbe: string }[] = [
  { quand: /ongulaire|onglerie|proth[ée]siste/i, quel: "Quel", chose: "style d’ongles", verbe: "vous fait envie" },
  { quand: /coiffeur|coiffure|barbier/i, quel: "Quelle", chose: "tête", verbe: "aimeriez-vous avoir" },
  { quand: /boucher|charcut/i, quel: "Quelle", chose: "pièce de viande", verbe: "avez-vous envie de cuisiner" },
  { quand: /mode|pr[êe]t-[àa]-porter|friperie|fripe/i, quel: "Quel", chose: "look", verbe: "vous fait envie" },
  { quand: /lunet|opticien/i, quel: "Quelle", chose: "monture", verbe: "vous irait le mieux" },
  { quand: /fleurist/i, quel: "Quel", chose: "bouquet", verbe: "vous ferait plaisir" },
  { quand: /tatou/i, quel: "Quel", chose: "motif", verbe: "vous tente" },
  { quand: /bijou|bracelet|collier/i, quel: "Quelle", chose: "pièce", verbe: "vous irait le mieux" },
  { quand: /cirier|ciri[èe]re|bougie/i, quel: "Quelle", chose: "bougie", verbe: "irait chez vous" },
  { quand: /boulanger|p[âa]tiss/i, quel: "Quelle", chose: "gourmandise", verbe: "vous fait envie" },
];

function laQuestion(
  metier: string,
  quoi: "essai" | "gout" | "mur",
  plat?: string,
): { debut: string; fin: string } {
  /**
   * CHEZ UN RESTAURANT OU UN BAR, LA QUESTION PORTE LE PLAT, PAS LE MÉTIER.
   *
   * « On va jouer autour du mot essayer, et faire essayer le plat du jour avant
   * même d'y aller. » Demander « quel plat vous fait envie » à quelqu'un qui a
   * UN plat du jour devant lui n'a pas de sens : ce qui se décide, c'est s'il y
   * va. La question nomme donc le plat et propose de le goûter d'abord.
   */
  if (quoi === "gout") {
    /**
     * LE PLAT NE VA PAS DANS LA QUESTION, ET C'EST UNE AFFAIRE D'ARTICLE.
     *
     * Premier jet : « Et si vous goûtiez garbure landaise, magret grillé avant
     * d'y aller ? » Il manque « la ». Et on ne peut pas le poser ici : « le
     * verre du soir », « la garbure », « les lasagnes » — le genre et le nombre
     * se lisent sur le nom, pas sur une règle, et un article faux en
     * vingt-trois points est la première chose qu'on lit.
     *
     * LE NOM DU PLAT DESCEND DONC DANS LA PHRASE, où il est annoncé par deux
     * points et n'a besoin d'aucun accord. La question reste courte, et elle
     * dit ce qu'elle a à dire : on goûte AVANT d'y aller.
     */
    return { debut: "Et si vous goûtiez", fin: "avant d’y aller ?" };
  }
  /**
   * ET SANS ESSAI NI PARCOURS, ON NE FAIT PAS SEMBLANT.
   *
   * Le bloc ouvre le mur de présence : la seule question honnête est celle à
   * laquelle ce mur répond. Écrire « quelle pièce vous fait envie » au-dessus
   * d'un mur de messages promettrait un essayage qui n'existe pas encore chez
   * ce commerçant.
   */
  if (quoi === "mur") {
    return { debut: "Qui est là", fin: "en ce moment ?" };
  }
  const c = CHOSES.find((x) => x.quand.test(metier));
  // LE REPLI NE PRÉTEND RIEN SAVOIR DU MÉTIER, et c'est la règle de tout ce
  // dossier : mieux vaut une question générale et juste qu'une question précise
  // et fausse. Voir le mur des bougies chez l'hypnothérapeute.
  if (!c) return { debut: "Qu’est-ce qui vous ferait envie", fin: "aujourd’hui ?" };
  return { debut: `${c.quel} ${c.chose} ${c.verbe}`, fin: "aujourd’hui ?" };
}

/**
 * ═══ CE QUE LE BLOC OUVRE, ET IL Y A TROIS CAS ════════════════════════════
 *
 * « Il y a certains métiers qui n'ont pas leur fantôme, comme le boucher ou les
 * restaurants, magasin de vêtements, bars… pourtant je t'ai bien mis les
 * fantômes. »
 *
 * LES MASCOTTES ÉTAIENT LÀ, LE BLOC NE L'ÉTAIT PAS. Il ne se dessinait que pour
 * les métiers qui ont un essayage sur photo ; un restaurant, un bar, un boucher
 * tombaient sur l'autre branche — le parcours du plat ou le mur de présence — et
 * ne voyaient jamais ni fantôme, ni question, ni bouton. C'était un verrou que
 * j'avais posé, pas un fichier qui manquait.
 *
 * LE BLOC EST DONC LA PORTE DE TOUS LES MÉTIERS, et ce qu'il annonce suit ce
 * qu'il y a derrière :
 *
 *   · `essai` — on se photographie, la pièce s'installe. Appareil photo, et le
 *     verbe du métier : « Photographier ma main ».
 *   · `gout` — on joue avec le plat du jour avant d'y aller. Pas d'appareil
 *     photo : on ne photographie rien, on entre dans un parcours.
 *   · `mur` — il n'y a ni l'un ni l'autre. On ne promet donc pas d'essayer : on
 *     propose de laisser son Fantôme, ce qui est exactement ce que le bloc
 *     ouvre. Un bouton qui annonce autre chose que ce qu'il fait est la
 *     promesse la plus concrète qu'un écran puisse rompre.
 */
export type QuoiEssayer = "essai" | "gout" | "mur";

export function BlocFantome({
  mur,
  quoi,
  onPhoto,
  onImporter,
  onStyle,
  styleChoisi,
}: {
  mur: Mur;
  /** Ce qu'il y a derrière le grand bouton. Voir `QuoiEssayer`. */
  quoi: QuoiEssayer;
  /** Ouvre l'appareil photo. C'est le geste principal de toute la page. */
  onPhoto: () => void;
  /** Ouvre la photothèque. Deuxième chemin vers le même écran. */
  onImporter: () => void;
  /** Choisir un style dans la bande. */
  onStyle: (id: string) => void;
  styleChoisi?: string;
}) {
  const q = useMemo(
    () => laQuestion(mur.metier, quoi, mur.gout?.plat?.toLowerCase()),
    [mur.metier, quoi, mur.gout],
  );
  const outil = useMemo(() => outilDuMetier(mur.metier), [mur.metier]);
  const pieces = mur.essai?.pieces ?? [];
  const bande = useRef<HTMLUListElement>(null);

  /**
   * LES DEUX ANNOTATIONS DE LA MARGE.
   *
   * Ses trois maquettes en portent deux, à droite, sur des polaroïds légèrement
   * tournés : « Osez, testez, trouvez votre style ♡ », « Des ongles qui vous
   * vont bien ♡ ». Elles n'informent de rien — ce sont des voix, et c'est
   * exactement leur travail : dire que derrière l'écran il y a quelqu'un.
   *
   * ELLES NE S'AFFICHENT QUE S'IL Y A DES PHOTOS À METTRE DESSOUS. Un polaroïd
   * vide avec une légende manuscrite serait un cadre qui parle de rien.
   */
  const polas = pieces.filter((p) => p.photo).slice(0, 2);

  return (
    <section className="bf" style={{ "--bf-teinte": outil.teinte } as React.CSSProperties}>
      {/* ═══ LE PANNEAU ROSE ══════════════════════════════════════════════════
          Un dégradé très pâle, coins très arrondis. C'est lui qui distingue le
          cœur du reste de la page : tout ce qui est dedans est « à essayer »,
          tout ce qui est dehors est la vitrine. */}
      <div className={`bf-panneau${polas.length > 0 ? " avec-polas" : ""}`}>
        {/* L'ANNOTATION DU COIN, AU-DESSUS DU FANTÔME. « Et si vous l'essayiez ? »
            C'est la question que le fantôme pose, écrite de sa main. */}
        <span className="bf-main" aria-hidden="true">
          Et si vous
          <br />
          l’essayiez&nbsp;? ♡
        </span>

        <div className="bf-haut">
          <FantomeMetier metier={mur.metier} classe="bf-f" />

          <div className="bf-mots">
            <h2 className="bf-q">
              {q.debut} <b>{q.fin}</b>
            </h2>
            <p className="bf-p">
              {quoi === "gout"
                ? `${mur.gout?.plat ?? "Le plat du jour"} : ne le regardez pas, jouez avec.`
                : quoi === "mur"
                  ? "Laissez un mot, dites ce que vous cherchez, ou simplement que vous êtes là."
                  : (mur.essai?.mots.phrase ?? "Essayez sur vous, en quelques secondes.")}
            </p>
          </div>
        </div>

        {/* ═══ LE GRAND GESTE ════════════════════════════════════════════════
            Pastille pleine, dégradé du métier, un appareil photo à gauche et
            une flèche dans un rond à droite — c'est le dessin exact des trois
            maquettes, et le rond de droite n'est pas un ornement : il dit qu'on
            part ailleurs, là où l'icône de gauche dit avec quoi. */}
        <button type="button" className="bf-cta" onClick={onPhoto}>
          {/* L'ICÔNE DIT AVEC QUOI ON LE FAIT, DONC ELLE CHANGE AVEC LE CAS. Un
              appareil photo devant « Goûter le plat du jour » ferait chercher
              son téléphone à quelqu'un qui n'a rien à photographier. */}
          {quoi === "essai" ? (
            <svg className="bf-cta-i" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 8.5h3.2l1.4-2.2h6.8l1.4 2.2H20a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18v-8A1.5 1.5 0 0 1 4 8.5z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="14" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          ) : (
            <svg className="bf-cta-i" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 3.2l2.1 5.1 5.5.4-4.2 3.6 1.3 5.4L12 15l-4.7 2.7 1.3-5.4-4.2-3.6 5.5-.4z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          )}
          <span>
            {quoi === "gout"
              ? "Goûter avant d’y aller"
              : quoi === "mur"
                ? "Laisser mon Fantôme"
                : (mur.essai?.mots.geste ?? "Je me prends en photo")}
          </span>
          <s aria-hidden="true">→</s>
        </button>

        {/* LE SECOND CHEMIN N'EXISTE QUE S'IL MÈNE AU MÊME ENDROIT. On importe
            une photo pour ESSAYER ; on n'importe rien pour jouer avec un plat
            ni pour laisser un mot sur un mur. */}
        {quoi === "essai" && (
          <div className="bf-ou" aria-hidden="true">
            <i />
            <span>ou</span>
            <i />
          </div>
        )}

        {quoi === "essai" && (
        <button type="button" className="bf-import" onClick={onImporter}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="8.6" cy="10" r="1.7" fill="currentColor" />
            <path d="M4 17l5-5 3.4 3.4L16 11l4 4.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          Importer une photo
        </button>
        )}

        {/* LES DEUX POLAROÏDS DE LA MARGE. Voir `polas` : absents s'il n'y a pas
            de photo, parce qu'un cadre vide avec une légende manuscrite parle
            de rien. */}
        {polas.length > 0 && (
          <div className="bf-polas" aria-hidden="true">
            {polas.map((p, i) => (
              <figure key={p.id} className={i === 0 ? "bf-pola un" : "bf-pola deux"}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo} alt="" />
                <figcaption>
                  {i === 0 ? "Osez, testez, trouvez votre style ♡" : "Ça vous irait bien ♡"}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>

      {/* ═══ LA BANDE DE STYLES ═══════════════════════════════════════════════

          Sept vignettes carrées, le nom dessous, la première entourée. Elle
          défile au pouce plutôt que de passer à la ligne : repliée, elle
          fabriquerait une grille de trois rangées qui pousse tout le reste de
          la page hors de l'écran, et qui change de hauteur selon le nombre de
          pièces du commerçant.

          ELLE NE SE DESSINE QUE S'IL Y A DES PIÈCES. Un commerce dont le
          catalogue n'est pas encore photographié garde le bloc et perd la
          bande — c'est la même règle que les miniatures sous l'annonce. */}
      {pieces.length > 0 && (
        <ul className="bf-styles" ref={bande}>
          {pieces.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={styleChoisi === p.id ? "on" : undefined}
                aria-pressed={styleChoisi === p.id}
                onClick={() => onStyle(p.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo} alt="" />
                <span>{p.nom}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Styles />
    </section>
  );
}

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .bf{display:block;}

        /* ═══ LE PANNEAU ROSE ══════════════════════════════════════════════
           Le degrade est tres pale — c'est un fond, pas une couleur. La teinte
           du metier n'y entre qu'a huit pour cent : au-dela, le rose de
           l'onglerie et le violet du coiffeur donnent deux applications
           differentes au lieu d'un meme produit chez deux commercants. */
        .bf-panneau{position:relative;overflow:hidden;
          margin:0 14px;padding:18px 16px 20px;border-radius:26px;
          background:
            radial-gradient(120% 90% at 12% 8%,
              color-mix(in srgb, var(--bf-teinte) 14%, transparent) 0%,
              transparent 58%),
            linear-gradient(165deg,#FFF3F8 0%,#FDF7FB 46%,#F7F3FF 100%);
          border:1px solid rgba(20,16,40,.05);
          box-shadow:0 18px 44px -30px rgba(40,20,70,.4);}

        /* ─── L'ANNOTATION DU COIN ───
           Elle est en absolu et sous le fantome dans l'ordre de peinture : dans
           le flux, elle poussait le titre de trente points sur les metiers qui
           en ont une et pas sur les autres, donc la mise en page sautait d'un
           commerce a l'autre. */
        .bf-main{position:absolute;left:14px;top:14px;z-index:2;
          font-family:var(--font-main-levee),'Segoe Script',cursive;
          font-size:17px;line-height:1.12;color:#8A6B9E;
          transform:rotate(-7deg);pointer-events:none;}

        /* ═══ LA QUESTION NE PASSE PAS SOUS LES POLAROIDS ══════════════════
           Ils sont en absolu contre le bord droit ; sans reserve, le titre
           courait DESSOUS et on lisait « Quel style d'ongles v… fait envie ».
           Le panneau reserve donc leur largeur quand il y en a — c'est ce que
           fait la maquette, ou le titre casse plus tot pour leur laisser la
           place. Sans polaroid, la question reprend toute la largeur. */
        .bf-haut{display:flex;align-items:flex-start;gap:10px;
          padding-top:34px;}
        /* SEULE LA QUESTION CEDE LA PLACE, ET C'EST TOUT LE REGLAGE. Premier
           jet : la reserve portait aussi sur le bouton, le « ou » et l'import —
           les trois se retrouvaient a deux tiers de largeur avec un vide a
           droite, alors que la maquette les fait tous PLEINE LARGEUR sous les
           polaroids. Les polaroids ne genent que le haut du panneau, donc seul
           le haut leur cede quelque chose. */
        .bf-panneau.avec-polas .bf-mots{padding-right:80px;}
        .bf-haut{align-items:center;}
        .bf-mots{flex:1;min-width:0;padding-top:4px;}

        /* ─── LA QUESTION ───
           Deux lignes, la fin en couleur. C'est le dessin exact des trois
           maquettes, et la coupure n'est pas laissee au hasard : « aujourd'hui ? »
           part en gras colore parce que c'est le mot qui rend la question
           urgente. Sans lui, on demande « quel style vous plait », ce qui ne se
           decide pas aujourd'hui. */
        .bf-q{margin:0;font-size:clamp(18px,5.1vw,23px);font-weight:820;
          line-height:1.16;letter-spacing:-.024em;color:#151B33;
          text-wrap:balance;hyphens:auto;}
        .bf-q b{font-weight:820;color:var(--bf-teinte);}
        .bf-p{margin:8px 0 0;font-size:12.5px;line-height:1.45;color:#6E7690;}

        /* ═══ LE GRAND GESTE ═══════════════════════════════════════════════ */
        .bf-cta{position:relative;z-index:2;
          display:flex;align-items:center;gap:11px;width:100%;
          margin-top:16px;padding:14px 12px 14px 17px;
          font-family:inherit;font-size:15px;font-weight:800;color:#FFFFFF;
          cursor:pointer;border:none;border-radius:999px;text-align:left;
          background:linear-gradient(98deg,
            color-mix(in srgb, var(--bf-teinte) 82%, #7B2FF2) 0%,
            var(--bf-teinte) 62%,
            color-mix(in srgb, var(--bf-teinte) 78%, #FF2D6F) 100%);
          box-shadow:0 14px 30px -14px color-mix(in srgb, var(--bf-teinte) 80%, transparent);}
        .bf-cta:active{transform:scale(.985);}
        .bf-cta-i{width:21px;height:21px;flex:none;}
        .bf-cta span{flex:1;min-width:0;}
        /* LA FLECHE EST DANS UN ROND BLANC, comme sur les trois maquettes. Elle
           dit qu'on part ailleurs la ou l'appareil photo dit avec quoi. */
        .bf-cta s{flex:none;text-decoration:none;
          width:32px;height:32px;border-radius:50%;
          display:inline-flex;align-items:center;justify-content:center;
          font-size:16px;color:var(--bf-teinte);background:#FFFFFF;}

        /* ─── « OU » ─── Un filet de chaque cote, comme la maquette. */
        .bf-ou{display:flex;align-items:center;gap:11px;margin:12px 2px;}
        .bf-ou i{flex:1;height:1px;background:rgba(30,20,60,.12);}
        .bf-ou span{font-size:12px;font-weight:650;color:#8A90A6;}

        .bf-import{display:flex;align-items:center;justify-content:center;gap:9px;
          width:100%;padding:13px 16px;cursor:pointer;
          font-family:inherit;font-size:14.5px;font-weight:700;color:#3A4160;
          background:#FFFFFF;border:1px solid rgba(30,20,60,.13);border-radius:999px;}
        .bf-import:active{transform:scale(.985);}
        .bf-import svg{width:19px;height:19px;flex:none;color:#6E7690;}

        /* ═══ LES POLAROIDS DE LA MARGE ════════════════════════════════════
           Ils sont DECORATIFS et le disent : aria-hidden sur le bloc entier.
           Sur telephone ils sont petits et debordent volontairement du bord
           droit — c'est ce que fait la maquette, et c'est ce qui donne
           l'impression d'un carnet plutot que d'un formulaire. */
        .bf-polas{position:absolute;right:-12px;top:52px;z-index:1;
          display:flex;flex-direction:column;gap:14px;pointer-events:none;}
        .bf-pola{margin:0;width:76px;padding:5px 5px 0;background:#FFFFFF;
          border-radius:5px;box-shadow:0 8px 20px -10px rgba(40,20,70,.45);}
        .bf-pola.un{transform:rotate(4deg);}
        .bf-pola.deux{transform:rotate(-5deg);}
        .bf-pola img{display:block;width:100%;height:64px;object-fit:cover;
          border-radius:3px;}
        .bf-pola figcaption{padding:4px 2px 6px;
          font-family:var(--font-main-levee),'Segoe Script',cursive;
          font-size:11px;line-height:1.15;color:#6E6280;text-align:center;}
        /* SOUS TROIS CENT CINQUANTE POINTS, ON LES RETIRE TOUT A FAIT. La
           reserve de quatre-vingt-seize points ne laisserait plus assez de
           largeur a la question, et un ornement qui empeche de lire n'est plus
           un ornement. La reserve tombe avec eux. */
        /* ═══ LES POLAROIDS NE TIENNENT PAS SUR UN TELEPHONE ETROIT ═════════
           MESURE, ET ELLE TRANCHE : sur trois cent quatre-vingt-dix points, le
           panneau offre trois cent trente de large. Le fantome en prend
           quatre-vingt-huit, l'espace dix, la reserve des polaroids
           quatre-vingts — il reste CENT CINQUANTE-DEUX points pour la question,
           qui passe alors en six lignes. Sa maquette la met en trois.

           SA MAQUETTE EST DESSINEE PLUS LARGE QUE CA. Son cadre fait quatre cent
           soixante points environ ; a cette largeur la composition tient, et les
           polaroids reviennent d'eux-memes. En dessous, la question reprend
           toute la place a droite du fantome : entre un ornement et le seul
           texte que la page pose, on garde le texte. */
        @media (max-width:429px){
          .bf-polas{display:none;}
          .bf-panneau.avec-polas .bf-mots{padding-right:0;}
        }

        /* ═══ LA BANDE DE STYLES ═══════════════════════════════════════════ */
        .bf-styles{list-style:none;margin:14px 0 0;padding:0 14px 4px;
          display:flex;gap:9px;overflow-x:auto;scroll-snap-type:x proximity;
          scrollbar-width:none;-webkit-overflow-scrolling:touch;}
        .bf-styles::-webkit-scrollbar{display:none;}
        .bf-styles li{flex:none;scroll-snap-align:start;}
        .bf-styles button{display:flex;flex-direction:column;align-items:center;
          gap:7px;width:84px;padding:0;cursor:pointer;
          background:none;border:none;font-family:inherit;}
        .bf-styles img{display:block;width:84px;height:84px;object-fit:cover;
          border-radius:15px;border:2.5px solid transparent;
          transition:border-color .16s ease,transform .16s ease;}
        /* CELLE QU'ON A CHOISIE PORTE LE LISERE DU METIER. Sans marque nette on
           ne sait plus ce qu'on vient de toucher, et on retouche. */
        .bf-styles button.on img{border-color:var(--bf-teinte);
          box-shadow:0 0 0 3px color-mix(in srgb, var(--bf-teinte) 18%, transparent);}
        .bf-styles button:active img{transform:scale(.96);}
        .bf-styles span{font-size:11.5px;font-weight:650;line-height:1.2;
          color:#4A5168;text-align:center;
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}
        .bf-styles button.on span{color:#151B33;font-weight:800;}

        /* ═══ LE FANTOME ═══════════════════════════════════════════════════ */
        .fm{position:relative;flex:none;display:block;width:88px;height:97px;}
        /* ═══ LA MASCOTTE PREND PLUS DE PLACE QUE LE FANTOME DESSINE ════════
           Ses neuf dessins portent un decor — une toque, une planche, un
           bouquet, un pinceau — la ou le fantome vectoriel n'est qu'un corps.
           A quatre-vingt-huit points, l'entrecote du boucher devient une tache
           rouge de douze points : on ne voit plus ce qu'il tient, donc on perd
           exactement ce qui fait l'interet de ces dessins.
           CENT VINGT-HUIT POINTS, ET LA QUESTION GARDE SA PLACE : le panneau
           offre trois cent trente, la mascotte en prend cent vingt-huit, il
           reste cent quatre-vingt-quatorze pour le titre — de quoi le poser en
           trois ou quatre lignes, comme la maquette. */
        .fm.vrai{width:112px;height:auto;align-self:center;margin-left:-6px;}
        .fm-img{display:block;width:100%;height:auto;
          filter:drop-shadow(0 10px 22px rgba(90,40,130,.24));
          animation:fmFlotte 4.2s ease-in-out infinite;}
        .bf-f{margin-top:-6px;}
        /* LE HALO EST DERRIERE LE CORPS, ET IL RESPIRE. C'est ce qui fait la
           difference entre un pictogramme et un personnage lumineux — les
           rendus de la maquette sont tous eclaires de l'interieur. */
        .fm-halo{position:absolute;left:50%;top:52%;width:150%;height:135%;
          transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;
          background:radial-gradient(circle,
            color-mix(in srgb, var(--fm-teinte) 42%, transparent) 0%,
            color-mix(in srgb, var(--fm-teinte) 14%, transparent) 42%,
            transparent 70%);
          animation:fmRespire 3.6s ease-in-out infinite;}
        @keyframes fmRespire{
          0%,100%{opacity:.75;transform:translate(-50%,-50%) scale(1);}
          50%{opacity:1;transform:translate(-50%,-50%) scale(1.07);}
        }
        .fm-corps{position:relative;width:100%;height:100%;display:block;
          filter:drop-shadow(0 8px 16px rgba(60,30,90,.18));
          animation:fmFlotte 3.6s ease-in-out infinite;}
        @keyframes fmFlotte{
          0%,100%{transform:translateY(0) rotate(0deg);}
          50%{transform:translateY(-5px) rotate(-1.5deg);}
        }
        /* L'OUTIL EST TENU EN BAS A DROITE, legerement incline : c'est la pose
           des trois maquettes, ou le fantome presente l'objet plutot que de le
           porter. */
        .fm-outil{position:absolute;right:-6px;bottom:4px;
          font-size:30px;line-height:1;pointer-events:none;
          filter:drop-shadow(0 4px 8px rgba(40,20,70,.3));
          transform:rotate(-14deg);
          animation:fmOutil 3.6s ease-in-out infinite;}
        @keyframes fmOutil{
          0%,100%{transform:rotate(-14deg) translateY(0);}
          50%{transform:rotate(-9deg) translateY(-4px);}
        }

        @media (prefers-reduced-motion:reduce){
          .fm-halo,.fm-corps,.fm-outil{animation:none;}
          .bf-cta:active,.bf-import:active,.bf-styles button:active img{
            transform:none;}
        }
    `,
      }}
    />
  );
}
