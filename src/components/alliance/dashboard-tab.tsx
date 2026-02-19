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
        <div className="space-y-8">
            {/* STATS RAPIDES */}
            <div className="grid md:grid-cols-4 gap-4">
                {[
                    { label: "Services Rendus", value: "12", icon: Zap, color: "text-blue-400" },
                    { label: "Services Reçus", value: "8", icon: Heart, color: "text-red-400" },
                    { label: "Points Alliance", value: "2,450", icon: Star, color: "text-yellow-400" },
                    { label: "Niveau Actuel", value: "Expert", icon: Trophy, color: "text-purple-400" },
                ].map((stat, i) => (
                    <Card key={i} className="bg-[#0a0f1c] border-slate-800 p-6 flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                            <h3 className="text-3xl font-black text-white mt-1">{stat.value}</h3>
                        </div>
                        <div className={`h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center ${stat.color}`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                    </Card>
                ))}
            </div>

            {/* PROGRESSION PALIER */}
            <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-slate-800 p-6 relative overflow-hidden">
                <div className="flex justify-between items-end mb-4 relative z-10">
                    <div>
                        <h3 className="text-white font-bold text-lg flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-400" /> Progression vers le palier "Mentor"
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">Plus que 550 points pour débloquer l'accès aux événements exclusifs.</p>
                    </div>
                    <span className="text-2xl font-black text-white">82%</span>
                </div>
                <Progress value={82} className="h-3 bg-slate-800 [&>div]:bg-gradient-to-r from-blue-500 to-purple-500" />
            </Card>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* FLUX D'ACTUALITÉS */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-400" /> Activité Récente
                    </h3>
                    <div className="space-y-4">
                        {[
                            { user: "Sarah M.", action: "a aidé", target: "Thomas D.", desc: "Relecture de contrat freelance", time: "Il y a 2h", points: "+50 pts" },
                            { user: "Karim B.", action: "a partagé", target: "L'Alliance", desc: "Opportunité de mission UX Design", time: "Il y a 4h", points: "+20 pts" },
                            { user: "Julie L.", action: "a validé", target: "Palier Expert", desc: "Félicitations pour son engagement !", time: "Hier", points: "LEVEL UP" },
                        ].map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-[#0a0f1c] border border-slate-800 p-4 rounded-xl flex items-start gap-4"
                            >
                                <Avatar>
                                    <AvatarFallback className="bg-slate-800 text-slate-400">{item.user[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm text-white">
                                        <span className="font-bold">{item.user}</span> <span className="text-slate-400">{item.action}</span> <span className="font-bold">{item.target}</span>
                                    </p>
                                    <p className="text-slate-500 text-sm mt-1">{item.desc}</p>
                                    <p className="text-slate-600 text-xs mt-2">{item.time}</p>
                                </div>
                                <div className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
                                    {item.points}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* PROCHAINS SERVICES */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-400" /> À Faire
                    </h3>
                    <Card className="bg-[#0a0f1c] border-slate-800 p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white text-sm">Aider Marc P.</h4>
                                    <span className="text-xs text-orange-400 font-bold">J-2</span>
                                </div>
                                <p className="text-slate-400 text-xs mb-3">Feedback sur sa landing page.</p>
                                <Button size="sm" className="w-full bg-white text-black hover:bg-slate-200 text-xs font-bold">
                                    Marquer comme fait
                                </Button>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 opacity-60">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white text-sm">Café virtuel avec Sophie</h4>
                                    <span className="text-xs text-slate-500">J-5</span>
                                </div>
                                <p className="text-slate-400 text-xs">Introduction au réseau.</p>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-800">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold">
                                <Plus className="h-4 w-4 mr-2" /> Proposer un service
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}