'use client'
import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons'
import { SocialAutomationAPI } from '@/lib/api'

// Deliberately NOT nested under dashboard/ — this page only ever renders
// inside the small OAuth popup window opened from the Connections tab
// (see connections/page.tsx::openOAuthPopup), so it skips the dashboard
// shell (sidebar/topbar/auth-redirect gates) entirely. Auth still works
// here since apiFetch reads the JWT from localStorage/sessionStorage
// directly, not from a dashboard-layout-provided React context.
//
// IMPORTANT: every --nx-* CSS variable and the .card/.btn classes are
// defined only in dashboard/dashboard-globals.css, which is imported
// exclusively by dashboard/layout.tsx — this page is outside that tree
// and never loads it, so those references silently resolve to nothing.
// (Root globals.css's own `body` rule then sets a near-white `color`
// meant for its dark navy background, making unstyled text invisible
// against a light card.) All styling below is therefore hardcoded
// inline, matching the backend's own _oauth_popup_html popup-closing
// page, which has the same standalone constraint.
export default function FacebookPagePickerPopup() {
  const [sessionId, setSessionId] = useState('')
  const [pages, setPages] = useState<any[]>([])
  const [selectedPageId, setSelectedPageId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setSessionId(params.get('session_id') || '')
  }, [])

  const fetchPages = useCallback(async () => {
    if (!sessionId) return
    setLoading(true); setError('')
    try {
      const data = await SocialAutomationAPI.getFacebookSessionPages(sessionId)
      setPages(data || [])
    } catch (e: any) {
      setError(e.message || 'Could not load Facebook Pages — this session may have expired. Close this window and try connecting again.')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => { fetchPages() }, [fetchPages])

  const notifyOpenerAndClose = (payload: any) => {
    const fallbackUrl = `${window.location.origin}/dashboard/super/social-automation/connections`
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'SOCIAL_OAUTH_RESULT', platform: 'facebook', payload }, window.location.origin)
        setTimeout(() => window.close(), 300)
      } else {
        window.location.href = fallbackUrl
      }
    } catch {
      window.location.href = fallbackUrl
    }
  }

  const confirm = async () => {
    if (!selectedPageId) return
    setConfirming(true); setError('')
    try {
      const selected = pages.find(p => p.page_id === selectedPageId)
      const result = await SocialAutomationAPI.selectFacebookPage({
        session_id: sessionId,
        page_id: selectedPageId,
        instagram_account_id: selected?.instagram_account_id || undefined,
      })
      notifyOpenerAndClose({ ok: true, ...result })
    } catch (e: any) {
      setError(e.message || 'Could not save the selected Page')
      setConfirming(false)
    }
  }

  const cancel = () => notifyOpenerAndClose({ ok: false, error: 'cancelled' })

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 420, width: '100%', padding: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, boxShadow: '0 12px 28px rgba(0,0,0,.08)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6, color: '#0f172a' }}>Choose a Facebook Page</h3>
        <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 16 }}>
          Posts go to this Page's timeline. Its linked Instagram Business account (if any) connects automatically.
        </p>

        {loading && <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: 20 }}>Loading Pages…</div>}

        {!loading && error && <div style={{ fontSize: 13, color: '#ef4444', marginBottom: 14 }}>{error}</div>}

        {!loading && !error && pages.length === 0 && (
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
            No Pages found — make sure the Facebook login you used manages at least one Page.
          </div>
        )}

        {!loading && pages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {pages.map(p => (
              <label
                key={p.page_id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                  border: `1px solid ${selectedPageId === p.page_id ? '#ff5c12' : '#e2e8f0'}`, cursor: 'pointer',
                }}
              >
                <input type="radio" name="fb-page" checked={selectedPageId === p.page_id} onChange={() => setSelectedPageId(p.page_id)} />
                <FontAwesomeIcon icon={faFacebook} style={{ color: '#1877f2' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{p.page_name}</div>
                  {p.has_instagram && (
                    <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FontAwesomeIcon icon={faInstagram} style={{ color: '#e1306c' }} /> @{p.instagram_username}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={cancel}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={!selectedPageId || confirming}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, color: '#fff',
              background: (!selectedPageId || confirming) ? '#fdb494' : '#ff5c12',
              cursor: (!selectedPageId || confirming) ? 'not-allowed' : 'pointer',
            }}
          >
            {confirming ? 'Connecting…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
