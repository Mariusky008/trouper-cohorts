"use client";

// Les gestes de `/admin/humain/figurines-clients` : poser les deux images, refuser une photo, modérer un message.
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FigurineAFaire, MessageSignale as Signale } from "@/lib/direct/ma-figurine-serveur";
import { reduireImage } from "@/lib/direct/reduire-image";

async function poster(corps: Record<string, unknown>): Promise<string> {
  const r = await fetch("/api/admin/direct/figurines-clients", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  return r.ok ? "" : j.error || "Erreur.";
}

const carte: React.CSSProperties = { display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start", padding: 14, borderRadius: 12, border: "1px solid #ddd", background: "#fff" };
const vignette: React.CSSProperties = { width: 120, height: 160, objectFit: "cover", borderRadius: 10, background: "#f3e6ee" };

export function FicheFigurine({ f, demande }: { f: FigurineAFaire; demande: string }) {
  const router = useRouter();
  const [neutre, setNeutre] = useState("");
  const [parle, setParle] = useState("");
  const [raison, setRaison] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const lire = async (file: File | undefined, poser: (v: string) => void) => file && poser(await reduireImage(file, 1200, 0.92));
  async function faire(corps: Record<string, unknown>) {
    setEnvoi(true);
    setErreur(await poster(corps));
    setEnvoi(false);
    router.refresh();
  }
  return (
    <div style={carte}>
      <div>
        {f.photo ? (
          <a href={f.photo} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.photo} alt={`Photo de ${f.prenom}`} style={vignette} />
          </a>
        ) : (
          <div style={{ ...vignette, display: "grid", placeItems: "center", color: "#999" }}>pas de photo</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 240 }}>
        <b style={{ fontSize: 18 }}>{f.prenom || "Sans prénom"}</b>
        <div style={{ color: "#666", fontSize: 13 }}>
          Demandée le {demande}
          {f.prete ? " · ✅ prête" : f.refus ? ` · ❌ photo refusée : ${f.refus}` : " · ⏳ à fabriquer"}
        </div>
        {f.prete && (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.neutre} alt="Bouche fermée" style={{ ...vignette, width: 90, height: 120 }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.parle} alt="Bouche ouverte" style={{ ...vignette, width: 90, height: 120 }} />
          </div>
        )}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10, fontSize: 13 }}>
          <label>
            Bouche fermée <input type="file" accept="image/*" onChange={(e) => lire(e.target.files?.[0], setNeutre)} />
          </label>
          <label>
            Bouche ouverte <input type="file" accept="image/*" onChange={(e) => lire(e.target.files?.[0], setParle)} />
          </label>
        </div>
        <button type="button" disabled={!neutre || !parle || envoi} onClick={() => faire({ action: "poser", habitant: f.habitantId, neutre, parle })} style={{ marginTop: 8 }}>
          {f.prete ? "Remplacer ses images" : "Poser sa figurine"}
        </button>
        {!f.prete && f.photo && (
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <input value={raison} onChange={(e) => setRaison(e.target.value)} placeholder="Photo trop floue, visage caché…" maxLength={140} style={{ flex: 1 }} />
            <button type="button" disabled={envoi} onClick={() => faire({ action: "refuser", habitant: f.habitantId, raison })}>
              Refuser la photo
            </button>
          </div>
        )}
        {erreur && <p style={{ color: "#c0392b", margin: "6px 0 0" }}>{erreur}</p>}
      </div>
    </div>
  );
}

export function MessageSignale({ m, le }: { m: Signale; le: string }) {
  const router = useRouter();
  const [envoi, setEnvoi] = useState(false);
  async function moderer(geste: "remettre" | "retirer") {
    setEnvoi(true);
    await poster({ action: "moderer", id: m.id, geste });
    setEnvoi(false);
    router.refresh();
  }
  return (
    <div style={{ ...carte, alignItems: "center" }}>
      <b>{m.prenom || "Sans prénom"}</b>
      <span style={{ color: "#666", fontSize: 13 }}>signalé le {le}</span>
      <audio controls src={m.son} preload="none" />
      <button type="button" disabled={envoi} onClick={() => moderer("remettre")}>
        Remettre
      </button>
      <button type="button" disabled={envoi} onClick={() => moderer("retirer")}>
        Retirer pour de bon
      </button>
    </div>
  );
}
