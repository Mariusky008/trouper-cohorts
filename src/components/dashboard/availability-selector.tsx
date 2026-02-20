"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { saveAvailability, getAvailability } from "@/lib/actions/network-availability";
import { useToast } from "@/hooks/use-toast";

export function AvailabilitySelector() {
  const { toast } = useToast();
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isAvailabilitySaved, setIsAvailabilitySaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Tomorrow's date YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  useEffect(() => {
    // Load saved availability on mount
    getAvailability(dateStr).then((slots) => {
      if (slots && slots.length > 0) {
        setSelectedSlots(slots);
        setIsAvailabilitySaved(true);
      }
    });
  }, [dateStr]);

  const toggleSlot = (slot: string) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleSaveAvailability = async () => {
    setLoading(true);
    try {
      await saveAvailability(dateStr, selectedSlots);
      setIsAvailabilitySaved(true);
      toast({
        title: "Disponibilités enregistrées !",
        description: "Nous chercherons un partenaire pour demain.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer vos disponibilités.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-black text-xl text-slate-900">Demain ({tomorrow.toLocaleDateString('fr-FR', { weekday: 'long' })})</h3>
          <p className="text-slate-500 text-sm">Choisissez vos créneaux pour le matching.</p>
        </div>
        <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
          <Calendar className="h-5 w-5" />
        </div>
      </div>

      {!isAvailabilitySaved ? (
        <div className="space-y-4">
          {["09h – 11h", "12h – 14h", "17h – 19h"].map((slot) => {
            const isSelected = selectedSlots.includes(slot);
            return (
              <div 
                key={slot}
                onClick={() => toggleSlot(slot)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                  isSelected 
                    ? "border-blue-600 bg-blue-50/50" 
                    : "border-slate-100 bg-white hover:border-blue-200"
                )}
              >
                <span className={cn("font-bold text-lg", isSelected ? "text-blue-900" : "text-slate-600")}>
                  {slot}
                </span>
                <div className={cn(
                  "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                  isSelected ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"
                )}>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                </div>
              </div>
            );
          })}
          <Button 
            onClick={handleSaveAvailability}
            disabled={selectedSlots.length === 0 || loading}
            className="w-full mt-4 h-12 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
          >
            {loading ? "Enregistrement..." : "Valider mes disponibilités"}
          </Button>
        </div>
      ) : (
         <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="font-black text-xl text-slate-900 mb-2">C'est noté !</h4>
            <p className="text-slate-500">Nous cherchons le meilleur partenaire pour demain.</p>
            <div className="flex gap-2 mt-2">
               {selectedSlots.map(s => <Badge key={s} variant="outline" className="bg-slate-50">{s}</Badge>)}
            </div>
            <Button variant="link" onClick={() => setIsAvailabilitySaved(false)} className="mt-4 text-blue-600 font-bold">
              Modifier
            </Button>
         </div>
      )}
    </motion.div>
  );
}
