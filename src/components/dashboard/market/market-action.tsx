"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Lock } from "lucide-react";
import { purchaseOpportunity } from "@/lib/actions/market";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MarketActionProps {
  opportunityId: string;
  price: number;
  userPoints: number;
}

export function MarketAction({ opportunityId, price, userPoints }: MarketActionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const result = await purchaseOpportunity(opportunityId);
      
      if (result.success) {
        toast.success("Opportunité débloquée ! 🚀", {
          description: "Vous avez accès aux détails dans votre historique."
        });
        setIsDialogOpen(false);
      } else {
        toast.error("Erreur", {
          description: result.error || "Impossible d'acheter l'opportunité."
        });
      }
    } catch (e) {
      toast.error("Erreur inattendue");
    } finally {
      setIsLoading(false);
    }
  };

  const canAfford = userPoints >= price;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95">
          Débloquer <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-[#1e293b] border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Confirmer l'achat</DialogTitle>
          <DialogDescription className="text-slate-400">
            Vous êtes sur le point de débloquer cette opportunité.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="bg-[#0f172a] rounded-xl p-4 border border-white/5 flex justify-between items-center">
             <span className="text-sm font-bold text-slate-400 uppercase">Prix</span>
             <span className="text-xl font-black text-emerald-400">{price} Crédits</span>
          </div>

          <div className="flex justify-between items-center px-2">
             <span className="text-sm text-slate-400">Votre solde actuel :</span>
             <span className={canAfford ? "text-white font-bold" : "text-red-400 font-bold"}>
               {userPoints} Crédits
             </span>
          </div>

          {!canAfford && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 text-red-300 text-sm font-bold">
               <Lock className="h-4 w-4" /> Solde insuffisant pour cet achat.
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-400 hover:text-white">
            Annuler
          </Button>
          <Button 
            onClick={handlePurchase} 
            disabled={!canAfford || isLoading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 w-full sm:w-auto"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {canAfford ? "Confirmer l'achat" : "Recharger mes crédits"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
