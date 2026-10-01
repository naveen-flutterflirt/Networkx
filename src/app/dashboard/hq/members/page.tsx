'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faScrewdriverWrench, faArrowRight, faTriangleExclamation, faCircleCheck, faDownload } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect, useRef } from 'react'
import { MembersAPI, GroupsAPI, TerritoriesAPI, RiskSignalsAPI } from '@/lib/api'
import UserSearchPicker from '@/components/ui/UserSearchPicker'

const STATUS_COLOR: Record<string,string> = { active:'#10b981', warning:'#f59e0b', inactive:'#ef4444' }
const RISK_COLOR: Record<string,string> = { high:'#ef4444', medium:'#f59e0b', low:'#10b981' }
const RISK_BG: Record<string,string> = { high:'rgba(255,90,90,.15)', medium:'rgba(245,158,11,.15)', low:'rgba(39,216,109,.15)' }
const TIER_OPTIONS: [string,string][] = [
  ['connect','Connect'],['growth','Growth'],['elite','Elite'],
  ['city_leadership','City Leadership'],['national','National'],['global','Global'],
]

// ── Searchable dropdown component ──────────────────────────────────────────
function SearchSelect({ label, items, value, onChange, placeholder, displayFn, subFn }: {
  label: string, items: any[], value: string,
  onChange: (id: string) => void, placeholder: string,
  displayFn: (item: any) => string, subFn?: (item: any) => string
}) {
  const [query,  setQuery]  = useState('')
  const [open,   setOpen]   = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = items.find(i => i.id === value)
  const filtered = query
    ? items.filter(i => displayFn(i).toLowerCase().includes(query.toLowerCase()) ||
                        (subFn?.(i)||'').toLowerCase().includes(query.toLowerCase()))
    : items

  const pick = (item: any) => {
    onChange(item.id)
    setQuery(displayFn(item))
    setOpen(false)
  }

  return (
    <div className="fg" ref={ref}>
      <label>{label}</label>
      <input
        value={open ? query : (selected ? displayFn(selected) : query)}
        onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange('') }}
        onFocus={() => { setOpen(true); setQuery('') }}
        placeholder={placeholder}
      />
      {open && (
        <div style={{position:'absolute',background:'var(--nx-panel)',border:'1px solid var(--nx-line)',
          borderRadius:10,boxShadow:'0 4px 20px rgba(0,0,0,.1)',
          zIndex:200,maxHeight:200,overflowY:'auto',marginTop:4,width:'100%'}}>
          {filtered.length === 0
            ? <div style={{padding:'10px 14px',fontSize:13,color:'#9ca3af'}}>No results</div>
            : filtered.slice(0,8).map(item => (
              <div key={item.id} onClick={() => pick(item)}
                style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid #f3f4f6'}}
                onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,.04)')}
                onMouseLeave={e => (e.currentTarget.style.background='#fff')}>
                <div style={{fontSize:13,fontWeight:600}}>{displayFn(item)}</div>
                {subFn && <div style={{fontSize:11,color:'#9ca3af'}}>{subFn(item)}</div>}
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}

export default function HQMembersPage() {
  const [members,     setMembers]     = useState<any[]>([])
  const [groups,      setGroups]      = useState<any[]>([])
  const [territories, setTerritories] = useState<any[]>([])
  const [tierPricing, setTierPricing] = useState<Record<string,number|null>>({})
  const [riskById, setRiskById] = useState<Record<string,any>>({})
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [page,        setPage]        = useState(1)
  const [hasMore,     setHasMore]     = useState(false)
  const [search,      setSearch]      = useState('')
  const [statusFilter,setStatusFilter]= useState('')
  const [tierFilter,  setTierFilter]  = useState('')
  const [countryFilter,setCountryFilter]=useState('')
  const [stateFilter, setStateFilter]  = useState('')
  const [cityFilter,  setCityFilter]   = useState('')
  const [msg,         setMsg]         = useState('')
  const [saving,      setSaving]      = useState(false)

  // Modals
  const [viewing,    setViewing]    = useState<any|null>(null)
  const [score,      setScore]      = useState<any|null>(null)
  const [editing,    setEditing]    = useState<any|null>(null)
  const [warning,    setWarning]    = useState<any|null>(null)
  const [showEnroll, setShowEnroll] = useState(false)

  // Forms
  const [warnForm, setWarnForm] = useState({ reason:'', warning_type:'conduct' })
  const [enrollForm, setEnrollForm] = useState({
    user_id:'', group_id:'', territory_id:'', plan:'yearly', tier:'connect', amount:1999
  })

  useEffect(() => {
    fetchMembers(1)
    // Load groups and territories for dropdowns
    Promise.all([
      GroupsAPI.list({ page:1, page_size:100 }),
      TerritoriesAPI.list({ page:1, page_size:100 }),
      MembersAPI.tiers(),
    ]).then(([g, t, tiersRes]) => {
      setGroups(g.items || g)
      setTerritories(t.items || t)
      const tiers = tiersRes.items || tiersRes || []
      const pricing: Record<string,number|null> = {}
      tiers.forEach((tr: any) => { pricing[tr.tier] = tr.price_numeric ?? null })
      setTierPricing(pricing)
    }).catch(() => {})
    RiskSignalsAPI.renewals().then(res => {
      const byId: Record<string,any> = {}
      ;(res.items || []).forEach((r: any) => { byId[r.id] = r })
      setRiskById(byId)
    }).catch(() => {})  // franchise/member-scope failures shouldn't block the member list itself
  }, [statusFilter, tierFilter])

  // Real fix for the wrong-pricing bug: amount was hardcoded to old flat
  // plan fees (₹1,50,000 / ₹4,20,000) with zero connection to which tier
  // was actually selected. Now computed from that tier's real price ×
  // plan duration. If a tier's price is still "TBD" (the physical tiers,
  // per the source sheet), amount is left at 0 for manual entry rather
  // than guessing a number.
  const computeAmount = (tier: string, plan: string) => {
    const base = tierPricing[tier]
    if (base == null) return 0
    return plan === 'yearly' ? base : base * 3
  }

  const fetchMembers = async (p = 1) => {
    setLoading(true); setError('')
    try {
      const res = await MembersAPI.list({ status: statusFilter||undefined, tier: tierFilter||undefined, page: p, page_size: 20 })
      setMembers(res.items || res)
      setHasMore(res.has_more || false)
      setPage(p)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const openView = async (m: any) => {
    setViewing(m); setScore(null)
    try { setScore(await MembersAPI.score(m.id)) } catch {}
  }

  const openEdit = (m: any) => {
    setEditing({
      id:           m.id,
      plan:         m.plan || 'yearly',
      tier:         m.tier || 'connect',
      status:       m.status || 'active',
      renewal_date: m.renewal_date ? m.renewal_date.split('T')[0] : '',
      amount:       m.amount || computeAmount(m.tier || 'connect', m.plan || 'yearly'),
      name:         m.user?.name || '',
      email:        m.user?.email || '',
      city:         m.user?.city || '',
      state:        m.user?.state || '',
      country:      m.user?.country || '',
    })
  }

  const openWarn = (m: any) => {
    setWarning(m)
    setWarnForm({ reason:'', warning_type:'conduct' })
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await MembersAPI.update(editing.id, {
        plan:         editing.plan,
        tier:         editing.tier,
        status:       editing.status,
        renewal_date: editing.renewal_date || undefined,
        name:         editing.name,
        city:         editing.city,
        state:        editing.state,
        country:      editing.country,
      })
      setEditing(null)
      setMsg('✅ Membership updated!')
      fetchMembers(page)
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const saveWarn = async () => {
    if (!warning || !warnForm.reason) return
    setSaving(true)
    try {
      await MembersAPI.warn(warning.id, { reason: warnForm.reason, warning_type: warnForm.warning_type })
      setWarning(null)
      setMsg('✅ Warning issued to ' + (warning.user?.name || 'member'))
      fetchMembers(page)
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const approveMember = async (id: string, name: string) => {
    try {
      await MembersAPI.approve(id)
      setMsg('✅ ' + name + ' approved')
      fetchMembers(page)
    } catch (e: any) { setMsg('❌ ' + e.message) }
  }

  const enrollMember = async () => {
    if (!enrollForm.user_id || !enrollForm.group_id || !enrollForm.territory_id) return
    setSaving(true)
    try {
      await MembersAPI.enroll(enrollForm)
      setShowEnroll(false)
      setEnrollForm({ user_id:'', group_id:'', territory_id:'', plan:'yearly', tier:'connect', amount:1999 })
      setMsg('✅ Member enrolled successfully!')
      fetchMembers(1)
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  // Auto-fill territory when group is selected
  const onGroupSelect = (group_id: string) => {
    const g = groups.find(g => g.id === group_id)
    setEnrollForm({
      ...enrollForm,
      group_id,
      territory_id: g?.territory_id || enrollForm.territory_id,
    })
  }

  const filtered = search
    ? members.filter(m =>
        m.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.user?.city?.toLowerCase().includes(search.toLowerCase()) ||
        m.user?.email?.toLowerCase().includes(search.toLowerCase()))
    : members

  const visibleMembers = filtered.filter(m =>
    (!countryFilter || m.user?.country?.toLowerCase() === countryFilter.toLowerCase()) &&
    (!stateFilter || m.user?.state?.toLowerCase() === stateFilter.toLowerCase()) &&
    (!cityFilter || m.user?.city?.toLowerCase() === cityFilter.toLowerCase()))

  const exportCSV = async () => {
    try {
      const result = await MembersAPI.exportList({status:statusFilter||undefined,tier:tierFilter||undefined,country:countryFilter||undefined,state:stateFilter||undefined,city:cityFilter||undefined,search:search||undefined})
      const rows = result.items || result || []
      const cell = (v:any) => `"${String(v ?? '').replace(/"/g,'""')}"`
      const csv = ['Name,Email,Phone,Country,State / Province,City,Plan,Tier,Status,Joined Date', ...rows.map((m:any)=>[m.user?.name,m.user?.email,m.user?.phone,m.user?.country,m.user?.state,m.user?.city,m.plan,m.tier,m.status,m.joined_date].map(cell).join(','))].join('\n')
      const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})); const a=document.createElement('a')
      a.href=url; a.download=`networkx-members-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url)
      setMsg(`✅ Downloaded ${rows.length} member records`)
    } catch(e:any) { setMsg('❌ '+e.message) }
  }

  // Find selected group/territory names for display
  const selectedGroup     = groups.find(g => g.id === enrollForm.group_id)
  const selectedTerritory = territories.find(t => t.id === enrollForm.territory_id)

  return (
    <div className="page">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:18,fontWeight:800}}>Members</h2>
          <p style={{fontSize:13,color:'#9ca3af'}}>All members across all groups</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-g btn-sm" title="One-time fix: sets tier='connect' on any older membership record that predates the tier field"
            onClick={async () => { try { const r = await MembersAPI.backfillTiers(); setMsg(`✅ ${r.message}`); fetchMembers(page) } catch (e: any) { setMsg('❌ ' + e.message) } }}>
            <FontAwesomeIcon icon={faScrewdriverWrench} className="mr-1.5"/>Fix Missing Tiers
          </button>
          <button className="btn btn-g" onClick={exportCSV}><FontAwesomeIcon icon={faDownload} className="mr-1.5"/>Download CSV</button>
          <button className="btn btn-p" onClick={() => setShowEnroll(true)}>+ Enroll Member</button>
        </div>
      </div>

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

      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        <input placeholder="Search name, email, city…" value={search}
          onChange={e => setSearch(e.target.value)} style={{maxWidth:280}}/>
        <div style={{display:'flex',gap:6}}>
          {['','active','warning','inactive'].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter===s?'btn-p':'btn-g'}`}
              onClick={() => setStatusFilter(s)} style={{textTransform:'capitalize'}}>
              {s||'All'}
            </button>
          ))}
        </div>
        <select value={tierFilter} onChange={e=>setTierFilter(e.target.value)} style={{maxWidth:170}}>
          <option value="">All Tiers</option>
          {TIER_OPTIONS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
        <input placeholder="Country" value={countryFilter} onChange={e=>setCountryFilter(e.target.value)} style={{maxWidth:140}}/>
        <input placeholder="State / Province" value={stateFilter} onChange={e=>setStateFilter(e.target.value)} style={{maxWidth:160}}/>
        <input placeholder="City" value={cityFilter} onChange={e=>setCityFilter(e.target.value)} style={{maxWidth:140}}/>
      </div>

      {error && <div style={{background:'rgba(255,90,90,.1)',border:'1px solid rgba(255,90,90,.3)',borderRadius:10,padding:'10px 14px',marginBottom:12,color:'#ef4444',fontSize:13}}>{error}</div>}

      <div className="card" style={{padding:0,overflow:'hidden',marginBottom:12}}>
        <table className="tbl">
          <thead>
            <tr>{['Member','Email','City','Plan','Tier','Score','Attendance','Refs','Status','Risk','Actions'].map(h=><th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading
              ? [...Array(8)].map((_,i) => (
                <tr key={i}>{[...Array(10)].map((_,j) => (
                  <td key={j}><div style={{height:13,background:'rgba(255,255,255,.06)',borderRadius:4,width:'80%'}}/></td>
                ))}</tr>
              ))
              : visibleMembers.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:32,height:32,borderRadius:'50%',background:'#6366f1',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:12,fontWeight:700,flexShrink:0}}>
                        {m.user?.name?.charAt(0)||'?'}
                      </div>
                      <span style={{fontWeight:600,fontSize:13}}>{m.user?.name||'—'}</span>
                    </div>
                  </td>
                  <td style={{fontSize:12,color:'#6b7280'}}>{m.user?.email||'—'}</td>
                  <td style={{fontSize:12}}>{m.user?.city||'—'}</td>
                  <td><span style={{fontSize:11,padding:'2px 8px',borderRadius:99,background:'rgba(22,143,255,.1)',color:'#3b82f6',fontWeight:600,textTransform:'capitalize'}}>{m.plan||'—'}</span></td>
                  <td><span className="badge b-blue" style={{textTransform:'capitalize'}}>{(m.tier||'—').replace('_',' ')}</span></td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:40,height:4,background:'rgba(255,255,255,.06)',borderRadius:99}}>
                        <div style={{height:'100%',borderRadius:99,background:m.score>=80?'#10b981':m.score>=60?'#f59e0b':'#ef4444',width:`${Math.min(m.score||0,100)}%`}}/>
                      </div>
                      <span style={{fontSize:12,fontWeight:600}}>{m.score||0}</span>
                    </div>
                  </td>
                  <td style={{fontSize:12}}>{m.attendance_pct||0}%</td>
                  <td style={{fontSize:12}}>{m.refs_given||0}</td>
                  <td><span style={{fontSize:11,padding:'2px 8px',borderRadius:99,background:(STATUS_COLOR[m.status]||'#9ca3af')+'22',color:STATUS_COLOR[m.status]||'#9ca3af',fontWeight:600,textTransform:'capitalize'}}>{m.status||'—'}</span></td>
                  <td>
                    {riskById[m.id] ? (
                      <span title={riskById[m.id].reasons.join(' · ')} style={{fontSize:11,padding:'2px 8px',borderRadius:99,fontWeight:600,
                        background:RISK_BG[riskById[m.id].risk_level] || 'rgba(156,163,175,.15)',
                        color:RISK_COLOR[riskById[m.id].risk_level] || '#9ca3af'}}>
                        {riskById[m.id].risk_level==='high'?'🔴':riskById[m.id].risk_level==='medium'?'🟡':'🟢'} {riskById[m.id].risk_level}
                      </span>
                    ) : <span style={{fontSize:11,color:'#6b7280'}}>—</span>}
                  </td>
                  <td>
                    <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                      <button className="btn btn-xs btn-g" onClick={() => openView(m)}>View</button>
                      <button className="btn btn-xs btn-g" style={{color:'#6366f1'}} onClick={() => openEdit(m)}>Edit</button>
                      <button className="btn btn-xs btn-g" style={{color:'#f59e0b'}} onClick={() => openWarn(m)}>Warn</button>
                      {m.status !== 'active' && (
                        <button className="btn btn-xs btn-g" style={{color:'#10b981'}}
                          onClick={() => approveMember(m.id, m.user?.name||'Member')}>Approve</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      <div style={{display:'flex',gap:6,justifyContent:'center'}}>
        <button className="btn btn-g btn-sm" disabled={page===1} onClick={() => fetchMembers(page-1)}><FontAwesomeIcon icon={faArrowLeft} className="mr-1.5"/>Prev</button>
        <span style={{padding:'6px 12px',fontSize:13,color:'#9ca3af'}}>Page {page}</span>
        <button className="btn btn-g btn-sm" disabled={!hasMore} onClick={() => fetchMembers(page+1)}>Next <FontAwesomeIcon icon={faArrowRight} className="ml-1"/></button>
      </div>

      {/* ── VIEW MODAL ─────────────────────────────────────────────── */}
      {viewing && (
        <div className="overlay" onClick={e => e.target===e.currentTarget && setViewing(null)}>
          <div className="modal modal-lg">
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
              <div style={{width:48,height:48,borderRadius:'50%',background:'#6366f1',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18,fontWeight:700}}>
                {viewing.user?.name?.charAt(0)||'?'}
              </div>
              <div>
                <h3 style={{fontSize:16,fontWeight:700,margin:0}}>{viewing.user?.name||'Member'}</h3>
                <div style={{fontSize:12,color:'#9ca3af',marginTop:2}}>{viewing.user?.email||'—'}</div>
              </div>
            </div>
            <div className="form-grid" style={{marginBottom:14}}>
              {[
                ['Phone',         viewing.user?.phone||'—'],
                ['City',          viewing.user?.city||'—'],
                ['State / Province', viewing.user?.state||'—'],
                ['Country',       viewing.user?.country||'—'],
                ['Plan',          viewing.plan||'—'],
                ['Tier',          (viewing.tier||'—').replace('_',' ')],
                ['Status',        viewing.status||'—'],
                ['Score',         viewing.score||0],
                ['Refs Given',    viewing.refs_given||0],
                ['Refs Received', viewing.refs_received||0],
                ['Attendance',    `${viewing.attendance_pct||0}%`],
                ['Renewal Date',  viewing.renewal_date?new Date(viewing.renewal_date).toLocaleDateString():'—'],
              ].map(([k,v]) => (
                <div key={String(k)}>
                  <div style={{fontSize:11,color:'#9ca3af',marginBottom:2}}>{k}</div>
                  <div style={{fontSize:13,fontWeight:600}}>{String(v)}</div>
                </div>
              ))}
            </div>
            {score && (
              <div style={{background:'rgba(255,255,255,.04)',borderRadius:10,padding:12,marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>Score Breakdown</div>
                <div className="form-grid">
                  {Object.entries(score.breakdown||{}).map(([k,v]) => (
                    <div key={k}>
                      <div style={{fontSize:11,color:'#9ca3af'}}>{k.replace(/_/g,' ')}</div>
                      <div style={{fontSize:15,fontWeight:700}}>{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-g btn-sm" onClick={() => { openEdit(viewing); setViewing(null) }}>Edit</button>
              <button className="btn btn-g btn-sm" style={{color:'#f59e0b'}} onClick={() => { openWarn(viewing); setViewing(null) }}>Warn</button>
              {viewing.status !== 'active' && (
                <button className="btn btn-p btn-sm" onClick={() => { approveMember(viewing.id, viewing.user?.name||''); setViewing(null) }}>Approve</button>
              )}
              <button className="btn btn-g" style={{flex:1}} onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ─────────────────────────────────────────────── */}
      {editing && (
        <div className="overlay" onClick={e => e.target===e.currentTarget && setEditing(null)}>
          <div className="modal modal-lg">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>Edit Membership</h3>
            <p style={{fontSize:13,color:'#9ca3af',marginBottom:16}}>{editing.name} · {editing.email}</p>
            <div className="form-grid">
              <div className="fg"><label>Registered Name</label><input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/></div>
              <div className="fg"><label>City</label><input value={editing.city} onChange={e=>setEditing({...editing,city:e.target.value})}/></div>
              <div className="fg"><label>State / Province</label><input value={editing.state} onChange={e=>setEditing({...editing,state:e.target.value})}/></div>
              <div className="fg"><label>Country</label><input value={editing.country} onChange={e=>setEditing({...editing,country:e.target.value})}/></div>
              <div className="fg"><label>Plan</label>
                <select value={editing.plan} onChange={e => setEditing({...editing,plan:e.target.value,amount:computeAmount(editing.tier,e.target.value)})}>
                  <option value="yearly">Yearly</option>
                  <option value="three_year">3-Year</option>
                </select>
              </div>
              <div className="fg"><label>NetworkX Tier</label>
                <select value={editing.tier} onChange={e => setEditing({...editing,tier:e.target.value,amount:computeAmount(e.target.value,editing.plan)})}>
                  <option value="connect">Connect</option>
                  <option value="growth">Growth</option>
                  <option value="elite">Elite</option>
                  <option value="city_leadership">City Leadership</option>
                  <option value="national">National</option>
                  <option value="global">Global</option>
                </select>
              </div>
              <div className="fg"><label>Status</label>
                <select value={editing.status} onChange={e => setEditing({...editing,status:e.target.value})}>
                  <option value="active">Active</option>
                  <option value="warning">Warning</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="fg"><label>Renewal Date</label>
                <input type="date" value={editing.renewal_date||''} onChange={e => setEditing({...editing,renewal_date:e.target.value})}/>
              </div>
              <div className="fg"><label>Amount Paid (₹)</label>
                <input type="number" value={editing.amount||computeAmount(editing.tier,editing.plan)} onChange={e => setEditing({...editing,amount:Number(e.target.value)})}/>
              </div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p" style={{flex:1}} onClick={saveEdit} disabled={saving}>{saving?'Saving…':'Save Changes'}</button>
              <button className="btn btn-g" style={{flex:1}} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── WARN MODAL ─────────────────────────────────────────────── */}
      {warning && (
        <div className="overlay" onClick={e => e.target===e.currentTarget && setWarning(null)}>
          <div className="modal">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}><FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5"/>Issue Warning</h3>
            <p style={{fontSize:13,color:'#9ca3af',marginBottom:16}}>To: {warning.user?.name||'Member'}</p>
            <div className="fg"><label>Warning Type *</label>
              <select value={warnForm.warning_type} onChange={e => setWarnForm({...warnForm,warning_type:e.target.value})}>
                <option value="conduct">Conduct</option>
                <option value="absent">Excessive Absence</option>
                <option value="no_referral">No Referral (30+ days)</option>
                <option value="dues">Dues Overdue</option>
                <option value="no_visitor">No Visitor (90+ days)</option>
              </select>
            </div>
            <div className="fg"><label>Reason *</label>
              <textarea rows={3} value={warnForm.reason} onChange={e => setWarnForm({...warnForm,reason:e.target.value})}
                placeholder="Describe the reason for this warning…"/>
            </div>
            <div style={{background:'rgba(255,75,10,.1)',borderRadius:10,padding:'10px 12px',marginBottom:14,fontSize:12,color:'#fbc568',border:'1px solid rgba(255,75,10,.3)'}}>
              <FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5"/>Warning will be logged and notified to member. It will affect their score.
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p" style={{flex:1,background:'#f59e0b',borderColor:'#f59e0b'}}
                onClick={saveWarn} disabled={saving||!warnForm.reason}>{saving?'Issuing…':'Issue Warning'}</button>
              <button className="btn btn-g" style={{flex:1}} onClick={() => setWarning(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ENROLL MODAL — GROUP & TERRITORY DROPDOWNS ─────────────── */}
      {showEnroll && (
        <div className="overlay" onClick={e => e.target===e.currentTarget && setShowEnroll(false)}>
          <div className="modal modal-lg">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>+ Enroll New Member</h3>
            <p style={{fontSize:13,color:'#9ca3af',marginBottom:16}}>
              The user must already have an account. Select their group — territory auto-fills.
            </p>
            <div style={{position:'relative'}}>
              <div className="form-grid">
                <UserSearchPicker
                  label="Member to Enroll"
                  required
                  placeholder="Search by name, email or city…"
                  value={enrollForm.user_id}
                  onChange={(id, user) => setEnrollForm({...enrollForm, user_id: id})}
                />
                <div className="fg">
                  <label>Membership Plan</label>
                  <select value={enrollForm.plan}
                    onChange={e => setEnrollForm({
                      ...enrollForm, plan:e.target.value,
                      amount: computeAmount(enrollForm.tier, e.target.value)
                    })}>
                    <option value="yearly">Yearly</option>
                    <option value="three_year">3-Year</option>
                  </select>
                </div>
                <div className="fg">
                  <label>NetworkX Tier</label>
                  <select value={enrollForm.tier} onChange={e => setEnrollForm({...enrollForm, tier:e.target.value, amount:computeAmount(e.target.value, enrollForm.plan)})}>
                    <option value="connect">Connect</option>
                    <option value="growth">Growth</option>
                    <option value="elite">Elite</option>
                    <option value="city_leadership">City Leadership</option>
                    <option value="national">National</option>
                    <option value="global">Global</option>
                  </select>
                </div>
              </div>

              {/* Group dropdown */}
              <div style={{position:'relative'}}>
                <SearchSelect
                  label="Group * (select to auto-fill territory)"
                  items={groups}
                  value={enrollForm.group_id}
                  onChange={onGroupSelect}
                  placeholder="Search group by name or city…"
                  displayFn={g => g.name}
                  subFn={g => `${g.city||'—'} · ${g.members_count||0}/${g.capacity||0} members`}
                />
              </div>

              {/* Territory — auto-filled from group, but can override */}
              <div style={{position:'relative'}}>
                <SearchSelect
                  label="Territory *"
                  items={territories}
                  value={enrollForm.territory_id}
                  onChange={id => setEnrollForm({...enrollForm, territory_id:id})}
                  placeholder="Search territory…"
                  displayFn={t => t.name}
                  subFn={t => `${t.city||'—'}, ${t.country||'—'}`}
                />
              </div>

              {/* Confirmation banner */}
              {enrollForm.group_id && enrollForm.territory_id && (
                <div style={{background:'rgba(39,216,109,.1)',border:'1px solid rgba(39,216,109,.3)',borderRadius:10,
                  padding:'10px 14px',marginBottom:12,fontSize:12,color:'#15803d'}}>
                  <FontAwesomeIcon icon={faCircleCheck} className="mr-1.5"/>Group: <strong>{selectedGroup?.name||'—'}</strong> ·
                  Territory: <strong>{selectedTerritory?.name||'—'}</strong> ·
                  Plan: <strong>₹{enrollForm.amount.toLocaleString()}</strong>
                </div>
              )}

              <div className="fg">
                <label>Amount (₹)</label>
                <input type="number" value={enrollForm.amount}
                  onChange={e => setEnrollForm({...enrollForm,amount:Number(e.target.value)})}/>
                <div style={{fontSize:11,color:'#9ca3af',marginTop:4}}>
                  {tierPricing[enrollForm.tier] == null ? 'Pricing for this tier is TBD — enter manually.' : `Auto-filled from ${enrollForm.tier} tier pricing — edit if needed`}
                </div>
              </div>
            </div>

            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn btn-p" style={{flex:1}} onClick={enrollMember}
                disabled={saving||!enrollForm.user_id||!enrollForm.group_id||!enrollForm.territory_id}>
                {saving?'Enrolling…':'Enroll Member'}
              </button>
              <button className="btn btn-g" style={{flex:1}} onClick={() => setShowEnroll(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
