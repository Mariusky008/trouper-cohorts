"use client";

import { useMemo, useRef, useState } from "react";

type ScanProspect = {
  externalId: string;
  fullName: string;
  metier: string;
  requestedMetier: string;
  city: string;
  phoneE164: string | null;
  rating: number | null;
};

type ScanResponse = {
  success: boolean;
  error?: string;
  warning?: string | null;
  prospects?: ScanProspect[];
  scanMeta?: {
    searchTerms?: string[];
    fallbackUsed?: boolean;
    rawCount?: number;
  } | null;
};

type MetierScanStatus = {
  metier: string;
  status: "pending" | "success" | "empty" | "error";
  count: number;
  detail: string | null;
};

type EnqueueResponse = {
  success: boolean;
  error?: string;
  campaignId?: string;
  queued?: number;
  skippedBlacklisted?: number;
  skippedAlreadyContacted?: number;
  totalInput?: number;
};

const SCAN_BATCH_SIZE = 10;
const QUEUE_MAX_DELAY_MINUTES = 10;

const METIERS_CIBLES = [
  "Pisciniste (Entretien ou construction)",
  "Élagueur",
  "Nettoyage de toiture / Façade",
  "Architecte d'intérieur / Décorateur",
  "Cuisiniste",
  "Menuisier (Portails, terrasses bois)",
  "Storiste / Volets roulants",
  "Entreprise de nettoyage (Aide au ménage ou grand nettoyage de printemps)",
  "Déménageur",
  "Garde-meuble / Self-stockage",
  "Ramoneur",
  "Vente de poêles à bois / Granulés",
  "Restaurants / Bar",
  "Coach sportif à domicile",
  "Studio de Yoga / Pilates",
  "Institut de beauté (Soins du visage/corps)",
  "Centre d'amincissement / Cryothérapie",
  "Barbière / Coiffeur créateur",
  "Prothésiste ongulaire",
  "Réflexologue / Sophrologue",
  "Ostéopathe / Masseur bien-être",
  "Blanchiment dentaire / Sourire",
  "Tatoueur",
  "Nettoyage auto à domicile (Intérieur/Extérieur)",
  "Réparation de pare-brise",
  "Vente de vélos électriques / Réparateur",
  "Contrôle technique",
  "Auto-école",
  "Toiletteur canin",
  "Éducateur canin / Comportementaliste",
  "Pet-sitter / Pension pour chiens et chats",
  "Photographe (Grossesse, mariage, portrait)",
  "Traiteur / Chef à domicile",
  "Organisateur d'anniversaires enfants",
  "Caviste",
  "Boutique de fleurs / Ateliers floraux",
  "Magasin de jeux de société / Escape Game local",
  "Food-truck local",
  "Pâtissier / Cake Designer",
  "Soutien scolaire / Cours d'anglais",
  "Garde d'enfants (Babysitting structuré)",
  "Coach de vie / Conseil conjugal",
  "Informaticien (Dépannage PC / Installation Box)",
  "Agent immobilier indépendant",
  "Courtier en prêt immobilier",
  "Assureur (Auto / Habitation / Santé)",
  "Conseiller en gestion de patrimoine",
  "Courtier en travaux",
  "Pompes funèbres / Marbrerie",
  "Vente et installation d'alarmes / Télésurveillance",
];

function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className || ""}`}
      aria-hidden
    />
  );
}

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function safeParseJson<T>(raw: string): { data: T | null; parseError: string | null } {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return { data: null, parseError: "Réponse vide." };
  try {
    return { data: JSON.parse(trimmed) as T, parseError: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "JSON parse error.";
    return { data: null, parseError: message };
  }
}

function formatApiError(status: number, raw: string, parsed: { data: { error?: unknown } | null; parseError: string | null }) {
  const payloadError = parsed.data?.error;
  let message = "";
  if (typeof payloadError === "string" && payloadError.trim()) {
    message = payloadError.trim();
  } else if (payloadError && typeof payloadError === "object") {
    const record = payloadError as Record<string, unknown>;
    const nested =
      String(record.message || record.error || record.detail || record.statusText || "")
        .trim();
    message = nested || JSON.stringify(payloadError);
  }
  if (!message) {
    message = raw.slice(0, 500) || parsed.parseError || "Erreur inconnue.";
  }
  return `${status} — ${message}`.slice(0, 800);
}

function mergeProspectLists(current: ScanProspect[], incoming: ScanProspect[]) {
  const byKey = new Map<string, ScanProspect>();
  [...current, ...incoming].forEach((prospect) => {
    const key = String(prospect.phoneE164 || "").trim() || `external:${prospect.externalId}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, prospect);
      return;
    }
    const existingRating = Number(existing.rating || 0);
    const nextRating = Number(prospect.rating || 0);
    if (nextRating >= existingRating) byKey.set(key, prospect);
  });
  return Array.from(byKey.values()).slice(0, 800);
}

function buildAutoSelectedPhones(items: ScanProspect[]) {
  const next: Record<string, boolean> = {};
  const byMetier = new Map<string, ScanProspect[]>();
  items.forEach((p) => {
    const key = normalizeText(p.requestedMetier || p.metier || "Autres");
    if (!byMetier.has(key)) byMetier.set(key, []);
    byMetier.get(key)!.push(p);
  });
  byMetier.forEach((rows) => {
    const bestWithPhone = rows
      .filter((p) => Boolean(p.phoneE164))
      .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))[0];
    if (bestWithPhone?.phoneE164) next[bestWithPhone.phoneE164] = true;
  });
  return next;
}

export default function AdminHumainCampagnePage() {
  const [city, setCity] = useState("Dax");
  const [audience, setAudience] = useState(12500);
  const [greeting, setGreeting] = useState("Madame, Monsieur");
  const [limitPerMetier, setLimitPerMetier] = useState(3);
  const [minDelayMinutes, setMinDelayMinutes] = useState(3);
  const [maxDelayMinutes, setMaxDelayMinutes] = useState(8);
  const [maxToQueue, setMaxToQueue] = useState(50);
  const [contentSid, setContentSid] = useState("");

  const [loadingScan, setLoadingScan] = useState(false);
  const [loadingEnqueue, setLoadingEnqueue] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanWarning, setScanWarning] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [enqueueResult, setEnqueueResult] = useState<EnqueueResponse | null>(null);
  const [prospects, setProspects] = useState<ScanProspect[]>([]);
  const [selectedPhones, setSelectedPhones] = useState<Record<string, boolean>>({});
  const [scanOffset, setScanOffset] = useState(0);
  const [metierStatuses, setMetierStatuses] = useState<MetierScanStatus[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, ScanProspect[]>();
    prospects.forEach((p) => {
      const key = normalizeText(p.requestedMetier || p.metier || "Autres");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    map.forEach((items, key) => {
      map.set(
        key,
        items.sort((a, b) => {
          const aHasPhone = a.phoneE164 ? 1 : 0;
          const bHasPhone = b.phoneE164 ? 1 : 0;
          if (aHasPhone !== bHasPhone) return bHasPhone - aHasPhone;
          const ar = Number(a.rating || 0);
          const br = Number(b.rating || 0);
          if (ar !== br) return br - ar;
          return a.fullName.localeCompare(b.fullName);
        }),
      );
    });
    return map;
  }, [prospects]);

  const selectedCount = useMemo(() => Object.values(selectedPhones).filter(Boolean).length, [selectedPhones]);
  const scannedMetiersCount = Math.min(scanOffset, METIERS_CIBLES.length);
  const remainingMetiersCount = Math.max(0, METIERS_CIBLES.length - scannedMetiersCount);
  const canLoadMore = scanOffset > 0 && remainingMetiersCount > 0;

  function autoSelectOnePerMetier(items: ScanProspect[]) {
    setSelectedPhones(buildAutoSelectedPhones(items));
  }

  async function runScan(options?: { append?: boolean }) {
    const append = Boolean(options?.append);
    const startOffset = append ? scanOffset : 0;
    const metiersBatch = METIERS_CIBLES.slice(startOffset, startOffset + SCAN_BATCH_SIZE);
    if (metiersBatch.length === 0) return;
    setScanError(null);
    setScanWarning(null);
    setScanStatus(null);
    setEnqueueResult(null);
    setLoadingScan(true);
    if (!append) {
      setProspects([]);
      setSelectedPhones({});
      setScanOffset(0);
      setMetierStatuses([]);
    }
    try {
      let nextList = append ? [...prospects] : [];
      let successCount = 0;
      const warningMessages: string[] = [];
      let firstError: string | null = null;

      for (let index = 0; index < metiersBatch.length; index += 1) {
        const metier = metiersBatch[index] || "";
        setScanStatus(`Scan ${startOffset + index + 1}/${METIERS_CIBLES.length} · ${metier}`);
        setMetierStatuses((current) => {
          const filtered = current.filter((item) => item.metier !== metier);
          return [...filtered, { metier, status: "pending", count: 0, detail: null }];
        });

        const response = await fetch("/api/admin/humain/campagne/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          redirect: "manual",
          body: JSON.stringify({
            city,
            provider: "b2b",
            metiers: [metier],
            limitPerMetier,
          }),
        });
        const raw = await response.text();
        const parsed = safeParseJson<ScanResponse>(raw);
        const data = parsed.data;
        if (!data || !data.success) {
          const formatted = formatApiError(response.status, raw, parsed);
          if (!firstError) firstError = formatted;
          warningMessages.push(`${metier}: ${formatted}`);
          setMetierStatuses((current) => {
            const filtered = current.filter((item) => item.metier !== metier);
            return [...filtered, { metier, status: "error", count: 0, detail: formatted }];
          });
          setScanOffset(startOffset + index + 1);
          continue;
        }

        if (data.warning) warningMessages.push(`${metier}: ${String(data.warning)}`);
        const incoming = (data.prospects || []).slice(0, 800);
        const fallbackUsed = Boolean(data.scanMeta?.fallbackUsed);
        const searchTerms = Array.isArray(data.scanMeta?.searchTerms)
          ? data.scanMeta?.searchTerms?.map((item) => String(item || "").trim()).filter(Boolean)
          : [];
        const statusDetail =
          incoming.length > 0
            ? fallbackUsed && searchTerms.length > 0
              ? `fallback: ${searchTerms.join(" | ")}`
              : "resultat direct"
            : fallbackUsed && searchTerms.length > 0
              ? `0 resultat apres fallback: ${searchTerms.join(" | ")}`
              : "0 resultat";
        nextList = mergeProspectLists(nextList, incoming);
        setProspects(nextList);
        setMetierStatuses((current) => {
          const filtered = current.filter((item) => item.metier !== metier);
          return [
            ...filtered,
            {
              metier,
              status: incoming.length > 0 ? "success" : "empty",
              count: incoming.length,
              detail: statusDetail,
            },
          ];
        });
        const autoSelection = buildAutoSelectedPhones(nextList);
        if (append) {
          setSelectedPhones((current) => ({ ...autoSelection, ...current }));
        } else {
          setSelectedPhones(autoSelection);
        }
        setScanOffset(startOffset + index + 1);
        successCount += 1;
      }

      if (successCount === 0) {
        setScanError(firstError || "Scan impossible.");
        if (!append) {
          setProspects([]);
          setSelectedPhones({});
        }
        return;
      }

      setScanWarning(warningMessages.length ? warningMessages.slice(0, 3).join(" | ").slice(0, 800) : null);
      setTimeout(() => {
        listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Scan impossible.");
      setProspects([]);
      setSelectedPhones({});
    } finally {
      setScanStatus(null);
      setLoadingScan(false);
    }
  }

  async function enqueueCampaign() {
    setLoadingEnqueue(true);
    setEnqueueResult(null);
    try {
      const selected = prospects
        .filter((p) => p.phoneE164 && selectedPhones[p.phoneE164])
        .slice(0, Math.max(1, maxToQueue))
        .map((p) => ({
          phoneE164: p.phoneE164!,
          metier: normalizeText(p.requestedMetier || p.metier),
          fullName: p.fullName,
          requestedMetier: p.requestedMetier,
        }));
      const response = await fetch("/api/admin/humain/campagne/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        redirect: "manual",
        body: JSON.stringify({
          city,
          audience,
          greeting,
          minDelayMinutes,
          maxDelayMinutes,
          maxToQueue,
          contentSid: contentSid.trim() || undefined,
          prospects: selected,
        }),
      });
      const raw = await response.text();
      const parsed = safeParseJson<EnqueueResponse>(raw);
      const data = parsed.data;
      if (!data || !data.success) {
        setEnqueueResult({
          success: false,
          error: formatApiError(response.status, raw, parsed),
        });
        return;
      }
      setEnqueueResult(data);
    } catch (error) {
      setEnqueueResult({ success: false, error: error instanceof Error ? error.message : "Enqueue impossible." });
    } finally {
      setLoadingEnqueue(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Campagne</p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">Prospection automatique (WhatsApp)</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
          Scan des pros par métier sur une ville, puis programmation d’envois WhatsApp (template) avec cadence.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <label className="space-y-1 rounded-xl border bg-slate-50 p-3">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Ville</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1 rounded-xl border bg-slate-50 p-3">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Audience</span>
            <input
              type="number"
              value={audience}
              onChange={(e) => setAudience(Number(e.target.value))}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 rounded-xl border bg-slate-50 p-3">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Formule</span>
            <input
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 rounded-xl border bg-slate-50 p-3">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Résultats / métier</span>
            <input
              type="number"
              value={limitPerMetier}
              onChange={(e) => setLimitPerMetier(Number(e.target.value))}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 rounded-xl border bg-slate-50 p-3">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Cadence min (min)</span>
            <input
              type="number"
              value={minDelayMinutes}
              min={1}
              max={QUEUE_MAX_DELAY_MINUTES}
              onChange={(e) => {
                const next = Math.max(1, Math.min(QUEUE_MAX_DELAY_MINUTES, Number(e.target.value) || 1));
                setMinDelayMinutes(next);
                setMaxDelayMinutes((current) => Math.max(next, Math.min(QUEUE_MAX_DELAY_MINUTES, current)));
              }}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-500">Max 10 min par envoi pour rester compatible avec la queue WhatsApp.</p>
          </label>
          <label className="space-y-1 rounded-xl border bg-slate-50 p-3">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Cadence max (min)</span>
            <input
              type="number"
              value={maxDelayMinutes}
              min={1}
              max={QUEUE_MAX_DELAY_MINUTES}
              onChange={(e) => {
                const next = Math.max(minDelayMinutes, Math.min(QUEUE_MAX_DELAY_MINUTES, Number(e.target.value) || minDelayMinutes));
                setMaxDelayMinutes(next);
              }}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-500">La campagne espace les messages dans cette fourchette, puis les planifie dans la file.</p>
          </label>
          <label className="space-y-1 rounded-xl border bg-slate-50 p-3">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Max à envoyer</span>
            <input
              type="number"
              value={maxToQueue}
              onChange={(e) => setMaxToQueue(Number(e.target.value))}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 rounded-xl border bg-slate-50 p-3">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Content SID (optionnel)</span>
            <input
              value={contentSid}
              onChange={(e) => setContentSid(e.target.value)}
              placeholder="HX..."
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void runScan()}
            disabled={loadingScan}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {loadingScan ? <Spinner className="text-white" /> : null}
            Scanner 10 métiers
          </button>
          <button
            type="button"
            onClick={() => void runScan({ append: true })}
            disabled={loadingScan || !canLoadMore}
            className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-bold text-slate-800 disabled:opacity-60"
          >
            {loadingScan ? <Spinner className="text-slate-700" /> : null}
            Charger la suite
          </button>
          <button
            type="button"
            onClick={() => autoSelectOnePerMetier(prospects)}
            disabled={prospects.length === 0 || loadingScan}
            className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-bold text-slate-800 disabled:opacity-60"
          >
            Sélectionner 1 / métier
          </button>
          <button
            type="button"
            onClick={enqueueCampaign}
            disabled={selectedCount === 0 || loadingEnqueue}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {loadingEnqueue ? <Spinner className="text-white" /> : null}
            Programmer l’envoi
          </button>
        </div>

        {scanError ? <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{scanError}</p> : null}
        {scanWarning ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{scanWarning}</p>
        ) : null}
        {scanStatus ? <p className="mt-3 text-sm font-medium text-slate-700">{scanStatus}</p> : null}
        <p className="mt-3 text-sm text-slate-600">
          Progression scan: {scannedMetiersCount}/{METIERS_CIBLES.length} métiers chargés
          {remainingMetiersCount > 0 ? ` · ${remainingMetiersCount} restant(s)` : " · scan terminé"}
        </p>
        {metierStatuses.length > 0 ? (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {metierStatuses.map((item) => {
              const tone =
                item.status === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : item.status === "empty"
                    ? "border-slate-200 bg-slate-50 text-slate-700"
                    : item.status === "error"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-amber-200 bg-amber-50 text-amber-800";
              const label =
                item.status === "success"
                  ? `${item.count} trouvé(s)`
                  : item.status === "empty"
                    ? "0 résultat"
                    : item.status === "error"
                      ? "erreur"
                      : "scan en cours";
              return (
                <div key={item.metier} className={`rounded-xl border px-3 py-2 text-sm ${tone}`}>
                  <p className="font-bold">{item.metier}</p>
                  <p>{label}</p>
                  {item.detail ? <p className="text-xs opacity-80">{item.detail}</p> : null}
                </div>
              );
            })}
          </div>
        ) : null}
        {enqueueResult ? (
          <div
            className={`mt-3 rounded-xl border p-3 text-sm ${enqueueResult.success ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-700"}`}
          >
            {enqueueResult.success ? (
              <div className="space-y-1">
                <p className="font-bold">Campagne programmée.</p>
                <p>
                  queued: {enqueueResult.queued} · blacklisted: {enqueueResult.skippedBlacklisted} · déjà contactés:{" "}
                  {enqueueResult.skippedAlreadyContacted}
                </p>
                <p className="text-xs opacity-80">campaign_id: {enqueueResult.campaignId}</p>
              </div>
            ) : (
              <p>{enqueueResult.error}</p>
            )}
          </div>
        ) : null}
      </div>

      <div ref={listRef} className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-600">Résultats</p>
            <h2 className="mt-1 text-xl font-black">
              {prospects.length} prospects · {selectedCount} sélectionnés
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedPhones({});
            }}
            disabled={prospects.length === 0}
            className="rounded-full border bg-white px-4 py-2 text-sm font-bold text-slate-800 disabled:opacity-60"
          >
            Tout désélectionner
          </button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {Array.from(grouped.entries()).map(([metierKey, rows]) => {
            const shown = rows.slice(0, 6);
            const selectedInGroup = rows.filter((p) => p.phoneE164 && selectedPhones[p.phoneE164]).length;
            return (
              <article key={metierKey} className="rounded-xl border bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">{metierKey}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {rows.length} trouvés · {selectedInGroup} sélectionnés
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const best = rows.find((p) => p.phoneE164);
                      if (!best?.phoneE164) return;
                      setSelectedPhones((current) => ({ ...current, [best.phoneE164!]: true }));
                    }}
                    className="rounded-full border bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-700"
                  >
                    Choisir 1
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {shown.map((p) => {
                    const phone = p.phoneE164;
                    const checked = phone ? Boolean(selectedPhones[phone]) : false;
                    return (
                      <label
                        key={`${p.externalId}_${phone || "no_phone"}`}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-3 ${checked ? "border-emerald-300 bg-emerald-50" : "border-slate-200"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!phone}
                          onChange={(e) => {
                            if (!phone) return;
                            setSelectedPhones((current) => ({ ...current, [phone]: e.target.checked }));
                          }}
                          className="mt-1"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{p.fullName}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-600">
                            {p.city} · {p.metier}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {phone ? phone : "Téléphone manquant"} {p.rating ? `· ⭐ ${p.rating}` : ""}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
