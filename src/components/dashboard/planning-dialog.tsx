"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Calendar, ChevronRight, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AvailabilitySelector } from "@/components/dashboard/availability-selector";
import { cn } from "@/lib/utils";

interface PlanningDialogProps {
  settings: any;
  potentialCount: number;
}

export function PlanningDialog({ settings, potentialCount }: PlanningDialogProps) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Automatically open if requested by query param
    if (searchParams.get("setup") === "availability") {
      setOpen(true);
      
      // Clean up the URL without refreshing to prevent reopening on reload
      const params = new URLSearchParams(searchParams);
      params.delete("setup");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="group relative bg-[#1e293b]/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 cursor-pointer hover:bg-[#1e293b] hover:border-blue-500/30 transition-all shadow-sm hover:shadow-blue-900/20">
            <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <Calendar className="h-5 w-5" />
                </div>
                <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </div>
            
            <h3 className="font-bold text-white text-lg mb-1">Mon Planning</h3>
            <p className="text-sm text-slate-400 mb-3">Gérer mes disponibilités</p>
            
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-black/20 p-2 rounded-lg border border-white/5">
                <Clock className="h-3.5 w-3.5" />
                <span>
                    {settings?.frequency_per_week || 5}j / semaine
                </span>
            </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl bg-[#0f172a] border-white/10 p-0 overflow-hidden">
         <div className="p-6">
            <AvailabilitySelector 
                settings={settings} 
                potentialCount={potentialCount} 
                onSuccess={() => setOpen(false)} 
            />
         </div>
      </DialogContent>
    </Dialog>
  );
}