'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { ArrowLeft, Loader2, Heart, MessageCircle, Star, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PerformancePage() {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const checkAdmin = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            // Replace with your actual admin check logic if needed
            if (!user) {
                router.push('/dashboard')
                return
            }
            fetchData()
        }
        checkAdmin()
    }, [])

    const fetchData = async () => {
        try {
            const res = await fetch('/api/admin/get-performance')
            const json = await res.json()
            if (json.success) {
                setData(json.data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild className="hover:bg-white">
                            <Link href="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Link>
                        </Button>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Analyse de Performance</h1>
                    </div>
                </div>

                <div className="grid gap-4">
                    {data.map((item, idx) => (
                        <Card key={idx} className="overflow-hidden border-l-4 shadow-sm hover:shadow-md transition-shadow" style={{ borderLeftColor: item.type === 'core' ? '#4f46e5' : '#94a3b8' }}>
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row items-center p-4 gap-6">
                                    {/* Date & User */}
                                    <div className="flex-1 min-w-[200px] w-full text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                            <Badge variant="outline" className="bg-slate-100">{item.date}</Badge>
                                            {item.type === 'core' ? (
                                                <Badge className="bg-indigo-600 hover:bg-indigo-700">Prioritaire</Badge>
                                            ) : (
                                                <Badge variant="secondary">Standard</Badge>
                                            )}
                                        </div>
                                        <h3 className="font-black text-xl text-slate-900 mb-1">@{item.username}</h3>
                                        {item.video_url ? (
                                            <a href={item.video_url} target="_blank" className="text-xs text-indigo-500 hover:underline truncate block max-w-[250px] mx-auto md:mx-0">
                                                Voir la vidéo cible ↗
                                            </a>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Pas de lien spécifique</span>
                                        )}
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="flex gap-4 md:gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100 w-full md:w-auto justify-center">
                                        <div className="text-center min-w-[50px]">
                                            <div className="flex items-center justify-center gap-1.5 text-pink-500 mb-1">
                                                <Heart className="h-5 w-5 fill-pink-500/20" />
                                                <span className="font-black text-xl">{item.stats.likes}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Likes</p>
                                        </div>
                                        <div className="text-center min-w-[50px]">
                                            <div className="flex items-center justify-center gap-1.5 text-blue-500 mb-1">
                                                <MessageCircle className="h-5 w-5 fill-blue-500/20" />
                                                <span className="font-black text-xl">{item.stats.comments}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Coms</p>
                                        </div>
                                        <div className="text-center min-w-[50px]">
                                            <div className="flex items-center justify-center gap-1.5 text-yellow-500 mb-1">
                                                <Star className="h-5 w-5 fill-yellow-500/20" />
                                                <span className="font-black text-xl">{item.stats.favorites}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Favs</p>
                                        </div>
                                        <div className="w-px bg-slate-200 mx-2 hidden sm:block" />
                                        <div className="text-center min-w-[60px] hidden sm:block">
                                            <div className="flex items-center justify-center gap-1.5 text-slate-700 mb-1">
                                                <Eye className="h-5 w-5" />
                                                <span className="font-black text-xl">{item.stats.total}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {data.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                            <Eye className="h-10 w-10 mb-3 opacity-50" />
                            <p className="font-medium">Aucune donnée de performance disponible.</p>
                            <p className="text-sm mt-1">Les stats apparaîtront après les premières missions.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}