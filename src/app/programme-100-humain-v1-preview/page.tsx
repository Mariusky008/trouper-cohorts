import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

type ScreenProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

function AppFrame({ title, subtitle, children }: ScreenProps) {
  return (
    <section className="w-full max-w-[390px] rounded-[30px] border border-black/15 bg-white p-3 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.45)]">
      <div className="rounded-[22px] border border-black/10 bg-[#FCFCFC]">
        <div className="rounded-t-[22px] bg-black px-4 py-3 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#B6FF2B]">App Preview</p>
          <h2 className="mt-1 text-lg font-black leading-tight">{title}</h2>
          <p className="mt-1 text-xs font-semibold text-white/80">{subtitle}</p>
        </div>
        <div className="p-3">{children}</div>
        <div className="grid grid-cols-4 border-t border-black/10 bg-white px-2 py-2 text-[10px] font-black uppercase tracking-wide text-black/55">
          <button className="rounded-md bg-black text-white py-1">Duos</button>
          <button className="py-1">Planning</button>
          <button className="py-1">Actions</button>
          <button className="py-1">Preuves</button>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "danger" | "good" }) {
  const toneClass =
    tone === "danger"
      ? "bg-rose-50 border-rose-200 text-rose-800"
      : tone === "good"
        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
        : "bg-[#F7F7F7] border-black/10 text-black";
  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] opacity-70">{label}</p>
      <p className="mt-0.5 text-sm font-black">{value}</p>
    </div>
  );
}

export default function Programme100HumainV1PreviewPage() {
  return (
    <main className={`${poppins.variable} font-poppins min-h-screen bg-[#F3F3F3] px-4 py-10 text-[#0B0B0B]`}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-2xl border border-black/15 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">Prototype visuel</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-black leading-[1.05]">Programme 100% humain - UX simplifiée écran par écran</h1>
          <p className="mt-2 text-sm md:text-base font-medium text-black/70">
            Flow clair demandé: Screen 1 liste des duos -&gt; Screen 2 planning mensuel d&apos;un duo -&gt; Screen 3 programme du jour et actions -&gt; Screen 4 bilan et décisions.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.12em]">
            <span className="rounded-full border border-black/15 bg-[#F7F7F7] px-3 py-1">Screen 1: Tous les duos</span>
            <span className="rounded-full border border-black/15 bg-[#F7F7F7] px-3 py-1">Screen 2: Planning global</span>
            <span className="rounded-full border border-black/15 bg-[#F7F7F7] px-3 py-1">Screen 3: Programme du jour</span>
            <span className="rounded-full border border-black/15 bg-[#F7F7F7] px-3 py-1">Screen 4: Bilan mensuel</span>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <AppFrame title="Screen 1 - Tous les duos" subtitle="Liste simple + statut + action">
            <div className="space-y-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-black">Duo Habitat 01</p>
                <p className="text-xs font-semibold text-emerald-800">Semaine 3 • J18 • En avance</p>
                <button className="mt-2 h-8 rounded-lg bg-black px-3 text-[11px] font-black uppercase tracking-wide text-white">Ouvrir le duo</button>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-sm font-black">Duo Immo 02</p>
                <p className="text-xs font-semibold text-rose-800">Semaine 2 • J10 • En retard</p>
                <button className="mt-2 h-8 rounded-lg bg-black px-3 text-[11px] font-black uppercase tracking-wide text-white">Ouvrir le duo</button>
              </div>
              <div className="rounded-xl border border-black/10 p-3">
                <p className="text-sm font-black">Duo Travaux 03</p>
                <p className="text-xs font-semibold text-black/60">Semaine 1 • J4 • À suivre</p>
              </div>
            </div>
          </AppFrame>

          <AppFrame title="Screen 2 - Planning mensuel" subtitle="Mois 1 complet avec validations">
            <div className="space-y-2">
              <div className="rounded-xl border border-black/10 p-2.5">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/55">Semaine 1</p>
                <p className="text-xs font-semibold text-black/75">J1 onboarding ✅ • J2 matching ✅ • J3 offre duo ✅ • J4 message pub ✅ • J5 cohésion ✅</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-amber-800">Semaine 2</p>
                <p className="text-xs font-semibold text-amber-900">J8 tunnel ❌ • J9 extraction réseau ✅ • J10 intros ❌ • J11 preuves ❌ • J12 point business ✅</p>
              </div>
              <div className="rounded-xl border border-black/10 p-2.5">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/55">Semaine 3</p>
                <p className="text-xs font-semibold text-black/75">J15 ajustement ✅ • J16 ads ✅ • J17 lancement ✅ • J18 scripts en cours</p>
              </div>
              <button className="h-9 w-full rounded-lg border border-black/20 bg-white text-[11px] font-black uppercase tracking-wide">
                Voir programme du jour
              </button>
            </div>
          </AppFrame>

          <AppFrame title="Screen 3 - Programme du jour" subtitle="J18 avec actions immédiates">
            <div className="space-y-2">
              <div className="rounded-xl border border-black/10 bg-[#F7F7F7] p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/55">Aujourd'hui - J18</p>
                <p className="mt-1 text-sm font-black">Formaliser le script DM + appel + qualification</p>
              </div>
              <div className="rounded-xl border border-black/10 p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/55">Checklist J18</p>
                <p className="text-xs font-semibold text-black/75">Template DM prêt ❌</p>
                <p className="text-xs font-semibold text-black/75">Script appel 15 min ❌</p>
                <p className="text-xs font-semibold text-black/75">Grille qualification ✅</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="h-9 rounded-lg bg-black text-[11px] font-black uppercase tracking-wide text-white">Copier template</button>
                <button className="h-9 rounded-lg border border-black/20 bg-white text-[11px] font-black uppercase tracking-wide">Ouvrir WhatsApp</button>
              </div>
              <button className="h-9 w-full rounded-lg bg-[#B6FF2B] text-[11px] font-black uppercase tracking-wide text-black">
                Valider J18
              </button>
            </div>
          </AppFrame>

          <AppFrame title="Screen 4 - Bilan du duo" subtitle="KPI + preuves + décision mois 2">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Leads" value="18" />
                <Stat label="RDV" value="6" />
                <Stat label="Dossiers concrets" value="2" tone="good" />
                <Stat label="Preuves manquantes" value="1" tone="danger" />
              </div>
              <div className="rounded-xl border border-black/10 p-2.5">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/55">Dernière preuve</p>
                <p className="text-xs font-semibold text-black/80">Témoignage vidéo client - posté hier</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="h-9 rounded-lg border border-black/20 bg-white text-[11px] font-black uppercase tracking-wide">Go mois 2</button>
                <button className="h-9 rounded-lg border border-black/20 bg-white text-[11px] font-black uppercase tracking-wide">Rematch duo</button>
              </div>
            </div>
          </AppFrame>
        </div>
      </div>
    </main>
  );
}
