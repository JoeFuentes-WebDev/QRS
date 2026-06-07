import { redirect } from 'next/navigation'
import { getCurrentSeller } from '@/lib/seller'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const seller = await getCurrentSeller()
  if (!seller) redirect('/onboarding')

  return <>{children}</>
}
