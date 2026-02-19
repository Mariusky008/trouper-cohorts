import { motion } from "framer-motion";
import { 
    Activity, ArrowUpRight, CheckCircle2, Heart, MessageSquare, Plus, 
    Star, Target, Trophy, Users, Zap, Briefcase, Search, Hammer, Lightbulb, Monitor, Scissors
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function DashboardTab() {
    return (
        <div className="space-y-12 w-full pb-20">
            {/* HERO STATS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Points", value: "2,450", icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
                    { label: "Niveau", value: "Expert", icon: Trophy, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                    { label: "Rendus", value: "12", icon: Zap, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                    { label: "Reçus", value: "8", icon: Heart, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`relative overflow-hidden rounded-3xl border ${stat.border} ${stat.bg} p-6 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform duration-300`}
                    >
                        <div className={`mb-3 p-3 rounded-2xl ${stat.bg} border ${stat.border} shadow-lg`}>
                            <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <h3 className="text-3xl font-black text-white tracking-tight mb-1">{stat.value}</h3>
                        <p className={`text-xs font-bold uppercase tracking-widest ${stat.color} opacity-80`}>{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* COLONNE GAUCHE : PROGRESSION & MISSION DU JOUR */}
                <div className="lg:col-span-2 space-y-8">
                    {/* BARRE DE PROGRESSION */}
                    <div className="bg-[#0a0f1c] border border-slate-800 rounded-3xl p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full group-hover:bg-blue-600/20 transition-all"></div>
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold uppercase tracking-widest text-[10px] mb-3">
                                        <Target className="h-3 w-3" /> Objectif Mentor
                                    </div>
                                    <h3 className="text-2xl font-black text-white">Niveau Suivant : Mentor</h3>
                                    <p className="text-slate-400 text-sm mt-2 font-medium">
                                        Plus que <span className="text-white font-bold">550 points</span> pour débloquer l'accès aux événements exclusifs.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">82%</span>
                                </div>
                            </div>
                            
                            <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: "82%" }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* ACTIVITÉ RÉCENTE */}
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6 px-2">
                            <Activity className="h-5 w-5 text-green-400" /> Le Flux de l'Alliance
                        </h3>
                        <div className="space-y-4">
                            {[
                                { user: "Sarah M.", action: "a aidé", target: "Thomas D.", desc: "Relecture de contrat freelance", time: "Il y a 2h", points: "+50 pts", type: "help" },
                                { user: "Karim B.", action: "a partagé", target: "L'Alliance", desc: "Opportunité de mission UX Design", time: "Il y a 4h", points: "+20 pts", type: "share" },
                                { user: "Julie L.", action: "est passée", target: "Expert", desc: "Félicitations pour son engagement !", time: "Hier", points: "LEVEL UP", type: "levelup" },
                            ].map((item, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-[#0a0f1c] border border-slate-800 p-5 rounded-2xl flex items-start gap-4 hover:border-slate-700 transition-colors group"
                                >
                                    <div className="relative">
                                        <Avatar className="h-12 w-12 border-2 border-slate-800 group-hover:border-slate-600 transition-colors">
                                            <AvatarFallback className="bg-slate-800 text-slate-400 font-bold">{item.user[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-[#0a0f1c] flex items-center justify-center text-[10px] ${
                                            item.type === 'help' ? 'bg-blue-500 text-white' : 
                                            item.type === 'share' ? 'bg-purple-500 text-white' : 
                                            'bg-yellow-500 text-black'
                                        }`}>
                                            {item.type === 'help' ? <Zap className="h-3 w-3" /> : 
                                             item.type === 'share' ? <MessageSquare className="h-3 w-3" /> : 
                                             <Trophy className="h-3 w-3" />}
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm text-white truncate pr-2">
                                                <span className="font-bold hover:underline cursor-pointer">{item.user}</span> 
                                                <span className="text-slate-500 mx-1">{item.action}</span> 
                                                <span className={`font-bold ${item.type === 'levelup' ? 'text-yellow-400' : 'text-white'}`}>{item.target}</span>
                                            </p>
                                            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">{item.time}</span>
                                        </div>
                                        <p className="text-slate-400 text-sm mt-1 line-clamp-1">{item.desc}</p>
                                    </div>
                                    
                                    <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap ${
                                        item.type === 'levelup' 
                                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                                    }`}>
                                        {item.points}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COLONNE DROITE : À FAIRE & ACTIONS */}
                <div className="space-y-8">
                    <div className="bg-[#0a0f1c] border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full"></div>
                        
                        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6 relative z-10">
                            <CheckCircle2 className="h-5 w-5 text-orange-400" /> À Faire (Urgent)
                        </h3>

                        <div className="space-y-4 relative z-10">
                            <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-2xl border border-slate-800 hover:border-orange-500/30 transition-colors group">
                                <div className="flex justify-between items-start mb-3">
                                    <Badge variant="outline" className="border-orange-500/30 text-orange-400 bg-orange-500/10 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                        J-2
                                    </Badge>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-500 hover:text-green-400 -mr-2 -mt-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <h4 className="font-bold text-white text-sm mb-1">Feedback Landing Page</h4>
                                <p className="text-slate-500 text-xs mb-3">Pour <span className="text-slate-300 font-medium">Marc P.</span></p>
                                <Button size="sm" className="w-full h-8 bg-white text-black hover:bg-slate-200 text-xs font-bold rounded-lg">
                                    Voir la demande
                                </Button>
                            </div>

                            <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800/50 opacity-60 hover:opacity-100 transition-opacity">
                                <div className="flex justify-between items-start mb-3">
                                    <Badge variant="outline" className="border-slate-700 text-slate-500 bg-slate-800 text-[10px] font-bold uppercase tracking-wider">
                                        J-5
                                    </Badge>
                                </div>
                                <h4 className="font-bold text-white text-sm mb-1">Café virtuel</h4>
                                <p className="text-slate-500 text-xs">Avec <span className="text-slate-300 font-medium">Sophie L.</span></p>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-800/50">
                            <Button className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]">
                                <Plus className="h-5 w-5 mr-2" /> Proposer un Service
                            </Button>
                        </div>
                    </div>

                    {/* RAPPEL GAMIFICATION */}
                    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-3xl p-6 text-center">
                        <Trophy className="h-8 w-8 text-purple-400 mx-auto mb-3" />
                        <h4 className="font-bold text-white text-sm mb-1">Niveau Expert</h4>
                        <p className="text-xs text-purple-300 mb-4">Tu fais partie du top 15% de l'Alliance !</p>
                        <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-white w-full rounded-xl text-xs font-bold">
                            Voir mes avantages
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}