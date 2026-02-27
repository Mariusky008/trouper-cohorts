"use client";

import { useState, useEffect } from "react";
import { X, Share, Download, PlusSquare, Smartphone } from "lucide-react";
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
    if (!isIOS && deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
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
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-80 bg-[#0f172a] border border-blue-500/30 rounded-2xl shadow-2xl p-4 z-50 flex flex-col gap-3 backdrop-blur-xl"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/30">
                  <Smartphone className="h-5 w-5 text-white" />
               </div>
               <div>
                 <h4 className="font-bold text-white text-sm">Installer l'application</h4>
                 <p className="text-xs text-slate-400 mt-0.5 font-medium">Pour une meilleure expérience.</p>
               </div>
            </div>
            <button onClick={handleDismiss} className="text-slate-500 hover:text-white p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {isIOS ? (
            <div className="bg-slate-800/50 rounded-xl p-3 text-xs text-slate-300 space-y-2 border border-white/5">
              <p className="flex items-center gap-2 font-medium">
                1. Appuyez sur <Share className="h-4 w-4 text-blue-400" /> <span className="text-blue-400 font-bold">Partager</span>
              </p>
              <p className="flex items-center gap-2 font-medium">
                2. Puis <PlusSquare className="h-4 w-4 text-slate-200" /> <span className="text-white font-bold">Sur l'écran d'accueil</span>
              </p>
            </div>
          ) : (
             <Button 
               onClick={handleInstallClick} 
               className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-10 text-sm rounded-xl shadow-lg shadow-blue-900/20"
             >
               <Download className="mr-2 h-4 w-4" /> Installer maintenant
             </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
