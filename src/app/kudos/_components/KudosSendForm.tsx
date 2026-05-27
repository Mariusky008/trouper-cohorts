'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const BADGES_BY_CATEGORY = {
  '🫂 Humain': [
    { emoji: '❤️', name: 'Bienveillant' },
    { emoji: '👂', name: 'À l\'écoute' },
    { emoji: '💡', name: 'De bons conseils' },
    { emoji: '🫂', name: 'Soutien moral' },
    { emoji: '😄', name: 'Bonne humeur' },
    { emoji: '🧘', name: 'Calme' },
  ],
  '🏠 Vie quotidienne': [
    { emoji: '✨', name: 'Propre' },
    { emoji: '🤝', name: 'Fiable' },
    { emoji: '🔇', name: 'Discret' },
    { emoji: '🏡', name: 'Bon voisin' },
    { emoji: '🎉', name: 'Festif' },
    { emoji: '🔑', name: 'De confiance' },
  ],
  '💼 Pro': [
    { emoji: '⚡', name: 'Ponctuel' },
    { emoji: '🎯', name: 'Organisé' },
    { emoji: '💬', name: 'Bonne communication' },
    { emoji: '📦', name: 'Livraison soignée' },
  ],
}

const RELATIONS = [
  { value: 'coloc', label: '🏠 Coloc' },
  { value: 'ami', label: '👋 Ami(e)' },
  { value: 'collegue', label: '💼 Collègue' },
  { value: 'voisin', label: '🏘 Voisin' },
  { value: 'autre', label: '🤝 Autre' },
]

const DURATIONS = [
  { value: '1m', label: '< 1 mois' },
  { value: '6m', label: '6 mois' },
  { value: '2a', label: '~2 ans' },
  { value: '2a+', label: '2 ans+' },
]

const DEMO_RECEIVER = {
  name: 'Chloé M.',
  username: 'chloe',
  avatar_url: 'https://i.pravatar.cc/160?img=47',
  archetype: '🌟 La Perle de coloc',
}

type Step = 'badge' | 'context' | 'message' | 'confirm' | 'done'

export function KudosSendForm({ username }: { username: string }) {
  const router = useRouter()
  const receiver = DEMO_RECEIVER // TODO: fetch real user

  const [step, setStep] = useState<Step>('badge')
  const [selectedBadge, setSelectedBadge] = useState<{ emoji: string; name: string } | null>(null)
  const [relation, setRelation] = useState('coloc')
  const [duration, setDuration] = useState('6m')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const progress = { badge: 25, context: 50, message: 75, confirm: 90, done: 100 }[step]

  async function handleSend() {
    setSending(true)
    // TODO: appel API réel
    await new Promise(r => setTimeout(r, 900))
    setStep('done')
    setSending(false)
  }

  if (step === 'done') {
    return <KudosSentSuccess receiver={receiver} badge={selectedBadge!} onClose={() => router.push(`/kudos/${username}`)} />
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#F7F8FC',
      display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: '#fff', padding: '52px 16px 16px',
        borderBottom: '1px solid rgba(0,0,0,.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => step === 'badge' ? router.back() : setStep(s => ({ badge:'badge', context:'badge', message:'context', confirm:'message', done:'confirm' } as any)[s])}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0 }}
          >
            ←
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <img
              src={receiver.avatar_url}
              alt={receiver.name}
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                Kudos pour {receiver.name.split(' ')[0]}
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>{receiver.archetype}</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: '#EEF2F8', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`, borderRadius: 3,
            background: 'linear-gradient(90deg,#4F7DF3,#8B5CF6)',
            transition: 'width .35s ease',
          }} />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px 16px' }}>

        {/* STEP 1 : Choix du badge */}
        {step === 'badge' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', marginBottom: 6, margin: '0 0 6px' }}>
              Quel Kudos tu envoies ?
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24, margin: '0 0 24px' }}>
              Choisis la qualité qui correspond le mieux à {receiver.name.split(' ')[0]}
            </p>

            {Object.entries(BADGES_BY_CATEGORY).map(([cat, badges]) => (
              <div key={cat} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 10 }}>{cat}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {badges.map((b) => {
                    const isSelected = selectedBadge?.name === b.name
                    return (
                      <button
                        key={b.name}
                        onClick={() => { setSelectedBadge(b); setStep('context') }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '9px 16px', borderRadius: 100, cursor: 'pointer',
                          fontSize: 13, fontWeight: 700,
                          background: isSelected ? 'linear-gradient(135deg,#4F7DF3,#8B5CF6)' : '#fff',
                          color: isSelected ? '#fff' : '#0F172A',
                          border: isSelected ? 'none' : '1.5px solid rgba(0,0,0,.09)',
                          boxShadow: isSelected ? '0 4px 16px rgba(79,125,243,.35)' : '0 1px 4px rgba(0,0,0,.06)',
                          transition: 'all .18s cubic-bezier(.34,1.4,.64,1)',
                          transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{b.emoji}</span>
                        {b.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 2 : Contexte */}
        {step === 'context' && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg,#4F7DF3,#8B5CF6)', borderRadius: 20,
              padding: '20px', textAlign: 'center', marginBottom: 28, color: '#fff',
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{selectedBadge?.emoji}</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{selectedBadge?.name}</div>
              <div style={{ fontSize: 12, opacity: .75, marginTop: 4 }}>
                Tu envoies ce Kudos à {receiver.name.split(' ')[0]}
              </div>
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 20px' }}>
              Votre relation ?
            </h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
              {RELATIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRelation(r.value)}
                  style={{
                    padding: '10px 18px', borderRadius: 100, cursor: 'pointer',
                    fontSize: 13, fontWeight: 700, border: 'none',
                    background: relation === r.value ? '#0F172A' : '#fff',
                    color: relation === r.value ? '#fff' : '#0F172A',
                    boxShadow: relation === r.value ? '0 4px 16px rgba(0,0,0,.2)' : '0 1px 4px rgba(0,0,0,.06)',
                    transition: 'all .18s',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 16px' }}>
              Depuis combien de temps ?
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  style={{
                    padding: '14px', borderRadius: 16, cursor: 'pointer',
                    fontSize: 14, fontWeight: 700, border: 'none',
                    background: duration === d.value ? 'linear-gradient(135deg,#4F7DF3,#8B5CF6)' : '#fff',
                    color: duration === d.value ? '#fff' : '#0F172A',
                    boxShadow: duration === d.value ? '0 4px 16px rgba(79,125,243,.35)' : '0 1px 4px rgba(0,0,0,.06)',
                    transition: 'all .18s',
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('message')}
              style={primaryBtnStyle}
            >
              Continuer →
            </button>
          </div>
        )}

        {/* STEP 3 : Message */}
        {step === 'message' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: '0 0 6px' }}>
              Un mot pour {receiver.name.split(' ')[0]} ?
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px' }}>
              Optionnel — mais ça fait toujours chaud au cœur 🤗
            </p>

            <textarea
              placeholder={`Ex: "J'ai habité 1 an avec toi à Lyon, tu as été la meilleure colocataire possible..."`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={280}
              rows={5}
              style={{
                width: '100%', padding: '16px', borderRadius: 16, fontSize: 14,
                border: '1.5px solid rgba(0,0,0,.1)', background: '#fff',
                outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.6,
                color: '#0F172A', marginBottom: 8,
              }}
            />
            <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'right', marginBottom: 24 }}>
              {message.length}/280
            </div>

            <button onClick={() => setStep('confirm')} style={primaryBtnStyle}>
              Continuer →
            </button>
            <button onClick={() => setStep('confirm')} style={ghostBtnStyle}>
              Passer cette étape
            </button>
          </div>
        )}

        {/* STEP 4 : Confirmation */}
        {step === 'confirm' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: '0 0 20px' }}>
              Confirme ton Kudos
            </h2>

            {/* Card récap */}
            <div style={{
              background: '#fff', borderRadius: 20,
              border: '1px solid rgba(0,0,0,.07)',
              padding: '20px', marginBottom: 24,
              boxShadow: '0 2px 16px rgba(0,0,0,.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <img src={receiver.avatar_url} style={{ width: 44, height: 44, borderRadius: '50%' }} alt="" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{receiver.name}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    {RELATIONS.find(r => r.value === relation)?.label} · {DURATIONS.find(d => d.value === duration)?.label}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)',
                border: '1px solid rgba(139,92,246,.2)',
                borderRadius: 100, padding: '10px 18px',
                fontSize: 14, fontWeight: 800, color: '#4F7DF3',
                marginBottom: message ? 14 : 0,
              }}>
                <span style={{ fontSize: 20 }}>{selectedBadge?.emoji}</span>
                {selectedBadge?.name}
              </div>

              {message && (
                <div style={{
                  fontSize: 13, color: '#64748B', fontStyle: 'italic',
                  background: '#F7F8FC', borderRadius: 12, padding: '12px 14px',
                  borderLeft: '3px solid #8B5CF6', lineHeight: 1.6,
                }}>
                  &ldquo;{message}&rdquo;
                </div>
              )}
            </div>

            <div style={{
              display: 'flex', gap: 8, alignItems: 'center',
              background: '#F0FDF4', borderRadius: 14, padding: '12px 14px',
              marginBottom: 24, fontSize: 12, color: '#166534',
            }}>
              <span style={{ fontSize: 16 }}>🔒</span>
              <span>Ton nom sera visible par {receiver.name.split(' ')[0]} uniquement</span>
            </div>

            <button
              onClick={handleSend}
              disabled={sending}
              style={{ ...primaryBtnStyle, opacity: sending ? .7 : 1 }}
            >
              {sending ? '✨ Envoi...' : `✨ Envoyer le Kudos`}
            </button>
          </div>
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        textarea::placeholder { color: #94A3B8; }
      `}</style>
    </div>
  )
}

function KudosSentSuccess({
  receiver, badge, onClose,
}: {
  receiver: typeof DEMO_RECEIVER
  badge: { emoji: string; name: string }
  onClose: () => void
}) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg,#0F172A 0%,#1e3a5f 55%,#2563EB 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
      {/* Confetti emoji */}
      <div style={{ fontSize: 64, marginBottom: 24, animation: 'popIn .6s cubic-bezier(.34,1.56,.64,1)' }}>
        🎉
      </div>

      <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
        Kudos envoyé !
      </div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', marginBottom: 32, lineHeight: 1.6 }}>
        {receiver.name.split(' ')[0]} recevra une notification<br />avec ton {badge.emoji} <strong style={{ color: '#fff' }}>{badge.name}</strong>
      </div>

      {/* Badge animé */}
      <div style={{
        background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(20px)',
        borderRadius: 20, padding: '20px 32px', marginBottom: 40,
        border: '1px solid rgba(255,255,255,.25)',
        animation: 'revealArch .65s cubic-bezier(.34,1.56,.64,1) .2s both',
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>{badge.emoji}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{badge.name}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>
          → {receiver.name}
        </div>
      </div>

      <button
        onClick={onClose}
        style={{
          background: '#fff', color: '#0F172A', border: 'none',
          borderRadius: 16, padding: '16px 32px', fontSize: 15,
          fontWeight: 800, cursor: 'pointer', width: '100%', maxWidth: 300,
        }}
      >
        Voir le profil de {receiver.name.split(' ')[0]}
      </button>

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes revealArch {
          0% { opacity: 0; transform: scale(.72); }
          60% { transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

const primaryBtnStyle: React.CSSProperties = {
  width: '100%', padding: '16px', borderRadius: 16, border: 'none',
  background: 'linear-gradient(135deg,#4F7DF3,#8B5CF6)',
  color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
  boxShadow: '0 6px 24px rgba(79,125,243,.35)', marginBottom: 12,
  fontFamily: 'inherit',
}

const ghostBtnStyle: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 16,
  background: 'transparent', border: '1.5px solid rgba(0,0,0,.1)',
  color: '#64748B', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  fontFamily: 'inherit',
}
