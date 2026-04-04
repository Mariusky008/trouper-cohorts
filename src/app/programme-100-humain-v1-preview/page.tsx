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
    <section className="w-full max-w-[360px] rounded-[28px] border border-black/15 bg-white p-4 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.45)]">
      <div className="mb-4 rounded-2xl bg-black px-4 py-3 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#B6FF2B]">V1 Preview</p>
        <h2 className="mt-1 text-xl font-black leading-tight">{title}</h2>
        <p className="mt-1 text-sm font-medium text-white/80">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-[#F7F7F7] px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-black/50">{label}</p>
      <p className="mt-0.5 text-sm font-black text-black">{value}</p>
    </div>
  );
}

export default function Programme100HumainV1PreviewPage() {
  return (
    <main className={`${poppins.variable} font-poppins min-h-screen bg-[#F3F3F3] px-4 py-10 text-[#0B0B0B]`}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl border border-black/15 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">Prototype visuel</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-black leading-[1.05]">Programme 100% humain - V1 écran par écran</h1>
          <p className="mt-2 text-sm md:text-base font-medium text-black/70">
            Version maquette sans fonctionnalités. Objectif : valider le design, la lisibilité et la structure du parcours.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Screen title="1. Aujourd'hui" subtitle="Une mission claire, rien d'autre.">
            <div className="space-y-3">
              <div className="rounded-xl border border-black/15 bg-[#F7F7F7] p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/55">Mission du jour</p>
                <p className="mt-1 text-base font-black">Créer votre Offre Duo en 1 phrase vendable.</p>
                <p className="mt-1 text-sm font-semibold text-black/65">Durée estimée: 35 min</p>
              </div>
              <div className="rounded-xl border border-[#B6FF2B]/50 bg-[#F4FFE2] p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#2F7A00]">Livrable attendu</p>
                <p className="mt-1 text-sm font-bold text-[#1C4F00]">Nom + promesse + script DM validés.</p>
              </div>
              <button className="h-11 w-full rounded-xl bg-black text-sm font-black uppercase tracking-wide text-white hover:bg-black/90">
                Marquer comme terminé
              </button>
            </div>
          </Screen>

          <Screen title="2. Check-list" subtitle="Action -> Livrable -> KPI.">
            <div className="space-y-2.5">
              <div className="flex items-start gap-2 rounded-xl border border-black/10 p-3">
                <span className="mt-0.5 h-4 w-4 rounded-full border-2 border-black/30" />
                <p className="text-sm font-semibold">Offre exprimée en moins de 7 secondes</p>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-black/10 p-3">
                <span className="mt-0.5 h-4 w-4 rounded-full border-2 border-black/30" />
                <p className="text-sm font-semibold">1 phrase Instagram prête</p>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-black/10 p-3">
                <span className="mt-0.5 h-4 w-4 rounded-full border-2 border-black/30" />
                <p className="text-sm font-semibold">1 script DM prêt à envoyer</p>
              </div>
              <p className="pt-1 text-xs font-bold uppercase tracking-[0.12em] text-rose-700">Retard: 0 jour</p>
            </div>
          </Screen>

          <Screen title="3. Duo" subtitle="Le binôme et son cap commun.">
            <div className="space-y-3">
              <div className="rounded-xl border border-black/10 bg-[#F7F7F7] p-3">
                <p className="text-sm font-black">Jean Philippe + Jérémy</p>
                <p className="mt-1 text-sm font-semibold text-black/65">Sphère Habitat • Zone: Dax</p>
              </div>
              <div className="rounded-xl border border-black/10 p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/55">Promesse duo</p>
                <p className="mt-1 text-sm font-bold">Évitez 3 mois de visites inutiles avant d'acheter.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Kpi label="Réactivité" value="< 4h" />
                <Kpi label="Score Duo" value="82 / 100" />
              </div>
            </div>
          </Screen>

          <Screen title="4. Pipeline" subtitle="Simple: chaud, tiède, long terme.">
            <div className="space-y-2.5">
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-800">Chaud • 4</p>
                <p className="mt-1 text-sm font-bold text-emerald-900">2 RDV prévus cette semaine</p>
              </div>
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-amber-800">Tiède • 7</p>
                <p className="mt-1 text-sm font-bold text-amber-900">Relance DM sous 24h</p>
              </div>
              <div className="rounded-xl border border-slate-300 bg-slate-50 p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-700">Long terme • 12</p>
                <p className="mt-1 text-sm font-bold text-slate-800">Nurturing contenu</p>
              </div>
            </div>
          </Screen>

          <Screen title="5. Preuves" subtitle="Ce qui crédibilise et convertit.">
            <div className="space-y-2.5">
              <div className="rounded-xl border border-black/10 p-3">
                <p className="text-sm font-black">Mini étude de cas #01</p>
                <p className="mt-1 text-sm font-semibold text-black/65">Client bloqué -&gt; duo activé -&gt; RDV signé en 48h.</p>
              </div>
              <div className="rounded-xl border border-black/10 p-3">
                <p className="text-sm font-black">Témoignage vidéo (30 sec)</p>
                <p className="mt-1 text-sm font-semibold text-black/65">“On a arrêté de prospecter dans le vide.”</p>
              </div>
              <button className="h-10 w-full rounded-xl border border-black/20 bg-white text-xs font-black uppercase tracking-wide">
                Ajouter une preuve
              </button>
            </div>
          </Screen>

          <Screen title="6. Score Mois 1" subtitle="Pilotage orienté résultats, pas vanity.">
            <div className="grid grid-cols-2 gap-2.5">
              <Kpi label="Leads" value="18" />
              <Kpi label="RDV" value="6" />
              <Kpi label="Offres" value="3" />
              <Kpi label="Signatures" value="1" />
              <Kpi label="Temps réponse" value="26 min" />
              <Kpi label="Reco croisées" value="7" />
            </div>
            <div className="mt-3 rounded-xl border border-[#B6FF2B]/40 bg-[#F4FFE2] p-3">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#2F7A00]">Décision fin de mois</p>
              <p className="mt-1 text-sm font-bold text-[#1C4F00]">Traction validée -&gt; ouverture Duo 2</p>
            </div>
          </Screen>
        </div>
      </div>
    </main>
  );
}
