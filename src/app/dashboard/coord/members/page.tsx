'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faClock, faArrowRight, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react'
import { MembersAPI, TokenStore } from '@/lib/api'
import UserSearchPicker from '@/components/ui/UserSearchPicker'
import { Loading, ApiError, Empty } from '@/components/shared/States'

const STATUS_COLOR: Record<string,string> = { active:'#10b981', warning:'#f59e0b', inactive:'#ef4444' }
const TIER_OPTIONS = [
  ['connect','Connect'],['growth','Growth'],['elite','Elite'],
  ['city_leadership','City Leadership'],['national','National'],['global','Global'],
]

export default function CoordMembersPage() {
  const me = TokenStore.getUser()
  const [members,      setMembers]      = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [page,         setPage]         = useState(1)
  const [hasMore,      setHasMore]      = useState(false)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tierFilter,   setTierFilter]   = useState('')
  const [msg,          setMsg]          = useState('')
  const [saving,       setSaving]       = useState(false)

  const [viewing,    setViewing]    = useState<any|null>(null)
  const [score,      setScore]      = useState<any|null>(null)
  const [warning,    setWarning]    = useState<any|null>(null)
  const [showEnroll, setShowEnroll] = useState(false)

  const [warnForm, setWarnForm] = useState({ reason:'', warning_type:'conduct' })
  const emptyEnroll = { user_id:'', plan:'yearly', tier:'connect', amount:150000 }
  const [enrollForm, setEnrollForm] = useState(emptyEnroll)

  const fetchMembers = async (p = 1) => {
    setLoading(true); setError('')
    try {
      // group_id is omitted on purpose — the backend already scopes a
      // coordinator's own group_id server-side (ScopeService.get_members_scope)
      const res = await MembersAPI.list({ status: statusFilter||undefined, tier: tierFilter||undefined, page: p, page_size: 20 })
      setMembers(res.items || res)
      setHasMore(res.has_more || false)
      setPage(p)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchMembers(1) }, [statusFilter, tierFilter])

  const openView = async (m: any) => {
    setViewing(m); setScore(null)
    try { setScore(await MembersAPI.score(m.id)) } catch {}
  }

  const openWarn = (m: any) => { setWarning(m); setWarnForm({ reason:'', warning_type:'conduct' }) }

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
    if (!enrollForm.user_id || !me?.group_id || !me?.territory_id) return
    setSaving(true)
    try {
      await MembersAPI.enroll({ ...enrollForm, group_id: me.group_id, territory_id: me.territory_id })
      setShowEnroll(false)
      setEnrollForm(emptyEnroll)
      setMsg('✅ Member enrolled successfully!')
      fetchMembers(1)
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const filtered = search
    ? members.filter(m =>
        m.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.user?.email?.toLowerCase().includes(search.toLowerCase()))
    : members

  const avgScore = members.length ? Math.round(members.reduce((s,m)=>s+(m.score||0),0)/members.length) : 0
  const pending = members.filter(m => m.status !== 'active')

  return (
    <div className="page">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:18,fontWeight:800}}>Members</h2>
          <p style={{fontSize:13,color:'#9ca3af'}}>Your group's members — performance, attendance and approvals</p>
        </div>
        <button className="btn btn-p" onClick={()=>setShowEnroll(true)}>+ Enroll Member</button>
      </div>

      {msg && (
        <div className="toast-in" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,marginBottom:12,fontSize:13,
          background:msg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
          color:msg.startsWith('✅')?'#16a34a':'#ef4444',
          border:`1px solid ${msg.startsWith('✅')?'rgba(39,216,109,.35)':'rgba(255,90,90,.35)'}`}}>
          {msg}<button style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}} onClick={()=>setMsg('')}>✕</button>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
        {[
          {l:'TOTAL MEMBERS',v:members.length,c:'#6366f1'},
          {l:'PENDING APPROVAL',v:pending.length,c:'#f59e0b'},
          {l:'AVG GROUP SCORE',v:`${avgScore}/100`,c:'#10b981'},
        ].map(s=>(
          <div key={s.l} style={{background:`linear-gradient(135deg,${s.c},${s.c}cc)`,borderRadius:12,padding:'14px 16px',boxShadow:`0 2px 4px rgba(0,0,0,.35), 0 14px 32px -10px ${s.c}66, inset 0 1px 0 rgba(255,255,255,.18)`}}>
            <div style={{fontSize:22,fontWeight:800,color:'#fff'}}>{s.v}</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.75)',marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div className="card" style={{marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:10}}><FontAwesomeIcon icon={faClock} className="mr-1.5"/>Pending Approval ({pending.length})</div>
          {pending.map(m=>(
            <div key={m.id} style={{display:'flex',gap:12,padding:'10px 0',borderBottom:'1px solid #f3f4f6',alignItems:'center'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{m.user?.name||'—'}</div>
                <div style={{fontSize:11,color:'#9ca3af'}}>{m.user?.email||'—'} · Status: {m.status}</div>
              </div>
              <button className="btn btn-xs btn-p" onClick={()=>approveMember(m.id, m.user?.name||'Member')}>Approve</button>
            </div>
          ))}
        </div>
      )}

      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        <input placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:280}}/>
        <div style={{display:'flex',gap:6}}>
          {['','active','warning','inactive'].map(s=>(
            <button key={s} className={`btn btn-sm ${statusFilter===s?'btn-p':'btn-g'}`} onClick={()=>setStatusFilter(s)} style={{textTransform:'capitalize'}}>{s||'All'}</button>
          ))}
        </div>
        <select value={tierFilter} onChange={e=>setTierFilter(e.target.value)} style={{maxWidth:170}}>
          <option value="">All Tiers</option>
          {TIER_OPTIONS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading ? <Loading label="Loading members…"/> : error ? <ApiError message={error} onRetry={()=>fetchMembers(page)}/> :
       filtered.length === 0 ? <Empty label="No members found"/> : (
        <div className="card" style={{padding:0,overflow:'hidden',marginBottom:12}}>
          <table className="tbl">
            <thead><tr>{['Name','Tier','Score','Referrals','Attendance','Status','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(m=>(
                <tr key={m.id}>
                  <td style={{fontWeight:600}}>{m.user?.name||'—'}</td>
                  <td><span className="badge b-blue" style={{textTransform:'capitalize'}}>{(m.tier||'—').replace('_',' ')}</span></td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:80,height:6,background:'rgba(255,255,255,.06)',borderRadius:99,overflow:'hidden'}}>
                        <div style={{height:'100%',width:(m.score||0)+'%',background:m.score>=80?'#10b981':m.score>=60?'#f59e0b':'#ef4444',borderRadius:99}}/>
                      </div>
                      <span style={{fontSize:12,fontWeight:700}}>{m.score||0}</span>
                    </div>
                  </td>
                  <td>{m.refs_given||0}</td>
                  <td style={{color:(m.attendance_pct||0)>=80?'#10b981':'#ef4444',fontWeight:600}}>{m.attendance_pct||0}%</td>
                  <td><span style={{fontSize:11,padding:'2px 8px',borderRadius:99,background:(STATUS_COLOR[m.status]||'#9ca3af')+'22',color:STATUS_COLOR[m.status]||'#9ca3af',fontWeight:600,textTransform:'capitalize'}}>{m.status||'—'}</span></td>
                  <td>
                    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                      <button className="btn btn-xs btn-g" onClick={()=>openView(m)}>View</button>
                      <button className="btn btn-xs btn-g" style={{color:'#f59e0b'}} onClick={()=>openWarn(m)}>Warn</button>
                      {m.status !== 'active' && <button className="btn btn-xs btn-g" style={{color:'#10b981'}} onClick={()=>approveMember(m.id, m.user?.name||'Member')}>Approve</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{display:'flex',gap:6,justifyContent:'center'}}>
        <button className="btn btn-g btn-sm" disabled={page===1} onClick={()=>fetchMembers(page-1)}><FontAwesomeIcon icon={faArrowLeft} className="mr-1.5"/>Prev</button>
        <span style={{padding:'6px 12px',fontSize:13,color:'#9ca3af'}}>Page {page}</span>
        <button className="btn btn-g btn-sm" disabled={!hasMore} onClick={()=>fetchMembers(page+1)}>Next <FontAwesomeIcon icon={faArrowRight} className="ml-1"/></button>
      </div>

      {/* ── VIEW MODAL ─────────────────────────────────────────────── */}
      {viewing && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setViewing(null)}>
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
                ['Phone', viewing.user?.phone||'—'], ['City', viewing.user?.city||'—'],
                ['Plan', viewing.plan||'—'], ['Tier', (viewing.tier||'—').replace('_',' ')],
                ['Status', viewing.status||'—'], ['Score', viewing.score||0],
                ['Refs Given', viewing.refs_given||0], ['Attendance', `${viewing.attendance_pct||0}%`],
              ].map(([k,v])=>(
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
                  {Object.entries(score.breakdown||{}).map(([k,v])=>(
                    <div key={k}><div style={{fontSize:11,color:'#9ca3af'}}>{k.replace(/_/g,' ')}</div><div style={{fontSize:15,fontWeight:700}}>{String(v)}</div></div>
                  ))}
                </div>
              </div>
            )}
            <div style={{fontSize:11,color:'#9ca3af',marginBottom:12}}>Plan/tier changes require a franchise admin — reach out if this member needs an update.</div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-g btn-sm" style={{color:'#f59e0b'}} onClick={()=>{openWarn(viewing);setViewing(null)}}>Warn</button>
              {viewing.status !== 'active' && <button className="btn btn-p btn-sm" onClick={()=>{approveMember(viewing.id, viewing.user?.name||'');setViewing(null)}}>Approve</button>}
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── WARN MODAL ─────────────────────────────────────────────── */}
      {warning && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setWarning(null)}>
          <div className="modal">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}><FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5"/>Issue Warning</h3>
            <p style={{fontSize:13,color:'#9ca3af',marginBottom:16}}>To: {warning.user?.name||'Member'}</p>
            <div className="fg"><label>Warning Type *</label>
              <select value={warnForm.warning_type} onChange={e=>setWarnForm({...warnForm,warning_type:e.target.value})}>
                <option value="conduct">Conduct</option>
                <option value="absent">Excessive Absence</option>
                <option value="no_referral">No Referral (30+ days)</option>
                <option value="dues">Dues Overdue</option>
                <option value="no_visitor">No Visitor (90+ days)</option>
              </select>
            </div>
            <div className="fg"><label>Reason *</label>
              <textarea rows={3} value={warnForm.reason} onChange={e=>setWarnForm({...warnForm,reason:e.target.value})} placeholder="Describe the reason for this warning…"/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p" style={{flex:1,background:'#f59e0b',borderColor:'#f59e0b'}} onClick={saveWarn} disabled={saving||!warnForm.reason}>{saving?'Issuing…':'Issue Warning'}</button>
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setWarning(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ENROLL MODAL ─────────────────────────────────────────────── */}
      {showEnroll && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowEnroll(false)}>
          <div className="modal modal-lg">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>+ Enroll New Member</h3>
            <p style={{fontSize:13,color:'#9ca3af',marginBottom:16}}>The user must already have an account. They'll be enrolled into your group automatically.</p>
            <UserSearchPicker
              label="Member to Enroll" required
              placeholder="Search by name, email or city…"
              value={enrollForm.user_id}
              onChange={(id)=>setEnrollForm({...enrollForm, user_id: id})}
            />
            <div className="form-grid">
              <div className="fg"><label>Membership Plan</label>
                <select value={enrollForm.plan} onChange={e=>setEnrollForm({...enrollForm, plan:e.target.value, amount: e.target.value==='yearly'?150000:420000})}>
                  <option value="yearly">Yearly — ₹1,50,000</option>
                  <option value="three_year">3-Year — ₹4,20,000</option>
                </select>
              </div>
              <div className="fg"><label>NetworkX Tier</label>
                <select value={enrollForm.tier} onChange={e=>setEnrollForm({...enrollForm, tier:e.target.value})}>
                  {TIER_OPTIONS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="fg"><label>Amount (₹)</label>
              <input type="number" value={enrollForm.amount} onChange={e=>setEnrollForm({...enrollForm,amount:Number(e.target.value)})}/>
            </div>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn btn-p" style={{flex:1}} onClick={enrollMember} disabled={saving||!enrollForm.user_id}>{saving?'Enrolling…':'Enroll Member'}</button>
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowEnroll(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
