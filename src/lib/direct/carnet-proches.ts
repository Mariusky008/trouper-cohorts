/**
 * 👯 LE CARNET DE MES PROCHES, ET 👥 INVITER SUR CETTE VIDÉO (`docs/univers/ma-maison.md`, section 25) — les textes.
 *
 * Le propriétaire, le 21 novembre 2026 : « lorsqu'on est dans "Ma télé du jour" […] et qu'on veut inviter quelqu'un,
 * alors au lieu d'avoir directement la liste de nos amis ou une possibilité d'envoyer une invitation via WhatsApp pour
 * nous rejoindre sur cette vidéo, on est sorti de la page pour se retrouver sur mon salon […] c'est très compliqué.
 * Aussi pour ajouter quelqu'un à mes proches il faudrait que je puisse le faire de ma maison aussi et pas que de la
 * messagerie, et que j'aie donc un carnet d'adresses dans "ma maison". »
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */

export const PHRASES_CARNET = {
  bouton: "Mes proches",
  titre: "👯 Mes proches",
  chapo: "Ceux qui entrent chez toi, et avec qui tu regardes tes vidéos.",
  la: "Là maintenant",
  maison: (prenom: string) => `🏠 La maison de ${prenom}`,
  parler: (prenom: string) => `💬 Ta conversation avec ${prenom}`,
  ontAjoute: "Ils t’ont ajouté",
  ajouterAussi: "＋ L’ajouter aussi",
  enAttente: "En attente",
  doitAjouter: (prenom: string) => `${prenom} doit t’ajouter aussi`,
  aucun: "Pas encore de proches : envoie ton lien à ceux que tu aimes.",
  ajouter: "＋ Ajouter un proche",
  ajouterDit: "Envoie-lui ton lien : il t’ajoute, tu l’ajoutes, et vous êtes proches.",
  whatsapp: "📲 Par WhatsApp",
  copier: "🔗 Copier mon lien",
  copie: "✓ Lien copié",
  texteLien: "Ajoute-moi sur ClikMe : nos figurines pourront se parler, et on regardera des vidéos ensemble 🎬",
  qui: "👀 Comme la voient tes proches",
  quiDit: "Qui peut entrer chez moi ?",
  // 👥 inviter sur cette vidéo (ma télé du jour)
  inviterTitre: "👥 Regarder avec…",
  inviterChapo: (titre: string) => `« ${titre} » : tes proches sont invités devant ta télé, à la seconde où tu en es.`,
  inviter: (n: number) => (n ? `🎬 Inviter (${n})` : "🎬 Inviter"),
  auPlus: (n: number) => `${n} proches au plus.`,
  invites: (prenoms: string[]) => `✓ Invitation envoyée à ${prenoms.length > 1 ? `${prenoms.slice(0, -1).join(", ")} et ${prenoms[prenoms.length - 1]}` : prenoms[0]}`,
  attendre: "📺 Les attendre devant ma télé",
  allerDevant: "📺 Aller devant ma télé",
  direWhatsapp: "📲 Leur dire par WhatsApp",
  texteSeance: (titre: string) => `🎬 Je t’invite à regarder « ${titre} » avec moi sur ClikMe : viens t’asseoir devant ma télé 👉`,
  continuer: "Continuer ici",
  pasEncore: "Quelqu’un qui n’est pas encore tes proches ?",
  pasEncoreLien: "📲 Envoie-lui ton lien par WhatsApp",
  sansProches: "Pas encore de proches pour regarder avec toi : envoie ton lien à quelqu’un.",
} as const;

/** Mon lien (celui qui l'ouvre peut m'ajouter) : `/collection?proche=<clé>#proches`. */
export const lienDeProche = (origine: string, cle: string) => `${origine}/collection?proche=${encodeURIComponent(cle)}#proches`;
/** Ma séance (mes proches invités y entrent) : `/univers/salons?chez=<clé>`. */
export const lienDeSeance = (origine: string, cle: string) => `${origine}/univers/salons?chez=${encodeURIComponent(cle)}`;
/** Un message tout prêt dans WhatsApp (sans destinataire : on le choisit dans WhatsApp). */
export const lienWhatsApp = (texte: string, url: string) => `https://wa.me/?text=${encodeURIComponent(`${texte} ${url}`)}`;
