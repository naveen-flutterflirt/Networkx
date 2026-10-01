'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSackDollar, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'

// Delhi Territory — 245 members × ₹1,50,000/yr = ₹367.5L/yr = ₹30.6L/month
const GROUPS_FINANCE = [
  {name:'Delhi NCR Elite',members:55,monthly:687500,pct:22},
  {name:'Delhi Central',members:48,monthly:600000,pct:20},
  {name:'Delhi North',members:42,monthly:525000,pct:17},
  {name:'Delhi South',members:38,monthly:475000,pct:16},
  {name:'Noida Business',members:34,monthly:425000,pct:14},
  {name:'Gurgaon Leaders',members:28,monthly:350000,pct:11},
]

export default function FranchiseFinancePage() {
  const totalMembers = GROUPS_FINANCE.reduce((a,g)=>a+g.members,0) // 245
  const monthlyCollection = totalMembers * 150000 / 12  // ₹30,62,500
  const hqRoyalty = Math.round(monthlyCollection * 0.15) // ₹4,59,375
  const netProfit = monthlyCollection - hqRoyalty         // ₹26,03,125
  const annualRevenue = totalMembers * 150000             // ₹3,67,50,000

  const fmt = (n:number) => `₹${(n/100000).toFixed(1)}L`

  return (
    <div className="page">
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:18,fontWeight:800}}>Finance</h2>
        <p style={{fontSize:13,color:'#9ca3af'}}>Delhi Territory · {totalMembers} members · ₹1,50,000/yr per member</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[
          {l:'Monthly Collections',v:fmt(monthlyCollection),c:'#10b981',sub:`${totalMembers} members × ₹12,500/mo`},
          {l:'HQ Royalty (15%)',v:fmt(hqRoyalty),c:'#6366f1',sub:'Remitted to NIA HQ'},
          {l:'Net to Franchise',v:fmt(netProfit),c:'#ff4b0a',sub:'After HQ royalty'},
          {l:'Annual Revenue',v:`₹${(annualRevenue/10000000).toFixed(2)}Cr`,c:'#f59e0b',sub:'₹1.5L × 245 members'},
        ].map(s=>(
          <div key={s.l} style={{background:`linear-gradient(135deg,${s.c},${s.c}cc)`,borderRadius:12,padding:'14px 16px',boxShadow:`0 2px 4px rgba(0,0,0,.35), 0 14px 32px -10px ${s.c}66, inset 0 1px 0 rgba(255,255,255,.18)`}}>
            <div style={{fontSize:22,fontWeight:800,color:'#fff'}}>{s.v}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.8)',marginTop:2}}>{s.l}</div>
            <div style={{fontSize:10,color:'rgba(255,255,255,.55)',marginTop:4}}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="alert-info" style={{marginBottom:16,display:'flex',gap:16}}>
        <div><strong>Yearly Plan:</strong> ₹1,50,000/yr per member</div>
        <div>|</div>
        <div><strong>3-Year Plan:</strong> ₹4,20,000 per member</div>
        <div>|</div>
        <div><strong>Monthly equivalent:</strong> ₹12,500/member</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:12}}><FontAwesomeIcon icon={faSackDollar} className="mr-1.5"/>Monthly Revenue by Group</div>
          {GROUPS_FINANCE.map(g=>(
            <div key={g.name} style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:600}}>{g.name}</span>
                <div style={{display:'flex',gap:10}}>
                  <span style={{fontSize:11,color:'#9ca3af'}}>{g.members} members</span>
                  <span style={{fontSize:12,fontWeight:700,color:'#10b981'}}>₹{(g.monthly/100000).toFixed(2)}L/mo</span>
                </div>
              </div>
              <div className="prog"><div className="prog-fill" style={{width:g.pct+'%'}}/></div>
            </div>
          ))}
          <div style={{marginTop:14,padding:'10px 12px',background:'rgba(255,255,255,.04)',borderRadius:8,display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:13,fontWeight:700}}>Total Monthly</span>
            <span style={{fontSize:13,fontWeight:700,color:'#10b981'}}>{fmt(monthlyCollection)}/mo</span>
          </div>
        </div>

        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:12}}><FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5"/>Outstanding Dues</div>
          {[
            {name:'Ajay Wadhwa',group:'Delhi Central',amt:'₹1,50,000',due:'45 days',plan:'Yearly'},
            {name:'Sunita Garg',group:'Delhi North',amt:'₹1,50,000',due:'30 days',plan:'Yearly'},
            {name:'Rohit Chauhan',group:'Delhi South',amt:'₹1,50,000',due:'60 days',plan:'Yearly'},
          ].map((d,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #f3f4f6'}}>
              <div>
                <div style={{fontSize:13,fontWeight:600}}>{d.name}</div>
                <div style={{fontSize:11,color:'#9ca3af'}}>{d.group} · {d.plan} · Overdue {d.due}</div>
              </div>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <span style={{fontSize:13,fontWeight:700,color:'#ef4444'}}>{d.amt}</span>
                <button className="btn btn-xs btn-g" onClick={()=>alert('Reminder sent to '+d.name)}>Remind</button>
              </div>
            </div>
          ))}
          <div style={{marginTop:12,padding:'10px 12px',background:'rgba(255,90,90,.1)',borderRadius:8,display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:13,fontWeight:700,color:'#ef4444'}}>Total Outstanding</span>
            <span style={{fontSize:13,fontWeight:700,color:'#ef4444'}}>₹4,50,000</span>
          </div>
        </div>
      </div>
    </div>
  )
}
