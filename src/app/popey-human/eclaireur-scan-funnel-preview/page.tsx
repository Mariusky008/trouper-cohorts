"use client";

import { useEffect, useMemo, useState } from "react";

type MainTab = "daily" | "contact" | "gains" | "pros";
type SwipeStatus = "new" | "masked_90d" | "qualified" | "alert";
type ReplyStatus = "waiting" | "ok" | "no";
type FunnelStep = "match" | "message";

type Contact = {
  id: string;
  name: string;
  phone: string;
  city: string;
};

type ContactMeta = {
  status: SwipeStatus;
  tags: string[];
  maskedUntil?: string;
};

type Pro = {
  id: string;
  name: string;
  category: string;
  city: string;
  rating: number;
  commissionRate: number;
  trade: string;
  needs: string[];
  company: string;
  companyAddress: string;
  googleReviews: number;
  photoInitials: string;
};

const CONTACTS: Contact[] = [
  { id: "c1", name: "Julien M.", phone: "06 12 78 44 01", city: "Dax" },
  { id: "c2", name: "Claire R.", phone: "06 90 11 43 29", city: "Dax" },
  { id: "c3", name: "Karim B.", phone: "06 31 77 09 11", city: "Saint-Paul-les-Dax" },
  { id: "c4", name: "Laura T.", phone: "06 40 80 42 51", city: "Dax" },
  { id: "c5", name: "Nicolas G.", phone: "06 58 12 09 62", city: "Narrosse" },
  { id: "c6", name: "Farah K.", phone: "06 22 63 17 98", city: "Dax" },
  { id: "c7", name: "Mickael P.", phone: "06 73 62 18 44", city: "Dax" },
  { id: "c8", name: "Sonia V.", phone: "06 84 90 23 18", city: "Dax" },
  { id: "c9", name: "Hugo L.", phone: "06 18 22 31 78", city: "Narrosse" },
  { id: "c10", name: "Nadine C.", phone: "06 49 20 31 41", city: "Dax" },
  { id: "c11", name: "Jean-Mi B.", phone: "06 91 22 31 44", city: "Dax" },
  { id: "c12", name: "Mme Dupuis", phone: "06 85 31 29 17", city: "Saint-Paul-les-Dax" },
  { id: "c13", name: "Yann G.", phone: "06 44 31 70 28", city: "Dax" },
  { id: "c14", name: "Olivia N.", phone: "06 16 42 63 45", city: "Dax" },
  { id: "c15", name: "Theo D.", phone: "06 54 39 47 10", city: "Dax" },
  { id: "c16", name: "Aurelie F.", phone: "06 77 19 20 25", city: "Dax" },
  { id: "c17", name: "Romain T.", phone: "06 11 93 44 10", city: "Narrosse" },
  { id: "c18", name: "Nora K.", phone: "06 29 61 17 22", city: "Dax" },
  { id: "c19", name: "Pascal R.", phone: "06 88 40 10 33", city: "Dax" },
  { id: "c20", name: "Lea M.", phone: "06 50 19 36 29", city: "Saint-Paul-les-Dax" },
];

const SPHERES = [
  { id: "logement", icon: "🏠", label: "Logement", description: "Immo, Travaux, Deco, Jardin" },
  { id: "juridique", icon: "⚖️", label: "Juridique & Argent", description: "Banque, Assurances, Notaire, Fiscalite" },
  { id: "bienetre", icon: "🧘", label: "Bien-etre & Sante", description: "Sport, Nutrition, Beauté" },
  { id: "quotidien", icon: "🐾", label: "Vie quotidienne", description: "Animaux, Enfants, Services" },
  { id: "auto", icon: "🚗", label: "Auto & Loisirs", description: "Auto, Voyages, Evenementiel" },
  { id: "business", icon: "💼", label: "Business", description: "Compta, Marketing, Recrutement" },
] as const;

const DIAGNOSTICS: Record<
  string,
  Array<{ id: string; label: string; need: string; trade: string[]; avgCommission: number; teaser: string }>
> = {
  logement: [
    { id: "sell-home", label: "Doit vendre rapidement", need: "Besoin de vendre", trade: ["Agent immo", "Notaire"], avgCommission: 320, teaser: "Vente immo: cycle court, commission souvent rapide." },
    { id: "renov", label: "A des travaux a lancer", need: "Artisan travaux", trade: ["Artisan travaux", "Agrandissement"], avgCommission: 210, teaser: "Travaux: plusieurs opportunites de recommandation." },
    { id: "buy-home", label: "Veut acheter bientot", need: "Besoin d acheter", trade: ["Courtier pret", "Agent immo"], avgCommission: 290, teaser: "Achat immo: fort potentiel de mise en relation." },
  ],
  juridique: [
    { id: "optimize", label: "Veut optimiser ses finances", need: "Gestion patrimoine", trade: ["Gestion patrimoine", "Conseil fiscal"], avgCommission: 260, teaser: "Finance: tickets elevés et leads qualifiés." },
    { id: "protect", label: "Doit revoir ses assurances", need: "Assurance", trade: ["Assurance", "Assurance habitation"], avgCommission: 170, teaser: "Assurance: ideal pour convertir par confiance." },
    { id: "inherit", label: "Sujet d heritage", need: "Notaire", trade: ["Notaire", "Gestion patrimoine"], avgCommission: 300, teaser: "Heritage: besoin concret, actionnable rapidement." },
  ],
  bienetre: [
    { id: "kilos", label: "Doit perdre des kilos", need: "Nutritionniste", trade: ["Nutritionniste", "Coach Sportif"], avgCommission: 140, teaser: "Bien-etre: petit ticket mais volume régulier." },
    { id: "sport", label: "Veut se mettre au sport", need: "Coach Sportif", trade: ["Coach Sportif"], avgCommission: 120, teaser: "Sport: conversion facile si relation de confiance." },
    { id: "relax", label: "Besoin de se relaxer", need: "Bien-etre", trade: ["Praticien Bien-etre"], avgCommission: 110, teaser: "Bien-etre: bon levier pour activer des recommandations douces." },
  ],
  quotidien: [
    { id: "dog", label: "Son chien est son amour", need: "Educateur Canin", trade: ["Educateur Canin", "Toiletteur"], avgCommission: 130, teaser: "Animaux: besoin affectif, taux de réponse élevé." },
    { id: "kids", label: "A besoin d une nounou", need: "Nounou", trade: ["Nounou", "Services a la personne"], avgCommission: 180, teaser: "Services famille: besoin urgent, décision rapide." },
    { id: "help", label: "Cherche aide quotidienne", need: "Services a la personne", trade: ["Services a la personne"], avgCommission: 160, teaser: "Aide quotidienne: excellent pour leads réguliers." },
  ],
  auto: [
    { id: "car", label: "Veut vendre sa voiture", need: "Vente auto", trade: ["Vente auto"], avgCommission: 150, teaser: "Auto: opportunite ponctuelle mais concrète." },
    { id: "trip", label: "Prepare un voyage", need: "Voyages", trade: ["Voyages"], avgCommission: 120, teaser: "Voyage: utile pour ouvrir la conversation." },
    { id: "event", label: "Organise un evenement", need: "Evenementiel", trade: ["Evenementiel"], avgCommission: 190, teaser: "Evenementiel: panier moyen intéressant." },
  ],
  business: [
    { id: "accounting", label: "Doit structurer sa boite", need: "Expert-comptable", trade: ["Expert-comptable"], avgCommission: 240, teaser: "Business: fort potentiel sur clients pros." },
    { id: "marketing", label: "Veut plus de clients", need: "Marketing", trade: ["Marketing"], avgCommission: 210, teaser: "Marketing: besoins fréquents, bonnes recurrences." },
    { id: "hiring", label: "Recrute actuellement", need: "Recrutement", trade: ["Recrutement"], avgCommission: 260, teaser: "Recrutement: commission élevée si besoin validé." },
  ],
};

const MAGIC_SEARCH: Array<{ keyword: string; suggestion: string; need: string }> = [
  { keyword: "chocolat", suggestion: "Veut offrir un cadeau gourmand ?", need: "Artisan Chocolatier" },
  { keyword: "voyance", suggestion: "Cherche un accompagnement spirituel ?", need: "Voyance" },
  { keyword: "chien", suggestion: "Son chien est son amour ?", need: "Educateur Canin" },
  { keyword: "maison", suggestion: "Projet immo en preparation ?", need: "Besoin d acheter" },
];
const MOMENTS = [
  "Vient d avoir un enfant",
  "Est en plein divorce",
  "Vient d heriter",
  "Besoin de vendre",
  "Besoin d acheter",
  "Nouveau poste / mutation",
  "Demange bientot",
  "Investir",
  "Autre",
] as const;
const SEGMENTS = [
  { id: "immo", label: "Recherche maison", percent: 5, avgCommission: 275 },
  { id: "sante", label: "Perte de poids / sante", percent: 9, avgCommission: 120 },
  { id: "travaux", label: "Travaux / deco", percent: 12, avgCommission: 180 },
  { id: "finance", label: "Investissement", percent: 4, avgCommission: 320 },
] as const;
const PROS: Pro[] = [
  { id: "p1", name: "Camille Durand", category: "Immo", city: "Dax", rating: 4.8, commissionRate: 12, trade: "Courtier", needs: ["Courtier", "Courtier pret", "Assurance familiale"], company: "Durand Courtage", companyAddress: "12 Rue de la Liberte, Dax", googleReviews: 126, photoInitials: "CD" },
  { id: "p2", name: "Atelier Nova", category: "Travaux", city: "Dax", rating: 4.7, commissionRate: 10, trade: "Artisan travaux", needs: ["Artisan travaux", "Agrandissement"], company: "Atelier Nova", companyAddress: "8 Avenue du Stade, Dax", googleReviews: 94, photoInitials: "AN" },
  { id: "p3", name: "Sante Active", category: "Sante", city: "Dax", rating: 4.6, commissionRate: 8, trade: "Assurance", needs: ["Assurance", "Assurance habitation"], company: "Sante Active Conseil", companyAddress: "4 Rue du Marche, Dax", googleReviews: 81, photoInitials: "SA" },
  { id: "p4", name: "Patrimoine Sud", category: "Finances", city: "Dax", rating: 4.9, commissionRate: 14, trade: "Gestion patrimoine", needs: ["Gestion patrimoine", "Conseil fiscal", "Notaire"], company: "Patrimoine Sud", companyAddress: "21 Boulevard Carnot, Dax", googleReviews: 172, photoInitials: "PS" },
  { id: "p5", name: "Julie Martin", category: "Services", city: "Dax", rating: 4.7, commissionRate: 9, trade: "Nounou", needs: ["Nounou", "Services a la personne"], company: "Julie Services Famille", companyAddress: "6 Rue des Ecoles, Dax", googleReviews: 63, photoInitials: "JM" },
  { id: "p6", name: "Maxime Leroy", category: "Animalier", city: "Dax", rating: 4.8, commissionRate: 11, trade: "Educateur Canin", needs: ["Educateur Canin", "Toiletteur"], company: "CaniCoach Dax", companyAddress: "14 Route de Narrosse, Dax", googleReviews: 88, photoInitials: "ML" },
];
const NEEDS_BY_MOMENT: Record<string, string[]> = {
  "Vient d avoir un enfant": ["Courtier", "Agrandissement", "Assurance familiale"],
  "Est en plein divorce": ["Agent immo", "Notaire", "Courtier"],
  "Vient d heriter": ["Notaire", "Gestion patrimoine", "Agent immo"],
  "Besoin de vendre": ["Agent immo", "Notaire", "Diagnostiqueur"],
  "Besoin d acheter": ["Courtier pret", "Agent immo", "Notaire"],
  "Nouveau poste / mutation": ["Agent immo", "Courtier", "Assurance"],
  "Demange bientot": ["Artisan travaux", "Agent immo", "Assurance habitation"],
  Investir: ["Gestion patrimoine", "Conseil fiscal", "Agent immo"],
  Autre: ["Courtier", "Agent immo", "Conseiller local"],
};
const ALL_NEEDS = Array.from(new Set(Object.values(NEEDS_BY_MOMENT).flat()));

export default function EclaireurScanFunnelPreviewPage() {
  const [introStep, setIntroStep] = useState<"welcome" | "scanning" | "guide" | "done">("welcome");
  const [dailyTutorialStep, setDailyTutorialStep] = useState<0 | 1 | 2 | 3>(0);
  const [tutorialActive, setTutorialActive] = useState(true);
  const [mainTab, setMainTab] = useState<MainTab>("daily");
  const [showProfile, setShowProfile] = useState(false);
  const [funnelStep, setFunnelStep] = useState<FunnelStep | null>(null);
  const [activeContactId, setActiveContactId] = useState(CONTACTS[0].id);
  const [totalContacts] = useState(816);
  const [scanCount, setScanCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [dailyProcessed, setDailyProcessed] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [contactMeta, setContactMeta] = useState<Record<string, ContactMeta>>(() =>
    Object.fromEntries(CONTACTS.map((contact) => [contact.id, { status: "new", tags: [] }])),
  );
  const [surveillanceContactId, setSurveillanceContactId] = useState<string | null>(null);
  const [surveillanceMode, setSurveillanceMode] = useState<"actions" | "funnel">("actions");
  const [selectedSphereId, setSelectedSphereId] = useState<string>(SPHERES[0].id);
  const [selectedDiagnosticId, setSelectedDiagnosticId] = useState<string | null>(null);
  const [magicSearchTerm, setMagicSearchTerm] = useState("");
  const [funnelNeeds, setFunnelNeeds] = useState<string[]>([]);
  const [selectedMoment, setSelectedMoment] = useState<string>(MOMENTS[0]);
  const [selectedNeed, setSelectedNeed] = useState<string>("");
  const [messageDraft, setMessageDraft] = useState("");
  const [reply, setReply] = useState<ReplyStatus>("waiting");
  const [selectedTrade, setSelectedTrade] = useState<string>("Courtier");
  const [selectedProCategory, setSelectedProCategory] = useState<string>("Tous");
  const [selectedProId, setSelectedProId] = useState<string | null>(null);
  const [showProDetailModal, setShowProDetailModal] = useState(false);
  const [featuredProId, setFeaturedProId] = useState<string | null>(null);
  const [showLeadSentModal, setShowLeadSentModal] = useState(false);
  const [swipeAnim, setSwipeAnim] = useState<"none" | "left" | "right" | "up">("none");
  const [lastActionMessage, setLastActionMessage] = useState("");
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [contactResponse, setContactResponse] = useState<Record<string, ReplyStatus>>({});
  const [contactHasMessage, setContactHasMessage] = useState<Record<string, boolean>>({});
  const [contactDispatched, setContactDispatched] = useState<Record<string, boolean>>({});

  const dailyDeckIds = useMemo(() => CONTACTS.slice(0, 20).map((contact) => contact.id), []);
  const currentDailyContact = CONTACTS.find((contact) => contact.id === dailyDeckIds[currentCardIndex]) || null;
  const activeContact = CONTACTS.find((contact) => contact.id === activeContactId) ?? CONTACTS[0];
  const surveillanceContact = CONTACTS.find((contact) => contact.id === surveillanceContactId) ?? null;
  const isColdContact = surveillanceContact ? Number(surveillanceContact.id.replace("c", "")) % 2 === 0 : false;
  const cardThemes = [
    "from-[#1B2430] via-[#1A2D32] to-[#172126]",
    "from-[#261B2B] via-[#1F2236] to-[#1B2630]",
    "from-[#203229] via-[#1C2A3A] to-[#172024]",
    "from-[#312318] via-[#2A1F2D] to-[#1F2530]",
  ];
  const currentCardTheme = cardThemes[currentCardIndex % cardThemes.length];

  const segmentStats = useMemo(
    () =>
      SEGMENTS.map((segment) => {
        const leads = Math.round(totalContacts * (segment.percent / 100));
        const potential = leads * segment.avgCommission;
        return { ...segment, leads, potential };
      }),
    [totalContacts],
  );

  const searchResults = useMemo(
    () =>
      CONTACTS.filter((contact) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return `${contact.name} ${contact.phone} ${contact.city}`.toLowerCase().includes(query);
      }),
    [searchQuery],
  );

  const prosResults = useMemo(
    () =>
      PROS.filter((pro) => {
        if (selectedProCategory === "Tous") return true;
        return pro.category === selectedProCategory;
      }),
    [selectedProCategory],
  );
  const prosByNeed = useMemo(() => {
    const source = PROS.filter((pro) => pro.city === "Dax" || pro.city === activeContact.city);
    if (!selectedNeed) return source;
    return source.filter((pro) => pro.needs.includes(selectedNeed) || pro.trade === selectedNeed);
  }, [activeContact.city, selectedNeed]);
  const featuredPro = PROS.find((pro) => pro.id === featuredProId) ?? null;
  const prospectedCount = 304;
  const localCityCount = 488;
  const hotSignalsCount = 112;

  const kpi = useMemo(() => {
    const metas = Object.values(contactMeta);
    const treated = metas.filter((meta) => meta.status !== "new").length;
    const right = metas.filter((meta) => meta.status === "qualified").length;
    const up = metas.filter((meta) => meta.status === "alert").length;
    const messages = Object.values(contactHasMessage).filter(Boolean).length;
    const repliesOk = Object.values(contactResponse).filter((status) => status === "ok").length;
    const leads = Object.values(contactDispatched).filter(Boolean).length;
    const deals = leads;
    return { treated, right, up, messages, repliesOk, leads, deals };
  }, [contactMeta, contactHasMessage, contactResponse, contactDispatched]);

  const totalPotential = segmentStats.reduce((sum, segment) => sum + segment.potential, 0);
  const qualifiedCount = 140;
  const progressPercent = Math.round((qualifiedCount / totalContacts) * 100);
  const pendingAmount = 1260;
  const validatedAmount = 3820;
  const rejectedAmount = 540;
  const contactsToContact = useMemo(
    () =>
      CONTACTS.filter((contact) => {
        const status = contactMeta[contact.id]?.status;
        return status === "qualified" || status === "alert";
      }),
    [contactMeta],
  );
  const qualifiedWithoutMessage = contactsToContact.filter((contact) => !contactHasMessage[contact.id] && !contactDispatched[contact.id]);
  const waitingContacts = contactsToContact.filter((contact) => contactResponse[contact.id] === "waiting" && !contactDispatched[contact.id]);
  const okToSendContacts = contactsToContact.filter((contact) => contactResponse[contact.id] === "ok" && !contactDispatched[contact.id]);
  const dispatchedContacts = contactsToContact.filter((contact) => contactDispatched[contact.id]);
  const refusedContacts = contactsToContact.filter((contact) => contactResponse[contact.id] === "no");

  const scanProgressPercent = Math.round((scanCount / totalContacts) * 100);
  const scanCompleted = scanCount >= totalContacts;
  const scoutFirstName = "Jean-Philippe";
  const tutorialExpectedAction = tutorialActive ? (["up", "right", "left"][dailyTutorialStep] ?? null) : null;
  const needsForMatch = funnelNeeds.length > 0 ? funnelNeeds : ALL_NEEDS;
  const diagnosticsForSphere = DIAGNOSTICS[selectedSphereId] ?? [];
  const selectedDiagnostic = diagnosticsForSphere.find((diag) => diag.id === selectedDiagnosticId) ?? null;
  const avgSphereCommission =
    diagnosticsForSphere.length > 0
      ? Math.round(diagnosticsForSphere.reduce((sum, diag) => sum + diag.avgCommission, 0) / diagnosticsForSphere.length)
      : null;

  function findSuggestedPro(need: string) {
    const inCity = PROS.filter((pro) => pro.city === "Dax" || pro.city === activeContact.city);
    return (
      inCity.find((pro) => pro.needs.includes(need) || pro.trade === need) ??
      inCity.find((pro) => pro.trade.toLowerCase().includes(need.toLowerCase())) ??
      inCity[0] ??
      PROS[0]
    );
  }

  useEffect(() => {
    if (introStep !== "scanning") return;
    setScanCount(0);
    const increment = Math.max(6, Math.ceil(totalContacts / 80));
    const timer = setInterval(() => {
      setScanCount((prev) => {
        const randomBoost = Math.floor(Math.random() * 4);
        const next = Math.min(totalContacts, prev + increment + randomBoost);
        return next;
      });
    }, 180);
    return () => clearInterval(timer);
  }, [introStep, totalContacts]);

  function updateStatus(contactId: string, status: SwipeStatus, tag?: string) {
    const maskedUntil =
      status === "masked_90d" ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR") : undefined;
    setContactMeta((prev) => {
      const current = prev[contactId] || { status: "new", tags: [] };
      const nextTags = tag && !current.tags.includes(tag) ? [...current.tags, tag] : current.tags;
      return {
        ...prev,
        [contactId]: { status, tags: nextTags, maskedUntil },
      };
    });
  }

  function goNextCard() {
    setDailyProcessed((value) => {
      const next = Math.min(20, value + 1);
      return next;
    });
    setCurrentCardIndex((value) => Math.min(20, value + 1));
  }

  function onUndoLast() {
    if (currentCardIndex <= 0) return;
    const previousCardId = dailyDeckIds[currentCardIndex - 1];
    setCurrentCardIndex((value) => Math.max(0, value - 1));
    setDailyProcessed((value) => Math.max(0, value - 1));
    setContactMeta((prev) => ({
      ...prev,
      [previousCardId]: { status: "new", tags: [] },
    }));
    setLastActionMessage("Derniere action annulee");
  }

  function animateAndThen(direction: "left" | "right" | "up", callback: () => void) {
    setSwipeAnim(direction);
    setTimeout(() => {
      callback();
      setSwipeAnim("none");
    }, 220);
  }

  function onSwipeLeft() {
    if (!currentDailyContact) return;
    if (tutorialExpectedAction && tutorialExpectedAction !== "left") {
      setLastActionMessage("Tutoriel: fais d abord l action indiquee.");
      return;
    }
    animateAndThen("left", () => {
      updateStatus(currentDailyContact.id, "masked_90d");
      setLastActionMessage(`${currentDailyContact.name} masque 90 jours`);
      if (tutorialExpectedAction === "left") {
        setDailyTutorialStep((value) => {
          const next = (value + 1) as 0 | 1 | 2 | 3;
          if (next >= 3) {
            setTutorialActive(false);
            setLastActionMessage("Parfait. Tutoriel termine, tu peux swiper librement.");
          }
          return next;
        });
      }
      goNextCard();
    });
  }

  function onSwipeRight() {
    if (!currentDailyContact) return;
    if (tutorialExpectedAction && tutorialExpectedAction !== "right") {
      setLastActionMessage("Tutoriel: fais d abord l action indiquee.");
      return;
    }
    setSurveillanceContactId(currentDailyContact.id);
    setSurveillanceMode("actions");
    setSelectedSphereId(SPHERES[0].id);
    setSelectedDiagnosticId(null);
    setMagicSearchTerm("");
  }

  function launchSmartFunnel(contactId: string, need: string, businessTag: string, relatedNeeds?: string[]) {
    const contact = CONTACTS.find((item) => item.id === contactId);
    if (!contact) return;
    animateAndThen("right", () => {
      updateStatus(contactId, "qualified", businessTag);
      setSurveillanceContactId(null);
      setActiveContactId(contactId);
      setSelectedMoment("Autre");
      setSelectedNeed(need);
      setFunnelNeeds(relatedNeeds && relatedNeeds.length > 0 ? Array.from(new Set(relatedNeeds)) : [need]);
      setSelectedProId(null);
      setFeaturedProId(null);
      setMessageDraft("");
      setFunnelStep("match");
      setLastActionMessage(`${contact.name} passe en qualification business (${businessTag}).`);
      if (tutorialExpectedAction === "right") {
        setDailyTutorialStep((value) => (value + 1) as 0 | 1 | 2 | 3);
      }
      goNextCard();
    });
  }

  function sendWakeMessage() {
    if (!surveillanceContactId) return;
    const contact = CONTACTS.find((item) => item.id === surveillanceContactId);
    if (!contact) return;
    const digits = contact.phone.replace(/\D+/g, "");
    const whatsappPhone = digits.startsWith("0") ? `33${digits.slice(1)}` : digits;
    const wakeMessage = `Salut ${contact.name.split(" ")[0]}, ca fait un bail ! Je me suis mis a fond dans un reseau d experts sur Dax (Immo, travaux, finance...). Si jamais toi ou un proche cherchez un crack dans un domaine, demande-moi, j ai les meilleurs deals de la ville en ce moment. A plus !`;
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(wakeMessage)}`, "_blank");
    }
    updateStatus(surveillanceContactId, "qualified", "Message reveil");
    setSurveillanceContactId(null);
    setLastActionMessage(`Message de courtoisie lance pour ${contact.name}.`);
    goNextCard();
  }

  function sendContactIntroMessage(contact: Contact) {
    const digits = contact.phone.replace(/\D+/g, "");
    const whatsappPhone = digits.startsWith("0") ? `33${digits.slice(1)}` : digits;
    const introMessage = `Salut ${contact.name.split(" ")[0]}, ca fait un moment ! Je me suis specialise dans la recommandation d experts locaux sur Dax (Immo, travaux, bien-etre...). Si jamais tu as un projet en tete ou un besoin specifique en ce moment, dis-le moi, j ai acces a des offres VIP pour mon entourage. A bientot !`;
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(introMessage)}`, "_blank");
    }
    updateStatus(contact.id, "qualified", "Message prise de contact");
    setLastActionMessage(`Message de prise de contact ouvert pour ${contact.name}.`);
  }

  function informOneContactAboutPro(pro: Pro) {
    const contact = activeContact;
    const digits = contact.phone.replace(/\D+/g, "");
    const whatsappPhone = digits.startsWith("0") ? `33${digits.slice(1)}` : digits;
    const text = `Salut ${contact.name.split(" ")[0]}, si tu as un besoin sur ${pro.trade}, je pense a ${pro.name} (${pro.company}) a ${pro.city}. Tres bon retour client et offres VIP possibles.`;
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(text)}`, "_blank");
    }
    setLastActionMessage(`Info envoyee a ${contact.name} au sujet de ${pro.name}.`);
  }

  function sendFriendToPro(pro: Pro) {
    setActiveContactId(activeContact.id);
    setSelectedProId(pro.id);
    setSelectedTrade(pro.name);
    setMessageDraft(
      `Salut ${activeContact.name.split(" ")[0]}, je te mets en relation avec ${pro.name} (${pro.trade}) a ${pro.city}. C est un pro recommande de mon reseau Popey, je peux lui demander de te contacter.`,
    );
    setFunnelStep("message");
    setMainTab("daily");
    setLastActionMessage(`Passage au message pour envoyer ${activeContact.name} vers ${pro.name}.`);
  }

  function openFunnelForContact(contactId: string) {
    setActiveContactId(contactId);
    setSelectedMoment("Autre");
    setSelectedNeed(ALL_NEEDS[0] ?? "Courtier");
    setFunnelNeeds([]);
    setMessageDraft("");
    setSelectedProId(null);
    setFeaturedProId(null);
    setShowProDetailModal(false);
    setFunnelStep("match");
    setMainTab("daily");
  }

  function onSwipeUp() {
    if (!currentDailyContact) return;
    if (tutorialExpectedAction && tutorialExpectedAction !== "up") {
      setLastActionMessage("Tutoriel: fais d abord l action indiquee.");
      return;
    }
    animateAndThen("up", () => {
      updateStatus(currentDailyContact.id, "alert");
      openFunnelForContact(currentDailyContact.id);
      setLastActionMessage(`Alerte immediate lancee pour ${currentDailyContact.name}`);
      if (tutorialExpectedAction === "up") {
        setDailyTutorialStep((value) => (value + 1) as 0 | 1 | 2 | 3);
      }
      goNextCard();
    });
  }

  function openContactFlowFromQueue(contactId: string) {
    const contact = CONTACTS.find((item) => item.id === contactId);
    if (!contact) return;
    setActiveContactId(contact.id);
    setSelectedMoment("Autre");
    setSelectedNeed(ALL_NEEDS[0] ?? "Courtier");
    setFunnelNeeds([]);
    setSelectedProId(null);
    setFeaturedProId(null);
    setSelectedTrade("Expert local");
    setMessageDraft("");
    setReply("waiting");
    setFunnelStep("match");
    setMainTab("daily");
  }

  function handleAskConsentViaWhatsApp() {
    const digits = activeContact.phone.replace(/\D+/g, "");
    const whatsappPhone = digits.startsWith("0") ? `33${digits.slice(1)}` : digits;
    const encoded = encodeURIComponent(messageDraft);
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/${whatsappPhone}?text=${encoded}`, "_blank");
    }
    setContactHasMessage((prev) => ({ ...prev, [activeContactId]: true }));
    setContactResponse((prev) => ({ ...prev, [activeContactId]: "waiting" }));
    setLastActionMessage(`Message WhatsApp ouvert pour demander l accord a ${activeContact.name}.`);
  }

  function handleConsentAndSendLead() {
    if (!selectedProId) return;
    setContactHasMessage((prev) => ({ ...prev, [activeContactId]: true }));
    setContactResponse((prev) => ({ ...prev, [activeContactId]: "ok" }));
    setContactDispatched((prev) => ({ ...prev, [activeContactId]: true }));
    setLastActionMessage(`Lead envoye a ${selectedTrade} pour ${activeContact.name} !`);
    setFunnelStep(null);
    setShowLeadSentModal(true);
    setShowProDetailModal(false);
  }

  function proceedToMessageWithPro(pro: Pro) {
    setSelectedProId(pro.id);
    setSelectedTrade(pro.name);
    const draft = `Salut ${activeContact.name.split(" ")[0]}, je pense a toi suite a ton contexte "${selectedMoment}". J ai un pro de confiance sur ${pro.trade} a ${activeContact.city}. Tu veux que je lui demande de te contacter ?`;
    setMessageDraft(draft);
    setShowProDetailModal(false);
    setFunnelStep("message");
  }

  return (
    <main className="min-h-screen bg-[#06080A] text-white">
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#06080A]/80 backdrop-blur-xl">
        <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl sm:text-3xl font-black tracking-tight">Daily Scan Popey</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-white/70">20 cartes par jour. Swipe. Qualifie. Convertis.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSearchPanel(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg font-black shadow-[0_10px_22px_-14px_rgba(56,189,248,0.9)]"
              aria-label="Recherche"
            >
              ⌕
            </button>
            <button
              type="button"
              onClick={() => setShowProfile((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-black tracking-wide"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">JP</span>
              <span>Mes infos</span>
            </button>
          </div>
        </header>
      </div>

      {introStep !== "done" && (
        <div className="mx-auto max-w-3xl px-4 py-6 pb-36">
          {introStep === "welcome" && (
            <section className="rounded-3xl border border-emerald-300/35 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(18,72,54,0.95)_0%,rgba(12,20,22,0.96)_52%,rgba(8,10,12,1)_100%)] p-6 sm:p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-200/90">Demarrage</p>
              <div className="mt-3 min-h-[46vh] rounded-2xl border border-white/15 bg-[#12161A] p-5 flex flex-col justify-center text-center">
                <h1 className="text-3xl sm:text-4xl font-black leading-tight">Demarrer le scan de votre annuaire telephonique</h1>
                <p className="mt-4 text-sm sm:text-base text-white/85">
                  Chaque personne de votre annuaire possede des besoins. En la conseillant vers un excellent pro local, vous pouvez toucher une commission.
                </p>
                <p className="mt-2 text-sm text-white/75">Lancez le scan et laissez-vous guider.</p>
              </div>
              <button
                type="button"
                onClick={() => setIntroStep("scanning")}
                className="mt-5 h-12 w-full rounded-xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 px-5 text-black text-sm font-black uppercase tracking-wide"
              >
                Demarrer
              </button>
            </section>
          )}

          {introStep === "scanning" && (
            <section className="rounded-3xl border border-cyan-300/35 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(28,78,96,0.95)_0%,rgba(15,24,32,0.96)_52%,rgba(8,10,12,1)_100%)] p-6 sm:p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-cyan-200/90">Scan en cours</p>
              <h2 className="mt-2 text-3xl font-black">Analyse de l annuaire</h2>
              <p className="mt-2 text-sm text-white/80">{scanCount}/{totalContacts} personnes analysees</p>
              <div className="mt-4 relative h-24 rounded-2xl border border-cyan-300/25 bg-black/20 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.18)_0%,rgba(0,0,0,0)_65%)] animate-pulse" />
                <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/60" />
                <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/30 animate-ping" />
                <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-200/35 to-transparent animate-[pulse_1.2s_ease-in-out_infinite]" />
              </div>
              <div className="mt-4 h-3 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-emerald-400 transition-all duration-150" style={{ width: `${scanProgressPercent}%` }} />
              </div>
              <p className="mt-2 text-xs text-white/70">{scanProgressPercent}%</p>
              {scanCompleted && (
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs sm:text-sm">
                  <p className="rounded-lg border border-white/15 bg-black/20 px-2 py-2"><span className="block font-black text-emerald-300">{prospectedCount}</span>profils actifs</p>
                  <p className="rounded-lg border border-white/15 bg-black/20 px-2 py-2"><span className="block font-black text-cyan-200">{localCityCount}</span>contacts locaux</p>
                  <p className="rounded-lg border border-white/15 bg-black/20 px-2 py-2"><span className="block font-black text-[#EAC886]">{hotSignalsCount}</span>signaux chauds</p>
                </div>
              )}

              {scanCompleted ? (
                <div className="mt-5">
                  <p className="rounded-xl border border-emerald-300/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    Scan termine: {totalContacts} contacts disponibles.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIntroStep("guide")}
                    className="mt-4 h-12 w-full rounded-xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 px-5 text-black text-sm font-black uppercase tracking-wide"
                  >
                    Continuer
                  </button>
                </div>
              ) : (
                <p className="mt-5 text-sm text-cyan-100/85">Analyse automatique en cours...</p>
              )}
            </section>
          )}

          {introStep === "guide" && (
            <section className="rounded-3xl border border-[#EAC886]/35 bg-[#12161A] p-5 sm:p-7">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Mode d emploi daily</p>
              <h2 className="mt-2 text-[34px] leading-tight font-black">Bonjour {scoutFirstName}, voici tes 20 scans prioritaires du jour</h2>
              <p className="mt-2 text-sm text-white/80">2 minutes pour verifier si ton reseau a des projets et activer tes commissions.</p>
              <div className="mt-3 h-[24vh] sm:h-[30vh] rounded-2xl border border-white/15 bg-gradient-to-br from-[#1F2A35] via-[#1B2630] to-[#172126] p-4 flex flex-col justify-center text-center">
                <p className="text-xs uppercase tracking-[0.12em] text-white/60">Contact prioritaire</p>
                <p className="mt-1 text-3xl sm:text-4xl font-black">Jean-Mi B.</p>
                <p className="mt-1 text-lg sm:text-xl font-black text-white/90">Dax</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <p className="rounded-xl border border-white/15 bg-black/20 px-2 py-3 text-xs"><span className="text-rose-400 text-xl">✕</span><br />Ignorer</p>
                <p className="rounded-xl border border-white/15 bg-black/20 px-2 py-3 text-xs"><span className="text-emerald-300 text-xl">✓</span><br />Qualifier</p>
                <p className="rounded-xl border border-white/15 bg-black/20 px-2 py-3 text-xs"><span className="text-cyan-300 text-xl">★</span><br />Alerte</p>
              </div>
              <p className="mt-3 rounded-xl border border-white/15 bg-black/20 px-4 py-2 text-xs sm:text-sm text-white/85">
                Objectif: 20 contacts qualifies en 2 minutes. Ne rate aucune opportunite dans ton repertoire de {totalContacts} noms.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDailyTutorialStep(0);
                  setTutorialActive(true);
                  setIntroStep("done");
                }}
                className="mt-5 h-12 w-full rounded-xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 px-5 text-black text-sm font-black uppercase tracking-wide"
              >
                C EST PARTI, JE SCANE !
              </button>
            </section>
          )}
        </div>
      )}

      {introStep === "done" && (
      <>
      <div className="mx-auto max-w-5xl px-4 py-6 pb-36 space-y-6">

        {showProfile && (
          <section className="rounded-2xl border border-white/15 bg-[#12161A] p-4">
            <h2 className="text-lg font-black">Mes informations</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
              <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">Statut: Eclaireur particulier</p>
              <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">Badge: Eclaireur Bronze</p>
              <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">RIB: Configure</p>
            </div>
          </section>
        )}

        {mainTab === "daily" && (
          <section className="rounded-3xl border border-emerald-300/35 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(18,72,54,0.95)_0%,rgba(12,20,22,0.96)_52%,rgba(8,10,12,1)_100%)] p-3 sm:p-5">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-white/15 bg-black/20 px-3 py-2">
                <p className="text-xs font-black uppercase tracking-wide">Daily</p>
                <p className="text-xs text-white/80">
                  {Math.min(currentCardIndex + 1, 20)}/20 • {qualifiedCount}/{totalContacts}
                </p>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-300 to-cyan-300" style={{ width: `${(dailyProcessed / 20) * 100}%` }} />
              </div>
            </div>

            <div className={`mt-2 sm:mt-3 min-h-[40vh] sm:min-h-[52vh] max-h-[44vh] sm:max-h-none rounded-2xl border border-white/15 bg-gradient-to-br ${currentCardTheme} p-3 sm:p-4 flex flex-col justify-center`}>
              {!currentDailyContact ? (
                <div className="rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-3 py-3 text-center">
                  <p className="text-sm text-emerald-200">Felicitations, mission du jour terminee.</p>
                  <p className="text-xs text-emerald-100/80">A demain pour 20 nouvelles cartes.</p>
                </div>
              ) : (
                <article
                  className={`text-center transition duration-200 ${
                    swipeAnim === "left"
                      ? "-translate-x-[140%] rotate-[-18deg] opacity-0 scale-95"
                      : swipeAnim === "right"
                        ? "translate-x-[140%] rotate-[18deg] opacity-0 scale-95"
                        : swipeAnim === "up"
                          ? "-translate-y-[150%] opacity-0 scale-95"
                          : ""
                  }`}
                >
                  <div className="mx-auto mb-3 sm:mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border border-white/25 bg-white/10 text-xl sm:text-2xl font-black">
                    {currentDailyContact.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <p className="text-xs uppercase tracking-[0.12em] text-white/60">Carte du jour</p>
                  <p className="mt-2 sm:mt-3 text-4xl sm:text-6xl font-black leading-tight">{currentDailyContact.name}</p>
                  <p className="mt-2 sm:mt-3 inline-flex rounded-full border border-white/20 bg-black/20 px-3 py-1 text-lg sm:text-xl font-black text-white/95">{currentDailyContact.city}</p>
                  <p className="mt-1 sm:mt-2 text-sm sm:text-base text-white/65">{currentDailyContact.phone}</p>
                </article>
              )}
            </div>
            {tutorialActive && currentDailyContact && tutorialExpectedAction && (
              <div className="mt-2 rounded-xl border border-cyan-300/35 bg-cyan-500/10 px-3 py-2 text-xs sm:text-sm text-cyan-100">
                {tutorialExpectedAction === "up" && `${currentDailyContact.name} a un projet urgent ? Clique sur l etoile pour envoyer le prospect a un pro de ta ville.`}
                {tutorialExpectedAction === "right" && `${currentDailyContact.name} semble prometteur ? Clique ✓ pour le qualifier.`}
                {tutorialExpectedAction === "left" && `${currentDailyContact.name} n a pas de projet pour l instant ? Clique ✕ pour ignorer.`}
              </div>
            )}

            {currentDailyContact && (
              <div className="mt-2 sm:mt-4 grid grid-cols-5 gap-2 items-center">
                <button
                  type="button"
                  onClick={onUndoLast}
                  className="h-10 sm:h-12 rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),rgba(0,0,0,0.3))] text-lg sm:text-xl font-black text-amber-300 shadow-[0_10px_20px_-14px_rgba(251,191,36,0.9)] active:scale-95 transition"
                >
                  ↺
                </button>
                <button
                  type="button"
                  onClick={onSwipeLeft}
                  className="h-16 sm:h-20 rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),rgba(0,0,0,0.3))] text-3xl sm:text-4xl font-black text-rose-400 shadow-[0_16px_30px_-16px_rgba(244,63,94,0.9)] active:scale-95 transition"
                >
                  ✕
                </button>
                <button
                  type="button"
                  onClick={onSwipeUp}
                  className="h-12 sm:h-14 rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),rgba(0,0,0,0.3))] text-2xl sm:text-3xl font-black text-cyan-300 shadow-[0_14px_26px_-14px_rgba(34,211,238,0.9)] active:scale-95 transition"
                >
                  ★
                </button>
                <button
                  type="button"
                  onClick={onSwipeRight}
                  className="h-16 sm:h-20 rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),rgba(0,0,0,0.3))] text-3xl sm:text-4xl font-black text-emerald-300 shadow-[0_16px_30px_-16px_rgba(52,211,153,0.9)] active:scale-95 transition"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => currentDailyContact && sendContactIntroMessage(currentDailyContact)}
                  className="h-12 sm:h-14 rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),rgba(0,0,0,0.3))] px-2 text-[10px] leading-tight sm:text-xs font-black text-cyan-200 shadow-[0_12px_22px_-14px_rgba(56,189,248,0.9)] active:scale-95 transition"
                >
                  💬 Message Reveil
                </button>
              </div>
            )}
            {lastActionMessage && <p className="mt-2 text-center text-xs text-white/75">{lastActionMessage}</p>}
          </section>
        )}

        {showSearchPanel && (
          <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm flex items-start justify-center px-4 pt-20">
            <section className="w-full max-w-md rounded-2xl border border-white/15 bg-[#12161A] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Recherche rapide</p>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tape un nom, numero ou ville"
                className="mt-2 h-11 w-full rounded-xl border border-white/20 bg-black/25 px-3 text-sm"
              />
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {searchResults.slice(0, 8).map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => {
                      setShowSearchPanel(false);
                      openFunnelForContact(contact.id);
                    }}
                    className="w-full rounded-xl border border-white/15 bg-black/20 p-3 text-left"
                  >
                    <p className="text-sm font-black">{contact.name}</p>
                    <p className="text-xs text-white/70">{contact.city}</p>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowSearchPanel(false)}
                className="mt-3 h-10 rounded-lg border border-white/20 bg-white/10 px-4 text-xs font-black uppercase tracking-wide"
              >
                Fermer
              </button>
            </section>
          </div>
        )}

        {surveillanceContactId && surveillanceContact && (
          <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm flex items-center justify-center px-4">
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setSurveillanceContactId(null)}
              className="absolute inset-0 h-full w-full"
            />
            <section className="relative z-50 w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#12161A] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
              <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-white/20" />
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Mise sous surveillance</p>
              <h3 className="mt-2 text-xl font-black">Pas de besoin immediat ? Organisons la suite.</h3>
              <p className="mt-2 text-sm text-white/75">
                C est peut-etre pas encore le moment pour {surveillanceContact.name.split(" ")[0]}, mais ne le laissons pas s endormir. Choisissez une action
                pour rester dans son radar.
              </p>

              {isColdContact && (
                <p className="mt-3 rounded-xl border border-[#EAC886]/25 bg-[#1A1510] px-3 py-2 text-xs text-[#F2D9A2]">
                  💡 Contact froid: un message de reveil est conseille.
                </p>
              )}

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSurveillanceMode("funnel")}
                  className={`h-11 rounded-xl border text-xs font-black uppercase tracking-wide ${
                    surveillanceMode === "funnel" ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/20 bg-white/5"
                  }`}
                >
                  Entonnoir intelligent
                </button>
                <button
                  type="button"
                  onClick={sendWakeMessage}
                  className="h-11 rounded-xl bg-cyan-300 text-black text-xs font-black uppercase tracking-wide"
                >
                  💬 Envoyer un message de courtoisie
                </button>
              </div>

              {surveillanceMode === "funnel" && (
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <input
                      value={magicSearchTerm}
                      onChange={(event) => setMagicSearchTerm(event.target.value)}
                      placeholder='Magic search (ex: \"Chocolat\")'
                      className="h-10 w-full rounded-xl border border-white/20 bg-black/25 px-3 text-sm"
                    />
                  </div>

                  {magicSearchTerm.trim() && (
                    <div className="mt-2 space-y-2">
                      {MAGIC_SEARCH.filter((item) => item.keyword.includes(magicSearchTerm.trim().toLowerCase())).map((item) => (
                        <button
                          key={item.keyword}
                          type="button"
                          onClick={() => launchSmartFunnel(surveillanceContactId, item.need, "Potentiel business", [item.need])}
                          className="w-full rounded-xl border border-white/15 bg-black/20 p-3 text-left"
                        >
                          <p className="text-sm font-black">{item.suggestion}</p>
                          <p className="text-xs text-white/70">Suggestion: {item.need}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {SPHERES.map((sphere) => (
                      <button
                        key={sphere.id}
                        type="button"
                        onClick={() => {
                          setSelectedSphereId(sphere.id);
                          setSelectedDiagnosticId(null);
                        }}
                        className={`rounded-2xl border p-3 text-left ${
                          selectedSphereId === sphere.id ? "border-emerald-300/55 bg-emerald-500/10" : "border-white/15 bg-black/20"
                        }`}
                      >
                        <p className="text-sm font-black">
                          {sphere.icon} {sphere.label}
                        </p>
                        <p className="text-xs text-white/70">{sphere.description}</p>
                      </button>
                    ))}
                  </div>

                  {avgSphereCommission && (
                    <p className="mt-3 rounded-xl border border-emerald-300/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                      Potentiel moyen sur cette categorie: <span className="font-black">~{avgSphereCommission}€</span> par lead valide. Astuce: priorise les contacts chauds.
                    </p>
                  )}

                  <div className="mt-3 rounded-2xl border border-white/15 bg-black/20 p-3">
                    <p className="text-xs text-white/70">Qu est-ce qui definit le mieux {surveillanceContact.name.split(" ")[0]} ?</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(DIAGNOSTICS[selectedSphereId] ?? []).map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setSelectedDiagnosticId(d.id)}
                          className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-wide ${
                            selectedDiagnosticId === d.id ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/20 bg-white/5"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                    {selectedDiagnostic && (
                      <p className="mt-3 rounded-xl border border-cyan-300/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                        Potentiel estime pour ce choix: <span className="font-black">~{selectedDiagnostic.avgCommission}€</span>. {selectedDiagnostic.teaser}
                      </p>
                    )}
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        disabled={!selectedDiagnosticId}
                        onClick={() => {
                          const diag = (DIAGNOSTICS[selectedSphereId] ?? []).find((d) => d.id === selectedDiagnosticId);
                          if (!diag) return;
                          const mappedNeed = diag.trade[0] ?? diag.need;
                          launchSmartFunnel(
                            surveillanceContactId,
                            mappedNeed,
                            "Potentiel business",
                            [...diag.trade, diag.need],
                          );
                        }}
                        className="h-10 rounded-xl bg-emerald-400 text-black text-xs font-black uppercase tracking-wide disabled:opacity-40"
                      >
                        Continuer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {funnelStep && (
          <div className="fixed inset-0 z-30 bg-black/55 backdrop-blur-sm overflow-y-auto px-4 py-10">
          <section className="mx-auto max-w-2xl rounded-3xl border border-white/15 bg-[#12161A] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Funnel direct</p>
            <h2 className="mt-1 text-2xl font-black">Contact: {activeContact.name}</h2>

            {funnelStep === "match" && (
              <>
                <p className="mt-2 text-sm text-white/75">De quel expert {activeContact.name.split(" ")[0]} pourrait-elle etre interessee ?</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {needsForMatch.map((need) => (
                    <button
                      key={need}
                      type="button"
                      onClick={() => {
                        setSelectedNeed(need);
                        const suggested = findSuggestedPro(need);
                        setFeaturedProId(suggested?.id ?? null);
                      }}
                      className={`h-11 rounded-xl border text-xs font-black uppercase tracking-wide ${
                        selectedNeed === need ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/20 bg-white/5"
                      }`}
                    >
                      {need}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={!featuredProId}
                  onClick={() => setShowProDetailModal(true)}
                  className="mt-3 h-11 rounded-xl bg-emerald-400 px-4 text-black text-xs font-black uppercase tracking-wide disabled:opacity-40"
                >
                  Voir l expert recommande
                </button>
                <p className="mt-2 text-xs text-white/70">Choisis un besoin, puis ouvre la pop-up pro avec le CTA.</p>
              </>
            )}

            {funnelStep === "message" && (
              <>
                <p className="mt-2 text-sm text-white/75">Message pre-rempli</p>
                <textarea
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value)}
                  className="mt-3 min-h-28 w-full rounded-xl border border-white/20 bg-black/25 px-3 py-2 text-sm"
                />
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleAskConsentViaWhatsApp}
                    className="h-11 rounded-xl bg-cyan-300 px-3 text-black text-xs font-black uppercase tracking-wide"
                  >
                    Demander l accord de {activeContact.name.split(" ")[0]}
                  </button>
                  <button
                    type="button"
                    onClick={handleConsentAndSendLead}
                    disabled={!selectedProId}
                    className="h-11 rounded-xl bg-emerald-400 px-3 text-black text-xs font-black uppercase tracking-wide disabled:opacity-40"
                  >
                    J ai le consentement de {activeContact.name.split(" ")[0]}
                  </button>
                </div>
                <p className="mt-2 text-xs text-white/70">Le 1er bouton ouvre WhatsApp. Le 2e envoie le lead au pro avec accord de rappel.</p>
              </>
            )}
          </section>
          </div>
        )}

        {showProDetailModal && featuredPro && (
          <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm flex items-center justify-center px-4">
            <section className="w-full max-w-md rounded-3xl border border-white/15 bg-[#12161A] p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Fiche pro</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-14 w-14 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-lg font-black">
                  {featuredPro.photoInitials}
                </div>
                <div>
                  <p className="text-lg font-black">{featuredPro.name}</p>
                  <p className="text-sm text-white/80">{featuredPro.company}</p>
                </div>
              </div>
              <div className="mt-3 rounded-2xl border border-white/15 bg-black/20 p-3">
                <p className="text-xs text-white/70">Metier</p>
                <p className="text-sm font-black">{featuredPro.trade}</p>
                <p className="mt-2 text-xs text-white/70">Adresse</p>
                <p className="text-sm">{featuredPro.companyAddress}</p>
                <p className="mt-2 text-xs text-white/70">Avis Google</p>
                <p className="text-sm text-emerald-300">⭐⭐⭐⭐ {featuredPro.rating}/5 • {featuredPro.googleReviews} avis</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowProDetailModal(false)}
                  className="h-11 rounded-xl border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => proceedToMessageWithPro(featuredPro)}
                  className="h-11 rounded-xl bg-emerald-400 text-black text-xs font-black uppercase tracking-wide"
                >
                  Choisir ce pro
                </button>
              </div>
            </section>
          </div>
        )}

        {showLeadSentModal && (
          <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm flex items-center justify-center px-4">
            <section className="w-full max-w-md rounded-3xl border border-emerald-300/25 bg-[#12161A] p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-200/90">Felicitations</p>
              <h3 className="mt-2 text-xl font-black">Contact envoye</h3>
              <p className="mt-2 text-sm text-white/85">
                Le contact de <span className="font-black">{activeContact.name}</span> a bien ete envoye a <span className="font-black">{selectedTrade}</span>.
              </p>
              <p className="mt-2 text-sm text-white/75">
                Il/elle appellera <span className="font-black">{activeContact.name}</span> dans les plus brefs delais. Si un rendez-vous est pris, ta commission sera versee sous 30 jours.
              </p>
              <button
                type="button"
                onClick={() => setShowLeadSentModal(false)}
                className="mt-4 h-11 w-full rounded-xl bg-emerald-400 text-black text-xs font-black uppercase tracking-wide"
              >
                Continuer le daily
              </button>
            </section>
          </div>
        )}

        {mainTab === "gains" && (
          <section className="rounded-3xl border border-[#EAC886]/35 bg-[#12161A] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Mes gains</p>
            <h2 className="mt-1 text-2xl font-black">Portefeuille eclaireur</h2>
            <p className="mt-2 rounded-xl border border-emerald-300/35 bg-emerald-500/10 px-4 py-3 text-emerald-100">
              Total cumule: <span className="font-black">{validatedAmount.toLocaleString("fr-FR")} EUR</span>
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3 text-sm">
              <p className="rounded-xl border border-amber-300/30 bg-amber-500/10 px-3 py-2">En attente: {pendingAmount} EUR</p>
              <p className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2">Valides: {validatedAmount} EUR</p>
              <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2">Refuses: {rejectedAmount} EUR</p>
            </div>
            <p className="mt-4 rounded-xl border border-[#EAC886]/35 bg-[#1D170E] px-4 py-3 text-sm text-[#EAC886]">
              Potentiel global estime annuaire: <span className="font-black">{totalPotential.toLocaleString("fr-FR")} EUR</span>
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
              <p className="rounded-xl border border-white/15 bg-black/20 px-3 py-2">% cartes traitees/jour: {Math.round((kpi.treated / 20) * 100)}%</p>
              <p className="rounded-xl border border-white/15 bg-black/20 px-3 py-2">% swipe droite: {Math.round((kpi.right / 20) * 100)}%</p>
              <p className="rounded-xl border border-white/15 bg-black/20 px-3 py-2">% swipe haut: {Math.round((kpi.up / 20) * 100)}%</p>
              <p className="rounded-xl border border-white/15 bg-black/20 px-3 py-2">% messages envoyes: {kpi.messages}</p>
              <p className="rounded-xl border border-white/15 bg-black/20 px-3 py-2">% reponses OK: {kpi.repliesOk}</p>
              <p className="rounded-xl border border-white/15 bg-black/20 px-3 py-2">% leads transmis: {kpi.leads}</p>
              <p className="rounded-xl border border-white/15 bg-black/20 px-3 py-2">% deals valides: {kpi.deals}</p>
            </div>
          </section>
        )}

        {mainTab === "pros" && (
          <section className="rounded-3xl border border-white/15 bg-[#12161A] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Annuaire des metiers</p>
            <h2 className="mt-1 text-2xl font-black">Les cracks de la ville</h2>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {["Tous", "Immo", "Travaux", "Sante", "Finances", "Services", "Animalier"].map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedProCategory(category)}
                  className={`h-9 rounded-lg border text-[11px] font-black uppercase tracking-wide ${
                    selectedProCategory === category ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/20 bg-white/5"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {prosResults.map((pro) => (
                <article key={pro.id} className="rounded-xl border border-white/15 bg-black/20 p-3">
                  <p className="text-sm font-black">{pro.name}</p>
                  <p className="text-xs text-white/70">
                    {pro.category} • {pro.city} • note {pro.rating}/5
                  </p>
                  <div className="mt-2 rounded-lg border border-emerald-300/35 bg-emerald-500/10 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-emerald-100/85">Reversion Popey</p>
                    <p className="text-xl font-black text-emerald-300">{pro.commissionRate}% reverses</p>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="h-9 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-black uppercase tracking-wide">
                      Appeler
                    </button>
                    <button type="button" className="h-9 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-black uppercase tracking-wide">
                      Message
                    </button>
                    <button type="button" className="h-9 rounded-lg bg-emerald-400 px-3 text-xs font-black uppercase tracking-wide text-black">
                      Recommander ce pro
                    </button>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => informOneContactAboutPro(pro)}
                      className="h-9 rounded-lg border border-cyan-300/35 bg-cyan-500/10 px-3 text-xs font-black uppercase tracking-wide text-cyan-100"
                    >
                      J informe un de mes contact
                    </button>
                    <button
                      type="button"
                      onClick={() => sendFriendToPro(pro)}
                      className="h-9 rounded-lg bg-[#EAC886] px-3 text-xs font-black uppercase tracking-wide text-black"
                    >
                      J envoie un ami a ce pro
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {mainTab === "contact" && (
          <section className="rounded-3xl border border-white/15 bg-[#12161A] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">A contacter</p>
            <h2 className="mt-1 text-2xl font-black">Mes contacts qualifies</h2>
            {contactsToContact.length === 0 ? (
              <p className="mt-3 rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-white/75">
                Aucun contact pour le moment. Swipe vert ou bleu pour alimenter cette liste.
              </p>
            ) : (
              <div className="mt-3 space-y-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-white/70">Qualifies sans message ({qualifiedWithoutMessage.length})</p>
                  <div className="mt-2 space-y-2">
                    {qualifiedWithoutMessage.map((contact) => {
                      const meta = contactMeta[contact.id];
                      return (
                        <article key={contact.id} className="rounded-xl border border-white/15 bg-black/20 p-3">
                          <p className="text-sm font-black">{contact.name}</p>
                          <p className="text-xs text-white/70">{contact.city}</p>
                          {meta?.tags?.length > 0 && <p className="mt-1 text-xs text-emerald-200">Tags: {meta.tags.join(" • ")}</p>}
                          <button
                            type="button"
                            onClick={() => openContactFlowFromQueue(contact.id)}
                            className="mt-2 h-9 rounded-lg bg-emerald-400 px-3 text-xs font-black uppercase tracking-wide text-black"
                          >
                            Choisir besoin et pro
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-white/70">En attente de reponse ({waitingContacts.length})</p>
                  <div className="mt-2 space-y-2">
                    {waitingContacts.map((contact) => (
                      <article key={contact.id} className="rounded-xl border border-amber-300/25 bg-amber-500/10 p-3">
                        <p className="text-sm font-black">{contact.name}</p>
                        <p className="text-xs text-white/75">{contact.city}</p>
                        <button
                          type="button"
                          onClick={() => openContactFlowFromQueue(contact.id)}
                          className="mt-2 h-9 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-black uppercase tracking-wide"
                        >
                          Reprendre le parcours
                        </button>
                      </article>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-white/70">OK a envoyer ({okToSendContacts.length})</p>
                  <div className="mt-2 space-y-2">
                    {okToSendContacts.map((contact) => (
                      <article key={contact.id} className="rounded-xl border border-emerald-300/25 bg-emerald-500/10 p-3">
                        <p className="text-sm font-black">{contact.name}</p>
                        <button
                          type="button"
                          onClick={() => openFunnelForContact(contact.id)}
                          className="mt-2 h-9 rounded-lg bg-emerald-400 px-3 text-xs font-black uppercase tracking-wide text-black"
                        >
                          Choisir un pro et envoyer
                        </button>
                      </article>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-white/70">Deja envoyes ({dispatchedContacts.length})</p>
                  <div className="mt-2 space-y-2">
                    {dispatchedContacts.map((contact) => (
                      <article key={contact.id} className="rounded-xl border border-cyan-300/25 bg-cyan-500/10 p-3">
                        <p className="text-sm font-black">{contact.name}</p>
                      </article>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-white/70">Refuses ({refusedContacts.length})</p>
                  <div className="mt-2 space-y-2">
                    {refusedContacts.map((contact) => (
                      <article key={contact.id} className="rounded-xl border border-rose-300/25 bg-rose-500/10 p-3">
                        <p className="text-sm font-black">{contact.name}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#0A0D10]/95 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-4 gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => setMainTab("daily")}
            className={`h-11 rounded-xl text-xs font-black uppercase tracking-wide ${mainTab === "daily" ? "bg-emerald-400 text-black" : "bg-white/10 text-white"}`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setMainTab("contact")}
            className={`h-11 rounded-xl text-xs font-black uppercase tracking-wide ${mainTab === "contact" ? "bg-cyan-300 text-black" : "bg-white/10 text-white"}`}
          >
            A contacter
          </button>
          <button
            type="button"
            onClick={() => setMainTab("pros")}
            className={`h-11 rounded-xl text-xs font-black uppercase tracking-wide ${mainTab === "pros" ? "bg-cyan-300 text-black" : "bg-white/10 text-white"}`}
          >
            Pros
          </button>
          <button
            type="button"
            onClick={() => setMainTab("gains")}
            className={`h-11 rounded-xl text-xs font-black uppercase tracking-wide ${mainTab === "gains" ? "bg-[#EAC886] text-black" : "bg-white/10 text-white"}`}
          >
            Gains
          </button>
        </div>
      </nav>
      </>
      )}
    </main>
  );
}
