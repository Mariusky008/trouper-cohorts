"use client";

// « Servie », depuis le téléphone du commerçant : son comptoir y a laissé son adresse et son jeton
// (`CLE_ACCES_COMPTOIR`) ; sinon, la page dit seulement que le bon se valide au comptoir.
import { useMemo, useState, useSyncExternalStore } from "react";
import { CLE_ACCES_COMPTOIR } from "@/lib/echanges/echanges";

type Acces = { slug: string; token: string; nom: string };
const lireAcces = () => {
  try {
    return window.localStorage.getItem(CLE_ACCES_COMPTOIR);
  } catch {
    return null;
  }
};
const rien = () => () => undefined;

export function ServirBon({ slug, code }: { slug: string; code: string }) {
  const brut = useSyncExternalStore(rien, lireAcces, () => null);
  const acces = useMemo<Acces | null>(() => {
    try {
      const a = JSON.parse(brut ?? "null") as Partial<Acces> | null;
      return a?.slug === slug && a.token ? { slug: a.slug, token: a.token, nom: a.nom || "ton commerce" } : null;
    } catch {
      return null;
    }
  }, [brut, slug]);
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<{ ok: boolean; texte: string } | null>(null);

  const servir = async () => {
    if (!acces || envoi) return;
    setEnvoi(true);
    try {
      const r = await fetch("/api/site-internet/pro/famille", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: acces.slug, token: acces.token, action: "surprise-servie", code }),
      });
      const j = (await r.json().catch(() => null)) as { ok?: boolean; error?: string; servie?: { libelle?: string; prenom?: string; numero?: number } } | null;
      if (r.ok && j?.ok) {
        const x = j.servie ?? {};
        setResultat({ ok: true, texte: `✓ Servie : ${x.libelle || "la surprise"}${x.prenom ? `, pour ${x.prenom}` : ""}${x.numero ? ` (fantôme n°${x.numero})` : ""}. C’est une venue de plus.` });
      } else setResultat({ ok: false, texte: j?.error || "Ça n’a pas marché. Réessaie dans un instant." });
    } catch {
      setResultat({ ok: false, texte: "Pas de réseau : réessaie dans un instant." });
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <main className="sb">
      <style
        dangerouslySetInnerHTML={{
          __html: `
.sb{min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#120C09;color:#FFF4E6;
  font-family:var(--font-clikme),system-ui,sans-serif;padding:24px 16px}
.sb-c{width:100%;max-width:420px;display:flex;flex-direction:column;gap:14px;text-align:center}
.sb p{margin:0;font-size:15.5px;line-height:1.5;color:#CDB8A4}
.sb p b{color:#FFF4E6}
.sb .sb-e{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#F2C46B}
.sb .sb-code{font:900 40px/1 ui-monospace,Menlo,monospace;letter-spacing:.16em;color:#FFF4E6}
.sb-go{height:56px;border:0;border-radius:999px;background:#3DE2A6;color:#04150E;font:inherit;font-weight:900;font-size:17px}
.sb-go:disabled{opacity:.6}
.sb-r{padding:14px;border-radius:16px;font-weight:700;font-size:15.5px;line-height:1.45}
.sb-r.ok{background:rgba(61,226,166,.12);border:1px solid rgba(61,226,166,.5);color:#C9F7E5}
.sb-r.non{background:rgba(255,46,154,.12);border:1px solid rgba(255,46,154,.45);color:#FFC9E2}
`,
        }}
      />
      <div className="sb-c">
        <p className="sb-e">🎁 Surprise du chef</p>
        {!code ? (
          <p>Ce bon n’est pas valide.</p>
        ) : (
          <>
            <p className="sb-code">{code}</p>
            {resultat ? (
              <div className={`sb-r ${resultat.ok ? "ok" : "non"}`} role="status">
                {resultat.texte}
              </div>
            ) : acces ? (
              <>
                <p>
                  Ce téléphone est celui de <b>{acces.nom}</b>. Tu sers cette surprise ?
                </p>
                <button type="button" className="sb-go" disabled={envoi} onClick={() => void servir()}>
                  {envoi ? "Un instant…" : "Servie"}
                </button>
              </>
            ) : (
              <p>Ce bon se valide au comptoir du commerce, sur son téléphone : montre-lui ton écran.</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
