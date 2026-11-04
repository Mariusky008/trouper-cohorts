// 💬 LA RENCONTRE DU JOUR (`lib/direct/rencontre.ts`).
//
// GET : sa rencontre du jour (faite à la première visite du jour : l'IA l'écrit), sa ressemblance, ses amis.
// GET ?id=<id> : une rencontre d'avant.
// POST { action: "reagir", id, n, v?: "moi"|"pas"|null, e?: émotion|null } : sa réaction à une phrase → sa ressemblance.
// POST { action: "inviter" } → { code, lien } : le lien à envoyer à un ami (WhatsApp).
// POST { action: "accepter", code } : il a ouvert le lien d'un ami → ils sont amis.
// POST { action: "signaler", id } : la rencontre ne s'affiche plus.
// Jamais d'habitant créé ici.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { lienInvitation } from "@/lib/direct/rencontre";
import { accepter, inviter, reagir, rencontreDuJour, rencontreParId, signalerRencontre } from "@/lib/direct/rencontre-serveur";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const sansCache = { "cache-control": "private, no-store" };

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ ok: true, compte: false }, { headers: sansCache });
  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const r = await rencontreParId(supabase, moi, id);
    return r ? NextResponse.json({ ok: true, rencontre: r }, { headers: sansCache }) : NextResponse.json({ error: "Cette rencontre n’existe plus." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, compte: true, ...(await rencontreDuJour(supabase, moi)) }, { headers: sansCache });
}

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine." }, { status: 403 });
  if (p?.action === "reagir") {
    const r = await reagir(supabase, moi, p.id, p.n, { v: p.v, e: p.e });
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, ressemblance: r.ressemblance ?? null }, { headers: sansCache });
  }
  if (p?.action === "inviter") {
    const code = await inviter(supabase, moi);
    return NextResponse.json({ ok: true, code, lien: lienInvitation(code) }, { headers: sansCache });
  }
  if (p?.action === "accepter") {
    const r = await accepter(supabase, moi, p.code);
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, ...(r.ami ? { ami: r.ami } : {}) }, { headers: sansCache });
  }
  if (p?.action === "signaler") {
    const ok = await signalerRencontre(supabase, moi, p.id);
    return NextResponse.json(ok ? { ok: true } : { error: "Cette rencontre n’existe plus." }, { status: ok ? 200 : 404 });
  }
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
}
