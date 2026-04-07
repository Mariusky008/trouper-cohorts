"use client";

import { useMemo, useState } from "react";

type Role = "membre" | "admin";
type Tab = "radar" | "portefeuille" | "cercle";
type DealStatus = "Radar" | "En cours" | "Victoire";
type FlowScreen = 1 | 2 | 3 | 4;

const memberDeals: Array<{
  id: string;
  client: string;
  metier: string;
  budget: string;
  status: DealStatus;
}> = [
  { id: "L-204", client: "Famille Dubois", metier: "Cuisine + Électricité", budget: "22 000€", status: "Radar" },
  { id: "L-187", client: "M. Larrieu", metier: "Salle de bain", budget: "11 500€", status: "En cours" },
  { id: "L-169", client: "SCI Gascogne", metier: "Rénovation globale", budget: "48 000€", status: "Victoire" },
];

const adminLeads = [
  { id: "VOC-991", from: "Thomas (Carreleur)", at: "09:14", note: "Maison vendue, cuisine à refaire, budget bon." },
  { id: "VOC-992", from: "Claire (Agent Immo)", at: "10:02", note: "Couple investisseur, cherche équipe complète." },
  { id: "VOC-993", from: "David (Plombier)", at: "11:21", note: "Client veut rénovation salle d'eau + domotique." },
];

const cercle = [
  "Agent Immo", "Courtier", "Notaire", "Diagnostiqueur", "Architecte", "Maître d'Oeuvre", "Cuisiniste", "Plombier",
  "Électricien", "Menuisier", "Façadier", "Paysagiste", "Déménageur", "Conciergerie", "Décorateur",
];

const flowTitles: Record<FlowScreen, string> = {
  1: "Screen 1 - Tous les duos",
  2: "Screen 2 - Planning global",
  3: "Screen 3 - Programme du jour",
  4: "Screen 4 - Bilan mensuel",
};

function statusStyle(status: DealStatus) {
  if (status === "Victoire") return "bg-emerald-500/20 text-emerald-300 border-emerald-400/35";
  if (status === "En cours") return "bg-amber-500/20 text-amber-200 border-amber-400/35";
  return "bg-slate-500/20 text-slate-200 border-slate-400/35";
}

export default function RadarElitePreviewPage() {
  const [role, setRole] = useState<Role>("membre");
  const [tab, setTab] = useState<Tab>("radar");
  const [flowScreen, setFlowScreen] = useState<FlowScreen>(1);
  const [sunMode, setSunMode] = useState(false);
  const [selectedLead, setSelectedLead] = useState(adminLeads[0].id);

  const selectedLeadData = useMemo(
    () => adminLeads.find((lead) => lead.id === selectedLead) ?? adminLeads[0],
    [selectedLead]
  );

  return (
    <main className={`${sunMode ? "sun-mode bg-[#F1F4EC] text-black" : "bg-[#080909] text-white"} min-h-screen px-4 py-8 md:py-10 transition-colors`}>
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${sunMode ? "border-black/15 bg-black/5 text-black/75" : "border-[#C49A4A]/35 bg-[#C49A4A]/10 text-[#EAC886]"}`}>
            Prototype Visuel • Popey Academy
          </p>
          <h1 className="mt-3 text-3xl md:text-5xl font-black leading-tight">
            Radar Business Élité
          </h1>
          <p className={`mt-3 text-sm md:text-base ${sunMode ? "text-black/65" : "text-white/70"}`}>
            Mockup UX uniquement. Aucun backend branché. Objectif : potentiel d’attraction et d’addiction visuelle.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <div className={`inline-flex rounded-xl border p-1 ${sunMode ? "border-black/15 bg-black/5" : "border-white/10 bg-white/5"}`}>
            <button
              onClick={() => setRole("membre")}
              className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wide transition ${
                role === "membre" ? "bg-[#0E3E2A] text-emerald-200" : sunMode ? "text-black/65" : "text-white/70"
              }`}
            >
              Vue Membre
            </button>
            <button
              onClick={() => setRole("admin")}
              className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wide transition ${
                role === "admin" ? "bg-[#3E2E0E] text-[#EAC886]" : sunMode ? "text-black/65" : "text-white/70"
              }`}
            >
              Vue Admin
            </button>
          </div>
          <button
            onClick={() => setSunMode((prev) => !prev)}
            className={`touch-btn rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-wide ${sunMode ? "border-black/20 bg-black text-white" : "border-[#EAC886]/30 bg-[#EAC886]/10 text-[#EAC886]"}`}
          >
            {sunMode ? "Mode Soleil ON" : "Mode Soleil OFF"}
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className={`phone-shell rounded-[30px] border p-4 ${sunMode ? "border-black/15 bg-white" : "border-white/10 bg-gradient-to-b from-[#121414] to-[#0B0D0D]"} shadow-[0_24px_55px_-30px_rgba(0,0,0,0.8)]`}>
            <div className={`rounded-[24px] border p-4 min-h-[640px] ${sunMode ? "border-black/15 bg-[#F9FBF5] text-black" : "border-white/10 bg-[#0A0B0C]"}`}>
              <div className={`mb-4 flex items-center justify-between text-[10px] font-black ${sunMode ? "text-black/70" : "text-white/60"}`}>
                <span>9:41</span><span className="h-5 w-24 rounded-full bg-black/20" /><span>5G 100%</span>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/50">Login Screen</p>
              <div className="mt-16 text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-[#C49A4A] to-[#EAC886]" />
                <h2 className="mt-6 text-2xl font-black leading-tight">Bienvenue dans l’Élite de Dax.<br />Identifiez-vous.</h2>
                <div className="mt-8 space-y-3">
                  <div className="h-12 rounded-xl border border-white/15 bg-white/5" />
                  <div className="h-12 rounded-xl border border-white/15 bg-white/5" />
                </div>
                <button className="mt-6 h-12 w-full rounded-xl bg-[#C49A4A] text-black font-black uppercase tracking-wide">
                  Entrer dans le cercle
                </button>
              </div>
            </div>
          </section>

          {role === "membre" ? (
            <section className={`phone-shell lg:col-span-2 rounded-[30px] border p-4 ${sunMode ? "border-black/15 bg-white" : "border-white/10 bg-gradient-to-b from-[#111414] to-[#0A0C0C]"} shadow-[0_24px_55px_-30px_rgba(0,0,0,0.9)]`}>
              <div className={`rounded-[24px] border p-4 min-h-[640px] relative ${sunMode ? "border-black/15 bg-[#F9FBF5] text-black" : "border-white/10 bg-[#090B0B]"}`}>
                <div className={`mb-4 flex items-center justify-between text-[10px] font-black ${sunMode ? "text-black/70" : "text-white/60"}`}>
                  <span>9:41</span><span className="h-5 w-24 rounded-full bg-black/20" /><span>5G 82%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-300/80">Popey Radar</p>
                    <h2 className="text-lg font-black">Dashboard Membre</h2>
                  </div>
                  <p className="rounded-full border border-[#C49A4A]/35 bg-[#C49A4A]/10 px-3 py-1 text-xs font-black text-[#EAC886]">Niveau Elite</p>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#C49A4A]/30 bg-[#2A2111] p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]/85">Cash Business reçu</p>
                    <p className="mt-1 text-2xl font-black text-[#EAC886]">96 300€</p>
                  </div>
                  <div className="rounded-xl border border-emerald-400/30 bg-[#10251D] p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-300/85">Commissions encaissées</p>
                    <p className="mt-1 text-2xl font-black text-emerald-300">12 840€</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {(["radar", "portefeuille", "cercle"] as Tab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wide transition ${
                        tab === t ? "bg-white text-black" : "border border-white/15 text-white/70"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className={`mt-4 rounded-xl border p-3 ${sunMode ? "border-black/15 bg-black/[0.03]" : "border-white/10 bg-white/5"}`}>
                  <p className={`text-xs font-black uppercase tracking-[0.12em] ${sunMode ? "text-black/60" : "text-white/60"}`}>Flow clair demandé</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => setFlowScreen(n as FlowScreen)}
                        className={`touch-btn rounded-md px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide ${
                          flowScreen === n ? "bg-[#C49A4A] text-black" : sunMode ? "border border-black/20 text-black/70" : "border border-white/20 text-white/75"
                        }`}
                      >
                        Screen {n}
                      </button>
                    ))}
                  </div>
                  <div key={flowScreen} className={`mt-3 rounded-lg border p-3 animate-[appScreenIn_.28s_ease-out] ${sunMode ? "border-black/15 bg-white" : "border-white/10 bg-black/30"}`}>
                    <p className="text-sm font-black">{flowTitles[flowScreen]}</p>
                    {flowScreen === 1 && <p className="mt-1 text-xs opacity-80">Duo Habitat 01 • J18 En avance · Duo Immo 02 • J10 En retard · Duo Travaux 03 • J4 À suivre</p>}
                    {flowScreen === 2 && <p className="mt-1 text-xs opacity-80">Mois 1 : J1 onboarding ✅ J3 offre duo ✅ J10 intros ❌ J18 scripts en cours</p>}
                    {flowScreen === 3 && <p className="mt-1 text-xs opacity-80">Aujourd’hui J18 : Formaliser script DM + appel + qualification. Checklist prête.</p>}
                    {flowScreen === 4 && <p className="mt-1 text-xs opacity-80">Bilan: Leads 18 · RDV 6 · Dossiers 2 · Décision mois 2 à valider.</p>}
                  </div>
                </div>

                {tab === "radar" && (
                  <div className="mt-4 space-y-3">
                    {memberDeals.map((deal) => (
                      <article key={deal.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black">{deal.client}</p>
                            <p className="text-xs text-white/65">{deal.metier} • {deal.budget}</p>
                          </div>
                          <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${statusStyle(deal.status)}`}>
                            {deal.status}
                          </span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button className="h-9 rounded-lg bg-emerald-500/85 px-3 text-xs font-black uppercase tracking-wide text-black">
                            Appeler le client
                          </button>
                          <button className="h-9 rounded-lg border border-white/20 px-3 text-xs font-black uppercase tracking-wide text-white/85">
                            Mettre à jour
                          </button>
                        </div>
                      </article>
                    ))}
                    <p className="rounded-lg border border-dashed border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70">
                      Le Radar est calme... Pour l'instant. Soyez le prochain à faire pleuvoir le business !
                    </p>
                  </div>
                )}

                {tab === "portefeuille" && (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-[#C49A4A]/25 bg-[#2B2110] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]/80">Cash Business reçu</p>
                      <p className="mt-1 text-4xl font-black text-[#EAC886]">96 300€</p>
                    </div>
                    <div className="rounded-xl border border-emerald-400/25 bg-[#10251D] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300/80">Commissions encaissées</p>
                      <p className="mt-1 text-4xl font-black text-emerald-300">12 840€</p>
                    </div>
                  </div>
                )}

                {tab === "cercle" && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {cercle.map((item) => (
                      <p key={item} className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-bold text-white/90">
                        {item}
                      </p>
                    ))}
                  </div>
                )}

                <button className="touch-btn absolute bottom-4 left-1/2 -translate-x-1/2 h-14 w-[calc(100%-2rem)] rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-black uppercase tracking-wide shadow-[0_0_0_0_rgba(16,185,129,0.5)] animate-[pulse_1.8s_ease-in-out_infinite]">
                  Signaler une opportunité (Vocal)
                </button>
              </div>
            </section>
          ) : (
            <section className={`phone-shell lg:col-span-2 rounded-[30px] border p-4 ${sunMode ? "border-black/15 bg-white" : "border-white/10 bg-gradient-to-b from-[#111414] to-[#0A0C0C]"} shadow-[0_24px_55px_-30px_rgba(0,0,0,0.9)]`}>
              <div className={`rounded-[24px] border p-4 min-h-[640px] ${sunMode ? "border-black/15 bg-[#F9FBF5] text-black" : "border-white/10 bg-[#090B0B]"}`}>
                <div className={`mb-4 flex items-center justify-between text-[10px] font-black ${sunMode ? "text-black/70" : "text-white/60"}`}>
                  <span>9:41</span><span className="h-5 w-24 rounded-full bg-black/20" /><span>5G 91%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#EAC886]/80">Dashboard Admin</p>
                    <h2 className="text-lg font-black">Jean-Philippe • Dispatch Chirurgical</h2>
                  </div>
                  <p className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">Temps réel</p>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-white/65">Vocaux reçus</p>
                    <div className="mt-3 space-y-2">
                      {adminLeads.map((lead) => (
                        <button
                          key={lead.id}
                          onClick={() => setSelectedLead(lead.id)}
                          className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                            selectedLead === lead.id ? "border-[#EAC886]/50 bg-[#EAC886]/10" : "border-white/10 bg-black/20"
                          }`}
                        >
                          <p className="text-sm font-black">{lead.from}</p>
                          <p className="text-xs text-white/65">{lead.id} • {lead.at}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-white/65">Qualification</p>
                    <p className="mt-2 text-sm font-semibold text-white/80">{selectedLeadData.note}</p>
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="rounded-lg border border-white/15 bg-black/25 px-2 py-2">Nom client: Mme Martin</div>
                      <div className="rounded-lg border border-white/15 bg-black/25 px-2 py-2">Budget estimé: 27 000€</div>
                      <div className="rounded-lg border border-white/15 bg-black/25 px-2 py-2">Métiers concernés: Plombier, Carreleur</div>
                    </div>
                    <button className="mt-3 h-10 w-full rounded-lg bg-[#EAC886] text-black text-xs font-black uppercase tracking-wide">
                      Valider & Qualifier
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300">Gong de l’Élite</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-100">
                    Félicitations à Thomas ! Son lead vient de rapporter 780€ de commission via Claire. La pluie tombe sur Dax !
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
      <style jsx global>{`
        @keyframes appScreenIn {
          from { opacity: 0; transform: translateY(8px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .phone-shell {
          position: relative;
        }
        .phone-shell::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: 10px;
          width: 120px;
          height: 4px;
          border-radius: 999px;
          transform: translateX(-50%);
          background: rgba(255,255,255,0.25);
        }
        .sun-mode .touch-btn {
          min-height: 52px;
          font-size: 13px;
        }
      `}</style>
    </main>
  );
}
