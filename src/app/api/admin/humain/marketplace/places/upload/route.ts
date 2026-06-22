import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Génère une URL d'upload SIGNÉE pour que le navigateur envoie le fichier DIRECTEMENT à
// Supabase Storage (et non via la fonction serverless Vercel, plafonnée à 4,5 Mo → 413).
// Le serveur ne renvoie que le chemin + le token + l'URL publique finale.
const BUCKET = "marketplace-privilege-offers";
const KIND_DIR: Record<string, string> = {
  photo: "marketplace-offers",
  gallery: "marketplace-gallery",
  video: "marketplace-videos",
  profile: "marketplace-profiles",
};

function pickExtension(fileName: string, contentType: string): string {
  const fromName = String(fileName || "").split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
  if (fromName && fromName.length <= 5) return fromName;
  const ct = String(contentType || "").toLowerCase();
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("mp4")) return "mp4";
  if (ct.includes("webm")) return "webm";
  if (ct.includes("quicktime")) return "mov";
  return ct.startsWith("video/") ? "mp4" : "jpg";
}

export async function POST(request: Request) {
  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return NextResponse.json({ error: "Session requise." }, { status: 401 });
  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!adminRow) return NextResponse.json({ error: "Accès admin requis." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as
    | { placeId?: string; kind?: string; fileName?: string; contentType?: string }
    | null;
  const kind = String(body?.kind || "").trim();
  if (!KIND_DIR[kind]) return NextResponse.json({ error: "Type de média invalide." }, { status: 400 });
  const contentType = String(body?.contentType || "").trim().toLowerCase();
  const okType = kind === "video" ? contentType.startsWith("video/") : contentType.startsWith("image/");
  if (!okType) return NextResponse.json({ error: "Type de fichier invalide." }, { status: 400 });

  const placeId = String(body?.placeId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "new";
  const ext = pickExtension(String(body?.fileName || ""), contentType);
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${KIND_DIR[kind]}/${placeId}/${Date.now()}-${rand}.${ext}`;

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Impossible de signer l'upload." }, { status: 500 });
  }
  const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({
    bucket: BUCKET,
    path: data.path,
    token: data.token,
    publicUrl: String(pub?.publicUrl || "").trim(),
  });
}
