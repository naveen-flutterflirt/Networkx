'use client'
import { ReactNode, useEffect, useState } from 'react'
import CompanyPicker from '@/components/ui/CompanyPicker'
import TagInput from '@/components/ui/TagInput'
import { MasterDataAPI } from '@/lib/api'

const INTENTS = ['Clients', 'Partners', 'Vendors', 'Investors', 'Distributors', 'Mentors', 'Employees', 'Other']
const GOALS = ['Generate Leads', 'Build Partnerships', 'Get Referrals', 'Find Vendors', 'Raise Funding', 'Hire Talent', 'Learn / Upskill', 'Expand Globally', 'Invest']
const LIMITS = { headline:120, bio:500, description:500, typical_requirements:500, intent_details:500, capability_details:500 }

const validUrl = (value:string) => {
  if (!value.trim()) return true
  try { const parsed=new URL(/^https?:\/\//i.test(value)?value:`https://${value}`); return !!parsed.hostname.includes('.') }
  catch { return false }
}

export function validateProfileForm(form:any) {
  const errors:Record<string,string> = {}
  for (const key of ['linkedin','website','twitter','instagram','facebook']) if (!validUrl(form[key]||'')) errors[key]='Enter a valid web address, for example https://example.com'
  const values:Record<string,string> = {
    headline:form.headline||'', bio:form.bio||'', description:form.business_profile?.description||'',
    typical_requirements:form.ideal_customer?.typical_requirements||'', intent_details:form.intent?.details||'', capability_details:form.capabilities?.details||'',
  }
  for (const [key,value] of Object.entries(values)) if(value.length > LIMITS[key as keyof typeof LIMITS]) errors[key]=`Use ${LIMITS[key as keyof typeof LIMITS]} characters or fewer`
  return errors
}

function formatUpdated(value:any) {
  if (!value) return ''
  const date = new Date(value?.seconds ? value.seconds*1000 : value)
  return Number.isNaN(date.getTime()) ? '' : `Updated ${date.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}`
}

function Section({icon, title, subtitle, children, open=false, updatedAt}:{icon:string,title:string,subtitle?:string,children:ReactNode,open?:boolean,updatedAt?:any}) {
  return <details className="card profile-edit-section" open={open}>
    <summary aria-label={`${title}. ${subtitle||''}`}><span className="profile-section-icon" aria-hidden="true">{icon}</span><span><strong>{title}</strong>{subtitle&&<small>{subtitle}</small>}</span>{formatUpdated(updatedAt)&&<time className="profile-updated">{formatUpdated(updatedAt)}</time>}<span className="profile-section-chevron" aria-hidden="true">⌄</span></summary>
    <div className="profile-section-body">{children}</div>
  </details>
}

function Choices({items,value,onChange,max}:{items:string[],value:string[],onChange:(v:string[])=>void,max?:number}) {
  return <div className="profile-choice-grid">{items.map(item=>{
    const active=value.includes(item)
    return <button type="button" key={item} aria-pressed={active} className={active?'active':''} onClick={()=>{
      if(active) onChange(value.filter(x=>x!==item)); else if(!max || value.length<max) onChange([...value,item])
    }}>{item}</button>
  })}</div>
}

function CountedTextarea({id,label,value,onChange,limit,placeholder,rows=3,error}:{id:string,label:string,value:string,onChange:(v:string)=>void,limit:number,placeholder:string,rows?:number,error?:string}) {
  const errorId=`${id}-error`
  return <div className="fg"><label htmlFor={id}>{label}</label><textarea id={id} rows={rows} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} aria-invalid={!!error} aria-describedby={`${id}-count${error?' '+errorId:''}`}/><div className={`profile-counter ${value.length>limit?'over':''}`} id={`${id}-count`}>{value.length}/{limit}</div>{error&&<div className="profile-field-error" id={errorId} role="alert">{error}</div>}</div>
}

function UrlField({name,label,value,onChange,error}:{name:string,label:string,value:string,onChange:(v:string)=>void,error?:string}) {
  return <div className="fg"><label htmlFor={`profile-${name}`}>{label}</label><input id={`profile-${name}`} inputMode="url" value={value} onChange={e=>onChange(e.target.value)} placeholder="https://…" aria-invalid={!!error} aria-describedby={error?`profile-${name}-error`:undefined}/>{error&&<div className="profile-field-error" id={`profile-${name}-error`} role="alert">{error}</div>}</div>
}

export default function StructuredProfileSections({form,setForm,timestamps}:{form:any,setForm:(v:any)=>void,timestamps?:any}) {
  const [taxonomy,setTaxonomy]=useState<Record<string,string[]>>({})
  useEffect(()=>{
    let active=true
    Promise.all(['industry','business_goal','relationship_intent','business_type','company_size'].map(async listType=>{
      const result=await MasterDataAPI.get(listType).catch(()=>({items:[]}))
      return [listType,(result.items||[]).map((item:any)=>item.label||item.value).filter(Boolean)] as [string,string[]]
    })).then(entries=>{ if(active) setTaxonomy(Object.fromEntries(entries)) })
    return ()=>{ active=false }
  },[])
  const update=(key:string,value:any)=>setForm({...form,[key]:value})
  const updateMap=(key:string,field:string,value:any)=>update(key,{...(form[key]||{}),[field]:value})
  const business=form.business_profile||{}, ideal=form.ideal_customer||{}, intent=form.intent||{}
  const capabilities=form.capabilities||{}, markets=form.markets||{}, preferences=form.preferences||{}, aiPreferences=form.ai_preferences||{}
  const errors=validateProfileForm(form)
  return <div className="profile-structured-editor">
    <Section icon="👤" title="Basic Information" subtitle="How members recognize and contact you" updatedAt={timestamps?.basic_updated_at} open>
      <div className="profile-consent-note" style={{marginBottom:14}}>Your registered name and location are managed by NetworkX HQ because they determine official member and city-partner reporting.</div>
      <div className="form-grid">
        <div className="fg"><label>Full name</label><input value={timestamps?.name||''} disabled aria-readonly="true" title="Contact NetworkX HQ to change your registered name"/></div>
        <div className="fg"><label htmlFor="profile-headline">Headline</label><input id="profile-headline" value={form.headline||''} onChange={e=>update('headline',e.target.value)} placeholder="Business consultant helping companies scale" aria-invalid={!!errors.headline} aria-describedby="headline-count"/><div className={`profile-counter ${(form.headline||'').length>LIMITS.headline?'over':''}`} id="headline-count">{(form.headline||'').length}/{LIMITS.headline}</div>{errors.headline&&<div className="profile-field-error" role="alert">{errors.headline}</div>}</div>
        <div className="fg"><label>Profession</label><input value={form.profession||''} onChange={e=>update('profession',e.target.value)}/></div>
        <div className="fg"><label>Designation / job title</label><input value={form.designation||''} onChange={e=>update('designation',e.target.value)} placeholder="Founder, CFO, Partner…"/></div>
        <div className="fg"><label>Functional role</label><input value={form.functional_role||''} onChange={e=>update('functional_role',e.target.value)} placeholder="Sales, Finance, Operations…"/></div>
        <div className="fg"><label>Seniority</label><select value={form.seniority||''} onChange={e=>update('seniority',e.target.value)}><option value="">Select</option><option>Owner / Founder</option><option>C-Suite</option><option>Director / VP</option><option>Manager</option><option>Individual Contributor</option><option>Advisor</option></select></div>
        <div className="fg"><label>City</label><input value={form.city||''} disabled aria-readonly="true" title="Contact NetworkX HQ to change your registered city"/></div>
        <div className="fg"><label>State / Province</label><input value={form.state||''} disabled aria-readonly="true" title="Contact NetworkX HQ to change your registered state or province"/></div>
        <div className="fg"><label>Country</label><input value={form.country||''} disabled aria-readonly="true" title="Contact NetworkX HQ to change your registered country"/></div>
        <div className="fg"><label>Time zone</label><input value={form.timezone||''} onChange={e=>update('timezone',e.target.value)} placeholder="Asia/Kolkata"/></div>
      </div>
      <div className="form-grid">
        <TagInput label="Professional interests" field="interests" value={form.interests||[]} onChange={v=>update('interests',v)} placeholder="AI, Export, Sustainability…"/>
        <TagInput label="Languages" field="languages" value={form.languages||[]} onChange={v=>update('languages',v)} placeholder="English, Hindi…"/>
      </div>
      <CountedTextarea id="profile-bio" label="About you" value={form.bio||''} onChange={v=>update('bio',v)} limit={LIMITS.bio} placeholder="A short, specific introduction for other members…"/>
      <div className="form-grid">
        {['linkedin','website','twitter','instagram','facebook'].map(key=><UrlField key={key} name={key} label={key==='twitter'?'Twitter / X':key[0].toUpperCase()+key.slice(1)} value={form[key]||''} onChange={v=>update(key,v)} error={errors[key]}/>) }
      </div>
    </Section>

    <Section icon="💼" title="Business & Expertise" subtitle="What you do and where your experience is strongest" updatedAt={timestamps?.business_profile_updated_at} open>
      <div className="form-grid">
        <CompanyPicker label="Company" value={form.company_id||''} currentName={form.company||''} onChange={(id,company)=>setForm({...form,company_id:id,company:company?.name||form.company})}/>
        <div className="fg"><label htmlFor="profile-industry">Industry</label><input id="profile-industry" list="profile-industry-options" value={business.industry||''} onChange={e=>updateMap('business_profile','industry',e.target.value)} placeholder="Choose or enter an industry"/><datalist id="profile-industry-options">{(taxonomy.industry||[]).map(item=><option value={item} key={item}/>)}</datalist></div>
        <div className="fg"><label>Sub-industry</label><input value={business.sub_industry||''} onChange={e=>updateMap('business_profile','sub_industry',e.target.value)} placeholder="Cybersecurity, Tax Advisory…"/></div>
        <div className="fg"><label>Company size</label><select value={business.company_size||''} onChange={e=>updateMap('business_profile','company_size',e.target.value)}><option value="">Select</option>{Array.from(new Set([...(taxonomy.company_size||[]),business.company_size].filter(Boolean))).map(item=><option key={item}>{item}</option>)}</select></div>
        <div className="fg"><label>Business type</label><select value={business.business_type||''} onChange={e=>updateMap('business_profile','business_type',e.target.value)}><option value="">Select</option>{Array.from(new Set([...(taxonomy.business_type||[]),business.business_type].filter(Boolean))).map(item=><option key={item}>{item}</option>)}</select></div>
      </div>
      <TagInput label="Business categories" field="business_categories" value={business.business_categories||[]} onChange={v=>updateMap('business_profile','business_categories',v)} placeholder="Consulting, SaaS, Manufacturing…"/>
      <TagInput label="Products, services or expertise" field="products_services" value={business.products_services||[]} onChange={v=>updateMap('business_profile','products_services',v)} placeholder="e.g. Tax planning, SaaS, Logistics…"/>
      <CountedTextarea id="business-description" label="Business description" value={business.description||''} onChange={v=>updateMap('business_profile','description',v)} limit={LIMITS.description} placeholder="What problems does your business solve?" error={errors.description}/>
    </Section>

    <Section icon="🎯" title="Ideal Customer" subtitle="Helps members know who to introduce you to" updatedAt={timestamps?.ideal_customer_updated_at}>
      <TagInput label="Target industries" field="ideal_industries" value={ideal.industries||[]} onChange={v=>updateMap('ideal_customer','industries',v)} placeholder="Manufacturing, Healthcare…" suggestedTags={taxonomy.industry||[]}/>
      <TagInput label="Target company sizes" field="ideal_company_sizes" value={ideal.company_sizes||[]} onChange={v=>updateMap('ideal_customer','company_sizes',v)} placeholder="11–50 employees, Enterprise…"/>
      <TagInput label="Decision makers / roles" field="decision_makers" value={ideal.decision_makers||[]} onChange={v=>updateMap('ideal_customer','decision_makers',v)} placeholder="Founder, CFO, Procurement Head…"/>
      <TagInput label="Target geographies" field="ideal_geographies" value={ideal.geographies||[]} onChange={v=>updateMap('ideal_customer','geographies',v)} placeholder="India, UAE, London…"/>
      <CountedTextarea id="typical-requirement" label="Typical requirement" value={ideal.typical_requirements||''} onChange={v=>updateMap('ideal_customer','typical_requirements',v)} limit={LIMITS.typical_requirements} placeholder="Describe a strong-fit customer or introduction…" error={errors.typical_requirements}/>
    </Section>

    <Section icon="🔎" title="What I’m Looking For" subtitle="Clear intent improves discovery and introductions" updatedAt={timestamps?.intent_updated_at}>
      <Choices items={taxonomy.relationship_intent?.length?taxonomy.relationship_intent:INTENTS} value={intent.types||[]} onChange={v=>updateMap('intent','types',v)}/>
      <CountedTextarea id="intent-details" label="More details" value={intent.details||''} onChange={v=>updateMap('intent','details',v)} limit={LIMITS.intent_details} placeholder="Be specific about the introduction, opportunity or support you need…" error={errors.intent_details}/>
    </Section>

    <Section icon="🤝" title="How I Can Help" subtitle="Make your contribution to the network easy to understand" updatedAt={timestamps?.capabilities_updated_at}>
      <TagInput label="Skills, connections and support" field="can_help_with" value={capabilities.tags||[]} onChange={v=>updateMap('capabilities','tags',v)} placeholder="e.g. GST filing, B2B sales, vendor connections…"/>
      <CountedTextarea id="capability-details" label="More details" value={capabilities.details||''} onChange={v=>updateMap('capabilities','details',v)} limit={LIMITS.capability_details} placeholder="Explain how you can help another member…" error={errors.capability_details}/>
    </Section>

    <Section icon="🌍" title="Markets, Goals & Availability" subtitle="Where you operate and how you want to engage" updatedAt={timestamps?.markets_updated_at||timestamps?.goals_updated_at}>
      <div className="form-grid">
        <TagInput label="Markets currently served" field="markets_served" value={markets.currently_served||[]} onChange={v=>updateMap('markets','currently_served',v)} placeholder="India, UAE…"/>
        <TagInput label="Markets you want to enter" field="markets_target" value={markets.wants_to_enter||[]} onChange={v=>updateMap('markets','wants_to_enter',v)} placeholder="UK, Singapore…"/>
      </div>
      <label className="profile-toggle"><input type="checkbox" checked={!!markets.open_international} onChange={e=>updateMap('markets','open_international',e.target.checked)}/> Open to international business</label>
      <label>Primary goals <small>(choose up to 3)</small></label><Choices items={taxonomy.business_goal?.length?taxonomy.business_goal:GOALS} value={form.goals||[]} max={3} onChange={v=>update('goals',v)}/>
      <div className="form-grid">
        <label className="profile-toggle"><input type="checkbox" checked={!!preferences.open_to_referrals} onChange={e=>updateMap('preferences','open_to_referrals',e.target.checked)}/><span><strong>Open to referrals</strong><small>Turn this off to remove yourself from referral-recipient search.</small></span></label>
        <label className="profile-toggle"><input type="checkbox" checked={preferences.open_to_introductions!==false} onChange={e=>updateMap('preferences','open_to_introductions',e.target.checked)}/> Open to introductions</label>
        <label className="profile-toggle"><input type="checkbox" checked={preferences.open_to_meetings!==false} onChange={e=>updateMap('preferences','open_to_meetings',e.target.checked)}/> Open to meetings</label>
        <div className="fg"><label>Preferred communication</label><select value={preferences.preferred_communication||'Platform'} onChange={e=>updateMap('preferences','preferred_communication',e.target.value)}><option>Platform</option><option>WhatsApp</option><option>Email</option><option>Phone</option></select></div>
      </div>
    </Section>

    <Section icon="✨" title="AI & Data Preferences" subtitle="Choose which account information may personalize advanced AI features" updatedAt={timestamps?.ai_preferences_updated_at}>
      <div className="profile-consent-note">AI recommendations should explain why a match was suggested. Private sources remain off unless you explicitly enable them.</div>
      <div className="form-grid">
        <label className="profile-toggle"><input type="checkbox" checked={aiPreferences.use_profile!==false} onChange={e=>updateMap('ai_preferences','use_profile',e.target.checked)}/> Use my profile for matching and recommendations</label>
        <label className="profile-toggle"><input type="checkbox" checked={aiPreferences.use_account_activity!==false} onChange={e=>updateMap('ai_preferences','use_account_activity',e.target.checked)}/> Use my NetworkX activity</label>
        <label className="profile-toggle"><input type="checkbox" checked={!!aiPreferences.use_private_messages} onChange={e=>updateMap('ai_preferences','use_private_messages',e.target.checked)}/> Use private message context</label>
        <label className="profile-toggle"><input type="checkbox" checked={!!aiPreferences.use_crm_contacts} onChange={e=>updateMap('ai_preferences','use_crm_contacts',e.target.checked)}/> Use permitted CRM contacts and leads</label>
      </div>
    </Section>
  </div>
}
