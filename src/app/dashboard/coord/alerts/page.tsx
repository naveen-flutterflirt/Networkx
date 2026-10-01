'use client'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMobileScreen, faArrowsRotate, faCreditCard, faArrowTrendDown, faUser, faCircleCheck } from '@fortawesome/free-solid-svg-icons'

export default function CoordAlertsPage() {
  const [dismissed, setDismissed] = useState<number[]>([])

  const ALERTS = [
    {id:1,type:'absent',severity:'danger',member:'Ajay Wadhwa',detail:'Absent 3 consecutive meetings — Apr 1, Apr 15, Apr 28',action:'Send Warning',actionType:'warn'},
    {id:2,type:'absent',severity:'danger',member:'Deepa Rao',detail:'Absent 3 consecutive meetings — Mar 31, Apr 15, Apr 28',action:'Send Warning',actionType:'warn'},
    {id:3,type:'referral',severity:'warn',member:'Anand Pillai',detail:'No referral given in 60+ days — last referral Feb 2026',action:'Send Nudge',actionType:'nudge'},
    {id:4,type:'referral',severity:'warn',member:'Sunil Ravi',detail:'No referral given in 45 days — last referral Mar 1, 2026',action:'Send Nudge',actionType:'nudge'},
    {id:5,type:'dues',severity:'danger',member:'Ajay Wadhwa',detail:'Membership dues overdue by 45 days — ₹14,160 pending',action:'Send Reminder',actionType:'payment'},
    {id:6,type:'dues',severity:'warn',member:'Priya Das',detail:'Membership renewal due in 7 days — ₹14,160',action:'Send Reminder',actionType:'payment'},
    {id:7,type:'engagement',severity:'warn',member:'Suresh Kumar',detail:'Low engagement score — 38/100. Attending but not referring.',action:'Schedule 1-2-1',actionType:'meeting'},
    {id:8,type:'visitor',severity:'info',member:'Group',detail:'No visitor registered for next meeting — target is 3 visitors/month',action:'Remind Members',actionType:'visitor'},
  ]

  const active = ALERTS.filter(a=>!dismissed.includes(a.id))
  const byType = {absent:active.filter(a=>a.type==='absent'),referral:active.filter(a=>a.type==='referral'),dues:active.filter(a=>a.type==='dues'),engagement:active.filter(a=>a.type==='engagement'),visitor:active.filter(a=>a.type==='visitor')}

  const ICON: Record<string,any> = {absent:faMobileScreen,referral:faArrowsRotate,dues:faCreditCard,engagement:faArrowTrendDown,visitor:faUser}
  const COLOR: Record<string,string> = {danger:'#ef4444',warn:'#f59e0b',info:'#6366f1'}
  const BG: Record<string,string> = {danger:'rgba(255,90,90,.1)',warn:'#fffbeb',info:'rgba(22,143,255,.1)'}

  return (
    <div className="page">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div><h2 style={{fontSize:18,fontWeight:800}}>Alerts</h2><p style={{fontSize:13,color:'#9ca3af'}}>Absent members, missing referrals and dues pending</p></div>
        <button className="btn btn-p btn-sm" onClick={()=>alert('Bulk action: all alerts sent!')}>📢 Send All Alerts</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[{l:'Absent 3x',v:byType.absent.length,c:'#ef4444',icon:faMobileScreen},{l:'No Referrals',v:byType.referral.length,c:'#f59e0b',icon:faArrowsRotate},{l:'Dues Pending',v:byType.dues.length,c:'#ef4444',icon:faCreditCard},{l:'Low Engagement',v:byType.engagement.length,c:'#f59e0b',icon:faArrowTrendDown}].map(s=>(
          <div key={s.l} className="stat-card" style={{borderTop:`3px solid ${s.c}`}}>
            <div style={{fontSize:26,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize:11,color:'#9ca3af',marginTop:4}}><FontAwesomeIcon icon={s.icon} className="mr-1"/>{s.l}</div>
          </div>
        ))}
      </div>

      {active.length===0&&<div className="alert-success"><FontAwesomeIcon icon={faCircleCheck} className="mr-1.5"/>No active alerts — group is in great shape!</div>}

      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {active.map(a=>(
          <div key={a.id} style={{background:BG[a.severity],border:`1px solid ${COLOR[a.severity]}33`,borderLeft:`3px solid ${COLOR[a.severity]}`,borderRadius:10,padding:'12px 16px',display:'flex',gap:12,alignItems:'center'}}>
            <div style={{fontSize:22,flexShrink:0}}><FontAwesomeIcon icon={ICON[a.type]}/></div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:COLOR[a.severity]}}>{a.member}</div>
              <div style={{fontSize:12,color:'#cbd5e1',marginTop:2}}>{a.detail}</div>
            </div>
            <div style={{display:'flex',gap:6,flexShrink:0}}>
              <button className="btn btn-xs btn-p" onClick={()=>alert('✅ Action taken: '+a.action+' for '+a.member)}>{a.action}</button>
              <button className="btn btn-xs btn-g" onClick={()=>setDismissed(d=>[...d,a.id])}>Dismiss</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
