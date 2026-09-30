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
  ton: "Parle en français, voix chaleureuse de commerçant de quartier qui parle à un client entré dans sa boutique.",
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

/** Vrai quand une voix cloud est configurée — sinon l'écran garde celle du téléphone. */
export function voixCloudConfiguree(): boolean {
  return !!(s(process.env.ELEVENLABS_API_KEY) || s(process.env.OPENAI_TTS_API_KEY) || s(process.env.OPENAI_API_KEY));
}

type Options = {
  jeu?: string;
  vitesse?: number;
  spontane?: boolean;
  /** La voix que le commerçant a donnée lui-même (identifiant ElevenLabs), lue dans sa fiche. */
  voixClonee?: string;
  /** Le timbre OpenAI à prendre quand ce commerce n'a pas le sien — voir la route du double. */
  voixParDefaut?: string;
};

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
function fournisseur(cle: string, voixClonee = "", femme = false): { eleven: string; openai: string; idEleven: string } | null {
  const variable = cle.toUpperCase().replace(/-/g, "_");
  const elevenKey = s(process.env.ELEVENLABS_API_KEY);
  const openaiKey = s(process.env.OPENAI_TTS_API_KEY) || s(process.env.OPENAI_API_KEY);
  const force = s(process.env.SITE_TTS_PROVIDER).toLowerCase();
  /* LA VOIX QU'IL A DONNÉE DEPUIS SON ESPACE PRO PASSE AVANT CELLE POSÉE À LA
     MAIN SUR VERCEL : c'est la sienne, et elle arrive sans que personne n'ait
     à toucher un réglage. */
  const saVoix = s(voixClonee) || s(process.env[`ELEVENLABS_VOICE_${variable}`]);
  /* UNE VOIX DE FEMME POUR CELLES QUI PARLENT AU FÉMININ, quand toutes les
     boutiques passent chez ElevenLabs (`SITE_TTS_PROVIDER=elevenlabs`) :
     une fleuriste ne répond pas avec la voix d'un boucher. */
  const idEleven =
    saVoix ||
    (femme ? s(process.env.ELEVENLABS_VOICE_ID_FEMME) : "") ||
    s(process.env.ELEVENLABS_VOICE_ID) ||
    "21m00Tcm4TlvDq8ikWAM";
  const eleven =
    force === "openai" ? false : force === "elevenlabs" ? !!elevenKey : !!elevenKey && (!!saVoix || !openaiKey);
  /* OPENAI RESTE EN RÉSERVE MÊME QUAND ELEVENLABS PARLE : voir `appeler`. */
  const openai = openaiKey && force !== "elevenlabs" ? openaiKey : "";
  if (eleven) return { eleven: elevenKey, openai, idEleven };
  if (openai) return { eleven: "", openai, idEleven };
  return null;
}

/**
 * L'APPEL LUI-MÊME — ELEVENLABS S'IL PARLE POUR CE COMMERCE, ET OPENAI EN RÉSERVE.
 *
 * « Sur la page commerçant, les voix sont encore robotiques. »
 *
 * UN REFUS D'ELEVENLABS NE DOIT JAMAIS FINIR EN VOIX ROBOT. Un compte gratuit
 * refuse les voix clonées (« Upgrade to use your cloned voice »), un quota
 * s'épuise, une voix est supprimée : la route renvoyait alors une erreur, et
 * l'écran passait la parole au téléphone. Maintenant le serveur reprend tout
 * de suite avec le timbre OpenAI — une autre voix, mais une vraie.
 */
async function appeler(cle: string, texte: string, o: Options): Promise<Response | { statut: number; erreur: string }> {
  const timbre = TIMBRES[cle] ?? TIMBRE_PAR_DEFAUT;
  const variable = cle.toUpperCase().replace(/-/g, "_");
  const voixOpenAI = s(process.env[`OPENAI_TTS_VOICE_${variable}`]) || (TIMBRES[cle] ? timbre.voix : o.voixParDefaut || timbre.voix);
  const f = fournisseur(cle, o.voixClonee, /^(shimmer|nova|coral)$/.test(voixOpenAI));
  if (!f) return { statut: 503, erreur: "Voix cloud non configurée." };
  const { jeu = "", vitesse = 0.96, spontane = false } = o;

  if (f.eleven) {
    try {
      /* SUR ELEVENLABS, LA CONSIGNE DE TON N'EXISTE PAS : le timbre est dans
         la voix elle-même — c'est pour ça qu'on y met une voix clonée.
         EN CONVERSATION, LE MODÈLE « FLASH » : deux fois moins cher au signe
         que « Multilingual v2 », et plus rapide à répondre — c'est ce qui
         compte quand quelqu'un attend la réponse. Le récit, lui, garde le
         modèle le plus riche. Les deux se changent par variable. */
      const modele = spontane
        ? s(process.env.ELEVENLABS_MODEL_CONVERSATION) || "eleven_flash_v2_5"
        : s(process.env.ELEVENLABS_MODEL) || "eleven_multilingual_v2";
      const r = await fetch(
        `${s(process.env.ELEVENLABS_BASE_URL) || "https://api.elevenlabs.io"}/v1/text-to-speech/${encodeURIComponent(f.idEleven)}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: { "xi-api-key": f.eleven, "content-type": "application/json" },
          body: JSON.stringify({
            text: texte,
            model_id: modele,
            voice_settings: spontane
              ? { stability: 0.34, similarity_boost: 0.85, style: 0.45, use_speaker_boost: true }
              : { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
          }),
        },
      );
      if (r.ok && r.body) return r;
      console.info("[voix] ElevenLabs a refusé, on reprend avec OpenAI", r.status, (await r.text().catch(() => "")).slice(0, 200));
    } catch {
      /* réseau : on tente OpenAI */
    }
    if (!f.openai) return { statut: 502, erreur: "tts_failed" };
  }

  try {
    const r = await fetch(`${s(process.env.OPENAI_TTS_BASE_URL) || "https://api.openai.com"}/v1/audio/speech`, {
      method: "POST",
      headers: { Authorization: `Bearer ${f.openai}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: s(process.env.OPENAI_TTS_MODEL) || "gpt-4o-mini-tts",
        voice: voixOpenAI,
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

/** FAIT DIRE `texte` AVEC LE TIMBRE DE `cle`, d'un bloc. */
export async function faireParler(cle: string, texte: string, o: Options = {}): Promise<ResultatVoix> {
  const r = await appeler(cle, texte, o);
  if (!(r instanceof Response)) return { ok: false, ...r };
  return { ok: true, son: await r.arrayBuffer() };
}
