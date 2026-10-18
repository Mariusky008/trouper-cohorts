/**
 * 🎙️ LA VOIX DU FANTÔME, DÉJÀ ENREGISTRÉE — ce qu'il dit sans rien demander au serveur.
 *
 * « J'aime pas du tout la voix du fantôme interviewer, on dirait qu'il est
 * malade et très métallique. » Ses répliques ont été enregistrées sur
 * ElevenLabs, coupées une à une (`public/direct/interview/fantome/`, et
 * `index.json` pour d'où vient chaque coupe). Les épisodes « Face au
 * fantôme » les jouent ; l'interview du commerçant aussi.
 *
 * LA CLÉ EST LE TEXTE, ramené à une forme simple (apostrophes droites,
 * espaces simples, minuscules) : la même phrase écrite dans le planning ou
 * dans les répliques retrouve son fichier. Une phrase qui n'est pas ici est
 * demandée au serveur, avec la même voix (`api/direct/interview/voix`, dès que
 * son identifiant est réglé) — sinon, le fantôme ne la dit pas : l'écran et la
 * carte l'écrivent.
 *
 * Table tirée de `index.json` ; `scripts/verifier-interview-metiers.mjs`
 * vérifie qu'elle le suit et que chaque fichier existe.
 *
 * FICHIER PARTAGÉ.
 */
export const DOSSIER_VOIX_FANTOME = "/direct/interview/fantome";

/** Une phrase ramenée à sa forme simple, pour la retrouver. */
export const cleDeReplique = (texte: string): string =>
  texte
    .replace(/[’]/g, "'")
    .replace(/[\u202F\u00A0]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const ENREGISTREES: Record<string, string> = {
  "c'est parti, on tourne !": "commun-01-c-est-parti-on-tourne.mp3",
  "pose ton téléphone face à toi. moi, je suis là, à droite ! quand tu réponds, regarde-moi.": "commun-02-pose-ton-telephone-face-a-toi.mp3",
  "pose ton téléphone face à toi. moi, je suis là, à gauche ! quand tu réponds, regarde-moi.": "commun-03-pose-ton-telephone-face-a-toi.mp3",
  "pose ton téléphone, et parle-moi comme à un ami. ton fantôme répondra à ta place !": "commun-04-pose-ton-telephone-et-parle-moi.mp3",
  "dernière question !": "commun-05-derniere-question.mp3",
  "le défi !": "commun-06-le-defi.mp3",
  "question rapide !": "commun-07-question-rapide.mp3",
  "une question d'un client !": "commun-08-une-question-d-un-client.mp3",
  "qu'est-ce que tu fais que personne d'autre ne fait ?": "commun-09-qu-est-ce-que-tu-fais.mp3",
  "montre-moi le geste que tu fais mieux que personne.": "commun-10-montre-moi-le-geste-que-tu.mp3",
  "qu'est-ce que tu dirais à quelqu'un qui n'est jamais venu ?": "commun-11-qu-est-ce-que-tu-dirais.mp3",
  "raconte-moi ta plus belle surprise avec un client.": "commun-12-raconte-moi-ta-plus-belle-surprise.mp3",
  "pourquoi tu fais ce métier ?": "commun-13-pourquoi-tu-fais-ce-metier.mp3",
  "convaincs-moi en dix secondes !": "commun-14-convaincs-moi-en-dix-secondes.mp3",
  "décris-le sans dire son nom !": "commun-15-decris-le-sans-dire-son-nom.mp3",
  "merci ! je m'occupe du montage.": "commun-16-merci-je-m-occupe-du-montage.mp3",
  "alors chef, c'est quoi, le plat du jour ?": "restaurant-01-alors-chef-c-est-quoi-le.mp3",
  "montre-moi le geste qui fait la différence.": "restaurant-02-montre-moi-le-geste-qui-fait.mp3",
  "et c'est quoi, ton secret, pour qu'il soit si bon ?": "restaurant-03-et-c-est-quoi-ton-secret.mp3",
  "avec quoi on le déguste ?": "restaurant-04-avec-quoi-on-le-deguste.mp3",
  "ton plat en trois mots ?": "restaurant-05-ton-plat-en-trois-mots.mp3",
  "sucré ou salé ?": "restaurant-06-sucre-ou-sale.mp3",
  "beurre ou huile d'olive ?": "restaurant-07-beurre-ou-huile-d-olive.mp3",
  "midi ou soir ?": "restaurant-08-midi-ou-soir.mp3",
  "à demain, et bon appétit !": "restaurant-09-a-demain-et-bon-appetit.mp3",
  "alors, c'est quoi, ta pièce du jour ?": "mode-01-alors-c-est-quoi-ta-piece.mp3",
  "montre-moi comment tu la portes !": "mode-02-montre-moi-comment-tu-la-portes.mp3",
  "et tu la porterais avec quoi ?": "mode-03-et-tu-la-porterais-avec-quoi.mp3",
  "à qui elle va le mieux ?": "mode-04-a-qui-elle-va-le-mieux.mp3",
  "ta boutique en trois mots ?": "mode-05-ta-boutique-en-trois-mots.mp3",
  "jean ou robe ?": "mode-06-jean-ou-robe.mp3",
  "baskets ou talons ?": "mode-07-baskets-ou-talons.mp3",
  "noir ou couleur ?": "mode-08-noir-ou-couleur.mp3",
  "à bientôt, en boutique !": "mode-09-a-bientot-en-boutique.mp3",
  "alors, c'est quoi, la coupe du moment ?": "coiffure-01-alors-c-est-quoi-la-coupe.mp3",
  "montre-moi le geste qui change tout.": "coiffure-02-montre-moi-le-geste-qui-change.mp3",
  "et à qui elle va le mieux, cette coupe ?": "coiffure-03-et-a-qui-elle-va-le.mp3",
  "ton astuce pour la garder belle à la maison ?": "coiffure-04-ton-astuce-pour-la-garder-belle.mp3",
  "ton salon en trois mots ?": "coiffure-05-ton-salon-en-trois-mots.mp3",
  "court ou long ?": "coiffure-06-court-ou-long.mp3",
  "brushing ou naturel ?": "coiffure-07-brushing-ou-naturel.mp3",
  "ciseaux ou tondeuse ?": "coiffure-08-ciseaux-ou-tondeuse.mp3",
  "à bientôt, au salon !": "coiffure-09-a-bientot-au-salon.mp3",
  "alors, c'est quoi, la pose du moment ?": "ongles-01-alors-c-est-quoi-la-pose.mp3",
  "montre-moi le geste le plus délicat.": "ongles-02-montre-moi-le-geste-le-plus.mp3",
  "et ton secret, pour qu'elle tienne aussi longtemps ?": "ongles-03-et-ton-secret-pour-qu-elle.mp3",
  "elle va avec quelle tenue ?": "ongles-04-elle-va-avec-quelle-tenue.mp3",
  "ta couleur du moment en trois mots ?": "ongles-05-ta-couleur-du-moment-en-trois.mp3",
  // « Court ou long ? » : la même phrase chez l'onglerie (ongles-06) — une seule clé, celle du salon.
  "nude ou flashy ?": "ongles-07-nude-ou-flashy.mp3",
  "carré ou amande ?": "ongles-08-carre-ou-amande.mp3",
  "à bientôt, à l'onglerie !": "ongles-09-a-bientot-a-l-onglerie.mp3",
  "alors, c'est quoi, la monture du moment ?": "lunettes-01-alors-c-est-quoi-la-monture.mp3",
  "montre-moi comment tu choisis la bonne monture.": "lunettes-02-montre-moi-comment-tu-choisis-la.mp3",
  "et à quel visage elle va le mieux ?": "lunettes-03-et-a-quel-visage-elle-va.mp3",
  "qu'est-ce qui la rend unique ?": "lunettes-04-qu-est-ce-qui-la-rend.mp3",
  "ta monture en trois mots ?": "lunettes-05-ta-monture-en-trois-mots.mp3",
  "ronde ou carrée ?": "lunettes-06-ronde-ou-carree.mp3",
  "écaille ou métal ?": "lunettes-07-ecaille-ou-metal.mp3",
  "discrète ou audacieuse ?": "lunettes-08-discrete-ou-audacieuse.mp3",
  "à bientôt, chez l'opticien !": "lunettes-09-a-bientot-chez-l-opticien.mp3",
  "alors, c'est quoi, le bouquet du jour ?": "fleurs-01-alors-c-est-quoi-le-bouquet.mp3",
  "montre-moi le geste qui fait un beau bouquet.": "fleurs-02-montre-moi-le-geste-qui-fait.mp3",
  "et ton secret, pour qu'il tienne longtemps ?": "fleurs-03-et-ton-secret-pour-qu-il.mp3",
  "il est fait pour quelle occasion ?": "fleurs-04-il-est-fait-pour-quelle-occasion.mp3",
  "ton bouquet en trois mots ?": "fleurs-05-ton-bouquet-en-trois-mots.mp3",
  "roses ou pivoines ?": "fleurs-06-roses-ou-pivoines.mp3",
  "champêtre ou chic ?": "fleurs-07-champetre-ou-chic.mp3",
  "blanc ou couleurs ?": "fleurs-08-blanc-ou-couleurs.mp3",
  "à bientôt, chez le fleuriste !": "fleurs-09-a-bientot-chez-le-fleuriste.mp3",
  "alors, c'est quoi, ta création du moment ?": "atelier-01-alors-c-est-quoi-ta-creation.mp3",
  "montre-moi le geste le plus difficile.": "atelier-02-montre-moi-le-geste-le-plus.mp3",
  "et combien de temps il faut pour la fabriquer ?": "atelier-03-et-combien-de-temps-il-faut.mp3",
  "d'où t'est venue l'idée ?": "atelier-04-d-ou-t-est-venue-l.mp3",
  "ton atelier en trois mots ?": "atelier-05-ton-atelier-en-trois-mots.mp3",
  "pièce unique ou petite série ?": "atelier-06-piece-unique-ou-petite-serie.mp3",
  "matin ou nuit, pour créer ?": "atelier-07-matin-ou-nuit-pour-creer.mp3",
  "musique ou silence ?": "atelier-08-musique-ou-silence.mp3",
  "à bientôt, à l'atelier !": "atelier-09-a-bientot-a-l-atelier.mp3",
  "alors, c'est quoi, le livre que tu conseilles ?": "librairie-01-alors-c-est-quoi-le-livre.mp3",
  "lis-moi la phrase qui t'a donné envie.": "librairie-02-lis-moi-la-phrase-qui-t.mp3",
  "et à qui tu l'offrirais ?": "librairie-03-et-a-qui-tu-l-offrirais.mp3",
  "on le lit où, ce livre ?": "librairie-04-on-le-lit-ou-ce-livre.mp3",
  "ce livre en trois mots ?": "librairie-05-ce-livre-en-trois-mots.mp3",
  "roman ou bd ?": "librairie-06-roman-ou-bd.mp3",
  "papier ou liseuse ?": "librairie-07-papier-ou-liseuse.mp3",
  "plage ou canapé ?": "librairie-08-plage-ou-canape.mp3",
  "à bientôt, et bonne lecture !": "librairie-09-a-bientot-et-bonne-lecture.mp3",
  "alors, qu'est-ce qui se passe ce soir ?": "bar-01-alors-qu-est-ce-qui-se.mp3",
  "montre-moi comment tu le prépares !": "bar-02-montre-moi-comment-tu-le-prepares.mp3",
  "et qu'est-ce que tu nous sers, avec ça ?": "bar-03-et-qu-est-ce-que-tu.mp3",
  "c'est quoi, l'ambiance, ce soir ?": "bar-04-c-est-quoi-l-ambiance-ce.mp3",
  "ta soirée en trois mots ?": "bar-05-ta-soiree-en-trois-mots.mp3",
  "bière ou cocktail ?": "bar-06-biere-ou-cocktail.mp3",
  "dedans ou en terrasse ?": "bar-07-dedans-ou-en-terrasse.mp3",
  "playlist ou concert ?": "bar-08-playlist-ou-concert.mp3",
  "à ce soir, au bar !": "bar-09-a-ce-soir-au-bar.mp3",
};

/** Le fichier enregistré de cette phrase (son adresse), ou `null`. */
export function fichierEnregistre(texte: string): string | null {
  const f = ENREGISTREES[cleDeReplique(texte)];
  return f ? `${DOSSIER_VOIX_FANTOME}/${f}` : null;
}

/** Combien de phrases sont enregistrées (pour l'écran d'essai et la vérification). */
export const NOMBRE_ENREGISTREES = Object.keys(ENREGISTREES).length;
