"use client";

// Espace Pro — « Mon approche » : le paragraphe qui parle du commerçant, à la
// première personne, sur son propre site.
//
// Il venait d'un gabarit par métier et partait en ligne sans qu'il l'ait lu. On
// continue à le PROPOSER — c'est utile, personne n'a envie de partir d'une page
// blanche — mais tant qu'il ne l'a pas validé, la section n'apparaît pas sur son
// site publié. Le bouton dit donc exactement ce qu'il fait : publier ce texte.
import { useEffect, useState } from "react";

type Approche = { titre: string; corps: string; validated_at: string | null };

export function ProApproche({
  slug,
  token,
  suggestionTitre,
  suggestionCorps,
}: {
  slug: string;
  token: string;
  suggestionTitre: string;
  suggestionCorps: string;
}) {
  const [titre, setTitre] = useState(suggestionTitre);
  const [corps, setCorps] = useState("");
  const [live, setLive] = useState<Approche | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  const call = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/site-internet/pro/approche", {
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
        const a = (j.approche ?? null) as Approche | null;
        if (!cancelled && a) {
          setLive(a);
          setTitre(a.titre);
          setCorps(a.corps);
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

  const save = async () => {
    if (!corps.trim() || busy) return;
    setBusy(true);
    setErr("");
    const j = await call({ action: "set", approche: { titre: titre.trim() || suggestionTitre, corps: corps.trim() } });
    setBusy(false);
    if (typeof j.error === "string") {
      setErr(j.error);
      return;
    }
    setLive((j.approche ?? null) as Approche | null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  const remove = async () => {
    setBusy(true);
    await call({ action: "clear" });
    setBusy(false);
    setLive(null);
  };

  const dirty = live ? titre.trim() !== live.titre || corps.trim() !== live.corps : Boolean(corps.trim());

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .appr .a-title{font-family:Georgia,serif;font-weight:700;font-size:19px;}
          .pro .appr .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .appr .state{display:inline-flex;align-items:center;gap:7px;margin-top:12px;font-size:12px;font-weight:700;
            border-radius:9px;padding:7px 11px;}
          .pro .appr .state.on{color:#1B7A3E;background:#E9F5EC;border:1px solid #CFE6C2;}
          .pro .appr .state.off{color:#8A6A12;background:#FFF7E9;border:1px solid #F6E4BD;}
          .pro .appr .sug{margin-top:14px;border:1px dashed var(--hair);background:#FAF9F5;border-radius:13px;padding:13px 14px;}
          .pro .appr .sug .sk{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);}
          .pro .appr .sug .sp{font-size:13.5px;line-height:1.55;color:var(--soft);margin-top:6px;font-style:italic;}
          .pro .appr .sug button{margin-top:11px;border:1px solid var(--hair);background:#fff;border-radius:10px;padding:8px 12px;
            font-size:12.5px;font-weight:700;font-family:inherit;cursor:pointer;color:var(--ink);}
          .pro .appr label{display:block;margin-top:15px;font-size:12px;font-weight:700;color:var(--soft);}
          .pro .appr input,.pro .appr textarea{width:100%;margin-top:6px;border:1px solid var(--hair);border-radius:11px;
            padding:11px 13px;font-size:14px;font-family:inherit;background:#fff;line-height:1.5;box-sizing:border-box;}
          .pro .appr textarea{resize:vertical;min-height:110px;}
          .pro .appr .cnt{font-size:11px;color:var(--faint);margin-top:5px;text-align:right;}
          .pro .appr .go{margin-top:13px;width:100%;background:var(--ink);color:#fff;border:none;border-radius:12px;padding:13px;
            font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;}
          .pro .appr .go:disabled{opacity:.4;cursor:not-allowed;}
          .pro .appr .rm{margin-top:9px;width:100%;background:none;border:none;color:var(--faint);font-size:12.5px;
            font-family:inherit;cursor:pointer;text-decoration:underline;padding:5px;}
          .pro .appr .ok{margin-top:9px;font-size:12.5px;color:#1B7A3E;font-weight:700;}
          .pro .appr .err{margin-top:9px;font-size:12px;color:#B23B3B;}
          `,
        }}
      />
      <div className="appr">
        <div className="a-title">✍️ Mon approche</div>
        <div className="a-sub">
          Le paragraphe qui vous présente, sur votre site. Il parle en votre nom&nbsp;: tant que vous ne l&apos;avez pas
          publié, cette section n&apos;apparaît pas.
        </div>

        {loaded && (
          <div className={`state ${live ? "on" : "off"}`}>
            {live ? "✓ Publié sur votre site" : "○ Pas encore publié — section absente du site"}
          </div>
        )}

        {suggestionCorps && (
          <div className="sug">
            <div className="sk">Proposition à relire</div>
            <div className="sp">« {suggestionCorps} »</div>
            <button type="button" onClick={() => { setTitre(suggestionTitre); setCorps(suggestionCorps); }}>
              Partir de ce texte
            </button>
          </div>
        )}

        <label htmlFor="appr-t">Titre de la section</label>
        <input id="appr-t" value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={80} placeholder="Ex. Un moment pour vous" />

        <label htmlFor="appr-c">Votre texte</label>
        <textarea
          id="appr-c"
          value={corps}
          onChange={(e) => setCorps(e.target.value.slice(0, 700))}
          rows={5}
          placeholder="Dites simplement comment vous travaillez, et ce que vos client·es trouvent chez vous."
        />
        <div className="cnt">{corps.length}/700</div>

        <button className="go" onClick={save} disabled={!corps.trim() || busy || (!dirty && Boolean(live))}>
          {busy ? "Enregistrement…" : live ? "Mettre à jour sur mon site" : "Publier sur mon site"}
        </button>
        {live && (
          <button type="button" className="rm" onClick={remove} disabled={busy}>
            Retirer cette section de mon site
          </button>
        )}
        {saved && <div className="ok">✓ C&apos;est en ligne.</div>}
        {err && <div className="err">{err}</div>}
      </div>
    </>
  );
}
