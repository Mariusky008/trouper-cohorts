"use client";

import { motion } from "framer-motion";
import { 
    Activity, ArrowUpRight, CheckCircle2, Heart, MessageSquare, Plus, 
    Star, Target, Trophy, Users, Zap, Clock, Shield, Search, MapPin,
    Calendar, Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function EventsTab() {
    return (
        <div className="space-y-8">
            {/* RITUEL TRIMESTRIEL */}
            <Card className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-slate-800 p-8 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold uppercase tracking-widest text-xs mb-2">
                            <Star className="h-3 w-3 fill-current" /> Rituel Trimestriel
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Le Grand Repas d'Alliance</h2>
                        <p className="text-slate-400 max-w-lg leading-relaxed">
                            C'est le moment de se retrouver. Un dîner offert par Popey Academy pour célébrer vos succès, renforcer les liens et valider votre engagement pour le prochain trimestre.
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-300">
                            <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-orange-400" /> 15 Octobre 2026</span>
                            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-orange-400" /> Paris, Le Perchoir</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 w-full md:w-auto">
                        <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-wide px-8 py-6 rounded-full shadow-lg shadow-orange-900/20">
                            Je confirme ma présence
                        </Button>
                        <p className="text-center text-xs text-slate-500 uppercase font-bold tracking-widest">
                            Choix d'Alliance requis
                        </p>
                    </div>
                </div>
            </Card>

            {/* ÉVÉNEMENTS À VENIR */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-400" /> À Venir
                </h3>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { title: "Atelier Pitch", date: "Demain, 19h", type: "Workshop", attendees: 12, image: "bg-blue-900/20" },
                        { title: "Session Q&A", date: "Jeudi, 18h", type: "Live", attendees: 8, image: "bg-purple-900/20" },
                        { title: "Apéro Virtuel", date: "Vendredi, 20h", type: "Social", attendees: 20, image: "bg-green-900/20" },
                    ].map((event, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 + 0.2 }}
                            className="bg-[#0a0f1c] border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-colors group"
                        >
                            <div className={`h-32 w-full ${event.image} flex items-center justify-center relative`}>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c] to-transparent"></div>
                                <span className="relative z-10 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs font-bold text-white border border-white/10 uppercase tracking-wide">
                                    {event.type}
                                </span>
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">{event.title}</h4>
                                        <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                                            <Clock className="h-3 w-3" /> {event.date}
                                        </p>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-slate-400 hover:text-white hover:bg-slate-800">
                                        <ArrowUpRight className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-[-8px]">
                                    <div className="flex -space-x-2">
                                        {[1,2,3].map(i => (
                                            <div key={i} className="h-6 w-6 rounded-full bg-slate-700 border-2 border-[#0a0f1c]" />
                                        ))}
                                    </div>
                                    <span className="text-xs text-slate-500 ml-4 font-medium">+{event.attendees} participants</span>
                                </div>
                                <Button className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-800">
                                    S'inscrire
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}