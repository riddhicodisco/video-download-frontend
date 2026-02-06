import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: 'https://video-download-frontend-3vtxnxwr0-codisco.vercel.app/sitemap.xml', // Placeholder URL
  }
}
