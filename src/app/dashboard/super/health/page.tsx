'use client'
import { useState, useEffect } from 'react'
import { SuperAdminAPI } from '@/lib/api'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsRotate, faCircleCheck, faTriangleExclamation, faCircleXmark } from '@fortawesome/free-solid-svg-icons'

export default function SuperHealthPage() {
  const [health,    setHealth]    = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [lastCheck, setLastCheck] = useState<string>('')

  const fetchHealth = async () => {
    setLoading(true); setError('')
    try {
      const data = await SuperAdminAPI.getHealth()
      setHealth(data)
      setLastCheck(new Date().toLocaleTimeString())
    } catch(e: any) {
      setError(e.message || 'Failed to fetch health status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    // Auto-refresh every 30s
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const statusColor = (s: string) =>
    s === 'ok' ? '#10b981' : s === 'degraded' ? '#f59e0b' : '#ef4444'

  const statusLabel = (s: string) =>
    s === 'ok' ? 'Healthy' : s === 'degraded' ? 'Degraded' : 'Error'

  return (
    <div className="page">
      {/* NIA Color: var(--nx-orange) */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:18,fontWeight:800}}>System Health</h2>
          <p style={{fontSize:13,color:'#9ca3af'}}>Live status of all services · Auto-refreshes every 30s</p>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {lastCheck&&<span style={{fontSize:12,color:'#9ca3af'}}>Last check: {lastCheck}</span>}
          <button className="btn btn-g btn-sm" onClick={fetchHealth} disabled={loading}>
            {loading?'Checking…':<><FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5"/>Refresh Now</>}
          </button>
        </div>
      </div>

      {error&&<div style={{background:'rgba(255,90,90,.1)',border:'1px solid rgba(255,90,90,.3)',borderRadius:10,padding:'10px 14px',marginBottom:12,color:'#ef4444',fontSize:13}}>{error}</div>}

      {/* Overall status */}
      {health&&(
        <div style={{
          background: health.overall==='ok'
            ? 'linear-gradient(135deg,#10b981,#059669)'
            : health.overall==='degraded'
            ? 'linear-gradient(135deg,#f59e0b,#d97706)'
            : 'linear-gradient(135deg,#ef4444,#dc2626)',
          borderRadius:12, padding:'16px 20px', marginBottom:16,
          display:'flex', alignItems:'center', gap:12
        }}>
          <div style={{fontSize:32}}><FontAwesomeIcon icon={health.overall==='ok'?faCircleCheck:health.overall==='degraded'?faTriangleExclamation:faCircleXmark}/></div>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:'#fff'}}>
              System {statusLabel(health.overall)}
            </div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.7)',marginTop:2}}>
              {health.checked_at ? `Last checked: ${new Date(health.checked_at).toLocaleString()}` : ''}
            </div>
          </div>
        </div>
      )}

      {/* Services */}
      <div className="card">
        <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Service Status</div>
        {loading&&!health
          ?[...Array(6)].map((_,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid #f3f4f6'}}>
              <div style={{height:14,background:'rgba(255,255,255,.06)',borderRadius:4,width:'30%'}}/>
              <div style={{height:14,background:'rgba(255,255,255,.06)',borderRadius:4,width:'15%'}}/>
            </div>
          ))
          :(health?.services||[]).map((svc: any, i: number)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'12px 0',borderBottom:'1px solid #f3f4f6'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:10,height:10,borderRadius:'50%',
                  background:statusColor(svc.status),
                  boxShadow:`0 0 6px ${statusColor(svc.status)}`}}/>
                <span style={{fontSize:13,fontWeight:600}}>{svc.name}</span>
              </div>
              <div style={{display:'flex',gap:16,alignItems:'center'}}>
                {svc.latency_ms&&(
                  <span style={{fontSize:12,color:'#9ca3af'}}>{svc.latency_ms}ms</span>
                )}
                {svc.error&&(
                  <span style={{fontSize:12,color:'#ef4444'}}>{svc.error}</span>
                )}
                <span style={{fontSize:12,fontWeight:600,color:statusColor(svc.status)}}>
                  {statusLabel(svc.status)}
                </span>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}
