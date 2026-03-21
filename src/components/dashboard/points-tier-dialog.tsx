"use client";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getPointsTier, POINTS_TIERS } from "@/lib/points-tiers";
import { Sparkles, Trophy } from "lucide-react";

export function PointsTierDialog({ points, className }: { points: number; className?: string }) {
  const { tier, nextTier } = getPointsTier(points);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className={cn("items-center border px-2 py-1 rounded-md text-[10px] font-black uppercase transition-colors hover:opacity-90", tier.accentClass, className)}>
          {tier.label}
        </button>
      </DialogTrigger>
      <DialogContent className="bg-white border-[#2E130C]/10 text-[#2E130C] sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <Trophy className="h-5 w-5 text-[#B20B13]" />
            Niveaux de points
          </DialogTitle>
          <DialogDescription className="text-sm text-[#2E130C]/65">
            Cumulez des points via les missions confirmées pour débloquer de nouveaux droits.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
          <p className="text-xs font-bold text-stone-600">Votre statut actuel</p>
          <div className="flex items-center justify-between mt-1">
            <Badge className={tier.accentClass}>{tier.label}</Badge>
            <span className="text-sm font-black text-[#2E130C]">{points} pts</span>
          </div>
          {nextTier && (
            <p className="text-xs text-stone-600 mt-1">
              Encore <span className="font-black">{Math.max(0, nextTier.minPoints - points)} pts</span> pour atteindre {nextTier.label}.
            </p>
          )}
        </div>

        <div className="space-y-3">
          {POINTS_TIERS.map((item) => (
            <div key={item.key} className="rounded-xl border border-stone-200 bg-white px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <Badge className={item.accentClass}>{item.label}</Badge>
                <span className="text-xs font-black text-stone-600">
                  {item.minPoints} {item.maxPoints === null ? "+" : `- ${item.maxPoints}`} pts
                </span>
              </div>
              <div className="mt-2 space-y-1">
                {item.rights.map((right) => (
                  <p key={right} className="text-xs text-[#2E130C]/80 font-semibold flex items-start gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#B20B13] mt-0.5 shrink-0" />
                    {right}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
