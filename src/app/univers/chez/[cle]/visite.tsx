"use client";

/**
 * 🚪 EN VISITE CHEZ QUELQU'UN — chantier « Univers », lot 6 (`lib/direct/visites.ts` : la règle), refait le 13 novembre
 * 2026 (le propriétaire : « les figurines ne sont pas proportionnelles à l'univers […] il faut repenser le système où
 * l'on frappe à la porte et quand on laisse un cadeau : plus accessible et immédiat »).
 *
 *   · son univers : son décor, sa figurine assise à sa place, la mienne qui entre et s'assoit à la place de l'invité —
 *     toutes deux à l'échelle de la conversation chez soi (36 % de la hauteur du décor, fois l'échelle de la place) ;
 *     ses souvenirs acceptés, posés sur le sol (un toucher : de qui, son mot) ; mes cadeaux pas encore ouverts, en
 *     paquets à ses pieds ;
 *   · deux gestes, juste sous la scène : « 🚪 Toc toc » (le son de la porte, la scène qui tremble, « Toc ! Toc ! » ; il
 *     saura qui est passé) et, entre proches, « 🎁 Offrir » (un objet, un mot : le paquet s'envole et se pose à ses
 *     pieds ; il le découvrira en ouvrant ClikMe, dans « Chez moi ») ;
 *   · entre proches : « 🔑 Les clés de son univers » (ses phrases) ; « 🚩 Signaler » ; un univers fermé, ou réservé à
 *     ses proches : on le dit, simplement.
 *
 * FICHIER NAVIGATEUR.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { MOT_SOUVENIR_MAX, OBJETS_SOUVENIR, SOUVENIRS_EN_ATTENTE_MAX, objetDe, type ObjetSouvenir, type VueVisite } from "@/lib/direct/visites";
import { jouerDoux } from "@/lib/direct/sons";

const ROUTE = "/api/direct/visites";
type Ouvert = Extract<VueVisite, { etat: "ouvert" }>;

async function poster(corps: Record<string, unknown>): Promise<void> {
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok || j.error) throw new Error(j.error || "Ça n’a pas marché. Réessaie.");
}

/** 📏 La hauteur d'une figurine assise, en part du décor (la même que la conversation chez soi, `styleDePlace`). */
const TAILLE_ASSISE = 0.36;
const echelleDe = (e: number) => Math.min(1.15, Math.max(0.9, e || 1));
/** Une figurine à sa place : le bas de son image sur la place, sa hauteur à l'échelle du décor. */
const styleDePlace = (x: number, y: number, echelle: number, part = 1): React.CSSProperties => ({
  left: `${x * 100}%`,
  bottom: `${(1 - y) * 100}%`,
  height: `${TAILLE_ASSISE * echelleDe(echelle) * part * 100}%`,
});

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
          <p className="uv-doux">{vue.etat === "reserve" ? "Ajoutez-vous tous les deux dans « Chez moi », et la porte s’ouvrira." : "Reviens un autre jour 🙂"}</p>
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

/** Les confettis d'un paquet qui se pose (des directions, des couleurs). */
const ETINCELLES = Array.from({ length: 12 }, (_, i) => ({ a: (i / 12) * Math.PI * 2, c: ["#FF2E9A", "#F2C46B", "#7ED6FF", "#3DDC84"][i % 4] }));

function Ouverte({ vue, cle, recharger }: { vue: Ouvert; cle: string; recharger: () => Promise<void> }) {
  const [frappe, setFrappe] = useState(vue.frappe);
  const [cles, setCles] = useState(false);
  const [offrir, setOffrir] = useState(false);
  const [objet, setObjet] = useState<ObjetSouvenir | null>(null);
  const [mot, setMot] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState(false);
  // 🎬 ce qui se joue sur la scène : « toc » (la porte), « envol » (un paquet qui arrive), le souvenir montré
  const [toc, setToc] = useState(0);
  const [envol, setEnvol] = useState(0);
  const [paquets, setPaquets] = useState(vue.mesCadeaux);
  const [montre, setMontre] = useState<string | null>(null);
  const minuteurs = useRef<number[]>([]);
  useEffect(() => () => minuteurs.current.forEach((m) => window.clearTimeout(m)), []);
  const plusTard = (f: () => void, ms: number) => minuteurs.current.push(window.setTimeout(f, ms));

  async function faire(corps: Record<string, unknown>): Promise<boolean> {
    setOccupe(true);
    setErreur("");
    try {
      await poster({ ...corps, cle });
      return true;
    } catch (e) {
      setErreur((e as Error).message);
      return false;
    } finally {
      setOccupe(false);
    }
  }

  /** 🚪 Toc toc : le son de la porte et la scène qui tremble tout de suite ; il saura qui est passé. */
  function frapper() {
    jouerDoux("porte");
    setToc((n) => n + 1);
    setMessage("");
    void faire({ action: "frapper" }).then((ok) => {
      if (!ok) return;
      setFrappe(true);
      plusTard(() => setMessage(`Toc toc ! ${vue.prenom} verra ta visite 💛`), 650);
    });
  }

  /** 🎁 Offrir : le paquet s'envole et se pose à ses pieds ; il l'ouvrira chez lui. */
  async function offrirLeCadeau() {
    if (!objet) return;
    if (!(await faire({ action: "souvenir", objet, mot }))) return;
    setOffrir(false);
    setObjet(null);
    setMot("");
    setFrappe(true);
    setMessage("");
    jouerDoux("cadeau");
    setEnvol((n) => n + 1);
    plusTard(() => setPaquets((n) => n + 1), 1100);
    plusTard(() => setMessage(`🎁 Ton cadeau est déposé ! ${vue.prenom} le découvrira en ouvrant ClikMe.`), 1150);
  }

  const h = vue.hote;
  const i = vue.invite;
  // (les paquets : aux pieds de sa figurine, côté invité)
  const piedX = Math.min(0.9, Math.max(0.1, h.x + (i.x >= h.x ? 0.13 : -0.13)));
  const piedY = Math.min(0.99, h.y + 0.02);
  const pleins = paquets >= SOUVENIRS_EN_ATTENTE_MAX;
  const souvenirMontre = vue.souvenirs.find((s) => s.id === montre);
  return (
    <section className="uv-ouvert" aria-label={`Chez ${vue.prenom}`}>
      <header className="uv-haut">
        <a className="uv-retour" href="/collection#proches" aria-label="Revenir chez moi">
          ←
        </a>
        <h1 className="uv-entete">{vue.chezSoi ? "Ton univers, vu par tes visiteurs" : `Chez ${vue.prenom}`}</h1>
        <span className="uv-retour vide" aria-hidden="true" />
      </header>

      {/* (chaque « toc » relance le tremblement : deux noms d'animation, en alternance) */}
      <div className={`uv-scene${toc ? ` toc${toc % 2}` : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="uv-decor" src={vue.decor} alt={`L’univers de ${vue.prenom}`} />
        {vue.souvenirs.map((s) =>
          typeof s.x === "number" && typeof s.y === "number" ? (
            <button
              key={s.id}
              type="button"
              className={`uv-souvenir${montre === s.id ? " montre" : ""}`}
              style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%` }}
              aria-label={`${objetDe(s.objet)?.nom ?? "Un souvenir"}, de ${s.de}`}
              onClick={() => setMontre((x) => (x === s.id ? null : s.id))}
            >
              {objetDe(s.objet)?.emoji}
            </button>
          ) : null,
        )}
        <span className={`uv-place hote${toc ? ` sursaute${toc % 2}` : ""}`} style={styleDePlace(h.x, h.y, h.echelle)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={h.image} alt={`La figurine de ${vue.prenom}, chez elle`} />
        </span>
        {i.image && (
          <span className={`uv-place invite${i.assise ? " assise" : ""}`} style={styleDePlace(i.x, i.y, i.echelle, i.assise ? 1 : 0.8)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={i.image} alt="Ta figurine, en visite" />
          </span>
        )}
        {/* 🎁 mes cadeaux pas encore ouverts : en paquets, à ses pieds */}
        {paquets > 0 && (
          <span className="uv-paquets" style={{ left: `${piedX * 100}%`, top: `${piedY * 100}%` }} aria-label={`${paquets} cadeau${paquets > 1 ? "x" : ""} de toi, pas encore ouvert${paquets > 1 ? "s" : ""}`}>
            {Array.from({ length: Math.min(3, paquets) }, (_, k) => (
              <i key={k}>🎁</i>
            ))}
          </span>
        )}
        {envol > 0 && (
          <span key={`envol-${envol}`} className="uv-envol" style={{ left: `${piedX * 100}%`, top: `${piedY * 100}%` }} aria-hidden="true">
            <i>🎁</i>
            {ETINCELLES.map((e, k) => (
              <b key={k} style={{ ["--dx" as string]: `${Math.cos(e.a) * 60}px`, ["--dy" as string]: `${Math.sin(e.a) * 60}px`, background: e.c }} />
            ))}
          </span>
        )}
        {toc > 0 && (
          <span key={`bulles-${toc}`} className="uv-toc" aria-hidden="true">
            <b>Toc !</b>
            <b>Toc !</b>
          </span>
        )}
        {souvenirMontre && (
          <p className="uv-bulle" style={{ left: `${Math.min(0.8, Math.max(0.2, souvenirMontre.x ?? 0.5)) * 100}%`, top: `${(souvenirMontre.y ?? 0.9) * 100}%` }} role="status">
            {objetDe(souvenirMontre.objet)?.nom}, de {souvenirMontre.de}
            {souvenirMontre.mot ? ` : « ${souvenirMontre.mot} »` : ""}
          </p>
        )}
        {message && (
          // (il reste jusqu'au geste suivant ; un toucher le ferme)
          <p className="uv-message" role="status" onClick={() => setMessage("")}>
            {message}
          </p>
        )}
      </div>

      {!vue.chezSoi && (
        <div className={`uv-gestes${vue.peutLaisser ? "" : " seul"}`}>
          <button type="button" className="uv-geste porte" disabled={occupe} onClick={frapper}>
            <span aria-hidden="true">🚪</span>
            <b>Toc toc</b>
            <small>{frappe ? "✓ Déjà frappé aujourd’hui" : "Frapper à sa porte"}</small>
          </button>
          {vue.peutLaisser && (
            <button type="button" className="uv-geste cadeau" disabled={occupe || pleins} onClick={() => setOffrir(true)}>
              <span aria-hidden="true">🎁</span>
              <b>Offrir</b>
              <small>{pleins ? `${paquets} cadeaux l’attendent déjà` : "Un cadeau, un petit mot"}</small>
            </button>
          )}
        </div>
      )}
      {erreur && (
        <p className="uv-erreur" role="alert">
          {erreur}
        </p>
      )}

      {vue.proposition && <p className="uv-proposition">{vue.proposition}</p>}

      {!vue.chezSoi && vue.proche && vue.cles.length > 0 && (
        <button type="button" className="uv-bouton clair" aria-pressed={cles} onClick={() => setCles((x) => !x)}>
          🔑 Les clés de son univers
        </button>
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
          <button type="button" className="uv-lien" disabled={occupe} onClick={() => void faire({ action: "signaler" }).then((ok) => ok && setMessage("Merci : l’équipe ClikMe va regarder.")).then(() => recharger())}>
            🚩 Signaler cet univers
          </button>
        )}
      </div>

      {/* 🎁 la feuille du cadeau : un objet, un mot, « Offrir » */}
      {offrir && (
        <div className="uv-voile" onClick={() => !occupe && setOffrir(false)}>
          <div className="uv-feuille" role="dialog" aria-label={`Un cadeau pour ${vue.prenom}`} onClick={(e) => e.stopPropagation()}>
            <div className="uv-feuille-haut">
              <b>Un cadeau pour {vue.prenom}</b>
              <button type="button" className="uv-fermer" aria-label="Fermer" onClick={() => setOffrir(false)}>
                ✕
              </button>
            </div>
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
              <input type="text" name="mot" maxLength={MOT_SOUVENIR_MAX} value={mot} placeholder="Un mot doux, une blague…" onChange={(e) => setMot(e.target.value)} />
            </label>
            <button type="button" className="uv-bouton offrir" disabled={occupe || !objet} onClick={() => void offrirLeCadeau()}>
              {objet ? `Offrir ${objetDe(objet)?.emoji ?? ""} à ${vue.prenom}` : "Choisis un cadeau"}
            </button>
            <p className="uv-doux petit">Il arrive emballé : {vue.prenom} l’ouvrira, et décidera de le poser chez soi.</p>
          </div>
        </div>
      )}
    </section>
  );
}

const STYLES = `
.uv{min-height:100dvh;margin:0;padding:12px 16px 32px;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;color:#2b1a0c;display:flex;flex-direction:column;align-items:center;gap:12px;overflow-x:hidden;background:linear-gradient(180deg,#f6d9a8,#e7b77a 60%,#c98f55)}
.uv section{width:100%;max-width:460px;display:flex;flex-direction:column;gap:12px}
.uv-centre{margin:40vh 0 0}
.uv-carte{align-items:center;text-align:center;padding-top:20vh}
.uv-titre{margin:0;font-size:24px;font-weight:800}
.uv-haut{display:grid;grid-template-columns:40px 1fr 40px;align-items:center}
.uv-retour{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:rgba(255,250,240,.7);color:#2b1a0c;font-size:20px;font-weight:900;text-decoration:none}
.uv-retour.vide{background:none}
.uv-entete{margin:0;font-size:24px;font-weight:900;text-align:center}
.uv-doux{margin:0;color:#4a3017;line-height:1.45}
.uv-doux.petit{font-size:13px;text-align:center}
.uv-bouton{align-self:stretch;min-height:50px;border:0;border-radius:16px;background:#2b1a0c;color:#fff6e6;font:inherit;font-size:17px;font-weight:800;display:flex;align-items:center;justify-content:center;text-decoration:none;cursor:pointer}
.uv-bouton.clair{background:rgba(255,250,240,.88);color:#2b1a0c;border:2px solid #2b1a0c;font-size:16px;min-height:46px}
.uv-bouton.offrir{background:linear-gradient(135deg,#FF2E9A,#F2A23B);font-size:18px;min-height:56px;box-shadow:0 10px 22px -10px rgba(255,46,154,.9)}
.uv-bouton:disabled{opacity:.55}
.uv-scene{position:relative;width:100%;aspect-ratio:2/3;border-radius:22px;overflow:hidden;box-shadow:0 12px 30px rgba(43,26,12,.35);background:#2b1a0c;container-type:inline-size}
.uv-scene.toc0{animation:uv-tremble .5s ease-out both}
.uv-scene.toc1{animation:uv-tremble2 .5s ease-out both}
.uv-decor{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.uv-place{position:absolute;transform:translateX(-50%);aspect-ratio:2/3;display:flex;align-items:flex-end;justify-content:center;pointer-events:none}
.uv-place img{height:100%;width:auto;object-fit:contain;filter:drop-shadow(0 6px 8px rgba(0,0,0,.35))}
.uv-place.sursaute0 img{animation:uv-sursaute .7s .25s cubic-bezier(.3,1.6,.5,1) both}
.uv-place.sursaute1 img{animation:uv-sursaute2 .7s .25s cubic-bezier(.3,1.6,.5,1) both}
.uv-place.invite{animation:uv-entre .9s cubic-bezier(.2,.9,.3,1) both}
.uv-place.invite.assise img{transform:scaleX(-1)}
.uv-place.invite:not(.assise) img{border-radius:14px;box-shadow:0 8px 18px rgba(0,0,0,.4);aspect-ratio:3/4;object-fit:cover;height:80%}
.uv-souvenir{position:absolute;transform:translate(-50%,-100%);border:0;background:none;padding:2px;font-size:clamp(22px,8cqw,40px);line-height:1;filter:drop-shadow(0 4px 4px rgba(0,0,0,.35));cursor:pointer;-webkit-tap-highlight-color:transparent}
.uv-souvenir.montre{animation:uv-hop .5s cubic-bezier(.3,1.6,.5,1)}
.uv-paquets{position:absolute;transform:translate(-50%,-100%);display:flex;gap:1px;font-size:clamp(20px,7.5cqw,36px);line-height:1;pointer-events:none}
.uv-paquets i{font-style:normal;filter:drop-shadow(0 4px 4px rgba(0,0,0,.4));animation:uv-balance 2.6s ease-in-out infinite;transform-origin:50% 100%;will-change:transform}
.uv-paquets i:nth-child(2){animation-delay:-.8s}
.uv-paquets i:nth-child(3){animation-delay:-1.6s}
.uv-envol{position:absolute;width:0;height:0;pointer-events:none}
.uv-envol i{position:absolute;left:0;top:0;font-style:normal;font-size:clamp(30px,12cqw,54px);line-height:1;transform:translate(-50%,-100%);animation:uv-vole 1.1s cubic-bezier(.25,.8,.35,1) both}
.uv-envol b{position:absolute;left:0;top:-14px;width:8px;height:8px;border-radius:2px;opacity:0;animation:uv-etincelle .8s 1s ease-out both}
.uv-toc{position:absolute;left:0;right:0;top:12%;display:flex;justify-content:space-around;pointer-events:none}
.uv-toc b{padding:8px 14px;border-radius:999px;background:#fffaf0;color:#2b1a0c;font-size:clamp(18px,7cqw,30px);font-weight:900;box-shadow:0 8px 18px rgba(0,0,0,.35);opacity:0;animation:uv-bulle 1.3s cubic-bezier(.3,1.6,.5,1) both}
.uv-toc b:nth-child(2){animation-delay:.2s}
.uv-bulle{position:absolute;transform:translate(-50%,calc(-100% - 46px));margin:0;max-width:70%;padding:8px 12px;border-radius:14px;background:#fffaf0;font-size:14px;line-height:1.35;box-shadow:0 8px 18px rgba(0,0,0,.35);text-align:center}
.uv-message{position:absolute;left:10px;right:10px;top:10px;z-index:2;margin:0;cursor:pointer;padding:10px 12px;border-radius:14px;background:rgba(230,246,223,.96);color:#1f4d14;font-weight:700;line-height:1.35;box-shadow:0 8px 18px rgba(0,0,0,.25);animation:uv-descend .45s cubic-bezier(.3,1.4,.5,1) both}
.uv-proposition{margin:0;padding:12px 14px;border-radius:16px;background:rgba(255,250,240,.9);line-height:1.45}
.uv-gestes{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:460px}
.uv-gestes.seul{grid-template-columns:1fr}
.uv-geste{display:flex;flex-direction:column;align-items:center;gap:2px;padding:12px 8px;border:0;border-radius:20px;color:#fff;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .12s}
.uv-geste:active:not(:disabled){transform:scale(.95)}
.uv-geste:disabled{opacity:.6}
.uv-geste span{font-size:34px;line-height:1.1}
.uv-geste b{font-size:19px;font-weight:900}
.uv-geste small{font-size:12.5px;opacity:.92;text-align:center}
.uv-geste.porte{background:linear-gradient(135deg,#7a4a24,#4a2a12);box-shadow:0 10px 22px -10px rgba(43,26,12,.9)}
.uv-geste.cadeau{background:linear-gradient(135deg,#FF2E9A,#F2A23B);box-shadow:0 10px 22px -10px rgba(255,46,154,.9)}
.uv-geste.cadeau:not(:disabled) span{animation:uv-balance 2.4s ease-in-out infinite;transform-origin:50% 90%;will-change:transform}
.uv-erreur{margin:0;padding:10px 12px;border-radius:12px;background:#fde3dc;color:#8a1c14;max-width:460px}
.uv-voile{position:fixed;inset:0;z-index:30;background:rgba(30,15,5,.45);display:flex;align-items:flex-end;justify-content:center;animation:uv-fondu .2s both}
.uv-feuille{width:100%;max-width:480px;box-sizing:border-box;padding:16px 16px calc(20px + env(safe-area-inset-bottom));border-radius:24px 24px 0 0;background:#fff6e6;display:flex;flex-direction:column;gap:12px;animation:uv-monte .32s cubic-bezier(.2,.9,.3,1) both;max-height:92dvh;overflow-y:auto}
.uv-feuille-haut{display:flex;align-items:center;justify-content:space-between;font-size:19px}
.uv-fermer{width:38px;height:38px;border:0;border-radius:50%;background:rgba(43,26,12,.08);font-size:16px;cursor:pointer}
.uv-objets{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.uv-objets button{border:2px solid transparent;border-radius:16px;background:#fff;padding:8px 2px;display:flex;flex-direction:column;align-items:center;gap:2px;color:#2b1a0c;font:inherit;cursor:pointer;transition:transform .15s}
.uv-objets button span{font-size:32px;line-height:1.1}
.uv-objets button small{font-size:10px;line-height:1.1;text-align:center}
.uv-objets button.pris{border-color:#FF2E9A;background:#ffe7f3;transform:scale(1.08)}
.uv-objets button.pris span{animation:uv-saute .5s cubic-bezier(.3,1.6,.5,1)}
.uv-mot{display:flex;flex-direction:column;gap:6px;font-weight:700}
.uv-mot input{font:inherit;font-size:17px;padding:12px;border-radius:12px;border:2px solid rgba(43,26,12,.25);background:#fff}
.uv-liste{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px;width:100%;max-width:460px}
.uv-liste li{border-radius:12px;padding:9px 12px;background:rgba(255,250,240,.88);display:flex;flex-direction:column;gap:2px}
.uv-liste small{color:#5c4126}
.uv-pied{display:flex;justify-content:space-between;width:100%;max-width:460px}
.uv-lien{border:0;background:none;color:#4a3017;font:inherit;font-size:14px;text-decoration:underline;padding:6px;cursor:pointer}
@keyframes uv-entre{from{opacity:0;translate:30% 0}to{opacity:1;translate:0 0}}
@keyframes uv-tremble{0%,100%{transform:translateX(0)}15%{transform:translateX(-6px) rotate(-.6deg)}30%{transform:translateX(5px) rotate(.5deg)}45%{transform:translateX(-4px)}60%{transform:translateX(3px)}75%{transform:translateX(-1px)}}
@keyframes uv-tremble2{0%,100%{transform:translateX(0)}15%{transform:translateX(-6px) rotate(-.6deg)}30%{transform:translateX(5px) rotate(.5deg)}45%{transform:translateX(-4px)}60%{transform:translateX(3px)}75%{transform:translateX(-1px)}}
@keyframes uv-sursaute{0%{translate:0 0}35%{translate:0 -9%}100%{translate:0 0}}
@keyframes uv-sursaute2{0%{translate:0 0}35%{translate:0 -9%}100%{translate:0 0}}
@keyframes uv-bulle{0%{opacity:0;transform:scale(.3) rotate(-12deg)}25%{opacity:1;transform:scale(1.1) rotate(4deg)}40%{transform:scale(1) rotate(0)}80%{opacity:1}100%{opacity:0;transform:translateY(-14px)}}
@keyframes uv-vole{0%{opacity:0;transform:translate(-50%,-100%) translate(10cqw,80cqw) scale(.4) rotate(-30deg)}20%{opacity:1}65%{transform:translate(-50%,-100%) translate(0,-24cqw) scale(1.25) rotate(10deg)}85%{transform:translate(-50%,-100%) translate(0,2cqw) scale(.95) rotate(-4deg)}100%{opacity:0;transform:translate(-50%,-100%) scale(1)}}
@keyframes uv-etincelle{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.4) rotate(160deg)}}
@keyframes uv-balance{0%,100%{transform:rotate(0)}20%{transform:rotate(-8deg)}40%{transform:rotate(6deg)}55%{transform:rotate(0)}}
@keyframes uv-hop{0%{transform:translate(-50%,-100%) scale(1)}40%{transform:translate(-50%,-125%) scale(1.25)}100%{transform:translate(-50%,-100%) scale(1)}}
@keyframes uv-saute{0%{transform:scale(1)}40%{transform:translateY(-6px) scale(1.25)}100%{transform:scale(1)}}
@keyframes uv-descend{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:translateY(0)}}
@keyframes uv-fondu{from{opacity:0}to{opacity:1}}
@keyframes uv-monte{from{transform:translateY(100%)}to{transform:translateY(0)}}
@media (prefers-reduced-motion:reduce){.uv *{animation:none!important}.uv-toc b,.uv-envol b{opacity:0}}
`;
