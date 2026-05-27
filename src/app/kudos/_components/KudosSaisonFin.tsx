'use client'

import { useEffect, useState } from 'react'
import { KudosBottomNav } from './KudosBottomNav'

// ─────────────────────────────────────────────────────────────
// LIVRABLES — fetch /api/kudos/generate-livrables, fallback démo
// Voir Partie 4 du doc de vision : prompts angleMort/avatarHybride/defiLien
// ─────────────────────────────────────────────────────────────

type AngleMort = {
  blockSansLeSavoir: string  // "Tu te vois comme... mais 7/8 te décrivent comme..."
  troisSituations: string[]  // 3 contextes où l'utilisateur est déjà légitime
}

type AvatarHybride = {
  rarity: 'Commun' | 'Rare' | 'Épique' | 'Légendaire'
  emoji: string
  title: string                  // "Le Pilier Solaire" — JAMAIS de mot négatif
  subtitle?: string
  stats: { label: string; value: number }[]  // 2 stats valorisantes
  tagline: string
}

type DefiLien = {
  targetName: string
  targetInitial: string
  targetColor: string
  missionText: string
}

// Données démo (fallback si l'API n'a pas encore généré les livrables)
const ANGLE_MORT: AngleMort = {
  blockSansLeSavoir: 'Tu te vois comme **discret et en retrait**. Mais **7 personnes sur 8** te décrivent comme celui qui prend naturellement les rênes dans les moments de crise. Pour ton entourage, tu es déjà un repère — tu ne l\'as juste pas encore vu.',
  troisSituations: [
    'Quand le groupe hésite — on attend instinctivement ton avis.',
    'Quand ça chauffe — ton calme rassure plus que tu ne crois.',
    'Quand il faut trancher — les autres te font déjà confiance.',
  ],
}

const AVATAR: AvatarHybride = {
  rarity: 'Légendaire',
  emoji: '🧭',
  title: 'Le Pilier\nSolaire',
  subtitle: 'marius · Saison 2',
  stats: [
    { label: 'Autorité tranquille', value: 92 },
    { label: 'Chaleur magnétique', value: 85 },
  ],
  tagline: '"Tu rassures sans le savoir. Ta présence est ton super-pouvoir."',
}

const DEFI: DefiLien = {
  targetName: 'Marc',
  targetInitial: 'M',
  targetColor: '#80453A',
  missionText: 'Tu as répondu que Marc est ton "point de calme". Mais tu ne lui as jamais dit. Cette semaine, et si tu le lui disais ?',
}

type Props = {
  seasonId?: string  // si fourni → tente de charger les livrables IA depuis l'API
}

// ─────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────
export function KudosSaisonFin({ seasonId }: Props = {}) {
  const [angleMort, setAngleMort] = useState<AngleMort>(ANGLE_MORT)
  const [avatar, setAvatar] = useState<AvatarHybride>(AVATAR)
  const [defi, setDefi] = useState<DefiLien>(DEFI)

  useEffect(() => {
    if (!seasonId) return
    fetch(`/api/kudos/generate-livrables?season_id=${seasonId}`)
      .then((r) => r.json())
      .then((res) => {
        const liv = res.livrables
        if (!liv) return
        if (liv.angle_mort_sans_savoir) {
          setAngleMort({
            blockSansLeSavoir: liv.angle_mort_sans_savoir,
            troisSituations: Array.isArray(liv.angle_mort_situations) ? liv.angle_mort_situations : [],
          })
        }
        if (liv.avatar_title) {
          setAvatar({
            rarity: liv.avatar_rarity ?? 'Rare',
            emoji: liv.avatar_emoji ?? '✨',
            title: liv.avatar_title,
            stats: Array.isArray(liv.avatar_stats) ? liv.avatar_stats : [],
            tagline: liv.avatar_tagline ?? '',
          })
        }
        if (liv.defi_mission_text) {
          setDefi((d) => ({ ...d, missionText: liv.defi_mission_text }))
        }
      })
      .catch((err) => console.warn('[saison-fin] livrables fetch failed', err))
  }, [seasonId])

  return (
    <div style={{
      minHeight: '100dvh', background: '#08080C',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      paddingBottom: 90,
    }}>
      <HeroBanner />
      <SectionLabel icon="👁" text="Livrable 1 · Utile" />
      <BlockAngleMort data={angleMort} />
      <SectionLabel icon="🎴" text="Livrable 2 · Viral" />
      <BlockAvatarHybride data={avatar} />
      <SectionLabel icon="💚" text="Livrable 3 · Action" />
      <BlockDefiLien data={defi} />

      <KudosBottomNav active="profil" theme="dark" />

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes holoShift { 0%{background-position:0 0} 100%{background-position:200% 200%} }
        @keyframes lglow { 0%,100%{box-shadow:0 0 16px rgba(224,168,46,.5)} 50%{box-shadow:0 0 32px rgba(224,168,46,.85)} }
        @keyframes shine { to { transform: translateX(100%); } }
        button { font-family: inherit; }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────
function HeroBanner() {
  return (
    <div style={{ padding: '2rem 1.25rem 1.25rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
        width: 280, height: 280,
        background: 'radial-gradient(circle,rgba(224,168,46,.12) 0%,transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'rgba(224,168,46,.12)', border: '0.5px solid rgba(224,168,46,.3)',
        borderRadius: 999, padding: '5px 14px', fontSize: 11,
        color: '#E0A82E', fontWeight: 700, marginBottom: '1rem',
      }}>
        🎬 Fin de la saison 2 · Avril
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '0.5rem' }}>
        Ta saison est bouclée.
      </div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', lineHeight: 1.55 }}>
        14 jours, 12 qualités reçues, 18 votes. Voici ce que ça révèle de toi.
      </div>
    </div>
  )
}

function SectionLabel({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
      color: 'rgba(255,255,255,.28)', padding: '14px 1.25rem 8px',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <span style={{ fontSize: 13 }}>{icon}</span> {text}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Livrable 1 — Angle Mort
// ─────────────────────────────────────────────────────────────
function BlockAngleMort({ data }: { data: AngleMort }) {
  // Parse les ** pour render en bold
  const renderRichText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((p, i) => p.startsWith('**')
      ? <b key={i} style={{ color: '#fff' }}>{p.slice(2, -2)}</b>
      : <span key={i}>{p}</span>)
  }

  return (
    <div style={{
      margin: '0 1.25rem 16px', borderRadius: 20, overflow: 'hidden',
      border: '1px solid rgba(216,90,48,.3)',
      background: 'linear-gradient(160deg,#1a0e08,#141420)',
    }}>
      {/* Header */}
      <div style={{ padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12, borderBottom: '0.5px solid rgba(255,255,255,.08)' }}>
        <div style={{
          width: 46, height: 46, borderRadius: 13,
          background: 'linear-gradient(135deg,#D85A30,#E0A82E)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, flexShrink: 0,
        }}>
          👁
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>Ton Angle Mort</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>
            Le manuel d&apos;utilisation de toi-même
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#D85A30', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            ✨ Ce que tu dégages sans le savoir
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.6 }}>
            {renderRichText(data.blockSansLeSavoir)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#D85A30', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            🎯 Les 3 situations où tu es déjà légitime
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.6 }}>
            {data.troisSituations.map((s, i) => (
              <div key={i}>{i + 1}. {s}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Locked section */}
      <div style={{ margin: '0 16px 16px', padding: 14, borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px dashed rgba(255,255,255,.15)', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 10, lineHeight: 1.5 }}>
          🔒 La 3e partie — &laquo;&nbsp;Comment t&apos;en servir au quotidien&nbsp;&raquo; — est dans la version complète
        </div>
        <button style={{
          background: 'linear-gradient(135deg,#E0A82E,#FCD34D)', color: '#451A03',
          border: 'none', borderRadius: 11, padding: '11px 20px',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          Débloquer (ou inviter 3 amis)
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Livrable 2 — Avatar Hybride (carte virale)
// ─────────────────────────────────────────────────────────────
function BlockAvatarHybride({ data }: { data: AvatarHybride }) {
  const [bursts, setBursts] = useState<{ id: number; cx: number; cy: number; a: number; d: number; e: string; size: number }[]>([])

  function shareBurst(e: React.MouseEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const emojis = ['✨', '🧭', '⭐', '💫']
    const newBursts = Array.from({ length: 14 }, (_, i) => ({
      id: Date.now() + i,
      cx, cy,
      a: Math.random() * Math.PI * 2,
      d: 40 + Math.random() * 60,
      e: emojis[Math.floor(Math.random() * emojis.length)],
      size: 14 + Math.random() * 10,
    }))
    setBursts(newBursts)
    setTimeout(() => setBursts([]), 800)

    // En prod : navigator.share() avec image OG générée
    if (navigator.share) {
      navigator.share({
        title: 'Ma carte Kudos',
        text: `Je suis ${data.title.replace('\n', ' ')} sur Kudos`,
        url: window.location.origin,
      }).catch(() => {})
    }
  }

  return (
    <>
      <div style={{ margin: '0 1.25rem 12px', perspective: 1000 }}>
        <div style={{
          borderRadius: 22, overflow: 'hidden', position: 'relative',
          border: '1px solid rgba(255,255,255,.15)',
          aspectRatio: '3/4', maxHeight: 420,
        }}>
          {/* Background */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: 'linear-gradient(160deg,#1a1145,#3d2a8a 45%,#6b4db8)',
          }} />
          {/* Holo overlay */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2,
            background: 'linear-gradient(115deg,transparent 20%,rgba(255,0,200,.18) 35%,rgba(0,255,200,.18) 50%,rgba(255,200,0,.18) 65%,transparent 80%)',
            backgroundSize: '200% 200%',
            animation: 'holoShift 4s linear infinite',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }} />
          {/* Shine */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 3,
            background: 'linear-gradient(118deg,transparent 40%,rgba(255,255,255,.2) 50%,transparent 60%)',
            transform: 'translateX(-100%)',
            animation: 'shine 2.5s ease infinite 1s',
            pointerEvents: 'none',
          }} />

          {/* Content */}
          <div style={{
            position: 'relative', zIndex: 4, padding: '1.5rem', height: '100%',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase',
                background: 'linear-gradient(135deg,#E0A82E,#FCD34D)', color: '#451A03',
                padding: '3px 10px', borderRadius: 999,
                animation: 'lglow 2.5s infinite',
              }}>
                ★ {data.rarity}
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,.5)' }}>kudos.</span>
            </div>

            <div style={{ fontSize: 80, textAlign: 'center', margin: '1.5rem 0 1rem', animation: 'float 3.5s ease-in-out infinite' }}>
              {data.emoji}
            </div>
            {data.subtitle && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', textAlign: 'center', marginBottom: 4 }}>
                {data.subtitle}
              </div>
            )}
            <div style={{
              fontSize: 28, fontWeight: 800, color: '#fff', textAlign: 'center',
              lineHeight: 1.1, letterSpacing: -0.5,
              textShadow: '0 2px 12px rgba(0,0,0,.4)',
              marginBottom: '1rem', whiteSpace: 'pre-line',
            }}>
              {data.title}
            </div>

            <div style={{ marginTop: 'auto' }}>
              {data.stats.map((s, i) => (
                <div key={i} style={{ marginBottom: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>{s.label}</span>
                    <span style={{ color: '#fff', fontWeight: 800 }}>{s.value}%</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(0,0,0,.3)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 999, width: `${s.value}%`,
                      background: 'linear-gradient(90deg,#FCD34D,#fff)',
                    }} />
                  </div>
                </div>
              ))}
              <div style={{
                fontSize: 12, color: 'rgba(255,255,255,.65)',
                textAlign: 'center', fontStyle: 'italic',
                marginTop: 14, lineHeight: 1.4,
              }}>
                {data.tagline}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 9, margin: '0 1.25rem 16px' }}>
        <button onClick={shareBurst} style={{
          flex: 1, padding: 13, borderRadius: 13, border: 'none',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          background: 'linear-gradient(135deg,#8B5CF6,#A78BFA)', color: '#fff',
        }}>
          ↗ Partager ma carte
        </button>
        <button style={{
          flex: 1, padding: 13, borderRadius: 13,
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          background: 'rgba(255,255,255,.08)', color: '#fff',
          border: '0.5px solid rgba(255,255,255,.08)',
        }}>
          ⬇ Garder
        </button>
      </div>

      {/* Burst particles */}
      {bursts.map((b) => (
        <div key={b.id} style={{
          position: 'fixed', left: b.cx, top: b.cy, zIndex: 999, pointerEvents: 'none',
          fontSize: b.size, opacity: 0,
          transform: `translate(${Math.cos(b.a) * b.d}px, ${Math.sin(b.a) * b.d}px) scale(0)`,
          transition: 'all .7s cubic-bezier(.2,.8,.3,1)',
          animation: 'burstFly .7s cubic-bezier(.2,.8,.3,1) forwards',
        }}>
          {b.e}
        </div>
      ))}
      <style>{`
        @keyframes burstFly {
          0% { opacity: 1; transform: translate(0,0) scale(1); }
          100% { opacity: 0; transform: var(--end-tr) scale(0); }
        }
      `}</style>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// Livrable 3 — Défi de Lien
// ─────────────────────────────────────────────────────────────
function BlockDefiLien({ data }: { data: DefiLien }) {
  return (
    <div style={{
      margin: '0 1.25rem 1.5rem', borderRadius: 20, overflow: 'hidden',
      border: '1px solid rgba(99,153,34,.3)',
      background: 'linear-gradient(160deg,#0a1605,#141420)',
    }}>
      {/* Header */}
      <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 13,
          background: 'linear-gradient(135deg,#639922,#7AB832)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, flexShrink: 0,
        }}>
          💚
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Ton Défi de Lien</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>
            Une belle chose à faire sortir de toi
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        {/* Mission */}
        <div style={{
          background: 'rgba(99,153,34,.1)',
          border: '0.5px solid rgba(99,153,34,.25)',
          borderRadius: 14, padding: 14, marginBottom: 14,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 1,
            textTransform: 'uppercase', color: '#C0DD97', marginBottom: 7,
          }}>
            🎯 Ta mission cette saison
          </div>
          <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.5, fontWeight: 500 }}>
            {data.missionText}
          </div>
        </div>

        {/* Target person */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,.04)', borderRadius: 12,
          padding: '10px 12px', marginBottom: 14,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: data.targetColor, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: '#fff', fontSize: 14,
          }}>
            {data.targetInitial}
          </div>
          <div style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>
            Avec <b style={{ color: '#fff' }}>{data.targetName}</b> · Kudos t&apos;aide à trouver les mots
          </div>
        </div>

        {/* CTA */}
        <button style={{
          width: '100%', background: 'linear-gradient(135deg,#639922,#7AB832)',
          color: '#fff', border: 'none', borderRadius: 13, padding: 14,
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 4px 16px rgba(99,153,34,.25)',
        }}>
          💬 Relever le défi avec Kudos
        </button>
      </div>
    </div>
  )
}
