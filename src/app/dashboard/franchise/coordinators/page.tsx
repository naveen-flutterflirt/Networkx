'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faComment } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'

const COORDINATORS = [
  {id:1,name:'Meena Gupta',group:'Delhi NCR Elite',mobile:'+91 98001 11111',email:'meena@nia.com',since:'Sep 2019',members:55,attendance:'89%',referrals:142,status:'active',lastActive:'Today'},
  {id:2,name:'Suresh Jain',group:'Delhi Central',mobile:'+91 98001 22222',email:'suresh@nia.com',since:'Jan 2020',members:48,attendance:'85%',referrals:118,status:'active',lastActive:'Yesterday'},
  {id:3,name:'Ravi Sharma',group:'Delhi North',mobile:'+91 98001 33333',email:'ravi@nia.com',since:'Jun 2020',members:42,attendance:'82%',referrals:96,status:'active',lastActive:'Today'},
  {id:4,name:'Kavita Mehta',group:'Delhi South',mobile:'+91 98001 44444',email:'kavita@nia.com',since:'Mar 2021',members:38,attendance:'78%',referrals:84,status:'active',lastActive:'2 days ago'},
  {id:5,name:'Amit Saxena',group:'Noida Business',mobile:'+91 98001 55555',email:'amit@nia.com',since:'Jun 2021',members:34,attendance:'74%',referrals:71,status:'active',lastActive:'Today'},
  {id:6,name:'Neha Tiwari',group:'Gurgaon Leaders',mobile:'+91 98001 66666',email:'neha@nia.com',since:'Jan 2026',members:28,attendance:'69%',referrals:42,status:'new',lastActive:'Today'},
]

export default function FranchiseCoordinatorsPage() {
  const [selected, setSelected] = useState<typeof COORDINATORS[0]|null>(null)
  const [showAssign, setShowAssign] = useState(false)

  return (
    <div className="page">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div><h2 style={{fontSize:18,fontWeight:800}}>Coordinators</h2><p style={{fontSize:13,color:'#9ca3af'}}>Manage group coordinators across Delhi Territory</p></div>
        <button className="btn btn-p" onClick={()=>setShowAssign(true)}>+ Assign Coordinator</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
        {[{l:'Total Coordinators',v:COORDINATORS.length,c:'#6366f1'},{l:'Active',v:COORDINATORS.filter(c=>c.status==='active').length,c:'#10b981'},{l:'Avg Attendance Managed',v:'80%',c:'#ff4b0a'}].map(s=>(
          <div key={s.l} style={{background:`linear-gradient(135deg,${s.c},${s.c}cc)`,borderRadius:12,padding:'14px 12px',boxShadow:`0 2px 4px rgba(0,0,0,.35), 0 14px 32px -10px ${s.c}66, inset 0 1px 0 rgba(255,255,255,.18)`,textAlign:'center',}}><div style={{fontSize:22,fontWeight:800,color:'#fff'}}>{s.v}</div><div style={{fontSize:12,color:'rgba(255,255,255,.75)',marginTop:4}}>{s.l}</div></div>
        ))}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {COORDINATORS.map(c=>(
          <div key={c.id} className="card">
            <div style={{display:'flex',gap:14,alignItems:'center'}}>
              <div className="av" style={{width:44,height:44,fontSize:15,background:'#10b981'}}>{c.name.split(' ').map((n:string)=>n[0]).join('')}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700}}>{c.name}</div>
                <div style={{fontSize:12,color:'#9ca3af'}}>{c.group} · Since {c.since}</div>
                <div style={{fontSize:11,color:'#9ca3af'}}>{c.mobile} · {c.email}</div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,textAlign:'center',flexShrink:0}}>
                {[{l:'Members',v:c.members},{l:'Attendance',v:c.attendance},{l:'Referrals',v:c.referrals}].map(s=>(
                  <div key={s.l} style={{background:'rgba(255,255,255,.04)',borderRadius:8,padding:'8px 12px'}}>
                    <div style={{fontSize:14,fontWeight:700,color:'var(--nx-orange)'}}>{s.v}</div>
                    <div style={{fontSize:10,color:'#9ca3af'}}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:6,flexShrink:0}}>
                <span className={`badge ${c.status==='active'?'b-green':'b-yellow'}`}>{c.status}</span>
                <button className="btn btn-xs btn-p" onClick={()=>setSelected(c)}>View Logs</button>
                <button className="btn btn-xs btn-g" onClick={()=>window.location.href='/dashboard/messages'}><FontAwesomeIcon icon={faComment} className="mr-1.5"/>Message</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected&&<div className="overlay" onClick={e=>e.target===e.currentTarget&&setSelected(null)}>
        <div className="modal modal-lg">
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}>{selected.name} — Activity Logs</h3>
          <div style={{marginBottom:14}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:8}}>Recent Actions</div>
            {[{t:'Apr 22, 10:38 AM',a:'Approved 2 new members — Arjun Patel, Kavya Sharma'},{t:'Apr 22, 09:15 AM',a:'Created April meeting — Hotel Trident, Apr 28'},{t:'Apr 21, 06:30 PM',a:'Issued warning to Rohit Verma — 3 absences'},{t:'Apr 20, 11:00 AM',a:'Registered 2 visitors for next meeting'},{t:'Apr 18, 03:00 PM',a:'Updated group roster — removed inactive member'}].map((l,i)=>(
              <div key={i} style={{display:'flex',gap:10,padding:'9px 0',borderBottom:'1px solid #f3f4f6'}}>
                <span style={{fontSize:11,color:'#9ca3af',flexShrink:0,width:140}}>{l.t}</span>
                <span style={{fontSize:12}}>{l.a}</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-p" style={{flex:1}} onClick={()=>window.location.href='/dashboard/messages'}><FontAwesomeIcon icon={faComment} className="mr-1.5"/>Send Message</button>
            <button className="btn btn-g" style={{flex:1}} onClick={()=>setSelected(null)}>Close</button>
          </div>
        </div>
      </div>}

      {showAssign&&<div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowAssign(false)}>
        <div className="modal">
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}>Assign New Coordinator</h3>
          <div className="fg"><label>Full Name</label><input placeholder="Coordinator's full name"/></div>
          <div className="fg"><label>Mobile</label><input placeholder="+91 98765 43210"/></div>
          <div className="fg"><label>Email</label><input type="email" placeholder="coordinator@email.com"/></div>
          <div className="fg"><label>Assign to Group</label>
            <select><option>-- Select Group --</option>{['Delhi NCR Elite','Delhi Central','Delhi North','Delhi South','Noida Business','Gurgaon Leaders','New Group'].map(g=><option key={g}>{g}</option>)}</select>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-p" style={{flex:1}} onClick={()=>{alert('✅ Coordinator assigned! Login credentials sent via email.');setShowAssign(false)}}>Assign & Notify</button>
            <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowAssign(false)}>Cancel</button>
          </div>
        </div>
      </div>}
    </div>
  )
}
