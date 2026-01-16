"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Users, Play, Trophy, Rocket, Swords, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CreateAllianceDialog } from "@/components/dashboard/alliances/CreateAllianceDialog"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"

// Main component for the Alliance Feed

export default function AlliancesPage() {
    const [activeTab, setActiveTab] = useState("market") // Default to market for now
    const [userRank, setUserRank] = useState(1)
    const [loading, setLoading] = useState(true)
    const [alliances, setAlliances] = useState<any[]>([])
    const [userId, setUserId] = useState<string | null>(null)

    const supabase = createClient()

    const fetchData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setUserId(user.id)
            const { data } = await supabase.from('profiles').select('rank_level').eq('id', user.id).single()
            if (data) setUserRank(data.rank_level || 1)
        }

        const { data: alliancesData } = await supabase
            .from('alliances')
            .select(`
                *,
                creator:profiles!creator_id(username, avatar_url, rank_level),
                members:alliance_members(count)
            `)
            .order('created_at', { ascending: false })
        
        if (alliancesData) setAlliances(alliancesData)
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleApply = async (allianceId: string) => {
        if (!userId) return
        
        // Check if already applied
        const { data: existing } = await supabase
            .from('alliance_members')
            .select('id')
            .eq('alliance_id', allianceId)
            .eq('user_id', userId)
            .single()

        if (existing) {
            toast.error("Déjà postulé !")
            return
        }

        // Simple apply for now (can be enhanced with a dialog for pitch)
        const { error } = await supabase.from('alliance_members').insert({
            alliance_id: allianceId,
            user_id: userId,
            role: 'member',
            status: 'pending',
            application_message: "Je suis prêt pour le combat !"
        })

        if (error) {
            toast.error("Erreur lors de la candidature")
        } else {
            toast.success("Candidature envoyée !", { description: "Le leader examinera ton profil." })
        }
    }

    const openAlliances = alliances.filter(a => a.status === 'open')
    const completedAlliances = alliances.filter(a => a.status === 'completed')

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
                        <CreateAllianceDialog userRank={userRank} onSuccess={fetchData}>
                            <Button className="bg-white text-indigo-900 hover:bg-indigo-50 font-black px-8 py-6 text-lg shadow-xl shadow-indigo-900/50 transition-transform hover:scale-105">
                                <Plus className="mr-2 h-5 w-5" />
                                LANCER UNE ALLIANCE
                            </Button>
                        </CreateAllianceDialog>
                    ) : (
                        <div className="text-center bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 max-w-xs">
                            <p className="text-xs font-bold text-indigo-300 uppercase mb-1">Grade requis : Lieutenant (G6)</p>
                            <p className="text-sm font-medium">Montez en grade pour débloquer la création d'alliances.</p>
                        </div>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl h-12">
                    <TabsTrigger value="feed" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                        À la Une (Succès) <span className="ml-2 bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{completedAlliances.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="market" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                        Recrutement (Offres) <span className="ml-2 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs">{openAlliances.length}</span>
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="feed" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {completedAlliances.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trophy className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">Aucune alliance publiée</h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Les premières opérations conjointes n'ont pas encore abouti. Soyez le premier à inaugurer le fil !
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {completedAlliances.map(alliance => (
                                <div key={alliance.id}>TODO: Alliance Card Completed</div>
                            ))}
                        </div>
                    )}
                </TabsContent>
                
                <TabsContent value="market" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {openAlliances.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">Aucune offre disponible</h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Les Lieutenants préparent leurs plans. Revenez plus tard pour voir les missions de collaboration.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {openAlliances.map(alliance => (
                                <div key={alliance.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                                <AvatarImage src={alliance.creator?.avatar_url} />
                                                <AvatarFallback>{alliance.creator?.username?.substring(0,2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-xs text-slate-400 font-bold uppercase">Ordre du G{alliance.creator?.rank_level}</p>
                                                <h4 className="font-bold text-slate-900">{alliance.creator?.username}</h4>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="uppercase text-[10px] tracking-widest border-indigo-200 bg-indigo-50 text-indigo-700">
                                            {alliance.type}
                                        </Badge>
                                    </div>
                                    
                                    <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                                        {alliance.title}
                                    </h3>
                                    <p className="text-sm text-slate-600 mb-4 line-clamp-3 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                        "{alliance.description}"
                                    </p>
                                    
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(alliance.created_at).toLocaleDateString()}
                                        </div>
                                        {alliance.creator_id !== userId ? (
                                            <Button size="sm" onClick={() => handleApply(alliance.id)} className="font-bold bg-slate-900 text-white hover:bg-indigo-600">
                                                POSTULER
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="outline" disabled className="font-bold opacity-50">
                                                VOTRE OFFRE
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}