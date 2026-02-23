"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { OpportunityForm } from "@/components/dashboard/opportunities/opportunity-form";

interface Debt {
  id: string;
  partner: string;
  partnerId: string;
  avatar?: string;
  reason: string;
  daysLeft: number;
  urgent: boolean;
  remainingPoints?: number;
}

interface DebtsListProps {
  debts: Debt[];
}

export function DebtsList({ debts }: DebtsListProps) {
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (debts.length === 0) {
    return (
      <div className="bg-[#1e293b]/50 backdrop-blur-md border border-white/5 border-dashed rounded-[2rem] p-12 text-center text-slate-400">
         <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-400">
             <CheckCircle2 className="h-6 w-6" />
         </div>
         <p className="font-medium text-slate-300">Aucune dette en cours. Bravo !</p>
         <p className="text-xs text-slate-500 mt-1">Vous êtes un partenaire modèle.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {debts.map((debt) => (
          <div key={debt.id} className="bg-[#1e293b]/50 backdrop-blur-md rounded-2xl p-5 border border-white/5 shadow-sm hover:bg-[#1e293b]/80 transition-colors flex items-center gap-4 group">
            <Avatar className="h-12 w-12 border border-white/10 group-hover:border-orange-500/50 transition-colors">
              <AvatarImage src={debt.avatar} />
              <AvatarFallback className="bg-slate-800 text-slate-400">{debt.partner[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                 <div className="font-bold text-white text-lg">De {debt.partner}</div>
                 {debt.remainingPoints && (
                    <span className="text-[10px] font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 uppercase tracking-wide">
                        -{debt.remainingPoints} pts
                    </span>
                 )}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">{debt.reason}</div>
            </div>
            <div className="text-right">
              <div className={`font-black text-sm mb-1 ${debt.urgent ? 'text-red-400 animate-pulse' : 'text-slate-500'}`}>
                J-{debt.daysLeft}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 text-xs font-bold border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 rounded-lg"
                onClick={() => {
                  setSelectedDebt(debt);
                  setIsDialogOpen(true);
                }}
              >
                Rendre
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-[#0a0f1c] border border-white/10 rounded-[2rem]">
          <VisuallyHidden>
            <DialogTitle>Rendre la pareille à {selectedDebt?.partner}</DialogTitle>
            <DialogDescription>Formulaire pour envoyer une opportunité en retour.</DialogDescription>
          </VisuallyHidden>
          
          {selectedDebt && (
            <OpportunityForm 
              preSelectedUser={{
                id: selectedDebt.partnerId,
                name: selectedDebt.partner,
                job: "Membre du réseau", // Fallback job title
                avatar: selectedDebt.avatar
              }}
              onSuccess={() => setIsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
