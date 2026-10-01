'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsRotate, faChartLine, faClipboard } from '@fortawesome/free-solid-svg-icons'

export default function CoordAnalyticsPage() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun']
  const attendance = [78,81,75,83,87,82]
  const referrals = [28,34,29,41,38,47]
  const maxAtt = Math.max(...attendance)
  const maxRef = Math.max(...referrals)

  return (
    <div className="page">
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:18,fontWeight:800}}>Performance Analytics</h2>
        <p style={{fontSize:13,color:'#9ca3af'}}>Group health scores, attendance trends and referral performance</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[{l:'Avg Attendance',v:'81%',c:'#10b981'},{l:'Total Referrals',v:47,c:'#ff4b0a'},{l:'Conversion Rate',v:'34%',c:'#6366f1'},{l:'Group Health Score',v:'74/100',c:'#f59e0b'}].map(s=>(
          <div key={s.l} style={{background:`linear-gradient(135deg,${s.c},${s.c}cc)`,borderRadius:12,padding:'14px 12px',boxShadow:`0 2px 4px rgba(0,0,0,.35), 0 14px 32px -10px ${s.c}66, inset 0 1px 0 rgba(255,255,255,.18)`,textAlign:'center',}}><div style={{fontSize:22,fontWeight:800,color:'#fff'}}>{s.v}</div><div style={{fontSize:12,color:'rgba(255,255,255,.75)',marginTop:4}}>{s.l}</div></div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faChartLine} className="mr-1.5"/>Attendance Trend</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:8,height:80}}>
            {attendance.map((v,i)=>(
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <div style={{fontSize:10,color:'#9ca3af'}}>{v}%</div>
                <div style={{width:'100%',background:'#10b981',borderRadius:'3px 3px 0 0',height:Math.round((v/maxAtt)*70)+'px',opacity:.8}}/>
                <div style={{fontSize:10,color:'#9ca3af'}}>{months[i]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5"/>Referrals Given</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:8,height:80}}>
            {referrals.map((v,i)=>(
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <div style={{fontSize:10,color:'#9ca3af'}}>{v}</div>
                <div style={{width:'100%',background:'var(--nx-orange)',borderRadius:'3px 3px 0 0',height:Math.round((v/maxRef)*70)+'px',opacity:.8}}/>
                <div style={{fontSize:10,color:'#9ca3af'}}>{months[i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faClipboard} className="mr-1.5"/>Monthly Group Health Score</div>
        {[{label:'Attendance Rate',val:82,color:'#10b981'},{label:'Referral Activity',val:74,color:'var(--nx-orange)'},{label:'Member Retention',val:91,color:'#6366f1'},{label:'Visitor Conversion',val:62,color:'#f59e0b'},{label:'Payment Compliance',val:88,color:'#8b5cf6'}].map(m=>(
          <div key={m.label} style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{fontSize:13}}>{m.label}</span>
              <span style={{fontSize:13,fontWeight:700,color:m.color}}>{m.val}%</span>
            </div>
            <div className="prog"><div className="prog-fill" style={{width:m.val+'%',background:m.color}}/></div>
          </div>
        ))}
      </div>
    </div>
  )
}
