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
        <div className="group relative bg-white border border-[#2E130C]/10 rounded-2xl p-6 cursor-pointer hover:bg-[#F3F0E7] hover:border-blue-200 transition-all shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 group-hover:scale-110 transition-transform">
                    <Calendar className="h-5 w-5" />
                </div>
                <ChevronRight className="h-5 w-5 text-[#2E130C]/40 group-hover:text-blue-500 transition-colors" />
            </div>
            
            <h3 className="font-bold text-[#2E130C] text-lg mb-1">Mon Planning</h3>
            <p className="text-sm text-[#2E130C]/60 mb-3">Gérer mes disponibilités</p>
            
            <div className="flex items-center gap-2 text-xs font-medium text-[#2E130C]/70 bg-slate-50 p-2 rounded-lg border border-[#2E130C]/5">
                <Clock className="h-3.5 w-3.5" />
                <span>
                    {settings?.frequency_per_week || 5}j / semaine
                </span>
            </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl bg-white border-[#2E130C]/10 p-0 overflow-hidden text-[#2E130C]">
         <div className="p-6">
            <AvailabilitySelector 
                settings={settings} 
                potentialCount={potentialCount} 
                onSuccess={() => {
                    setOpen(false);
                    // Force refresh to update the admin page data and local dashboard state
                    router.refresh();
                }} 
            />
         </div>
      </DialogContent>
    </Dialog>
  );
}