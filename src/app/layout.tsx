import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import LocalhostCanonicalRedirect from "./components/LocalhostCanonicalRedirect";
import GoogleAnalyticsPageviewTracker from "./components/GoogleAnalyticsPageviewTracker";
import "./globals.css";

// GA4 measurement ID — public by design (meant to be embedded
// client-side), not a secret, safe to hardcode here.
const GA_MEASUREMENT_ID = "G-163B04KTX6";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.networkxcircle.com"),
  title: "NetworkX | World's FIrst AI-Powered Business Growth Community",
  description: "Learn, build and evolve with NetworkX—the global online business platform for meaningful connections, smarter networking and real opportunities.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "NetworkX | World's FIrst AI-Powered Business Growth Community",
    description: "Learn. Build. Evolve.",
    type: "website",
    images: [{ url: "/images/og-v3.jpg", width: 1200, height: 630, alt: "NetworkX — World's FIrst AI-Powered Business Growth Community." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NetworkX | World's FIrst AI-Powered Business Growth Community",
    description: "Learn. Build. Evolve.",
    images: ["/og-v3.jpg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Tailwind Play CDN — added per explicit request. Note: globals.css
            still has @import "tailwindcss" (the real build-time setup) —
            running both at once can produce duplicate/conflicting styles.
            If you keep this CDN script, consider removing that @import
            line from globals.css to avoid the two fighting each other. */}
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />

        {/* Google tag (gtag.js) */}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body>
        <LocalhostCanonicalRedirect />
        {/* Tracks client-side route changes as page_view events — gtag's
            own automatic page_view only fires once, on initial script
            load, and never again during Next.js App Router navigation
            (no full page reload happens). Suspense boundary is required
            by Next.js for any component using useSearchParams(), or the
            static export build fails. */}
        <Suspense fallback={null}>
          <GoogleAnalyticsPageviewTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}