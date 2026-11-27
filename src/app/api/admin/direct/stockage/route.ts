// 🪶 LE STOCKAGE LÉGER, CÔTÉ ADMIN (`lib/direct/stockage-leger-conversion-serveur.ts`) — réservé à l'administrateur.
//
// GET                    → { images, octets } : les PNG lourds encore à convertir dans le seau des figurines
// POST { apres }         → { convertis, avant, apres, dernier, reste, restantes } : un lot ; la page rappelle avec
//                          `apres: dernier` tant que `reste`
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { convertirUnLot, imagesLourdes } from "@/lib/direct/stockage-leger-conversion-serveur";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const l = await imagesLourdes(createAdminClient());
  return NextResponse.json({ ok: true, images: l.length, octets: l.reduce((n, x) => n + x.taille, 0) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const p = (await request.json().catch(() => null)) as { apres?: unknown } | null;
  const apres = typeof p?.apres === "string" ? p.apres.slice(0, 500) : "";
  const r = await convertirUnLot(createAdminClient(), apres, Date.now() + 50_000);
  return NextResponse.json({ ok: true, ...r }, { headers: sansCache });
}
