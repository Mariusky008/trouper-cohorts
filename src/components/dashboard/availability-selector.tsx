"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckCircle2, Clock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
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
  const formattedDate = tomorrow.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

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
      className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-bl-full -z-0 opacity-50" />

      <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
                    Demain
                  </Badge>
                  <span className="text-sm font-bold text-slate-400 capitalize">{formattedDate}</span>
              </div>
              <h3 className="font-black text-2xl text-slate-900 leading-tight">
                Quand êtes-vous libre ?
              </h3>
            </div>
          </div>

          <AnimatePresence mode="wait">
              {!isAvailabilitySaved ? (
                <motion.div 
                    key="selector"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {["09h – 11h", "12h – 14h", "17h – 19h"].map((slot) => {
                      const isSelected = selectedSlots.includes(slot);
                      return (
                        <div 
                          key={slot}
                          onClick={() => toggleSlot(slot)}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 h-24 relative overflow-hidden group",
                            isSelected 
                              ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md shadow-blue-100" 
                              : "border-slate-100 bg-slate-50 text-slate-500 hover:border-blue-200 hover:bg-white"
                          )}
                        >
                          {isSelected && (
                              <div className="absolute top-2 right-2 text-blue-600">
                                  <CheckCircle2 className="h-5 w-5" />
                              </div>
                          )}
                          <Clock className={cn("h-6 w-6 mb-2 transition-colors", isSelected ? "text-blue-600" : "text-slate-400 group-hover:text-blue-400")} />
                          <span className="font-black text-lg">{slot}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <Button 
                    onClick={handleSaveAvailability}
                    disabled={selectedSlots.length === 0 || loading}
                    className="w-full h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg shadow-slate-200 transition-all hover:scale-[1.01]"
                  >
                    {loading ? "Enregistrement..." : (
                        <>
                            Valider ces créneaux <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                    )}
                  </Button>
                </motion.div>
              ) : (
                 <motion.div 
                    key="success"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-green-50 rounded-2xl p-6 text-center border border-green-100"
                 >
                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center text-green-500 mx-auto mb-4 shadow-sm">
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <h4 className="font-black text-xl text-green-900 mb-2">C'est tout bon !</h4>
                    <p className="text-green-700 font-medium mb-4">
                        On vous trouve le meilleur match pour demain.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center mb-6">
                       {selectedSlots.map(s => (
                           <Badge key={s} className="bg-white text-green-700 hover:bg-white border border-green-200 px-3 py-1 text-sm">
                               {s}
                           </Badge>
                       ))}
                    </div>
                    <Button variant="ghost" onClick={() => setIsAvailabilitySaved(false)} className="text-green-700 hover:text-green-800 hover:bg-green-100 font-bold">
                      Modifier mes choix
                    </Button>
                 </motion.div>
              )}
          </AnimatePresence>
      </div>
    </motion.div>
  );
}
