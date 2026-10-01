'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faClipboard, faPhone, faBuilding, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BizHubAPI, TokenStore } from '@/lib/api'
import PageHero from '@/components/shared/PageHero'

const REQUIREMENT_TYPES = [
  'Need CA / Accountant','Need Lawyer / Legal',
  'Need Website / App Dev','Need Vendor / Supplier','Hiring Staff',
  'Need Marketing Agency','Need HR Consultant',
  'Office Space','Equipment','Other'
]
const URGENCY_COLORS: Record<string,string> = { High:'#ef4444', Medium:'#f59e0b', Low:'#9ca3af' }
const CITIES = ['Delhi','Mumbai','Bangalore','Pune','Hyderabad','Chennai','Kolkata','Ahmedabad','Surat','Jaipur','Bhopal','Other']
const RETIRED_REQUIREMENT_TYPES = ['Need Investor / Funding', 'Partnership / JV']

// Defined OUTSIDE BizHubPage (not nested inside it) so React treats it as a
// stable component reference across re-renders. It was previously declared
// inside BizHubPage, which recreated the component — and remounted its
// inputs — on every keystroke, causing the Title/Budget/Description fields
// to lose focus after each character typed (same bug class as the earlier
// Travel Connect fix).
const ListingForm = ({ data, onChange }: { data: any, onChange: (d: any) => void }) => (
  <>
    <div className="fg">
      <label>Title *</label>
      <input value={data.title||''} onChange={e=>onChange({...data,title:e.target.value})} placeholder="e.g. Need CA for GST Audit"/>
    </div>
    <div className="form-grid">
      <div className="fg"><label>Type of Requirement</label>
        <select value={data.type||''} onChange={e=>onChange({...data,type:e.target.value})}>
          {REQUIREMENT_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="fg"><label>City</label>
        <select value={data.city||'Delhi'} onChange={e=>onChange({...data,city:e.target.value})}>
          {CITIES.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="fg"><label>Budget / Range</label>
        <input value={data.budget||''} onChange={e=>onChange({...data,budget:e.target.value})} placeholder="₹25,000 or ₹10,000/month"/>
      </div>
      <div className="fg"><label>Urgency</label>
        <select value={data.urgency||'Medium'} onChange={e=>onChange({...data,urgency:e.target.value})}>
          {['High','Medium','Low'].map(u=><option key={u}>{u}</option>)}
        </select>
      </div>
      <div className="fg"><label>Preferred Contact</label>
        <select value={data.contact_preference||'Through Platform'} onChange={e=>onChange({...data,contact_preference:e.target.value})}>
          {['Through Platform','Phone Call','WhatsApp','Email','Meeting'].map(c=><option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="fg">
        <label style={{display:'flex',alignItems:'center',gap:8}}>
          <input type="checkbox" checked={data.is_anonymous||false} onChange={e=>onChange({...data,is_anonymous:e.target.checked})}/>
          Post Anonymously
        </label>
        <div style={{fontSize:11,color:'#9ca3af',marginTop:3}}>Your name won't be shown publicly</div>
      </div>
    </div>
    <div className="fg">
      <label>Description *</label>
      <textarea rows={4} value={data.description||''} onChange={e=>onChange({...data,description:e.target.value})}
        placeholder="Describe your requirement in detail — what exactly do you need, timeline, specific qualifications expected…"/>
    </div>
  </>
)

export default function BizHubPage() {
  const router = useRouter()
  const [listings, setListings] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [msg,      setMsg]      = useState('')
  const [filter,   setFilter]   = useState('')
  const [page,     setPage]     = useState(1)
  const [hasMore,  setHasMore]  = useState(false)
  const [selected, setSelected] = useState<any|null>(null)
  const [editing,  setEditing]  = useState<any|null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [response, setResponse] = useState('')

  const me = TokenStore.getUser()

  useEffect(() => {
    if (me?.role === 'member') router.replace('/dashboard/opportunities')
  }, [me?.role, router])

  const emptyForm = {
    title:'', type:'Need CA / Accountant', city:'Delhi', budget:'',
    urgency:'Medium', description:'', contact_preference:'Through Platform',
    is_anonymous: false
  }
  const [form, setForm] = useState(emptyForm)

  const fetchListings = async (p = 1) => {
    setLoading(true); setError('')
    try {
      const res = await BizHubAPI.list({ category: filter||undefined, page: p, page_size: 12 })
      setListings((res.items || res || []).filter((item:any) => !RETIRED_REQUIREMENT_TYPES.includes(item.type)))
      setHasMore(res.has_more || false)
      setPage(p)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchListings(1) }, [filter])

  const createListing = async () => {
    if (!form.title || !form.description) return
    setSaving(true)
    try {
      await BizHubAPI.create(form)
      setShowForm(false)
      setForm(emptyForm)
      setMsg('✅ Requirement posted!')
      fetchListings(1)
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await BizHubAPI.update(editing.id, editing)
      setEditing(null)
      setMsg('✅ Listing updated!')
      fetchListings(page)
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const sendResponse = async () => {
    if (!selected || !response.trim()) return
    setSaving(true)
    try {
      await BizHubAPI.contact(selected.id, { message: response })
      setSelected(null)
      setResponse('')
      setMsg('✅ Response sent! They will be notified.')
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const deleteOwn = async (id: string) => {
    if (!confirm('Delete this listing?')) return
    try {
      await BizHubAPI.delete(id)
      setMsg('✅ Listing deleted')
      fetchListings(page)
    } catch (e: any) { setMsg('❌ ' + e.message) }
  }

  // Simplified type filter labels
  const FILTERS = [
    {label:'All',   value:''},
    {label:'CA/Legal',    value:'Need CA'},
    {label:'Tech',        value:'Need Website'},
    {label:'Vendors',     value:'Need Vendor'},
    {label:'Hiring',      value:'Hiring'},
  ]

  const totalPosted = listings.length
  const highUrgency = listings.filter(l=>l.urgency==='High').length

  if (me?.role === 'member') return null

  return (
    <div className="page">
      <PageHero
        icon={faBuilding}
        kicker="Find What You Need"
        title="Business Hub"
        description="Post requirements, find vendors, partners and talent within the NIA network."
        stats={[
          {icon:faClipboard, value:totalPosted, label:'Total listings'},
          {icon:faPhone, value:highUrgency, label:'High urgency'},
          {icon:faBuilding, value:REQUIREMENT_TYPES.length, label:'Categories'},
        ]}
      />
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
        <button className="btn btn-p" onClick={()=>{setForm(emptyForm);setShowForm(true)}}>+ Post Requirement</button>
      </div>

      {msg && (
        <div className="toast-in" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,marginBottom:12,fontSize:13,
          background:msg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
          color:msg.startsWith('✅')?'#16a34a':'#ef4444',
          border:`1px solid ${msg.startsWith('✅')?'rgba(39,216,109,.35)':'rgba(255,90,90,.35)'}`}}>
          {msg}<button style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}} onClick={()=>setMsg('')}>✕</button>
        </div>
      )}
      {error && <div style={{background:'rgba(255,90,90,.1)',border:'1px solid rgba(255,90,90,.3)',borderRadius:10,padding:'10px 14px',marginBottom:12,color:'#ef4444',fontSize:13}}>{error}</div>}

      {/* Type filters */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
        {FILTERS.map(f=>(
          <button key={f.value} className={`btn btn-sm ${filter===f.value?'btn-p':'btn-g'}`}
            onClick={()=>setFilter(f.value)}>{f.label}</button>
        ))}
      </div>

      {/* Listings */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14,marginBottom:12}}>
        {loading
          ? [...Array(6)].map((_,i)=><div key={i} className="card" style={{height:180,background:'rgba(255,255,255,.06)'}}/>)
          : listings.length===0
          ? <div style={{gridColumn:'1/-1'}} className="card">
              <div style={{textAlign:'center',padding:40,color:'#9ca3af'}}>
                <div style={{fontSize:32,marginBottom:8}}><FontAwesomeIcon icon={faBuilding}/></div>
                <div style={{fontWeight:600,marginBottom:4}}>{filter?`No listings for "${filter}"`:'No listings yet'}</div>
                <button className="btn btn-p btn-sm" style={{marginTop:8}} onClick={()=>setShowForm(true)}>Post First Requirement</button>
              </div>
            </div>
          : listings.map(b=>{
            const isOwn = b.user_id === me?.id
            return (
              <div key={b.id} className="card" style={{borderTop:`3px solid ${URGENCY_COLORS[b.urgency]||'#9ca3af'}`}}>
                {/* Header */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <div style={{flex:1,marginRight:8}}>
                    <div style={{fontSize:14,fontWeight:700}}>{b.title}</div>
                    <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>
                      {b.is_anonymous?'Anonymous':b.user?.name||'NIA Member'} · {b.city||'—'} · {b.created_at?new Date(b.created_at).toLocaleDateString():'—'}
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:3,alignItems:'flex-end',flexShrink:0}}>
                    <span style={{fontSize:10,padding:'2px 8px',borderRadius:99,
                      background:(URGENCY_COLORS[b.urgency]||'#9ca3af')+'22',
                      color:URGENCY_COLORS[b.urgency]||'#9ca3af',fontWeight:700}}>
                      {b.urgency||'—'} Urgency
                    </span>
                    <span style={{fontSize:10,padding:'2px 6px',borderRadius:99,background:'rgba(22,143,255,.1)',color:'#3b82f6',fontWeight:600}}>
                      {b.type||'—'}
                    </span>
                  </div>
                </div>
                {/* Description */}
                <p style={{fontSize:12,color:'#6b7280',marginBottom:10,lineHeight:1.6,
                  overflow:'hidden',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical'}}>
                  {b.description}
                </p>
                {/* Meta */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <span style={{fontWeight:700,color:'var(--nx-orange)',fontSize:13}}>{b.budget||'Budget not specified'}</span>
                  {b.contact_preference && (
                    <span style={{fontSize:11,color:'#9ca3af'}}><FontAwesomeIcon icon={faPhone} className="mr-1.5"/>{b.contact_preference}</span>
                  )}
                </div>
                {/* Actions */}
                <div style={{display:'flex',gap:6}}>
                  {!isOwn && (
                    <button className="btn btn-p btn-sm" onClick={()=>{setSelected(b);setResponse('')}}>
                      Respond / Help
                    </button>
                  )}
                  {isOwn && (
                    <>
                      <span style={{fontSize:11,padding:'4px 10px',background:'rgba(22,143,255,.1)',color:'#3b82f6',borderRadius:99,fontWeight:600}}>
                        Your Post
                      </span>
                      <button className="btn btn-g btn-sm" style={{color:'#6366f1'}} onClick={()=>setEditing({...b})}>Edit</button>
                      <button className="btn btn-g btn-sm" style={{color:'#ef4444'}} onClick={()=>deleteOwn(b.id)}>Delete</button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        }
      </div>

      <div style={{display:'flex',gap:6,justifyContent:'center'}}>
        <button className="btn btn-g btn-sm" disabled={page===1} onClick={()=>fetchListings(page-1)}><FontAwesomeIcon icon={faArrowLeft} className="mr-1.5"/>Prev</button>
        <span style={{padding:'6px 12px',fontSize:13,color:'#9ca3af'}}>Page {page}</span>
        <button className="btn btn-g btn-sm" disabled={!hasMore} onClick={()=>fetchListings(page+1)}>Next <FontAwesomeIcon icon={faArrowRight} className="ml-1"/></button>
      </div>

      {/* ── RESPOND MODAL ────────────────────────────────────────────── */}
      {selected && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setSelected(null)}>
          <div className="modal modal-lg business-response-modal">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>{selected.title}</h3>
            <div style={{fontSize:12,color:'#9ca3af',marginBottom:12}}>
              {selected.city} · {selected.urgency} urgency · {selected.budget||'Budget TBD'}
            </div>
            <div className="modal-section" style={{marginBottom:14,fontSize:13,lineHeight:1.6}}>
              {selected.description}
            </div>
            <div style={{marginBottom:14,fontSize:12,color:'#6b7280'}}>
              <strong>Posted by:</strong> {selected.is_anonymous?'Anonymous Member':selected.user?.name||'NIA Member'}<br/>
              <strong>Preferred contact:</strong> {selected.contact_preference||'Through Platform'}
            </div>
            <div className="fg">
              <label>Your Response *</label>
              <textarea rows={4} value={response} onChange={e=>setResponse(e.target.value)}
                placeholder="Describe how you can help, your experience, availability, pricing range…"/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p" style={{flex:1}} onClick={sendResponse}
                disabled={saving||!response.trim()}>
                {saving?'Sending…':'Send Response'}
              </button>
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setSelected(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ─────────────────────────────────────────────── */}
      {showForm && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal modal-lg business-requirement-modal" style={{maxHeight:'90vh',overflowY:'auto'}}>
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}><FontAwesomeIcon icon={faClipboard} className="mr-1.5"/>Post a Business Requirement</h3>
            <ListingForm data={form} onChange={setForm}/>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn btn-p" style={{flex:1}} onClick={createListing}
                disabled={saving||!form.title||!form.description}>
                {saving?'Posting…':'Post Requirement'}
              </button>
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ───────────────────────────────────────────────── */}
      {editing && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setEditing(null)}>
          <div className="modal modal-lg business-requirement-modal" style={{maxHeight:'90vh',overflowY:'auto'}}>
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}>Edit Listing</h3>
            <ListingForm data={editing} onChange={setEditing}/>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn btn-p" style={{flex:1}} onClick={saveEdit} disabled={saving}>
                {saving?'Saving…':'Save Changes'}
              </button>
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
