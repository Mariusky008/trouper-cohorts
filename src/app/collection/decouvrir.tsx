"use client";

/**
 * 🏆 « MA COLLECTION », CE QUI L'EXPLIQUE — refait le 4 novembre 2026 (« on s'y perd, on ne sait pas quoi y faire ») :
 *   · LE COMPTE À REBOURS (`ChronoEdition`) : l'édition du mois, et le temps qui reste à la seconde ; la frise des
 *     éditions. Tout est vrai : les dates sont celles des éditions (`EDITIONS_DATEES`), aucun chiffre n'est inventé ;
 *   · CE QUE TU GAGNES (`CeQueTuGagnes`) : les deux « 10 » qu'on confondait — 10 au même commerce : sa figurine d'or ;
 *     10 en tout : ta propre figurine qui parle ; les paliers d'une collection, repliés ;
 *   · OÙ LES GAGNER (`OuGagner`) : les commerces ClikMe (`page.tsx`).
 * La figurine qui parle, le « wow » de la page, est en haut (`ma-figurine.tsx`).
 */
import { useEffect, useState, type CSSProperties } from "react";
import { EDITIONS_DATEES, PALIERS_COLLECTION, TOTAL_COLLECTION, editionsDuMoment, fenetre, finEnAnnee, jourEnClair } from "@/lib/direct/collection";
import { Particules, THEMES, type Theme } from "@/app/f/[slug]/collection";

export type CommerceACollectionner = { slug: string; nom: string; ville: string; figurine: string; cadeau?: string };

const FIGURINE_PAR_DEFAUT = "/direct/double/pied/salut-1.webp";
const OR: Theme = { a: "#FFE7A0", b: "#B8801E", parts: ["✨", "⭐", "🏆"] };

// ─── le temps qui reste ─────────────────────────────────────────────────────────────────────────
/** Le décalage de Paris (en minutes) à l'instant `t`. */
function decalageParis(t: number) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(t));
  const g = (k: string) => Number(p.find((x) => x.type === k)?.value ?? 0);
  return (Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute")) - t) / 60000;
}
/** Minuit à Paris, à la fin du jour `j` (« 2026-12-20 » → le 21 à 0 h, heure de Paris). */
function finDuJourParis(j: string) {
  const [y, m, d] = j.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d + 1);
  return t - decalageParis(t) * 60000;
}
const deux = (n: number) => String(n).padStart(2, "0");

/** Les éditions autour d'aujourd'hui : celle qui vient de finir, celle-ci, les deux suivantes. */
function frise(aujourdhui: string) {
  const an = +aujourdhui.slice(0, 4);
  const passee = EDITIONS_DATEES.flatMap((e) => [an - 1, an].map((y) => ({ e, fin: finEnAnnee(e, y) })))
    .filter((x) => x.fin < aujourdhui)
    .sort((a, b) => b.fin.localeCompare(a.fin))[0];
  const suivantes = EDITIONS_DATEES.map((e) => ({ e, f: fenetre(e, aujourdhui) }))
    .filter(({ f }) => f.debut > aujourdhui)
    .sort((a, b) => a.f.debut.localeCompare(b.f.debut))
    .slice(0, 2);
  return { passee, suivantes };
}
const ecartJours = (a: string, b: string) => Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 86_400_000);

/** L'édition du moment, le temps qui reste à la seconde, et la frise des éditions. */
export function ChronoEdition({ aujourdhui, figurine }: { aujourdhui: string; figurine?: string }) {
  const { maintenant: m } = editionsDuMoment(aujourdhui);
  const jourFin = m?.fin ?? "";
  const [reste, setReste] = useState<number | null>(null);
  useEffect(() => {
    if (!jourFin) return;
    const fin = finDuJourParis(jourFin);
    const maj = () => setReste(Math.max(0, fin - Date.now()));
    maj();
    const t = window.setInterval(maj, 1000);
    return () => window.clearInterval(t);
  }, [jourFin]);
  if (!m) return null;
  const t = THEMES[m.cle] ?? THEMES.rare;
  const fig = figurine || FIGURINE_PAR_DEFAUT;
  const { passee, suivantes } = frise(aujourdhui);
  const s = reste == null ? null : Math.floor(reste / 1000);
  const cases = [
    { v: s == null ? m.jours : Math.floor(s / 86400), l: "jours" },
    { v: s == null ? "--" : deux(Math.floor((s % 86400) / 3600)), l: "heures" },
    { v: s == null ? "--" : deux(Math.floor((s % 3600) / 60)), l: "min" },
    { v: s == null ? "--" : deux(s % 60), l: "s" },
  ];
  return (
    <section className="ce" style={{ "--a": t.a, "--b": t.b } as CSSProperties} aria-label="L’édition du moment">
      <div className="ce-haut">
        <span className="ce-carte">
          <Particules theme={t} n={8} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fig} alt="" draggable={false} />
          <em aria-hidden="true">{m.emoji}</em>
          <i className="ce-reflet" />
        </span>
        <div className="ce-texte">
          <span className="ce-ruban">● À GAGNER MAINTENANT</span>
          <b className="ce-nom">Édition {m.nom}</b>
          <span className="ce-part">Elle s’en va dans</span>
          <div className="ce-chrono" role="timer" aria-label={`Encore ${m.jours} jour${m.jours > 1 ? "s" : ""}`}>
            {cases.map((c) => (
              <span key={c.l}>
                <b>{c.v}</b>
                <small>{c.l}</small>
              </span>
            ))}
          </div>
          <p>Une visite d’ici le {jourEnClair(m.fin)}, et elle est à toi. Après, une édition manquée est manquée.</p>
        </div>
      </div>
      <ol className="ce-frise" aria-label="Les éditions">
        {passee && (
          <li className="passee">
            <span className="ce-mini">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fig} alt="" />
              <em aria-hidden="true">{passee.e.emoji}</em>
            </span>
            <b>{passee.e.nom}</b>
            <small>terminée</small>
          </li>
        )}
        <li className="maintenant">
          <span className="ce-mini">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fig} alt="" />
            <em aria-hidden="true">{m.emoji}</em>
          </span>
          <b>{m.nom}</b>
          <small>maintenant</small>
        </li>
        {suivantes.map(({ e, f }) => (
          <li key={e.cle} className="bientot" style={{ "--a": (THEMES[e.cle] ?? THEMES.rare).a, "--b": (THEMES[e.cle] ?? THEMES.rare).b } as CSSProperties}>
            <span className="ce-mini">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fig} alt="" />
              <em aria-hidden="true">🔒</em>
            </span>
            <b>
              {e.emoji} {e.nom}
            </b>
            <small>dans {ecartJours(aujourdhui, f.debut)} j</small>
          </li>
        ))}
        <li className="rare">
          <span className="ce-mini">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fig} alt="" />
            <em aria-hidden="true">✨</em>
          </span>
          <b>Rare</b>
          <small>jour de place libre</small>
        </li>
        <li className="or" style={{ "--a": OR.a, "--b": OR.b } as CSSProperties}>
          <span className="ce-mini">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fig} alt="" />
            <em aria-hidden="true">🏆</em>
          </span>
          <b>D’or</b>
          <small>la 10ᵉ</small>
        </li>
      </ol>
    </section>
  );
}

// ─── ce que tu gagnes ────────────────────────────────────────────────────────────────────────────
const GAINS = [
  { emoji: "🚪", titre: "1 visite = 1 figurine", dit: "celle du commerce, dans son édition du mois" },
  { emoji: "🏆", titre: `${TOTAL_COLLECTION} au même commerce`, dit: "sa figurine d’or, numérotée, et son cadeau" },
  { emoji: "🗣️", titre: `${TOTAL_COLLECTION} en tout`, dit: "ta propre figurine, qui parle et change de visage" },
];

export function CeQueTuGagnes() {
  return (
    <section className="dc-bloc" aria-labelledby="dc-gagnes">
      <h2 id="dc-gagnes">Ce que tu gagnes</h2>
      <ol className="dc-trois">
        {GAINS.map((e, i) => (
          <li key={e.titre} style={{ "--d": `${0.08 + i * 0.1}s` } as CSSProperties}>
            <span className="dc-ic" aria-hidden="true">
              {e.emoji}
            </span>
            <strong>{e.titre}</strong>
            <small>{e.dit}</small>
          </li>
        ))}
      </ol>
      <details className="dc-plus">
        <summary>Les paliers d’une collection</summary>
        <CeQueCaRapporte />
      </details>
    </section>
  );
}

function CeQueCaRapporte() {
  const paliers = new Map(PALIERS_COLLECTION.map((p) => [p.n, p]));
  return (
    <div className="dc-paliers-bloc">
      <div className="dc-piste" aria-hidden="true">
        {Array.from({ length: TOTAL_COLLECTION }, (_, i) => i + 1).map((n) => {
          const p = paliers.get(n);
          return (
            <span key={n} className={p ? `pal${n === TOTAL_COLLECTION ? " or" : ""}` : ""} style={{ "--d": `${n * 0.06}s` } as CSSProperties}>
              {p ? p.emoji : n}
            </span>
          );
        })}
      </div>
      <ul className="dc-paliers">
        {PALIERS_COLLECTION.map((p) => (
          <li key={p.n} className={p.n === TOTAL_COLLECTION ? "or" : ""}>
            <span aria-hidden="true">{p.emoji}</span>
            <small>{p.n} figurines</small>
            <b>{p.titre}</b>
            <span className="dc-p-dit">{p.n === TOTAL_COLLECTION ? "numérotée, et le cadeau du commerce" : p.dit}</span>
          </li>
        ))}
      </ul>
      <p className="dc-rares">✨ Et 2 éditions rares, seulement le jour où le commerce annonce une place libre.</p>
    </div>
  );
}

export function OuGagner({ commerces, titre, aujourdhui }: { commerces: CommerceACollectionner[]; titre: string; aujourdhui: string }) {
  if (!commerces.length) return null;
  const m = editionsDuMoment(aujourdhui).maintenant;
  const t = (m && THEMES[m.cle]) || THEMES.rare;
  return (
    <section className="dc-bloc" id="ou-gagner" aria-labelledby="dc-ou">
      <h2 id="dc-ou">{titre}</h2>
      <ul className="dc-commerces">
        {commerces.map((c) => (
          <li key={c.slug}>
            <a href={`/f/${encodeURIComponent(c.slug)}`} style={{ "--a": t.a, "--b": t.b } as CSSProperties}>
              <span className="dc-com-fig">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.figurine} alt="" draggable={false} loading="lazy" />
                {m && <em aria-hidden="true">{m.emoji}</em>}
              </span>
              <b>{c.nom}</b>
              {c.ville && <small>{c.ville}</small>}
              {c.cadeau && <span className="dc-com-cadeau">🎁 à 10 : {c.cadeau}</span>}
              <span className="dc-com-voir">Sa page ›</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export const STYLES_DECOUVRIR = `
.dc{padding:0 16px}
.dc-bloc{margin:34px 0 0}
.dc-bloc h2{margin:0 0 14px;font-size:24px;line-height:1.1;font-weight:900;letter-spacing:-.02em}
/* le compte à rebours */
.ce{position:relative;margin:18px 0 0;padding:16px;border-radius:28px;overflow:hidden;
  background:radial-gradient(90% 70% at 30% 0%,color-mix(in srgb,var(--a) 55%,transparent),transparent 70%),linear-gradient(160deg,color-mix(in srgb,var(--b) 80%,#000),#160611 80%);
  border:1.5px solid color-mix(in srgb,var(--a) 70%,transparent);box-shadow:0 30px 60px -30px rgba(0,0,0,.95),0 0 50px -10px color-mix(in srgb,var(--a) 45%,transparent)}
.ce-haut{display:flex;gap:16px;align-items:center}
.ce-carte{position:relative;flex:none;width:118px;height:160px;border-radius:20px;overflow:hidden;background:linear-gradient(160deg,var(--a),var(--b));border:2px solid #F2C46B;box-shadow:0 0 0 3px rgba(242,196,107,.25),0 18px 30px -12px rgba(0,0,0,.9);animation:dc-flotte 3.4s ease-in-out infinite}
.ce-carte img{position:absolute;left:8%;bottom:-2px;width:84%;height:86%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 8px 8px rgba(0,0,0,.45))}
.ce-carte em{position:absolute;left:8px;top:6px;font-style:normal;font-size:26px}
.ce-reflet{position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.55) 50%,transparent 65%);transform:translateX(-120%);animation:co-reflet 3.2s ease-in-out 1s infinite}
.ce-texte{display:flex;flex-direction:column;gap:4px;min-width:0}
.ce-ruban{align-self:flex-start;padding:3px 10px;border-radius:999px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.25);font-size:10.5px;font-weight:900;letter-spacing:.12em;white-space:nowrap}
.ce-ruban{animation:ce-clignote 1.6s ease-in-out infinite}
.ce-nom{font-size:24px;line-height:1.05;font-weight:900;letter-spacing:-.02em;text-shadow:0 2px 12px rgba(0,0,0,.45)}
.ce-part{font-size:12.5px;font-weight:700;color:rgba(255,244,230,.8)}
.ce-chrono{display:flex;gap:6px}
.ce-chrono span{display:flex;flex-direction:column;align-items:center;min-width:46px;padding:6px 4px 5px;border-radius:12px;background:rgba(0,0,0,.42);border:1px solid rgba(255,255,255,.14)}
.ce-chrono b{font-size:22px;line-height:1;font-weight:900;font-variant-numeric:tabular-nums}
.ce-chrono small{margin-top:2px;font-size:9.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,244,230,.7)}
.ce-texte p{margin:4px 0 0;font-size:12.5px;line-height:1.4;color:rgba(255,244,230,.85)}
.ce-frise{display:flex;gap:8px;margin:16px -16px -4px;padding:0 16px 6px;list-style:none;overflow-x:auto;scrollbar-width:none}
.ce-frise::-webkit-scrollbar{display:none}
.ce-frise li{flex:none;display:flex;flex-direction:column;align-items:center;gap:2px;width:72px;text-align:center}
.ce-mini{position:relative;display:block;width:60px;height:80px;border-radius:14px;overflow:hidden;background:linear-gradient(160deg,var(--a),var(--b));border:1.5px solid rgba(255,255,255,.25)}
.ce-mini img{position:absolute;left:10%;bottom:-2px;width:80%;height:86%;object-fit:contain;object-position:bottom}
.ce-mini em{position:absolute;right:4px;top:3px;font-style:normal;font-size:16px}
.ce-frise b{font-size:11.5px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:72px}
.ce-frise small{font-size:10px;font-weight:700;color:rgba(255,244,230,.65);white-space:nowrap}
.ce-frise .passee .ce-mini{filter:grayscale(1) brightness(.55)}
.ce-frise .passee b{text-decoration:line-through;color:rgba(255,244,230,.55)}
.ce-frise .maintenant .ce-mini{border:2px solid #F2C46B;box-shadow:0 0 16px rgba(242,196,107,.7)}
.ce-frise .maintenant small{color:#F2C46B}
.ce-frise .bientot .ce-mini img{filter:brightness(0);opacity:.55}
.ce-frise .rare .ce-mini{border:2px solid transparent;background:linear-gradient(135deg,#E2D6FF,#9C84FF 40%,#FF9BE0 70%,#9AF0FF) padding-box,linear-gradient(120deg,#C9B6FF,#7B5CFF,#FF7AD9,#7FE7FF,#C9B6FF) border-box;background-size:auto,300% 300%;animation:co-holo 4s linear infinite}
.ce-frise .rare .ce-mini img{filter:brightness(0);opacity:.45}
.ce-frise .or .ce-mini{border-color:#FFE7A0;box-shadow:0 0 16px rgba(255,214,120,.6)}
.ce-frise .or .ce-mini img{filter:sepia(1) saturate(3.2) hue-rotate(-12deg) brightness(1.05)}
@keyframes ce-clignote{50%{opacity:.6}}
/* comment ça marche */
.dc-trois{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0;padding:0;list-style:none}
.dc-trois li{display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 6px 12px;border-radius:20px;text-align:center;background:linear-gradient(180deg,rgba(255,46,154,.16),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.12);animation:mc-entre .5s cubic-bezier(.2,.9,.3,1) var(--d) both}
.dc-ic{position:relative;display:grid;place-items:center;width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#FF2E9A,#7B1B5E);font-size:27px;box-shadow:0 10px 20px -8px rgba(255,46,154,.8)}
.dc-ic b{position:absolute;left:-4px;top:-4px;display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#F2C46B;color:#2A1408;font-size:12px;font-weight:900}
.dc-trois strong{font-size:14px;line-height:1.15}
.dc-trois small{font-size:11.5px;line-height:1.3;color:#A88E99}
/* ce que ça rapporte */
.dc-piste{position:relative;display:grid;grid-template-columns:repeat(10,minmax(0,1fr));align-items:center;gap:4px;margin:6px 0 12px}
.dc-piste::before{content:"";position:absolute;left:4%;right:4%;top:50%;height:4px;margin-top:-2px;border-radius:2px;background:linear-gradient(90deg,#FF2E9A,#FF8FCB 55%,#F2C46B)}
.dc-piste span{position:relative;justify-self:center;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#2A1220;border:2px solid rgba(255,143,203,.6);font-size:11px;font-weight:800;color:#D9C3CB;animation:co-pop .5s cubic-bezier(.2,1.5,.4,1) var(--d) both}
.dc-piste span.pal{width:36px;height:36px;font-size:19px;background:#3A1A10;border-color:#F2C46B;box-shadow:0 0 14px rgba(242,196,107,.6)}
.dc-piste span.or{width:42px;height:42px;font-size:22px;background:linear-gradient(135deg,#FFE7A0,#B8801E);box-shadow:0 0 22px rgba(255,214,120,.8)}
.dc-paliers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0;padding:0;list-style:none}
.dc-paliers li{display:flex;flex-direction:column;align-items:center;gap:2px;padding:12px 6px;border-radius:18px;text-align:center;background:linear-gradient(180deg,rgba(242,196,107,.14),rgba(255,46,154,.05));border:1px solid rgba(242,196,107,.3)}
.dc-paliers li > span:first-child{font-size:28px;line-height:1.1}
.dc-paliers small{font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#F2C46B}
.dc-paliers b{font-size:13.5px;line-height:1.2}
.dc-p-dit{font-size:11.5px;line-height:1.3;color:#A88E99}
.dc-paliers li.or{border-color:rgba(255,214,120,.7);background:linear-gradient(180deg,rgba(255,214,120,.25),rgba(184,128,30,.08))}
.dc-rares{margin:10px 0 0;padding:10px 14px;border-radius:16px;font-size:12.5px;line-height:1.4;color:#D9C3CB;text-align:center;border:2px solid transparent;
  background:linear-gradient(#1E0C18,#1E0C18) padding-box,linear-gradient(120deg,#C9B6FF,#7B5CFF,#FF7AD9,#7FE7FF,#C9B6FF) border-box;background-size:auto,300% 300%;animation:co-holo 5s linear infinite}
/* où commencer */
.dc-commerces{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0;padding:0;list-style:none}
.dc-commerces a{position:relative;display:flex;flex-direction:column;height:100%;box-sizing:border-box;padding:10px 10px 12px;border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#FFF4E6;text-decoration:none;transition:transform .2s,border-color .2s}
.dc-commerces a:hover{border-color:rgba(255,46,154,.6);transform:translateY(-2px)}
.dc-commerces a:active{transform:scale(.97)}
.dc-com-fig{position:relative;display:block;height:118px;border-radius:14px;overflow:hidden;background:linear-gradient(160deg,var(--a),var(--b))}
.dc-com-fig img{position:absolute;left:10%;bottom:-2px;width:80%;height:92%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 6px 6px rgba(0,0,0,.45))}
.dc-com-fig em{position:absolute;right:6px;top:5px;font-style:normal;font-size:18px}
.dc-commerces b{display:block;margin-top:8px;font-size:14px;line-height:1.2;overflow-wrap:anywhere}
.dc-commerces small{display:block;font-size:12px;color:#A88E99}
.dc-com-cadeau{display:block;margin-top:6px;font-size:12px;line-height:1.3;color:#F2C46B;overflow-wrap:anywhere}
.dc-com-voir{display:block;margin-top:auto;padding-top:8px;font-size:12.5px;font-weight:800;color:#FF7AC0}
.dc-deja{margin:24px 4px 0;font-size:12.5px;line-height:1.45;color:#A88E99;text-align:center}
.dc-plus{margin:28px 0 0;border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);padding:0 14px}
.dc-plus summary{padding:14px 0;font-weight:800;cursor:pointer;list-style:none}
.dc-plus summary::-webkit-details-marker{display:none}
.dc-plus summary::after{content:"＋";float:right;color:#FF7AC0}
.dc-plus[open] summary::after{content:"－"}
.dc-plus .dc-bloc{margin:4px 0 18px}
@keyframes dc-flotte{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes dc-remplir{from{transform:scaleX(0)}}
/* l'ordinateur : la page prend la largeur */
@media (min-width:860px){
  .dc{padding:0 32px}
  .dc-bloc{margin-top:48px}
  .dc-bloc h2{font-size:32px;margin-bottom:18px}
  .ce{padding:28px 32px}
  .ce-haut{gap:32px}
  .ce-carte{width:190px;height:258px;border-radius:26px}
  .ce-carte em{font-size:36px}
  .ce-nom{font-size:44px}
  .ce-part{font-size:15px}
  .ce-chrono{gap:10px}
  .ce-chrono span{min-width:78px;padding:12px 6px 10px;border-radius:16px}
  .ce-chrono b{font-size:40px}
  .ce-chrono small{font-size:11px}
  .ce-texte p{font-size:15px;max-width:520px}
  .ce-frise{justify-content:center;gap:16px;margin:24px 0 0;padding:0}
  .ce-frise li{width:100px}
  .ce-mini{width:84px;height:112px}
  .ce-frise b{font-size:13px;max-width:100px}
  .ce-frise small{font-size:11.5px}
  .dc-trois{gap:16px}
  .dc-trois li{padding:26px 16px 22px;gap:8px}
  .dc-ic{width:76px;height:76px;font-size:38px}
  .dc-trois strong{font-size:19px}
  .dc-trois small{font-size:14px}
  .dc-piste span{width:34px;height:34px;font-size:14px}
  .dc-piste span.pal{width:52px;height:52px;font-size:27px}
  .dc-piste span.or{width:60px;height:60px;font-size:31px}
  .dc-paliers{gap:16px}
  .dc-paliers li{padding:18px 12px}
  .dc-paliers b{font-size:17px}
  .dc-p-dit{font-size:13.5px}
  .dc-rares{font-size:14px}
  .dc-commerces{grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
  .dc-com-fig{height:150px}
}
@media (prefers-reduced-motion:reduce){.dc *{animation:none!important}}
`;
