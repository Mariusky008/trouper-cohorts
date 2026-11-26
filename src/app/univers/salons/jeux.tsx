"use client";

/**
 * 🙋 LES JEUX DU SALON, À L'ÉCRAN (26 novembre 2026 ; `lib/direct/jeux-salon.ts` ; `docs/univers/decouvrir.md`,
 * section 41 ; la maquette validée : https://claude.ai/artifact/ABjUPW9VGQVqzdDDmPLFea).
 *
 * - `FeuilleAccord` : lancer « Qui est d'accord ? » (sa phrase, ou un des trois débuts) ;
 * - `CarteDuJeu` : la carte sous la pièce — on vote 👍 / 👎 (30 s, le temps qui reste en barre), puis le résultat : les
 *   têtes de chaque camp, sans chiffre ni pourcentage ; elle s'en va seule ;
 * - `PancarteDeJeu` : au-dessus de chaque figurine qui a voté, son 👍 / 👎 ; au résultat, 😎 pour le camp le plus
 *   fourni, 🤷 pour l'autre (rien en cas d'égalité).
 */
import { useState } from "react";
import type { CSSProperties } from "react";
import type { PresentSalon } from "@/lib/direct/salons-ouverts";
import { DEBUTS_ACCORD, JEUX_SALON, PHRASES_JEUX as PJ, campGagnant, etapeDuJeu, type JeuVu, type VoteJeu } from "@/lib/direct/jeux-salon";

/** Ce qui flotte au-dessus de sa figurine (rien : il n'a pas voté, ou égalité au résultat). */
export function voteAffiche(jeu: JeuVu, q: string, ms: number): string | null {
  if (jeu.sorte === "defi") return panneauDuDefi(jeu, q, ms);
  const v = jeu.votes[q];
  if (!v || !ms) return null;
  const etape = etapeDuJeu(jeu, ms);
  if (etape === "vote") return v === "oui" ? "👍" : "👎";
  if (etape === "resultat") {
    const g = campGagnant(jeu.votes);
    return g === "egalite" || !g ? null : v === g ? "😎" : "🤷";
  }
  return null;
}

/** 🎯 Le défi : 🎯 au-dessus du lanceur, 🔒 au-dessus de ceux qui ont répondu (en secret) ; au résultat, « +10 ». */
function panneauDuDefi(jeu: JeuVu, q: string, ms: number): string | null {
  if (!ms) return null;
  const etape = etapeDuJeu(jeu, ms);
  if (etape === "resultat") return jeu.points?.[q] ? `+${jeu.points[q]}` : null;
  if (etape === "fini" || jeu.pasMaintenant) return null;
  if (q === jeu.de) return "🎯";
  return jeu.repondu?.includes(q) || jeu.votes[q] ? "🔒" : null;
}

export function PancarteDeJeu({ e, q, style }: { e: string; q: string; style: CSSProperties }) {
  return (
    <span className={`sj-pancarte${e === "👍" ? " oui" : e === "👎" ? " non" : e.startsWith("+") ? " points" : ""}`} data-vote-de={q} data-vote={e} style={style} aria-hidden="true">
      {e}
    </span>
  );
}

function Tete({ p }: { p?: PresentSalon }) {
  const src = p?.tete?.src ?? p?.figurine?.src;
  return (
    <i className="sj-tete" title={p?.prenom}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt={p?.prenom ?? ""} /> : <b>{(p?.prenom ?? "?").slice(0, 1)}</b>}
    </i>
  );
}

type ActionsDuJeu = { onVoter: (v: VoteJeu) => void; onPasMaintenant?: () => void; onTemoigner?: (v: VoteJeu) => void };

export function CarteDuJeu({ jeu, moi, ms, presents, onVoter, onPasMaintenant, onTemoigner }: { jeu: JeuVu; moi: string; ms: number; presents: PresentSalon[] } & ActionsDuJeu) {
  if (jeu.sorte === "defi") return <CarteDuDefi jeu={jeu} moi={moi} ms={ms} presents={presents} onVoter={onVoter} onPasMaintenant={onPasMaintenant} onTemoigner={onTemoigner} />;
  const etape = etapeDuJeu(jeu, ms);
  const mien = jeu.votes[moi];
  const de = (q: string) => presents.find((p) => p.q === q);
  const camp = (v: VoteJeu) => Object.entries(jeu.votes).filter(([, x]) => x === v).map(([q]) => q);
  const reste = Math.max(0, Math.ceil((jeu.fin - ms) / 1000));
  const g = campGagnant(jeu.votes);
  return (
    <div className="sj-carte" data-jeu={jeu.id} data-etape={etape} role="group" aria-label={PJ.accord}>
      <style>{STYLES_JEUX}</style>
      <small>{etape === "vote" ? (jeu.de === moi ? PJ.tuDemandes : PJ.demande(jeu.prenom)) : PJ.resultat}</small>
      <p className="sj-phrase">« {jeu.texte} »</p>
      {etape === "vote" ? (
        <>
          <div className="sj-choix">
            <button type="button" className={`sj-oui${mien === "oui" ? " choisi" : ""}`} aria-pressed={mien === "oui"} data-voter="oui" onClick={() => onVoter("oui")}>
              {PJ.daccord}
            </button>
            <button type="button" className={`sj-non${mien === "non" ? " choisi" : ""}`} aria-pressed={mien === "non"} data-voter="non" onClick={() => onVoter("non")}>
              {PJ.pasDaccord}
            </button>
          </div>
          <div className="sj-temps" aria-label={`${reste} s`}>
            <div style={{ width: `${Math.max(0, Math.min(100, ((jeu.fin - ms) / JEUX_SALON.voteMs) * 100))}%` }} />
          </div>
          {mien && <small data-a-vote>{PJ.aVote}</small>}
        </>
      ) : !g ? (
        <small data-personne>{PJ.personne}</small>
      ) : (
        <>
          <div className="sj-camps" data-gagnant={g}>
            {(["oui", "non"] as const).map((v) => (
              <div key={v} className={`sj-camp${g === v ? " gagne" : ""}`} data-camp={v}>
                <b>{v === "oui" ? PJ.campOui : PJ.campNon}</b>
                <span>
                  {camp(v).map((q) => (
                    <Tete key={q} p={de(q)} />
                  ))}
                </span>
              </div>
            ))}
          </div>
          {g === "egalite" && <small data-egalite>{PJ.egalite}</small>}
        </>
      )}
    </div>
  );
}

/** 🎯 La carte du défi : répondre (le défié d'abord), le moment de vérité, le résultat. */
function CarteDuDefi({ jeu, moi, ms, presents, onVoter, onPasMaintenant, onTemoigner }: { jeu: JeuVu; moi: string; ms: number; presents: PresentSalon[] } & ActionsDuJeu) {
  const etape = etapeDuJeu(jeu, ms);
  const a = jeu.a ?? "";
  const aPrenom = jeu.aPrenom ?? "";
  const mien = jeu.votes[moi];
  const aRepondu = Boolean(jeu.repondu?.includes(a));
  const de = (q: string) => presents.find((p) => p.q === q);
  const reste = Math.max(0, Math.ceil((jeu.fin - ms) / 1000));
  const titre = moi === a ? PJ.teDefie(jeu.prenom) : moi === jeu.de ? PJ.tuDefies(aPrenom) : PJ.defie(jeu.prenom, aPrenom);
  const temoin = jeu.temoins?.[moi];
  // (le moment de vérité : d'autres que les deux joueurs sont là, ou pas)
  const autres = presents.some((p) => p.q !== a && p.q !== jeu.de);
  let corps: React.ReactNode = null;
  if (etape === "vote") {
    const ouvert = moi !== a && moi !== jeu.de && (aRepondu || ms >= jeu.debut + JEUX_SALON.reponseMs);
    const boutons = (
      <div className="sj-choix">
        <button type="button" className={`sj-oui${mien === "oui" ? " choisi" : ""}`} aria-pressed={mien === "oui"} data-voter="oui" onClick={() => onVoter("oui")}>
          {PJ.oui}
        </button>
        <button type="button" className={`sj-non${mien === "non" ? " choisi" : ""}`} aria-pressed={mien === "non"} data-voter="non" onClick={() => onVoter("non")}>
          {PJ.non}
        </button>
        {moi === a && !mien && onPasMaintenant && (
          <button type="button" className="sj-gris" data-pas-maintenant onClick={onPasMaintenant}>
            {PJ.pasMaintenant}
          </button>
        )}
      </div>
    );
    corps =
      moi === a ? (
        <>
          {boutons}
          <small>{mien ? PJ.gardee : PJ.reglesDefie(jeu.prenom)}</small>
        </>
      ) : moi === jeu.de ? (
        <small data-attente>{aRepondu ? `✓ ${PJ.aRepondu(aPrenom)}` : PJ.reflechit(aPrenom)}</small>
      ) : ouvert ? (
        <>
          {aRepondu && <small>✓ {PJ.aRepondu(aPrenom)}</small>}
          {boutons}
          <small>{PJ.tenter}</small>
        </>
      ) : (
        <small data-attente>{PJ.reflechit(aPrenom)}</small>
      );
  } else if (etape === "verite") {
    corps = temoin ? (
      <small data-merci>{PJ.merciTemoin}</small>
    ) : (
      <>
        <div className="sj-choix">
          <button type="button" className="sj-oui" data-temoigner="oui" onClick={() => onTemoigner?.("oui")}>
            {PJ.veriteOui}
          </button>
          <button type="button" className="sj-non" data-temoigner="non" onClick={() => onTemoigner?.("non")}>
            {PJ.veriteNon}
          </button>
        </div>
        <small>{autres ? PJ.veriteSous : PJ.veriteSousSeuls}</small>
      </>
    );
  } else {
    const r = jeu.votes[a];
    const camp = (v: VoteJeu) => Object.entries(jeu.votes).filter(([, x]) => x === v).map(([q]) => q);
    corps = jeu.pasMaintenant ? (
      <small data-pas-maintenant-dit>{PJ.aDitPasMaintenant(aPrenom)}</small>
    ) : !r ? (
      <small data-sans-reponse>{PJ.pasRepondu(aPrenom)}</small>
    ) : !jeu.verdict ? (
      <small data-sans-verdict>{PJ.sansVerdict}</small>
    ) : (
      <>
        <p className="sj-phrase" data-issue={r === jeu.verdict ? "trouve" : "rate"}>
          {r === jeu.verdict ? PJ.aTrouve(aPrenom) : PJ.rate(aPrenom, jeu.prenom)}
        </p>
        <div className="sj-camps" data-verdict={jeu.verdict}>
          {(["oui", "non"] as const).map((v) => (
            <div key={v} className={`sj-camp${jeu.verdict === v ? " gagne" : ""}`} data-camp={v}>
              <b>{v === "oui" ? PJ.oui : PJ.non}</b>
              <span>
                {camp(v).map((q) => (
                  <Tete key={q} p={de(q)} />
                ))}
              </span>
            </div>
          ))}
        </div>
      </>
    );
  }
  return (
    <div className="sj-carte sj-defi" data-jeu={jeu.id} data-etape={etape} data-sorte="defi" role="group" aria-label={PJ.defi}>
      <style>{STYLES_JEUX}</style>
      <small>{etape === "verite" ? PJ.verite : titre}</small>
      <p className="sj-phrase">« {jeu.texte} »</p>
      {corps}
      {etape === "vote" && (
        <>
          <small>{PJ.reponseDans(reste)}</small>
          <div className="sj-temps">
            <div style={{ width: `${Math.max(0, Math.min(100, ((jeu.fin - ms) / Math.max(1, jeu.fin - jeu.debut)) * 100))}%` }} />
          </div>
        </>
      )}
    </div>
  );
}

/** 🎯 Lancer un défi : qui (s'il n'est pas déjà choisi), la question, quand on le saura. */
export function FeuilleDefi({
  presents,
  choisi,
  relue,
  reste,
  onLancer,
  onAnnuler,
}: {
  presents: PresentSalon[];
  choisi?: string;
  relue: boolean;
  /** Les secondes qui restent à la vidéo (0 : on ne sait pas). */
  reste: number;
  onLancer: (a: string, texte: string, quand: number | "fin") => Promise<string | null>;
  onAnnuler: () => void;
}) {
  const [a, setA] = useState(choisi ?? "");
  const [texte, setTexte] = useState("");
  const quands = [...JEUX_SALON.quandS.filter((x) => !reste || reste >= x), ...(reste >= JEUX_SALON.finMinS && reste <= JEUX_SALON.finMaxS ? (["fin"] as const) : [])];
  const [quand, setQuand] = useState<number | "fin" | null>(quands[0] ?? null);
  const [refus, setRefus] = useState("");
  const [occupe, setOccupe] = useState(false);
  const qui = presents.find((p) => p.q === a);
  return (
    <form
      className="sj-feuille"
      data-feuille-defi
      onSubmit={async (e) => {
        e.preventDefault();
        if (!a || !texte.trim() || quand === null || occupe) return;
        setOccupe(true);
        setRefus("");
        const r = await onLancer(a, texte.trim(), quand);
        setOccupe(false);
        if (r) setRefus(r);
      }}
    >
      <style>{STYLES_JEUX}</style>
      <h2>{qui ? PJ.defier(qui.prenom) : PJ.defi}</h2>
      {!choisi && (
        <>
          <small>{PJ.defiChoisir}</small>
          {presents.length ? (
            <div className="sj-debuts" data-qui>
              {presents.map((p) => (
                <button key={p.q} type="button" className={a === p.q ? "pris" : ""} aria-pressed={a === p.q} data-defier={p.q} onClick={() => setA(p.q)}>
                  {p.prenom}
                </button>
              ))}
            </div>
          ) : (
            <small>{PJ.defiPersonne}</small>
          )}
        </>
      )}
      <input value={texte} maxLength={JEUX_SALON.texteMax} placeholder={PJ.defiPlace} aria-label={PJ.defiPlace} name="question" autoComplete="off" onChange={(e) => setTexte(e.target.value)} />
      <small>{PJ.defiSous}</small>
      <small>{PJ.onLeSaura}</small>
      {quands.length ? (
        <div className="sj-debuts" data-quand>
          {quands.map((x) => (
            <button key={String(x)} type="button" className={quand === x ? "pris" : ""} aria-pressed={quand === x} data-quand-choix={String(x)} onClick={() => setQuand(x)}>
              {x === "fin" ? PJ.aLaFin : PJ.dans(x)}
            </button>
          ))}
        </div>
      ) : (
        <small>{PJ.videoFinit}</small>
      )}
      <small>{relue ? PJ.relue : PJ.relueSeance}</small>
      {refus && (
        <p className="so-refus" role="alert" data-refus-jeu>
          {refus}
        </p>
      )}
      <div className="sj-boutons">
        <button type="button" className="so-bouton petit doux" onClick={onAnnuler}>
          {PJ.annuler}
        </button>
        <button type="submit" className="so-bouton petit" disabled={occupe || !a || !texte.trim() || quand === null} data-lancer-defi>
          {PJ.lancerDefi}
        </button>
      </div>
    </form>
  );
}

export function FeuilleAccord({ relue, onLancer, onAnnuler }: { relue: boolean; onLancer: (texte: string) => Promise<string | null>; onAnnuler: () => void }) {
  const [texte, setTexte] = useState("");
  const [refus, setRefus] = useState("");
  const [occupe, setOccupe] = useState(false);
  return (
    <form
      className="sj-feuille"
      data-feuille-accord
      onSubmit={async (e) => {
        e.preventDefault();
        if (!texte.trim() || occupe) return;
        setOccupe(true);
        setRefus("");
        const r = await onLancer(texte.trim());
        setOccupe(false);
        if (r) setRefus(r);
      }}
    >
      <style>{STYLES_JEUX}</style>
      <h2>{PJ.accord}</h2>
      <p className="so-chapo">{PJ.accordChapo}</p>
      <input value={texte} maxLength={JEUX_SALON.texteMax} placeholder={PJ.accordPlace} aria-label={PJ.accordPlace} name="phrase" autoComplete="off" onChange={(e) => setTexte(e.target.value)} />
      <div className="sj-debuts">
        {DEBUTS_ACCORD.map((d) => (
          <button key={d} type="button" data-debut onClick={() => setTexte(d)}>
            {d}
          </button>
        ))}
      </div>
      <small>{relue ? PJ.relue : PJ.relueSeance}</small>
      {refus && (
        <p className="so-refus" role="alert" data-refus-jeu>
          {refus}
        </p>
      )}
      <div className="sj-boutons">
        <button type="button" className="so-bouton petit doux" onClick={onAnnuler}>
          {PJ.annuler}
        </button>
        <button type="submit" className="so-bouton petit" disabled={occupe || !texte.trim()} data-lancer>
          {PJ.lancer}
        </button>
      </div>
    </form>
  );
}

const STYLES_JEUX = `
.sj-carte{margin:0 0 10px;padding:10px 12px;border-radius:16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);display:flex;flex-direction:column;gap:8px}
.sj-carte small{font-size:12px;opacity:.75;font-weight:700}
.sj-phrase{margin:0;font-weight:900;font-size:16px;line-height:1.25}
.sj-choix{display:flex;gap:8px}
.sj-choix button{flex:1;border:0;border-radius:12px;padding:10px 6px;font:inherit;font-weight:900;font-size:14px;cursor:pointer;color:#10241a;background:#53d89a;opacity:.92}
.sj-choix button.sj-non{background:#ff7a8a;color:#2b0b10}
.sj-choix button.choisi{opacity:1;box-shadow:0 0 0 3px #FFF4E6}
.sj-temps{height:4px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden}
.sj-temps div{height:100%;background:#FF2E9A;transition:width .5s linear}
.sj-camps{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.sj-camp{border-radius:12px;padding:6px 8px;background:rgba(255,255,255,.05);display:flex;flex-direction:column;gap:4px}
.sj-camp.gagne{background:rgba(83,216,154,.16)}
.sj-camp b{font-size:12.5px}
.sj-camp span{display:flex;flex-wrap:wrap;gap:4px}
.sj-tete{width:28px;height:28px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.15);display:inline-flex;align-items:center;justify-content:center;font-style:normal}
.sj-tete img{width:100%;height:auto;object-fit:cover;object-position:top}
.sj-tete b{font-size:13px}
.sj-pancarte{position:absolute;transform:translateX(-50%);pointer-events:none;background:#FFF4E6;color:#2a0f1f;border-radius:8px;padding:1px 6px;font-size:17px;box-shadow:0 3px 0 rgba(0,0,0,.35);animation:sj-leve .35s ease-out}
.sj-pancarte.oui{background:#53d89a}
.sj-pancarte.non{background:#ff7a8a}
@keyframes sj-leve{from{transform:translate(-50%,8px);opacity:0}to{transform:translate(-50%,0);opacity:1}}
.sj-feuille{display:flex;flex-direction:column;gap:10px}
.sj-feuille h2{margin:0}
.sj-feuille input{border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.25);color:inherit;padding:11px 12px;font:inherit;font-size:16px}
.sj-feuille small{opacity:.7;font-size:12px}
.sj-debuts{display:flex;flex-wrap:wrap;gap:6px}
.sj-debuts button.pris{background:#FF9F43;color:#2b1600}
.sj-defi{border-color:rgba(255,159,67,.6)}
.sj-choix button.sj-gris{background:transparent;border:1px solid rgba(255,255,255,.25);color:inherit;opacity:1}
.sj-pancarte.points{background:#F2C46B;font-weight:900;font-size:15px}
.sj-debuts button{border:0;border-radius:999px;padding:6px 11px;background:rgba(255,255,255,.1);color:inherit;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.sj-boutons{display:flex;justify-content:flex-end;gap:8px}
@media (prefers-reduced-motion:reduce){.sj-pancarte{animation:none}.sj-temps div{transition:none}}
`;
