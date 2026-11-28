"use client";

/**
 * 👤 MON COMPTE — l'audit UX du 28 novembre 2026, lot 5 (`docs/audit-ux.md`, section 10) : la page Moi n'avait ni
 * « Se déconnecter » ni « Supprimer mon compte ». Le propriétaire, le même jour : « Oui, ces choix me vont ».
 *
 *   · SE DÉCONNECTER : sa figurine sauvegardée (une adresse) — il reviendra avec « J'ai déjà une figurine » et un code ;
 *     pas sauvegardée — on le lui dit d'abord (« Sauvegarder d'abord », ou « Me déconnecter quand même ») ;
 *   · SUPPRIMER MON COMPTE : ce qui part, « C'est définitif », une case « Je comprends que c'est définitif », puis tout
 *     part tout de suite (`/api/direct/mon-compte`, `supprimer-compte-serveur.ts`) ;
 *   · LA CONFIDENTIALITÉ : la page ClikMe (`/collection/confidentialite`).
 * Après l'un ou l'autre, ce téléphone oublie tout ce qu'il retenait de ClikMe (`clikme-…`), et revient à l'accueil.
 *
 * FICHIER NAVIGATEUR.
 */
import { useState } from "react";
import { Feuille } from "./ma-figurine";
import { ProtegerFigurine } from "./connaitre";

const ROUTE = "/api/direct/mon-compte";

/** Les mots de « Mon compte ». */
export const PHRASES_COMPTE = {
  groupe: "Mon compte",
  confidentialite: "Confidentialité",
  confidentialiteDit: "Ce que ClikMe garde, pourquoi, et combien de temps",
  deconnecter: "Se déconnecter",
  deconnecterDit: "Ce téléphone oublie ta figurine",
  supprimer: "Supprimer mon compte",
  supprimerDit: "Tout effacer, définitivement",
  // la déconnexion
  titreDeconnecter: "Se déconnecter ?",
  sauvee: (adresse: string) => `Pour revenir, touche « J’ai déjà une figurine » : on t’enverra un code à ${adresse}.`,
  pasSauvee: "Ta figurine n’est pas sauvegardée. Sans adresse e-mail, tu ne pourras plus la retrouver, ni sur ce téléphone, ni sur un autre.",
  sauverDabord: "🔒 Sauvegarder d’abord",
  quandMeme: "Me déconnecter quand même",
  confirmerDeconnexion: "Me déconnecter",
  annuler: "Annuler",
  // la suppression
  titreSupprimer: "Supprimer mon compte",
  ceQuiPart: "Tout part, tout de suite :",
  liste: [
    "ta figurine et ton selfie",
    "ta maison et ce que tu y as mis",
    "tes messages, tes vocaux et tes photos, chez tes proches aussi",
    "tes réactions, tes mots sous les vidéos, tes moments partagés",
    "tes proches et tes groupes",
  ],
  prochesVoient: "Tes proches verront seulement que ton compte a été supprimé.",
  definitif: "C’est définitif : rien ne pourra être récupéré.",
  case: "Je comprends que c’est définitif",
  confirmerSuppression: "Supprimer mon compte",
  enCours: "Suppression…",
  fait: "Ton compte est supprimé. Merci d’être passé par ClikMe.",
  rate: "La suppression n’a pas abouti : réessaie dans un instant.",
} as const;

/** Ce téléphone oublie ce qu'il retenait de ClikMe, puis revient à l'accueil. */
function oublierEtRevenir(delai = 0) {
  try {
    for (const k of Object.keys(window.localStorage)) if (k.startsWith("clikme")) window.localStorage.removeItem(k);
  } catch {
    /* (sans stockage : rien à oublier) */
  }
  window.setTimeout(() => window.location.assign("/collection"), delai);
}

export function FeuilleDeconnexion({ ouverte, onFermer, protegee }: { ouverte: boolean; onFermer: () => void; protegee?: string }) {
  const [sauver, setSauver] = useState(false);
  const [adresse, setAdresse] = useState(protegee ?? "");
  const [enCours, setEnCours] = useState(false);
  async function partir() {
    setEnCours(true);
    await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "deconnecter" }) }).catch(() => null);
    oublierEtRevenir();
  }
  return (
    <Feuille ouverte={ouverte} onFermer={onFermer} titre={PHRASES_COMPTE.titreDeconnecter} className="mk-feuille">
      <div className="mk" data-feuille-deconnexion>
        <b className="mk-titre">{PHRASES_COMPTE.titreDeconnecter}</b>
        {adresse ? (
          <>
            <p data-deconnexion-sauvee>{PHRASES_COMPTE.sauvee(adresse)}</p>
            <button type="button" className="mk-principal" disabled={enCours} onClick={() => void partir()} data-confirmer-deconnexion>
              {PHRASES_COMPTE.confirmerDeconnexion}
            </button>
          </>
        ) : sauver ? (
          <ProtegerFigurine mode="proteger" onFait={(a) => (setAdresse(a), setSauver(false))} />
        ) : (
          <>
            <p className="mk-alerte" data-deconnexion-pas-sauvee>
              {PHRASES_COMPTE.pasSauvee}
            </p>
            <button type="button" className="mk-principal" onClick={() => setSauver(true)} data-sauver-dabord>
              {PHRASES_COMPTE.sauverDabord}
            </button>
            <button type="button" className="mk-second danger" disabled={enCours} onClick={() => void partir()} data-deconnecter-quand-meme>
              {PHRASES_COMPTE.quandMeme}
            </button>
          </>
        )}
        <button type="button" className="mk-annuler" onClick={onFermer}>
          {PHRASES_COMPTE.annuler}
        </button>
      </div>
    </Feuille>
  );
}

export function FeuilleSuppression({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  const [compris, setCompris] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [fait, setFait] = useState(false);
  const [erreur, setErreur] = useState("");
  async function supprimer() {
    if (!compris || enCours) return;
    setEnCours(true);
    setErreur("");
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "supprimer", confirme: true }) }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { ok?: boolean; error?: string } | undefined;
    setEnCours(false);
    if (!r?.ok || !j?.ok) return setErreur(j?.error || PHRASES_COMPTE.rate);
    setFait(true);
    oublierEtRevenir(3500);
  }
  return (
    <Feuille ouverte={ouverte} onFermer={fait ? () => undefined : onFermer} titre={PHRASES_COMPTE.titreSupprimer} className="mk-feuille">
      <div className="mk" data-feuille-suppression>
        <b className="mk-titre">{PHRASES_COMPTE.titreSupprimer}</b>
        {fait ? (
          <p className="mk-fait" data-compte-supprime-fait>
            {PHRASES_COMPTE.fait}
          </p>
        ) : (
          <>
            <p>{PHRASES_COMPTE.ceQuiPart}</p>
            <ul className="mk-liste">
              {PHRASES_COMPTE.liste.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p>{PHRASES_COMPTE.prochesVoient}</p>
            <p className="mk-alerte">{PHRASES_COMPTE.definitif}</p>
            <label className="mk-case">
              <input type="checkbox" id="mk-compris" checked={compris} onChange={(e) => setCompris(e.target.checked)} data-compris />
              <span>{PHRASES_COMPTE.case}</span>
            </label>
            {erreur && (
              <p className="mk-erreur" role="alert">
                {erreur}
              </p>
            )}
            <button type="button" className="mk-principal danger" disabled={!compris || enCours} onClick={() => void supprimer()} data-confirmer-suppression>
              {enCours ? PHRASES_COMPTE.enCours : PHRASES_COMPTE.confirmerSuppression}
            </button>
            <button type="button" className="mk-annuler" onClick={onFermer}>
              {PHRASES_COMPTE.annuler}
            </button>
          </>
        )}
      </div>
    </Feuille>
  );
}

export const STYLES_MON_COMPTE = `
.mk{display:flex;flex-direction:column;gap:10px;padding:2px 2px 6px;color:#FFF4E6}
.mk-titre{font-size:19px;font-weight:900;padding-right:40px}
.mk p{margin:0;font-size:14.5px;line-height:1.45;color:#E9D6DF}
.mk .mk-alerte{color:#FFD27A;font-weight:700}
.mk .mk-fait{font-size:16px;font-weight:800;color:#FFF4E6}
.mk .mk-erreur{color:#FF9B9B;font-weight:700}
.mk-liste{margin:0;padding-left:20px;display:grid;gap:3px;font-size:14px;color:#E9D6DF}
.mk-case{display:flex;align-items:center;gap:10px;min-height:44px;font-weight:800;font-size:14.5px;cursor:pointer}
.mk-case input{width:22px;height:22px;accent-color:#FF2E9A}
.mk-principal{min-height:50px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-weight:900;font-size:16px;cursor:pointer}
.mk-principal.danger{background:#C0392B}
.mk-principal:disabled{opacity:.5;cursor:default}
.mk-second{min-height:46px;border:1px solid rgba(255,255,255,.22);border-radius:999px;background:none;color:#FFF4E6;font:inherit;font-weight:800;font-size:15px;cursor:pointer}
.mk-second.danger{border-color:rgba(255,120,120,.5);color:#FFB3B3}
.mk-annuler{align-self:center;min-height:40px;padding:0 16px;border:0;background:none;color:#CDB4C0;font:inherit;font-weight:700;font-size:14px;cursor:pointer}
.pm-ligne.danger b{color:#FF9B9B}
`;
