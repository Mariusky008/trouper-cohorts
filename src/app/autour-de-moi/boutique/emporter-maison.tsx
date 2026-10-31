"use client";

// 📦 EMPORTEZ VOTRE MAISON — proposé au bon moment, depuis la page du commerçant.
//
// « Garder l'identité sans compte, mais proposer "Emportez votre Maison" au
// bon moment, par exemple après un premier salon. Ainsi, on ne perd rien en
// changeant de navigateur. » Sur un iPhone, Safari, l'application posée sur
// l'écran d'accueil et le navigateur d'Instagram ont chacun leurs cookies :
// sans adresse, une cliente qui passe de l'un à l'autre devient quelqu'un
// d'autre, et perd ses salons.
//
// LE MÊME PARCOURS QUE MA MAISON (`demanderLeCode`, `donnerLeCode`) : une
// adresse, un code à six chiffres, et la Maison suit — salons compris, puisque
// le serveur les rattache à la même personne. Dans une vraie ville seulement :
// dans la démonstration, tout reste sur le téléphone. Une fois l'adresse
// donnée, ou la carte écartée, on ne la repropose plus.

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { abonnerMaisonPrivee, chargerMaisonPrivee, demanderLeCode, donnerLeCode, maisonPriveeServeur } from "@/lib/direct/maison-memoire";

const CLE_ECARTEE = "clikme-emporter-ecartee";
const rienAEcouter = () => () => {};
const ecartee = () => {
  try {
    return window.localStorage.getItem(CLE_ECARTEE) === "1";
  } catch {
    return false;
  }
};

/** La petite carte, puis la feuille de l'adresse et du code. */
export function EmporterMaison({ raison }: { raison: string }) {
  const maison = useSyncExternalStore(abonnerMaisonPrivee, chargerMaisonPrivee, maisonPriveeServeur);
  const dejaEcartee = useSyncExternalStore(rienAEcouter, ecartee, () => true);
  const [cachee, setCachee] = useState(false);
  const [ouverte, setOuverte] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [etape, setEtape] = useState<"adresse" | "code" | "fait">("adresse");
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState(false);
  if (maison.compte?.verifie && etape !== "fait") return null;
  if ((dejaEcartee || cachee) && !ouverte) return null;

  const ecarter = () => {
    try {
      window.localStorage.setItem(CLE_ECARTEE, "1");
    } catch {
      /* rien */
    }
    setCachee(true);
  };
  const envoyer = async () => {
    setOccupe(true);
    setErreur("");
    const r = await demanderLeCode(email.trim());
    setOccupe(false);
    if ("erreur" in r) setErreur(r.erreur);
    else setEtape("code");
  };
  const valider = async () => {
    setOccupe(true);
    setErreur("");
    const r = await donnerLeCode(email.trim(), code);
    setOccupe(false);
    if ("erreur" in r) setErreur(r.erreur);
    else setEtape("fait");
  };

  return (
    <>
      {!ouverte && (
        <div className="em-carte">
          <span aria-hidden="true">📦</span>
          <p>
            <b>Retrouvez-les partout</b>
            {raison}
          </p>
          <button type="button" className="em-oui" onClick={() => setOuverte(true)}>
            Emporter ma Maison
          </button>
          <button type="button" className="em-non" aria-label="Plus tard" onClick={ecarter}>
            ✕
          </button>
        </div>
      )}
      {/* LA FEUILLE SUR TOUTE LA PAGE, PAS DANS LA SECTION DU HALL : dedans,
          elle s'arrêtait au-dessus de la barre du bas, coupée. Vu au test. */}
      {ouverte &&
        createPortal(
          <div className="em-voile" role="dialog" aria-modal="true" aria-label="Emportez votre Maison" onClick={() => setOuverte(false)}>
            <form
              className="em-feuille"
              onClick={(e) => e.stopPropagation()}
              onSubmit={(e) => {
                e.preventDefault();
                if (occupe) return;
                if (etape === "adresse") void envoyer();
                else if (etape === "code" && code.length === 6) void valider();
              }}
            >
              {etape === "fait" ? (
                <>
                  <b>C’est fait</b>
                  <span>Votre Maison vous suit maintenant : vos salons et ce que vous avez gardé, sur tous vos téléphones. Ce code ne vous abonne à rien.</span>
                  <button type="button" onClick={() => setOuverte(false)}>
                    Continuer <span aria-hidden="true">→</span>
                  </button>
                </>
              ) : etape === "code" ? (
                <>
                  <b>Le code</b>
                  <span>
                    Je viens de l’envoyer à <strong>{email.trim()}</strong>. Il est valable dix minutes.
                  </span>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="••••••"
                    aria-label="Code à six chiffres"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoFocus
                  />
                  {erreur && <em>{erreur}</em>}
                  <button type="submit" disabled={code.length !== 6 || occupe}>
                    {occupe ? "Un instant…" : "Valider"}
                  </button>
                </>
              ) : (
                <>
                  <b>Emportez votre Maison avec vous</b>
                  <span>
                    Votre adresse e-mail : je vous envoie un code à six chiffres. Sur un autre téléphone ou un autre navigateur, le même code vous rend vos
                    salons.
                  </span>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="vous@email.fr"
                    aria-label="Votre adresse e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                  {erreur && <em>{erreur}</em>}
                  <button type="submit" disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) || occupe}>
                    {occupe ? "Un instant…" : "Recevoir mon code"}
                  </button>
                </>
              )}
            </form>
          </div>,
          document.body,
        )}
      <StylesEmporter />
    </>
  );
}

function StylesEmporter() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.em-carte{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:start;gap:4px 10px;margin-top:14px;
  padding:12px 12px 14px 14px;border-radius:18px;background:rgba(255,244,230,.05);border:1px solid rgba(255,214,150,.22);}
.em-carte>span{grid-row:1;font-size:22px;line-height:1.2;}
.em-carte p{grid-row:1;margin:0;font-size:12.5px;line-height:1.35;color:#E3CDB4;}
.em-carte b{display:block;font-size:14px;color:#FFF4E6;}
.em-oui{grid-row:2;grid-column:2 / 4;justify-self:start;margin-top:6px;padding:9px 14px;border:0;border-radius:999px;cursor:pointer;
  font:inherit;font-size:13px;font-weight:900;color:#2A1708;background:#F5A23A;}
.em-non{grid-row:1;grid-column:3;width:28px;height:28px;border:0;border-radius:50%;cursor:pointer;font:inherit;font-size:13px;color:#CDB8A4;
  background:rgba(255,244,230,.08);}
.em-voile{position:fixed;inset:0;z-index:1210;display:flex;font-family:var(--font-clikme),system-ui,sans-serif;align-items:flex-end;justify-content:center;background:rgba(10,6,4,.6);
  -webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);}
.em-feuille{display:flex;flex-direction:column;gap:10px;width:min(480px,100%);padding:22px 20px calc(22px + env(safe-area-inset-bottom,0px));
  border-radius:24px 24px 0 0;background:#21150F;border:1px solid rgba(255,214,150,.18);color:#FFF4E6;}
.em-feuille b{font-size:20px;font-weight:900;}
.em-feuille span{font-size:14px;line-height:1.4;color:#E3CDB4;}
.em-feuille input{margin-top:4px;padding:14px 16px;border-radius:14px;border:1.5px solid rgba(255,214,150,.3);background:rgba(255,244,230,.06);
  font:inherit;font-size:17px;color:#FFF4E6;outline:none;}
.em-feuille input:focus{border-color:#F5A23A;}
.em-feuille em{font-style:normal;font-size:13px;font-weight:700;color:#FF9B8A;}
.em-feuille button{margin-top:4px;padding:14px 18px;border:0;border-radius:999px;cursor:pointer;font:inherit;font-size:16px;font-weight:900;
  color:#2A1708;background:linear-gradient(180deg,#FFC867,#F5A23A);}
.em-feuille button:disabled{opacity:.5;cursor:default;}
`,
      }}
    />
  );
}
