"use client";

// Espace Pro — « Mes photos ». Le pro ajoute ses propres réalisations : le
// navigateur les compresse (max ~1200 px, JPEG) avant l'envoi, pour rester léger.
// Si des photos sont présentes, elles remplacent les photos Google sur la maquette.
import { useEffect, useRef, useState } from "react";

// Compresse un fichier image → data URI JPEG (max 1200 px de large).
function compress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxW = 1200;
      const scale = Math.min(1, maxW / (img.width || maxW));
      const w = Math.max(1, Math.round((img.width || maxW) * scale));
      const h = Math.max(1, Math.round((img.height || maxW) * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

export function ProGallery({ slug, token }: { slug: string; token: string }) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const call = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/site-internet/pro/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, ...body }),
    });
    return { ok: r.ok, j: (await r.json().catch(() => ({}))) as Record<string, unknown> };
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { ok, j } = await call({ action: "get" });
        if (!cancelled && ok && Array.isArray(j.photos)) setPhotos(j.photos as string[]);
      } catch {
        /* best-effort */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, token]);

  const onFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    setErr("");
    try {
      for (const file of Array.from(files).slice(0, 10)) {
        if (!/^image\//.test(file.type)) continue;
        const dataUrl = await compress(file);
        const { ok, j } = await call({ action: "add", photo: dataUrl });
        if (ok && Array.isArray(j.photos)) setPhotos(j.photos as string[]);
        else {
          setErr(typeof j.error === "string" ? j.error : "Ajout impossible.");
          break;
        }
      }
    } catch {
      setErr("Impossible de traiter cette image.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async (i: number) => {
    setPhotos((ps) => ps.filter((_, k) => k !== i)); // optimiste
    try {
      const { j, ok } = await call({ action: "remove", index: i });
      if (ok && Array.isArray(j.photos)) setPhotos(j.photos as string[]);
    } catch {
      /* best-effort */
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .gal{margin-top:30px;border-top:1px solid var(--hair);padding-top:24px;}
          .pro .gal .a-title{font-family:Georgia,serif;font-weight:700;font-size:19px;}
          .pro .gal .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .gal .add{margin-top:15px;width:100%;background:var(--ink);color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;}
          .pro .gal .add:disabled{opacity:.5;cursor:not-allowed;}
          .pro .gal .err{margin-top:9px;font-size:12px;color:#B23B3B;}
          .pro .gal .grid{margin-top:16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
          .pro .gal .cell{position:relative;border-radius:10px;overflow:hidden;border:1px solid var(--hair);aspect-ratio:1;}
          .pro .gal .cell img{width:100%;height:100%;object-fit:cover;display:block;}
          .pro .gal .cell .x{position:absolute;top:5px;right:5px;width:24px;height:24px;border-radius:50%;background:rgba(12,14,12,.6);color:#fff;border:none;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
          .pro .gal .none{margin-top:14px;font-size:13px;color:var(--faint);line-height:1.45;}
          `,
        }}
      />
      <div className="gal">
        <div className="a-title">🖼️ Mes photos</div>
        <div className="a-sub">
          Ajoutez vos propres réalisations. Dès qu&apos;il y en a, elles remplacent les photos Google sur votre site.
          Les images sont automatiquement allégées.
        </div>

        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => onFiles(e.target.files)} />
        <button className="add" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? "Ajout…" : "＋ Ajouter des photos"}
        </button>
        {err && <div className="err">{err}</div>}

        {loaded && photos.length === 0 ? (
          <div className="none">Aucune photo pour l&apos;instant — votre site utilise vos photos Google.</div>
        ) : (
          <div className="grid">
            {photos.map((src, i) => (
              <div className="cell" key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Photo ${i + 1}`} />
                <button className="x" aria-label="Retirer" onClick={() => remove(i)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
