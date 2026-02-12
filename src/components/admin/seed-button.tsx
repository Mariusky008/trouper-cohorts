"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database, Loader2 } from "lucide-react";
import { seedJobSeekerProgram } from "@/app/actions/seed-program";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SeedButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSeed = async () => {
    if (!confirm("Attention : Cela va effacer et recréer tout le contenu du programme 'Emploi'. Continuer ?")) {
      return;
    }

    setLoading(true);
    try {
      const result = await seedJobSeekerProgram();
      if (result.success) {
        toast.success("Programme Emploi initialisé avec succès !");
        router.refresh();
      } else {
        toast.error("Erreur lors de l'initialisation : " + result.error);
      }
    } catch (e) {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleSeed} 
      disabled={loading}
      className="gap-2 border-dashed border-slate-300 hover:border-slate-400"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
      {loading ? "Initialisation..." : "Initialiser le Programme Emploi"}
    </Button>
  );
}
