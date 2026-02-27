'use client';

import { useState } from 'react';
import { Loader2, Play, CheckCircle, XCircle, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export function ManualMatchLauncher() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [lastEmailRun, setLastEmailRun] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLaunch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cron/generate-daily-matches', {
        method: 'POST',
      });
      
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur inconnue');
      }

      setLastRun(new Date().toLocaleString());
      
      toast({
        title: "✅ Matching terminé",
        description: `${data.matches_created} matchs générés pour le ${data.date}.`,
      });

    } catch (error: any) {
      console.error("Erreur lancement matching:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmails = async () => {
    setIsEmailLoading(true);
    try {
      const response = await fetch('/api/cron/send-daily-match-emails', {
        method: 'POST',
      });
      
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur inconnue');
      }

      setLastEmailRun(new Date().toLocaleString());
      
      toast({
        title: "📧 Emails envoyés",
        description: `${data.emails_sent} emails envoyés pour ${data.matches_processed} matchs.`,
      });

    } catch (error: any) {
      console.error("Erreur envoi emails:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="space-y-4">
        <div className="flex flex-col gap-2">
            <Button 
                onClick={handleLaunch}
                disabled={isLoading}
                className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700"
            >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Générer les Matchs (Force)
            </Button>
            
            {lastRun && (
                <div className="text-[10px] text-green-600 font-mono pl-1">
                    Dernier run: {lastRun}
                </div>
            )}

            <Button 
                onClick={handleSendEmails}
                disabled={isEmailLoading}
                variant="outline"
                className="w-full justify-start gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
                {isEmailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Envoyer les Emails (Force)
            </Button>

            {lastEmailRun && (
                <div className="text-[10px] text-blue-600 font-mono pl-1">
                    Dernier envoi: {lastEmailRun}
                </div>
            )}
        </div>
    </div>
  );
}
