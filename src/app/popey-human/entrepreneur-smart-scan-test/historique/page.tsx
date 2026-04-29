"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type RadarHistoryContact = {
  id: string;
  run_id: string;
  prospect_id: string;
  full_name: string;
  metier: string | null;
  city: string | null;
  distance_km: number | null;
  message_draft: string | null;
  selected: boolean;
  whatsapp_opened_at: string | null;
  sent_declared_at: string | null;
  is_duplicate: boolean;
  duplicate_reason: string | null;
  created_at: string;
};

type RadarHistoryRun = {
  run: {
    id: string;
    city: string;
    source_metier: string | null;
    target_count: number;
    selected_count: number;
    sent_count: number;
    status: "started" | "completed" | "failed";
    created_at: string;
  };
  contacts: RadarHistoryContact[];
  duplicate_count: number;
  opened_count: number;
  selected_count: number;
};

export default function SmartScanRadarHistoryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "sent" | "duplicates" | "pending" | "converted">("all");
  const [runs, setRuns] = useState<RadarHistoryRun[]>([]);

  useEffect(() => {
    let isCancelled = false;
    async function load() {
      setIsLoading(true);
      setApiError("");
      try {
        const params = new URLSearchParams({
          limit: "60",
          filter,
        });
        if (query.trim()) params.set("q", query.trim());
        const response = await fetch(`/api/popey-human/smart-scan/radar/history?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => ({}))) as { error?: string; runs?: RadarHistoryRun[] };
        if (!response.ok) {
          throw new Error(payload.error || "Impossible de charger l'historique Radar.");
        }
        if (!isCancelled) {
          setRuns(payload.runs || []);
        }
      } catch (error) {
        if (!isCancelled) {
          setApiError(error instanceof Error ? error.message : "Impossible de charger l'historique Radar.");
          setRuns([]);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }
    void load();
    return () => {
      isCancelled = true;
    };
  }, [filter, query]);

  const totals = useMemo(() => {
    const totalTargets = runs.reduce((sum, item) => sum + Math.max(0, Number(item.run.target_count || 0)), 0);
    const totalMessages = runs.reduce((sum, item) => sum + Math.max(0, Number(item.run.sent_count || 0)), 0);
    const totalOpened = runs.reduce((sum, item) => sum + Math.max(0, Number(item.opened_count || 0)), 0);
    const totalDuplicates = runs.reduce((sum, item) => sum + Math.max(0, Number(item.duplicate_count || 0)), 0);
    const converted = runs.filter((item) => Number(item.run.sent_count || 0) > 0 && Number(item.opened_count || 0) > 0).length;
    const pending = Math.max(0, totalMessages - totalOpened);
    const responseRate = totalMessages > 0 ? Math.round((totalOpened / totalMessages) * 1000) / 10 : 0;
    return { totalTargets, totalMessages, totalOpened, totalDuplicates, converted, pending, responseRate };
  }, [runs]);

  const filteredRuns = useMemo(() => {
    return runs.filter((item) => {
      if (filter === "duplicates" && item.duplicate_count <= 0) return false;
      if (filter === "sent" && item.run.sent_count <= 0) return false;
      if (filter === "pending" && item.run.sent_count - item.opened_count <= 0) return false;
      if (filter === "converted" && !(item.run.sent_count > 0 && item.opened_count > 0)) return false;
      return true;
    });
  }, [filter, runs]);

  const duplicateRuns = filteredRuns.filter((item) => item.duplicate_count > 0);
  const highlightDuplicateRun = duplicateRuns[0] || null;

  function formatShortDate(value: string) {
    return new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  }

  function formatRecentLabel(value: string) {
    const date = new Date(value);
    const now = new Date();
    const ms = now.getTime() - date.getTime();
    const dayDiff = Math.floor(ms / (24 * 60 * 60 * 1000));
    if (dayDiff <= 0) return "Aujourd'hui";
    if (dayDiff === 1) return "Hier";
    if (dayDiff <= 7) return `Il y a ${dayDiff}j`;
    return formatShortDate(value);
  }

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/popey-human/entrepreneur-smart-scan-test?panel=alliances");
  }

  return (
    <main className="min-h-screen bg-[#05070E] text-white">
      <div className="mx-auto w-full max-w-xl bg-[radial-gradient(120%_70%_at_50%_-10%,rgba(48,78,122,0.45),transparent_65%)] px-4 pb-28 pt-[max(env(safe-area-inset-top),12px)]">
        <header className="sticky top-0 z-20 -mx-4 border-b border-white/5 bg-[#05070E]/95 px-4 pb-3 backdrop-blur-xl">
          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={handleBack} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#141C2E] text-[18px] text-white/75">
              ←
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[35px] font-black leading-[0.9] tracking-[-0.02em] text-white">Historique</p>
              <p className="text-[13px] font-semibold text-white/32">Requêtes Mode Radar</p>
            </div>
            <button type="button" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/15 bg-[#141C2E] text-[19px] text-white/80">
              ⬇
            </button>
          </div>
          <div className="relative mt-3">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[17px] text-white/28">🔎</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un métier, une ville..."
              className="h-14 w-full rounded-[18px] border border-white/12 bg-[#141E33] px-11 text-[17px] font-semibold text-white/90 placeholder:text-white/28"
            />
          </div>
        </header>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: "all" as const, label: `Tous · ${totals.totalTargets}` },
            { id: "sent" as const, label: `✅ Envoyés · ${totals.totalMessages}` },
            { id: "duplicates" as const, label: `⚠ Doublons · ${totals.totalDuplicates}` },
            { id: "pending" as const, label: `📊 Sans rép · ${totals.pending}` },
            { id: "converted" as const, label: `📈 Convertis · ${totals.converted}` },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={`shrink-0 rounded-full border px-4 py-2.5 text-[13px] font-black leading-none ${
                filter === chip.id
                  ? chip.id === "duplicates"
                    ? "border-rose-400/45 bg-rose-400/10 text-rose-300"
                    : "border-[#00D4A0]/45 bg-[#00D4A0]/12 text-[#00D4A0]"
                  : "border-white/12 bg-[#0E1420] text-white/60"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="rounded-[16px] border border-white/12 bg-[#0E1420] px-2 py-3 text-center shadow-[0_16px_36px_-28px_rgba(0,0,0,0.95)]">
            <p className="text-[30px] font-black leading-[0.88] text-[#00EAB6]">{totals.totalMessages}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/38">Msgs total</p>
          </div>
          <div className="rounded-[16px] border border-white/12 bg-[#0E1420] px-2 py-3 text-center shadow-[0_16px_36px_-28px_rgba(0,0,0,0.95)]">
            <p className="text-[30px] font-black leading-[0.88] text-[#FFC64C]">{totals.responseRate}%</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/38">Taux rép.</p>
          </div>
          <div className="rounded-[16px] border border-white/12 bg-[#0E1420] px-2 py-3 text-center shadow-[0_16px_36px_-28px_rgba(0,0,0,0.95)]">
            <p className="text-[30px] font-black leading-[0.88] text-rose-300">{totals.totalDuplicates}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/38">Doublons</p>
          </div>
          <div className="rounded-[16px] border border-white/12 bg-[#0E1420] px-2 py-3 text-center shadow-[0_16px_36px_-28px_rgba(0,0,0,0.95)]">
            <p className="text-[30px] font-black leading-[0.88] text-emerald-200">{totals.converted}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/38">Convertis</p>
          </div>
        </div>

        {apiError ? (
          <p className="mt-3 rounded-xl border border-amber-300/35 bg-amber-300/10 px-3 py-2 text-[12px] text-amber-100">{apiError}</p>
        ) : null}

        {highlightDuplicateRun && (
          <>
            <div className="mt-5 flex items-center justify-between">
              <p className="text-[21px] font-black uppercase tracking-[0.08em] text-white/40">⚠ Doublons détectés</p>
              <p className="text-[16px] font-black text-[#00EAB6]">À traiter</p>
            </div>
            <article className="mt-2 overflow-hidden rounded-[22px] border border-rose-400/35 bg-[linear-gradient(160deg,rgba(255,56,104,0.16),#0E1420_52%)] px-3 py-3">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-rose-300/45 bg-rose-400/10 text-[21px]">🦴</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[28px] font-black leading-[1] text-white">{highlightDuplicateRun.run.source_metier || "Requête Radar"}</p>
                      <p className="mt-0.5 text-[14px] text-white/60">📍 {highlightDuplicateRun.run.city}</p>
                    </div>
                    <p className="shrink-0 text-[16px] font-semibold text-white/35">{formatRecentLabel(highlightDuplicateRun.run.created_at)}</p>
                  </div>
                  <div className="mt-2 inline-flex rounded-full border border-rose-300/35 bg-rose-400/10 px-3 py-1 text-[12px] font-black text-rose-200">
                    ⚠ {highlightDuplicateRun.duplicate_count} contacts déjà envoyés dans cette requête
                  </div>
                  <div className="mt-2 rounded-[14px] border border-rose-300/35 bg-rose-500/10 px-3 py-2 text-[12px] font-semibold text-rose-100">
                    {(highlightDuplicateRun.contacts || [])
                      .filter((contact) => contact.is_duplicate)
                      .slice(0, 3)
                      .map((contact) => contact.full_name)
                      .join(", ") || "Contact déjà approché récemment. Ne pas renvoyer."}
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[12px] text-white/65">
                      <span>WhatsApp envoyés</span>
                      <span>{highlightDuplicateRun.run.sent_count} / {Math.max(1, highlightDuplicateRun.run.target_count)}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/12">
                      <div
                        className="h-full rounded-full bg-[#00D4A0]"
                        style={{ width: `${Math.max(4, Math.min(100, Math.round((highlightDuplicateRun.run.sent_count / Math.max(1, highlightDuplicateRun.run.target_count)) * 100)))}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[12px] text-white/65">
                      <span>Réponses reçues</span>
                      <span className="text-[#00D4A0]">{highlightDuplicateRun.opened_count} / {Math.max(1, highlightDuplicateRun.run.sent_count)}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/12">
                      <div
                        className="h-full rounded-full bg-[#F5A623]"
                        style={{ width: `${Math.max(6, Math.min(100, Math.round((highlightDuplicateRun.opened_count / Math.max(1, highlightDuplicateRun.run.sent_count)) * 100)))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </>
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-[22px] font-black uppercase tracking-[0.08em] text-white/42">Récent — cette semaine</p>
          <p className="text-[17px] font-black text-[#00D4A0]">Trier ↕</p>
        </div>
        <div className="mt-2 space-y-2">
          {isLoading ? (
            <p className="rounded-2xl border border-white/12 bg-[#0E1420] px-3 py-3 text-[13px] text-white/70">Chargement...</p>
          ) : null}
          {!isLoading && filteredRuns.length === 0 ? (
            <p className="rounded-2xl border border-white/12 bg-[#0E1420] px-3 py-3 text-[13px] text-white/70">
              Aucun historique Radar pour le moment.
            </p>
          ) : null}
          {filteredRuns.map((item) => {
            const responseRate = item.run.sent_count > 0 ? Math.round((item.opened_count / item.run.sent_count) * 100) : 0;
            return (
              <article key={item.run.id} className="overflow-hidden rounded-[20px] border border-white/12 bg-[linear-gradient(145deg,#131D32,#0E1420_64%)] px-3 py-3 shadow-[0_16px_36px_-28px_rgba(0,0,0,0.95)]">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-white/15 bg-[#1B2745] text-[17px]">💻</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-[17px] font-black text-white">
                        {item.run.source_metier || "Mode Radar"}
                      </p>
                      <p className="shrink-0 text-[13px] font-semibold text-white/35">{formatRecentLabel(item.run.created_at)}</p>
                    </div>
                    <p className="text-[13px] text-white/52">📍 {item.run.city}</p>
                    <div className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[12px] font-black ${item.duplicate_count > 0 ? "border-rose-300/40 bg-rose-400/10 text-rose-200" : "border-[#00D4A0]/40 bg-[#00D4A0]/12 text-[#00D4A0]"}`}>
                      • {item.run.sent_count} envoyés · {item.duplicate_count > 0 ? `${item.duplicate_count} doublon(s)` : "Aucun doublon ✓"}
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[12px] text-white/60">
                    <span>Envoyés</span>
                    <span>{item.run.sent_count} / {Math.max(1, item.run.target_count)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#00D4A0]"
                      style={{ width: `${Math.max(4, Math.min(100, Math.round((item.run.sent_count / Math.max(1, item.run.target_count)) * 100)))}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[12px] text-white/60">
                    <span>Réponses</span>
                    <span className="text-[#00D4A0]">{item.opened_count} / {Math.max(1, item.run.sent_count)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[#00D4A0]" style={{ width: `${Math.max(6, responseRate)}%` }} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
