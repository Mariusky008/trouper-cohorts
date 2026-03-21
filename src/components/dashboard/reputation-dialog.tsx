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
  const mention = score >= 4.6 ? "Excellent" : score >= 4.0 ? "Très bon" : score >= 3.2 ? "Solide" : "À renforcer";
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="group relative bg-white border border-[#2E130C]/10 rounded-2xl p-6 cursor-pointer hover:bg-[#F3F0E7] hover:border-emerald-200 transition-all shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="h-5 w-5" />
                </div>
                <ChevronRight className="h-5 w-5 text-[#2E130C]/40 group-hover:text-emerald-500 transition-colors" />
            </div>
            
            <h3 className="font-bold text-[#2E130C] text-lg mb-1">Ma Réputation</h3>
            <p className="text-sm text-[#2E130C]/60 mb-3">Confiance mission + réactivité</p>
            
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                <Trophy className="h-3.5 w-3.5" />
                <span>
                    {score.toFixed(1)}/5 {mention}
                </span>
            </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-white border-[#2E130C]/10 p-0 overflow-hidden text-[#2E130C]">
         <TrustScoreCard scoreData={scoreData} />
      </DialogContent>
    </Dialog>
  );
}
