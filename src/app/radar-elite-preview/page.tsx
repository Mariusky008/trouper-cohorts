"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Role = "membre" | "admin";
type MemberTab = "clients" | "signal" | "cash";

type ClientLead = {
  id: string;
  client: string;
  budget: string;
  besoin: string;
  telephone: string;
  adresse: string;
  statut: "Radar" | "En cours" | "Victoire";
  notes: string;
};

const memberLeads: ClientLead[] = [
  {
    id: "L-204",
    client: "Famille Dubois",
    budget: "22 000€",
    besoin: "Cuisine + électricité",
    telephone: "06 12 45 78 90",
    adresse: "Dax centre",
    statut: "À contacter",
    notes: "Projet à lancer sous 10 jours, budget validé, décisionnaire présent.",
  },
  {
    id: "L-213",
    client: "SCI Gascogne",
    budget: "48 000€",
    besoin: "Rénovation globale",
    telephone: "06 44 18 93 70",
    adresse: "Saint-Paul-lès-Dax",
    statut: "En cours",
    notes: "Attente du devis final. Bonne probabilité de signature.",
  },
];

export default function RadarElitePreviewPage() {
  const [role, setRole] = useState<Role>("membre");
  const [memberTab, setMemberTab] = useState<MemberTab>("signal");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLead, setSelectedLead] = useState<ClientLead | null>(null);

  useEffect(() => {
    if (!isRecording) return;
    const timer = window.setTimeout(() => setIsRecording(false), 2600);
    return () => window.clearTimeout(timer);
  }, [isRecording]);

  const triggerRecording = () => {
    setMemberTab("signal");
    setIsRecording(true);
  };

  return (
    <main className="min-h-screen bg-[#0A0B0C] text-white px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h1 className="mt-3 text-3xl md:text-5xl font-black leading-tight">
            Popey Radar
          </h1>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setRole("membre")}
              className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wide transition ${
                role === "membre" ? "bg-[#0E3E2A] text-emerald-200" : "text-white/70"
              }`}
            >
              Membre
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
          <div className="relative rounded-[24px] border border-white/10 bg-[#090B0B] p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/60">
              {role === "membre" ? "Vue membre" : "Vue admin"}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">{role === "membre" ? "Mon écran du jour" : "Mon cockpit admin"}</h2>
              {role === "membre" && (
                <Link
                  href="/radar-elite-preview/notifications"
                  className="group relative h-14 w-14 rounded-2xl border border-white/20 bg-white/5 text-2xl transition hover:bg-white/10 inline-flex items-center justify-center bell-pop"
                  aria-label="Aller aux notifications"
                >
                  🔔
                  <span className="absolute -right-1 -top-1 inline-flex min-w-6 h-6 items-center justify-center rounded-full bg-emerald-400 px-1.5 text-[10px] font-black text-black ring-2 ring-[#090B0B]">
                    2
                  </span>
                </Link>
              )}
            </div>

            {role === "membre" ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-[#EAC886]/25 bg-[#2A2111] p-3">
                  <p className="text-[10px] uppercase font-black tracking-[0.12em] text-[#EAC886]/80">Dossiers signés ce mois</p>
                  <p className="mt-1 text-xl font-black text-[#EAC886]">4</p>
                  <p className="text-[11px] text-[#EAC886]/70">Objectif: 6 dossiers</p>
                </div>
                <div className="rounded-xl border border-emerald-400/25 bg-[#10251D] p-3">
                  <p className="text-[10px] uppercase font-black tracking-[0.12em] text-emerald-300/80">Commissions ce mois</p>
                  <p className="mt-1 text-xl font-black text-emerald-300">2 180€</p>
                  <p className="text-[11px] text-emerald-300/70">+420€ vs semaine dernière</p>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                  <p className="text-[10px] uppercase font-black tracking-[0.12em] text-white/65">Action prioritaire</p>
                  <p className="mt-1 text-sm font-black">Envoyer 1 vocal exploitable</p>
                  <p className="text-[11px] text-white/60">10 secondes suffisent</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                  <p className="text-[10px] uppercase font-black tracking-[0.12em] text-white/65">Vocaux reçus</p>
                  <p className="mt-1 text-xl font-black">12</p>
                </div>
                <div className="rounded-xl border border-[#EAC886]/25 bg-[#2A2111] p-3">
                  <p className="text-[10px] uppercase font-black tracking-[0.12em] text-[#EAC886]/80">Leads qualifiés</p>
                  <p className="mt-1 text-xl font-black text-[#EAC886]">7</p>
                </div>
                <div className="rounded-xl border border-emerald-400/25 bg-[#10251D] p-3">
                  <p className="text-[10px] uppercase font-black tracking-[0.12em] text-emerald-300/80">Commissions validées</p>
                  <p className="mt-1 text-xl font-black text-emerald-300">3 280€</p>
                </div>
              </div>
            )}

            {role === "membre" && (
              <>
                <div key={memberTab} className="mt-4 animate-[fadeIn_.25s_ease-out]">
                  {memberTab === "clients" && (
                    <div className="rounded-2xl border border-[#EAC886]/25 bg-[#EAC886]/10 p-5">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]">Clients reçus</p>
                      <h3 className="mt-1 text-xl font-black">Touchez un client pour ouvrir sa fiche complète</h3>
                      <p className="mt-2 text-sm text-white/80">Vous voyez besoin, budget, contact et prochaine action.</p>
                      <div className="mt-4 space-y-2">
                        {memberLeads.map((lead) => (
                          <button
                            key={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className="w-full rounded-xl border border-white/15 bg-black/25 p-3 text-left"
                          >
                            <p className="font-black">{lead.client} • {lead.budget}</p>
                            <p className="text-xs text-white/70">{lead.besoin} • {lead.statut}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {memberTab === "signal" && (
                    <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300">Signal vocal</p>
                      <h3 className="mt-1 text-xl font-black">Envoyer une opportunité au groupe</h3>
                      <p className="mt-2 text-sm text-white/80">Maintenez 10 secondes pour décrire le besoin client.</p>
                      <button
                        onClick={triggerRecording}
                        className={`mt-4 h-16 w-full rounded-xl text-sm font-black uppercase tracking-wide ${
                          isRecording
                            ? "bg-red-500 text-white"
                            : "bg-emerald-400 text-black"
                        }`}
                      >
                        {isRecording ? "● Enregistrement en cours..." : "Signaler une opportunité (Vocal)"}
                      </button>
                      <div className="mt-3 h-2 rounded-full bg-black/30 overflow-hidden">
                        <div
                          className={`h-full bg-red-400 transition-all duration-300 ${
                            isRecording ? "w-full animate-[recordPulse_1.2s_ease-in-out_infinite]" : "w-0"
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {memberTab === "cash" && (
                    <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300">Cash</p>
                      <h3 className="mt-1 text-xl font-black">Déclarez un dossier signé et votre commission</h3>
                      <p className="mt-2 text-sm text-white/80">Quand un dossier est signé, vous entrez le montant ici.</p>
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

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-2">
                  <div className="grid grid-cols-3 gap-2 items-end">
                    <button
                      onClick={() => setMemberTab("clients")}
                      className={`h-12 rounded-xl text-xs font-black uppercase tracking-wide ${
                        memberTab === "clients" ? "bg-white text-black" : "border border-white/20 text-white/75"
                      }`}
                    >
                      Clients
                    </button>
                    <button
                      onClick={() => setMemberTab("signal")}
                      className={`h-14 rounded-2xl text-xs font-black uppercase tracking-wide ${
                        memberTab === "signal"
                          ? "bg-emerald-400 text-black shadow-[0_10px_25px_-12px_rgba(52,211,153,0.9)]"
                          : "border border-emerald-300/40 text-emerald-200"
                      }`}
                    >
                      Signal
                    </button>
                    <button
                      onClick={() => setMemberTab("cash")}
                      className={`h-12 rounded-xl text-xs font-black uppercase tracking-wide ${
                        memberTab === "cash" ? "bg-white text-black" : "border border-white/20 text-white/75"
                      }`}
                    >
                      Cash
                    </button>
                  </div>
                </div>
              </>
            )}

            {role === "admin" && (
              <div className="mt-5 animate-[fadeIn_.25s_ease-out]">
                <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Priorité admin</p>
                  <h3 className="mt-1 text-xl font-black">Valider 3 vocaux et dispatcher</h3>
                  <div className="mt-3 space-y-2">
                    <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm">VOC-991 • Thomas (Carreleur)</p>
                    <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm">VOC-992 • Claire (Agent Immo)</p>
                    <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm">VOC-993 • David (Plombier)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center" onClick={() => setSelectedLead(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0E1011] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase font-black tracking-[0.12em] text-[#EAC886]/80">Fiche client</p>
                <h3 className="mt-1 text-2xl font-black">{selectedLead.client}</h3>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-xs font-black uppercase tracking-wide text-white/70">Fermer</button>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2"><span className="font-black">Besoin:</span> {selectedLead.besoin}</p>
              <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2"><span className="font-black">Budget:</span> {selectedLead.budget}</p>
              <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2"><span className="font-black">Zone:</span> {selectedLead.adresse}</p>
              <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2"><span className="font-black">Statut:</span> {selectedLead.statut}</p>
              <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2"><span className="font-black">Notes:</span> {selectedLead.notes}</p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a href={`tel:${selectedLead.telephone.replaceAll(" ", "")}`} className="h-11 rounded-xl bg-emerald-400 text-black text-sm font-black uppercase tracking-wide inline-flex items-center justify-center">
                Appeler le client
              </a>
              <button className="h-11 rounded-xl border border-[#EAC886]/35 bg-[#EAC886]/10 text-[#EAC886] text-sm font-black uppercase tracking-wide">
                Envoyer un devis
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes recordPulse {
          0%, 100% { opacity: 0.45; transform: scaleX(0.2); }
          50% { opacity: 1; transform: scaleX(1); }
        }
        @keyframes bellPop {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(52,211,153,0.35); }
          50% { transform: scale(1.06); box-shadow: 0 0 0 10px rgba(52,211,153,0); }
        }
        .bell-pop {
          animation: bellPop 1.8s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
