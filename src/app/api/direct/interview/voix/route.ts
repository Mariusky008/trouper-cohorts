/**
 * 🎙️ LA VOIX DU REPORTER DE L'INTERVIEW — « la voix de Jean-Marie ».
 *
 * « J'aimerais que l'interviewer fantôme ait la voix qu'on a déjà, celle de
 * Jean-Marie quand il parle et que son ardoise s'écrit. » Cette voix-là n'est
 * pas un enregistrement de quelqu'un : le fichier du magret vient d'ElevenLabs
 * (« Liam — Energetic Social Media Creator », réglages 100 / 50 / 75, modèle
 * v3, d'après son nom de fichier). On peut donc faire dire au reporter ses
 * propres phrases avec exactement la même voix — c'est ce que fait cette route.
 *
 * ─── ELLE N'ACCEPTE AUCUN TEXTE ──────────────────────────────────────────
 *
 * Comme `api/direct/voix` : on lui donne l'identifiant d'une réplique, elle va
 * chercher le texte dans `interview-fantome.ts` et ne peut synthétiser que ça.
 * Aucune surface pour faire lire n'importe quoi à une voix payante.
 *
 * ─── ET LE RÉSULTAT SE GARDE EN CACHE ────────────────────────────────────
 *
 * Les textes sont fixes : une synthèse par réplique et par version (`v` dans
 * l'adresse), pas une par interview. Après le premier passage, le réseau de
 * Vercel sert le fichier sans rappeler ElevenLabs.
 *
 * ─── SANS ELEVENLABS ─────────────────────────────────────────────────────
 *
 * OpenAI d'abord s'il est configuré (une autre voix, mais naturelle), sinon
 * 503 — et l'écran prend les répliques de secours, enregistrées une fois pour
 * toutes dans `public/direct/interview/voix/`. L'en-tête `x-interview-voix`
 * dit laquelle a parlé : l'écran d'essai l'affiche, on ne devine pas.
 *
 * Réglages sur Vercel, sans toucher au code : `INTERVIEW_VOIX_ID` (l'identifiant
 * ElevenLabs de la voix), `INTERVIEW_VOIX_MODELE`.
 */
import { NextResponse } from "next/server";
import { IDS_REPLIQUES, repliqueDite, type IdReplique } from "@/lib/direct/interview-fantome";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

/** Liam, des voix prêtes à l'emploi d'ElevenLabs — celle du fichier du magret. */
const LIAM = "TX3LPaxmHKxFdv7VOQHJ";

/** Un garde-fou de dépense pour les passages hors cache : onze répliques par interview. */
const VU = new Map<string, { n: number; depuis: number }>();
const PAR_HEURE = 120;
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

async function elevenLabs(cle: string, texte: string): Promise<{ son: ArrayBuffer; modele: string } | null> {
  const voix = s(process.env.INTERVIEW_VOIX_ID) || LIAM;
  const base = s(process.env.ELEVENLABS_BASE_URL) || "https://api.elevenlabs.io";
  // LE MODÈLE DU FICHIER D'ABORD (v3) ; un compte qui ne l'a pas retombe sur le multilingue.
  const modeles = [s(process.env.INTERVIEW_VOIX_MODELE) || "eleven_v3", "eleven_multilingual_v2"];
  for (const modele of [...new Set(modeles)]) {
    try {
      const r = await fetch(`${base}/v1/text-to-speech/${encodeURIComponent(voix)}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "xi-api-key": cle, "content-type": "application/json" },
        body: JSON.stringify({
          text: texte,
          model_id: modele,
          // les réglages du fichier du magret : vitesse 1,00 · stabilité 50 % · similarité 75 %
          voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 1.0 },
        }),
      });
      if (r.ok) return { son: await r.arrayBuffer(), modele };
      console.info(`[interview-voix] ElevenLabs ${modele} a refusé : HTTP ${r.status}`, (await r.text().catch(() => "")).slice(0, 200));
    } catch {
      /* réseau : on essaie le modèle suivant */
    }
  }
  return null;
}

async function openAI(cle: string, texte: string): Promise<ArrayBuffer | null> {
  try {
    const r = await fetch(`${s(process.env.OPENAI_TTS_BASE_URL) || "https://api.openai.com"}/v1/audio/speech`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cle}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: s(process.env.OPENAI_TTS_MODEL) || "gpt-4o-mini-tts",
        voice: "ash",
        input: texte,
        instructions:
          "Parle en français, voix d'homme jeune et enjouée, comme un reporter de radio locale qui fait une interview " +
          "sympathique dans un restaurant. Débit vif, sourire dans la voix, jamais commercial.",
        response_format: "mp3",
      }),
    });
    return r.ok ? await r.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const id = s(new URL(request.url).searchParams.get("id")) as IdReplique;
  if (!IDS_REPLIQUES.includes(id)) return NextResponse.json({ erreur: "Réplique inconnue." }, { status: 404 });
  const elevenKey = s(process.env.ELEVENLABS_API_KEY);
  const openaiKey = s(process.env.OPENAI_TTS_API_KEY) || s(process.env.OPENAI_API_KEY);
  if (!elevenKey && !openaiKey) return NextResponse.json({ erreur: "Voix non configurée." }, { status: 503 });
  const qui = s(request.headers.get("x-forwarded-for")).split(",")[0].trim() || "inconnu";
  if (tropSouvent(qui)) return NextResponse.json({ erreur: "Trop de synthèses sur cette heure." }, { status: 429 });

  const texte = repliqueDite(id);
  let son: ArrayBuffer | null = null;
  let voixUtilisee = "";
  if (elevenKey) {
    const r = await elevenLabs(elevenKey, texte);
    if (r) {
      son = r.son;
      voixUtilisee = `elevenlabs:${r.modele}`;
    }
  }
  if (!son && openaiKey) {
    son = await openAI(openaiKey, texte);
    if (son) voixUtilisee = "openai:ash";
  }
  if (!son) return NextResponse.json({ erreur: "Voix indisponible." }, { status: 502 });
  return new NextResponse(son, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=2592000, immutable",
      "x-interview-voix": voixUtilisee,
    },
  });
}
