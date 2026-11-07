// 🏛️ LES LIEUX PUBLICS D'« AUTOUR », CÔTÉ ADMIN (`/admin/humain/lieux-publics` ; `lib/direct/autour-serveur.ts`).
//
// POST { action: "placer", ville, nom, emoji, lat, lng } : un lieu public (les Arènes, les Halles…), à la position touchée
//      sur la vraie carte — jamais une position écrite de mémoire. Le même nom le déplace.
// POST { action: "retirer", ville, id } : il quitte la carte (les mèmes qui y étaient ne se montrent plus).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { placerLieuPublic, retirerLieuPublic } from "@/lib/direct/autour-serveur";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  if (p?.action === "placer") {
    const r = await placerLieuPublic(supabase, p.ville, { nom: p.nom, emoji: p.emoji, lat: p.lat, lng: p.lng });
    return NextResponse.json(r.error ? { error: r.error } : { ok: true, lieu: r.lieu }, { status: r.error ? 400 : 200 });
  }
  if (p?.action === "retirer") {
    const r = await retirerLieuPublic(supabase, p.ville, p.id);
    return NextResponse.json(r.error ? { error: r.error } : { ok: true }, { status: r.error ? 400 : 200 });
  }
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
}
