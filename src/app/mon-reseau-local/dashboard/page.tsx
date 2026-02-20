import { getDailyMatch } from "@/lib/actions/network-match";
import { getTrustScore } from "@/lib/actions/network-trust";
import { DailyMatchCard } from "@/components/dashboard/daily-match-card";
import { AvailabilitySelector } from "@/components/dashboard/availability-selector";
import { TrustScoreCard } from "@/components/dashboard/trust-score-card";

export const dynamic = 'force-dynamic';

export default async function DashboardHome() {
  let match = null;
  let trustScore = null;

  try {
    match = await getDailyMatch();
    trustScore = await getTrustScore();
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="space-y-8 pb-24">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bonjour 👋</h1>
          <p className="text-slate-500 font-medium">Prêt pour votre opportunité du jour ?</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold text-slate-700">Réseau actif : 342 membres en ligne</span>
        </div>
      </div>

      {/* 2. DAILY MATCH CARD (HERO) */}
      <DailyMatchCard match={match} />

      {/* 3. AVAILABILITY & TRUST */}
      <div className="grid md:grid-cols-2 gap-8">
        <AvailabilitySelector />
        <TrustScoreCard scoreData={trustScore} />
      </div>
    </div>
  );
}
