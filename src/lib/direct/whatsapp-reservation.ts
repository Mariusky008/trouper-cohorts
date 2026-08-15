// PRÉVENIR LE COMMERÇANT — par le WhatsApp du client.
//
// LE PROBLÈME QUE ÇA RÈGLE, et il était double :
//
//   1. Le commerçant rate l'info et donne la place à quelqu'un passé en
//      boutique. Aucune notification ne pouvait lui arriver sans qu'il ait
//      l'application ouverte — et un coiffeur a des ciseaux dans les mains.
//   2. Le client réserve et ne vient pas, parce qu'appuyer sur un bouton
//      n'engage personne.
//
// LE MESSAGE PART DU TÉLÉPHONE DU CLIENT, et c'est tout l'intérêt :
//
//   • ÇA ARRIVE. WhatsApp est déjà installé et notifié chez le commerçant. Il
//     n'a rien à ouvrir, rien à rafraîchir, aucun matériel à maintenir allumé.
//   • ÇA NE COÛTE RIEN. Un lien `wa.me`, pas d'API Business, pas de compte, pas
//     de message facturé.
//   • ÇA DONNE LE NUMÉRO DU CLIENT sans le lui demander. La contrainte vient du
//     canal, pas d'un formulaire — et un formulaire avant le geste aurait coûté
//     des réservations pour le même résultat.
//   • ÇA ENGAGE. On a écrit à quelqu'un, avec son nom affiché. Ce n'est plus un
//     bouton anonyme.
//   • ET C'EST LE COMMERÇANT QUI ACCORDE. Il répond « c'est noté » ou « désolé,
//     c'est parti ». Plus rien n'est bloqué à son insu.
//
// CE QU'ON NE SAIT PAS, ET QU'IL FAUT DIRE. On sait que le client a appuyé sur
// le bouton ; on ne sait pas s'il a envoyé le message. L'écran ne peut donc plus
// écrire « c'est confirmé » — il écrit « demande envoyée », et la réponse du
// commerçant fait foi. C'est plus honnête que ce qu'on affichait avant.
import { toWaDigits } from "@/lib/site-internet/phone";

const str = (v: unknown) => String(v ?? "").trim();

export type Reservation = {
  /** Le commerce, tel que le client le nomme. */
  commerce: string;
  /** Le nom de la façon : « L'express », « Table à partager ». */
  facon: string;
  type: string;
  /** Le titre de l'annonce. */
  titre: string;
  /** Le code, qui sert de référence commune aux deux côtés. */
  code: string;
  /** L'heure limite, déjà mise en forme (« avant 19 h 30 »). Facultative. */
  quand: string;
  /** L'avantage obtenu, pour un cadeau. */
  gain: string;
  /** Où en est le groupe, pour un collectif : `{ participants, objectif }`. */
  groupe: { participants: number; objectif: number } | null;
  /** Le prénom laissé par le client, s'il en a laissé un. */
  prenom: string;
};

/**
 * Le message que le client enverra.
 *
 * TOUT EST DEDANS : le code, la façon, l'annonce, l'heure. Le commerçant doit
 * pouvoir tout comprendre SANS ouvrir Clikme — c'est la condition pour que ça
 * marche un jour de coup de feu. Le lien vers l'application n'y est pas : il
 * ferait exactement le contraire.
 *
 * Écrit à la PREMIÈRE PERSONNE, parce que c'est le client qui l'envoie. Un
 * message rédigé comme une notification automatique (« Une réservation a été
 * effectuée ») annulerait tout le bénéfice : ce qui engage, c'est d'avoir écrit
 * à quelqu'un.
 */
export function messageReservation(r: Reservation): string {
  const qui = r.prenom ? `${r.prenom}` : "";
  const lignes: string[] = [];

  lignes.push(`Bonjour${r.commerce ? ` ${r.commerce}` : ""} !`);

  // Le collectif se raconte autrement : ce qui compte, c'est où en est le
  // groupe — et le dernier arrivé annonce qu'il est complet.
  if (r.type === "collectif" && r.groupe) {
    const { participants, objectif } = r.groupe;
    lignes.push(
      participants >= objectif
        ? `Je rejoins « ${r.facon} »${r.titre ? ` — ${r.titre}` : ""}. Le groupe est COMPLET : nous sommes ${objectif}.`
        : `Je rejoins « ${r.facon} »${r.titre ? ` — ${r.titre}` : ""}. Nous sommes ${participants} sur ${objectif}.`
    );
  } else {
    lignes.push(`Je réserve « ${r.facon} »${r.titre ? ` — ${r.titre}` : ""}.`);
  }

  if (r.gain) lignes.push(`Avantage : ${r.gain}.`);
  if (r.quand) lignes.push(`Je viens ${r.quand}.`);
  if (r.code) lignes.push(`Mon code : ${r.code}`);
  if (qui) lignes.push(`— ${qui}`);
  lignes.push("(envoyé depuis Le Direct)");

  return lignes.join("\n");
}

/**
 * Le lien qui ouvre WhatsApp avec le message prêt.
 *
 * Chaîne vide si on n'a pas de numéro : l'écran n'affiche alors pas le bouton
 * plutôt que d'ouvrir WhatsApp sur le vide.
 */
export function lienWhatsapp(telephone: string, message: string): string {
  const digits = toWaDigits(str(telephone));
  if (!digits) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
