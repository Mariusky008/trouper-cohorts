"use client";

/**
 * 🚪 EN VISITE CHEZ QUELQU'UN — chantier « Univers », lot 6 (`lib/direct/visites.ts` : la règle).
 *
 *   · son univers : son décor, sa figurine assise chez elle (à la taille relevée sur son image vedette), la mienne qui
 *     entre et s'assoit à la place de l'invité ; ses souvenirs acceptés, posés sur le sol ;
 *   · « 🚪 Frapper à la porte » : il saura qui est passé (une fois par jour) ;
 *   · entre proches : « 🔑 Les clés de son univers » (ses phrases) et « 🎁 Laisser un souvenir » (un objet, un mot ; il
 *     l'accepte ou non) ;
 *   · « 🚩 Signaler » ; un univers fermé, ou réservé à ses proches : on le dit, simplement.
 *
 * FICHIER NAVIGATEUR.
 */
import { useCallback, useEffect, useState } from "react";
import { MOT_SOUVENIR_MAX, OBJETS_SOUVENIR, objetDe, type ObjetSouvenir, type VueVisite } from "@/lib/direct/visites";

const ROUTE = "/api/direct/visites";
type Ouvert = Extract<VueVisite, { etat: "ouvert" }>;

async function poster(corps: Record<string, unknown>): Promise<void> {
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok || j.error) throw new Error(j.error || "Ça n’a pas marché. Réessaie.");
}

export function Visite({ cle }: { cle: string }) {
  const [vue, setVue] = useState<VueVisite | null>(null);
  const [erreur, setErreur] = useState("");
  const charger = useCallback(async () => {
    try {
      const r = await fetch(`${ROUTE}?cle=${encodeURIComponent(cle)}`, { cache: "no-store" });
      const j = (await r.json().catch(() => ({}))) as { vue?: VueVisite; error?: string };
      if (!j.vue) throw new Error(j.error || "Cet univers ne s’ouvre pas.");
      setVue(j.vue);
    } catch (e) {
      setErreur((e as Error).message);
    }
  }, [cle]);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);

  return (
    <main className="uv">
      {!vue ? (
        <p className="uv-centre">{erreur || "On frappe à la porte…"}</p>
      ) : vue.etat !== "ouvert" ? (
        <section className="uv-carte">
          <p className="uv-titre">{vue.etat === "absent" ? "Cet univers n’existe pas (encore)" : vue.etat === "ferme" ? `${vue.prenom} garde son univers pour soi` : `L’univers de ${vue.prenom} est réservé à ses proches`}</p>
          <p className="uv-doux">{vue.etat === "reserve" ? "Ajoutez-vous tous les deux dans « Proches », et la porte s’ouvrira." : "Reviens un autre jour 🙂"}</p>
          <a className="uv-bouton" href="/collection#proches">
            Ouvrir ClikMe
          </a>
        </section>
      ) : (
        <Ouverte vue={vue} cle={cle} recharger={charger} />
      )}
      <style>{STYLES}</style>
    </main>
  );
}

function Ouverte({ vue, cle, recharger }: { vue: Ouvert; cle: string; recharger: () => Promise<void> }) {
  const [frappe, setFrappe] = useState(vue.frappe);
  const [cles, setCles] = useState(false);
  const [laisser, setLaisser] = useState(false);
  const [objet, setObjet] = useState<ObjetSouvenir | null>(null);
  const [mot, setMot] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState(false);
  async function faire(corps: Record<string, unknown>, apres: string) {
    setOccupe(true);
    setErreur("");
    try {
      await poster({ ...corps, cle });
      setMessage(apres);
      return true;
    } catch (e) {
      setErreur((e as Error).message);
      return false;
    } finally {
      setOccupe(false);
    }
  }
  // (sa figurine : à la taille relevée sur son image vedette, sinon au premier plan)
  const h = vue.hote;
  const hauteurHote = h.hauteur ? h.hauteur / 0.93 : 0.5;
  const basHote = h.hauteur ? h.y + 0.02 : Math.max(h.y, 0.9);
  const hauteurInvite = hauteurHote * Math.min(1.05, Math.max(0.85, vue.invite.echelle));
  return (
    <section className="uv-ouvert" aria-label={`Chez ${vue.prenom}`}>
      <h1 className="uv-entete">{vue.chezSoi ? "Ton univers, vu par tes visiteurs" : `Chez ${vue.prenom}`}</h1>
      <div className="uv-scene">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="uv-decor" src={vue.decor} alt={`L’univers de ${vue.prenom}`} />
        {vue.souvenirs.map((s) =>
          typeof s.x === "number" && typeof s.y === "number" ? (
            <span key={s.id} className="uv-souvenir" style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%` }} title={`${objetDe(s.objet)?.nom ?? ""}, de ${s.de}`}>
              {objetDe(s.objet)?.emoji}
            </span>
          ) : null,
        )}
        <span className="uv-place" style={{ left: `${h.x * 100}%`, top: `${Math.max(basHote, hauteurHote + 0.02) * 100}%`, height: `${hauteurHote * 100}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={h.image} alt={`La figurine de ${vue.prenom}, chez elle`} />
        </span>
        {vue.invite.image && (
          <span
            className={`uv-place invite${vue.invite.assise ? " assise" : ""}`}
            style={{ left: `${vue.invite.x * 100}%`, top: `${Math.max(Math.max(vue.invite.y, basHote - 0.01), hauteurInvite + 0.02) * 100}%`, height: `${hauteurInvite * (vue.invite.assise ? 1 : 0.8) * 100}%` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={vue.invite.image} alt="Ta figurine, en visite" />
          </span>
        )}
      </div>
      {vue.proposition && <p className="uv-proposition">{vue.proposition}</p>}

      {!vue.chezSoi && (
        <div className="uv-gestes">
          <button
            type="button"
            className="uv-bouton"
            disabled={occupe || frappe}
            onClick={() => void faire({ action: "frapper" }, `Toc toc ! ${vue.prenom} verra ta visite.`).then((ok) => ok && setFrappe(true))}
          >
            {frappe ? "✓ Tu as frappé à la porte" : "🚪 Frapper à la porte"}
          </button>
          {vue.peutLaisser && (
            <button type="button" className="uv-bouton clair" aria-pressed={laisser} onClick={() => setLaisser((x) => !x)}>
              🎁 Laisser un souvenir
            </button>
          )}
          {vue.proche && vue.cles.length > 0 && (
            <button type="button" className="uv-bouton clair" aria-pressed={cles} onClick={() => setCles((x) => !x)}>
              🔑 Les clés de son univers
            </button>
          )}
        </div>
      )}
      {message && (
        <p className="uv-message" role="status">
          {message}
        </p>
      )}
      {erreur && (
        <p className="uv-erreur" role="alert">
          {erreur}
        </p>
      )}

      {laisser && (
        <div className="uv-laisser">
          <p className="uv-doux">Choisis un souvenir. {vue.prenom} le verra, et décidera de le poser chez soi.</p>
          <div className="uv-objets">
            {OBJETS_SOUVENIR.map((o) => (
              <button key={o.cle} type="button" className={objet === o.cle ? "pris" : ""} aria-pressed={objet === o.cle} aria-label={o.nom} onClick={() => setObjet(o.cle)}>
                <span aria-hidden="true">{o.emoji}</span>
                <small>{o.nom}</small>
              </button>
            ))}
          </div>
          <label className="uv-mot">
            Un petit mot (si tu veux)
            <input type="text" name="mot" maxLength={MOT_SOUVENIR_MAX} value={mot} onChange={(e) => setMot(e.target.value)} />
          </label>
          <button
            type="button"
            className="uv-bouton"
            disabled={occupe || !objet}
            onClick={() =>
              void faire({ action: "souvenir", objet, mot }, `🎁 Ton souvenir est parti. ${vue.prenom} le verra bientôt.`).then((ok) => {
                if (!ok) return;
                setLaisser(false);
                setObjet(null);
                setMot("");
                setFrappe(true);
              })
            }
          >
            Le laisser
          </button>
        </div>
      )}

      {cles && (
        <ul className="uv-liste" aria-label="Les clés de son univers">
          {vue.cles.map((c) => (
            <li key={c.id}>
              <b>{c.quoi}</b>
              <small>{c.source === "dit" ? `« ${c.pourquoi} »` : c.pourquoi}</small>
            </li>
          ))}
        </ul>
      )}

      {vue.souvenirs.length > 0 && (
        <ul className="uv-liste" aria-label="Les souvenirs posés chez lui">
          {vue.souvenirs.map((s) => (
            <li key={s.id}>
              <b>
                {objetDe(s.objet)?.emoji} {objetDe(s.objet)?.nom}
              </b>
              <small>
                de {s.de}
                {s.mot ? ` : « ${s.mot} »` : ""}
              </small>
            </li>
          ))}
        </ul>
      )}

      <div className="uv-pied">
        <a className="uv-lien" href="/collection#proches">
          Ouvrir ClikMe
        </a>
        {!vue.chezSoi && (
          <button type="button" className="uv-lien" disabled={occupe} onClick={() => void faire({ action: "signaler" }, "Merci : l’équipe ClikMe va regarder.").then(() => recharger())}>
            🚩 Signaler cet univers
          </button>
        )}
      </div>
    </section>
  );
}

const STYLES = `
.uv{min-height:100dvh;margin:0;padding:16px 16px 32px;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;color:#2b1a0c;display:flex;flex-direction:column;align-items:center;gap:12px;overflow-x:hidden;background:linear-gradient(180deg,#f6d9a8,#e7b77a 60%,#c98f55)}
.uv section{width:100%;max-width:460px;display:flex;flex-direction:column;gap:12px}
.uv-centre{margin:40vh 0 0}
.uv-carte{align-items:center;text-align:center;padding-top:20vh}
.uv-titre{margin:0;font-size:24px;font-weight:800}
.uv-entete{margin:0;font-size:24px;font-weight:900;text-align:center}
.uv-doux{margin:0;color:#4a3017;line-height:1.45}
.uv-bouton{align-self:stretch;min-height:50px;border:0;border-radius:16px;background:#2b1a0c;color:#fff6e6;font-size:17px;font-weight:800;display:flex;align-items:center;justify-content:center;text-decoration:none}
.uv-bouton.clair{background:rgba(255,250,240,.88);color:#2b1a0c;border:2px solid #2b1a0c;font-size:16px;min-height:46px}
.uv-bouton:disabled{opacity:.55}
.uv-scene{position:relative;width:100%;aspect-ratio:2/3;border-radius:22px;overflow:hidden;box-shadow:0 12px 30px rgba(43,26,12,.35);background:#2b1a0c}
.uv-decor{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.uv-place{position:absolute;transform:translate(-50%,-100%);aspect-ratio:2/3;display:flex;align-items:flex-end;justify-content:center}
.uv-place img{height:100%;width:auto;object-fit:contain;filter:drop-shadow(0 6px 8px rgba(0,0,0,.35))}
.uv-place.invite{animation:uv-entre .9s cubic-bezier(.2,.9,.3,1) both}
.uv-place.invite.assise img{transform:scaleX(-1)}
.uv-place.invite:not(.assise) img{border-radius:14px;box-shadow:0 8px 18px rgba(0,0,0,.4);aspect-ratio:3/4;object-fit:cover;height:80%}
.uv-souvenir{position:absolute;transform:translate(-50%,-100%);font-size:34px;filter:drop-shadow(0 4px 4px rgba(0,0,0,.35))}
.uv-proposition{margin:0;padding:12px 14px;border-radius:16px;background:rgba(255,250,240,.9);line-height:1.45}
.uv-gestes{display:flex;flex-direction:column;gap:8px;width:100%;max-width:460px}
.uv-message{margin:0;padding:10px 12px;border-radius:12px;background:#e6f6df;color:#1f4d14;max-width:460px}
.uv-erreur{margin:0;padding:10px 12px;border-radius:12px;background:#fde3dc;color:#8a1c14;max-width:460px}
.uv-laisser{display:flex;flex-direction:column;gap:10px;width:100%;max-width:460px}
.uv-objets{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.uv-objets button{border:2px solid transparent;border-radius:14px;background:rgba(255,250,240,.85);padding:8px 2px;display:flex;flex-direction:column;align-items:center;gap:2px;color:#2b1a0c}
.uv-objets button span{font-size:26px}
.uv-objets button small{font-size:10px;line-height:1.1;text-align:center}
.uv-objets button.pris{border-color:#2b1a0c;background:#fff6e6}
.uv-mot{display:flex;flex-direction:column;gap:6px;font-weight:700}
.uv-mot input{font-size:17px;padding:12px;border-radius:12px;border:2px solid rgba(43,26,12,.35);background:#fffaf2}
.uv-liste{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px;width:100%;max-width:460px}
.uv-liste li{border-radius:12px;padding:9px 12px;background:rgba(255,250,240,.88);display:flex;flex-direction:column;gap:2px}
.uv-liste small{color:#5c4126}
.uv-pied{display:flex;justify-content:space-between;width:100%;max-width:460px}
.uv-lien{border:0;background:none;color:#4a3017;font-size:14px;text-decoration:underline;padding:6px}
@keyframes uv-entre{from{opacity:0;translate:30% 0}to{opacity:1;translate:0 0}}
@media (prefers-reduced-motion:reduce){.uv *{animation:none!important}}
`;
