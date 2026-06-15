"use client";

import { useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Upload DIRECT navigateur → Supabase Storage (via URL signée) pour contourner la limite
// Vercel de 4,5 Mo (le fichier ne passe plus par la fonction serverless). On ne soumet au
// formulaire que les URLs publiques (champs offer_photo_url / offer_gallery_urls / offer_video_url).

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 Mo / photo
const MAX_VIDEO_BYTES = 80 * 1024 * 1024; // 80 Mo / vidéo (vérifier la limite du bucket Supabase)
const MAX_GALLERY = 6;

type Kind = "photo" | "gallery" | "video";

async function uploadDirect(file: File, kind: Kind, placeId: string): Promise<string> {
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

export default function OfferMediaUploader({
  placeId,
  defaultPhotoUrl,
  defaultGalleryUrls,
  defaultVideoUrl,
}: {
  placeId: string;
  defaultPhotoUrl?: string;
  defaultGalleryUrls?: string[];
  defaultVideoUrl?: string;
}) {
  const pid = String(placeId || "").trim() || "new";
  const [photoUrl, setPhotoUrl] = useState(defaultPhotoUrl || "");
  const [gallery, setGallery] = useState<string[]>(defaultGalleryUrls || []);
  const [videoUrl, setVideoUrl] = useState(defaultVideoUrl || "");
  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState<string>("");
  const photoInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const uid = useId();

  async function onPickPhoto(files: FileList | null) {
    setError("");
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("La photo doit être une image.");
    if (file.size > MAX_PHOTO_BYTES) return setError("Photo > 10 Mo.");
    setBusy("Photo de couverture…");
    try {
      setPhotoUrl(await uploadDirect(file, "photo", pid));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'upload.");
    } finally {
      setBusy("");
      if (photoInput.current) photoInput.current.value = "";
    }
  }

  async function onPickGallery(files: FileList | null) {
    setError("");
    const list = Array.from(files || []);
    if (!list.length) return;
    const room = MAX_GALLERY - gallery.length;
    if (room <= 0) return setError(`Galerie pleine (max ${MAX_GALLERY}).`);
    const toUpload = list.slice(0, room);
    for (let i = 0; i < toUpload.length; i += 1) {
      const file = toUpload[i];
      if (!file.type.startsWith("image/")) {
        setError("La galerie n'accepte que des images.");
        continue;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setError("Une photo dépasse 10 Mo.");
        continue;
      }
      setBusy(`Galerie ${i + 1}/${toUpload.length}…`);
      try {
        const url = await uploadDirect(file, "gallery", pid);
        setGallery((prev) => (prev.length >= MAX_GALLERY ? prev : [...prev, url]));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec de l'upload galerie.");
      }
    }
    setBusy("");
    if (galleryInput.current) galleryInput.current.value = "";
  }

  async function onPickVideo(files: FileList | null) {
    setError("");
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) return setError("Le fichier doit être une vidéo.");
    if (file.size > MAX_VIDEO_BYTES) return setError("Vidéo > 80 Mo.");
    setBusy("Vidéo…");
    try {
      setVideoUrl(await uploadDirect(file, "video", pid));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'upload vidéo.");
    } finally {
      setBusy("");
      if (videoInput.current) videoInput.current.value = "";
    }
  }

  const lbl = "text-[11px] font-bold uppercase tracking-wide text-muted-foreground";
  const inp = "h-10 w-full rounded border bg-background px-3 text-sm";
  const fileBtn =
    "block w-full cursor-pointer rounded border border-dashed bg-background px-3 py-2 text-xs file:mr-3 file:rounded file:border-0 file:bg-amber-100 file:px-3 file:py-1 file:text-xs file:font-bold file:text-amber-900";

  return (
    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-3 md:col-span-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-amber-800">📸 Médias de l&apos;offre</span>
        <span className="text-[10px] text-slate-500">Upload direct (gros fichiers OK · pas de limite 4,5 Mo)</span>
      </div>
      {error ? <p className="rounded bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">{error}</p> : null}
      {busy ? <p className="rounded bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700">⏳ Envoi en cours : {busy}</p> : null}

      {/* Photo de couverture */}
      <div className="space-y-1">
        <span className={lbl}>Photo de couverture</span>
        <div className="flex items-center gap-2">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-12 w-12 flex-shrink-0 rounded border object-cover" />
          ) : null}
          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            onChange={(e) => onPickPhoto(e.target.files)}
            className={fileBtn}
            id={`${uid}-photo`}
          />
          {photoUrl ? (
            <button type="button" onClick={() => setPhotoUrl("")} className="text-[11px] text-red-600 hover:underline">
              Retirer
            </button>
          ) : null}
        </div>
        <input
          name="offer_photo_url"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="…ou collez une URL https://.../photo.jpg"
          className={inp}
        />
      </div>

      {/* Galerie carrousel */}
      <div className="space-y-1">
        <span className={lbl}>🖼️ Galerie (carrousel · max {MAX_GALLERY})</span>
        <input
          ref={galleryInput}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onPickGallery(e.target.files)}
          className={fileBtn}
        />
        {gallery.length ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {gallery.map((u, i) => (
              <span key={`${u}-${i}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="h-12 w-12 rounded border object-cover" />
                <button
                  type="button"
                  onClick={() => setGallery((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white"
                  aria-label="Retirer"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <textarea
          name="offer_gallery_urls"
          value={gallery.join("\n")}
          onChange={(e) => setGallery(e.target.value.split(/[\r\n]+/).map((x) => x.trim()).filter(Boolean).slice(0, MAX_GALLERY))}
          placeholder={"…ou 1 URL par ligne (ordre du carrousel)"}
          className="min-h-14 w-full rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs"
        />
      </div>

      {/* Vidéo */}
      <div className="space-y-1">
        <span className={lbl}>🎬 Vidéo verticale (.mp4/.webm) ou lien YouTube</span>
        <input
          ref={videoInput}
          type="file"
          accept="video/*"
          onChange={(e) => onPickVideo(e.target.files)}
          className={fileBtn}
        />
        <input
          name="offer_video_url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="…ou URL .mp4 directe / lien YouTube"
          className={inp}
        />
      </div>
    </div>
  );
}
