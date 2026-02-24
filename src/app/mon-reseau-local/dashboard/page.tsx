import { incrementUserPoints, getUserStreak } from "@/lib/actions/gamification";
import { getDailyMatches } from "@/lib/actions/network-match";
import { getTrustScore } from "@/lib/actions/network-trust";
import { getNetworkSettings } from "@/lib/actions/network-settings";
import { getPotentialOpportunitiesCount } from "@/lib/actions/network-opportunities";
import { DailyMatchCard } from "@/components/dashboard/daily-match-card";
import { PlanningDialog } from "@/components/dashboard/planning-dialog";
import { ReputationDialog } from "@/components/dashboard/reputation-dialog";
import { Sparkles, Users, Calendar, Target, ShieldCheck, Zap, Percent, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
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
    <div className="space-y-8 pb-24 relative max-w-4xl mx-auto">
      
      {/* 1. HERO HEADER (STYLE "APP/TODAY") */}
      <div className="relative pt-8 pb-8 overflow-hidden">
         {/* Background Glow */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] -z-10 pointer-events-none" />
         
         <div className="text-center space-y-4">
            <Badge className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border-blue-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-sm">
               <Zap className="h-3 w-3 mr-2 text-blue-400" /> Dashboard Quotidien
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
              Bonjour <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Champion.</span>
            </h1>
         </div>
      </div>

      {/* 2. FOCUS PRINCIPAL - MISSION DU JOUR */}
      <div className="relative z-20">
         <DailyMatchCard matches={matches} userStreak={userStreak} userId={user?.id} />
      </div>

      {/* 3. QUICK ACTIONS GRID (Planning & Reputation) */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 mt-8">
         <PlanningDialog settings={settings} potentialCount={potentialCount} />
         <ReputationDialog scoreData={trustScore} />
      </div>

    </div>
  );
}
