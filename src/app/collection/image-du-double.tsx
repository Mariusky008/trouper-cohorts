"use client";

/**
 * 📸 « MON IMAGE DU JOUR » (le chantier « Ma figurine », lot 3 ; la route `/api/direct/mon-double/image` ;
 * `docs/univers/ma-figurine.md`, section 5) : depuis « Mon double du jour », l'image « Ma figurine du jour » se fabrique
 * (sa tête du jour, sa pancarte, ce qu'elle porte toute seule, « Mon double sur ClikMe ») ; on la voit, puis
 * « 📲 Partager » (WhatsApp, Instagram… : la feuille de partage du téléphone) ou « ⬇️ Enregistrer ».
 */
import { useEffect, useState } from "react";
import { IMAGE_DOUBLE, PHRASES_IMAGE_DOUBLE as P } from "@/lib/direct/mon-double";

type Etat = { etat: "fabrique" } | { etat: "pret"; url: string; fichier: File } | { etat: "rate"; message: string };

export function ImageDuDouble({ onFermer }: { onFermer: () => void }) {
  const [e, setE] = useState<Etat>({ etat: "fabrique" });
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    let fini = false;
    let url = "";
    void (async () => {
      try {
        const r = await fetch(`/api/direct/mon-double/image?t=${Date.now()}`, { cache: "no-store" });
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          if (!fini) setE({ etat: "rate", message: j.error || P.rate });
          return;
        }
        const b = await r.blob();
        url = URL.createObjectURL(b);
        if (!fini) setE({ etat: "pret", url, fichier: new File([b], IMAGE_DOUBLE.nom, { type: "image/png" }) });
      } catch {
        if (!fini) setE({ etat: "rate", message: P.rate });
      }
    })();
    return () => {
      fini = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  async function partager() {
    if (e.etat !== "pret" || envoi) return;
    setEnvoi(true);
    try {
      if (navigator.canShare?.({ files: [e.fichier] })) await navigator.share({ files: [e.fichier], text: P.texte });
      else enregistrer();
    } catch {
      /* (il a fermé la feuille de partage : rien à dire) */
    } finally {
      setEnvoi(false);
    }
  }
  function enregistrer() {
    if (e.etat !== "pret") return;
    const a = document.createElement("a");
    a.href = e.url;
    a.download = IMAGE_DOUBLE.nom;
    a.click();
  }

  return (
    <div className="idd" role="dialog" aria-modal="true" aria-label={P.pret} data-image-du-jour={e.etat}>
      <div className="idd-feuille">
        <b>{e.etat === "fabrique" ? P.fabrique : e.etat === "pret" ? P.pret : ""}</b>
        {e.etat === "fabrique" && <span className="idd-attente" aria-hidden="true" />}
        {e.etat === "pret" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.url} alt={P.titre} width={IMAGE_DOUBLE.largeur} height={IMAGE_DOUBLE.hauteur} data-apercu />
        )}
        {e.etat === "rate" && (
          <p role="alert" data-erreur-image>
            {e.message}
          </p>
        )}
        <div className="idd-boutons">
          {e.etat === "pret" && (
            <>
              <button type="button" className="idd-partager" disabled={envoi} onClick={() => void partager()} data-partager-image>
                {P.partager}
              </button>
              <button type="button" className="idd-discret" onClick={enregistrer} data-enregistrer-image>
                {P.enregistrer}
              </button>
            </>
          )}
          <button type="button" className="idd-discret" onClick={onFermer} data-fermer-image>
            {P.fermer}
          </button>
        </div>
      </div>
      <style>{STYLES_IMAGE_DU_DOUBLE}</style>
    </div>
  );
}

const STYLES_IMAGE_DU_DOUBLE = `
.idd{position:fixed;inset:0;z-index:90;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,6,4,.72);animation:idd-entre .2s ease-out}
@keyframes idd-entre{from{opacity:0}to{opacity:1}}
.idd-feuille{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;max-width:520px;max-height:100svh;box-sizing:border-box;padding:18px 16px calc(16px + env(safe-area-inset-bottom));border-radius:26px 26px 0 0;background:#1c1411;box-shadow:0 -1px 0 rgba(255,196,140,.18)}
.idd-feuille>b{font-weight:800;font-size:17px}
.idd-feuille img{display:block;width:auto;max-width:100%;max-height:58svh;height:auto;border-radius:16px;box-shadow:0 10px 30px -10px rgba(0,0,0,.7)}
.idd-feuille p{margin:6px 0;color:#ffb4a8;font-size:14px;text-align:center}
.idd-attente{width:42px;height:42px;margin:30px;border-radius:50%;border:4px solid rgba(246,181,75,.25);border-top-color:#f6b54b;animation:idd-tourne .9s linear infinite}
@keyframes idd-tourne{to{transform:rotate(360deg)}}
.idd-boutons{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;width:100%}
.idd-boutons button{min-height:46px;padding:0 18px;border:0;border-radius:999px;font:inherit;font-weight:800;font-size:15px;cursor:pointer}
.idd-partager{flex:1 1 100%;background:linear-gradient(135deg,#ff2e9a,#ff7a59);color:#fff}
.idd-discret{background:rgba(255,255,255,.08);color:#fff4e6;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}
@media (prefers-reduced-motion: reduce){.idd,.idd-attente{animation:none}}
`;
