"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, Lock, Users, Clock, Star, ArrowRight, CheckCircle2, 
  HelpCircle, MapPin, Calendar, Menu, X, Play, ShieldCheck,
  Upload, UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Components for the sections

const FadeIn = ({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.8, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const Section = ({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) => (
  <section id={id} className={cn("py-24 md:py-32 relative overflow-hidden", className)}>
    {children}
  </section>
);

export default function BlindDatePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const sessions = [
    { city: "Dax", date: "Prochaine Session", status: "Ouvert", color: "text-green-500", active: true },
    { city: "Mont de Marsan", date: "Prochaine Session", status: "Complet", color: "text-red-500", active: false },
    { city: "Bayonne", date: "Prochaine Session", status: "Ouvert", color: "text-green-500", active: true },
    { city: "Pau", date: "Prochaine Session", status: "Complet", color: "text-red-500", active: false }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-pink-500 selection:text-white overflow-x-hidden">
      
      {/* PRE-REGISTRATION MODAL */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setSelectedSession(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative overflow-hidden"
            >
                <button 
                    onClick={() => setSelectedSession(null)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X />
                </button>

                <div className="text-center mb-8">
                    <Badge className="bg-pink-500/10 text-pink-500 border-0 mb-4 uppercase tracking-widest">Pré-inscription</Badge>
                    <h3 className="text-2xl font-black uppercase italic text-white mb-2">Session {selectedSession}</h3>
                    <p className="text-slate-400 text-sm">Remplissez ce formulaire pour valider votre intérêt.</p>
                </div>

                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Pré-inscription validée !"); setSelectedSession(null); }}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstname" className="text-xs uppercase font-bold text-slate-500">Prénom</Label>
                            <Input id="firstname" placeholder="Ex: Thomas" className="bg-slate-950 border-slate-800 text-white focus:ring-pink-500" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="age" className="text-xs uppercase font-bold text-slate-500">Age</Label>
                            <Input id="age" type="number" placeholder="28" className="bg-slate-950 border-slate-800 text-white focus:ring-pink-500" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-slate-500">Sexe</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-pink-500/50 transition-colors [&:has(input:checked)]:border-pink-500 [&:has(input:checked)]:bg-pink-500/10">
                                <input type="radio" name="gender" value="homme" className="hidden" required />
                                <span className="font-bold text-sm">Homme</span>
                            </label>
                            <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-pink-500/50 transition-colors [&:has(input:checked)]:border-pink-500 [&:has(input:checked)]:bg-pink-500/10">
                                <input type="radio" name="gender" value="femme" className="hidden" required />
                                <span className="font-bold text-sm">Femme</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                         <Label className="text-xs uppercase font-bold text-slate-500">Je souhaite rencontrer</Label>
                         <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-pink-500/50 transition-colors [&:has(input:checked)]:border-pink-500 [&:has(input:checked)]:bg-pink-500/10">
                                <input type="radio" name="preference" value="homme" className="hidden" required />
                                <span className="font-bold text-sm">Des Hommes</span>
                            </label>
                            <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-pink-500/50 transition-colors [&:has(input:checked)]:border-pink-500 [&:has(input:checked)]:bg-pink-500/10">
                                <input type="radio" name="preference" value="femme" className="hidden" required />
                                <span className="font-bold text-sm">Des Femmes</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs uppercase font-bold text-slate-500">Téléphone</Label>
                        <Input id="phone" type="tel" placeholder="06 12 34 56 78" className="bg-slate-950 border-slate-800 text-white focus:ring-pink-500" required />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-slate-500">Photo (Visible uniquement par l'équipe)</Label>
                        <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:border-slate-600 hover:text-slate-400 transition-colors cursor-pointer bg-slate-950">
                            <Upload className="h-8 w-8 mb-2" />
                            <span className="text-xs font-bold uppercase">Cliquez pour ajouter une photo</span>
                            <input type="file" className="hidden" accept="image/*" />
                        </div>
                    </div>

                    <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black uppercase tracking-widest h-14 rounded-xl mt-4">
                        Valider ma pré-inscription
                    </Button>
                </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BACKGROUND GRADIENTS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-900/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[60%] h-[60%] bg-orange-900/10 rounded-full blur-[100px]" />
      </div>

      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-black text-2xl tracking-tighter uppercase italic bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 bg-clip-text text-transparent">
            Blind Date
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400 uppercase tracking-widest">
            <a href="#concept" className="hover:text-white transition-colors">Concept</a>
            <a href="#temoignages" className="hover:text-white transition-colors">Témoignages</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <Button className="bg-white text-slate-950 hover:bg-slate-200 rounded-full font-bold px-6">
              Réserver
            </Button>
          </nav>

          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-slate-950 pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6 text-xl font-bold uppercase tracking-widest text-center">
              <a href="#concept" onClick={() => setIsMenuOpen(false)}>Concept</a>
              <a href="#temoignages" onClick={() => setIsMenuOpen(false)}>Témoignages</a>
              <a href="#faq" onClick={() => setIsMenuOpen(false)}>FAQ</a>
              <Button className="bg-white text-slate-950 hover:bg-slate-200 rounded-full w-full py-6 mt-4">
                Réserver ma place
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10">
        
        {/* 1. HERO SECTION */}
        <section className="relative min-h-screen flex items-center justify-center pt-20">
            {/* Image de fond sombre et mystérieuse */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950 z-10" />
                {/* Simulation d'une ambiance urbaine nocturne */}
                <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-30 blur-sm" />
            </div>

            <div className="container mx-auto px-4 relative z-20 text-center">
                <FadeIn>
                    <Badge variant="outline" className="border-pink-500/50 text-pink-400 uppercase tracking-[0.2em] mb-8 px-4 py-2 bg-pink-500/5 backdrop-blur-sm">
                        Expérience de Rencontre Immersive
                    </Badge>
                    
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase italic tracking-tighter leading-[0.9] mb-8 text-white">
                        Osez rencontrer<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500">
                            Sans Voir
                        </span>
                    </h1>
                </FadeIn>

                <FadeIn delay={0.2}>
                    <p className="text-xl md:text-2xl text-slate-300 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
                        <span className="text-white font-medium">4 rencontres. 15 minutes chacune.</span><br />
                        Une heure qui pourrait tout changer.
                    </p>
                </FadeIn>

                <FadeIn delay={0.4}>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12">
                        <Button size="lg" className="h-14 px-8 rounded-full bg-white text-slate-950 hover:bg-slate-200 font-black uppercase tracking-widest text-sm md:text-base shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105">
                            Réserver ma place
                        </Button>
                        <Button variant="outline" size="lg" className="h-14 px-8 rounded-full border-slate-700 text-slate-300 hover:bg-slate-900 hover:text-white font-bold uppercase tracking-widest text-sm md:text-base backdrop-blur-sm">
                            <Play className="mr-2 h-4 w-4" /> Voir le concept
                        </Button>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-xs md:text-sm font-medium text-slate-400 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                            <span>4.9/5 Avis Clients</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-pink-500" />
                            <span>2400+ Participants</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-purple-500" />
                            <span>100% Sécurisé</span>
                        </div>
                    </div>
                </FadeIn>
            </div>

            {/* Scroll Indicator */}
            <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500"
            >
                <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-slate-500 to-transparent" />
            </motion.div>
        </section>

        {/* 2. SECTION CONCEPT */}
        <Section id="concept" className="bg-slate-950">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic mb-6">
                        Une expérience simple.<br />
                        <span className="text-purple-500">Une connexion réelle.</span>
                    </h2>
                    <p className="text-slate-400 text-lg">Oubliez les swipes. Retrouvez l'essentiel.</p>
                </div>

                <div className="grid md:grid-cols-4 gap-8">
                    {[
                        { step: "01", title: "Entrez dans la cabine", desc: "Un espace confortable et intime, conçu pour l'échange sans contact visuel.", icon: Lock },
                        { step: "02", title: "Discutez 15 min", desc: "Juste la voix, la personnalité, les émotions. Sans préjugés physiques.", icon: Users },
                        { step: "03", title: "Rencontrez 4 personnes", desc: "Quatre opportunités uniques de créer une connexion authentique en une heure.", icon: Heart },
                        { step: "04", title: "Le Choix Final", desc: "Si le désir est réciproque, nous vous mettons en contact le lendemain.", icon: CheckCircle2 }
                    ].map((item, i) => (
                        <FadeIn key={i} delay={i * 0.1}>
                            <div className="group relative p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-pink-500/30 transition-all hover:bg-slate-900">
                                <div className="absolute -top-6 left-8 text-6xl font-black text-slate-800 group-hover:text-pink-900/50 transition-colors select-none">
                                    {item.step}
                                </div>
                                <div className="relative z-10">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-pink-900/20 group-hover:scale-110 transition-transform">
                                        <item.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold uppercase mb-3 text-white">{item.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </Section>

        {/* 3. SECTION ÉMOTION / DIFFÉRENCIATION */}
        <Section className="bg-slate-900">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <FadeIn className="order-2 md:order-1 relative">
                         {/* Abstract Visual Representation */}
                         <div className="aspect-square rounded-3xl overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 mix-blend-overlay z-10" />
                            <img 
                                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=2459&auto=format&fit=crop" 
                                alt="Happy Couple Authentic Connection" 
                                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-950 to-transparent z-20">
                                <div className="text-white font-bold text-lg">"On a parlé pendant des heures après..."</div>
                            </div>
                         </div>
                    </FadeIn>
                    
                    <FadeIn delay={0.2} className="order-1 md:order-2">
                        <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-0 mb-6 uppercase tracking-widest px-4 py-2">Le Problème</Badge>
                        <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-8 leading-tight">
                            Et si la vraie connexion commençait<br />
                            <span className="text-orange-500">Sans le regard ?</span>
                        </h2>
                        <div className="space-y-6 text-lg text-slate-300">
                            <p>
                                Aujourd’hui, tout va trop vite. On juge en 0.5 seconde sur une photo filtrée. 
                                On "swipe" des humains comme des produits. On a oublié d'écouter.
                            </p>
                            <p className="font-bold text-white border-l-4 border-pink-500 pl-6 py-2">
                                BLIND DATE change les règles. Ici, vous découvrez quelqu’un pour son énergie, sa voix, son humour. Pas pour son apparence.
                            </p>
                            <p>
                                Juste une rencontre. Réelle. Organique. Magique.
                            </p>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </Section>

        {/* 4. SECTION PREUVE SOCIALE */}
        <Section id="temoignages">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black uppercase italic mb-4">Ils ont osé l'expérience</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { name: "Camille, 32 ans", quote: "Je ne pensais pas que parler sans voir pouvait créer autant de connexion. C'est troublant et génial.", rating: 5 },
                        { name: "Julien, 28 ans", quote: "Beaucoup plus naturel que les applications. On écoute vraiment l'autre, sans la pression du physique.", rating: 5 },
                        { name: "Sarah, 35 ans", quote: "Une expérience surprenante... et j’ai rencontré quelqu’un. On ne s'est plus quittés.", rating: 5 }
                    ].map((t, i) => (
                        <FadeIn key={i} delay={i * 0.1}>
                            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 relative">
                                <div className="flex gap-1 mb-4">
                                    {[...Array(t.rating)].map((_, j) => (
                                        <Star key={j} className="h-4 w-4 text-orange-500 fill-orange-500" />
                                    ))}
                                </div>
                                <p className="text-slate-300 italic mb-6 leading-relaxed">"{t.quote}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-sm border border-slate-700">
                                        {t.name.charAt(0)}
                                    </div>
                                    <div className="text-sm font-bold text-white uppercase tracking-wider">{t.name}</div>
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </Section>

        {/* 5. SECTION SÉCURITÉ */}
        <Section className="bg-slate-900/50">
            <div className="container mx-auto px-4 max-w-4xl text-center">
                <ShieldCheck className="h-16 w-16 text-purple-500 mx-auto mb-8" />
                <h2 className="text-3xl font-black uppercase italic mb-8">Votre sécurité, notre priorité</h2>
                
                <div className="grid md:grid-cols-2 gap-4 text-left">
                    {[
                        "Aucun contact partagé sans choix mutuel",
                        "Cabines privées et confortables",
                        "Équipe présente sur place en permanence",
                        "Participants vérifiés (ID Check)",
                        "Environnement bienveillant garanti",
                        "Expérience respectueuse et encadrée"
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                            <span className="text-slate-300 font-medium">{item}</span>
                        </div>
                    ))}
                </div>
            </div>
        </Section>

        {/* 6. SECTION RARETÉ / VILLES */}
        <Section>
            <div className="container mx-auto px-4">
                <div className="bg-gradient-to-r from-pink-900/50 to-purple-900/50 rounded-3xl p-8 md:p-12 border border-pink-500/20 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/20 rounded-full blur-[80px]" />
                    
                    <Badge className="bg-red-500 text-white hover:bg-red-600 border-0 mb-6 uppercase tracking-widest px-3 py-1 animate-pulse">
                        Places très limitées
                    </Badge>
                    
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic mb-6 text-white">
                        Prochaines Sessions
                    </h2>
                    
                    <p className="text-slate-300 mb-10 max-w-2xl mx-auto">
                        Pour garantir la qualité de l'expérience, nous limitons chaque session à 20 participants par ville.
                    </p>

                    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {sessions.map((session, i) => (
                            <div 
                                key={i} 
                                onClick={() => session.active && setSelectedSession(session.city)}
                                className={cn(
                                    "bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center transition-colors group relative overflow-hidden",
                                    session.active ? "cursor-pointer hover:border-pink-500/50 hover:bg-slate-900" : "opacity-75 cursor-not-allowed border-slate-900"
                                )}
                            >
                                {session.active && (
                                    <div className="absolute top-0 right-0 p-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    </div>
                                )}
                                <MapPin className={cn("h-6 w-6 mb-3 transition-colors", session.active ? "text-slate-500 group-hover:text-pink-500" : "text-slate-700")} />
                                <div className="text-xl font-black uppercase mb-1">{session.city}</div>
                                <div className="text-sm text-slate-400 mb-4">{session.date}</div>
                                <div className={`text-xs font-bold uppercase tracking-widest ${session.color}`}>
                                    {session.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Section>

        {/* 7. SECTION TARIF */}
        <Section className="bg-slate-950">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-4xl font-black uppercase italic mb-4">L'Expérience Complète</h2>
                <p className="text-slate-400 mb-8">Une heure. Quatre rencontres. Une vraie possibilité.</p>
                <div className="bg-pink-900/30 border border-pink-500/30 p-4 rounded-xl inline-block mb-12 max-w-2xl mx-auto">
                    <p className="text-pink-200 font-bold text-lg md:text-xl uppercase">
                        Vous ne payez que si vous êtes sélectionné après la pré-inscription.
                    </p>
                </div>

                <div className="bg-white text-slate-950 max-w-md mx-auto rounded-3xl p-10 relative shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-slate-700">
                        Tout inclus
                    </div>
                    
                    <div className="text-6xl font-black mb-2 tracking-tighter">39€</div>
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-8">Par participant</div>
                    
                    <ul className="space-y-4 text-left mb-10">
                        {[
                            "4 rencontres de 15 minutes",
                            "Boisson d'accueil incluse",
                            "Accès à l'espace lounge",
                            "Mise en relation garantie si match",
                            "Aucun frais caché"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <div className="h-5 w-5 rounded-full bg-slate-950 text-white flex items-center justify-center text-[10px]"><CheckCircle2 className="h-3 w-3" /></div>
                                <span className="font-medium">{item}</span>
                            </li>
                        ))}
                    </ul>

                    <Button size="lg" className="w-full h-14 bg-slate-950 text-white hover:bg-slate-800 rounded-full font-black uppercase tracking-widest shadow-xl">
                        Je réserve ma session
                    </Button>
                </div>
            </div>
        </Section>

        {/* 8. FAQ */}
        <Section id="faq">
            <div className="container mx-auto px-4 max-w-3xl">
                <h2 className="text-3xl font-black uppercase italic text-center mb-12">Questions Fréquentes</h2>
                <div className="space-y-4">
                    {[
                        { q: "Combien de temps dure l’expérience ?", a: "Environ 1h30 au total (accueil + 1h de rencontres + débrief)." },
                        { q: "Et si je ne match avec personne ?", a: "Rien n’est partagé. Vous repartez simplement avec l’expérience d'avoir rencontré 4 nouvelles personnes." },
                        { q: "Puis-je venir seul(e) ?", a: "Oui, c'est même le concept ! 95% des participants viennent seuls." },
                        { q: "Qui vais-je rencontrer ?", a: "Des participants de votre tranche d'âge, inscrits comme vous pour vivre une expérience authentique." },
                        { q: "Est-ce obligatoire de revoir quelqu’un ?", a: "Absolument pas. Le choix vous appartient totalement et reste confidentiel jusqu'au match." }
                    ].map((item, i) => (
                        <div key={i} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:bg-slate-900 transition-colors">
                            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                                <HelpCircle className="h-4 w-4 text-slate-500" /> {item.q}
                            </h3>
                            <p className="text-slate-400 text-sm pl-6">{item.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </Section>

        {/* 9. CTA FINAL */}
        <section className="py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-900 to-purple-900 z-0" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 z-0" />
            
            <div className="container mx-auto px-4 relative z-10 text-center">
                <h2 className="text-4xl md:text-6xl font-black uppercase italic text-white mb-8 leading-tight">
                    Votre prochaine rencontre<br />pourrait être à 15 minutes.
                </h2>
                <p className="text-pink-100 text-xl mb-12">Osez tenter l'expérience.</p>
                
                <Button size="lg" className="h-16 px-12 bg-white text-purple-900 hover:bg-purple-50 rounded-full font-black uppercase tracking-widest text-lg shadow-2xl hover:scale-105 transition-transform">
                    Réserver ma place
                </Button>
                
                <p className="mt-6 text-pink-200/60 text-xs font-bold uppercase tracking-widest">
                    Places limitées — Ne tardez pas
                </p>
            </div>
        </section>

      </main>

        {/* FOOTER */}
        <footer className="bg-slate-950 py-12 border-t border-slate-900 text-slate-500 text-sm">
            <div className="container mx-auto px-4 text-center">
                <div className="font-black text-2xl tracking-tighter uppercase italic text-white mb-8">
                    Blind Date
                </div>
                <div className="flex justify-center gap-8 mb-8 uppercase tracking-widest text-xs font-bold">
                    <a href="#" className="hover:text-white transition-colors">Instagram</a>
                    <a href="#" className="hover:text-white transition-colors">Contact</a>
                    <a href="#" className="hover:text-white transition-colors">Mentions Légales</a>
                </div>
                <p>© 2024 Blind Date Experience. All rights reserved.</p>
            </div>
        </footer>

    </div>
  );
}
