// TRANSCRIRE CE QUE LE COMMERÇANT VIENT DE DIRE.
//
// ─── POURQUOI CETTE ROUTE EXISTE AVANT L'ASSISTANTE ───────────────────────
//
// L'espace commerçant qu'on va construire repose sur une phrase : « il raconte
// sa journée, l'assistante s'occupe du reste ». Tout tient donc à une question
// qu'on n'a jamais mesurée — QUI transforme sa voix en texte, et est-ce que ça
// marche dans une boulangerie à sept heures du matin.
//
// IL Y A DEUX CHEMINS, ET ILS N'ONT PAS LES MÊMES DÉFAUTS.
//
//   A · LE TÉLÉPHONE LE FAIT SEUL. C'est le moteur de dictée du navigateur, le
//       même que le petit micro du clavier. Gratuit, instantané, rien à envoyer
//       nulle part. Mais sur iPhone il est capricieux : il se coupe, il supporte
//       mal les silences — le commerçant qui réfléchit deux secondes l'arrête —
//       et il n'existe pas partout. Ce qui lâche pendant une démarche lâche
//       devant le prospect.
//
//   B · ON ENREGISTRE ET UN SERVEUR TRANSCRIT. C'est cette route. Fiable,
//       identique partout, bien meilleure sur les accents et le bruit. Le prix :
//       une à deux secondes d'attente, et ça se paie à la minute.
//
// ON NE TRANCHE PAS ICI, ON MESURE. `/autour-de-moi/essai-voix` fait parler les
// deux en même temps et affiche ce que chacun a compris. La décision se prend
// sur un iPhone, dans un endroit bruyant, pas dans un fichier.
//
// ─── ET LE VRAI RISQUE N'EST PAS LA LATENCE ───────────────────────────────
//
// C'est le CHIFFRE. « Quatorze euros » qui devient « quatre euros » publié à
// toute une ville, c'est un client qui arrive avec quatre euros pour un plat à
// quatorze — et un commerçant qui n'y revient pas. Aucune transcription n'est
// fiable à cent pour cent dans un commerce en activité. C'est pour ça que la
// carte de validation n'est pas un confort mais la condition d'existence du
// vocal : on montre trois chiffres, il valide d'un doigt, et une erreur coûte
// un doigt au lieu d'une journée.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

/**
 * DIX MÉGAOCTETS, ET C'EST LARGE. Une minute d'audio compressé en pèse moins
 * d'un ; au-delà, c'est un enregistrement oublié en marche, pas une phrase.
 */
const MAX_AUDIO = 10_000_000;

/**
 * LE MODÈLE, RÉGLABLE SANS TOUCHER AU CODE. `whisper-1` est le socle qui existe
 * sur tous les comptes ; les modèles plus récents transcrivent mieux le français
 * bruité mais ne sont pas ouverts partout. On essaie celui qui est demandé, et
 * on retombe sur le socle plutôt que de rendre une erreur — la mesure doit
 * aboutir même sur un compte minimal.
 */
const MODELE = s(process.env.OPENAI_TRANSCRIBE_MODEL) || "gpt-4o-mini-transcribe";
const SOCLE = "whisper-1";

/**
 * CE QU'ON SOUFFLE AU MODÈLE — et c'est exactement ce que l'assistante lui
 * soufflera. Un modèle de transcription qui sait de quoi on parle se trompe
 * moins sur les mots rares ; lui dire « commerce, prix en euros, portions »
 * coûte trois lignes et rattrape une partie du bruit de fond. Ce n'est PAS une
 * autorisation d'inventer : c'est du vocabulaire, pas du contenu.
 */
const CONTEXTE =
  "Commerce de proximité à Dax. Le commerçant décrit sa journée : plat du jour, " +
  "arrivage, créneaux libres, prix en euros, nombre de portions ou de pièces.";

/**
 * UN GARDE-FOU DE DÉPENSE, ET RIEN DE PLUS. Cette route coûte à l'appel. Elle
 * n'a pas de compte à protéger — il n'y en a pas encore — mais elle ne doit pas
 * pouvoir tourner en boucle depuis l'extérieur. Un compteur en mémoire suffit :
 * il se vide au redémarrage, ce qui est acceptable pour un outil de mesure et
 * évite d'ajouter une table pour ça.
 */
const VU = new Map<string, { n: number; depuis: number }>();
const PAR_HEURE = 60;

function tropSouvent(qui: string): boolean {
  const maintenant = Date.now();
  const e = VU.get(qui);
  if (!e || maintenant - e.depuis > 3_600_000) {
    VU.set(qui, { n: 1, depuis: maintenant });
    return false;
  }
  e.n += 1;
  return e.n > PAR_HEURE;
}

/** Les octets d'un audio en data-URL, ou `null` si ce n'en est pas un. */
function audioDataUrl(v: string): { type: string; octets: Buffer; nom: string } | null {
  const m = /^data:(audio\/[a-z0-9.+-]+)(?:;[^,]*)?;base64,([A-Za-z0-9+/=]+)$/i.exec(v);
  if (!m) return null;
  const type = m[1].toLowerCase();
  // L'EXTENSION COMPTE POUR L'API, pas seulement le type MIME. iPhone produit
  // du `audio/mp4`, Chrome du `audio/webm` : deux conteneurs, deux extensions,
  // et un fichier mal nommé se fait refuser sans que le son soit en cause.
  const ext = type.includes("mp4") || type.includes("m4a")
    ? "m4a"
    : type.includes("webm")
      ? "webm"
      : type.includes("ogg")
        ? "ogg"
        : type.includes("wav")
          ? "wav"
          : type.includes("mpeg") || type.includes("mp3")
            ? "mp3"
            : "webm";
  return { type, octets: Buffer.from(m[2], "base64"), nom: `voix.${ext}` };
}

async function transcrire(
  cle: string,
  fichier: Blob,
  nom: string,
  modele: string,
): Promise<{ ok: true; texte: string } | { ok: false; statut: number; detail: string }> {
  const form = new FormData();
  form.append("file", fichier, nom);
  form.append("model", modele);
  // LA LANGUE EST DITE, PAS DEVINÉE. Sans elle, une phrase courte et bruitée se
  // fait parfois prendre pour de l'anglais, et le résultat est du charabia.
  form.append("language", "fr");
  form.append("prompt", CONTEXTE);
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { authorization: `Bearer ${cle}` },
    body: form,
  });
  if (!res.ok) {
    return { ok: false, statut: res.status, detail: (await res.text()).slice(0, 300) };
  }
  const data = (await res.json()) as { text?: unknown };
  return { ok: true, texte: s(data.text) };
}

export async function POST(request: Request) {
  const cle = s(process.env.OPENAI_API_KEY);
  if (!cle) {
    // ON DIT LAQUELLE MANQUE. Un « service indisponible » nu ferait chercher une
    // panne là où il n'y a qu'une variable d'environnement absente.
    return NextResponse.json(
      { erreur: "OPENAI_API_KEY absente : le chemin serveur n'est pas configuré." },
      { status: 503 },
    );
  }

  const qui =
    s(request.headers.get("x-forwarded-for")).split(",")[0].trim() || "inconnu";
  if (tropSouvent(qui)) {
    return NextResponse.json(
      { erreur: `Trop d'essais sur cette heure (${PAR_HEURE} maximum).` },
      { status: 429 },
    );
  }

  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const brut = s(p?.audio);
  if (brut.length > MAX_AUDIO) {
    return NextResponse.json({ erreur: "Enregistrement trop long." }, { status: 413 });
  }
  const a = audioDataUrl(brut);
  if (!a || a.octets.length < 1000) {
    return NextResponse.json(
      { erreur: "Aucun son exploitable — le micro n'a peut-être rien capté." },
      { status: 400 },
    );
  }

  const debut = Date.now();
  try {
    const fichier = new Blob([new Uint8Array(a.octets)], { type: a.type });
    let r = await transcrire(cle, fichier, a.nom, MODELE);
    // LE REPLI SUR LE SOCLE. Un compte sans accès au modèle récent rend un 400
    // ou un 404 sur le nom du modèle : on refait l'appel avec `whisper-1` plutôt
    // que de renvoyer une panne pour une question de droits.
    let modele = MODELE;
    if (!r.ok && MODELE !== SOCLE && (r.statut === 400 || r.statut === 404)) {
      console.warn(`[transcrire] ${MODELE} refusé (${r.statut}), repli sur ${SOCLE}`);
      modele = SOCLE;
      r = await transcrire(cle, fichier, a.nom, SOCLE);
    }
    if (!r.ok) {
      console.error(`[transcrire] refusé : HTTP ${r.statut} ${r.detail}`);
      return NextResponse.json(
        { erreur: `Le service de transcription a refusé (HTTP ${r.statut}).` },
        { status: 502 },
      );
    }
    return NextResponse.json({
      texte: r.texte,
      modele,
      ms: Date.now() - debut,
      octets: a.octets.length,
    });
  } catch (e) {
    console.error(`[transcrire] impossible : ${(e as Error)?.message || "réseau"}`);
    return NextResponse.json({ erreur: "Transcription impossible." }, { status: 502 });
  }
}
