"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, AlertTriangle, ArrowLeft, BarChart3, ShieldAlert } from "lucide-react"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function SurveillancePage() {
  const [loading, setLoading] = useState(true)
  const [squadMembers, setSquadMembers] = useState<any[]>([])
  const [supportsReceived, setSupportsReceived] = useState<any[]>([])
  const [supportsReceivedYesterday, setSupportsReceivedYesterday] = useState<any[]>([])
  const [missingSupporters, setMissingSupporters] = useState<any[]>([])
  const [missingSupportersYesterday, setMissingSupportersYesterday] = useState<any[]>([])
  const [dayProgress, setDayProgress] = useState(1)
  
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
       try {
         const { data: { user } } = await supabase.auth.getUser()
         if (!user) return

         // 1. Fetch Profile
         const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
         if (profile) {
           const createdDate = new Date(profile.created_at || new Date())
           const now = new Date()
           const diffTime = Math.abs(now.getTime() - createdDate.getTime())
           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
           const currentDay = Math.min(30, diffDays)
           setDayProgress(currentDay)
         }

         // 2. Fetch Squad Members
         const { data: membership } = await supabase.from('squad_members').select('squad_id').eq('user_id', user.id).single()
         
         if (membership) {
            const { data: members } = await supabase
              .from('squad_members')
              .select('user_id, profiles(id, username, current_video_url)')
              .eq('squad_id', membership.squad_id)
              .neq('user_id', user.id) // Exclude self
              
            const allMembers = members || []

            if (allMembers.length > 0) {
               setSquadMembers(allMembers)
               
               // === Check Supports Received ===
               const today = new Date().toISOString().split('T')[0]
               const yesterdayDate = new Date()
               yesterdayDate.setDate(yesterdayDate.getDate() - 1)
               const yesterday = yesterdayDate.toISOString().split('T')[0]

               // 1. Fetch Today's supports
               const { data: supportsToday } = await supabase
                 .from('daily_supports')
                 .select('supporter_id')
                 .eq('target_user_id', user.id)
                 .gte('created_at', today)

               const validSupportsToday = supportsToday?.filter((s: any) => allMembers.some((m: any) => m.user_id === s.supporter_id)) || []
               const supporterIdsToday = new Set(validSupportsToday.map((s: any) => s.supporter_id))
               
               setSupportsReceived(validSupportsToday)
               const missingToday = allMembers.filter((m: any) => !supporterIdsToday.has(m.user_id))
               setMissingSupporters(missingToday)

               // 2. Fetch Yesterday's supports
               const { data: supportsYesterday } = await supabase
                 .from('daily_supports')
                 .select('supporter_id')
                 .eq('target_user_id', user.id)
                 .gte('created_at', yesterday)
                 .lt('created_at', today)

               const validSupportsYesterday = supportsYesterday?.filter((s: any) => allMembers.some((m: any) => m.user_id === s.supporter_id)) || []
               const supporterIdsYesterday = new Set(validSupportsYesterday.map((s: any) => s.supporter_id))
               
               setSupportsReceivedYesterday(validSupportsYesterday)
               
               // Only calculate missing supporters if the user existed yesterday
               const userCreatedAt = new Date(profile?.created_at || new Date())
               const isNewUser = userCreatedAt > new Date(yesterdayDate.setHours(0, 0, 0, 0))
               
               const missingYesterday = isNewUser ? [] : allMembers.filter((m: any) => !supporterIdsYesterday.has(m.user_id))
               setMissingSupportersYesterday(missingYesterday)
            }
         }

       } catch (e) {
         console.error(e)
       } finally {
         setLoading(false)
       }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Chargement du Bilan...</div>
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-6 w-6" />
          </Link>
        </Button>
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
             Bilan Opérationnel
           </h1>
           <p className="text-slate-500 font-medium">
             Transparence totale sur l'engagement de l'escouade.
           </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
         <div className="border-b p-6 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-slate-500" />
                Rapport de Soutien
              </h2>
              <p className="text-sm text-muted-foreground">Qui a validé ses missions ?</p>
            </div>
         </div>
         <div className="p-6">
            <Tabs defaultValue="yesterday" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="yesterday" className="text-lg py-3">Hier (Bilan Final)</TabsTrigger>
                <TabsTrigger value="today" className="text-lg py-3">Aujourd'hui (En cours)</TabsTrigger>
              </TabsList>

              <TabsContent value="today" className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-base font-medium text-slate-600">Avancement Global</span>
                  <span className={`text-3xl font-black ${missingSupporters.length > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                    {supportsReceived.length}/{squadMembers.length}
                  </span>
                </div>
                
                {squadMembers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">Pas encore de membres.</div>
                ) : missingSupporters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-green-600 gap-4">
                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                        <CheckCircle className="h-10 w-10" />
                    </div>
                    <p className="font-bold text-xl">Tout le monde a déjà liké ! 🔥</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">En attente de validation :</p>
                    <div className="grid gap-3">
                        {missingSupporters.map((m: any) => (
                          <div key={m.user_id} className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/50">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-white border flex items-center justify-center text-sm font-bold shadow-sm text-slate-400">
                                {m.profiles?.username?.charAt(0) || "?"}
                              </div>
                              <div>
                                  <span className="font-bold text-slate-700 block">{m.profiles?.username || "Inconnu"}</span>
                                  <span className="text-xs text-slate-400">Doit encore passer...</span>
                              </div>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-slate-200 text-slate-500 text-xs font-bold">
                                En cours
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="yesterday" className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-base font-medium text-slate-600">Score Final</span>
                  <span className={`text-3xl font-black ${missingSupportersYesterday.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {supportsReceivedYesterday.length}/{squadMembers.length}
                  </span>
                </div>

                {dayProgress === 1 ? (
                   <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-4">
                     <Clock className="h-16 w-16 opacity-20" />
                     <div className="text-center">
                        <p className="font-bold text-lg">Tu n'étais pas encore là hier !</p>
                        <p className="text-sm">Reviens demain pour voir ton premier bilan.</p>
                     </div>
                   </div>
                ) : missingSupportersYesterday.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-green-600 gap-4">
                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-10 w-10" />
                    </div>
                    <p className="font-bold text-xl">Journée parfaite hier !</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-base font-medium text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                      <ShieldAlert className="h-5 w-5" />
                      {missingSupportersYesterday.length} membre(s) défaillant(s) détecté(s)
                    </div>
                    <div className="grid gap-3">
                      {missingSupportersYesterday.map((m: any) => {
                        return (
                        <div key={m.user_id} className="flex items-center justify-between p-4 border rounded-xl shadow-sm bg-white border-red-100">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold bg-red-100 text-red-600">
                              {m.profiles?.username?.charAt(0) || "?"}
                            </div>
                            <span className="font-bold text-slate-900">{m.profiles?.username || "Inconnu"}</span>
                          </div>
                          <span className="text-xs font-bold text-red-600 flex items-center gap-1 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                             Manqué à l'appel
                          </span>
                        </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
         </div>
      </div>
    </div>
  )
}
