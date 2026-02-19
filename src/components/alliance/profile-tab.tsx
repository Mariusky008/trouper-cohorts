"use client";

import { motion } from "framer-motion";
import { 
    Settings, LogOut, Trophy, Star, Bell, Lock, Shield, Zap, Target, Award, Sparkles, MapPin, Briefcase, Plus, Users, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function ProfileTab() {
    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-8">
            {/* HERO PROFILE HEADER */}
            <div className="relative rounded-3xl overflow-hidden bg-[#0a0f1c] border border-slate-800 p-8 md:p-12 group">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-pink-900/50"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-8 pt-12">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                        <Avatar className="h-32 w-32 border-4 border-[#0a0f1c] shadow-2xl relative z-10">
                            <AvatarFallback className="bg-slate-900 text-white text-4xl font-bold">JP</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black text-xs font-black px-3 py-1 rounded-full border-4 border-[#0a0f1c] z-20 flex items-center gap-1 shadow-lg">
                            <Star className="h-3 w-3 fill-current" /> Lvl 12
                        </div>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Jean-Philippe R.</h2>
                            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20">Product Designer</Badge>
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-4 text-slate-400 text-sm">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Paris, France</span>
                            <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> Freelance</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700 hover:text-white rounded-xl">
                            <Settings className="h-4 w-4 mr-2" /> Éditer
                        </Button>
                        <Button className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* STATS RAPIDES */}
                <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-slate-800/50">
                    <div className="text-center md:text-left">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Services Rendus</div>
                        <div className="text-2xl font-black text-blue-400 flex items-center justify-center md:justify-start gap-2">
                            <Zap className="h-5 w-5" /> 12
                        </div>
                    </div>
                    <div className="text-center md:text-left border-l border-slate-800 md:pl-8">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Fiabilité</div>
                        <div className="text-2xl font-black text-green-400 flex items-center justify-center md:justify-start gap-2">
                            <Shield className="h-5 w-5" /> 100%
                        </div>
                    </div>
                    <div className="text-center md:text-left border-l border-slate-800 md:pl-8">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Points Alliance</div>
                        <div className="text-2xl font-black text-yellow-400 flex items-center justify-center md:justify-start gap-2">
                            <Trophy className="h-5 w-5" /> 2,450
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* COLONNE GAUCHE : BADGES & SKILLS */}
                <div className="space-y-6">
                    <Card className="bg-[#0a0f1c] border-slate-800 p-6">
                        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                            <Award className="h-5 w-5 text-yellow-500" /> Trophées (3/12)
                        </h3>
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", tooltip: "Premier Service" },
                                { icon: Shield, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", tooltip: "Fiable" },
                                { icon: Star, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", tooltip: "Top 10%" },
                                { icon: Lock, color: "text-slate-600", bg: "bg-slate-800/50", border: "border-slate-800", tooltip: "Verrouillé" },
                                { icon: Lock, color: "text-slate-600", bg: "bg-slate-800/50", border: "border-slate-800", tooltip: "Verrouillé" },
                                { icon: Lock, color: "text-slate-600", bg: "bg-slate-800/50", border: "border-slate-800", tooltip: "Verrouillé" },
                                { icon: Lock, color: "text-slate-600", bg: "bg-slate-800/50", border: "border-slate-800", tooltip: "Verrouillé" },
                                { icon: Lock, color: "text-slate-600", bg: "bg-slate-800/50", border: "border-slate-800", tooltip: "Verrouillé" },
                            ].map((badge, i) => (
                                <div key={i} className={`aspect-square rounded-xl flex items-center justify-center border ${badge.border} ${badge.bg} ${badge.color} transition-transform hover:scale-110 cursor-help group relative`}>
                                    <badge.icon className="h-5 w-5" />
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="bg-[#0a0f1c] border-slate-800 p-6">
                        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-400" /> Compétences
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {["Figma", "Product Design", "React", "UX Research", "Branding"].map((skill, i) => (
                                <Badge key={i} variant="outline" className="border-slate-700 text-slate-300 bg-slate-800/30 hover:bg-slate-800 hover:text-white transition-colors py-1.5 px-3">
                                    {skill}
                                </Badge>
                            ))}
                            <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full p-0 border border-dashed border-slate-700 text-slate-500 hover:text-white hover:border-slate-500">
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* COLONNE DROITE : HISTORIQUE DÉTAILLÉ */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="bg-[#0a0f1c] border-slate-800 p-8 h-full">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Target className="h-5 w-5 text-blue-400" /> Journal de Bord
                            </h3>
                            <Button variant="ghost" className="text-xs text-slate-500 hover:text-white">Voir tout</Button>
                        </div>
                        
                        <div className="relative border-l border-slate-800 ml-3 space-y-8">
                            {[
                                { title: "Service Rendu : Relecture CV", user: "Marc P.", date: "Hier", points: "+50", type: "positive", icon: Zap },
                                { title: "Nouveau Badge : Premier Pas", user: "Système", date: "Il y a 2 jours", points: "Trophée", type: "neutral", icon: Award },
                                { title: "Service Reçu : Conseil Marketing", user: "Sophie L.", date: "Il y a 5 jours", points: "-50", type: "negative", icon: Shield },
                                { title: "Participation : Live Q&A", user: "Alliance", date: "Il y a 1 semaine", points: "+10", type: "positive", icon: Users },
                            ].map((item, i) => (
                                <div key={i} className="relative pl-8 group">
                                    <div className={`absolute -left-[17px] top-0 h-9 w-9 rounded-full border-4 border-[#0a0f1c] flex items-center justify-center transition-transform group-hover:scale-110 ${
                                        item.type === 'positive' ? 'bg-blue-500 text-white' : 
                                        item.type === 'negative' ? 'bg-orange-500 text-white' : 
                                        'bg-purple-500 text-white'
                                    }`}>
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    
                                    <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4 hover:bg-slate-900/60 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-white font-bold">{item.title}</h4>
                                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                                                item.type === 'positive' ? 'bg-blue-500/10 text-blue-400' : 
                                                item.type === 'negative' ? 'bg-orange-500/10 text-orange-400' : 
                                                'bg-purple-500/10 text-purple-400'
                                            }`}>
                                                {item.points} {item.type !== 'neutral' && 'pts'}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-sm mb-2">Avec <span className="text-white font-medium">{item.user}</span></p>
                                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium uppercase tracking-wide">
                                            <Clock className="h-3 w-3" /> {item.date}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}