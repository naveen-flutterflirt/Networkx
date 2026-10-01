'use client'
import { useState, useEffect } from 'react'
import { MasterDataAPI } from '@/lib/api'
import { Loading, ApiError } from '@/components/shared/States'

const TYPE_LABELS: Record<string,string> = {
  country: 'Countries', course_category: 'Course Categories',
  business_category: 'Business Categories', deal_category: 'Deals Corner Categories',
}

export default function MasterDataPage() {
  const [types, setTypes] = useState<any[]>([])
  const [selected, setSelected] = useState<string|null>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [newValue, setNewValue] = useState('')

  const fetchTypes = async () => {
    setLoading(true); setError('')
    try {
      const res = await MasterDataAPI.allTypes()
      setTypes(res.items || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTypes() }, [])

  const openType = async (listType: string) => {
    setSelected(listType); setItemsLoading(true)
    try {
      const res = await MasterDataAPI.get(listType)
      setItems(res.items || [])
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setItemsLoading(false) }
  }

  const addItem = async () => {
    if (!newValue.trim() || !selected) return
    try {
      await MasterDataAPI.createItem({ list_type: selected, value: newValue.trim() })
      setNewValue('')
      openType(selected)
      fetchTypes()
    } catch (e: any) { setMsg('❌ ' + e.message) }
  }

  const retireItem = async (id: string) => {
    if (!confirm('Retire this option? It stays on any existing records, just stops being offered going forward.')) return
    try {
      await MasterDataAPI.retireItem(id)
      if (selected) openType(selected)
      fetchTypes()
    } catch (e: any) { setMsg('❌ ' + e.message) }
  }

  return (
    <div className="page">
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:18,fontWeight:800}}>Master Data</h2>
        <p style={{fontSize:13,color:'#9ca3af'}}>Countries, categories and other dropdown lists used across the app — edit here, no code deploy needed.</p>
      </div>

      {msg && (
        <div className="toast-in" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,marginBottom:12,fontSize:13,color:'#ef4444',background:'rgba(255,90,90,.1)',border:'1px solid rgba(255,90,90,.35)'}}>
          {msg}<button style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}} onClick={()=>setMsg('')}>✕</button>
        </div>
      )}

      {loading ? <Loading label="Loading…"/> : error ? <ApiError message={error} onRetry={fetchTypes}/> : (
        <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:20}}>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {types.map(t=>(
              <button key={t.list_type} onClick={()=>openType(t.list_type)}
                style={{textAlign:'left',padding:'10px 14px',borderRadius:10,border:'1px solid var(--nx-line)',cursor:'pointer',fontSize:13,
                  background:selected===t.list_type?'rgba(255,75,10,.1)':'var(--nx-panel)',
                  color:selected===t.list_type?'var(--nx-orange)':'var(--nx-ink)'}}>
                <div style={{fontWeight:600}}>{TYPE_LABELS[t.list_type] || t.list_type}</div>
                <div style={{fontSize:11,color:'#9ca3af'}}>{t.active} active{t.total>t.active ? `, ${t.total-t.active} retired` : ''}</div>
              </button>
            ))}
          </div>

          <div>
            {!selected ? (
              <div style={{fontSize:13,color:'#9ca3af'}}>Select a list on the left to view and edit its options.</div>
            ) : itemsLoading ? <Loading label="Loading options…"/> : (
              <div className="card">
                <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>{TYPE_LABELS[selected] || selected}</div>
                <div style={{display:'flex',gap:8,marginBottom:16}}>
                  <input value={newValue} onChange={e=>setNewValue(e.target.value)} placeholder="Add a new option…" onKeyDown={e=>e.key==='Enter' && addItem()}/>
                  <button className="btn btn-p btn-sm" onClick={addItem} disabled={!newValue.trim()}>+ Add</button>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {items.map(item=>(
                    <div key={item.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',borderRadius:8,background:'rgba(255,255,255,.04)',fontSize:13}}>
                      <span>{item.label}</span>
                      <button className="btn btn-xs btn-g" style={{color:'#ef4444'}} onClick={()=>retireItem(item.id)}>Retire</button>
                    </div>
                  ))}
                  {items.length===0 && <div style={{fontSize:12,color:'#9ca3af'}}>No active options</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
