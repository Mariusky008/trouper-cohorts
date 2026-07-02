"use client";

import { useState } from "react";

export function LeadForm({ slug }: { slug: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  const canSubmit = phone.replace(/\D/g, "").length >= 9 && status === "idle";

  const submit = async () => {
    if (!canSubmit) return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(`/api/site-internet/${encodeURIComponent(slug)}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(String(json?.error || "Une erreur est survenue."));
        setStatus("idle");
        return;
      }
      setStatus("done");
    } catch {
      setError("Erreur réseau.");
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <div className="rounded-2xl bg-emerald-50 p-5 text-center">
        <p className="text-lg font-black text-emerald-800">Merci ! 🙌</p>
        <p className="mt-1 text-sm text-emerald-700">On vous rappelle très vite.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm font-bold text-slate-800">Ou laissez votre numéro, on vous rappelle :</p>
      <div className="grid gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Votre prénom (facultatif)"
          className="h-12 rounded-xl border border-slate-300 px-4 text-sm"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Votre téléphone"
          inputMode="tel"
          className="h-12 rounded-xl border border-slate-300 px-4 text-sm"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="h-12 rounded-xl bg-sky-700 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? "Envoi…" : "Être rappelé"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
