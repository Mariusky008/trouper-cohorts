"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Briefcase, ChevronRight, Users, X, Hammer, Lightbulb, Monitor, Scissors, 
    ArrowRight, Star, Heart, Zap, Globe, Shield, Trophy
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
            missing: [
                { role: "Retraité(e)", icon: Star, color: "text-yellow-400" },
                { role: "Étudiant(e)", icon: Zap, color: "text-blue-400" },
                { role: "Prof de Yoga", icon: Heart, color: "text-pink-400" },
                { role: "Sans Emploi", icon: Users, color: "text-slate-400", count: 2 }
            ],
            avatars: ["JP", "S", "M", "L", "K", "T"]
        },
        {
            name: "Alliance Beta",
            members: 18,
            max: 24,
            missing: [
                { role: "Nutritionniste", icon: Heart, color: "text-green-400" },
                { role: "Avocat(e)", icon: Shield, color: "text-purple-400" },
                { role: "Menuisier", icon: Hammer, color: "text-orange-400" }
            ],
            avatars: ["A", "B", "C", "D", "E"]
        },
        {
            name: "Alliance Gamma",
            members: 7,
            max: 24,
            missing: [
                { role: "Web Dev", icon: Monitor, color: "text-blue-500" },
                { role: "Couturier", icon: Scissors, color: "text-pink-500" },
                { role: "Comptable", icon: Briefcase, color: "text-slate-300" }
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
                        className={`fixed z-[9999] flex flex-col ${isExpanded ? 'w-[95vw] max-w-5xl' : 'items-start'}`}
                    >
                        {isExpanded ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#0a0f1c] border border-slate-700 shadow-2xl rounded-3xl overflow-hidden w-full max-h-[90vh] overflow-y-auto"
                            >
                                {/* HEADER POPUP */}
                                <div className="p-8 border-b border-slate-800 flex justify-between items-start bg-gradient-to-r from-slate-900 to-slate-800">
                                    <div>
                                        <Badge className="bg-blue-600 mb-4 hover:bg-blue-700">Recrutement Actif</Badge>
                                        <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tight mb-2">
                                            3 Alliances recherchent <span className="text-blue-400">votre profil</span>
                                        </h2>
                                        <p className="text-slate-400 text-lg">
                                            Rejoignez un équipage incomplet et devenez la pièce manquante.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* GRID ALLIANCES */}
                                <div className="p-8 grid md:grid-cols-3 gap-8 bg-[#050505]">
                                    {alliances.map((alliance, i) => (
                                        <motion.div 
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col hover:border-blue-500/50 transition-all group relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors"></div>
                                            
                                            {/* Header Card */}
                                            <div className="flex justify-between items-start mb-6 relative z-10">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white mb-1">{alliance.name}</h3>
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                                        <Users className="h-3 w-3" />
                                                        <span>{alliance.members} / {alliance.max} membres</span>
                                                    </div>
                                                </div>
                                                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center font-black text-slate-500 border border-slate-700">
                                                    {alliance.name[9]}
                                                </div>
                                            </div>

                                            {/* Members Avatars */}
                                            <div className="flex -space-x-3 mb-8 relative z-10 pl-2">
                                                {alliance.avatars.map((av, j) => (
                                                    <div key={j} className="h-8 w-8 rounded-full bg-slate-800 border-2 border-[#0a0f1c] flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                        {av}
                                                    </div>
                                                ))}
                                                <div className="h-8 w-8 rounded-full bg-slate-800 border-2 border-[#0a0f1c] flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                    +{alliance.members - alliance.avatars.length}
                                                </div>
                                            </div>

                                            {/* Missing Profiles */}
                                            <div className="space-y-3 mb-8 flex-1 relative z-10">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Profils Recherchés :</p>
                                                {alliance.missing.map((role, k) => (
                                                    <div key={k} className="flex items-center gap-3 bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
                                                        <role.icon className={`h-4 w-4 ${role.color}`} />
                                                        <span className="text-sm text-slate-300 font-medium">{role.role}</span>
                                                        {role.count && (
                                                            <span className="ml-auto text-[10px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded">x{role.count}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* CTA */}
                                            <Button className="w-full bg-white text-black hover:bg-slate-200 font-bold uppercase tracking-wide relative z-10">
                                                Rejoindre {alliance.name}
                                            </Button>
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