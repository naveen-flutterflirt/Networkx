'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faBullseye, faPhone, faHandshake, faCircleCheck, faCircleXmark, faArrowRight, faPenToSquare } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react'
import { CrmAPI, MasterDataAPI } from '@/lib/api'

const STATUS_COLORS: Record<string,string> = {
  prospect:'#9ca3af', contacted:'#6366f1', negotiating:'#f59e0b', approved:'#10b981', rejected:'#ef4444'
}
const STATUS_ICONS: Record<string,string> = {
  prospect:'🎯', contacted:'📞', negotiating:'🤝', approved:'✅', rejected:'❌'
}
const STATUS_ICONS_FA: Record<string,any> = {
  prospect:faBullseye, contacted:faPhone, negotiating:faHandshake, approved:faCircleCheck, rejected:faCircleXmark
}
const PIPELINE_STAGES = ['prospect','contacted','negotiating','approved','rejected']
const FALLBACK_COUNTRIES = ['India','USA','UK','UAE','Singapore','Canada','Australia','Germany']
const FALLBACK_INDUSTRIES = ['Manufacturing','Technology','Healthcare','Finance','Real Estate','Retail','Education','Hospitality','Other']

// Defined OUTSIDE CrmPage — same focus-loss bug class as the original
// Travel Connect fix: a form declared inside its parent remounts (and
// drops input focus) on every render.
function ProspectForm({ data, onChange, countries, industries }: { data: any, onChange: (d: any) => void, countries: string[], industries: string[] }) {
  return (
    <div className="form-grid">
      <div className="fg"><label>Full Name *</label>
        <input value={data.name||''} onChange={e=>onChange({...data,name:e.target.value})} placeholder="Prospect's full name"/>
      </div>
      <div className="fg"><label>Phone</label>
        <input value={data.phone||''} onChange={e=>onChange({...data,phone:e.target.value})} placeholder="+91 98765 43210"/>
      </div>
      <div className="fg"><label>Email</label>
        <input type="email" value={data.email||''} onChange={e=>onChange({...data,email:e.target.value})} placeholder="email@example.com"/>
      </div>
      <div className="fg"><label>Business Name</label>
        <input value={data.business||''} onChange={e=>onChange({...data,business:e.target.value})} placeholder="Company or trade name"/>
      </div>
      <div className="fg"><label>Industry</label>
        <select value={data.industry||'Manufacturing'} onChange={e=>onChange({...data,industry:e.target.value})}>
          {industries.map(i=><option key={i}>{i}</option>)}
        </select>
      </div>
      <div className="fg"><label>City *</label>
        <input value={data.city||''} onChange={e=>onChange({...data,city:e.target.value})} placeholder="City"/>
      </div>
      <div className="fg"><label>Country</label>
        <select value={data.country||'India'} onChange={e=>onChange({...data,country:e.target.value})}>
          {countries.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="fg"><label>Pipeline Stage</label>
        <select value={data.status||'prospect'} onChange={e=>onChange({...data,status:e.target.value})}>
          {PIPELINE_STAGES.map(s=><option key={s} value={s} style={{textTransform:'capitalize'}}>{STATUS_ICONS[s]} {s}</option>)}
        </select>
      </div>
      <div className="fg"><label>Annual Turnover</label>
        <input value={data.annual_turnover||''} onChange={e=>onChange({...data,annual_turnover:e.target.value})} placeholder="e.g. ₹2 Crore"/>
      </div>
      <div className="fg"><label>No. of Employees</label>
        <input value={data.employees||''} onChange={e=>onChange({...data,employees:e.target.value})} placeholder="e.g. 25"/>
      </div>
      <div className="fg"><label>Referral Source</label>
        <input value={data.referral_source||''} onChange={e=>onChange({...data,referral_source:e.target.value})} placeholder="Who referred this prospect?"/>
      </div>
      <div className="fg" style={{gridColumn:'1/-1'}}><label>Notes</label>
        <textarea rows={3} value={data.notes||''} onChange={e=>onChange({...data,notes:e.target.value})} placeholder="Key insights, next steps, follow-up dates…"/>
      </div>
    </div>
  )
}


export default function CrmPage() {
  const [prospects,    setProspects]    = useState<any[]>([])
  const [pipeline,     setPipeline]     = useState<any>({})
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [msg,          setMsg]          = useState('')
  const [page,         setPage]         = useState(1)
  const [countries,    setCountries]    = useState<string[]>(FALLBACK_COUNTRIES)
  const [industries,   setIndustries]   = useState<string[]>(FALLBACK_INDUSTRIES)
  const [hasMore,      setHasMore]      = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [showAdd,      setShowAdd]      = useState(false)
  const [editing,      setEditing]      = useState<any|null>(null)
  const [viewing,      setViewing]      = useState<any|null>(null)
  const [saving,       setSaving]       = useState(false)

  const emptyForm = {
    name:'', phone:'', email:'', business:'', industry:'Manufacturing',
    city:'', country:'India', notes:'', status:'prospect',
    annual_turnover:'', employees:'', referral_source:''
  }
  const [form, setForm] = useState(emptyForm)

  const fetchData = async (p = 1) => {
    setLoading(true); setError('')
    try {
      const [res, pipe] = await Promise.all([
        CrmAPI.prospects({ status: statusFilter||undefined, page: p, page_size: 20 }),
        CrmAPI.pipeline()
      ])
      setProspects(res.items || res)
      setHasMore(res.has_more || false)
      setPipeline(pipe); setPage(p)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData(1) }, [statusFilter])
  useEffect(() => {
    MasterDataAPI.get('country').then(res => {
      const vals = (res.items || []).map((i: any) => i.value)
      if (vals.length) setCountries(vals)
    }).catch(() => {})  // keep the fallback list on failure
    MasterDataAPI.get('business_category').then(res => {
      const vals = (res.items || []).map((i: any) => i.value)
      if (vals.length) setIndustries(vals)
    }).catch(() => {})  // keep the fallback list on failure
  }, [])

  const addProspect = async () => {
    if (!form.name || !form.city) return
    setSaving(true)
    try {
      await CrmAPI.addProspect(form)
      setShowAdd(false)
      setForm(emptyForm)
      setMsg('✅ Prospect added!')
      fetchData(1)
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await CrmAPI.updateProspect(editing.id, editing)
      setEditing(null)
      setMsg('✅ Prospect updated!')
      fetchData(page)
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await CrmAPI.updateStatus(id, status)
      setProspects(prev => prev.map(p => p.id===id ? {...p,status} : p))
      setMsg(`✅ Status updated to ${status}`)
      fetchData(1)
    } catch (e: any) { setMsg('❌ ' + e.message) }
  }

  const deleteProspect = async (id: string, name: string) => {
    if (!confirm(`Delete prospect "${name}"?`)) return
    try {
      await CrmAPI.deleteProspect(id)
      setMsg('✅ Prospect deleted')
      fetchData(page)
    } catch (e: any) { setMsg('❌ ' + e.message) }
  }

  const total = Object.values(pipeline).reduce((a:any,v:any) => a+(v||0), 0) as number

  return (
    <div className="page">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:18,fontWeight:800}}>CRM — Franchise Pipeline</h2>
          <p style={{fontSize:13,color:'#9ca3af'}}>Track and manage franchise prospect recruitment</p>
        </div>
        <button className="btn btn-p" onClick={()=>{setForm(emptyForm);setShowAdd(true)}}>+ Add Prospect</button>
      </div>

      {msg && (
        <div className="toast-in" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,marginBottom:12,fontSize:13,
          background:msg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
          color:msg.startsWith('✅')?'#16a34a':'#ef4444',
          border:`1px solid ${msg.startsWith('✅')?'rgba(39,216,109,.35)':'rgba(255,90,90,.35)'}`}}>
          {msg}<button style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}} onClick={()=>setMsg('')}>✕</button>
        </div>
      )}

      {/* Pipeline funnel */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:16}}>
        {PIPELINE_STAGES.map(s=>(
          <div key={s} onClick={()=>setStatusFilter(statusFilter===s?'':s)}
            style={{background:`${STATUS_COLORS[s]}15`,border:`2px solid ${statusFilter===s?STATUS_COLORS[s]:'transparent'}`,
              borderRadius:12,padding:'12px 14px',cursor:'pointer',transition:'all .2s'}}>
            <div style={{fontSize:22,fontWeight:800,color:STATUS_COLORS[s]}}>{pipeline[s]||0}</div>
            <div style={{fontSize:11,color:'#6b7280',marginTop:2,textTransform:'capitalize'}}>
              <FontAwesomeIcon icon={STATUS_ICONS_FA[s]} className="mr-1"/>{s}
            </div>
            <div style={{fontSize:10,color:'#9ca3af',marginTop:2}}>
              {total ? Math.round(((pipeline[s]||0)/total)*100) : 0}% of total
            </div>
          </div>
        ))}
      </div>

      {/* Conversion rate */}
      {total > 0 && (
        <div className="card" style={{marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Pipeline Flow</div>
          <div style={{display:'flex',alignItems:'center',gap:4,height:24}}>
            {PIPELINE_STAGES.map((s,i)=>{
              const pct = total ? Math.round(((pipeline[s]||0)/total)*100) : 0
              if (!pct) return null
              return (
                <div key={s} style={{flex:pct,height:'100%',background:STATUS_COLORS[s],
                  borderRadius:i===0?'8px 0 0 8px':i===PIPELINE_STAGES.length-1?'0 8px 8px 0':'0',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:10,color:'#fff',fontWeight:700,minWidth:24,overflow:'hidden'}}>
                  {pct>8?`${pct}%`:''}
                </div>
              )
            })}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11,color:'#9ca3af'}}>
            <span>Total: {total} prospects</span>
            <span style={{color:'#10b981',fontWeight:600}}>
              Conversion: {total ? Math.round(((pipeline.approved||0)/total)*100) : 0}%
            </span>
          </div>
        </div>
      )}

      {error && <div style={{background:'rgba(255,90,90,.1)',border:'1px solid rgba(255,90,90,.3)',borderRadius:10,padding:'10px 14px',marginBottom:12,color:'#ef4444',fontSize:13}}>{error}</div>}

      {/* Status filter pills */}
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        <button className={`btn btn-sm ${statusFilter===''?'btn-p':'btn-g'}`} onClick={()=>setStatusFilter('')}>All ({total})</button>
        {PIPELINE_STAGES.map(s=>(
          <button key={s} className={`btn btn-sm ${statusFilter===s?'btn-p':'btn-g'}`}
            onClick={()=>setStatusFilter(statusFilter===s?'':s)} style={{textTransform:'capitalize'}}>
            <FontAwesomeIcon icon={STATUS_ICONS_FA[s]} className="mr-1"/>{s} ({pipeline[s]||0})
          </button>
        ))}
      </div>

      {/* Prospects table */}
      <div className="card" style={{padding:0,overflow:'hidden',marginBottom:12}}>
        <table className="tbl">
          <thead><tr>{['Prospect','Business','City','Industry','Phone','Stage','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {loading
              ? [...Array(5)].map((_,i)=>(
                <tr key={i}>{[...Array(7)].map((_,j)=>(
                  <td key={j}><div style={{height:13,background:'rgba(255,255,255,.06)',borderRadius:4,width:'80%'}}/></td>
                ))}</tr>
              ))
              : prospects.length===0
              ? <tr><td colSpan={7} style={{textAlign:'center',color:'#9ca3af',padding:32}}>No prospects found</td></tr>
              : prospects.map(p=>(
                <tr key={p.id}>
                  <td>
                    <div style={{fontWeight:600}}>{p.name}</div>
                    {p.email && <div style={{fontSize:11,color:'#6366f1'}}>{p.email}</div>}
                  </td>
                  <td style={{fontSize:12,color:'#6b7280'}}>{p.business||'—'}</td>
                  <td style={{fontSize:12}}>{p.city}{p.country&&p.country!=='India'?`, ${p.country}`:''}</td>
                  <td style={{fontSize:11,color:'#9ca3af'}}>{p.industry||'—'}</td>
                  <td style={{fontSize:12}}>{p.phone||'—'}</td>
                  <td>
                    <select value={p.status}
                      onChange={async e=>{
                        try { await CrmAPI.updateStatus(p.id,e.target.value); fetchData(page) }
                        catch(err:any) { setMsg('❌ '+err.message) }
                      }}
                      style={{fontSize:11,padding:'3px 8px',borderRadius:99,border:`1px solid ${STATUS_COLORS[p.status]||'var(--nx-line)'}`,
                        background:(STATUS_COLORS[p.status]||'#9ca3af')+'22',color:STATUS_COLORS[p.status]||'#9ca3af',
                        fontWeight:600,cursor:'pointer',outline:'none',textTransform:'capitalize'}}>
                      {PIPELINE_STAGES.map(s=><option key={s} value={s}>{STATUS_ICONS[s]} {s}</option>)}
                    </select>
                  </td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      <button className="btn btn-xs btn-g" onClick={()=>setViewing(p)}>View</button>
                      <button className="btn btn-xs btn-g" style={{color:'#6366f1'}} onClick={()=>setEditing({...p})}>Edit</button>
                      <button className="btn btn-xs btn-g" style={{color:'#ef4444'}} onClick={()=>deleteProspect(p.id,p.name)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      <div style={{display:'flex',gap:6,justifyContent:'center'}}>
        <button className="btn btn-g btn-sm" disabled={page===1} onClick={()=>fetchData(page-1)}><FontAwesomeIcon icon={faArrowLeft} className="mr-1.5"/>Prev</button>
        <span style={{padding:'6px 12px',fontSize:13,color:'#9ca3af'}}>Page {page}</span>
        <button className="btn btn-g btn-sm" disabled={!hasMore} onClick={()=>fetchData(page+1)}>Next <FontAwesomeIcon icon={faArrowRight} className="ml-1"/></button>
      </div>

      {/* ── VIEW MODAL ──────────────────────────────────────────────── */}
      {viewing && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setViewing(null)}>
          <div className="modal modal-lg">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
              <div>
                <h3 style={{fontSize:16,fontWeight:700,margin:0}}>{viewing.name}</h3>
                <div style={{fontSize:13,color:'#9ca3af',marginTop:2}}>{viewing.business||'—'} · {viewing.city}</div>
              </div>
              <span style={{fontSize:12,padding:'4px 12px',borderRadius:99,fontWeight:700,textTransform:'capitalize',
                background:(STATUS_COLORS[viewing.status]||'#9ca3af')+'22',color:STATUS_COLORS[viewing.status]||'#9ca3af'}}>
                <FontAwesomeIcon icon={STATUS_ICONS_FA[viewing.status]} className="mr-1"/>{viewing.status}
              </span>
            </div>
            <div className="form-grid" style={{marginBottom:14}}>
              {[
                ['Phone',        viewing.phone||'—'],
                ['Email',        viewing.email||'—'],
                ['Industry',     viewing.industry||'—'],
                ['City',         viewing.city||'—'],
                ['Country',      viewing.country||'—'],
                ['Turnover',     viewing.annual_turnover||'—'],
                ['Employees',    viewing.employees||'—'],
                ['Referred By',  viewing.referral_source||'—'],
              ].map(([k,v])=>(
                <div key={String(k)}>
                  <div style={{fontSize:11,color:'#9ca3af',marginBottom:2}}>{k}</div>
                  <div style={{fontSize:13,fontWeight:600}}>{String(v)}</div>
                </div>
              ))}
            </div>
            {viewing.notes && (
              <div style={{background:'rgba(255,255,255,.04)',borderRadius:10,padding:12,marginBottom:14,fontSize:13,lineHeight:1.6}}>
                <div style={{fontSize:11,color:'#9ca3af',marginBottom:4}}>Notes</div>
                {viewing.notes}
              </div>
            )}
            {/* Quick status change */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,marginBottom:8,color:'#9ca3af'}}>Move to stage:</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {PIPELINE_STAGES.filter(s=>s!==viewing.status).map(s=>(
                  <button key={s} className="btn btn-g btn-sm"
                    style={{color:STATUS_COLORS[s],borderColor:STATUS_COLORS[s]+'44'}}
                    onClick={()=>{updateStatus(viewing.id,s);setViewing({...viewing,status:s})}}>
                    <FontAwesomeIcon icon={STATUS_ICONS_FA[s]} className="mr-1"/>{s}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-g btn-sm" onClick={()=>{setEditing({...viewing});setViewing(null)}}><FontAwesomeIcon icon={faPenToSquare} className="mr-1.5"/>Edit</button>
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD MODAL ───────────────────────────────────────────────── */}
      {showAdd && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div className="modal modal-lg" style={{maxHeight:'90vh',overflowY:'auto'}}>
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}>+ Add Franchise Prospect</h3>
            <ProspectForm data={form} onChange={setForm} countries={countries} industries={industries}/>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn btn-p" style={{flex:1}} onClick={addProspect} disabled={saving||!form.name||!form.city}>
                {saving?'Adding…':'Add Prospect'}
              </button>
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ──────────────────────────────────────────────── */}
      {editing && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setEditing(null)}>
          <div className="modal modal-lg" style={{maxHeight:'90vh',overflowY:'auto'}}>
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}>Edit — {editing.name}</h3>
            <ProspectForm data={editing} onChange={setEditing} countries={countries} industries={industries}/>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn btn-p" style={{flex:1}} onClick={saveEdit} disabled={saving}>
                {saving?'Saving…':'Save Changes'}
              </button>
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
