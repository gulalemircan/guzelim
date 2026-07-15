import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bizim Dünyamız',
    short_name: 'E & E',
    description: 'Efsun ve Emircan',
    start_url: '/',
    display: 'standalone', // Safari ve Chrome'da adres çubuğunu gizler, tam ekran yapar
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
  }
}