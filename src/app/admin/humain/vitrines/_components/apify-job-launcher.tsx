"use client";

import { useMemo, useState } from "react";

function trim(value: string): string {
  return String(value || "").trim();
}

function toMetiersArray(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 60);
}

export function ApifyJobLauncher() {
  const [city, setCity] = useState("Dax");
  const [metiersRaw, setMetiersRaw] = useState("plombier,chauffagiste,menuisier");
  const [batch, setBatch] = useState("5");
  const [maxRating, setMaxRating] = useState("3.5");
  const [dryRun, setDryRun] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState("");

  const metiers = useMemo(() => toMetiersArray(metiersRaw), [metiersRaw]);
  const canSubmit = useMemo(() => {
    return Boolean(trim(city) && metiers.length > 0 && status === "idle");
  }, [city, metiers.length, status]);

  const onSubmit = async () => {
    if (!canSubmit) return;
    setStatus("loading");
    setError("");
    setJobId("");
    try {
      const res = await fetch("/api/admin/humain/vitrines/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: trim(city),
          metiers,
          batchSize: Number(batch || 5),
          maxRating: Number(maxRating || 3.5),
          dryRun,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string; jobId?: string };
      if (!res.ok || !json.success) {
        setError(trim(json.error || "Erreur inconnue."));
        return;
      }
      setJobId(trim(json.jobId || ""));
    } catch {
      setError("Erreur réseau.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Automatisation</p>
      <h2 className="mt-1 text-xl font-black sm:text-2xl">Lancer Apify (sans terminal)</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
        Clique “Lancer” → un job est ajouté en file. GitHub Actions le traitera automatiquement.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Ville (ex: Dax)"
          className="h-11 rounded-xl border bg-background px-3 text-sm"
        />
        <input
          value={metiersRaw}
          onChange={(event) => setMetiersRaw(event.target.value)}
          placeholder="Métiers (séparés par virgules)"
          className="h-11 rounded-xl border bg-background px-3 text-sm"
        />
        <input value={batch} onChange={(event) => setBatch(event.target.value)} placeholder="Batch (ex: 5)" className="h-11 rounded-xl border bg-background px-3 text-sm" />
        <input
          value={maxRating}
          onChange={(event) => setMaxRating(event.target.value)}
          placeholder="Note max (ex: 3.5)"
          className="h-11 rounded-xl border bg-background px-3 text-sm"
        />
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
        Dry-run (ne publie pas)
      </label>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Lancement..." : "Lancer"}
        </button>
        <div className="text-xs text-slate-600">
          WhatsApp only (FR) + note ≤ {trim(maxRating) || "3.5"} + max {trim(batch) || "5"} résultats
        </div>
      </div>

      {error ? <div className="mt-3 text-sm font-semibold text-red-700">{error}</div> : null}
      {jobId ? (
        <div className="mt-3 rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Job créé: <span className="font-mono text-xs">{jobId}</span>
        </div>
      ) : null}
    </div>
  );
}

