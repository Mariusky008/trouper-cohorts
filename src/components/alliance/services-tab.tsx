"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
    Activity, ArrowUpRight, CheckCircle2, Heart, MessageSquare, Plus, 
    Star, Target, Trophy, Users, Zap, Clock, Shield, Search, Timer, Hourglass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function ServicesTab() {
    const [reservedServices, setReservedServices] = useState<number[]>([]);

    const toggleReservation = (id: number) => {
        if (reservedServices.includes(id)) {
            setReservedServices(reservedServices.filter(s => s !== id));
        } else {
            setReservedServices([...reservedServices, id]);
        }
    };

    return (
        <div className="space-y-8">
            {/* EN-TÊTE ET FILTRES */}
            <div className="flex justify-between items-center">
                <div className="flex gap-4">
                    <Button variant="outline" className="border-slate-800 text-white bg-slate-900/50 hover:bg-slate-800">Tout</Button>
                    <Button variant="ghost" className="text-slate-400 hover:text-white">À Rendre (Disponibles)</Button>
                    <Button variant="ghost" className="text-slate-400 hover:text-white">Mes Échanges</Button>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    <Plus className="h-4 w-4 mr-2" /> Demander un Service
                </Button>
            </div>

            {/* OFFRES DISPONIBLES (MARKETPLACE) */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" /> Opportunités à Saisir (Services à Rendre)
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                    {[
                        { id: 1, title: "Aide déménagement (Bras)", user: "Thomas D.", deadline: "Samedi 14h", duration: "3h", points: "+80 pts", urgent: true, timer: "48h" },
                        { id: 2, title: "Review Code React/Next.js", user: "Sarah M.", deadline: "Avant demain soir", duration: "1h", points: "+50 pts", urgent: false, timer: "24h" },
                        { id: 3, title: "Conseil Création Statuts", user: "Karim B.", deadline: "Flexible", duration: "30min", points: "+30 pts", urgent: false, timer: "72h" },
                        { id: 4, title: "Prêt Matériel Vidéo", user: "Emma R.", deadline: "Mardi prochain", duration: "N/A", points: "+20 pts", urgent: false, timer: "72h" },
                    ].map((offer, i) => {
                        const isReserved = reservedServices.includes(offer.id);
                        return (
                            <motion.div 
                                key={offer.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card className={`bg-[#0a0f1c] border p-6 relative overflow-hidden transition-all ${isReserved ? 'border-green-500/50 bg-green-900/5' : 'border-slate-800 hover:border-slate-600'}`}>
                                    {offer.urgent && !isReserved && (
                                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest rounded-bl-lg">
                                            Urgent
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border border-slate-700">
                                                <AvatarFallback className="bg-slate-800 text-slate-300">{offer.user[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h4 className="font-bold text-white text-lg leading-tight">{offer.title}</h4>
                                                <p className="text-slate-500 text-xs">Demandé par {offer.user}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="border-yellow-500/20 text-yellow-400 bg-yellow-500/10">
                                            {offer.points}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/50 flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                            <div>
                                                <span className="block text-[10px] text-slate-500 uppercase font-bold">Durée est.</span>
                                                <span className="text-sm text-slate-300 font-medium">{offer.duration}</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/50 flex items-center gap-2">
                                            <Timer className="h-4 w-4 text-slate-400" />
                                            <div>
                                                <span className="block text-[10px] text-slate-500 uppercase font-bold">Deadline</span>
                                                <span className="text-sm text-slate-300 font-medium">{offer.deadline}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {isReserved ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-green-400 text-sm font-bold bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                                                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Réservé par toi</span>
                                                <span className="flex items-center gap-1 text-xs uppercase tracking-wide"><Hourglass className="h-3 w-3 animate-pulse" /> Expire dans {offer.timer}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" className="flex-1 bg-white text-black hover:bg-slate-200 font-bold">
                                                    Contacter {offer.user.split(' ')[0]}
                                                </Button>
                                                <Button size="sm" variant="outline" className="border-red-900/30 text-red-400 hover:bg-red-900/10 hover:text-red-300" onClick={() => toggleReservation(offer.id)}>
                                                    Annuler
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button 
                                            className="w-full bg-slate-100 text-black hover:bg-white font-bold group"
                                            onClick={() => toggleReservation(offer.id)}
                                        >
                                            <span className="group-hover:hidden">Réserver ce service</span>
                                            <span className="hidden group-hover:inline-flex items-center gap-2">
                                                <Clock className="h-4 w-4" /> S'engager (Chrono {offer.timer})
                                            </span>
                                        </Button>
                                    )}
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* DETTE OBLIGATOIRE */}
            <Card className="bg-gradient-to-r from-red-900/10 to-orange-900/10 border-slate-800 p-6 flex justify-between items-center relative overflow-hidden mt-8">
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

            {/* LISTE HISTORIQUE */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-8">
                    <Activity className="h-5 w-5 text-blue-400" /> Historique Récent
                </h3>
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