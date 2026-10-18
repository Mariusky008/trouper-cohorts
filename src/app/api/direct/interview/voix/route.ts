/**
 * 🎙️ LA VOIX DU FANTÔME REPORTER — pour les phrases qui ne sont pas encore enregistrées.
 *
 * « J'aime pas du tout la voix du fantôme interviewer, on dirait qu'il est
 * malade et très métallique. » Sa nouvelle voix a été enregistrée sur
 * ElevenLabs, phrase par phrase (`public/direct/interview/fantome/`, voir
 * `src/lib/direct/voix-fantome.ts`) : l'interview joue d'abord ces fichiers.
 * Le planning des interviews en demande davantage — plus de cent phrases par
 * métier. Celles qui manquent, cette route les fait dire par LA MÊME VOIX.
 *
 * ─── ELLE N'ACCEPTE AUCUN TEXTE LIBRE ────────────────────────────────────
 *
 * On lui donne une phrase et un métier ; elle ne la dit que si elle fait
 * partie des textes validés de ce métier — ses répliques, son planning
 * (`phrasesDuMetier`). Aucune surface pour faire lire n'importe quoi à une
 * voix payante. (`id=` : l'identifiant d'une réplique fixe, comme avant.)
 *
 * ─── UNE SEULE VOIX, OU AUCUNE ───────────────────────────────────────────
 *
 * Sans l'identifiant de sa voix (`INTERVIEW_VOIX_ID` sur Vercel, avec
 * `ELEVENLABS_API_KEY`), elle répond 503 — et l'écran ÉCRIT la question au
 * lieu de la faire dire. Plus de voix de remplacement : un reporter qui change
 * de voix d'une question à l'autre, c'est pire qu'une question écrite.
 *
 * ─── ET LE RÉSULTAT SE GARDE EN CACHE ────────────────────────────────────
 *
 * Les textes sont fixes : une synthèse par phrase et par version (`v` dans
 * l'adresse, voir `VERSION_VOIX`), pas une par interview. Après le premier
 * passage, le réseau de Vercel sert le fichier sans rappeler ElevenLabs.
 */
import { NextResponse } from "next/server";
import { IDS_REPLIQUES, REPLIQUES, SCRIPTS, repliquesDuScript, scriptDe, type IdReplique } from "@/lib/direct/interview-fantome";
import { BANQUES, phrasesDuMetier, type MetierPlanning } from "@/lib/direct/interview-planning";
import { cleDeReplique } from "@/lib/direct/voix-fantome";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

/** Un garde-fou de dépense pour les passages hors cache : une interview en demande une dizaine. */
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

/** Les phrases qu'un métier a le droit de faire dire, retrouvées par leur forme simple. */
const PERMISES = new Map<string, Map<string, string>>();
function permises(metier: string): Map<string, string> {
  const m = (metier in BANQUES ? metier : "table") as MetierPlanning;
  let p = PERMISES.get(m);
  if (!p) {
    const script = m in SCRIPTS ? scriptDe(m) : SCRIPTS.table;
    p = new Map([...phrasesDuMetier(m), ...repliquesDuScript(script).map((id) => REPLIQUES[id])].map((t) => [cleDeReplique(t), t]));
    PERMISES.set(m, p);
  }
  return p;
}

/** Ce que la voix prononce : « ClikMe » se dit « Clic Mi ». */
const dite = (texte: string) => texte.replace(/ClikMe/g, "Clic Mi");

async function elevenLabs(cle: string, voix: string, texte: string): Promise<{ son: ArrayBuffer; modele: string } | null> {
  const base = s(process.env.ELEVENLABS_BASE_URL) || "https://api.elevenlabs.io";
  // LE MODÈLE DE SES ENREGISTREMENTS D'ABORD (v3) ; un compte qui ne l'a pas retombe sur le multilingue.
  const modeles = [s(process.env.INTERVIEW_VOIX_MODELE) || "eleven_v3", "eleven_multilingual_v2"];
  for (const modele of [...new Set(modeles)]) {
    try {
      const r = await fetch(`${base}/v1/text-to-speech/${encodeURIComponent(voix)}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "xi-api-key": cle, "content-type": "application/json" },
        body: JSON.stringify({ text: texte, model_id: modele, voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 1.0 } }),
      });
      if (r.ok) return { son: await r.arrayBuffer(), modele };
      console.info(`[interview-voix] ElevenLabs ${modele} a refusé : HTTP ${r.status}`, (await r.text().catch(() => "")).slice(0, 200));
    } catch {
      /* réseau : on essaie le modèle suivant */
    }
  }
  return null;
}

export async function GET(request: Request) {
  const u = new URL(request.url);
  const id = s(u.searchParams.get("id"));
  let texte = "";
  if (id) {
    if (!IDS_REPLIQUES.includes(id as IdReplique)) return NextResponse.json({ erreur: "Réplique inconnue." }, { status: 404 });
    texte = REPLIQUES[id as IdReplique];
  } else {
    texte = permises(s(u.searchParams.get("m"))).get(cleDeReplique(s(u.searchParams.get("t")))) ?? "";
    if (!texte) return NextResponse.json({ erreur: "Phrase inconnue : la voix ne dit que les textes validés du métier." }, { status: 404 });
  }
  const cle = s(process.env.ELEVENLABS_API_KEY);
  const voix = s(process.env.INTERVIEW_VOIX_ID);
  if (!cle || !voix) return NextResponse.json({ erreur: "La voix du fantôme n'est pas encore réglée (INTERVIEW_VOIX_ID)." }, { status: 503 });
  const qui = s(request.headers.get("x-forwarded-for")).split(",")[0].trim() || "inconnu";
  if (tropSouvent(qui)) return NextResponse.json({ erreur: "Trop de synthèses sur cette heure." }, { status: 429 });

  const r = await elevenLabs(cle, voix, dite(texte));
  if (!r) return NextResponse.json({ erreur: "Voix indisponible." }, { status: 502 });
  return new NextResponse(r.son, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=2592000, immutable",
      "x-interview-voix": `elevenlabs:${r.modele}`,
    },
  });
}
