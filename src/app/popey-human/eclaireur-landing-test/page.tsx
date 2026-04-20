"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";

type RelationLevel = "proche" | "client" | "connaissance";

export default function EclaireurLandingTestPage() {
  const [flowOpen, setFlowOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [contactName, setContactName] = useState("");
  const [detectedNeed, setDetectedNeed] = useState("");
  const [relationLevel, setRelationLevel] = useState<RelationLevel | null>(null);
  const [opportunitiesSent, setOpportunitiesSent] = useState(3);
  const [generatedGains, setGeneratedGains] = useState(450);
  const [countedSend, setCountedSend] = useState(false);

  const firstName = contactName.trim().split(" ")[0] || "Prenom";
  const canContinueStep1 = contactName.trim().length > 1 && detectedNeed.trim().length > 1 && relationLevel !== null;

  const generatedMessage = useMemo(
    () =>
      `Salut ${firstName},\n\nJe te presente Popey Human, on travaille avec des pros qui peuvent t aider sur ${
        detectedNeed.trim() || "ton besoin"
      }.\n\nJe pense que ca peut vraiment t etre utile.\n\nJe vous laisse echanger 👍`,
    [firstName, detectedNeed],
  );

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(generatedMessage)}`;

  function openFlow() {
    setFlowOpen(true);
    setStep(1);
    setCountedSend(false);
  }

  function closeFlow() {
    setFlowOpen(false);
    setStep(1);
  }

  function handleSendClick() {
    if (countedSend) return;
    setCountedSend(true);
    setOpportunitiesSent((value) => value + 1);
    setGeneratedGains((value) => value + 150);
    setStep(3);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,#10193D_0%,#0C122B_45%,#090B16_100%)] text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
        <div className="rounded-2xl border border-white/15 bg-white/5 p-3 text-xs text-cyan-100 backdrop-blur-xl sm:text-sm">
          <span className="font-black">Opportunites envoyees:</span> {opportunitiesSent}
          <span className="mx-2 text-white/45">•</span>
          <span className="font-black">Gains generes:</span> {generatedGains}€
        </div>

        <section className="mt-6 rounded-3xl border border-white/15 bg-[#0F1A3A]/80 p-5 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Popey Human • Eclaireur</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">Gagne de l argent en recommandant des contacts.</h1>
          <p className="mt-3 max-w-3xl text-sm text-white/80 sm:text-lg">
            Tu connais quelqu un qui cherche un service ? Mets-nous en relation et touche une commission.
          </p>
          <button
            type="button"
            onClick={openFlow}
            className="mt-6 h-12 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-300 px-6 text-sm font-black uppercase tracking-wide text-[#10263A]"
          >
            Je recommande un contact
          </button>
        </section>

        <section className="mt-6 rounded-3xl border border-white/15 bg-white/5 p-5 sm:p-8">
          <h2 className="text-2xl font-black">Comment ca marche</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-white/15 bg-black/25 p-4">
              <p className="text-lg font-black">1. Tu connais quelqu un</p>
              <p className="mt-2 text-sm text-white/75">Un ami, client, collegue qui a un besoin.</p>
            </article>
            <article className="rounded-2xl border border-white/15 bg-black/25 p-4">
              <p className="text-lg font-black">2. Tu nous mets en relation</p>
              <p className="mt-2 text-sm text-white/75">Message WhatsApp en 1 clic.</p>
            </article>
            <article className="rounded-2xl border border-white/15 bg-black/25 p-4">
              <p className="text-lg font-black">3. Tu touches une commission</p>
              <p className="mt-2 text-sm text-white/75">Si ca signe, tu es paye. C est tout.</p>
            </article>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/15 bg-white/5 p-5 sm:p-8">
          <h2 className="text-2xl font-black">Combien tu gagnes</h2>
          <div className="mt-4 space-y-2 text-sm sm:text-base">
            <p className="rounded-xl border border-emerald-300/35 bg-emerald-400/10 px-3 py-2">
              Apport simple → <span className="font-black">50€ a 200€</span>
            </p>
            <p className="rounded-xl border border-cyan-300/35 bg-cyan-400/10 px-3 py-2">
              Mise en relation qualifiee → <span className="font-black">200€ a 1000€</span>
            </p>
            <p className="rounded-xl border border-amber-300/35 bg-amber-400/10 px-3 py-2">
              Deal signe → <span className="font-black">% sur la vente</span>
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/15 bg-white/5 p-5 sm:p-8">
          <h2 className="text-2xl font-black">Preuve</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <p className="rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-sm">Paul a gagne 300€ en 2 mises en relation.</p>
            <p className="rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-sm">Julie a apporte 1 client → 500€.</p>
          </div>
        </section>

        <section className="mt-6 pb-4 text-center">
          <button
            type="button"
            onClick={openFlow}
            className="h-12 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-300 px-8 text-sm font-black uppercase tracking-wide text-[#10263A]"
          >
            Je propose un contact
          </button>
          <p className="mt-2 text-sm text-white/70">Transforme ton reseau en revenu.</p>
        </section>
      </div>

      {flowOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
          <motion.section
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#0E1430] p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Flow Eclaireur</p>
              <button type="button" onClick={closeFlow} className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs">
                ✕
              </button>
            </div>

            {step === 1 && (
              <div className="mt-3 space-y-3">
                <p className="text-lg font-black">Etape 1 • Ton contact</p>
                <input
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  placeholder="Nom du contact"
                  className="h-11 w-full rounded-xl border border-white/15 bg-black/25 px-3 text-sm"
                />
                <input
                  value={detectedNeed}
                  onChange={(event) => setDetectedNeed(event.target.value)}
                  placeholder="Besoin estime"
                  className="h-11 w-full rounded-xl border border-white/15 bg-black/25 px-3 text-sm"
                />
                <div className="grid grid-cols-3 gap-2">
                  {(["proche", "client", "connaissance"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setRelationLevel(level)}
                      className={`h-10 rounded-xl text-xs font-black uppercase ${
                        relationLevel === level ? "bg-cyan-300 text-[#13253D]" : "bg-white/10 text-white/85"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={!canContinueStep1}
                  onClick={() => setStep(2)}
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-300 text-sm font-black uppercase tracking-wide text-[#10263A] disabled:opacity-40"
                >
                  Generer le message
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="mt-3 space-y-3">
                <p className="text-lg font-black">Etape 2 • Message genere</p>
                <textarea value={generatedMessage} readOnly className="min-h-44 w-full rounded-xl border border-white/15 bg-black/25 p-3 text-sm" />
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleSendClick}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-300 text-sm font-black uppercase tracking-wide text-[#10263A]"
                >
                  Envoyer via WhatsApp
                </a>
              </div>
            )}

            {step === 3 && (
              <div className="mt-3 text-center">
                <p className="text-4xl">✅</p>
                <p className="mt-2 text-xl font-black">Tu viens de creer une opportunite 💰</p>
                <p className="mt-1 text-sm text-cyan-100">Si ca signe, tu es remunere.</p>
                <button
                  type="button"
                  onClick={closeFlow}
                  className="mt-4 h-11 w-full rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 text-sm font-black uppercase tracking-wide text-[#10263A]"
                >
                  Terminer
                </button>
              </div>
            )}
          </motion.section>
        </div>
      )}
    </main>
  );
}
