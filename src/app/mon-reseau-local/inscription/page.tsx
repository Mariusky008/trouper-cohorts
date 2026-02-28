"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, ArrowLeft, Target, Shield, Users, Building2, Megaphone, Share2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { registerNetworkUser } from "@/actions/network-registration";

// --- STEPS CONFIGURATION ---
const STEPS = [
  { id: 1, title: "Identité", icon: Shield },
  { id: 2, title: "Votre Offre (Donner)", icon: Share2 },
  { id: 3, title: "Vos Besoins (Recevoir)", icon: Target },
];

export default function RegistrationWizard() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    // Step 1: Base
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    trade: "",
    
    // Step 2: Give (Terrain de Chasse)
    influenceSectors: "", // Comma separated
    clubs: "", // Comma separated
    socialNetwork: "LinkedIn",
    socialFollowers: "0-1000",
    
    // Step 3: Receive (Besoins)
    targetCompanies: "", // "Le Portier"
    prescribers: "", // "Le Prescripteur"
    targetClubs: "", // "L'Infiltré"
    commGoal: "", // "L'Amplificateur"
  });

  const updateForm = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // 1. Prepare structured data
      const giveProfile = {
        influence_sectors: formData.influenceSectors.split(',').map(s => s.trim()).filter(Boolean),
        clubs: formData.clubs.split(',').map(s => s.trim()).filter(Boolean),
        social_network: {
            platform: formData.socialNetwork,
            followers: formData.socialFollowers
        }
      };

      const receiveProfile = {
        target_companies: formData.targetCompanies.split(',').map(s => s.trim()).filter(Boolean),
        prescribers: formData.prescribers.split(',').map(s => s.trim()).filter(Boolean),
        target_clubs: formData.targetClubs.split(',').map(s => s.trim()).filter(Boolean),
        comm_goal: formData.commGoal
      };

      // 2. Create FormData for Server Action
      const serverData = new FormData();
      serverData.append("email", formData.email);
      serverData.append("password", formData.password);
      serverData.append("fullName", `${formData.firstName} ${formData.lastName}`);
      serverData.append("city", formData.city);
      serverData.append("trade", formData.trade);
      serverData.append("phone", formData.phone);
      
      // Pass JSON strings for the new columns
      serverData.append("give_profile", JSON.stringify(giveProfile));
      serverData.append("receive_profile", JSON.stringify(receiveProfile));

      // 3. Register
      const result = await registerNetworkUser(serverData);
      if (result.error) throw new Error(result.error);

      // 4. Auto Login
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) throw loginError;

      toast({ title: "Inscription réussie ! 🚀", description: "Bienvenue dans le réseau." });
      router.push("/mon-reseau-local/dashboard");

    } catch (error: any) {
      toast({ 
        title: "Erreur", 
        description: error.message || "Une erreur est survenue.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header Progress */}
        <div className="bg-slate-900 p-6 text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-black uppercase tracking-widest">Mon Réseau Local</h1>
                <Badge className="bg-blue-600 text-white border-none">Inscription</Badge>
            </div>
            
            {/* Steps Indicator */}
            <div className="flex justify-between relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-700 -z-0 -translate-y-1/2"></div>
                {STEPS.map((s) => {
                    const isActive = s.id === step;
                    const isCompleted = s.id < step;
                    return (
                        <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-all duration-300 ${
                                isActive ? "bg-blue-600 border-blue-900 text-white scale-110" : 
                                isCompleted ? "bg-green-500 border-slate-900 text-white" : 
                                "bg-slate-800 border-slate-900 text-slate-500"
                            }`}>
                                {isCompleted ? <Check className="w-5 h-5" /> : s.id}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-blue-400" : "text-slate-500"}`}>
                                {s.title}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Form Content */}
        <div className="p-8">
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div 
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-black text-slate-900">Qui êtes-vous ?</h2>
                            <p className="text-slate-500">Commençons par les présentations.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Prénom</Label>
                                <Input placeholder="Jean" value={formData.firstName} onChange={e => updateForm("firstName", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Nom</Label>
                                <Input placeholder="Dupont" value={formData.lastName} onChange={e => updateForm("lastName", e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Votre activité (Métier)</Label>
                            <Input placeholder="Ex: Architecte d'intérieur, Coach sportif..." value={formData.trade} onChange={e => updateForm("trade", e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Ville</Label>
                                <Input placeholder="Bordeaux" value={formData.city} onChange={e => updateForm("city", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Téléphone</Label>
                                <Input placeholder="06 12 34 56 78" value={formData.phone} onChange={e => updateForm("phone", e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-slate-100">
                            <Label>Email (Connexion)</Label>
                            <Input type="email" placeholder="jean@exemple.com" value={formData.email} onChange={e => updateForm("email", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Mot de passe</Label>
                            <Input type="password" value={formData.password} onChange={e => updateForm("password", e.target.value)} />
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div 
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-6">
                            <div className="inline-flex p-3 bg-green-100 rounded-full mb-4">
                                <Share2 className="w-6 h-6 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">Votre Terrain de Chasse</h2>
                            <p className="text-slate-500">Ce que vous pouvez apporter au réseau (DONNER).</p>
                        </div>

                        <Card className="p-4 border-green-100 bg-green-50/30">
                            <Label className="text-green-800 font-bold mb-2 block">Secteurs d'influence</Label>
                            <p className="text-xs text-slate-500 mb-2">Dans quels domaines avez-vous le plus de contacts ?</p>
                            <Input 
                                placeholder="Ex: BTP, Restauration, Immobilier, Startups..." 
                                value={formData.influenceSectors} 
                                onChange={e => updateForm("influenceSectors", e.target.value)} 
                                className="bg-white"
                            />
                        </Card>

                        <Card className="p-4 border-green-100 bg-green-50/30">
                            <Label className="text-green-800 font-bold mb-2 block">Clubs & Réseaux</Label>
                            <p className="text-xs text-slate-500 mb-2">De quels groupes faites-vous déjà partie ?</p>
                            <Input 
                                placeholder="Ex: BNI, Club d'entreprises, Asso sportive..." 
                                value={formData.clubs} 
                                onChange={e => updateForm("clubs", e.target.value)} 
                                className="bg-white"
                            />
                        </Card>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Réseau Social Principal</Label>
                                <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    value={formData.socialNetwork}
                                    onChange={e => updateForm("socialNetwork", e.target.value)}
                                >
                                    <option value="LinkedIn">LinkedIn</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="Facebook">Facebook</option>
                                    <option value="TikTok">TikTok</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Volume d'abonnés</Label>
                                <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    value={formData.socialFollowers}
                                    onChange={e => updateForm("socialFollowers", e.target.value)}
                                >
                                    <option value="0-1000">0 - 1k</option>
                                    <option value="1000-5000">1k - 5k</option>
                                    <option value="5000-10000">5k - 10k</option>
                                    <option value="10000+">10k +</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div 
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-6">
                            <div className="inline-flex p-3 bg-blue-100 rounded-full mb-4">
                                <Target className="w-6 h-6 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">Vos Besoins</h2>
                            <p className="text-slate-500">Pour que l'algorithme travaille pour vous (RECEVOIR).</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-blue-800 font-bold">
                                    <Building2 className="w-4 h-4" /> Le Portier (Cibles précises)
                                </Label>
                                <Input 
                                    placeholder="Ex: DRH de Cdiscount, Mairie de Bordeaux..." 
                                    value={formData.targetCompanies} 
                                    onChange={e => updateForm("targetCompanies", e.target.value)} 
                                />
                                <p className="text-[10px] text-slate-400">Qui rêvez-vous d'approcher ?</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-blue-800 font-bold">
                                    <Users className="w-4 h-4" /> Le Prescripteur (Partenaires)
                                </Label>
                                <Input 
                                    placeholder="Ex: Agents immo, Experts comptables..." 
                                    value={formData.prescribers} 
                                    onChange={e => updateForm("prescribers", e.target.value)} 
                                />
                                <p className="text-[10px] text-slate-400">Qui voit vos clients juste avant vous ?</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-blue-800 font-bold">
                                    <Crown className="w-4 h-4" /> L'Infiltré (Réseaux visés)
                                </Label>
                                <Input 
                                    placeholder="Ex: Club Med, Rotary, Cercle des Entrepreneurs..." 
                                    value={formData.targetClubs} 
                                    onChange={e => updateForm("targetClubs", e.target.value)} 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-blue-800 font-bold">
                                    <Megaphone className="w-4 h-4" /> L'Amplificateur (Comm)
                                </Label>
                                <Input 
                                    placeholder="Ex: Gagner 500 abonnés, Vendre ma formation..." 
                                    value={formData.commGoal} 
                                    onChange={e => updateForm("commGoal", e.target.value)} 
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            {step > 1 ? (
                <Button variant="ghost" onClick={handleBack} disabled={isLoading}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                </Button>
            ) : (
                <div></div> // Spacer
            )}

            {step < 3 ? (
                <Button onClick={handleNext} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8">
                    Suivant <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            ) : (
                <Button onClick={handleSubmit} disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 shadow-lg shadow-blue-200">
                    {isLoading ? "Création..." : "Valider mon profil 🚀"}
                </Button>
            )}
        </div>

      </div>
    </div>
  );
}
