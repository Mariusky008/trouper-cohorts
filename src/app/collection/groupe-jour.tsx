"use client";

/**
 * 🎬 AUJOURD'HUI DANS LE GROUPE (Mes groupes, le lot G6, 26 novembre 2026 ; `lib/direct/groupes-jour-serveur.ts`, la
 * maquette G0 validée, planche « Groupe »).
 *
 * La sélection du jour : la vidéo de chacun avec son mot, puis les nouveautés de la passion. 🙋 pour celles qu'on veut
 * ce soir : les têtes, jamais un nombre ; à deux mains, « ✓ Ce soir » (elle ouvrira la télé du salon). Puis « Ce soir,
 * chacun son rôle » : les rôles qui tournent chaque jour, et « C'est ton tour » quand j'en ai un.
 */
import { useState } from "react";
import { vignetteYouTube } from "@/lib/direct/tele";
import type { TeleDuJour } from "@/lib/direct/tele-du-jour";
import { MOT_GROUPE_MAX, PHRASES_AUJOURDHUI as PJ, ROLES_DU_JOUR, type AujourdhuiDuGroupe, type IdRole, type PlaceGroupe, type VideoDuGroupe } from "@/lib/direct/groupes";
import { poster } from "./groupe-vie";

type SetAujourdhui = (a: AujourdhuiDuGroupe) => void;

function Tete({ p, grand }: { p: PlaceGroupe; grand?: boolean }) {
  return (
    <span className={`gj-tete${grand ? " grand" : ""}`} title={p.prenom}>
      {p.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.src} alt={p.prenom} draggable={false} />
      ) : (
        <span aria-hidden="true">🙂</span>
      )}
    </span>
  );
}

export function OngletAujourdhui({
  gid,
  etiquette,
  a,
  setA,
  tele,
  onDit,
  onSujet,
  onProchaine,
}: {
  gid: string;
  etiquette: string;
  a: AujourdhuiDuGroupe;
  setA: SetAujourdhui;
  tele: TeleDuJour | null;
  onDit: (t: string) => void;
  onSujet: () => void;
  onProchaine: () => void;
}) {
  const [feuille, setFeuille] = useState<"tele" | "lien" | null>(null);
  const [envoi, setEnvoi] = useState("");
  const mienne = a.selection.some((v) => v.mienne);
  const monRole = a.roles.find((r) => r.moi);

  async function envie(v: VideoDuGroupe) {
    if (envoi) return;
    setEnvoi(v.id);
    const { ok, j } = await poster({ action: "jour-envie", groupe: gid, video: v.id, oui: !v.moi });
    setEnvoi("");
    if (!ok) return onDit(String(j.error || "Ça n’a pas marché. Réessaie."));
    if (j.aujourdhui) setA(j.aujourdhui as AujourdhuiDuGroupe);
    if (j.retenue) onDit(PJ.retenueDit);
  }
  async function retirer() {
    const { ok, j } = await poster({ action: "jour-retirer", groupe: gid });
    if (!ok) return onDit(String(j.error || "Ça n’a pas marché. Réessaie."));
    if (j.aujourdhui) setA(j.aujourdhui as AujourdhuiDuGroupe);
  }
  function tour(id: IdRole) {
    if (id === "sujet") return onSujet();
    if (id === "prochaine") return onProchaine();
    setFeuille(id === "decouverte" ? "lien" : "tele");
  }

  return (
    <div className="gj" data-onglet-jour>
      <p className="gj-etiq">{etiquette}</p>
      <div className="gj-rang" data-selection>
        {a.selection.map((v) => (
          <div key={v.id} className={`gj-vid${v.retenue ? " retenue" : ""}`} data-video={v.id}>
            <span className="gj-img" style={{ backgroundImage: `url(${vignetteYouTube(v.id)})` }}>
              {v.retenue && (
                <span className="gj-cesoir" data-retenue>
                  {PJ.ceSoir}
                </span>
              )}
              {v.de ? (
                <span className="gj-qui">
                  <Tete p={v.de} />
                </span>
              ) : (
                <span className="gj-nouveaute">{PJ.nouveaute}</span>
              )}
            </span>
            <div className="gj-bas">
              <p className="gj-mot">{v.mot ? `« ${v.mot} »` : v.titre}</p>
              <div className="gj-envies">
                <button type="button" className={`gj-main${v.moi ? " pris" : ""}`} aria-pressed={Boolean(v.moi)} aria-label={PJ.envieDit} disabled={envoi === v.id} onClick={() => void envie(v)} data-envie>
                  {PJ.envie}
                </button>
                <span className="gj-pile">
                  {v.envies.map((p) => (
                    <Tete key={p.q} p={p} />
                  ))}
                </span>
              </div>
              {v.mienne && (
                <button type="button" className="gj-retirer" onClick={() => void retirer()} data-retirer-mienne>
                  {PJ.retirer}
                </button>
              )}
            </div>
          </div>
        ))}
        {!mienne && (
          <button type="button" className="gj-vid gj-plus" onClick={() => setFeuille("tele")} data-proposer-mienne>
            <b aria-hidden="true">＋</b>
            {PJ.proposer}
          </button>
        )}
      </div>

      {a.roles.length > 0 && (
        <>
          <p className="gj-etiq">{PJ.roles}</p>
          <div className="gj-rang gj-roles" data-roles>
            {a.roles.map((r) => (
              <div key={r.id} className={`gj-role${r.moi ? " moi" : ""}`} data-role={r.id}>
                <Tete p={r.qui} grand />
                <b aria-hidden="true">{r.e}</b>
                <span>{r.nom}</span>
                <i>{r.moi ? PJ.toi : r.qui.prenom}</i>
              </div>
            ))}
          </div>
        </>
      )}
      {monRole && (
        <button type="button" className="gj-tour" onClick={() => tour(monRole.id)} data-mon-tour={monRole.id}>
          <span className="gj-tour-e" aria-hidden="true">
            {monRole.e}
          </span>
          <span className="gj-tour-t">
            <b>{PJ.tonTour}</b>
            <span>{ROLES_DU_JOUR.find((x) => x.id === monRole.id)?.tour}</span>
          </span>
          <span className="gj-go">{PJ.go}</span>
        </button>
      )}

      {feuille && (
        <MaVideo
          gid={gid}
          tele={tele}
          lien={feuille === "lien"}
          onFermer={() => setFeuille(null)}
          onPubliee={(x) => {
            setFeuille(null);
            setA(x);
            onDit(PJ.ajoutee);
          }}
        />
      )}
    </div>
  );
}

/** ＋ Ma vidéo du jour : de ma télé du jour, ou un lien YouTube ; et pourquoi elle. */
function MaVideo({ gid, tele, lien: lienDabord, onFermer, onPubliee }: { gid: string; tele: TeleDuJour | null; lien: boolean; onFermer: () => void; onPubliee: (a: AujourdhuiDuGroupe) => void }) {
  const videos = (tele?.videos ?? []).slice(0, 8);
  const [choix, setChoix] = useState<string>(lienDabord || !videos.length ? "lien" : videos[0].id);
  const [lien, setLien] = useState("");
  const [mot, setMot] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const pret = choix === "lien" ? Boolean(lien.trim()) : true;

  async function publier() {
    if (envoi || !pret) return;
    setEnvoi(true);
    setErreur("");
    const { ok, j } = await poster({ action: "jour-proposer", groupe: gid, ...(choix === "lien" ? { lien: lien.trim() } : { video: choix }), mot: mot.trim() });
    setEnvoi(false);
    if (!ok || !j.aujourdhui) return setErreur(String(j.error || "Ça n’a pas marché. Réessaie."));
    onPubliee(j.aujourdhui as AujourdhuiDuGroupe);
  }

  return (
    <>
      <button type="button" className="gv-voile" aria-label="Fermer" onClick={onFermer} />
      <div className="gv-feuille" role="dialog" aria-label={PJ.maVideoTitre} data-feuille-ma-video>
        <p className="gv-feuille-titre">{PJ.maVideoTitre}</p>
        {videos.length > 0 && (
          <>
            <p className="gv-etiquette">{PJ.maTele}</p>
            <div className="gv-puces">
              {videos.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`gj-vignette${choix === v.id ? " pris" : ""}`}
                  aria-pressed={choix === v.id}
                  style={{ backgroundImage: `linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.8)),url(${vignetteYouTube(v.id)})` }}
                  onClick={() => setChoix(v.id)}
                  data-ma-tele={v.id}
                >
                  <span>{v.titre}</span>
                </button>
              ))}
            </div>
          </>
        )}
        <button type="button" className={`gv-puce gj-lien${choix === "lien" ? " pris" : ""}`} aria-pressed={choix === "lien"} onClick={() => setChoix("lien")} data-un-lien>
          🔗 {PJ.unLien}
        </button>
        {choix === "lien" && (
          <label className="gv-champ">
            <input type="url" inputMode="url" value={lien} onChange={(e) => setLien(e.target.value)} placeholder={PJ.lienIndice} aria-label={PJ.unLien} data-lien-video />
          </label>
        )}
        <label className="gv-champ">
          <span>{PJ.pourquoi}</span>
          <input type="text" maxLength={MOT_GROUPE_MAX} value={mot} onChange={(e) => setMot(e.target.value)} placeholder={PJ.pourquoiIndice} data-pourquoi />
        </label>
        {erreur && (
          <p className="gv-erreur" role="alert">
            {erreur}
          </p>
        )}
        <button type="button" className="gv-ajouter" disabled={envoi || !pret} onClick={() => void publier()} data-publier-ma-video>
          {PJ.publier}
        </button>
      </div>
    </>
  );
}

export const STYLES_AUJOURDHUI = `
.gj{display:flex;flex-direction:column;gap:12px}
.gj-etiq{margin:0;padding:0 16px;color:#F2C46B;font-weight:800;font-size:15px}
.gj-rang{display:flex;gap:12px;overflow-x:auto;padding:2px 16px 6px;scrollbar-width:none}
.gj-rang::-webkit-scrollbar{display:none}
.gj-vid{flex:none;display:flex;flex-direction:column;width:200px;border-radius:18px;overflow:hidden;background:#1f1612;box-shadow:0 0 0 1px rgba(255,196,140,.12)}
.gj-vid.retenue{box-shadow:0 0 0 2px #3ddc97}
.gj-img{position:relative;display:block;height:112px;background:#2a1d18 center/cover no-repeat}
.gj-cesoir{position:absolute;left:8px;top:8px;padding:4px 9px;border-radius:999px;background:#3ddc97;color:#06301a;font-weight:800;font-size:12.5px}
.gj-qui{position:absolute;left:10px;bottom:-16px}
.gj-nouveaute{position:absolute;left:8px;bottom:8px;padding:4px 9px;border-radius:999px;background:rgba(18,12,9,.8);font-weight:800;font-size:12px}
.gj-bas{display:flex;flex-direction:column;gap:8px;padding:20px 10px 10px}
.gj-mot{margin:0;font-size:13.5px;font-weight:700;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.gj-envies{display:flex;align-items:center;gap:6px}
.gj-main{flex:none;min-width:44px;min-height:40px;padding:0 10px;border:1px solid rgba(255,196,140,.28);border-radius:999px;background:#1c1411;font-size:18px;cursor:pointer}
.gj-main.pris{border-color:#3ddc97;background:rgba(61,220,151,.22)}
.gj-pile{display:flex}
.gj-pile .gj-tete{margin-left:-8px;box-shadow:0 0 0 2px #1f1612}
.gj-pile .gj-tete:first-child{margin-left:0}
.gj-retirer{align-self:flex-start;padding:0;border:0;background:none;color:#a8927e;font:inherit;font-size:12.5px;text-decoration:underline;cursor:pointer}
.gj-plus{align-items:center;justify-content:center;gap:6px;width:130px;min-height:170px;border:1px dashed rgba(255,196,140,.4);background:none;color:#cdb8a4;font:inherit;font-weight:700;font-size:13.5px;text-align:center;cursor:pointer;box-shadow:none}
.gj-plus b{font-size:30px;font-weight:300}
.gj-tete{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;overflow:hidden;background:#3a2430;flex:none}
.gj-tete img{width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.gj-tete.grand{width:64px;height:64px}
.gj-roles{gap:4px}
.gj-role{flex:none;width:88px;display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center;font-weight:700;font-size:12px;line-height:1.15}
.gj-role b{display:flex;align-items:center;justify-content:center;width:28px;height:28px;margin-top:-14px;border-radius:50%;background:#f5a23a;color:#2a1500;font-size:14px;position:relative;z-index:1}
.gj-role i{font-style:normal;color:#cdb8a4;font-weight:600}
.gj-role.moi .gj-tete{box-shadow:0 0 0 3px #ff2e9a}
.gj-tour{display:flex;align-items:center;gap:10px;margin:0 16px;padding:12px 14px;border:1px solid rgba(255,46,154,.45);border-radius:18px;background:#1f1612;color:#FFF4E6;font:inherit;text-align:left;cursor:pointer}
.gj-tour-e{font-size:26px}
.gj-tour-t{flex:1;display:flex;flex-direction:column}
.gj-tour-t b{font-size:15px}
.gj-tour-t span{color:#cdb8a4;font-size:13px}
.gj-go{display:inline-flex;align-items:center;min-height:38px;padding:0 16px;border-radius:999px;background:#f5a23a;color:#2a1500;font-weight:800}
.gj-vignette{flex:none;position:relative;display:flex;align-items:flex-end;width:132px;height:84px;padding:6px 8px;box-sizing:border-box;border:0;border-radius:12px;background:#120c09 center/cover no-repeat;color:#fff;font:inherit;font-size:11.5px;font-weight:700;line-height:1.15;text-align:left;cursor:pointer}
.gj-vignette span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.gj-vignette.pris{box-shadow:0 0 0 3px #ff2e9a}
.gj-lien{align-self:flex-start}
`;
