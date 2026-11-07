/**
 * 🔥 LE MÈME DU JOUR, AU CENTRE — 7 novembre 2026 (le lot 2 : « une raison de revenir chaque jour : une même phrase pour
 * tout le monde chaque matin (“Ton excuse pour être en retard”). Tu postes ta réponse, puis tu vois celles des autres,
 * avec de vrais chiffres seulement : “128 réponses à Dax” »).
 *
 * Chaque jour (heure de Paris), le même thème pour tout le monde — tous différents pendant six semaines, puis on
 * recommence. Il ouvre « Créer » (y répondre) et « Découvrir » (les réponses de sa ville). Poster sa réponse la rend
 * visible par les gens de sa ville : c'est écrit sur le bouton (sa décision : l'accord, c'est ce geste). On ne voit les
 * réponses des autres qu'après avoir posté la sienne. Les chiffres sont vrais ; en dessous de `SEUIL_REPONSES`, « Sois
 * parmi les premiers à répondre ».
 *
 * TROIS IDÉES DE RÉPONSE PAR THÈME (la page blanche, jamais) : à la première personne, sans accord au masculin ou au
 * féminin pour celui qui parle, rien d'alcoolisé, rien sur le corps, l'âge ou l'argent ; aucune personne réelle.
 *
 * FICHIER PARTAGÉ (navigateur et serveur).
 */
export type Theme = { cle: string; emoji: string; titre: string; idees: [string, string, string] };

export const THEMES: Theme[] = [
  { cle: "retard", emoji: "🏃", titre: "Ton excuse pour être en retard", idees: ["Je ne suis pas en retard : j’ai pris le chemin le plus joli.", "Mon réveil et moi, on est en froid depuis ce matin.", "J’ai croisé un chien. Il fallait bien lui dire bonjour."] },
  { cle: "lundi", emoji: "☕", titre: "Toi, le lundi matin", idees: ["Le lundi, je fonctionne en mode avion.", "Mon cerveau est encore en week-end. Il rentre mardi.", "Café d’abord. Les humains ensuite."] },
  { cle: "pouvoir", emoji: "🦸", titre: "Ton super-pouvoir inutile", idees: ["Je sais toujours où est la télécommande. Sauf quand je la cherche.", "Je trouve une place pour me garer… quand je suis à pied.", "Je devine la fin des films. Personne ne veut regarder un film avec moi."] },
  { cle: "plat", emoji: "🍕", titre: "Ton plat préféré, en une phrase", idees: ["La pizza, c’est un cercle de bonheur.", "Les pâtes, c’est la réponse. Peu importe la question.", "Le chocolat n’est pas un plat ? Dommage, c’est le mien."] },
  { cle: "dimanche", emoji: "🛋️", titre: "Ton dimanche idéal", idees: ["Un plaid, un film, et zéro notification.", "Dormir jusqu’à midi, puis faire une sieste. L’équilibre.", "Une balade, un goûter, et retour au canapé."] },
  { cle: "aveu", emoji: "🤫", titre: "Ce que tu n’avoues jamais", idees: ["Je parle à mes plantes. Et elles m’écoutent.", "Je chante sous la douche. Faux. Et fort.", "Je relis mes messages avant de les envoyer… dix fois."] },
  { cle: "deux-heures", emoji: "📱", titre: "Ton message de 2 h du matin", idees: ["« Tu dors ? » La réponse était oui.", "« Idée géniale : on ouvre un camion à crêpes ! » Non.", "« J’ai faim. » Toujours."] },
  { cle: "victoire", emoji: "🏆", titre: "Ta plus grande victoire de la semaine", idees: ["J’ai plié le linge le jour même. Historique.", "J’ai répondu à tous mes messages. Presque.", "J’ai fini une série en un week-end. Record."] },
  { cle: "zombie", emoji: "🧟", titre: "Toi, en mode zombie", idees: ["Pas avant mon café. Ni après, en fait.", "Je marche, mais personne n’est aux commandes.", "Parle-moi doucement, j’ai les yeux encore fermés."] },
  { cle: "pluie", emoji: "🌧️", titre: "Ta réaction quand il pleut", idees: ["Plan du jour : canapé. Plan B : canapé.", "Je n’ai pas de parapluie, j’ai du style.", "Il pleut ? Parfait, j’avais justement prévu de ne rien faire."] },
  { cle: "courses", emoji: "🛒", titre: "Toi au supermarché", idees: ["Je viens pour du pain, je repars avec un ananas et une plante.", "Je fais toujours la file qui n’avance pas.", "Ma liste de courses ? Dans ma tête. Enfin, une partie."] },
  { cle: "sport", emoji: "💤", titre: "Ton excuse pour ne pas faire de sport", idees: ["Je m’échauffe. Depuis trois ans.", "Mon canapé a besoin de moi.", "Je fais du sport mental : j’y pense très fort."] },
  { cle: "entree", emoji: "🎉", titre: "Ton entrée dans une fête", idees: ["J’arrive en dansant. Personne ne sait pourquoi.", "Je cherche d’abord où est le buffet.", "Je salue tout le monde. Même ceux que je ne connais pas."] },
  { cle: "photo", emoji: "📸", titre: "Toi sur les photos de groupe", idees: ["Je cligne des yeux. À chaque fois. C’est un talent.", "Je suis la personne coupée sur le bord.", "Je souris trop tôt, puis plus du tout."] },
  { cle: "rangement", emoji: "🧹", titre: "Ta technique de rangement", idees: ["Je ne range pas, j’organise le chaos.", "Tout dans le placard, et on ferme vite.", "Je range quand quelqu’un vient. Donc jamais."] },
  { cle: "tentation", emoji: "🍫", titre: "Ta pire tentation", idees: ["Le dernier carré de chocolat. Il m’appelle.", "Un épisode de plus. Juste un.", "Le bouton « ajouter au panier »."] },
  { cle: "animal", emoji: "🐶", titre: "Si tu étais un animal", idees: ["Un chat : je dors, je mange, je juge.", "Un paresseux, mais avec du charme.", "Un dauphin : sociable, et je fais des bulles."] },
  { cle: "voyage", emoji: "✈️", titre: "Ton prochain voyage, en une phrase", idees: ["Destination : mon lit. Escale : le frigo.", "Une île, un hamac, et pas de réseau.", "N’importe où, tant qu’il y a des crêpes."] },
  { cle: "chanson", emoji: "🎵", titre: "La chanson qui te met de bonne humeur", idees: ["Celle que je chante faux dans la voiture.", "Une chanson des années 80, à fond, fenêtres ouvertes.", "Le générique d’un dessin animé. Je l’assume."] },
  { cle: "dormir", emoji: "😴", titre: "Toi, la nuit", idees: ["En étoile de mer. Toute la place est à moi.", "En boule, comme un croissant.", "Devant un film. À chaque fois."] },
  { cle: "cuisine", emoji: "🍳", titre: "Toi en cuisine", idees: ["Je suis la recette… jusqu’à la deuxième ligne.", "Mon plat signature : les pâtes. Ma spécialité : l’eau chaude.", "Je cuisine avec amour. Et le détecteur de fumée."] },
  { cle: "compliment", emoji: "💌", titre: "Ton plus beau compliment", idees: ["Tu es une personne en or. Voilà, c’est dit.", "Avec toi, même le lundi est sympa.", "Tu as un rire contagieux. Attention, je l’ai attrapé."] },
  { cle: "demain", emoji: "🔮", titre: "Ta prédiction pour demain", idees: ["Demain, je serai à l’heure. Peut-être.", "Demain, il fera beau. Dans mon cœur, en tout cas.", "Demain, je range. Promis. Enfin…"] },
  { cle: "trois-heures", emoji: "🧠", titre: "Ta pensée de 3 h du matin", idees: ["Si je rêve que je dors, je me repose deux fois ?", "Les poissons ont-ils soif ?", "Pourquoi on appuie plus fort sur la télécommande quand les piles sont vides ?"] },
  { cle: "vacances", emoji: "🏖️", titre: "Toi en vacances", idees: ["Jour 1 : je me repose. Jour 2 : je me repose encore.", "Je prends trois cents photos du même coucher de soleil.", "Je pars avec trois livres. Je reviens sans en avoir ouvert un."] },
  { cle: "gaffe", emoji: "🙈", titre: "Ta plus belle gaffe", idees: ["J’ai fait coucou à quelqu’un qui saluait la personne derrière moi.", "J’ai répondu « vous aussi » à « bon voyage »… je ne partais pas.", "J’ai poussé une porte marquée « tirer ». Trois fois."] },
  { cle: "talent", emoji: "🦄", titre: "Ton talent caché", idees: ["Je reconnais une chanson en deux notes.", "Je sais faire semblant d’avoir compris. Très bien.", "Je trouve toujours la dernière part de gâteau."] },
  { cle: "film", emoji: "🎬", titre: "Si ta vie était un film", idees: ["Une comédie. Avec beaucoup de scènes coupées.", "Un film d’action, mais au ralenti.", "Une série, avec trop de saisons."] },
  { cle: "petit-dej", emoji: "🥐", titre: "Ton petit-déjeuner de rêve", idees: ["Croissant, chocolat chaud, et personne qui me parle.", "Des crêpes. Beaucoup de crêpes.", "Un café, et cinq minutes de silence."] },
  { cle: "perdre", emoji: "🎮", titre: "Toi quand tu perds à un jeu", idees: ["Je n’ai pas perdu, j’ai laissé gagner.", "Revanche. Tout de suite.", "C’était truqué. Évidemment."] },
  { cle: "vendredi", emoji: "📅", titre: "Ton vendredi soir", idees: ["Pyjama à 19 h. Fierté à 19 h 01.", "Pizza, film, et je m’endors au début.", "Je danse dans le salon. Personne ne doit savoir."] },
  { cle: "oubli", emoji: "🧳", titre: "Ce que tu oublies toujours", idees: ["Mes clés. Ou mes clés. Surtout mes clés.", "Le prénom des gens, deux secondes après.", "Pourquoi je viens d’ouvrir le frigo."] },
  { cle: "meteo", emoji: "🌞", titre: "Ta météo intérieure aujourd’hui", idees: ["Grand soleil, avec quelques rires dispersés.", "Brouillard jusqu’au premier café.", "Avis de tempête de bonne humeur."] },
  { cle: "horreur", emoji: "🍿", titre: "Toi devant un film d’horreur", idees: ["Je regarde. À travers mes doigts.", "Je commente tout pour ne pas avoir peur.", "Je m’endors. Le monstre est vexé."] },
  { cle: "reveil", emoji: "⏰", titre: "Ta réaction quand le réveil sonne", idees: ["Encore cinq minutes. Puis cinq autres.", "Je négocie avec mon réveil. Il gagne toujours.", "Je fais semblant de ne pas l’entendre. Lui aussi."] },
  { cle: "recompense", emoji: "🧁", titre: "Ta récompense après une longue journée", idees: ["Un goûter. Même à 20 h.", "Le canapé, et personne ne me demande rien.", "Un bain, une série, et silence radio."] },
  { cle: "idee", emoji: "💡", titre: "Ta meilleure idée de la semaine", idees: ["Mettre mes chaussettes par paires. Révolutionnaire.", "Faire une sieste avant la fatigue. Prévention.", "Commander à manger plutôt que cuisiner. Génie."] },
  { cle: "courage", emoji: "💪", titre: "Ton mot d’encouragement", idees: ["Tu vas tout déchirer. Moi, je fais les encouragements.", "Courage ! Et s’il le faut, je t’apporte un gâteau.", "Tu as tout ce qu’il faut. Et moi, j’ai les gâteaux."] },
  { cle: "presse", emoji: "🐌", titre: "Toi, quand ça presse", idees: ["Je cours partout, et j’oublie pourquoi.", "J’accélère… puis je m’arrête pour discuter.", "Je fais trois choses à la fois. Mal."] },
  { cle: "anniversaire", emoji: "🎂", titre: "Ton anniversaire idéal", idees: ["Un gâteau énorme, et des gens que j’aime autour.", "Une surprise. Mais je veux savoir laquelle avant.", "Une sieste, puis une fête. Dans cet ordre."] },
  { cle: "coucher", emoji: "🌙", titre: "Ta dernière pensée avant de dormir", idees: ["Demain, je me couche plus tôt. Promis.", "Et si je mangeais un petit truc ?", "J’aurais dû répondre autre chose, ce matin."] },
  { cle: "superheros", emoji: "🦹", titre: "Ton nom de super-héros", idees: ["Capitaine Sieste. Je sauve le monde après 14 h.", "L’Ombre du frigo. Je frappe la nuit.", "Turbo-Retard. Toujours là, mais plus tard."] },
];

/** Le seuil des chiffres : en dessous, « Sois parmi les premiers à répondre » (jamais un chiffre gonflé). */
export const SEUIL_REPONSES = 5;

/** « 2026-11-07 » (heure de Paris). */
export const jourParis = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

/** Le thème du jour : le même pour tout le monde ; tous différents pendant six semaines, puis on recommence. */
export function themeDuJour(jour = jourParis()): Theme {
  const n = Math.floor(new Date(`${jour.slice(0, 10)}T12:00:00Z`).getTime() / 86_400_000);
  return THEMES[((n % THEMES.length) + THEMES.length) % THEMES.length];
}

/** « dax » → « Dax », « mont-de-marsan » → « Mont-De-Marsan » (pour le bouton et les chiffres). */
export const nomVille = (slug: string) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
    .join("-");

/** Ce que l'écran reçoit : le thème, combien de réponses dans sa ville, s'il a répondu (et sa réponse). */
export type EtatDuJour = { jour: string; theme: Theme; ville: string; n: number; repondu: boolean; moi?: string };
