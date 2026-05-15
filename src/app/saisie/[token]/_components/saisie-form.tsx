"use client";

import { useState, useRef } from "react";

type Props = {
  token: string;
  nomCommerce: string;
};

type SuccessState = { prenom: string } | null;

function formatPhoneDisplay(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

function isValidFrenchPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return /^0[67]\d{8}$/.test(digits) || /^0[1-9]\d{8}$/.test(digits);
}

export function SaisieForm({ token, nomCommerce }: Props) {
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessState>(null);
  const [error, setError] = useState<string | null>(null);
  const prenomRef = useRef<HTMLInputElement>(null);

  const phoneValid = isValidFrenchPhone(telephone);
  const canSubmit = prenom.trim().length >= 2 && phoneValid && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/saisie/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prenom: prenom.trim(), telephone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Une erreur s'est produite.");
        setLoading(false);
        return;
      }

      setSuccess({ prenom: data.prenom });
      setPrenom("");
      setTelephone("");
      setLoading(false);

      // Refocus after short delay so the user sees the success message
      setTimeout(() => {
        setSuccess(null);
        prenomRef.current?.focus();
      }, 2500);
    } catch {
      setError("Erreur réseau, réessayez.");
      setLoading(false);
    }
  }

  return (
    <main
      style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
      className="min-h-screen bg-[#1C1F22] flex items-start justify-center px-5 pt-10 pb-6"
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs tracking-[0.14em] uppercase text-[#D4C89A] font-medium mb-1">
            {nomCommerce}
          </p>
          <h1 className="text-2xl font-semibold text-white">Nouveau client</h1>
        </div>

        {/* Success flash */}
        {success && (
          <div className="mb-6 bg-[#25D366]/15 border border-[#25D366]/30 rounded-[12px] px-4 py-3 flex items-center gap-3">
            <span className="text-xl">✅</span>
            <span className="text-sm font-medium text-[#25D366]">
              {success.prenom} ajouté(e)&nbsp;!
            </span>
          </div>
        )}

        {/* Error flash */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-[12px] px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">
              Prénom
            </label>
            <input
              ref={prenomRef}
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Marie"
              autoComplete="off"
              autoCapitalize="words"
              className="w-full bg-[#2A2D31] border border-[#3A3D42] rounded-[10px] px-4 py-4 text-lg text-white placeholder-[#4B5563] focus:outline-none focus:border-[#D4C89A] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={formatPhoneDisplay(telephone)}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="06 12 34 56 78"
              autoComplete="off"
              className="w-full bg-[#2A2D31] border border-[#3A3D42] rounded-[10px] px-4 py-4 text-lg text-white placeholder-[#4B5563] focus:outline-none focus:border-[#D4C89A] transition-colors"
            />
            {telephone.replace(/\D/g, "").length >= 10 && !phoneValid && (
              <p className="text-xs text-red-400 mt-1.5">Numéro invalide (format 06 ou 07...)</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-[#D4C89A] text-[#1C1F22] rounded-[14px] py-4 text-base font-semibold cursor-pointer disabled:opacity-30 transition-opacity mt-2"
          >
            {loading ? "Ajout en cours..." : "✓  Ajouter ce client"}
          </button>
        </form>
      </div>
    </main>
  );
}
