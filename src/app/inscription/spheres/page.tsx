"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, Globe, Heart, ShoppingBag, Scale, 
  Lock, CheckCircle2, ChevronRight, User, 
  Rocket, Zap, MapPin, Sparkles, ArrowRight, ShieldCheck, Users
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { registerNetworkUser } from "@/actions/network-registration";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
type SphereId = 'habitat' | 'digital' | 'sante' | 'commerce' | 'conseil';
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

interface Sphere {
  id: SphereId;
  name: string;
  icon: any;
  color: string;
  bg: string;
}

// --- DATA MOCKS ---
const SPHERES: Sphere[] = [
  { id: 'habitat', name: 'Habitat & Patrimoine', icon: Home, color: 'text-[#2E130C]', bg: 'bg-[#D2E8FF]' },
  { id: 'digital', name: 'Business & Digital', icon: Globe, color: 'text-[#E2D9BC]', bg: 'bg-[#2E130C]' },
  { id: 'sante', name: 'Santé & Bien-être', icon: Heart, color: 'text-[#E2D9BC]', bg: 'bg-[#B20B13]' },
  { id: 'commerce', name: 'Commerce & Local', icon: ShoppingBag, color: 'text-[#2E130C]', bg: 'bg-[#E2D9BC]' },
  { id: 'conseil', name: 'Conseil & Droit', icon: Scale, color: 'text-[#2E130C]', bg: 'bg-white' },
];

const MOCK_SLOTS: Record<SphereId, string[]> = {
  habitat: [
    'Agent Immobilier', 'Courtier en prêt', 'Gestionnaire de patrimoine', 'Diagnostiqueur', 
    'Architecte d\'intérieur', 'Maître d\'œuvre', 'Cuisiniste', 'Électricien/Domotique', 
    'Paysagiste', 'Pisciniste', 'Notaire', 'Déménageur', 'Conciergerie Airbnb', 
    'Photographe Immo', 'Chasseur Immo', 'Avocat Fiscaliste', 'Assureur Habitation', 
    'Menuisier', 'Expert Panneaux Solaires', 'Autre métier'
  ],
  digital: [
    'Webdesigner', 'Expert SEO', 'Copywriter', 'Community Manager', 'Vidéaste Corporate', 
    'Agence Ads', 'Expert Tunnel de Vente', 'Coach Business', 'Expert Comptable', 
    'Recruteur', 'Consultant RH', 'Développeur Web', 'Expert Cybersécurité', 
    'Graphiste', 'Imprimeur', 'Consultant CRM', 'Expert No-Code', 
    'Commercial Freelance', 'Growth Hacker', 'Autre métier'
  ],
  sante: [
    'Coach Sportif', 'Nutritionniste', 'Ostéopathe', 'Prof de Yoga', 'Naturopathe', 
    'Magasin Bio', 'Coiffeur', 'Esthéticienne', 'Sophrologue', 'Psychologue', 
    'Wedding Planner', 'Traiteur', 'Photographe Famille', 'Coach de Vie', 
    'Hypnothérapeute', 'Masseuse Bien-être', 'Kinésiologue', 'Acupuncteur', 
    'Personal Shopper', 'Autre métier'
  ],
  commerce: [
    'Restaurateur', 'Caviste', 'Gérant Salle de Sport', 'Fleuriste', 'Chocolatier', 
    'Gérant de Gîte', 'Bijoutier', 'Opticien', 'Libraire', 'Gérant Coworking', 
    'Prêt-à-porter', 'Loueur de Voitures', 'Assureur Pro', 'Événementiel Local', 
    'Agent de Voyage', 'Courtier Énergie', 'Enseigniste', 'Service Nettoyage', 
    'Torréfacteur', 'Autre métier'
  ],
  conseil: [
    'Avocat Affaires', 'Avocat Droit du Travail', 'Conseil Propriété Intellectuelle', 
    'Courtier Crédit Pro', 'Consultant RSE', 'Traducteur Business', 'Expert Levée de Fonds', 
    'Audit Cybersécurité', 'Commissaire aux comptes', 'Gestion de crise', 
    'Courtier Flotte Auto', 'Immo Entreprise', 'Formateur Qualiopi', 
    'Consultant Logistique', 'Graphologue', 'Huissier', 'Médiateur', 
    'Expert Transmission Entreprise', 'Consultant IA', 'Autre métier'
  ]
};

// --- COMPONENT ---
export default function SpheresRegistrationPage() {
  const [activeCity, setActiveCity] = useState<CityId | null>(null);
  const [activeSphere, setActiveSphere] = useState<SphereId>('habitat');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [memberCount, setMemberCount] = useState(14); // Simulation
  
  const [formData, setFormData] = useState({
    fullName: "",
    city: "",
    phone: "",
    email: "",
    password: "",
    trade: "",
    quickWin: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Simulation de slots déjà pris (Aucun slot pris pour le moment)
  const lockedSlotsByCity: Record<CityId, string[]> = {
      'bordeaux': [],
      'bab': [],
      'dax': []
  };

  const lockedSlots: string[] = [];

  const handleReserve = (slot: string) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
    setFormData(prev => ({
        ...prev,
        city: activeCity ? CITIES.find(c => c.id === activeCity)?.label || "" : "",
        trade: slot === "Autre métier" ? "" : slot // Pre-fill trade if not "Autre métier"
    }));
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    
    try {
        const payload = new FormData();
        payload.append("email", formData.email);
        payload.append("password", formData.password);
        payload.append("fullName", formData.fullName);
        payload.append("city", formData.city);
        // Use the form data trade which is editable
        payload.append("trade", formData.trade);
        payload.append("phone", formData.phone);
        payload.append("sphere", activeSphere);
        payload.append("quickWin", formData.quickWin);

        const result = await registerNetworkUser(payload);
        
        if (result.error) throw new Error(result.error);
        
        // Auto login
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password
        });
        
        if (loginError) throw loginError;

        setIsModalOpen(false);
        setIsConfirmed(true);
        setMemberCount(prev => prev + 1);
        toast.success("Votre siège est réservé ! 🚀");
        
        // Wait for session to be fully established before showing confirmation
        // This helps prevent WebSocket errors on the next page
        await new Promise(resolve => setTimeout(resolve, 500));
        
    } catch (error: any) {
        toast.error(error.message || "Erreur lors de l'inscription");
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
                        Choisissez votre zone d'influence pour voir les disponibilités.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {CITIES.map((city) => (
                        <button
                            key={city.id}
                            onClick={() => setActiveCity(city.id)}
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
                    * D'autres villes arrivent bientôt
                </p>
            </motion.div>
        </div>
      );
  }

  // STEP 2: SPHERES & SLOTS
  return (
    <div className={cn(
        "min-h-screen bg-[#E2D9BC] text-[#2E130C] p-4 md:p-12 font-poppins selection:bg-[#B20B13] selection:text-[#E2D9BC]",
        titanOne.variable, pacifico.variable, poppins.variable
    )}>
      
      {/* HEADER & CITY INFO */}
      <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <button 
                onClick={() => setActiveCity(null)}
                className="text-sm font-bold text-[#2E130C]/60 hover:text-[#B20B13] mb-4 flex items-center gap-2 transition-colors uppercase tracking-wider"
            >
                <ChevronRight className="w-4 h-4 rotate-180" /> Changer de ville
            </button>
            <h1 className="text-3xl md:text-5xl font-titan text-[#2E130C] mb-2 leading-tight">
                {CITIES.find(c => c.id === activeCity)?.label}
            </h1>
            <p className="text-[#2E130C]/80 font-bold text-lg">
                Vérifiez la disponibilité de votre métier.
            </p>
        </div>

        {/* STATUS BAR */}
        {!isConfirmed && (
            <div className="bg-white border-4 border-[#2E130C] rounded-2xl p-6 flex items-center gap-6 shadow-[6px_6px_0px_0px_#2E130C] transform rotate-1">
                <div className="flex flex-col">
                    <span className="text-xs font-black text-[#B20B13] uppercase tracking-widest mb-1">Status</span>
                    <p className="text-xl font-titan text-[#2E130C]">Inscription Ouverte</p>
                </div>
            </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto">
        
        <Tabs defaultValue="habitat" onValueChange={(v) => setActiveSphere(v as SphereId)} className="w-full">
          <TabsList className="flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible justify-start md:justify-center gap-3 bg-transparent h-auto mb-8 pb-4 w-full px-1 md:px-0 scrollbar-hide -mx-4 md:mx-0 snap-x">
            {SPHERES.map((sphere) => (
              <TabsTrigger 
                key={sphere.id} 
                value={sphere.id}
                className={cn(
                  "shrink-0 px-4 py-3 md:px-6 rounded-xl border-4 transition-all duration-200 snap-center font-titan text-sm md:text-base",
                  "bg-white border-[#2E130C]/20 text-[#2E130C]/60 hover:border-[#2E130C]/50",
                  "data-[state=active]:bg-[#2E130C] data-[state=active]:text-[#E2D9BC] data-[state=active]:border-[#2E130C] data-[state=active]:shadow-[4px_4px_0px_0px_#B20B13] data-[state=active]:-translate-y-1"
                )}
              >
                <sphere.icon className="w-4 h-4 mr-2" />
                {sphere.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {SPHERES.map((sphere) => (
            <TabsContent key={sphere.id} value={sphere.id} className="mt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {MOCK_SLOTS[sphere.id].map((job) => {
                  const isLocked = lockedSlots.includes(job);
                  return (
                    <motion.div
                      key={job}
                      whileHover={!isLocked ? { scale: 1.02, y: -4 } : {}}
                      className={cn(
                        "relative group p-4 md:p-6 rounded-3xl border-4 transition-all duration-200 flex flex-col items-center justify-center text-center gap-3 md:gap-4 h-48 md:h-56",
                        isLocked 
                          ? "bg-[#2E130C]/5 border-[#2E130C]/10 opacity-60 cursor-not-allowed" 
                          : "bg-white border-[#2E130C] cursor-pointer shadow-[6px_6px_0px_0px_#2E130C] hover:shadow-[8px_8px_0px_0px_#B20B13]"
                      )}
                      onClick={() => !isLocked && handleReserve(job)}
                    >
                      {isLocked ? (
                        <>
                          <div className="w-14 h-14 rounded-full bg-[#2E130C]/10 flex items-center justify-center relative grayscale">
                            <User className="w-7 h-7 text-[#2E130C]/40" />
                            <div className="absolute -bottom-1 -right-1 bg-[#B20B13] rounded-full p-1.5 border-2 border-white">
                              <Lock className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-[#2E130C]/50 line-through">{job}</p>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#B20B13] bg-[#B20B13]/10 px-2 py-1 rounded-md">Place prise</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={cn("w-16 h-16 rounded-2xl border-2 border-[#2E130C] flex items-center justify-center transition-colors shadow-sm", sphere.bg)}>
                            <sphere.icon className={cn("w-8 h-8", sphere.color)} />
                          </div>
                          <div className="space-y-2 w-full">
                            <p className="text-sm font-bold text-[#2E130C] group-hover:text-[#B20B13] transition-colors line-clamp-2">{job}</p>
                            <Button size="sm" className="w-full h-9 text-[10px] font-titan uppercase tracking-wide bg-[#2E130C] text-[#E2D9BC] hover:bg-[#B20B13] border-2 border-[#2E130C] rounded-lg shadow-sm">
                              Réserver
                            </Button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* MODAL: RESERVATION TUNNEL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#E2D9BC] border-4 border-[#2E130C] text-[#2E130C] sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden shadow-[12px_12px_0px_0px_#2E130C]">
          <div className="p-8 pb-0">
            <DialogHeader className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#B20B13] border-4 border-[#2E130C] flex items-center justify-center mx-auto mb-2 shadow-[4px_4px_0px_0px_#2E130C] transform rotate-3">
                    <Rocket className="w-8 h-8 text-[#E2D9BC] animate-pulse" />
                </div>
                <DialogTitle className="text-3xl font-titan text-center leading-none">
                    Verrouillage : <br />
                    <span className="text-[#B20B13] uppercase text-xl">{selectedSlot}</span>
                </DialogTitle>
                <DialogDescription className="text-center text-[#2E130C]/70 font-bold font-poppins">
                    Veuillez valider votre profil pour sécuriser votre exclusivité métier dans la sphère {SPHERES.find(s => s.id === activeSphere)?.name}.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-6 font-poppins">
                {/* Row 1: Prénom Nom & Ville */}
                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="fullname" className="text-xs font-black uppercase text-[#2E130C]/60 ml-1">Prénom Nom</Label>
                    <Input 
                    id="fullname" 
                    placeholder="Jean Dupont" 
                    className="bg-white border-2 border-[#2E130C] h-12 rounded-xl focus-visible:ring-0 focus-visible:border-[#B20B13] placeholder:text-[#2E130C]/30 font-bold" 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="city" className="text-xs font-black uppercase text-[#2E130C]/60 ml-1">Ville</Label>
                    <Input 
                    id="city" 
                    placeholder="Paris" 
                    className="bg-white border-2 border-[#2E130C] h-12 rounded-xl focus-visible:ring-0 focus-visible:border-[#B20B13] placeholder:text-[#2E130C]/30 font-bold" 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    />
                </div>
                </div>

                {/* Row 2: Activité & Téléphone */}
                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="activity" className="text-xs font-black uppercase text-[#2E130C]/60 ml-1">Activité</Label>
                    <Input 
                        id="activity" 
                        placeholder="Votre métier..." 
                        className="bg-white border-2 border-[#2E130C] h-12 rounded-xl focus-visible:ring-0 focus-visible:border-[#B20B13] placeholder:text-[#2E130C]/30 font-bold" 
                        value={formData.trade}
                        onChange={(e) => setFormData({...formData, trade: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-black uppercase text-[#2E130C]/60 ml-1">Téléphone</Label>
                    <Input 
                    id="phone" 
                    placeholder="06..." 
                    className="bg-white border-2 border-[#2E130C] h-12 rounded-xl focus-visible:ring-0 focus-visible:border-[#B20B13] placeholder:text-[#2E130C]/30 font-bold" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                </div>
                </div>
                
                {/* Row 3: Email */}
                <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase text-[#2E130C]/60 ml-1">Email</Label>
                <Input 
                    id="email" 
                    type="email" 
                    placeholder="vous@exemple.com" 
                    className="bg-white border-2 border-[#2E130C] h-12 rounded-xl focus-visible:ring-0 focus-visible:border-[#B20B13] placeholder:text-[#2E130C]/30 font-bold" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                </div>

                {/* Row 4: Mot de passe */}
                <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-black uppercase text-[#2E130C]/60 ml-1">Mot de passe</Label>
                <Input 
                    id="password" 
                    type="password" 
                    className="bg-white border-2 border-[#2E130C] h-12 rounded-xl focus-visible:ring-0 focus-visible:border-[#B20B13] font-bold" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                </div>

                {/* Row 5: Quick Win Question */}
                <div className="space-y-2 pt-4 border-t-2 border-[#2E130C]/10">
                <Label className="text-xs font-black uppercase tracking-widest text-[#B20B13] ml-1 flex items-center gap-2">
                    <Zap className="w-3 h-3 fill-current" /> Question Quick-Win
                </Label>
                <p className="text-[10px] text-[#2E130C]/70 font-bold ml-1 leading-tight mb-2">
                    Quel métier complémentaire vous manque-t-il aujourd'hui pour faire plus de business ?
                </p>
                <Input 
                    placeholder="Ex: Un notaire, un décorateur..." 
                    className="bg-white border-2 border-[#2E130C] h-12 rounded-xl focus-visible:ring-0 focus-visible:border-[#B20B13] placeholder:text-[#2E130C]/30 font-bold" 
                    value={formData.quickWin}
                    onChange={(e) => setFormData({...formData, quickWin: e.target.value})}
                />
                </div>
            </div>
          </div>

          <div className="p-8 pt-0">
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
                  "VALIDER MON EXCLUSIVITÉ"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                  BIENVENUE DANS L'ARÈNE !
                </h2>
                <p className="text-[#2E130C]/80 text-lg font-bold leading-relaxed max-w-lg mx-auto">
                  Félicitations, vous avez sécurisé le siège <span className="text-[#B20B13] font-black uppercase underline decoration-wavy decoration-[#2E130C]">{selectedSlot}</span> de la Sphère <span className="text-[#2E130C] font-black">{SPHERES.find(s => s.id === activeSphere)?.name}</span>. <br />
                  Vos concurrents bordelais ne peuvent plus entrer.
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
                  "{getGaugeMessage(memberCount)}"
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
                      const text = `Je viens de rejoindre le réseau local Popey sur la sphère ${SPHERES.find(s => s.id === activeSphere)?.name} ! Il reste quelques places, rejoins-nous : https://www.popey.academy/inscription/spheres`;
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
