"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, Upload, Clock, AlertCircle, ExternalLink, Heart, Lock, Shield, Eye, BarChart3, AlertTriangle, MessageSquareWarning, MessageCircle, Send } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  
  // New States
  const [supportsReceived, setSupportsReceived] = useState<any[]>([])
  const [supportsReceivedYesterday, setSupportsReceivedYesterday] = useState<any[]>([])
  const [missingSupporters, setMissingSupporters] = useState<any[]>([])
  const [missingSupportersYesterday, setMissingSupportersYesterday] = useState<any[]>([])
  const [stats, setStats] = useState({
    day: 0,
    week: 0,
    month: 0
  })

  // Chat States
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)

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
            // === CHAT SETUP ===
            const squadId = membership.squad_id
            
            // Load initial messages
            const { data: initialMessages } = await supabase
              .from('squad_messages')
              .select('*')
              .eq('squad_id', squadId)
              .order('created_at', { ascending: true })
              .limit(50)
            
            setChatMessages(initialMessages || [])

            // Subscribe to new messages
            const channel = supabase
              .channel('squad-chat')
              .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'squad_messages',
                filter: `squad_id=eq.${squadId}`
              }, (payload: any) => {
                setChatMessages((prev) => [...prev, payload.new])
              })
              .subscribe()

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
               
               // === FEATURE 1: Check Supports Received ===
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

               // Filter to ensure we only count supports from CURRENT squad members
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
               const missingYesterday = allMembers.filter((m: any) => !supporterIdsYesterday.has(m.user_id))
               setMissingSupportersYesterday(missingYesterday)

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
                   actionUrl: m.profiles?.current_video_url || "https://tiktok.com",
                   targetUserId: m.user_id // Store ID to log support later
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

         // === FEATURE 2: Fetch Global Stats ===
         // Mocking stats for now based on profile score since validations table might be empty initially
         // In real usage, this would be a count(*) from daily_validations with date filters
         const { data: validations } = await supabase
            .from('daily_validations')
            .select('validation_date, score_earned')
            .eq('user_id', user.id)
         
         const validStats = validations || []
         // Calculate stats
         const nowStats = new Date()
         const oneWeekAgo = new Date(nowStats.getTime() - 7 * 24 * 60 * 60 * 1000)
         const oneMonthAgo = new Date(nowStats.getTime() - 30 * 24 * 60 * 60 * 1000)

         const dayScore = validStats.filter((v: any) => v.validation_date === nowStats.toISOString().split('T')[0]).reduce((acc: number, v: any) => acc + (v.score_earned || 0), 0)
         const weekScore = validStats.filter((v: any) => new Date(v.validation_date) >= oneWeekAgo).reduce((acc: number, v: any) => acc + (v.score_earned || 0), 0)
         const monthScore = validStats.filter((v: any) => new Date(v.validation_date) >= oneMonthAgo).reduce((acc: number, v: any) => acc + (v.score_earned || 0), 0)

         setStats({
            day: dayScore > 0 ? dayScore : (profile?.discipline_score > 0 ? 10 : 0), // Fallback to 10 if new user but has score
            week: weekScore > 0 ? weekScore : (profile?.discipline_score || 0),
            month: monthScore > 0 ? monthScore : (profile?.discipline_score || 0)
         })

       } catch (e) {
         console.error(e)
       } finally {
         setLoading(false)
       }
    }
    fetchData()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get squad id
      const { data: membership } = await supabase.from('squad_members').select('squad_id').eq('user_id', user.id).single()
      if (!membership) return

      await supabase.from('squad_messages').insert({
        squad_id: membership.squad_id,
        user_id: user.id,
        username: userProfile?.username || "Soldat",
        content: newMessage.trim()
      })

      setNewMessage("")
    } catch (e) {
      toast.error("Erreur d'envoi")
    }
  }

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

  const toggleTask = async (id: number) => {
    // Optimistic Update
    const taskIndex = tasks.findIndex(t => t.id === id)
    const task = tasks[taskIndex]
    const newStatus = !task.completed
    
    const newTasks = [...tasks]
    newTasks[taskIndex] = { ...task, completed: newStatus }
    setTasks(newTasks)

    if (newStatus) {
       toast.success("Mission validée !", { description: task.text })
       
       // Log support action if it's a support task
       if (task.targetUserId && task.actionUrl) {
          try {
             const { data: { user } } = await supabase.auth.getUser()
             if (user) {
                // 1. Log Daily Support (for visual stats)
                await supabase.from('daily_supports').insert({
                   supporter_id: user.id,
                   target_user_id: task.targetUserId
                })

                // 2. Log Video Tracking (for rotation logic)
                const { data: tracking, error: trackingError } = await supabase
                  .from('video_tracking')
                  .select('action_count')
                  .eq('supporter_id', user.id)
                  .eq('target_user_id', task.targetUserId)
                  .eq('video_url', task.actionUrl)
                  .single()

                if (tracking) {
                   // Already supported this video before, check if it reached 3
                   // (Usually we shouldn't allow re-supporting same video same day if already counted, 
                   // but here we simplify: toggle = action done)
                   // Actually, toggle allows unchecking. Real app should handle 'undo'.
                   // For now, let's assume we just increment or ensure it exists.
                   // The requirement is: "3 actions". Like + Comment + Sub = 3 actions in ONE go? 
                   // Or 3 separate days? "au bout de 3 jours (3 actions)". 
                   // So 1 action per day.
                   // We update the count.
                   const newCount = (tracking.action_count || 0) + 1
                   await supabase.from('video_tracking').update({ 
                      action_count: newCount,
                      last_action_at: new Date().toISOString()
                   }).eq('supporter_id', user.id).eq('target_user_id', task.targetUserId).eq('video_url', task.actionUrl)

                   if (newCount >= 3) {
                      // TRIGGER SWAP
                      await supabase.rpc('swap_squad_member', { 
                         p_user_id: user.id, 
                         p_target_id: task.targetUserId 
                      })
                      toast("Mission Accomplie !", {
                         description: `Tu as soutenu ${task.text.split(': ')[1]} 3 fois. Un nouveau membre va être recruté !`,
                         icon: <Shield className="h-4 w-4 text-purple-500" />
                      })
                      // Refresh page/data after short delay
                      setTimeout(() => window.location.reload(), 2000)
                   }

                } else {
                   // First time supporting this video
                   await supabase.from('video_tracking').insert({
                      supporter_id: user.id,
                      target_user_id: task.targetUserId,
                      video_url: task.actionUrl,
                      action_count: 1
                   })
                }
             }
          } catch (e) {
             console.error("Failed to log support", e)
          }
       }
    }
  }

  const handleReportMissing = async (targetUserId: string, username: string) => {
     try {
       const { data: { user } } = await supabase.auth.getUser()
       if (!user) return

       const { error } = await supabase.from('reports').insert({
         reporter_id: user.id,
         target_user_id: targetUserId,
         target_username: username
       })

       if (error) throw error

       toast.success("Signalement envoyé au QG", { 
          description: `${username} a été signalé à l'admin pour manque de soutien.`,
          icon: <MessageSquareWarning className="h-4 w-4 text-orange-500" />
       })
     } catch (error) {
       toast.error("Erreur lors de l'envoi du signalement")
     }
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

    // Log validation in DB
    try {
       const { data: { user } } = await supabase.auth.getUser()
       if (user) {
          await supabase.from('daily_validations').insert({
             user_id: user.id,
             score_earned: 5,
             validation_date: new Date().toISOString().split('T')[0]
          })
       }
    } catch (e) {
       console.error("Failed to log validation", e)
    }
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
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <a href="https://whatsapp.com/channel/0029Va..." target="_blank" rel="noopener noreferrer">
                Canal WhatsApp
              </a>
            </Button>
            <Button size="sm" asChild>
              <Link href="/admin">Accéder au Panel Admin</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Broadcast Channel Button for Everyone */}
      {!isAdmin && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <MessageCircle className="h-5 w-5 text-green-600" />
             <span className="font-semibold text-green-800">Rejoins le QG du Général</span>
          </div>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" asChild>
            <a href="https://whatsapp.com/channel/0029Va..." target="_blank" rel="noopener noreferrer">
              Rejoindre sur WhatsApp
            </a>
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

      {/* NEW SECTION: Squad Surveillance & Stats */}
      <div className="grid gap-8 md:grid-cols-2">
        
        {/* SQUAD SURVEILLANCE */}
        <div className="rounded-xl border bg-card shadow-sm h-full">
          <div className="border-b p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="h-5 w-5 text-indigo-500" />
              Surveillance Escouade
            </h2>
            <p className="text-sm text-muted-foreground">Suivi des soutiens reçus</p>
          </div>
          
          <div className="p-6">
            <Tabs defaultValue="today" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="today">Aujourd'hui (En cours)</TabsTrigger>
                <TabsTrigger value="yesterday">Hier (Bilan)</TabsTrigger>
              </TabsList>

              <TabsContent value="today" className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Progression du jour</span>
                  <span className={`text-xl font-bold ${missingSupporters.length > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                    {supportsReceived.length}/{squadMembers.length}
                  </span>
                </div>
                
                {squadMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Pas encore de membres.</div>
                ) : missingSupporters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-green-600 gap-2">
                    <CheckCircle className="h-12 w-12" />
                    <p className="font-medium">Tout le monde a déjà liké ! 🔥</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    <p className="text-xs text-muted-foreground mb-2">Ces membres n'ont pas encore liké (ils ont jusqu'à minuit) :</p>
                    {missingSupporters.map((m: any) => (
                      <div key={m.user_id} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                            {m.profiles?.username?.charAt(0) || "?"}
                          </div>
                          <span className="font-medium text-sm text-muted-foreground">{m.profiles?.username || "Inconnu"}</span>
                        </div>
                        <span className="text-xs text-muted-foreground italic">En attente...</span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="yesterday" className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Résultat final d'hier</span>
                  <span className={`text-xl font-bold ${missingSupportersYesterday.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {supportsReceivedYesterday.length}/{squadMembers.length}
                  </span>
                </div>

                {missingSupportersYesterday.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-green-600 gap-2">
                    <CheckCircle className="h-12 w-12" />
                    <p className="font-medium">Journée parfaite hier !</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-md">
                      <AlertTriangle className="h-4 w-4" />
                      {missingSupportersYesterday.length} traître(s) détecté(s) !
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                      {missingSupportersYesterday.map((m: any) => (
                        <div key={m.user_id} className="flex items-center justify-between p-2 border rounded-md bg-background border-red-100">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                              {m.profiles?.username?.charAt(0) || "?"}
                            </div>
                            <span className="font-medium text-sm">{m.profiles?.username || "Inconnu"}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-8"
                            onClick={() => handleReportMissing(m.user_id, m.profiles?.username)}
                          >
                            <MessageSquareWarning className="h-4 w-4 mr-2" />
                            Signaler
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* GLOBAL STATS */}
        <div className="rounded-xl border bg-card shadow-sm h-full">
          <div className="border-b p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Rapport du QG
            </h2>
            <p className="text-sm text-muted-foreground">Tes performances globales</p>
          </div>
          <div className="p-6">
            <Tabs defaultValue="day" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="day">Jour</TabsTrigger>
                <TabsTrigger value="week">Semaine</TabsTrigger>
                <TabsTrigger value="month">Mois</TabsTrigger>
              </TabsList>
              
              <TabsContent value="day" className="space-y-4">
                <div className="flex flex-col items-center justify-center py-4">
                  <span className="text-4xl font-bold text-primary">{stats.day} XP</span>
                  <span className="text-sm text-muted-foreground">gagnés aujourd'hui</span>
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  Continue comme ça pour maintenir ta série !
                </div>
              </TabsContent>
              
              <TabsContent value="week" className="space-y-4">
                <div className="flex flex-col items-center justify-center py-4">
                  <span className="text-4xl font-bold text-primary">{stats.week} XP</span>
                  <span className="text-sm text-muted-foreground">cette semaine</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[60%]" />
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  Tu es dans le top 10% de ton escouade.
                </div>
              </TabsContent>
              
              <TabsContent value="month" className="space-y-4">
                <div className="flex flex-col items-center justify-center py-4">
                  <span className="text-4xl font-bold text-primary">{stats.month} XP</span>
                  <span className="text-sm text-muted-foreground">ce mois-ci</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-xl font-bold">92%</div>
                    <div className="text-xs text-muted-foreground">Assiduité</div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-xl font-bold text-green-600">A+</div>
                    <div className="text-xs text-muted-foreground">Grade</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

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

        {/* Group Activity Feed (Mini) & Chat */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card shadow-sm h-[500px] flex flex-col">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-indigo-500" />
                Taverne de l'Escouade
              </h2>
              <p className="text-sm text-muted-foreground">Motive tes troupes !</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-10 text-sm">
                  C'est calme ici... Lance la discussion !
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.user_id === userProfile?.id ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${msg.user_id === userProfile?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="text-xs font-bold mb-1 opacity-70">{msg.username}</p>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t bg-background">
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex gap-2"
              >
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Écris un message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-sm">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b">
                <span>Membres actifs</span>
                <span>{squadMembers.length + 1} / 30</span>
              </div>
              {/* ... existing member list ... */}
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
