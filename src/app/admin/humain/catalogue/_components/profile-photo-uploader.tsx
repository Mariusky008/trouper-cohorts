"use client";

import { useRef, useState } from "react";
import { uploadDirect } from "./upload-direct";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 Mo

// Photo de profil du commerçant (le patron). Upload direct .jpg/.png depuis l'admin
// (plus besoin d'aller chercher une URL). Soumet le champ owner_profile_photo_url.
export default function ProfilePhotoUploader({ placeId, defaultUrl }: { placeId: string; defaultUrl?: string }) {
  const pid = String(placeId || "").trim() || "new";
  const [url, setUrl] = useState(defaultUrl || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function onPick(files: FileList | null) {
    setError("");
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("La photo doit être une image (.jpg, .png…).");
    if (file.size > MAX_PHOTO_BYTES) return setError("Photo > 10 Mo.");
    setBusy(true);
    try {
      setUrl(await uploadDirect(file, "profile", pid));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'upload.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const fileBtn =
    "block w-full cursor-pointer rounded border border-dashed bg-background px-3 py-2 text-xs file:mr-3 file:rounded file:border-0 file:bg-amber-100 file:px-3 file:py-1 file:text-xs file:font-bold file:text-amber-900";

  return (
    <label className="space-y-1">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Photo profil (upload .jpg)</span>
      {error ? <p className="rounded bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">{error}</p> : null}
      {busy ? <p className="rounded bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700">⏳ Envoi…</p> : null}
      <div className="flex items-center gap-2">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-12 w-12 flex-shrink-0 rounded-full border object-cover" />
        ) : null}
        <input ref={input} type="file" accept="image/*" onChange={(e) => onPick(e.target.files)} className={fileBtn} />
        {url ? (
          <button type="button" onClick={() => setUrl("")} className="text-[11px] text-red-600 hover:underline">
            Retirer
          </button>
        ) : null}
      </div>
      <input
        name="owner_profile_photo_url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="…ou collez une URL https://.../profil.jpg"
        className="h-10 w-full rounded border bg-background px-3 text-sm"
      />
    </label>
  );
}
