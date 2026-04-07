"use client";

import { useState } from "react";

type Role = "membre" | "admin";

export default function RadarElitePreviewPage() {
  const [role, setRole] = useState<Role>("membre");
  const [step, setStep] = useState(1);

  return (
    <main className="min-h-screen bg-[#0A0B0C] text-white px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="inline-flex rounded-full border border-[#C49A4A]/35 bg-[#C49A4A]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#EAC886]">
            Prototype V3 simplifié
          </p>
          <h1 className="mt-3 text-3xl md:text-5xl font-black leading-tight">
            Popey Radar
          </h1>
          <p className="mt-3 text-sm md:text-base text-white/70">
            Version ultra claire : on comprend immédiatement quoi faire en 3 étapes.
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setRole("membre")}
              className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wide transition ${
                role === "membre" ? "bg-[#0E3E2A] text-emerald-200" : "text-white/70"
              }`}
            >
              Vue Membre
            </button>
            <button
              onClick={() => setRole("admin")}
              className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wide transition ${
                role === "admin" ? "bg-[#3E2E0E] text-[#EAC886]" : "text-white/70"
              }`}
            >
              Vue Admin
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-[30px] border border-white/10 bg-gradient-to-b from-[#111414] to-[#0A0C0C] p-4 shadow-[0_24px_55px_-30px_rgba(0,0,0,0.9)]">
          <div className="rounded-[24px] border border-white/10 bg-[#090B0B] p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/60">
              {role === "membre" ? "Vue membre" : "Vue admin"}
            </p>
            <h2 className="mt-2 text-2xl font-black">
              {role === "membre" ? "Que dois-je faire maintenant ?" : "Quelle est la prochaine action admin ?"}
            </h2>

            <div className="mt-4 flex gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setStep(n)}
                  className={`h-10 rounded-lg px-4 text-xs font-black uppercase tracking-wide transition ${
                    step === n ? "bg-[#C49A4A] text-black" : "border border-white/20 text-white/75"
                  }`}
                >
                  Étape {n}
                </button>
              ))}
            </div>

            {role === "membre" && (
              <div key={`m-${step}`} className="mt-5 animate-[fadeIn_.25s_ease-out]">
                {step === 1 && (
                  <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300">Étape 1</p>
                    <h3 className="mt-1 text-xl font-black">Signalez une opportunité en vocal</h3>
                    <p className="mt-2 text-sm text-white/80">Appuyez sur le bouton central et parlez 10 secondes.</p>
                    <button className="mt-4 h-14 w-full rounded-xl bg-emerald-400 text-black text-sm font-black uppercase tracking-wide">
                      Signaler une opportunité (Vocal)
                    </button>
                  </div>
                )}
                {step === 2 && (
                  <div className="rounded-2xl border border-[#EAC886]/25 bg-[#EAC886]/10 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]">Étape 2</p>
                    <h3 className="mt-1 text-xl font-black">Recevez une fiche client qualifiée</h3>
                    <p className="mt-2 text-sm text-white/80">Vous recevez uniquement les dossiers qui vous concernent.</p>
                    <div className="mt-4 rounded-xl border border-white/15 bg-black/25 p-3">
                      <p className="font-black">Famille Dubois • 22 000€</p>
                      <p className="text-xs text-white/70">Cuisine + électricité • À contacter</p>
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300">Étape 3</p>
                    <h3 className="mt-1 text-xl font-black">Passez le statut en Victoire</h3>
                    <p className="mt-2 text-sm text-white/80">Quand c’est signé, vous déclarez le montant et la commission est calculée.</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-[#EAC886]/30 bg-[#2A2111] p-3">
                        <p className="text-xs text-[#EAC886]/80 uppercase font-black">Cash business reçu</p>
                        <p className="text-2xl font-black text-[#EAC886]">96 300€</p>
                      </div>
                      <div className="rounded-xl border border-emerald-400/30 bg-[#10251D] p-3">
                        <p className="text-xs text-emerald-300/80 uppercase font-black">Commissions encaissées</p>
                        <p className="text-2xl font-black text-emerald-300">12 840€</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {role === "admin" && (
              <div key={`a-${step}`} className="mt-5 animate-[fadeIn_.25s_ease-out]">
                {step === 1 && (
                  <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Étape 1</p>
                    <h3 className="mt-1 text-xl font-black">Écoutez les vocaux entrants</h3>
                    <div className="mt-3 space-y-2">
                      <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm">VOC-991 • Thomas (Carreleur)</p>
                      <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm">VOC-992 • Claire (Agent Immo)</p>
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="rounded-2xl border border-[#EAC886]/25 bg-[#EAC886]/10 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]">Étape 2</p>
                    <h3 className="mt-1 text-xl font-black">Validez et qualifiez</h3>
                    <div className="mt-3 grid gap-2 text-sm">
                      <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">Nom client: Mme Martin</p>
                      <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">Budget estimé: 27 000€</p>
                      <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">Métiers concernés: Plombier, Carreleur</p>
                    </div>
                    <button className="mt-4 h-12 w-full rounded-xl bg-[#EAC886] text-black text-sm font-black uppercase tracking-wide">
                      Valider & Qualifier
                    </button>
                  </div>
                )}
                {step === 3 && (
                  <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300">Étape 3</p>
                    <h3 className="mt-1 text-xl font-black">Déclenchez le Gong de l’Élite</h3>
                    <p className="mt-2 text-sm text-white/80">
                      Notification groupe : “Félicitations à Thomas ! Son lead a généré 780€ via Claire.”
                    </p>
                    <button className="mt-4 h-12 w-full rounded-xl bg-emerald-400 text-black text-sm font-black uppercase tracking-wide">
                      Envoyer l’alerte générale
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
