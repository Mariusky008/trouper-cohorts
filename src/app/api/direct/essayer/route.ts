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

/**
 * LA CONSIGNE, ET ELLE EST LA MOITIÉ DU RÉSULTAT.
 *
 * TROIS CHOSES DOIVENT Y ÊTRE, et chacune répare une façon de rater :
 *
 *   · CE QU'ON GARDE. Sans « ne change rien d'autre », le modèle redresse la
 *     main, change la lumière, remplace l'arrière-plan — et la cliente ne
 *     reconnaît plus sa propre photo, donc ne croit plus le rendu.
 *   · CE QU'ON PREND DE LA RÉFÉRENCE. Pas « inspire-toi » mais « reproduis
 *     exactement » : la forme, la longueur, la couleur, le motif. C'est le
 *     travail du commerçant qu'on essaie, pas une interprétation.
 *   · CE QU'ON N'INVENTE PAS. Une main a cinq doigts et la photo en montre
 *     peut-être quatre ; ajouter le cinquième est un mensonge visible.
 */
function consigne(partie: string): string {
  return [
    `Première image : la photo d'un client, montrant ${partie}.`,
    "Deuxième image : la photo de référence d'un professionnel, montrant le résultat à reproduire.",
    "",
    `Reproduis EXACTEMENT le style de la deuxième image sur ${partie} de la première image :`,
    "la forme, la longueur, la couleur, le motif, la finition et la brillance.",
    "",
    "Règles impératives :",
    "- Ne modifie RIEN d'autre que la zone concernée. La pose de la main, la peau,",
    "  l'arrière-plan, le cadrage, la lumière et les ombres de la première image",
    "  restent strictement identiques.",
    "- Respecte la perspective, la courbure et l'éclairage de la première image.",
    "- N'ajoute aucun doigt, aucun objet, aucun texte, aucun filigrane.",
    "- Le résultat doit ressembler à une photographie prise telle quelle, pas à un montage.",
    "",
    "Rends uniquement l'image modifiée.",
  ].join("\n");
}

/** Ce que Gemini rend : on cherche la première partie qui porte une image. */
type PartieGemini = { inlineData?: { mimeType?: string; data?: string } };

async function parGemini(
  cle: string,
  photo: { type: string; donnees: string },
  reference: { type: string; donnees: string },
  partie: string,
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
        contents: [
          {
            role: "user",
            parts: [
              { text: consigne(partie) },
              { inlineData: { mimeType: photo.type, data: photo.donnees } },
              { inlineData: { mimeType: reference.type, data: reference.donnees } },
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

async function parOpenAI(
  cle: string,
  photo: { type: string; donnees: string },
  reference: { type: string; donnees: string },
  partie: string,
): Promise<{ image: string } | { erreur: string }> {
  const modele = s(process.env.OPENAI_IMAGE_MODEL) || "gpt-image-1";
  // L'API d'édition d'OpenAI prend les images en multipart, et elle accepte
  // PLUSIEURS images : la première est celle qu'on modifie, la seconde sert de
  // référence. C'est exactement la forme dont on a besoin.
  const forme = new FormData();
  forme.append("model", modele);
  forme.append("prompt", consigne(partie));
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
  forme.append("quality", s(process.env.OPENAI_IMAGE_QUALITY) || "low");
  forme.append("size", s(process.env.OPENAI_IMAGE_SIZE) || "1024x1024");
  forme.append("input_fidelity", "high");
  const enFichier = (x: { type: string; donnees: string }, nom: string) =>
    new File([Buffer.from(x.donnees, "base64")], nom, { type: x.type });
  forme.append("image[]", enFichier(photo, "client.png"));
  forme.append("image[]", enFichier(reference, "reference.png"));
  const base = s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
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
  let corps: { photo?: string; reference?: string; partie?: string };
  try {
    corps = (await req.json()) as typeof corps;
  } catch {
    return NextResponse.json({ erreur: "Requête illisible." }, { status: 400 });
  }

  const photo = decoder(s(corps.photo));
  const reference = decoder(s(corps.reference));
  const partie = s(corps.partie) || "la zone concernée";
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
  for (const tenter of [
    gemini ? () => parGemini(gemini, photo, reference, partie) : null,
    openai ? () => parOpenAI(openai, photo, reference, partie) : null,
  ]) {
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
