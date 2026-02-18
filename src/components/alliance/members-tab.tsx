"use client";

import { motion } from "framer-motion";
import { 
    Activity, ArrowUpRight, CheckCircle2, Heart, MessageSquare, Plus, 
    Star, Target, Trophy, Users, Zap, Clock, Shield, Search, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function MembersTab() {
    return (
        <div className="space-y-8">
            {/* EN-TÊTE */}
            <div className="flex justify-between items-center">
                <div className="flex gap-4">
                    <Button variant="outline" className="border-slate-800 text-white bg-slate-900/50 hover:bg-slate-800">Tous (24)</Button>
                    <Button variant="ghost" className="text-slate-400 hover:text-white">Mentors (3)</Button>
                    <Button variant="ghost" className="text-slate-400 hover:text-white">Proches (5)</Button>
                </div>
                <div className="flex items-center gap-2 bg-[#0a0f1c] border border-slate-800 rounded-full px-4 py-2">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Chercher une compétence..." 
                        className="bg-transparent border-none text-white text-sm focus:outline-none w-48"
                    />
                </div>
            </div>

            {/* GRILLE MEMBRES */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { name: "Sophie L.", role: "Designer UX", status: "Super-Allié", statusColor: "text-purple-400", services: 15, location: "Paris" },
                    { name: "Marc P.", role: "Développeur Fullstack", status: "Mentor", statusColor: "text-yellow-400", services: 42, location: "Lyon" },
                    { name: "Karim B.", role: "Avocat Droit Affaires", status: "Allié Actif", statusColor: "text-green-400", services: 8, location: "Bordeaux" },
                    { name: "Julie T.", role: "Coach Sportif", status: "Nouveau", statusColor: "text-blue-400", services: 2, location: "Lille" },
                    { name: "Thomas D.", role: "Entrepreneur Tech", status: "Super-Allié", statusColor: "text-purple-400", services: 21, location: "Paris" },
                    { name: "Emma R.", role: "Marketing Digital", status: "Allié Actif", statusColor: "text-green-400", services: 11, location: "Nantes" },
                ].map((member, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="group bg-[#0a0f1c] border border-slate-800 p-6 rounded-xl hover:border-slate-600 transition-all hover:-translate-y-1 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-slate-800 text-white">
                                <MessageSquare className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                            <Avatar className="h-16 w-16 border-2 border-slate-800 group-hover:border-slate-600 transition-colors">
                                <AvatarFallback className="bg-slate-900 text-white font-bold text-xl">{member.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-white font-bold text-lg">{member.name}</h3>
                                <p className="text-slate-400 text-sm">{member.role}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <MapPin className="h-3 w-3 text-slate-500" />
                                    <span className="text-slate-500 text-xs">{member.location}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-800/50">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Statut</span>
                                <span className={`font-bold ${member.statusColor} flex items-center gap-1`}>
                                    <Star className="h-3 w-3 fill-current" /> {member.status}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Services Rendus</span>
                                <span className="text-white font-bold">{member.services}</span>
                            </div>
                        </div>

                        <Button className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold border border-slate-800">
                            Voir Profil
                        </Button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}