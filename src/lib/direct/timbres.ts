/**
 * 🎙️ LES TIMBRES DES CUISINIERS, ET LA MACHINE QUI LES FAIT PARLER.
 *
 * ═══ POURQUOI CE FICHIER EXISTE ════════════════════════════════════════════
 *
 * « La voix est très métallique et robotique, peux-tu mettre une voix
 * naturelle et spontanée ? »
 *
 * LE RÉCIT DU PARCOURS AVAIT DÉJÀ SA VRAIE VOIX — voir `api/direct/voix`. LE
 * DOUBLE, LUI, PARLAIT AVEC CELLE DU TÉLÉPHONE : `speechSynthesis`, qui
 * articule sans jouer. On entendait donc Jean-Marie raconter son magret avec
 * une voix d'homme du Sud-Ouest, puis son double lui répondre avec la voix d'un
 * GPS. C'est ce contraste-là qui sonnait métallique.
 *
 * LES DEUX ROUTES PRENNENT MAINTENANT LE MÊME TIMBRE ICI : un cuisinier n'a
 * qu'une voix, qu'il raconte ou qu'il réponde. Seul le JEU change — voir
 * `JEU_CONVERSATION`.
 *
 * FICHIER SERVEUR : il lit les clés, il ne doit jamais partir au navigateur.
 */

const s = (v: unknown) => String(v ?? "").trim();

export type Timbre = { voix: string; ton: string };

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
export const TIMBRES: Record<string, Timbre> = {
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
  /* LA TROISIEME CUISINE DE LA DEMONSTRATION, ET SANS TIMBRE ELLE SERAIT
     RESTEE MUETTE. La route répond 404 pour une clé qu'elle ne connaît pas, et
     l'écran retombe alors sur la voix du téléphone — celle qui articule sans
     raconter, et qui l'avait choqué. Une donnée ajoutée d'un côté doit être
     ajoutée de l'autre : c'est le prix d'avoir deux fichiers pour une voix. */
  "deux-rues": {
    voix: "nova",
    ton: "Parle en français, voix de femme d'une soixantaine d'années, posée et chaleureuse, avec la musique du Pays basque sans jamais la caricaturer. Elle prend son temps — c'est le sujet même de ce qu'elle raconte. Un peu de fierté tranquille sur la dernière phrase.",
  },
  /* LES TROIS AUTRES N'ONT PAS DE RÉCIT, MAIS LEUR DOUBLE PARLE. Sans timbre,
     Serge et Amanieu répondraient avec la voix par défaut — la même pour tout
     le monde, et c'est comme ça qu'un double redevient un robot. */
  boulange: {
    voix: "ash",
    ton: "Parle en français, voix d'homme d'une quarantaine d'années, boulanger levé depuis quatre heures du matin : chaleureux, un peu malicieux, fier de son pain sans le dire.",
  },
  boucher: {
    voix: "ballad",
    ton: "Parle en français, voix d'homme franche et joviale, un boucher de quartier qui connaît ses clients par leur prénom. Direct, généreux, un rire dans la voix.",
  },
  traiteur: {
    voix: "sage",
    ton: "Parle en français, voix chaleureuse et soignée, celle d'une maison de traiteur familiale qui reçoit bien. Accueillante, précise, jamais guindée.",
  },
};

/** Le timbre de repli, pour un restaurant qui n'a pas encore le sien. */
export const TIMBRE_PAR_DEFAUT: Timbre = {
  voix: "ash",
  ton: "Parle en français, voix chaleureuse de restaurateur qui parle à un client au comptoir.",
};

/**
 * LE JEU D'UNE CONVERSATION, AJOUTÉ AU TIMBRE.
 *
 * LE RÉCIT SE RACONTE, LA CONVERSATION SE RÉPOND. Même voix, autre jeu : plus
 * vif, plus spontané, avec les petites respirations de quelqu'un qui répond du
 * tac au tac et qui sourit. Sans cette phrase, le double lisait ses réponses
 * comme on lit un communiqué — juste, et sans vie.
 */
export const JEU_CONVERSATION =
  "Tu réponds à quelqu'un dans une vraie conversation, pas une lecture : spontané, naturel, détendu, comme au comptoir entre deux assiettes. Débit vivant, un peu plus rapide qu'un récit. Souris quand tu dis bonjour. Petites respirations naturelles, intonation qui monte sur les questions. Jamais de ton d'annonce ni de voix de répondeur.";

export type ResultatVoix = { ok: true; son: ArrayBuffer } | { ok: false; statut: number; erreur: string };
export type FluxVoix = { ok: true; flux: ReadableStream<Uint8Array> } | { ok: false; statut: number; erreur: string };

/** Vrai quand une voix cloud est configurée — sinon l'écran garde celle du téléphone. */
export function voixCloudConfiguree(): boolean {
  return !!(s(process.env.ELEVENLABS_API_KEY) || s(process.env.OPENAI_TTS_API_KEY) || s(process.env.OPENAI_API_KEY));
}

type Options = { jeu?: string; vitesse?: number; spontane?: boolean };

/**
 * QUI FAIT LA VOIX DE CE COMMERCE : ELEVENLABS OU OPENAI.
 *
 * « Si je te donne ma voix, tu peux la mettre ? »
 *
 * UNE VOIX CLONÉE VIT CHEZ ELEVENLABS, et elle appartient à UN cuisinier.
 * Avant, la seule présence de la clé ElevenLabs faisait passer TOUT LE MONDE
 * chez eux — Margot et Maïté se seraient retrouvées avec une voix anglaise par
 * défaut. Maintenant ElevenLabs ne parle que pour le commerce qui a SA voix
 * (`ELEVENLABS_VOICE_CENTRE=…` pour Chez Bergine) ; les autres gardent leur
 * timbre OpenAI. `SITE_TTS_PROVIDER` force encore l'un ou l'autre pour tous.
 */
function fournisseur(cle: string): { eleven: string; openai: string; idEleven: string } | null {
  const variable = cle.toUpperCase().replace(/-/g, "_");
  const elevenKey = s(process.env.ELEVENLABS_API_KEY);
  const openaiKey = s(process.env.OPENAI_TTS_API_KEY) || s(process.env.OPENAI_API_KEY);
  const force = s(process.env.SITE_TTS_PROVIDER).toLowerCase();
  const saVoix = s(process.env[`ELEVENLABS_VOICE_${variable}`]);
  const idEleven = saVoix || s(process.env.ELEVENLABS_VOICE_ID) || "21m00Tcm4TlvDq8ikWAM";
  const eleven =
    force === "openai" ? false : force === "elevenlabs" ? !!elevenKey : !!elevenKey && (!!saVoix || !openaiKey);
  if (eleven) return { eleven: elevenKey, openai: "", idEleven };
  if (openaiKey && force !== "elevenlabs") return { eleven: "", openai: openaiKey, idEleven };
  return null;
}

/** L'appel lui-même — la réponse brute, pour la lire d'un bloc ou au fil de l'eau. */
async function appeler(cle: string, texte: string, o: Options, flux: boolean): Promise<Response | { statut: number; erreur: string }> {
  const f = fournisseur(cle);
  if (!f) return { statut: 503, erreur: "Voix cloud non configurée." };
  const timbre = TIMBRES[cle] ?? TIMBRE_PAR_DEFAUT;
  const variable = cle.toUpperCase().replace(/-/g, "_");
  const { jeu = "", vitesse = 0.96, spontane = false } = o;
  try {
    const r = f.eleven
      ? /* SUR ELEVENLABS, LA CONSIGNE DE TON N'EXISTE PAS : le timbre est dans
           la voix elle-même — c'est pour ça qu'on y met une voix clonée.
           EN CONVERSATION, UN PEU MOINS DE STABILITÉ ET UN PEU PLUS DE STYLE :
           c'est ce qui laisse passer les variations d'une voix qui répond. */
        await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(f.idEleven)}${flux ? "/stream" : ""}?output_format=mp3_44100_128`,
          {
            method: "POST",
            headers: { "xi-api-key": f.eleven, "content-type": "application/json" },
            body: JSON.stringify({
              text: texte,
              model_id: s(process.env.ELEVENLABS_MODEL) || "eleven_multilingual_v2",
              voice_settings: spontane
                ? { stability: 0.34, similarity_boost: 0.85, style: 0.45, use_speaker_boost: true }
                : { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
            }),
          },
        )
      : await fetch(`${s(process.env.OPENAI_TTS_BASE_URL) || "https://api.openai.com"}/v1/audio/speech`, {
          method: "POST",
          headers: { Authorization: `Bearer ${f.openai}`, "content-type": "application/json" },
          body: JSON.stringify({
            model: s(process.env.OPENAI_TTS_MODEL) || "gpt-4o-mini-tts",
            voice: s(process.env[`OPENAI_TTS_VOICE_${variable}`]) || timbre.voix,
            input: texte,
            instructions: jeu ? `${timbre.ton} ${jeu}` : timbre.ton,
            response_format: "mp3",
            speed: vitesse,
          }),
        });
    if (!r.ok || !r.body) return { statut: 502, erreur: `tts_failed ${r.status}` };
    return r;
  } catch {
    return { statut: 502, erreur: "Synthèse indisponible." };
  }
}

/** FAIT DIRE `texte` AVEC LE TIMBRE DE `cle`, d'un bloc — pour ce qu'on garde en cache. */
export async function faireParler(cle: string, texte: string, o: Options = {}): Promise<ResultatVoix> {
  const r = await appeler(cle, texte, o, false);
  if (!(r instanceof Response)) return { ok: false, ...r };
  return { ok: true, son: await r.arrayBuffer() };
}

/**
 * LA MÊME CHOSE, AU FIL DE L'EAU.
 *
 * « Au début c'est la voix normale, et dès qu'on commence à échanger ça
 * devient la voix robotique. »
 *
 * LE BONJOUR EST COURT, SA VOIX ARRIVAIT À TEMPS. Une réponse de deux phrases
 * demandait plusieurs secondes de fabrication AVANT le premier octet, l'écran
 * perdait patience et passait la parole à la voix du téléphone. En flux, le
 * son part dès sa première syllabe fabriquée : le navigateur commence à jouer
 * pendant que la suite arrive.
 */
export async function faireParlerEnFlux(cle: string, texte: string, o: Options = {}): Promise<FluxVoix> {
  const r = await appeler(cle, texte, o, true);
  if (!(r instanceof Response)) return { ok: false, ...r };
  return { ok: true, flux: r.body as ReadableStream<Uint8Array> };
}
