/**
 * 🎙️ LA VOIX DU REPORTER QUI RACONTE — pour le film du commerçant qui ne veut pas parler.
 *
 * Le comptoir envoie les NUMÉROS des phrases tirées et ce que le commerçant a
 * donné (son commerce, son plat, son prix, ses cases) ; la route refait le
 * récit elle-même (`recitDepuisIds`) et le fait dire par la voix du reporter —
 * celle de l'interview (`INTERVIEW_VOIX_ID`). Elle rend le son et, quand
 * ElevenLabs les donne, l'instant de chaque mot : les sous-titres s'allument
 * au mot près, la bouche du reporter suit sa voix.
 *
 * ─── ELLE N'ACCEPTE AUCUN TEXTE LIBRE ────────────────────────────────────
 *
 * Seules les phrases de `reporter-recit.ts` se disent ; un fait que le
 * commerçant n'a pas coché est refusé. Le nom du plat et celui du commerce
 * viennent de lui (tronqués) : c'est la seule part libre, et elle est courte.
 *
 * ─── SANS SA VOIX ────────────────────────────────────────────────────────
 *
 * Sans `ELEVENLABS_API_KEY` et `INTERVIEW_VOIX_ID`, elle répond 503 : le film
 * se tourne quand même, ses phrases écrites en grand à l'écran.
 */
import { NextResponse } from "next/server";
import { estMetierReporter, recitDepuisIds, type Donnees, type IdsRecit } from "@/lib/direct/reporter-recit";

export const dynamic = "force-dynamic";

const s = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);

/** Un garde-fou de dépense : un film demande une synthèse. */
const VU = new Map<string, { n: number; depuis: number }>();
const PAR_HEURE = 30;
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

/** Ce que la voix prononce : « ClikMe » se dit « Clic Mi ». */
const dite = (texte: string) => texte.replace(/ClikMe/g, "Clic Mi");

const entier = (v: unknown) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) < 100 ? (v as number) : null);

/** Les numéros envoyés, vérifiés un à un. */
function lireIds(v: unknown): IdsRecit | null {
  const o = (v ?? {}) as Record<string, unknown>;
  const a = entier(o.a);
  const d = entier(o.d);
  const c = entier(o.c);
  if (a == null || d == null || c == null || !Array.isArray(o.f) || o.f.length > 2) return null;
  const f: [string, number][] = [];
  for (const x of o.f) {
    if (!Array.isArray(x) || typeof x[0] !== "string" || entier(x[1]) == null) return null;
    f.push([s(x[0], 20), x[1] as number]);
  }
  const ids: IdsRecit = { a, d, c, f };
  if (o.r != null) {
    const r = entier(o.r);
    if (r == null) return null;
    ids.r = r;
  }
  if (o.p != null) {
    const p = entier(o.p);
    if (p == null) return null;
    ids.p = p;
  }
  return ids;
}

/**
 * LES MOTS ET LEURS INSTANTS, d'après l'alignement caractère par caractère d'ElevenLabs. `affiche` :
 * le texte tel qu'il s'écrit (« ClikMe »), `dit` : tel qu'il s'est prononcé (« Clic Mi ») — un mot
 * écrit peut valoir deux mots dits.
 */
function motsAlignes(affiche: string, dit: string, al: { characters?: unknown; character_start_times_seconds?: unknown; character_end_times_seconds?: unknown } | undefined) {
  const car = Array.isArray(al?.characters) ? (al.characters as string[]) : [];
  const de = Array.isArray(al?.character_start_times_seconds) ? (al.character_start_times_seconds as number[]) : [];
  const a = Array.isArray(al?.character_end_times_seconds) ? (al.character_end_times_seconds as number[]) : [];
  if (!car.length || car.length !== de.length || car.length !== a.length || car.join("") !== dit) return null;
  // les mots dits, avec leurs instants
  const dits: { a: number; b: number }[] = [];
  let cur: { a: number; b: number } | null = null;
  car.forEach((c, i) => {
    if (/\s/.test(c)) {
      if (cur) dits.push(cur);
      cur = null;
    } else if (!cur) cur = { a: de[i], b: a[i] };
    else cur.b = a[i];
  });
  if (cur) dits.push(cur);
  // chaque mot écrit prend les mots dits qui lui correspondent
  const out: { m: string; a: number; b: number }[] = [];
  let k = 0;
  for (const m of affiche.split(/\s+/).filter(Boolean)) {
    const n = dite(m).split(/\s+/).filter(Boolean).length;
    const l = dits.slice(k, k + n);
    k += n;
    if (!l.length) return null;
    out.push({ m, a: l[0].a, b: l[l.length - 1].b });
  }
  return k === dits.length ? out : null;
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const metier = s(p?.metier, 20);
  const ids = lireIds(p?.ids);
  const brut = (p?.donnees ?? {}) as Record<string, unknown>;
  const donnees: Donnees = {
    commerce: s(brut.commerce, 80),
    prenom: s(brut.prenom, 40),
    ville: s(brut.ville, 40),
    plat: s(brut.plat, 70),
    prix: s(brut.prix, 20),
    faits: Array.isArray(brut.faits) ? brut.faits.slice(0, 10).map((x) => s(x, 20)) : [],
  };
  if (!estMetierReporter(metier) || !ids || !donnees.commerce || !donnees.plat) {
    return NextResponse.json({ erreur: "Récit incomplet." }, { status: 400 });
  }
  const recit = recitDepuisIds(metier, donnees, ids);
  if (!recit) return NextResponse.json({ erreur: "Ce récit ne vient pas des phrases du reporter." }, { status: 400 });

  const cle = s(process.env.ELEVENLABS_API_KEY);
  const voix = s(process.env.INTERVIEW_VOIX_ID);
  if (!cle || !voix) return NextResponse.json({ erreur: "La voix du reporter n'est pas encore réglée (INTERVIEW_VOIX_ID).", texte: recit.texte }, { status: 503 });
  const qui = s(request.headers.get("x-forwarded-for")).split(",")[0].trim() || "inconnu";
  if (tropSouvent(qui)) return NextResponse.json({ erreur: "Trop de films sur cette heure." }, { status: 429 });

  const base = s(process.env.ELEVENLABS_BASE_URL) || "https://api.elevenlabs.io";
  const texteDit = dite(recit.texte);
  const corps = (modele: string) =>
    JSON.stringify({ text: texteDit, model_id: modele, voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 1.0 } });
  const modeles = [...new Set([s(process.env.INTERVIEW_VOIX_MODELE) || "eleven_v3", "eleven_multilingual_v2"])];
  // D'ABORD AVEC L'INSTANT DE CHAQUE MOT ; un modèle qui ne le donne pas : le son seul
  for (const modele of modeles) {
    try {
      const r = await fetch(`${base}/v1/text-to-speech/${encodeURIComponent(voix)}/with-timestamps?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "xi-api-key": cle, "content-type": "application/json" },
        body: corps(modele),
      });
      if (r.ok) {
        const j = (await r.json()) as { audio_base64?: string; alignment?: Record<string, unknown> };
        if (j.audio_base64) {
          const mots = motsAlignes(recit.texte, texteDit, j.alignment);
          return NextResponse.json({ audio: j.audio_base64, texte: recit.texte, ...(mots ? { mots } : {}), modele });
        }
      } else console.info(`[reporter-voix] ${modele} avec instants : HTTP ${r.status}`);
    } catch {
      /* réseau : on tente autrement */
    }
  }
  for (const modele of modeles) {
    try {
      const r = await fetch(`${base}/v1/text-to-speech/${encodeURIComponent(voix)}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "xi-api-key": cle, "content-type": "application/json" },
        body: corps(modele),
      });
      if (r.ok) return NextResponse.json({ audio: Buffer.from(await r.arrayBuffer()).toString("base64"), texte: recit.texte, modele });
      console.info(`[reporter-voix] ${modele} : HTTP ${r.status}`);
    } catch {
      /* réseau */
    }
  }
  return NextResponse.json({ erreur: "Voix indisponible.", texte: recit.texte }, { status: 502 });
}
