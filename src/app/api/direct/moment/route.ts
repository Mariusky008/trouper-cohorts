// 📸 ENVOYER LE MOMENT (les grands moments, lot R3 ; `lib/direct/moment-partage.ts`) — le sien seulement (le cookie
// d'habitant).
//
// POST { video, titre, t, e, mot? } → { moment, image, lien } : l'image story de mon grand moment, fabriquée et gardée ;
// son adresse (`/moment/<id>`). Sans compte : 401 ; sans figurine : 404 ; plus de vingt aujourd'hui : 429.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { creerMoment } from "@/lib/direct/moment-partage-serveur";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };

export async function POST(req: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine sur ce téléphone." }, { status: 401, headers: sansCache });
  const p = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const r = await creerMoment(supabase, moi, p, new URL(req.url).origin);
  if (r.error !== undefined) return NextResponse.json({ error: r.error }, { status: r.statut, headers: sansCache });
  return NextResponse.json({ ok: true, moment: r.moment, image: r.image, lien: r.lien }, { headers: sansCache });
}
