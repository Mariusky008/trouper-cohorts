"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Star, TrendingUp, ThumbsUp, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Mock stats for now, will connect to backend later
const STATS = [
  { label: "Score de Confiance", value: "4.6/5", icon: Star, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
  { label: "Opportunités Reçues", value: "12", icon: TrendingUp, color: "text-green-500", bg: "bg-green-50", border: "border-green-100" },
  { label: "Opportunités Rendues", value: "10", icon: ThumbsUp, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
  { label: "Dettes en cours", value: "2", icon: Clock, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
];

export function TrustScoreCard() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col"
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
        {STATS.map((stat, i) => (
          <div key={i} className={cn("p-4 rounded-2xl border flex flex-col justify-center", stat.bg, stat.border)}>
            <stat.icon className={cn("h-6 w-6 mb-3", stat.color)} />
            <div className="text-2xl font-black text-slate-900">{stat.value}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{stat.label}</div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between text-sm mb-2">
           <span className="font-bold text-slate-700">Progression vers le niveau "Connecteur"</span>
           <span className="font-bold text-blue-600">85%</span>
        </div>
        <Progress value={85} className="h-2" />
      </div>
    </motion.div>
  );
}
