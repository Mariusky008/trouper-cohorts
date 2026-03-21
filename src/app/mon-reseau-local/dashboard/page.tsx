import { incrementUserPoints, getUserStreak } from "@/lib/actions/gamification";
import { getDailyMatches } from "@/lib/actions/network-match";
import { getTrustScore } from "@/lib/actions/network-trust";
import { getNetworkSettings } from "@/lib/actions/network-settings";
import { getPotentialOpportunitiesCount } from "@/lib/actions/network-opportunities";
import { getFlashQuestions } from "@/lib/actions/network-flash"; // Import flash questions
import { DailyMatchCard } from "@/components/dashboard/daily-match-card";
import { CafeWidget } from "@/components/dashboard/cafe-widget"; // Import widget
import { PlanningDialog } from "@/components/dashboard/planning-dialog";
import { ReputationDialog } from "@/components/dashboard/reputation-dialog";
import { Sparkles, Users, Calendar, Target, ShieldCheck, Zap, Percent, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

import { createClient } from "@/lib/supabase/server";

import { getUserProfile } from "@/lib/actions/network-members";

export const dynamic = 'force-dynamic';

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let matches: any[] = [];
  let trustScore = null;
  let settings = null;
  let potentialCount = 0;
  let userStreak = 0;
  let currentUserProfile = null;
  const [matchesResult, trustScoreResult, settingsResult, potentialCountResult, userStreakResult, currentUserProfileResult] = await Promise.allSettled([
    getDailyMatches(),
    getTrustScore(),
    getNetworkSettings(),
    getPotentialOpportunitiesCount(),
    getUserStreak(),
    getUserProfile(user?.id)
  ]);

  if (matchesResult.status === "fulfilled") matches = matchesResult.value;
  else console.error(matchesResult.reason);

  if (trustScoreResult.status === "fulfilled") trustScore = trustScoreResult.value;
  else console.error(trustScoreResult.reason);

  if (settingsResult.status === "fulfilled") settings = settingsResult.value;
  else console.error(settingsResult.reason);

  if (potentialCountResult.status === "fulfilled") potentialCount = potentialCountResult.value;
  else console.error(potentialCountResult.reason);

  if (userStreakResult.status === "fulfilled") userStreak = userStreakResult.value;
  else console.error(userStreakResult.reason);

  if (currentUserProfileResult.status === "fulfilled") currentUserProfile = currentUserProfileResult.value;
  else console.error(currentUserProfileResult.reason);

  // 4. FLASH CAFE (Fetch after profile is loaded)
  let latestQuestion = null;
  if (currentUserProfile?.city) {
      try {
          const questions = await getFlashQuestions(currentUserProfile.city);
          if (questions.length > 0) latestQuestion = questions[0];
      } catch (e) {
          console.error("Failed to load cafe widget:", e);
      }
  }

  return (
    <div className="space-y-8 pb-24 relative max-w-4xl mx-auto">
      
      {/* 1. HERO HEADER (STYLE "APP/TODAY") */}
      <div className="relative pt-8 pb-8 overflow-hidden">
         {/* Background Glow */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#B20B13]/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
         
         <div className="text-center space-y-4">
            <Badge className="bg-[#B20B13]/10 text-[#B20B13] hover:bg-[#B20B13]/20 border-[#B20B13]/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-sm">
               <Zap className="h-3 w-3 mr-2 text-[#B20B13]" /> Dashboard Quotidien
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-black text-[#2E130C] tracking-tighter leading-none font-titan">
              Bonjour <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B20B13] to-[#7A0000]">{currentUserProfile?.display_name?.split(' ')[0] || "Champion"}.</span>
            </h1>
         </div>
      </div>

      {/* 2. FOCUS PRINCIPAL - MISSION DU JOUR */}
      <div className="relative z-20">
         <DailyMatchCard
           matches={matches}
           userStreak={userStreak}
           userId={user?.id}
           currentUserProfile={currentUserProfile}
           currentUserAuthFirstName={user?.user_metadata?.first_name}
         />
      </div>

      {/* 3. CAFE WIDGET (NEW) */}
      <CafeWidget city={currentUserProfile?.city || "Mon Réseau"} latestQuestion={latestQuestion} />

      {/* 4. QUICK ACTIONS GRID (Planning & Reputation) */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 mt-8">
         <PlanningDialog settings={settings} potentialCount={potentialCount} />
         <ReputationDialog scoreData={trustScore} />
      </div>

    </div>
  );
}
