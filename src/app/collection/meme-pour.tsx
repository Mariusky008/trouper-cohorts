"use client";

/**
 * 🎭 LE MÈME POUR UN PROCHE — la nouvelle interface, lot 4 (la maquette validée le 13 novembre 2026 : le mème « qu'on
 * pourrait envoyer sur WhatsApp ou dans un des messages de la page Chez moi »).
 *
 *   · 🎭 dans une conversation retient pour qui il est (`retenirMemePour`, le temps de cette visite), puis ouvre le studio ;
 *     « ＋ Nouveau › Créer un mème » l'oublie (il le choisira) ;
 *   · son mème prêt, sous « Partager » : « 🎭 Envoyer à Léa » (ou un proche à choisir) — il part dans leur conversation
 *     (`POST /api/direct/proches { action: "meme", cle, id }`), Léa est prévenue ; « Voir notre conversation » y mène.
 *
 * FICHIER NAVIGATEUR.
 */
import { useEffect, useState } from "react";
import type { ProcheVivant } from "@/lib/direct/talkie";
import { ouvrirConversation } from "./rituel";

const CLE = "clikme-meme-pour";
export type MemePour = { cle: string; prenom: string };

/** Pour qui est le prochain mème (ou personne : il choisira). */
export function retenirMemePour(x: MemePour | null) {
  try {
    if (x) window.sessionStorage.setItem(CLE, JSON.stringify(x));
    else window.sessionStorage.removeItem(CLE);
  } catch {
    /* rien */
  }
}
function lireMemePour(): MemePour | null {
  try {
    const v = JSON.parse(window.sessionStorage.getItem(CLE) ?? "null") as Partial<MemePour> | null;
    return v && typeof v.cle === "string" && typeof v.prenom === "string" ? { cle: v.cle, prenom: v.prenom } : null;
  } catch {
    return null;
  }
}

/** 🎭 Sous son mème prêt : l'envoyer à un proche, dans leur conversation. Sans proche : rien. */
export function EnvoyerAUnProche({ id }: { id: string }) {
  const [pour, setPour] = useState<MemePour | null>(null);
  const [proches, setProches] = useState<ProcheVivant[] | null>(null);
  const [choisir, setChoisir] = useState(false);
  const [parti, setParti] = useState<MemePour | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");
  useEffect(() => {
    let fini = false;
    void Promise.resolve().then(() => !fini && setPour(lireMemePour()));
    fetch("/api/direct/proches", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { proches?: ProcheVivant[] }) => !fini && setProches((j.proches ?? []).filter((p) => p.lien === "proches")))
      .catch(() => !fini && setProches([]));
    return () => {
      fini = true;
    };
  }, []);
  // (un autre mème : on peut le renvoyer)
  useEffect(() => {
    void Promise.resolve().then(() => setParti(null));
  }, [id]);

  async function envoyer(x: MemePour) {
    setOccupe(true);
    setErreur("");
    try {
      const r = await fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "meme", cle: x.cle, id }) });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok || j.error) throw new Error(j.error || "Ça n’a pas marché. Réessaie.");
      setParti(x);
      setChoisir(false);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setOccupe(false);
    }
  }
  function voir(x: MemePour) {
    retenirMemePour(null);
    window.location.hash = "#proches";
    ouvrirConversation(x.cle);
  }

  if (!proches || (!proches.length && !pour)) return null;
  if (parti)
    return (
      <div className="mp-bloc" role="status">
        <p className="mp-parti">✓ Envoyé à {parti.prenom} : il est dans votre conversation.</p>
        <button type="button" className="mp-bouton clair" onClick={() => voir(parti)}>
          💬 Voir notre conversation
        </button>
      </div>
    );
  const liste = proches.filter((p) => p.cle !== pour?.cle);
  return (
    <div className="mp-bloc">
      {pour && (
        <button type="button" className="mp-bouton" disabled={occupe} onClick={() => void envoyer(pour)}>
          🎭 Envoyer à {pour.prenom}
        </button>
      )}
      {liste.length > 0 &&
        (pour && !choisir ? (
          <button type="button" className="mp-lien" onClick={() => setChoisir(true)}>
            ou à un autre proche
          </button>
        ) : (
          <>
            <p className="mp-titre">{pour ? "À un autre proche" : "🎭 L’envoyer à un proche"}</p>
            <div className="mp-qui">
              {liste.map((p) => (
                <button key={p.cle} type="button" disabled={occupe} onClick={() => void envoyer({ cle: p.cle, prenom: p.prenom })} aria-label={`Envoyer à ${p.prenom}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" draggable={false} />
                  {p.prenom}
                </button>
              ))}
            </div>
          </>
        ))}
      {erreur && (
        <p className="mp-erreur" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}

export const STYLES_MEME_POUR = `
.mp-bloc{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.mp-bouton{display:flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 18px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:16.5px;font-weight:900;cursor:pointer;box-shadow:0 10px 24px -10px rgba(255,46,154,.9)}
.mp-bouton.clair{background:rgba(255,255,255,.08);box-shadow:none;border:1px solid rgba(255,255,255,.14)}
.mp-bouton:disabled{opacity:.6}
.mp-lien{align-self:center;border:0;background:none;color:#CDB4C0;font:inherit;font-size:14px;font-weight:700;text-decoration:underline;cursor:pointer}
.mp-titre{margin:4px 2px 0;font-size:13px;font-weight:800;color:#CDB4C0}
.mp-qui{display:flex;gap:12px;overflow-x:auto;padding:2px;scrollbar-width:none}
.mp-qui button{flex:none;display:flex;flex-direction:column;align-items:center;gap:4px;width:62px;padding:0;border:0;background:none;color:#FFF4E6;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}
.mp-qui img{width:54px;height:54px;border-radius:50%;object-fit:cover;object-position:50% 14%;background:#3a1630}
.mp-parti{margin:0;padding:10px 12px;border-radius:14px;background:rgba(61,220,132,.12);color:#BFF5D6;font-weight:800;font-size:14px}
.mp-erreur{margin:0;color:#FFB4A8;font-size:13.5px}
`;
