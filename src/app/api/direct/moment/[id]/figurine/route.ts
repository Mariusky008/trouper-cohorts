// 📸 LA FIGURINE D'UN MOMENT ENVOYÉ (les grands moments) : `/api/direct/moment/<id>/figurine` — sa figurine seule, avec
// la tête de l'émotion, telle qu'elle était ; la page du moment la rejoue à sa seconde. Inconnu ou effacé : 404.
// `?bouche=1` (🎙 « Dis-le ») : la même, bouche ouverte — sa bouche suit sa voix dans la vidéo de sa réaction ; sans tête
// qui parle : 404 (la vidéo la fait battre).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { imageDeMoment } from "@/lib/direct/moment-partage-serveur";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const bouche = new URL(req.url).searchParams.get("bouche") === "1";
  const png = await imageDeMoment(createAdminClient(), (await params).id, bouche ? "parle" : "figurine").catch(() => null);
  if (!png) return NextResponse.json({ error: "Ce moment s’est effacé." }, { status: 404, headers: { "cache-control": "no-store" } });
  return new NextResponse(new Uint8Array(png), { headers: { "content-type": "image/png", "cache-control": "public, max-age=86400, immutable" } });
}
