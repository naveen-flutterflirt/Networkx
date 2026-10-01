import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title: 'NetworkX – The World\'s Smartest Online Business Network', description: 'Learn. Build. Evolve. Connect with the right people, discover opportunities, and grow your business together.' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/></head>
      <body>{children}</body>
    </html>
  )
}
