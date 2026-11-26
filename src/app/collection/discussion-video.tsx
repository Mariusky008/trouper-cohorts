"use client";

/**
 * 💬 LA DISCUSSION D'UNE VIDÉO (`docs/univers/discussions-video.md`, le lot A1 ; les règles : `lib/direct/discussion-video.ts`).
 *
 * La vidéo en haut (« ▶ Revoir la vidéo »), puis deux cercles, chacun avec sa couleur : 👯 Mes proches (leurs réactions à
 * la seconde, leurs mots, leurs vocaux, leurs réponses) et 🌍 Tous (les mots laissés à la fin de la vidéo, dits par leur
 * figurine). On la retrouve même quand on a quitté le salon où on l'a vue. Pour l'instant on la lit ; on y écrit au lot A2.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PHRASES_DISCUSSION as P, cercleDeDepart, combienDans, lienYouTube, type CercleDiscussion, type DiscussionVue } from "@/lib/direct/discussion-video";
import { ceQuiSestDit } from "@/lib/direct/reactions-video";
import { PHRASES_MOTS } from "@/lib/direct/mots-video";
import { lienRevoir } from "@/lib/direct/revoir";
import { vignetteYouTube } from "@/lib/direct/tele";

const seconde = (t: number) => {
  const x = Math.max(0, Math.floor(t));
  return `${Math.floor(x / 60)}:${String(x % 60).padStart(2, "0")}`;
};

type Etat = { d: DiscussionVue } | { erreur: string } | null;

export function DiscussionVideoEcran() {
  const [etat, setEtat] = useState<Etat>(null);
  const [cercle, setCercle] = useState<CercleDiscussion | null>(null);
  const [joue, setJoue] = useState<string | null>(null);
  const son = useRef<HTMLAudioElement | null>(null);

  const charger = useCallback(async () => {
    const q = new URLSearchParams(window.location.search);
    const id = q.get("video") ?? "";
    try {
      const r = await fetch(`/api/direct/discussion-video?video=${encodeURIComponent(id)}`, { cache: "no-store" });
      const j = (await r.json().catch(() => ({}))) as { discussion?: DiscussionVue };
      if (r.status === 401) return setEtat({ erreur: P.sansCompte });
      if (r.status === 404) return setEtat({ erreur: P.introuvable });
      if (!r.ok || !j.discussion) return setEtat({ erreur: P.rate });
      const d = j.discussion;
      setEtat({ d });
      setCercle((c) => c ?? cercleDeDepart(d, q.get("cercle")));
    } catch {
      setEtat({ erreur: P.rate });
    }
  }, []);

  useEffect(() => {
    // (au prochain tour : l'écran se monte d'abord, la discussion arrive)
    const t = window.setTimeout(() => void charger(), 0);
    return () => {
      window.clearTimeout(t);
      son.current?.pause();
    };
  }, [charger]);

  const ecouter = (cle: string, src: string) => {
    son.current?.pause();
    if (joue === cle) return setJoue(null);
    const a = new Audio(src);
    son.current = a;
    a.onended = () => setJoue((x) => (x === cle ? null : x));
    setJoue(cle);
    void a.play().catch(() => setJoue(null));
  };

  const direAge = async (adulte: boolean) => {
    await fetch("/api/direct/mots-video", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "age", adulte }) }).catch(() => null);
    await charger();
  };

  const revenir = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/collection#decouvrir";
  };

  const d = etat && "d" in etat ? etat.d : null;
  const dit = useMemo(() => (d ? ceQuiSestDit(d.proches, d.miennes, { moi: P.toi, jusqua: d.vue ? null : 0 }) : null), [d]);
  const figurines = useMemo(() => new Map((d?.proches ?? []).filter((p) => p.figurine).map((p) => [p.cle, p.figurine?.src ?? ""])), [d]);

  return (
    <div className="dv" data-discussion={d?.video.id ?? ""}>
      {!etat ? (
        <p className="dv-doux dv-seul" aria-busy="true">
          …
        </p>
      ) : "erreur" in etat ? (
        <div className="dv-seul">
          <button type="button" className="dv-rond" aria-label={P.retourNom} onClick={revenir}>
            {P.retour}
          </button>
          <p className="dv-doux" data-discussion-erreur>
            {etat.erreur}
          </p>
        </div>
      ) : (
        d && (
          <>
            <header className="dv-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={vignetteYouTube(d.video.id)} alt="" referrerPolicy="no-referrer" />
              <button type="button" className="dv-rond dv-retour" aria-label={P.retourNom} onClick={revenir}>
                {P.retour}
              </button>
              <a className="dv-revoir" href={d.aMaTele ? lienRevoir(d.video.id) : lienYouTube(d.video.id)} {...(d.aMaTele ? {} : { target: "_blank", rel: "noreferrer" })} data-revoir-discussion>
                {d.aMaTele ? P.revoir : P.surYouTube}
              </a>
              <div className="dv-titre">
                <b>{d.video.titre}</b>
                {d.video.chaine && <small>{d.video.chaine}</small>}
              </div>
            </header>

            <div className="dv-cercles" role="tablist">
              {(["proches", "tous"] as const).map((c) => (
                <button key={c} type="button" role="tab" aria-selected={cercle === c} className={`dv-cercle dv-${c}${cercle === c ? " on" : ""}`} data-cercle={c} onClick={() => setCercle(c)}>
                  {P.cercle(c === "proches" ? P.proches : P.tous, combienDans(d, c))}
                </button>
              ))}
            </div>

            {cercle === "proches" && dit && (
              <section className="dv-fil" data-fil="proches">
                <p className="dv-qui dv-qui-proches">{P.quiProches}</p>
                {dit.lignes.length === 0 && !dit.cachees ? (
                  <p className="dv-doux" data-rien>
                    {P.rienProches}
                  </p>
                ) : (
                  <ul className="dv-liste">
                    {dit.lignes.map((l, k) => {
                      const cle = `${l.cle}-${l.t}-${k}`;
                      const fig = l.cle === "moi" ? "" : figurines.get(l.cle);
                      return (
                        <li key={cle} className={`dv-msg${l.cle === "moi" ? " moi" : ""}${l.aQui !== undefined ? " rep" : ""}`} data-ligne={l.t}>
                          <Tete prenom={l.prenom} src={fig} />
                          <div className={`dv-bulle${l.pourMoi ? " pour-moi" : ""}`}>
                            <small>
                              {l.prenom}
                              {l.aQui !== undefined ? ` ${P.repondA(l.pourMoi ? P.aToi : l.aQui)}` : ""} · {P.aLaSeconde(seconde(l.t))}
                            </small>
                            <span>
                              {l.voix ? P.unVocal : l.texte ? l.texte : l.e}
                              {l.voix?.url && (
                                <button type="button" className="dv-ecoute" data-ecouter={l.t} aria-label={P.unVocal} onClick={() => l.voix?.url && ecouter(cle, l.voix.url)}>
                                  {joue === cle ? "■" : P.ecouter}
                                </button>
                              )}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {dit.cachees > 0 && (
                  <p className="dv-doux" data-cachees>
                    {P.cachees(dit.cachees)}
                  </p>
                )}
              </section>
            )}

            {cercle === "tous" && (
              <section className="dv-fil" data-fil="tous">
                {!d.tous ? (
                  <div className="dv-age" data-age>
                    <p className="dv-doux">{P.age}</p>
                    <button type="button" onClick={() => void direAge(true)}>
                      {P.adulte}
                    </button>
                    <button type="button" onClick={() => void direAge(false)}>
                      {P.jeune}
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="dv-qui dv-qui-tous">{d.tous.tranche === "jeunes" ? P.quiJeunes : P.quiTous}</p>
                    {d.tous.mots.length === 0 ? (
                      <p className="dv-doux" data-rien>
                        {P.rienTous}
                      </p>
                    ) : (
                      <ul className="dv-liste">
                        {d.tous.mots.map((m) => {
                          const cle = `mot-${m.q}`;
                          return (
                            <li key={cle} className={`dv-msg${m.moi ? " moi" : ""}${m.repond ? " rep" : ""}`} data-mot={m.q}>
                              <Tete prenom={m.moi ? P.toi : m.prenom} src={m.figurine?.src} />
                              <div className="dv-bulle dv-bulle-tous">
                                <small>
                                  {m.moi ? P.toi : m.prenom}
                                  {m.proche && !m.moi ? ` · ${PHRASES_MOTS.proche}` : ""}
                                  {m.repond ? ` ${P.repondA(m.repond.prenom)}` : ""}
                                </small>
                                <span>
                                  <button type="button" className="dv-ecoute dv-ecoute-mot" data-ecouter-mot={m.q} onClick={() => ecouter(cle, m.src)}>
                                    {joue === cle ? "■" : P.ecouter} 🎙️ {PHRASES_MOTS.duree(m.duree)}
                                  </button>
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                )}
              </section>
            )}

            <p className="dv-pied">{P.pourEcrire}</p>
          </>
        )
      )}
      <style>{STYLES}</style>
    </div>
  );
}

/** Une tête : sa figurine si on l'a, sinon son initiale. */
function Tete({ prenom, src }: { prenom: string; src?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="dv-tete" src={src} alt="" />
  ) : (
    <span className="dv-tete dv-initiale" aria-hidden="true">
      {(prenom.trim()[0] ?? "·").toUpperCase()}
    </span>
  );
}

const STYLES = `
.dv{min-height:100svh;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;max-width:560px;margin:0 auto;padding:0 0 calc(24px + env(safe-area-inset-bottom));background:#24180f;color:#fbf3ea;font-family:inherit}
.dv-seul{display:flex;flex-direction:column;align-items:flex-start;gap:14px;padding:calc(16px + env(safe-area-inset-top)) 16px 16px}
.dv-doux{margin:0;color:#c9b29c;font-size:14.5px;line-height:1.45}
.dv-rond{width:38px;height:38px;border:0;border-radius:50%;background:rgba(0,0,0,.55);color:#fbf3ea;font-size:20px;line-height:1;cursor:pointer}
.dv-video{position:relative;aspect-ratio:16/9;max-width:100%;background:#170f0a;overflow:hidden}
.dv-video img{width:100%;height:100%;object-fit:cover;display:block}
.dv-video::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.78),rgba(0,0,0,0) 60%)}
.dv-retour{position:absolute;z-index:1;top:calc(10px + env(safe-area-inset-top));left:12px}
.dv-revoir{position:absolute;z-index:1;top:calc(12px + env(safe-area-inset-top));right:12px;padding:8px 12px;border-radius:999px;background:rgba(0,0,0,.6);color:#fff;font-weight:800;font-size:13px;text-decoration:none}
.dv-titre{position:absolute;z-index:1;left:14px;right:14px;bottom:10px;display:flex;flex-direction:column;gap:2px}
.dv-titre b{font-size:16px;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dv-titre small{color:#e6d4c2;font-size:12.5px}
.dv-cercles{display:flex;gap:4px;margin:0 12px;padding:4px;border-radius:14px;background:rgba(255,255,255,.07)}
.dv-cercle{flex:1;min-width:0;border:0;border-radius:11px;padding:9px 6px;background:transparent;color:#c9b29c;font:inherit;font-size:14px;font-weight:800;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dv-cercle.on.dv-proches{background:#ff5d8f;color:#fff}
.dv-cercle.on.dv-tous{background:#4f8ff0;color:#fff}
.dv-fil{display:flex;flex-direction:column;gap:10px;padding:0 14px}
.dv-qui{margin:0;font-size:12.5px;font-weight:700}
.dv-qui-proches{color:#ff8fb1}
.dv-qui-tous{color:#8db8ff}
.dv-liste{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.dv-msg{display:flex;align-items:flex-start;gap:9px}
.dv-msg.rep{margin-left:30px}
.dv-tete{flex:none;width:36px;height:36px;border-radius:50%;object-fit:cover;object-position:top;background:#3a2a1d}
.dv-initiale{display:grid;place-items:center;font-weight:900;font-size:15px;color:#fff;background:#7a5a8e}
.dv-msg.moi .dv-initiale{background:#b07a2e}
.dv-bulle{min-width:0;display:flex;flex-direction:column;gap:3px;padding:8px 11px;border-radius:4px 16px 16px 16px;background:rgba(255,255,255,.08);font-size:14.5px;line-height:1.4;overflow-wrap:anywhere}
.dv-bulle.pour-moi{background:rgba(255,93,143,.2);box-shadow:inset 0 0 0 1.5px rgba(255,93,143,.55)}
.dv-bulle-tous{background:rgba(79,143,240,.14)}
.dv-bulle small{color:#c9b29c;font-size:12px;font-weight:700}
.dv-bulle span{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.dv-ecoute{border:0;border-radius:999px;padding:5px 11px;background:rgba(255,255,255,.14);color:#fbf3ea;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
.dv-age{display:flex;flex-direction:column;gap:8px}
.dv-age button{border:0;border-radius:14px;padding:12px;background:rgba(255,255,255,.1);color:#fbf3ea;font:inherit;font-weight:800;cursor:pointer}
.dv-pied{margin:6px 14px 0;color:#9c8670;font-size:13px;line-height:1.4}
`;
