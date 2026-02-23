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
  } | null;
}

export function TrustScoreCard({ scoreData }: TrustScoreProps) {
  // Use real data or defaults
  const score = scoreData?.score ?? 5.0;
  const received = scoreData?.opportunities_received ?? 0;
  const given = scoreData?.opportunities_given ?? 0;
  const debts = scoreData?.debt_level ?? 0;
  const balance = scoreData?.points_balance ?? 0;

  // Calculate progression (arbitrary logic for MVP: 10 given opps = Level Up)
  const progress = Math.min(100, (given / 10) * 100);

  const stats = [
    { label: "Score", value: `${score.toFixed(1)}`, icon: Star, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { label: "Dettes (Jours)", value: debts.toString(), icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
    { label: "Points Balance", value: (balance > 0 ? `-${balance}` : `+${Math.abs(balance)}`), icon: TrendingUp, color: balance > 0 ? "text-red-400" : "text-emerald-400", bg: balance > 0 ? "bg-red-500/10" : "bg-emerald-500/10", border: balance > 0 ? "border-red-500/20" : "border-emerald-500/20" },
    { label: "Données", value: given.toString(), icon: ThumbsUp, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-[#1e293b]/50 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-sm flex flex-col h-full"
    >
       <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-black text-xl text-white">Votre Impact</h3>
          <p className="text-slate-400 text-sm">Résumé de votre activité.</p>
        </div>
        <div className="h-10 w-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-400 border border-orange-500/20">
          <ShieldCheck className="h-5 w-5" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {stats.map((stat, i) => (
          <div key={i} className={cn("p-4 rounded-2xl border flex flex-col justify-between hover:bg-white/5 transition-colors", stat.bg, stat.border)}>
            <div className="flex justify-between items-start mb-2">
                <stat.icon className={cn("h-5 w-5", stat.color)} />
            </div>
            <div>
                <div className="text-3xl font-black text-white tracking-tight">{stat.value}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-white/5">
        <div className="flex items-center justify-between text-sm mb-2">
           <span className="font-bold text-slate-300">Niveau "Connecteur"</span>
           <span className="font-bold text-blue-300 bg-blue-500/20 border border-blue-500/20 px-2 py-0.5 rounded-md">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3 bg-white/5" indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-500" />
      </div>
    </motion.div>
  );
}
