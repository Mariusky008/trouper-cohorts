"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, ShieldAlert, AlertTriangle, CheckCircle, XCircle, AlertCircle, Zap, TrendingUp, Music, Users, Shuffle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { GlitchLogo } from "@/components/ui/glitch-logo"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [boostWindows, setBoostWindows] = useState<any[]>([])
  const [trends, setTrends] = useState<any[]>([])
  const [trendTitle, setTrendTitle] = useState("")
  const [trendDescription, setTrendDescription] = useState("")
  const [trendSoundUrl, setTrendSoundUrl] = useState("")
  const [boostVideoUrl, setBoostVideoUrl] = useState("")
  const [boostDuration, setBoostDuration] = useState("15") // minutes
  const [scheduledTime, setScheduledTime] = useState("")
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const [buddyPairs, setBuddyPairs] = useState<any[]>([])

  const [inboxMessages, setInboxMessages] = useState<any[]>([])

  useEffect(() => {
    // Safety timeout to prevent infinite loading
    const safetyTimer = setTimeout(() => {
        setLoading(false)
    }, 5000)

    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push("/login")
          return
        }

        // Allow access if email matches OR if in dev mode (localhost)
        const isDev = window.location.hostname === 'localhost'
        const isAdminUser = user.email === "mariustalk@yahoo.fr"

        if (!isAdminUser && !isDev) {
          setLoading(false)
          return // Not admin
        }

        setIsAdmin(true)
        await fetchData()
      } catch (e) {
        console.error("Admin check failed", e)
      } finally {
        setLoading(false)
        clearTimeout(safetyTimer)
      }
    }

    checkAdmin()
    
    return () => clearTimeout(safetyTimer)
  }, [])

  const fetchData = async () => {
    try {
      // Fetch Users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .not('email', 'is', null)
        .not('email', 'like', '%troupers.dev%') // Filter out fake generated accounts
        .not('email', 'like', '%fake%') // Extra safety
        .order('discipline_score', { ascending: false })

      setUsers(profiles || [])

      // USE SERVER API TO BYPASS RLS
      const res = await fetch('/api/admin/get-messages')
      if (res.ok) {
          const { reports: reportsData, messages: adminMsgs } = await res.json()
          
          console.log("API Reports Data:", reportsData) // DEBUG LOG

          if (reportsData || adminMsgs) {
             // Split into Discipline Reports and Contact Messages
             // Logic: If reporter == target, it's a contact message (Self-report) OR if username starts with CONTACT_ADMIN
             const messages = (reportsData || []).filter((r: any) => 
                 r.reporter_id === r.target_user_id || 
                 r.target_username?.startsWith("CONTACT_ADMIN:")
             )
             
             const realReports = (reportsData || []).filter((r: any) => 
                 r.reporter_id !== r.target_user_id && 
                 !r.target_username?.startsWith("CONTACT_ADMIN:")
             )
             
             // Normalize admin messages
             const normalizedAdminMsgs = (adminMsgs || []).map((m: any) => ({
                 id: m.id,
                 created_at: m.created_at,
                 reporter: m.user,
                 target_username: "CONTACT_ADMIN: " + m.content,
                 status: m.status === 'read' ? 'resolved' : 'pending'
             }))
   
             setInboxMessages([...normalizedAdminMsgs, ...messages])
             setReports(realReports)
          }
      } else {
          console.error("Failed to fetch via API, falling back to client")
          // Fallback to client fetching (existing logic below could be kept but simpler to just error out)
      }

      // Fetch Boost Windows
      const { data: boostData } = await supabase
        .from('boost_windows')
        .select('*')
        .order('created_at', { ascending: false })
      
      setBoostWindows(boostData || [])

      // Fetch Trends
      const { data: trendsData } = await supabase
        .from('daily_trends')
        .select('*')
        .order('created_at', { ascending: false })
      
      setTrends(trendsData || [])

      // Fetch Buddy Pairs
      const { data: buddyData } = await supabase
        .from('buddy_pairs')
        .select('*')
        .order('created_at', { ascending: false })
      
      // Manually fetch user profiles for the pairs because deep joining auth.users is problematic
      const pairsWithProfiles = []
      if (buddyData) {
        for (const pair of buddyData) {
          const { data: u1 } = await supabase.from('profiles').select('username, email').eq('id', pair.user1_id).single()
          const { data: u2 } = await supabase.from('profiles').select('username, email').eq('id', pair.user2_id).single()
          
          pairsWithProfiles.push({
            ...pair,
            user1: u1,
            user2: u2
          })
        }
      }
      
      setBuddyPairs(pairsWithProfiles || [])

    } catch (error) {
      toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateBuddies = async () => {
    try {
      setLoading(true)
      
      // 1. Get all eligible users (those with profiles)
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id')
        .not('username', 'is', null)
      
      if (!allUsers || allUsers.length < 2) {
        toast.error("Pas assez d'utilisateurs pour créer des binômes")
        return
      }

      // 2. Shuffle users
      const shuffled = [...allUsers].sort(() => 0.5 - Math.random())
      
      // 3. Create pairs
      const newPairs = []
      for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
          newPairs.push({
            user1_id: shuffled[i].id,
            user2_id: shuffled[i+1].id,
            week_start_date: new Date().toISOString()
          })
        }
      }

      // 4. Insert into DB
      const { error } = await supabase.from('buddy_pairs').insert(newPairs)
      
      if (error) throw error

      toast.success(`${newPairs.length} binômes générés avec succès !`)
      fetchData() // Refresh list
    } catch (error) {
      console.error(error)
      toast.error("Erreur lors de la génération des binômes")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTrend = async () => {
    if (!trendTitle || !trendDescription) {
      toast.error("Titre et description requis")
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('daily_trends')
        .insert({
          title: trendTitle,
          description: trendDescription,
          sound_url: trendSoundUrl,
          created_by: user.id,
          active_date: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      setTrends([data, ...trends])
      setTrendTitle("")
      setTrendDescription("")
      setTrendSoundUrl("")
      
      toast.success("Trend du jour publiée !")
    } catch (error) {
      console.error(error)
      toast.error("Erreur création trend")
    }
  }

  const handleResolveReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', reportId)

      if (error) throw error
      
      setReports(reports.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r))
      toast.success("Signalement traité")
    } catch (e) {
      toast.error("Erreur")
    }
  }

  const handleWarnUser = async (email: string, username: string) => {
    if (!email) {
      toast.error("Email utilisateur introuvable")
      return
    }

    const toastId = toast.loading("Envoi de l'avertissement...")

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          username: username,
          reason: "Manque de soutien signalé par votre escouade."
        })
      })

      if (!response.ok) throw new Error("Erreur API")

      toast.success("Email d'avertissement envoyé !", { id: toastId })
    } catch (error) {
      toast.error("Échec de l'envoi", { id: toastId })
    }
  }

  const handleCreateBoostWindow = async () => {
    if (!boostVideoUrl) {
      toast.error("L'URL de la vidéo est requise")
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const durationMinutes = parseInt(boostDuration)
      
      // If scheduled time provided, use it, otherwise use NOW
      const startsAt = scheduledTime ? new Date(scheduledTime) : new Date()
      const endsAt = new Date(startsAt.getTime() + durationMinutes * 60000)

      const { data, error } = await supabase
        .from('boost_windows')
        .insert({
          target_video_url: boostVideoUrl,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      setBoostWindows([data, ...boostWindows])
      setBoostVideoUrl("")
      setScheduledTime("")
      
      if (scheduledTime) {
        toast.success(`Boost programmé pour ${startsAt.toLocaleTimeString()} !`)
      } else {
        toast.success(`Boost Window lancée pour ${durationMinutes} minutes !`)
      }
      
    } catch (error) {
      console.error(error)
      toast.error("Erreur lors de la création de la Boost Window")
    }
  }

  if (loading) return <div className="p-8 text-center">Chargement...</div>

  if (!isAdmin) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Accès Refusé</h1>
        <p className="text-muted-foreground">
          Cette zone est réservée à l'administrateur (Marius).
        </p>
        <Button onClick={() => router.push("/dashboard")}>Retour au Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <GlitchLogo width={64} height={64} className="rounded-xl shadow-sm" imageClassName="rounded-xl" />
          <div>
            <h1 className="text-3xl font-bold">Administration Troupers <span className="text-sm bg-indigo-100 text-indigo-700 px-2 py-1 rounded ml-2">v3.1</span></h1>
            <p className="text-muted-foreground">Suivi des performances des recrues</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin/pre-registrations">
              Voir les Pré-inscriptions
            </Link>
          </Button>
          <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700" asChild>
            <Link href="/admin/planning">
              📅 Planning Stratégique (V3)
            </Link>
          </Button>
          <div className="rounded-full bg-primary/10 px-4 py-2 text-primary font-mono text-sm">
            Admin: Marius
          </div>
        </div>
      </div>

      <div className="rounded-md border p-6 bg-card">
        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users">Recrues ({users.length})</TabsTrigger>
            <TabsTrigger value="boost" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Boost Windows
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Radar Tactique
            </TabsTrigger>
            <TabsTrigger value="buddies" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Parrainage
            </TabsTrigger>
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Inbox QG
              {inboxMessages.filter(m => m.status !== 'resolved').length > 0 && (
                <span className="bg-indigo-500 text-white text-[10px] px-1.5 rounded-full">
                  {inboxMessages.filter(m => m.status !== 'resolved').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              Signalements
              {reports.filter(r => r.status !== 'resolved').length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                  {reports.filter(r => r.status !== 'resolved').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox">
            <div className="mb-4">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={async () => {
                        const { data } = await supabase.from('reports').select('*')
                        console.log("DEBUG RAW REPORTS:", data)
                        alert("Check Console for Raw Data. Count: " + (data?.length || 0))
                    }}
                >
                    🐞 Debug: Voir Raw Data
                </Button>
            </div>
            {inboxMessages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                Boîte de réception vide.
              </div>
            ) : (
              <div className="space-y-4">
                  {inboxMessages.map((msg) => (
                    <div key={msg.id} className={`p-4 rounded-xl border ${msg.status === 'resolved' ? 'bg-slate-50 border-slate-200' : 'bg-white border-indigo-200 shadow-sm'}`}>
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{msg.reporter?.email || "Utilisateur"}</span>
                                <span className="text-xs text-slate-400">{new Date(msg.created_at).toLocaleString()}</span>
                            </div>
                            {msg.status === 'resolved' ? (
                                <Badge variant="outline">Lu & Traité</Badge>
                            ) : (
                                <Badge className="bg-indigo-500">Nouveau</Badge>
                            )}
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 mb-4 whitespace-pre-wrap">
                            {msg.target_username?.replace("CONTACT_ADMIN: ", "")}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" asChild>
                                <a href={`mailto:${msg.reporter?.email}?subject=Réponse QG Troupers&body=Bonjour, suite à votre message...`}>
                                    <Mail className="mr-2 h-4 w-4" /> Répondre
                                </a>
                            </Button>
                            {msg.status !== 'resolved' && (
                                <Button size="sm" variant="ghost" onClick={() => handleResolveReport(msg.id)}>
                                    Marquer comme lu
                                </Button>
                            )}
                        </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recrue</TableHead>
                  <TableHead>Email (Contact)</TableHead>
                  <TableHead>Score Discipline</TableHead>
                  <TableHead>Réussite</TableHead>
                  <TableHead>Plateforme</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  // Calculate a fake success rate based on discipline score (assuming max 1000)
                  const successRate = Math.min(100, Math.round((user.discipline_score / 1000) * 100))
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold uppercase">
                            {user.username?.charAt(0) || "?"}
                          </div>
                          {user.username || "Inconnu"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-xs italic">Voir via le bouton</span>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold">{user.discipline_score} XP</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-secondary overflow-hidden">
                            <div 
                              className={`h-full ${successRate > 80 ? 'bg-green-500' : successRate > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                              style={{ width: `${successRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{successRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {user.main_platform || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" asChild>
                          <a href={`mailto:?subject=Message%20Troupers&body=Salut%20${user.username},%20ton%20score%20est%20de%20${user.discipline_score}...`}>
                            <Mail className="h-4 w-4" />
                            <span className="sr-only">Contacter</span>
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="boost">
            <div className="space-y-8">
              {/* Creator Card */}
              <div className="rounded-lg border bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-6">
                 <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                   <Zap className="h-6 w-6 text-orange-500" />
                   Lancer une Boost Window
                 </h2>
                 <div className="grid gap-4 max-w-xl">
                   <div>
                     <label className="text-sm font-medium">URL de la vidéo cible</label>
                     <input 
                        type="url" 
                        placeholder="https://tiktok.com/@..." 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={boostVideoUrl}
                        onChange={(e) => setBoostVideoUrl(e.target.value)}
                     />
                   </div>
                   <div>
                     <label className="text-sm font-medium">Durée</label>
                     <select 
                       className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                       value={boostDuration}
                       onChange={(e) => setBoostDuration(e.target.value)}
                     >
                       <option value="15">15 minutes</option>
                       <option value="30">30 minutes</option>
                       <option value="60">1 heure (Exceptionnel)</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-sm font-medium">Programmer le démarrage (Optionnel)</label>
                     <p className="text-xs text-muted-foreground mb-1">Laisser vide pour lancer immédiatement</p>
                     <input 
                       type="datetime-local" 
                       className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                       value={scheduledTime}
                       onChange={(e) => setScheduledTime(e.target.value)}
                     />
                   </div>

                   <Button onClick={handleCreateBoostWindow} className="w-full bg-orange-500 hover:bg-orange-600">
                     {scheduledTime ? "📅 PROGRAMMER LE BOOST" : "🚀 ACTIVER LE BOOST MAINTENANT"}
                   </Button>
                 </div>
              </div>

              {/* History Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vidéo</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Fin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boostWindows.map((window) => {
                      const now = new Date()
                      const endsAt = new Date(window.ends_at)
                      const isActive = now < endsAt
                      
                      return (
                        <TableRow key={window.id}>
                          <TableCell>{new Date(window.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            <a href={window.target_video_url} target="_blank" className="text-blue-500 hover:underline">
                              {window.target_video_url}
                            </a>
                          </TableCell>
                          <TableCell>
                            {isActive ? (
                              <Badge className="bg-green-500 animate-pulse">EN COURS</Badge>
                            ) : (
                              <Badge variant="outline">Terminé</Badge>
                            )}
                          </TableCell>
                          <TableCell>{endsAt.toLocaleTimeString()}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="buddies">
            <div className="space-y-8">
              <div className="rounded-lg border bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6">
                 <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                   <Users className="h-6 w-6 text-purple-500" />
                   Gérer les Binômes (Parrainage)
                 </h2>
                 <p className="text-sm text-muted-foreground mb-4">
                   Générez des paires aléatoires de recrues pour favoriser l'entraide et la cohésion.
                 </p>
                 <Button onClick={handleGenerateBuddies} disabled={loading} className="bg-purple-500 hover:bg-purple-600">
                   <Shuffle className="mr-2 h-4 w-4" />
                   Générer les Binômes de la Semaine
                 </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Semaine du</TableHead>
                      <TableHead>Binôme 1</TableHead>
                      <TableHead>Binôme 2</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buddyPairs.map((pair) => (
                      <TableRow key={pair.id}>
                        <TableCell>{new Date(pair.week_start_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{pair.user1?.username || "Inconnu"}</TableCell>
                        <TableCell className="font-medium">{pair.user2?.username || "Inconnu"}</TableCell>
                      </TableRow>
                    ))}
                    {buddyPairs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                          Aucun binôme généré pour le moment.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <div className="space-y-8">
              {/* Creator Card */}
              <div className="rounded-lg border bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-6">
                 <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                   <TrendingUp className="h-6 w-6 text-indigo-500" />
                   Définir la Trend du Jour
                 </h2>
                 <div className="grid gap-4 max-w-xl">
                   <div>
                     <label className="text-sm font-medium">Titre (ex: Le Son qui buzz)</label>
                     <input 
                        type="text" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={trendTitle}
                        onChange={(e) => setTrendTitle(e.target.value)}
                     />
                   </div>
                   <div>
                     <label className="text-sm font-medium">Description / Conseil</label>
                     <textarea 
                       className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                       value={trendDescription}
                       onChange={(e) => setTrendDescription(e.target.value)}
                       placeholder="Utilisez ce son avec une transition..."
                     />
                   </div>
                   <div>
                     <label className="text-sm font-medium">Lien du Son / Exemple</label>
                     <input 
                       type="url" 
                       className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                       value={trendSoundUrl}
                       onChange={(e) => setTrendSoundUrl(e.target.value)}
                       placeholder="https://tiktok.com/music/..."
                     />
                   </div>

                   <Button onClick={handleCreateTrend} className="w-full bg-indigo-500 hover:bg-indigo-600">
                     📡 PUBLIER L'ALERTE RADAR
                   </Button>
                 </div>
              </div>

              {/* History Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Titre</TableHead>
                      <TableHead>Lien</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trends.map((trend) => (
                      <TableRow key={trend.id}>
                        <TableCell>{new Date(trend.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{trend.title}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {trend.sound_url ? (
                            <a href={trend.sound_url} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1">
                              <Music className="h-3 w-3" /> Link
                            </a>
                          ) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            {reports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                Aucun signalement pour le moment. Tout va bien !
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Dénonciateur</TableHead>
                    <TableHead>Accusé</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {report.reporter?.email || "Anonyme"}
                      </TableCell>
                      <TableCell className="font-bold text-red-600">
                        {report.target_username || "Inconnu"}
                      </TableCell>
                      <TableCell>
                        {report.status === 'resolved' ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Traité</Badge>
                        ) : (
                          <Badge variant="destructive">En attente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {report.status !== 'resolved' && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleResolveReport(report.id)}>
                              Marquer comme traité
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleWarnUser(report.target?.email, report.target_username)}
                            >
                              Avertir (Email)
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
