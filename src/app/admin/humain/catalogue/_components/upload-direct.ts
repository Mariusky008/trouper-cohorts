import { createClient } from "@/lib/supabase/client";

// Upload DIRECT navigateur → Supabase Storage (via URL signée) pour contourner la limite
// Vercel de 4,5 Mo. Partagé entre l'uploader média de l'offre et la photo de profil du pro.
export type UploadKind = "photo" | "gallery" | "video" | "profile";

export async function uploadDirect(file: File, kind: UploadKind, placeId: string): Promise<string> {
  const signRes = await fetch("/api/admin/humain/marketplace/places/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ placeId, kind, fileName: file.name, contentType: file.type }),
  });
  if (!signRes.ok) {
    const j = (await signRes.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error || "Signature de l'upload impossible.");
  }
  const { bucket, path, token, publicUrl } = (await signRes.json()) as {
    bucket: string;
    path: string;
    token: string;
    publicUrl: string;
  };
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, { contentType: file.type });
  if (error) throw new Error(error.message || "Upload Supabase échoué.");
  return publicUrl;
}
