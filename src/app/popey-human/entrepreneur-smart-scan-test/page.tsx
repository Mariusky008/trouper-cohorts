"use client";

import { motion } from "framer-motion";
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
  action_type: Exclude<DailyCategory, "qualifier">;
  status: "drafted" | "sent" | "validated_without_send";
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
};
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
};

const PENDING_WHATSAPP_CONTEXT_KEY = "popey-human:smart-scan:pending-whatsapp-context";
const SMART_SCAN_SESSION_KEY = "popey-human:smart-scan:scan-session";
const SMART_SCAN_IMPORTED_CONTACTS_KEY = "popey-human:smart-scan:imported-contacts";
const SMART_SCAN_ECLAIREURS_KEY = "popey-human:smart-scan:eclaireurs";
const SMART_SCAN_DEFAULT_MESSAGES_KEY = "popey-human:smart-scan:default-messages";
const DAILY_CONTACT_LIMIT = 10;

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
  const compliments = buildPromptCompliments(qualifier);
  const complimentsLine =
    compliments.length > 0
      ? `J apprecie vraiment ${compliments.join(" et ")}. `
      : "J aime notre facon de travailler ensemble. ";

  if (action === "eclaireur") {
    const { metier1, metier2 } = resolveAllianceMetiers(ownerProfile);
    const secteur = String(ownerProfile?.ville || contact.city || "ton secteur").trim() || "ton secteur";
    const rewardLine = resolveEclaireurRewardSentence(ownerProfile);
    return `Salut ${firstName}, je te contacte car je viens de structurer une alliance strategique avec deux partenaires (un ${metier1} et un ${metier2}).

On a decide de mettre en place un systeme d antennes locales pour nous remonter des opportunites de terrain. J ai tout de suite pense a toi car tu as le profil ideal pour etre notre Eclaireur sur ${secteur}.

Le deal est simple : tu nous identifies un besoin, on gere 100% du dossier avec notre expertise, ${rewardLine} Ca peut vite representer un complement de revenu tres serieux a la fin du mois sans que tu n aies a travailler sur les dossiers.

Est-ce que tu serais ouvert a ce qu on teste ca sur un premier cas ?`;
  }
  if (action === "package") {
    return `Salut ${firstName}, ${complimentsLine}J ai une opportunite pour notre Trio (immo + courtage + partenaire terrain). Je peux te mettre en relation immediate pour ouvrir le dossier dans de bonnes conditions. Tu veux que je lance la mise en relation maintenant ?`;
  }
  if (action === "exclients") {
    return `Hello ${firstName}, ${complimentsLine}Je prends des nouvelles car j ai vu des mouvements qui peuvent te concerner. Si tu veux, je te fais un point rapide et utile pour voir s il y a une opportunite a activer ensemble.`;
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

function getLocalDayNumber() {
  const now = new Date();
  const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor(localMidnight.getTime() / (24 * 60 * 60 * 1000));
}

function buildDailyQueueFromImportedContacts(allContacts: DailyContact[], limit: number, dayNumber: number) {
  if (allContacts.length <= limit) return allContacts;
  const safeLimit = Math.max(1, limit);
  const start = ((dayNumber * safeLimit) % allContacts.length + allContacts.length) % allContacts.length;
  const queue: DailyContact[] = [];
  for (let i = 0; i < safeLimit; i += 1) {
    const contact = allContacts[(start + i) % allContacts.length];
    if (contact) queue.push(contact);
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
  const [qualifierStep, setQualifierStep] = useState<1 | 2 | 3 | 4>(1);
  const [opportunityChoice, setOpportunityChoice] = useState<(typeof OPPORTUNITY_OPTIONS)[number]["id"] | null>(null);
  const [communityTags, setCommunityTags] = useState<Array<(typeof COMMUNITY_OPTIONS)[number]["id"]>>([]);
  const opportunitySectionRef = useRef<HTMLDivElement | null>(null);
  const temperatureSectionRef = useRef<HTMLDivElement | null>(null);
  const communitySectionRef = useRef<HTMLDivElement | null>(null);
  const saveSectionRef = useRef<HTMLDivElement | null>(null);
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
  const [qualifierStore, setQualifierStore] = useState<Record<string, QualifierData>>({});
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [openAlertContactIds, setOpenAlertContactIds] = useState<string[]>([]);
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
  const [eclaireurDirectory, setEclaireurDirectory] = useState<Record<string, { id: string; name: string; city: string }>>({});
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
  const [eclaireurLinksByContactId, setEclaireurLinksByContactId] = useState<Record<string, SmartScanEclaireurLink>>({});
  const [loadingEclaireurLinkContactId, setLoadingEclaireurLinkContactId] = useState<string | null>(null);
  const [copyingEclaireurLinkContactId, setCopyingEclaireurLinkContactId] = useState<string | null>(null);
  const [incomingReferrals, setIncomingReferrals] = useState<SmartScanIncomingReferral[]>([]);
  const [isIncomingReferralsLoading, setIsIncomingReferralsLoading] = useState(false);
  const [selectedIncomingReferralId, setSelectedIncomingReferralId] = useState<string | null>(null);
  const [incomingSignedAmount, setIncomingSignedAmount] = useState("");
  const [isIncomingReferralStatusUpdating, setIsIncomingReferralStatusUpdating] = useState(false);
  const contactImportInputRef = useRef<HTMLInputElement | null>(null);
  const localDayNumber = useMemo(() => getLocalDayNumber(), []);

  const hasImportedContacts = importedContacts.length > 0;
  const importedTotalCount = importedContacts.length;
  const dailyQueueCount = hasImportedContacts ? Math.min(DAILY_CONTACT_LIMIT, importedTotalCount) : DAILY_CONTACT_LIMIT;
  const allContactsData = hasImportedContacts ? importedContacts : CONTACTS;
  const contactsData = hasImportedContacts
    ? buildDailyQueueFromImportedContacts(importedContacts, dailyQueueCount, localDayNumber)
    : CONTACTS;
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
  const done = Math.min(index, contactsData.length);
  const heatScore = Math.min(99, 55 + current.communityKnownBy * 10 + (current.externalNews ? 8 : 0));
  const sourceRing =
    current.communityKnownBy >= 3
      ? "from-emerald-300 via-cyan-300 to-indigo-300"
      : current.communityKnownBy === 2
        ? "from-cyan-300 via-indigo-300 to-fuchsia-300"
        : "from-amber-300 via-orange-300 to-fuchsia-300";
  const currentQualifier = qualifierStore[current.id];
  const isQualified = Boolean(currentQualifier);
  const actionEngine = useMemo(() => getDynamicActionEngine(currentQualifier), [currentQualifier]);
  const actionButtons = actionEngine.order.map((action) => ({
    action,
    ...actionEngine.byAction[action],
    isPriority: actionEngine.priorityAction === action,
  }));
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
        return { id: fromAllContacts.id, name: fromAllContacts.name, city: fromAllContacts.city };
      }
      return eclaireurDirectory[id] || null;
    })
    .filter((contact): contact is { id: string; name: string; city: string } => Boolean(contact))
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
  const template = useMemo(
    () =>
      selectedAction
        ? buildTemplate(selectedAction, current, currentQualifier, myProfile)
        : "Choisis une action pour voir le template pre-rempli.",
    [selectedAction, current, currentQualifier, myProfile],
  );
  const promptContextPreview = buildPromptCompliments(currentQualifier);
  const liveEstimatedGain = getEstimatedGain(opportunityChoice, communityTags);
  const livePotentialLabel = opportunityChoice || communityTags.length > 0 ? liveEstimatedGain : "?";
  const canSaveQualifier = hasChosenHeat && opportunityChoice !== null && communityTags.length > 0;
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
  const staleIdealHotLead = useMemo(() => {
    const alertContactId = openAlertContactIds[0];
    if (alertContactId) {
      const fromAlert = allContactsData.find((item) => item.id === alertContactId);
      if (fromAlert) {
        return { ...fromAlert, qualifier: qualifierStore[alertContactId] };
      }
    }

    const nowMs = Date.now();
    for (const [contactId, qualifier] of Object.entries(qualifierStore)) {
      if (!qualifier) continue;
      if (qualifier.heat !== "brulant" || qualifier.opportunityChoice !== "ideal-client") continue;
      if (nowMs - qualifier.qualifiedAtMs < REMINDER_WINDOW_MS) continue;
      const hasPackageInTime = historyEntries.some(
        (entry) => entry.contactId === contactId && entry.action === "package" && entry.atMs >= qualifier.qualifiedAtMs,
      );
      if (hasPackageInTime) continue;
      const contact = allContactsData.find((item) => item.id === contactId);
      if (!contact) continue;
      return { ...contact, qualifier };
    }
    return null;
  }, [qualifierStore, historyEntries, openAlertContactIds, allContactsData]);
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
  const dailyGoal = dailyQueueCount;
  const opportunitiesActivated = Math.min(dailyGoal, sentCount);
  const remainingForGoal = Math.max(0, dailyGoal - opportunitiesActivated);
  const missionProgress = Math.round((opportunitiesActivated / dailyGoal) * 100);
  const latentPotential =
    dailyTargetPotential > 0
      ? Math.max(0, Math.round(dailyTargetPotential * (remainingForGoal / dailyGoal)))
      : remainingForGoal * 75;
  const todayStartMs = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }, []);
  const sentTodayCount = historyEntries.filter((entry) => entry.sent && entry.atMs >= todayStartMs).length;
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
    let cancelled = false;

    async function bootstrapSmartScan() {
      try {
        await refreshSmartScanSnapshot();
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
    if (!showMyProfilePanel) return;
    setIsEditingProfile(false);
    void loadMyProfile();
  }, [showMyProfilePanel]);

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
    if (stage !== "daily") return;
    if (!isBootstrapped) return;
    if (showTemplateModal) return;
    if (Date.now() < qualifierAutoOpenPausedUntilMs) return;
    if (dismissedQualifierContactId === current.id) return;
    if (qualifierStore[current.id]) return;
    setSelectedAction("qualifier");
    setQualifierHeat(null);
    setHasChosenHeat(false);
    setQualifierStep(1);
    setOpportunityChoice(null);
    setCommunityTags([]);
    setShowTemplateModal(true);
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
        contactName: current.name,
        actionType: selectedAction,
        trustLevel: trustLevelStore[current.id] || null,
        opportunityChoice: currentQualifier?.opportunityChoice || null,
        communityTags: currentQualifier?.communityTags || [],
        city: current.city,
        companyHint: current.companyHint,
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

  function scrollIntoViewSmooth(ref: React.RefObject<HTMLDivElement | null>) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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

  function resolveMessageDraft(action: ActivationAction, fallbackDraft: string) {
    const savedDraft = defaultMessageStore[action];
    if (typeof savedDraft === "string" && savedDraft.trim().length > 0) {
      return savedDraft;
    }
    return fallbackDraft;
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
    eventType: "contact_opened" | "trust_level_set" | "whatsapp_sent" | "daily_goal_progressed",
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
        const externalRef = dbToExternalRef.get(entry.contact_id);
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
          followupDueAtMs: Number.isFinite(followupDueMs) ? followupDueMs : null,
          outcomeStatus: entry.outcome_status || null,
        };
      })
      .filter(Boolean) as HistoryEntry[];

    const dbAlertContactIds = (payload.alerts || [])
      .filter((alert) => alert.alert_type === "hot_ideal_unshared_24h" && alert.status === "open")
      .map((alert) => alert.contact_id)
      .filter(Boolean) as string[];
    const alertContactIds = dbAlertContactIds
      .map((dbContactId) => dbToExternalRef.get(dbContactId))
      .filter(Boolean) as string[];
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
      setImportedContacts(hydratedContacts);
    }
    setOpenAlertContactIds(alertContactIds);
    setDueFollowups(nextDueFollowups);
    setConversionMetrics(payload.metrics || null);
    setFollowupOpsStats(payload.followupOps || null);
    setExternalClickStats(payload.externalClicks || null);
    const nextEclaireurStatsStore: Record<string, { leadsDetected: number; leadsSigned: number; commissionTotalEur: number; lastNewsAtMs: number }> = {};
    const nextEclaireurDirectory: Record<string, { id: string; name: string; city: string }> = {};
    (payload.eclaireurs || []).forEach((row) => {
      const externalRef = String(row.external_contact_ref || row.id || "").trim();
      if (!externalRef) return;
      const lastNewsSource = row.last_whatsapp_sent_at || row.updated_at || row.eclaireur_activated_at || "";
      const lastNewsMs = Date.parse(lastNewsSource);
      nextEclaireurDirectory[externalRef] = {
        id: externalRef,
        name: row.full_name || externalRef,
        city: row.city || "Inconnue",
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

  function createTransitionPayload(action: Exclude<DailyCategory, "qualifier">, mode: "sent" | "saved" = "sent") {
    const nextStep = Math.min(dailyQueueCount, done + 1);
    const encouragements =
      mode === "sent"
        ? [`Felicitations ${current.name.split(" ")[0]} a ete active.`]
        : [
            `Aucun message envoye a ${current.name.split(" ")[0]}. Fiche memorisee. 🗂️`,
            `Valide sans envoi: ${current.name.split(" ")[0]} est ajoute a ton historique.`,
            `${actionLabel(action)} prepare sans envoi. Tu pourras relancer au bon moment.`,
          ];
    const message =
      nextStep >= dailyQueueCount
        ? `Session terminee ! Tu as reveille ${dailyQueueCount} contacts aujourd hui.`
        : encouragements[Math.floor(Math.random() * encouragements.length)];
    return {
      message,
      icon: nextStep >= dailyQueueCount ? "🎆" : "✅",
      from: done,
      to: nextStep,
      final: nextStep >= dailyQueueCount,
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
    options: { countAsSent?: boolean; sentInHistory?: boolean; stayOnCurrentContact?: boolean; returnToProfileContactId?: string | null } = {},
  ) {
    setSelectedAction(action);
    const actionContact = current;
    const actionQualifier = qualifierStore[actionContact.id];
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
      const nowMs = Date.now();
      const summaryOpportunity = actionQualifier?.opportunityChoice ? quickLabelMap[actionQualifier.opportunityChoice] : "";
      const summaryCommunity = (actionQualifier?.communityTags ?? []).map((id) => quickLabelMap[id]).slice(0, 1);
      setHistoryEntries((prev) => [
        {
          actionId: undefined,
          contactId: actionContact.id,
          name: actionContact.name,
          action,
          at: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
          atMs: nowMs,
          tagsSummary: [summaryOpportunity, ...summaryCommunity]
            .filter(Boolean)
            .join(" • "),
          sent: sentInHistory,
          followupDueAtMs: sentInHistory ? nowMs + 48 * 60 * 60 * 1000 : null,
          outcomeStatus: sentInHistory ? ("pending" as const) : null,
        },
        ...prev,
      ].slice(0, 50));
      const persistedStatus = sentInHistory ? "sent" : "validated_without_send";
      const clientEventId = `${actionContact.id}:${action}:${nowMs}`;
      void postSmartScan("action", {
        externalContactRef: actionContact.id,
        fullName: actionContact.name,
        city: actionContact.city,
        companyHint: actionContact.companyHint,
        actionType: action,
        messageDraft: draftMessage || null,
        sendChannel: sentInHistory ? "whatsapp" : "other",
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
        setIndex((v) => Math.min(Math.max(0, contactsData.length - 1), v + 1));
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
      // Daily-card action: clear any stale profile-origin context.
      setActionFromProfileContactId(null);
      setLaunchingAction(action);
      setTimeout(() => {
        setLaunchingAction(null);
        const fallbackDraft = buildTemplate(action, current, currentQualifier, myProfile);
        const nextDraft = resolveMessageDraft(action, fallbackDraft);
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
    const nextDraft = buildTemplate(action, current, currentQualifier, myProfile);
    setSelectedAction(action);
    if (action === "qualifier") {
      setQualifierHeat(null);
      setHasChosenHeat(false);
      setQualifierStep(1);
      setOpportunityChoice(null);
      setCommunityTags([]);
      setDraftMessage("");
    } else {
      setDraftMessage(nextDraft);
      setAiGenerationSource(null);
      setAiPromptVersion(null);
      setAiGeneratedAt(null);
    }
    setShowTemplateModal(true);
  }

  async function sendOnWhatsApp() {
    const cleanPhone = normalizePhoneForWhatsApp(current.phone);
    const action = selectedAction;
    if (!action || action === "qualifier") return;
    if (!cleanPhone) {
      setModalErrorMessage("Contact WhatsApp manquant. Reimporte ton fichier pour inclure les numeros (format international conseille).");
      return;
    }
    setModalErrorMessage("");
    const payload = createTransitionPayload(action);
    const profileOriginContactId = actionFromProfileContactId === current.id ? actionFromProfileContactId : null;
    const awaitingConfirm: TransitionAwaitingConfirmState = {
      action,
      countAsSent: true,
      sentInHistory: true,
      stayOnCurrentContact: Boolean(profileOriginContactId),
      returnToProfileContactId: profileOriginContactId,
    };
    let whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(draftMessage)}`;

    try {
      const prepared = (await postSmartScan("prepare-whatsapp-payload", {
        externalContactRef: current.id,
        fullName: current.name,
        city: current.city,
        companyHint: current.companyHint,
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
      contactId: current.id,
      createdAt: Date.now(),
    };
    savePendingWhatsAppContext(pendingContext);
    setPendingTransition(payload);
    setPendingFinalizeAction(action);
    setPendingReturnProfileContactId(profileOriginContactId);
    if (typeof window !== "undefined") {
      window.open(whatsappUrl, "_blank");
    }
    if (eclaireurIds.includes(current.id)) {
      setEclaireurStatsStore((prev) => {
        const existing = prev[current.id] || {
          leadsDetected: 0,
          leadsSigned: 0,
          commissionTotalEur: 0,
          lastNewsAtMs: 0,
        };
        return {
          ...prev,
          [current.id]: {
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
    setDefaultMessageStore((prev) => ({
      ...prev,
      [action]: cleanDraft,
    }));
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
    if (qualifierStep >= 3 && canSaveQualifier) {
      scrollIntoViewSmooth(saveSectionRef);
    }
  }, [qualifierStep, canSaveQualifier]);

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
      setApiErrorMessage(`Statut mis a jour: ${referralStatusLabel(targetStatus)}.`);
      setTimeout(() => setApiErrorMessage(""), 1800);
      const refreshed = await fetch("/api/popey-human/smart-scan/scout-referrals", { method: "GET", cache: "no-store" });
      if (refreshed.ok) {
        const data = (await refreshed.json().catch(() => ({}))) as { referrals?: SmartScanIncomingReferral[] };
        setIncomingReferrals(data.referrals || []);
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
      metier: myProfile?.metier || null,
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

  function startActionFromProfile(action: Exclude<DailyCategory, "passer" | "qualifier">) {
    if (!profileContact) return;
    const nextIndex = contactsData.findIndex((contact) => contact.id === profileContact.id);
    if (nextIndex >= 0) setIndex(nextIndex);
    setActionFromProfileContactId(profileContact.id);
    setShowContactProfile(false);
    setShowSearchPanel(false);
    const fallbackDraft = buildTemplate(action, profileContact, profileQualifier, myProfile);
    const nextDraft = resolveMessageDraft(action, fallbackDraft);
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

  function handleDockAction(tab: "search" | "scan" | "eclaireurs" | "profile") {
    setShowSearchPanel(false);
    setShowHistoryPanel(false);
    setShowEclaireursPanel(false);
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
    setHasHydratedServerProgress(true);
    setApiErrorMessage("");
    void postSmartScan("import-contacts", {
      source: "file",
      contacts: nextContacts.map((contact, idx) => ({
        externalContactRef: contact.id,
        fullName: contact.name,
        city: contact.city || null,
        companyHint: contact.companyHint || null,
        phoneE164: normalizePhoneForWhatsApp(contact.phone) || contact.phone || null,
        importIndex: idx,
      })),
    })
      .then(() =>
        postSmartScan("session-progress", {
          queueIndex: 0,
          queueSize: dailyQueueCount,
          importedTotal: nextContacts.length,
        }),
      )
      .catch(() => null);
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
      setHasHydratedServerProgress(true);
      setApiErrorMessage("");
      void postSmartScan("import-contacts", {
        source: "direct-picker",
        contacts: nextContacts.map((contact, idx) => ({
          externalContactRef: contact.id,
          fullName: contact.name,
          city: contact.city || null,
          companyHint: contact.companyHint || null,
          phoneE164: normalizePhoneForWhatsApp(contact.phone) || contact.phone || null,
          importIndex: idx,
        })),
      })
        .then(() =>
          postSmartScan("session-progress", {
            queueIndex: 0,
            queueSize: dailyQueueCount,
            importedTotal: nextContacts.length,
          }),
        )
        .catch(() => null);
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
    setHasHydratedServerProgress(true);
    setEclaireurIds([]);
    setEclaireurDirectory({});
    setEclaireurStatsStore({});
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SMART_SCAN_IMPORTED_CONTACTS_KEY);
      window.localStorage.removeItem(SMART_SCAN_SESSION_KEY);
      window.localStorage.removeItem(SMART_SCAN_ECLAIREURS_KEY);
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
    });
  }

  async function loadMyProfile() {
    try {
      setIsProfileLoading(true);
      const [profileResponse, linkResponse] = await Promise.all([
        fetch("/api/popey-human/smart-scan/profile", { cache: "no-store" }),
        fetch("/api/popey-human/smart-scan/self-scout-link", { cache: "no-store" }),
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
      const message = error instanceof Error ? error.message : "Impossible de charger le profil.";
      setApiErrorMessage(message);
    } finally {
      setIsProfileLoading(false);
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
              { id: "eclaireurs", icon: "📡", label: "Eclaireurs" },
              { id: "profile", icon: "👤", label: "Profil" },
            ] as const).map((item) => {
              const isActive = item.id === "scan";
              return (
                <button
                  key={`scan-dock-${item.id}`}
                  type="button"
                  onClick={() => handleDockAction(item.id as "search" | "scan" | "eclaireurs" | "profile")}
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
              <p className="rounded-full border border-emerald-300/35 bg-emerald-300/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-emerald-100">
                Potentiel du jour : ~{latentPotential}€
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsCockpitCollapsed((value) => !value)}
                className="h-8 rounded-full border border-white/20 bg-white/10 px-3 text-[10px] font-black uppercase tracking-[0.08em] text-white/85"
              >
                {isCockpitCollapsed ? "Deplier cockpit" : "Replier cockpit"}
              </button>
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
            {staleIdealHotLead && (
              <div className="mt-3 rounded-2xl border border-orange-300/35 bg-orange-300/15 px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-orange-100">COO Alert • 24h</p>
                <p className="mt-1 text-sm text-white/90">
                  Attention, {staleIdealHotLead.name} est un client ideal brulant sans Partage Croise sous 24h.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const nextIndex = contactsData.findIndex((contact) => contact.id === staleIdealHotLead.id);
                    if (nextIndex >= 0) setIndex(nextIndex);
                    setActionGlowContactId(staleIdealHotLead.id);
                    setTimeout(() => setActionGlowContactId((id) => (id === staleIdealHotLead.id ? null : id)), 2200);
                  }}
                  className="mt-2 h-9 rounded-xl bg-gradient-to-r from-violet-300 to-fuchsia-300 px-3 text-[11px] font-black uppercase tracking-wide text-[#271234]"
                >
                  Activer maintenant
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
                  const shouldPulse = isQualified && (actionGlowContactId === current.id || button.isPriority);
                  return (
                    <button
                      key={button.action}
                      type="button"
                      onClick={() => triggerAction(button.action)}
                      disabled={!isQualified}
                      className={`relative overflow-hidden h-20 rounded-2xl border ${theme.buttonClass} ${
                        shouldPulse ? theme.idlePulseClass : ""
                      } ${launching ? theme.launchRingClass : ""} ${button.isPriority ? "ring-1 ring-white/30" : ""}`}
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
                      <span className={`block text-base font-black uppercase tracking-wide ${theme.titleClass}`}>{button.title}</span>
                      <span className={`mt-0.5 block text-[11px] font-semibold ${theme.subtitleClass}`}>{button.subtitle}</span>
                    </button>
                  );
                })}
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
              {!isQualified && (
                <button
                  type="button"
                  onClick={() => triggerAction("qualifier")}
                  className="mt-2 h-10 w-full rounded-xl border border-emerald-300/45 bg-emerald-300/15 text-[11px] font-black uppercase tracking-[0.08em] text-emerald-100"
                >
                  Qualifier ce contact maintenant
                </button>
              )}
              {softLearningHint && (
                <p className="mt-2 rounded-xl bg-white/10 px-3 py-2 text-xs text-cyan-100">{softLearningHint}</p>
              )}
            </motion.article>

            <p className="mt-2 text-xs text-white/70">Mode tunnel: une carte, une decision, action immediate.</p>
          </section>

              {done >= dailyQueueCount && (
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
            { id: "eclaireurs", icon: "📡", label: "Eclaireurs" },
            { id: "profile", icon: "👤", label: "Profil" },
          ] as const).map((item) => {
            const isActive =
              (item.id === "search" && showSearchPanel) ||
              (item.id === "eclaireurs" && showEclaireursPanel) ||
              (item.id === "profile" && showMyProfilePanel) ||
              (item.id === "scan" && !showSearchPanel && !showHistoryPanel && !showMyProfilePanel);

            return (
              <button
                key={`daily-dock-${item.id}`}
                type="button"
                onClick={() => handleDockAction(item.id as "search" | "scan" | "eclaireurs" | "profile")}
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
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <select
                    value={historyStatusFilter}
                    onChange={(event) => setHistoryStatusFilter(event.target.value as "all" | "sent" | "validated")}
                    className="h-9 rounded-lg border border-white/15 bg-black/25 px-2 text-[11px]"
                  >
                    <option value="all">Statut: Tous</option>
                    <option value="sent">Statut: Envoye</option>
                    <option value="validated">Statut: Valide</option>
                  </select>
                  <select
                    value={historyActionFilter}
                    onChange={(event) => setHistoryActionFilter(event.target.value as "all" | Exclude<DailyCategory, "qualifier">)}
                    className="h-9 rounded-lg border border-white/15 bg-black/25 px-2 text-[11px]"
                  >
                    <option value="all">Action: Toutes</option>
                    <option value="eclaireur">Eclaireur</option>
                    <option value="package">Partage Croise</option>
                    <option value="exclients">Ex-Clients</option>
                    <option value="passer">Passer</option>
                  </select>
                  <select
                    value={historyPeriodFilter}
                    onChange={(event) => setHistoryPeriodFilter(event.target.value as "all" | "today" | "7d")}
                    className="h-9 rounded-lg border border-white/15 bg-black/25 px-2 text-[11px]"
                  >
                    <option value="all">Periode: Tout</option>
                    <option value="today">Periode: Aujourd hui</option>
                    <option value="7d">Periode: 7 jours</option>
                  </select>
                </div>
                <p className="mt-2 text-[11px] text-white/65">{filteredHistoryEntries.length} element(s) apres filtres</p>
                <div className="mt-3 max-h-[calc(100dvh-350px)] space-y-2 overflow-y-auto sm:max-h-[60vh]">
                  {filteredHistoryEntries.length === 0 && <p className="text-sm text-white/70">Aucune action pour ces filtres.</p>}
                  {filteredHistoryEntries.map((entry, idx) => {
                    const eligibleToPromote = entry.sent && entry.action === "eclaireur" && !eclaireurIds.includes(entry.contactId);
                    return (
                      <div key={`${entry.contactId}-${entry.at}-${idx}`} className="rounded-xl border border-white/15 bg-black/25 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nextIndex = allContactsData.findIndex((contact) => contact.id === entry.contactId);
                            if (nextIndex >= 0) setIndex(nextIndex);
                            openContactProfileWithTrustGuard(entry.contactId);
                          }}
                          className="w-full text-left"
                        >
                          <p className="text-sm font-black">{entry.name}</p>
                          <p className="text-xs text-white/70">
                            {entry.sent ? "Envoye" : "Valide sans envoi"} • {actionLabel(entry.action)} • {outcomeLabel(entry.outcomeStatus)} • {entry.at}
                            {entry.tagsSummary ? ` • ${entry.tagsSummary}` : ""}
                          </p>
                        </button>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          {eclaireurIds.includes(entry.contactId) ? (
                            <span className="inline-flex rounded-full border border-emerald-300/35 bg-emerald-300/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-100">
                              📡 Eclaireur actif
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/60">Prospect</span>
                          )}
                          {eligibleToPromote && (
                            <button
                              type="button"
                              onClick={() => promoteToEclaireur(entry.contactId)}
                              className="rounded-lg border border-emerald-300/45 bg-emerald-300/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-100"
                            >
                              ⭐ Promouvoir en Eclaireur
                            </button>
                          )}
                        </div>
                      </div>
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
            className="h-[calc(100dvh-92px)] max-h-[calc(100dvh-92px)] w-full overflow-y-auto rounded-none border-0 bg-[#0E1430] p-4 pb-28 sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-3xl sm:border sm:border-white/15"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
          >
            <div className="sticky top-0 z-20 -mx-4 bg-[#0E1430] px-4 pb-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Mes Eclaireurs</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowEclaireursPanel(false);
                    setSelectedIncomingReferralId(null);
                    setSelectedEclaireurTemplateContactId(null);
                    setEclaireurTemplates([]);
                  }}
                  className="relative z-30 h-9 w-9 rounded-full border border-white/20 bg-white/10 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select
                value={eclaireurSort}
                onChange={(event) => setEclaireurSort(event.target.value as "inactive_oldest" | "inactive_recent")}
                className="h-9 rounded-lg border border-white/15 bg-black/25 px-2 text-[11px]"
              >
                <option value="inactive_oldest">Trier: Inactifs les plus anciens</option>
                <option value="inactive_recent">Trier: Inactifs recents</option>
              </select>
              <div className="flex items-center justify-center rounded-lg border border-white/15 bg-black/25 px-2 text-[11px] text-white/75">
                {eclaireursList.length} eclaireur(s)
              </div>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
              <select
                value={selectedImportedScoutId}
                onChange={(event) => setSelectedImportedScoutId(event.target.value)}
                className="h-9 rounded-lg border border-white/15 bg-black/25 px-2 text-[11px]"
              >
                <option value="">Ajouter depuis mes contacts importes</option>
                {importedScoutCandidates.map((item) => (
                  <option key={`imported-scout-${item.id}`} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addScoutFromImportedSelection}
                disabled={!hasImportedScoutCandidates && !manualScoutFirstName.trim() && !manualScoutLastName.trim() && !manualScoutMetier.trim() && !manualScoutCity.trim() && !manualScoutPhone.trim()}
                className="h-9 rounded-lg border border-cyan-300/35 bg-cyan-300/15 px-3 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100"
              >
                Ajouter +
              </button>
            </div>
            <div className="mt-2 rounded-lg border border-white/15 bg-black/20 p-2">
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-white/70">Ou ajouter manuellement (ajout + eclaireur direct)</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  value={manualScoutFirstName}
                  onChange={(event) => setManualScoutFirstName(event.target.value)}
                  placeholder="Prenom"
                  className="h-8 rounded-lg border border-white/15 bg-black/30 px-2 text-[11px]"
                />
                <input
                  value={manualScoutLastName}
                  onChange={(event) => setManualScoutLastName(event.target.value)}
                  placeholder="Nom"
                  className="h-8 rounded-lg border border-white/15 bg-black/30 px-2 text-[11px]"
                />
                <input
                  value={manualScoutMetier}
                  onChange={(event) => setManualScoutMetier(event.target.value)}
                  placeholder="Metier"
                  className="h-8 rounded-lg border border-white/15 bg-black/30 px-2 text-[11px]"
                />
                <input
                  value={manualScoutCity}
                  onChange={(event) => setManualScoutCity(event.target.value)}
                  placeholder="Ville"
                  className="h-8 rounded-lg border border-white/15 bg-black/30 px-2 text-[11px]"
                />
                <input
                  value={manualScoutPhone}
                  onChange={(event) => setManualScoutPhone(event.target.value)}
                  placeholder="Telephone"
                  className="col-span-2 h-8 rounded-lg border border-white/15 bg-black/30 px-2 text-[11px]"
                />
              </div>
            </div>
            <p className="mt-1 text-[10px] text-white/70">
              {hasImportedScoutCandidates
                ? `${importedScoutCandidates.length} contact(s) pret(s) a ajouter`
                : "Aucun nouveau contact disponible ici. Utilise l ajout manuel dans Profil."}
            </p>
            {apiErrorMessage ? (
              <p className="mt-2 rounded-lg border border-amber-300/35 bg-amber-300/10 px-2 py-1 text-[11px] text-amber-100">{apiErrorMessage}</p>
            ) : null}
            <div className="mt-2 rounded-xl border border-fuchsia-300/30 bg-fuchsia-300/10 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-fuchsia-100">Opportunites entrantes Eclaireurs</p>
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
                      className="w-full rounded-lg border border-white/15 bg-black/20 px-2 py-1 text-left transition hover:border-fuchsia-300/45 hover:bg-fuchsia-300/10"
                    >
                      <p className="text-[11px] font-black text-white">{item.contact_name}</p>
                      <p className="text-[10px] text-white/70">
                        {item.scout_name || "Eclaireur"} • {item.project_type || "Projet non precise"} • {referralStatusLabel(item.status)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-3 max-h-[calc(100dvh-330px)] space-y-2 overflow-y-auto sm:max-h-[58vh]">
              {eclaireursList.length === 0 && <p className="text-sm text-white/70">Aucun eclaireur actif pour l instant.</p>}
              {eclaireursList.map((contact) => {
                const stats = eclaireurStatsStore[contact.id] || { leadsDetected: 0, leadsSigned: 0, commissionTotalEur: 0, lastNewsAtMs: 0 };
                const daysSinceActivation = stats.lastNewsAtMs > 0 ? Math.max(0, Math.floor((Date.now() - stats.lastNewsAtMs) / (24 * 60 * 60 * 1000))) : null;
                return (
                  <div key={`eclaireur-${contact.id}`} className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => openEclaireurTemplates(contact.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-sm font-black text-emerald-50">{contact.name}</p>
                        <p className="text-[11px] text-emerald-100/80">{contact.city}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEclaireurTemplates(contact.id)}
                        className="rounded-lg border border-cyan-300/35 bg-cyan-300/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100"
                      >
                        Messages
                      </button>
                    </div>
                    <p className="mt-1 text-[10px] text-white/80">
                      {daysSinceActivation === null
                        ? "Activation: jamais activee"
                        : `Activation: il y a ${daysSinceActivation} jour${daysSinceActivation > 1 ? "s" : ""}`}
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
          </section>
        </div>
      )}

      {selectedIncomingReferral && (
        <div className="fixed inset-0 z-[62] flex items-center justify-center bg-black/72 px-3 backdrop-blur-md sm:px-4">
          <section className="w-full max-h-[88vh] max-w-2xl overflow-y-auto rounded-3xl border border-emerald-300/35 bg-[#0B1230] p-5 shadow-[0_30px_120px_-35px_rgba(16,185,129,0.75)] sm:p-6">
            <div className="rounded-2xl border border-emerald-300/35 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.26),rgba(8,12,28,0.94))] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100">Bonne nouvelle</p>
              <p className="mt-1 text-2xl font-black text-white">Nouvelle opportunite Eclaireur</p>
              <p className="mt-1 text-sm text-emerald-100/85">
                {selectedIncomingReferral.contact_name} • {selectedIncomingReferral.project_type || "Projet non precise"}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-fuchsia-100">Pipeline de suivi</p>
              <button
                type="button"
                onClick={() => setSelectedIncomingReferralId(null)}
                className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs"
              >
                ✕
              </button>
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
                    setDraftMessage(resolveMessageDraft("eclaireur", item.message));
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

      {showTemplateModal && selectedAction && selectedAction !== "passer" && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center px-3 sm:px-4">
          <section className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0E1430] p-4">
            <div className="relative flex items-center justify-center">
              <p className="text-sm font-black tracking-[0.05em] text-cyan-200 text-center">
                {selectedAction === "qualifier" ? "Qualifiez ce contact" : "Message pret a envoyer"}
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
                <div
                  ref={opportunitySectionRef}
                  className="rounded-2xl border border-white/15 bg-black/25 p-3 transition-all duration-300"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">� Type d opportunite - 1 choix</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {OPPORTUNITY_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setOpportunityChoice(option.id);
                          if (qualifierStep < 2) {
                            setQualifierStep(2);
                            setTimeout(() => scrollIntoViewSmooth(temperatureSectionRef), 180);
                          }
                        }}
                        className={`h-10 rounded-xl px-2 text-[11px] font-black ${
                          opportunityChoice === option.id ? "bg-emerald-300 text-emerald-950 ring-2 ring-emerald-200/70" : "bg-white/10 text-white/85"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  ref={temperatureSectionRef}
                  className={`rounded-2xl border border-white/15 bg-black/25 p-3 transition-all duration-300 ${qualifierStep >= 2 ? "opacity-100" : "opacity-35 pointer-events-none"}`}
                >
                  <p className="text-[12px] font-black uppercase tracking-[0.14em] text-cyan-100">🌡 Temperature du contact</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQualifierHeat("froid");
                        setHasChosenHeat(true);
                        if (qualifierStep < 3) {
                          setQualifierStep(3);
                          setTimeout(() => scrollIntoViewSmooth(communitySectionRef), 180);
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
                        setHasChosenHeat(true);
                        if (qualifierStep < 3) {
                          setQualifierStep(3);
                          setTimeout(() => scrollIntoViewSmooth(communitySectionRef), 180);
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
                        setHasChosenHeat(true);
                        if (qualifierStep < 3) {
                          setQualifierStep(3);
                          setTimeout(() => scrollIntoViewSmooth(communitySectionRef), 180);
                        }
                      }}
                      className={`h-11 rounded-xl text-sm font-black ${qualifierHeat === "brulant" ? "bg-orange-400 text-[#321A0E] ring-2 ring-orange-200/60" : "bg-white/10 text-white/80"}`}
                    >
                      🔥 Brulant
                    </button>
                  </div>
                </div>

                <div
                  ref={communitySectionRef}
                  className={`rounded-2xl border border-white/15 bg-black/25 p-3 transition-all duration-300 ${qualifierStep >= 3 ? "opacity-100" : "opacity-35 pointer-events-none"}`}
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
                {promptContextPreview.length > 0 && (
                  <p className="mt-2 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-xs text-emerald-100">
                    Variables IA: {promptContextPreview.join(" • ")}
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
                  onClick={saveCurrentMessageAsDefault}
                  className="mt-2 h-9 rounded-xl border border-emerald-300/40 bg-emerald-300/15 px-3 text-[11px] font-black uppercase tracking-[0.08em] text-emerald-100"
                >
                  Enregistrer comme message par defaut
                </button>
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
    </main>
  );
}
