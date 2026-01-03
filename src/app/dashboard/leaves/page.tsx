"use client"

import { useState, useEffect } from "react"
import { Calendar } from "../../../components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Coffee, AlertCircle, CheckCircle, CalendarDays } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { format, addDays, isBefore, startOfToday, isSameWeek } from "date-fns"
import { fr } from "date-fns/locale"

export default function LeavesPage() {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [offDays, setOffDays] = useState<Date[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchOffDays()
  }, [])

  const fetchOffDays = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('user_off_days')
        .select('off_date')
        .eq('user_id', user.id)
        .gte('off_date', new Date().toISOString()) // Only future/current

      if (data) {
        setOffDays(data.map((d: { off_date: string }) => new Date(d.off_date)))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleBookOffDay = async () => {
    if (!date) {
      toast.error("Veuillez sélectionner une date")
      return
    }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Rules Validation
      const selectedDate = date
      const today = startOfToday()
      const tomorrow = addDays(today, 1)

      // 1. Must be at least "Tomorrow" (24h logic simplified to "Next Day")
      if (isBefore(selectedDate, tomorrow)) {
        toast.error("Trop tard soldat !", { 
          description: "Tu dois prévenir au moins 24h à l'avance (pour demain minimum)." 
        })
        return
      }

      // 2. Max 2 days per week
      // Count how many off days in the selected week
      const weekStart = selectedDate
      // Filter offDays that are in the same week as selectedDate
      const daysInSameWeek = offDays.filter(d => isSameWeek(d, selectedDate, { weekStartsOn: 1 }))
      
      if (daysInSameWeek.length >= 2) {
         toast.error("Permission refusée", {
            description: "Tu as déjà posé 2 jours de repos cette semaine là. La discipline avant tout."
         })
         return
      }

      // Insert
      const { error } = await supabase.from('user_off_days').insert({
         user_id: user.id,
         off_date: format(selectedDate, 'yyyy-MM-dd')
      })

      if (error) {
         if (error.code === '23505') { // Unique violation
            toast.error("Tu as déjà posé ce jour !")
         } else {
            throw error
         }
      } else {
         toast.success("Jour de repos validé", {
            description: `Profite bien de ton ${format(selectedDate, 'EEEE d MMMM', { locale: fr })}.`
         })
         fetchOffDays()
         setDate(undefined)
      }

    } catch (e: any) {
      console.error(e)
      toast.error("Erreur lors de la demande", { 
        description: e.message || "Une erreur technique est survenue. Vérifie ta connexion." 
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
         <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
            <Coffee className="h-6 w-6 text-orange-600" />
         </div>
         <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
               Demain je suis OFF
            </h1>
            <p className="text-slate-600">
               Gère tes jours de repos pour ne pas être pénalisé par le Protocole Mercenaire.
            </p>
         </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
         <Card className="border-l-4 border-l-orange-500 shadow-md">
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Règles de Repos
               </CardTitle>
               <CardDescription>
                  À lire avant de poser ta permission
               </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
               <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                     <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                     <span>Tu as droit à <strong>2 jours OFF maximum</strong> par semaine.</span>
                  </li>
                  <li className="flex items-start gap-2">
                     <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                     <span>Tu dois prévenir <strong>24h à l'avance</strong> (impossible de poser pour aujourd'hui).</span>
                  </li>
                  <li className="flex items-start gap-2">
                     <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                     <span>Pendant tes jours OFF, tu ne reçois pas de missions et tu n'es pas pénalisé.</span>
                  </li>
               </ul>
               <div className="bg-orange-50 p-3 rounded border border-orange-100 text-orange-800 italic">
                  "Le repos fait partie de l'entraînement. L'absence injustifiée est une désertion."
               </div>
            </CardContent>
         </Card>

         <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Poser un jour
               </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
               <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date: Date) => isBefore(date, addDays(startOfToday(), 1))} // Disable past and today
                  className="rounded-md border shadow"
                  modifiers={{
                     off: offDays
                  }}
                  modifiersClassNames={{
                     off: "bg-orange-500 text-white font-bold hover:bg-orange-600"
                  }}
               />
               <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700 font-bold" 
                  onClick={handleBookOffDay}
                  disabled={!date || submitting}
               >
                  {submitting ? "Validation..." : "Valider mon repos"}
               </Button>
            </CardContent>
         </Card>
      </div>
    </div>
  )
}
