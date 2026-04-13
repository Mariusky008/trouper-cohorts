"use client";

import { useMemo, useState } from "react";

type MainTab = "daily" | "search" | "gains" | "pros" | "history";
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

  const dailyDeckIds = useMemo(() => CONTACTS.slice(0, 20).map((contact) => contact.id), []);
  const currentDailyContact = CONTACTS.find((contact) => contact.id === dailyDeckIds[currentCardIndex]) || null;
  const activeContact = CONTACTS.find((contact) => contact.id === activeContactId) ?? CONTACTS[0];

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
  const historyItems = [
    { id: "h1", label: "Lead envoye - Julien M.", status: "En attente", amount: 280, color: "text-amber-200" },
    { id: "h2", label: "Lead signe - Claire R.", status: "Valide", amount: 320, color: "text-emerald-200" },
    { id: "h3", label: "Lead refuse - Karim B.", status: "Refuse", amount: 0, color: "text-rose-200" },
  ];

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
    setDailyProcessed((value) => Math.min(20, value + 1));
    setCurrentCardIndex((value) => Math.min(19, value + 1));
  }

  function onSwipeLeft() {
    if (!currentDailyContact) return;
    updateStatus(currentDailyContact.id, "masked_90d");
    goNextCard();
  }

  function onSwipeRight() {
    if (!currentDailyContact) return;
    setPendingTagContactId(currentDailyContact.id);
  }

  function onSelectTag(tag: string) {
    if (!pendingTagContactId) return;
    updateStatus(pendingTagContactId, "qualified", tag);
    setPendingTagContactId(null);
    goNextCard();
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
    updateStatus(currentDailyContact.id, "alert");
    openFunnelForContact(currentDailyContact.id);
    goNextCard();
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
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Rechercher un contact..."
                className="h-10 w-full rounded-xl border border-white/20 bg-black/25 px-3 text-sm"
              />
              <div className="flex items-center justify-between rounded-lg border border-white/15 bg-black/20 px-3 py-2">
                <p className="text-xs font-black uppercase tracking-wide">Daily</p>
                <p className="text-xs text-white/80">
                  {Math.min(currentCardIndex + 1, 20)}/20 • {qualifiedCount}/{totalContacts}
                </p>
              </div>
            </div>

            <div className="mt-3 min-h-[52vh] rounded-2xl border border-white/15 bg-[#12161A] p-4 flex flex-col justify-center">
              {!currentDailyContact ? (
                <p className="rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200 text-center">
                  Bien joue, tes 20 cartes du jour sont traitees.
                </p>
              ) : (
                <article className="text-center">
                  <p className="text-xs uppercase tracking-[0.12em] text-white/60">Carte du jour</p>
                  <p className="mt-3 text-4xl sm:text-5xl font-black leading-tight">{currentDailyContact.name}</p>
                  <p className="mt-2 text-lg text-white/80">{currentDailyContact.city}</p>
                  <p className="mt-1 text-sm text-white/55">{currentDailyContact.phone}</p>
                </article>
              )}
            </div>

            {currentDailyContact && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button type="button" onClick={onSwipeLeft} className="h-14 rounded-xl bg-rose-500/85 text-white text-lg font-black">
                  ❌
                </button>
                <button type="button" onClick={onSwipeRight} className="h-14 rounded-xl bg-emerald-400 text-black text-lg font-black">
                  ✅
                </button>
                <button type="button" onClick={onSwipeUp} className="h-14 rounded-xl bg-cyan-300 text-black text-lg font-black">
                  🔥
                </button>
              </div>
            )}
          </section>
        )}

        {pendingTagContactId && (
          <section className="rounded-2xl border border-[#EAC886]/35 bg-[#1A1510] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Tag profil</p>
            <h3 className="mt-1 text-lg font-black">Quel est son profil ?</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DAILY_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelectTag(tag)}
                  className="h-10 rounded-lg border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide"
                >
                  {tag}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPendingTagContactId(null)}
              className="mt-3 h-10 rounded-lg border border-white/20 bg-black/25 px-4 text-xs font-black uppercase tracking-wide"
            >
              Fermer
            </button>
          </section>
        )}

        {funnelStep && (
          <section className="rounded-3xl border border-white/15 bg-[#12161A] p-5 sm:p-6">
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
                <p className="mt-2 text-sm text-white/75">Choisir le metier concerne (possible seulement si OK)</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {(NEEDS_BY_MOMENT[selectedMoment] ?? NEEDS_BY_MOMENT.Autre).map((trade) => (
                    <button
                      key={trade}
                      type="button"
                      onClick={() => setSelectedTrade(trade)}
                      className={`h-11 rounded-xl border text-xs font-black uppercase tracking-wide ${
                        selectedTrade === trade ? "border-emerald-200/60 bg-emerald-400/15" : "border-white/25 bg-black/20"
                      }`}
                    >
                      {trade}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setFunnelStep("done")}
                  className="mt-3 h-11 rounded-xl bg-black px-4 text-white text-xs font-black uppercase tracking-wide"
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
                  onClick={() => setFunnelStep(null)}
                  className="mt-3 h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-black uppercase tracking-wide"
                >
                  Fermer le funnel
                </button>
              </>
            )}
          </section>
        )}

        {mainTab === "search" && (
          <section className="rounded-3xl border border-white/15 bg-[#12161A] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Recherche directe</p>
            <h2 className="mt-1 text-2xl font-black">Mode libre</h2>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tape un nom, numero ou ville"
              className="mt-3 h-11 w-full rounded-xl border border-white/20 bg-black/25 px-3 text-sm"
            />
            <div className="mt-3 space-y-2">
              {searchResults.map((contact) => (
                <article key={contact.id} className="rounded-xl border border-white/15 bg-black/20 p-3">
                  <p className="text-sm font-black">{contact.name}</p>
                  <p className="text-xs text-white/70">
                    {contact.phone} • {contact.city}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openFunnelForContact(contact.id)}
                      className="h-9 rounded-lg bg-emerald-400 px-3 text-xs font-black uppercase tracking-wide text-black"
                    >
                      Creer lead direct
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateStatus(contact.id, "masked_90d");
                      }}
                      className="h-9 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-black uppercase tracking-wide"
                    >
                      Masquer 90j
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
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
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTrade(pro.category);
                        openFunnelForContact(activeContactId);
                      }}
                      className="h-9 rounded-lg bg-emerald-400 px-3 text-xs font-black uppercase tracking-wide text-black"
                    >
                      Recommander ce pro
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {mainTab === "history" && (
          <section className="rounded-3xl border border-white/15 bg-[#12161A] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Historique</p>
            <h2 className="mt-1 text-2xl font-black">Timeline des leads</h2>
            <div className="mt-4 space-y-2">
              {historyItems.map((item) => (
                <article key={item.id} className="rounded-xl border border-white/15 bg-black/25 px-3 py-3">
                  <p className="text-sm font-black">{item.label}</p>
                  <p className={`text-xs ${item.color}`}>
                    {item.status} • {item.amount} EUR
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#0A0D10]/95 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => setMainTab("daily")}
            className={`h-11 rounded-xl text-xs font-black uppercase tracking-wide ${mainTab === "daily" ? "bg-emerald-400 text-black" : "bg-white/10 text-white"}`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setMainTab("search")}
            className={`h-11 rounded-xl text-xs font-black uppercase tracking-wide ${mainTab === "search" ? "bg-cyan-300 text-black" : "bg-white/10 text-white"}`}
          >
            Recherche
          </button>
          <button
            type="button"
            onClick={() => setMainTab("gains")}
            className={`h-11 rounded-xl text-xs font-black uppercase tracking-wide ${mainTab === "gains" ? "bg-[#EAC886] text-black" : "bg-white/10 text-white"}`}
          >
            Gains
          </button>
        </div>
        {mainTab !== "daily" && (
          <div className="mx-auto mt-2 grid max-w-5xl grid-cols-2 gap-2 px-4 pb-2">
            <button
              type="button"
              onClick={() => setMainTab("pros")}
              className={`h-10 rounded-xl text-xs font-black uppercase tracking-wide ${mainTab === "pros" ? "bg-emerald-300 text-black" : "bg-white/10 text-white"}`}
            >
              Pros
            </button>
            <button
              type="button"
              onClick={() => setMainTab("history")}
              className={`h-10 rounded-xl text-xs font-black uppercase tracking-wide ${mainTab === "history" ? "bg-cyan-300 text-black" : "bg-white/10 text-white"}`}
            >
              Historique
            </button>
          </div>
        )}
      </nav>
    </main>
  );
}
