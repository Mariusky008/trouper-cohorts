"use client";

/**
 * 🎁🚪 LES VISITES REÇUES, À DÉCOUVRIR — « Chez moi » (`chez-moi.tsx`, `proches.tsx`). Le propriétaire, le 13 novembre
 * 2026 : « quand je laisse un souvenir, il va quelque part où il n'y a aucune chance qu'il soit vu par celui à qui il a été
 * envoyé […] lorsque quelqu'un a tapé à ma porte ou laissé un cadeau, il faut que ça soit une vraie expérience de
 * découverte qui me fasse plaisir, donc beaucoup plus animée et mise en valeur ».
 *
 * EN ARRIVANT CHEZ MOI (ou en touchant le badge sur ma fenêtre, ou la ligne « Mes visites ») — une scène plein écran,
 * une découverte après l'autre :
 *   · 🎁 un cadeau : qui me l'a laissé (sa figurine), un paquet emballé qui se dandine — « Touche pour l'ouvrir » ; le
 *     papier, le couvercle qui s'envole, des confettis, l'objet qui jaillit dans un halo, son petit mot ; « ✨ Le poser
 *     chez moi » (il apparaît dans mon univers) ou « Non merci » ; puis « 💬 Lui dire merci » ;
 *   · 🚪 quelqu'un a frappé : une porte qui tremble (« Toc ! Toc ! ») — « Touche la porte pour ouvrir » ; elle s'ouvre
 *     sur sa figurine, dans la lumière ; « 🏡 Lui rendre visite », « 💬 Lui parler ».
 * Puis tout est « vu » (`POST { action: "vu" }`). Sans rien de nouveau : le bilan — qui est passé, ce qui est posé chez moi.
 *
 * FICHIER NAVIGATEUR.
 */
import { useCallback, useEffect, useState } from "react";
import { jouerDoux } from "@/lib/direct/sons";
import { objetDe, type MesVisites, type Passage, type SouvenirVu } from "@/lib/direct/visites";

const ROUTE = "/api/direct/visites";

async function poster(corps: Record<string, unknown>): Promise<void> {
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok || j.error) throw new Error(j.error || "Ça n’a pas marché. Réessaie.");
}

/** Mes visites (`null` : pas encore lues, ou pas encore d'univers). */
export function useMesVisites(actif: boolean): { visites: MesVisites | null; recharger: () => Promise<void> } {
  const [visites, setVisites] = useState<MesVisites | null>(null);
  const recharger = useCallback(async () => {
    try {
      const r = await fetch(`${ROUTE}?moi=1`, { cache: "no-store" });
      const j = (await r.json().catch(() => ({}))) as { visites?: MesVisites };
      setVisites(j.visites ?? null);
    } catch {
      // (pas de réseau : on garde ce qu'on a)
    }
  }, []);
  useEffect(() => {
    if (actif) void Promise.resolve().then(recharger);
  }, [actif, recharger]);
  return { visites, recharger };
}

/** Une découverte : un cadeau qui attend, ou quelqu'un qui a frappé (nouveau) ; `bilan` : qui est passé, ce qui est posé. */
export type ADecouvrir = { genre: "cadeau"; s: SouvenirVu } | { genre: "toc"; p: Passage } | { genre: "bilan" };

/**
 * Ce qu'il y a à découvrir : tous les cadeaux qui attendent, puis qui a frappé depuis la dernière fois (une fois par
 * personne, six au plus ; sans ceux dont un cadeau attend — le cadeau le dit déjà).
 */
export function aDecouvrir(v: MesVisites | null): ADecouvrir[] {
  if (!v) return [];
  const avecCadeau = new Set(v.enAttente.map((s) => s.cle ?? s.de));
  const vus = new Set<string>();
  const tocs: ADecouvrir[] = [];
  for (const p of v.passes) {
    const k = p.cle ?? p.prenom;
    if (!p.nouveau || vus.has(k) || avecCadeau.has(k)) continue;
    vus.add(k);
    tocs.push({ genre: "toc", p });
  }
  return [...v.enAttente.map((s): ADecouvrir => ({ genre: "cadeau", s })), ...tocs.slice(0, 6)];
}
/** Sa signature (pour ne pas la rouvrir toute seule deux fois de suite). */
export const signatureDe = (l: ADecouvrir[]) => l.map((x) => (x.genre === "cadeau" ? `c${x.s.id}` : x.genre === "toc" ? `t${x.p.cle ?? x.p.prenom}${x.p.le}` : "b")).join(",");

const quand = (le: string) => {
  const d = new Date(le);
  if (Number.isNaN(d.getTime())) return "";
  const jour = (x: Date) => x.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", " h ");
  const hier = new Date(Date.now() - 86_400_000);
  if (jour(d) === jour(new Date())) return `aujourd’hui à ${heure}`;
  if (jour(d) === jour(hier)) return `hier à ${heure}`;
  return `le ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" })}`;
};

/** Les confettis d'un cadeau qui s'ouvre (des directions, des distances, des couleurs : toujours les mêmes). */
const CONFETTIS = Array.from({ length: 28 }, (_, i) => {
  const a = (i / 28) * Math.PI * 2 + (i % 3) * 0.2;
  const d = 90 + ((i * 37) % 70);
  return { dx: Math.cos(a) * d, dy: Math.sin(a) * d - 40, c: ["#FF2E9A", "#F2C46B", "#7ED6FF", "#3DDC84", "#FFF4E6"][i % 5], r: (i * 47) % 360, rond: i % 4 === 0 };
});

export function VisitesRecues({
  liste,
  visites,
  onFermer,
  onParler,
}: {
  /** ce qu'il y a à découvrir (figé à l'ouverture) */
  liste: ADecouvrir[];
  /** mes visites, pour le bilan */
  visites: MesVisites | null;
  /** fermé : tout est vu ; `change` : un cadeau a été posé ou refusé */
  onFermer: (change: boolean) => void;
  /** 💬 lui parler (sa clé de profil) */
  onParler?: (cle: string) => void;
}) {
  const [i, setI] = useState(0);
  const [change, setChange] = useState(false);
  const x = liste[i];
  const fermer = () => onFermer(change);
  const suivant = () => (i + 1 < liste.length ? setI(i + 1) : fermer());
  const dernier = i + 1 >= liste.length;
  // (Échap ferme)
  useEffect(() => {
    const touche = (e: KeyboardEvent) => e.key === "Escape" && onFermer(change);
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [onFermer, change]);
  if (!x) return null;
  return (
    <div className="vr" role="dialog" aria-modal="true" aria-label={x.genre === "cadeau" ? "Un cadeau pour toi" : x.genre === "toc" ? "Quelqu’un a frappé à ta porte" : "Mes visites"}>
      <div className="vr-haut">
        {liste.length > 1 ? (
          <span className="vr-points" aria-label={`${i + 1} sur ${liste.length}`}>
            {liste.map((_, k) => (
              <i key={k} className={k === i ? "la" : k < i ? "vu" : ""} />
            ))}
          </span>
        ) : (
          <span />
        )}
        <button type="button" className="vr-fermer" aria-label="Fermer" onClick={fermer}>
          ✕
        </button>
      </div>
      {x.genre === "cadeau" ? (
        <Cadeau key={`c${x.s.id}`} s={x.s} dernier={dernier} suivant={suivant} onDecide={() => setChange(true)} onParler={onParler} />
      ) : x.genre === "toc" ? (
        <Porte key={`t${i}`} p={x.p} dernier={dernier} suivant={suivant} onParler={onParler} />
      ) : (
        <Bilan visites={visites} fermer={fermer} />
      )}
      <style>{STYLES_VISITES_RECUES}</style>
    </div>
  );
}

function Avatar({ image, prenom }: { image?: string; prenom: string }) {
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="vr-avatar" src={image} alt={`La figurine de ${prenom}`} />
  ) : (
    <span className="vr-avatar vide" aria-hidden="true">
      🙂
    </span>
  );
}

// ─── 🎁 un cadeau ────────────────────────────────────────────────────────────────────────────────
function Cadeau({ s, dernier, suivant, onDecide, onParler }: { s: SouvenirVu; dernier: boolean; suivant: () => void; onDecide: () => void; onParler?: (cle: string) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const [decide, setDecide] = useState<"pose" | "non" | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");
  const o = objetDe(s.objet);
  function ouvrir() {
    if (ouvert) return;
    jouerDoux("cadeau");
    setOuvert(true);
  }
  async function decider(oui: boolean) {
    setOccupe(true);
    setErreur("");
    try {
      await poster({ action: "decider", id: s.id, oui });
      setDecide(oui ? "pose" : "non");
      onDecide();
      if (oui) jouerDoux("trouve");
      else suivant();
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setOccupe(false);
    }
  }
  return (
    <div className="vr-carte">
      <div className="vr-qui">
        <Avatar image={s.image} prenom={s.de} />
        <p>
          <b>{s.de}</b> t’a laissé un cadeau !
        </p>
      </div>
      <div className={`vr-scene${ouvert ? " ouvert" : ""}${decide === "pose" ? " pose" : ""}`}>
        <span className="vr-rayons" aria-hidden="true" />
        {!ouvert || decide !== "pose" ? (
          <button type="button" className="vr-boite" aria-label="Ouvrir le cadeau" onClick={ouvrir} disabled={ouvert}>
            <span className="vr-couvercle">
              <i>🎀</i>
            </span>
            <span className="vr-corps" />
          </button>
        ) : null}
        {ouvert && (
          <>
            <span className="vr-objet" role="img" aria-label={o?.nom ?? "Un souvenir"}>
              {o?.emoji}
            </span>
            <span className="vr-confettis" aria-hidden="true">
              {CONFETTIS.map((c, k) => (
                <i key={k} className={c.rond ? "rond" : ""} style={{ ["--dx" as string]: `${c.dx}px`, ["--dy" as string]: `${c.dy}px`, ["--r" as string]: `${c.r}deg`, background: c.c }} />
              ))}
            </span>
          </>
        )}
      </div>
      {!ouvert ? (
        <p className="vr-indice">Touche le paquet pour l’ouvrir 👆</p>
      ) : (
        <div className="vr-revele">
          <p className="vr-nom">
            {o?.nom}
            <small>de {s.de}</small>
          </p>
          {s.mot && <p className="vr-mot">« {s.mot} »</p>}
          {decide === "pose" ? (
            <>
              <p className="vr-pose" role="status">
                ✨ Posé chez toi ! Tes visiteurs le verront.
              </p>
              <div className="vr-actions">
                {s.cle && onParler && (
                  <button type="button" className="vr-bouton" onClick={() => onParler(s.cle!)}>
                    💬 Lui dire merci
                  </button>
                )}
                <button type="button" className={`vr-bouton${s.cle && onParler ? " clair" : ""}`} onClick={suivant}>
                  {dernier ? "Fermer" : "Suivant →"}
                </button>
              </div>
            </>
          ) : (
            <div className="vr-actions">
              <button type="button" className="vr-bouton" disabled={occupe} onClick={() => void decider(true)}>
                ✨ Le poser chez moi
              </button>
              <button type="button" className="vr-lien" disabled={occupe} onClick={() => void decider(false)}>
                Non merci
              </button>
            </div>
          )}
          {erreur && (
            <p className="vr-erreur" role="alert">
              {erreur}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 🚪 quelqu'un a frappé ───────────────────────────────────────────────────────────────────────
function Porte({ p, dernier, suivant, onParler }: { p: Passage; dernier: boolean; suivant: () => void; onParler?: (cle: string) => void }) {
  const [ouverte, setOuverte] = useState(false);
  function ouvrir() {
    if (ouverte) return;
    jouerDoux("porte");
    setOuverte(true);
  }
  return (
    <div className="vr-carte">
      <p className="vr-titre">{ouverte ? `C’est ${p.prenom} ! 👋` : "Toc toc ! Qui est là ?"}</p>
      <div className={`vr-entree${ouverte ? " ouverte" : ""}`}>
        <span className="vr-lumiere" aria-hidden="true" />
        <span className="vr-visiteur">
          <Avatar image={p.image} prenom={p.prenom} />
        </span>
        <button type="button" className="vr-porte" aria-label="Ouvrir la porte" onClick={ouvrir} disabled={ouverte}>
          <span className="vr-poignee" />
        </button>
        {!ouverte && (
          <span className="vr-tocs" aria-hidden="true">
            <b>Toc !</b>
            <b>Toc !</b>
          </span>
        )}
      </div>
      {!ouverte ? (
        <p className="vr-indice">Touche la porte pour ouvrir 👆</p>
      ) : (
        <div className="vr-revele">
          <p className="vr-nom">
            {p.prenom} a frappé à ta porte
            <small>{quand(p.le)}</small>
          </p>
          <div className="vr-actions">
            {p.univers && p.cle && (
              <a className="vr-bouton" href={`/univers/chez/${p.cle}`}>
                🏡 Lui rendre visite
              </a>
            )}
            {p.proche && p.cle && onParler && (
              <button type="button" className="vr-bouton clair" onClick={() => onParler(p.cle!)}>
                💬 Lui parler
              </button>
            )}
            <button type="button" className={p.univers || p.proche ? "vr-lien" : "vr-bouton"} onClick={suivant}>
              {dernier ? "Fermer" : "Suivant →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 🗒️ le bilan : qui est passé, ce qui est posé chez moi ───────────────────────────────────────
function Bilan({ visites, fermer }: { visites: MesVisites | null; fermer: () => void }) {
  const vus = new Set<string>();
  const passes = (visites?.passes ?? []).filter((p) => {
    const k = p.cle ?? p.prenom;
    if (vus.has(k)) return false;
    vus.add(k);
    return true;
  });
  return (
    <div className="vr-carte bilan">
      <p className="vr-titre">🚪 Qui est passé chez toi</p>
      {passes.length ? (
        <ul className="vr-liste">
          {passes.map((p) => (
            <li key={p.cle ?? p.prenom}>
              <Avatar image={p.image} prenom={p.prenom} />
              <span>
                <b>{p.prenom}</b>
                <small>{quand(p.le)}</small>
              </span>
              {p.univers && p.cle && (
                <a className="vr-petit" href={`/univers/chez/${p.cle}`}>
                  Visiter
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="vr-doux">Personne pour l’instant. Envoie ton lien de visite à tes proches !</p>
      )}
      {(visites?.poses.length ?? 0) > 0 && (
        <>
          <p className="vr-titre petit">🎁 Les cadeaux posés chez toi</p>
          <ul className="vr-liste">
            {visites!.poses.map((s) => (
              <li key={s.id}>
                <span className="vr-avatar vide" aria-hidden="true">
                  {objetDe(s.objet)?.emoji}
                </span>
                <span>
                  <b>
                    {objetDe(s.objet)?.nom}, de {s.de}
                  </b>
                  {s.mot && <small>« {s.mot} »</small>}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="vr-actions">
        <button type="button" className="vr-bouton" onClick={fermer}>
          Fermer
        </button>
      </div>
    </div>
  );
}

/** Marquer comme vu ce qui a été découvert (ne lève jamais). */
export const marquerVu = () => poster({ action: "vu" }).catch(() => undefined);

export const STYLES_VISITES_RECUES = `
.vr{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;padding:calc(12px + env(safe-area-inset-top)) 16px calc(20px + env(safe-area-inset-bottom));box-sizing:border-box;overflow-y:auto;color:#FFF4E6;font-family:inherit;background:radial-gradient(circle at 50% 32%,#5a2049 0%,#2a0f23 55%,#14060f 100%);animation:vr-fondu .35s ease-out both}
.vr::before{content:"";position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(2px 2px at 12% 18%,rgba(255,244,230,.7),transparent),radial-gradient(1.5px 1.5px at 78% 12%,rgba(255,244,230,.6),transparent),radial-gradient(2px 2px at 88% 46%,rgba(242,196,107,.7),transparent),radial-gradient(1.5px 1.5px at 22% 62%,rgba(255,244,230,.5),transparent),radial-gradient(2px 2px at 60% 84%,rgba(255,46,154,.6),transparent),radial-gradient(1.5px 1.5px at 38% 30%,rgba(242,196,107,.6),transparent);animation:vr-scintille 3.2s ease-in-out infinite alternate}
.vr-haut{position:relative;width:100%;max-width:460px;display:flex;align-items:center;justify-content:space-between;min-height:44px}
.vr-points{display:flex;gap:6px}
.vr-points i{width:22px;height:5px;border-radius:999px;background:rgba(255,255,255,.18)}
.vr-points i.vu{background:rgba(255,255,255,.55)}
.vr-points i.la{background:#F2C46B}
.vr-fermer{width:44px;height:44px;border:0;border-radius:50%;background:rgba(255,255,255,.1);color:#FFF4E6;font:inherit;font-size:18px;cursor:pointer}
.vr-carte{position:relative;width:100%;max-width:420px;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:8px 0 12px;animation:vr-arrive .5s cubic-bezier(.2,.9,.3,1) both}
.vr-carte.bilan{justify-content:flex-start;align-items:stretch;text-align:left}
.vr-qui{display:flex;flex-direction:column;align-items:center;gap:8px;animation:vr-arrive .5s .1s cubic-bezier(.2,.9,.3,1) both}
.vr-qui p{margin:0;font-size:22px;font-weight:800;line-height:1.25}
.vr-avatar{width:76px;height:76px;border-radius:50%;object-fit:cover;object-position:50% 14%;background:#3a1630;border:3px solid #F2C46B;box-shadow:0 8px 20px -8px rgba(0,0,0,.8);flex:none}
.vr-avatar.vide{display:grid;place-items:center;font-size:32px}
.vr-titre{margin:0;font-size:26px;font-weight:900;line-height:1.2}
.vr-titre.petit{font-size:19px;margin-top:12px}
.vr-doux{margin:0;color:#CDB4C0}
.vr-indice{margin:0;font-size:16px;font-weight:700;color:#F2C46B;animation:vr-pulse 1.4s ease-in-out infinite}
.vr-scene{position:relative;width:240px;height:240px;display:grid;place-items:center}
.vr-rayons{position:absolute;inset:-30px;border-radius:50%;background:conic-gradient(from 0deg,rgba(242,196,107,.0),rgba(242,196,107,.35),rgba(242,196,107,0) 12%,rgba(255,46,154,.3) 25%,rgba(242,196,107,0) 37%,rgba(242,196,107,.35) 50%,rgba(242,196,107,0) 62%,rgba(255,46,154,.3) 75%,rgba(242,196,107,0) 87%,rgba(242,196,107,.35));-webkit-mask:radial-gradient(circle,#000 30%,transparent 70%);mask:radial-gradient(circle,#000 30%,transparent 70%);opacity:.25;animation:vr-tourne 9s linear infinite}
.vr-scene.ouvert .vr-rayons{opacity:1;transition:opacity .6s}
.vr-boite{position:relative;width:150px;height:150px;border:0;background:none;padding:0;cursor:pointer;animation:vr-dandine 1.8s ease-in-out infinite;transform-origin:50% 100%;-webkit-tap-highlight-color:transparent}
.vr-boite:disabled{cursor:default;animation:none}
.vr-corps{position:absolute;left:10px;right:10px;bottom:0;height:100px;border-radius:12px;background:linear-gradient(90deg,transparent 42%,#F2C46B 42%,#F2C46B 58%,transparent 58%),linear-gradient(160deg,#FF5DB1,#C2186F);box-shadow:inset 0 -10px 18px rgba(0,0,0,.25),0 14px 26px -10px rgba(0,0,0,.8)}
.vr-couvercle{position:absolute;left:0;right:0;top:20px;height:38px;border-radius:10px;background:linear-gradient(90deg,transparent 42%,#F2C46B 42%,#F2C46B 58%,transparent 58%),linear-gradient(160deg,#FF7AC2,#D81B7A);box-shadow:0 6px 10px -4px rgba(0,0,0,.5);z-index:1}
.vr-couvercle i{position:absolute;left:50%;top:-34px;transform:translateX(-50%);font-style:normal;font-size:48px;line-height:1}
.vr-scene.ouvert .vr-couvercle{animation:vr-envole .7s cubic-bezier(.3,.7,.4,1) both}
.vr-scene.ouvert .vr-corps{animation:vr-sombre .6s .15s ease-in both}
.vr-objet{position:absolute;font-size:120px;line-height:1;filter:drop-shadow(0 12px 22px rgba(0,0,0,.6));animation:vr-jaillit .9s .2s cubic-bezier(.3,1.6,.5,1) both}
.vr-scene.pose .vr-objet{animation:vr-flotte 2.4s ease-in-out infinite}
.vr-confettis{position:absolute;left:50%;top:50%;width:0;height:0;pointer-events:none}
.vr-confettis i{position:absolute;width:9px;height:14px;border-radius:2px;opacity:0;animation:vr-confetti 1.3s .25s cubic-bezier(.2,.7,.4,1) both}
.vr-confettis i.rond{width:10px;height:10px;border-radius:50%}
.vr-revele{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;animation:vr-arrive .5s .75s cubic-bezier(.2,.9,.3,1) both}
.vr-nom{margin:0;display:flex;flex-direction:column;gap:2px;font-size:24px;font-weight:900}
.vr-nom small{font-size:15px;font-weight:700;color:#CDB4C0}
.vr-mot{margin:0;max-width:300px;padding:12px 16px;border-radius:6px;background:#FFF4E6;color:#2b1a0c;font-size:18px;font-weight:700;line-height:1.35;transform:rotate(-2deg);box-shadow:0 10px 20px -8px rgba(0,0,0,.7)}
.vr-pose{margin:0;font-weight:800;color:#3DDC84}
.vr-actions{display:flex;flex-direction:column;align-items:stretch;gap:8px;width:100%;max-width:320px;margin-top:4px}
.vr-bouton{display:flex;align-items:center;justify-content:center;min-height:54px;padding:0 18px;border:0;border-radius:18px;background:linear-gradient(135deg,#FF2E9A,#F2A23B);color:#fff;font:inherit;font-size:17px;font-weight:900;text-decoration:none;cursor:pointer;box-shadow:0 12px 24px -12px rgba(255,46,154,.9)}
.vr-bouton.clair{background:rgba(255,255,255,.1);box-shadow:none;border:1px solid rgba(255,255,255,.2)}
.vr-bouton:disabled{opacity:.6}
.vr-lien{border:0;background:none;color:#CDB4C0;font:inherit;font-size:15px;text-decoration:underline;padding:8px;cursor:pointer}
.vr-erreur{margin:0;padding:8px 12px;border-radius:12px;background:rgba(253,227,220,.95);color:#8a1c14}
.vr-entree{position:relative;width:180px;height:260px;perspective:700px;border-radius:90px 90px 8px 8px;background:#14060f;box-shadow:0 0 0 10px #6b3f1f,0 0 0 14px #4a2a12,0 20px 40px -12px rgba(0,0,0,.9)}
.vr-lumiere{position:absolute;inset:0;border-radius:inherit;background:radial-gradient(circle at 50% 60%,#FFE3A3,#F2A23B 45%,#7a3a12 100%);opacity:0;transition:opacity .5s .2s}
.vr-entree.ouverte .vr-lumiere{opacity:1}
.vr-visiteur{position:absolute;left:50%;bottom:28px;transform:translateX(-50%) scale(.3);opacity:0}
.vr-visiteur .vr-avatar{width:120px;height:120px;border-width:4px}
.vr-entree.ouverte .vr-visiteur{animation:vr-surgit .8s .45s cubic-bezier(.3,1.6,.5,1) both}
.vr-porte{position:absolute;inset:0;border:0;padding:0;border-radius:inherit;transform-origin:0 50%;cursor:pointer;background:linear-gradient(90deg,rgba(0,0,0,.18),transparent 12%,transparent 88%,rgba(0,0,0,.22)),repeating-linear-gradient(90deg,#8a5229 0 28px,#7a4622 28px 30px);box-shadow:inset 0 0 0 12px rgba(0,0,0,.08);animation:vr-frappe 1.6s ease-in-out infinite;-webkit-tap-highlight-color:transparent;transition:transform .9s cubic-bezier(.3,.7,.3,1)}
.vr-porte::before,.vr-porte::after{content:"";position:absolute;left:22px;right:22px;border-radius:10px;border:3px solid rgba(0,0,0,.18)}
.vr-porte::before{top:40px;height:80px;border-radius:60px 60px 10px 10px}
.vr-porte::after{bottom:24px;height:90px}
.vr-poignee{position:absolute;right:18px;top:52%;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#FFE9A8,#C8962E);box-shadow:0 2px 4px rgba(0,0,0,.5)}
.vr-entree.ouverte .vr-porte{animation:none;transform:rotateY(-108deg);cursor:default}
.vr-tocs{position:absolute;inset:0;pointer-events:none}
.vr-tocs b{position:absolute;padding:6px 12px;border-radius:999px;background:#FFF4E6;color:#2b1a0c;font-size:18px;font-weight:900;opacity:0;animation:vr-toc 1.6s ease-out infinite;box-shadow:0 8px 16px -6px rgba(0,0,0,.7)}
.vr-tocs b:first-child{left:-34px;top:30%}
.vr-tocs b:last-child{right:-34px;top:16%;animation-delay:.22s}
.vr-liste{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}
.vr-liste li{display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:16px;background:rgba(255,255,255,.06)}
.vr-liste .vr-avatar{width:48px;height:48px;border-width:2px}
.vr-liste li > span:nth-child(2){flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.vr-liste small{color:#CDB4C0;font-size:13.5px}
.vr-petit{padding:8px 14px;border-radius:999px;background:#FF2E9A;color:#fff;font-size:14px;font-weight:900;text-decoration:none}
@keyframes vr-fondu{from{opacity:0}to{opacity:1}}
@keyframes vr-scintille{from{opacity:.5}to{opacity:1}}
@keyframes vr-arrive{from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:none}}
@keyframes vr-pulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
@keyframes vr-tourne{to{transform:rotate(360deg)}}
@keyframes vr-dandine{0%,100%{transform:rotate(0) scale(1)}10%{transform:rotate(-7deg) scale(1.03)}20%{transform:rotate(6deg) scale(1.03)}30%{transform:rotate(-4deg)}40%{transform:rotate(0) scale(1)}}
@keyframes vr-envole{0%{transform:none}30%{transform:translateY(-30px) rotate(-8deg)}100%{transform:translate(-90px,-220px) rotate(-60deg);opacity:0}}
@keyframes vr-sombre{to{transform:translateY(30px) scale(.7);opacity:0}}
@keyframes vr-jaillit{0%{transform:translateY(40px) scale(0) rotate(-20deg);opacity:0}60%{transform:translateY(-14px) scale(1.18) rotate(6deg);opacity:1}100%{transform:none;opacity:1}}
@keyframes vr-flotte{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes vr-confetti{0%{opacity:1;transform:translate(0,0) rotate(0)}80%{opacity:1}100%{opacity:0;transform:translate(var(--dx),calc(var(--dy) + 60px)) rotate(var(--r))}}
@keyframes vr-frappe{0%,62%,100%{transform:none}66%{transform:rotate(-1.4deg) translateX(-3px)}70%{transform:rotate(1.2deg) translateX(3px)}74%{transform:none}80%{transform:rotate(-1.4deg) translateX(-3px)}84%{transform:rotate(1.2deg) translateX(3px)}88%{transform:none}}
@keyframes vr-toc{0%,58%{opacity:0;transform:scale(.4)}66%{opacity:1;transform:scale(1.1)}90%{opacity:1;transform:scale(1)}100%{opacity:0;transform:translateY(-10px)}}
@keyframes vr-surgit{0%{transform:translateX(-50%) scale(.3) translateY(40px);opacity:0}100%{transform:translateX(-50%) scale(1);opacity:1}}
@media (prefers-reduced-motion:reduce){.vr *,.vr::before{animation:none!important;transition:none!important}.vr-confettis{display:none}.vr-visiteur{opacity:1;transform:translateX(-50%)}}
`;
