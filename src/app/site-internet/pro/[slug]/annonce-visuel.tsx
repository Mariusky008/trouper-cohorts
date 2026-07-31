"use client";

// Espace Pro — le VISUEL de l'annonce, pour Facebook et Instagram.
//
// Le trou : on donnait « copiez ce texte ». Sur Instagram, un texte seul ne peut
// pas être publié — il faut une image. Le commerçant se retrouvait donc avec une
// promesse (« publiez partout ») et rien pour la tenir.
//
// Ce composant fabrique l'image manquante : un carré 1080×1080 dessiné dans le
// navigateur (aucun serveur, aucune police à charger), puis :
//   • « Partager » ouvre la feuille de partage native du téléphone AVEC l'image
//     et la légende → Instagram et Facebook y apparaissent. C'est le chemin le
//     plus court qui existe sans API Meta.
//   • Sinon : téléchargement de l'image + copie de la légende (ordinateur).
//
// HONNÊTETÉ : aucune publication automatique n'est possible sans compte Meta
// connecté (nous n'en avons pas). On ne le laisse jamais croire — on écrit ce que
// le bouton fait vraiment. Et rien n'est ajouté au texte du pro : le visuel
// reprend SON annonce, sans prix ni date inventés.
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { campagneFallback, hashtags } from "@/lib/site-internet/campagne";
import { drawVisuel, VISUEL_SIZE as S, VISUEL_STYLES as STYLES } from "@/lib/site-internet/annonce-visuel";

/** Le partage de fichiers est une capacité du navigateur : elle ne change jamais. */
const subscribeNever = () => () => {};
const canShareSnapshot = () => {
  try {
    const f = new File([new Blob(["x"], { type: "image/png" })], "t.png", { type: "image/png" });
    return Boolean(navigator.canShare?.({ files: [f] }));
  } catch {
    return false;
  }
};

export function AnnonceVisuel({
  slug,
  annonce,
  nom,
  metier,
  ville,
}: {
  slug: string;
  annonce: string;
  nom: string;
  metier: string;
  ville: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [style, setStyle] = useState(STYLES[0]);
  const [copied, setCopied] = useState("");
  const [shareErr, setShareErr] = useState("");

  const texte = annonce.trim();
  // Légendes par réseau : repli déterministe, immédiat, jamais d'attente réseau.
  const campagne = useMemo(() => campagneFallback(texte, nom, metier, ville), [texte, nom, metier, ville]);
  const tags = useMemo(() => hashtags(metier, ville), [metier, ville]);

  // La feuille de partage native n'accepte les fichiers que sur certains
  // navigateurs : on ne montre le bouton que s'il fera réellement quelque chose.
  // Lu via useSyncExternalStore pour que le rendu serveur (false) et le premier
  // rendu client concordent — sinon React signale une divergence d'hydratation.
  const canShareFiles = useSyncExternalStore(subscribeNever, canShareSnapshot, () => false);

  // Dessin du carré. Redessiné à chaque changement de style ou de texte.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawVisuel(ctx, style, { annonce: texte, nom, metier, ville });
  }, [style, texte, nom, metier, ville]);

  const toBlob = () =>
    new Promise<Blob | null>((resolve) => {
      const cv = canvasRef.current;
      if (!cv) return resolve(null);
      cv.toBlob((b) => resolve(b), "image/png", 0.95);
    });

  const fileName = `annonce-${slug}.png`;

  const share = async () => {
    setShareErr("");
    const blob = await toBlob();
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });
    try {
      await navigator.share({ files: [file], text: campagne.insta });
    } catch (e) {
      // Annulation par l'utilisateur : silence. Vrai échec : on le dit et on
      // laisse le téléchargement, qui marche partout.
      if ((e as { name?: string })?.name !== "AbortError") {
        setShareErr("Le partage direct n'est pas disponible ici — téléchargez l'image, elle marche partout.");
      }
    }
  };

  const download = async () => {
    const blob = await toBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(""), 2200);
    } catch {
      /* presse-papiers indisponible → le texte reste sélectionnable */
    }
  };

  if (!texte) return null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .avis-gen{margin-top:12px;}
          .pro .avis-gen .styles{display:flex;gap:8px;margin-bottom:11px;}
          .pro .avis-gen .styles button{flex:1;border:1px solid var(--hair);background:#fff;color:var(--ink);border-radius:11px;
            padding:9px;font-size:12.5px;font-weight:700;font-family:inherit;cursor:pointer;}
          .pro .avis-gen .styles button.on{background:var(--ink);color:#fff;border-color:var(--ink);}
          .pro .avis-gen .prev{display:block;width:100%;max-width:300px;margin:0 auto;border-radius:16px;
            box-shadow:0 18px 44px -24px rgba(25,26,44,.7);}
          .pro .avis-gen .acts{display:flex;flex-direction:column;gap:8px;margin-top:13px;}
          .pro .avis-gen .acts button{border:none;border-radius:12px;padding:13px;font-size:13.5px;font-weight:800;
            font-family:inherit;cursor:pointer;}
          .pro .avis-gen .acts .primary{background:linear-gradient(135deg,#8A6BE0,#5B3FA6);color:#fff;
            box-shadow:0 14px 30px -16px rgba(91,63,166,.8);}
          .pro .avis-gen .acts .ghost{background:#fff;color:var(--ink);border:1px solid var(--hair);}
          .pro .avis-gen .acts button:active{transform:translateY(1px);}
          .pro .avis-gen .err{margin-top:9px;font-size:12px;line-height:1.5;color:#8A6A12;background:#FFF7E9;
            border:1px solid #F6E4BD;border-radius:11px;padding:10px 12px;}
          .pro .avis-gen .legendes{margin-top:14px;display:flex;flex-direction:column;gap:9px;}
          .pro .avis-gen .leg{border:1px solid var(--hair);border-radius:13px;background:#fff;padding:12px;}
          .pro .avis-gen .leg .lh{display:flex;align-items:center;justify-content:space-between;gap:9px;}
          .pro .avis-gen .leg .ln{font-size:12px;font-weight:800;letter-spacing:.03em;}
          .pro .avis-gen .leg .lc{border:1px solid var(--hair);background:#F7F7FC;color:var(--violet);border-radius:9px;
            padding:6px 10px;font-size:11.5px;font-weight:800;font-family:inherit;cursor:pointer;}
          .pro .avis-gen .leg .lt{margin-top:8px;font-size:12.5px;line-height:1.5;color:var(--soft);white-space:pre-wrap;}
          .pro .avis-gen .how{margin-top:12px;font-size:11.5px;line-height:1.55;color:var(--faint);}
          `,
        }}
      />
      <div className="avis-gen">
        <div className="styles">
          {STYLES.map((st) => (
            <button
              key={st.key}
              type="button"
              className={style.key === st.key ? "on" : ""}
              onClick={() => setStyle(st)}
            >
              {st.label}
            </button>
          ))}
        </div>

        <canvas ref={canvasRef} width={S} height={S} className="prev" />

        <div className="acts">
          {canShareFiles && (
            <button type="button" className="primary" onClick={share}>
              📲 Partager sur Instagram / Facebook
            </button>
          )}
          <button type="button" className="ghost" onClick={download}>
            ⬇️ Télécharger l&apos;image (1080×1080)
          </button>
        </div>
        {shareErr && <div className="err">{shareErr}</div>}

        <div className="legendes">
          <div className="leg">
            <div className="lh">
              <span className="ln">📸 Légende Instagram</span>
              <button type="button" className="lc" onClick={() => copy("insta", campagne.insta)}>
                {copied === "insta" ? "✓ copiée" : "Copier"}
              </button>
            </div>
            <div className="lt">{campagne.insta}</div>
          </div>
          <div className="leg">
            <div className="lh">
              <span className="ln">👍 Texte Facebook</span>
              <button type="button" className="lc" onClick={() => copy("fb", campagne.fb)}>
                {copied === "fb" ? "✓ copié" : "Copier"}
              </button>
            </div>
            <div className="lt">{campagne.fb}</div>
          </div>
          <div className="leg">
            <div className="lh">
              <span className="ln"># Hashtags seuls</span>
              <button type="button" className="lc" onClick={() => copy("tags", tags)}>
                {copied === "tags" ? "✓ copiés" : "Copier"}
              </button>
            </div>
            <div className="lt">{tags}</div>
          </div>
        </div>

        <div className="how">
          {canShareFiles
            ? "« Partager » ouvre le menu de votre téléphone : choisissez Instagram ou Facebook, l'image est déjà dedans. La légende se colle en un appui long."
            : "Sur ordinateur, Instagram n'accepte pas de publication : téléchargez l'image, envoyez-la sur votre téléphone, puis publiez depuis l'appli."}
        </div>
      </div>
    </>
  );
}
