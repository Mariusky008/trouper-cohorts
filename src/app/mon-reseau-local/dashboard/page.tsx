import { getDailyMatches } from "@/lib/actions/network-match";
import { getTrustScore } from "@/lib/actions/network-trust";
import { getNetworkSettings } from "@/lib/actions/network-settings";
import { getPotentialOpportunitiesCount } from "@/lib/actions/network-opportunities";
import { DailyMatchCard } from "@/components/dashboard/daily-match-card";
import { AvailabilitySelector } from "@/components/dashboard/availability-selector";
import { TrustScoreCard } from "@/components/dashboard/trust-score-card";
import { Sparkles, Users, Calendar, Target, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function DashboardHome() {
  let matches: any[] = [];
  let trustScore = null;
  let settings = null;
  let potentialCount = 0;

  try {
    matches = await getDailyMatches();
    trustScore = await getTrustScore();
    settings = await getNetworkSettings();
    potentialCount = await getPotentialOpportunitiesCount();
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="space-y-12 pb-24 relative max-w-5xl mx-auto">
      
      {/* 1. HEADER SIMPLIFIÉ */}
      <div className="text-center pt-8 pb-4 space-y-3">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Bonjour, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Champion !</span> 👋
        </h1>
        <p className="text-slate-500 font-medium text-lg max-w-lg mx-auto">
          Prêt à débloquer de nouvelles opportunités aujourd'hui ?
        </p>
      </div>

      {/* 2. FOCUS PRINCIPAL - MISSION DU JOUR */}
      <div className="relative z-20 transform transition-all duration-500 hover:scale-[1.01]">
         <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-[2.5rem] blur-xl opacity-50 -z-10 animate-pulse"></div>
         <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/50 p-1 md:p-2">
            <div className="bg-slate-50/50 rounded-[1.8rem] border border-slate-100/50 p-6 md:p-8">
               <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600 shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-none">Votre Mission du Jour</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">L'action qui compte vraiment.</p>
                  </div>
               </div>
               
               <DailyMatchCard matches={matches} />
            </div>
         </div>
      </div>

      {/* 3. SECTION SECONDAIRE - PRÉPARATION & IMPACT */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
         
         {/* Colonne Gauche : Préparation */}
         <div className="space-y-4">
             <div className="flex items-center gap-3 px-2">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                   <Calendar className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Préparez Demain</h3>
             </div>
             <AvailabilitySelector settings={settings} potentialCount={potentialCount} />
         </div>

         {/* Colonne Droite : Impact */}
         <div className="space-y-4">
             <div className="flex items-center gap-3 px-2">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                   <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Votre Réputation</h3>
             </div>
             <TrustScoreCard scoreData={trustScore} />
         </div>

      </div>

    </div>
  );
}
