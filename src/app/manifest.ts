
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KeyFlow Pro',
    short_name: 'KeyFlow',
    description: 'Intelligent physical key management system.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#144b89',
    icons: [
      {
        src: 'https://picsum.photos/seed/keyflow/192/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://picsum.photos/seed/keyflow/512/512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
