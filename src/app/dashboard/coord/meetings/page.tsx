'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsRotate, faCalendarDays, faClipboard, faMicrophone, faMobileScreen, faRotateLeft,
  faCircleCheck, faClock, faPause, faPlay } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'

export default function CoordMeetingsPage() {
  const [tab, setTab] = useState('upcoming')
  const [showCreate, setShowCreate] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const MEETINGS = [
    {id:1,date:'Apr 28, 2026',time:'7:30 PM',venue:'Hotel Taj Mahal, New Delhi',type:'Monthly NLN',confirmed:38,capacity:42,visitors:3,status:'upcoming',
     agenda:['7:30 PM – Roll Call & QR Attendance','7:45 PM – Member Spotlight — Suresh Reddy','8:00 PM – Referral Round (20 min)','8:20 PM – Visitor Introductions','8:35 PM – Education Slot','8:50 PM – Announcements & Close'],
     speakers:['Rohit Arora — Member Spotlight'],visitorSlots:3},
    {id:2,date:'Mar 31, 2026',time:'7:30 PM',venue:'Hotel Taj Mahal, New Delhi',type:'Monthly NLN',confirmed:40,capacity:42,visitors:2,status:'completed',referrals:14,agenda:[],speakers:[],visitorSlots:0},
  ]

  const [typeFilter, setTypeFilter] = useState('All')
  const MTYPES = ['All','Monthly NLN','VIBE Meet','HotSeat Meet','Inter-State Meet']

  return (
    <div className="page">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div><h2 style={{fontSize:18,fontWeight:800}}>Meeting Control</h2><p style={{fontSize:13,color:'#9ca3af'}}>Create, manage and run monthly NLN meetings</p></div>
        <button className="btn btn-p" onClick={()=>setShowCreate(true)}>+ Create Meeting</button>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        {MTYPES.map(t=>(
          <button key={t} onClick={()=>setTypeFilter(t)}
            style={{padding:'6px 14px',borderRadius:100,border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:600,
              background:typeFilter===t?'var(--nx-orange)':'var(--nx-line)',color:typeFilter===t?'#fff':'#cbd5e1',transition:'all .15s'}}>
            {t}
          </button>
        ))}
      </div>
      <div className="tab-bar">
        {[{id:'upcoming',l:'Upcoming'},{id:'past',l:'Past Meetings'},{id:'live',l:'🔴 Live Meeting'}].map(t=>(
          <button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>{t.l}</button>
        ))}
      </div>

      {(tab==='upcoming'||tab==='past')&&MEETINGS.filter(m=>tab==='upcoming'?m.status==='upcoming':m.status==='completed').map(m=>(
        <div key={m.id} className="card" style={{marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
            <div>
              <div style={{fontSize:15,fontWeight:700}}>{m.type} — Delhi NCR Elite</div>
              <div style={{fontSize:12,color:'#9ca3af'}}>{m.date} · {m.time} · {m.venue}</div>
            </div>
            <span className={`badge ${m.status==='upcoming'?'b-blue':'b-gray'}`}>{m.status}</span>
          </div>
          {m.agenda.length>0&&<div style={{marginBottom:12}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:8}}><FontAwesomeIcon icon={faClipboard} className="mr-1.5"/>Agenda</div>
            <ol style={{paddingLeft:16}}>{m.agenda.map((a,i)=><li key={i} style={{fontSize:12,color:'#cbd5e1',marginBottom:3}}>{a}</li>)}</ol>
          </div>}
          {m.speakers.length>0&&<div style={{marginBottom:10}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:6}}><FontAwesomeIcon icon={faMicrophone} className="mr-1.5"/>Speaker Slots</div>
            {m.speakers.map((s,i)=><div key={i} style={{fontSize:12,color:'#cbd5e1',padding:'4px 0',borderBottom:'1px solid #f3f4f6'}}>{s}</div>)}
            <button className="btn btn-g btn-xs" style={{marginTop:6}} onClick={()=>alert('Speaker slot added!')}>+ Add Speaker</button>
          </div>}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div className="prog" style={{flex:1,marginRight:10}}><div className="prog-fill" style={{width:`${Math.round(m.confirmed/m.capacity*100)}%`}}/></div>
            <span style={{fontSize:12,color:'#9ca3af',flexShrink:0}}>{m.confirmed}/{m.capacity} · {m.visitors} visitors</span>
          </div>
          {m.status==='upcoming'&&<div style={{display:'flex',gap:8}}>
            <button className="btn btn-p btn-sm" onClick={()=>setTab('live')}>🔴 Start Live Meeting</button>
            <button className="btn btn-g btn-sm" onClick={()=>setShowQR(true)}><FontAwesomeIcon icon={faMobileScreen} className="mr-1.5"/>QR Attendance</button>
            <button className="btn btn-g btn-sm" onClick={()=>alert('Visitor registration form!')}>👤 Register Visitor</button>
            <button className="btn btn-g btn-sm" onClick={()=>alert('Agenda updated!')}>📋 Edit Agenda</button>
          </div>}
          {m.status==='completed'&&<div style={{fontSize:12,color:'#10b981',fontWeight:600}}><FontAwesomeIcon icon={faCircleCheck} className="mr-1"/>Completed — {(m as any).referrals} referrals exchanged</div>}
        </div>
      ))}

      {tab==='live'&&(
        <div>
          <div className="alert-danger" style={{marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>🔴 <strong>Live Meeting Active</strong> — Delhi NCR Elite Monthly NLN · Apr 28, 2026</span>
            <button className="btn btn-xs btn-g" style={{color:'#ef4444'}} onClick={()=>setTab('upcoming')}>End Meeting</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:16}}>
            {[{l:'Present',v:38,c:'#10b981'},{l:'Absent',v:4,c:'#ef4444'},{l:'Visitors',v:3,c:'#f59e0b'}].map(s=>(
              <div key={s.l} className="stat-card"><div style={{fontSize:28,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:12,color:'#9ca3af',marginTop:4}}>{s.l}</div></div>
            ))}
          </div>
          {/* Meeting Timer */}
          <div className="card" style={{marginBottom:16,textAlign:'center'}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:12}}><FontAwesomeIcon icon={faClock} className="mr-1.5"/>Meeting Timer</div>
            <div style={{fontSize:52,fontWeight:800,color:'var(--nx-orange)',fontFamily:'monospace',marginBottom:12}}>
              {String(Math.floor(timer/60)).padStart(2,'0')}:{String(timer%60).padStart(2,'0')}
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'center'}}>
              <button className="btn btn-p" onClick={()=>{setTimerActive(!timerActive);if(!timerActive){const iv=setInterval(()=>setTimer(t=>{if(t>=3600){clearInterval(iv);return t}return t+1}),1000)}}}>
                {timerActive?<><FontAwesomeIcon icon={faPause} className="mr-1"/>Pause</>:<><FontAwesomeIcon icon={faPlay} className="mr-1"/>Start</>}
              </button>
              <button className="btn btn-g" onClick={()=>{setTimer(0);setTimerActive(false)}}><FontAwesomeIcon icon={faRotateLeft} className="mr-1.5"/>Reset</button>
              {['5 min','10 min','20 min'].map(t=>(
                <button key={t} className="btn btn-g btn-sm" onClick={()=>setTimer(parseInt(t)*60)}>Set {t}</button>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="card">
              <div style={{fontWeight:700,fontSize:14,marginBottom:12}}><FontAwesomeIcon icon={faClipboard} className="mr-1.5"/>Agenda Progress</div>
              {['Roll Call & QR Attendance','Member Spotlight — Suresh Reddy','Referral Round','Visitor Introductions','Education Slot','Announcements & Close'].map((a,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:'1px solid #f3f4f6'}}>
                  <input type="checkbox" style={{width:'auto'}}/>
                  <span style={{fontSize:12}}>{a}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{fontWeight:700,fontSize:14,marginBottom:12}}><FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5"/>Referrals Given Today</div>
              {[{from:'Suresh Reddy',to:'Meena Iyer',title:'CA audit needed',val:'₹25K'},{from:'Vikram Shah',to:'Ravi Kumar',title:'IT setup for office',val:'₹80K'},{from:'Priya Nair',to:'Anand Pillai',title:'Legal contract review',val:'₹15K'}].map((r,i)=>(
                <div key={i} style={{fontSize:12,padding:'8px 0',borderBottom:'1px solid #f3f4f6'}}>
                  <div style={{fontWeight:600}}>{r.title}</div>
                  <div style={{color:'#9ca3af'}}>{r.from} → {r.to} · {r.val}</div>
                </div>
              ))}
              <button className="btn btn-p btn-sm" style={{marginTop:8,width:'100%'}} onClick={()=>alert('Referral recorded!')}>+ Record Referral</button>
            </div>
          </div>
        </div>
      )}

      {showQR&&<div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowQR(false)}>
        <div className="modal" style={{textAlign:'center'}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:12}}><FontAwesomeIcon icon={faMobileScreen} className="mr-1.5"/>QR Attendance</h3>
          <div style={{width:180,height:180,background:'rgba(255,255,255,.06)',borderRadius:12,margin:'0 auto 12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#9ca3af',border:'2px dashed #e5e7eb'}}>QR Code<br/>April 28 Meeting</div>
          <div style={{fontSize:12,color:'#9ca3af',marginBottom:16}}>Members scan to auto mark attendance</div>
          <div style={{display:'flex',gap:8,justifyContent:'center'}}>
            <button className="btn btn-p btn-sm" onClick={()=>alert('QR downloaded!')}>📥 Download</button>
            <button className="btn btn-g btn-sm" onClick={()=>alert('Shared on WhatsApp!')}>💬 Share WhatsApp</button>
            <button className="btn btn-g btn-sm" onClick={()=>setShowQR(false)}>Close</button>
          </div>
        </div>
      </div>}

      {showCreate&&<div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowCreate(false)}>
        <div className="modal modal-lg">
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}><FontAwesomeIcon icon={faCalendarDays} className="mr-1.5"/>Create Meeting</h3>
          <div className="form-grid">
            <div className="fg"><label>Meeting Type</label><select><option>Monthly NLN</option><option>VIBE Meet</option><option>HotSeat Meet</option><option>Inter-State Meet</option><option>Emergency Meeting</option><option>Special Event</option></select></div>
            <div className="fg"><label>Date</label><input type="date"/></div>
            <div className="fg"><label>Time</label><input type="time" defaultValue="19:30"/></div>
            <div className="fg"><label>Venue</label><input defaultValue="Hotel Taj Mahal, New Delhi"/></div>
            <div className="fg"><label>Capacity</label><input type="number" defaultValue="42"/></div>
            <div className="fg"><label>Visitor Slots</label><input type="number" defaultValue="3"/></div>
          </div>
          <div className="fg"><label>Agenda (one item per line)</label>
            <textarea rows={5} defaultValue="7:30 PM – Roll Call & QR Attendance&#10;7:45 PM – Member Spotlight&#10;8:00 PM – Referral Round&#10;8:20 PM – Visitor Introductions&#10;8:35 PM – Education Slot&#10;8:50 PM – Announcements & Close"/>
          </div>
          <div className="fg"><label>Speaker Slot</label><input placeholder="Member name — Topic"/></div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-p" style={{flex:1}} onClick={()=>{alert('✅ Meeting created! Members notified via app + WhatsApp.');setShowCreate(false)}}>Create & Notify</button>
            <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      </div>}
    </div>
  )
}
