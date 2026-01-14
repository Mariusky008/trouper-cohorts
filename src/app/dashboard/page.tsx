"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, Upload, Clock, AlertCircle, ExternalLink, Heart, Lock, Shield, Eye, BarChart3, AlertTriangle, MessageSquareWarning, MessageCircle, Trophy, PartyPopper, Zap, Play, Gift, TrendingUp, Music, Users, Info, ChevronRight, Medal } from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"

import Link from "next/link"

import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { WelcomePopup } from "@/components/welcome-popup"
import { MercenaryBoard } from "@/components/dashboard/mercenary-board"
import { MissionPlan } from "@/components/dashboard/MissionPlan"
import { MissionBriefing } from "@/components/dashboard/MissionBriefing"
import { WaveSchedule } from "@/components/dashboard/WaveSchedule"
import dynamic from "next/dynamic"

// Dynamic import to prevent hydration mismatch on dates
const WaveNotification = dynamic(
  () => import("@/components/dashboard/WaveNotification").then(mod => mod.WaveNotification),
  { ssr: false }
)

// Helper for deterministic shuffling based on date + userId
function getDailySeed(userId: string) {
  const today = new Date().toISOString().split('T')[0]
  let hash = 0
  const str = userId + today
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function seededShuffle(array: any[], seed: number) {
  const result = [...array]
  let m = result.length, t, i
  while (m) {
    i = Math.floor(seededRandom(seed + m) * m--)
    t = result[m]
    result[m] = result[i]
    result[i] = t
  }
  return result
}

import { extractTikTokUsername } from "@/lib/utils"

export default function DashboardPage() {
  // ALGO V4.0 - AUTO FLOW - STABLE TASKS
  const [tasks, setTasks] = useState<any[]>([])
  
  // No more manual index management - we always show the first incomplete task
  // or the last completed one if all are done (to show success screen)
  const activeTask = tasks.find(t => !t.completed)
  const activeTaskIndex = tasks.findIndex(t => !t.completed)
  const displayIndex = activeTaskIndex === -1 ? tasks.length : activeTaskIndex
  
  // Auto-scroll to top when active task changes (Smooth UX)
  useEffect(() => {
     if (activeTask) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
     }
  }, [activeTask?.id])

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
  const [huntingStats, setHuntingStats] = useState({ likes: 0, comments: 0, favorites: 0 })
  
  const [supportsReceived, setSupportsReceived] = useState<any[]>([])
  const [supportsReceivedYesterday, setSupportsReceivedYesterday] = useState<any[]>([])
  const [missingSupporters, setMissingSupporters] = useState<any[]>([])
  const [missingSupportersYesterday, setMissingSupportersYesterday] = useState<any[]>([])
  const [videoTrackingData, setVideoTrackingData] = useState<any[]>([])
  // Track which videos have been viewed in the current session (using Target User ID to be unique)
  const [viewedVideos, setViewedVideos] = useState<Set<string>>(new Set())
  
  // Contact Form State
  const [contactMessage, setContactMessage] = useState("")
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [sendingContact, setSendingContact] = useState(false)
  
  // UX State
  const [briefingCompleted, setBriefingCompleted] = useState(false)

  // Auto Flow Logic: Reset briefing when task changes
  useEffect(() => {
     setBriefingCompleted(false)
  }, [activeTask?.id])

  // Load from session storage on mount with DATE CHECK
  useEffect(() => {
    // DEBUG: Always clear cache on reload to ensure full flow testing
    sessionStorage.removeItem('viewedVideos')
    setViewedVideos(new Set())
    
    /* RESTORE THIS FOR PRODUCTION
    const todayStr = new Date().toISOString().split('T')[0]
    const stored = sessionStorage.getItem('viewedVideos')
    
    if (stored) {
      try {
          const parsed = JSON.parse(stored)
          // Check if it's the old format (array) or new format (object with date)
          if (Array.isArray(parsed)) {
              // Old format: Clear it to be safe
              sessionStorage.removeItem('viewedVideos')
          } else if (parsed.date === todayStr && Array.isArray(parsed.ids)) {
              // Valid cache for TODAY
              setViewedVideos(new Set(parsed.ids))
          } else {
              // Expired cache (from yesterday or before)
              console.log("Clearing expired viewed videos cache")
              sessionStorage.removeItem('viewedVideos')
          }
      } catch (e) {
          sessionStorage.removeItem('viewedVideos')
      }
    }
    */
  }, [])

  const [stats, setStats] = useState({
    day: 0,
    week: 0,
    month: 0
  })

  const [showDemoWave, setShowDemoWave] = useState(false) // Deprecated

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

         // 1d. Fetch Hunting Stats (Total Received Interactions)
         const { count: totalInteractions } = await supabase
            .from('daily_supports')
            .select('*', { count: 'exact', head: true })
            .eq('target_user_id', user.id)
         
         const total = totalInteractions || 0
         setHuntingStats({
            likes: Math.ceil(total * 0.6),
            comments: Math.ceil(total * 0.3),
            favorites: Math.ceil(total * 0.1)
         })

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
              .select('user_id, joined_at, profiles(id, username, current_video_url)')
              .eq('squad_id', membership.squad_id)
              .neq('user_id', user.id) // Exclude self
              .order('joined_at', { ascending: true })
              
            // Check subscriptions status
            const { data: subscriptions } = await supabase
              .from('member_subscriptions')
              .select('target_user_id')
              .eq('subscriber_id', user.id)
            
            const subscribedIds = new Set(subscriptions?.map((s: { target_user_id: string }) => s.target_user_id))
            
            // Check if user is subscribed to all members (DEPRECATED: No longer required)
            const allMembers = members || []
            // We set it to true by default to unlock missions immediately
            setIsFullyOnboarded(true)

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
               
               // === ENGINE V3: WAVE SYSTEM INTEGRATION ===
               // 1. Fetch Today's Waves
               let activeWaves: any[] = []
               try {
                   const { data: waves } = await supabase
                       .from('daily_waves')
                       .select('*')
                       .eq('squad_id', membership.squad_id)
                       .eq('scheduled_date', today)
                   
                   if (waves && waves.length > 0) {
                       activeWaves = waves
                   }
               } catch (e) {
                   console.log("Wave system not active yet, using fallback")
               }

               // === TACTICAL SAMPLING (ALGO V3) ===
               // 1. Deterministic Shuffle
               const dailySeed = getDailySeed(user.id)
               const shuffledMembers = seededShuffle(allMembers, dailySeed)
               
               // 2. Select Members based on Waves OR Fallback
               let selectedMembers: any[] = []
               let waveConfigMap = new Map<string, any>() // userId -> waveConfig

               if (activeWaves.length > 0) {
                   // V3: Use Waves
                   const waveUserIds = new Set(activeWaves.map(w => w.creator_id))
                   selectedMembers = allMembers.filter((m: any) => waveUserIds.has(m.user_id))
                   
                   // Map wave type to user
                   activeWaves.forEach(w => {
                       waveConfigMap.set(w.creator_id, w)
                   })
                   
                   // If not enough waves (e.g. < 8), fill with randoms (Noise)
                   if (selectedMembers.length < 8) {
                       const remaining = shuffledMembers.filter((m: any) => !waveUserIds.has(m.user_id))
                       const fillCount = 8 - selectedMembers.length
                       selectedMembers = [...selectedMembers, ...remaining.slice(0, fillCount)]
                   }
               } else {
                   // V2 Fallback: Limit Workload (8-12 videos max)
                   const workloadLimit = 8 + Math.floor(seededRandom(dailySeed) * 5) // 8 to 12
                   selectedMembers = shuffledMembers.slice(0, workloadLimit)
               }
               
               const newTasks = [
                 ...selectedMembers.map((m: any, index: number) => {
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
                   
                   // ALGO V3: Smart Distribution based on Wave Type
                   // We use the seed + index to create a stable random per user per day
                   const distributionVal = seededRandom(dailySeed + index + 100) * 100 // 0-100
                   const trafficSourceVal = seededRandom(dailySeed + index + 200) * 100 // 0-100
                   const delayVal = Math.floor(seededRandom(dailySeed + index + 300) * 20) // 0-20 min

                   let actionType = 'watch'
                   let actionText = ""
                   let actionIcon = "👀"
                   let scenario = 'engagement'
                   
                   // Check Wave Type
                   const wave = waveConfigMap.get(m.user_id)
                   const isCoreWave = wave?.wave_type === 'core'
                   
                   // V3 LOGIC
                   if (isCoreWave) {
                       // CORE WAVE: 90% Engagement, 10% Abandon (Natural)
                       if (distributionVal < 10) {
                           actionType = 'watch' // Watch Only (Ghost)
                           actionText = `Regarder uniquement (Ghost) - Cible Prioritaire`
                           actionIcon = "👻"
                           scenario = 'watch_only'
                       } else if (distributionVal < 40) {
                           actionType = 'like'
                           actionText = `Liker la vidéo Prioritaire de ${m.profiles?.username || 'Membre'}`
                           actionIcon = "❤️"
                       } else if (distributionVal < 70) {
                           actionType = 'favorite'
                           actionText = `Ajouter aux favoris (Cible Core)`
                           actionIcon = "⭐"
                       } else {
                           actionType = 'comment'
                           actionText = `Commenter la vidéo (Cible Core)`
                           actionIcon = "💬"
                       }
                   } else if (wave?.wave_type === 'noise') {
                       // NOISE WAVE: 80% Weak/Abandon, 20% Like
                       if (distributionVal < 50) {
                           actionType = 'scroll_fast'
                           actionText = `Micro-Abandon (Noise) sur ${m.profiles?.username || 'Membre'}`
                           actionIcon = "⏩"
                           scenario = 'abandon'
                       } else if (distributionVal < 80) {
                           actionType = 'watch'
                           actionText = `Regarder sans liker (Noise)`
                           actionIcon = "👀"
                           scenario = 'watch_only'
                       } else {
                           actionType = 'like'
                           actionText = `Liker simplement (Noise)`
                           actionIcon = "❤️"
                       }
                   } else {
                       // FALLBACK V2 LOGIC (No Wave Defined)
                       if (distributionVal < 30) { 
                          // 0-30% -> WATCH ONLY
                          actionType = 'watch'
                          actionText = `Regarder uniquement la vidéo de ${m.profiles?.username || 'Membre'}`
                          actionIcon = "👀"
                       } else if (distributionVal < 60) {
                          // 30-60% -> WATCH + LIKE
                          actionType = 'like'
                          actionText = `Liker la vidéo de ${m.profiles?.username || 'Membre'}`
                          actionIcon = "❤️"
                       } else if (distributionVal < 80) {
                          // 60-80% -> WATCH + COMMENT
                          actionType = 'comment'
                          actionText = `Commenter la vidéo de ${m.profiles?.username || 'Membre'}`
                          actionIcon = "💬"
                       } else if (distributionVal < 90) {
                          // 80-90% -> WATCH + FAVORITE
                          actionType = 'favorite'
                          actionText = `Ajouter aux favoris la vidéo de ${m.profiles?.username || 'Membre'}`
                          actionIcon = "⭐"
                       } else {
                          // 90-100% -> SCROLL FAST (MICRO-ABANDON)
                          actionType = 'scroll_fast'
                          actionText = `Micro-Abandon sur la vidéo de ${m.profiles?.username || 'Membre'}`
                          actionIcon = "⏩"
                          scenario = 'abandon'
                       }
                   }
                   
                   // Traffic Source Distribution
                   // 50% Search, 30% Profile, 20% Direct
                   let trafficSource = 'search'
                   if (trafficSourceVal > 50) trafficSource = 'profile'
                   if (trafficSourceVal > 80) trafficSource = 'direct'
                   
                   // Follow Logic (Rare: 10% chance if not already following)
                   // We don't have follow status here easily, so we just suggest it rarely
                   const shouldFollow = seededRandom(dailySeed + index + 400) > 0.9

                   // Extract handle from profile URL or Video URL
                   const handle = extractTikTokUsername(m.profiles?.main_platform) || extractTikTokUsername(videoUrl) || m.profiles?.username || "Inconnu"
                   const displayUsername = handle.startsWith('@') ? handle.substring(1) : handle

                   // V3.1: Check Lock Status
                   let isLocked = false
                   let lockMessage = ""
                   
                   if (isCoreWave || wave?.wave_type === 'noise') {
                       // Wave Start Time Logic
                       const now = new Date()
                       const waveStart = wave ? new Date(wave.scheduled_date + 'T' + wave.start_time) : new Date()
                       // Unlock 45 min before wave start (publication time)
                       const unlockTime = new Date(waveStart.getTime() - 45 * 60000) 
                       
                       if (now < unlockTime) {
                           isLocked = true
                           lockMessage = `🔒 Déverrouillage à ${unlockTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                           actionText = lockMessage // Override text
                           actionIcon = "🔒"
                       }
                   }

                   return {
                     id: index + 2,
                     text: actionText,
                     icon: actionIcon,
                     completed: supportedIdsToday.has(m.user_id),
                     actionLabel: isLocked ? "En attente" : "Voir la mission",
                     actionUrl: videoUrl,
                     targetUserId: m.user_id,
                     // Meta for MissionPlan
                     type: actionType,
                     scenario: scenario,
                     trafficSource: trafficSource,
                     delayMinutes: delayVal,
                     targetUsername: displayUsername,
                     shouldFollow: shouldFollow,
                     isLocked: isLocked // Pass lock status
                   }
                 })
               ].filter(t => !t.text.toLowerCase().includes('publier 1 vidéo')) 
               
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
      // Store with Date to allow expiration
      const cacheData = {
          date: new Date().toISOString().split('T')[0],
          ids: Array.from(newSet)
      }
      sessionStorage.setItem('viewedVideos', JSON.stringify(cacheData))
      return newSet
    })
  }

  const toggleTask = async (id: number) => {
    // Optimistic Update
    const taskIndex = tasks.findIndex(t => t.id === id)
    const task = tasks[taskIndex]
    
    // V3.1: Prevent Locked Tasks
    if (task.isLocked) {
        toast.error("Mission Verrouillée", {
            description: "Attends l'heure de publication de la cible.",
            icon: <Lock className="h-4 w-4 text-slate-500" />
        })
        return
    }
    
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
                }

                // 1. Log Daily Support (for visual stats)
                const { error: supportError } = await supabase.from('daily_supports').insert({
                   supporter_id: user.id,
                   target_user_id: task.targetUserId
                })
                
                if (supportError) {
                  console.error("Support insert error:", supportError)
                }

                // 2. Log Video Tracking (for rotation logic)
                const { data: tracking } = await supabase
                  .from('video_tracking')
                  .select('action_count')
                  .eq('supporter_id', user.id)
                  .eq('target_user_id', task.targetUserId)
                  .eq('video_url', task.actionUrl)
                  .single()

                if (tracking) {
                   const newCount = (tracking.action_count || 0) + 1
                   await supabase.from('video_tracking').update({ 
                      action_count: newCount,
                      last_action_at: new Date().toISOString()
                   }).eq('supporter_id', user.id).eq('target_user_id', task.targetUserId).eq('video_url', task.actionUrl)
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

  const handleSendContact = async () => {
    if (!contactMessage.trim()) return

    setSendingContact(true)
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Try inserting into dedicated admin_messages table
        const { error: msgError } = await supabase.from('admin_messages').insert({
            user_id: user.id,
            subject: "Contact Dashboard",
            content: contactMessage
        })

        if (!msgError) {
            toast.success("Message envoyé au QG", { description: "L'administrateur vous répondra bientôt." })
            setContactMessage("")
            setIsContactOpen(false)
            return
        }

        // 2. Fallback: Insert into reports table if admin_messages table doesn't exist yet
        console.warn("Fallback to reports table:", msgError)
        
        const { error } = await supabase.from('reports').insert({
            reporter_id: user.id,
            target_user_id: user.id, // Self-report technically
            target_username: "CONTACT_ADMIN: " + contactMessage.substring(0, 50) + "..."
        })

        if (error) throw error

        toast.success("Message envoyé au QG", { description: "L'administrateur vous répondra bientôt." })
        setContactMessage("")
        setIsContactOpen(false)
    } catch (e) {
        console.error(e)
        // Fallback: Open mail client if API fails
        window.location.href = `mailto:mariustalk@yahoo.fr?subject=Problème Troupers&body=${encodeURIComponent(contactMessage)}`
    } finally {
        setSendingContact(false)
    }
  }

  const allTasksCompleted = tasks.length > 0 && tasks.every(t => t.completed)
  
  // Calculate Rank based on progression
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  
  const getRank = (pct: number) => {
     if (pct >= 100) return { name: "Légende", color: "text-yellow-500", icon: Trophy }
     if (pct >= 75) return { name: "Vétéran", color: "text-purple-600", icon: Medal }
     if (pct >= 50) return { name: "Sergent", color: "text-indigo-600", icon: Shield }
     if (pct >= 25) return { name: "Soldat", color: "text-blue-600", icon: Users }
     return { name: "Recrue", color: "text-slate-500", icon: Users }
  }

  const currentRank = getRank(progressPercentage)

  // Calculate Boost Action for current user
  const boostActionType = (() => {
     if (!activeBoostWindow || !userProfile) return 'like'
     const seed = getDailySeed(activeBoostWindow.id + (userProfile.id || ''))
     const val = seededRandom(seed) * 100
     if (val < 30) return 'comment'
     if (val < 50) return 'reply'
     if (val < 60) return 'share'
     return 'like'
  })()

  // ALGO V2.4 for BOOST WINDOW
  const boostAlgoState = (() => {
     if (!activeBoostWindow || !userProfile) return null
     
     // Deterministic Seed
     // Use last chars of UUIDs to ensure stability per user/window
     const windowSeed = activeBoostWindow.id.charCodeAt(0) + (activeBoostWindow.id.length * 10)
     const userSeed = userProfile.id.charCodeAt(0) + (userProfile.id.length * 10)
     
     const combinedSeed = windowSeed + userSeed
     
     // 1. Scenario: 40% Watch Only
     const isWatchOnly = (combinedSeed % 10) < 4
     const scenario = isWatchOnly ? 'watch_only' : 'engagement'
     
     // 2. Type (if engagement)
     // 70% Like+Fav, 20% Comment, 10% Share
     const typeSeed = combinedSeed % 100
     let type = 'favorite' // Default (Like + Fav)
     if (typeSeed < 10) type = 'share'
     else if (typeSeed < 30) type = 'comment'
     
     // 3. Watch Duration (60-95%)
     const watchDuration = 60 + (windowSeed % 36)
     
     // 4. Delay (Boost is usually immediate, but let's add small randomization 0-5 min)
     const delayMinutes = combinedSeed % 3
     
     // 5. Traffic Source
     const trafficSource = (combinedSeed % 2 === 0) ? 'search' : 'direct'
     
     const targetUsername = extractTikTokUsername(activeBoostWindow.target_video_url) || "Inconnu"
     
     return { scenario, type, watchDuration, delayMinutes, trafficSource, targetUsername, combinedSeed }
  })()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Connexion au QG...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <WelcomePopup userId={userProfile?.id} />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
             <Shield className="h-4 w-4" />
             QG Opérationnel • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Bonjour, {userProfile?.username || "Soldat"}
          </h1>
          <div className="flex flex-wrap items-center gap-3 pt-1">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700">
                <Trophy className="h-4 w-4 text-slate-500" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span>Grade {Math.floor(dayProgress / 7) + 1}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ton grade augmente chaque semaine de présence !</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
             </div>
             {dayProgress <= 3 && !allTasksCompleted ? (
               <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-100 text-sm font-semibold text-yellow-700">
                  <AlertCircle className="h-4 w-4" />
                  <span>En Formation (J{dayProgress})</span>
               </div>
             ) : (
               <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100 text-sm font-semibold text-emerald-700">
                  <Shield className="h-4 w-4" />
                  <span>Soldat Actif</span>
               </div>
             )}
          </div>
        </div>

        <div className="flex items-center gap-3">
           <motion.div 
              animate={animateCredits ? { scale: [1, 1.1, 1] } : {}}
              className="flex flex-col items-end px-4 py-2 bg-yellow-50 rounded-xl border border-yellow-100"
           >
              <span className="text-xs font-bold text-yellow-600 uppercase">Crédits Boost</span>
              <div className="flex items-center gap-1">
                 <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                 <span className="text-2xl font-black text-slate-900">{boostCredits}</span>
              </div>
           </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* === LEFT COLUMN (MAIN CONTENT) === */}
        <div className="lg:col-span-8 space-y-8">
           
           {/* WAVE NOTIFICATION AREA (V3) */}
           {userProfile && <WaveNotification userId={userProfile.id} />}

           {/* HUNTING BOARD (MODERNIZED V3.8) */}
           <div className="rounded-2xl overflow-hidden shadow-xl bg-slate-900 border border-slate-800 relative group">
              {/* Background Effects */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/30 transition-colors duration-700" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 group-hover:bg-purple-500/30 transition-colors duration-700" />
              
              <div className="relative z-10 p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                      
                      {/* Left: Total Impact */}
                      <div className="text-center md:text-left">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2 justify-center md:justify-start">
                              <Trophy className="h-4 w-4 text-yellow-500" />
                              Mon Impact Total
                          </h3>
                          <div className="flex items-baseline justify-center md:justify-start gap-2">
                              <span className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                  {huntingStats.likes + huntingStats.comments + huntingStats.favorites}
                              </span>
                              <span className="text-sm font-medium text-slate-400">interactions reçues</span>
                          </div>
                          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 backdrop-blur-sm">
                              <Users className="h-3 w-3 text-indigo-400 mr-2" />
                              <span className="text-xs text-indigo-200">Escouade : <span className="text-white font-bold">{squadMembers.length + 1}</span> soldats</span>
                          </div>
                      </div>

                      {/* Right: Detailed Gauges */}
                      <div className="flex-1 w-full grid grid-cols-3 gap-4">
                          {/* Likes */}
                          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 flex flex-col items-center relative overflow-hidden group/card hover:border-pink-500/50 transition-colors">
                              <div className="absolute inset-x-0 bottom-0 h-1 bg-pink-500/20 group-hover/card:bg-pink-500 transition-colors" />
                              <Heart className="h-5 w-5 text-pink-500 mb-2 fill-pink-500/20" />
                              <span className="text-2xl font-bold text-white">{huntingStats.likes}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Likes</span>
                          </div>

                          {/* Comments */}
                          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 flex flex-col items-center relative overflow-hidden group/card hover:border-blue-500/50 transition-colors">
                              <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500/20 group-hover/card:bg-blue-500 transition-colors" />
                              <MessageCircle className="h-5 w-5 text-blue-500 mb-2 fill-blue-500/20" />
                              <span className="text-2xl font-bold text-white">{huntingStats.comments}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Coms</span>
                          </div>

                          {/* Favorites */}
                          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 flex flex-col items-center relative overflow-hidden group/card hover:border-yellow-500/50 transition-colors">
                              <div className="absolute inset-x-0 bottom-0 h-1 bg-yellow-500/20 group-hover/card:bg-yellow-500 transition-colors" />
                              <Medal className="h-5 w-5 text-yellow-500 mb-2 fill-yellow-500/20" />
                              <span className="text-2xl font-bold text-white">{huntingStats.favorites}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Favoris</span>
                          </div>
                      </div>
                  </div>
              </div>
           </div>

           {/* DISCIPLINE WARNING (HIDDEN V3.7) */}
           {/* {disciplineScore < 50 && (
             <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 flex flex-col items-center text-center gap-3 shadow-sm animate-pulse-slow">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                   <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-red-900">DISCIPLINE CRITIQUE ({disciplineScore} pts)</h3>
                <p className="text-sm text-red-700 max-w-md">
                   Tu as abandonné ton escouade trop souvent. <br/>
                   Tes missions sont suspendues : tu dois attendre que tes camarades te sauvent (missions mercenaires) ou que le lendemain arrive pour te racheter.
                </p>
                <Button variant="destructive" className="w-full sm:w-auto opacity-50 cursor-not-allowed" title="Tes missions sont masquées pour toi">
                   ACCÈS MERCENAIRE RESTREINT
                </Button>
             </div>
           )} */}
           
           {/* BOOST BANNER */}
           {activeBoostWindow ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl"
              >
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Zap className="h-40 w-40 rotate-12" />
                 </div>
                 <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-left">
                       <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wide border border-white/10">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                          </span>
                          Boost En Cours
                       </div>
                       <h3 className="text-2xl font-black tracking-tight">Cible Prioritaire Identifiée</h3>
                       <p className="text-indigo-100 max-w-md">
                          Une opportunité de gain de crédits est disponible. Soutenez la cible pour gagner +1 Crédit.
                       </p>
                    </div>
                    {hasParticipatedInBoost ? (
                      <div className="flex flex-col items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl border border-white/20">
                        <CheckCircle className="h-8 w-8 text-green-400" />
                        <span className="font-bold">Validé</span>
                      </div>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold border-0 shadow-lg">
                             PARTICIPER
                             <Zap className="ml-2 h-4 w-4 fill-indigo-600" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-black flex items-center gap-2 text-indigo-900">
                            <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                            MISSION BOOST
                          </DialogTitle>
                          <DialogDescription className="text-base">
                            Opportunité Tactique. Suis le plan ci-dessous pour aider l'escouade.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-2">
                           {boostAlgoState && (
                             <MissionPlan 
                                type={boostAlgoState.type}
                                scenario={boostAlgoState.scenario}
                                delayMinutes={boostAlgoState.delayMinutes}
                                trafficSource={boostAlgoState.trafficSource as any}
                                targetUsername={boostAlgoState.targetUsername}
                                watchDuration={boostAlgoState.watchDuration}
                                missionId={boostAlgoState.combinedSeed} // Theme variation
                                shouldFollow={false}
                             />
                           )}
                           
                           {/* FALLBACK IF URL LINK NEEDED (Hidden by MissionPlan usually) */}
                           <div className="mt-4 text-center">
                              <a 
                                href={activeBoostWindow.target_video_url} 
                                target="_blank" 
                                className="text-xs text-indigo-400 hover:underline flex items-center justify-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Lien de secours
                              </a>
                           </div>
                        </div>

                        <DialogFooter className="sm:justify-center">
                          <Button 
                            onClick={handleBoostValidation}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg shadow-lg shadow-green-200 animate-in zoom-in"
                          >
                            J'AI TERMINÉ LA MISSION (+1 CRÉDIT)
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                      </Dialog>
                    )}
                 </div>
              </motion.div>
           ) : nextBoostWindow ? (
              <div className="flex items-center justify-between p-4 rounded-xl border border-blue-100 bg-blue-50/50">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                       <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-blue-900">Prochain Boost</p>
                       <p className="text-xs text-blue-700">À {new Date(nextBoostWindow.starts_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                 </div>
                 <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-100">Info</Button>
              </div>
           ) : null}

           {/* MISSIONS SECTION */}
           <div className="space-y-6">
              {/* GAMIFIED HEADER */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center ${currentRank.color}`}>
                           <currentRank.icon className="h-6 w-6" />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Missions du jour à accomplir</p>
                           <h3 className={`text-lg font-black ${currentRank.color}`}>{currentRank.name}</h3>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-2xl font-black text-slate-900">{Math.round(progressPercentage)}%</p>
                        <p className="text-xs font-medium text-slate-400">Objectif Quotidien</p>
                     </div>
                  </div>
                  <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                     />
                  </div>
              </div>

              {/* MISSION CARD ONE-BY-ONE */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden relative">
                 {/* Header: Mission X/Y */}
                 <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg">
                          {Math.min(displayIndex + 1, tasks.length)}
                       </div>
                       <div>
                          <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider">Mission Actuelle</p>
                          <h3 className="font-bold text-lg leading-none">
                             {allTasksCompleted ? "Mission Accomplie !" : (activeTask?.targetUsername ? `Cible : @${activeTask.targetUsername}` : 'Chargement...')}
                          </h3>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xs text-slate-400 font-mono">
                          {Math.min(displayIndex + 1, tasks.length)} / {tasks.length}
                       </p>
                    </div>
                 </div>

                 <div className="p-6">
                    {!myVideoUrl ? (
                        // LOCK STATE
                        <div className="text-center py-8 space-y-4">
                           <Lock className="h-12 w-12 text-slate-300 mx-auto" />
                           <p className="text-slate-500">Configure ta vidéo pour débloquer les missions.</p>
                           <Button onClick={() => {
                                 const sidebar = document.getElementById('sidebar-config')
                                 sidebar?.scrollIntoView({ behavior: 'smooth' })
                                 setIsEditingVideo(true)
                           }}>Configurer</Button>
                        </div>
                    ) : allTasksCompleted ? (
                        // SUCCESS STATE
                        <div className="text-center py-12">
                           <Trophy className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
                           <h3 className="text-2xl font-black text-slate-900 mb-2">MISSION ACCOMPLIE !</h3>
                           <p className="text-slate-500 max-w-md mx-auto">
                              Tu as terminé toutes tes missions pour aujourd'hui. Reviens demain pour de nouveaux ordres.
                           </p>
                        </div>
                    ) : activeTask ? (
                        // ACTIVE TASK
                        activeTask.isLocked ? (
                            // LOCKED STATE
                            <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4 animate-in fade-in">
                                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                                    <Lock className="h-8 w-8 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">MISSION VERROUILLÉE</h3>
                                <p className="text-slate-500 max-w-xs mx-auto font-medium">
                                    {activeTask.text}
                                </p>
                                <div className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                    En attente de publication de la cible
                                </div>
                            </div>
                        ) : (
                            // ACTIVE TASK
                            !briefingCompleted ? (
                                // STEP 1: BRIEFING MODE
                                <MissionBriefing 
                                    type={activeTask.type}
                                    scenario={activeTask.scenario}
                                    delayMinutes={activeTask.delayMinutes}
                                    trafficSource={activeTask.trafficSource}
                                    targetUsername={activeTask.targetUsername}
                                    onBriefingComplete={() => setBriefingCompleted(true)}
                                />
                            ) : (
                                // STEP 2: ACTION MODE
                                <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                    
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                            MISSION EN COURS
                                        </h3>
                                        <Button variant="outline" size="sm" onClick={() => setBriefingCompleted(false)} className="text-xs h-7 px-2">
                                            Revoir le Briefing
                                        </Button>
                                    </div>

                                    {/* FULL MISSION PLAN (RECAP) */}
                                    <div className="border-t border-slate-100 pt-4">
                                        <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-1">
                                            📜 Dossier Tactique (Rappel)
                                        </p>
                                        <MissionPlan 
                                            type={activeTask.type}
                                            scenario={activeTask.scenario}
                                            delayMinutes={activeTask.delayMinutes}
                                            trafficSource={activeTask.trafficSource}
                                            targetUsername={activeTask.targetUsername}
                                            shouldFollow={activeTask.shouldFollow}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-3 pt-4 border-t">
                                            {!viewedVideos.has(activeTask.targetUserId) ? (
                                                <Button 
                                                size="lg" 
                                                className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200"
                                                onClick={() => {
                                                    handleViewVideo(activeTask.targetUserId)
                                                    
                                                    // SMART TRAFFIC LOGIC
                                                    if (activeTask.trafficSource === 'search') {
                                                        // Copy username and open homepage
                                                        const handle = activeTask.targetUsername || ""
                                                        navigator.clipboard.writeText(handle)
                                                        toast.success("Pseudo copié !", { description: "Colle-le dans la recherche TikTok." })
                                                        window.open('https://www.tiktok.com', '_blank')
                                                    } else if (activeTask.trafficSource === 'profile') {
                                                        // Open profile page (need to construct it or use main_platform if available)
                                                        // For now, let's use a safe profile link construction
                                                        const profileUrl = `https://www.tiktok.com/@${activeTask.targetUsername}`
                                                        window.open(profileUrl, '_blank')
                                                    } else {
                                                        // Direct link
                                                        window.open(activeTask.actionUrl, '_blank')
                                                    }
                                                }}
                                                >
                                                <Play className="mr-2 h-5 w-5 fill-white" />
                                                LANCER LA MISSION (Ouvrir TikTok)
                                                </Button>
                                            ) : (
                                                <Button 
                                                size="lg" 
                                                className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-xl shadow-green-200 animate-in zoom-in"
                                                onClick={async () => {
                                                    await toggleTask(activeTask.id)
                                                    // Auto flow handles next task automatically
                                                }}
                                                >
                                                <CheckCircle className="mr-2 h-5 w-5" />
                                                J'AI TERMINÉ LA MISSION
                                                </Button>
                                            )}
                                        
                                        {viewedVideos.has(activeTask.targetUserId) && (
                                            <p className="text-xs text-center text-muted-foreground">
                                            En validant, tu confirmes avoir respecté le protocole.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        )
                    ) : (
                        <div className="py-12 text-center text-slate-400">Chargement de la mission...</div>
                    )}
                 </div>
              </div>
           </div>
           
           {/* MERCENARY PROTOCOL (HIDDEN V3.7) */}
           {/* <div className="mt-8">
               <MercenaryBoard onCreditsEarned={handleCreditsEarned} />
           </div> */}
        </div>

        {/* === RIGHT COLUMN (SIDEBAR) === */}
        <div className="lg:col-span-4 space-y-6" id="sidebar-config">
           
           {/* OPERATIONAL SCHEDULE (NEW V3.5) */}
           <WaveSchedule squadId={mySquadId} userId={userProfile?.id} />

           {/* MY CONFIGURATION CARD */}
           <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-slate-50/50 flex items-center gap-2">
                 <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                    <Upload className="h-4 w-4" />
                 </div>
                 <h3 className="font-bold text-slate-900">Mes Liens</h3>
              </div>
              <div className="p-4 space-y-6">
                 {/* PROFILE INPUT */}
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                       <label className="text-xs font-bold uppercase text-slate-500">Mon Profil TikTok</label>
                       {!isEditingProfile && (
                          <button onClick={() => setIsEditingProfile(true)} className="text-xs text-indigo-600 hover:underline font-medium">Modifier</button>
                       )}
                    </div>
                    {isEditingProfile ? (
                       <div className="flex gap-2">
                          <input 
                             type="url" 
                             className="flex-1 h-9 rounded-md border px-3 text-sm"
                             placeholder="https://tiktok.com/@tonpseudo"
                             value={myProfileUrl}
                             onChange={(e) => setMyProfileUrl(e.target.value)}
                          />
                          <Button size="sm" onClick={handleUpdateProfile}>OK</Button>
                       </div>
                    ) : (
                       <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50 border border-slate-100">
                          {myProfileUrl ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                          <span className={`text-sm truncate ${!myProfileUrl && 'text-red-500 font-medium'}`}>
                             {extractTikTokUsername(myProfileUrl) ? `@${extractTikTokUsername(myProfileUrl)}` : (myProfileUrl || "Lien profil manquant")}
                          </span>
                       </div>
                    )}
                 </div>
              </div>
           </div>

           {/* BUDDY WIDGET (HIDDEN V3.7) */}
           {/* {myBuddy ? (
              <div className="rounded-xl border border-purple-200 bg-purple-50/30 overflow-hidden">
                 <div className="p-4 flex items-center gap-4">
                    <div className="relative">
                       <div className="h-12 w-12 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-lg">
                          {myBuddy.username?.charAt(0)}
                       </div>
                       <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-xs font-bold text-purple-500 uppercase">Mon Binôme</p>
                       <p className="font-bold text-slate-900 truncate">{myBuddy.username}</p>
                       <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Shield className="h-3 w-3" />
                          Score Duo: {buddyScore}
                       </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(myBuddy.main_platform || myBuddy.current_video_url, '_blank')}>
                       <ExternalLink className="h-4 w-4" />
                    </Button>
                 </div>
              </div>
           ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                 <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                 <p className="text-sm text-muted-foreground">Recherche de binôme en cours...</p>
              </div>
           )} */}

           {/* REPORT / CONTACT ADMIN SHORTCUT */}
           <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
              <DialogTrigger asChild>
                <div className="rounded-xl bg-slate-900 p-5 text-white shadow-lg relative overflow-hidden transition-transform hover:scale-[1.02] cursor-pointer group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-500/20 to-transparent opacity-50" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Assistance QG</p>
                        <h3 className="font-black text-lg tracking-tight">SIGNALER UN PROBLÈME</h3>
                        </div>
                        <MessageSquareWarning className="h-6 w-6 text-orange-500" />
                    </div>
                </div>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                          <MessageSquareWarning className="h-5 w-5 text-orange-500" />
                          Contacter le QG
                      </DialogTitle>
                      <DialogDescription>
                          Rencontrez-vous un bug ou un problème avec un autre soldat ? Décrivez la situation ci-dessous.
                      </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                      <textarea
                          className="w-full min-h-[120px] p-3 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Décrivez votre problème ici..."
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                      />
                  </div>
                  <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsContactOpen(false)}>Annuler</Button>
                      <Button 
                          onClick={handleSendContact} 
                          disabled={!contactMessage.trim() || sendingContact}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                          {sendingContact ? "Envoi..." : "Envoyer le rapport"}
                      </Button>
                  </DialogFooter>
              </DialogContent>
           </Dialog>
           
           {/* DEBRIEFING LINK (OLD SURVEILLANCE) */}
           <Link href="/dashboard/surveillance" className="block mt-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                          <p className="text-xs font-bold text-slate-500 uppercase">Transparence</p>
                          <h3 className="font-bold text-slate-900">Bilan d'Hier</h3>
                      </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>
           </Link>

           {/* ADMIN TOOLS */}
           {isAdmin && (
             <div className="rounded-xl border bg-slate-50 p-4">
               <h4 className="font-bold text-sm mb-3">Outils Admin</h4>
               <div className="grid grid-cols-2 gap-2">
                 <Button size="sm" variant="outline" asChild>
                   <Link href="/admin">Panel</Link>
                 </Button>
                 <Button size="sm" variant="outline" asChild>
                   <a href="https://whatsapp.com/channel/0029VbBcgs71iUxRPnXEdF1z" target="_blank">WhatsApp</a>
                 </Button>
               </div>
             </div>
           )}

        </div>

      </div>
    </div>
  )
}
