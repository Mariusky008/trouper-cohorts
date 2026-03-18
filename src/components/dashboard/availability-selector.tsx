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
  // Initialize with settings or defaults, but don't strictly bind to settings to allow local changes
  const [selectedSlots, setSelectedSlots] = useState<string[]>(settings?.preferred_slots || []);
  const [selectedDays, setSelectedDays] = useState<string[]>(settings?.preferred_days || ['mon', 'tue', 'wed', 'thu', 'fri']);
  const [isAvailabilitySaved, setIsAvailabilitySaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // FREQUENCY STATE
  const [status, setStatus] = useState(settings?.status || 'active');
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);

  // Track local modifications to prevent server sync from overriding them
  const [hasLocallyModified, setHasLocallyModified] = useState(false);

  // Sync ONLY on initial mount to avoid resetting user clicks before save
  useEffect(() => {
      // Don't override if user is already saving or has modified locally
      if (loading || hasLocallyModified) return;
      
      if (settings?.preferred_slots?.length > 0) {
          setSelectedSlots(settings.preferred_slots);
      }
      if (settings?.preferred_days?.length > 0) {
          setSelectedDays(settings.preferred_days);
      }
  }, [settings, loading, hasLocallyModified]);

  // Tomorrow's date YYYY-MM-DD
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Skip weekends logic
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
    setHasLocallyModified(true);
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleSaveAvailability = async () => {
    setLoading(true);
    try {
      // Create copies to ensure stable reference during async operations
      const currentDays = [...selectedDays];
      const currentSlots = [...selectedSlots];
      
      // Save global network settings (days + default slots)
      const result = await updateNetworkSettings({
          preferred_days: currentDays,
          preferred_slots: currentSlots,
          frequency_per_week: currentDays.length
      });

      if (!result || result.success === false) {
          throw new Error("Failed to save settings to server");
      }

      // Optionally save explicit slots for tomorrow (retro-compatibility)
      const tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
      if (currentDays.includes(tomorrowDay)) {
         await saveAvailability(dateStr, currentSlots);
      }
      
      // Force state updates immediately for UX only AFTER successful save
      setIsAvailabilitySaved(true);
      
      // Keep local state perfectly locked to what we just saved
      setSelectedDays(currentDays);
      setSelectedSlots(currentSlots);
      
      toast({
        title: "Disponibilités enregistrées !",
        description: "Vos paramètres de mise en relation sont à jour.",
      });
      
      // Delay closing slightly so user can see the success state
      setTimeout(() => {
          if (onSuccess) {
              onSuccess();
          }
      }, 500);
      
    } catch (error) {
      console.error("Save availability error:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer vos disponibilités.",
        variant: "destructive",
      });
      setIsAvailabilitySaved(false);
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
      className="bg-white rounded-3xl border border-[#2E130C]/10 shadow-sm relative overflow-hidden h-full"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-0 opacity-50 pointer-events-none" />

      <div className="relative z-10 p-6 md:p-8">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200">
                    Demain
                  </Badge>
                  <span className="text-sm font-bold text-[#2E130C]/60 capitalize">{formattedDate}</span>
              </div>
              <h3 className="font-black text-2xl text-[#2E130C] leading-tight">
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
                        ? "text-[#2E130C]/60 border-[#2E130C]/10 hover:bg-slate-50 hover:text-[#2E130C]" 
                        : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
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
                className="bg-orange-50 rounded-2xl p-6 text-center border border-orange-200 mb-6"
             >
                <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                   <Sun className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-orange-800 mb-1">Mode Pause Activé</h3>
                <p className="text-sm text-orange-700/80 font-medium">Profitez de votre temps libre ! Aucun match ne sera programmé.</p>
             </motion.div>
          ) : (
            <>
              {/* AVAILABILITY SELECTOR */}
              <div className="mb-8">
                  <h4 className="text-sm font-bold text-[#2E130C]/60 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Vos Créneaux Libres
                  </h4>
                  
                      <AnimatePresence mode="wait">
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
                                        ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm" 
                                        : "border-[#2E130C]/10 bg-white text-[#2E130C]/60 hover:border-blue-300 hover:text-blue-600"
                                    )}
                                  >
                                    {isSelected && (
                                        <div className="absolute top-1 right-1 text-blue-500">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                    )}
                                    <span className={cn("font-black text-base", isSelected ? "text-blue-700" : "text-[#2E130C]/70")}>{slot}</span>
                                  </div>
                                );
                              })}
                            </div>
                            

                          </motion.div>
                      </AnimatePresence>
              </div>

              {/* FREQUENCY SETTINGS (SIMPLIFIED) */}
              <div className="pt-6 border-t border-[#2E130C]/10 mb-8">
                  <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-[#2E130C]/60 uppercase tracking-wide flex items-center gap-2">
                        <Settings className="h-4 w-4" /> Jours de disponibilité
                      </h4>
                      <div className="bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 flex items-center gap-1">
                         <BarChart3 className="h-3 w-3 text-purple-600" />
                         <span className="font-black text-purple-700 text-xs">{potentialCount} opp.</span>
                      </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-2xl p-4 border border-[#2E130C]/5">
                      <p className="text-sm text-[#2E130C]/60 font-medium mb-4">
                          Sélectionnez les jours où vous souhaitez recevoir des matchs (du lundi au vendredi).
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                          {[
                              { id: 'mon', label: 'Lundi' },
                              { id: 'tue', label: 'Mardi' },
                              { id: 'wed', label: 'Mercredi' },
                              { id: 'thu', label: 'Jeudi' },
                              { id: 'fri', label: 'Vendredi' }
                          ].map((day) => {
                              const isSelected = selectedDays.includes(day.id);
                              return (
                                  <button
                                      key={day.id}
                                      onClick={() => {
                                          setHasLocallyModified(true);
                                          if (isSelected) {
                                              setSelectedDays(selectedDays.filter((d: string) => d !== day.id));
                                          } else {
                                              setSelectedDays([...selectedDays, day.id]);
                                          }
                                      }}
                                      className={cn(
                                          "px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer",
                                          isSelected 
                                              ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                                              : "bg-white text-[#2E130C]/60 border-[#2E130C]/10 hover:border-blue-300"
                                      )}
                                  >
                                      {day.label}
                                  </button>
                              );
                          })}
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-[#2E130C]/10">
                        <span className="text-xs font-bold text-[#2E130C]/60 uppercase">Fréquence résultante</span>
                        <span className="text-lg font-black text-blue-600">{selectedDays.length} <span className="text-xs text-[#2E130C]/50 font-medium">j/sem</span></span>
                      </div>
                  </div>
              </div>

              {/* SAVE BUTTON AT THE BOTTOM */}
              <Button 
                onClick={handleSaveAvailability}
                disabled={selectedSlots.length === 0 || selectedDays.length === 0 || loading}
                className={cn(
                    "w-full h-14 text-lg font-black text-white rounded-xl shadow-lg transition-all hover:scale-[1.01]",
                    isAvailabilitySaved 
                        ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-900/10" 
                        : "bg-blue-600 hover:bg-blue-700 shadow-blue-900/10"
                )}
              >
                {loading ? "Enregistrement..." : isAvailabilitySaved ? (
                    <>
                        <CheckCircle2 className="mr-2 h-5 w-5" /> Enregistré ! (Fermeture...)
                    </>
                ) : (
                    <>
                        Valider mes disponibilités <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                )}
              </Button>
            </>
          )}
      </div>
    </motion.div>
  );
}