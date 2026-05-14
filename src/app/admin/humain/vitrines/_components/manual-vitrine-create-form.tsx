"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function trim(value: string): string {
  return String(value || "").trim();
}

function normalizeFrMobileToE164(rawValue: string): string {
  const raw = trim(rawValue);
  if (!raw) return "";

  let cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("00")) cleaned = `+${cleaned.slice(2)}`;

  if (cleaned.startsWith("+33")) {
    let rest = cleaned.slice(3).replace(/\D/g, "");
    if (rest.startsWith("0")) rest = rest.slice(1);
    if (rest.length !== 9) return "";
    if (rest[0] !== "6" && rest[0] !== "7") return "";
    return `+33${rest}`.slice(0, 24);
  }

  let digits = cleaned.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length !== 9) return "";
  if (digits[0] !== "6" && digits[0] !== "7") return "";
  return `+33${digits}`.slice(0, 24);
}

function normalizeWebsite(rawValue: string): string {
  let raw = trim(rawValue);
  if (!raw) return "";
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function ManualVitrineCreateForm() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [sourceWebsite, setSourceWebsite] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ slug: string; publicUrl: string } | null>(null);

  const normalizedWebsite = useMemo(() => normalizeWebsite(sourceWebsite), [sourceWebsite]);
  const normalizedWhatsapp = useMemo(() => normalizeFrMobileToE164(whatsappPhone), [whatsappPhone]);
  const canSubmit = useMemo(() => {
    return Boolean(trim(businessName) && trim(city) && trim(category) && normalizedWebsite && normalizedWhatsapp && status === "idle");
  }, [businessName, city, category, normalizedWebsite, normalizedWhatsapp, status]);

  const onSubmit = async () => {
    if (!canSubmit) return;
    setStatus("loading");
    setError("");
    setCreated(null);
    try {
      const res = await fetch("/api/admin/humain/vitrines/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: trim(businessName),
          city: trim(city),
          category: trim(category),
          sourceWebsite: normalizedWebsite,
          whatsappPhone: normalizedWhatsapp,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(trim(json?.error) || "Erreur inconnue.");
        return;
      }
      setCreated({ slug: String(json.slug || ""), publicUrl: String(json.publicUrl || "") });
      setBusinessName("");
      setCity("");
      setCategory("");
      setSourceWebsite("");
      setWhatsappPhone("");
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
      <h2 className="mt-1 text-xl font-black sm:text-2xl">Créer une vitrine depuis un site</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
        Pour les cas où Apify ne trouve pas le lead. WhatsApp France obligatoire (06/07 ou +33 6/7).
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
          placeholder="Nom de l'entreprise"
          className="h-11 rounded-xl border bg-background px-3 text-sm"
        />
        <input
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Ville (ex: Dax)"
          className="h-11 rounded-xl border bg-background px-3 text-sm"
        />
        <input
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Catégorie / métier (ex: plombier)"
          className="h-11 rounded-xl border bg-background px-3 text-sm"
        />
        <input
          value={sourceWebsite}
          onChange={(event) => setSourceWebsite(event.target.value)}
          placeholder="Site internet (ex: https://exemple.fr)"
          className="h-11 rounded-xl border bg-background px-3 text-sm"
        />
        <input
          value={whatsappPhone}
          onChange={(event) => setWhatsappPhone(event.target.value)}
          placeholder="WhatsApp (obligatoire)"
          className="h-11 rounded-xl border bg-background px-3 text-sm"
        />
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-slate-50 px-3 py-2">
          <div className="text-xs text-slate-600">
            <div>Site normalisé: {normalizedWebsite || "—"}</div>
            <div>WhatsApp E.164: {normalizedWhatsapp || "—"}</div>
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? "Création..." : "Créer"}
          </button>
        </div>
      </div>

      {error ? <div className="mt-3 text-sm font-semibold text-red-700">{error}</div> : null}
      {created?.slug ? (
        <div className="mt-3 text-sm text-slate-700">
          Créée: <span className="font-mono text-xs">{created.slug}</span>{" "}
          {created.publicUrl ? (
            <a href={created.publicUrl} target="_blank" rel="noreferrer" className="ml-2 text-emerald-700 underline">
              Ouvrir
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

