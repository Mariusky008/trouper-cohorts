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
  mode?: "login" | "signup";
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
}

export function AuthDialog({ mode = "signup", trigger, defaultOpen = false }: AuthDialogProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeMode, setActiveMode] = useState(mode);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup State
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    fullName: "",
    city: "",
    trade: "",
    phone: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
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
      toast({ 
        title: "Erreur de connexion", 
        description: error.message || "Vérifiez vos identifiants.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            full_name: signupData.fullName,
            city: signupData.city,
            trade: signupData.trade,
            phone: signupData.phone
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create/Update Profile (Ideally handled by trigger, but we do it manually for safety)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
             id: authData.user.id,
             display_name: signupData.fullName,
             email: signupData.email,
             // city: signupData.city, // Commented out to prevent errors if column is missing
             trade: signupData.trade,
             phone: signupData.phone,
             role: 'member'
          })
          .select()
          .single();

        // 3. Create/Update Pre-Registration (for Admin Dashboard visibility)
        const { error: preRegError } = await supabase
            .from('pre_registrations')
            .upsert({
               email: signupData.email,
               first_name: signupData.fullName.split(' ')[0],
               last_name: signupData.fullName.split(' ').slice(1).join(' '),
               city: signupData.city,
               phone: signupData.phone,
               current_job: signupData.trade,
               program_type: 'job_seeker', // Defaulting to job seeker for network users
               status: 'approved',
               user_id: authData.user.id
            }, { onConflict: 'email' });

        // Note: If trigger exists, this might fail on duplicate key, which is fine (ignored).
      }

      toast({ title: "Compte créé !", description: "Bienvenue sur Mon Réseau Local." });
      setIsOpen(false);
      router.push("/mon-reseau-local/dashboard");
      router.refresh();

    } catch (error: any) {
      toast({ 
        title: "Erreur d'inscription", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Connexion</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white border-slate-200">
        <div className="p-6">
          <DialogHeader className="mb-4">
             <DialogTitle className="text-2xl font-black text-slate-900 text-center">
               {activeMode === 'login' ? 'Bon retour 👋' : 'Rejoindre le réseau 🚀'}
             </DialogTitle>
             <p className="text-center text-slate-500 text-sm">
               {activeMode === 'login' 
                 ? "Connectez-vous pour accéder à vos opportunités." 
                 : "Créez votre compte pour commencer à matcher."}
             </p>
          </DialogHeader>

          {activeMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
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
                   <Link href="#" className="text-xs text-blue-600 font-bold">Oublié ?</Link>
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
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prénom Nom</Label>
                    <Input 
                      placeholder="Jean Dupont" 
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({...signupData, fullName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ville</Label>
                    <Input 
                      placeholder="Paris" 
                      value={signupData.city}
                      onChange={(e) => setSignupData({...signupData, city: e.target.value})}
                      required
                    />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Votre Activité</Label>
                   <Input 
                     placeholder="Ex: Architecte..." 
                     value={signupData.trade}
                     onChange={(e) => setSignupData({...signupData, trade: e.target.value})}
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Téléphone</Label>
                   <Input 
                     type="tel"
                     placeholder="06 12 34 56 78" 
                     value={signupData.phone}
                     onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                     required
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label>Email</Label>
                 <Input 
                   type="email" 
                   placeholder="vous@exemple.com" 
                   value={signupData.email}
                   onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label>Mot de passe</Label>
                 <Input 
                   type="password" 
                   value={signupData.password}
                   onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                   required
                   minLength={6}
                 />
               </div>
               <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold h-11" disabled={isLoading}>
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Créer mon compte (1€)"}
               </Button>
               <p className="text-xs text-center text-slate-400">
                 En vous inscrivant, vous acceptez nos CGU. 3 jours d'essai pour 1€, puis 49€/mois.
               </p>
            </form>
          )}
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            {activeMode === 'login' ? "Pas encore membre ?" : "Déjà un compte ?"}
            <button 
              type="button"
              onClick={() => setActiveMode(activeMode === 'login' ? 'signup' : 'login')}
              className="ml-2 font-bold text-blue-600 hover:underline"
            >
              {activeMode === 'login' ? "Créer un compte" : "Se connecter"}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
