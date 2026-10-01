'use client'
import { useState } from 'react'

const GROUPS = [
  {id:'g1',name:'Delhi NCR Elite',members:55,capacity:60,director:'Rohit Arora',meetings:52,attendance:91,openSeats:5,status:'active',revenue:'₹82.5L',established:'Sep 2019',categories:['IT','Finance','Real Estate','Manufacturing','Retail']},
  {id:'g2',name:'Delhi Central',members:48,capacity:60,director:'Priya Kapoor',meetings:48,attendance:87,openSeats:12,status:'active',revenue:'₹72L',established:'Jan 2020',categories:['Consulting','Legal','Healthcare','Education']},
  {id:'g3',name:'Delhi North',members:42,capacity:50,director:'Anita Singh',meetings:44,attendance:82,openSeats:8,status:'active',revenue:'₹63L',established:'Jun 2020',categories:['FMCG','Retail','Logistics','Distribution']},
  {id:'g4',name:'Delhi South',members:38,capacity:50,director:'Rahul Verma',meetings:40,attendance:78,openSeats:12,status:'active',revenue:'₹57L',established:'Mar 2021',categories:['IT','Startup','Marketing','Digital']},
  {id:'g5',name:'Noida Business',members:34,capacity:45,director:'Deepa Rao',meetings:36,attendance:74,openSeats:11,status:'active',revenue:'₹51L',established:'Jun 2021',categories:['IT','Manufacturing','Export','Pharma']},
  {id:'g6',name:'Gurgaon Leaders',members:28,capacity:40,director:'Vikram Shah',meetings:28,attendance:69,openSeats:12,status:'new',revenue:'₹42L',established:'Jan 2026',categories:['Finance','Consulting','Technology']},
]

// All derived - always consistent
const TOTAL_MEMBERS = GROUPS.reduce((a,g)=>a+g.members,0)      // 245
const OPEN_SEATS   = GROUPS.reduce((a,g)=>a+g.openSeats,0)     // 60
const AVG_ATT      = Math.round(GROUPS.reduce((a,g)=>a+g.attendance,0)/GROUPS.length) // 80

export default function FranchiseGroupsPage() {
  const [selected, setSelected] = useState<typeof GROUPS[0]|null>(null)

  return (
    <div className="page">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:18,fontWeight:800}}>Groups</h2>
          <p style={{fontSize:13,color:'#9ca3af'}}>Delhi Territory · {GROUPS.length} active groups · {TOTAL_MEMBERS} total members</p>
        </div>
        <button className="btn btn-p" onClick={()=>alert('New group request sent to HQ!')}>+ Request New Group</button>
      </div>

      {/* Stats derived from actual GROUPS array */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[
          {l:'Total Groups',v:GROUPS.length,c:'#6366f1'},
          {l:'Total Members',v:TOTAL_MEMBERS,c:'#ff4b0a'},
          {l:'Avg Attendance',v:AVG_ATT+'%',c:'#10b981'},
          {l:'Open Seats',v:OPEN_SEATS,c:'#f59e0b'},
        ].map(s=>(
          <div key={s.l} style={{background:`linear-gradient(135deg,${s.c},${s.c}cc)`,borderRadius:12,padding:'14px 16px',boxShadow:`0 2px 4px rgba(0,0,0,.35), 0 14px 32px -10px ${s.c}66, inset 0 1px 0 rgba(255,255,255,.18)`}}>
            <div style={{fontSize:26,fontWeight:800,color:'#fff'}}>{s.v}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.8)',marginTop:4}}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
        {GROUPS.map(g=>(
          <div key={g.id} className="card" style={{cursor:'pointer'}} onClick={()=>setSelected(g)}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
              <div>
                <div style={{fontSize:15,fontWeight:700}}>{g.name}</div>
                <div style={{fontSize:12,color:'#9ca3af'}}>Est. {g.established} · {g.meetings} meetings held</div>
              </div>
              <span className={`badge ${g.status==='active'?'b-green':'b-yellow'}`}>{g.status}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:10}}>
              {[{l:'Members',v:`${g.members}/${g.capacity}`},{l:'Meetings',v:g.meetings},{l:'Attendance',v:`${g.attendance}%`},{l:'Open Seats',v:g.openSeats}].map(s=>(
                <div key={s.l} style={{textAlign:'center',background:'rgba(255,255,255,.04)',borderRadius:8,padding:'8px 4px'}}>
                  <div style={{fontWeight:700,fontSize:14}}>{s.v}</div>
                  <div style={{fontSize:10,color:'#9ca3af'}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div className="prog" style={{marginBottom:6}}>
              <div className="prog-fill" style={{width:`${Math.round(g.members/g.capacity*100)}%`}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#6b7280'}}>
              <span style={{fontWeight:600,color:'#10b981'}}>{g.revenue}/yr</span>
            </div>
          </div>
        ))}
      </div>

      {selected&&<div className="overlay" onClick={e=>e.target===e.currentTarget&&setSelected(null)}>
        <div className="modal modal-lg">
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
            <h3 style={{fontSize:17,fontWeight:700}}>{selected.name}</h3>
            <span className={`badge ${selected.status==='active'?'b-green':'b-yellow'}`}>{selected.status}</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
            {[['Director',selected.director],['Established',selected.established],['Revenue/yr',selected.revenue],['Members',`${selected.members}/${selected.capacity}`],['Attendance',`${selected.attendance}%`],['Open Seats',selected.openSeats],['Meetings Held',selected.meetings]].map(([k,v])=>(
              <div key={k}><div style={{fontSize:11,color:'#9ca3af'}}>{k}</div><div style={{fontSize:13,fontWeight:600}}>{String(v)}</div></div>
            ))}
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Business Categories</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{selected.categories.map(c=><span key={c} className="badge b-blue" style={{fontSize:11}}>{c}</span>)}</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-p" style={{flex:1}} onClick={()=>alert('Opening group management...')}>Manage Group</button>
            <button className="btn btn-g" style={{flex:1}} onClick={()=>setSelected(null)}>Close</button>
          </div>
        </div>
      </div>}
    </div>
  )
}
