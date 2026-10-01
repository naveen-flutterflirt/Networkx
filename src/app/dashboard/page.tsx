'use client'
import { useState, useEffect, useRef } from 'react'
import { TokenStore, TerritoriesAPI, GroupsAPI, MembersAPI, ReportsAPI, PaymentsAPI, SuperAdminAPI,
  MeetingsAPI, NotificationsAPI, AttendanceAPI,
  DashboardAPI } from '@/lib/api'
import { Loading } from '@/components/shared/States'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useDashboardProfile } from '@/components/layout/DashboardProfileContext'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faBullhorn, faArrowsRotate, faMap, faChartLine, faShieldHalved, faScrewdriverWrench,
  faCalendarDays, faCalendarCheck, faMagnifyingGlass, faUsers, faBuilding, faBriefcase, faCreditCard,
  faCircleCheck, faTriangleExclamation,
  faCrown, faHandshake, faTag, faChevronRight,
  faRocket, faPlane, faBookOpen, faWandMagicSparkles, faSackDollar, faPeopleArrows, faStore, faVault,
} from '@fortawesome/free-solid-svg-icons'

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean, onToggle: () => Promise<void> }) {
  const [loading, setLoading] = useState(false)
  return (
    <button disabled={loading} onClick={async () => {
      setLoading(true)
      try { await onToggle() }
      catch (e: any) { alert('Failed: ' + e.message) }
      finally { setLoading(false) }
    }} style={{width:48,height:26,borderRadius:99,border:'none',cursor:'pointer',
      background:enabled?'#10b981':'var(--nx-line)',position:'relative',transition:'background .2s',opacity:loading?.6:1}}>
      <div style={{width:20,height:20,borderRadius:'50%',background:'var(--nx-panel)',position:'absolute',
        top:3,transition:'left .2s',left:enabled?'24px':'4px',boxShadow:'0 1px 4px rgba(0,0,0,.2)'}}/>
    </button>
  )
}

function BroadcastPanel() {
  const [title,   setTitle]   = useState('')
  const [body,    setBody]    = useState('')
  const [target,  setTarget]  = useState('all')
  const [sending, setSending] = useState(false)
  const [msg,     setMsg]     = useState('')

  const send = async () => {
    if (!title || !body) return
    setSending(true); setMsg('')
    try {
      await SuperAdminAPI.broadcast({ title, body, target, channels: ['push','in_app'] })
      setMsg('✅ Broadcast sent!')
      setTitle(''); setBody('')
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSending(false) }
  }

  return (
    <div style={{maxWidth:560}}>
      <div className="card">
        <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faBullhorn} className="mr-2"/>National Broadcast</div>
        <div className="fg"><label>Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Important Policy Update"/>
        </div>
        <div className="fg"><label>Target Audience</label>
          <select value={target} onChange={e => setTarget(e.target.value)}>
            <option value="all">All Users</option>
            <option value="role">By Role</option>
            <option value="territory">By Territory</option>
          </select>
        </div>
        <div className="fg"><label>Message *</label>
          <textarea rows={4} value={body} onChange={e => setBody(e.target.value)} placeholder="Write your broadcast message…"/>
        </div>
        {msg && <div className="toast-in" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,marginBottom:12,fontSize:13,
          background:msg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',color:msg.startsWith('✅')?'#16a34a':'#ef4444'}}>{msg}<button style={{background:'none',border:'none',cursor:'pointer',color:'inherit',flexShrink:0}} onClick={()=>setMsg('')}>✕</button></div>}
        <button className="btn btn-p" style={{width:'100%'}} onClick={send} disabled={sending||!title||!body}>
          {sending?'Sending…':'Send Broadcast'}
        </button>
      </div>
    </div>
  )
}

function HQGlobalDashboard() {
  const [stats,   setStats]   = useState<any>(null)
  const [regions, setRegions] = useState<any[]>([])
  const [growth,  setGrowth]  = useState<any>(null)
  const [health,  setHealth]  = useState<any>(null)
  const [toggles, setToggles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('regions')

  const me      = TokenStore.getUser()
  const isSuper = me?.role === 'super_admin'

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [terr, rev, grow] = await Promise.all([
        TerritoriesAPI.list({ page:1, page_size:50 }),
        PaymentsAPI.stats(),
        ReportsAPI.growth(),
      ])
      const territories = terr.items || terr
      setRegions(territories)
      setStats({
        total_members:  territories.reduce((a:number,t:any) => a+(t.members_count||0), 0),
        active_groups:  territories.reduce((a:number,t:any) => a+(t.groups_count||0), 0),
        mrr:            territories.reduce((a:number,t:any) => a+(t.monthly_collection||0), 0),
        territories:    territories.length,
        pending_amount: rev?.pending_amount||0,
      })
      setGrowth(grow)
      if (isSuper) {
        const [hlth, tog] = await Promise.all([
          SuperAdminAPI.getHealth(),
          SuperAdminAPI.getToggles(),
        ])
        setHealth(hlth)
        setToggles(Array.isArray(tog) ? tog : tog.items||[])
      }
    } catch (e) { console.error('Dashboard load failed', e) }
    finally { setLoading(false) }
  }

  const mrr    = stats ? Math.round((stats.mrr||0)/100000) : 0
  const COLORS = ['#6366f1','var(--nx-orange)','#10b981','#f59e0b','#8b5cf6','#14b8a6']

  return (
    <div className="page">
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#1e2433,#252d3d)',borderRadius:14,padding:'20px 24px',marginBottom:16,color:'#fff'}}>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:2,color:'#6b7280',textTransform:'uppercase',marginBottom:6}}>
          HQ PORTAL — NATIONAL CONTROL CENTER
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,marginBottom:4}}>Global Dashboard</h1>
            <p style={{fontSize:13,color:'#9ca3af'}}>Welcome, {me?.name} · {me?.role?.replace('_',' ').toUpperCase()} · All India</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-g btn-sm" onClick={fetchAll}><FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5"/>Refresh</button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {loading
          ? [...Array(4)].map((_,i) => <div key={i} style={{height:90,background:'rgba(255,255,255,.06)',borderRadius:12}}/>)
          : [
            {l:'Total Members', v:stats?.total_members?.toLocaleString()||0, c:'#6366f1', sub:'Active across India'},
            {l:'Active Groups',  v:stats?.active_groups||0,                    c:'#ff4b0a', sub:'Across all regions'},
            {l:'Avg Growth',     v:`${growth?.growth_pct||0}%`,                 c:'#10b981', sub:'YoY expansion'},
            {l:'MRR',            v:`₹${mrr}L`,                                  c:'#f59e0b', sub:'Monthly recurring'},
          ].map(s => (
            <div key={s.l} style={{background:`linear-gradient(135deg,${s.c},${s.c}cc)`,borderRadius:12,padding:'16px',boxShadow:`0 2px 4px rgba(0,0,0,.35), 0 14px 32px -10px ${s.c}66, inset 0 1px 0 rgba(255,255,255,.18)`}}>
              <div style={{fontSize:26,fontWeight:800,color:'#fff'}}>{s.v}</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,.7)',marginTop:2}}>{s.l}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,.5)',marginTop:2}}>{s.sub}</div>
            </div>
          ))
        }
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {[
          {id:'regions',   l:'Regions',ic:faMap},
          {id:'growth',    l:'Growth',ic:faChartLine},
          {id:'broadcast', l:'Broadcast',ic:faBullhorn},
          ...(isSuper ? [{id:'health',l:'Health',ic:faShieldHalved},{id:'toggles',l:'Toggles',ic:faScrewdriverWrench}] : []),
        ].map(t => (
          <button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}><FontAwesomeIcon icon={t.ic} className="mr-1.5"/>{t.l}</button>
        ))}
      </div>

      {/* Regions */}
      {tab === 'regions' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {loading
            ? [...Array(6)].map((_,i) => <div key={i} className="card" style={{height:140,background:'rgba(255,255,255,.06)'}}/>)
            : regions.map((t,idx) => {
              const color = COLORS[idx % COLORS.length]
              return (
                <div key={t.id} className="card" style={{borderTop:`3px solid ${color}`}}>
                  <div style={{width:28,height:4,background:color,borderRadius:99,marginBottom:8}}/>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:2}}>{t.name}</div>
                  <div style={{fontSize:11,color:'#9ca3af',marginBottom:10}}>{t.city}, {t.state}</div>
                  {[['Groups',t.groups_count||0,'#cbd5e1'],['Members',t.members_count||0,'#cbd5e1'],['Revenue',`₹${Math.round((t.monthly_collection||0)/100000)}L`,color]].map(([l,v,c])=>(
                    <div key={String(l)} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid #f3f4f6'}}>
                      <span style={{fontSize:12,color:'#9ca3af'}}>{l}</span>
                      <span style={{fontSize:12,fontWeight:700,color:c as string}}>{v}</span>
                    </div>
                  ))}
                  <div style={{marginTop:8}}>
                    <span style={{fontSize:10,padding:'2px 8px',borderRadius:99,background:color+'22',color,fontWeight:600,textTransform:'capitalize'}}>{t.status||'active'}</span>
                  </div>
                </div>
              )
            })
          }
          {!loading && regions.length === 0 && (
            <div style={{gridColumn:'1/-1',textAlign:'center',color:'#9ca3af',padding:40}}>No territories found</div>
          )}
        </div>
      )}

      {/* Growth */}
      {tab === 'growth' && (
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faChartLine} className="mr-2"/>Membership Growth Trend</div>
          {loading
            ? <div style={{height:120,background:'rgba(255,255,255,.06)',borderRadius:8}}/>
            : growth
            ? (() => {
                const data   = growth.data||[]
                const labels = growth.labels||[]
                const max    = Math.max(...data, 1)
                return (
                  <>
                    <div style={{display:'flex',alignItems:'flex-end',gap:6,height:120,marginBottom:8}}>
                      {data.map((v:number,i:number) => (
                        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                          <div style={{fontSize:9,color:'#9ca3af'}}>{v}</div>
                          <div style={{width:'100%',background:'#1e2433',borderRadius:'3px 3px 0 0',height:Math.round((v/max)*100)+'px',opacity:.85}}/>
                        </div>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      {labels.map((l:string,i:number) => (
                        <div key={i} style={{flex:1,textAlign:'center',fontSize:9,color:'#9ca3af'}}>{l}</div>
                      ))}
                    </div>
                    <div style={{marginTop:12,fontSize:13}}>
                      Total: <strong>{growth.total?.toLocaleString()}</strong> &nbsp;
                      Growth: <strong style={{color:'#10b981'}}>+{growth.growth_pct}%</strong>
                    </div>
                  </>
                )
              })()
            : <div style={{color:'#9ca3af',textAlign:'center',padding:32}}>No growth data</div>
          }
        </div>
      )}

      {/* Broadcast */}
      {tab === 'broadcast' && <BroadcastPanel />}

      {/* Health */}
      {tab === 'health' && isSuper && (
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faShieldHalved} className="mr-2"/>System Health</div>
          {loading ? <Loading compact label="Loading…"/>
            : health ? (
              <>
                <div style={{background:health.overall==='ok'?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',borderRadius:10,padding:'12px 16px',marginBottom:14,
                  border:`1px solid ${health.overall==='ok'?'rgba(39,216,109,.35)':'rgba(255,90,90,.35)'}`}}>
                  <span style={{fontWeight:700,color:health.overall==='ok'?'#16a34a':'#ef4444'}}>
                    <FontAwesomeIcon icon={health.overall==='ok'?faCircleCheck:faTriangleExclamation} className="mr-1.5"/>
                    {health.overall==='ok'?'All Systems Operational':'Service Degraded'}
                  </span>
                </div>
                {(health.services||[]).map((s:any,i:number) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #f3f4f6'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:s.status==='ok'?'#10b981':'#ef4444'}}/>
                      <span style={{fontSize:13,fontWeight:600}}>{s.name}</span>
                    </div>
                    <span style={{fontSize:12,fontWeight:600,color:s.status==='ok'?'#10b981':'#ef4444'}}>{s.status==='ok'?'Healthy':'Error'}</span>
                  </div>
                ))}
              </>
            ) : <div style={{color:'#9ca3af',textAlign:'center',padding:32}}>Health data unavailable</div>
          }
        </div>
      )}

      {/* Toggles */}
      {tab === 'toggles' && isSuper && (
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faScrewdriverWrench} className="mr-2"/>Feature Toggles</div>
          {loading ? <Loading compact label="Loading…"/>
            : toggles.map((t:any,i:number) => (
              <div key={t.id||i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #f3f4f6'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{t.label||t.id}</div>
                  {t.description && <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>{t.description}</div>}
                </div>
                <ToggleSwitch enabled={t.is_enabled} onToggle={async () => {
                  await SuperAdminAPI.updateToggle(t.id, !t.is_enabled)
                  setToggles(prev => prev.map((x:any) => x.id===t.id ? {...x,is_enabled:!x.is_enabled} : x))
                }}/>
              </div>
            ))
          }
        </div>
      )}

    </div>
  )
}

// ── KPI card — shared visual across HQ/Franchise dashboards ────────
function KpiCard({ label, value, sub, color }: { label: string, value: string|number, sub?: string, color: string }) {
  return (
    <div style={{background:`linear-gradient(135deg,${color},${color}cc)`,borderRadius:12,padding:'16px',boxShadow:`0 4px 16px ${color}33`}}>
      <div style={{fontSize:26,fontWeight:800,color:'#fff'}}>{value}</div>
      <div style={{fontSize:12,color:'rgba(255,255,255,.7)',marginTop:2}}>{label}</div>
      {sub && <div style={{fontSize:11,color:'rgba(255,255,255,.5)',marginTop:2}}>{sub}</div>}
    </div>
  )
}

function QuickLinks({ links }: { links: {icon:IconDefinition,label:string,path:string}[] }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:`repeat(${links.length},1fr)`,gap:10}}>
      {links.map(l => (
        <button key={l.path} onClick={()=>window.location.href=l.path}
          className="card" style={{textAlign:'center',padding:'16px 8px',cursor:'pointer',border:'1px solid var(--nx-line)',background:'var(--nx-panel)'}}>
          <div style={{fontSize:20,marginBottom:6}}><FontAwesomeIcon icon={l.icon}/></div>
          <div style={{fontSize:12,fontWeight:600}}>{l.label}</div>
        </button>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// MEMBER dashboard v2 — matches the new design. Every number below comes
// from a real endpoint already in api.ts — nothing here is fabricated.
// Two spots are flagged inline where the exact backend response shape is
// assumed and may need a one-line adjustment once verified:
//   1. GamificationAPI.me() — assumed to return {score, xp, next_level_xp,
//      level_label, badges:[{id,label,level,icon,locked}]}
//   2. "Deals Closed" — mapped to DealHubAPI.myRedemptions().length. If
//      "deal" means something else in your CRM (e.g. closed CRM prospects),
//      swap this one line for CrmAPI.pipeline() instead.
// ══════════════════════════════════════════════════════════════════════════

function DashHeroMap() {
  // Self-contained decorative world-map graphic (dot grid + glowing arcs).
  // No external image asset required.
  return (
    <svg className="dash-hero-map" viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="dot" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3b8bff" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#3b8bff" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {Array.from({length:130}).map((_,i)=>{
        const x = (i % 26) * 19 + 5
        const y = Math.floor(i/26) * 30 + 10
        const jitter = ((i*37)%7)
        return <circle key={i} cx={x+jitter*0.4} cy={y} r="1.4" fill="rgba(255,255,255,.16)"/>
      })}
      <path d="M60 150 Q 200 40 340 90" stroke="#ff8a3d" strokeWidth="1" fill="none" opacity=".55"/>
      <path d="M90 220 Q 240 260 400 130" stroke="#3b8bff" strokeWidth="1" fill="none" opacity=".6"/>
      <path d="M40 90 Q 180 190 420 200" stroke="#a78bfa" strokeWidth="1" fill="none" opacity=".5"/>
      {[[340,90,'#ff8a3d'],[400,130,'#3b8bff'],[90,220,'#3b8bff'],[420,200,'#a78bfa'],[60,150,'#ff8a3d']].map(([cx,cy,c]:any,i)=>(
        <g key={i}>
          <circle cx={cx} cy={cy} r="10" fill="url(#dot)"/>
          <circle cx={cx} cy={cy} r="3" fill={c}/>
        </g>
      ))}
    </svg>
  )
}

function StatTile({ icon, image, value, label, definition, variant }: { icon: any, image?: string, value: string|number, label: string, definition:string, variant: string }) {
  return (
    <div className={`stat-tile ${variant}`} aria-label={`${label}: ${value}. ${definition}`}>
      <div className="stat-icon-wrap">{image ? <img src={image} alt="" aria-hidden="true"/> : <FontAwesomeIcon icon={icon}/>}</div>
      <strong>{value}</strong>
      <span className="stat-label">{label} <span className="stat-info" title={definition} aria-label={definition}>i</span></span>
    </div>
  )
}

function QuickActionRow({ icon, image, color, title, sub, path }: { icon:any, image?:string, color:string, title:string, sub:string, path:string }) {
  return (
    <button className="qa-row" onClick={()=>window.location.href=path}>
      <div className="qa-icon" style={{background:color}}>{image ? <img src={image} alt="" aria-hidden="true"/> : <FontAwesomeIcon icon={icon}/>}</div>
      <div className="qa-text">
        <div className="qa-title">{title}</div>
        <div className="qa-sub">{sub}</div>
      </div>
      <FontAwesomeIcon icon={faChevronRight} className="qa-chevron"/>
    </button>
  )
}

function GrowthPathCard({ icon, image, title, description, path, tone }: { icon:any, image?:string, title:string, description:string, path:string, tone:string }) {
  return (
    <button className={`growth-path-card ${tone}`} onClick={()=>window.location.href=path}>
      <span className="growth-path-icon">{image ? <img src={image} alt="" aria-hidden="true"/> : <FontAwesomeIcon icon={icon}/>}</span>
      <span className="growth-path-copy"><strong>{title}</strong><small>{description}</small></span>
      <FontAwesomeIcon icon={faChevronRight} className="growth-path-arrow"/>
    </button>
  )
}

function GrowthEngineCard({ icon, image, title, description, action, path, tone, featured=false }: { icon:any, image?:string, title:string, description:string, action:string, path:string, tone:string, featured?:boolean }) {
  return (
    <button className={`growth-engine-card ${tone}${featured?' featured':''}`} onClick={()=>window.location.href=path}>
      <span className="growth-engine-art" style={image?{backgroundImage:`url(${image})`}:undefined}>
        <i><FontAwesomeIcon icon={icon}/></i>
        {featured&&<b>AI POWERED</b>}
      </span>
      <span className="growth-engine-copy">
        <strong>{title}</strong>
        <small>{description}</small>
        <em>{action} <FontAwesomeIcon icon={faChevronRight}/></em>
      </span>
    </button>
  )
}

function MemberDashboard() {
  const me = TokenStore.getUser()
  const profile = useDashboardProfile()
  const requestId = useRef(0)
  const hasSummary = useRef(false)
  const [loading, setLoading] = useState(true)
  const [gami, setGami] = useState<any>(null)
  const [membership, setMembership] = useState<any>(null)
  const [journey, setJourney] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>({})
  const [moduleStatus, setModuleStatus] = useState<any>({})
  const [loadError, setLoadError] = useState('')

  const loadDashboard = async (fresh = false) => {
    const currentRequest = ++requestId.current
    if (!hasSummary.current) setLoading(true)
    setLoadError('')
    try {
      const summary = fresh ? await DashboardAPI.refresh() : await DashboardAPI.summary()
      if (currentRequest !== requestId.current) return
      hasSummary.current = true
      const gamiRes = summary.gamification
      const legacyMemberships = summary.members?.items || summary.members || []
      const membershipRes = summary.membership ?? (Array.isArray(legacyMemberships) ? legacyMemberships.find((m:any)=>m.user_id===me?.id) : null)
      setGami(gamiRes)
      setMembership(membershipRes || null)
      setJourney(summary.journey || null)
      setMetrics(summary.metrics || {})
      setModuleStatus(summary.module_status || {})
    } catch (e: any) {
      console.error('Member dashboard load failed', e)
      if (currentRequest === requestId.current) setLoadError(e?.message || 'Dashboard data is temporarily unavailable')
    } finally {
      if (currentRequest === requestId.current) setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    const refresh = () => loadDashboard(true)
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible') refresh() }, 60_000)
    window.addEventListener('nia:dashboard-updated', refresh)
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      requestId.current += 1
      window.clearInterval(interval)
      window.removeEventListener('nia:dashboard-updated', refresh)
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const metricValue = (key: string) => metrics?.[key]?.status === 'available' ? (metrics[key].value ?? '—') : '—'
  const score = metricValue('network_score')
  const gamificationAvailable = moduleStatus?.gamification?.status === 'available'
  const membershipAvailable = moduleStatus?.membership?.status === 'available'
  const growthLevel = gamificationAvailable ? (gami?.level_name || 'Newcomer') : 'Unavailable'
  const growthPct = gamificationAvailable ? (gami?.level_progress_pct ?? 0) : 0
  const membershipTier = membershipAvailable ? (membership?.tier || 'Member') : 'Unavailable'
  const eventsAttended = metricValue('events_attended')
  const coursesCompleted = metricValue('courses_completed')
  const firstName = (profile?.first_name || profile?.name || me?.name || 'Member').trim().split(/\s+/)[0]
  // Real fix: the New Member Journey checklist + next-best-action used to
  // be a hardcoded if/else chain computed here in the browser (score>0 was
  // used for step 4, which is trivially true the moment step 2 is, since
  // score already includes connection points — collapsing 4 steps to 3).
  // Now computed once, server-side, in dashboard/service.py's
  // _compute_onboarding_journey() — same real signals, reusable by any
  // other consumer (mobile, admin, notifications) instead of duplicated.
  const journeyAvailable = journey?.status === 'available'
  const journeyComplete = journeyAvailable && (journey?.journey_complete ?? false)
  const nextBestAction = journeyAvailable ? journey?.next_best_action : null
  const journeySteps = journeyAvailable ? (journey?.steps || []) : []

  return (
    <div className="page member-dashboard-page">
      {loading ? <Loading label="Loading your dashboard…"/> : loadError && !hasSummary.current ? <div className="dashboard-empty-state"><strong>Dashboard unavailable</strong><span>{loadError}</span><button className="btn btn-p" onClick={()=>loadDashboard(true)}>Retry</button></div> : (<>
        {loadError && <div role="alert" className="alert-info" style={{marginBottom:16}}>Could not refresh your dashboard. Showing the last loaded data. <button className="btn btn-g btn-sm" onClick={()=>loadDashboard(true)}>Retry</button></div>}
        {Object.keys(moduleStatus).length === 0 && <div role="status" className="alert-info" style={{marginBottom:16}}>Some dashboard data is unavailable. Please try again later.</div>}
        <div className="member-dashboard-grid">
          <div>
            {/* Hero */}
            <div className="dash-hero" style={{marginBottom:16}}>
              <img className="dash-hero-visual" src="/images/discover/network-hero-v1.png" alt="" aria-hidden="true"/>
              <div className="dash-hero-kicker"><FontAwesomeIcon icon={faWandMagicSparkles}/> Welcome back, {firstName}</div>
              <div className="dash-hero-greeting">Your World of Growth<br/><em>Starts Here.</em></div>
              <div className="dash-hero-tagline">
                <b>Learn.</b><span className="sep">·</span><b>Build.</b><span className="sep">·</span><b>Evolve.</b>
              </div>
              <div className="dash-hero-sub">One intelligent ecosystem for people, opportunities, capital and global business growth.</div>
            </div>

            {journeyAvailable && !journeyComplete && journeySteps.length > 0 && <div className="onboarding-journey">
              <div className="onboarding-heading"><span>New member journey</span><strong>Four steps to activate your NetworkX experience</strong></div>
              <div className="onboarding-steps">
                {journeySteps.map((s:any)=><div key={s.number} className={s.complete?'complete':''}><i>{s.complete?'✓':s.number}</i><span>{s.label}</span></div>)}
              </div>
            </div>}

            <section className="growth-engines" aria-labelledby="growth-engines-heading">
              <div className="growth-engines-heading">
                <div><span><FontAwesomeIcon icon={faWandMagicSparkles}/> NetworkX growth intelligence</span><strong id="growth-engines-heading">Activate Your Growth Engines</strong><p>Choose where you want to grow. NetworkX turns your profile and business intent into focused next steps.</p></div>
              </div>
              <div className="growth-engine-grid">
                <GrowthEngineCard icon={faWandMagicSparkles} image="/images/matching/networkx-ai-hero.jpg" title="AI Matchmaking" description="Meet people intelligently selected for your business goals." action="Find My Matches" path="/dashboard/AIMatching" tone="engine-blue" featured/>
                <GrowthEngineCard icon={faPlane} image="/images/travel/ai-travel-hero-3d.png" title="AI Travel Connect" description="Turn every business trip into relevant meetings and opportunities." action="Build My Travel Plan" path="/dashboard/travel" tone="engine-cyan" featured/>
                <GrowthEngineCard icon={faSackDollar} image="/images/funding/growth-desk-hero-v1.png" title="Funding Connect" description="Prepare your requirement for controlled investor introductions." action="Access Funding" path="/dashboard/funding-cofounders?category=funding" tone="engine-gold"/>
                <GrowthEngineCard icon={faPeopleArrows} image="/visuals/dashboard-network-3d.jpg" title="Co-Founder Connect" description="Discover compatible co-founders aligned to your vision and stage." action="Find My Co-Founder" path="/dashboard/funding-cofounders?category=cofounder" tone="engine-violet"/>
                <GrowthEngineCard icon={faStore} image="/images/app/growth.jpg" title="Franchise Connect" description="Expand your brand through qualified franchise partners and markets." action="Expand My Business" path="/dashboard/funding-cofounders?category=franchise" tone="engine-orange"/>
                <GrowthEngineCard icon={faVault} image="/visuals/premium-star-v2.jpg" title="Growth Vault" description="Discover business requirements and opportunities worth pursuing." action="Unlock Opportunities" path="/dashboard/opportunities" tone="engine-purple"/>
              </div>
            </section>

          </div>

          {/* Right rail */}
          <div className="member-right-rail">
            <div className="glass-card level-card">
              <FontAwesomeIcon icon={faCrown} className="crown-icon"/>
              <div className="status-kicker">Membership tier</div>
              <div className="level-name">{membershipTier}</div>
              {membership?.since && <div className="status-since">Member since {membership.since}</div>}
              <div className="status-progress-label"><span>Growth level: {growthLevel}</span>{gamificationAvailable && <span>{growthPct}%</span>}</div>
              {gamificationAvailable && <div className="prog"><div className="prog-fill" style={{width:`${growthPct}%`}}/></div>}
              <button className="btn btn-p" style={{width:'100%',marginTop:14}} onClick={()=>window.location.href='/dashboard/membership'}>View Membership <FontAwesomeIcon icon={faChevronRight} className="ml-1"/></button>
            </div>

            {nextBestAction && <button className="next-best-action rail-next-action" onClick={()=>window.location.href=nextBestAction.path}>
              <span className="next-action-icon"><FontAwesomeIcon icon={faRocket}/></span>
              <span className="next-action-copy"><small>{nextBestAction.kicker}</small><strong>{nextBestAction.title}</strong><span>{nextBestAction.body}</span><b>{nextBestAction.label} <FontAwesomeIcon icon={faChevronRight}/></b></span>
            </button>}

            <div className="member-stat-grid member-rail-stats">
              <StatTile icon={faUsers} image="/visuals/profile-points-3d.jpg" value={score} label="Network Score" definition="Your contribution score from meaningful NetworkX participation and activity." variant="stat-purple"/>
              <StatTile icon={faHandshake} image="/visuals/profile-connections-3d.jpg" value={metricValue('connections')} label="Connections" definition="Members currently connected with you on NetworkX." variant="stat-blue"/>
              <StatTile icon={faBriefcase} image="/visuals/dashboard-explore-3d.jpg" value={metricValue('opportunities')} label="Opportunities" definition="Active business opportunities currently available to you." variant="stat-orange"/>
              <StatTile icon={faCalendarCheck} image="/visuals/profile-events-3d.jpg" value={eventsAttended} label="Events Attended" definition="NetworkX events and structured meetings you have attended." variant="stat-green"/>
              <StatTile icon={faBookOpen} image="/visuals/dashboard-learning-3d.jpg" value={coursesCompleted} label="Courses Completed" definition="NetworkX learning courses you have successfully completed." variant="stat-violet"/>
            </div>

          </div>
        </div>
      </>)}
    </div>
  )
}

// ── FRANCHISE dashboard — territory-wide view across groups (unchanged)
function FranchiseDashboard() {
  const me = TokenStore.getUser()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [payStats, setPayStats] = useState<any>(null)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const [g, mem, pay] = await Promise.all([
          GroupsAPI.list({ page:1, page_size:50 }).catch(()=>({items:[]})),
          MembersAPI.list({ page:1, page_size:200 }).catch(()=>({items:[]})),
          PaymentsAPI.stats().catch(()=>null),
        ])
        setGroups(g.items || g)
        setMembers(mem.items || mem)
        setPayStats(pay)
      } catch (e) { console.error('Franchise dashboard load failed', e) }
      finally { setLoading(false) }
    })()
  }, [])

  const avgAttendance = members.length ? Math.round(members.reduce((a,m)=>a+(m.attendance_pct||0),0)/members.length) : 0
  const collected = payStats ? Math.round((payStats.total_collected||0)/100000) : 0

  return (
    <div className="page">
      <div style={{background:'linear-gradient(135deg,#1e2433,#252d3d)',borderRadius:14,padding:'20px 24px',marginBottom:16,color:'#fff'}}>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:2,color:'#6b7280',textTransform:'uppercase',marginBottom:6}}>FRANCHISE PORTAL</div>
        <h1 style={{fontSize:22,fontWeight:800,marginBottom:4}}>Territory Dashboard</h1>
        <p style={{fontSize:13,color:'#9ca3af'}}>Welcome, {me?.name}</p>
      </div>

      {loading ? <Loading label="Loading territory data…"/> : (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
            <KpiCard label="Groups" value={groups.length} color="#6366f1"/>
            <KpiCard label="Total Members" value={members.length} color="#ff4b0a"/>
            <KpiCard label="Avg Attendance" value={`${avgAttendance}%`} color="#10b981"/>
            <KpiCard label="Collected" value={`₹${collected}L`} color="#f59e0b" sub={payStats?`${payStats.pending_count||0} pending`:''}/>
          </div>

          <div className="card" style={{marginBottom:16,padding:0,overflow:'hidden'}}>
            <div style={{padding:'14px 16px',fontWeight:700,fontSize:14,borderBottom:'1px solid #f3f4f6'}}>Groups in Your Territory</div>
            {groups.length===0 ? <div style={{padding:16,fontSize:13,color:'#9ca3af'}}>No groups yet.</div> : (
              <table className="tbl">
                <thead><tr>{['Group','City','Members','Status'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {groups.slice(0,8).map((g:any)=>(
                    <tr key={g.id}><td style={{fontWeight:600}}>{g.name}</td><td>{g.city||'—'}</td><td>{g.members_count||0}</td>
                      <td><span className={`badge ${g.status==='active'?'b-green':'b-gray'}`}>{g.status||'—'}</span></td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Quick Links</div>
          <QuickLinks links={[
            {icon:faUsers,label:'Members',path:'/dashboard/franchise/members'},
            {icon:faBuilding,label:'Groups',path:'/dashboard/franchise/groups'},
            {icon:faBriefcase,label:'CRM',path:'/dashboard/franchise/crm'},
            {icon:faCreditCard,label:'Payments',path:'/dashboard/franchise/payments'},
          ]}/>
        </>
      )}
    </div>
  )
}

// ── Role router
export default function DashboardPage() {
  const [me, setMe] = useState<any>(null)
  useEffect(() => { setMe(TokenStore.getUser()) }, [])
  if (!me) return null

  switch (me.role) {
    case 'member':      return <MemberDashboard/>
    case 'franchise':    return <FranchiseDashboard/>
    case 'hq_admin':
    case 'super_admin':
    default:             return <HQGlobalDashboard/>
  }
}
