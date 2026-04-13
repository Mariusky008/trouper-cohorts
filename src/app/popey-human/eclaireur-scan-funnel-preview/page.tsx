"use client";

import { useMemo, useState } from "react";

type MainTab = "daily" | "contact" | "gains" | "pros";
type SwipeStatus = "new" | "masked_90d" | "qualified" | "alert";
type ReplyStatus = "waiting" | "ok" | "no";
type FunnelStep = "moment" | "need" | "message" | "response" | "dispatch" | "done";

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

const DAILY_TAGS = ["Proprietaire", "Pro", "Famille", "Ami proche"] as const;
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
  { id: "p1", name: "Camille Durand", category: "Immo", city: "Dax", rating: 4.8 },
  { id: "p2", name: "Atelier Nova", category: "Travaux", city: "Dax", rating: 4.7 },
  { id: "p3", name: "Sante Active", category: "Sante", city: "Dax", rating: 4.6 },
  { id: "p4", name: "Patrimoine Sud", category: "Finances", city: "Dax", rating: 4.9 },
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

export default function EclaireurScanFunnelPreviewPage() {
  const [mainTab, setMainTab] = useState<MainTab>("daily");
  const [showProfile, setShowProfile] = useState(false);
  const [funnelStep, setFunnelStep] = useState<FunnelStep | null>(null);
  const [activeContactId, setActiveContactId] = useState(CONTACTS[0].id);
  const [totalContacts] = useState(800);
  const [searchQuery, setSearchQuery] = useState("");
  const [dailyProcessed, setDailyProcessed] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [contactMeta, setContactMeta] = useState<Record<string, ContactMeta>>(() =>
    Object.fromEntries(CONTACTS.map((contact) => [contact.id, { status: "new", tags: [] }])),
  );
  const [pendingTagContactId, setPendingTagContactId] = useState<string | null>(null);
  const [selectedMoment, setSelectedMoment] = useState<string>(MOMENTS[0]);
  const [selectedNeed, setSelectedNeed] = useState<string>("");
  const [messageDraft, setMessageDraft] = useState("");
  const [reply, setReply] = useState<ReplyStatus>("waiting");
  const [selectedTrade, setSelectedTrade] = useState<string>("Courtier");
  const [selectedProCategory, setSelectedProCategory] = useState<string>("Tous");
  const [selectedProId, setSelectedProId] = useState<string | null>(null);
  const [swipeAnim, setSwipeAnim] = useState<"none" | "left" | "right" | "up">("none");
  const [selectedQuickTag, setSelectedQuickTag] = useState<string>(DAILY_TAGS[0]);
  const [lastActionMessage, setLastActionMessage] = useState("");
  const [showSearchPanel, setShowSearchPanel] = useState(false);

  const dailyDeckIds = useMemo(() => CONTACTS.slice(0, 20).map((contact) => contact.id), []);
  const currentDailyContact = CONTACTS.find((contact) => contact.id === dailyDeckIds[currentCardIndex]) || null;
  const activeContact = CONTACTS.find((contact) => contact.id === activeContactId) ?? CONTACTS[0];
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

  const kpi = useMemo(() => {
    const metas = Object.values(contactMeta);
    const treated = metas.filter((meta) => meta.status !== "new").length;
    const right = metas.filter((meta) => meta.status === "qualified").length;
    const up = metas.filter((meta) => meta.status === "alert").length;
    const messages = reply === "waiting" ? up : up + 1;
    const repliesOk = reply === "ok" ? 1 : 0;
    const leads = reply === "ok" && funnelStep === "done" ? 1 : 0;
    const deals = 1;
    return { treated, right, up, messages, repliesOk, leads, deals };
  }, [contactMeta, reply, funnelStep]);

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

  const defaultMessage = `Salut ${activeContact.name.split(" ")[0]}, je pense a toi suite a ton contexte "${selectedMoment}". J ai un pro de confiance sur ${selectedNeed || "ce sujet"} a ${activeContact.city}. Tu veux que je lui demande de te contacter ?`;

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
    animateAndThen("left", () => {
      updateStatus(currentDailyContact.id, "masked_90d");
      setLastActionMessage(`${currentDailyContact.name} masque 90 jours`);
      goNextCard();
    });
  }

  function onSwipeRight() {
    if (!currentDailyContact) return;
    setSelectedQuickTag(DAILY_TAGS[0]);
    setPendingTagContactId(currentDailyContact.id);
  }

  function onConfirmTag(tag: string) {
    if (!pendingTagContactId) return;
    const contact = CONTACTS.find((item) => item.id === pendingTagContactId);
    animateAndThen("right", () => {
      updateStatus(pendingTagContactId, "qualified", tag);
      setPendingTagContactId(null);
      if (contact) setLastActionMessage(`${contact.name} ajoute a "A contacter"`);
      goNextCard();
    });
  }

  function openFunnelForContact(contactId: string) {
    setActiveContactId(contactId);
    setSelectedMoment(MOMENTS[0]);
    setSelectedNeed("");
    setMessageDraft("");
    setReply("waiting");
    setFunnelStep("moment");
    setMainTab("daily");
  }

  function onSwipeUp() {
    if (!currentDailyContact) return;
    animateAndThen("up", () => {
      updateStatus(currentDailyContact.id, "alert");
      openFunnelForContact(currentDailyContact.id);
      setLastActionMessage(`Alerte immediate lancee pour ${currentDailyContact.name}`);
      goNextCard();
    });
  }

  function openMessageForContact(contactId: string) {
    const contact = CONTACTS.find((item) => item.id === contactId);
    if (!contact) return;
    setActiveContactId(contact.id);
    setSelectedMoment("Autre");
    setSelectedNeed("Courtier");
    setMessageDraft(
      `Salut ${contact.name.split(" ")[0]}, j ai pense a toi. J ai un pro de confiance a ${contact.city}. Tu veux que je lui demande de te contacter ?`,
    );
    setReply("waiting");
    setFunnelStep("message");
    setMainTab("daily");
  }

  function goNextFromResponse() {
    if (reply === "ok") {
      setFunnelStep("dispatch");
      return;
    }
    setFunnelStep("done");
  }

  return (
    <main className="min-h-screen bg-[#06080A] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 pb-36 sm:py-10 space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]/90">Eclaireur Scan V2 - Preview</p>
            <h1 className="text-3xl sm:text-4xl font-black">Daily Scan Popey</h1>
            <p className="mt-1 text-sm text-white/75">20 cartes par jour. Swipe. Qualifie. Convertis.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowProfile((value) => !value)}
            className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide"
          >
            Mes infos
          </button>
        </header>

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
          <section className="rounded-3xl border border-emerald-300/35 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(18,72,54,0.95)_0%,rgba(12,20,22,0.96)_52%,rgba(8,10,12,1)_100%)] p-4 sm:p-5">
            <div className="space-y-2">
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

            <div className={`mt-3 min-h-[52vh] rounded-2xl border border-white/15 bg-gradient-to-br ${currentCardTheme} p-4 flex flex-col justify-center`}>
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
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/25 bg-white/10 text-2xl font-black">
                    {currentDailyContact.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <p className="text-xs uppercase tracking-[0.12em] text-white/60">Carte du jour</p>
                  <p className="mt-3 text-5xl sm:text-6xl font-black leading-tight">{currentDailyContact.name}</p>
                  <p className="mt-3 inline-flex rounded-full border border-white/20 bg-black/20 px-3 py-1 text-xl font-black text-white/95">{currentDailyContact.city}</p>
                  <p className="mt-2 text-base text-white/65">{currentDailyContact.phone}</p>
                </article>
              )}
            </div>

            {currentDailyContact && (
              <div className="mt-4 grid grid-cols-5 gap-2 items-center">
                <button
                  type="button"
                  onClick={onUndoLast}
                  className="h-12 rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),rgba(0,0,0,0.3))] text-xl font-black text-amber-300 shadow-[0_10px_20px_-14px_rgba(251,191,36,0.9)] active:scale-95 transition"
                >
                  ↺
                </button>
                <button
                  type="button"
                  onClick={onSwipeLeft}
                  className="h-20 rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),rgba(0,0,0,0.3))] text-4xl font-black text-rose-400 shadow-[0_16px_30px_-16px_rgba(244,63,94,0.9)] active:scale-95 transition"
                >
                  ✕
                </button>
                <button
                  type="button"
                  onClick={onSwipeUp}
                  className="h-14 rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),rgba(0,0,0,0.3))] text-3xl font-black text-cyan-300 shadow-[0_14px_26px_-14px_rgba(34,211,238,0.9)] active:scale-95 transition"
                >
                  ★
                </button>
                <button
                  type="button"
                  onClick={onSwipeRight}
                  className="h-20 rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),rgba(0,0,0,0.3))] text-4xl font-black text-emerald-300 shadow-[0_16px_30px_-16px_rgba(52,211,153,0.9)] active:scale-95 transition"
                >
                  ❤
                </button>
                <button
                  type="button"
                  onClick={() => setShowSearchPanel(true)}
                  className="h-12 rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),rgba(0,0,0,0.3))] text-xl font-black text-cyan-200 shadow-[0_10px_20px_-14px_rgba(56,189,248,0.9)] active:scale-95 transition"
                >
                  ⌕
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

        {pendingTagContactId && (
          <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm flex items-center justify-center px-4">
            <section className="w-full max-w-sm rounded-2xl border border-[#EAC886]/35 bg-[#1A1510] p-4 animate-[fadeIn_.2s_ease-out]">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Tag profil</p>
              <h3 className="mt-1 text-lg font-black">Quel est son profil ?</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {DAILY_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedQuickTag(tag)}
                    className={`h-10 rounded-lg border text-xs font-black uppercase tracking-wide ${
                      selectedQuickTag === tag ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/20 bg-white/10"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPendingTagContactId(null)}
                  className="h-10 rounded-lg border border-white/20 bg-black/25 px-4 text-xs font-black uppercase tracking-wide"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => onConfirmTag(selectedQuickTag)}
                  className="h-10 rounded-lg bg-emerald-400 px-4 text-xs font-black uppercase tracking-wide text-black"
                >
                  Valider
                </button>
              </div>
            </section>
          </div>
        )}

        {funnelStep && (
          <div className="fixed inset-0 z-30 bg-black/55 backdrop-blur-sm overflow-y-auto px-4 py-10">
          <section className="mx-auto max-w-2xl rounded-3xl border border-white/15 bg-[#12161A] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Funnel direct</p>
            <h2 className="mt-1 text-2xl font-black">Contact: {activeContact.name}</h2>

            {funnelStep === "moment" && (
              <>
                <p className="mt-2 text-sm text-white/75">Choisis un moment de vie (8 tags + autre)</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {MOMENTS.map((moment) => (
                    <button
                      key={moment}
                      type="button"
                      onClick={() => setSelectedMoment(moment)}
                      className={`h-11 rounded-xl border text-xs font-black uppercase tracking-wide ${
                        selectedMoment === moment ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/20 bg-white/5"
                      }`}
                    >
                      {moment}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNeed((NEEDS_BY_MOMENT[selectedMoment] ?? NEEDS_BY_MOMENT.Autre)[0]);
                    setFunnelStep("need");
                  }}
                  className="mt-3 h-11 rounded-xl bg-emerald-400 px-4 text-black text-xs font-black uppercase tracking-wide"
                >
                  Continuer
                </button>
              </>
            )}

            {funnelStep === "need" && (
              <>
                <p className="mt-2 text-sm text-white/75">Besoin recommande selon le moment</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {(NEEDS_BY_MOMENT[selectedMoment] ?? NEEDS_BY_MOMENT.Autre).map((need) => (
                    <button
                      key={need}
                      type="button"
                      onClick={() => setSelectedNeed(need)}
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
                  onClick={() => {
                    setMessageDraft(defaultMessage);
                    setFunnelStep("message");
                  }}
                  className="mt-3 h-11 rounded-xl bg-emerald-400 px-4 text-black text-xs font-black uppercase tracking-wide"
                >
                  Continuer
                </button>
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
                <button
                  type="button"
                  onClick={() => setFunnelStep("response")}
                  className="mt-3 h-11 rounded-xl bg-cyan-300 px-4 text-black text-xs font-black uppercase tracking-wide"
                >
                  Message envoye
                </button>
              </>
            )}

            {funnelStep === "response" && (
              <>
                <p className="mt-2 text-sm text-white/75">Consentement explicite requis avant envoi lead</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReply("waiting")}
                    className={`h-11 rounded-xl border text-xs font-black uppercase tracking-wide ${reply === "waiting" ? "border-cyan-300/55 bg-cyan-500/12" : "border-white/20 bg-white/5"}`}
                  >
                    En attente
                  </button>
                  <button
                    type="button"
                    onClick={() => setReply("ok")}
                    className={`h-11 rounded-xl border text-xs font-black uppercase tracking-wide ${reply === "ok" ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/20 bg-white/5"}`}
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setReply("no")}
                    className={`h-11 rounded-xl border text-xs font-black uppercase tracking-wide ${reply === "no" ? "border-rose-300/55 bg-rose-500/12" : "border-white/20 bg-white/5"}`}
                  >
                    Non
                  </button>
                </div>
                <button
                  type="button"
                  onClick={goNextFromResponse}
                  className="mt-3 h-11 rounded-xl bg-[#EAC886] px-4 text-black text-xs font-black uppercase tracking-wide"
                >
                  Continuer
                </button>
              </>
            )}

            {funnelStep === "dispatch" && (
              <>
                <p className="mt-2 text-sm text-white/75">Choisir un pro de {activeContact.city} pour envoyer le lead</p>
                <div className="mt-3 space-y-2">
                  {PROS.filter((pro) => pro.city === "Dax" || pro.city === activeContact.city).map((pro) => (
                    <button
                      key={pro.id}
                      type="button"
                      onClick={() => {
                        setSelectedProId(pro.id);
                        setSelectedTrade(pro.name);
                      }}
                      className={`w-full rounded-xl border px-3 py-3 text-left ${
                        selectedProId === pro.id ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/20 bg-black/20"
                      }`}
                    >
                      <p className="text-sm font-black">{pro.name}</p>
                      <p className="text-xs text-white/70">
                        {pro.category} • {pro.city} • note {pro.rating}/5
                      </p>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setFunnelStep("done")}
                  disabled={!selectedProId}
                  className="mt-3 h-11 rounded-xl bg-black px-4 text-white text-xs font-black uppercase tracking-wide disabled:opacity-40"
                >
                  Envoyer le lead
                </button>
              </>
            )}

            {funnelStep === "done" && (
              <>
                <p className="mt-3 rounded-xl border border-emerald-300/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                  Lead transmis a {selectedTrade} pour {activeContact.name}. Consentement OK confirme.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFunnelStep(null);
                    setSelectedProId(null);
                  }}
                  className="mt-3 h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-black uppercase tracking-wide"
                >
                  Fermer le funnel
                </button>
              </>
            )}
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
              {["Tous", "Immo", "Travaux", "Sante", "Finances"].map((category) => (
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
              <div className="mt-3 space-y-2">
                {contactsToContact.map((contact) => {
                  const meta = contactMeta[contact.id];
                  return (
                    <article key={contact.id} className="rounded-xl border border-white/15 bg-black/20 p-3">
                      <p className="text-sm font-black">{contact.name}</p>
                      <p className="text-xs text-white/70">
                        {contact.city} • {meta?.status === "alert" ? "Alerte immediate" : "Qualifie"}
                      </p>
                      {meta?.tags?.length > 0 && <p className="mt-1 text-xs text-emerald-200">Tags: {meta.tags.join(" • ")}</p>}
                      <button
                        type="button"
                        onClick={() => openMessageForContact(contact.id)}
                        className="mt-2 h-9 rounded-lg bg-emerald-400 px-3 text-xs font-black uppercase tracking-wide text-black"
                      >
                        Envoyer un message
                      </button>
                    </article>
                  );
                })}
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
    </main>
  );
}
