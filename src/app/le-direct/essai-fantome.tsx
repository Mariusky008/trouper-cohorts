"use client";

// 👻 L'ESSAI ET LE FANTÔME — les deux chapitres qui manquaient à cette page.
//
// ═══ CE QUI CLOCHAIT ═══════════════════════════════════════════════════════
//
// « Il va falloir réfléchir à la page d'accueil, qui est désuète, et créer une
// ambiance très très sympa pour montrer le concept, qui est très novateur. »
//
// LA PAGE NE DISAIT PAS UN MOT DU PLUS NOUVEAU. Mesuré, pas supposé : le mot
// « essai » n'y figurait nulle part, le mot « fantôme » non plus. Elle montrait
// quatre situations — on mange où, une place se libère, un concert, un poste à
// pourvoir — toutes vraies, toutes utiles, et toutes racontables par une autre
// application. Ce qui ne se trouve nulle part ailleurs était absent.
//
// ═══ POURQUOI LES DEUX ENSEMBLE ════════════════════════════════════════════
//
// Parce que c'est UN geste, pas deux. On essaie une chose sur soi depuis la
// rue, et ce qu'on a essayé reste sur le mur du commerçant, où d'autres le
// voient. Séparés, on obtient un gadget photo d'un côté et un réseau social de
// plus de l'autre. Ensemble, on obtient la vitrine que les habitants
// remplissent eux-mêmes.
//
// ═══ ON MONTRE, ON N'ILLUSTRE PAS ══════════════════════════════════════════
//
// LE SALON SE TIRE AU DOIGT. Deux images côte à côte laissent le lecteur
// chercher la différence ; une glissière la lui fait produire. C'est le seul
// endroit de la page où l'on touche quelque chose, et c'est voulu : le produit
// se joue, il ne se lit pas.
//
// LES FANTÔMES SONT CEUX DU PAQUET. Julie, Nadia et Sofia existent dans
// `fantomes.ts`, sur le mur de la bijouterie, avec leurs mots, leurs heures et
// leurs verdicts. Réécrire ici trois jolis témoignages aurait été inventer une
// preuve : la page promettrait un mur que l'application n'a pas.

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * LA GLISSIÈRE EST UN VRAI CHAMP DE FORMULAIRE, ET C'EST UN CHOIX D'INGÉNIERIE.
 *
 * Écrite à la main — pointerdown, pointermove, calcul de position — elle aurait
 * demandé une centaine de lignes, et elle n'aurait marché qu'au doigt : pas au
 * clavier, pas au lecteur d'écran, pas avec une molette. Un `input[type=range]`
 * transparent posé sur toute la surface donne les trois gratuitement, et le
 * navigateur fait le calcul de position mieux qu'on ne le referait.
 *
 * LE CURSEUR VISIBLE EST DESSINÉ À CÔTÉ, et il ne reçoit aucun appui : c'est le
 * champ, dessous, qui les reçoit tous. Sans quoi le trait volerait au doigt les
 * appuis destinés à la glissière, exactement là où l'on vise.
 */
/**
 * LES DEUX PHOTOS SONT LA MÊME PHOTO, ET C'EST LA CONDITION DE LA DÉMONSTRATION.
 *
 * PREMIER JET, ET IL ÉTAIT FAUX : un poignet nu à gauche, un poignet au
 * bracelet à droite. Les deux images venaient de deux prises différentes —
 * cadrage serré d'un côté, manche et fond clair de l'autre — et le résultat se
 * lisait comme deux photos de deux personnes. Une glissière entre deux images
 * qui ne se superposent pas ne montre pas un essai : elle montre un montage.
 *
 * LE SALON, LUI, EST IDENTIQUE AU PIXEL PRÈS : même table, même canapé, même
 * tapis, même tasse — seules les bougies apparaissent. On a choisi la paire sur
 * sa capacité à prouver, pas sur le métier qu'on aurait préféré montrer.
 *
 * CE QUE CETTE IMAGE EST EXACTEMENT, ET IL FAUT LE SAVOIR POUR NE PAS MENTIR
 * DESSUS : `table-salon-bougie.jpg` a été composée À LA MAIN, avant que le
 * calcul existe — voir `public/direct/LISEZ-MOI.md`. Ce n'est pas une sortie du
 * modèle, c'est la RÉFÉRENCE de ce que le produit doit rendre, et l'écran
 * compose aujourd'hui la même chose tout seul. La page ne prétend donc rien de
 * plus que ce qu'elle montre : voici le geste, et voici à quoi il aboutit.
 */
function Miroir() {
  const [x, setX] = useState(74);
  const boite = useRef<HTMLDivElement | null>(null);

  /**
   * IL SE MONTRE UNE FOIS, QUAND ON ARRIVE DESSUS.
   *
   * Une glissière immobile ne se voit pas : on lit « avant / après », on croit
   * à deux photos, et on passe. Un balayage de trois quarts de seconde à
   * l'entrée dans l'écran dit qu'elle bouge — et il ne se rejoue jamais, parce
   * qu'une page qui s'agite en boucle fatigue avant de convaincre.
   *
   * IL S'ARRÊTE DÈS QU'ON Y TOUCHE : `garde` coupe l'animation au premier
   * appui. Une main qui tire contre une animation qui pousse est le genre de
   * détail qui fait lâcher l'objet.
   */
  const garde = useRef(false);
  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const o = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((e) => e.isIntersecting)) return;
        o.disconnect();
        const depart = performance.now() + 260;
        const duree = 760;
        const boucle = () => {
          if (garde.current) return;
          const t = (performance.now() - depart) / duree;
          if (t < 0) return requestAnimationFrame(boucle);
          if (t >= 1) return setX(34);
          // Un aller simple, adouci aux deux bouts.
          const d = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
          setX(74 + (34 - 74) * d);
          requestAnimationFrame(boucle);
        };
        requestAnimationFrame(boucle);
      },
      { threshold: 0.35 },
    );
    o.observe(el);
    return () => o.disconnect();
  }, []);

  return (
    <div className="ld-miroir" ref={boite} style={{ "--x": `${x}%` } as React.CSSProperties}>
      {/* LE SALON AVEC LES BOUGIES — dessous, et entier. */}
      <Image
        src="/direct/table-salon-bougie.jpg"
        alt="Le même salon, avec le trio de bougies rouges de l’atelier posé sur la table basse."
        width={1200}
        height={900}
        sizes="(max-width:760px) 92vw, 520px"
        className="ld-mi-i"
        priority
      />
      {/* LE SALON TEL QU'IL A ÉTÉ PHOTOGRAPHIÉ — par-dessus, coupé au trait.
          SON ÉTIQUETTE EST DEDANS, ET C'EST NÉCESSAIRE : posée à côté, elle
          restait visible quand on tirait le trait à fond à gauche, donc on
          lisait « Votre salon » par-dessus le salon avec les bougies. Dans le
          calque, elle disparaît avec ce qu'elle nomme. */}
      <div className="ld-mi-av">
        <Image
          src="/direct/table-salon.jpeg"
          alt="Un salon photographié au téléphone : table basse, canapé, tapis."
          width={1200}
          height={900}
          sizes="(max-width:760px) 92vw, 520px"
          className="ld-mi-i"
          priority
        />
        <span className="ld-mi-e a" aria-hidden="true">Votre salon</span>
      </div>
      {/* « AVEC LES BOUGIES », ET PAS « LES BOUGIES DE L'ATELIER » : la
          seconde se coupait à « LES BOUGIES DE L'… » dans la moitié qui lui
          revient. Une étiquette tronquée ne dit rien de plus qu'une étiquette
          absente, et elle a l'air d'un défaut. */}
      <span className="ld-mi-e b" aria-hidden="true">Avec les bougies</span>
      <span className="ld-mi-t" aria-hidden="true">
        <i>↔</i>
      </span>
      <input
        type="range"
        min={4}
        max={96}
        value={Math.round(x)}
        className="ld-mi-r"
        aria-label="Tirer pour comparer le salon vide et le salon avec les bougies"
        onPointerDown={() => { garde.current = true; }}
        onKeyDown={() => { garde.current = true; }}
        onChange={(e) => { garde.current = true; setX(Number(e.target.value)); }}
      />
    </div>
  );
}

/**
 * TROIS FANTÔMES, ET CE SONT CEUX DU PAQUET.
 *
 * Copiés de `fantomes.ts`, mur de la bijouterie — mêmes prénoms, mêmes mots,
 * mêmes heures, mêmes verdicts. Ils sont recopiés plutôt qu'importés parce que
 * cette page est prérendue et que tirer le paquet entier (mille cinq cents
 * lignes de commerces) pour en montrer trois coûterait à chaque visiteur le
 * prix de tout le reste. La garde des styles ne le voit pas ; le poids, si.
 *
 * TROIS VERDICTS DIFFÉRENTS, ET C'EST TOUT LE PROPOS : une qui a pris, une qui
 * est passée, une qui hésite encore et le dit. Un mur où tout le monde achète
 * n'est pas un mur, c'est une page d'avis.
 */
const FANTOMES: {
  qui: string;
  photo: string;
  quoi: string;
  verdict: "pris" | "passe" | null;
  mot: string;
  heure: string;
  interesses: number;
}[] = [
  {
    qui: "Julie",
    photo: "/direct/poignet-bracelet.jpg",
    quoi: "Chaîne fine, pierre noire",
    verdict: null,
    mot: "Sur moi ça donne ça. Trop discret pour un cadeau, vous pensez ?",
    heure: "11:20",
    interesses: 9,
  },
  {
    qui: "Sofia",
    photo: "/direct/collier-seul.png",
    quoi: "Collier pierre bleue",
    verdict: "pris",
    mot: "Pris pour l’anniversaire de ma mère. Elle ne l’a pas encore vu 🤫",
    heure: "12:04",
    interesses: 6,
  },
  {
    qui: "Nadia",
    photo: "/direct/poignet-nu.jpg",
    quoi: "Bracelet rivière",
    verdict: "passe",
    mot: "Essayé, pas pour tous les jours. Mais j’y repense depuis ce matin.",
    heure: "10:12",
    interesses: 5,
  },
];

/**
 * TROIS VERDICTS, Y COMPRIS CELUI QUI N'EN EST PAS UN.
 *
 * DÉFAUT VU À L'ÉCRAN : le fantôme sans verdict n'avait pas de pastille, et
 * les trois cartes se lisaient comme « pris », « passé », et une troisième à
 * qui il manquait quelque chose. Or l'hésitation EST un état du produit — c'est
 * l'humeur « J'hésite encore » — et c'est même le plus utile des trois pour le
 * commerçant, qui sait alors qu'il a failli vendre.
 */
const VERDICT: Record<string, [string, string]> = {
  pris: ["✓", "Pris"],
  passe: ["↩", "Passé"],
  hesite: ["…", "Hésite"],
};

export function EssaiEtFantome() {
  return (
    <>
      {/* ─── L'ESSAI ─── */}
      <section className="ld-cas t-essai" aria-labelledby="t-essai">
        <div className="ld-cas-h">
          <p className="ld-quand" data-r>
            <i aria-hidden="true">●</i>
            Devant la vitrine
          </p>
          <h2 id="t-essai" className="ld-t2" data-r style={{ "--d": "60ms" } as React.CSSProperties}>
            Essayez-le avant d’entrer.
            <span>Sur vous, ou chez vous.</span>
          </h2>
          <p className="ld-s" data-r style={{ "--d": "120ms" } as React.CSSProperties}>
            Les bougies sont dans la vitrine, vous êtes sur le trottoir. Vous
            photographiez votre salon, et vous les voyez dessus — au bon
            endroit, à la bonne taille, dans votre lumière.{" "}
            <b>Tirez le trait pour comparer.</b>
          </p>
        </div>

        <div className="ld-miroir-h" data-r style={{ "--d": "180ms" } as React.CSSProperties}>
          <Miroir />
        </div>

        <ul className="ld-atouts cas" aria-label="Ce que ça apporte">
          {[
            ["🤳", "Chez vous, pas dans un catalogue",
             "Votre table, votre teint, votre lumière. Une photo de catalogue ne dit jamais si ça va chez vous, à vous."],
            ["🚪", "Avant de pousser la porte",
             "On n’essaie plus par politesse ce qu’on n’achètera pas, et on n’entre plus pour rien. Le commerçant y gagne autant que vous."],
            ["💇", "La coupe, les ongles, la robe, le tatouage",
             "Même geste chez tous ceux dont le métier est de changer quelque chose sur vous. Ce qu’ils vendent, vous le voyez avant."],
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

        <p className="ld-chute" data-r>
          Ce que vous achetez, vous l’avez déjà vu sur vous, ou chez vous.
        </p>
      </section>

      {/* ─── LE FANTÔME ───
          IL VIENT APRÈS L'ESSAI, ET L'ORDRE EST LE PROPOS. Le fantôme n'est
          pas une fonction de plus : c'est ce que DEVIENT un essai quand on
          accepte de le laisser. Présenté avant, il faudrait expliquer ce qu'on
          laisse ; présenté ici, on vient de le voir. */}
      <section className="ld-cas t-fantome" aria-labelledby="t-fantome">
        <div className="ld-cas-h">
          <p className="ld-quand" data-r>
            <i aria-hidden="true">●</i>
            Ce que vous laissez
          </p>
          <h2 id="t-fantome" className="ld-t2" data-r style={{ "--d": "60ms" } as React.CSSProperties}>
            Votre fantôme reste au magasin.
            <span>Deux jours, puis il s’efface.</span>
          </h2>
          <p className="ld-s" data-r style={{ "--d": "120ms" } as React.CSSProperties}>
            Vous posez votre essai sur le mur du commerçant&nbsp;: ce que vous
            avez essayé, ce que vous en avez pensé, et si vous l’avez pris,
            laissé, ou si vous hésitez encore.{" "}
            <b>Le suivant qui passe le voit.</b>
          </p>
        </div>

        <ul className="ld-laisse" aria-label="Le mur d’une bijouterie, en ce moment">
          {FANTOMES.map((f, k) => (
            <li key={f.qui} data-r style={{ "--d": `${k * 90}ms` } as React.CSSProperties}>
              <div className="ld-la-p">
                <Image
                  src={f.photo}
                  alt={`L’essai de ${f.qui} : ${f.quoi}.`}
                  width={360}
                  height={360}
                  sizes="(max-width:760px) 40vw, 200px"
                />
                <b className={`ld-la-v ${f.verdict ?? "hesite"}`}>
                  <i aria-hidden="true">{VERDICT[f.verdict ?? "hesite"][0]}</i>
                  {VERDICT[f.verdict ?? "hesite"][1]}
                </b>
              </div>
              <div className="ld-la-d">
                <p className="ld-la-q">
                  <b>{f.qui}</b>
                  <em>{f.quoi}</em>
                  <s>{f.heure}</s>
                </p>
                <p className="ld-la-m">{f.mot}</p>
                <p className="ld-la-i">
                  <i aria-hidden="true">✦</i>
                  {f.interesses} personnes ont dit «&nbsp;ça m’intéresse&nbsp;»
                </p>
              </div>
            </li>
          ))}
        </ul>

        <ul className="ld-atouts cas" aria-label="Ce que ça apporte">
          {[
            ["🏪", "La vitrine est faite par ceux qui passent",
             "Le commerçant n’a rien à publier : le mur se remplit tout seul, de vrais poignets et de vrais avis, du matin au soir."],
            ["🕐", "Tout s’efface au bout de deux jours",
             "Rien ne s’accumule, rien ne se retrouve dans six mois. Ce qui est dit vaut pour aujourd’hui, et aujourd’hui seulement."],
            ["👋", "Un prénom, et c’est tout",
             "Pas de profil, pas d’abonnés, pas de compte à faire grossir. Vous laissez un essai, pas une identité."],
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

        <p className="ld-chute" data-r>
          Une vitrine que les habitants remplissent eux-mêmes, et qui se vide toute seule.
        </p>
      </section>
    </>
  );
}
