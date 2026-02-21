'use client';

import { useState } from 'react';
import { Loader2, Play, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ManualMatchLauncher() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLaunch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cron/generate-daily-matches', {
        method: 'POST', // Usually cron endpoints are GET or POST. Vercel cron uses GET by default, but let's check.
        headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}` // Simple protection if needed
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      setLastRun(new Date().toLocaleString());
      toast({
        title: "Matching lancé avec succès",
        description: `Résultat: ${result.message || 'OK'}`,
      });

    } catch (error: any) {
      console.error("Erreur lancement matching:", error);
      toast({
        variant: "destructive",
        title: "Erreur lors du lancement",
        description: error.message || "Une erreur est survenue.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
        <button 
            onClick={handleLaunch}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isLoading ? "Lancement en cours..." : "Lancer manuellement"}
        </button>

        {lastRun && (
            <div className="bg-green-50 p-3 rounded text-xs font-mono text-green-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Dernier run manuel: {lastRun} (Succès)
            </div>
        )}
    </div>
  );
}
