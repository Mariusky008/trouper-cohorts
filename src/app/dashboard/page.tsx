"use client";

import { ChatBox } from "@/components/chat/chat-box";
import { VictoryWall } from "@/components/dashboard/victory-wall";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PlayCircle } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="font-black text-xl italic uppercase text-slate-900">
            Popey <span className="text-orange-500">Cockpit</span>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Votre progression</p>
                <div className="w-32 h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-green-500 w-[10%]"></div>
                </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-200 border-2 border-white shadow-sm"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* En-tête de Mission */}
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-orange-500 text-white hover:bg-orange-600 uppercase tracking-widest">Jour 1 / 14</Badge>
                <span className="text-slate-400 font-medium text-sm">Mardi 14 Février</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic">
                Objectif : Voir la réalité en face.
            </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
            
            {/* COLONNE GAUCHE (Mission + Victoires) */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* 1. Briefing Vidéo */}
                <Card className="overflow-hidden border-2 border-slate-200 shadow-sm">
                    <div className="aspect-video bg-slate-900 flex items-center justify-center relative group cursor-pointer">
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all"></div>
                        <PlayCircle className="h-20 w-20 text-white opacity-80 group-hover:scale-110 transition-transform duration-300" />
                        <span className="absolute bottom-4 left-4 text-white font-bold text-lg">Briefing du Jour (05:23)</span>
                    </div>
                    <CardContent className="p-6 bg-white">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 h-6 w-6 rounded-full flex items-center justify-center text-xs">!</span>
                            Votre Mission
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <Checkbox id="task1" className="mt-1" />
                                <label htmlFor="task1" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                    <span className="block text-slate-900 font-bold mb-1">1. Audit Financier Express</span>
                                    <span className="text-slate-500 font-normal">Extrais tes relevés des 3 derniers mois et identifie tes 3 plus grosses fuites.</span>
                                </label>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <Checkbox id="task2" className="mt-1" />
                                <label htmlFor="task2" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                    <span className="block text-slate-900 font-bold mb-1">2. Calcul du Taux Horaire</span>
                                    <span className="text-slate-500 font-normal">Revenu Net / Heures Travaillées. Ça fait mal ? C'est le but.</span>
                                </label>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100 ring-1 ring-orange-200">
                                <Checkbox id="task3" className="mt-1 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500" />
                                <label htmlFor="task3" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                    <span className="block text-orange-800 font-bold mb-1 flex items-center gap-2">
                                        🎥 DÉFI VIDÉO : L'Erreur de l'Année
                                    </span>
                                    <span className="text-orange-700/80 font-normal">Raconte ta plus grosse erreur business sans filtre. Poste-la sur le Mur des Victoires.</span>
                                </label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Mur des Victoires */}
                <VictoryWall cohortId="demo" currentUserId="demo-user" />

            </div>

            {/* COLONNE DROITE (Binôme) */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* Info Binôme */}
                <Card className="bg-indigo-600 text-white border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            🤝 Binôme du Jour
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-indigo-100 text-sm">
                            Objectif : Appelle ton binôme et expliquez-vous l'objectif 1. Voyez comment évoluer ensemble.
                        </p>
                        <Button variant="secondary" className="w-full font-bold text-indigo-700">
                            Planifier l'appel
                        </Button>
                    </CardContent>
                </Card>

                {/* Chat */}
                <ChatBox 
                    partnerName="Alice Dupont" 
                    partnerId="mock-alice" 
                    currentUserId="me"
                    initialMessages={[
                        { id: '1', senderId: 'mock-alice', content: 'Salut ! Dispo pour notre appel à 14h ?', createdAt: new Date() }
                    ]} 
                />

                {/* Aide / Support */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-slate-500 uppercase tracking-widest">Besoin d'aide ?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 mb-4">Les coachs sont disponibles sur le Slack général.</p>
                        <Button variant="outline" size="sm" className="w-full">Contacter le support</Button>
                    </CardContent>
                </Card>

            </div>
        </div>
      </main>
    </div>
  );
}
