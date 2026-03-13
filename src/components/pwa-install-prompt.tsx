"use client";

import { useState, useEffect } from "react";
import { X, Share, Download, PlusSquare, Smartphone, Anchor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function PWAInstallPrompt({ forceShow = false, onDismiss }: { forceShow?: boolean, onDismiss?: () => void }) {
  const [showPrompt, setShowPrompt] = useState(forceShow);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (forceShow) {
        setShowPrompt(true);
    } else {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        if (isStandalone) return;
        
        // Auto-show logic for iOS (since no beforeinstallprompt)
        if (isIosDevice) {
             setTimeout(() => setShowPrompt(true), 3000);
        }
    }

    // For Android/Desktop (Chrome)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!forceShow) {
         setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [forceShow]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    } else {
        // Fallback for manual trigger on desktop without prompt event
        alert("Pour installer l'application :\n1. Cliquez sur l'icône d'installation dans la barre d'adresse (à droite)\nOU\n2. Menu Chrome (⋮) > Installer l'application");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (onDismiss) onDismiss();
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-80 bg-white border border-[#2E130C]/10 rounded-2xl shadow-2xl p-4 z-50 flex flex-col gap-3 backdrop-blur-xl"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-[#B20B13] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-[#B20B13]/30 border-2 border-[#2E130C]">
                  <Anchor className="h-5 w-5 text-[#E2D9BC]" />
               </div>
               <div>
                 <h4 className="font-bold text-[#2E130C] text-sm font-titan tracking-wide">Installer Popey</h4>
                 <p className="text-xs text-[#2E130C]/60 mt-0.5 font-medium">Pour une meilleure expérience.</p>
               </div>
            </div>
            <button onClick={handleDismiss} className="text-[#2E130C]/40 hover:text-[#2E130C] p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {isIOS ? (
            <div className="bg-[#F3F0E7] rounded-xl p-3 text-xs text-[#2E130C]/80 space-y-2 border border-[#2E130C]/5">
              <p className="flex items-center gap-2 font-medium">
                1. Appuyez sur <Share className="h-4 w-4 text-[#B20B13]" /> <span className="text-[#B20B13] font-bold">Partager</span>
              </p>
              <p className="flex items-center gap-2 font-medium">
                2. Puis <PlusSquare className="h-4 w-4 text-[#2E130C]" /> <span className="text-[#2E130C] font-bold">Sur l'écran d'accueil</span>
              </p>
            </div>
          ) : (
             <Button 
               onClick={handleInstallClick} 
               className="w-full bg-[#B20B13] hover:bg-[#B20B13]/90 text-[#E2D9BC] font-bold h-10 text-sm rounded-xl shadow-lg shadow-[#B20B13]/20 border-2 border-[#2E130C]"
             >
               <Download className="mr-2 h-4 w-4" /> Installer maintenant
             </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}