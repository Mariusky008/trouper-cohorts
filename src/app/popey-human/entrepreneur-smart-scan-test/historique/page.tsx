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
  const [filter, setFilter] = useState<"all" | "sent" | "duplicates">("all");
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
    const totalMessages = runs.reduce((sum, item) => sum + Math.max(0, Number(item.run.sent_count || 0)), 0);
    const totalOpened = runs.reduce((sum, item) => sum + Math.max(0, Number(item.opened_count || 0)), 0);
    const totalDuplicates = runs.reduce((sum, item) => sum + Math.max(0, Number(item.duplicate_count || 0)), 0);
    const converted = runs.filter((item) => Number(item.run.sent_count || 0) > 0 && Number(item.opened_count || 0) > 0).length;
    const responseRate = totalMessages > 0 ? Math.round((totalOpened / totalMessages) * 1000) / 10 : 0;
    return { totalMessages, totalOpened, totalDuplicates, converted, responseRate };
  }, [runs]);

  const duplicateRuns = runs.filter((item) => item.duplicate_count > 0);

  return (
    <main className="min-h-screen bg-[#07090F] text-white">
      <div className="mx-auto w-full max-w-xl px-4 pb-24 pt-[max(env(safe-area-inset-top),12px)]">
        <header className="sticky top-0 z-20 -mx-4 border-b border-white/5 bg-[#07090F] px-4 pb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/popey-human/entrepreneur-smart-scan-test")}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#141C2E] text-[17px] text-white/75"
            >
              ←
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[35px] font-black leading-[0.9] tracking-[-0.02em] text-white">Historique</p>
              <p className="text-[12px] text-white/45">Requêtes Mode Radar</p>
            </div>
          </div>
          <div className="relative mt-3">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-white/35">🔍</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un métier, une ville..."
              className="h-12 w-full rounded-[15px] border border-white/12 bg-[#141C2E] px-11 text-[14px] text-white placeholder:text-white/35"
            />
          </div>
        </header>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: "all" as const, label: `Tous · ${runs.length}` },
            { id: "sent" as const, label: `✅ Envoyés · ${totals.totalMessages}` },
            { id: "duplicates" as const, label: `⚠ Doublons · ${totals.totalDuplicates}` },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={`shrink-0 rounded-full border px-3 py-2 text-[12px] font-black ${
                filter === chip.id
                  ? "border-[#00D4A0]/45 bg-[#00D4A0]/12 text-[#00D4A0]"
                  : "border-white/12 bg-[#0E1420] text-white/55"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          <div className="rounded-[14px] border border-white/12 bg-[#0E1420] px-2 py-3 text-center">
            <p className="text-[30px] font-black leading-none text-[#00D4A0]">{totals.totalMessages}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/38">Msgs total</p>
          </div>
          <div className="rounded-[14px] border border-white/12 bg-[#0E1420] px-2 py-3 text-center">
            <p className="text-[30px] font-black leading-none text-amber-200">{totals.responseRate}%</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/38">Taux rép.</p>
          </div>
          <div className="rounded-[14px] border border-white/12 bg-[#0E1420] px-2 py-3 text-center">
            <p className="text-[30px] font-black leading-none text-rose-200">{totals.totalDuplicates}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/38">Doublons</p>
          </div>
          <div className="rounded-[14px] border border-white/12 bg-[#0E1420] px-2 py-3 text-center">
            <p className="text-[30px] font-black leading-none text-emerald-200">{totals.converted}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/38">Convertis</p>
          </div>
        </div>

        {apiError ? (
          <p className="mt-3 rounded-xl border border-amber-300/35 bg-amber-300/10 px-3 py-2 text-[12px] text-amber-100">{apiError}</p>
        ) : null}

        {duplicateRuns.length > 0 && (
          <>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-[20px] font-black uppercase tracking-[0.08em] text-white/45">⚠ Doublons détectés</p>
              <p className="text-[16px] font-black text-[#00D4A0]">À traiter</p>
            </div>
            <div className="mt-2 space-y-2">
              {duplicateRuns.slice(0, 3).map((item) => (
                <article key={item.run.id} className="rounded-[18px] border border-rose-300/35 bg-[linear-gradient(145deg,rgba(255,77,106,0.12),#0E1420)] px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[14px] font-black text-white">
                      {item.run.source_metier || "Requête Radar"} · {item.run.city}
                    </p>
                    <p className="text-[11px] text-white/45">
                      {new Date(item.run.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                  <p className="mt-1 text-[11px] text-rose-100">{item.duplicate_count} contact(s) déjà sollicités dans les runs précédents.</p>
                </article>
              ))}
            </div>
          </>
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-[20px] font-black uppercase tracking-[0.08em] text-white/45">Récent — runs Radar</p>
        </div>
        <div className="mt-2 space-y-2">
          {isLoading ? (
            <p className="rounded-2xl border border-white/12 bg-[#0E1420] px-3 py-3 text-[13px] text-white/70">Chargement...</p>
          ) : null}
          {!isLoading && runs.length === 0 ? (
            <p className="rounded-2xl border border-white/12 bg-[#0E1420] px-3 py-3 text-[13px] text-white/70">
              Aucun historique Radar pour le moment.
            </p>
          ) : null}
          {runs.map((item) => {
            const responseRate = item.run.sent_count > 0 ? Math.round((item.opened_count / item.run.sent_count) * 100) : 0;
            return (
              <article key={item.run.id} className="rounded-[18px] border border-white/12 bg-[#0E1420] px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-black text-white">
                      {item.run.source_metier || "Mode Radar"} · {item.run.city}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/55">
                      {item.contacts.length} contact(s) préparé(s) · {item.duplicate_count > 0 ? `${item.duplicate_count} doublon(s)` : "Aucun doublon"}
                    </p>
                  </div>
                  <p className="shrink-0 text-[11px] text-white/45">
                    {new Date(item.run.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  </p>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] text-white/60">
                    <span>WhatsApp envoyés</span>
                    <span>{item.run.sent_count} / {Math.max(1, item.run.target_count)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#00D4A0]"
                      style={{ width: `${Math.max(4, Math.min(100, Math.round((item.run.sent_count / Math.max(1, item.run.target_count)) * 100)))}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-white/60">
                    <span>Ouvertures WhatsApp</span>
                    <span className="text-[#00D4A0]">{item.opened_count} / {Math.max(1, item.run.sent_count)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[#F5A623]" style={{ width: `${Math.max(4, responseRate)}%` }} />
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
