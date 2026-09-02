// LA VOIX DE LÉA.
//
// ─── POURQUOI ELLE PARLE, ET CE N'EST PAS UN ORNEMENT ─────────────────────
//
// Verdict du premier essai en conditions réelles : « ça a très bien fonctionné,
// ceci dit j'aurais aimé entendre la voix de Léa, là il n'y a que de l'écrit
// donc c'est moins spectaculaire ».
//
// Le mot juste est « spectaculaire », mais la raison est plus profonde. On
// demande à un commerçant de PARLER à quelque chose. S'il parle et qu'on lui
// répond par écrit, ce n'est pas une conversation : c'est un formulaire déguisé,
// et il retombe dans le geste qu'on voulait lui éviter — lire un écran, chercher
// un bouton. Une voix qui répond ferme la boucle : il parle, on lui répond, il
// n'a jamais à regarder son téléphone. C'est ça qui permet de tenir la promesse
// « il n'est pas sur son téléphone de la journée ».
//
// ─── DEUX FOURNISSEURS, LE MÊME QUE LE RESTE DU PRODUIT ───────────────────
//
// La logique est celle de `api/site-internet/tts` : ElevenLabs si sa clé existe,
// OpenAI sinon. On ne la partage pas par un import parce que l'autre route est
// gardée par un jeton de site vitrine qui n'a rien à faire ici — mais les
// réglages sont les mêmes, pour que Léa ait la même voix partout.
//
// ─── ET ELLE NE BLOQUE JAMAIS ─────────────────────────────────────────────
//
// Pas de clé, panne, réseau lent : la conversation continue à l'écrit. Une voix
// est un confort, la réponse est le produit. Une route qui rendrait une erreur
// bloquante ferait tomber l'assistante entière pour un problème de son.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

/** Deux phrases, jamais plus — c'est la règle de Léa, et le plafond la tient. */
const MAX_SIGNES = 400;

/** Le plafond horaire par adresse : la synthèse se paie au caractère. */
const VU = new Map<string, { n: number; depuis: number }>();
const PAR_HEURE = 300;

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
 * ON RETIRE LES EMOJIS AVANT DE LIRE. « 🍽️ Magret de canard » se prononce
 * « couverts magret de canard » chez certaines voix — et une assistante qui lit
 * les pictogrammes à voix haute cesse d'être quelqu'un.
 */
const nettoyer = (t: string) =>
  t
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SIGNES);

export async function POST(request: Request) {
  const elevenKey = s(process.env.ELEVENLABS_API_KEY);
  const openaiKey = s(process.env.OPENAI_TTS_API_KEY) || s(process.env.OPENAI_API_KEY);
  if (!elevenKey && !openaiKey) {
    return NextResponse.json({ erreur: "Voix non configurée." }, { status: 503 });
  }
  const qui = s(request.headers.get("x-forwarded-for")).split(",")[0].trim() || "inconnu";
  if (tropSouvent(qui)) {
    return NextResponse.json({ erreur: "Trop de synthèses sur cette heure." }, { status: 429 });
  }

  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const texte = nettoyer(s(p?.texte));
  if (!texte) return NextResponse.json({ erreur: "Rien à dire." }, { status: 400 });

  const son = (buf: ArrayBuffer) =>
    new NextResponse(buf, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });

  try {
    if (elevenKey) {
      const voix = s(process.env.ELEVENLABS_VOICE_ID) || "21m00Tcm4TlvDq8ikWAM";
      const r = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voix)}?output_format=mp3_44100_96`,
        {
          method: "POST",
          headers: { "xi-api-key": elevenKey, "content-type": "application/json" },
          body: JSON.stringify({
            text: texte,
            // LE MODÈLE RAPIDE, ET C'EST LE SEUL CHOIX POSSIBLE ICI. Léa répond
            // dans une conversation : une seconde de synthèse en plus est une
            // seconde où le commerçant regarde son téléphone sans rien entendre,
            // et il repose l'appareil.
            model_id: "eleven_flash_v2_5",
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        },
      );
      if (!r.ok) {
        console.error(`[parler] ElevenLabs a refusé : HTTP ${r.status}`);
        return NextResponse.json({ erreur: "Voix indisponible." }, { status: 502 });
      }
      return son(await r.arrayBuffer());
    }

    const voix = s(process.env.OPENAI_TTS_VOICE) || "nova";
    const ton =
      s(process.env.OPENAI_TTS_INSTRUCTIONS) ||
      // ELLE N'EST PAS UNE HÔTESSE D'ACCUEIL. Le ton du site vitrine — « accueil
      // premium » — vend quelque chose à un visiteur. Léa parle à quelqu'un qui
      // travaille, au milieu de son service : posée, familière, brève. Un
      // enthousiasme commercial dans une boulangerie à sept heures est insupportable.
      "Parle en français, d'une voix posée et familière, comme une collègue qui " +
      "connaît bien la personne. Débit naturel, phrases courtes, aucune " +
      "emphase commerciale.";
    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: voix,
        input: texte,
        instructions: ton,
        response_format: "mp3",
        speed: 1.05,
      }),
    });
    if (!r.ok) {
      console.error(`[parler] OpenAI a refusé : HTTP ${r.status}`);
      return NextResponse.json({ erreur: "Voix indisponible." }, { status: 502 });
    }
    return son(await r.arrayBuffer());
  } catch (e) {
    console.error(`[parler] impossible : ${(e as Error)?.message || "réseau"}`);
    return NextResponse.json({ erreur: "Voix indisponible." }, { status: 502 });
  }
}
