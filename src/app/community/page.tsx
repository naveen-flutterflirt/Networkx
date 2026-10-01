import type { Metadata } from 'next'
import PublicCommunityView from './PublicCommunityView'

export const metadata: Metadata = {
  title: 'Business Community Directory | NetworkX',
  description: 'Discover a trusted business community and its active members on NetworkX.',
  alternates: { canonical: 'https://www.networkxcircle.com/community' },
  openGraph: {
    title: 'Business Community Directory | NetworkX',
    description: 'Meet trusted professionals and business leaders in a NetworkX Partner Community.',
    type: 'website',
    images: ['/images/og-v3.jpg'],
  },
}

export default function PublicCommunityPage() {
  return <PublicCommunityView />
}
