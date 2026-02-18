"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Anchor, ArrowRight, CheckCircle2, Shield, Users, Heart, Zap, Lock, Globe, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useRef } from "react";
import Link from "next/link";

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
                    
                    <div className="grid md:grid-cols-3 gap-8 text-left">
                        {[
                            { title: "Un problème administratif ?", desc: "Quelqu’un peut t’aider." },
                            { title: "Un besoin professionnel ?", desc: "Quelqu’un connaît quelqu’un." },
                            { title: "Un moment difficile ?", desc: "Quelqu’un est là." },
                        ].map((item, i) => (
                            <FadeIn key={i} delay={0.2 + (i * 0.1)} className="bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl">
                                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-slate-400">{item.desc}</p>
                            </FadeIn>
                        ))}
                    </div>

                    <FadeIn delay={0.5}>
                        <p className="text-xl text-slate-300 font-light">
                            Dans un monde incertain, le réseau humain reste la ressource la plus fiable.
                        </p>
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
        </div>
    );
}