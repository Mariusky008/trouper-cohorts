"use client";

/**
 * 🎯 L'ÉCRAN DE DÉPART DE LA DÉMO — on choisit une catégorie, puis un commerçant.
 *
 * ═══ CE QU'IL A DEMANDÉ, ET CE QUI EST FAIT ICI ════════════════════════════
 *
 * « Quand on appuie sur un des 5 pictogrammes on arrive sur les commerçants —
 * disons qu'on en a 4 ou 5 qu'on peut faire défiler à droite ou à gauche ou
 * swiper — et quand l'un de ces commerçants nous plaît alors le parcours en
 * plusieurs étapes commencera, mais ça sera la partie 2. Pour le moment
 * concentrons-nous sur cette première étape où on choisit un commerçant de la
 * catégorie que nous voulons. »
 *
 * CE FICHIER FAIT LA PREMIÈRE ÉTAPE, ET S'ARRÊTE LÀ. Cinq catégories, quatre à
 * cinq commerçants chacune, qu'on fait défiler au doigt ou aux flèches. Le
 * grand bouton du bas est posé et il n'emmène nulle part : c'est sa réponse,
 * mot pour mot, à la question « que fait le bouton en attendant la partie 2 ».
 *
 * CE QUI SE PASSE QUAND ON L'APPUIE QUAND MÊME : rien, et on le DIT. Un bouton
 * muet qu'on presse trois fois sans effet se lit comme une panne ; une ligne
 * sous le bouton dit que la suite arrive. Voir `.cx-bientot`.
 *
 * ═══ RIEN N'EST INVENTÉ SUR CET ÉCRAN ══════════════════════════════════════
 *
 * L'ENSEIGNE, LA DISTANCE, LA VILLE ET LE PRIX VIENNENT DES COMMERCES DE LA
 * DÉMO, par leur identifiant. Voir `choisir-commerce.ts` : ce fichier-là ne
 * déclare que QUI est dans quelle catégorie et QUELLE photo on montre.
 *
 * LE PRIX N'EST ÉCRIT QUE S'IL EST CELUI DE LA CHOSE MONTRÉE. On cherche, dans
 * la journée du commerçant, le moment dont la PHOTO est celle de la carte, et
 * on prend son prix. Pas de moment correspondant, pas de prix — plutôt une
 * carte sans chiffre qu'un chiffre qui n'est pas celui du plat qu'on regarde.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MotMarque } from "@/components/direct/mot-marque";
import { FantomeAccueil } from "@/components/direct/fantome-accueil";
import {
  CATEGORIES,
  CATEGORIE_DEPART,
  categorieDe,
  type CleCategorie,
} from "@/lib/direct/choisir-commerce";
import { evenementsDeLaVille, momentEnCours, toutesLesCartes } from "@/lib/direct/apercu-habitant";

/** Ce qu'une carte affiche, une fois le commerce retrouvé. */
type Vue = {
  id: string;
  photo: string;
  nom: string;
  /** La seconde ligne : le genre d'une soirée, le titre d'un moment. */
  quoi: string;
  /** Le prix du moment montré, quand il existe. Jamais celui d'un autre. */
  prix: string;
  /** L'heure, pour une sortie. */
  heure: string;
  /** La pastille ronde du commerce. */
  vignette: string;
  distance: string;
  ville: string;
};

/* ═══ LES CINQ PICTOGRAMMES ═════════════════════════════════════════════════
   Dessinés au trait, comme sur ses maquettes : un cintre, un couvert, un
   lotus, un calendrier, un cabas. Ils sont ici et pas en fichiers parce qu'un
   trait qui prend la couleur du texte suit l'état actif sans qu'on ait à
   servir deux images par pictogramme. */
/* `ReactNode` ET PAS `JSX.Element` : React 19 ne declare plus l'espace de
   noms global JSX, et le nom seul ne se resout plus. */
const PICTOS: Record<CleCategorie, ReactNode> = {
  mode: (
    <>
      <path d="M12 3.6a2 2 0 1 0 1.9 2.6" />
      <path d="M12 6.2v2.1L3.6 15c-.9.7-.4 2.1.7 2.1h15.4c1.1 0 1.6-1.4.7-2.1L12 8.3" />
    </>
  ),
  restaurants: (
    <>
      <path d="M7 3v7.5M4.4 3v4.2a2.6 2.6 0 0 0 5.2 0V3M7 10.5V21" />
      <path d="M16.6 21v-7.4c-1.6 0-2.6-1.3-2.6-3.4C14 6.6 15.4 3.6 17.4 3v18" />
    </>
  ),
  beaute: (
    <>
      <path d="M12 20.4c3.6 0 6.6-2.6 6.6-5.4 0-1.4-1-2.4-2.4-2.4-1.9 0-3.4 1.6-4.2 3.4-.8-1.8-2.3-3.4-4.2-3.4-1.4 0-2.4 1-2.4 2.4 0 2.8 3 5.4 6.6 5.4Z" />
      <path d="M12 15.8c1.5-2 2.4-4 2.4-5.9C14.4 7 13.3 4.9 12 3.6c-1.3 1.3-2.4 3.4-2.4 6.3 0 1.9.9 3.9 2.4 5.9Z" />
    </>
  ),
  sorties: (
    <>
      <rect x="3.6" y="5.4" width="16.8" height="15" rx="2.6" />
      <path d="M3.6 10.2h16.8M8.4 3.6v3.4M15.6 3.6v3.4" />
      <path d="M7.6 14h2M11 14h2M14.4 14h2M7.6 17.2h2M11 17.2h2" />
    </>
  ),
  commerces: (
    <>
      <path d="M5.2 8.6h13.6l1 11.2a1.6 1.6 0 0 1-1.6 1.8H5.8a1.6 1.6 0 0 1-1.6-1.8Z" />
      <path d="M8.8 10.6V7.4a3.2 3.2 0 0 1 6.4 0v3.2" />
    </>
  ),
};

export function EcranChoix({
  /** Le geste qui fait sortir de l'écran. Voir `.ap-accueil` : glisser entre. */
  onEntrer,
  /**
   * LE PARCOURS DE LA MODE, QUAND IL EXISTE.
   *
   * IL N'Y EN A QU'UN POUR L'INSTANT, et c'est ce qu'il a demandé : « parcours
   * mode d'abord et on fera la suite après ». Les quatre autres catégories
   * gardent le bouton inerte et sa ligne « la partie 2 arrive ». Le jour où
   * elles auront le leur, c'est cette propriété qui se dédoublera — une par
   * catégorie — et pas le bouton.
   */
  onParcoursMode,
  /** Le parcours de la coiffure, dessine apres celui de la mode. */
  onParcoursCoiffure,
  /** Le parcours de la sortie, le troisieme. */
  onParcoursSortie,
  /** Le parcours du restaurant, le quatrieme. */
  onParcoursTable,
  /** Le parcours de la deco, et il ferme la serie. */
  onParcoursDeco,
  /**
   * SUR QUELLE CATEGORIE OUVRIR, QUAND ON REVIENT D'AILLEURS.
   *
   * La bande des cinq onglets, au fond du parcours sortie, est un raccourci :
   * elle referme le parcours et rouvre cet ecran SUR LA CATEGORIE TOUCHEE.
   * Sans cette propriete, on retomberait sur la categorie de depart et le
   * raccourci mentirait sur ou il mene.
   */
  depart,
}: {
  onEntrer?: () => void;
  onParcoursMode?: () => void;
  onParcoursCoiffure?: () => void;
  onParcoursSortie?: () => void;
  onParcoursTable?: () => void;
  onParcoursDeco?: () => void;
  depart?: CleCategorie;
}) {
  const [cle, setCle] = useState<CleCategorie>(depart ?? CATEGORIE_DEPART);
  const categorie = categorieDe(cle);
  const [actif, setActif] = useState(0);
  /** Vrai dès qu'on a bougé dans le paquet : la consigne a fait son travail. */
  const [aGlisse, setAGlisse] = useState(false);
  useEffect(() => {
    if (actif !== 0) setAGlisse(true);
  }, [actif]);
  const [dx, setDx] = useState(0);
  const [bientot, setBientot] = useState(false);
  const prise = useRef<number | null>(null);

  /* LES COMMERCES SONT LUS UNE FOIS. `toutesLesCartes` reconstruit son tableau
     à chaque appel ; le relire à chaque rendu referait vingt objets par image
     de la main sur l'écran. */
  const commerces = useMemo(toutesLesCartes, []);
  const evenements = useMemo(evenementsDeLaVille, []);
  /* L'HEURE EST CELLE DU TELEPHONE, lue UNE FOIS. C'est elle qui decide quelle
     offre le commercant propose en ce moment — la meme que celle de l'annonce
     qu'on ouvrira. La relire a chaque rendu ferait changer un prix sous le
     doigt de celui qui balaie. */
  const heure = useMemo(() => {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  }, []);

  /**
   * ON RETROUVE LE COMMERCE, ON NE LE RECOPIE PAS.
   *
   * Une carte qui ne trouve pas son commerce disparaît au lieu de s'afficher
   * vide : un identifiant qui ne correspond à rien est une faute de frappe, et
   * une carte trouée la cacherait au lieu de la montrer.
   */
  const vues: Vue[] = useMemo(() => {
    const out: Vue[] = [];
    for (const c of categorie.cartes) {
      const com = commerces.find((x) => x.id === c.id);
      if (com) {
        /* ═══ L'IMAGE ET LE PRIX VIENNENT TOUJOURS DE LA MÊME OFFRE ═══════

           DEUX CAS, ET AUCUN NE PEUT LES DÉSACCORDER.

           1. LA PHOTO DÉCLARÉE EST CELLE D'UN MOMENT de la journée du
              commerçant — c'est le cas des métiers qui s'essaient, où chaque
              offre a son image. On prend alors le titre et le prix DE CE
              MOMENT : le chiffre est celui de la chose montrée, au point près.

           2. ELLE N'EST CELLE D'AUCUN MOMENT — c'est le cas des restaurants,
              de la boulangerie, de la fleuriste, dont les offres n'ont pas
              d'image à elles. On prend alors l'offre EN COURS, celle que
              l'annonce affiche à cette heure-ci, et la photo du commerce qui va
              avec. On ne garde pas la photo déclarée : elle montrerait un plat
              pendant qu'on écrit le prix d'un autre, et c'est exactement le
              genre de chiffre faux que ce produit refuse.

           LE PRIX N'EST DONC JAMAIS EMPRUNTÉ. Ouvrir la carte montre l'annonce
           qui porte ce titre et ce prix — c'est la même offre, pas une
           ressemblance. */
        const moment = (com.moments ?? []).find((m) => m.photo === c.photo);
        const offre = moment ?? momentEnCours(com, heure);
        out.push({
          id: c.id,
          photo: moment ? c.photo : com.photo || c.photo,
          nom: com.nom,
          quoi: c.quoi ?? offre?.titre ?? com.metier,
          prix: offre?.prix ?? "",
          heure: "",
          vignette: com.sesPhotos?.[0]?.src ?? com.photo ?? "",
          distance: com.distance,
          ville: com.ville,
        });
        continue;
      }
      const ev = evenements.find((x) => x.id === c.id);
      if (ev) {
        out.push({
          id: c.id,
          photo: c.photo,
          nom: ev.quoi,
          quoi: c.quoi ?? ev.lignes?.[0] ?? ev.qui,
          prix: "",
          heure: ev.heure ?? "",
          vignette: "",
          distance: ev.distance,
          ville: "Dax",
        });
      }
    }
    return out;
  }, [categorie, commerces, evenements, heure]);

  /* CHANGER DE CATÉGORIE REVIENT À LA PREMIÈRE CARTE. Rester sur la quatrième
     en passant d'une liste de cinq à une liste de quatre afficherait le vide. */
  useEffect(() => {
    setActif(0);
    setDx(0);
  }, [cle]);

  const bouger = useCallback(
    (pas: number) => {
      setActif((i) => Math.min(vues.length - 1, Math.max(0, i + pas)));
      setDx(0);
    },
    [vues.length],
  );

  /* LES FLÈCHES DU CLAVIER FONT LA MÊME CHOSE QUE LE DOIGT. Cet écran se
     regarde sur un téléphone, mais il se montre aussi sur un portable pendant
     une démonstration — et là, il n'y a pas de doigt. */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") bouger(1);
      if (e.key === "ArrowLeft") bouger(-1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [bouger]);

  return (
    <div className="cx">
      <header className="cx-tete">
        {/* LE FANTÔME MÈNE DANS L'APPLICATION, sur les cinq onglets, toujours
            à la même place — voir le commentaire du bas, là où le bouton
            « Entrer dans l'application » se tenait par intermittence. */}
        {onEntrer && (
          <span className="cx-entrer">
            <FantomeAccueil onClick={onEntrer} classe="cx-entrer-f" ou="l’application" verbe="Entrer dans" />
          </span>
        )}
        {/* LE VRAI LOGO, PAS UN MOT EN GRAS. « Clikme » n'a pas de k :
            il a un curseur a sa place, et c'est tout le nom — on clique,
            et c'est moi. Ecrit au clavier, le mot perdait la seule chose
            qui en fait une marque. Le curseur est un trace, donc il suit
            la taille et la couleur de la ligne. Voir `mot-marque.tsx`. */}
        <p className="cx-logo">
          <MotMarque />
        </p>
        <p className="cx-sur">
          Votre ville à essayer <s aria-hidden="true">♡</s>
        </p>
      </header>

      {/* LE TITRE EN DEUX COULEURS, avec le trait sous la partie magenta. Le
          trait est un élément à lui : un soulignement de texte suit les
          jambages et casse sous les accents, celui-ci est droit. */}
      <h1 className="cx-titre">
        <span>{categorie.titreBlanc}</span>{" "}
        <em>
          {categorie.titreRose}
          <s aria-hidden="true" />
        </em>
      </h1>

      {/* ═══ LA CONSIGNE S'EFFACE UNE FOIS APPRISE ══════════════════════════

          « "Glissez pour découvrir les boutiques près de chez vous" : penses-tu
          que c'est utile ? Ça prend pas mal de place. »

          UTILE UNE FOIS, ENCOMBRANTE ENSUITE. C'est une leçon, et une leçon qui
          reste à l'écran se paie à chaque visite pour quelque chose qu'on a
          compris au premier geste. Mesurée ici, elle prend quatre-vingts points
          de haut — la moitié de ce qui manque à la carte pour respirer.

          LA SUPPRIMER SERAIT ALLER TROP LOIN. Un paquet qu'on ne sait pas
          balayer est un paquet dont on ne voit que la première carte, et c'est
          le défaut le plus cher de cet écran : on choisirait parmi un, en
          croyant avoir tout vu.

          ELLE PART DONC AU PREMIER GLISSEMENT, et le Fantôme reste. Elle a
          appris ce qu'elle avait à apprendre ; la place revient aux cartes. */}
      <div className={`cx-dit${aGlisse ? " parti" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cx-f" src="/clikme-fantome.png" alt="" />
        <p className="cx-bulle">
          {categorie.bulle} <s aria-hidden="true">→</s>
        </p>
      </div>

      {/* ═══ LE PAQUET DE CARTES ════════════════════════════════════════════

          CHAQUE CARTE EST PLACÉE PAR SON ÉCART AU CENTRE, pas par un défilement
          horizontal. C'est ce qui permet aux deux voisines d'être plus petites,
          inclinées et de sortir de l'écran des deux côtés, comme sur ses
          maquettes : un simple défilement les garderait droites et de la même
          taille.

          LE DOIGT AJOUTE SON DÉPLACEMENT AU CENTRE, donc les trois cartes
          suivent la main ensemble. Au relâché, soixante points décident : en
          dessous on revient, au-dessus on change de carte. */}
      <div
        className="cx-scene"
        onPointerDown={(e) => {
          prise.current = e.clientX;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (prise.current == null) return;
          setDx(e.clientX - prise.current);
        }}
        onPointerUp={() => {
          const d = dx;
          prise.current = null;
          if (d < -60) bouger(1);
          else if (d > 60) bouger(-1);
          else setDx(0);
        }}
        onPointerCancel={() => {
          prise.current = null;
          setDx(0);
        }}
      >
        {vues.map((v, i) => {
          const ecart = i - actif;
          if (Math.abs(ecart) > 1) return null;
          return (
            <article
              key={v.id}
              className={`cx-carte${ecart === 0 ? " au-centre" : " de-cote"}`}
              style={{
                "--cx-ecart": ecart,
                "--cx-dx": `${dx}px`,
              } as React.CSSProperties}
              onClick={() => ecart !== 0 && bouger(ecart)}
            >
              <div className="cx-photo" style={{ backgroundImage: `url("${v.photo}")` }} />
              <div className="cx-voile" />
              {/* ═══ PLUS DE PASTILLE « EXEMPLE DE DÉMONSTRATION » ═══════════

                  « Supprimer "démonstration" et "exemple de démonstration"
                  partout, ça ne sert à rien. »

                  ELLE ÉTAIT SUR CHAQUE CARTE, et elle disait la même chose que
                  les quatre autres cartes à côté : tout cet écran est une
                  démonstration, on ne montre rien d'autre. Une mention qui ne
                  distingue rien n'informe personne — elle occupe le coin de
                  chaque photo et on cesse de la lire dès la seconde.

                  CE QUI RESTE, ET QUI N'EST PAS LA MÊME CHOSE : la mention de
                  SIMULATION sur l'essayage. Celle-là dit « cette image n'est
                  pas une photo de vous », et c'est une information, pas un
                  rappel de contexte. Voir `.pm-simu` dans le parcours. */}
              <div className="cx-bas">
                <h2>{v.nom}</h2>
                {v.quoi && <p className="cx-quoi">{v.quoi}</p>}
                <div className="cx-ligne">
                  {v.prix && <b className="cx-prix">{v.prix}</b>}
                  {v.vignette && (
                    <span
                      className="cx-vign"
                      aria-hidden="true"
                      style={{ backgroundImage: `url("${v.vignette}")` }}
                    />
                  )}
                  <span className="cx-ou">
                    {v.heure && (
                      <em>
                        <i aria-hidden="true">🕐</i>
                        {v.heure}
                      </em>
                    )}
                    <em>
                      <i aria-hidden="true">📍</i>
                      {v.distance}
                      {v.ville ? ` · ${v.ville}` : ""}
                    </em>
                  </span>
                </div>
              </div>
            </article>
          );
        })}
        {/* LES FLECHES SE POSENT SUR LES BORDS DE LA CARTE DU CENTRE, et cette
            largeur depend de la hauteur de la scene — donc du telephone. Plutot
            que de la mesurer en JavaScript, on donne aux fleches un cadre qui a
            EXACTEMENT la geometrie de la carte : meme hauteur, meme rapport,
            meme centre. Il ne se voit pas et ne prend aucun appui ; les fleches
            s'accrochent a ses bords et suivent tout seules. */}
        <div className="cx-bords" aria-hidden={vues.length < 2}>
          {actif > 0 && (
            <button
              type="button"
              className="cx-fl g"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => bouger(-1)}
              aria-label="Le commerce précédent"
            >
              ‹
            </button>
          )}
          {actif < vues.length - 1 && (
            <button
              type="button"
              className="cx-fl d"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => bouger(1)}
              aria-label="Le commerce suivant"
            >
              ›
            </button>
          )}
        </div>
      </div>

      {/* LES POINTS DISENT COMBIEN IL Y EN A, ce qu'aucune carte ne dit. Sur sa
          maquette Sorties ils sont entre deux flèches ; ils sont ici pour les
          cinq catégories, parce que le nombre de commerces change de l'une à
          l'autre et que c'est justement ce qu'on veut apprendre. */}
      <div className="cx-points" aria-hidden="true">
        {vues.map((v, i) => (
          <s key={v.id} className={i === actif ? "on" : ""} />
        ))}
      </div>

      {/* ═══ ET LE BOUTON OUVRE LE PARCOURS, POUR LA MODE ══════════════════

          « Voici la suite : parcours mode d'abord et on fera la suite après. »

          IL NE FAISAIT RIEN, ET C'ÉTAIT SA RÉPONSE AU TOUR PRÉCÉDENT : le
          parcours n'existait pas encore. Il existe pour la mode, donc le bouton
          y mène — et il ne fait toujours rien pour les quatre autres, avec la
          même ligne sous lui. Un bouton qui marcherait à moitié sans le dire
          serait pire que les deux. */}
      <button
        type="button"
        className="cx-go"
        onClick={() => {
          /* LES CINQ CATEGORIES ONT LEUR PARCOURS. La ligne « la partie 2
             arrive » ne s'affiche donc plus jamais — elle reste sous le
             bouton, invisible, parce que c'est elle qui rattraperait une
             sixieme categorie ajoutee sans son parcours. */
          if (cle === "mode" && onParcoursMode) return onParcoursMode();
          if (cle === "beaute" && onParcoursCoiffure) return onParcoursCoiffure();
          if (cle === "sorties" && onParcoursSortie) return onParcoursSortie();
          if (cle === "restaurants" && onParcoursTable) return onParcoursTable();
          if (cle === "commerces" && onParcoursDeco) return onParcoursDeco();
          setBientot(true);
        }}
        aria-describedby="cx-bientot"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/clikme-fantome.png" alt="" />
        {categorie.bouton}
        <s aria-hidden="true">→</s>
      </button>
      {/* CE QUI SE PASSE QUAND ON L'APPUIE : rien, et on le dit. Un bouton muet
          se lit comme une panne ; la ligne ci-dessous en fait une étape à
          venir. Elle n'apparaît qu'APRÈS l'appui — annoncer d'avance qu'un
          bouton ne marche pas empêcherait de l'essayer, et c'est justement le
          geste qu'on veut voir en démonstration. */}
      <p className="cx-bientot" id="cx-bientot" hidden={!bientot}>
        La suite du parcours arrive : c’est la partie 2.
      </p>

      <nav className="cx-cats" aria-label="Ce que vous cherchez">
        {CATEGORIES.map((c) => (
          <button
            key={c.cle}
            type="button"
            className={c.cle === cle ? "on" : ""}
            onClick={() => setCle(c.cle)}
            aria-pressed={c.cle === cle}
          >
            <span className="cx-picto" aria-hidden="true">
              <svg viewBox="0 0 24 24">{PICTOS[c.cle]}</svg>
            </span>
            {c.onglet}
          </button>
        ))}
      </nav>

      {/* ═══ « ENTRER DANS L'APPLICATION » A QUITTÉ LE BAS ══════════════════

          « "Rentrer dans l'application" n'est que sur certains onglets, donc le
          supprimer du bas, et peut-être mettre un petit logo fantôme sur chaque
          page d'accueil métier qui mène à l'application. »

          IL NE S'AFFICHAIT QUE LÀ OÙ LE PARENT LUI PASSAIT `onEntrer` — donc
          par intermittence, ce qui est pire qu'absent : une porte qui apparaît
          et disparaît selon l'onglet ne s'apprend pas, elle se subit.

          LE FANTÔME DE L'EN-TÊTE LA REMPLACE, sur les cinq onglets, toujours à
          la même place. C'est le même geste que sur les parcours — voir
          `fantome-accueil.tsx` — sauf qu'ici il mène vers l'application au lieu
          d'en revenir. Une seule mascotte, une seule place, deux directions
          selon l'endroit où l'on se tient. */}
    </div>
  );
}
