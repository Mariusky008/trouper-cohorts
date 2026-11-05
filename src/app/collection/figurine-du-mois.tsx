"use client";

/**
 * 🗓️ SA FIGURINE DU MOIS, À L'ÉCRAN (`lib/direct/figurine-du-mois.ts`, le lot 3) :
 *   · `CommentCaMarche` : le parcours compris en dix secondes (« on ne comprend pas du tout à quoi ça sert ») ;
 *   · `ApercuDuMois` : dans « Ma figurine », où il en est (3/10 jours), un lien vers « Ce mois-ci » ;
 *   · `MaFigurineDuMois` : dans « Ce mois-ci », la progression (10 jours de rencontres), la fabrication quand elle est
 *     méritée, puis la révélation — sa tenue du mois, son visage du mois, sa phrase du mois ;
 *   · `MesFigurinesDuMois` : dans l'album, la collection de soi, mois après mois.
 */
import { useCallback, useEffect, useState } from "react";
import { moisEnClair, type FigurineDuMois, type MesFigurinesDuMois } from "@/lib/direct/figurine-du-mois";

async function chargerMois(): Promise<MesFigurinesDuMois | null> {
  try {
    const j = (await (await fetch("/api/direct/ma-figurine?mois=1", { cache: "no-store" })).json()) as { mois?: MesFigurinesDuMois };
    return j.mois ?? null;
  } catch {
    return null;
  }
}
/** (une figurine du mois qui arrive, sur un onglet : les autres onglets la voient aussitôt) */
const EVT_MOIS = "clikme-figurine-du-mois";
function useMois(): [MesFigurinesDuMois | null, (m: MesFigurinesDuMois) => void] {
  const [m, setM] = useState<MesFigurinesDuMois | null>(null);
  useEffect(() => {
    let fini = false;
    void chargerMois().then((x) => {
      if (!fini && x) setM(x);
    });
    const ecoute = (e: Event) => setM((e as CustomEvent<MesFigurinesDuMois>).detail);
    window.addEventListener(EVT_MOIS, ecoute);
    return () => {
      fini = true;
      window.removeEventListener(EVT_MOIS, ecoute);
    };
  }, []);
  const annoncer = useCallback((x: MesFigurinesDuMois) => window.dispatchEvent(new CustomEvent(EVT_MOIS, { detail: x })), []);
  return [m, annoncer];
}

/** 🧭 Le parcours, en trois temps (et les commerçants, en plus). */
export function CommentCaMarche() {
  return (
    <section className="fm-comment" aria-label="Comment ça marche">
      <b className="fm-comment-titre">Comment ça marche ?</b>
      <ol>
        <li>
          <span aria-hidden="true">📸</span>
          <p>
            <b>Ta figurine, c’est toi.</b> Elle parle, change d’expression, danse.
          </p>
        </li>
        <li>
          <span aria-hidden="true">💬</span>
          <p>
            <b>Chaque jour, elle rencontre quelqu’un.</b> Tu regardes, tu réagis : tu te découvres.
          </p>
        </li>
        <li>
          <span aria-hidden="true">🗓️</span>
          <p>
            <b>Chaque mois vécu, une nouvelle figurine de toi</b> : la tenue du mois, un nouveau visage, et ta phrase du mois.
          </p>
        </li>
      </ol>
      <small>🏪 En plus : les commerçants partenaires t’offrent leur figurine, et leurs bons plans avant tout le monde.</small>
    </section>
  );
}

/** Les dix jours, en points : ceux qu'il a vécus ce mois-ci. */
function Jours({ f }: { f: FigurineDuMois }) {
  return (
    <span className="fm-jours" role="progressbar" aria-valuemin={0} aria-valuemax={f.objectif} aria-valuenow={Math.min(f.jours, f.objectif)} aria-label="Tes jours de rencontres ce mois-ci">
      {Array.from({ length: f.objectif }, (_, k) => (
        <i key={k} className={k < f.jours ? "vecu" : ""} />
      ))}
    </span>
  );
}

/** Dans « Ma figurine » : où il en est, en une ligne. */
export function ApercuDuMois() {
  const [m] = useMois();
  if (!m) return null;
  const f = m.courante;
  return (
    <a className="fm-apercu" href="#mois">
      <span aria-hidden="true">{f.edition.emoji}</span>
      <span>
        <b>{f.etat === "prete" ? `Ta figurine de ${moisEnClair(f.mois).replace(/\s\d{4}$/, "")} est arrivée !` : `Ta figurine de ${moisEnClair(f.mois).replace(/\s\d{4}$/, "")}`}</b>
        {f.etat !== "prete" && <Jours f={f} />}
        <small>{f.etat === "prete" ? "Sa tenue, son visage et ta phrase du mois" : `${Math.min(f.jours, f.objectif)}/${f.objectif} jours de rencontres`}</small>
      </span>
      <em>Voir ›</em>
    </a>
  );
}

/** La carte d'une figurine du mois, prête : son image, son thème, son visage, sa phrase. */
function CarteDuMois({ f, nouvelle = false }: { f: FigurineDuMois; nouvelle?: boolean }) {
  return (
    <div className={`fm-carte${nouvelle ? " nouvelle" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {f.image && <img src={f.image} alt={`Ta figurine de ${moisEnClair(f.mois)}`} />}
      <span className="fm-carte-bas">
        <small>
          {f.edition.emoji} {f.edition.nom} · {moisEnClair(f.mois)}
        </small>
        {f.expression && <b>Son visage du mois : {f.expression}</b>}
      </span>
    </div>
  );
}

/** Dans « Ce mois-ci » : sa figurine du mois — à mériter, en fabrication, ou là. */
export function MaFigurineDuMois() {
  const [m, setM] = useMois();
  const [erreur, setErreur] = useState("");
  const [essai, setEssai] = useState(0);
  const etat = m?.courante.etat;
  // MÉRITÉE : elle se fabrique (une minute environ ; une autre page peut déjà la faire : on attend)
  useEffect(() => {
    if (etat !== "a-fabriquer") return;
    let fini = false;
    (async () => {
      for (let k = 0; k < 8 && !fini; k++) {
        const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "mois" }) }).catch(() => null);
        const j = (await r?.json().catch(() => ({}))) as { mois?: MesFigurinesDuMois; enCours?: boolean; error?: string } | undefined;
        if (fini) return;
        if (j?.mois) setM(j.mois);
        if (j?.mois?.courante.etat === "prete") return;
        // (un refus ou une panne du moteur : on s'arrête — chaque essai coûte ; « Réessayer » relance)
        if (j?.error) return setErreur(j.error);
        await new Promise((ok) => window.setTimeout(ok, j?.enCours ? 15_000 : 5_000));
      }
      if (!fini) setErreur("Elle prend plus de temps que prévu. Réessaie dans un instant.");
    })();
    return () => {
      fini = true;
    };
  }, [etat, essai, setM]);
  if (!m) return null;
  const f = m.courante;
  const nom = moisEnClair(f.mois).replace(/\s\d{4}$/, "");
  return (
    <section className="fm" aria-label="Ta figurine du mois">
      <header className="fm-tete">
        <small>🗓️ TA FIGURINE DU MOIS</small>
        <b>
          Ta figurine de {nom} {f.edition.emoji}
        </b>
      </header>
      {f.etat === "prete" ? (
        <>
          <CarteDuMois f={f} nouvelle />
          {f.phrase && (
            <p className="fm-phrase">
              <small>🔮 TA PHRASE DU MOIS</small>« {f.phrase} »
            </p>
          )}
        </>
      ) : f.etat === "a-fabriquer" ? (
        <div className="fm-fab" aria-live="polite">
          <b>✨ Méritée ! On l’habille pour « {f.edition.nom} »…</b>
          <span className="fm-fab-jauge">
            <i />
          </span>
          <small>Une minute environ : sa tenue du mois, son visage du mois ({f.expression}), et ta phrase du mois.</small>
          {erreur && (
            <>
              <p className="tf-erreur" role="alert">
                {erreur}
              </p>
              <button
                type="button"
                className="mp-bouton"
                onClick={() => {
                  setErreur("");
                  setEssai((n) => n + 1);
                }}
              >
                🔁 Réessayer
              </button>
            </>
          )}
        </div>
      ) : f.sansFigurine ? (
        <div className="fm-gagner">
          <p>Crée d’abord ta figurine : ensuite, chaque mois vécu t’en donne une nouvelle.</p>
          <a className="og-go" href="#figurine">
            📸 Je crée ma figurine
          </a>
        </div>
      ) : (
        <div className="fm-gagner">
          <Jours f={f} />
          <b>
            {Math.min(f.jours, f.objectif)}/{f.objectif} jours de rencontres ce mois-ci
          </b>
          <p>
            Encore {f.objectif - f.jours} jour{f.objectif - f.jours > 1 ? "s" : ""} : ta figurine de {nom} arrive, habillée « {f.edition.nom} » {f.edition.emoji}, avec un nouveau visage ({f.expression}) et ta
            phrase du mois.
          </p>
          <a className="fm-lien" href="#rencontre">
            💬 Ma rencontre du jour ›
          </a>
        </div>
      )}
    </section>
  );
}

/** 📒 Dans l'album : la collection de soi, mois après mois. */
export function MesFigurinesDuMois() {
  const [m] = useMois();
  if (!m || m.courante.sansFigurine) return null;
  const toutes = [m.courante, ...m.passees];
  return (
    <section className="fm-album" aria-label="Mes figurines du mois">
      <h3>🗓️ Mes figurines du mois</h3>
      <small>Une par mois vécu : tu vois ton année, et comment tu changes.</small>
      <div className="fm-grille">
        {toutes.map((f) =>
          f.etat === "prete" ? (
            <CarteDuMois key={f.mois} f={f} />
          ) : (
            <a key={f.mois} className="fm-case" href="#mois">
              <span aria-hidden="true">{f.edition.emoji}</span>
              <b>{moisEnClair(f.mois)}</b>
              <small>
                {Math.min(f.jours, f.objectif)}/{f.objectif} jours
              </small>
            </a>
          ),
        )}
      </div>
    </section>
  );
}

export const STYLES_FIGURINE_DU_MOIS = `
.fm,.fm-album,.fm-apercu{margin-top:14px}
.fm-comment{display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:24px;background:linear-gradient(160deg,rgba(255,46,154,.14),rgba(142,197,255,.08));border:1px solid rgba(255,255,255,.14)}
.fm-comment-titre{font-size:16px;font-weight:900}
.fm-comment ol{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}
.fm-comment li{display:flex;gap:10px;align-items:flex-start}
.fm-comment li > span{flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:12px;background:rgba(0,0,0,.25);font-size:18px}
.fm-comment li p{margin:0;font-size:14px;line-height:1.4;color:#E8D3DC}
.fm-comment li p b{color:#FFF4E6}
.fm-comment > small{font-size:12.5px;line-height:1.4;color:#A88E99}
.fm-apercu{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:20px;background:rgba(242,196,107,.1);border:1.5px solid rgba(242,196,107,.45);color:#FFF4E6;text-decoration:none}
.fm-apercu > span:first-child{font-size:28px}
.fm-apercu > span:nth-child(2){flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.fm-apercu b{font-size:14.5px;font-weight:900}
.fm-apercu small{font-size:12px;color:#D9C3CB}
.fm-apercu em{font-style:normal;font-size:13px;font-weight:900;color:#F2C46B}
.fm-jours{display:flex;gap:4px}
.fm-jours i{flex:1;max-width:22px;height:8px;border-radius:999px;background:rgba(255,255,255,.14)}
.fm-jours i.vecu{background:linear-gradient(90deg,#FF2E9A,#F2C46B)}
.fm{display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:26px;background:radial-gradient(90% 60% at 50% 0%,rgba(242,196,107,.18),transparent 70%),rgba(255,255,255,.05);border:1.5px solid rgba(242,196,107,.5)}
.fm-tete{display:flex;flex-direction:column;gap:2px}
.fm-tete small{font-size:10.5px;font-weight:900;letter-spacing:.12em;color:#F2C46B}
.fm-tete b{font-size:21px;font-weight:900;line-height:1.15}
.fm-gagner{display:flex;flex-direction:column;gap:8px}
.fm-gagner > b{font-size:15px;font-weight:900}
.fm-gagner p{margin:0;font-size:14px;line-height:1.45;color:#E8D3DC}
.fm-lien{align-self:flex-start;font-size:14px;font-weight:900;color:#FF9FD2;text-decoration:none}
.fm-fab{display:flex;flex-direction:column;gap:8px}
.fm-fab b{font-size:15px}
.fm-fab small{font-size:12.5px;color:#D9C3CB}
.fm-fab-jauge{display:block;height:8px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden}
.fm-fab-jauge i{display:block;width:40%;height:100%;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B);animation:fm-va 1.4s ease-in-out infinite}
.fm-carte{position:relative;display:flex;flex-direction:column;border-radius:22px;overflow:hidden;border:2px solid rgba(242,196,107,.65);background:#1E0918;box-shadow:0 22px 40px -22px rgba(242,196,107,.7)}
.fm-carte img{display:block;width:100%;aspect-ratio:2/3;object-fit:cover}
.fm-carte-bas{display:flex;flex-direction:column;gap:2px;padding:10px 12px}
.fm-carte-bas small{font-size:12px;font-weight:800;color:#F2C46B}
.fm-carte-bas b{font-size:13.5px;color:#FFF4E6}
.fm-carte.nouvelle{animation:fm-arrive .9s cubic-bezier(.2,1.4,.4,1) both;max-width:340px;margin:0 auto;width:100%}
.fm-phrase{margin:0;padding:14px 16px;border-radius:18px;background:rgba(142,197,255,.1);border:1px solid rgba(142,197,255,.4);font-size:16px;line-height:1.45;font-weight:700;color:#FFF4E6}
.fm-phrase small{display:block;margin-bottom:4px;font-size:10.5px;font-weight:900;letter-spacing:.12em;color:#A8C8F0}
.fm-album{display:flex;flex-direction:column;gap:8px}
.fm-album h3{margin:0;font-size:18px;font-weight:900}
.fm-album > small{font-size:13px;color:#D9C3CB}
.fm-grille{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.fm-case{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;aspect-ratio:2/3.4;border-radius:22px;border:2px dashed rgba(255,255,255,.2);background:rgba(255,255,255,.04);color:#FFF4E6;text-decoration:none;text-align:center;padding:10px}
.fm-case span{font-size:34px;filter:grayscale(.4)}
.fm-case b{font-size:13.5px}
.fm-case small{font-size:12px;color:#A88E99}
@media (min-width:860px){.fm-grille{grid-template-columns:repeat(4,minmax(0,1fr))}}
@keyframes fm-va{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}
@keyframes fm-arrive{from{opacity:0;transform:rotateY(80deg) scale(.8)}}
@media (prefers-reduced-motion:reduce){.fm-fab-jauge i,.fm-carte.nouvelle{animation:none}}
`;
