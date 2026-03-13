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
  onUnlock?: (newPoints: number) => void;
}

export function MarketAction({ opportunityId, price, userPoints, onUnlock }: MarketActionProps) {
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
        if (onUnlock && result.newBalance !== undefined) {
            onUnlock(result.newBalance);
        }
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
      
      <DialogContent className="bg-white border-stone-200 text-[#2E130C] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-[#2E130C]">Confirmer l'achat</DialogTitle>
          <DialogDescription className="text-stone-500">
            Vous êtes sur le point de débloquer cette opportunité.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 flex flex-col gap-2">
             <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-stone-500 uppercase">Prix de vente</span>
                <span className="text-xl font-black text-[#2E130C]">{price} Crédits</span>
             </div>
             <div className="flex justify-between items-center text-xs text-stone-400 pt-2 border-t border-stone-200">
                <span>Commission Popey (10%)</span>
                <span>-{Math.floor(price * 0.10)} Crédits</span>
             </div>
             <div className="flex justify-between items-center text-xs text-emerald-600 font-bold">
                <span>Reversé au vendeur</span>
                <span>+{Math.floor(price * 0.90)} Crédits</span>
             </div>
          </div>

          <div className="flex justify-between items-center px-2">
             <span className="text-sm text-stone-500">Votre solde actuel :</span>
             <span className={canAfford ? "text-[#2E130C] font-bold" : "text-red-500 font-bold"}>
               {userPoints} Crédits
             </span>
          </div>

          {!canAfford && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3 text-red-600 text-sm font-bold">
               <Lock className="h-4 w-4" /> Solde insuffisant pour cet achat.
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-stone-500 hover:text-[#2E130C] hover:bg-stone-100">
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
