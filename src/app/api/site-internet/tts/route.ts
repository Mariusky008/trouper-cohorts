// Voix cloud premium (ElevenLabs) — DÉMO UNIQUEMENT, pour l'effet « waouh » en
// rendez-vous. Payante à l'usage → strictement bornée :
//  - scope "apercu" : la maquette doit exister ET ne PAS être publiée. Un site
//    en ligne chez un client n'appelle jamais la voix payante (voix navigateur).
//  - scope "pro"    : jeton privé pro_token exigé.
//  - texte plafonné à 500 caractères, nettoyé des emojis.
// Sans ELEVENLABS_API_KEY → 503, le client retombe sur la voix du navigateur.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const MAX_CHARS = 500;

// Voix par défaut : multilingue ElevenLabs. Remplaçable par ELEVENLABS_VOICE_ID
// (choisir une voix française dans la bibliothèque ElevenLabs → coller son ID).
const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM";

const cleanText = (t: string) =>
  t
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2022}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CHARS);

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const scope = s(p?.scope);
  const token = s(p?.token);
  const text = cleanText(s(p?.text));
  if (!slug || !text || (scope !== "apercu" && scope !== "pro")) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  // Choix du fournisseur : ElevenLabs OU OpenAI (pay-as-you-go). SITE_TTS_PROVIDER
  // force le choix ; sinon on prend ElevenLabs si sa clé existe, sinon OpenAI.
  const elevenKey = s(process.env.ELEVENLABS_API_KEY);
  // Clé DÉDIÉE au TTS en priorité (pour utiliser un compte OpenAI distinct/crédité
  // sans toucher à l'OPENAI_API_KEY déjà utilisée ailleurs dans l'app).
  const openaiKey = s(process.env.OPENAI_TTS_API_KEY) || s(process.env.OPENAI_API_KEY);
  const forced = s(process.env.SITE_TTS_PROVIDER).toLowerCase();
  const useEleven = forced === "elevenlabs" ? Boolean(elevenKey) : forced === "openai" ? false : Boolean(elevenKey);
  const useOpenai = forced === "openai" ? Boolean(openaiKey) : forced === "elevenlabs" ? false : !elevenKey && Boolean(openaiKey);
  if (!useEleven && !useOpenai) return NextResponse.json({ error: "Voix cloud non configurée." }, { status: 503 });

  // Garde-fous d'accès (la voix payante ne sert QUE la démo).
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, published, pro_token")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? null;
  if (!row) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  if (scope === "pro") {
    if (!row.pro_token || s(row.pro_token) !== token) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  } else if (row.published) {
    // Maquette publiée = site client réel → pas de voix payante.
    return NextResponse.json({ error: "Réservé à la démo." }, { status: 403 });
  }

  const audioResponse = (buf: ArrayBuffer) =>
    new NextResponse(buf, { status: 200, headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  const upstreamError = async (r: Response) => {
    let detail = "";
    try { detail = (await r.text()).slice(0, 220); } catch { /* illisible */ }
    return NextResponse.json({ error: "tts_failed", status: r.status, detail }, { status: 502 });
  };

  try {
    if (useEleven) {
      const voice = s(process.env.ELEVENLABS_VOICE_ID) || DEFAULT_VOICE;
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_96`, {
        method: "POST",
        headers: { "xi-api-key": elevenKey, "content-type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: "eleven_flash_v2_5",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });
      if (!r.ok) return upstreamError(r);
      return audioResponse(await r.arrayBuffer());
    }
    // OpenAI TTS : payant à l'usage, sans abonnement. Voix chaleureuses (nova…).
    // gpt-4o-mini-tts accepte une CONSIGNE DE TON → on demande un accueil premium.
    const voice = s(process.env.OPENAI_TTS_VOICE) || "nova";
    const instructions =
      s(process.env.OPENAI_TTS_INSTRUCTIONS) ||
      "Parle en français avec une voix chaleureuse, souriante et dynamique, comme un accueil premium et bienveillant. Débit vif et vivant, légèrement soutenu (sans se presser), avec des intonations engageantes.";
    // Débit un peu plus rapide (voix vivante, présentation courte). Réglable via
    // OPENAI_TTS_SPEED (0.25–4.0). 1.12 = ~12 % plus vif que la normale.
    const speedRaw = Number(s(process.env.OPENAI_TTS_SPEED));
    const speed = Number.isFinite(speedRaw) && speedRaw >= 0.5 && speedRaw <= 2 ? speedRaw : 1.12;
    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini-tts", voice, input: text, instructions, response_format: "mp3", speed }),
    });
    if (!r.ok) return upstreamError(r);
    return audioResponse(await r.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Synthèse indisponible." }, { status: 502 });
  }
}
