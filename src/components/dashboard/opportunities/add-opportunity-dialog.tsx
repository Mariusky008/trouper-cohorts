"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogTrigger 
} from "@/components/ui/dialog";
import { OpportunityForm } from "./opportunity-form";
import { hasCompletedDailyCall } from "@/lib/actions/daily-check";

export function AddOpportunityDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [canPostToMarket, setCanPostToMarket] = useState(false);

  useEffect(() => {
    if (isOpen) {
        hasCompletedDailyCall().then(setCanPostToMarket);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-3xl h-[85vh] max-h-[800px]">
         <OpportunityForm 
            onSuccess={() => setIsOpen(false)} 
            canPostToMarket={canPostToMarket}
         />
      </DialogContent>
    </Dialog>
  );
}
