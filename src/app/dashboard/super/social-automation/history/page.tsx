'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowsRotate } from '@fortawesome/free-solid-svg-icons'
import { faFacebook, faInstagram, faYoutube } from '@fortawesome/free-brands-svg-icons'
import { SocialAutomationAPI } from '@/lib/api'
import { Pagination } from '@/components/shared/Pagination'

const PLATFORM_ICON: Record<string, any> = { facebook: faFacebook, instagram: faInstagram, youtube: faYoutube }
const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  success: { color: '#16a34a', bg: 'rgba(39,216,109,.1)' },
  simulated: { color: '#3b82f6', bg: 'rgba(59,130,246,.1)' },
  failed: { color: '#ef4444', bg: 'rgba(239,68,68,.1)' },
}

export default function PublishHistoryPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [platform, setPlatform] = useState('')
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true); setError('')
    try {
      const { items, meta } = await SocialAutomationAPI.getPublishLog({ platform: platform || undefined, page: p, page_size: 30 })
      setLogs(items)
      setHasMore(!!meta.has_more)
      setPage(p)
    } catch (e: any) {
      setError(e.message || 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }, [platform])

  useEffect(() => { fetchLogs(1) }, [fetchLogs])

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <Link href="/dashboard/super/social-automation" style={{ fontSize: 12, color: 'var(--nx-muted)', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Social Automation
          </Link>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Publish History</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={platform} onChange={e => setPlatform(e.target.value)}>
            <option value="">All platforms</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
          </select>
          <button className="btn btn-g btn-sm" onClick={() => fetchLogs(page)} disabled={loading}><FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5" />Refresh</button>
        </div>
      </div>

      {error && <div style={{ background: 'rgba(255,90,90,.1)', border: '1px solid rgba(255,90,90,.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: '#ef4444', fontSize: 13 }}>{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {!loading && logs.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--nx-muted)' }}>No publish attempts yet.</div>}
        {logs.map((l, i) => {
          const s = STATUS_STYLE[l.status] || { color: '#9ca3af', bg: 'rgba(156,163,175,.1)' }
          return (
            <div key={l.id || i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < logs.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <FontAwesomeIcon icon={PLATFORM_ICON[l.platform]} style={{ fontSize: 16, color: 'var(--nx-muted)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>
                  {l.external_url ? <a href={l.external_url} target="_blank" rel="noreferrer" style={{ color: 'var(--nx-orange)' }}>{l.external_post_id || 'View post'}</a> : (l.error_message || l.external_post_id || '—')}
                </div>
                <div style={{ fontSize: 11, color: 'var(--nx-muted)' }}>{l.attempted_at ? new Date(l.attempted_at).toLocaleString() : ''}</div>
              </div>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: s.bg, color: s.color, fontWeight: 700, textTransform: 'capitalize' }}>{l.status}</span>
            </div>
          )
        })}
      </div>
      <Pagination page={page} pageSize={30} hasMore={hasMore} onPageChange={fetchLogs} loading={loading} />
    </div>
  )
}
