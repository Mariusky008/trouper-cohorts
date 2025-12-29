"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, Upload, Clock, AlertCircle, ExternalLink, Heart, Lock, Shield } from "lucide-react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"

import Link from "next/link"

import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export default function DashboardPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [proofUploaded, setProofUploaded] = useState(false)
  const [disciplineScore, setDisciplineScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [myVideoUrl, setMyVideoUrl] = useState("")
  const [isEditingVideo, setIsEditingVideo] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [squadMembers, setSquadMembers] = useState<any[]>([])
  const [dayProgress, setDayProgress] = useState(1)
  const [isFullyOnboarded, setIsFullyOnboarded] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
       try {
         const { data: { user } } = await supabase.auth.getUser()
         if (!user) return

         if (user.email === "mariustalk@yahoo.fr") {
            setIsAdmin(true)
         }

         // 1. Fetch Profile
         const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
         if (profile) {
           setUserProfile(profile)
           setDisciplineScore(profile.discipline_score || 0)
           setMyVideoUrl(profile.current_video_url || "")
         }

         // Calculate days since creation for "Progression"
         const createdDate = new Date(profile?.created_at || new Date())
         const now = new Date()
         const diffTime = Math.abs(now.getTime() - createdDate.getTime())
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
         const currentDay = Math.min(30, diffDays) // Cap at 30 days
         setDayProgress(currentDay)

         // 2. Fetch Squad Members
         // First get squad_id
         const { data: membership } = await supabase.from('squad_members').select('squad_id').eq('user_id', user.id).single()
         
         if (membership) {
            const { data: members } = await supabase
              .from('squad_members')
              .select('user_id, profiles(id, username, current_video_url)')
              .eq('squad_id', membership.squad_id)
              .neq('user_id', user.id) // Exclude self
              
            // Check subscriptions status
            const { data: subscriptions } = await supabase
              .from('member_subscriptions')
              .select('target_user_id')
              .eq('subscriber_id', user.id)
            
            const subscribedIds = new Set(subscriptions?.map((s: { target_user_id: string }) => s.target_user_id))
            
            // Check if user is subscribed to all members
            const allMembers = members || []
            const isSubscribedToAll = allMembers.length === 0 || allMembers.every((m: any) => subscribedIds.has(m.profiles?.id))
            setIsFullyOnboarded(isSubscribedToAll)

            // Update is_fully_onboarded in profile if changed
            if (isSubscribedToAll !== profile?.is_fully_onboarded) {
               await supabase.from('profiles').update({ is_fully_onboarded: isSubscribedToAll }).eq('id', user.id)
            }

            if (allMembers.length > 0) {
               setSquadMembers(allMembers)
               
               // Generate tasks based on real members
               const newTasks = [
                 { 
                   id: 1, 
                   text: "Publier 1 vidéo TikTok", 
                   completed: false,
                   actionLabel: "Ouvrir TikTok Studio",
                   actionUrl: "https://www.tiktok.com/creator-center/upload"
                 },
                 ...allMembers.slice(0, 3).map((m: any, index: number) => ({
                   id: index + 2,
                   text: `Soutien: ${m.profiles?.username || 'Membre'}`,
                   completed: false,
                   actionLabel: "Voir la vidéo",
                   actionUrl: m.profiles?.current_video_url || "https://tiktok.com"
                 }))
               ]
               setTasks(newTasks)
            } else {
               // Fallback if alone in squad
               setTasks([
                 { 
                   id: 1, 
                   text: "Publier 1 vidéo TikTok", 
                   completed: false,
                   actionLabel: "Ouvrir TikTok Studio",
                   actionUrl: "https://www.tiktok.com/creator-center/upload"
                 },
                 {
                   id: 99,
                   text: "Inviter des amis dans l'escouade",
                   completed: false,
                   actionLabel: "Copier le lien",
                   actionUrl: "#"
                 }
               ])
               setIsFullyOnboarded(true) // Alone means fully onboarded
            }
         } else {
            // Not in a squad yet?
            setTasks([
                 { 
                   id: 1, 
                   text: "Publier 1 vidéo TikTok", 
                   completed: false,
                   actionLabel: "Ouvrir TikTok Studio",
                   actionUrl: "https://www.tiktok.com/creator-center/upload"
                 }
            ])
            setIsFullyOnboarded(true)
         }

       } catch (e) {
         console.error(e)
       } finally {
         setLoading(false)
       }
    }
    fetchData()
  }, [])

  const handleUpdateVideo = async () => {
    if (!myVideoUrl) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('profiles').update({ current_video_url: myVideoUrl }).eq('id', user.id)
      
      if (error) throw error
      
      setIsEditingVideo(false)
      toast.success("Vidéo mise à jour", { description: "Ton escouade va pouvoir la soutenir !" })
    } catch (error) {
      toast.error("Erreur de mise à jour")
    }
  }

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const newStatus = !t.completed
        if (newStatus) {
           toast.success("Mission validée !", {
             description: t.text
           })
        }
        return { ...t, completed: newStatus }
      }
      return t
    }))
  }

  const allTasksCompleted = tasks.length > 0 && tasks.every(t => t.completed)

  const handleProofUpload = async () => {
    setProofUploaded(true)
    // Here we would upload to Supabase Storage
    
    // Simulate updating score +5 points for completing daily mission (capped at 100)
    const newScore = Math.min(100, disciplineScore + 5)
    setDisciplineScore(newScore)
    
    // Optimistic update
    toast.success("Journée validée ! 🔥", {
      description: "Discipline augmentée ! À demain.",
      duration: 5000,
    })

    // In real app: await supabase.from('daily_validations').insert(...)
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Chargement du QG...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      {isAdmin && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Shield className="h-5 w-5 text-primary" />
             <span className="font-semibold text-primary">Mode Administrateur activé</span>
          </div>
          <Button size="sm" asChild>
            <Link href="/admin">Accéder au Panel Admin</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Objectif</h3>
          <div className="mt-2 text-2xl font-bold">Visibilité TikTok</div>
          <p className="text-xs text-muted-foreground mt-1">Pack Starter</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Progression</h3>
          <div className="mt-2 text-2xl font-bold">Jour {dayProgress} <span className="text-muted-foreground text-lg font-normal">/ 30</span></div>
          <div className="mt-2 h-2 w-full rounded-full bg-secondary">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${(dayProgress/30)*100}%` }} />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">XP Discipline</h3>
          <div className={`mt-2 text-2xl font-bold flex items-center gap-2`}>
            {disciplineScore} XP
            {disciplineScore >= 100 && <Heart className="h-5 w-5 fill-red-500 text-red-500 animate-pulse" />}
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-secondary">
             <div className="h-2 rounded-full bg-green-500 transition-all duration-1000" style={{ width: `${Math.min(100, (disciplineScore / 1000) * 100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
             {disciplineScore < 100 ? "Complète des missions pour monter en grade !" : "Tu es un soldat d'élite !"}
          </p>
        </div>
      </div>

      {!isFullyOnboarded && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-orange-100 rounded-full">
              <Lock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-orange-900">Missions bloquées</h2>
              <p className="text-orange-800">
                Tu dois t'abonner à tous les membres de ton escouade avant de pouvoir commencer tes missions quotidiennes.
                C'est la règle d'or : le soutien mutuel avant tout.
              </p>
              <Button asChild variant="default" className="bg-orange-600 hover:bg-orange-700 mt-2">
                <Link href="/dashboard/group">
                  Voir mon escouade et m'abonner ({squadMembers.length} membres)
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={`grid gap-8 md:grid-cols-3 ${!isFullyOnboarded ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
        {/* Daily Tasks */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Current Video Section */}
          <div className="rounded-xl border bg-card shadow-sm border-blue-500/20 bg-blue-50/5">
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-blue-500" />
                  Ta Vidéo du Moment
                </h2>
                <p className="text-sm text-muted-foreground">C'est le lien que ton escouade va recevoir pour te soutenir.</p>
              </div>
              
              <div className="flex-1 max-w-md">
                {isEditingVideo ? (
                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      placeholder="Colle le lien de ta dernière vidéo..."
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={myVideoUrl}
                      onChange={(e) => setMyVideoUrl(e.target.value)}
                    />
                    <Button size="sm" onClick={handleUpdateVideo}>Sauvegarder</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4 bg-background border rounded-md px-3 py-2">
                    <span className="text-sm truncate max-w-[200px] text-muted-foreground">
                      {myVideoUrl || "Aucune vidéo définie"}
                    </span>
                    <Button variant="ghost" size="sm" className="h-6" onClick={() => setIsEditingVideo(true)}>
                      Modifier
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-sm">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Missions du jour
              </h2>
              <p className="text-sm text-muted-foreground">Tu as jusqu'à minuit pour valider.</p>
            </div>
            <div className="p-6 space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">Aucune mission pour le moment.</div>
              ) : (
              tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`flex flex-col gap-3 rounded-lg border p-4 transition-all ${task.completed ? 'bg-green-500/10 border-green-500/20' : 'bg-background'}`}
                >
                  <div 
                    className="flex items-center gap-4 cursor-pointer"
                    onClick={() => toggleTask(task.id)}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${task.completed ? 'bg-green-600 border-green-600 text-white' : 'border-muted-foreground'}`}
                    >
                      {task.completed && <CheckCircle className="h-4 w-4" />}
                    </div>
                    <span className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.text}</span>
                  </div>
                  
                  {task.actionUrl && !task.completed && (
                    <div className="ml-10">
                       <Button variant="outline" size="sm" className="h-8 gap-2" asChild>
                         <a href={task.actionUrl} target="_blank" rel="noopener noreferrer">
                           {task.actionLabel}
                           <ExternalLink className="h-3 w-3" />
                         </a>
                       </Button>
                    </div>
                  )}
                </div>
              ))
              )}
            </div>
          </div>

          {/* Proof Upload */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Preuve du jour
              </h2>
              <p className="text-sm text-muted-foreground">Capture d'écran ou lien de ta publication.</p>
            </div>
            <div className="p-6">
              {!allTasksCompleted ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                  <p>Complète toutes tes missions avant d'envoyer ta preuve.</p>
                </div>
              ) : proofUploaded ? (
                <div className="flex items-center gap-4 rounded-lg bg-green-500/10 p-4 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Preuve envoyée et validée ! À demain.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-primary/50 bg-primary/5 p-8 transition-colors hover:bg-primary/10 cursor-pointer relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        
                        const toastId = toast.loading("Envoi de la preuve...")
                        
                        try {
                          const { data: { user } } = await supabase.auth.getUser()
                          if (!user) throw new Error("Non connecté")

                          const filename = `${user.id}/${Date.now()}-${file.name}`
                          const { error } = await supabase.storage
                            .from('proofs')
                            .upload(filename, file)
                          
                          if (error) throw error

                          toast.dismiss(toastId)
                          handleProofUpload()
                        } catch (error: any) {
                          toast.error("Erreur d'upload", { description: error.message, id: toastId })
                        }
                      }}
                    />
                    <Upload className="h-8 w-8 text-primary mb-2" />
                    <p className="font-medium text-primary">Déposer une capture d'écran</p>
                    <p className="text-xs text-muted-foreground">ou glisser-déposer</p>
                  </div>
                  <Button className="w-full" onClick={handleProofUpload}>
                    Valider ma journée
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Group Activity Feed (Mini) */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card shadow-sm h-full">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold">Ton Escouade</h2>
              <p className="text-sm text-muted-foreground">Activité récente</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b">
                <span>Membres actifs</span>
                <span>{squadMembers.length + 1} / 30</span>
              </div>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {squadMembers.length === 0 ? (
                   <div className="text-sm text-muted-foreground text-center py-4">
                     Tu es le premier ! Invite des amis.
                   </div>
                ) : (
                squadMembers.map((m: any, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted shrink-0 flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{m.profiles?.username || `Membre #${i+1}`}</p>
                      <p className="text-xs text-muted-foreground">a rejoint l'escouade </p>
                    </div>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {(i + 1) * 2}m
                    </span>
                  </div>
                ))
                )}
              </div>
              <Button variant="outline" className="w-full" size="sm" asChild>
                <Link href="/dashboard/group">
                  Voir les membres
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
