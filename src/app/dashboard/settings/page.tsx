'use client'
import { Loading } from '@/components/shared/States'
import { useState, useEffect } from 'react'
import { SettingsAPI, ProfileAPI, TokenStore } from '@/lib/api'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faLock, faBell, faShieldHalved, faLink, faCalendarDays, faComment, faVideo, faBriefcase } from '@fortawesome/free-solid-svg-icons'

// Defined OUTSIDE SettingsPage — same anti-pattern as the Travel Connect
// focus bug (component declared inside its parent, remounted every
// render). Harmless in this specific case since a toggle has no typed
// text to lose, but fixed for consistency and correctness anyway.
function Toggle({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      width:44,height:24,borderRadius:99,border:'none',cursor:'pointer',
      background:checked?'#10b981':'var(--nx-line)',position:'relative',transition:'background .2s'}}>
      <div style={{width:18,height:18,borderRadius:'50%',background:'var(--nx-panel)',position:'absolute',
        top:3,transition:'left .2s',left:checked?'22px':'4px',boxShadow:'0 1px 3px rgba(0,0,0,.2)'}}/>
    </button>
  )
}

export default function SettingsPage() {
  const [tab,      setTab]      = useState('profile')
  const [profile,  setProfile]  = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState('')
  const [form,     setForm]     = useState<any>({})
  const [pwForm,   setPwForm]   = useState({ current_password:'', new_password:'', confirm:'' })
  const me = TokenStore.getUser()

  useEffect(() => {
    Promise.all([ProfileAPI.get(), SettingsAPI.get()])
      .then(([p, s]) => {
        setProfile(p); setSettings(s)
        setForm({ name: p.name||'', city: p.city||'', profession: p.profession||'', company: p.company||'', bio: p.bio||'',
                  category: p.category||'', country: p.country||'', looking_for: p.looking_for||'', open_to_referrals: p.open_to_referrals||false })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async (fn: () => Promise<any>, successMsg: string) => {
    setSaving(true); setMsg('')
    try { await fn(); setMsg('✅ ' + successMsg) }
    catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const toggleNotif = async (key: string, val: boolean) => {
    const updated = { ...settings?.notifications, [key]: val }
    await save(() => SettingsAPI.updateNotifications(updated), 'Notification preference saved')
    setSettings((s: any) => ({ ...s, notifications: updated }))
  }

  const togglePrivacy = async (key: string, val: boolean) => {
    const updated = { ...settings?.privacy, [key]: val }
    await save(() => SettingsAPI.updatePrivacy(updated), 'Privacy setting saved')
    setSettings((s: any) => ({ ...s, privacy: updated }))
  }

  return (
    <div className="page">
      <div style={{marginBottom:16}}><h2 style={{fontSize:18,fontWeight:800}}>Settings</h2></div>

      {msg && <div className="toast-in" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,marginBottom:12,fontSize:13,
        background:msg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
        color:msg.startsWith('✅')?'#16a34a':'#ef4444',
        border:`1px solid ${msg.startsWith('✅')?'rgba(39,216,109,.35)':'rgba(255,90,90,.35)'}`}}>{msg}<button style={{background:'none',border:'none',cursor:'pointer',color:'var(--nx-muted)',flexShrink:0}} onClick={()=>setMsg('')}>✕</button></div>}

      <div style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:20}}>
        {/* Sidebar nav */}
        <div style={{display:'flex',flexDirection:'column',gap:2}}>
          {[
            {id:'profile',l:'Profile',ic:faUser},
            {id:'account',l:'Account',ic:faLock},
            {id:'notifications',l:'Notifications',ic:faBell},
            {id:'privacy',l:'Privacy',ic:faShieldHalved},
            {id:'integrations',l:'Integrations',ic:faLink},
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="btn btn-g"
              style={{textAlign:'left',justifyContent:'flex-start',
                background:tab===t.id?'#fff8f6':'#fff',
                borderColor:tab===t.id?'var(--nx-orange)':'var(--nx-line)',
                color:tab===t.id?'var(--nx-orange)':'#cbd5e1'}}><FontAwesomeIcon icon={t.ic} className="mr-1.5"/>{t.l}</button>
          ))}
        </div>

        <div className="card">
          {/* Profile Tab */}
          {tab === 'profile' && (
            <div>
              <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Profile Settings</div>
              {loading ? <Loading compact label="Loading…"/> : <>
                <div className="fg"><label>Full Name</label>
                  <input value={form.name} onChange={e => setForm({...form,name:e.target.value})}/>
                </div>
                <div className="form-grid">
                  <div className="fg"><label>City</label>
                    <input value={form.city} onChange={e => setForm({...form,city:e.target.value})}/>
                  </div>
                  <div className="fg"><label>Profession</label>
                    <input value={form.profession} onChange={e => setForm({...form,profession:e.target.value})}/>
                  </div>
                </div>
                <div className="fg"><label>Company</label>
                  <input value={form.company} onChange={e => setForm({...form,company:e.target.value})}/>
                </div>
                <div className="fg"><label>Bio</label>
                  <textarea rows={3} value={form.bio} onChange={e => setForm({...form,bio:e.target.value})}/>
                </div>
                <div style={{fontWeight:700,fontSize:13,margin:'18px 0 4px',color:'#9ca3af'}}>DISCOVERY — shown on Explore NetworkX</div>
                <div className="form-grid">
                  <div className="fg"><label>Business Category</label>
                    <input value={form.category||''} onChange={e => setForm({...form,category:e.target.value})} placeholder="IT Services, Finance, Real Estate…"/>
                  </div>
                  <div className="fg"><label>Country</label>
                    <input value={form.country||''} onChange={e => setForm({...form,country:e.target.value})} placeholder="India"/>
                  </div>
                </div>
                <div className="fg"><label>Looking For</label>
                  <input value={form.looking_for||''} onChange={e => setForm({...form,looking_for:e.target.value})} placeholder="What are you hoping to find in the network?"/>
                </div>
                <div className="fg" style={{display:'flex',alignItems:'center',gap:8}}>
                  <input type="checkbox" checked={form.open_to_referrals||false} onChange={e => setForm({...form,open_to_referrals:e.target.checked})} style={{width:'auto'}}/>
                  <label style={{marginBottom:0}}>Open to Referrals — show this badge on my Discover card</label>
                </div>
                <button className="btn btn-p" disabled={saving}
                  onClick={() => save(() => ProfileAPI.update(form), 'Profile saved')}>
                  {saving?'Saving…':'Save Changes'}
                </button>
              </>}
            </div>
          )}

          {/* Account Tab */}
          {tab === 'account' && (
            <div>
              <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Account & Security</div>
              <div style={{background:'rgba(255,255,255,.04)',borderRadius:10,padding:12,marginBottom:16}}>
                <div style={{fontSize:12,color:'#9ca3af',marginBottom:4}}>Logged in as</div>
                <div style={{fontSize:14,fontWeight:600}}>{me?.name}</div>
                <div style={{fontSize:12,color:'#6b7280'}}>{me?.role} · {me?.city||'—'}</div>
              </div>
              <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>Change Password</div>
              <div className="fg"><label>Current Password</label>
                <input type="password" value={pwForm.current_password}
                  onChange={e => setPwForm({...pwForm,current_password:e.target.value})} placeholder="Current password"/>
              </div>
              <div className="fg"><label>New Password</label>
                <input type="password" value={pwForm.new_password}
                  onChange={e => setPwForm({...pwForm,new_password:e.target.value})} placeholder="Min 8 characters"/>
              </div>
              <div className="fg"><label>Confirm New Password</label>
                <input type="password" value={pwForm.confirm}
                  onChange={e => setPwForm({...pwForm,confirm:e.target.value})} placeholder="Repeat new password"/>
              </div>
              <button className="btn btn-p" disabled={saving||!pwForm.current_password||!pwForm.new_password||pwForm.new_password!==pwForm.confirm}
                onClick={() => save(() => ProfileAPI.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password }), 'Password changed')}>
                {saving?'Saving…':'Change Password'}
              </button>
              {pwForm.new_password && pwForm.confirm && pwForm.new_password !== pwForm.confirm && (
                <div style={{fontSize:12,color:'#ef4444',marginTop:6}}>Passwords don't match</div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {tab === 'notifications' && (
            <div>
              <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Notification Preferences</div>
              {[
                {key:'push',      label:'Push Notifications', desc:'Mobile push alerts'},
                {key:'sms',       label:'SMS',                desc:'Text message alerts'},
                {key:'whatsapp',  label:'WhatsApp',           desc:'WhatsApp notifications'},
                {key:'email',     label:'Email',              desc:'Email notifications'},
                {key:'referral',  label:'Referral Alerts',    desc:'When you receive a referral'},
                {key:'meeting',   label:'Meeting Reminders',  desc:'Before meetings start'},
                {key:'payment',   label:'Payment Alerts',     desc:'Due dates and confirmations'},
              ].map(n => (
                <div key={n.key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #f3f4f6'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{n.label}</div>
                    <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>{n.desc}</div>
                  </div>
                  <Toggle
                    checked={settings?.notifications?.[n.key] !== false}
                    onChange={v => toggleNotif(n.key, v)}/>
                </div>
              ))}
            </div>
          )}

          {/* Privacy Tab */}
          {tab === 'privacy' && (
            <div>
              <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Privacy Settings</div>
              {[
                {key:'show_phone',      label:'Show Phone Number',   desc:'Visible to other NIA members'},
                {key:'show_email',      label:'Show Email Address',  desc:'Visible to other NIA members'},
                {key:'show_city',       label:'Show City',           desc:'Visible in directory'},
                {key:'profile_visible', label:'Profile in Directory',desc:'Appear in member directory'},
              ].map(p => (
                <div key={p.key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #f3f4f6'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{p.label}</div>
                    <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>{p.desc}</div>
                  </div>
                  <Toggle
                    checked={settings?.privacy?.[p.key] !== false}
                    onChange={v => togglePrivacy(p.key, v)}/>
                </div>
              ))}
            </div>
          )}

          {/* Integrations Tab */}
          {tab === 'integrations' && (
            <div>
              <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Integrations</div>
              {[
                {key:'google_calendar', name:'Google Calendar', desc:'Sync meetings to Google Calendar', icon:faCalendarDays},
                {key:'whatsapp_business',name:'WhatsApp Business',desc:'Receive referral alerts on WhatsApp',icon:faComment},
                {key:'zoom',           name:'Zoom',             desc:'Join digital meetings via Zoom',   icon:faVideo},
                {key:'linkedin',       name:'LinkedIn',         desc:'Import connections & verify profile',icon:faBriefcase},
              ].map(i => {
                const connected = settings?.integrations?.[i.key] === true
                return (
                  <div key={i.key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #f3f4f6'}}>
                    <div style={{display:'flex',gap:10,alignItems:'center'}}>
                      <div style={{width:36,height:36,background:'rgba(255,255,255,.06)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}><FontAwesomeIcon icon={i.icon}/></div>
                      <div>
                        <div style={{fontSize:13,fontWeight:600}}>{i.name}</div>
                        <div style={{fontSize:11,color:'#9ca3af'}}>{i.desc}</div>
                      </div>
                    </div>
                    <button className={`btn btn-sm ${connected?'btn-g':'btn-p'}`}
                      disabled={saving}
                      onClick={() => save(
                        () => SettingsAPI.updateIntegrations({ [i.key]: !connected }),
                        connected?`${i.name} disconnected`:`${i.name} connected`
                      ).then(() => setSettings((s: any) => ({ ...s, integrations: { ...s?.integrations, [i.key]: !connected } })))}>
                      {connected?'Disconnect':'Connect'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
