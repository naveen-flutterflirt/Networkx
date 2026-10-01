'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons'
// NIA Brand colors: var(--nx-orange) (primary), #6366f1 (accent), #10b981 (success)
import { useState, useEffect } from 'react'
import { SuperAdminAPI } from '@/lib/api'

export default function SuperTogglesPage() {
  const [toggles,  setToggles]  = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [updating, setUpdating] = useState<string|null>(null)
  const [search,   setSearch]   = useState('')
  const [msg,      setMsg]      = useState('')

  const fetchToggles = async () => {
    setLoading(true); setError('')
    try {
      const data = await SuperAdminAPI.getToggles()
      setToggles(Array.isArray(data) ? data : data.items || [])
    } catch(e: any) {
      setError(e.message || 'Failed to load feature toggles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchToggles() }, [])

  const handleToggle = async (key: string, current: boolean) => {
    setUpdating(key); setMsg('')
    try {
      await SuperAdminAPI.updateToggle(key, !current)
      setToggles(prev => prev.map(t =>
        t.id === key ? {...t, is_enabled: !current} : t
      ))
      setMsg(`✅ "${key}" ${!current ? 'enabled' : 'disabled'}`)
      setTimeout(() => setMsg(''), 2000)
    } catch(e: any) {
      setMsg(`❌ ${e.message || 'Failed to update toggle'}`)
    } finally {
      setUpdating(null)
    }
  }

  const enableAll = async () => {
    for (const t of toggles.filter(x => !x.is_enabled)) {
      await SuperAdminAPI.updateToggle(t.id, true)
    }
    await fetchToggles()
    setMsg('✅ All features enabled')
  }

  const disableAll = async () => {
    if (!confirm('Disable ALL features? This will affect all users.')) return
    for (const t of toggles.filter(x => x.is_enabled)) {
      await SuperAdminAPI.updateToggle(t.id, false)
    }
    await fetchToggles()
    setMsg('✅ All features disabled')
  }

  const filtered = toggles.filter(t =>
    !search ||
    t.label?.toLowerCase().includes(search.toLowerCase()) ||
    t.id?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  )

  const enabledCount  = toggles.filter(t => t.is_enabled).length
  const disabledCount = toggles.filter(t => !t.is_enabled).length

  return (
    <div className="page">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:18,fontWeight:800}}>Feature Toggles</h2>
          <p style={{fontSize:13,color:'#9ca3af'}}>Enable or disable platform features globally · Changes take effect immediately</p>
        </div>
        <button className="btn btn-g btn-sm" onClick={fetchToggles} disabled={loading}><FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5"/>Refresh</button>
        <button className="btn btn-g btn-sm" style={{color:'#10b981'}} onClick={enableAll}>Enable All</button>
        <button className="btn btn-g btn-sm" style={{color:'#ef4444'}} onClick={disableAll}>Disable All</button>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
        {[
          {l:'Total Features', v:toggles.length,  c:'#6366f1'},
          {l:'Enabled',        v:enabledCount,     c:'#10b981'},
          {l:'Disabled',       v:disabledCount,    c:'#9ca3af'},
        ].map(s=>(
          <div key={s.l} style={{background:`linear-gradient(135deg,${s.c},${s.c}cc)`,borderRadius:12,padding:'14px 16px',boxShadow:`0 2px 4px rgba(0,0,0,.35), 0 14px 32px -10px ${s.c}66, inset 0 1px 0 rgba(255,255,255,.18)`}}>
            <div style={{fontSize:26,fontWeight:800,color:'#fff'}}>{s.v}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.8)',marginTop:4}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{marginBottom:14}}>
        <input placeholder="Search features..." value={search}
          onChange={e=>setSearch(e.target.value)} style={{maxWidth:320}}/>
      </div>

      {/* Status message */}
      {msg&&<div className="toast-in" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,marginBottom:12,fontSize:13,
        background:msg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
        color:msg.startsWith('✅')?'#16a34a':'#ef4444',
        border:`1px solid ${msg.startsWith('✅')?'rgba(39,216,109,.35)':'rgba(255,90,90,.35)'}`}}>
        {msg}
        <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--nx-muted)',flexShrink:0}} onClick={()=>setMsg('')}>✕</button>
      </div>}

      {error&&<div style={{background:'rgba(255,90,90,.1)',border:'1px solid rgba(255,90,90,.3)',borderRadius:10,padding:'10px 14px',marginBottom:12,color:'#ef4444',fontSize:13}}>{error}</div>}

      {/* Toggles list */}
      <div className="card">
        {loading
          ?[...Array(6)].map((_,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0',borderBottom:'1px solid #f3f4f6'}}>
              <div>
                <div style={{height:14,background:'rgba(255,255,255,.06)',borderRadius:4,width:180,marginBottom:6}}/>
                <div style={{height:11,background:'rgba(255,255,255,.04)',borderRadius:4,width:260}}/>
              </div>
              <div style={{width:44,height:24,background:'rgba(255,255,255,.06)',borderRadius:99}}/>
            </div>
          ))
          :filtered.map((t, i)=>(
            <div key={t.id||i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'14px 0',borderBottom:i<filtered.length-1?'1px solid #f3f4f6':'none'}}>
              <div style={{flex:1,marginRight:16}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontSize:14,fontWeight:600}}>{t.label||t.id}</span>
                  <span style={{fontSize:10,padding:'1px 6px',borderRadius:99,
                    background:t.is_enabled?'#dcfce7':'var(--nx-line)',
                    color:t.is_enabled?'#16a34a':'#9ca3af',fontWeight:600}}>
                    {t.is_enabled?'ON':'OFF'}
                  </span>
                </div>
                {t.description&&<div style={{fontSize:12,color:'#9ca3af'}}>{t.description}</div>}
                {t.roles?.length>0&&(
                  <div style={{display:'flex',gap:4,marginTop:6,flexWrap:'wrap'}}>
                    {t.roles.map((r: string)=>(
                      <span key={r} style={{fontSize:10,padding:'1px 6px',borderRadius:99,
                        background:'rgba(22,143,255,.1)',color:'#3b82f6',fontWeight:600}}>
                        {r}
                      </span>
                    ))}
                  </div>
                )}
                {t.updated_at&&(
                  <div style={{fontSize:11,color:'#9ca3af',marginTop:4}}>
                    Last updated: {new Date(t.updated_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              <button
                onClick={()=>handleToggle(t.id, t.is_enabled)}
                disabled={updating===t.id}
                style={{
                  width:48,height:26,borderRadius:99,border:'none',cursor:'pointer',
                  background:t.is_enabled?'#10b981':'var(--nx-line)',
                  position:'relative',transition:'background .2s',
                  opacity:updating===t.id?.6:1
                }}>
                <div style={{
                  width:20,height:20,borderRadius:'50%',background:'var(--nx-panel)',
                  position:'absolute',top:3,transition:'left .2s',
                  left:t.is_enabled?'24px':'4px',
                  boxShadow:'0 1px 4px rgba(0,0,0,.2)'
                }}/>
              </button>
            </div>
          ))
        }
        {!loading&&filtered.length===0&&(
          <div style={{textAlign:'center',padding:40,color:'#9ca3af'}}>
            No features found {search?`for "${search}"`:''}
          </div>
        )}
      </div>
    </div>
  )
}
