import Link from "next/link";

export default function PopeyHumanEclaireurPreviewPage() {
  return (
    <main className="min-h-screen bg-[#0A0B0C] text-white">
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]/85">Portail Eclaireur - Preview</p>
            <h1 className="text-3xl font-black">Ton reseau = ton cash</h1>
            <p className="mt-1 text-sm text-white/75">Tu envoies un contact, Popey le qualifie, tu touches 10% quand ca signe.</p>
          </div>
          <Link href="/popey-human/eclaireur" className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide">
            Retour
          </Link>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-emerald-300/40 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(18,70,52,0.95)_0%,rgba(15,26,28,0.95)_55%,rgba(9,11,13,1)_100%)] p-4 shadow-[0_24px_55px_-30px_rgba(16,185,129,0.8)]">
          <div className="pointer-events-none absolute -top-14 -right-14 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-200/90">Vue revenus</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-300/35 bg-emerald-500/15 p-3">
              <p className="text-[10px] uppercase font-black tracking-[0.1em] text-emerald-200/90">Potentiel en cours</p>
              <p className="mt-1 text-3xl font-black text-emerald-100">480 EUR</p>
            </div>
            <div className="rounded-xl border border-cyan-300/35 bg-cyan-500/15 p-3">
              <p className="text-[10px] uppercase font-black tracking-[0.1em] text-cyan-200/90">Encaisse ce mois</p>
              <p className="mt-1 text-3xl font-black text-cyan-100">220 EUR</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#EAC886]/45 bg-[#201a0f] p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]/90">Mission du jour</p>
            <p className="rounded-full border border-[#EAC886]/40 bg-[#EAC886]/12 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#EAC886]">
              Se termine dans 04:12:33
            </p>
          </div>
          <p className="mt-2 text-xl font-black">Envoie 1 lead avant 18h</p>
          <p className="text-sm text-[#EAC886]/80">Recompense: badge Sprinter + bonus visibilite.</p>
          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-1/4 rounded-full bg-gradient-to-r from-[#EAC886] to-emerald-300" />
          </div>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.1em] text-white/70">Progression: 0/1 lead</p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/15 bg-black/25 p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] font-black text-white/65">Streak</p>
            <p className="mt-1 text-2xl font-black">3 jours</p>
            <p className="text-xs text-emerald-200/85">Tu es en feu.</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-black/25 p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] font-black text-white/65">Niveau eclaireur</p>
            <p className="mt-1 text-2xl font-black text-[#EAC886]">Argent</p>
            <p className="text-xs text-white/70">340 / 500 XP</p>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-emerald-300/30 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(16,46,38,0.9)_0%,rgba(11,18,20,0.96)_52%,rgba(7,10,12,1)_100%)] p-4 sm:p-5 shadow-[0_24px_55px_-30px_rgba(16,185,129,0.7)]">
          <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-emerald-400/25 blur-3xl animate-pulse" />
          <div className="pointer-events-none absolute -left-12 -bottom-14 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl animate-pulse" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-100">
              CTA principal
            </div>
            <h2 className="mt-3 text-xl sm:text-2xl font-black leading-tight">J ai un contact a monetiser</h2>
            <p className="mt-2 text-sm text-white/80">Envoi en 20 secondes. Qualification et dispatch assures.</p>
          </div>

          <div className="mt-4 rounded-2xl border border-white/15 bg-black/25 p-3">
            <div className="flex items-center justify-between gap-2 text-[11px] font-black uppercase tracking-[0.1em]">
              <span className="text-white/70">Progression de l alerte</span>
              <span className="text-emerald-200">40%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 transition-all duration-500" />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] font-black uppercase tracking-[0.09em]">
              <span className="rounded-md border border-emerald-300/45 bg-emerald-500/20 px-2 py-1 text-center text-emerald-100">Contact</span>
              <span className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-center text-white/70">Projet</span>
              <span className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-center text-white/70">Contexte</span>
            </div>
          </div>

          <form className="relative mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Nom du contact</label>
              <input
                placeholder="Ex: Sophie Martin"
                className="h-12 w-full rounded-xl border border-white/20 bg-black/35 px-3 text-sm outline-none transition focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/25"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Telephone du contact</label>
              <input
                placeholder="Ex: 06 12 34 56 78"
                className="h-12 w-full rounded-xl border border-white/20 bg-black/35 px-3 text-sm outline-none transition focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/25"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Type de projet</label>
              <input
                placeholder="Immo, auto, sante..."
                className="h-12 w-full rounded-xl border border-white/20 bg-black/35 px-3 text-sm outline-none transition focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/25"
              />
            </div>
            <button className="group relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 text-black text-sm font-black uppercase tracking-wide shadow-[0_12px_30px_-14px_rgba(16,185,129,0.9)] transition hover:scale-[1.01]">
              <span className="absolute inset-0 bg-white/20 opacity-0 transition group-hover:opacity-100" />
              <span className="relative inline-flex items-center gap-2">Lancer mon alerte</span>
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/15 bg-black/25 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Ca signe en ce moment</p>
          <ul className="mt-2 space-y-2 text-sm">
            <li className="rounded-lg border border-emerald-300/25 bg-emerald-500/10 px-3 py-2">Lead signe aujourd hui - +180 EUR verses a Karim</li>
            <li className="rounded-lg border border-cyan-300/25 bg-cyan-500/10 px-3 py-2">Lead valide hier - +90 EUR pour Julie</li>
            <li className="rounded-lg border border-[#EAC886]/25 bg-[#EAC886]/10 px-3 py-2">7 leads convertis cette semaine</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/15 bg-black/25 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Top eclaireurs de Dax</p>
          <ol className="mt-2 space-y-2 text-sm">
            <li className="rounded-lg border border-white/15 bg-white/5 px-3 py-2">1. M*** - 5 leads</li>
            <li className="rounded-lg border border-white/15 bg-white/5 px-3 py-2">2. A*** - 4 leads</li>
            <li className="rounded-lg border border-white/15 bg-white/5 px-3 py-2">3. T*** - 3 leads</li>
          </ol>
          <p className="mt-3 rounded-lg border border-[#EAC886]/30 bg-[#EAC886]/12 px-3 py-2 text-sm text-[#EAC886]">
            Tu es 6e - encore 1 lead pour passer 4e.
          </p>
        </section>
      </div>
    </main>
  );
}
