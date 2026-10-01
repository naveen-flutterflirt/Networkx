"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// gtag.js only fires its automatic page_view once, on the initial script
// load — it has no way to know about a Next.js App Router client-side
// route change (no full page reload happens, so the script never
// reloads). Without this, GA would undercount real page views: a visitor
// who clicks "Join NetworkX" from the homepage nav (a client-side
// transition to /join-free) would never register as a hit on that page
// at all, only visitors who land there via a fresh full page load would.
export default function GoogleAnalyticsPageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined" || typeof (window as any).gtag !== "function") return;
    const query = searchParams?.toString();
    (window as any).gtag("event", "page_view", {
      page_path: query ? `${pathname}?${query}` : pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
