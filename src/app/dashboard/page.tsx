"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, Upload, Clock, AlertCircle, ExternalLink, Heart, Lock, Shield, Eye, BarChart3, AlertTriangle, MessageSquareWarning, MessageCircle, Send } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import Link from "next/link"

import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { WelcomePopup } from "@/components/welcome-popup"

export default function DashboardPage() {
  const [tasks, setTasks] = useState<any[]>([])
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
  const [videoTrackingData, setVideoTrackingData] = useState<any[]>([])
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
               
               // Only calculate missing supporters if the user existed yesterday
               const userCreatedAt = new Date(profile?.created_at || new Date())
               const isNewUser = userCreatedAt > new Date(yesterdayDate.setHours(0, 0, 0, 0))
               
               const missingYesterday = isNewUser ? [] : allMembers.filter((m: any) => !supporterIdsYesterday.has(m.user_id))
               setMissingSupportersYesterday(missingYesterday)

               // 3. Fetch Video Tracking to determine specific actions (Like/Comment/Save)
               const { data: videoTracking } = await supabase
                  .from('video_tracking')
                  .select('*')
                  .eq('supporter_id', user.id)
                  .in('target_user_id', allMembers.map((m: any) => m.user_id))
               
               setVideoTrackingData(videoTracking || [])

               const newTasks = [
                 { 
                   id: 1, 
                   text: "Publier 1 vidéo TikTok", 
                   completed: false,
                   actionLabel: "Ouvrir TikTok Studio",
                   actionUrl: "https://www.tiktok.com/creator-center/upload"
                 },
                 ...allMembers.map((m: any, index: number) => {
                   // Determine Action Text based on history
                   const videoUrl = m.profiles?.current_video_url || "https://tiktok.com"
                   const record = videoTracking?.find((t: any) => 
                      t.target_user_id === m.user_id && t.video_url === videoUrl
                   )
                   
                   let count = record?.action_count || 0
                   // If completed today, show the action that was just done (count - 1)
                   if (supporterIdsToday.has(m.user_id) && count > 0) {
                      count = count - 1
                   }
                   
                   const actionStep = count % 3
                   let actionText = ""
                   let actionIcon = "❤️"
                   
                   switch(actionStep) {
                       case 0: 
                          actionText = `Liker la vidéo de ${m.profiles?.username || 'Membre'}`
                          actionIcon = "❤️"
                          break
                       case 1: 
                          actionText = `Commenter la vidéo de ${m.profiles?.username || 'Membre'}`
                          actionIcon = "💬"
                          break
                       case 2: 
                          actionText = `Ajouter aux favoris la vidéo de ${m.profiles?.username || 'Membre'}`
                          actionIcon = "⭐"
                          break
                       default:
                          actionText = `Soutenir ${m.profiles?.username || 'Membre'}`
                   }

                   return {
                     id: index + 2,
                     text: actionText,
                     icon: actionIcon,
                     completed: supporterIdsToday.has(m.user_id),
                     actionLabel: "Voir la vidéo",
                     actionUrl: videoUrl,
                     targetUserId: m.user_id
                   }
                 })
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
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Chargement du QG...</div>
  }

  return (
    <div className="space-y-8">
      <WelcomePopup userId={userProfile?.id} />
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

      {/* HERO SECTION: MY VIDEO */}
      <div className="rounded-xl border bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 p-1">
        <div className="bg-card rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              🚀 Ta Vidéo à Promouvoir
            </h2>
            <p className="text-muted-foreground max-w-lg">
              C'est le lien que ton escouade va recevoir aujourd'hui. <br/>
              <span className="font-medium text-foreground">Pas de lien = Pas de soutien !</span>
            </p>
          </div>
          
          <div className="w-full md:w-auto min-w-[300px]">
            {isEditingVideo ? (
              <div className="flex flex-col gap-3 p-4 bg-background border rounded-lg shadow-sm">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Lien de ta vidéo (TikTok, YouTube...)</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    placeholder="https://..."
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                    value={myVideoUrl}
                    onChange={(e) => setMyVideoUrl(e.target.value)}
                    autoFocus
                  />
                  <Button onClick={handleUpdateVideo}>Enregistrer</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 p-4 bg-background border rounded-lg shadow-sm">
                 <label className="text-xs font-semibold uppercase text-muted-foreground">Lien Actif</label>
                 <div className="flex items-center justify-between gap-4">
                    {myVideoUrl ? (
                      <div className="flex items-center gap-2 overflow-hidden">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <a href={myVideoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate max-w-[200px]">
                          {myVideoUrl}
                        </a>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        Aucune vidéo définie !
                      </span>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setIsEditingVideo(true)}>
                      Modifier
                    </Button>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* LEFT COLUMN (Wide): MISSIONS */}
        <div className="md:col-span-2 space-y-8">
           
           {/* MAIN MISSION CARD */}
           <div className="rounded-xl border-2 border-indigo-500/20 bg-indigo-50/10 shadow-lg overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              <div className="p-6 border-b bg-indigo-50/20">
                <h2 className="text-xl font-bold flex items-center gap-3 text-indigo-900">
                  <Clock className="h-6 w-6 text-indigo-600" />
                  TES MISSIONS DU JOUR
                </h2>
                <p className="text-indigo-700/80 mt-1">
                  Tu as jusqu'à <span className="font-bold">minuit</span> pour valider ces actions.
                </p>
              </div>
              
              <div className="p-6 space-y-4 bg-card relative">
                  {!isFullyOnboarded && (
                    <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4">
                      <Lock className="h-12 w-12 text-muted-foreground mb-2" />
                      <h3 className="text-lg font-bold text-foreground">Missions Verrouillées</h3>
                      <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                        Tu dois t'abonner à tous les membres de ton escouade pour débloquer tes missions du jour.
                      </p>
                      <Button asChild>
                        <Link href="/dashboard/group">
                          Voir mon escouade
                        </Link>
                      </Button>
                    </div>
                  )}
                  {tasks.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Aucune mission pour le moment.</p>
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div 
                        key={task.id} 
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition-all hover:shadow-md ${task.completed ? 'bg-green-50 border-green-200' : 'bg-background hover:border-indigo-200'} ${!isFullyOnboarded ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <div 
                          className="flex items-center gap-4 cursor-pointer flex-1"
                          onClick={() => toggleTask(task.id)}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${task.completed ? 'bg-green-500 border-green-500 text-white shadow-sm' : 'border-muted-foreground/30 bg-muted/10'}`}
                          >
                            {task.completed && <CheckCircle className="h-5 w-5" />}
                          </div>
                          <div className="space-y-1">
                             <span className={`font-semibold text-base ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                               {task.text}
                             </span>
                             {task.completed && <span className="text-xs text-green-600 font-medium block">Mission accomplie !</span>}
                          </div>
                        </div>
                        
                        {task.actionUrl && !task.completed && (
                           <Button className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" asChild>
                             <a href={task.actionUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                               {task.actionLabel}
                               <ExternalLink className="h-4 w-4" />
                             </a>
                           </Button>
                        )}
                      </div>
                    ))
                  )}
              </div>
              
              {allTasksCompleted && tasks.length > 0 && (
                <div className="bg-green-100 p-4 text-center text-green-800 font-medium border-t border-green-200">
                  🎉 Bravo ! Toutes les missions sont validées. Repose-toi soldat.
                </div>
              )}
           </div>

           {/* SQUAD SURVEILLANCE */}
           <div className="rounded-xl border bg-card shadow-sm">
             <div className="border-b p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                    Surveillance Escouade
                  </h2>
                  <p className="text-sm text-muted-foreground">Qui a fait le job ?</p>
                </div>
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

                    {dayProgress === 1 ? (
                       <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                         <Clock className="h-12 w-12 opacity-50" />
                         <p className="font-medium">Tu n'étais pas encore là hier !</p>
                         <p className="text-xs">Reviens demain pour voir ton premier bilan.</p>
                       </div>
                    ) : missingSupportersYesterday.length === 0 ? (
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
        </div>

        {/* RIGHT COLUMN: STATS & CHAT */}
        <div className="space-y-6">
           
           {/* STATS CARDS (Vertical Stack) */}
           <div className="grid gap-4">
              <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
                <div>
                   <p className="text-xs text-muted-foreground font-medium uppercase">Ta Fiabilité</p>
                   {dayProgress <= 3 ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold text-yellow-600">En Probation</span>
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      </div>
                   ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold">100%</span>
                        <Shield className="h-5 w-5 text-green-500 fill-green-500" />
                      </div>
                   )}
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${dayProgress <= 3 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                   <span className="text-lg">{dayProgress <= 3 ? '⚠️' : '🛡️'}</span>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
                <div>
                   <p className="text-xs text-muted-foreground font-medium uppercase">Progression</p>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold">J{dayProgress}</span>
                      <span className="text-sm text-muted-foreground">/ 30</span>
                   </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                   <span className="text-lg">📅</span>
                </div>
              </div>
           </div>

           {/* CHAT */}
           <div className="rounded-xl border bg-card shadow-sm h-[500px] flex flex-col">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-indigo-500" />
                Taverne
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

           {/* MEMBERS LIST (Compact) */}
           <div className="rounded-xl border bg-card shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="font-semibold text-sm">Membres ({squadMembers.length})</h3>
                 <Link href="/dashboard/group" className="text-xs text-blue-500 hover:underline">Voir tout</Link>
              </div>
              <div className="space-y-2">
                {squadMembers.slice(0, 5).map((m: any, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                      {m.profiles?.username?.charAt(0) || "?"}
                    </div>
                    <span className="truncate">{m.profiles?.username}</span>
                  </div>
                ))}
              </div>
           </div>

        </div>
      </div>
    </div>
  )
}
