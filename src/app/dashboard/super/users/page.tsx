'use client'
import { Loading } from '@/components/shared/States'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faTriangleExclamation, faCircleCheck, faClipboard, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react'
import { SuperAdminAPI, TokenStore } from '@/lib/api'

const ROLE_COLORS: Record<string,string> = {
  member:'#6366f1',
  franchise:'#f59e0b', hq_admin:'#8b5cf6'
  // super_admin excluded from this page intentionally
}
const ROLE_LABELS: Record<string,string> = {
  member:'Member',
  franchise:'Franchise', hq_admin:'HQ Admin'
}

export default function SuperUsersPage() {
  const [users,        setUsers]        = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [search,       setSearch]       = useState('')
  const [roleFilter,   setRoleFilter]   = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all'|'active'|'suspended'|'unverified'>('all')
  const [countryFilter,setCountryFilter]= useState('')
  const [cityFilter,   setCityFilter]   = useState('')
  const [page,         setPage]         = useState(1)
  const [hasMore,      setHasMore]      = useState(false)
  // Real server-side counts (all roles, all pages) — previously these
  // were users.length over whatever single page of 20 happened to load,
  // never the true total, and silently 0 whenever that fetch failed.
  const [stats,        setStats]        = useState<{total:number|null,active:number|null,suspended:number|null,unverified:number|null}>({total:null,active:null,suspended:null,unverified:null})
  const [regStats,     setRegStats]     = useState<{today:number|null,yesterday:number|null,last_7_days:number|null,last_30_days:number|null}>({today:null,yesterday:null,last_7_days:null,last_30_days:null})
  // Country dropdown is lazy-loaded (only Country, ~93KB — not the full
  // city dataset that turned out to be an 8MB problem on the Pricing
  // page) so this admin-only page's own initial bundle stays light too.
  const [countries,    setCountries]    = useState<any[]>([])
  const [msg,          setMsg]          = useState('')
  const [selected,     setSelected]     = useState<any|null>(null)
  const [editing,      setEditing]      = useState<any|null>(null)
  const [editLoading,  setEditLoading]  = useState(false)
  const [showCreate,   setShowCreate]   = useState(false)
  const [actionLoading,setActionLoading]= useState(false)
  const [impersonating, setImpersonating] = useState<string|null>(null)
  const [copied,       setCopied]       = useState('')
  const [roleReason,   setRoleReason]   = useState('')
  const [newRoleVal,   setNewRoleVal]   = useState('')
  const [statusReason, setStatusReason] = useState('')
  const emptyForm = { name:'', email:'', phone:'', password:'', role:'member', city:'', profession:'', company:'' }
  const [form,         setForm]         = useState(emptyForm)
  const [formError,    setFormError]    = useState('')

  useEffect(() => { fetchUsers(1, roleFilter) }, [roleFilter, statusFilter, countryFilter])

  useEffect(() => {
    SuperAdminAPI.getUserStats().then(setStats).catch(() => {})
    SuperAdminAPI.getRegistrationStats().then(setRegStats).catch(() => {})
    import("country-state-city/lib/country").then(mod => setCountries(mod.default.getAllCountries()))
  }, [])

  const fetchUsers = async (p = 1, role = roleFilter) => {
    setLoading(true); setError('')
    try {
      const params: any = { page: p, page_size: 20 }
      if (role !== 'all') params.role = role
      if (search) params.search = search
      if (statusFilter === 'active') params.is_active = true
      else if (statusFilter === 'suspended') params.is_active = false
      else if (statusFilter === 'unverified') params.email_verified = false
      if (countryFilter) params.country = countryFilter
      if (cityFilter) params.city = cityFilter
      const res = await SuperAdminAPI.getUsers(params)
      // Filter out super_admin — they manage themselves, not shown here
      const filtered = (res.items || res).filter((u: any) => u.role !== 'super_admin')
      setUsers(filtered)
      setHasMore(res.has_more || false)
      setPage(p)
    } catch (e: any) { setError(e.message || 'Failed to load') }
    finally { setLoading(false) }
  }

  // Fetch full user profile before edit (to get profession, company etc.)
  const openEdit = async (u: any) => {
    setEditLoading(true)
    setEditing(u)
    setForm({ name:u.name||'', email:u.email||'', phone:u.phone||'', password:'',
              role:u.role||'member', city:u.city||'', profession:'', company:'' })
    setFormError('')
    try {
      // Fetch full profile to get all fields including profession/company
      const full = await SuperAdminAPI.getUser(u.id)
      setForm({
        name:       full.name       || u.name       || '',
        email:      full.email      || u.email       || '',
        phone:      full.phone      || u.phone       || '',
        password:   '',
        role:       full.role       || u.role        || 'member',
        city:       full.city       || u.city        || '',
        profession: full.profession || '',
        company:    full.company    || '',
      })
    } catch {
      // If full fetch fails, use what we have from list
    } finally {
      setEditLoading(false)
    }
  }

  const saveEdit = async () => {
    if (!form.name || !form.email) return setFormError('Name and email are required')
    setActionLoading(true); setFormError('')
    try {
      // Update role if changed
      if (form.role !== editing.role) {
        await SuperAdminAPI.updateRole(editing.id, form.role, 'Profile updated by admin')
      }
      setMsg(`✅ ${form.name} updated`)
      setEditing(null)
      fetchUsers(page, roleFilter)
    } catch (e: any) { setFormError(e.message) }
    finally { setActionLoading(false) }
  }

  const createUser = async () => {
    if (!form.name || !form.email || !form.phone || !form.password) return setFormError('Name, email, phone and password are required')
    setActionLoading(true); setFormError('')
    try {
      await SuperAdminAPI.createUser(form)
      setShowCreate(false); setForm(emptyForm)
      setMsg(`✅ User "${form.name}" created as ${ROLE_LABELS[form.role]||form.role}`)
      fetchUsers(1, roleFilter)
      SuperAdminAPI.getUserStats().then(setStats).catch(() => {})
    } catch (e: any) { setFormError(e.message) }
    finally { setActionLoading(false) }
  }

  const handleUpdateRole = async () => {
    if (!newRoleVal || !roleReason) return
    setActionLoading(true)
    try {
      await SuperAdminAPI.updateRole(selected.id, newRoleVal, roleReason)
      setMsg(`✅ ${selected.name} is now ${ROLE_LABELS[newRoleVal]}`)
      setSelected(null); setRoleReason(''); setNewRoleVal('')
      fetchUsers(page, roleFilter)
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setActionLoading(false) }
  }

  const handleUpdateStatus = async (is_active: boolean) => {
    if (!statusReason) return
    setActionLoading(true)
    try {
      await SuperAdminAPI.updateStatus(selected.id, is_active, statusReason)
      setMsg(`✅ ${selected.name} ${is_active?'activated':'suspended'}`)
      setSelected(null); setStatusReason('')
      fetchUsers(page, roleFilter)
      SuperAdminAPI.getUserStats().then(setStats).catch(() => {})
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setActionLoading(false) }
  }

  const handleForceLogout = async (id: string, name: string) => {
    if (!confirm(`Force logout ${name} from all active sessions?`)) return
    try {
      await SuperAdminAPI.forceLogout(id)
      setMsg(`✅ ${name} logged out from all sessions`)
    } catch (e: any) { setMsg('❌ ' + e.message) }
  }

  // "Login As" — every call is audited server-side (AuditAction.IMPERSONATE).
  // Issues a short-lived access token only, no refresh token, so the
  // session can't silently renew itself — see TokenStore.startImpersonation.
  const handleImpersonate = async (id: string, name: string) => {
    if (!confirm(`Log in as ${name}? This is fully audited and expires automatically — use "Exit" in the banner to return.`)) return
    setImpersonating(id)
    try {
      const res = await SuperAdminAPI.impersonate(id)
      TokenStore.startImpersonation(res.access_token, res.user)
      window.location.href = '/dashboard'
    } catch (e: any) { setMsg('❌ ' + e.message); setImpersonating(null) }
  }

  const copyId = (id: string, name: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(id)
      setMsg(`✅ Copied ID of ${name}`)
      setTimeout(() => { setCopied(''); setMsg('') }, 2500)
    })
  }

  return (
    <div className="page">

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:18,fontWeight:800}}>User Management</h2>
          <p style={{fontSize:13,color:'#9ca3af'}}>Manage members, city partners and HQ admins</p>
        </div>
        <button className="btn btn-p" onClick={() => { setForm(emptyForm); setFormError(''); setShowCreate(true) }}>
          + Create User
        </button>
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

      {/* Stats — real server-side counts across every user, not just this page */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[
          {l:'Total Users',v:stats.total,c:'#6366f1',key:'all' as const},
          {l:'Active',v:stats.active,c:'#10b981',key:'active' as const},
          {l:'Suspended',v:stats.suspended,c:'#ef4444',key:'suspended' as const},
          {l:'Unverified Email',v:stats.unverified,c:'#f59e0b',key:'unverified' as const},
        ].map(s=>(
          <button key={s.l} onClick={()=>setStatusFilter(s.key)}
            style={{textAlign:'left',cursor:'pointer',border:statusFilter===s.key?'2px solid #fff':'2px solid transparent',
              background:`linear-gradient(135deg,${s.c},${s.c}cc)`,borderRadius:12,padding:'14px 16px',
              boxShadow:`0 2px 4px rgba(0,0,0,.35), 0 14px 32px -10px ${s.c}66, inset 0 1px 0 rgba(255,255,255,.18)`}}>
            <div style={{fontSize:26,fontWeight:800,color:'#fff'}}>{s.v ?? '—'}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.8)',marginTop:4}}>{s.l}</div>
          </button>
        ))}
      </div>

      {/* New member registrations — a different question than the stats
          above (which count every role and don't change with time):
          "are we growing" broken into the windows admins actually ask for. */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[
          {l:'New Today',v:regStats.today},
          {l:'New Yesterday',v:regStats.yesterday},
          {l:'New — Last 7 Days',v:regStats.last_7_days},
          {l:'New — Last 30 Days',v:regStats.last_30_days},
        ].map(s=>(
          <div key={s.l} className="card" style={{padding:'12px 14px'}}>
            <div style={{fontSize:20,fontWeight:800}}>{s.v ?? '—'}</div>
            <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Note about super admin */}
      <div style={{background:'rgba(255,75,10,.1)',border:'1px solid rgba(255,75,10,.3)',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:12,color:'#fbc568'}}>
        <FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5"/>Super Admins are not shown here. To manage Super Admin accounts, use the CLI or database directly.
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        <input placeholder="Search name, email, city… (Enter)" value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key==='Enter' && fetchUsers(1,roleFilter)}
          style={{maxWidth:300}}/>
        <select value={countryFilter} onChange={e=>setCountryFilter(e.target.value)} style={{maxWidth:180,fontSize:13}}>
          <option value="">All Countries</option>
          {countries.map((c:any)=><option key={c.isoCode} value={c.name}>{c.flag} {c.name}</option>)}
        </select>
        <input placeholder="Filter by city… (Enter)" value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
          onKeyDown={e => e.key==='Enter' && fetchUsers(1,roleFilter)}
          style={{maxWidth:160}}/>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {['all','member','franchise','hq_admin'].map(r=>(
            <button key={r} className={`btn btn-sm ${roleFilter===r?'btn-p':'btn-g'}`}
              onClick={() => setRoleFilter(r)} style={{textTransform:'capitalize'}}>
              {r==='all'?'All Roles':ROLE_LABELS[r]||r}
            </button>
          ))}
        </div>
        {(statusFilter!=='all'||countryFilter||cityFilter) && (
          <button className="btn btn-g btn-sm" onClick={()=>{setStatusFilter('all');setCountryFilter('');setCityFilter('')}}>Clear filters</button>
        )}
      </div>

      {error && <div style={{background:'rgba(255,90,90,.1)',border:'1px solid rgba(255,90,90,.3)',borderRadius:10,padding:'10px 14px',marginBottom:12,color:'#ef4444',fontSize:13}}>{error}</div>}

      {/* Table */}
      <div className="card" style={{padding:0,overflow:'hidden',marginBottom:12}}>
        <table className="tbl">
          <thead>
            <tr>{['User','Email','Role','City','Status','Last Login','Actions'].map(h=><th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading
              ? [...Array(6)].map((_,i)=>(
                <tr key={i}>{[...Array(7)].map((_,j)=>(
                  <td key={j}><div style={{height:14,background:'rgba(255,255,255,.06)',borderRadius:4,width:'80%'}}/></td>
                ))}</tr>
              ))
              : users.map(u=>(
                <tr key={u.id}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:32,height:32,borderRadius:'50%',background:ROLE_COLORS[u.role]||'#9ca3af',
                        display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:12,fontWeight:700,flexShrink:0}}>
                        {u.name?.charAt(0)||'?'}
                      </div>
                      <div>
                        <div style={{fontWeight:600,fontSize:13}}>{u.name}</div>
                        <button onClick={()=>copyId(u.id,u.name)}
                          style={{fontSize:10,color:copied===u.id?'#10b981':'#9ca3af',background:'none',border:'none',
                            cursor:'pointer',padding:0,fontFamily:'monospace',display:'flex',alignItems:'center',gap:3}}>
                          {copied===u.id?<><FontAwesomeIcon icon={faCircleCheck} className="mr-1"/>Copied!</>:<><FontAwesomeIcon icon={faClipboard} className="mr-1"/>Copy ID</>}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td style={{fontSize:12,color:'#6b7280'}}>{u.email}</td>
                  <td>
                    <span style={{background:(ROLE_COLORS[u.role]||'#9ca3af')+'22',color:ROLE_COLORS[u.role]||'#9ca3af',
                      fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:99,textTransform:'capitalize'}}>
                      {ROLE_LABELS[u.role]||u.role}
                    </span>
                  </td>
                  <td style={{fontSize:12}}>{u.city||'—'}</td>
                  <td><span className={`badge ${u.is_active!==false?'b-green':'b-red'}`}>{u.is_active!==false?'Active':'Suspended'}</span></td>
                  <td style={{fontSize:11,color:'#9ca3af'}}>{u.last_login?new Date(u.last_login).toLocaleDateString():'—'}</td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      <button className="btn btn-xs btn-g" style={{color:'#6366f1'}} onClick={()=>openEdit(u)}>Edit</button>
                      <button className="btn btn-xs btn-p" onClick={()=>handleImpersonate(u.id,u.name)} disabled={impersonating===u.id}>{impersonating===u.id?'…':'Login As'}</button>
                      <button className="btn btn-xs btn-g" onClick={()=>{setSelected(u);setNewRoleVal(u.role);setRoleReason('');setStatusReason('')}}>Manage</button>
                      <button className="btn btn-xs btn-g" style={{color:'#9ca3af'}} onClick={()=>handleForceLogout(u.id,u.name)}>Logout</button>
                      <button className="btn btn-xs btn-g" style={{color:u.is_active!==false?'#ef4444':'#10b981'}}
                        onClick={()=>{setSelected(u);setStatusReason('')}}>
                        {u.is_active!==false?'Suspend':'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      <div style={{display:'flex',gap:6,justifyContent:'center'}}>
        <button className="btn btn-g btn-sm" disabled={page===1} onClick={()=>fetchUsers(page-1,roleFilter)}><FontAwesomeIcon icon={faArrowLeft} className="mr-1.5"/>Prev</button>
        <span style={{padding:'6px 12px',fontSize:13,color:'#9ca3af'}}>Page {page}</span>
        <button className="btn btn-g btn-sm" disabled={!hasMore} onClick={()=>fetchUsers(page+1,roleFilter)}>Next <FontAwesomeIcon icon={faArrowRight} className="ml-1"/></button>
      </div>

      {/* ── EDIT USER MODAL ──────────────────────────────────────────── */}
      {editing && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setEditing(null)}>
          <div className="modal modal-lg">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>Edit User — {editing.name}</h3>
            <div style={{fontSize:11,color:'#9ca3af',fontFamily:'monospace',marginBottom:14,
              display:'flex',alignItems:'center',gap:8}}>
              ID: {editing.id?.slice(0,24)}…
              <button onClick={()=>copyId(editing.id,editing.name)}
                style={{fontSize:11,color:'#6366f1',background:'none',border:'none',cursor:'pointer'}}>
                {copied===editing.id?<><FontAwesomeIcon icon={faCircleCheck} className="mr-1"/>Copied</>:<><FontAwesomeIcon icon={faClipboard} className="mr-1"/>Copy ID</>}
              </button>
            </div>
            {editLoading
              ? <Loading label="Loading full profile…"/>
              : <>
                <div className="form-grid">
                  <div className="fg"><label>Full Name *</label>
                    <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
                  <div className="fg"><label>Email *</label>
                    <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
                  <div className="fg"><label>Phone</label>
                    <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
                  <div className="fg"><label>City</label>
                    <input value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></div>
                  <div className="fg"><label>Profession</label>
                    <input value={form.profession} onChange={e=>setForm({...form,profession:e.target.value})}
                      placeholder="CA, Doctor, Entrepreneur…"/></div>
                  <div className="fg"><label>Company</label>
                    <input value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/></div>
                  <div className="fg"><label>Role</label>
                    <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                      {Object.entries(ROLE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>
                {formError && <div style={{color:'#ef4444',fontSize:13,marginBottom:10,marginTop:4}}>{formError}</div>}
                <div style={{display:'flex',gap:8}}>
                  <button className="btn btn-p" style={{flex:1}} onClick={saveEdit} disabled={actionLoading}>
                    {actionLoading?'Saving…':'Save Changes'}
                  </button>
                  <button className="btn btn-g" style={{flex:1}} onClick={()=>setEditing(null)}>Cancel</button>
                </div>
              </>
            }
          </div>
        </div>
      )}

      {/* ── MANAGE MODAL ─────────────────────────────────────────────── */}
      {selected && !editing && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setSelected(null)}>
          <div className="modal modal-lg">
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
              <div style={{width:48,height:48,borderRadius:'50%',background:ROLE_COLORS[selected.role]||'#9ca3af',
                display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18,fontWeight:700}}>
                {selected.name?.charAt(0)}
              </div>
              <div>
                <h3 style={{fontSize:16,fontWeight:700,margin:0}}>{selected.name}</h3>
                <div style={{fontSize:12,color:'#9ca3af'}}>{selected.email} · {ROLE_LABELS[selected.role]||selected.role}</div>
              </div>
            </div>
            {/* Role */}
            <div style={{background:'rgba(255,255,255,.04)',borderRadius:10,padding:12,marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Change Role</div>
              <div className="form-grid">
                <div className="fg"><label>New Role</label>
                  <select value={newRoleVal} onChange={e=>setNewRoleVal(e.target.value)}>
                    {Object.entries(ROLE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="fg"><label>Reason *</label>
                  <input value={roleReason} onChange={e=>setRoleReason(e.target.value)} placeholder="Why changing this role?"/>
                </div>
              </div>
              <button className="btn btn-p btn-sm" onClick={handleUpdateRole}
                disabled={actionLoading||!roleReason||newRoleVal===selected.role}>
                {actionLoading?'Updating…':'Update Role'}
              </button>
            </div>
            {/* Status */}
            <div style={{background:'rgba(255,255,255,.04)',borderRadius:10,padding:12,marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>
                {selected.is_active!==false?'Suspend Account':'Activate Account'}
              </div>
              <div className="fg"><label>Reason *</label>
                <input value={statusReason} onChange={e=>setStatusReason(e.target.value)} placeholder="Reason for this action"/>
              </div>
              <button className={`btn btn-sm ${selected.is_active!==false?'btn-g':'btn-p'}`}
                style={{color:selected.is_active!==false?'#ef4444':'#10b981'}}
                onClick={()=>handleUpdateStatus(selected.is_active===false)}
                disabled={actionLoading||!statusReason}>
                {actionLoading?'Processing…':selected.is_active!==false?'Suspend User':'Activate User'}
              </button>
            </div>
            <button className="btn btn-g" style={{width:'100%'}} onClick={()=>setSelected(null)}>Close</button>
          </div>
        </div>
      )}

      {/* ── CREATE USER MODAL ─────────────────────────────────────────── */}
      {showCreate && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowCreate(false)}>
          <div className="modal modal-lg">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>+ Create New User</h3>
            {/* Role explains what the account will be */}
            <div style={{background:'rgba(0,191,248,.08)',border:'1px solid #bae6fd',borderRadius:10,
              padding:'10px 14px',marginBottom:14,fontSize:12,color:'#0369a1'}}>
              <strong>ℹ️ Creating a user account only</strong> — this gives them login access.
              To enroll them as a paying NIA member, go to <strong>Members → Enroll Member</strong> after creating their account.
            </div>
            <div className="form-grid">
              <div className="fg"><label>Full Name *</label>
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full name"/></div>
              <div className="fg"><label>Email *</label>
                <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="user@example.com"/></div>
              <div className="fg"><label>Mobile *</label>
                <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+91 98765 43210"/></div>
              <div className="fg"><label>Password *</label>
                <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min 8 characters"/></div>
              <div className="fg"><label>Role *</label>
                <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                  {Object.entries(ROLE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="fg"><label>City</label>
                <input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="Delhi"/></div>
              <div className="fg"><label>Profession</label>
                <input value={form.profession} onChange={e=>setForm({...form,profession:e.target.value})} placeholder="CA, Doctor, Entrepreneur…"/></div>
              <div className="fg"><label>Company</label>
                <input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="Company name"/></div>
            </div>
            {/* Role-specific hint */}
            {form.role === 'member' && (
              <div style={{background:'rgba(255,75,10,.1)',border:'1px solid rgba(255,75,10,.3)',borderRadius:10,padding:'10px 14px',marginBottom:8,fontSize:12,color:'#fbc568'}}>
                After creating → go to <strong>Members → Enroll Member</strong> to link them to a group and assign membership plan
              </div>
            )}
            {form.role === 'franchise' && (
              <div style={{background:'rgba(39,216,109,.1)',border:'1px solid rgba(39,216,109,.3)',borderRadius:10,padding:'10px 14px',marginBottom:8,fontSize:12,color:'#15803d'}}>
                After creating → go to <strong>Regions</strong> to assign them as franchise owner of a territory
              </div>
            )}
            {formError && <div style={{color:'#ef4444',fontSize:13,marginBottom:10}}>{formError}</div>}
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p" style={{flex:1}} onClick={createUser} disabled={actionLoading}>
                {actionLoading?'Creating…':'Create User'}
              </button>
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
