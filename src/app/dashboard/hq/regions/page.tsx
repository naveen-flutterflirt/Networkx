'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsRotate, faChartBar, faMap, faUser } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react'
import { TerritoriesAPI, MasterDataAPI } from '@/lib/api'
import UserSearchPicker from '@/components/ui/UserSearchPicker'

// Defined OUTSIDE HQRegionsPage — same focus-loss bug class as the
// original Travel Connect fix.
function FranchiseField({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  return (
    <UserSearchPicker
      label="Franchise Owner"
      roleFilter="franchise"
      placeholder="Search franchise owner by name or city…"
      value={value}
      onChange={(id) => onChange(id)}
    />
  )
}

export default function HQRegionsPage() {
  const [territories,   setTerritories]   = useState<any[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [selected,      setSelected]      = useState<any|null>(null)
  const [stats,         setStats]         = useState<any|null>(null)
  const [showCreate,    setShowCreate]    = useState(false)
  const [editing,       setEditing]       = useState<any|null>(null)
  const [saving,        setSaving]        = useState(false)
  const [msg,           setMsg]           = useState('')
  const [tForm, setTForm] = useState({
    name:'', franchise_id:'', city:'', state:'', country:'India', royalty_pct:15
  })

  const COLORS   = ['#6366f1','var(--nx-orange)','#10b981','#f59e0b','#8b5cf6','#14b8a6','#ec4899']
  const [countries, setCountries] = useState(['India','USA','UK','UAE','Singapore','Canada','Australia','Germany','France','Japan'])

  useEffect(() => {
    fetchTerritories()
    MasterDataAPI.get('country').then(res => {
      const vals = (res.items || []).map((i: any) => i.value)
      if (vals.length) setCountries(vals)
    }).catch(() => {})
  }, [])

  const fetchTerritories = async () => {
    setLoading(true); setError('')
    try {
      const res = await TerritoriesAPI.list({ page:1, page_size:50 })
      setTerritories(res.items || res)
    } catch (e: any) { setError(e.message || 'Failed to load') }
    finally { setLoading(false) }
  }

  const openStats = async (t: any) => {
    setSelected(t); setStats(null)
    try { const s = await TerritoriesAPI.stats(t.id); setStats(s) } catch {}
  }

  const createTerritory = async () => {
    if (!tForm.name || !tForm.city) return
    setSaving(true)
    try {
      await TerritoriesAPI.create(tForm)
      setShowCreate(false)
      setTForm({ name:'', franchise_id:'', city:'', state:'', country:'India', royalty_pct:15 })
      setMsg('✅ Territory created!')
      fetchTerritories()
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const updateTerritory = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await TerritoriesAPI.update(editing.id, {
        name:         editing.name,
        franchise_id: editing.franchise_id,
        city:         editing.city,
        state:        editing.state,
        country:      editing.country,
        royalty_pct:  editing.royalty_pct,
        status:       editing.status,
      })
      setEditing(null)
      setMsg('✅ Territory updated!')
      fetchTerritories()
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const deleteTerritory = async (id: string, name: string) => {
    if (!confirm(`Delete territory "${name}"?\n\nThis cannot be undone.`)) return
    try {
      await TerritoriesAPI.delete(id)
      setMsg('✅ Territory deleted')
      fetchTerritories()
    } catch (e: any) { setMsg('❌ ' + e.message) }
  }

  const getFranchiseName = (id: string) => id ? id.slice(0,16) : '— Not assigned'

  const totalMembers = territories.reduce((a,t) => a + (t.members_count||0), 0)
  const totalRevenue = territories.reduce((a,t) => a + (t.monthly_collection||0), 0)

  return (
    <div className="page">

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:18,fontWeight:800}}>Regions</h2>
          <p style={{fontSize:13,color:'#9ca3af'}}>Revenue by territory, membership growth and expansion potential</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-g btn-sm" onClick={fetchTerritories}><FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5"/>Refresh</button>
          <button className="btn btn-p" onClick={() => setShowCreate(true)}>+ Add Territory</button>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div className="toast-in" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,marginBottom:12,fontSize:13,
          background:msg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
          color:msg.startsWith('✅')?'#16a34a':'#ef4444',
          border:`1px solid ${msg.startsWith('✅')?'rgba(39,216,109,.35)':'rgba(255,90,90,.35)'}`}}>
          {msg}
          <button style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}}
            onClick={() => setMsg('')}>✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
        {[
          {l:'Total Territories', v:territories.length,                      c:'#6366f1'},
          {l:'Total Members',     v:totalMembers.toLocaleString(),            c:'#10b981'},
          {l:'Monthly Revenue',   v:'₹'+Math.round(totalRevenue/100000)+'L', c:'#ff4b0a'},
        ].map(s => (
          <div key={s.l} style={{background:`linear-gradient(135deg,${s.c},${s.c}cc)`,borderRadius:12,padding:'14px 16px',boxShadow:`0 2px 4px rgba(0,0,0,.35), 0 14px 32px -10px ${s.c}66, inset 0 1px 0 rgba(255,255,255,.18)`}}>
            <div style={{fontSize:26,fontWeight:800,color:'#fff'}}>{s.v}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.8)',marginTop:4}}>{s.l}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{background:'rgba(255,90,90,.1)',border:'1px solid rgba(255,90,90,.3)',borderRadius:10,padding:'10px 14px',marginBottom:12,color:'#ef4444',fontSize:13}}>
          {error} <button className="btn btn-xs btn-g" onClick={fetchTerritories}>Retry</button>
        </div>
      )}

      {/* Territory Cards */}
      {loading
        ? <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
            {[...Array(6)].map((_,i) => (
              <div key={i} className="card" style={{height:180}}>
                <div style={{height:14,background:'rgba(255,255,255,.06)',borderRadius:4,width:'60%',marginBottom:8}}/>
                <div style={{height:11,background:'rgba(255,255,255,.04)',borderRadius:4,width:'80%',marginBottom:6}}/>
                <div style={{height:11,background:'rgba(255,255,255,.04)',borderRadius:4,width:'50%'}}/>
              </div>
            ))}
          </div>
        : territories.length === 0
        ? <div className="card" style={{textAlign:'center',padding:40,color:'#9ca3af'}}>
            <div style={{fontSize:32,marginBottom:8}}><FontAwesomeIcon icon={faMap}/></div>
            <div>No territories yet — add your first one</div>
          </div>
        : <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
            {territories.map((t, idx) => {
              const color = COLORS[idx % COLORS.length]
              return (
                <div key={t.id} className="card" style={{borderTop:`3px solid ${color}`}}>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:2}}>{t.name}</div>
                  <div style={{fontSize:11,color:'#9ca3af',marginBottom:2}}>
                    {[t.city, t.state, t.country].filter(Boolean).join(', ')}
                  </div>
                  {t.franchise_id && (
                    <div style={{fontSize:11,color:'#6366f1',marginBottom:8}}>
                      <FontAwesomeIcon icon={faUser} className="mr-1"/>{getFranchiseName(t.franchise_id)}
                    </div>
                  )}
                  {[
                    ['Groups',  t.groups_count||0,  '#cbd5e1'],
                    ['Members', t.members_count||0,  '#cbd5e1'],
                    ['Monthly', '₹'+Math.round((t.monthly_collection||0)/100000)+'L', color],
                    ['Royalty', `${t.royalty_pct||15}%`, '#9ca3af'],
                  ].map(([l,v,c]) => (
                    <div key={String(l)} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid #f3f4f6'}}>
                      <span style={{fontSize:12,color:'#9ca3af'}}>{l}</span>
                      <span style={{fontSize:12,fontWeight:700,color:c as string}}>{v}</span>
                    </div>
                  ))}
                  <div style={{marginTop:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span className={`badge ${t.status==='active'||!t.status?'b-green':'b-yellow'}`} style={{fontSize:10}}>
                      {t.status||'active'}
                    </span>
                    <div style={{display:'flex',gap:4}}>
                      <button className="btn btn-xs btn-g" onClick={() => openStats(t)}>Stats</button>
                      <button className="btn btn-xs btn-g" onClick={() => setEditing({...t})}>Edit</button>
                      <button className="btn btn-xs btn-g" style={{color:'#ef4444'}}
                        onClick={() => deleteTerritory(t.id, t.name)}>Delete</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
      }

      {/* Revenue Heatmap */}
      {territories.length > 0 && (
        <div className="card" style={{marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faChartBar} className="mr-1.5"/>Revenue by Territory</div>
          {territories.map((t, idx) => {
            const maxRev = Math.max(...territories.map(x => x.monthly_collection||0), 1)
            const color  = COLORS[idx % COLORS.length]
            const val    = t.monthly_collection||0
            return (
              <div key={t.id} style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:13,fontWeight:600}}>{t.name}</span>
                  <span style={{fontSize:12,fontWeight:700,color:'#10b981'}}>₹{Math.round(val/100000)}L/mo</span>
                </div>
                <div style={{height:20,background:'rgba(255,255,255,.06)',borderRadius:6,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${(val/maxRev)*100}%`,background:color,borderRadius:6,opacity:.8,transition:'width .5s'}}/>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Stats Modal */}
      {selected && (
        <div className="overlay" onClick={e => e.target===e.currentTarget && setSelected(null)}>
          <div className="modal modal-lg">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}><FontAwesomeIcon icon={faChartBar} className="mr-1.5"/>{selected.name}</h3>
            <div className="form-grid" style={{marginBottom:14}}>
              {[
                ['City',            selected.city||'—'],
                ['State',           selected.state||'—'],
                ['Country',         selected.country||'—'],
                ['Status',          selected.status||'active'],
                ['Franchise Owner', getFranchiseName(selected.franchise_id)],
                ['Groups',          selected.groups_count||0],
                ['Members',         selected.members_count||0],
                ['Royalty %',       `${selected.royalty_pct||15}%`],
                ['Monthly Revenue', `₹${Math.round((selected.monthly_collection||0)/100000)}L`],
              ].map(([k,v]) => (
                <div key={String(k)}>
                  <div style={{fontSize:11,color:'#9ca3af',marginBottom:2}}>{k}</div>
                  <div style={{fontSize:13,fontWeight:600}}>{String(v)}</div>
                </div>
              ))}
            </div>
            {stats && (
              <div style={{background:'rgba(255,255,255,.04)',borderRadius:10,padding:12,marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>Financial Breakdown</div>
                <div className="form-grid">
                  {[
                    ['Total Revenue',  `₹${Math.round((stats.total_revenue||0)/100000)}L`],
                    ['Royalty Amount', `₹${Math.round((stats.royalty_amount||0)/100000)}L`],
                    ['Net Revenue',    `₹${Math.round((stats.net_revenue||0)/100000)}L`],
                  ].map(([k,v]) => (
                    <div key={String(k)}>
                      <div style={{fontSize:11,color:'#9ca3af',marginBottom:2}}>{k}</div>
                      <div style={{fontSize:15,fontWeight:800,color:'#10b981'}}>{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-g btn-sm" onClick={() => { setEditing({...selected}); setSelected(null) }}>Edit Territory</button>
              <button className="btn btn-g" style={{flex:1}} onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="overlay" onClick={e => e.target===e.currentTarget && setShowCreate(false)}>
          <div className="modal modal-lg">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}>+ Add Territory</h3>
            <div className="form-grid">
              <div className="fg">
                <label>Territory Name *</label>
                <input value={tForm.name} onChange={e => setTForm({...tForm,name:e.target.value})}
                  placeholder="e.g. Delhi NCR"/>
              </div>
              <FranchiseField value={tForm.franchise_id} onChange={v => setTForm({...tForm,franchise_id:v})}/>
              <div className="fg">
                <label>City *</label>
                <input value={tForm.city} onChange={e => setTForm({...tForm,city:e.target.value})}
                  placeholder="e.g. Delhi"/>
              </div>
              <div className="fg">
                <label>State</label>
                <input value={tForm.state} onChange={e => setTForm({...tForm,state:e.target.value})}
                  placeholder="e.g. Delhi"/>
              </div>
              <div className="fg">
                <label>Country</label>
                <select value={tForm.country} onChange={e => setTForm({...tForm,country:e.target.value})}>
                  {countries.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="fg">
                <label>HQ Royalty %</label>
                <input type="number" min="0" max="100" value={tForm.royalty_pct}
                  onChange={e => setTForm({...tForm,royalty_pct:Number(e.target.value)})}/>
              </div>
            </div>
            <div style={{display:'flex',gap:8,marginTop:14}}>
              <button className="btn btn-p" style={{flex:1}} onClick={createTerritory}
                disabled={saving||!tForm.name||!tForm.city}>
                {saving?'Creating…':'Create Territory'}
              </button>
              <button className="btn btn-g" style={{flex:1}} onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="overlay" onClick={e => e.target===e.currentTarget && setEditing(null)}>
          <div className="modal modal-lg">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}>Edit Territory — {editing.name}</h3>
            <div className="form-grid">
              <div className="fg">
                <label>Territory Name *</label>
                <input value={editing.name||''}
                  onChange={e => setEditing({...editing,name:e.target.value})}/>
              </div>
              <FranchiseField value={editing.franchise_id||''} onChange={v => setEditing({...editing,franchise_id:v})}/>
              <div className="fg">
                <label>City</label>
                <input value={editing.city||''} onChange={e => setEditing({...editing,city:e.target.value})}/>
              </div>
              <div className="fg">
                <label>State</label>
                <input value={editing.state||''} onChange={e => setEditing({...editing,state:e.target.value})}/>
              </div>
              <div className="fg">
                <label>Country</label>
                <select value={editing.country||'India'} onChange={e => setEditing({...editing,country:e.target.value})}>
                  {countries.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="fg">
                <label>HQ Royalty %</label>
                <input type="number" min="0" max="100" value={editing.royalty_pct||15}
                  onChange={e => setEditing({...editing,royalty_pct:Number(e.target.value)})}/>
              </div>
              <div className="fg">
                <label>Status</label>
                <select value={editing.status||'active'} onChange={e => setEditing({...editing,status:e.target.value})}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="new">New</option>
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:8,marginTop:14}}>
              <button className="btn btn-p" style={{flex:1}} onClick={updateTerritory} disabled={saving}>
                {saving?'Saving…':'Save Changes'}
              </button>
              <button className="btn btn-g" style={{flex:1}} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
