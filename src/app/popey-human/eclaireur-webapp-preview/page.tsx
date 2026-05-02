"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { DM_Sans, Syne } from "next/font/google";

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const OPPORTUNITY_TARGETS = {
  Dax: [
    { metier: "Courtier", rewardType: "percent", rewardValue: 12, delayDays: 45 },
    { metier: "Agent immo", rewardType: "percent", rewardValue: 10, delayDays: 50 },
    { metier: "Diagnostiqueur", rewardType: "fixed", rewardValue: 180, delayDays: 30 },
  ],
  "Saint-Paul-les-Dax": [
    { metier: "Courtier", rewardType: "percent", rewardValue: 11, delayDays: 40 },
    { metier: "Agent immo", rewardType: "fixed", rewardValue: 350, delayDays: 55 },
    { metier: "Diagnostiqueur", rewardType: "fixed", rewardValue: 160, delayDays: 28 },
  ],
  Narrosse: [
    { metier: "Courtier", rewardType: "percent", rewardValue: 9, delayDays: 48 },
    { metier: "Agent immo", rewardType: "percent", rewardValue: 8, delayDays: 60 },
    { metier: "Diagnostiqueur", rewardType: "fixed", rewardValue: 140, delayDays: 35 },
  ],
} as const;

const SCOUT_PREVIEW_TOKEN_STORAGE_KEY = "popey-human:eclaireur-preview:last-token-or-code";
const SCOUT_PREVIEW_TOKEN_COOKIE_KEY = "popey_human_eclaireur_preview_token";
const SCOUT_PREVIEW_IMPORTED_CONTACTS_STORAGE_PREFIX = "popey-human:eclaireur-preview:imported-contacts:";

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const escaped = name.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

type Referral = {
  id: string;
  contact_name: string;
  contact_phone: string;
  project_type: string | null;
  status: string;
  estimated_commission: number | null;
  final_commission: number | null;
  created_at: string;
  validated_at: string | null;
  offered_at: string | null;
  converted_at: string | null;
};

type PortalData = {
  inviteToken: string | null;
  shortCode: string | null;
  sponsorName: string | null;
  sponsorPhone: string | null;
  sponsorVille: string | null;
  scoutFirstName: string | null;
  scoutType: "perso" | "pro";
  availableTargets: Array<{ label: string; type: "metier" | "member" }>;
  referrals: Referral[];
};

type ImportedContactRow = {
  fullName: string;
  phone: string | null;
  city: string | null;
  companyHint: string | null;
};

type ImportedContact = {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  companyHint: string | null;
};

function hasValidWhatsappNumber(raw: string | null | undefined) {
  return normalizePhoneForWhatsApp(String(raw || "")).length > 0;
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

function parseVcfContacts(raw: string): ImportedContactRow[] {
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

function parseCsvContacts(raw: string): ImportedContactRow[] {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return [];
  const delimiter = detectCsvDelimiter(lines[0]);
  const headers = splitCsvRow(lines[0], delimiter).map((header) => header.replace(/^\uFEFF/, "").trim().toLowerCase());
  const idxName = headers.findIndex((h) => ["name", "nom", "full_name", "display_name"].some((token) => h.includes(token)));
  const idxFirstName = headers.findIndex((h) => ["first name", "prenom", "given name"].some((token) => h.includes(token)));
  const idxLastName = headers.findIndex((h) => ["last name", "nom de famille", "family name"].some((token) => h.includes(token)));
  const idxPhone = headers.findIndex((h) => ["phone", "telephone", "mobile", "numero", "num", "tel"].some((token) => h.includes(token)));
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

function buildImportedContacts(rows: ImportedContactRow[]): ImportedContact[] {
  const dedup = new Set<string>();
  const mapped = rows
    .map((row, idx) => {
      const name = String(row.fullName || "").trim();
      const phoneRaw = String(row.phone || "").trim();
      const phoneDigits = phoneRaw.replace(/\D/g, "");
      return {
        id: `contact-${idx + 1}-${phoneDigits.slice(-4) || "0000"}`,
        name,
        phone: phoneRaw || null,
        city: row.city,
        companyHint: row.companyHint,
        dedupKey: `${name.toLowerCase()}|${phoneDigits}`,
      };
    })
    .filter((row) => row.name.length > 0)
    .filter((row) => row.name.length > 0);

  // If the same contact name exists with and without a valid number,
  // keep only entries that have a usable WhatsApp number.
  const namesWithValidPhone = new Set(
    mapped.filter((row) => hasValidWhatsappNumber(row.phone)).map((row) => row.name.toLowerCase()),
  );

  return mapped
    .filter((row) => {
      const nameKey = row.name.toLowerCase();
      if (namesWithValidPhone.has(nameKey) && !hasValidWhatsappNumber(row.phone)) {
        return false;
      }
      return true;
    })
    .filter((row) => {
      if (dedup.has(row.dedupKey)) return false;
      dedup.add(row.dedupKey);
      return true;
    })
    .map(({ dedupKey: _dedupKey, ...safeRow }) => safeRow);
}

function mergeImportedContacts(existing: ImportedContact[], incoming: ImportedContact[]): ImportedContact[] {
  const dedup = new Set<string>();
  const mergedRaw: ImportedContact[] = [];
  [...existing, ...incoming].forEach((item, idx) => {
    const key = `${String(item.name || "").trim().toLowerCase()}|${String(item.phone || "").replace(/\D/g, "")}`;
    if (dedup.has(key)) return;
    dedup.add(key);
    mergedRaw.push({
      ...item,
      id: item.id || `contact-${idx + 1}-${String(item.phone || "").replace(/\D/g, "").slice(-4) || "0000"}`,
    });
  });
  const namesWithValidPhone = new Set(
    mergedRaw.filter((row) => hasValidWhatsappNumber(row.phone)).map((row) => String(row.name || "").trim().toLowerCase()),
  );
  return mergedRaw.filter((row) => {
    const nameKey = String(row.name || "").trim().toLowerCase();
    if (!nameKey) return false;
    if (namesWithValidPhone.has(nameKey) && !hasValidWhatsappNumber(row.phone)) {
      return false;
    }
    return true;
  });
}

function contactInitials(name: string) {
  const tokens = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (tokens.length === 0) return "??";
  return tokens.map((token) => token[0]?.toUpperCase() || "").join("");
}

function referralStatusLabel(status: string) {
  if (status === "converted") return "Client";
  if (status === "offered") return "Offre";
  if (status === "validated") return "RDV";
  if (status === "submitted") return "Contacte";
  return "En attente";
}

function slugifyCity(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePhoneForWhatsApp(raw: string) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("0")) digits = `33${digits.slice(1)}`;
  if (digits.length < 8 || digits.length > 15) return "";
  return digits;
}

function buildBulkOfferShareMessage(privilegeCatalogHref: string) {
  const catalogUrl = privilegeCatalogHref.startsWith("http")
    ? privilegeCatalogHref
    : `https://www.popey.academy${privilegeCatalogHref}`;
  return `Salut ! J'ai trouve ce catalogue de privileges exclusifs a prix reduits sur Dax (sante/bien etre, Osteo, Coach...). C'est cadeau, et en plus, ca nous permet de soutenir les commercants locaux ! Regarde ici : ${catalogUrl}`;
}

function buildEclaireurRecruitmentWhatsappHref(input: {
  contact: ImportedContact;
  sponsorName?: string | null;
  sponsorVille?: string | null;
  rewardLabel: string;
}) {
  if (!input.contact.phone) return null;
  const phone = normalizePhoneForWhatsApp(input.contact.phone);
  if (!phone) return null;
  const senderName = String(input.sponsorName || "moi").trim();
  const city = String(input.sponsorVille || "").trim();
  const cityPart = city ? ` sur ${city}` : "";
  const message =
    `Salut ${input.contact.name}, j'ai pense a toi pour devenir eclaireur dans mon reseau pro${cityPart}. ` +
    `Le principe: tu me recommandes des personnes qui ont un vrai besoin, je m'occupe du suivi, et tu touches une commission (${input.rewardLabel}) ` +
    `quand la mise en relation aboutit. Tu veux que je t'explique en 2 minutes comment ca marche ? - ${senderName}`;
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}

function openWhatsAppFromGesture(href: string) {
  if (typeof window === "undefined") return false;
  const opened = window.open(href, "_blank", "noopener,noreferrer");
  if (opened) return true;
  window.location.assign(href);
  return true;
}

export default function EclaireurWebappPreviewPage() {
  const searchParams = useSearchParams();
  const urlTokenOrCode = (searchParams.get("token") || searchParams.get("code") || "").trim();
  const [tokenOrCode, setTokenOrCode] = useState(urlTokenOrCode);
  const contactImportInputRef = useRef<HTMLInputElement | null>(null);

  const [activeScreen, setActiveScreen] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [portalError, setPortalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [lastReferralId, setLastReferralId] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [comment, setComment] = useState("");
  const [estimatedDealValue, setEstimatedDealValue] = useState("");
  const [projectTypeCustom, setProjectTypeCustom] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [portalData, setPortalData] = useState<PortalData | null>(null);

  const [isImportingContacts, setIsImportingContacts] = useState(false);
  const [supportsDirectContactPicker, setSupportsDirectContactPicker] = useState(false);
  const [importedContacts, setImportedContacts] = useState<ImportedContact[]>([]);
  const [importSummary, setImportSummary] = useState("");
  const [importError, setImportError] = useState("");
  const [selectionMessage, setSelectionMessage] = useState("");
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [showImportHelp, setShowImportHelp] = useState(false);
  const [helpPlatform, setHelpPlatform] = useState<"ios" | "android">("ios");

  const [city, setCity] = useState<keyof typeof OPPORTUNITY_TARGETS>("Dax");
  const importedContactsStorageKey = useMemo(
    () => `${SCOUT_PREVIEW_IMPORTED_CONTACTS_STORAGE_PREFIX}${(tokenOrCode || "demo").toLowerCase()}`,
    [tokenOrCode],
  );
  const fallbackMetiers = useMemo(() => OPPORTUNITY_TARGETS[city].map((item) => item.metier), [city]);
  const availableMetiers = useMemo(() => {
    const fromMember = (portalData?.availableTargets || []).map((item) => item.label.trim()).filter(Boolean);
    if (fromMember.length > 0) return Array.from(new Set(fromMember));
    return fallbackMetiers;
  }, [fallbackMetiers, portalData?.availableTargets]);
  const [metier, setMetier] = useState<string>(OPPORTUNITY_TARGETS.Dax[0].metier);

  const selectedTarget = useMemo(() => {
    return OPPORTUNITY_TARGETS[city].find((item) => item.metier === metier) || OPPORTUNITY_TARGETS[city][0];
  }, [city, metier]);
  const rewardLabel = selectedTarget.rewardType === "percent" ? `${selectedTarget.rewardValue}%` : `fixe ${selectedTarget.rewardValue} EUR`;
  const projectType = projectTypeCustom.trim();

  const referrals = portalData?.referrals || [];
  const latestReferral = referrals[0] || null;
  const potential = referrals.reduce((sum, item) => sum + Number(item.estimated_commission || 0), 0);
  const won = referrals.reduce((sum, item) => sum + Number(item.final_commission || 0), 0);
  const finalized = referrals.filter((item) => item.status === "converted").length;
  const remaining = Math.max(0, 5 - finalized);
  const liveToken = portalData?.inviteToken || (/^[a-f0-9]{16,64}$/i.test(tokenOrCode) ? tokenOrCode.toLowerCase() : "");
  const detailsHref = liveToken ? `/popey-human/eclaireur/${encodeURIComponent(liveToken)}?tab=history` : null;
  const whatsappHref = useMemo(() => {
    const phone = (portalData?.sponsorPhone || "").replace(/\D/g, "");
    if (!phone) return null;
    const text = latestReferral
      ? `Salut, je te relance sur l opportunite ${latestReferral.contact_name}.`
      : "Salut, je souhaite te contacter depuis mon portail eclaireur.";
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }, [latestReferral, portalData?.sponsorPhone]);

  const suggestionCandidates = useMemo(
    () => importedContacts.filter((contact) => hasValidWhatsappNumber(contact.phone)),
    [importedContacts],
  );
  const suggestion = suggestionCandidates[suggestionIndex] || null;
  const privilegeCatalogHref = useMemo(() => {
    const fallbackCity = city || "Dax";
    const cityLabel = String(portalData?.sponsorVille || fallbackCity || "").trim();
    const citySlug = slugifyCity(cityLabel);
    if (!citySlug) return "/privilege";
    return `/privilege/${citySlug}`;
  }, [city, portalData?.sponsorVille]);
  const suggestedMonthlyContacts = Math.min(30, importedContacts.length || 30);
  const suggestedConversions = Math.max(1, Math.round(suggestedMonthlyContacts * 0.27));
  const suggestedGain = Math.round(suggestedConversions * (selectedTarget.rewardType === "fixed" ? selectedTarget.rewardValue : 15));
  const dayLetters = ["L", "M", "M", "J", "V", "S", "D"];
  const todayDayIndex = Math.max(0, Math.min(6, (new Date().getDay() + 6) % 7));
  const streak = Math.min(7, Math.max(1, todayDayIndex + 1));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromUrl = urlTokenOrCode.trim();
    if (fromUrl) {
      setTokenOrCode(fromUrl);
      window.localStorage.setItem(SCOUT_PREVIEW_TOKEN_STORAGE_KEY, fromUrl);
      document.cookie = `${SCOUT_PREVIEW_TOKEN_COOKIE_KEY}=${encodeURIComponent(fromUrl)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
      return;
    }
    const savedCookie = readCookie(SCOUT_PREVIEW_TOKEN_COOKIE_KEY).trim();
    if (savedCookie) {
      setTokenOrCode(savedCookie);
      window.localStorage.setItem(SCOUT_PREVIEW_TOKEN_STORAGE_KEY, savedCookie);
      return;
    }
    const saved = String(window.localStorage.getItem(SCOUT_PREVIEW_TOKEN_STORAGE_KEY) || "").trim();
    if (saved) {
      setTokenOrCode(saved);
      return;
    }
    setTokenOrCode("");
  }, [urlTokenOrCode]);

  useEffect(() => {
    if (!availableMetiers.includes(metier)) {
      setMetier(availableMetiers[0] || "");
    }
  }, [availableMetiers, metier]);

  useEffect(() => {
    const nav = navigator as Navigator & {
      contacts?: { select?: (properties: string[], options?: { multiple?: boolean }) => Promise<Array<{ name?: string[]; tel?: string[] }>> };
    };
    setSupportsDirectContactPicker(typeof nav.contacts?.select === "function");
  }, []);

  useEffect(() => {
    if (suggestionIndex > 0 && suggestionIndex >= suggestionCandidates.length) {
      setSuggestionIndex(0);
    }
  }, [suggestionCandidates.length, suggestionIndex]);

  useEffect(() => {
    if (!tokenOrCode) return;
    let cancelled = false;
    async function loadPortal() {
      try {
        setIsLoadingPortal(true);
        const response = await fetch(`/api/popey-human/eclaireur-preview/portal?token=${encodeURIComponent(tokenOrCode)}`, { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          inviteToken?: string | null;
          shortCode?: string | null;
          sponsorName?: string | null;
          sponsorPhone?: string | null;
          sponsorVille?: string | null;
          scout?: { first_name?: string | null } | null;
          scoutType?: "perso" | "pro";
          availableTargets?: Array<{ label: string; type: "metier" | "member" }>;
          referrals?: Referral[];
        };
        if (!response.ok) {
          throw new Error(payload.error || "Impossible de charger le portail.");
        }
        if (cancelled) return;
        setPortalData({
          inviteToken: payload.inviteToken || null,
          shortCode: payload.shortCode || null,
          sponsorName: payload.sponsorName || null,
          sponsorPhone: payload.sponsorPhone || null,
          sponsorVille: payload.sponsorVille || null,
          scoutFirstName: String(payload.scout?.first_name || "").trim() || null,
          scoutType: payload.scoutType === "pro" ? "pro" : "perso",
          availableTargets: payload.availableTargets || [],
          referrals: payload.referrals || [],
        });
        setPortalError("");
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Impossible de charger le portail.";
        setPortalError(message);
        setPortalData(null);
      } finally {
        if (!cancelled) setIsLoadingPortal(false);
      }
    }
    void loadPortal();
    return () => {
      cancelled = true;
    };
  }, [tokenOrCode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(importedContactsStorageKey);
      if (!raw) {
        setImportedContacts([]);
        setSuggestionIndex(0);
        return;
      }
      const parsed = JSON.parse(raw) as ImportedContact[];
      if (!Array.isArray(parsed)) {
        setImportedContacts([]);
        setSuggestionIndex(0);
        return;
      }
      const safeContacts = parsed
        .map((item, idx) => ({
          id: String(item?.id || `contact-${idx + 1}`),
          name: String(item?.name || "").trim(),
          phone: item?.phone ? String(item.phone) : null,
          city: item?.city ? String(item.city) : null,
          companyHint: item?.companyHint ? String(item.companyHint) : null,
        }))
        .filter((item) => item.name.length > 0);
      setImportedContacts(safeContacts);
      setSuggestionIndex(0);
      if (safeContacts.length > 0) {
        setImportSummary(`${safeContacts.length} contacts restaurés automatiquement`);
      }
    } catch {
      setImportedContacts([]);
      setSuggestionIndex(0);
    }
  }, [importedContactsStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (importedContacts.length === 0) {
        window.localStorage.removeItem(importedContactsStorageKey);
        return;
      }
      window.localStorage.setItem(importedContactsStorageKey, JSON.stringify(importedContacts));
    } catch {
      // Ignore storage quota / privacy errors.
    }
  }, [importedContacts, importedContactsStorageKey]);

  async function refreshPortal() {
    if (!tokenOrCode) return;
    try {
      const response = await fetch(`/api/popey-human/eclaireur-preview/portal?token=${encodeURIComponent(tokenOrCode)}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        inviteToken?: string | null;
        shortCode?: string | null;
        sponsorName?: string | null;
        sponsorPhone?: string | null;
        sponsorVille?: string | null;
        scout?: { first_name?: string | null } | null;
        scoutType?: "perso" | "pro";
        availableTargets?: Array<{ label: string; type: "metier" | "member" }>;
        referrals?: Referral[];
      };
      if (!response.ok) return;
      setPortalData({
        inviteToken: payload.inviteToken || null,
        shortCode: payload.shortCode || null,
        sponsorName: payload.sponsorName || null,
        sponsorPhone: payload.sponsorPhone || null,
        sponsorVille: payload.sponsorVille || null,
        scoutFirstName: String(payload.scout?.first_name || "").trim() || null,
        scoutType: payload.scoutType === "pro" ? "pro" : "perso",
        availableTargets: payload.availableTargets || [],
        referrals: payload.referrals || [],
      });
    } catch {
      // Silent refresh failure keeps current state visible.
    }
  }

  async function submitOpportunity() {
    if (!tokenOrCode) {
      setSubmitMessage("Ajoute ?token=... ou ?code=... dans l URL pour activer l envoi reel.");
      return;
    }
    if (!contactName.trim() || !contactPhone.trim()) {
      setSubmitMessage("Nom et telephone sont obligatoires.");
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/popey-human/eclaireur-preview/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenOrCode,
          contactName,
          contactPhone,
          projectType,
          estimatedDealValue,
          comment,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; referralId?: string | null };
      if (!response.ok) throw new Error(payload.error || "Envoi impossible.");
      setSubmitMessage("Alerte envoyee avec succes.");
      setLastReferralId(payload.referralId || null);
      setContactName("");
      setContactPhone("");
      setComment("");
      setEstimatedDealValue("");
      setProjectTypeCustom("");
      setActiveScreen(2);
      await refreshPortal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Envoi impossible.";
      setSubmitMessage(message);
      setLastReferralId(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  function onSwipeEnd() {
    if (touchStartX === null || touchEndX === null) return;
    const delta = touchStartX - touchEndX;
    if (delta > 45) setActiveScreen((v) => Math.min(3, v + 1));
    if (delta < -45) setActiveScreen((v) => Math.max(0, v - 1));
    setTouchStartX(null);
    setTouchEndX(null);
  }

  function openContactImportPicker() {
    contactImportInputRef.current?.click();
  }

  async function importContactsFromFile(file: File, mode: "replace" | "append" = "replace") {
    const lowerName = file.name.toLowerCase();
    const raw = await file.text();
    const rows = lowerName.endsWith(".vcf") || raw.includes("BEGIN:VCARD") ? parseVcfContacts(raw) : parseCsvContacts(raw);
    const contacts = buildImportedContacts(rows);
    if (contacts.length === 0) {
      setImportError("Aucun contact exploitable detecte dans le fichier.");
      return;
    }
    const merged = mode === "append" ? mergeImportedContacts(importedContacts, contacts) : contacts;
    setImportedContacts(merged);
    setSuggestionIndex(0);
    setImportSummary(
      mode === "append"
        ? `+${contacts.length} nouveaux contacts depuis ${file.name} · total ${merged.length}`
        : `${merged.length} contacts charges depuis ${file.name}`,
    );
    setImportError("");
  }

  async function handleContactImportChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsImportingContacts(true);
      await importContactsFromFile(file, importedContacts.length > 0 ? "append" : "replace");
    } catch {
      setImportError("Import impossible. Utilise un fichier .vcf ou .csv valide.");
    } finally {
      setIsImportingContacts(false);
      event.target.value = "";
    }
  }

  async function importContactsFromDirectPicker(mode: "replace" | "append" = "replace") {
    const nav = navigator as Navigator & {
      contacts?: { select?: (properties: string[], options?: { multiple?: boolean }) => Promise<Array<{ name?: string[]; tel?: string[] }>> };
    };
    if (typeof nav.contacts?.select !== "function") {
      setImportError("Acces direct indisponible sur ce navigateur. Utilise l import .vcf/.csv.");
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
      const contacts = buildImportedContacts(rows);
      if (contacts.length === 0) {
        setImportError("Aucun contact exploitable recupere en acces direct.");
        return;
      }
      const merged = mode === "append" ? mergeImportedContacts(importedContacts, contacts) : contacts;
      setImportedContacts(merged);
      setSuggestionIndex(0);
      setImportSummary(
        mode === "append"
          ? `+${contacts.length} nouveaux contacts via acces direct · total ${merged.length}`
          : `${merged.length} contacts charges via acces direct`,
      );
      setImportError("");
    } catch {
      setImportError("Acces direct refuse ou indisponible. Utilise l import .vcf/.csv.");
    } finally {
      setIsImportingContacts(false);
    }
  }

  function useSuggestedContact() {
    if (!suggestion) {
      setImportError("Importe tes contacts pour activer la suggestion du jour.");
      return;
    }
    setContactName(suggestion.name);
    setContactPhone(suggestion.phone || "");
    setProjectTypeCustom("Suggestion du jour");
    setSubmitMessage("Contact pre-rempli depuis la suggestion du jour. Verifie puis envoie.");
    setActiveScreen(1);
  }

  async function sendMassCatalogueToWhatsApp() {
    setSelectionMessage("");
    const validCount = importedContacts.filter((contact) => hasValidWhatsappNumber(contact.phone)).length;
    if (validCount === 0) {
      setSelectionMessage("Aucun numero WhatsApp valide importe pour l envoi en masse.");
      return;
    }
    const message = buildBulkOfferShareMessage(privilegeCatalogHref);
    try {
      const nav = navigator as Navigator & {
        share?: (data: { text?: string; url?: string; title?: string }) => Promise<void>;
      };
      if (typeof nav.share === "function") {
        await nav.share({ text: message });
        setSelectionMessage("WhatsApp ouvert. Selectionne plusieurs contacts puis envoie.");
        return;
      }
      openWhatsAppFromGesture(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`);
      setSelectionMessage("WhatsApp ouvert. Selectionne plusieurs contacts puis envoie.");
    } catch (error) {
      const err = error as { name?: string };
      if (err?.name === "AbortError") {
        setSelectionMessage("Envoi annule.");
        return;
      }
      openWhatsAppFromGesture(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`);
      setSelectionMessage("WhatsApp ouvert. Selectionne plusieurs contacts puis envoie.");
    }
  }

  function skipSuggestion() {
    if (suggestionCandidates.length === 0) return;
    setSuggestionIndex((current) => (current + 1) % suggestionCandidates.length);
  }

  function clearImportedContacts() {
    setImportedContacts([]);
    setSuggestionIndex(0);
    setImportSummary("Contacts supprimes. Tu peux reimporter quand tu veux.");
    setImportError("");
    setSelectionMessage("");
  }

  const screens = [
    {
      label: "Ecran 1",
      subtitle: "Accueil eclaireur",
      content: (
        <ScreenWelcome
          tokenOrCode={tokenOrCode}
          isLoadingPortal={isLoadingPortal}
          portalError={portalError}
          sponsorName={portalData?.sponsorName || null}
          scoutFirstName={portalData?.scoutFirstName || null}
          scoutType={portalData?.scoutType || "perso"}
          dossiersEnCours={referrals.length}
          commissionPrevisionnelle={potential}
          commissionGagnee={won}
          privilegeCatalogHref={privilegeCatalogHref}
          onGoSubmit={() => setActiveScreen(1)}
        />
      ),
    },
    {
      label: "Ecran 2",
      subtitle: "Soumettre un contact",
      content: (
        <ScreenSubmit
          tokenOrCode={tokenOrCode}
          city={city}
          setCity={setCity}
          cities={Object.keys(OPPORTUNITY_TARGETS) as Array<keyof typeof OPPORTUNITY_TARGETS>}
          rewardLabel={rewardLabel}
          delayDays={selectedTarget.delayDays}
          contactName={contactName}
          setContactName={setContactName}
          contactPhone={contactPhone}
          setContactPhone={setContactPhone}
          projectTypeCustom={projectTypeCustom}
          setProjectTypeCustom={setProjectTypeCustom}
          estimatedDealValue={estimatedDealValue}
          setEstimatedDealValue={setEstimatedDealValue}
          comment={comment}
          setComment={setComment}
          submitMessage={submitMessage}
          lastReferralId={lastReferralId}
          isSubmitting={isSubmitting}
          onSubmit={submitOpportunity}
        />
      ),
    },
    {
      label: "Ecran 3",
      subtitle: "Suivi & commissions",
      content: (
        <ScreenTracking
          latestReferral={latestReferral}
          referrals={referrals}
          won={won}
          potential={potential}
          finalized={finalized}
          remaining={remaining}
          onOpenDetails={() => setShowDetailsModal(true)}
          whatsappHref={whatsappHref}
          onGoSubmit={() => setActiveScreen(1)}
        />
      ),
    },
    {
      label: "Ecran 4",
      subtitle: "Suggestion du jour",
      content: (
        <ScreenSuggestion
          dayLetters={dayLetters}
          todayDayIndex={todayDayIndex}
          streak={streak}
          suggestion={suggestion}
          selectedTargetReward={selectedTarget.rewardType === "fixed" ? `${selectedTarget.rewardValue} EUR` : `${selectedTarget.rewardValue}%`}
          sponsorName={portalData?.sponsorName || null}
          sponsorVille={portalData?.sponsorVille || null}
          importedCount={importedContacts.length}
          importedContacts={importedContacts}
          suggestionCandidatesCount={suggestionCandidates.length}
          importSummary={importSummary}
          importError={importError}
          selectionMessage={selectionMessage}
          supportsDirectContactPicker={supportsDirectContactPicker}
          isImportingContacts={isImportingContacts}
          suggestedMonthlyContacts={suggestedMonthlyContacts}
          suggestedConversions={suggestedConversions}
          suggestedGain={suggestedGain}
          onImportFile={openContactImportPicker}
          onImportDirect={() => importContactsFromDirectPicker(importedContacts.length > 0 ? "append" : "replace")}
          onRecommend={useSuggestedContact}
          onSkip={skipSuggestion}
          onSendMassCatalogue={sendMassCatalogueToWhatsApp}
          onClearContacts={clearImportedContacts}
          onOpenImportHelp={() => setShowImportHelp(true)}
          onGoSubmit={() => setActiveScreen(1)}
        />
      ),
    },
  ];

  return (
    <main className={`${dmSans.className} min-h-screen bg-[#070B16] text-[#EEF2F7]`}>
      <div className="mx-auto w-full max-w-2xl px-3 py-3 sm:px-4">
        <section className="p-0">
          <div
            className="overflow-hidden"
            onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
            onTouchMove={(event) => setTouchEndX(event.touches[0]?.clientX ?? null)}
            onTouchEnd={onSwipeEnd}
          >
            <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${activeScreen * 100}%)` }}>
              {screens.map((screen) => (
                <div key={screen.label} className="w-full shrink-0">
                  <PhoneFrame activeScreen={activeScreen} onChangeScreen={setActiveScreen}>{screen.content}</PhoneFrame>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <input
        ref={contactImportInputRef}
        type="file"
        accept=".vcf,.csv,text/vcard,text/csv"
        className="hidden"
        onChange={handleContactImportChange}
      />

      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-3 backdrop-blur-sm">
          <section className="w-full max-w-lg rounded-2xl border border-white/20 bg-[#0B1224] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-100">Detail de l opportunite</p>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs"
              >
                x
              </button>
            </div>
            <div className="mt-3 rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-sm">
              <p><span className="text-white/65">Contact:</span> {latestReferral?.contact_name || "Aucune opportunite envoyee"}</p>
              <p><span className="text-white/65">Projet:</span> {latestReferral?.project_type || "-"}</p>
              <p><span className="text-white/65">Statut:</span> {referralStatusLabel(latestReferral?.status || "")}</p>
              <p>
                <span className="text-white/65">Commission:</span>{" "}
                {latestReferral?.final_commission
                  ? `${Number(latestReferral.final_commission).toLocaleString("fr-FR")} EUR`
                  : latestReferral?.estimated_commission
                    ? `${Number(latestReferral.estimated_commission).toLocaleString("fr-FR")} EUR previsionnel`
                    : "En attente"}
              </p>
              {detailsHref ? (
                <a
                  href={detailsHref}
                  className="mt-3 inline-flex h-9 items-center rounded-lg border border-cyan-300/35 bg-cyan-300/15 px-3 text-[11px] font-black uppercase tracking-[0.08em] text-cyan-100"
                >
                  Ouvrir historique complet
                </a>
              ) : null}
            </div>
          </section>
        </div>
      )}
      {showImportHelp ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 px-3 pb-4 pt-8 backdrop-blur-sm sm:items-center">
          <section className="w-full max-w-lg rounded-2xl border border-white/20 bg-[#0B1224] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-100">Comment importer mes contacts</p>
              <button
                type="button"
                onClick={() => setShowImportHelp(false)}
                className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-xs"
              >
                x
              </button>
            </div>
            <p className="mt-2 text-[12px] text-white/70">
              Objectif: exporter tes contacts depuis ton telephone puis les importer ici avec le bouton <strong>.vcf/.csv</strong>.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHelpPlatform("ios")}
                className={`h-9 rounded-lg border text-[11px] font-bold ${
                  helpPlatform === "ios"
                    ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-100"
                    : "border-white/15 bg-white/5 text-white/75"
                }`}
              >
                iPhone (iOS)
              </button>
              <button
                type="button"
                onClick={() => setHelpPlatform("android")}
                className={`h-9 rounded-lg border text-[11px] font-bold ${
                  helpPlatform === "android"
                    ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-100"
                    : "border-white/15 bg-white/5 text-white/75"
                }`}
              >
                Android
              </button>
            </div>
            {helpPlatform === "ios" ? (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-[12px] text-white/80">
                <p className="font-semibold text-white">Etapes iPhone:</p>
                <p className="mt-2">1. Ouvre <strong>Contacts</strong> puis verifie que tes contacts sont bien synchronises (iCloud ou Gmail).</p>
                <p className="mt-1">2. Va sur iCloud.com ou ton compte Google Contacts depuis Safari/Chrome.</p>
                <p className="mt-1">3. Exporte les contacts au format <strong>.vcf</strong> (ou <strong>.csv</strong> via Google Contacts).</p>
                <p className="mt-1">4. Reviens ici et clique <strong>Telecharger mes contacts (.vcf/.csv)</strong>.</p>
                <p className="mt-1">5. Selectionne le fichier exporte pour charger tes contacts.</p>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-[12px] text-white/80">
                <p className="font-semibold text-white">Etapes Android:</p>
                <p className="mt-2">1. Ouvre l app <strong>Contacts</strong> Google ou Samsung.</p>
                <p className="mt-1">2. Menu <strong>Exporter</strong> / <strong>Gerer les contacts</strong>.</p>
                <p className="mt-1">3. Exporte un fichier <strong>.vcf</strong> (memoire du telephone ou Google Drive).</p>
                <p className="mt-1">4. Reviens sur cet ecran puis clique <strong>Telecharger mes contacts (.vcf/.csv)</strong>.</p>
                <p className="mt-1">5. Choisis le fichier .vcf pour importer toute ta liste.</p>
              </div>
            )}
            <p className="mt-3 text-[11px] text-white/55">
              Astuce: si l export mobile est bloque, utilise <strong>contacts.google.com</strong> pour exporter en quelques clics.
            </p>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function ScreenWelcome({
  tokenOrCode,
  isLoadingPortal,
  portalError,
  sponsorName,
  scoutFirstName,
  scoutType,
  dossiersEnCours,
  commissionPrevisionnelle,
  commissionGagnee,
  privilegeCatalogHref,
  onGoSubmit,
}: {
  tokenOrCode: string;
  isLoadingPortal: boolean;
  portalError: string;
  sponsorName: string | null;
  scoutFirstName: string | null;
  scoutType: "perso" | "pro";
  dossiersEnCours: number;
  commissionPrevisionnelle: number;
  commissionGagnee: number;
  privilegeCatalogHref: string;
  onGoSubmit: () => void;
}) {
  const greetingName = String(scoutFirstName || "").trim();
  return (
    <div className="min-h-[100dvh] bg-[#070B16] px-4 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-[calc(env(safe-area-inset-top)+16px)] sm:px-5">
      <p className="text-[12px] font-black uppercase tracking-[0.1em] text-[#00D4A0]">Popey · Eclaireur</p>
      <h2 className={`${syne.className} mt-2 text-[clamp(38px,10vw,58px)] font-black leading-[0.98]`}>
        {greetingName ? `Salut ${greetingName}, ton reseau vaut de l or` : "Salut, ton reseau vaut de l or"}
      </h2>
      <p className="mt-3 text-[clamp(20px,5.4vw,27px)] leading-[1.28] text-white/85">Recommande les bons pros a tes proches. Ils y gagnent - toi aussi.</p>

      <div className="mt-5 rounded-2xl border border-white/10 bg-[#161D2E] p-4">
        <p className="text-[12px] font-black uppercase tracking-[0.08em] text-white/55">Comment ca marche</p>
        <ol className="mt-3 space-y-2.5 text-[clamp(16px,4.2vw,22px)] leading-[1.3] text-white/80">
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#00D4A0]/35 bg-[#00D4A0]/10 text-[11px] font-black text-[#00D4A0]">1</span>
            <span>Tu reperes un besoin chez un proche.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#00D4A0]/35 bg-[#00D4A0]/10 text-[11px] font-black text-[#00D4A0]">2</span>
            <span>Tu entres son prenom + numero en 20 secondes.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#00D4A0]/35 bg-[#00D4A0]/10 text-[11px] font-black text-[#00D4A0]">3</span>
            <span>Le pro le contacte, tu suis et tu encaisses.</span>
          </li>
        </ol>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard title="Mises en relation" value={String(dossiersEnCours)} sub="ce mois" tone="teal" />
        <StatCard title="Commissions gagnees" value={`${Math.round(commissionGagnee)} EUR`} sub={`+${Math.round(commissionPrevisionnelle)} EUR en attente`} tone="amber" />
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#00D4A0]/25 bg-[#00D4A0]/10 px-4 py-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#00D4A0]/30 bg-[#00D4A0]/15 text-[11px] font-black text-[#00D4A0]">
          {(sponsorName || "PH")
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((token) => token[0]?.toUpperCase() || "")
            .join("")}
        </span>
        <div>
          <p className="text-[15px] font-semibold text-[#00D4A0]">{sponsorName || "Parrain Popey Human"}</p>
          <p className="text-[13px] text-[#00D4A0]/70">Eclaireur {scoutType === "pro" ? "Pro" : "Perso"} · Commission automatique</p>
        </div>
      </div>

      {tokenOrCode ? (
        <p className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-100">
          {isLoadingPortal ? "Chargement du portail reel..." : `Lien actif: ${tokenOrCode}`}
        </p>
      ) : (
        <p className="mt-3 rounded-xl border border-amber-300/35 bg-amber-300/10 px-3 py-2 text-[13px] text-amber-100">
          Mode demo. Ouvre avec ?token=... ou ?code=... pour activer le backend.
        </p>
      )}
      {portalError ? <p className="mt-2 rounded-xl border border-red-300/35 bg-red-500/10 px-3 py-2 text-[13px] text-red-100">{portalError}</p> : null}

      <button
        type="button"
        onClick={onGoSubmit}
        className="mt-4 h-14 w-full rounded-xl bg-gradient-to-r from-[#00D4A0] to-[#00B887] text-[15px] font-black uppercase tracking-[0.04em] text-[#060B12]"
      >
        Recommander quelqu un
      </button>
      <a
        href={privilegeCatalogHref}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[12px] font-semibold uppercase tracking-[0.04em] text-white/85"
      >
        Voir le catalogue privilege de ma ville
      </a>
    </div>
  );
}

function ScreenSubmit({
  tokenOrCode,
  city,
  setCity,
  cities,
  rewardLabel,
  delayDays,
  contactName,
  setContactName,
  contactPhone,
  setContactPhone,
  projectTypeCustom,
  setProjectTypeCustom,
  estimatedDealValue,
  setEstimatedDealValue,
  comment,
  setComment,
  submitMessage,
  lastReferralId,
  isSubmitting,
  onSubmit,
}: {
  tokenOrCode: string;
  city: keyof typeof OPPORTUNITY_TARGETS;
  setCity: (value: keyof typeof OPPORTUNITY_TARGETS) => void;
  cities: Array<keyof typeof OPPORTUNITY_TARGETS>;
  rewardLabel: string;
  delayDays: number;
  contactName: string;
  setContactName: (value: string) => void;
  contactPhone: string;
  setContactPhone: (value: string) => void;
  projectTypeCustom: string;
  setProjectTypeCustom: (value: string) => void;
  estimatedDealValue: string;
  setEstimatedDealValue: (value: string) => void;
  comment: string;
  setComment: (value: string) => void;
  submitMessage: string;
  lastReferralId: string | null;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#070B16] px-4 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-[calc(env(safe-area-inset-top)+16px)] sm:px-5">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#00D4A0]">Nouveau contact</p>
      <h2 className={`${syne.className} mt-2 text-[clamp(38px,10vw,56px)] font-black leading-[0.98]`}>20 secondes. C est tout.</h2>
      <p className="mt-2 text-[clamp(20px,5.2vw,25px)] leading-[1.28] text-white/75">
        Pas besoin de vendre. Tu indiques le besoin metier, puis Jean-Philippe dispatch manuellement.
      </p>

      <form
        className="mt-4 space-y-2.5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/45">Ville cible</p>
          <select
            value={city}
            onChange={(event) => setCity(event.target.value as keyof typeof OPPORTUNITY_TARGETS)}
            className="h-12 w-full rounded-xl border border-white/15 bg-[#161D2E] px-4 text-[17px] text-white/90"
          >
            {cities.map((item) => (
              <option key={item} value={item} className="bg-[#0C1224]">
                {item}
              </option>
            ))}
          </select>
        </div>
        <InputMock label="Prenom du contact">
          <input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Nicolas" className="h-12 w-full rounded-xl border border-white/15 bg-[#161D2E] px-4 text-[17px] text-white/90" />
        </InputMock>
        <InputMock label="Son numero WhatsApp">
          <input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="06 24 78 14 32" className="h-12 w-full rounded-xl border border-white/15 bg-[#161D2E] px-4 text-[17px] text-white/90" />
        </InputMock>
        <InputMock label="Rentrer de quel metier cette personne a besoin">
          <input
            value={projectTypeCustom}
            onChange={(event) => setProjectTypeCustom(event.target.value)}
            placeholder="Ex: Courtier, Agent immo, Plombier, Coach..."
            className="h-12 w-full rounded-xl border border-white/15 bg-[#161D2E] px-4 text-[17px] text-white/90"
          />
        </InputMock>
        <InputMock label="Valeur estimee (optionnel)">
          <input value={estimatedDealValue} onChange={(event) => setEstimatedDealValue(event.target.value)} type="number" min="1" placeholder="250000" className="h-12 w-full rounded-xl border border-white/15 bg-[#161D2E] px-4 text-[17px] text-white/90" />
        </InputMock>
        <InputMock label="Commentaire">
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Contexte, urgence..." className="min-h-[104px] w-full rounded-xl border border-white/15 bg-[#161D2E] px-4 py-3 text-[17px] text-white/90" />
        </InputMock>
      </form>

      <div className="mt-3 rounded-2xl border border-[#F5A623]/35 bg-[#F5A623]/10 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#F5A623]">Ta commission si ca aboutit</p>
        <p className="mt-1 text-sm font-bold text-white">{rewardLabel} · delai moyen {delayDays} jours</p>
        <p className="mt-1 text-[12px] text-white/80">Toutes les soumissions sont envoyees a Jean-Philippe Roth (Coach business, Dax) puis visibles aussi en admin.</p>
      </div>

      <button
        type="submit"
        onClick={onSubmit}
        disabled={isSubmitting || !tokenOrCode}
        className="mt-4 h-14 w-full rounded-xl bg-gradient-to-r from-[#00D4A0] to-[#00B887] text-[15px] font-black uppercase tracking-[0.04em] text-[#060B12] disabled:opacity-50"
      >
        {isSubmitting ? "Envoi..." : "Envoyer la mise en relation"}
      </button>
      {submitMessage ? <p className="mt-2 rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white/80">{submitMessage}</p> : null}
      {lastReferralId ? <p className="mt-2 rounded-xl border border-emerald-300/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">Enregistre. ID: {lastReferralId}</p> : null}
      {!tokenOrCode ? <p className="mt-2 text-center text-[11px] text-amber-200/85">Lien tokenise requis pour l envoi reel.</p> : null}
    </div>
  );
}

function ScreenTracking({
  latestReferral,
  referrals,
  won,
  potential,
  finalized,
  remaining,
  onOpenDetails,
  whatsappHref,
  onGoSubmit,
}: {
  latestReferral: Referral | null;
  referrals: Referral[];
  won: number;
  potential: number;
  finalized: number;
  remaining: number;
  onOpenDetails: () => void;
  whatsappHref: string | null;
  onGoSubmit: () => void;
}) {
  const first = referrals[0];
  const second = referrals[1];
  const step = first?.status === "converted" ? 3 : first?.status === "offered" ? 2 : first?.status === "validated" ? 1 : 0;
  const labels = ["Contacte", "RDV", "Offre", "Paye"];
  return (
    <div className="min-h-[100dvh] bg-[#070B16] px-4 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-[calc(env(safe-area-inset-top)+16px)] sm:px-5">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#00D4A0]">Mes commissions</p>
      <h2 className={`${syne.className} mt-2 text-[clamp(38px,10vw,56px)] font-black leading-[0.98]`}>Tout en temps reel.</h2>
      <p className="mt-2 text-[clamp(20px,5.2vw,25px)] leading-[1.28] text-white/75">Chaque mise en relation suivie jusqu au paiement.</p>

      <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#00D4A0]/35 bg-gradient-to-br from-[#00D4A0]/14 to-[#00D4A0]/6 p-3.5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#00D4A0]/80">Gagne ce mois</p>
          <p className="text-[30px] font-black leading-none text-[#00D4A0]">{Math.round(won)} EUR</p>
          <p className="text-[11px] text-white/60">sur {referrals.length} mises en relation</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-white/55">En attente</p>
          <p className="text-[18px] font-bold text-[#F5A623]">+{Math.round(Math.max(0, potential - won))} EUR</p>
        </div>
      </div>

      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.08em] text-white/45">Tes contacts en cours</p>
      <div className="mt-2 rounded-2xl border border-white/12 bg-[#161D2E] p-3.5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white">{first ? `${first.contact_name} -> ${first.project_type || "Projet"}` : "Aucun dossier en cours"}</p>
            <p className="text-[11px] text-white/55">
              {first?.created_at ? `Envoye le ${new Date(first.created_at).toLocaleDateString("fr-FR")}` : "En attente d une premiere recommandation"}
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-black text-emerald-200">{referralStatusLabel(first?.status || "")}</span>
        </div>

        <div className="mb-2 flex items-center gap-1">
          {labels.map((label, idx) => (
            <div key={label} className="flex min-w-0 flex-1 items-center gap-1">
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] ${idx <= step ? "border border-emerald-300/35 bg-emerald-400/15 text-emerald-200" : "border border-white/15 bg-white/5 text-white/45"}`}>
                {idx <= step ? (idx === 3 ? "EUR" : "✓") : "•"}
              </span>
              <span className="truncate text-[9px] text-white/50">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-2">
          <span className="text-[11px] text-white/55">Ta commission</span>
          <span className="text-sm font-bold text-emerald-200">
            {first?.final_commission
              ? `+${Math.round(first.final_commission)} EUR verses`
              : first?.estimated_commission
                ? `+${Math.round(first.estimated_commission)} EUR estimes`
                : "En attente"}
          </span>
        </div>
      </div>

      {second ? (
        <div className="mt-2 rounded-2xl border border-[#F5A623]/30 bg-[#F5A623]/10 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white">
                {second.contact_name}
                {" -> "}
                {second.project_type || "Projet"}
              </p>
              <p className="text-[11px] text-white/55">{referralStatusLabel(second.status)} en cours</p>
            </div>
            <p className="text-sm font-bold text-[#F5A623]">+{Math.round(Number(second.estimated_commission || 0))} EUR</p>
          </div>
        </div>
      ) : null}

      <div className="mt-3 rounded-2xl border border-fuchsia-300/35 bg-fuchsia-400/10 p-3.5">
        <p className="text-[10px] font-black uppercase tracking-[0.08em] text-fuchsia-100">Mon reseau eclaireurs = 0</p>
        <p className="mt-1 text-[11px] text-fuchsia-100/85">
          A partir de 5 opportunites finalisees, tu debloques ton reseau et tu touches 3% de commissions.
        </p>
        <p className="mt-1 text-[11px] font-semibold text-fuchsia-100/90">
          {remaining > 0 ? `Encore ${remaining} opportunite(s) finalisee(s).` : "Objectif atteint, reseau debloque."}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button type="button" onClick={onOpenDetails} className="h-10 rounded-xl border border-white/15 bg-white/5 text-[11px] font-semibold text-white/80">
          Voir tout
        </button>
        <button type="button" onClick={onGoSubmit} className="h-10 rounded-xl border border-[#00D4A0]/40 bg-[#00D4A0]/12 text-[11px] font-bold text-[#00D4A0]">
          + Nouveau
        </button>
        {whatsappHref ? (
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center rounded-xl border border-fuchsia-300/35 bg-fuchsia-300/12 text-[11px] font-bold text-fuchsia-100">
            WhatsApp
          </a>
        ) : (
          <span className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[11px] font-bold text-white/40">
            WhatsApp
          </span>
        )}
      </div>
      <p className="mt-2 text-[11px] text-white/55">Opportunites finalisees: {finalized}</p>
      {latestReferral ? (
        <p className="mt-1 text-[10px] text-white/40">Synchronisation membre metier active sur les statuts du dossier.</p>
      ) : null}
    </div>
  );
}

function ScreenSuggestion({
  dayLetters,
  todayDayIndex,
  streak,
  suggestion,
  selectedTargetReward,
  sponsorName,
  sponsorVille,
  importedCount,
  importedContacts,
  suggestionCandidatesCount,
  importSummary,
  importError,
  selectionMessage,
  supportsDirectContactPicker,
  isImportingContacts,
  suggestedMonthlyContacts,
  suggestedConversions,
  suggestedGain,
  onImportFile,
  onImportDirect,
  onRecommend,
  onSkip,
  onSendMassCatalogue,
  onClearContacts,
  onOpenImportHelp,
  onGoSubmit,
}: {
  dayLetters: string[];
  todayDayIndex: number;
  streak: number;
  suggestion: ImportedContact | null;
  selectedTargetReward: string;
  sponsorName: string | null;
  sponsorVille: string | null;
  importedCount: number;
  importedContacts: ImportedContact[];
  suggestionCandidatesCount: number;
  importSummary: string;
  importError: string;
  selectionMessage: string;
  supportsDirectContactPicker: boolean;
  isImportingContacts: boolean;
  suggestedMonthlyContacts: number;
  suggestedConversions: number;
  suggestedGain: number;
  onImportFile: () => void;
  onImportDirect: () => void;
  onRecommend: () => void;
  onSkip: () => void;
  onSendMassCatalogue: () => void;
  onClearContacts: () => void;
  onOpenImportHelp: () => void;
  onGoSubmit: () => void;
}) {
  const hasContacts = importedCount > 0;
  const suggestionRecruitmentHref = useMemo(() => {
    if (!suggestion) return null;
    return buildEclaireurRecruitmentWhatsappHref({
      contact: suggestion,
      sponsorName,
      sponsorVille,
      rewardLabel: selectedTargetReward,
    });
  }, [selectedTargetReward, sponsorName, sponsorVille, suggestion]);
  const validWhatsappCount = useMemo(
    () => importedContacts.filter((contact) => hasValidWhatsappNumber(contact.phone)).length,
    [importedContacts],
  );
  const showStickyMassCta = hasContacts && validWhatsappCount > 0;
  return (
    <div className="min-h-[100dvh] bg-[#070B16] px-4 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-[calc(env(safe-area-inset-top)+16px)] sm:px-5">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#F5A623]">Popey du jour</p>
      <h2 className={`${syne.className} mt-2 text-[clamp(38px,10vw,56px)] font-black leading-[0.98]`}>1 contact. 1 opportunite.</h2>
      <p className="mt-2 text-[clamp(20px,5.2vw,25px)] leading-[1.28] text-white/75">Popey analyse ton reseau et te suggere le contact le plus prometteur du jour.</p>

      <div className="mt-3 rounded-2xl border border-white/10 bg-[#161D2E] p-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-white/45">Cette semaine</p>
            <div className="mt-1 flex gap-1">
              {dayLetters.map((day, idx) => {
                const isDone = idx < todayDayIndex;
                const isToday = idx === todayDayIndex;
                return (
                  <span
                    key={day + idx}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-black ${
                      isToday ? "bg-[#00D4A0] text-[#070B16]" : isDone ? "border border-[#00D4A0]/35 bg-[#00D4A0]/10 text-[#00D4A0]" : "border border-white/10 bg-white/5 text-white/45"
                    }`}
                  >
                    {day}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[22px] font-black leading-none text-[#F5A623]">🔥 {streak}</p>
            <p className="text-[10px] uppercase tracking-[0.08em] text-white/40">jours actifs</p>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-[#161D2E] p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.08em] text-white/45">Importer tous tes contacts</p>
          <button
            type="button"
            onClick={onOpenImportHelp}
            className="inline-flex h-7 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-300/10 px-2.5 text-[10px] font-bold uppercase tracking-[0.04em] text-cyan-100"
          >
            Info
          </button>
        </div>
        {!hasContacts ? (
          <>
            <p className="mt-1 text-[13px] text-white/70">Aucun contact importe pour l instant. Charge ton annuaire pour activer les actions A et B.</p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={isImportingContacts}
                onClick={onImportFile}
                className="h-11 rounded-xl border border-[#00D4A0]/35 bg-[#00D4A0]/12 text-[12px] font-bold text-[#00D4A0] disabled:opacity-60"
              >
                {isImportingContacts ? "Import..." : "Telecharger mes contacts (.vcf/.csv)"}
              </button>
              {supportsDirectContactPicker ? (
                <button
                  type="button"
                  disabled={isImportingContacts}
                  onClick={onImportDirect}
                  className="h-10 rounded-xl border border-white/15 bg-white/5 text-[11px] font-semibold text-white/80 disabled:opacity-60"
                >
                  Autoriser acces direct telephone
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <div className="mt-2 rounded-2xl border border-[#00D4A0]/30 bg-[#00D4A0]/10 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.08em] text-[#00D4A0]/80">Contacts deja importes</p>
              <p className="mt-1 text-[30px] font-black leading-none text-[#00D4A0]">{importedCount}</p>
              <p className="text-[12px] text-[#00D4A0]/80">contacts disponibles</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isImportingContacts}
                onClick={onImportFile}
                className="h-11 rounded-xl border border-[#00D4A0]/35 bg-[#00D4A0]/12 text-[12px] font-bold text-[#00D4A0] disabled:opacity-60"
              >
                Ajouter d autres
              </button>
              <button
                type="button"
                onClick={onClearContacts}
                className="h-11 rounded-xl border border-red-300/35 bg-red-500/10 text-[12px] font-bold text-red-200"
              >
                Supprimer contacts
              </button>
            </div>
            {supportsDirectContactPicker ? (
              <button
                type="button"
                disabled={isImportingContacts}
                onClick={onImportDirect}
                className="mt-2 h-10 w-full rounded-xl border border-white/15 bg-white/5 text-[11px] font-semibold text-white/80 disabled:opacity-60"
              >
                Ajouter depuis acces direct telephone
              </button>
            ) : null}
          </>
        )}
        <p className="mt-2 text-[12px] text-white/65">{importSummary || `${importedCount} contact(s) importe(s)`}</p>
        {importError ? <p className="mt-2 rounded-lg border border-red-300/35 bg-red-500/10 px-2 py-1 text-[11px] text-red-200">{importError}</p> : null}
      </div>

      <div className="mt-3 rounded-2xl border border-[#00D4A0]/20 bg-[#0D1424] p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#00D4A0]/80">2 types d action a mener</p>
        <div className="mt-2 space-y-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-2.5">
            <p className="text-[11px] font-bold text-white">A. Envoi en masse</p>
            <p className="mt-1 text-[10px] text-white/70">
              Clique pour ouvrir WhatsApp puis selectionner plusieurs contacts d un coup.
            </p>
            <button
              type="button"
              onClick={onSendMassCatalogue}
              className="mt-2 h-12 w-full rounded-xl border border-[#25D366]/55 bg-gradient-to-r from-[#25D366]/30 to-[#1FAA54]/20 text-[12px] font-black uppercase tracking-[0.04em] text-[#25D366] shadow-[0_8px_22px_rgba(37,211,102,0.18)]"
            >
              💬 Envoyer le catalogue a plusieurs contacts
            </button>
            <p className="mt-2 text-[10px] text-white/55">Tu choisis les destinataires directement dans WhatsApp, puis tu envoies en 1 fois.</p>
            <p className="mt-2 text-[11px] text-white/65">
              {validWhatsappCount} contact(s) avec numero WhatsApp valide detecte(s).
            </p>
            {selectionMessage ? <p className="mt-2 text-[11px] text-white/70">{selectionMessage}</p> : null}
          </div>

          <div className="rounded-xl border border-[#00D4A0]/25 bg-[#00D4A0]/8 p-2.5">
            <p className="text-[11px] font-bold text-white">B. Recommandation eclaireur</p>
            <p className="mt-1 text-[10px] text-white/70">
              Envoie un message WhatsApp a quelqu un pour qu il devienne apporteur d affaires contre commission.
            </p>
            {suggestion ? (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#00D4A0]/35 bg-[#00D4A0]/10 text-sm font-black text-[#00D4A0]">
                    {contactInitials(suggestion.name)}
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-white">{suggestion.name}</p>
                    <p className="text-[11px] text-white/50">{[suggestion.city, suggestion.companyHint].filter(Boolean).join(" · ") || "Contact importe"}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[12px] text-white/75">Commission cible</p>
                  <p className="text-[20px] font-black text-[#00D4A0]">+{selectedTargetReward}</p>
                </div>
                <div className="mt-2 flex flex-col gap-2">
                  {suggestionRecruitmentHref ? (
                    <a
                      href={suggestionRecruitmentHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#25D366]/55 bg-[#25D366]/20 text-[12px] font-black uppercase tracking-[0.04em] text-[#25D366]"
                    >
                      Envoyer message eclaireur
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={onRecommend}
                      className="h-11 w-full rounded-xl border border-amber-300/45 bg-amber-300/12 text-[12px] font-bold text-amber-100"
                    >
                      Numero WhatsApp manquant · Remplir manuellement
                    </button>
                  )}
                  {!suggestionRecruitmentHref ? (
                    <p className="text-[10px] text-amber-100/85">
                      Ce contact n a pas de numero WhatsApp valide. Utilise &quot;Remplir manuellement&quot; ou &quot;Pas lui&quot;.
                    </p>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onRecommend}
                    className="h-11 rounded-xl bg-gradient-to-r from-[#00D4A0] to-[#00B887] text-[12px] font-black uppercase tracking-[0.04em] text-[#060B12]"
                  >
                    Recommandation manuelle
                  </button>
                  <button
                    type="button"
                    onClick={onSkip}
                    className="h-11 rounded-xl border border-white/15 bg-white/5 text-[12px] font-semibold text-white/70"
                  >
                    Pas lui
                  </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-2 rounded-lg border border-white/10 bg-black/25 px-3 py-4 text-center">
                <p className="text-sm text-white/70">
                  {importedCount > 0 && suggestionCandidatesCount === 0
                    ? "Contacts importes, mais aucun numero WhatsApp exploitable. Verifie le format du numero ou reimporte en .vcf."
                    : "Importe tes contacts pour activer la recommandation eclaireur."}
                </p>
                <button
                  type="button"
                  onClick={onGoSubmit}
                  className="mt-2 h-9 rounded-lg border border-[#00D4A0]/35 bg-[#00D4A0]/12 px-3 text-[11px] font-bold text-[#00D4A0]"
                >
                  Aller au formulaire manuel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-[#161D2E] p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.08em] text-white/45">Ton potentiel si tu joues chaque jour</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xl font-black leading-none text-[#00D4A0]">{suggestedMonthlyContacts}</p>
            <p className="text-[9px] text-white/45">contacts / mois</p>
          </div>
          <div>
            <p className="text-xl font-black leading-none text-[#F5A623]">{suggestedConversions}</p>
            <p className="text-[9px] text-white/45">conversions estimees</p>
          </div>
          <div>
            <p className="text-xl font-black leading-none text-emerald-300">{suggestedGain} EUR</p>
            <p className="text-[9px] text-white/45">ce mois</p>
          </div>
        </div>
      </div>

      {showStickyMassCta ? (
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+86px)] z-20 mt-3 rounded-2xl border border-[#25D366]/45 bg-[#0A1322]/92 p-2 backdrop-blur">
          <button
            type="button"
            onClick={onSendMassCatalogue}
            className="h-11 w-full rounded-xl border border-[#25D366]/60 bg-gradient-to-r from-[#25D366]/35 to-[#1FAA54]/22 text-[12px] font-black uppercase tracking-[0.04em] text-[#25D366] shadow-[0_8px_24px_rgba(37,211,102,0.18)] animate-[pulse_2.2s_ease-in-out_infinite]"
          >
            💬 Envoyer le catalogue maintenant
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PhoneFrame({
  children,
  activeScreen,
  onChangeScreen,
}: {
  children: ReactNode;
  activeScreen: number;
  onChangeScreen: (value: number) => void;
}) {
  return (
    <article className="relative min-h-[100dvh] bg-[#070B16]">
      {children}
      <nav className="pointer-events-auto absolute inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)]">
        <div className="grid grid-cols-4 gap-2 rounded-[22px] border border-white/15 bg-[#0E1213]/95 p-2 shadow-[0_12px_42px_rgba(0,0,0,0.45)] backdrop-blur">
          {[
            { label: "Accueil", idx: 0 },
            { label: "Soumettre", idx: 1 },
            { label: "Suivi", idx: 2 },
            { label: "Suggestion", idx: 3 },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onChangeScreen(item.idx)}
              className={`h-11 rounded-xl text-[11px] font-black uppercase tracking-[0.06em] ${
                activeScreen === item.idx
                  ? "bg-[#00D4A0] text-[#060B12] shadow-[0_6px_24px_rgba(0,212,160,0.35)]"
                  : "border border-white/20 bg-black/25 text-white/80"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </article>
  );
}

function StatCard({ title, value, sub, tone }: { title: string; value: string; sub: string; tone: "teal" | "amber" }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#161D2E] p-4">
      <p className="text-[11px] uppercase tracking-[0.08em] text-white/45">{title}</p>
      <p className={`mt-1 text-[clamp(26px,6vw,34px)] font-black leading-none ${tone === "teal" ? "text-[#00D4A0]" : "text-[#F5A623]"}`}>{value}</p>
      <p className="mt-1 text-[12px] text-white/50">{sub}</p>
    </div>
  );
}

function InputMock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/45">{label}</p>
      {children}
    </div>
  );
}
