/**
 * 🧪 QUELS MODÈLES D'IMAGE CE COMPTE PEUT-IL VRAIMENT APPELER ?
 *
 * ═══ POURQUOI CETTE ROUTE EXISTE ═══════════════════════════════════════════
 *
 * « La décision la plus importante est de cesser d'optimiser uniquement le
 * prompt sur gpt-image-1. OpenAI propose désormais des modèles d'image plus
 * récents pour l'édition. C'est la première comparaison technique que je
 * demanderais au codeur. »
 *
 * ET LA PREMIÈRE CHOSE À SAVOIR EST LEUR NOM EXACT. Un modèle d'image se
 * nomme par un identifiant précis ; un identifiant approché renvoie une erreur
 * 404 qui ressemble à une panne, et on cherche du mauvais côté pendant une
 * heure. Aucun de nous ne peut deviner ce catalogue : il change, il dépend du
 * compte, et il dépend de ce que l'organisation a activé.
 *
 * ON NE DEVINE DONC PAS, ON DEMANDE. C'est le compte lui-même qui répond, avec
 * sa propre clé, et la liste qu'il rend est la seule qui fasse foi. Le banc
 * d'essai remplit son sélecteur avec ça, et le codeur n'a plus à écrire un nom
 * qu'il n'a pas vérifié.
 *
 * ═══ CE QU'ELLE NE FAIT PAS ════════════════════════════════════════════════
 *
 * ELLE NE PREND AUCUN PARAMÈTRE, et c'est volontaire. Une route qui relaie une
 * adresse fournie par le navigateur est une porte ouverte sur le réseau
 * interne ; celle-ci appelle UNE adresse, écrite ici, et rien d'autre. Voir la
 * route de la photo de fiche pour le cas inverse, où il a fallu une liste
 * blanche d'hôtes parce qu'une adresse arrive vraiment de l'extérieur.
 *
 * ELLE NE REND PAS LA CLÉ, ni aucun en-tête de la réponse d'OpenAI : seulement
 * des identifiants de modèles et leur date. Ce qui sort d'ici est déjà public.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * CE QUI COMPTE COMME UN MODÈLE D'IMAGE.
 *
 * LE CATALOGUE D'UN COMPTE CONTIENT DES CENTAINES D'ENTRÉES — des modèles de
 * texte, de parole, de transcription, d'embeddings. On filtre sur ce qui a une
 * chance d'éditer une photo, et on le fait LARGE : un filtre trop serré
 * masquerait justement le modèle récent qu'on cherche, et c'est le seul
 * résultat qu'on ne veut pas produire.
 *
 * LE FILTRE EST INDICATIF, PAS AUTORITAIRE. La liste complète part aussi, dans
 * `tous`, pour que le banc puisse la montrer si celle-ci se révèle vide ou
 * incomplète. Une garde qui cache l'information qu'on est venu chercher est
 * pire que pas de garde.
 */
const INDICES = ["image", "dall-e", "vision", "edit", "paint", "canvas"];

export async function GET() {
  const cle = (process.env.OPENAI_API_KEY || "").trim();
  if (!cle) {
    return NextResponse.json(
      {
        erreur: "Aucune clé OpenAI n’est posée sur ce serveur.",
        pourquoi:
          "OPENAI_API_KEY est vide. La liste des modèles vient du compte : sans clé, personne ne peut la donner, et un nom de modèle écrit de mémoire est un nom faux une fois sur deux.",
      },
      { status: 503 },
    );
  }
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com").trim();
  let r: Response;
  try {
    r = await fetch(`${base}/v1/models`, {
      headers: { authorization: `Bearer ${cle}` },
      signal: AbortSignal.timeout(20000),
    });
  } catch (e) {
    return NextResponse.json(
      {
        erreur: "Le catalogue n’a pas répondu.",
        pourquoi: e instanceof Error ? e.message : String(e),
      },
      { status: 502 },
    );
  }
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    return NextResponse.json(
      {
        erreur: `Le catalogue a répondu ${r.status}.`,
        // LE CORPS D'ERREUR PART EN CLAIR, TRONQUÉ. C'est lui qui dit si la clé
        // est refusée, expirée, ou sans droit sur ce point d'entrée — trois
        // pannes qui se ressemblent et se réparent différemment.
        pourquoi: txt.slice(0, 600),
      },
      { status: 502 },
    );
  }
  const j = (await r.json().catch(() => null)) as { data?: { id?: string; created?: number }[] } | null;
  const tous = (j?.data ?? [])
    .map((m) => ({ id: String(m?.id ?? ""), cree: Number(m?.created ?? 0) }))
    .filter((m) => m.id)
    // LE PLUS RÉCENT EN PREMIER : c'est celui qu'on est venu chercher.
    .sort((a, b) => b.cree - a.cree);
  const images = tous.filter((m) => INDICES.some((i) => m.id.toLowerCase().includes(i)));
  return NextResponse.json({
    images,
    // LE COMPTE TOTAL, PAS LA LISTE ENTIÈRE : quelques centaines d'identifiants
    // dans une réponse que personne ne lira ne rendent service à personne. Le
    // nombre suffit à dire si le filtre a mangé quelque chose.
    combien: tous.length,
    // CE QUE LE SERVEUR APPELLE AUJOURD'HUI, pour qu'on voie tout de suite si
    // le banc compare le modèle en service ou un autre.
    enService: (process.env.OPENAI_IMAGE_MODEL || "").trim() || "gpt-image-1",
  });
}
