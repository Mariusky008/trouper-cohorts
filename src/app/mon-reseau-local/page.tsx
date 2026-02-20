"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Calendar, MessageCircle, CheckCircle2, 
  ArrowRight, ShieldCheck, Zap, Briefcase, 
  Target, TrendingUp, HelpCircle, Phone, Video
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
                                        <Video className="h-4 w-4" /> Rejoindre la visio
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
                        { title: "Isolement", desc: "Personne avec qui partager les doutes et les victoires.", icon: Users },
                        { title: "Manque de réseau", desc: "Cercle professionnel limité, peu de nouvelles rencontres.", icon: Target },
                        { title: "Peu d'opportunités", desc: "Le bouche-à-oreille stagne, les affaires ralentissent.", icon: TrendingUp }
                    ].map((item, i) => (
                        <FadeIn key={i} delay={i * 0.1}>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 h-full">
                                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-red-500">
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                                <p className="text-sm text-slate-500">{item.desc}</p>
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
                                30 jours = 30 entrepreneurs rencontrés.
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
                    <h2 className="text-3xl font-black text-slate-900 mb-4">Simple. Structuré. Efficace.</h2>
                    <p className="text-slate-500">Aucune prospection compliquée. Juste de l'humain.</p>
                </div>

                <div className="grid md:grid-cols-4 gap-8">
                    {[
                        { step: "1", title: "Inscription", desc: "Vous rejoignez le réseau en 2 minutes." },
                        { step: "2", title: "Organisation", desc: "Nous planifions vos RDV quotidiens." },
                        { step: "3", title: "Échange", desc: "Vous discutez 15 à 30 minutes en visio." },
                        { step: "4", title: "Opportunités", desc: "Le réseau s'active, les contacts circulent." }
                    ].map((item, i) => (
                        <FadeIn key={i} delay={i * 0.1}>
                            <div className="relative">
                                <div className="text-6xl font-black text-slate-200 absolute -top-4 -left-2 z-0">{item.step}</div>
                                <div className="relative z-10 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
                                    <h3 className="font-bold text-slate-900 text-lg mb-2">{item.title}</h3>
                                    <p className="text-sm text-slate-500">{item.desc}</p>
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </Section>

        {/* 5. PROJECTION */}
        <Section className="bg-white border-y border-slate-100">
            <div className="container mx-auto px-4 text-center max-w-3xl">
                <FadeIn>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-8">Imaginez dans 60 jours...</h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
                        {[
                            "60 entrepreneurs vous connaissent",
                            "Des recommandations naturelles",
                            "Des opportunités professionnelles",
                            "Moins d'isolement",
                            "Plus de motivation",
                            "Un vrai réseau humain"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-left bg-slate-50 p-3 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                <span className="text-sm font-bold text-slate-700">{item}</span>
                            </div>
                        ))}
                    </div>

                    <p className="text-xl font-medium text-slate-900">
                        Votre situation peut évoluer très vite.
                    </p>
                </FadeIn>
            </div>
        </Section>

        {/* 6. POUR QUI */}
        <Section className="bg-slate-50">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white text-center">
                    <h2 className="text-3xl font-black mb-8">Pour qui est fait ce réseau ?</h2>
                    <div className="flex flex-wrap justify-center gap-3">
                        {["Entrepreneurs", "Indépendants", "Freelances", "Salariés en transition", "Porteurs de projet", "Créateurs d'activité"].map((tag, i) => (
                            <Badge key={i} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 text-sm font-bold border-0">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                    <p className="mt-8 text-slate-400">Débutant ou expérimenté, c'est l'envie d'avancer qui compte.</p>
                </div>
            </div>
        </Section>

        {/* 7. PREUVE */}
        <Section className="bg-white">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-8 text-center divide-x divide-slate-100">
                    <FadeIn>
                        <div className="text-4xl md:text-5xl font-black text-blue-600 mb-2">300+</div>
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Entrepreneurs inscrits</div>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <div className="text-4xl md:text-5xl font-black text-blue-600 mb-2">92%</div>
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Trouvent l'expérience utile</div>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <div className="text-4xl md:text-5xl font-black text-blue-600 mb-2">Des dizaines</div>
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">De mises en relation réussies</div>
                    </FadeIn>
                </div>
            </div>
        </Section>

        {/* 8. POURQUOI ÇA MARCHE */}
        <Section className="bg-slate-50">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-black text-slate-900">Pourquoi ça marche ?</h2>
                        <ul className="space-y-4">
                            {[
                                "Le réseau crée des opportunités",
                                "La régularité change les résultats",
                                "L'humain crée la confiance",
                                "L'entraide accélère tout"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <div className="h-2 w-2 bg-blue-600 rounded-full" />
                                    <span className="text-slate-700 font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg text-center">
                        <p className="text-2xl font-black text-slate-900 italic mb-2">"Seul on va vite.<br/>En réseau on va loin."</p>
                        <div className="w-16 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
                    </div>
                </div>
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
                                <div className="font-bold text-orange-900">15 jours d'essai pour 1€ seulement</div>
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
