"use client";

// Espace Pro — « Avant de venir » : les questions qu'on lui pose tout le temps,
// et ce qu'il y répond. Tant qu'il n'a rien saisi, le site affiche la proposition
// de son métier ; dès qu'il enregistre, ce sont ses réponses.
//
// À signaler clairement : cette liste alimente AUSSI l'assistante. Le commerçant
// doit savoir qu'en corrigeant ici, il corrige ce qu'elle dit à sa place.
import { useEffect, useState } from "react";

type FaqItem = { q: string; a: string };

const EMPTY: FaqItem = { q: "", a: "" };

export function ProFaq({
  slug,
  token,
  suggestions = [],
}: {
  slug: string;
  token: string;
  suggestions?: FaqItem[];
}) {
  const [rows, setRows] = useState<FaqItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [mine, setMine] = useState(false); // true = les réponses du pro sont en ligne

  const call = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/site-internet/pro/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, ...body }),
    });
    return (await r.json().catch(() => ({}))) as Record<string, unknown>;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await call({ action: "get" });
        if (!cancelled && Array.isArray(j.faq) && j.faq.length) {
          setRows(j.faq as FaqItem[]);
          setMine(true);
        }
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

  const setRow = (i: number, patch: Partial<FaqItem>) => setRows((rs) => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => (rs.length >= 6 ? rs : [...rs, { ...EMPTY }]));
  const delRow = (i: number) => setRows((rs) => rs.filter((_, k) => k !== i));

  const save = async () => {
    const valid = rows.filter((r) => r.q.trim() && r.a.trim());
    if (busy) return;
    setBusy(true);
    setErr("");
    const j = await call(valid.length ? { action: "set", faq: valid } : { action: "clear" });
    setBusy(false);
    if (typeof j.error === "string") {
      setErr(j.error);
      return;
    }
    setMine(valid.length > 0);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .pfaq .a-title{font-family:var(--fd),Georgia,serif;font-weight:700;font-size:19px;}
          .pro .pfaq .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .pfaq .warn{margin-top:11px;display:flex;gap:9px;align-items:flex-start;font-size:12.5px;line-height:1.45;
            color:#6B4E12;background:#FFF7E9;border:1px solid #F6E4BD;border-radius:11px;padding:10px 12px;}
          .pro .pfaq .state{display:inline-block;margin-top:11px;font-size:12px;font-weight:700;border-radius:9px;padding:7px 11px;}
          .pro .pfaq .state.on{color:#1B7A3E;background:#E9F5EC;border:1px solid #CFE6C2;}
          .pro .pfaq .state.off{color:var(--soft);background:#F4F2EC;border:1px solid var(--hair);}
          .pro .pfaq .it{margin-top:11px;border:1px solid var(--hair);border-radius:13px;background:#fff;padding:12px;position:relative;}
          .pro .pfaq .it input,.pro .pfaq .it textarea{width:100%;border:1px solid var(--hair);border-radius:10px;padding:10px 12px;
            font-size:13.5px;font-family:inherit;background:#fff;box-sizing:border-box;line-height:1.5;}
          .pro .pfaq .it input{font-weight:700;padding-right:36px;}
          .pro .pfaq .it textarea{margin-top:8px;resize:vertical;min-height:74px;}
          .pro .pfaq .it .rm{position:absolute;top:18px;right:20px;border:none;background:none;color:var(--faint);font-size:15px;cursor:pointer;padding:2px;}
          .pro .pfaq .add{margin-top:11px;width:100%;border:1px dashed var(--hair);background:#FAF9F5;border-radius:12px;padding:12px;
            font-size:13px;font-weight:700;font-family:inherit;color:var(--soft);cursor:pointer;}
          .pro .pfaq .add:disabled{opacity:.45;cursor:not-allowed;}
          .pro .pfaq .sugbox{margin-top:12px;border:1px dashed var(--hair);background:#FAF9F5;border-radius:13px;padding:13px 14px;}
          .pro .pfaq .sugbox .sk{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);}
          .pro .pfaq .sugbox .sq{font-size:13px;color:var(--soft);margin-top:7px;line-height:1.5;}
          .pro .pfaq .sugbox button{margin-top:11px;border:1px solid var(--hair);background:#fff;border-radius:10px;padding:8px 12px;
            font-size:12.5px;font-weight:700;font-family:inherit;cursor:pointer;color:var(--ink);}
          .pro .pfaq .go{margin-top:13px;width:100%;background:var(--ink);color:#fff;border:none;border-radius:12px;padding:13px;
            font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;}
          .pro .pfaq .go:disabled{opacity:.4;cursor:not-allowed;}
          .pro .pfaq .ok{margin-top:9px;font-size:12.5px;color:#1B7A3E;font-weight:700;}
          .pro .pfaq .err{margin-top:9px;font-size:12px;color:#B23B3B;}
          `,
        }}
      />
      <div className="pfaq">
        <div className="a-title">💬 Avant de venir</div>
        <div className="a-sub">Les questions qu&apos;on vous pose souvent, et ce que vous y répondez.</div>
        <div className="warn">
          <span>⚠️</span>
          <span>
            Ces réponses sont aussi celles que <b>votre assistante donne à votre place</b>. Vérifiez qu&apos;elles sont
            exactes — surtout sur les tarifs, les paiements et les prises en charge.
          </span>
        </div>

        {loaded && (
          <div className={`state ${mine ? "on" : "off"}`}>
            {mine ? "✓ Vos réponses sont en ligne" : "○ Réponses proposées pour votre métier"}
          </div>
        )}

        {rows.map((r, i) => (
          <div className="it" key={i}>
            <input
              value={r.q}
              onChange={(e) => setRow(i, { q: e.target.value.slice(0, 120) })}
              placeholder="La question, telle qu'on vous la pose"
              aria-label={`Question ${i + 1}`}
            />
            <button type="button" className="rm" onClick={() => delRow(i)} aria-label="Supprimer">🗑</button>
            <textarea
              value={r.a}
              onChange={(e) => setRow(i, { a: e.target.value.slice(0, 400) })}
              rows={3}
              placeholder="Votre réponse"
              aria-label={`Réponse ${i + 1}`}
            />
          </div>
        ))}

        <button type="button" className="add" onClick={addRow} disabled={rows.length >= 6}>
          ＋ Ajouter une question{rows.length >= 6 ? " (6 maximum)" : ""}
        </button>

        {loaded && !mine && suggestions.length > 0 && (
          <div className="sugbox">
            <div className="sk">Proposé pour votre métier</div>
            {suggestions.map((sg) => (
              <div className="sq" key={sg.q}>
                <b>{sg.q}</b> — {sg.a}
              </div>
            ))}
            <button type="button" onClick={() => setRows(suggestions.map((sg) => ({ ...sg })))}>
              Partir de ces réponses
            </button>
          </div>
        )}

        <button className="go" onClick={save} disabled={busy}>
          {busy ? "Enregistrement…" : rows.some((r) => r.q.trim() && r.a.trim()) ? "Publier mes réponses" : "Revenir aux réponses proposées"}
        </button>
        {saved && <div className="ok">✓ C&apos;est en ligne.</div>}
        {err && <div className="err">{err}</div>}
      </div>
    </>
  );
}
