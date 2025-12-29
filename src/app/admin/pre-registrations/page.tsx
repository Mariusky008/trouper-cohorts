'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, ExternalLink, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface PreRegistration {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  channel_url: string
  status: 'pending' | 'approved' | 'registered'
  created_at: string
}

export default function AdminPreRegistrationsPage() {
  const [registrations, setRegistrations] = useState<PreRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  
  const supabase = createClient()

  const fetchRegistrations = async () => {
    setIsLoading(true)
    try {
      // Use our Admin API to bypass RLS for now
      const response = await fetch('/api/admin/pre-registrations')
      
      if (!response.ok) {
         // Log the status text for debugging
         console.error('Fetch error:', response.status, response.statusText)
         throw new Error(`Failed to fetch: ${response.statusText}`)
      }
      
      const data = await response.json()
      setRegistrations(data as PreRegistration[])
    } catch (error) {
      toast.error("Erreur lors du chargement des données")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistrations()
  }, [])

  const handleValidate = async (reg: PreRegistration) => {
    if (!confirm(`Valider l'inscription de ${reg.first_name} ${reg.last_name} ? Cela enverra un email.`)) return

    setProcessingId(reg.id)
    try {
      const response = await fetch('/api/validate-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reg.id,
          email: reg.email,
          firstName: reg.first_name
        })
      })

      if (!response.ok) throw new Error('Failed to validate')

      toast.success(`Inscription de ${reg.first_name} validée ! Email envoyé.`)
      // Refresh list
      fetchRegistrations()
    } catch (error) {
      console.error(error)
      toast.error("Erreur lors de la validation")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin: Pré-inscriptions</h1>
        <Button variant="outline" onClick={fetchRegistrations} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="bg-card rounded-md border">
        <Table>
          <TableCaption>Liste des demandes de pré-inscription.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Chaîne</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucune pré-inscription pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              registrations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell className="font-mono text-xs">
                    {new Date(reg.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {reg.first_name} {reg.last_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>{reg.email}</span>
                      <span className="text-muted-foreground text-xs">{reg.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a 
                      href={reg.channel_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      Lien <ExternalLink className="w-3 h-3" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant={reg.status === 'approved' ? 'default' : reg.status === 'registered' ? 'secondary' : 'outline'}>
                      {reg.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {reg.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleValidate(reg)}
                        disabled={!!processingId}
                      >
                        {processingId === reg.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>Valider l'inscription</>
                        )}
                      </Button>
                    )}
                    {reg.status === 'approved' && (
                      <span className="text-xs text-green-600 flex items-center justify-end gap-1">
                        <CheckCircle className="w-3 h-3" /> Email envoyé
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
