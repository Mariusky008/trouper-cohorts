"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, HeartHandshake, AlertCircle } from "lucide-react";
import { OpportunityList } from "@/components/dashboard/opportunities/opportunity-list";
import { DebtsList } from "@/components/dashboard/trust/debts-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function DebtsAndCreditsView({ opportunities, debts, credits }: { opportunities: any[], debts: any[], credits: any[] }) {
    return (
        <Tabs defaultValue="history" className="w-full">
            <div className="flex mb-8">
                <TabsList className="bg-slate-800 border-0 p-1 h-auto flex flex-wrap gap-2 rounded-xl">
                    <TabsTrigger 
                        value="history" 
                        className="rounded-lg px-6 py-2.5 text-sm font-bold text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all flex-1 sm:flex-none"
                    >
                        <Zap className="h-4 w-4 mr-2" /> Historique
                    </TabsTrigger>
                    <TabsTrigger 
                        value="balance" 
                        className="rounded-lg px-6 py-2.5 text-sm font-bold text-slate-400 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all flex-1 sm:flex-none"
                    >
                        <HeartHandshake className="h-4 w-4 mr-2" /> Mes Échanges
                        {(debts.length > 0 || (credits && credits.length > 0)) && (
                            <span className="ml-2 bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                                {debts.length + (credits?.length || 0)}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="history" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-400" /> Historique des échanges
                </h3>
                <OpportunityList initialData={opportunities} />
            </TabsContent>

            <TabsContent value="balance" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid md:grid-cols-2 gap-12 bg-slate-900/50 p-6 md:p-8 rounded-3xl border border-white/5">
                    {/* 2. DEBTS (WHAT I OWE) */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2 px-2">
                            <div className="h-10 w-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 border border-orange-500/20">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-white">Vos Dettes</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Ce que vous devez rendre</p>
                            </div>
                        </div>
                        
                        <DebtsList debts={debts} />
                    </div>

                    {/* 3. CREDITS (WHAT IS OWED TO ME) */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2 px-2">
                            <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                                <HeartHandshake className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-white">Vos Crédits</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Ce qu'on vous doit</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {credits && credits.length > 0 ? (
                                credits.map((credit: any) => (
                                <div key={credit.id} className="bg-slate-800 rounded-2xl p-5 border border-white/5 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
                                    <Avatar className="h-12 w-12 border border-slate-700 group-hover:border-emerald-500/50 transition-colors">
                                    <AvatarImage src={credit.avatar} />
                                    <AvatarFallback className="bg-slate-700 text-slate-300">{credit.partner?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div className="font-bold text-white text-lg">{credit.partner}</div>
                                        {credit.remainingPoints && (
                                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wide">
                                                +{credit.remainingPoints} pts
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium mt-0.5">{credit.reason} • <span className="text-slate-500">{credit.date}</span></div>
                                    </div>
                                </div>
                                ))
                            ) : (
                                <div className="bg-slate-800/50 border border-white/5 border-dashed rounded-2xl p-12 text-center shadow-sm">
                                <div className="h-12 w-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-500">
                                    <HeartHandshake className="h-6 w-6" />
                                </div>
                                <p className="text-slate-400 font-medium">Vous n'avez pas encore de "crédits" en attente.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    );
}
