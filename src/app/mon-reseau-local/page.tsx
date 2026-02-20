"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useInView } from "framer-motion";
import Link from "next/link";
import { 
  Users, Calendar, Phone, CheckCircle2, 
  ArrowRight, ShieldCheck, Zap, Briefcase, 
  Target, TrendingUp, Star, Play, Lock,
  MessageCircle, Clock, Bell, ChevronRight, Anchor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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
    return scrollY.on("change", (latest) => {
      setIsVisible(latest > 600);
    });
  }, [scrollY]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm py-3 px-4"
        >
          <div className="container mx-auto flex items-center justify-between max-w-5xl">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm md:text-base">
              <div className="bg-blue-600 text-white p-1 rounded-md">
                <Users className="h-4 w-4" />
              </div>
              <span className="hidden md:inline">Mon Réseau Local</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-500 hidden md:inline">1€ les 3 premiers jours</span>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full px-6 shadow-lg shadow-blue-200/50">
                Commencer maintenant
              </Button>
            </div>
          </div>
        </motion.div>
      )}
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
               <Phone className="mr-2 h-4 w-4" /> Débloquer l'opportunité (14:00)
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

export default function MonReseauLocalPage() {
  const [activeTab, setActiveTab] = useState(0);

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

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8 text-center lg:text-left"
            >
              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-2 transition-transform hover:scale-105 cursor-default">
                Nouveau : Système de réciprocité garanti
              </Badge>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight">
                L'appel quotidien de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">15 minutes</span> pour créer une opportunité réelle.
              </h1>
              
              <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                Popey Academy : Arrêtez de prospecter dans le vide. Matchez chaque jour avec un entrepreneur local différent et accédez à son réseau pour vos futurs contrats.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                <Button size="lg" className="h-16 px-10 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-full shadow-2xl shadow-blue-300 hover:scale-105 transition-all duration-300 ring-4 ring-blue-50">
                  Commencer maintenant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500 h-16 px-4">
                  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  342 entrepreneurs en ligne
                </div>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-200/60">
                <AnimatedCounter value={450} label="Opportunités" suffix="+" />
                <AnimatedCounter value={98} label="Satisfaction" suffix="%" />
                <AnimatedCounter value={300} label="Membres Actifs" suffix="+" />
              </div>
            </motion.div>

            {/* Right Visual */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative mt-12 lg:mt-0"
            >
               <InteractiveMockup />
            </motion.div>

          </div>
        </div>
      </section>

      {/* --- 2. SCROLLYTELLING SECTION --- */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden">
         <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-20">
               <h2 className="text-3xl md:text-5xl font-black mb-6">Comment ça marche ?</h2>
               <p className="text-slate-400 text-xl">L'antidote à la solitude de l'entrepreneur en 3 étapes.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
               {/* Step 1 */}
               <motion.div 
                 initial={{ opacity: 0, y: 50 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ duration: 0.5 }}
                 className="relative group"
               >
                 <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 h-full hover:bg-slate-750 transition-colors">
                    <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                       <Calendar className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-black mb-4">1. Le Match</h3>
                    <p className="text-slate-400 leading-relaxed">
                       Chaque matin, notre algorithme vous trouve <strong className="text-white">le meilleur partenaire</strong> pour échanger. Pas de recherche, pas de friction.
                    </p>
                    <div className="mt-8 bg-slate-900 rounded-xl p-4 border border-slate-800 opacity-80">
                       <div className="flex items-center gap-3">
                          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"/>
                          <span className="text-xs font-mono text-blue-400">MATCH_FOUND: "Thomas D."</span>
                       </div>
                    </div>
                 </div>
               </motion.div>

               {/* Step 2 */}
               <motion.div 
                 initial={{ opacity: 0, y: 50 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ duration: 0.5, delay: 0.2 }}
                 className="relative group"
               >
                 <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 h-full hover:bg-slate-750 transition-colors">
                    <div className="h-16 w-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                       <Phone className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-black mb-4">2. L'Appel</h3>
                    <p className="text-slate-400 leading-relaxed">
                       15 minutes pour échanger. Présentez-vous, partagez vos défis, offrez de l'aide. <strong className="text-white">Court, efficace, humain.</strong>
                    </p>
                    <div className="mt-8 flex justify-center">
                       <div className="flex -space-x-4">
                          <Avatar className="h-12 w-12 border-4 border-slate-800"><AvatarImage src="https://github.com/shadcn.png" /></Avatar>
                          <Avatar className="h-12 w-12 border-4 border-slate-800"><AvatarImage src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2000&auto=format&fit=crop" /></Avatar>
                       </div>
                    </div>
                 </div>
               </motion.div>

               {/* Step 3 */}
               <motion.div 
                 initial={{ opacity: 0, y: 50 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ duration: 0.5, delay: 0.4 }}
                 className="relative group"
               >
                 <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 h-full hover:bg-slate-750 transition-colors">
                    <div className="h-16 w-16 bg-green-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform duration-300">
                       <TrendingUp className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-black mb-4">3. L'Opportunité</h3>
                    <p className="text-slate-400 leading-relaxed">
                       Une mise en relation ? Un conseil ? Un client ? Notez l'échange et <strong className="text-white">augmentez votre score de confiance.</strong>
                    </p>
                    <div className="mt-8">
                       <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                          <span>Confiance</span>
                          <span className="text-green-400">+12 pts</span>
                       </div>
                       <Progress value={75} className="h-2 bg-slate-700" />
                    </div>
                 </div>
               </motion.div>
            </div>
         </div>
      </section>

      {/* --- 3. TRUST SCORE EXPLANATION --- */}
      <section className="py-24 bg-white">
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
                           <circle className="text-slate-100 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
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
               </motion.div>
            </div>
         </div>
      </section>

      {/* --- 4. RESULTS SECTION (NEW) --- */}
      <section className="py-24 bg-blue-900 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div>
        
        <div className="container mx-auto px-4 relative z-10">
           <div className="text-center mb-16 max-w-3xl mx-auto">
              <Badge className="bg-blue-800 text-blue-200 border-0 mb-6 uppercase tracking-widest px-3 py-1">Impact Réel</Badge>
              <h2 className="text-3xl md:text-5xl font-black mb-6">Après 3 mois chez Popey Academy...</h2>
              <p className="text-blue-200 text-xl">Voici ce qui se passe quand vous activez la puissance du réseau local.</p>
           </div>

           <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: Users, 
                  title: "Un Réseau Solide", 
                  value: "+60", 
                  desc: "Entrepreneurs locaux rencontrés personnellement.",
                  sub: "Fini l'isolement" 
                },
                { 
                  icon: Zap, 
                  title: "Opportunités Qualifiées", 
                  value: "12", 
                  desc: "Mises en relation ciblées reçues en moyenne.",
                  sub: "C'est 4/mois" 
                },
                { 
                  icon: Briefcase, 
                  title: "Chiffre d'Affaires", 
                  value: "+20%", 
                  desc: "D'augmentation moyenne constatée par nos membres.",
                  sub: "ROI immédiat" 
                }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-blue-800/50 backdrop-blur-sm p-8 rounded-3xl border border-blue-700/50 hover:bg-blue-800 transition-colors group"
                >
                   <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <item.icon className="h-7 w-7 text-white" />
                   </div>
                   <div className="text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">{item.value}</div>
                   <h3 className="text-xl font-bold mb-2 text-white">{item.title}</h3>
                   <p className="text-blue-200 mb-4">{item.desc}</p>
                   <div className="inline-block bg-blue-900/50 px-3 py-1 rounded-lg text-xs font-bold text-blue-300 uppercase tracking-wide border border-blue-800">
                      {item.sub}
                   </div>
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* --- 5. TESTIMONIALS / SOCIAL PROOF --- */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
         <div className="container mx-auto px-4">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Ils ont arrêté de prospecter dans le vide</h2>
               <p className="text-slate-500 text-lg">Des résultats concrets, pas juste des discussions.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                    className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-shadow relative"
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
         </div>
      </section>

      {/* --- 6. PRICING & FINAL CTA --- */}
      <section className="py-24 bg-white relative overflow-hidden">
         <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto bg-slate-900 rounded-[3rem] p-8 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
               {/* Background Effects */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-30"></div>
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-30"></div>
               
               <h2 className="text-4xl md:text-5xl font-black mb-6 relative z-10">
                  Votre réseau commence <span className="text-blue-400">aujourd'hui.</span>
               </h2>
               <p className="text-slate-300 text-xl mb-12 max-w-2xl mx-auto relative z-10">
                  Rejoignez les 300+ entrepreneurs qui s'entraident déjà au quotidien.
                  Sans engagement. Annulable en 1 clic.
               </p>

               <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-sm mx-auto mb-12 border border-white/10">
                  <div className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-2">Offre de Lancement</div>
                  <div className="text-5xl font-black mb-2">49€<span className="text-lg text-slate-400 font-medium">/mois</span></div>
                  <div className="text-xs text-slate-400 mb-6">ou essayez 3 jours pour 1€</div>
                  <ul className="text-left space-y-3 mb-8">
                     <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-400" /> 1 Match Garanti / Jour</li>
                     <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-400" /> Accès Dashboard Complet</li>
                     <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-400" /> Score de Confiance</li>
                  </ul>
                  <Button className="w-full h-12 bg-white text-slate-900 hover:bg-slate-100 font-black rounded-xl">
                     Je profite de l'offre
                  </Button>
               </div>

               <p className="text-slate-500 text-sm">Garantie satisfait ou remboursé sous 14 jours.</p>
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
                        <li><Link href="/" className="hover:text-blue-600">Lancer son activité</Link></li>
                        <li><Link href="/mon-reseau-local" className="hover:text-blue-600">Réseau Local</Link></li>
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
                        <li className="flex gap-4 mt-4">
                            {/* Social Icons Placeholder */}
                            <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition-colors cursor-pointer">
                                <span className="font-black text-xs">IN</span>
                            </div>
                            <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition-colors cursor-pointer">
                                <span className="font-black text-xs">IG</span>
                            </div>
                        </li>
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
