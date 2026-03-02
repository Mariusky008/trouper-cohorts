"use client";

import { motion } from "framer-motion";
import { Lock, Sparkles, Flame, Users, Handshake, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { createCheckoutSession } from "@/lib/actions/stripe"; // COMMENTED OUT FOR DEBUG
import { toast } from "sonner";
import { useState } from "react";

// This is the functional component for the "Pay-to-Reveal" strategy
// It uses Server Actions to initiate Stripe Checkout
export function PremiumLockedCard({ priceId }: { priceId: string }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // const result = await createCheckoutSession(priceId);
      // if (result.error) {
      //   toast.error(result.error);
      // } else if (result.url) {
      //   window.location.href = result.url;
      // }
      toast.info("Le paiement est temporairement désactivé pour maintenance.");
    } catch (error) {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto min-h-[600px] h-auto rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#020617] flex flex-col items-center text-center p-6 border border-white/10 pb-8 group">
      
      {/* Background Image with HEAVY Blur */}
      <div className="absolute inset-0 z-0">
        <img 
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80" 
            alt="Match Flouté" 
            className="w-full h-full object-cover opacity-40 blur-[20px] scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full h-full justify-between">
        
        <div className="flex flex-col items-center w-full">
            {/* Header Badge */}
            <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 px-3 py-1 mb-8 flex items-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.2)] animate-pulse">
                <Sparkles className="w-3 h-3" /> MATCH PREMIUM DÉTECTÉ
            </Badge>

            {/* Blurred Identity */}
            <div className="relative mb-6">
                <div className="w-28 h-28 rounded-full border-4 border-white/5 flex items-center justify-center bg-white/5 backdrop-blur-md relative z-10 overflow-hidden shadow-2xl">
                    <img 
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80" 
                        className="w-full h-full object-cover blur-[15px] opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-10 h-10 text-white drop-shadow-md" />
                    </div>
                </div>
            </div>

            {/* Teasing Info */}
            <div className="w-full space-y-4 mb-6 text-center">
                <h3 className="text-2xl font-black text-white leading-tight">
                    <span className="blur-[6px]">Sarah Martin</span>
                </h3>
                <div className="flex justify-center gap-2">
                    <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700">Architecte</Badge>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm mt-4">
                    <p className="text-slate-300 text-sm font-medium leading-relaxed">
                        "Je cherche à étendre mon réseau, j'ai déjà un bon réseau moi-même donc je peux aider aussi et échanger des bons plans..."
                    </p>
                </div>
            </div>
        </div>

        {/* CTA Section */}
        <div className="w-full space-y-3">
            
            <Button 
                onClick={handleCheckout}
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-black text-base rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.3)] border-2 border-white/20 transition-all hover:scale-[1.02]"
            >
                {loading ? "Chargement..." : "DÉBLOQUER CE MATCH 🔓"}
            </Button>
            
        </div>

      </div>
    </div>
  );
}
