import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center max-w-sm space-y-8">
        <p className="text-4xl font-black text-stone-900 tracking-tight">QRS</p>

        <p className="text-stone-600 text-lg leading-snug">
          Your shop. Anywhere. Just a QR code.
        </p>

        <div className="space-y-3">
          <Link
            href="/sign-up"
            className="block w-full bg-stone-900 text-white font-bold py-3 rounded-xl hover:bg-stone-700 transition-colors text-center"
          >
            Get Started
          </Link>
          <p className="text-stone-500 text-sm">
            Already have a shop?{' '}
            <Link href="/sign-in" className="text-stone-900 font-medium underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
