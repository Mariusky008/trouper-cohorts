"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckCircle2, Clock, ArrowRight, Sparkles, Settings, PauseCircle, PlayCircle, Sun, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { saveAvailability, getAvailability } from "@/lib/actions/network-availability";
import { updateNetworkSettings } from "@/lib/actions/network-settings";
import { useToast } from "@/hooks/use-toast";

interface AvailabilitySelectorProps {
  settings?: any;
  potentialCount?: number;
  onSuccess?: () => void;
}

export function AvailabilitySelector({ settings, potentialCount = 0, onSuccess }: AvailabilitySelectorProps) {
  const { toast } = useToast();
  
  // AVAILABILITY STATE
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isAvailabilitySaved, setIsAvailabilitySaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // FREQUENCY STATE
  const [frequency, setFrequency] = useState(settings?.frequency_per_week || 5);
  const [status, setStatus] = useState(settings?.status || 'active');
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);

  // Tomorrow's date YYYY-MM-DD
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Skip weekends logic:
  // If today is Friday (5), tomorrow is Saturday (6) -> Skip to Monday
  // If today is Saturday (6), tomorrow is Sunday (0) -> Skip to Monday
  // If today is Sunday (0), tomorrow is Monday (1) -> OK
  
  if (today.getDay() === 5) { // Friday -> Next match is Monday
      tomorrow.setDate(today.getDate() + 3);
  } else if (today.getDay() === 6) { // Saturday -> Next match is Monday
      tomorrow.setDate(today.getDate() + 2);
  }

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
      if (onSuccess) {
          setTimeout(() => {
              onSuccess();
          }, 1500);
      }
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

  // --- FREQUENCY HANDLERS ---

  const handleUpdateSettings = async (updates: any) => {
    setIsSettingsLoading(true);
    try {
      await updateNetworkSettings(updates);
      toast({ title: "Préférences mises à jour !" });
      if (updates.status) setStatus(updates.status);
      if (updates.frequency_per_week) setFrequency(updates.frequency_per_week);
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const togglePause = () => {
    const newStatus = status === 'active' ? 'pause' : 'active';
    handleUpdateSettings({ status: newStatus });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-[#1e293b]/50 backdrop-blur-md rounded-3xl border border-white/5 shadow-sm relative overflow-hidden h-full"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -z-0 opacity-50 pointer-events-none" />

      <div className="relative z-10 p-6 md:p-8">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border-blue-500/20">
                    Demain
                  </Badge>
                  <span className="text-sm font-bold text-slate-400 capitalize">{formattedDate}</span>
              </div>
              <h3 className="font-black text-2xl text-white leading-tight">
                Préparez votre journée
              </h3>
            </div>
            
            {/* PAUSE TOGGLE */}
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={togglePause}
                className={cn(
                    "rounded-full font-bold text-xs h-8 px-3 border transition-colors",
                    status === 'active' 
                        ? "text-slate-400 border-white/10 hover:bg-white/5 hover:text-white" 
                        : "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20"
                )}
            >
                {status === 'active' ? (
                    <><PauseCircle className="mr-2 h-3 w-3" /> Mettre en pause</>
                ) : (
                    <><PlayCircle className="mr-2 h-3 w-3" /> Reprendre</>
                )}
            </Button>
          </div>

          {status === 'pause' ? (
             <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-orange-500/10 rounded-2xl p-6 text-center border border-orange-500/20 mb-6"
             >
                <div className="h-12 w-12 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                   <Sun className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-orange-200 mb-1">Mode Pause Activé</h3>
                <p className="text-sm text-orange-300/80 font-medium">Profitez de votre temps libre ! Aucun match ne sera programmé.</p>
             </motion.div>
          ) : (
            <>
              {/* AVAILABILITY SELECTOR */}
              <div className="mb-8">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Vos Créneaux Libres
                  </h4>
                  
                  <AnimatePresence mode="wait">
                      {!isAvailabilitySaved ? (
                        <motion.div 
                            key="selector"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {["09h – 11h", "12h – 14h", "17h – 19h"].map((slot) => {
                              const isSelected = selectedSlots.includes(slot);
                              return (
                                <div 
                                  key={slot}
                                  onClick={() => toggleSlot(slot)}
                                  className={cn(
                                    "flex flex-col items-center justify-center p-3 rounded-2xl border-2 cursor-pointer transition-all duration-200 h-20 relative overflow-hidden group",
                                    isSelected 
                                      ? "border-blue-500 bg-blue-600/20 text-blue-300 shadow-md shadow-blue-900/20" 
                                      : "border-white/5 bg-white/5 text-slate-400 hover:border-white/10 hover:bg-white/10 hover:text-white"
                                  )}
                                >
                                  {isSelected && (
                                      <div className="absolute top-1 right-1 text-blue-400">
                                          <CheckCircle2 className="h-4 w-4" />
                                      </div>
                                  )}
                                  <span className={cn("font-black text-base", isSelected ? "text-blue-300" : "text-slate-300")}>{slot}</span>
                                </div>
                              );
                            })}
                          </div>
                          
                          <Button 
                            onClick={handleSaveAvailability}
                            disabled={selectedSlots.length === 0 || loading}
                            className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.01]"
                          >
                            {loading ? "Enregistrement..." : (
                                <>
                                    Valider ces créneaux <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                          </Button>
                        </motion.div>
                      ) : (
                         <motion.div 
                            key="success"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-emerald-500/10 rounded-2xl p-5 text-center border border-emerald-500/20"
                         >
                            <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold mb-3">
                                <CheckCircle2 className="h-5 w-5" /> Disponibilités enregistrées
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center mb-4">
                               {selectedSlots.map(s => (
                                   <Badge key={s} className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 px-3 py-1 text-xs">
                                       {s}
                                   </Badge>
                               ))}
                            </div>
                            <Button variant="link" size="sm" onClick={() => setIsAvailabilitySaved(false)} className="text-emerald-400 hover:text-emerald-300 h-auto p-0 font-bold text-xs underline">
                              Modifier
                            </Button>
                         </motion.div>
                      )}
                  </AnimatePresence>
              </div>

              {/* FREQUENCY SETTINGS (SIMPLIFIED) */}
              <div className="pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                        <Settings className="h-4 w-4" /> Votre Rythme Hebdo
                      </h4>
                      <div className="bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20 flex items-center gap-1">
                         <BarChart3 className="h-3 w-3 text-purple-400" />
                         <span className="font-black text-purple-300 text-xs">{potentialCount} opp.</span>
                      </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase">Intensité</span>
                        <span className="text-lg font-black text-blue-400">{frequency} <span className="text-xs text-slate-500 font-medium">j/sem</span></span>
                      </div>
                      <Slider 
                          value={[frequency]} 
                          min={1} 
                          max={5} 
                          step={1} 
                          onValueChange={(vals) => setFrequency(vals[0])}
                          onValueCommit={(vals) => handleUpdateSettings({ frequency_per_week: vals[0] })}
                          className="cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2">
                         <span>Cool (1j)</span>
                         <span>Intense (5j)</span>
                      </div>
                  </div>
              </div>
            </>
          )}
      </div>
    </motion.div>
  );
}
