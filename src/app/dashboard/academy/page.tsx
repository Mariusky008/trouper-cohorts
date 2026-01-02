"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trophy, CheckCircle, Lock, Play, BookOpen, Target, DollarSign, TrendingUp, FileText } from "lucide-react"
import { motion } from "framer-motion"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function AcademyPage() {
  const [currentLevel, setCurrentLevel] = useState(1)
  const [selectedResource, setSelectedResource] = useState<{title: string, type: string, url?: string, content?: string} | null>(null)
  
  // Progression simulée (à connecter à la DB plus tard)
  const [stats, setStats] = useState({
    followers: 0,
    views: 0
  })

  const milestones = [
    {
      level: 1,
      title: "Le Baptême du Feu",
      target: "0 - 100 Abonnés",
      description: "Tes premiers pas. L'objectif n'est pas la perfection, c'est l'action.",
      rewards: "Accès aux escouades",
      tasks: [
        { id: "profile", text: "Optimiser ma bio TikTok (Photo + Niche)", completed: false },
        { id: "first_video", text: "Poster ma 1ère vidéo (même nulle !)", completed: false },
        { id: "squad", text: "Rejoindre une Escouade Troupers", completed: false },
        { id: "algo", text: "Comprendre comment marche l'algo (voir guide)", completed: false }
      ]
    },
    {
      level: 2,
      title: "La Discipline de Fer",
      target: "100 - 1 000 Abonnés",
      description: "C'est ici que 90% abandonnent. Prouve que tu es différent.",
      rewards: "Débloque le Générateur de Scripts Avancé",
      tasks: [
        { id: "calendar", text: "Définir un rythme (ex: 1 vidéo/jour)", completed: false },
        { id: "hook", text: "Maîtriser les Hooks (3 premières secondes)", completed: false },
        { id: "batch", text: "Batcher 5 vidéos d'avance", completed: false },
        { id: "reply", text: "Répondre à tous les commentaires en vidéo", completed: false }
      ]
    },
    {
      level: 3,
      title: "L'Expansion Virale",
      target: "1 000 - 10 000 Abonnés",
      description: "Tu as trouvé ta voix. Il est temps de crier plus fort.",
      rewards: "Accès aux marques partenaires (Sponsors)",
      tasks: [
        { id: "analyze", text: "Analyser mes tops vidéos (Rétention)", completed: false },
        { id: "series", text: "Créer une série de vidéos récurrente", completed: false },
        { id: "live", text: "Faire mon premier LIVE", completed: false },
        { id: "collab", text: "Faire un duo/collage avec un compte similaire", completed: false }
      ]
    },
    {
      level: 4,
      title: "La Monétisation (L'Elite)",
      target: "10 000+ Abonnés",
      description: "Félicitations. Tu entres dans la cour des grands.",
      rewards: "Fonds Créateur TikTok + Revenus Passifs",
      tasks: [
        { id: "creator_fund", text: "Activer le Fonds Créateur (Beta)", completed: false },
        { id: "media_kit", text: "Créer mon Kit Média pour les marques", completed: false },
        { id: "product", text: "Lancer mon premier produit digital", completed: false },
        { id: "scale", text: "Déléguer le montage", completed: false }
      ]
    }
  ]

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Target className="h-8 w-8 text-red-600" />
            OBJECTIF 10K
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Ta feuille de route pour passer de 0 à la monétisation. Suis les étapes, ne saute rien, et tu y arriveras en moins d'un an.
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-xl border shadow-sm min-w-[250px]">
           <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-500">Progression Globale</span>
              <span className="text-xs font-bold text-red-600">{Math.round((stats.followers / 10000) * 100)}%</span>
           </div>
           <Progress value={(stats.followers / 10000) * 100} className="h-2 bg-slate-100" />
           <div className="flex justify-between mt-2 text-sm font-medium">
              <span>{stats.followers.toLocaleString()} abonnés</span>
              <span className="text-slate-400">Obj: 10 000</span>
           </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
         {/* LEFT: TIMELINE */}
         <div className="lg:col-span-2 space-y-8">
            {milestones.map((milestone, index) => {
               const isLocked = milestone.level > currentLevel
               const isCurrent = milestone.level === currentLevel
               const isCompleted = milestone.level < currentLevel

               return (
                 <motion.div 
                   key={milestone.level}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: index * 0.1 }}
                   className={`relative pl-8 md:pl-0 ${isLocked ? 'opacity-60 grayscale' : ''}`}
                 >
                    {/* Connector Line */}
                    {index !== milestones.length - 1 && (
                       <div className="absolute left-4 md:left-8 top-16 bottom-0 w-0.5 bg-slate-200 -z-10 h-[calc(100%+2rem)]" />
                    )}

                    <div className="flex gap-6">
                       {/* Icon Bubble */}
                       <div className={`shrink-0 w-8 h-8 md:w-16 md:h-16 rounded-full flex items-center justify-center border-4 z-10 bg-white ${
                          isCompleted ? 'border-green-500 text-green-500' : 
                          isCurrent ? 'border-red-500 text-red-600 shadow-lg shadow-red-500/20' : 
                          'border-slate-200 text-slate-300'
                       }`}>
                          {isCompleted ? <CheckCircle className="w-4 h-4 md:w-8 md:h-8" /> : 
                           isLocked ? <Lock className="w-4 h-4 md:w-6 md:h-6" /> : 
                           <span className="text-lg md:text-2xl font-black">{milestone.level}</span>}
                       </div>

                       {/* Content Card */}
                       <div className={`flex-1 rounded-xl border p-6 transition-all ${
                          isCurrent ? 'bg-white border-red-200 shadow-md ring-1 ring-red-100' : 
                          'bg-slate-50/50 border-slate-200'
                       }`}>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                             <div>
                                <h3 className={`text-lg font-bold ${isCurrent ? 'text-slate-900' : 'text-slate-600'}`}>
                                   {milestone.title}
                                </h3>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                   isCurrent ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'
                                }`}>
                                   {milestone.target}
                                </span>
                             </div>
                             {isLocked && <Lock className="h-5 w-5 text-slate-300" />}
                          </div>

                          <p className="text-sm text-slate-600 mb-6 italic">
                             "{milestone.description}"
                          </p>

                          <div className="space-y-3 bg-white/50 rounded-lg p-4 border border-slate-100">
                             <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Check-list de Passage</h4>
                             {milestone.tasks.map((task) => (
                                <div key={task.id} className="flex items-start gap-3">
                                   <Checkbox id={task.id} disabled={isLocked} />
                                   <label htmlFor={task.id} className={`text-sm leading-tight cursor-pointer ${isLocked ? 'text-muted-foreground' : ''}`}>
                                      {task.text}
                                   </label>
                                </div>
                             ))}
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-amber-600 font-medium">
                             <Trophy className="h-4 w-4" />
                             <span>Récompense : {milestone.rewards}</span>
                          </div>
                       </div>
                    </div>
                 </motion.div>
               )
            })}
         </div>

         {/* RIGHT: RESOURCES */}
         <div className="space-y-6">
            <div className="sticky top-8 space-y-6">
               <div className="rounded-xl bg-gradient-to-br from-indigo-900 to-slate-900 p-6 text-white shadow-xl">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                     <BookOpen className="h-5 w-5 text-indigo-400" />
                     Ressources Débutant
                  </h3>
                  <p className="text-indigo-200 text-sm mb-4">
                     Ne perds pas de temps à chercher. Voici les guides essentiels.
                  </p>
                  <ul className="space-y-3">
                     <li 
                        onClick={() => setSelectedResource({ 
                           title: "Comprendre l'Algo TikTok en 2026", 
                           type: "video",
                           url: "https://www.youtube.com/embed/_J8M-kBMb7Q"
                        })}
                        className="flex items-center gap-2 text-sm hover:text-indigo-300 cursor-pointer transition-colors"
                     >
                        <Play className="h-4 w-4 fill-indigo-400 text-indigo-400" />
                        Comprendre l'Algo TikTok en 2026
                     </li>
                     <li 
                        onClick={() => setSelectedResource({ 
                           title: "Tuto : Monter une vidéo virale", 
                           type: "video",
                           url: "https://www.youtube.com/embed/Zeh4jVVuGDE"
                        })}
                        className="flex items-center gap-2 text-sm hover:text-indigo-300 cursor-pointer transition-colors"
                     >
                        <Play className="h-4 w-4 fill-indigo-400 text-indigo-400" />
                        Tuto : Monter une vidéo virale
                     </li>
                     <li 
                        onClick={() => setSelectedResource({ 
                           title: "La liste des 50 niches rentables", 
                           type: "pdf",
                           content: `
1.  **Business & Argent**
    *   Intelligence Artificielle (Outils, Tutos)
    *   Cryptomonnaie & Trading
    *   Dropshipping & E-commerce
    *   Affiliate Marketing
    *   Investissement Immobilier
    *   Budget & Finances Personnelles
    *   Productivité & Notion
    *   Side Hustles (Gagner de l'argent en ligne)
    *   Marketing Digital & Vente
    *   Leadership & Management

2.  **Santé & Bien-être**
    *   Musculation & Fitness (Gym)
    *   Perte de poids & Nutrition
    *   Santé Mentale & Anxiété
    *   Yoga & Méditation
    *   Biohacking & Sommeil
    *   Recettes Healthy Rapides
    *   Calisthenics (Street Workout)
    *   Soins de la peau (Skincare)
    *   Santé Féminine
    *   Stop Tabac / Addictions

3.  **Relations & Développement Perso**
    *   Séduction & Dating (Hommes/Femmes)
    *   Psychologie & Langage Corporel
    *   Confiance en soi
    *   Rupture & Recovery
    *   Conseils de couple
    *   Stoïcisme & Philosophie
    *   Communication & Charisme
    *   Spiritualité & Astrologie
    *   Motivation & Discipline
    *   Lifestyle "That Girl" / "Alpha"

4.  **Tech & Gaming**
    *   Astuces iPhone / Android
    *   Setup Gaming & PC
    *   News Tech & Gadgets
    *   Minecraft (Builds, Mods)
    *   Roblox
    *   GTA VI News & Leaks
    *   Valorant / League of Legends (Clips)
    *   Coding & Programmation
    *   Excel & Google Sheets Tips
    *   Photoshop & Design

5.  **Loisirs & Créativité**
    *   Voyage (Travel Hacks, Destinations)
    *   Cuisine & Pâtisserie (ASMR)
    *   Mode & Streetwear
    *   Bricolage & DIY
    *   Dessin & Art Numérique
    *   Photographie & Vidéo
    *   Automobile (Supercars, Mécanique)
    *   Animaux de compagnie (Chiens/Chats)
    *   Jardinage & Plantes
    *   Magie & Mentalisme
                           `
                        })}
                        className="flex items-center gap-2 text-sm hover:text-indigo-300 cursor-pointer transition-colors"
                     >
                        <FileText className="h-4 w-4 text-indigo-400" />
                        La liste des 50 niches rentables
                     </li>
                  </ul>
               </div>

               {/* Resource Viewer Modal */}
               <Dialog open={!!selectedResource} onOpenChange={(open) => !open && setSelectedResource(null)}>
                 <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
                   <DialogHeader className="p-6 pb-2 shrink-0">
                     <DialogTitle className="flex items-center gap-2">
                        {selectedResource?.type === 'video' ? <Play className="h-5 w-5 text-red-500" /> : <FileText className="h-5 w-5 text-blue-500" />}
                        {selectedResource?.title}
                     </DialogTitle>
                     <DialogDescription>
                       Ressource exclusive pour les membres de l'académie.
                     </DialogDescription>
                   </DialogHeader>
                   
                   <div className="flex-1 bg-slate-50 p-4 overflow-hidden flex flex-col">
                      {selectedResource?.type === 'video' ? (
                         <div className="w-full h-full rounded-lg overflow-hidden bg-black shadow-inner">
                            <iframe 
                              width="100%" 
                              height="100%" 
                              src={selectedResource.url} 
                              title="YouTube video player" 
                              frameBorder="0" 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                              allowFullScreen
                            ></iframe>
                         </div>
                      ) : (
                         <div className="w-full h-full overflow-y-auto pr-2">
                            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 min-h-full prose prose-slate max-w-none">
                               <div className="whitespace-pre-wrap font-medium text-slate-700">
                                  {selectedResource?.content}
                               </div>
                            </div>
                         </div>
                      )}
                   </div>
                   
                   <div className="p-4 bg-white border-t flex justify-end shrink-0">
                      <Button onClick={() => setSelectedResource(null)}>Fermer</Button>
                   </div>
                 </DialogContent>
               </Dialog>

               <div className="rounded-xl border bg-green-50 p-6 border-green-100">
                  <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                     <DollarSign className="h-5 w-5" />
                     Potentiel de Gains
                  </h3>
                  <div className="space-y-4">
                     <div>
                        <div className="flex justify-between text-sm mb-1">
                           <span className="text-green-700">10k Abonnés</span>
                           <span className="font-bold text-green-900">~200€ / mois</span>
                        </div>
                        <Progress value={10} className="h-1 bg-green-200" />
                     </div>
                     <div>
                        <div className="flex justify-between text-sm mb-1">
                           <span className="text-green-700">100k Abonnés</span>
                           <span className="font-bold text-green-900">~1500€ / mois</span>
                        </div>
                        <Progress value={40} className="h-1 bg-green-200" />
                     </div>
                     <p className="text-xs text-green-600 mt-2 italic">
                        *Estimations basées sur le Fonds Créateur + 1 placement produit.
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
