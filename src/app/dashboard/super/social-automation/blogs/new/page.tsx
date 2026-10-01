'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons'
import { BlogAPI } from '@/lib/api'

export default function NewBlogPostPage() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [category, setCategory] = useState('')
  const [tone, setTone] = useState('')
  const [keyPoints, setKeyPoints] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) { setError('Enter a topic first'); return }
    setError(''); setSaving(true)
    try {
      const draft = await BlogAPI.createDraft({
        topic: topic.trim(), category: category || undefined, tone: tone || undefined,
        key_points: keyPoints.trim() ? keyPoints.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
      })
      router.push(`/dashboard/super/social-automation/blogs/review/?blogId=${draft.id}`)
    } catch (e: any) {
      setError(e.message || 'Could not create draft')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <Link href="/dashboard/super/social-automation/blogs" style={{ fontSize: 12, color: 'var(--nx-muted)', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back to Blog Posts
      </Link>
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>New Blog Post</h2>
      <p style={{ fontSize: 13, color: 'var(--nx-muted)', marginBottom: 18 }}>Give NVIDIA a topic and some notes — you'll generate and review the full article next.</p>

      {error && <div style={{ background: 'rgba(255,90,90,.1)', border: '1px solid rgba(255,90,90,.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#ef4444', fontSize: 13 }}>{error}</div>}

      <form onSubmit={submit} className="card" style={{ maxWidth: 560, padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Topic *</label>
          <input required value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. How our Dubai chapter closed 3 deals in one meetup" style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Category (optional)</label>
          <input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. member_story, growth_tip" style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Tone (optional)</label>
          <input value={tone} onChange={e => setTone(e.target.value)} placeholder="e.g. warm and conversational" style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Key points (one per line, optional)</label>
          <textarea value={keyPoints} onChange={e => setKeyPoints(e.target.value)} rows={4} style={{ width: '100%', resize: 'vertical' }} />
        </div>
        <button type="submit" className="btn btn-p" disabled={saving || !topic.trim()}>
          {saving ? 'Creating…' : <><FontAwesomeIcon icon={faWandMagicSparkles} className="mr-1.5" />Create &amp; Continue</>}
        </button>
      </form>
    </div>
  )
}
