// ⚔️ L'ARBITRE — CE QU'ON DEMANDE AU MODÈLE, ET COMMENT ON L'ENCADRE.
//
// ─── POURQUOI CE FICHIER EST À PART DE LA ROUTE ────────────────────────────
//
// Parce que c'est LE produit. La route n'est qu'un tuyau — elle prend un
// corps, appelle une API, rend du JSON. Ce qui décide si Battle vaut quelque
// chose tient dans les deux constantes ci-dessous : la consigne, et la forme
// imposée à la réponse. Elles doivent se lire et se discuter sans avoir à
// traverser de la plomberie.
//
// ─── LE PROBLÈME QU'ELLES RÉSOLVENT ────────────────────────────────────────
//
// UN MODÈLE À QUI L'ON DEMANDE « QUI A GAGNÉ ? » RÉPOND TOUJOURS, ET C'EST LE
// DANGER. Il tranchera « peut-on être libre sans être responsable » avec le
// même aplomb qu'une date de naissance, et il aura l'air sûr de lui dans les
// deux cas. Un arbitre qui ne sait pas dire « ceci ne se tranche pas » est un
// arbitre qu'on prend en défaut au premier match — et un joueur pris à tort
// ne revient pas.
//
// D'OÙ TROIS GARDE-FOUS, ET ILS SONT DANS CET ORDRE D'IMPORTANCE :
//
//   1. LA SÉPARATION. Quatre critères jugent une PERFORMANCE et s'appliquent
//      partout ; le cinquième VÉRIFIE un fait et n'existe que s'il y en a un.
//      `exactitude` peut donc être nulle, et le modèle doit le dire.
//   2. L'INTERDICTION DE TRANCHER LE FOND. On ne lui demande jamais qui a
//      raison — on lui demande qui a mieux défendu. La nuance décide de tout :
//      elle rend le jeu jouable sur des sujets où il n'y a pas de bonne
//      réponse, c'est-à-dire sur les plus intéressants.
//   3. LA PREUVE. Chaque relevé doit citer ce qui a été dit. Un reproche sans
//      citation est une opinion de plus, et le joueur a le droit de vérifier
//      l'arbitre autant que l'arbitre le vérifie.
//
// ─── ET LE MODÈLE NE VOIT QUE DU TEXTE ─────────────────────────────────────
//
// Les tours lui arrivent transcrits, avec leurs fautes de transcription. Il
// doit donc être prévenu qu'un mot bizarre est probablement une erreur du
// micro et pas une sottise du joueur — sinon il sanctionne un accent.

/** Un tour de parole, transcrit. */
export type Tour = { qui: "a" | "b"; round: number; texte: string };

export type Camp = { cle: "a" | "b"; prenom: string };

/**
 * LA FORME IMPOSÉE À LA RÉPONSE.
 *
 * ELLE N'EST PAS UNE COMMODITÉ DE PARSING, ELLE EST LA MOITIÉ DE LA CONSIGNE.
 * Un schéma qui exige cinq notes force le modèle à regarder cinq choses ; un
 * schéma qui autorise `exactitude: null` lui donne le droit de ne pas savoir.
 * Ce qu'on rend obligatoire est ce qu'on obtient.
 */
export const SCHEMA_ARBITRAGE = {
  type: "object",
  additionalProperties: false,
  required: ["vainqueur", "sansFait", "notes", "verdict", "analyse", "releves"],
  properties: {
    vainqueur: {
      type: "string",
      enum: ["a", "b", "nul"],
      description: "Le camp qui a le mieux défendu sa position. « nul » si l'écart est nul.",
    },
    sansFait: {
      type: "boolean",
      description:
        "Vrai si AUCUNE affirmation vérifiable n'a été avancée : la question était " +
        "entièrement d'opinion. Dans ce cas, exactitude doit être null des deux côtés.",
    },
    notes: {
      type: "object",
      additionalProperties: false,
      required: ["a", "b"],
      properties: { a: { $ref: "#/$defs/notes" }, b: { $ref: "#/$defs/notes" } },
    },
    verdict: {
      type: "string",
      description:
        "UNE phrase, adressée aux joueurs, qui dit OÙ s'est jouée la battle. " +
        "Pas un résumé du débat : la raison de l'écart.",
    },
    analyse: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: { type: "string" },
      description:
        "Le détail, en paragraphes. Le dernier commence par « Ce qui aurait renversé " +
        "la battle : » et dit au perdant la seule chose qu'il avait à faire.",
    },
    releves: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["qui", "genre", "quoi"],
        properties: {
          qui: { type: "string", enum: ["a", "b"] },
          genre: {
            type: "string",
            enum: ["faute", "sophisme", "fort", "hors"],
            description:
              "faute : une affirmation factuelle inexacte. sophisme : une faute de " +
              "logique. fort : un moment particulièrement bien joué. hors : un " +
              "passage hors sujet ou une digression non refermée.",
          },
          quoi: {
            type: "string",
            description: "Une phrase, qui CITE ce qui a été dit. Jamais un reproche nu.",
          },
        },
      },
    },
  },
  $defs: {
    notes: {
      type: "object",
      additionalProperties: false,
      required: ["arguments", "refutation", "pertinence", "clarte", "exactitude"],
      properties: {
        arguments: { type: "integer", minimum: 0, maximum: 100 },
        refutation: { type: "integer", minimum: 0, maximum: 100 },
        pertinence: { type: "integer", minimum: 0, maximum: 100 },
        clarte: { type: "integer", minimum: 0, maximum: 100 },
        exactitude: {
          type: ["integer", "null"],
          minimum: 0,
          maximum: 100,
          description: "null s'il n'y avait rien de vérifiable à noter chez ce camp.",
        },
      },
    },
  },
} as const;

/**
 * LA CONSIGNE.
 *
 * ELLE EST ÉCRITE EN FRANÇAIS ET AU PRÉSENT, comme une règle de jeu, parce
 * qu'elle en est une. Chaque paragraphe répond à une façon connue de rater un
 * arbitrage automatique.
 */
export function consigne(sujet: string, a: string, b: string, format: string): string {
  return [
    "Tu arbitres une battle d'argumentation. Deux personnes ont défendu une position",
    `sur ce sujet : « ${sujet} ».`,
    `Camp A : ${a}. Camp B : ${b}. Format : ${format}.`,
    "",
    "CE QUE TU NE FAIS JAMAIS.",
    "Tu ne dis pas qui a raison. Tu ne donnes pas ton avis sur la question. Tu ne",
    "récompenses pas la position qui te paraît la plus juste, ni la plus consensuelle.",
    "Deux personnes peuvent défendre une thèse que tu crois fausse : celle qui la",
    "défend le mieux gagne. C'est la règle du jeu, et elle n'a pas d'exception.",
    "",
    "CE QUE TU NOTES, SUR CENT.",
    "· arguments — ce qui est avancé, et ce qui le soutient. Une affirmation nue vaut",
    "  moins qu'une affirmation étayée, même si elle est vraie.",
    "· refutation — a-t-il répondu aux points PRÉCIS de l'autre ? Ignorer un argument",
    "  coûte cher ; le retourner rapporte beaucoup.",
    "· pertinence — est-on resté sur la question posée ?",
    "· clarte — se suit-on sans effort ? Un raisonnement juste qu'on ne suit pas ne",
    "  convainc personne, et se note comme tel.",
    "· exactitude — UNIQUEMENT les affirmations vérifiables : chiffres, dates, faits.",
    "",
    "LA RÈGLE LA PLUS IMPORTANTE : L'EXACTITUDE PEUT NE PAS EXISTER.",
    "Si personne n'a avancé quoi que ce soit de vérifiable — parce que la question",
    "est d'opinion, de goût ou de philosophie — tu mets exactitude à null des deux",
    "côtés et sansFait à vrai. Tu n'inventes pas une note. Un arbitre qui note",
    "l'exactitude d'une préférence perd toute autorité sur le reste.",
    "Si UN SEUL des deux a avancé un fait vérifiable, l'autre garde null.",
    "",
    "LES RELEVÉS CITENT.",
    "Chaque relevé reprend ce qui a été dit. « Il s'est contredit » ne vaut rien ;",
    "« il dit d'abord que X, puis que non-X » se vérifie. Au plus six, et seulement",
    "ceux qui ont pesé.",
    "",
    "CE QUE TU AS SOUS LES YEUX EST UNE TRANSCRIPTION AUTOMATIQUE.",
    "Un mot étrange, un chiffre improbable ou une phrase coupée viennent",
    "probablement du micro, pas de la personne. Tu ne sanctionnes jamais une",
    "tournure bancale, une hésitation ou une répétition : ce sont des marques de",
    "l'oral, pas des fautes d'argumentation. Tu ne notes que le raisonnement.",
    "",
    "TU T'ADRESSES AUX DEUX JOUEURS, par leur prénom, à la deuxième personne du",
    "pluriel. Ton bref, précis, sans flatterie. Le dernier paragraphe de l'analyse",
    "commence par « Ce qui aurait renversé la battle : » et donne au perdant la",
    "seule chose qu'il avait à faire.",
  ].join("\n");
}

/** Les tours, mis en forme pour le modèle. */
export function transcription(tours: Tour[], a: string, b: string): string {
  if (!tours.length) return "(aucun tour enregistré)";
  return tours
    .map(
      (t) =>
        `[Round ${t.round} — ${t.qui === "a" ? a : b}]\n${t.texte.trim() || "(rien d'audible)"}`,
    )
    .join("\n\n");
}
