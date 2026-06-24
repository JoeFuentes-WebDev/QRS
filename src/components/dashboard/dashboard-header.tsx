'use client'

import Link from 'next/link'
import { SignOutButton } from '@clerk/nextjs'

export function DashboardHeader({ storeName }: { storeName: string }) {
  return (
    <header className="px-6 py-5 border-b border-stone-200 flex items-center justify-between">
      <h1 className="text-lg font-bold text-stone-900">Welcome, {storeName}</h1>
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/products"
          className="text-sm text-stone-600 font-medium hover:text-stone-900"
        >
          Products
        </Link>
        <Link
          href="/dashboard/settings"
          className="text-sm text-stone-600 font-medium hover:text-stone-900"
        >
          Settings
        </Link>
        <SignOutButton redirectUrl="/">
          <button
            type="button"
            className="text-sm text-stone-600 font-medium hover:text-stone-900"
          >
            Log out
          </button>
        </SignOutButton>
      </div>
    </header>
  )
}
