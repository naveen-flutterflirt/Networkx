'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBullhorn, faCalendarDays, faBullseye, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
// NIA Brand colors: var(--nx-orange) (primary), #6366f1 (accent), #10b981 (success)
import { useState, useEffect } from 'react'
import { CrmAPI, EventsAPI, SuperAdminAPI } from '@/lib/api'

const PIPELINE_STAGES = ['prospect','contacted','negotiating','approved','rejected']
const STATUS_COLORS: Record<string,string> = {
  prospect:'#9ca3af', contacted:'#6366f1', negotiating:'#f59e0b', approved:'#10b981', rejected:'#ef4444'
}

export default function HQAdminPage() {
  const [tab,         setTab]         = useState('prospects')
  const [prospects,   setProspects]   = useState<any[]>([])
  const [pipeline,    setPipeline]    = useState<any>({})
  const [events,      setEvents]      = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [showAdd,     setShowAdd]     = useState(false)
  const [showEvent,   setShowEvent]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [selected,    setSelected]    = useState<any|null>(null)
  // Broadcast state
  const [bTitle,      setBTitle]      = useState('')
  const [bBody,       setBBody]       = useState('')
  const [bTarget,     setBTarget]     = useState('all')
  const [bSending,    setBSending]    = useState(false)
  const [bMsg,        setBMsg]        = useState('')
  // Forms
  const [pForm, setPForm] = useState({name:'',phone:'',business:'',city:'',country:'India',notes:''})
  const [eForm, setEForm] = useState({title:'',type:'Convention',date:'',venue:'',capacity:'',country:'India'})

  const fetchProspects = async () => {
    setLoading(true)
    try {
      const [res, pipe] = await Promise.all([CrmAPI.prospects({page:1,page_size:20}), CrmAPI.pipeline()])
      setProspects(res.items || res)
      setPipeline(pipe)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const res = await EventsAPI.list({ page:1, page_size:20 })
      setEvents(res.items || res)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (tab === 'prospects') fetchProspects()
    else if (tab === 'events') fetchEvents()
    else setLoading(false)
  }, [tab])

  const addProspect = async () => {
    if (!pForm.name) return
    setSaving(true)
    try {
      await CrmAPI.addProspect({ ...pForm, status:'prospect' })
      setShowAdd(false)
      setPForm({name:'',phone:'',business:'',city:'',country:'India',notes:''})
      fetchProspects()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const addEvent = async () => {
    if (!eForm.title || !eForm.date) return
    setSaving(true)
    try {
      await EventsAPI.create({ ...eForm, capacity: Number(eForm.capacity)||100, status:'planning' })
      setShowEvent(false)
      setEForm({title:'',type:'Convention',date:'',venue:'',capacity:'',country:'India'})
      fetchEvents()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const sendBroadcast = async () => {
    if (!bTitle || !bBody) return
    setBSending(true); setBMsg('')
    try {
      await SuperAdminAPI.broadcast({ title: bTitle, body: bBody, target: bTarget, channels: ['push','in_app'] })
      setBMsg('✅ Broadcast sent!')
      setBTitle(''); setBBody('')
    } catch (e: any) { setBMsg('❌ ' + e.message) }
    finally { setBSending(false) }
  }

  return (
    <div className="page">
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:18,fontWeight:800}}>Admin Controls</h2>
        <p style={{fontSize:13,color:'#9ca3af'}}>Franchisee prospects, events management and broadcast</p>
      </div>

      <div className="tab-bar">
        {[{id:'prospects',l:'Franchisee CRM',ic:faBullseye},{id:'events',l:'Events',ic:faCalendarDays},{id:'broadcast',l:'Broadcast',ic:faBullhorn},{id:'compliance',l:'Compliance',ic:faCircleCheck}].map(t => (
          <button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}><FontAwesomeIcon icon={t.ic} className="mr-1.5"/>{t.l}</button>
        ))}
      </div>

      {error && <div style={{background:'rgba(255,90,90,.1)',border:'1px solid rgba(255,90,90,.3)',borderRadius:10,padding:'10px 14px',marginBottom:12,color:'#ef4444',fontSize:13}}>{error}</div>}

      {/* PROSPECTS */}
      {tab === 'prospects' && (
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            {/* Pipeline summary */}
            <div style={{display:'flex',gap:8}}>
              {PIPELINE_STAGES.slice(0,-1).map(s => (
                <div key={s} style={{background:'rgba(255,255,255,.04)',border:'1px solid var(--nx-line)',borderRadius:10,padding:'8px 14px',textAlign:'center'}}>
                  <div style={{fontSize:18,fontWeight:800,color:STATUS_COLORS[s]}}>{pipeline[s]||0}</div>
                  <div style={{fontSize:11,color:'#9ca3af',textTransform:'capitalize'}}>{s}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-p" onClick={() => setShowAdd(true)}>+ Add Prospect</button>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {loading
              ? [...Array(3)].map((_,i) => <div key={i} className="card" style={{height:80,background:'rgba(255,255,255,.06)',borderRadius:12}}/>) 
              : prospects.map(p => (
                <div key={p.id} className="card" style={{borderLeft:`3px solid ${STATUS_COLORS[p.status]||'#9ca3af'}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:700}}>{p.name}</div>
                      <div style={{fontSize:12,color:'#9ca3af'}}>{p.city}, {p.country} · {p.phone||'—'}</div>
                      {p.notes && <div style={{fontSize:12,color:'#6b7280',marginTop:4,background:'rgba(255,255,255,.04)',borderRadius:6,padding:'4px 8px'}}>{p.notes}</div>}
                    </div>
                    <select value={p.status} onChange={async e => {
                      try { await CrmAPI.updateStatus(p.id, e.target.value); fetchProspects() }
                      catch (err: any) { alert('Failed: ' + err.message) }
                    }} style={{fontSize:11,padding:'3px 8px',border:`1px solid ${STATUS_COLORS[p.status]||'var(--nx-line)'}`,borderRadius:6,
                      background:(STATUS_COLORS[p.status]||'#9ca3af')+'22',color:STATUS_COLORS[p.status]||'#9ca3af',fontWeight:600,cursor:'pointer',outline:'none'}}>
                      {PIPELINE_STAGES.map(s => <option key={s} value={s} style={{textTransform:'capitalize'}}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <button className="btn btn-xs btn-p" onClick={() => setSelected(p)}>Edit</button>
                    <button className="btn btn-xs btn-g" style={{color:'#ef4444'}} onClick={async () => {
                      if (!confirm('Delete this prospect?')) return
                      try { await CrmAPI.deleteProspect(p.id); fetchProspects() }
                      catch (err: any) { setError(err.message) }
                    }}>Delete</button>
                  </div>
                </div>
              ))
            }
            {!loading && prospects.length === 0 && (
              <div className="card" style={{textAlign:'center',padding:32,color:'#9ca3af'}}>No prospects yet — add your first franchise prospect</div>
            )}
          </div>
        </div>
      )}

      {/* EVENTS */}
      {tab === 'events' && (
        <div>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
            <button className="btn btn-p" onClick={() => setShowEvent(true)}>+ Create Event</button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {loading
              ? [...Array(3)].map((_,i) => <div key={i} className="card" style={{height:80}}/>)
              : events.map(e => (
                <div key={e.id} className="card">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:700}}>{e.title}</div>
                      <div style={{fontSize:12,color:'#9ca3af'}}>{e.date ? new Date(e.date).toLocaleDateString() : '—'} · {e.venue||'—'}</div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      <span className={`badge ${e.type==='International'?'b-purple':'b-blue'}`} style={{fontSize:10}}>{e.type||'Event'}</span>
                      <span className={`badge ${e.status==='completed'?'b-gray':e.status==='upcoming'?'b-green':'b-yellow'}`}>{e.status||'planning'}</span>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <button className="btn btn-g btn-sm" style={{color:'#ef4444'}} onClick={async () => {
                    if (!confirm('Delete this event?')) return
                    try { await EventsAPI.delete(e.id); fetchEvents() }
                    catch (err: any) { setError(err.message) }
                  }}>Delete</button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* BROADCAST */}
      {tab === 'broadcast' && (
        <div style={{maxWidth:560}}>
          <div className="card">
            <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faBullhorn} className="mr-1.5"/>National Broadcast</div>
            <div className="fg"><label>Title *</label>
              <input value={bTitle} onChange={e => setBTitle(e.target.value)} placeholder="e.g. Important Policy Update"/>
            </div>
            <div className="fg"><label>Target Audience</label>
              <select value={bTarget} onChange={e => setBTarget(e.target.value)}>
                <option value="all">All Users</option>
                <option value="role">By Role</option>
                <option value="territory">By Territory</option>
              </select>
            </div>
            <div className="fg"><label>Message *</label>
              <textarea rows={4} value={bBody} onChange={e => setBBody(e.target.value)} placeholder="Write your broadcast message…"/>
            </div>
            {bMsg && <div className="toast-in" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,marginBottom:12,fontSize:13,
              background:bMsg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
              color:bMsg.startsWith('✅')?'#16a34a':'#ef4444'}}>{bMsg}</div>}
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p" style={{flex:1}} onClick={sendBroadcast}
                disabled={bSending||!bTitle||!bBody}>{bSending?'Sending…':'Send Broadcast'}</button>
              <button className="btn btn-g" style={{flex:1}} onClick={() => { setBTitle(''); setBBody(''); setBMsg('') }}>Clear</button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLIANCE - static */}
      {tab === 'compliance' && (
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <table className="tbl">
            <thead><tr>{['Franchise','City','Country','Meetings','Renewal Rate','Reporting','Score','Status'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                {f:'Rajesh Gupta',c:'Delhi',co:'India',m:'100%',r:'87%',rep:'On time',s:94,st:'compliant'},
                {f:'Sunita Sharma',c:'Mumbai',co:'India',m:'96%',r:'91%',rep:'On time',s:91,st:'compliant'},
                {f:'Raj Patel',c:'New York',co:'USA',m:'92%',r:'84%',rep:'2 days late',s:82,st:'minor'},
                {f:'Anil Kumar',c:'Dubai',co:'UAE',m:'88%',r:'89%',rep:'On time',s:87,st:'compliant'},
              ].map((r,i) => (
                <tr key={i}>
                  <td style={{fontWeight:600}}>{r.f}</td><td>{r.c}</td>
                  <td><span className={`badge ${r.co==='India'?'b-blue':'b-purple'}`} style={{fontSize:10}}>{r.co}</span></td>
                  <td style={{color:'#10b981',fontWeight:600}}>{r.m}</td><td>{r.r}</td>
                  <td style={{fontSize:12,color:r.rep==='On time'?'#10b981':'#f59e0b'}}>{r.rep}</td>
                  <td style={{fontWeight:700}}>{r.s}</td>
                  <td><span className={`badge ${r.st==='compliant'?'b-green':'b-yellow'}`}>{r.st}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Prospect Modal */}
      {showAdd && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal modal-lg">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}>+ Add Franchise Prospect</h3>
            <div className="form-grid">
              {[['name','Name *'],['phone','Phone'],['business','Business'],['city','City']].map(([k,l]) => (
                <div className="fg" key={k}><label>{l}</label>
                  <input value={(pForm as any)[k]} onChange={e => setPForm({...pForm,[k]:e.target.value})} placeholder={l}/>
                </div>
              ))}
              <div className="fg"><label>Country</label>
                <select value={pForm.country} onChange={e => setPForm({...pForm,country:e.target.value})}>
                  {['India','USA','UK','UAE','Singapore','Canada','Australia'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="fg"><label>Notes</label>
              <textarea rows={3} value={pForm.notes} onChange={e => setPForm({...pForm,notes:e.target.value})} placeholder="Initial notes…"/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p" style={{flex:1}} onClick={addProspect} disabled={saving||!pForm.name}>
                {saving?'Adding…':'Add Prospect'}
              </button>
              <button className="btn btn-g" style={{flex:1}} onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showEvent && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowEvent(false)}>
          <div className="modal modal-lg">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}><FontAwesomeIcon icon={faCalendarDays} className="mr-1.5"/>Create Event</h3>
            <div className="form-grid">
              <div className="fg"><label>Title *</label><input value={eForm.title} onChange={e => setEForm({...eForm,title:e.target.value})} placeholder="Event title"/></div>
              <div className="fg"><label>Type</label>
                <select value={eForm.type} onChange={e => setEForm({...eForm,type:e.target.value})}>
                  {['Convention','Awards','Internal','International','Training','Mixer'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="fg"><label>Date *</label><input type="datetime-local" value={eForm.date} onChange={e => setEForm({...eForm,date:e.target.value})}/></div>
              <div className="fg"><label>Venue</label><input value={eForm.venue} onChange={e => setEForm({...eForm,venue:e.target.value})} placeholder="City, Venue"/></div>
              <div className="fg"><label>Capacity</label><input type="number" value={eForm.capacity} onChange={e => setEForm({...eForm,capacity:e.target.value})} placeholder="500"/></div>
              <div className="fg"><label>Country</label>
                <select value={eForm.country} onChange={e => setEForm({...eForm,country:e.target.value})}>
                  {['India','USA','UK','UAE','Singapore'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:8,marginTop:14}}>
              <button className="btn btn-p" style={{flex:1}} onClick={addEvent} disabled={saving||!eForm.title||!eForm.date}>
                {saving?'Creating…':'Create Event'}
              </button>
              <button className="btn btn-g" style={{flex:1}} onClick={() => setShowEvent(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Prospect Modal */}
      {selected && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}>Edit — {selected.name}</h3>
            <div className="fg"><label>Notes</label>
              <textarea rows={3} defaultValue={selected.notes} onBlur={async e => {
                try { await CrmAPI.updateProspect(selected.id, { ...selected, notes: e.target.value }) }
                catch (err: any) { alert('Failed: ' + err.message) }
              }}/>
            </div>
            <div className="fg"><label>Status</label>
              <select defaultValue={selected.status} onChange={async e => {
                try { await CrmAPI.updateStatus(selected.id, e.target.value) }
                catch (err: any) { alert('Failed: ' + err.message) }
              }}>
                {PIPELINE_STAGES.map(s => <option key={s} value={s} style={{textTransform:'capitalize'}}>{s}</option>)}
              </select>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p" style={{flex:1}} onClick={() => { fetchProspects(); setSelected(null) }}>Save & Close</button>
              <button className="btn btn-g" style={{flex:1}} onClick={() => setSelected(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
