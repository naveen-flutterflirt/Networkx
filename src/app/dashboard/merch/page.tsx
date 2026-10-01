'use client'
import { useState, useEffect } from 'react'
import { MerchAPI, TokenStore } from '@/lib/api'
import { Loading, ApiError, Empty } from '@/components/shared/States'
import { Pagination } from '@/components/shared/Pagination'
import { openRazorpayCheckout } from '@/lib/razorpay'
import ImageZoomModal from '@/components/ui/ImageZoomModal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faIdCard, faStar, faShirt, faThumbtack, faGift, faCircleCheck, faCartShopping, faCreditCard, faPen, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'

const STATUS_LABEL: Record<string,string> = {requested:'Requested',processing:'Processing',shipped:'Shipped',delivered:'Delivered'}
const STATUS_BADGE: Record<string,string> = {requested:'b-gray',processing:'b-yellow',shipped:'b-blue',delivered:'b-green'}
const ITEM_VISUAL: Record<string,{icon:any,bg:string}> = {
  membership_card: {icon:faIdCard, bg:'linear-gradient(135deg,var(--nx-blue),#4aa3ff)'},
  sticker:         {icon:faStar, bg:'linear-gradient(135deg,var(--nx-orange),#ff7a47)'},
  tshirt:          {icon:faShirt, bg:'linear-gradient(135deg,var(--nx-navy),var(--nx-blue))'},
  pin:             {icon:faThumbtack, bg:'linear-gradient(135deg,#f59e0b,#fbbf24)'},
}
const PAGE_SIZE = 12

// Product details popup — was entirely missing, same gap Deal Corner had
// before its own details modal was built. Small inline image slider
// (click the image for the full-screen zoom lightbox), price/tier info,
// and the Buy/Request action right there — one place to see everything
// about a product instead of just a bare card.
function ProductDetailsModal({ item, already, onClose, onOrder, onZoom, isHQ, onEdit, onRemove }: {
  item: any, already: boolean, onClose: () => void, onOrder: () => void,
  onZoom: (images: string[], start: number) => void, isHQ: boolean, onEdit: () => void, onRemove: () => void,
}) {
  const [idx, setIdx] = useState(0)
  const images: string[] = item.image_urls || []
  const visual = ITEM_VISUAL[item.id] || {icon:faGift, bg:'linear-gradient(135deg,#6366f1,#818cf8)'}
  const val = item.your_tier_value
  const isFree = item.is_free_for_you

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{padding:0,overflow:'hidden',maxWidth:440}}>
        <div style={{position:'relative',height:220,background:'var(--nx-ink)'}}>
          {images.length > 0 ? (
            <>
              <img src={images[idx]} alt={item.name} onClick={()=>onZoom(images, idx)}
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
            </>
          ) : (
            <div style={{background:visual.bg,height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:64}}>
              <FontAwesomeIcon icon={visual.icon}/>
            </div>
          )}
        </div>
        <div style={{padding:20}}>
          <div style={{fontSize:17,fontWeight:800,marginBottom:10}}>{item.name}</div>
          {val !== null && val !== undefined ? (
            <div style={{marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:12,color:'var(--nx-muted)'}}>Your price</span>
              <span className={`badge ${isFree?'b-green':'b-yellow'}`} style={{fontSize:14,fontWeight:800}}>
                {isFree ? 'FREE' : (typeof val === 'boolean' ? (val?'Yes':'No') : String(val))}
              </span>
            </div>
          ) : item.price ? (
            <div style={{fontSize:22,fontWeight:800,color:'var(--nx-orange)',marginBottom:16}}>₹{Number(item.price).toLocaleString()}</div>
          ) : (
            <div style={{fontSize:12,color:'var(--nx-muted)',marginBottom:16}}>Sign in with a membership tier to see your price</div>
          )}
          <button className="btn btn-p" style={{width:'100%',marginBottom:8}} disabled={already} onClick={onOrder}>
            {already ? <><FontAwesomeIcon icon={faCircleCheck} className="mr-1.5"/>Requested</> : isFree ? <><FontAwesomeIcon icon={faCartShopping} className="mr-1.5"/>Claim Free Item</> : item.price ? <><FontAwesomeIcon icon={faCreditCard} className="mr-1.5"/>Buy Now — ₹{Number(item.price).toLocaleString()}</> : <><FontAwesomeIcon icon={faCartShopping} className="mr-1.5"/>Add to Request</>}
          </button>
          {isHQ && (
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-g" style={{flex:1}} onClick={onEdit}><FontAwesomeIcon icon={faPen} className="mr-1.5"/>Edit</button>
              <button className="btn btn-g" style={{flex:1,color:'#ef4444'}} onClick={onRemove}>Remove</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MerchPage() {
  const me = TokenStore.getUser()
  const canManage = ['franchise','hq_admin','super_admin'].includes(me?.role)
  const isHQ = ['hq_admin','super_admin'].includes(me?.role)

  const [catalog, setCatalog] = useState<any[]>([])
  const [catPage, setCatPage] = useState(1)
  const [catTotal, setCatTotal] = useState<number|null>(0)
  const [catHasMore, setCatHasMore] = useState(false)
  const [viewingProduct, setViewingProduct] = useState<any|null>(null)

  const [myOrders, setMyOrders] = useState<any[]>([])
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersTotal, setOrdersTotal] = useState<number|null>(0)
  const [ordersHasMore, setOrdersHasMore] = useState(false)

  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string|null>(null)  // non-null = edit mode, reuses the same modal/form
  // Multi-photo gap fix — was a single image_url only.
  const MAX_PRODUCT_IMAGES = 3
  const emptyProduct = { id:'', name:'', price:'', image_urls:[] as string[] }
  const [productForm, setProductForm] = useState<any>(emptyProduct)
  const [savingProduct, setSavingProduct] = useState(false)
  const [uploadingProduct, setUploadingProduct] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [view, setView] = useState<'catalog'|'orders'>('catalog')
  const [viewingOrder, setViewingOrder] = useState<any|null>(null)

  const [showOrder, setShowOrder] = useState<any|null>(null)
  // Structured shipping fields — was one plain textarea with no name or
  // phone at all, so a fulfiller had no reliable way to identify or
  // reach the recipient for a physical item.
  const [shipName, setShipName] = useState('')
  const [shipPhone, setShipPhone] = useState('')
  const [address, setAddress] = useState('')
  const [ordering, setOrdering] = useState(false)
  const [zoomImages, setZoomImages] = useState<string[]|null>(null)
  const [zoomStart, setZoomStart] = useState(0)

  const fetchCatalog = async (p = 1) => {
    try {
      const catRes = await MerchAPI.catalog({ page: p, page_size: PAGE_SIZE })
      setCatalog(catRes.items || catRes || [])
      setCatTotal(catRes.total ?? null)
      setCatHasMore(catRes.has_more || false)
      setCatPage(p)
    } catch (e: any) { setError(e.message) }
  }

  const fetchOrders = async (p = 1) => {
    try {
      if (canManage) {
        const allRes = await MerchAPI.listOrders({ page: p, page_size: PAGE_SIZE }).catch(()=>({items:[]}))
        setAllOrders(allRes.items || allRes || [])
        setOrdersTotal(allRes.total ?? null)
        setOrdersHasMore(allRes.has_more || false)
      } else {
        const mineRes = await MerchAPI.myOrders({ page: p, page_size: PAGE_SIZE }).catch(()=>({items:[]}))
        setMyOrders(mineRes.items || mineRes || [])
        setOrdersTotal(mineRes.total ?? null)
        setOrdersHasMore(mineRes.has_more || false)
      }
      setOrdersPage(p)
    } catch (e: any) { setError(e.message) }
  }

  const fetchAll = async () => {
    setLoading(true); setError('')
    try {
      await Promise.all([fetchCatalog(1), fetchOrders(1)])
      // My orders are also needed on the Catalog tab to know which items
      // are already requested, regardless of which tab is active.
      if (canManage) {
        const mineRes = await MerchAPI.myOrders({ page: 1, page_size: 100 }).catch(()=>({items:[]}))
        setMyOrders(mineRes.items || mineRes || [])
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  // Real Firebase Storage upload — same signed-URL pattern used
  // elsewhere (Deal Corner offers, course videos), not a placeholder.
  // Fix: only accepted one File and the input lacked `multiple`, so even
  // selecting 3 photos in the picker only ever uploaded the first one.
  // Same batch-upload pattern already used correctly in Deal Corner.
  const uploadProductPhotos = async (files: FileList) => {
    const remaining = MAX_PRODUCT_IMAGES - productForm.image_urls.length
    if (remaining <= 0) { setMsg(`❌ Max ${MAX_PRODUCT_IMAGES} photos per product`); return }
    const toUpload = Array.from(files).slice(0, remaining)
    setUploadingProduct(true)
    try {
      const uploaded: string[] = []
      for (const file of toUpload) {
        const { upload_url, public_url } = await MerchAPI.getUploadUrl({ filename: file.name, content_type: file.type })
        await fetch(upload_url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
        uploaded.push(public_url)
      }
      setProductForm((f: any) => ({ ...f, image_urls: [...f.image_urls, ...uploaded] }))
      setMsg(`✅ ${uploaded.length} photo${uploaded.length===1?'':'s'} uploaded!`)
    } catch (e: any) { setMsg('❌ Upload failed: ' + e.message) }
    finally { setUploadingProduct(false) }
  }

  const removeProductPhoto = (idx: number) => {
    setProductForm((f: any) => ({ ...f, image_urls: f.image_urls.filter((_: string, i: number) => i !== idx) }))
  }

  const openAddProduct = () => { setEditingProductId(null); setProductForm(emptyProduct); setShowAddProduct(true) }

  // Edit gap fix — the backend's update_product endpoint already existed
  // (PUT /v1/merch/catalog/{id}), but nothing on the frontend ever called
  // it — no Edit button existed anywhere, only Remove. Reuses the same
  // Add Product modal/form; on save this calls updateProduct instead of
  // createProduct.
  const openEditProduct = (item: any) => {
    setEditingProductId(item.id)
    setProductForm({ id: item.id, name: item.name || '', price: item.price ?? '', image_urls: item.image_urls || [] })
    setShowAddProduct(true)
  }

  const saveProduct = async () => {
    if (!productForm.id.trim() || !productForm.name.trim()) { setMsg('❌ Product ID and name are required'); return }
    setSavingProduct(true)
    try {
      if (editingProductId) {
        await MerchAPI.updateProduct(editingProductId, {
          name: productForm.name.trim(),
          price: productForm.price ? Number(productForm.price) : null,
          image_urls: productForm.image_urls,
        })
        setMsg('✅ Product updated')
      } else {
        await MerchAPI.createProduct({
          id: productForm.id.trim().toLowerCase().replace(/\s+/g,'_'),
          name: productForm.name.trim(),
          price: productForm.price ? Number(productForm.price) : null,
          image_urls: productForm.image_urls,
          tier_rules: {},
        })
        setMsg('✅ Product added to catalog!')
      }
      setShowAddProduct(false); setEditingProductId(null); setProductForm(emptyProduct)
      fetchCatalog(catPage)
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSavingProduct(false) }
  }

  const removeProduct = async (id: string) => {
    if (!confirm('Remove this product from the catalog? Past orders referencing it are unaffected.')) return
    try { await MerchAPI.deleteProduct(id); setMsg('✅ Product removed'); setViewingProduct(null); fetchCatalog(catPage) }
    catch (e: any) { setMsg('❌ ' + e.message) }
  }

  const orderedItemIds = myOrders.map(o=>o.item_id)

  const openOrderModal = (item: any) => { setShipName('');setShipPhone('');setAddress('');setViewingProduct(null);setShowOrder(item) }

  const submitOrder = async () => {
    if (!showOrder) return
    if (!shipName.trim() || !shipPhone.trim() || !address.trim()) { setMsg('❌ Name, phone, and address are all required'); return }
    setOrdering(true)
    try {
      const order = await MerchAPI.createOrder({ item_id: showOrder.id, shipping_name: shipName, shipping_phone: shipPhone, shipping_address: address })
      if (order.payment) {
        // Paid item — open real Razorpay checkout (test mode until real
        // keys are set in the backend's .env). The order already exists
        // as "requested" either way; payment success flips it forward.
        openRazorpayCheckout({
          order: order.payment,
          description: `NetworkX Store — ${showOrder.name}`,
          memberName: me?.name, memberEmail: me?.email,
          onSuccess: () => { setMsg('✅ Payment received — order confirmed!'); setShowOrder(null); setShipName('');setShipPhone('');setAddress(''); fetchAll() },
          onFailure: (e) => { setMsg('❌ ' + e.message + ' — your request was saved, you can retry payment from My Orders'); setShowOrder(null); setShipName('');setShipPhone('');setAddress(''); fetchAll() },
        })
      } else {
        setMsg('✅ Requested!')
        setShowOrder(null); setShipName('');setShipPhone('');setAddress('')
        fetchAll()
      }
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setOrdering(false) }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await MerchAPI.updateOrderStatus(id, { status })
      setMsg('✅ Status updated')
      fetchOrders(ordersPage)
      if (viewingOrder?.id === id) setViewingOrder({ ...viewingOrder, status })
    } catch (e: any) { setMsg('❌ ' + e.message) }
  }

  return (
    <div className="page">
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:18,fontWeight:800}}>NetworkX Store</h2>
        <p style={{fontSize:13,color:'#9ca3af'}}>Membership card, sticker, T-shirt & pin — availability depends on your tier</p>
      </div>

      {msg && (
        <div className="toast-in" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,marginBottom:12,fontSize:13,
          background:msg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
          color:msg.startsWith('✅')?'#16a34a':'#ef4444',
          border:`1px solid ${msg.startsWith('✅')?'rgba(39,216,109,.35)':'rgba(255,90,90,.35)'}`}}>
          {msg}<button style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}} onClick={()=>setMsg('')}>✕</button>
        </div>
      )}

      <div style={{display:'flex',gap:6,marginBottom:16,justifyContent:'space-between'}}>
        <div style={{display:'flex',gap:6}}>
          <button className={`btn btn-sm ${view==='catalog'?'btn-p':'btn-g'}`} onClick={()=>setView('catalog')}>Catalog</button>
          <button className={`btn btn-sm ${view==='orders'?'btn-p':'btn-g'}`} onClick={()=>setView('orders')}>{canManage?'All Orders':'My Orders'}</button>
        </div>
        {isHQ && view==='catalog' && <button className="btn btn-p btn-sm" onClick={openAddProduct}>+ Add Product</button>}
      </div>

      {loading ? <Loading label="Loading…"/> : error ? <ApiError message={error} onRetry={fetchAll}/> :
       view === 'catalog' ? (
        catalog.length === 0 ? <Empty label="No products in the catalog yet"/> : (
        <>
        {/* Admin/franchise: tabular, built for scanning and managing many
            SKUs at once. Members: cards, built for browsing a small
            catalog. Both open the same ProductDetailsModal on click. */}
        {canManage ? (
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <table className="tbl">
              <thead><tr>{['Photo','Name','Price','Status',''].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {catalog.map(item=>{
                  const already = orderedItemIds.includes(item.id)
                  const visual = ITEM_VISUAL[item.id] || {icon:faGift, bg:'linear-gradient(135deg,#6366f1,#818cf8)'}
                  return (
                    <tr key={item.id} style={{cursor:'pointer'}} onClick={()=>setViewingProduct(item)}>
                      <td>
                        {item.image_urls?.length > 0 ? (
                          <img src={item.image_urls[0]} alt={item.name} style={{width:44,height:44,objectFit:'cover',borderRadius:8}}/>
                        ) : (
                          <div style={{width:44,height:44,borderRadius:8,background:visual.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'#fff'}}>
                            <FontAwesomeIcon icon={visual.icon}/>
                          </div>
                        )}
                      </td>
                      <td style={{fontSize:13,fontWeight:600}}>{item.name}</td>
                      <td style={{fontSize:13,fontWeight:700}}>{item.price ? `₹${Number(item.price).toLocaleString()}` : '—'}</td>
                      <td>{already ? <span className="badge b-green">You've requested this</span> : null}</td>
                      <td onClick={e=>e.stopPropagation()}>
                        <div style={{display:'flex',gap:4,justifyContent:'flex-end'}}>
                          <button className="btn btn-xs btn-g" onClick={()=>openEditProduct(item)}><FontAwesomeIcon icon={faPen}/></button>
                          <button className="btn btn-xs btn-g" style={{color:'#ef4444'}} onClick={()=>removeProduct(item.id)}>Remove</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16}}>
            {catalog.map(item=>{
              const already = orderedItemIds.includes(item.id)
              const val = item.your_tier_value
              const isFree = item.is_free_for_you
              const visual = ITEM_VISUAL[item.id] || {icon:faGift, bg:'linear-gradient(135deg,#6366f1,#818cf8)'}
              return (
                <div key={item.id} className="card" style={{padding:0,overflow:'hidden',position:'relative',cursor:'pointer'}} onClick={()=>setViewingProduct(item)}>
                  {item.image_urls?.length > 0 ? (
                    <div style={{position:'relative'}}>
                      <img src={item.image_urls[0]} alt={item.name} style={{width:'100%',height:120,objectFit:'cover'}}/>
                      {item.image_urls.length > 1 && (
                        <span style={{position:'absolute',bottom:4,right:4,background:'rgba(0,0,0,.7)',color:'#fff',fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:6}}>
                          +{item.image_urls.length - 1}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{background:visual.bg,height:120,display:'flex',alignItems:'center',justifyContent:'center',fontSize:52}}>
                      <FontAwesomeIcon icon={visual.icon}/>
                    </div>
                  )}
                  <div style={{padding:14}}>
                    <div style={{fontSize:14,fontWeight:700,marginBottom:8,minHeight:36}}>{item.name}</div>
                    {val !== null && val !== undefined ? (
                      <div style={{marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <span style={{fontSize:11,color:'#9ca3af'}}>Your price</span>
                        <span className={`badge ${isFree?'b-green':'b-yellow'}`} style={{fontSize:13,fontWeight:800}}>
                          {isFree ? 'FREE' : (typeof val === 'boolean' ? (val?'Yes':'No') : String(val))}
                        </span>
                      </div>
                    ) : item.price ? (
                      <div style={{fontSize:18,fontWeight:800,color:'var(--nx-orange)',marginBottom:12}}>₹{Number(item.price).toLocaleString()}</div>
                    ) : (
                      <div style={{fontSize:11,color:'#9ca3af',marginBottom:12}}>Sign in with a membership tier to see your price</div>
                    )}
                    <button className="btn btn-p" style={{width:'100%'}} disabled={already} onClick={e=>{e.stopPropagation();openOrderModal(item)}}>
                      {already ? <><FontAwesomeIcon icon={faCircleCheck} className="mr-1.5"/>Requested</> : isFree ? <><FontAwesomeIcon icon={faCartShopping} className="mr-1.5"/>Claim Free Item</> : item.price ? <><FontAwesomeIcon icon={faCreditCard} className="mr-1.5"/>Buy Now — ₹{Number(item.price).toLocaleString()}</> : <><FontAwesomeIcon icon={faCartShopping} className="mr-1.5"/>Add to Request</>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <Pagination page={catPage} pageSize={PAGE_SIZE} total={catTotal} hasMore={catHasMore} loading={loading} onPageChange={fetchCatalog}/>
        </>
        )
       ) : (
        (canManage ? allOrders : myOrders).length === 0 ? <Empty label="No orders yet"/> : (
          <>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
          <table className="tbl">
            <thead><tr>{[canManage?'Member':null,'Item','Shipping To','Status','Free?','Requested'].filter(Boolean).map(h=><th key={h as string}>{h}</th>)}</tr></thead>
            <tbody>
              {(canManage ? allOrders : myOrders).map((o:any)=>(
                <tr key={o.id} style={canManage?{cursor:'pointer'}:{}} onClick={()=>canManage&&setViewingOrder(o)}>
                  {canManage && <td>{o.user?.name || '—'}</td>}
                  <td>{o.item_name}</td>
                  {canManage && (
                    <td style={{fontSize:12}}>
                      <div style={{fontWeight:600}}>{o.shipping_name || '—'}</div>
                      <div style={{color:'var(--nx-muted)'}}>{o.shipping_phone || ''}</div>
                    </td>
                  )}
                  <td onClick={e=>canManage&&e.stopPropagation()}>
                    {canManage ? (
                      <select value={o.status} onChange={e=>updateStatus(o.id, e.target.value)} style={{fontSize:12,padding:'4px 8px'}}>
                        {Object.keys(STATUS_LABEL).map(s=><option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    ) : <span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]||o.status}</span>}
                  </td>
                  <td>{o.is_free ? <FontAwesomeIcon icon={faCircleCheck} className="text-green"/> : '—'}</td>
                  <td>{o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <Pagination page={ordersPage} pageSize={PAGE_SIZE} total={ordersTotal} hasMore={ordersHasMore} loading={loading} onPageChange={fetchOrders}/>
          </>
        )
      )}

      {viewingProduct && (
        <ProductDetailsModal
          item={viewingProduct}
          already={orderedItemIds.includes(viewingProduct.id)}
          isHQ={isHQ}
          onClose={()=>setViewingProduct(null)}
          onOrder={()=>openOrderModal(viewingProduct)}
          onZoom={(images,start)=>{setZoomImages(images);setZoomStart(start)}}
          onEdit={()=>{setViewingProduct(null);openEditProduct(viewingProduct)}}
          onRemove={()=>removeProduct(viewingProduct.id)}
        />
      )}

      {/* Order details popup (admin) — was completely missing: the table
          only ever showed member name + status, never the shipping
          name/phone/address that was the whole point of collecting them.
          A "Shipping To" column above covers the common case at a
          glance; this covers the full address + item + price detail. */}
      {viewingOrder && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setViewingOrder(null)}>
          <div className="modal">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>{viewingOrder.item_name}</h3>
            <p style={{fontSize:12,color:'var(--nx-muted)',marginBottom:14}}>Ordered by {viewingOrder.user?.name || 'a member'}</p>
            <div className="form-grid" style={{marginBottom:14}}>
              <div><div style={{fontSize:11,color:'var(--nx-muted)'}}>Recipient</div><div style={{fontSize:14,fontWeight:600}}>{viewingOrder.shipping_name || '—'}</div></div>
              <div><div style={{fontSize:11,color:'var(--nx-muted)'}}>Phone</div><div style={{fontSize:14,fontWeight:600}}>{viewingOrder.shipping_phone || '—'}</div></div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:'var(--nx-muted)',marginBottom:2}}>Shipping Address</div>
              <div style={{fontSize:13,lineHeight:1.6}}>{viewingOrder.shipping_address || '—'}</div>
            </div>
            <div className="form-grid" style={{marginBottom:14}}>
              <div><div style={{fontSize:11,color:'var(--nx-muted)'}}>Price Charged</div><div style={{fontSize:14,fontWeight:600}}>{viewingOrder.price_charged ? `₹${Number(viewingOrder.price_charged).toLocaleString()}` : 'Free'}</div></div>
              <div><div style={{fontSize:11,color:'var(--nx-muted)'}}>Requested</div><div style={{fontSize:14,fontWeight:600}}>{viewingOrder.created_at ? new Date(viewingOrder.created_at).toLocaleDateString() : '—'}</div></div>
            </div>
            <div className="fg">
              <label>Status</label>
              <select value={viewingOrder.status} onChange={e=>updateStatus(viewingOrder.id, e.target.value)}>
                {Object.keys(STATUS_LABEL).map(s=><option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <button className="btn btn-g" style={{width:'100%',marginTop:8}} onClick={()=>setViewingOrder(null)}>Close</button>
          </div>
        </div>
      )}

      {showOrder && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowOrder(null)}>
          <div className="modal">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>{showOrder.price ? 'Checkout' : 'Request'} — {showOrder.name}</h3>
            {showOrder.price ? (
              <div style={{background:'rgba(255,255,255,.04)',borderRadius:10,padding:14,marginBottom:14}}>
                <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:15}}>
                  <span>Total</span><span style={{color:'var(--nx-orange)'}}>₹{Number(showOrder.price).toLocaleString()}</span>
                </div>
                <div style={{fontSize:11,color:'#9ca3af',marginTop:6}}>Powered by Razorpay · Test mode</div>
              </div>
            ) : (
              <p style={{fontSize:12,color:'#9ca3af',marginBottom:14}}>Included with your membership — no payment needed.</p>
            )}
            <div className="form-grid">
              <div className="fg"><label>Recipient Name *</label><input value={shipName} onChange={e=>setShipName(e.target.value)} placeholder="Who should this be addressed to?"/></div>
              <div className="fg"><label>Phone Number *</label><input value={shipPhone} onChange={e=>setShipPhone(e.target.value)} placeholder="For delivery coordination"/></div>
            </div>
            <div className="fg">
              <label>Shipping Address *</label>
              <textarea rows={3} value={address} onChange={e=>setAddress(e.target.value)} placeholder="Full address, including city, state, and pincode"/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p" style={{flex:1}} onClick={submitOrder} disabled={ordering}>
                {ordering ? 'Processing…' : showOrder.price ? 'Proceed to Payment' : 'Confirm Request'}
              </button>
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowOrder(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {zoomImages && <ImageZoomModal images={zoomImages} startIndex={zoomStart} onClose={()=>setZoomImages(null)}/>}

      {/* ── ADD/EDIT PRODUCT MODAL (HQ only) — real catalog CRUD, no code deploy needed ── */}
      {showAddProduct && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowAddProduct(false)}>
          <div className="modal">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>{editingProductId ? 'Edit Store Product' : 'Add Store Product'}</h3>
            <p style={{fontSize:12,color:'#9ca3af',marginBottom:14}}>{editingProductId ? 'Changes go live immediately.' : 'Goes live in the catalog immediately — no code deploy needed.'}</p>
            <div className="fg">
              <label>Product ID *</label>
              <input value={productForm.id} disabled={!!editingProductId} onChange={e=>setProductForm({...productForm,id:e.target.value})} placeholder="e.g. tote_bag (lowercase, no spaces)"/>
              {editingProductId && <div style={{fontSize:10,color:'var(--nx-muted)',marginTop:3}}>Product ID can't be changed after creation.</div>}
            </div>
            <div className="fg">
              <label>Name *</label>
              <input value={productForm.name} onChange={e=>setProductForm({...productForm,name:e.target.value})} placeholder="Canvas Tote Bag — NetworkX Logo"/>
            </div>
            <div className="fg">
              <label>Price (₹) — optional, set later if tier-gated</label>
              <input type="number" value={productForm.price} onChange={e=>setProductForm({...productForm,price:e.target.value})}/>
            </div>
            <div className="fg">
              <label>Photos ({productForm.image_urls.length}/{MAX_PRODUCT_IMAGES})</label>
              {productForm.image_urls.length > 0 && (
                <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
                  {productForm.image_urls.map((url: string, i: number) => (
                    <div key={url+i} style={{position:'relative',width:84,height:84}}>
                      <img src={url} alt={`Product photo ${i+1}`} style={{width:84,height:84,objectFit:'cover',borderRadius:8,cursor:'zoom-in'}}
                        onClick={()=>{setZoomImages(productForm.image_urls);setZoomStart(i)}}/>
                      <button type="button" className="btn btn-g btn-xs" style={{position:'absolute',top:2,right:2,padding:'1px 5px'}} onClick={()=>removeProductPhoto(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              {productForm.image_urls.length < MAX_PRODUCT_IMAGES && (
                <input type="file" accept="image/*" multiple disabled={uploadingProduct}
                  onChange={e=>e.target.files && e.target.files.length > 0 && uploadProductPhotos(e.target.files)}/>
              )}
              {uploadingProduct && <div style={{fontSize:11,color:'#9ca3af',marginTop:4}}>Uploading…</div>}
            </div>
            <div style={{fontSize:11,color:'#9ca3af',marginBottom:12}}>
              Tier-based free/paid rules can be set afterward via the API — this form covers the common case (a simple priced product).
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p" style={{flex:1}} onClick={saveProduct} disabled={savingProduct || uploadingProduct}>{savingProduct?'Saving…':uploadingProduct?'Uploading photos…':editingProductId?'Save Changes':'Add to Catalog'}</button>
              <button className="btn btn-g" style={{flex:1}} onClick={()=>{setShowAddProduct(false);setEditingProductId(null)}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}