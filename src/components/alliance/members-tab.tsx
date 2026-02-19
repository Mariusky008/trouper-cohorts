"use client";

import { motion } from "framer-motion";
import { 
    MessageSquare, Search, MapPin, Zap, Crown, Shield, Star, Award, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function MembersTab() {
    return (
        <div className="space-y-12 max-w-6xl mx-auto pb-20">
            {/* HERO & SEARCH */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2">L'Équipage</h2>
                    <p className="text-slate-400 font-medium">24 talents unis pour réussir. <span className="text-white font-bold">Trouve l'allié qu'il te faut.</span></p>
                </div>
                
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100"></div>
                    <div className="relative bg-[#0a0f1c] border border-slate-700 focus-within:border-blue-500 rounded-full flex items-center px-4 py-3 shadow-lg transition-colors">
                        <Search className="h-5 w-5 text-slate-400 mr-3" />
                        <input 
                            type="text" 
                            placeholder="Compétence, ville, prénom..." 
                            className="bg-transparent border-none text-white text-sm focus:outline-none w-full placeholder:text-slate-600 font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* FILTRES RAPIDES */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {["Tous", "Mentors 👑", "Top Contributeurs 🔥", "Nouveaux 🌱", "Disponibles ✅"].map((filter, i) => (
                    <Button 
                        key={i}
                        variant="outline" 
                        className={`rounded-full border-slate-800 bg-[#0a0f1c] text-slate-400 hover:text-white hover:border-slate-600 font-bold text-xs uppercase tracking-wide px-6 py-2 h-auto transition-all ${i === 0 ? 'bg-white text-black hover:bg-slate-200 border-white' : ''}`}
                    >
                        {filter}
                    </Button>
                ))}
            </div>

            {/* GRILLE MEMBRES */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[
                    { name: "Sophie L.", role: "Designer UX", status: "Super-Allié", statusColor: "text-purple-400", services: 15, location: "Paris", avatar: "SL", level: 12, topSkill: "Figma" },
                    { name: "Marc P.", role: "Dev Fullstack", status: "Mentor", statusColor: "text-yellow-400", services: 42, location: "Lyon", avatar: "MP", level: 24, topSkill: "React" },
                    { name: "Karim B.", role: "Avocat Affaires", status: "Allié Actif", statusColor: "text-green-400", services: 8, location: "Bordeaux", avatar: "KB", level: 5, topSkill: "Droit" },
                    { name: "Julie T.", role: "Coach Sportif", status: "Nouveau", statusColor: "text-blue-400", services: 2, location: "Lille", avatar: "JT", level: 2, topSkill: "Mental" },
                    { name: "Thomas D.", role: "Entrepreneur", status: "Super-Allié", statusColor: "text-purple-400", services: 21, location: "Paris", avatar: "TD", level: 18, topSkill: "Sales" },
                    { name: "Emma R.", role: "Marketing", status: "Allié Actif", statusColor: "text-green-400", services: 11, location: "Nantes", avatar: "ER", level: 9, topSkill: "SEO" },
                    { name: "Lucas V.", role: "Vidéaste", status: "Nouveau", statusColor: "text-blue-400", services: 1, location: "Marseille", avatar: "LV", level: 1, topSkill: "Montage" },
                    { name: "Sarah J.", role: "Copywriter", status: "Super-Allié", statusColor: "text-purple-400", services: 28, location: "Remote", avatar: "SJ", level: 20, topSkill: "Écriture" },
                ].map((member, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="group relative"
                    >
                        {/* Carte Arrière-plan (Effet Glow) */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl transform transition-transform duration-300 group-hover:scale-[1.03] group-hover:shadow-2xl ${
                            member.status === "Mentor" ? "group-hover:shadow-yellow-900/20" : 
                            member.status === "Super-Allié" ? "group-hover:shadow-purple-900/20" : 
                            "group-hover:shadow-blue-900/20"
                        }`}></div>

                        {/* Contenu Carte */}
                        <div className="relative bg-[#0a0f1c] border border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center h-full hover:border-slate-600 transition-colors">
                            
                            {/* Badge Niveau */}
                            <div className="absolute top-4 right-4 bg-slate-900 border border-slate-800 rounded-full px-2 py-0.5 text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Award className="h-3 w-3" /> Lvl {member.level}
                            </div>

                            {/* Avatar & Status */}
                            <div className="relative mb-4">
                                <div className={`absolute inset-0 rounded-full blur-lg opacity-20 ${member.statusColor.replace('text', 'bg')}`}></div>
                                <Avatar className="h-20 w-20 border-2 border-slate-800 group-hover:border-white transition-colors relative z-10">
                                    <AvatarFallback className={`bg-slate-900 text-white font-bold text-2xl ${member.status === 'Mentor' ? 'text-yellow-400' : ''}`}>
                                        {member.avatar}
                                    </AvatarFallback>
                                </Avatar>
                                {member.status === "Mentor" && (
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-yellow-400 shadow-lg flex items-center gap-1 z-20 whitespace-nowrap">
                                        <Crown className="h-3 w-3" /> Mentor
                                    </div>
                                )}
                            </div>

                            {/* Infos */}
                            <div className="mb-6">
                                <h3 className="text-white font-bold text-lg leading-tight mb-1 group-hover:text-blue-400 transition-colors">{member.name}</h3>
                                <p className="text-slate-400 text-sm font-medium mb-2">{member.role}</p>
                                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                    <MapPin className="h-3 w-3" /> {member.location}
                                </div>
                            </div>

                            {/* Stats & Skills */}
                            <div className="w-full space-y-3 mt-auto">
                                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800 flex justify-between items-center">
                                    <span className="text-xs text-slate-500 font-bold uppercase">Top Skill</span>
                                    <Badge variant="outline" className="border-blue-500/20 text-blue-400 bg-blue-500/10 text-[10px] font-bold">
                                        {member.topSkill}
                                    </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-900/30 rounded-lg p-2 border border-slate-800/50">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">Services</div>
                                        <div className="text-sm font-bold text-white">{member.services}</div>
                                    </div>
                                    <div className="bg-slate-900/30 rounded-lg p-2 border border-slate-800/50">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">Réactivité</div>
                                        <div className="text-sm font-bold text-green-400">top 10%</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <Button size="sm" className="w-full bg-white text-black hover:bg-slate-200 font-bold text-xs h-9">
                                        Profil
                                    </Button>
                                    <Button size="sm" variant="outline" className="w-full border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 h-9">
                                        <MessageSquare className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}