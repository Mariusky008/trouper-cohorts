// 🏪 LA PAGE PUBLIQUE D'UN COMMERÇANT — désormais la boutique, et rien d'autre.
//
// ═══ CE QUI A CHANGÉ, DANS SES MOTS ═══════════════════════════════════════
//
// « Aujourd'hui nous avons le circuit où le commerçant part de clikme.fr pour
// renseigner ses infos de départ, après quoi ClikMe va chercher les infos sur
// sa fiche Google. Mais le concept a changé un peu, et maintenant la page
// d'accueil du commerçant ressemble à /autour-de-moi/boutique. Donc il va
// falloir changer pour que les pages d'accueil des commerçants deviennent le
// style exact de /autour-de-moi/boutique. »
//
// ELLE ÉTAIT LA DERNIÈRE SURVIVANTE DE LA GÉNÉRATION PRÉCÉDENTE. L'en-tête de
// la maquette le disait déjà : des trois surfaces du produit — l'habitant,
// l'espace pro, la page publique — elle était la seule à n'avoir jamais été
// redessinée. Ce n'est donc pas qu'elle avait « un autre style » : elle était
// d'avant.
//
// ═══ CE QUI DISPARAÎT AVEC ELLE ═══════════════════════════════════════════
//
// Le site vitrine et ses dix-huit sections — l'approche, la FAQ, les motifs de
// consultation, le mini-agenda, la carte Google en iframe, les avis recopiés.
// Elles décrivaient un commerce ; la boutique le MONTRE EN TRAIN DE VIVRE :
// ce qu'il a maintenant, ce qu'on peut essayer chez lui, ce qui revient.
//
// Et le mobilier de démarchage qui s'empilait par-dessus : la barre « Suivre
// ce commerce », le bandeau du collectif, la bande de l'offre partenaire.
// « Garder le formulaire seul » — il ne reste que la demande, tout en bas,
// une fois la démonstration finie. Voir `garder-ce-site.tsx`.
//
// ═══ CE QUI RESTE, ET QU'IL A DEMANDÉ DE GARDER ═══════════════════════════
//
// « On va garder la voix de l'IA qui fait la démo, mais en faisant les
// changements nécessaires par rapport aux nouveautés et à celles qu'on a
// enlevées. » C'est `DemoTour`, dont le récit a été repris pour cette page —
// il ouvre sur la boutique, et son acte central va chercher l'essai du métier
// SUR LA VRAIE PAGE, ce qui le rend juste chez un coiffeur comme chez une
// onglerie sans écrire une scène par métier.
import { Boutique } from "@/app/autour-de-moi/boutique/boutique";
import { DemoTour } from "./demo-tour";
import { GarderCeSite } from "./garder-ce-site";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";
import { gesteDuJour } from "@/lib/direct/geste-du-jour";
import { murDeLaCarte } from "@/lib/direct/fantomes";
import { parcoursPromis } from "@/lib/direct/parcours-promis";
import type { CarteAutour } from "@/lib/direct/apercu-habitant";

export type PageBoutiqueProps = {
  slug: string;
  /** Le commerce, déjà fabriqué : soit depuis sa fiche Google, soit de démonstration. */
  carte: CarteAutour;
  /**
   * Vrai quand on montre au COMMERÇANT sa propre page : la voix se propose, le
   * formulaire apparaît en pied. Faux pour tout visiteur venu du public — Le
   * Direct, un lien WhatsApp, le QR de la vitrine — qui doit voir une boutique,
   * pas une démonstration commerciale adressée à quelqu'un d'autre.
   */
  modeDemo: boolean;
  /** Venu du fil : lui seul a un fil où revenir. Voir `retourHref` de la boutique. */
  venuDuDirect: boolean;
  phoneDisplay?: string;
  /** Contact direct pour « Garder ma page » depuis l'écran de fin de la voix. */
  keepHref?: string;
  note: string | null;
  reviewsCount: number | null;
  /**
   * CE COMMERCE EST-IL INVENTÉ ? La question n'a l'air de rien et elle décide
   * du pied de page. Une adresse de démonstration DOIT l'avouer ; la page d'un
   * vrai commerçant ne doit surtout pas le dire de lui. Voir `piedMaquette`
   * dans la boutique.
   */
  invente?: boolean;
};

/**
 * LA PHRASE QU'IL DIRAIT, ET L'ANNONCE QUE ÇA DEVIENT.
 *
 * La démonstration montre une TRANSFORMATION, donc il faut les deux bouts. Un
 * créneau qui se libère est un cas trop étroit pour porter la promesse, et une
 * remise donnerait l'image d'une plateforme de réductions. Le message est
 * « il se passe quelque chose chez vous, dites-le » — donc à chaque métier son
 * « quelque chose », le sien.
 *
 * ILLUSTRATION ASSUMÉE : jamais présentée comme une donnée réelle du commerce.
 */
function annonceExemple(metier: string, nom: string): { dit: string; annonce: string } {
  const t = metier.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/tatou|piercing/.test(t))
    return { dit: "Je viens de créer un nouveau motif.", annonce: `Nouveau motif disponible chez ${nom} ✨ Envie de le découvrir ou de l'adapter à votre projet ? Écrivez-moi.` };
  if (/boulanger|patiss|viennoiser|chocolat|glacier/.test(t))
    return { dit: "La nouvelle fournée vient de sortir.", annonce: `La nouvelle fournée vient de sortir chez ${nom} 🥖 Passez tant qu'elle est chaude.` };
  if (/restaur|resto|bistrot|brasser|pizz|gastronomi|caf|\bbar\b|\bpub\b|traiteur|crep|brunch|boucher/.test(t))
    return { dit: "Aujourd'hui, le chef propose un nouveau plat.", annonce: `Nouveau plat à la carte aujourd'hui chez ${nom} 🍽️ Envie d'y goûter ? Écrivez-moi, je vous garde une table.` };
  if (/coiff|barbier|esth|ongle|beaut|maquill|spa|massage|bronz|\bcil|epil/.test(t))
    return { dit: "Un créneau vient de se libérer demain.", annonce: `Un créneau vient de se libérer demain chez ${nom} ✨ Je vous le réserve ?` };
  if (/artisan|menuis|ebenist|plomb|electric|macon|couvreur|peintre|serrur|carrel|vitrier|paysagiste|bijou|cire/.test(t))
    return { dit: "Je viens de terminer une nouvelle réalisation.", annonce: `Nouvelle réalisation terminée chez ${nom} 🛠️ Envie du même résultat ? Écrivez-moi.` };
  if (/boutique|magasin|pret|vetement|friperie|mode|decoration|concept|librairie|epicerie|caviste|primeur|fleurist|optic|lunet/.test(t))
    return { dit: "Nous venons de recevoir une nouvelle collection.", annonce: `Nouvelle collection arrivée chez ${nom} ✨ Venez la découvrir, je vous dis tout.` };
  return { dit: "J'ai une nouveauté à faire connaître aujourd'hui.", annonce: `Nouveauté cette semaine chez ${nom} ✨ Envie d'en savoir plus ? Écrivez-moi.` };
}

/**
 * ═══ CE QU'ON PEUT ESSAYER CHEZ CE COMMERÇANT, DIT À VOIX HAUTE ═══════════
 *
 * « Les screenshots sont forcément maintenant différents : pour un magasin de
 * vêtements ou une onglerie, ça sera différent que pour un restaurant. »
 *
 * ET C'EST EXACTEMENT LE PIÈGE À NE PAS TOMBER DEDANS : écrire une scène par
 * métier. Il y en aurait treize à maintenir, elles divergeraient au premier
 * changement, et la démonstration finirait par montrer un écran que la page ne
 * contient plus — ce qui est déjà arrivé ici, avec des classes CSS que
 * personne n'avait écrites.
 *
 * ON VA DONC CHERCHER LES MOTS LÀ OÙ ILS SONT DÉJÀ. `fantomes.ts` porte, pour
 * chaque métier, le titre de son essai (« Vos ongles, avant de venir ») et le
 * nom de ce qu'on essaie (« cette pose », « cette coupe »). La voix les dit, et
 * l'écran montré est LA VRAIE SECTION de la page — celle vers laquelle elle
 * fait défiler. Un coiffeur et une onglerie ne racontent donc pas la même
 * chose, et personne n'a eu à écrire deux scènes.
 *
 * TROIS MÉCANIQUES, ET RIEN QUAND IL N'Y EN A AUCUNE. L'essayage (on se voit
 * avec), l'avant-goût (on goûte avant d'y aller), la soirée (on essaie un bout
 * de ce qui s'y passe). Un commerce qui n'a aucune des trois ne se voit pas
 * promettre un écran qu'il n'a pas : l'acte saute, et la démonstration est
 * simplement plus courte.
 */
function direLEssai(carte: CarteAutour): { titre: string; say: string } | null {
  const mur = murDeLaCarte({
    id: carte.id,
    nom: carte.nom,
    metier: carte.metier,
    branche: carte.branche,
    ville: carte.ville,
    distance: carte.distance,
    photo: carte.photo,
    google: carte.google,
    telephone: carte.telephone,
    catalogue: carte.catalogue,
  });
  /* ═══ CHAQUE PHRASE COMPTE, MAINTENANT QU'ON VISE UNE MINUTE ═══════════
     « La démo en sept étapes est encore trop longue, il faut la raccourcir en
     cinq étapes pour qu'elle ne dépasse pas une minute. »
     CINQ ACTES NE SUFFISENT PAS S'ILS SONT LONGS : ce qui tient une minute,
     c'est la somme des répliques, pas leur nombre. Celle-ci nommait la chose
     deux fois — « ce motif » dans le titre, puis « avec ce motif » — et disait
     en dix mots ce que trois disent. */
  const ouvre = "Et voilà ce qu'aucun site ne sait faire.";
  if (mur.essai) {
    const m = mur.essai.mots;
    return {
      titre: m.titre,
      say:
        `${ouvre} ${m.titre} : vos clients se prennent en photo et s'y voient ` +
        `en quelques secondes, avant d'avoir poussé votre porte.`,
    };
  }
  if (mur.gout) {
    return {
      titre: `${mur.gout.plat}, avant d'y aller`,
      say:
        `${ouvre} On goûte votre ${mur.gout.plat.toLowerCase()} avant d'y aller, ` +
        `et l'envie est déjà là.`,
    };
  }
  if (mur.soiree) {
    return {
      titre: mur.soiree.titre,
      say:
        `${ouvre} ${mur.soiree.quand}, on essaie un bout de ce qui se passe chez vous ` +
        `et on dit qu'on vient, sans être sorti de chez soi.`,
    };
  }
  return null;
}

/**
 * CE QUE LA DÉMONSTRATION ANNONCE DU PARCOURS, OU RIEN.
 *
 * L'ÉTAPE DE LA VOIX EST CHERCHÉE, PAS ÉCRITE. Les étapes de `parcoursPromis`
 * portent déjà leur rang ; celle qui prend sa voix est celle qui la demande. Un
 * « 3 » écrit à la main ici deviendrait faux le jour où le parcours gagne un
 * écran — et personne ne le verrait, puisque la phrase resterait plausible.
 *
 * RIEN QUAND AUCUNE ÉTAPE NE PREND SA VOIX : le comptoir, par exemple, remplit
 * ses trois temps sans qu'il parle. Lui promettre sa voix serait promettre un
 * écran qu'il n'aura pas.
 *
 * ET RIEN NON PLUS QUAND LE GESTE RESTE UNE PHOTO — voir l'appel. La phrase
 * dit « et votre parcours se remplit », au sujet de la conversation qu'on vient
 * de montrer ; posée derrière une vitrine photographiée, elle attribuerait à la
 * photo ce que seule la conversation produit. Un boulanger l'entendait ainsi
 * promettre sa voix à l'étape 3 juste après qu'on lui ait dit de photographier
 * sa devanture.
 */
function parcoursDuGeste(carte: CarteAutour): { combien: string; voixA: number } | undefined {
  const p = parcoursPromis({ branche: carte.branche, metier: carte.metier });
  if (!p) return undefined;
  const voix = p.etapes.find((e) => /voix/i.test(e.fournir ?? ""));
  return voix ? { combien: p.combien, voixA: voix.n } : undefined;
}

export function PageBoutique(p: PageBoutiqueProps) {
  const { slug, carte, modeDemo, venuDuDirect, phoneDisplay, keepHref, note, reviewsCount, invente = false } = p;
  const mp = resolveMetier(carte.metier);
  const confirmation = mp.entry?.confirmation ?? "reserve";
  const secteur = mp.entry?.secteur ?? "flux";
  // Commerce (déonto ouverte) : la voix a le droit de montrer les avis et le
  // récit « on vous fait connaître ». Un cabinet de santé ou de droit, non.
  const avisAllowed = mp.def.avis_sollicitation;
  const flash = annonceExemple(carte.metier, carte.nom);
  const geste = modeDemo ? gesteDuJour(carte.metier, confirmation, secteur, carte.ville) : undefined;
  const photos = [carte.photo, ...(carte.photos ?? [])].filter((x): x is string => Boolean(x));

  return (
    <>
      <Boutique
        commerce={carte}
        retourHref={venuDuDirect ? "/autour-de-moi" : null}
        piedMaquette={invente}
        /* LE MÊME DRAPEAU QUE LA VOIX ET LE FORMULAIRE. Il décide d'un bloc
           écrit à la deuxième personne — voir `saPage` dans la boutique. */
        saPage={modeDemo}
      />
      {modeDemo && (
        <DemoTour
          racine=".bq"
          slug={slug}
          nom={carte.nom}
          metierLabel={carte.metier}
          villeAff={carte.ville}
          photos={photos}
          note={note}
          reviewsCount={reviewsCount}
          avisAllowed={avisAllowed}
          isResto={carte.branche === "restaurant"}
          flashExample={flash.annonce}
          flashDit={flash.dit}
          geste={geste}
          essai={direLEssai(carte) ?? undefined}
          /* CE QUE LA CONVERSATION REMPLIT, ET L'ÉTAPE OÙ SA VOIX RESTE.
             Le rang se compte plutôt que de s'écrire : c'est l'étape de la voix
             dans le parcours qu'on vient de lire, et il suffirait d'un écran
             ajouté là-bas pour qu'un « 3 » écrit ici devienne faux. Sans
             parcours — un coiffeur —, la prop est absente et l'acte se termine
             sur la carte, comme avant. Voir `parcours-promis.ts`. */
          parcours={geste && !geste.parPhoto ? parcoursDuGeste(carte) : undefined}
          keepHref={keepHref}
        />
      )}
      {modeDemo && <GarderCeSite slug={slug} phoneDisplay={phoneDisplay} />}
    </>
  );
}
