"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
    Activity, Calendar, Heart, LayoutDashboard, Shield, Star, Trophy, Users, Zap 
} from "lucide-react";
import { DashboardTab } from "@/components/alliance/dashboard-tab";
import { ServicesTab } from "@/components/alliance/services-tab";
import { MembersTab } from "@/components/alliance/members-tab";
import { EventsTab } from "@/components/alliance/events-tab";
import { ProfileTab } from "@/components/alliance/profile-tab";
import { AllianceChatWidget } from "@/components/alliance/alliance-chat-widget";

export default function AlliancePage() {
    const [activeTab, setActiveTab] = useState("dashboard");

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-20 relative">
            <AllianceChatWidget />
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-slate-900">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-white" />
                        <span className="font-black text-xl tracking-tighter uppercase italic">Alliance Alpha</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 bg-slate-900 rounded-full px-3 py-1 border border-slate-800">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs font-bold text-white">2,450 pts</span>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xs border-2 border-[#050505]">
                            JP
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    
                    {/* NAVIGATION */}
                    <div className="flex justify-center">
                        <TabsList className="bg-[#0a0f1c] border border-slate-800 p-1 rounded-full h-auto flex flex-wrap justify-center gap-1">
                            {[
                                { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                                { id: "services", label: "Mes Services", icon: Zap },
                                { id: "members", label: "Membres", icon: Users },
                                { id: "events", label: "Rituels", icon: Calendar },
                                { id: "profile", label: "Mon Profil", icon: Trophy },
                            ].map((tab) => (
                                <TabsTrigger 
                                    key={tab.id} 
                                    value={tab.id}
                                    className="rounded-full px-4 py-2 text-xs md:text-sm font-bold text-slate-400 data-[state=active]:bg-white data-[state=active]:text-black transition-all flex items-center gap-2"
                                >
                                    <tab.icon className="h-4 w-4" />
                                    <span className="hidden md:inline">{tab.label}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {/* CONTENU */}
                    <div className="min-h-[60vh]">
                        <TabsContent value="dashboard" className="focus:outline-none">
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                <DashboardTab />
                            </motion.div>
                        </TabsContent>
                        
                        <TabsContent value="services" className="focus:outline-none">
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                <ServicesTab />
                            </motion.div>
                        </TabsContent>
                        
                        <TabsContent value="members" className="focus:outline-none">
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                <MembersTab />
                            </motion.div>
                        </TabsContent>
                        
                        <TabsContent value="events" className="focus:outline-none">
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                <EventsTab />
                            </motion.div>
                        </TabsContent>
                        
                        <TabsContent value="profile" className="focus:outline-none">
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                <ProfileTab />
                            </motion.div>
                        </TabsContent>
                    </div>
                </Tabs>
            </main>
        </div>
    );
}