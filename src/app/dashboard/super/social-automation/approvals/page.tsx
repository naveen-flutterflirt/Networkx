'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowsRotate, faCheck, faXmark, faClock, faBan } from '@fortawesome/free-solid-svg-icons'
import { faFacebook, faInstagram, faYoutube } from '@fortawesome/free-brands-svg-icons'
import { SocialAutomationAPI } from '@/lib/api'
import { Pagination } from '@/components/shared/Pagination'

const PLATFORM_ICON: Record<string, any> = { facebook: faFacebook, instagram: faInstagram, youtube: faYoutube }
const PLATFORM_COLOR: Record<string, string> = { facebook: '#1877f2', instagram: '#e1306c', youtube: '#ff0000' }

// Not a pixel-exact clone of each platform's UI — just enough of a
// realistic card (icon, image, formatted caption together) to catch
// "wait, that doesn't look right" before publishing, which plain text +
// a separate image thumbnail (the old layout) made easy to miss.
function PlatformPreview({ platform, content, imageUrl }: { platform: string, content: any, imageUrl?: string }) {
  const text = platform === 'instagram' ? content.caption : content.description
  const hashtags = (content.hashtags || []).join(' ')
  return (
    <div style={{ border: '1px solid var(--nx-line)', borderRadius: 12, overflow: 'hidden', background: 'var(--nx-panel)', maxWidth: 340 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
        <FontAwesomeIcon icon={PLATFORM_ICON[platform]} style={{ color: PLATFORM_COLOR[platform], fontSize: 15 }} />
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>{platform}</div>
      </div>
      {imageUrl && <img src={imageUrl} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />}
      <div style={{ padding: 12, fontSize: 12.5, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
        {content.title && <div style={{ fontWeight: 700, marginBottom: 4 }}>{content.title}</div>}
        {text}
        {hashtags && <div style={{ color: 'var(--nx-orange)', marginTop: 6 }}>{hashtags}</div>}
      </div>
    </div>
  )
}

export default function ApprovalsPage() {
  const [tab, setTab] = useState<'pending' | 'scheduled'>('pending')
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [acting, setActing] = useState<string | null>(null)
  const [dryRun, setDryRun] = useState<Record<string, boolean>>({})
  const [scheduleAt, setScheduleAt] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchApprovals = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const { items, meta } = await SocialAutomationAPI.listApprovals({ status: tab, page: p, page_size: 20 })
      setApprovals(items)
      setHasMore(!!meta.has_more)
      setPage(p)
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Failed to load approvals'))
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { fetchApprovals(1) }, [fetchApprovals])

  const approve = async (id: string) => {
    setActing(id); setMsg('')
    try {
      const scheduledLocal = scheduleAt[id]
      const body: any = { dry_run: dryRun[id] ?? true }
      if (scheduledLocal) body.scheduled_for = new Date(scheduledLocal).toISOString()
      const result = await SocialAutomationAPI.approveApproval(id, body)
      setMsg(result.status === 'scheduled'
        ? `✅ Scheduled for ${new Date(result.scheduled_for).toLocaleString()}`
        : `✅ ${result.status === 'published' ? 'Published' : result.status === 'publish_failed' ? 'Published with some failures — check History' : 'Simulated (dry run) — nothing was actually posted'}`)
      fetchApprovals(page)
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Approve failed'))
    } finally {
      setActing(null)
    }
  }

  const reject = async (id: string) => {
    const reason = prompt('Reason for rejecting this post?')
    if (reason === null) return
    setActing(id)
    try {
      await SocialAutomationAPI.rejectApproval(id, { reason })
      setMsg('✅ Rejected — draft returned to editable state')
      fetchApprovals(page)
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Reject failed'))
    } finally {
      setActing(null)
    }
  }

  const cancelSchedule = async (id: string) => {
    if (!confirm('Cancel this scheduled post? It moves back to the pending queue.')) return
    setActing(id)
    try {
      await SocialAutomationAPI.cancelSchedule(id)
      setMsg('✅ Schedule cancelled — back in the pending queue')
      fetchApprovals(page)
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Could not cancel schedule'))
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <Link href="/dashboard/super/social-automation" style={{ fontSize: 12, color: 'var(--nx-muted)', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Social Automation
          </Link>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Approval Queue</h2>
          <p style={{ fontSize: 13, color: 'var(--nx-muted)' }}>Dry run is checked by default — nothing posts to real accounts until you uncheck it.</p>
        </div>
        <button className="btn btn-g btn-sm" onClick={() => fetchApprovals(page)} disabled={loading}><FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5" />Refresh</button>
      </div>

      <div className="tab-bar" style={{ marginBottom: 16, maxWidth: 320 }}>
        <button className={`tab-btn${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>Pending</button>
        <button className={`tab-btn${tab === 'scheduled' ? ' active' : ''}`} onClick={() => setTab('scheduled')}>Scheduled</button>
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
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--nx-muted)' }}>
          {tab === 'pending' ? 'Nothing pending approval.' : 'Nothing scheduled.'}
        </div>
      )}

      {approvals.map(a => (
        <div key={a.id} className="card" style={{ padding: 18, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
            {Object.entries(a.platform_targets || {}).filter(([, v]) => v).map(([platform]) => (
              <FontAwesomeIcon key={platform} icon={PLATFORM_ICON[platform]} style={{ fontSize: 16, color: 'var(--nx-muted)' }} />
            ))}
            <div style={{ fontSize: 12, color: 'var(--nx-muted)', marginLeft: 'auto' }}>
              {tab === 'scheduled' && a.scheduled_for
                ? <span><FontAwesomeIcon icon={faClock} className="mr-1.5" />{new Date(a.scheduled_for).toLocaleString()}</span>
                : (a.requested_at ? new Date(a.requested_at).toLocaleString() : '')}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
            {Object.entries(a.content_snapshot || {}).filter(([, v]) => v).map(([platform, c]: [string, any]) => (
              <PlatformPreview key={platform} platform={platform} content={c} imageUrl={a.image_view_url} />
            ))}
          </div>

          {a.notes && <div style={{ fontSize: 12, color: 'var(--nx-muted)', marginBottom: 10 }}>Note: {a.notes}</div>}

          {tab === 'pending' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <input type="checkbox" checked={dryRun[a.id] ?? true} onChange={e => setDryRun(d => ({ ...d, [a.id]: e.target.checked }))} /> Dry run (simulate only)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <FontAwesomeIcon icon={faClock} style={{ color: 'var(--nx-muted)' }} />
                <input
                  type="datetime-local" value={scheduleAt[a.id] || ''}
                  onChange={e => setScheduleAt(s => ({ ...s, [a.id]: e.target.value }))}
                  style={{ fontSize: 12, padding: '4px 8px' }}
                />
              </label>
              {scheduleAt[a.id] && <span style={{ fontSize: 11, color: 'var(--nx-muted)' }}>Leave blank to publish immediately</span>}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button className="btn btn-g btn-sm" style={{ color: '#ef4444' }} disabled={acting === a.id} onClick={() => reject(a.id)}>
                  <FontAwesomeIcon icon={faXmark} className="mr-1.5" />Reject
                </button>
                <button className="btn btn-p btn-sm" disabled={acting === a.id} onClick={() => approve(a.id)}>
                  <FontAwesomeIcon icon={faCheck} className="mr-1.5" />
                  {acting === a.id ? 'Working…' : scheduleAt[a.id] ? 'Schedule' : 'Approve'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--nx-muted)' }}>{a.dry_run === false ? 'Will publish for real' : 'Will run as a dry run (simulated)'}</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button className="btn btn-g btn-sm" style={{ color: '#ef4444' }} disabled={acting === a.id} onClick={() => cancelSchedule(a.id)}>
                  <FontAwesomeIcon icon={faBan} className="mr-1.5" />Cancel schedule
                </button>
                <button className="btn btn-p btn-sm" disabled={acting === a.id} onClick={() => approve(a.id)}>
                  <FontAwesomeIcon icon={faCheck} className="mr-1.5" />{acting === a.id ? 'Working…' : 'Publish now instead'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      <Pagination page={page} pageSize={20} hasMore={hasMore} onPageChange={fetchApprovals} loading={loading} />
    </div>
  )
}
