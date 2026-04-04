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

function Screen({ title, subtitle, children }: ScreenProps) {
  return (
    <section className="w-full max-w-[390px] rounded-[28px] border border-black/15 bg-white p-4 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.45)]">
      <div className="mb-4 rounded-2xl bg-black px-4 py-3 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#B6FF2B]">V2 WhatsApp-First</p>
        <h2 className="mt-1 text-xl font-black leading-tight">{title}</h2>
        <p className="mt-1 text-sm font-medium text-white/80">{subtitle}</p>
      </div>
      {children}
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
          <h1 className="mt-2 text-3xl md:text-4xl font-black leading-[1.05]">Programme 100% humain - V2 WhatsApp-first</h1>
          <p className="mt-2 text-sm md:text-base font-medium text-black/70">
            Les membres restent sur WhatsApp. L'app sert de cockpit opérateur pour piloter plusieurs duos, détecter les retards et industrialiser les preuves.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Screen title="1. Cockpit Jour" subtitle="Vue globale des duos en 10 secondes.">
            <div className="space-y-2.5">
              <Stat label="Duos actifs" value="8 duos" />
              <Stat label="Alertes rouges" value="3 duos sans action depuis 48h" tone="danger" />
              <Stat label="Traction du jour" value="6 RDV pris / 2 offres envoyées" tone="good" />
              <button className="h-11 w-full rounded-xl bg-black text-xs font-black uppercase tracking-wide text-white">
                Ouvrir les priorités du jour
              </button>
            </div>
          </Screen>

          <Screen title="2. File Priorités" subtitle="Qui contacter maintenant sur WhatsApp.">
            <div className="space-y-2.5">
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-rose-800">Urgent</p>
                <p className="mt-1 text-sm font-bold text-rose-900">Duo Habitat 03 - pas de relance depuis 3 jours</p>
                <button className="mt-2 h-8 rounded-lg bg-black px-3 text-[11px] font-black uppercase tracking-wide text-white">Envoyer rappel WhatsApp</button>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">À traiter</p>
                <p className="mt-1 text-sm font-bold text-amber-900">Duo Immo 01 - script J18 non validé</p>
              </div>
            </div>
          </Screen>

          <Screen title="3. Fiche Duo" subtitle="Tout en une page: mission, preuves, KPI.">
            <div className="space-y-2.5">
              <div className="rounded-xl border border-black/10 bg-[#F7F7F7] p-3">
                <p className="text-sm font-black">Jean Philippe + Jeremy</p>
                <p className="mt-1 text-sm font-semibold text-black/65">Sphère Habitat • Semaine 3 • Jour 18</p>
              </div>
              <div className="rounded-xl border border-black/10 p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/55">Mission active</p>
                <p className="mt-1 text-sm font-bold">Formaliser le script de traitement des leads (réponse &lt; 30 min).</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Leads" value="14" />
                <Stat label="RDV" value="4" />
              </div>
            </div>
          </Screen>

          <Screen title="4. Ops WhatsApp" subtitle="Console d'envoi et relance guidée.">
            <div className="space-y-2.5">
              <div className="rounded-xl border border-black/10 p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/55">Template du jour</p>
                <p className="mt-1 text-sm font-semibold text-black/80">
                  "Salut, je te relance rapidement sur ton projet. On te propose un point de 15 min pour valider le plan d'action."
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="h-9 rounded-lg border border-black/20 bg-white text-[11px] font-black uppercase">Copier</button>
                <button className="h-9 rounded-lg bg-black text-[11px] font-black uppercase text-white">Ouvrir WhatsApp</button>
              </div>
              <Stat label="Objectif J" value="10 relances envoyées" />
            </div>
          </Screen>

          <Screen title="5. Mur de Preuves" subtitle="Centraliser tout ce qui convertit.">
            <div className="space-y-2.5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-800">Nouveau</p>
                <p className="mt-1 text-sm font-bold text-emerald-900">Témoignage vidéo client - Duo Habitat 02</p>
              </div>
              <div className="rounded-xl border border-black/10 p-3">
                <p className="text-sm font-black">Capture WhatsApp “merci, super réactifs”</p>
                <p className="mt-1 text-sm font-semibold text-black/65">Tag: Réactivité • Semaine 2</p>
              </div>
              <button className="h-10 w-full rounded-xl border border-black/20 bg-white text-xs font-black uppercase tracking-wide">
                Publier sur le mur social
              </button>
            </div>
          </Screen>

          <Screen title="6. Bilan & Scale" subtitle="Décider quoi ouvrir au mois suivant.">
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <Stat label="CA pipeline" value="27k EUR" tone="good" />
                <Stat label="Duo en risque" value="2" tone="danger" />
              </div>
              <div className="rounded-xl border border-black/10 p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/55">Décision recommandée</p>
                <p className="mt-1 text-sm font-bold">Ouvrir Duo 2 sur notaire + assurance</p>
              </div>
              <button className="h-10 w-full rounded-xl bg-black text-xs font-black uppercase tracking-wide text-white">
                Générer plan mois 2
              </button>
            </div>
          </Screen>
        </div>
      </div>
    </main>
  );
}
