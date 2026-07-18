import type { Metadata } from 'next'
import { HowItWorksContent } from '@/components/marketing/how-it-works-content'

export const metadata: Metadata = {
  title: {
    absolute: 'How it works — my-qrs.co',
  },
  description:
    'Sign up, connect Stripe, add products, get your QR code postcard, and start selling. Five steps to your online store.',
  openGraph: {
    title: 'How it works — my-qrs.co',
    description:
      'Five steps to your online store. Built for craft fair vendors and local sellers.',
    url: 'https://my-qrs.co/how-it-works',
    siteName: 'my-qrs.co',
    images: [{ url: 'https://my-qrs.co/og-default.png', width: 1200, height: 630 }],
    type: 'website',
  },
}

export default function HowItWorksPage() {
  return <HowItWorksContent />
}
