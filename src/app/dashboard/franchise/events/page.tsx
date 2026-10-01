'use client'
import { useState } from 'react'

export default function FranchiseEventsPage() {
  const [showCreate, setShowCreate] = useState(false)

  const EVENTS = [
    {id:1,title:'Delhi Business Summit 2026',type:'City Mega Event',date:'May 15, 2026',time:'6:00 PM',venue:'Hotel Taj Mahal, New Delhi',capacity:300,registered:187,status:'upcoming',desc:'Annual city-level summit for all Delhi territory members, top performers and guest speakers.'},
    {id:2,title:'NIA Delhi Awards Night',type:'Award Night',date:'Jun 20, 2026',time:'7:00 PM',venue:'ITC Maurya, New Delhi',capacity:250,registered:0,status:'planning',desc:'Annual awards night celebrating top referrers, top group leaders and star performers across Delhi.'},
    {id:3,title:'Franchise Leader Circle — Q2',type:'Leader Circles',date:'May 5, 2026',time:'5:00 PM',venue:'The Oberoi, New Delhi',capacity:40,registered:32,status:'upcoming',desc:'Exclusive meeting for city partners and top performers to discuss strategy and growth.'},
    {id:4,title:'Delhi City Mixer — Spring Edition',type:'City Mixer',date:'Apr 5, 2026',time:'6:30 PM',venue:'Radisson Blu, Dwarka',capacity:150,registered:148,status:'completed',desc:'Spring networking mixer across all Delhi groups.'},
  ]

  return (
    <div className="page">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div><h2 style={{fontSize:18,fontWeight:800}}>Events Control</h2><p style={{fontSize:13,color:'#9ca3af'}}>City mega events, award nights and leader circles</p></div>
        <button className="btn btn-p" onClick={()=>setShowCreate(true)}>+ Create Event</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[{l:'Upcoming Events',v:2,c:'#6366f1'},{l:'Planning',v:1,c:'#f59e0b'},{l:'Total Registered',v:219,c:'#ff4b0a'},{l:'Completed',v:1,c:'#10b981'}].map(s=>(
          <div key={s.l} style={{background:`linear-gradient(135deg,${s.c},${s.c}cc)`,borderRadius:12,padding:'14px 12px',boxShadow:`0 2px 4px rgba(0,0,0,.35), 0 14px 32px -10px ${s.c}66, inset 0 1px 0 rgba(255,255,255,.18)`,textAlign:'center',}}><div style={{fontSize:22,fontWeight:800,color:'#fff'}}>{s.v}</div><div style={{fontSize:12,color:'rgba(255,255,255,.75)',marginTop:4}}>{s.l}</div></div>
        ))}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {EVENTS.map(e=>(
          <div key={e.id} className="card">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
              <div>
                <div style={{fontSize:15,fontWeight:700}}>{e.title}</div>
                <div style={{fontSize:12,color:'#9ca3af'}}>{e.date} · {e.time} · {e.venue}</div>
              </div>
              <div style={{display:'flex',gap:6,flexShrink:0}}>
                <span className="badge b-purple" style={{fontSize:10}}>{e.type}</span>
                <span className={`badge ${e.status==='upcoming'?'b-blue':e.status==='completed'?'b-gray':'b-yellow'}`}>{e.status}</span>
              </div>
            </div>
            <p style={{fontSize:12,color:'#6b7280',marginBottom:10}}>{e.desc}</p>
            {e.status!=='planning'&&<div style={{marginBottom:10}}>
              <div className="prog"><div className="prog-fill" style={{width:`${Math.round(e.registered/e.capacity*100)}%`,background:e.registered/e.capacity>0.9?'#ef4444':'#10b981'}}/></div>
              <div style={{fontSize:11,color:'#9ca3af',marginTop:3}}>{e.registered}/{e.capacity} registered ({Math.round(e.registered/e.capacity*100)}%)</div>
            </div>}
            <div style={{display:'flex',gap:6}}>
              {e.status==='upcoming'&&<>
                <button className="btn btn-p btn-sm" onClick={()=>alert('Opening event management...')}>Manage Event</button>
                <button className="btn btn-g btn-sm" onClick={()=>alert('Reminder sent to all groups!')}>📢 Send Reminder</button>
                <button className="btn btn-g btn-sm" onClick={()=>alert('Sharing event...')}>🔗 Share</button>
              </>}
              {e.status==='planning'&&<button className="btn btn-p btn-sm" onClick={()=>alert('Event published!')}>Publish Event</button>}
              {e.status==='completed'&&<button className="btn btn-g btn-sm" onClick={()=>alert('Downloading report...')}>📊 View Report</button>}
            </div>
          </div>
        ))}
      </div>

      {showCreate&&<div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowCreate(false)}>
        <div className="modal modal-lg">
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}>Create City Event</h3>
          <div className="fg"><label>Event Type</label>
            <select><option>City Mega Event</option><option>Award Night</option><option>Leader Circles</option><option>City Mixer</option><option>Training Workshop</option></select>
          </div>
          <div className="fg"><label>Event Title</label><input placeholder="e.g. Delhi Business Summit 2026"/></div>
          <div className="form-grid">
            <div className="fg"><label>Date</label><input type="date"/></div>
            <div className="fg"><label>Time</label><input type="time" defaultValue="18:00"/></div>
            <div className="fg"><label>Venue</label><input placeholder="Venue name and address"/></div>
            <div className="fg"><label>Capacity</label><input type="number" placeholder="Max attendees"/></div>
          </div>
          <div className="fg"><label>Description</label><textarea rows={3} placeholder="Event description and highlights..."/></div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-p" style={{flex:1}} onClick={()=>{alert('✅ Event created and published!');setShowCreate(false)}}>Create Event</button>
            <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      </div>}
    </div>
  )
}
