"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitProof } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";

export function SubmissionForm({ missionId }: { missionId: string }) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);

    try {
      let proofUrl = formData.get("proof_url") as string;
      const note = formData.get("note") as string;

      // Si un fichier est sélectionné, on l'upload d'abord
      if (file) {
        const supabase = createClient();
        const fileExt = file.name.split(".").pop();
        const fileName = `${missionId}/${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from("proofs")
          .upload(fileName, file);

        if (error) throw error;

        // Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from("proofs")
          .getPublicUrl(fileName);
          
        proofUrl = publicUrl;
      }

      if (!proofUrl && !file) {
        toast.error("Veuillez fournir une URL ou un fichier.");
        setLoading(false);
        return;
      }

      // Soumettre l'action serveur avec l'URL finale
      const result = await submitProof(missionId, proofUrl, note);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Preuve validée ! Bien joué.");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="proof_url">Lien de la preuve (URL)</Label>
        <Input 
          id="proof_url" 
          name="proof_url" 
          placeholder="https://instagram.com/..." 
          disabled={!!file} // Désactivé si fichier choisi
        />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">OU</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Preuve Image (Screenshot)</Label>
        <div className="flex items-center gap-2">
            <Input 
            id="file" 
            type="file" 
            accept="image/*"
            className="cursor-pointer"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={loading}
            />
        </div>
        <p className="text-xs text-muted-foreground">Images uniquement (PNG, JPG).</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note (optionnel)</Label>
        <Textarea id="note" name="note" placeholder="Petit commentaire..." />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Valider ma mission"}
      </Button>
    </form>
  );
}
