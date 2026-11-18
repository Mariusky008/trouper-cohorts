// 🎙️ LE TALKIE-WALKIE DES FIGURINES — l'onglet « Proches » (`lib/direct/talkie.ts`, `talkie-serveur.ts`).
//
// GET                                   → { proches, presence, cle } : ses proches, vivants (sa figurine, « Là
//                                          maintenant », ses non-lus, la dernière chose dite) ; s'il se montre « là » ;
//                                          sa clé (son lien : `/collection?proche=<clé>`)
// GET ?presence=1                       → { presence } (« Moi »)
// GET ?moi=1                            → { moi } : sa figurine, de quoi la faire parler (« Envoyer par WhatsApp »)
// GET ?fil=<clé>                        → { fil } : sa conversation avec ce proche (ils se sont ajoutés tous les deux) ;
//                                          `ecrire` : ✍️ on peut lui écrire (faux quand le frein `CLIKME_ECRIT=0` est tiré) ;
//                                          `photos` : 📷 on peut lui envoyer une photo (faux : `CLIKME_PHOTOS=0`) ;
//                                          `videos` : 🎬 une vidéo (faux : `CLIKME_VIDEOS=0`)
// GET ?vivant=<clé>                     → { vivant } : 🎭 la conversation vivante (lot R4a, `lib/direct/vivant.ts`) — s'il
//                                          prépare un message, leurs panneaux et réactions, l'heure du dernier message
// POST { action: "la" }                 → { nonLus } : 🟢 ClikMe est ouvert (toutes les minutes, page visible)
// POST { action: "comprendre", son, duree } → { repliques, par, transcrit, dispo } : « Ta figurine a compris ça » — ses phrases,
//      et trois têtes proposées pour chacune. Rien n'est gardé, rien ne part.
// POST { action: "envoyer", cle, son, duree, repliques } → { message } : il l'envoie (les têtes qu'il a choisies)
// POST { action: "presence", oui }      → { presence } : « Montrer à mes proches quand je suis là »
// POST { action: "proche", cle, oui }   → { ok } : « L'ajouter aussi » (ou le retirer de ses proches)
// POST { action: "signaler", cle, id }  → { ok } : 🚩 un message qu'il ne veut plus voir (l'équipe le regarde)
// POST { action: "prepare", cle, oui }  → { ok } : 🎭 il prépare un message (sa figurine se penche chez l'autre)
// POST { action: "geste", cle, type: "panneau"|"reaction"|"geste", quoi, message?, surprise? } → { geste } : 🪧 un panneau,
//                                       👏 une réaction, 🛋️ un geste du salon (lot S3 : un bisou, une fleur posée sur la table…)
// POST { action: "aparte-effacer", cle, id } → { ok } : 🎭 il efface un aparté de leurs figurines (pour les deux)
// POST { action: "meme", cle, id }      → { ok } : 🎭 il envoie son mème (fait dans le studio) dans leur conversation
//                                          (la nouvelle interface, lot 4, `memes-proches-serveur.ts`) ; l'autre est prévenu
// GET ?pouls=<clé>                      → { n, la, ecrit?, vu? } : 💓 le pouls du salon (lot S2, `pouls-serveur.ts`) — le
//                                          numéro du dernier événement (un message, un mème, un geste, un effacement :
//                                          chacun le fait battre), s'il est là (sinon sa dernière visite), s'il écrit
// GET ?ouvrir=<clé>                     → { ouverture } : 🚪 le salon du duo (lot S0b, `lib/direct/salon-serveur.ts`) — le
//                                          fil, la vie et la scène (la pièce, ses images à adresse stable) en une requête
// (GET ?vivant= écrit aussi, après la réponse, l'aparté d'un échange qui vient de finir — lot R4b ; et 📚 leurs figurines
//  notent ce qui compte sur leur étagère — lot E1, `etagere-serveur.ts` ; GET (la liste) le fait pour six conversations)
// 📲 L'ÉTAPE 5, PAR WHATSAPP :
// POST { action: "lien-creer", son, duree, repliques, pour? } → { id, url, reste } : son message, en lien (`/t/<id>`),
//      pour quelqu'un qui n'a pas ClikMe (trois par jour)
// POST { action: "lien-repondre", id, son, duree, repliques } → { message, cle } : il répond au lien avec sa figurine ;
//      ils deviennent proches, l'auteur est prévenu. (Sa figurine, s'il n'en a pas : `ma-figurine`, « photo », avec `lien`.)
// ✍️ LOT M1, ÉCRIRE (`lib/direct/ecrit.ts`, `ecrit-serveur.ts`) :
// POST { action: "ecrire", cle, texte, tete? } → { message } : un message écrit (1 000 signes) ; après la réponse,
//      l'aperçu de son lien, puis la notification (« ✍️ Léa t'a écrit »). Le frein : `CLIKME_ECRIT=0` (404).
// POST { action: "effacer", cle, id }   → { ok } : 🗑️ il efface son message (le sien, dans les 24 heures), pour les deux
//      (sa voix, l'image de l'aperçu ou sa photo avec)
// 📷 LOT M2, LES PHOTOS (`lib/direct/photo.ts`, `photo-serveur.ts`) :
// POST { action: "photo-depot", cle }   → { seau, chemin, jeton, id } : où déposer sa photo (une adresse signée, un seul
//      dépôt), depuis le téléphone, déjà réduite et sans ses métadonnées
// POST { action: "photo", cle, id, legende?, tete? } → { message } : la photo déposée part — réencodée, contrôlée par
//      la modération (refusée : 422 ; sans service : 503, elle attend), puis « 📷 Léa t'a envoyé une photo » après la
//      réponse. Trente par jour. Le frein : `CLIKME_PHOTOS=0` (404).
// 🎬 LOT M3, LES VIDÉOS (`lib/direct/video.ts`, `video-serveur.ts`) :
// POST { action: "video-depot", cle, type } → { seau, chemin, jeton, id } : où déposer sa vidéo (MP4, MOV ou WebM ;
//      une adresse signée, un seul dépôt, 25 Mo au plus)
// POST { action: "video", cle, id, type, duree, images: [3 × data:image], legende?, tete? } → { message } : la vidéo
//      déposée part — sa durée lue dans le fichier (30 s au plus), ses trois images contrôlées par la modération
//      (refusée : 422 ; sans service : 503, elle attend), sa vignette ; puis « 🎬 Léa t'a envoyé une vidéo ». Dix par
//      jour. Le frein : `CLIKME_VIDEOS=0` (404).
// Un proche se désigne toujours par sa clé de profil, jamais par son identifiant.
import { etagerePeinteOuverte, peindreEtagere } from "@/lib/direct/etagere-peinte-serveur";
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import {
  changerProche,
  choisirPresence,
  comprendre,
  creerLien,
  envoyerParole,
  filAvec,
  hDeCle,
  maCle,
  maFigurineVue,
  maPresence,
  marquerLa,
  mesProchesVivants,
  prevenirDeLaParole,
  repondreAuLien,
  seParlent,
  signalerParole,
} from "@/lib/direct/talkie-serveur";
import { envoyerMemeAuProche } from "@/lib/direct/memes-proches-serveur";
import { apresEcrit, ecritOuvert, ecrireMessage, effacerMessage } from "@/lib/direct/ecrit-serveur";
import { apresPhoto, depotPhoto, envoyerPhoto, photosOuvertes } from "@/lib/direct/photo-serveur";
import { apresVideo, depotVideo, envoyerVideo, videosOuvertes } from "@/lib/direct/video-serveur";
import { effacerEtagere, etagereAllumee, lignesEtagere, noterMesConversations, oublierMessage, preparerNotes } from "@/lib/direct/etagere-serveur";
import { direQuIlPrepare, effacerAparte, poserGeste, preparerAparte, prevenirDuPanneau, vivantAvec } from "@/lib/direct/vivant-serveur";
import { ouvrirSalon } from "@/lib/direct/salon-serveur";
import { calquesDeFigurine } from "@/lib/direct/calques-figurine-serveur";
import { battre, poulsAvec } from "@/lib/direct/pouls-serveur";

export const dynamic = "force-dynamic";
// (comprendre : la transcription, puis les têtes proposées)
// (🪵 l'étagère peinte dans son décor, après la réponse : une minute environ, une fois par décor)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const SANS_COMPTE = { error: "Crée d’abord ta figurine." };

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 403 });
  const q = new URL(request.url).searchParams;
  if (q.get("presence")) return NextResponse.json({ ok: true, presence: await maPresence(supabase, moi) }, { headers: sansCache });
  if (q.get("moi")) {
    const f = await maFigurineVue(supabase, moi);
    return f ? NextResponse.json({ ok: true, moi: f }, { headers: sansCache }) : NextResponse.json({ error: "Ta figurine n’est pas encore prête." }, { status: 400 });
  }
  // 💓 le pouls du salon (lot S2) : le numéro du dernier événement, s'il est là, s'il écrit — moins de 300 octets
  const pouls = q.get("pouls");
  if (pouls) {
    const r = await poulsAvec(supabase, moi, pouls);
    return r.pouls ? NextResponse.json(r.pouls, { headers: sansCache }) : NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
  }
  // 🚪 le salon du duo (lot S0b) : le fil, la vie et la scène en une requête
  const ouvrir = q.get("ouvrir");
  if (ouvrir) {
    const r = await ouvrirSalon(supabase, moi, ouvrir);
    if (!r.ouverture) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
    const a = r.aPreparer;
    if (a) after(() => preparerAparte(supabase, a, moi).catch(() => undefined));
    const h = r.aNoter;
    if (h) after(() => preparerNotes(supabase, moi.id, h).catch(() => 0));
    // 🎭 (lot S1) une figurine sans ses calques : découpée après la réponse, pour la prochaine ouverture
    for (const id of r.aDecouper ?? []) after(() => calquesDeFigurine(supabase, id).catch(() => null));
    const o = r.ouverture;
    return NextResponse.json({ ok: true, ouverture: { ...o, fil: { ...o.fil, ecrire: ecritOuvert(), photos: photosOuvertes(), videos: videosOuvertes() } } }, { headers: sansCache });
  }
  const vivant = q.get("vivant");
  if (vivant) {
    const r = await vivantAvec(supabase, moi, vivant);
    if (!r.vivant) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
    // 🎭 un échange vient de finir : leurs figurines font un aparté (après la réponse, jamais bloquant)
    const a = r.aPreparer;
    if (a) after(() => preparerAparte(supabase, a, moi).catch(() => undefined));
    // 📌 un échange s'est posé : leurs figurines le lisent, et notent ce qui compte (après la réponse)
    const h = r.aNoter;
    if (h) after(() => preparerNotes(supabase, moi.id, h).catch(() => 0));
    return NextResponse.json({ ok: true, vivant: r.vivant }, { headers: sansCache });
  }
  const fil = q.get("fil");
  if (fil) {
    const r = await filAvec(supabase, moi, fil);
    if (!r.fil) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
    // 🪵 leur étagère n'est pas encore peinte dans son décor : elle se peint après la réponse (une fois par décor)
    if (r.fil.chezMoi && !r.fil.chezMoi.etagere && etagerePeinteOuverte() && etagereAllumee()) {
      const avant = Date.now() + maxDuration * 1000 - 20_000;
      after(() => peindreEtagere(supabase, moi.id, avant).catch(() => false));
    }
    return NextResponse.json({ ok: true, fil: { ...r.fil, ecrire: ecritOuvert(), photos: photosOuvertes(), videos: videosOuvertes() } }, { headers: sansCache });
  }
  const [vivants, presence, cle] = await Promise.all([mesProchesVivants(supabase, moi), maPresence(supabase, moi), maCle(supabase, moi)]);
  // 📚 la ligne de chacun, ce que l'étagère en dit (lot E2 : un rappel du jour, un souvenir pas encore vu, une relance)
  const lignes = await lignesEtagere(supabase, moi, vivants.filter((p) => p.lien === "proches").map((p) => p.cle)).catch(() => ({}) as Record<string, never>);
  const proches = vivants.map((p) => (lignes[p.cle] ? { ...p, etagere: lignes[p.cle] } : p));
  // 📌 à l'ouverture de « Chez moi » : leurs figurines lisent les échanges qui se sont posés (six au plus, après la réponse)
  after(() => noterMesConversations(supabase, moi).catch(() => 0));
  return NextResponse.json({ ok: true, proches, presence, cle }, { headers: sansCache });
}

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 403 });
  if (p?.action === "la") return NextResponse.json({ ok: true, ...(await marquerLa(supabase, moi)) }, { headers: sansCache });
  if (p?.action === "comprendre") {
    const r = await comprendre(supabase, moi, p.son, p.duree);
    if (!r.repliques) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true, repliques: r.repliques, par: r.par, transcrit: r.transcrit, dispo: r.dispo }, { headers: sansCache });
  }
  if (p?.action === "envoyer") {
    const r = await envoyerParole(supabase, moi, p.cle, p.son, p.duree, p.repliques);
    if (!r.message) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    // 🔔 « Zoé t'a parlé ! » : après l'envoi, jamais bloquant
    const a = r.aPrevenir;
    if (a) after(() => prevenirDeLaParole(supabase, moi, a));
    after(() => battre(supabase, moi, p.cle).catch(() => undefined));
    return NextResponse.json({ ok: true, message: r.message }, { headers: sansCache });
  }
  // ✍️ (lot M1) un message écrit ; après la réponse, l'aperçu de son lien, puis « ✍️ Léa t'a écrit »
  if (p?.action === "ecrire") {
    const r = await ecrireMessage(supabase, moi, p.cle, p.texte, p.tete);
    if (!r.message) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
    const a = r.apres;
    // (💓 le pouls bat d'abord : l'autre voit le message à son prochain battement)
    after(() => battre(supabase, moi, p.cle).catch(() => undefined));
    if (a) after(() => apresEcrit(supabase, moi, a).catch(() => undefined));
    return NextResponse.json({ ok: true, message: r.message }, { headers: sansCache });
  }
  // 📷 (lot M2) où déposer sa photo ; puis elle part (réencodée, contrôlée) et l'autre est prévenu après la réponse
  if (p?.action === "photo-depot") {
    const r = await depotPhoto(supabase, moi, p.cle);
    if (!r.jeton) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
    return NextResponse.json({ ok: true, seau: r.seau, chemin: r.chemin, jeton: r.jeton, id: r.id }, { headers: sansCache });
  }
  if (p?.action === "photo") {
    const r = await envoyerPhoto(supabase, moi, p.cle, p.id, p.legende, p.tete);
    if (!r.message) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
    const a = r.apres;
    after(() => battre(supabase, moi, p.cle).catch(() => undefined));
    if (a) after(() => apresPhoto(supabase, moi, a).catch(() => undefined));
    return NextResponse.json({ ok: true, message: r.message }, { headers: sansCache });
  }
  // 🎬 (lot M3) où déposer sa vidéo ; puis elle part (sa durée lue, ses images contrôlées) et l'autre est prévenu
  if (p?.action === "video-depot") {
    const r = await depotVideo(supabase, moi, p.cle, p.type);
    if (!r.jeton) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
    return NextResponse.json({ ok: true, seau: r.seau, chemin: r.chemin, jeton: r.jeton, id: r.id }, { headers: sansCache });
  }
  if (p?.action === "video") {
    const r = await envoyerVideo(supabase, moi, p.cle, p.id, p.type, p.duree, p.images, p.legende, p.tete);
    if (!r.message) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
    const a = r.apres;
    after(() => battre(supabase, moi, p.cle).catch(() => undefined));
    if (a) after(() => apresVideo(supabase, moi, a).catch(() => undefined));
    return NextResponse.json({ ok: true, message: r.message }, { headers: sansCache });
  }
  // 🗑️ (lot M1) il efface son message, dans les 24 heures : pour les deux ; ce que l'étagère en avait noté s'en va
  if (p?.action === "effacer") {
    const r = await effacerMessage(supabase, moi, p.cle, p.id);
    if (r.ok) await oublierMessage(supabase, moi, p.cle, p.id).catch(() => undefined);
    if (r.ok) after(() => battre(supabase, moi, p.cle).catch(() => undefined));
    return NextResponse.json(r.ok ? { ok: true } : { error: r.error }, { status: r.ok ? 200 : (r.statut ?? 400), headers: sansCache });
  }
  // 📲 par WhatsApp : son message en lien ; la réponse de celui qui l'a reçu
  if (p?.action === "lien-creer") {
    const r = await creerLien(supabase, moi, p.son, p.duree, p.repliques, p.pour);
    if (!r.id) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true, id: r.id, url: r.url, reste: r.reste }, { headers: sansCache });
  }
  if (p?.action === "lien-repondre") {
    const r = await repondreAuLien(supabase, moi, p.id, p.son, p.duree, p.repliques);
    if (!r.message) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    const a = r.aPrevenir;
    if (a) after(() => prevenirDeLaParole(supabase, moi, a));
    return NextResponse.json({ ok: true, message: r.message, cle: r.cle }, { headers: sansCache });
  }
  // 🎭 la conversation vivante (lot R4a)
  if (p?.action === "prepare") {
    const r = await direQuIlPrepare(supabase, moi, p.cle, p.oui);
    return NextResponse.json(r.ok ? { ok: true } : { error: r.error }, { status: r.ok ? 200 : (r.statut ?? 400), headers: sansCache });
  }
  if (p?.action === "aparte-effacer") {
    const r = await effacerAparte(supabase, moi, p.cle, p.id);
    return NextResponse.json(r.ok ? { ok: true } : { error: r.error }, { status: r.ok ? 200 : (r.statut ?? 400), headers: sansCache });
  }
  if (p?.action === "geste") {
    const r = await poserGeste(supabase, moi, p.cle, p.type, p.quoi, p.message, p.surprise);
    if (!r.geste) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
    const a = r.aPrevenir;
    after(() => battre(supabase, moi, p.cle).catch(() => undefined));
    if (a) after(() => prevenirDuPanneau(supabase, moi, a));
    return NextResponse.json({ ok: true, geste: r.geste }, { headers: sansCache });
  }
  if (p?.action === "presence") return NextResponse.json({ ok: true, ...(await choisirPresence(supabase, moi, p.oui)) }, { headers: sansCache });
  if (p?.action === "meme") {
    const h = await hDeCle(supabase, p.cle);
    const r = !h ? { error: "Ce proche n’existe pas.", statut: 404 } : !(await seParlent(supabase, moi.id, h)) ? { error: "Vous pourrez vous parler quand vous vous serez ajoutés tous les deux.", statut: 403 } : await envoyerMemeAuProche(supabase, moi, h, p.id);
    if (r.ok) after(() => battre(supabase, moi, p.cle).catch(() => undefined));
    return NextResponse.json(r.ok ? { ok: true } : { error: r.error }, { status: r.ok ? 200 : (r.statut ?? 400), headers: sansCache });
  }
  if (p?.action === "proche" || p?.action === "signaler") {
    const r = p.action === "proche" ? await changerProche(supabase, moi, p.cle, p.oui) : await signalerParole(supabase, moi, p.cle, p.id);
    // 📚 un proche retiré : leur étagère s'efface ; un message signalé : ce qui en a été noté s'en va
    if (r.ok && p.action === "proche" && p.oui === false) await effacerEtagere(supabase, moi.id, p.cle).catch(() => undefined);
    if (r.ok && p.action === "signaler") await oublierMessage(supabase, moi, p.cle, p.id).catch(() => undefined);
    return NextResponse.json(r.ok ? { ok: true } : { error: r.error }, { status: r.ok ? 200 : (r.statut ?? 400), headers: sansCache });
  }
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
}
