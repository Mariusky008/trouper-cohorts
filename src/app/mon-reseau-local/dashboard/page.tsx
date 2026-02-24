import { incrementUserPoints, getUserStreak } from "@/lib/actions/gamification";
import { getDailyMatches } from "@/lib/actions/network-match";
import { getTrustScore } from "@/lib/actions/network-trust";
import { getNetworkSettings } from "@/lib/actions/network-settings";
import { getPotentialOpportunitiesCount } from "@/lib/actions/network-opportunities";
import { DailyMatchCard } from "@/components/dashboard/daily-match-card";
import { AvailabilitySelector } from "@/components/dashboard/availability-selector";
import { TrustScoreCard } from "@/components/dashboard/trust-score-card";
import { Sparkles, Users, Calendar, Target, ShieldCheck, Zap, Percent, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function DashboardHome() {
  let matches: any[] = [];
  let trustScore = null;
  let settings = null;
  let potentialCount = 0;
  let userStreak = 0;

  try {
    matches = await getDailyMatches();
    trustScore = await getTrustScore();
    settings = await getNetworkSettings();
    potentialCount = await getPotentialOpportunitiesCount();
    userStreak = await getUserStreak();
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="space-y-12 pb-24 relative max-w-6xl mx-auto">
      
      {/* 1. HERO HEADER (STYLE "APP/TODAY") */}
      <div className="relative pt-8 pb-12 overflow-hidden">
         {/* Background Glow */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] -z-10 pointer-events-none" />
         
         <div className="text-center space-y-6">
            <Badge className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border-blue-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-sm">
               <Zap className="h-3 w-3 mr-2 text-blue-400" /> Dashboard Quotidien
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
              Bonjour <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Champion.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
              Prêt à transformer une simple conversation en <strong className="text-white">opportunité concrète</strong> ?
            </p>
         </div>
      </div>

      {/* 2. FOCUS PRINCIPAL - MISSION DU JOUR */}
      <div className="relative z-20 -mt-8">
         <DailyMatchCard matches={matches} userStreak={userStreak} />
      </div>

      {/* 3. GRID LAYOUT "MODERNE" */}
      <div className="grid lg:grid-cols-12 gap-8 items-start mt-12">
         
         {/* Colonne Gauche : Préparation (Plus large) */}
         <div className="lg:col-span-7 space-y-6">
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-blue-400 shadow-sm border border-white/10">
                       <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-white text-xl">Planning</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Préparez demain</p>
                    </div>
                </div>
             </div>
             
             {/* Card Style "Glass" */}
             <div className="bg-[#0f172a]/50 backdrop-blur-xl rounded-[2rem] p-1 border border-white/5 shadow-xl shadow-black/20">
                 <AvailabilitySelector settings={settings} potentialCount={potentialCount} />
             </div>
         </div>

         {/* Colonne Droite : Impact & Score */}
         <div className="lg:col-span-5 space-y-6">
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-emerald-400 shadow-sm border border-white/10">
                       <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-white text-xl">Réputation</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Votre impact</p>
                    </div>
                </div>
             </div>
             
             <div className="bg-[#0f172a]/50 backdrop-blur-xl rounded-[2rem] border border-white/5 shadow-xl shadow-black/20 overflow-hidden">
                 <TrustScoreCard scoreData={trustScore} />
             </div>

             {/* HIDDEN MARKET TEASER */}
             <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 backdrop-blur-xl rounded-[2rem] p-6 border border-amber-500/20 shadow-xl shadow-black/20 group cursor-pointer hover:border-amber-500/40 transition-colors relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Percent className="h-24 w-24 text-amber-500 rotate-12" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                            <Percent className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-white text-lg">Offres Privilèges</h3>
                            <p className="text-xs text-amber-500 font-bold uppercase tracking-wide">Exclusivités Membres</p>
                        </div>
                    </div>
                    
                    <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed">
                        Débloquez des offres exclusives (-50% min) proposées par vos matchs.
                    </p>

                    <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl h-11 shadow-lg shadow-amber-500/20">
                        <Link href="/mon-reseau-local/dashboard/offers">
                            Voir les offres <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
             </div>
         </div>

      </div>

    </div>
  );
}
