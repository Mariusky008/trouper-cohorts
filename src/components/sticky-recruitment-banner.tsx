"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Briefcase, ChevronRight, Users, X, Hammer, Lightbulb, Monitor, Scissors, 
    ArrowRight, Star, Heart, Zap, Globe, Shield, Trophy, Target, MessageCircle, Handshake
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function StickyRecruitmentBanner({ forceVisible = true }: { forceVisible?: boolean }) {
    const [isVisible, setIsVisible] = useState(forceVisible);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const alliances = [
        {
            name: "Alliance Alpha",
            members: 12,
            max: 24,
            badge: "🔥 Dernières places",
            badgeColor: "bg-orange-500",
            sections: [
                {
                    title: "🧠 Expériences de vie",
                    items: ["Retraité(e) actif", "Étudiant(e) motivé(e)", "En transition/reconversion"]
                },
                {
                    title: "🛠 Compétences utiles",
                    items: ["Bien-être / Sport / Santé", "Organisation / Admin", "Réseau local"]
                },
                {
                    title: "💬 Qualités humaines",
                    items: ["Fiable", "Bienveillant", "Motivé pour aider"]
                }
            ],
            avatars: ["JP", "S", "M", "L", "K", "T"]
        },
        {
            name: "Alliance Beta",
            members: 18,
            max: 24,
            badge: "⚡ Bientôt complet",
            badgeColor: "bg-yellow-500",
            sections: [
                {
                    title: "🛠 Compétences",
                    items: ["Droit ou Administratif", "Bricolage / Manuel", "Santé ou Nutrition"]
                },
                {
                    title: "🌍 Profils intéressants",
                    items: ["Entrepreneur", "Parent actif", "Réseau local fort"]
                },
                {
                    title: "🤝 Attitude",
                    items: ["Esprit d’entraide", "Dynamique", "Engagé"]
                }
            ],
            avatars: ["A", "B", "C", "D", "E"]
        },
        {
            name: "Alliance Gamma",
            members: 7,
            max: 24,
            badge: "🆕 Nouvelle Alliance",
            badgeColor: "bg-blue-500",
            sections: [
                {
                    title: "🛠 Compétences utiles",
                    items: ["Numérique / Web", "Gestion financière", "Créatif / Manuel"]
                },
                {
                    title: "🌱 Parcours recherchés",
                    items: ["Début de carrière", "Projet en lancement", "Développement réseau"]
                },
                {
                    title: "❤️ Qualités",
                    items: ["Curieux", "Fiable", "Ouvert aux autres"]
                }
            ],
            avatars: ["X", "Y", "Z"]
        }
    ];

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* OVERLAY FLOU QUAND AGRANDI */}
                    {isExpanded && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsExpanded(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                        />
                    )}

                    <motion.div
                        initial={{ y: 0, opacity: 1 }}
                        animate={isExpanded ? { 
                            y: "-50%", 
                            x: "-50%", 
                            top: "50%", 
                            left: "50%", 
                            bottom: "auto", 
                            right: "auto",
                            scale: 1
                        } : { 
                            y: 0, 
                            x: 0, 
                            top: "auto", 
                            left: "2rem", 
                            bottom: "2rem",
                            right: "auto",
                            scale: 1
                        }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={`fixed z-[9999] flex flex-col ${isExpanded ? 'w-[95vw] max-w-6xl' : 'items-start'}`}
                    >
                        {isExpanded ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#0a0f1c] border border-slate-700 shadow-2xl rounded-3xl overflow-hidden w-full max-h-[90vh] overflow-y-auto"
                            >
                                {/* HEADER POPUP */}
                                <div className="p-8 border-b border-slate-800 flex justify-between items-start bg-gradient-to-r from-slate-900 to-slate-800">
                                    <div className="space-y-4">
                                        <Badge className="bg-blue-600 hover:bg-blue-700 uppercase tracking-widest">Alliances en cours de formation</Badge>
                                        <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tight leading-none">
                                            3 groupes recherchent encore <br/>
                                            <span className="text-blue-400">leurs derniers membres</span>
                                        </h2>
                                        <p className="text-slate-400 text-lg max-w-2xl">
                                            Rejoignez une Alliance incomplète et devenez une ressource précieuse pour les autres.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* ACTION TRIGGER PHRASE */}
                                <div className="bg-blue-900/20 border-b border-blue-500/10 p-4 text-center">
                                    <p className="text-blue-200 font-medium flex items-center justify-center gap-2">
                                        <Target className="h-4 w-4" />
                                        Une Alliance fonctionne mieux quand les profils sont variés. <span className="text-white font-bold">Votre place existe peut-être déjà dans l'un de ces groupes.</span>
                                    </p>
                                </div>

                                {/* GRID ALLIANCES */}
                                <div className="p-6 md:p-8 grid md:grid-cols-3 gap-6 bg-[#050505]">
                                    {alliances.map((alliance, i) => (
                                        <motion.div 
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col hover:border-blue-500/50 transition-all group relative overflow-hidden h-full"
                                        >
                                            {/* Badge Status */}
                                            <div className={`absolute top-0 right-0 ${alliance.badgeColor} text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded-bl-xl z-20`}>
                                                {alliance.badge}
                                            </div>

                                            <div className="p-6 pb-0 relative z-10">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-2xl font-black text-white italic uppercase">{alliance.name}</h3>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 mb-6 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                                                    <div className="flex -space-x-2">
                                                        {alliance.avatars.slice(0, 4).map((av, j) => (
                                                            <div key={j} className="h-6 w-6 rounded-full bg-slate-700 border border-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-300">
                                                                {av}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-400">
                                                        <span className="text-white">{alliance.members}</span> / {alliance.max} membres
                                                    </div>
                                                </div>

                                                <div className="space-y-5">
                                                    {alliance.sections.map((section, k) => (
                                                        <div key={k}>
                                                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">{section.title}</h4>
                                                            <ul className="space-y-1.5">
                                                                {section.items.map((item, l) => (
                                                                    <li key={l} className="text-sm text-slate-300 flex items-start gap-2">
                                                                        <span className="text-slate-600 mt-1">•</span> {item}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-6 mt-auto relative z-10">
                                                <Button className="w-full bg-white text-black hover:bg-blue-600 hover:text-white font-black uppercase tracking-wide h-12 transition-all">
                                                    Rejoindre {alliance.name}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.button
                                onClick={() => setIsExpanded(true)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-blue-600 text-white p-4 pr-8 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.3)] border border-blue-400/50 flex items-center gap-4 group overflow-hidden transition-all hover:bg-blue-500"
                            >
                                <div className="bg-white h-12 w-12 rounded-full flex items-center justify-center shrink-0 relative text-blue-600 shadow-lg">
                                    <Briefcase className="h-6 w-6" />
                                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                                </div>
                                <div className="text-left flex flex-col">
                                    <span className="text-xs font-bold text-blue-100 uppercase tracking-wider leading-none mb-1 opacity-80">Recrutement en cours</span>
                                    <span className="text-lg font-black text-white leading-none">3 Alliances incomplètes</span>
                                </div>
                                <ChevronRight className="h-6 w-6 text-blue-200 group-hover:text-white transition-colors ml-2" />
                            </motion.button>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}