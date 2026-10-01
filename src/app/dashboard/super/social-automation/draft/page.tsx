'use client'
import { Loading } from '@/components/shared/States'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faWandMagicSparkles, faPaperPlane, faCopy, faLink, faTrash } from '@fortawesome/free-solid-svg-icons'
import { faFacebook, faInstagram, faYoutube } from '@fortawesome/free-brands-svg-icons'
import { SocialAutomationAPI } from '@/lib/api'

// Static export (output:'export') can't pre-generate a Next.js dynamic
// route for runtime-created draft IDs — every other "detail" page in
// this app (e.g. dashboard/learning/curriculum) uses a flat route +
// ?id= query param read client-side instead, matched here.
//
// Video posts publish to real YouTube (a video upload). Marketing posts
// have no video, so "youtube" is replaced with "youtube_community" — a
// generation-only, copy-paste caption (YouTube's API has no endpoint to
// actually create a Community post, for any tool, not just this one).
const VIDEO_PLATFORMS = [
  { key: 'facebook', label: 'Facebook', icon: faFacebook, color: '#1877f2' },
  { key: 'instagram', label: 'Instagram', icon: faInstagram, color: '#e1306c' },
  { key: 'youtube', label: 'YouTube', icon: faYoutube, color: '#ff0000' },
] as const

const MARKETING_PLATFORMS = [
  { key: 'facebook', label: 'Facebook', icon: faFacebook, color: '#1877f2' },
  { key: 'instagram', label: 'Instagram', icon: faInstagram, color: '#e1306c' },
  { key: 'youtube_community', label: 'YouTube Community (copy-paste)', icon: faYoutube, color: '#ff0000' },
] as const

export default function DraftReviewPage() {
  const router = useRouter()
  const [draftId, setDraftId] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setDraftId(params.get('draftId') || '')
  }, [])

  const [draft, setDraft] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const [targets, setTargets] = useState<Record<string, boolean>>({ facebook: true, instagram: true, youtube: true })
  const [tone, setTone] = useState('')
  const [generateThumbnail, setGenerateThumbnail] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [content, setContent] = useState<Record<string, any>>({})

  const isMarketing = draft?.post_type === 'marketing'
  const platforms = isMarketing ? MARKETING_PLATFORMS : VIDEO_PLATFORMS

  const fetchDraft = useCallback(async () => {
    if (!draftId) return
    setLoading(true); setError('')
    try {
      const data = await SocialAutomationAPI.getDraft(draftId)
      setDraft(data)
      const source = data.edited || data.generated || {}
      setContent(source)
      if (data.generated) {
        // Re-sync targets from what was ACTUALLY generated, not the
        // checkbox default — otherwise reopening a draft that was
        // generated for only some platforms (checkboxes are hidden once
        // generated content exists) silently submits with the stale
        // all-true default, which can trigger a real, unwanted publish to
        // a platform with no generated content at all.
        const generatedPlatforms = Object.keys(data.generated).filter(k => k !== 'model' && k !== 'generated_at')
        const keys = data.post_type === 'marketing' ? ['facebook', 'instagram', 'youtube_community'] : ['facebook', 'instagram', 'youtube']
        setTargets(Object.fromEntries(keys.map(k => [k, generatedPlatforms.includes(k)])))
      } else {
        // First time generating — default targets to this draft's real
        // platform set (marketing drafts never had "youtube" as an option).
        setTargets(data.post_type === 'marketing'
          ? { facebook: true, instagram: true, youtube_community: false }
          : { facebook: true, instagram: true, youtube: true })
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load draft')
    } finally {
      setLoading(false)
    }
  }, [draftId])

  useEffect(() => { fetchDraft() }, [fetchDraft])

  const generate = async () => {
    setGenerating(true); setMsg('')
    try {
      const selected = Object.keys(targets).filter(k => targets[k])
      const data = await SocialAutomationAPI.generateContent(draftId, { target_platforms: selected, tone: tone || undefined, generate_thumbnail: generateThumbnail })
      setDraft(data)
      setContent(data.edited || data.generated || {})
      setMsg('✅ Content generated — review and edit below')
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Generation failed'))
      // The backend may have still saved partial results before the
      // failure (e.g. a marketing post's caption succeeded but the image
      // didn't) — refetch so that shows up instead of silently vanishing
      // behind a generic error toast, which previously left the admin
      // unable to tell "nothing happened" apart from "half of it worked".
      // Deliberately NOT calling fetchDraft() here — it toggles the
      // page-level `loading` flag, which would blank the whole page
      // (including the error message just set above) behind a full
      // "Loading…" screen for a moment.
      try {
        const data = await SocialAutomationAPI.getDraft(draftId)
        setDraft(data)
        setContent(data.edited || data.generated || {})
      } catch { /* keep showing the original error if even this fails */ }
    } finally {
      setGenerating(false)
    }
  }

  const updateField = (platform: string, field: string, value: any) => {
    setContent((c: any) => ({ ...c, [platform]: { ...(c[platform] || {}), [field]: value } }))
  }

  const saveEdits = async () => {
    try {
      await SocialAutomationAPI.updateDraftContent(draftId, {
        facebook: content.facebook, instagram: content.instagram, youtube: content.youtube, youtube_community: content.youtube_community,
      })
      setMsg('✅ Edits saved')
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Could not save edits'))
    }
  }

  const submit = async () => {
    setSubmitting(true); setMsg('')
    try {
      await saveEdits()
      // youtube_community is never a real publish target — it's a
      // copy-paste caption only, so it's excluded from the approval that
      // actually drives publishing.
      const { youtube_community, ...publishTargets } = targets
      await SocialAutomationAPI.submitForApproval(draftId, { platform_targets: publishTargets })
      setMsg('✅ Submitted for approval')
      router.push('/dashboard/super/social-automation/approvals')
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Submit failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const deleteDraft = async () => {
    if (!confirm('Delete this draft? This can\'t be undone.')) return
    try {
      await SocialAutomationAPI.deleteDraft(draftId)
      router.push('/dashboard/super/social-automation')
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Could not delete draft'))
    }
  }

  const copyCaption = async (platform: string) => {
    const text = [content[platform]?.caption, (content[platform]?.hashtags || []).join(' ')].filter(Boolean).join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setMsg('✅ Copied — paste it into YouTube Studio\'s Community tab')
    } catch {
      setMsg('❌ Could not copy — select and copy the text manually')
    }
  }

  if (!draftId || loading) return <div className="page"><Loading label="Loading draft…"/></div>
  if (error || !draft) return <div className="page"><div style={{ color: '#ef4444', padding: 20 }}>{error || 'Draft not found'}</div></div>

  const hasContent = !!draft.generated

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Link href="/dashboard/super/social-automation" style={{ fontSize: 12, color: 'var(--nx-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Social Automation
        </Link>
        {draft.status !== 'publishing' && draft.status !== 'scheduled' && (
          <button type="button" className="btn btn-g btn-sm" style={{ color: '#ef4444' }} onClick={deleteDraft}>
            <FontAwesomeIcon icon={faTrash} className="mr-1.5" />Delete draft
          </button>
        )}
      </div>

      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13,
          background: msg.startsWith('✅') ? 'rgba(39,216,109,.1)' : 'rgba(255,90,90,.1)',
          color: msg.startsWith('✅') ? '#16a34a' : '#ef4444',
          border: `1px solid ${msg.startsWith('✅') ? 'rgba(39,216,109,.35)' : 'rgba(255,90,90,.35)'}` }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>
        <div className="card" style={{ padding: 16 }}>
          {!isMarketing && draft.video?.view_url && (
            <video src={draft.video.view_url} controls style={{ width: '100%', borderRadius: 10, marginBottom: 12, background: '#000' }} />
          )}
          {isMarketing ? (
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--nx-orange)', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 4 }}>Marketing post</div>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{draft.video?.filename}</div>
          )}
          <div style={{ fontSize: 12, color: 'var(--nx-muted)', marginBottom: 12 }}>{draft.source_notes || 'No notes provided'}</div>
          {isMarketing && draft.link_url && (
            <a href={draft.link_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--nx-orange)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, wordBreak: 'break-all' }}>
              <FontAwesomeIcon icon={faLink} /> {draft.link_url}
            </a>
          )}
          {draft.image?.view_url && (
            <img src={draft.image.view_url} alt="Generated graphic" style={{ width: '100%', borderRadius: 10 }} />
          )}
          {!draft.image?.view_url && draft.image?.error && (
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)' }}>
              <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>Image generation failed: {draft.image.error}</div>
              <button type="button" className="btn btn-g btn-sm" onClick={generate} disabled={generating}>
                {generating ? 'Retrying…' : 'Retry generation'}
              </button>
            </div>
          )}
        </div>

        <div>
          {!hasContent && (
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Generate content</h3>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                {platforms.map(p => (
                  <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <input type="checkbox" checked={!!targets[p.key]} onChange={e => setTargets(t => ({ ...t, [p.key]: e.target.checked }))} />
                    <FontAwesomeIcon icon={p.icon} style={{ color: p.color }} /> {p.label}
                  </label>
                ))}
              </div>
              <input placeholder="Optional tone (e.g. energetic, professional, warm)" value={tone} onChange={e => setTone(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
              {isMarketing ? (
                <div style={{ fontSize: 12, color: 'var(--nx-muted)', marginBottom: 14 }}>An image (OpenAI) is generated automatically for every marketing post — it's the post itself, not an optional thumbnail.</div>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 14 }}>
                  <input type="checkbox" checked={generateThumbnail} onChange={e => setGenerateThumbnail(e.target.checked)} /> Generate a thumbnail (OpenAI) — used as the cover/thumbnail on Facebook, Instagram &amp; YouTube alike
                </label>
              )}
              <button className="btn btn-p" onClick={generate} disabled={generating || !Object.values(targets).some(Boolean)}>
                {generating ? 'Generating…' : <><FontAwesomeIcon icon={faWandMagicSparkles} className="mr-1.5" />Generate</>}
              </button>
            </div>
          )}

          {hasContent && platforms.filter(p => content[p.key]).map(p => (
            <div key={p.key} className="card" style={{ padding: 18, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <FontAwesomeIcon icon={p.icon} style={{ color: p.color }} />
                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.label}</div>
                {p.key === 'youtube_community' && (
                  <button type="button" className="btn btn-g btn-sm" style={{ marginLeft: 'auto' }} onClick={() => copyCaption('youtube_community')}>
                    <FontAwesomeIcon icon={faCopy} className="mr-1.5" />Copy
                  </button>
                )}
              </div>
              {p.key === 'youtube' && (
                <input placeholder="Title" value={content.youtube?.title || ''} onChange={e => updateField('youtube', 'title', e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
              )}
              <textarea
                rows={4}
                placeholder={p.key === 'facebook' ? 'Description' : p.key === 'youtube' ? 'Description' : 'Caption'}
                value={content[p.key]?.[p.key === 'facebook' || p.key === 'youtube' ? 'description' : 'caption'] || ''}
                onChange={e => updateField(p.key, p.key === 'facebook' || p.key === 'youtube' ? 'description' : 'caption', e.target.value)}
                style={{ width: '100%', resize: 'vertical', marginBottom: 8 }}
              />
              <input
                placeholder={p.key === 'youtube' ? 'Tags (comma separated)' : 'Hashtags (space separated)'}
                value={p.key === 'youtube' ? (content.youtube?.tags || []).join(', ') : (content[p.key]?.hashtags || []).join(' ')}
                onChange={e => updateField(p.key, p.key === 'youtube' ? 'tags' : 'hashtags', p.key === 'youtube' ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : e.target.value.split(/\s+/).filter(Boolean))}
                style={{ width: '100%' }}
              />
              {p.key === 'youtube_community' && (
                <div style={{ fontSize: 11, color: 'var(--nx-muted)', marginTop: 8 }}>YouTube has no API to publish Community posts automatically — copy this and the image above into YouTube Studio manually.</div>
              )}
            </div>
          ))}

          {hasContent && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-g" onClick={saveEdits}>Save edits</button>
                <button className="btn btn-p" onClick={submit} disabled={submitting || !(targets.facebook || targets.instagram || targets.youtube)}>
                  {submitting ? 'Submitting…' : <><FontAwesomeIcon icon={faPaperPlane} className="mr-1.5" />Submit for Approval</>}
                </button>
              </div>
              {!(targets.facebook || targets.instagram || targets.youtube) && (
                <div style={{ fontSize: 11, color: 'var(--nx-muted)' }}>Only a YouTube Community caption was generated — there's nothing here to submit for approval/publishing. Copy the caption above manually, or generate Facebook/Instagram content too.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
