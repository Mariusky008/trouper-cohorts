// 🔗 L'APERÇU DU LIEN D'UN MOMENT : `/api/direct/moment/<id>/apercu` — 1200 × 630 en JPEG, ce que WhatsApp, Messenger ou
// iMessage montrent sous le lien (l'image story entière, au centre). Public, à une adresse qui ne change pas. Inconnu ou
// de plus de trente jours : 404.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apercuDeMoment } from "@/lib/direct/moment-partage-serveur";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const jpg = await apercuDeMoment(createAdminClient(), (await params).id).catch(() => null);
  if (!jpg) return NextResponse.json({ error: "Ce moment s’est effacé." }, { status: 404, headers: { "cache-control": "no-store" } });
  return new NextResponse(new Uint8Array(jpg), { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=86400, immutable" } });
}
