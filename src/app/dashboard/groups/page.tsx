'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrophy } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import { GROUPS } from '@/lib/data'

export default function GroupsPage() {
  const [selected, setSelected] = useState<typeof GROUPS[0]|null>(null)
  const [groupTab, setGroupTab] = useState('roster')
  return (
    <div className="page">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div><h2 style={{fontSize:18,fontWeight:800}}>Groups</h2><p style={{fontSize:13,color:'#9ca3af'}}>142 active groups across 28 cities</p></div>
        <button className="btn btn-p">+ Request New Group</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[{l:'Total Groups',v:142,c:'#6366f1'},{l:'Total Members',v:'12,480',c:'#ff4b0a'},{l:'Avg Attendance',v:'81%',c:'#10b981'},{l:'Open Seats',v:284,c:'#f59e0b'}].map(s=>(
          <div key={s.l} style={{background:`linear-gradient(135deg,${s.c},${s.c}cc)`,borderRadius:12,padding:'14px 12px',boxShadow:`0 2px 4px rgba(0,0,0,.35), 0 14px 32px -10px ${s.c}66, inset 0 1px 0 rgba(255,255,255,.18)`,textAlign:'center',}}><div style={{fontSize:22,fontWeight:800,color:'#fff'}}>{s.v}</div><div style={{fontSize:12,color:'rgba(255,255,255,.75)',marginTop:4}}>{s.l}</div></div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
        {GROUPS.map(g=>(
          <div key={g.id} className="card" style={{cursor:'pointer'}} onClick={()=>setSelected(g)}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div>
                <div style={{fontSize:15,fontWeight:700}}>{g.name}</div>
                <div style={{fontSize:12,color:'#9ca3af'}}>{g.city}, {g.state} · {g.category}</div>
              </div>
              <span className={`badge ${g.status==='active'?'b-green':'b-yellow'}`}>{g.status}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12}}>
              {[{l:'Members',v:`${g.members}/${g.capacity}`},{l:'Meetings',v:g.meetings},{l:'Attendance',v:`${g.attendance}%`},{l:'Open Seats',v:g.openSeats}].map(s=>(
                <div key={s.l} style={{textAlign:'center',background:'rgba(255,255,255,.04)',borderRadius:8,padding:'8px 4px'}}>
                  <div style={{fontWeight:700,fontSize:14}}>{s.v}</div>
                  <div style={{fontSize:10,color:'#9ca3af'}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{marginBottom:10}}>
              <div className="prog"><div className="prog-fill" style={{width:`${Math.round(g.members/g.capacity*100)}%`}}/></div>
              <div style={{fontSize:10,color:'#9ca3af',marginTop:3}}>{g.members} of {g.capacity} seats filled</div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#6b7280'}}>
              <span><FontAwesomeIcon icon={faTrophy} className="mr-1.5"/>{g.director}</span>
              <span style={{fontWeight:600,color:'#10b981'}}>{g.revenue}</span>
            </div>
          </div>
        ))}
      </div>

      {selected&&<div className="overlay" onClick={e=>e.target===e.currentTarget&&setSelected(null)}>
        <div className="modal modal-lg">
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
            <h3 style={{fontSize:17,fontWeight:700}}>{selected.name}</h3>
            <span className={`badge ${selected.status==='active'?'b-green':'b-yellow'}`}>{selected.status}</span>
          </div>
          <div className="tab-bar">
            {[{id:'roster',l:'Member Roster'},{id:'attendance',l:'Attendance Leaderboard'},{id:'categories',l:'Category Seats'},{id:'leadership',l:'Leadership Team'}].map(t=>(
              <button key={t.id} className={`tab-btn${groupTab===t.id?' active':''}`} onClick={()=>setGroupTab(t.id)}>{t.l}</button>
            ))}
          </div>
          {groupTab==='roster'&&<div>
            {['Arjun Mehta – Manufacturer','Neha Tiwari – Digital Marketing','Anita Rao – CA','Ravi Kumar – IT Services','Rohit Verma – Logistics','Deepa Nair – Legal'].map((m,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f3f4f6',fontSize:13}}>
                <span>{m}</span><span className="badge b-green">Active</span>
              </div>
            ))}
          </div>}
          {groupTab==='attendance'&&<div>
            {[{name:'Anita Rao',pct:100},{name:'Ravi Kumar',pct:96},{name:'Arjun Mehta',pct:92},{name:'Neha Tiwari',pct:88},{name:'Deepa Nair',pct:85}].map((m,i)=>(
              <div key={i} style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:600}}>{m.name}</span><span style={{fontSize:12,fontWeight:700,color:'#10b981'}}>{m.pct}%</span>
                </div>
                <div className="prog"><div className="prog-fill" style={{width:m.pct+'%',background:m.pct>=90?'#10b981':m.pct>=70?'#f59e0b':'#ef4444'}}/></div>
              </div>
            ))}
          </div>}
          {groupTab==='categories'&&<div>
            {selected.categories.map((cat,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f3f4f6',fontSize:12}}>
                <span style={{fontWeight:500}}>{cat}</span>
                <span className={`badge ${i<8?'b-red':'b-green'}`}>{i<8?'Filled':'Open'}</span>
              </div>
            ))}
          </div>}
          {groupTab==='leadership'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[['Director',selected.director],['Established',selected.established],['City',selected.city+', '+selected.state],['Revenue',selected.revenue],['Total Meetings',selected.meetings]].map(([k,v])=>(
              <div key={k}><div style={{fontSize:11,color:'#9ca3af'}}>{k}</div><div style={{fontSize:13,fontWeight:600}}>{v}</div></div>
            ))}
          </div>}
          <div style={{display:'flex',gap:8,marginTop:14}}>
            <button className="btn btn-p" style={{flex:1}}>Join This Group</button>
            <button className="btn btn-g" style={{flex:1}} onClick={()=>setSelected(null)}>Close</button>
          </div>
        </div>
      </div>}
    </div>
  )
}
