"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, Upload, Clock, AlertCircle, ExternalLink, Heart, Lock, Shield, Eye, BarChart3, AlertTriangle, MessageSquareWarning, MessageCircle, Trophy, PartyPopper, Zap, Play, Gift, TrendingUp, Music, Users, Info } from "lucide-react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import Link from "next/link"

import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { WelcomePopup } from "@/components/welcome-popup"
import { MercenaryBoard } from "@/components/dashboard/mercenary-board"

export default function DashboardPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [disciplineScore, setDisciplineScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [myVideoUrl, setMyVideoUrl] = useState("")
  const [isEditingVideo, setIsEditingVideo] = useState(false)
  const [myProfileUrl, setMyProfileUrl] = useState("")
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [squadMembers, setSquadMembers] = useState<any[]>([])
  const [mySquadId, setMySquadId] = useState<string | null>(null)
  const [dayProgress, setDayProgress] = useState(1)
  const [isFullyOnboarded, setIsFullyOnboarded] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Boost Window State
  const [activeBoostWindow, setActiveBoostWindow] = useState<any>(null)
  const [nextBoostWindow, setNextBoostWindow] = useState<any>(null)
  const [hasParticipatedInBoost, setHasParticipatedInBoost] = useState(false)
  const [boostCredits, setBoostCredits] = useState(0)
  const [animateCredits, setAnimateCredits] = useState(false)
  const [dailyTrend, setDailyTrend] = useState<any>(null)
  const [myBuddy, setMyBuddy] = useState<any>(null)
  const [buddyScore, setBuddyScore] = useState(100)
  
  const [supportsReceived, setSupportsReceived] = useState<any[]>([])
  const [supportsReceivedYesterday, setSupportsReceivedYesterday] = useState<any[]>([])
  const [missingSupporters, setMissingSupporters] = useState<any[]>([])
  const [missingSupportersYesterday, setMissingSupportersYesterday] = useState<any[]>([])
  const [videoTrackingData, setVideoTrackingData] = useState<any[]>([])
  // Track which videos have been viewed in the current session (using Target User ID to be unique)
  const [viewedVideos, setViewedVideos] = useState<Set<string>>(new Set())

  // Load from session storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('viewedVideos')
    if (stored) {
      setViewedVideos(new Set(JSON.parse(stored)))
    }
  }, [])

  const [stats, setStats] = useState({
    day: 0,
    week: 0,
    month: 0
  })

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
           setMyProfileUrl(profile.main_platform || "")
           setBoostCredits(profile.boost_credits || 0)
         }

         // 1b. Fetch Daily Trend
         const { data: trend } = await supabase
            .from('daily_trends')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
         
         if (trend) setDailyTrend(trend)

         // 1c. Fetch Buddy
         const { data: buddyPair } = await supabase
            .from('buddy_pairs')
            .select('*')
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
         
         if (buddyPair) {
            const isUser1 = buddyPair.user1_id === user.id
            const partnerId = isUser1 ? buddyPair.user2_id : buddyPair.user1_id
            
            const { data: partnerProfile } = await supabase
               .from('profiles')
               .select('*')
               .eq('id', partnerId)
               .single()
            
            if (partnerProfile) {
               setMyBuddy(partnerProfile)
               setBuddyScore(buddyPair.shared_score)
            }
         }

         // === FEATURE BOOST WINDOW ===
         const nowISO = new Date().toISOString()
         
         // 1. Check Active Window
         const { data: activeWindow } = await supabase
           .from('boost_windows')
           .select('*')
           .lte('starts_at', nowISO)
           .gte('ends_at', nowISO)
           .single()

         if (activeWindow) {
            setActiveBoostWindow(activeWindow)
            // Check participation
            const { data: participation } = await supabase
              .from('boost_participations')
              .select('id')
              .eq('window_id', activeWindow.id)
              .eq('user_id', user.id)
              .single()
            
            if (participation) setHasParticipatedInBoost(true)
         } else {
            // 2. If no active window, check NEXT Scheduled Window
            const { data: nextWindow } = await supabase
               .from('boost_windows')
               .select('*')
               .gt('starts_at', nowISO)
               .order('starts_at', { ascending: true })
               .limit(1)
               .single()
            
            if (nextWindow) {
               setNextBoostWindow(nextWindow)
            }
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
            // === CHAT SETUP REMOVED (Moved to global widget) ===
            const squadId = membership.squad_id
            setMySquadId(squadId)
            
            const { data: members } = await supabase
              .from('squad_members')
              .select('user_id, created_at, profiles(id, username, current_video_url)')
              .eq('squad_id', membership.squad_id)
              .neq('user_id', user.id) // Exclude self
              .order('created_at', { ascending: true })
              
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

               // 1b. Fetch Today's supports GIVEN (for My Missions)
               const { data: supportsGiven } = await supabase
                 .from('daily_supports')
                 .select('target_user_id')
                 .eq('supporter_id', user.id)
                 .gte('created_at', today)
               
               const supportedIdsToday = new Set(supportsGiven?.map((s: any) => s.target_user_id))

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
                 ...allMembers.map((m: any, index: number) => {
                   // Determine Action Text based on history
                   const videoUrl = m.profiles?.current_video_url || "https://tiktok.com"
                   const record = videoTracking?.find((t: any) => 
                      t.target_user_id === m.user_id && t.video_url === videoUrl
                   )
                   
                   let count = record?.action_count || 0
                   // If completed today, show the action that was just done (count - 1)
                   if (supportedIdsToday.has(m.user_id) && count > 0) {
                      count = count - 1
                   }
                   
                   // Calculate deterministic rotation based on date and index
                   // This ensures 33% distribution across the squad daily regardless of individual history
                   const todayDate = new Date()
                   const dayOfYear = Math.floor((todayDate.getTime() - new Date(todayDate.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24)
                   const actionStep = (index + dayOfYear) % 3

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
                     completed: supportedIdsToday.has(m.user_id),
                     actionLabel: "Voir la vidéo",
                     actionUrl: videoUrl,
                     targetUserId: m.user_id
                   }
                 })
               ].filter(t => !t.text.toLowerCase().includes('publier 1 vidéo') && !t.text.toLowerCase().includes('tiktok studio')) // Filter out potential ghost tasks
               
               setTasks(newTasks)
            } else {
               // Fallback if alone in squad
               setTasks([
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
            setTasks([])
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

  const handleUpdateProfile = async () => {
    if (!myProfileUrl) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('profiles').update({ main_platform: myProfileUrl }).eq('id', user.id)
      
      if (error) throw error
      
      setIsEditingProfile(false)
      toast.success("Profil mis à jour", { description: "Ton escouade peut maintenant t'ajouter !" })
    } catch (error) {
      toast.error("Erreur de mise à jour")
    }
  }

  const handleViewVideo = (targetId: string) => {
    setViewedVideos(prev => {
      const newSet = new Set(prev).add(targetId)
      sessionStorage.setItem('viewedVideos', JSON.stringify(Array.from(newSet)))
      return newSet
    })
  }

  const toggleTask = async (id: number) => {
    // Optimistic Update
    const taskIndex = tasks.findIndex(t => t.id === id)
    const task = tasks[taskIndex]
    
    // Prevent toggling if video hasn't been viewed (unless it's already completed or not a video task)
    if (task.actionUrl && !task.completed && !viewedVideos.has(task.targetUserId)) {
       toast.error("Action impossible", { 
         description: "Tu dois d'abord voir la vidéo avant de valider la mission !",
         icon: <Lock className="h-4 w-4 text-orange-500" />
       })
       return
    }

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
                // 0. Send Chat Notification
                if (mySquadId) {
                   // Robust text matching and username retrieval
                   const targetMember = squadMembers.find(m => m.user_id === task.targetUserId)
                   const targetName = targetMember?.profiles?.username || "un membre"
                   
                   let messageContent = ""
                   
                   if (task.text.includes("Liker")) {
                      messageContent = `J'ai liké la vidéo de ${targetName} ! ❤️`
                   } else if (task.text.includes("Commenter")) {
                      messageContent = `J'ai commenté la vidéo de ${targetName} ! 💬`
                   } else if (task.text.includes("favoris")) {
                      messageContent = `J'ai ajouté la vidéo de ${targetName} aux favoris ! ⭐`
                   }

                   if (messageContent) {
                      const { error: msgError } = await supabase.from('squad_messages').insert({
                         squad_id: mySquadId,
                         user_id: user.id,
                         username: userProfile?.username || "Soldat",
                         content: messageContent
                      })
                      
                      if (msgError) {
                         console.error("Erreur notification chat:", msgError)
                      }
                   }
                } else {
                   // Fallback try fetch if state is empty (rare)
                   const { data: membership } = await supabase.from('squad_members').select('squad_id').eq('user_id', user.id).single()
                   if (membership) {
                       // Retry logic could go here but let's keep it simple
                       console.log("Squad ID missing from state, fetched:", membership.squad_id)
                   }
                }

                // 1. Log Daily Support (for visual stats)
                const { error: supportError } = await supabase.from('daily_supports').insert({
                   supporter_id: user.id,
                   target_user_id: task.targetUserId
                })
                
                if (supportError) {
                  console.error("Support insert error:", supportError)
                  toast.error("Erreur de sauvegarde de la mission")
                }

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

  const handleBoostValidation = async () => {
    if (!activeBoostWindow) return
    
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Insert Participation
        const { error: partError } = await supabase.from('boost_participations').insert({
            window_id: activeBoostWindow.id,
            user_id: user.id
        })
        
        if (partError) {
          // If already participated (unique constraint), just ignore or toast info
          toast.info("Déjà participé !")
          return
        }

        // 2. Update Credits (Optimistic UI)
        setBoostCredits(prev => prev + 1)
        setAnimateCredits(true)
        setTimeout(() => setAnimateCredits(false), 2000)
        setHasParticipatedInBoost(true)

        // 3. Direct Update
        await supabase.from('profiles').update({ 
            boost_credits: boostCredits + 1 
        }).eq('id', user.id)

        toast.success("Boost Validé ! +1 Crédit", { icon: <Zap className="h-4 w-4 text-yellow-500" /> })

    } catch (e) {
        toast.error("Erreur validation")
    }
  }
  
  const handleCreditsEarned = () => {
    setBoostCredits(prev => prev + 1)
    setAnimateCredits(true)
    setTimeout(() => setAnimateCredits(false), 2000)
  }

  const allTasksCompleted = tasks.length > 0 && tasks.every(t => t.completed)
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Chargement du QG...</div>
  }

  return (
    <div className="space-y-8">
      <WelcomePopup userId={userProfile?.id} />

      {/* MERCENARY PROTOCOL ALERT ZONE */}
      <MercenaryBoard onCreditsEarned={handleCreditsEarned} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-4">
             <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                 QG OPÉRATIONNEL
               </h1>
               <div className="flex items-center gap-4 mt-2">
                 <motion.div 
                    animate={animateCredits ? { scale: [1, 1.3, 1], borderColor: ["#fef08a", "#eab308", "#fef08a"] } : {}}
                    transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
                    className="flex items-center gap-2 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-200 shadow-sm relative overflow-hidden"
                 >
                    {animateCredits && <motion.div className="absolute inset-0 bg-yellow-300 opacity-50" initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 0.5 }} />}
                    <Zap className={`h-4 w-4 text-yellow-600 ${animateCredits ? 'fill-yellow-600' : ''}`} />
                    <span className="text-sm font-bold text-yellow-800">{boostCredits} Crédits</span>
                 </motion.div>
                 
                 {dayProgress <= 3 && !allTasksCompleted ? (
                   <div className="flex items-center gap-2 bg-red-100 px-3 py-1 rounded-full border border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-bold text-red-800">Fiabilité: Probation</span>
                   </div>
                 ) : (
                   <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full border border-green-200">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-bold text-green-800">Fiabilité: 100%</span>
                   </div>
                 )}

                 <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
                    <span className="text-sm font-bold text-blue-800">Progression: J{dayProgress}/30</span>
                 </div>
               </div>
             </div>
           </div>
           <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2 font-bold border-2">
                <Shield className="h-4 w-4" />
                Escouade {mySquadId ? "Alpha" : "..."}
              </Button>
           </div>
      </div>

      {/* === BUDDY WIDGET (PARRAINAGE) === */}
      {myBuddy ? (
        <motion.div 
           initial={{ y: -20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="w-full rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 p-4 mb-6 relative overflow-hidden mt-6"
        >
           <div className="absolute top-0 right-0 p-4 opacity-5">
              <Users className="h-32 w-32 text-purple-500" />
           </div>

           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                 <div className="relative">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
                       <div className="h-full w-full rounded-full bg-background flex items-center justify-center text-lg font-bold uppercase overflow-hidden">
                          {myBuddy.username?.charAt(0) || "?"}
                       </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 h-4 w-4 rounded-full border-2 border-background" />
                 </div>
                 <div>
                    <div className="flex items-center gap-2">
                       <h3 className="font-bold text-lg">{myBuddy.username}</h3>
                       <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                          Ton Binôme
                       </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Protège ses arrières, il protège les tiennes.</p>
                 </div>
              </div>

              <div className="flex items-center gap-6">
                 <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5">
                       <Shield className="h-5 w-5 text-indigo-500" />
                       <span className="text-2xl font-black text-indigo-700">{buddyScore}</span>
                       <TooltipProvider>
                          <Tooltip>
                             <TooltipTrigger>
                                <Info className="h-5 w-5 text-indigo-400 cursor-help hover:text-indigo-600 transition-colors" />
                             </TooltipTrigger>
                             <TooltipContent className="max-w-xs bg-indigo-950 border-indigo-500/50 text-white p-4 shadow-xl">
                                <p className="font-bold text-indigo-200 mb-2">C'est votre score commun !</p>
                                <p className="text-sm mb-2">Si ton binôme ne valide pas ses missions, VOUS perdez tous les deux des points. Motive-le !</p>
                                <p className="text-xs italic text-indigo-300 border-t border-indigo-800 pt-2 mt-2">
                                   Ces points vous serviront dans un avenir proche ;)
                                </p>
                             </TooltipContent>
                          </Tooltip>
                       </TooltipProvider>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-indigo-400">Score d'Escouade</span>
                 </div>

                 <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2" onClick={() => window.open(myBuddy.main_platform || myBuddy.current_video_url, '_blank')}>
                    <ExternalLink className="h-4 w-4" />
                    Voir son Profil
                 </Button>
              </div>
           </div>
        </motion.div>
      ) : (
        <div className="w-full rounded-xl border border-dashed border-muted p-4 mb-6 text-center mt-6">
           <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
             <Users className="h-4 w-4" />
             Tu n'as pas de binôme assigné cette semaine. 
           </p>
        </div>
      )}
      
      {/* === BOOST WINDOW BANNER === */}
        {activeBoostWindow ? (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 p-6 relative overflow-hidden mb-6"
          >
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Zap className="h-24 w-24 text-yellow-500" />
             </div>
             
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center animate-pulse">
                   <Zap className="h-6 w-6 text-yellow-600" />
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-yellow-700 uppercase tracking-tight">Boost Window Active !</h3>
                   <p className="text-sm text-yellow-800/80 font-medium">Fenêtre d'opportunité ouverte. Participe pour gagner des crédits.</p>
                 </div>
               </div>

               <div className="flex items-center gap-4">
                  {hasParticipatedInBoost ? (
                    <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full border border-yellow-200">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-bold text-green-700">Participation Validée</span>
                    </div>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 px-8 py-6 text-lg animate-bounce-slow">
                           PARTICIPER MAINTENANT
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-black flex items-center gap-2 text-indigo-900">
                            <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                            MISSION BOOST
                          </DialogTitle>
                          <DialogDescription className="text-base">
                            Aide un membre de l'escouade à percer l'algorithme. Fais les 3 actions ci-dessous rapidement.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-6 py-4">
                          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 text-center">
                            <p className="text-xs font-bold text-indigo-400 uppercase mb-2">Cible du jour</p>
                            <a 
                              href={activeBoostWindow.target_video_url} 
                              target="_blank" 
                              className="text-lg font-bold text-indigo-600 hover:underline flex items-center justify-center gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Ouvrir la Vidéo
                            </a>
                          </div>

                          <div className="space-y-3">
                             <div className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                               <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center">
                                 <Heart className="h-4 w-4 text-pink-600" />
                               </div>
                               <span className="font-medium text-slate-700">Liker la vidéo</span>
                             </div>
                             <div className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                               <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                 <MessageCircle className="h-4 w-4 text-blue-600" />
                               </div>
                               <span className="font-medium text-slate-700">Laisser un commentaire (4 mots min)</span>
                             </div>
                             <div className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                               <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                 <Gift className="h-4 w-4 text-yellow-600" />
                               </div>
                               <span className="font-medium text-slate-700">Ajouter aux Favoris</span>
                             </div>
                          </div>
                        </div>

                        <DialogFooter className="sm:justify-center">
                          <Button 
                            onClick={handleBoostValidation}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg"
                          >
                            J'AI FAIT LES ACTIONS (+1 CRÉDIT)
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
               </div>
             </div>
          </motion.div>
        ) : nextBoostWindow ? (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 p-6 relative overflow-hidden mb-6"
          >
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Clock className="h-24 w-24 text-blue-500" />
             </div>
             
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                   <Clock className="h-6 w-6 text-blue-600" />
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-blue-900 uppercase tracking-tight">Prochain Boost Programmé</h3>
                   <p className="text-sm text-blue-800/80 font-medium">
                     Prépare-toi soldat ! L'assaut commence à <span className="font-bold text-blue-900 bg-blue-200 px-1 rounded">{new Date(nextBoostWindow.starts_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   </p>
                 </div>
               </div>

               <div className="bg-white/80 backdrop-blur px-4 py-3 rounded-lg border border-blue-100 text-sm font-medium text-blue-800 shadow-sm max-w-md">
                  💡 Participer au prochain Boost pour gagner des points et devenir la prochaine cible. <br/>
                  "la cible" : c'est la vidéo qui est likée, partagée, commentée par tous les membres TROUPERS pendant 15 minutes &#128561;
               </div>
             </div>
          </motion.div>
        ) : null}

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

      {/* HERO SECTION: MY PROFILE */}
      <div className="rounded-xl border bg-gradient-to-r from-orange-500/10 via-red-500/10 to-yellow-500/10 p-1">
        <div className="bg-card rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600">
              👤 Ton Compte à Promouvoir
            </h2>
            <p className="text-muted-foreground max-w-lg">
              Le lien de ton profil principal (TikTok, Instagram...) pour que ton escouade puisse s'abonner à toi. <br/>
              <span className="font-medium text-foreground">Indispensable pour recevoir des abonnements !</span>
            </p>
          </div>
          
          <div className="w-full md:w-auto min-w-[300px]">
            {isEditingProfile ? (
              <div className="flex flex-col gap-3 p-4 bg-background border rounded-lg shadow-sm">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Lien de ton profil</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    placeholder="https://tiktok.com/@..."
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-orange-500"
                    value={myProfileUrl}
                    onChange={(e) => setMyProfileUrl(e.target.value)}
                    autoFocus
                  />
                  <Button onClick={handleUpdateProfile} className="bg-orange-600 hover:bg-orange-700">Sauvegarder</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 p-4 bg-background border rounded-lg shadow-sm">
                 <label className="text-xs font-semibold uppercase text-muted-foreground">Profil Actif</label>
                 <div className="flex items-center justify-between gap-4">
                    {myProfileUrl ? (
                      <div className="flex items-center gap-2 overflow-hidden">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <a href={myProfileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate max-w-[200px]">
                          {myProfileUrl}
                        </a>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        Aucun profil défini !
                      </span>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
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
                <div className="text-indigo-700/80 mt-2 space-y-1 text-sm">
                  <p>Tu as jusqu'à <span className="font-bold">minuit</span> pour valider ces actions.</p>
                  <p className="font-medium">1 : Clique sur la vidéo et accomplis ta mission</p>
                  <p className="font-medium">2 : Une fois fait, valide ta mission en cliquant sur le rond.</p>
                </div>
              </div>
              
              <div className="p-6 space-y-4 bg-card relative">
                  {!isFullyOnboarded ? (
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
                  ) : !myVideoUrl ? (
                    <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4">
                      <AlertCircle className="h-12 w-12 text-orange-500 mb-2" />
                      <h3 className="text-lg font-bold text-foreground">Missions Verrouillées</h3>
                      <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                        Tu dois ajouter le lien de ta vidéo pour accéder aux missions. "Pas de lien = Pas de soutien !"
                      </p>
                      <Button onClick={() => {
                        setIsEditingVideo(true)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}>
                        Ajouter ma vidéo
                      </Button>
                    </div>
                  ) : null}
                  {tasks.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Aucune mission pour le moment.</p>
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div 
                        key={task.id} 
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition-all hover:shadow-md ${task.completed ? 'bg-green-50 border-green-200' : 'bg-background hover:border-indigo-200'} ${(!isFullyOnboarded || !myVideoUrl) ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <div 
                            className={`flex items-center gap-4 flex-1 ${!task.completed && task.actionUrl && !viewedVideos.has(task.targetUserId) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                            onClick={() => toggleTask(task.id)}
                          >
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${task.completed ? 'bg-green-500 border-green-500 text-white shadow-sm' : (!task.completed && task.actionUrl && !viewedVideos.has(task.targetUserId) ? 'border-gray-300 bg-gray-100' : 'border-muted-foreground/30 bg-muted/10')}`}
                            >
                              {task.completed ? <CheckCircle className="h-5 w-5" /> : (!task.completed && task.actionUrl && !viewedVideos.has(task.targetUserId) ? <Lock className="h-4 w-4 text-gray-400" /> : null)}
                            </div>
                          <div className="space-y-1">
                             <span className={`font-semibold text-base ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                               {task.text}
                             </span>
                             {task.completed && <span className="text-xs text-green-600 font-medium block">Mission accomplie !</span>}
                          </div>
                        </div>
                        
                        {task.actionUrl && !task.completed && (
                           <Button 
                             className={`shrink-0 text-white shadow-sm ${viewedVideos.has(task.targetUserId) ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`} 
                             asChild
                           >
                             <a 
                               href={task.actionUrl} 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="flex items-center gap-2"
                               onClick={() => handleViewVideo(task.targetUserId)}
                             >
                               {viewedVideos.has(task.targetUserId) ? "Revoir la vidéo" : task.actionLabel}
                               <ExternalLink className="h-4 w-4" />
                             </a>
                           </Button>
                        )}
                      </div>
                    ))
                  )}
              </div>
              
              {allTasksCompleted && tasks.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 text-center border-t border-green-200 flex flex-col items-center gap-4"
                >
                  <motion.div
                    initial={{ rotate: -10, scale: 0 }}
                    animate={{ rotate: 10, scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.2,
                      repeat: Infinity,
                      repeatType: "reverse",
                      duration: 1.5
                    }}
                  >
                    <Trophy className="h-16 w-16 text-yellow-500 fill-yellow-500 drop-shadow-md" />
                  </motion.div>
                  
                  <div className="space-y-2">
                    <motion.h3 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-2xl font-bold text-green-800"
                    >
                      BRAVO SOLDAT ! 🎉
                    </motion.h3>
                    <motion.p 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-green-700 font-medium text-lg"
                    >
                      Tu as été au bout de tes missions !!
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.9 }}
                      className="text-sm text-green-600/80 italic"
                    >
                      Ton escouade te remercie. Repose-toi maintenant.
                    </motion.p>
                  </div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, type: "spring" }}
                    className="flex gap-2"
                  >
                     <PartyPopper className="h-6 w-6 text-purple-500" />
                     <PartyPopper className="h-6 w-6 text-blue-500" />
                     <PartyPopper className="h-6 w-6 text-orange-500" />
                  </motion.div>
                </motion.div>
              )}
           </div>

        </div>

        {/* RIGHT COLUMN: STATS & CHAT */}
        <div className="space-y-6">
           
           {/* STATS CARDS (Vertical Stack) */}
           <div className="grid gap-4">
              
              {/* SURVEILLANCE SHORTCUT */}
              <Link href="/dashboard/surveillance">
                <div className="rounded-xl border bg-gradient-to-br from-slate-900 to-slate-800 p-5 shadow-lg flex items-center justify-between hover:scale-[1.02] transition-transform cursor-pointer group relative overflow-hidden">
                  {/* Radar Effect Background */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500/10 to-transparent opacity-50 animate-pulse-slow pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                       <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Accès Classifié</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-white tracking-tight">SURVEILLANCE</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 group-hover:text-green-400 transition-colors">
                       Accéder au radar tactique
                    </p>
                  </div>
                  
                  <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 group-hover:border-green-500/50 flex items-center justify-center transition-colors relative z-10">
                      <Eye className="h-6 w-6 text-green-500 group-hover:animate-pulse" />
                  </div>
                </div>
              </Link>
           </div>

           {/* CHAT - REMOVED (Moved to global widget) */}
           
           {/* Broadcast Channel Button for Everyone */}
           {!isAdmin && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                 <MessageCircle className="h-5 w-5 text-green-600" />
                 <span className="font-semibold text-green-800 text-sm">Rejoins le QG du Général</span>
              </div>
              <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white" asChild>
                <a href="https://whatsapp.com/channel/0029VbBcgs71iUxRPnXEdF1z" target="_blank" rel="noopener noreferrer">
                  Rejoindre sur WhatsApp
                </a>
              </Button>
            </div>
           )}

        </div>
      </div>
    </div>
  )
}
