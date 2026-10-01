'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsRotate, faCalendarDays, faChartLine, faTrophy, faUsers } from '@fortawesome/free-solid-svg-icons'
import { ANALYTICS } from '@/lib/data'

const Bar = ({val, max, color}: {val:number, max:number, color:string}) => (
  <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
    <div style={{fontSize:9,color:'#9ca3af'}}>{val}</div>
    <div style={{width:'100%',background:color,borderRadius:'3px 3px 0 0',height:Math.round((val/max)*80)+'px',opacity:.85}}/>
  </div>
)

export default function AnalyticsPage() {
  const maxDAU = Math.max(...ANALYTICS.dau)
  const maxRef = Math.max(...ANALYTICS.monthlyReferrals)
  const maxMem = Math.max(...ANALYTICS.monthlyMembers)

  return (
    <div className="page">
      <div style={{marginBottom:16}}><h2 style={{fontSize:18,fontWeight:800}}>Analytics</h2><p style={{fontSize:13,color:'#9ca3af'}}>Platform-wide KPIs, growth and engagement metrics</p></div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
        {[{l:'Daily Active Users',v:'1,240',c:'#6366f1',trend:'+12%'},{l:'Referrals Created',v:'79',c:'#ff4b0a',trend:'+8%'},{l:'Revenue Generated',v:'₹68Cr',c:'#10b981',trend:'+23%'},{l:'Renewal Rate',v:`${ANALYTICS.renewalRate}%`,c:'#f59e0b',trend:'+2%'},{l:'Churn Rate',v:`${ANALYTICS.churnRate}%`,c:'#ef4444',trend:'-1%'}].map(s=>(
          <div key={s.l} className="stat-card">
            <div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize:11,color:'#9ca3af',marginTop:4}}>{s.l}</div>
            <div style={{fontSize:11,fontWeight:600,color:s.trend.startsWith('+')?'#10b981':'#ef4444',marginTop:2}}>{s.trend} vs last month</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faChartLine} className="mr-1.5"/>Daily Active Users (Last 7 Days)</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:6,height:90}}>
            {ANALYTICS.dau.map((v,i)=><Bar key={i} val={v} max={maxDAU} color="#6366f1"/>)}
          </div>
          <div style={{display:'flex',gap:6,marginTop:4}}>
            {ANALYTICS.dauLabels.map(l=><div key={l} style={{flex:1,fontSize:10,color:'#9ca3af',textAlign:'center'}}>{l}</div>)}
          </div>
        </div>

        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5"/>Referrals Created (Monthly)</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:4,height:90}}>
            {ANALYTICS.monthlyReferrals.map((v,i)=><Bar key={i} val={v} max={maxRef} color="var(--nx-orange)"/>)}
          </div>
          <div style={{display:'flex',gap:4,marginTop:4}}>
            {ANALYTICS.months.map(m=><div key={m} style={{flex:1,fontSize:9,color:'#9ca3af',textAlign:'center'}}>{m}</div>)}
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faUsers} className="mr-1.5"/>Member Growth (12 Months)</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:4,height:90}}>
            {ANALYTICS.monthlyMembers.map((v,i)=><Bar key={i} val={v} max={maxMem} color="#10b981"/>)}
          </div>
          <div style={{display:'flex',gap:4,marginTop:4}}>
            {ANALYTICS.months.map(m=><div key={m} style={{flex:1,fontSize:9,color:'#9ca3af',textAlign:'center'}}>{m}</div>)}
          </div>
        </div>

        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faCalendarDays} className="mr-1.5"/>Meeting Attendance % (Monthly)</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:4,height:90}}>
            {ANALYTICS.meetingAttendance.map((v,i)=><Bar key={i} val={v} max={100} color="#f59e0b"/>)}
          </div>
          <div style={{display:'flex',gap:4,marginTop:4}}>
            {ANALYTICS.months.map(m=><div key={m} style={{flex:1,fontSize:9,color:'#9ca3af',textAlign:'center'}}>{m}</div>)}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faTrophy} className="mr-1.5"/>Top Referrers — All Time</div>
        <table className="tbl">
          <thead><tr>{['Rank','Member','Referrals Given','Revenue Generated','Conversion Rate','Status'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>{ANALYTICS.topReferrers.map((r,i)=>(
            <tr key={r.name}>
              <td><span style={{fontWeight:800,color:i===0?'#f59e0b':i===1?'#9ca3af':i===2?'#cd7c3e':'#cbd5e1'}}>#{i+1}</span></td>
              <td style={{fontWeight:600}}>{r.name}</td>
              <td>{r.count}</td>
              <td style={{fontWeight:600,color:'#10b981'}}>{r.value}</td>
              <td>34%</td>
              <td><span className="badge b-green">Active</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
