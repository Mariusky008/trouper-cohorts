"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Users, Play, Trophy, Rocket } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function AlliancesPage() {
    const [activeTab, setActiveTab] = useState("feed")
    const [userRank, setUserRank] = useState(1)
    const [loading, setLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        const fetchRank = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from('profiles').select('rank_level').eq('id', user.id).single()
                if (data) setUserRank(data.rank_level || 1)
            }
            setLoading(false)
        }
        fetchRank()
    }, [])

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* HERO HEADER */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white p-8 rounded-2xl mb-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/50 hover:bg-indigo-500/30">
                                <Rocket className="h-3 w-3 mr-1" />
                                NOUVEAU
                            </Badge>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Réseau Tactique</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">FIL D'ACTUALITÉ</h1>
                        <p className="text-indigo-200 max-w-lg">
                            Le QG des opérations conjointes. Découvrez les alliances stratégiques et postulez pour rejoindre l'élite.
                        </p>
                    </div>

                    {userRank >= 6 ? (
                        <Button className="bg-white text-indigo-900 hover:bg-indigo-50 font-black px-8 py-6 text-lg shadow-xl shadow-indigo-900/50 transition-transform hover:scale-105">
                            <Plus className="mr-2 h-5 w-5" />
                            LANCER UNE ALLIANCE
                        </Button>
                    ) : (
                        <div className="text-center bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 max-w-xs">
                            <p className="text-xs font-bold text-indigo-300 uppercase mb-1">Grade requis : Lieutenant (G6)</p>
                            <p className="text-sm font-medium">Montez en grade pour débloquer la création d'alliances.</p>
                        </div>
                    )}
                </div>
            </div>

            <Tabs defaultValue="feed" onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl h-12">
                    <TabsTrigger value="feed" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                        À la Une (Succès)
                    </TabsTrigger>
                    <TabsTrigger value="market" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                        Recrutement (Offres)
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="feed" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Placeholder Feed */}
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trophy className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">Aucune alliance publiée</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Les premières opérations conjointes n'ont pas encore abouti. Soyez le premier à inaugurer le fil !
                        </p>
                    </div>
                </TabsContent>
                
                <TabsContent value="market" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Placeholder Market */}
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">Aucune offre disponible</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Les Lieutenants préparent leurs plans. Revenez plus tard pour voir les missions de collaboration.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}