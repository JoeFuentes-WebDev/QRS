import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-8">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/dashboard"
      />
    </main>
  )
}