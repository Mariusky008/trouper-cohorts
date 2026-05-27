'use client'

import { useState } from 'react'

export type OnboardingAnswer = {
  dimensionSlug: string
  optionIndex: number
  optionLabel: string
  score: number
}

type Question = {
  stepNum: number
  dimensionSlug: string
  question: string
  hint: string
  options: {
    emoji: string
    label: string
    desc: string
    score: number
  }[]
}

const QUESTIONS: Question[] = [
  {
    stepNum: 1,
    dimensionSlug: 'discretion_vs_visibilite',
    question: 'Quand tu entres dans une pièce pleine de monde, tu...',
    hint: 'Pas de bonne réponse. On veut juste savoir comment TU te vois — on comparera avec ce que tes proches diront.',
    options: [
      { emoji: '🔥', label: 'Tu rayonnes', desc: "L'énergie monte, on te remarque", score: 0.9 },
      { emoji: '🌙', label: 'Tu observes d\'abord', desc: 'Tu prends la température, discrètement', score: 0.2 },
      { emoji: '🤝', label: 'Tu vas vers les gens', desc: 'Tu crées du lien, un par un', score: 0.65 },
      { emoji: '🎯', label: 'Tu cherches qui tu connais', desc: 'Tu vas droit à tes gens', score: 0.45 },
    ],
  },
  {
    stepNum: 2,
    dimensionSlug: 'chaleur_vs_distance',
    question: 'Dans ton cercle proche, tu es plutôt...',
    hint: 'Pense à comment tes amis te décriraient naturellement.',
    options: [
      { emoji: '🫂', label: 'Chaleureux, expressif', desc: 'Tu montres facilement ce que tu ressens', score: 0.9 },
      { emoji: '🧊', label: 'Réservé, observateur', desc: 'Tu gardes une certaine distance', score: 0.1 },
      { emoji: '🌊', label: 'Profond mais discret', desc: 'Tu donnes beaucoup mais dans l\'ombre', score: 0.5 },
      { emoji: '⚡', label: 'Intense par intermittence', desc: 'Tout ou rien selon le contexte', score: 0.7 },
    ],
  },
  {
    stepNum: 3,
    dimensionSlug: 'leadership',
    question: 'Quand un groupe est face à une décision difficile, tu...',
    hint: 'Spontanément, sans réfléchir.',
    options: [
      { emoji: '🧭', label: 'Tu prends la boussole', desc: 'Tu orientes naturellement le groupe', score: 0.9 },
      { emoji: '🔍', label: 'Tu poses les bonnes questions', desc: 'Tu aides à clarifier sans diriger', score: 0.6 },
      { emoji: '⚓', label: 'Tu stabilises', desc: 'Tu ramènes au calme et à l\'essentiel', score: 0.4 },
      { emoji: '🎨', label: 'Tu proposes des idées nouvelles', desc: 'Tu ouvres des perspectives inattendues', score: 0.55 },
    ],
  },
  {
    stepNum: 4,
    dimensionSlug: 'profondeur_vs_brillance',
    question: 'Dans une conversation, ce qui te plaît le plus c\'est...',
    hint: 'Ce qui t\'attire vraiment, pas ce que tu penses qu\'on attend.',
    options: [
      { emoji: '🌊', label: 'Plonger en profondeur', desc: 'Un sujet, vraiment creusé', score: 0.1 },
      { emoji: '✨', label: 'Voltiger entre les sujets', desc: 'Pétillant, léger, stimulant', score: 0.9 },
      { emoji: '💡', label: 'Trouver l\'insight rare', desc: 'Le truc que personne n\'avait vu', score: 0.5 },
      { emoji: '❤️', label: 'Vraiment se connecter', desc: 'L\'humain avant les idées', score: 0.3 },
    ],
  },
  {
    stepNum: 5,
    dimensionSlug: 'self_image',
    question: 'Les gens qui te connaissent bien diraient que tu es...',
    hint: 'La vraie image qu\'on a de toi — pas forcément celle que tu veux donner.',
    options: [
      { emoji: '🏛️', label: 'Un pilier, une référence', desc: 'On vient te chercher quand ça compte', score: 0.85 },
      { emoji: '🌿', label: 'Un havre de calme', desc: 'Ta présence apaise', score: 0.4 },
      { emoji: '🎪', label: 'Une énergie irrésistible', desc: 'Tu mets la vie là où tu es', score: 0.9 },
      { emoji: '🔭', label: 'Un regard décalé', desc: 'Tu vois les choses autrement', score: 0.6 },
    ],
  },
]

// Résume les réponses en 3 traits pour l'écran final
function computeTopTraits(answers: OnboardingAnswer[]): { emoji: string; label: string }[] {
  const traits: { emoji: string; label: string }[] = []
  for (const a of answers) {
    const q = QUESTIONS.find((q) => q.dimensionSlug === a.dimensionSlug)
    const opt = q?.options[a.optionIndex]
    if (opt) traits.push({ emoji: opt.emoji, label: opt.label })
  }
  return traits.slice(0, 3)
}

type Props = {
  onComplete: (answers: OnboardingAnswer[]) => void
}

export function KudosOnboardingReflexif({ onComplete }: Props) {
  const [step, setStep] = useState(0) // 0..4 = questions, 5 = final
  const [answers, setAnswers] = useState<OnboardingAnswer[]>([])
  const [selected, setSelected] = useState<number | null>(null)

  const total = QUESTIONS.length
  const q = QUESTIONS[step]

  function selectOption(idx: number) {
    setSelected(idx)
  }

  function handleNext() {
    if (selected === null) return
    const opt = q.options[selected]
    const newAnswers = [
      ...answers.filter((a) => a.dimensionSlug !== q.dimensionSlug),
      { dimensionSlug: q.dimensionSlug, optionIndex: selected, optionLabel: opt.label, score: opt.score },
    ]
    setAnswers(newAnswers)
    setSelected(null)
    if (step < total - 1) {
      setStep(step + 1)
    } else {
      setStep(total) // final screen
    }
  }

  function handleSkip() {
    setSelected(null)
    if (step < total - 1) {
      setStep(step + 1)
    } else {
      setStep(total)
    }
  }

  if (step === total) {
    return <FinalScreen answers={answers} onComplete={onComplete} />
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#08080C',
      display: 'flex', flexDirection: 'column',
      padding: '1.5rem 1.25rem', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
      {/* Barre de progression */}
      <div style={{ display: 'flex', gap: 5, marginBottom: '2rem' }}>
        {QUESTIONS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 999,
            background: i < step ? '#C0DD97' : i === step ? 'rgba(192,221,151,.5)' : 'rgba(255,255,255,.1)',
            transition: 'background .3s',
          }} />
        ))}
      </div>

      {/* Numéro d'étape */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#8B5CF6', marginBottom: 10 }}>
        Question {q.stepNum} sur {total} · Sur toi
      </div>

      {/* Question */}
      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1.25, letterSpacing: -0.5, marginBottom: 8 }}>
        {q.question}
      </div>

      {/* Hint */}
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', lineHeight: 1.5, marginBottom: '1.75rem' }}>
        {q.hint}
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {q.options.map((opt, i) => {
          const isSel = selected === i
          return (
            <button
              key={i}
              onClick={() => selectOption(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 13,
                padding: 16, borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                border: isSel ? '1.5px solid rgba(139,92,246,.7)' : '1px solid rgba(255,255,255,.1)',
                background: isSel ? 'rgba(139,92,246,.15)' : '#141420',
                transition: 'all .2s',
              }}
            >
              <span style={{ fontSize: 28, flexShrink: 0 }}>{opt.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>{opt.desc}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
        <button
          onClick={handleSkip}
          style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Passer
        </button>
        <button
          onClick={handleNext}
          disabled={selected === null}
          style={{
            background: 'linear-gradient(135deg,#8B5CF6,#A78BFA)',
            color: '#fff', border: 'none', borderRadius: 12,
            padding: '13px 28px', fontSize: 15, fontWeight: 700,
            cursor: selected === null ? 'not-allowed' : 'pointer',
            opacity: selected === null ? 0.4 : 1, transition: 'opacity .2s',
            display: 'flex', alignItems: 'center', gap: 7,
          }}
        >
          Suivant →
        </button>
      </div>

      <style>{`button { font-family: inherit; }`}</style>
    </div>
  )
}

function FinalScreen({ answers, onComplete }: { answers: OnboardingAnswer[]; onComplete: (a: OnboardingAnswer[]) => void }) {
  const traits = computeTopTraits(answers)

  return (
    <div style={{
      minHeight: '100dvh', background: '#08080C',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1.5rem', textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      position: 'relative',
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 300, height: 300, pointerEvents: 'none',
        background: 'radial-gradient(circle,rgba(139,92,246,.15) 0%,transparent 70%)',
      }} />

      {/* Icône miroir */}
      <div style={{ fontSize: 64, marginBottom: '1.25rem', animation: 'float 3s ease-in-out infinite' }}>
        🪞
      </div>

      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '0.875rem' }}>
        On a une première<br />idée de toi.
      </div>

      <div style={{ fontSize: 15, color: 'rgba(255,255,255,.55)', lineHeight: 1.6, marginBottom: '.5rem' }}>
        Voici comment TU te vois. C'est ton miroir intérieur — le point de départ.
      </div>

      {/* Portrait intérieur */}
      <div style={{
        background: 'linear-gradient(160deg,#0D0820,#1a1040)',
        border: '1px solid rgba(139,92,246,.25)', borderRadius: 18,
        padding: '1.25rem', margin: '1.5rem 0', width: '100%', maxWidth: 340,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#8B5CF6', marginBottom: 10 }}>
          ✦ Ton miroir intérieur
        </div>
        {traits.length > 0 ? traits.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{t.emoji}</span>
            <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{t.label}</span>
          </div>
        )) : (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', fontStyle: 'italic' }}>
            Réponds à quelques questions pour voir ton miroir
          </div>
        )}
        <div style={{
          marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,.35)',
          display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
        }}>
          🔒 Le miroir extérieur se révèle quand 3 proches répondent
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => onComplete(answers)}
        style={{
          width: '100%', maxWidth: 340,
          background: 'linear-gradient(135deg,#639922,#7AB832)',
          color: '#fff', border: 'none', borderRadius: 14,
          padding: 16, fontSize: 16, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 9,
          boxShadow: '0 4px 20px rgba(99,153,34,.3)',
        }}
      >
        📲 Inviter 3 proches pour voir s'ils sont d'accord
      </button>

      <style>{`
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        button { font-family: inherit; }
      `}</style>
    </div>
  )
}
