'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowsRotate, faChartBar, faArrowRight, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react'
import { GroupsAPI, TerritoriesAPI, MasterDataAPI } from '@/lib/api'

const STATUS_COLOR: Record<string,string> = { active:'#10b981', new:'#6366f1', suspended:'#ef4444' }
const FALLBACK_COUNTRIES = ['India','USA','UK','UAE','Singapore','Canada','Australia','Germany','France','Japan']

export default function HQGroupsPage() {
  const [groups,       setGroups]       = useState<any[]>([])
  const [territories,  setTerritories]  = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [page,         setPage]         = useState(1)
  const [hasMore,      setHasMore]      = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [countries,    setCountries]    = useState<string[]>(FALLBACK_COUNTRIES)
  const [msg,          setMsg]          = useState('')
  const [saving,       setSaving]       = useState(false)

  // Modals
  const [selected,   setSelected]   = useState<any|null>(null)
  const [stats,      setStats]      = useState<any|null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing,    setEditing]    = useState<any|null>(null)

  // Create form
  const [form, setForm] = useState({
    name: '', territory_id: '',
    city: '', state: '', country: 'India', capacity: 50,
  })

  useEffect(() => {
    fetchGroups(1)
    // Load territories for dropdown
    TerritoriesAPI.list({ page: 1, page_size: 50 })
      .then(res => setTerritories(res.items || res))
      .catch(() => {})
    MasterDataAPI.get('country').then(res => {
      const vals = (res.items || []).map((i: any) => i.value)
      if (vals.length) setCountries(vals)
    }).catch(() => {})
  }, [statusFilter])

  const fetchGroups = async (p = 1) => {
    setLoading(true); setError('')
    try {
      const res = await GroupsAPI.list({ status: statusFilter||undefined, page: p, page_size: 20 })
      setGroups(res.items || res)
      setHasMore(res.has_more || false)
      setPage(p)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  // When territory is selected in create form — auto-fill city, state, country
  const onTerritorySelect = (territory_id: string) => {
    const t = territories.find(t => t.id === territory_id)
    setForm({
      ...form,
      territory_id,
      city:    t?.city    || form.city,
      state:   t?.state   || form.state,
      country: t?.country || form.country,
    })
  }

  const openStats = async (g: any) => {
    setSelected(g); setStats(null)
    try { const s = await GroupsAPI.stats(g.id); setStats(s) } catch {}
  }

  const openEdit = (g: any) => {
    setEditing({
      id:             g.id,
      name:           g.name || '',
      territory_id:   g.territory_id || '',
      city:           g.city || '',
      state:          g.state || '',
      country:        g.country || 'India',
      capacity:       g.capacity || 50,
      status:         g.status || 'active',
    })
  }

  const createGroup = async () => {
    if (!form.name || !form.territory_id || !form.city) return
    setSaving(true)
    try {
      await GroupsAPI.create(form)
      setShowCreate(false)
      setForm({ name:'', territory_id:'', city:'', state:'', country:'India', capacity:50 })
      setMsg('✅ Group created!')
      fetchGroups(1)
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const updateGroup = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await GroupsAPI.update(editing.id, {
        name:           editing.name,
        city:           editing.city,
        state:          editing.state,
        country:        editing.country,
        capacity:       editing.capacity,
        status:         editing.status,
      })
      setEditing(null)
      setMsg('✅ Group updated!')
      fetchGroups(page)
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const deleteGroup = async (id: string, name: string) => {
    if (!confirm(`Delete group "${name}"?\n\nThis cannot be undone.`)) return
    try {
      await GroupsAPI.delete(id)
      setMsg('✅ Group deleted')
      fetchGroups(page)
    } catch (e: any) { setMsg('❌ ' + e.message) }
  }

  // Get territory name by ID for display
  const getTerritoryName = (id: string) =>
    territories.find(t => t.id === id)?.name || id?.slice(0,14) || '—'

  const total     = groups.length
  const active    = groups.filter(g => g.status === 'active').length
  const avgHealth = groups.length
    ? Math.round(groups.reduce((a,g) => a+(g.health_score||0),0) / groups.length) : 0

  return (
    <div className="page">

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:18,fontWeight:800}}>Groups</h2>
          <p style={{fontSize:13,color:'#9ca3af'}}>All NIA groups across territories</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-g btn-sm" onClick={() => fetchGroups(page)}><FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5"/>Refresh</button>
          <button className="btn btn-p" onClick={() => setShowCreate(true)}>+ Create Group</button>
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
          {l:'Total Groups', v:total,          c:'#6366f1'},
          {l:'Active',       v:active,          c:'#10b981'},
          {l:'Avg Health',   v:`${avgHealth}%`, c:'#f59e0b'},
        ].map(s => (
          <div key={s.l} style={{background:`linear-gradient(135deg,${s.c},${s.c}cc)`,borderRadius:12,padding:'14px 16px',boxShadow:`0 2px 4px rgba(0,0,0,.35), 0 14px 32px -10px ${s.c}66, inset 0 1px 0 rgba(255,255,255,.18)`}}>
            <div style={{fontSize:26,fontWeight:800,color:'#fff'}}>{s.v}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.8)',marginTop:4}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        {['','active','new','suspended'].map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter===s?'btn-p':'btn-g'}`}
            onClick={() => setStatusFilter(s)} style={{textTransform:'capitalize'}}>
            {s||'All'}
          </button>
        ))}
      </div>

      {error && (
        <div style={{background:'rgba(255,90,90,.1)',border:'1px solid rgba(255,90,90,.3)',borderRadius:10,padding:'10px 14px',marginBottom:12,color:'#ef4444',fontSize:13}}>
          {error} <button className="btn btn-xs btn-g" onClick={() => fetchGroups(page)}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{padding:0,overflow:'hidden',marginBottom:12}}>
        <table className="tbl">
          <thead>
            <tr>{['Group','City','Territory','Members','Capacity','Attendance','Health','Status','Actions'].map(h=><th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading
              ? [...Array(6)].map((_,i) => (
                <tr key={i}>{[...Array(9)].map((_,j) => (
                  <td key={j}><div style={{height:13,background:'rgba(255,255,255,.06)',borderRadius:4,width:'80%'}}/></td>
                ))}</tr>
              ))
              : groups.length === 0
              ? <tr><td colSpan={9} style={{textAlign:'center',color:'#9ca3af',padding:32}}>No groups found</td></tr>
              : groups.map(g => (
                <tr key={g.id}>
                  <td style={{fontWeight:600}}>{g.name}</td>
                  <td style={{fontSize:12,color:'#6b7280'}}>{g.city||'—'}</td>
                  <td style={{fontSize:12,color:'#6b7280'}}>{getTerritoryName(g.territory_id)}</td>
                  <td>{g.members_count||0}</td>
                  <td style={{color:'#9ca3af'}}>{g.capacity||0}</td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{flex:1,height:4,background:'rgba(255,255,255,.06)',borderRadius:99,maxWidth:60}}>
                        <div style={{height:'100%',borderRadius:99,
                          background:g.attendance_avg>=80?'#10b981':g.attendance_avg>=60?'#f59e0b':'#ef4444',
                          width:`${g.attendance_avg||0}%`}}/>
                      </div>
                      <span style={{fontSize:12}}>{g.attendance_avg||0}%</span>
                    </div>
                  </td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:8,height:8,borderRadius:'50%',
                        background:g.health_score>=80?'#10b981':g.health_score>=60?'#f59e0b':'#ef4444'}}/>
                      <span style={{fontSize:12,fontWeight:600}}>{g.health_score||0}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{fontSize:11,padding:'2px 8px',borderRadius:99,
                      background:(STATUS_COLOR[g.status]||'#9ca3af')+'22',
                      color:STATUS_COLOR[g.status]||'#9ca3af',fontWeight:600,textTransform:'capitalize'}}>
                      {g.status||'—'}
                    </span>
                  </td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      <button className="btn btn-xs btn-g" onClick={() => openStats(g)}>Stats</button>
                      <button className="btn btn-xs btn-g" style={{color:'#6366f1'}} onClick={() => openEdit(g)}>Edit</button>
                      <button className="btn btn-xs btn-g" style={{color:'#ef4444'}}
                        onClick={() => deleteGroup(g.id, g.name)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{display:'flex',gap:6,justifyContent:'center'}}>
        <button className="btn btn-g btn-sm" disabled={page===1} onClick={() => fetchGroups(page-1)}><FontAwesomeIcon icon={faArrowLeft} className="mr-1.5"/>Prev</button>
        <span style={{padding:'6px 12px',fontSize:13,color:'#9ca3af'}}>Page {page}</span>
        <button className="btn btn-g btn-sm" disabled={!hasMore} onClick={() => fetchGroups(page+1)}>Next <FontAwesomeIcon icon={faArrowRight} className="ml-1"/></button>
      </div>

      {/* ── STATS MODAL ─────────────────────────────────────────────── */}
      {selected && (
        <div className="overlay" onClick={e => e.target===e.currentTarget && setSelected(null)}>
          <div className="modal modal-lg">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}><FontAwesomeIcon icon={faChartBar} className="mr-1.5"/>{selected.name}</h3>
            <div className="form-grid" style={{marginBottom:14}}>
              {[
                ['Territory',      getTerritoryName(selected.territory_id)],
                ['City',           selected.city||'—'],
                ['State',          selected.state||'—'],
                ['Country',        selected.country||'—'],
                ['Status',         selected.status||'—'],
                ['Members',        selected.members_count||0],
                ['Capacity',       selected.capacity||0],
                ['Attendance Avg', `${selected.attendance_avg||0}%`],
                ['Health Score',   selected.health_score||0],
              ].map(([k,v]) => (
                <div key={String(k)}>
                  <div style={{fontSize:11,color:'#9ca3af',marginBottom:2}}>{k}</div>
                  <div style={{fontSize:13,fontWeight:600}}>{String(v)}</div>
                </div>
              ))}
            </div>
            {stats && (
              <div style={{background:'rgba(255,255,255,.04)',borderRadius:10,padding:12,marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>Live Stats</div>
                <div className="form-grid">
                  {[
                    ['Active Members',  stats.active_members||0],
                    ['Total Referrals', stats.total_referrals||0],
                    ['Total Meetings',  stats.total_meetings||0],
                  ].map(([k,v]) => (
                    <div key={String(k)}>
                      <div style={{fontSize:11,color:'#9ca3af',marginBottom:2}}>{k}</div>
                      <div style={{fontSize:18,fontWeight:800,color:'var(--nx-ink)'}}>{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-g btn-sm" onClick={() => { openEdit(selected); setSelected(null) }}>
                Edit Group
              </button>
              <button className="btn btn-g" style={{flex:1}} onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE MODAL — TERRITORY DROPDOWN ───────────────────────── */}
      {showCreate && (
        <div className="overlay" onClick={e => e.target===e.currentTarget && setShowCreate(false)}>
          <div className="modal modal-lg">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>+ Create Group</h3>
            <p style={{fontSize:13,color:'#9ca3af',marginBottom:16}}>
              Select a territory — city, state and country will auto-fill
            </p>
            <div className="form-grid">
              <div className="fg">
                <label>Group Name *</label>
                <input value={form.name}
                  onChange={e => setForm({...form,name:e.target.value})}
                  placeholder="e.g. Delhi NCR Elite"/>
              </div>
              <div className="fg">
                <label>Territory * {territories.length === 0 && <span style={{color:'#ef4444',fontSize:11}}>(loading…)</span>}</label>
                <select value={form.territory_id} onChange={e => onTerritorySelect(e.target.value)}>
                  <option value="">— Select Territory —</option>
                  {territories.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.city}, {t.country})
                    </option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label>City *</label>
                <input value={form.city}
                  onChange={e => setForm({...form,city:e.target.value})}
                  placeholder="Auto-filled from territory"/>
              </div>
              <div className="fg">
                <label>State</label>
                <input value={form.state}
                  onChange={e => setForm({...form,state:e.target.value})}
                  placeholder="Auto-filled from territory"/>
              </div>
              <div className="fg">
                <label>Country</label>
                <select value={form.country} onChange={e => setForm({...form,country:e.target.value})}>
                  {countries.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="fg">
                <label>Capacity (max members)</label>
                <input type="number" min="1" max="500" value={form.capacity}
                  onChange={e => setForm({...form,capacity:Number(e.target.value)})}/>
              </div>
            </div>

            {/* Show selected territory details */}
            {form.territory_id && (() => {
              const t = territories.find(x => x.id === form.territory_id)
              return t ? (
                <div style={{background:'rgba(39,216,109,.1)',border:'1px solid rgba(39,216,109,.3)',borderRadius:10,padding:'10px 14px',marginTop:8,fontSize:12,color:'#15803d'}}>
                  <FontAwesomeIcon icon={faCircleCheck} className="mr-1.5"/>Territory: <strong>{t.name}</strong> · {t.city}, {t.state}, {t.country} · {t.groups_count||0} existing groups · Royalty {t.royalty_pct||15}%
                </div>
              ) : null
            })()}

            <div style={{display:'flex',gap:8,marginTop:14}}>
              <button className="btn btn-p" style={{flex:1}} onClick={createGroup}
                disabled={saving||!form.name||!form.territory_id||!form.city}>
                {saving?'Creating…':'Create Group'}
              </button>
              <button className="btn btn-g" style={{flex:1}} onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ──────────────────────────────────────────────── */}
      {editing && (
        <div className="overlay" onClick={e => e.target===e.currentTarget && setEditing(null)}>
          <div className="modal modal-lg">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>Edit Group — {editing.name}</h3>
            {/* Show territory this group belongs to */}
            <div style={{background:'rgba(255,255,255,.04)',borderRadius:8,padding:'8px 12px',marginBottom:14,fontSize:12,color:'#6b7280'}}>
              Territory: <strong style={{color:'var(--nx-ink)'}}>{getTerritoryName(editing.territory_id)}</strong>
              <span style={{color:'#9ca3af',marginLeft:8}}>(territory cannot be changed — contact Super Admin)</span>
            </div>
            <div className="form-grid">
              <div className="fg">
                <label>Group Name *</label>
                <input value={editing.name}
                  onChange={e => setEditing({...editing,name:e.target.value})}/>
              </div>
              <div className="fg">
                <label>City</label>
                <input value={editing.city||''}
                  onChange={e => setEditing({...editing,city:e.target.value})}/>
              </div>
              <div className="fg">
                <label>State</label>
                <input value={editing.state||''}
                  onChange={e => setEditing({...editing,state:e.target.value})}/>
              </div>
              <div className="fg">
                <label>Country</label>
                <select value={editing.country||'India'}
                  onChange={e => setEditing({...editing,country:e.target.value})}>
                  {countries.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="fg">
                <label>Capacity</label>
                <input type="number" min="1" max="500" value={editing.capacity||50}
                  onChange={e => setEditing({...editing,capacity:Number(e.target.value)})}/>
              </div>
              <div className="fg">
                <label>Status</label>
                <select value={editing.status||'active'}
                  onChange={e => setEditing({...editing,status:e.target.value})}>
                  <option value="active">Active</option>
                  <option value="new">New</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:8,marginTop:14}}>
              <button className="btn btn-p" style={{flex:1}} onClick={updateGroup}
                disabled={saving||!editing.name}>
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
