"use client";

/**
 * 📚 L'ÉTAGÈRE, À L'ÉCRAN — lot E1 « Noté ! » (`lib/direct/etagere.ts` pour les règles ; le cahier :
 * `docs/univers/etagere.md` ; la maquette validée : `docs/univers/maquettes/etagere.html`).
 *
 *   · `useEtagere` : dans la conversation, ce que leurs figurines ont noté (relu avec la conversation vivante) ; un objet
 *     qu'il n'a pas encore vu se poser s'envole — la figurine de celui qui l'a dit brandit « 📌 Noté ! », l'emoji vole
 *     jusqu'à l'étagère au mur, se pose, la carte apparaît dans le fil, et l'autre figurine dit une phrase. Une fois par
 *     personne ; trois envols au plus d'affilée (les autres se posent sans vol) ; sans mouvement si le téléphone le
 *     demande (`prefers-reduced-motion`) ;
 *   · `MurEtagere` : la planche en haut de la scène, les cinq derniers, « 📚 Votre étagère · 6 » ;
 *   · `PastilleEtagere` : « 📚 6 », dans l'en-tête de la conversation ;
 *   · `CarteNote` : « 📌 NOTÉ SUR VOTRE ÉTAGÈRE », dans le fil ;
 *   · `PageEtagere` : « Votre étagère » (les trois rayons, les règles, la pause) ; `FicheObjet` : un souvenir en grand
 *     (la phrase exacte, qui l'a dite, quand ; changer la date ; le retirer, pour les deux).
 *
 * LE MOT : à l'écran, « souvenir » ; dans le code, `objet`.
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Feuille } from "./ma-figurine";
import { RAYONS, REGLES_ETAGERE, ecartJours, jourDe, momentCourt, phraseDeNote, type EtagereScene, type EtagereVue, type ObjetVu } from "@/lib/direct/etagere";

const ROUTE = "/api/direct/etagere";
async function agir(corps: Record<string, unknown>): Promise<void> {
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok || j.error) throw new Error(j.error || "Ça n’a pas marché. Réessaie.");
}
const calme = () => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};
const aujourdhui = () => jourDe(Date.now());

/** Ce qui se joue par-dessus une figurine pendant qu'un objet se pose. */
export type JeuEtagere = { note: { qui: "moi" | "lui"; n: string } | null; bulle: { qui: "moi" | "lui"; texte: string; n: string } | null };

/**
 * 📌 L'ÉTAGÈRE DANS LA CONVERSATION : les objets (sans ceux qu'il vient de retirer), ceux qui attendent de s'envoler,
 * l'envol en cours ; `retirer` (pour les deux, tout de suite).
 */
export function useEtagere(cle: string, scene: EtagereScene | undefined, refScene: RefObject<HTMLElement | null>) {
  const [retires, setRetires] = useState<ReadonlySet<string>>(() => new Set());
  const [poses, setPoses] = useState<ReadonlySet<string>>(() => new Set());
  const [vol, setVol] = useState("");
  const [arrive, setArrive] = useState("");
  const [jeu, setJeu] = useState<JeuEtagere>({ note: null, bulle: null });
  const envols = useRef(0);
  const enCours = useRef(false);
  const derniere = useRef("");
  const minuteurs = useRef<number[]>([]);
  const plusTard = (ms: number, f: () => void) => minuteurs.current.push(window.setTimeout(f, ms));
  useEffect(() => () => minuteurs.current.forEach((t) => window.clearTimeout(t)), []);

  const objets = (scene?.objets ?? []).filter((o) => !retires.has(o.id));
  const attente = (scene?.nouveaux ?? []).filter((id) => !poses.has(id) && objets.some((o) => o.id === id));
  const cleAttente = attente.join(",");

  const poser = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;
      setPoses((p) => new Set([...p, ...ids]));
      void agir({ action: "vu", avec: cle, ids }).catch(() => undefined);
    },
    [cle],
  );

  useEffect(() => {
    if (enCours.current || !cleAttente) return;
    const ids = cleAttente.split(",");
    // (sans mouvement, ou déjà trois envols : ils se posent sans vol)
    if (calme() || envols.current >= 3) return void Promise.resolve().then(() => poser(ids));
    const o = (scene?.objets ?? []).find((x) => x.id === ids[0]);
    if (!o) return;
    enCours.current = true;
    envols.current += 1;
    const qui = o.de;
    const autre = qui === "moi" ? "lui" : "moi";
    void Promise.resolve().then(() => setJeu((j) => ({ ...j, note: { qui, n: o.id } })));
    plusTard(700, () => {
      setVol(o.id);
      // (le vol : de la figurine de celui qui l'a dit jusqu'à sa place sur l'étagère)
      window.requestAnimationFrame(() => {
        const sc = refScene.current;
        const depart = sc?.querySelector(`.pv-calque.${qui}`);
        const cible = sc?.querySelector(`.et-mur [data-objet="${o.id}"]`);
        const fin = () => {
          setVol("");
          setArrive(o.id);
          poser([o.id]);
          plusTard(500, () => {
            const texte = phraseDeNote(o.genre, o.id, derniere.current);
            derniere.current = texte;
            setJeu({ note: null, bulle: { qui: autre, texte, n: o.id } });
          });
          plusTard(5200, () => {
            setJeu((j) => (j.bulle?.n === o.id ? { ...j, bulle: null } : j));
            setArrive("");
            enCours.current = false;
            // (le suivant, s'il y en a)
            setPoses((p) => new Set(p));
          });
        };
        if (!sc || !depart || !cible) return fin();
        // (par-dessus tout l'écran : rien ne le coupe en route)
        const a = depart.getBoundingClientRect();
        const b = cible.getBoundingClientRect();
        const x0 = a.left + a.width * 0.42;
        const y0 = a.top + a.height * 0.35;
        const x1 = b.left;
        const y1 = b.top;
        const v = document.createElement("span");
        v.className = "et-vol";
        v.textContent = o.emoji;
        v.setAttribute("aria-hidden", "true");
        document.body.appendChild(v);
        const anim = v.animate(
          [
            { transform: `translate(${x0}px,${y0}px) scale(.5)`, opacity: 0 },
            { transform: `translate(${x0}px,${y0 - 34}px) scale(1.6)`, opacity: 1, offset: 0.25 },
            { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 40}px) scale(1.3)`, opacity: 1, offset: 0.6 },
            { transform: `translate(${x1}px,${y1}px) scale(.85)`, opacity: 1 },
          ],
          { duration: 1100, easing: "cubic-bezier(.35,.6,.4,1)", fill: "forwards" },
        );
        anim.onfinish = () => {
          v.remove();
          fin();
        };
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleAttente, poses]);

  const retirer = useCallback(
    async (id: string) => {
      await agir({ action: "retirer", avec: cle, id });
      setRetires((r) => new Set([...r, id]));
    },
    [cle],
  );
  /** (retiré ailleurs — la page : il s'en va d'ici aussi) */
  const oublier = useCallback((id: string) => setRetires((r) => new Set([...r, id])), []);
  return { objets, attente: new Set(attente.filter((id) => id !== vol)), vol, arrive, jeu, retirer, oublier, pause: scene?.pause ?? null };
}

/** 📚 La planche, en haut de la scène : les cinq derniers posés ; « 📚 Votre étagère · 6 ». Vide : rien. */
export function MurEtagere({ objets, attente, vol, arrive, onOuvrir }: { objets: ObjetVu[]; attente: ReadonlySet<string>; vol: string; arrive: string; onOuvrir: () => void }) {
  const la = objets.filter((o) => !attente.has(o.id) || o.id === vol);
  const n = la.filter((o) => o.id !== vol).length;
  if (!la.length) return null;
  return (
    <button type="button" className="et-mur" onClick={onOuvrir} aria-label={`Votre étagère : ${n} souvenir${n > 1 ? "s" : ""}`}>
      <span className="et-rang">
        {la.slice(-5).map((o) => (
          <span key={o.id} data-objet={o.id} className={o.id === vol ? "vient" : o.id === arrive ? "arrive" : ""}>
            {o.emoji}
          </span>
        ))}
      </span>
      <span className="et-planche" aria-hidden="true" />
      <small>📚 Votre étagère · {n}</small>
    </button>
  );
}

/** « 📚 6 », dans l'en-tête de la conversation. */
export function PastilleEtagere({ n, onOuvrir }: { n: number; onOuvrir: () => void }) {
  if (!n) return null;
  return (
    <button type="button" className="et-pastille" onClick={onOuvrir} aria-label={`Votre étagère : ${n} souvenir${n > 1 ? "s" : ""}`}>
      📚 <span>{n}</span>
    </button>
  );
}

/** 📌 La carte dans le fil, visible des deux, à l'heure où c'est noté. */
export function CarteNote({ o, prenom, onVoir, onRetirer }: { o: ObjetVu; prenom: string; onVoir: () => void; onRetirer: () => void }) {
  return (
    <li className="et-carte-fil" data-objet={o.id}>
      <div>
        <b className="et-entete">📌 NOTÉ SUR VOTRE ÉTAGÈRE</b>
        <span className="et-objet">
          <span className="et-e" aria-hidden="true">
            {o.emoji}
          </span>
          <span>
            <b>{o.titre}</b>
            <small>{o.detail}</small>
          </span>
        </span>
        <span className="et-actions">
          <button type="button" onClick={onVoir}>
            Voir l’étagère
          </button>
          <button type="button" className="doux" onClick={onRetirer}>
            Retirer
          </button>
        </span>
        <small className="et-pied">Noté par vos figurines · IA · visible de {prenom} et toi</small>
      </div>
    </li>
  );
}

/** 🔎 Un souvenir en grand : la phrase exacte, qui l'a dite, quand ; changer la date ; le retirer, pour les deux. */
export function FicheObjet({ o, prenom, onFermer, onRetirer, onDate }: { o: ObjetVu | null; prenom: string; onFermer: () => void; onRetirer: (o: ObjetVu) => Promise<void>; onDate: (o: ObjetVu, quand: string) => Promise<void> }) {
  const [changer, setChanger] = useState(false);
  const [quand, setQuand] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");
  const id = o?.id ?? "";
  useEffect(() => {
    void Promise.resolve().then(() => {
      setChanger(false);
      setErreur("");
      setQuand("");
    });
  }, [id]);
  const faire = async (f: () => Promise<void>) => {
    setOccupe(true);
    setErreur("");
    try {
      await f();
    } catch (e) {
      setErreur((e as Error).message || "Ça n’a pas marché. Réessaie.");
    } finally {
      setOccupe(false);
    }
  };
  const avenir = Boolean(o?.quand) && ecartJours(aujourdhui(), o?.quand ?? "") >= 0 && o?.etat === "actif";
  return (
    <Feuille ouverte={Boolean(o)} onFermer={onFermer} titre={o ? o.titre : "Un souvenir"} className="et-feuille">
      {o && (
        <div className="et-fiche">
          <span className="et-e" aria-hidden="true">
            {o.emoji}
          </span>
          <b className="et-fiche-titre">{o.titre}</b>
          <small className="et-fiche-detail">{o.detail}</small>
          <blockquote>
            « {o.citation} »<cite>Dit par {o.de === "moi" ? "toi" : o.ditPar} · {momentCourt(o.ditLe)}</cite>
          </blockquote>
          <small className="et-pied">Noté par vos figurines · IA · visible de {prenom} et toi</small>
          {o.genre === "date" && avenir && <p className="et-note-douce">⏰ Ta figurine te le rappellera le jour venu, au moment de ton humeur du matin.</p>}
          {o.genre === "gout" && <p className="et-note-douce">🎁 Une idée de cadeau, quand le moment viendra.</p>}
          {o.etat === "fierte" && <p className="et-note-douce">🏆 Rangé tout en haut, avec vos fiertés.</p>}
          {(o.genre === "date" || o.genre === "promesse") && o.etat === "actif" && o.quand && (
            <>
              {changer ? (
                <span className="et-date">
                  <input type="date" aria-label="Le nouveau jour" min={aujourdhui()} value={quand} onChange={(e) => setQuand(e.target.value)} />
                  <button type="button" className="et-bouton" disabled={!quand || occupe} onClick={() => void faire(async () => (await onDate(o, quand), setChanger(false)))}>
                    Garder ce jour
                  </button>
                </span>
              ) : (
                <button type="button" className="et-bouton clair" onClick={() => (setQuand(o.quand ?? ""), setChanger(true))}>
                  📅 Changer la date
                </button>
              )}
            </>
          )}
          <button type="button" className="et-bouton clair" disabled={occupe} onClick={() => void faire(() => onRetirer(o))}>
            Retirer de l’étagère
          </button>
          {erreur && (
            <p className="et-erreur" role="alert">
              {erreur}
            </p>
          )}
        </div>
      )}
    </Feuille>
  );
}

/**
 * 📚 « VOTRE ÉTAGÈRE » : « Léa et toi » ; les compteurs ; le meuble et ses trois rayons (« Nos fiertés », « À venir »,
 * « Ce qu'on aime ») ; les règles en clair ; la pause. Un toucher sur un souvenir : sa fiche.
 */
export function PageEtagere({ cle, onFermer, onRetire }: { cle: string; onFermer: () => void; onRetire?: (id: string) => void }) {
  const [vue, setVue] = useState<EtagereVue | null>(null);
  const [erreur, setErreur] = useState("");
  const [fiche, setFiche] = useState<ObjetVu | null>(null);
  const [info, setInfo] = useState("");
  const [tour, setTour] = useState(0);
  useEffect(() => {
    let fini = false;
    fetch(`${ROUTE}?avec=${cle}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { etagere?: EtagereVue; error?: string }) => {
        if (fini) return;
        if (j.etagere) setVue(j.etagere);
        else setErreur(j.error || "Votre étagère ne s’ouvre pas. Réessaie.");
      })
      .catch(() => !fini && setErreur("Votre étagère ne s’ouvre pas. Réessaie."));
    return () => {
      fini = true;
    };
  }, [cle, tour]);
  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector(".et-feuille.ouverte") && onFermer();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [onFermer]);
  async function retirer(o: ObjetVu) {
    await agir({ action: "retirer", avec: cle, id: o.id });
    setFiche(null);
    setInfo(`${o.emoji} Retiré de votre étagère, pour vous deux`);
    onRetire?.(o.id);
    setTour((t) => t + 1);
  }
  async function dater(o: ObjetVu, quand: string) {
    await agir({ action: "date", avec: cle, id: o.id, quand });
    setFiche(null);
    setInfo(`📅 C’est noté : ${o.titre.charAt(0).toLowerCase()}${o.titre.slice(1)}, à la nouvelle date`);
    setTour((t) => t + 1);
  }
  async function pause(oui: boolean) {
    try {
      await agir({ action: "pause", avec: cle, oui });
      setInfo(oui ? "⏸️ En pause : vos figurines ne notent plus rien entre vous deux." : "▶️ C’est reparti : vos figurines notent de nouveau.");
      setTour((t) => t + 1);
    } catch (e) {
      setErreur((e as Error).message);
    }
  }
  const objets = vue?.objets ?? [];
  const blague = objets.find((o) => o.genre === "blague");
  const rayon = (cleRayon: string) => {
    const l = objets.filter((o) => o.rayon === cleRayon);
    // (« À venir » : la plus proche d'abord ; « Ce qu'on aime » : le plus récent d'abord)
    if (cleRayon === "avenir") return l.sort((a, b) => (a.quand ?? "9999").localeCompare(b.quand ?? "9999"));
    return l.sort((a, b) => b.le.localeCompare(a.le));
  };
  const contenu = (
    <div className="et-page" role="dialog" aria-modal="true" aria-label={vue ? `Votre étagère, ${vue.prenom} et toi` : "Votre étagère"}>
      <header className="et-tete">
        <button type="button" className="et-retour" aria-label="Revenir à la conversation" onClick={onFermer}>
          ←
        </button>
        <span className="et-qui">
          <b>{vue ? `${vue.prenom} et toi` : "Votre étagère"}</b>
          <small>Votre étagère</small>
        </span>
        {vue?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="et-avatar" src={vue.image} alt="" draggable={false} />
        )}
      </header>
      {!vue && !erreur && (
        <div className="mc-attente">
          <i />
        </div>
      )}
      {erreur && (
        <p className="et-erreur" role="alert">
          {erreur}
        </p>
      )}
      {vue && (
        <>
          <div className="et-compteurs">
            <div>
              <b>{objets.length}</b>
              <span>souvenir{objets.length > 1 ? "s" : ""}</span>
            </div>
            <div>
              <b>{vue.tenues}</b>
              <span>promesse{vue.tenues > 1 ? "s" : ""} tenue{vue.tenues > 1 ? "s" : ""}</span>
            </div>
            <div>
              <b>{blague ? blague.emoji : "–"}</b>
              <span>{blague ? "votre blague" : "pas de blague"}</span>
            </div>
          </div>
          <div className="et-meuble">
            {RAYONS.map((r) => {
              const l = rayon(r.cle);
              return (
                <div key={r.cle} className="et-rayon" data-rayon={r.cle}>
                  <span className="et-nom-rayon">{r.nom}</span>
                  {l.length ? (
                    l.map((o) => (
                      <button key={o.id} type="button" className={`et-objet-rayon${o.etat === "fierte" ? " haut" : ""}`} data-objet={o.id} onClick={() => setFiche(o)} aria-label={`${o.titre}, ${o.detail}`}>
                        <span className="et-e" aria-hidden="true">
                          {o.emoji}
                        </span>
                        <span className="et-etiquette">{o.titre}</span>
                        {o.etat === "tenue" && <i className="et-tenue">✓</i>}
                      </button>
                    ))
                  ) : (
                    <span className="et-rien">rien encore</span>
                  )}
                </div>
              );
            })}
          </div>
          {info && (
            <p className="et-info" role="status">
              {info}
            </p>
          )}
          <p className="et-regles">{REGLES_ETAGERE}</p>
          <div className="et-reglage">
            {vue.pause ? (
              vue.pause.moi ? (
                <button type="button" className="et-bouton clair" onClick={() => void pause(false)}>
                  ▶️ Relancer l’étagère
                </button>
              ) : (
                <p className="et-pause-autre">⏸️ {vue.prenom} a mis l’étagère en pause.</p>
              )
            ) : (
              <button type="button" className="et-lien" onClick={() => void pause(true)}>
                ⚙️ Mettre l’étagère en pause
              </button>
            )}
          </div>
        </>
      )}
      <FicheObjet o={fiche} prenom={vue?.prenom ?? ""} onFermer={() => setFiche(null)} onRetirer={retirer} onDate={dater} />
    </div>
  );
  return typeof document === "undefined" ? null : createPortal(contenu, document.body);
}

export const STYLES_ETAGERE = `
.et-mur{position:absolute;top:10px;left:50%;z-index:4;translate:-50% 0;display:flex;flex-direction:column;align-items:center;gap:3px;border:0;background:none;padding:0;cursor:pointer;font:inherit;-webkit-tap-highlight-color:transparent}
.et-rang{display:flex;align-items:flex-end;justify-content:center;gap:5px;min-width:132px;height:32px;padding:0 10px}
.et-rang span{font-size:24px;line-height:1;filter:drop-shadow(0 3px 2px rgba(0,0,0,.5))}
.et-rang span.vient{visibility:hidden}
.et-rang span.arrive{animation:et-pose .5s cubic-bezier(.2,.8,.3,1.5)}
.et-planche{width:100%;height:7px;border-radius:2px;background:linear-gradient(180deg,#a5683a,#6b3f1f);box-shadow:0 5px 8px -3px rgba(0,0,0,.7)}
.pr-scene.avec-etagere:not(.chez){padding-top:64px}
.pr-scene.avec-etagere:not(.chez) .pv-calque{top:64px}
.et-mur small{margin-top:3px;padding:2px 8px;border-radius:999px;background:rgba(18,6,15,.62);font-size:11px;font-weight:800;color:#F2C46B;white-space:nowrap}
.et-vol{position:fixed;left:0;top:0;z-index:90;font-size:30px;line-height:1;pointer-events:none;filter:drop-shadow(0 4px 4px rgba(0,0,0,.5))}
.et-pastille{flex:none;display:inline-flex;align-items:center;gap:5px;padding:7px 11px;border:1px solid rgba(242,196,107,.45);border-radius:999px;background:rgba(242,196,107,.12);color:#F2C46B;font:inherit;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap}
.pv-calque .et-note{position:absolute;left:50%;top:0;z-index:4;translate:-50% 0;padding:7px 12px;border-radius:9px;background:#F2C46B;color:#2A1220;font-size:16px;font-weight:900;white-space:nowrap;box-shadow:0 0 0 3px #2A1220,0 10px 22px rgba(0,0,0,.4);animation:pv-brandit 2.6s cubic-bezier(.2,1.4,.4,1) both}
.pv-calque .et-note::after{content:"";position:absolute;left:50%;top:100%;width:5px;height:30px;margin-left:-2.5px;border-radius:3px;background:#8A5A2B}
.pv-calque .et-bulle{animation-duration:4.8s}
.pr-fil li.et-carte-fil{justify-content:center}
.pr-fil li.et-carte-fil > div{display:flex;flex-direction:column;gap:7px;width:min(94%,430px);padding:11px 13px;border-radius:18px;background:rgba(242,196,107,.1);border:1px dashed rgba(242,196,107,.55);animation:et-monte .4s ease-out both}
.et-entete{font-size:12px;font-weight:900;letter-spacing:.04em;color:#F2C46B}
.et-objet{display:flex;align-items:center;gap:10px}
.et-objet .et-e{font-size:30px;line-height:1}
.et-objet b{display:block;font-size:15.5px;line-height:1.25}
.et-objet small{display:block;font-size:13px;color:#CDB4C0}
.et-actions{display:flex;flex-wrap:wrap;gap:14px}
.et-actions button,.et-lien{border:0;background:none;padding:0;color:#F2C46B;font:inherit;font-size:13px;font-weight:800;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.et-actions button.doux{color:#9C8592}
.et-pied{font-size:11px;color:#8F7884}
.et-page{position:fixed;inset:0;z-index:70;display:flex;flex-direction:column;gap:12px;max-width:560px;margin:0 auto;padding:calc(8px + env(safe-area-inset-top)) 16px calc(20px + env(safe-area-inset-bottom));box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;color:#FFF4E6;background:#1E0C18;font-family:var(--font-clikme),Poppins,system-ui,sans-serif}
.et-tete{display:flex;align-items:center;gap:10px;min-height:52px}
.et-retour{flex:none;width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#FFF4E6;font-size:20px;font-weight:800;cursor:pointer}
.et-qui{flex:1;min-width:0;display:flex;flex-direction:column}
.et-qui b{font-size:17px;font-weight:900;line-height:1.2}
.et-qui small{font-size:12.5px;color:#BFA6B3}
.et-avatar{flex:none;width:44px;height:44px;border-radius:50%;object-fit:cover;object-position:50% 12%;background:#3a1630}
.et-compteurs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.et-compteurs div{padding:10px 6px;border-radius:16px;background:rgba(255,255,255,.055);text-align:center}
.et-compteurs b{display:block;font-size:22px;font-weight:900;line-height:1.15;font-variant-numeric:tabular-nums}
.et-compteurs span{font-size:11.5px;font-weight:600;color:#BFA6B3}
.et-meuble{position:relative;padding:12px 12px 4px;border-radius:14px;background:linear-gradient(180deg,#3d2412,#2a170b);border:6px solid #4d2e16;box-shadow:inset 0 0 40px rgba(0,0,0,.6),0 20px 30px -18px rgba(0,0,0,.9)}
.et-meuble::before{content:"";position:absolute;inset:0;border-radius:8px;background:radial-gradient(ellipse at 50% -10%,rgba(255,214,140,.32),transparent 65%);pointer-events:none}
.et-rayon{position:relative;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-around;gap:6px 4px;min-height:104px;padding:16px 2px 18px}
.et-rayon::after{content:"";position:absolute;left:-12px;right:-12px;bottom:6px;height:12px;background:linear-gradient(180deg,#a5683a,#6b3f1f);box-shadow:0 6px 8px -3px rgba(0,0,0,.7)}
.et-nom-rayon{position:absolute;left:0;top:-2px;font-family:var(--font-main-levee),"Caveat",cursive;font-size:17px;color:rgba(251,240,217,.6)}
.et-objet-rayon{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:3px;width:31%;max-width:110px;border:0;background:none;padding:12px 0 0;color:inherit;font:inherit;cursor:pointer}
.et-objet-rayon .et-e{font-size:40px;line-height:1;filter:drop-shadow(0 5px 3px rgba(0,0,0,.55));transition:transform .2s}
.et-objet-rayon:active .et-e{transform:scale(1.12) rotate(-4deg)}
.et-objet-rayon.haut .et-e{filter:drop-shadow(0 0 12px rgba(255,214,140,.8)) drop-shadow(0 5px 3px rgba(0,0,0,.55))}
.et-etiquette{max-width:100%;padding:1px 7px 2px;border-radius:3px;background:#fbf0d9;color:#2b1a0c;font-family:var(--font-main-levee),"Caveat",cursive;font-size:17px;font-weight:600;line-height:1.05;text-align:center;rotate:-2deg;box-shadow:0 2px 3px rgba(0,0,0,.4);overflow-wrap:anywhere}
.et-objet-rayon:nth-child(2n) .et-etiquette{rotate:2deg}
.et-tenue{position:absolute;top:6px;right:14%;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#3DDC84;color:#0f2a19;font-size:12px;font-style:normal;font-weight:900}
.et-rien{align-self:center;font-family:var(--font-main-levee),"Caveat",cursive;font-size:19px;color:rgba(251,240,217,.42)}
.et-regles{margin:2px 2px 0;font-size:12.5px;line-height:1.5;color:#9C8592}
.et-reglage{display:flex;justify-content:center;padding-top:4px}
.et-pause-autre{margin:0;font-size:13.5px;color:#BFA6B3}
.et-info{margin:0;padding:10px 12px;border-radius:14px;background:rgba(242,196,107,.12);color:#F2C46B;font-size:13.5px;font-weight:700}
.et-erreur{margin:0;color:#FFB4A8;font-size:13.5px}
.et-feuille .tf-feuille-corps{z-index:80}
.et-feuille{z-index:80}
.et-fiche{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding-bottom:6px}
.et-fiche .et-e{font-size:64px;line-height:1.1;filter:drop-shadow(0 8px 6px rgba(0,0,0,.5))}
.et-fiche-titre{font-size:20px;font-weight:900;line-height:1.2}
.et-fiche-detail{font-size:14px;color:#CDB4C0}
.et-fiche blockquote{align-self:stretch;margin:8px 0 2px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.06);font-size:15px;font-style:italic}
.et-fiche cite{display:block;margin-top:4px;font-size:12.5px;font-style:normal;color:#BFA6B3}
.et-note-douce{align-self:stretch;margin:6px 0 0;padding:10px 12px;border-radius:12px;background:rgba(242,196,107,.1);color:#F2C46B;font-size:13px;font-weight:600}
.et-bouton{align-self:stretch;min-height:48px;margin-top:4px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:15px;font-weight:900;cursor:pointer}
.et-bouton.clair{background:rgba(255,255,255,.09);color:#FFF4E6}
.et-bouton:disabled{opacity:.55}
.et-date{align-self:stretch;display:flex;flex-direction:column;gap:6px}
.et-date input{min-height:46px;padding:0 12px;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:#2A1422;color:#FFF4E6;font:inherit;font-size:16px;color-scheme:dark}
@keyframes et-pose{0%{transform:translateY(-10px) scale(1.5)}60%{transform:translateY(2px) scale(.9)}100%{transform:none}}
@keyframes et-monte{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.et-rang span.arrive,.pr-fil li.et-carte-fil > div,.pv-calque .et-note{animation:none}}
`;
