'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowsRotate, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons'
import { CampaignAPI } from '@/lib/api'
import { Pagination } from '@/components/shared/Pagination'

export default function CampaignApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [acting, setActing] = useState<string | null>(null)
  const [dryRun, setDryRun] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchApprovals = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const { items, meta } = await CampaignAPI.listApprovals({ status: 'pending', page: p, page_size: 20 })
      setApprovals(items)
      setHasMore(!!meta.has_more)
      setPage(p)
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Failed to load approvals'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchApprovals(1) }, [fetchApprovals])

  const approve = async (id: string) => {
    setActing(id); setMsg('')
    try {
      const result = await CampaignAPI.approve(id, { dry_run: dryRun[id] ?? true })
      setMsg(`✅ ${result.status === 'published' ? 'Published' : result.status === 'publish_failed' ? 'Published with some failures — check the blog/social results' : 'Simulated (dry run) — nothing was actually posted'}`)
      fetchApprovals(page)
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Approve failed'))
    } finally {
      setActing(null)
    }
  }

  const reject = async (id: string) => {
    const reason = prompt('Reason for rejecting this campaign draft?')
    if (reason === null) return
    setActing(id)
    try {
      await CampaignAPI.reject(id, { reason })
      setMsg('✅ Rejected')
      fetchApprovals(page)
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Reject failed'))
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Link href="/dashboard/super/social-automation/campaign" style={{ fontSize: 12, color: 'var(--nx-muted)', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Auto Campaign
          </Link>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Campaign Approvals</h2>
          <p style={{ fontSize: 13, color: 'var(--nx-muted)' }}>Dry run is checked by default — nothing publishes or posts until you uncheck it.</p>
        </div>
        <button className="btn btn-g btn-sm" onClick={() => fetchApprovals(page)} disabled={loading}><FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5" />Refresh</button>
      </div>

      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13,
          background: msg.startsWith('✅') ? 'rgba(39,216,109,.1)' : 'rgba(255,90,90,.1)',
          color: msg.startsWith('✅') ? '#16a34a' : '#ef4444',
          border: `1px solid ${msg.startsWith('✅') ? 'rgba(39,216,109,.35)' : 'rgba(255,90,90,.35)'}` }}>
          {msg}
        </div>
      )}

      {!loading && approvals.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--nx-muted)' }}>Nothing pending approval.</div>
      )}

      {approvals.map(a => (
        <div key={a.id} className="card" style={{ padding: 18, marginBottom: 14 }}>
          {a.blog?.cover_image_url && <img src={a.blog.cover_image_url} alt="" style={{ width: '100%', maxWidth: 300, borderRadius: 10, marginBottom: 12 }} />}
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{a.blog?.title}</div>
          <div style={{ fontSize: 13, color: 'var(--nx-muted)', marginBottom: 12 }}>{a.blog?.excerpt}</div>
          {a.social?.facebook && (
            <div style={{ fontSize: 12, marginBottom: 6 }}><FontAwesomeIcon icon={faFacebook} style={{ color: '#1877f2', marginRight: 6 }} />{a.social.facebook.description}</div>
          )}
          {a.social?.instagram && (
            <div style={{ fontSize: 12, marginBottom: 12 }}><FontAwesomeIcon icon={faInstagram} style={{ color: '#e1306c', marginRight: 6 }} />{a.social.instagram.caption}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <input type="checkbox" checked={dryRun[a.id] ?? true} onChange={e => setDryRun(d => ({ ...d, [a.id]: e.target.checked }))} /> Dry run (simulate only)
            </label>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn btn-g btn-sm" style={{ color: '#ef4444' }} disabled={acting === a.id} onClick={() => reject(a.id)}>
                <FontAwesomeIcon icon={faXmark} className="mr-1.5" />Reject
              </button>
              <button className="btn btn-p btn-sm" disabled={acting === a.id} onClick={() => approve(a.id)}>
                <FontAwesomeIcon icon={faCheck} className="mr-1.5" />{acting === a.id ? 'Working…' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      ))}
      <Pagination page={page} pageSize={20} hasMore={hasMore} onPageChange={fetchApprovals} loading={loading} />
    </div>
  )
}
