// QUAND LA TRANSCRIPTION NE FAIT QUE RECRACHER CE QU'ON LUI A SOUFFLÉ.
//
// ─── LE DÉFAUT, ET IL EST SPECTACULAIRE ───────────────────────────────────
//
// Sur la capture d'écran d'une démonstration, la bulle verte du commerçant —
// celle qui porte SA phrase — contenait ceci :
//
//   « Commerce de proximité à Dax. Le commerçant décrit sa journée : plat du
//     jour, arrivage, créneaux libres, prix en euros, nombre de portions ou de
//     pièces. »
//
// C'est le texte de contexte qu'on envoie au service de transcription pour
// l'aider sur les mots rares, recopié à l'identique. Léa y a répondu poliment,
// deux fois, en essayant de comprendre ce qu'on lui voulait. Le commerçant, lui,
// voyait une assistante qui ne l'entendait pas et qui parlait toute seule.
//
// ─── POURQUOI ÇA ARRIVE, ET POURQUOI ON GARDE LE CONTEXTE ─────────────────
//
// C'est un comportement connu de ces modèles : le contexte oriente la
// transcription, et sur un enregistrement MUET il n'y a rien à transcrire —
// alors il rend ce qu'on lui a donné. Le contexte reste, parce qu'il fait
// vraiment gagner sur « magret », « garbure », « brushing ». Ce qui change,
// c'est qu'on ne laisse plus jamais son écho repartir comme une parole.
//
// ─── ET LE SEUIL EST LÀ POUR UNE RAISON PRÉCISE ───────────────────────────
//
// Le risque symétrique serait pire : rejeter une vraie phrase parce qu'elle
// parle de portions et de prix — ce qui est exactement le métier. On ne compare
// donc pas des mots isolés mais la PROPORTION, et seulement sur des phrases
// assez longues pour que la proportion veuille dire quelque chose. « Vingt-cinq
// portions à quatorze euros » passe ; « créneaux libres, prix en euros, nombre
// de portions ou de pièces » ne passe pas.

const normaliser = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Vrai si `texte` n'est que l'écho de `contexte` — donc rien de dit. */
export function estUnEcho(texte: string, contexte: string): boolean {
  const t = normaliser(texte);
  if (!t) return true;
  const c = normaliser(contexte);
  // L'écho complet, dans un sens ou dans l'autre : le modèle en rend parfois un
  // fragment, parfois le tout, parfois le tout suivi d'un point de plus.
  if (c.includes(t) || t.includes(c)) return true;
  const mots = t.split(" ").filter((w) => w.length > 3);
  // Sous quatre mots longs, la proportion ne prouve rien : « il en reste six »
  // n'a rien à voir avec le contexte même si tous ses mots s'y trouvaient.
  if (mots.length < 4) return false;
  const dansLeContexte = mots.filter((w) => c.includes(w)).length;
  return dansLeContexte / mots.length > 0.75;
}
