// 🎬 LA MINIATURE D'UN MOMENT ENVOYÉ (les grands moments, lot R5) : `/api/direct/moment/<id>/miniature` — la miniature
// officielle de sa vidéo, relayée par le serveur : le téléphone peut la dessiner dans la petite vidéo de 4 secondes
// (une image d'un autre site ne se dessine pas). Pas de miniature : 404 (la vidéo se fait sans).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { miniatureDeMoment } from "@/lib/direct/moment-partage-serveur";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const jpg = await miniatureDeMoment(createAdminClient(), (await params).id).catch(() => null);
  if (!jpg) return NextResponse.json({ error: "Pas de miniature." }, { status: 404, headers: { "cache-control": "no-store" } });
  return new NextResponse(new Uint8Array(jpg), { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=86400" } });
}
