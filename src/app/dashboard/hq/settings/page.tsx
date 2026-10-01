'use client'
import { Loading } from '@/components/shared/States'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsRotate, faBell, faClipboard, faLock, faSackDollar, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react'
import { SettingsAPI, SuperAdminAPI } from '@/lib/api'

// Defined OUTSIDE HQSystemSettingsPage — same anti-pattern as the Travel
// Connect focus bug. Harmless here (no typed text to lose on a toggle),
// fixed for consistency anyway.
function Toggle({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      width:48, height:26, borderRadius:99, border:'none', cursor:'pointer',
      background: checked ? '#10b981' : 'var(--nx-line)',
      position:'relative', transition:'background .2s', flexShrink:0
    }}>
      <div style={{
        width:20, height:20, borderRadius:'50%', background:'var(--nx-panel)',
        position:'absolute', top:3, transition:'left .2s',
        left: checked ? '24px' : '4px', boxShadow:'0 1px 4px rgba(0,0,0,.2)'
      }}/>
    </button>
  )
}

export default function HQSystemSettingsPage() {
  const [tab,      setTab]      = useState('roles')
  const [settings, setSettings] = useState<any|null>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState('')

  // Pricing state — controlled inputs
  const [yearlyPrice,  setYearlyPrice]  = useState('150000')
  const [threeYrPrice, setThreeYrPrice] = useState('420000')
  const [royaltyPct,   setRoyaltyPct]   = useState('15')

  // Renewal state
  const [reminderDays, setReminderDays] = useState('30, 15, 7, 1')
  const [gracePeriod,  setGracePeriod]  = useState('7')
  const [latePenalty,  setLatePenalty]  = useState('10')
  const [autoRenewal,  setAutoRenewal]  = useState(true)

  // Penalty state
  const [penalties, setPenalties] = useState({
    missed_meeting:   '-3',
    no_referral_30:   '-5',
    no_visitor_90:    '-8',
    warning_issued:   '-15',
    dues_30:          'Suspend access',
    dues_60:          'Terminate membership',
  })

  // Free signup outside India — the exact same feature_toggles doc the
  // Feature Toggles screen (/dashboard/super/toggles) reads/writes, just
  // surfaced here too since Renewal Rules is where access-related member
  // switches (Auto-Renewal, grace period) already live. One Firestore
  // doc, two admin screens that can both see and flip it — never
  // duplicated local state that could drift out of sync.
  const FREE_SIGNUP_KEY = 'international_free_signup'
  const [freeSignup, setFreeSignup] = useState<boolean|null>(null)
  const [freeSignupSaving, setFreeSignupSaving] = useState(false)

  useEffect(() => {
    SettingsAPI.get()
      .then(s => {
        setSettings(s)
        // Pre-fill from API if available
        if (s?.pricing) {
          setYearlyPrice(String(s.pricing.yearly || 150000))
          setThreeYrPrice(String(s.pricing.three_year || 420000))
          setRoyaltyPct(String(s.pricing.royalty_pct || 15))
        }
        if (s?.renewal) {
          setGracePeriod(String(s.renewal.grace_period || 7))
          setLatePenalty(String(s.renewal.late_penalty || 10))
          setAutoRenewal(s.renewal.auto_renewal !== false)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    SuperAdminAPI.getToggles()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data.items || []
        const t = list.find((x: any) => x.id === FREE_SIGNUP_KEY)
        // Not seeded yet (scripts/seed_free_signup_toggle.py hasn't run)
        // -> defaults to on, matching register_member()'s own in-code
        // default so this switch never lies about the real behavior.
        setFreeSignup(t ? !!t.is_enabled : true)
      })
      .catch(() => {})
  }, [])

  const toggleFreeSignup = async () => {
    if (freeSignup === null) return
    const next = !freeSignup
    setFreeSignupSaving(true); setMsg('')
    try {
      await SuperAdminAPI.updateToggle(FREE_SIGNUP_KEY, next)
      setFreeSignup(next)
      setMsg(`✅ Free signup outside India ${next ? 'enabled' : 'disabled'}`)
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Failed to update — if this is the first time, run scripts/seed_free_signup_toggle.py on the backend first.'))
    } finally {
      setFreeSignupSaving(false)
    }
  }

  const save = async (fn: () => Promise<any>, successMsg: string) => {
    setSaving(true); setMsg('')
    try { await fn(); setMsg('✅ ' + successMsg) }
    catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const savePricing = () => save(
    () => SettingsAPI.updatePrivacy({
      pricing: {
        yearly:      Number(yearlyPrice),
        three_year:  Number(threeYrPrice),
        royalty_pct: Number(royaltyPct),
      }
    }),
    'Pricing updated!'
  )

  const saveRenewal = () => save(
    () => SettingsAPI.updatePrivacy({
      renewal: {
        grace_period:  Number(gracePeriod),
        late_penalty:  Number(latePenalty),
        auto_renewal:  autoRenewal,
      }
    }),
    'Renewal rules saved!'
  )

  const savePenalties = () => save(
    () => SettingsAPI.updatePrivacy({ penalties }),
    'Penalty rules saved!'
  )

  const savePermissions = () => save(
    () => SettingsAPI.updatePrivacy({ permissions_updated: true }),
    'Permissions saved!'
  )

  const toggleNotif = async (key: string, val: boolean) => {
    const updated = { ...settings?.notifications, [key]: val }
    setSaving(true); setMsg('')
    try {
      await SettingsAPI.updateNotifications(updated)
      setSettings((s: any) => ({ ...s, notifications: updated }))
      setMsg('✅ Notification preference saved')
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="page">
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:18,fontWeight:800}}>System Settings</h2>
        <p style={{fontSize:13,color:'#9ca3af'}}>Role permissions, pricing, renewal rules and platform configuration</p>
      </div>

      <div className="tab-bar">
        {[
          {id:'roles',         l:'Role Permissions', ic:faLock},
          {id:'pricing',       l:'Pricing Rules', ic:faSackDollar},
          {id:'renewal',       l:'Renewal Rules', ic:faArrowsRotate},
          {id:'notifications', l:'Notifications', ic:faBell},
        ].map(t => (
          <button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}><FontAwesomeIcon icon={t.ic} className="mr-1.5"/>{t.l}</button>
        ))}
      </div>

      {msg && (
        <div className="toast-in" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,marginBottom:12,fontSize:13,
          background:msg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
          color:msg.startsWith('✅')?'#16a34a':'#ef4444',
          border:`1px solid ${msg.startsWith('✅')?'rgba(39,216,109,.35)':'rgba(255,90,90,.35)'}`}}>
          {msg}
          <button style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}} onClick={()=>setMsg('')}>✕</button>
        </div>
      )}

      {/* ── ROLE PERMISSIONS ─────────────────────────────────────────── */}
      {tab === 'roles' && (
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faLock} className="mr-1.5"/>Role Permissions Matrix</div>
          <div style={{overflowX:'auto'}}>
            <table className="tbl">
              <thead>
                <tr>{['Module','Member','Franchise','HQ Admin','Super Admin'].map(h=><th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {[
                  ['Dashboard',    '✅ View',      '✅ View',       '✅ Full',    '✅ Full'],
                  ['Referrals',    '✅ Own',       '❌',            '✅ All',     '✅ All'],
                  ['Members',      '👤 Own only',  '🗺 Territory',  '🌍 All',    '🌍 All'],
                  ['Groups',       '👁 View',      '🏙 City only',  '✅ All',     '✅ All'],
                  ['Finance',      '💳 Own dues', '🗺 Territory',  '🌍 National','🔓 Full'],
                  ['Events',       '👁 View+Reg', '➕ Create',     '➕ Create',  '➕ Create'],
                  ['Surveys',      '📝 Respond',  '❌',            '✅ All',     '✅ All'],
                  ['Learning',     '✅ Enroll',   '❌',            '✅ Manage',  '✅ Manage'],
                  ['Travel',       '✅ Post',      '❌',            '✅ All',     '✅ All'],
                  ['Business Hub', '✅ Post',      '❌',            '✅ All',     '✅ All'],
                  ['CRM',          '❌',           '✅ Own',        '✅ All',     '✅ All'],
                  ['Reports',      '❌',           '🗺 Territory',  '🌍 National','🔓 Full'],
                  ['Settings',     '⚙️ Personal', '⚙️ Personal',  '⚙️ System', '🔓 Full'],
                  ['User Mgmt',    '❌',           '❌',            '❌',         '✅ Full'],
                  ['Audit Logs',   '❌',           '❌',            '❌',         '✅ Full'],
                ].map((r, i) => (
                  <tr key={i}>
                    <td style={{fontWeight:600}}>{r[0]}</td>
                    {r.slice(1).map((v, j) => (
                      <td key={j}>
                        <span style={{fontSize:12,
                          color:v.startsWith('✅')?'#10b981':v.startsWith('❌')?'#ef4444':v.startsWith('🔓')?'#8b5cf6':'#6b7280'}}>
                          {v}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn-p btn-sm" style={{marginTop:14}} onClick={savePermissions} disabled={saving}>
            {saving?'Saving…':'Save Permissions'}
          </button>
        </div>
      )}

      {/* ── PRICING RULES ────────────────────────────────────────────── */}
      {tab === 'pricing' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div className="card">
            <div style={{fontWeight:700,fontSize:14,marginBottom:16}}><FontAwesomeIcon icon={faSackDollar} className="mr-1.5"/>Membership Pricing</div>
            <div className="fg">
              <label>Yearly Plan (₹)</label>
              <input type="number" value={yearlyPrice} onChange={e=>setYearlyPrice(e.target.value)}/>
              <div style={{fontSize:11,color:'#9ca3af',marginTop:3}}>Current: ₹{Number(yearlyPrice).toLocaleString()}/yr</div>
            </div>
            <div className="fg">
              <label>3-Year Plan (₹)</label>
              <input type="number" value={threeYrPrice} onChange={e=>setThreeYrPrice(e.target.value)}/>
              <div style={{fontSize:11,color:'#9ca3af',marginTop:3}}>Current: ₹{Number(threeYrPrice).toLocaleString()} for 3 years</div>
            </div>
            <div className="fg">
              <label>HQ Royalty %</label>
              <input type="number" min="0" max="100" value={royaltyPct} onChange={e=>setRoyaltyPct(e.target.value)}/>
              <div style={{fontSize:11,color:'#9ca3af',marginTop:3}}>
                On ₹{Number(yearlyPrice).toLocaleString()} → HQ gets ₹{Math.round(Number(yearlyPrice)*Number(royaltyPct)/100).toLocaleString()}
              </div>
            </div>
            <div className="fg">
              <label>GST Rate</label>
              <div style={{padding:'10px 12px',background:'rgba(255,255,255,.04)',borderRadius:8,fontSize:13,fontWeight:600,color:'#6b7280'}}>
                18% (Fixed by government — not editable)
              </div>
            </div>
            <button className="btn btn-p" style={{width:'100%',marginTop:8}} onClick={savePricing} disabled={saving}>
              {saving?'Saving…':'Save Pricing'}
            </button>
          </div>
          <div className="card">
            <div style={{fontWeight:700,fontSize:14,marginBottom:16}}><FontAwesomeIcon icon={faClipboard} className="mr-1.5"/>Plan Rules</div>
            {[
              ['No Free Plan',     'Enforced — all memberships are paid'],
              ['Min Plan',         `₹${Number(yearlyPrice).toLocaleString()}/yr (Yearly)`],
              ['Max Plan',         `₹${Number(threeYrPrice).toLocaleString()} / 3 years`],
              ['Payment Modes',    'UPI, Card, NEFT, Cheque, Cash'],
              ['EMI Available',    'Yes (3-Year plan only)'],
              ['GST',              '18% applicable on all plans'],
            ].map(([k,v])=>(
              <div key={String(k)} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'10px 0',borderBottom:'1px solid #f3f4f6',gap:12}}>
                <span style={{fontSize:13,fontWeight:600,flexShrink:0}}>{k}</span>
                <span style={{fontSize:12,color:'#6b7280',textAlign:'right'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RENEWAL RULES ────────────────────────────────────────────── */}
      {tab === 'renewal' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div className="card">
            <div style={{fontWeight:700,fontSize:14,marginBottom:16}}><FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5"/>Renewal Configuration</div>
            <div className="fg">
              <label>Reminder Days Before Expiry</label>
              <input value={reminderDays} onChange={e=>setReminderDays(e.target.value)}
                placeholder="e.g. 30, 15, 7, 1"/>
              <div style={{fontSize:11,color:'#9ca3af',marginTop:3}}>Comma separated — reminders sent on these days before expiry</div>
            </div>
            <div className="fg">
              <label>Grace Period (days after expiry)</label>
              <input type="number" min="0" max="90" value={gracePeriod} onChange={e=>setGracePeriod(e.target.value)}/>
              <div style={{fontSize:11,color:'#9ca3af',marginTop:3}}>Member retains access for this many days after expiry</div>
            </div>
            <div className="fg">
              <label>Late Renewal Penalty (%)</label>
              <input type="number" min="0" max="50" value={latePenalty} onChange={e=>setLatePenalty(e.target.value)}/>
              <div style={{fontSize:11,color:'#9ca3af',marginTop:3}}>Extra charge on renewals after grace period</div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #f3f4f6'}}>
              <div>
                <div style={{fontSize:13,fontWeight:600}}>Auto-Renewal</div>
                <div style={{fontSize:11,color:'#9ca3af'}}>Automatically charge on renewal date</div>
              </div>
              <Toggle checked={autoRenewal} onChange={setAutoRenewal}/>
            </div>
            {/* Real, live switch — takes effect immediately on toggle,
                unlike the fields above which need "Save Renewal Rules"
                clicked first. Same feature_toggles doc as the Feature
                Toggles screen, so either admin screen stays in sync. */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #f3f4f6'}}>
              <div>
                <div style={{fontSize:13,fontWeight:600}}>Free Signup Outside India</div>
                <div style={{fontSize:11,color:'#9ca3af'}}>A visitor detected outside India gets a full-access $0 membership, no payment. Off = same paid tier picker India sees, priced in USD.</div>
              </div>
              <Toggle checked={!!freeSignup} onChange={toggleFreeSignup}/>
            </div>
            <button className="btn btn-p" style={{width:'100%',marginTop:14}} onClick={saveRenewal} disabled={saving}>
              {saving?'Saving…':'Save Renewal Rules'}
            </button>
          </div>
          <div className="card">
            <div style={{fontWeight:700,fontSize:14,marginBottom:16}}><FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5"/>Penalty Rules</div>
            {[
              {key:'missed_meeting',  label:'Missed Meeting',            suffix:'pts'},
              {key:'no_referral_30',  label:'No Referral (30 days)',     suffix:'pts'},
              {key:'no_visitor_90',   label:'No Visitor (90 days)',      suffix:'pts'},
              {key:'warning_issued',  label:'Warning Issued',            suffix:'pts'},
              {key:'dues_30',         label:'Dues Overdue (30 days)',    suffix:''},
              {key:'dues_60',         label:'Dues Overdue (60 days)',    suffix:''},
            ].map(({key,label,suffix})=>(
              <div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #f3f4f6'}}>
                <span style={{fontSize:13}}>{label}</span>
                <input
                  value={(penalties as any)[key]}
                  onChange={e=>setPenalties({...penalties,[key]:e.target.value})}
                  style={{width:140,textAlign:'right',padding:'4px 8px',fontSize:13,
                    color:suffix==='pts'?'#ef4444':'#f59e0b',fontWeight:600}}
                />
              </div>
            ))}
            <button className="btn btn-p" style={{width:'100%',marginTop:14}} onClick={savePenalties} disabled={saving}>
              {saving?'Saving…':'Save Penalty Rules'}
            </button>
          </div>
        </div>
      )}

      {/* ── NOTIFICATION CONFIG ──────────────────────────────────────── */}
      {tab === 'notifications' && (
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faBell} className="mr-1.5"/>Notification Triggers</div>
          {loading
            ? <Loading label="Loading settings…"/>
            : [
              {key:'meeting',        trigger:'Meeting Reminder',    channels:'Push, WhatsApp',          timing:'1 hour before'},
              {key:'referral',       trigger:'Referral Received',   channels:'Push, In-App',             timing:'Immediate'},
              {key:'payment',        trigger:'Renewal Due',         channels:'Push, WhatsApp, SMS',      timing:'30, 15, 7, 1 days before'},
              {key:'payment_success',trigger:'Payment Success',     channels:'Push, WhatsApp, In-App',   timing:'Immediate'},
              {key:'attendance',     trigger:'Attendance Warning',  channels:'Push, WhatsApp, In-App',   timing:'After 3rd miss'},
              {key:'award',          trigger:'Award Earned',        channels:'Push, WhatsApp, In-App',   timing:'Immediate'},
              {key:'broadcast',      trigger:'Broadcast Message',   channels:'Push, In-App',             timing:'As scheduled'},
              {key:'event',          trigger:'Event Registration',  channels:'Push, In-App',             timing:'On register + 1 day before'},
              {key:'survey',         trigger:'New Survey',          channels:'Push, In-App',             timing:'On send'},
            ].map((n, i) => {
              const enabled = settings?.notifications?.[n.key] !== false
              return (
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #f3f4f6'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600}}>{n.trigger}</div>
                    <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>
                      via {n.channels} · {n.timing}
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:11,color:enabled?'#10b981':'#9ca3af',fontWeight:600}}>
                      {enabled?'Enabled':'Disabled'}
                    </span>
                    <Toggle checked={enabled} onChange={v=>toggleNotif(n.key,v)}/>
                  </div>
                </div>
              )
            })
          }
          {saving && <div style={{fontSize:12,color:'#9ca3af',marginTop:8}}>Saving…</div>}
        </div>
      )}
    </div>
  )
}
