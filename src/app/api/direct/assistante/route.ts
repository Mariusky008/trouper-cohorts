// L'ASSISTANTE DU COMMERÇANT.
//
// ─── LA PHRASE QUI COMMANDE TOUT LE FICHIER ───────────────────────────────
//
// « Le commerçant ne gère pas ClikMe. Il parle à son assistante. »
//
// Tout ce qui ajoute de la complexité à son écran doit être repris ici. C'est
// le modèle qui absorbe la complexité, pas lui : il ne choisit pas de
// catégorie, pas d'heure, pas de durée, il n'écrit pas de titre. Il dit ce qu'il
// a, et une carte structurée en sort.
//
// ─── UN SEUL CHEMIN POUR LA DÉMO ET POUR LE VRAI ──────────────────────────
//
// La tentation était de scénariser la démonstration : des questions écrites
// d'avance, des réponses attendues, un enchaînement sûr. On l'a écartée, et pour
// une raison concrète : un scénario est une machine à états, le vrai produit est
// un modèle, et ce sont deux codes différents. Le jour où le prospect répond à
// côté — il répondra à côté, c'est un boucher, pas un testeur — ça casse DEVANT
// LUI, au pire endroit possible.
//
// C'est donc le même appel, le même prompt, le même écran. La démonstration ne
// diffère que par trois choses, et aucune n'est ici : le commerce est une fiche
// fictive, la publication va dans le paquet de démonstration, et l'horloge est
// fausse. « C'est exactement ce que vous aurez demain » cesse d'être une
// promesse commerciale pour devenir un fait.
//
// ─── CE QUE LE MODÈLE N'A PAS LE DROIT DE FAIRE ───────────────────────────
//
// INVENTER UN CHIFFRE. C'est la seule faute qui coûte un commerçant. Un prix
// deviné et publié, c'est un client qui arrive avec quatre euros pour un plat à
// quatorze, et un commerçant qui n'y revient jamais. En cas de doute, la carte
// laisse le champ vide et l'assistante pose la question.
//
// PUBLIER. Elle ne publie rien : elle PROPOSE une carte, l'écran la montre en
// trois chiffres, et le commerçant appuie sur « C'est bon ». Aucune
// transcription n'est fiable à cent pour cent dans une boulangerie à sept
// heures ; cette validation est ce qui autorise le vocal à exister.
//
// CHOISIR SEULE UN MOMENT POUR REVENIR. Elle annonce un retour, mais l'heure
// vient de la conversation — « je reviendrai vers 13 h 45 » parce qu'il vient de
// dire qu'il sert jusqu'à 14 h. C'est ce qui sépare une assistante d'une
// application à notifications.
import { NextResponse } from "next/server";
import { carteAMontrer } from "@/lib/direct/carte-a-valider";
import { aEteCoupee, aRefuse, texteDuModele } from "@/lib/site-internet/reponse-modele";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

// La conversation d'un matin fait cinq à huit tours. Au-delà de quarante, ce
// n'est plus une journée qu'on raconte : on borne pour ne pas laisser une page
// ouverte grossir sans fin.
const MAX_TOURS = 40;
const MAX_SIGNES = 1200;

/**
 * SONNET, ET PAS PLUS GROS. C'est une conversation courte sur un téléphone : le
 * commerçant attend, debout, au milieu de son service. La difficulté n'est pas
 * le raisonnement, c'est de démêler « j'ai fait du magret mais y'a la garbure
 * d'hier à écouler et Sophie est pas là donc on ferme à 14 h » — une phrase,
 * trois faits. Sonnet le fait, et il le fait vite.
 */
const MODELE = "claude-sonnet-5";

/** Le plafond horaire par adresse : la route se paie à l'appel. */
const VU = new Map<string, { n: number; depuis: number }>();
const PAR_HEURE = 200;

function tropSouvent(qui: string): boolean {
  const t = Date.now();
  const e = VU.get(qui);
  if (!e || t - e.depuis > 3_600_000) {
    VU.set(qui, { n: 1, depuis: t });
    return false;
  }
  e.n += 1;
  return e.n > PAR_HEURE;
}

/**
 * CE QU'ELLE PEUT DEMANDER, PAR MÉTIER.
 *
 * PAS UN SCÉNARIO — UNE LISTE DE CE QUI EXISTE CHEZ LUI. La différence est
 * entière : un scénario impose un ordre et casse dès qu'on en sort ; une liste
 * dit au modèle de quoi ce métier est fait, et il pose la question qui manque.
 * « Combien de portions » n'a aucun sens chez un coiffeur, et « quels créneaux
 * vous reste-t-il » n'en a aucun chez un boucher.
 */
const MATIERE: Record<string, string> = {
  restaurant:
    "plat du jour, nombre de portions, tables libres ce midi ou ce soir, " +
    "annulation, ce qui reste en fin de service, événement du soir, fermeture exceptionnelle",
  bar: "ce qui se passe ce soir, concert ou animation, terrasse, tables libres, ardoise du jour",
  coiffeur:
    "créneaux encore libres aujourd'hui, désistement de dernière minute, " +
    "nouvelle prestation, une réalisation à montrer",
  ongles:
    "créneaux encore libres, désistement, nouvelle couleur ou nouvelle prestation, " +
    "une pose à montrer",
  mode: "arrivage du jour, pièce à mettre en avant, tailles restantes, dernière pièce, fin de série",
  fleuriste: "arrivage du matin, bouquets prêts, ce qu'il reste en fin de journée, événement",
};

const SYSTEME = (
  commerce: { prenom: string; nom: string; metier: string; branche: string },
  heure: number,
  dejaPublie: string[],
) => {
  const hh = `${Math.floor(heure)} h ${String(Math.round((heure % 1) * 60)).padStart(2, "0")}`;
  return [
    `Tu es l'assistante de ${commerce.prenom}, qui tient ${commerce.nom} (${commerce.metier}) à Dax.`,
    `Il est ${hh}.`,
    "",
    "TON RÔLE. Il te raconte sa journée en parlant ; tu en fais des annonces pour",
    "le Direct de Dax, que ses voisins lisent sur leur téléphone. Il ne remplit",
    "aucun formulaire, ne choisit aucune catégorie, n'écrit aucun titre. C'est toi",
    "qui absorbes tout ça.",
    "",
    "COMMENT TU PARLES.",
    "- Vouvoiement. S'il te tutoie, tu peux le tutoyer en retour, jamais avant.",
    "- Deux phrases au maximum. Il est debout, au milieu de son service, et il lit",
    "  sur un téléphone. Une question à la fois.",
    "- Chaleureuse et brève, jamais commerciale. Tu ne dis pas « super ! »,",
    "  « n'hésitez pas », « pensez à ». Tu ne le félicites pas d'avoir répondu.",
    "- Tu ne parles jamais de « publication », de « post », de « contenu », de",
    "  « ClikMe » comme d'un outil. Tu dis « je le mets en ligne », « vos voisins",
    "  le verront ».",
    "",
    "QUAND TU PROPOSES LA CARTE — et c'est la règle la plus importante.",
    "TU NE LA PROPOSES QU'AU MOMENT OÙ TU N'AS PLUS AUCUNE QUESTION À POSER",
    "DESSUS. La carte est un récapitulatif à valider, pas un brouillon : elle",
    "veut dire « voilà ce qui part en ligne, appuyez ». Sortir une carte au prix",
    "vide PUIS demander le prix, c'est lui montrer le résultat avant la fin de la",
    "conversation — il ne sait plus s'il doit répondre ou appuyer.",
    "TANT QU'IL TE MANQUE QUELQUE CHOSE, tu rends `carte` à null et tu poses ta",
    "question, une seule à la fois. Pour un plat il te faut au minimum le prix ;",
    "pour un arrivage ou une pièce, un prix ou un ordre de prix ; pour un créneau",
    "libre ou une fermeture, l'heure suffit et tu peux proposer tout de suite.",
    "UNE RÉPONSE QUI CONTIENT UNE QUESTION NE PORTE JAMAIS DE CARTE.",
    "",
    "CE QUE TU NE FAIS JAMAIS.",
    "- TU N'INVENTES AUCUN CHIFFRE. Pas un prix, pas une quantité, pas une heure.",
    "  Tu poses la question et tu attends la réponse. Un prix faux publié à toute",
    "  une ville lui coûte un client et sa confiance.",
    "- Tu ne publies pas : tu proposes une carte, il valide d'un doigt.",
    "- Tu ne choisis pas seule une heure de retour : elle sort de ce qu'il vient",
    "  de dire. S'il sert jusqu'à 14 h, tu proposes de revenir vers 13 h 45.",
    "",
    "LA PHOTO. Dès que la carte porte quelque chose qui SE VOIT — un plat, un",
    "arrivage, un bouquet, une coupe, une vitrine, une ardoise, une pièce — tu",
    "mets `photo` à VRAI. C'est le cas le plus courant, et dans le doute c'est",
    "vrai. Tu ajoutes la demande à la fin de ta phrase, en quatre mots : « vous",
    "me la photographiez ? ». Ce n'est pas une question qui bloque : la carte",
    "reste proposée en même temps, il peut valider avec ou sans image. Sans",
    "photo, l'annonce est un titre sur du vide, et une carte sans image ne se",
    "regarde pas dans un paquet qu'on balaie.",
    "Tu mets `photo` à faux pour ce qui ne se voit pas — un créneau libre, une",
    "fermeture, une heure de service — et tu ne la redemandes jamais deux fois",
    "pour la même annonce. Elle reste facultative : s'il ne veut pas, tu publies",
    "sans et tu n'y reviens pas.",
    "",
    "S'IL N'A RIEN À DIRE, TU LE LAISSES TRANQUILLE. Un jour où il ne se passe",
    "rien est un jour normal. Tu réponds « très bien, à demain » et tu mets",
    "`fini` à vrai. Ne fabrique jamais une annonce pour remplir : « plat du jour",
    "comme d'habitude » publié tous les jours vide le Direct de son intérêt.",
    "",
    "S'IL DIT TROIS CHOSES EN UNE PHRASE, tu ne les perds pas. Tu traites la",
    "première en carte, tu nommes les autres dans ta réponse et tu y reviens au",
    "tour suivant. Exemple : « j'ai fait du magret mais y'a la garbure d'hier à",
    "écouler et on ferme à 14 h » → tu prends le magret, et tu dis que tu",
    "reviendras sur la garbure et la fermeture.",
    "",
    `CE DONT CE MÉTIER EST FAIT : ${MATIERE[commerce.branche] ?? MATIERE.restaurant}.`,
    "Ce n'est pas un questionnaire à dérouler : c'est ce qui existe chez lui.",
    "Pose la question qui manque, pas la suivante d'une liste.",
    "",
    dejaPublie.length
      ? `DÉJÀ EN LIGNE AUJOURD'HUI : ${dejaPublie.join(" ; ")}. Pour en modifier une (« il m'en reste trois »), rends une carte de nature « maj » avec le titre EXACT ci-dessus. N'en crée pas une deuxième pour le même plat : c'est la même annonce qui vit.`
      : "RIEN N'EST ENCORE EN LIGNE aujourd'hui.",
    "",
    "LA CARTE. `de` et `a` sont des heures décimales (11.5 = 11 h 30) : quand la",
    "chose est vraie, pas quand tu la publies. `prix` est un texte tel qu'il se",
    "lit (« 14 € », « à partir de 12 € »), vide si inconnu. `titre` fait trois à",
    "cinq mots, dans ses mots à lui. `icone` est un seul emoji.",
  ].join("\n");
};

const SCHEMA = {
  type: "object",
  properties: {
    dire: { type: "string" },
    carte: {
      type: ["object", "null"],
      properties: {
        nature: { type: "string", enum: ["nouvelle", "maj"] },
        titre: { type: "string" },
        detail: { type: "string" },
        prix: { type: "string" },
        quantite: { type: ["number", "null"] },
        de: { type: "number" },
        a: { type: "number" },
        icone: { type: "string" },
        epuise: { type: "boolean" },
        photo: { type: "boolean" },
      },
      required: ["nature", "titre", "detail", "prix", "quantite", "de", "a", "icone", "epuise", "photo"],
      additionalProperties: false,
    },
    retour: {
      type: ["object", "null"],
      properties: {
        heure: { type: "number" },
        pourquoi: { type: "string" },
      },
      required: ["heure", "pourquoi"],
      additionalProperties: false,
    },
    fini: { type: "boolean" },
  },
  required: ["dire", "carte", "retour", "fini"],
  additionalProperties: false,
} as const;

/** Ce qu'on rend quand rien ne marche : une assistante qui s'excuse, pas un écran cassé. */
const PANNE = {
  dire: "Je n’ai pas réussi à vous répondre. Redites-le-moi ?",
  carte: null,
  retour: null,
  fini: false,
};

export async function POST(request: Request) {
  const cle = s(process.env.ANTHROPIC_API_KEY);
  if (!cle) {
    return NextResponse.json(
      { erreur: "ANTHROPIC_API_KEY absente : l’assistante n’est pas configurée." },
      { status: 503 },
    );
  }
  const qui = s(request.headers.get("x-forwarded-for")).split(",")[0].trim() || "inconnu";
  if (tropSouvent(qui)) {
    return NextResponse.json({ erreur: "Trop d’échanges sur cette heure." }, { status: 429 });
  }

  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }

  const c = (p?.commerce ?? {}) as Record<string, unknown>;
  const commerce = {
    prenom: s(c.prenom) || "vous",
    nom: s(c.nom) || "votre commerce",
    metier: s(c.metier) || "commerce",
    branche: s(c.branche) || "restaurant",
  };
  const heure = Number(p?.heure);
  if (!Number.isFinite(heure) || heure < 0 || heure > 24) {
    return NextResponse.json({ erreur: "Heure manquante." }, { status: 400 });
  }
  const dejaPublie = Array.isArray(p?.publie)
    ? (p.publie as unknown[]).map((x) => s(x)).filter(Boolean).slice(0, 12)
    : [];
  const tours = Array.isArray(p?.messages) ? (p.messages as unknown[]) : [];
  const messages = tours
    .slice(-MAX_TOURS)
    .map((m) => {
      const o = (m ?? {}) as Record<string, unknown>;
      const role = s(o.role) === "assistant" ? "assistant" : "user";
      return { role, content: s(o.content).slice(0, MAX_SIGNES) };
    })
    .filter((m) => m.content);

  // LA PREMIÈRE PHRASE VIENT DU MODÈLE, ELLE AUSSI. On aurait pu l'écrire en dur
  // — « Bonjour, on prépare votre journée ? » — mais alors la démonstration
  // commencerait par la seule ligne qui ne soit pas le vrai produit. Un tour
  // vide déclenche l'ouverture.
  const conversation = messages.length
    ? messages
    : [{ role: "user", content: "(il vient d’ouvrir l’application)" }];

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 1500,
        system: SYSTEME(commerce, heure, dejaPublie),
        messages: conversation,
        output_config: {
          // IL ATTEND DEBOUT. Démêler trois faits d'une phrase ne demande pas de
          // longue réflexion ; le faire en une seconde plutôt qu'en cinq change
          // tout à l'usage.
          effort: "low",
          format: { type: "json_schema", schema: SCHEMA },
        },
      }),
    });
    if (!res.ok) {
      console.error(`[assistante] appel refusé : HTTP ${res.status}`);
      return NextResponse.json(PANNE);
    }
    const data = await res.json();
    if (aRefuse(data) || aEteCoupee(data)) return NextResponse.json(PANNE);
    let r: Record<string, unknown>;
    try {
      r = JSON.parse(texteDuModele(data)) as Record<string, unknown>;
    } catch {
      return NextResponse.json(PANNE);
    }

    // ─── ON RELIT CE QUI SORT, PARCE QU'UN CHAMP FAUX SE PUBLIE ───
    // Le schéma garantit la FORME, pas le bon sens. Une carte sans titre, une
    // fenêtre à l'envers ou une heure de retour déjà passée passeraient le
    // schéma et casseraient l'écran ou, pire, une annonce.
    const carte = (r.carte ?? null) as Record<string, unknown> | null;
    const propre = carte && s(carte.titre)
      ? {
          nature: s(carte.nature) === "maj" ? "maj" : "nouvelle",
          titre: s(carte.titre).slice(0, 80),
          detail: s(carte.detail).slice(0, 160),
          prix: s(carte.prix).slice(0, 24),
          quantite:
            typeof carte.quantite === "number" && carte.quantite >= 0
              ? Math.round(carte.quantite)
              : null,
          de: Math.min(23.9, Math.max(0, Number(carte.de) || heure)),
          a: Math.min(24, Math.max(0.1, Number(carte.a) || 24)),
          icone: s(carte.icone).slice(0, 4) || "📍",
          epuise: carte.epuise === true,
          photo: carte.photo === true,
        }
      : null;
    // UNE FENÊTRE QUI FINIT AVANT DE COMMENCER FERAIT DISPARAÎTRE LA CARTE du
    // paquet à la seconde où il la valide — le pire défaut possible à cet
    // instant précis.
    if (propre && propre.a <= propre.de) propre.a = Math.min(24, propre.de + 1);

    // ─── ON NE MONTRE PAS LE RÉSULTAT PENDANT QU'ON POSE ENCORE LA QUESTION ───
    //
    // LE DÉFAUT MESURÉ : « elle me donne le résultat de notre conversation après
    // une seule question, et c'est APRÈS qu'elle me demande le prix ». La carte
    // sortait vide de son prix, suivie de « et c'est à combien ? » — le
    // commerçant ne sait plus s'il doit répondre ou appuyer, et s'il appuie il
    // publie une annonce sans prix.
    //
    // LA CONSIGNE EST DANS LE PROMPT, MAIS UNE CONSIGNE N'EST PAS UNE GARANTIE.
    // La règle est dans `carte-a-valider.ts`, à part, parce qu'elle se vérifie :
    // un garde-fou qu'on ne peut pas éprouver n'en est pas un.
    const dit = s(r.dire).slice(0, 400) || PANNE.dire;
    const carteRendue = carteAMontrer(dit, propre) ? propre : null;

    const ret = (r.retour ?? null) as Record<string, unknown> | null;
    const retour =
      ret && Number.isFinite(Number(ret.heure))
        ? { heure: Number(ret.heure), pourquoi: s(ret.pourquoi).slice(0, 120) }
        : null;

    return NextResponse.json({
      dire: dit,
      carte: carteRendue,
      // UN RETOUR DANS LE PASSÉ N'EN EST PAS UN. Le modèle propose parfois une
      // heure déjà écoulée quand la conversation a duré ; on la jette plutôt que
      // d'annoncer un rendez-vous qui n'aura jamais lieu.
      retour: retour && retour.heure > heure ? retour : null,
      fini: r.fini === true,
    });
  } catch (e) {
    console.error(`[assistante] impossible : ${(e as Error)?.message || "réseau"}`);
    return NextResponse.json(PANNE);
  }
}
