"use client";

import { useState } from "react";

type Props = {
  slug: string;
  token: string;
  nomCommerce: string;
  proprietaire: string;
};

export function FeedbackForm({ slug, token, nomCommerce, proprietaire }: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || loading) return;
    setLoading(true);

    try {
      await fetch("/api/avis/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, slug, message: message.trim() }),
      });
      setDone(true);
    } catch {
      setLoading(false);
    }
  }

  return (
    <main
      style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
      className="min-h-screen bg-[#F5F6F7] flex items-center justify-center px-5 py-10"
    >
      <div className="bg-white rounded-[20px] p-10 w-full max-w-sm shadow-[0_4px_32px_rgba(0,0,0,0.08)]">
        <p className="text-xs tracking-[0.12em] uppercase text-[#D4C89A] font-medium mb-5">
          {nomCommerce}
        </p>

        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">🙏</div>
            <h2
              style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}
              className="text-[24px] font-light text-[#1C1F22] leading-snug mb-3"
            >
              Merci pour votre retour.
            </h2>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              {proprietaire} a été prévenu et vous recontactera personnellement.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h1
              style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}
              className="text-[24px] font-light text-[#1C1F22] leading-snug mb-2"
            >
              Nous sommes désolés.
            </h1>
            <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
              Dites-nous ce qui s&rsquo;est passé —{" "}
              <strong className="text-[#1C1F22]">{proprietaire}</strong> vous recontacte
              personnellement.
            </p>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Votre message..."
              rows={4}
              required
              className="w-full border border-[#E5E7EB] rounded-[10px] px-4 py-3 text-sm text-[#1C1F22] placeholder-[#9CA3AF] resize-none focus:outline-none focus:border-[#D4C89A] transition-colors"
            />

            <button
              type="submit"
              disabled={!message.trim() || loading}
              className="mt-4 w-full bg-[#1C1F22] text-white rounded-[14px] py-4 text-base font-medium cursor-pointer disabled:opacity-40 transition-opacity"
            >
              {loading ? "Envoi..." : "Envoyer au gérant"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
