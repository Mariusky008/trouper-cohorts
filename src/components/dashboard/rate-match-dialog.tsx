"use client";

import { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle2, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { rateMatch } from "@/lib/actions/network-match";

export function RateMatchDialog({ matchId, partnerName }: { matchId: string; partnerName: string }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    
    try {
      await rateMatch(matchId, rating, feedback);
      setIsOpen(false);
      toast({
        title: "Feedback envoyé !",
        description: "Votre score de confiance a augmenté.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre avis.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full text-slate-600 hover:text-blue-600 hover:bg-blue-50 font-bold text-sm h-8">
          Noter l'échange
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-white border-none shadow-2xl">
        <div className="bg-slate-900 p-6 text-white text-center">
           <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
             <ThumbsUp className="h-6 w-6 text-green-400" />
           </div>
           <DialogTitle className="text-xl font-black">Comment s'est passé l'échange ?</DialogTitle>
           <p className="text-slate-400 text-sm mt-1">
             Avec {partnerName}
           </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="group focus:outline-none transition-transform hover:scale-110"
              >
                <Star 
                  className={cn(
                    "h-8 w-8 transition-colors",
                    star <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200 group-hover:text-yellow-200"
                  )} 
                />
              </button>
            ))}
          </div>

          <Textarea 
            placeholder="Un petit commentaire privé pour nous aider à améliorer le matching..." 
            className="min-h-[100px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />

          <Button 
            onClick={handleSubmit} 
            disabled={rating === 0 || isSubmitting}
            className="w-full h-12 rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200"
          >
            {isSubmitting ? "Envoi..." : "Valider"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
