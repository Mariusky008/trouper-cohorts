"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Star, TrendingUp, ThumbsUp, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TrustScoreProps {
  scoreData?: {
    score: number;
    opportunities_given: number;
    opportunities_received: number;
    debt_level: number;
    points_balance?: number;
    mission_quality_score?: number;
    response_speed_score?: number;
    response_hours_avg?: number | null;
  } | null;
}

export function TrustScoreCard({ scoreData }: TrustScoreProps) {
  // Use real data or defaults
  const score = scoreData?.score ?? 5.0;
  const received = scoreData?.opportunities_received ?? 0;
  const given = scoreData?.opportunities_given ?? 0;
  const debts = scoreData?.debt_level ?? 0;
  const balance = scoreData?.points_balance ?? 0;
  const missionQuality = scoreData?.mission_quality_score ?? score;
  const responseSpeed = scoreData?.response_speed_score ?? score;
  const responseHours = scoreData?.response_hours_avg;

  // Calculate progression (arbitrary logic for MVP: 10 given opps = Level Up)
  const progress = Math.min(100, (given / 10) * 100);

  const stats = [
    { label: "Score", value: `${score.toFixed(1)}`, icon: Star, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
    { label: "Qualité mission", value: missionQuality.toFixed(1), icon: ShieldCheck, color: "text-fuchsia-600", bg: "bg-fuchsia-50", border: "border-fuchsia-200" },
    { label: "Réactivité", value: responseSpeed.toFixed(1), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
    { label: "Données", value: given.toString(), icon: ThumbsUp, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200 shadow-sm flex flex-col h-full"
    >
       <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-black text-xl text-[#2E130C]">Score Confiance V2</h3>
          <p className="text-stone-500 text-sm">Basé sur missions terminées + temps de réponse.</p>
        </div>
        <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 border border-orange-200">
          <ShieldCheck className="h-5 w-5" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {stats.map((stat, i) => (
          <div key={i} className={cn("p-4 rounded-2xl border flex flex-col justify-between hover:bg-stone-50 transition-colors", 
            // Reset custom bg/border colors to match the clean light theme, or use softer variants
            "bg-white border-stone-200" 
          )}>
            <div className="flex justify-between items-start mb-2">
                <stat.icon className={cn("h-5 w-5", stat.color)} />
            </div>
            <div>
                <div className="text-3xl font-black text-[#2E130C] tracking-tight">{stat.value}</div>
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wide mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-stone-200">
        <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 mb-3 text-xs font-semibold text-[#2E130C]/75">
          Temps de réponse moyen: {responseHours ? `${responseHours.toFixed(1)}h` : "données en cours"}
        </div>
        <div className="flex items-center justify-between text-sm mb-2">
           <span className="font-bold text-stone-600">Niveau "Connecteur"</span>
           <span className="font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3 bg-stone-100" indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-500" />
      </div>
    </motion.div>
  );
}
