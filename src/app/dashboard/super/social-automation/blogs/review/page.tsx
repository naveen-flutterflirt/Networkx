'use client'
import { Loading } from '@/components/shared/States'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faWandMagicSparkles, faCheck } from '@fortawesome/free-solid-svg-icons'
import { BlogAPI } from '@/lib/api'

export default function BlogReviewPage() {
  const [blogId, setBlogId] = useState('')
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setBlogId(params.get('blogId') || '')
  }, [])

  const [blog, setBlog] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateCover, setGenerateCover] = useState(false)
  const [approving, setApproving] = useState(false)

  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')

  const fetchBlog = useCallback(async () => {
    if (!blogId) return
    setLoading(true); setError('')
    try {
      const data = await BlogAPI.getDraft(blogId)
      setBlog(data)
      setTitle(data.title || '')
      setExcerpt(data.excerpt || '')
      setBodyHtml(data.body_html || '')
    } catch (e: any) {
      setError(e.message || 'Failed to load post')
    } finally {
      setLoading(false)
    }
  }, [blogId])

  useEffect(() => { fetchBlog() }, [fetchBlog])

  const generate = async () => {
    setGenerating(true); setMsg('')
    try {
      const data = await BlogAPI.generateContent(blogId, { generate_cover_image: generateCover })
      setBlog(data)
      setTitle(data.title || ''); setExcerpt(data.excerpt || ''); setBodyHtml(data.body_html || '')
      setMsg('✅ Article generated — review and edit below')
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Generation failed'))
    } finally {
      setGenerating(false)
    }
  }

  const saveEdits = async () => {
    try {
      await BlogAPI.updateContent(blogId, { title, excerpt, body_html: bodyHtml })
      setMsg('✅ Edits saved')
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Could not save edits'))
    }
  }

  const approve = async () => {
    setApproving(true); setMsg('')
    try {
      await saveEdits()
      const data = await BlogAPI.approve(blogId)
      setBlog(data)
      setMsg('✅ Published!')
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Publish failed'))
    } finally {
      setApproving(false)
    }
  }

  if (!blogId || loading) return <div className="page"><Loading label="Loading…"/></div>
  if (error || !blog) return <div className="page"><div style={{ color: '#ef4444', padding: 20 }}>{error || 'Post not found'}</div></div>

  const hasContent = !!blog.body_html
  const isPublished = blog.status === 'published'

  return (
    <div className="page">
      <Link href="/dashboard/super/social-automation/blogs" style={{ fontSize: 12, color: 'var(--nx-muted)', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back to Blog Posts
      </Link>

      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13,
          background: msg.startsWith('✅') ? 'rgba(39,216,109,.1)' : 'rgba(255,90,90,.1)',
          color: msg.startsWith('✅') ? '#16a34a' : '#ef4444',
          border: `1px solid ${msg.startsWith('✅') ? 'rgba(39,216,109,.35)' : 'rgba(255,90,90,.35)'}` }}>
          {msg}
        </div>
      )}

      {isPublished && blog.public_url && (
        <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13 }}>Published and live.</div>
          <a href={blog.public_url} target="_blank" rel="noreferrer" className="btn btn-g btn-sm">View live post →</a>
        </div>
      )}

      <div style={{ fontSize: 12, color: 'var(--nx-muted)', marginBottom: 8 }}>Topic: {blog.topic}</div>

      {!hasContent && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Generate article</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 14 }}>
            <input type="checkbox" checked={generateCover} onChange={e => setGenerateCover(e.target.checked)} /> Also generate a cover image (OpenAI)
          </label>
          <button className="btn btn-p" onClick={generate} disabled={generating}>
            {generating ? 'Generating…' : <><FontAwesomeIcon icon={faWandMagicSparkles} className="mr-1.5" />Generate</>}
          </button>
        </div>
      )}

      {hasContent && (
        <div className="card" style={{ padding: 20 }}>
          {blog.cover_image_url && <img src={blog.cover_image_url} alt="Cover" style={{ width: '100%', maxWidth: 400, borderRadius: 10, marginBottom: 16 }} />}
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} disabled={isPublished} style={{ width: '100%', marginBottom: 14 }} />
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Excerpt</label>
          <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} disabled={isPublished} rows={2} style={{ width: '100%', resize: 'vertical', marginBottom: 14 }} />
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Body (HTML)</label>
          <textarea value={bodyHtml} onChange={e => setBodyHtml(e.target.value)} disabled={isPublished} rows={16} style={{ width: '100%', resize: 'vertical', marginBottom: 18, fontFamily: 'monospace', fontSize: 12.5 }} />

          {!isPublished && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-g" onClick={saveEdits}>Save edits</button>
              <button className="btn btn-p" onClick={approve} disabled={approving}>
                {approving ? 'Publishing…' : <><FontAwesomeIcon icon={faCheck} className="mr-1.5" />Approve &amp; Publish</>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
