// 👻 FAIRE PARLER LE DOUBLE DU CHEF.
//
// ═══ UN MODÈLE QUAND IL Y EN A UN, LA FICHE TOUJOURS ═══════════════════════
//
// La route reçoit l'identifiant du restaurant et la conversation ; elle relit
// la fiche du commerce ICI, côté serveur — le navigateur n'envoie jamais ce
// que le double est censé savoir, sans quoi n'importe qui pourrait lui faire
// dire n'importe quoi.
//
// AVEC UNE CLÉ OPENAI, un modèle de langage répond avec la consigne de
// `lib/direct/double-chef.ts`. SANS CLÉ, OU SI L'APPEL ÉCHOUE, le cerveau de
// secours répond par mots-clés. L'écran ne voit pas la différence, et une
// panne chez le fournisseur ne laisse jamais quelqu'un devant un double muet.
//
// ═══ CE QUE ÇA COÛTE ═══════════════════════════════════════════════════════
//
// Un échange, c'est une fiche d'un millier de mots et une réponse de deux
// phrases : une fraction de centime sur un petit modèle. On borne quand même
// l'historique aux douze derniers messages et chaque message à cinq cents
// signes : une conversation qui s'allonge ne doit pas faire grossir la facture.
import { NextResponse } from "next/server";
import { trouverLeCommerce } from "@/lib/direct/double-commerce";
import {
  consigneDuDouble,
  nettoyerReponse,
  repondreSansIA,
  type ReponseDouble,
} from "@/lib/direct/double-chef";
import { scellerVoix } from "@/lib/direct/sceau-voix";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/**
 * LE MODÈLE : CELUI QU'ON POSE, SINON UN PETIT MODÈLE RÉCENT.
 *
 * `gpt-5.4-mini` figure dans la liste des modèles du paquet officiel d'OpenAI
 * (version 7.23.0). Un double qui répond en deux phrases n'a pas besoin du
 * plus grand : il a besoin de répondre vite. `OPENAI_DOUBLE_MODEL` le change
 * sans redéployer.
 */
const MODELE = () => s(process.env.OPENAI_DOUBLE_MODEL) || "gpt-5.4-mini";

type Message = { de: "client" | "double"; texte: string };

export async function POST(req: Request) {
  let corps: { id?: unknown; messages?: unknown; prenom?: unknown };
  try {
    corps = (await req.json()) as typeof corps;
  } catch {
    return NextResponse.json({ erreur: "Requête illisible." }, { status: 400 });
  }
  /* LA DÉMONSTRATION OU UN VRAI RESTAURANT — voir `double-commerce.ts`. */
  const commerce = await trouverLeCommerce(s(corps.id));
  if (!commerce) return NextResponse.json({ erreur: "Commerce inconnu." }, { status: 404 });
  const fiche = commerce.fiche;
  const prenom = s(corps.prenom).slice(0, 40);
  const messages: Message[] = (Array.isArray(corps.messages) ? corps.messages : [])
    .map((m) => {
      const o = (m ?? {}) as { de?: unknown; texte?: unknown };
      return { de: o.de === "double" ? "double" : "client", texte: s(o.texte).slice(0, 500) } as Message;
    })
    .filter((m) => m.texte)
    .slice(-12);
  const question = [...messages].reverse().find((m) => m.de === "client")?.texte ?? "";
  if (!question) return NextResponse.json({ erreur: "Aucune question." }, { status: 400 });

  /* CHAQUE RÉPONSE PART AVEC SON SCEAU : c'est lui qui permet ensuite à la
     route de la voix de la dire, et à elle seule. Voir `sceau-voix.ts`. */
  /* LA CARTE « PLAT » PART AVEC CE DONT ELLE PARLE — voir `ReponseDouble.plat`. */
  const scelle = (r: ReponseDouble): ReponseDouble => ({
    ...r,
    sig: scellerVoix(fiche.id, r.texte),
    ...(r.carte === "plat" && fiche.plat ? { plat: fiche.plat } : {}),
  });
  const secours = (): ReponseDouble => scelle({ ...repondreSansIA(question, fiche), par: "local" });
  const cle = s(process.env.OPENAI_API_KEY);
  if (!cle) return NextResponse.json(secours());

  const base = s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
  try {
    const r = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cle}` },
      body: JSON.stringify({
        model: MODELE(),
        response_format: { type: "json_object" },
        max_completion_tokens: 500,
        messages: [
          { role: "system", content: consigneDuDouble(fiche, prenom) },
          ...messages.map((m) => ({ role: m.de === "client" ? "user" : "assistant", content: m.texte })),
        ],
      }),
      // DOUZE SECONDES : au-delà, quelqu'un qui attend une réponse de deux
      // phrases a déjà reposé son téléphone. Le secours répond, lui, tout de suite.
      signal: AbortSignal.timeout(12_000),
    });
    if (!r.ok) {
      console.info("[double] le modèle a refusé, on répond sans lui", r.status, (await r.text().catch(() => "")).slice(0, 200));
      return NextResponse.json(secours());
    }
    const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const contenu = j.choices?.[0]?.message?.content ?? "";
    let brut: unknown = null;
    try {
      brut = JSON.parse(contenu);
    } catch {
      brut = null;
    }
    const propre = nettoyerReponse(brut, fiche);
    return NextResponse.json(propre ? scelle({ ...propre, par: "ia" }) : secours());
  } catch (e) {
    console.info("[double] appel impossible, on répond sans le modèle", e instanceof Error ? e.message : String(e));
    return NextResponse.json(secours());
  }
}
