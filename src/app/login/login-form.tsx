"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormProps {
  defaultEmail?: string;
}

export function LoginForm({ defaultEmail = "" }: LoginFormProps) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      if (isPasswordMode) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Connexion réussie", {
          description: "Bienvenue !",
        });
        router.push("/mon-reseau-local/dashboard");
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        toast.success("Email envoyé", {
          description: "Clique sur le lien reçu pour te connecter.",
        });
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Connexion impossible", {
        description: e.message || "Vérifie tes identifiants et réessaie.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="toi@email.com"
        />
      </div>

      {isPasswordMode && (
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting 
          ? "Chargement..." 
          : isPasswordMode 
            ? "Se connecter" 
            : "Recevoir un lien de connexion"
        }
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsPasswordMode(!isPasswordMode)}
          className="text-xs text-muted-foreground underline hover:text-primary transition-colors"
        >
          {isPasswordMode 
            ? "Se connecter avec un lien magique (sans mot de passe)" 
            : "J'ai un mot de passe, je veux l'utiliser"
          }
        </button>
      </div>
    </form>
  );
}
