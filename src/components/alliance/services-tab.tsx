"use client";

import { motion } from "framer-motion";
import { 
    Activity, ArrowUpRight, CheckCircle2, Heart, MessageSquare, Plus, 
    Star, Target, Trophy, Users, Zap, Clock, Shield, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ServicesTab() {
    return (
        <div className="space-y-8">
            {/* EN-TÊTE ET FILTRES */}
            <div className="flex justify-between items-center">
                <div className="flex gap-4">
                    <Button variant="outline" className="border-slate-800 text-white bg-slate-900/50 hover:bg-slate-800">Tout</Button>
                    <Button variant="ghost" className="text-slate-400 hover:text-white">Rendus (12)</Button>
                    <Button variant="ghost" className="text-slate-400 hover:text-white">Reçus (8)</Button>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    <Plus className="h-4 w-4 mr-2" /> Nouveau Service
                </Button>
            </div>

            {/* DETTE OBLIGATOIRE */}
            <Card className="bg-gradient-to-r from-red-900/10 to-orange-900/10 border-slate-800 p-6 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full"></div>
                <div className="relative z-10">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-2">
                        <Shield className="h-5 w-5 text-orange-500" /> Dette de Service
                    </h3>
                    <p className="text-slate-400 text-sm max-w-lg">
                        Rappel : Pour chaque service reçu, tu t'engages à en rendre un. <br/>
                        <span className="text-orange-400 font-bold">Actuellement : +4 Services Rendus (Excellent !)</span>
                    </p>
                </div>
                <div className="text-right">
                    <span className="block text-3xl font-black text-white">+4</span>
                    <span className="text-xs text-slate-500 uppercase font-bold">Solde positif</span>
                </div>
            </Card>

            {/* LISTE DES SERVICES */}
            <div className="space-y-4">
                {[
                    { type: "rendu", title: "Relecture Landing Page", user: "Marc P.", date: "Il y a 2 jours", status: "Terminé", points: "+50" },
                    { type: "reçu", title: "Intro Investisseur", user: "Sophie L.", date: "Il y a 5 jours", status: "Terminé", points: "-50" },
                    { type: "rendu", title: "Conseil Juridique", user: "Karim B.", date: "Il y a 1 semaine", status: "Terminé", points: "+50" },
                    { type: "rendu", title: "Aide Déménagement", user: "Julie T.", date: "Il y a 2 semaines", status: "Terminé", points: "+50" },
                ].map((service, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[#0a0f1c] border border-slate-800 p-6 rounded-xl flex items-center justify-between hover:bg-slate-900/50 transition-colors cursor-pointer group"
                    >
                        <div className="flex items-center gap-6">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${service.type === 'rendu' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                                {service.type === 'rendu' ? <Zap className="h-6 w-6" /> : <Heart className="h-6 w-6" />}
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{service.title}</h4>
                                <p className="text-slate-500 text-sm flex items-center gap-2">
                                    {service.type === 'rendu' ? 'Pour' : 'De'} <span className="text-slate-300 font-medium">{service.user}</span> • {service.date}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold uppercase tracking-wide border border-green-500/20">
                                {service.status}
                            </span>
                            <span className={`font-black text-lg ${service.type === 'rendu' ? 'text-blue-400' : 'text-slate-500'}`}>
                                {service.points} pts
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}