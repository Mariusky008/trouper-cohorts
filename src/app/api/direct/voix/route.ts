/**
 * 🎙️ LA VOIX DES COMMERÇANTS DE LA DÉMONSTRATION — trois récits, trois timbres.
 *
 * ═══ POURQUOI CETTE ROUTE EXISTE ═══════════════════════════════════════════
 *
 * « La voix est hyper robotique, il faut que tu trouves des voix naturelles. »
 *
 * L'ÉCRAN LISAIT LE TEXTE AVEC `speechSynthesis`, c'est-à-dire avec la voix du
 * système. Elle articule, elle ne raconte pas, et aucun réglage ne la rendra
 * chaleureuse — il n'y a pas de bouton « âme » dans l'API du navigateur.
 *
 * LE PROJET AVAIT DÉJÀ LA RÉPONSE, ET LE PARCOURS NE L'APPELAIT PAS.
 * `/api/site-internet/tts` sert des voix ElevenLabs ou OpenAI à l'Espace Pro et
 * à la maquette depuis des mois. Le parcours, lui, appelait `speak()` sans
 * jamais avoir appelé `initCloudTts` : il retombait donc sur la voix du
 * navigateur à chaque fois. C'était un branchement manquant, pas une limite.
 *
 * ═══ POURQUOI UNE ROUTE À PART, ET PAS CELLE QUI EXISTE ════════════════════
 *
 * L'AUTRE EST GARDÉE PAR UN `slug` de maquette : elle vérifie en base que le
 * site existe et qu'il n'est pas publié, pour qu'un site client en ligne
 * n'appelle jamais la voix payante. La démonstration `/autour-de-moi` n'a pas
 * de slug — elle n'est le site de personne.
 *
 * CELLE-CI SE GARDE AUTREMENT, ET MIEUX : elle n'accepte AUCUN texte. On lui
 * donne une clé de commerce, elle va chercher le récit dans les données et ne
 * peut synthétiser que ça. Trois phrases fixes, pas une de plus — il n'y a donc
 * aucune surface pour faire payer à quelqu'un d'autre la lecture de son
 * courrier. L'autre route, elle, accepte cinq cents caractères libres.
 *
 * ET COMME LES TEXTES SONT FIXES, LE RÉSULTAT SE GARDE EN CACHE. Une
 * synthèse par voix et par déploiement, pas une par écoute : c'est la
 * différence entre quelques centimes et une facture qui suit l'audience.
 *
 * SANS CLÉ CONFIGURÉE → 503, ET L'ÉCRAN RETOMBE SUR LA VOIX DU NAVIGATEUR.
 * La démonstration marche donc partout ; elle est seulement plus belle là où la
 * clé existe.
 */
import { NextResponse } from "next/server";
import { toutesLesCartes } from "@/lib/direct/apercu-habitant";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

/**
 * LE TIMBRE DE CHACUN, ET SA CONSIGNE DE JEU.
 *
 * Ses indications, mot pour mot : Margot « chaleureuse et souriante, comme si
 * elle parlait à un client, avec une petite pause après ça mijote doucement » ;
 * Chez Bergine « voix d'un homme avec un petit accent du sud » ; La Grande
 * Tablée « voix d'homme sans accent ».
 *
 * L'ACCENT EST UNE CONSIGNE, PAS UNE ORTHOGRAPHE. On n'écrit pas « putaing »
 * dans le texte pour le faire entendre : un accent transcrit se lit comme une
 * moquerie. `gpt-4o-mini-tts` prend justement une consigne de ton — c'est là
 * qu'il va, et un comédien lirait la même ligne.
 */
const TIMBRES: Record<string, { voix: string; ton: string }> = {
  emporter: {
    // Voix féminine, ronde. Sur ElevenLabs, remplacer par un ID via la variable.
    voix: "shimmer",
    ton: "Parle en français, voix de femme chaleureuse et souriante, comme une cuisinière qui parle à un client accoudé au comptoir. Débit posé, jamais pressé. Marque une petite pause après « ça mijote doucement ». Termine sur un sourire dans la voix.",
  },
  centre: {
    voix: "onyx",
    ton: "Parle en français, voix d'homme avec un léger accent du Sud-Ouest, celui des Landes. Posé, tranquille, un peu gourmand quand il parle de l'odeur. Ne force jamais l'accent : il s'entend dans la musique de la phrase, pas dans la caricature.",
  },
  tablee: {
    voix: "echo",
    ton: "Parle en français, voix d'homme, sans accent régional. Simple et direct, comme quelqu'un qui explique sa recette en deux phrases parce qu'il a du monde en salle. Chaleureux, pas solennel.",
  },
};

export async function GET(request: Request) {
  const cle = s(new URL(request.url).searchParams.get("cle"));
  const timbre = TIMBRES[cle];
  if (!timbre) return NextResponse.json({ error: "Voix inconnue." }, { status: 404 });

  /* LE TEXTE VIENT DES DONNÉES, JAMAIS DE LA REQUÊTE. C'est toute la garde de
     cette route : on ne peut faire dire que ce qui est déjà écrit. */
  const commerce = toutesLesCartes().find((c) => c.id === cle);
  const texte = s(commerce?.voix?.recit || commerce?.voix?.signature);
  if (!texte) return NextResponse.json({ error: "Rien à dire." }, { status: 404 });

  const elevenKey = s(process.env.ELEVENLABS_API_KEY);
  const openaiKey = s(process.env.OPENAI_TTS_API_KEY) || s(process.env.OPENAI_API_KEY);
  const force = s(process.env.SITE_TTS_PROVIDER).toLowerCase();
  const eleven = force === "elevenlabs" ? Boolean(elevenKey) : force === "openai" ? false : Boolean(elevenKey);
  const openai = force === "openai" ? Boolean(openaiKey) : force === "elevenlabs" ? false : !elevenKey && Boolean(openaiKey);
  if (!eleven && !openai) {
    return NextResponse.json({ error: "Voix cloud non configurée." }, { status: 503 });
  }

  /* UNE JOURNÉE DE CACHE, ET C'EST BEAUCOUP POUR TROIS PHRASES QUI NE BOUGENT
     PAS. `immutable` dit au navigateur de ne même pas revenir demander. */
  const son = (buf: ArrayBuffer) =>
    new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      },
    });

  try {
    if (eleven) {
      /* SUR ELEVENLABS, LA CONSIGNE DE TON N'EXISTE PAS : le timbre est dans le
         choix de la voix. On laisse donc l'installateur poser trois ID dans ses
         variables, et on retombe sur celui du projet à défaut. */
      const id =
        s(process.env[`ELEVENLABS_VOICE_${cle.toUpperCase().replace(/-/g, "_")}`]) ||
        s(process.env.ELEVENLABS_VOICE_ID) ||
        "21m00Tcm4TlvDq8ikWAM";
      const r = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(id)}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: { "xi-api-key": elevenKey, "content-type": "application/json" },
          body: JSON.stringify({
            text: texte,
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
          }),
        },
      );
      if (!r.ok) return NextResponse.json({ error: "tts_failed", status: r.status }, { status: 502 });
      return son(await r.arrayBuffer());
    }

    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: s(process.env[`OPENAI_TTS_VOICE_${cle.toUpperCase().replace(/-/g, "_")}`]) || timbre.voix,
        input: texte,
        instructions: timbre.ton,
        response_format: "mp3",
        /* UN PEU PLUS LENT QUE LA NORMALE. Ailleurs dans le produit la voix est
           vive parce qu'elle présente ; ici elle RACONTE, et une recette qu'on
           récite à toute vitesse ne donne pas faim. */
        speed: 0.96,
      }),
    });
    if (!r.ok) return NextResponse.json({ error: "tts_failed", status: r.status }, { status: 502 });
    return son(await r.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Synthèse indisponible." }, { status: 502 });
  }
}
