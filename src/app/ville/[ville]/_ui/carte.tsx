"use client";

// La carte du fil.
//
// Sa première ligne porte les trois marqueurs — distance, fraîcheur, échéance —
// et c'est le seul détail de mise en page qui compte vraiment ici : c'est cette
// ligne qui donne la sensation qu'il se passe quelque chose maintenant, près de
// soi. En pied, elle ne serait lue qu'après avoir décidé, c'est-à-dire jamais.
//
// Le ♥ est optimiste : il s'allume avant la réponse du serveur et se rétracte si
// l'appel échoue. Un cœur qui met 400 ms à répondre ne se reclique pas, il se
// re-tape — et on se retrouve avec deux appels et un état faux.
import { useState, useTransition } from "react";
import Link from "next/link";
import { FAMILLE_LABEL, type Famille } from "@/lib/direct/publications";
import { usePosition } from "@/lib/direct/position";
import { distanceCourte, metresEntre } from "@/lib/direct/degradation";
import { VideoCarte } from "./video-carte";
import { teinte, initiales } from "./teinte";
import { Reactions } from "./reactions";
import { Loupe } from "./loupe";
import { lienReserverTable } from "@/lib/direct/reserver";
import { prixCourt } from "@/lib/direct/prix";
import { BoutonPartage } from "./partage";
import type { VueReactions } from "@/lib/direct/reactions";

export type CarteVue = {
  id: string;
  famille: Famille;
  texte: string;
  photo: string | null;
  /** Vidéo de l'annonce. La photo reste l'image d'affiche : elle s'affiche
   *  partout où la vidéo ne peut pas se lire (e-mail, aperçu de lien). */
  video: string | null;
  lien: string | null;
  auteurNom: string;
  auteurMetier: string;
  auteurSlug: string;
  /** Le WhatsApp du commerce, pour les cartes du jour : c'est par là qu'on
   *  réserve une table. Vide quand on n'a pas de numéro — le bouton se tait
   *  alors plutôt que d'ouvrir une conversation avec personne. */
  telephone?: string;
  /** LE PRIX ANNONCÉ, sur les cartes du jour. `null` partout ailleurs, et sur
   *  celles dont le restaurateur n'annonce pas de prix — auquel cas la
   *  pastille ne paraît pas, plutôt que d'afficher un prix inventé. */
  prix?: number | null;
  /** Déjà formatés côté serveur : le fuseau du serveur fait foi, et un rendu
   *  client divergent provoquerait une erreur d'hydratation à chaque carte. */
  repere: string;
  /** Position du commerce, quand on l'a. Sert à remplacer le repère de repli par
   *  une distance réelle SI la personne a accordé la sienne. Le serveur rend
   *  toujours le repli : sans permission, l'écran est identique. */
  lat: number | null;
  lng: number | null;
  fraicheur: string;
  echeance: string;
  /** Vrai quand l'annonce disparaît dans l'heure. Calculé au serveur : lu ici,
   *  il ferait diverger le rendu du navigateur de celui du serveur. */
  urgent: boolean;
  /** LES FAÇONS DE PROFITER DE L'ANNONCE, déjà résumées par le serveur, dans
   *  l'ordre d'affichage (du prix le plus haut au plus bas). Vide quand il n'y
   *  en a aucune, ou qu'elles sont toutes terminées. */
  facons: Array<{
    id: string;
    type: "simple" | "cadeau" | "express" | "collectif";
    /** « Le cadeau », « L'express », « Table à partager ». */
    label: string;
    /** Ce qu'on doit faire pour l'obtenir. */
    promesse: string;
    /** Le prix à payer avec cette façon, déjà mis en forme. */
    prix: string;
    /** La contrainte de temps, en clair : « Arrivée avant 12 h 47 ». */
    quand: string;
    /** « 2 / 4 déjà intéressés » — uniquement pour la table à partager. */
    compte: string;
    /** Avancement entre 0 et 1, pour la jauge. `null` sans jauge à montrer. */
    part: number | null;
    etat: "ouverte" | "presque" | "complete" | "epuise";
    /** Déjà pris par cette personne : la ligne confirme au lieu de proposer. */
    mienne: boolean;
  }>;
  /** CE QU'IL RESTE, écrit par le commerçant : « 2 tables », « 3 parts ».
   *  Vide quand il ne l'a pas renseigné — on n'invente pas un stock. */
  reste: string;
  /** L'adresse de sa carte du jour. `null` : pas de bouton. */
  ardoise: string | null;
  /** Le libellé du bouton, dans les mots de SON métier : « Voir l'ardoise »
   *  chez un restaurant, « Voir les prestations » chez un coiffeur. Calculé au
   *  serveur pour que la question posée au commerçant et le bouton lu par
   *  l'habitant disent la même chose. */
  ardoiseLabel: string;
  /** LA PETITE HISTOIRE DU JOUR de ce commerce, quand il en a écrit une.
   *  Ce n'est pas une offre : elle ne propose rien, elle donne envie de
   *  passer. `null` la plupart du temps, et c'est normal. */
  histoire: { texte: string; emoji: string } | null;
  /** Les réactions déjà posées, et celles qui sont miennes. */
  reactions: VueReactions;
};

/** Le pictogramme de la ligne « ce qu'il reste ».
 *
 *  Il suit la FAMILLE, pas le métier : « 2 tables » sous une assiette et
 *  « 2 places » sous une chaise se lisent d'un coup d'œil, alors qu'une puce
 *  neutre obligerait à lire le texte pour comprendre de quoi il reste deux. */
//
// LE SÉLECTEUR DE VARIANTE (U+FE0F) EST OBLIGATOIRE ici. Sans lui, U+1F37D,
// U+1F3F7 et U+1F39F se dessinent en style TEXTE — une glyphe étroite en noir
// et blanc, qui se superposait au chiffre juste à côté. Mesuré : 40 px contre
// 50 px pour les autres pictogrammes de la carte.
const PICTO: Record<Famille, string> = {
  menu: "🍽️",
  place: "💺",
  offre: "🏷️",
  evenement: "🎟️",
  ville: "📣",
};

export function Carte({
  p,
  gardee,
  ville,
  villeNom = "",
  action = "garder",
}: {
  p: CarteVue;
  gardee: boolean;
  ville: string;
  /** Le nom lisible de la ville — « Dax », pas « dax ». Sert au message de
   *  partage : « à dax, ce midi » se lit comme une faute. */
  villeNom?: string;
  /** « garder » sur le fil, « retirer » dans Mes commerces. */
  action?: "garder" | "retirer";
}) {
  const [on, setOn] = useState(gardee);
  const [, demarrer] = useTransition();
  const moi = usePosition();
  /**
   * LA CARTE DU JOUR S'OUVRE EN GRAND.
   *
   * Sur une annonce ordinaire, la photo illustre — appuyer dessus pour aller
   * chez le commerçant est le bon geste. Sur une carte du jour, la photo EST le
   * contenu : c'est le menu. La vignette la montre cadrée sur 280 px, la moitié
   * des plats hors champ, et le geste naturel — appuyer sur la photo — menait au
   * site du restaurant. On lisait le nom du restaurant au lieu de son menu.
   *
   * Réservé aux cartes du jour : ailleurs, agrandir une photo de vitrine
   * n'apporte rien, et ça retirerait le chemin vers la boutique.
   */
  const [loupe, setLoupe] = useState(false);
  const menuAVoir = p.famille === "menu" && Boolean(p.photo) && !p.video;
  // Réserver ne vaut que pour une carte du jour : ailleurs, les façons d'en
  // profiter portent déjà l'action, et un second bouton la concurrencerait.
  const reserver = p.famille === "menu" && p.telephone ? lienReserverTable(p.telephone, p.auteurNom) : "";
  // Le prix ne s'affiche QUE sur une carte du jour : ailleurs, ce sont les
  // façons d'en profiter qui portent les prix, et une pastille de plus les
  // contredirait à l'écran.
  const prix = p.famille === "menu" ? prixCourt(p.prix ?? null) : "";

  // La distance ne remplace le repli que si les deux positions existent.
  const repere =
    moi && p.lat != null && p.lng != null
      ? distanceCourte(metresEntre(moi.lat, moi.lng, p.lat, p.lng))
      : p.repere;

  const basculer = async () => {
    const vise = !on;
    setOn(vise); // optimiste
    try {
      const r = await fetch("/api/direct/garder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicationId: p.id, ville, garder: vise }),
      });
      if (!r.ok) throw new Error(String(r.status));
      demarrer(() => {});
    } catch {
      setOn(!vise); // l'appel a échoué : on ne laisse pas un état faux à l'écran
    }
  };

  // `apercu` est la boutique publique du commerce. `/site-internet/${slug}` sans
  // `apercu` est la landing de PROSPECTION (cible du QR de la lettre) : y envoyer
  // un habitant lui proposerait de faire refaire son site.
  // `via=direct` : même convention d'attribution que le lien du résumé quotidien.
  // `pub` transporte l'annonce qui a mené au clic : c'est ce qui permet de dire
  // au commerçant QUELLE offre a fonctionné, pas seulement qu'on est venu du
  // Direct. Compté à l'arrivée, donc sans aller-retour supplémentaire.
  const fiche = p.auteurSlug ? `/site-internet/apercu/${p.auteurSlug}?via=direct&pub=${p.id}` : null;

  return (
    /* L'ANCRE : c'est elle qui permet de revenir du défilé des menus à
       l'annonce, à l'endroit exact. `scroll-margin-top` évite qu'elle
       s'arrête sous l'en-tête collant. */
    <article className="post" id={`p-${p.id}`}>
      {loupe && p.photo && (
        <Loupe src={p.photo} alt={`Carte du jour — ${p.auteurNom}`} onFermer={() => setLoupe(false)} />
      )}
      {/* NIVEAU 1 — L'ENVIE. L'image occupe la tête de carte et porte le texte.
          Sans photo, un aplat teinté avec le nom du commerce : jamais de carte
          vide, et surtout jamais une photo de vitrine posée à côté d'un plat
          qu'elle ne montre pas — l'image doit dire ce que l'annonce dit. */}
      <div className={`pic${menuAVoir ? " pic-menu" : ""}`}>
        {p.video ? (
          <VideoCarte src={p.video} poster={p.photo} alt={`Vidéo de ${p.auteurNom}`} />
        ) : p.photo ? (
          <div className="fond" style={{ backgroundImage: `url(${JSON.stringify(p.photo)})` }} role="presentation" />
        ) : (
          <div className="repli" style={{ background: teinte(p.auteurNom) }} aria-hidden="true">
            <span>{initiales(p.auteurNom)}</span>
          </div>
        )}
        <div className="voile" aria-hidden="true" />
        {/* La zone d'agrandissement passe SOUS le bloc de texte (`.sur`, ancré en
            bas) : appuyer sur l'image ouvre le menu, appuyer sur le titre mène
            toujours chez le restaurant. Les deux gestes restent possibles, et
            chacun donne ce qu'il annonce. */}
        {menuAVoir && (
          <>
            <button
              type="button"
              className="agrandir"
              onClick={() => setLoupe(true)}
              aria-label="Voir la carte du jour en entier"
            />
            <span className="agrandir-i" aria-hidden="true">🔍 Voir en entier</span>
          </>
        )}
        {/* LE NOM AVEC LA DISTANCE. « Dax » seul, dans Le Direct de Dax, ne dit
            rien — c'était le badge le plus inutile de la carte. « Chez Bergeron
            · 350 m » dit à la fois chez qui et à quelle distance, c'est-à-dire
            les deux choses qui décident si l'on y va. */}
        <span className="bg">{p.auteurNom}{repere ? ` · ${repere}` : ""}</span>
        {/* L'échéance passe au ROUGE quand elle presse. Une heure limite dans
            la même teinte calme que le reste ne presse personne. */}
        {p.echeance ? <span className={`bd${p.urgent ? " chaud" : ""}`}>{p.echeance}</span> : null}
        {/* LE PRIX, GROS ET SUR LA PHOTO. C'est la première question qu'on se
            pose devant un menu, et la dernière qu'on trouvait : il fallait
            ouvrir l'ardoise et la lire jusqu'en bas. Sous l'échéance, pour ne
            pas la recouvrir sur les écrans étroits. */}
        {prix ? <span className="bp">{prix}</span> : null}

        {/* NIVEAU 2 — LA DÉCISION, puis NIVEAU 3 — LA PREUVE : la fraîcheur.
            « il y a 4 min » est le signal qui sépare ce fil d'un annuaire. */}
        {fiche && !menuAVoir ? (
          <Link href={fiche} className="sur" prefetch={false}>
            <span className={`pastille k-${p.famille}`}>{FAMILLE_LABEL[p.famille]}</span>
            {p.fraicheur ? <span className="conf"><i />{p.fraicheur}</span> : null}
            <h3>{p.texte}</h3>
            {/* LE MÉTIER SEUL. Le nom du commerce est déjà sur le badge du haut :
                l'écrire une seconde fois trois lignes plus bas ne disait rien de
                plus et poussait le titre vers le milieu de l'image. */}
            <span className="qui">{p.auteurMetier || p.auteurNom}</span>
          </Link>
        ) : (
          <div className="sur">
            <span className={`pastille k-${p.famille}`}>{FAMILLE_LABEL[p.famille]}</span>
            {p.fraicheur ? <span className="conf"><i />{p.fraicheur}</span> : null}
            <h3>{p.texte}</h3>
            {/* LE MÉTIER SEUL. Le nom du commerce est déjà sur le badge du haut :
                l'écrire une seconde fois trois lignes plus bas ne disait rien de
                plus et poussait le titre vers le milieu de l'image. */}
            <span className="qui">{p.auteurMetier || p.auteurNom}</span>
          </div>
        )}
      </div>

      {/* CE QU'IL RESTE, ET L'ARDOISE. Deux informations que le commerçant
          saisit lui-même — elles étaient dessinées sur la maquette sans que
          personne ne les renseigne nulle part.

          L'HEURE DE FIN N'EST PAS RÉPÉTÉE ICI : elle est déjà sur le badge de
          l'image, en rouge quand elle presse. L'écrire une seconde fois sous
          l'image donnerait deux endroits à tenir à jour pour un seul fait.

          La ligne ne s'affiche que si l'un des deux existe : une barre vide
          sous chaque carte ferait du bruit à la place d'une information. */}
      {(p.reste || p.ardoise || (menuAVoir && fiche)) && (
        <div className="det">
          {p.reste ? (
            <span className="det-r">
              <span aria-hidden="true">{PICTO[p.famille]}</span> {p.reste}
            </span>
          ) : (
            <span />
          )}
          <span className="det-l">
            {/* LE CHEMIN VERS LE COMMERCE, repris ici pour les cartes du jour.
                L'image entière y ouvre le menu — c'était le geste attendu, et il
                menait au site. Le lien ne disparaît pas pour autant : il descend
                d'un cran, nommé, là où on le cherche une fois la carte lue.
                Les deux cohabitent : un restaurant peut très bien avoir publié
                sa photo ET garder un lien vers sa carte complète. */}
            {menuAVoir && fiche ? (
              <Link className="det-a" href={fiche} prefetch={false}>
                Voir le restaurant ›
              </Link>
            ) : null}
            {p.ardoise ? (
              <a className="det-a" href={p.ardoise} target="_blank" rel="noreferrer noopener">
                {p.ardoiseLabel} ›
              </a>
            ) : null}
          </span>
        </div>
      )}

      {/* COMMENT VOULEZ-VOUS EN PROFITER ?
          Les façons sont montrées ENSEMBLE, et c'est tout l'intérêt : c'est la
          descente des prix qui rend chacun compréhensible. Une seule façon à
          l'écran, l'habitant lit une remise ; les trois, il comprend qu'on lui
          propose un échange — payer moins contre venir vite, ou à plusieurs.
          Le commerce ne brade pas, il rémunère un comportement. */}
      {p.facons.length > 0 && (
        <div className="fac">
          {/* L'EN-TÊTE DÉPEND DE CE QU'IL Y A À CHOISIR.
              « Comment voulez-vous en profiter ? » devant une seule porte est
              une question sans objet — et pire, elle laisse croire qu'on cache
              les autres. Un créneau qui se libère n'a rien à comparer : il a
              une seule chose à faire, et on le dit comme ça. */}
          <div className="fac-h">
            <span className="fac-q">
              {p.facons.length > 1 ? "Comment voulez-vous en profiter ?" : "Une seule chose à faire"}
            </span>
            {p.facons.length > 1 && (
              <span className="fac-pr" aria-hidden="true">
                {p.facons.map((f) => f.prix).join(" → ")}
              </span>
            )}
          </div>
          {p.facons.map((f) => (
            <Link
              key={f.id}
              href={`/ville/${ville}/clik/${f.id}`}
              className={`fac-l fac-${f.type}${f.etat === "epuise" ? " fac-off" : ""}${f.mienne ? " fac-moi" : ""}`}
              prefetch={false}
            >
              <span className="fac-ic" aria-hidden="true">
                {f.type === "cadeau" ? "🎁" : f.type === "express" ? "⚡" : f.type === "collectif" ? "👥" : "🕐"}
              </span>
              <span className="fac-c">
                <span className="fac-t">
                  <b>{f.prix}</b>
                  <em>{f.label}</em>
                </span>
                {/* DÉJÀ PRIS : la ligne ne propose plus, elle confirme — et
                    elle mène toujours à l'écran du Clik, parce que c'est là
                    que se trouve le code à présenter. La fermer complètement
                    cacherait précisément ce dont on a besoin en arrivant au
                    commerce. */}
                <span className="fac-s">{f.mienne ? "Vous en êtes — voir votre code" : f.compte || f.promesse}</span>
                {f.quand && <span className="fac-q2">{f.quand}</span>}
                {f.part != null && (
                  <span className="fac-j" aria-hidden="true">
                    <i style={{ width: `${Math.round(f.part * 100)}%` }} />
                  </span>
                )}
              </span>
              <span className="fac-go" aria-hidden="true">{f.mienne ? "✓" : "›"}</span>
            </Link>
          ))}
        </div>
      )}

      {/* LA PETITE HISTOIRE DU JOUR — ce qui se passe chez eux, dit par eux.
          Elle vit SUR la carte du commerce et non dans une carte à elle :
          une histoire ne se saisit pas, et lui donner sa propre carte la
          mettrait en concurrence avec les vraies offres du fil.

          En italique et entre guillemets : c'est une VOIX, pas une ligne de
          catalogue, et l'œil doit le comprendre avant de lire. */}
      {p.histoire && (
        <div className="hist">
          <span className="hist-e" aria-hidden="true">{p.histoire.emoji}</span>
          <span className="hist-t">«&nbsp;{p.histoire.texte}&nbsp;»</span>
        </div>
      )}

      {/* LES RÉACTIONS, entre l'offre et la sortie. Quatre intentions, aucun
          « like » : « douze personnes passent voir » se comprend, « douze
          pouces levés » ne veut rien dire — ni pour l'habitant qui appuie, ni
          pour le commerçant qui lit. */}
      <Reactions publicationId={p.id} ville={ville} initial={p.reactions} />

      {/* LE PIED DE CARTE : UN SEUL BOUTON, ET LE BON.

          Sur une carte du jour, il disait « La boutique » et menait au même
          endroit que « Voir le restaurant » ajouté sous l'image — deux boutons
          pour une seule destination. Et surtout : un menu n'a aucune façon d'en
          profiter (c'est voulu, un menu n'est pas un stock à saisir), donc
          l'habitant qui avait faim n'avait AUCUN moyen de réserver.

          « Je réserve » ouvre WhatsApp avec la demande écrite. C'est la même
          mécanique que partout ailleurs : le client écrit, le commerçant reçoit
          là où il regarde déjà, et son numéro arrive avec le message. */}
      <div className="pf">
        {reserver ? (
          <a className="act resa" href={reserver} target="_blank" rel="noreferrer noopener">
            🍽️ Je réserve une table
          </a>
        ) : fiche ? (
          <Link href={fiche} className="act gh" prefetch={false}>La boutique</Link>
        ) : p.lien ? (
          <a className="act gh" href={p.lien} target="_blank" rel="noreferrer noopener">En savoir plus</a>
        ) : null}
        {/* PARTAGER — sur les cartes du jour seulement.
            « Ça te dit ça ce midi ? » envoyé à un collègue est la seule boucle
            de ce produit qui n'attend pas d'avoir du monde pour fonctionner :
            il lui faut deux amis, pas soixante-dix restaurants. Et c'est le
            client qui devient le diffuseur du restaurant.
            Ailleurs qu'à midi, partager une place de coiffeur qui part dans
            l'heure n'a pas de destinataire : le bouton se tait. */}
        {p.famille === "menu" ? (
          <BoutonPartage
            id={p.id}
            ville={ville}
            villeNom={villeNom}
            commerce={p.auteurNom}
            prix={p.prix ?? null}
            compact
          />
        ) : null}
        <button
          type="button"
          className={`coeur${on ? " on" : ""}`}
          onClick={basculer}
          aria-pressed={on}
          aria-label={on ? "Retirer de mes gardées" : "Garder"}
          title={action === "retirer" ? "Retirer" : "Garder"}
        >
          {on ? "♥" : "♡"}
        </button>
      </div>
    </article>
  );
}
