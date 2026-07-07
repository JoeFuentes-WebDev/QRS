import Link from 'next/link'
import HeroCarousel from '@/components/HeroCarousel'

export const metadata = {
  title: 'QRS — One link. One QR code. Your whole store.',
  description:
    'QRS gives makers and market sellers a storefront that works in person and online. No monthly fee.',
}

const trustItems = [
  'No monthly fee',
  'Works in-person & online',
  'Keep 98.5% of every sale',
]

const steps = [
  {
    num: 'Step 1',
    title: 'Create your store',
    body: 'Sign up, name your store, upload your products with photos and prices. Takes about a minute.',
  },
  {
    num: 'Step 2',
    title: 'Print your QR code',
    body: 'Download and print your unique QR code. Tape it to your table, frame it, stick it anywhere customers can see it.',
  },
  {
    num: 'Step 3',
    title: 'Start getting paid',
    body: 'Customers scan, browse, and buy. You get paid via Stripe. Orders come straight to your phone via Telegram.',
  },
]

export default function LandingPage() {
  return (
    <>
      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 bg-[#FFFAF7]/90 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <Link href="/" className="text-[22px] font-black text-[#FF6B35] tracking-tight">
            QR<span className="text-[#1A1A1A]">S</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/how-it-works"
              className="hidden sm:block text-sm font-medium text-[#FF6B35] underline underline-offset-2 hover:text-[#E0501A] transition-colors"
            >
              How it works
            </Link>
            <Link
              href="/sign-in"
              className="text-sm font-bold text-[#1A1A1A] px-4 py-2 rounded-full border-2 border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-bold text-white bg-[#FF6B35] px-4 py-2 rounded-full hover:bg-[#E0501A] transition-colors shadow-sm"
            >
              Create your store
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        {/* Copy */}
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-[#FF6B35] bg-orange-50 border border-orange-200 px-3 py-1 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
            No monthly fee
          </span>

          <h1 className="text-[clamp(36px,5vw,58px)] font-black leading-[1.05] tracking-[-1.5px] text-[#1A1A1A] mb-5">
            One link.<br />
            One QR code.<br />
            <em className="not-italic text-[#FF6B35]">Your whole store.</em>
          </h1>

          <p className="text-lg text-[#555550] leading-relaxed mb-8 max-w-md">
            Sell at the market, share the link to your mailing list,
            take orders from anywhere. Built for makers who just want to sell.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 text-base font-bold text-white bg-[#FF6B35] px-7 py-3.5 rounded-full hover:bg-[#E0501A] transition-colors shadow-[0_4px_16px_rgba(255,107,53,0.3)] hover:shadow-[0_8px_24px_rgba(255,107,53,0.4)] hover:-translate-y-0.5 transform"
            >
              Set up in 5 minutes
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center text-base font-bold text-[#1A1A1A] px-7 py-3.5 rounded-full border-2 border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors hover:-translate-y-0.5 transform"
            >
              Sign in
            </Link>
          </div>

          <Link href="/how-it-works" className="text-sm text-[#555550] hover:text-[#1A1A1A] transition-colors">
            See how it works →
          </Link>

          {/* Trust items */}
          <div className="flex flex-wrap items-center gap-4 mt-7">
            {trustItems.map(item => (
              <div key={item} className="flex items-center gap-1.5 text-sm text-[#555550]">
                <span className="w-[18px] h-[18px] rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Carousel + float card */}
        <div className="relative flex justify-center md:justify-end order-first md:order-last">
          <HeroCarousel />
          <div className="absolute bottom-8 -left-4 bg-white rounded-xl px-3.5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
            <p className="text-lg font-black text-[#FF6B35] leading-none">$0</p>
            <p className="text-[11px] text-[#555550] mt-0.5">Monthly fee</p>
          </div>
        </div>
      </section>

      {/* ─── How it works strip ─── */}
      <div className="bg-[#FF6B35] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6 flex-wrap">
          <p className="text-sm font-semibold text-white">Sign up, add your products, print your QR code. Done.</p>
          <Link href="/how-it-works" className="text-sm font-bold text-white border-b-2 border-white/50 hover:border-white pb-0.5 transition-colors whitespace-nowrap">
            See the full walkthrough →
          </Link>
        </div>
      </div>

      {/* ─── Steps ─── */}
      <section className="max-w-6xl mx-auto px-6 py-20 sm:py-24">
        <p className="text-xs font-bold tracking-widest uppercase text-[#FF6B35] mb-3">How it works</p>
        <h2 className="text-[clamp(28px,4vw,42px)] font-black tracking-tight leading-[1.1] text-[#1A1A1A] mb-4">
          Up and selling<br />in 5 minutes
        </h2>
        <p className="text-lg text-[#555550] leading-relaxed max-w-xl mb-14">
          No developer, no monthly subscription, no learning curve. Just your products and a QR code.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map(step => (
            <div
              key={step.num}
              className="bg-[#FFFAF7] border border-orange-100 rounded-2xl p-7 hover:border-orange-300 hover:-translate-y-1 transition-all duration-200"
            >
              <span className="inline-block text-[11px] font-black tracking-widest uppercase text-[#FF6B35] bg-orange-50 px-2.5 py-1 rounded-full mb-5">
                {step.num}
              </span>
              <h3 className="text-lg font-black text-[#1A1A1A] mb-2">{step.title}</h3>
              <p className="text-[15px] text-[#555550] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-11 text-center">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#FF6B35] border-b-2 border-orange-100 hover:border-[#FF6B35] pb-0.5 transition-colors"
          >
            Full walkthrough with screenshots →
          </Link>
        </div>
      </section>

      {/* ─── Pricing band ─── */}
      <div className="bg-[#FFF5EF] border-y border-orange-100 px-6 py-14">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-10 flex-wrap">
          <div>
            <h2 className="text-[clamp(24px,3vw,36px)] font-black tracking-tight leading-[1.15] text-[#1A1A1A] mb-2">
              Pay only when<br />you make a sale.
            </h2>
            <p className="text-base text-[#555550] leading-relaxed max-w-md">
              No monthly plan, no setup fee, no surprise charges. QRS takes a small cut only when you do. That&apos;s it.
            </p>
          </div>
          <div className="text-center flex-shrink-0">
            <p className="text-[42px] font-black leading-[1.15] tracking-tight text-[#FF6B35]">
              Only pay<br />per sale.
            </p>
            <p className="text-sm text-[#555550] mt-1">No monthly plan. No surprises.</p>
          </div>
        </div>
      </div>

      {/* ─── CTA footer ─── */}
      <div className="bg-[#1A1A1A] px-6 py-24 text-center">
        <h2 className="text-[clamp(32px,5vw,56px)] font-black tracking-[-1.5px] leading-[1.05] text-white mb-4">
          Your store.<br />
          In person <em className="not-italic text-[#FF6B35]">&amp;</em> online.
        </h2>
        <p className="text-lg text-white/50 leading-relaxed max-w-md mx-auto mb-10">
          Join makers, market sellers, and small vendors already using QRS to sell without the overhead.
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 text-lg font-bold text-white bg-[#FF6B35] px-9 py-4 rounded-full hover:bg-[#E0501A] transition-colors shadow-[0_4px_16px_rgba(255,107,53,0.3)]"
        >
          Create your free store
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <p className="mt-4 text-sm text-white/35">
          Already have a store?{' '}
          <Link href="/sign-in" className="text-white/60 underline underline-offset-2 hover:text-white transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      {/* ─── Footer bar ─── */}
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
