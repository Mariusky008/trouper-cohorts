"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function trim(value: string): string {
  return String(value || "").trim();
}

export function SiteAddForm() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [activite, setActivite] = useState("");
  const [address, setAddress] = useState("");
  const [sourceWebsite, setSourceWebsite] = useState("");
  const [variant, setVariant] = useState<"" | "A" | "B">("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");

  const canSubmit = useMemo(
    () => Boolean(trim(businessName) && trim(city) && trim(activite) && status === "idle"),
    [businessName, city, activite, status]
  );

  const onSubmit = async () => {
    if (!canSubmit) return;
    setStatus("loading");
    setError("");
    setCreatedSlug("");
    try {
      const res = await fetch("/api/admin/humain/site-internet/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: trim(businessName),
          city: trim(city),
          activite: trim(activite),
          address: trim(address),
          sourceWebsite: trim(sourceWebsite),
          variant,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(trim(json?.error) || "Erreur inconnue.");
        return;
      }
      setCreatedSlug(String(json.slug || ""));
      setBusinessName("");
      setCity("");
      setActivite("");
      setAddress("");
      setSourceWebsite("");
      setVariant("");
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Ajout manuel</p>
      <h2 className="mt-1 text-xl font-black sm:text-2xl">Ajouter un prospect</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
        En attendant le diagnostic automatique : saisis les infos, choisis la variante, puis ouvre la lettre.
        <br />
        <span className="text-slate-500">
          Variante <strong>A</strong> = pas de site · <strong>B</strong> = refonte (laisse vide si tu ne sais pas encore).
        </span>
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Nom du commerce (ex: Garage Duclos)"
          className="h-11 rounded-xl border bg-background px-3 text-sm"
        />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ville (ex: Dax)"
          className="h-11 rounded-xl border bg-background px-3 text-sm"
        />
        <input
          value={activite}
          onChange={(e) => setActivite(e.target.value)}
          placeholder="Activité (ex: Garage automobile)"
          className="h-11 rounded-xl border bg-background px-3 text-sm"
        />
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Adresse (optionnel)"
          className="h-11 rounded-xl border bg-background px-3 text-sm"
        />
        <input
          value={sourceWebsite}
          onChange={(e) => setSourceWebsite(e.target.value)}
          placeholder="Site actuel (optionnel, ex: https://exemple.fr)"
          className="h-11 rounded-xl border bg-background px-3 text-sm"
        />
        <div className="flex items-center gap-2">
          {(["", "A", "B"] as const).map((v) => (
            <button
              key={v || "auto"}
              type="button"
              onClick={() => setVariant(v)}
              className={`h-11 flex-1 rounded-xl border px-3 text-sm font-semibold ${
                variant === v ? "bg-slate-950 text-white" : "bg-background text-slate-700"
              }`}
            >
              {v === "" ? "À définir" : `Variante ${v}`}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Création…" : "Créer le prospect"}
        </button>
        {createdSlug ? (
          <a
            href={`/admin/humain/site-internet/lettre/${createdSlug}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-emerald-700 underline"
          >
            Ouvrir la lettre →
          </a>
        ) : null}
      </div>

      {error ? <div className="mt-3 text-sm font-semibold text-red-700">{error}</div> : null}
    </div>
  );
}
