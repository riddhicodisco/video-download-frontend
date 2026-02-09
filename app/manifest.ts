import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VidNest Video Downloader',
    short_name: 'VidNest',
    description: 'Download YouTube videos and audio for free in high quality.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#8b5cf6',
    icons: [
      {
        src: '/favicon.png',
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
