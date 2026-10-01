'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faArrowsRotate, faLink, faClipboardList, faClockRotateLeft, faNewspaper, faRobot, faTrash } from '@fortawesome/free-solid-svg-icons'
import { SocialAutomationAPI } from '@/lib/api'
import { Pagination } from '@/components/shared/Pagination'

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#9ca3af', bg: 'rgba(156,163,175,.12)' },
  generating: { label: 'Generating…', color: '#3b82f6', bg: 'rgba(59,130,246,.12)' },
  generated: { label: 'Generated', color: '#3b82f6', bg: 'rgba(59,130,246,.12)' },
  generation_failed: { label: 'Generation Failed', color: '#ef4444', bg: 'rgba(239,68,68,.12)' },
  pending_approval: { label: 'Pending Approval', color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  scheduled: { label: 'Scheduled', color: '#8b5cf6', bg: 'rgba(139,92,246,.12)' },
  publishing: { label: 'Publishing…', color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  published: { label: 'Published', color: '#10b981', bg: 'rgba(16,185,129,.12)' },
  publish_failed: { label: 'Publish Failed', color: '#ef4444', bg: 'rgba(239,68,68,.12)' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,.12)' },
}

export default function SocialAutomationHomePage() {
  const [drafts, setDrafts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchDrafts = useCallback(async (p = 1) => {
    setLoading(true); setError('')
    try {
      const { items, meta } = await SocialAutomationAPI.listDrafts({ page: p, page_size: 20 })
      setDrafts(items)
      setHasMore(!!meta.has_more)
      setPage(p)
    } catch (e: any) {
      setError(e.message || 'Failed to load drafts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDrafts(1) }, [fetchDrafts])

  const deleteDraft = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation()
    if (!confirm('Delete this draft? This can\'t be undone.')) return
    try {
      await SocialAutomationAPI.deleteDraft(id)
      fetchDrafts(page)
    } catch (e: any) {
      setError(e.message || 'Could not delete draft')
    }
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Social Automation</h2>
          <p style={{ fontSize: 13, color: 'var(--nx-muted)' }}>Upload a video, generate platform copy, review, and cross-post to Facebook, Instagram &amp; YouTube.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/dashboard/super/social-automation/connections" className="btn btn-g btn-sm"><FontAwesomeIcon icon={faLink} className="mr-1.5" />Connections</Link>
          <Link href="/dashboard/super/social-automation/approvals" className="btn btn-g btn-sm"><FontAwesomeIcon icon={faClipboardList} className="mr-1.5" />Approvals</Link>
          <Link href="/dashboard/super/social-automation/history" className="btn btn-g btn-sm"><FontAwesomeIcon icon={faClockRotateLeft} className="mr-1.5" />History</Link>
          <Link href="/dashboard/super/social-automation/blogs" className="btn btn-g btn-sm"><FontAwesomeIcon icon={faNewspaper} className="mr-1.5" />Blogs</Link>
          <Link href="/dashboard/super/social-automation/campaign" className="btn btn-g btn-sm"><FontAwesomeIcon icon={faRobot} className="mr-1.5" />Auto Campaign</Link>
          <button className="btn btn-g btn-sm" onClick={() => fetchDrafts(page)} disabled={loading}><FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5" />Refresh</button>
          <Link href="/dashboard/super/social-automation/new" className="btn btn-p btn-sm"><FontAwesomeIcon icon={faPlus} className="mr-1.5" />New Post</Link>
        </div>
      </div>

      {error && <div style={{ background: 'rgba(255,90,90,.1)', border: '1px solid rgba(255,90,90,.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: '#ef4444', fontSize: 13 }}>{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ height: 14, width: 220, background: 'rgba(255,255,255,.06)', borderRadius: 4, marginBottom: 6 }} />
              <div style={{ height: 11, width: 140, background: 'rgba(255,255,255,.04)', borderRadius: 4 }} />
            </div>
          ))
        ) : drafts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--nx-muted)' }}>
            No posts yet. <Link href="/dashboard/super/social-automation/new" style={{ color: 'var(--nx-orange)' }}>Create your first one</Link>.
          </div>
        ) : (
          drafts.map((d, i) => {
            const meta = STATUS_META[d.status] || { label: d.status, color: '#9ca3af', bg: 'rgba(156,163,175,.12)' }
            const title = d.post_type === 'marketing' ? 'Marketing post' : (d.video?.filename || 'Untitled video')
            return (
              <Link key={d.id} href={`/dashboard/super/social-automation/draft/?draftId=${d.id}`} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', gap: 12,
                borderBottom: i < drafts.length - 1 ? '1px solid #f3f4f6' : 'none', textDecoration: 'none', color: 'inherit',
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
                  <div style={{ fontSize: 12, color: 'var(--nx-muted)' }}>{d.source_notes ? d.source_notes.slice(0, 80) : 'No notes'} · {d.created_at ? new Date(d.created_at).toLocaleString() : ''}</div>
                  {d.status === 'generation_failed' && d.last_generation_error && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{d.last_generation_error.slice(0, 120)}</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: meta.bg, color: meta.color, fontWeight: 700, whiteSpace: 'nowrap' }}>{meta.label}</span>
                  {d.status !== 'publishing' && d.status !== 'scheduled' && (
                    <button
                      type="button" title="Delete draft" onClick={e => deleteDraft(e, d.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nx-muted)', padding: 4 }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>
      <Pagination page={page} pageSize={20} hasMore={hasMore} onPageChange={fetchDrafts} loading={loading} />
    </div>
  )
}
