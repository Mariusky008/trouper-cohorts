// 🗣️ SA PROPRE FIGURINE (`lib/direct/ma-figurine.ts`).
//
// GET : où il en est (sa photo, sa figurine, ses expressions, ses options, ses messages). Sans cookie : « photo ».
// POST { action: "photo", photo: data:image…, accord: true, prenom?, ville?, univers? } : sa photo — dès le départ (sans compte,
//   on lui en ouvre un dans `ville`, une ville des commerces ClikMe) ; le moteur fabrique ensuite sa figurine.
// POST { action: "fabriquer" } : un pas de fabrication de sa figurine (le moteur) → l'état (`enCours` : rappeler).
// POST { action: "refaire", autrePhoto?, univers? } : une nouvelle figurine (même photo), ou retour à la photo ; `univers` :
//       ce qui lui ressemble (son métier, sa passion), revu en la refaisant.
// POST { action: "expressions", veut? } : un tour de fabrication de ses expressions (le moteur d'image) → l'état ;
//       `veut` : le visage qu'il vient de choisir (ils se font à la demande).
// POST { action: "voix", texte, voix } : son texte lu par la voix choisie (ElevenLabs) → { son: data:audio/mpeg… }.
// POST { action: "ma-voix", voix } : la voix de sa figurine, choisie par lui (« une voix d'homme ou de femme ? »).
// GET ?mois=1 : sa figurine du mois (où il en est : ses jours de rencontres) et celles d'avant — ses looks.
// POST { action: "mois" } : sa figurine du mois, méritée (10 jours), fabriquée une fois → { mois } (`enCours` : rappeler).
// POST { action: "look-parle", look: "AAAA-MM" } : ce look (une figurine du mois) apprend à parler (sa bouche ouverte) → { mois }.
// GET ?memes=1&recus=<id,id…> : « Mes mèmes » — les siens, les réponses en duo qu'on lui a faites, ceux qu'il a reçus.
// POST { action: "message", son: data:audio…, duree, commerces: [liens], sentiment?, texte?, voix?, danse?, repondA?, look? } : un
//   message de sa figurine (ou d'un de ses looks) → { id, lien }.
// POST { action: "meme-envoi", id, type } → { seau, chemin, jeton } : où envoyer la vidéo de son mème (`meme.ts`) ;
//      { action: "meme-pose", id, type } : elle est arrivée → rangée à côté du message.
// GET ?repondre=<id> : le mème auquel il répond, en duo (ses images, sa voix, ses mots, son prénom).
// POST { action: "meme-evenement", type: "partage"|"nouveau", id } : un geste autour d'un mème (la mesure).
// POST { action: "public", id, public: true|false } : son mème dans « Découvrir », pour les gens de sa ville (son accord),
//      ou retiré. Jamais un duo, jamais un mème signalé.
// GET ?reactions=1 : ⚡ ses réactions (`mes-reactions.ts`) — ses poses faites, sa figurine, si le moteur peut en faire.
// POST { action: "pose", cle } : une pose faite par le moteur (la première fois qu'il la touche, ~1 min) → { url }.
// POST { action: "reaction-envoi", cle } : une réaction ou un gag envoyé (la mesure).
// POST { action: "surprise", sauf?: [textes] } : 🎲 « Surprends-moi ! » — un mème écrit par ClikMe d'après sa carte de
//      personnage (`meme-surprise.ts`) ; rien n'est dit ni envoyé : il le choisit d'abord.
// POST { action: "signaler", id } : celui qui a reçu un message le signale (pas besoin d'être quelqu'un).
// (La démonstration qu'on faisait parler sans compte a quitté la page le 5 novembre 2026 : chacun crée la sienne dès le
// départ. Ses messages déjà envoyés s'ouvrent toujours, par `/figurine/<id>`.)
// Un habitant n'est créé ici que par « photo » (son geste : « Créer ma figurine »).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant, habitantCourant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { lienMessage } from "@/lib/direct/ma-figurine";
import {
  adresseEnvoiMeme,
  choisirSaVoix,
  enregistrerMessage,
  envoyerPhoto,
  etatMaFigurine,
  fabriquerMaFigurine,
  refaireMaFigurine,
  fabriquerSesExpressions,
  lireSonTexte,
  memeARepondre,
  mesMemes,
  noterGesteMeme,
  poserMeme,
  rendreMemePublic,
  signalerMessage,
} from "@/lib/direct/ma-figurine-serveur";
import { surprendre } from "@/lib/direct/meme-surprise-serveur";
import { fabriquerPose, mesReactions, noterEnvoiReaction } from "@/lib/direct/mes-reactions-serveur";
import { fabriquerFigurineDuMois, fabriquerParleDuLook, mesFigurinesDuMois } from "@/lib/direct/figurine-du-mois-serveur";

export const dynamic = "force-dynamic";
// (un tour d'expressions : quatre images du moteur, en même temps)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const enSon = (mp3: Buffer) => `data:audio/mpeg;base64,${mp3.toString("base64")}`;

/** Une ville où ClikMe a au moins un commerce client (on n'ouvre pas de compte ailleurs). */
async function villeOuverte(supabase: ReturnType<typeof createAdminClient>, ville: string): Promise<boolean> {
  const { data } = await supabase.from("human_vitrine_sites").select("city").eq("est_client", true).limit(500);
  return ((Array.isArray(data) ? data : []) as { city?: string }[]).some((x) => villeSlug(String(x.city ?? "").replace(/\b\d{5}\b/g, " ").replace(/\s+/g, " ").trim()) === ville);
}

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  // 💬 le mème auquel il répond (en duo)
  const repondre = new URL(request.url).searchParams.get("repondre");
  if (repondre) {
    const m = await memeARepondre(supabase, repondre);
    return m ? NextResponse.json({ ok: true, meme: m }, { headers: sansCache }) : NextResponse.json({ error: "Ce mème n’existe plus." }, { status: 404 });
  }
  // 🗓️ sa figurine du mois (où il en est) et celles d'avant
  if (new URL(request.url).searchParams.get("mois")) {
    return NextResponse.json({ ok: true, mois: await mesFigurinesDuMois(supabase, moi) }, { headers: sansCache });
  }
  // ⚡ ses réactions
  if (new URL(request.url).searchParams.get("reactions")) {
    const r = await mesReactions(supabase, moi);
    return r ? NextResponse.json({ ok: true, ...r }, { headers: sansCache }) : NextResponse.json({ error: "Ta figurine n’est pas encore prête." }, { status: 400 });
  }
  // 📥 « mes mèmes » : les siens, les réponses qu'on lui a faites, ceux qu'il a reçus (`recus` : gardés sur son téléphone)
  if (new URL(request.url).searchParams.get("memes")) {
    return NextResponse.json({ ok: true, memes: await mesMemes(supabase, moi, new URL(request.url).searchParams.get("recus")) }, { headers: sansCache });
  }
  return NextResponse.json({ ok: true, etat: await etatMaFigurine(supabase, moi) }, { headers: sansCache });
}

export async function POST(request: Request) {
  const debut = Date.now();
  const avant = debut + (maxDuration - 20) * 1000;
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  if (p?.action === "signaler") {
    const ok = await signalerMessage(supabase, String(p.id ?? ""));
    return NextResponse.json(ok ? { ok: true } : { error: "Ce message n’existe plus." }, { status: ok ? 200 : 404 });
  }
  // 📈 un geste autour d'un mème (sans compte : celui qui le reçoit le partage) — « partage », « nouveau »
  if (p?.action === "meme-evenement") {
    const ok = await noterGesteMeme(supabase, p.type, p.id);
    return NextResponse.json(ok ? { ok: true } : { error: "Demande incomplète." }, { status: ok ? 200 : 400 });
  }
  if (p?.action === "photo") {
    // DÈS LE DÉPART : sans compte, sa photo lui en ouvre un — dans une ville où ClikMe a des commerces
    let moi = await habitantCourant(supabase);
    if (!moi) {
      if (p.accord !== true) return NextResponse.json({ error: "Coche « C’est bien moi sur la photo »." }, { status: 400 });
      const ville = villeSlug(String(p.ville ?? ""));
      if (!ville || !(await villeOuverte(supabase, ville))) return NextResponse.json({ error: "Choisis ta ville." }, { status: 400 });
      moi = await assurerHabitant(supabase, ville);
      if (!moi) return NextResponse.json({ error: "Ton compte n’a pas pu s’ouvrir. Réessaie dans un instant." }, { status: 502 });
    }
    const r = await envoyerPhoto(supabase, moi, p.photo, p.accord, p.prenom, p.univers);
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, etat: await etatMaFigurine(supabase, moi) }, { headers: sansCache });
  }
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Envoie d’abord ta photo pour créer ta figurine." }, { status: 403 });
  if (p?.action === "fabriquer") {
    const r = await fabriquerMaFigurine(supabase, moi, avant);
    const etat = await etatMaFigurine(supabase, moi);
    if (r.error) return NextResponse.json({ error: r.error, etat }, { status: r.statut ?? 400, headers: sansCache });
    return NextResponse.json({ ok: true, ...(r.enCours ? { enCours: true } : {}), etat }, { headers: sansCache });
  }
  if (p?.action === "refaire") {
    const r = await refaireMaFigurine(supabase, moi, p.autrePhoto === true, p.univers);
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true, etat: await etatMaFigurine(supabase, moi) }, { headers: sansCache });
  }
  if (p?.action === "expressions") {
    const r = await fabriquerSesExpressions(supabase, moi, avant, p.veut);
    return NextResponse.json({ ok: !r.error, ...(r.error ? { error: r.error } : {}), ...(r.enCours ? { enCours: true } : {}), etat: await etatMaFigurine(supabase, moi) }, { headers: sansCache });
  }
  if (p?.action === "mois") {
    const r = await fabriquerFigurineDuMois(supabase, moi, avant);
    const mois = await mesFigurinesDuMois(supabase, moi);
    if (r.error) return NextResponse.json({ error: r.error, mois }, { status: r.statut ?? 400, headers: sansCache });
    return NextResponse.json({ ok: true, ...(r.enCours ? { enCours: true } : {}), mois }, { headers: sansCache });
  }
  // 🎭 un look (une figurine du mois) qui parle : sa bouche ouverte, faite la première fois → { mois } (`enCours` : rappeler)
  if (p?.action === "look-parle") {
    const r = await fabriquerParleDuLook(supabase, moi, p.look, avant);
    const mois = await mesFigurinesDuMois(supabase, moi);
    if (r.error) return NextResponse.json({ error: r.error, mois }, { status: r.statut ?? 400, headers: sansCache });
    return NextResponse.json({ ok: true, ...(r.enCours ? { enCours: true } : {}), mois }, { headers: sansCache });
  }
  if (p?.action === "ma-voix") {
    const r = await choisirSaVoix(supabase, moi, p.voix);
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true }, { headers: sansCache });
  }
  if (p?.action === "voix") {
    const r = await lireSonTexte(supabase, moi, p.texte, p.voix);
    if (!r.mp3) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true, son: enSon(r.mp3) }, { headers: sansCache });
  }
  // 🎭 SON MÈME : l'adresse où envoyer la vidéo, puis « elle est arrivée »
  if (p?.action === "meme-envoi") {
    const r = await adresseEnvoiMeme(supabase, moi, p.id, p.type);
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true, seau: r.seau, chemin: r.chemin, jeton: r.jeton }, { headers: sansCache });
  }
  // 🌍 son mème dans « Découvrir » (son accord), ou retiré
  if (p?.action === "public") {
    const r = await rendreMemePublic(supabase, moi, p.id, p.public);
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true, public: r.public }, { headers: sansCache });
  }
  // ⚡ une pose de ses réactions, faite par le moteur ; un envoi (la mesure)
  if (p?.action === "pose") {
    const r = await fabriquerPose(supabase, moi, p.cle, avant);
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true, ...(r.url ? { url: r.url } : {}), ...(r.enCours ? { enCours: true } : {}) }, { headers: sansCache });
  }
  if (p?.action === "reaction-envoi") {
    const ok = await noterEnvoiReaction(supabase, p.cle);
    return NextResponse.json(ok ? { ok: true } : { error: "Cette réaction n’existe pas." }, { status: ok ? 200 : 400 });
  }
  // 🎲 « Surprends-moi ! » : ClikMe écrit son mème (il le lit, puis le choisit — ou en demande un autre)
  if (p?.action === "surprise") {
    const r = await surprendre(supabase, moi, p.sauf);
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true, ...r.surprise }, { headers: sansCache });
  }
  if (p?.action === "meme-pose") {
    const r = await poserMeme(supabase, moi, p.id, p.type);
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true }, { headers: sansCache });
  }
  if (p?.action === "message") {
    const r = await enregistrerMessage(supabase, moi, p.son, p.duree, p.commerces, p.sentiment, p.texte, p.voix, p.danse, p.repondA, p.look);
    if (!r.id) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, id: r.id, lien: lienMessage(r.id) }, { headers: sansCache });
  }
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
}
