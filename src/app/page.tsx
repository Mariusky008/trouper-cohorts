"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useInView } from "framer-motion";
import Link from "next/link";
import { 
  Users, Calendar, Phone, CheckCircle2, 
  ArrowRight, ShieldCheck, Zap, Briefcase, 
  Target, TrendingUp, Star, Play, Lock,
  MessageCircle, Clock, Bell, ChevronRight, Anchor, Heart, Coffee, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { AuthDialog } from "@/components/auth-dialog";
import { MysteryCardPreview, MatchCardPreview } from "@/components/dashboard/design-system-preview";

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
      <div className="text-3xl md:text-4xl font-black text-slate-900 mb-1">
        {count}{suffix}
      </div>
      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</div>
    </div>
  );
};

const StickyCTA = () => {
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only set visibility if window exists (client-side)
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
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm py-3 px-6 rounded-full mt-4 flex justify-between items-center max-w-5xl mx-auto">
             <div className="flex items-center gap-2 font-black text-slate-900 text-sm md:text-base">
                <div className="bg-blue-600 text-white p-1 rounded-md">
                  <Anchor className="h-4 w-4" />
                </div>
                <span className="hidden md:inline">Popey Academy</span>
             </div>
             <div className="flex items-center gap-4">
                 <AuthDialog 
                   mode="login" 
                   trigger={
                     <Button variant="ghost" className="text-slate-600 font-bold hover:text-blue-600 h-9">
                       Connexion
                     </Button>
                   } 
                 />
                 
                 <div className={cn("flex items-center gap-4")}>
                    {isVisible && <span className="text-xs font-bold text-slate-500 hidden lg:inline">1€ les 3 premiers jours</span>}
                    <AuthDialog 
                      mode="signup"
                      trigger={
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full px-6 shadow-lg shadow-blue-200/50">
                          Commencer
                        </Button>
                      }
                    />
                 </div>
             </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const InteractiveMockup = () => {
  return (
    <div className="relative w-full max-w-md mx-auto perspective-1000">
      <motion.div
        initial={{ rotateY: 0, rotateX: 0 }}
        whileHover={{ rotateY: 0, rotateX: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative flex flex-col"
      >
        {/* Mockup Header */}
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-red-400"/>
             <div className="h-2 w-2 rounded-full bg-yellow-400"/>
             <div className="h-2 w-2 rounded-full bg-green-400"/>
           </div>
           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mon Dashboard</div>
        </div>

        {/* Mockup Content */}
        <div className="flex-1 p-6 flex flex-col gap-6 relative bg-slate-50/50">
           {/* Date */}
           <div className="flex justify-between items-end">
             <div>
               <div className="text-3xl font-black text-slate-900">Mardi 24</div>
               <div className="text-slate-500 font-medium">Octobre 2024</div>
             </div>
             <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
               <Calendar className="h-6 w-6" />
             </div>
           </div>

           {/* The Value Card */}
           <motion.div 
             whileHover={{ scale: 1.02 }}
             className="bg-white rounded-2xl p-5 shadow-xl shadow-blue-100/50 border border-blue-100 relative group cursor-pointer"
           >
             <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl uppercase tracking-wider">
               Opportunité Chaude
             </div>
             
             <div className="flex items-start gap-4 mb-5 mt-2">
               <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                 <AvatarImage src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2000&auto=format&fit=crop" />
                 <AvatarFallback>JM</AvatarFallback>
               </Avatar>
               <div>
                 <div className="font-black text-slate-900 text-xl leading-tight mb-1">Julien Martin</div>
                 <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Architecte • Bordeaux</div>
                 <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-100">
                    <CheckCircle2 className="h-3 w-3" /> Vérifié fiable
                 </div>
               </div>
             </div>

             <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Pourquoi ce match ?</div>
                <p className="text-sm text-slate-700 leading-snug font-medium">
                  "Julien vient de signer 3 chantiers de rénovation et <strong className="text-slate-900 bg-yellow-100 px-1">cherche un partenaire</strong> pour refaire le branding de ses clients."
                </p>
             </div>

             <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold h-12 rounded-xl shadow-lg shadow-blue-200 group-hover:scale-[1.02] transition-all">
               <Phone className="mr-2 h-4 w-4" /> Il vous appelle entre 12h et 12H30
             </Button>
           </motion.div>

           {/* Quick Stats */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                 <div className="text-xs text-slate-400 font-bold uppercase mb-1">Potentiel</div>
                 <div className="font-black text-slate-900 text-lg">~1500€</div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                 <div className="text-xs text-slate-400 font-bold uppercase mb-1">Réciprocité</div>
                 <div className="font-black text-green-600 text-lg">Élevée</div>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      
      <StickyCTA />

      {/* --- 1. HERO SECTION --- */}
      <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-slate-50">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-block">
                <div className="text-sm font-bold text-slate-500 mt-2">Ne restez plus seul face à votre business.</div>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">5 minutes</span> par jour pour trouver vos prochains clients.
              </h1>
              
              <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
                Arrêtez de prospecter dans le vide. Chaque jour, échangez avec un entrepreneur local et transformez son réseau en opportunités pour vous.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <AuthDialog 
                  mode="signup"
                  trigger={
                    <Button size="lg" className="h-16 px-10 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-full shadow-2xl shadow-blue-300 hover:scale-105 transition-all duration-300 ring-4 ring-blue-50">
                      Commencer maintenant
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  }
                />
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-200/60 max-w-2xl mx-auto">
                <AnimatedCounter value={1200} label="Mises en relation" suffix="+" />
                <AnimatedCounter value={98} label="Satisfaction" suffix="%" />
                <AnimatedCounter value={300} label="Membres Actifs" suffix="+" />
              </div>
            </motion.div>
        </div>
      </section>

      {/* --- 2. PROBLEM SECTION (NEW) --- */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center space-y-8">
                <div className="inline-flex items-center justify-center p-3 bg-red-100 text-red-600 rounded-full mb-4">
                    <Heart className="h-6 w-6" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900">Pourquoi trouver des clients est devenu si difficile aujourd’hui</h2>
                
                <div className="text-lg text-slate-600 leading-relaxed space-y-6">
                    <p>
                        La plupart des entrepreneurs ne manquent pas de compétences. <br/>
                        <strong className="text-slate-900">Ils manquent de visibilité et de réseau.</strong>
                    </p>
                    
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left mx-auto max-w-lg">
                        <p className="font-bold text-slate-900 mb-4">Vous avez peut-être déjà essayé :</p>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-slate-600">
                                <span className="text-red-400 font-bold">×</span> Publier sur LinkedIn , instagram ... sans résultats
                            </li>
                            <li className="flex items-start gap-3 text-slate-600">
                                <span className="text-red-400 font-bold">×</span> Envoyer des messages qui restent sans réponse
                            </li>
                            <li className="flex items-start gap-3 text-slate-600">
                                <span className="text-red-400 font-bold">×</span> Aller à des événements networking inutiles
                            </li>
                        </ul>
                    </div>

                    <p>
                        Le vrai problème est simple : <br/>
                        <span className="bg-yellow-100 px-2 font-bold text-slate-900">👉 Vous essayez de trouver des clients ou d'augmenter votre visibilité seul.</span>
                    </p>
                    <p className="font-medium">Alors que le business fonctionne toujours mieux en réseau.</p>
                </div>
                
                <div className="pt-8">
                   <Button 
                      size="lg" 
                      className="bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-full px-8 h-12"
                      onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      Découvrir la solution <ArrowRight className="ml-2 h-4 w-4" />
                   </Button>
                </div>
            </div>
        </div>
      </section>

      {/* --- 3. METAPHOR SECTION (NEW) --- */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 max-w-5xl text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-8">Imaginez si chaque entrepreneur que vous rencontrez devenait une opportunité</h2>
            
            <p className="text-xl text-slate-300 mb-12">
                Popey fonctionne comme une application de rencontre... <strong className="text-white">Mais pour le business.</strong>
            </p>

            <div className="grid md:grid-cols-4 gap-6 text-left">
                {[
                    { icon: Users, text: "Vous rencontrez un entrepreneur local" },
                    { icon: Coffee, text: "Vous échangez pendant 5 à 10 minutes" },
                    { icon: Zap, text: "Vous découvrez son réseau" },
                    { icon: Star, text: "Il découvre le vôtre" }
                ].map((item, i) => (
                    <div key={i} className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <item.icon className="h-8 w-8 text-blue-400 mb-4" />
                        <p className="font-bold">{item.text}</p>
                    </div>
                ))}
            </div>

            <div className="mt-12 flex flex-col items-center gap-6">
                <div className="inline-block bg-blue-600/20 border border-blue-500/50 rounded-xl px-6 py-3 text-blue-300 font-bold">
                    Et ensemble vous créez des opportunités.
                </div>
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full px-8 h-12 shadow-lg shadow-blue-900/50"
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Je veux essayer <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
      </section>

      {/* --- 3b. NEW CONCRETE EXPLANATION --- */}
      <section className="py-24 bg-slate-950 overflow-hidden relative">
         {/* Background glow effects */}
         <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
         <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

         <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto mb-16 space-y-6">
               <Badge className="bg-white/10 text-white border-white/20 px-4 py-1.5 text-sm font-bold uppercase tracking-widest backdrop-blur-sm shadow-lg">
                 🧠 Comment ça se passe concrètement
               </Badge>
               <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                 Votre opportunité du jour <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">en 3 secondes.</span>
               </h2>
               <p className="text-xl md:text-2xl text-slate-400 leading-relaxed max-w-2xl mx-auto font-medium">
                 Chaque matin, Popey vous propose une nouvelle opportunité business adaptée à votre profil. Découvrez votre match, comprenez son potentiel et passez à l’action immédiatement.
               </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start max-w-6xl mx-auto">
               
               {/* Screen 1 - Mystery */}
               <div className="flex flex-col gap-8 group">
                  <div className="relative transform transition-transform duration-500 group-hover:-translate-y-2">
                     <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[3.5rem] opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-500"></div>
                     <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-4 backdrop-blur-sm relative z-10 shadow-2xl">
                        <div className="scale-[0.85] origin-top">
                            <MysteryCardPreview />
                        </div>
                     </div>
                  </div>
                  <div className="space-y-4 text-center lg:text-left px-4">
                     <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <span className="font-black text-xl">1</span>
                     </div>
                     <h3 className="text-2xl font-black text-white">Découvrez votre match du jour</h3>
                     <p className="text-slate-400 text-lg leading-relaxed font-medium">
                        Popey détecte automatiquement l’entrepreneur le plus pertinent pour vous. <br className="hidden md:block" />
                        Avant même de révéler son identité, vous voyez le potentiel business, la compatibilité et ce que cette rencontre peut vous apporter.
                     </p>
                  </div>
               </div>

               {/* Screen 2 - Action */}
               <div className="flex flex-col gap-8 group mt-12 lg:mt-0">
                  <div className="relative transform transition-transform duration-500 group-hover:-translate-y-2">
                     <div className="absolute -inset-4 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-[3.5rem] opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-500"></div>
                     <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-4 backdrop-blur-sm relative z-10 shadow-2xl">
                        <div className="scale-[0.85] origin-top">
                            <MatchCardPreview />
                        </div>
                     </div>
                  </div>
                  <div className="space-y-4 text-center lg:text-left px-4">
                     <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <span className="font-black text-xl">2</span>
                     </div>
                     <h3 className="text-2xl font-black text-white">Passez à l’action en un clic</h3>
                     <p className="text-slate-400 text-lg leading-relaxed font-medium">
                        Le profil est révélé avec les informations essentielles et un créneau d’appel. <br className="hidden md:block" />
                        Échangez 5 minutes, partagez vos réseaux et créez de nouvelles opportunités.
                     </p>
                  </div>
               </div>

            </div>

            <div className="mt-20 text-center">
               <AuthDialog 
                 mode="signup"
                 trigger={
                   <Button 
                     size="lg" 
                     className="bg-white text-slate-900 hover:bg-slate-200 hover:text-blue-900 font-black rounded-full px-12 h-20 text-xl shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all hover:scale-105 hover:shadow-[0_0_80px_rgba(255,255,255,0.4)] ring-4 ring-white/10"
                   >
                     👉 Découvrir mon premier match
                   </Button>
                 }
               />
            </div>
         </div>
      </section>

      {/* --- 4. HOW IT WORKS --- */}
      <section className="py-24 bg-slate-50">
         <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
               <span className="text-blue-600 font-bold tracking-widest uppercase text-sm mb-2 block">Fonctionnement</span>
               <h2 className="text-3xl md:text-5xl font-black mb-6 text-slate-900">Voici concrètement ce qui se passe quand vous rejoignez Popey</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative max-w-6xl mx-auto mb-12">
               {/* Step 1 */}
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.5 }}
                 className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all"
               >
                  <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                     <Calendar className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-black mb-4 text-slate-900">1. Le Match</h3>
                  <p className="text-slate-600 leading-relaxed">
                     Chaque matin, notre algorithme vous trouve <strong className="text-slate-900">le meilleur partenaire</strong> pour échanger. Pas de recherche, pas de friction.
                  </p>
               </motion.div>

               {/* Step 2 */}
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.5, delay: 0.1 }}
                 className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all"
               >
                  <div className="h-16 w-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                     <Phone className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-black mb-4 text-slate-900">2. L'Appel</h3>
                  <p className="text-slate-600 leading-relaxed">
                     5 à 10 minutes pour échanger. Présentez-vous, partagez vos défis, offrez de l'aide et obtenez la sienne. <strong className="text-slate-900">Court, efficace, humain.</strong>
                  </p>
               </motion.div>

               {/* Step 3 */}
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.5, delay: 0.2 }}
                 className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all"
               >
                  <div className="h-16 w-16 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-6">
                     <TrendingUp className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-black mb-4 text-slate-900">3. L'Opportunité d'un appel de 5 minutes</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                     Vous décidez ensemble à chaque appel ce que vous pouvez vous offrir mutuellement :<br/><br/>
                     <span className="block mb-1">• Des clients (+10 pts)</span>
                     <span className="block mb-1">• Mise en relation (+8 pts)</span>
                     <span className="block mb-1">• Partage de réseau (+6 pts)</span>
                     <span className="block mb-1">• Recommandation (+5 pts)</span>
                     <span className="block mb-1">• Échange de services (+5 pts)</span>
                     <span className="block mb-1">• Synergies (+3 pts)</span>
                     <span className="block mb-1">• Engagement Social (+3 pts)</span>
                     <span className="block mb-1">• Faire un Live ensemble (+7 pts)</span>
                     <span className="block mb-1">• Partager un Post (+4 pts)</span>
                     <span className="block mb-1 text-slate-400 italic">etc...</span>
                  </p>
               </motion.div>
            </div>
            
            <div className="flex justify-center">
                <Button 
                   size="lg" 
                   className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full px-8 h-12 shadow-lg shadow-blue-200"
                   onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Je veux mes 5 minutes <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
         </div>
      </section>

      {/* --- 5. DASHBOARD / MOCKUP SECTION --- */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-black text-slate-900 mb-12">Votre tableau de bord quotidien</h2>
            <InteractiveMockup />
            
            <div className="mt-12">
               <Button 
                  size="lg" 
                  className="bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-full px-8 h-12"
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
               >
                 Voir mon tableau de bord <ArrowRight className="ml-2 h-4 w-4" />
               </Button>
            </div>
        </div>
      </section>

      {/* --- 6. TRUST SCORE & RECIPROCITY --- */}
      <section className="py-24 bg-slate-50">
         <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
               <motion.div
                 initial={{ opacity: 0, x: -50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.8 }}
               >
                  <div className="relative">
                     {/* Big Animated Circle */}
                     <div className="relative h-80 w-80 mx-auto lg:mx-0">
                        <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 100 100">
                           <circle className="text-slate-200 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                           <motion.circle 
                             initial={{ pathLength: 0 }}
                             whileInView={{ pathLength: 0.92 }}
                             transition={{ duration: 2, ease: "easeOut" }}
                             className="text-blue-600 stroke-current" 
                             strokeWidth="8" 
                             strokeLinecap="round" 
                             cx="50" cy="50" r="40" 
                             fill="transparent"
                           ></motion.circle>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-6xl font-black text-slate-900">4.6</span>
                           <div className="flex gap-1 mt-2">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} className={cn("h-4 w-4", i <= 4 ? "text-orange-400 fill-orange-400" : "text-slate-300")} />
                              ))}
                           </div>
                           <span className="text-sm font-bold text-slate-400 uppercase mt-2">Score de Confiance</span>
                        </div>
                     </div>
                  </div>
               </motion.div>

               <motion.div
                 initial={{ opacity: 0, x: 50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.8 }}
                 className="space-y-8"
               >
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                     Votre réputation est votre <span className="text-blue-600">actif le plus précieux.</span>
                  </h2>
                  <p className="text-xl text-slate-600 leading-relaxed">
                     Fini les "je te rappelle" qui n'arrivent jamais. Sur Mon Réseau Local, tout est mesuré.
                  </p>

                  <div className="space-y-6">
                     <div className="flex gap-4">
                        <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                           <Clock className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                           <h4 className="text-xl font-bold text-slate-900">La Règle des 30 Jours</h4>
                           <p className="text-slate-500">Si vous recevez une opportunité, vous avez 30 jours pour rendre la pareille. Sinon, votre score baisse.</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                           <ShieldCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                           <h4 className="text-xl font-bold text-slate-900">Transparence Totale</h4>
                           <p className="text-slate-500">Le score de confiance est visible par tous. Les membres fiables attirent les meilleures opportunités.</p>
                        </div>
                     </div>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full px-8 h-12 shadow-lg shadow-blue-200"
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Augmenter mon score <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
               </motion.div>
            </div>
         </div>
      </section>

      {/* --- 7. PROMISE & IMPACT SECTION (MERGED) --- */}
      <section className="py-24 bg-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div>
        
        <div className="container mx-auto px-4 relative z-10">
           <div className="text-center mb-16 max-w-3xl mx-auto">
              <Badge className="bg-blue-800 text-blue-200 border-0 mb-6 uppercase tracking-widest px-3 py-1">Impact Réel</Badge>
              <h2 className="text-3xl md:text-5xl font-black mb-6">Ce que vous pouvez réellement obtenir</h2>
              <p className="text-blue-200 text-xl">Après 30 jours d'utilisation, la majorité des membres obtiennent :</p>
           </div>

           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {[
                    { val: "20-40", txt: "Nouveaux contacts qualifiés" },
                    { val: "3+", txt: "Recommandations ciblées" },
                    { val: "1", txt: "Opportunité business concrète" },
                    { val: "100%", txt: "Visibilité locale" }
                ].map((stat, i) => (
                    <div key={i} className="bg-blue-800/30 border border-blue-700 rounded-2xl p-6 text-center">
                        <div className="text-4xl font-black text-white mb-2">{stat.val}</div>
                        <div className="text-blue-200 font-medium">{stat.txt}</div>
                    </div>
                ))}
           </div>

           <div className="bg-blue-800/50 rounded-3xl p-8 md:p-12 border border-blue-700/50 max-w-4xl mx-auto text-center">
              <h3 className="text-2xl font-bold mb-4">Après 3 mois ?</h3>
              <p className="text-lg text-blue-100 mb-8">
                 Jusqu’à 60 entrepreneurs rencontrés, un flux régulier d’opportunités et une augmentation moyenne du chiffre d’affaires.
              </p>
              <div className="flex flex-col items-center gap-6">
                  <div className="inline-block bg-white text-blue-900 font-bold px-6 py-3 rounded-full shadow-lg">
                     Votre réseau devient votre principal moteur de croissance.
                  </div>
                  <Button 
                    size="lg" 
                    className="bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-full px-8 h-12 shadow-lg shadow-blue-900/50"
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Je veux ces résultats <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
              </div>
           </div>
        </div>
      </section>

      {/* --- 8. TESTIMONIALS --- */}
      <section className="py-24 bg-white">
         <div className="container mx-auto px-4">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Ils ont arrêté de prospecter dans le vide</h2>
               <p className="text-slate-500 text-lg">Des résultats concrets, pas juste des discussions.</p>
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
                    className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-shadow relative"
                  >
                     <div className="absolute top-8 right-8 text-blue-100"><MessageCircle className="h-8 w-8" /></div>
                     <div className="flex items-center gap-4 mb-6">
                        <Avatar className="h-14 w-14 border-2 border-slate-100">
                           <AvatarImage src={item.img} className="object-cover" />
                           <AvatarFallback>{item.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                           <div className="font-bold text-slate-900 text-lg">{item.name}</div>
                           <div className="text-xs text-slate-500 font-bold uppercase">{item.role}</div>
                        </div>
                     </div>
                     <p className="text-slate-600 leading-relaxed italic">"{item.text}"</p>
                  </motion.div>
               ))}
            </div>

            <div className="flex justify-center">
                <Button 
                   size="lg" 
                   className="bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-full px-8 h-12"
                   onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Rejoindre la communauté <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
         </div>
      </section>

      {/* --- 9. FOUNDER STORY (REDESIGNED) --- */}
      <section className="py-24 bg-white border-y border-slate-100 relative overflow-hidden">
        <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-slate-50 rounded-[3rem] p-8 md:p-12 lg:p-16 border border-slate-200 relative overflow-hidden shadow-xl shadow-slate-100/50">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 bg-blue-100/40 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 bg-purple-100/40 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-sm mb-6 border border-slate-100">
                            <Anchor className="h-8 w-8 text-blue-600" />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">Pourquoi Popey ?</h2>
                        <div className="h-1 w-20 bg-blue-600 rounded-full"></div>
                    </div>
                    
                    <div className="space-y-10 text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
                        <div className="text-center">
                            <p className="mb-2">Pendant des années, nous avons observé la même chose :</p>
                            <p className="text-2xl font-bold text-slate-900">Des entrepreneurs compétents... <span className="text-blue-600">Mais isolés.</span></p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex gap-4 items-center hover:shadow-md transition-shadow">
                                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                    <span className="text-red-500 font-bold text-xl">×</span>
                                </div>
                                <p className="font-medium text-slate-700">Certains avaient du talent mais <strong className="text-slate-900">pas de clients.</strong></p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex gap-4 items-center hover:shadow-md transition-shadow">
                                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                    <span className="text-red-500 font-bold text-xl">×</span>
                                </div>
                                <p className="font-medium text-slate-700">D’autres avaient des clients mais <strong className="text-slate-900">pas de réseau.</strong></p>
                            </div>
                        </div>

                        <div className="bg-slate-900 text-white p-8 md:p-10 rounded-3xl shadow-2xl shadow-slate-300 transform md:scale-105 transition-transform duration-300 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/20 transition-colors"></div>
                            <div className="relative z-10 text-center">
                                <p className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-3">La Réalité</p>
                                <p className="text-xl md:text-2xl font-serif italic leading-relaxed">
                                    "Le succès ne dépend pas seulement de ce que vous savez faire.<br className="hidden md:block"/> Il dépend surtout de <span className="text-blue-400 font-bold not-italic">qui vous connaissez</span>."
                                </p>
                            </div>
                        </div>

                        <div className="text-center pt-4">
                            <p className="font-bold text-slate-900 mb-6">Nous avons créé un système pour rendre l’entraide :</p>
                            <div className="flex flex-wrap justify-center gap-3">
                                {[
                                    { text: "Simple", icon: CheckCircle2 },
                                    { text: "Quotidienne", icon: Calendar },
                                    { text: "Naturelle", icon: Heart },
                                    { text: "Mesurable", icon: TrendingUp }
                                ].map((item, i) => (
                                    <Badge key={i} variant="secondary" className="pl-2 pr-4 py-2 text-sm bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-blue-50 transition-colors gap-2">
                                        <item.icon className="h-4 w-4 text-blue-600" />
                                        {item.text}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        
                        <div className="text-center pt-8">
                             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Notre Solution</p>
                             <p className="text-4xl font-black text-slate-900 mb-8">C’est devenu Popey.</p>
                             <Button 
                                size="lg" 
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full px-8 h-12 shadow-lg shadow-blue-200"
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

      {/* --- 10. FAQ / OBJECTIONS (NEW) --- */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-black text-slate-900 text-center mb-12">Questions fréquentes</h2>
            
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-0">
                    <AccordionTrigger className="text-lg font-bold text-slate-900">À qui ce service s'adresse ?</AccordionTrigger>
                    <AccordionContent className="text-slate-600 text-base">
                        Entrepreneurs, freelances, auto-entrepreneurs, coachs... toutes personnes qui cherchent à développer leurs réseaux humains et/ou sociaux, qui cherchent de nouveaux clients, opportunités.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-lg font-bold text-slate-900">Je n’ai pas le temps</AccordionTrigger>
                    <AccordionContent className="text-slate-600 text-base">
                        Les échanges durent seulement 5 à 10 minutes. Beaucoup de membres les font entre deux rendez-vous ou à la pause café. C'est conçu pour être ultra-efficace.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger className="text-lg font-bold text-slate-900">Et si les membres ne sont pas sérieux ?</AccordionTrigger>
                    <AccordionContent className="text-slate-600 text-base">
                        Le score de confiance rend chaque interaction transparente. Les membres fiables reçoivent plus d’opportunités, les autres sont naturellement filtrés.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger className="text-lg font-bold text-slate-900">Mon activité est spécifique</AccordionTrigger>
                    <AccordionContent className="text-slate-600 text-base">
                        Justement. Plus votre activité est spécifique, plus un réseau humain est efficace pour vous recommander aux bonnes personnes.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                    <AccordionTrigger className="text-lg font-bold text-slate-900">Et si je ne reçois rien ?</AccordionTrigger>
                    <AccordionContent className="text-slate-600 text-base">
                        Le système repose sur la réciprocité : plus vous aidez, plus vous recevez. Nous vous garantissons des rencontres, c'est à vous de créer le lien.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
      </section>

      {/* --- 11. ZERO CONSTRAINT (MOVED) --- */}
      <section className="py-16 bg-green-50/50 border-t border-green-100">
        <div className="container mx-auto px-4 max-w-4xl text-center">
            <Badge className="bg-green-100 text-green-700 border-green-200 mb-4 px-3 py-1 font-bold uppercase tracking-wider">Liberté Totale</Badge>
            <h2 className="text-3xl font-black text-slate-900 mb-6">Zéro pression. Zéro contrainte.</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center text-left">
                <div>
                    <p className="text-lg text-slate-700 mb-4 font-medium">Vous gardez toujours le contrôle :</p>
                    <ul className="space-y-3">
                       <li className="flex items-center gap-3 font-medium text-slate-700">
                          <CheckCircle2 className="h-5 w-5 text-green-600" /> Choisissez votre rythme
                       </li>
                       <li className="flex items-center gap-3 font-medium text-slate-700">
                          <CheckCircle2 className="h-5 w-5 text-green-600" /> Reportez quand vous voulez
                       </li>
                       <li className="flex items-center gap-3 font-medium text-slate-700">
                          <CheckCircle2 className="h-5 w-5 text-green-600" /> Faites une pause à tout moment
                       </li>
                       <li className="flex items-center gap-3 font-medium text-slate-700">
                          <CheckCircle2 className="h-5 w-5 text-green-600" /> Aucun engagement
                       </li>
                    </ul>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
                    <p className="text-slate-600 italic">"Votre réseau doit rester un plaisir, pas une obligation. C'est pour ça que vous pouvez annuler ou pauser votre abonnement en 1 clic."</p>
                </div>
            </div>
        </div>
      </section>

      {/* --- 12. VISION (NEW) --- */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl font-black text-slate-900 mb-6">Imaginez votre activité dans 6 mois</h2>
            <div className="space-y-4 text-xl text-slate-600">
                <p>Un téléphone qui sonne.</p>
                <p>Des recommandations régulières.</p>
                <p>Des partenaires qui pensent à vous.</p>
            </div>
            <div className="flex justify-center gap-4 mt-8 font-bold text-slate-900">
                <span className="flex items-center gap-2"><CheckCircle2 className="text-blue-600 h-5 w-5"/> Moins de stress</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="text-blue-600 h-5 w-5"/> Plus de stabilité</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="text-blue-600 h-5 w-5"/> Plus de plaisir</span>
            </div>
            <p className="mt-8 text-2xl font-black text-blue-600">C’est la puissance d’un réseau actif.</p>
        </div>
      </section>

      {/* --- 13. PRICING & FINAL CTA --- */}
      <section id="pricing" className="py-24 bg-white relative overflow-hidden border-t border-slate-100">
         <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto bg-slate-900 rounded-[3rem] p-8 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
               {/* Background Effects */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-30"></div>
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-30"></div>
               
               <h2 className="text-4xl md:text-5xl font-black mb-6 relative z-10">
                  Votre réseau commence <span className="text-blue-400">aujourd’hui.</span>
               </h2>
               
               <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-lg mx-auto mb-8 border border-white/10 mt-12 text-left">
                  <div className="text-center mb-8">
                      <div className="inline-block bg-blue-500/20 text-blue-300 border border-blue-500/30 px-6 py-2 rounded-full text-base font-bold uppercase tracking-widest mb-4">
                          Essai gratuit
                      </div>
                      <div className="text-3xl md:text-4xl font-black mb-2 leading-tight">1 jour = 1 opportunité concrète</div>
                      <p className="text-slate-300 text-base md:text-lg mt-4 font-medium">
                          Découvre immédiatement une opportunité réelle pour ton business et teste Popey Academy sans aucun risque.
                      </p>
                  </div>

                  <ul className="space-y-4 mb-8">
                     <li className="flex items-start gap-3 text-base md:text-lg">
                        <CheckCircle2 className="h-6 w-6 text-green-400 shrink-0" /> 
                        <span className="font-bold">1 opportunité garantie dès aujourd’hui</span>
                     </li>
                     <li className="flex items-start gap-3 text-base md:text-lg">
                        <CheckCircle2 className="h-6 w-6 text-green-400 shrink-0" /> 
                        <span>Accès complet au dashboard et à tous les outils</span>
                     </li>
                     <li className="flex items-start gap-3 text-base md:text-lg">
                        <CheckCircle2 className="h-6 w-6 text-green-400 shrink-0" /> 
                        <span>Score de confiance pour chaque profil, pour des mises en relation fiables</span>
                     </li>
                     <li className="flex items-start gap-3 text-base md:text-lg">
                        <CheckCircle2 className="h-6 w-6 text-green-400 shrink-0" /> 
                        <span>Autonomie et contrôle total sur ton réseau</span>
                     </li>
                  </ul>
                  
                  <AuthDialog 
                    mode="signup"
                    trigger={
                      <Button className="w-full h-16 bg-white text-slate-900 hover:bg-slate-100 font-black rounded-xl text-xl shadow-xl shadow-white/10 transition-transform hover:scale-[1.02]">
                        Commencer mon essai gratuit
                      </Button>
                    }
                  />
                  
                  <div className="text-sm text-slate-400 mt-6 text-center leading-relaxed">
                      Après ce test, l’accès complet devient <span className="text-white font-bold">49 €/mois</span> pour profiter de toutes les opportunités et booster réellement ton réseau.
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white py-12 border-t border-slate-100 text-slate-900">
        <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Anchor className="h-6 w-6 text-blue-600" />
                        <span className="font-black uppercase tracking-widest">Popey Academy</span>
                    </div>
                    <p className="text-sm text-slate-500">
                        La première école qui transforme l'indécision en action.
                        <br/>Force & Honneur.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 uppercase mb-4 text-sm">Programmes</h4>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li><Link href="/emploi" className="hover:text-blue-600">Trouver sa voie</Link></li>
                        <li><Link href="/entrepreneur" className="hover:text-blue-600">Lancer son activité</Link></li>
                        <li><Link href="/mon-reseau-local/connexion" className="hover:text-blue-600">Réseau Local (Connexion)</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 uppercase mb-4 text-sm">Légal</h4>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li><Link href="/legal/mentions" className="hover:text-blue-600">Mentions Légales</Link></li>
                        <li><Link href="/legal/terms" className="hover:text-blue-600">CGV / CGU</Link></li>
                        <li><Link href="/legal/privacy" className="hover:text-blue-600">Politique de Confidentialité</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 uppercase mb-4 text-sm">Contact</h4>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li>hello@popey.academy</li>
                        <li>Paris, France</li>
                        <li className="pt-4"><Link href="/login" className="text-slate-400 hover:text-blue-600 font-bold">Admin / Connexion Email</Link></li>
                    </ul>
                </div>
            </div>
            <div className="pt-8 border-t border-slate-100 text-center">
                <p className="text-slate-400 text-xs">© 2026 Popey Academy. Tous droits réservés.</p>
            </div>
        </div>
      </footer>

    </div>
  );
}
