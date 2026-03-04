"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, Globe, Heart, ShoppingBag, Scale, 
  Lock, CheckCircle2, ChevronRight, User, 
  Linkedin, Mail, Users, Rocket, Zap, Target, MapPin
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { registerNetworkUser } from "@/actions/network-registration";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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

interface Slot {
  id: string;
  sphere_id: SphereId;
  job_name: string;
  status: SlotStatus;
  member_name?: string;
  member_avatar?: string;
}

// --- DATA MOCKS ---
const SPHERES: Sphere[] = [
  { id: 'habitat', name: 'Habitat & Patrimoine', icon: Home, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'digital', name: 'Business & Digital', icon: Globe, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { id: 'sante', name: 'Santé & Bien-être', icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { id: 'commerce', name: 'Commerce & Local', icon: ShoppingBag, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'conseil', name: 'Conseil & Droit', icon: Scale, color: 'text-slate-400', bg: 'bg-slate-500/10' },
];

const MOCK_SLOTS: Record<SphereId, string[]> = {
  habitat: [
    'Agent Immobilier', 'Courtier en prêt', 'Gestionnaire de patrimoine', 'Diagnostiqueur', 
    'Architecte d\'intérieur', 'Maître d\'œuvre', 'Cuisiniste', 'Électricien/Domotique', 
    'Paysagiste', 'Pisciniste', 'Notaire', 'Déménageur', 'Conciergerie Airbnb', 
    'Photographe Immo', 'Chasseur Immo', 'Avocat Fiscaliste', 'Assureur Habitation', 
    'Menuisier', 'Expert Panneaux Solaires', 'Home Stager'
  ],
  digital: [
    'Webdesigner', 'Expert SEO', 'Copywriter', 'Community Manager', 'Vidéaste Corporate', 
    'Agence Ads', 'Expert Tunnel de Vente', 'Coach Business', 'Expert Comptable', 
    'Recruteur', 'Consultant RH', 'Développeur Web', 'Expert Cybersécurité', 
    'Graphiste', 'Imprimeur', 'Consultant CRM', 'Expert No-Code', 
    'Commercial Freelance', 'Growth Hacker', 'Community Builder'
  ],
  sante: [
    'Coach Sportif', 'Nutritionniste', 'Ostéopathe', 'Prof de Yoga', 'Naturopathe', 
    'Magasin Bio', 'Coiffeur', 'Esthéticienne', 'Sophrologue', 'Psychologue', 
    'Wedding Planner', 'Traiteur', 'Photographe Famille', 'Coach de Vie', 
    'Hypnothérapeute', 'Masseuse Bien-être', 'Kinésiologue', 'Acupuncteur', 
    'Personal Shopper', 'Éducateur Canin'
  ],
  commerce: [
    'Restaurateur', 'Caviste', 'Gérant Salle de Sport', 'Fleuriste', 'Chocolatier', 
    'Gérant de Gîte', 'Bijoutier', 'Opticien', 'Libraire', 'Gérant Coworking', 
    'Prêt-à-porter', 'Loueur de Voitures', 'Assureur Pro', 'Événementiel Local', 
    'Agent de Voyage', 'Courtier Énergie', 'Enseigniste', 'Service Nettoyage', 
    'Torréfacteur', 'Coach Prise de Parole'
  ],
  conseil: [
    'Avocat Affaires', 'Avocat Droit du Travail', 'Conseil Propriété Intellectuelle', 
    'Courtier Crédit Pro', 'Consultant RSE', 'Traducteur Business', 'Expert Levée de Fonds', 
    'Audit Cybersécurité', 'Commissaire aux comptes', 'Gestion de crise', 
    'Courtier Flotte Auto', 'Immo Entreprise', 'Formateur Qualiopi', 
    'Consultant Logistique', 'Graphologue', 'Huissier', 'Médiateur', 
    'Expert Transmission Entreprise', 'Consultant IA', 'Agent d\'Artistes/Sportifs'
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
    quickWin: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Simulation de slots déjà pris (différents par ville pour le réalisme)
  const lockedSlotsByCity: Record<CityId, string[]> = {
      'bordeaux': ['Agent Immobilier', 'Courtier en prêt', 'Webdesigner', 'Coach Sportif'],
      'bab': ['Notaire', 'Paysagiste', 'Avocat Affaires'],
      'dax': ['Restaurateur', 'Plombier', 'Coiffeur']
  };

  const lockedSlots = activeCity ? (lockedSlotsByCity[activeCity] || []) : [];

  const handleReserve = (slot: string) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
    setFormData(prev => ({
        ...prev,
        city: activeCity ? CITIES.find(c => c.id === activeCity)?.label || "" : ""
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
        payload.append("trade", selectedSlot || "");
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
        <div className="min-h-screen bg-[#020617] text-white p-6 flex flex-col items-center justify-center font-sans">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full text-center space-y-12"
            >
                <div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 bg-gradient-to-r from-white via-white to-slate-500 bg-clip-text text-transparent">
                        OÙ EXERCEZ-VOUS ?
                    </h1>
                    <p className="text-slate-400 text-lg font-medium">
                        Choisissez votre zone d'influence pour voir les disponibilités.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {CITIES.map((city) => (
                        <button
                            key={city.id}
                            onClick={() => setActiveCity(city.id)}
                            className="group relative h-48 rounded-3xl border border-white/10 bg-slate-900/50 hover:bg-white/5 hover:border-indigo-500/50 hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-4 shadow-2xl"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                                <MapPin className="w-8 h-8 text-indigo-400" />
                            </div>
                            <span className="text-xl font-black uppercase tracking-tight text-white group-hover:text-indigo-300 transition-colors px-4">
                                {city.label}
                            </span>
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
      );
  }

  // STEP 2: SPHERES & SLOTS
  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      
      {/* HEADER & CITY INFO */}
      <header className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <button 
                onClick={() => setActiveCity(null)}
                className="text-xs font-bold text-slate-500 hover:text-white mb-4 flex items-center gap-1 transition-colors"
            >
                <ChevronRight className="w-3 h-3 rotate-180" /> CHANGER DE VILLE
            </button>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-white via-white to-slate-500 bg-clip-text text-transparent">
            {CITIES.find(c => c.id === activeCity)?.label.toUpperCase()}
            </h1>
            <p className="text-slate-400 font-medium">
            Vérifiez la disponibilité de votre métier.
            </p>
        </div>

        {/* STATUS BAR (MOVED TO TOP) */}
        {!isConfirmed && (
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-6 shadow-xl">
                <div className="flex flex-col">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Places disponibles</span>
                <p className="text-2xl font-black">76 / 100</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-right">
                <p className="text-xs font-medium text-slate-400">Prenez votre siège avant <br />qu'un concurrent ne le fasse.</p>
                </div>
            </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto">
        
        <Tabs defaultValue="habitat" onValueChange={(v) => setActiveSphere(v as SphereId)} className="w-full">
          <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent h-auto mb-12">
            {SPHERES.map((sphere) => (
              <TabsTrigger 
                key={sphere.id} 
                value={sphere.id}
                className={cn(
                  "px-6 py-3 rounded-xl border-2 transition-all duration-300 data-[state=active]:shadow-[0_0_20px_rgba(99,102,241,0.2)]",
                  "bg-slate-900/50 border-white/5 text-slate-400",
                  "data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:border-white"
                )}
              >
                <sphere.icon className="w-4 h-4 mr-2" />
                {sphere.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {SPHERES.map((sphere) => (
            <TabsContent key={sphere.id} value={sphere.id} className="mt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {MOCK_SLOTS[sphere.id].map((job) => {
                  const isLocked = lockedSlots.includes(job);
                  return (
                    <motion.div
                      key={job}
                      whileHover={!isLocked ? { scale: 1.02, y: -5 } : {}}
                      className={cn(
                        "relative group p-6 rounded-2xl border transition-all duration-500 flex flex-col items-center justify-center text-center gap-4 h-48",
                        isLocked 
                          ? "bg-slate-900/20 border-white/5 opacity-50 cursor-not-allowed" 
                          : "bg-slate-900/40 border-white/10 hover:border-white/40 cursor-pointer shadow-xl hover:shadow-indigo-500/10"
                      )}
                      onClick={() => !isLocked && handleReserve(job)}
                    >
                      {isLocked ? (
                        <>
                          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center relative">
                            <User className="w-6 h-6 text-slate-600" />
                            <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1 border-2 border-slate-900">
                              <Lock className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-300">{job}</p>
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Place prise</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", sphere.bg)}>
                            <sphere.icon className={cn("w-6 h-6", sphere.color)} />
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{job}</p>
                            <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-tighter border-indigo-500/50 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg">
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
        <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-md rounded-[2.5rem] p-8 shadow-2xl">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-2">
              <Rocket className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            <DialogTitle className="text-3xl font-black text-center tracking-tighter">
              VERROUILLAGE : <br />
              <span className="text-indigo-400 uppercase">{selectedSlot}</span>
            </DialogTitle>
            <DialogDescription className="text-center text-slate-400 font-medium">
              Veuillez valider votre profil pour sécuriser votre exclusivité métier dans la sphère {SPHERES.find(s => s.id === activeSphere)?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Row 1: Prénom Nom & Ville */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullname" className="text-xs font-bold text-slate-500 ml-1">Prénom Nom</Label>
                <Input 
                  id="fullname" 
                  placeholder="Jean Dupont" 
                  className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-indigo-500" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-xs font-bold text-slate-500 ml-1">Ville</Label>
                <Input 
                  id="city" 
                  placeholder="Paris" 
                  className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-indigo-500" 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
            </div>

            {/* Row 2: Activité & Téléphone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="activity" className="text-xs font-bold text-slate-500 ml-1">Activité</Label>
                <Input 
                    id="activity" 
                    defaultValue={selectedSlot || ""} 
                    className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-indigo-500 font-bold text-white" 
                    readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold text-slate-500 ml-1">Téléphone</Label>
                <Input 
                  id="phone" 
                  placeholder="06..." 
                  className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-indigo-500" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            
            {/* Row 3: Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold text-slate-500 ml-1">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="vous@exemple.com" 
                className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-indigo-500" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            {/* Row 4: Mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold text-slate-500 ml-1">Mot de passe</Label>
              <Input 
                id="password" 
                type="password" 
                className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-indigo-500" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            {/* Row 5: Quick Win Question */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <Label className="text-xs font-bold uppercase tracking-widest text-indigo-400 ml-1 flex items-center gap-2">
                <Zap className="w-3 h-3 fill-current" /> Question Quick-Win
              </Label>
              <p className="text-[10px] text-slate-500 font-medium ml-1 leading-tight mb-2">
                Quel métier complémentaire vous manque-t-il aujourd'hui pour faire plus de business ?
              </p>
              <Input 
                placeholder="Ex: Un notaire, un décorateur..." 
                className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-indigo-500" 
                value={formData.quickWin}
                onChange={(e) => setFormData({...formData, quickWin: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={handleConfirm}
              disabled={isLoading}
              className="w-full h-16 bg-white text-black hover:bg-slate-200 text-lg font-black rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all active:scale-95"
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION OVERLAY */}
      <AnimatePresence>
        {isConfirmed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-[#020617] flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl space-y-8"
            >
              <div className="w-24 h-24 rounded-[2rem] bg-emerald-500/20 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.2)] border-2 border-emerald-500/50">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              
              <div className="space-y-4">
                <h2 className="text-5xl font-black tracking-tighter italic">
                  BIENVENUE DANS L'ARÈNE !
                </h2>
                <p className="text-slate-400 text-lg font-medium leading-relaxed">
                  Félicitations, vous avez sécurisé le siège <span className="text-white font-black uppercase underline decoration-indigo-500">{selectedSlot}</span> de la Sphère <span className="text-white font-black">{SPHERES.find(s => s.id === activeSphere)?.name}</span>. <br />
                  Vos concurrents bordelais ne peuvent plus entrer.
                </p>
              </div>

              {/* GAUGE */}
              <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 space-y-6">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-black text-indigo-400 uppercase tracking-widest">DYNAMISME DE LA SPHÈRE</span>
                  <span className="text-2xl font-black">{memberCount} / 20</span>
                </div>
                <div className="relative h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(memberCount / 20) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"
                  />
                </div>
                <p className="text-sm font-bold text-white italic">
                  "{getGaugeMessage(memberCount)}"
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  Encore {20 - memberCount} partenaires à valider pour débloquer vos matchs quotidiens.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <Button 
                  onClick={() => router.push("/mon-reseau-local/dashboard")}
                  className="h-16 flex-1 bg-white text-black hover:bg-slate-200 font-black rounded-2xl text-lg gap-3"
                >
                  ACCÉDER À MON DASHBOARD
                </Button>
                <Button variant="outline" className="h-16 flex-1 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 font-black rounded-2xl text-lg gap-3">
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
