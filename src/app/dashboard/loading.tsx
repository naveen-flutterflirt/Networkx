import { Loading } from '@/components/shared/States'

// Shown instantly while the next dashboard page's code loads after a menu
// tap, instead of the old page sitting frozen until the new one is ready.
export default function DashboardLoading() {
  return <div className="page"><Loading label="Opening page…" /></div>
}
