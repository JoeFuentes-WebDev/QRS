'use client'

import { useState } from 'react'

const STORAGE_KEY = 'qrs_swipe_onboarded'

type Props = {
  onDismiss: () => void
}

export function OnboardingScreen({ onDismiss }: Props) {
  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    onDismiss()
  }

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center cursor-pointer"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={handleDismiss}
    >
      {/* UP — Save */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
          <line x1="16" y1="38" x2="16" y2="4" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <polyline points="6,14 16,4 26,14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
        <span className="text-white font-bold text-sm tracking-wide">SAVE 📌</span>
      </div>

      {/* LEFT — Skip */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
        <svg width="40" height="32" viewBox="0 0 40 32" fill="none">
          <line x1="38" y1="16" x2="4" y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <polyline points="14,6 4,16 14,26" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
        <span className="text-white font-bold text-sm tracking-wide">SKIP</span>
      </div>

      {/* RIGHT — Buy */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
        <svg width="40" height="32" viewBox="0 0 40 32" fill="none">
          <line x1="2" y1="16" x2="36" y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <polyline points="26,6 36,16 26,26" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
        <span className="text-white font-bold text-sm tracking-wide">BUY ♥</span>
      </div>

      {/* Center — tap hint */}
      <div className="flex flex-col items-center gap-3 mt-8">
        <div className="w-16 h-16 rounded-full border-2 border-white/60 flex items-center justify-center">
          <span className="text-white/60 text-2xl">👆</span>
        </div>
        <span className="text-white/60 text-xs tracking-wide">tap anywhere to start</span>
      </div>
    </div>
  )
}

export function useOnboarding() {
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem(STORAGE_KEY)
  })

  return { show, dismiss: () => setShow(false) }
}