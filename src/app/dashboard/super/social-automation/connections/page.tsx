'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebook, faInstagram, faYoutube } from '@fortawesome/free-brands-svg-icons'
import { faCircleCheck, faCircleXmark, faArrowsRotate, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { SocialAutomationAPI } from '@/lib/api'

type PlatformKey = 'facebook' | 'instagram' | 'youtube'

const PLATFORM_META: Record<PlatformKey, { label: string; icon: any; color: string }> = {
  facebook: { label: 'Facebook', icon: faFacebook, color: '#1877f2' },
  instagram: { label: 'Instagram', icon: faInstagram, color: '#e1306c' },
  youtube: { label: 'YouTube', icon: faYoutube, color: '#ff0000' },
}

export default function SocialConnectionsPage() {
  const [status, setStatus] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [connecting, setConnecting] = useState<PlatformKey | null>(null)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const data = await SocialAutomationAPI.getConnectionsStatus()
      setStatus(data || {})
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Failed to load connection status'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      const data = event.data
      if (!data || data.type !== 'SOCIAL_OAUTH_RESULT') return
      const { platform, payload } = data
      if (!payload?.ok) {
        if (payload?.error !== 'cancelled') {
          setMsg(`❌ ${platform === 'facebook' ? 'Facebook' : 'YouTube'} connection failed: ${payload?.error || 'unknown error'}`)
        }
        setConnecting(null)
        return
      }
      // Facebook's popup now handles Page selection itself (see
      // /social-connect/facebook-pages) and only notifies us once a Page
      // has actually been saved — nothing left to do here but refresh.
      if (platform === 'facebook') {
        setMsg('✅ Facebook (and Instagram, if linked) connected')
        fetchStatus()
      } else if (platform === 'youtube') {
        setMsg(`✅ YouTube connected — ${payload.channel_name || 'channel'}`)
        fetchStatus()
      }
      setConnecting(null)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [fetchStatus])

  const openOAuthPopup = async (platform: PlatformKey) => {
    setMsg(''); setConnecting(platform)
    try {
      const { url } = platform === 'facebook'
        ? await SocialAutomationAPI.getFacebookConnectUrl()
        : await SocialAutomationAPI.getYoutubeConnectUrl()
      window.open(url, `${platform}_oauth`, 'width=600,height=700')
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Could not start connection'))
      setConnecting(null)
    }
  }

  const disconnect = async (platform: PlatformKey) => {
    if (!confirm(`Disconnect ${PLATFORM_META[platform].label}? You'll need to reconnect to publish there again.`)) return
    try {
      await SocialAutomationAPI.disconnectPlatform(platform)
      setMsg(`✅ ${PLATFORM_META[platform].label} disconnected`)
      fetchStatus()
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Disconnect failed'))
    }
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Link href="/dashboard/super/social-automation" style={{ fontSize: 12, color: 'var(--nx-muted)', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Social Automation
          </Link>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Connections</h2>
          <p style={{ fontSize: 13, color: 'var(--nx-muted)' }}>Connect the Facebook Page, Instagram Business account, and YouTube channel this tool publishes to.</p>
        </div>
        <button className="btn btn-g btn-sm" onClick={fetchStatus} disabled={loading}><FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5" />Refresh</button>
      </div>

      {msg && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13,
          background: msg.startsWith('✅') ? 'rgba(39,216,109,.1)' : 'rgba(255,90,90,.1)',
          color: msg.startsWith('✅') ? '#16a34a' : '#ef4444',
          border: `1px solid ${msg.startsWith('✅') ? 'rgba(39,216,109,.35)' : 'rgba(255,90,90,.35)'}` }}>
          {msg}
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nx-muted)' }} onClick={() => setMsg('')}>✕</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {(['facebook', 'instagram', 'youtube'] as PlatformKey[]).map(platform => {
          const meta = PLATFORM_META[platform]
          const s = status[platform] || {}
          const connected = !!s.connected
          return (
            <div key={platform} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <FontAwesomeIcon icon={meta.icon} style={{ fontSize: 22, color: meta.color }} />
                <div style={{ fontWeight: 700, fontSize: 15 }}>{meta.label}</div>
                <div style={{ marginLeft: 'auto' }}>
                  <FontAwesomeIcon icon={connected ? faCircleCheck : faCircleXmark} style={{ color: connected ? '#10b981' : '#9ca3af' }} />
                </div>
              </div>
              {connected ? (
                <>
                  <div style={{ fontSize: 13, color: 'var(--nx-ink)', marginBottom: 4 }}>
                    {s.page_name || s.channel_name || s.ig_username || 'Connected'}
                  </div>
                  {s.connected_at && <div style={{ fontSize: 11, color: 'var(--nx-muted)', marginBottom: 12 }}>Connected {new Date(s.connected_at).toLocaleDateString()}</div>}
                  {s.last_error && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 12 }}>{s.last_error}</div>}
                  {platform !== 'instagram' && (
                    <button className="btn btn-g btn-sm" style={{ color: '#ef4444' }} onClick={() => disconnect(platform)}>Disconnect</button>
                  )}
                  {platform === 'instagram' && (
                    <div style={{ fontSize: 11, color: 'var(--nx-muted)' }}>Linked via the connected Facebook Page — disconnect Facebook to remove it.</div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: 'var(--nx-muted)', marginBottom: 12 }}>
                    {platform === 'instagram' ? 'Connects automatically when you connect Facebook, if a Page has a linked Instagram Business account.' : 'Not connected yet.'}
                  </div>
                  {platform !== 'instagram' && (
                    <button className="btn btn-p btn-sm" disabled={connecting === platform} onClick={() => openOAuthPopup(platform)}>
                      {connecting === platform ? 'Connecting…' : `Connect ${meta.label}`}
                    </button>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
