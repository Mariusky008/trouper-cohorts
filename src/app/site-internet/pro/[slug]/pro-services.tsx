"use client";

// Espace Pro — « Mes accompagnements » : le pro saisit ses VRAIES prestations
// (nom, durée, tarif, description). C'est cette liste qui s'affiche sur le site
// publié — jamais de tarif inventé en ligne. Tant que la liste est vide, la
// section du site montre des exemples (côté maquette) ; une fois remplie, ce
// sont les vraies prestations. Un bouton « Partir des exemples » pré-remplit
// avec les suggestions du métier, que le pro ajuste.
import { useEffect, useState } from "react";

type Service = { name: string; duration: string; price: string; desc: string };
type Suggestion = { name: string; duration?: string; price?: string; desc?: string };

const EMPTY: Service = { name: "", duration: "", price: "", desc: "" };

export function ProServices({
  slug,
  token,
  suggestions = [],
}: {
  slug: string;
  token: string;
  suggestions?: Suggestion[];
}) {
  const [rows, setRows] = useState<Service[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const call = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/site-internet/pro/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, ...body }),
    });
    return (await r.json().catch(() => ({}))) as Record<string, unknown>;
  };

  const norm = (s: Suggestion): Service => ({
    name: s.name || "",
    duration: s.duration || "",
    price: s.price || "",
    desc: s.desc || "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await call({ action: "get" });
        if (!cancelled && Array.isArray(j.services)) setRows((j.services as Suggestion[]).map(norm));
      } catch {
        /* best-effort */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, token]);

  const setRow = (i: number, patch: Partial<Service>) =>
    setRows((rs) => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, { ...EMPTY }]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, k) => k !== i));
  const move = (i: number, d: number) =>
    setRows((rs) => {
      const j = i + d;
      if (j < 0 || j >= rs.length) return rs;
      const next = [...rs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const fillFromSuggestions = () => setRows(suggestions.map(norm));

  const save = async () => {
    setBusy(true);
    setSaved(false);
    const services = rows
      .map((r) => ({ name: r.name.trim(), duration: r.duration.trim(), price: r.price.trim(), desc: r.desc.trim() }))
      .filter((r) => r.name.length > 0);
    try {
      const j = await call({ action: "set", services });
      if (Array.isArray(j.services)) setRows((j.services as Suggestion[]).map(norm));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch {
      /* best-effort */
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .svc{margin-top:6px;}
          .pro .svc .a-title{font-family:Georgia,serif;font-weight:700;font-size:19px;}
          .pro .svc .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .svc .row{border:1px solid var(--hair);border-radius:13px;padding:12px;background:#fff;margin-top:11px;}
          .pro .svc .row .l1{display:flex;gap:8px;}
          .pro .svc .row .l1 input.n{flex:1;min-width:0;}
          .pro .svc .row input,.pro .svc .row textarea{border:1px solid var(--hair);border-radius:9px;padding:9px 11px;font-size:13px;font-family:inherit;background:#fff;width:100%;}
          .pro .svc .row .l2{display:flex;gap:8px;margin-top:8px;}
          .pro .svc .row .l2 input{flex:1;min-width:0;}
          .pro .svc .row textarea{margin-top:8px;resize:vertical;min-height:38px;line-height:1.4;}
          .pro .svc .row .l3{display:flex;align-items:center;gap:6px;margin-top:9px;}
          .pro .svc .row .l3 .mv{border:1px solid var(--hair);background:#fff;color:var(--soft);border-radius:8px;width:30px;height:30px;font-size:14px;cursor:pointer;font-family:inherit;}
          .pro .svc .row .l3 .mv:disabled{opacity:.35;cursor:not-allowed;}
          .pro .svc .row .l3 .del{margin-left:auto;border:1px solid var(--hair);background:none;color:#B4453C;border-radius:9px;padding:6px 11px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}
          .pro .svc .add{margin-top:11px;width:100%;border:1px dashed var(--hair);background:none;color:var(--soft);border-radius:12px;padding:12px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit;}
          .pro .svc .tip{margin-top:12px;background:#F7F5EF;border:1px solid var(--hair);border-radius:12px;padding:12px 14px;font-size:12.5px;color:var(--soft);line-height:1.5;}
          .pro .svc .tip button{margin-top:8px;border:1px solid var(--ink);background:var(--ink);color:#fff;border-radius:10px;padding:8px 13px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;}
          .pro .svc .savebtn{margin-top:16px;width:100%;background:var(--ink);color:#fff;border:none;border-radius:12px;padding:14px;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;}
          .pro .svc .savebtn:disabled{opacity:.5;cursor:not-allowed;}
          .pro .svc .none{font-size:13px;color:var(--faint);line-height:1.45;margin-top:11px;}
          `,
        }}
      />
      <div className="svc">
        <div className="a-title">📋 Mes accompagnements</div>
        <div className="a-sub">
          Vos prestations avec durée et tarif : c&apos;est le « menu » que vos client·es voient avant de réserver.
          Tant que c&apos;est vide, votre site montre des exemples ; dès que vous remplissez, ce sont vos vraies offres.
        </div>

        {loaded && rows.length === 0 && (
          <div className="none">Aucune prestation pour l&apos;instant.</div>
        )}

        {suggestions.length > 0 && rows.length === 0 && (
          <div className="tip">
            Envie d&apos;aller vite ? Partez des exemples adaptés à votre métier, puis ajustez les tarifs.
            <br />
            <button type="button" onClick={fillFromSuggestions}>Partir des exemples</button>
          </div>
        )}

        {rows.map((r, i) => (
          <div className="row" key={i}>
            <div className="l1">
              <input
                className="n"
                value={r.name}
                onChange={(e) => setRow(i, { name: e.target.value })}
                placeholder="Nom de la prestation"
                autoComplete="off"
              />
            </div>
            <div className="l2">
              <input
                value={r.duration}
                onChange={(e) => setRow(i, { duration: e.target.value })}
                placeholder="Durée (ex. 1 h 15)"
                autoComplete="off"
              />
              <input
                value={r.price}
                onChange={(e) => setRow(i, { price: e.target.value })}
                placeholder="Tarif (ex. 60 €)"
                autoComplete="off"
              />
            </div>
            <textarea
              value={r.desc}
              onChange={(e) => setRow(i, { desc: e.target.value })}
              placeholder="Description (facultatif)"
            />
            <div className="l3">
              <button className="mv" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter">↑</button>
              <button className="mv" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Descendre">↓</button>
              <button className="del" onClick={() => removeRow(i)}>Supprimer</button>
            </div>
          </div>
        ))}

        <button className="add" onClick={addRow}>+ Ajouter une prestation</button>

        <button className="savebtn" onClick={save} disabled={busy}>
          {busy ? "Enregistrement…" : saved ? "✓ Enregistré" : "Enregistrer mes prestations"}
        </button>
      </div>
    </>
  );
}
