import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Efsun'un Dünyası",
    short_name: 'E & E',
    description: 'Sonsuza dek...',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/logo-efsun.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo-efsun.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
  }
}