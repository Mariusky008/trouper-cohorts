import { getDailyMatches } from "@/lib/actions/network-match";
import { getTrustScore } from "@/lib/actions/network-trust";
import { getNetworkSettings } from "@/lib/actions/network-settings";
import { getPotentialOpportunitiesCount } from "@/lib/actions/network-opportunities";
import { DailyMatchCard } from "@/components/dashboard/daily-match-card";
import { AvailabilitySelector } from "@/components/dashboard/availability-selector";
import { TrustScoreCard } from "@/components/dashboard/trust-score-card";
import { Sparkles, Users, Calendar, Target, ShieldCheck, Zap } from "lucide-react";
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
    <div className="space-y-12 pb-24 relative max-w-6xl mx-auto">
      
      {/* 1. HERO HEADER (STYLE "APP/TODAY") */}
      <div className="relative pt-8 pb-12 overflow-hidden">
         {/* Background Glow */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-100/40 rounded-full blur-[100px] -z-10 pointer-events-none" />
         
         <div className="text-center space-y-6">
            <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-sm">
               <Zap className="h-3 w-3 mr-2 text-blue-500" /> Dashboard Quotidien
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">
              Bonjour <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Champion.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Prêt à transformer une simple conversation en <strong className="text-slate-900">opportunité concrète</strong> ?
            </p>
         </div>
      </div>

      {/* 2. FOCUS PRINCIPAL - MISSION DU JOUR */}
      <div className="relative z-20 -mt-8">
         <DailyMatchCard matches={matches} />
      </div>

      {/* 3. GRID LAYOUT "MODERNE" */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
         
         {/* Colonne Gauche : Préparation (Plus large) */}
         <div className="lg:col-span-7 space-y-6">
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                       <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 text-xl">Planning</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Préparez demain</p>
                    </div>
                </div>
             </div>
             
             {/* Card Style "Glass" */}
             <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-1 border border-slate-200/60 shadow-xl shadow-slate-200/40">
                 <AvailabilitySelector settings={settings} potentialCount={potentialCount} />
             </div>
         </div>

         {/* Colonne Droite : Impact & Score */}
         <div className="lg:col-span-5 space-y-6">
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm border border-slate-100">
                       <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 text-xl">Réputation</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Votre impact</p>
                    </div>
                </div>
             </div>
             
             <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
                 <TrustScoreCard scoreData={trustScore} />
             </div>
         </div>

      </div>

    </div>
  );
}
