"use client";

import { useMemo, useState } from "react";

type MemberOption = {
  id: string;
  label: string;
};

function trim(value: string): string {
  return String(value || "").trim();
}

function slugify(value: string): string {
  return trim(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
  const [clientPhone, setClientPhone] = useState("");
  const [referrerId, setReferrerId] = useState("");
  const [referrerName, setReferrerName] = useState("");
  const [city, setCity] = useState("Dax");
  const [clientName, setClientName] = useState("");
  const [landingUrl, setLandingUrl] = useState("");
  const [whatsappText, setWhatsappText] = useState("");
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
    setCopiedField("");
    const refName = trim(referrerName || selectedMember?.label || "");
    if (!refName) return;

    const cityLabel = trim(city || "Dax") || "Dax";
    const citySlug = slugify(cityLabel || "dax") || "dax";
    const referralCode = slugify(`${refName}-${cityLabel}`) || slugify(refName) || "ref-popey";
    const base =
      trim(process.env.NEXT_PUBLIC_APP_URL || "") ||
      (typeof window !== "undefined" && window.location?.origin ? window.location.origin : "");
    const cleanBase = base.replace(/\/+$/, "");
    const query = new URLSearchParams({
      ref: referralCode,
      ref_id: trim(referrerId || ""),
      ref_name: refName,
      client_name: trim(clientName || "") || "Client",
    });
    const relativeUrl = `/privilege/${citySlug}?${query.toString()}`;
    const finalLandingUrl = cleanBase ? `${cleanBase}${relativeUrl}` : relativeUrl;
    const waText = `Bonjour, voici ton catalogue de privilèges Popey offert par ${refName} : ${finalLandingUrl}`;

    setLandingUrl(finalLandingUrl);
    setWhatsappText(waText);
  };

  return (
    <div className="rounded-xl border bg-white p-4">
      <h2 className="text-lg font-black">Générateur de lien membre (privilèges)</h2>
      <p className="mt-1 text-xs text-black/70">Crée un lien referral simple à envoyer au client via WhatsApp.</p>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
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
        <input
          value={clientName}
          onChange={(event) => setClientName(event.target.value)}
          placeholder="Nom client (optionnel)"
          className="h-10 rounded border bg-background px-3 text-sm"
        />
        <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ville" className="h-10 rounded border bg-background px-3 text-sm" />
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={generateSignedLink}
          disabled={!trim(referrerName || selectedMember?.label || "")}
          className="h-10 rounded border px-4 text-xs font-black uppercase tracking-wide disabled:opacity-50"
        >
          Générer le lien membre
        </button>
      </div>

      {landingUrl ? (
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-black/70">Lien referral</p>
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
        </div>
      ) : null}
    </div>
  );
}
