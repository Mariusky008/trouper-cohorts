"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Calendar, MapPin, Clock, Plus, Star, Users, ArrowUpRight, Trophy, Zap, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function EventsTab() {
    const [isProposing, setIsProposing] = useState(false);
    const [events, setEvents] = useState([
        { id: 1, title: "Atelier Pitch", date: "Demain, 19h", type: "Workshop", attendees: 12, organizer: "Sophie L.", image: "bg-blue-600", points: 50 },
        { id: 2, title: "Session Q&A", date: "Jeudi, 18h", type: "Live", attendees: 8, organizer: "Thomas D.", image: "bg-purple-600", points: 30 },
        { id: 3, title: "Apéro Virtuel", date: "Vendredi, 20h", type: "Social", attendees: 20, organizer: "Karim B.", image: "bg-green-600", points: 20 },
    ]);
    const [newEvent, setNewEvent] = useState({ title: "", date: "", type: "Social", description: "" });

    const handleProposeEvent = () => {
        // ... (logique existante)
    };

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-12">
            {/* HERO EVENT (RITUEL MAJEUR) */}
            <div className="relative rounded-3xl overflow-hidden bg-[#0a0f1c] border border-orange-500/30 p-8 md:p-12 group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-900/40 via-red-900/40 to-purple-900/40 group-hover:opacity-80 transition-opacity"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500/20 blur-[100px] rounded-full animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-6 text-center md:text-left max-w-2xl">
                        <Badge variant="outline" className="border-orange-500 text-orange-400 bg-orange-500/10 px-4 py-1 text-xs font-black uppercase tracking-widest animate-pulse">
                            <Star className="h-3 w-3 mr-2 fill-current" /> Rituel Légendaire
                        </Badge>
                        
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                            Le Grand Repas <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">d'Alliance</span>
                        </h2>
                        
                        <p className="text-lg text-slate-300 font-medium leading-relaxed">
                            Le moment de vérité. Célébration des victoires, validation des pactes et festin des héros.
                            <span className="block mt-2 text-orange-300 font-bold">Présence obligatoire pour valider le trimestre.</span>
                        </p>

                        <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm font-bold text-white pt-2">
                            <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full border border-white/10">
                                <Calendar className="h-4 w-4 text-orange-400" /> 15 Octobre 2026
                            </div>
                            <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full border border-white/10">
                                <MapPin className="h-4 w-4 text-orange-400" /> Paris, Le Perchoir
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 w-full md:w-auto min-w-[200px]">
                        <Button size="lg" className="h-16 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-wide text-lg shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] hover:scale-105 transition-all rounded-2xl">
                            Je participe !
                        </Button>
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                            <Users className="h-3 w-3" /> 18 membres inscrits
                        </div>
                    </div>
                </div>
            </div>

            {/* BARRE D'ACTION & FILTRES */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-800 pb-6">
                <div>
                    <h3 className="text-3xl font-black text-white flex items-center gap-3">
                        <Calendar className="h-8 w-8 text-blue-500" /> Calendrier
                    </h3>
                    <p className="text-slate-400 mt-2 font-medium">Participe aux événements pour gagner des points d'expérience.</p>
                </div>
                
                <Dialog open={isProposing} onOpenChange={setIsProposing}>
                    <DialogTrigger asChild>
                        <Button className="bg-white text-black hover:bg-slate-200 font-black text-sm uppercase tracking-wide px-6 py-6 rounded-xl shadow-lg hover:shadow-white/20 transition-all">
                            <Plus className="h-5 w-5 mr-2" /> Créer un Event (+50 pts)
                        </Button>
                    </DialogTrigger>
                    {/* ... (Contenu Dialog inchangé) ... */}
                    <DialogContent className="bg-[#0a0f1c] border-slate-800 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Créer un événement pour l'Alliance</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400">Titre</label>
                                <Input 
                                    placeholder="Ex: Apéro Zoom, Atelier Figma..." 
                                    className="bg-slate-900 border-slate-700 text-white"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400">Date & Heure</label>
                                    <Input 
                                        placeholder="Ex: Vendredi 18h" 
                                        className="bg-slate-900 border-slate-700 text-white"
                                        value={newEvent.date}
                                        onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400">Type</label>
                                    <select 
                                        className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={newEvent.type}
                                        onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                                    >
                                        <option value="Social">Social / Apéro</option>
                                        <option value="Workshop">Atelier / Workshop</option>
                                        <option value="Live">Live / Q&A</option>
                                        <option value="Sport">Sport / Activité</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400">Description</label>
                                <Textarea 
                                    placeholder="Dites-en plus..." 
                                    className="bg-slate-900 border-slate-700 text-white min-h-[100px]"
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                                />
                            </div>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 font-bold" onClick={handleProposeEvent}>
                                Publier l'événement
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* GRILLE DES EVENTS (CARTES GAMIFIÉES) */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event, i) => (
                    <motion.div 
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative h-full"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${event.type === 'Workshop' ? 'from-blue-600/20' : event.type === 'Live' ? 'from-purple-600/20' : 'from-green-600/20'} to-slate-900/50 rounded-3xl transform transition-transform duration-300 group-hover:scale-[1.03] group-hover:shadow-2xl`}></div>
                        
                        <div className="relative bg-[#0a0f1c] border border-slate-800 rounded-3xl p-6 flex flex-col h-full hover:border-slate-600 transition-colors overflow-hidden">
                            {/* Header Image Abstraite */}
                            <div className={`absolute top-0 right-0 w-32 h-32 ${event.image} opacity-20 blur-[40px] rounded-full`}></div>
                            
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <Badge variant="outline" className={`border-slate-700 bg-slate-800 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider`}>
                                    {event.type}
                                </Badge>
                                <div className="flex items-center gap-1 text-yellow-400 font-black text-xs bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20">
                                    <Zap className="h-3 w-3" /> +{event.points} pts
                                </div>
                            </div>

                            <div className="mb-6 relative z-10">
                                <h3 className="text-2xl font-black text-white mb-2 leading-tight group-hover:text-blue-400 transition-colors">{event.title}</h3>
                                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                                    <Clock className="h-4 w-4 text-slate-500" /> {event.date}
                                </div>
                            </div>

                            <div className="mt-auto space-y-4 relative z-10">
                                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8 border border-slate-700">
                                            <AvatarFallback className="bg-slate-800 text-slate-400 text-xs font-bold">{event.organizer[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="text-xs">
                                            <div className="text-slate-500 font-bold uppercase">Organisateur</div>
                                            <div className="text-white font-bold">{event.organizer}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-slate-500 text-[10px] font-bold uppercase">Inscrits</div>
                                        <div className="text-white font-bold flex items-center justify-end gap-1">
                                            <Users className="h-3 w-3" /> {event.attendees}
                                        </div>
                                    </div>
                                </div>

                                <Button className="w-full h-12 bg-white text-black hover:bg-blue-500 hover:text-white font-black text-sm uppercase tracking-wide rounded-xl transition-all shadow-lg hover:shadow-blue-900/20 group-hover:scale-[1.02]">
                                    Rejoindre
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}