"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, ChevronRight, Users, X, Hammer, Lightbulb, Monitor, Scissors, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StickyRecruitmentBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Afficher après 300px de scroll
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-50 flex flex-col items-end"
                >
                    {isExpanded ? (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-6 w-full md:w-[350px] relative overflow-hidden"
                        >
                            <button 
                                onClick={() => setIsExpanded(false)}
                                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 animate-pulse">
                                    <Briefcase className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Recrutement Actif</span>
                            </div>

                            <h3 className="text-white font-black text-lg leading-tight mb-2">
                                Il reste 12 places dans l'Alliance Alpha
                            </h3>
                            <p className="text-slate-400 text-xs mb-4">
                                Nous recherchons spécifiquement ces profils pour compléter l'équipe :
                            </p>

                            <div className="grid grid-cols-2 gap-2 mb-6">
                                {[
                                    { name: "Menuisier", icon: Hammer, slots: "1", color: "text-orange-400" },
                                    { name: "Électricien", icon: Lightbulb, slots: "1", color: "text-yellow-400" },
                                    { name: "Web Dev", icon: Monitor, slots: "1", color: "text-blue-400" },
                                    { name: "Couturier", icon: Scissors, slots: "1", color: "text-pink-400" },
                                ].map((role, i) => (
                                    <div key={i} className="bg-slate-800/50 p-2 rounded-lg border border-slate-700 flex items-center gap-2">
                                        <role.icon className={`h-3 w-3 ${role.color}`} />
                                        <span className="text-slate-200 text-xs font-bold">{role.name}</span>
                                        <span className="ml-auto text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">{role.slots}</span>
                                    </div>
                                ))}
                            </div>

                            <Button asChild className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wide text-xs h-10">
                                <a href="#join">Postuler Maintenant <ArrowRight className="h-3 w-3 ml-2" /></a>
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.button
                            onClick={() => setIsExpanded(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-slate-900 text-white p-1 pr-4 rounded-full shadow-xl border border-slate-700 flex items-center gap-3 group overflow-hidden"
                        >
                            <div className="bg-blue-600 h-10 w-10 rounded-full flex items-center justify-center shrink-0 relative">
                                <Users className="h-5 w-5" />
                                <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
                            </div>
                            <div className="text-left flex flex-col">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Alliance Alpha</span>
                                <span className="text-sm font-black text-white leading-none">12 places restantes</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors ml-1" />
                        </motion.button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}