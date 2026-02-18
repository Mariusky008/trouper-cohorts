"use client";

import { motion } from "framer-motion";
import { 
    Activity, ArrowUpRight, CheckCircle2, Heart, MessageSquare, Plus, 
    Star, Target, Trophy, Users, Zap, Clock, Shield, Search, MapPin,
    Calendar, Ticket, Settings, Bell, Lock, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ProfileTab() {
    return (
        <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-8">
                {/* PROFIL CARD */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="bg-[#0a0f1c] border-slate-800 p-8 text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-slate-400 hover:text-white">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <div className="relative inline-block mb-6">
                            <Avatar className="h-32 w-32 border-4 border-slate-800 group-hover:border-blue-500 transition-colors shadow-2xl">
                                <AvatarFallback className="bg-slate-900 text-white text-4xl font-bold">JP</AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-[#0a0f1c]">
                                Lvl 12
                            </div>
                        </div>
                        
                        <h2 className="text-2xl font-black text-white">Jean-Philippe R.</h2>
                        <p className="text-slate-400 text-sm mt-1">Product Designer</p>
                        
                        <div className="flex justify-center gap-4 mt-6">
                            <div className="text-center">
                                <span className="block font-bold text-white text-lg">12</span>
                                <span className="text-xs text-slate-500 uppercase font-bold">Rendus</span>
                            </div>
                            <div className="h-8 w-px bg-slate-800" />
                            <div className="text-center">
                                <span className="block font-bold text-white text-lg">8</span>
                                <span className="text-xs text-slate-500 uppercase font-bold">Reçus</span>
                            </div>
                            <div className="h-8 w-px bg-slate-800" />
                            <div className="text-center">
                                <span className="block font-bold text-yellow-400 text-lg">2.4k</span>
                                <span className="text-xs text-slate-500 uppercase font-bold">Points</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-800 space-y-4">
                            <Button variant="outline" className="w-full border-slate-800 text-slate-300 hover:bg-slate-800">
                                Modifier Profil
                            </Button>
                            <Button variant="ghost" className="w-full text-red-400 hover:text-red-300 hover:bg-red-900/10">
                                <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                            </Button>
                        </div>
                    </Card>

                    {/* BADGES */}
                    <Card className="bg-[#0a0f1c] border-slate-800 p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-yellow-500" /> Badges & Trophées
                        </h3>
                        <div className="grid grid-cols-4 gap-2">
                            {[1,2,3,4,5,6,7,8].map((badge, i) => (
                                <div key={i} className={`aspect-square rounded-lg flex items-center justify-center ${i < 3 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-slate-900 text-slate-700 border border-slate-800 grayscale opacity-50'}`}>
                                    <Star className="h-5 w-5" />
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* HISTORIQUE & STATS */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="bg-[#0a0f1c] border-slate-800 p-8">
                        <h3 className="text-xl font-bold text-white mb-6">Activité Récente</h3>
                        <div className="space-y-6 relative pl-4 border-l-2 border-slate-800 ml-2">
                            {[
                                { title: "Service Rendu : Relecture CV", date: "Hier", points: "+50 pts", type: "positive" },
                                { title: "Nouveau Badge : Premier Pas", date: "Il y a 2 jours", points: "Trophée", type: "neutral" },
                                { title: "Service Reçu : Conseil Marketing", date: "Il y a 5 jours", points: "-50 pts", type: "negative" },
                                { title: "Participation : Live Q&A", date: "Il y a 1 semaine", points: "+10 pts", type: "positive" },
                            ].map((item, i) => (
                                <div key={i} className="relative pl-6">
                                    <div className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-[#0a0f1c] ${item.type === 'positive' ? 'bg-green-500' : item.type === 'negative' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-white font-bold text-sm">{item.title}</h4>
                                            <p className="text-slate-500 text-xs">{item.date}</p>
                                        </div>
                                        <span className={`text-xs font-bold ${item.type === 'positive' ? 'text-green-400' : item.type === 'negative' ? 'text-red-400' : 'text-blue-400'}`}>
                                            {item.points}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="bg-[#0a0f1c] border-slate-800 p-6">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <Bell className="h-4 w-4 text-blue-400" /> Notifications
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-sm">Services</span>
                                    <div className="h-5 w-9 bg-blue-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 h-3 w-3 bg-white rounded-full"></div></div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-sm">Événements</span>
                                    <div className="h-5 w-9 bg-blue-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 h-3 w-3 bg-white rounded-full"></div></div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-sm">Messages</span>
                                    <div className="h-5 w-9 bg-slate-700 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 h-3 w-3 bg-white rounded-full"></div></div>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-[#0a0f1c] border-slate-800 p-6">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <Lock className="h-4 w-4 text-slate-400" /> Confidentialité
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-sm">Profil Public</span>
                                    <div className="h-5 w-9 bg-blue-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 h-3 w-3 bg-white rounded-full"></div></div>
                                </div>
                                <Button variant="link" className="text-slate-500 text-xs p-0 h-auto">
                                    Changer mot de passe
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}