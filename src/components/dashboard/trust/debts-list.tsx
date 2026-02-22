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
}

interface DebtsListProps {
  debts: Debt[];
}

export function DebtsList({ debts }: DebtsListProps) {
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (debts.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center text-slate-400">
         <p>Aucune dette en cours. Bravo !</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {debts.map((debt) => (
          <div key={debt.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={debt.avatar} />
              <AvatarFallback>{debt.partner[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-bold text-slate-900">De {debt.partner}</div>
              <div className="text-xs text-slate-500">{debt.reason}</div>
            </div>
            <div className="text-right">
              <div className={`font-bold ${debt.urgent ? 'text-red-500' : 'text-slate-400'}`}>
                J-{debt.daysLeft}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs mt-1 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
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
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white border-none rounded-3xl">
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
