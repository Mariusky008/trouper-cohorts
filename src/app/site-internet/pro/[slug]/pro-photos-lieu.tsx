"use client";

// Espace Pro — « Les photos de mon lieu ». Les mêmes que celles qu'on peut
// donner à l'inscription, chacune sous son intitulé : « si ce n'est pas mis à
// l'inscription, la personne pourra toujours le faire plus tard dans les
// réglages ». Une case par intitulé : on ajoute, on remplace, on retire.
// Voir `lib/site-internet/photos-du-lieu.ts`.
import { useEffect, useState } from "react";
import { reduirePhoto } from "@/lib/site-internet/reduire-photo";
import { CONSIGNES_PHOTOS, PHOTOS_DU_LIEU, type CleLieu, type PhotosDuLieu } from "@/lib/site-internet/photos-du-lieu";

export function ProPhotosDuLieu({ slug, token }: { slug: string; token: string }) {
  const [photos, setPhotos] = useState<PhotosDuLieu>({});
  const [occupe, setOccupe] = useState<CleLieu | null>(null);
  const [erreur, setErreur] = useState("");

  const appeler = async (corps: Record<string, unknown>) => {
    const r = await fetch("/api/site-internet/photos-lieu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, ...corps }),
    });
    const j = (await r.json().catch(() => ({}))) as { photos?: PhotosDuLieu; error?: string };
    if (r.ok && j.photos) setPhotos(j.photos);
    return r.ok ? "" : j.error || "Enregistrement impossible.";
  };

  useEffect(() => {
    let fini = false;
    void fetch("/api/site-internet/photos-lieu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, action: "lire" }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!fini && j?.photos) setPhotos(j.photos as PhotosDuLieu);
      })
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [slug, token]);

  const poser = async (cle: CleLieu, f: File | undefined) => {
    if (!f) return;
    setOccupe(cle);
    setErreur("");
    try {
      setErreur(await appeler({ action: "poser", cle, photo: await reduirePhoto(f) }));
    } catch {
      setErreur("Cette photo n'a pas pu être lue. Essayez-en une autre.");
    } finally {
      setOccupe(null);
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .lieu .a-title{font-family:var(--fd),Georgia,serif;font-weight:700;font-size:19px;}
          .pro .lieu .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .lieu .err{margin-top:9px;font-size:12px;color:#B23B3B;}
          .pro .lieu .grille{margin-top:16px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
          .pro .lieu .case{display:flex;flex-direction:column;gap:4px;min-width:0;}
          .pro .lieu .vue{position:relative;display:flex;align-items:center;justify-content:center;aspect-ratio:4/3;border-radius:11px;overflow:hidden;border:1.5px dashed var(--hair);background:#F6F5F0;font-size:22px;cursor:pointer;}
          .pro .lieu .vue.on{border-style:solid;}
          .pro .lieu .vue img{width:100%;height:100%;object-fit:cover;display:block;}
          .pro .lieu .vue input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;}
          .pro .lieu .vue i{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.7);font-style:normal;font-size:12px;font-weight:700;color:var(--ink);}
          .pro .lieu .case b{font-size:13px;line-height:1.25;}
          .pro .lieu .case em{font-style:normal;font-size:11.5px;line-height:1.35;color:var(--faint);}
          .pro .lieu .case button{align-self:flex-start;padding:0;border:0;background:none;font:inherit;font-size:12px;font-weight:600;color:#B23B3B;cursor:pointer;}
          `,
        }}
      />
      <div className="lieu">
        <div className="a-title">📸 Les photos de mon lieu</div>
        <div className="a-sub">
          Chacune sous son intitulé : on sait ainsi laquelle montre votre devanture, votre intérieur, vous. Elles servent à votre page et
          à La ville. Toutes sont facultatives. {CONSIGNES_PHOTOS}
        </div>
        {erreur && <div className="err">{erreur}</div>}
        <div className="grille">
          {PHOTOS_DU_LIEU.map((x) => {
            const p = photos[x.cle];
            return (
              <div className="case" key={x.cle}>
                <label className={`vue${p ? " on" : ""}`}>
                  <input type="file" accept="image/*" disabled={occupe !== null} onChange={(e) => void poser(x.cle, e.target.files?.[0])} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p ? <img src={p.url} alt={x.intitule} /> : <span aria-hidden="true">📷</span>}
                  {occupe === x.cle && <i>Envoi…</i>}
                </label>
                <b>{x.intitule}</b>
                <em>{x.conseil}</em>
                {p && (
                  <button type="button" disabled={occupe !== null} onClick={() => void appeler({ action: "retirer", cle: x.cle }).then(setErreur)}>
                    Retirer
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
