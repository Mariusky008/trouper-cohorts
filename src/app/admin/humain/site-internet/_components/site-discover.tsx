"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Candidate = {
  name: string;
  address: string;
  rating: number | null;
  reviews: number | null;
  website: string;
  hasSite: boolean;
  variant: "A" | "B";
  competitors: Array<{ name: string; note: string }>;
};

function trim(v: string) {
  return String(v || "").trim();
}

export function SiteDiscover() {
  const router = useRouter();
  const [ville, setVille] = useState("");
  const [activite, setActivite] = useState("");
  const [maxRating, setMaxRating] = useState("");
  const [status, setStatus] = useState<"idle" | "searching" | "creating">("idle");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const canSearch = Boolean(trim(ville) && trim(activite) && status === "idle");

  const search = async () => {
    if (!canSearch) return;
    setStatus("searching");
    setError("");
    setNote("");
    setCandidates([]);
    setSelected({});
    try {
      const res = await fetch("/api/admin/humain/site-internet/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ville: trim(ville), activite: trim(activite), maxRating: maxRating || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(trim(json?.error) || "Erreur de recherche.");
        return;
      }
      const list: Candidate[] = Array.isArray(json.candidates) ? json.candidates : [];
      setCandidates(list);
      // Pré-coche les cibles sans site (les plus évidentes).
      const pre: Record<string, boolean> = {};
      list.forEach((c) => { if (!c.hasSite) pre[c.name] = true; });
      setSelected(pre);
      if (list.length === 0) setNote(trim(json?.error) || "Aucun commerce trouvé pour ce secteur.");
    } catch {
      setError("Erreur réseau.");
    } finally {
      setStatus("idle");
    }
  };

  const toggle = (name: string) => setSelected((p) => ({ ...p, [name]: !p[name] }));

  const chosen = candidates.filter((c) => selected[c.name]);

  const createSelected = async () => {
    if (chosen.length === 0 || status !== "idle") return;
    setStatus("creating");
    setError("");
    setNote("");
    let ok = 0;
    // On lance le diagnostic complet (analyse du site + constats + note) en
    // réutilisant les données déjà scannées (pas de nouvel appel Apify).
    for (const c of chosen) {
      try {
        const res = await fetch("/api/admin/humain/site-internet/diagnose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName: c.name,
            city: trim(ville),
            activite: trim(activite),
            variant: c.variant,
            prefetched: {
              website: c.website,
              rating: c.rating,
              reviews: c.reviews,
              address: c.address,
              concurrents: c.competitors,
            },
          }),
        });
        if (res.ok) ok++;
      } catch {
        // on continue les autres
      }
    }
    setStatus("idle");
    setNote(`${ok} prospect${ok > 1 ? "s" : ""} diagnostiqué${ok > 1 ? "s" : ""} et créé${ok > 1 ? "s" : ""}. Retrouve-les dans la liste ci-dessous pour ouvrir la lettre.`);
    setCandidates([]);
    setSelected({});
    router.refresh();
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">Découverte</p>
      <h2 className="mt-1 text-xl font-black sm:text-2xl">Trouver des commerces à cibler</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
        Scanne un secteur dans une ville : on te sort les commerces classés par besoin — <strong>sans site d&apos;abord</strong>, puis les moins bien notés. Tu coches, on crée les prospects.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Ville (ex: Dax)" className="h-11 rounded-xl border bg-background px-3 text-sm" />
        <input value={activite} onChange={(e) => setActivite(e.target.value)} placeholder="Secteur (ex: garage automobile)" className="h-11 rounded-xl border bg-background px-3 text-sm md:col-span-2" />
        <select value={maxRating} onChange={(e) => setMaxRating(e.target.value)} className="h-11 rounded-xl border bg-background px-3 text-sm">
          <option value="">Toutes les notes</option>
          <option value="3.5">Note ≤ 3,5</option>
          <option value="4">Note ≤ 4,0</option>
          <option value="4.5">Note ≤ 4,5</option>
        </select>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={search}
          disabled={!canSearch}
          className="rounded-full bg-sky-700 px-5 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "searching" ? "Recherche en cours… (20-60s)" : "🔎 Découvrir les commerces"}
        </button>
      </div>

      {note ? <div className="mt-3 text-sm font-medium text-sky-800">{note}</div> : null}
      {error ? <div className="mt-3 text-sm font-semibold text-red-700">{error}</div> : null}

      {candidates.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">{candidates.length} commerces · {chosen.length} sélectionné{chosen.length > 1 ? "s" : ""}</span>
            <button
              type="button"
              onClick={createSelected}
              disabled={chosen.length === 0 || status !== "idle"}
              className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "creating" ? "Création…" : `Créer ${chosen.length} prospect${chosen.length > 1 ? "s" : ""}`}
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2 font-medium">Commerce</th>
                  <th className="px-3 py-2 font-medium">Note</th>
                  <th className="px-3 py-2 font-medium">Avis</th>
                  <th className="px-3 py-2 font-medium">Site</th>
                  <th className="px-3 py-2 font-medium">Cible</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.name} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={Boolean(selected[c.name])} onChange={() => toggle(c.name)} />
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-900">
                      {c.name}
                      {c.address ? <div className="text-[11px] font-normal text-slate-400">{c.address}</div> : null}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{c.rating != null ? c.rating.toFixed(1) : "—"}</td>
                    <td className="px-3 py-2 text-slate-700">{c.reviews ?? "—"}</td>
                    <td className="px-3 py-2">
                      {c.hasSite ? <span className="text-slate-500">✓ oui</span> : <span className="font-semibold text-amber-600">✗ aucun</span>}
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded px-2 py-0.5 text-xs font-bold text-black" style={{ background: c.variant === "A" ? "#fbbf24" : "#93c5fd" }}>
                        {c.variant}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Les « ✗ aucun site » (variante A) sont pré-cochés : ce sont les cibles les plus évidentes. Après création, ouvre chaque lettre pour la valider et l&apos;imprimer.
          </p>
        </div>
      )}
    </div>
  );
}
