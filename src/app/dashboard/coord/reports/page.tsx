'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartBar, faDownload, faTrophy, faUsers } from '@fortawesome/free-solid-svg-icons'

export default function CoordReportsPage() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun']
  const healthScores = [68,72,71,76,79,74]
  const memberGrowth = [32,34,35,36,37,38]
  const maxH = Math.max(...healthScores), maxM = Math.max(...memberGrowth)

  return (
    <div className="page">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div><h2 style={{fontSize:18,fontWeight:800}}>Reports</h2><p style={{fontSize:13,color:'#9ca3af'}}>Monthly group health score, top performers and group growth</p></div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-g btn-sm" onClick={()=>alert('Downloading monthly report...')}>📥 Download Report</button>
          <button className="btn btn-g btn-sm" onClick={()=>alert('Sharing with HQ...')}>📤 Share with HQ</button>
        </div>
      </div>

      {/* Health score summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[{l:'This Month Health',v:'74/100',c:'#f59e0b'},{l:'Attendance',v:'82%',c:'#10b981'},{l:'Referral Activity',v:'74%',c:'#ff4b0a'},{l:'Member Retention',v:'91%',c:'#6366f1'}].map(s=>(
          <div key={s.l} style={{background:`linear-gradient(135deg,${s.c},${s.c}cc)`,borderRadius:12,padding:'14px 12px',boxShadow:`0 2px 4px rgba(0,0,0,.35), 0 14px 32px -10px ${s.c}66, inset 0 1px 0 rgba(255,255,255,.18)`,textAlign:'center',}}><div style={{fontSize:22,fontWeight:800,color:'#fff'}}>{s.v}</div><div style={{fontSize:12,color:'rgba(255,255,255,.75)',marginTop:4}}>{s.l}</div></div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        {/* Monthly Group Health Score Chart */}
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faChartBar} className="mr-1.5"/>Monthly Group Health Score</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:8,height:90}}>
            {healthScores.map((v,i)=>(
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <div style={{fontSize:10,color:'#9ca3af'}}>{v}</div>
                <div style={{width:'100%',background:v>=75?'#10b981':v>=65?'#f59e0b':'#ef4444',borderRadius:'3px 3px 0 0',height:Math.round((v/maxH)*75)+'px',opacity:.85}}/>
                <div style={{fontSize:10,color:'#9ca3af'}}>{months[i]}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:10,fontSize:11,color:'#9ca3af'}}>Target: 80+ · Current: 74 · Trend: ↑ improving</div>
        </div>

        {/* Member Growth */}
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faUsers} className="mr-1.5"/>Group Growth</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:8,height:90}}>
            {memberGrowth.map((v,i)=>(
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <div style={{fontSize:10,color:'#9ca3af'}}>{v}</div>
                <div style={{width:'100%',background:'#6366f1',borderRadius:'3px 3px 0 0',height:Math.round((v/maxM)*75)+'px',opacity:.85}}/>
                <div style={{fontSize:10,color:'#9ca3af'}}>{months[i]}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:10,fontSize:11,color:'#9ca3af'}}>Total members: 38 · Added this month: 2 · Capacity: 50</div>
        </div>
      </div>

      {/* Top Performers Table */}
      <div className="card" style={{marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faTrophy} className="mr-1.5"/>Top Performers — April 2026</div>
        <table className="tbl">
          <thead><tr>{['Rank','Member','Category','Referrals Given','Referral Value','Attendance','Score'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>{[
            {r:1,n:'Rohit Arora',cat:'IT Services',refs:8,val:'₹2.4L',att:'100%',score:94},
            {r:2,n:'Vijay Mehta',cat:'Finance',refs:7,val:'₹1.8L',att:'95%',score:91},
            {r:3,n:'Sunita Verma',cat:'Real Estate',refs:6,val:'₹3.1L',att:'90%',score:88},
            {r:4,n:'Priya Khanna',cat:'Digital Mktg',refs:5,val:'₹0.9L',att:'91%',score:85},
            {r:5,n:'Deepak Jain',cat:'Consulting',refs:4,val:'₹0.7L',att:'82%',score:78},
          ].map(m=>(
            <tr key={m.r}>
              <td><span style={{fontWeight:800,color:m.r===1?'#f59e0b':m.r===2?'#9ca3af':m.r===3?'#cd7c3e':'#cbd5e1'}}>#{m.r}</span></td>
              <td style={{fontWeight:600}}>{m.n}</td><td>{m.cat}</td>
              <td style={{fontWeight:600}}>{m.refs}</td>
              <td style={{color:'#10b981',fontWeight:600}}>{m.val}</td>
              <td style={{color:'#10b981',fontWeight:600}}>{m.att}</td>
              <td><div style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:50,height:5,background:'rgba(255,255,255,.06)',borderRadius:99}}>
                  <div style={{height:'100%',width:m.score+'%',background:m.score>=80?'#10b981':'#f59e0b',borderRadius:99}}/>
                </div>
                <span style={{fontSize:12,fontWeight:700}}>{m.score}</span>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {/* Download options */}
      <div className="card">
        <div style={{fontWeight:700,fontSize:14,marginBottom:12}}><FontAwesomeIcon icon={faDownload} className="mr-1.5"/>Report Downloads</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {[['Monthly Health Report','Apr 2026','PDF'],['Attendance Report','Apr 2026','PDF'],['Referral Summary','Apr 2026','Excel'],['Member Performance','Q1 2026','Excel'],['Group Growth Report','YTD 2026','PDF'],['Visitor Conversion','Apr 2026','PDF']].map(([t,p,f])=>(
            <button key={t} className="btn btn-g" style={{textAlign:'left',padding:'12px'}} onClick={()=>alert('Downloading '+t)}>
              <div style={{fontSize:12,fontWeight:600}}>{t}</div>
              <div style={{fontSize:11,color:'#9ca3af'}}>{p} · {f}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
