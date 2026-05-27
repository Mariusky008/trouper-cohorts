'use client'

import { useEffect, useState } from 'react'
import { KudosMyProfile } from './KudosMyProfile'
import { KudosOnboardingReflexif, type OnboardingAnswer } from './KudosOnboardingReflexif'

const LS_KEY = 'kudos_onboarding_done'
const LS_USER_ID = 'kudos_user_id'

export function KudosProfilGate() {
  const [status, setStatus] = useState<'loading' | 'onboarding' | 'done'>('loading')

  useEffect(() => {
    const done = localStorage.getItem(LS_KEY)
    setStatus(done ? 'done' : 'onboarding')
  }, [])

  async function handleOnboardingComplete(answers: OnboardingAnswer[]) {
    const userId = localStorage.getItem(LS_USER_ID)

    // Si on a un user_id réel → on POST vers l'API qui persiste + calcule le portrait
    if (userId) {
      try {
        await fetch('/api/kudos/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, answers }),
        })
      } catch (err) {
        console.warn('onboarding save failed, falling back to localStorage', err)
      }
    } else {
      console.log('[demo mode] onboarding answers', answers)
    }

    localStorage.setItem(LS_KEY, '1')
    setStatus('done')
  }

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100dvh', background: '#08080C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(139,92,246,.3)', borderTopColor: '#8B5CF6', animation: 'spin .7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (status === 'onboarding') {
    return <KudosOnboardingReflexif onComplete={handleOnboardingComplete} />
  }

  return <KudosMyProfile />
}
