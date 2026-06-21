import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — QRS',
  description: 'QRS privacy policy.',
}

export default function PrivacyPage() {
  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#FFFAF7]/90 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <Link href="/" className="text-[22px] font-black text-[#FF6B35] tracking-tight">
            QR<span className="text-[#1A1A1A]">S</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/how-it-works"
              className="hidden sm:block text-sm font-medium text-[#555550] px-3 py-1.5 rounded-full hover:bg-orange-50 hover:text-[#1A1A1A] transition-colors"
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

      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-[#555550] mb-8">Last updated: June 2026</p>
        <p className="text-[#555550] leading-relaxed mb-10">
          This page is being updated. Please check back soon.
        </p>
        <Link
          href="/"
          className="text-sm font-bold text-[#FF6B35] hover:text-[#E0501A] transition-colors"
        >
          ← Back to home
        </Link>
      </main>
    </>
  )
}
