// 📸 LA FIGURINE D'UN MOMENT ENVOYÉ (les grands moments) : `/api/direct/moment/<id>/figurine` — sa figurine seule, avec
// la tête de l'émotion, telle qu'elle était ; la page du moment la rejoue à sa seconde. Inconnu ou effacé : 404.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { imageDeMoment } from "@/lib/direct/moment-partage-serveur";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const png = await imageDeMoment(createAdminClient(), (await params).id, "figurine").catch(() => null);
  if (!png) return NextResponse.json({ error: "Ce moment s’est effacé." }, { status: 404, headers: { "cache-control": "no-store" } });
  return new NextResponse(new Uint8Array(png), { headers: { "content-type": "image/png", "cache-control": "public, max-age=86400, immutable" } });
}
