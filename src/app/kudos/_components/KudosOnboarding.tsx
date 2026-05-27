'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DEMO_BADGES = [
  { emoji: '❤️', name: 'Bienveillante', count: 20, delay: '0.7s' },
  { emoji: '✨', name: 'Propre', count: 18, delay: '1.3s' },
  { emoji: '👂', name: 'À l\'écoute', count: 14, delay: '1.9s' },
  { emoji: '😄', name: 'Bonne humeur', count: 11, delay: '2.5s' },
]

const USE_CASES = [
  { emoji: '🏠', title: 'Colocation', desc: 'Candidater avec un dossier de confiance prouvé' },
  { emoji: '💼', title: 'Freelance', desc: 'Rassurer un client avant une mission' },
  { emoji: '🤝', title: 'Social', desc: 'Être mieux compris par les gens qu\'on rencontre' },
]

export function KudosOnboarding() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'reveal' | 'input'>('reveal')

  function handleJoin() {
    setLoading(true)
    // TODO: appel API OTP
    setTimeout(() => {
      router.push('/kudos/profil')
    }, 800)
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg,#0F172A 0%,#1e3a5f 55%,#2563EB 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0 20px 40px',
      overflowX: 'hidden',
    }}>

      {/* Logo */}
      <div style={{ paddingTop: 56, marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>
          kudos<span style={{ color: '#60A5FA' }}>.</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2, fontWeight: 500 }}>
          ton identité de confiance
        </div>
      </div>

      {/* Animation de révélation */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginBottom: 36 }}>

        {/* Avatar ? → photo */}
        <div style={{ position: 'relative', width: 80, height: 80 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            border: '2px dashed rgba(255,255,255,.32)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'avatarPulse 2.2s ease-in-out 3',
            overflow: 'hidden', position: 'relative',
          }}>
            <span style={{ fontSize: 28, position: 'relative', zIndex: 1, color: 'rgba(255,255,255,.5)' }}>?</span>
            <img
              src="https://i.pravatar.cc/160?img=47"
              alt="avatar"
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', borderRadius: '50%',
                opacity: 0, animation: 'revealPhoto .55s ease 3.1s forwards',
              }}
            />
          </div>
        </div>

        {/* Archétype */}
        <div style={{
          background: 'rgba(255,255,255,.95)', color: '#8B5CF6',
          borderRadius: 20, padding: '10px 22px',
          fontWeight: 800, fontSize: 14,
          opacity: 0, transform: 'scale(.72)',
          animation: 'revealArch .65s cubic-bezier(.34,1.56,.64,1) 3.2s forwards',
        }}>
          🌟 La Perle de coloc
        </div>

        {/* Message */}
        <p style={{
          color: 'rgba(255,255,255,.65)', fontSize: 13, textAlign: 'center',
          maxWidth: 280, lineHeight: 1.6, margin: 0,
          opacity: 0, transform: 'translateY(8px)',
          animation: 'fadeUp .5s ease .4s forwards',
        }}>
          Au départ ton profil est vide. Chaque Kudos reçu révèle une nouvelle facette de ta personnalité.
        </p>

        {/* Badges séquentiels */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 300 }}>
          {DEMO_BADGES.map((b) => (
            <span
              key={b.name}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,.14)', borderRadius: 100,
                padding: '7px 14px', fontSize: 12, fontWeight: 700, color: '#fff',
                opacity: 0, transform: 'translateY(12px) scale(.82)',
                animation: `revealBadge .55s cubic-bezier(.34,1.56,.64,1) ${b.delay} forwards`,
              }}
            >
              {b.emoji} {b.name}
              <span style={{
                background: 'rgba(255,255,255,.22)', borderRadius: 20,
                padding: '1px 7px', fontSize: 10, fontWeight: 800,
              }}>
                {b.count}
              </span>
            </span>
          ))}
        </div>

        {/* Tagline finale */}
        <div style={{
          fontSize: 13, color: 'rgba(255,255,255,.7)', textAlign: 'center',
          opacity: 0, animation: 'fadeUp .5s ease 3.6s forwards',
        }}>
          Voilà qui tu es, vue par les autres ✨
        </div>
      </div>

      {/* Cas d'usage */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 36, maxWidth: 340, width: '100%' }}>
        {USE_CASES.map((u) => (
          <div key={u.title} style={{
            flex: 1, background: 'rgba(255,255,255,.08)', borderRadius: 16,
            padding: '12px 10px', textAlign: 'center',
            border: '1px solid rgba(255,255,255,.1)',
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{u.emoji}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{u.title}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', lineHeight: 1.4 }}>{u.desc}</div>
          </div>
        ))}
      </div>

      {/* Input téléphone + CTA */}
      <div style={{ width: '100%', maxWidth: 340 }}>
        <div style={{
          display: 'flex', gap: 0, background: 'rgba(255,255,255,.1)',
          borderRadius: 16, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,.2)', marginBottom: 12,
        }}>
          <div style={{
            padding: '14px 12px', color: '#fff', fontSize: 14, fontWeight: 700,
            borderRight: '1px solid rgba(255,255,255,.15)', flexShrink: 0,
          }}>
            🇫🇷 +33
          </div>
          <input
            type="tel"
            placeholder="6 12 34 56 78"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: 15, padding: '14px 14px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <button
          onClick={handleJoin}
          disabled={loading || phone.replace(/\s/g, '').length < 9}
          style={{
            width: '100%', padding: '16px', borderRadius: 16, border: 'none',
            background: loading ? 'rgba(255,255,255,.3)' : '#fff',
            color: loading ? 'rgba(0,0,0,.4)' : '#0F172A',
            fontSize: 15, fontWeight: 800, cursor: 'pointer',
            transition: 'all .2s', marginBottom: 14,
          }}
        >
          {loading ? '...' : '✨ Rejoindre Kudos'}
        </button>

        <button
          onClick={() => router.push('/kudos/chloe')}
          style={{
            width: '100%', padding: '13px', borderRadius: 16, border: '1px solid rgba(255,255,255,.2)',
            background: 'transparent', color: 'rgba(255,255,255,.65)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Voir la démo sans m&apos;inscrire →
        </button>
      </div>

      {/* Animations globales */}
      <style>{`
        @keyframes revealBadge {
          to { opacity: 1; transform: none; }
        }
        @keyframes revealArch {
          0% { opacity: 0; transform: scale(.72); }
          60% { transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes revealPhoto {
          to { opacity: 1; }
        }
        @keyframes avatarPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,.18); }
          50% { box-shadow: 0 0 0 10px rgba(255,255,255,.0); }
        }
        @keyframes fadeUp {
          to { opacity: 1; transform: none; }
        }
        .kudos-root * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; }
        input::placeholder { color: rgba(255,255,255,.35); }
        button:disabled { opacity: .5; cursor: not-allowed; }
      `}</style>
    </div>
  )
}
