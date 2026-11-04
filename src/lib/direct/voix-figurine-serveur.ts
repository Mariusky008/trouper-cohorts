/**
 * ✍️ ELLE DIT CE QU'IL ÉCRIT — un texte lu par une voix ElevenLabs (4 novembre 2026 : « on devrait pouvoir la faire
 * parler avec une voix lambda en mettant un texte »). C'est la seule voix fabriquée de ClikMe, décidée par le
 * propriétaire ; jamais la voix du téléphone. Voir `VOIX_FIGURINE` (`ma-figurine.ts`).
 *
 * RÉGLAGES (variables d'environnement) :
 *   · `ELEVENLABS_API_KEY` — sans elle, pas de texte lu : sa propre voix reste ;
 *   · `ELEVENLABS_VOIX_FIGURINE` — « douce:<id>,petillante:<id>,chaleureuse:<id>,posee:<id> » : les voix de son compte
 *     (Emma, Nicolas…) ; sinon, quatre voix de base d'ElevenLabs, qui parlent français avec le modèle multilingue ;
 *   · `ELEVENLABS_MODELE` — `eleven_multilingual_v2` par défaut.
 *
 * FICHIER SERVEUR.
 */
import type { CleVoix } from "./ma-figurine";

const s = (v: unknown) => (v == null ? "" : String(v)).trim();

/** Les voix de base d'ElevenLabs (Sarah, Laura, George, Daniel) : celles de tous les comptes. */
const PAR_DEFAUT: Record<CleVoix, string> = {
  douce: "EXAVITQu4vr4xnSDxMaL",
  petillante: "FGY2WhTYpPnrIDTdsKH5",
  chaleureuse: "JBFqnCBsd6RMkjVDRZzb",
  posee: "onwK4e9ZLuTAKqWW03F9",
};

export const voixBranchee = () => Boolean(s(process.env.ELEVENLABS_API_KEY));

function idDe(voix: CleVoix): string {
  const reglage = s(process.env.ELEVENLABS_VOIX_FIGURINE);
  for (const morceau of reglage.split(",")) {
    const [cle, id] = morceau.split(":").map((x) => x.trim());
    if (cle === voix && /^[A-Za-z0-9]{10,40}$/.test(id ?? "")) return id;
  }
  return PAR_DEFAUT[voix];
}

/** Le texte, lu par la voix choisie : un MP3. */
export async function lireLeTexte(texte: string, voix: CleVoix): Promise<{ mp3: Buffer } | { erreur: string; statut: number }> {
  const cle = s(process.env.ELEVENLABS_API_KEY);
  if (!cle) return { erreur: "La voix à partir d’un texte n’est pas encore branchée : enregistre ta voix.", statut: 503 };
  if (!texte) return { erreur: "Écris d’abord ce qu’elle doit dire.", statut: 400 };
  const base = s(process.env.ELEVENLABS_BASE_URL) || "https://api.elevenlabs.io";
  let r: Response;
  try {
    r = await fetch(`${base}/v1/text-to-speech/${idDe(voix)}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": cle, "content-type": "application/json", accept: "audio/mpeg" },
      body: JSON.stringify({
        text: texte,
        model_id: s(process.env.ELEVENLABS_MODELE) || "eleven_multilingual_v2",
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true },
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return { erreur: "La voix a mis trop de temps. Réessaie.", statut: 504 };
  }
  if (!r.ok) {
    console.error("[voix] refus d'ElevenLabs", JSON.stringify({ statut: r.status, pourquoi: (await r.text().catch(() => "")).slice(0, 300) }));
    return { erreur: "La voix n’a pas pu lire ce texte. Réessaie dans un instant.", statut: 502 };
  }
  const mp3 = Buffer.from(await r.arrayBuffer());
  return mp3.length ? { mp3 } : { erreur: "La voix n’a rien rendu. Réessaie.", statut: 502 };
}
