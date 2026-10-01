import type { Metadata } from 'next'
import PublicCommunityView from '../community/PublicCommunityView'

export const metadata: Metadata = {
  title: 'Business Community Directory | NetworkX',
  description: 'Discover a trusted business community and its active members on NetworkX.',
  openGraph: {
    title: 'Business Community Directory | NetworkX',
    description: 'Meet trusted professionals and business leaders in a NetworkX Partner Community.',
    type: 'website',
    images: ['/images/og-v3.jpg'],
  },
}

// Real, single destination file for firebase.json's { "source": "/community/**",
// "destination": "/community_slug/index.html" } rewrite — same pattern as
// resource_slug/page.tsx (see its own comment for why a rewrite needs to
// point at one real file, and how PublicCommunityView still recovers the
// actual requested slug from the browser's address bar via usePathname()
// even though Firebase is physically serving this file's content for it).
export default function PublicCirclePage() {
  return <PublicCommunityView />
}
