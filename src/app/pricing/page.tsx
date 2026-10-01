// Deliberately NOT 'use client' and takes no props. Next.js auto-injects a
// searchParams prop into every page.tsx's default export; for a page file
// marked 'use client' directly, serializing that prop across the RSC
// boundary trips a static-export bailout ("used searchParams.toJSON") even
// when the component itself never reads it — which is exactly what was
// happening here (this page reads window.location.search client-side in a
// useEffect instead, which needs no such prop). Moving all the actual
// 'use client' logic one file down into PricingClient avoids the implicit
// prop entirely, since this wrapper is a plain server component with zero
// props to serialize. /join/plans/page.tsx re-exports this same default,
// so it's fixed there too.
import PricingClient from "./PricingClient";

export default function PricingPage() {
  return <PricingClient />;
}
