"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Calendar, MessageCircle, CheckCircle2, 
  ArrowRight, ShieldCheck, Zap, Briefcase, 
  Target, TrendingUp, HelpCircle, Phone, Video,
  Star, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- Components ---

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
  <section id={id} className={cn("py-20 md:py-28 relative overflow-hidden", className)}>
    {children}
  </section>
);

export default function MonReseauLocalPage() {
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <Users className="h-5 w-5" />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900">Mon Réseau Local</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
            <a href="#probleme" className="hover:text-blue-600 transition-colors">Pourquoi ?</a>
            <a href="#solution" className="hover:text-blue-600 transition-colors">Solution</a>
            <a href="#tarif" className="hover:text-blue-600 transition-colors">Tarif</a>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold px-6 shadow-lg shadow-blue-200">
              Commencer
            </Button>
          </nav>
        </div>
      </header>

      <main className="pt-20">
        
        {/* 1. HERO SECTION */}
        <section className="relative pt-12 pb-24 md:pt-24 md:pb-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-slate-50 z-0" />
            
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    
                    <FadeIn className="text-left space-y-8">
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1 text-xs font-bold uppercase tracking-wider mb-2">
                            Réseau d'Entrepreneurs Actifs
                        </Badge>
                        
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
                            Développez votre réseau et trouvez des opportunités en parlant avec <span className="text-blue-600">1 entrepreneur différent chaque jour.</span>
                        </h1>
                        
                        <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-xl">
                            Nous organisons vos rendez-vous. Vous échangez. Les opportunités circulent. 
                            <br/><span className="font-bold text-slate-900">Ne restez plus seul pour développer votre activité.</span>
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button size="lg" className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-full shadow-xl shadow-blue-200 hover:translate-y-[-2px] transition-all">
                                Commencer maintenant — 49€/mois
                            </Button>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                            <CheckCircle2 className="h-4 w-4 text-green-500" /> Sans engagement long
                            <span className="text-slate-300">•</span>
                            <CheckCircle2 className="h-4 w-4 text-green-500" /> Annulable à tout moment
                        </div>
                    </FadeIn>

                    {/* HERO VISUAL */}
                    <FadeIn delay={0.2} className="relative">
                        <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 max-w-md mx-auto rotate-1 hover:rotate-0 transition-transform duration-500">
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase">Aujourd'hui</div>
                                        <div className="font-bold text-slate-900">Rendez-vous du jour</div>
                                    </div>
                                </div>
                                <Badge className="bg-green-100 text-green-700 border-0">Confirmé</Badge>
                            </div>

                            {/* Meeting Card */}
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-12 w-12 rounded-full bg-orange-100 border-2 border-white shadow-sm flex items-center justify-center text-orange-600 font-bold text-lg">
                                        T
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">Thomas D.</div>
                                        <div className="text-xs text-slate-500">Architecte d'intérieur • Bordeaux</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
                                        <Phone className="h-4 w-4" /> Rejoindre l'appel
                                    </Button>
                                </div>
                            </div>

                            {/* Notification */}
                            <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-100 flex items-center gap-3 animate-pulse">
                                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                    <MessageCircle className="h-4 w-4" />
                                </div>
                                <div className="text-xs">
                                    <span className="font-bold text-slate-900">Sarah</span> vous a recommandé à un client !
                                </div>
                            </div>
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 hidden md:block">
                            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Opportunités</div>
                            <div className="text-2xl font-black text-blue-600">+12 cette semaine</div>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>

        {/* 2. SECTION PROBLÈME */}
        <Section id="probleme" className="bg-white">
            <div className="container mx-auto px-4 max-w-4xl text-center">
                <FadeIn>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 leading-tight">
                        Aujourd’hui, beaucoup d’entrepreneurs <span className="text-red-500">avancent seuls.</span>
                    </h2>
                </FadeIn>

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {[
                        { title: "Isolement", desc: "Personne avec qui partager les doutes et les victoires.", icon: Users, img: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=2070&auto=format&fit=crop" },
                        { title: "Manque de réseau", desc: "Cercle professionnel limité, peu de nouvelles rencontres.", icon: Target, img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop" },
                        { title: "Peu d'opportunités", desc: "Le bouche-à-oreille stagne, les affaires ralentissent.", icon: TrendingUp, img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2664&auto=format&fit=crop" }
                    ].map((item, i) => (
                        <FadeIn key={i} delay={i * 0.1}>
                            <div className="bg-slate-50 rounded-2xl border border-slate-100 h-full overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="h-48 overflow-hidden">
                                    <img src={item.img} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="p-6">
                                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center -mt-12 mb-4 shadow-md text-red-500 relative z-10 border-4 border-slate-50">
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                                    <p className="text-sm text-slate-500">{item.desc}</p>
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                <FadeIn delay={0.3}>
                    <p className="text-xl md:text-2xl font-medium text-slate-800 italic">
                        "Et pourtant… Il suffit souvent de connaître la bonne personne pour débloquer une situation."
                    </p>
                </FadeIn>
            </div>
        </Section>

        {/* 3. SECTION SOLUTION */}
        <Section id="solution" className="bg-blue-600 text-white">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <FadeIn>
                        <Badge className="bg-white/10 text-white hover:bg-white/20 border-0 mb-6 uppercase tracking-widest px-3 py-1">La Solution Simple</Badge>
                        <h2 className="text-4xl md:text-5xl font-black mb-6">1 échange par jour.</h2>
                        <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                            Chaque jour, vous rencontrez un entrepreneur différent. 
                            Vous partagez vos projets, vos besoins, vos compétences, vos contacts.
                            <br/><br/>
                            Et votre réseau grandit naturellement.
                        </p>
                        <div className="bg-white/10 rounded-xl p-6 border border-white/20 backdrop-blur-sm">
                            <p className="text-2xl font-black text-white text-center">
                                20 jours = 20 entrepreneurs rencontrés/mois.
                            </p>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.2} className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Vos Projets", icon: Briefcase },
                            { label: "Vos Besoins", icon: Target },
                            { label: "Vos Compétences", icon: Zap },
                            { label: "Vos Contacts", icon: Users }
                        ].map((item, i) => (
                            <div key={i} className="bg-white text-blue-900 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg">
                                <item.icon className="h-8 w-8 mb-3 text-blue-600" />
                                <span className="font-bold">{item.label}</span>
                            </div>
                        ))}
                    </FadeIn>
                </div>
            </div>
        </Section>

        {/* 4. COMMENT ÇA MARCHE */}
        <Section className="bg-slate-50">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black text-slate-900 mb-4">Un système simple qui crée des opportunités en continu</h2>
                    <p className="text-slate-500">Aucune prospection compliquée. Juste de l'humain.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { title: "Un rendez-vous chaque jour", desc: "Vous échangez 10 minutes avec un entrepreneur différent.", img: "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?q=80&w=2574&auto=format&fit=crop" },
                        { title: "Des opportunités circulent", desc: "Recommandations, contacts, conseils, clients potentiels.", img: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2668&auto=format&fit=crop" },
                        { title: "La réciprocité est garantie", desc: "Si quelqu’un vous aide, vous lui devez une opportunité équivalente.", img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2574&auto=format&fit=crop" }
                    ].map((item, i) => (
                        <FadeIn key={i} delay={i * 0.1}>
                            <div className="relative group">
                                <div className="relative z-10 bg-white rounded-2xl border border-slate-200 shadow-sm h-full overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                                    <div className="h-40 overflow-hidden">
                                        <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    <div className="p-6">
                                        <h3 className="font-bold text-slate-900 text-lg mb-2">{item.title}</h3>
                                        <p className="text-sm text-slate-500">{item.desc}</p>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </Section>

        {/* 5. SCORE DE CONFIANCE (NEW) */}
        <Section className="bg-white border-y border-slate-100">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <FadeIn>
                        <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1 text-xs font-bold uppercase tracking-wider mb-6">Innovation</Badge>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">Votre fiabilité devient visible</h2>
                        <p className="text-slate-600 text-lg mb-6 leading-relaxed">
                            Chaque membre possède un score de confiance basé sur les opportunités reçues et rendues. 
                            Cela crée un réseau sérieux, engagé et actif.
                        </p>
                        <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <span className="font-bold text-slate-900">Règle d'Or :</span> Si vous recevez une opportunité, vous disposez de 30 jours pour rendre la pareille. Sinon, votre score diminue.
                        </p>
                    </FadeIn>

                    <FadeIn delay={0.2} className="relative">
                        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 max-w-sm mx-auto">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-16 w-16 bg-slate-100 rounded-full overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop" alt="Profile" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="font-black text-slate-900 text-xl">Alexandre P.</div>
                                    <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                                        <Star className="h-4 w-4 fill-current" /> 4.8/5
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-100">
                                    <span className="text-sm font-medium text-slate-600">Opportunités reçues</span>
                                    <span className="font-black text-green-600">12</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <span className="text-sm font-medium text-slate-600">Opportunités rendues</span>
                                    <span className="font-black text-blue-600">11</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl border border-orange-100">
                                    <span className="text-sm font-medium text-slate-600">Dettes en cours</span>
                                    <span className="font-black text-orange-600">1</span>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </Section>

        {/* 6. PUISSANCE DU RÉSEAU (NEW) */}
        <Section className="bg-slate-900 text-white">
            <div className="container mx-auto px-4 text-center max-w-4xl">
                <FadeIn>
                    <h2 className="text-3xl md:text-4xl font-black mb-8">Multipliez vos chances sans prospecter seul</h2>
                    <p className="text-slate-300 text-xl mb-12">Chaque conversation ouvre l’accès à un nouveau réseau professionnel et personnel.</p>
                    
                    {/* Visual representation of network effect */}
                    <div className="relative h-64 md:h-80 w-full bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/connected.png')]"></div>
                        <div className="relative z-10 flex items-center justify-center gap-8">
                            <div className="bg-blue-600 h-16 w-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.5)] border-4 border-slate-900 z-20">
                                <span className="font-black text-xl">Vous</span>
                            </div>
                            <ArrowRight className="h-8 w-8 text-slate-500 animate-pulse" />
                            <div className="bg-white text-slate-900 h-12 w-12 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">Ent.</div>
                            <ArrowRight className="h-8 w-8 text-slate-500 animate-pulse delay-100" />
                            <div className="flex -space-x-4">
                                {[1,2,3].map(i => (
                                    <div key={i} className="h-10 w-10 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs font-bold">Client</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </Section>

        {/* 7. DASHBOARD APERÇU (NEW) */}
        <Section className="bg-slate-50">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black text-slate-900 mb-4">Votre futur tableau de bord</h2>
                    <p className="text-slate-500">Tout est clair. Vous savez qui voir et qui aider.</p>
                </div>

                <FadeIn>
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-[250px_1fr]">
                            {/* Sidebar Fake */}
                            <div className="bg-slate-50 p-6 border-r border-slate-100 hidden md:block">
                                <div className="space-y-4">
                                    <div className="h-2 w-20 bg-slate-200 rounded mb-8"></div>
                                    <div className="h-8 w-full bg-blue-100 text-blue-700 rounded-lg flex items-center px-3 text-xs font-bold">Tableau de bord</div>
                                    <div className="h-8 w-full text-slate-400 rounded-lg flex items-center px-3 text-xs font-bold">Mes Dettes</div>
                                    <div className="h-8 w-full text-slate-400 rounded-lg flex items-center px-3 text-xs font-bold">Historique</div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8">
                                <div className="mb-8">
                                    <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-4">Aujourd'hui</h4>
                                    <div className="bg-white border border-blue-100 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                                                <Phone className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">Appel avec Julien</div>
                                                <div className="text-xs text-slate-500">Prévu à 14h00</div>
                                            </div>
                                        </div>
                                        <Badge className="bg-blue-50 text-blue-600 border-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">Rejoindre</Badge>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-4">Vos Dettes de Confiance</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
                                                <span className="text-sm font-medium text-slate-700">Tu dois une opportunité à Sophie</span>
                                            </div>
                                            <span className="text-xs font-bold text-orange-600">Reste 12 jours</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                <span className="text-sm font-medium text-slate-700">Marc te doit une opportunité</span>
                                            </div>
                                            <span className="text-xs font-bold text-green-600">En attente (18j)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </Section>

        {/* 8. RÉSULTATS / PREUVES SOCIALES (UPDATED) */}
        <Section className="bg-white">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-8 text-center divide-x divide-slate-100 mb-16">
                    <FadeIn>
                        <div className="text-4xl md:text-5xl font-black text-blue-600 mb-2">300+</div>
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Entrepreneurs actifs</div>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <div className="text-4xl md:text-5xl font-black text-blue-600 mb-2">450+</div>
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Opportunités générées</div>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <div className="text-4xl md:text-5xl font-black text-blue-600 mb-2">98%</div>
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Taux de satisfaction</div>
                    </FadeIn>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <FadeIn delay={0.3}>
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 relative">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-12 w-12 bg-slate-200 rounded-full overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=2000&auto=format&fit=crop" alt="User" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900">Sarah L.</div>
                                    <div className="text-xs text-slate-500">Consultante Marketing</div>
                                </div>
                            </div>
                            <p className="text-slate-600 italic">"J’ai trouvé 3 clients en 2 mois grâce aux recommandations. C'est bien plus efficace que la prospection à froid."</p>
                        </div>
                    </FadeIn>
                    <FadeIn delay={0.4}>
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 relative">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-12 w-12 bg-slate-200 rounded-full overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2000&auto=format&fit=crop" alt="User" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900">David M.</div>
                                    <div className="text-xs text-slate-500">Développeur Web</div>
                                </div>
                            </div>
                            <p className="text-slate-600 italic">"Le système de confiance motive vraiment les gens à aider. On ne se sent plus seul face à son business."</p>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </Section>

        {/* 9. DIFFÉRENCIATION (NEW) */}
        <Section className="bg-slate-50">
            <div className="container mx-auto px-4 max-w-4xl text-center">
                <FadeIn>
                    <h2 className="text-3xl font-black text-slate-900 mb-12">Ce n’est pas du networking.<br/>C’est un système d’entraide.</h2>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 opacity-70 grayscale-[0.5]">
                            <h3 className="font-bold text-slate-500 uppercase tracking-widest mb-6">Networking Classique</h3>
                            <ul className="space-y-4 text-left">
                                <li className="flex items-center gap-3 text-slate-500"><X className="h-5 w-5 text-red-400" /> Cartes de visite perdues</li>
                                <li className="flex items-center gap-3 text-slate-500"><X className="h-5 w-5 text-red-400" /> Promesses sans suite</li>
                                <li className="flex items-center gap-3 text-slate-500"><X className="h-5 w-5 text-red-400" /> Relations faibles et superficielles</li>
                            </ul>
                        </div>
                        
                        <div className="bg-white p-8 rounded-2xl border-2 border-blue-600 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">LE FUTUR</div>
                            <h3 className="font-bold text-blue-600 uppercase tracking-widest mb-6">Avec Popey</h3>
                            <ul className="space-y-4 text-left">
                                <li className="flex items-center gap-3 text-slate-900 font-medium"><CheckCircle2 className="h-5 w-5 text-green-500" /> Appels quotidiens ciblés</li>
                                <li className="flex items-center gap-3 text-slate-900 font-medium"><CheckCircle2 className="h-5 w-5 text-green-500" /> Réciprocité mesurée & garantie</li>
                                <li className="flex items-center gap-3 text-slate-900 font-medium"><CheckCircle2 className="h-5 w-5 text-green-500" /> Opportunités concrètes</li>
                            </ul>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </Section>

        {/* 9. TARIF */}
        <Section id="tarif" className="bg-white">
            <div className="container mx-auto px-4 text-center">
                <FadeIn>
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white max-w-md mx-auto rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        
                        <h2 className="text-2xl font-bold mb-2">Accès Illimité</h2>
                        <div className="text-6xl font-black mb-2 tracking-tighter">49€<span className="text-xl font-medium text-blue-200">/mois</span></div>
                        
                        <p className="text-blue-100 text-sm mb-8">Un investissement inférieur à une journée sans opportunité.</p>
                        
                        <ul className="text-left space-y-3 mb-8 text-blue-50">
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> 1 RDV par jour garanti</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Accès à la communauté</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Support prioritaire</li>
                        </ul>

                        <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-black h-12 rounded-xl text-lg">
                            Je m'abonne
                        </Button>
                        <p className="mt-4 text-xs text-blue-200">Sans engagement long. Annulation facile.</p>
                    </div>
                    
                    {/* OFFRE DE LANCEMENT */}
                    <div className="mt-8 inline-block bg-orange-100 border border-orange-200 rounded-xl p-4 max-w-sm">
                        <div className="flex items-center gap-3">
                            <Zap className="h-6 w-6 text-orange-600 fill-orange-600" />
                            <div className="text-left">
                                <div className="font-black text-orange-800 uppercase text-xs tracking-wider">Offre Lancement</div>
                                <div className="font-bold text-orange-900">3 jours d'essai pour 1€ seulement</div>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </Section>

        {/* 10. CTA FINAL */}
        <Section className="bg-slate-900 text-white text-center">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">
                    Votre réseau dans 6 mois dépend<br/>de ce que vous faites <span className="text-blue-500">aujourd'hui.</span>
                </h2>
                <Button size="lg" className="h-16 px-12 bg-blue-600 hover:bg-blue-500 text-white font-black text-xl rounded-full shadow-2xl hover:scale-105 transition-transform">
                    Rejoindre maintenant
                </Button>
            </div>
        </Section>

        {/* 11. FAQ */}
        <Section className="bg-white">
            <div className="container mx-auto px-4 max-w-3xl">
                <h2 className="text-3xl font-black text-slate-900 text-center mb-12">Questions Fréquentes</h2>
                <div className="space-y-4">
                    {[
                        { q: "Combien de temps durent les échanges ?", a: "15 à 30 minutes. Court et efficace pour s'intégrer dans votre journée." },
                        { q: "Avec qui vais-je parler ?", a: "Des entrepreneurs de votre région ou secteur, sélectionnés pour la pertinence de l'échange." },
                        { q: "Et si je suis timide ?", a: "Le format 1-on-1 est parfait pour ça. Bien plus facile que les grands événements de networking." },
                        { q: "Puis-je arrêter quand je veux ?", a: "Oui, l'abonnement est sans engagement de durée." }
                    ].map((item, i) => (
                        <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-blue-600" /> {item.q}
                            </h3>
                            <p className="text-slate-600 pl-7">{item.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </Section>

        {/* 12. PROJECTION FINALE */}
        <section className="py-24 bg-slate-50 border-t border-slate-200">
            <div className="container mx-auto px-4 text-center max-w-2xl">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Imaginez...</p>
                <div className="space-y-4 text-xl md:text-2xl font-medium text-slate-800 leading-relaxed mb-12">
                    <p>Avoir toujours quelqu’un à appeler.</p>
                    <p>Connaître quelqu’un qui connaît quelqu’un.</p>
                    <p>Ne plus rester bloqué seul.</p>
                    <p className="font-black text-blue-600 text-3xl mt-8">Et avancer.</p>
                </div>
                <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-8 py-6 text-lg font-bold">
                    Je commence mon essai
                </Button>
            </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-white py-12 border-t border-slate-100 text-slate-500 text-sm text-center">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="bg-slate-200 text-slate-500 p-1 rounded">
                        <Users className="h-4 w-4" />
                    </div>
                    <span className="font-black text-slate-900 uppercase tracking-widest">Mon Réseau Local</span>
                </div>
                <div className="flex justify-center gap-8 mb-8 uppercase tracking-widest text-xs font-bold">
                    <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
                    <a href="#" className="hover:text-blue-600 transition-colors">Mentions Légales</a>
                    <a href="#" className="hover:text-blue-600 transition-colors">CGV</a>
                </div>
                <p>© 2024 Mon Réseau Local. Tous droits réservés.</p>
            </div>
        </footer>

      </main>
    </div>
  );
}
