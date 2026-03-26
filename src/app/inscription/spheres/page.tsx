"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, MapPin, Rocket, Users, Zap, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { registerNetworkUser } from "@/actions/network-registration";
import { useRouter } from "next/navigation";
import { Titan_One, Pacifico, Poppins } from "next/font/google";

// --- FONTS ---
const titanOne = Titan_One({ 
  weight: "400", 
  subsets: ["latin"],
  variable: "--font-titan",
});

const pacifico = Pacifico({ 
  weight: "400", 
  subsets: ["latin"],
  variable: "--font-pacifico",
});

const poppins = Poppins({
  weight: ["400", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

// --- TYPES ---
type CityId = 'bab' | 'dax' | 'bordeaux';

interface City {
    id: CityId;
    label: string;
}

const CITIES: City[] = [
    { id: 'bab', label: 'Bayonne-Anglet-Biarritz' },
    { id: 'dax', label: 'Le Grand Dax' },
    { id: 'bordeaux', label: 'Bordeaux' },
];

// --- COMPONENT ---
export default function SpheresRegistrationPage() {
  const [activeCity, setActiveCity] = useState<CityId | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [memberCount, setMemberCount] = useState(14); // Simulation
  
  const [formData, setFormData] = useState({
    fullName: "",
    city: "", // Zone (ex: Le Grand Dax)
    exactCity: "", // Ville exacte (ex: Tartas)
    meetingPlace: "",
    phone: "",
    email: "",
    password: "",
    trade: "",
    secondaryTrades: "",
    quickWin: "",
    whatsappResponseDelayHours: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleCitySelect = (cityId: CityId) => {
    const cityLabel = CITIES.find(c => c.id === cityId)?.label || "";
    setActiveCity(cityId);
    setFormData(prev => ({ ...prev, city: cityLabel }));
  };

  const handleConfirm = async () => {
    if (!formData.fullName.trim()) {
        toast.error("Veuillez renseigner votre prénom et nom.");
        return;
    }

    if (!formData.email.trim()) {
        toast.error("Veuillez renseigner votre email.");
        return;
    }

    if (!formData.password.trim() || formData.password.trim().length < 6) {
        toast.error("Veuillez saisir un mot de passe d'au moins 6 caractères.");
        return;
    }

    if (!formData.phone.trim()) {
        toast.error("Veuillez renseigner votre téléphone.");
        return;
    }

    if (!formData.trade.trim()) {
        toast.error("Veuillez renseigner votre activité.");
        return;
    }
    
    if (!formData.exactCity.trim()) {
        toast.error("Veuillez renseigner votre ville exacte.");
        return;
    }

    if (!formData.meetingPlace.trim()) {
        toast.error("Veuillez renseigner votre lieu de rencontre.");
        return;
    }

    if (!["1", "3", "6", "12"].includes(formData.whatsappResponseDelayHours)) {
        toast.error("Veuillez estimer votre temps moyen de réponse WhatsApp.");
        return;
    }

    setIsLoading(true);
    
    try {
        const finalTrade = formData.secondaryTrades.trim() 
            ? `${formData.trade.trim()} & ${formData.secondaryTrades.trim()}`
            : formData.trade.trim();

        const payload = new FormData();
        payload.append("email", formData.email);
        payload.append("password", formData.password);
        payload.append("fullName", formData.fullName);
        payload.append("city", formData.city);
        payload.append("exactCity", formData.exactCity);
        payload.append("meetingPlace", formData.meetingPlace);
        payload.append("trade", finalTrade);
        payload.append("phone", formData.phone);
        // We no longer have a sphere to append from the UI, but the backend might expect it.
        // We'll set a default or let the backend handle matching based purely on trade.
        payload.append("sphere", "Indéfinie"); 
        payload.append("quickWin", formData.quickWin);
        payload.append("whatsappResponseDelayHours", formData.whatsappResponseDelayHours);

        const result = await registerNetworkUser(payload);
        
        if (result.error) {
            console.error("Server returned error:", result.error);
            // Translate common Supabase Auth errors to French for better UX
            if (result.error.includes("already registered") || result.error.includes("User already exists")) {
                throw new Error("Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email.");
            } else if (result.error.includes("Password should be at least")) {
                throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
            } else {
                throw new Error(result.error);
            }
        }
        
        // Auto login
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password
        });
        
        if (loginError) {
             console.error("Auto-login failed:", loginError);
             // We don't throw here because the account WAS created. We just notify them to log in.
             toast.success("Compte créé ! Veuillez vous connecter.");
             router.push("/mon-reseau-local/connexion");
             return;
        }

        // Force a session refresh to ensure cookies are set before redirect
        await supabase.auth.refreshSession();

        setIsConfirmed(true);
        setMemberCount(prev => prev + 1);
        toast.success("Votre inscription est confirmée ! 🚀");
        
        // Wait for session to be fully established before showing confirmation
        // This helps prevent WebSocket errors on the next page
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Important: Redirect to dashboard directly if confirmed to avoid them getting stuck on the confirmation screen
        router.push("/mon-reseau-local/dashboard");
        
    } catch (error: unknown) {
        console.error("Registration caught error:", error);
        toast.error(error instanceof Error ? error.message : "Erreur lors de l'inscription");
    } finally {
        setIsLoading(false);
    }
  };

  const getGaugeMessage = (count: number) => {
    if (count <= 5) return "🏗️ Fondation en cours : Les premiers piliers de la sphère s'installent.";
    if (count <= 12) return "📈 Dynamique lancée : Le réseau commence à se structurer.";
    if (count <= 17) return "🔥 Force de frappe : La rentabilité approche, les premières synergies sont prêtes.";
    if (count <= 19) return "🚨 Lancement imminent : Plus que " + (20 - count) + " places avant le premier match.";
    return "🚀 Sphère Opérationnelle : Matches quotidiens activés.";
  };

  // STEP 1: CITY SELECTION
  if (!activeCity) {
      return (
        <div className={cn(
            "min-h-screen bg-[#E2D9BC] text-[#2E130C] p-6 flex flex-col items-center justify-center overflow-hidden relative",
            titanOne.variable, pacifico.variable, poppins.variable, "font-poppins"
        )}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2E130C 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl w-full text-center space-y-12 relative z-10"
            >
                <div className="space-y-4">
                    <Badge className="bg-[#B20B13] text-[#E2D9BC] border-2 border-[#2E130C] text-sm uppercase tracking-widest px-3 py-1 font-titan shadow-[3px_3px_0px_0px_#2E130C]">
                        Étape 1/3
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-titan text-[#2E130C] leading-tight">
                        Où exercez-vous ?
                    </h1>
                    <p className="text-[#2E130C]/70 text-xl font-bold font-poppins max-w-xl mx-auto">
                        Choisissez votre zone d&apos;influence pour voir les disponibilités.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {CITIES.map((city) => (
                        <button
                            key={city.id}
                            onClick={() => handleCitySelect(city.id)}
                            className="group relative h-56 rounded-[2rem] border-4 border-[#2E130C] bg-white hover:bg-[#D2E8FF] hover:-translate-y-2 transition-all duration-300 flex flex-col items-center justify-center gap-6 shadow-[8px_8px_0px_0px_#2E130C] hover:shadow-[12px_12px_0px_0px_#B20B13]"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-[#E2D9BC] border-2 border-[#2E130C] flex items-center justify-center group-hover:bg-white transition-colors">
                                <MapPin className="w-10 h-10 text-[#2E130C]" />
                            </div>
                            <span className="text-xl font-titan text-[#2E130C] px-4 leading-tight">
                                {city.label}
                            </span>
                        </button>
                    ))}
                </div>
                
                <p className="text-sm font-bold text-[#2E130C]/40 uppercase tracking-widest mt-8">
                    * D&apos;autres villes arrivent bientôt
                </p>
            </motion.div>
        </div>
      );
  }

  // STEP 2: REGISTRATION FORM
  return (
    <div className={cn(
        "min-h-screen bg-[#E2D9BC] text-[#2E130C] p-4 md:p-12 font-poppins selection:bg-[#B20B13] selection:text-[#E2D9BC]",
        titanOne.variable, pacifico.variable, poppins.variable
    )}>
      
      {/* HEADER & CITY INFO */}
      <header className="max-w-3xl mx-auto mb-8 flex flex-col gap-4">
        <button 
            onClick={() => setActiveCity(null)}
            className="text-sm font-bold text-[#2E130C]/60 hover:text-[#B20B13] flex items-center gap-2 transition-colors uppercase tracking-wider w-fit"
        >
            <ChevronRight className="w-4 h-4 rotate-180" /> Changer de ville
        </button>
        <div>
            <h1 className="text-3xl md:text-5xl font-titan text-[#2E130C] mb-2 leading-tight">
                {CITIES.find(c => c.id === activeCity)?.label}
            </h1>
            <p className="text-[#2E130C]/80 font-bold text-lg">
                Complétez votre profil pour rejoindre le réseau local.
            </p>
        </div>
      </header>

      {/* MAIN CONTENT: REGISTRATION FORM */}
      <main className="max-w-3xl mx-auto">
        <div className="bg-white border-4 border-[#2E130C] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-[8px_8px_0px_0px_#2E130C] md:shadow-[12px_12px_0px_0px_#2E130C]">
            <div className="flex items-center justify-center mx-auto mb-6 w-16 h-16 rounded-2xl bg-[#B20B13] border-4 border-[#2E130C] shadow-[4px_4px_0px_0px_#2E130C] transform rotate-3">
                <Rocket className="w-8 h-8 text-[#E2D9BC] animate-pulse" />
            </div>
            
            <h2 className="text-2xl md:text-3xl font-titan text-center mb-8 leading-none">
                Création de votre compte
            </h2>

            <div className="space-y-6 font-poppins">
                <div className="rounded-xl border border-[#B20B13]/20 bg-[#FFF5F5] p-3 text-xs font-bold text-[#B20B13]">
                    Les champs marqués * sont obligatoires pour finaliser l&apos;inscription.
                </div>
                {/* Row 1: Prénom Nom & Ville */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="fullname" className="text-xs font-black uppercase text-[#2E130C]/60 ml-1">Prénom Nom *</Label>
                    <Input 
                    id="fullname" 
                    placeholder="Jean Dupont" 
                    className="bg-white border-2 border-[#2E130C] h-12 rounded-xl focus-visible:ring-0 focus-visible:border-[#B20B13] placeholder:text-[#2E130C]/30 font-bold text-base" 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="city" className="text-xs font-black uppercase text-[#2E130C]/60 ml-1">Zone (Réseau)</Label>
                    <Input 
                    id="city" 
                    placeholder="Paris" 
                    className="bg-white border-2 border-[#2E130C] h-12 rounded-xl focus-visible:ring-0 focus-visible:border-[#B20B13] placeholder:text-[#2E130C]/30 font-bold text-base bg-gray-50 text-slate-500" 
                    value={formData.city}
                    readOnly
                    />
                </div>
                </div>

                {/* Row 1.5: Ville exacte */}
                <div className="space-y-2">
                    <Label htmlFor="exactCity" className="text-xs font-black uppercase text-[#2E130C]/60 ml-1">Votre Ville Exacte *</Label>
                    <Input 
                        id="exactCity" 
                        placeholder="Ex: Mont-de-Marsan, Tartas..." 
                        className="bg-white border-2 border-[#2E130C] h-12 rounded-xl focus-visible:ring-0 focus-visible:border-[#B20B13] placeholder:text-[#2E130C]/30 font-bold text-base" 
                        value={formData.exactCity}
                        onChange={(e) => setFormData({...formData, exactCity: e.target.value})}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="meetingPlace" className="text-xs font-black uppercase text-[#2E130C]/60 ml-1">Lieu de rencontre habituel *</Label>
                    <Input
                        id="meetingPlace"
                        placeholder="Ex: Centre-ville, coworking, café, secteur..."
                        className="bg-white border-2 border-[#2E130C] h-12 rounded-xl focus-visible:ring-0 focus-visible:border-[#B20B13] placeholder:text-[#2E130C]/30 font-bold text-base"
                        value={formData.meetingPlace}
                        onChange={(e) => setFormData({ ...formData, meetingPlace: e.target.value })}
                    />
                </div>

                {/* Row 2: Activité & Téléphone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="activity" className="text-xs font-black uppercase text-[#2E130C]/60 ml-1">Activité Principale *</Label>
                    <Input 
                        id="activity" 
                        placeholder="Ex: Nutritionniste, Copywriter..." 
                        className="bg-white border-2 border-[#2E130C] h-12 rounded-xl focus-visible:ring-0 focus-visible:border-[#B20B13] placeholder:text-[#2E130C]/30 font-bold text-base" 
                        value={formData.trade}
                        onChange={(e) => setFormData({...formData, trade: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="secondaryTrades" className="text-xs font-black uppercase text-[#2E130C]/60 ml-1">Autres Activités (Optionnel)</Label>
                    <Input 
                        id="secondaryTrades" 
                        placeholder="Ex: Investisseur immo, Coach..." 
                        className="bg-white border-2 border-[#2E130C] h-12 rounded-xl focus-visible:ring-0 focus-visible:border-[#B20B13] placeholder:text-[#2E130C]/30 font-bold text-base" 
                        value={formData.secondaryTrades}
                        onChange={(e) => setFormData({...formData, secondaryTrades: e.target.value})}
                    />
                </div>
                </div>
                
                {/* Row 3: Phone & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-black uppercase text-[#2E130C]/60 ml-1">Téléphone *</Label>
                    <Input 
                    id="phone" 
                    placeholder="06..." 
                    className="bg-white border-2 border-[#2E130C] h-12 rounded-xl focus-visible:ring-0 focus-visible:border-[#B20B13] placeholder:text-[#2E130C]/30 font-bold text-base" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase text-[#2E130C]/60 ml-1">Email *</Label>
                <Input 
                    id="email" 
                    type="email" 
                    placeholder="vous@exemple.com" 
                    className="bg-white border-2 border-[#2E130C] h-12 rounded-xl focus-visible:ring-0 focus-visible:border-[#B20B13] placeholder:text-[#2E130C]/30 font-bold text-base" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="whatsappDelay" className="text-xs font-black uppercase text-[#2E130C]/60 ml-1">
                        Estimez votre temps moyen de réponse WhatsApp *
                    </Label>
                    <select
                        id="whatsappDelay"
                        className="w-full bg-white border-2 border-[#2E130C] h-12 rounded-xl px-3 font-bold text-base focus:outline-none focus:border-[#B20B13]"
                        value={formData.whatsappResponseDelayHours}
                        onChange={(e) => setFormData({ ...formData, whatsappResponseDelayHours: e.target.value })}
                        required
                    >
                        <option value="">Choisir un délai</option>
                        <option value="1">1h</option>
                        <option value="3">3h</option>
                        <option value="6">6h</option>
                        <option value="12">12h</option>
                    </select>
                </div>

                {/* Row 4: Mot de passe */}
                <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-black uppercase text-[#2E130C]/60 ml-1">Mot de passe *</Label>
                <Input 
                    id="password" 
                    type="password" 
                    className="bg-white border-2 border-[#2E130C] h-12 rounded-xl focus-visible:ring-0 focus-visible:border-[#B20B13] font-bold text-base" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                </div>

                {/* Row 5: Quick Win Question */}
                <div className="space-y-3 pt-6 border-t-2 border-[#2E130C]/10">
                <div className="bg-[#D2E8FF] border-2 border-[#2E130C] rounded-xl p-4 shadow-[4px_4px_0px_0px_#2E130C]">
                    <Label className="text-sm font-black uppercase tracking-widest text-[#B20B13] flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 fill-current" /> Bonus : Votre Besoin Urgent
                    </Label>
                    <p className="text-xs text-[#2E130C]/80 font-bold leading-tight mb-3">
                        Quel métier complémentaire vous manque-t-il aujourd&apos;hui pour faire plus de business ? (Facultatif, mais aide l&apos;algo à vous trouver les meilleurs matchs).
                    </p>
                    <Input 
                        placeholder="Ex: Un notaire, un décorateur, un expert-comptable..." 
                        className="bg-white border-2 border-[#2E130C] h-12 rounded-lg focus-visible:ring-0 focus-visible:border-[#B20B13] placeholder:text-[#2E130C]/30 font-bold text-sm" 
                        value={formData.quickWin}
                        onChange={(e) => setFormData({...formData, quickWin: e.target.value})}
                    />
                </div>
                </div>
            </div>

            <div className="pt-8">
              <Button 
                onClick={handleConfirm}
                disabled={isLoading}
                className="w-full h-16 bg-[#2E130C] text-[#E2D9BC] hover:bg-[#B20B13] text-lg font-titan rounded-xl border-4 border-[#2E130C] shadow-[4px_4px_0px_0px_#2E130C] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2E130C] transition-all"
              >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        CRÉATION EN COURS...
                    </>
                ) : (
                    "VALIDER MON INSCRIPTION"
                )}
              </Button>
            </div>
        </div>
      </main>

      {/* CONFIRMATION OVERLAY */}
      <AnimatePresence>
        {isConfirmed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-[#E2D9BC] flex flex-col items-center justify-center p-6 text-center font-poppins"
          >
             {/* Background Pattern */}
             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2E130C 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl space-y-8 relative z-10"
            >
              <div className="w-24 h-24 rounded-[2rem] bg-[#D2E8FF] border-4 border-[#2E130C] flex items-center justify-center mx-auto shadow-[8px_8px_0px_0px_#2E130C] transform -rotate-3">
                <CheckCircle2 className="w-12 h-12 text-[#2E130C]" />
              </div>
              
              <div className="space-y-4">
                <h2 className="text-5xl font-titan text-[#2E130C] leading-tight">
                  BIENVENUE DANS L&apos;ARÈNE !
                </h2>
                <p className="text-[#2E130C]/80 text-lg font-bold leading-relaxed max-w-lg mx-auto">
                  Félicitations, vous avez sécurisé votre place dans le réseau de <span className="text-[#2E130C] font-black">{formData.city}</span>. <br />
                  Vos concurrents directs ne peuvent plus entrer.
                </p>
              </div>

              {/* GAUGE */}
              <div className="bg-white border-4 border-[#2E130C] rounded-3xl p-8 space-y-6 shadow-[8px_8px_0px_0px_#2E130C]">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-black text-[#B20B13] uppercase tracking-widest">DYNAMISME DE LA SPHÈRE</span>
                  <span className="text-2xl font-titan text-[#2E130C]">{memberCount} / 20</span>
                </div>
                <div className="relative h-6 bg-[#2E130C]/10 rounded-full overflow-hidden border-2 border-[#2E130C]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(memberCount / 20) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="absolute inset-0 bg-[#B20B13]"
                  />
                  {/* Stripes */}
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '20px 20px' }}></div>
                </div>
                <p className="text-sm font-bold text-[#2E130C] italic">
                  &quot;{getGaugeMessage(memberCount)}&quot;
                </p>
                <p className="text-xs text-[#2E130C]/50 font-bold uppercase tracking-wide">
                  Encore {20 - memberCount} partenaires à valider pour débloquer vos matchs quotidiens.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <Button 
                  onClick={() => router.push("/mon-reseau-local/dashboard")}
                  className="h-16 flex-1 bg-[#2E130C] text-[#E2D9BC] hover:bg-[#B20B13] font-titan rounded-2xl text-lg gap-3 border-4 border-[#2E130C] shadow-[4px_4px_0px_0px_#2E130C] hover:translate-y-[2px]"
                >
                  ACCÉDER À MON DASHBOARD
                </Button>
                <Button 
                  onClick={() => {
                      const text = `Je viens de rejoindre le réseau local Popey sur ${formData.city} ! Il reste quelques places, rejoins-nous : https://www.popey.academy/inscription/spheres`;
                      if (navigator.share) {
                          navigator.share({
                              title: 'Rejoins mon réseau local Popey',
                              text: text,
                              url: 'https://www.popey.academy/inscription/spheres'
                          }).catch(console.error);
                      } else {
                          navigator.clipboard.writeText(text);
                          toast.success("Lien d'invitation copié !");
                      }
                  }}
                  variant="outline" 
                  className="h-16 flex-1 bg-white text-[#2E130C] border-4 border-[#2E130C] hover:bg-[#D2E8FF] font-titan rounded-2xl text-lg gap-3 shadow-[4px_4px_0px_0px_#2E130C] hover:translate-y-[2px]"
                >
                  <Users className="w-5 h-5" /> INVITER MON RÉSEAU
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
