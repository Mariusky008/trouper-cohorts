"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("Mot de passe trop court", {
        description: "Le mot de passe doit contenir au moins 6 caractères.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Confirmation invalide", {
        description: "Les deux mots de passe doivent être identiques.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Mot de passe mis à jour", {
        description: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
      });
      router.push("/");
    } catch (e: any) {
      toast.error("Impossible de mettre à jour le mot de passe", {
        description: e.message || "Veuillez réouvrir le lien de réinitialisation.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-muted/30">
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <Button variant="ghost" asChild>
          <Link href="/">← Retour</Link>
        </Button>
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <div className="h-10 w-10 mx-auto bg-primary text-primary-foreground rounded flex items-center justify-center font-black text-sm">
            PA
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Définir un nouveau mot de passe</h1>
          <p className="text-sm text-muted-foreground">
            Saisissez votre nouveau mot de passe pour récupérer l’accès à votre compte.
          </p>
        </div>

        <Card className="border-muted-foreground/20 shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
