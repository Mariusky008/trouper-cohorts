"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { OpportunityForm } from "@/components/dashboard/opportunities/opportunity-form";
import { CheckCircle2 } from "lucide-react";

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
      <div className="bg-white border border-stone-200 border-dashed rounded-[2rem] p-12 text-center text-stone-500 shadow-sm">
         <div className="h-12 w-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
             <CheckCircle2 className="h-6 w-6" />
         </div>
         <p className="font-medium text-[#2E130C]">Aucune dette en cours. Bravo !</p>
         <p className="text-xs text-stone-500 mt-1">Vous êtes un partenaire modèle.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {debts.map((debt) => (
          <div key={debt.id} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
            <Avatar className="h-12 w-12 border border-stone-200 group-hover:border-orange-500/50 transition-colors">
              <AvatarImage src={debt.avatar} />
              <AvatarFallback className="bg-stone-100 text-stone-500 font-bold">{debt.partner[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                 <div className="font-bold text-[#2E130C] text-lg">De {debt.partner}</div>
                 {debt.remainingPoints && (
                    <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 uppercase tracking-wide">
                        -{debt.remainingPoints} pts
                    </span>
                 )}
              </div>
              <div className="text-xs text-stone-500 font-medium mt-0.5">{debt.reason}</div>
            </div>
            <div className="text-right">
              <div className={`font-black text-sm mb-1 ${debt.urgent ? 'text-red-600 animate-pulse' : 'text-stone-400'}`}>
                J-{debt.daysLeft}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 text-xs font-bold border-stone-200 bg-white text-stone-600 hover:text-[#2E130C] hover:bg-stone-50 hover:border-stone-300 rounded-lg"
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
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white border border-stone-200 rounded-[2rem]">
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
