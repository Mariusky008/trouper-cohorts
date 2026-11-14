"use client";

/**
 * 🎨 L'AMBIANCE DE SON UNIVERS, À CHOISIR (`lib/direct/ambiances.ts`) — dans la conversation (celle que Pablito propose,
 * et pourquoi ; une autre d'un toucher, avant « C'est mon univers ! ») et dans ses réglages (`/univers/monde` : en
 * changer refait son décor, une retouche). La sienne en grand, les trois autres en vignettes.
 */
import { AMBIANCES, type Ambiance } from "@/lib/direct/ambiances";

export function ChoixAmbiance({
  actuelle,
  proposee,
  pourquoi,
  occupe = false,
  onChoisir,
  note,
}: {
  actuelle: Ambiance;
  proposee?: Ambiance;
  pourquoi?: string;
  occupe?: boolean;
  onChoisir: (a: Ambiance) => void;
  /** sous les vignettes (« une retouche ») */
  note?: string;
}) {
  const a = AMBIANCES.find((x) => x.cle === actuelle) ?? AMBIANCES[0];
  const fond = (c: readonly string[]) => `linear-gradient(135deg, ${c[0]}, ${c[1]})`;
  return (
    <div className="ca" data-ambiance={a.cle}>
      <style>{STYLES}</style>
      <h3 className="ca-titre">🎨 L’ambiance de ton univers</h3>
      {pourquoi && <p className="ca-pablito">{pourquoi}</p>}
      <div className="ca-grande" style={{ background: fond(a.couleurs) }}>
        <span className="ca-emoji" aria-hidden="true">
          {a.emoji}
        </span>
        <b>{a.nom}</b>
        <small>{a.dit}</small>
        {proposee === a.cle && <i className="ca-pastille">Proposée par Pablito</i>}
      </div>
      <div className="ca-autres" role="list" aria-label="Les autres ambiances">
        {AMBIANCES.filter((x) => x.cle !== a.cle).map((x) => (
          <button key={x.cle} type="button" role="listitem" className="ca-vignette" data-ambiance={x.cle} disabled={occupe} onClick={() => onChoisir(x.cle)} style={{ background: fond(x.couleurs) }} aria-label={`Choisir l’ambiance ${x.nom}`}>
            <span aria-hidden="true">{x.emoji}</span>
            <b>{x.nom}</b>
            {proposee === x.cle && <i>Pablito</i>}
          </button>
        ))}
      </div>
      {note && <p className="ca-note">{note}</p>}
    </div>
  );
}

const STYLES = `
.ca{display:flex;flex-direction:column;gap:10px;margin:6px 0}
.ca-titre{margin:0;font-size:17px}
.ca-pablito{margin:0;padding:10px 14px;border-radius:16px 16px 16px 4px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);line-height:1.4}
.ca-grande{position:relative;display:grid;gap:2px;padding:16px 16px 14px;border-radius:20px;color:#fff;text-shadow:0 1px 8px rgba(0,0,0,.35);box-shadow:0 14px 30px -16px rgba(0,0,0,.7)}
.ca-grande .ca-emoji{font-size:38px;line-height:1.1}
.ca-grande b{font-size:19px}
.ca-grande small{font-size:14px;opacity:.95}
.ca-pastille{position:absolute;right:12px;top:12px;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.92);color:#2b1a0c;font-style:normal;font-size:12px;font-weight:800;text-shadow:none}
.ca-autres{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.ca-vignette{position:relative;display:grid;justify-items:center;gap:2px;min-height:92px;padding:12px 6px 10px;border:0;border-radius:16px;color:#fff;font:inherit;font-size:12.5px;line-height:1.2;text-shadow:0 1px 6px rgba(0,0,0,.4);cursor:pointer}
.ca-vignette span{font-size:26px}
.ca-vignette i{position:absolute;left:50%;top:-8px;transform:translateX(-50%);padding:2px 8px;border-radius:999px;background:#fff;color:#2b1a0c;font-style:normal;font-size:11px;font-weight:800;text-shadow:none;white-space:nowrap}
.ca-vignette:disabled{opacity:.6}
.ca-note{margin:0;font-size:13px;opacity:.8}
`;
