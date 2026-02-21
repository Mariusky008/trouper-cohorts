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
  } | null;
}

export function TrustScoreCard({ scoreData }: TrustScoreProps) {
  // Use real data or defaults
  const score = scoreData?.score ?? 5.0;
  const received = scoreData?.opportunities_received ?? 0;
  const given = scoreData?.opportunities_given ?? 0;
  const debts = scoreData?.debt_level ?? 0;

  // Calculate progression (arbitrary logic for MVP: 10 given opps = Level Up)
  const progress = Math.min(100, (given / 10) * 100);

  const stats = [
    { label: "Score", value: `${score.toFixed(1)}`, icon: Star, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
    { label: "Dettes", value: debts.toString(), icon: AlertCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
    { label: "Reçues", value: received.toString(), icon: TrendingUp, color: "text-green-500", bg: "bg-green-50", border: "border-green-100" },
    { label: "Données", value: given.toString(), icon: ThumbsUp, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col h-full"
    >
       <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-black text-xl text-slate-900">Votre Impact</h3>
          <p className="text-slate-500 text-sm">Résumé de votre activité.</p>
        </div>
        <div className="h-10 w-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
          <ShieldCheck className="h-5 w-5" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {stats.map((stat, i) => (
          <div key={i} className={cn("p-4 rounded-2xl border flex flex-col justify-between hover:shadow-md transition-shadow", stat.bg, stat.border)}>
            <div className="flex justify-between items-start mb-2">
                <stat.icon className={cn("h-5 w-5", stat.color)} />
            </div>
            <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between text-sm mb-2">
           <span className="font-bold text-slate-700">Niveau "Connecteur"</span>
           <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3 bg-slate-100" indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-500" />
      </div>
    </motion.div>
  );
}
