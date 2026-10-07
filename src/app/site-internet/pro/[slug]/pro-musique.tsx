"use client";

// Espace Pro — « La musique de mon ambiance ». Facultative : quelques secondes
// de son lieu, que l'habitant entend en ouvrant « L'ambiance » d'une soirée.
// Voir `lib/site-internet/musique-du-lieu.ts`.
import { useEffect, useState } from "react";
import { MUSIQUE_MAX_OCTETS, type MusiqueDuLieu } from "@/lib/site-internet/musique-du-lieu";

const lireEnDataUrl = (f: File) =>
  new Promise<string>((ok, ko) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => ko(r.error);
    r.readAsDataURL(f);
  });

export function ProMusique({ slug, token }: { slug: string; token: string }) {
  const [musique, setMusique] = useState<MusiqueDuLieu | null>(null);
  const [titre, setTitre] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");

  const appeler = async (corps: Record<string, unknown>) => {
    const r = await fetch("/api/site-internet/musique-lieu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, ...corps }),
    });
    const j = (await r.json().catch(() => ({}))) as { musique?: MusiqueDuLieu | null; error?: string };
    if (r.ok) setMusique(j.musique ?? null);
    return r.ok ? "" : j.error || "Enregistrement impossible.";
  };

  useEffect(() => {
    let fini = false;
    void fetch("/api/site-internet/musique-lieu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, action: "lire" }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!fini && j?.musique) {
          setMusique(j.musique as MusiqueDuLieu);
          setTitre((j.musique as MusiqueDuLieu).titre ?? "");
        }
      })
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [slug, token]);

  const poser = async (f: File | undefined) => {
    if (!f) return;
    setErreur("");
    if (!f.type.startsWith("audio/")) return setErreur("Choisissez un fichier audio (mp3, m4a, wav…).");
    if (f.size > MUSIQUE_MAX_OCTETS) return setErreur("Ce fichier dépasse deux mégaoctets : une demi-minute suffit.");
    setOccupe(true);
    try {
      setErreur(await appeler({ action: "poser", son: await lireEnDataUrl(f), titre }));
    } catch {
      setErreur("Ce fichier n'a pas pu être lu. Essayez-en un autre.");
    } finally {
      setOccupe(false);
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .musique .a-title{font-family:var(--fd),Georgia,serif;font-weight:700;font-size:19px;}
          .pro .musique .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .musique .err{margin-top:9px;font-size:12px;color:#B23B3B;}
          .pro .musique label.champ{display:flex;flex-direction:column;gap:4px;margin-top:14px;font-size:13px;font-weight:600;}
          .pro .musique label.champ input{height:40px;padding:0 12px;border-radius:10px;border:1px solid var(--hair);font:inherit;font-size:14px;font-weight:400;}
          .pro .musique .depot{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;min-height:56px;border-radius:12px;
            border:1.5px dashed var(--hair);background:#F6F5F0;font-size:14px;font-weight:700;cursor:pointer;}
          .pro .musique .depot input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;}
          .pro .musique audio{display:block;width:100%;margin-top:12px;}
          .pro .musique .bas{display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:12px;color:var(--faint);}
          .pro .musique .bas button{padding:0;border:0;background:none;font:inherit;font-size:12px;font-weight:600;color:#B23B3B;cursor:pointer;}
          `,
        }}
      />
      <div className="musique">
        <div className="a-title">🎶 La musique de mon ambiance</div>
        <div className="a-sub">
          Facultatif. Quelques secondes de votre lieu — le DJ de ce soir, le trio du jeudi, la salle qui se remplit. Les habitants
          l’entendent en ouvrant « L’ambiance » de votre soirée, avant de décider de venir. Une demi-minute suffit (deux mégaoctets au
          plus) ; utilisez un son dont vous avez les droits.
        </div>
        <label className="champ">
          Ce qu’on entend
          <input value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={60} placeholder="DJ set house, trio de jazz, concert acoustique…" />
        </label>
        <label className="depot">
          <input type="file" accept="audio/*" disabled={occupe} onChange={(e) => void poser(e.target.files?.[0])} />
          {occupe ? "Envoi…" : musique ? "🔁 Remplacer la musique" : "＋ Déposer une musique"}
        </label>
        {erreur && <div className="err">{erreur}</div>}
        {musique && (
          <>
            <audio src={musique.url} controls preload="none" />
            <div className="bas">
              <span>{musique.titre || "Sans titre"}</span>
              <button type="button" disabled={occupe} onClick={() => void appeler({ action: "retirer" }).then(setErreur)}>
                Retirer
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
