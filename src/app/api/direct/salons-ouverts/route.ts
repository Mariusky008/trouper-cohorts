// 🛋️ LES SALONS OUVERTS (`lib/direct/salons-ouverts.ts`, `salons-ouverts-serveur.ts` ; `docs/univers/decouvrir.md`,
// sections 5, 6 et 18 ; les lots D3 et D4) — le sien seulement (le cookie d'habitant).
//
// GET ?accueil=1                               → { cartes, age?, invitations?, demandes? } : les salons, ses passions
//                                                d'abord (`age` : dis d'abord si tu as 18 ans) ; ce qui l'attend
// GET ?salon=<id>&depuis=<ms>&connus=<q,q>     → { pouls } : qui est là, ce qui s'est dit depuis ; il redit qu'il est là
// GET ?conversation=<id>                       → { messages } : les 48 dernières heures
// POST { action: "age", adulte }               → { adulte } : 18 ans ou plus (un « non » ne se retourne pas)
// POST { action: "entrer", theme }             → { ouverture } : le salon le plus rempli qui a une place
// POST { action: "ecrire", salon, sorte, texte?, cle?, a? } → { message } ; un texte relu avant de partir (`refus`)
// POST { action: "sortir", salon }             → { ok } : sa place se libère
// POST { action: "signaler", salon, q, motif, message? } → { ok, exclu } ; trois en une heure : 24 h dehors
// POST { action: "ne-plus-voir" | "revoir", q } → { caches }
// 🎬 LE LOT D2, LA SÉANCE CHEZ MOI (le salon « chez-<q> » : pouls, écrire, sortir, conversation comme un salon ouvert)
// POST { action: "entrer-chez", chez: "moi" | <clé>, place? } → { ouverture } : ma télé ; chez un proche qui m'invite
//                                               (`place` : le jeton d'un lien WhatsApp — sa place libre, et proches)
// POST { action: "place" }                     → { lien, prenom } : ➕ un lien qui réserve une place libre de ma télé
//                                               (six heures, une personne ; `decouvrir.md` section 30)
// POST { action: "tele", salon, quoi: "video" | "suivante" | "pause" | "jouer", id? } → { seance } : l'hôte mène la télé
// POST { action: "inviter", cles: [<clé>…] }   → { invites } : trois proches au plus (une notification chacun)
// POST { action: "inviter-video", id, t, cles } → { invites, titre, cle } : 👥 depuis ma télé du jour, sans la quitter —
//                                                 ma séance se cale sur cette vidéo (à cette seconde, en pause), mes
//                                                 proches sont invités avec elle (`ma-maison.md`, section 25)
// POST { action: "pas-maintenant", cle }       → { ok } : l'invitation de cet hôte s'en va
// 🗄️ LE LOT D5
// POST { action: "aimer", salon, message }     → { aimes, etagere } : trois cœurs, le message monte sur l'étagère
// GET ?etagere=<id>                            → { moments } : l'étagère du salon (de son thème)
// POST { action: "garder", salon, moment }     → { id } : le moment va sur mon étagère, dans ma maison
// POST { action: "proche", salon, q }          → { proches?, envoyee? } : « 👯 Ajouter en proche »
// POST { action: "repondre-proche", q, oui }   → { proches } : accepter (ou non) une demande reçue
// `CLIKME_SALONS_OUVERTS=0` : les salons ouverts sont fermés (404) ; les séances entre proches restent possibles.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { direSesDixHuitAns } from "@/lib/direct/majorite-serveur";
import { salonsOuverts } from "@/lib/direct/interrupteurs-serveur";
import {
  accueilDesSalons,
  aimerMessage,
  conversationDuSalon,
  demanderProche,
  ecrireAuSalon,
  entrerAuSalon,
  entrerChez,
  etagereDuSalon,
  garderMoment,
  inviterChezMoi,
  inviterSurUneVideo,
  mesInvitations,
  reserverUnePlace,
  nePlusVoir,
  poulsDuSalon,
  refuserInvitation,
  repondreDemande,
  signalerAuSalon,
  sortirDuSalon,
  teleDeLaSeance,
} from "@/lib/direct/salons-ouverts-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };
const SANS_COMPTE = { error: "Crée d’abord ta figurine sur ce téléphone." };
const FERMES = { error: "Les salons ouverts sont fermés pour l’instant." };
// (les séances entre proches ne passent pas par l'interrupteur des salons ouverts)
const SEANCE = new Set(["entrer-chez", "tele", "inviter", "inviter-video", "place", "pas-maintenant"]);
const enSeance = (salon: unknown) => String(salon ?? "").startsWith("chez-");

export async function GET(request: Request) {
  const u = new URL(request.url).searchParams;
  const ouverts = salonsOuverts();
  if (!ouverts && !u.get("accueil") && !enSeance(u.get("salon") ?? u.get("conversation"))) return NextResponse.json(FERMES, { status: 404, headers: sansCache });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  // (salons fermés : l'accueil ne montre plus que les invitations devant la télé d'un proche)
  if (u.get("accueil")) return NextResponse.json({ ok: true, ...(ouverts ? await accueilDesSalons(supabase, moi) : { cartes: [], invitations: await mesInvitations(supabase, moi).catch(() => []) }) }, { headers: sansCache });
  if (u.get("etagere")) {
    const r = await etagereDuSalon(supabase, moi, u.get("etagere"));
    return NextResponse.json(r.error ? { error: r.error } : { ok: true, moments: r.moments }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });
  }
  if (u.get("conversation")) {
    const r = await conversationDuSalon(supabase, moi, u.get("conversation"));
    return NextResponse.json(r.error ? { error: r.error } : { ok: true, messages: r.messages }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });
  }
  const r = await poulsDuSalon(supabase, moi, u.get("salon"), u.get("depuis"), u.get("connus"));
  return NextResponse.json(r.error ? { error: r.error } : { ok: true, pouls: r.pouls }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });
}

export async function POST(request: Request) {
  const p = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  if (!salonsOuverts() && !SEANCE.has(String(p.action)) && !enSeance(p.salon)) return NextResponse.json(FERMES, { status: 404, headers: sansCache });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  const repondre = (r: { error?: string; statut?: number }, ok: Record<string, unknown> = {}, aussi: Record<string, unknown> = {}) =>
    NextResponse.json(r.error ? { error: r.error, ...aussi } : { ok: true, ...ok }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });
  if (p.action === "age") {
    const r = await direSesDixHuitAns(supabase, moi.id, p.adulte);
    return repondre(r, { adulte: r.adulte });
  }
  if (p.action === "entrer") {
    const r = await entrerAuSalon(supabase, moi, p.theme);
    return repondre(r, { ouverture: r.ouverture }, { ...(r.age ? { age: true } : {}), ...(r.figurine ? { figurine: true } : {}), ...(r.exclu ? { exclu: true } : {}) });
  }
  if (p.action === "ecrire") {
    const r = await ecrireAuSalon(supabase, moi, p);
    return repondre(r, { message: r.message }, r.refus ? { refus: r.refus } : {});
  }
  if (p.action === "sortir") return repondre(await sortirDuSalon(supabase, moi, p.salon));
  if (p.action === "signaler") {
    const r = await signalerAuSalon(supabase, moi, p);
    return repondre(r, { exclu: Boolean(r.exclu) });
  }
  if (p.action === "ne-plus-voir" || p.action === "revoir") {
    const r = await nePlusVoir(supabase, moi, p.q, p.action === "revoir");
    return repondre(r, { caches: r.caches });
  }
  // 🎬 la séance chez moi
  if (p.action === "entrer-chez") {
    const r = await entrerChez(supabase, moi, p.chez, p.place);
    return repondre(r, { ouverture: r.ouverture }, r.figurine ? { figurine: true } : {});
  }
  if (p.action === "tele") {
    const r = await teleDeLaSeance(supabase, moi, p);
    return repondre(r, { seance: r.seance });
  }
  if (p.action === "inviter") {
    const r = await inviterChezMoi(supabase, moi, p.cles);
    return repondre(r, { invites: r.invites });
  }
  if (p.action === "place") {
    const r = await reserverUnePlace(supabase, moi);
    return repondre(r, { lien: r.lien, prenom: r.prenom });
  }
  if (p.action === "inviter-video") {
    const r = await inviterSurUneVideo(supabase, moi, p);
    return repondre(r, { invites: r.invites, titre: r.titre, cle: r.cle });
  }
  if (p.action === "pas-maintenant") return repondre(await refuserInvitation(supabase, moi, p.cle));
  // 🗄️ l'étagère, 👯 les proches
  if (p.action === "aimer") {
    const r = await aimerMessage(supabase, moi, p);
    return repondre(r, { aimes: r.aimes, etagere: Boolean(r.etagere) });
  }
  if (p.action === "garder") {
    const r = await garderMoment(supabase, moi, p);
    return repondre(r, { id: r.id });
  }
  if (p.action === "proche") {
    const r = await demanderProche(supabase, moi, p);
    return repondre(r, { proches: Boolean(r.proches), envoyee: Boolean(r.envoyee) });
  }
  if (p.action === "repondre-proche") {
    const r = await repondreDemande(supabase, moi, p);
    return repondre(r, { proches: Boolean(r.proches) });
  }
  return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
}
