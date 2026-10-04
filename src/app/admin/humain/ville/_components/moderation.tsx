"use client";

// Une publication signalée, et les deux décisions possibles.
import { useState } from "react";

export type PublicationSignalee = {
  id: string;
  ville: string;
  qui: string;
  texte: string;
  photo?: string;
  visibilite: string;
  quand: string;
  signalements: number;
  masque: boolean;
  motifs: string[];
};

export function Moderation({ p }: { p: PublicationSignalee }) {
  const [etat, setEtat] = useState<"" | "envoi" | "garde" | "retire" | "erreur">("");
  const decider = async (verdict: "garde" | "retire") => {
    setEtat("envoi");
    try {
      const r = await fetch("/api/admin/direct/moderation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: p.id, verdict }),
      });
      setEtat(r.ok ? verdict : "erreur");
    } catch {
      setEtat("erreur");
    }
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <b className="text-slate-900">{p.qui}</b>
        <span>· {p.ville}</span>
        <span>· {p.quand}</span>
        <span>· {p.visibilite === "public" ? "🌍 Public" : "👥 Amis"}</span>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${p.masque ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
          {p.signalements} signalement{p.signalements > 1 ? "s" : ""}
          {p.masque ? " · masquée" : ""}
        </span>
      </header>
      <p className="mt-2 whitespace-pre-line text-slate-900">{p.texte}</p>
      {p.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.photo} alt="" className="mt-2 max-h-64 rounded-xl object-cover" />
      )}
      {p.motifs.length > 0 && <p className="mt-2 text-sm text-slate-500">Motifs : {p.motifs.join(" · ")}</p>}
      <div className="mt-3 flex gap-2">
        {etat === "garde" || etat === "retire" ? (
          <p className="text-sm font-bold text-slate-700">{etat === "garde" ? "✓ Gardée : elle est de nouveau visible." : "✓ Retirée du fil."}</p>
        ) : (
          <>
            <button
              type="button"
              disabled={etat === "envoi"}
              onClick={() => void decider("garde")}
              className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-bold text-slate-800"
            >
              Garder
            </button>
            <button
              type="button"
              disabled={etat === "envoi"}
              onClick={() => void decider("retire")}
              className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-bold text-white"
            >
              Retirer
            </button>
            {etat === "erreur" && <span className="self-center text-sm text-red-600">La décision n’est pas passée. Réessaie.</span>}
          </>
        )}
      </div>
    </article>
  );
}
