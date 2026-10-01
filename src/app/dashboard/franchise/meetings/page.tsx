'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Was a separate page with zero real API calls — a disconnected
// duplicate of the real, backend-connected Digital Meetings page at
// /dashboard/meetings, which already correctly grants franchise/
// hq_admin/super_admin the create/manage actions this page's fake
// "+ Create Meeting" button never actually performed. The sidebar now
// points "Meeting Management" straight at the real page; this redirect
// covers anyone with the old URL bookmarked or linked elsewhere.
export default function FranchiseMeetingsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/meetings') }, [router])
  return null
}