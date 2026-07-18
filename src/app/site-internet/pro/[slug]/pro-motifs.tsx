"use client";

// Espace Pro — « Pour quoi venir me voir ? » : le pro gère les motifs affichés
// sur son site (icône, titre, description courte). Le clic sur un motif ouvre
// l'accueil pré-qualifié sur ce motif. Tant que c'est vide, le site montre les
// motifs proposés par la config métier ; dès qu'il en saisit, ce sont les siens.
import { useEffect, useState } from "react";

type UseCase = { icon: string; title: string; desc: string };
type Suggestion = { icon?: string; title?: string; desc?: string };

const EMPTY: UseCase = { icon: "🔹", title: "", desc: "" };

export function ProMotifs({
  slug,
  token,
  suggestions = [],
}: {
  slug: string;
  token: string;
  suggestions?: Suggestion[];
}) {
  const [rows, setRows] = useState<UseCase[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const call = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/site-internet/pro/motifs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, ...body }),
    });
    return (await r.json().catch(() => ({}))) as Record<string, unknown>;
  };

  const norm = (s: Suggestion): UseCase => ({ icon: s.icon || "🔹", title: s.title || "", desc: s.desc || "" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await call({ action: "get" });
        if (!cancelled && Array.isArray(j.usecases)) setRows((j.usecases as Suggestion[]).map(norm));
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

  const setRow = (i: number, patch: Partial<UseCase>) => setRows((rs) => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)));
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
    const usecases = rows
      .map((r) => ({ icon: (r.icon || "🔹").trim(), title: r.title.trim(), desc: r.desc.trim() }))
      .filter((r) => r.title.length > 0);
    try {
      const j = await call({ action: "set", usecases });
      if (Array.isArray(j.usecases)) setRows((j.usecases as Suggestion[]).map(norm));
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
          .pro .mtf{margin-top:6px;}
          .pro .mtf .a-title{font-family:Georgia,serif;font-weight:700;font-size:19px;}
          .pro .mtf .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .mtf .row{border:1px solid var(--hair);border-radius:13px;padding:12px;background:#fff;margin-top:11px;}
          .pro .mtf .l1{display:flex;gap:8px;}
          .pro .mtf .l1 input.ic{width:56px;flex:none;text-align:center;font-size:18px;}
          .pro .mtf .l1 input.t{flex:1;min-width:0;}
          .pro .mtf input,.pro .mtf textarea{border:1px solid var(--hair);border-radius:9px;padding:9px 11px;font-size:13px;font-family:inherit;background:#fff;width:100%;}
          .pro .mtf textarea{margin-top:8px;resize:vertical;min-height:38px;line-height:1.4;}
          .pro .mtf .l3{display:flex;align-items:center;gap:6px;margin-top:9px;}
          .pro .mtf .l3 .mv{border:1px solid var(--hair);background:#fff;color:var(--soft);border-radius:8px;width:30px;height:30px;font-size:14px;cursor:pointer;font-family:inherit;}
          .pro .mtf .l3 .mv:disabled{opacity:.35;cursor:not-allowed;}
          .pro .mtf .l3 .del{margin-left:auto;border:1px solid var(--hair);background:none;color:#B4453C;border-radius:9px;padding:6px 11px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}
          .pro .mtf .add{margin-top:11px;width:100%;border:1px dashed var(--hair);background:none;color:var(--soft);border-radius:12px;padding:12px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit;}
          .pro .mtf .tip{margin-top:12px;background:#F7F5EF;border:1px solid var(--hair);border-radius:12px;padding:12px 14px;font-size:12.5px;color:var(--soft);line-height:1.5;}
          .pro .mtf .tip button{margin-top:8px;border:1px solid var(--ink);background:var(--ink);color:#fff;border-radius:10px;padding:8px 13px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;}
          .pro .mtf .savebtn{margin-top:16px;width:100%;background:var(--ink);color:#fff;border:none;border-radius:12px;padding:14px;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;}
          .pro .mtf .savebtn:disabled{opacity:.5;cursor:not-allowed;}
          .pro .mtf .none{font-size:13px;color:var(--faint);line-height:1.45;margin-top:11px;}
          `,
        }}
      />
      <div className="mtf">
        <div className="a-title">🧭 Pour quoi venir me voir&nbsp;?</div>
        <div className="a-sub">
          Les situations pour lesquelles vos client·es viennent (stress, douleurs, sommeil…). Sur votre site,
          chaque motif est cliquable&nbsp;: l&apos;accueil répond et prépare le rendez-vous. Vide&nbsp;: votre site
          montre des exemples&nbsp;; dès que vous remplissez, ce sont les vôtres.
        </div>

        {loaded && rows.length === 0 && <div className="none">Aucun motif pour l&apos;instant.</div>}

        {suggestions.length > 0 && rows.length === 0 && (
          <div className="tip">
            Partez des motifs proposés pour votre métier, puis reformulez avec vos mots.
            <br />
            <button type="button" onClick={fillFromSuggestions}>Partir des exemples</button>
          </div>
        )}

        {rows.map((r, i) => (
          <div className="row" key={i}>
            <div className="l1">
              <input
                className="ic"
                value={r.icon}
                onChange={(e) => setRow(i, { icon: e.target.value })}
                placeholder="🔹"
                aria-label="Icône"
              />
              <input
                className="t"
                value={r.title}
                onChange={(e) => setRow(i, { title: e.target.value })}
                placeholder="Titre (ex. Stress & burn-out)"
                autoComplete="off"
              />
            </div>
            <textarea
              value={r.desc}
              onChange={(e) => setRow(i, { desc: e.target.value })}
              placeholder="Petite description (facultatif)"
            />
            <div className="l3">
              <button className="mv" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter">↑</button>
              <button className="mv" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Descendre">↓</button>
              <button className="del" onClick={() => removeRow(i)}>Supprimer</button>
            </div>
          </div>
        ))}

        <button className="add" onClick={addRow}>+ Ajouter un motif</button>

        <button className="savebtn" onClick={save} disabled={busy}>
          {busy ? "Enregistrement…" : saved ? "✓ Enregistré" : "Enregistrer mes motifs"}
        </button>
      </div>
    </>
  );
}
