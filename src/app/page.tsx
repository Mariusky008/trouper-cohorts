"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, AnimatePresence, useInView } from "framer-motion";
import Link from "next/link";
import { 
  Users, Calendar, Phone, CheckCircle2, 
  ArrowRight, ShieldCheck, Zap, Briefcase, 
  Target, TrendingUp, Star, Heart, MapPin, Handshake, Sparkles, Anchor, MessageCircle, Trophy, Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { AuthDialog } from "@/components/auth-dialog";
import { MysteryCardPreview, MatchCardPreview, MatchCardWhatsAppPreview, FounderCardPreview } from "@/components/dashboard/design-system-preview";
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

const COMMANDO_APPLICATION_URL = "/programme-commando/postuler";

const CASE_STUDIES = [
  {
    name: "Sérénité Patrimoine",
    sector: "Immo + Domotique",
    profiles: [
      "Profil A : Installateur Domotique / Alarmes (Dax)",
      "Profil B : Agent Immobilier en gestion locative",
    ],
    weekly: [
      "S1 — Offre Duo : Pack Propriétaire Absent (gestion + sécurité connectée)",
      "S2 — Visibilité : vidéo expertise croisée sur la valeur du bien",
      "S3 — Confiance : intro directe des top clients propriétaires",
      "S4 — Résultat : 6 000€ domotique + 3 000€/an récurrent côté immo",
    ],
    investment: "149€",
    revenue: "6 000€",
    time: "5 min/jour + 1 RDV hebdomadaire",
    summary: "Le client final achète la paix d'esprit : bien géré et protégé par une seule équipe locale.",
  },
  {
    name: "Bio-Hacking Énergie",
    sector: "Sport + Nutrition",
    profiles: [
      "Profil A : Coach Sportif entrepreneurs",
      "Profil B : Restaurateur Healthy / Meal Prep",
    ],
    weekly: [
      "S1 — Offre Duo : Programme 21 jours Reset Métabolique",
      "S2 — Visibilité : live “cuisine + sport” orienté productivité",
      "S3 — Confiance : invitations croisées dans chaque commande / séance",
      "S4 — Résultat : 4 500€ coach + 5 400€/mois récurrent restaurateur",
    ],
    investment: "149€",
    revenue: "9 900€",
    time: "5 min/jour + 1 RDV hebdomadaire",
    summary: "Le duo vend une transformation d'énergie business, pas juste des séances ou des repas.",
  },
];

// --- COLORS (Tailwind Arbitrary Values Mapping) ---
// Beige: bg-[#E2D9BC]
// Brown: text-[#2E130C]
// Cherry: text-[#7A0000] / bg-[#7A0000]
// Pastel Blue: bg-[#D2E8FF]
// Red: text-[#B20B13] / bg-[#B20B13]

// --- ANIMATED COMPONENTS ---

const AnimatedCounter = ({ value, label, suffix = "" }: { value: number, label: string, suffix?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const stepTime = duration / steps;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, stepTime);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-titan text-[#2E130C] mb-1 drop-shadow-sm">
        {count}{suffix}
      </div>
      <div className="text-xs font-bold text-[#7A0000] uppercase tracking-widest font-poppins">{label}</div>
    </div>
  );
};

const StickyCTA = () => {
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      return scrollY.on("change", (latest) => {
        setIsVisible(latest > 600);
      });
    }
  }, [scrollY]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
      >
        <div className="container mx-auto max-w-7xl px-4 pointer-events-auto">
          <div className="bg-[#E2D9BC] border-2 border-[#2E130C] shadow-[4px_4px_0px_0px_#2E130C] py-3 px-6 rounded-full mt-4 flex justify-between items-center max-w-5xl mx-auto">
             <div className="flex items-center gap-2 font-titan text-[#2E130C] text-sm md:text-base">
                <div className="bg-[#B20B13] text-[#E2D9BC] p-1 rounded-md border border-[#2E130C]">
                  <Anchor className="h-4 w-4" />
                </div>
                <span className="hidden md:inline">Popey Academy</span>
             </div>
             <div className="flex items-center gap-4">
                 <AuthDialog 
                   mode="login" 
                   trigger={
                     <Button variant="ghost" className="text-[#2E130C] font-bold hover:text-[#B20B13] hover:bg-transparent h-9 font-poppins">
                       Connexion
                     </Button>
                   } 
                 />
                 
                 <div className={cn("flex items-center gap-4")}>
                   <Link href="#pricing">
                      <Button size="sm" className="bg-[#B20B13] hover:bg-[#7A0000] text-[#E2D9BC] font-titan rounded-full px-6 border-2 border-[#2E130C] shadow-[2px_2px_0px_0px_#2E130C] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#2E130C] transition-all">
                        Commencer
                      </Button>
                    </Link>
                 </div>
             </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// --- 3c. SYNERGY GENERATOR ---

const SYNERGY_DATA = {
  health: [
    { 
      title: "Coach Sportif", 
      match: 98, 
      tags: ["Sport", "Santé"], 
      role: "PRESCRIPTEUR",
      roleDesc: "Il peut Vendre à votre place, il vous recommande. Il transfère sa crédibilité pour rassurer vos futurs clients.",
      color: "bg-green-100 text-green-800" 
    },
    { 
      title: "Naturopathe", 
      match: 92, 
      tags: ["Bien-être", "Naturel"], 
      role: "JOKER",
      roleDesc: "Il Complète votre offre. Associez-vous pour répondre à un besoin client que vous ne couvrez pas seul.",
      color: "bg-emerald-100 text-emerald-800" 
    },
    { 
      title: "Ostéopathe", 
      match: 85, 
      tags: ["Physique", "Soin"], 
      role: "MENTOR",
      roleDesc: "Il Débloque la situation. Il a une expertise technique immédiate pour résoudre votre problème.",
      color: "bg-teal-100 text-teal-800" 
    },
    { 
      title: "Psychologue", 
      match: 78, 
      tags: ["Mental", "TCA"], 
      role: "VEILLEUR",
      roleDesc: "Surveille votre marché. Il est vos yeux et vos oreilles sur le terrain pour détecter les opportunités et vous prévient dès que ça bouge.",
      color: "bg-cyan-100 text-cyan-800" 
    },
  ],
  realestate: [
    { 
      title: "Agent Immobilier", 
      match: 99, 
      tags: ["Immo", "Vente"], 
      role: "INFILTRÉ",
      roleDesc: "Il vous Donnera une info avant tout le monde. Soyez le premier sur le coup grâce à une info confidentielle.",
      color: "bg-blue-100 text-blue-800" 
    },
    { 
      title: "Courtier en Prêt", 
      match: 94, 
      tags: ["Finance", "Budget"], 
      role: "PORTIER",
      roleDesc: "Il vous ouvre des portes qui vous sont fermées. Il vous permettra d'accéder directement au décideur que vous n'arrivez pas à joindre.",
      color: "bg-indigo-100 text-indigo-800" 
    },
    { 
      title: "Paysagiste", 
      match: 88, 
      tags: ["Extérieur", "Design"], 
      role: "AMPLIFICATEUR",
      roleDesc: "Il Booste votre visibilité. Il diffuse votre message à sa communauté pour toucher plus de monde (sur linkedin, facebook, instagram..).",
      color: "bg-violet-100 text-violet-800" 
    },
    { 
      title: "Notaire", 
      match: 80, 
      tags: ["Juridique", "Acte"], 
      role: "VEILLEUR",
      roleDesc: "Surveille votre marché. Il est vos yeux et vos oreilles sur le terrain pour détecter les opportunités et vous prévient dès que ça bouge.",
      color: "bg-purple-100 text-purple-800" 
    },
  ],
  business: [
    { 
      title: "Copywriter", 
      match: 96, 
      tags: ["Vente", "Écrit"], 
      role: "AMPLIFICATEUR",
      roleDesc: "Il Booste votre visibilité. Il diffuse votre message à sa communauté pour toucher plus de monde (sur linkedin, facebook, instagram..).",
      color: "bg-orange-100 text-orange-800" 
    },
    { 
      title: "Expert Pubs (Ads)", 
      match: 91, 
      tags: ["Trafic", "Leads"], 
      role: "VEILLEUR",
      roleDesc: "Surveille votre marché. Il est vos yeux et vos oreilles sur le terrain pour détecter les opportunités et vous prévient dès que ça bouge.",
      color: "bg-amber-100 text-amber-800" 
    },
    { 
      title: "Closer / Commercial", 
      match: 87, 
      tags: ["Vente", "Phone"], 
      role: "PRESCRIPTEUR",
      roleDesc: "Il peut Vendre à votre place, il vous recommande. Il transfère sa crédibilité pour rassurer vos futurs clients.",
      color: "bg-yellow-100 text-yellow-800" 
    },
    { 
      title: "Expert Automatisation", 
      match: 82, 
      tags: ["Tech", "Gain de temps"], 
      role: "MENTOR",
      roleDesc: "Il Débloque la situation. Il a une expertise technique immédiate pour résoudre votre problème.",
      color: "bg-lime-100 text-lime-800" 
    },
  ]
};

const SynergySection = () => {
  const [jobInput, setJobInput] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedSynergy, setSelectedSynergy] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Default to "business" if no match, but try to match keywords
  const getSynergies = () => {
    const input = jobInput.toLowerCase();
    if (input.includes("nutri") || input.includes("sport") || input.includes("santé") || input.includes("diet") || input.includes("naturopathe")) return SYNERGY_DATA.health;
    if (input.includes("archi") || input.includes("immo") || input.includes("deco") || input.includes("batiment") || input.includes("travaux")) return SYNERGY_DATA.realestate;
    return SYNERGY_DATA.business;
  };

  const handleReveal = () => {
    if (!jobInput.trim()) return;
    setLoading(true);
    setShowResults(false);
    setSelectedSynergy(null);
    setTimeout(() => {
      setLoading(false);
      setShowResults(true);
    }, 800); 
  };

  const handleSynergyClick = (synergy: any) => {
    setSelectedSynergy(synergy);
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const currentSynergies = getSynergies();

  return (
    <section className="py-24 bg-[#E2D9BC] border-b-4 border-[#2E130C] relative overflow-hidden">
        {/* Background dots/pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2E130C 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

        <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center mb-16">
               <Badge className="bg-[#B20B13] text-[#E2D9BC] border-2 border-[#2E130C] mb-6 uppercase tracking-widest px-3 py-1 font-titan shadow-[3px_3px_0px_0px_#2E130C]">
                 Générateur de Synergies
               </Badge>
               <h2 className="text-3xl md:text-5xl font-titan text-[#2E130C] mb-8 leading-tight drop-shadow-sm">
                 &quot;Dites-nous qui vous êtes,<br/>nous vous dirons <span className="text-[#B20B13] underline decoration-wavy decoration-[#2E130C]/20">avec qui grandir.</span>&quot;
               </h2>
               
               <div className="max-w-xl mx-auto relative mt-8">
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-full relative">
                        <Input 
                          placeholder="Votre métier (ex: Nutritionniste, Architecte...)" 
                          className="h-16 text-lg md:text-xl border-4 border-[#2E130C] rounded-2xl font-poppins font-bold shadow-[4px_4px_0px_0px_#2E130C] focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#2E130C]/40 px-6 bg-[#E2D9BC]/20"
                          value={jobInput}
                          onChange={(e) => setJobInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                        />
                    </div>
                    <Button 
                      onClick={handleReveal}
                      disabled={loading || !jobInput.trim()}
                      className="h-16 px-8 bg-[#B20B13] hover:bg-[#7A0000] text-[#E2D9BC] font-titan rounded-2xl border-4 border-[#2E130C] shadow-[4px_4px_0px_0px_#2E130C] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2E130C] transition-all whitespace-nowrap text-lg w-full md:w-auto"
                    >
                      {loading ? (
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                          <>RÉVÉLER <Sparkles className="ml-2 h-5 w-5" /></>
                      )}
                    </Button>
                  </div>
               </div>
            </div>

            <AnimatePresence mode="wait">
               {showResults && (
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   transition={{ duration: 0.5 }}
                   className="max-w-6xl mx-auto"
                 >
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-12">
                       {currentSynergies.map((synergy: any, index: number) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className={`
                              cursor-pointer relative group
                              ${selectedSynergy === synergy ? 'z-10' : 'hover:-translate-y-2'}
                              transition-all duration-200
                            `}
                            onClick={() => handleSynergyClick(synergy)}
                          >
                             <div className={`
                               bg-white rounded-3xl p-6 border-4 border-[#2E130C] shadow-[6px_6px_0px_0px_#2E130C] h-full flex flex-col items-center text-center transition-all
                               ${selectedSynergy === synergy ? 'ring-4 ring-[#B20B13] ring-offset-4' : ''}
                               ${index === 0 ? 'bg-[#D2E8FF]' : ''}
                             `}>
                                {index === 0 && (
                                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFD700] text-[#2E130C] text-[10px] font-black uppercase px-3 py-1.5 rounded-full border-2 border-[#2E130C] shadow-sm whitespace-nowrap z-20">
                                    ⭐ Top Synergie
                                  </div>
                                )}
                                
                                <div className="h-20 w-20 rounded-full bg-white border-4 border-[#2E130C] mb-4 flex items-center justify-center text-3xl shadow-sm overflow-hidden shrink-0 relative">
                                   <span className="font-titan text-[#2E130C]">{synergy.title[0]}</span>
                                   <div className={`absolute inset-0 opacity-20 ${synergy.color}`}></div>
                                </div>
                                
                                <h3 className="font-titan text-[#2E130C] text-lg leading-tight mb-3 min-h-[3rem] flex items-center justify-center">{synergy.title}</h3>
                                
                                <Badge className={`${index === 0 ? 'bg-[#B20B13] text-[#E2D9BC]' : 'bg-[#2E130C] text-[#E2D9BC]'} border-0 mb-4 px-3 py-1 text-sm font-titan`}>
                                   {synergy.match}% Match
                                </Badge>
                                
                                <div className="flex flex-wrap gap-2 justify-center mt-auto">
                                   {synergy.tags.slice(0,2).map((tag: string, i: number) => (
                                      <span key={i} className="text-[10px] bg-white border-2 border-[#2E130C]/10 px-2 py-1 rounded-lg font-bold text-[#2E130C]/60 uppercase tracking-wide">
                                        {tag}
                                      </span>
                                   ))}
                                </div>
                                
                                <div className="mt-6 w-full pt-4 border-t-2 border-[#2E130C]/10 flex items-center justify-center gap-1 text-xs font-bold text-[#2E130C]/40 group-hover:text-[#B20B13] transition-colors uppercase tracking-widest">
                                   <TrendingUp className="h-3 w-3" /> Détails
                                </div>
                             </div>
                          </motion.div>
                       ))}

                       {/* 5th Blurred Card (Teaser) */}
                       <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 }}
                          className="cursor-not-allowed relative group"
                       >
                           <div className="bg-white/80 rounded-3xl p-6 border-4 border-[#2E130C]/30 shadow-[4px_4px_0px_0px_#2E130C]/20 h-full flex flex-col items-center text-center blur-[1px] opacity-70">
                                <div className="h-20 w-20 rounded-full bg-white border-4 border-[#2E130C]/30 mb-4 flex items-center justify-center text-3xl shadow-sm">
                                   <span className="font-titan text-[#2E130C]/30">?</span>
                                </div>
                                <h3 className="font-titan text-[#2E130C]/50 text-lg leading-tight mb-3 min-h-[3rem] flex items-center justify-center">Et bien d'autres...</h3>
                                <Badge className="bg-[#2E130C]/20 text-[#2E130C]/50 border-0 mb-4 px-3 py-1 text-sm font-titan">
                                   ??? Match
                                </Badge>
                                <div className="flex flex-wrap gap-2 justify-center mt-auto">
                                   <span className="text-[10px] bg-white border-2 border-[#2E130C]/10 px-2 py-1 rounded-lg font-bold text-[#2E130C]/30 uppercase tracking-wide">???</span>
                                   <span className="text-[10px] bg-white border-2 border-[#2E130C]/10 px-2 py-1 rounded-lg font-bold text-[#2E130C]/30 uppercase tracking-wide">???</span>
                                </div>
                           </div>
                           {/* Overlay Text */}
                           <div className="absolute inset-0 flex items-center justify-center z-20">
                                <div className="bg-[#2E130C] text-[#E2D9BC] px-4 py-2 rounded-xl border-2 border-[#E2D9BC] shadow-lg font-titan text-sm transform rotate-[-3deg] whitespace-nowrap">
                                    + 20 autres métiers
                                </div>
                           </div>
                       </motion.div>
                    </div>

                    {/* Selected Synergy Detail View */}
                    <AnimatePresence mode="wait">
                      {selectedSynergy && (
                        <motion.div 
                          ref={detailsRef}
                          key={selectedSynergy.title}
                          initial={{ opacity: 0, height: 0, y: 20 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: 20 }}
                          className="overflow-hidden scroll-mt-32"
                        >
                           <div className="bg-[#2E130C] text-[#E2D9BC] p-8 md:p-10 rounded-[2.5rem] border-4 border-[#E2D9BC] shadow-[12px_12px_0px_0px_#B20B13] max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center relative transform rotate-1 transition-transform hover:rotate-0">
                              <div className="shrink-0 text-center md:text-left bg-[#E2D9BC]/10 p-6 rounded-3xl border-2 border-[#E2D9BC]/20 backdrop-blur-sm">
                                 <div className="text-[#B20B13] font-titan text-7xl mb-0 leading-none drop-shadow-sm">{selectedSynergy.match}%</div>
                                 <div className="text-xs uppercase tracking-[0.2em] font-bold opacity-60 mt-2">Compatibilité Business</div>
                              </div>
                              
                              <div className="w-px h-32 bg-[#E2D9BC]/20 hidden md:block"></div>
                              
                              <div className="text-center md:text-left flex-1">
                                 <h4 className="text-2xl font-titan mb-4 text-[#E2D9BC] flex items-center gap-2 justify-center md:justify-start">
                                    <span className="bg-[#B20B13] text-[#E2D9BC] px-3 py-1 rounded-lg text-lg border border-[#E2D9BC]/30">{selectedSynergy.role}</span>
                                    <span>{selectedSynergy.title}</span>
                                 </h4>
                                 <p className="text-xl font-poppins font-semibold leading-relaxed text-[#E2D9BC]/90 italic">
                                    &quot;{selectedSynergy.roleDesc}&quot;
                                 </p>
                              </div>
                              
                              <div className="shrink-0 pt-4 md:pt-0">
                                 <Button className="h-14 px-8 bg-[#E2D9BC] text-[#2E130C] hover:bg-white font-titan rounded-xl text-lg border-4 border-[#2E130C] shadow-[4px_4px_0px_0px_#2E130C] hover:translate-y-[2px] transition-all whitespace-nowrap">
                                    Trouver ce profil
                                 </Button>
                              </div>
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </motion.div>
               )}
            </AnimatePresence>
        </div>
    </section>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function HomePage() {
  const [activeStep, setActiveStep] = useState(1);
  const [showCaseStudies, setShowCaseStudies] = useState(false);
  const [activeCaseStudy, setActiveCaseStudy] = useState(0);

  return (
    <div className={cn(
      "min-h-screen bg-[#E2D9BC] text-[#2E130C] overflow-x-hidden",
      titanOne.variable, pacifico.variable, poppins.variable
    )}>
      
      <StickyCTA />

      {/* --- 1. HERO SECTION --- */}
      <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 overflow-hidden">
        {/* Cartoon Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
           {/* Clouds / Shapes */}
           <div className="absolute top-10 right-10 w-32 h-16 bg-[#D2E8FF] rounded-full border-2 border-[#2E130C] opacity-80"></div>
           <div className="absolute top-20 left-10 w-24 h-12 bg-white rounded-full border-2 border-[#2E130C] opacity-60"></div>
           <div className="absolute bottom-10 left-[-5%] w-64 h-64 bg-[#B20B13]/10 rounded-full border-2 border-[#2E130C] border-dashed animate-spin-slow"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-titan text-[#2E130C] leading-[1.05] tracking-tight drop-shadow-sm">
                <span className="text-[#B20B13] underline decoration-wavy decoration-[#2E130C]/20">5 minutes</span> par jour pour trouver vos prochains clients.
              </h1>
              
              <p className="text-xl text-[#2E130C] leading-relaxed max-w-2xl mx-auto font-poppins font-bold">
                Arrêtez de prospecter dans le vide. Chaque jour, échangez avec un entrepreneur local et transformez son réseau en opportunités pour vous.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Link href="#pricing">
                  <Button size="lg" className="h-16 px-10 bg-[#B20B13] hover:bg-[#7A0000] text-[#E2D9BC] font-titan text-xl rounded-2xl border-4 border-[#2E130C] shadow-[6px_6px_0px_0px_#2E130C] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#2E130C] transition-all duration-200">
                    Commencer maintenant
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </Link>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-8 pt-12 border-t-2 border-[#2E130C]/20 max-w-2xl mx-auto border-dashed">
                <AnimatedCounter value={1200} label="Mises en relation" suffix="+" />
                <AnimatedCounter value={98} label="Satisfaction" suffix="%" />
                <AnimatedCounter value={300} label="Membres Actifs" suffix="+" />
              </div>
            </motion.div>
        </div>
      </section>

      {/* --- 2. PROBLEM SECTION --- */}
      <section className="py-20 bg-[#D2E8FF] border-y-4 border-[#2E130C]">
        <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center space-y-8">
                <div className="inline-flex items-center justify-center p-3 bg-[#E2D9BC] text-[#B20B13] rounded-full mb-4 border-2 border-[#2E130C] shadow-[3px_3px_0px_0px_#2E130C]">
                    <Heart className="h-8 w-8 fill-current" />
                </div>
                <h2 className="text-3xl md:text-5xl font-titan text-[#2E130C]">Pourquoi trouver des clients est devenu si difficile ?</h2>
                
                <div className="text-lg text-[#2E130C] leading-relaxed space-y-6 font-poppins font-semibold">
                    <p>
                        La plupart des entrepreneurs ne manquent pas de compétences. <br/>
                        <strong className="text-[#B20B13] font-black text-xl font-titan">Ils manquent de visibilité et de réseau.</strong>
                    </p>
                    
                    <div className="bg-[#E2D9BC] p-6 rounded-2xl border-2 border-[#2E130C] shadow-[4px_4px_0px_0px_#2E130C] text-left mx-auto max-w-lg">
                        <p className="font-titan text-[#2E130C] mb-4 text-xl">Vous avez peut-être déjà essayé :</p>
                        <ul className="space-y-3 font-bold">
                            <li className="flex items-start gap-3 text-[#2E130C]">
                                <span className="text-[#B20B13] font-black text-xl">×</span> Publier sur LinkedIn , instagram ... sans résultats
                            </li>
                            <li className="flex items-start gap-3 text-[#2E130C]">
                                <span className="text-[#B20B13] font-black text-xl">×</span> Envoyer des messages qui restent sans réponse
                            </li>
                            <li className="flex items-start gap-3 text-[#2E130C]">
                                <span className="text-[#B20B13] font-black text-xl">×</span> Aller à des événements networking inutiles
                            </li>
                        </ul>
                    </div>

                    <p className="pt-4">
                        Le vrai problème est simple : <br/>
                        <span className="bg-[#B20B13] text-[#E2D9BC] px-2 py-1 font-titan text-lg inline-block mt-2 transform -rotate-1 border-2 border-[#2E130C]">👉 Vous êtes seul.</span>
                    </p>
                    <p className="font-pacifico text-2xl text-[#7A0000]">Alors que le business fonctionne toujours mieux en équipe !</p>
                </div>
                
                <div className="pt-8">
                   <Button 
                      size="lg" 
                      className="bg-[#2E130C] text-[#E2D9BC] hover:bg-[#4a2c22] font-titan rounded-xl px-8 h-12 border-2 border-[#E2D9BC] shadow-lg"
                      onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      Découvrir la solution <ArrowRight className="ml-2 h-4 w-4" />
                   </Button>
                </div>
            </div>
        </div>
      </section>

      {/* --- 3. GROWTH SPHERE --- */}
      <section className="py-20 bg-[#E2D9BC] text-[#2E130C] relative overflow-hidden border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4 max-w-5xl text-center relative z-10">
            <Badge className="bg-[#2E130C] text-[#E2D9BC] border-2 border-[#2E130C] mb-6 uppercase tracking-widest px-3 py-1 font-titan shadow-[3px_3px_0px_0px_#2E130C]">Fini le hasard</Badge>
            <h2 className="text-3xl md:text-5xl font-titan mb-8 leading-tight">
                Ne cherchez plus de clients.<br/>
                Construisez votre <span className="text-[#B20B13] underline decoration-wavy">Sphère de Croissance.</span>
            </h2>
            
            <p className="text-xl text-[#2E130C]/90 mb-12 max-w-3xl mx-auto leading-relaxed font-poppins font-bold">
                Le &quot;networking&quot; classique est épuisant et aléatoire. <br/>
                Popey remplace la quantité par la <strong className="text-[#B20B13] underline decoration-[#2E130C]">stratégie</strong>.
            </p>

            <div className="grid md:grid-cols-3 gap-8 text-left">
                <div className="bg-[#2E130C] p-8 rounded-3xl border-2 border-[#2E130C] shadow-[6px_6px_0px_0px_#2E130C] group hover:translate-y-[-2px] transition-transform">
                    <div className="h-12 w-12 bg-[#D2E8FF] rounded-xl border-2 border-[#E2D9BC] flex items-center justify-center mb-6 text-[#2E130C]">
                        <Users className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-titan text-[#E2D9BC] mb-3">Plus de solitude</h3>
                    <p className="text-[#E2D9BC]/80 leading-relaxed font-poppins font-semibold">
                        Vous n'êtes plus un entrepreneur isolé, mais le membre d'une escouade qui s'entraide au quotidien.
                    </p>
                </div>

                <div className="bg-[#2E130C] p-8 rounded-3xl border-2 border-[#2E130C] shadow-[6px_6px_0px_0px_#2E130C] group hover:translate-y-[-2px] transition-transform">
                    <div className="h-12 w-12 bg-[#B20B13] rounded-xl border-2 border-[#E2D9BC] flex items-center justify-center mb-6 text-[#E2D9BC]">
                        <Zap className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-titan text-[#E2D9BC] mb-3">Plus d'impact</h3>
                    <p className="text-[#E2D9BC]/80 leading-relaxed font-poppins font-semibold">
                        Chaque membre de votre sphère devient un ambassadeur qui parle de vous à son propre réseau.
                    </p>
                </div>

                <div className="bg-[#2E130C] p-8 rounded-3xl border-2 border-[#2E130C] shadow-[6px_6px_0px_0px_#2E130C] group hover:translate-y-[-2px] transition-transform">
                    <div className="h-12 w-12 bg-[#E2D9BC] rounded-xl border-2 border-[#2E130C] flex items-center justify-center mb-6 text-[#2E130C]">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-titan text-[#E2D9BC] mb-3">Plus de revenus</h3>
                    <p className="text-[#E2D9BC]/80 leading-relaxed font-poppins font-semibold">
                        Le but n'est pas de boire du café, mais de signer des contrats grâce à des recommandations qualifiées.
                    </p>
                </div>
            </div>

            <div className="mt-16">
                <Button 
                  size="lg" 
                  className="bg-[#D2E8FF] text-[#2E130C] hover:bg-white font-titan rounded-2xl px-10 h-14 text-lg border-4 border-[#2E130C] shadow-[4px_4px_0px_0px_#2E130C] transition-transform hover:scale-105"
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Rejoindre ma sphère <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </div>
        </div>
      </section>

      {/* --- 3b. NEW CONCRETE EXPLANATION --- */}
      <section className="py-24 bg-[#D2E8FF] overflow-hidden relative border-b-4 border-[#2E130C]">
         <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto mb-16 space-y-6">
               <Badge className="bg-[#2E130C]/10 text-[#2E130C] border-2 border-[#2E130C]/20 px-4 py-1.5 text-sm font-titan uppercase tracking-widest backdrop-blur-sm">
                 🧠 Comment ça se passe concrètement
               </Badge>
               <h2 className="text-4xl md:text-6xl font-titan text-[#2E130C] leading-tight">
                 Votre opportunité du jour <br/><span className="text-[#B20B13] underline decoration-wavy">en 3 secondes.</span>
               </h2>
               <p className="text-xl md:text-2xl text-[#2E130C]/80 leading-relaxed max-w-2xl mx-auto font-poppins font-bold">
                 Chaque matin, Popey vous propose une nouvelle opportunité business adaptée à votre profil.
               </p>
            </div>

            <div className="max-w-6xl mx-auto mt-12">
               <div className="flex flex-col md:flex-row gap-16 lg:gap-24 items-center min-h-[600px]">
                  
                  {/* LEFT COLUMN: 3D CARD FLIP */}
                  <div className="w-full md:w-1/2 relative h-[600px] flex items-center justify-center perspective-[1000px]">
                     <motion.div 
                        className="relative w-full h-full flex items-center justify-center"
                        animate={{ rotateY: activeStep === 1 ? 0 : 180 }}
                        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                        style={{ transformStyle: "preserve-3d" }}
                     >
                        {/* FRONT (MYSTERY) */}
                        <div 
                          className="absolute inset-0 flex items-center justify-center backface-hidden"
                          style={{ backfaceVisibility: "hidden" }}
                        >
                           <div className="bg-[#E2D9BC] border-4 border-[#2E130C] rounded-[2rem] p-4 shadow-[8px_8px_0px_0px_#7A0000] transform rotate-[-2deg] w-full max-w-sm">
                              <div className="scale-[0.9] origin-center opacity-90 grayscale-[0.2]">
                                  <MysteryCardPreview />
                              </div>
                           </div>
                        </div>

                        {/* BACK (REVEALED) */}
                        <div 
                          className="absolute inset-0 flex items-center justify-center backface-hidden"
                          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                        >
                           <div className="bg-[#D2E8FF] border-4 border-[#2E130C] rounded-[2rem] p-4 shadow-[8px_8px_0px_0px_#2E130C] transform rotate-[2deg] w-full max-w-[400px]">
                              {/* Increased scale for visibility */}
                              <div className="scale-[1.0] origin-center">
                                  <MatchCardWhatsAppPreview />
                              </div>
                           </div>
                        </div>
                     </motion.div>
                  </div>

                  {/* RIGHT COLUMN: TEXT CONTENT */}
                  <div className="w-full md:w-1/2">
                     <AnimatePresence mode="wait">
                       {activeStep === 1 ? (
                         <motion.div
                           key="text-step1"
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           transition={{ duration: 0.3 }}
                           className="space-y-6 text-center md:text-left"
                         >
                             <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#E2D9BC] text-[#2E130C] border-2 border-[#2E130C] mb-2 shadow-[4px_4px_0px_0px_#2E130C]">
                                <span className="font-titan text-xl">1</span>
                             </div>
                             <h3 className="text-3xl font-titan text-[#2E130C]">Découvrez votre match du jour</h3>
                             <p className="text-[#2E130C]/80 text-lg leading-relaxed font-poppins font-bold">
                                Popey détecte automatiquement l’entrepreneur le plus pertinent pour vous. 
                                Avant même de révéler son identité, vous voyez le potentiel business, la compatibilité et ce que cette rencontre peut vous apporter.
                             </p>
                             <Button 
                               onClick={() => setActiveStep(2)}
                               className="bg-[#B20B13] hover:bg-[#7A0000] text-[#E2D9BC] font-titan rounded-xl px-8 h-14 text-lg border-2 border-[#2E130C] shadow-[4px_4px_0px_0px_#2E130C] hover:translate-y-[2px] w-full md:w-auto animate-pulse"
                             >
                               DÉCOUVRIR QUI C'EST 🔓
                             </Button>
                         </motion.div>
                       ) : (
                         <motion.div
                           key="text-step2"
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           transition={{ duration: 0.3 }}
                           className="space-y-6 text-center md:text-left"
                         >
                             <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#B20B13] text-[#E2D9BC] border-2 border-[#2E130C] mb-2 shadow-[4px_4px_0px_0px_#E2D9BC]">
                                <span className="font-titan text-xl">2</span>
                             </div>
                             <h3 className="text-3xl font-titan text-[#2E130C]">Passez à l’action en un clic</h3>
                             <p className="text-[#2E130C]/80 text-lg leading-relaxed font-poppins font-bold">
                                Le profil est révélé. Cliquez sur le bouton WhatsApp pour voir le message pré-rempli et initier l'échange sans friction.
                             </p>
                             <div className="flex flex-col gap-3">
                               <Link href="/inscription/spheres">
                                 <Button 
                                   className="bg-[#2E130C] text-[#E2D9BC] hover:bg-[#4a2c22] font-titan rounded-xl px-8 h-14 text-lg border-4 border-[#2E130C] shadow-[4px_4px_0px_0px_#7A0000] hover:translate-y-[2px] w-full md:w-auto"
                                 >
                                   Je veux mon match 👉
                                 </Button>
                               </Link>
                               <Button 
                                 variant="ghost" 
                                 className="text-[#2E130C]/60 hover:text-[#2E130C] hover:bg-transparent font-poppins underline text-sm"
                                 onClick={() => setActiveStep(1)}
                               >
                                 Retour au mystère
                               </Button>
                             </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                  </div>
               </div>
            </div>

         </div>
      </section>

      <SynergySection />

      {/* --- 5. MARKETPLACE (ADDED) --- */}
      <section className="py-24 bg-[#D2E8FF] text-[#2E130C] relative overflow-hidden border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4 relative z-10">
           <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge className="bg-[#2E130C] text-[#E2D9BC] border-2 border-[#2E130C] mb-6 uppercase tracking-widest px-3 py-1 font-titan">Accélérateur de Business</Badge>
              <h2 className="text-3xl md:text-5xl font-titan mb-6 leading-tight">
                  Pas de match aujourd'hui ? <br/>
                  <span className="text-[#B20B13] underline decoration-wavy">Accédez au Marché Caché.</span>
              </h2>
              <p className="text-xl text-[#2E130C]/80 leading-relaxed font-poppins font-bold">
                  Ne restez jamais bloqué. Si l'algorithme ne trouve pas de match parfait, puisez directement dans les opportunités partagées par la communauté.
              </p>
           </div>

           <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
               {/* Opportunity Card 1 */}
               <div className="bg-white rounded-3xl p-6 border-4 border-[#2E130C] shadow-[6px_6px_0px_0px_#2E130C] hover:-translate-y-2 transition-transform">
                   <div className="flex justify-between items-start mb-6">
                       <div className="bg-[#D2E8FF] p-3 rounded-2xl border-2 border-[#2E130C]">
                           <Briefcase className="h-8 w-8 text-[#2E130C]" />
                       </div>
                       <Badge className="bg-[#2E130C] text-[#E2D9BC] font-bold border-0 font-poppins">
                           50 crédits
                       </Badge>
                   </div>
                   <h3 className="text-xl font-titan text-[#2E130C] mb-2">Lead Qualifié - Immo</h3>
                   <p className="text-[#2E130C]/70 text-sm mb-6 leading-relaxed font-poppins font-bold">
                       &quot;Je cherche un architecte pour un projet de rénovation complète (120m²) à Bordeaux Centre. Budget validé.&quot;
                   </p>
                   <Button className="w-full bg-[#2E130C] hover:bg-[#B20B13] text-[#E2D9BC] font-titan rounded-xl h-12 transition-colors border-2 border-[#2E130C]">
                       Débloquer le contact
                   </Button>
               </div>

               {/* Opportunity Card 2 */}
               <div className="bg-white rounded-3xl p-6 border-4 border-[#2E130C] shadow-[6px_6px_0px_0px_#B20B13] hover:-translate-y-2 transition-transform relative overflow-hidden transform rotate-1">
                   <div className="absolute top-0 right-0 bg-[#B20B13] text-[#E2D9BC] text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider font-titan border-l-2 border-b-2 border-[#2E130C]">
                       Exclusivité
                   </div>
                   <div className="flex justify-between items-start mb-6">
                       <div className="bg-[#B20B13] p-3 rounded-2xl border-2 border-[#2E130C]">
                           <Users className="h-8 w-8 text-[#E2D9BC]" />
                       </div>
                       <Badge className="bg-[#2E130C] text-[#E2D9BC] font-bold border-0 font-poppins">
                           150 crédits
                       </Badge>
                   </div>
                   <h3 className="text-xl font-titan text-[#2E130C] mb-2">Intro Décideur - BTP</h3>
                   <p className="text-[#2E130C]/70 text-sm mb-6 leading-relaxed font-poppins font-bold">
                       &quot;Je déjeune demain avec le directeur des achats d'un grand groupe de construction. Je peux faire une intro.&quot;
                   </p>
                   <Button className="w-full bg-[#B20B13] hover:bg-[#7A0000] text-[#E2D9BC] font-titan rounded-xl h-12 transition-colors border-2 border-[#2E130C]">
                       Réserver l'intro
                   </Button>
               </div>

               {/* Opportunity Card 3 */}
               <div className="bg-white rounded-3xl p-6 border-4 border-[#2E130C] shadow-[6px_6px_0px_0px_#2E130C] hover:-translate-y-2 transition-transform">
                   <div className="flex justify-between items-start mb-6">
                       <div className="bg-[#E2D9BC] p-3 rounded-2xl border-2 border-[#2E130C]">
                           <MessageCircle className="h-8 w-8 text-[#2E130C]" />
                       </div>
                       <Badge className="bg-[#2E130C] text-[#E2D9BC] font-bold border-0 font-poppins">
                           30 crédits
                       </Badge>
                   </div>
                   <h3 className="text-xl font-titan text-[#2E130C] mb-2">Visibilité - LinkedIn</h3>
                   <p className="text-[#2E130C]/70 text-sm mb-6 leading-relaxed font-poppins font-bold">
                       &quot;Je cherche un expert en marketing pour intervenir dans mon prochain live (5k abonnés). Sujet : Acquisition.&quot;
                   </p>
                   <Button className="w-full bg-[#2E130C] hover:bg-[#B20B13] text-[#E2D9BC] font-titan rounded-xl h-12 transition-colors border-2 border-[#2E130C]">
                       Postuler
                   </Button>
               </div>
           </div>
        </div>
      </section>

      {/* --- 5b. TRUST SCORE SECTION (NEW) --- */}
      <section className="py-24 bg-[#E2D9BC] border-b-4 border-[#2E130C] relative overflow-hidden">
         <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row gap-16 items-center max-w-6xl mx-auto">
               
               {/* LEFT: VISUAL */}
               <div className="w-full md:w-1/2 relative">
                  <div className="bg-white rounded-[2.5rem] p-8 border-4 border-[#2E130C] shadow-[8px_8px_0px_0px_#2E130C] relative z-10 transform rotate-[-2deg]">
                      <div className="text-center mb-8">
                          <div className="inline-block relative">
                             <div className="text-8xl font-titan text-[#B20B13] drop-shadow-sm">4.6</div>
                             <div className="absolute -top-4 -right-8 bg-[#FFD700] text-[#2E130C] text-xs font-black uppercase px-2 py-1 rounded-full border-2 border-[#2E130C] rotate-12">Top 10%</div>
                          </div>
                          <div className="flex justify-center gap-2 mt-2 text-[#FFD700]">
                             {[1,2,3,4,5].map(i => <Star key={i} className="h-8 w-8 fill-current stroke-[#2E130C] stroke-2" />)}
                          </div>
                          <p className="text-[#2E130C]/60 font-bold font-poppins uppercase tracking-widest mt-2">Score de Confiance</p>
                      </div>
                      
                      <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-[#D2E8FF]/30 rounded-2xl border-2 border-[#2E130C]/10">
                              <div className="flex items-center gap-3">
                                  <div className="bg-[#D2E8FF] p-2 rounded-xl border-2 border-[#2E130C] text-[#2E130C]"><CheckCircle2 className="h-5 w-5" /></div>
                                  <span className="font-titan text-[#2E130C]">Ponctualité</span>
                              </div>
                              <span className="font-black text-[#2E130C]">100%</span>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-[#E2D9BC]/30 rounded-2xl border-2 border-[#2E130C]/10">
                              <div className="flex items-center gap-3">
                                  <div className="bg-[#E2D9BC] p-2 rounded-xl border-2 border-[#2E130C] text-[#2E130C]"><Handshake className="h-5 w-5" /></div>
                                  <span className="font-titan text-[#2E130C]">Fiabilité</span>
                              </div>
                              <span className="font-black text-[#2E130C]">4.8/5</span>
                          </div>
                      </div>
                  </div>
                  
                  {/* Decorative element behind */}
                  <div className="absolute -inset-4 bg-[#2E130C] rounded-[3rem] transform rotate-[3deg] opacity-10 -z-10"></div>
               </div>

               {/* RIGHT: CONTENT */}
               <div className="w-full md:w-1/2 space-y-10">
                  <div>
                      <Badge className="bg-[#2E130C] text-[#E2D9BC] border-2 border-[#2E130C] mb-6 uppercase tracking-widest px-3 py-1 font-titan">Réputation</Badge>
                      <h2 className="text-4xl md:text-5xl font-titan text-[#2E130C] mb-6 leading-tight">
                          Votre réputation est votre actif le <span className="text-[#B20B13] underline decoration-wavy">plus précieux.</span>
                      </h2>
                      <p className="text-xl text-[#2E130C]/80 font-poppins font-bold">
                          Fini les &quot;je te rappelle&quot; qui n'arrivent jamais. Sur Mon Réseau Local, tout est mesuré.
                      </p>
                  </div>

                  <div className="space-y-8">
                      <div className="flex gap-6">
                          <div className="shrink-0 bg-[#B20B13] text-[#E2D9BC] h-14 w-14 rounded-2xl border-2 border-[#2E130C] flex items-center justify-center shadow-[4px_4px_0px_0px_#2E130C]">
                              <Trophy className="h-7 w-7" />
                          </div>
                          <div>
                              <h3 className="text-xl font-titan text-[#2E130C] mb-2">Hiérarchie de Qualité</h3>
                              <p className="text-[#2E130C]/70 font-poppins font-bold leading-relaxed">
                                  Ici, la fiabilité est récompensée. Plus vous jouez le jeu, plus l'algorithme vous matche avec les membres 'Elite'.
                              </p>
                          </div>
                      </div>

                      <div className="flex gap-6">
                          <div className="shrink-0 bg-[#2E130C] text-[#E2D9BC] h-14 w-14 rounded-2xl border-2 border-[#E2D9BC] flex items-center justify-center shadow-[4px_4px_0px_0px_#B20B13]">
                              <ShieldCheck className="h-7 w-7" />
                          </div>
                          <div>
                              <h3 className="text-xl font-titan text-[#2E130C] mb-2">Accès Privilégié</h3>
                              <p className="text-[#2E130C]/70 font-poppins font-bold leading-relaxed">
                                  Un score de 4.5/5 vous donne accès aux décideurs les plus influents de la région.
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="pt-4">
                      <Link href="/inscription/spheres">
                        <Button className="h-14 px-8 bg-transparent hover:bg-[#2E130C]/5 text-[#2E130C] font-titan rounded-xl text-lg border-4 border-[#2E130C] shadow-[4px_4px_0px_0px_#2E130C] hover:translate-y-[2px] transition-all">
                            Augmenter mon score
                        </Button>
                      </Link>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- 4. GAMIFICATION REWARDS --- */}
      <section className="py-24 bg-[#E2D9BC] border-b-4 border-[#2E130C]">
         <div className="container mx-auto px-4">
            
            {/* ROI MATH SECTION */}
            <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 border-4 border-[#2E130C] shadow-[8px_8px_0px_0px_#2E130C] mb-20 text-center transform rotate-1">
                <div className="inline-block bg-[#B20B13] text-[#E2D9BC] font-titan px-4 py-1 rounded-full mb-4 uppercase tracking-wider text-sm border-2 border-[#2E130C]">
                    Simulation Rentabilité
                </div>
                <h3 className="text-3xl md:text-4xl font-titan text-[#2E130C] mb-6">
                    Et si 5 minutes valaient <span className="text-[#B20B13] underline decoration-wavy">3 000 € ?</span>
                </h3>
                
                <div className="grid md:grid-cols-3 gap-8 items-center justify-center my-8 font-poppins">
                    <div className="space-y-2">
                        <div className="text-5xl font-titan text-[#2E130C]">20</div>
                        <div className="text-sm font-black text-[#2E130C]/60 uppercase">Matchs / mois</div>
                    </div>
                    <div className="text-4xl font-black text-[#B20B13]">×</div>
                    <div className="space-y-2">
                        <div className="text-5xl font-titan text-[#2E130C]">150€</div>
                        <div className="text-sm font-black text-[#2E130C]/60 uppercase">Valeur Moyenne</div>
                    </div>
                </div>

                <div className="bg-[#E2D9BC] rounded-2xl p-6 border-2 border-[#2E130C] inline-block w-full max-w-lg">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[#2E130C] font-bold font-poppins">Valeur générée estimée</span>
                        <span className="font-titan text-[#B20B13] text-xl">+ 3 000 € / mois</span>
                    </div>
                    <div className="h-4 w-full bg-white rounded-full overflow-hidden border-2 border-[#2E130C]">
                        <div className="h-full bg-[#B20B13] w-[98%]"></div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto text-center mb-16">
               <span className="text-[#B20B13] font-pacifico text-2xl mb-2 block">C'est pas de la magie, c'est du réseau !</span>
               <h2 className="text-3xl md:text-5xl font-titan mb-6 text-[#2E130C]">Ce que chaque échange rapporte</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
               {[
                 { icon: "💰", label: "Clients Directs", desc: "Transformez une conversation en mise en relation avec un prospect chaud.", pts: "+10 pts" },
                 { icon: "🔑", label: "Accès Stratégiques", desc: "Faites-vous ouvrir la porte d'un décideur ou d'un partenaire clé.", pts: "+8 pts" },
                 { icon: "📢", label: "Co-Créations", desc: "Lives, posts croisés ou webinaires : fusionnez vos audiences.", pts: "+7 pts" },
                 { icon: "🎟", label: "Accès VIP", desc: "Soyez invité dans les clubs, dîners business et réseaux fermés.", pts: "+6 pts" },
                 { icon: "⭐", label: "Crédibilité", desc: "Bétonnez votre réputation avec des avis Google et recommandations.", pts: "+4 pts" },
                 { icon: "🤝", label: "Coups de Pouce", desc: "Feedback, conseil d'expert ou partage d'infos utiles.", pts: "+2 pts" },
               ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white p-6 rounded-3xl border-2 border-[#2E130C] shadow-[4px_4px_0px_0px_#2E130C] hover:translate-y-[-2px] hover:shadow-[2px_2px_0px_0px_#2E130C] transition-all group relative overflow-hidden"
                  >
                     <div className="flex justify-between items-start">
                        <div className="text-4xl mb-4">{item.icon}</div>
                        <Badge className="font-titan text-xs px-2 py-1 bg-[#D2E8FF] text-[#2E130C] border border-[#2E130C]">
                           {item.pts}
                        </Badge>
                     </div>
                     
                     <div>
                        <h3 className="font-titan text-[#2E130C] text-xl mb-2">{item.label}</h3>
                        <p className="text-[#2E130C]/80 text-sm leading-relaxed font-poppins font-bold">
                           {item.desc}
                        </p>
                     </div>
                  </motion.div>
               ))}
            </div>
            
            <div className="flex justify-center">
                <Button 
                   size="lg" 
                   className="bg-[#B20B13] hover:bg-[#7A0000] text-[#E2D9BC] font-titan rounded-2xl px-8 h-14 border-4 border-[#2E130C] shadow-[6px_6px_0px_0px_#2E130C] hover:translate-y-[2px]"
                   onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  👉 Je veux mes 5 minutes <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
         </div>
      </section>

      {/* --- 6. TESTIMONIALS (ADDED) --- */}
      <section className="py-24 bg-[#D2E8FF] border-b-4 border-[#2E130C]">
         <div className="container mx-auto px-4">
            
            {/* STRONG PROOF SECTION */}
            <div className="max-w-5xl mx-auto bg-[#2E130C] rounded-3xl p-8 md:p-12 mb-20 text-center relative overflow-hidden shadow-[8px_8px_0px_0px_#E2D9BC] border-4 border-[#E2D9BC]">
                <h3 className="text-2xl md:text-3xl font-titan text-[#E2D9BC] mb-8 relative z-10">
                    Ce mois-ci sur <span className="text-[#B20B13] underline decoration-wavy">Bordeaux</span> :
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 font-poppins">
                    <div className="flex flex-col items-center">
                        <div className="text-5xl font-titan text-[#E2D9BC] mb-2">312</div>
                        <div className="text-[#D2E8FF] font-bold uppercase text-sm tracking-widest">Mises en relation</div>
                    </div>
                    <div className="flex flex-col items-center border-x-2 border-[#E2D9BC]/20 px-4">
                        <div className="text-5xl font-titan text-[#E2D9BC] mb-2">472</div>
                        <div className="text-[#D2E8FF] font-bold uppercase text-sm tracking-widest">Recommandations</div>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="text-5xl font-titan text-[#B20B13] mb-2">47</div>
                        <div className="text-[#B20B13]/80 font-bold uppercase text-sm tracking-widest">Deals conclus</div>
                    </div>
                </div>
            </div>

            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-4xl font-titan text-[#2E130C] mb-4">Ils ont arrêté de prospecter dans le vide</h2>
               <p className="text-[#2E130C]/60 text-lg font-poppins font-bold">Des résultats concrets, pas juste des discussions.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
               {[
                 {
                   name: "Sarah L.",
                   role: "Consultante Marketing",
                   text: "J’ai trouvé 3 clients en 2 mois grâce aux recommandations. C'est bien plus efficace que la prospection à froid.",
                   img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=2000&auto=format&fit=crop"
                 },
                 {
                   name: "David M.",
                   role: "Développeur Web",
                   text: "Le système de confiance motive vraiment les gens à aider. On ne se sent plus seul face à son business.",
                   img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2000&auto=format&fit=crop"
                 },
                 {
                   name: "Julie T.",
                   role: "Coach Business",
                   text: "Chaque matin, c'est une surprise. J'ai rencontré des partenaires que je n'aurais jamais croisés ailleurs.",
                   img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2000&auto=format&fit=crop"
                 }
               ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-8 rounded-3xl border-4 border-[#2E130C] shadow-[4px_4px_0px_0px_#2E130C] hover:translate-y-[-2px] hover:shadow-[2px_2px_0px_0px_#2E130C] transition-all relative"
                  >
                     <div className="flex items-center gap-4 mb-6">
                        <Avatar className="h-14 w-14 border-2 border-[#2E130C]">
                           <AvatarImage src={item.img} className="object-cover" />
                           <AvatarFallback>{item.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                           <div className="font-titan text-[#2E130C] text-lg">{item.name}</div>
                           <div className="text-xs text-[#7A0000] font-bold uppercase font-poppins">{item.role}</div>
                        </div>
                     </div>
                     <p className="text-[#2E130C] leading-relaxed italic font-poppins font-semibold">"{item.text}"</p>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>

      <section className="py-24 bg-[#D2E8FF] border-b-4 border-[#2E130C] relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto bg-[#E2D9BC] rounded-[2.5rem] p-8 md:p-12 border-4 border-[#2E130C] shadow-[10px_10px_0px_0px_#2E130C] relative">
            <div className="absolute top-0 right-0 bg-[#B20B13] text-[#E2D9BC] text-[10px] md:text-xs font-black uppercase tracking-wider px-4 py-2 rounded-bl-2xl border-l-2 border-b-2 border-[#2E130C] font-poppins">
              RECOMMANDÉ : 6 mois pour transformer votre business
            </div>

            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-5xl font-titan text-[#2E130C] mb-4 leading-tight">
                Vous n&apos;avez pas le temps de gérer votre réseau ? Laissez-nous piloter votre croissance.
              </h2>
              <p className="text-[#2E130C]/80 text-lg md:text-xl font-poppins font-bold max-w-4xl mx-auto">
                Un seul objectif : trouver des clients. Deux véhicules possibles : en autonomie avec l&apos;App, ou accompagné 100% humain avec un directeur commercial privé.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <div className="rounded-3xl border-4 border-[#2E130C] bg-white p-6 shadow-[4px_4px_0px_0px_#2E130C]">
                <div className="inline-flex items-center gap-2 bg-[#D2E8FF] border-2 border-[#2E130C] rounded-full px-4 py-1 mb-4">
                  <Compass className="h-4 w-4 text-[#2E130C]" />
                  <span className="text-xs font-black uppercase tracking-widest text-[#2E130C] font-poppins">Véhicule 1</span>
                </div>
                <h3 className="text-2xl font-titan text-[#2E130C] mb-2">Autonomie totale</h3>
                <p className="text-[#2E130C]/80 font-poppins font-semibold">
                  Vous utilisez Popey à votre rythme : matchs quotidiens, marché caché, score de confiance. Idéal si vous aimez piloter seul.
                </p>
              </div>
              <div className="rounded-3xl border-4 border-[#2E130C] bg-[#2E130C] p-6 shadow-[4px_4px_0px_0px_#B20B13]">
                <div className="inline-flex items-center gap-2 bg-[#E2D9BC] border-2 border-[#E2D9BC] rounded-full px-4 py-1 mb-4">
                  <Handshake className="h-4 w-4 text-[#2E130C]" />
                  <span className="text-xs font-black uppercase tracking-widest text-[#2E130C] font-poppins">Véhicule 2</span>
                </div>
                <h3 className="text-2xl font-titan text-[#E2D9BC] mb-2">Accompagnement Commando</h3>
                <p className="text-[#D2E8FF] font-poppins font-semibold">
                  Vous gardez tous les avantages de l&apos;App, avec un pilotage humain quotidien et un directeur commercial privé pour accélérer vos résultats.
                </p>
              </div>
            </div>

            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h3 className="text-2xl md:text-3xl font-titan text-[#2E130C]">Comparatif pilier par pilier</h3>
              <div className="inline-flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-widest font-poppins">
                <span className="px-3 py-1 rounded-full border-2 border-[#2E130C] bg-white text-[#2E130C]">Mode App</span>
                <span className="px-3 py-1 rounded-full border-2 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC]">Mode Commando</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-10">
              {[
                {
                  icon: Compass,
                  title: "On s'occupe de tout, vous signez.",
                  app: "L'algorithme détecte vos opportunités. Vous gérez vos prises de contact en autonomie.",
                  commando:
                    "On ne vous donne pas juste un nom. On sélectionne votre partenaire, on crée votre groupe de travail et on fixe vos objectifs. Vous n'aurez plus qu'à vous présenter l'un à l'autre.",
                },
                {
                  icon: Handshake,
                  title: "Une offre irrésistible créée pour vous.",
                  app: "Vous échangez avec vos matchs pour tenter de créer des synergies.",
                  commando:
                    "Notre stratège rédige votre \"Pack Duo\", vos scripts de vente et crée vos visuels. Vous arrivez sur le marché avec une offre imbattable, déjà prête.",
                },
                {
                  icon: TrendingUp,
                  title: "Un Directeur Commercial dans votre poche.",
                  app: "Vous progressez seul, selon votre motivation et votre emploi du temps.",
                  commando:
                    "Un suivi humain quotidien sur WhatsApp. Votre directeur commercial privé vous donne votre mission chaque matin et s'assure que vos devis sont envoyés.",
                },
                {
                  icon: Users,
                  title: "Votre Cercle Privé de 20 apporteurs d'affaires.",
                  app: "Vous rencontrez des entrepreneurs un par un, au fil des matchs.",
                  commando:
                    "Vous verrouillez votre place dans un QG de 20 métiers complémentaires. C’est un écosystème fermé : chaque chantier ou contrat détecté par l'un profite aux 19 autres.",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-3xl border-2 border-[#2E130C] bg-white p-6 text-left shadow-[4px_4px_0px_0px_#2E130C]"
                >
                  <div className="inline-flex p-3 rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] text-[#2E130C] mb-4">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-titan text-[#2E130C] mb-4">{item.title}</h3>
                  <div className="space-y-4 text-sm md:text-base leading-relaxed font-poppins font-semibold">
                    <div className="rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF]/50 p-4">
                      <p className="text-[11px] md:text-xs uppercase tracking-widest font-black text-[#2E130C] mb-2">Mode App</p>
                      <p className="text-[#2E130C]/80">{item.app}</p>
                    </div>
                    <div className="rounded-2xl border-2 border-[#2E130C] bg-[#2E130C] p-4">
                      <p className="text-[11px] md:text-xs uppercase tracking-widest font-black text-[#E2D9BC] mb-2">Mode Commando</p>
                      <p className="text-[#D2E8FF]">{item.commando}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="rounded-3xl border-4 border-[#2E130C] bg-white p-4 md:p-6 mb-10 shadow-[6px_6px_0px_0px_#2E130C]">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[760px]">
                  <thead>
                    <tr className="border-b border-[#2E130C]/30">
                      <th className="py-3 pr-4 text-xs uppercase tracking-widest font-poppins font-black text-[#2E130C]">Fonctionnalité</th>
                      <th className="py-3 px-4 text-xs uppercase tracking-widest font-poppins font-black text-[#2E130C]">Application (79€/m)</th>
                      <th className="py-3 pl-4 text-xs uppercase tracking-widest font-poppins font-black text-[#7A0000]">Accompagnement (149€/m)</th>
                    </tr>
                  </thead>
                  <tbody className="font-poppins font-bold text-sm md:text-base text-[#2E130C]">
                    {[
                      ["Matching Algorithmique", "✅", "✅"],
                      ["Accès Marché Caché", "✅", "✅"],
                      ["Matching Manuel Stratégique", "❌", "OUI (Prioritaire)"],
                      ["Création d'Offres Duo & Scripts", "❌", "OUI (Sur-mesure)"],
                      ['Accès "Squad de Croissance"', "❌ (Matchs solos)", "OUI (Cercle de 20 experts)"],
                      ["Partage d'Opportunités Directes", "❌", "OUI (Flux permanent)"],
                      ["Suivi Humain Quotidien", "❌", "OUI (WhatsApp dédié)"],
                      ["Objectif de Résultat", "Autonomie", "Transformation 6 mois"],
                    ].map((row) => (
                      <tr key={row[0]} className="border-b last:border-b-0 border-[#2E130C]/10">
                        <td className="py-3 pr-4">{row[0]}</td>
                        <td className="py-3 px-4">{row[1]}</td>
                        <td className="py-3 pl-4 text-[#7A0000]">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-center">
              <div className="max-w-4xl mx-auto mb-6 rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] p-5 text-left shadow-[4px_4px_0px_0px_#2E130C]">
                <p className="text-[#2E130C] font-poppins font-bold text-sm md:text-base leading-relaxed">
                  Ne payez plus pour apprendre, payez pour être à la table où se partagent les contrats. En rejoignant le Programme Commando, vous n&apos;obtenez pas juste des conseils, vous obtenez une place réservée dans une escouade de 20 professionnels qui travaillent activement pour votre carnet de commandes.
                </p>
              </div>
              <Link href={COMMANDO_APPLICATION_URL}>
                <Button size="lg" className="bg-[#B20B13] hover:bg-[#7A0000] text-[#E2D9BC] font-titan rounded-2xl px-8 h-14 border-4 border-[#2E130C] shadow-[6px_6px_0px_0px_#2E130C] hover:translate-y-[2px]">
                  Postuler au Programme Commando (Places limitées)
                </Button>
              </Link>
              <p className="mt-4 text-[#2E130C]/80 font-poppins font-bold text-sm md:text-base">
                Seulement 100 places disponibles par ville pour garantir un matching de haute qualité.
              </p>
              <div className="mt-6">
                <Button
                  type="button"
                  onClick={() => setShowCaseStudies((current) => !current)}
                  className="h-11 px-5 bg-[#D2E8FF] text-[#2E130C] hover:bg-white border-2 border-[#2E130C] shadow-[3px_3px_0px_0px_#2E130C] rounded-xl font-titan"
                >
                  {showCaseStudies ? "Masquer les études de cas" : "Voir les études de cas"}
                </Button>
              </div>
            </div>

            {showCaseStudies && (
              <div className="mt-10 rounded-3xl border-4 border-[#2E130C] bg-white p-6 md:p-8 shadow-[8px_8px_0px_0px_#2E130C]">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <Badge className="bg-[#B20B13] text-[#E2D9BC] border-2 border-[#2E130C] uppercase tracking-widest font-titan">La force de l&apos;alliance</Badge>
                    <p className="mt-2 text-[#2E130C] font-poppins font-bold">
                      D&apos;un côté 1 500€ de CA isolé, de l&apos;autre 10 000€ de CA en escouade. Choisissez votre camp.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-2 border-[#2E130C] text-[#2E130C] font-titan"
                      onClick={() => setActiveCaseStudy((current) => (current === 0 ? CASE_STUDIES.length - 1 : current - 1))}
                    >
                      Précédent
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-2 border-[#2E130C] text-[#2E130C] font-titan"
                      onClick={() => setActiveCaseStudy((current) => (current === CASE_STUDIES.length - 1 ? 0 : current + 1))}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>

                <motion.div
                  key={CASE_STUDIES[activeCaseStudy].name}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border-2 border-[#2E130C] bg-[#E2D9BC] p-5 md:p-6"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge className="bg-[#2E130C] text-[#E2D9BC] border-0 font-poppins">{CASE_STUDIES[activeCaseStudy].sector}</Badge>
                    <Badge className="bg-[#D2E8FF] text-[#2E130C] border-2 border-[#2E130C] font-poppins">🚀 L&apos;EXEMPLE CHOC : {CASE_STUDIES[activeCaseStudy].name}</Badge>
                  </div>

                  <div className="space-y-1 mb-4 text-[#2E130C] font-poppins font-semibold">
                    {CASE_STUDIES[activeCaseStudy].profiles.map((profile) => (
                      <p key={profile}>{profile}</p>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-3 gap-3 mb-5">
                    <div className="rounded-xl border-2 border-[#2E130C] bg-white p-3">
                      <p className="text-xs uppercase tracking-widest font-black text-[#7A0000] font-poppins">Investissement</p>
                      <p className="text-2xl font-titan text-[#2E130C]">{CASE_STUDIES[activeCaseStudy].investment}</p>
                    </div>
                    <div className="rounded-xl border-2 border-[#2E130C] bg-white p-3">
                      <p className="text-xs uppercase tracking-widest font-black text-[#7A0000] font-poppins">CA Généré</p>
                      <p className="text-2xl font-titan text-[#2E130C]">{CASE_STUDIES[activeCaseStudy].revenue}</p>
                    </div>
                    <div className="rounded-xl border-2 border-[#2E130C] bg-white p-3">
                      <p className="text-xs uppercase tracking-widest font-black text-[#7A0000] font-poppins">Temps passé</p>
                      <p className="text-base font-black text-[#2E130C] font-poppins">{CASE_STUDIES[activeCaseStudy].time}</p>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {CASE_STUDIES[activeCaseStudy].weekly.map((step) => (
                      <li key={step} className="text-sm md:text-base text-[#2E130C] font-poppins font-bold">
                        • {step}
                      </li>
                    ))}
                  </ul>

                  <p className="text-[#2E130C]/90 text-sm md:text-base font-poppins font-bold">
                    {CASE_STUDIES[activeCaseStudy].summary}
                  </p>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- 7. FOUNDER STORY (ADDED) --- */}
      <section className="py-24 bg-[#E2D9BC] border-b-4 border-[#2E130C] relative overflow-hidden">
        <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-[3rem] p-8 md:p-12 lg:p-16 border-4 border-[#2E130C] relative overflow-hidden shadow-[12px_12px_0px_0px_#2E130C]">
                
                <div className="relative z-10">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="inline-flex items-center justify-center p-4 bg-[#E2D9BC] rounded-2xl shadow-[4px_4px_0px_0px_#2E130C] mb-6 border-2 border-[#2E130C]">
                            <Anchor className="h-8 w-8 text-[#2E130C]" />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-titan text-[#2E130C] mb-6">Pourquoi Popey ?</h2>
                    </div>
                    
                    <div className="space-y-10 text-lg text-[#2E130C] leading-relaxed max-w-3xl mx-auto font-poppins font-semibold">
                        <div className="text-center">
                            <p className="mb-2">Pendant des années, nous avons observé la même chose :</p>
                            <p className="text-2xl font-bold text-[#2E130C]">Des entrepreneurs compétents... <span className="text-[#B20B13] font-black">Mais isolés.</span></p>
                        </div>

                        <div className="bg-[#2E130C] text-[#E2D9BC] p-8 md:p-10 rounded-3xl shadow-[8px_8px_0px_0px_#7A0000] border-4 border-[#E2D9BC] transform md:scale-105 transition-transform duration-300 relative overflow-hidden group rotate-[-1deg]">
                            <div className="relative z-10 text-center">
                                <p className="text-sm font-bold text-[#E2D9BC]/60 uppercase tracking-widest mb-3">La Réalité</p>
                                <p className="text-xl md:text-2xl font-pacifico leading-relaxed">
                                    "Le succès ne dépend pas seulement de ce que vous savez faire.<br className="hidden md:block"/> Il dépend surtout de <span className="text-[#D2E8FF] not-italic font-titan">qui vous connaissez</span>."
                                </p>
                            </div>
                        </div>
                        
                        <div className="text-center pt-8">
                             <p className="text-sm font-bold text-[#2E130C]/60 uppercase tracking-widest mb-2">Notre Solution</p>
                             <p className="text-4xl font-titan text-[#2E130C] mb-8">C’est devenu Popey.</p>
                             <Button 
                                size="lg" 
                                className="bg-[#B20B13] hover:bg-[#7A0000] text-[#E2D9BC] font-titan rounded-full px-8 h-12 border-2 border-[#2E130C] shadow-[4px_4px_0px_0px_#2E130C] hover:translate-y-[2px]"
                                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                             >
                               Rejoindre Popey <ArrowRight className="ml-2 h-4 w-4" />
                             </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- 13. PRICING & FINAL CTA --- */}
      <section id="pricing" className="py-24 bg-[#D2E8FF] relative overflow-hidden border-t-4 border-[#E2D9BC]">
         <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto bg-[#E2D9BC] rounded-[3rem] p-8 md:p-16 text-center border-4 border-[#E2D9BC] shadow-2xl relative overflow-hidden">
               
               <h2 className="text-4xl md:text-5xl font-titan mb-6 relative z-10 text-[#2E130C]">
                  Votre réseau commence <span className="text-[#B20B13] underline decoration-wavy">aujourd’hui.</span>
               </h2>
               
               <div className="bg-white rounded-3xl p-8 max-w-lg mx-auto mb-8 border-4 border-[#2E130C] mt-12 text-left shadow-[8px_8px_0px_0px_#2E130C] rotate-1">
                  <div className="text-center mb-8">
                      <div className="inline-block bg-[#D2E8FF] text-[#2E130C] border-2 border-[#2E130C] px-6 py-2 rounded-full text-base font-titan uppercase tracking-widest mb-4">
                          Le Défi Immédiat
                      </div>
                      <div className="text-3xl md:text-4xl font-titan text-[#2E130C] mb-2 leading-tight">1 Jour, 1 Match. 1 Opportunité.</div>
                      <p className="text-[#2E130C] text-base md:text-lg mt-4 font-poppins font-bold">
                          Pas de blabla. Rejoins le cercle, obtiens ton premier contact qualifié dans les 24h, et juge par toi-même.
                      </p>
                  </div>

                  <ul className="space-y-4 mb-8 font-poppins font-bold text-[#2E130C]">
                     <li className="flex items-start gap-3 text-base md:text-lg">
                        <span className="text-2xl">🎯</span> 
                        <span className="font-bold">Ton premier match ciblé dès l'inscription</span>
                     </li>
                     <li className="flex items-start gap-3 text-base md:text-lg">
                        <span className="text-2xl">🔓</span> 
                        <span>Accès VIP au Marché des Offres</span>
                     </li>
                     <li className="flex items-start gap-3 text-base md:text-lg">
                        <span className="text-2xl">🤝</span> 
                        <span>Zéro risque, juste du business</span>
                     </li>
                  </ul>
                  
                  <Link href="/inscription/spheres">
                    <Button className="w-full h-auto py-4 md:h-16 bg-[#B20B13] text-[#E2D9BC] hover:bg-[#7A0000] font-titan rounded-xl text-lg md:text-xl border-2 border-[#2E130C] shadow-[4px_4px_0px_0px_#2E130C] hover:translate-y-[2px] whitespace-normal text-center">
                      Débloquer mon opportunité maintenant
                    </Button>
                  </Link>
                  
                  <div className="grid md:grid-cols-2 gap-4 mt-8">
                    <div className="rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] p-5 text-left relative">
                      <div className="inline-flex items-center gap-2 mb-3 text-[#2E130C]">
                        <Compass className="h-4 w-4" />
                        <p className="text-xs uppercase tracking-widest font-black font-poppins">Option 1 : Autonomie Digitale</p>
                      </div>
                      <p className="text-3xl font-titan text-[#2E130C] mb-4">79 € / mois</p>
                      <ul className="space-y-2 text-sm text-[#2E130C] font-poppins font-bold mb-5">
                        <li>• Matchs quotidiens via l&apos;App</li>
                        <li>• Accès au Marché Caché</li>
                        <li>• Score de confiance</li>
                      </ul>
                      <Link href="/inscription/spheres">
                        <Button className="w-full bg-[#2E130C] hover:bg-[#7A0000] text-[#E2D9BC] font-titan rounded-xl border-2 border-[#2E130C]">
                          Commencer
                        </Button>
                      </Link>
                    </div>

                    <div className="rounded-2xl border-2 border-[#2E130C] bg-[#E2D9BC] p-5 text-left relative overflow-hidden">
                      <div className="absolute -top-1 right-0 bg-[#B20B13] text-[#E2D9BC] text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl border-l-2 border-b-2 border-[#2E130C] font-poppins">
                        RECOMMANDÉ : 6 mois
                      </div>
                      <div className="inline-flex items-center gap-2 mb-3 text-[#2E130C]">
                        <Handshake className="h-4 w-4" />
                        <p className="text-xs uppercase tracking-widest font-black font-poppins">Option 2 : Accompagnement Commando</p>
                      </div>
                      <p className="text-3xl font-titan text-[#2E130C] mb-4">149 € / mois</p>
                      <ul className="space-y-2 text-sm text-[#2E130C] font-poppins font-bold mb-5">
                        <li className="flex items-start gap-2"><TrendingUp className="h-4 w-4 mt-0.5 text-[#7A0000]" /> <span>Inclus : Accès complet à l&apos;App</span></li>
                        <li>• + Matching manuel par nos experts</li>
                        <li>• + Création d&apos;offres Duo & Stratégie</li>
                        <li>• + Suivi humain quotidien pendant 6 mois</li>
                      </ul>
                      <Link href={COMMANDO_APPLICATION_URL}>
                        <Button className="w-full bg-[#B20B13] hover:bg-[#7A0000] text-[#E2D9BC] font-titan rounded-xl border-2 border-[#2E130C]">
                          Postuler au Programme
                        </Button>
                      </Link>
                    </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#E2D9BC] py-12 border-t-4 border-[#2E130C] text-[#2E130C] font-poppins font-bold">
        <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-[#B20B13] text-[#E2D9BC] p-1 rounded-md border-2 border-[#2E130C]">
                            <Anchor className="h-6 w-6" />
                        </div>
                        <span className="font-titan uppercase tracking-widest text-lg">Popey Academy</span>
                    </div>
                    <p className="text-sm text-[#2E130C]/80">
                        La première école qui transforme l'indécision en action.
                        <br/><span className="font-pacifico text-[#B20B13] text-lg">Force & Honneur !</span>
                    </p>
                </div>
                <div>
                    <h4 className="font-titan text-[#2E130C] uppercase mb-4 text-sm">Légal</h4>
                    <ul className="space-y-2 text-sm text-[#2E130C]/80">
                        <li><Link href="/legal/mentions" className="hover:text-[#B20B13]">Mentions Légales</Link></li>
                        <li><Link href="/legal/terms" className="hover:text-[#B20B13]">CGV / CGU</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-titan text-[#2E130C] uppercase mb-4 text-sm">Contact</h4>
                    <ul className="space-y-2 text-sm text-[#2E130C]/80">
                        <li>contact@popey.academy</li>
                        <li>Dax, France</li>
                    </ul>
                </div>
            </div>
            <div className="pt-8 border-t-2 border-[#2E130C]/20 text-center">
                <p className="text-[#2E130C]/60 text-xs">© 2026 Popey Academy. Tous droits réservés.</p>
            </div>
        </div>
      </footer>

    </div>
  );
}
