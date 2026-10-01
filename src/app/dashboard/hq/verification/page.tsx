'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faLocationDot } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react'
import { TrustAPI } from '@/lib/api'
import { Loading, ApiError, Empty } from '@/components/shared/States'

export default function VerificationQueuePage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busyId, setBusyId] = useState<string|null>(null)
  const [rejectReason, setRejectReason] = useState<{id:string, reason:string}|null>(null)

  const fetchAll = async () => {
    setLoading(true); setError('')
    try {
      const res = await TrustAPI.queue()
      setItems(res.items || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const approve = async (userId: string) => {
    setBusyId(userId)
    try {
      await TrustAPI.review(userId, { approve: true })
      setMsg('✅ Verification approved')
      setItems(items.filter(i => i.id !== userId))
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setBusyId(null) }
  }

  const reject = async (userId: string, reason: string) => {
    setBusyId(userId)
    try {
      await TrustAPI.review(userId, { approve: false, reason })
      setMsg('✅ Verification rejected')
      setItems(items.filter(i => i.id !== userId))
      setRejectReason(null)
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setBusyId(null) }
  }

  return (
    <div className="page">
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:18,fontWeight:800}}>Verification Queue</h2>
        <p style={{fontSize:13,color:'#9ca3af'}}>Members who've requested a verified checkmark — real approval, not automatic.</p>
      </div>

      {msg && (
        <div className="toast-in" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,marginBottom:12,fontSize:13,
          background:msg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
          color:msg.startsWith('✅')?'#16a34a':'#ef4444',
          border:`1px solid ${msg.startsWith('✅')?'rgba(39,216,109,.35)':'rgba(255,90,90,.35)'}`}}>
          {msg}<button style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}} onClick={()=>setMsg('')}>✕</button>
        </div>
      )}

      {loading ? <Loading label="Loading queue…"/> : error ? <ApiError message={error} onRetry={fetchAll}/> :
       items.length === 0 ? <Empty label="No pending verification requests"/> : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {items.map(item => (
            <div key={item.id} className="card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontWeight:700,fontSize:14}}>{item.name}</div>
                  <div style={{fontSize:12,color:'#9ca3af'}}>{item.profession || '—'}{item.company ? ` · ${item.company}` : ''}</div>
                  <div style={{fontSize:12,color:'#9ca3af'}}><FontAwesomeIcon icon={faLocationDot} className="mr-1.5"/>{item.city || '—'}</div>
                  {item.verification_note && (
                    <div style={{fontSize:12,color:'#cbd5e1',marginTop:8,background:'rgba(255,255,255,.04)',borderRadius:8,padding:'8px 10px'}}>
                      "{item.verification_note}"
                    </div>
                  )}
                </div>
                <div style={{display:'flex',gap:6,flexShrink:0}}>
                  <button className="btn btn-p btn-sm" disabled={busyId===item.id} onClick={()=>approve(item.id)}><FontAwesomeIcon icon={faCheck} className="mr-1.5"/>Approve</button>
                  <button className="btn btn-g btn-sm" style={{color:'#ef4444'}} disabled={busyId===item.id} onClick={()=>setRejectReason({id:item.id, reason:''})}>Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectReason && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setRejectReason(null)}>
          <div className="modal">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}>Reject Verification</h3>
            <div className="fg">
              <label>Reason (shown to member)</label>
              <textarea rows={3} value={rejectReason.reason} onChange={e=>setRejectReason({...rejectReason, reason:e.target.value})} placeholder="e.g. Please add more profile details first"/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p" style={{flex:1}} onClick={()=>reject(rejectReason.id, rejectReason.reason)}>Confirm Reject</button>
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setRejectReason(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
