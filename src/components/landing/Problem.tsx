"use client"

import { motion } from "framer-motion"
import { XCircle, AlertCircle } from "lucide-react"

const problems = [
  "Tu postes régulièrement mais tes vidéos stagnent à 200–500 vues",
  "Tu sais que ton contenu est bon, mais TikTok ne le montre à personne",
  "Tu vois d’autres comptes exploser sans comprendre pourquoi",
]

export function Problem() {
  return (
    <section className="bg-slate-50 py-24 md:py-32">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="text-center mb-16">
           <h2 className="text-3xl font-black tracking-tight md:text-4xl flex items-center justify-center gap-3">
             <XCircle className="h-8 w-8 text-red-500" />
             Le problème (tu te reconnais ?)
           </h2>
        </div>

        <div className="grid gap-12 md:grid-cols-2 md:gap-24 items-center">
          <div className="space-y-6">
            <div className="space-y-4">
              {problems.map((problem, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4 rounded-xl border border-red-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <XCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-lg font-medium text-slate-800">{problem}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-6 rounded-2xl border bg-white p-8 shadow-xl shadow-red-500/5 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-red-500/10 rounded-full blur-2xl" />
            
            <div className="relative z-10">
               <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
                 <AlertCircle className="h-8 w-8 text-red-600" />
               </div>
               <div className="space-y-4">
                 <h3 className="text-2xl font-black md:text-3xl text-slate-900">
                   Ce n’est pas ton contenu le problème.
                 </h3>
                 <p className="text-xl text-slate-500 font-medium">
                   C’est le <span className="text-red-600 font-bold">démarrage</span> de tes vidéos.
                 </p>
                 <p className="text-base text-slate-600 leading-relaxed">
                   Sans interactions rapides dès la publication, TikTok considère ta vidéo comme "sans intérêt" et coupe la diffusion. C'est mathématique.
                 </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
