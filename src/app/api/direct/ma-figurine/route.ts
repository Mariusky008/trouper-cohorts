// 🗣️ SA PROPRE FIGURINE (`lib/direct/ma-figurine.ts`).
//
// GET : où il en est (sa photo, sa figurine, ses expressions, ses options, ses messages). Sans cookie : « photo ».
// POST { action: "photo", photo: data:image…, accord: true, majeur: true, prenom?, ville?, univers? } : sa photo — dès le
//   départ (sans compte, on lui en ouvre un dans `ville`, une ville des commerces ClikMe) ; le moteur fabrique ensuite sa
//   figurine. `majeur` : 🔞 « J'ai 15 ans ou plus » (`AGE_MINIMUM`), sans quoi rien ne part.
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
//      ou retiré. Jamais un duo, jamais un mème signalé. Sans son âge déclaré : 403 avec `age` (l'écran le lui demande).
// POST { action: "majeur" } : 🔞 il déclare avoir 15 ans ou plus (celui qui avait sa figurine avant qu'on le demande).
// GET ?jour=1 : 🔥 le mème du jour (le thème, combien de réponses dans sa ville, s'il a répondu).
// POST { action: "public", id, public, duJour: true } : sa réponse au mème du jour (visible par sa ville : c'est écrit sur
//      le bouton). POST { action: "reagir", id, reac } : 😂 ❤️ 🔥 sur un mème (`c-<id>` : un commerçant ; `reac: null` : retirée).
// GET ?reactions=1 : ⚡ ses réactions (`mes-reactions.ts`) — ses poses faites, sa figurine, si le moteur peut en faire.
// POST { action: "pose", cle } : une pose faite par le moteur (la première fois qu'il la touche, ~1 min) → { url }.
// POST { action: "reaction-envoi", cle } : une réaction ou un gag envoyé (la mesure).
// POST { action: "surprise", sauf?: [textes] } : 🎲 « Surprends-moi ! » — un mème écrit par ClikMe d'après sa carte de
//      personnage (`meme-surprise.ts`) ; rien n'est dit ni envoyé : il le choisit d'abord.
// POST { action: "signaler", id } : celui qui a reçu un message le signale (pas besoin d'être quelqu'un).
// 📲 POST { action: "appli-jeton" } → { jeton } : il va poser ClikMe sur son écran d'accueil (iPhone) ; la page se recharge
//      sur `?appli=<jeton>`. POST { action: "appli-lier", jeton } (sans compte) : l'appli s'ouvre pour la première fois,
//      le jeton pose le cookie de SA figurine (`appli-collection-serveur.ts`).
// 🔔 POST { action: "notif", abonnement } : le mème du jour à 11 h 30 sur ce téléphone (« C'est réglé ! » part tout de
//      suite) ; { action: "notif-couper", endpoint? } : il coupe (sans adresse : partout) ; { action: "notif-etat",
//      endpoint } → { abonne, reponses? } : ce téléphone le recevra-t-il ? ↩️ { action: "notif-reponses", oui } : « Quand on
//      répond à tes mèmes » (allumé par défaut), ou coupé.
// (La démonstration qu'on faisait parler sans compte a quitté la page le 5 novembre 2026 : chacun crée la sienne dès le
// départ. Ses messages déjà envoyés s'ouvrent toujours, par `/figurine/<id>`.)
// Un habitant n'est créé ici que par « photo » (son geste : « Créer ma figurine »).
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant, habitantCourant, poserCookie } from "@/lib/direct/habitant";
import { abonner, choisirLesReponses, couper, estAbonne, jetonAppli, lierAppli, prevenirDUneReponse, prevenuDesReponses } from "@/lib/direct/appli-collection-serveur";
import { villeSlug } from "@/lib/direct/ville";
import { ERREUR_AGE, lienMessage } from "@/lib/direct/ma-figurine";
import {
  confirmerSonAge,
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
  etatDuJour,
  rendreMemePublic,
  signalerMessage,
} from "@/lib/direct/ma-figurine-serveur";
import { surprendre } from "@/lib/direct/meme-surprise-serveur";
import { fabriquerPose, mesReactions, noterEnvoiReaction } from "@/lib/direct/mes-reactions-serveur";
import { reagir } from "@/lib/direct/reactions-memes-serveur";
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
  // 🔥 le mème du jour
  if (new URL(request.url).searchParams.get("jour")) {
    return NextResponse.json({ ok: true, jour: await etatDuJour(supabase, moi) }, { headers: sansCache });
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
      // 🔞 réservée aux 15 ans et plus (`AGE_MINIMUM`) : pas de compte ouvert sans cette case
      if (p.majeur !== true) return NextResponse.json({ error: ERREUR_AGE }, { status: 400 });
      const ville = villeSlug(String(p.ville ?? ""));
      if (!ville || !(await villeOuverte(supabase, ville))) return NextResponse.json({ error: "Choisis ta ville." }, { status: 400 });
      moi = await assurerHabitant(supabase, ville);
      if (!moi) return NextResponse.json({ error: "Ton compte n’a pas pu s’ouvrir. Réessaie dans un instant." }, { status: 502 });
    }
    const r = await envoyerPhoto(supabase, moi, p.photo, p.accord, p.prenom, p.univers, p.majeur);
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, etat: await etatMaFigurine(supabase, moi) }, { headers: sansCache });
  }
  // 📲 l'appli s'ouvre pour la première fois sur son écran d'accueil, avec son jeton : le cookie de SA figurine
  if (p?.action === "appli-lier") {
    const r = await lierAppli(supabase, p.jeton);
    if (!r.deviceToken) return NextResponse.json({ error: r.error }, { status: 400 });
    await poserCookie(r.deviceToken);
    return NextResponse.json({ ok: true });
  }
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Envoie d’abord ta photo pour créer ta figurine." }, { status: 403 });
  if (p?.action === "appli-jeton") {
    const jeton = await jetonAppli(supabase, moi);
    return NextResponse.json(jeton ? { ok: true, jeton } : { error: "Ça n’a pas marché. Réessaie." }, { status: jeton ? 200 : 502 });
  }
  // 🔔 le mème du jour à 11 h 30
  if (p?.action === "notif") {
    const r = await abonner(supabase, moi, p.abonnement);
    return NextResponse.json(r.ok ? { ok: true } : { error: r.error }, { status: r.ok ? 200 : (r.statut ?? 400) });
  }
  if (p?.action === "notif-couper") return NextResponse.json(await couper(supabase, moi, p.endpoint));
  if (p?.action === "notif-etat") {
    const [abonne, reponses] = await Promise.all([estAbonne(supabase, moi, p.endpoint), prevenuDesReponses(supabase, moi)]);
    return NextResponse.json({ ok: true, abonne, ...(reponses !== null ? { reponses } : {}) }, { headers: sansCache });
  }
  // ↩️ « Quand on répond à tes mèmes » : allumé (par défaut) ou coupé
  if (p?.action === "notif-reponses") {
    const r = await choisirLesReponses(supabase, moi, p.oui);
    return NextResponse.json(r.ok ? { ok: true, reponses: r.reponses } : { error: r.error }, { status: r.ok ? 200 : (r.statut ?? 400), headers: sansCache });
  }
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
  // 🔞 il déclare avoir l'âge, 15 ans ou plus (celui qui avait déjà sa figurine avant qu'on le demande) : une fois
  if (p?.action === "majeur") {
    await confirmerSonAge(supabase, moi.id);
    return NextResponse.json({ ok: true }, { headers: sansCache });
  }
  // 🌍 son mème dans « Découvrir » (son accord), ou retiré
  if (p?.action === "public") {
    const r = await rendreMemePublic(supabase, moi, p.id, p.public, p.duJour === true);
    // (sans son âge déclaré : `age`, l'écran le lui demande, une fois)
    if (r.error) return NextResponse.json({ error: r.error, ...("age" in r && r.age ? { age: true } : {}) }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true, public: r.public, ...(r.duJour ? { duJour: true } : {}) }, { headers: sansCache });
  }
  // 😂 ❤️ 🔥 il réagit à un mème (une réaction par personne)
  if (p?.action === "reagir") {
    const r = await reagir(supabase, moi, p.id, p.reac);
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true, reac: r.reac }, { headers: sansCache });
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
    const r = await surprendre(supabase, moi, p.sauf, p.theme);
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
    // ↩️ « Sam t'a répondu en duo ! » : à l'auteur du mème, après la réponse (jamais bloquant)
    const auteur = r.auteurDeLOrigine;
    const id = r.id;
    if (auteur) after(() => prevenirDUneReponse(supabase, auteur, moi.id, { meme: id, url: "/collection#memes", duo: true }).then(() => undefined, () => undefined));
    return NextResponse.json({ ok: true, id: r.id, lien: lienMessage(r.id) }, { headers: sansCache });
  }
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
}
