"use client"

import { motion } from "framer-motion"
import { XCircle, AlertCircle } from "lucide-react"

const problems = [
  "Tu publies régulièrement",
  "Ton contenu est bon",
  "Peu de vues",
  "Peu de commentaires",
  "L’algorithme t’ignore",
]

export function Problem() {
  return (
    <section className="bg-muted/30 py-24 md:py-32">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="grid gap-12 md:grid-cols-2 md:gap-24 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Pourquoi tu stagnes malgré tes efforts ?
            </h2>
            <div className="space-y-4">
              {problems.map((problem, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4 rounded-lg border bg-background p-4 shadow-sm"
                >
                  <XCircle className="h-6 w-6 text-destructive shrink-0" />
                  <span className="text-lg font-medium">{problem}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-6 rounded-2xl border bg-background p-8 shadow-lg md:p-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold md:text-3xl">
                Ce n’est pas ton contenu le problème.
              </h3>
              <p className="text-xl text-muted-foreground">
                C’est le manque de <span className="font-semibold text-foreground">visibilité initiale</span>.
              </p>
              <p className="text-base text-muted-foreground">
                Sans un premier cercle d'engagement, les algorithmes ne savent pas à qui montrer ton travail. Tu es invisible par design.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
