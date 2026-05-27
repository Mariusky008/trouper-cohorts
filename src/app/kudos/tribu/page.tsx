'use client'

import { useEffect, useState } from 'react'
import { KudosBottomNav } from '../_components/KudosBottomNav'

type LiveTribe = {
  tribeId: string
  status: 'forming' | 'proposed' | 'sealed' | 'met'
  city: string
  myArchetype: string
  archetypeMix: string[]
  proposedDate: string | null
  proposedPlace: string | null
  members: { userId: string; archetypeId: string; name: string | null; avatarUrl: string | null }[]
}

// ── Types ──────────────────────────────────────────────────────────────────
type TribeStatus = 'locked' | 'forming' | 'proposed' | 'sealed'

type MysteryMember = {
  archetype: string
  archetypeEmoji: string
  role: string
  isMe?: boolean
  searching?: boolean
}

type RevealedMember = {
  name: string
  isMe?: boolean
  surnom: string
  archetype: string
  archetypeEmoji: string
  avatarColor?: string
  avatarUrl?: string
}

// ── Données démo ────────────────────────────────────────────────────────────
const MYSTERY_MEMBERS: MysteryMember[] = [
  { archetype: 'Le Sage',      archetypeEmoji: '🧭', role: 'apporte le recul',       isMe: true },
  { archetype: 'Le Créateur',  archetypeEmoji: '🎨', role: 'apporte les idées' },
  { archetype: "L'Audacieux",  archetypeEmoji: '🔥', role: 'ose, lance les choses' },
  { archetype: 'Le Pilier',    archetypeEmoji: '⚓', role: 'stabilise le groupe',     searching: true },
  { archetype: 'Le Liant',     archetypeEmoji: '🤝', role: 'crée du lien entre tous', searching: true },
]

const REVEALED_MEMBERS: RevealedMember[] = [
  { name: 'Marius (toi)', isMe: true, surnom: 'La Constellation', archetype: 'Sage',      archetypeEmoji: '🧭', avatarColor: '#606C38' },
  { name: 'Léa',                       surnom: "L'Étincelle",      archetype: 'Créateur',  archetypeEmoji: '🎨', avatarUrl: 'https://i.pravatar.cc/80?img=45' },
  { name: 'Thomas',                     surnom: 'Le Volcan',        archetype: 'Audacieux', archetypeEmoji: '🔥', avatarUrl: 'https://i.pravatar.cc/80?img=12' },
  { name: 'Sophie',                     surnom: "L'Ancre",          archetype: 'Pilier',    archetypeEmoji: '⚓', avatarUrl: 'https://i.pravatar.cc/80?img=32' },
  { name: 'Karim',                      surnom: 'Le Pont',          archetype: 'Liant',     archetypeEmoji: '🤝', avatarUrl: 'https://i.pravatar.cc/80?img=20' },
]

// ── Composant principal ─────────────────────────────────────────────────────
export default function TribuPage() {
  // demoStatus = état affiché ; live = données réelles si user_id en localStorage
  const [demoStatus, setDemoStatus] = useState<TribeStatus>('forming')
  const [live, setLive] = useState<LiveTribe | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const uid = typeof window !== 'undefined' ? localStorage.getItem('kudos_user_id') : null
    setUserId(uid)
    if (!uid) return

    fetch(`/api/kudos/tribu?user_id=${uid}`)
      .then((r) => r.json())
      .then((res) => {
        if (res?.tribe) {
          setLive(res.tribe as LiveTribe)
          setDemoStatus(res.tribe.status as TribeStatus)
        } else if (res?.state === 'locked') {
          setDemoStatus('locked')
        }
      })
      .catch((err) => console.warn('[tribu] fetch failed', err))
  }, [])

  return (
    <div style={{
      minHeight: '100dvh', background: '#08080C',
      display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
      {/* Dev switcher : visible uniquement si pas de user_id (mode démo) */}
      {!userId && (
        <div style={{ display: 'flex', gap: 6, padding: '12px 14px 0', flexShrink: 0 }}>
          {(['locked','forming','proposed','sealed'] as TribeStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setDemoStatus(s)}
              style={{
                padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                border: '1px solid rgba(255,255,255,.15)',
                background: demoStatus === s ? 'rgba(139,92,246,.3)' : 'transparent',
                color: demoStatus === s ? '#fff' : 'rgba(255,255,255,.4)',
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {demoStatus === 'locked'   && <StateLocked />}
        {demoStatus === 'forming'  && <StateForming live={live} />}
        {demoStatus === 'proposed' && <StateProposed live={live} userId={userId} />}
        {demoStatus === 'sealed'   && <StateSealed live={live} userId={userId} />}
      </div>

      <KudosBottomNav active="tribu" theme="dark" />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes glow  { 0%,100%{box-shadow:0 0 16px rgba(139,92,246,.3)} 50%{box-shadow:0 0 30px rgba(139,92,246,.6)} }
        @keyframes shine { to{transform:translateX(100%)} }
        @keyframes fadeUp{ from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes reveal{ 0%{opacity:0;transform:scale(.8) rotate(-6deg)} 60%{transform:scale(1.05) rotate(2deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }
        button { font-family: inherit; }
      `}</style>
    </div>
  )
}

// ── État 1 : Verrouillé ─────────────────────────────────────────────────────
function StateLocked() {
  const steps = [
    { done: true,  label: 'Tu as répondu à tes questions' },
    { done: true,  label: '3 proches ont répondu sur toi' },
    { done: false, label: 'Termine ta 1re saison (plus que 6 jours)', num: '3' },
  ]
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'80vh', padding:'2rem 1.5rem', textAlign:'center', position:'relative' }}>
      <div style={{ position:'absolute', top:'25%', left:'50%', transform:'translateX(-50%)', width:260, height:260, background:'radial-gradient(circle,rgba(139,92,246,.12) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ fontSize:56, marginBottom:'1.25rem', opacity:.85 }}>🔒</div>
      <div style={{ fontSize:23, fontWeight:800, color:'#fff', lineHeight:1.2, marginBottom:'.875rem' }}>
        Ta Tribu se débloque<br />à la fin de ta 1re saison
      </div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,.5)', lineHeight:1.6, marginBottom:'2rem', maxWidth:300 }}>
        Kudos a besoin de connaître ton archétype pour composer ton équipage parfait.
      </div>
      <div style={{ width:'100%', maxWidth:340, display:'flex', flexDirection:'column', gap:10 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background:'#141420', border:'0.5px solid rgba(255,255,255,.08)', borderRadius:14, padding:'13px 15px', textAlign:'left' }}>
            <div style={{ width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0, background: s.done ? 'rgba(99,153,34,.2)' : 'rgba(255,255,255,.07)', color: s.done ? '#C0DD97' : 'rgba(255,255,255,.3)' }}>
              {s.done ? '✓' : s.num}
            </div>
            <div style={{ fontSize:13, color: s.done ? '#fff' : 'rgba(255,255,255,.4)' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Helper : map archetype_id ('pilier', 'sage'...) → données d'affichage
const ARCHETYPE_DISPLAY: Record<string, { emoji: string; label: string; role: string }> = {
  pilier:    { emoji: '⚓', label: 'Le Pilier',    role: 'stabilise le groupe' },
  createur:  { emoji: '🎨', label: 'Le Créateur',  role: 'apporte les idées' },
  audacieux: { emoji: '🔥', label: "L'Audacieux",  role: 'ose, lance les choses' },
  analyste:  { emoji: '🔍', label: "L'Analyste",   role: 'pose les bonnes questions' },
  liant:     { emoji: '🤝', label: 'Le Liant',     role: 'crée du lien entre tous' },
  sage:      { emoji: '🧭', label: 'Le Sage',      role: 'apporte le recul' },
}

// ── État 2 : En formation ───────────────────────────────────────────────────
function StateForming({ live }: { live: LiveTribe | null }) {
  // Si live → on construit la liste depuis les archétypes du mix réel
  const mysteryMembers: MysteryMember[] = live
    ? live.archetypeMix.map((aid) => {
        const display = ARCHETYPE_DISPLAY[aid] ?? { emoji: '✨', label: aid, role: '' }
        return {
          archetype: display.label,
          archetypeEmoji: display.emoji,
          role: display.role,
          isMe: aid === live.myArchetype,
        }
      })
    : MYSTERY_MEMBERS

  const found = mysteryMembers.filter((m) => !m.searching).length
  const total = Math.max(mysteryMembers.length, 5)  // jauge sur 5 même si pool < 5
  const pct = found / total
  const circumference = 2 * Math.PI * 54
  const offset = circumference * (1 - pct)

  return (
    <div>
      <div style={{ padding:'1.25rem 1.25rem .5rem' }}>
        <div style={{ fontSize:24, fontWeight:800, color:'#fff', letterSpacing:-.5, display:'flex', alignItems:'center', gap:9 }}>
          👥 Ta Tribu
        </div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginTop:3, lineHeight:1.4 }}>
          Le lien que l'algorithme prépare, la vraie vie l'accomplit
        </div>
      </div>

      <div style={{ padding:'1rem 1.25rem 2rem', textAlign:'center' }}>
        {/* Jauge circulaire */}
        <div style={{ position:'relative', width:200, height:200, margin:'1.5rem auto' }}>
          <svg width="200" height="200" viewBox="0 0 120 120" style={{ transform:'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke="url(#grd)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition:'stroke-dashoffset 1.5s cubic-bezier(.34,1.56,.64,1)' }}
            />
            <defs>
              <linearGradient id="grd" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8B5CF6" /><stop offset="1" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <div style={{ fontSize:44, fontWeight:800, color:'#fff', lineHeight:1 }}>{found}/{total}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.45)', marginTop:2 }}>membres trouvés</div>
          </div>
        </div>

        <div style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:'.5rem' }}>Ton équipage se forme...</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,.5)', lineHeight:1.55, marginBottom:'1.5rem' }}>
          Kudos compose une tribu équilibrée à <b style={{ color:'#fff' }}>{live?.city ?? 'Dax'}</b>. Pas 5 personnes identiques — 5 caractères qui s'emboîtent.
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {mysteryMembers.map((m, i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:12,
              background: m.searching ? '#141420' : 'rgba(139,92,246,.06)',
              border: m.searching ? '0.5px solid rgba(255,255,255,.08)' : '0.5px solid rgba(139,92,246,.3)',
              borderRadius:14, padding:'12px 14px',
            }}>
              <div style={{ width:42, height:42, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0, background: m.searching ? 'rgba(255,255,255,.05)' : 'linear-gradient(135deg,#1a1040,#3d2a8a)', border: m.searching ? '1px dashed rgba(255,255,255,.15)' : 'none' }}>
                {m.searching ? <span style={{ fontSize:16, color:'rgba(255,255,255,.3)' }}>···</span> : m.archetypeEmoji}
              </div>
              <div style={{ flex:1, textAlign:'left' }}>
                {m.searching
                  ? <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', fontStyle:'italic', display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:'#D85A30', animation:'pulse 1.2s infinite', display:'inline-block' }} />
                      Kudos cherche {m.archetype === 'Le Pilier' ? 'un Pilier' : 'un Liant'}...
                    </div>
                  : <>
                      <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{m.archetype}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,.45)', marginTop:1 }}>{m.role}</div>
                    </>
                }
              </div>
              {m.isMe && <span style={{ fontSize:9, fontWeight:700, background:'#8B5CF6', color:'#fff', padding:'2px 7px', borderRadius:999 }}>Toi</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── État 3 : Proposée ───────────────────────────────────────────────────────
function StateProposed({ live, userId }: { live: LiveTribe | null; userId: string | null }) {
  const [accepted, setAccepted] = useState(false)
  const [posting, setPosting] = useState(false)

  async function handleAccept() {
    if (accepted || posting) return
    if (live && userId) {
      setPosting(true)
      try {
        await fetch('/api/kudos/tribu/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, tribe_id: live.tribeId, action: 'accept' }),
        })
      } catch (err) {
        console.warn('[tribu] accept failed', err)
      } finally {
        setPosting(false)
      }
    }
    setAccepted(true)
  }

  // Format date/lieu réels si dispo
  const proposedPlace = live?.proposedPlace ?? 'Café Popey · Dax centre'
  const proposedDate = live?.proposedDate
    ? new Date(live.proposedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : 'Samedi 7 juin · 14h00'

  return (
    <div>
      <div style={{ padding:'1.25rem 1.25rem .5rem' }}>
        <div style={{ fontSize:24, fontWeight:800, color:'#fff', letterSpacing:-.5 }}>👥 Ta Tribu</div>
      </div>
      <div style={{ padding:'1rem 1.25rem 2rem' }}>
        {/* Bannière */}
        <div style={{ background:'linear-gradient(135deg,#1a1040,#3d2a8a)', borderRadius:18, padding:'1.25rem', textAlign:'center', marginBottom:'1.25rem', position:'relative', overflow:'hidden', animation:'glow 3s ease-in-out infinite' }}>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(118deg,transparent 40%,rgba(255,255,255,.15) 50%,transparent 60%)', transform:'translateX(-100%)', animation:'shine 2.8s ease infinite 1s' }} />
          <div style={{ fontSize:44, marginBottom:8, animation:'float 3s ease-in-out infinite' }}>🎴</div>
          <div style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:5 }}>Ton équipage est complet !</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.65)', lineHeight:1.5 }}>5 profils qui s'emboîtent. Vos caractères se complètent parfaitement.</div>
        </div>

        {/* Mix archétypes */}
        <div style={{ display:'flex', gap:7, marginBottom:'1.25rem', flexWrap:'wrap', justifyContent:'center' }}>
          {[['🧭','Sage'],['🎨','Créateur'],['🔥','Audacieux'],['⚓','Pilier'],['🤝','Liant']].map(([e,l]) => (
            <span key={l} style={{ display:'flex', alignItems:'center', gap:5, background:'#1C1C2A', border:'0.5px solid rgba(255,255,255,.08)', borderRadius:999, padding:'6px 12px', fontSize:12, color:'#fff' }}>
              {e} {l}
            </span>
          ))}
        </div>

        {/* Détails */}
        <div style={{ background:'#141420', border:'0.5px solid rgba(255,255,255,.08)', borderRadius:16, overflow:'hidden', marginBottom:'1.25rem' }}>
          {[
            { icon:'📍', label:'Lieu',   val: proposedPlace },
            { icon:'📅', label:'Quand',  val: proposedDate },
            { icon:'👥', label:'Qui',    val:'5 personnes · identités révélées si tu acceptes' },
          ].map((row, i, arr) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 15px', borderBottom: i < arr.length - 1 ? '0.5px solid rgba(255,255,255,.08)' : 'none' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(99,153,34,.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>
                {row.icon}
              </div>
              <div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:.5 }}>{row.label}</div>
                <div style={{ fontSize:14, fontWeight:600, color:'#fff', marginTop:1 }}>{row.val}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleAccept}
          disabled={posting}
          style={{ width:'100%', background:'linear-gradient(135deg,#639922,#7AB832)', color:'#fff', border:'none', borderRadius:14, padding:16, fontSize:16, fontWeight:700, cursor: posting ? 'wait' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:9, boxShadow:'0 4px 20px rgba(99,153,34,.3)', marginBottom:10, opacity: accepted ? .7 : 1 }}
        >
          {accepted ? '✓ Aventure acceptée !' : posting ? '...' : '✨ J\'accepte l\'aventure'}
        </button>
        <div style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,.45)' }}>
          ⏱ 2/5 ont déjà accepté · plus que 3 places à confirmer
        </div>
      </div>
    </div>
  )
}

// ── État 4 : Scellée ────────────────────────────────────────────────────────
function StateSealed({ live, userId }: { live: LiveTribe | null; userId: string | null }) {
  const [chatOpen, setChatOpen] = useState(false)

  // Si live → construire les membres révélés depuis la DB, sinon démo
  const revealedMembers: RevealedMember[] = live && live.members.length > 0
    ? live.members.map((m) => {
        const display = ARCHETYPE_DISPLAY[m.archetypeId] ?? { emoji: '✨', label: m.archetypeId, role: '' }
        const isMe = m.userId === userId
        return {
          name: isMe ? `${m.name ?? 'Toi'} (toi)` : (m.name ?? 'Membre'),
          isMe,
          surnom: '',
          archetype: display.label.replace(/^Le |^La |^L'/, ''),
          archetypeEmoji: display.emoji,
          avatarColor: '#606C38',
          avatarUrl: m.avatarUrl ?? undefined,
        }
      })
    : REVEALED_MEMBERS

  const cafeName = live?.proposedPlace?.split(' · ')[0] ?? 'Café Popey · Dax'
  const cafeWhen = live?.proposedDate
    ? new Date(live.proposedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : 'Samedi 7 juin · 14h00'

  return (
    <div>
      <div style={{ padding:'1.25rem 1.25rem .5rem' }}>
        <div style={{ fontSize:24, fontWeight:800, color:'#C0DD97', letterSpacing:-.5 }}>👥 Ta Tribu</div>
      </div>
      <div style={{ padding:'1rem 1.25rem 2rem' }}>
        <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
          <div style={{ fontSize:50, marginBottom:8, animation:'reveal .8s cubic-bezier(.34,1.56,.64,1)' }}>✨</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>Tribu scellée !</div>
          <div style={{ fontSize:13, color:'#C0DD97' }}>Vos masques sont tombés. Voici ton équipage.</div>
        </div>

        <div style={{ background:'linear-gradient(135deg,#7A2D0F,#C2410C)', borderRadius:16, padding:'14px 16px', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:13 }}>
          <span style={{ fontSize:30 }}>☕</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>{cafeName}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.7)', marginTop:2 }}>{cafeWhen}</div>
          </div>
          <span style={{ fontSize:9, fontWeight:700, background:'rgba(255,255,255,.2)', color:'#fff', padding:'3px 8px', borderRadius:999 }}>1er café offert</span>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:'1.25rem' }}>
          {revealedMembers.map((m, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background:'#141420', border:'0.5px solid rgba(255,255,255,.08)', borderRadius:14, padding:'12px 14px', animation:`fadeUp .5s ease ${i * 0.1 + 0.1}s forwards`, opacity:0 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#fff', fontSize:16, border:'2px solid rgba(255,255,255,.15)', background: m.avatarUrl ? undefined : m.avatarColor, backgroundImage: m.avatarUrl ? `url(${m.avatarUrl})` : undefined, backgroundSize:'cover' }}>
                {!m.avatarUrl && m.name[0]}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{m.name}</div>
                {m.surnom && <div style={{ fontSize:11, color:'rgba(255,255,255,.45)' }}>{m.surnom}</div>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, padding:'4px 9px', borderRadius:999, background:'#1C1C2A', color:'#fff' }}>
                {m.archetypeEmoji} {m.archetype}
              </div>
            </div>
          ))}
        </div>

        {chatOpen && live && userId
          ? <TribuChat tribeId={live.tribeId} userId={userId} onClose={() => setChatOpen(false)} />
          : (
            <button
              onClick={() => setChatOpen(true)}
              style={{ width:'100%', background:'linear-gradient(135deg,#8B5CF6,#A78BFA)', color:'#fff', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:9 }}
            >
              💬 Ouvrir le chat de la Tribu
            </button>
          )
        }
        <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', textAlign:'center', lineHeight:1.5, display:'flex', alignItems:'center', gap:5, justifyContent:'center', marginTop: 9 }}>
          🛡️ Lieu public · groupe de 5 · tu peux quitter ou signaler à tout moment
        </div>
      </div>
    </div>
  )
}

// ── Chat de tribu (état scellé) ─────────────────────────────────────────────
type ChatMessage = {
  id: string
  text: string
  created_at: string
  sender_id: string
  sender?: { name?: string; avatar_url?: string } | { name?: string; avatar_url?: string }[] | null
}

function TribuChat({ tribeId, userId, onClose }: { tribeId: string; userId: string; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  async function loadMessages() {
    try {
      const r = await fetch(`/api/kudos/tribu/chat?tribe_id=${tribeId}&user_id=${userId}`)
      const data = await r.json()
      setMessages(data.messages ?? [])
    } catch (err) {
      console.warn('[chat] load failed', err)
    }
  }

  useEffect(() => {
    loadMessages()
    const interval = setInterval(loadMessages, 4000)  // poll simple — Phase 5: realtime Supabase
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tribeId])

  async function send() {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    try {
      const r = await fetch('/api/kudos/tribu/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, tribe_id: tribeId, text }),
      })
      if (r.ok) {
        setDraft('')
        loadMessages()
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ background:'#141420', border:'0.5px solid rgba(255,255,255,.08)', borderRadius:16, padding:14, marginBottom:9 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>💬 Chat de la Tribu</div>
        <button onClick={onClose} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,.4)', cursor:'pointer', fontSize:14 }}>✕</button>
      </div>

      <div style={{ maxHeight: 260, overflowY:'auto', display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
        {messages.length === 0
          ? <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', fontStyle:'italic', padding:'12px 0', textAlign:'center' }}>Premier mot ? Lance la conversation.</div>
          : messages.map((m) => {
              const isMe = m.sender_id === userId
              const sender = Array.isArray(m.sender) ? m.sender[0] : m.sender
              return (
                <div key={m.id} style={{ display:'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap:6, alignItems:'flex-end' }}>
                  <div style={{
                    maxWidth:'75%',
                    background: isMe ? 'linear-gradient(135deg,#8B5CF6,#A78BFA)' : 'rgba(255,255,255,.06)',
                    color:'#fff', padding:'8px 12px', borderRadius:14,
                    borderTopRightRadius: isMe ? 4 : 14,
                    borderTopLeftRadius:  isMe ? 14 : 4,
                    fontSize:13, lineHeight:1.4,
                  }}>
                    {!isMe && sender?.name && (
                      <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.55)', marginBottom:2 }}>{sender.name}</div>
                    )}
                    {m.text}
                  </div>
                </div>
              )
            })
        }
      </div>

      <div style={{ display:'flex', gap:8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send() }}
          placeholder="Écris à la tribu..."
          style={{ flex:1, background:'rgba(255,255,255,.06)', border:'0.5px solid rgba(255,255,255,.08)', borderRadius:10, color:'#fff', fontSize:13, padding:'10px 12px', outline:'none', fontFamily:'inherit' }}
        />
        <button
          onClick={send}
          disabled={sending || draft.trim().length === 0}
          style={{ background:'linear-gradient(135deg,#8B5CF6,#A78BFA)', color:'#fff', border:'none', borderRadius:10, padding:'0 14px', fontSize:13, fontWeight:700, cursor: sending ? 'wait' : 'pointer', opacity: draft.trim().length === 0 ? 0.4 : 1 }}
        >
          ↗
        </button>
      </div>
    </div>
  )
}
