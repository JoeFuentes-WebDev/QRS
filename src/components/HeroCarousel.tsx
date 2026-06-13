'use client'

import { useEffect, useRef, useState } from 'react'

const slides = [
  { src: '/videos/scene1.mp4', caption: 'Scan your QR code. See your store come to life.' },
  { src: '/videos/scene2.mp4', caption: 'Snap a photo. Your listing is ready in seconds.' },
  { src: '/videos/scene3.mp4', caption: 'Your store — built automatically from your photos.' },
  { src: '/videos/scene4.mp4', caption: 'Customers buy while you focus on your craft.' },
  { src: '/videos/scene5.mp4', caption: 'New order. Time to ship. Your business is working.' },
]

const DURATION = 4000

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function goTo(index: number) {
    const prev = videoRefs.current[current]
    if (prev) prev.pause()

    setCurrent(index)

    const next = videoRefs.current[index]
    if (next) {
      next.currentTime = 0
      next.play().catch(() => {})
    }
  }

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(c => {
        const next = (c + 1) % slides.length
        const video = videoRefs.current[next]
        if (video) { video.currentTime = 0; video.play().catch(() => {}) }
        const prev = videoRefs.current[c]
        if (prev) prev.pause()
        return next
      })
    }, DURATION)
  }

  useEffect(() => {
    const first = videoRefs.current[0]
    if (first) first.play().catch(() => {})
    startTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  return (
    <div className="relative w-full max-w-[460px] aspect-[4/5] rounded-2xl overflow-hidden bg-black">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <video
            ref={el => { videoRefs.current[i] = el }}
            src={slide.src}
            muted
            playsInline
            onEnded={() => { goTo((i + 1) % slides.length); startTimer() }}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-10 pt-8 bg-gradient-to-t from-black/55 to-transparent">
            <p className="text-white text-sm font-medium leading-snug">{slide.caption}</p>
          </div>
        </div>
      ))}

      {/* Dot indicators */}
      <div className="absolute bottom-3 right-4 flex gap-1.5 items-center">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Scene ${i + 1}`}
            onClick={() => { goTo(i); startTimer() }}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
              i === current ? 'bg-white scale-125' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
