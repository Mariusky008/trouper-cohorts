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

  const apiKey = s(process.env.ELEVENLABS_API_KEY);
  if (!apiKey) return NextResponse.json({ error: "Voix cloud non configurée." }, { status: 503 });

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

  const voice = s(process.env.ELEVENLABS_VOICE_ID) || DEFAULT_VOICE;
  try {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_96`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "content-type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: "eleven_flash_v2_5", // rapide + économique, très bon en français
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );
    if (!r.ok) {
      let detail = "";
      try {
        detail = (await r.text()).slice(0, 220);
      } catch {
        /* corps illisible */
      }
      return NextResponse.json({ error: "tts_failed", status: r.status, detail }, { status: 502 });
    }
    const buf = await r.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Synthèse indisponible." }, { status: 502 });
  }
}
