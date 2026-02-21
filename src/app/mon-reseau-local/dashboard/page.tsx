import { getDailyMatch } from "@/lib/actions/network-match";
import { getTrustScore } from "@/lib/actions/network-trust";
import { getNetworkSettings } from "@/lib/actions/network-settings";
import { getPotentialOpportunitiesCount } from "@/lib/actions/network-opportunities";
import { DailyMatchCard } from "@/components/dashboard/daily-match-card";
import { AvailabilitySelector } from "@/components/dashboard/availability-selector";
import { TrustScoreCard } from "@/components/dashboard/trust-score-card";
import { FrequencyControl } from "@/components/dashboard/frequency-control";
import { Sparkles, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function DashboardHome() {
  let match = null;
  let trustScore = null;
  let settings = null;
  let potentialCount = 0;

  try {
    match = await getDailyMatch();
    trustScore = await getTrustScore();
    settings = await getNetworkSettings();
    potentialCount = await getPotentialOpportunitiesCount();
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="space-y-10 pb-24 relative">
      
      {/* 1. HEADER WITH BACKGROUND ACCENT */}
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Bonjour, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Champion !</span> 👋
            </h1>
            <p className="text-slate-500 font-medium text-lg max-w-md">
              Prêt à débloquer de nouvelles opportunités aujourd'hui ?
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-5 py-3 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-blue-200 group cursor-default">
            <div className="relative">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-ping absolute opacity-75" />
              <div className="h-3 w-3 bg-green-500 rounded-full relative" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-500 transition-colors">Réseau en direct</span>
              <span className="text-sm font-black text-slate-800">342 membres actifs</span>
            </div>
          </div>
        </div>

        {/* 2. HERO SECTION - MATCH & AVAILABILITY */}
        <div className="grid xl:grid-cols-[1.4fr_1fr] gap-8 items-start">
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" /> Votre Mission du Jour
                </h2>
             </div>
             <DailyMatchCard match={match} />
          </div>

          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" /> Préparer Demain
                </h2>
             </div>
             {/* Only show availability selector if not paused, otherwise show status */}
             {settings?.status !== 'pause' ? (
                <AvailabilitySelector />
             ) : (
                <div className="bg-orange-50 border border-orange-100 rounded-3xl p-8 text-center space-y-4">
                   <div className="h-16 w-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8" />
                   </div>
                   <h3 className="text-xl font-bold text-orange-900">Mode Pause Activé</h3>
                   <p className="text-orange-700">Vous ne recevrez pas de matchs tant que vous êtes en pause.</p>
                   <Button variant="outline" className="bg-white border-orange-200 text-orange-800 hover:bg-orange-100" asChild>
                      <Link href="#settings">Gérer mon statut</Link>
                   </Button>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* 3. METRICS & SETTINGS GRID */}
      <div id="settings" className="grid md:grid-cols-2 gap-8 pt-4">
        <div className="space-y-4">
           <h2 className="text-xl font-bold text-slate-800">Votre Impact</h2>
           <TrustScoreCard scoreData={trustScore} />
        </div>
        <div className="space-y-4">
           <h2 className="text-xl font-bold text-slate-800">Votre Rythme</h2>
           <FrequencyControl settings={settings} potentialCount={potentialCount} />
        </div>
      </div>

    </div>
  );
}
