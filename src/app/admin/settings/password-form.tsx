"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Lock } from "lucide-react";

export function AdminPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;
    
    if (newPassword !== confirmPassword) {
      toast.error("Erreur", { description: "Les mots de passe ne correspondent pas." });
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Erreur", { description: "Le mot de passe doit faire au moins 6 caractères." });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsLoading(false);

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      toast.success("Succès", { description: "Mot de passe mis à jour ! Vous pourrez désormais vous connecter avec votre email et ce mot de passe." });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <form onSubmit={handlePasswordUpdate} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="admin-new-password">Nouveau mot de passe</Label>
          <Input 
            id="admin-new-password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-confirm-password">Confirmer</Label>
          <Input 
            id="admin-confirm-password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
        {isLoading ? "Mise à jour..." : "Mettre à jour mon mot de passe"}
      </Button>
    </form>
  );
}
