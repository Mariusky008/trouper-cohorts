// PRÉVENIR LE COMMERÇANT — le dernier centimètre, et celui où tout se perdait.
//
// LE DÉFAUT, RELEVÉ À L'ESSAI ET IL EST GRAVE. « Quand je clique sur je prends
// il faut que ça ouvre WhatsApp pour confirmer que je passe avant la fermeture,
// autrement le boulanger ne le saura jamais parce qu'il ne regardera pas son
// espace admin. » C'est exact, et ça ne concerne pas que ce bouton-là : « je
// réserve », « je viens », un collectif qui atteint son seuil — tout écrit
// aujourd'hui dans un salon que le commerçant ne lit pas. Le mécanisme est
// juste sur toute sa longueur et se casse au dernier centimètre.
//
// POURQUOI WHATSAPP ET PAS AUTRE CHOSE. C'est le seul canal dont on soit sûr
// qu'un commerçant français le lit dans la journée : il l'a déjà, il l'a sur
// lui, il l'entend. Rien à installer, aucun compte à créer, aucune permission à
// accorder, et zéro coût — un simple lien `wa.me`, sans API ni compte business.
//
// LE PIÈGE, ET C'EST LE SEUL ENDROIT DU PRODUIT OÙ L'ON PEUT MENTIR. `wa.me`
// OUVRE WhatsApp, il n'ENVOIE pas : c'est encore au client d'appuyer sur
// « envoyer ». Si notre écran annonce « c'est réservé » avant ça, on lui fait
// croire que c'est fait, et les croissants sont toujours là à la fermeture —
// le défaut qu'on voulait corriger, en pire, parce que cette fois il y croit.
// D'où la règle : RIEN N'EST ENREGISTRÉ TANT QU'IL N'A PAS DIT « je l'ai
// prévenu ». Voir `.ap-prev` dans l'écran.
//
// L'APPEL EST À CÔTÉ, ET PAS EN PETIT. Un boulanger décroche. Une partie des
// gens n'écrira jamais un message à un commerçant et appellera sans hésiter ;
// leur imposer WhatsApp les ferait renoncer.
//
// CE QUI ARRIVERA À L'ÉCHELLE, ET IL FAUT LE SAVOIR : à trois messages par jour
// c'est parfait, à quarante il ne suit plus. C'est le bon problème à avoir, et
// ce jour-là il paie pour un vrai canal ou pour le boîtier du comptoir. On
// construit le premier jour, pas le trois-centième.

/**
 * LES NUMÉROS DE LA MAQUETTE SONT DES NUMÉROS DE FICTION, ET C'EST UNE RÈGLE
 * DE SÉCURITÉ, PAS UNE COMMODITÉ.
 *
 * Les commerces d'ici sont inventés. Un numéro inventé au hasard existe
 * vraiment chez quelqu'un : à la première démonstration, un inconnu reçoit
 * « je prends les 2 croissants ». La plage 06 39 98 00 00 – 06 39 98 99 99 est
 * réservée par l'ARCEP à la fiction et n'est attribuée à personne — c'est celle
 * qu'utilisent le cinéma et la télévision pour la même raison.
 *
 * C'est la même règle que pour les photos et les noms de domaine :
 * voir `public/direct/LISEZ-MOI.md`. Le vrai produit portera le numéro déclaré
 * par le commerçant lui-même, et ce champ existe déjà (`telephone`).
 */
export function numeroDeFiction(id: string): string {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) % 10000;
  const q = String(n).padStart(4, "0");
  return `06 39 98 ${q.slice(0, 2)} ${q.slice(2)}`;
}

/** « 06 39 98 12 34 » → « 33639981234 », la seule forme que wa.me accepte. */
function international(tel: string): string {
  const chiffres = tel.replace(/\D/g, "");
  if (chiffres.startsWith("33")) return chiffres;
  if (chiffres.startsWith("0")) return `33${chiffres.slice(1)}`;
  return chiffres;
}

export type CommentPrevenir = {
  /** Le lien qui ouvre WhatsApp avec le message déjà écrit. */
  whatsapp: string;
  /** Le lien qui compose le numéro. */
  appel: string;
  /** Le message, montré à l'écran AVANT d'ouvrir WhatsApp — voir plus bas. */
  texte: string;
};

/**
 * CE QUE LE MESSAGE DIT, ET POURQUOI IL EST SI COURT.
 *
 * Il est écrit à la première personne et signé d'un prénom, parce qu'il arrive
 * chez quelqu'un qui va le lire entre deux clients : « quelqu'un a réservé via
 * la plateforme ClikMe » se lit comme un message automatique et se traite comme
 * tel — c'est-à-dire plus tard. « Bonjour, je prends les 2 croissants » est un
 * voisin qui parle.
 *
 * IL NOMME CLIKME UNE FOIS ET UNE SEULE. Assez pour que le commerçant sache
 * d'où ça vient — c'est la seule preuve qu'il aura que l'application lui amène
 * des gens — et pas assez pour que le message ressemble à de la publicité.
 *
 * ET IL EST MONTRÉ À L'ÉCRAN AVANT D'OUVRIR WHATSAPP. On envoie un message au
 * nom de quelqu'un : il doit l'avoir lu avant, sans avoir à changer
 * d'application pour le découvrir.
 */
export function commentPrevenir(a: {
  telephone: string;
  quoi: string;
  prenom?: string;
  /** « Je passe avant la fermeture », « Je serai là à 12 h 30 »… */
  quand?: string;
}): CommentPrevenir {
  const signature = a.prenom ? ` — ${a.prenom}` : "";
  const texte =
    `Bonjour, je prends ${a.quoi} (vu sur ClikMe). ` +
    `${a.quand ?? "Je passe avant la fermeture"}.${signature}`;
  const num = international(a.telephone);
  return {
    whatsapp: `https://wa.me/${num}?text=${encodeURIComponent(texte)}`,
    appel: `tel:+${num}`,
    texte,
  };
}
