import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-8">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/onboarding"
      />
    </main>
  )
}
