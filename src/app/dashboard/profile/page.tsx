'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBriefcase, faHandshake, faLink, faLocationDot, faTrophy, faUser, faCamera,
  faCircleCheck, faClock, faSquare, faStar, faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect, useRef } from 'react'
import { getUser } from '@/lib/auth'
import { ProfileAPI, ConnectionsAPI, TrustAPI, TestimonialsAPI, ContributionAPI } from '@/lib/api'
import { Loading, ApiError } from '@/components/shared/States'
import CompanyPicker from '@/components/ui/CompanyPicker'
import TagInput from '@/components/ui/TagInput'
import StructuredProfileSections, { validateProfileForm } from '@/components/profile/StructuredProfileSections'
// Real fix: this used to define its own 10-field completeness calc
// while the dashboard defined a separate, 9-field one (missing
// can_help_with) — the same member could see two different completion
// percentages depending on which page they were on. Both pages now
// import the one shared calculation.
import { profileCompletionPct as completeness, TRACKED_PROFILE_FIELDS as TRACKED_FIELDS } from '@/lib/profileCompletion'

const profileForm = (p:any) => ({
  bio:p.bio||'', headline:p.headline||p.profession||'', profession:p.profession||'', company:p.company||'', company_id:p.company_id||'',
  designation:p.designation||'', functional_role:p.functional_role||'', seniority:p.seniority||'',
  city:p.city||'', state:p.state||'', category:p.category||'', country:p.country||'', looking_for:p.looking_for||'',
  can_help_with:p.can_help_with||[], open_to_referrals:!!p.open_to_referrals,
  linkedin:p.linkedin||'', website:p.website||'', twitter:p.twitter||'', instagram:p.instagram||'', facebook:p.facebook||'', username:p.username||'',
  business_profile:p.business_profile||{industry:p.category||'',sub_industry:'',business_categories:[],company_size:'',business_type:'',products_services:[],description:''},
  ideal_customer:p.ideal_customer||{industries:[],company_sizes:[],decision_makers:[],geographies:[],typical_requirements:''},
  intent:p.intent||{types:[],details:p.looking_for||''},
  capabilities:p.capabilities||{tags:p.can_help_with||[],details:''},
  markets:p.markets||{currently_served:[],wants_to_enter:[],open_international:false},
  goals:p.goals||[],
  interests:p.interests||[], languages:p.languages||[], timezone:p.timezone||'',
  preferences:{open_to_introductions:true,open_to_meetings:true,preferred_communication:'Platform',...(p.preferences||{}),open_to_referrals:!!p.open_to_referrals},
  ai_preferences:{use_profile:true,use_account_activity:true,use_private_messages:false,use_crm_contacts:false,...(p.ai_preferences||{})},
})

// New — lightweight NetworkX Status reference for My Profile (spec
// section 47). Own small fetch, same pattern as the dashboard
// snapshot — self-contained, doesn't thread through ProfilePage's
// existing (already large) data-loading logic.
function NetworkXStatusReference() {
  const [contribution, setContribution] = useState<any>(null)
  useEffect(() => { ContributionAPI.me().then(setContribution).catch(()=>{}) }, [])
  if (!contribution) return null
  return (
    <div className="card profile-networkx-status-card">
      <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>NetworkX Status</div>
      <div style={{fontSize:16,fontWeight:800,color:'var(--nx-orange)',marginBottom:10}}>{contribution.status}</div>
      <button className="btn btn-g btn-sm" style={{width:'100%'}} onClick={()=>window.location.href='/dashboard/badges-rewards'}>View Badges & Rewards</button>
    </div>
  )
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [clientReady, setClientReady] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)
  const [msg, setMsg] = useState('')
  const [stats, setStats] = useState<any>({connections:0, given:0})
  const [game, setGame] = useState<any>(null)
  const [trust, setTrust] = useState<any>(null)
  const [requestingVerify, setRequestingVerify] = useState(false)
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [givenTestimonials, setGivenTestimonials] = useState<any[]>([])
  const [testimonialTab, setTestimonialTab] = useState<'received'|'given'>('received')
  const [sentRequests, setSentRequests] = useState<any[]>([])
  const [incomingRequests, setIncomingRequests] = useState<any[]>([])
  const [remindingId, setRemindingId] = useState<string | null>(null)
  const [writingFor, setWritingFor] = useState<any>(null)
  const [writeText, setWriteText] = useState('')
  const [writeRating, setWriteRating] = useState(5)
  const [submittingWrite, setSubmittingWrite] = useState(false)
  const [writeModalMsg, setWriteModalMsg] = useState('')
  const [showTestimonialRequest, setShowTestimonialRequest] = useState(false)
  const [myConnections, setMyConnections] = useState<any[]>([])
  const [loadingConnections, setLoadingConnections] = useState(false)
  const [requestedIds, setRequestedIds] = useState<string[]>([])
  const savedFormRef = useRef('')

  const fetchAll = async () => {
    setLoading(true); setError('')
    try {
      // Was 9 separate requests (profile, connections, referrals,
      // gamification, trust, and 4 testimonials calls) fired in
      // parallel from the client. Now 1 request — the backend fans the
      // same 9 calls out server-side via asyncio.gather() and returns
      // them combined.
      const summary = await ProfileAPI.summary()
      const p            = summary.profile
      const userSummary  = summary.user_summary
      const refRes       = summary.referrals
      const gameRes      = summary.gamification
      const trustRes     = summary.trust
      const testimonialsRes = summary.testimonials
      const sentRes      = summary.testimonials_sent
      const incomingRes  = summary.testimonials_requests
      const givenRes     = summary.testimonials_given
      setProfile(p)
      const nextForm = profileForm(p)
      setForm(nextForm); savedFormRef.current = JSON.stringify(nextForm)
      setStats({ connections: userSummary?.connections_count||0, given: refRes.given||0 })
      setGame(gameRes)
      setTrust(trustRes)
      setTestimonials(testimonialsRes || [])
      setSentRequests(sentRes || [])
      setIncomingRequests(incomingRes || [])
      setGivenTestimonials(givenRes || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const requestVerification = async () => {
    setRequestingVerify(true)
    try {
      await TrustAPI.requestVerification({})
      setTrust((t: any) => ({...t, verification_status: 'pending'}))
      setMsg('✅ Verification requested — HQ will review it')
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setRequestingVerify(false) }
  }
  useEffect(() => { setUser(getUser()); setClientReady(true); fetchAll() }, [])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (form && JSON.stringify(form) !== savedFormRef.current) { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [form])

  const save = async () => {
    const validation = validateProfileForm(form)
    if (Object.keys(validation).length) { setMsg('❌ Please fix the highlighted profile fields'); return }
    setSaving(true)
    try {
      // Identity and assigned geography are controlled by HQ because they
      // determine city/state/country reporting and franchise ownership.
      const { name, city, state, country, ...memberEditableForm } = form
      await ProfileAPI.update(memberEditableForm)
      // Was merging `form` into local state and trusting it worked —
      // if the backend silently dropped a field, the UI still showed
      // "saved" until the next reload. Re-fetching the real saved state
      // from the server instead means what you see IS what persisted.
      const fresh = await ProfileAPI.get()
      setProfile(fresh)
      const nextForm = profileForm(fresh)
      setForm(nextForm); savedFormRef.current = JSON.stringify(nextForm)
      setMsg('✅ Profile updated!')
      // Real fix: this only updated this page's own local state — the
      // layout's shared `profile` (sidebar completion bar, topbar
      // avatar/name) never learned the save happened until a full reload.
      // Same event pattern notifications already uses for its count.
      window.dispatchEvent(new Event('nia:profile-updated'))
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  // Upload through our authenticated API rather than asking the browser
  // to PUT directly to Firebase Storage. The latter requires a separate
  // bucket CORS policy and surfaced only "Failed to fetch" when localhost
  // was not allow-listed. The server already owns the storage credentials,
  // so this path is both simpler and consistent across environments.
  const uploadAvatar = async (fileOrBlob: File | Blob, filename: string, contentType: string) => {
    setUploadingAvatar(true)
    try {
      const uploadBlob = fileOrBlob.type === contentType ? fileOrBlob : fileOrBlob.slice(0, fileOrBlob.size, contentType)
      const { avatar_url } = await ProfileAPI.uploadAvatarFile(uploadBlob, filename)
      if (!avatar_url) throw new Error('Photo was stored but no display URL was returned')
      setProfile((prev: any) => ({...prev, avatar_url}))
      window.dispatchEvent(new Event('nia:profile-updated'))
      setMsg('✅ Photo updated!')
    } catch (e: any) { setMsg('❌ Upload failed: ' + e.message) }
    finally { setUploadingAvatar(false) }
  }

  const removeAvatar = async () => {
    setUploadingAvatar(true)
    try {
      await ProfileAPI.uploadAvatar({ blob_path: '' })
      setProfile((prev: any) => ({...prev, avatar_url: ''}))
      window.dispatchEvent(new Event('nia:profile-updated'))
      setMsg('✅ Photo removed')
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setUploadingAvatar(false) }
  }

  // "Adjust photo" — previously there was no way to reposition/zoom a
  // photo before it was saved; picking a file uploaded it immediately
  // as-is. Now file selection opens a crop step (zoom + drag-to-pan on a
  // square canvas) and only the cropped result is uploaded.
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [cropZoom, setCropZoom] = useState(1)
  const [cropPos, setCropPos] = useState({x: 0, y: 0})
  const [pendingMeta, setPendingMeta] = useState<{name:string, type:string} | null>(null)
  const dragRef = useRef<{dragging:boolean, startX:number, startY:number, origX:number, origY:number}>({dragging:false, startX:0, startY:0, origX:0, origY:0})

  const onPickFile = (file: File) => {
    if (!file.type.startsWith('image/')) { setMsg('❌ Please choose an image file'); return }
    const reader = new FileReader()
    reader.onload = () => {
      setPendingImage(reader.result as string)
      setPendingMeta({name: file.name, type: file.type})
      setCropZoom(1); setCropPos({x:0,y:0})
    }
    reader.readAsDataURL(file)
  }

  const confirmCrop = async () => {
    if (!pendingImage || !pendingMeta) return
    const img = new Image()
    img.src = pendingImage
    await new Promise(res => { img.onload = res })
    const SIZE = 320
    const canvas = document.createElement('canvas')
    canvas.width = SIZE; canvas.height = SIZE
    const ctx = canvas.getContext('2d')!
    const scale = Math.max(SIZE / img.width, SIZE / img.height) * cropZoom
    const drawW = img.width * scale, drawH = img.height * scale
    const dx = (SIZE - drawW) / 2 + cropPos.x
    const dy = (SIZE - drawH) / 2 + cropPos.y
    ctx.drawImage(img, dx, dy, drawW, drawH)
    canvas.toBlob(async (blob) => {
      if (!blob) { setMsg('❌ Could not process image'); return }
      await uploadAvatar(blob, pendingMeta.name.replace(/\.\w+$/, '') + '.jpg', 'image/jpeg')
      setPendingImage(null); setPendingMeta(null)
    }, 'image/jpeg', 0.92)
  }

  const onDragStart = (e: React.MouseEvent) => {
    dragRef.current = {dragging:true, startX:e.clientX, startY:e.clientY, origX:cropPos.x, origY:cropPos.y}
  }
  const onDragMove = (e: React.MouseEvent) => {
    if (!dragRef.current.dragging) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setCropPos({x: dragRef.current.origX + dx, y: dragRef.current.origY + dy})
  }
  const onDragEnd = () => { dragRef.current.dragging = false }

  // Query param, not a path segment — this app is statically exported
  // (no SSR), so a dynamic /profile/[username] route can't resolve at
  // request time. /profile?u=<username> works fine as a static page.
  const openTestimonialRequest = async () => {
    setShowTestimonialRequest(true)
    setTestimonialModalMsg('')
    setLoadingConnections(true)
    try {
      const res = await ConnectionsAPI.list('accepted')
      setMyConnections(res.connected || [])
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setLoadingConnections(false) }
  }

  const [testimonialModalMsg, setTestimonialModalMsg] = useState('')
  const [shareModalMsg, setShareModalMsg] = useState('')
  const sendTestimonialRequest = async (authorId: string) => {
    try {
      await TestimonialsAPI.request(authorId)
      setRequestedIds(prev => [...prev, authorId])
      setTestimonialModalMsg('✅ Request sent!')
      setMsg('✅ Request sent!')
      TestimonialsAPI.sent().then(setSentRequests).catch(()=>{})
    } catch (e: any) { setTestimonialModalMsg('❌ ' + e.message); setMsg('❌ ' + e.message) }
  }

  const sendReminder = async (testimonialId: string) => {
    setRemindingId(testimonialId)
    try {
      await TestimonialsAPI.remind(testimonialId)
      setMsg('✅ Reminder sent!')
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setRemindingId(null) }
  }

  const openWriteModal = (req: any) => {
    setWritingFor(req)
    setWriteText('')
    setWriteRating(5)
    setWriteModalMsg('')
  }

  const submitTestimonial = async () => {
    if (!writingFor) return
    if (writeText.trim().length < 10) { setWriteModalMsg('❌ Please write at least 10 characters'); return }
    setSubmittingWrite(true)
    try {
      await TestimonialsAPI.submit(writingFor.id, { text: writeText.trim(), rating: writeRating })
      setIncomingRequests(prev => prev.filter(r => r.id !== writingFor.id))
      TestimonialsAPI.given().then(setGivenTestimonials).catch(()=>{})
      setMsg('✅ Testimonial sent!')
      setWritingFor(null)
    } catch (e: any) { setWriteModalMsg('❌ ' + e.message) }
    finally { setSubmittingWrite(false) }
  }

  // Localhost is useful for previewing, but it is not reachable by anyone
  // else. Always copy the configured public NetworkX origin instead.
  const publicSiteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.networkxcircle.com').replace(/\/$/, '')
  const profileUrl = `${publicSiteOrigin}/profile?u=${profile?.username || user?.id}`
  const localPreviewUrl = typeof window !== 'undefined' ? `${window.location.origin}/profile?u=${profile?.username || user?.id}` : profileUrl
  const copyProfileUrl = () => {
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const shareProfileUrl = async () => {
    if (navigator.share) {
      await navigator.share({ title: `${profile?.name || 'Member'} on NetworkX`, text: `View ${profile?.name || 'this member'}'s NetworkX profile`, url: profileUrl })
    } else {
      copyProfileUrl()
    }
  }

  if (!clientReady) return null
  if (!user) return null
  if (loading) return <div className="page"><Loading label="Loading your profile…"/></div>
  if (error) return <div className="page"><ApiError message={error} onRetry={fetchAll}/></div>

  const pct = profile.profile_strength?.percentage ?? completeness(profile)
  const verificationEligibility = trust?.verification_eligibility
  const canRequestVerification = verificationEligibility?.eligible === true
  const dirty = !!form && JSON.stringify(form) !== savedFormRef.current
  const formErrors = validateProfileForm(form)
  const previewBusiness = form.business_profile || {}
  const previewIdeal = form.ideal_customer || {}
  const previewCapabilities = form.capabilities || {}
  const previewMarkets = form.markets || {}
  const previewPreferences = form.preferences || {}
  const previewServices = previewBusiness.products_services || []
  const previewHelp = previewCapabilities.tags || form.can_help_with || []
  const previewTargets = [...(previewIdeal.industries || []), ...(previewIdeal.decision_makers || []), ...(previewIdeal.geographies || [])].slice(0, 8)
  const previewLinks = [
    form.linkedin && { label: 'LinkedIn', url: form.linkedin },
    form.website && { label: 'Website', url: form.website },
    form.twitter && { label: 'X', url: form.twitter },
    form.instagram && { label: 'Instagram', url: form.instagram },
  ].filter(Boolean) as {label:string,url:string}[]

  return (
    <div className="page profile-page">
      {msg && (
        <div className="toast-in" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,marginBottom:12,fontSize:13,
          background:msg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
          color:msg.startsWith('✅')?'#16a34a':'#ef4444',
          border:`1px solid ${msg.startsWith('✅')?'rgba(39,216,109,.35)':'rgba(255,90,90,.35)'}`}}>
          {msg}<button style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}} onClick={()=>setMsg('')}>✕</button>
        </div>
      )}
      <section className="profile-hero">
        <div className="profile-hero-copy">
          <span>YOUR NETWORKX IDENTITY</span>
          <h1>Build a profile that opens doors.</h1>
          <p>Show members what you do, what you need, and how you can help.</p>
        </div>
        <div className="profile-hero-progress">
          <strong>{pct}%</strong>
          <span>Profile complete</span>
          <div className="prog"><div className="prog-fill" style={{width:`${pct}%`}}/></div>
        </div>
        <img src="/visuals/profile-connections-3d.jpg" alt="" aria-hidden="true"/>
      </section>

      <div className="profile-layout">
        {/* Left panel — real data */}
        <div className="profile-sidebar-column">
          <div className="card profile-identity-card" style={{textAlign:'center',marginBottom:14}}>
            <div className="profile-card-avatar-wrap">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name}/>
              ) : (
                <div className="av">{profile.name?.charAt(0)||'?'}</div>
              )}
              <label className="profile-card-photo-button" style={{cursor:uploadingAvatar?'wait':'pointer'}} title="Change profile photo">
                {uploadingAvatar ? '…' : <FontAwesomeIcon icon={faCamera}/>}
                <input type="file" accept="image/*" disabled={uploadingAvatar} style={{display:'none'}} onChange={e=>{ if(e.target.files?.[0]) onPickFile(e.target.files[0]); e.target.value='' }}/>
              </label>
            </div>
            <div className="profile-card-photo-actions">
              <label style={{cursor:uploadingAvatar?'wait':'pointer'}}><FontAwesomeIcon icon={faCamera}/> Change photo<input type="file" accept="image/*" disabled={uploadingAvatar} style={{display:'none'}} onChange={e=>{ if(e.target.files?.[0]) onPickFile(e.target.files[0]); e.target.value='' }}/></label>
              {profile.avatar_url && <button onClick={removeAvatar} disabled={uploadingAvatar}>Remove</button>}
            </div>
            <div className="profile-card-name">
              {profile.name}
              {trust?.verification_status === 'approved' && <span title="Verified by NetworkX HQ" style={{color:'#168fff',fontSize:15}}><FontAwesomeIcon icon={faCircleCheck}/></span>}
            </div>
            <div className="profile-card-headline">{form.headline || form.profession || 'Add your professional headline'}</div>
            <div className="profile-card-meta"><span><FontAwesomeIcon icon={faBriefcase}/>{form.company || 'Company not set'}</span><i>•</i><span><FontAwesomeIcon icon={faLocationDot}/>{form.city || 'City not set'}</span></div>
            {trust && <div className="profile-card-tenure"><FontAwesomeIcon icon={faClock}/>{trust.tenure_label}</div>}
            <div className="profile-card-stats">
              <div><FontAwesomeIcon icon={faUser}/><strong>{stats.connections}</strong><span>Connections</span></div>
              <div><FontAwesomeIcon icon={faPaperPlane}/><strong>{stats.given}</strong><span>Referrals given</span></div>
              <div><FontAwesomeIcon icon={faStar}/><strong>{game?.points ?? 0}</strong><span>Contribution points</span></div>
            </div>
            <button className="btn btn-sm profile-card-share" onClick={()=>{setShowShare(true); setShareModalMsg('')}}><FontAwesomeIcon icon={faLink}/>Share Profile</button>
            {trust && trust.verification_status !== 'approved' && (
              <button className="btn btn-g btn-sm profile-card-verify" disabled={trust.verification_status==='pending' || requestingVerify || !canRequestVerification} onClick={requestVerification} title={verificationEligibility?.message || ''}>
                {trust.verification_status==='pending' ? <><FontAwesomeIcon icon={faClock} className="mr-1.5"/>Verification Pending</> : canRequestVerification ? <><FontAwesomeIcon icon={faCircleCheck} className="mr-1.5"/>Apply for Trust Badge</> : <><FontAwesomeIcon icon={faCircleCheck} className="mr-1.5"/>Trust Badge Eligibility</>}
              </button>
            )}
            {trust && <div className={`profile-card-verification-state ${trust.verification_status}`}>{trust.verification_status === 'approved' ? 'Verified by NetworkX' : trust.verification_status === 'pending' ? 'Verification under review' : verificationEligibility?.message || 'Not verified'}</div>}
          </div>


          <div className="card profile-completion-card">
            <div style={{fontWeight:700,fontSize:13,marginBottom:10}}><FontAwesomeIcon icon={faTrophy} className="mr-1.5"/>Profile Completion</div>
            <div className="prog" style={{marginBottom:6}}><div className="prog-fill" style={{width:`${pct}%`}}/></div>
            <div style={{fontSize:12,color:'#9ca3af',marginBottom:10}}>{profile.profile_strength?.next_action || `${pct}% complete`}</div>
            {Object.entries(profile.profile_strength?.sections||{}).map(([section,value]:any)=><div key={section} style={{display:'flex',justifyContent:'space-between',gap:8,marginBottom:6,fontSize:12}}><span style={{textTransform:'capitalize'}}>{section.replace(/_/g,' ')}</span><strong>{value}%</strong></div>)}
          </div>

          {/* My Profile keeps only a lightweight status reference. The
              complete level journey and badges live in Badges & Rewards,
              preventing the legacy gamification model from showing a
              second, conflicting member level here. */}
          <NetworkXStatusReference/>
        </div>

        {/* Structured editor. Legacy fields remain mirrored by the backend. */}
        <div className="profile-form-column">
          <StructuredProfileSections form={form} setForm={setForm} timestamps={profile}/>
          <div className="profile-save-bar" aria-live="polite"><span>{dirty?'You have unsaved changes':'All changes saved'}</span><div><button className="btn btn-g" onClick={()=>setShowPreview(true)}>Preview</button><button className="btn btn-p" onClick={save} disabled={saving||!dirty||Object.keys(formErrors).length>0}>{saving?'Saving…':'Save Profile'}</button></div></div>
        </div>
      </div>

      {/* Testimonials — was completely missing before; no backend, no UI */}
      <div className="card profile-testimonials-card" style={{marginTop:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:14}}><FontAwesomeIcon icon={faStar} className="mr-1.5" style={{color:'#f59e0b'}}/>Testimonials</div>
          <button className="btn btn-g btn-sm" onClick={openTestimonialRequest}>Request</button>
        </div>

        <div style={{display:'flex',gap:4,marginBottom:14,borderBottom:'1px solid rgba(255,255,255,.08)'}}>
          <button onClick={()=>setTestimonialTab('received')}
            style={{background:'none',border:'none',cursor:'pointer',padding:'8px 4px',fontSize:12,fontWeight:600,
              color:testimonialTab==='received'?'#fff':'#6b7280',
              borderBottom:testimonialTab==='received'?'2px solid var(--nx-orange)':'2px solid transparent'}}>
            Received {testimonials.length>0 && `(${testimonials.length})`}
          </button>
          <button onClick={()=>setTestimonialTab('given')}
            style={{background:'none',border:'none',cursor:'pointer',padding:'8px 12px',fontSize:12,fontWeight:600,
              color:testimonialTab==='given'?'#fff':'#6b7280',
              borderBottom:testimonialTab==='given'?'2px solid var(--nx-orange)':'2px solid transparent'}}>
            Given {givenTestimonials.length>0 && `(${givenTestimonials.length})`}
            {incomingRequests.length>0 && <span style={{marginLeft:6,background:'#3b82f6',color:'#fff',borderRadius:10,padding:'1px 6px',fontSize:10}}>{incomingRequests.length}</span>}
          </button>
        </div>

        {testimonialTab === 'received' ? (
          <>
            {sentRequests.length > 0 && (
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
                {sentRequests.map(r => (
                  <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.25)',borderRadius:8,padding:'8px 12px'}}>
                    <span style={{fontSize:12,color:'#f59e0b'}}>⏳ Waiting on {r.author_name}</span>
                    <button className="btn btn-g btn-sm" disabled={remindingId===r.id} onClick={()=>sendReminder(r.id)}>
                      {remindingId===r.id ? '…' : 'Send Reminder'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {testimonials.length === 0 ? (
              <p style={{fontSize:12,color:'#9ca3af'}}>No testimonials yet — ask a connection to write one for you.</p>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {testimonials.map(t => (
                  <div key={t.id} style={{background:'rgba(255,255,255,.03)',borderRadius:10,padding:'12px 14px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:13}}>{t.author_name}</div>
                        <div style={{fontSize:11,color:'#9ca3af'}}>
                          {[t.author_profession, t.author_city].filter(Boolean).join(', ')}
                        </div>
                      </div>
                      <div style={{color:'#f59e0b',fontSize:12,whiteSpace:'nowrap'}}>
                        {'★'.repeat(t.rating || 0)}{'☆'.repeat(5 - (t.rating || 0))}
                      </div>
                    </div>
                    <p style={{fontSize:12,color:'#cbd5e1',fontStyle:'italic',lineHeight:1.6}}>"{t.text}"</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {incomingRequests.length > 0 && (
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
                {incomingRequests.map(r => (
                  <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(59,130,246,.06)',border:'1px solid rgba(59,130,246,.25)',borderRadius:8,padding:'8px 12px'}}>
                    <span style={{fontSize:12,color:'#60a5fa'}}>✍️ {r.subject_name} asked you to write a testimonial</span>
                    <button className="btn btn-p btn-sm" onClick={()=>openWriteModal(r)}>Write</button>
                  </div>
                ))}
              </div>
            )}
            {givenTestimonials.length === 0 ? (
              <p style={{fontSize:12,color:'#9ca3af'}}>You haven't written any testimonials yet.</p>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {givenTestimonials.map(t => (
                  <div key={t.id} style={{background:'rgba(255,255,255,.03)',borderRadius:10,padding:'12px 14px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                      <div style={{fontWeight:700,fontSize:13}}>For {t.subject_name}</div>
                      <div style={{color:'#f59e0b',fontSize:12,whiteSpace:'nowrap'}}>
                        {'★'.repeat(t.rating || 0)}{'☆'.repeat(5 - (t.rating || 0))}
                      </div>
                    </div>
                    <p style={{fontSize:12,color:'#cbd5e1',fontStyle:'italic',lineHeight:1.6}}>"{t.text}"</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {writingFor && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget && !submittingWrite && setWritingFor(null)}>
          <div className="modal">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>Write a Testimonial for {writingFor.subject_name}</h3>
            <p style={{fontSize:12,color:'#9ca3af',marginBottom:14}}>This will be shown publicly on their profile.</p>
            <label style={{fontSize:11,color:'#9ca3af'}}>Rating</label>
            <div style={{display:'flex',gap:4,marginBottom:12,fontSize:22}}>
              {[1,2,3,4,5].map(n => (
                <span key={n} style={{cursor:'pointer',color:n<=writeRating?'#f59e0b':'#374151'}} onClick={()=>setWriteRating(n)}>★</span>
              ))}
            </div>
            <label style={{fontSize:11,color:'#9ca3af'}}>Testimonial</label>
            <textarea value={writeText} onChange={e=>setWriteText(e.target.value)} rows={4}
              placeholder={`What was it like working with ${writingFor.subject_name}?`}
              style={{width:'100%',fontSize:13,marginBottom:12,resize:'vertical'}}/>
            {writeModalMsg && (
              <div style={{padding:'8px 12px',borderRadius:8,marginBottom:12,fontSize:12,
                background:writeModalMsg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
                color:writeModalMsg.startsWith('✅')?'#16a34a':'#ef4444',
                border:`1px solid ${writeModalMsg.startsWith('✅')?'rgba(39,216,109,.35)':'rgba(255,90,90,.35)'}`}}>
                {writeModalMsg}
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-g" style={{flex:1}} disabled={submittingWrite} onClick={()=>setWritingFor(null)}>Cancel</button>
              <button className="btn btn-p" style={{flex:1}} disabled={submittingWrite} onClick={submitTestimonial}>
                {submittingWrite ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="profile-preview-title" onClick={e=>e.target===e.currentTarget&&setShowPreview(false)}>
          <div className="modal profile-preview-modal">
            <div className="profile-preview-cover">
              <div className="profile-preview-kicker">HOW MEMBERS SEE YOU</div>
              <button type="button" aria-label="Close preview" onClick={()=>setShowPreview(false)}>×</button>
            </div>
            <div className="profile-preview-content">
              <header className="profile-preview-identity">
                <div className="profile-preview-avatar">
                  {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.name || 'Profile photo'}/> : (profile.name?.charAt(0)||'?')}
                </div>
                <div>
                  <div className="profile-preview-name-row"><h3 id="profile-preview-title">{profile.name}</h3>{trust?.verification_status==='approved'&&<span title="Verified member">✓</span>}</div>
                  <strong>{form.headline||form.profession||'Add a professional headline'}</strong>
                  <p>{[form.designation,form.company].filter(Boolean).join(' at ') || [form.profession,form.company].filter(Boolean).join(' · ')}</p>
                  <small>📍 {[form.city,form.country].filter(Boolean).join(', ')||'Location not set'}</small>
                </div>
                <div className="profile-preview-availability">
                  <span className={previewPreferences.open_to_referrals ? 'active' : ''}>🤝 {previewPreferences.open_to_referrals ? 'Open to referrals' : 'Not accepting referrals'}</span>
                  {previewPreferences.open_to_meetings!==false&&<span>📅 Open to meetings</span>}
                </div>
              </header>

              <div className="profile-preview-proof">
                <span><strong>{stats.connections}</strong>Connections</span>
                <span><strong>{stats.given}</strong>Referrals given</span>
                <span><strong>{game?.points||0}</strong>Contribution points</span>
                <span><strong>{pct}%</strong>Profile strength</span>
              </div>

              {(form.bio||previewBusiness.description)&&<section className="profile-preview-about"><b>ABOUT</b><p>{form.bio||previewBusiness.description}</p></section>}

              <div className="profile-preview-grid">
                {(form.intent?.details||form.looking_for)&&<section className="profile-preview-block looking"><b>🔎 LOOKING FOR</b><p>{form.intent?.details||form.looking_for}</p>{!!form.intent?.types?.length&&<div className="profile-preview-tags neutral">{form.intent.types.map((tag:string)=><i key={tag}>{tag}</i>)}</div>}</section>}
                {(previewCapabilities.details||previewHelp.length>0)&&<section className="profile-preview-block helping"><b>🤝 HOW I CAN HELP</b>{previewCapabilities.details&&<p>{previewCapabilities.details}</p>}<div className="profile-preview-tags">{previewHelp.slice(0,8).map((tag:string)=><i key={tag}>{tag}</i>)}</div></section>}
              </div>

              {(previewServices.length>0||previewTargets.length>0)&&<div className="profile-preview-grid compact">
                {previewServices.length>0&&<section><b>💼 SERVICES & EXPERTISE</b><div className="profile-preview-tags blue">{previewServices.slice(0,8).map((tag:string)=><i key={tag}>{tag}</i>)}</div></section>}
                {previewTargets.length>0&&<section><b>🎯 IDEAL INTRODUCTION</b><div className="profile-preview-tags purple">{previewTargets.map((tag:string)=><i key={tag}>{tag}</i>)}</div>{previewIdeal.typical_requirements&&<p>{previewIdeal.typical_requirements}</p>}</section>}
              </div>}

              {((previewMarkets.currently_served||[]).length>0||(previewMarkets.wants_to_enter||[]).length>0||(form.goals||[]).length>0)&&<section className="profile-preview-footnotes">
                {(previewMarkets.currently_served||[]).length>0&&<span><b>Serving:</b> {previewMarkets.currently_served.join(', ')}</span>}
                {(previewMarkets.wants_to_enter||[]).length>0&&<span><b>Expanding to:</b> {previewMarkets.wants_to_enter.join(', ')}</span>}
                {(form.goals||[]).length>0&&<span><b>Networking goals:</b> {form.goals.join(', ')}</span>}
              </section>}

              <div className="profile-preview-footer">
                <div>{previewLinks.map(link=><a key={link.label} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</div>
                <button className="btn btn-g" onClick={()=>setShowPreview(false)}>Back to editing</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTestimonialRequest && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowTestimonialRequest(false)}>
          <div className="modal">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>Request a Testimonial</h3>
            <p style={{fontSize:12,color:'#9ca3af',marginBottom:14}}>Ask one of your connections to write a testimonial for your profile.</p>
            {testimonialModalMsg && (
              <div style={{padding:'8px 12px',borderRadius:8,marginBottom:12,fontSize:12,
                background:testimonialModalMsg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
                color:testimonialModalMsg.startsWith('✅')?'#16a34a':'#ef4444',
                border:`1px solid ${testimonialModalMsg.startsWith('✅')?'rgba(39,216,109,.35)':'rgba(255,90,90,.35)'}`}}>
                {testimonialModalMsg}
              </div>
            )}
            {loadingConnections ? (
              <Loading compact label="Loading your connections…"/>
            ) : myConnections.length === 0 ? (
              <p style={{fontSize:12,color:'#9ca3af'}}>You don't have any connections yet — connect with other members first.</p>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:280,overflowY:'auto',marginBottom:14}}>
                {myConnections.map((c:any) => (
                  <div key={c.other_user_id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(255,255,255,.03)',borderRadius:8,padding:'8px 12px'}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600}}>{c.user?.name}</div>
                      <div style={{fontSize:11,color:'#9ca3af'}}>{c.user?.city}</div>
                    </div>
                    <button className="btn btn-p btn-sm" disabled={requestedIds.includes(c.other_user_id)}
                      onClick={()=>sendTestimonialRequest(c.other_user_id)}>
                      {requestedIds.includes(c.other_user_id) ? <><FontAwesomeIcon icon={faCircleCheck} className="mr-1"/>Sent</> : <><FontAwesomeIcon icon={faPaperPlane} className="mr-1"/>Ask</>}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-g" style={{width:'100%'}} onClick={()=>setShowTestimonialRequest(false)}>Close</button>
          </div>
        </div>
      )}

      {pendingImage && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget && !uploadingAvatar && setPendingImage(null)}>
          <div className="modal">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>Adjust Photo</h3>
            <p style={{fontSize:12,color:'#9ca3af',marginBottom:14}}>Drag to reposition, use the slider to zoom.</p>
            <div
              onMouseDown={onDragStart} onMouseMove={onDragMove} onMouseUp={onDragEnd} onMouseLeave={onDragEnd}
              style={{width:220,height:220,borderRadius:'50%',overflow:'hidden',margin:'0 auto 14px',position:'relative',cursor:'grab',background:'#111',border:'2px solid var(--nx-panel2)'}}>
              <img src={pendingImage} draggable={false} alt="Preview"
                style={{position:'absolute',top:'50%',left:'50%',
                  transform:`translate(calc(-50% + ${cropPos.x}px), calc(-50% + ${cropPos.y}px)) scale(${cropZoom})`,
                  maxWidth:'none',width:220,pointerEvents:'none'}}/>
            </div>
            <label style={{fontSize:12,color:'#9ca3af'}}>Zoom</label>
            <input type="range" min={1} max={3} step={0.05} value={cropZoom} onChange={e=>setCropZoom(parseFloat(e.target.value))} style={{width:'100%',marginBottom:14}}/>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-g" style={{flex:1}} disabled={uploadingAvatar} onClick={()=>setPendingImage(null)}>Cancel</button>
              <button className="btn btn-p" style={{flex:1}} disabled={uploadingAvatar} onClick={confirmCrop}>{uploadingAvatar?'Uploading…':'Save Photo'}</button>
            </div>
          </div>
        </div>
      )}

      {showShare && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowShare(false)}>
          <div className="modal">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>Share Your Profile</h3>
            <p style={{fontSize:12,color:'#9ca3af',marginBottom:14}}>Anyone with this public link can view your profile — no login required. Your email, phone and private account data are never shown.</p>
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              <input readOnly value={profileUrl} style={{fontSize:12}}/>
              <button className="btn btn-p btn-sm" onClick={copyProfileUrl}>{copied ? <><FontAwesomeIcon icon={faCircleCheck} className="mr-1"/>Copied</> : 'Copy'}</button>
              <button className="btn btn-g btn-sm" onClick={shareProfileUrl}>Share</button>
            </div>
            {typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) && <div style={{padding:'8px 10px',borderRadius:8,marginBottom:12,color:'#49627f',background:'#edf5ff',fontSize:10,lineHeight:1.45}}>You are testing locally. Copy and Share use the public NetworkX domain. <a href={localPreviewUrl} target="_blank" rel="noreferrer" style={{color:'#0868f7',fontWeight:700}}>Open local preview ↗</a></div>}
            <label style={{fontSize:11,color:'#9ca3af'}}>Customize your link</label>
            <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:14}}>
              <span style={{fontSize:12,color:'#6b7280'}}>{publicSiteOrigin}/profile?u=</span>
              <input value={form?.username||''} onChange={e=>setForm({...form,username:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')})} style={{fontSize:12,flex:1}} placeholder={profile?.username}/>
            </div>
            {shareModalMsg && (
              <div style={{padding:'8px 12px',borderRadius:8,marginBottom:12,fontSize:12,
                background:shareModalMsg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
                color:shareModalMsg.startsWith('✅')?'#16a34a':'#ef4444',
                border:`1px solid ${shareModalMsg.startsWith('✅')?'rgba(39,216,109,.35)':'rgba(255,90,90,.35)'}`}}>
                {shareModalMsg}
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowShare(false)}>Close</button>
              {form?.username && form.username !== profile?.username && (
                <button className="btn btn-p" style={{flex:1}} onClick={async ()=>{
                  try { await ProfileAPI.update({username: form.username}); await fetchAll(); setShareModalMsg('✅ Link updated!'); setMsg('✅ Link updated!') }
                  catch(e:any){ setShareModalMsg('❌ ' + e.message); setMsg('❌ ' + e.message) }
                }}>Save Link</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
