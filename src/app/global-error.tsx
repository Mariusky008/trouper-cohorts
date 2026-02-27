'use client';

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="bg-[#0f172a] text-white">
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                
                <h2 className="text-2xl font-black text-white mb-2">Erreur Critique</h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                Une erreur inattendue s'est produite.
                </p>

                <Button 
                    onClick={() => {
                        // Hard reload on global error
                        window.location.href = "/";
                    }} 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg"
                >
                    <RefreshCw className="mr-2 h-4 w-4" /> Recharger l'application
                </Button>
            </div>
        </div>
      </body>
    </html>
  );
}
