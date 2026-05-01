"use client";

import { useMemo, useState } from "react";

type MemberOption = {
  id: string;
  label: string;
};

type SignedLinkResponse = {
  success: boolean;
  landingUrl?: string;
  whatsappText?: string;
  tokenExpiresAt?: string;
  error?: string;
};

function trim(value: string): string {
  return String(value || "").trim();
}

function normalizePhone(raw: string): string {
  const clean = trim(raw).replace(/[^\d+]/g, "");
  if (!clean) return "";
  if (clean.startsWith("+")) return clean.slice(1);
  if (clean.startsWith("00")) return clean.slice(2);
  if (clean.startsWith("0")) return `33${clean.slice(1)}`;
  return clean;
}

export function SignedLinkGenerator({ members }: { members: MemberOption[] }) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [referrerId, setReferrerId] = useState("");
  const [referrerName, setReferrerName] = useState("");
  const [city, setCity] = useState("Dax");
  const [expiresInHours, setExpiresInHours] = useState(168);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [landingUrl, setLandingUrl] = useState("");
  const [whatsappText, setWhatsappText] = useState("");
  const [tokenExpiresAt, setTokenExpiresAt] = useState("");
  const [copiedField, setCopiedField] = useState<"" | "link" | "text">("");

  const selectedMember = useMemo(() => members.find((member) => member.id === referrerId) || null, [members, referrerId]);
  const waPhone = useMemo(() => normalizePhone(clientPhone), [clientPhone]);
  const waHref = useMemo(() => {
    if (!trim(whatsappText) || !waPhone) return "";
    return `https://wa.me/${waPhone}?text=${encodeURIComponent(whatsappText)}`;
  }, [waPhone, whatsappText]);

  const onSelectReferrer = (value: string) => {
    setReferrerId(value);
    const member = members.find((item) => item.id === value);
    if (member && !trim(referrerName)) {
      setReferrerName(member.label);
    }
  };

  const copyToClipboard = async (field: "link" | "text", value: string) => {
    if (!trim(value)) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(""), 1600);
    } catch {
      setCopiedField("");
    }
  };

  const generateSignedLink = async () => {
    setError("");
    setCopiedField("");
    setIsSubmitting(true);
    const response = await fetch("/api/admin/humain/marketplace/signed-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: trim(clientName),
        clientPhone: trim(clientPhone),
        referrerName: trim(referrerName || selectedMember?.label || ""),
        referrerId: trim(referrerId || ""),
        city: trim(city || "Dax"),
        expiresInHours: Number(expiresInHours || 168),
      }),
    }).catch(() => null);
    setIsSubmitting(false);

    if (!response) {
      setError("Connexion impossible. Réessaie.");
      return;
    }
    const data = (await response.json().catch(() => ({}))) as SignedLinkResponse;
    if (!response.ok || !data.success) {
      setError(data.error || "Génération impossible.");
      return;
    }
    setLandingUrl(trim(data.landingUrl || ""));
    setWhatsappText(trim(data.whatsappText || ""));
    setTokenExpiresAt(trim(data.tokenExpiresAt || ""));
  };

  return (
    <div className="rounded-xl border bg-white p-4">
      <h2 className="text-lg font-black">Générateur de lien WhatsApp signé</h2>
      <p className="mt-1 text-xs text-black/70">Crée un lien sécurisé prêt à copier-coller dans WhatsApp.</p>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <input
          value={clientName}
          onChange={(event) => setClientName(event.target.value)}
          placeholder="Nom client (ex: Sophie)"
          className="h-10 rounded border bg-background px-3 text-sm"
        />
        <input
          value={clientPhone}
          onChange={(event) => setClientPhone(event.target.value)}
          placeholder="Téléphone client (optionnel)"
          className="h-10 rounded border bg-background px-3 text-sm"
        />
        <select
          value={referrerId}
          onChange={(event) => onSelectReferrer(event.target.value)}
          className="h-10 rounded border bg-background px-3 text-sm"
        >
          <option value="">Choisir le pro referrer (optionnel)</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.label}
            </option>
          ))}
        </select>
        <input
          value={referrerName}
          onChange={(event) => setReferrerName(event.target.value)}
          placeholder="Nom pro referrer"
          className="h-10 rounded border bg-background px-3 text-sm"
        />
        <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ville" className="h-10 rounded border bg-background px-3 text-sm" />
        <input
          value={String(expiresInHours)}
          onChange={(event) => setExpiresInHours(Number(event.target.value || 168))}
          placeholder="Expiration (heures)"
          className="h-10 rounded border bg-background px-3 text-sm"
        />
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={generateSignedLink}
          disabled={isSubmitting || !trim(clientName) || !trim(referrerName || selectedMember?.label || "")}
          className="h-10 rounded border px-4 text-xs font-black uppercase tracking-wide disabled:opacity-50"
        >
          {isSubmitting ? "Génération..." : "Générer le lien signé"}
        </button>
      </div>

      {error ? <p className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}

      {landingUrl ? (
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-black/70">Lien signé</p>
            <textarea value={landingUrl} readOnly rows={2} className="mt-1 w-full rounded border bg-background p-2 text-xs" />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard("link", landingUrl)}
                className="h-8 rounded border px-3 text-[11px] font-black uppercase tracking-wide"
              >
                {copiedField === "link" ? "Lien copié" : "Copier lien"}
              </button>
              <a href={landingUrl} target="_blank" rel="noreferrer" className="h-8 rounded border px-3 text-[11px] font-black uppercase tracking-wide leading-8">
                Ouvrir la landing
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-wide text-black/70">Message WhatsApp prêt</p>
            <textarea value={whatsappText} readOnly rows={3} className="mt-1 w-full rounded border bg-background p-2 text-xs" />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard("text", whatsappText)}
                className="h-8 rounded border px-3 text-[11px] font-black uppercase tracking-wide"
              >
                {copiedField === "text" ? "Message copié" : "Copier message WhatsApp"}
              </button>
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  className="h-8 rounded border px-3 text-[11px] font-black uppercase tracking-wide leading-8"
                >
                  Ouvrir WhatsApp pré-rempli
                </a>
              ) : (
                <span className="h-8 rounded border border-dashed px-3 text-[11px] uppercase tracking-wide leading-8 text-black/50">
                  Ajouter un téléphone client pour ouvrir WhatsApp
                </span>
              )}
            </div>
          </div>

          {tokenExpiresAt ? <p className="text-xs text-black/60">Expiration: {new Date(tokenExpiresAt).toLocaleString("fr-FR")}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
