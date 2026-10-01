'use client'
import { useState, useEffect } from 'react'
import { TokenStore, TerritoriesAPI, GroupsAPI, MembersAPI, ReportsAPI, PaymentsAPI, SuperAdminAPI,
  MeetingsAPI, ConnectionsAPI, NotificationsAPI, EventsAPI, AttendanceAPI } from '@/lib/api'
import { Loading } from '@/components/shared/States'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faBullhorn, faArrowsRotate, faMap, faChartLine, faShieldHalved, faScrewdriverWrench,
  faCalendarDays, faCalendarCheck, faMagnifyingGlass, faUsers, faGift, faBuilding, faBriefcase, faCreditCard,
  faCircleCheck, faTriangleExclamation,
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
        {msg && <div className="toast-in" style={{padding:'10px 14px',borderRadius:10,marginBottom:12,fontSize:13,
          background:msg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',color:msg.startsWith('✅')?'#16a34a':'#ef4444'}}>{msg}</div>}
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
          {loading ? <div style={{color:'#9ca3af'}}>Loading…</div>
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
          {loading ? <div style={{color:'#9ca3af'}}>Loading…</div>
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

// ── KPI card — shared visual across all three role dashboards below ────────
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

// ── MEMBER dashboard — real data only: own membership, next meeting, next
// event, connections, unread notifications. Previously members landed on
// the HQ Global Dashboard above (0s everywhere, National Broadcast visible)
// because this page had no role branching at all.
function MemberDashboard() {
  const me = TokenStore.getUser()
  const [loading, setLoading] = useState(true)
  const [membership, setMembership] = useState<any>(null)
  const [nextMeeting, setNextMeeting] = useState<any>(null)
  const [nextEvent, setNextEvent] = useState<any>(null)
  const [connCount, setConnCount] = useState(0)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const [mine, meetings, events, conns, notifCount] = await Promise.all([
          MembersAPI.list({ page:1, page_size:5 }).catch(()=>({items:[]})),
          MeetingsAPI.list({ status:'upcoming' }).catch(()=>({items:[]})),
          EventsAPI.list({ status:'upcoming', page_size:1 }).catch(()=>({items:[]})),
          ConnectionsAPI.list().catch(()=>({counts:{connected:0}})),
          NotificationsAPI.count().catch(()=>({count:0})),
        ])
        const myItems = mine.items || mine
        setMembership(myItems.find((m:any)=>m.user_id===me?.id) || myItems[0] || null)
        const meetingItems = meetings.items || meetings
        setNextMeeting(meetingItems[0] || null)
        const eventItems = events.items || events
        setNextEvent(eventItems[0] || null)
        setConnCount(conns.counts?.connected || 0)
        setUnread(notifCount.count || 0)
      } catch (e) { console.error('Member dashboard load failed', e) }
      finally { setLoading(false) }
    })()
  }, [])

  return (
    <div className="page">
      <div style={{background:'linear-gradient(135deg,#1e2433,#252d3d)',borderRadius:14,padding:'20px 24px',marginBottom:16,color:'#fff'}}>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:2,color:'#6b7280',textTransform:'uppercase',marginBottom:6}}>MEMBER PORTAL</div>
        <h1 style={{fontSize:22,fontWeight:800,marginBottom:4}}>Welcome back, {me?.name?.split(' ')[0]}</h1>
        <p style={{fontSize:13,color:'#9ca3af'}}>{membership ? `${(membership.tier||'connect').replace('_',' ')} tier · ${membership.status||'active'}` : 'Here\u2019s what\u2019s happening in your network'}</p>
      </div>

      {loading ? <Loading label="Loading your dashboard…"/> : (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
            <KpiCard label="Growth Score" value={membership?.score ?? 0} color="#6366f1" sub="Out of 100"/>
            <KpiCard label="Attendance" value={`${membership?.attendance_pct ?? 0}%`} color="#10b981" sub="This membership year"/>
            <KpiCard label="Referrals Given" value={membership?.refs_given ?? 0} color="#ff4b0a" sub={`${membership?.refs_received ?? 0} received`}/>
            <KpiCard label="Connections" value={connCount} color="#f59e0b" sub={`${unread} unread notification${unread===1?'':'s'}`}/>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
            <div className="card">
              <div style={{fontWeight:700,fontSize:14,marginBottom:10}}><FontAwesomeIcon icon={faCalendarDays} className="mr-2"/>Next Meeting</div>
              {nextMeeting ? (
                <>
                  <div style={{fontSize:15,fontWeight:600}}>{(nextMeeting.type||'meeting').replace(/_/g,' ')}</div>
                  <div style={{fontSize:12,color:'#9ca3af',marginTop:4}}>{nextMeeting.date} · {nextMeeting.time} · {nextMeeting.venue||nextMeeting.platform||'—'}</div>
                  <button className="btn btn-p btn-sm" style={{marginTop:12}} onClick={()=>window.location.href='/dashboard/meetings'}>View Meetings</button>
                </>
              ) : <div style={{fontSize:13,color:'#9ca3af'}}>No upcoming meetings scheduled yet.</div>}
            </div>
            <div className="card">
              <div style={{fontWeight:700,fontSize:14,marginBottom:10}}><FontAwesomeIcon icon={faCalendarCheck} className="mr-2"/>Next Event</div>
              {nextEvent ? (
                <>
                  <div style={{fontSize:15,fontWeight:600}}>{nextEvent.title}</div>
                  <div style={{fontSize:12,color:'#9ca3af',marginTop:4}}>{nextEvent.date} · {nextEvent.city||nextEvent.venue||'—'}</div>
                  <button className="btn btn-p btn-sm" style={{marginTop:12}} onClick={()=>window.location.href='/dashboard/events'}>View Events</button>
                </>
              ) : <div style={{fontSize:13,color:'#9ca3af'}}>No upcoming events yet.</div>}
            </div>
          </div>

          <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Quick Links</div>
          <QuickLinks links={[
            {icon:faMagnifyingGlass,label:'Explore NetworkX',path:'/dashboard/discover'},
            {icon:faUsers,label:'My Network',path:'/dashboard/network'},
            {icon:faGift,label:'Deal Corner',path:'/dashboard/dealhub'},
            {icon:faBuilding,label:'Business Hub',path:'/dashboard/bizhub'},
          ]}/>
        </>
      )}
    </div>
  )
}

// ── FRANCHISE dashboard — territory-wide view across groups
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

// ── Role router — this is the actual fix. Previously every role landed on
// HQGlobalDashboard regardless of who they were (a member could see the
// National Broadcast composer, though the backend correctly 403s the
// actual send — verified, not assumed). Now each role gets real content.
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
