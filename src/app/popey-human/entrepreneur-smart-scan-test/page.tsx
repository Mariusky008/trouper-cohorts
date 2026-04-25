"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";

type DailyCategory = "passer" | "eclaireur" | "package" | "exclients" | "qualifier";

type DailyContact = {
  id: string;
  name: string;
  phone?: string | null;
  city: string;
  companyHint: string;
  capsule: string;
  communityKnownBy: number;
  dominantTags: string[];
  externalNews: string;
};
type ImportedContactRow = {
  fullName: string;
  phone?: string | null;
  city?: string | null;
  companyHint?: string | null;
};
type QualifierData = {
  heat: HeatLevel;
  opportunityChoice: (typeof OPPORTUNITY_OPTIONS)[number]["id"] | null;
  communityTags: Array<(typeof COMMUNITY_OPTIONS)[number]["id"]>;
  estimatedGain: "Faible" | "Moyen" | "Eleve";
  qualifiedAtMs: number;
};
type HistoryEntry = {
  actionId?: string;
  contactId: string;
  name: string;
  action: Exclude<DailyCategory, "qualifier">;
  at: string;
  atMs: number;
  tagsSummary: string;
  sent: boolean;
  messageDraft?: string | null;
  sendChannel?: "whatsapp" | "other" | null;
  followupDueAtMs?: number | null;
  outcomeStatus?: "pending" | "replied" | "converted" | "not_interested" | null;
};
type BootstrapContactRow = {
  id: string;
  external_contact_ref: string | null;
  full_name?: string | null;
  city?: string | null;
  company_hint?: string | null;
  source?: string | null;
  phone_e164?: string | null;
  import_index?: number | null;
  is_favorite?: boolean | null;
  is_eclaireur_active?: boolean | null;
  eclaireur_activated_at?: string | null;
  trust_level: TrustLevel | null;
  priority_score?: number | null;
  potential_eur?: number | null;
  last_action_at?: string | null;
};
type BootstrapQualificationRow = {
  contact_id: string;
  heat: HeatLevel;
  opportunity_choice: OpportunityId | null;
  community_tags: CommunityId[];
  estimated_gain: "Faible" | "Moyen" | "Eleve";
  qualified_at: string | null;
  updated_at: string | null;
  created_at: string | null;
};
type BootstrapHistoryRow = {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_external_ref?: string | null;
  action_type: Exclude<DailyCategory, "qualifier">;
  status: "drafted" | "sent" | "validated_without_send";
  message_draft?: string | null;
  send_channel?: "whatsapp" | "other" | null;
  followup_due_at?: string | null;
  outcome_status?: "pending" | "replied" | "converted" | "not_interested" | null;
  created_at: string;
};
type BootstrapSessionRow = {
  metadata?: Record<string, unknown> | null;
  opportunities_activated: number;
  target_potential_eur?: number | null;
};
type BootstrapAlertRow = {
  contact_id: string | null;
  alert_type: "hot_ideal_unshared_24h" | "high_priority_no_response_48h";
  status: "open" | "dismissed" | "resolved";
};
type BootstrapFollowupRow = {
  action_id: string;
  contact_id: string;
  contact_name: string;
  action_type: Exclude<DailyCategory, "qualifier">;
  followup_due_at: string;
  priority_score: number;
  suggested_message: string;
};
type BootstrapMetrics = {
  total_sent: number;
  total_replied: number;
  total_converted: number;
  conversion_rate: number;
  avg_response_delay_hours: number;
  by_action: Array<{
    action_type: Exclude<DailyCategory, "qualifier">;
    sent: number;
    converted: number;
    conversion_rate: number;
  }>;
  top_converted_contacts: Array<{
    contact_id: string;
    contact_name: string;
    conversions: number;
  }>;
};
type BootstrapFollowupOps = {
  copied_today: number;
  replied_today: number;
  converted_today: number;
  not_interested_today: number;
  ignored_today: number;
};
type BootstrapExternalClicks = {
  linkedin_today: number;
  whatsapp_group_today: number;
};
type BootstrapEclaireurRow = {
  id: string;
  external_contact_ref: string | null;
  full_name?: string | null;
  city?: string | null;
  company_hint?: string | null;
  eclaireur_activated_at?: string | null;
  last_whatsapp_sent_at?: string | null;
  updated_at?: string | null;
  leads_detected?: number | null;
  leads_signed?: number | null;
  commission_total_eur?: number | null;
  scout_type?: "perso" | "pro" | null;
};
type FollowupItem = {
  actionId: string;
  contactId: string;
  contactName: string;
  actionType: Exclude<DailyCategory, "qualifier">;
  priorityScore: number;
  dueAtLabel: string;
  dueAtMs: number;
  suggestedMessage: string;
};

function toUiErrorMessage(value: unknown, fallback: string): string {
  if (!value) return fallback;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const merged = value
      .map((item) => toUiErrorMessage(item, ""))
      .filter(Boolean)
      .join(" | ");
    return merged || fallback;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const direct = [record.message, record.error, record.detail, record.details]
      .map((item) => toUiErrorMessage(item, ""))
      .find(Boolean);
    if (direct) return direct;
    try {
      return JSON.stringify(record);
    } catch {
      return fallback;
    }
  }
  return fallback;
}
type TransitionScreenState = {
  message: string;
  icon: string;
  from: number;
  to: number;
  final: boolean;
  manual?: boolean;
  ctaLabel?: string;
};
type TransitionAwaitingConfirmState = {
  action: Exclude<DailyCategory, "qualifier">;
  actionContactId: string;
  stayOnCurrentContact: boolean;
  returnToProfileContactId: string | null;
  countAsSent: boolean;
  sentInHistory: boolean;
};
type PendingWhatsAppContext = {
  transition: TransitionScreenState;
  awaitingConfirm: TransitionAwaitingConfirmState;
  contactId: string;
  createdAt: number;
};
type SmartScanProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  metier: string | null;
  buddy_name: string | null;
  buddy_metier: string | null;
  trio_name: string | null;
  trio_metier: string | null;
  eclaireur_reward_mode: "percent" | "fixed" | null;
  eclaireur_reward_percent: number | null;
  eclaireur_reward_fixed_eur: number | null;
  ville: string | null;
  phone: string | null;
  sector_id?: string | null;
  metier_label?: string | null;
  public_slug?: string | null;
  offre_decouverte?: string | null;
  bio?: string | null;
  contact_link?: string | null;
  onboarding_completed_at?: string | null;
  status: "active" | "paused" | "archived";
};
type SmartScanProfileForm = {
  firstName: string;
  lastName: string;
  metier: string;
  buddyName: string;
  buddyMetier: string;
  trioName: string;
  trioMetier: string;
  eclaireurRewardMode: "percent" | "fixed";
  eclaireurRewardPercent: string;
  eclaireurRewardFixedEur: string;
  ville: string;
  phone: string;
  sectorId?: string;
  metierLabel?: string;
  publicSlug?: string;
  offreDecouverte?: string;
  bio?: string;
  contactLink?: string;
};
type SectorVocabularyListItem = {
  sector_id: string;
  label: string;
  pipeline_steps: string[];
  is_active?: boolean;
};
const ONBOARDING_SECTOR_CATALOG: Array<{ sector_id: string; label: string }> = [
  { sector_id: "coach_sport", label: "Coach sportif" },
  { sector_id: "coach_biz", label: "Coach business" },
  { sector_id: "coach_vie", label: "Coach de vie" },
  { sector_id: "hypno", label: "Hypnotherapeute" },
  { sector_id: "sophrologie", label: "Sophrologue" },
  { sector_id: "psycho", label: "Psychologue liberal" },
  { sector_id: "psy_therapeute", label: "Psychotherapeute" },
  { sector_id: "kine", label: "Kinesitherapeute" },
  { sector_id: "osteo", label: "Osteopathe" },
  { sector_id: "naturo", label: "Naturopathe" },
  { sector_id: "nutrition", label: "Nutritionniste" },
  { sector_id: "dietetique", label: "Dieteticien" },
  { sector_id: "massage", label: "Praticien massage bien-etre" },
  { sector_id: "yoga", label: "Professeur de yoga" },
  { sector_id: "pilates", label: "Professeur de Pilates" },
  { sector_id: "estheticienne", label: "Estheticienne" },
  { sector_id: "coiffeur", label: "Coiffeur independant" },
  { sector_id: "maquilleuse", label: "Maquilleuse professionnelle" },
  { sector_id: "onglerie", label: "Prothesiste ongulaire" },
  { sector_id: "immo", label: "Agent immobilier" },
  { sector_id: "chasseur_immo", label: "Chasseur immobilier" },
  { sector_id: "courtier_immo", label: "Courtier immobilier" },
  { sector_id: "diagnostiqueur", label: "Diagnostiqueur immobilier" },
  { sector_id: "archi_interieur", label: "Architecte d interieur" },
  { sector_id: "courtier_credit", label: "Courtier en credit" },
  { sector_id: "cgp", label: "Conseiller en gestion de patrimoine" },
  { sector_id: "courtier_assurance", label: "Courtier assurance" },
  { sector_id: "expert_comptable", label: "Expert-comptable" },
  { sector_id: "comptable", label: "Comptable independant" },
  { sector_id: "avocat", label: "Avocat independant" },
  { sector_id: "notaire", label: "Notaire" },
  { sector_id: "huissier", label: "Huissier de justice" },
  { sector_id: "mediateur", label: "Mediateur" },
  { sector_id: "formateur", label: "Formateur professionnel" },
  { sector_id: "prof_particulier", label: "Professeur particulier" },
  { sector_id: "consultant_rh", label: "Consultant RH" },
  { sector_id: "consultant_marketing", label: "Consultant marketing" },
  { sector_id: "community_manager", label: "Community manager freelance" },
  { sector_id: "copywriter", label: "Copywriter" },
  { sector_id: "graphiste", label: "Graphiste freelance" },
  { sector_id: "photographe", label: "Photographe professionnel" },
  { sector_id: "videaste", label: "Videaste / realisateur" },
  { sector_id: "webdesigner", label: "Web designer freelance" },
  { sector_id: "developpeur", label: "Developpeur freelance" },
  { sector_id: "seo", label: "Consultant SEO" },
  { sector_id: "ads", label: "Expert publicite digitale" },
  { sector_id: "veterinaire", label: "Veterinaire liberal" },
  { sector_id: "toiletteur", label: "Toiletteur animalier" },
  { sector_id: "wedding_planner", label: "Wedding planner" },
  { sector_id: "traiteur", label: "Traiteur independant" },
  { sector_id: "dj", label: "DJ / Animateur" },
  { sector_id: "aide_domicile", label: "Aide a domicile" },
  { sector_id: "garde_enfants", label: "Garde d enfants / nounou" },
  { sector_id: "plombier", label: "Plombier independant" },
  { sector_id: "electricien", label: "Electricien independant" },
  { sector_id: "menuisier", label: "Menuisier / ebeniste" },
  { sector_id: "peintre", label: "Peintre en batiment" },
  { sector_id: "jardinier", label: "Jardinier independant" },
  { sector_id: "serrurier", label: "Serrurier" },
  { sector_id: "carreleur", label: "Carreleur" },
  { sector_id: "couvreur", label: "Couvreur" },
  { sector_id: "infirmier", label: "Infirmier liberal" },
  { sector_id: "sage_femme", label: "Sage-femme liberale" },
  { sector_id: "podologue", label: "Podologue" },
  { sector_id: "opticien", label: "Opticien independant" },
  { sector_id: "consultant_it", label: "Consultant IT" },
  { sector_id: "data_analyst", label: "Data analyst freelance" },
  { sector_id: "cybersecurite", label: "Expert cybersecurite" },
  { sector_id: "ia_consultant", label: "Consultant IA / automatisation" },
  { sector_id: "no_code", label: "Expert no-code / automation" },
  { sector_id: "other_custom", label: "Autre metier" },
];
const ONBOARDING_FEATURED_SECTOR_IDS = [
  "developpeur",
  "consultant_marketing",
  "coach_sport",
  "hypno",
  "nutrition",
  "dietetique",
  "immo",
  "courtier_immo",
  "avocat",
  "notaire",
  "electricien",
  "plombier",
  "estheticienne",
  "kine",
  "other_custom",
];
type SmartScanSelfScoutLink = {
  shortCode: string | null;
  shortUrl: string | null;
  inviteToken: string | null;
  fullUrl: string | null;
  previewUrl?: string | null;
  legacyShortUrl?: string | null;
  legacyFullUrl?: string | null;
};
type SmartScanEclaireurLink = {
  shortCode: string | null;
  shortUrl: string | null;
  fullUrl: string | null;
  legacyShortUrl?: string | null;
  legacyFullUrl?: string | null;
};
type SmartScanIncomingReferral = {
  id: string;
  scout_id: string;
  contact_name: string;
  contact_phone: string | null;
  project_type: string | null;
  comment: string | null;
  status: string;
  rejection_reason?: string | null;
  created_at: string;
  validated_at?: string | null;
  offered_at?: string | null;
  converted_at?: string | null;
  updated_at?: string;
  scout_name: string | null;
  scout_phone?: string | null;
  scout_ville?: string | null;
  scout_type?: "perso" | "pro" | null;
};
type SmartScanAllianceProspect = {
  id: string;
  full_name: string;
  metier: string;
  city: string | null;
  phone_e164: string | null;
  distance_km: number | null;
  rating: number | null;
  fit_score: number;
  fit_reasons?: string[] | null;
  status: "new" | "contacted" | "replied" | "partnered" | "dismissed";
  invite_sent_count?: number;
  invite_clicked_count?: number;
  invite_signed_up_count?: number;
  last_invite_status?: "drafted" | "sent" | "clicked" | "signed_up" | "declined" | null;
  last_invite_at?: string | null;
  partnership_probability?: number;
  source_mode?: "live" | "fallback";
  created_at?: string;
  updated_at?: string;
};
type SmartScanAllianceInvite = {
  id: string;
  prospect_id: string;
  prospect_name: string;
  prospect_metier: string;
  prospect_city: string | null;
  status: "drafted" | "sent" | "clicked" | "signed_up" | "declined";
  created_at: string;
  clicked_at?: string | null;
  sent_at?: string | null;
};
type AllianceDirectoryMode = "external" | "internal";

type HistoryVisualStatus = "sent" | "pending" | "converted";

const PENDING_WHATSAPP_CONTEXT_KEY = "popey-human:smart-scan:pending-whatsapp-context";
const SMART_SCAN_SESSION_KEY = "popey-human:smart-scan:scan-session";
const SMART_SCAN_IMPORTED_CONTACTS_KEY = "popey-human:smart-scan:imported-contacts";
const SMART_SCAN_IMPORTED_CONTACTS_BACKUP_KEY = "popey-human:smart-scan:imported-contacts-backup";
const SMART_SCAN_ECLAIREURS_KEY = "popey-human:smart-scan:eclaireurs";
const SMART_SCAN_DEFAULT_MESSAGES_KEY = "popey-human:smart-scan:default-messages";
const SMART_SCAN_PASSED_CONTACTS_KEY = "popey-human:smart-scan:passed-contacts";
const DAILY_CONTACT_LIMIT = 10;
const PROFILE_REQUEST_TIMEOUT_MS = 12000;
const PROFILE_BOOTSTRAP_FALLBACK_MS = 14000;

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

const OPPORTUNITY_OPTIONS = [
  { id: "can-buy", label: "💸 Peut acheter", score: 2 },
  { id: "ideal-client", label: "🎯 Client ideal", score: 3 },
  { id: "can-refer", label: "🤝 Peut recommander", score: 2 },
  { id: "opens-doors", label: "🚪 Ouvre des portes", score: 3 },
  { id: "identified-need", label: "🔥 Besoin à identifier", score: 2 },
  { id: "no-potential", label: "🚫 Aucun potentiel", score: 0 },
] as const;
const COMMUNITY_OPTIONS = [
  { id: "serious-work", label: "💼 Travail serieux", score: 1 },
  { id: "high-budget", label: "💰 Gere des budgets eleves", score: 2 },
  { id: "fast-reply", label: "⚡ Reactif / repond vite", score: 1 },
  { id: "slow-decider", label: "🐢 Long a decider", score: -1 },
  { id: "hard-close", label: "🚫 Difficile a closer", score: -2 },
  { id: "reliable-partner", label: "🤝 Fiable / bon partenaire", score: 1 },
  { id: "avoid", label: "⚠️ A eviter / complique", score: -3 },
  { id: "unknown", label: "❓ Inconnu / a decouvrir", score: 0 },
] as const;
type HeatLevel = "froid" | "tiede" | "brulant";
type ActivationAction = Exclude<DailyCategory, "passer" | "qualifier">;
type OpportunityId = (typeof OPPORTUNITY_OPTIONS)[number]["id"];
type CommunityId = (typeof COMMUNITY_OPTIONS)[number]["id"];
type TrustLevel = "family" | "pro-close" | "acquaintance";

const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

const ACTION_BASE_ORDER: ActivationAction[] = ["eclaireur", "package", "exclients"];
const ACTION_BASE_COPY: Record<ActivationAction, { title: string; subtitle: string }> = {
  eclaireur: { title: "✨ Eclaireur", subtitle: "Apport d affaire & Commission" },
  package: { title: "🧩 Partage Croise", subtitle: "Proposition de service" },
  exclients: { title: "📣 Ex-Clients (News)", subtitle: "Veille et relance" },
};

const ACTION_BUTTON_THEMES: Record<
  ActivationAction,
  {
    buttonClass: string;
    idlePulseClass: string;
    launchRingClass: string;
    titleClass: string;
    subtitleClass: string;
    burstGradient: string;
  }
> = {
  eclaireur: {
    buttonClass:
      "border-amber-300/45 bg-gradient-to-r from-amber-400/45 to-orange-400/35 text-amber-50 shadow-[0_18px_34px_-18px_rgba(251,191,36,0.95)]",
    idlePulseClass: "animate-pulse ring-2 ring-amber-300/40",
    launchRingClass: "scale-[1.03] ring-4 ring-amber-200/65",
    titleClass: "text-amber-50",
    subtitleClass: "text-amber-100/90",
    burstGradient:
      "bg-[radial-gradient(circle,rgba(255,255,255,0.98)_0%,rgba(254,240,138,0.92)_22%,rgba(251,146,60,0.55)_42%,rgba(251,191,36,0.15)_66%,transparent_78%)]",
  },
  package: {
    buttonClass: "border-fuchsia-300/35 bg-gradient-to-r from-violet-500/30 to-fuchsia-500/25 text-fuchsia-100",
    idlePulseClass: "animate-pulse ring-2 ring-fuchsia-300/35",
    launchRingClass: "scale-[1.03] ring-4 ring-fuchsia-200/65",
    titleClass: "text-fuchsia-100",
    subtitleClass: "text-fuchsia-100/90",
    burstGradient:
      "bg-[radial-gradient(circle,rgba(255,255,255,0.98)_0%,rgba(196,181,253,0.92)_22%,rgba(217,70,239,0.55)_42%,rgba(168,85,247,0.15)_66%,transparent_78%)]",
  },
  exclients: {
    buttonClass: "border-cyan-300/30 bg-cyan-500/12 text-cyan-100",
    idlePulseClass: "animate-pulse ring-2 ring-cyan-300/35",
    launchRingClass: "scale-[1.03] ring-4 ring-cyan-200/65",
    titleClass: "text-cyan-100",
    subtitleClass: "text-cyan-100/90",
    burstGradient:
      "bg-[radial-gradient(circle,rgba(255,255,255,0.98)_0%,rgba(103,232,249,0.92)_22%,rgba(34,211,238,0.55)_42%,rgba(56,189,248,0.15)_66%,transparent_78%)]",
  },
};

const OPPORTUNITY_UI_RULES: Partial<
  Record<
    OpportunityId,
    {
      priorityAction: ActivationAction;
      title: string;
      subtitle: string;
      cue: string;
    }
  >
> = {
  "ideal-client": {
    priorityAction: "package",
    title: "💜 Proposer un Pack",
    subtitle: "Client ideal detecte",
    cue: "Priorite violette",
  },
  "can-refer": {
    priorityAction: "eclaireur",
    title: "🥇 Activer mon Eclaireur",
    subtitle: "Levier de recommandation direct",
    cue: "Priorite doree",
  },
  "identified-need": {
    priorityAction: "exclients",
    title: "🔵 Prendre des nouvelles (Veille)",
    subtitle: "Besoin a qualifier rapidement",
    cue: "Priorite bleue",
  },
  "opens-doors": {
    priorityAction: "package",
    title: "🟣 Demander une mise en relation",
    subtitle: "Acces reseau a declencher",
    cue: "Priorite violette",
  },
};

const QUALIF_PROMPT_VARIABLES: Partial<Record<CommunityId, string>> = {
  "serious-work": "ton professionnalisme",
  "fast-reply": "ta reactivite",
  "reliable-partner": "le fait qu on puisse toujours compter sur toi",
};

const TRUST_LEVEL_OPTIONS: Array<{
  id: TrustLevel;
  label: string;
  helper: string;
  valueHint: string;
}> = [
  {
    id: "family",
    label: "Ami/Famille",
    helper: "Je peux l appeler a 21h",
    valueHint: "Valeur x10 en partage croise",
  },
  {
    id: "pro-close",
    label: "Pro Proche",
    helper: "On a deja bosse ensemble",
    valueHint: "Valeur elevee et relation solide",
  },
  {
    id: "acquaintance",
    label: "Connaissance",
    helper: "On s est croises une fois",
    valueHint: "Valeur initiale plus faible",
  },
];

function getDynamicActionEngine(qualifier?: QualifierData) {
  const byAction: Record<ActivationAction, { title: string; subtitle: string }> = { ...ACTION_BASE_COPY };
  const rule = qualifier?.opportunityChoice ? OPPORTUNITY_UI_RULES[qualifier.opportunityChoice] : undefined;
  const priorityAction = rule?.priorityAction;
  if (rule) {
    byAction[rule.priorityAction] = {
      title: rule.title,
      subtitle: rule.subtitle,
    };
  }
  const order = priorityAction
    ? [priorityAction, ...ACTION_BASE_ORDER.filter((action) => action !== priorityAction)]
    : ACTION_BASE_ORDER;

  return {
    order,
    byAction,
    priorityAction,
    cue: rule?.cue ?? null,
  };
}

function buildPromptCompliments(qualifier?: QualifierData) {
  if (!qualifier) return [];
  return qualifier.communityTags
    .map((tag) => QUALIF_PROMPT_VARIABLES[tag])
    .filter(Boolean) as string[];
}

function resolveAllianceMetiers(ownerProfile?: SmartScanProfile | null) {
  const metier1 = String(ownerProfile?.buddy_metier || "").trim() || "partenaire binome";
  const metier2 = String(ownerProfile?.trio_metier || "").trim() || "partenaire trio";
  return { metier1, metier2 };
}

function resolveOwnerMetierLabel(ownerProfile?: SmartScanProfile | null, fallback = "professionnel") {
  return String(ownerProfile?.metier_label || ownerProfile?.metier || "").trim() || fallback;
}

function resolveEclaireurRewardSentence(ownerProfile?: SmartScanProfile | null) {
  const mode = ownerProfile?.eclaireur_reward_mode;
  const percent = Number(ownerProfile?.eclaireur_reward_percent || 0);
  const fixed = Number(ownerProfile?.eclaireur_reward_fixed_eur || 0);
  if (mode === "fixed" && Number.isFinite(fixed) && fixed > 0) {
    return `et tu touches un fixe de ${Math.round(fixed)} euros sur chaque affaire conclue.`;
  }
  if (Number.isFinite(percent) && percent > 0) {
    return `et tu touches ${Math.round(percent)}% sur chaque affaire conclue.`;
  }
  return "et tu touches un pourcentage sur chaque affaire conclue.";
}

function buildTemplate(
  action: DailyCategory,
  contact: DailyContact,
  qualifier?: QualifierData,
  ownerProfile?: SmartScanProfile | null,
) {
  const firstName = contact.name.split(" ")[0];
  const ownerMetier = resolveOwnerMetierLabel(ownerProfile, "professionnel");
  const compliments = buildPromptCompliments(qualifier);
  const complimentsLine =
    compliments.length > 0
      ? `J apprecie vraiment ${compliments.join(" et ")}. `
      : "J aime notre facon de travailler ensemble. ";

  if (action === "eclaireur") {
    const { metier1, metier2 } = resolveAllianceMetiers(ownerProfile);
    const secteur = String(ownerProfile?.ville || contact.city || "ton secteur").trim() || "ton secteur";
    const rewardLine = resolveEclaireurRewardSentence(ownerProfile);
    return `Salut ${firstName}, je suis ${ownerMetier} et je viens de structurer une alliance strategique avec deux partenaires (un ${metier1} et un ${metier2}).

On a decide de mettre en place un systeme d antennes locales pour nous remonter des opportunites de terrain. J ai tout de suite pense a toi car tu as le profil ideal pour etre notre Eclaireur sur ${secteur}.

Le deal est simple : tu nous identifies un besoin, on gere 100% du dossier avec notre expertise, ${rewardLine} Ca peut vite representer un complement de revenu tres serieux a la fin du mois sans que tu n aies a travailler sur les dossiers.

Est-ce que tu serais ouvert a ce qu on teste ca sur un premier cas ?`;
  }
  if (action === "package") {
    return `Salut ${firstName}, ${complimentsLine}Je suis ${ownerMetier} et j ai une opportunite concrete a activer avec mon reseau local. Je peux te mettre en relation immediate pour ouvrir le dossier dans de bonnes conditions. Tu veux que je lance la mise en relation maintenant ?`;
  }
  if (action === "exclients") {
    return `Hello ${firstName}, ${complimentsLine}En tant que ${ownerMetier}, je prends des nouvelles car j ai vu des mouvements qui peuvent te concerner. Si tu veux, je te fais un point rapide et utile pour voir s il y a une opportunite a activer ensemble.`;
  }
  if (action === "qualifier") {
    return "Pas d envoi. Qualification communautaire uniquement.";
  }
  return "Passe pour ce cycle de 30 jours.";
}

function parseVcfContacts(raw: string): ImportedContactRow[] {
  // RFC6350 line folding: a newline followed by space/tab continues the previous line.
  const unfoldedRaw = raw.replace(/\r?\n[ \t]/g, "");
  const cards = unfoldedRaw.split(/END:VCARD/i);
  const rows: ImportedContactRow[] = [];
  cards.forEach((card) => {
    const fn = card.match(/(?:^|\n)FN[^:]*:(.+)/i)?.[1]?.trim();
    const tel = card.match(/(?:^|\n)TEL[^:]*:(.+)/i)?.[1]?.trim();
    const org = card.match(/(?:^|\n)ORG[^:]*:(.+)/i)?.[1]?.trim();
    const adr = card.match(/(?:^|\n)ADR[^:]*:(.+)/i)?.[1]?.trim();
    const city = adr ? adr.split(";")[3]?.trim() || "" : "";
    if (!fn && !tel) return;
    rows.push({
      fullName: fn || tel || "Contact",
      phone: tel || null,
      city: city || null,
      companyHint: org || null,
    });
  });
  return rows;
}

function splitCsvRow(line: string, delimiter: string): string[] {
  const cols: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      cols.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cols.push(current.trim());
  return cols.map((col) => col.replace(/^"|"$/g, ""));
}

function normalizeCsvHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase();
}

function detectCsvDelimiter(headerLine: string) {
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestCount = -1;
  candidates.forEach((delimiter) => {
    const count = headerLine.split(delimiter).length;
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  });
  return best;
}

function parseCsvContacts(raw: string): ImportedContactRow[] {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return [];
  const delimiter = detectCsvDelimiter(lines[0]);
  const headers = splitCsvRow(lines[0], delimiter).map(normalizeCsvHeader);
  const idxName = headers.findIndex((h) =>
    ["name", "nom", "full_name", "display_name", "formatted name"].some((token) => h.includes(token)),
  );
  const idxFirstName = headers.findIndex((h) => ["first name", "prenom", "given name"].some((token) => h.includes(token)));
  const idxLastName = headers.findIndex((h) => ["last name", "nom de famille", "family name"].some((token) => h.includes(token)));
  const idxPhone = headers.findIndex((h) =>
    ["phone", "telephone", "mobile", "numero", "num", "tel"].some((token) => h.includes(token)),
  );
  const idxCity = headers.findIndex((h) => ["city", "ville", "locality"].some((token) => h.includes(token)));
  const idxCompany = headers.findIndex((h) => ["company", "societe", "organization", "org", "entreprise"].some((token) => h.includes(token)));
  const rows: ImportedContactRow[] = [];
  lines.slice(1).forEach((line) => {
    const cols = splitCsvRow(line, delimiter);
    const firstName = idxFirstName >= 0 ? cols[idxFirstName] || "" : "";
    const lastName = idxLastName >= 0 ? cols[idxLastName] || "" : "";
    const combinedName = `${firstName} ${lastName}`.trim();
    const fullName = (idxName >= 0 ? cols[idxName] : "") || combinedName || (idxPhone >= 0 ? cols[idxPhone] : "");
    if (!fullName) return;
    rows.push({
      fullName,
      phone: idxPhone >= 0 ? cols[idxPhone] || null : null,
      city: idxCity >= 0 ? cols[idxCity] || null : null,
      companyHint: idxCompany >= 0 ? cols[idxCompany] || null : null,
    });
  });
  return rows;
}

function buildDailyContactsFromImport(rows: ImportedContactRow[]): DailyContact[] {
  const dedup = new Set<string>();
  const normalized = rows
    .map((row) => {
      const name = String(row.fullName || "").trim();
      const city = String(row.city || "Inconnue").trim() || "Inconnue";
      const companyHint = String(row.companyHint || "Réseau perso").trim() || "Réseau perso";
      const phoneDigits = String(row.phone || "").replace(/\D/g, "");
      const phoneRaw = String(row.phone || "").trim();
      const key = `${name.toLowerCase()}|${phoneDigits}`;
      return { name, city, companyHint, phoneDigits, phoneRaw, key };
    })
    .filter((row) => row.name.length > 0)
    .filter((row) => {
      if (dedup.has(row.key)) return false;
      dedup.add(row.key);
      return true;
    });

  return normalized.map((row, idx) => ({
    id: `import-${idx + 1}-${row.phoneDigits.slice(-4) || "0000"}`,
    name: row.name,
    phone: row.phoneRaw || null,
    city: row.city,
    companyHint: row.companyHint,
    capsule: "Importe depuis ton telephone",
    communityKnownBy: Math.max(1, 1 + (idx % 4)),
    dominantTags: ["📱 Contact importe", "🤝 A qualifier"],
    externalNews: "Profil importe depuis ton annuaire",
  }));
}

function normalizePhoneForWhatsApp(phone?: string | null) {
  const raw = String(phone || "").trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("33")) return digits;
  if (digits.startsWith("0") && digits.length >= 9) return `33${digits.slice(1)}`;
  if (digits.length < 8) return null;
  return digits;
}

function referralStatusLabel(status: string) {
  if (status === "submitted") return "Opportunite recue";
  if (status === "validated") return "RDV pris";
  if (status === "offered") return "Offre envoyee";
  if (status === "converted") return "Signature finale";
  if (status === "rejected") return "Refusee";
  return status || "Inconnu";
}

function referralStatusRank(status: string) {
  if (status === "submitted") return 0;
  if (status === "validated") return 1;
  if (status === "offered") return 2;
  if (status === "converted") return 3;
  return -1;
}

function formatDateTimeShort(value?: string | null) {
  if (!value) return "Date inconnue";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  const day = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${day} a ${time}`;
}

function allianceMetierTone(metier: string) {
  const raw = String(metier || "").toLowerCase();
  if (/notaire|avocat|jurid|comptable|fiscal/.test(raw)) {
    return "border-violet-300/35 bg-violet-300/15 text-violet-100";
  }
  if (/nutrition|coach|therap|psych|sante|kine|soin/.test(raw)) {
    return "border-emerald-300/35 bg-emerald-300/15 text-emerald-100";
  }
  if (/dev|informat|web|seo|marketing|design/.test(raw)) {
    return "border-cyan-300/35 bg-cyan-300/15 text-cyan-100";
  }
  if (/immo|courtier|banque|finance|assurance/.test(raw)) {
    return "border-amber-300/35 bg-amber-300/15 text-amber-100";
  }
  return "border-white/25 bg-white/10 text-white/85";
}

function historyMessageSnippet(message?: string | null) {
  const normalized = String(message || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "Aucun texte conserve pour cette action.";
  if (normalized.length <= 60) return normalized;
  return `${normalized.slice(0, 60)}...`;
}

function normalizePublicSlugInput(input: string) {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function getLocalDayNumber() {
  const now = new Date();
  const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor(localMidnight.getTime() / (24 * 60 * 60 * 1000));
}

function buildDailyQueueFromImportedContacts(
  allContacts: DailyContact[],
  limit: number,
  dayNumber: number,
  excludedContactIds?: Set<string>,
) {
  if (allContacts.length === 0) return [];
  const safeLimit = Math.max(1, limit);
  const availableContacts = excludedContactIds?.size
    ? allContacts.filter((contact) => !excludedContactIds.has(contact.id))
    : allContacts;
  const source = availableContacts.length > 0 ? availableContacts : allContacts;
  const start = ((dayNumber * safeLimit) % source.length + source.length) % source.length;
  const queue: DailyContact[] = [];
  for (let i = 0; i < source.length; i += 1) {
    const contact = source[(start + i) % source.length];
    if (!contact) continue;
    queue.push(contact);
  }
  return queue;
}

export default function EntrepreneurSmartScanTestPage() {
  const [stage, setStage] = useState<"scan" | "daily">("scan");
  const [scanCount, setScanCount] = useState(0);
  const [index, setIndex] = useState(0);
  const [selectedAction, setSelectedAction] = useState<DailyCategory | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [defaultMessageStore, setDefaultMessageStore] = useState<Partial<Record<ActivationAction, string>>>({});
  const [launchingAction, setLaunchingAction] = useState<Exclude<DailyCategory, "passer" | "qualifier"> | null>(null);
  const [qualifierHeat, setQualifierHeat] = useState<HeatLevel | null>(null);
  const [hasChosenHeat, setHasChosenHeat] = useState(false);
  const [qualifierStep, setQualifierStep] = useState<1 | 2 | 3>(1);
  const [qualifierDirection, setQualifierDirection] = useState<1 | -1>(1);
  const [communityTagPage, setCommunityTagPage] = useState(0);
  const [opportunityChoice, setOpportunityChoice] = useState<(typeof OPPORTUNITY_OPTIONS)[number]["id"] | null>(null);
  const [communityTags, setCommunityTags] = useState<Array<(typeof COMMUNITY_OPTIONS)[number]["id"]>>([]);
  const [sentCount, setSentCount] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [successPulse, setSuccessPulse] = useState(false);
  const [showProgressCheck, setShowProgressCheck] = useState(false);
  const [softLearningHint, setSoftLearningHint] = useState("");
  const [qualificationPivot, setQualificationPivot] = useState<{ contactId: string; firstName: string; tag: string } | null>(null);
  const [actionGlowContactId, setActionGlowContactId] = useState<string | null>(null);
  const [transitionScreen, setTransitionScreen] = useState<TransitionScreenState | null>(null);
  const [transitionAwaitingConfirm, setTransitionAwaitingConfirm] = useState<TransitionAwaitingConfirmState | null>(null);
  const [pendingTransition, setPendingTransition] = useState<{
    message: string;
    icon: string;
    from: number;
    to: number;
    final: boolean;
  } | null>(null);
  const [pendingFinalizeAction, setPendingFinalizeAction] = useState<Exclude<DailyCategory, "qualifier"> | null>(null);
  const [pendingReturnProfileContactId, setPendingReturnProfileContactId] = useState<string | null>(null);
  const [qualifierAutoOpenPausedUntilMs, setQualifierAutoOpenPausedUntilMs] = useState(0);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [searchInnerTab, setSearchInnerTab] = useState<"search" | "history">("search");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<"all" | "sent" | "validated">("all");
  const [historyActionFilter, setHistoryActionFilter] = useState<"all" | Exclude<DailyCategory, "qualifier">>("all");
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState<"all" | "today" | "7d">("all");
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showEclaireursPanel, setShowEclaireursPanel] = useState(false);
  const [showAlliancesPanel, setShowAlliancesPanel] = useState(false);
  const [showMyProfilePanel, setShowMyProfilePanel] = useState(false);
  const [myProfile, setMyProfile] = useState<SmartScanProfile | null>(null);
  const [selfScoutLink, setSelfScoutLink] = useState<SmartScanSelfScoutLink | null>(null);
  const [profileForm, setProfileForm] = useState<SmartScanProfileForm>({
    firstName: "",
    lastName: "",
    metier: "",
    buddyName: "",
    buddyMetier: "",
    trioName: "",
    trioMetier: "",
    eclaireurRewardMode: "percent",
    eclaireurRewardPercent: "",
    eclaireurRewardFixedEur: "",
    ville: "",
    phone: "",
    sectorId: "",
    metierLabel: "",
    publicSlug: "",
    offreDecouverte: "",
    bio: "",
    contactLink: "",
  });
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isCopyingSelfScoutLink, setIsCopyingSelfScoutLink] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showTrustLevelPrompt, setShowTrustLevelPrompt] = useState(false);
  const [trustPromptContactId, setTrustPromptContactId] = useState<string | null>(null);
  const [showContactProfile, setShowContactProfile] = useState(false);
  const [profileContactId, setProfileContactId] = useState<string | null>(null);
  const [showProfileActions, setShowProfileActions] = useState(false);
  const [actionFromProfileContactId, setActionFromProfileContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [trustLevelStore, setTrustLevelStore] = useState<Record<string, TrustLevel>>({});
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [expandedHistoryEntryKeys, setExpandedHistoryEntryKeys] = useState<string[]>([]);
  const [passedContactIds, setPassedContactIds] = useState<string[]>([]);
  const [qualifierStore, setQualifierStore] = useState<Record<string, QualifierData>>({});
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  const [priorityScoreStore, setPriorityScoreStore] = useState<Record<string, number>>({});
  const [potentialEurStore, setPotentialEurStore] = useState<Record<string, number>>({});
  const [dailyTargetPotential, setDailyTargetPotential] = useState(0);
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [aiPromptVersion, setAiPromptVersion] = useState<string | null>(null);
  const [aiGeneratedAt, setAiGeneratedAt] = useState<string | null>(null);
  const [aiGenerationSource, setAiGenerationSource] = useState<"ai" | "fallback" | null>(null);
  const [dueFollowups, setDueFollowups] = useState<FollowupItem[]>([]);
  const [followupFilter, setFollowupFilter] = useState<"all" | "overdue">("all");
  const [isBatchCopyingFollowups, setIsBatchCopyingFollowups] = useState(false);
  const [isExportingDailyReport, setIsExportingDailyReport] = useState(false);
  const [conversionMetrics, setConversionMetrics] = useState<BootstrapMetrics | null>(null);
  const [followupOpsStats, setFollowupOpsStats] = useState<BootstrapFollowupOps | null>(null);
  const [externalClickStats, setExternalClickStats] = useState<BootstrapExternalClicks | null>(null);
  const [eclaireurIds, setEclaireurIds] = useState<string[]>([]);
  const [eclaireurStatsStore, setEclaireurStatsStore] = useState<Record<string, { leadsDetected: number; leadsSigned: number; commissionTotalEur: number; lastNewsAtMs: number }>>({});
  const [eclaireurDirectory, setEclaireurDirectory] = useState<Record<string, { id: string; name: string; city: string; scoutType: "perso" | "pro" }>>({});
  const [eclaireurSort, setEclaireurSort] = useState<"inactive_oldest" | "inactive_recent">("inactive_oldest");
  const [selectedEclaireurTemplateContactId, setSelectedEclaireurTemplateContactId] = useState<string | null>(null);
  const [eclaireurTemplates, setEclaireurTemplates] = useState<Array<{ id: string; label: string; message: string }>>([]);
  const [importedContacts, setImportedContacts] = useState<DailyContact[]>([]);
  const [importSummary, setImportSummary] = useState<string>("");
  const [isImportingContacts, setIsImportingContacts] = useState(false);
  const [supportsDirectContactPicker, setSupportsDirectContactPicker] = useState(false);
  const [showImportHelp, setShowImportHelp] = useState(false);
  const [isCockpitCollapsed, setIsCockpitCollapsed] = useState(true);
  const [hasHydratedLocalSession, setHasHydratedLocalSession] = useState(false);
  const [hasHydratedServerProgress, setHasHydratedServerProgress] = useState(false);
  const [modalErrorMessage, setModalErrorMessage] = useState("");
  const [modalInfoMessage, setModalInfoMessage] = useState("");
  const [dismissedQualifierContactId, setDismissedQualifierContactId] = useState<string | null>(null);
  const [selectedImportedScoutId, setSelectedImportedScoutId] = useState("");
  const [manualScoutName, setManualScoutName] = useState("");
  const [manualScoutCity, setManualScoutCity] = useState("");
  const [manualScoutPhone, setManualScoutPhone] = useState("");
  const [manualScoutFirstName, setManualScoutFirstName] = useState("");
  const [manualScoutLastName, setManualScoutLastName] = useState("");
  const [manualScoutMetier, setManualScoutMetier] = useState("");
  const [showAddScoutModal, setShowAddScoutModal] = useState(false);
  const [eclaireurLinksByContactId, setEclaireurLinksByContactId] = useState<Record<string, SmartScanEclaireurLink>>({});
  const [loadingEclaireurLinkContactId, setLoadingEclaireurLinkContactId] = useState<string | null>(null);
  const [copyingEclaireurLinkContactId, setCopyingEclaireurLinkContactId] = useState<string | null>(null);
  const [incomingReferrals, setIncomingReferrals] = useState<SmartScanIncomingReferral[]>([]);
  const [isIncomingReferralsLoading, setIsIncomingReferralsLoading] = useState(false);
  const [selectedIncomingReferralId, setSelectedIncomingReferralId] = useState<string | null>(null);
  const [incomingSignedAmount, setIncomingSignedAmount] = useState("");
  const [isIncomingReferralStatusUpdating, setIsIncomingReferralStatusUpdating] = useState(false);
  const [showDealCelebration, setShowDealCelebration] = useState(false);
  const [showAllianceMetricsInfo, setShowAllianceMetricsInfo] = useState(false);
  const [showBoostInfo, setShowBoostInfo] = useState(false);
  const [showAddScoutTooltip, setShowAddScoutTooltip] = useState(false);
  const [hasSeenAddScoutTooltip, setHasSeenAddScoutTooltip] = useState(false);
  const [recoAlertPulse, setRecoAlertPulse] = useState(false);
  const [showPotentialBreakdownSheet, setShowPotentialBreakdownSheet] = useState(false);
  const [showGainPotentialSheet, setShowGainPotentialSheet] = useState(false);
  const [gainTooltipOpenCount, setGainTooltipOpenCount] = useState(0);
  const [showMessagePersonalizationField, setShowMessagePersonalizationField] = useState(false);
  const [messagePersonalizationNote, setMessagePersonalizationNote] = useState("");
  const [isEditingMessageDraft, setIsEditingMessageDraft] = useState(false);
  const [isRemovingEclaireurId, setIsRemovingEclaireurId] = useState<string | null>(null);
  const [showQualificationNeededPopup, setShowQualificationNeededPopup] = useState(false);
  const [copiedHistoryEntryKey, setCopiedHistoryEntryKey] = useState<string | null>(null);
  const [allianceProspects, setAllianceProspects] = useState<SmartScanAllianceProspect[]>([]);
  const [allianceInvites, setAllianceInvites] = useState<SmartScanAllianceInvite[]>([]);
  const [isAllianceInvitesLoading, setIsAllianceInvitesLoading] = useState(false);
  const [allianceSort, setAllianceSort] = useState<"probability" | "fit" | "distance" | "recent">("probability");
  const [isAlliancesLoading, setIsAlliancesLoading] = useState(false);
  const [isAlliancesSearching, setIsAlliancesSearching] = useState(false);
  const [allianceDirectoryMode, setAllianceDirectoryMode] = useState<AllianceDirectoryMode>("external");
  const [allianceCity, setAllianceCity] = useState("");
  const [allianceSourceMetier, setAllianceSourceMetier] = useState("");
  const [allianceTargetMetiersInput, setAllianceTargetMetiersInput] = useState("");
  const [allianceRadiusKm, setAllianceRadiusKm] = useState("15");
  const [showAllianceInvitesModal, setShowAllianceInvitesModal] = useState(false);
  const [internalAllianceInvites, setInternalAllianceInvites] = useState<SmartScanAllianceInvite[]>([]);
  const [isInternalInvitesLoading, setIsInternalInvitesLoading] = useState(false);
  const [showInternalInvitesModal, setShowInternalInvitesModal] = useState(false);
  const [showOnboardingJ0, setShowOnboardingJ0] = useState(false);
  const [onboardingFlowLocked, setOnboardingFlowLocked] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [onboardingSectorQuery, setOnboardingSectorQuery] = useState("");
  const [onboardingSectors, setOnboardingSectors] = useState<SectorVocabularyListItem[]>([]);
  const [onboardingSelectedSectorId, setOnboardingSelectedSectorId] = useState("other_custom");
  const [onboardingCustomMetier, setOnboardingCustomMetier] = useState("");
  const [onboardingQualificationType, setOnboardingQualificationType] = useState<OpportunityId | null>(null);
  const [onboardingQualificationHeat, setOnboardingQualificationHeat] = useState<HeatLevel | null>(null);
  const [onboardingMessageDraft, setOnboardingMessageDraft] = useState("");
  const [onboardingStartedAtMs, setOnboardingStartedAtMs] = useState(0);
  const [isOnboardingSaving, setIsOnboardingSaving] = useState(false);
  const [hasProfileBootstrapResolved, setHasProfileBootstrapResolved] = useState(false);
  const [revealedAllianceProspectIds, setRevealedAllianceProspectIds] = useState<string[]>([]);
  const [isAllianceRevealRunning, setIsAllianceRevealRunning] = useState(false);
  const [showAllianceMessageModal, setShowAllianceMessageModal] = useState(false);
  const [selectedAllianceProspect, setSelectedAllianceProspect] = useState<SmartScanAllianceProspect | null>(null);
  const [allianceMessageDraft, setAllianceMessageDraft] = useState("");
  const [isAllianceMessageSending, setIsAllianceMessageSending] = useState(false);
  const allianceRevealTimeoutsRef = useRef<number[]>([]);
  const contactImportInputRef = useRef<HTMLInputElement | null>(null);
  const localDayNumber = useMemo(() => getLocalDayNumber(), []);

  const hasImportedContacts = importedContacts.length > 0;
  const importedTotalCount = importedContacts.length;
  const dailyQueueCount = hasImportedContacts ? Math.min(DAILY_CONTACT_LIMIT, importedTotalCount) : DAILY_CONTACT_LIMIT;
  const allContactsData = hasImportedContacts ? importedContacts : CONTACTS;
  const parkedContactIds = useMemo(() => {
    const latestActionByContact = new Map<string, { action: HistoryEntry["action"]; atMs: number }>();
    historyEntries.forEach((entry) => {
      const previous = latestActionByContact.get(entry.contactId);
      if (!previous || entry.atMs > previous.atMs) {
        latestActionByContact.set(entry.contactId, { action: entry.action, atMs: entry.atMs });
      }
    });
    const fromHistory = Array.from(latestActionByContact.entries())
      .filter(([, value]) => value.action === "passer")
      .map(([contactId]) => contactId);
    return new Set(
      [
        ...fromHistory,
        ...passedContactIds,
      ].filter(Boolean),
    );
  }, [historyEntries, passedContactIds]);
  const contactsData =
    buildDailyQueueFromImportedContacts(allContactsData, dailyQueueCount, localDayNumber, parkedContactIds);
  const dailyQueueStart = hasImportedContacts && importedTotalCount > 0 ? (localDayNumber * dailyQueueCount) % importedTotalCount : 0;
  const dailyQueueEnd = hasImportedContacts ? Math.min(importedTotalCount, dailyQueueStart + dailyQueueCount) : 0;
  const dailyQueueWraps = hasImportedContacts && dailyQueueStart + dailyQueueCount > importedTotalCount;
  const dailyQueueLabel = !hasImportedContacts
    ? ""
    : dailyQueueWraps
      ? `${dailyQueueStart + 1}-${importedTotalCount} + 1-${(dailyQueueStart + dailyQueueCount) % importedTotalCount}`
      : `${dailyQueueStart + 1}-${dailyQueueEnd}`;
  const current = contactsData[index] ?? contactsData[contactsData.length - 1];
  const profileContact = allContactsData.find((contact) => contact.id === profileContactId) ?? null;
  const onboardingFirstContact = importedContacts[0] || allContactsData[0] || null;
  const onboardingSectorCatalog = useMemo(() => {
    const byId = new Map<string, SectorVocabularyListItem>();
    onboardingSectors.forEach((sector) => {
      byId.set(sector.sector_id, sector);
    });
    ONBOARDING_SECTOR_CATALOG.forEach((sector) => {
      if (byId.has(sector.sector_id)) return;
      byId.set(sector.sector_id, {
        sector_id: sector.sector_id,
        label: sector.label,
        pipeline_steps: [],
        is_active: true,
      });
    });
    if (!byId.has("other_custom")) {
      byId.set("other_custom", {
        sector_id: "other_custom",
        label: "Autre metier",
        pipeline_steps: [],
        is_active: true,
      });
    }
    return Array.from(byId.values());
  }, [onboardingSectors]);
  const onboardingFilteredSectors = onboardingSectorCatalog.filter((sector) => {
    const needle = onboardingSectorQuery.trim().toLowerCase();
    if (!needle) return true;
    return sector.label.toLowerCase().includes(needle) || sector.sector_id.toLowerCase().includes(needle);
  });
  const onboardingDisplayedSectors =
    onboardingSectorQuery.trim().length > 0
      ? onboardingFilteredSectors
      : [...onboardingFilteredSectors]
          .sort(
            (a, b) => {
              const indexA = ONBOARDING_FEATURED_SECTOR_IDS.indexOf(a.sector_id);
              const indexB = ONBOARDING_FEATURED_SECTOR_IDS.indexOf(b.sector_id);
              const safeA = indexA === -1 ? 999 : indexA;
              const safeB = indexB === -1 ? 999 : indexB;
              return safeA - safeB;
            },
          )
          .slice(0, 15);
  const onboardingHasExactSectorMatch = onboardingSectorCatalog.some((sector) =>
    sector.label.toLowerCase() === onboardingSectorQuery.trim().toLowerCase(),
  );
  const onboardingShowOtherOption =
    onboardingSectorQuery.trim().length > 0 &&
    onboardingFilteredSectors.length === 0 &&
    !onboardingHasExactSectorMatch;
  const publicProfileSlug = String(myProfile?.public_slug || profileForm.publicSlug || "").trim();
  const publicProfileUrl = publicProfileSlug ? `https://www.popey.academy/popey-link/${publicProfileSlug}` : "";
  const totalScanned = hasImportedContacts ? importedTotalCount : 0;
  const scanDone = hasImportedContacts && totalScanned > 0 && scanCount >= totalScanned;
  const scanProgress = totalScanned > 0 ? Math.min(1, scanCount / totalScanned) : 0;
  const scanProgressPercent = Math.min(100, Math.round(scanProgress * 100));
  const importedQualifiedCount = importedContacts.filter((contact) => Boolean(qualifierStore[contact.id])).length;
  const importedFavoriteCount = importedContacts.filter((contact) => favoriteIds.includes(contact.id)).length;
  const importedReviewCount = Math.max(0, totalScanned - importedQualifiedCount);
  const globalProcessedCount = hasImportedContacts ? Math.min(importedTotalCount, importedQualifiedCount + Math.min(index, dailyQueueCount)) : 0;
  const liveProfiles = Math.min(totalScanned, Math.round(importedQualifiedCount * scanProgress));
  const liveLocals = Math.min(totalScanned, Math.round(totalScanned * scanProgress));
  const liveHotSignals = Math.min(totalScanned, Math.round(importedFavoriteCount * scanProgress));
  const liveInReview = Math.min(totalScanned, Math.round(importedReviewCount * scanProgress));
  const scanCards = [
    {
      id: "locals",
      icon: "📍",
      value: scanDone ? importedTotalCount : liveLocals,
      title: "Importes",
      subtitle: "contacts reels charges",
      color: "from-cyan-400/25 to-blue-400/20 border-cyan-300/40",
      valueColor: "text-cyan-100",
    },
    {
      id: "active",
      icon: "⚡",
      value: scanDone ? importedQualifiedCount : liveProfiles,
      title: "Qualifies",
      subtitle: "contacts deja qualifies",
      color: "from-violet-400/25 to-fuchsia-400/20 border-violet-300/40",
      valueColor: "text-violet-100",
    },
    {
      id: "hot",
      icon: "🔥",
      value: scanDone ? importedFavoriteCount : liveHotSignals,
      title: "Favoris",
      subtitle: "suivi prioritaire",
      color: "from-amber-400/30 to-orange-400/20 border-amber-300/40",
      valueColor: "text-amber-100",
    },
    {
      id: "review",
      icon: "🧠",
      value: scanDone ? importedReviewCount : liveInReview,
      title: "A qualifier",
      subtitle: "qualification a faire",
      color: "from-emerald-400/25 to-teal-400/20 border-emerald-300/40",
      valueColor: "text-emerald-100",
    },
  ] as const;
  const heatScore = Math.min(99, 55 + current.communityKnownBy * 10 + (current.externalNews ? 8 : 0));
  const sourceRing =
    current.communityKnownBy >= 3
      ? "from-emerald-300 via-cyan-300 to-indigo-300"
      : current.communityKnownBy === 2
        ? "from-cyan-300 via-indigo-300 to-fuchsia-300"
        : "from-amber-300 via-orange-300 to-fuchsia-300";
  const currentQualifier = qualifierStore[current.id];
  const isQualified = Boolean(currentQualifier?.opportunityChoice && currentQualifier.communityTags.length > 0);
  const actionEngine = useMemo(() => getDynamicActionEngine(currentQualifier), [currentQualifier]);
  const actionButtons = actionEngine.order.map((action) => ({
    action,
    ...actionEngine.byAction[action],
    isPriority: actionEngine.priorityAction === action,
  }));
  const primaryDailyAction = actionEngine.priorityAction || actionEngine.order[0];
  const quickLabelMap = useMemo(
    () =>
      Object.fromEntries(
        [...OPPORTUNITY_OPTIONS, ...COMMUNITY_OPTIONS].map((item) => [item.id, item.label]),
      ),
    [],
  );
  const adnPopey = useMemo(() => {
    const qualified = qualifierStore[current.id];
    if (!qualified) {
      return [{ label: "❓ A decouvrir", count: 1 }];
    }

    const aggregateIds = [
      qualified.opportunityChoice,
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
  const searchResults = allContactsData
    .filter((contact) => `${contact.name} ${contact.city} ${contact.companyHint}`.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    .sort((a, b) => (priorityScoreStore[b.id] || 0) - (priorityScoreStore[a.id] || 0));
  const eclaireursList = eclaireurIds
    .map((id) => {
      const fromAllContacts = allContactsData.find((contact) => contact.id === id);
      if (fromAllContacts) {
        return {
          id: fromAllContacts.id,
          name: fromAllContacts.name,
          city: fromAllContacts.city,
          scoutType: eclaireurDirectory[id]?.scoutType || "perso" as "perso" | "pro",
        };
      }
      return eclaireurDirectory[id] || null;
    })
    .filter((contact): contact is { id: string; name: string; city: string; scoutType: "perso" | "pro" } => Boolean(contact))
    .sort((a, b) => {
      const statsA = eclaireurStatsStore[a.id];
      const statsB = eclaireurStatsStore[b.id];
      const inactivityA = statsA?.lastNewsAtMs || 0;
      const inactivityB = statsB?.lastNewsAtMs || 0;
      if (eclaireurSort === "inactive_recent") {
        return inactivityB - inactivityA;
      }
      return inactivityA - inactivityB;
    });
  const scoutCandidateSource = importedContacts.length > 0 ? importedContacts : allContactsData;
  const importedScoutCandidates = scoutCandidateSource
    .filter((contact) => !eclaireurIds.includes(contact.id))
    .map((contact) => ({
      id: contact.id,
      label: [contact.name, contact.city || null, contact.phone || null].filter(Boolean).join(" • "),
    }));
  const hasImportedScoutCandidates = importedScoutCandidates.length > 0;
  const selectedEclaireurTemplateContact = selectedEclaireurTemplateContactId
    ? eclaireursList.find((contact) => contact.id === selectedEclaireurTemplateContactId) || eclaireurDirectory[selectedEclaireurTemplateContactId] || null
    : null;
  const selectedIncomingReferral = selectedIncomingReferralId
    ? incomingReferrals.find((item) => item.id === selectedIncomingReferralId) || null
    : null;
  const eclaireurHeaderStats = useMemo(() => {
    const proIds = new Set<string>();
    const persoIds = new Set<string>();
    incomingReferrals.forEach((item) => {
      const scoutId = String(item.scout_id || "").trim();
      if (!scoutId) return;
      if (item.scout_type === "pro") {
        proIds.add(scoutId);
      } else {
        persoIds.add(scoutId);
      }
    });
    return {
      proCount: proIds.size,
      persoCount: persoIds.size,
      totalCount: proIds.size + persoIds.size,
      alertesCount: incomingReferrals.length,
    };
  }, [incomingReferrals]);
  const sortedAllianceProspects = useMemo(() => {
    const list = [...allianceProspects];
    if (allianceSort === "fit") {
      return list.sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0));
    }
    if (allianceSort === "distance") {
      return list.sort((a, b) => {
        const da = Number.isFinite(Number(a.distance_km)) ? Number(a.distance_km) : 9999;
        const db = Number.isFinite(Number(b.distance_km)) ? Number(b.distance_km) : 9999;
        return da - db;
      });
    }
    if (allianceSort === "recent") {
      return list.sort((a, b) => {
        const ta = new Date(a.last_invite_at || a.updated_at || a.created_at || 0).getTime();
        const tb = new Date(b.last_invite_at || b.updated_at || b.created_at || 0).getTime();
        return tb - ta;
      });
    }
    return list.sort((a, b) => (b.partnership_probability || 0) - (a.partnership_probability || 0));
  }, [allianceProspects, allianceSort]);
  const displayedAllianceProspects = useMemo(() => {
    if (!isAllianceRevealRunning) return sortedAllianceProspects;
    const visible = new Set(revealedAllianceProspectIds);
    return sortedAllianceProspects.filter((item) => visible.has(item.id));
  }, [isAllianceRevealRunning, revealedAllianceProspectIds, sortedAllianceProspects]);
  const activeAllianceInvites = allianceDirectoryMode === "internal" ? internalAllianceInvites : allianceInvites;
  const scopedActionContact = actionFromProfileContactId
    ? allContactsData.find((contact) => contact.id === actionFromProfileContactId) || current
    : current;
  const scopedActionQualifier = qualifierStore[scopedActionContact.id];

  useEffect(() => {
    if (!selectedImportedScoutId && importedScoutCandidates[0]?.id) {
      setSelectedImportedScoutId(importedScoutCandidates[0].id);
    }
  }, [importedScoutCandidates, selectedImportedScoutId]);

  useEffect(() => {
    if (!showEclaireursPanel) return;
    let cancelled = false;
    async function loadIncomingReferrals() {
      try {
        setIsIncomingReferralsLoading(true);
        const response = await fetch("/api/popey-human/smart-scan/scout-referrals", { method: "GET", cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as { error?: string; referrals?: SmartScanIncomingReferral[] };
        if (!response.ok) {
          throw new Error(payload.error || "Impossible de charger les opportunites entrantes.");
        }
        if (!cancelled) {
          setIncomingReferrals(payload.referrals || []);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Impossible de charger les opportunites entrantes.";
          setApiErrorMessage(message);
        }
      } finally {
        if (!cancelled) {
          setIsIncomingReferralsLoading(false);
        }
      }
    }
    void loadIncomingReferrals();
    return () => {
      cancelled = true;
    };
  }, [showEclaireursPanel]);

  useEffect(() => {
    if (!myProfile) return;
    setAllianceCity((currentCity) => currentCity || myProfile.ville || "");
    setAllianceSourceMetier((currentMetier) => currentMetier || resolveOwnerMetierLabel(myProfile, ""));
  }, [myProfile]);

  useEffect(() => {
    if (!showAlliancesPanel) return;
    let cancelled = false;
    async function loadAlliancesProspects() {
      try {
        setIsAlliancesLoading(true);
        const provider = allianceDirectoryMode === "internal" ? "internal" : "b2b";
        const response = await fetch(`/api/popey-human/smart-scan/alliances/prospects?provider=${provider}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          prospects?: SmartScanAllianceProspect[];
        };
        if (!response.ok) {
          throw new Error(payload.error || "Impossible de charger les alliances externes.");
        }
        if (!cancelled) {
          setAllianceProspects(payload.prospects || []);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Impossible de charger les alliances externes.";
          setApiErrorMessage(message);
        }
      } finally {
        if (!cancelled) {
          setIsAlliancesLoading(false);
        }
      }
    }
    void loadAlliancesProspects();
    if (allianceDirectoryMode === "internal") {
      void loadInternalAllianceInvites();
    } else {
      void loadAllianceInvites();
    }
    return () => {
      cancelled = true;
    };
  }, [showAlliancesPanel, allianceDirectoryMode]);
  const template = useMemo(
    () =>
      selectedAction
        ? buildTemplate(selectedAction, scopedActionContact, scopedActionQualifier, myProfile)
        : "Choisis une action pour voir le template pre-rempli.",
    [selectedAction, scopedActionContact, scopedActionQualifier, myProfile],
  );
  const liveEstimatedGain = getEstimatedGain(opportunityChoice, communityTags);
  const livePotentialLabel = opportunityChoice || communityTags.length > 0 ? liveEstimatedGain : "?";
  const canSaveQualifier = hasChosenHeat && opportunityChoice !== null && communityTags.length > 0;
  const qualifierOpportunityOptions = useMemo(() => [...OPPORTUNITY_OPTIONS], []);
  const qualifierProgressPercent = Math.round((qualifierStep / 3) * 100);
  const selectedActionFirstName = scopedActionContact.name.split(" ")[0] || "ce contact";
  const gainTooltipHintVisible = gainTooltipOpenCount < 3;
  const communityTagPageCount = Math.ceil(COMMUNITY_OPTIONS.length / 6);
  const visibleCommunityOptions = COMMUNITY_OPTIONS.slice(communityTagPage * 6, communityTagPage * 6 + 6);
  const liveQualifierSignals = [
    opportunityChoice ? quickLabelMap[opportunityChoice] : null,
    ...communityTags.slice(0, 2).map((id) => quickLabelMap[id]),
  ].filter(Boolean) as string[];
  const profileQualifier = profileContact ? qualifierStore[profileContact.id] : undefined;
  const profileTrustLevel = profileContact ? trustLevelStore[profileContact.id] : undefined;
  const trustPromptContact = trustPromptContactId ? allContactsData.find((contact) => contact.id === trustPromptContactId) ?? null : null;
  const profileActionEngine = useMemo(() => getDynamicActionEngine(profileQualifier), [profileQualifier]);
  const profileActionButtons = profileActionEngine.order.map((action) => ({
    action,
    ...profileActionEngine.byAction[action],
    isPriority: profileActionEngine.priorityAction === action,
  }));
  const currentCooAlert = useMemo(() => {
    const qualifier = qualifierStore[current.id];
    if (!qualifier) return null;
    if (qualifier.heat !== "brulant" || qualifier.opportunityChoice !== "ideal-client") return null;
    if (Date.now() - qualifier.qualifiedAtMs < REMINDER_WINDOW_MS) return null;
    const hasPackageInTime = historyEntries.some(
      (entry) => entry.contactId === current.id && entry.action === "package" && entry.atMs >= qualifier.qualifiedAtMs,
    );
    if (hasPackageInTime) return null;
    return { name: current.name };
  }, [current.id, current.name, qualifierStore, historyEntries]);
  const profileHeat = profileQualifier?.heat ?? "tiede";
  const profileHistory = profileContact ? historyEntries.filter((entry) => entry.contactId === profileContact.id) : [];
  const profileLatestSentAtMs = profileHistory.find((entry) => entry.sent)?.atMs ?? null;
  const profileDaysSinceLastSent = profileLatestSentAtMs
    ? Math.max(0, Math.floor((Date.now() - profileLatestSentAtMs) / (24 * 60 * 60 * 1000)))
    : 999;
  const profileVitality = Math.max(0, Math.min(100, 100 - Math.round((profileDaysSinceLastSent / 220) * 100)));
  const profilePendingDueCount = profileHistory.filter(
    (entry) => entry.followupDueAtMs && entry.followupDueAtMs <= Date.now() && entry.outcomeStatus === "pending",
  ).length;
  const profileConvertedCount = profileHistory.filter((entry) => entry.outcomeStatus === "converted").length;
  const profileUrgencyLabel =
    profilePendingDueCount > 0 || profileDaysSinceLastSent > 90
      ? "Critique"
      : profileDaysSinceLastSent > 45
        ? "A surveiller"
        : "Stable";
  const profileUrgencyClass =
    profileUrgencyLabel === "Critique"
      ? "border-rose-300/40 bg-rose-300/15 text-rose-100"
      : profileUrgencyLabel === "A surveiller"
        ? "border-amber-300/40 bg-amber-300/15 text-amber-100"
        : "border-emerald-300/40 bg-emerald-300/15 text-emerald-100";
  const profileRecommendedAction = profileActionEngine.priorityAction || "eclaireur";
  const profileVigilanceAlert =
    profileQualifier &&
    (profileQualifier.heat === "brulant" || profileQualifier.opportunityChoice === "ideal-client" || profileQualifier.opportunityChoice === "opens-doors") &&
    profileDaysSinceLastSent > 90;
  const todayStartMs = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }, []);
  const dailyGoal = dailyQueueCount;
  const activatedFromHistory = historyEntries.filter(
    (entry) => entry.sent && entry.atMs >= todayStartMs && entry.action !== "passer",
  ).length;
  const opportunitiesActivated = Math.min(
    dailyGoal,
    Math.max(activatedFromHistory, sentCount),
  );
  const showCompletionAssistant = false;
  const remainingForGoal = Math.max(0, dailyGoal - opportunitiesActivated);
  const missionProgress = Math.round((opportunitiesActivated / dailyGoal) * 100);
  const done = opportunitiesActivated;
  const latentPotential =
    dailyTargetPotential > 0
      ? Math.max(0, Math.round(dailyTargetPotential * (remainingForGoal / dailyGoal)))
      : remainingForGoal * 75;
  const dailyPotentialAverage =
    dailyQueueCount > 0
      ? Math.max(0, Math.round(latentPotential / dailyQueueCount))
      : 0;
  const sentTodayCount = activatedFromHistory;
  const responsesTodayCount = historyEntries.filter((entry) => entry.outcomeStatus === "replied" && entry.atMs >= todayStartMs).length;
  const conversionsTodayCount = historyEntries.filter((entry) => entry.outcomeStatus === "converted" && entry.atMs >= todayStartMs).length;
  const conversionRateToday = sentTodayCount > 0 ? Math.round((conversionsTodayCount / sentTodayCount) * 100) : 0;
  const topActionMetric = useMemo(() => {
    if (!conversionMetrics?.by_action?.length) return null;
    return [...conversionMetrics.by_action].sort((a, b) => b.conversion_rate - a.conversion_rate)[0] || null;
  }, [conversionMetrics]);
  const nowMs = Date.now();
  const overdueFollowupsCount = dueFollowups.filter((item) => item.dueAtMs <= nowMs).length;
  const visibleDueFollowups =
    followupFilter === "overdue"
      ? dueFollowups.filter((item) => item.dueAtMs <= nowMs)
      : dueFollowups;
  const displayedDueFollowups = visibleDueFollowups.slice(0, 3);
  const dailyReportDateLabel = useMemo(() => {
    return new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }, []);
  const filteredHistoryEntries = useMemo(() => {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartMs = todayStart.getTime();
    const last7dMs = now - 7 * 24 * 60 * 60 * 1000;

    return historyEntries.filter((entry) => {
      if (historyStatusFilter === "sent" && !entry.sent) return false;
      if (historyStatusFilter === "validated" && entry.sent) return false;
      if (historyActionFilter !== "all" && entry.action !== historyActionFilter) return false;
      if (historyPeriodFilter === "today" && entry.atMs < todayStartMs) return false;
      if (historyPeriodFilter === "7d" && entry.atMs < last7dMs) return false;
      return true;
    });
  }, [historyEntries, historyStatusFilter, historyActionFilter, historyPeriodFilter]);
  const historyTimelineDays = useMemo(() => {
    const dayFormatter = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const buckets = new Map<
      number,
      {
        dayStartMs: number;
        dayLabel: string;
        entries: Array<HistoryEntry & { timeLabel: string }>;
      }
    >();
    [...filteredHistoryEntries]
      .sort((a, b) => b.atMs - a.atMs)
      .forEach((entry) => {
        const date = new Date(entry.atMs);
        const dayStartDate = new Date(entry.atMs);
        dayStartDate.setHours(0, 0, 0, 0);
        const dayStartMs = dayStartDate.getTime();
        const rawLabel = dayFormatter.format(date);
        const dayLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
        const group =
          buckets.get(dayStartMs) ||
          {
            dayStartMs,
            dayLabel,
            entries: [],
          };
        group.entries.push({
          ...entry,
          timeLabel: timeFormatter.format(date),
        });
        buckets.set(dayStartMs, group);
      });
    return Array.from(buckets.values()).sort((a, b) => b.dayStartMs - a.dayStartMs);
  }, [filteredHistoryEntries]);
  const historyFiltersActiveCount =
    (historyStatusFilter !== "all" ? 1 : 0) +
    (historyActionFilter !== "all" ? 1 : 0) +
    (historyPeriodFilter !== "all" ? 1 : 0);
  const isHistoryStatusFilterActive = historyStatusFilter !== "all";
  const isHistoryActionFilterActive = historyActionFilter !== "all";
  const isHistoryPeriodFilterActive = historyPeriodFilter !== "all";

  useEffect(() => {
    if (typeof window === "undefined") return;
    let restoredImportedCount = 0;
    try {
      const rawImported = window.localStorage.getItem(SMART_SCAN_IMPORTED_CONTACTS_KEY);
      if (rawImported) {
        const parsedImported = JSON.parse(rawImported) as { contacts?: DailyContact[]; summary?: string };
        if (Array.isArray(parsedImported.contacts) && parsedImported.contacts.length > 0) {
          restoredImportedCount = parsedImported.contacts.length;
          setImportedContacts(parsedImported.contacts);
        }
        if (typeof parsedImported.summary === "string") {
          setImportSummary(parsedImported.summary);
        }
      }
    } catch {
      // Ignore invalid imported contact cache.
    }
    try {
      const rawImportedBackup = window.localStorage.getItem(SMART_SCAN_IMPORTED_CONTACTS_BACKUP_KEY);
      if (rawImportedBackup) {
        const parsedBackup = JSON.parse(rawImportedBackup) as { contacts?: DailyContact[]; summary?: string };
        if (Array.isArray(parsedBackup.contacts) && parsedBackup.contacts.length > restoredImportedCount) {
          restoredImportedCount = parsedBackup.contacts.length;
          setImportedContacts(parsedBackup.contacts);
          if (typeof parsedBackup.summary === "string" && parsedBackup.summary.trim().length > 0) {
            setImportSummary(parsedBackup.summary);
          }
        }
      }
    } catch {
      // Ignore invalid imported contact backup cache.
    }

    try {
      const rawSession = window.localStorage.getItem(SMART_SCAN_SESSION_KEY);
      if (rawSession) {
        const parsedSession = JSON.parse(rawSession) as { stage?: "scan" | "daily"; scanCount?: number; index?: number };
        if (parsedSession.stage === "scan" || parsedSession.stage === "daily") {
          setStage(parsedSession.stage);
        }
        if (typeof parsedSession.scanCount === "number") {
          const safeCount = Math.max(0, Math.round(parsedSession.scanCount));
          setScanCount(restoredImportedCount > 0 ? Math.min(restoredImportedCount, safeCount) : safeCount);
        }
        if (typeof parsedSession.index === "number") {
          setIndex(Math.max(0, Math.round(parsedSession.index)));
        }
      }
    } catch {
      // Ignore invalid local session and keep default values.
    } finally {
      setHasHydratedLocalSession(true);
    }
    try {
      const rawEclaireurs = window.localStorage.getItem(SMART_SCAN_ECLAIREURS_KEY);
      if (rawEclaireurs) {
        const parsed = JSON.parse(rawEclaireurs) as { ids?: string[] };
        if (Array.isArray(parsed.ids)) {
          const safeIds = parsed.ids
            .map((value) => String(value || "").trim())
            .filter(Boolean);
          if (safeIds.length > 0) {
            setEclaireurIds(Array.from(new Set(safeIds)));
          }
        }
      }
    } catch {
      // Ignore invalid local eclaireurs cache.
    }
    try {
      const rawDefaults = window.localStorage.getItem(SMART_SCAN_DEFAULT_MESSAGES_KEY);
      if (rawDefaults) {
        const parsed = JSON.parse(rawDefaults) as Record<string, unknown>;
        const nextDefaults: Partial<Record<ActivationAction, string>> = {};
        ACTION_BASE_ORDER.forEach((action) => {
          const rawValue = parsed?.[action];
          if (typeof rawValue === "string" && rawValue.trim().length > 0) {
            nextDefaults[action] = rawValue;
          }
        });
        setDefaultMessageStore(nextDefaults);
      }
    } catch {
      // Ignore invalid local default message cache.
    }
    try {
      const rawPassed = window.localStorage.getItem(SMART_SCAN_PASSED_CONTACTS_KEY);
      if (rawPassed) {
        const parsed = JSON.parse(rawPassed) as { ids?: string[] };
        if (Array.isArray(parsed.ids)) {
          const safeIds = parsed.ids.map((value) => String(value || "").trim()).filter(Boolean);
          setPassedContactIds(Array.from(new Set(safeIds)));
        }
      }
    } catch {
      // Ignore invalid local passed-contact cache.
    }
  }, []);

  useEffect(() => {
    if (totalScanned <= 0) return;
    setScanCount((value) => Math.max(0, Math.min(value, totalScanned)));
  }, [totalScanned]);

  useEffect(() => {
    if (!hasHydratedLocalSession) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      SMART_SCAN_SESSION_KEY,
      JSON.stringify({
        stage,
        scanCount,
        index,
        updatedAt: Date.now(),
      }),
    );
  }, [stage, scanCount, index, hasHydratedLocalSession]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      SMART_SCAN_IMPORTED_CONTACTS_KEY,
      JSON.stringify({
        contacts: importedContacts,
        summary: importSummary,
        updatedAt: Date.now(),
      }),
    );
  }, [importedContacts, importSummary]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextPayload = {
      contacts: importedContacts,
      summary: importSummary,
      updatedAt: Date.now(),
    };
    try {
      const rawBackup = window.localStorage.getItem(SMART_SCAN_IMPORTED_CONTACTS_BACKUP_KEY);
      if (!rawBackup) {
        if (importedContacts.length > 0) {
          window.localStorage.setItem(SMART_SCAN_IMPORTED_CONTACTS_BACKUP_KEY, JSON.stringify(nextPayload));
        }
        return;
      }
      const parsedBackup = JSON.parse(rawBackup) as { contacts?: DailyContact[] };
      const backupCount = Array.isArray(parsedBackup.contacts) ? parsedBackup.contacts.length : 0;
      const shouldPromoteBackup = importedContacts.length >= backupCount;
      if (shouldPromoteBackup) {
        window.localStorage.setItem(SMART_SCAN_IMPORTED_CONTACTS_BACKUP_KEY, JSON.stringify(nextPayload));
      }
    } catch {
      if (importedContacts.length > 0) {
        window.localStorage.setItem(SMART_SCAN_IMPORTED_CONTACTS_BACKUP_KEY, JSON.stringify(nextPayload));
      }
    }
  }, [importedContacts, importSummary]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      SMART_SCAN_ECLAIREURS_KEY,
      JSON.stringify({
        ids: eclaireurIds,
        updatedAt: Date.now(),
      }),
    );
  }, [eclaireurIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      SMART_SCAN_DEFAULT_MESSAGES_KEY,
      JSON.stringify({
        ...defaultMessageStore,
        updatedAt: Date.now(),
      }),
    );
  }, [defaultMessageStore]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      SMART_SCAN_PASSED_CONTACTS_KEY,
      JSON.stringify({
        ids: passedContactIds,
        updatedAt: Date.now(),
      }),
    );
  }, [passedContactIds]);

  useEffect(() => {
    setIndex((value) => {
      if (contactsData.length <= 1) return 0;
      return Math.max(0, Math.min(value, contactsData.length - 1));
    });
  }, [contactsData.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nav = navigator as Navigator & {
      contacts?: {
        select?: (properties: string[], options?: { multiple?: boolean }) => Promise<Array<{ name?: string[]; tel?: string[] }>>;
      };
    };
    setSupportsDirectContactPicker(typeof nav.contacts?.select === "function");
  }, []);

  function adnBadgeClass(label: string) {
    const lower = label.toLowerCase();
    if (lower.includes("inconnu")) return "bg-slate-200 text-slate-800";
    if (lower.includes("decideur") || lower.includes("budget") || lower.includes("institutionnel")) return "bg-blue-100 text-blue-900";
    if (lower.includes("connecteur") || lower.includes("influenceur") || lower.includes("prescripteur")) return "bg-violet-100 text-violet-900";
    return "bg-emerald-100 text-emerald-900";
  }

  useEffect(() => {
    if (stage !== "scan") return;
    if (!hasImportedContacts) return;
    if (scanDone) return;
    const timer = setInterval(() => {
      setScanCount((value) => Math.min(totalScanned, value + Math.floor(Math.random() * 9) + 10));
    }, 180);
    return () => clearInterval(timer);
  }, [stage, scanDone, totalScanned, hasImportedContacts]);

  useEffect(() => {
    if (!hasHydratedServerProgress) return;
    if (!hasImportedContacts) return;
    if (stage !== "daily") return;
    void postSmartScan("session-progress", {
      queueIndex: index,
      queueSize: dailyQueueCount,
      importedTotal: importedTotalCount,
    }).catch(() => null);
  }, [hasHydratedServerProgress, hasImportedContacts, stage, index, dailyQueueCount, importedTotalCount]);

  useEffect(() => {
    if (!isBootstrapped) return;
    if (hasImportedContacts) return;
    if (stage !== "scan") {
      setStage("scan");
    }
    setShowSearchPanel(false);
    setShowHistoryPanel(false);
    setShowEclaireursPanel(false);
  }, [isBootstrapped, hasImportedContacts, stage]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSmartScan() {
      try {
        await Promise.all([refreshSmartScanSnapshot(), loadMyProfile()]);
        if (cancelled) return;
      } catch {
        // Keep the existing in-memory UX state when bootstrap API is unavailable.
      } finally {
        if (!cancelled) {
          setIsBootstrapped(true);
        }
      }
    }

    void bootstrapSmartScan();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hasProfileBootstrapResolved) return;
    const timeoutId = window.setTimeout(() => {
      setHasProfileBootstrapResolved(true);
      setApiErrorMessage((prev) =>
        prev || "Chargement plus long que prevu. Tu peux continuer, la synchronisation reprend en arriere-plan.",
      );
    }, PROFILE_BOOTSTRAP_FALLBACK_MS);
    return () => window.clearTimeout(timeoutId);
  }, [hasProfileBootstrapResolved]);

  useEffect(() => {
    if (!showMyProfilePanel) return;
    setIsEditingProfile(false);
    void loadMyProfile();
  }, [showMyProfilePanel]);

  useEffect(() => {
    if (!isBootstrapped) return;
    if (myProfile) return;
    if (isProfileLoading) return;
    void loadMyProfile();
  }, [isBootstrapped, myProfile, isProfileLoading]);

  useEffect(() => {
    if (!hasProfileBootstrapResolved) return;
    if (showOnboardingJ0 || onboardingFlowLocked) return;

    if (!myProfile) {
      // Filet de securite: ne jamais bloquer l utilisateur sur l ecran de preparation.
      setShowOnboardingJ0(true);
      setOnboardingFlowLocked(true);
      setOnboardingStep(1);
      setOnboardingStartedAtMs(Date.now());
      void loadOnboardingSectors();
      return;
    }

    const isProfileMissingCoreData = [
      myProfile.first_name,
      myProfile.last_name,
      myProfile.metier,
      myProfile.ville,
      myProfile.phone,
      myProfile.sector_id,
      myProfile.metier_label,
    ].some((value) => String(value || "").trim().length === 0);
    const needsOnboarding = !myProfile.onboarding_completed_at || isProfileMissingCoreData;
    if (needsOnboarding) {
      setShowOnboardingJ0(true);
      setOnboardingFlowLocked(true);
      setOnboardingStep(1);
      setOnboardingStartedAtMs(Date.now());
      void loadOnboardingSectors();
    }
  }, [hasProfileBootstrapResolved, myProfile, showOnboardingJ0, onboardingFlowLocked]);

  useEffect(() => {
    if (!showOnboardingJ0 || onboardingStep !== 4) return;
    if (onboardingMessageDraft.trim()) return;
    const contactFirstName = String(onboardingFirstContact?.name || "").trim().split(" ")[0] || "Claire";
    const senderName = String(myProfile?.first_name || "").trim() || "Jean-Philippe";
    const senderCity = String(myProfile?.ville || "").trim() || "Dax";
    const senderMetier = resolveOwnerMetierLabel(myProfile, "Agent immobilier");
    const seed = `Bonjour ${contactFirstName}, je suis ${senderName}, ${senderMetier} a ${senderCity}.

Je te partage un exemple simple de message Popey pour lancer une prise de contact.

Ceci est une demonstration educative: aucun message n est envoye automatiquement.`;
    setOnboardingMessageDraft(seed);
  }, [showOnboardingJ0, onboardingStep, onboardingMessageDraft, myProfile, onboardingFirstContact]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (selectedEclaireurTemplateContactId) {
        setSelectedEclaireurTemplateContactId(null);
        setEclaireurTemplates([]);
        return;
      }
      if (showTemplateModal) {
        setShowTemplateModal(false);
        setSelectedAction(null);
        return;
      }
      if (showContactProfile) {
        setShowContactProfile(false);
        return;
      }
      if (showTrustLevelPrompt) {
        setShowTrustLevelPrompt(false);
        setTrustPromptContactId(null);
        return;
      }
      if (showMyProfilePanel) {
        setShowMyProfilePanel(false);
        return;
      }
      if (showHistoryPanel) {
        setShowHistoryPanel(false);
        return;
      }
      if (showSearchPanel) {
        setShowSearchPanel(false);
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", onKeyDown);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("keydown", onKeyDown);
      }
    };
  }, [showTemplateModal, showContactProfile, showTrustLevelPrompt, showMyProfilePanel, showHistoryPanel, showSearchPanel, selectedEclaireurTemplateContactId]);

  useEffect(() => {
    // UX rule: do not auto-open qualification on app load.
    // Qualification is prompted only when user clicks an activation CTA.
    if (stage !== "daily") return;
    if (!isBootstrapped) return;
    return;
  }, [stage, current.id, qualifierStore, showTemplateModal, isBootstrapped, dismissedQualifierContactId, qualifierAutoOpenPausedUntilMs]);

  useEffect(() => {
    if (!dismissedQualifierContactId) return;
    if (dismissedQualifierContactId === current.id) return;
    setDismissedQualifierContactId(null);
  }, [current.id, dismissedQualifierContactId]);

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
      const inMemoryAvailable = Boolean(pendingTransition && pendingFinalizeAction);
      const restoredContext =
        inMemoryAvailable
          ? {
              transition: {
                ...pendingTransition!,
                manual: true,
                ctaLabel: "Passez au prochain profil",
              },
              awaitingConfirm: {
                action: pendingFinalizeAction!,
                actionContactId: current.id,
                countAsSent: true,
                sentInHistory: true,
                stayOnCurrentContact: Boolean(pendingReturnProfileContactId),
                returnToProfileContactId: pendingReturnProfileContactId,
              },
              contactId: current.id,
              createdAt: Date.now(),
            }
          : readPendingWhatsAppContext();
      if (!restoredContext) return;

      const nextIndex = contactsData.findIndex((contact) => contact.id === restoredContext.contactId);
      if (nextIndex >= 0) {
        setIndex(nextIndex);
      }
      setTransitionScreen(restoredContext.transition);
      setTransitionAwaitingConfirm(restoredContext.awaitingConfirm);
      setPendingTransition(null);
      setPendingFinalizeAction(null);
      setPendingReturnProfileContactId(null);
      clearPendingWhatsAppContext();
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
      flushPendingTransition();
      window.addEventListener("focus", onFocus);
      document.addEventListener("visibilitychange", onVisibilityChange);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", onFocus);
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };
  }, [pendingTransition, pendingFinalizeAction, pendingReturnProfileContactId, current.id]);

  function actionLabel(action: Exclude<DailyCategory, "qualifier">) {
    if (action === "eclaireur") return "Eclaireur";
    if (action === "package") return "Partage Croise";
    if (action === "exclients") return "Ex-Clients";
    return "Passer";
  }

  function outcomeLabel(status?: HistoryEntry["outcomeStatus"]) {
    if (status === "replied") return "Repondu";
    if (status === "converted") return "Converti";
    if (status === "not_interested") return "Pas interesse";
    return "En attente";
  }

  function historyStatusMeta(entry: HistoryEntry): { key: HistoryVisualStatus; label: string; icon: string; className: string; leftBar: string } {
    if (entry.outcomeStatus === "converted") {
      return {
        key: "converted",
        label: "Converti",
        icon: "⭐",
        className: "border-[#7F77DD]/45 bg-[#7F77DD]/20 text-violet-100",
        leftBar: "bg-[#7F77DD]",
      };
    }
    if (entry.sent) {
      return {
        key: "sent",
        label: "Envoye",
        icon: "✓",
        className: "border-[#1D9E75]/45 bg-[#1D9E75]/20 text-emerald-100",
        leftBar: "bg-[#1D9E75]",
      };
    }
    return {
      key: "pending",
      label: "Non envoye",
      icon: "🕒",
      className: "border-[#888780]/45 bg-[#888780]/25 text-white/90",
      leftBar: "bg-[#888780]",
    };
  }

  function toggleHistoryEntryExpanded(key: string) {
    setExpandedHistoryEntryKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  }

  function followupUrgencyBadge(item: FollowupItem) {
    const overdueMs = Date.now() - item.dueAtMs;
    if (overdueMs <= 0) {
      return {
        label: "A venir",
        className: "border-white/20 bg-white/10 text-white/85",
      };
    }
    const overdueHours = Math.max(1, Math.round(overdueMs / (60 * 60 * 1000)));
    if (overdueHours >= 24) {
      return {
        label: `Retard ${overdueHours}h`,
        className: "border-rose-300/45 bg-rose-300/20 text-rose-100",
      };
    }
    return {
      label: `Retard ${overdueHours}h`,
      className: "border-amber-300/45 bg-amber-300/20 text-amber-100",
    };
  }

  async function updateActionOutcome(entry: HistoryEntry, outcomeStatus: "pending" | "replied" | "converted" | "not_interested") {
    if (!entry.actionId) return;
    try {
      await postSmartScan("outcome", {
        actionId: entry.actionId,
        outcomeStatus,
        clientEventId: `${entry.actionId}:outcome:${outcomeStatus}`,
      });
      await refreshSmartScanSnapshot();
    } catch {
      // Keep current state; retry can be triggered by user.
    }
  }

  async function generateAIMessage() {
    if (!selectedAction || selectedAction === "qualifier" || selectedAction === "passer") return;
    try {
      setIsGeneratingMessage(true);
      const result = (await postSmartScan("generate-message", {
        contactName: scopedActionContact.name,
        actionType: selectedAction,
        trustLevel: trustLevelStore[scopedActionContact.id] || null,
        opportunityChoice: scopedActionQualifier?.opportunityChoice || null,
        communityTags: scopedActionQualifier?.communityTags || [],
        city: scopedActionContact.city,
        companyHint: scopedActionContact.companyHint,
      })) as {
        message?: string;
        generationSource?: "ai" | "fallback";
        promptVersion?: string;
        generatedAt?: string;
      };
      if (result?.message) {
        setDraftMessage(result.message);
        setAiGenerationSource(result.generationSource || "fallback");
        setAiPromptVersion(result.promptVersion || "smart_scan_prompt_v1");
        setAiGeneratedAt(result.generatedAt || new Date().toISOString());
      }
    } catch {
      setAiGenerationSource("fallback");
    } finally {
      setIsGeneratingMessage(false);
    }
  }

  async function handleFollowupJobAction(
    actionId: string,
    decision: "replied" | "converted" | "not_interested" | "ignored"
  ) {
    if (decision === "ignored" && typeof window !== "undefined") {
      const confirmed = window.confirm("Confirmer l action Ignorer ? Cette relance sortira de la file prioritaire.");
      if (!confirmed) return;
    }
    try {
      await postSmartScan("followup-job", { actionId, decision });
      await refreshSmartScanSnapshot();
    } catch {
      // Error banner is already handled in postSmartScan.
    }
  }

  async function copyFollowupMessage(actionId: string, message: string) {
    try {
      await navigator.clipboard.writeText(message);
      await postSmartScan("followup-job", { actionId, decision: "copied" });
      await refreshSmartScanSnapshot();
    } catch {
      setApiErrorMessage("Copie impossible. Tu peux copier le message manuellement.");
    }
  }

  async function markVisibleFollowupsAsCopied() {
    const targetItems = displayedDueFollowups;
    if (targetItems.length === 0 || isBatchCopyingFollowups) return;
    const confirmationText = `Marquer ${targetItems.length} relance(s) affichee(s) comme copiees ?`;
    if (typeof window !== "undefined" && !window.confirm(confirmationText)) return;

    setIsBatchCopyingFollowups(true);
    let failedCount = 0;
    try {
      for (const item of targetItems) {
        try {
          await postSmartScan("followup-job", { actionId: item.actionId, decision: "copied" });
        } catch {
          failedCount += 1;
        }
      }
      await refreshSmartScanSnapshot();
      if (failedCount > 0) {
        setApiErrorMessage(`${failedCount} relance(s) n ont pas pu etre marquee(s) comme copiees.`);
      }
    } finally {
      setIsBatchCopyingFollowups(false);
    }
  }

  function buildDailyAdminReportRecord() {
    return {
      date: new Date().toISOString().slice(0, 10),
      sent_today: sentTodayCount,
      replied_today: responsesTodayCount,
      converted_today: conversionsTodayCount,
      conversion_rate_today: conversionRateToday,
      copied_today: followupOpsStats?.copied_today ?? 0,
      followup_replied_today: followupOpsStats?.replied_today ?? 0,
      followup_converted_today: followupOpsStats?.converted_today ?? 0,
      followup_not_interested_today: followupOpsStats?.not_interested_today ?? 0,
      followup_ignored_today: followupOpsStats?.ignored_today ?? 0,
      due_followups_total: dueFollowups.length,
      overdue_followups_total: overdueFollowupsCount,
    };
  }

  async function copyDailyAdminReport() {
    try {
      const record = buildDailyAdminReportRecord();
      const lines = [
        `Reporting admin Smart Scan - ${dailyReportDateLabel}`,
        `Envoyes: ${record.sent_today}`,
        `Repondu: ${record.replied_today}`,
        `Converti: ${record.converted_today}`,
        `Taux conversion: ${record.conversion_rate_today}%`,
        `Copies relance: ${record.copied_today}`,
        `Relances en retard: ${record.overdue_followups_total}/${record.due_followups_total}`,
      ];
      await navigator.clipboard.writeText(lines.join("\n"));
      setApiErrorMessage("");
    } catch {
      setApiErrorMessage("Export impossible. Tu peux faire une capture du bloc reporting.");
    }
  }

  async function copyHistoryMessage(entry: HistoryEntry) {
    const text = String(entry.messageDraft || "").trim();
    if (!text) {
      setApiErrorMessage("Aucun texte disponible a copier pour cette action.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      const key = `${entry.actionId || entry.contactId}:${entry.atMs}`;
      setCopiedHistoryEntryKey(key);
      setTimeout(() => setCopiedHistoryEntryKey((currentKey) => (currentKey === key ? null : currentKey)), 1600);
    } catch {
      setApiErrorMessage("Copie impossible. Autorise l acces presse-papiers puis reessaie.");
    }
  }

  function removeHistoryEntry(entry: HistoryEntry) {
    const key = `${entry.actionId || entry.contactId}:${entry.atMs}`;
    setHistoryEntries((prev) =>
      prev.filter((item) => {
        if (entry.actionId && item.actionId) return item.actionId !== entry.actionId;
        return !(item.contactId === entry.contactId && item.atMs === entry.atMs);
      }),
    );
    setExpandedHistoryEntryKeys((prev) => prev.filter((item) => item !== key));
  }

  function resendHistoryEntry(entry: HistoryEntry) {
    if (entry.action === "passer") {
      setApiErrorMessage("Aucun renvoi pour l action Passer.");
      return;
    }
    const targetContact = getContactById(entry.contactId);
    if (!targetContact) {
      setApiErrorMessage("Contact introuvable pour renvoi.");
      return;
    }
    const nextIndex = allContactsData.findIndex((contact) => contact.id === targetContact.id);
    if (nextIndex >= 0) setIndex(nextIndex);
    setSelectedAction(entry.action);
    const fallbackDraft = buildTemplate(entry.action, targetContact, qualifierStore[targetContact.id], myProfile);
    setDraftMessage(entry.messageDraft?.trim() || fallbackDraft);
    setShowTemplateModal(true);
  }

  function exportDailyAdminReportCsv() {
    if (isExportingDailyReport) return;
    try {
      setIsExportingDailyReport(true);
      const record = buildDailyAdminReportRecord();
      const headers = Object.keys(record);
      const values = headers.map((key) => String(record[key as keyof typeof record]));
      const csvContent = `${headers.join(",")}\n${values.join(",")}\n`;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `smart-scan-admin-report-${record.date}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      setApiErrorMessage("Export CSV indisponible pour le moment.");
    } finally {
      setIsExportingDailyReport(false);
    }
  }

  function getEstimatedGain(
    opportunity: (typeof OPPORTUNITY_OPTIONS)[number]["id"] | null,
    community: Array<(typeof COMMUNITY_OPTIONS)[number]["id"]>,
  ): "Faible" | "Moyen" | "Eleve" {
    const opportunityScore = OPPORTUNITY_OPTIONS.find((option) => option.id === opportunity)?.score ?? 0;
    const communityScore = community.reduce(
      (sum, id) => sum + (COMMUNITY_OPTIONS.find((option) => option.id === id)?.score ?? 0),
      0,
    );
    const score = opportunityScore + communityScore;
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

  function getContactById(contactId: string) {
    return contactsData.find((contact) => contact.id === contactId) ?? importedContacts.find((contact) => contact.id === contactId) ?? null;
  }

  function getContactFirstName(contact: { name: string }) {
    const firstName = String(contact.name || "").trim().split(/\s+/)[0] || "toi";
    return firstName;
  }

  function personalizeDraftWithContact(draft: string, contact: { name: string }) {
    const firstName = getContactFirstName(contact);
    let text = String(draft || "");
    text = text
      .replace(/\{\{\s*prenom\s*\}\}/gi, firstName)
      .replace(/\{\{\s*firstname\s*\}\}/gi, firstName)
      .replace(/\{\s*prenom\s*\}/gi, firstName);
    // If a saved template starts with "Bonjour X", force X to current contact first name.
    text = text.replace(/\b(Bonjour|Salut|Hello|Coucou)\s+[^\s,!.?:;]+/i, `$1 ${firstName}`);
    return text;
  }

  function normalizeDraftForDefault(draft: string, contact: { name: string }) {
    const firstName = getContactFirstName(contact);
    let text = String(draft || "");
    text = text.replace(new RegExp(`\\b(Bonjour|Salut|Hello|Coucou)\\s+${firstName}\\b`, "i"), "$1 {{prenom}}");
    if (!/\{\{\s*prenom\s*\}\}/i.test(text)) {
      text = text.replace(/\b(Bonjour|Salut|Hello|Coucou)\s+[^\s,!.?:;]+/i, "$1 {{prenom}}");
    }
    return text;
  }

  function resolveMessageDraft(action: ActivationAction, fallbackDraft: string, contact: { name: string }) {
    const savedDraft = defaultMessageStore[action];
    if (typeof savedDraft === "string" && savedDraft.trim().length > 0) {
      return personalizeDraftWithContact(savedDraft, contact);
    }
    return personalizeDraftWithContact(fallbackDraft, contact);
  }

  async function postSmartScan(
    path:
      | "trust"
      | "qualification"
      | "action"
      | "favorite"
      | "import-contacts"
      | "clear-import"
      | "session-progress"
      | "promote-eclaireur"
      | "eclaireur-templates"
      | "outcome"
      | "generate-message"
      | "followup-job"
      | "prepare-whatsapp-payload"
      | "external-click"
      | "analytics-event"
      | "eclaireurs",
    payload: Record<string, unknown>,
  ) {
    const maxAttempts = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await fetch(`/api/popey-human/smart-scan/${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || "Erreur API Smart Scan");
        }
        setApiErrorMessage("");
        return response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Erreur reseau Smart Scan");
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
        }
      }
    }

    setApiErrorMessage("Synchronisation en attente. Les donnees seront retentees automatiquement.");
    throw lastError || new Error("Erreur API Smart Scan");
  }

  function trackSmartScanEvent(
    eventType: "contact_opened" | "trust_level_set" | "whatsapp_sent" | "daily_goal_progressed" | "onboarding_completed",
    metadata: Record<string, unknown>,
  ) {
    void postSmartScan("analytics-event", {
      eventType,
      metadata,
    }).catch(() => null);
  }

  async function refreshSmartScanSnapshot() {
    const response = await fetch("/api/popey-human/smart-scan/bootstrap", { cache: "no-store" });
    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined") {
        window.location.href = "/popey-human/login";
      }
      return;
    }
    const payload = (await response.json()) as {
      contacts: BootstrapContactRow[];
      qualifications: BootstrapQualificationRow[];
      history: BootstrapHistoryRow[];
      session: BootstrapSessionRow | null;
      alerts: BootstrapAlertRow[];
      followups?: BootstrapFollowupRow[];
      metrics?: BootstrapMetrics | null;
      followupOps?: BootstrapFollowupOps | null;
      externalClicks?: BootstrapExternalClicks | null;
      eclaireurs?: BootstrapEclaireurRow[];
    };

    const dbToExternalRef = new Map<string, string>();
    const nextTrustStore: Record<string, TrustLevel> = {};
    const nextFavoriteIds: string[] = [];
    const nextPriorityScoreStore: Record<string, number> = {};
    const nextPotentialStore: Record<string, number> = {};
    const nextEclaireurIds: string[] = [];
    const persistedImportedRows: Array<{ index: number; contact: DailyContact }> = [];
    const seenExternalRefs = new Set<string>();
    (payload.contacts || []).forEach((contact, idx) => {
      const externalRef = String(contact.external_contact_ref || contact.id || "").trim();
      if (!externalRef) return;
      dbToExternalRef.set(contact.id, externalRef);
      if (contact.is_favorite) {
        nextFavoriteIds.push(externalRef);
      }
      if (
        contact.trust_level === "family" ||
        contact.trust_level === "pro-close" ||
        contact.trust_level === "acquaintance"
      ) {
        nextTrustStore[externalRef] = contact.trust_level;
      }
      nextPriorityScoreStore[externalRef] = Math.max(0, Math.round(contact.priority_score || 0));
      nextPotentialStore[externalRef] = Math.max(0, Math.round(contact.potential_eur || 0));
      if (contact.is_eclaireur_active) {
        nextEclaireurIds.push(externalRef);
      }
      if (!seenExternalRefs.has(externalRef)) {
        const hasImportIndex = Number.isFinite(Number(contact.import_index));
        persistedImportedRows.push({
          index: hasImportIndex ? Number(contact.import_index) : 100000 + idx,
          contact: {
            id: externalRef,
            name: contact.full_name || externalRef || "Contact",
            phone: contact.phone_e164 || null,
            city: contact.city || "Inconnue",
            companyHint: contact.company_hint || "Reseau perso",
            capsule: "Importe depuis ton telephone",
            communityKnownBy: 1,
            dominantTags: ["📱 Contact importe", "🤝 A qualifier"],
            externalNews: "Profil importe depuis ton annuaire",
          },
        });
        seenExternalRefs.add(externalRef);
      }
    });

    const nextQualifierStore: Record<string, QualifierData> = {};
    (payload.qualifications || []).forEach((qualification) => {
      const externalRef = dbToExternalRef.get(qualification.contact_id);
      if (!externalRef) return;
      const timestamp = Date.parse(
        qualification.qualified_at || qualification.updated_at || qualification.created_at || "",
      );
      nextQualifierStore[externalRef] = {
        heat: qualification.heat,
        opportunityChoice: qualification.opportunity_choice,
        communityTags: qualification.community_tags || [],
        estimatedGain: qualification.estimated_gain,
        qualifiedAtMs: Number.isFinite(timestamp) ? timestamp : Date.now(),
      };
    });

    const nextHistoryEntries: HistoryEntry[] = (payload.history || [])
      .map((entry) => {
        const externalRef = dbToExternalRef.get(entry.contact_id) || String(entry.contact_external_ref || "").trim();
        if (!externalRef) return null;
        const dateMs = Date.parse(entry.created_at);
        const safeDateMs = Number.isFinite(dateMs) ? dateMs : Date.now();
        const date = new Date(safeDateMs);
        const followupDueMs = entry.followup_due_at ? Date.parse(entry.followup_due_at) : NaN;
        return {
          actionId: entry.id,
          contactId: externalRef,
          name: entry.contact_name || getContactById(externalRef)?.name || "Contact",
          action: entry.action_type,
          at: `${date.getHours().toString().padStart(2, "0")}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}`,
          atMs: safeDateMs,
          tagsSummary: "",
          sent: entry.status === "sent",
          messageDraft: entry.message_draft || null,
          sendChannel: (entry.send_channel as "whatsapp" | "other" | null) || null,
          followupDueAtMs: Number.isFinite(followupDueMs) ? followupDueMs : null,
          outcomeStatus: entry.outcome_status || null,
        };
      })
      .filter(Boolean) as HistoryEntry[];

    const nowMs = Date.now();
    const nextDueFollowups = (payload.followups || [])
      .map((item) => {
        const externalRef = dbToExternalRef.get(item.contact_id);
        if (!externalRef) return null;
        const dueMs = Date.parse(item.followup_due_at);
        const safeDueMs = Number.isFinite(dueMs) ? dueMs : Date.now();
        const dueDate = new Date(safeDueMs);
        const dueAtLabel = `${dueDate.getDate().toString().padStart(2, "0")}/${(dueDate.getMonth() + 1)
          .toString()
          .padStart(2, "0")} ${dueDate.getHours().toString().padStart(2, "0")}:${dueDate
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
        return {
          actionId: item.action_id,
          contactId: externalRef,
          contactName: item.contact_name || getContactById(externalRef)?.name || "Contact",
          actionType: item.action_type,
          priorityScore: Math.max(0, Math.round(item.priority_score || 0)),
          dueAtLabel,
          dueAtMs: safeDueMs,
          suggestedMessage: item.suggested_message || "",
        };
      })
      .filter((item): item is FollowupItem => Boolean(item))
      .sort((a, b) => {
        const aOverdueMs = Math.max(0, nowMs - a.dueAtMs);
        const bOverdueMs = Math.max(0, nowMs - b.dueAtMs);
        if (aOverdueMs !== bOverdueMs) return bOverdueMs - aOverdueMs;
        if (a.priorityScore !== b.priorityScore) return b.priorityScore - a.priorityScore;
        return a.dueAtMs - b.dueAtMs;
      });

    setTrustLevelStore(nextTrustStore);
    setFavoriteIds(nextFavoriteIds);
    setQualifierStore(nextQualifierStore);
    setHistoryEntries(nextHistoryEntries);
    setPriorityScoreStore(nextPriorityScoreStore);
    setPotentialEurStore(nextPotentialStore);
    if (persistedImportedRows.length > 0) {
      const hydratedContacts = persistedImportedRows
        .sort((a, b) => a.index - b.index)
        .map((row) => row.contact);
      setImportedContacts((previous) => {
        if (previous.length === 0) return hydratedContacts;
        const suspiciousShrink =
          previous.length >= 120 && hydratedContacts.length > 0 && hydratedContacts.length <= Math.floor(previous.length * 0.4);
        if (!suspiciousShrink) return hydratedContacts;
        const fromHydrated = new Map(hydratedContacts.map((contact) => [contact.id, contact]));
        const merged = previous.map((contact) => fromHydrated.get(contact.id) || contact);
        hydratedContacts.forEach((contact) => {
          if (!merged.some((item) => item.id === contact.id)) {
            merged.push(contact);
          }
        });
        return merged;
      });
    }
    setDueFollowups(nextDueFollowups);
    setConversionMetrics(payload.metrics || null);
    setFollowupOpsStats(payload.followupOps || null);
    setExternalClickStats(payload.externalClicks || null);
    const nextEclaireurStatsStore: Record<string, { leadsDetected: number; leadsSigned: number; commissionTotalEur: number; lastNewsAtMs: number }> = {};
    const nextEclaireurDirectory: Record<string, { id: string; name: string; city: string; scoutType: "perso" | "pro" }> = {};
    (payload.eclaireurs || []).forEach((row) => {
      const externalRef = String(row.external_contact_ref || row.id || "").trim();
      if (!externalRef) return;
      const lastNewsSource = row.last_whatsapp_sent_at || row.updated_at || row.eclaireur_activated_at || "";
      const lastNewsMs = Date.parse(lastNewsSource);
      nextEclaireurDirectory[externalRef] = {
        id: externalRef,
        name: row.full_name || externalRef,
        city: row.city || "Inconnue",
        scoutType: row.scout_type === "pro" ? "pro" : "perso",
      };
      nextEclaireurStatsStore[externalRef] = {
        leadsDetected: Math.max(0, Math.round(Number(row.leads_detected || 0))),
        leadsSigned: Math.max(0, Math.round(Number(row.leads_signed || 0))),
        commissionTotalEur: Math.max(0, Math.round(Number(row.commission_total_eur || 0))),
        lastNewsAtMs: Number.isFinite(lastNewsMs) ? lastNewsMs : 0,
      };
    });
    const nextEclaireurIdsFromDirectory = Object.keys(nextEclaireurDirectory);
    setEclaireurIds((previous) =>
      Array.from(new Set([...previous, ...nextEclaireurIds, ...nextEclaireurIdsFromDirectory])),
    );
    setEclaireurStatsStore(nextEclaireurStatsStore);
    setEclaireurDirectory(nextEclaireurDirectory);
    if (payload.session?.opportunities_activated !== undefined) {
      setSentCount(payload.session.opportunities_activated);
    }
    if (typeof payload.session?.target_potential_eur === "number") {
      setDailyTargetPotential(Math.max(0, Math.round(payload.session.target_potential_eur)));
    }
    if (!hasHydratedServerProgress) {
      const sessionMetadata =
        payload.session?.metadata && typeof payload.session.metadata === "object" && !Array.isArray(payload.session.metadata)
          ? payload.session.metadata
          : null;
      const progress =
        sessionMetadata &&
        "smartScanProgress" in sessionMetadata &&
        sessionMetadata.smartScanProgress &&
        typeof sessionMetadata.smartScanProgress === "object" &&
        !Array.isArray(sessionMetadata.smartScanProgress)
          ? (sessionMetadata.smartScanProgress as { queueIndex?: unknown })
          : null;
      if (progress && typeof progress.queueIndex === "number" && Number.isFinite(progress.queueIndex)) {
        setIndex(Math.max(0, Math.round(progress.queueIndex)));
      }
      setHasHydratedServerProgress(true);
    }
  }

  function handleExternalConnectorClick(source: "linkedin" | "whatsapp_group", url: string) {
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    void postSmartScan("external-click", {
      source,
      targetUrl: url,
      context: "cockpit",
    })
      .then(() => refreshSmartScanSnapshot())
      .catch(() => null);
  }

  function createTransitionPayload(
    action: Exclude<DailyCategory, "qualifier">,
    mode: "sent" | "saved" = "sent",
    stepDelta = 1,
  ) {
    const nextStep = Math.min(dailyQueueCount, done + stepDelta);
    const encouragements =
      mode === "sent"
        ? [`Felicitations ${current.name.split(" ")[0]} a ete active.`]
        : [
            `Aucun message envoye a ${current.name.split(" ")[0]}. Fiche memorisee. 🗂️`,
            `Valide sans envoi: ${current.name.split(" ")[0]} est ajoute a ton historique.`,
            `${actionLabel(action)} prepare sans envoi. Tu pourras relancer au bon moment.`,
          ];
    const message =
      stepDelta > 0 && nextStep >= dailyQueueCount
        ? `Session terminee ! Tu as reveille ${dailyQueueCount} contacts aujourd hui.`
        : encouragements[Math.floor(Math.random() * encouragements.length)];
    return {
      message,
      icon: stepDelta > 0 && nextStep >= dailyQueueCount ? "🎆" : "✅",
      from: done,
      to: nextStep,
      final: stepDelta > 0 && nextStep >= dailyQueueCount,
    };
  }

  function savePendingWhatsAppContext(context: PendingWhatsAppContext) {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(PENDING_WHATSAPP_CONTEXT_KEY, JSON.stringify(context));
  }

  function clearPendingWhatsAppContext() {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(PENDING_WHATSAPP_CONTEXT_KEY);
  }

  function readPendingWhatsAppContext() {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(PENDING_WHATSAPP_CONTEXT_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as PendingWhatsAppContext;
      if (!parsed?.transition || !parsed?.awaitingConfirm || !parsed?.contactId) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function finalizeAction(
    action: Exclude<DailyCategory, "qualifier">,
    advanceDelay = 200,
    options: {
      countAsSent?: boolean;
      sentInHistory?: boolean;
      stayOnCurrentContact?: boolean;
      wrapOnEnd?: boolean;
      returnToProfileContactId?: string | null;
      actionContact?: DailyContact;
    } = {},
  ) {
    setSelectedAction(action);
    const actionContact = options.actionContact || current;
    const actionQualifier = qualifierStore[actionContact.id];
    const countAsSent = options.countAsSent ?? true;
    const sentInHistory = options.sentInHistory ?? countAsSent;
    const stayOnCurrentContact = options.stayOnCurrentContact ?? false;
    const wrapOnEnd = options.wrapOnEnd ?? action === "passer";
    const returnToProfileContactId = options.returnToProfileContactId ?? null;
    if (countAsSent && (action === "eclaireur" || action === "package" || action === "exclients")) {
      setSentCount((v) => v + 1);
    }
    if (countAsSent) {
      setShowReward(true);
      setSuccessPulse(true);
      setTimeout(() => setShowReward(false), 900);
      setTimeout(() => setSuccessPulse(false), 450);
    }
    setTimeout(() => {
      const now = new Date();
      const nowMs = Date.now();
      const sendChannel: HistoryEntry["sendChannel"] = sentInHistory ? "whatsapp" : "other";
      const summaryOpportunity = actionQualifier?.opportunityChoice ? quickLabelMap[actionQualifier.opportunityChoice] : "";
      const summaryCommunity = (actionQualifier?.communityTags ?? []).map((id) => quickLabelMap[id]).slice(0, 1);
      setHistoryEntries((prev) => [
        {
          contactId: actionContact.id,
          name: actionContact.name,
          action,
          at: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
          atMs: nowMs,
          tagsSummary: [summaryOpportunity, ...summaryCommunity]
            .filter(Boolean)
            .join(" • "),
          sent: sentInHistory,
          messageDraft: draftMessage || null,
          sendChannel,
          followupDueAtMs: sentInHistory ? nowMs + 48 * 60 * 60 * 1000 : null,
          outcomeStatus: sentInHistory ? ("pending" as const) : null,
        },
        ...prev,
      ].slice(0, 500));
      if (action === "passer") {
        setPassedContactIds((previous) => Array.from(new Set([actionContact.id, ...previous])));
      } else {
        setPassedContactIds((previous) => previous.filter((id) => id !== actionContact.id));
      }
      const persistedStatus = sentInHistory ? "sent" : "validated_without_send";
      const clientEventId = `${actionContact.id}:${action}:${nowMs}`;
      void postSmartScan("action", {
        externalContactRef: actionContact.id,
        fullName: actionContact.name,
        city: actionContact.city,
        companyHint: actionContact.companyHint,
        actionType: action,
        messageDraft: draftMessage || null,
        sendChannel: sendChannel || "other",
        status: persistedStatus,
        clientEventId,
        templateVersion: "v1",
        aiPromptVersion,
        aiGeneratedAt,
        aiGenerationSource,
      })
        .then((result: { opportunitiesActivated?: number | null }) => {
          if (typeof result?.opportunitiesActivated === "number") {
            setSentCount(result.opportunitiesActivated);
          }
          return refreshSmartScanSnapshot();
        })
        .catch(() => null);
      if (!stayOnCurrentContact) {
        setIndex((v) => {
          if (contactsData.length <= 1) return 0;
          if (wrapOnEnd) return (v + 1) % contactsData.length;
          return Math.min(Math.max(0, contactsData.length - 1), v + 1);
        });
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
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(20);
    }
    setSuccessPulse(true);
    setTimeout(() => setSuccessPulse(false), 180);
    if (action === "passer") {
      setPassedContactIds((previous) => Array.from(new Set([current.id, ...previous])));
      finalizeAction(action, 200, {
        countAsSent: false,
        sentInHistory: false,
        stayOnCurrentContact: true,
        wrapOnEnd: false,
      });
      return;
    }
    if (action === "eclaireur" || action === "package" || action === "exclients") {
      if (!isQualified) {
        setShowQualificationNeededPopup(true);
        return;
      }
      // Daily-card action: clear any stale profile-origin context.
      setActionFromProfileContactId(null);
      setLaunchingAction(action);
      setTimeout(() => {
        setLaunchingAction(null);
        const fallbackDraft = buildTemplate(action, scopedActionContact, scopedActionQualifier, myProfile);
        const nextDraft = resolveMessageDraft(action, fallbackDraft, scopedActionContact);
        setModalErrorMessage("");
        setModalInfoMessage("");
        setSelectedAction(action);
        setDraftMessage(nextDraft);
        setAiGenerationSource(null);
        setAiPromptVersion(null);
        setAiGeneratedAt(null);
        setShowTemplateModal(true);
      }, 1200);
      return;
    }
    const nextDraft = buildTemplate(action, scopedActionContact, scopedActionQualifier, myProfile);
    setSelectedAction(action);
    if (action === "qualifier") {
      setQualifierHeat(null);
      setHasChosenHeat(false);
      setQualifierStep(1);
      setQualifierDirection(1);
      setCommunityTagPage(0);
      setOpportunityChoice(null);
      setCommunityTags([]);
      setDraftMessage("");
    } else {
      setDraftMessage(nextDraft);
      setAiGenerationSource(null);
      setAiPromptVersion(null);
      setAiGeneratedAt(null);
      setShowMessagePersonalizationField(false);
      setMessagePersonalizationNote("");
      setIsEditingMessageDraft(false);
    }
    setShowTemplateModal(true);
  }

  async function sendOnWhatsApp() {
    const cleanPhone = normalizePhoneForWhatsApp(scopedActionContact.phone);
    const action = selectedAction;
    if (!action || action === "qualifier") return;
    const scopedQualifier = qualifierStore[scopedActionContact.id];
    if (!scopedQualifier?.opportunityChoice || scopedQualifier.communityTags.length === 0) {
      setShowTemplateModal(false);
      setShowQualificationNeededPopup(true);
      return;
    }
    if (!cleanPhone) {
      setModalErrorMessage("Contact WhatsApp manquant. Reimporte ton fichier pour inclure les numeros (format international conseille).");
      return;
    }
    setModalErrorMessage("");
    const payload = createTransitionPayload(action);
    const profileOriginContactId = actionFromProfileContactId === scopedActionContact.id ? actionFromProfileContactId : null;
    const awaitingConfirm: TransitionAwaitingConfirmState = {
      action,
      actionContactId: scopedActionContact.id,
      countAsSent: true,
      sentInHistory: true,
      stayOnCurrentContact: Boolean(profileOriginContactId),
      returnToProfileContactId: profileOriginContactId,
    };
    let whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(draftMessage)}`;

    try {
      const prepared = (await postSmartScan("prepare-whatsapp-payload", {
        externalContactRef: scopedActionContact.id,
        fullName: scopedActionContact.name,
        city: scopedActionContact.city,
        companyHint: scopedActionContact.companyHint,
        actionType: action,
        messageDraft: draftMessage,
        phoneE164: cleanPhone,
      })) as { whatsappUrl?: string };
      if (prepared?.whatsappUrl) {
        whatsappUrl = prepared.whatsappUrl;
      }
    } catch {
      // Fallback URL is already set and can still be used.
    }

    setShowTemplateModal(false);
    setAiGenerationSource(null);
    setAiPromptVersion(null);
    setAiGeneratedAt(null);
    const pendingContext: PendingWhatsAppContext = {
      transition: {
        ...payload,
        manual: true,
        ctaLabel: "Passez au prochain profil",
      },
      awaitingConfirm,
      contactId: scopedActionContact.id,
      createdAt: Date.now(),
    };
    savePendingWhatsAppContext(pendingContext);
    setPendingTransition(payload);
    setPendingFinalizeAction(action);
    setPendingReturnProfileContactId(profileOriginContactId);
    if (typeof window !== "undefined") {
      window.open(whatsappUrl, "_blank");
    }
    if (eclaireurIds.includes(scopedActionContact.id)) {
      setEclaireurStatsStore((prev) => {
        const existing = prev[scopedActionContact.id] || {
          leadsDetected: 0,
          leadsSigned: 0,
          commissionTotalEur: 0,
          lastNewsAtMs: 0,
        };
        return {
          ...prev,
          [scopedActionContact.id]: {
            ...existing,
            lastNewsAtMs: Date.now(),
          },
        };
      });
    }
  }

  function saveCurrentMessageAsDefault() {
    const action = selectedAction;
    if (!action || action === "qualifier" || action === "passer") return;
    const cleanDraft = String(draftMessage || "").trim();
    if (!cleanDraft) {
      setModalErrorMessage("Le message est vide. Ecris un texte avant de l enregistrer par defaut.");
      return;
    }
    const normalizedDefault = normalizeDraftForDefault(cleanDraft, scopedActionContact);
    setDefaultMessageStore((prev) => ({
      ...prev,
      [action]: normalizedDefault,
    }));
    setDraftMessage(personalizeDraftWithContact(normalizedDefault, scopedActionContact));
    setModalErrorMessage("");
    setModalInfoMessage(`Message par defaut enregistre pour ${modalTitle(action)}.`);
    setTimeout(() => setModalInfoMessage(""), 2200);
  }

  function saveQualifierAndReturn() {
    const primaryTag =
      (opportunityChoice ? quickLabelMap[opportunityChoice] : undefined) ??
      (communityTags[0] ? quickLabelMap[communityTags[0]] : undefined) ??
      "❓ Inconnu";
    const firstName = current.name.split(" ")[0];
    const estimatedGain = getEstimatedGain(opportunityChoice, communityTags);

    setQualifierStore((prev) => ({
      ...prev,
      [current.id]: {
        heat: qualifierHeat ?? "tiede",
        opportunityChoice,
        communityTags,
        estimatedGain,
        qualifiedAtMs: Date.now(),
      },
    }));
    setShowTemplateModal(false);
    setSelectedAction(null);
    setQualificationPivot({ contactId: current.id, firstName, tag: primaryTag });
    setLastRewardForQualifier();
    void postSmartScan("qualification", {
      externalContactRef: current.id,
      fullName: current.name,
      city: current.city,
      companyHint: current.companyHint,
      heat: qualifierHeat ?? "tiede",
      opportunityChoice: opportunityChoice ?? null,
      communityTags,
      estimatedGain,
    })
      .then(() => refreshSmartScanSnapshot())
      .catch(() => null);
  }

  function skipQualifierUnknown() {
    setQualifierStore((prev) => ({
      ...prev,
      [current.id]: {
        heat: "tiede",
        opportunityChoice: null,
        communityTags: [],
        estimatedGain: "Faible",
        qualifiedAtMs: Date.now(),
      },
    }));
    setShowTemplateModal(false);
    setSelectedAction(null);
    setSoftLearningHint("Profil peu renseigne: sois le premier a le qualifier !");
    setTimeout(() => setSoftLearningHint(""), 2200);
    void postSmartScan("qualification", {
      externalContactRef: current.id,
      fullName: current.name,
      city: current.city,
      companyHint: current.companyHint,
      heat: "tiede",
      opportunityChoice: null,
      communityTags: [],
      estimatedGain: "Faible",
    })
      .then(() => refreshSmartScanSnapshot())
      .catch(() => null);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("popey:gain-potential-tooltip-opens");
    const parsed = Number(raw || "0");
    if (Number.isFinite(parsed) && parsed > 0) {
      setGainTooltipOpenCount(parsed);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("popey:gain-potential-tooltip-opens", String(gainTooltipOpenCount));
  }, [gainTooltipOpenCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("popey:add-scout-tooltip-seen");
    setHasSeenAddScoutTooltip(raw === "1");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("popey:add-scout-tooltip-seen", hasSeenAddScoutTooltip ? "1" : "0");
  }, [hasSeenAddScoutTooltip]);

  useEffect(() => {
    if (!showEclaireursPanel) return;
    if (!hasSeenAddScoutTooltip) {
      setShowAddScoutTooltip(true);
      const timer = window.setTimeout(() => setShowAddScoutTooltip(false), 3000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [showEclaireursPanel, hasSeenAddScoutTooltip]);

  useEffect(() => {
    if (!showEclaireursPanel) return;
    setRecoAlertPulse(true);
    const timer = window.setTimeout(() => setRecoAlertPulse(false), 1100);
    return () => window.clearTimeout(timer);
  }, [showEclaireursPanel, eclaireurHeaderStats.alertesCount]);

  useEffect(() => {
    if (selectedAction !== "qualifier" || !showTemplateModal) return;
    if (qualifierStep !== 1) return;
    if (qualifierOpportunityOptions.length !== 1) return;
    setOpportunityChoice(qualifierOpportunityOptions[0].id);
    setQualifierDirection(1);
    setQualifierStep(2);
  }, [selectedAction, showTemplateModal, qualifierStep, qualifierOpportunityOptions]);

  useEffect(() => {
    if (!showContactProfile || !profileContact) return;
    if (trustLevelStore[profileContact.id]) return;
    setShowContactProfile(false);
    setTrustPromptContactId(profileContact.id);
    setShowTrustLevelPrompt(true);
  }, [showContactProfile, profileContact, trustLevelStore]);

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

  function openGainPotentialHelp() {
    setShowGainPotentialSheet(true);
    setGainTooltipOpenCount((prev) => prev + 1);
  }

  function toggleFavorite(contactId: string) {
    const contact = getContactById(contactId);
    if (!contact) return;
    const nextIsFavorite = !favoriteIds.includes(contactId);
    setFavoriteIds((prev) => (nextIsFavorite ? [...prev, contactId] : prev.filter((id) => id !== contactId)));
    void postSmartScan("favorite", {
      externalContactRef: contact.id,
      fullName: contact.name,
      city: contact.city,
      companyHint: contact.companyHint,
      isFavorite: nextIsFavorite,
    })
      .then(() => refreshSmartScanSnapshot())
      .catch(() => null);
  }

  function promoteContactToEclaireur(contact: DailyContact) {
    const contactId = contact.id;
    if (!contact) return;
    setEclaireurIds((prev) => (prev.includes(contactId) ? prev : [...prev, contactId]));
    setEclaireurDirectory((prev) => ({
      ...prev,
      [contactId]: {
        id: contact.id,
        name: contact.name,
        city: contact.city,
        scoutType: "perso" as const,
      },
    }));
    setEclaireurStatsStore((prev) => {
      const existing = prev[contactId] || {
        leadsDetected: 0,
        leadsSigned: 0,
        commissionTotalEur: 0,
        lastNewsAtMs: 0,
      };
      return {
        ...prev,
        [contactId]: {
          ...existing,
          lastNewsAtMs: Date.now(),
        },
      };
    });
  }

  async function promoteToEclaireur(contactId: string) {
    const contact = getContactById(contactId);
    if (!contact) return;
    promoteContactToEclaireur(contact);
    try {
      await postSmartScan("promote-eclaireur", {
        externalContactRef: contact.id,
        fullName: contact.name,
        city: contact.city,
        companyHint: contact.companyHint,
      });
      await refreshSmartScanSnapshot();
    } catch {
      setApiErrorMessage("Ajout eclaireur impossible pour ce contact.");
    }
  }

  function addScoutFromImportedSelection() {
    const hasManualDraft =
      manualScoutFirstName.trim().length > 0 ||
      manualScoutLastName.trim().length > 0 ||
      manualScoutMetier.trim().length > 0 ||
      manualScoutCity.trim().length > 0 ||
      manualScoutPhone.trim().length > 0;
    if (hasManualDraft) {
      void importSingleContactManually({
        firstName: manualScoutFirstName,
        lastName: manualScoutLastName,
        metier: manualScoutMetier,
        city: manualScoutCity,
        phone: manualScoutPhone,
      });
      return;
    }
    if (!hasImportedScoutCandidates) {
      setApiErrorMessage("Aucun contact disponible a ajouter pour le moment.");
      return;
    }
    const selectedId = selectedImportedScoutId.trim();
    if (!selectedId) {
      setApiErrorMessage("Choisis d'abord un contact importé.");
      return;
    }
    const contact = getContactById(selectedId) || getContactById(importedScoutCandidates[0]?.id || "");
    if (!contact) {
      setApiErrorMessage("Contact importé introuvable.");
      return;
    }
    setApiErrorMessage("");
    setSelectedImportedScoutId("");
    void promoteToEclaireur(contact.id).then(() => {
      void ensureEclaireurLink(contact.id);
      setApiErrorMessage("Eclaireur ajoute.");
      setTimeout(() => setApiErrorMessage(""), 1400);
    });
  }

  async function updateIncomingReferralStatus(targetStatus: "validated" | "offered" | "converted") {
    const referral = selectedIncomingReferral;
    if (!referral) return;
    try {
      setIsIncomingReferralStatusUpdating(true);
      const response = await fetch("/api/popey-human/smart-scan/scout-referrals/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralId: referral.id,
          targetStatus,
          signedAmount: targetStatus === "converted" ? Number(incomingSignedAmount || 0) : null,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossible de mettre a jour ce statut.");
      }
      const localUpdatedAtIso = new Date().toISOString();
      setIncomingReferrals((prev) =>
        prev.map((item) => (item.id === referral.id ? { ...item, status: targetStatus, updated_at: localUpdatedAtIso } : item)),
      );
      if (targetStatus === "converted") {
        setShowDealCelebration(true);
        setTimeout(() => setShowDealCelebration(false), 1800);
      }
      setApiErrorMessage(`Statut mis a jour: ${referralStatusLabel(targetStatus)}.`);
      setTimeout(() => setApiErrorMessage(""), 1800);
      const refreshed = await fetch("/api/popey-human/smart-scan/scout-referrals", { method: "GET", cache: "no-store" });
      if (refreshed.ok) {
        const data = (await refreshed.json().catch(() => ({}))) as { referrals?: SmartScanIncomingReferral[] };
        const nextList = data.referrals || [];
        setIncomingReferrals((prev) => {
          const previousById = new Map(prev.map((item) => [item.id, item]));
          return nextList.map((item) => {
            const previous = previousById.get(item.id);
            if (!previous) return item;
            return referralStatusRank(previous.status) > referralStatusRank(item.status) ? previous : item;
          });
        });
      }
      await refreshSmartScanSnapshot();
    } catch (error) {
      setApiErrorMessage(error instanceof Error ? error.message : "Impossible de mettre a jour ce statut.");
    } finally {
      setIsIncomingReferralStatusUpdating(false);
    }
  }

  function openIncomingReferralWhatsApp(item: SmartScanIncomingReferral) {
    const phone = normalizePhoneForWhatsApp(item.scout_phone || null);
    if (!phone) {
      setApiErrorMessage("Numero WhatsApp eclaireur introuvable.");
      return;
    }
    const statusText = referralStatusLabel(item.status);
    const message = `Salut ${item.scout_name || "Eclaireur"}, update dossier ${item.contact_name}: ${statusText}.`;
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    }
  }

  async function removeEclaireur(contactId: string) {
    if (!contactId || isRemovingEclaireurId) return;
    const confirmed = typeof window === "undefined" ? true : window.confirm("Retirer cet eclaireur de la liste ?");
    if (!confirmed) return;
    try {
      setIsRemovingEclaireurId(contactId);
      const response = await fetch("/api/popey-human/smart-scan/remove-eclaireur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalContactRef: contactId }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Suppression eclaireur impossible.");
      }
      setEclaireurIds((prev) => prev.filter((id) => id !== contactId));
      setApiErrorMessage("Eclaireur retire de la liste.");
      setTimeout(() => setApiErrorMessage(""), 1800);
      await refreshSmartScanSnapshot();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Suppression eclaireur impossible.";
      if (message.includes("is_eclaireur_active")) {
        setEclaireurIds((prev) => prev.filter((id) => id !== contactId));
        setApiErrorMessage("Retire localement. Migration SQL serveur requise pour synchroniser la suppression.");
      } else {
        setApiErrorMessage(message);
      }
    } finally {
      setIsRemovingEclaireurId(null);
    }
  }

  async function ensureEclaireurLink(contactId: string, options?: { autoCopy?: boolean }) {
    const fullContact = getContactById(contactId);
    const contact = fullContact || eclaireurDirectory[contactId] || null;
    const autoCopy = options?.autoCopy === true;
    try {
      setLoadingEclaireurLinkContactId(contactId);
      const response = await fetch("/api/popey-human/smart-scan/eclaireur-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          externalContactRef: contactId,
          fullName: contact?.name || "",
          city: contact?.city || null,
          phoneE164: fullContact?.phone ? normalizePhoneForWhatsApp(fullContact.phone) || fullContact.phone : null,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        shortCode?: string | null;
        shortUrl?: string | null;
        fullUrl?: string | null;
        legacyShortUrl?: string | null;
        legacyFullUrl?: string | null;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Impossible de generer le lien eclaireur.");
      }
      setEclaireurLinksByContactId((prev) => ({
        ...prev,
        [contactId]: {
          shortCode: payload.shortCode || null,
          shortUrl: payload.shortUrl || null,
          fullUrl: payload.fullUrl || null,
          legacyShortUrl: payload.legacyShortUrl || null,
          legacyFullUrl: payload.legacyFullUrl || null,
        },
      }));
      const generatedUrl = payload.shortUrl || payload.fullUrl || null;
      if (autoCopy && generatedUrl) {
        setCopyingEclaireurLinkContactId(contactId);
        await copyTextToClipboard(generatedUrl);
        setApiErrorMessage("Lien eclaireur genere et copie.");
      } else {
        setApiErrorMessage("Lien eclaireur genere.");
      }
      setTimeout(() => setApiErrorMessage(""), 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de generer le lien eclaireur.";
      setApiErrorMessage(message);
    } finally {
      setLoadingEclaireurLinkContactId((prev) => (prev === contactId ? null : prev));
      setCopyingEclaireurLinkContactId((prev) => (prev === contactId ? null : prev));
    }
  }

  async function copyEclaireurLink(contactId: string) {
    const link = eclaireurLinksByContactId[contactId];
    const url = link?.shortUrl || link?.fullUrl || null;
    if (!url) return;
    try {
      setCopyingEclaireurLinkContactId(contactId);
      await copyTextToClipboard(url);
      setApiErrorMessage("Lien eclaireur copie.");
      setTimeout(() => setApiErrorMessage(""), 1200);
    } catch {
      setApiErrorMessage("Impossible de copier le lien eclaireur.");
    } finally {
      setCopyingEclaireurLinkContactId((prev) => (prev === contactId ? null : prev));
    }
  }

  async function importSingleContactManually(options?: {
    firstName?: string;
    lastName?: string;
    metier?: string;
    city?: string;
    phone?: string;
  }) {
    const firstName = String(options?.firstName || "").trim();
    const lastName = String(options?.lastName || "").trim();
    const fallbackName = manualScoutName.trim();
    const name = [firstName, lastName].filter(Boolean).join(" ").trim() || fallbackName;
    const metier = String(options?.metier || "").trim();
    const city = String(options?.city ?? manualScoutCity).trim() || "Inconnue";
    const phone = String(options?.phone ?? manualScoutPhone).trim();
    if (!name) {
      setApiErrorMessage("Renseigne au moins le nom du contact.");
      return;
    }
    const manualId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newContact: DailyContact = {
      id: manualId,
      name,
      phone: phone || null,
      city,
      companyHint: metier || "Ajout manuel",
      capsule: "Ajoute manuellement",
      communityKnownBy: 1,
      dominantTags: ["✍️ Ajout manuel", "🤝 A qualifier"],
      externalNews: "Contact ajouté manuellement depuis le profil",
    };

    setImportedContacts((prev) => [newContact, ...prev]);
    setImportSummary((prev) => (prev ? `${prev} • +1 manuel` : "1 contact ajoute manuellement"));
    setStage("daily");
    setQualifierAutoOpenPausedUntilMs(Date.now() + 8000);
    setShowEclaireursPanel(true);
    setApiErrorMessage("");
    setManualScoutName("");
    setManualScoutCity("");
    setManualScoutPhone("");
    setManualScoutFirstName("");
    setManualScoutLastName("");
    setManualScoutMetier("");
    promoteContactToEclaireur(newContact);
    try {
      await postSmartScan("import-contacts", {
        source: "manual-single",
        contacts: [
          {
            externalContactRef: newContact.id,
            fullName: newContact.name,
            city: newContact.city || null,
            companyHint: newContact.companyHint || null,
            phoneE164: normalizePhoneForWhatsApp(newContact.phone) || newContact.phone || null,
            importIndex: 0,
          },
        ],
      });
      await postSmartScan("session-progress", {
        queueIndex: 0,
        queueSize: dailyQueueCount,
        importedTotal: importedTotalCount + 1,
      });
      await postSmartScan("promote-eclaireur", {
        externalContactRef: newContact.id,
        fullName: newContact.name,
        city: newContact.city,
        companyHint: newContact.companyHint,
      });
      await refreshSmartScanSnapshot();
      await ensureEclaireurLink(newContact.id, { autoCopy: true });
      setApiErrorMessage("Eclaireur manuel ajoute et lien copie.");
      setTimeout(() => setApiErrorMessage(""), 1600);
    } catch {
      setApiErrorMessage("Eclaireur ajoute. Synchronisation serveur en cours.");
    }
  }

  async function openEclaireurTemplates(contactId: string) {
    const contact = getContactById(contactId);
    const fallback = eclaireurDirectory[contactId] || null;
    const contactName = contact?.name || fallback?.name || "";
    if (!contactName) return;
    const res = (await postSmartScan("eclaireur-templates", {
      contactName,
      metier: resolveOwnerMetierLabel(myProfile, "") || null,
    })) as { templates?: Array<{ id: string; label: string; message: string }> };
    setSelectedEclaireurTemplateContactId(contactId);
    setEclaireurTemplates(res.templates || []);
  }

  function leaveScanTunnelToNeutral() {
    if (hasImportedContacts) {
      setStage("daily");
    }
    if (selectedAction === "qualifier") {
      setDismissedQualifierContactId(current.id);
      setQualifierAutoOpenPausedUntilMs(Date.now() + 1500);
    }
    setShowTemplateModal(false);
    setShowSearchPanel(false);
    setShowHistoryPanel(false);
    setShowEclaireursPanel(false);
    setShowAlliancesPanel(false);
    setSelectedIncomingReferralId(null);
    setShowContactProfile(false);
    setShowTrustLevelPrompt(false);
    setShowMyProfilePanel(false);
    setSelectedAction(null);
    setModalErrorMessage("");
    setModalInfoMessage("");
  }

  function openContactProfile(contactId: string) {
    const sourcePanel = showSearchPanel ? (searchInnerTab === "history" ? "history" : "search") : showHistoryPanel ? "history" : "other";
    setProfileContactId(contactId);
    setShowProfileActions(false);
    setShowContactProfile(true);
    setShowSearchPanel(false);
    trackSmartScanEvent("contact_opened", {
      externalContactRef: contactId,
      sourcePanel,
      hasTrustLevel: Boolean(trustLevelStore[contactId]),
    });
  }

  function openContactProfileWithTrustGuard(contactId: string) {
    if (trustLevelStore[contactId]) {
      openContactProfile(contactId);
      return;
    }
    setTrustPromptContactId(contactId);
    setShowTrustLevelPrompt(true);
  }

  function trustLevelLabel(level: TrustLevel) {
    return TRUST_LEVEL_OPTIONS.find((option) => option.id === level)?.label ?? "A definir";
  }

  function buildAllianceInviteMessage(prospect: SmartScanAllianceProspect) {
    const firstName = prospect.full_name.split(" ")[0] || prospect.full_name;
    const myFirstName = (myProfile?.first_name || profileForm.firstName || "").trim();
    const myMetier = String(allianceSourceMetier || "").trim() || resolveOwnerMetierLabel(myProfile, "professionnel");
    const city = allianceCity || myProfile?.ville || "ma ville";
    const intro = myFirstName ? `je suis ${myFirstName}, ${myMetier} a ${city}.` : `je suis ${myMetier} a ${city}.`;
    return `Bonjour ${firstName}, ${intro}

Je me permets de t ecrire car on croise souvent des personnes qui auraient besoin d un autre pro de confiance, et je pense que nos activites peuvent se completer.

Je te propose un test simple : tu me recommandes a une personne, je lui fais une seance totalement gratuitement, et tu juges librement.

Si l experience est bonne, on garde le contact pour de futures recommandations.

Si tu es partant, je t envoie un lien Popey pour suivre simplement la recommandation.`;
  }

  function clearAllianceRevealQueue() {
    allianceRevealTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    allianceRevealTimeoutsRef.current = [];
  }

  useEffect(() => {
    return () => {
      clearAllianceRevealQueue();
    };
  }, []);

  async function loadAllianceProspectsSnapshot() {
    const response = await fetch(
      `/api/popey-human/smart-scan/alliances/prospects?provider=${allianceDirectoryMode === "internal" ? "internal" : "b2b"}`,
      {
      method: "GET",
      cache: "no-store",
      },
    );
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      prospects?: SmartScanAllianceProspect[];
    };
    if (!response.ok) {
      throw new Error(payload.error || "Impossible de charger les alliances externes.");
    }
    setAllianceProspects(payload.prospects || []);
  }

  async function runAllianceSearch() {
    try {
      setIsAlliancesSearching(true);
      clearAllianceRevealQueue();
      setIsAllianceRevealRunning(true);
      setRevealedAllianceProspectIds([]);
      setAllianceProspects([]);
      const targetMetiers = allianceTargetMetiersInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const response = await fetch("/api/popey-human/smart-scan/alliances/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: allianceDirectoryMode === "internal" ? "internal" : "b2b",
          city: allianceCity,
          sourceMetier: allianceSourceMetier || null,
          targetMetiers,
          radiusKm: Number.parseInt(allianceRadiusKm || "15", 10) || 15,
          limit: 10,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: unknown;
        prospects?: SmartScanAllianceProspect[];
      };
      if (!response.ok) {
        throw new Error(toUiErrorMessage(payload.error, "Recherche alliances impossible."));
      }
      const nextProspects = payload.prospects || [];
      setAllianceProspects(nextProspects);
      if (nextProspects.length === 0) {
        setIsAllianceRevealRunning(false);
      } else {
        nextProspects.forEach((prospect, idx) => {
          const timeoutId = window.setTimeout(() => {
            setRevealedAllianceProspectIds((previous) => (previous.includes(prospect.id) ? previous : [...previous, prospect.id]));
            if (idx === nextProspects.length - 1) {
              setIsAllianceRevealRunning(false);
            }
          }, idx * 140);
          allianceRevealTimeoutsRef.current.push(timeoutId);
        });
      }
      if (allianceDirectoryMode === "internal") {
        await loadInternalAllianceInvites();
      } else {
        await loadAllianceInvites();
      }
      setApiErrorMessage("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Recherche alliances impossible.";
      setApiErrorMessage(message);
      setIsAllianceRevealRunning(false);
    } finally {
      setIsAlliancesSearching(false);
    }
  }

  function openAllianceMessageEditor(prospect: SmartScanAllianceProspect) {
    setSelectedAllianceProspect(prospect);
    setAllianceMessageDraft(buildAllianceInviteMessage(prospect));
    setShowAllianceMessageModal(true);
    setModalErrorMessage("");
    setModalInfoMessage("");
  }

  function closeAllianceMessageEditor() {
    setShowAllianceMessageModal(false);
    setSelectedAllianceProspect(null);
    setAllianceMessageDraft("");
  }

  async function inviteAllianceProspect(prospect: SmartScanAllianceProspect, messageDraftInput: string) {
    try {
      const messageDraft = String(messageDraftInput || "").trim();
      if (!messageDraft) {
        throw new Error("Le message est vide. Ajoute un texte avant envoi.");
      }
      const response = await fetch("/api/popey-human/smart-scan/alliances/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId: prospect.id,
          channel: "whatsapp",
          messageDraft,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        whatsappUrl?: string | null;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Invitation alliance impossible.");
      }
      if (payload.whatsappUrl && typeof window !== "undefined") {
        window.open(payload.whatsappUrl, "_blank", "noopener,noreferrer");
      } else {
        setApiErrorMessage("Invitation creee. Numero manquant pour ouverture WhatsApp directe.");
      }
      setAllianceProspects((currentList) =>
        currentList.map((item) => (item.id === prospect.id ? { ...item, status: "contacted" } : item)),
      );
      if (allianceDirectoryMode === "internal") {
        await loadInternalAllianceInvites();
      } else {
        await loadAllianceInvites();
      }
      await loadAllianceProspectsSnapshot();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invitation alliance impossible.";
      setApiErrorMessage(message);
      setModalErrorMessage(message);
      throw error;
    }
  }

  async function sendAllianceMessageFromModal() {
    if (!selectedAllianceProspect) return;
    try {
      setIsAllianceMessageSending(true);
      setModalErrorMessage("");
      await inviteAllianceProspect(selectedAllianceProspect, allianceMessageDraft);
      closeAllianceMessageEditor();
      setModalInfoMessage("Message pret dans WhatsApp. Tu peux l envoyer quand tu veux.");
    } catch {
      // Errors are surfaced via modalErrorMessage/apiErrorMessage.
    } finally {
      setIsAllianceMessageSending(false);
    }
  }

  async function loadAllianceInvites() {
    try {
      setIsAllianceInvitesLoading(true);
      const response = await fetch("/api/popey-human/smart-scan/alliances/invites", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        invites?: SmartScanAllianceInvite[];
      };
      if (!response.ok) {
        throw new Error(payload.error || "Impossible de charger le pipeline alliances.");
      }
      setAllianceInvites(payload.invites || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de charger le pipeline alliances.";
      setApiErrorMessage(message);
    } finally {
      setIsAllianceInvitesLoading(false);
    }
  }

  async function loadInternalAllianceInvites() {
    try {
      setIsInternalInvitesLoading(true);
      const response = await fetch("/api/popey-human/smart-scan/alliances/invites?provider=internal", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        invites?: SmartScanAllianceInvite[];
      };
      if (!response.ok) {
        throw new Error(payload.error || "Impossible de charger les demandes internes.");
      }
      setInternalAllianceInvites(payload.invites || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de charger les demandes internes.";
      setApiErrorMessage(message);
    } finally {
      setIsInternalInvitesLoading(false);
    }
  }

  function startActionFromProfile(action: Exclude<DailyCategory, "passer" | "qualifier">) {
    if (!profileContact) return;
    if (!profileQualifier?.opportunityChoice || profileQualifier.communityTags.length === 0) {
      const nextIndex = contactsData.findIndex((contact) => contact.id === profileContact.id);
      if (nextIndex >= 0) setIndex(nextIndex);
      setShowContactProfile(false);
      setShowSearchPanel(false);
      setShowQualificationNeededPopup(true);
      return;
    }
    const nextIndex = contactsData.findIndex((contact) => contact.id === profileContact.id);
    if (nextIndex >= 0) setIndex(nextIndex);
    setActionFromProfileContactId(profileContact.id);
    setShowContactProfile(false);
    setShowSearchPanel(false);
    const fallbackDraft = buildTemplate(action, profileContact, profileQualifier, myProfile);
    const nextDraft = resolveMessageDraft(action, fallbackDraft, profileContact);
    setSelectedAction(action);
    setDraftMessage(nextDraft);
    setModalInfoMessage("");
    setAiGenerationSource(null);
    setAiPromptVersion(null);
    setAiGeneratedAt(null);
    setShowTemplateModal(true);
  }

  function editProfileQualification() {
    if (!profileContact) return;
    const nextIndex = contactsData.findIndex((contact) => contact.id === profileContact.id);
    if (nextIndex >= 0) setIndex(nextIndex);
    setShowContactProfile(false);
    setShowSearchPanel(false);
    setTimeout(() => triggerAction("qualifier"), 60);
  }

  function handleDockAction(tab: "search" | "scan" | "eclaireurs" | "alliances" | "profile") {
    setShowSearchPanel(false);
    setShowHistoryPanel(false);
    setShowEclaireursPanel(false);
    setShowAlliancesPanel(false);
    setShowAllianceInvitesModal(false);
    setShowInternalInvitesModal(false);
    setShowAllianceMessageModal(false);
    setShowMyProfilePanel(false);
    setSelectedEclaireurTemplateContactId(null);
    setEclaireurTemplates([]);
    if (tab === "scan") {
      if (!hasImportedContacts) {
        setApiErrorMessage("Importe d abord ton fichier .vcf ou .csv pour lancer un scan reel.");
        return;
      }
      setDismissedQualifierContactId(null);
      setStage("daily");
      return;
    }
    if (tab === "profile") {
      setShowMyProfilePanel(true);
      return;
    }
    if (tab === "search") {
      if (stage === "scan") {
        if (!hasImportedContacts) {
          setApiErrorMessage("Importe d abord ton fichier .vcf ou .csv pour utiliser le cockpit.");
          return;
        }
        setStage("daily");
        setTimeout(() => setShowSearchPanel(true), 40);
        return;
      }
      setSearchInnerTab("search");
      setShowSearchPanel(true);
      return;
    }
    if (tab === "eclaireurs") {
      if (stage === "scan") {
        if (!hasImportedContacts) {
          setApiErrorMessage("Importe d abord ton fichier .vcf ou .csv pour utiliser le cockpit.");
          return;
        }
        setStage("daily");
        setTimeout(() => setShowEclaireursPanel(true), 40);
        return;
      }
      setShowEclaireursPanel(true);
      return;
    }
    if (tab === "alliances") {
      if (stage === "scan") {
        if (!hasImportedContacts) {
          setApiErrorMessage("Importe d abord ton fichier .vcf ou .csv pour utiliser le cockpit.");
          return;
        }
        setStage("daily");
        setTimeout(() => setShowAlliancesPanel(true), 40);
        return;
      }
      setShowAlliancesPanel(true);
      return;
    }
    if (stage === "scan") {
      if (!hasImportedContacts) {
        setApiErrorMessage("Importe d abord ton fichier .vcf ou .csv pour utiliser le cockpit.");
        return;
      }
      setStage("daily");
      setTimeout(() => {
        setSearchInnerTab("history");
        setShowSearchPanel(true);
      }, 40);
      return;
    }
    setSearchInnerTab("history");
    setShowSearchPanel(true);
  }

  function openContactImportPicker() {
    contactImportInputRef.current?.click();
  }

  async function importContactsFromFile(file: File) {
    const lowerName = file.name.toLowerCase();
    const raw = await file.text();
    const importedRows =
      lowerName.endsWith(".vcf") || raw.includes("BEGIN:VCARD")
        ? parseVcfContacts(raw)
        : parseCsvContacts(raw);
    const nextContacts = buildDailyContactsFromImport(importedRows);
    if (nextContacts.length === 0) {
      setApiErrorMessage("Aucun contact exploitable detecte dans le fichier.");
      return;
    }
    setImportedContacts(nextContacts);
    setImportSummary(`${nextContacts.length} contacts importes depuis ${file.name}`);
    setScanCount(0);
    setStage("scan");
    setIndex(0);
    setPassedContactIds([]);
    setHasHydratedServerProgress(true);
    setApiErrorMessage("");
    try {
      await postSmartScan("import-contacts", {
        source: "file",
        contacts: nextContacts.map((contact, idx) => ({
          externalContactRef: contact.id,
          fullName: contact.name,
          city: contact.city || null,
          companyHint: contact.companyHint || null,
          phoneE164: normalizePhoneForWhatsApp(contact.phone) || contact.phone || null,
          importIndex: idx,
        })),
      });
      await postSmartScan("session-progress", {
        queueIndex: 0,
        queueSize: dailyQueueCount,
        importedTotal: nextContacts.length,
      });
      await refreshSmartScanSnapshot();
    } catch {
      // Keep local import, but clearly signal that server persistence failed.
      setApiErrorMessage("Import local ok mais sauvegarde serveur echouee. Reessaie l import depuis Profil.");
    }
  }

  async function handleContactImportChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsImportingContacts(true);
      await importContactsFromFile(file);
    } catch {
      setApiErrorMessage("Import impossible. Utilise un fichier .vcf ou .csv valide.");
    } finally {
      setIsImportingContacts(false);
      event.target.value = "";
    }
  }

  async function importContactsFromDirectPicker() {
    const nav = navigator as Navigator & {
      contacts?: {
        select?: (properties: string[], options?: { multiple?: boolean }) => Promise<Array<{ name?: string[]; tel?: string[] }>>;
      };
    };
    if (typeof nav.contacts?.select !== "function") {
      setApiErrorMessage("Acces direct indisponible sur ce navigateur. Utilise l import .vcf/.csv.");
      return;
    }
    try {
      setIsImportingContacts(true);
      const picked = await nav.contacts.select(["name", "tel"], { multiple: true });
      const rows: ImportedContactRow[] = picked.map((entry) => ({
        fullName: entry.name?.[0]?.trim() || entry.tel?.[0]?.trim() || "Contact",
        phone: entry.tel?.[0]?.trim() || null,
        city: null,
        companyHint: "Import direct telephone",
      }));
      const nextContacts = buildDailyContactsFromImport(rows);
      if (nextContacts.length === 0) {
        setApiErrorMessage("Aucun contact exploitable recupere en acces direct.");
        return;
      }
      setImportedContacts(nextContacts);
      setImportSummary(`${nextContacts.length} contacts importes via acces direct`);
      setScanCount(0);
      setStage("scan");
      setIndex(0);
      setPassedContactIds([]);
      setHasHydratedServerProgress(true);
      setApiErrorMessage("");
      try {
        await postSmartScan("import-contacts", {
          source: "direct-picker",
          contacts: nextContacts.map((contact, idx) => ({
            externalContactRef: contact.id,
            fullName: contact.name,
            city: contact.city || null,
            companyHint: contact.companyHint || null,
            phoneE164: normalizePhoneForWhatsApp(contact.phone) || contact.phone || null,
            importIndex: idx,
          })),
        });
        await postSmartScan("session-progress", {
          queueIndex: 0,
          queueSize: dailyQueueCount,
          importedTotal: nextContacts.length,
        });
        await refreshSmartScanSnapshot();
      } catch {
        setApiErrorMessage("Import local ok mais sauvegarde serveur echouee. Reessaie l import depuis Profil.");
      }
    } catch {
      setApiErrorMessage("Acces direct refuse ou indisponible. Utilise l import .vcf/.csv.");
    } finally {
      setIsImportingContacts(false);
    }
  }

  function clearImportedContacts() {
    setImportedContacts([]);
    setImportSummary("");
    setScanCount(0);
    setIndex(0);
    setStage("scan");
    setPassedContactIds([]);
    setHasHydratedServerProgress(true);
    setEclaireurIds([]);
    setEclaireurDirectory({});
    setEclaireurStatsStore({});
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SMART_SCAN_IMPORTED_CONTACTS_KEY);
      window.localStorage.removeItem(SMART_SCAN_IMPORTED_CONTACTS_BACKUP_KEY);
      window.localStorage.removeItem(SMART_SCAN_SESSION_KEY);
      window.localStorage.removeItem(SMART_SCAN_ECLAIREURS_KEY);
      window.localStorage.removeItem(SMART_SCAN_PASSED_CONTACTS_KEY);
      window.sessionStorage.removeItem(PENDING_WHATSAPP_CONTEXT_KEY);
    }
    void postSmartScan("clear-import", {}).catch(() => null);
  }

  function restartDailyQueueFromFirstContact() {
    if (!hasImportedContacts) {
      setApiErrorMessage("Importe d abord tes contacts pour lancer la file quotidienne.");
      return;
    }
    setIndex(0);
    setStage("daily");
    setShowMyProfilePanel(false);
    setApiErrorMessage("");
  }

  function openImportFromProfile() {
    setShowMyProfilePanel(false);
    openContactImportPicker();
  }

  function resetScanSession() {
    setScanCount(0);
    setStage("scan");
  }

  function hydrateProfileForm(profile: SmartScanProfile | null) {
    setProfileForm({
      firstName: profile?.first_name || "",
      lastName: profile?.last_name || "",
      metier: profile?.metier || "",
      buddyName: profile?.buddy_name || "",
      buddyMetier: profile?.buddy_metier || "",
      trioName: profile?.trio_name || "",
      trioMetier: profile?.trio_metier || "",
      eclaireurRewardMode: profile?.eclaireur_reward_mode === "fixed" ? "fixed" : "percent",
      eclaireurRewardPercent:
        profile?.eclaireur_reward_percent !== null && profile?.eclaireur_reward_percent !== undefined
          ? String(profile.eclaireur_reward_percent)
          : "",
      eclaireurRewardFixedEur:
        profile?.eclaireur_reward_fixed_eur !== null && profile?.eclaireur_reward_fixed_eur !== undefined
          ? String(profile.eclaireur_reward_fixed_eur)
          : "",
      ville: profile?.ville || "",
      phone: profile?.phone || "",
      sectorId: profile?.sector_id || "",
      metierLabel: profile?.metier_label || "",
      publicSlug: profile?.public_slug || "",
      offreDecouverte: profile?.offre_decouverte || "",
      bio: profile?.bio || "",
      contactLink: profile?.contact_link || "",
    });
  }

  async function loadMyProfile() {
    const profileController = new AbortController();
    const linkController = new AbortController();
    const profileTimeoutId = window.setTimeout(() => profileController.abort(), PROFILE_REQUEST_TIMEOUT_MS);
    const linkTimeoutId = window.setTimeout(() => linkController.abort(), PROFILE_REQUEST_TIMEOUT_MS);
    try {
      setIsProfileLoading(true);
      const [profileResponse, linkResponse] = await Promise.all([
        fetch("/api/popey-human/smart-scan/profile", { cache: "no-store", signal: profileController.signal }),
        fetch("/api/popey-human/smart-scan/self-scout-link", { cache: "no-store", signal: linkController.signal }),
      ]);
      const profilePayload = (await profileResponse.json().catch(() => ({}))) as { error?: string; profile?: SmartScanProfile | null };
      const linkPayload = (await linkResponse.json().catch(() => ({}))) as {
        error?: string;
        shortCode?: string | null;
        shortUrl?: string | null;
        inviteToken?: string | null;
        fullUrl?: string | null;
        previewUrl?: string | null;
        legacyShortUrl?: string | null;
        legacyFullUrl?: string | null;
      };
      if (!profileResponse.ok) {
        throw new Error(profilePayload.error || "Impossible de charger le profil.");
      }
      if (!linkResponse.ok) {
        throw new Error(linkPayload.error || "Impossible de charger le lien Eclaireur.");
      }
      setMyProfile(profilePayload.profile || null);
      hydrateProfileForm(profilePayload.profile || null);
      setSelfScoutLink({
        shortCode: linkPayload.shortCode || null,
        shortUrl: linkPayload.shortUrl || null,
        inviteToken: linkPayload.inviteToken || null,
        fullUrl: linkPayload.fullUrl || null,
        previewUrl: linkPayload.previewUrl || null,
        legacyShortUrl: linkPayload.legacyShortUrl || null,
        legacyFullUrl: linkPayload.legacyFullUrl || null,
      });
      setApiErrorMessage("");
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "AbortError"
          ? "Le serveur met trop de temps a repondre. On continue sans bloquer l ecran."
          : error instanceof Error
            ? error.message
            : "Impossible de charger le profil.";
      setApiErrorMessage(message);
    } finally {
      window.clearTimeout(profileTimeoutId);
      window.clearTimeout(linkTimeoutId);
      setIsProfileLoading(false);
      setHasProfileBootstrapResolved(true);
    }
  }

  async function loadOnboardingSectors() {
    try {
      const response = await fetch("/api/vocabulary", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        sectors?: SectorVocabularyListItem[];
        defaultSectorId?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Impossible de charger les secteurs.");
      setOnboardingSectors(payload.sectors || []);
      if (payload.defaultSectorId) {
        setOnboardingSelectedSectorId((prev) => prev || payload.defaultSectorId || "other_custom");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de charger les secteurs.";
      setApiErrorMessage(message);
    }
  }

  function getOnboardingMetierLabel() {
    const selected = onboardingSectorCatalog.find((item) => item.sector_id === onboardingSelectedSectorId);
    if (selected && onboardingSelectedSectorId !== "other_custom") {
      return selected.label;
    }
    return String(onboardingCustomMetier || onboardingSectorQuery || "").trim();
  }

  async function saveOnboardingSectorStep() {
    const metierLabel = getOnboardingMetierLabel();
    if (!metierLabel) {
      setApiErrorMessage("Choisis un metier ou renseigne ton metier libre.");
      return;
    }
    try {
      setIsOnboardingSaving(true);
      const fallbackSlugBase = normalizePublicSlugInput(
        `${String(myProfile?.first_name || profileForm.firstName || "membre").trim()}-${metierLabel}`,
      );
      const fallbackSlugSuffix = String(myProfile?.id || "").slice(0, 6) || "popey";
      const knownServerSector = onboardingSectors.some((item) => item.sector_id === onboardingSelectedSectorId);
      const payload = {
        sectorId: knownServerSector ? onboardingSelectedSectorId : "other_custom",
        metierLabel,
        metier: metierLabel,
        publicSlug: `${fallbackSlugBase || "membre"}-${fallbackSlugSuffix}`.slice(0, 120),
        offreDecouverte: profileForm.offreDecouverte || "1 seance offerte",
      };
      const response = await fetch("/api/popey-human/smart-scan/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; profile?: SmartScanProfile | null };
      if (!response.ok) throw new Error(body.error || "Impossible d enregistrer le metier.");
      setMyProfile(body.profile || null);
      hydrateProfileForm(body.profile || null);
      setOnboardingStep(2);
      setApiErrorMessage("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d enregistrer le metier.";
      setApiErrorMessage(message);
    } finally {
      setIsOnboardingSaving(false);
    }
  }

  async function saveOnboardingPrimaryInfoStep() {
    const firstName = String(profileForm.firstName || "").trim();
    const lastName = String(profileForm.lastName || "").trim();
    const ville = String(profileForm.ville || "").trim();
    const phone = String(profileForm.phone || "").trim();
    const rewardPercent = Number.parseFloat(String(profileForm.eclaireurRewardPercent || "").replace(",", "."));
    if (!firstName || !lastName || !ville || !phone) {
      setApiErrorMessage("Renseigne prenom, nom, ville et telephone pour continuer.");
      return;
    }
    if (!Number.isFinite(rewardPercent) || rewardPercent <= 0 || rewardPercent > 100) {
      setApiErrorMessage("Indique le pourcentage de retribution eclaireur (entre 1 et 100).");
      return;
    }
    try {
      setIsOnboardingSaving(true);
      const response = await fetch("/api/popey-human/smart-scan/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          ville,
          phone,
          eclaireurRewardMode: "percent",
          eclaireurRewardPercent: rewardPercent,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; profile?: SmartScanProfile | null };
      if (!response.ok) throw new Error(body.error || "Impossible d enregistrer les infos principales.");
      setMyProfile(body.profile || null);
      hydrateProfileForm(body.profile || null);
      setOnboardingStep(3);
      setApiErrorMessage("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d enregistrer les infos principales.";
      setApiErrorMessage(message);
    } finally {
      setIsOnboardingSaving(false);
    }
  }

  async function sharePublicProfile(channel: "copy" | "whatsapp" | "linkedin" | "instagram") {
    try {
      if (!publicProfileUrl) {
        setApiErrorMessage("Definis d abord un slug public dans ton profil.");
        return;
      }
      const text = `Decouvre mon profil Popey: ${publicProfileUrl}`;
      if (channel === "copy") {
        await copyTextToClipboard(publicProfileUrl);
        setApiErrorMessage("Lien public copie.");
        setTimeout(() => setApiErrorMessage(""), 1200);
        return;
      }
      if (channel === "whatsapp") {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
        return;
      }
      if (channel === "linkedin") {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicProfileUrl)}`,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }
      window.open(
        `https://www.instagram.com/?url=${encodeURIComponent(publicProfileUrl)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } catch {
      setApiErrorMessage("Impossible de partager le lien public.");
    }
  }

  async function saveOnboardingQualificationStep() {
    if (!onboardingFirstContact || !onboardingQualificationType || !onboardingQualificationHeat) {
      setApiErrorMessage("Selectionne type + temperature pour continuer.");
      return;
    }
    // Ne bloque jamais le flow onboarding sur une erreur reseau.
    setOnboardingStep(5);
    setApiErrorMessage("");
    try {
      setIsOnboardingSaving(true);
      await postSmartScan("qualification", {
        contactId: onboardingFirstContact.id,
        fullName: onboardingFirstContact.name,
        city: onboardingFirstContact.city || null,
        companyHint: onboardingFirstContact.companyHint || null,
        heat: onboardingQualificationHeat,
        opportunityChoice: onboardingQualificationType,
        communityTags: [COMMUNITY_OPTIONS[0].id],
        estimatedGain: getEstimatedGain(onboardingQualificationType, [COMMUNITY_OPTIONS[0].id]),
      });
    } catch (error) {
      console.warn("onboarding qualification persistence failed", error);
    } finally {
      setIsOnboardingSaving(false);
    }
  }

  async function completeOnboardingWithFirstMessage() {
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - onboardingStartedAtMs) / 1000));
    const message = String(onboardingMessageDraft || "").trim();
    if (!message) {
      setApiErrorMessage("Genere ou ecris le message exemple.");
      return;
    }
    try {
      setIsOnboardingSaving(true);
      const response = await fetch("/api/popey-human/smart-scan/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; profile?: SmartScanProfile | null };
      if (!response.ok) throw new Error(body.error || "Impossible de terminer l onboarding.");
      setMyProfile(body.profile || null);
      hydrateProfileForm(body.profile || null);
      void postSmartScan("analytics-event", {
        eventType: "onboarding_completed",
        metadata: {
          sector: onboardingSelectedSectorId,
          firstMessageSent: false,
          onboardingMode: "demo_only",
          timeToFirstMessage: elapsedSeconds,
        },
      }).catch(() => null);
      setShowOnboardingJ0(false);
      setOnboardingFlowLocked(false);
      setApiErrorMessage("");
      await refreshSmartScanSnapshot();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de terminer l onboarding.";
      setApiErrorMessage(message);
    } finally {
      setIsOnboardingSaving(false);
    }
  }

  async function copyTextToClipboard(text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!ok) {
      throw new Error("copy-failed");
    }
  }

  async function copySelfScoutLink(url: string | null) {
    if (!url) return;
    try {
      setIsCopyingSelfScoutLink(true);
      await copyTextToClipboard(url);
      setApiErrorMessage("Lien Eclaireur copie.");
      setTimeout(() => setApiErrorMessage(""), 1400);
    } catch {
      setApiErrorMessage("Impossible de copier le lien.");
    } finally {
      setIsCopyingSelfScoutLink(false);
    }
  }

  async function saveMyProfile() {
    try {
      setIsProfileSaving(true);
      const response = await fetch("/api/popey-human/smart-scan/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; profile?: SmartScanProfile | null };
      if (!response.ok) {
        throw new Error(payload.error || "Impossible d enregistrer le profil.");
      }
      setMyProfile(payload.profile || null);
      hydrateProfileForm(payload.profile || null);
      setIsEditingProfile(false);
      setApiErrorMessage("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d enregistrer le profil.";
      setApiErrorMessage(message);
    } finally {
      setIsProfileSaving(false);
    }
  }

  async function signOutFromSmartScan() {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } finally {
      if (typeof window !== "undefined") {
        window.location.href = "/popey-human/login";
      }
    }
  }

  const showAdvancedOpsInUserCockpit = false;
  const onboardingProgress = `${onboardingStep}/5`;
  const onboardingCanContinueSector =
    onboardingSelectedSectorId !== "other_custom" ||
    String(onboardingCustomMetier || onboardingSectorQuery || "").trim().length > 1;
  const onboardingCanContinuePrimaryInfo =
    String(profileForm.firstName || "").trim().length > 1 &&
    String(profileForm.lastName || "").trim().length > 1 &&
    String(profileForm.ville || "").trim().length > 1 &&
    String(profileForm.phone || "").trim().length > 5 &&
    Number.isFinite(Number.parseFloat(String(profileForm.eclaireurRewardPercent || "").replace(",", "."))) &&
    Number.parseFloat(String(profileForm.eclaireurRewardPercent || "").replace(",", ".")) > 0;
  const onboardingCanContinueImport = importedContacts.length >= 1;
  const onboardingCanContinueQualification = Boolean(onboardingQualificationType && onboardingQualificationHeat);
  const onboardingJ0Overlay = showOnboardingJ0 ? (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.22),rgba(9,11,22,0.97))] px-4 py-5 backdrop-blur-md">
      <section className="mx-auto max-h-[94dvh] min-h-[78dvh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-cyan-200/30 bg-[#0B1734]/95 p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Onboarding J0</p>
          <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-black text-white/85">{onboardingProgress}</span>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((stepIndex) => (
            <div
              key={`onboarding-progress-${stepIndex}`}
              className={`h-1.5 rounded-full ${stepIndex <= onboardingStep ? "bg-cyan-300" : "bg-white/15"}`}
            />
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`onboarding-step-${onboardingStep}`}
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
        {onboardingStep === 1 && (
          <div className="mt-5">
            <p className="text-3xl font-black tracking-tight">Quel est ton metier ?</p>
            <p className="mt-2 text-base text-white/80">Ce choix personnalise le vocabulaire de toute l app.</p>
            <input
              value={onboardingSectorQuery}
              onChange={(event) => {
                const value = event.target.value;
                setOnboardingSectorQuery(value);
                const exact = onboardingSectorCatalog.find((sector) => sector.label.toLowerCase() === value.trim().toLowerCase());
                if (exact) {
                  setOnboardingSelectedSectorId(exact.sector_id);
                  if (exact.sector_id !== "other_custom") setOnboardingCustomMetier("");
                }
              }}
              placeholder="Rechercher un secteur"
              className="mt-4 h-12 w-full rounded-2xl border border-white/20 bg-black/25 px-4 text-base"
            />
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
              {onboardingDisplayedSectors.map((sector) => (
                <button
                  key={sector.sector_id}
                  type="button"
                  onClick={() => {
                    setOnboardingSelectedSectorId(sector.sector_id);
                    setOnboardingSectorQuery(sector.label);
                    if (sector.sector_id !== "other_custom") setOnboardingCustomMetier("");
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold ${
                    onboardingSelectedSectorId === sector.sector_id
                      ? "border-cyan-300/45 bg-cyan-300/15 text-cyan-100"
                      : "border-white/15 bg-white/5 text-white/85"
                  }`}
                >
                  {sector.label}
                </button>
              ))}
              {onboardingShowOtherOption && (
                <button
                  type="button"
                  onClick={() => {
                    setOnboardingSelectedSectorId("other_custom");
                    setOnboardingCustomMetier(onboardingSectorQuery.trim());
                  }}
                  className="w-full rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-left text-sm font-semibold text-amber-100"
                >
                  Utiliser "{onboardingSectorQuery.trim()}" (Autre metier)
                </button>
              )}
            </div>
            {onboardingSelectedSectorId === "other_custom" && (
              <input
                value={onboardingCustomMetier}
                onChange={(event) => setOnboardingCustomMetier(event.target.value)}
                placeholder="Ton metier exact"
                className="mt-3 h-12 w-full rounded-2xl border border-white/20 bg-black/25 px-4 text-base"
              />
            )}
            <button
              type="button"
              onClick={() => {
                void saveOnboardingSectorStep();
              }}
              disabled={!onboardingCanContinueSector || isOnboardingSaving}
              className="mt-4 h-12 w-full rounded-2xl bg-gradient-to-r from-cyan-300 to-emerald-300 text-base font-black text-[#10263A] disabled:opacity-45"
            >
              Continuer
            </button>
          </div>
        )}
        {onboardingStep === 2 && (
          <div className="mt-5">
            <p className="text-2xl font-black">Renseigne tes infos principales</p>
            <p className="mt-2 text-base text-white/80">Avant la demo, complete ton profil de base.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={profileForm.firstName}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, firstName: event.target.value }))}
                placeholder="Prenom"
                className="h-12 w-full rounded-2xl border border-white/20 bg-black/25 px-4 text-base"
              />
              <input
                value={profileForm.lastName}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, lastName: event.target.value }))}
                placeholder="Nom"
                className="h-12 w-full rounded-2xl border border-white/20 bg-black/25 px-4 text-base"
              />
              <input
                value={profileForm.ville}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, ville: event.target.value }))}
                placeholder="Ville"
                className="h-12 w-full rounded-2xl border border-white/20 bg-black/25 px-4 text-base"
              />
              <input
                value={profileForm.phone}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="Telephone"
                className="h-12 w-full rounded-2xl border border-white/20 bg-black/25 px-4 text-base"
              />
              <div className="sm:col-span-2 rounded-2xl border border-amber-300/35 bg-amber-300/10 p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.09em] text-amber-100">
                  Info primordiale
                </p>
                <p className="mt-1 text-sm text-white/85">Quel pourcentage redistribues-tu a tes eclaireurs ?</p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={profileForm.eclaireurRewardPercent}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        eclaireurRewardMode: "percent",
                        eclaireurRewardPercent: event.target.value,
                      }))
                    }
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    placeholder="Ex: 10"
                    className="h-11 w-28 rounded-xl border border-white/20 bg-black/25 px-3 text-base"
                  />
                  <span className="text-lg font-black text-amber-100">%</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                void saveOnboardingPrimaryInfoStep();
              }}
              disabled={!onboardingCanContinuePrimaryInfo || isOnboardingSaving}
              className="mt-4 h-12 w-full rounded-2xl bg-gradient-to-r from-cyan-300 to-emerald-300 text-base font-black text-[#10263A] disabled:opacity-45"
            >
              Continuer
            </button>
          </div>
        )}
        {onboardingStep === 3 && (
          <div className="mt-5">
            <p className="text-2xl font-black">Commencons avec 1 de tes contacts</p>
            <p className="mt-2 text-base text-white/80">Ton premier prospect activable</p>
            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.09em] text-cyan-100/95">
              Mode demo educatif: aucun message n est envoye ici.
            </p>
            <div className="mt-4 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-3">
              <p className="text-base font-black text-cyan-100">{Math.min(importedContacts.length, 1)}/1 importe</p>
            </div>
            <button
              type="button"
              onClick={openContactImportPicker}
              className="mt-4 h-12 w-full rounded-2xl border border-cyan-300/35 bg-cyan-300/18 text-base font-black text-cyan-100"
            >
              Importer mes contacts
            </button>
            <button
              type="button"
              onClick={() => setOnboardingStep(4)}
              disabled={!onboardingCanContinueImport}
              className="mt-3 h-12 w-full rounded-2xl bg-gradient-to-r from-cyan-300 to-emerald-300 text-base font-black text-[#10263A] disabled:opacity-45"
            >
              Continuer
            </button>
          </div>
        )}
        {onboardingStep === 4 && (
          <div className="mt-5">
            <p className="text-2xl font-black">Qualification express du 1er contact</p>
            <p className="mt-2 text-base text-white/80">{onboardingFirstContact?.name || "Premier contact"} • Exemple sur 1 seul contact</p>
            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.09em] text-cyan-100/95">
              Demonstration uniquement, sans envoi reel.
            </p>
            <div className="mt-4 rounded-2xl border border-white/20 bg-white/6 p-3">
              <p className="px-2 pb-3 text-[11px] font-black uppercase tracking-[0.1em] text-cyan-100/90">1. Type d opportunite</p>
              <div className="grid grid-cols-2 gap-2.5">
              {OPPORTUNITY_OPTIONS.map((option) => (
                <button
                  key={`onboarding-op-${option.id}`}
                  type="button"
                  onClick={() => setOnboardingQualificationType(option.id)}
                  className={`h-11 rounded-full px-3 py-2 text-[12px] font-black ${
                    onboardingQualificationType === option.id ? "bg-emerald-300 text-emerald-950" : "bg-white/10 text-white/85"
                  }`}
                >
                  {option.label}
                </button>
              ))}
              </div>
            </div>
            <div className="mt-3 rounded-2xl border border-cyan-300/30 bg-cyan-300/12 p-3">
              <p className="px-2 pb-3 text-[11px] font-black uppercase tracking-[0.1em] text-cyan-100/95">2. Temperature du contact</p>
              <div className="grid grid-cols-3 gap-2.5">
                {(["froid", "tiede", "brulant"] as HeatLevel[]).map((heat) => (
                  <button
                    key={`onboarding-heat-${heat}`}
                    type="button"
                    onClick={() => setOnboardingQualificationHeat(heat)}
                    className={`h-11 rounded-full text-[13px] font-black ${
                      onboardingQualificationHeat === heat ? "bg-cyan-300 text-[#13253D]" : "bg-white/10 text-white/85"
                    }`}
                  >
                    {heat === "froid" ? "❄️ Froid" : heat === "tiede" ? "⚡ Tiede" : "🔥 Brulant"}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                void saveOnboardingQualificationStep();
              }}
              disabled={!onboardingCanContinueQualification || isOnboardingSaving}
              className="mt-4 h-12 w-full rounded-2xl bg-gradient-to-r from-cyan-300 to-emerald-300 text-base font-black text-[#10263A] disabled:opacity-45"
            >
              Continuer
            </button>
          </div>
        )}
        {onboardingStep === 5 && (
          <div className="mt-5">
            <p className="text-2xl font-black">Exemple de message (educatif)</p>
            <p className="mt-2 text-base text-white/80">Aucun message ne sera envoye pendant cet onboarding.</p>
            <div className="mt-4 rounded-2xl border border-white/20 bg-black/25 px-4 py-4 text-[17px] leading-relaxed text-white whitespace-pre-wrap sm:text-base">
              {onboardingMessageDraft}
            </div>
            <button
              type="button"
              onClick={() => {
                void completeOnboardingWithFirstMessage();
              }}
              disabled={!onboardingMessageDraft.trim() || isOnboardingSaving}
              className="mt-4 h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-300 to-cyan-300 text-base font-black text-[#10263A] disabled:opacity-45"
            >
              Terminer la demo pour voir la suite
            </button>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  ) : null;

  const shouldBlockBeforeMain = !hasProfileBootstrapResolved && !showOnboardingJ0;
  if (shouldBlockBeforeMain) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#10193D_0%,#0C122B_45%,#090B16_100%)] text-white">
        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6">
          <section className="relative w-full overflow-hidden rounded-3xl border border-cyan-200/20 bg-[#0B1734]/90 p-6 text-center backdrop-blur-xl">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full bg-cyan-300/20 blur-2xl"
              animate={{ opacity: [0.2, 0.45, 0.2], scale: [0.92, 1.08, 0.92] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -bottom-12 right-0 h-32 w-32 rounded-full bg-indigo-300/15 blur-2xl"
              animate={{ opacity: [0.15, 0.35, 0.15], scale: [1.05, 0.9, 1.05] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Popey Human</p>
            <p className="mt-2 text-xl font-black">Preparation de ton onboarding...</p>
            <p className="mt-1 text-sm text-white/75">On charge ton profil pour demarrer directement sur le bon flow.</p>
            <div className="mt-4 flex items-center justify-center gap-1.5">
              {[0, 1, 2].map((dot) => (
                <motion.span
                  key={`bootstrap-dot-${dot}`}
                  className="h-1.5 w-1.5 rounded-full bg-cyan-200/80"
                  animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: dot * 0.15, ease: "easeInOut" }}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (stage === "scan") {
    return (
      <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_10%_0%,#10193D_0%,#0C122B_45%,#090B16_100%)] text-white pb-24">
        <div className="mx-auto flex min-h-screen max-w-xl items-start px-4 pt-4 pb-24 sm:items-center">
          <section className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full bg-cyan-400/25 blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.4, 0.25] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -left-20 -bottom-24 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl"
              animate={{ scale: [1.1, 0.95, 1.1], opacity: [0.2, 0.35, 0.2] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Mini-Agence Smart Scan</p>
            <h1 className="mt-2 text-2xl font-black">{hasImportedContacts ? "Scan de ton telephone en cours..." : "Importe tes contacts pour lancer le scan"}</h1>
            <p className="mt-1 text-sm text-white/70">Analyse locale securisee, aucun contact en clair n est envoye.</p>
            <div className="mt-4 rounded-2xl border border-cyan-200/25 bg-cyan-400/10 p-3">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-cyan-100">Importer mes contacts reels</p>
              <p className="mt-1 text-[11px] text-white/70">
                Fichier .vcf ou .csv. Tous les contacts sont importes, mais seulement {DAILY_CONTACT_LIMIT} sont traites par jour.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openContactImportPicker}
                  disabled={isImportingContacts}
                  className="h-9 rounded-xl border border-cyan-200/35 bg-cyan-300/20 px-3 text-[11px] font-black uppercase tracking-wide text-cyan-50 disabled:opacity-50"
                >
                  {isImportingContacts ? "Import en cours..." : "Importer un fichier"}
                </button>
                {supportsDirectContactPicker && (
                  <button
                    type="button"
                    onClick={() => {
                      void importContactsFromDirectPicker();
                    }}
                    disabled={isImportingContacts}
                    className="h-9 rounded-xl border border-emerald-200/35 bg-emerald-300/20 px-3 text-[11px] font-black uppercase tracking-wide text-emerald-50 disabled:opacity-50"
                  >
                    Tester acces direct
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowImportHelp((value) => !value)}
                  className="h-9 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-black uppercase tracking-wide text-white/85"
                >
                  {showImportHelp ? "Masquer aide" : "Comment exporter ?"}
                </button>
                {importedContacts.length > 0 && (
                  <button
                    type="button"
                    onClick={clearImportedContacts}
                    className="h-9 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-black uppercase tracking-wide text-white/85"
                  >
                    Retirer l import
                  </button>
                )}
              </div>
              {!hasImportedContacts && (
                <p className="mt-2 rounded-xl border border-amber-200/35 bg-amber-300/15 px-2 py-1 text-[11px] text-amber-100">
                  Aucun scan simule: importe d abord ton fichier pour activer le vrai flux.
                </p>
              )}
              <input
                ref={contactImportInputRef}
                type="file"
                accept=".vcf,.csv,text/vcard,text/csv"
                className="hidden"
                onChange={(event) => {
                  void handleContactImportChange(event);
                }}
              />
              {showImportHelp && (
                <div className="mt-2 rounded-xl border border-white/15 bg-[#0B1734]/65 px-3 py-2 text-[11px] text-white/80">
                  <p className="font-black text-cyan-100">iPhone (iCloud)</p>
                  <p className="mt-1">1) Va sur iCloud Contacts puis exporte en vCard (.vcf).</p>
                  <p>2) Enregistre le fichier dans Fichiers.</p>
                  <p>3) Reviens ici et clique Importer un fichier.</p>
                  <p className="mt-2 font-black text-cyan-100">Android (Google Contacts)</p>
                  <p className="mt-1">1) Ouvre Google Contacts puis Exporter (vCard ou CSV).</p>
                  <p>2) Enregistre le fichier sur ton telephone.</p>
                  <p>3) Reviens ici et importe le fichier.</p>
                  <p className="mt-2 text-amber-100">Note: en mode web, l acces direct au carnet natif depend du navigateur.</p>
                </div>
              )}
              {importSummary && <p className="mt-2 text-[11px] text-emerald-100">{importSummary}</p>}
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="relative h-full w-full">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400"
                  animate={{ width: `${scanProgressPercent}%` }}
                  transition={{ duration: 0.2 }}
                />
                {hasImportedContacts && !scanDone && (
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 0.55, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-orange-300 shadow-[0_0_18px_rgba(251,146,60,0.95)]"
                    style={{ left: `calc(${Math.min(99, scanProgressPercent)}% - 6px)` }}
                  />
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-white/70">
              {hasImportedContacts ? `${scanCount} / ${totalScanned} contacts scannes` : "Aucun contact importe pour le moment"}
            </p>
            {hasImportedContacts && (
              <p className="mt-1 text-[11px] text-cyan-100/90">
                Import total: {importedTotalCount} • Quota quotidien: {dailyQueueCount} contacts
              </p>
            )}
            {hasImportedContacts && (
              <p className="mt-1 text-[11px] text-cyan-100/90">
                Progression globale: {globalProcessedCount}/{importedTotalCount} • Aujourd hui: {Math.min(index, dailyQueueCount)}/{dailyQueueCount}
              </p>
            )}
            {hasImportedContacts && importedTotalCount > DAILY_CONTACT_LIMIT && (
              <p className="mt-1 text-[11px] text-white/70">
                Lot du jour: contacts {dailyQueueLabel} (rotation automatique chaque jour)
              </p>
            )}
            {hasImportedContacts && !scanDone && <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-orange-200/90">Meche active...</p>}

            {scanDone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="mt-3 rounded-2xl border border-orange-300/35 bg-orange-300/15 p-3 text-center"
              >
                <p className="text-2xl">💥</p>
                <p className="text-sm font-black text-orange-100">Scan termine, intelligence revelee.</p>
              </motion.div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {scanCards.map((card, idx) => (
                scanDone || !hasImportedContacts ? (
                  <div key={card.id} className={`rounded-2xl border bg-gradient-to-br p-3 text-center ${card.color}`}>
                    <p className="text-xs">{card.icon}</p>
                    <p className={`text-2xl font-black tabular-nums ${card.valueColor}`}>{card.value}</p>
                    <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-white/90">{card.title}</p>
                    <p className="mt-1 text-[10px] text-white/70">{card.subtitle}</p>
                  </div>
                ) : (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: [0, -2, 0] }}
                    transition={{ delay: idx * 0.05, duration: 1.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                    className={`rounded-2xl border bg-gradient-to-br p-3 text-center ${card.color}`}
                  >
                    <p className="text-xs">{card.icon}</p>
                    <p className={`text-2xl font-black tabular-nums ${card.valueColor}`}>{card.value}</p>
                    <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-white/90">{card.title}</p>
                    <p className="mt-1 text-[10px] text-white/70">{card.subtitle}</p>
                  </motion.div>
                )
              ))}
            </div>

            {scanDone && (
              <>
                <p className="mt-4 rounded-xl bg-emerald-400/15 px-3 py-2 text-sm text-emerald-100">
                  Scan termine: {importedTotalCount} contacts importes, {dailyQueueCount} a traiter aujourd hui.
                </p>
                <p className="mt-2 text-xs font-black text-cyan-100">{importedReviewCount} contacts restent a qualifier dans ton import.</p>
                <button
                  type="button"
                  onClick={resetScanSession}
                  className="mt-2 h-9 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-black uppercase tracking-wide text-white/85"
                >
                  Recommencer le scan
                </button>
              </>
            )}

            <button
              type="button"
              disabled={!scanDone}
              onClick={() => setStage("daily")}
              className="mt-4 mb-20 h-12 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-300 text-sm font-black uppercase tracking-wide text-[#11252C] disabled:opacity-40"
            >
              Continuer
            </button>
          </section>
        </div>
        <nav className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
          <div className="flex w-full max-w-md items-center justify-between rounded-[28px] border border-white/20 bg-[#0F1838]/75 px-2 py-2 shadow-[0_22px_48px_-28px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
            {([
              { id: "search", icon: "🔍", label: "Recherche" },
              { id: "scan", icon: "⚡", label: "Scan" },
              { id: "alliances", icon: "🤝", label: "Alliances" },
              { id: "eclaireurs", icon: "📡", label: "Eclaireurs" },
              { id: "profile", icon: "👤", label: "Profil" },
            ] as const).map((item) => {
              const isActive = item.id === "scan";
              return (
                <button
                  key={`scan-dock-${item.id}`}
                  type="button"
                  onClick={() => handleDockAction(item.id as "search" | "scan" | "eclaireurs" | "alliances" | "profile")}
                  aria-label={`Ouvrir ${item.label}`}
                  aria-pressed={isActive}
                  className={`flex h-14 min-w-[72px] flex-col items-center justify-center rounded-2xl px-2 transition ${
                    isActive ? "bg-cyan-300/25 text-cyan-100" : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className="mt-0.5 text-[10px] font-black uppercase tracking-[0.1em]">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
        {showMyProfilePanel && (
          <div className="fixed inset-0 z-[55] flex items-start justify-center bg-black/60 px-4 pb-4 backdrop-blur-sm">
            <section
              className="mt-2 w-full max-w-sm max-h-[calc(100dvh-24px)] overflow-y-auto rounded-3xl border border-white/20 bg-[#0E1430]/95 p-4"
              style={{ paddingTop: "calc(env(safe-area-inset-top) + 10px)" }}
            >
              <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between bg-[#0E1430]/95 px-4 pb-2">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Profil</p>
                <button
                  type="button"
                  onClick={() => setShowMyProfilePanel(false)}
                  className="relative z-20 h-11 w-11 rounded-full border border-white/25 bg-white/15 text-sm"
                >
                  ✕
                </button>
              </div>
              <p className="mt-2 text-[11px] text-white/65">Donnees synchronisees depuis Popey Human.</p>
              {isProfileLoading ? (
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white/75">Chargement du profil...</div>
              ) : (
                <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-black/25 p-3 text-sm">
                  {isEditingProfile ? (
                    <>
                      <input
                        value={profileForm.lastName}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, lastName: event.target.value }))}
                        placeholder="Nom"
                        className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                      />
                      <input
                        value={profileForm.firstName}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, firstName: event.target.value }))}
                        placeholder="Prenom"
                        className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                      />
                      <input
                        value={profileForm.metier}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, metier: event.target.value }))}
                        placeholder="Mon metier"
                        className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                      />
                      <input
                        value={profileForm.buddyName}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, buddyName: event.target.value }))}
                        placeholder="Nom du binome"
                        className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                      />
                      <input
                        value={profileForm.buddyMetier}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, buddyMetier: event.target.value }))}
                        placeholder="Metier du binome"
                        className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                      />
                      <input
                        value={profileForm.trioName}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, trioName: event.target.value }))}
                        placeholder="Nom du trio"
                        className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                      />
                      <input
                        value={profileForm.trioMetier}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, trioMetier: event.target.value }))}
                        placeholder="Metier du trio"
                        className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                      />
                      <select
                        value={profileForm.eclaireurRewardMode}
                        onChange={(event) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            eclaireurRewardMode: event.target.value === "fixed" ? "fixed" : "percent",
                          }))
                        }
                        className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                      >
                        <option value="percent">Remuneration eclaireur: %</option>
                        <option value="fixed">Remuneration eclaireur: fixe €</option>
                      </select>
                      {profileForm.eclaireurRewardMode === "percent" ? (
                        <input
                          value={profileForm.eclaireurRewardPercent}
                          onChange={(event) => setProfileForm((prev) => ({ ...prev, eclaireurRewardPercent: event.target.value }))}
                          placeholder="Pourcentage ex: 10"
                          className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                        />
                      ) : (
                        <input
                          value={profileForm.eclaireurRewardFixedEur}
                          onChange={(event) => setProfileForm((prev) => ({ ...prev, eclaireurRewardFixedEur: event.target.value }))}
                          placeholder="Fixe en euros ex: 300"
                          className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                        />
                      )}
                      <input
                        value={profileForm.ville}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, ville: event.target.value }))}
                        placeholder="Ville"
                        className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                      />
                      <input
                        value={profileForm.phone}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                        placeholder="Telephone"
                        className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                      />
                    </>
                  ) : (
                    <>
                      <p><span className="text-white/60">Nom:</span> {myProfile?.last_name || "-"}</p>
                      <p><span className="text-white/60">Prenom:</span> {myProfile?.first_name || "-"}</p>
                      <p><span className="text-white/60">Mon metier:</span> {myProfile?.metier || "-"}</p>
                      <p><span className="text-white/60">Nom du binome:</span> {myProfile?.buddy_name || "-"}</p>
                      <p><span className="text-white/60">Metier du binome:</span> {myProfile?.buddy_metier || "-"}</p>
                      <p><span className="text-white/60">Nom du trio:</span> {myProfile?.trio_name || "-"}</p>
                      <p><span className="text-white/60">Metier du trio:</span> {myProfile?.trio_metier || "-"}</p>
                      <p>
                        <span className="text-white/60">Remuneration eclaireur:</span>{" "}
                        {myProfile?.eclaireur_reward_mode === "fixed"
                          ? myProfile?.eclaireur_reward_fixed_eur
                            ? `${myProfile.eclaireur_reward_fixed_eur}€ fixe`
                            : "-"
                          : myProfile?.eclaireur_reward_percent
                            ? `${myProfile.eclaireur_reward_percent}%`
                            : "-"}
                      </p>
                      <p><span className="text-white/60">Ville:</span> {myProfile?.ville || "-"}</p>
                      <p><span className="text-white/60">Telephone:</span> {myProfile?.phone || "-"}</p>
                    </>
                  )}
                </div>
              )}
              {!isProfileLoading && selfScoutLink && (
                <div className="mt-3 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-cyan-100">Mon lien Eclaireur perso</p>
                  {selfScoutLink.shortCode ? (
                    <p className="mt-1 text-[11px] text-[#EAC886]">
                      Code court: <span className="font-black tracking-wider">{selfScoutLink.shortCode}</span>
                    </p>
                  ) : null}
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/70">Lien actif (nouveau design)</p>
                  {selfScoutLink.shortUrl ? <p className="mt-1 break-all text-[11px] text-cyan-100/90">{selfScoutLink.shortUrl}</p> : null}
                  {selfScoutLink.fullUrl && selfScoutLink.fullUrl !== selfScoutLink.shortUrl ? (
                    <p className="mt-1 break-all text-[11px] text-emerald-100/85">{selfScoutLink.fullUrl}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => copySelfScoutLink(selfScoutLink.previewUrl || selfScoutLink.shortUrl || selfScoutLink.fullUrl)}
                    disabled={isCopyingSelfScoutLink}
                    className="mt-2 h-8 rounded-lg border border-cyan-300/40 bg-cyan-300/15 px-3 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100 disabled:opacity-60"
                  >
                    {isCopyingSelfScoutLink ? "Copie..." : "Copier lien nouveau design"}
                  </button>
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {isEditingProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        hydrateProfileForm(myProfile);
                        setIsEditingProfile(false);
                      }}
                      className="h-10 rounded-xl border border-white/20 bg-white/10 text-[11px] font-black uppercase tracking-wide text-white/80"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={saveMyProfile}
                      disabled={isProfileSaving}
                      className="h-10 rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 text-[11px] font-black uppercase tracking-wide text-[#11252C] disabled:opacity-50"
                    >
                      {isProfileSaving ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="col-span-2 h-10 rounded-xl border border-cyan-300/35 bg-cyan-300/10 text-[11px] font-black uppercase tracking-wide text-cyan-100"
                  >
                    Modifier le profil
                  </button>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={openImportFromProfile}
                  className="h-10 rounded-xl border border-cyan-300/35 bg-cyan-300/10 text-[11px] font-black uppercase tracking-wide text-cyan-100"
                >
                  Reimporter contacts
                </button>
                <button
                  type="button"
                  onClick={clearImportedContacts}
                  className="h-10 rounded-xl border border-orange-300/35 bg-orange-300/10 text-[11px] font-black uppercase tracking-wide text-orange-100"
                >
                  Supprimer import
                </button>
              </div>
              <p className="mt-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-white/85">
                Importer un seul contact manuellement
              </p>
              <div className="mt-2 grid gap-2">
                <input
                  value={manualScoutName}
                  onChange={(event) => setManualScoutName(event.target.value)}
                  placeholder="Nom du contact"
                  className="h-9 rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={manualScoutCity}
                    onChange={(event) => setManualScoutCity(event.target.value)}
                    placeholder="Ville"
                    className="h-9 rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                  />
                  <input
                    value={manualScoutPhone}
                    onChange={(event) => setManualScoutPhone(event.target.value)}
                    placeholder="Telephone"
                    className="h-9 rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void importSingleContactManually();
                  }}
                  className="h-9 rounded-xl border border-emerald-300/35 bg-emerald-300/15 text-[11px] font-black uppercase tracking-wide text-emerald-100"
                >
                  Ajouter ce contact + eclaireur
                </button>
              </div>
              <button
                type="button"
                onClick={signOutFromSmartScan}
                className="mt-3 h-11 w-full rounded-xl bg-gradient-to-r from-rose-300 to-orange-300 text-xs font-black uppercase tracking-wide text-[#3A140E]"
              >
                Deconnexion
              </button>
            </section>
          </div>
        )}
        {onboardingJ0Overlay}
      </main>
    );
  }

  return (
    <main className="h-screen overflow-y-auto bg-[radial-gradient(circle_at_10%_0%,#10193D_0%,#0C122B_45%,#090B16_100%)] text-white">
      <div className="mx-auto max-w-6xl px-4 pt-14 sm:pt-5 pb-20">
        {apiErrorMessage && (
          <div className="mb-3 rounded-xl border border-orange-300/35 bg-orange-300/15 px-3 py-2 text-xs text-orange-100">
            {apiErrorMessage}
          </div>
        )}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
          <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Cockpit Mission Quotidienne</p>
                <h1 className="mt-1 text-lg sm:text-2xl font-black">Trio Immo-Dax : Radar Active</h1>
                <p className="mt-0.5 text-[12px] text-white/80">
                  {opportunitiesActivated} opportunites activees aujourd hui. Encore {remainingForGoal} sur {dailyQueueCount} pour atteindre votre objectif.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="rounded-full border border-emerald-300/35 bg-emerald-300/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-emerald-100">
                  <button
                    type="button"
                    onClick={() => setShowPotentialBreakdownSheet(true)}
                    className="rounded-full text-[11px] font-black uppercase tracking-[0.08em] text-emerald-100"
                  >
                    Potentiel du jour : ~{latentPotential}€
                  </button>
                </p>
                <button
                  type="button"
                  onClick={() => setIsCockpitCollapsed((value) => !value)}
                  className="h-8 rounded-full border border-white/20 bg-white/10 px-3 text-[10px] font-black uppercase tracking-[0.08em] text-white/85"
                >
                  {isCockpitCollapsed ? "Deplier cockpit" : "Replier cockpit"}
                </button>
              </div>
            </div>
            <div className={isCockpitCollapsed ? "hidden" : "space-y-3"}>
            {showAdvancedOpsInUserCockpit && (
              <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.08em] text-white/60">Envoyes (J)</p>
                <p className="text-sm font-black text-emerald-100">{sentTodayCount}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.08em] text-white/60">Reponses (J)</p>
                <p className="text-sm font-black text-cyan-100">{responsesTodayCount}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.08em] text-white/60">Conversions (J)</p>
                <p className="text-sm font-black text-amber-100">{conversionsTodayCount}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.08em] text-white/60">Taux conversion</p>
                <p className="text-sm font-black text-fuchsia-100">{conversionRateToday}%</p>
              </div>
            </div>
            <div className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100">Reporting admin (jour)</p>
                  <p className="text-[11px] text-cyan-50/85">Synthese du {dailyReportDateLabel}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyDailyAdminReport}
                    className="h-8 rounded-lg border border-cyan-200/40 bg-cyan-200/15 px-3 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100"
                  >
                    Copier
                  </button>
                  <button
                    type="button"
                    onClick={exportDailyAdminReportCsv}
                    disabled={isExportingDailyReport}
                    className={`h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-[0.08em] ${
                      isExportingDailyReport
                        ? "cursor-not-allowed border border-white/20 bg-white/10 text-white/60"
                        : "border border-white/30 bg-black/30 text-white"
                    }`}
                  >
                    {isExportingDailyReport ? "Export..." : "CSV"}
                  </button>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-cyan-50/80">
                Envoyes {sentTodayCount} • Repondu {responsesTodayCount} • Converti {conversionsTodayCount} •
                Relances en retard {overdueFollowupsCount}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.08em] text-white/60">Delai reponse moyen (14j)</p>
                <p className="text-sm font-black text-cyan-100">{conversionMetrics?.avg_response_delay_hours ?? 0}h</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.08em] text-white/60">Meilleur canal conversion</p>
                <p className="text-sm font-black text-emerald-100">
                  {topActionMetric ? `${actionLabel(topActionMetric.action_type)} • ${topActionMetric.conversion_rate}%` : "N/A"}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-orange-300/30 bg-orange-300/10 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-orange-100">A relancer maintenant</p>
                <span className="rounded-full border border-orange-300/35 bg-orange-300/15 px-2 py-1 text-[10px] font-black text-orange-100">
                  {dueFollowups.length}
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setFollowupFilter("all")}
                  disabled={isBatchCopyingFollowups}
                  className={`h-7 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.08em] transition ${
                    followupFilter === "all"
                      ? "border border-orange-300/45 bg-orange-300/20 text-orange-100"
                      : "border border-white/20 bg-black/25 text-white/75"
                  }`}
                >
                  Tous ({dueFollowups.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFollowupFilter("overdue")}
                  disabled={isBatchCopyingFollowups}
                  className={`h-7 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.08em] transition ${
                    followupFilter === "overdue"
                      ? "border border-rose-300/45 bg-rose-300/20 text-rose-100"
                      : "border border-white/20 bg-black/25 text-white/75"
                  }`}
                >
                  En retard ({overdueFollowupsCount})
                </button>
                <button
                  type="button"
                  onClick={markVisibleFollowupsAsCopied}
                  disabled={isBatchCopyingFollowups || displayedDueFollowups.length === 0}
                  className={`h-7 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.08em] transition ${
                    isBatchCopyingFollowups || displayedDueFollowups.length === 0
                      ? "cursor-not-allowed border border-cyan-200/20 bg-cyan-200/10 text-cyan-100/60"
                      : "border border-cyan-300/45 bg-cyan-300/20 text-cyan-100 hover:bg-cyan-300/30"
                  }`}
                >
                  {isBatchCopyingFollowups ? "Traitement..." : `Tout copier (${displayedDueFollowups.length})`}
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <div className="rounded-lg border border-white/15 bg-black/20 px-2 py-1.5">
                  <p className="text-[9px] uppercase tracking-[0.08em] text-white/60">Copies</p>
                  <p className="text-xs font-black text-cyan-100">{followupOpsStats?.copied_today ?? 0}</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-black/20 px-2 py-1.5">
                  <p className="text-[9px] uppercase tracking-[0.08em] text-white/60">Repondu</p>
                  <p className="text-xs font-black text-emerald-100">{followupOpsStats?.replied_today ?? 0}</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-black/20 px-2 py-1.5">
                  <p className="text-[9px] uppercase tracking-[0.08em] text-white/60">Converti</p>
                  <p className="text-xs font-black text-amber-100">{followupOpsStats?.converted_today ?? 0}</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-black/20 px-2 py-1.5">
                  <p className="text-[9px] uppercase tracking-[0.08em] text-white/60">Pas interesse</p>
                  <p className="text-xs font-black text-rose-100">{followupOpsStats?.not_interested_today ?? 0}</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-black/20 px-2 py-1.5">
                  <p className="text-[9px] uppercase tracking-[0.08em] text-white/60">Ignores</p>
                  <p className="text-xs font-black text-white">{followupOpsStats?.ignored_today ?? 0}</p>
                </div>
              </div>
              <div className="mt-2 space-y-2">
                {visibleDueFollowups.length === 0 && (
                  <div className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
                    <p className="text-xs text-white/80">
                      {followupFilter === "overdue"
                        ? "Aucune relance en retard pour le moment."
                        : "Aucune relance due pour le moment."}
                    </p>
                    <p className="mt-1 text-[11px] text-white/60">
                      Astuce: utilise “Tous” pour revoir la file complete ou relance le sweep cron si necessaire.
                    </p>
                  </div>
                )}
                {displayedDueFollowups.map((item) => (
                  <div
                    key={item.actionId}
                    className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-left"
                  >
                    <button
                      type="button"
                      onClick={() => openContactProfileWithTrustGuard(item.contactId)}
                      className="w-full text-left"
                    >
                      <p className="text-sm font-black text-white">
                        {item.contactName} • {actionLabel(item.actionType)}
                      </p>
                      <p className="text-[11px] text-white/75">
                        Priorite {item.priorityScore}/100 • Due: {item.dueAtLabel}
                      </p>
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] ${followupUrgencyBadge(item).className}`}>
                        {followupUrgencyBadge(item).label}
                      </span>
                      <span className="rounded-full border border-cyan-300/35 bg-cyan-300/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-cyan-100">
                        Outcome pending
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[10px] text-orange-100/90">
                      {item.suggestedMessage || "Message suggere indisponible pour cette relance."}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                      <button
                        type="button"
                        onClick={() => copyFollowupMessage(item.actionId, item.suggestedMessage)}
                        disabled={isBatchCopyingFollowups}
                        className="h-8 rounded-lg border border-cyan-300/35 bg-cyan-300/10 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100"
                      >
                        Copier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFollowupJobAction(item.actionId, "replied")}
                        disabled={isBatchCopyingFollowups}
                        className="h-8 rounded-lg border border-emerald-300/35 bg-emerald-300/10 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-100"
                      >
                        Repondu
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFollowupJobAction(item.actionId, "converted")}
                        disabled={isBatchCopyingFollowups}
                        className="h-8 rounded-lg border border-amber-300/35 bg-amber-300/10 text-[10px] font-black uppercase tracking-[0.08em] text-amber-100"
                      >
                        Converti
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFollowupJobAction(item.actionId, "not_interested")}
                        disabled={isBatchCopyingFollowups}
                        className="h-8 rounded-lg border border-rose-300/35 bg-rose-300/10 text-[10px] font-black uppercase tracking-[0.08em] text-rose-100"
                      >
                        Pas interesse
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFollowupJobAction(item.actionId, "ignored")}
                        disabled={isBatchCopyingFollowups}
                        className="h-8 rounded-lg border border-white/20 bg-white/10 text-[10px] font-black uppercase tracking-[0.08em] text-white/80"
                      >
                        Ignorer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

              </>
            )}
            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.1em] text-white/70">
                <span>Mission quotidienne</span>
                <span>{opportunitiesActivated}/{dailyGoal}</span>
              </div>
              <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-orange-300 via-amber-300 to-emerald-300"
                  animate={{ width: `${missionProgress}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
                {showProgressCheck && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.6, x: -8 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.6, 1.2, 0.8], x: 14 }}
                    transition={{ duration: 0.65, ease: "easeInOut" }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px]"
                  >
                    ✨
                  </motion.span>
                )}
              </div>
              <p className="mt-2 text-xs text-white/70">Chaque fiche validee rapproche la mission du Trio de sa cible du jour.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleExternalConnectorClick("linkedin", "https://www.linkedin.com")}
                className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-center text-[11px] font-black uppercase tracking-[0.08em] text-white/85 transition hover:border-cyan-300/45"
              >
                LinkedIn
                <span className="mt-0.5 block text-[10px] font-medium normal-case text-white/65">
                  Ouvrir le reseau pro • clics J: {externalClickStats?.linkedin_today ?? 0}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleExternalConnectorClick("whatsapp_group", "https://web.whatsapp.com")}
                className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-center text-[11px] font-black uppercase tracking-[0.08em] text-white/85 transition hover:border-emerald-300/45"
              >
                Groupe WhatsApp
                <span className="mt-0.5 block text-[10px] font-medium normal-case text-white/65">
                  Ouvrir la communaute • clics J: {externalClickStats?.whatsapp_group_today ?? 0}
                </span>
              </button>
            </div>
            </div>
          </div>
        </div>

        <div className={`mt-4 ${done >= dailyQueueCount ? "grid gap-4 lg:grid-cols-[1.15fr_0.85fr]" : "flex justify-center"}`}>
          <section className={`rounded-3xl border border-white/10 bg-white/5 p-3 sm:p-4 backdrop-blur-xl ${done >= dailyQueueCount ? "" : "w-full max-w-3xl"}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Daily Card</p>
              <span className="rounded-full border border-white/15 bg-black/25 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white/80">🔒 Anonymat communautaire garanti</span>
            </div>
            {currentCooAlert && (
              <div className="mt-3 rounded-2xl border border-orange-300/35 bg-orange-300/15 px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-orange-100">COO Alert • 24h</p>
                <p className="mt-1 text-sm text-white/90">
                  Attention, {currentCooAlert.name} est un client ideal brulant sans Partage Croise sous 24h.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActionGlowContactId(current.id);
                    setTimeout(() => setActionGlowContactId((id) => (id === current.id ? null : id)), 2200);
                    triggerAction("package");
                  }}
                  className="mt-2 h-9 rounded-xl bg-gradient-to-r from-violet-300 to-fuchsia-300 px-3 text-[11px] font-black uppercase tracking-wide text-[#271234]"
                >
                  Ouvrir partage croise
                </button>
              </div>
            )}

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
                {actionEngine.cue && (
                  <p className="mt-1 text-[10px] font-semibold tracking-[0.08em] text-cyan-100/90">
                    UI dynamique • {actionEngine.cue}
                  </p>
                )}
              </div>

            <div className="mt-4 grid gap-3">
                {actionButtons.map((button) => {
                  const theme = ACTION_BUTTON_THEMES[button.action];
                  const launching = launchingAction === button.action;
                  const isPrimary = button.action === primaryDailyAction;
                  const shouldPulse = isQualified && (actionGlowContactId === current.id || isPrimary);
                  return (
                    <button
                      key={button.action}
                      type="button"
                      onClick={() => triggerAction(button.action)}
                      className={`relative overflow-hidden rounded-2xl border transition ${
                        isPrimary
                          ? `h-20 ${theme.buttonClass}`
                          : "h-16 border-white/25 bg-white/5 text-white/80 opacity-75 hover:opacity-95"
                      } ${
                        shouldPulse ? theme.idlePulseClass : ""
                      } ${launching ? theme.launchRingClass : ""} ${isPrimary ? "ring-1 ring-white/30" : ""}`}
                    >
                      {launching && (
                        <>
                          <motion.span
                            initial={{ opacity: 1, scale: 0.25 }}
                            animate={{ opacity: 0, scale: 4.8 }}
                            transition={{ duration: 1.05, ease: "easeOut" }}
                            className={`pointer-events-none absolute inset-[-18%] rounded-xl ${theme.burstGradient}`}
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
                      <span className={`block ${isPrimary ? "text-base" : "text-[13px]"} font-black uppercase tracking-wide ${isPrimary ? theme.titleClass : "text-white/90"}`}>
                        {button.title}
                      </span>
                      <span className={`mt-0.5 block text-[11px] font-semibold ${isPrimary ? theme.subtitleClass : "text-white/70"}`}>
                        {button.subtitle}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 grid gap-2 grid-cols-1">
                <button
                  type="button"
                  onClick={() => triggerAction("passer")}
                  className="h-9 rounded-full border border-cyan-300/35 bg-cyan-300/15 px-4 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100"
                >
                  Passer
                </button>
              </div>
              {softLearningHint && (
                <p className="mt-2 rounded-xl bg-white/10 px-3 py-2 text-xs text-cyan-100">{softLearningHint}</p>
              )}
            </motion.article>

            <p className="mt-2 text-xs text-white/70">Mode tunnel: une carte, une decision, action immediate.</p>
          </section>

              {showCompletionAssistant && done >= dailyQueueCount && (
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
                <p className="mt-1 text-xs text-white/80">Permission contacts → Moteur Daily {DAILY_CONTACT_LIMIT} → Swipe/actions → Push relance.</p>
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

      <nav className="fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4">
        <div className="flex w-full max-w-md items-center justify-between rounded-[28px] border border-white/20 bg-[#0F1838]/75 px-2 py-2 shadow-[0_22px_48px_-28px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
          {([
            { id: "search", icon: "🔍", label: "Recherche" },
            { id: "scan", icon: "⚡", label: "Scan" },
            { id: "alliances", icon: "🤝", label: "Alliances" },
            { id: "eclaireurs", icon: "📡", label: "Eclaireurs" },
            { id: "profile", icon: "👤", label: "Profil" },
          ] as const).map((item) => {
            const isActive =
              (item.id === "search" && showSearchPanel) ||
              (item.id === "alliances" && showAlliancesPanel) ||
              (item.id === "eclaireurs" && showEclaireursPanel) ||
              (item.id === "profile" && showMyProfilePanel) ||
              (item.id === "scan" &&
                !showSearchPanel &&
                !showHistoryPanel &&
                !showMyProfilePanel &&
                !showEclaireursPanel &&
                !showAlliancesPanel);

            return (
              <button
                key={`daily-dock-${item.id}`}
                type="button"
                onClick={() => handleDockAction(item.id as "search" | "scan" | "eclaireurs" | "alliances" | "profile")}
                aria-label={`Ouvrir ${item.label}`}
                aria-pressed={isActive}
                className={`flex h-14 min-w-[72px] flex-col items-center justify-center rounded-2xl px-2 transition ${
                  isActive ? "bg-cyan-300/25 text-cyan-100" : "text-white/80 hover:bg-white/10"
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="mt-0.5 text-[10px] font-black uppercase tracking-[0.1em]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {showQualificationNeededPopup && (
        <div className="fixed inset-0 z-[74] flex items-end justify-center bg-black/60 px-4 pb-6 pt-10 sm:items-center sm:pb-4">
          <button
            type="button"
            aria-label="Fermer la popup qualification"
            onClick={() => setShowQualificationNeededPopup(false)}
            className="absolute inset-0"
          />
          <motion.section
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-sm rounded-3xl border border-amber-300/35 bg-[#0E1834]/95 p-4 shadow-[0_24px_70px_-30px_rgba(251,191,36,0.85)]"
          >
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setShowQualificationNeededPopup(false)}
              className="absolute right-3 top-3 h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs text-white/80"
            >
              ✕
            </button>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-300/40 bg-amber-300/15 text-lg">
              ⚠️
            </div>
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.1em] text-amber-100">Qualification requise</p>
            <p className="mt-2 text-sm text-white/90">
              <span className="font-black text-white">{current.name}</span> n est pas encore qualifie. Qualifie ce contact pour debloquer l envoi WhatsApp.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowQualificationNeededPopup(false);
                triggerAction("qualifier");
              }}
              className="mt-4 h-11 w-full rounded-xl border border-emerald-300/40 bg-gradient-to-r from-emerald-300/25 to-cyan-300/25 text-[11px] font-black uppercase tracking-[0.08em] text-emerald-100"
            >
              Qualifier ce contact
            </button>
            <button
              type="button"
              onClick={() => setShowQualificationNeededPopup(false)}
              className="mt-2 h-10 w-full rounded-xl border border-white/20 bg-white/10 text-[11px] font-black uppercase tracking-[0.08em] text-white/85"
            >
              Continuer sans qualifier
            </button>
          </motion.section>
        </div>
      )}

      {showMyProfilePanel && (
        <div className="fixed inset-0 z-[50] flex items-start justify-center bg-black/60 px-4 pb-4 backdrop-blur-sm">
          <section
            className="mt-2 w-full max-w-sm max-h-[calc(100dvh-24px)] overflow-y-auto rounded-3xl border border-white/20 bg-[#0E1430]/95 p-4"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 10px)" }}
          >
            <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between bg-[#0E1430]/95 px-4 pb-2">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Profil</p>
              <button
                type="button"
                onClick={() => setShowMyProfilePanel(false)}
                className="relative z-20 h-11 w-11 rounded-full border border-white/25 bg-white/15 text-sm"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-[11px] text-white/65">Donnees synchronisees depuis Popey Human.</p>
            {isProfileLoading ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white/75">Chargement du profil...</div>
            ) : (
              <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-black/25 p-3 text-sm">
                {isEditingProfile ? (
                  <>
                    <input
                      value={profileForm.lastName}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, lastName: event.target.value }))}
                      placeholder="Nom"
                      className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                    />
                    <input
                      value={profileForm.firstName}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, firstName: event.target.value }))}
                      placeholder="Prenom"
                      className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                    />
                    <input
                      value={profileForm.metier}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, metier: event.target.value }))}
                      placeholder="Mon metier"
                      className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                    />
                    <input
                      value={profileForm.buddyName}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, buddyName: event.target.value }))}
                      placeholder="Nom du binome"
                      className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                    />
                    <input
                      value={profileForm.buddyMetier}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, buddyMetier: event.target.value }))}
                      placeholder="Metier du binome"
                      className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                    />
                    <input
                      value={profileForm.trioName}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, trioName: event.target.value }))}
                      placeholder="Nom du trio"
                      className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                    />
                    <input
                      value={profileForm.trioMetier}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, trioMetier: event.target.value }))}
                      placeholder="Metier du trio"
                      className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                    />
                    <select
                      value={profileForm.eclaireurRewardMode}
                      onChange={(event) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          eclaireurRewardMode: event.target.value === "fixed" ? "fixed" : "percent",
                        }))
                      }
                      className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                    >
                      <option value="percent">Remuneration eclaireur: %</option>
                      <option value="fixed">Remuneration eclaireur: fixe €</option>
                    </select>
                    {profileForm.eclaireurRewardMode === "percent" ? (
                      <input
                        value={profileForm.eclaireurRewardPercent}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, eclaireurRewardPercent: event.target.value }))}
                        placeholder="Pourcentage ex: 10"
                        className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                      />
                    ) : (
                      <input
                        value={profileForm.eclaireurRewardFixedEur}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, eclaireurRewardFixedEur: event.target.value }))}
                        placeholder="Fixe en euros ex: 300"
                        className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                      />
                    )}
                    <input
                      value={profileForm.ville}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, ville: event.target.value }))}
                      placeholder="Ville"
                      className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                    />
                    <input
                      value={profileForm.phone}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                      placeholder="Telephone"
                      className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                    />
                  </>
                ) : (
                  <>
                    <p><span className="text-white/60">Nom:</span> {myProfile?.last_name || "-"}</p>
                    <p><span className="text-white/60">Prenom:</span> {myProfile?.first_name || "-"}</p>
                    <p><span className="text-white/60">Mon metier:</span> {myProfile?.metier || "-"}</p>
                    <p><span className="text-white/60">Nom du binome:</span> {myProfile?.buddy_name || "-"}</p>
                    <p><span className="text-white/60">Metier du binome:</span> {myProfile?.buddy_metier || "-"}</p>
                    <p><span className="text-white/60">Nom du trio:</span> {myProfile?.trio_name || "-"}</p>
                    <p><span className="text-white/60">Metier du trio:</span> {myProfile?.trio_metier || "-"}</p>
                    <p>
                      <span className="text-white/60">Remuneration eclaireur:</span>{" "}
                      {myProfile?.eclaireur_reward_mode === "fixed"
                        ? myProfile?.eclaireur_reward_fixed_eur
                          ? `${myProfile.eclaireur_reward_fixed_eur}€ fixe`
                          : "-"
                        : myProfile?.eclaireur_reward_percent
                          ? `${myProfile.eclaireur_reward_percent}%`
                          : "-"}
                    </p>
                    <p><span className="text-white/60">Ville:</span> {myProfile?.ville || "-"}</p>
                    <p><span className="text-white/60">Telephone:</span> {myProfile?.phone || "-"}</p>
                  </>
                )}
              </div>
            )}
            {!isProfileLoading && selfScoutLink && (
              <div className="mt-3 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-cyan-100">Mon lien Eclaireur perso</p>
                {selfScoutLink.shortCode ? (
                  <p className="mt-1 text-[11px] text-[#EAC886]">
                    Code court: <span className="font-black tracking-wider">{selfScoutLink.shortCode}</span>
                  </p>
                ) : null}
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/70">Lien actif (nouveau design)</p>
                {selfScoutLink.shortUrl ? <p className="mt-1 break-all text-[11px] text-cyan-100/90">{selfScoutLink.shortUrl}</p> : null}
                {selfScoutLink.fullUrl && selfScoutLink.fullUrl !== selfScoutLink.shortUrl ? (
                  <p className="mt-1 break-all text-[11px] text-emerald-100/85">{selfScoutLink.fullUrl}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => copySelfScoutLink(selfScoutLink.previewUrl || selfScoutLink.shortUrl || selfScoutLink.fullUrl)}
                  disabled={isCopyingSelfScoutLink}
                  className="mt-2 h-8 rounded-lg border border-cyan-300/40 bg-cyan-300/15 px-3 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100 disabled:opacity-60"
                >
                  {isCopyingSelfScoutLink ? "Copie..." : "Copier lien nouveau design"}
                </button>
              </div>
            )}
            {!isProfileLoading && (
              <div className="mt-3 rounded-xl border border-violet-300/30 bg-violet-300/10 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-violet-100">Mon profil public popey.link</p>
                <p className="mt-1 break-all text-[11px] text-violet-100/90">{publicProfileUrl || "Definis un slug public pour activer le partage."}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void sharePublicProfile("whatsapp");
                    }}
                    className="h-8 rounded-lg border border-emerald-300/35 bg-emerald-300/15 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-100"
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void sharePublicProfile("linkedin");
                    }}
                    className="h-8 rounded-lg border border-cyan-300/35 bg-cyan-300/15 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100"
                  >
                    LinkedIn
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void sharePublicProfile("instagram");
                    }}
                    className="h-8 rounded-lg border border-pink-300/35 bg-pink-300/15 text-[10px] font-black uppercase tracking-[0.08em] text-pink-100"
                  >
                    Instagram
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void sharePublicProfile("copy");
                    }}
                    className="h-8 rounded-lg border border-white/25 bg-white/10 text-[10px] font-black uppercase tracking-[0.08em] text-white/90"
                  >
                    Copier
                  </button>
                </div>
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {isEditingProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      hydrateProfileForm(myProfile);
                      setIsEditingProfile(false);
                    }}
                    className="h-10 rounded-xl border border-white/20 bg-white/10 text-[11px] font-black uppercase tracking-wide text-white/80"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={saveMyProfile}
                    disabled={isProfileSaving}
                    className="h-10 rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 text-[11px] font-black uppercase tracking-wide text-[#11252C] disabled:opacity-50"
                  >
                    {isProfileSaving ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="col-span-2 h-10 rounded-xl border border-cyan-300/35 bg-cyan-300/10 text-[11px] font-black uppercase tracking-wide text-cyan-100"
                >
                  Modifier le profil
                </button>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={openImportFromProfile}
                className="h-10 rounded-xl border border-cyan-300/35 bg-cyan-300/10 text-[11px] font-black uppercase tracking-wide text-cyan-100"
              >
                Reimporter contacts
              </button>
              <button
                type="button"
                onClick={clearImportedContacts}
                className="h-10 rounded-xl border border-orange-300/35 bg-orange-300/10 text-[11px] font-black uppercase tracking-wide text-orange-100"
              >
                Supprimer import
              </button>
            </div>
            <p className="mt-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-white/85">
              Importer un seul contact manuellement
            </p>
            <div className="mt-2 grid gap-2">
              <input
                value={manualScoutName}
                onChange={(event) => setManualScoutName(event.target.value)}
                placeholder="Nom du contact"
                className="h-9 rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={manualScoutCity}
                  onChange={(event) => setManualScoutCity(event.target.value)}
                  placeholder="Ville"
                  className="h-9 rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                />
                <input
                  value={manualScoutPhone}
                  onChange={(event) => setManualScoutPhone(event.target.value)}
                  placeholder="Telephone"
                  className="h-9 rounded-lg border border-white/15 bg-black/30 px-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  void importSingleContactManually();
                }}
                className="h-9 rounded-xl border border-emerald-300/35 bg-emerald-300/15 text-[11px] font-black uppercase tracking-wide text-emerald-100"
              >
                Ajouter ce contact + eclaireur
              </button>
            </div>
            <button
              type="button"
              onClick={signOutFromSmartScan}
              className="mt-3 h-11 w-full rounded-xl bg-gradient-to-r from-rose-300 to-orange-300 text-xs font-black uppercase tracking-wide text-[#3A140E]"
            >
              Deconnexion
            </button>
          </section>
        </div>
      )}

      {showSearchPanel && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-start justify-center px-0 pt-0 pb-0 sm:px-4 sm:pt-16 sm:pb-0">
          <section
            className="h-[calc(100dvh-92px)] max-h-[calc(100dvh-92px)] w-full overflow-y-auto rounded-none border-0 bg-[#0E1430] p-4 pb-28 sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-3xl sm:border sm:border-white/15"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
          >
            <div className="sticky top-0 z-20 -mx-4 bg-[#0E1430] px-4 pb-2">
              <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Recherche</p>
                <button
                  type="button"
                  onClick={() => setShowSearchPanel(false)}
                  className="relative z-30 h-9 w-9 rounded-full border border-white/20 bg-white/10 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSearchInnerTab("search")}
                className={`h-9 rounded-lg border text-[11px] font-black uppercase tracking-wide ${
                  searchInnerTab === "search"
                    ? "border-cyan-300/45 bg-cyan-300/20 text-cyan-100"
                    : "border-white/15 bg-black/25 text-white/70"
                }`}
              >
                Recherche
              </button>
              <button
                type="button"
                onClick={() => setSearchInnerTab("history")}
                className={`h-9 rounded-lg border text-[11px] font-black uppercase tracking-wide ${
                  searchInnerTab === "history"
                    ? "border-cyan-300/45 bg-cyan-300/20 text-cyan-100"
                    : "border-white/15 bg-black/25 text-white/70"
                }`}
              >
                Historique
              </button>
            </div>
            {searchInnerTab === "search" ? (
              <>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Rechercher un contact..."
              className="mt-3 h-10 w-full rounded-xl border border-white/15 bg-black/25 px-3 text-sm"
            />
            <div className="mt-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100">Niveau de confiance</p>
              <p className="mt-1 text-xs text-white/80">
                Cette jauge est enregistree par contact pour qualifier la force de la relation avant partage croise.
              </p>
            </div>
            <div className="mt-3 max-h-[calc(100dvh-260px)] space-y-2 overflow-y-auto sm:max-h-[60vh]">
              {searchResults.map((contact) => (
                <div key={contact.id} className="rounded-xl border border-white/15 bg-black/25 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        openContactProfileWithTrustGuard(contact.id);
                      }}
                      className="text-left flex-1 min-w-0"
                    >
                      <p className="text-sm font-black">{contact.name}</p>
                      <p className="text-xs text-white/70">{contact.city}</p>
                      <p className="mt-1 text-[10px] text-cyan-100/90">
                        {trustLevelStore[contact.id]
                          ? `Confiance: ${trustLevelLabel(trustLevelStore[contact.id])}`
                          : "Confiance non definie"}
                      </p>
                      <p className="mt-1 text-[10px] text-white/75">
                        Priorite: {priorityScoreStore[contact.id] || 0}/100 • Potentiel: ~{potentialEurStore[contact.id] || 0}€
                      </p>
                      {(priorityScoreStore[contact.id] || 0) >= 75 && (
                        <p className="mt-1 inline-flex rounded-full border border-orange-300/35 bg-orange-300/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-orange-100">
                          Priorite Haute
                        </p>
                      )}
                      {eclaireurIds.includes(contact.id) && (
                        <p className="mt-1 inline-flex rounded-full border border-emerald-300/35 bg-emerald-300/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-100">
                          📡 Eclaireur actif
                        </p>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => promoteToEclaireur(contact.id)}
                      className={`h-8 min-w-[36px] rounded-full border px-2 text-[11px] font-black ${eclaireurIds.includes(contact.id) ? "border-emerald-300/45 bg-emerald-300/20 text-emerald-100" : "border-white/20 bg-white/10 text-white/80"}`}
                      aria-label={eclaireurIds.includes(contact.id) ? "Eclaireur actif" : "Promouvoir en Eclaireur"}
                    >
                      📡
                    </button>
                  </div>
                </div>
              ))}
            </div>
              </>
            ) : (
              <>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.08em] text-white/75">Filtres</p>
                  {historyFiltersActiveCount > 0 && (
                    <span className="rounded-full border border-cyan-300/35 bg-cyan-300/18 px-2 py-0.5 text-[10px] font-black text-cyan-100">
                      {historyFiltersActiveCount} actif(s)
                    </span>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div className={`relative rounded-lg border ${isHistoryStatusFilterActive ? "border-cyan-300/45 bg-cyan-300/12" : "border-white/15 bg-black/25"}`}>
                    {isHistoryStatusFilterActive && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-cyan-300" />}
                    <select
                      value={historyStatusFilter}
                      onChange={(event) => setHistoryStatusFilter(event.target.value as "all" | "sent" | "validated")}
                      className="h-9 w-full rounded-lg bg-transparent px-2 text-[11px]"
                    >
                      <option value="all">Statut: Tous</option>
                      <option value="sent">Statut: Envoye</option>
                      <option value="validated">Statut: Valide</option>
                    </select>
                  </div>
                  <div className={`relative rounded-lg border ${isHistoryActionFilterActive ? "border-cyan-300/45 bg-cyan-300/12" : "border-white/15 bg-black/25"}`}>
                    {isHistoryActionFilterActive && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-cyan-300" />}
                    <select
                      value={historyActionFilter}
                      onChange={(event) => setHistoryActionFilter(event.target.value as "all" | Exclude<DailyCategory, "qualifier">)}
                      className="h-9 w-full rounded-lg bg-transparent px-2 text-[11px]"
                    >
                      <option value="all">Action: Toutes</option>
                      <option value="eclaireur">Eclaireur</option>
                      <option value="package">Partage Croise</option>
                      <option value="exclients">Ex-Clients</option>
                      <option value="passer">Passer</option>
                    </select>
                  </div>
                  <div className={`relative rounded-lg border ${isHistoryPeriodFilterActive ? "border-cyan-300/45 bg-cyan-300/12" : "border-white/15 bg-black/25"}`}>
                    {isHistoryPeriodFilterActive && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-cyan-300" />}
                    <select
                      value={historyPeriodFilter}
                      onChange={(event) => setHistoryPeriodFilter(event.target.value as "all" | "today" | "7d")}
                      className="h-9 w-full rounded-lg bg-transparent px-2 text-[11px]"
                    >
                      <option value="all">Periode: Tout</option>
                      <option value="today">Periode: Aujourd hui</option>
                      <option value="7d">Periode: 7 jours</option>
                    </select>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-white/65">
                  {filteredHistoryEntries.length} action(s) • lecture chronologique par jour
                </p>
                <div className="mt-3 max-h-[calc(100dvh-350px)] space-y-3 overflow-y-auto pb-2 sm:max-h-[60vh]">
                  {historyTimelineDays.length === 0 && <p className="text-sm text-white/70">Aucune action pour ces filtres.</p>}
                  {historyTimelineDays.map((day) => {
                    const daySentCount = day.entries.filter((entry) => entry.sent).length;
                    const dayNotSentCount = day.entries.length - daySentCount;
                    const dayConvertedCount = day.entries.filter((entry) => entry.outcomeStatus === "converted").length;
                    return (
                      <section key={`history-day-${day.dayStartMs}`} className="rounded-2xl border border-white/15 bg-black/25 p-2">
                        <div className="sticky top-0 z-10 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-2 py-1">
                          <p className="text-[11px] font-black uppercase tracking-[0.08em] text-cyan-100">{day.dayLabel}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full border border-emerald-300/35 bg-emerald-300/12 px-2 py-0.5 text-[10px] font-black text-emerald-100">
                              {daySentCount} envoye(s)
                            </span>
                            <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-black text-white/85">
                              {dayNotSentCount} non envoye(s)
                            </span>
                            <span className="rounded-full border border-fuchsia-300/35 bg-fuchsia-300/12 px-2 py-0.5 text-[10px] font-black text-fuchsia-100">
                              {dayConvertedCount} converti(s)
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 space-y-2">
                          {day.entries.map((entry, idx) => {
                            const eligibleToPromote = entry.sent && entry.action === "eclaireur" && !eclaireurIds.includes(entry.contactId);
                            const historyKey = `${entry.actionId || entry.contactId}:${entry.atMs}`;
                            const isExpanded = expandedHistoryEntryKeys.includes(historyKey);
                            const status = historyStatusMeta(entry);
                            return (
                              <article
                                key={`${entry.contactId}-${entry.atMs}-${idx}`}
                                className="relative overflow-hidden rounded-xl border border-white/15 bg-[#101938] px-3 py-2"
                                style={{ borderLeftWidth: "3px" }}
                              >
                                <span className={`absolute inset-y-0 left-0 w-[3px] ${status.leftBar}`} />
                                <button
                                  type="button"
                                  onClick={() => toggleHistoryEntryExpanded(historyKey)}
                                  className="w-full text-left"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="min-w-0 truncate text-sm font-black text-white">{entry.name}</p>
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] ${status.className}`}>
                                      <span>{status.icon}</span>
                                      <span>{status.label}</span>
                                    </span>
                                  </div>
                                  <p className="mt-1 text-[10px] text-white/72">{actionLabel(entry.action)} • {entry.timeLabel}</p>
                                  <div className="mt-1 flex items-center justify-between gap-2">
                                    <p className="line-clamp-1 text-xs text-white/85">{historyMessageSnippet(entry.messageDraft)}</p>
                                    <span className="text-sm text-white/55">{isExpanded ? "⌄" : "›"}</span>
                                  </div>
                                </button>
                                <AnimatePresence initial={false}>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2, ease: "easeOut" }}
                                      className="overflow-hidden"
                                    >
                                      <div className="mt-2 rounded-lg border border-white/15 bg-black/25 px-2 py-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.08em] text-white/70">Message complet</p>
                                        <p className="mt-1 whitespace-pre-wrap text-xs text-white/88">
                                          {entry.messageDraft?.trim()?.length
                                            ? entry.messageDraft
                                            : "Aucun texte conserve pour cette action."}
                                        </p>
                                      </div>
                                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => resendHistoryEntry(entry)}
                                          className="rounded-lg border border-cyan-300/35 bg-cyan-300/12 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100"
                                        >
                                          Renvoyer
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => updateActionOutcome(entry, "converted")}
                                          className="rounded-lg border border-violet-300/35 bg-violet-300/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-violet-100"
                                        >
                                          Marquer converti
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => removeHistoryEntry(entry)}
                                          className="rounded-lg border border-rose-300/35 bg-rose-300/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-rose-100"
                                        >
                                          Supprimer
                                        </button>
                                        {entry.messageDraft?.trim()?.length ? (
                                          <button
                                            type="button"
                                            onClick={() => copyHistoryMessage(entry)}
                                            className="rounded-lg border border-emerald-300/35 bg-emerald-300/12 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-100"
                                          >
                                            {copiedHistoryEntryKey === historyKey ? "Copie ✓" : "Copier"}
                                          </button>
                                        ) : null}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const nextIndex = allContactsData.findIndex((contact) => contact.id === entry.contactId);
                                            if (nextIndex >= 0) setIndex(nextIndex);
                                            openContactProfileWithTrustGuard(entry.contactId);
                                          }}
                                          className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/85"
                                        >
                                          Ouvrir fiche
                                        </button>
                                        {eligibleToPromote && (
                                          <button
                                            type="button"
                                            onClick={() => promoteToEclaireur(entry.contactId)}
                                            className="rounded-lg border border-emerald-300/45 bg-emerald-300/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-100"
                                          >
                                            ⭐ Promouvoir eclaireur
                                          </button>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </article>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {showEclaireursPanel && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-start justify-center px-0 pt-0 pb-0 sm:px-4 sm:pt-16 sm:pb-0">
          <section
            className="h-[calc(100dvh-92px)] max-h-[calc(100dvh-92px)] w-full overflow-hidden rounded-none border-0 bg-[#0E1430] p-4 sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-3xl sm:border sm:border-white/15"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
          >
            <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
            <div className="sticky top-0 z-30 -mx-1 rounded-xl bg-[#0E1430]/95 px-1 pb-3 backdrop-blur">
              <div className="rounded-xl bg-[#0E1430]/95 pb-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Mes Eclaireurs</p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddScoutTooltip(false);
                        setHasSeenAddScoutTooltip(true);
                        setShowAddScoutModal(true);
                      }}
                      className="relative z-30 h-9 w-9 rounded-full border border-cyan-300/40 bg-cyan-300/15 text-base font-black text-cyan-100"
                      aria-label="Ajouter un eclaireur"
                    >
                      +
                    </button>
                    {showAddScoutTooltip && (
                      <div className="pointer-events-none absolute right-0 top-11 whitespace-nowrap rounded-lg border border-cyan-300/35 bg-[#0E183A] px-2 py-1 text-[10px] font-black text-cyan-100">
                        Ajouter un eclaireur
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/12 px-2 py-2 text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.08em] text-cyan-100">Eclaireurs Pro</p>
                  <p className="text-lg font-black text-cyan-50">{eclaireurHeaderStats.proCount}</p>
                </div>
                <div className="rounded-xl border border-emerald-300/30 bg-emerald-300/12 px-2 py-2 text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.08em] text-emerald-100">Eclaireurs Perso</p>
                  <p className="text-lg font-black text-emerald-50">{eclaireurHeaderStats.persoCount}</p>
                </div>
                <div className="rounded-xl border border-fuchsia-300/30 bg-fuchsia-300/12 px-2 py-2 text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.08em] text-fuchsia-100">Total Eclaireurs</p>
                  <p className="text-lg font-black text-fuchsia-50">{eclaireurHeaderStats.totalCount}</p>
                </div>
                <div className={`rounded-xl border border-amber-300/40 bg-amber-200/20 px-2 py-2 text-center ${recoAlertPulse ? "animate-pulse" : ""}`}>
                  <p className="text-[9px] font-black uppercase tracking-[0.08em] text-amber-100">Total Reco (alertes)</p>
                  <p className="text-2xl font-black text-amber-50">{eclaireurHeaderStats.alertesCount}</p>
                  <p className="text-[10px] font-black text-amber-100/90">alerte(s)</p>
                </div>
              </div>
              {apiErrorMessage ? (
                <p className="mt-2 rounded-lg border border-amber-300/35 bg-amber-300/10 px-2 py-1 text-[11px] text-amber-100">{apiErrorMessage}</p>
              ) : null}
              <div className="mt-2 rounded-2xl border border-fuchsia-300/40 bg-[radial-gradient(circle_at_15%_0%,rgba(217,70,239,0.26),rgba(11,17,40,0.96))] px-3 py-3 shadow-[0_20px_80px_-35px_rgba(217,70,239,0.8)]">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.1em] text-fuchsia-100">🔥 Opportunites entrantes Eclaireurs</p>
                  <span className="inline-flex rounded-full border border-fuchsia-200/35 bg-fuchsia-200/20 px-2 py-0.5 text-[10px] font-black text-fuchsia-50">
                    {incomingReferrals.length} alerte(s)
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-fuchsia-100/85">Traite ces opportunites en priorite: RDV, offre puis signature finale.</p>
                {isIncomingReferralsLoading ? (
                  <p className="mt-1 text-[11px] text-white/70">Chargement...</p>
                ) : incomingReferrals.length === 0 ? (
                  <p className="mt-1 text-[11px] text-white/70">Aucune opportunite recu pour le moment.</p>
                ) : (
                  <div className="mt-2 space-y-1">
                    {incomingReferrals.slice(0, 4).map((item) => (
                      <button
                        key={`incoming-${item.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedIncomingReferralId(item.id);
                          setIncomingSignedAmount("");
                        }}
                        className="w-full rounded-xl border border-fuchsia-200/25 bg-black/30 px-3 py-2 text-left transition hover:border-fuchsia-300/55 hover:bg-fuchsia-300/12"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[12px] font-black text-white">{item.contact_name}</p>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${
                              item.status === "converted"
                                ? "border-fuchsia-300/40 bg-fuchsia-300/20 text-fuchsia-100"
                                : item.status === "offered"
                                  ? "border-violet-300/35 bg-violet-300/15 text-violet-100"
                                  : item.status === "validated"
                                    ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-100"
                                    : "border-emerald-300/35 bg-emerald-300/15 text-emerald-100"
                            }`}
                          >
                            {item.status === "converted"
                              ? "Signature finale ✨"
                              : item.status === "offered"
                                ? "Offre envoyee 🟣"
                                : item.status === "validated"
                                  ? "RDV pris 🔵"
                                  : "Opportunite recue 🟢"}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] text-white/75">
                          {item.status === "converted" ? "🏁" : item.status === "offered" ? "🧾" : item.status === "validated" ? "📅" : "📥"}{" "}
                          {item.scout_name || "Eclaireur"} ({item.scout_type === "pro" ? "Pro" : "Perso"}) • {referralStatusLabel(item.status)}
                        </p>
                        <p className="text-[10px] text-white/65">{formatDateTimeShort(item.updated_at || item.created_at)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 space-y-2 pb-24">
              {eclaireursList.length === 0 && <p className="text-sm text-white/70">Aucun eclaireur actif pour l instant.</p>}
              {eclaireursList.map((contact) => {
                const stats = eclaireurStatsStore[contact.id] || { leadsDetected: 0, leadsSigned: 0, commissionTotalEur: 0, lastNewsAtMs: 0 };
                const daysSinceActivation = stats.lastNewsAtMs > 0 ? Math.max(0, Math.floor((Date.now() - stats.lastNewsAtMs) / (24 * 60 * 60 * 1000))) : null;
                const isProScout = contact.scoutType === "pro";
                return (
                  <div
                    key={`eclaireur-${contact.id}`}
                    className={`rounded-xl border px-3 py-2 ${
                      isProScout
                        ? "border-violet-300/35 bg-violet-300/12 shadow-[0_0_20px_rgba(167,139,250,0.18)]"
                        : "border-cyan-300/30 bg-cyan-300/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => openEclaireurTemplates(contact.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className={`truncate text-sm font-black ${isProScout ? "text-violet-50" : "text-cyan-50"}`}>{contact.name}</p>
                        <p className={`text-[11px] ${isProScout ? "text-violet-100/80" : "text-cyan-100/80"}`}>{contact.city}</p>
                      </button>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${
                            isProScout
                              ? "border-violet-300/45 bg-violet-300/20 text-violet-100"
                              : "border-cyan-300/45 bg-cyan-300/20 text-cyan-100"
                          }`}
                        >
                          {isProScout ? "🤝 Pro" : "👥 Perso"}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEclaireurTemplates(contact.id)}
                          className="rounded-lg border border-cyan-300/35 bg-cyan-300/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100"
                        >
                          Messages
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeEclaireur(contact.id)}
                          disabled={isRemovingEclaireurId === contact.id}
                          className="rounded-lg border border-rose-300/35 bg-rose-300/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-rose-100 disabled:opacity-60"
                        >
                          {isRemovingEclaireurId === contact.id ? "Retrait..." : "Supprimer"}
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-[10px] text-white/80">
                      {daysSinceActivation === null
                        ? "Activation: jamais activee"
                        : `Activation: il y a ${daysSinceActivation} jour${daysSinceActivation > 1 ? "s" : ""}`}
                    </p>
                    <p className="mt-1 text-[12px] text-white/72">
                      {stats.leadsDetected} reco • {stats.leadsSigned} abouties • {Math.round(stats.commissionTotalEur || 0)}€ generes
                    </p>
                    {eclaireurLinksByContactId[contact.id] ? (
                      <div className="mt-2 rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-2 py-2">
                        {eclaireurLinksByContactId[contact.id]?.shortCode ? (
                          <p className="text-[10px] text-[#EAC886]">
                            Code court: <span className="font-black tracking-wider">{eclaireurLinksByContactId[contact.id]?.shortCode}</span>
                          </p>
                        ) : null}
                        {eclaireurLinksByContactId[contact.id]?.shortUrl ? (
                          <p className="mt-1 break-all text-[10px] text-cyan-100">{eclaireurLinksByContactId[contact.id]?.shortUrl}</p>
                        ) : null}
                        {eclaireurLinksByContactId[contact.id]?.fullUrl ? (
                          <p className="mt-1 break-all text-[10px] text-emerald-100/85">{eclaireurLinksByContactId[contact.id]?.fullUrl}</p>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => copyEclaireurLink(contact.id)}
                          disabled={copyingEclaireurLinkContactId === contact.id}
                          className="mt-2 h-7 rounded-lg border border-cyan-300/35 bg-cyan-300/15 px-2 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100 disabled:opacity-60"
                        >
                          {copyingEclaireurLinkContactId === contact.id ? "Copie..." : "Copier le lien"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => ensureEclaireurLink(contact.id, { autoCopy: true })}
                        disabled={loadingEclaireurLinkContactId === contact.id}
                        className="mt-2 h-7 rounded-lg border border-cyan-300/35 bg-cyan-300/15 px-2 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100 disabled:opacity-60"
                      >
                        {loadingEclaireurLinkContactId === contact.id
                          ? "Generation..."
                          : copyingEclaireurLinkContactId === contact.id
                            ? "Copie..."
                            : "Generer lien eclaireur"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
          </section>
        </div>
      )}

      {showAlliancesPanel && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-start justify-center px-0 pt-0 pb-0 sm:px-4 sm:pt-16 sm:pb-0">
          <section
            className="h-[calc(100dvh-92px)] max-h-[calc(100dvh-92px)] w-full overflow-y-auto rounded-none border-0 bg-[#0E1430] p-4 pb-28 sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-3xl sm:border sm:border-white/15"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
          >
            <div className="sticky top-0 z-20 -mx-4 bg-[#0E1430] px-4 pb-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Alliances</p>
                <button
                  type="button"
                  onClick={() => {
                    if (allianceDirectoryMode === "internal") {
                      setShowInternalInvitesModal(true);
                      void loadInternalAllianceInvites();
                    } else {
                      setShowAllianceInvitesModal(true);
                      void loadAllianceInvites();
                    }
                  }}
                  className="rounded-full border border-fuchsia-300/35 bg-fuchsia-300/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-fuchsia-100 transition hover:scale-[1.02] hover:bg-fuchsia-300/20"
                >
                  {allianceDirectoryMode === "internal" ? "Mes demandes internes" : "Mes alliances"} ({activeAllianceInvites.length})
                </button>
              </div>
              <div className="mt-2 inline-flex rounded-full border border-white/15 bg-black/20 p-1">
                <button
                  type="button"
                  onClick={() => setAllianceDirectoryMode("external")}
                  className={`h-8 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.08em] transition ${
                    allianceDirectoryMode === "external"
                      ? "bg-cyan-300/30 text-cyan-100"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Externe
                </button>
                <button
                  type="button"
                  onClick={() => setAllianceDirectoryMode("internal")}
                  className={`h-8 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.08em] transition ${
                    allianceDirectoryMode === "internal"
                      ? "bg-emerald-300/30 text-emerald-100"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Interne Popey
                </button>
              </div>
              <p className="mt-2 text-[11px] text-white/70">
                {allianceDirectoryMode === "external"
                  ? "Externes: pros locaux via annuaire public."
                  : "Interne: membres Popey actifs."}
              </p>
            </div>

            <div className="relative mt-3 overflow-hidden rounded-3xl border border-cyan-300/45 bg-gradient-to-br from-cyan-300/20 via-[#12204A] to-fuchsia-300/20 p-4 shadow-[0_0_40px_rgba(56,189,248,0.16)]">
              <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-cyan-300/25 blur-2xl animate-pulse" />
              <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-fuchsia-300/25 blur-2xl animate-pulse" />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100">
                      {allianceDirectoryMode === "internal" ? "Annuaire interne Popey" : "Recrutement externe premium"}
                    </p>
                    <h3 className="mt-1 text-lg font-black text-white sm:text-xl">Fais decoller ton business avec des alliances locales</h3>
                    <p className="mt-1 text-[12px] text-white/85">
                      {allianceDirectoryMode === "internal"
                        ? "Trouve des membres Popey deja inscrits, en synergie avec ton metier, puis envoie ta demande WhatsApp en 1 clic."
                        : "Lance une recherche ciblee, contacte les bons pros, et transforme-les en apporteurs actifs."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBoostInfo(true)}
                    className="rounded-full border border-amber-300/45 bg-amber-300/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-amber-100"
                  >
                    BOOST • Premium
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-white/15 bg-black/25 px-2 py-2 text-center">
                    <p className="text-[9px] uppercase tracking-[0.08em] text-white/60">Objectif 1</p>
                    <p className="text-[11px] font-black text-white">10 Eclaireurs Pro</p>
                  </div>
                  <div className="rounded-xl border border-cyan-300/35 bg-cyan-300/12 px-2 py-2 text-center">
                    <p className="text-[9px] uppercase tracking-[0.08em] text-cyan-100">Objectif 2</p>
                    <p className="text-[11px] font-black text-cyan-100">10 Eclaireurs Perso</p>
                  </div>
                  <div className="rounded-xl border border-fuchsia-300/35 bg-fuchsia-300/12 px-2 py-2 text-center">
                    <p className="text-[9px] uppercase tracking-[0.08em] text-fuchsia-100">Objectif final</p>
                    <p className="text-[11px] font-black text-fuchsia-100">20 reco / mois</p>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-white/65">Eclaireur = apporteur d affaires.</p>
              </div>
              <div className="relative mt-4 grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[11px] text-white/65">Ville</p>
                  <input
                    value={allianceCity}
                    onChange={(event) => setAllianceCity(event.target.value)}
                    placeholder="Ville (ex: Dax)"
                    className="h-11 w-full rounded-xl border border-white/20 bg-black/35 px-3 text-[12px] placeholder:text-white/45"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11px] text-white/65">Rayon (km)</p>
                  <input
                    value={allianceRadiusKm}
                    onChange={(event) => setAllianceRadiusKm(event.target.value)}
                    placeholder="15"
                    inputMode="numeric"
                    className="h-11 w-full rounded-xl border border-white/20 bg-black/35 px-3 text-[12px] placeholder:text-white/45"
                  />
                </div>
                <div className="sm:col-span-2">
                  <p className="mb-1 text-[11px] text-white/65">Ton metier</p>
                  <input
                    value={allianceSourceMetier}
                    onChange={(event) => setAllianceSourceMetier(event.target.value)}
                    placeholder="Ton metier"
                    className="h-11 w-full rounded-xl border border-white/20 bg-black/35 px-3 text-[12px] placeholder:text-white/45"
                  />
                </div>
                <div className="sm:col-span-2">
                  <p className="mb-1 text-[11px] text-white/65">Metiers cibles</p>
                  <input
                    value={allianceTargetMetiersInput}
                    onChange={(event) => setAllianceTargetMetiersInput(event.target.value)}
                    placeholder="courtier, notaire, ..."
                    className="h-11 w-full rounded-xl border border-white/20 bg-black/35 px-3 text-[12px] placeholder:text-white/45"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  void runAllianceSearch();
                }}
                disabled={isAlliancesSearching || !allianceCity.trim()}
                className="relative mt-3 h-12 w-full overflow-hidden rounded-2xl border border-emerald-300/50 bg-gradient-to-r from-emerald-300/30 to-cyan-300/30 text-[12px] font-black uppercase tracking-[0.08em] text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {isAlliancesSearching
                  ? "Recherche en cours..."
                  : allianceDirectoryMode === "internal"
                    ? "Lancer recherche interne Popey"
                    : "Lancer recherche B2B"}
              </button>
              {apiErrorMessage ? (
                <p className="mt-2 rounded-lg border border-amber-300/35 bg-amber-300/10 px-2 py-1 text-[11px] text-amber-100">
                  {apiErrorMessage}
                </p>
              ) : null}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-[11px] text-white/65">{allianceProspects.length} prospect(s) alliance trouve(s)</p>
              <select
                value={allianceSort}
                onChange={(event) => setAllianceSort(event.target.value as "probability" | "fit" | "distance" | "recent")}
                className="h-8 rounded-lg border border-white/20 bg-black/25 px-2 text-[10px]"
              >
                <option value="probability">Tri: Probabilite</option>
                <option value="fit">Tri: Fit score</option>
                <option value="distance">Tri: Distance</option>
                <option value="recent">Tri: Recents</option>
              </select>
            </div>

            <div className="mt-2 space-y-2">
              {isAlliancesLoading && <p className="text-sm text-white/70">Chargement des alliances...</p>}
              {!isAlliancesLoading && allianceProspects.length === 0 ? (
                <p className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white/75">
                  Aucun prospect pour le moment. Lance une recherche avec ville + metiers cibles.
                </p>
              ) : null}
              {displayedAllianceProspects.map((prospect) => (
                <motion.article
                  key={`alliance-prospect-${prospect.id}`}
                  initial={{ opacity: 0, y: 18, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="rounded-xl border border-white/15 bg-black/25 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-black text-white">{prospect.full_name}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${allianceMetierTone(prospect.metier)}`}>
                          {prospect.metier}
                        </span>
                        {allianceDirectoryMode === "internal" ? (
                          <span className="rounded-full border border-emerald-300/35 bg-emerald-300/12 px-2 py-0.5 text-[10px] font-black text-emerald-100">
                            Membre Popey
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[10px] text-white/70">
                        {prospect.city || "Ville inconnue"} {prospect.distance_km ? `• ${prospect.distance_km} km` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowAllianceMetricsInfo(true)}
                        className="h-6 w-6 rounded-full border border-white/25 bg-white/10 text-[10px] font-black text-white/90"
                        aria-label="Aide score et probabilite"
                      >
                        ⓘ
                      </button>
                      <span className="rounded-full border border-emerald-300/35 bg-emerald-300/12 px-2 py-0.5 text-[10px] font-black text-emerald-100">
                        Score {prospect.fit_score}/100
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-cyan-300/30 bg-cyan-300/12 px-2 py-0.5 text-[10px] font-black text-cyan-100">
                      Probabilite {prospect.partnership_probability || 0}%
                    </span>
                    <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-300/12 px-2 py-0.5 text-[10px] font-black text-fuchsia-100">
                      Invites {prospect.invite_sent_count || 0}
                    </span>
                    <span className="rounded-full border border-amber-300/30 bg-amber-300/12 px-2 py-0.5 text-[10px] font-black text-amber-100">
                      Clics {prospect.invite_clicked_count || 0}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-white/65">
                    Score = adequation profil • Probabilite = chance de reponse estimee
                  </p>
                  <div className="mt-2 space-y-2">
                    <p className="truncate text-[10px] text-white/70">{prospect.phone_e164 || "Telephone non disponible"}</p>
                    <button
                      type="button"
                      onClick={() => {
                        openAllianceMessageEditor(prospect);
                      }}
                      className="h-11 w-full rounded-xl border border-fuchsia-300/35 bg-fuchsia-300/20 px-3 text-[11px] font-black uppercase tracking-[0.08em] text-fuchsia-100"
                    >
                      Message
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>
          </section>
        </div>
      )}

      {showAlliancesPanel && (showAllianceInvitesModal || showInternalInvitesModal) && (
        <div className="fixed inset-0 z-[72] flex items-center justify-center bg-black/75 px-3 py-8 backdrop-blur-md sm:px-4">
          <section className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-fuchsia-300/35 bg-gradient-to-br from-[#171B46] via-[#101A3D] to-[#1A1550] p-4 shadow-[0_0_50px_rgba(217,70,239,0.28)] sm:p-5">
            <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-fuchsia-300/25 blur-3xl animate-pulse" />
            <div className="pointer-events-none absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl animate-pulse" />
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-fuchsia-100">
                {allianceDirectoryMode === "internal" ? "Mes demandes internes" : "Mes alliances sollicitees"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (allianceDirectoryMode === "internal") {
                      void loadInternalAllianceInvites();
                    } else {
                      void loadAllianceInvites();
                    }
                  }}
                  className="h-8 rounded-lg border border-white/20 bg-white/10 px-2 text-[10px] font-black uppercase tracking-[0.08em] text-white/85"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAllianceInvitesModal(false);
                    setShowInternalInvitesModal(false);
                  }}
                  className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              <div className="rounded-xl border border-white/20 bg-black/25 px-2 py-2 text-center">
                <p className="text-[9px] uppercase font-black tracking-[0.08em] text-white/70">Total</p>
                <p className="text-sm font-black text-white">{activeAllianceInvites.length}</p>
              </div>
              <div className="rounded-xl border border-cyan-300/35 bg-cyan-300/12 px-2 py-2 text-center">
                <p className="text-[9px] uppercase font-black tracking-[0.08em] text-cyan-100">Envoye</p>
                <p className="text-sm font-black text-cyan-100">{activeAllianceInvites.filter((item) => item.status === "sent").length}</p>
              </div>
              <div className="rounded-xl border border-amber-300/35 bg-amber-300/12 px-2 py-2 text-center">
                <p className="text-[9px] uppercase font-black tracking-[0.08em] text-amber-100">Clique</p>
                <p className="text-sm font-black text-amber-100">{activeAllianceInvites.filter((item) => item.status === "clicked").length}</p>
              </div>
              <div className="rounded-xl border border-emerald-300/35 bg-emerald-300/12 px-2 py-2 text-center">
                <p className="text-[9px] uppercase font-black tracking-[0.08em] text-emerald-100">Inscrit</p>
                <p className="text-sm font-black text-emerald-100">{activeAllianceInvites.filter((item) => item.status === "signed_up").length}</p>
              </div>
            </div>
            {(allianceDirectoryMode === "internal" ? isInternalInvitesLoading : isAllianceInvitesLoading) ? (
              <p className="mt-3 text-[11px] text-white/70">Chargement de tes alliances...</p>
            ) : (
              <div className="mt-3 max-h-[46vh] space-y-1 overflow-y-auto pr-1">
                {activeAllianceInvites.length === 0 ? (
                  <p className="rounded-lg border border-white/15 bg-black/25 px-2 py-2 text-[10px] text-white/70">
                    Aucune alliance sollicitee pour le moment.
                  </p>
                ) : null}
                {activeAllianceInvites.map((invite) => (
                  <div key={`alliance-modal-invite-${invite.id}`} className="rounded-lg border border-white/15 bg-black/25 px-2 py-1.5">
                    <p className="text-[11px] font-black text-white">{invite.prospect_name}</p>
                    <p className="text-[10px] text-white/70">
                      {invite.prospect_metier}
                      {invite.prospect_city ? ` • ${invite.prospect_city}` : ""}
                      {` • ${invite.status}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {showAddScoutModal && (
        <div className="fixed inset-0 z-[64] flex items-center justify-center bg-black/70 px-3 backdrop-blur-sm sm:px-4">
          <section className="w-full max-w-lg rounded-3xl border border-cyan-300/30 bg-[#0E1430] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-cyan-100">Ajouter un Eclaireur</p>
              <button
                type="button"
                onClick={() => setShowAddScoutModal(false)}
                className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                value={manualScoutFirstName}
                onChange={(event) => setManualScoutFirstName(event.target.value)}
                placeholder="Prenom"
                className="h-9 rounded-lg border border-white/15 bg-black/30 px-2 text-[11px]"
              />
              <input
                value={manualScoutLastName}
                onChange={(event) => setManualScoutLastName(event.target.value)}
                placeholder="Nom"
                className="h-9 rounded-lg border border-white/15 bg-black/30 px-2 text-[11px]"
              />
              <input
                value={manualScoutMetier}
                onChange={(event) => setManualScoutMetier(event.target.value)}
                placeholder="Metier"
                className="h-9 rounded-lg border border-white/15 bg-black/30 px-2 text-[11px]"
              />
              <input
                value={manualScoutCity}
                onChange={(event) => setManualScoutCity(event.target.value)}
                placeholder="Ville"
                className="h-9 rounded-lg border border-white/15 bg-black/30 px-2 text-[11px]"
              />
              <input
                value={manualScoutPhone}
                onChange={(event) => setManualScoutPhone(event.target.value)}
                placeholder="Telephone"
                className="col-span-2 h-9 rounded-lg border border-white/15 bg-black/30 px-2 text-[11px]"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAddScoutModal(false);
                void importSingleContactManually({
                  firstName: manualScoutFirstName,
                  lastName: manualScoutLastName,
                  metier: manualScoutMetier,
                  city: manualScoutCity,
                  phone: manualScoutPhone,
                });
              }}
              disabled={!manualScoutFirstName.trim() && !manualScoutLastName.trim()}
              className="mt-3 h-10 w-full rounded-xl border border-cyan-300/40 bg-cyan-300/20 text-[11px] font-black uppercase tracking-[0.08em] text-cyan-100 disabled:opacity-60"
            >
              Ajouter + Eclaireur
            </button>
          </section>
        </div>
      )}

      {selectedIncomingReferral && (
        <div className="fixed inset-0 z-[62] flex items-center justify-center bg-black/72 px-3 backdrop-blur-md sm:px-4">
          <section className="relative w-full max-h-[88vh] max-w-2xl overflow-y-auto rounded-3xl border border-emerald-300/35 bg-[#0B1230] p-5 shadow-[0_30px_120px_-35px_rgba(16,185,129,0.75)] sm:p-6">
            <button
              type="button"
              onClick={() => setSelectedIncomingReferralId(null)}
              className="absolute right-3 top-3 z-10 h-9 w-9 rounded-full border border-white/25 bg-black/35 text-sm text-white"
            >
              ✕
            </button>
            <div className="rounded-2xl border border-emerald-300/35 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.26),rgba(8,12,28,0.94))] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100">Bonne nouvelle</p>
              <p className="mt-1 text-2xl font-black text-white">Nouvelle opportunite Eclaireur</p>
              <p className="mt-1 text-sm text-emerald-100/85">
                {selectedIncomingReferral.contact_name} • {selectedIncomingReferral.project_type || "Projet non precise"}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-fuchsia-100">Pipeline de suivi</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-[0.08em] sm:grid-cols-4">
              {[
                { id: "submitted", label: "Opportunite recue" },
                { id: "validated", label: "RDV pris" },
                { id: "offered", label: "Offre envoyee" },
                { id: "converted", label: "Signature finale" },
              ].map((step, idx, arr) => {
                const currentIdx = arr.findIndex((item) => item.id === selectedIncomingReferral.status);
                const isActive = idx <= (currentIdx >= 0 ? currentIdx : 0);
                return (
                  <div
                    key={`incoming-step-${step.id}`}
                    className={`rounded-xl border px-2 py-2 text-center ${
                      isActive
                        ? "border-emerald-300/45 bg-emerald-300/20 text-emerald-100"
                        : "border-white/15 bg-black/25 text-white/60"
                    }`}
                  >
                    {step.label}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-[12px] text-white/90">
              <p>
                <span className="text-white/65">Contact:</span> {selectedIncomingReferral.contact_name}
              </p>
              <p>
                <span className="text-white/65">Eclaireur:</span> {selectedIncomingReferral.scout_name || "Eclaireur"}
              </p>
              <p>
                <span className="text-white/65">Ville eclaireur:</span> {selectedIncomingReferral.scout_ville || "Non renseignee"}
              </p>
              <p>
                <span className="text-white/65">Projet:</span> {selectedIncomingReferral.project_type || "Non precise"}
              </p>
              <p>
                <span className="text-white/65">Statut:</span> {referralStatusLabel(selectedIncomingReferral.status)}
              </p>
              {selectedIncomingReferral.comment ? (
                <p className="mt-2 rounded-lg border border-white/10 bg-black/25 px-2 py-1 text-[11px] text-white/85">
                  {selectedIncomingReferral.comment}
                </p>
              ) : null}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => openIncomingReferralWhatsApp(selectedIncomingReferral)}
                className="h-10 rounded-xl border border-emerald-300/35 bg-emerald-300/15 px-3 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-100"
              >
                Alerter Eclaireur (WhatsApp)
              </button>
              {selectedIncomingReferral.status === "submitted" ? (
                <button
                  type="button"
                  onClick={() => void updateIncomingReferralStatus("validated")}
                  disabled={isIncomingReferralStatusUpdating}
                  className="h-10 rounded-xl border border-cyan-300/35 bg-cyan-300/15 px-3 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100 disabled:opacity-60"
                >
                  {isIncomingReferralStatusUpdating ? "MAJ..." : "Marquer RDV pris"}
                </button>
              ) : null}
              {selectedIncomingReferral.status === "validated" ? (
                <button
                  type="button"
                  onClick={() => void updateIncomingReferralStatus("offered")}
                  disabled={isIncomingReferralStatusUpdating}
                  className="h-10 rounded-xl border border-cyan-300/35 bg-cyan-300/15 px-3 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100 disabled:opacity-60"
                >
                  {isIncomingReferralStatusUpdating ? "MAJ..." : "Marquer Offre envoyee"}
                </button>
              ) : null}
            </div>
            {selectedIncomingReferral.status === "offered" ? (
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  value={incomingSignedAmount}
                  onChange={(event) => setIncomingSignedAmount(event.target.value)}
                  placeholder="Montant signe (€)"
                  inputMode="decimal"
                  className="h-10 rounded-xl border border-white/15 bg-black/25 px-3 text-[11px]"
                />
                <button
                  type="button"
                  onClick={() => void updateIncomingReferralStatus("converted")}
                  disabled={isIncomingReferralStatusUpdating}
                  className="h-10 rounded-xl border border-fuchsia-300/35 bg-fuchsia-300/15 px-3 text-[10px] font-black uppercase tracking-[0.08em] text-fuchsia-100 disabled:opacity-60"
                >
                  {isIncomingReferralStatusUpdating ? "MAJ..." : "Signature finale"}
                </button>
              </div>
            ) : null}
          </section>
        </div>
      )}

      <AnimatePresence>
        {showDealCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-black/35"
          >
            <motion.div
              initial={{ scale: 0.75, y: 18, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: -10, opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="relative mx-4 w-full max-w-md overflow-hidden rounded-3xl border border-fuchsia-200/45 bg-[radial-gradient(circle_at_20%_0%,rgba(244,114,182,0.35),rgba(22,15,52,0.95))] px-5 py-6 text-center shadow-[0_35px_100px_-30px_rgba(232,121,249,0.95)]"
            >
              <motion.div
                aria-hidden
                className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-cyan-300/30 blur-3xl"
                animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.35, 0.7, 0.35] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden
                className="absolute -bottom-12 -right-10 h-40 w-40 rounded-full bg-fuchsia-300/35 blur-3xl"
                animate={{ scale: [1.05, 0.9, 1.05], opacity: [0.3, 0.65, 0.3] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
              {["✨", "🎉", "💸", "🏆", "🚀"].map((emoji, idx) => (
                <motion.span
                  key={`deal-burst-${emoji}-${idx}`}
                  aria-hidden
                  className="absolute text-2xl"
                  style={{ left: `${12 + idx * 18}%`, top: `${8 + (idx % 2) * 6}%` }}
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: [0, 1, 0], y: [10, -10, -28], scale: [0.8, 1.1, 0.95] }}
                  transition={{ duration: 1.25, repeat: Infinity, delay: idx * 0.14, ease: "easeOut" }}
                >
                  {emoji}
                </motion.span>
              ))}
              <p className="relative text-5xl">🏁✨</p>
              <p className="relative mt-2 text-3xl font-black text-white">Deal signe !</p>
              <p className="relative mt-1 text-sm font-black uppercase tracking-[0.08em] text-fuchsia-100">
                Signature finale validee
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedEclaireurTemplateContactId && eclaireurTemplates.length > 0 && (
        <div className="fixed inset-0 z-[44] flex items-center justify-center bg-black/65 px-3 backdrop-blur-sm sm:px-4">
          <section className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl border border-cyan-300/25 bg-[#0E1430] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-cyan-100">
                Messages Eclaireur{selectedEclaireurTemplateContact ? ` • ${selectedEclaireurTemplateContact.name}` : ""}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedEclaireurTemplateContactId(null);
                  setEclaireurTemplates([]);
                }}
                className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {eclaireurTemplates.map((item) => (
                <button
                  key={`eclaireur-template-${item.id}`}
                  type="button"
                  onClick={() => {
                    setSelectedAction("eclaireur");
                    setDraftMessage(resolveMessageDraft("eclaireur", item.message, selectedEclaireurTemplateContact || scopedActionContact));
                    setModalInfoMessage("");
                    setShowTemplateModal(true);
                    setShowEclaireursPanel(false);
                    setSelectedEclaireurTemplateContactId(null);
                    setEclaireurTemplates([]);
                  }}
                  className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-left"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.08em] text-cyan-100">{item.label}</p>
                  <p className="mt-1 text-xs text-white/85">{item.message}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {showTrustLevelPrompt && trustPromptContact && (
        <div className="fixed inset-0 z-[46] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-3xl border border-white/20 bg-[#0E1430]/95 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Niveau de confiance requis</p>
              <button
                type="button"
                onClick={() => {
                  setShowTrustLevelPrompt(false);
                  setTrustPromptContactId(null);
                }}
                className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-white/85">
              Pour ouvrir la fiche de <span className="font-black">{trustPromptContact.name}</span>, choisis d abord son niveau de confiance.
            </p>

            <div className="mt-3 space-y-2">
              {TRUST_LEVEL_OPTIONS.map((option) => (
                <button
                  key={`prompt-${option.id}`}
                  type="button"
                  onClick={() => {
                    const contactId = trustPromptContact.id;
                    setTrustLevelStore((prev) => ({
                      ...prev,
                      [contactId]: option.id,
                    }));
                    void postSmartScan("trust", {
                      externalContactRef: trustPromptContact.id,
                      fullName: trustPromptContact.name,
                      city: trustPromptContact.city,
                      companyHint: trustPromptContact.companyHint,
                      trustLevel: option.id,
                    })
                      .then(() => refreshSmartScanSnapshot())
                      .catch(() => null);
                    setShowTrustLevelPrompt(false);
                    setTrustPromptContactId(null);
                    setTimeout(() => openContactProfile(contactId), 20);
                  }}
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-3 text-left transition hover:border-emerald-300/45 hover:bg-emerald-300/10"
                >
                  <p className="text-sm font-black text-white">{option.label}</p>
                  <p className="text-xs text-white/70">{option.helper}</p>
                  <p className="mt-1 text-[10px] font-semibold text-emerald-100/90">{option.valueHint}</p>
                </button>
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
                  {profileActionButtons.map((button) => (
                    <button
                      key={`profile-action-${button.action}`}
                      type="button"
                      onClick={() => startActionFromProfile(button.action)}
                      className={`h-10 rounded-xl text-xs font-black ${
                        button.action === "eclaireur"
                          ? "bg-amber-400/25"
                          : button.action === "package"
                            ? "bg-fuchsia-400/25"
                            : "bg-cyan-400/25"
                      } ${button.isPriority ? "ring-2 ring-white/35" : ""}`}
                    >
                      {button.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 rounded-2xl border border-white/15 bg-black/25 p-3">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Synthese decision</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className={`rounded-xl border px-2 py-1.5 ${profileUrgencyClass}`}>
                  <p className="text-[9px] uppercase tracking-[0.08em] opacity-80">Urgence</p>
                  <p className="text-xs font-black">{profileUrgencyLabel}</p>
                </div>
                <div className="rounded-xl border border-cyan-300/35 bg-cyan-300/12 px-2 py-1.5 text-cyan-100">
                  <p className="text-[9px] uppercase tracking-[0.08em] opacity-80">Action reco</p>
                  <p className="text-xs font-black">{actionLabel(profileRecommendedAction)}</p>
                </div>
                <div className="rounded-xl border border-orange-300/35 bg-orange-300/12 px-2 py-1.5 text-orange-100">
                  <p className="text-[9px] uppercase tracking-[0.08em] opacity-80">Relances dues</p>
                  <p className="text-xs font-black">{profilePendingDueCount}</p>
                </div>
                <div className="rounded-xl border border-emerald-300/35 bg-emerald-300/12 px-2 py-1.5 text-emerald-100">
                  <p className="text-[9px] uppercase tracking-[0.08em] opacity-80">Converts</p>
                  <p className="text-xs font-black">{profileConvertedCount}</p>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-white/15 bg-black/25 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">ADN & Qualification</p>
                <button type="button" onClick={editProfileQualification} className="text-xs underline underline-offset-2 text-cyan-100">Editer</button>
              </div>
              <p className="mt-2 text-sm font-black">Temperature actuelle: {profileHeat === "brulant" ? "🔥 Brulant" : profileHeat === "froid" ? "🧊 Froid" : "⚡ Tiede"}</p>
              <p className="mt-1 text-sm font-black">
                Niveau de confiance: {profileTrustLevel ? trustLevelLabel(profileTrustLevel) : "A definir"}
              </p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-white/70">Mes Qualifications</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(profileQualifier
                  ? [profileQualifier.opportunityChoice, ...profileQualifier.communityTags]
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
                <div className="rounded-xl bg-white/5 px-3 py-2">• Ajoute lors de &quot;{profileContact.capsule}&quot;</div>
                <div className="rounded-xl bg-white/5 px-3 py-2">
                  • Derniere action: {profileHistory[0] ? `${actionLabel(profileHistory[0].action)} ${profileHistory[0].sent ? "envoye" : "valide sans envoi"} a ${profileHistory[0].at}` : "Aucune action enregistree"}
                </div>
                {profileHistory.slice(0, 3).map((entry, idx) => (
                  <div key={`${entry.contactId}-timeline-${idx}`} className="rounded-xl bg-white/5 px-3 py-2">
                    • Pipeline: {actionLabel(entry.action)} • {outcomeLabel(entry.outcomeStatus)} • {entry.at}
                    {entry.followupDueAtMs && entry.followupDueAtMs <= Date.now() && entry.outcomeStatus === "pending" && entry.actionId && (
                      <button
                        type="button"
                        onClick={() => updateActionOutcome(entry, "replied")}
                        className="ml-2 rounded-lg border border-amber-300/40 bg-amber-300/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-amber-100"
                      >
                        Relance J+2 faite
                      </button>
                    )}
                  </div>
                ))}
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

      {showAlliancesPanel && showAllianceMessageModal && selectedAllianceProspect && (
        <div className="fixed inset-0 z-[74] flex items-center justify-center bg-black/75 px-3 py-6 backdrop-blur-md sm:px-4">
          <section className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-fuchsia-300/35 bg-gradient-to-br from-[#171B46] via-[#101A3D] to-[#1A1550] p-4 shadow-[0_0_50px_rgba(217,70,239,0.28)] sm:p-5">
            <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-fuchsia-300/25 blur-3xl animate-pulse" />
            <div className="pointer-events-none absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl animate-pulse" />
            <div className="relative">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.1em] text-fuchsia-100">Message WhatsApp</p>
                  <p className="mt-1 text-sm font-black text-white">{selectedAllianceProspect.full_name}</p>
                  <p className="text-[11px] text-cyan-100">{selectedAllianceProspect.metier} • {selectedAllianceProspect.city || "Ville inconnue"}</p>
                </div>
                <button
                  type="button"
                  onClick={closeAllianceMessageEditor}
                  className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs text-white/85"
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </div>
              <p className="mt-2 text-[11px] text-white/70">Tu peux relire et modifier le message avant ouverture de WhatsApp.</p>
              <textarea
                value={allianceMessageDraft}
                onChange={(event) => setAllianceMessageDraft(event.target.value)}
                rows={18}
                className="mt-3 h-[46vh] min-h-[300px] w-full resize-none rounded-2xl border border-white/20 bg-black/30 px-3 py-2 text-[13px] leading-relaxed text-white placeholder:text-white/45"
                placeholder="Ecris ton message..."
              />
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeAllianceMessageEditor}
                  className="h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-black uppercase tracking-[0.08em] text-white/80"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void sendAllianceMessageFromModal();
                  }}
                  disabled={isAllianceMessageSending || !String(allianceMessageDraft || "").trim()}
                  className="h-10 flex-1 rounded-xl border border-fuchsia-300/35 bg-fuchsia-300/20 px-3 text-[11px] font-black uppercase tracking-[0.08em] text-fuchsia-100 disabled:opacity-60"
                >
                  {isAllianceMessageSending ? "Preparation..." : "Ouvrir WhatsApp avec ce message"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {showTemplateModal && selectedAction && selectedAction !== "passer" && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center px-3 sm:px-4">
          <section className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0E1430] p-4">
            <div className="relative flex items-center justify-center">
              <p className="text-sm font-black tracking-[0.05em] text-cyan-200 text-center">
                {selectedAction === "qualifier" ? "Qualifiez ce contact" : `Message pour ${selectedActionFirstName}`}
              </p>
              <button
                type="button"
                  onClick={() => {
                    leaveScanTunnelToNeutral();
                  }}
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
                  <motion.button
                    key={`hero-gain-${livePotentialLabel}`}
                    type="button"
                    onClick={openGainPotentialHelp}
                    initial={{ scale: 0.9, opacity: 0.4 }}
                    animate={{ scale: [1, 1.04, 1], opacity: 1 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className={`rounded-xl border bg-gradient-to-r px-3 py-2 text-center shadow-[0_18px_36px_-22px_rgba(16,185,129,0.8)] ${gainTone(livePotentialLabel)}`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.12em]">💰 Gain potentiel</p>
                    <p className="mt-0.5 text-base font-black">🔥 {livePotentialLabel}</p>
                    {gainTooltipHintVisible && (
                      <p className="mt-1 text-[10px] font-semibold text-white/85">Touchez pour comprendre</p>
                    )}
                  </motion.button>
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
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.12em] text-white/65">
                    <span>Etape {qualifierStep}/3</span>
                    <span>{qualifierProgressPercent}%</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={`qualifier-step-${step}`}
                        className={`h-1.5 rounded-full ${step <= qualifierStep ? "bg-emerald-300" : "bg-white/15"}`}
                      />
                    ))}
                  </div>
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  {qualifierStep === 1 && (
                    <motion.div
                      key="qualifier-step-1"
                      initial={{ opacity: 0, x: qualifierDirection > 0 ? 36 : -36 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: qualifierDirection > 0 ? -36 : 36 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="rounded-2xl border border-white/15 bg-black/25 p-3"
                    >
                      <p className="text-[12px] font-black uppercase tracking-[0.12em] text-cyan-100">Etape 1 · Type d opportunite</p>
                      <p className="mt-1 text-[11px] text-white/70">Choisis 1 seule option.</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {qualifierOpportunityOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setOpportunityChoice(option.id);
                              setQualifierDirection(1);
                              setQualifierStep(2);
                            }}
                            className={`h-11 rounded-[22px] px-[14px] text-[14px] font-black ${
                              opportunityChoice === option.id
                                ? "bg-emerald-300 text-emerald-950 ring-2 ring-emerald-200/70"
                                : "bg-white/10 text-white/85"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {qualifierStep === 2 && (
                    <motion.div
                      key="qualifier-step-2"
                      initial={{ opacity: 0, x: qualifierDirection > 0 ? 36 : -36 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: qualifierDirection > 0 ? -36 : 36 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="rounded-2xl border border-white/15 bg-black/25 p-3"
                    >
                      <p className="text-[12px] font-black uppercase tracking-[0.12em] text-cyan-100">Etape 2 · Temperature du contact</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setQualifierHeat("froid");
                            setHasChosenHeat(true);
                            setQualifierDirection(1);
                            setCommunityTagPage(0);
                            setQualifierStep(3);
                          }}
                          className={`h-10 flex-1 rounded-full px-2 text-center text-[13px] font-black ${
                            qualifierHeat === "froid" ? "bg-cyan-300 text-[#13253D]" : "bg-white/10 text-white/80"
                          }`}
                        >
                          ❄️ Froid
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQualifierHeat("tiede");
                            setHasChosenHeat(true);
                            setQualifierDirection(1);
                            setCommunityTagPage(0);
                            setQualifierStep(3);
                          }}
                          className={`h-10 flex-1 rounded-full px-2 text-center text-[13px] font-black ${
                            qualifierHeat === "tiede" ? "bg-amber-300 text-[#2C230E]" : "bg-white/10 text-white/80"
                          }`}
                        >
                          ⚡ Tiede
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQualifierHeat("brulant");
                            setHasChosenHeat(true);
                            setQualifierDirection(1);
                            setCommunityTagPage(0);
                            setQualifierStep(3);
                          }}
                          className={`h-10 flex-1 rounded-full px-2 text-center text-[13px] font-black ${
                            qualifierHeat === "brulant" ? "bg-orange-400 text-[#321A0E]" : "bg-white/10 text-white/80"
                          }`}
                        >
                          🔥 Brulant
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setQualifierDirection(-1);
                          setQualifierStep(1);
                        }}
                        className="mt-3 h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-black uppercase tracking-[0.08em] text-white/85"
                      >
                        Retour etape 1
                      </button>
                    </motion.div>
                  )}
                  {qualifierStep === 3 && (
                    <motion.div
                      key="qualifier-step-3"
                      initial={{ opacity: 0, x: qualifierDirection > 0 ? 36 : -36 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: qualifierDirection > 0 ? -36 : 36 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="rounded-2xl border border-white/15 bg-black/25 p-3"
                    >
                      <p className="text-[12px] font-black uppercase tracking-[0.12em] text-cyan-100">Etape 3 · Tags comportementaux</p>
                      <p className="mt-1 text-[11px] text-white/70">Ajoute le contexte utile (multi-selection).</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {visibleCommunityOptions.map((option) => {
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
                              {active ? "✅ " : ""}
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                      {communityTagPageCount > 1 && (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setCommunityTagPage((prev) => Math.max(0, prev - 1))}
                            disabled={communityTagPage === 0}
                            className="h-8 rounded-lg border border-white/20 bg-white/10 px-3 text-[10px] font-black uppercase tracking-[0.08em] text-white/80 disabled:opacity-40"
                          >
                            Precedent
                          </button>
                          <p className="text-[10px] font-black uppercase tracking-[0.08em] text-white/70">
                            Tags {communityTagPage + 1}/{communityTagPageCount}
                          </p>
                          <button
                            type="button"
                            onClick={() => setCommunityTagPage((prev) => Math.min(communityTagPageCount - 1, prev + 1))}
                            disabled={communityTagPage >= communityTagPageCount - 1}
                            className="h-8 rounded-lg border border-white/20 bg-white/10 px-3 text-[10px] font-black uppercase tracking-[0.08em] text-white/80 disabled:opacity-40"
                          >
                            Suivant
                          </button>
                        </div>
                      )}
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={saveQualifierAndReturn}
                          disabled={!canSaveQualifier}
                          className="h-11 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-300 text-xs font-black uppercase tracking-wide text-[#11252C] disabled:opacity-35"
                        >
                          Enregistrer la fiche
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQualifierDirection(-1);
                            setQualifierStep(2);
                          }}
                          className="h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-black uppercase tracking-[0.08em] text-white/85"
                        >
                          Retour etape 2
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  🎯 Base sur le profil: {(scopedActionQualifier?.opportunityChoice && quickLabelMap[scopedActionQualifier.opportunityChoice]) || "❓ Inconnu"}
                </p>
                {buildPromptCompliments(scopedActionQualifier).length > 0 && (
                  <p className="mt-2 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-xs text-emerald-100">
                    Signaux automatiques: {buildPromptCompliments(scopedActionQualifier).join(" • ")}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={generateAIMessage}
                    disabled={isGeneratingMessage}
                    className="h-9 rounded-xl border border-cyan-300/40 bg-cyan-300/15 px-3 text-[11px] font-black uppercase tracking-[0.08em] text-cyan-100 disabled:opacity-50"
                  >
                    {isGeneratingMessage ? "Generation..." : "Generer message IA"}
                  </button>
                  {aiGenerationSource && (
                    <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/85">
                      Source: {aiGenerationSource === "ai" ? "IA" : "Fallback"}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowMessagePersonalizationField((prev) => !prev)}
                  className="mt-2 h-9 rounded-xl border border-white/20 bg-white/10 px-3 text-[11px] font-black uppercase tracking-[0.08em] text-white/85"
                >
                  Personnaliser le message (optionnel)
                </button>
                {showMessagePersonalizationField && (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={messagePersonalizationNote}
                      onChange={(event) => setMessagePersonalizationNote(event.target.value)}
                      placeholder="Ex: elle cherche un coach pour la rentree"
                      className="min-h-20 w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const note = String(messagePersonalizationNote || "").trim();
                        if (!note) return;
                        if (draftMessage.includes(note)) return;
                        setDraftMessage((prev) => `${String(prev || "").trim()}\n\nDetail a mentionner: ${note}`.trim());
                        setMessagePersonalizationNote("");
                        setIsEditingMessageDraft(true);
                      }}
                      className="h-9 rounded-xl border border-violet-300/35 bg-violet-300/15 px-3 text-[11px] font-black uppercase tracking-[0.08em] text-violet-100"
                    >
                      Ajouter ce detail au message
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={saveCurrentMessageAsDefault}
                  className="mt-2 h-9 rounded-xl border border-emerald-300/40 bg-emerald-300/15 px-3 text-[11px] font-black uppercase tracking-[0.08em] text-emerald-100"
                >
                  Enregistrer comme message par defaut
                </button>
                <div className="mt-3 rounded-2xl border border-white/15 bg-black/25 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-white/70">Apercu du message</p>
                    <button
                      type="button"
                      onClick={() => setIsEditingMessageDraft((prev) => !prev)}
                      className="h-8 rounded-lg border border-cyan-300/35 bg-cyan-300/15 px-3 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100"
                    >
                      {isEditingMessageDraft ? "Voir apercu" : "Modifier"}
                    </button>
                  </div>
                  {isEditingMessageDraft ? (
                    <textarea
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      className="min-h-[140px] w-full rounded-xl border border-white/20 bg-black/35 px-3 py-3 text-[15px] leading-relaxed text-white"
                    />
                  ) : (
                    <div className="min-h-[140px] max-h-[220px] overflow-y-auto rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-[15px] leading-relaxed text-white/95 whitespace-pre-wrap">
                      {draftMessage}
                    </div>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const action = selectedAction;
                    if (!action) return;
                    const payload = createTransitionPayload(action, "saved", 0);
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
                      actionContact: scopedActionContact,
                    });
                    setActionFromProfileContactId(null);
                  }}
                  className="h-11 rounded-xl border border-white/40 bg-transparent px-5 text-[11px] font-black uppercase tracking-wide text-white/90"
                >
                  Enregistrer sans envoyer
                </button>
                <button
                  type="button"
                  onClick={sendOnWhatsApp}
                  className="h-11 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-300 px-6 text-xs font-black uppercase tracking-wide text-[#11252C]"
                >
                  Envoyer sur WhatsApp
                </button>
                </div>
                {modalErrorMessage && (
                  <p className="mt-2 rounded-xl border border-rose-300/35 bg-rose-300/15 px-3 py-2 text-xs text-rose-100">
                    {modalErrorMessage}
                  </p>
                )}
                {modalInfoMessage && (
                  <p className="mt-2 rounded-xl border border-emerald-300/35 bg-emerald-300/15 px-3 py-2 text-xs text-emerald-100">
                    {modalInfoMessage}
                  </p>
                )}
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
              Intelligence partagee: la Mini-Agence sait maintenant que c est un profil &quot;{qualificationPivot.tag}&quot;.
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

      {showPotentialBreakdownSheet && (
        <div className="fixed inset-0 z-[56] bg-black/55 backdrop-blur-sm flex items-center justify-center px-3 py-6">
          <section className="w-full max-w-md rounded-3xl border border-emerald-300/30 bg-[#0E1430] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-emerald-100">Potentiel du jour</p>
              <button
                type="button"
                onClick={() => setShowPotentialBreakdownSheet(false)}
                className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-white/85">
              Estimation: {dailyQueueCount} contacts x ~{dailyPotentialAverage}€ de commission moyenne.
            </p>
            <p className="mt-1 text-xs text-white/70">
              Potentiel restant aujourd hui: ~{latentPotential}€. Cette valeur se met a jour avec ta progression.
            </p>
          </section>
        </div>
      )}

      {showGainPotentialSheet && (
        <div className="fixed inset-0 z-[56] bg-black/55 backdrop-blur-sm flex items-center justify-center px-3 py-6">
          <section className="w-full max-w-md rounded-3xl border border-amber-300/35 bg-[#0E1430] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-amber-100">Gain potentiel 🔥</p>
              <button
                type="button"
                onClick={() => setShowGainPotentialSheet(false)}
                className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-white/85">
              Le niveau est calcule via le type d opportunite + les tags comportementaux que tu selectionnes.
            </p>
            <p className="mt-1 text-xs text-white/70">
              Plus le signal est fort (client ideal, recommandation fiable, etc.), plus le gain estime monte.
            </p>
          </section>
        </div>
      )}

      {showAllianceMetricsInfo && (
        <div className="fixed inset-0 z-[56] bg-black/55 backdrop-blur-sm flex items-center justify-center px-3 py-6">
          <section className="w-full max-w-md rounded-3xl border border-cyan-300/35 bg-[#0E1430] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-cyan-100">Score et probabilite</p>
              <button
                type="button"
                onClick={() => setShowAllianceMetricsInfo(false)}
                className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-white/85">
              Le score mesure l adequation du profil avec ton besoin.
            </p>
            <p className="mt-1 text-sm text-white/85">
              La probabilite estime ses chances de repondre.
            </p>
          </section>
        </div>
      )}

      {showBoostInfo && (
        <div className="fixed inset-0 z-[56] bg-black/55 backdrop-blur-sm flex items-center justify-center px-3 py-6">
          <section className="w-full max-w-md rounded-3xl border border-amber-300/35 bg-[#0E1430] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-amber-100">BOOST Premium</p>
              <button
                type="button"
                onClick={() => setShowBoostInfo(false)}
                className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-white/85">
              Le Boost propulse ton profil en tete des resultats des autres membres Popey.
            </p>
          </section>
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
            {transitionScreen.manual && transitionAwaitingConfirm && (
              <button
                type="button"
                onClick={() => {
                  setShowProgressCheck(true);
                  setTimeout(() => setShowProgressCheck(false), 650);
                  finalizeAction(transitionAwaitingConfirm.action, 300, {
                    countAsSent: transitionAwaitingConfirm.countAsSent,
                    sentInHistory: transitionAwaitingConfirm.sentInHistory,
                    stayOnCurrentContact: transitionAwaitingConfirm.stayOnCurrentContact,
                    returnToProfileContactId: transitionAwaitingConfirm.returnToProfileContactId,
                      actionContact:
                        allContactsData.find((contact) => contact.id === transitionAwaitingConfirm.actionContactId) || current,
                  });
                  setTransitionScreen(null);
                  setTransitionAwaitingConfirm(null);
                  setActionFromProfileContactId(null);
                }}
                className="mt-3 h-11 w-full rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 text-xs font-black uppercase tracking-wide text-[#11252C]"
              >
                {transitionScreen.ctaLabel ?? "Passez au prochain profil"}
              </button>
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
      <input
        ref={contactImportInputRef}
        type="file"
        accept=".vcf,.csv,text/vcard,text/csv"
        className="hidden"
        onChange={(event) => {
          void handleContactImportChange(event);
        }}
      />
      {onboardingJ0Overlay}
    </main>
  );
}
