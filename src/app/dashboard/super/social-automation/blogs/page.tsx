'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faArrowsRotate, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { BlogAPI } from '@/lib/api'
import { Pagination } from '@/components/shared/Pagination'

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#9ca3af', bg: 'rgba(156,163,175,.12)' },
  generating: { label: 'Generating…', color: '#3b82f6', bg: 'rgba(59,130,246,.12)' },
  generated: { label: 'Generated', color: '#3b82f6', bg: 'rgba(59,130,246,.12)' },
  publishing: { label: 'Publishing…', color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  published: { label: 'Published', color: '#10b981', bg: 'rgba(16,185,129,.12)' },
}

export default function BlogsListPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchPosts = useCallback(async (p = 1) => {
    setLoading(true); setError('')
    try {
      const { items, meta } = await BlogAPI.listDrafts({ page: p, page_size: 20 })
      setPosts(items)
      setHasMore(!!meta.has_more)
      setPage(p)
    } catch (e: any) {
      setError(e.message || 'Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPosts(1) }, [fetchPosts])

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <Link href="/dashboard/super/social-automation" style={{ fontSize: 12, color: 'var(--nx-muted)', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Social Automation
          </Link>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Blog Posts</h2>
          <p style={{ fontSize: 13, color: 'var(--nx-muted)' }}>Generate, review, and publish blog posts — rendered as a standalone page, linked from the public Blog list.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-g btn-sm" onClick={() => fetchPosts(page)} disabled={loading}><FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5" />Refresh</button>
          <Link href="/dashboard/super/social-automation/blogs/new" className="btn btn-p btn-sm"><FontAwesomeIcon icon={faPlus} className="mr-1.5" />New Post</Link>
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
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--nx-muted)' }}>
            No posts yet. <Link href="/dashboard/super/social-automation/blogs/new" style={{ color: 'var(--nx-orange)' }}>Create your first one</Link>.
          </div>
        ) : (
          posts.map((p, i) => {
            const meta = STATUS_META[p.status] || { label: p.status, color: '#9ca3af', bg: 'rgba(156,163,175,.12)' }
            return (
              <Link key={p.id} href={`/dashboard/super/social-automation/blogs/review/?blogId=${p.id}`} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px',
                borderBottom: i < posts.length - 1 ? '1px solid #f3f4f6' : 'none', textDecoration: 'none', color: 'inherit',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.title || p.topic || 'Untitled post'}</div>
                  <div style={{ fontSize: 12, color: 'var(--nx-muted)' }}>{p.source === 'auto_campaign' ? 'Auto Campaign' : 'Manual'} · {p.created_at ? new Date(p.created_at).toLocaleString() : ''}</div>
                </div>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: meta.bg, color: meta.color, fontWeight: 700, whiteSpace: 'nowrap' }}>{meta.label}</span>
              </Link>
            )
          })
        )}
      </div>
      <Pagination page={page} pageSize={20} hasMore={hasMore} onPageChange={fetchPosts} loading={loading} />
    </div>
  )
}
