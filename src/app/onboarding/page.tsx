import { redirect } from 'next/navigation'
import { getCurrentSeller, getCurrentUserEmail } from '@/lib/seller'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'

export default async function OnboardingPage() {
  const seller = await getCurrentSeller()
  if (seller) redirect('/dashboard')

  const email = (await getCurrentUserEmail()) ?? ''

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10">
      <div className="max-w-md mx-auto space-y-8">
        <div className="text-center">
          <p className="text-3xl font-black text-stone-900 tracking-tight">QRS</p>
          <h1 className="text-xl font-bold text-stone-900 mt-4">Set up your shop</h1>
          <p className="text-stone-500 text-sm mt-1">Fill in the details below to get started.</p>
        </div>

        <OnboardingForm defaultEmail={email} />
      </div>
    </main>
  )
}
