'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faBullseye, faComment, faHandshake, faLocationDot, faPenToSquare,
  faPlane, faCalendarDays, faArrowRight, faWandMagicSparkles, faRoute, faUsers } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react'
import { TravelAPI, TokenStore } from '@/lib/api'
import styles from './travel.module.css'

const INDIAN_CITIES = ['Ahmedabad','Bangalore','Bhopal','Chennai','Delhi','Gurgaon','Hyderabad','Indore','Jaipur','Kochi','Kolkata','Lucknow','Mumbai','Nagpur','Noida','Pune','Surat','Vadodara']
const INTL_CITIES   = ['Dubai','Singapore','London','New York','Toronto','Sydney','Frankfurt','Tokyo','Bangkok','Kuala Lumpur','Hong Kong']
const ALL_CITIES    = [...INDIAN_CITIES, '—', ...INTL_CITIES]
const PURPOSES      = ['Client Meetings','Conference / Summit','Business Development','Personal Travel','Medical','Family','Training','Tourism']

type TravelFormData = {
  from: string
  to: string
  start_date: string
  end_date: string
  purpose: string
  looking_for: string
  notes: string
}

type TravelFormErrors = Partial<Record<keyof TravelFormData, string>>

function travelCompatibility(myTrip:any, candidate:any) {
  if (!myTrip || myTrip.id===candidate.id) return {score:0,reasons:[] as string[]}
  let score=0
  const reasons:string[]=[]
  const destination=(myTrip.to||'').toLowerCase()
  if ((candidate.from||'').toLowerCase()===destination) { score+=45; reasons.push(`Based in your destination: ${myTrip.to}`) }
  else if ((candidate.to||'').toLowerCase()===destination) { score+=30; reasons.push(`Also travelling to ${myTrip.to}`) }
  if (myTrip.purpose&&candidate.purpose===myTrip.purpose) { score+=20; reasons.push(`Shared purpose: ${myTrip.purpose}`) }
  const myStart=myTrip.start_date?new Date(myTrip.start_date).getTime():0
  const myEnd=myTrip.end_date?new Date(myTrip.end_date).getTime():myStart
  const theirStart=candidate.start_date?new Date(candidate.start_date).getTime():0
  const theirEnd=candidate.end_date?new Date(candidate.end_date).getTime():theirStart
  if (myStart&&theirStart&&myStart<=theirEnd&&theirStart<=myEnd) { score+=25; reasons.push('Travel dates overlap') }
  const mine=new Set(`${myTrip.looking_for||''} ${myTrip.purpose||''}`.toLowerCase().match(/[a-z]{4,}/g)||[])
  const theirs=new Set(`${candidate.looking_for||''} ${candidate.user?.profession||''} ${candidate.user?.category||''}`.toLowerCase().match(/[a-z]{4,}/g)||[])
  const shared=[...mine].filter(term=>theirs.has(term))
  if (shared.length) { score+=Math.min(10,shared.length*5); reasons.push(`Relevant interests: ${shared.slice(0,2).join(', ')}`) }
  return {score:Math.min(100,score),reasons}
}

function formatTripDate(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric'}).format(new Date(`${value}T00:00:00`))
}

function formatTripRange(start?: string, end?: string) {
  if (!start) return 'Dates not set'
  if (!end || start===end) return formatTripDate(start)
  const a=new Date(`${start}T00:00:00`), b=new Date(`${end}T00:00:00`)
  if (a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear()) return `${a.getDate()}–${b.getDate()} ${new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric'}).format(b)}`
  return `${formatTripDate(start)} – ${formatTripDate(end)}`
}

function matchBand(score:number) {
  if (score>=70) return {label:'Strong match',tone:'strong'}
  if (score>=50) return {label:'Good match',tone:'good'}
  return {label:'Relevant',tone:'relevant'}
}

const TRAVEL_AI_STAGES = [
  {title:'Mapping your destination network',copy:'Finding verified NetworkX members based in or actively serving your destination.'},
  {title:'Analysing who is relevant to you',copy:'Comparing your goals, industry, capabilities and current business priorities.'},
  {title:'Scanning opportunities and events',copy:'Looking for useful business opportunities and events during your travel dates.'},
  {title:'Building your intelligent trip plan',copy:'Ranking the strongest meetings and arranging a focused suggested agenda.'},
]

// Validates a travel form and returns a map of field -> error message.
// An empty object means the form is valid and safe to submit.
function validateTravelForm(data: TravelFormData): TravelFormErrors {
  const errors: TravelFormErrors = {}
  if (!data.to) errors.to = 'To city is required'
  if (!data.purpose) errors.purpose = 'Purpose of travel is required'
  if (data.start_date && data.end_date && new Date(data.end_date) < new Date(data.start_date)) {
    errors.end_date = 'Return date cannot be before departure date'
  }
  if (data.looking_for && data.looking_for.length > 500) errors.looking_for = 'Keep this under 500 characters'
  if (data.notes && data.notes.length > 500) errors.notes = 'Keep this under 500 characters'
  return errors
}

// Defined OUTSIDE the page component (not nested inside TravelPage) so React
// treats it as a stable component reference across re-renders. Previously
// this was declared inside TravelPage, which recreated the component (and
// its inputs/textareas) on every keystroke, causing the "Looking For" /
// "Additional Notes" textareas to lose focus after each character typed.
function TravelForm({ data, errors, onChange }: {
  data: TravelFormData
  errors: TravelFormErrors
  onChange: (d: TravelFormData) => void
}) {
  return (
    <>
      <div className="form-grid">
        <div className="fg" style={{gridColumn:'1/-1'}}>
          <label>Travelling To *</label>
          <select value={data.to} onChange={e=>onChange({...data,to:e.target.value})}>
            <option value="">— Select destination city —</option>
            <optgroup label="India">{INDIAN_CITIES.map(c=><option key={c}>{c}</option>)}</optgroup>
            <optgroup label="International">{INTL_CITIES.map(c=><option key={c}>{c}</option>)}</optgroup>
          </select>
          {errors.to && <div className="field-error">{errors.to}</div>}
        </div>
        <div className="fg">
          <label>Departure Date</label>
          <input type="date" value={data.start_date||''} onChange={e=>onChange({...data,start_date:e.target.value})}/>
        </div>
        <div className="fg">
          <label>Return Date</label>
          <input type="date" value={data.end_date||''} onChange={e=>onChange({...data,end_date:e.target.value})}/>
          {errors.end_date && <div className="field-error">{errors.end_date}</div>}
        </div>
        <div className="fg" style={{gridColumn:'1/-1'}}>
          <label>Purpose of Travel *</label>
          <select value={data.purpose} onChange={e=>onChange({...data,purpose:e.target.value})}>
            {PURPOSES.map(p=><option key={p}>{p}</option>)}
          </select>
          {errors.purpose && <div className="field-error">{errors.purpose}</div>}
        </div>
      </div>
      <div className="fg">
        <label>Looking For</label>
        <textarea rows={2} value={data.looking_for||''} onChange={e=>onChange({...data,looking_for:e.target.value})}
          placeholder="Introductions to CA firms, co-working space, local members to meet…"/>
        {errors.looking_for && <div className="field-error">{errors.looking_for}</div>}
      </div>
      <div className="fg">
        <label>Additional Notes</label>
        <textarea rows={2} value={data.notes||''} onChange={e=>onChange({...data,notes:e.target.value})}
          placeholder="Flight details, hotel area, preferred meeting times…"/>
        {errors.notes && <div className="field-error">{errors.notes}</div>}
      </div>
    </>
  )
}

export default function TravelPage() {
  const [posts,    setPosts]    = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [msg,      setMsg]      = useState('')
  const [page,     setPage]     = useState(1)
  const [hasMore,  setHasMore]  = useState(false)
  const [cityFilter,  setCityFilter]  = useState('')
  const [purposeFilter,setPurposeFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState<any|null>(null)
  const [saving,   setSaving]   = useState(false)
  const [formErrors,   setFormErrors]   = useState<TravelFormErrors>({})
  const [editErrors,   setEditErrors]   = useState<TravelFormErrors>({})
  const [aiRanking, setAiRanking] = useState(true)
  const [showPast, setShowPast] = useState(false)
  const [intelligence, setIntelligence] = useState<any|null>(null)
  const [intelligenceLoading, setIntelligenceLoading] = useState(false)
  const [intelligenceError, setIntelligenceError] = useState('')
  const [travelAiStage, setTravelAiStage] = useState(0)

  const me = TokenStore.getUser()

  const emptyForm: TravelFormData = {
    from:me?.city || 'Not specified', to:'', start_date:'', end_date:'',
    purpose:'Client Meetings', looking_for:'', notes:''
  }
  const [form, setForm] = useState<TravelFormData>(emptyForm)
  const today = new Date(); today.setHours(0,0,0,0)
  const visiblePosts = posts.filter(t=>showPast || !t.end_date || new Date(t.end_date)>=today)
  const myUpcomingTrip=visiblePosts.filter(t=>t.user_id===me?.id).sort((a,b)=>new Date(a.start_date||0).getTime()-new Date(b.start_date||0).getTime())[0]
  const rankedPosts=visiblePosts.map(post=>({...post,ai_match:travelCompatibility(myUpcomingTrip,post)})).sort((a,b)=>aiRanking?(b.ai_match.score-a.ai_match.score):0)

  const fetchPosts = async (p = 1) => {
    setLoading(true); setError('')
    try {
      const res = await TravelAPI.list({ page: p, page_size: 20 })
      const all = res.items || res
      let filtered = cityFilter
        ? all.filter((t: any) => t.to===cityFilter)
        : all
      if (purposeFilter) filtered = filtered.filter((t: any) => t.purpose===purposeFilter)
      setPosts(filtered)
      setHasMore(res.has_more || false)
      setPage(p)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchPosts(1)
  }, [cityFilter, purposeFilter])

  const loadIntelligence = async (tripId:string) => {
    setIntelligenceLoading(true); setIntelligenceError(''); setTravelAiStage(0); setIntelligence(null)
    const startedAt=Date.now()
    try {
      const result=await TravelAPI.intelligence(tripId)
      const minimumDisplayMs=6500
      const remaining=minimumDisplayMs-(Date.now()-startedAt)
      if (remaining>0) await new Promise(resolve=>window.setTimeout(resolve,remaining))
      setIntelligence(result)
    }
    catch (e:any) { setIntelligence(null); setIntelligenceError(e?.message||'NetworkX AI could not complete this destination plan.') }
    finally { setIntelligenceLoading(false) }
  }

  useEffect(() => {
    if (!myUpcomingTrip?.id) { setIntelligence(null); return }
    loadIntelligence(myUpcomingTrip.id)
  }, [myUpcomingTrip?.id])
  useEffect(() => {
    if (!intelligenceLoading) return
    const timer=window.setInterval(()=>setTravelAiStage(current=>(current+1)%TRAVEL_AI_STAGES.length),4200)
    return ()=>window.clearInterval(timer)
  }, [intelligenceLoading])

  const createPost = async () => {
    const errs = validateTravelForm(form)
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)
    try {
      await TravelAPI.create(form)
      setShowForm(false)
      setForm(emptyForm)
      setFormErrors({})
      setMsg('✅ Travel announced!')
      fetchPosts(1)
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const saveEdit = async () => {
    if (!editing) return
    const errs = validateTravelForm(editing)
    setEditErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)
    try {
      await TravelAPI.update(editing.id, editing)
      setEditing(null)
      setEditErrors({})
      setMsg('✅ Travel post updated!')
      fetchPosts(page)
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const connect = async (id: string, name: string) => {
    try {
      await TravelAPI.connect(id)
      setMsg(`✅ Connection request sent to ${name}!`)
    } catch (e: any) { setMsg('❌ ' + e.message) }
  }

  const deletePost = async (id: string) => {
    if (!confirm('Delete this travel post?')) return
    try {
      await TravelAPI.delete(id)
      setMsg('✅ Travel post deleted')
      fetchPosts(page)
    } catch (e: any) { setMsg('❌ ' + e.message) }
  }

  return (
    <div className="page">
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroKicker}><FontAwesomeIcon icon={faWandMagicSparkles}/> NetworkX Travel Intelligence</div>
          <h1>Every journey.<br/><span>A valuable connection.</span></h1>
          <p>Tell us where you’re going. AI discovers the right members, business opportunities and warm introductions before you arrive.</p>
          <div className={styles.heroActions}><button className={styles.primaryAction} onClick={()=>{setForm(emptyForm);setFormErrors({});setShowForm(true)}}><FontAwesomeIcon icon={faPlane}/> Plan a business trip</button><button className={styles.textAction} onClick={()=>document.getElementById('travel-network')?.scrollIntoView({behavior:'smooth'})}>Explore member travel plans <FontAwesomeIcon icon={faArrowRight}/></button></div>
          <div className={styles.heroTrust}><span>✓ Profile-aware matching</span><span>✓ Explainable recommendations</span><span>✓ Verified members</span></div>
        </div>
        <div className={styles.heroArt} aria-label="3D globe, business aircraft and connected destinations"/>
      </section>
      {!myUpcomingTrip&&<section className={styles.aiBriefing}>
        <div className={styles.aiIcon}><FontAwesomeIcon icon={faWandMagicSparkles}/></div>
        <div className={styles.aiBriefingBody}>
          <span>AI Trip Briefing</span>
          <><h2>Where are you travelling next?</h2><p>Plan a trip and AI will rank the most useful people to meet at your destination.</p></>
        </div>
        <button className="btn btn-p" onClick={()=>{setForm(emptyForm);setFormErrors({});setShowForm(true)}}>Plan my trip</button>
      </section>}
      {myUpcomingTrip&&(
        <section className={styles.intelligencePlan}>
          <div className={styles.planHeader}>
            <div className={styles.planTitleBlock}>
              <div className={styles.planEyebrow}><FontAwesomeIcon icon={faPlane}/> AI trip briefing <b>Live plan</b></div>
              <h2>Travelling to <span>{myUpcomingTrip.to}</span></h2>
              <div className={styles.tripMeta}><span><FontAwesomeIcon icon={faCalendarDays}/>{formatTripRange(myUpcomingTrip.start_date,myUpcomingTrip.end_date)}</span><span><FontAwesomeIcon icon={faBullseye}/>{myUpcomingTrip.purpose||'Business travel'}</span></div>
              <p className={styles.tripSummary}>{intelligence?`${intelligence.summary.recommended_meetings} people worth meeting, selected from ${intelligence.summary.destination_members} destination members.`:'AI is building your destination plan…'}</p>
              <div className={styles.destinationTags}><span>{myUpcomingTrip.purpose||'Business Development'}</span><span>Local connections</span><span>Warm introductions</span></div>
            </div>
            <div className={styles.destinationBrand}><strong>{myUpcomingTrip.to}</strong><span>People · Opportunities · Growth</span></div>
            <div className={styles.heroSummary}>
              <div><strong>{intelligence?.summary?.recommended_meetings??'…'}</strong><span>People worth meeting</span></div>
              <div><strong>{intelligence?.summary?.destination_members??'…'}</strong><span>Destination members</span></div>
              <div><i>✈</i><strong>{myUpcomingTrip.to}</strong><span>Your destination</span></div>
            </div>
            <div className={styles.planHeaderActions}><small>Turn your travel into opportunities</small><div><button className={styles.secondaryHeaderAction} onClick={()=>{setForm(emptyForm);setFormErrors({});setShowForm(true)}}>Plan another trip</button>{intelligence?.members?.[0]&&<button className={styles.outreachButton} onClick={()=>window.location.href=`/dashboard/messages?to=${intelligence.members[0].id}&name=${encodeURIComponent(intelligence.members[0].name)}`}><FontAwesomeIcon icon={faComment}/> Start outreach</button>}<button className={styles.refreshButton} title="Re-run matching using your latest profile and trip details" onClick={()=>loadIntelligence(myUpcomingTrip.id)}><FontAwesomeIcon icon={faWandMagicSparkles}/> Refresh</button></div></div>
          </div>
          {intelligenceLoading?<div className={styles.travelAiSearch} role="status" aria-live="polite">
            <div className={styles.travelIntelligenceVisual} aria-hidden="true"><div className={styles.travelAiCore}><FontAwesomeIcon icon={faPlane}/><span>AI</span></div><i className={styles.travelOrbitOne}/><i className={styles.travelOrbitTwo}/><i className={styles.travelOrbitThree}/><b className={styles.travelNodeOne}/><b className={styles.travelNodeTwo}/><b className={styles.travelNodeThree}/><b className={styles.travelNodeFour}/></div>
            <div className={styles.travelAiCopy}><span className={styles.travelSearchEyebrow}><i/> NetworkX travel intelligence in progress</span><h3>{TRAVEL_AI_STAGES[travelAiStage].title}</h3><p>{TRAVEL_AI_STAGES[travelAiStage].copy}</p><div className={styles.travelSearchSteps}>{TRAVEL_AI_STAGES.map((stage,index)=><span key={stage.title} className={index===travelAiStage?styles.travelActiveStep:index<travelAiStage?styles.travelDoneStep:''}><i>{index<travelAiStage?'✓':index+1}</i>{stage.title}</span>)}</div><small>Creating a destination plan personalised to your profile and travel dates.</small></div>
          </div>:intelligence?(
            <>
              <div className={styles.planStats}>
                <div className={styles.statBlue}><i>👥</i><strong>{intelligence.summary.recommended_meetings}</strong><span>People to meet</span><small>From {intelligence.summary.destination_members} local members</small></div>
                <div className={`${styles.statViolet} ${!intelligence.summary.potential_clients?styles.zeroStat:''}`}><i>⭐</i><strong>{intelligence.summary.potential_clients}</strong><span>Potential clients</span><small>{intelligence.summary.potential_clients?'Strong business fit':'No strong client fit yet'}</small></div>
                <div className={`${styles.statOrange} ${!intelligence.summary.opportunities?styles.zeroStat:''}`}><i>🤝</i><strong>{intelligence.summary.opportunities}</strong><span>Open opportunities</span><small>{intelligence.summary.opportunities?'Relevant to your profile':'Nothing relevant right now'}</small></div>
                <div className={`${styles.statGreen} ${!intelligence.summary.events?styles.zeroStat:''}`}><i>📅</i><strong>{intelligence.summary.events}</strong><span>Events during trip</span><small>{intelligence.summary.events?'Within your travel dates':'No scheduled events yet'}</small></div>
              </div>
              <div className={styles.planGrid}>
                <div className={styles.planPanel}>
                  <div className={styles.panelTitle}><div><span>People worth meeting</span><p>AI-selected for this specific trip</p></div><small title="Selected above the relevance threshold using profile fit, business intent and destination presence">ⓘ {intelligence.summary.recommended_meetings} of {intelligence.summary.destination_members} selected</small></div>
                  <div className={styles.memberList}>{intelligence.members.length?intelligence.members.map((member:any)=><article key={member.id} className={styles.memberRow}>
                    <div className={styles.memberAvatar}>{member.avatar_url?<img src={member.avatar_url} alt=""/>:member.name?.charAt(0)}</div>
                    <div className={styles.memberInfo}><em className={styles.relationship}>{member.relationship.replaceAll('_',' ')}</em><strong>{member.name}</strong><span>{member.designation||member.category||member.city}{member.city?` · ${member.city}`:''}</span>{member.company&&<b className={styles.memberCompany}>▥ {member.company}</b>}<div className={styles.memberTags}><small>{member.category||'Business networking'}</small><small>{member.relationship.replaceAll('_',' ')}</small><small>{myUpcomingTrip.to}</small></div><p className={styles.reasonSentence}><FontAwesomeIcon icon={faWandMagicSparkles}/> Relevant because {member.reasons?.slice(0,2).join(' and ').toLowerCase()}.</p></div>
                    <div className={`${styles.scoreRing} ${styles[matchBand(member.score).tone]}`} style={{'--score':`${member.score * 3.6}deg`} as any}><strong>{member.score}%</strong><span>{matchBand(member.score).label}</span></div>
                    <div className={styles.memberActions}><button onClick={()=>window.location.href=`/dashboard/profile?user=${member.id}`}>View profile</button><button onClick={()=>window.location.href=`/dashboard/messages?to=${member.id}&name=${encodeURIComponent(member.name)}`}><FontAwesomeIcon icon={faComment}/> Message</button></div>
                  </article>):<div className={styles.emptyPlan}>No members crossed the recommendation threshold for this trip.</div>}</div>
                  {intelligence.additional_matches>0&&<div className={styles.additional}>{intelligence.additional_matches} more qualified match{intelligence.additional_matches===1?'':'es'} available to explore</div>}
                </div>
                <div className={styles.planPanel}>
                  <div className={styles.panelTitle}><div><span>Opportunities & events</span><p>Matched to your profile and travel dates</p></div><small>During your visit</small></div>
                  <div className={styles.opportunityTabs}><button className={styles.activeTab}>Opportunities ({intelligence.summary.opportunities})</button><button>Events ({intelligence.summary.events})</button></div>
                  {(intelligence.opportunities?.length||intelligence.events?.length)?[...(intelligence.opportunities||[]).slice(0,2).map((item:any)=>({...item,kind:'Opportunity'})),...(intelligence.events||[]).slice(0,2).map((item:any)=>({...item,kind:'Event'}))].map((item:any)=><div key={`${item.kind}-${item.id}`} className={styles.opportunityRow}><i>{item.kind==='Event'?'📅':'💼'}</i><div><em>{item.kind}{item.match_score?` · ${item.match_score}% match`:''}</em><strong>{item.title}</strong><span>{item.kind==='Event'?(item.venue||item.city):(item.match_reasons?.join(' · ')||item.category)}</span></div><FontAwesomeIcon icon={faArrowRight}/></div>):<div className={styles.inspirationEmpty}><i>⌕</i><strong>No relevant opportunities yet</strong><p>We’ll notify you when opportunities matching your profile become available in {myUpcomingTrip.to}.</p><button onClick={()=>window.location.href='/dashboard/opportunities'}>⌕ Browse opportunities</button></div>}
                </div>
              </div>
              {intelligence.itinerary?.length>0&&<div className={styles.itinerary}><div className={styles.panelTitle}><div><span>Outreach plan</span><p>Suggested sequence—confirm availability directly</p></div><small>No availability assumed</small></div><div className={styles.timeline}>{intelligence.itinerary.map((item:any,index:number)=><div key={`${item.type}-${index}`}><i>{index+1}</i><div><span>Step {index+1} · Flexible time</span><strong>{item.title}</strong><small>Objective: {item.detail}</small></div><button onClick={()=>item.member_id&&(window.location.href=`/dashboard/messages?to=${item.member_id}`)}>Message to schedule</button></div>)}</div></div>}
              {intelligence.breakfast_recommended&&<div className={styles.breakfast}><i>🧠</i><div><span>NetworkX AI recommendation</span><strong>You have enough relevant members for a curated NetworkX Business Breakfast in {myUpcomingTrip.to}.</strong></div><button className="btn btn-p btn-sm">Request breakfast</button></div>}
            </>
          ):<div className={styles.travelAiError}><FontAwesomeIcon icon={faWandMagicSparkles}/><div><strong>Travel intelligence paused</strong><p>{intelligenceError||'The intelligence service is not available yet. Your existing travel matches remain visible below.'}</p></div><button className="btn btn-p btn-sm" onClick={()=>loadIntelligence(myUpcomingTrip.id)}>Try again</button></div>}
        </section>
      )}
      {msg && (
        <div className="toast-in" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,marginBottom:12,fontSize:13,
          background:msg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
          color:msg.startsWith('✅')?'#16a34a':'#ef4444',
          border:`1px solid ${msg.startsWith('✅')?'rgba(39,216,109,.35)':'rgba(255,90,90,.35)'}`}}>
          {msg}<button style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}} onClick={()=>setMsg('')}>✕</button>
        </div>
      )}
      {error && <div style={{background:'rgba(255,90,90,.1)',border:'1px solid rgba(255,90,90,.3)',borderRadius:10,padding:'10px 14px',marginBottom:12,color:'#ef4444',fontSize:13}}>{error}</div>}

      <section className={styles.filters} aria-label="Travel plan filters">
        <div><label>Destination</label><select value={cityFilter} onChange={e=>setCityFilter(e.target.value)}><option value="">All destinations</option><optgroup label="India">{INDIAN_CITIES.map(c=><option key={c}>{c}</option>)}</optgroup><optgroup label="International">{INTL_CITIES.map(c=><option key={c}>{c}</option>)}</optgroup></select></div>
        <div><label>Purpose</label><select value={purposeFilter} onChange={e=>setPurposeFilter(e.target.value)}><option value="">All purposes</option>{PURPOSES.map(p=><option key={p}>{p}</option>)}</select></div>
        <label className={styles.toggle}><input type="checkbox" checked={aiRanking} onChange={e=>setAiRanking(e.target.checked)}/><span>Relevant to me</span></label>
        <label className={styles.toggle}><input type="checkbox" checked={showPast} onChange={e=>setShowPast(e.target.checked)}/><span>Include past trips</span></label>
      </section>

      {/* Travel posts */}
      <div id="travel-network" className={styles.resultsHeading}><div><span><FontAwesomeIcon icon={faUsers}/> Travel network</span><h2>{aiRanking&&myUpcomingTrip?'Relevant travellers and members':'Member travel plans'}</h2></div>{aiRanking&&<div className={styles.rankingNote} title="Ranked using your business goals, industry, offerings, destination and overlapping travel dates"><FontAwesomeIcon icon={faWandMagicSparkles}/> AI ranked <span>How it works</span></div>}</div>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {loading
          ? [...Array(3)].map((_,i)=><div key={i} className="card" style={{height:140,background:'rgba(255,255,255,.06)'}}/>)
          : rankedPosts.length===0
          ? <div className={styles.emptyState}>
              <div style={{fontSize:40,marginBottom:12}}><FontAwesomeIcon icon={faPlane}/></div>
              <strong>{cityFilter?`No active travel plans for ${cityFilter}`:'No active member travel plans yet'}</strong>
              <p>{cityFilter?`Plan a trip to ${cityFilter} and NetworkX AI will find relevant local members, opportunities and events—even when nobody else has announced travel there.`:'Plan a business trip and NetworkX AI will build a destination intelligence plan for you.'}</p>
              <button className="btn btn-p btn-sm" onClick={()=>{setForm({...emptyForm,to:cityFilter});setFormErrors({});setShowForm(true)}}>Plan a business trip</button>
            </div>
          : rankedPosts.map(t=>{
            const isOwn = t.user_id === me?.id
            const isUpcoming = t.start_date && new Date(t.start_date) > new Date()
            return (
              <div key={t.id} className={styles.travelCard} style={{borderLeftColor:isUpcoming?'var(--nx-orange)':'#10b981'}}>
                <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:'#6366f1',
                    display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14,fontWeight:700,flexShrink:0}}>
                    {t.user?.avatar_url ? <img src={t.user.avatar_url} alt={t.user?.name||'Member'} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/> : (t.user?.name?.charAt(0)||'?')}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                      <div>
                        <span style={{fontWeight:700,fontSize:14}}>{t.user?.name||'NetworkX Member'}</span>
                        {isOwn && <span style={{marginLeft:8,fontSize:10,padding:'1px 6px',borderRadius:99,background:'rgba(22,143,255,.1)',color:'#3b82f6',fontWeight:600}}>You</span>}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>{t.ai_match.score>0&&<span className={styles.matchScore} title={t.ai_match.reasons.join(' · ')}><FontAwesomeIcon icon={faWandMagicSparkles}/> {t.ai_match.score}% match</span>}<span style={{fontSize:11,color:'#9ca3af'}}>{t.created_at?new Date(t.created_at).toLocaleDateString():'—'}</span></div>
                    </div>
                    {/* Destination */}
                    <div style={{fontSize:15,marginBottom:4,display:'flex',alignItems:'center',gap:8}}>
                      <span style={{color:'#64748b',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em'}}>Travelling to</span>
                      <span style={{fontWeight:800,color:'var(--nx-orange)'}}><FontAwesomeIcon icon={faLocationDot} className="mr-1"/>{t.to}</span>
                    </div>
                    {/* Dates */}
                    {(t.start_date||t.end_date) && (
                      <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>
                        <FontAwesomeIcon icon={faCalendarDays} className="mr-1"/>{t.start_date?new Date(t.start_date).toLocaleDateString():'?'}
                        {t.end_date ? ` → ${new Date(t.end_date).toLocaleDateString()}` : ''}
                        {isUpcoming && <span style={{marginLeft:8,fontSize:10,padding:'1px 6px',borderRadius:99,background:'rgba(255,75,10,.1)',color:'#c2410c',fontWeight:600}}>Upcoming</span>}
                      </div>
                    )}
                    {/* Purpose */}
                    {t.purpose && <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}><FontAwesomeIcon icon={faBullseye} className="mr-1.5"/>{t.purpose}</div>}
                    {/* Looking for */}
                    {t.looking_for && (
                      <div style={{marginTop:8,background:'rgba(255,255,255,.04)',borderRadius:8,padding:'8px 10px',fontSize:12,color:'#cbd5e1'}}>
                        <span style={{fontWeight:700,color:'#9ca3af',fontSize:10}}>LOOKING FOR: </span>{t.looking_for}
                      </div>
                    )}
                    {/* Notes */}
                    {t.notes && (
                      <div style={{marginTop:4,fontSize:12,color:'#9ca3af'}}><FontAwesomeIcon icon={faPenToSquare} className="mr-1.5"/>{t.notes}</div>
                    )}
                    {t.ai_match.reasons.length>0&&<div className={styles.aiReason}><FontAwesomeIcon icon={faRoute}/><div><strong>Why AI recommends meeting</strong>{t.ai_match.reasons.join(' · ')}</div></div>}
                    {/* Actions */}
                    <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                      {!isOwn && (
                        <>
                          <button className="btn btn-p btn-sm" title="Send a connection request" onClick={()=>connect(t.id,t.user?.name||'member')}><FontAwesomeIcon icon={faHandshake} className="mr-1.5"/>Request connection</button>
                          <button className="btn btn-g btn-sm" onClick={()=>window.location.href=`/dashboard/messages?to=${t.user_id}&name=${encodeURIComponent(t.user?.name||'')}`}><FontAwesomeIcon icon={faComment} className="mr-1.5"/>Message</button>
                        </>
                      )}
                      {isOwn && (
                        <>
                          <button className="btn btn-g btn-sm" style={{color:'#6366f1'}} onClick={()=>{setEditErrors({});setEditing({...t})}}>✏️ Edit</button>
                          <button className="btn btn-g btn-sm" style={{color:'#ef4444'}} onClick={()=>deletePost(t.id)}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        }
      </div>

      {/* Pagination */}
      <div style={{display:'flex',gap:6,justifyContent:'center',marginTop:12}}>
        <button className="btn btn-g btn-sm" disabled={page===1} onClick={()=>fetchPosts(page-1)}><FontAwesomeIcon icon={faArrowLeft} className="mr-1.5"/>Prev</button>
        <span style={{padding:'6px 12px',fontSize:13,color:'#9ca3af'}}>Page {page}</span>
        <button className="btn btn-g btn-sm" disabled={!hasMore} onClick={()=>fetchPosts(page+1)}>Next <FontAwesomeIcon icon={faArrowRight} className="ml-1"/></button>
      </div>

      {/* ── CREATE MODAL ─────────────────────────────────────────────── */}
      {showForm && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal modal-lg">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}><FontAwesomeIcon icon={faPlane} className="mr-1.5"/>Announce Your Travel</h3>
            <TravelForm data={form} errors={formErrors} onChange={setForm}/>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn btn-p" style={{flex:1}} onClick={createPost} disabled={saving}>
                {saving?'Announcing…':'Announce Travel'}
              </button>
              <button className="btn btn-g" style={{flex:1}} onClick={()=>{setShowForm(false);setFormErrors({})}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ───────────────────────────────────────────────── */}
      {editing && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setEditing(null)}>
          <div className="modal modal-lg">
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:14}}>Edit Travel Post</h3>
            <TravelForm data={editing} errors={editErrors} onChange={setEditing}/>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn btn-p" style={{flex:1}} onClick={saveEdit} disabled={saving}>
                {saving?'Saving…':'Save Changes'}
              </button>
              <button className="btn btn-g" style={{flex:1}} onClick={()=>{setEditing(null);setEditErrors({})}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
