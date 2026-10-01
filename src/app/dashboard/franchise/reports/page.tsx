'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartBar, faChartLine, faDownload } from '@fortawesome/free-solid-svg-icons'

export default function FranchiseReportsPage() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun']
  const data = [148,162,171,182,191,198]
  const max = Math.max(...data)
  return (
    <div className="page">
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:18,fontWeight:800}}>Reports</h2>
        <p style={{fontSize:13,color:'#9ca3af'}}>Group performance, membership growth and referral reports</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}><FontAwesomeIcon icon={faChartLine} className="mr-1.5"/>Membership Growth</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:8,height:80}}>
            {data.map((v,i)=>(
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <div style={{fontSize:10,color:'#9ca3af'}}>{v}</div>
                <div style={{width:'100%',background:'#1e3a5f',borderRadius:'3px 3px 0 0',height:Math.round((v/max)*70)+'px',opacity:.8}}/>
                <div style={{fontSize:10,color:'#9ca3af'}}>{months[i]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:12}}><FontAwesomeIcon icon={faChartBar} className="mr-1.5"/>Group Health Scores</div>
          {[{name:'Delhi NCR Elite',score:91},{name:'Delhi Central',score:87},{name:'Delhi North',score:82},{name:'Delhi South',score:78},{name:'Noida Business',score:72},{name:'Gurgaon Leaders',score:65}].map(g=>(
            <div key={g.name} style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:12}}>{g.name}</span>
                <span style={{fontSize:12,fontWeight:700,color:g.score>=80?'#10b981':g.score>=70?'#f59e0b':'#ef4444'}}>{g.score}/100</span>
              </div>
              <div className="prog"><div className="prog-fill" style={{width:g.score+'%',background:g.score>=80?'#10b981':g.score>=70?'#f59e0b':'#ef4444'}}/></div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div style={{fontWeight:700,fontSize:14,marginBottom:12}}><FontAwesomeIcon icon={faDownload} className="mr-1.5"/>Download Reports</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {[['Monthly Performance Report','Apr 2026','PDF'],['Referral Analytics Report','Q1 2026','Excel'],['Member Renewal Report','Apr 2026','PDF'],['Financial Summary','Mar 2026','Excel'],['Attendance Report','Apr 2026','PDF'],['Visitor Conversion Report','Q1 2026','PDF']].map(([title,period,type])=>(
            <button key={title} className="btn btn-g" style={{textAlign:'left',padding:'12px'}} onClick={()=>alert('Downloading '+title)}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{title}</div>
              <div style={{fontSize:11,color:'#9ca3af'}}>{period} · {type}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
