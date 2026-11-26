"use client";

/**
 * 💬 LA DISCUSSION D'UNE VIDÉO (`docs/univers/discussions-video.md`, le lot A1 ; les règles : `lib/direct/discussion-video.ts`).
 *
 * La vidéo en haut (« ▶ Revoir la vidéo »), puis deux cercles, chacun avec sa couleur : 👯 Mes proches (leurs réactions à
 * la seconde, leurs mots, leurs vocaux, leurs réponses) et 🌍 Tous (les mots laissés à la fin de la vidéo, dits par leur
 * figurine, et les mots écrits — lot A2). On la retrouve même quand on a quitté le salon où on l'a vue. En 🌍, on écrit
 * sous la vidéo (« Publier », l'accord la première fois), on répond, on efface le sien, on signale.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ECRITS_VIDEO,
  NIVEAUX,
  NIVEAUX_SUIVI,
  PHRASES_DISCUSSION as P,
  cercleDeDepart,
  cleMot,
  combienDans,
  filDeTous,
  lienYouTube,
  type CercleDiscussion,
  type DiscussionVue,
  type NiveauSuivi,
} from "@/lib/direct/discussion-video";
import { ceQuiSestDit } from "@/lib/direct/reactions-video";
import { PHRASES_MOTS } from "@/lib/direct/mots-video";
import { lienRevoir } from "@/lib/direct/revoir";
import { vignetteYouTube } from "@/lib/direct/tele";

/** L'accord pour publier sous une vidéo, donné une fois sur ce téléphone. */
export const CLE_ACCORD_ECRIT = "clikme-accord-ecrit-v1";
export const accordDonne = () => {
  try {
    return window.localStorage.getItem(CLE_ACCORD_ECRIT) === "1";
  } catch {
    return false;
  }
};
export const donnerAccord = () => {
  try {
    window.localStorage.setItem(CLE_ACCORD_ECRIT, "1");
  } catch {
    /* (rien : on le redemandera) */
  }
};

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
  // ✍️ (lot A2) écrire sous la vidéo
  const [texte, setTexte] = useState("");
  const [repond, setRepond] = useState<{ cle: string; prenom: string } | null>(null);
  const [accord, setAccord] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [note, setNote] = useState("");
  const [signales, setSignales] = useState<string[]>([]);
  // 🔔 (lot A3) suivre : la feuille des trois niveaux, la question après la première publication, « Nouveau »
  const [feuilleSuivi, setFeuilleSuivi] = useState(false);
  const [proposer, setProposer] = useState(false);
  const [luDepart, setLuDepart] = useState<number | null>(null);
  // 👥 (lot A6) le cercle d'un de mes groupes : celui qui est ouvert, et quand je l'avais lu avant d'arriver
  const [groupeOuvert, setGroupeOuvert] = useState<string | null>(null);
  const [luGroupes, setLuGroupes] = useState<Record<string, number> | null>(null);

  const charger = useCallback(async () => {
    const q = new URLSearchParams(window.location.search);
    const id = q.get("video") ?? "";
    try {
      const seance = q.get("seance");
      const r = await fetch(`/api/direct/discussion-video?video=${encodeURIComponent(id)}${seance ? `&seance=${encodeURIComponent(seance)}` : ""}`, { cache: "no-store" });
      const j = (await r.json().catch(() => ({}))) as { discussion?: DiscussionVue };
      if (r.status === 401) return setEtat({ erreur: P.sansCompte });
      if (r.status === 404) return setEtat({ erreur: P.introuvable });
      if (!r.ok || !j.discussion) return setEtat({ erreur: P.rate });
      const d = j.discussion;
      setEtat({ d });
      setLuDepart((x) => x ?? d.luAvant.tous);
      setLuGroupes((x) => x ?? Object.fromEntries(d.groupes.map((g) => [g.id, g.luAvant])));
      setCercle((c) => c ?? cercleDeDepart(d, q.get("cercle")));
      const g = q.get("groupe");
      if (q.get("cercle") === "groupe" && g && d.groupes.some((x) => x.id === g)) setGroupeOuvert((x) => x ?? g);
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

  const dire = (t: string) => {
    setNote(t);
    window.setTimeout(() => setNote((x) => (x === t ? "" : x)), 4200);
  };
  const poster = async (corps: Record<string, unknown>) => {
    const seance = new URLSearchParams(window.location.search).get("seance");
    const r = await fetch("/api/direct/discussion-video", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...corps, ...(seance ? { seance } : {}) }) }).catch(() => null);
    const j = ((await r?.json().catch(() => null)) ?? {}) as Record<string, unknown>;
    return { ok: Boolean(r?.ok), j };
  };
  const publier = async (avecAccord: boolean) => {
    const id = d?.video.id;
    const t = texte.trim();
    if (!id || !t || occupe) return;
    // (👥 dans le cercle d'un groupe : seuls ses membres le lisent, pas d'accord à donner)
    if (!groupeOuvert && !avecAccord && !accordDonne()) return setAccord(true);
    setAccord(false);
    setOccupe(true);
    const r = await poster({ action: "publier", id, texte: t, ...(repond ? { repond: repond.cle } : {}), ...(groupeOuvert ? { groupe: groupeOuvert } : { accord: true }) });
    setOccupe(false);
    if (!r.ok) return dire(String(r.j.error || P.rate));
    if (!groupeOuvert) donnerAccord();
    setTexte("");
    setRepond(null);
    dire(P.publie);
    if (r.j.premiere === true) setProposer(true);
    await charger();
  };
  const suivre = async (cercleChoisi: CercleDiscussion, niveau: NiveauSuivi) => {
    if (!d) return;
    setFeuilleSuivi(false);
    setProposer(false);
    if (groupeOuvert) {
      const g = groupeOuvert;
      const r = await poster({ action: "suivre", id: d.video.id, cercle: "groupe", groupe: g, niveau });
      if (!r.ok) return dire(String(r.j.error || P.rate));
      setEtat({ d: { ...d, groupes: [...d.groupes].map((x) => (x.id === g ? { ...x, suivi: niveau } : x)) } });
      return dire(P.niveauChoisi(`${NIVEAUX[niveau].e} ${NIVEAUX[niveau].nom}`));
    }
    const r = await poster({ action: "suivre", id: d.video.id, cercle: cercleChoisi, niveau });
    if (!r.ok) return dire(String(r.j.error || P.rate));
    setEtat({ d: { ...d, suivi: { ...d.suivi, [cercleChoisi]: niveau } } });
    dire(P.niveauChoisi(`${NIVEAUX[niveau].e} ${NIVEAUX[niveau].nom}`));
  };
  const effacerEcrit = async (ecrit: string) => {
    const video = etat && "d" in etat ? etat.d.video.id : null;
    if (!video) return;
    const r = await poster({ action: "effacer", id: video, ecrit, ...(groupeOuvert ? { groupe: groupeOuvert } : {}) });
    if (r.ok) {
      dire(P.efface);
      await charger();
    }
  };
  const signalerEcrit = async (ecrit: string) => {
    if (!d) return;
    const r = await poster({ action: "signaler", id: d.video.id, ecrit });
    if (r.ok) {
      setSignales((l) => [...l, ecrit]);
      dire(P.signale);
    }
  };

  const revenir = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/collection#decouvrir";
  };

  const d = etat && "d" in etat ? etat.d : null;
  const dit = useMemo(() => (d ? ceQuiSestDit(d.proches, d.miennes, { moi: P.toi, jusqua: d.vue ? null : 0 }) : null), [d]);
  const fil = useMemo(() => (d?.tous ? filDeTous(d.tous.mots, d.ecrits).filter((l) => !signales.includes(l.cle)) : []), [d, signales]);
  const figurines = useMemo(() => new Map((d?.proches ?? []).filter((p) => p.figurine).map((p) => [p.cle, p.figurine?.src ?? ""])), [d]);
  const leGroupe = groupeOuvert ? ((d?.groupes ?? []).find((g) => g.id === groupeOuvert) ?? null) : null;
  const filGroupe = useMemo(() => {
    const g = groupeOuvert ? d?.groupes.find((x) => x.id === groupeOuvert) : null;
    return g ? filDeTous([], g.ecrits) : [];
  }, [d, groupeOuvert]);
  const luGroupe = leGroupe ? (luGroupes?.[leGroupe.id] ?? 0) : 0;
  /** (le cercle montré : 👯 ou 🌍 — ou aucun des deux quand un groupe est ouvert) */
  const vueCercle = leGroupe ? null : cercle;
  const niveauOuvert: NiveauSuivi | null = leGroupe ? leGroupe.suivi : d && cercle ? d.suivi[cercle] : null;

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
                <button key={c} type="button" role="tab" aria-selected={vueCercle === c} className={`dv-cercle dv-${c}${vueCercle === c ? " on" : ""}`} data-cercle={c} onClick={() => {
                    setCercle(c);
                    setGroupeOuvert(null);
                    setRepond(null);
                  }}>
                  {P.cercle(c === "proches" ? P.proches : P.tous, combienDans(d, c))}
                </button>
              ))}
              {(d?.groupes ?? []).map((g) => (
                <button key={g.id} type="button" role="tab" aria-selected={groupeOuvert === g.id} className={`dv-cercle dv-groupe${groupeOuvert === g.id ? " on" : ""}`} data-cercle="groupe" data-groupe={g.id} onClick={() => {
                    setGroupeOuvert(g.id);
                    setRepond(null);
                  }}>
                  {P.cercle(`👥 ${g.nom}`, g.ecrits.length)}
                </button>
              ))}
            </div>

            {niveauOuvert && (
              <button type="button" className="dv-suivi" data-suivi={niveauOuvert} onClick={() => setFeuilleSuivi(true)}>
                {NIVEAUX[niveauOuvert].e} {NIVEAUX[niveauOuvert].nom} <i>⋯</i>
              </button>
            )}
            {proposer && (
              <div className="dv-proposer" data-proposer-suivre>
                <span>{P.proposerSuivre}</span>
                <span className="dv-accord-boutons">
                  <button type="button" onClick={() => setProposer(false)}>
                    {P.pasBesoin}
                  </button>
                  <button type="button" className="oui" data-proposer-oui onClick={() => void suivre("tous", "prevenir")}>
                    {P.oui}
                  </button>
                </span>
              </div>
            )}

            {vueCercle === "proches" && dit && (
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

            {vueCercle === "tous" && (
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
                    {fil.length === 0 ? (
                      <p className="dv-doux" data-rien>
                        {P.rienTous}
                      </p>
                    ) : (
                      <ul className="dv-liste">
                        {fil.map((l) => {
                          const m = l.mot;
                          const e = l.ecrit;
                          const prenom = m ? (m.moi ? P.toi : m.prenom) : e ? (e.moi ? P.toi : e.prenom) : "";
                          const moi = Boolean(m?.moi || e?.moi);
                          const aQui = m?.repond?.prenom ?? e?.repond?.prenom;
                          const neuf = Boolean(luDepart) && !moi && l.le > (luDepart ?? 0);
                          return (
                            <li key={l.cle} className={`dv-msg${moi ? " moi" : ""}${l.repond && aQui ? " rep" : ""}${neuf ? " neuf" : ""}`} {...(neuf ? { "data-neuf": "" } : {})} {...(m ? { "data-mot": m.q } : { "data-ecrit": e?.id })}>
                              <Tete prenom={prenom} src={(m ?? e)?.figurine?.src} />
                              <div className="dv-bulle dv-bulle-tous">
                                <small>
                                  {prenom}
                                  {(m ?? e)?.proche && !moi ? ` · ${PHRASES_MOTS.proche}` : ""}
                                  {aQui ? ` ${P.repondA(aQui)}` : ""}
                                  {e?.de ? ` · ${P.vuDans(e.de)}` : ""}
                                </small>
                                <span>
                                  {m && (
                                    <button type="button" className="dv-ecoute dv-ecoute-mot" data-ecouter-mot={m.q} onClick={() => ecouter(l.cle, m.src)}>
                                      {joue === l.cle ? "■" : P.ecouter} 🎙️ {PHRASES_MOTS.duree(m.duree)}
                                    </button>
                                  )}
                                  {e && <span className="dv-texte">{e.texte}</span>}
                                </span>
                                <span className="dv-actions">
                                  {!moi && (
                                    <button type="button" data-repondre={l.cle} onClick={() => setRepond({ cle: m ? cleMot(m.q) : l.cle, prenom })}>
                                      {P.repondre}
                                    </button>
                                  )}
                                  {e && moi && (
                                    <button type="button" data-effacer={e.id} onClick={() => void effacerEcrit(e.id)}>
                                      {P.effacer}
                                    </button>
                                  )}
                                  {e && !moi && (
                                    <button type="button" data-signaler={e.id} onClick={() => void signalerEcrit(e.id)}>
                                      {P.signaler}
                                    </button>
                                  )}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <form
                      className="dv-ecrire"
                      data-ecrire
                      onSubmit={(ev) => {
                        ev.preventDefault();
                        void publier(false);
                      }}
                    >
                      <span className="dv-lu">{d.tous.tranche === "jeunes" ? P.luParJeunes : P.luParTous}</span>
                      {repond && (
                        <span className="dv-repond" data-reponse-a>
                          {P.repondreA(repond.prenom).replace("…", "")}
                          <button type="button" aria-label={P.annuler} onClick={() => setRepond(null)}>
                            {P.annulerReponse}
                          </button>
                        </span>
                      )}
                      <span className="dv-champ">
                        <input value={texte} maxLength={ECRITS_VIDEO.texte} autoComplete="off" name="texte" placeholder={repond ? P.repondreA(repond.prenom) : P.ecrire} aria-label={P.ecrire} onChange={(ev) => setTexte(ev.target.value)} />
                        <button type="submit" disabled={occupe || !texte.trim()}>
                          {P.publier}
                        </button>
                      </span>
                      {accord && (
                        <span className="dv-accord" data-accord>
                          <span>{P.accord}</span>
                          <span className="dv-accord-boutons">
                            <button type="button" onClick={() => setAccord(false)}>
                              {P.annuler}
                            </button>
                            <button type="button" className="oui" data-accord-publier onClick={() => void publier(true)}>
                              {P.publier}
                            </button>
                          </span>
                        </span>
                      )}
                    </form>
                  </>
                )}
              </section>
            )}

            {leGroupe && (
              <section className="dv-fil" data-fil="groupe">
                <p className="dv-qui dv-qui-groupe">{P.quiGroupe(leGroupe.nom)}</p>
                {filGroupe.length === 0 ? (
                  <p className="dv-doux" data-rien>
                    {P.groupeVide}
                  </p>
                ) : (
                  <ul className="dv-liste">
                    {filGroupe.map((l) => {
                      const e = l.ecrit;
                      if (!e) return null;
                      const prenom = e.moi ? P.toi : e.prenom;
                      const neuf = luGroupe > 0 && !e.moi && e.le > luGroupe;
                      return (
                        <li key={l.cle} className={`dv-msg${e.moi ? " moi" : ""}${e.repond ? " rep" : ""}${neuf ? " neuf" : ""}`} {...(neuf ? { "data-neuf": "" } : {})} data-ecrit={e.id}>
                          <Tete prenom={prenom} src={e.figurine?.src} />
                          <div className="dv-bulle dv-bulle-groupe">
                            <small>
                              {prenom}
                              {e.repond ? ` ${P.repondA(e.repond.prenom)}` : ""}
                              {e.de ? ` · ${e.de}` : ""}
                            </small>
                            <span>
                              <span className="dv-texte">{e.texte}</span>
                            </span>
                            <span className="dv-actions">
                              {!e.moi && (
                                <button type="button" data-repondre={e.id} onClick={() => setRepond({ cle: e.id, prenom })}>
                                  {P.repondre}
                                </button>
                              )}
                              {e.moi && (
                                <button type="button" data-effacer={e.id} onClick={() => void effacerEcrit(e.id)}>
                                  {P.effacer}
                                </button>
                              )}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <form
                  className="dv-ecrire"
                  data-ecrire
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    void publier(true);
                  }}
                >
                  <span className="dv-lu dv-lu-groupe">{P.luParGroupe(leGroupe.nom)}</span>
                  {repond && (
                    <span className="dv-repond" data-reponse-a>
                      {P.repondreA(repond.prenom).replace("…", "")}
                      <button type="button" aria-label={P.annuler} onClick={() => setRepond(null)}>
                        {P.annulerReponse}
                      </button>
                    </span>
                  )}
                  <span className="dv-champ">
                    <input value={texte} maxLength={ECRITS_VIDEO.texte} autoComplete="off" name="texte" placeholder={repond ? P.repondreA(repond.prenom) : P.ecrire} aria-label={P.ecrire} onChange={(ev) => setTexte(ev.target.value)} />
                    <button type="submit" disabled={occupe || !texte.trim()}>
                      {P.publier}
                    </button>
                  </span>
                </form>
              </section>
            )}

            {vueCercle === "proches" && <p className="dv-pied">{P.pourEcrire}</p>}
            {feuilleSuivi && niveauOuvert && cercle && (
              <div className="dv-voile" onClick={() => setFeuilleSuivi(false)}>
                <div className="dv-feuille" role="dialog" aria-label={P.suivreTitre} data-feuille-suivi onClick={(ev) => ev.stopPropagation()}>
                  <b>{P.suivreTitre}</b>
                  {NIVEAUX_SUIVI.map((n) => (
                    <button key={n} type="button" className={`dv-niveau${niveauOuvert === n ? " on" : ""}`} data-niveau={n} onClick={() => void suivre(cercle, n)}>
                      <span>
                        {NIVEAUX[n].e} {NIVEAUX[n].nom}
                      </span>
                      <small>{NIVEAUX[n].sous}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {note && (
              <p className="dv-note" role="status" data-note>
                {note}
              </p>
            )}
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
.dv-cercle.on.dv-groupe{background:#3fbf8a;color:#fff}
.dv-qui-groupe{color:#7fe0b4}
.dv-bulle-groupe{background:rgba(63,191,138,.14)}
.dv-lu-groupe{color:#7fe0b4}
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
.dv-texte{display:block}
.dv-suivi{align-self:flex-start;margin:0 14px;border:0;border-radius:999px;padding:6px 12px;background:rgba(255,255,255,.08);color:#fbf3ea;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
.dv-suivi i{font-style:normal;opacity:.7;margin-left:4px}
.dv-proposer{display:flex;flex-direction:column;gap:8px;margin:0 14px;padding:10px 12px;border-radius:14px;background:rgba(255,210,122,.14);font-size:14px;font-weight:700}
.dv-msg.neuf .dv-bulle{box-shadow:inset 0 0 0 1.5px rgba(255,210,122,.75)}
.dv-msg.neuf .dv-bulle small::after{content:" · ${P.nouveau}";color:#ffd27a}
.dv-voile{position:fixed;inset:0;z-index:6;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,5,4,.55)}
.dv-feuille{width:100%;max-width:560px;box-sizing:border-box;display:flex;flex-direction:column;gap:8px;padding:16px 16px calc(18px + env(safe-area-inset-bottom));border-radius:22px 22px 0 0;background:#2d1f14;color:#fbf3ea}
.dv-niveau{display:flex;flex-direction:column;align-items:flex-start;gap:2px;border:1.5px solid rgba(255,255,255,.12);border-radius:14px;padding:10px 12px;background:transparent;color:#fbf3ea;font:inherit;text-align:left;cursor:pointer}
.dv-niveau span{font-weight:800;font-size:14.5px}
.dv-niveau small{color:#c9b29c;font-size:12.5px;line-height:1.35}
.dv-niveau.on{border-color:#ffd27a;background:rgba(255,210,122,.1)}
.dv-actions{display:flex;gap:4px}
.dv-actions button{border:0;background:none;padding:2px 4px;color:#c9b29c;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
.dv-ecrire{position:sticky;bottom:0;display:flex;flex-direction:column;gap:6px;margin:4px -14px 0;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:#24180f;border-top:1px solid rgba(255,255,255,.08)}
.dv-lu{font-size:12px;font-weight:800;color:#8db8ff}
.dv-repond{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#c9b29c}
.dv-repond button{border:0;border-radius:50%;width:22px;height:22px;background:rgba(255,255,255,.12);color:#fbf3ea;cursor:pointer}
.dv-champ{display:flex;gap:8px}
.dv-champ input{flex:1;min-width:0;border:0;border-radius:999px;padding:11px 14px;font:inherit;font-size:16px;background:rgba(255,255,255,.1);color:#fbf3ea}
.dv-champ input::placeholder{color:rgba(251,243,234,.55)}
.dv-champ button,.dv-accord .oui{border:0;border-radius:999px;padding:0 16px;background:#4f8ff0;color:#fff;font:inherit;font-weight:800;cursor:pointer}
.dv-champ button:disabled{opacity:.5}
.dv-accord{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border-radius:14px;background:rgba(79,143,240,.16);font-size:13.5px;line-height:1.4}
.dv-accord-boutons{display:flex;justify-content:flex-end;gap:8px}
.dv-accord-boutons button{border:0;border-radius:999px;padding:8px 14px;background:rgba(255,255,255,.12);color:#fbf3ea;font:inherit;font-weight:800;cursor:pointer}
.dv-note{position:fixed;left:50%;bottom:calc(90px + env(safe-area-inset-bottom));transform:translateX(-50%);max-width:calc(100% - 32px);margin:0;padding:10px 14px;border-radius:14px;background:#120b07;color:#fbf3ea;font-size:13.5px;box-shadow:0 8px 24px rgba(0,0,0,.5);z-index:5}
.dv-pied{margin:6px 14px 0;color:#9c8670;font-size:13px;line-height:1.4}
`;
