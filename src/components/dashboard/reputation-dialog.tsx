"use client";

import { ShieldCheck, ChevronRight, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TrustScoreCard } from "@/components/dashboard/trust-score-card";
import { cn } from "@/lib/utils";

interface ReputationDialogProps {
  scoreData: any;
}

export function ReputationDialog({ scoreData }: ReputationDialogProps) {
  const score = scoreData?.score || 5.0;
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="group relative bg-[#1e293b]/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 cursor-pointer hover:bg-[#1e293b] hover:border-emerald-500/30 transition-all shadow-sm hover:shadow-emerald-900/20">
            <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="h-5 w-5" />
                </div>
                <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            
            <h3 className="font-bold text-white text-lg mb-1">Ma Réputation</h3>
            <p className="text-sm text-slate-400 mb-3">Voir mon impact</p>
            
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                <Trophy className="h-3.5 w-3.5" />
                <span>
                    {score}/5 Excellent
                </span>
            </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-[#0f172a] border-white/10 p-0 overflow-hidden">
         <TrustScoreCard scoreData={scoreData} />
      </DialogContent>
    </Dialog>
  );
}