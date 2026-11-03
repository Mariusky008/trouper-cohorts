"use client";

/**
 * 🎭 L'APERÇU DE « TA PROPRE FIGURINE » — tant qu'on n'a pas la sienne, on voit ce qu'elle fera, sur celle de Léa.
 *
 * « On ne voit rien de notre propre figurine : il faudrait au moins voir celle d'un ami qui a déjà la sienne, et ce
 * qu'on peut faire avec (lui faire dire des choses, lui faire exprimer un sentiment) ; c'est ici qu'on explique les
 * avantages. » — Léa est la cliente des démos : sa figurine (`public/collection/lea-*.webp`), sa phrase « Le meilleur
 * magret de Dax ! » (voix ElevenLabs « Emma », fournie par le propriétaire : jamais une voix fabriquée ici).
 * L'APERÇU LE DIT : « Démonstration ». Rien n'y est compté ni inventé (ni écoutes, ni amis).
 *
 * LES QUATRE SENTIMENTS défilent seuls tant qu'on n'a rien touché ; un toucher les arrête sur le sien. Ce sont les
 * mêmes que dans « Ma figurine » (`SENTIMENTS`) : ce qu'on montre ici, on peut le faire une fois la sienne arrivée.
 */
import { useEffect, useState, type CSSProperties } from "react";
import { DUREE_MAX_MESSAGE, SEUIL_MA_FIGURINE, SENTIMENTS, type Sentiment } from "@/lib/direct/ma-figurine";
import { FigurineQuiParle, STYLES_FIGURINE_QUI_PARLE } from "./figurine-qui-parle";

const AVANTAGES = [
  { emoji: "🎙️", titre: "Elle parle avec ta voix", dit: `${DUREE_MAX_MESSAGE} secondes, enregistrées par toi` },
  { emoji: "🎭", titre: "Elle dit ce que tu ressens", dit: "joie, colère, tristesse, euphorie" },
  { emoji: "💌", titre: "Elle part chez tes proches", dit: "WhatsApp, SMS ou un lien" },
  { emoji: "🏪", titre: "Elle cite tes commerces préférés", dit: "ceux que tu choisis" },
];

export function ApercuFigurine({ total }: { total?: number }) {
  const [sentiment, setSentiment] = useState<Sentiment>("joie");
  const [rejoue, setRejoue] = useState(0);
  const [touche, setTouche] = useState(false);

  // tant qu'on n'a rien touché, elle passe d'un sentiment à l'autre
  useEffect(() => {
    if (touche) return;
    const t = window.setInterval(() => {
      setSentiment((s) => SENTIMENTS[(SENTIMENTS.findIndex((v) => v.cle === s) + 1) % SENTIMENTS.length].cle);
      setRejoue((n) => n + 1);
    }, 3200);
    return () => window.clearInterval(t);
  }, [touche]);

  const reste = total == null ? null : Math.max(0, SEUIL_MA_FIGURINE - total);
  return (
    <section className="af" aria-labelledby="af-titre">
      <div className="af-scene">
        <span className="af-tag">Démonstration · la figurine de Léa</span>
        <FigurineQuiParle
          neutre="/collection/lea-neutre.webp"
          parle="/collection/lea-parle.webp"
          src="/collection/lea.mp3"
          etiquette="🔊 L’écouter"
          sentiment={sentiment}
          rejoue={rejoue}
          decoupe
          className="af-fqp"
        />
        <div className="af-sentiments" role="group" aria-label="Ce qu’elle ressent">
          {SENTIMENTS.map((v) => (
            <button
              key={v.cle}
              type="button"
              className={sentiment === v.cle ? "pris" : ""}
              aria-pressed={sentiment === v.cle}
              onClick={() => {
                setTouche(true);
                setSentiment(v.cle);
                setRejoue((n) => n + 1);
              }}
            >
              <span aria-hidden="true">{v.emoji}</span>
              {v.nom}
            </button>
          ))}
        </div>
      </div>
      <div className="af-texte">
        <small>À {SEUIL_MA_FIGURINE} figurines, tous commerces confondus</small>
        <h2 id="af-titre">Ta propre figurine</h2>
        <p className="af-dit">Faite d’après ta photo. Rien qu’à toi.</p>
        <ul className="af-plus">
          {AVANTAGES.map((a, i) => (
            <li key={a.titre} style={{ "--d": `${0.08 + i * 0.08}s` } as CSSProperties}>
              <span aria-hidden="true">{a.emoji}</span>
              <span>
                <b>{a.titre}</b>
                <small>{a.dit}</small>
              </span>
            </li>
          ))}
        </ul>
        {total != null && (
          <div className="af-moi">
            <span className="af-jauge" role="progressbar" aria-valuemin={0} aria-valuemax={SEUIL_MA_FIGURINE} aria-valuenow={Math.min(total, SEUIL_MA_FIGURINE)}>
              <i style={{ width: `${Math.min(1, total / SEUIL_MA_FIGURINE) * 100}%` }} />
            </span>
            <b>
              Toi : {Math.min(total, SEUIL_MA_FIGURINE)} / {SEUIL_MA_FIGURINE}
            </b>
            <span>{reste ? `Encore ${reste} visite${reste > 1 ? "s" : ""} chez un commerce ClikMe.` : "Ta figurine t’attend !"}</span>
          </div>
        )}
      </div>
    </section>
  );
}

export const STYLES_APERCU = STYLES_FIGURINE_QUI_PARLE + `
.af{position:relative;display:grid;gap:18px;padding:18px 16px 20px;border-radius:28px;overflow:hidden;
  background:radial-gradient(90% 60% at 20% 0%,rgba(255,46,154,.28),transparent 70%),radial-gradient(70% 60% at 100% 100%,rgba(242,196,107,.2),transparent 70%),linear-gradient(160deg,#2A1222,#150711);
  border:1px solid rgba(242,196,107,.35);box-shadow:0 30px 60px -30px rgba(0,0,0,.95)}
.af-scene{display:flex;flex-direction:column;align-items:center;gap:12px}
.af-tag{padding:4px 12px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);font-size:11px;font-weight:800;letter-spacing:.06em;color:#D9C3CB}
.af-fqp .fqp-fig{width:min(250px,64vw);aspect-ratio:4/5;border-radius:26px}
.af-sentiments{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;width:100%;max-width:360px}
.af-sentiments button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 2px;border-radius:16px;border:1.5px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#FFF4E6;font:inherit;font-size:11px;font-weight:800;cursor:pointer;transition:transform .15s,background .2s}
.af-sentiments button span{font-size:26px;line-height:1.1}
.af-sentiments button.pris{background:rgba(255,46,154,.25);border-color:#FF2E9A;transform:translateY(-2px)}
.af-texte{display:flex;flex-direction:column;gap:6px}
.af-texte > small{font-size:11.5px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#F2C46B}
.af-texte h2{margin:0;font-size:30px;line-height:1.05;font-weight:900;letter-spacing:-.03em;background:linear-gradient(135deg,#fff,#FFC8E6 50%,#F2C46B);-webkit-background-clip:text;background-clip:text;color:transparent}
.af-dit{margin:0;color:#D9C3CB}
.af-plus{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0 0;padding:0;list-style:none}
.af-plus li{display:flex;flex-direction:column;gap:4px;padding:12px;border-radius:18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);animation:mc-entre .5s cubic-bezier(.2,.9,.3,1) var(--d) both}
.af-plus li > span:first-child{font-size:26px;line-height:1}
.af-plus b{display:block;font-size:14px;line-height:1.2}
.af-plus small{display:block;margin-top:2px;font-size:12px;line-height:1.3;color:#A88E99}
.af-moi{display:grid;gap:4px;margin-top:8px;padding:12px 14px;border-radius:18px;background:rgba(0,0,0,.25);border:1px dashed rgba(242,196,107,.5)}
.af-moi b{font-size:17px}
.af-moi > span:last-child{font-size:13px;color:#D9C3CB}
.af-jauge{position:relative;display:block;height:10px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
.af-jauge i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B)}
@media (min-width:860px){
  .af{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);align-items:center;gap:36px;padding:32px 40px}
  .af-fqp .fqp-fig{width:280px}
  .af-texte h2{font-size:44px}
  .af-plus li{padding:14px}
}
`;
