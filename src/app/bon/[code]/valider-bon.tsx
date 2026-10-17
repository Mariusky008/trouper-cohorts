"use client";

// Voir `page.tsx`. Le comptoir range sur le téléphone du commerçant son
// adresse et son jeton (`CLE_ACCES_COMPTOIR`, `lib/echanges/echanges.ts`) : s'ils
// sont là, ce téléphone est le sien, et il peut valider le bon d'un geste. Le
// serveur vérifie de toute façon que le bon a bien été pris CHEZ LUI.
//
// UN BON CADEAU (« le cadeau du voisin ») a deux visages :
//   · chez le CLIENT qui l'a reçu — la carte cadeau : quoi, chez qui, offert
//     par qui, jusqu'à quand, et le QR à montrer sur place ;
//   · sur le téléphone du commerçant QUI LE SERT — « Valider ce cadeau »,
//     puis « venu à combien ? » (le client et ceux qui l'accompagnent).
//
// Sur iPhone, une application ajoutée à l'écran d'accueil ne partage pas son
// stockage avec Safari : si le comptoir n'a jamais été ouvert dans Safari, la
// page ne le reconnaît pas — et dit de taper le code dans le comptoir.
import { useMemo, useState, useSyncExternalStore } from "react";
import { CLE_ACCES_COMPTOIR, chezNom, type BonCadeauPublic } from "@/lib/echanges/echanges";
import { debloquerSon, jouer, vibrer } from "@/app/autour-de-moi/assistante/echanges-magie";
import { useQr } from "@/app/autour-de-moi/assistante/echanges-communs";

type Acces = { slug: string; token: string; nom: string };

const lireAcces = () => {
  try {
    return window.localStorage.getItem(CLE_ACCES_COMPTOIR);
  } catch {
    return null;
  }
};
const rien = () => () => undefined;
const lireOrigine = () => window.location.origin;

const dateLongue = (iso: string) => {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "";
};

async function envoyer(acces: Acces, action: string, extra: Record<string, unknown>) {
  try {
    const r = await fetch("/api/site-internet/pro/echanges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: acces.slug, token: acces.token, action, ...extra }),
    });
    return (await r.json().catch(() => ({}))) as { ok?: boolean; message?: string; error?: string; client?: boolean; bon?: string };
  } catch {
    return { ok: false, error: "Le réseau ne répond pas. Réessaie dans un instant." };
  }
}

export function ValiderBon({ code, cadeau = null }: { code: string; cadeau?: BonCadeauPublic | null }) {
  const brut = useSyncExternalStore(rien, lireAcces, () => null);
  const origine = useSyncExternalStore(rien, lireOrigine, () => "");
  const acces = useMemo<Acces | null>(() => {
    try {
      const a = JSON.parse(brut ?? "null") as Partial<Acces> | null;
      return a?.slug && a?.token ? { slug: a.slug, token: a.token, nom: a.nom || "ton commerce" } : null;
    } catch {
      return null;
    }
  }, [brut]);
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<{ ok: boolean; texte: string } | null>(null);
  /** Après la validation d'un cadeau : le bon, pour « venu à combien ? ». */
  const [aCompter, setACompter] = useState<string | null>(null);
  const [compte, setCompte] = useState("");
  /** Ce téléphone est celui du commerçant qui SERT ce cadeau. */
  const chezLui = Boolean(cadeau && acces && cadeau.chezSlug && acces.slug === cadeau.chezSlug);
  const qr = useQr(cadeau && !chezLui && cadeau.statut === "reserve" && origine ? `${origine}/bon/${code}` : null);

  const valider = async () => {
    if (!acces || envoi) return;
    debloquerSon();
    setEnvoi(true);
    const j = await envoyer(acces, "valider", { code });
    setResultat({ ok: j.ok === true, texte: j.message || j.error || "Validation impossible pour l'instant." });
    if (j.ok === true) {
      jouer("piece");
      vibrer([20, 40, 20]);
      if (j.client && j.bon) setACompter(j.bon);
    }
    setEnvoi(false);
  };

  const venus = async (n: number) => {
    if (!acces || !aCompter) return;
    setEnvoi(true);
    const j = await envoyer(acces, "venus", { bon: aCompter, n });
    setEnvoi(false);
    setACompter(null);
    setCompte(j.ok ? (n > 1 ? `Noté : ${n} personnes venues grâce au cadeau 🎉` : "Noté ✓") : j.error || "Pas noté, ce n’est pas grave.");
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
.bn-cadeau{display:flex;flex-direction:column;align-items:center;gap:10px;padding:18px 16px;border-radius:24px;
  background:linear-gradient(160deg,rgba(245,162,58,.2),rgba(255,46,154,.08));border:1px solid rgba(245,162,58,.5);}
.bn-cadeau > img.bn-photo{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:18px;}
.bn-cadeau h1{margin:0;font-size:28px;line-height:1.15;font-weight:900;color:#fff;}
.bn-cadeau .bn-chez{font-size:18px;font-weight:800;color:#F5A23A;}
.bn-qr{width:200px;height:200px;border-radius:16px;background:#FFF4E6;}
.bn-venus{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.bn-venus button{height:56px;border-radius:16px;border:1px solid rgba(255,196,140,.25);background:#1C1411;color:#FFF4E6;font-weight:900;font-size:22px;}
`,
        }}
      />
      <div className="bn-c">
        {!code ? (
          <>
            <p className="bn-e">Bon d’échange ClikMe</p>
            <p>Ce lien de bon n’est pas valide.</p>
          </>
        ) : cadeau && !chezLui ? (
          /* ── LA CARTE CADEAU DU CLIENT ── */
          <>
            <p className="bn-e">🎁 Un cadeau pour toi</p>
            <div className="bn-cadeau">
              {cadeau.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="bn-photo" src={cadeau.photo} alt="" />
              )}
              <h1>{cadeau.titre}</h1>
              <span className="bn-chez">{chezNom(cadeau.chez)}</span>
              <p>
                Offert par <b>{cadeau.de}</b>
                {cadeau.occasion ? `, ${cadeau.occasion}` : ""}.
              </p>
              {cadeau.statut === "reserve" ? (
                <>
                  {qr ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="bn-qr" src={qr} alt={`Code ${code}`} />
                  ) : (
                    <span className="bn-qr" />
                  )}
                  <p className="bn-code">{code}</p>
                  <p>
                    Montre ce bon {chezNom(cadeau.chez).replace(cadeau.chez, "")}<b>{cadeau.chez}</b> : on le scanne, c’est offert. Valable jusqu’au <b>{dateLongue(cadeau.expire)}</b>.
                  </p>
                </>
              ) : (
                <div className="bn-r non">
                  {cadeau.statut === "utilise" ? "Ce cadeau a déjà été utilisé ✓" : cadeau.statut === "expire" ? "Ce cadeau a expiré : il était valable 30 jours." : "Ce bon n’est plus valable."}
                </div>
              )}
            </div>
            {cadeau.statut === "reserve" && (cadeau.adresse || cadeau.ville) && (
              <div className="bn-box">
                <p>
                  <b>{cadeau.chez}</b>
                  <br />
                  {cadeau.adresse || cadeau.ville}
                </p>
                <p>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cadeau.chez} ${cadeau.adresse || cadeau.ville}`)}`} target="_blank" rel="noopener noreferrer">
                    Y aller
                  </a>
                </p>
              </div>
            )}
            <p>Garde ce message : ton bon y reste.</p>
          </>
        ) : (
          <>
            <p className="bn-e">{cadeau ? "🎁 Cadeau du voisin" : "Bon d’échange ClikMe"}</p>
            <p className="bn-code">{code}</p>
            {cadeau && (
              <p>
                <b>{cadeau.titre}</b>, offert par <b>{cadeau.de}</b> à l’un de ses clients.
              </p>
            )}
            {resultat ? (
              <div className={`bn-r ${resultat.ok ? "ok" : "non"}`}>{resultat.texte}</div>
            ) : acces ? (
              <>
                <p>
                  Ce téléphone est celui de <b>{acces.nom}</b>.{" "}
                  {cadeau ? "Le client qui présente ce bon a reçu son cadeau ?" : "Le commerçant qui présente ce code a reçu ton produit ?"}
                </p>
                <button type="button" className="bn-go" disabled={envoi} onClick={() => void valider()}>
                  {envoi ? "Validation…" : cadeau ? "Valider ce cadeau" : "Valider ce bon"}
                </button>
              </>
            ) : null}
            {aCompter && (
              <div className="bn-box">
                <p>
                  <b>Venu à combien ?</b> Le client et ceux qui l’accompagnent : c’est ce que le réseau t’a amené.
                </p>
                <div className="bn-venus">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button key={n} type="button" disabled={envoi} onClick={() => void venus(n)}>
                      {n === 6 ? "6+" : n}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {compte && <div className="bn-r ok">{compte}</div>}
            {!cadeau && (
              <div className="bn-box">
                <p>
                  <b>Tu es le commerçant qui a pris ce bon ?</b> Présente ce code chez celui qui le fournit : il le scanne avec son téléphone.
                </p>
                <p>
                  <b>Tu es le commerçant qui le fournit ?</b> Ouvre ton comptoir ClikMe › Échanger › À valider, et tape ce code.
                </p>
                {acces && (
                  <p>
                    <a href={`/autour-de-moi/assistante?site=${encodeURIComponent(acces.slug)}&k=${encodeURIComponent(acces.token)}`}>Ouvrir mon comptoir</a>
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
