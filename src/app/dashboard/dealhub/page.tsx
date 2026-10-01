'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { DealHubAPI, MasterDataAPI, TokenStore } from '@/lib/api'
import { Loading, ApiError, Empty } from '@/components/shared/States'
import { Pagination } from '@/components/shared/Pagination'
import Sparkline from '@/components/ui/Sparkline'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faCircleCheck, faCircleXmark, faCamera, faBookmark, faTag, faChevronLeft, faChevronRight, faXmark, faPen } from '@fortawesome/free-solid-svg-icons'
import PageHero from '@/components/shared/PageHero'

const TIERS = ['connect','growth','elite','city_leadership','national','global']
const TIER_LABEL: Record<string,string> = {connect:'Connect',growth:'Growth',elite:'Elite',city_leadership:'City Leadership',national:'National',global:'Global'}
// P0 gap fix: moderation status pill — pending/approved/rejected
const STATUS_BADGE: Record<string,string> = { pending:'b-orange', approved:'b-green', rejected:'b-red' }
const STATUS_ICON: Record<string,any> = { pending:faClock, approved:faCircleCheck, rejected:faCircleXmark }
const STATUS_LABEL: Record<string,string> = { pending:'Pending', approved:'Approved', rejected:'Rejected' }
// Matches backend REDEMPTION_METHODS in modules/dealhub/service.py exactly
// — keep these two lists in sync if either changes.
const REDEMPTION_METHODS = [
  { value:'online_code', label:'Online code' },
  { value:'in_store',    label:'In-store' },
  { value:'link',        label:'Redemption link' },
  { value:'phone',       label:'Call to redeem' },
  { value:'whatsapp',    label:'WhatsApp' },
]
const REDEMPTION_LABEL: Record<string,string> = REDEMPTION_METHODS.reduce((a,r)=>({...a,[r.value]:r.label}),{})
const PAGE_SIZE = 10

function formatINR(n: number) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

function PriceCell({ o }: { o: any }) {
  const hasDiscounted = typeof o.discounted_price === 'number' && o.discounted_price > 0
  const hasOriginal = typeof o.original_price === 'number' && o.original_price > 0
  if (hasDiscounted) {
    return (
      <div style={{display:'flex',flexDirection:'column'}}>
        <span style={{fontSize:14,fontWeight:800,color:'#10b981'}}>{formatINR(o.discounted_price)}</span>
        {hasOriginal && <span style={{fontSize:11,color:'var(--nx-muted)',textDecoration:'line-through'}}>{formatINR(o.original_price)}</span>}
      </div>
    )
  }
  if (o.discount) return <span style={{fontSize:13,fontWeight:700,color:'#10b981'}}>{o.discount}</span>
  return <span style={{color:'var(--nx-line)'}}>—</span>
}

function ImageGalleryModal({ images, startIndex, onClose }: { images: string[], startIndex: number, onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex)
  const go = useCallback((delta: number) => setIdx(i => (i + delta + images.length) % images.length), [images.length])
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  const modal = (
    <div
      onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:'fixed',inset:0,zIndex:1200,background:'rgba(5,8,15,.92)',backdropFilter:'blur(6px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}
    >
      <button onClick={onClose} aria-label="Close"
        style={{position:'absolute',top:20,right:20,width:40,height:40,borderRadius:'50%',border:'1px solid rgba(255,255,255,.2)',background:'rgba(255,255,255,.06)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
        <FontAwesomeIcon icon={faXmark} style={{fontSize:16}}/>
      </button>

      <div style={{fontSize:12,letterSpacing:1,color:'rgba(255,255,255,.55)',marginBottom:14}}>
        {idx+1} / {images.length}
      </div>

      <div style={{position:'relative',display:'flex',alignItems:'center',gap:16,width:'100%',maxWidth:920,justifyContent:'center'}}>
        {images.length > 1 && (
          <button onClick={()=>go(-1)} aria-label="Previous image"
            style={{width:44,height:44,borderRadius:'50%',border:'1px solid rgba(255,255,255,.2)',background:'rgba(255,255,255,.06)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
            <FontAwesomeIcon icon={faChevronLeft}/>
          </button>
        )}
        <img
          src={images[idx]}
          alt={`Photo ${idx+1} of ${images.length}`}
          style={{maxWidth:'100%',maxHeight:'70vh',borderRadius:14,boxShadow:'0 24px 60px rgba(0,0,0,.5)',objectFit:'contain'}}
        />
        {images.length > 1 && (
          <button onClick={()=>go(1)} aria-label="Next image"
            style={{width:44,height:44,borderRadius:'50%',border:'1px solid rgba(255,255,255,.2)',background:'rgba(255,255,255,.06)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
            <FontAwesomeIcon icon={faChevronRight}/>
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div style={{display:'flex',gap:8,marginTop:20,maxWidth:920,overflowX:'auto',padding:'4px 2px'}}>
          {images.map((url, i) => (
            <img key={url+i} src={url} alt={`Thumbnail ${i+1}`} onClick={()=>setIdx(i)}
              style={{
                width:56,height:56,objectFit:'cover',borderRadius:8,cursor:'pointer',flexShrink:0,
                border: i===idx ? '2px solid var(--nx-orange)' : '2px solid transparent',
                opacity: i===idx ? 1 : .55,
                transition:'all .15s',
              }}/>
          ))}
        </div>
      )}
    </div>
  )

  if (!mounted) return null
  return createPortal(modal, document.body)
}

function DealDetailsModal({ offer, isOwner, canManage, isSaved, isRedeemed, busy,
  onClose, onRedeem, onToggleSave, onEdit, onDelete, onZoom }: {
  offer: any, isOwner: boolean, canManage: boolean, isSaved: boolean, isRedeemed: boolean, busy: boolean,
  onClose: () => void, onRedeem: () => void, onToggleSave: () => void,
  onEdit: () => void, onDelete: () => void, onZoom: (images: string[], start: number) => void,
}) {
  const [idx, setIdx] = useState(0)
  const images: string[] = offer.image_urls || []
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const modal = (
    <div
      onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:'fixed',inset:0,zIndex:1100,background:'rgba(5,8,15,.75)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
    >
      <div style={{background:'var(--nx-panel)',borderRadius:16,maxWidth:520,width:'100%',maxHeight:'88vh',overflowY:'auto',border:'1px solid var(--nx-line)',boxShadow:'0 24px 60px rgba(0,0,0,.5)'}}>
        {images.length > 0 ? (
          <div style={{position:'relative',height:240,background:'var(--nx-ink)',borderRadius:'16px 16px 0 0',overflow:'hidden'}}>
            <img src={images[idx]} alt={offer.title} onClick={()=>onZoom(images, idx)}
              style={{width:'100%',height:'100%',objectFit:'cover',cursor:'zoom-in'}}/>
            {images.length > 1 && (
              <>
                <button onClick={()=>setIdx(i=>(i-1+images.length)%images.length)} aria-label="Previous image"
                  style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',width:32,height:32,borderRadius:'50%',border:'1px solid rgba(255,255,255,.3)',background:'rgba(0,0,0,.5)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                  <FontAwesomeIcon icon={faChevronLeft} style={{fontSize:12}}/>
                </button>
                <button onClick={()=>setIdx(i=>(i+1)%images.length)} aria-label="Next image"
                  style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',width:32,height:32,borderRadius:'50%',border:'1px solid rgba(255,255,255,.3)',background:'rgba(0,0,0,.5)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                  <FontAwesomeIcon icon={faChevronRight} style={{fontSize:12}}/>
                </button>
                <div style={{position:'absolute',bottom:10,left:0,right:0,display:'flex',justifyContent:'center',gap:5}}>
                  {images.map((_,i)=>(
                    <div key={i} onClick={()=>setIdx(i)} style={{width:6,height:6,borderRadius:'50%',cursor:'pointer',
                      background: i===idx ? '#fff' : 'rgba(255,255,255,.4)'}}/>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}

        <div style={{padding:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
            <div>
              <div style={{fontSize:17,fontWeight:800}}>{offer.title}</div>
              <div style={{fontSize:13,color:'var(--nx-orange)',fontWeight:600}}>{offer.brand}</div>
            </div>
            <button onClick={onClose} aria-label="Close"
              style={{width:30,height:30,borderRadius:'50%',border:'1px solid var(--nx-line)',background:'transparent',color:'var(--nx-muted)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
              <FontAwesomeIcon icon={faXmark}/>
            </button>
          </div>

          <div style={{display:'flex',gap:6,flexWrap:'wrap',margin:'10px 0'}}>
            <span className={`badge ${offer.source==='official'?'b-blue':'b-gray'}`}>{offer.source==='official'?'Official':'Member Deal'}</span>
            {offer.tier_required && <span className="badge b-blue">{TIER_LABEL[offer.tier_required]||offer.tier_required}+</span>}
            {offer.status && <span className={`badge ${STATUS_BADGE[offer.status]}`}><FontAwesomeIcon icon={STATUS_ICON[offer.status]} className="mr-1"/>{STATUS_LABEL[offer.status]}</span>}
            {offer.category && <span className="badge b-gray">{offer.category}</span>}
            {offer.geography && <span className="badge b-gray">{offer.geography}</span>}
          </div>

          <div style={{marginBottom:14}}><PriceCell o={offer}/></div>

          {offer.description && (
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--nx-muted)',marginBottom:3,textTransform:'uppercase',letterSpacing:.3}}>Description</div>
              <div style={{fontSize:13,color:'var(--nx-ink)',lineHeight:1.6}}>{offer.description}</div>
            </div>
          )}

          {offer.terms && (
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--nx-muted)',marginBottom:3,textTransform:'uppercase',letterSpacing:.3}}>Terms</div>
              <div style={{fontSize:13,color:'var(--nx-muted)',lineHeight:1.6}}>{offer.terms}</div>
            </div>
          )}

          <div className="form-grid" style={{marginBottom:14}}>
            {offer.redemption_method && (
              <div><div style={{fontSize:11,color:'var(--nx-muted)'}}>How to redeem</div><div style={{fontSize:13,fontWeight:600}}>{REDEMPTION_LABEL[offer.redemption_method]||offer.redemption_method}</div></div>
            )}
            {offer.valid_until && (
              <div><div style={{fontSize:11,color:'var(--nx-muted)'}}>Valid until</div><div style={{fontSize:13,fontWeight:600}}>{offer.valid_until}</div></div>
            )}
          </div>

          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {!isOwner && (
              <button className="btn btn-p" style={{flex:1}} disabled={isRedeemed||busy} onClick={onRedeem}>
                {isRedeemed ? '✓ Redeemed' : busy ? '…' : 'Redeem This Deal'}
              </button>
            )}
            <button className="btn btn-g" onClick={onToggleSave} title={isSaved?'Unsave':'Save for later'}>
              <FontAwesomeIcon icon={isSaved?faBookmark:faTag} className="mr-1.5"/>{isSaved?'Saved':'Save'}
            </button>
            {(canManage || isOwner) && (
              <button className="btn btn-g" onClick={onEdit}><FontAwesomeIcon icon={faPen} className="mr-1.5"/>Edit</button>
            )}
            {(canManage || isOwner) && (
              <button className="btn btn-g" style={{color:'#ef4444'}} onClick={onDelete}>Delete</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(modal, document.body)
}

const emptyForm = {brand:'',title:'',description:'',discount:'',original_price:'',discounted_price:'',terms:'',valid_until:'',tier_required:'',category:'',geography:'',redemption_method:'',image_urls:[] as string[]}

// ── Create / Edit modal ──────────────────────────────────────────────────
// Root cause of "creation UI is broken": this modal previously relied on
// the page's plain `.overlay`/`.modal` CSS classes with whatever z-index
// they happen to have globally, so any other fixed-position page element
// with a higher z-index (a floating action button, chat widget, etc.)
// could render on top of it — exactly the orange circular button seen
// overlapping the Description field. Pulling it into a portal with an
// explicit z-index (950, below the details modal's 1100) removes that
// dependency entirely.
function DealFormModal({ form, setForm, editingId, isOfficial, categoryOptions, geographyOptions,
  MAX_OFFER_IMAGES, uploading, uploadPhotos, removePhoto, saving, onSave, onCancel, onZoom }: {
  form: any, setForm: (updater: any) => void, editingId: string|null, isOfficial: boolean,
  categoryOptions: {value:string,label:string}[], geographyOptions: {value:string,label:string}[],
  MAX_OFFER_IMAGES: number, uploading: boolean, uploadPhotos: (files: FileList) => void, removePhoto: (i: number) => void,
  saving: boolean, onSave: () => void, onCancel: () => void, onZoom: (images: string[], start: number) => void,
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const priceMismatch = form.original_price && form.discounted_price && Number(form.discounted_price) > Number(form.original_price)

  const modal = (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onCancel()} style={{position:'fixed',inset:0,zIndex:950}}>
      <div className="modal">
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>
          {editingId ? 'Edit Offer' : isOfficial ? 'New Deals Corner Offer' : 'Share a Deal with the Community'}
        </h3>
        <p style={{fontSize:12,color:'var(--nx-muted)',marginBottom:14}}>
          {editingId
            ? 'Update this offer\'s details.'
            : isOfficial ? 'Post an official brand partnership offer — goes live immediately.' : 'Got a discount or offer you can extend to fellow members? Share it here — a moderator reviews it before it goes live.'}
        </p>
        <div className="form-grid">
          <div className="fg"><label>Brand{isOfficial?' *':' / Business Name *'}</label><input value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} placeholder={isOfficial?'':'Your business name'}/></div>
          <div className="fg"><label>Discount headline</label><input value={form.discount} onChange={e=>setForm({...form,discount:e.target.value})} placeholder="20% off"/></div>
        </div>
        <div className="form-grid">
          <div className="fg">
            <label>Original price (₹)</label>
            <input type="number" min="0" value={form.original_price} onChange={e=>setForm({...form,original_price:e.target.value})} placeholder="10000"/>
          </div>
          <div className="fg">
            <label>Discounted price (₹)</label>
            <input type="number" min="0" value={form.discounted_price} onChange={e=>setForm({...form,discounted_price:e.target.value})} placeholder="7500"/>
          </div>
        </div>
        {priceMismatch && (
          <div style={{fontSize:12,color:'#ef4444',marginBottom:10}}>Discounted price can't be higher than the original price</div>
        )}
        <div className="form-grid">
          <div className="fg">
            <label>Category</label>
            <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
              <option value="">Select category</option>
              {categoryOptions.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="fg">
            <label>Geography</label>
            <select value={form.geography} onChange={e=>setForm({...form,geography:e.target.value})}>
              <option value="">Select country</option>
              {geographyOptions.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
        </div>
        <div className="fg">
          <label>Redemption method</label>
          <select value={form.redemption_method} onChange={e=>setForm({...form,redemption_method:e.target.value})}>
            <option value="">Select how members redeem this</option>
            {REDEMPTION_METHODS.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div className="fg">
          <label>Photos ({form.image_urls.length}/{MAX_OFFER_IMAGES})</label>
          {form.image_urls.length > 0 && (
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
              {form.image_urls.map((url: string, i: number) => (
                <div key={url+i} style={{position:'relative',width:84,height:84}}>
                  <img src={url} alt={`Offer photo ${i+1}`} style={{width:84,height:84,objectFit:'cover',borderRadius:8,cursor:'zoom-in'}}
                    onClick={()=>onZoom(form.image_urls, i)}/>
                  <button type="button" className="btn btn-g btn-xs" style={{position:'absolute',top:2,right:2,padding:'1px 5px'}} onClick={()=>removePhoto(i)}>✕</button>
                </div>
              ))}
            </div>
          )}
          {form.image_urls.length < MAX_OFFER_IMAGES && (
            <input type="file" accept="image/*" multiple disabled={uploading}
              onChange={e=>e.target.files && e.target.files.length > 0 && uploadPhotos(e.target.files)}/>
          )}
          {uploading && <div style={{fontSize:11,color:'var(--nx-muted)',marginTop:4}}>Uploading…</div>}
        </div>
        <div className="fg"><label>Title *</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
        <div className="fg"><label>Description</label><textarea rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
        <div className="fg"><label>Terms</label><input value={form.terms} onChange={e=>setForm({...form,terms:e.target.value})} style={{height:38,boxSizing:'border-box'}}/></div>
        {isOfficial ? (
          <div className="form-grid">
            <div className="fg"><label>Valid Until</label><input type="date" value={form.valid_until} onChange={e=>setForm({...form,valid_until:e.target.value})} style={{colorScheme:'dark'}}/></div>
            <div className="fg">
              <label>Min Tier Required</label>
              <select value={form.tier_required} onChange={e=>setForm({...form,tier_required:e.target.value})}>
                <option value="">All tiers</option>
                {TIERS.map(t=><option key={t} value={t}>{TIER_LABEL[t]}+</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div className="fg"><label>Valid Until</label><input type="date" value={form.valid_until} onChange={e=>setForm({...form,valid_until:e.target.value})} style={{colorScheme:'dark'}}/></div>
        )}
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button className="btn btn-p" style={{flex:1}} onClick={onSave} disabled={saving || priceMismatch}>
            {saving ? 'Saving…' : editingId ? 'Save Changes' : isOfficial ? 'Create Offer' : 'Submit for Review'}
          </button>
          <button className="btn btn-g" style={{flex:1}} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(modal, document.body)
}

export default function DealHubPage() {
  const me = TokenStore.getUser()
  const canManage = ['franchise','hq_admin','super_admin'].includes(me?.role)
  const isOfficial = ['franchise','hq_admin','super_admin'].includes(me?.role)

  const [tab, setTab] = useState<'live'|'queue'>('live')
  const [offers, setOffers] = useState<any[]>([])
  const [queue, setQueue] = useState<any[]>([])
  const [redemptions, setRedemptions] = useState<any[]>([])
  const [saved, setSaved] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busyId, setBusyId] = useState<string|null>(null)
  const [viewingDeal, setViewingDeal] = useState<any|null>(null)

  const [livePage, setLivePage] = useState(1)
  const [queuePage, setQueuePage] = useState(1)

  const [categoryOptions, setCategoryOptions] = useState<{value:string,label:string}[]>([])
  const [geographyOptions, setGeographyOptions] = useState<{value:string,label:string}[]>([])
  const [filterCategory, setFilterCategory] = useState('')
  const [filterGeography, setFilterGeography] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string|null>(null)
  const MAX_OFFER_IMAGES = 6
  const [form, setForm] = useState<any>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [zoomImages, setZoomImages] = useState<string[]|null>(null)
  const [zoomStart, setZoomStart] = useState(0)

  const uploadPhotos = async (files: FileList) => {
    const remaining = MAX_OFFER_IMAGES - form.image_urls.length
    if (remaining <= 0) { setMsg(`❌ Max ${MAX_OFFER_IMAGES} photos per offer`); return }
    const toUpload = Array.from(files).slice(0, remaining)
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of toUpload) {
        const { upload_url, public_url } = await DealHubAPI.getUploadUrl({ filename: file.name, content_type: file.type })
        await fetch(upload_url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
        uploaded.push(public_url)
      }
      setForm((f: any) => ({ ...f, image_urls: [...f.image_urls, ...uploaded] }))
      setMsg(`✅ ${uploaded.length} photo${uploaded.length===1?'':'s'} uploaded!`)
    } catch (e: any) { setMsg('❌ Upload failed: ' + e.message) }
    finally { setUploading(false) }
  }

  const removePhoto = (idx: number) => {
    setForm((f: any) => ({ ...f, image_urls: f.image_urls.filter((_: string, i: number) => i !== idx) }))
  }

  const fetchAll = async (category = filterCategory, geography = filterGeography) => {
    setLoading(true); setError('')
    try {
      const [offersRes, redRes, savedRes, queueRes] = await Promise.all([
        DealHubAPI.listOffers({ category: category || undefined, geography: geography || undefined }),
        DealHubAPI.myRedemptions().catch(()=>({items:[]})),
        DealHubAPI.mySaved().catch(()=>({items:[]})),
        canManage ? DealHubAPI.moderationQueue().catch(()=>({items:[]})) : Promise.resolve({items:[]}),
      ])
      setOffers(offersRes.items || offersRes || [])
      setRedemptions((redRes.items || redRes || []).map((r:any)=>r.offer_id))
      setSaved((savedRes.items || savedRes || []).map((s:any)=>s.id))
      setQueue(queueRes.items || queueRes || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const fetchFilterOptions = async () => {
    try {
      const [catRes, geoRes] = await Promise.all([
        MasterDataAPI.get('deal_category').catch(()=>({items:[]})),
        MasterDataAPI.get('country').catch(()=>({items:[]})),
      ])
      setCategoryOptions((catRes.items || catRes || []).map((i:any)=>({value:i.value,label:i.label||i.value})))
      setGeographyOptions((geoRes.items || geoRes || []).map((i:any)=>({value:i.value,label:i.label||i.value})))
    } catch { /* filters are a nice-to-have — a failed fetch just leaves the dropdowns empty */ }
  }

  useEffect(() => { fetchAll(); fetchFilterOptions() }, [])

  const applyFilters = () => { setLivePage(1); fetchAll(filterCategory, filterGeography) }
  const clearFilters = () => { setFilterCategory(''); setFilterGeography(''); setLivePage(1); fetchAll('', '') }

  const pagedOffers = useMemo(() => offers.slice((livePage-1)*PAGE_SIZE, livePage*PAGE_SIZE), [offers, livePage])
  const pagedQueue = useMemo(() => queue.slice((queuePage-1)*PAGE_SIZE, queuePage*PAGE_SIZE), [queue, queuePage])

  const toggleSave = async (id: string) => {
    try {
      const res = await DealHubAPI.toggleSave(id)
      setSaved(prev => res.saved ? [...prev, id] : prev.filter(x => x !== id))
    } catch (e: any) { setMsg('❌ ' + e.message) }
  }

  const redeem = async (id: string) => {
    setBusyId(id)
    try {
      await DealHubAPI.redeem(id)
      setMsg('✅ Offer redeemed!')
      setRedemptions([...redemptions, id])
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setBusyId(null) }
  }

  const moderate = async (id: string, action: 'approve'|'reject') => {
    setBusyId(id)
    try {
      await DealHubAPI.moderate(id, action)
      setMsg(action === 'approve' ? '✅ Offer approved' : 'Offer rejected')
      fetchAll()
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setBusyId(null) }
  }

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowCreate(true) }

  const openEdit = (o: any) => {
    setEditingId(o.id)
    setForm({
      brand: o.brand || '', title: o.title || '', description: o.description || '',
      discount: o.discount || '',
      original_price: o.original_price ?? '', discounted_price: o.discounted_price ?? '',
      terms: o.terms || '', valid_until: o.valid_until || '',
      tier_required: o.tier_required || '', category: o.category || '', geography: o.geography || '',
      redemption_method: o.redemption_method || '', image_urls: o.image_urls || [],
    })
    setShowCreate(true)
  }

  const saveOffer = async () => {
    if (!form.brand || !form.title) { setMsg('❌ Brand and title are required'); return }
    if (form.original_price && form.discounted_price && Number(form.discounted_price) > Number(form.original_price)) {
      setMsg('❌ Discounted price can\'t be higher than the original price')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        tier_required: form.tier_required || null,
        original_price: form.original_price ? Number(form.original_price) : null,
        discounted_price: form.discounted_price ? Number(form.discounted_price) : null,
        category: form.category || null,
        geography: form.geography || null,
        redemption_method: form.redemption_method || null,
      }
      if (editingId) {
        await DealHubAPI.updateOffer(editingId, payload)
        setMsg('✅ Offer updated')
      } else {
        await DealHubAPI.createOffer(payload)
        setMsg(isOfficial ? '✅ Offer created!' : '✅ Submitted — visible once a moderator approves it')
      }
      setShowCreate(false); setEditingId(null); setForm(emptyForm)
      fetchAll()
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const deleteOffer = async (id: string) => {
    if (!confirm('Remove this offer?')) return
    try { await DealHubAPI.deleteOffer(id); setMsg('✅ Offer removed'); fetchAll() }
    catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setViewingDeal(null) }
  }

  const CategoryTags = ({ o }: { o: any }) => (
    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
      {o.category && <span className="badge b-gray" style={{fontSize:10}}>{o.category}</span>}
      {o.geography && <span className="badge b-gray" style={{fontSize:10}}>{o.geography}</span>}
      {o.redemption_method && <span className="badge b-gray" style={{fontSize:10}}>{REDEMPTION_LABEL[o.redemption_method]||o.redemption_method}</span>}
    </div>
  )

  return (
    <div className="page deal-corner-page">
      <div className="deal-corner-hero">
        <PageHero
          icon={faTag}
          kicker="Members-Only Perks"
          title="Deals Corner"
          description="Exclusive brand offers for NetworkX members — browse, save, and redeem."
          stats={[
            {icon:faTag,value:offers.length,label:'deals'},
            {icon:faBookmark,value:saved.length,label:'saved'},
            {icon:faCircleCheck,value:redemptions.length,label:'redeemed'},
          ]}
        />
        <img src="/visuals/member-offer-gift-v2.jpg" alt="" aria-hidden="true"/>
        <button className="btn btn-p deal-corner-share" onClick={openCreate}>+ Share a Deal</button>
      </div>

      {msg && (
        <div className="toast-in" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,marginBottom:12,fontSize:13,
          background:msg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
          color:msg.startsWith('✅')?'#16a34a':'#ef4444',
          border:`1px solid ${msg.startsWith('✅')?'rgba(39,216,109,.35)':'rgba(255,90,90,.35)'}`}}>
          {msg}<button style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',color:'var(--nx-muted)'}} onClick={()=>setMsg('')}>✕</button>
        </div>
      )}

      {canManage && (
        <div className="tab-bar deal-corner-tabs" style={{maxWidth:340,marginBottom:14}}>
          <button className={`tab-btn ${tab==='live'?'active':''}`} onClick={()=>setTab('live')}>Live Deals</button>
          <button className={`tab-btn ${tab==='queue'?'active':''}`} onClick={()=>setTab('queue')}>
            Moderation Queue{queue.length>0?` (${queue.length})`:''}
          </button>
        </div>
      )}

      {tab === 'live' && (categoryOptions.length > 0 || geographyOptions.length > 0) && (
        <div className="deal-corner-filters" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginBottom:14}}>
          {categoryOptions.length > 0 && (
            <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} style={{width:'auto',minWidth:160}}>
              <option value="">All categories</option>
              {categoryOptions.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          )}
          {geographyOptions.length > 0 && (
            <select value={filterGeography} onChange={e=>setFilterGeography(e.target.value)} style={{width:'auto',minWidth:160}}>
              <option value="">All countries</option>
              {geographyOptions.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          )}
          <button className="btn btn-p btn-sm" onClick={applyFilters}>Apply</button>
          {(filterCategory || filterGeography) && <button className="btn btn-g btn-sm" onClick={clearFilters}>Clear</button>}
        </div>
      )}

      {loading ? <Loading label="Loading offers…"/> : error ? <ApiError message={error} onRetry={()=>fetchAll()}/> : tab === 'queue' ? (
        queue.length === 0 ? <Empty label="Nothing waiting for review"/> : (
          <>
            <div className="card deal-table-wrap" style={{padding:0,overflowX:'auto'}}>
              <table className="tbl deal-table" style={{minWidth:760}}>
                <thead>
                  <tr>
                    <th>Photo</th><th>Deal</th><th>Price</th><th>Tags</th><th>Submitted by</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedQueue.map(o=>(
                    <tr key={o.id} onClick={()=>setViewingDeal(o)} style={{cursor:'pointer'}}>
                      <td>
                        {o.image_urls?.length > 0 ? (
                          <img src={o.image_urls[0]} alt={o.title} onClick={e=>{e.stopPropagation();setZoomImages(o.image_urls);setZoomStart(0)}}
                            style={{width:48,height:48,objectFit:'cover',borderRadius:8,cursor:'zoom-in'}}/>
                        ) : <img className="deal-placeholder-image" src="/visuals/member-offer-gift-v2.jpg" alt="" aria-hidden="true"/>}
                      </td>
                      <td>
                        <div style={{fontWeight:700,fontSize:13}}>{o.title}</div>
                        <div style={{fontSize:11,color:'var(--nx-orange)'}}>{o.brand}</div>
                      </td>
                      <td><PriceCell o={o}/></td>
                      <td><CategoryTags o={o}/></td>
                      <td style={{fontSize:12,color:'var(--nx-muted)'}}>{o.user?.name || 'a member'}</td>
                      <td onClick={e=>e.stopPropagation()}>
                        <div style={{display:'flex',gap:6}}>
                          <button className="btn btn-p btn-xs" style={{background:'#10b981'}} disabled={busyId===o.id} onClick={()=>moderate(o.id,'approve')}>Approve</button>
                          <button className="btn btn-g btn-xs" style={{color:'#ef4444'}} disabled={busyId===o.id} onClick={()=>moderate(o.id,'reject')}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={queuePage} pageSize={PAGE_SIZE} total={queue.length} hasMore={queuePage*PAGE_SIZE < queue.length} onPageChange={setQueuePage}/>
          </>
        )
      ) : offers.length === 0 ? <Empty label="No offers available for your tier yet"/> : (
        <>
          <div className="card deal-table-wrap" style={{padding:0,overflowX:'auto'}}>
            <table className="tbl deal-table" style={{minWidth:820}}>
              <thead>
                <tr>
                  <th>Photo</th><th>Deal</th><th>Price</th><th>Tags</th><th>Status</th><th>Funnel</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedOffers.map(o=>{
                  const redeemed = redemptions.includes(o.id)
                  const isSaved = saved.includes(o.id)
                  const isOwner = o.created_by === me?.id
                  return (
                    <tr key={o.id} onClick={()=>setViewingDeal(o)} style={{cursor:'pointer'}}>
                      <td>
                        {o.image_urls?.length > 0 ? (
                          <div style={{position:'relative',display:'inline-block',cursor:'zoom-in'}} onClick={e=>{e.stopPropagation();setZoomImages(o.image_urls);setZoomStart(0)}}>
                            <img src={o.image_urls[0]} alt={o.title} style={{width:48,height:48,objectFit:'cover',borderRadius:8}}/>
                            {o.image_urls.length > 1 && (
                              <span style={{position:'absolute',bottom:-2,right:-2,background:'rgba(0,0,0,.7)',color:'#fff',fontSize:9,fontWeight:700,padding:'1px 4px',borderRadius:6}}>
                                <FontAwesomeIcon icon={faCamera} style={{fontSize:8}} className="mr-1"/>{o.image_urls.length}
                              </span>
                            )}
                          </div>
                        ) : <img className="deal-placeholder-image" src="/visuals/member-offer-gift-v2.jpg" alt="" aria-hidden="true"/>}
                      </td>
                      <td>
                        <div style={{fontWeight:700,fontSize:13}}>{o.title}</div>
                        <div style={{fontSize:11,color:'var(--nx-orange)'}}>{o.brand}</div>
                        <span className={`badge ${o.source==='official'?'b-blue':'b-gray'}`} style={{fontSize:9,marginTop:2}}>{o.source==='official'?'Official':'Member Deal'}</span>
                        {o.tier_required && <span className="badge b-blue" style={{fontSize:9,marginLeft:4}}>{TIER_LABEL[o.tier_required]||o.tier_required}+</span>}
                      </td>
                      <td><PriceCell o={o}/></td>
                      <td><CategoryTags o={o}/></td>
                      <td>
                        {o.status && <span className={`badge ${STATUS_BADGE[o.status]}`}><FontAwesomeIcon icon={STATUS_ICON[o.status]} className="mr-1"/>{STATUS_LABEL[o.status]}</span>}
                      </td>
                      <td>
                        {(canManage || isOwner) ? <Sparkline views={o.views_count||0} saves={o.saves_count||0} claims={o.claims_count||0} /> : <span style={{color:'var(--nx-line)'}}>—</span>}
                      </td>
                      <td onClick={e=>e.stopPropagation()}>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          {!isOwner && (
                            <button className="btn btn-p btn-xs" disabled={redeemed||busyId===o.id} onClick={()=>redeem(o.id)}>
                              {redeemed ? 'Redeemed' : busyId===o.id ? '…' : 'Redeem'}
                            </button>
                          )}
                          <button className="btn btn-g btn-xs" onClick={()=>toggleSave(o.id)} title={isSaved?'Unsave':'Save for later'}>
                            <FontAwesomeIcon icon={isSaved?faBookmark:faTag}/>
                          </button>
                          {(canManage || isOwner) && (
                            <button className="btn btn-g btn-xs" onClick={()=>openEdit(o)} title="Edit">
                              <FontAwesomeIcon icon={faPen}/>
                            </button>
                          )}
                          {(canManage || isOwner) && <button className="btn btn-g btn-xs" style={{color:'#ef4444'}} onClick={()=>deleteOffer(o.id)}>Delete</button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={livePage} pageSize={PAGE_SIZE} total={offers.length} hasMore={livePage*PAGE_SIZE < offers.length} onPageChange={setLivePage}/>
        </>
      )}

      {showCreate && (
        <DealFormModal
          form={form}
          setForm={setForm}
          editingId={editingId}
          isOfficial={isOfficial}
          categoryOptions={categoryOptions}
          geographyOptions={geographyOptions}
          MAX_OFFER_IMAGES={MAX_OFFER_IMAGES}
          uploading={uploading}
          uploadPhotos={uploadPhotos}
          removePhoto={removePhoto}
          saving={saving}
          onSave={saveOffer}
          onCancel={()=>{setShowCreate(false);setEditingId(null)}}
          onZoom={(images,start)=>{setZoomImages(images);setZoomStart(start)}}
        />
      )}

      {viewingDeal && (
        <DealDetailsModal
          offer={viewingDeal}
          isOwner={viewingDeal.created_by === me?.id}
          canManage={canManage}
          isSaved={saved.includes(viewingDeal.id)}
          isRedeemed={redemptions.includes(viewingDeal.id)}
          busy={busyId === viewingDeal.id}
          onClose={()=>setViewingDeal(null)}
          onRedeem={()=>redeem(viewingDeal.id)}
          onToggleSave={()=>toggleSave(viewingDeal.id)}
          onEdit={()=>{setViewingDeal(null);openEdit(viewingDeal)}}
          onDelete={()=>deleteOffer(viewingDeal.id)}
          onZoom={(images,start)=>{setZoomImages(images);setZoomStart(start)}}
        />
      )}

      {zoomImages && <ImageGalleryModal images={zoomImages} startIndex={zoomStart} onClose={()=>setZoomImages(null)}/>}
    </div>
  )
}
