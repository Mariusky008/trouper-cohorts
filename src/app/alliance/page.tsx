"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Anchor, ArrowRight, CheckCircle2, Shield, Users, Heart, Zap, Lock, Globe, Star, ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { useState, useRef } from "react";
import Link from "next/link";
import { StickyRecruitmentBanner } from "@/components/sticky-recruitment-banner";

// --- Components ---

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
        className={className}
    >
        {children}
    </motion.div>
);

const Section = ({ children, className = "", id = "" }: { children: React.ReactNode, className?: string, id?: string }) => (
    <section id={id} className={`py-24 md:py-32 px-6 relative overflow-hidden ${className}`}>
        <div className="max-w-7xl mx-auto relative z-10">
            {children}
        </div>
    </section>
);

// --- Page ---

export default function AlliancePage() {
    const { scrollYProgress } = useScroll();
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-orange-500/30">
            
            {/* Navbar Minimaliste */}
            <nav className="fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-center bg-gradient-to-b from-[#050505] to-transparent pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-2">
                    <Anchor className="h-6 w-6 text-white" />
                    <span className="font-black text-xl tracking-tighter text-white uppercase italic">Popey Academy</span>
                </div>
                <div className="pointer-events-auto">
                    <Button variant="outline" className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white hover:text-black transition-all backdrop-blur-md font-medium text-sm px-6">
                        Candidater
                    </Button>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative h-screen flex flex-col justify-center items-center text-center px-6 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050505] to-[#050505] z-0" />
                
                <motion.div style={{ opacity, scale }} className="relative z-10 max-w-5xl mx-auto space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-4"
                    >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-medium tracking-widest uppercase text-slate-300">Réseau Humain Premium</span>
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.95] uppercase italic">
                        Et si tu n’étais <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-300 to-slate-500">plus jamais seul</span> ?
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
                        Alliance réunit <span className="text-white font-medium">24 personnes engagées</span> pour s’entraider, 
                        partager leurs compétences et avancer ensemble.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                        <Button size="lg" className="h-14 px-8 rounded-full bg-white text-black hover:bg-slate-200 font-bold text-lg transition-all hover:scale-105 w-full sm:w-auto">
                            Rejoindre une Alliance
                        </Button>
                        <Button size="lg" variant="ghost" className="h-14 px-8 rounded-full text-slate-300 hover:text-white hover:bg-white/10 font-medium text-lg w-full sm:w-auto gap-2">
                            Découvrir le fonctionnement <ArrowRight className="h-5 w-5" />
                        </Button>
                    </div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 text-xs uppercase tracking-widest"
                >
                    <span>Découvrir</span>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-slate-500 to-transparent" />
                </motion.div>
            </section>

            {/* SECTION PROBLÈME */}
            <Section className="bg-[#080808]">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <FadeIn>
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none mb-6">
                            Aujourd’hui, <br/>
                            beaucoup de gens <br/>
                            <span className="text-slate-600">avancent seuls.</span>
                        </h2>
                    </FadeIn>
                    <FadeIn delay={0.2} className="space-y-6 text-lg text-slate-400 leading-relaxed">
                        <p>
                            Trouver de l’aide devient compliqué. Manque de réseau. Manque de solutions. Manque de soutien.
                        </p>
                        <p>
                            Nous vivons dans un monde connecté… <strong className="text-white">mais de plus en plus isolé.</strong>
                        </p>
                        <div className="pl-6 border-l-2 border-orange-500 italic text-white text-xl">
                            "Et souvent, il suffirait de connaître la bonne personne pour débloquer une situation."
                        </div>
                    </FadeIn>
                </div>
            </Section>

            {/* SECTION CONCEPT */}
            <Section className="bg-[#050505]">
                <div className="text-center max-w-4xl mx-auto mb-20">
                    <FadeIn>
                        <div className="inline-block mb-4 p-3 bg-blue-900/20 rounded-full border border-blue-500/30">
                            <Users className="h-8 w-8 text-blue-400" />
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic mb-6">
                            Une Alliance de <span className="text-blue-500">24 personnes</span>.
                        </h2>
                        <p className="text-2xl text-slate-400">
                            24 parcours. 24 compétences. 24 réseaux. <br/>
                            Mais un engagement commun : <span className="text-white font-bold">S’entraider.</span>
                        </p>
                    </FadeIn>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { icon: Heart, label: "Demander de l'aide" },
                        { icon: Zap, label: "Proposer son aide" },
                        { icon: Globe, label: "Activer son réseau" },
                        { icon: Star, label: "Partager ses compétences" },
                        { icon: CheckCircle2, label: "Trouver des solutions" },
                    ].map((item, i) => (
                        <FadeIn key={i} delay={i * 0.1} className="bg-[#0a0f1c] border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-4 hover:border-blue-500/50 transition-colors group h-40">
                            <item.icon className="h-8 w-8 text-slate-500 group-hover:text-blue-400 transition-colors" />
                            <span className="font-bold text-slate-300 text-sm uppercase tracking-wide">{item.label}</span>
                        </FadeIn>
                    ))}
                </div>
            </Section>

            {/* SECTION VALEUR */}
            <Section className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />
                <div className="max-w-4xl mx-auto text-center space-y-12">
                    <FadeIn>
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-tight">
                            Une <span className="text-green-500">sécurité humaine</span> <br/>
                            que l’argent ne peut pas acheter seul.
                        </h2>
                    </FadeIn>
                    
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { 
                            title: "Problème logement", 
                            icon: Users, 
                            desc: "Marie cherche un appartement depuis 3 mois. Elle en parle à son Alliance. Deux jours plus tard, un membre connaît un propriétaire fiable. Visite organisée, bail signé.",
                            dette: "Marie partage un contact déménagement."
                        },
                        { 
                            title: "Lancement activité", 
                            icon: Zap, 
                            desc: "Thomas ne connaît personne. Son Alliance diffuse son projet. Résultat : 3 rendez-vous, 2 clients en un mois. Il n'aurait jamais eu ces contacts seul.",
                            dette: "Thomas aide sur un site web."
                        },
                        { 
                            title: "Soutien personnel", 
                            icon: Heart, 
                            desc: "Sophie traverse une rupture et se sent isolée. Son Alliance l’accompagne, l'écoute et lui change les idées. Elle ne reste pas seule.",
                            dette: "Sophie conseille sur la gestion du stress."
                        },
                        { 
                            title: "Blocage administratif", 
                            icon: Shield, 
                            desc: "Karim doit gérer un dossier compliqué. Un membre de l’Alliance travaille dans le domaine. Un appel de 30 minutes et la situation est débloquée.",
                            dette: "Karim partage un modèle de document."
                        },
                        { 
                            title: "Compétences croisées", 
                            icon: Star, 
                            desc: "Julie aide un membre pour son CV. En retour, quelqu’un l’aide pour ses finances. Tout le monde avance grâce aux forces des autres.",
                            dette: "Julie aide sur la relecture."
                        },
                        { 
                            title: "Besoin Service", 
                            icon: CheckCircle2, 
                            desc: "Antoine a besoin d’un coach sportif. Un membre le met en contact avec un coach de confiance testé et approuvé par le réseau.",
                            dette: "Antoine aide sur un budget personnel."
                        },
                        { 
                            title: "Apprentissage", 
                            icon: Globe, 
                            desc: "Laura veut apprendre à coder. Un membre développeur lui propose 2 sessions pratiques pour démarrer sur de bonnes bases.",
                            dette: "Laura donne 1h de cours de langue."
                        },
                        { 
                            title: "Motivation", 
                            icon: Heart, 
                            desc: "Marc traverse une période de découragement. Son Alliance le soutient, suit son progrès et ne le laisse pas lâcher.",
                            dette: "Marc motive un projet entrepreneurial."
                        },
                        { 
                            title: "Coup de main", 
                            icon: Users, 
                            desc: "Emma doit transporter des meubles lourds. Deux membres proches viennent l'aider le week-end. L'entraide est aussi physique.",
                            dette: "Emma aide sur un événement."
                        },
                        { 
                            title: "Partenariats", 
                            icon: Zap, 
                            desc: "Paul cherche des partenaires pour son projet. L’Alliance identifie 3 membres pertinents qui peuvent l’aider à avancer.",
                            dette: "Paul conseille sur le commerce."
                        }
                    ].map((card, i) => (
                        <FadeIn key={i} delay={i * 0.05} className="group bg-[#050505] border border-slate-800 p-8 rounded-2xl hover:border-slate-600 transition-all hover:-translate-y-1 flex flex-col">
                            <div className="h-12 w-12 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-800 group-hover:border-slate-600 transition-colors shrink-0">
                                <card.icon className="h-6 w-6 text-slate-400 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">{card.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6 border-b border-slate-800 pb-6 flex-grow">
                                {card.desc}
                            </p>
                            <div className="text-xs font-bold text-blue-400 uppercase tracking-wide flex items-start gap-2">
                                <span className="shrink-0 text-slate-500">Dette :</span> {card.dette}
                            </div>
                        </FadeIn>
                    ))}
                </div>

                {/* BLOC DETTE DE SERVICE */}
                <FadeIn className="mt-24 max-w-4xl mx-auto bg-gradient-to-br from-slate-900 to-black border border-slate-800 p-8 md:p-12 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="relative z-10 text-center space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold uppercase tracking-widest text-xs mb-2">
                            <Lock className="h-3 w-3" /> Règle d'Or
                        </div>
                        
                        <h3 className="text-3xl md:text-4xl font-black text-white uppercase italic">
                            Comment fonctionne l’entraide ?
                        </h3>
                        
                        <div className="grid md:grid-cols-2 gap-8 text-left bg-black/20 p-6 rounded-2xl border border-white/5">
                            <div>
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-orange-500" /> La Dette de Service
                                </h4>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Chaque membre s’engage à respecter cette règle simple : <br/>
                                    <strong className="text-white">1 service reçu = 1 service rendu.</strong> <br/>
                                    Cela garantit l'équilibre et la pérennité du groupe.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-red-500" /> Nature des services
                                </h4>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Tout compte : un conseil, un contact, un avis, un coup de main physique, une compétence partagée. <br/>
                                    Chacun a quelque chose à offrir.
                                </p>
                            </div>
                        </div>

                        <p className="text-xl md:text-2xl font-black text-white italic max-w-2xl mx-auto pt-4">
                            "Donner quand on peut, <br/>recevoir quand on en a besoin."
                        </p>
                    </div>
                </FadeIn>

                {/* BLOC RITUEL TRIMESTRIEL */}
                <FadeIn className="mt-12 max-w-4xl mx-auto bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-slate-800 p-8 md:p-12 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
                    
                    <div className="relative z-10 text-center space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold uppercase tracking-widest text-xs mb-2">
                            <Star className="h-3 w-3" /> Rituel Trimestriel
                        </div>
                        
                        <h3 className="text-3xl md:text-4xl font-black text-white uppercase italic">
                            Le repas trimestriel <br/>et le choix d’Alliance
                        </h3>
                        
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Après 3 mois, chaque Alliance se réunit pour un <strong className="text-white">repas collectif</strong>, financé par Popey Academy.
                        </p>
                        
                        <div className="grid md:grid-cols-2 gap-8 text-left bg-black/20 p-6 rounded-2xl border border-white/5">
                            <div>
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-yellow-500" /> Objectifs
                                </h4>
                                <ul className="space-y-2 text-slate-400 text-sm leading-relaxed">
                                    <li>• Renforcer le lien humain et la cohésion.</li>
                                    <li>• Récompenser l’engagement de chacun.</li>
                                    <li>• Permettre à chaque membre de <strong className="text-white">valider son choix</strong> :</li>
                                    <li className="pl-4 italic text-slate-500">"Je reste" ou "Je souhaite être permuté".</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-green-500" /> Avantages
                                </h4>
                                <ul className="space-y-2 text-slate-400 text-sm leading-relaxed">
                                    <li>• Garantir la qualité et la motivation.</li>
                                    <li>• Maintenir l’équilibre des Alliances.</li>
                                    <li>• Créer un rituel fort psychologiquement.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn className="text-center mt-20 max-w-3xl mx-auto space-y-10">
                    <h3 className="text-2xl md:text-4xl font-black text-white uppercase italic leading-tight">
                        Chaque service que vous rendez génère un service en retour. <br/>
                        <span className="text-blue-500">Multipliez cela par 24 personnes.</span>
                    </h3>
                    
                    <div className="flex flex-col items-center gap-4">
                        <Button className="h-16 px-10 rounded-full bg-white text-black hover:bg-slate-200 font-black text-xl uppercase tracking-wider shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all transform hover:scale-105">
                            Rejoindre une Alliance
                        </Button>
                        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
                            Découvrez comment votre réseau peut transformer votre quotidien.
                        </p>
                    </div>
                </FadeIn>
                </div>
            </Section>

            {/* SECTION COMMENT ÇA MARCHE */}
            <Section className="bg-[#080808]">
                <div className="grid lg:grid-cols-2 gap-16">
                    <FadeIn className="sticky top-32 h-fit">
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic mb-8">
                            Un fonctionnement <br/>simple et structuré.
                        </h2>
                        <p className="text-lg text-slate-400 max-w-md">
                            Pas de complexité inutile. Juste l'essentiel pour créer des liens forts et durables.
                        </p>
                        <Button className="mt-8 bg-white text-black hover:bg-slate-200 rounded-full px-8 py-6 font-bold text-lg">
                            Voir le détail
                        </Button>
                    </FadeIn>

                    <div className="space-y-8 relative">
                        <div className="absolute left-[27px] top-4 bottom-4 w-[2px] bg-slate-800" />
                        {[
                            { title: "1. Intégration", desc: "Les membres apprennent à se connaître, partagent leurs parcours, leurs compétences et leurs besoins." },
                            { title: "2. Cartographie", desc: "Chaque personne identifie ce qu’elle peut offrir et ce dont elle a besoin." },
                            { title: "3. Actions concrètes", desc: "Les membres commencent à s’entraider : contacts, conseils, services, opportunités." },
                            { title: "4. Alliance durable", desc: "Rencontres régulières. Groupe actif. Soutien continu." },
                        ].map((step, i) => (
                            <FadeIn key={i} delay={i * 0.1} className="relative pl-20 py-4">
                                <div className="absolute left-0 top-6 h-14 w-14 rounded-full bg-[#111] border border-slate-700 flex items-center justify-center font-black text-white z-10">
                                    {i + 1}
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </Section>

            {/* SECTION TARIF & VALEUR */}
            <Section className="bg-[#050505] relative">
                <div className="max-w-5xl mx-auto space-y-24">
                    
                    {/* BLOC 1 — PRIX */}
                    <FadeIn className="text-center">
                        <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-8">
                            Combien coûte rejoindre une Alliance ?
                        </h2>
                        <div className="max-w-3xl mx-auto space-y-8">
                            <p className="text-lg text-slate-400 leading-relaxed">
                                Rejoindre une Alliance représente un engagement. <br/>
                                Parce que nous ne créons pas simplement un groupe de discussion. <br/>
                                <span className="text-white">Nous construisons un réseau humain réel, actif et structuré,</span> <br/>
                                composé de 24 personnes qui s’entraident concrètement.
                            </p>
                            
                            <div className="py-10">
                                <div className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 tracking-tighter">
                                    49 €<span className="text-2xl md:text-4xl text-slate-500 font-bold uppercase ml-2">/ mois</span>
                                </div>
                                <p className="text-slate-500 text-sm uppercase tracking-widest mt-4">
                                    Engagement initial de 6 mois <br/>
                                    <span className="text-slate-600 normal-case tracking-normal">Le temps nécessaire pour créer des liens de confiance solides.</span>
                                </p>
                            </div>
                        </div>
                    </FadeIn>

                    {/* BLOC 2 — PÉDAGOGIE VALEUR */}
                    <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
                        <FadeIn>
                            <h3 className="text-3xl font-black text-white uppercase italic mb-6">Pourquoi un tarif mensuel ?</h3>
                            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                Cela peut paraître important si l’on pense rejoindre un simple groupe WhatsApp, des rencontres sociales ou du networking informel.
                                <br/><br/>
                                <span className="text-white font-bold">Mais une Alliance est différente.</span>
                            </p>
                        </FadeIn>
                        
                        <FadeIn delay={0.2} className="bg-[#0a0f1c] border border-slate-800 p-8 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                            <h4 className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-6">Vous rejoignez :</h4>
                            <ul className="space-y-4">
                                {[
                                    "Un réseau actif de 24 personnes",
                                    "De l’aide concrète quand vous en avez besoin",
                                    "Des opportunités professionnelles et personnelles",
                                    "Du soutien moral dans les moments difficiles",
                                    "Des compétences accessibles autour de vous",
                                    "Du temps gagné pour résoudre des problèmes"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                        <span className="text-slate-300 font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-8 pt-8 border-t border-slate-800 text-center">
                                <p className="text-white font-bold text-lg">Ce n’est pas un loisir. <br/>C’est une ressource de vie.</p>
                            </div>
                        </FadeIn>
                    </div>

                    {/* BLOC 3 — COMPARAISON */}
                    <FadeIn>
                        <div className="text-center mb-12">
                            <h3 className="text-2xl md:text-4xl font-black text-white uppercase italic">
                                Un investissement comparable <br/>à des dépenses courantes
                            </h3>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                                { label: "Salle de sport", price: "30-80€", icon: Zap },
                                { label: "Divertissement", price: "20-60€", icon: Heart },
                                { label: "Mutuelle santé", price: "60-150€", icon: Shield },
                                { label: "Thérapie (1h)", price: "60-120€", icon: Users },
                                { label: "Sorties", price: "100€+", icon: Star },
                            ].map((item, i) => (
                                <div key={i} className="bg-[#0a0a0a] border border-white/5 p-4 rounded-2xl text-center hover:border-white/20 transition-colors">
                                    <item.icon className="h-6 w-6 text-slate-600 mx-auto mb-3" />
                                    <div className="font-bold text-slate-300 text-sm mb-1">{item.label}</div>
                                    <div className="text-xs text-slate-500">{item.price} / mois</div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-12 text-center max-w-2xl mx-auto">
                            <p className="text-xl text-slate-300 font-light italic">
                                "Une Alliance peut vous apporter du soutien, des solutions, un réseau et des opportunités concrètes. 
                                <span className="text-white font-medium not-italic"> Pour beaucoup, la valeur dépasse largement le coût.</span>"
                            </p>
                        </div>
                    </FadeIn>

                    {/* BLOC 4 — ENGAGEMENT */}
                    <FadeIn className="bg-white text-black rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
                         <div className="relative z-10 max-w-3xl mx-auto">
                            <h3 className="text-2xl md:text-4xl font-black uppercase italic mb-6">
                                Un engagement qui protège la qualité du groupe
                            </h3>
                            <p className="text-lg text-slate-600 mb-8">
                                Le tarif permet de garantir l’implication des membres, de maintenir des groupes sérieux, 
                                de financer l’animation et d’assurer un environnement fiable.
                            </p>
                            <div className="inline-block border-2 border-black px-6 py-3 font-black uppercase tracking-widest text-sm">
                                Notre priorité : Créer des Alliances utiles et durables
                            </div>
                         </div>
                    </FadeIn>

                    {/* CITATION & CTA */}
                    <FadeIn className="text-center pt-12 space-y-12">
                        <div className="space-y-4">
                            <h3 className="text-3xl md:text-5xl font-black text-white uppercase italic leading-tight">
                                Le vrai coût n’est pas le prix.
                            </h3>
                            <p className="text-2xl md:text-4xl font-black text-slate-500 uppercase italic">
                                Le vrai coût, c’est de rester seul face aux difficultés.
                            </p>
                        </div>
                        
                        <div className="flex flex-col items-center gap-4">
                            <Button className="h-16 px-10 rounded-full bg-white text-black hover:bg-slate-200 font-black text-xl uppercase tracking-wider shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all transform hover:scale-105">
                                Rejoindre une Alliance
                            </Button>
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
                                Places limitées pour préserver la qualité des groupes.
                            </p>
                            <Button variant="link" className="text-slate-400 hover:text-white mt-2">
                                Poser une question
                            </Button>
                        </div>
                    </FadeIn>

                </div>
            </Section>

            {/* SECTION RÈGLES */}
            <Section className="bg-white text-black text-center">
                <FadeIn>
                    <Shield className="h-16 w-16 mx-auto mb-6 text-black" />
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-8">
                        Une Alliance fonctionne <br/>grâce à l’engagement.
                    </h2>
                    <p className="text-xl md:text-2xl max-w-3xl mx-auto font-medium mb-12">
                        Chaque membre contribue. Chaque membre reçoit. <br/>
                        L’équilibre repose sur une règle simple :
                    </p>
                    <div className="text-3xl md:text-5xl font-black uppercase tracking-tight max-w-4xl mx-auto border-t-2 border-b-2 border-black py-12">
                        Donner quand on peut, <br/>
                        Recevoir quand on en a besoin.
                    </div>
                    <p className="mt-12 text-lg font-medium text-slate-600">
                        Le respect et l’implication de chacun garantissent la qualité du groupe.
                    </p>
                </FadeIn>
            </Section>

            {/* SECTION BÉNÉFICES */}
            <Section className="bg-[#050505]">
                <FadeIn className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                        Ce que ton Alliance peut changer pour toi.
                    </h2>
                </FadeIn>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        "Ne plus rester seul",
                        "Trouver des solutions plus vite",
                        "Développer ton réseau humain",
                        "Accéder à des compétences variées",
                        "Gagner en confiance",
                        "Aider et être aidé",
                        "Créer des relations durables",
                        "Une sécurité émotionnelle"
                    ].map((benefit, i) => (
                        <FadeIn key={i} delay={i * 0.05} className="bg-[#0a0f1c] border border-slate-800 p-6 rounded-xl flex items-center gap-4 hover:border-white/30 transition-colors group">
                            <div className="h-2 w-2 rounded-full bg-green-500 group-hover:scale-150 transition-transform" />
                            <span className="font-bold text-slate-200">{benefit}</span>
                        </FadeIn>
                    ))}
                </div>
            </Section>

            {/* SECTION PROFILS */}
            <Section className="bg-[#080808] overflow-hidden">
                <div className="text-center mb-16">
                    <FadeIn>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic mb-4">
                            Des profils variés, <br/> une richesse immense.
                        </h2>
                        <p className="text-slate-400 text-lg">Cette diversité crée une puissance collective unique.</p>
                    </FadeIn>
                </div>
                
                {/* Marquee effect simulé */}
                <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
                    {["Salariés", "Indépendants", "Entrepreneurs", "Artisans", "Étudiants", "Retraités", "Professionnels", "Artistes", "Sportifs", "Créatifs"].map((profile, i) => (
                        <FadeIn key={i} delay={i * 0.05} className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-slate-300 font-bold uppercase tracking-wide text-sm hover:bg-white hover:text-black transition-all cursor-default">
                            {profile}
                        </FadeIn>
                    ))}
                </div>
            </Section>

            {/* SECTION PROJECTION */}
            <Section className="bg-gradient-to-b from-[#050505] to-blue-950/20 text-center py-32">
                <FadeIn>
                    <h2 className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-4">Projection</h2>
                    <p className="text-5xl md:text-7xl font-black text-white tracking-tighter italic mb-12">
                        Imagine...
                    </p>
                    <div className="space-y-6 text-xl md:text-3xl font-light text-slate-300 max-w-4xl mx-auto leading-relaxed">
                        <p>Avoir toujours quelqu’un à appeler.</p>
                        <p>Connaître quelqu’un qui connaît quelqu’un.</p>
                        <p>Ne plus te sentir bloqué face à une situation.</p>
                        <p>Savoir que tu peux compter sur un groupe.</p>
                        <p className="text-white font-bold pt-4">Et savoir aussi que tu peux aider.</p>
                    </div>
                </FadeIn>
            </Section>

            {/* SECTION CTA FINAL */}
            <Section className="bg-[#050505] min-h-[60vh] flex flex-col justify-center items-center text-center">
                <FadeIn className="space-y-8 max-w-4xl mx-auto">
                    <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Et si rejoindre une Alliance <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">changeait ta vie ?</span>
                    </h2>
                    
                    <div className="pt-8 pb-4">
                        <Button className="h-20 px-12 rounded-full bg-white text-black hover:bg-slate-200 font-black text-2xl uppercase tracking-wider shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:shadow-[0_0_80px_rgba(255,255,255,0.5)] transition-all transform hover:scale-105">
                            Candidater pour rejoindre
                        </Button>
                    </div>
                    
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
                        Les places sont limitées pour garantir la qualité des groupes.
                    </p>
                </FadeIn>
            </Section>

            {/* BONUS: SOCIAL PROOF / STATS */}
            <Section className="border-t border-slate-900 bg-[#080808]">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                    <FadeIn delay={0}>
                        <div className="text-5xl font-black text-white mb-2">12+</div>
                        <div className="text-slate-500 uppercase tracking-widest text-sm">Alliances Actives</div>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <div className="text-5xl font-black text-white mb-2">280+</div>
                        <div className="text-slate-500 uppercase tracking-widest text-sm">Membres Engagés</div>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <div className="text-5xl font-black text-white mb-2">98%</div>
                        <div className="text-slate-500 uppercase tracking-widest text-sm">Taux de satisfaction</div>
                    </FadeIn>
                </div>
            </Section>

            {/* FAQ */}
            <Section className="bg-[#080808]">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-12 text-center">Questions Fréquentes</h2>
                    <div className="space-y-4">
                        {[
                            { q: "À qui s’adresse Alliance ?", a: "À toute personne bienveillante qui souhaite ne plus avancer seule, partager ses compétences et s'enrichir du contact humain, quel que soit son statut professionnel." },
                            { q: "Quel engagement est demandé ?", a: "Une présence régulière aux échanges, une réactivité raisonnable quand un membre a besoin d'aide, et un esprit constructif." },
                            { q: "Comment sont sélectionnés les membres ?", a: "Nous veillons à créer des groupes hétérogènes et complémentaires, en nous basant sur les valeurs et la motivation plus que sur le CV." },
                            { q: "Combien de temps dure l’engagement ?", a: "L'Alliance est conçue pour durer. Les cycles d'engagement sont généralement de 3 à 6 mois, renouvelables indéfiniment." },
                            { q: "Que se passe-t-il si je ne peux pas aider souvent ?", a: "Ce n'est pas grave. L'important est l'intention. Parfois vous aiderez beaucoup, parfois vous aurez besoin d'aide. C'est l'équilibre global qui compte." }
                        ].map((item, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <div className="border border-slate-800 rounded-2xl bg-[#0a0f1c] overflow-hidden">
                                    <button 
                                        onClick={() => toggleFaq(i)}
                                        className="w-full flex items-center justify-between p-6 text-left font-bold text-white hover:bg-slate-900/50 transition-colors"
                                    >
                                        <span className="text-lg">{item.q}</span>
                                        {openFaq === i ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
                                    </button>
                                    {openFaq === i && (
                                        <div className="px-6 pb-6 text-slate-400 leading-relaxed border-t border-slate-800/50 pt-4">
                                            {item.a}
                                        </div>
                                    )}
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </Section>

            {/* FOOTER */}
            <footer className="bg-[#050505] py-12 border-t border-slate-900 text-slate-300">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-8 mb-12 text-left">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Anchor className="h-6 w-6 text-white" />
                                <span className="font-black uppercase tracking-widest text-white">Popey Academy</span>
                            </div>
                            <p className="text-sm text-slate-500">
                                La première école qui transforme l'indécision en action.
                                <br/>Force & Honneur.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-white uppercase mb-4 text-sm">Programmes</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li><Link href="/emploi" className="hover:text-white transition-colors">Trouver sa voie</Link></li>
                                <li><Link href="/" className="hover:text-white transition-colors">Lancer son activité</Link></li>
                                <li><Link href="/admin/catalogue-chomeur" className="hover:text-white transition-colors">Catalogue PDF</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white uppercase mb-4 text-sm">Légal</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li><Link href="/legal/mentions" className="hover:text-white transition-colors">Mentions Légales</Link></li>
                                <li><Link href="/legal/terms" className="hover:text-white transition-colors">CGV / CGU</Link></li>
                                <li><Link href="/legal/privacy" className="hover:text-white transition-colors">Politique de Confidentialité</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white uppercase mb-4 text-sm">Contact</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li>hello@popey.academy</li>
                                <li>Paris, France</li>
                                <li className="flex gap-4 mt-4">
                                    <div className="h-8 w-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:bg-white hover:text-black transition-colors cursor-pointer">
                                        <span className="font-black text-xs">IN</span>
                                    </div>
                                    <div className="h-8 w-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:bg-white hover:text-black transition-colors cursor-pointer">
                                        <span className="font-black text-xs">IG</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-slate-900 text-center">
                        <p className="text-slate-500 text-xs">© 2026 Popey Academy. Tous droits réservés.</p>
                    </div>
                </div>
            </footer>
            <StickyRecruitmentBanner forceVisible={true} />
        </div>
    );
}