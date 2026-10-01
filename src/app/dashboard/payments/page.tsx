'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileInvoice, faClock, faArrowsRotate } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react'
import { PaymentsAPI, TokenStore } from '@/lib/api'
import { Loading, ApiError, Empty } from '@/components/shared/States'
import { Pagination } from '@/components/shared/Pagination'
import { openRazorpayCheckout } from '@/lib/razorpay'

// Was 100% mock (hardcoded PAYMENTS from @/lib/data), a fake "PDF"
// button that just called alert(), and a disconnected fake checkout
// form (even a raw card-number/CVV input, wired to nothing). Rebuilt
// against the real backend: real history/stats, real Razorpay checkout
// on outstanding dues, real generated PDF invoices.

function describePayment(p: any): string {
  if (p.reference_type === 'membership') return `NetworkX Membership — ${(p.reference_id || p.plan || '').replace(/_/g,' ')}`
  if (p.reference_type === 'event') return p.notes || 'Event Registration'
  if (p.reference_type === 'merch_order') return p.notes || 'Store Order'
  return p.notes || p.plan || 'NetworkX Payment'
}

export default function PaymentsPage() {
  const me = TokenStore.getUser()
  const [history, setHistory] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState<number|null>(0)
  const [hasMore, setHasMore] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [outstanding, setOutstanding] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [downloadingId, setDownloadingId] = useState<string|null>(null)
  const [payingId, setPayingId] = useState<string|null>(null)

  const fetchAll = async (p = 1) => {
    setLoading(true); setError('')
    try {
      const [histRes, statsRes, outRes] = await Promise.all([
        PaymentsAPI.history({ page: p, page_size: 20 }),
        PaymentsAPI.stats().catch(() => null),
        PaymentsAPI.outstanding({ page: 1 }).catch(() => ({ items: [] })),
      ])
      setHistory(histRes.items || histRes || [])
      setTotal(histRes.total ?? null)
      setHasMore(histRes.has_more || false)
      setPage(p)
      setStats(statsRes)
      setOutstanding(outRes.items || outRes || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll(1) }, [])

  const downloadInvoice = async (paymentId: string) => {
    setDownloadingId(paymentId)
    try {
      await PaymentsAPI.downloadInvoice(paymentId)
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setDownloadingId(null) }
  }

  const payOutstanding = async (p: any) => {
    setPayingId(p.id)
    try {
      const order = await PaymentsAPI.createOrder({
        amount: p.amount, plan: p.plan, reference_type: p.reference_type, reference_id: p.reference_id,
      })
      openRazorpayCheckout({
        order,
        description: describePayment(p),
        memberName: me?.name, memberEmail: me?.email,
        onSuccess: () => { setMsg('✅ Payment successful!'); fetchAll(page) },
        onFailure: (e) => { setMsg('❌ ' + e.message) },
      })
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setPayingId(null) }
  }

  if (loading && history.length === 0) return <div className="page"><Loading label="Loading payment history…"/></div>
  if (error) return <div className="page"><ApiError message={error} onRetry={()=>fetchAll(page)}/></div>

  return (
    <div className="page">
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:18,fontWeight:800}}>Payments</h2>
        <p style={{fontSize:13,color:'#9ca3af'}}>Membership fees, events, and orders — real invoices, real history</p>
      </div>

      {msg && (
        <div style={{padding:'10px 14px',borderRadius:8,marginBottom:14,fontSize:13,
          background:msg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
          color:msg.startsWith('✅')?'#16a34a':'#ef4444',
          border:`1px solid ${msg.startsWith('✅')?'rgba(39,216,109,.35)':'rgba(255,90,90,.35)'}`}}>
          {msg}
        </div>
      )}

      {stats && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
          <div className="card" style={{textAlign:'center'}}><div className="stat-num" style={{fontSize:22,fontWeight:800,color:'#10b981'}}>₹{(stats.total_collected||0).toLocaleString()}</div><div style={{fontSize:12,color:'#9ca3af'}}>Total Paid</div></div>
          <div className="card" style={{textAlign:'center'}}><div className="stat-num" style={{fontSize:22,fontWeight:800,color:'#ef4444'}}>₹{(stats.pending_amount||0).toLocaleString()}</div><div style={{fontSize:12,color:'#9ca3af'}}>Pending</div></div>
          <div className="card" style={{textAlign:'center'}}><div className="stat-num" style={{fontSize:22,fontWeight:800,color:'#6366f1'}}>{stats.total_payments||0}</div><div style={{fontSize:12,color:'#9ca3af'}}>Invoices</div></div>
        </div>
      )}

      {outstanding.length > 0 && (
        <div style={{marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:8}}><FontAwesomeIcon icon={faClock} className="mr-1.5" style={{color:'#f59e0b'}}/>Outstanding Dues</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {outstanding.map((p:any)=>(
              <div key={p.id} className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{describePayment(p)}</div>
                  <div style={{fontSize:11,color:'#9ca3af'}}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontSize:15,fontWeight:700,color:'var(--nx-orange)'}}>₹{(p.amount||0).toLocaleString()}</span>
                  <button className="btn btn-p btn-sm" disabled={payingId===p.id} onClick={()=>payOutstanding(p)}>
                    {payingId===p.id ? 'Processing…' : 'Pay Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div style={{padding:'14px 16px',borderBottom:'1px solid var(--nx-line)',fontWeight:700,fontSize:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          Transaction History
          <button className="btn btn-g btn-sm" onClick={()=>fetchAll(page)}><FontAwesomeIcon icon={faArrowsRotate} className="mr-1.5"/>Refresh</button>
        </div>
        {history.length === 0 ? <Empty label="No payments yet"/> : (
          <table className="tbl">
            <thead><tr>{['Description','Amount','Method','Date','Status',''].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {history.map((p:any)=>(
                <tr key={p.id}>
                  <td>
                    <div style={{fontSize:13,fontWeight:500}}>{describePayment(p)}</div>
                    <span className="badge b-gray" style={{fontSize:10}}>{p.reference_type || 'general'}</span>
                  </td>
                  <td style={{fontWeight:700}}>₹{(p.amount||0).toLocaleString()}</td>
                  <td style={{fontSize:12,color:'#9ca3af',textTransform:'capitalize'}}>{p.payment_method || p.gateway || '—'}</td>
                  <td style={{fontSize:12,color:'#9ca3af'}}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                  <td><span className={`badge ${p.status==='success'?'b-green':p.status==='pending'?'b-yellow':'b-red'}`}>{p.status}</span></td>
                  <td>
                    {p.status === 'success' ? (
                      <button className="btn btn-xs btn-g" disabled={downloadingId===p.id} onClick={()=>downloadInvoice(p.id)}>
                        <FontAwesomeIcon icon={faFileInvoice} className="mr-1"/>{downloadingId===p.id ? '…' : 'PDF'}
                      </button>
                    ) : p.status === 'pending' ? (
                      <button className="btn btn-xs btn-p" disabled={payingId===p.id} onClick={()=>payOutstanding(p)}>Pay Now</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={page} pageSize={20} total={total} hasMore={hasMore} loading={loading} onPageChange={fetchAll}/>
    </div>
  )
}