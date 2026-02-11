"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fixProgramStructure } from "@/actions/setup";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setResult(null);
    try {
        const res = await fixProgramStructure();
        if (res.success) {
            toast.success(res.message);
            setResult(`✅ Succès : ${res.message}`);
        } else {
            toast.error("Erreur: " + res.error);
            setResult(`❌ Erreur : ${res.error}`);
        }
    } catch (e) {
        toast.error("Erreur inattendue");
        setResult("❌ Erreur inattendue lors de l'appel serveur.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-2xl mx-auto space-y-8">
        <div>
            <h1 className="text-3xl font-bold mb-2">Maintenance Admin</h1>
            <p className="text-muted-foreground">Outils de réparation et de migration de la base de données.</p>
        </div>

        <div className="p-6 border rounded-xl bg-slate-50 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Programme & Structure</h2>
            <p className="mb-6 text-sm text-slate-600">
                Ce script va vérifier l'intégrité du programme. Il va insérer le <strong>J9 (Prospection)</strong> et décaler les jours suivants si nécessaire.
                Il garantit que l'onglet "Programme" de l'admin reflète la réalité.
            </p>
            
            <Button 
                onClick={handleRun} 
                size="lg" 
                className="w-full font-bold"
                disabled={loading}
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Traitement en cours...
                    </>
                ) : (
                    "🚀 Réparer / Mettre à jour le Programme (J9)"
                )}
            </Button>

            {result && (
                <div className={`mt-4 p-4 rounded-lg text-sm font-medium ${result.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {result}
                </div>
            )}
        </div>
    </div>
  );
}
