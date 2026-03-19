"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface AuthDialogProps {
  mode?: "login"; // Deprecated but kept for compatibility
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
}

export function AuthDialog({ mode = "login", trigger, defaultOpen = false }: AuthDialogProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup State - REMOVED
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setInfoMessage("");
    
    try {
      // Force sign out first to ensure clean state
      await supabase.auth.signOut();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({ title: "Connexion réussie !" });
      setIsOpen(false);
      router.push("/mon-reseau-local/dashboard");
      router.refresh();
    } catch (error: any) {
      const rawMessage = String(error?.message || "");
      const isBadCredentials =
        /invalid login credentials/i.test(rawMessage) ||
        /invalid credentials/i.test(rawMessage) ||
        /email not confirmed/i.test(rawMessage);
      const userMessage = isBadCredentials
        ? "Email ou mot de passe incorrect."
        : rawMessage || "Vérifiez vos identifiants.";
      setErrorMessage(userMessage);
      toast({ 
        title: "Erreur de connexion", 
        description: userMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage("");
    setInfoMessage("");
    if (!email) {
      setErrorMessage("Entrez votre email pour recevoir le lien de réinitialisation.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) throw error;
      const message = "Email de réinitialisation envoyé. Vérifiez votre boîte mail.";
      setInfoMessage(message);
      toast({ title: "Email envoyé", description: message });
    } catch (error: any) {
      const message = String(error?.message || "Impossible d'envoyer l'email.");
      setErrorMessage(message);
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-6 bg-white border-slate-200">
          <DialogHeader className="mb-4">
             <DialogTitle className="text-2xl font-black text-slate-900 text-center">
               Bon retour 👋
             </DialogTitle>
          </DialogHeader>

            <form onSubmit={handleLogin} className="space-y-4">
               {/* Login Form Fields */}
               <div className="space-y-2">
                 <Label>Email</Label>
                 <Input 
                   type="email" 
                   placeholder="vous@exemple.com" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <div className="flex justify-between items-center">
                   <Label>Mot de passe</Label>
                   <button
                     type="button"
                     onClick={handleForgotPassword}
                     disabled={isLoading}
                     className="text-xs text-blue-600 hover:underline disabled:opacity-60"
                   >
                     Mot de passe oublié ?
                   </button>
                 </div>
                 <Input 
                   type="password" 
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required
                 />
               </div>
               <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold h-11" disabled={isLoading}>
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Se connecter"}
               </Button>
               {errorMessage && (
                 <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                   {errorMessage}
                 </p>
               )}
               {infoMessage && (
                 <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                   {infoMessage}
                 </p>
               )}
            </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            Pas encore membre ?
            <Link href="/inscription/spheres" className="ml-2 font-bold text-blue-600 hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
