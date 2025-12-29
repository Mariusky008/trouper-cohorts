"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, ShieldAlert, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
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
        .not('username', 'is', null)
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

    } catch (error) {
      toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
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
        <div>
          <h1 className="text-3xl font-bold">Administration Troupers</h1>
          <p className="text-muted-foreground">Suivi des performances des recrues</p>
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
