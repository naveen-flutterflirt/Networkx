'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBullseye, faHandshake, faSackDollar, faWandMagicSparkles, faMicrochip, faGlobe, faChartLine, faLocationDot, faPaperPlane, faEllipsis, faBookmark, faThumbsUp, faThumbsDown, faSliders } from '@fortawesome/free-solid-svg-icons'
import { faLinkedinIn } from '@fortawesome/free-brands-svg-icons'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MatchingAPI, ProfileAPI } from '@/lib/api'
import { Loading, ApiError, Empty } from '@/components/shared/States'
import styles from './matching.module.css'

const INTENTS = [
  {id:'general', l:'Find Business Connections', ic:faBullseye, image:'/images/matching/modes/connections.png', desc:'Meet people who need what you offer or can help you grow.'},
  {id:'cofounder', l:'Find a Co-founder', ic:faHandshake, image:'/images/matching/modes/cofounder.png', desc:'Find someone who shares your vision and complements your strengths.'},
  {id:'investor', l:'Connect with Investors', ic:faSackDollar, image:'/images/matching/modes/investors.png', desc:'Discover investors relevant to your business and growth plans.'},
]

const SUGGESTIONS:Record<string,string[]> = {
  general:['New clients','Referral partners','Business partners','Vendors','Mentors','Distributors','Hiring','Investors'],
  cofounder:['Technical co-founder','Business co-founder','Product','Sales & growth','Operations','Finance','Technology','Fundraising'],
  investor:['Angel investors','Venture capital','Strategic investors','Seed funding','Growth capital','Fintech','SaaS','Consumer business'],
}

const AI_SEARCH_MESSAGES = [
  {title:'Reading your business signals',copy:'Understanding your industry, expertise, goals and current priorities.'},
  {title:'Exploring the NetworkX community',copy:'Searching verified member profiles for people who can create mutual value.'},
  {title:'Finding meaningful alignment',copy:'Comparing needs, capabilities, markets and relationship potential.'},
  {title:'Ranking your strongest connections',copy:'Preparing an explainable shortlist—not a random directory.'},
]

export default function MatchingPage() {
  const pathname=usePathname()
  const mode:'business'|'funding'=pathname.includes('/funding-cofounders')?'funding':'business'
  const modes=mode==='funding'?INTENTS.filter(item=>item.id!=='general'):INTENTS.filter(item=>item.id==='general')
  const [intent, setIntent] = useState(mode==='funding'?'cofounder':'general')
  const [profiles, setProfiles] = useState<any[]>([])
  const [memberProfile, setMemberProfile] = useState<any>({})
  const [matches, setMatches] = useState<any[]>([])
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [matchError, setMatchError] = useState('')
  const [searchMessage, setSearchMessage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [sortBy, setSortBy] = useState('best')
  const [locationFilter, setLocationFilter] = useState('')
  const [minimumScore, setMinimumScore] = useState(0)
  const [savedMatches, setSavedMatches] = useState<string[]>([])
  const [hiddenMatches, setHiddenMatches] = useState<string[]>([])
  const [feedback, setFeedback] = useState<Record<string,'up'|'down'>>({})

  const [showEdit, setShowEdit] = useState(false)
  const [tagsInput, setTagsInput] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const myProfile = profiles.find(p => p.intent === intent)

  const fetchAll = async () => {
    setLoading(true); setError('')
    try {
      const [res, profile] = await Promise.all([MatchingAPI.myProfiles(), ProfileAPI.get()])
      setProfiles(res.items || res || [])
      setMemberProfile(profile || {})
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const fetchMatches = async (forIntent: string) => {
    setMatchesLoading(true); setMatchError(''); setSearchMessage(0)
    try {
      const res = await MatchingAPI.matches(forIntent)
      setMatches(res.items || res || [])
    } catch (e:any) {
      setMatches([])
      setMatchError(e?.message || 'NetworkX AI could not complete this search. Please try again.')
    } finally { setMatchesLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])
  useEffect(() => {
    if (!loading) fetchMatches(intent)
  }, [intent, profiles, loading])
  useEffect(() => {
    if (!matchesLoading) return
    const timer=window.setInterval(()=>setSearchMessage(current=>(current+1)%AI_SEARCH_MESSAGES.length),4200)
    return ()=>window.clearInterval(timer)
  }, [matchesLoading])

  const openEdit = () => {
    setTagsInput((myProfile?.tags || []).join(', '))
    setDescription(myProfile?.description || '')
    setShowEdit(true)
  }

  const saveProfile = async () => {
    const tags = tagsInput.split(',').map(t=>t.trim()).filter(Boolean)
    if (tags.length === 0) { setMsg('❌ Add at least one tag'); return }
    setSaving(true)
    try {
      await MatchingAPI.upsertProfile({ intent, tags, description })
      setShowEdit(false)
      setMsg('✅ Profile saved — finding matches…')
      await fetchAll()
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const toggleSuggestion = (suggestion:string) => {
    const values=tagsInput.split(',').map(t=>t.trim()).filter(Boolean)
    const exists=values.some(value=>value.toLowerCase()===suggestion.toLowerCase())
    setTagsInput((exists?values.filter(value=>value.toLowerCase()!==suggestion.toLowerCase()):[...values,suggestion]).join(', '))
  }

  const removeProfile = async () => {
    if (!confirm('Clear your current match request for this category? Your main Profile will still be used for matching.')) return
    try {
      await MatchingAPI.deleteProfile(intent)
      setMsg('✅ Current request cleared — Profile-based matching remains active')
      fetchAll()
    } catch (e: any) { setMsg('❌ ' + e.message) }
  }

  const current = INTENTS.find(i => i.id === intent)!
  const business = memberProfile.business_profile || {}
  const memberIntent = memberProfile.intent || {}
  const capabilities = memberProfile.capabilities || {}
  const markets = memberProfile.markets || {}
  const signalGroups = [
    {label:'Industry', values:[business.industry || memberProfile.category]},
    {label:'Expertise', values:[...(business.products_services || []), ...(capabilities.tags || [])]},
    {label:'Looking for', values:[...(memberIntent.types || [])]},
    {label:'Markets', values:[memberProfile.city, memberProfile.country, ...(markets.currently_served || []), ...(markets.wants_to_enter || [])]},
    {label:'Goals', values:memberProfile.goals || []},
  ].map(group=>({...group,values:[...new Set(group.values.filter(Boolean))]}))
  const missingSignals = signalGroups.filter(group=>group.values.length===0).map(group=>group.label)
  const semanticActive = matches.some(match => match.score_breakdown?.semantic_similarity !== undefined)
  const locations=[...new Set(matches.map(match=>[match.user?.city,match.user?.country].filter(Boolean).join(', ')).filter(Boolean))].sort()
  const visibleMatches=matches
    .filter(match=>!hiddenMatches.includes(match.id))
    .filter(match=>!locationFilter||[match.user?.city,match.user?.country].filter(Boolean).join(', ')===locationFilter)
    .filter(match=>(match.match_score||0)>=minimumScore)
    .sort((a,b)=>sortBy==='name'?(a.user?.name||'').localeCompare(b.user?.name||''):sortBy==='location'?(a.user?.city||'').localeCompare(b.user?.city||''):(b.match_score||0)-(a.match_score||0))

  return (
    <div className={`page ${styles.shell}`}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div>
            <div className={styles.eyebrow}><span>×</span> NetworkX AI</div>
            <h1 className={styles.heroTitle}>{mode==='funding'?'Build the Future.':'The Right People.'}<br/><span>{mode==='funding'?'Find the Right Backing.':'For Your Business.'}</span></h1>
            <p className={styles.heroCopy}>{mode==='funding'?'Meet aligned co-founders and investors who can help turn your vision into a scalable business.':'Tell us what you’re looking for. We’ll find the people who can make it happen.'}</p>
            <div className={styles.heroBenefits}>
              <span><i><FontAwesomeIcon icon={faWandMagicSparkles}/></i> Smarter Connections</span>
              <span><i><FontAwesomeIcon icon={faGlobe}/></i> Global Opportunities</span>
              <span><i><FontAwesomeIcon icon={faChartLine}/></i> Real Business Impact</span>
            </div>
          </div>
        </div>
        <div className={styles.heroSideCopy}>{mode==='funding'?<>SHARED VISION.<br/>SMART CAPITAL.<br/>BIGGER IMPACT.</>:<>REAL PEOPLE.<br/>REAL OPPORTUNITIES.<br/>BIGGER BUSINESS.</>}<span/></div>
      </section>

      {msg && (
        <div className="toast-in" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,marginBottom:12,fontSize:13,
          background:msg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
          color:msg.startsWith('✅')?'#16a34a':'#ef4444',
          border:`1px solid ${msg.startsWith('✅')?'rgba(39,216,109,.35)':'rgba(255,90,90,.35)'}`}}>
          {msg}<button style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}} onClick={()=>setMsg('')}>✕</button>
        </div>
      )}

      <div className={mode==='business'?styles.overviewRow:styles.overviewStack}>
      <div className={`${styles.modes} ${modes.length===1?styles.singleMode:modes.length===2?styles.twoModes:''}`}>
        {modes.map(i=>(
          <div key={i.id} onClick={()=>setIntent(i.id)}
            className={`${styles.mode} ${intent===i.id?styles.modeActive:''}`}>
            <div className={styles.modeArt}><img src={i.image} alt=""/></div>
            <div className={styles.modeBody}><div className={styles.modeName}>{i.l}</div><div className={styles.modeDesc}>{i.desc}</div></div>
            <div className={styles.modeArrow} aria-hidden="true">›</div>
          </div>
        ))}
      </div>

      {loading ? <Loading label="Loading your profiles…"/> : error ? null : (
          <div className={styles.contextGrid}>
          <div className={styles.contextCard}>
            <div className={styles.contextHeader}><div><div className={styles.contextKicker}><FontAwesomeIcon icon={faMicrochip}/> Permanent intelligence layer</div><div className={styles.contextTitle}>Your profile signals</div><div className={styles.contextCopy}>Always used as the foundation for every recommendation.</div></div><Link href="/dashboard/profile" className="btn btn-g btn-sm">Improve Profile</Link></div>
            <div className={styles.signals}>{signalGroups.filter(g=>g.values.length).map(group=><span key={group.label} className={styles.signal}><strong>{group.label}</strong> · {group.values.slice(0,3).join(', ')}</span>)}</div>
            {missingSignals.length>0&&<div className={styles.missing}>Increase match quality: add {missingSignals.join(', ')}</div>}
          </div>
          <div className={`${styles.contextCard} ${styles.requestCard}`}>
            {!myProfile ? (
              <div className={styles.contextHeader}>
                <div><div className={styles.contextKicker}>Live intent layer · Optional</div><div className={styles.contextTitle}>Tell AI what matters now</div><div className={styles.contextCopy}>Add a short-term need to dynamically refine your results.</div></div>
                <button className="btn btn-p btn-sm" onClick={openEdit}>+ Add Current Request</button>
              </div>
            ) : (
              <>
                <div className={styles.contextHeader}>
                  <div>
                    <div className={styles.contextKicker}>Live intent layer · Active</div>
                    <div className={styles.contextTitle}>What you want right now</div>
                    <div className={styles.requestTags}>
                      {myProfile.tags.map((t:string)=><span key={t} className={styles.requestTag}>{t}</span>)}
                    </div>
                    {myProfile.description && <div className={styles.requestText}>{myProfile.description}</div>}
                  </div>
                  <div className={styles.actions}>
                    <button className="btn btn-g btn-sm" onClick={openEdit}>Change</button>
                    <button className="btn btn-g btn-sm" style={{color:'#ef4444'}} onClick={removeProfile}>Clear</button>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>
      )}
      </div>

      {loading ? null : error ? <ApiError message={error} onRetry={fetchAll}/> : (
        <>
          <>
              <div className={styles.resultsHeader}><div><div className={styles.resultsTitle}>People Worth Meeting</div><div className={styles.resultsSub}>{matchesLoading?'NetworkX AI is building your personalised shortlist…':`Handpicked for you by NetworkX AI · ${visibleMatches.length} of ${matches.length} recommendations`}</div></div><span className={styles.aiBadge}><FontAwesomeIcon icon={faWandMagicSparkles}/> {matchesLoading?'AI SEARCH ACTIVE':semanticActive?'SEMANTIC AI':'HYBRID INTELLIGENCE'}</span></div>
              {!matchesLoading&&<div className={styles.filterBar}>
                <span className={styles.filterLabel}><FontAwesomeIcon icon={faSliders}/> Refine matches</span>
                <label>Sort<select value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="best">Best match</option><option value="name">Name</option><option value="location">Location</option></select></label>
                <label>Location<select value={locationFilter} onChange={e=>setLocationFilter(e.target.value)}><option value="">All locations</option>{locations.map(location=><option key={location} value={location}>{location}</option>)}</select></label>
                <label>Confidence<select value={minimumScore} onChange={e=>setMinimumScore(Number(e.target.value))}><option value={0}>Show all</option><option value={25}>25%+</option><option value={40}>40%+</option><option value={60}>60%+</option></select></label>
                {(locationFilter||minimumScore>0||sortBy!=='best')&&<button className={styles.clearFilters} onClick={()=>{setSortBy('best');setLocationFilter('');setMinimumScore(0)}}>Clear filters</button>}
              </div>}
              {matchesLoading ? (
                <div className={styles.aiSearch} role="status" aria-live="polite">
                  <div className={styles.intelligenceVisual} aria-hidden="true">
                    <div className={styles.aiCore}><FontAwesomeIcon icon={faWandMagicSparkles}/><span>AI</span></div>
                    <i className={styles.orbitOne}/><i className={styles.orbitTwo}/><i className={styles.orbitThree}/>
                    <b className={styles.nodeOne}/><b className={styles.nodeTwo}/><b className={styles.nodeThree}/><b className={styles.nodeFour}/>
                  </div>
                  <div className={styles.aiSearchCopy}>
                    <span className={styles.searchEyebrow}><i/> NetworkX intelligence in progress</span>
                    <h3>{AI_SEARCH_MESSAGES[searchMessage].title}</h3>
                    <p>{AI_SEARCH_MESSAGES[searchMessage].copy}</p>
                    <div className={styles.searchSteps}>{AI_SEARCH_MESSAGES.map((message,index)=><span key={message.title} className={index===searchMessage?styles.activeStep:index<searchMessage?styles.doneStep:''}><i>{index<searchMessage?'✓':index+1}</i>{message.title}</span>)}</div>
                    <small>This may take a few moments while we evaluate real profile signals.</small>
                  </div>
                </div>
              ) : matchError ? (
                <div className={styles.matchError}><FontAwesomeIcon icon={faWandMagicSparkles}/><div><strong>AI search paused</strong><p>{matchError}</p></div><button className="btn btn-p btn-sm" onClick={()=>fetchMatches(intent)}>Try again</button></div>
              ) : matches.length === 0 ? (
                <Empty label="No eligible profile matches yet — complete your Profile goals, industry, markets and what you’re looking for to improve recommendations"/>
              ) : visibleMatches.length === 0 ? (
                <Empty label="No matches meet these filters. Clear or lower the filters to see more recommendations."/>
              ) : (
                <div className={styles.matchGrid}>
                  {visibleMatches.map((m:any)=>{
                    const user=m.user||{}
                    const searchText=[...(m.tags||[]),m.description,...(m.match_reasons||[])].join(' ').toLowerCase()
                    const role=intent==='investor'?'Potential Investor':intent==='cofounder'?'Co-founder Match':searchText.includes('referral')?'Referral Partner':searchText.includes('client')?'Potential Client':'Business Connection'
                    const location=[user.city,user.country].filter(Boolean).join(', ')
                    const tags=[...(m.tags||[]),user.category,user.business_profile?.industry].filter((tag,index,array)=>tag&&array.indexOf(tag)===index).slice(0,3)
                    const reason=m.match_reasons?.filter((item:string)=>item&&!item.toLowerCase().includes('current search')).join(' · ')||m.match_reasons?.join(' · ')||m.description||'Their profile, market and current business goals align with what you are looking for.'
                    const confidence=m.match_score>=80?'Strong Match':m.match_score>=60?'Good Match':m.match_score>=40?'Potential Match':'Emerging Match'
                    const scoreDetails=Object.entries(m.score_breakdown||{}).filter(([,points]:any)=>points>0).map(([factor,points])=>`${factor.replaceAll('_',' ')}: ${points}`).join('\n')
                    return <article key={m.id} className={styles.matchCard}>
                      <div className={styles.matchTop}>
                        <div className={styles.avatar}>
                          {user.avatar_url ? <img src={user.avatar_url} alt={user.name||'Member'} /> : (user.name?.charAt(0)||'?')}
                        </div>
                        <div className={styles.memberInfo}>
                          <div className={styles.roleBadge}>{role}</div>
                          <div className={styles.nameRow}><div className={styles.memberName}>{user.name||'NetworkX Member'}</div>{user.linkedin&&<a href={user.linkedin} target="_blank" rel="noopener noreferrer" className={styles.linkedin} aria-label={`${user.name||'Member'} on LinkedIn`}><FontAwesomeIcon icon={faLinkedinIn}/></a>}</div>
                          <div className={styles.memberMeta}>{user.designation||user.profession||user.category||'Business professional'}{user.company&&<><br/><strong>{user.company}</strong></>}</div>
                          {location&&<div className={styles.location}><FontAwesomeIcon icon={faLocationDot}/> {location}</div>}
                        </div>
                        <div className={styles.scoreWrap}>
                          <div className={styles.score} title={scoreDetails||'Calculated from profile, intent and market alignment'} style={{'--score':`${m.match_score}%`} as any}><div className={styles.scoreValue}>{m.match_score}%</div></div>
                          <span className={m.match_score<40?styles.emerging:''}>{confidence}</span>
                        </div>
                      </div>
                      <div className={styles.reason}>
                        <i>💡</i><div><strong>Why you should meet</strong><p>{reason}</p></div>
                      </div>
                      <div className={styles.cardUtility}>
                        <div className={styles.factorRow}>{tags.map((tag:string)=><span key={tag} className={styles.factor}>{tag}</span>)}</div>
                        <div className={styles.feedback} aria-label="Rate this recommendation"><span>Useful?</span><button className={feedback[m.id]==='up'?styles.feedbackActive:''} onClick={()=>setFeedback({...feedback,[m.id]:'up'})} aria-label="Useful recommendation"><FontAwesomeIcon icon={faThumbsUp}/></button><button className={feedback[m.id]==='down'?styles.feedbackActive:''} onClick={()=>setFeedback({...feedback,[m.id]:'down'})} aria-label="Not useful"><FontAwesomeIcon icon={faThumbsDown}/></button></div>
                      </div>
                      <div className={styles.cardFooter}>
                        <button className={styles.messageButton} onClick={()=>window.location.href=`/dashboard/messages?to=${m.user_id}&name=${encodeURIComponent(user.name||'')}`}><FontAwesomeIcon icon={faPaperPlane}/> Start a Conversation</button>
                        <Link href={`/profile?u=${m.user_id}`} className={styles.profileButton}>View Profile</Link>
                        <button className={`${styles.moreButton} ${savedMatches.includes(m.id)?styles.saved:''}`} title={savedMatches.includes(m.id)?'Remove from shortlist':'Save to shortlist'} onClick={()=>setSavedMatches(savedMatches.includes(m.id)?savedMatches.filter(id=>id!==m.id):[...savedMatches,m.id])} aria-label="Save match"><FontAwesomeIcon icon={faBookmark}/></button>
                      </div>
                      <button className={styles.hideMatch} onClick={()=>setHiddenMatches([...hiddenMatches,m.id])} title="Hide this recommendation"><FontAwesomeIcon icon={faEllipsis}/> Hide</button>
                    </article>
                  })}
                </div>
              )}
            </>
        </>
      )}

      {showEdit && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowEdit(false)}>
          <div className="modal">
            <h3 style={{fontSize:18,fontWeight:800,marginBottom:5}}>Who would you like to meet?</h3>
            <p style={{fontSize:12,color:'#64748b',marginBottom:14}}>Choose the type of connection you want. NetworkX combines this request with your industry, expertise, markets and goals from My Profile.</p>
            <div style={{padding:'10px 12px',borderRadius:10,background:'#eff6ff',border:'1px solid #bfdbfe',fontSize:11,color:'#1e40af',marginBottom:14}}>✨ You do not need to repeat your complete profile here. Add only what is important for this particular search.</div>
            <div className="fg">
              <label>What kind of person or opportunity are you seeking? *</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',margin:'7px 0 9px'}}>{SUGGESTIONS[intent].map(suggestion=>{
                const active=tagsInput.split(',').some(value=>value.trim().toLowerCase()===suggestion.toLowerCase())
                return <button type="button" key={suggestion} onClick={()=>toggleSuggestion(suggestion)} className={`badge ${active?'b-blue':'b-gray'}`} style={{cursor:'pointer',padding:'6px 9px',border:active?'1px solid #60a5fa':'1px solid #e2e8f0'}}>{active?'✓ ':''}{suggestion}</button>
              })}</div>
              <label htmlFor="matching-keywords" style={{fontWeight:600}}>Additional keywords <small style={{fontWeight:400,color:'#94a3b8'}}>(optional, separated by commas)</small></label>
              <input id="matching-keywords" value={tagsInput} onChange={e=>setTagsInput(e.target.value)} placeholder="For example: healthcare, Bhopal, export, SaaS"/>
              <small style={{display:'block',color:'#94a3b8',marginTop:5}}>Use specific industries, skills, markets or business needs—not sentences.</small>
            </div>
            <div className="fg">
              <label>Describe your ideal connection</label>
              <textarea rows={4} value={description} onChange={e=>setDescription(e.target.value)} placeholder={intent==='cofounder'?'Example: I am looking for a technical co-founder with SaaS experience who can lead product development.':intent==='investor'?'Example: We are raising seed funding for a B2B healthcare platform and want introductions to relevant angel investors.':'Example: I want to meet retail business owners in Madhya Pradesh who need digital marketing and e-commerce support.'}/>
              <small style={{display:'block',color:'#94a3b8',marginTop:5}}>Mention who, where and why—this helps members understand whether they are a useful match.</small>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p" style={{flex:1}} onClick={saveProfile} disabled={saving}>{saving?'Saving…':'Find My Matches'}</button>
              <button className="btn btn-g" style={{flex:1}} onClick={()=>setShowEdit(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
