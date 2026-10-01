'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import { CHAPTERS } from '@/lib/mockData'
const STATUS_CLS: Record<string,string> = {active:'bgn',new:'byl'}
export default function ChaptersPage() {
  const [selected, setSelected] = useState<typeof CHAPTERS[0]|null>(null)
  return (
    <div style={{padding:22,width:'100%'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div><h2 style={{fontSize:18,fontWeight:800}}>Chapters</h2><p style={{fontSize:13,color:'#9ca3af'}}>142 active chapters across 28 cities</p></div>
        <button className="btn btn-p">+ Request New Chapter</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:16}}>
        {[{l:'Total Chapters',v:142,c:'#6366f1'},{l:'Total Members',v:'12,480',c:'#ff4b0a'},{l:'Avg Attendance',v:'81%',c:'#10b981'},{l:'New This Month',v:3,c:'#f59e0b'}].map(s=><div key={s.l} className="card" style={{textAlign:'center'}}>
          <div style={{fontSize:24,fontWeight:800,color:s.c}}>{s.v}</div>
          <div style={{fontSize:12,color:'#9ca3af',marginTop:4}}>{s.l}</div>
        </div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
        {CHAPTERS.map(c=><div key={c.id} className="card card-hover" style={{cursor:'pointer'}} onClick={()=>setSelected(c)}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div><div style={{fontSize:15,fontWeight:700}}>{c.name}</div><div style={{fontSize:12,color:'#9ca3af'}}>{c.city}, {c.state} · {c.category}</div></div>
            <span className={`badge ${STATUS_CLS[c.status]||'bg'}`}>{c.status}</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12}}>
            {[{l:'Members',v:`${c.members}/${c.capacity}`},{l:'Meetings',v:c.meetings},{l:'Attendance',v:`${c.attendance}%`},{l:'Open Seats',v:c.openSeats}].map(s=><div key={s.l} style={{textAlign:'center',background:'#f9f9f9',borderRadius:8,padding:'8px 4px'}}>
              <div style={{fontWeight:700,fontSize:14}}>{s.v}</div>
              <div style={{fontSize:10,color:'#9ca3af'}}>{s.l}</div>
            </div>)}
          </div>
          <div style={{marginBottom:8}}><div className="prog"><div className="prog-fill" style={{width:`${Math.round(c.members/c.capacity*100)}%`}}/></div><div style={{fontSize:10,color:'#9ca3af',marginTop:3}}>{c.members} of {c.capacity} seats filled</div></div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#6b7280'}}>
            <span><FontAwesomeIcon icon={faUser} className="mr-1.5"/>{c.coordinator}</span><span style={{fontWeight:600,color:'#10b981'}}>{c.revenue} revenue</span>
          </div>
        </div>)}
      </div>
      {selected&&<div className="overlay" onClick={e=>e.target===e.currentTarget&&setSelected(null)}>
        <div className="modal">
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><h3 style={{fontSize:17,fontWeight:700}}>{selected.name}</h3><span className={`badge ${STATUS_CLS[selected.status]||'bg'}`}>{selected.status}</span></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
            {[['City',selected.city],['State',selected.state],['Coordinator',selected.coordinator],['President',selected.president],['Members',`${selected.members} / ${selected.capacity}`],['Open Seats',selected.openSeats],['Meetings Held',selected.meetings],['Attendance',`${selected.attendance}%`],['Est.',selected.established],['Revenue',selected.revenue]].map(([k,v])=><div key={k}><div style={{fontSize:11,color:'#9ca3af'}}>{k}</div><div style={{fontSize:13,fontWeight:600}}>{v}</div></div>)}
          </div>
          <div style={{display:'flex',gap:8}}><button className="btn btn-p" style={{flex:1}}>Join This Chapter</button><button className="btn btn-g" style={{flex:1}} onClick={()=>setSelected(null)}>Close</button></div>
        </div>
      </div>}
    </div>
  )
}
