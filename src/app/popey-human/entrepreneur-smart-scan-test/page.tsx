"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

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
  businessChoice: (typeof BUSINESS_OPTIONS)[number]["id"] | null;
  networkChoice: (typeof NETWORK_OPTIONS)[number]["id"] | null;
  communityTags: Array<(typeof COMMUNITY_OPTIONS)[number]["id"]>;
  estimatedGain: "Faible" | "Moyen" | "Eleve";
};
type HistoryEntry = {
  contactId: string;
  name: string;
  action: Exclude<DailyCategory, "qualifier">;
  at: string;
  tagsSummary: string;
  sent: boolean;
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

const BUSINESS_OPTIONS = [
  { id: "can-buy", label: "💸 Peut acheter", score: 2 },
  { id: "ideal-client", label: "🎯 Client ideal", score: 3 },
  { id: "identified-need", label: "🔥 Besoin à identifier", score: 2 },
  { id: "no-potential", label: "🚫 Aucun potentiel", score: 0 },
] as const;
const NETWORK_OPTIONS = [
  { id: "can-refer", label: "� Peut recommander", score: 2 },
  { id: "opens-doors", label: "🚪 Ouvre des portes", score: 3 },
  { id: "target-access", label: "� Acces a une cible", score: 2 },
  { id: "no-lever", label: "❌ Aucun levier", score: 0 },
] as const;
const COMMUNITY_OPTIONS = [
  { id: "serious-work", label: "� Travail serieux", score: 1 },
  { id: "high-budget", label: "� Gere des budgets eleves", score: 2 },
  { id: "fast-reply", label: "⚡ Reactif / repond vite", score: 1 },
  { id: "slow-decider", label: "🐢 Long a decider", score: -1 },
  { id: "hard-close", label: "🚫 Difficile a closer", score: -2 },
  { id: "reliable-partner", label: "🤝 Fiable / bon partenaire", score: 1 },
  { id: "avoid", label: "⚠️ A eviter / complique", score: -3 },
  { id: "unknown", label: "❓ Inconnu / a decouvrir", score: 0 },
] as const;
type HeatLevel = "froid" | "tiede" | "brulant";

function buildTemplate(action: DailyCategory, contact: DailyContact) {
  if (action === "eclaireur") {
    return `Salut ${contact.name.split(" ")[0]}, je monte une mini-agence avec un courtier et un notaire de confiance. On cherche des eclaireurs pour nous remonter des opportunites terrain. En echange, on partage nos commissions : ca peut vite representer plusieurs centaines ou milliers d'euros pour une simple info. Ca te parle ?`;
  }
  if (action === "package") {
    return `${contact.name.split(" ")[0]}, j'ai une info pour toi : le marche du credit bouge enfin. Je travaille en synergie avec un expert qui vient de faire gagner plusieurs milliers d'euros sur le cout total du credit d'un de nos clients communs. Je pense qu'il y a un coup a jouer pour toi. Je vous presente ?`;
  }
  if (action === "exclients") {
    return `Hello ${contact.name.split(" ")[0]}, petite update immo : ton quartier est devenu super demande ces dernieres semaines. On a des chiffres frais sur les dernieres ventes. Si tu veux voir l'impact sur la valeur de ta maison/appart, dis-le moi, je te fais un point rapide.`;
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
  const [launchingAction, setLaunchingAction] = useState<Exclude<DailyCategory, "passer" | "qualifier"> | null>(null);
  const [qualifierHeat, setQualifierHeat] = useState<HeatLevel | null>(null);
  const [hasChosenHeat, setHasChosenHeat] = useState(false);
  const [qualifierStep, setQualifierStep] = useState<1 | 2 | 3 | 4>(1);
  const [businessChoice, setBusinessChoice] = useState<(typeof BUSINESS_OPTIONS)[number]["id"] | null>(null);
  const [networkChoice, setNetworkChoice] = useState<(typeof NETWORK_OPTIONS)[number]["id"] | null>(null);
  const [communityTags, setCommunityTags] = useState<Array<(typeof COMMUNITY_OPTIONS)[number]["id"]>>([]);
  const businessSectionRef = useRef<HTMLDivElement | null>(null);
  const networkSectionRef = useRef<HTMLDivElement | null>(null);
  const communitySectionRef = useRef<HTMLDivElement | null>(null);
  const saveSectionRef = useRef<HTMLDivElement | null>(null);
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
  const [pendingReturnProfileContactId, setPendingReturnProfileContactId] = useState<string | null>(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showContactProfile, setShowContactProfile] = useState(false);
  const [profileContactId, setProfileContactId] = useState<string | null>(null);
  const [showProfileActions, setShowProfileActions] = useState(false);
  const [actionFromProfileContactId, setActionFromProfileContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [qualifierStore, setQualifierStore] = useState<Record<string, QualifierData>>({});

  const current = CONTACTS[index] ?? CONTACTS[CONTACTS.length - 1];
  const profileContact = CONTACTS.find((contact) => contact.id === profileContactId) ?? null;
  const totalScanned = 816;
  const scanDone = scanCount >= totalScanned;
  const scanProgress = Math.min(1, scanCount / totalScanned);
  const liveProfiles = Math.min(304, Math.round(304 * scanProgress));
  const liveLocals = Math.min(488, Math.round(488 * scanProgress));
  const liveHotSignals = Math.min(112, Math.round(112 * scanProgress));
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
  const currentEstimatedGain = qualifierStore[current.id]?.estimatedGain ?? null;
  const quickLabelMap = useMemo(
    () =>
      Object.fromEntries(
        [...BUSINESS_OPTIONS, ...NETWORK_OPTIONS, ...COMMUNITY_OPTIONS].map((item) => [item.id, item.label]),
      ),
    [],
  );
  const adnPopey = useMemo(() => {
    const qualified = qualifierStore[current.id];
    if (!qualified) {
      return [{ label: "❓ A decouvrir", count: 1 }];
    }

    const aggregateIds = [
      qualified.businessChoice,
      qualified.networkChoice,
      ...qualified.communityTags,
    ].filter(Boolean) as string[];

    const entries: Array<{ label: string; count: number }> = [];
    aggregateIds.forEach((tagId, idx) => {
      const mappedLabel = quickLabelMap[tagId];
      if (!mappedLabel) return;
      const found = entries.find((entry) => entry.label === mappedLabel);
      if (found) {
        found.count += 1;
        return;
      }
      const socialWeight = Math.max(1, current.communityKnownBy - Math.floor(idx / 2));
      entries.push({ label: mappedLabel, count: socialWeight });
    });

    if (entries.length === 0) return [{ label: "❓ A decouvrir", count: 1 }];
    return entries.slice(0, 3);
  }, [current, qualifierStore, quickLabelMap]);
  const searchResults = CONTACTS.filter((contact) => `${contact.name} ${contact.city} ${contact.companyHint}`.toLowerCase().includes(searchQuery.toLowerCase().trim()));
  const template = useMemo(
    () => (selectedAction ? buildTemplate(selectedAction, current) : "Choisis une action pour voir le template pre-rempli."),
    [selectedAction, current],
  );
  const qualifierChanged =
    qualifierHeat !== null ||
    businessChoice !== null ||
    networkChoice !== null ||
    communityTags.length > 0;
  const liveEstimatedGain = getEstimatedGain(businessChoice, networkChoice, communityTags);
  const livePotentialLabel = businessChoice || networkChoice || communityTags.length > 0 ? liveEstimatedGain : "?";
  const canSaveQualifier = hasChosenHeat && businessChoice !== null && networkChoice !== null && communityTags.length > 0;
  const liveQualifierSignals = [
    businessChoice ? quickLabelMap[businessChoice] : null,
    networkChoice ? quickLabelMap[networkChoice] : null,
    ...communityTags.slice(0, 2).map((id) => quickLabelMap[id]),
  ].filter(Boolean) as string[];
  const profileQualifier = profileContact ? qualifierStore[profileContact.id] : undefined;
  const profileHeat = profileQualifier?.heat ?? "tiede";
  const profileHistory = profileContact ? historyEntries.filter((entry) => entry.contactId === profileContact.id) : [];
  const profileLastSent = profileHistory.find((entry) => entry.sent) ?? null;
  const profileDaysSinceLastSent = profileContact ? 30 + Number(profileContact.id.replace("d", "")) * 17 : 0;
  const profileVitality = Math.max(0, Math.min(100, 100 - Math.round((profileDaysSinceLastSent / 220) * 100)));
  const profileVigilanceAlert =
    profileQualifier &&
    (profileQualifier.heat === "brulant" || profileQualifier.businessChoice === "ideal-client" || profileQualifier.networkChoice === "opens-doors") &&
    profileDaysSinceLastSent > 90;

  function adnBadgeClass(label: string) {
    const lower = label.toLowerCase();
    if (lower.includes("inconnu")) return "bg-slate-200 text-slate-800";
    if (lower.includes("decideur") || lower.includes("budget") || lower.includes("institutionnel")) return "bg-blue-100 text-blue-900";
    if (lower.includes("connecteur") || lower.includes("influenceur") || lower.includes("prescripteur")) return "bg-violet-100 text-violet-900";
    return "bg-emerald-100 text-emerald-900";
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
    setQualifierHeat(null);
    setHasChosenHeat(false);
    setQualifierStep(1);
    setBusinessChoice(null);
    setNetworkChoice(null);
    setCommunityTags([]);
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
    }, 5200);
    return () => clearTimeout(timer);
  }, [qualificationPivot]);

  useEffect(() => {
    function flushPendingTransition() {
      if (!pendingTransition || !pendingFinalizeAction) return;
      setTransitionScreen(pendingTransition);
      setTimeout(() => setTransitionScreen(null), 3200);
      setShowProgressCheck(true);
      setTimeout(() => setShowProgressCheck(false), 650);
      finalizeAction(pendingFinalizeAction, 3000, {
        countAsSent: true,
        sentInHistory: true,
        stayOnCurrentContact: Boolean(pendingReturnProfileContactId),
        returnToProfileContactId: pendingReturnProfileContactId,
      });
      setPendingTransition(null);
      setPendingFinalizeAction(null);
      setPendingReturnProfileContactId(null);
      setActionFromProfileContactId(null);
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
  }, [pendingTransition, pendingFinalizeAction, pendingReturnProfileContactId]);

  function actionLabel(action: Exclude<DailyCategory, "qualifier">) {
    if (action === "eclaireur") return "Eclaireur";
    if (action === "package") return "Partage Croise";
    if (action === "exclients") return "Ex-Clients";
    return "Passer";
  }

  function scrollIntoViewSmooth(ref: React.RefObject<HTMLDivElement | null>) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function getEstimatedGain(
    business: (typeof BUSINESS_OPTIONS)[number]["id"] | null,
    network: (typeof NETWORK_OPTIONS)[number]["id"] | null,
    community: Array<(typeof COMMUNITY_OPTIONS)[number]["id"]>,
  ): "Faible" | "Moyen" | "Eleve" {
    const businessScore = BUSINESS_OPTIONS.find((option) => option.id === business)?.score ?? 0;
    const networkScore = NETWORK_OPTIONS.find((option) => option.id === network)?.score ?? 0;
    const communityScore = community.reduce(
      (sum, id) => sum + (COMMUNITY_OPTIONS.find((option) => option.id === id)?.score ?? 0),
      0,
    );
    const score = businessScore + networkScore + communityScore;
    if (score <= 1) return "Faible";
    if (score <= 4) return "Moyen";
    return "Eleve";
  }

  function gainTone(label: "Faible" | "Moyen" | "Eleve" | "?") {
    if (label === "Eleve") return "from-emerald-400/40 to-cyan-300/30 border-emerald-300/50 text-emerald-100";
    if (label === "Moyen") return "from-amber-400/35 to-orange-300/30 border-amber-300/50 text-amber-100";
    if (label === "Faible") return "from-slate-400/30 to-slate-500/20 border-slate-300/45 text-slate-100";
    return "from-indigo-400/25 to-slate-400/20 border-indigo-200/40 text-indigo-100";
  }

  function createTransitionPayload(action: Exclude<DailyCategory, "qualifier">, mode: "sent" | "saved" = "sent") {
    const nextStep = Math.min(10, done + 1);
    const points = action === "eclaireur" ? 5 : action === "package" ? 4 : action === "exclients" ? 3 : 1;
    const encouragements =
      mode === "sent"
        ? [
            `Message envoye a ${current.name.split(" ")[0]} ! +${points} points pour ta Mini-Agence. 🚀`,
            `${current.name.split(" ")[0]} active ! +${points} points pour l equipe.`,
            `Bien joue, +${points} points dans ta sphere business.`,
          ]
        : [
            `Aucun message envoye a ${current.name.split(" ")[0]}. Fiche memorisee. 🗂️`,
            `Valide sans envoi: ${current.name.split(" ")[0]} est ajoute a ton historique.`,
            `${actionLabel(action)} prepare sans envoi. Tu pourras relancer au bon moment.`,
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

  function finalizeAction(
    action: Exclude<DailyCategory, "qualifier">,
    advanceDelay = 200,
    options: { countAsSent?: boolean; sentInHistory?: boolean; stayOnCurrentContact?: boolean; returnToProfileContactId?: string | null } = {},
  ) {
    setSelectedAction(action);
    const countAsSent = options.countAsSent ?? true;
    const sentInHistory = options.sentInHistory ?? countAsSent;
    const stayOnCurrentContact = options.stayOnCurrentContact ?? false;
    const returnToProfileContactId = options.returnToProfileContactId ?? null;
    if (countAsSent && (action === "eclaireur" || action === "package" || action === "exclients")) {
      setSentCount((v) => v + 1);
    }
    setShowReward(true);
    setSuccessPulse(true);
    setTimeout(() => setShowReward(false), 900);
    setTimeout(() => setSuccessPulse(false), 450);
    setTimeout(() => {
      const now = new Date();
      const currentQualifier = qualifierStore[current.id];
      const summaryBusiness = currentQualifier?.businessChoice ? quickLabelMap[currentQualifier.businessChoice] : "";
      const summaryNetwork = currentQualifier?.networkChoice ? quickLabelMap[currentQualifier.networkChoice] : "";
      const summaryCommunity = (currentQualifier?.communityTags ?? []).map((id) => quickLabelMap[id]).slice(0, 1);
      setHistoryEntries((prev) => [
        {
          contactId: current.id,
          name: current.name,
          action,
          at: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
          tagsSummary: [summaryBusiness, summaryNetwork, ...summaryCommunity]
            .filter(Boolean)
            .join(" • "),
          sent: sentInHistory,
        },
        ...prev,
      ].slice(0, 50));
      if (!stayOnCurrentContact) {
        setIndex((v) => Math.min(CONTACTS.length, v + 1));
      }
      if (returnToProfileContactId) {
        setProfileContactId(returnToProfileContactId);
        setShowContactProfile(true);
      }
      setSelectedAction(null);
    }, advanceDelay);
  }

  function triggerAction(action: DailyCategory) {
    if (launchingAction) return;
    if (action === "passer") {
      finalizeAction(action);
      return;
    }
    if (action === "eclaireur" || action === "package" || action === "exclients") {
      setLaunchingAction(action);
      setTimeout(() => {
        setLaunchingAction(null);
        const nextDraft = buildTemplate(action, current);
        setSelectedAction(action);
        setDraftMessage(nextDraft);
        setShowTemplateModal(true);
      }, 1200);
      return;
    }
    const nextDraft = buildTemplate(action, current);
    setSelectedAction(action);
    if (action === "qualifier") {
      setQualifierHeat(null);
      setHasChosenHeat(false);
      setQualifierStep(1);
      setBusinessChoice(null);
      setNetworkChoice(null);
      setCommunityTags([]);
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
      setTimeout(() => setTransitionScreen(null), 3200);
      setShowProgressCheck(true);
      setTimeout(() => setShowProgressCheck(false), 650);
      finalizeAction(action, 3000, {
        countAsSent: true,
        sentInHistory: true,
        stayOnCurrentContact: Boolean(actionFromProfileContactId),
        returnToProfileContactId: actionFromProfileContactId,
      });
      setActionFromProfileContactId(null);
      return;
    }
    setPendingTransition(payload);
    setPendingFinalizeAction(action);
    setPendingReturnProfileContactId(actionFromProfileContactId);
  }

  function saveQualifierAndReturn() {
    const primaryTag =
      (businessChoice ? quickLabelMap[businessChoice] : undefined) ??
      (networkChoice ? quickLabelMap[networkChoice] : undefined) ??
      (communityTags[0] ? quickLabelMap[communityTags[0]] : undefined) ??
      "❓ Inconnu";
    const firstName = current.name.split(" ")[0];
    const estimatedGain = getEstimatedGain(businessChoice, networkChoice, communityTags);

    setQualifierStore((prev) => ({
      ...prev,
      [current.id]: {
        heat: qualifierHeat ?? "tiede",
        businessChoice,
        networkChoice,
        communityTags,
        estimatedGain,
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
        businessChoice: null,
        networkChoice: null,
        communityTags: [],
        estimatedGain: "Faible",
      },
    }));
    setShowTemplateModal(false);
    setSelectedAction(null);
    setSoftLearningHint("Profil peu renseigne: sois le premier a le qualifier !");
    setTimeout(() => setSoftLearningHint(""), 2200);
  }

  useEffect(() => {
    if (qualifierStep === 4 && canSaveQualifier) {
      scrollIntoViewSmooth(saveSectionRef);
    }
  }, [qualifierStep, canSaveQualifier]);

  function setLastRewardForQualifier() {
    setShowReward(true);
    setTimeout(() => setShowReward(false), 700);
  }

  function modalTitle(action: DailyCategory | null) {
    if (action === "eclaireur") return "Script Eclaireur";
    if (action === "package") return "Script Partage Croise";
    if (action === "exclients") return "Script Ex-Clients";
    if (action === "qualifier") return "Qualifier la fiche";
    return "Template";
  }

  function toggleFavorite(contactId: string) {
    setFavoriteIds((prev) => (prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]));
  }

  function openContactProfile(contactId: string) {
    setProfileContactId(contactId);
    setShowProfileActions(false);
    setShowContactProfile(true);
    setShowSearchPanel(false);
  }

  function startActionFromProfile(action: Exclude<DailyCategory, "passer" | "qualifier">) {
    if (!profileContact) return;
    const nextIndex = CONTACTS.findIndex((contact) => contact.id === profileContact.id);
    if (nextIndex >= 0) setIndex(nextIndex);
    setActionFromProfileContactId(profileContact.id);
    setShowContactProfile(false);
    setShowSearchPanel(false);
    const nextDraft = buildTemplate(action, profileContact);
    setSelectedAction(action);
    setDraftMessage(nextDraft);
    setShowTemplateModal(true);
  }

  function editProfileQualification() {
    if (!profileContact) return;
    const nextIndex = CONTACTS.findIndex((contact) => contact.id === profileContact.id);
    if (nextIndex >= 0) setIndex(nextIndex);
    setShowContactProfile(false);
    setShowSearchPanel(false);
    setTimeout(() => triggerAction("qualifier"), 60);
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

            {scanDone && scanBurst && (
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
                <p className="text-2xl font-black text-cyan-100 tabular-nums">{scanDone ? 304 : liveProfiles}</p>
                <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-white/75">profils actifs</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-center">
                <p className="text-2xl font-black text-indigo-100 tabular-nums">{scanDone ? 488 : liveLocals}</p>
                <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-white/75">contacts locaux</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-center">
                <p className="text-2xl font-black text-orange-100 tabular-nums">{scanDone ? 112 : liveHotSignals}</p>
                <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-white/75">signaux chauds</p>
              </div>
            </div>

            {scanDone && (
              <>
                <p className="mt-4 rounded-xl bg-emerald-400/15 px-3 py-2 text-sm text-emerald-100">
                  Scan termine: {totalScanned} contacts disponibles.
                </p>
                <p className="mt-2 text-xs font-black text-cyan-100">Ton reseau est une mine d or: 112 opportunites t attendent ce matin.</p>
              </>
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
      <div className="mx-auto max-w-6xl px-4 pt-14 sm:pt-5 pb-20">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">S18 SCAN</p>
              <h1 className="mt-1 text-lg sm:text-2xl font-black">Ma Mini-Agence • MON Radar Quotidien</h1>
              <p className="mt-0.5 text-[11px] text-white/70">{sentCount} messages envoyes aujourd hui</p>
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

        <div className={`mt-4 ${done >= 10 ? "grid gap-4 lg:grid-cols-[1.15fr_0.85fr]" : "flex justify-center"}`}>
          <section className={`rounded-3xl border border-white/10 bg-white/5 p-3 sm:p-4 backdrop-blur-xl ${done >= 10 ? "" : "w-full max-w-3xl"}`}>
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
              <div className="flex items-center gap-3">
                <div
                  className={`h-14 w-14 rounded-full bg-gradient-to-br ${sourceRing} p-[2px] shadow-[0_0_28px_rgba(56,189,248,0.35)]`}
                  style={{ boxShadow: heatScore >= 90 ? "0 0 34px rgba(251,146,60,0.65)" : undefined }}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0D132D] text-xl font-black">
                    {current.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-black leading-tight">{current.name}</p>
                  <p className="text-sm text-white/70">📍 {current.city}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {adnPopey.slice(0, 2).map((entry) => (
                      <span key={entry.label} className={`rounded-full px-2 py-1 text-[10px] font-black ${adnBadgeClass(entry.label)}`}>
                        {entry.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 text-center">
                <p className="text-xl sm:text-2xl font-black">Choisis comment activer {current.name.split(" ")[0]} :</p>
              </div>

              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={() => triggerAction("eclaireur")}
                  disabled={!isQualified}
                  className={`relative overflow-hidden h-20 rounded-2xl border border-amber-300/45 bg-gradient-to-r from-amber-400/45 to-orange-400/35 text-amber-50 shadow-[0_18px_34px_-18px_rgba(251,191,36,0.95)] ${
                    isQualified && actionGlowContactId === current.id ? "animate-pulse ring-2 ring-amber-300/40" : ""
                  } ${launchingAction === "eclaireur" ? "scale-[1.03] ring-4 ring-amber-200/65" : ""}`}
                >
                  {launchingAction === "eclaireur" && (
                    <>
                      <motion.span
                        initial={{ opacity: 1, scale: 0.25 }}
                        animate={{ opacity: 0, scale: 4.8 }}
                        transition={{ duration: 1.05, ease: "easeOut" }}
                        className="pointer-events-none absolute inset-[-18%] rounded-xl bg-[radial-gradient(circle,rgba(255,255,255,0.98)_0%,rgba(254,240,138,0.92)_22%,rgba(251,146,60,0.55)_42%,rgba(251,191,36,0.15)_66%,transparent_78%)]"
                      />
                      <motion.span
                        initial={{ opacity: 0, scale: 0.35 }}
                        animate={{ opacity: [0, 1, 0], scale: [0.35, 1.45, 2.1] }}
                        transition={{ duration: 1.1 }}
                        className="pointer-events-none absolute inset-0 flex items-center justify-center text-2xl"
                      >
                        ✨💥
                      </motion.span>
                      <motion.span
                        initial={{ x: -220, opacity: 0 }}
                        animate={{ x: 280, opacity: [0, 1, 0] }}
                        transition={{ duration: 0.9, ease: "easeInOut" }}
                        className="pointer-events-none absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/80 to-transparent blur-sm"
                      />
                    </>
                  )}
                  <span className="block text-base font-black uppercase tracking-wide">✨ Eclaireur</span>
                  <span className="mt-0.5 block text-[11px] font-semibold text-amber-100/90">Apport d affaire & Commission</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerAction("package")}
                  disabled={!isQualified}
                  className={`relative overflow-hidden h-20 rounded-2xl border border-fuchsia-300/35 bg-gradient-to-r from-violet-500/30 to-fuchsia-500/25 text-fuchsia-100 ${
                    isQualified && actionGlowContactId === current.id ? "animate-pulse ring-2 ring-fuchsia-300/35" : ""
                  } ${launchingAction === "package" ? "scale-[1.03] ring-4 ring-fuchsia-200/65" : ""}`}
                >
                  {launchingAction === "package" && (
                    <>
                      <motion.span
                        initial={{ opacity: 1, scale: 0.25 }}
                        animate={{ opacity: 0, scale: 4.8 }}
                        transition={{ duration: 1.05, ease: "easeOut" }}
                        className="pointer-events-none absolute inset-[-18%] rounded-xl bg-[radial-gradient(circle,rgba(255,255,255,0.98)_0%,rgba(196,181,253,0.92)_22%,rgba(217,70,239,0.55)_42%,rgba(168,85,247,0.15)_66%,transparent_78%)]"
                      />
                      <motion.span
                        initial={{ opacity: 0, scale: 0.35 }}
                        animate={{ opacity: [0, 1, 0], scale: [0.35, 1.45, 2.1] }}
                        transition={{ duration: 1.1 }}
                        className="pointer-events-none absolute inset-0 flex items-center justify-center text-2xl"
                      >
                        ✨💥
                      </motion.span>
                      <motion.span
                        initial={{ x: -220, opacity: 0 }}
                        animate={{ x: 280, opacity: [0, 1, 0] }}
                        transition={{ duration: 0.9, ease: "easeInOut" }}
                        className="pointer-events-none absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/80 to-transparent blur-sm"
                      />
                    </>
                  )}
                  <span className="block text-base font-black uppercase tracking-wide">🧩 Partage Croise</span>
                  <span className="mt-0.5 block text-[11px] font-semibold text-fuchsia-100/90">Proposition de service</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerAction("exclients")}
                  disabled={!isQualified}
                  className={`relative overflow-hidden h-20 rounded-2xl border border-cyan-300/30 bg-cyan-500/12 text-cyan-100 ${
                    isQualified && actionGlowContactId === current.id ? "animate-pulse ring-2 ring-cyan-300/35" : ""
                  } ${launchingAction === "exclients" ? "scale-[1.03] ring-4 ring-cyan-200/65" : ""}`}
                >
                  {launchingAction === "exclients" && (
                    <>
                      <motion.span
                        initial={{ opacity: 1, scale: 0.25 }}
                        animate={{ opacity: 0, scale: 4.8 }}
                        transition={{ duration: 1.05, ease: "easeOut" }}
                        className="pointer-events-none absolute inset-[-18%] rounded-xl bg-[radial-gradient(circle,rgba(255,255,255,0.98)_0%,rgba(103,232,249,0.92)_22%,rgba(34,211,238,0.55)_42%,rgba(56,189,248,0.15)_66%,transparent_78%)]"
                      />
                      <motion.span
                        initial={{ opacity: 0, scale: 0.35 }}
                        animate={{ opacity: [0, 1, 0], scale: [0.35, 1.45, 2.1] }}
                        transition={{ duration: 1.1 }}
                        className="pointer-events-none absolute inset-0 flex items-center justify-center text-2xl"
                      >
                        ✨💥
                      </motion.span>
                      <motion.span
                        initial={{ x: -220, opacity: 0 }}
                        animate={{ x: 280, opacity: [0, 1, 0] }}
                        transition={{ duration: 0.9, ease: "easeInOut" }}
                        className="pointer-events-none absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/80 to-transparent blur-sm"
                      />
                    </>
                  )}
                  <span className="block text-base font-black uppercase tracking-wide">📣 Ex-Clients (News)</span>
                  <span className="mt-0.5 block text-[11px] font-semibold text-cyan-100/90">Veille et relance</span>
                </button>
                {!isQualified && (
                  <p className="text-center text-[11px] font-black uppercase tracking-wide text-emerald-100/85">
                    Qualification requise d abord
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => finalizeAction("passer")}
                className="mt-3 w-full text-center text-sm text-white/70 underline underline-offset-2"
              >
                Passer au contact suivant
              </button>
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
                    {entry.sent ? "Envoye" : "Valide sans envoi"} • {actionLabel(entry.action)} • {entry.at}
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
                        openContactProfile(contact.id);
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

      {showContactProfile && profileContact && (
        <div className="fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm flex items-start justify-center px-4 pt-12 pb-6">
          <section className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0E1430] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Fiche contact • Loupe</p>
              <button type="button" onClick={() => setShowContactProfile(false)} className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs">✕</button>
            </div>

            <div className="mt-3 rounded-2xl border border-white/15 bg-black/25 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-16 w-16 rounded-full bg-gradient-to-br ${
                      profileHeat === "brulant" ? "from-orange-300 via-rose-300 to-amber-300" : profileHeat === "froid" ? "from-cyan-300 via-blue-300 to-indigo-300" : "from-amber-300 via-yellow-300 to-orange-300"
                    } p-[2px]`}
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0D132D] text-2xl font-black">
                      {profileContact.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black">{profileContact.name}</p>
                    <p className="text-sm text-white/75">{profileContact.companyHint} • 📍 {profileContact.city}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileActions((prev) => !prev)}
                  className="rounded-xl border border-cyan-300/40 bg-cyan-400/15 px-3 py-2 text-xs font-black text-cyan-100"
                >
                  ⚡ Demarrer une action
                </button>
              </div>
              {showProfileActions && (
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <button type="button" onClick={() => startActionFromProfile("eclaireur")} className="h-10 rounded-xl bg-amber-400/25 text-xs font-black">✨ Eclaireur</button>
                  <button type="button" onClick={() => startActionFromProfile("package")} className="h-10 rounded-xl bg-fuchsia-400/25 text-xs font-black">🧩 Pack Croise</button>
                  <button type="button" onClick={() => startActionFromProfile("exclients")} className="h-10 rounded-xl bg-cyan-400/25 text-xs font-black">📣 News</button>
                </div>
              )}
            </div>

            <div className="mt-3 rounded-2xl border border-white/15 bg-black/25 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">ADN & Qualification</p>
                <button type="button" onClick={editProfileQualification} className="text-xs underline underline-offset-2 text-cyan-100">Editer</button>
              </div>
              <p className="mt-2 text-sm font-black">Temperature actuelle: {profileHeat === "brulant" ? "🔥 Brulant" : profileHeat === "froid" ? "🧊 Froid" : "⚡ Tiede"}</p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-white/70">Mes Qualifications</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(profileQualifier
                  ? [profileQualifier.businessChoice, profileQualifier.networkChoice, ...profileQualifier.communityTags]
                  : []
                )
                  .filter(Boolean)
                  .map((id) => (
                    <span key={`mine-${String(id)}`} className="rounded-full bg-cyan-300/20 px-2 py-1 text-xs font-black text-cyan-100">
                      {quickLabelMap[String(id)]}
                    </span>
                  ))}
                {!profileQualifier && <span className="text-xs text-white/70">Aucune qualification perso.</span>}
              </div>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-white/70">Consensus communautaire</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {adnPopey.map((entry) => (
                  <span key={`consensus-${entry.label}`} className={`rounded-full px-2 py-1 text-xs font-black ${adnBadgeClass(entry.label)}`}>
                    {entry.label} x{entry.count + 1}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-white/15 bg-black/25 p-3">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Historique & Memoire</p>
              <div className="mt-2 space-y-2 text-sm">
                <div className="rounded-xl bg-white/5 px-3 py-2">• Ajoute lors de "{profileContact.capsule}"</div>
                <div className="rounded-xl bg-white/5 px-3 py-2">
                  • Derniere action: {profileHistory[0] ? `${actionLabel(profileHistory[0].action)} ${profileHistory[0].sent ? "envoye" : "valide sans envoi"} a ${profileHistory[0].at}` : "Aucune action enregistree"}
                </div>
                <div className="rounded-xl bg-white/5 px-3 py-2">• Evolution: {profileHeat === "brulant" ? "Passe de Tiede a Brulant lors de la derniere qualification" : "Statut stable"}</div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-orange-300/30 bg-orange-400/10 p-3">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-orange-100">Statut de vigilance</p>
              <p className="mt-1 text-sm">Dernier contact: il y a {profileDaysSinceLastSent} jours</p>
              <p className="text-sm">Etat de la relation: {profileVitality < 35 ? "En train de refroidir 🧊" : profileVitality < 65 ? "A surveiller 👀" : "Active ✅"}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-300 to-emerald-300" style={{ width: `${profileVitality}%` }} />
              </div>
              {profileVigilanceAlert && (
                <p className="mt-2 text-sm font-black text-orange-100">
                  ⚠️ Opportunite en sommeil: en ne le relancant pas ce mois-ci, tu laisses potentiellement 3 opportunites d affaires a tes concurrents.
                </p>
              )}
              <button
                type="button"
                onClick={() => setShowProfileActions(true)}
                className="mt-2 h-10 w-full rounded-xl bg-gradient-to-r from-orange-300 to-amber-300 text-xs font-black uppercase tracking-wide text-[#2B1E0A]"
              >
                ⚡️ Reveiller le contact
              </button>
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
              <motion.div
                key={`qualifier-hero-${current.id}`}
                initial={{ y: 10, scale: 0.98, boxShadow: "0 0 0 rgba(0,0,0,0)" }}
                animate={{
                  y: [10, -4, 2, -2, 0],
                  scale: [0.98, 1.01, 1],
                  boxShadow: [
                    "0 0 24px rgba(251,146,60,0.45)",
                    "0 0 32px rgba(249,115,22,0.4)",
                    "0 18px 40px -22px rgba(34,211,238,0.75)",
                  ],
                }}
                transition={{ duration: 2.8, ease: "easeInOut" }}
                className="relative mt-3 overflow-hidden rounded-[20px] border border-cyan-300/25 bg-gradient-to-br from-cyan-500/18 via-[#0E1838] to-[#0A1130] p-3 shadow-[0_18px_40px_-22px_rgba(34,211,238,0.75)]"
              >
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[20px] bg-gradient-to-br from-orange-400/40 via-rose-400/30 to-transparent"
                  initial={{ opacity: 0.85 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 2.6, ease: "easeOut" }}
                />
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
                  <motion.div
                    key={`hero-gain-${livePotentialLabel}`}
                    initial={{ scale: 0.9, opacity: 0.4 }}
                    animate={{ scale: [1, 1.04, 1], opacity: 1 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className={`rounded-xl border bg-gradient-to-r px-3 py-2 text-center shadow-[0_18px_36px_-22px_rgba(16,185,129,0.8)] ${gainTone(livePotentialLabel)}`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.12em]">💰 Gain potentiel</p>
                    <p className="mt-0.5 text-base font-black">🔥 {livePotentialLabel}</p>
                  </motion.div>
                </div>

                <div className="mt-3 h-px bg-white/15" />

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {liveQualifierSignals.length > 0 ? (
                    liveQualifierSignals.map((signal) => (
                      <span key={signal} className="rounded-lg bg-cyan-300/15 px-2 py-1 text-xs font-black text-cyan-100">
                        🧩 {signal}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-lg bg-slate-300/15 px-2 py-1 text-xs font-black text-slate-100">
                      ❓ Choisis des signaux communautaires
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs italic text-white/75">🤝 Memoire: {current.capsule}</p>
              </motion.div>
            )}
            {selectedAction === "qualifier" ? (
              <div className="mt-3 space-y-3">
                <div className="rounded-2xl border border-white/15 bg-black/25 p-3">
                  <p className="text-[12px] font-black uppercase tracking-[0.14em] text-cyan-100">🌡 Temperature du contact</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQualifierHeat("froid");
                        if (!hasChosenHeat) {
                          setHasChosenHeat(true);
                          setQualifierStep(2);
                          setTimeout(() => scrollIntoViewSmooth(businessSectionRef), 180);
                        }
                      }}
                      className={`h-11 rounded-xl text-sm font-black ${qualifierHeat === "froid" ? "bg-cyan-300 text-[#13253D] ring-2 ring-cyan-200/60" : "bg-white/10 text-white/80"}`}
                    >
                      ❄️ Froid
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQualifierHeat("tiede");
                        if (!hasChosenHeat) {
                          setHasChosenHeat(true);
                          setQualifierStep(2);
                          setTimeout(() => scrollIntoViewSmooth(businessSectionRef), 180);
                        }
                      }}
                      className={`h-11 rounded-xl text-sm font-black ${qualifierHeat === "tiede" ? "bg-amber-300 text-[#2C230E] ring-2 ring-amber-200/60" : "bg-white/10 text-white/80"}`}
                    >
                      ⚡ Tiede
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQualifierHeat("brulant");
                        if (!hasChosenHeat) {
                          setHasChosenHeat(true);
                          setQualifierStep(2);
                          setTimeout(() => scrollIntoViewSmooth(businessSectionRef), 180);
                        }
                      }}
                      className={`h-11 rounded-xl text-sm font-black ${qualifierHeat === "brulant" ? "bg-orange-400 text-[#321A0E] ring-2 ring-orange-200/60" : "bg-white/10 text-white/80"}`}
                    >
                      🔥 Brulant
                    </button>
                  </div>
                </div>

                <div
                  ref={businessSectionRef}
                  className={`rounded-2xl border border-white/15 bg-black/25 p-3 transition-all duration-300 ${qualifierStep >= 2 ? "opacity-100" : "opacity-35 pointer-events-none"}`}
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">💰 Business - 1 choix</p>
                  <p className="mt-1 text-xs text-white/70">Est-ce que ca peut me rapporter de l argent ?</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {BUSINESS_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setBusinessChoice(option.id);
                          if (qualifierStep < 3) {
                            setQualifierStep(3);
                            setTimeout(() => scrollIntoViewSmooth(networkSectionRef), 180);
                          }
                        }}
                        className={`h-10 rounded-xl px-2 text-[11px] font-black ${
                          businessChoice === option.id ? "bg-emerald-300 text-emerald-950 ring-2 ring-emerald-200/70" : "bg-white/10 text-white/85"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  ref={networkSectionRef}
                  className={`rounded-2xl border border-white/15 bg-black/25 p-3 transition-all duration-300 ${qualifierStep >= 3 ? "opacity-100" : "opacity-35 pointer-events-none"}`}
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">🤝 Reseau - 1 choix</p>
                  <p className="mt-1 text-xs text-white/70">Est-ce qu il peut m apporter quelqu un ?</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {NETWORK_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setNetworkChoice(option.id);
                          if (qualifierStep < 4) {
                            setQualifierStep(4);
                            setTimeout(() => scrollIntoViewSmooth(communitySectionRef), 180);
                          }
                        }}
                        className={`h-10 rounded-xl px-2 text-[11px] font-black ${
                          networkChoice === option.id ? "bg-cyan-300 text-cyan-950 ring-2 ring-cyan-200/70" : "bg-white/10 text-white/85"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  ref={communitySectionRef}
                  className={`rounded-2xl border border-white/15 bg-black/25 p-3 transition-all duration-300 ${qualifierStep >= 4 ? "opacity-100" : "opacity-35 pointer-events-none"}`}
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">⚡ Contributions rapides - multi</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {COMMUNITY_OPTIONS.map((option) => {
                      const active = communityTags.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setCommunityTags((prev) => (prev.includes(option.id) ? prev.filter((id) => id !== option.id) : [...prev, option.id]))
                          }
                          className={`rounded-full px-3 py-2 text-[11px] font-black transition ${
                            active ? "bg-violet-300 text-violet-950 ring-2 ring-violet-200/70" : "bg-white/85 text-[#1B1F34]"
                          }`}
                        >
                          {active ? "✅ " : ""}{option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div ref={saveSectionRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTemplateModal(false);
                      saveQualifierAndReturn();
                    }}
                    disabled={!canSaveQualifier}
                    className="h-11 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-300 text-xs font-black uppercase tracking-wide text-[#11252C] disabled:opacity-35"
                  >
                    Enregistrer la fiche
                  </button>
                </div>
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
                <p className="mt-2 inline-flex items-center rounded-lg bg-cyan-400/15 px-2 py-1 text-xs font-black text-cyan-100">
                  🎯 Base sur le profil: {adnPopey[0]?.label ?? "❓ Inconnu"}
                </p>
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
                    const payload = createTransitionPayload(action, "saved");
                    setTransitionScreen(payload);
                    setTimeout(() => setTransitionScreen(null), 3200);
                    setShowProgressCheck(true);
                    setTimeout(() => setShowProgressCheck(false), 650);
                    setShowTemplateModal(false);
                    finalizeAction(action, 3000, {
                      countAsSent: false,
                      sentInHistory: false,
                      stayOnCurrentContact: Boolean(actionFromProfileContactId),
                      returnToProfileContactId: actionFromProfileContactId,
                    });
                    setActionFromProfileContactId(null);
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
