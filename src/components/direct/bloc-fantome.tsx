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

/**
 * CEUX CHEZ QUI ON MANGE SUR PLACE, ET LES AUTRES.
 *
 * L'AVANT-GOÛT N'EST PLUS RÉSERVÉ À LA RESTAURATION — la boucherie en a un — et
 * dès qu'il sort de la table, deux mots cessent d'être vrais : on ne « goûte »
 * pas une pièce crue, et on ne « réserve » pas un morceau de viande. La règle
 * sépare donc ce qui se sert de ce qui se fabrique, et rien d'autre.
 */
const SERT = /restaurant|bistrot|brasserie|traiteur|pizz|bar|caviste|vins|table/i;

function laQuestion(
  metier: string,
  quoi: QuoiEssayer,
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
    /**
     * ET ON NE GOÛTE PAS CHEZ UN BOUCHER.
     *
     * « La boucherie est comme un restaurant, donc on voit en plusieurs étapes
     * les secrets du boucher sur sa préparation. »
     *
     * LE PARCOURS EST LE MÊME, LE MOT NE PEUT PAS L'ÊTRE. Chez un restaurant on
     * goûte le plat du jour avant d'y aller ; chez un boucher on ne goûte rien —
     * on repart avec une pièce crue qu'on cuira soi-même. « Et si vous goûtiez
     * la côte de bœuf maturée avant d'y aller ? » promet quelque chose qui
     * n'arrivera pas, et c'est la première phrase de la page.
     *
     * CE QUI SE JOUE CHEZ LUI, CE SONT SES SECRETS — c'est le mot de sa demande,
     * et c'est ce que son parcours contient : le froid, la croûte, le sel.
     */
    if (!SERT.test(metier)) {
      return { debut: "Et si vous découvriez", fin: "ses secrets ?" };
    }
    return { debut: "Et si vous goûtiez", fin: "avant d’y aller ?" };
  }
  /**
   * ET CHEZ UN BAR OU UN ÉVÉNEMENT, CE QU'ON ESSAIE N'A PAS ENCORE EU LIEU.
   *
   * « Essayez un bout de cette soirée. » C'est le titre de sa maquette, et il
   * est juste au mot près : on ne goûte pas un plat, on ne découvre pas un
   * savoir-faire — on prend un morceau de quelque chose qui se passera dans
   * quelques heures. La question de la vitrine le dit donc au futur.
   */
  if (quoi === "soiree") {
    return { debut: "Et si vous essayiez", fin: "un bout de cette soirée ?" };
  }
  /**
   * ET SANS ESSAI NI PARCOURS NI SOIRÉE, ON NE FAIT PAS SEMBLANT.
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
 * ═══ CE QUE LE BLOC OUVRE, ET IL Y A QUATRE CAS ══════════════════════════
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
 *   · `soiree` — on essaie un bout de ce qui se passera ce soir, puis on dit
 *     ce qu'on cherche, puis on entre dans le Live. C'est le seul des quatre
 *     dont l'objet n'existe pas encore au moment où on l'essaie.
 *   · `mur` — il n'y a aucun des trois. On ne promet donc pas d'essayer : on
 *     propose de laisser son Fantôme, ce qui est exactement ce que le bloc
 *     ouvre. Un bouton qui annonce autre chose que ce qu'il fait est la
 *     promesse la plus concrète qu'un écran puisse rompre.
 */
export type QuoiEssayer = "essai" | "gout" | "soiree" | "mur";

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
      {/* LA CLASSE « avec-polas » A DISPARU AVEC CE QU'ELLE SERVAIT. Elle
          réservait une bande à droite de la question pour que les polaroïds,
          posés en absolu, ne la recouvrent pas. Ils sont maintenant dans le
          rang : c'est la mise en page qui répartit la largeur, et une classe
          qui ne pilote plus rien finit par piloter autre chose. */}
      <div className="bf-panneau">
        {/* L'ANNOTATION DU COIN, AU-DESSUS DU FANTÔME. « Et si vous l'essayiez ? »
            C'est la question que le fantôme pose, écrite de sa main. */}
        <span className="bf-main" aria-hidden="true">
          Et si vous
          <br />
          l’essayiez&nbsp;? ♡
        </span>

        {/* ═══ LE HAUT DU PANNEAU : LE FANTÔME, LA QUESTION, LES POLAROÏDS ═══

            LES TROIS SONT DANS LE MÊME RANG, ET C'EST CE QUI A CHANGÉ. Les
            polaroïds étaient posés en absolu contre le bord droit ; ils en
            sortaient. Dans le rang, ils ne peuvent plus déborder de rien —
            c'est la mise en page qui leur donne leur place, pas un décalage
            écrit à la main. Voir la feuille : sur téléphone, la question passe
            SOUS le fantôme et les polaroïds, ce qui lui rend toute la largeur
            et permet au fantôme d'être enfin grand. */}
        <div className="bf-haut">
          <FantomeMetier metier={mur.metier} classe="bf-f" />

          <div className="bf-mots">
            <h2 className="bf-q">
              {q.debut} <b>{q.fin}</b>
            </h2>
            <p className="bf-p">
              {quoi === "gout"
                ? // LA PHRASE NE PORTE AUCUN GENRE, ET C'EST EXPRÈS. Elle
                  // nommait le plat puis disait « ne LE regardez pas » : juste
                  // pour « le magret », faux pour « la côte de bœuf », et il
                  // n'existe aucune règle pour le deviner sur une chaîne. On
                  // écrit donc une phrase qui n'a pas besoin de le savoir.
                  `${mur.gout?.plat ?? "Le plat du jour"}. Ne restez pas devant : jouez avec.`
                : quoi === "soiree"
                  ? `${mur.soiree?.quand ?? "Ce soir"} : écoutez, regardez, dites ce que vous cherchez, et voyez ce qui se prépare.`
                  : quoi === "mur"
                    ? "Laissez un mot, dites ce que vous cherchez, ou simplement que vous êtes là."
                  : (mur.essai?.mots.phrase ?? "Essayez sur vous, en quelques secondes.")}
            </p>
          </div>

          {/* LES DEUX POLAROÏDS DE LA MARGE. Voir `polas` : absents s'il n'y a
              pas de photo, parce qu'un cadre vide avec une légende manuscrite
              parle de rien. */}
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
              ? SERT.test(mur.metier)
                ? "Goûter avant d’y aller"
                : "Découvrir ses secrets"
              : quoi === "soiree"
                ? "Essayer cette soirée"
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
        /* LE PANNEAU PREND PRESQUE TOUTE LA LARGEUR, comme sur les trois
           maquettes : mesure faite sur le fichier de la boutique de mode, ou
           le panneau occupe quatre-vingt-dix-sept pour cent du cadre.
           IL NE POSE PLUS SA PROPRE MARGE : elle s'ajoutait a celle de la
           section qui l'accueille, et le panneau se retrouvait a
           vingt-huit points du bord pour onze sur la maquette. C'est la page
           qui decide de sa gouttiere, ici comme pour tout le reste. */
        .bf-panneau{position:relative;overflow:hidden;
          margin:0;padding:16px 14px 18px;border-radius:26px;
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

        /* ═══ LE HAUT DU PANNEAU ═══════════════════════════════════════════
           TROIS ELEMENTS DANS UN RANG : le fantome, la question, les deux
           polaroids. Sur telephone la question passe en dessous — voir plus
           bas, c'est la seule maniere de donner au fantome la taille qu'il a
           sur la maquette sans etrangler le titre. */
        .bf-haut{display:flex;flex-wrap:wrap;align-items:center;
          gap:10px;padding-top:30px;}
        /* LA QUESTION PASSE D'EMBLEE SOUS LE RANG, ET C'EST L'ETAT PAR DEFAUT
           — pas un repli. La regle large la remonte au-dessus de cinq cent
           soixante points ; voir plus bas, avec la mesure qui l'explique.
           TOUT EST DIT ICI EN UN SEUL BLOC parce qu'un meme nom declare a deux
           endroits eloignes herite de lui-meme dans l'ordre d'ecriture : le
           defaut a deja ete paye trois fois dans ce dossier. */
        .bf-mots{flex:1 1 100%;min-width:0;order:3;}

        /* ─── LA QUESTION ───
           Deux lignes, la fin en couleur. C'est le dessin exact des trois
           maquettes, et la coupure n'est pas laissee au hasard : « aujourd'hui ? »
           part en gras colore parce que c'est le mot qui rend la question
           urgente. Sans lui, on demande « quel style vous plait », ce qui ne se
           decide pas aujourd'hui. */
        /* LA QUESTION REPREND LA TAILLE DE LA MAQUETTE. Mesuree sur son
           fichier : vingt-huit points sur un cadre de sept cent soixante-huit,
           soit trois virgule six pour cent de la largeur. Elle etait plafonnee
           a vingt-trois parce qu'elle partageait son rang avec le fantome et
           les polaroids ; maintenant qu'elle a toute la largeur, elle peut
           avoir sa taille. */
        .bf-q{margin:0;font-size:clamp(20px,6vw,28px);font-weight:820;
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

        /* ═══ LES POLAROIDS ════════════════════════════════════════════════
           Ils sont DECORATIFS et le disent : aria-hidden sur le bloc entier.

           « Les polaroides que tu as crees sortent du cadre et ne se voient pas
           assez, et c'est la meme chose sur tous types de commerces. »

           ILS ETAIENT EN ABSOLU A right:-12px, DONC DEHORS PAR CONSTRUCTION, et
           coupes net par l'overflow:hidden du panneau : on voyait deux
           moities de cadre, sans legende. Ils sont maintenant DANS LE RANG —
           c'est la mise en page qui leur donne leur place, et un element du flux
           ne peut pas sortir du cadre.

           ET ILS ONT GRANDI DE MOITIE. A soixante-seize points, l'image faisait
           soixante-quatre de haut et la legende manuscrite onze : on ne
           distinguait ni la photo ni le mot. */
        .bf-polas{flex:none;display:flex;flex-direction:column;
          pointer-events:none;order:2;
          width:calc(44% - 10px);max-width:150px;}
        .bf-pola{margin:0;width:100%;padding:6px 6px 0;background:#FFFFFF;
          border-radius:6px;box-shadow:0 10px 24px -12px rgba(40,20,70,.5);}
        .bf-pola.un{transform:rotate(3.5deg);z-index:2;}
        /* LE SECOND EST GLISSE SOUS LE PREMIER ET DECALE : deux cadres poses a
           plat l'un sous l'autre font une liste ; l'un sur l'autre font une
           pile qu'on vient de sortir d'une poche.
           SON RANG EST POSITIF, ET C'EST TOUT LE PIEGE. Ecrit z-index:-1, il
           passait derriere le FOND DU PANNEAU — pas derriere son voisin — et
           le second polaroid disparaissait purement et simplement. Deux rangs
           positifs disent la meme chose sans sortir de la pile. */
        .bf-pola.deux{transform:rotate(-5deg);margin-top:-22px;
          margin-left:6px;z-index:1;}
        .bf-pola img{display:block;width:100%;aspect-ratio:1/.72;
          object-fit:cover;border-radius:4px;}
        .bf-pola figcaption{padding:5px 3px 7px;
          font-family:var(--font-main-levee),'Segoe Script',cursive;
          font-size:11.5px;line-height:1.16;color:#6E6280;text-align:center;}

        /* ═══ SUR TELEPHONE, LA QUESTION PASSE SOUS LE FANTOME ══════════════

           « Le visuel du fantome est trop petit par rapport au mock up. C'est
           l'acteur principal de la page, donc il faut qu'il soit visible. »

           LA MESURE DONNE RAISON, ET ELLE DIT AUSSI POURQUOI. Sur sa maquette,
           le fantome occupe VINGT-NEUF POUR CENT de la largeur de l'ecran — et
           c'est un fantome seul. Ses mascottes sont des scenes : le personnage
           n'y tient que les trois cinquiemes du fichier. Pour que le FANTOME
           fasse vingt-neuf pour cent, l'image doit en faire pres de CINQUANTE.

           A CETTE TAILLE, RIEN NE TIENT PLUS A COTE. Trois cent soixante-dix
           points de panneau, moins le fantome et les polaroids, laissent
           soixante-quinze points pour le titre : une lettre par ligne. La
           question descend donc d'un rang et reprend TOUTE la largeur, ou elle
           se pose en deux lignes — exactement la coupure de la maquette.

           LE RANG DU HAUT DEVIENT ALORS CE QUE LA MAQUETTE MONTRE EN GRAND : le
           fantome a gauche, les deux polaroids a droite, et rien entre les deux
           qui les retienne. */
        .fm.vrai{width:56%;}

        /* ═══ ET AU-DESSUS DE CINQ CENT SOIXANTE POINTS, LA MAQUETTE REVIENT ═
           Son dessin est fait pour un cadre large : a cette largeur le fantome,
           la question et les polaroids tiennent sur un seul rang, comme chez
           lui. On ne garde la pile que la ou elle est necessaire. */
        @media (min-width:560px){
          .bf-haut{flex-wrap:nowrap;padding-top:34px;}
          .fm.vrai{width:38%;max-width:250px;}
          .bf-mots{flex:1 1 auto;order:0;}
          .bf-polas{order:0;width:118px;max-width:118px;}
        }

        /* ═══ LA BANDE DE STYLES ═══════════════════════════════════════════ */
        .bf-styles{list-style:none;margin:14px 0 0;padding:0 0 4px;
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

        /* ═══ LE FANTOME ═══════════════════════════════════════════════════
           LE DESSINE GARDE UNE TAILLE FIXE : il remplit sa boite entierement,
           donc cent vingt points de large font cent vingt points de fantome.
           Une mascotte de la meme largeur n'en donne que les trois cinquiemes
           — voir le grand commentaire des polaroids, c'est toute la difference
           entre les deux et c'est pour ca qu'elles n'ont pas la meme regle. */
        .fm{position:relative;flex:none;display:block;width:120px;height:132px;}
        .fm.vrai{height:auto;align-self:center;margin-left:-8px;}
        .fm-img{display:block;width:100%;height:auto;
          filter:drop-shadow(0 10px 22px rgba(90,40,130,.24));
          animation:fmFlotte 4.2s ease-in-out infinite;}
        /* LES BORDS DES DEUX SCENES SONT DEJA ETEINTS DANS LEUR FICHIER —
           voir scripts/fantomes-mascottes.mjs. Rien a faire ici, et c'est le
           but : un mask-image CSS se compose differemment entre Safari et
           Chromium, et la sanction d'une erreur serait une mascotte INVISIBLE
           sur l'iPhone ou le produit se teste. */
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
