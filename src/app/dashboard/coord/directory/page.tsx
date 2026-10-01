'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPrint, faMobileScreen, faUpload } from '@fortawesome/free-solid-svg-icons'

const ROSTER = [
  {name:'Rohit Arora',cat:'Real Estate',mobile:'+91 98765 11111',since:'09/2019'},
  {name:'Vijay Mehta',cat:'IT Services',mobile:'+91 98765 22222',since:'01/2020'},
  {name:'Sunita Verma',cat:'Finance',mobile:'+91 98765 33333',since:'03/2020'},
  {name:'Aakash Gupta',cat:'Manufacturing',mobile:'+91 98765 44444',since:'06/2020'},
  {name:'Priya Khanna',cat:'Retail',mobile:'+91 98765 55555',since:'09/2020'},
  {name:'Deepak Jain',cat:'Logistics',mobile:'+91 98765 66666',since:'01/2021'},
  {name:'Kavya Sharma',cat:'Legal',mobile:'+91 98765 77777',since:'03/2021'},
  {name:'Nitin Sood',cat:'Healthcare',mobile:'+91 98765 88888',since:'06/2021'},
]

export default function CoordDirectoryPage() {
  return (
    <div className="page">
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:18,fontWeight:800}}>Directory & Roster</h2>
        <p style={{fontSize:13,color:'#9ca3af'}}>Group roster, member details and download/share options</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:20}}>
        {/* Quick Actions — exactly like real product */}
        <div className="card" style={{height:'fit-content'}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Quick Actions</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <button className="btn" style={{background:'#1e3a5f',color:'#fff',padding:'12px',fontSize:13,display:'flex',alignItems:'center',gap:8}} onClick={()=>alert('Downloading Group PDF...')}>
              <FontAwesomeIcon icon={faPrint} className="mr-1.5"/>Download Group PDF
            </button>
            <button className="btn btn-g" style={{padding:'12px',fontSize:13,color:'#25D366',borderColor:'#25D366',display:'flex',alignItems:'center',gap:8}} onClick={()=>alert('Sharing via WhatsApp...')}>
              <FontAwesomeIcon icon={faMobileScreen} className="mr-1.5"/>Share via WhatsApp
            </button>
            <button className="btn btn-g" style={{padding:'12px',fontSize:13,color:'var(--nx-orange)',borderColor:'var(--nx-orange)',display:'flex',alignItems:'center',gap:8}} onClick={()=>alert('Exporting to Excel...')}>
              <FontAwesomeIcon icon={faUpload} className="mr-1.5"/>Export to Excel
            </button>
          </div>
        </div>

        {/* Roster table */}
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <div style={{padding:'14px 20px',fontWeight:700,fontSize:14,borderBottom:'1px solid #f3f4f6'}}>Group Roster — Delhi NCR Elite</div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Mobile</th>
                <th>Since</th>
              </tr>
            </thead>
            <tbody>
              {ROSTER.map((m,i)=>(
                <tr key={i}>
                  <td style={{fontWeight:600}}>{m.name}</td>
                  <td style={{fontWeight:600}}>{m.cat}</td>
                  <td style={{fontSize:12}}>{m.mobile}</td>
                  <td style={{fontSize:12,color:'#9ca3af'}}>{m.since}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
