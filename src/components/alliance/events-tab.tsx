"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Activity, ArrowUpRight, CheckCircle2, Heart, MessageSquare, Plus, 
    Star, Target, Trophy, Users, Zap, Clock, Shield, Search, MapPin,
    Calendar, Ticket, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function EventsTab() {
    const [isProposing, setIsProposing] = useState(false);
    const [events, setEvents] = useState([
        { id: 1, title: "Atelier Pitch", date: "Demain, 19h", type: "Workshop", attendees: 12, image: "bg-blue-900/20", organizer: "Sophie L." },
        { id: 2, title: "Session Q&A", date: "Jeudi, 18h", type: "Live", attendees: 8, image: "bg-purple-900/20", organizer: "Thomas D." },
        { id: 3, title: "Apéro Virtuel", date: "Vendredi, 20h", type: "Social", attendees: 20, image: "bg-green-900/20", organizer: "Karim B." },
    ]);
    const [newEvent, setNewEvent] = useState({ title: "", date: "", type: "Social", description: "" });

    const handleProposeEvent = () => {
        if (!newEvent.title) return;
        setEvents([...events, {
            id: Date.now(),
            title: newEvent.title,
            date: newEvent.date || "Date à définir",
            type: newEvent.type,
            attendees: 1,
            image: "bg-slate-800",
            organizer: "Moi"
        }]);
        setIsProposing(false);
        setNewEvent({ title: "", date: "", type: "Social", description: "" });
    };

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
                <div className="flex justify-between items-end">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-400" /> À Venir
                    </h3>
                    
                    <Dialog open={isProposing} onOpenChange={setIsProposing}>
                        <DialogTrigger asChild>
                            <Button className="bg-white text-black hover:bg-slate-200 font-bold">
                                <Plus className="h-4 w-4 mr-2" /> Proposer un événement
                            </Button>
                        </DialogTrigger>
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
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event, i) => (
                        <motion.div 
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 + 0.2 }}
                            className="bg-[#0a0f1c] border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-colors group flex flex-col"
                        >
                            <div className={`h-32 w-full ${event.image} flex items-center justify-center relative bg-cover bg-center`}>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c] to-transparent"></div>
                                <span className="relative z-10 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs font-bold text-white border border-white/10 uppercase tracking-wide">
                                    {event.type}
                                </span>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
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
                                
                                <div className="mt-auto pt-4 border-t border-slate-800/50">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-[10px] bg-slate-800 text-slate-400">{event.organizer[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs text-slate-500">Par {event.organizer}</span>
                                        </div>
                                        <span className="text-xs text-slate-500 font-medium">+{event.attendees} participants</span>
                                    </div>
                                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-800 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all">
                                        Je participe
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}