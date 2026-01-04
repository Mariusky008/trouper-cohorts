"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, HelpCircle, ShieldCheck, TrendingUp, Target, Lock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const items = [
  {
    icon: ShieldCheck,
    question: "Est-ce que je risque un shadowban ?",
    answer: "Non. Le shadowban arrive quand TikTok détecte des robots ou des comportements anormaux (1000 likes en 1 seconde). Troupers repose uniquement sur des actions humaines réelles. Chaque membre regarde ta vidéo, like et commente manuellement. Pour l'algorithme, c'est indiscernable d'un succès organique."
  },
  {
    icon: TrendingUp,
    question: "Est-ce que ça garantit des abonnés ?",
    answer: "Non, personne ne peut garantir des abonnés (sauf ceux qui vendent des faux). Troupers te garantit que ta vidéo sera vue et testée par un public plus large. Si ton contenu est bon, les abonnés suivront naturellement grâce à cette visibilité débloquée."
  },
  {
    icon: Target,
    question: "À qui s’adresse Troupers ?",
    answer: "Aux créateurs débutants, aux comptes bloqués à 200 vues, et aux créateurs motivés qui veulent décoller. Ce n'est pas pour ceux qui cherchent une solution magique sans effort : il faut jouer le jeu de l'entraide."
  },
  {
    icon: Lock,
    question: "Dois-je donner mon mot de passe ?",
    answer: "Jamais. Nous n'avons besoin d'aucun accès à ton compte TikTok. Tu partages simplement le lien public de ta vidéo. C'est 100% sécurisé."
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-24 bg-slate-50 text-slate-900 border-t border-slate-200">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center mb-12">
           <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-4">
              <HelpCircle className="w-6 h-6" />
           </div>
           <h2 className="text-3xl font-black tracking-tight">
             Questions Fréquentes
           </h2>
        </div>
        
        <div className="space-y-4">
          {items.map((item, i) => (
            <div 
              key={i} 
              className={`border rounded-xl bg-white shadow-sm overflow-hidden transition-all duration-200 ${openIndex === i ? 'ring-2 ring-indigo-500/20 border-indigo-500/30' : 'hover:border-indigo-200'}`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex items-center justify-between w-full p-5 text-left"
              >
                <div className="flex items-center gap-4">
                   <item.icon className={`w-5 h-5 ${openIndex === i ? 'text-indigo-600' : 'text-slate-400'}`} />
                   <span className="font-bold text-slate-900">{item.question}</span>
                </div>
                {openIndex === i ? <ChevronUp className="w-5 h-5 text-indigo-500" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 pl-14 text-slate-600 leading-relaxed text-sm">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
