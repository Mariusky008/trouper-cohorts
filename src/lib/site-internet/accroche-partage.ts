/**
 * 🔗 CE QUE DIT LE LIEN D'UN COMMERÇANT, QUAND ON LE PARTAGE (WhatsApp, SMS…).
 *
 * UNE SEULE QUESTION : « pourquoi un client ferait l'effort de venir sur sa
 * page s'il recevait ce lien ? » L'ancien texte décrivait la page (« ce qu'on
 * peut y essayer, ce qui revient chez eux, et comment y aller ») ; il ne
 * donnait aucune raison de l'ouvrir. Celui-ci dit ce que le client y gagne
 * AVANT DE SE DÉPLACER — voir la pièce portée, la coupe sur soi, le plat du
 * jour — et ce qui l'attend ensuite (mis de côté, sa table, son rendez-vous).
 *
 * RIEN QUE LA PAGE NE FASSE PAS : chaque promesse est un geste de la page de
 * ce métier (l'essai sur photo, la mise de côté, la demande de table ou de
 * rendez-vous en un message).
 *
 * COURT, POUR UN APERÇU DE TÉLÉPHONE : le titre tient sur une ligne ou deux,
 * la phrase sous les 130 signes que WhatsApp affiche sans la couper.
 */
import type { CleMetier } from "@/lib/direct/apercu-habitant";

/** « de Lili Ross » mais « d’Atelier Mona » : l'élision devant une voyelle. */
const de = (nom: string) => (/^[aeiouyàâäéèêëîïôöûüœ]/i.test(nom) ? `d’${nom}` : `de ${nom}`);

type Accroche = { titre: (nom: string) => string; phrase: (a: string) => string };

/** `a` : « à Vevey », précédé d'une espace — ou rien, si l'on ne connaît pas la ville. La
 *  ville seulement là où elle se dit bien (« on vous le met de côté à Vevey ») : l'image
 *  du lien la montre déjà, et « le fauteuil à Vevey » sonnait faux. */
const ACCROCHES: Record<CleMetier, Accroche> = {
  mode: {
    titre: (nom) => `Essayez les pièces ${de(nom)} sur vous`,
    phrase: (a) => `Une photo de vous suffit pour voir chaque pièce portée, avant de vous déplacer. Un coup de cœur ? On vous le met de côté${a}.`,
  },
  coiffeur: {
    titre: (nom) => `Votre prochaine coupe chez ${nom}, sur vous`,
    phrase: () => `Voyez-vous avec la coupe avant de vous asseoir dans le fauteuil : vous savez exactement ce que vous demandez.`,
  },
  ongles: {
    titre: (nom) => `Votre prochaine pose chez ${nom}, sur vos mains`,
    phrase: () => `Essayez couleurs et poses sur une photo de votre main, et arrivez au rendez-vous en sachant ce que vous voulez.`,
  },
  lunetier: {
    titre: (nom) => `Essayez les lunettes ${de(nom)} sur votre visage`,
    phrase: (a) => `Une photo de vous suffit pour voir chaque monture portée : vous ne passez en boutique${a} que pour celles qui vous vont.`,
  },
  restaurant: {
    titre: (nom) => `Ce qu’on mange aujourd’hui chez ${nom}`,
    phrase: () => `Voyez la carte et le plat du jour avant de vous déplacer, et réservez votre table en un message.`,
  },
  bar: {
    titre: (nom) => `Ce soir chez ${nom}`,
    phrase: () => `Voyez l’ambiance et ce qu’on sert ce soir avant de sortir, et faites garder votre table en un message.`,
  },
  fleuriste: {
    titre: (nom) => `Voyez les bouquets ${de(nom)} chez vous`,
    phrase: (a) => `Une photo de votre intérieur suffit pour voir le bouquet posé chez vous, avant de l’offrir. Celui qui vous plaît vous attend${a}.`,
  },
  librairie: {
    titre: (nom) => `Votre prochain livre vous attend chez ${nom}`,
    phrase: (a) => `Les coups de cœur du libraire et un conseil rien que pour vous. Le livre qui vous tente vous attend${a}, mis de côté.`,
  },
  artisan: {
    titre: (nom) => `Découvrez les créations ${de(nom)}`,
    phrase: (a) => `Voyez ce qui sort de l’atelier avant de vous déplacer : la pièce qui vous plaît vous attend${a}, mise de côté.`,
  },
};

export function accrocheDuPartage(branche: CleMetier, nom: string, ville: string): { title: string; description: string } {
  const a = ACCROCHES[branche] ?? ACCROCHES.artisan;
  return { title: a.titre(nom), description: a.phrase(ville ? ` à ${ville}` : "") };
}
