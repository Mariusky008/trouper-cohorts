"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Role = "membre" | "admin";
type MemberTab = "clients" | "signal" | "cash";

type ClientLead = {
  id: string;
  client: string;
  budget: string;
  besoin: string;
  telephone: string;
  adresse: string;
  statut: "Radar" | "En cours" | "Victoire" | "À contacter";
  sourcePrenom: string;
  sourceMetier: string;
  notes: string;
};

type DealProgress = "nouveau" | "pris" | "signe" | "perdu";

type GivenDealCommission = {
  id: string;
  client: string;
  signedAmount: number;
  commission: number;
  signedBy: string;
  signedByMetier: string;
  paiementStatut: "paye" | "en_attente";
  paidAt?: string;
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
    sourcePrenom: "Claire",
    sourceMetier: "Agent Immo",
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
    sourcePrenom: "David",
    sourceMetier: "Plombier",
    notes: "Attente du devis final. Bonne probabilité de signature.",
  },
];

const givenDealsCommissions: GivenDealCommission[] = [
  {
    id: "G-101",
    client: "Villa Marin",
    signedAmount: 18000,
    commission: 1800,
    signedBy: "Thomas",
    signedByMetier: "Carreleur",
    paiementStatut: "paye",
    paidAt: "2026-04-07",
  },
  {
    id: "G-102",
    client: "Famille Pierre",
    signedAmount: 9500,
    commission: 950,
    signedBy: "Claire",
    signedByMetier: "Cuisiniste",
    paiementStatut: "en_attente",
  },
];

export default function RadarElitePreviewPage() {
  const [role, setRole] = useState<Role>("membre");
  const [memberTab, setMemberTab] = useState<MemberTab>("signal");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLead, setSelectedLead] = useState<ClientLead | null>(null);
  const [dealProgressById, setDealProgressById] = useState<Record<string, DealProgress>>({
    "L-204": "nouveau",
    "L-213": "signe",
  });
  const [signedAmountById, setSignedAmountById] = useState<Record<string, number>>({
    "L-213": 48000,
  });
  const [showSignedModalFor, setShowSignedModalFor] = useState<ClientLead | null>(null);
  const [signedAmountInput, setSignedAmountInput] = useState("");
  const [showPayCommissionsModal, setShowPayCommissionsModal] = useState(false);
  const [showSignedClientsModal, setShowSignedClientsModal] = useState(false);
  const [showCommissionsDueToMeModal, setShowCommissionsDueToMeModal] = useState(false);

  const signedDeals = useMemo(
    () =>
      memberLeads
        .filter((lead) => dealProgressById[lead.id] === "signe" && (signedAmountById[lead.id] ?? 0) > 0)
        .map((lead) => ({
          ...lead,
          signedAmount: signedAmountById[lead.id] ?? 0,
          dueCommission: Math.round((signedAmountById[lead.id] ?? 0) * 0.1),
        })),
    [dealProgressById, signedAmountById]
  );

  const totalSignedClientsRevenue = useMemo(
    () => signedDeals.reduce((sum, item) => sum + item.signedAmount, 0),
    [signedDeals]
  );

  const totalCommissionsToPay = useMemo(
    () => signedDeals.reduce((sum, item) => sum + item.dueCommission, 0),
    [signedDeals]
  );

  const totalCommissionsDueToMe = useMemo(
    () => givenDealsCommissions.reduce((sum, item) => sum + item.commission, 0),
    []
  );
  const totalCommissionsAlreadyPaidToMe = useMemo(
    () =>
      givenDealsCommissions
        .filter((item) => item.paiementStatut === "paye")
        .reduce((sum, item) => sum + item.commission, 0),
    []
  );
  const totalCommissionsPendingToMe = useMemo(
    () =>
      givenDealsCommissions
        .filter((item) => item.paiementStatut === "en_attente")
        .reduce((sum, item) => sum + item.commission, 0),
    []
  );

  useEffect(() => {
    if (!isRecording) return;
    const timer = window.setTimeout(() => setIsRecording(false), 2600);
    return () => window.clearTimeout(timer);
  }, [isRecording]);

  const triggerRecording = () => {
    setMemberTab("signal");
    setIsRecording(true);
  };

  const takeDeal = (leadId: string) => {
    setDealProgressById((prev) => ({ ...prev, [leadId]: "pris" }));
  };

  const markDealLost = (leadId: string) => {
    setDealProgressById((prev) => ({ ...prev, [leadId]: "perdu" }));
  };

  const openSignedModal = (lead: ClientLead) => {
    setShowSignedModalFor(lead);
    setSignedAmountInput("");
  };

  const confirmSignedDeal = () => {
    if (!showSignedModalFor) return;
    const amount = Number(signedAmountInput);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setSignedAmountById((prev) => ({ ...prev, [showSignedModalFor.id]: amount }));
    setDealProgressById((prev) => ({ ...prev, [showSignedModalFor.id]: "signe" }));
    setShowSignedModalFor(null);
    setSignedAmountInput("");
  };

  return (
    <main className="min-h-screen bg-[#0A0B0C] text-white pb-28 md:pb-8">
      <div className="mx-auto max-w-4xl px-4 md:px-6 py-5 md:py-8">
        <div className="text-center md:text-left">
          <h1 className="mt-1 text-4xl md:text-5xl font-black leading-tight">
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

        <div className="mt-5 md:mt-8 md:rounded-[30px] md:border md:border-white/10 md:bg-gradient-to-b md:from-[#111414] md:to-[#0A0C0C] md:p-4 md:shadow-[0_24px_55px_-30px_rgba(0,0,0,0.9)]">
          <div className="relative bg-transparent md:rounded-[24px] md:border md:border-white/10 md:bg-[#090B0B] p-0 md:p-5">
            {role === "admin" && (
              <>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/60">
                Vue admin
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <h2 className="text-[34px] leading-[1.05] md:text-2xl font-black">Mon cockpit admin</h2>
              </div>
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
              </>
            )}

            {role === "membre" && (
              <>
                <div className="mt-1 flex justify-end">
                  <Link
                    href="/radar-elite-preview/notifications"
                    className="group relative h-12 w-12 rounded-xl border border-white/20 bg-white/5 text-xl transition hover:bg-white/10 inline-flex items-center justify-center bell-pop"
                    aria-label="Aller aux notifications"
                  >
                    🔔
                    <span className="absolute -right-1 -top-1 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-emerald-400 px-1 text-[10px] font-black text-black ring-2 ring-[#090B0B]">
                      2
                    </span>
                  </Link>
                </div>
                <div key={memberTab} className="mt-4 animate-[fadeIn_.25s_ease-out]">
                  {memberTab === "clients" && (
                    <div className="rounded-2xl border border-[#EAC886]/25 bg-[#EAC886]/10 p-5">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]">Clients reçus</p>
                      <h3 className="mt-1 text-xl font-black">Touchez un client pour ouvrir sa fiche complète</h3>
                      <p className="mt-2 text-sm text-white/80">Vous voyez besoin, budget, contact et prochaine action.</p>
                      <div className="mt-4 space-y-2">
                        {memberLeads.map((lead) => (
                          <div
                            key={lead.id}
                            className={`rounded-xl border p-3 ${
                              dealProgressById[lead.id] === "pris"
                                ? "border-emerald-400/45 bg-emerald-500/15"
                                : dealProgressById[lead.id] === "signe"
                                ? "border-[#EAC886]/45 bg-[#EAC886]/15"
                                : dealProgressById[lead.id] === "perdu"
                                ? "border-red-400/40 bg-red-500/10"
                                : "border-white/15 bg-black/25"
                            }`}
                          >
                            <button
                              onClick={() => setSelectedLead(lead)}
                              className="w-full text-left"
                            >
                              <p className="font-black">{lead.client} • {lead.budget}</p>
                              <p className="text-xs text-white/70">{lead.besoin} • {lead.statut}</p>
                              <p className="mt-1 text-[11px] font-bold text-white/75">
                                Contact apporté par {lead.sourcePrenom} ({lead.sourceMetier})
                              </p>
                            </button>

                            <div className="mt-3">
                              {dealProgressById[lead.id] === "nouveau" && (
                                <button
                                  onClick={() => takeDeal(lead.id)}
                                  className="h-10 w-full rounded-lg bg-emerald-400 text-black text-xs font-black uppercase tracking-wide"
                                >
                                  Je prends le deal et je contacte le client
                                </button>
                              )}

                              {dealProgressById[lead.id] === "pris" && (
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => openSignedModal(lead)}
                                    className="h-10 rounded-lg bg-[#EAC886] text-black text-xs font-black uppercase tracking-wide"
                                  >
                                    J&apos;ai signé le client
                                  </button>
                                  <button
                                    onClick={() => markDealLost(lead.id)}
                                    className="h-10 rounded-lg border border-red-300/35 bg-red-500/10 text-red-200 text-xs font-black uppercase tracking-wide"
                                  >
                                    Je n&apos;ai pas signé
                                  </button>
                                </div>
                              )}

                              {dealProgressById[lead.id] === "signe" && (
                                <div className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-3 py-2">
                                  <p className="text-xs font-black uppercase tracking-[0.1em] text-emerald-200">Signé et transmis</p>
                                  <p className="text-xs text-emerald-100/90">
                                    Dossier envoyé à Jean-Philippe + à {lead.sourcePrenom}.
                                  </p>
                                </div>
                              )}

                              {dealProgressById[lead.id] === "perdu" && (
                                <div className="rounded-lg border border-red-300/35 bg-red-500/10 px-3 py-2">
                                  <p className="text-xs font-black uppercase tracking-[0.1em] text-red-200">Non signé</p>
                                  <p className="text-xs text-red-100/90">Vous pouvez relancer plus tard ou archiver ce lead.</p>
                                </div>
                              )}
                            </div>
                          </div>
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
                        className={`mt-4 h-16 w-full rounded-xl text-sm font-black uppercase tracking-wide transition ${
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
                      <h3 className="mt-1 text-xl font-black">Suivi financier en temps réel</h3>
                      <p className="mt-2 text-sm text-white/80">Montants signés, commissions reçues et commissions à payer.</p>

                      <div className="mt-4 space-y-2">
                        <button
                          type="button"
                          onClick={() => setShowSignedClientsModal(true)}
                          className="w-full rounded-xl border border-[#EAC886]/30 bg-[#2A2111] p-3 text-left"
                        >
                          <p className="text-xs text-[#EAC886]/80 uppercase font-black">1. Clients signés (depuis l&apos;onglet clients)</p>
                          <p className="text-2xl font-black text-[#EAC886]">
                            {totalSignedClientsRevenue.toLocaleString("fr-FR")}€
                          </p>
                          <p className="text-[11px] text-[#EAC886]/70">{signedDeals.length} dossier(s) signé(s)</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowCommissionsDueToMeModal(true)}
                          className="w-full rounded-xl border border-emerald-400/30 bg-[#10251D] p-3 text-left"
                        >
                          <p className="text-xs text-emerald-300/80 uppercase font-black">2. Commissions qu&apos;on me doit</p>
                          <p className="text-2xl font-black text-emerald-300">
                            {totalCommissionsDueToMe.toLocaleString("fr-FR")}€
                          </p>
                          <p className="text-[11px] text-emerald-300/70">
                            Payé: {totalCommissionsAlreadyPaidToMe.toLocaleString("fr-FR")}€ • En attente: {totalCommissionsPendingToMe.toLocaleString("fr-FR")}€
                          </p>
                        </button>

                        <div className="rounded-xl border border-white/20 bg-black/25 p-3">
                          <p className="text-xs text-white/75 uppercase font-black">3. Commissions que je dois</p>
                          <p className="text-2xl font-black text-white">
                            {totalCommissionsToPay.toLocaleString("fr-FR")}€
                          </p>
                          <button
                            onClick={() => setShowPayCommissionsModal(true)}
                            disabled={totalCommissionsToPay <= 0}
                            className="mt-2 h-10 w-full rounded-lg bg-white text-black text-xs font-black uppercase tracking-wide disabled:opacity-40"
                          >
                            Payer mes commissions
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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
      {role === "membre" && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0B0D0E]/95 backdrop-blur px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
          <div className="mx-auto max-w-4xl grid grid-cols-3 gap-2 items-end">
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
        </nav>
      )}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/70 p-0 md:p-4 flex items-end md:items-center justify-center" onClick={() => setSelectedLead(null)}>
          <div className="w-full max-w-lg rounded-t-2xl md:rounded-2xl border border-white/15 bg-[#0E1011] p-5" onClick={(e) => e.stopPropagation()}>
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
              <p className="rounded-lg border border-[#EAC886]/25 bg-[#EAC886]/10 px-3 py-2"><span className="font-black">Apporteur:</span> {selectedLead.sourcePrenom} ({selectedLead.sourceMetier})</p>
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
      {showSignedModalFor && (
        <div className="fixed inset-0 z-[60] bg-black/75 p-0 md:p-4 flex items-end md:items-center justify-center" onClick={() => setShowSignedModalFor(null)}>
          <div className="w-full max-w-lg rounded-t-2xl md:rounded-2xl border border-white/15 bg-[#0F1112] p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs uppercase font-black tracking-[0.12em] text-[#EAC886]/80">Validation signature</p>
            <h3 className="mt-1 text-2xl font-black">{showSignedModalFor.client}</h3>
            <p className="mt-2 text-sm text-white/75">
              Saisissez le montant signé. La rétrocession apporteur est calculée automatiquement à 10%.
            </p>
            <div className="mt-4">
              <label className="text-xs font-black uppercase tracking-[0.1em] text-white/60">Montant signé (€)</label>
              <input
                type="number"
                min="0"
                value={signedAmountInput}
                onChange={(e) => setSignedAmountInput(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-white/20 bg-black/25 px-3 text-base font-bold"
                placeholder="Ex: 22000"
              />
            </div>
            <div className="mt-3 rounded-xl border border-[#EAC886]/25 bg-[#EAC886]/10 px-3 py-2">
              <p className="text-xs font-black uppercase tracking-[0.1em] text-[#EAC886]">Rétrocession apporteur (10%)</p>
              <p className="mt-1 text-xl font-black text-[#EAC886]">
                {Number.isFinite(Number(signedAmountInput)) && Number(signedAmountInput) > 0
                  ? `${Math.round(Number(signedAmountInput) * 0.1).toLocaleString("fr-FR")}€`
                  : "0€"}
              </p>
              <p className="text-xs text-[#EAC886]/85">
                Versé à {showSignedModalFor.sourcePrenom} ({showSignedModalFor.sourceMetier})
              </p>
            </div>
            <button
              onClick={confirmSignedDeal}
              disabled={!Number.isFinite(Number(signedAmountInput)) || Number(signedAmountInput) <= 0}
              className="mt-4 h-12 w-full rounded-xl bg-emerald-400 text-black text-sm font-black uppercase tracking-wide disabled:opacity-40"
            >
              Valider et envoyer à l&apos;admin + apporteur
            </button>
          </div>
        </div>
      )}
      {showSignedClientsModal && (
        <div className="fixed inset-0 z-[65] bg-black/75 p-0 md:p-4 flex items-end md:items-center justify-center" onClick={() => setShowSignedClientsModal(false)}>
          <div className="w-full max-w-xl rounded-t-2xl md:rounded-2xl border border-white/15 bg-[#0F1112] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase font-black tracking-[0.12em] text-[#EAC886]/80">Clients signés</p>
                <h3 className="mt-1 text-2xl font-black">Détail des signatures</h3>
              </div>
              <button onClick={() => setShowSignedClientsModal(false)} className="text-xs font-black uppercase tracking-wide text-white/70">
                Fermer
              </button>
            </div>
            <div className="mt-4 space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {signedDeals.length === 0 && (
                <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm text-white/75">
                  Aucun client signé pour l&apos;instant.
                </p>
              )}
              {signedDeals.map((deal) => (
                <div key={deal.id} className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
                  <p className="text-sm font-black">{deal.client}</p>
                  <p className="text-xs text-white/70">
                    Montant signé: {deal.signedAmount.toLocaleString("fr-FR")}€ • Apporté par {deal.sourcePrenom} ({deal.sourceMetier})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {showCommissionsDueToMeModal && (
        <div className="fixed inset-0 z-[68] bg-black/75 p-0 md:p-4 flex items-end md:items-center justify-center" onClick={() => setShowCommissionsDueToMeModal(false)}>
          <div className="w-full max-w-xl rounded-t-2xl md:rounded-2xl border border-white/15 bg-[#0F1112] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase font-black tracking-[0.12em] text-emerald-300/80">Commissions qu&apos;on me doit</p>
                <h3 className="mt-1 text-2xl font-black">Qui a payé / qui n&apos;a pas payé</h3>
              </div>
              <button onClick={() => setShowCommissionsDueToMeModal(false)} className="text-xs font-black uppercase tracking-wide text-white/70">
                Fermer
              </button>
            </div>
            <div className="mt-4 space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {givenDealsCommissions.map((item) => (
                <div key={item.id} className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
                  <p className="text-sm font-black">{item.client}</p>
                  <p className="text-xs text-white/70">
                    Signé par {item.signedBy} ({item.signedByMetier}) • Commission due: {item.commission.toLocaleString("fr-FR")}€
                  </p>
                  <p className={`text-xs font-black mt-1 ${item.paiementStatut === "paye" ? "text-emerald-300" : "text-amber-300"}`}>
                    {item.paiementStatut === "paye" ? `Payé${item.paidAt ? ` le ${item.paidAt}` : ""}` : "Pas encore payé"}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black">
              <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-emerald-200">
                Déjà payé: {totalCommissionsAlreadyPaidToMe.toLocaleString("fr-FR")}€
              </p>
              <p className="rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-amber-200">
                En attente: {totalCommissionsPendingToMe.toLocaleString("fr-FR")}€
              </p>
            </div>
          </div>
        </div>
      )}
      {showPayCommissionsModal && (
        <div className="fixed inset-0 z-[70] bg-black/75 p-0 md:p-4 flex items-end md:items-center justify-center" onClick={() => setShowPayCommissionsModal(false)}>
          <div className="w-full max-w-xl rounded-t-2xl md:rounded-2xl border border-white/15 bg-[#0F1112] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase font-black tracking-[0.12em] text-white/65">Paiement commissions</p>
                <h3 className="mt-1 text-2xl font-black">Détail des commissions à payer</h3>
              </div>
              <button onClick={() => setShowPayCommissionsModal(false)} className="text-xs font-black uppercase tracking-wide text-white/70">
                Fermer
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {signedDeals.length === 0 && (
                <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm text-white/75">
                  Aucune commission à payer pour l&apos;instant.
                </p>
              )}
              {signedDeals.map((deal) => (
                <div key={deal.id} className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
                  <p className="text-sm font-black">{deal.client}</p>
                  <p className="text-xs text-white/70">
                    Signé: {deal.signedAmount.toLocaleString("fr-FR")}€ • Apporteur: {deal.sourcePrenom} ({deal.sourceMetier})
                  </p>
                  <p className="text-xs font-black text-[#EAC886]">À payer: {deal.dueCommission.toLocaleString("fr-FR")}€</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-[#EAC886]/25 bg-[#EAC886]/10 px-3 py-2">
              <p className="text-xs uppercase font-black tracking-[0.1em] text-[#EAC886]">Total à payer maintenant</p>
              <p className="text-2xl font-black text-[#EAC886]">{totalCommissionsToPay.toLocaleString("fr-FR")}€</p>
            </div>

            <button
              onClick={() => setShowPayCommissionsModal(false)}
              disabled={totalCommissionsToPay <= 0}
              className="mt-4 h-12 w-full rounded-xl bg-emerald-400 text-black text-sm font-black uppercase tracking-wide disabled:opacity-40"
            >
              Confirmer le paiement
            </button>
            <p className="mt-2 text-[11px] text-white/60">
              Simulation prototype: validation envoyée à l&apos;admin + aux apporteurs concernés.
            </p>
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
