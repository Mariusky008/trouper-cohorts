"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Role = "membre" | "admin";
type MemberTab = "clients" | "signal" | "cash";
type Sphere = "toutes" | "habitat" | "sante" | "auto";

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
type SignedDeal = ClientLead & { signedAmount: number; dueCommission: number };

type GivenDealCommission = {
  id: string;
  client: string;
  signedAmount: number;
  commission: number;
  signedBy: string;
  signedByMetier: string;
  paiementStatut: "paye" | "en_attente_tiers" | "en_attente_jp";
  paidAt?: string;
};

type AdminVocal = {
  id: string;
  from: string;
  metier: string;
  sphere: Exclude<Sphere, "toutes">;
  urgent?: boolean;
  duration: string;
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
    paiementStatut: "en_attente_jp",
  },
];

const adminVocals: AdminVocal[] = [
  { id: "VOC-991", from: "Thomas", metier: "Carreleur", sphere: "habitat", urgent: true, duration: "0:34" },
  { id: "VOC-992", from: "Claire", metier: "Agent Immo", sphere: "habitat", duration: "0:27" },
  { id: "VOC-993", from: "David", metier: "Plombier", sphere: "habitat", duration: "0:42" },
  { id: "VOC-994", from: "Nora", metier: "Infirmière", sphere: "sante", duration: "0:31" },
  { id: "VOC-995", from: "Lucas", metier: "Garagiste", sphere: "auto", duration: "0:29" },
];

const dispatchMetiers = [
  "Agent Immo", "Courtier", "Notaire", "Architecte", "Maître d'Oeuvre", "Cuisiniste", "Plombier", "Électricien",
  "Menuisier", "Carreleur", "Façadier", "Peintre", "Terrassier", "Pisciniste", "Paysagiste", "Couvreur",
  "Déménageur", "Conciergerie", "Diagnostiqueur", "Syndic", "Avocat", "CGP", "Expert-Comptable", "Banquier",
  "Garagiste", "Carrossier", "Contrôle Technique", "Infirmière", "Kiné", "Opticien",
];

const directoryMembers = dispatchMetiers.map((metier, idx) => ({
  id: `M-${idx + 1}`,
  name: `Membre ${String(idx + 1).padStart(2, "0")}`,
  metier,
  phone: `06 ${String(10 + (idx % 80)).padStart(2, "0")} ${String(20 + ((idx * 3) % 70)).padStart(2, "0")} ${String(30 + ((idx * 5) % 60)).padStart(2, "0")} ${String(40 + ((idx * 7) % 50)).padStart(2, "0")}`,
}));

const vocalLeadMap: Record<string, string> = {
  "VOC-991": "L-204",
  "VOC-993": "L-213",
};

const memberHealth = [
  { name: "Thomas", metier: "Carreleur", status: "ok", overdueDays: 0 },
  { name: "Claire", metier: "Agent Immo", status: "ok", overdueDays: 0 },
  { name: "David", metier: "Plombier", status: "alert", overdueDays: 19 },
  { name: "Nora", metier: "Infirmière", status: "ok", overdueDays: 0 },
];

const adminMetricsBySphere: Record<Sphere, { leadsQualifies: number; commissionsValidees: number; caTotalReseau: number }> = {
  toutes: { leadsQualifies: 7, commissionsValidees: 3280, caTotalReseau: 450000 },
  habitat: { leadsQualifies: 5, commissionsValidees: 2510, caTotalReseau: 312000 },
  sante: { leadsQualifies: 1, commissionsValidees: 470, caTotalReseau: 74000 },
  auto: { leadsQualifies: 1, commissionsValidees: 300, caTotalReseau: 64000 },
};

export default function RadarElitePreviewPage() {
  const searchParams = useSearchParams();
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
  const [selectedSignedDealHistory, setSelectedSignedDealHistory] = useState<SignedDeal | null>(null);
  const [adminSphere, setAdminSphere] = useState<Sphere>("toutes");
  const [selectedVocalId, setSelectedVocalId] = useState<string>(adminVocals[0].id);
  const [playingVocalId, setPlayingVocalId] = useState<string | null>(null);
  const [listenedVocalIds, setListenedVocalIds] = useState<string[]>([]);
  const [dispatchSelectionByVocal, setDispatchSelectionByVocal] = useState<Record<string, string[]>>({});
  const [showSignalAckModal, setShowSignalAckModal] = useState(false);
  const [flashAdminVocalId, setFlashAdminVocalId] = useState<string | null>(null);
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileNom, setProfileNom] = useState("Dupont");
  const [profilePrenom, setProfilePrenom] = useState("Thomas");
  const [profileMetier, setProfileMetier] = useState("Carreleur");
  const [profileVille, setProfileVille] = useState("Dax");
  const [profilePhone, setProfilePhone] = useState("06 77 88 99 00");
  const [memberLeadOpenedById, setMemberLeadOpenedById] = useState<Record<string, boolean>>({
    "L-204": false,
    "L-213": false,
  });

  const signedDeals = useMemo<SignedDeal[]>(
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
        .filter((item) => item.paiementStatut !== "paye")
        .reduce((sum, item) => sum + item.commission, 0),
    []
  );
  const cashDisponiblePopey = useMemo(() => totalCommissionsAlreadyPaidToMe, [totalCommissionsAlreadyPaidToMe]);
  const myBusinessContribution = useMemo(
    () => givenDealsCommissions.reduce((sum, item) => sum + item.signedAmount, 0),
    []
  );
  const isCashZeroState =
    totalSignedClientsRevenue === 0 &&
    totalCommissionsDueToMe === 0 &&
    totalCommissionsToPay === 0 &&
    cashDisponiblePopey === 0;
  const visibleAdminVocals = useMemo(
    () => adminVocals.filter((v) => adminSphere === "toutes" || v.sphere === adminSphere),
    [adminSphere]
  );
  const selectedVocal = useMemo(
    () => visibleAdminVocals.find((v) => v.id === selectedVocalId) ?? visibleAdminVocals[0] ?? null,
    [visibleAdminVocals, selectedVocalId]
  );
  const healthByMember = useMemo(
    () =>
      Object.fromEntries(memberHealth.map((m) => [m.name, m])) as Record<string, (typeof memberHealth)[number]>,
    []
  );
  const adminMetrics = adminMetricsBySphere[adminSphere];

  useEffect(() => {
    if (!isRecording) return;
    const timer = window.setTimeout(() => {
      setIsRecording(false);
      setShowSignalAckModal(true);
      setFlashAdminVocalId("VOC-991");
      window.setTimeout(() => setFlashAdminVocalId(null), 6000);
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [isRecording]);

  const triggerRecording = () => {
    setMemberTab("signal");
    setIsRecording(true);
  };

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "clients" || tab === "signal" || tab === "cash") {
      setMemberTab(tab);
    }
  }, [searchParams]);

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
  const openLeadDetails = (lead: ClientLead) => {
    setSelectedLead(lead);
    setMemberLeadOpenedById((prev) => ({ ...prev, [lead.id]: true }));
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

  const toggleDispatchMetier = (vocalId: string, metier: string) => {
    setDispatchSelectionByVocal((prev) => {
      const current = prev[vocalId] ?? [];
      const next = current.includes(metier)
        ? current.filter((item) => item !== metier)
        : [...current, metier];
      return { ...prev, [vocalId]: next };
    });
  };

  const selectedDispatchTargets = selectedVocal ? dispatchSelectionByVocal[selectedVocal.id] ?? [] : [];

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

        <div className="mt-5">
          <div className="relative bg-transparent p-0">
            {role === "admin" && (
              <>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/60">
                  Vue admin
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <h2 className="text-[34px] leading-[1.05] md:text-2xl font-black">Mon cockpit admin</h2>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { key: "toutes", label: "Toutes" },
                    { key: "habitat", label: "Habitat" },
                    { key: "sante", label: "Santé" },
                    { key: "auto", label: "Auto" },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setAdminSphere(s.key as Sphere)}
                      className={`h-9 rounded-full px-3 text-xs font-black uppercase tracking-wide ${
                        adminSphere === s.key ? "bg-white text-black" : "border border-white/20 text-white/75"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                    <p className="text-[10px] uppercase font-black tracking-[0.12em] text-white/65">Vocaux reçus</p>
                    <p className="mt-1 text-xl font-black">{visibleAdminVocals.length}</p>
                  </div>
                  <div className="rounded-xl border border-[#EAC886]/25 bg-[#2A2111] p-3">
                    <p className="text-[10px] uppercase font-black tracking-[0.12em] text-[#EAC886]/80">Leads qualifiés</p>
                    <p className="mt-1 text-xl font-black text-[#EAC886]">{adminMetrics.leadsQualifies}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-400/25 bg-[#10251D] p-3">
                    <p className="text-[10px] uppercase font-black tracking-[0.12em] text-emerald-300/80">Commissions validées</p>
                    <p className="mt-1 text-xl font-black text-emerald-300">{adminMetrics.commissionsValidees.toLocaleString("fr-FR")}€</p>
                  </div>
                  <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 p-3">
                    <p className="text-[10px] uppercase font-black tracking-[0.12em] text-cyan-200/85">CA Total Réseau</p>
                    <p className="mt-1 text-xl font-black text-cyan-200">{adminMetrics.caTotalReseau.toLocaleString("fr-FR")}€</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Timeline de distribution</p>
                  <p className="mt-1 text-lg font-black">Vocaux reçus</p>
                  <div className="mt-3 space-y-2">
                    {visibleAdminVocals.map((vocal) => (
                      <div
                        key={vocal.id}
                        onClick={() => setSelectedVocalId(vocal.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left ${
                          flashAdminVocalId === vocal.id
                            ? "border-emerald-300/55 bg-emerald-500/20 animate-[newLeadPulse_1.1s_ease-in-out_infinite]"
                            :
                          vocal.urgent
                            ? "border-red-300/45 bg-red-500/15 animate-[urgPulse_1.4s_ease-in-out_infinite]"
                            : selectedVocal?.id === vocal.id
                            ? "border-emerald-300/45 bg-emerald-500/10"
                            : "border-white/15 bg-black/25"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-black flex items-center gap-2">
                            <span
                              className={`inline-block h-2.5 w-2.5 rounded-full ${
                                healthByMember[vocal.from]?.status === "alert" ? "bg-red-400" : "bg-emerald-400"
                              }`}
                            />
                            {vocalLeadMap[vocal.id] && !memberLeadOpenedById[vocalLeadMap[vocal.id]] && (
                              <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-400" title="Non ouvert par le membre" />
                            )}
                            {vocal.id} · {vocal.from} ({vocal.metier})
                            {vocal.urgent ? " · URGENCE" : ""}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setListenedVocalIds((prev) => (prev.includes(vocal.id) ? prev : [...prev, vocal.id]));
                              setPlayingVocalId((prev) => (prev === vocal.id ? null : vocal.id));
                            }}
                            className={`h-8 rounded-md border px-2 text-[11px] font-black uppercase tracking-wide ${
                              playingVocalId === vocal.id
                                ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-200"
                                : listenedVocalIds.includes(vocal.id)
                                ? "border-white/10 bg-white/5 text-white/45"
                                : "border-white/20 text-white/90"
                            }`}
                          >
                            {playingVocalId === vocal.id ? `Pause ${vocal.duration}` : `Play ${vocal.duration}`}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedVocal && (
                  <div className="mt-3 rounded-2xl border border-white/15 bg-black/25 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-white/65">Dispatch chirurgical</p>
                    <p className="mt-1 text-sm font-black">
                      {selectedVocal.id} · Cochez les métiers à notifier
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3 max-h-48 overflow-y-auto pr-1">
                      {dispatchMetiers.map((metier) => {
                        const checked = selectedDispatchTargets.includes(metier);
                        return (
                          <label
                            key={metier}
                            className={`rounded-lg border px-2 py-2 text-xs font-bold ${
                              checked ? "border-emerald-300/45 bg-emerald-500/10" : "border-white/15 bg-black/20"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleDispatchMetier(selectedVocal.id, metier)}
                              className="mr-2 align-middle"
                            />
                            {metier}
                          </label>
                        );
                      })}
                    </div>
                    <button className="mt-3 h-10 w-full rounded-lg bg-emerald-400 text-black text-xs font-black uppercase tracking-wide">
                      Valider et notifier ({selectedDispatchTargets.length})
                    </button>
                  </div>
                )}

              </>
            )}

            {role === "membre" && (
              <>
                <div className="mt-1 flex justify-end gap-2">
                  <button
                    onClick={() => setShowDirectoryModal(true)}
                    className="h-10 rounded-lg border border-white/20 bg-white/5 px-3 text-[11px] font-black uppercase tracking-wide"
                  >
                    Annuaire
                  </button>
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="h-10 rounded-lg border border-white/20 bg-white/5 px-3 text-[11px] font-black uppercase tracking-wide"
                  >
                    Profil
                  </button>
                  <Link
                    href="/radar-elite-preview/notifications"
                    className="group relative h-[60px] w-[60px] rounded-full border border-emerald-300/35 bg-gradient-to-b from-[#1A3A31] to-[#0E241E] text-2xl transition hover:brightness-110 inline-flex items-center justify-center bell-shake shadow-[0_10px_30px_-15px_rgba(0,245,176,0.6)]"
                    aria-label="Aller aux notifications"
                  >
                    <span className="relative -mt-0.5 text-emerald-200">🔔</span>
                    <span className="absolute right-0 top-0 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-[#ff2d55] px-1 text-[10px] font-black text-white ring-2 ring-[#090B0B]">
                      2
                    </span>
                  </Link>
                </div>
                <div key={memberTab} className="mt-4 animate-[fadeIn_.25s_ease-out]">
                  {memberTab === "clients" && (
                    <div className="p-1">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]">Clients reçus</p>
                      <h3 className="mt-1 text-xl font-black">Touchez un client pour ouvrir sa fiche complète</h3>
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
                              onClick={() => openLeadDetails(lead)}
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
                                  className="h-11 w-full rounded-xl bg-emerald-400 text-black text-xs font-black uppercase tracking-wide shadow-[0_10px_25px_-15px_rgba(52,211,153,0.85)]"
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
                    <div className="p-1">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300">Signal vocal</p>
                      <h3 className="mt-1 text-2xl font-black">Mode Talkie-Walkie</h3>
                      <p className="mt-2 text-sm text-white/85 leading-relaxed">
                        Maintenez pour transmettre votre opportunité. Donnez moi tous les details, je me charge de contacter votre client pour qualifier ses besoins et alerter les métiers concernés. Vos commissions s&apos;afficheront dès la signature des contrats par les membres du Cercle.
                      </p>
                      <div className="relative mt-6 h-64 flex justify-center items-center">
                        <span className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/30 animate-[talkieRing_1.6s_ease-out_infinite]" />
                        <span
                          className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/20 animate-[talkieRing_2.1s_ease-out_infinite]"
                          style={{ animationDelay: "250ms" }}
                        />
                        <span
                          className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/15 animate-[talkieRing_2.6s_ease-out_infinite]"
                          style={{ animationDelay: "450ms" }}
                        />
                        <button
                          onClick={triggerRecording}
                          className={`talkie-btn relative h-48 w-48 rounded-full border-2 border-emerald-300/45 ${
                            isRecording
                              ? "bg-red-500 text-white"
                              : "bg-gradient-to-b from-emerald-400 to-emerald-500 text-black"
                          } text-base font-black uppercase tracking-wide`}
                        >
                          <span className="absolute inset-0 rounded-full animate-[talkieGlow_1.6s_ease-in-out_infinite]" />
                          <span className="relative z-10">{isRecording ? "Transmission..." : "Maintenir pour parler"}</span>
                        </button>
                      </div>
                      <div className="mt-6 h-3 rounded-full bg-black/30 overflow-hidden">
                        <div
                          className={`h-full bg-red-400 transition-all duration-300 ${
                            isRecording ? "w-full animate-[recordPulse_1.2s_ease-in-out_infinite]" : "w-0"
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {memberTab === "cash" && (
                    <div className="p-1">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300">Cash</p>
                      <h3 className="mt-1 text-xl font-black">Suivi financier en temps réel</h3>
                      <p className="mt-2 text-sm text-white/80">Montants signés, commissions reçues et commissions à payer.</p>

                      <div className="mt-4 space-y-2">
                        <div className="rounded-xl border border-fuchsia-300/30 bg-fuchsia-500/10 p-3">
                          <p className="text-xs text-fuchsia-200/90 uppercase font-black">Ma contribution au groupe</p>
                          <p className="text-2xl font-black text-fuchsia-200">{myBusinessContribution.toLocaleString("fr-FR")}€</p>
                          <p className="text-[11px] text-fuchsia-200/75">Business généré pour mes collègues ce mois-ci</p>
                        </div>
                        <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 p-3">
                          <p className="text-xs text-cyan-200/90 uppercase font-black">Mon cash disponible Popey</p>
                          <p className="text-2xl font-black text-cyan-200">
                            {cashDisponiblePopey.toLocaleString("fr-FR")}€
                          </p>
                          <button className="mt-2 h-10 w-full rounded-lg bg-cyan-300 text-black text-xs font-black uppercase tracking-wide">
                            Demander un virement Popey
                          </button>
                        </div>
                        {isCashZeroState && (
                          <div className="rounded-xl border border-dashed border-emerald-300/35 bg-emerald-500/10 px-3 py-3">
                            <p className="text-sm font-black text-emerald-200">Le compteur est à zéro.</p>
                            <p className="text-xs text-emerald-200/80">A vous de faire tomber la première pluie sur Dax !</p>
                          </div>
                        )}

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
                          <p className="text-xs text-emerald-300/80 uppercase font-black">2. Commissions dues (Inbound)</p>
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] p-4 flex items-center justify-center" onClick={() => setSelectedLead(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-white/25 ring-1 ring-white/10 bg-[#1B2227] shadow-[0_25px_80px_-30px_rgba(0,0,0,0.9)] p-5" onClick={(e) => e.stopPropagation()}>
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
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] p-4 flex items-center justify-center" onClick={() => setShowSignedModalFor(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-white/25 ring-1 ring-white/10 bg-[#1B2227] shadow-[0_25px_80px_-30px_rgba(0,0,0,0.9)] p-5" onClick={(e) => e.stopPropagation()}>
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
        <div className="fixed inset-0 z-[65] bg-black/40 backdrop-blur-[2px] p-4 flex items-center justify-center" onClick={() => setShowSignedClientsModal(false)}>
          <div className="w-full max-w-xl rounded-2xl border border-white/25 ring-1 ring-white/10 bg-[#1B2227] shadow-[0_25px_80px_-30px_rgba(0,0,0,0.9)] p-5" onClick={(e) => e.stopPropagation()}>
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
                <button
                  type="button"
                  key={deal.id}
                  onClick={() => setSelectedSignedDealHistory(deal)}
                  className="w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-left"
                >
                  <p className="text-sm font-black">{deal.client}</p>
                  <p className="text-xs text-white/70">
                    Montant signé: {deal.signedAmount.toLocaleString("fr-FR")}€ • Apporté par {deal.sourcePrenom} ({deal.sourceMetier})
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {showCommissionsDueToMeModal && (
        <div className="fixed inset-0 z-[68] bg-black/40 backdrop-blur-[2px] p-4 flex items-center justify-center" onClick={() => setShowCommissionsDueToMeModal(false)}>
          <div className="w-full max-w-xl rounded-2xl border border-white/25 ring-1 ring-white/10 bg-[#1B2227] shadow-[0_25px_80px_-30px_rgba(0,0,0,0.9)] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase font-black tracking-[0.12em] text-emerald-300/80">Commissions dues (Inbound)</p>
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
                    {item.paiementStatut === "paye"
                      ? `Payé${item.paidAt ? ` le ${item.paidAt}` : ""}`
                      : item.paiementStatut === "en_attente_jp"
                      ? "En attente JP"
                      : "Pas encore payé"}
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
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px] p-4 flex items-center justify-center" onClick={() => setShowPayCommissionsModal(false)}>
          <div className="w-full max-w-xl rounded-2xl border border-white/25 ring-1 ring-white/10 bg-[#1B2227] shadow-[0_25px_80px_-30px_rgba(0,0,0,0.9)] p-5" onClick={(e) => e.stopPropagation()}>
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

            {signedDeals.length > 1 && (
              <div className="mt-4 rounded-xl border border-[#EAC886]/25 bg-[#EAC886]/10 px-3 py-2">
                <p className="text-xs uppercase font-black tracking-[0.1em] text-[#EAC886]">Total à payer maintenant</p>
                <p className="text-2xl font-black text-[#EAC886]">{totalCommissionsToPay.toLocaleString("fr-FR")}€</p>
              </div>
            )}

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
      {selectedSignedDealHistory && (
        <div className="fixed inset-0 z-[72] bg-black/40 backdrop-blur-[2px] p-4 flex items-center justify-center" onClick={() => setSelectedSignedDealHistory(null)}>
          <div className="w-full max-w-xl rounded-2xl border border-white/25 ring-1 ring-white/10 bg-[#1B2227] shadow-[0_25px_80px_-30px_rgba(0,0,0,0.9)] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase font-black tracking-[0.12em] text-[#EAC886]/80">Historique de communication</p>
                <h3 className="mt-1 text-2xl font-black">{selectedSignedDealHistory.client}</h3>
              </div>
              <button onClick={() => setSelectedSignedDealHistory(null)} className="text-xs font-black uppercase tracking-wide text-white/70">
                Fermer
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2"><span className="font-black">Vocal source:</span> “Client chaud, budget validé, décision sous 7 jours.”</p>
              <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2"><span className="font-black">Qualification:</span> besoin cadré, zone confirmée, décisionnaire identifié.</p>
              <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2"><span className="font-black">Apporteur:</span> {selectedSignedDealHistory.sourcePrenom} ({selectedSignedDealHistory.sourceMetier})</p>
              <p className="rounded-lg border border-[#EAC886]/25 bg-[#EAC886]/10 px-3 py-2"><span className="font-black">Montant signé:</span> {selectedSignedDealHistory.signedAmount.toLocaleString("fr-FR")}€</p>
            </div>
          </div>
        </div>
      )}
      {showSignalAckModal && (
        <div className="fixed inset-0 z-[75] bg-black/40 backdrop-blur-[2px] p-4 flex items-center justify-center" onClick={() => setShowSignalAckModal(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-white/25 ring-1 ring-white/10 bg-[#1B2227] shadow-[0_25px_80px_-30px_rgba(0,0,0,0.9)] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center min-h-[56px]">
              <p className="text-5xl text-emerald-300 animate-[fadeIn_.2s_ease-out]">✅</p>
            </div>
            <div className="animate-[fadeIn_.2s_ease-out]">
              <h3 className="text-2xl font-black">Bien reçu ! 🎙️</h3>
              <p className="mt-2 text-sm text-white/85 leading-relaxed">
                Merci pour ce signal. Je traite l&apos;information immédiatement : je qualifie le besoin du client et j&apos;active les membres du Cercle concernés.
                On continue de faire pleuvoir le business sur Dax !
              </p>
              <button
                onClick={() => setShowSignalAckModal(false)}
                className="mt-4 h-11 w-full rounded-xl bg-emerald-400 text-black text-sm font-black uppercase tracking-wide"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {showDirectoryModal && (
        <div className="fixed inset-0 z-[76] bg-black/40 backdrop-blur-[2px] p-4 flex items-center justify-center" onClick={() => setShowDirectoryModal(false)}>
          <div className="w-full max-w-xl rounded-2xl border border-white/25 ring-1 ring-white/10 bg-[#1B2227] shadow-[0_25px_80px_-30px_rgba(0,0,0,0.9)] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase font-black tracking-[0.12em] text-white/65">L&apos;Annuaire du Cercle</p>
                <h3 className="mt-1 text-2xl font-black">Membres et métiers</h3>
              </div>
              <button onClick={() => setShowDirectoryModal(false)} className="text-xs font-black uppercase tracking-wide text-white/70">Retour</button>
            </div>
            <div className="mt-4 max-h-[52vh] overflow-y-auto pr-1 space-y-2">
              {directoryMembers.map((member) => (
                <div key={member.id} className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">{member.name}</p>
                    <p className="text-xs text-white/70">{member.metier}</p>
                  </div>
                  <a href={`tel:${member.phone.replaceAll(" ", "")}`} className="h-9 rounded-lg bg-emerald-400 px-3 inline-flex items-center text-[11px] font-black uppercase tracking-wide text-black">
                    Appeler
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {showProfileModal && (
        <div className="fixed inset-0 z-[77] bg-black/40 backdrop-blur-[2px] p-4 flex items-center justify-center" onClick={() => setShowProfileModal(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-white/25 ring-1 ring-white/10 bg-[#1B2227] shadow-[0_25px_80px_-30px_rgba(0,0,0,0.9)] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase font-black tracking-[0.12em] text-white/65">Profil & Réglages</p>
                <h3 className="mt-1 text-2xl font-black">Mes informations</h3>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="text-xs font-black uppercase tracking-wide text-white/70">Retour</button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-black uppercase tracking-[0.1em] text-white/60">Nom</label>
                <input value={profileNom} onChange={(e) => setProfileNom(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-white/20 bg-black/25 px-3 text-sm" />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-[0.1em] text-white/60">Prénom</label>
                <input value={profilePrenom} onChange={(e) => setProfilePrenom(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-white/20 bg-black/25 px-3 text-sm" />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-[0.1em] text-white/60">Métier</label>
                <input value={profileMetier} onChange={(e) => setProfileMetier(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-white/20 bg-black/25 px-3 text-sm" />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-[0.1em] text-white/60">Ville</label>
                <input value={profileVille} onChange={(e) => setProfileVille(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-white/20 bg-black/25 px-3 text-sm" />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-[0.1em] text-white/60">Téléphone</label>
                <input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-white/20 bg-black/25 px-3 text-sm" />
              </div>
              <a href="tel:+33600000000" className="h-11 w-full rounded-xl border border-cyan-300/35 bg-cyan-500/10 inline-flex items-center justify-center text-sm font-black uppercase tracking-wide text-cyan-200">
                Besoin d&apos;aide ? Appelez Jean-Philippe
              </a>
              <button onClick={() => setShowProfileModal(false)} className="h-11 w-full rounded-xl bg-emerald-400 text-black text-sm font-black uppercase tracking-wide">
                Enregistrer
              </button>
              <button className="h-11 w-full rounded-xl border border-red-300/35 bg-red-500/10 text-red-200 text-sm font-black uppercase tracking-wide">
                Déconnexion
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
        @keyframes bellShake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-12deg); }
          40% { transform: rotate(10deg); }
          60% { transform: rotate(-8deg); }
          80% { transform: rotate(6deg); }
        }
        @keyframes talkieGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,245,176,0.42); }
          50% { box-shadow: 0 0 0 24px rgba(0,245,176,0); }
        }
        @keyframes talkieRing {
          0% { opacity: 0.95; transform: translate(-50%, -50%) scale(0.88); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.22); }
        }
        @keyframes talkieBreath {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes urgPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(248,113,113,0.25); }
          50% { box-shadow: 0 0 0 10px rgba(248,113,113,0); }
        }
        @keyframes newLeadPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.3); }
          50% { box-shadow: 0 0 0 12px rgba(52,211,153,0); }
        }
        .bell-shake {
          animation: bellShake 1.6s ease-in-out infinite;
          transform-origin: 50% 20%;
        }
        .talkie-btn {
          box-shadow: 0 18px 40px -18px rgba(0,245,176,0.9);
          animation: talkieBreath 1.15s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
