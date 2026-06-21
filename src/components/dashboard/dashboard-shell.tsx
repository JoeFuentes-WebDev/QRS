'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SignOutButton } from '@clerk/nextjs'
import type { Product } from '@/types'
import { AddTab } from '@/components/dashboard/add-tab'
import { EditTab } from '@/components/dashboard/edit-tab'
import { HeroTab } from '@/components/dashboard/hero-tab'
import { freemiumUsageMessage } from '@/lib/freemium'

type Tab = 'add' | 'edit' | 'hero'

type HeroImage = {
  id: string
  imageUrl: string
  alt?: string | null
  order: number
}

export function DashboardShell({
  storeName,
  slug,
  monthlyOrderCount,
  products,
  heroImages,
}: {
  storeName: string
  slug: string
  monthlyOrderCount: number
  products: Product[]
  heroImages: HeroImage[]
}) {
  const [tab, setTab] = useState<Tab>('add')
  const shopUrl = `https://my-qrs.co/${slug}`

  const tabs: { id: Tab; label: string }[] = [
    { id: 'add', label: 'Add' },
    { id: 'edit', label: 'Edit' },
    { id: 'hero', label: 'Hero' },
  ]

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col">
      <header className="px-6 py-5 border-b border-stone-200 flex items-center justify-between">
        <h1 className="text-lg font-bold text-stone-900">Welcome, {storeName}</h1>
        <div className="flex items-center gap-4">
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

      <div className="px-6 py-3 border-b border-stone-200 space-y-1">
        <p className="text-stone-500 text-xs text-center">
          Your shop:{' '}
          <Link
            href={shopUrl}
            className="text-stone-800 font-medium underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            my-qrs.co/{slug}
          </Link>
        </p>
        <p className="text-stone-400 text-xs text-center">
          {freemiumUsageMessage(monthlyOrderCount)}
        </p>
      </div>

      <div className="flex border-b border-stone-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 text-center py-3 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'text-stone-900 border-b-2 border-stone-900 -mb-px'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-5">
        <div className="max-w-lg mx-auto">
          {tab === 'add' && <AddTab />}
          {tab === 'edit' && <EditTab initialProducts={products} />}
          {tab === 'hero' && <HeroTab initialImages={heroImages} />}
        </div>
      </div>
    </main>
  )
}
