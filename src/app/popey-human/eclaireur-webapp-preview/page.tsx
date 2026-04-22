 "use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export default function EclaireurWebappPreviewPage() {
  const [activeScreen, setActiveScreen] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const screens = useMemo(
    () => [
      { label: "Ecran 1 - Lien Magique", content: <ScreenMagicLink /> },
      { label: "Ecran 2 - Depot Opportunity", content: <ScreenSubmitOpportunity /> },
      { label: "Ecran 3 - Suivi & Commission", content: <ScreenTrackingCommission /> },
    ],
    [],
  );

  function goTo(index: number) {
    if (index < 0 || index >= screens.length) return;
    setActiveScreen(index);
  }

  function onSwipeEnd() {
    if (touchStartX === null || touchEndX === null) return;
    const delta = touchStartX - touchEndX;
    if (delta > 45) goTo(activeScreen + 1);
    if (delta < -45) goTo(activeScreen - 1);
    setTouchStartX(null);
    setTouchEndX(null);
  }

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-cyan-300/25 bg-[radial-gradient(140%_120%_at_0%_0%,rgba(35,75,153,0.55)_0%,rgba(16,25,48,0.88)_52%,rgba(6,9,17,1)_100%)] p-5 sm:p-7 shadow-[0_24px_70px_-40px_rgba(56,189,248,0.8)]">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200/85">Preview UX - Web App Eclaireur</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Version visuelle ultra simple</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/80 sm:text-base">
            Maquette uniquement (sans backend) avec 3 ecrans: lien magique, depot d opportunite, suivi statut + commission.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/popey-human/eclaireur"
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/90"
            >
              Portail Eclaireur actuel
            </Link>
            <span className="rounded-xl border border-emerald-300/35 bg-emerald-500/15 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-100">
              Prototype visuel fun
            </span>
          </div>
        </header>

        <section className="mx-auto max-w-xl">
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 p-2">
            <button
              type="button"
              onClick={() => goTo(activeScreen - 1)}
              disabled={activeScreen === 0}
              className="h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-xs font-black uppercase tracking-wide disabled:opacity-35"
            >
              Precedent
            </button>
            <div className="flex items-center gap-2">
              {screens.map((screen, index) => (
                <button
                  key={screen.label}
                  type="button"
                  onClick={() => goTo(index)}
                  className={`h-2.5 w-2.5 rounded-full transition ${activeScreen === index ? "bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.9)]" : "bg-white/35"}`}
                  aria-label={`Aller a ${screen.label}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => goTo(activeScreen + 1)}
              disabled={activeScreen === screens.length - 1}
              className="h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-xs font-black uppercase tracking-wide disabled:opacity-35"
            >
              Suivant
            </button>
          </div>

          <p className="mb-3 text-center text-xs font-black uppercase tracking-[0.12em] text-cyan-100/85">
            {screens[activeScreen]?.label} - Swipe gauche/droite
          </p>

          <div
            className="overflow-hidden"
            onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
            onTouchMove={(event) => setTouchEndX(event.touches[0]?.clientX ?? null)}
            onTouchEnd={onSwipeEnd}
          >
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${activeScreen * 100}%)` }}
            >
              {screens.map((screen) => (
                <div key={screen.label} className="w-full shrink-0">
                  <PhoneFrame label={screen.label}>{screen.content}</PhoneFrame>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ScreenMagicLink() {
  return (
    <div className="relative h-full overflow-hidden rounded-[24px] border border-cyan-300/35 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(46,132,255,0.35)_0%,rgba(20,33,73,0.9)_45%,rgba(12,17,32,1)_100%)] p-4">
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-cyan-300/35 blur-3xl" />
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100/90">Bienvenue Eclaireur</p>
      <h2 className="mt-2 text-2xl font-black leading-tight">Salut Sarah, ton reseau vaut de l or</h2>
      <p className="mt-2 text-sm text-white/80">Tu nous envoies une opportunite, on traite le dossier, tu suis tout en direct.</p>

      <div className="mt-4 rounded-2xl border border-white/20 bg-black/25 p-3">
        <p className="text-[10px] uppercase tracking-[0.12em] text-white/70">Ton lien magique actif</p>
        <p className="mt-1 text-sm font-black text-cyan-100">popey.academy/eclaireur/AB12-CD34</p>
        <p className="mt-1 text-xs text-white/70">Aucune connexion complexe, acces direct en 1 tap.</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatCard title="Dossiers en cours" value="4" tone="cyan" />
        <StatCard title="Commission previsionnelle" value="1 240 EUR" tone="emerald" />
      </div>

      <button className="mt-5 h-12 w-full rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-emerald-300 text-sm font-black uppercase tracking-wide text-black shadow-[0_18px_30px_-20px_rgba(34,211,238,0.9)]">
        Soumettre une opportunite
      </button>
    </div>
  );
}

function ScreenSubmitOpportunity() {
  return (
    <div className="h-full rounded-[24px] border border-emerald-300/30 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(24,120,78,0.45)_0%,rgba(16,35,34,0.9)_48%,rgba(9,15,18,1)_100%)] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200/90">Nouvelle opportunite</p>
      <h2 className="mt-2 text-2xl font-black leading-tight">Formulaire 30 secondes</h2>

      <div className="mt-4 space-y-2">
        <InputMock label="Pour qui ?" value="Trio Habitat (Immo + Courtier + Travaux)" />
        <InputMock label="Nom du contact" value="Nicolas Martin" />
        <InputMock label="Telephone" value="06 24 78 14 32" />
        <InputMock label="Projet detecte" value="Veut acheter avant l ete" />
      </div>

      <div className="mt-4 rounded-2xl border border-[#EAC886]/40 bg-[#EAC886]/12 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#F8E7BF]">Motivation instantanee</p>
        <p className="mt-1 text-sm font-bold text-[#F8E7BF]">Commission affichee: 12% | Delai moyen: 45 jours</p>
      </div>

      <button className="mt-4 h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 text-sm font-black uppercase tracking-wide text-black">
        Envoyer l opportunite
      </button>
      <p className="mt-2 text-center text-xs text-white/65">Un bon d apport numerique est cree automatiquement.</p>
    </div>
  );
}

function ScreenTrackingCommission() {
  return (
    <div className="h-full rounded-[24px] border border-fuchsia-300/30 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(131,51,173,0.45)_0%,rgba(36,21,55,0.9)_48%,rgba(14,12,24,1)_100%)] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-fuchsia-200/90">Suivi dossier</p>
      <h2 className="mt-2 text-2xl font-black leading-tight">Transparence totale</h2>

      <div className="mt-4 rounded-2xl border border-white/15 bg-black/25 p-3">
        <p className="text-sm font-black">Dossier: Nicolas Martin</p>
        <p className="text-xs text-white/70">Envoye le 12 Avril - Trio Habitat</p>
        <p className="mt-2 text-sm text-fuchsia-100">Commission convenue: 500 EUR fixe</p>
      </div>

      <ul className="mt-4 space-y-2 text-sm">
        <TimelineItem label="Opportunite recu" date="12 Avr" done />
        <TimelineItem label="RDV pris" date="14 Avr" done />
        <TimelineItem label="Offre envoyee" date="18 Avr" done />
        <TimelineItem label="Signature finale" date="En attente" />
      </ul>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="h-10 rounded-xl border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide">Voir details</button>
        <button className="h-10 rounded-xl bg-fuchsia-300 text-xs font-black uppercase tracking-wide text-black">Relancer membre</button>
      </div>
    </div>
  );
}

function PhoneFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <article className="rounded-[32px] border border-white/15 bg-[#0A1020] p-3 shadow-[0_26px_55px_-35px_rgba(0,0,0,0.9)]">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/65">{label}</p>
        <span className="rounded-full border border-white/20 bg-white/5 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white/60">
          iPhone
        </span>
      </div>
      <div className="rounded-[28px] border border-white/10 bg-black/20 p-2">{children}</div>
    </article>
  );
}

function StatCard({ title, value, tone }: { title: string; value: string; tone: "cyan" | "emerald" }) {
  const classes =
    tone === "cyan"
      ? "border-cyan-300/35 bg-cyan-500/15 text-cyan-100"
      : "border-emerald-300/35 bg-emerald-500/15 text-emerald-100";
  return (
    <div className={`rounded-xl border p-2 ${classes}`}>
      <p className="text-[10px] uppercase tracking-[0.1em] opacity-85">{title}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function InputMock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/70">{label}</p>
      <div className="h-11 rounded-xl border border-white/20 bg-black/25 px-3 py-2 text-sm text-white/90">{value}</div>
    </div>
  );
}

function TimelineItem({ label, date, done = false }: { label: string; date: string; done?: boolean }) {
  return (
    <li className="flex items-center justify-between rounded-xl border border-white/15 bg-black/20 px-3 py-2">
      <span className="inline-flex items-center gap-2">
        <span className={`inline-flex h-2.5 w-2.5 rounded-full ${done ? "bg-emerald-300" : "bg-white/35"}`} />
        <span className="font-semibold">{label}</span>
      </span>
      <span className="text-xs text-white/70">{date}</span>
    </li>
  );
}
