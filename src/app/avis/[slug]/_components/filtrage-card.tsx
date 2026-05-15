"use client";

import { useState } from "react";

type Props = {
  slug: string;
  token: string | null;
  nomCommerce: string;
  prenom: string | null;
};

export function FiltrageCard({ slug, token, nomCommerce, prenom }: Props) {
  const [loading, setLoading] = useState(false);

  async function repondre(choix: "oui" | "non") {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/avis/satisfaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choix, token, slug }),
      });
      const data = await res.json();
      if (data.redirect) {
        window.location.href = data.redirect;
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <main
      style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
      className="min-h-screen bg-[#F5F6F7] flex items-center justify-center px-5 py-10"
    >
      <div className="bg-white rounded-[20px] p-10 w-full max-w-sm text-center shadow-[0_4px_32px_rgba(0,0,0,0.08)]">
        <p
          className="text-xs tracking-[0.12em] uppercase text-[#D4C89A] font-medium mb-5"
        >
          {nomCommerce}
        </p>

        <h1
          style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}
          className="text-[28px] font-light text-[#1C1F22] leading-snug mb-2"
        >
          {prenom ? (
            <>Bonjour {prenom},<br />votre avis compte.</>
          ) : (
            <>Votre avis<br />compte.</>
          )}
        </h1>

        <p className="text-sm text-[#6B7280] mb-9 leading-relaxed">
          Êtes-vous satisfait(e) de notre prestation&nbsp;?
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => repondre("oui")}
            disabled={loading}
            className="bg-[#25D366] text-white rounded-[14px] py-5 px-4 text-base font-medium flex flex-col items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-opacity"
          >
            <span className="text-3xl">😊</span>
            Oui, super&nbsp;!
          </button>

          <button
            onClick={() => repondre("non")}
            disabled={loading}
            className="bg-[#F5F6F7] text-[#6B7280] border border-[#E5E7EB] rounded-[14px] py-5 px-4 text-base flex flex-col items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-opacity"
          >
            <span className="text-3xl">😞</span>
            Pas tout à fait
          </button>
        </div>
      </div>
    </main>
  );
}
