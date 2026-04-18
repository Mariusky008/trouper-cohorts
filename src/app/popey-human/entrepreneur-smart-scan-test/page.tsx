"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type DailyCategory = "passer" | "eclaireur" | "package" | "exclients" | "qualifier";

type DailyContact = {
  id: string;
  name: string;
  city: string;
  companyHint: string;
  capsule: string;
  communityKnownBy: number;
  dominantTags: string[];
  externalNews: string;
};
type QualifierData = {
  heat: HeatLevel;
  status: (typeof QUALIFIER_STATUS)[number];
  tags: string[];
  customTags: string[];
  note: string;
};
type HistoryEntry = {
  contactId: string;
  name: string;
  action: Exclude<DailyCategory, "qualifier">;
  at: string;
  tagsSummary: string;
};

const CONTACTS: DailyContact[] = [
  {
    id: "d1",
    name: "Nicolas B.",
    city: "Dax",
    companyHint: "NLB Habitat",
    capsule: "Ajoute il y a 3 ans",
    communityKnownBy: 3,
    dominantTags: ["🤝 Connecteur", "🏆 Decideur"],
    externalNews: "Actif sur des sujets immo cette semaine",
  },
  {
    id: "d2",
    name: "Claire R.",
    city: "Saint-Paul-les-Dax",
    companyHint: "Claire Conseil",
    capsule: "Ajoute le jour de la finale 2018",
    communityKnownBy: 2,
    dominantTags: ["💼 Investisseur", "🧠 Visionnaire"],
    externalNews: "Sa societe a ouvert un recrutement",
  },
  {
    id: "d3",
    name: "Julien M.",
    city: "Dax",
    companyHint: "JM Services",
    capsule: "Ajoute il y a exactement 5 ans",
    communityKnownBy: 4,
    dominantTags: ["🔌 Connecteur", "🎾 Padel"],
    externalNews: "Mentionne un projet de refinancement",
  },
  {
    id: "d4",
    name: "Sophie T.",
    city: "Narrosse",
    companyHint: "Studio T",
    capsule: "Ajoute pendant un projet client majeur",
    communityKnownBy: 1,
    dominantTags: ["🍷 Gastronomie", "✨ Ambitieuse"],
    externalNews: "A commente des posts courtage ce matin",
  },
  {
    id: "d5",
    name: "Karim A.",
    city: "Dax",
    companyHint: "KA Invest",
    capsule: "Ajoute il y a 2 ans",
    communityKnownBy: 3,
    dominantTags: ["💼 Investisseur", "🏡 Immo"],
    externalNews: "Partage des sujets fiscalite locale",
  },
  {
    id: "d6",
    name: "Lina P.",
    city: "Dax",
    companyHint: "LP Design",
    capsule: "Ajoute en 2021",
    communityKnownBy: 2,
    dominantTags: ["🎨 Creative", "🤝 Relais"],
    externalNews: "Booste son activite sur LinkedIn",
  },
  {
    id: "d7",
    name: "Maxime D.",
    city: "Saint-Vincent-de-Paul",
    companyHint: "MD Auto",
    capsule: "Ajoute il y a 4 ans",
    communityKnownBy: 2,
    dominantTags: ["🚗 Auto", "⚡ Reactif"],
    externalNews: "Cherche un partenaire financement",
  },
  {
    id: "d8",
    name: "Julie C.",
    city: "Dax",
    companyHint: "JC Patrimoine",
    capsule: "Ajoute lors d un dossier notarial",
    communityKnownBy: 3,
    dominantTags: ["📈 Finance", "🏆 Decideur"],
    externalNews: "Interagit sur les taux immobiliers",
  },
  {
    id: "d9",
    name: "Tom V.",
    city: "Soustons",
    companyHint: "TV Habitat",
    capsule: "Ajoute il y a 6 ans",
    communityKnownBy: 1,
    dominantTags: ["🏡 Habitat", "🔌 Connecteur"],
    externalNews: "Actif sur des contenus renovation",
  },
  {
    id: "d10",
    name: "Maya F.",
    city: "Dax",
    companyHint: "MF Legal",
    capsule: "Ajoute en 2020",
    communityKnownBy: 2,
    dominantTags: ["⚖️ Juridique", "💡 Visionnaire"],
    externalNews: "A commente des sujets transmission",
  },
];

const QUALIFIER_TAGS = [
  { id: "connecteur", label: "🤝 Connecteur", count: 5 },
  { id: "decideur", label: "📈 Decideur", count: 3 },
  { id: "gros-budget", label: "💰 Gros Budget", count: 2 },
  { id: "expert", label: "🧠 Expert", count: 2 },
  { id: "prescripteur", label: "🔥 Prescripteur", count: 3 },
  { id: "institutionnel", label: "🏢 Institutionnel", count: 1 },
  { id: "early", label: "🚀 Early Adopter", count: 2 },
  { id: "influenceur", label: "📢 Influenceur", count: 2 },
  { id: "operationnel", label: "🛠️ Operationnel", count: 2 },
  { id: "partenaire", label: "💼 Partenaire", count: 2 },
  { id: "inconnu", label: "❓ Inconnu", count: 1 },
] as const;
const QUALIFIER_STATUS = ["Prospect", "Partenaire", "Ami"] as const;
type HeatLevel = "froid" | "tiede" | "brulant";

function buildTemplate(action: DailyCategory, contact: DailyContact) {
  if (action === "eclaireur") {
    return `Salut ${contact.name.split(" ")[0]}, je monte une mini-agence avec un courtier et un notaire de confiance. On cherche des eclaireurs pour nous remonter des infos terrain contre partage. Ca te parle ?`;
  }
  if (action === "package") {
    return `Bonjour ${contact.name.split(" ")[0]}, je travaille en synergie avec un expert en pret immobilier. Vu le marche actuel, il peut te faire gagner sur ton credit. Je te le presente ?`;
  }
  if (action === "exclients") {
    return `Hello ${contact.name.split(" ")[0]}, update secteur: les prix dans ton quartier ont bouge recemment. Si tu veux une actualisation rapide de ton estimation, je te l envoie.`;
  }
  if (action === "qualifier") {
    return "Pas d envoi. Qualification communautaire uniquement.";
  }
  return "Passe pour ce cycle de 30 jours.";
}

export default function EntrepreneurSmartScanTestPage() {
  const [stage, setStage] = useState<"scan" | "daily">("scan");
  const [scanCount, setScanCount] = useState(0);
  const [scanBurst, setScanBurst] = useState(false);
  const [index, setIndex] = useState(0);
  const [selectedAction, setSelectedAction] = useState<DailyCategory | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [qualifierHeat, setQualifierHeat] = useState<HeatLevel>("tiede");
  const [qualifierTags, setQualifierTags] = useState<string[]>([]);
  const [qualifierStatus, setQualifierStatus] = useState<(typeof QUALIFIER_STATUS)[number]>("Prospect");
  const [qualifierNote, setQualifierNote] = useState("");
  const [customTagInput, setCustomTagInput] = useState("");
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [sentCount, setSentCount] = useState(4);
  const [responseRate] = useState(38);
  const [showReward, setShowReward] = useState(false);
  const [successPulse, setSuccessPulse] = useState(false);
  const [showProgressCheck, setShowProgressCheck] = useState(false);
  const [softLearningHint, setSoftLearningHint] = useState("");
  const [qualificationPivot, setQualificationPivot] = useState<{ contactId: string; firstName: string; tag: string } | null>(null);
  const [actionGlowContactId, setActionGlowContactId] = useState<string | null>(null);
  const [transitionScreen, setTransitionScreen] = useState<{
    message: string;
    icon: string;
    from: number;
    to: number;
    final: boolean;
  } | null>(null);
  const [pendingTransition, setPendingTransition] = useState<{
    message: string;
    icon: string;
    from: number;
    to: number;
    final: boolean;
  } | null>(null);
  const [pendingFinalizeAction, setPendingFinalizeAction] = useState<Exclude<DailyCategory, "qualifier"> | null>(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [qualifierStore, setQualifierStore] = useState<Record<string, QualifierData>>({});

  const current = CONTACTS[index] ?? CONTACTS[CONTACTS.length - 1];
  const totalScanned = 816;
  const scanDone = scanCount >= totalScanned;
  const done = Math.min(index, CONTACTS.length);
  const progress = Math.round((done / 10) * 100);
  const heatScore = Math.min(99, 55 + current.communityKnownBy * 10 + (current.externalNews ? 8 : 0));
  const heatLabel = heatScore >= 90 ? "Brulant" : heatScore >= 75 ? "Chaud" : "Tiede";
  const sourceRing =
    current.communityKnownBy >= 3
      ? "from-emerald-300 via-cyan-300 to-indigo-300"
      : current.communityKnownBy === 2
        ? "from-cyan-300 via-indigo-300 to-fuchsia-300"
        : "from-amber-300 via-orange-300 to-fuchsia-300";
  const dominantTheme = current.dominantTags[0]?.replace(/[^\p{L}\s]/gu, "").trim() || "son reseau";
  const fusedInsight = `${current.name.split(" ")[0]} montre un interet fort pour ${dominantTheme.toLowerCase()} cette semaine, ${current.capsule.toLowerCase()}.`;
  const isQualified = Boolean(qualifierStore[current.id]);
  const qualifierTagLabelMap = useMemo(
    () => Object.fromEntries(QUALIFIER_TAGS.map((tag) => [tag.id, tag.label])),
    [],
  );
  const adnPopey = useMemo(() => {
    const entries = current.dominantTags.map((tag, idx) => ({
      label: tag,
      count: Math.max(1, current.communityKnownBy + 2 - idx * 2),
    }));
    const qualified = qualifierStore[current.id];
    if (qualified) {
      qualified.tags.forEach((tagId) => {
        const found = entries.find((entry) => entry.label === qualifierTagLabelMap[tagId]);
        if (found) found.count += 1;
        else if (qualifierTagLabelMap[tagId]) entries.push({ label: qualifierTagLabelMap[tagId], count: 1 });
      });
      qualified.customTags.forEach((tag) => {
        const found = entries.find((entry) => entry.label === tag);
        if (found) found.count += 1;
        else entries.push({ label: tag, count: 1 });
      });
    }
    return entries.sort((a, b) => b.count - a.count).slice(0, 3);
  }, [current, qualifierStore, qualifierTagLabelMap]);
  const searchResults = CONTACTS.filter((contact) => `${contact.name} ${contact.city} ${contact.companyHint}`.toLowerCase().includes(searchQuery.toLowerCase().trim()));
  const template = useMemo(
    () => (selectedAction ? buildTemplate(selectedAction, current) : "Choisis une action pour voir le template pre-rempli."),
    [selectedAction, current],
  );
  const qualifierChanged =
    qualifierHeat !== "tiede" ||
    qualifierStatus !== "Prospect" ||
    qualifierTags.length > 0 ||
    customTags.length > 0 ||
    qualifierNote.trim().length > 0;

  function tagPalette(tagId: string, active: boolean) {
    if (tagId === "inconnu") return active ? "bg-slate-300 text-slate-900" : "bg-slate-100 text-slate-700";
    if (["decideur", "gros-budget", "institutionnel"].includes(tagId)) return active ? "bg-blue-300 text-blue-950" : "bg-blue-100 text-blue-900";
    if (["connecteur", "influenceur", "prescripteur"].includes(tagId)) return active ? "bg-violet-300 text-violet-950" : "bg-violet-100 text-violet-900";
    return active ? "bg-emerald-300 text-emerald-950" : "bg-emerald-100 text-emerald-900";
  }

  useEffect(() => {
    if (stage !== "scan") return;
    const timer = setInterval(() => {
      setScanCount((value) => Math.min(totalScanned, value + Math.floor(Math.random() * 9) + 10));
    }, 180);
    return () => clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (!scanDone) return;
    setScanBurst(true);
    const timer = setTimeout(() => setScanBurst(false), 1100);
    return () => clearTimeout(timer);
  }, [scanDone]);

  useEffect(() => {
    if (stage !== "daily") return;
    if (showTemplateModal) return;
    if (qualifierStore[current.id]) return;
    setSelectedAction("qualifier");
    setQualifierHeat("tiede");
    setQualifierStatus("Prospect");
    setQualifierNote("");
    setCustomTagInput("");
    setCustomTags([]);
    setQualifierTags([]);
    setShowTemplateModal(true);
  }, [stage, current.id, qualifierStore, showTemplateModal]);

  useEffect(() => {
    if (!qualificationPivot) return;
    const timer = setTimeout(() => {
      setQualificationPivot((pivot) => {
        if (!pivot) return null;
        setActionGlowContactId(pivot.contactId);
        setTimeout(() => setActionGlowContactId((id) => (id === pivot.contactId ? null : id)), 2200);
        return null;
      });
    }, 3200);
    return () => clearTimeout(timer);
  }, [qualificationPivot]);

  useEffect(() => {
    function flushPendingTransition() {
      if (!pendingTransition || !pendingFinalizeAction) return;
      setTransitionScreen(pendingTransition);
      setTimeout(() => setTransitionScreen(null), 2000);
      setShowProgressCheck(true);
      setTimeout(() => setShowProgressCheck(false), 650);
      finalizeAction(pendingFinalizeAction, 1800);
      setPendingTransition(null);
      setPendingFinalizeAction(null);
    }

    function onFocus() {
      flushPendingTransition();
    }

    function onVisibilityChange() {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        flushPendingTransition();
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus);
      document.addEventListener("visibilitychange", onVisibilityChange);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", onFocus);
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };
  }, [pendingTransition, pendingFinalizeAction]);

  function actionLabel(action: Exclude<DailyCategory, "qualifier">) {
    if (action === "eclaireur") return "Eclaireur";
    if (action === "package") return "Package Croise";
    if (action === "exclients") return "Ex-Clients";
    return "Passer";
  }

  function createTransitionPayload(action: Exclude<DailyCategory, "qualifier">) {
    const nextStep = Math.min(10, done + 1);
    const points = action === "eclaireur" ? 5 : action === "package" ? 4 : action === "exclients" ? 3 : 1;
    const encouragements = [
      `Message envoye a ${current.name.split(" ")[0]} ! +${points} points pour ta Mini-Agence. �`,
      `${current.name.split(" ")[0]} active ! +${points} points pour l equipe.`,
      `Bien joue, +${points} points dans ta sphere business.`,
    ];
    const message = nextStep >= 10 ? "Session terminee ! Tu as reveille 10 contacts en 3 minutes." : encouragements[Math.floor(Math.random() * encouragements.length)];
    return {
      message,
      icon: nextStep >= 10 ? "🎆" : "✅",
      from: done,
      to: nextStep,
      final: nextStep >= 10,
    };
  }

  function finalizeAction(action: Exclude<DailyCategory, "qualifier">, advanceDelay = 200) {
    setSelectedAction(action);
    if (action === "eclaireur" || action === "package" || action === "exclients") {
      setSentCount((v) => v + 1);
    }
    setShowReward(true);
    setSuccessPulse(true);
    setTimeout(() => setShowReward(false), 900);
    setTimeout(() => setSuccessPulse(false), 450);
    setTimeout(() => {
      const now = new Date();
      setHistoryEntries((prev) => [
        {
          contactId: current.id,
          name: current.name,
          action,
          at: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
          tagsSummary: (qualifierStore[current.id]?.tags ?? [])
            .map((tagId) => qualifierTagLabelMap[tagId] ?? tagId)
            .slice(0, 2)
            .join(" • "),
        },
        ...prev,
      ].slice(0, 50));
      setIndex((v) => Math.min(CONTACTS.length, v + 1));
      setSelectedAction(null);
    }, advanceDelay);
  }

  function triggerAction(action: DailyCategory) {
    if (action === "passer") {
      finalizeAction(action);
      return;
    }
    const nextDraft = buildTemplate(action, current);
    setSelectedAction(action);
    if (action === "qualifier") {
      setQualifierHeat("tiede");
      setQualifierStatus("Prospect");
      setQualifierNote("");
      setCustomTagInput("");
      setCustomTags([]);
      const preselected = QUALIFIER_TAGS.filter((tag) =>
        current.dominantTags.some((dominant) => dominant.toLowerCase().includes(tag.id.replace("-", " "))),
      ).map((tag) => tag.id);
      setQualifierTags(preselected);
      setDraftMessage("");
    } else {
      setDraftMessage(nextDraft);
    }
    setShowTemplateModal(true);
  }

  function sendOnWhatsApp() {
    const cleanPhone = "33600000000";
    const action = selectedAction;
    if (!action || action === "qualifier") return;
    const payload = createTransitionPayload(action);

    if (typeof window !== "undefined") {
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(draftMessage)}`, "_blank");
    }
    setShowTemplateModal(false);
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      setTransitionScreen(payload);
      setTimeout(() => setTransitionScreen(null), 2000);
      setShowProgressCheck(true);
      setTimeout(() => setShowProgressCheck(false), 650);
      finalizeAction(action, 1800);
      return;
    }
    setPendingTransition(payload);
    setPendingFinalizeAction(action);
  }

  function saveQualifierAndReturn() {
    const primaryTag =
      (qualifierTags[0] ? qualifierTagLabelMap[qualifierTags[0]] : undefined) ??
      (customTags[0] ? customTags[0] : undefined) ??
      "❓ Inconnu";
    const firstName = current.name.split(" ")[0];

    setQualifierStore((prev) => ({
      ...prev,
      [current.id]: {
        heat: qualifierHeat,
        status: qualifierStatus,
        tags: qualifierTags,
        customTags,
        note: qualifierNote.trim(),
      },
    }));
    setShowTemplateModal(false);
    setSelectedAction(null);
    setQualificationPivot({ contactId: current.id, firstName, tag: primaryTag });
    setLastRewardForQualifier();
  }

  function skipQualifierUnknown() {
    setQualifierStore((prev) => ({
      ...prev,
      [current.id]: {
        heat: "tiede",
        status: "Prospect",
        tags: [],
        customTags: [],
        note: "",
      },
    }));
    setShowTemplateModal(false);
    setSelectedAction(null);
    setSoftLearningHint("Profil peu renseigne: sois le premier a le qualifier !");
    setTimeout(() => setSoftLearningHint(""), 2200);
  }

  function setLastRewardForQualifier() {
    setShowReward(true);
    setTimeout(() => setShowReward(false), 700);
  }

  function modalTitle(action: DailyCategory | null) {
    if (action === "eclaireur") return "Script Eclaireur";
    if (action === "package") return "Script Package Croise";
    if (action === "exclients") return "Script Ex-Clients";
    if (action === "qualifier") return "Qualifier la fiche";
    return "Template";
  }

  function toggleFavorite(contactId: string) {
    setFavoriteIds((prev) => (prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]));
  }

  if (stage === "scan") {
    return (
      <main className="h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_0%,#10193D_0%,#0C122B_45%,#090B16_100%)] text-white">
        <div className="mx-auto flex h-full max-w-xl items-center px-4">
          <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Mini-Agence Smart Scan</p>
            <h1 className="mt-2 text-2xl font-black">Scan de ton telephone en cours...</h1>
            <p className="mt-1 text-sm text-white/70">Analyse locale securisee, aucun contact en clair n est envoye.</p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="relative h-full w-full">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400"
                  animate={{ width: `${Math.min(100, Math.round((scanCount / totalScanned) * 100))}%` }}
                  transition={{ duration: 0.2 }}
                />
                {!scanDone && (
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 0.55, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-orange-300 shadow-[0_0_18px_rgba(251,146,60,0.95)]"
                    style={{ left: `calc(${Math.min(99, Math.round((scanCount / totalScanned) * 100))}% - 6px)` }}
                  />
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-white/70">{scanCount} / {totalScanned} contacts scannes</p>
            {!scanDone && <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-orange-200/90">Meche active...</p>}

            {scanDone ? (
              <>
                {scanBurst && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-3 rounded-2xl border border-orange-300/35 bg-orange-300/15 p-3 text-center"
                  >
                    <p className="text-2xl">💥</p>
                    <p className="text-sm font-black text-orange-100">Scan termine, intelligence revelee.</p>
                  </motion.div>
                )}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-white/10 p-3 text-center">
                    <p className="text-2xl font-black text-cyan-100">304</p>
                    <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-white/75">profils actifs</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 text-center">
                    <p className="text-2xl font-black text-indigo-100">488</p>
                    <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-white/75">contacts locaux</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 text-center">
                    <p className="text-2xl font-black text-orange-100">112</p>
                    <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-white/75">signaux chauds</p>
                  </div>
                </div>

                <p className="mt-4 rounded-xl bg-emerald-400/15 px-3 py-2 text-sm text-emerald-100">
                  Scan termine: {totalScanned} contacts disponibles.
                </p>
              </>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-white/10 p-3 text-center animate-pulse">
                  <p className="text-2xl font-black text-cyan-100/70">•••</p>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-white/60">profils actifs</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-center animate-pulse">
                  <p className="text-2xl font-black text-indigo-100/70">•••</p>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-white/60">contacts locaux</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-center animate-pulse">
                  <p className="text-2xl font-black text-orange-100/70">•••</p>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-white/60">signaux chauds</p>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={!scanDone}
              onClick={() => setStage("daily")}
              className="mt-4 h-12 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-300 text-sm font-black uppercase tracking-wide text-[#11252C] disabled:opacity-40"
            >
              Continuer
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-y-auto bg-[radial-gradient(circle_at_10%_0%,#10193D_0%,#0C122B_45%,#090B16_100%)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:py-5 pb-20">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Smart Scan & Daily Action</p>
              <h1 className="mt-1 text-lg sm:text-2xl font-black">Mini-Agence • Radar Quotidien</h1>
              <p className="mt-0.5 text-[11px] text-white/70">{sentCount} messages envoyes aujourd hui • taux de reponse {responseRate}%</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHistoryPanel(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/25 text-sm"
                aria-label="Historique"
              >
                🕘
              </button>
              <button
                type="button"
                onClick={() => setShowSearchPanel(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/25 text-sm"
                aria-label="Recherche"
              >
                🔍
              </button>
              <button
                type="button"
                onClick={() => setShowHistoryPanel(true)}
                className="relative h-16 w-16 rounded-full"
                aria-label="Progression"
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(#34d399 ${progress * 3.6}deg, rgba(255,255,255,0.15) 0deg)`,
                  }}
                />
                <div className="absolute inset-[6px] rounded-full bg-[#0B1024] flex items-center justify-center text-center">
                  <p className="text-[10px] font-black leading-tight">{done}/10<br />faits</p>
                </div>
                {showProgressCheck && (
                  <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200/50 bg-emerald-400 text-[12px] font-black text-[#10261A] shadow-[0_10px_22px_-10px_rgba(52,211,153,0.95)]">
                    ✓
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-3 sm:p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Daily Card</p>
              <span className="rounded-full border border-white/15 bg-black/25 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white/80">🔒 Anonymat communautaire garanti</span>
            </div>

            <motion.article
              key={current.id}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: successPulse ? 1.01 : 1 }}
              transition={{ duration: 0.25 }}
              className="relative mt-2 rounded-[30px] bg-white/10 p-3 sm:p-4 shadow-[0_30px_70px_-40px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
            >
              <button
                type="button"
                onClick={() => toggleFavorite(current.id)}
                className={`absolute left-3 top-3 h-9 w-9 rounded-full border text-sm font-black ${
                  favoriteIds.includes(current.id) ? "border-amber-300/45 bg-amber-300/25 text-amber-100" : "border-white/20 bg-black/30 text-white/80"
                }`}
                aria-label="Favori"
              >
                ★
              </button>
              <button
                type="button"
                onClick={() => triggerAction("passer")}
                className="absolute right-3 top-3 h-9 w-9 rounded-full border border-white/20 bg-black/30 text-sm font-black text-white/80"
                aria-label="Passer"
              >
                ✕
              </button>

              <div className="flex flex-col items-center text-center">
                <div
                  className={`h-20 w-20 rounded-full bg-gradient-to-br ${sourceRing} p-[2px] shadow-[0_0_35px_rgba(56,189,248,0.35)]`}
                  style={{ boxShadow: heatScore >= 90 ? "0 0 40px rgba(251,146,60,0.75)" : undefined }}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0D132D] text-3xl font-black">
                    {current.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </div>
                </div>
                <p className="mt-2 text-2xl sm:text-3xl font-black">{current.name}</p>
                <p className="text-xs sm:text-sm text-white/70">{current.companyHint} • {current.city}</p>
                <motion.div
                  animate={{ opacity: [0.65, 1, 0.65] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  className="mt-1 inline-flex items-center rounded-full border border-rose-300/35 bg-rose-400/20 px-2 py-1 text-[10px] font-black text-rose-100"
                >
                  🔥 En recherche active
                </motion.div>
                <div className="mt-1.5 inline-flex items-center rounded-full border border-orange-300/35 bg-orange-300/10 px-3 py-1 text-[10px] font-black text-orange-100">
                  🌡 Score de chaleur: {heatScore}% • {heatLabel}
                </div>
              </div>

              <div className="mt-3 rounded-2xl bg-white/10 px-3 py-2.5">
                <p className="text-xs sm:text-sm font-black text-cyan-100">{fusedInsight}</p>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="rounded-full bg-cyan-500/20 px-2 py-1 font-black text-cyan-100">📍 {current.city}</span>
                <span className="rounded-full bg-fuchsia-500/20 px-2 py-1 font-black text-fuchsia-100">👥 {current.communityKnownBy} membres</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-1 font-black text-emerald-100">🛰 {current.externalNews}</span>
              </div>

              <div className="mt-2 rounded-2xl border border-indigo-300/20 bg-indigo-500/10 px-3 py-2.5 text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-indigo-100">Capsule Temporelle</p>
                <p className="mt-1 text-xs text-white/85">⏳ Memorise pendant: {current.capsule}</p>
              </div>

              <div className="mt-2 rounded-2xl bg-white/10 px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/70">ADN POPEY</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {adnPopey.map((entry) => (
                    <span key={entry.label} className="rounded-full bg-white/85 px-3 py-2 text-xs font-black text-[#1B1F34]">
                      {entry.label} x{entry.count}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => triggerAction("eclaireur")}
                  disabled={!isQualified}
                  className={`h-14 rounded-xl border border-amber-300/45 bg-gradient-to-r from-amber-400/45 to-orange-400/35 text-xs font-black uppercase tracking-wide text-amber-50 shadow-[0_18px_34px_-18px_rgba(251,191,36,0.95)] ${
                    isQualified && actionGlowContactId === current.id ? "animate-pulse ring-2 ring-amber-300/40" : ""
                  }`}
                >
                  ✨ Eclaireur
                </button>
                <button
                  type="button"
                  onClick={() => triggerAction("package")}
                  disabled={!isQualified}
                  className={`h-12 rounded-xl border border-fuchsia-300/35 bg-gradient-to-r from-violet-500/30 to-fuchsia-500/25 text-xs font-black uppercase tracking-wide text-fuchsia-100 ${
                    isQualified && actionGlowContactId === current.id ? "animate-pulse ring-2 ring-fuchsia-300/35" : ""
                  }`}
                >
                  🧩 Package Croise
                </button>
                <button
                  type="button"
                  onClick={() => triggerAction("exclients")}
                  disabled={!isQualified}
                  className={`h-11 rounded-xl border border-cyan-300/30 bg-cyan-500/12 text-[11px] font-black uppercase tracking-wide text-cyan-100 ${
                    isQualified && actionGlowContactId === current.id ? "animate-pulse ring-2 ring-cyan-300/35" : ""
                  }`}
                >
                  📣 Ex-Clients (News)
                </button>
                {!isQualified && (
                  <p className="self-center text-[11px] font-black uppercase tracking-wide text-emerald-100/85">
                    Qualification requise d abord
                  </p>
                )}
              </div>
              {isQualified && (
                <button
                  type="button"
                  onClick={() => finalizeAction("passer")}
                  className="mt-2 h-10 w-full rounded-xl border border-white/25 bg-black/30 text-[11px] font-black uppercase tracking-wide text-white/85"
                >
                  Passer au prochain contact
                </button>
              )}
              {softLearningHint && (
                <p className="mt-2 rounded-xl bg-white/10 px-3 py-2 text-xs text-cyan-100">{softLearningHint}</p>
              )}
            </motion.article>

            <p className="mt-2 text-xs text-white/70">Mode tunnel: une carte, une decision, action immediate.</p>
          </section>

          {done >= 10 && (
            <section className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]">Template Assistant</p>
            <h2 className="mt-1 text-xl font-black">Message pre-rempli</h2>
            <textarea value={template} readOnly className="mt-3 min-h-44 w-full rounded-2xl border border-white/15 bg-black/25 px-3 py-3 text-sm" />

            <div className="mt-3 rounded-2xl bg-black/25 p-3">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Privacy by Design</p>
              <ul className="mt-2 space-y-1 text-xs text-white/75">
                <li>• Hashing local SHA-256 avant matching</li>
                <li>• Aucune donnee contact envoyee sans action explicite</li>
                <li>• Scan metadonnees client-side pour rapidite</li>
              </ul>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl bg-indigo-500/15 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-indigo-100">Workflow Tech</p>
                <p className="mt-1 text-xs text-white/80">Permission contacts → Moteur Daily 10 → Swipe/actions → Push relance.</p>
              </div>
              <div className="rounded-2xl bg-fuchsia-500/15 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-fuchsia-100">Mini-Agence</p>
                <p className="mt-1 text-xs text-white/80">Messages collectifs, taux de reponse, et volume d actions partages.</p>
              </div>
            </div>
            </section>
          )}
        </div>
      </div>

      {showHistoryPanel && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-start justify-center px-4 pt-16">
          <section className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#0E1430] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Historique recent</p>
              <button type="button" onClick={() => setShowHistoryPanel(false)} className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs">✕</button>
            </div>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {historyEntries.length === 0 && <p className="text-sm text-white/70">Aucune action recente pour le moment.</p>}
              {historyEntries.map((entry, idx) => (
                <button
                  key={`${entry.contactId}-${entry.at}-${idx}`}
                  type="button"
                  onClick={() => {
                    const nextIndex = CONTACTS.findIndex((contact) => contact.id === entry.contactId);
                    if (nextIndex >= 0) setIndex(nextIndex);
                    setShowHistoryPanel(false);
                  }}
                  className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-left"
                >
                  <p className="text-sm font-black">{entry.name}</p>
                  <p className="text-xs text-white/70">
                    {actionLabel(entry.action)} • {entry.at}
                    {entry.tagsSummary ? ` • ${entry.tagsSummary}` : ""}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {showSearchPanel && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-start justify-center px-4 pt-16">
          <section className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#0E1430] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Recherche / Favoris</p>
              <button type="button" onClick={() => setShowSearchPanel(false)} className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs">✕</button>
            </div>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Rechercher un contact..."
              className="mt-3 h-10 w-full rounded-xl border border-white/15 bg-black/25 px-3 text-sm"
            />
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {searchResults.map((contact) => (
                <div key={contact.id} className="rounded-xl border border-white/15 bg-black/25 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const nextIndex = CONTACTS.findIndex((item) => item.id === contact.id);
                        if (nextIndex >= 0) setIndex(nextIndex);
                        setShowSearchPanel(false);
                      }}
                      className="text-left"
                    >
                      <p className="text-sm font-black">{contact.name}</p>
                      <p className="text-xs text-white/70">{contact.city}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(contact.id)}
                      className={`h-8 w-8 rounded-full border text-xs ${favoriteIds.includes(contact.id) ? "border-amber-300/45 bg-amber-300/20 text-amber-100" : "border-white/20 bg-white/10 text-white/80"}`}
                    >
                      ★
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {showTemplateModal && selectedAction && selectedAction !== "passer" && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center px-3 sm:px-4">
          <section className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0E1430] p-4">
            <div className="relative flex items-center justify-center">
              <p className="text-sm font-black tracking-[0.05em] text-cyan-200 text-center">
                {selectedAction === "qualifier" ? "Qualifiez ce contact" : "Message pret a envoyer"}
              </p>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="absolute right-0 h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs"
              >
                ✕
              </button>
            </div>
            {selectedAction === "qualifier" && (
              <div className="mt-3 rounded-[20px] border border-white/15 bg-black/25 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-14 w-14 rounded-full bg-gradient-to-br ${sourceRing} p-[2px]`}
                      style={{ boxShadow: heatScore >= 90 ? "0 0 28px rgba(251,146,60,0.65)" : "0 0 16px rgba(56,189,248,0.45)" }}
                    >
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0D132D] text-xl font-black">
                        {current.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-black leading-tight">{current.name}</p>
                      <p className="mt-0.5 text-sm text-white/70">📍 {current.city}</p>
                    </div>
                  </div>
                  <span className="rounded-lg border border-cyan-300/35 bg-cyan-400/15 px-2 py-1 text-[11px] font-black text-cyan-100">
                    🔥 {heatScore}% {heatLabel.toUpperCase()}
                  </span>
                </div>

                <div className="mt-3 h-px bg-white/15" />

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-orange-300/15 px-2 py-1 text-xs font-black text-orange-100">🔥 Interet : {dominantTheme}</span>
                  <span className="rounded-lg bg-white/10 px-2 py-1 text-xs font-black text-white/85">📍 {current.companyHint}</span>
                </div>

                <p className="mt-3 text-xs italic text-white/75">🤝 Memoire: {current.capsule}</p>
              </div>
            )}
            {selectedAction === "qualifier" ? (
              <div className="mt-3 space-y-3">
                <div className="rounded-2xl border border-white/15 bg-black/25 p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Temperature du contact</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setQualifierHeat("froid")}
                      className={`h-9 rounded-xl text-xs font-black ${qualifierHeat === "froid" ? "bg-cyan-300 text-[#13253D]" : "bg-white/10 text-white/80"}`}
                    >
                      ❄️ Froid
                    </button>
                    <button
                      type="button"
                      onClick={() => setQualifierHeat("tiede")}
                      className={`h-9 rounded-xl text-xs font-black ${qualifierHeat === "tiede" ? "bg-amber-300 text-[#2C230E]" : "bg-white/10 text-white/80"}`}
                    >
                      ⚡ Tiede
                    </button>
                    <button
                      type="button"
                      onClick={() => setQualifierHeat("brulant")}
                      className={`h-9 rounded-xl text-xs font-black ${qualifierHeat === "brulant" ? "bg-orange-400 text-[#321A0E]" : "bg-white/10 text-white/80"}`}
                    >
                      🔥 Brulant
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/15 bg-black/25 p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Tags de contribution</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {QUALIFIER_TAGS.map((tag) => {
                      const active = qualifierTags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() =>
                            setQualifierTags((prev) => (prev.includes(tag.id) ? prev.filter((item) => item !== tag.id) : [...prev, tag.id]))
                          }
                          className={`rounded-full px-3 py-2 text-[11px] font-black ${
                            active ? `${tagPalette(tag.id, true)} shadow-[0_10px_24px_-16px_rgba(52,211,153,0.95)]` : tagPalette(tag.id, false)
                          }`}
                        >
                          {tag.label} ({tag.count})
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={customTagInput}
                      onChange={(event) => setCustomTagInput(event.target.value)}
                      placeholder="Ajouter un tag custom"
                      className="h-9 w-full rounded-xl border border-white/15 bg-black/25 px-3 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const value = customTagInput.trim();
                        if (!value) return;
                        setCustomTags((prev) => (prev.includes(value) ? prev : [...prev, value]));
                        setCustomTagInput("");
                      }}
                      className="h-9 rounded-xl border border-fuchsia-300/35 bg-fuchsia-500/15 px-3 text-xs font-black"
                    >
                      ＋
                    </button>
                  </div>
                  {customTags.length > 0 && <p className="mt-2 text-xs text-fuchsia-100">Custom: {customTags.join(" • ")}</p>}
                </div>

                <div className="rounded-2xl border border-white/15 bg-black/25 p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Statut relation</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {QUALIFIER_STATUS.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setQualifierStatus(status)}
                        className={`h-9 rounded-xl text-xs font-black ${qualifierStatus === status ? "bg-cyan-300 text-[#15243A]" : "bg-white/10 text-white/80"}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  <input
                    value={qualifierNote}
                    onChange={(event) => setQualifierNote(event.target.value)}
                    placeholder="Ajouter une info cle..."
                    className="mt-2 h-9 w-full rounded-xl border border-white/15 bg-black/25 px-3 text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowTemplateModal(false);
                    saveQualifierAndReturn();
                  }}
                  disabled={!qualifierChanged}
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-300 text-xs font-black uppercase tracking-wide text-[#11252C] disabled:opacity-40"
                >
                  Enregistrer la fiche
                </button>
                <button
                  type="button"
                  onClick={skipQualifierUnknown}
                  className="w-full text-center text-xs text-white/70 underline underline-offset-2"
                >
                  Je ne connais pas encore ce contact
                </button>
              </div>
            ) : (
              <>
                <p className="mt-1 text-sm font-black">{modalTitle(selectedAction)}</p>
                <textarea
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  className="mt-3 min-h-36 w-full rounded-2xl border border-white/15 bg-black/25 px-3 py-3 text-sm"
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const action = selectedAction;
                    if (!action) return;
                    const payload = createTransitionPayload(action);
                    setTransitionScreen(payload);
                    setTimeout(() => setTransitionScreen(null), 2000);
                    setShowProgressCheck(true);
                    setTimeout(() => setShowProgressCheck(false), 650);
                    setShowTemplateModal(false);
                    finalizeAction(action, 1800);
                  }}
                  className="h-10 rounded-xl border border-white/20 bg-white/10 text-[11px] font-black uppercase tracking-wide text-white/80"
                >
                  Valider sans envoi
                </button>
                <button
                  type="button"
                  onClick={sendOnWhatsApp}
                  className="h-11 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-300 text-xs font-black uppercase tracking-wide text-[#11252C]"
                >
                  Envoyer sur WhatsApp
                </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {qualificationPivot && (
        <div className="fixed inset-0 z-[58] bg-[radial-gradient(circle_at_30%_10%,rgba(52,211,153,0.2),rgba(8,12,28,0.9))] backdrop-blur-sm flex items-center justify-center px-4">
          <motion.section
            initial={{ opacity: 0, scale: 0.93, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-3xl border border-emerald-300/30 bg-[#0D1830]/90 p-5 text-center shadow-[0_30px_70px_-35px_rgba(16,185,129,0.7)]"
          >
            <p className="text-4xl">✅</p>
            <p className="mt-2 text-xl font-black">Fiche de {qualificationPivot.firstName} qualifiee ! 🚀</p>
            <p className="mt-1 text-sm text-emerald-100/90">
              Intelligence partagee: la Mini-Agence sait maintenant que c est un profil "{qualificationPivot.tag}".
            </p>
            <p className="mt-2 text-xs font-black uppercase tracking-wide text-cyan-100">Quelle est ta prochaine etape ?</p>
            <button
              type="button"
              onClick={() => {
                const pivot = qualificationPivot;
                setQualificationPivot(null);
                if (pivot) {
                  setActionGlowContactId(pivot.contactId);
                  setTimeout(() => setActionGlowContactId((id) => (id === pivot.contactId ? null : id)), 2200);
                }
              }}
              className="mt-3 h-11 w-full rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 text-xs font-black uppercase tracking-wide text-[#11252C]"
            >
              Voir les actions possibles
            </button>
          </motion.section>
        </div>
      )}

      {transitionScreen && (
        <div className="fixed inset-0 z-[60] bg-[radial-gradient(circle_at_30%_10%,rgba(52,211,153,0.25),rgba(8,12,28,0.92))] backdrop-blur-sm flex items-center justify-center px-4">
          <motion.section
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-3xl border border-emerald-300/30 bg-[#0D1830]/90 p-5 text-center shadow-[0_30px_70px_-35px_rgba(16,185,129,0.7)]"
          >
            <p className="text-4xl">{transitionScreen.icon}</p>
            <p className="mt-2 text-xl font-black">{transitionScreen.message}</p>
            <p className="mt-1 text-sm text-emerald-100/85">
              Progression: {transitionScreen.from}/10 → {transitionScreen.to}/10
            </p>
            {transitionScreen.final && (
              <p className="mt-2 text-sm font-black text-cyan-100">Ta mini-agence est fiere de toi.</p>
            )}
          </motion.section>
        </div>
      )}

      {showReward && (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-40 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-[#132415] shadow-[0_20px_40px_-20px_rgba(16,185,129,0.8)]"
          >
            🎉 Action enregistree pour la mini-agence
          </motion.div>
        </div>
      )}
    </main>
  );
}
