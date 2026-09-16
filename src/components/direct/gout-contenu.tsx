"use client";

// 👻 L'ÉCRAN DE L'AVANT-GOÛT — on joue avec le plat, on ne le regarde pas.
//
// ═══ CE QU'IL REMPLACE, ET POURQUOI ════════════════════════════════════════
//
// « Faites savoir que vous êtes ici… Qui est là, ce qu'ils ont à dire… »
// finalement ne remporte pas le succès escompté. On va jouer autour du mot
// ESSAYER, et faire essayer le plat du jour avant même d'y aller. »
//
// LE MUR DE PRÉSENCE DEMANDAIT D'ÊTRE DÉJÀ CONVAINCU. « Qui est là » n'intéresse
// que quelqu'un qui a décidé d'y aller ; devant une annonce à midi, la question
// est plus tôt. Cet écran-là y répond, et il y répond comme l'essayage répond
// chez un coiffeur : en faisant faire quelque chose, pas en montrant mieux.
//
// ═══ CE QUE CET ÉCRAN NE FAIT PAS, ET C'EST DÉLIBÉRÉ ═══════════════════════
//
// IL N'AFFICHE PAS « 2 / 4 ». Ses maquettes le font, son texte dit l'inverse —
// « je préférerais une petite progression visuelle discrète, parce que cela
// donne immédiatement l'impression d'un questionnaire à terminer » — et c'est
// lui qui a raison contre ses propres écrans. Un compteur transforme un jeu en
// formulaire : on ne joue pas pour arriver à 4/4.
//
// IL N'ÉCRIT PAS NON PLUS « ÉTAPE 2 ». Même raison, en pire : le mot « étape »
// est un mot d'administration. La barre segmentée suffit à dire qu'il y a une
// suite, et c'est tout ce qu'on a besoin de savoir.
//
// LA SENSATION VISÉE EST LA SIENNE : « Tiens, touche ça… » → « Ah ! » →
// « Maintenant regarde ça… » → « Oh, ça donne faim » → RÉSERVER.

import { useState } from "react";
import type { Gout, OptionGout } from "@/lib/direct/avant-gout";
import { EMOTIONS } from "@/lib/direct/avant-gout";

export function EcranGout({
  gout,
  lieu,
  ville,
  distance,
  onReserver,
  onFermer,
  fantome,
}: {
  gout: Gout;
  lieu: string;
  ville: string;
  distance: string;
  /** Ce que fait le geste final. Absent, le bouton ne se dessine pas. */
  onReserver?: () => void;
  onFermer?: () => void;
  /**
   * LE FANTÔME, QUAND L'APPELANT EN A UN À PRÊTER.
   *
   * Absent, on en dessine un ici — voir `PetitFantome`. Celui de la page
   * d'accueil ne peut pas servir : il dépend d'un bloc `defs` posé une fois pour
   * toute SA page, et le poser dans une feuille qui monte par-dessus
   * l'application donnerait un fantôme sans encre, c'est-à-dire un trou noir.
   */
  fantome?: React.ReactNode;
}) {
  const [rang, setRang] = useState(0);
  /** Ce qu'on a choisi, par rang de temps. La clé de l'option. */
  const [choix, setChoix] = useState<Record<number, string>>({});
  /** Le temps de la révélation : après avoir validé une devinette. */
  const [revele, setRevele] = useState(false);
  /** Le geste déclenché, sur un temps qui en demande un. */
  const [declenche, setDeclenche] = useState(false);
  const [emotion, setEmotion] = useState("");

  const t = gout.temps[rang];

  /**
   * CE QU'ON A COMPOSÉ, POUR LE RÉCAPITULATIF FINAL.
   *
   * ON NE GARDE QUE LES TEMPS QUI ONT FAIT CHOISIR quelque chose sur le PLAT —
   * `compose` — et pas ceux qui ont fait deviner ou ressentir. « Vous avez
   * répondu : la sauce mijotée » n'est pas un ingrédient de son assiette, c'est
   * une réponse à un jeu, et l'écrire au même endroit que la cuisson ferait
   * croire qu'on a commandé une devinette.
   */
  const composes = gout.temps
    .map((x, i) => ({ x, i }))
    .filter(({ x }) => x.quoi === "compose")
    .map(({ x, i }) => {
      const o = x.options?.find((p) => p.cle === choix[i]);
      return o ? { quoi: x.titre.replace(/^Quel(le)?\s+/i, "").trim(), mot: o.resume ?? o.nom } : null;
    })
    .filter(Boolean) as { quoi: string; mot: string }[];

  /**
   * PEUT-ON AVANCER ?
   *
   * UN TEMPS QUI PROPOSE DES OPTIONS EN ATTEND UNE. Laisser passer sans choisir
   * donnerait un récapitulatif à trous — « Cuisson : — » — c'est-à-dire la
   * preuve que le jeu n'a servi à rien.
   *
   * ET UN TEMPS DE GESTE ATTEND SON GESTE. C'est le seul de tous qui demande un
   * appui pour VOIR quelque chose : le sauter reviendrait à raconter le tour de
   * magie sans le faire.
   */
  const prete = t.options?.length ? !!choix[rang] : t.quoi === "geste" ? declenche : true;

  const avancer = () => {
    // UNE DEVINETTE SE JOUE EN DEUX TEMPS SUR LE MÊME ÉCRAN : on répond, puis on
    // apprend. Passer directement au suivant escamoterait la seule chose qu'on
    // était venu chercher.
    if (t.quoi === "devine" && t.verite && !revele) {
      setRevele(true);
      return;
    }
    setRevele(false);
    setDeclenche(false);
    setRang((r) => Math.min(r + 1, gout.temps.length - 1));
  };

  const reculer = () => {
    setRevele(false);
    setDeclenche(false);
    setRang((r) => Math.max(0, r - 1));
  };

  /**
   * CE QUE DIT LE BOUTON, ET IL DOIT CHANGER QUAND QUELQUE CHOSE A EU LIEU.
   *
   * DEUX TEMPS SE JOUENT EN DEUX APPUIS SUR LE MÊME ÉCRAN — la devinette, qui
   * répond puis révèle, et le geste, qui déclenche puis avance. Le libellé
   * restait le même pour les deux appuis : après avoir lu le secret du chef, le
   * bouton disait encore « Je valide ma réponse », et après avoir fait tomber le
   * parmesan il disait encore « Faire tomber le parmesan ». On croit que l'appui
   * n'a pas pris, donc on rappuie, donc on saute l'écran suivant sans l'avoir vu.
   *
   * UN BOUTON QUI NE BOUGE PAS APRÈS UN APPUI DIT QU'IL NE S'EST RIEN PASSÉ.
   * Une fois la chose vue, il n'y a plus qu'une seule suite possible, et elle
   * s'appelle « Continuer ».
   */
  const consomme = (t.quoi === "devine" && !!t.verite && revele) || (t.quoi === "geste" && declenche);
  const geste = consomme
    ? (t.apres ?? "Continuer")
    : t.quoi === "devine" && t.verite
      ? (t.geste ?? "Je valide")
      : t.geste;

  return (
    <div className="go-ecran" style={{ "--go-accent": gout.accent } as React.CSSProperties}>
      {/* ═══ LA PROGRESSION, SANS SON CHIFFRE ═══════════════════════════════

          Un segment par temps, celui qu'on joue allumé et ceux qu'on a passés
          avec lui. Voir l'en-tête : le « 2 / 4 » de la maquette est parti. */}
      <div className="go-fil" aria-hidden="true">
        {gout.temps.map((x, i) => (
          <i key={`${x.titre}-${i}`} className={i <= rang ? "on" : ""} />
        ))}
      </div>

      <div className="go-haut">
        {fantome ?? <PetitFantome />}
        <div className="go-mots">
          <h2 className="go-t">
            {t.titre}
            {t.suite && <b>{t.suite}</b>}
          </h2>
          {t.phrase && <p className="go-p">{t.phrase}</p>}
        </div>
      </div>

      {/* ═══ LA PHOTO, PLEIN CADRE ═══════════════════════════════════════════
          Elle porte le tampon du plat et, sur un temps de geste, ce qui tombe
          dessus quand on appuie. */}
      <div className={`go-photo${declenche ? " tombe" : ""}${t.note ? " notee" : ""}`}>
        {t.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.photo} alt="" />
        ) : (
          <span className="go-photo-v" aria-hidden="true" />
        )}
        {gout.tampon && rang === 0 && <span className="go-tampon">{gout.tampon}</span>}
        {/* ═══ L'ANNOTATION MANUSCRITE, ET ELLE EST SUR LA PHOTO ═════════════

            Elle n'informe pas, elle donne le ton : c'est une main qui parle,
            pas une interface.

            ELLE ÉTAIT POSÉE SOUS LE TITRE, EN ABSOLU, ET ELLE SORTAIT DE
            L'ÉCRAN. `top:100%` la mettait PAR-DESSUS la photo, qui la recouvre
            — on lisait « Choisissez votre cuisson en un » et le reste passait
            sous l'image, coupé net au bord droit. Le défaut ne se voyait que
            sur les temps qui portent une note, donc pas sur l'ouverture, donc
            pas au premier coup d'œil.

            SUR LA PHOTO, ELLE EST CHEZ ELLE : une note à la main s'écrit dans
            la marge d'une image, le dégradé du bas la rend lisible sur
            n'importe quel plat, et elle ne peut plus rien pousser puisqu'elle
            ne prend aucune place dans le flux. */}
        {t.note && <span className="go-main">{t.note}</span>}
        {t.quoi === "geste" && (
          <span className="go-pluie" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
              <i key={k} style={{ "--k": k } as React.CSSProperties} />
            ))}
          </span>
        )}
      </div>

      {/* ═══ L'OUVERTURE : LE MOT DU CHEF, OU CE QUE LE PLAT EST ═══════════ */}
      {t.quoi === "ouvrir" && gout.chef && (
        <blockquote className="go-chef">
          <i aria-hidden="true">“</i>
          <p>{gout.chef.mot}</p>
          <cite>{gout.chef.qui}</cite>
        </blockquote>
      )}
      {t.quoi === "ouvrir" && !!gout.marques?.length && (
        <ul className="go-marques">
          {gout.marques.map((m) => (
            <li key={m.nom}>
              <i aria-hidden="true">{m.emoji}</i>
              <b>{m.nom}</b>
              <em>{m.detail}</em>
            </li>
          ))}
        </ul>
      )}

      {/* ═══ CE QU'ON CHOISIT ════════════════════════════════════════════════

          DEUX COLONNES À PARTIR DE QUATRE OPTIONS, TROIS EN DESSOUS. Quatre
          vignettes sur une ligne de trois cent quatre-vingt-dix points font
          quatre-vingts points chacune : on n'y voit plus ce qu'on choisit, ce
          qui est le seul travail d'une vignette. */}
      {!!t.options?.length && !revele && (
        <ul
          className={`go-choix${t.options.length > 3 ? " deux" : ""}${
            enMots(t.options) ? " mots" : ""
          }`}
        >
          {t.options.map((o) => (
            <li key={o.cle}>
              <button
                type="button"
                className={choix[rang] === o.cle ? "on" : undefined}
                aria-pressed={choix[rang] === o.cle}
                onClick={() => setChoix((c) => ({ ...c, [rang]: o.cle }))}
              >
                <Vignette o={o} />
                <b>{o.nom}</b>
                {o.detail && <em>{o.detail}</em>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ═══ LA VÉRITÉ, APRÈS LA DEVINETTE ══════════════════════════════════

          IL N'Y A NI BONNE NI MAUVAISE RÉPONSE, et l'écran ne dit jamais
          « perdu ». Les quatre réponses sont vraies ; celle du chef est celle
          qu'on vient apprendre. Un jeu qui corrige devant un plat donne envie
          d'aller manger ailleurs. */}
      {t.quoi === "devine" && t.verite && revele && (
        <div className="go-verite">
          <b>{t.verite.titre}</b>
          <p>{t.verite.mot}</p>
        </div>
      )}

      {/* ═══ LE DERNIER TEMPS ════════════════════════════════════════════════ */}
      {t.quoi === "final" && (
        <>
          {composes.length > 0 && (
            <ul className="go-recap">
              {composes.map((c) => (
                <li key={c.quoi}>
                  <b>{c.quoi}</b>
                  <em>{c.mot}</em>
                </li>
              ))}
            </ul>
          )}
          <div className="go-emo">
            <p>
              <b>Alors, ça vous fait quoi&nbsp;?</b>
              Dites-nous en un mot.
            </p>
            <div className="go-emo-l">
              {EMOTIONS.map((e) => (
                <button
                  key={e.cle}
                  type="button"
                  className={emotion === e.cle ? "on" : undefined}
                  aria-pressed={emotion === e.cle}
                  onClick={() => setEmotion(e.cle)}
                >
                  <i aria-hidden="true">{e.emoji}</i>
                  <span>{e.mot}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══ LE GESTE QUI AVANCE ════════════════════════════════════════════ */}
      {t.quoi === "final" ? (
        onReserver && (
          <button type="button" className="go-cta" onClick={onReserver}>
            <span>
              Réserver{gout.prix ? ` · ${gout.prix.replace(/\s+(€)/g, " $1")}` : ""}
            </span>
            <s aria-hidden="true">→</s>
          </button>
        )
      ) : t.quoi === "geste" && !declenche ? (
        <button type="button" className="go-cta" onClick={() => setDeclenche(true)}>
          <span>{geste ?? "Voir"}</span>
          <s aria-hidden="true">→</s>
        </button>
      ) : (
        <button type="button" className="go-cta" disabled={!prete} onClick={avancer}>
          <span>{geste ?? "Suivant"}</span>
          <s aria-hidden="true">→</s>
        </button>
      )}

      {/* ═══ ET ON PEUT TOUJOURS REVENIR, OU SORTIR ════════════════════════

          « Passer cette découverte » est sur sa maquette d'ouverture, et il a
          raison de l'y mettre : quelqu'un qui veut juste l'adresse et l'heure ne
          doit pas avoir à jouer pour les obtenir. Un jeu obligatoire n'est plus
          un jeu. */}
      <div className="go-pied">
        {rang > 0 ? (
          /* ET LE MOT « ÉTAPE » N'APPARAÎT PAS ICI NON PLUS. Il l'avait écrit
             deux fois — « Étape précédente », « Revoir les étapes » — et c'est
             exactement le mot d'administration que l'en-tête de ce fichier
             refuse. « Revenir » dit la même chose sans nommer un formulaire. */
          <button type="button" className="go-retour" onClick={reculer}>
            <s aria-hidden="true">←</s>
            Revenir
          </button>
        ) : (
          onFermer && (
            <button type="button" className="go-retour" onClick={onFermer}>
              Passer cette découverte
            </button>
          )
        )}
        <span className="go-ou">
          {lieu} · {ville} · {distance}
        </span>
      </div>

      <Styles />
    </div>
  );
}

/**
 * LA VIGNETTE D'UNE OPTION, ET SON REPLI.
 *
 * AUCUNE DES QUINZE IMAGES DE SES MAQUETTES N'EXISTE ENCORE — trois cuissons,
 * quatre accompagnements, trois sauces, et autant pour l'autre plat. Une option
 * sans photo se dessine donc avec son pictogramme sur un fond teinté : le
 * parcours se joue en entier le premier jour, et il embellit le jour où le
 * restaurateur filme. C'est la même règle que la bande de photos de l'annonce —
 * on montre ce qu'il y a, on ne réserve pas un emplacement vide.
 */
/**
 * TROIS FOIS LE MÊME DESSIN N'EST PAS UN CHOIX — C'EST UNE LISTE DE MOTS.
 *
 * « Bleu / Saignant / À point » se dessinait en trois grandes vignettes portant
 * TOUTES LE MÊME 🥩 : trois images identiques côte à côte, à la place exacte où
 * l'écran demande de faire une différence. C'est pire que pas d'image, parce que
 * l'œil va d'abord à l'image, et que celle-là dit « ces trois choses sont
 * pareilles » au moment où on demande de les distinguer.
 *
 * QUAND LES OPTIONS NE SE DISTINGUENT PAS À L'IMAGE, ON LES DISTINGUE AU MOT.
 * La grille passe en rangées basses, le pictogramme devient petit et se range à
 * gauche du nom. L'écran y gagne deux cents points de hauteur, et le
 * commerçant qui filmera un jour ses trois cuissons les fera remonter en
 * vignettes sans qu'on touche à quoi que ce soit : il suffira qu'elles diffèrent.
 */
function enMots(options: OptionGout[]): boolean {
  if (options.some((o) => o.photo)) return false;
  const premier = options[0]?.emoji;
  return options.every((o) => o.emoji === premier);
}

/**
 * LE FANTÔME QUI PARLE, EN AUTARCIE COMPLÈTE.
 *
 * C'est LUI qui pose les questions — « qu'est-ce qui rend les vôtres
 * particulières ? » est sa phrase, et l'écran entier est sa manière de la
 * reposer au client. Sans lui, le parcours devient un formulaire à voix neutre.
 *
 * IL NE DÉPEND DE RIEN : ni `defs`, ni dégradé nommé, ni feuille de style
 * extérieure — uniquement de `currentColor` et de deux couleurs en dur. C'est la
 * condition pour qu'il tienne dans une feuille montée par-dessus l'application,
 * là où les identifiants SVG de la page d'accueil n'existent pas.
 */
function PetitFantome() {
  return (
    <svg className="go-f" viewBox="0 0 40 44" aria-hidden="true" focusable="false">
      <path
        d="M20 3C11.2 3 4 10.2 4 19v18.6c0 1.2 1.4 1.9 2.4 1.2l2.9-2c.7-.5 1.6-.4 2.2.2l2 2c.8.8 2 .8 2.8 0l1.9-1.9c.7-.7 1.9-.7 2.6 0l1.9 1.9c.8.8 2 .8 2.8 0l2-2c.6-.6 1.5-.7 2.2-.2l2.9 2c1 .7 2.4 0 2.4-1.2V19c0-8.8-7.2-16-16-16z"
        fill="#fff"
      />
      <ellipse cx="10.4" cy="24.6" rx="2.8" ry="1.7" fill="var(--go-accent,#E56BE0)" opacity=".34" />
      <ellipse cx="29.6" cy="24.6" rx="2.8" ry="1.7" fill="var(--go-accent,#E56BE0)" opacity=".34" />
      <ellipse cx="14.2" cy="19" rx="2.5" ry="3.3" fill="#1A1030" />
      <ellipse cx="25.8" cy="19" rx="2.5" ry="3.3" fill="#1A1030" />
      <circle cx="15.1" cy="17.7" r=".9" fill="#fff" />
      <circle cx="26.7" cy="17.7" r=".9" fill="#fff" />
      <path d="M16.4 26.2c1.5 2 5.7 2 7.2 0" stroke="#1A1030" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function Vignette({ o }: { o: OptionGout }) {
  if (o.photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="go-vig" src={o.photo} alt="" />;
  }
  return (
    <span className="go-vig sans" aria-hidden="true">
      {o.emoji ?? "🍽️"}
    </span>
  );
}

/**
 * dangerouslySetInnerHTML ET PAS UN ENFANT DE STYLE, ET C'EST UNE GARDE.
 *
 * scripts/verifier-styles-en-ligne.mjs ne cherche QUE la forme __html suivie
 * d'un littéral de gabarit
 * — c'est elle qu'il sait relire caractère par caractère pour trouver l'accent
 * grave égaré dans un commentaire CSS, celui qui referme le littéral au milieu
 * de la feuille et emporte tout ce qui suit. Un écran écrit dans l'autre forme
 * n'est pas couvert : il ne se signale pas, il attend. Voir ce script.
 */
function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .go-ecran{display:flex;flex-direction:column;gap:12px;padding-bottom:4px;}

        /* ═══ LA PROGRESSION, SANS CHIFFRE ══════════════════════════════════
           Un segment par temps. Voir l'en-tete du fichier : le « 2 / 4 » de la
           maquette est parti, et le mot « etape » avec lui. */
        .go-fil{display:flex;gap:6px;}
        .go-fil i{flex:1;height:4px;border-radius:99px;
          background:rgba(255,255,255,.16);transition:background .3s ease;}
        .go-fil i.on{background:linear-gradient(90deg,#8B5CF6,var(--go-accent,#E56BE0));}

        .go-haut{position:relative;display:flex;align-items:flex-start;gap:11px;}
        .go-haut>svg,.go-haut>span:first-child{flex:none;}
        /* IL FLOTTE, PARCE QU'UN FANTOME POSE NE FLOTTE PAS. Deux secondes,
           quatre pixels : assez pour qu'on le voie vivre, trop peu pour qu'on
           regarde autre chose que le plat. */
        .go-f{width:40px;height:44px;animation:go-flotte 2.6s ease-in-out infinite;}
        @keyframes go-flotte{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}
        @media (prefers-reduced-motion:reduce){.go-f{animation:none;}}
        .go-mots{flex:1;min-width:0;}
        .go-t{margin:0;font-size:clamp(24px,7vw,30px);font-weight:850;
          letter-spacing:-.03em;line-height:1.08;color:#fff;}
        /* LE SECOND MORCEAU DU TITRE PORTE LA COULEUR DU PLAT. C'est ce qui fait
           qu'un parcours ressemble a SON plat plutot qu'a l'application : le
           magret est magenta, les lasagnes sont vertes. */
        .go-t b{font-weight:850;color:var(--go-accent,#E56BE0);}
        /* LE POINT D'INTERROGATION NE RESTE PAS SEUL SUR SA LIGNE. « Qu'est-ce
           qui vous attire le plus dans ce plat / ? » : la ligne tombait au
           caractere pres, et la phrase se terminait sur un signe isole. */
        .go-p{margin:7px 0 0;font-size:13.5px;line-height:1.4;color:#B9C6D6;
          text-wrap:pretty;}
        /* ─── L'ANNOTATION MANUSCRITE ───
           Elle est en absolu et sur deux cent points au plus : posee dans le
           flux, elle poussait le titre et la photo vers le bas a chaque ecran
           qui en porte une, donc la mise en page sautait d'un temps a l'autre. */
        /* ELLE TIENT DANS LA PHOTO, AVEC SES DEUX BORDS DECLARES. Le bord droit
           seul laissait la ligne s'etendre vers la gauche sans limite utile et
           deborder du cadre ; les DEUX bords lui donnent une largeur, donc un
           retour a la ligne. Le voile du bas la rend lisible sur un plat clair
           comme sur un plat sombre. */
        /* ELLE NE PREND PAS TOUTE LA LARGEUR, POUR NE PAS LAISSER SON DERNIER
           MOT SEUL. Sur toute la largeur, « Des saveurs simples qui font toute
           la difference ! » remplissait la ligne au caractere pres et renvoyait
           le point d'exclamation a la ligne suivante, tout seul dans le coin.
           Quatre cinquiemes de la photo, et deux lignes equilibrees. */
        .go-main{position:absolute;left:18%;right:14px;bottom:12px;z-index:2;
          text-wrap:balance;
          font-family:'Snell Roundhand','Segoe Script','Bradley Hand',cursive;
          font-size:17px;line-height:1.25;text-align:right;color:#fff;
          text-shadow:0 2px 12px rgba(0,0,0,.95);transform:rotate(-2.5deg);
          pointer-events:none;}
        /* LE VOILE NE SE POSE QUE SUR LES PHOTOS QUI PORTENT UNE NOTE. Partout
           ailleurs il assombrirait le plat pour rien, et c'est le plat qu'on
           est venu regarder. */
        .go-photo.notee::after{content:"";position:absolute;inset:auto 0 0;
          height:46%;background:linear-gradient(to top,rgba(4,8,14,.84),transparent);
          pointer-events:none;}

        .go-photo{position:relative;width:100%;aspect-ratio:4/3;overflow:hidden;
          border-radius:20px;background:#0B1310;}
        .go-photo img{width:100%;height:100%;object-fit:cover;display:block;}
        .go-photo-v{display:block;width:100%;height:100%;
          background:linear-gradient(150deg,#1B2436,#0E141F);}
        /* LE TAMPON DU COIN, SUR L'OUVERTURE SEULEMENT. « FAIT MAISON » est une
           promesse du commercant : elle se pose une fois, a l'arrivee. */
        .go-tampon{position:absolute;right:12px;bottom:12px;width:76px;height:76px;
          display:flex;align-items:center;justify-content:center;text-align:center;
          border-radius:50%;border:1.5px solid rgba(255,255,255,.8);
          font-size:11.5px;font-weight:850;line-height:1.15;color:#fff;
          text-transform:uppercase;letter-spacing:.04em;
          background:rgba(6,12,10,.34);
          -webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);}

        /* ═══ LE GESTE QU'ON DECLENCHE ══════════════════════════════════════
           C'est le seul temps qui demande un appui pour VOIR quelque chose. Huit
           copeaux tombent en quinconce : sans le decalage, ils forment une ligne
           qui descend, et une ligne ne ressemble a rien qu'on connaisse. */
        .go-pluie{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
        .go-pluie i{position:absolute;top:-14%;width:13px;height:9px;
          border-radius:3px;background:#F5E6B8;opacity:0;
          left:calc(8% + var(--k) * 11%);
          box-shadow:0 2px 6px rgba(0,0,0,.4);}
        .go-photo.tombe .go-pluie i{
          animation:goTombe 1.5s cubic-bezier(.35,.05,.6,1) both;
          animation-delay:calc(var(--k) * .12s);}
        @keyframes goTombe{
          0%{opacity:0;transform:translateY(0) rotate(0deg);}
          12%{opacity:1;}
          100%{opacity:.92;transform:translateY(340px) rotate(220deg);}
        }

        /* ═══ LE MOT DU CHEF ════════════════════════════════════════════════
           Signe, parce qu'une phrase signee n'est pas la meme phrase. C'est la
           seule voix humaine de l'ecran. */
        .go-chef{position:relative;margin:0;padding:13px 15px 13px 34px;
          border-radius:18px;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.1);}
        .go-chef>i{position:absolute;left:13px;top:6px;font-style:normal;
          font-size:30px;line-height:1;color:var(--go-accent,#E56BE0);opacity:.8;}
        .go-chef p{margin:0;font-size:13.5px;line-height:1.45;color:#E8EFF6;}
        .go-chef cite{display:block;margin-top:7px;font-style:normal;
          font-family:'Snell Roundhand','Segoe Script','Bradley Hand',cursive;
          font-size:17px;text-align:right;color:#fff;}

        /* CE QUE LE PLAT EST, EN TROIS PASTILLES. Elles ne se lisent pas une par
           une : elles se lisent d'un coup, et elles disent « ici on choisit ce
           qu'on met dedans ». */
        .go-marques{list-style:none;margin:0;padding:0;display:flex;gap:8px;}
        .go-marques li{flex:1;min-width:0;text-align:center;padding:9px 6px;
          border-radius:14px;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.09);}
        .go-marques i{display:block;font-style:normal;font-size:19px;}
        .go-marques b{display:block;margin-top:3px;font-size:11.5px;font-weight:800;
          line-height:1.2;color:#EAF2EC;}
        .go-marques em{display:block;font-style:normal;font-size:10.5px;
          color:#8C9C94;}

        /* ═══ CE QU'ON CHOISIT ══════════════════════════════════════════════ */
        .go-choix{list-style:none;margin:0;padding:0;
          display:grid;grid-template-columns:repeat(3,1fr);gap:8px;
          align-items:stretch;}
        .go-choix.deux{grid-template-columns:repeat(2,1fr);}
        .go-choix li{display:flex;}
        .go-choix button{flex:1;min-width:0;display:flex;flex-direction:column;
          align-items:center;gap:5px;padding:9px 8px 11px;font-family:inherit;
          text-align:center;cursor:pointer;border-radius:16px;
          background:rgba(255,255,255,.045);
          border:1.5px solid rgba(255,255,255,.1);
          transition:border-color .18s ease,background .18s ease,transform .18s ease;}
        .go-choix button:active{transform:scale(.97);}
        /* CELLE QU'ON A CHOISIE PORTE LA COULEUR DU PLAT ET SON HALO : sans
           marque nette, on ne sait plus ce qu'on vient de toucher, et on
           retouche. */
        .go-choix button.on{border-color:var(--go-accent,#E56BE0);
          background:rgba(255,255,255,.08);
          box-shadow:0 0 0 1px var(--go-accent,#E56BE0),
            0 10px 30px -14px var(--go-accent,#E56BE0);}
        .go-choix b{font-size:12.5px;font-weight:800;line-height:1.2;color:#fff;}
        .go-choix em{font-style:normal;font-size:10.5px;line-height:1.25;
          color:#8C9C94;}
        .go-vig{width:100%;aspect-ratio:1;object-fit:cover;border-radius:11px;
          display:flex;align-items:center;justify-content:center;font-size:26px;
          background:#101825;}
        /* ═══ LA PASTILLE DE REPLI NE SE PREND PAS POUR UNE PHOTO ═══════════

           Un rapport d'un pour un est juste pour une VRAIE photo : elle
           remplit son
           carre. Applique au repli, il fabriquait un carre de cent cinquante
           points contenant un pictogramme de vingt-six — quatre options
           faisaient sortir le bouton de l'ecran, et ce qu'on voyait etait
           surtout du vide. Une bande basse suffit : c'est un ornement, pas le
           choix. Le jour ou le restaurateur filme, la vignette sans son
           repli reprend son carre, et rien d'autre ne bouge. */
        .go-vig.sans{aspect-ratio:auto;height:58px;
          background:linear-gradient(150deg,rgba(255,255,255,.09),
          rgba(255,255,255,.03));}

        /* ─── ET QUAND LES IMAGES NE DISTINGUENT RIEN, ON PASSE AUX MOTS ───
           Voir enMots. Une colonne, des rangees basses, le pictogramme range
           a gauche : il accompagne le mot au lieu de pretendre etre le choix. */
        .go-choix.mots{grid-template-columns:1fr;gap:7px;}
        /* UNE RANGEE, UNE LIGNE. Le detail passait a la ligne suivante et
           chaque choix prenait cent trente points de haut : trois cuissons
           remplissaient l'ecran a elles seules, et le geste qui avance sortait
           du champ. Pictogramme, nom, detail sur la meme ligne. */
        .go-choix.mots button{flex-direction:row;align-items:center;
          gap:11px;text-align:left;padding:9px 13px;}
        .go-choix.mots .go-vig{width:34px;height:34px;flex:none;aspect-ratio:1;
          font-size:19px;border-radius:10px;}
        .go-choix.mots b{font-size:14.5px;flex:none;}
        .go-choix.mots em{flex:1;min-width:0;text-align:right;font-size:11.5px;}

        /* ═══ LA VERITE, APRES LA DEVINETTE ═════════════════════════════════
           Elle prend la place des reponses : les laisser sous elle inviterait a
           rejouer un tour qui vient de se terminer. */
        .go-verite{padding:14px 16px;border-radius:18px;
          background:rgba(255,255,255,.06);
          border:1px solid var(--go-accent,#E56BE0);}
        .go-verite b{display:block;font-size:12px;font-weight:850;
          letter-spacing:.06em;text-transform:uppercase;
          color:var(--go-accent,#E56BE0);}
        .go-verite p{margin:6px 0 0;font-size:14px;line-height:1.5;color:#EAF2EC;}

        /* ═══ CE QU'ON A COMPOSE ════════════════════════════════════════════ */
        .go-recap{list-style:none;margin:0;padding:0;display:flex;
          flex-wrap:wrap;gap:7px;}
        .go-recap li{flex:1 1 46%;min-width:0;padding:9px 12px;border-radius:14px;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.1);}
        .go-recap b{display:block;font-size:10.5px;font-weight:800;
          letter-spacing:.05em;text-transform:uppercase;color:#8C9C94;}
        .go-recap em{display:block;margin-top:2px;font-style:normal;
          font-size:13.5px;font-weight:800;color:#fff;}

        /* ═══ L'EMOTION ═════════════════════════════════════════════════════
           Elle defile de cote plutot que de se replier : cinq pastilles sur deux
           lignes se lisent comme une grille de reglages, sur une ligne comme un
           curseur de ressenti. */
        .go-emo{padding:13px 13px 11px;border-radius:18px;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.1);}
        .go-emo>p{margin:0;font-size:11.5px;line-height:1.35;color:#8C9C94;}
        .go-emo>p b{display:block;font-size:14.5px;font-weight:850;color:#fff;
          margin-bottom:1px;}
        /* LES CINQ TIENNENT DANS LA LARGEUR, ET LA CINQUIEME EST CELLE QUI
           COMPTE. En bande qui defile, « Je le veux ! » tombait hors du champ :
           la seule reponse enthousiaste de la liste etait la seule qu'on ne
           voyait pas, et rien ne disait qu'il fallait pousser la bande. Cinq
           colonnes egales, un mot plus petit, tout est visible d'un coup. */
        .go-emo-l{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;
          margin-top:10px;}
        .go-emo-l button{min-width:0;display:flex;flex-direction:column;
          align-items:center;gap:4px;padding:9px 2px;font-family:inherit;
          cursor:pointer;border-radius:14px;background:rgba(255,255,255,.05);
          border:1.5px solid rgba(255,255,255,.1);
          transition:border-color .18s ease,transform .18s ease;}
        .go-emo-l button:active{transform:scale(.95);}
        .go-emo-l button.on{border-color:var(--go-accent,#E56BE0);
          box-shadow:0 0 0 1px var(--go-accent,#E56BE0);}
        .go-emo-l i{font-style:normal;font-size:23px;line-height:1;}
        .go-emo-l span{font-size:9.5px;font-weight:750;line-height:1.15;
          text-align:center;color:#EAF2EC;hyphens:auto;}

        /* ═══ LE GESTE QUI AVANCE ═══════════════════════════════════════════
           Le meme degrade que partout ailleurs dans le produit : c'est ce qui
           dit « ceci avance » sans qu'on ait a le lire. */
        .go-cta{display:flex;align-items:center;justify-content:center;gap:10px;
          width:100%;padding:16px 18px;font-family:inherit;font-size:16px;
          font-weight:850;color:#fff;cursor:pointer;border:none;border-radius:999px;
          /* IL GARDE LE DEGRADE DE L'APPLICATION, ET C'EST VOULU. L'accent du
             plat a ete essaye ici : il est fait pour porter du texte SUR FOND
             SOMBRE — un titre, une pastille, un liisere — donc il est clair, et
             du blanc gras pose dessus devient illisible (le vert des lasagnes
             tombe sous deux pour un). L'accent teinte tout ce qui se lit sur le
             noir ; le geste principal reste celui de Clikme, partout pareil. */
          background:linear-gradient(103deg,#6D5BF6,#C94FD9 52%,#F0459B);
          box-shadow:0 16px 38px -16px rgba(201,79,217,.9);}
        .go-cta:active{transform:scale(.985);}
        /* DESACTIVE, IL RESTE LISIBLE ET DIT POURQUOI PAR SON ETAT : un bouton
           qui disparait fait croire que l'ecran est casse. */
        .go-cta:disabled{cursor:default;opacity:.42;box-shadow:none;}
        .go-cta s{text-decoration:none;font-size:17px;}

        .go-pied{display:flex;align-items:center;justify-content:space-between;
          gap:10px;padding-top:2px;}
        /* LE GESTE DE RETOUR NE PASSE PAS A LA LIGNE, ET L'ADRESSE NON PLUS.
           « Revenir en arriere » se cassait en deux et poussait le lieu a se
           tronquer — « Le Bocal de Margot · Dax · 180… » — c'est-a-dire que la
           distance, seule information decidante du pied, etait la premiere a
           partir. */
        .go-retour{display:inline-flex;align-items:center;gap:7px;flex:none;
          white-space:nowrap;
          font-family:inherit;font-size:12.5px;font-weight:750;color:#8C9C94;
          cursor:pointer;background:none;border:none;padding:6px 0;}
        .go-retour s{text-decoration:none;}
        .go-ou{font-size:11px;font-weight:700;color:#5E6E80;text-align:right;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

        @media (prefers-reduced-motion:reduce){
          .go-photo.tombe .go-pluie i{animation:none;opacity:.9;
            transform:translateY(300px) rotate(180deg);}
          .go-cta:active,.go-choix button:active,.go-emo-l button:active{
            transform:none;}
        }
    `,
      }}
    />
  );
}
