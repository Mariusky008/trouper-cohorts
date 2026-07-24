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
  const [videos, setVideos] = useState<string[]>([]);
  const [vidInput, setVidInput] = useState("");
  const [vidErr, setVidErr] = useState("");
  const [vidBusy, setVidBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const catalogueUrl = typeof window !== "undefined" ? `${window.location.origin}/site-internet/apercu/${slug}/catalogue` : `/site-internet/apercu/${slug}/catalogue`;

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
        if (!cancelled && ok && Array.isArray(j.videos)) setVideos(j.videos as string[]);
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

  const addVideo = async () => {
    const url = vidInput.trim();
    if (!url || vidBusy) return;
    setVidBusy(true);
    setVidErr("");
    try {
      const { ok, j } = await call({ action: "add_video", video: url });
      if (ok && Array.isArray(j.videos)) { setVideos(j.videos as string[]); setVidInput(""); }
      else setVidErr(typeof j.error === "string" ? j.error : "Lien invalide.");
    } catch {
      setVidErr("Ajout impossible.");
    } finally {
      setVidBusy(false);
    }
  };
  const removeVideo = async (i: number) => {
    setVideos((vs) => vs.filter((_, k) => k !== i)); // optimiste
    try {
      const { ok, j } = await call({ action: "remove_video", index: i });
      if (ok && Array.isArray(j.videos)) setVideos(j.videos as string[]);
    } catch {
      /* best-effort */
    }
  };
  const shareCatalogue = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: "Mon catalogue", url: catalogueUrl }); return; }
    } catch { /* annulé */ }
    try { await navigator.clipboard.writeText(catalogueUrl); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch { /* noop */ }
  };
  const vidLabel = (u: string) => (/youtu/i.test(u) ? "▶ YouTube" : "▶ Vidéo") + " · " + u.replace(/^https?:\/\/(www\.)?/, "").slice(0, 34) + "…";

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
          .pro .gal .vid-add{display:flex;gap:8px;margin-top:12px;}
          .pro .gal .vid-add input{flex:1;min-width:0;border:1px solid var(--hair);border-radius:11px;padding:11px 13px;font-size:13.5px;font-family:inherit;background:#fff;}
          .pro .gal .vid-add button{flex:none;background:var(--ink);color:#fff;border:none;border-radius:11px;padding:0 16px;font-size:13.5px;font-weight:700;font-family:inherit;cursor:pointer;}
          .pro .gal .vid-add button:disabled{opacity:.5;cursor:not-allowed;}
          .pro .gal .vlist{margin-top:12px;display:flex;flex-direction:column;gap:8px;}
          .pro .gal .vrow{display:flex;align-items:center;gap:10px;border:1px solid var(--hair);border-radius:11px;padding:10px 12px;font-size:12.5px;background:#fff;}
          .pro .gal .vrow .vt{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#3A3A32;font-weight:600;}
          .pro .gal .vrow .vx{flex:none;background:none;border:none;color:#B23B3B;font-size:15px;cursor:pointer;}
          .pro .gal .share{margin-top:22px;border-top:1px solid var(--hair);padding-top:20px;}
          .pro .gal .share-btn{margin-top:12px;width:100%;background:linear-gradient(120deg,#00E0A0,#07B083);color:#06231a;border:none;border-radius:12px;padding:14px;font-size:14.5px;font-weight:800;font-family:inherit;cursor:pointer;box-shadow:0 12px 26px -14px rgba(0,224,160,.8);}
          .pro .gal .share-link{margin-top:10px;font-size:11.5px;color:var(--faint);word-break:break-all;line-height:1.4;}
          .pro .gal .share-link a{color:var(--ink);font-weight:600;}
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

        <div className="a-title" style={{ marginTop: 24 }}>🎬 Mes vidéos</div>
        <div className="a-sub">
          Collez un lien <b>YouTube</b> ou <b>.mp4</b>&nbsp;: vos vidéos apparaissent dans le catalogue à swiper, comme une story.
        </div>
        <div className="vid-add">
          <input
            value={vidInput}
            onChange={(e) => setVidInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addVideo(); }}
            placeholder="https://youtu.be/… ou https://…/video.mp4"
            inputMode="url"
          />
          <button onClick={addVideo} disabled={vidBusy || !vidInput.trim()}>{vidBusy ? "…" : "＋"}</button>
        </div>
        {vidErr && <div className="err">{vidErr}</div>}
        {videos.length > 0 && (
          <div className="vlist">
            {videos.map((u, i) => (
              <div className="vrow" key={i}>
                <span className="vt">{vidLabel(u)}</span>
                <button className="vx" aria-label="Retirer la vidéo" onClick={() => removeVideo(i)}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div className="share">
          <div className="a-title">📲 Mon catalogue à partager</div>
          <div className="a-sub">
            Un lien à envoyer à vos client·es (WhatsApp, Insta, SMS)&nbsp;: ils swipent vos photos, vidéos et votre offre.
          </div>
          <button className="share-btn" onClick={shareCatalogue}>{copied ? "✓ Lien copié" : "📲 Partager mon catalogue"}</button>
          <div className="share-link">
            <a href={catalogueUrl} target="_blank" rel="noreferrer">{catalogueUrl.replace(/^https?:\/\//, "")}</a>
          </div>
        </div>
      </div>
    </>
  );
}
