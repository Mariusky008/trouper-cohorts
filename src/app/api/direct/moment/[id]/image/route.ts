// 📸 L'IMAGE D'UN MOMENT ENVOYÉ (les grands moments, lot R3) : `/api/direct/moment/<id>/image` — l'image story, telle
// qu'elle a été fabriquée ; publique (c'est l'aperçu du lien dans WhatsApp), à une adresse qui ne change pas. Inconnu ou
// de plus de trente jours : 404.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { imageDeMoment } from "@/lib/direct/moment-partage-serveur";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const png = await imageDeMoment(createAdminClient(), (await params).id).catch(() => null);
  if (!png) return NextResponse.json({ error: "Ce moment s’est effacé." }, { status: 404, headers: { "cache-control": "no-store" } });
  return new NextResponse(new Uint8Array(png), { headers: { "content-type": "image/png", "cache-control": "public, max-age=86400, immutable", "content-disposition": `inline; filename="clikme-moment.png"` } });
}
