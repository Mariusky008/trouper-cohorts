"use client";

// Voir `page.tsx`. Le comptoir range sur le téléphone du commerçant son
// adresse et son jeton (`CLE_ACCES_COMPTOIR`, `lib/echanges/echanges.ts`) : s'ils
// sont là, ce téléphone est le sien, et il peut valider le bon d'un geste. Le
// serveur vérifie de toute façon que le bon a bien été pris CHEZ LUI. Le
// téléphone d'un membre de son équipe (`/e/<jeton>`) y range son jeton à lui :
// il valide de la même façon, au nom de la boutique.
//
// Sur iPhone, une application ajoutée à l'écran d'accueil ne partage pas son
// stockage avec Safari : si le comptoir n'a jamais été ouvert dans Safari, la
// page ne le reconnaît pas — et dit de taper le code dans le comptoir.
import { useMemo, useState, useSyncExternalStore } from "react";
import { CLE_ACCES_COMPTOIR } from "@/lib/echanges/echanges";
import { debloquerSon, jouer, vibrer } from "@/app/autour-de-moi/assistante/echanges-magie";

type Acces = { slug: string; token?: string; membre?: string; nom: string };

const lireAcces = () => {
  try {
    return window.localStorage.getItem(CLE_ACCES_COMPTOIR);
  } catch {
    return null;
  }
};
const rien = () => () => undefined;

async function envoyer(acces: Acces, action: string, extra: Record<string, unknown>) {
  try {
    const r = await fetch("/api/site-internet/pro/echanges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(acces.membre ? { membre: acces.membre } : { slug: acces.slug, token: acces.token }), action, ...extra }),
    });
    return (await r.json().catch(() => ({}))) as { ok?: boolean; message?: string; error?: string };
  } catch {
    return { ok: false, error: "Le réseau ne répond pas. Réessaie dans un instant." };
  }
}

export function ValiderBon({ code }: { code: string }) {
  const brut = useSyncExternalStore(rien, lireAcces, () => null);
  const acces = useMemo<Acces | null>(() => {
    try {
      const a = JSON.parse(brut ?? "null") as Partial<Acces> | null;
      if (!a?.slug) return null;
      if (a.membre) return { slug: a.slug, membre: a.membre, nom: a.nom || "ton commerce" };
      return a.token ? { slug: a.slug, token: a.token, nom: a.nom || "ton commerce" } : null;
    } catch {
      return null;
    }
  }, [brut]);
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<{ ok: boolean; texte: string } | null>(null);

  const valider = async () => {
    if (!acces || envoi) return;
    debloquerSon();
    setEnvoi(true);
    const j = await envoyer(acces, "valider", { code });
    setResultat({ ok: j.ok === true, texte: j.message || j.error || "Validation impossible pour l'instant." });
    if (j.ok === true) {
      jouer("piece");
      vibrer([20, 40, 20]);
    }
    setEnvoi(false);
  };

  return (
    <main className="bn">
      <style
        dangerouslySetInnerHTML={{
          __html: `
.bn{min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#120C09;color:#FFF4E6;
  font-family:var(--font-clikme),system-ui,sans-serif;padding:24px max(16px,env(safe-area-inset-left,0px)) 24px max(16px,env(safe-area-inset-right,0px));}
.bn-c{width:100%;max-width:420px;display:flex;flex-direction:column;gap:14px;text-align:center;}
.bn p.bn-e{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#F5A23A;margin:0;}
.bn p.bn-code{margin:0;font-size:34px;font-weight:900;letter-spacing:.08em;color:#FFF4E6;}
.bn p{margin:0;font-size:15.5px;line-height:1.5;color:#CDB8A4;}
.bn p b{color:#FFF4E6;}
.bn-go{height:56px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font-weight:900;font-size:17px;}
.bn-go:disabled{opacity:.6;}
.bn-r{padding:14px;border-radius:16px;font-weight:700;font-size:15.5px;line-height:1.45;}
.bn-r.ok{background:rgba(124,240,162,.12);border:1px solid rgba(124,240,162,.5);color:#C9F7D7;}
.bn-r.non{background:rgba(255,46,154,.12);border:1px solid rgba(255,46,154,.45);color:#FFC9E2;}
.bn-box{padding:14px;border-radius:16px;background:#1C1411;border:1px solid rgba(255,196,140,.14);text-align:left;display:flex;flex-direction:column;gap:8px;}
.bn a{color:#F5A23A;font-weight:800;}
`,
        }}
      />
      <div className="bn-c">
        {!code ? (
          <>
            <p className="bn-e">Bon d’échange ClikMe</p>
            <p>Ce lien de bon n’est pas valide.</p>
          </>
        ) : (
          <>
            <p className="bn-e">Bon d’échange ClikMe</p>
            <p className="bn-code">{code}</p>
            {resultat ? (
              <div className={`bn-r ${resultat.ok ? "ok" : "non"}`}>{resultat.texte}</div>
            ) : acces ? (
              <>
                <p>
                  Ce téléphone est celui de <b>{acces.nom}</b>. Le commerçant qui présente ce code a reçu ton produit ?
                </p>
                <button type="button" className="bn-go" disabled={envoi} onClick={() => void valider()}>
                  {envoi ? "Validation…" : "Valider ce bon"}
                </button>
              </>
            ) : null}
            <div className="bn-box">
              <p>
                <b>Tu es le commerçant qui a pris ce bon ?</b> Présente ce code chez celui qui le fournit : il le scanne avec son téléphone.
              </p>
              <p>
                <b>Tu es le commerçant qui le fournit ?</b> {acces?.membre ? "Ouvre ton accès ClikMe › Valider un bon, et tape ce code." : "Ouvre ton comptoir ClikMe › Échanger › À valider, et tape ce code."}
              </p>
              {acces && (
                <p>
                  <a
                    href={
                      acces.membre
                        ? `/e/${encodeURIComponent(acces.membre)}`
                        : `/autour-de-moi/assistante?site=${encodeURIComponent(acces.slug)}&k=${encodeURIComponent(acces.token ?? "")}`
                    }
                  >
                    Ouvrir mon comptoir
                  </a>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
