"use client";

import { useState } from "react";
import { 
  Dialog, DialogContent, DialogTrigger 
} from "@/components/ui/dialog";
import { OpportunityForm } from "./opportunity-form";

export function AddOpportunityDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-3xl h-[600px]">
         <OpportunityForm onSuccess={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
