"use client";

// Bouton admin « Mise en ligne » : passe le prospect en CLIENT (retire l'habillage
// démo du site public), enregistre le domaine perso éventuel, et affiche les 2
// liens à transmettre : l'Espace Pro (court) et l'URL publique du site.
import { useState } from "react";

type State = { published: boolean; customDomain: string | null; proUrl: string; publicUrl: string };

export function PublishButton({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [st, setSt] = useState<State | null>(null);
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const call = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/admin/humain/site-internet/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, ...body }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `Erreur ${r.status}`);
    return j as State & { ok: boolean };
  };

  const load = async (body: Record<string, unknown> = {}) => {
    setBusy(true);
    setErr("");
    try {
      const j = await call(body);
      setSt({ published: j.published, customDomain: j.customDomain, proUrl: j.proUrl, publicUrl: j.publicUrl });
      setDomain(j.customDomain || "");
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  const openPanel = async () => {
    setOpen(true);
    if (!st) await load();
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Copié :\n\n" + url);
    } catch {
      prompt("Copiez le lien :", url);
    }
  };

  if (!open) {
    return (
      <button onClick={openPanel} disabled={busy} title="Publier / passer en client" style={btn("#1B7A3E")}>
        🚀 Mise en ligne
      </button>
    );
  }

  return (
    <div style={{ border: "1px solid #E1DED4", borderRadius: 10, padding: 12, background: "#fff", minWidth: 280, maxWidth: 360 }}>
      {err && <div style={{ color: "#B23B3B", fontSize: 12, marginBottom: 8 }}>{err}</div>}
      {!st ? (
        <div style={{ fontSize: 13, color: "#666" }}>Chargement…</div>
      ) : (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            État : {st.published ? <span style={{ color: "#1B7A3E" }}>● En ligne (client)</span> : <span style={{ color: "#9A6A1A" }}>○ Démo</span>}
          </div>

          <button onClick={() => load({ published: !st.published })} disabled={busy} style={{ ...btn(st.published ? "#9A3B3B" : "#1B7A3E"), width: "100%", marginBottom: 10 }}>
            {busy ? "…" : st.published ? "Repasser en démo" : "✅ Publier (passer en client)"}
          </button>

          <label style={{ fontSize: 11, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Domaine du commerçant (optionnel)</label>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="salon-elodie.fr" style={{ flex: 1, border: "1px solid #DDD", borderRadius: 7, padding: "7px 9px", fontSize: 13 }} />
            <button onClick={() => load({ custom_domain: domain })} disabled={busy} style={btn("#3A3A32")}>OK</button>
          </div>

          <div style={{ borderTop: "1px solid #EEE", paddingTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
            <LinkRow label="🔑 Espace Pro (à lui envoyer)" url={st.proUrl} onCopy={copy} />
            <LinkRow label="🌐 Site public" url={st.publicUrl} onCopy={copy} />
          </div>
        </>
      )}
      <button onClick={() => setOpen(false)} style={{ ...btn("#EEE", "#333"), marginTop: 10, width: "100%" }}>Fermer</button>
    </div>
  );
}

function LinkRow({ label, url, onCopy }: { label: string; url: string; onCopy: (u: string) => void }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#777", marginBottom: 2 }}>{label}</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <code style={{ flex: 1, fontSize: 11, background: "#F5F4EF", padding: "5px 7px", borderRadius: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</code>
        <button onClick={() => onCopy(url)} style={btn("#3A3A32")}>Copier</button>
      </div>
    </div>
  );
}

function btn(bg: string, color = "#fff"): React.CSSProperties {
  return { background: bg, color, border: "none", padding: "7px 12px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" };
}
