// 🪞 ESSAYER SUR SOI — la photo du client, celle du commerçant, et un rendu.
//
// ═══ POURQUOI CETTE ROUTE REMPLACE UN CALCUL GRATUIT ══════════════════════
//
// IL Y AVAIT UN MOTEUR GÉOMÉTRIQUE, ET IL NE POUVAIT PAS Y ARRIVER. Il dessinait
// une amande sur le doigt et la remplissait d'une couleur. Or ce qu'on essaie
// chez une prothésiste n'est pas une couleur : c'est une IMAGE — un motif à
// cœurs, une french, un dégradé, des paillettes. Et la courbure de l'ongle, le
// reflet, la lumière de la pièce, la peau autour ne se calculent pas : ils se
// rendent.
//
// LA PREUVE EST VENUE DU TERRAIN, PAS D'ICI. « Quand je mets sur ChatGPT ou
// Gemini ma main et la photo de référence et que je demande de mettre les ongles
// de la référence sur les miens, j'ai un résultat parfait. » Photo à l'appui. Et
// la barre a été posée au même moment : « si le résultat n'est pas parfait, ça
// n'ira pas — on ne peut pas proposer quelque chose de mauvais ou de moyen. »
//
// ON CHANGE DONC DE PRÉMISSE, PAS DE RÉGLAGE. Le « zéro centime par essai »
// était une contrainte que je m'étais donnée, pas une exigence du produit. Elle
// tombe devant « parfait ou rien », et elle doit tomber : un essai moyen ne fait
// pas venir un client, il fait fermer l'application.
//
// ═══ CE QUI RESTE DU TRAVAIL GRATUIT ══════════════════════════════════════
//
// `lib/direct/detourage.ts` garde toute sa valeur — il prépare la photo du
// commerçant. `lib/direct/essai.ts` reste le bon outil pour un objet POSÉ dans
// un lieu (une bougie sur une table : mesuré, convaincant, et gratuit). C'est la
// catégorie « porté sur le corps » qui bascule ici, et elle seule.
//
// ═══ CE QUE ÇA COÛTE, ET ON NE LE CACHE PAS ═══════════════════════════════
//
// Quelques centimes et quelques secondes par essai. Le quota de trois par jour
// existait déjà pour une raison de produit ; il devient aussi le plafond de la
// facture. Et LA PHOTO PART CHEZ UN TIERS — c'était l'argument central du
// moteur précédent (« rien n'est envoyé »). On ne fait pas comme si : l'écran le
// dit, et rien n'est conservé ici.
//
// ═══ DEUX FOURNISSEURS, PARCE QUE LES DEUX MARCHENT ═══════════════════════
//
// Son essai a réussi chez les deux. On prend donc Gemini en premier — le plus
// rapide et le moins cher sur l'édition d'image avec référence — et OpenAI en
// repli. Aucun des deux n'est câblé en dur dans l'écran : c'est la route qui
// choisit selon la clé présente, et l'écran ne sait rien du fournisseur.
import { NextResponse } from "next/server";
import { consigne } from "@/lib/direct/consigne-essai";

export const dynamic = "force-dynamic";
/** Un rendu prend quelques secondes ; la valeur par défaut de la plateforme ne suffit pas. */
export const maxDuration = 60;

/** Au-delà, c'est une photo qu'on n'a pas redimensionnée avant d'envoyer. */
const POIDS_MAX = 6_000_000;

/**
 * ON RENONCE AVANT QUE LA PASSERELLE NE COUPE.
 *
 * `maxDuration` dit combien de temps la fonction a le droit de vivre ; au-delà,
 * c'est un 504 dont le corps est une page HTML — donc illisible côté navigateur,
 * et c'est exactement ce qui s'est affiché : « Réponse illisible du serveur ».
 * En abandonnant quelques secondes avant, on garde la main et on explique.
 */
const DELAI_MAX = 52_000;

const s = (v: string | undefined) => (v ?? "").trim();

/** `data:image/jpeg;base64,…` → les deux morceaux dont les API ont besoin. */
function decoder(src: string): { type: string; donnees: string } | null {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(src.trim());
  if (!m) return null;
  return { type: m[1], donnees: m[2] };
}

/** Ce que Gemini rend : on cherche la première partie qui porte une image. */
type PartieGemini = { inlineData?: { mimeType?: string; data?: string } };

async function parGemini(
  cle: string,
  photo: { type: string; donnees: string },
  reference: { type: string; donnees: string },
  partie: string,
  garder: string[],
  change: string,
  decrire: string,
): Promise<{ image: string } | { erreur: string }> {
  const modele = s(process.env.GEMINI_IMAGE_MODEL) || "gemini-2.5-flash-image";
  /**
   * L'ADRESSE EST SURCHARGEABLE, ET C'EST POUR LA RECETTE.
   *
   * Sans clé, une route d'image ne se vérifie pas : on ne sait ni si elle
   * assemble bien la requête, ni si l'écran affiche bien ce qu'elle rend. En
   * pointant vers un faux fournisseur qui répond une image connue, TOUT LE
   * CHEMIN se mesure — sauf la qualité du rendu, qui est le seul morceau qui
   * demande vraiment une clé. C'est exactement la leçon du modèle manquant en
   * production : ce qui ne se vérifie qu'en ligne se paie sur le terrain.
   */
  const base = s(process.env.GEMINI_BASE_URL) || "https://generativelanguage.googleapis.com";
  const r = await fetch(
    `${base}/v1beta/models/${modele}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": cle },
      body: JSON.stringify({
        /**
         * ═══ CHAQUE IMAGE EST ANNONCÉE JUSTE AVANT D'ÊTRE DONNÉE ═══════════
         *
         * ELLES ÉTAIENT COLLÉES L'UNE APRÈS L'AUTRE À LA FIN, derrière un
         * texte de quarante lignes qui parlait de « l'image 1 » et de
         * « l'image 2 ». Rien, dans la requête, ne disait LAQUELLE était
         * laquelle : le modèle recevait deux photographies de deux femmes
         * différentes et devait deviner, à partir du texte, celle qu'il
         * fallait garder. Il s'est trompé — c'est très exactement le défaut
         * rapporté : « ce n'est plus le même visage ».
         *
         * UNE ÉTIQUETTE AVANT CHAQUE IMAGE LÈVE L'AMBIGUÏTÉ, et c'est la forme
         * que ces modèles lisent le mieux : texte, image, texte, image, puis
         * la consigne complète. Ça ne coûte rien et ça enlève la seule chose
         * que le modèle avait à deviner.
         */
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `IMAGE 1 — LA PERSONNE À MODIFIER. C'est cette personne-là, et elle doit rester exactement la même. Elle montre ${partie}.`,
              },
              { inlineData: { mimeType: photo.type, data: photo.donnees } },
              {
                text: "IMAGE 2 — LA RÉFÉRENCE, qui montre quelqu'un d'autre. Rien de cette personne-là ne doit passer dans le résultat.",
              },
              { inlineData: { mimeType: reference.type, data: reference.donnees } },
              { text: consigne(partie, garder, change, decrire) },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(DELAI_MAX),
    },
  );
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    return { erreur: `Gemini a répondu ${r.status}${txt ? ` : ${txt.slice(0, 200)}` : ""}` };
  }
  const j = (await r.json()) as {
    candidates?: { content?: { parts?: PartieGemini[] } }[];
  };
  for (const p of j.candidates?.[0]?.content?.parts ?? []) {
    const d = p.inlineData?.data;
    if (d) return { image: `data:${p.inlineData?.mimeType ?? "image/png"};base64,${d}` };
  }
  return { erreur: "Gemini n'a pas rendu d'image." };
}

/**
 * ═══ LE FORMAT DE SORTIE SUIT CELUI DE LA PHOTO DU CLIENT ══════════════════
 *
 * « L'IA a recréé toute la photo au lieu de modifier uniquement les vêtements :
 * elle a changé la position des jambes et la coupe du jean. »
 *
 * ON DEMANDAIT UN CARRÉ POUR UNE PHOTO EN PIED. `size` était figé à
 * 1024×1024 : une photo verticale de deux mètres de haut devait rentrer dans un
 * carré. Le modèle ne recadre pas — il RECOMPOSE, c'est-à-dire qu'il redessine
 * la personne dans le format demandé. Les jambes qui se déplacent et le jean
 * qui change de coupe ne sont pas un caprice du modèle : c'est ce qu'on lui a
 * demandé sans le savoir.
 *
 * ON LIT DONC LES DIMENSIONS DE SA PHOTO et on demande le format qui lui
 * ressemble. Trois valeurs existent chez OpenAI — carré, portrait, paysage — et
 * choisir la bonne coûte zéro milliseconde.
 *
 * SANS BIBLIOTHÈQUE, PARCE QU'UN EN-TÊTE SE LIT À LA MAIN. PNG écrit sa taille
 * aux octets 16 à 24 ; JPEG la range dans le premier segment SOF. Ajouter une
 * dépendance d'image pour deux nombres serait plus de risque que de travail.
 */
function dimensions(b64: string): { l: number; h: number } | null {
  let b: Buffer;
  try {
    b = Buffer.from(b64, "base64");
  } catch {
    return null;
  }
  if (b.length < 24) return null;
  // PNG : signature, puis IHDR à l'octet 16.
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { l: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  }
  // JPEG : on saute de segment en segment jusqu'au SOF, qui porte la taille.
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) {
        i += 1;
        continue;
      }
      const m = b[i + 1];
      // SOF0..SOF3 et SOF5..SOF7, SOF9..SOF11, SOF13..SOF15 portent la taille ;
      // les autres marqueurs à 0xC4/0xC8/0xCC sont des tables, pas des cadres.
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { h: b.readUInt16BE(i + 5), l: b.readUInt16BE(i + 7) };
      }
      if (m === 0xd8 || m === 0xd9 || (m >= 0xd0 && m <= 0xd7)) {
        i += 2;
        continue;
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

/**
 * LE FORMAT LE PLUS PROCHE, PARMI LES TROIS QU'OPENAI ACCEPTE.
 *
 * ON NE DEVINE PAS QUAND ON NE SAIT PAS : sans dimensions lisibles, on rend
 * `undefined` et l'appel garde le réglage d'environnement, ou le carré. Une
 * valeur inventée serait pire que l'ancien défaut — elle le rendrait
 * imprévisible.
 */
function formatDe(b64: string): string | undefined {
  const d = dimensions(b64);
  if (!d || !d.l || !d.h) return undefined;
  const r = d.l / d.h;
  if (r > 1.2) return "1536x1024";
  if (r < 0.83) return "1024x1536";
  return "1024x1024";
}

async function parOpenAI(
  cle: string,
  photo: { type: string; donnees: string },
  reference: { type: string; donnees: string },
  partie: string,
  garder: string[],
  change: string,
  decrire: string,
  masque: { type: string; donnees: string } | null,
): Promise<{ image: string } | { erreur: string }> {
  const modele = s(process.env.OPENAI_IMAGE_MODEL) || "gpt-image-1";
  // L'API d'édition d'OpenAI prend les images en multipart, et elle accepte
  // PLUSIEURS images : la première est celle qu'on modifie, la seconde sert de
  // référence. C'est exactement la forme dont on a besoin.
  const forme = new FormData();
  forme.append("model", modele);
  forme.append("prompt", consigne(partie, garder, change, decrire, !!masque));
  forme.append("n", "1");
  /**
   * TROIS RÉGLAGES QUI DÉCIDENT SI LE RENDU ARRIVE, OU PAS DU TOUT.
   *
   * CE QUI A RATÉ SUR LE TÉLÉPHONE : « HTTP 504 ». Un 504 n'est pas une panne du
   * modèle, c'est la passerelle qui coupe — la génération a mis plus longtemps
   * que le temps alloué à la fonction. En qualité maximale, une édition d'image
   * dépasse couramment la minute.
   *
   *   · `quality: low` divise l'attente par deux à trois. Pour un essai qu'on
   *     regarde sur un téléphone avant de décider, c'est le bon compromis — et
   *     c'est réglable sans redéployer par `OPENAI_IMAGE_QUALITY`.
   *   · `size` fixe la sortie au carré le plus petit utile. Sans lui, le modèle
   *     choisit, et il choisit grand.
   *   · `input_fidelity: high` est l'inverse : il COÛTE du temps, mais c'est lui
   *     qui garde le visage, la peau et la pose de la personne. Sans lui, le
   *     modèle « améliore » la photo et la cliente ne se reconnaît plus — ce qui
   *     vide l'essai de son sens.
   */
  forme.append("quality", s(process.env.OPENAI_IMAGE_QUALITY) || "medium");
  // LE RÉGLAGE D'ENVIRONNEMENT GAGNE TOUJOURS, parce que c'est le seul moyen de
  // rattraper un format en production sans redéployer. À défaut, on suit la
  // photo du client ; à défaut encore, le carré d'avant.
  const format = s(process.env.OPENAI_IMAGE_SIZE) || formatDe(photo.donnees) || "1024x1024";
  forme.append("size", format);
  forme.append("input_fidelity", "high");
  const enFichier = (x: { type: string; donnees: string }, nom: string) =>
    new File([Buffer.from(x.donnees, "base64")], nom, { type: x.type });
  forme.append("image[]", enFichier(photo, "client.png"));
  forme.append("image[]", enFichier(reference, "reference.png"));
  /**
   * ═══ LE MASQUE, QUAND LE NAVIGATEUR A SU LE FABRIQUER ══════════════════════
   *
   * « Il faut verrouiller techniquement le visage avec un masque, puis
   * réinjecter les pixels originaux après génération. »
   *
   * IL DÉCLARE LA ZONE MODIFIABLE PAR SON CANAL ALPHA : transparent = le modèle
   * peut réécrire, opaque = zone protégée. Voir `masqueDeCoiffure` dans
   * `lib/direct/visage.ts` pour ce qu'on ouvre exactement, et pourquoi si large.
   *
   * IL N'EST QUE LE PREMIER DES DEUX VERROUS, ET LE PLUS FAIBLE. Un masque est
   * une contrainte que le modèle respecte à peu près ; c'est la RECOMPOSITION,
   * côté navigateur, qui garantit l'identité — elle repose les pixels du visage
   * d'origine par-dessus le rendu. Si celui-ci disparaissait un jour, l'essai
   * resterait fidèle ; si c'était l'autre, on retomberait sur des visages
   * refaits.
   */
  if (masque) forme.append("mask", enFichier(masque, "masque.png"));
  const base = s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
  /**
   * ═══ CE QU'ON A VRAIMENT ENVOYÉ, DANS LES JOURNAUX ════════════════════════
   *
   * « Demande-lui d'enregistrer, pour chaque essai : l'endpoint utilisé, le
   * modèle réellement appelé, l'ordre des deux images, le prompt final, les
   * dimensions envoyées et celles du résultat. »
   *
   * C'EST LE BON RÉFLEXE, ET IL VIENT DE SERVIR : trois des cinq soupçons de son
   * analyse portaient sur des choses déjà correctes — c'est bien l'endpoint
   * d'édition, la photo du client est bien en premier, et `input_fidelity: high`
   * est déjà posé. Sans trace, on aurait « corrigé » trois fois ce qui marchait.
   *
   * LE PROMPT N'Y EST QU'EN LONGUEUR, PAS EN ENTIER : il fait deux mille signes
   * et il est le même à chaque appel pour un métier donné. Ce qu'on veut savoir
   * d'un journal, c'est ce qui CHANGE d'un essai à l'autre.
   */
  console.info(
    "[essai] POST /v1/images/edits",
    JSON.stringify({
      modele,
      images: ["client", "reference"],
      format,
      qualite: s(process.env.OPENAI_IMAGE_QUALITY) || "medium",
      fidelite: "high",
      entree: { client: dimensions(photo.donnees), reference: dimensions(reference.donnees) },
      // LE MASQUE EST-IL PARTI, ET À LA BONNE TAILLE ? Un masque aux dimensions
      // d'une autre image est refusé par l'API, et le message ne dit pas
      // toujours lequel des trois fichiers est en cause.
      masque: masque ? dimensions(masque.donnees) : null,
      consigne: consigne(partie, garder, change, decrire, !!masque).length,
    }),
  );
  const r = await fetch(`${base}/v1/images/edits`, {
    method: "POST",
    headers: { authorization: `Bearer ${cle}` },
    body: forme,
    // ON ABANDONNE AVANT LA PASSERELLE, pour rendre une raison plutôt qu'un 504
    // muet dont la page d'erreur n'est même pas du JSON.
    signal: AbortSignal.timeout(DELAI_MAX),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    return { erreur: `OpenAI a répondu ${r.status}${txt ? ` : ${txt.slice(0, 200)}` : ""}` };
  }
  const j = (await r.json()) as { data?: { b64_json?: string }[] };
  const b = j.data?.[0]?.b64_json;
  if (!b) return { erreur: "OpenAI n'a pas rendu d'image." };
  return { image: `data:image/png;base64,${b}` };
}

export async function POST(req: Request) {
  let corps: {
    photo?: string;
    reference?: string;
    /**
     * LA ZONE QUE LE MODÈLE A LE DROIT DE RÉÉCRIRE — voir `lib/direct/visage.ts`.
     *
     * ELLE EST CALCULÉE DANS LE NAVIGATEUR, et c'est le seul endroit possible :
     * la photo y est déjà, MediaPipe y est déjà servi pour la pose d'ongles, et
     * le masque doit être mesuré sur L'ORIGINAL. Le calculer ici obligerait à
     * installer un modèle de visage côté serveur pour retrouver ce que le
     * téléphone savait déjà.
     *
     * ELLE EST FACULTATIVE, ET SON ABSENCE EST LE CAS NORMAL. Une main, un
     * poignet, une table : rien à protéger, pas de masque. L'essai part comme
     * avant.
     */
    masque?: string;
    partie?: string;
    garder?: string[];
    change?: string;
    decrire?: string;
  };
  try {
    corps = (await req.json()) as typeof corps;
  } catch {
    return NextResponse.json({ erreur: "Requête illisible." }, { status: 400 });
  }

  const photo = decoder(s(corps.photo));
  const reference = decoder(s(corps.reference));
  const masque = decoder(s(corps.masque));
  const partie = s(corps.partie) || "la zone concernée";
  /**
   * CE QUE LE MÉTIER DEMANDE DE PRÉSERVER, ET IL VIENT DE L'ÉCRAN.
   *
   * IL NE PEUT PAS ÊTRE ÉCRIT ICI : chez le coiffeur les lunettes doivent
   * rester, chez le lunetier elles sont précisément ce qui change. La route ne
   * connaît pas le métier — elle connaît la partie du corps et cette liste-là.
   * On la borne quand même : dix lignes de cent caractères suffisent à tout
   * métier, et une consigne qui grossit sans limite est une entrée qu'on
   * accepte sans la lire.
   */
  const garder = (Array.isArray(corps.garder) ? corps.garder : [])
    .map((g) => s(String(g)).slice(0, 100))
    .filter(Boolean)
    .slice(0, 10);
  /**
   * CE QUE LE MODÈLE A LE DROIT DE MODIFIER, ET RIEN D'AUTRE.
   *
   * IL NE PEUT PAS SE DÉDUIRE DE `partie` — c'est précisément la confusion qui
   * a fait rendre un autre visage. On photographie une TÊTE pour changer des
   * CHEVEUX ; écrire « reproduis la référence sur votre tête » autorise le
   * modèle à refaire le visage, et il le fait.
   */
  const change = s(corps.change).slice(0, 160);
  /**
   * CE QUE LA PIÈCE EST, EN TOUTES LETTRES.
   *
   * Sans elle, la consigne demandait de DÉDUIRE la coupe d'une photo de
   * quelqu'un d'autre avant de la poser : deux opérations difficiles au lieu
   * d'une, et le modèle se rabattait sur la seule qu'il maîtrise — refabriquer
   * un portrait. Voir `decrire` dans `fantomes.ts` et `consigne-essai.ts`.
   */
  const decrire = s(corps.decrire).slice(0, 300);
  if (!photo) return NextResponse.json({ erreur: "Photo manquante ou illisible." }, { status: 400 });
  if (!reference) {
    return NextResponse.json({ erreur: "Photo de référence manquante." }, { status: 400 });
  }
  if (photo.donnees.length + reference.donnees.length > POIDS_MAX) {
    return NextResponse.json(
      { erreur: "Photos trop lourdes : réduisez-les avant l'envoi." },
      { status: 413 },
    );
  }

  const gemini = s(process.env.GEMINI_API_KEY) || s(process.env.GOOGLE_API_KEY);
  const openai = s(process.env.OPENAI_API_KEY);

  /**
   * SANS CLÉ, ON LE DIT — ON NE RETOMBE PAS SUR UN RENDU MOYEN.
   *
   * Le moteur géométrique existe encore et pourrait servir de repli. Il ne
   * servira pas : sa sortie est précisément ce qui a été jugé « très très
   * mauvais », et un repli silencieux vers du mauvais est exactement le défaut
   * qu'on a déjà payé deux fois — un écran qui montre autre chose que ce qu'il
   * prétend. Mieux vaut un essai indisponible qu'un essai raté.
   */
  if (!gemini && !openai) {
    return NextResponse.json(
      {
        erreur: "L’essayage n’est pas configuré sur ce serveur.",
        pourquoi: "Aucune clé d’image (GEMINI_API_KEY ou OPENAI_API_KEY) n’est présente.",
      },
      { status: 503 },
    );
  }

  const debut = Date.now();
  const essais: string[] = [];
  /**
   * L'ORDRE DES DEUX FOURNISSEURS SE CHANGE SANS REDÉPLOYER, ET C'EST UTILE.
   *
   * GEMINI PASSE EN PREMIER PARCE QU'IL EST LE PLUS RAPIDE ET LE MOINS CHER sur
   * l'édition avec référence, et c'est le bon défaut. Mais LA FIDÉLITÉ AU
   * VISAGE est ce qui décide si cet essai sert à quelque chose — « ce n'est pas
   * exactement ma tête » — et sur ce point précis, `gpt-image-1` accepte un
   * réglage que Gemini n'a pas : `input_fidelity: high`, qui coûte du temps et
   * garde le visage, la peau et la pose.
   *
   * ON NE PEUT PAS TRANCHER D'ICI : il n'y a aucune clé dans ce conteneur, donc
   * aucun rendu réel n'a jamais été comparé. Décider à l'aveugle et recompiler à
   * chaque hypothèse coûterait un aller-retour par essai, sur un téléphone.
   * `ESSAI_FOURNISSEUR=openai` renverse l'ordre en une variable, et laisse la
   * mesure se faire là où elle est possible — sur un vrai visage.
   */
  const dabord = s(process.env.ESSAI_FOURNISSEUR).toLowerCase();
  const chemins = [
    gemini ? () => parGemini(gemini, photo, reference, partie, garder, change, decrire) : null,
    openai
      ? () => parOpenAI(openai, photo, reference, partie, garder, change, decrire, masque)
      : null,
  ];
  /**
   * ═══ ET C'EST OPENAI QUI PASSE EN PREMIER, MAINTENANT ═════════════════════
   *
   * ON NE POUVAIT PAS TRANCHER TANT QU'AUCUN RENDU RÉEL N'AVAIT ÉTÉ VU. Il l'a
   * été : « ce n'est plus le même visage, et la coupe sélectionnée n'a pas été
   * créée ». C'est la mesure qui manquait, et elle départage les deux.
   *
   * `input_fidelity: high` N'EXISTE QUE CHEZ OPENAI, et c'est le réglage dont
   * dépend précisément ce qui a raté : il coûte du temps et garde le visage, la
   * peau et la pose. Gemini n'a aucun équivalent — on lui demande la fidélité
   * par des phrases, ce qui marche jusqu'au jour où ça ne marche pas.
   *
   * GEMINI RESTE EN REPLI, et le renversement se refait en une variable :
   * `ESSAI_FOURNISSEUR=gemini`. Ce qui compte ici est que le DÉFAUT choisisse
   * la fidélité, parce que c'est elle qui décide si cet essai sert à quelque
   * chose.
   */
  for (const tenter of dabord === "gemini" ? chemins : [...chemins].reverse()) {
    if (!tenter) continue;
    try {
      const r = await tenter();
      if ("image" in r) {
        return NextResponse.json({ image: r.image, ms: Date.now() - debut });
      }
      essais.push(r.erreur);
    } catch (e) {
      const nom = e instanceof Error ? e.name : "";
      essais.push(
        nom === "TimeoutError" || nom === "AbortError"
          ? "le rendu a dépassé le temps imparti"
          : e instanceof Error
            ? e.message
            : String(e),
      );
    }
  }

  // LA RAISON REMONTE JUSQU'À L'ÉCRAN. Une panne muette se diagnostique sur un
  // téléphone, ce qui coûte un aller-retour par hypothèse — déjà payé.
  return NextResponse.json(
    { erreur: "L’essayage n’a pas abouti.", pourquoi: essais.join(" · ") },
    { status: 502 },
  );
}
