"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { registerNetworkUser } from "@/actions/network-registration";
import { motion, AnimatePresence } from "framer-motion";

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

  // Animation Step State
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingMessages = [
    "Création de votre compte sécurisé...",
    "Initialisation de votre profil...",
    "Recherche des opportunités locales...",
    "Finalisation de l'espace membre..."
  ];

  useEffect(() => {
    if (isLoading && activeMode === 'signup') {
        const interval = setInterval(() => {
            setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
        }, 1500); // Change message every 1.5s
        return () => clearInterval(interval);
    } else {
        setLoadingStep(0);
    }
  }, [isLoading, activeMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
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
      // Start timing to ensure animation lasts at least 4.5s (3 steps * 1.5s)
      const startTime = Date.now();

      const formData = new FormData();
      formData.append("email", signupData.email);
      formData.append("password", signupData.password);
      formData.append("fullName", signupData.fullName);
      formData.append("city", signupData.city);
      formData.append("trade", signupData.trade);
      formData.append("phone", signupData.phone);

      // 2. Call Server Action to Create User
      const result = await registerNetworkUser(formData);
      if (result.error) throw new Error(result.error);

      // 3. Login Immediately with Retry
      let finalError = null;
      for (let i = 0; i < 3; i++) {
        const { error } = await supabase.auth.signInWithPassword({
            email: signupData.email,
            password: signupData.password,
        });
        
        if (!error) {
            finalError = null;
            break;
        }
        
        finalError = error;
        // Wait 1s before retry
        await new Promise(r => setTimeout(r, 1000));
      }

      if (finalError) {
          throw finalError;
      }

      // 4. Force Animation Completion
      // Calculate remaining time to match minimum animation duration (e.g., 5000ms)
      const MIN_DURATION = 5000;
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_DURATION - elapsedTime);
      
      if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      // Ensure all steps are shown as completed visually before redirect
      setLoadingStep(loadingMessages.length - 1);
      await new Promise(resolve => setTimeout(resolve, 800)); // Small pause at the end

      toast({ title: "Compte créé !", description: "Redirection..." });
      
      // 5. Client-side Redirect (Keep modal open until redirect happens to avoid white flash)
      // We do NOT set isLoading(false) here to keep the animation visible until the page changes.
      router.push("/mon-reseau-local/dashboard");
      router.refresh();

    } catch (error: any) {
      console.error("Signup error:", error);
      toast({ 
        title: "Erreur d'inscription", 
        description: error.message || "Une erreur est survenue.", 
        variant: "destructive" 
      });
      setIsLoading(false); // Only stop loading on error
    } 
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white border-slate-200">
        <AnimatePresence mode="wait">
            {isLoading && activeMode === 'signup' ? (
                <motion.div
                    key="signup-loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
                >
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, type: "spring" }}
                        className="h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center mb-8 relative"
                    >
                        <div className="absolute inset-0 border-4 border-blue-100 rounded-full animate-ping opacity-20"></div>
                        <Sparkles className="h-10 w-10 text-blue-600 animate-pulse" />
                    </motion.div>
                    
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Bienvenue à bord ! 🚀</h3>
                    <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                        Nous préparons votre espace personnel. Cela ne prendra que quelques secondes.
                    </p>

                    <div className="w-full max-w-xs space-y-4">
                        {loadingMessages.map((msg, index) => (
                            <motion.div 
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ 
                                    opacity: index <= loadingStep ? 1 : 0.3, 
                                    x: 0,
                                    scale: index === loadingStep ? 1.05 : 1
                                }}
                                className="flex items-center gap-3 text-sm font-medium"
                            >
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                                    index < loadingStep ? "bg-green-100 text-green-600" : 
                                    index === loadingStep ? "bg-blue-100 text-blue-600 animate-pulse" : 
                                    "bg-slate-100 text-slate-300"
                                }`}>
                                    {index < loadingStep ? <Check className="h-3.5 w-3.5" /> : 
                                     index === loadingStep ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 
                                     <div className="h-2 w-2 rounded-full bg-current" />}
                                </div>
                                <span className={index === loadingStep ? "text-blue-700 font-bold" : "text-slate-600"}>
                                    {msg}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>

        <div className="p-6">
          <DialogHeader className="mb-4">
             <DialogTitle className="text-2xl font-black text-slate-900 text-center">
               {activeMode === 'login' ? 'Bon retour 👋' : 'Rejoindre le réseau 🚀'}
             </DialogTitle>
          </DialogHeader>

          {activeMode === 'login' ? (
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
               {/* Simplified Signup Form */}
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
                   <Label>Activité</Label>
                   <Input 
                     placeholder="Architecte" 
                     value={signupData.trade}
                     onChange={(e) => setSignupData({...signupData, trade: e.target.value})}
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Téléphone</Label>
                   <Input 
                     type="tel"
                     placeholder="06..." 
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
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Créer mon compte (Essai Gratuit)"}
               </Button>
               <p className="text-xs text-center text-slate-400">
                 1 jour d'essai gratuit, puis 49€/mois.
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
