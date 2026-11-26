// 👥 MES GROUPES (lots G1 et G2, 26 novembre 2026 ; `docs/univers/mes-groupes.md`) — le sien seulement (le cookie d'habitant).
//
// GET → { invitations, demandes, seances, propositions, adulte? } :
//       · la rangée « Avec mes proches », faite de ce qui existait déjà (G1) — 🎬 les invitations devant la télé d'un
//         proche (lot D2), 👯 les demandes de proche (lot D5), et les séances en cours chez mes proches (lot F3) ; leurs
//         gestes passent par la route des salons, comme avant ;
//       · 📣 « Propositions de groupes » (G2, `groupes-serveur.ts`) : celles que je peux voir, les plus proches d'abord.
// POST { action: "proposer", nom, theme, video? | lien?, quand, pour: "tous" | "proches", places, mot? } → { proposition }
// POST { action: "confirmer" | "laisser", id }   → { proposition } : ma place
// POST { action: "autre-heure", id, quand }      → { proposition } : une autre heure (celui qui propose : il la prend)
// POST { action: "retirer", id }                 → { ok } : sa proposition s'en va
// POST { action: "signaler", id }                → { ok } : trois personnes, et elle disparaît
// POST { action: "entrer", id }                  → { aller } : à l'heure dite, où aller
// 💛 (lot G4) GET → aussi { groupes } : tous mes groupes (et ceux où un proche m'invite) ; leur salon : `/univers/salons?groupe=<id>`
// POST { action: "garder", id }                  → { proposition, groupe? } : « On garde ce groupe ? » à la fin de la séance
// POST { action: "creer-groupe", nom, theme, mot?, cles } → { groupe } : un groupe tout de suite, avec des proches
// POST { action: "garder-groupe" | "non-merci", groupe } → { groupe? } : un proche m'invite dans son groupe
// 📅💬 (lot G5, `groupes-vie-serveur.ts`) GET `?groupe=<id>` → { vie } : ses rendez-vous et sa discussion (membres seulement)
// POST { action: "rdv-ajouter", groupe, nom, recurrence, jour?, heure, minute, quand?, idee? } → { rdv, message? }
// POST { action: "rdv-repondre", groupe, rdv, reponse: "viens" | "absent" | "tard" } → { rdv, entre? }
// POST { action: "rdv-retirer", groupe, rdv }    → { ok } : celui qui l'a posé
// POST { action: "ecrire-groupe", groupe, texte } → { message }
// 🎬 (lot G6, `groupes-jour-serveur.ts`) GET `?groupe=<id>` → aussi { aujourdhui } : la sélection du jour, les rôles
// POST { action: "jour-proposer", groupe, video? | lien?, mot? } → { aujourdhui } : ma vidéo du jour, et mon mot
// POST { action: "jour-retirer", groupe }         → { aujourdhui }
// POST { action: "jour-envie", groupe, video, oui } → { aujourdhui, retenue? } : 🙋
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { maisonDeMoi, mesDemandes, mesInvitations, seancesDesProches } from "@/lib/direct/salons-ouverts-serveur";
import { aujourdhuiDuGroupe, envieDuJour, proposerVideoDuJour, retirerVideoDuJour } from "@/lib/direct/groupes-jour-serveur";
import { ajouterRdv, ecrireAuGroupe, repondreRdv, retirerRdv, vieDuGroupe } from "@/lib/direct/groupes-vie-serveur";
import { autreHeure, confirmer, creerGroupe, entrer, garder, mesGroupes, propositionsPourMoi, proposer, repondreGroupe, retirer, signaler } from "@/lib/direct/groupes-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };
const SANS_COMPTE = { error: "Crée d’abord ta figurine sur ce téléphone." };

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  const groupe = new URL(request.url).searchParams.get("groupe");
  if (groupe) {
    const [r, j] = await Promise.all([vieDuGroupe(supabase, moi, groupe), aujourdhuiDuGroupe(supabase, moi, groupe).catch(() => ({}) as Awaited<ReturnType<typeof aujourdhuiDuGroupe>>)]);
    return NextResponse.json(r.error ? { error: r.error } : { ok: true, vie: r.vie, ...(j.aujourdhui ? { aujourdhui: j.aujourdhui } : {}) }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });
  }
  const [invitations, demandes, seances, propositions, maison, groupes] = await Promise.all([
    mesInvitations(supabase, moi).catch(() => []),
    mesDemandes(supabase, moi).catch(() => []),
    seancesDesProches(supabase, moi).catch(() => []),
    propositionsPourMoi(supabase, moi).catch(() => []),
    maisonDeMoi(supabase, moi.id).catch(() => null),
    mesGroupes(supabase, moi).catch(() => []),
  ]);
  return NextResponse.json({ ok: true, invitations, demandes, seances, propositions, groupes, ...(maison === "adultes" ? { adulte: true } : {}) }, { headers: sansCache });
}

export async function POST(request: Request) {
  const p = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  const repondre = (r: { error?: string; statut?: number }, ok: Record<string, unknown> = {}) =>
    NextResponse.json(r.error ? { error: r.error } : { ok: true, ...ok }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });
  if (p.action === "proposer") {
    const r = await proposer(supabase, moi, p);
    return repondre(r, { proposition: r.proposition });
  }
  if (p.action === "confirmer" || p.action === "laisser") {
    const r = await confirmer(supabase, moi, p.id, p.action === "laisser");
    return repondre(r, { proposition: r.proposition });
  }
  if (p.action === "autre-heure") {
    const r = await autreHeure(supabase, moi, p.id, p.quand);
    return repondre(r, { proposition: r.proposition });
  }
  if (p.action === "retirer") return repondre(await retirer(supabase, moi, p.id));
  if (p.action === "signaler") return repondre(await signaler(supabase, moi, p.id));
  if (p.action === "entrer") {
    const r = await entrer(supabase, moi, p.id);
    return repondre(r, { aller: r.aller });
  }
  if (p.action === "garder") {
    const r = await garder(supabase, moi, p.id);
    return repondre(r, { proposition: r.proposition, ...(r.groupe ? { groupe: r.groupe } : {}) });
  }
  if (p.action === "creer-groupe") {
    const r = await creerGroupe(supabase, moi, p);
    return repondre(r, { groupe: r.groupe });
  }
  if (p.action === "garder-groupe" || p.action === "non-merci") {
    const r = await repondreGroupe(supabase, moi, p.groupe, p.action === "non-merci");
    return repondre(r, r.groupe ? { groupe: r.groupe } : {});
  }
  if (p.action === "rdv-ajouter") {
    const r = await ajouterRdv(supabase, moi, p);
    return repondre(r, { rdv: r.rdv, ...(r.message ? { message: r.message } : {}) });
  }
  if (p.action === "rdv-repondre") {
    const r = await repondreRdv(supabase, moi, p);
    return repondre(r, { rdv: r.rdv, ...(r.entre ? { entre: true } : {}) });
  }
  if (p.action === "rdv-retirer") return repondre(await retirerRdv(supabase, moi, p));
  if (p.action === "ecrire-groupe") {
    const r = await ecrireAuGroupe(supabase, moi, p);
    return repondre(r, { message: r.message });
  }
  if (p.action === "jour-proposer" || p.action === "jour-retirer") {
    const r = p.action === "jour-proposer" ? await proposerVideoDuJour(supabase, moi, p) : await retirerVideoDuJour(supabase, moi, p);
    return repondre(r, { aujourdhui: r.aujourdhui });
  }
  if (p.action === "jour-envie") {
    const r = await envieDuJour(supabase, moi, p);
    return repondre(r, { aujourdhui: r.aujourdhui, ...(r.retenue ? { retenue: true } : {}) });
  }
  return NextResponse.json({ error: "Je ne sais pas faire ça." }, { status: 400, headers: sansCache });
}
