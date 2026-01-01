"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, ShieldAlert, AlertTriangle, CheckCircle, XCircle, AlertCircle, Zap, TrendingUp, Music } from "lucide-react"
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

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/login")
        return
      }

      // Hardcoded admin check as requested
      if (user.email !== "mariustalk@yahoo.fr") {
        setLoading(false)
        return // Not admin
      }

      setIsAdmin(true)
      fetchData()
    }

    checkAdmin()
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

      // Fetch Reports
      const { data: reportsData } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:reporter_id(email),
          target:target_user_id(email)
        `)
        .order('created_at', { ascending: false })
      
      setReports(reportsData || [])

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

    } catch (error) {
      toast.error("Erreur lors du chargement des données")
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
            <h1 className="text-3xl font-bold">Administration Troupers</h1>
            <p className="text-muted-foreground">Suivi des performances des recrues</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin/pre-registrations">
              Voir les Pré-inscriptions
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
            <TabsTrigger value="reports" className="flex items-center gap-2">
              Signalements
              {reports.filter(r => r.status !== 'resolved').length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                  {reports.filter(r => r.status !== 'resolved').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

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
