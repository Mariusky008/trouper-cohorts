'use client';

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  const handleHardReload = () => {
    // Force a hard reload from the server, bypassing the service worker cache for the document
    window.location.href = window.location.href;
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="bg-[#1e293b] border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-black text-white mb-2">Oups ! Une erreur est survenue.</h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Il semble que l'application ait rencontré un petit problème technique (probablement une mise à jour en attente).
        </p>

        <div className="space-y-3">
          <Button 
            onClick={() => reset()} 
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Réessayer
          </Button>
          
          <Button 
            onClick={handleHardReload}
            variant="outline"
            className="w-full h-12 border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold rounded-xl"
          >
            Recharger complètement la page
          </Button>

          <Link href="/mon-reseau-local/dashboard" className="block mt-4">
             <Button variant="ghost" className="w-full text-slate-500 hover:text-white">
                <Home className="mr-2 h-4 w-4" /> Retour à l'accueil
             </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
