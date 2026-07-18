'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'

const steps = [
  {
    num: '01',
    title: 'Sign up in 5 minutes',
    body: 'Go to my-qrs.co, enter your store name and email, connect your Stripe account to receive payments. That\'s it — your store is live.',
    video: '/videos/scene1.mp4',
  },
  {
    num: '02',
    title: 'Add your products',
    body: 'Snap a photo of anything you want to sell. AI reads the photo and fills in the name, description, and tags automatically. Set your price and you\'re done. No SKUs, no inventory system.',
    video: '/videos/scene2.mp4',
  },
  {
    num: '03',
    title: 'Get your QR code',
    body: 'Download your postcard — your store name, your QR code, print-ready. Leave it at your stall, tape it to your table, or hand it to anyone who asks.',
    video: '/videos/scene3.mp4',
  },
  {
    num: '04',
    title: 'Customers buy on their own',
    body: 'Customers scan, browse, and check out — no account needed, no app to download. The sale happens while you\'re busy with another customer.',
    video: '/videos/scene4.mp4',
  },
  {
    num: '05',
    title: 'You get paid. You ship.',
    body: 'The moment someone buys, you get an email notification with the order details. Payment goes straight to your Stripe account. Want a text too? Add your phone number in Settings. Pack it up, drop it at USPS. Your store keeps selling while you focus on making.',
    video: '/videos/scene5.mp4',
  },
]

export function HowItWorksContent() {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef<number | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (delta > 50) setCurrent(c => Math.min(c + 1, steps.length - 1))
    if (delta < -50) setCurrent(c => Math.max(c - 1, 0))
    touchStartX.current = null
  }

  return (
    <>
      <PageViewTracker event="howitworks.viewed" includeUtm />
      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 bg-[#FFFAF7]/90 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <Link href="/" className="text-[22px] font-black text-[#FF6B35] tracking-tight">
            QR<span className="text-[#1A1A1A]">S</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="text-sm font-bold text-[#1A1A1A] px-4 py-2 rounded-full border-2 border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-bold text-white bg-[#FF6B35] px-4 py-2 rounded-full hover:bg-[#E0501A] transition-colors"
            >
              Create your store
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Header ─── */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-4">
        <p className="text-xs font-bold tracking-widest uppercase text-[#FF6B35] mb-3">How it works</p>
        <h1 className="text-[clamp(32px,5vw,52px)] font-black tracking-tight leading-[1.05] text-[#1A1A1A] mb-4">
          From sign-up to store<br />in 5 minutes.
        </h1>
        <p className="text-lg text-[#555550] leading-relaxed max-w-xl">
          No developer needed. No monthly plan. Just your products and a QR code.
        </p>
      </div>

      {/* ─── Mobile: swipeable carousel ─── */}
      <div className="md:hidden px-6 pt-10 pb-16">
        {/* Progress dots */}
        <div className="flex gap-2 mb-6">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === current ? 'bg-[#FF6B35] w-8' : 'bg-orange-200 w-4'
              }`}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        {/* Swipeable card */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative overflow-hidden"
        >
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {steps.map((step, i) => (
              <div key={i} className="min-w-full">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-black mb-6">
                  <video
                    src={step.video}
                    autoPlay={i === current}
                    muted
                    playsInline
                    loop
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[11px] font-black tracking-widest uppercase text-[#FF6B35] bg-orange-50 px-2.5 py-1 rounded-full">
                  Step {step.num}
                </span>
                <h2 className="text-2xl font-black text-[#1A1A1A] mt-3 mb-2">{step.title}</h2>
                <p className="text-base text-[#555550] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Prev / Next */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={() => setCurrent(c => Math.max(c - 1, 0))}
            disabled={current === 0}
            className="flex-1 py-3 rounded-full border-2 border-[#1A1A1A] text-sm font-bold text-[#1A1A1A] disabled:opacity-30 transition-opacity"
          >
            ← Previous
          </button>
          <button
            onClick={() => setCurrent(c => Math.min(c + 1, steps.length - 1))}
            disabled={current === steps.length - 1}
            className="flex-1 py-3 rounded-full bg-[#FF6B35] text-sm font-bold text-white disabled:opacity-30 transition-opacity"
          >
            Next →
          </button>
        </div>
      </div>

      {/* ─── Desktop: alternating stacked layout ─── */}
      <div className="hidden md:block max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="flex flex-col gap-24">
          {steps.map((step, i) => {
            const isEven = i % 2 === 0
            return (
              <div
                key={i}
                className={`grid grid-cols-2 gap-16 items-center ${!isEven ? 'direction-rtl' : ''}`}
              >
                {/* Video */}
                <div className={`${!isEven ? 'order-last' : ''}`}>
                  <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-black shadow-[0_24px_64px_rgba(0,0,0,0.12)]">
                    <video
                      src={step.video}
                      autoPlay
                      muted
                      playsInline
                      loop
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Copy */}
                <div className={`${!isEven ? 'order-first' : ''}`}>
                  <span className="text-[11px] font-black tracking-widest uppercase text-[#FF6B35] bg-orange-50 px-2.5 py-1 rounded-full">
                    Step {step.num}
                  </span>
                  <h2 className="text-[clamp(28px,3vw,40px)] font-black tracking-tight leading-[1.1] text-[#1A1A1A] mt-4 mb-4">
                    {step.title}
                  </h2>
                  <p className="text-lg text-[#555550] leading-relaxed">{step.body}</p>

                  {/* Step connector line */}
                  {i < steps.length - 1 && (
                    <div className="mt-8 flex items-center gap-3">
                      <div className="w-8 h-0.5 bg-orange-200" />
                      <span className="text-xs text-[#555550]">Next: {steps[i + 1].title}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── CTA ─── */}
      <div className="bg-[#FF6B35] px-6 py-16 text-center">
        <h2 className="text-[clamp(28px,4vw,44px)] font-black tracking-tight text-white mb-4">
          Ready to start selling?
        </h2>
        <p className="text-white/80 text-lg mb-8 max-w-md mx-auto">
          Set up your store in 5 minutes. No credit card required.
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 text-base font-bold text-[#FF6B35] bg-white px-8 py-4 rounded-full hover:bg-orange-50 transition-colors shadow-lg"
        >
          Create your free store →
        </Link>
        <p className="mt-4 text-sm text-white/60">
          Already have a store?{' '}
          <Link href="/sign-in" className="text-white underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>

      {/* ─── Footer ─── */}
      <footer className="bg-[#1A1A1A] border-t border-white/5 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <Link href="/" className="text-base font-black text-[#FF6B35]">QRS</Link>
          <p className="text-xs text-white/25">&copy; {new Date().getFullYear()} QRS. All rights reserved.</p>
          <div className="flex gap-5">
            {['Privacy', 'Terms', 'Contact'].map(item => (
              <Link
                key={item}
                href={item === 'Contact' ? 'mailto:hello@my-qrs.co' : `/${item.toLowerCase()}`}
                className="text-xs text-white/35 hover:text-white/70 transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </>
  )
}
