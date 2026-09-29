/**
 * 🎙️ LA VOIX DU COMMERÇANT, CHEZ ELEVENLABS — créée, comptée, effacée.
 *
 * « Avec chaque commerçant, comment vais-je faire pour que ça puisse être
 * automatisé sans que j'aie à intervenir ? »
 *
 * TOUT CE QUI TOUCHE À SA VOIX PASSE PAR ICI, et nulle part ailleurs :
 *
 *   · `creerVoixClonee` — ses trois réponses enregistrées partent chez
 *     ElevenLabs (« Instant Voice Clone »), qui rend un identifiant ;
 *   · `supprimerVoixClonee` — l'identifiant est effacé CHEZ EUX, pas seulement
 *     chez nous : « supprimer ma voix » doit vouloir dire ce que ça dit ;
 *   · `transcrireReponse` — ce qu'il a raconté, retranscrit, nourrit ce que son
 *     double sait de lui ;
 *   · `voixAutorisee` / `compterSignes` — le plafond du mois.
 *
 * LES ENREGISTREMENTS NE SONT JAMAIS GARDÉS PAR CLIKME. Ils traversent le
 * serveur le temps de l'envoi, et c'est tout.
 *
 * FICHIER SERVEUR : il lit les clés.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { profilDuDouble } from "@/lib/direct/double-metiers";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";

const s = (v: unknown) => String(v ?? "").trim();

/** L'accord qu'il coche, mot pour mot — c'est ce texte qui est gardé avec sa date. */
export const ACCORD_VOIX =
  "J'accepte que ClikMe crée une copie de ma voix à partir de mes enregistrements, pour que le double de mon commerce réponde aux clients avec ma voix sur ClikMe, et uniquement là. Je peux la supprimer à tout moment depuis mon Espace Pro.";

/**
 * LES TROIS QUESTIONS POSÉES AU COMMERÇANT — spontanées, pour une voix spontanée.
 *
 * LA PREMIÈRE PARLE SON MÉTIER : « ton plat du jour » au restaurant, « le
 * bouquet du moment » chez la fleuriste. Demander son plat du jour à un
 * coiffeur, c'est lui dire que la carte a été faite pour quelqu'un d'autre.
 */
export function questionsVoix(activite: string): string[] {
  const p = profilDuDouble({ branche: brancheDuMetier(activite), metier: activite });
  const premiere =
    p.famille === "table"
      ? "Raconte-moi ton plat du jour, comme à un client au comptoir."
      : `Raconte-moi ${p.vedette}, comme à quelqu'un qui entre dans ${p.lieu.replace(/^(le|la|l')\s?/, (m) => (m === "le " ? "ton " : m === "la " ? "ta " : "ton "))}.`;
  return [premiere, "Pourquoi tu fais ce métier ? Qu'est-ce qui te plaît le plus ?", "Qu'est-ce que tu dirais à quelqu'un qui hésite à venir ?"];
}

/** Vrai quand ClikMe peut créer des voix : la clé ElevenLabs est posée. */
export function clonageDisponible(): boolean {
  return !!s(process.env.ELEVENLABS_API_KEY);
}

const BASE_ELEVEN = () => s(process.env.ELEVENLABS_BASE_URL) || "https://api.elevenlabs.io";

export type Enregistrement = { octets: Buffer; type: string; nom: string };

/** Un enregistrement en data-URL, ou `null` si ce n'en est pas un. */
export function lireEnregistrement(v: string, i: number): Enregistrement | null {
  const m = /^data:(audio\/[a-z0-9.+-]+)(?:;[^,]*)?;base64,([A-Za-z0-9+/=]+)$/i.exec(v);
  if (!m) return null;
  const type = m[1].toLowerCase();
  /* L'EXTENSION COMPTE POUR LES API, pas seulement le type : iPhone produit du
     `audio/mp4`, Chrome du `audio/webm`. Un fichier mal nommé se fait refuser
     sans que le son soit en cause. */
  const ext = type.includes("mp4") || type.includes("m4a") ? "m4a" : type.includes("ogg") ? "ogg" : type.includes("wav") ? "wav" : type.includes("mpeg") || type.includes("mp3") ? "mp3" : "webm";
  return { type, octets: Buffer.from(m[2], "base64"), nom: `reponse-${i + 1}.${ext}` };
}

/**
 * CRÉE SA VOIX CHEZ ELEVENLABS ET REND SON IDENTIFIANT.
 *
 * « Enlever le bruit de fond » est demandé : il enregistre dans sa cuisine,
 * pas dans un studio, et une hotte copiée avec la voix se réentendrait sous
 * chaque phrase de son double.
 */
export async function creerVoixClonee(
  nom: string,
  enregistrements: Enregistrement[],
): Promise<{ ok: true; voixId: string } | { ok: false; erreur: string }> {
  const cle = s(process.env.ELEVENLABS_API_KEY);
  if (!cle) return { ok: false, erreur: "La création de voix n'est pas encore activée sur ClikMe." };
  const form = new FormData();
  form.append("name", `ClikMe · ${nom}`.slice(0, 90));
  form.append("description", "Voix du double ClikMe, créée avec l'accord du commerçant.");
  form.append("remove_background_noise", "true");
  for (const e of enregistrements) form.append("files", new Blob([new Uint8Array(e.octets)], { type: e.type }), e.nom);
  try {
    const r = await fetch(`${BASE_ELEVEN()}/v1/voices/add`, {
      method: "POST",
      headers: { "xi-api-key": cle },
      body: form,
      signal: AbortSignal.timeout(60_000),
    });
    const j = (await r.json().catch(() => ({}))) as { voice_id?: unknown; detail?: unknown };
    if (!r.ok || !s(j.voice_id)) {
      console.info("[voix-clonee] création refusée", r.status, JSON.stringify(j.detail ?? j).slice(0, 300));
      return { ok: false, erreur: "La voix n'a pas pu être créée. Réessayez dans un endroit plus calme, en parlant un peu plus longtemps." };
    }
    return { ok: true, voixId: s(j.voice_id) };
  } catch {
    return { ok: false, erreur: "Le service de voix ne répond pas. Réessayez dans un instant." };
  }
}

/** Efface sa voix chez ElevenLabs. Une voix déjà absente compte comme effacée. */
export async function supprimerVoixClonee(voixId: string): Promise<boolean> {
  const cle = s(process.env.ELEVENLABS_API_KEY);
  if (!cle || !voixId) return !voixId;
  try {
    const r = await fetch(`${BASE_ELEVEN()}/v1/voices/${encodeURIComponent(voixId)}`, {
      method: "DELETE",
      headers: { "xi-api-key": cle },
    });
    return r.ok || r.status === 404;
  } catch {
    return false;
  }
}

/** Ce qu'il a dit, en texte — ou rien, sans jamais bloquer la création de sa voix. */
export async function transcrireReponse(e: Enregistrement): Promise<string> {
  const cle = s(process.env.OPENAI_API_KEY);
  if (!cle) return "";
  const essai = async (modele: string) => {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(e.octets)], { type: e.type }), e.nom);
    form.append("model", modele);
    form.append("language", "fr");
    const r = await fetch(`${s(process.env.OPENAI_BASE_URL) || "https://api.openai.com"}/v1/audio/transcriptions`, {
      method: "POST",
      headers: { authorization: `Bearer ${cle}` },
      body: form,
    });
    if (!r.ok) return null;
    const j = (await r.json().catch(() => ({}))) as { text?: unknown };
    return s(j.text);
  };
  try {
    return (await essai(s(process.env.OPENAI_TRANSCRIBE_MODEL) || "gpt-4o-mini-transcribe")) ?? (await essai("whisper-1")) ?? "";
  } catch {
    return "";
  }
}

/* ═══ LE PLAFOND DU MOIS ═══════════════════════════════════════════════════

   ELEVENLABS FACTURE AU SIGNE. Une conversation, c'est quelques centaines de
   signes ; un restaurant très regardé en ferait des centaines par jour. Le
   plafond borne ce qu'un seul commerce peut coûter dans le mois — au-delà, son
   double reprend la voix standard jusqu'au mois suivant, il ne se tait pas.
   `DOUBLE_VOIX_PLAFOND` le règle sans redéployer. */
const PLAFOND = () => {
  const n = Number(s(process.env.DOUBLE_VOIX_PLAFOND));
  return Number.isFinite(n) && n > 0 ? n : 50_000;
};
const moisCourant = () => new Date().toISOString().slice(0, 7);

/** Reste-t-il de quoi parler ce mois-ci avec sa voix ? */
export async function voixAutorisee(siteId: string, signes: number): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("human_vitrine_sites").select("double_voix_mois, double_voix_signes").eq("id", siteId).maybeSingle();
    const r = (data as Record<string, unknown> | null) ?? {};
    const deja = s(r.double_voix_mois) === moisCourant() ? Number(r.double_voix_signes) || 0 : 0;
    return deja + signes <= PLAFOND();
  } catch {
    return true;
  }
}

/** Ajoute les signes dits au compteur du mois. Au mieux : un compteur raté ne coupe pas une phrase. */
export async function compterSignes(siteId: string, signes: number): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("human_vitrine_sites").select("double_voix_mois, double_voix_signes").eq("id", siteId).maybeSingle();
    const r = (data as Record<string, unknown> | null) ?? {};
    const mois = moisCourant();
    const deja = s(r.double_voix_mois) === mois ? Number(r.double_voix_signes) || 0 : 0;
    await supabase.from("human_vitrine_sites").update({ double_voix_mois: mois, double_voix_signes: deja + signes }).eq("id", siteId);
  } catch {
    /* au mieux */
  }
}
