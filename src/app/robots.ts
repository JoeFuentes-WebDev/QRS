import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/admin', '/api/', '/onboarding'],
    },
    sitemap: 'https://my-qrs.co/sitemap.xml',
  }
}
