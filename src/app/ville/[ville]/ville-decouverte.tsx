"use client";

// « Découvrir les commerces de {ville} » — le mode plein écran, une fiche à la fois.
//
// Pourquoi ici et pas sur les annonces : une annonce est périssable, on la LIT et
// on y va — un paquet de cartes ferait perdre du temps. Les commerces, eux, sont
// un stock à parcourir : c'est exactement ce que le geste sert.
//
// Le geste est réel : la carte suit le doigt, penche, et part si on la lâche
// assez loin. Boutons et flèches du clavier font la même chose, pour qui n'a pas
// d'écran tactile ou n'aime pas deviner.
//
// HONNÊTETÉ : aucun « like », aucun compteur d'intérêt, aucun match. On ne
// fabrique pas d'engagement qui n'existe pas — la seule action utile est d'aller
// voir le commerce. Les notes affichées sont les vraies notes Google.
import { useCallback, useEffect, useRef, useState } from "react";

export type Fiche = {
  slug: string;
  nom: string;
  metier: string;
  photo: string | null;
  note: number | null;
  avis: number | null;
  /** Annonce en cours, si le commerce en a une. */
  texte: string;
  /** Ancienneté de l'annonce (« il y a 2 h »). */
  quand: string;
};

/** Au-delà de ce déplacement horizontal, la carte part au relâchement. */
const SEUIL = 90;

export function VilleDecouverte({ ville, fiches }: { ville: string; fiches: Fiche[] }) {
  const [ouvert, setOuvert] = useState(false);
  const [i, setI] = useState(0);
  // Déplacement en cours du doigt, et sens de sortie une fois lâchée.
  const [dx, setDx] = useState(0);
  const [sortie, setSortie] = useState<0 | 1 | -1>(0);
  // Doigt posé : la carte suit sans transition. Relâché : elle glisse (retour ou envol).
  const [glisse, setGlisse] = useState(false);
  const depart = useRef<number | null>(null);

  const total = fiches.length;
  const fini = i >= total;

  /**
   * `pas` = +1 pour avancer, -1 pour revenir. Le sens de l'envol suit le geste :
   * on pousse la carte vers la gauche pour passer à la suivante, vers la droite
   * pour revenir — comme le doigt.
   */
  const avance = useCallback(
    (pas: 1 | -1) => {
      if (depart.current !== null) return;
      setSortie(pas === 1 ? -1 : 1);
      window.setTimeout(() => {
        setSortie(0);
        setDx(0);
        setI((n) => Math.max(0, n + pas));
      }, 260);
    },
    []
  );

  // Clavier : flèches pour avancer, Échap pour sortir. Le mode plein écran doit
  // se piloter sans souris.
  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
      else if (e.key === "ArrowRight") avance(1);
      else if (e.key === "ArrowLeft") avance(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ouvert, avance]);

  // Le fond ne doit pas défiler pendant qu'on parcourt les cartes.
  useEffect(() => {
    if (!ouvert) return;
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = avant;
    };
  }, [ouvert]);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (sortie) return;
    depart.current = e.clientX;
    setGlisse(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (depart.current === null) return;
    setDx(e.clientX - depart.current);
  };
  const onUp = () => {
    const d = dx;
    depart.current = null;
    setGlisse(false);
    // Vers la gauche : la suivante. Vers la droite : la précédente.
    if (Math.abs(d) > SEUIL) avance(d < 0 ? 1 : -1);
    else setDx(0); // pas assez loin : la carte revient à sa place
  };

  const ouvre = () => {
    setI(0);
    setDx(0);
    setSortie(0);
    setGlisse(false);
    setOuvert(true);
  };

  if (!total) return null;

  const f = fiches[i];
  // Position de la carte : le doigt pendant le geste, un envol après.
  const dep = sortie ? sortie * 520 : dx;
  const rot = dep / 26;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .vil .vdec-open{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;margin-top:16px;
            border:none;border-radius:15px;padding:15px;font-family:inherit;font-size:14.5px;font-weight:800;cursor:pointer;
            color:#0B2A20;background:linear-gradient(120deg,#7FE6C0,#4FD2A6);
            box-shadow:0 16px 34px -18px rgba(127,230,192,.85);}
          .vil .vdec-open:active{transform:translateY(1px);}

          .vdec{position:fixed;inset:0;z-index:90;display:flex;flex-direction:column;
            background:radial-gradient(120% 80% at 50% 0%,#1A2033 0%,#0B0F1A 60%,#070A11 100%);
            color:#EAF0FA;font-family:'Inter',system-ui,sans-serif;padding:calc(14px + env(safe-area-inset-top)) 16px
            calc(18px + env(safe-area-inset-bottom));animation:vdecIn .3s ease;}
          .vdec *{box-sizing:border-box;}
          @keyframes vdecIn{from{opacity:0}to{opacity:1}}
          .vdec .hd{display:flex;align-items:center;gap:12px;}
          .vdec .hd .t{flex:1;min-width:0;font-size:13px;font-weight:800;letter-spacing:.02em;}
          .vdec .hd .t span{display:block;font-size:11px;font-weight:600;color:#7B8291;margin-top:2px;}
          .vdec .x{flex:none;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.16);
            background:rgba(255,255,255,.06);color:#EAF0FA;font-size:17px;cursor:pointer;font-family:inherit;}
          .vdec .bar{height:4px;border-radius:999px;background:rgba(255,255,255,.1);margin-top:12px;overflow:hidden;}
          .vdec .bar i{display:block;height:100%;background:#7FE6C0;border-radius:999px;transition:width .3s ease;}

          .vdec .stage{flex:1;position:relative;display:flex;align-items:center;justify-content:center;padding:14px 0;}
          /* La carte suivante reste visible dessous : on comprend qu'il y en a d'autres. */
          .vdec .ghost{position:absolute;width:100%;max-width:400px;height:100%;max-height:520px;border-radius:24px;
            background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);transform:scale(.94) translateY(14px);}
          .vdec .card{position:relative;width:100%;max-width:400px;height:100%;max-height:520px;border-radius:24px;
            overflow:hidden;background:linear-gradient(160deg,#243049,#0F1524);border:1px solid rgba(255,255,255,.14);
            box-shadow:0 40px 80px -30px rgba(0,0,0,.85);cursor:grab;touch-action:pan-y;user-select:none;}
          .vdec .card.go{transition:transform .26s cubic-bezier(.4,0,1,1),opacity .26s ease;opacity:0;}
          .vdec .card.back{transition:transform .3s cubic-bezier(.22,1,.36,1);}
          /* La photo est superposée à un dégradé : si elle ne charge pas, la carte
             reste présentable au lieu de devenir un rectangle vide. */
          .vdec .ph{position:absolute;inset:0;background-size:cover;background-position:center;}
          .vdec .ph::after{content:"";position:absolute;inset:0;
            background:linear-gradient(180deg,rgba(8,11,18,.15) 0%,rgba(8,11,18,.55) 52%,rgba(8,11,18,.96) 100%);}
          /* Sans photo Google, les trois quarts de la carte restaient un aplat vide.
             On y met l'initiale du commerce : rien d'inventé, et la carte tient. */
          .vdec .mono{position:absolute;left:0;right:0;top:0;height:62%;display:flex;align-items:center;
            justify-content:center;font-family:Georgia,serif;font-size:150px;line-height:1;font-weight:600;
            color:rgba(255,255,255,.09);user-select:none;}
          .vdec .bd{position:absolute;left:0;right:0;bottom:0;padding:20px 18px 18px;}
          .vdec .mt{display:inline-block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;
            color:#0B2A20;background:#7FE6C0;border-radius:6px;padding:4px 9px;}
          .vdec .nm{font-family:Georgia,serif;font-size:27px;font-weight:600;line-height:1.12;margin-top:11px;color:#fff;}
          .vdec .rt{font-size:13px;color:#C6CCD8;margin-top:7px;}
          .vdec .rt b{color:#F0B429;}
          .vdec .an{margin-top:13px;border-radius:14px;padding:12px 13px;background:rgba(127,230,192,.13);
            border:1px solid rgba(127,230,192,.32);}
          .vdec .an-k{font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;color:#7FE6C0;}
          .vdec .an-t{font-size:14px;line-height:1.45;color:#EAF0FA;margin-top:6px;}
          .vdec .an-w{font-size:10.5px;color:#8B93A6;margin-top:6px;}
          .vdec .cta{display:block;text-align:center;text-decoration:none;margin-top:14px;border-radius:13px;padding:13px;
            font-size:14px;font-weight:800;color:#0B2A20;background:#7FE6C0;}
          .vdec .cta:active{transform:translateY(1px);}

          .vdec .ft{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:6px;}
          .vdec .ft button{width:56px;height:56px;border-radius:50%;border:1px solid rgba(255,255,255,.18);
            background:rgba(255,255,255,.07);color:#EAF0FA;font-size:21px;cursor:pointer;font-family:inherit;}
          .vdec .ft button:active{transform:scale(.93);}
          .vdec .ft button:disabled{opacity:.3;cursor:not-allowed;}
          .vdec .hint{text-align:center;font-size:11.5px;color:#6F7684;margin-top:9px;}

          .vdec .end{text-align:center;max-width:340px;}
          .vdec .end .e{font-size:42px;}
          .vdec .end h3{font-family:Georgia,serif;font-size:24px;font-weight:600;margin-top:12px;}
          .vdec .end p{font-size:13.5px;line-height:1.6;color:#A8AEBC;margin-top:10px;}
          .vdec .end .again{margin-top:18px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);
            color:#fff;border-radius:13px;padding:13px 20px;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;}
          @media (prefers-reduced-motion:reduce){.vdec,.vdec .card{animation:none;transition:none;}}
          `,
        }}
      />

      <button type="button" className="vdec-open" onClick={ouvre}>
        🔎 Découvrir les {total} commerce{total > 1 ? "s" : ""} de {ville}
      </button>

      {ouvert && (
        <div className="vdec" role="dialog" aria-modal="true" aria-label={`Découvrir les commerces de ${ville}`}>
          <div className="hd">
            <div className="t">
              Les commerces de {ville}
              <span>{fini ? `${total} sur ${total}` : `${i + 1} sur ${total}`}</span>
            </div>
            <button type="button" className="x" onClick={() => setOuvert(false)} aria-label="Fermer">
              ✕
            </button>
          </div>
          <div className="bar">
            <i style={{ width: `${Math.round((Math.min(i + (fini ? 0 : 1), total) / total) * 100)}%` }} />
          </div>

          <div className="stage">
            {fini ? (
              <div className="end">
                <div className="e">👋</div>
                <h3>Vous les avez tous vus.</h3>
                <p>
                  {total} commerce{total > 1 ? "s" : ""} à {ville}. Le catalogue s&apos;agrandit à mesure que
                  d&apos;autres mettent leur site en ligne.
                </p>
                <button type="button" className="again" onClick={() => setI(0)}>
                  Recommencer
                </button>
              </div>
            ) : (
              <>
                {i + 1 < total && <div className="ghost" aria-hidden="true" />}
                <div
                  className={`card${sortie ? " go" : glisse ? "" : " back"}`}
                  style={{ transform: `translateX(${dep}px) rotate(${rot}deg)` }}
                  onPointerDown={onDown}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  onPointerCancel={onUp}
                >
                  <div
                    className="ph"
                    style={{
                      backgroundImage: f.photo
                        ? `url("${f.photo}")`
                        : "linear-gradient(150deg,#2C3A5E,#141A2E)",
                    }}
                  />
                  {!f.photo && (
                    <div className="mono" aria-hidden="true">
                      {f.nom.trim().slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="bd">
                    <span className="mt">{f.metier}</span>
                    <div className="nm">{f.nom}</div>
                    {f.note != null && f.avis != null && f.avis > 0 && (
                      <div className="rt">
                        <b>★</b> {f.note.toFixed(1).replace(".", ",")} · {f.avis} avis Google
                      </div>
                    )}
                    {f.texte && (
                      <div className="an">
                        <div className="an-k">✦ En ce moment</div>
                        <div className="an-t">{f.texte}</div>
                        {f.quand && <div className="an-w">{f.quand}</div>}
                      </div>
                    )}
                    <a className="cta" href={`/site-internet/apercu/${f.slug}?via=catalogue`}>
                      Voir {f.nom.length > 22 ? "ce commerce" : f.nom} →
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>

          {!fini && (
            <>
              <div className="ft">
                <button type="button" onClick={() => avance(-1)} disabled={i === 0} aria-label="Commerce précédent">
                  ‹
                </button>
                <button type="button" onClick={() => avance(1)} aria-label="Commerce suivant">
                  ›
                </button>
              </div>
              <div className="hint">Faites glisser la carte, ou utilisez les flèches.</div>
            </>
          )}
        </div>
      )}
    </>
  );
}
