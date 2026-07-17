"use client";

// Espace Pro — « Fiche de mon assistante ». Le pro décrit ce que son accueil
// intelligent doit savoir (spécialités, ce qu'il ne fait pas, questions/réponses
// fréquentes). Ce contenu nourrit le prompt de l'accueil-chat → l'assistante
// répond avec SES mots, sans rien inventer. Disponible pour tous les métiers.
import { useEffect, useState } from "react";

type Faq = { q: string; a: string };

export function ProAssistant({ slug, token }: { slug: string; token: string }) {
  const [specialites, setSpecialites] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [faq, setFaq] = useState<Faq[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const call = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/site-internet/pro/assistant", {
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
        const kb = (j.kb && typeof j.kb === "object" ? j.kb : {}) as Record<string, unknown>;
        if (!cancelled) {
          setSpecialites(String(kb.specialites || ""));
          setExclusions(String(kb.exclusions || ""));
          setFaq(Array.isArray(kb.faq) ? (kb.faq as Faq[]) : []);
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

  const setFaqAt = (i: number, patch: Partial<Faq>) => setFaq((f) => f.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const addFaq = () => setFaq((f) => [...f, { q: "", a: "" }]);
  const removeFaq = (i: number) => setFaq((f) => f.filter((_, k) => k !== i));

  const save = async () => {
    setBusy(true);
    setSaved(false);
    const kb = { specialites, exclusions, faq: faq.filter((f) => f.q.trim() && f.a.trim()) };
    try {
      await call({ action: "set", kb });
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
          .pro .kb{margin-top:30px;border-top:1px solid var(--hair);padding-top:24px;}
          .pro .kb .a-title{font-family:Georgia,serif;font-weight:700;font-size:19px;}
          .pro .kb .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .kb .fld{margin-top:16px;}
          .pro .kb .fld label{display:block;font-size:12px;font-weight:700;color:var(--ink);margin-bottom:5px;}
          .pro .kb .fld .hint{font-size:11.5px;color:var(--faint);margin-bottom:7px;line-height:1.4;}
          .pro .kb textarea,.pro .kb input{width:100%;border:1px solid var(--hair);border-radius:11px;padding:11px 13px;font-size:14px;font-family:inherit;background:#fff;resize:vertical;line-height:1.5;}
          .pro .kb textarea::placeholder,.pro .kb input::placeholder{color:#C4C1B8;}
          .pro .kb .faqh{font-size:12px;font-weight:700;margin:20px 0 4px;}
          .pro .kb .qa{border:1px solid var(--hair);border-radius:12px;padding:11px;background:#fff;margin-bottom:8px;}
          .pro .kb .qa input{margin-bottom:7px;}
          .pro .kb .qa .rm{border:none;background:none;color:var(--faint);font-size:11.5px;cursor:pointer;font-family:inherit;padding:2px 0;}
          .pro .kb .addq{width:100%;border:1px dashed var(--hair);background:none;border-radius:11px;padding:10px;font-size:13px;font-weight:600;color:var(--soft);cursor:pointer;font-family:inherit;}
          .pro .kb .savebtn{margin-top:16px;width:100%;background:var(--ink);color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;}
          .pro .kb .savebtn:disabled{opacity:.5;cursor:not-allowed;}
          `,
        }}
      />
      <div className="kb">
        <div className="a-title">🧠 Fiche de mon assistante</div>
        <div className="a-sub">
          Dites à votre accueil intelligent ce qu&apos;il doit savoir. Il répondra à vos clients avec <b>vos mots</b> —
          et jamais rien qui ne soit écrit ici.
        </div>

        <div className="fld">
          <label>Mes spécialités / ce que je fais</label>
          <div className="hint">Prestations, produits, ce qui vous distingue. Ex. « Gâteaux personnalisés, décors animaux, sans gluten sur commande (48 h). »</div>
          <textarea rows={4} value={specialites} onChange={(e) => setSpecialites(e.target.value)} placeholder="Décrivez ce que vous proposez…" />
        </div>

        <div className="fld">
          <label>Ce que je ne fais pas (optionnel)</label>
          <div className="hint">Pour éviter les fausses attentes. Ex. « Pas de livraison. Pas de pièce montée. »</div>
          <textarea rows={2} value={exclusions} onChange={(e) => setExclusions(e.target.value)} placeholder="Ce que vous ne proposez pas…" />
        </div>

        <div className="faqh">Questions fréquentes</div>
        {faq.map((f, i) => (
          <div className="qa" key={i}>
            <input value={f.q} onChange={(e) => setFaqAt(i, { q: e.target.value })} placeholder="Question — ex. « Faites-vous des gâteaux sans gluten ? »" />
            <input value={f.a} onChange={(e) => setFaqAt(i, { a: e.target.value })} placeholder="Réponse — ex. « Oui, sur commande 48 h à l'avance. »" />
            <button className="rm" onClick={() => removeFaq(i)}>Retirer</button>
          </div>
        ))}
        <button className="addq" onClick={addFaq}>+ Ajouter une question / réponse</button>

        <button className="savebtn" onClick={save} disabled={busy || !loaded}>
          {busy ? "Enregistrement…" : saved ? "✓ Enregistré" : "Enregistrer la fiche"}
        </button>
      </div>
    </>
  );
}
