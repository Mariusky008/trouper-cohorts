// 🛡️ L'ADMINISTRATION DES SALONS OUVERTS (`docs/univers/decouvrir.md`, sections 6 et 18 ; la page
// `/admin/humain/salons`) — l'administrateur seulement.
//
// GET                                   → { salons, signalements, exclus } : les salons en cours (qui y est, combien de
//                                         messages en 24 h), les signalements de la semaine, les exclusions en cours
// POST { action: "exclure", q, heures } → { ok } : hors des salons ouverts (24 h par défaut)
// POST { action: "reintegrer", q }      → { ok }
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { administrationDesSalons, exclusionParAdministrateur } from "@/lib/direct/salons-ouverts-serveur";

export const dynamic = "force-dynamic";
const sansCache = { "cache-control": "private, no-store" };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403, headers: sansCache });
  return NextResponse.json({ ok: true, ...(await administrationDesSalons(createAdminClient())) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403, headers: sansCache });
  const p = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  if (p.action !== "exclure" && p.action !== "reintegrer") return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
  const r = await exclusionParAdministrateur(createAdminClient(), p);
  return NextResponse.json(r.error ? { error: r.error } : { ok: true }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });
}
