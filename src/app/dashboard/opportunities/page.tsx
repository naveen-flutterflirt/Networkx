'use client'
// Growth Vault (internally "opportunities" — rebuilt against the actual
// functional requirements sheet, OPP-01..OPP-07). "Growth Vault" is the
// member-facing name for this feature; the module/route/backend keep the
// "opportunities" name throughout since that's what the requirements
// sheet and existing endpoints are built against — only the display
// title changes here. This replaces the earlier speaking/pitch_practice/
// gem_support/investor_readiness model, which was a best-guess against a
// blank requirements row. See opportunities_service.py for the full
// mapping of each OPP-xx requirement to backend logic.
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBriefcase, faLocationDot, faSackDollar, faCalendarDays, faUsers, faFlag, faBuilding,
  faMagnifyingGlass, faIndustry, faTag, faArrowRight, faCircleCheck,
  faHandshake, faTruck, faChartLine, faPeopleGroup, faScrewdriverWrench, faBoxesStacked, faLayerGroup,
} from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react'
import { OpportunitiesAPI, TokenStore } from '@/lib/api'
import { Loading, ApiError, Empty } from '@/components/shared/States'

// Plain lists for now, not wired to the platform's Master Data module —
// flagged as a good follow-up (would make these admin-configurable like
// other dropdowns in the app) rather than guessed at without confirming
// that module's interface for this specific page.
const CATEGORIES = ['Vendor / Supplier', 'Collaboration', 'Service Requirement', 'Distribution', 'Other']
const FUNDING_CATEGORIES = new Set(['Partnership', 'Investment', 'Funding'])
// Matches the colorful icon-tile treatment from the reference design —
// used both for the "Browse by Category" filter tiles and on each
// opportunity card's category badge, so the same icon means the same
// thing everywhere it shows up.
const CATEGORY_ICONS: Record<string, any> = {
  'Partnership': faHandshake,
  'Vendor / Supplier': faTruck,
  'Investment': faChartLine,
  'Collaboration': faPeopleGroup,
  'Service Requirement': faScrewdriverWrench,
  'Distribution': faBoxesStacked,
  'Other': faLayerGroup,
}
const CATEGORY_COLORS: Record<string, string> = {
  'Partnership': '#ef4444',
  'Vendor / Supplier': '#3b82f6',
  'Investment': '#10b981',
  'Collaboration': '#8b6bff',
  'Service Requirement': '#f59e0b',
  'Distribution': '#06b6d4',
  'Other': '#64748b',
}
const INDUSTRIES = ['Technology', 'Manufacturing', 'Retail', 'Healthcare', 'Finance', 'Real Estate', 'Education', 'Hospitality', 'Logistics', 'Other']

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', active: 'Active', under_discussion: 'Under Discussion',
  closed_won: 'Closed — Won', closed_lost: 'Closed — Lost', archived: 'Archived',
}
const STATUS_COLOR: Record<string, string> = {
  draft: 'b-gray', active: 'b-green', under_discussion: 'b-blue',
  closed_won: 'b-green', closed_lost: 'b-red', archived: 'b-gray',
}
// Mirrors TRANSITIONS in opportunities_service.py exactly — if the backend
// map ever changes, this needs to change with it or the UI will offer
// buttons the server rejects.
const TRANSITIONS: Record<string, string[]> = {
  draft: ['active', 'archived'],
  active: ['under_discussion', 'closed_won', 'closed_lost', 'archived'],
  under_discussion: ['closed_won', 'closed_lost', 'archived'],
  closed_won: ['archived'],
  closed_lost: ['archived'],
  archived: [],
}
const INTEREST_STATES = ['interested', 'shortlisted', 'contacted', 'won', 'lost', 'rejected']
const INTEREST_STATE_LABEL: Record<string, string> = {
  interested: 'Interested', shortlisted: 'Shortlisted', contacted: 'Contacted', won: 'Won', lost: 'Lost', rejected: 'Rejected',
}

function money(n: number, currency = 'INR') {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹'
  return `${symbol}${n.toLocaleString()}`
}

function OpportunityCard({ opp, isOwner, myInterestState, onExpressInterest, onReport, onManage }: {
  opp: any, isOwner: boolean, myInterestState?: string,
  onExpressInterest: (o: any) => void, onReport: (o: any) => void, onManage: (o: any) => void,
}) {
  const canExpressInterest = ['active', 'under_discussion'].includes(opp.status)
  return (
    <div className="card opportunity-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{opp.title}</div>
        <span className={`badge ${STATUS_COLOR[opp.status] || 'b-gray'}`} style={{ flexShrink: 0 }}>{STATUS_LABEL[opp.status] || opp.status}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {opp.category && (
          <span className="badge" style={{ background: `${CATEGORY_COLORS[opp.category] || '#64748b'}22`, color: CATEGORY_COLORS[opp.category] || '#94a3b8' }}>
            <FontAwesomeIcon icon={CATEGORY_ICONS[opp.category] || faTag} className="mr-1"/>{opp.category}
          </span>
        )}
        {opp.industry && <span className="badge b-gray"><FontAwesomeIcon icon={faIndustry} className="mr-1"/>{opp.industry}</span>}
        {opp.geography && <span className="badge b-gray"><FontAwesomeIcon icon={faLocationDot} className="mr-1"/>{opp.geography}</span>}
      </div>
      {opp.description && <div style={{ fontSize: 13, color: 'var(--nx-muted)', lineHeight: 1.5 }}>{opp.description}</div>}
      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--nx-muted)', flexWrap: 'wrap' }}>
        {(opp.budget_min || opp.budget_max) && (
          <span><FontAwesomeIcon icon={faSackDollar} className="mr-1"/>
            {opp.budget_min ? money(opp.budget_min, opp.currency) : '—'}{opp.budget_max ? ` – ${money(opp.budget_max, opp.currency)}` : ''}
          </span>
        )}
        {opp.deadline && <span><FontAwesomeIcon icon={faCalendarDays} className="mr-1"/>Due {opp.deadline}</span>}
        <span><FontAwesomeIcon icon={faUsers} className="mr-1"/>{opp.interest_count || 0} interested</span>
        {opp.user?.name && <span>by {opp.user.name}</span>}
      </div>
      {opp.status === 'closed_won' && opp.closed_value != null && (
        <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>Closed at {money(opp.closed_value, opp.closed_currency)}</div>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        {isOwner ? (
          <button className="btn btn-p btn-sm" onClick={() => onManage(opp)}>Manage</button>
        ) : (
          <>
            <button className="btn btn-p btn-sm" disabled={!!myInterestState || !canExpressInterest} onClick={() => onExpressInterest(opp)}>
              {myInterestState ? `✅ ${INTEREST_STATE_LABEL[myInterestState]}` : canExpressInterest ? 'Express Interest' : 'Closed'}
            </button>
            <button className="btn btn-g btn-sm" onClick={() => onReport(opp)} title="Report"><FontAwesomeIcon icon={faFlag}/></button>
          </>
        )}
      </div>
    </div>
  )
}

export default function OpportunitiesPage() {
  const me = TokenStore.getUser()
  const canModerate = ['franchise', 'hq_admin', 'super_admin'].includes(me?.role)

  const [tab, setTab] = useState<'browse' | 'mine' | 'interests' | 'moderation'>('browse')
  const [items, setItems] = useState<any[]>([])
  const [myInterestMap, setMyInterestMap] = useState<Record<string, string>>({})
  const [myOpps, setMyOpps] = useState<any[]>([])
  const [myInterests, setMyInterests] = useState<any[]>([])
  const [modQueue, setModQueue] = useState<any[]>([])
  const [loadingBrowse, setLoadingBrowse] = useState(true)
  const [loadingMine, setLoadingMine] = useState(true)
  const [loadingInterests, setLoadingInterests] = useState(true)
  const [loadingMod, setLoadingMod] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const [filters, setFilters] = useState({ category: '', industry: '', geography: '', budget_min: '', budget_max: '', q: '' })

  const [showCreate, setShowCreate] = useState(false)
  const emptyForm = { title: '', description: '', category: '', industry: '', geography: '', budget_min: '', budget_max: '', currency: 'INR', deadline: '', response_preference: 'message' }
  const [form, setForm] = useState<any>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [manageOpp, setManageOpp] = useState<any | null>(null)
  const [manageInterests, setManageInterests] = useState<any[]>([])
  const [manageLoading, setManageLoading] = useState(false)
  const [closeValue, setCloseValue] = useState('')
  const [closeCurrency, setCloseCurrency] = useState('INR')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [savingEdit, setSavingEdit] = useState(false)

  const [interestOpp, setInterestOpp] = useState<any | null>(null)
  const [interestNote, setInterestNote] = useState('')
  const [interestCompany, setInterestCompany] = useState('')
  const [expressing, setExpressing] = useState(false)

  const [reportOpp, setReportOpp] = useState<any | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reporting, setReporting] = useState(false)

  const fetchBrowse = async () => {
    setLoadingBrowse(true); setError('')
    try {
      const params: any = {}
      if (filters.category) params.category = filters.category
      if (filters.industry) params.industry = filters.industry
      if (filters.geography) params.geography = filters.geography
      if (filters.budget_min) params.budget_min = Number(filters.budget_min)
      if (filters.budget_max) params.budget_max = Number(filters.budget_max)
      if (filters.q) params.q = filters.q
      const [res, mine] = await Promise.all([
        OpportunitiesAPI.list(params),
        OpportunitiesAPI.myInterests().catch(() => ({ items: [] })),
      ])
      setItems((res.items || res || []).filter((item: any) => !FUNDING_CATEGORIES.has(item.category)))
      const map: Record<string, string> = {}
      ;(mine.items || mine || []).forEach((i: any) => { map[i.opportunity_id] = i.state })
      setMyInterestMap(map)
    } catch (e: any) { setError(e.message) }
    finally { setLoadingBrowse(false) }
  }
  useEffect(() => { if (tab === 'browse') fetchBrowse() }, [tab, filters.category])

  const fetchMine = async () => {
    setLoadingMine(true); setError('')
    try { const res = await OpportunitiesAPI.mine(); setMyOpps((res.items || res || []).filter((item: any) => !FUNDING_CATEGORIES.has(item.category))) }
    catch (e: any) { setError(e.message) }
    finally { setLoadingMine(false) }
  }
  useEffect(() => { if (tab === 'mine') fetchMine() }, [tab])

  const fetchInterests = async () => {
    setLoadingInterests(true); setError('')
    try {
      const res = await OpportunitiesAPI.myInterests()
      setMyInterests((res.items || res || []).filter((item: any) => !FUNDING_CATEGORIES.has(item.opportunity?.category)))
    }
    catch (e: any) { setError(e.message) }
    finally { setLoadingInterests(false) }
  }
  useEffect(() => { if (tab === 'interests') fetchInterests() }, [tab])

  const fetchModQueue = async () => {
    setLoadingMod(true); setError('')
    try { const res = await OpportunitiesAPI.moderationQueue(); setModQueue(res.items || res || []) }
    catch (e: any) { setError(e.message) }
    finally { setLoadingMod(false) }
  }
  useEffect(() => { if (tab === 'moderation' && canModerate) fetchModQueue() }, [tab])

  // Tab badges ("My Postings (N)") need real counts from the moment the
  // page loads — not just after the user happens to click that tab —
  // otherwise they show a stale "(0)" even when postings exist.
  useEffect(() => {
    fetchMine()
    fetchInterests()
    if (canModerate) fetchModQueue()
  }, [])

  const createOpportunity = async (asDraft: boolean) => {
    if (!form.title || !form.category) { setMsg('❌ Title and category are required'); return }
    setSaving(true)
    try {
      await OpportunitiesAPI.create({
        ...form,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        save_as_draft: asDraft,
      })
      setShowCreate(false); setForm(emptyForm)
      setMsg(asDraft ? '✅ Saved as draft' : '✅ Opportunity posted!')
      if (tab === 'mine') fetchMine(); else fetchBrowse()
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  const openManage = async (opp: any) => {
    setManageOpp(opp); setCloseValue(''); setCloseCurrency(opp.currency || 'INR')
    setEditMode(false)
    setEditForm({
      title: opp.title || '', description: opp.description || '', category: opp.category || '',
      industry: opp.industry || '', geography: opp.geography || '',
      budget_min: opp.budget_min ?? '', budget_max: opp.budget_max ?? '',
      deadline: opp.deadline || '', response_preference: opp.response_preference || 'message',
    })
    setManageLoading(true)
    try { const res = await OpportunitiesAPI.listInterests(opp.id); setManageInterests(res.items || res || []) }
    catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setManageLoading(false) }
  }

  const saveEdit = async () => {
    if (!manageOpp) return
    if (!editForm.title || !editForm.category) { setMsg('❌ Title and category are required'); return }
    setSavingEdit(true)
    try {
      const fields = {
        ...editForm,
        budget_min: editForm.budget_min !== '' ? Number(editForm.budget_min) : null,
        budget_max: editForm.budget_max !== '' ? Number(editForm.budget_max) : null,
      }
      await OpportunitiesAPI.update(manageOpp.id, fields)
      setManageOpp((o: any) => ({ ...o, ...fields }))
      setEditMode(false)
      setMsg('✅ Changes saved')
      fetchMine(); fetchBrowse()
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSavingEdit(false) }
  }

  const doTransition = async (status: string) => {
    if (!manageOpp) return
    try {
      await OpportunitiesAPI.transition(manageOpp.id, {
        status,
        value: status === 'closed_won' && closeValue ? Number(closeValue) : undefined,
        currency: status === 'closed_won' ? closeCurrency : undefined,
      })
      setMsg('✅ Status updated')
      setManageOpp((o: any) => ({ ...o, status }))
      fetchMine()
    } catch (e: any) { setMsg('❌ ' + e.message) }
  }

  const setInterestState = async (interestId: string, state: string) => {
    try {
      await OpportunitiesAPI.updateInterestState(interestId, state)
      setManageInterests(prev => prev.map(i => i.id === interestId ? { ...i, state } : i))
    } catch (e: any) { setMsg('❌ ' + e.message) }
  }

  const openInterest = (opp: any) => { setInterestOpp(opp); setInterestNote(''); setInterestCompany('') }
  const submitInterest = async () => {
    if (!interestOpp) return
    setExpressing(true)
    try {
      await OpportunitiesAPI.expressInterest(interestOpp.id, { note: interestNote, company_name: interestCompany })
      setMsg('✅ Interest sent to the owner')
      setInterestOpp(null)
      fetchBrowse()
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setExpressing(false) }
  }

  const openReport = (opp: any) => { setReportOpp(opp); setReportReason('') }
  const submitReport = async () => {
    if (!reportOpp || !reportReason) { setMsg('❌ Please describe the issue'); return }
    setReporting(true)
    try {
      await OpportunitiesAPI.report(reportOpp.id, reportReason)
      setMsg('✅ Reported — our team will review it')
      setReportOpp(null)
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setReporting(false) }
  }

  const moderate = async (reportId: string, action: 'dismiss' | 'remove_opportunity') => {
    try {
      await OpportunitiesAPI.moderate(reportId, action)
      setMsg('✅ Done')
      fetchModQueue()
    } catch (e: any) { setMsg('❌ ' + e.message) }
  }

  return (
    <div className="page growth-vault-page">
      <div className="growth-vault-hero">
        <div className="growth-vault-hero-copy">
          <span className="growth-vault-eyebrow"><FontAwesomeIcon icon={faBriefcase}/> NetworkX Growth Vault</span>
          <h1>Turn business needs into<br/><b>real opportunities.</b></h1>
          <p>Post what your business needs or discover requirements you can fulfil across the NetworkX community.</p>
          <div className="growth-vault-hero-actions">
            <button className="growth-vault-primary" onClick={() => { setForm(emptyForm); setShowCreate(true) }}>+ Post what you need</button>
            <button className="growth-vault-secondary" onClick={() => document.getElementById('growth-vault-browse')?.scrollIntoView({behavior:'smooth'})}>Explore opportunities <FontAwesomeIcon icon={faArrowRight}/></button>
          </div>
          <div className="growth-vault-benefits"><span><FontAwesomeIcon icon={faCircleCheck}/> Find suppliers</span><span><FontAwesomeIcon icon={faCircleCheck}/> Win new business</span><span><FontAwesomeIcon icon={faCircleCheck}/> Build collaborations</span></div>
        </div>
        <div className="growth-vault-hero-visual" aria-label="Business requirements connecting with relevant NetworkX members">
          <div className="growth-vault-core"><FontAwesomeIcon icon={faBriefcase}/><strong>Growth<br/>Vault</strong></div>
          <div className="growth-vault-visual-card card-supplier"><i><FontAwesomeIcon icon={faTruck}/></i><span>Need a supplier</span></div>
          <div className="growth-vault-visual-card card-service"><i><FontAwesomeIcon icon={faScrewdriverWrench}/></i><span>Offer a service</span></div>
          <div className="growth-vault-visual-card card-collab"><i><FontAwesomeIcon icon={faPeopleGroup}/></i><span>Find collaborators</span></div>
          <div className="growth-vault-visual-card card-distribution"><i><FontAwesomeIcon icon={faBoxesStacked}/></i><span>Grow distribution</span></div>
          <div className="growth-vault-result"><FontAwesomeIcon icon={faHandshake}/><span><b>Relevant matches</b><small>Discover · Respond · Grow</small></span></div>
        </div>
      </div>

      {msg && (
        <div className="toast-in" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12, padding: '10px 14px', borderRadius: 10, marginBottom: 12, fontSize: 13,
          background: msg.startsWith('✅') ? 'rgba(39,216,109,.1)' : 'rgba(255,90,90,.1)',
          color: msg.startsWith('✅') ? '#16a34a' : '#ef4444',
          border: `1px solid ${msg.startsWith('✅') ? 'rgba(39,216,109,.35)' : 'rgba(255,90,90,.35)'}` }}>
          {msg}<button style={{ flexShrink:0,background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nx-muted)' }} onClick={() => setMsg('')}>✕</button>
        </div>
      )}

      <div className="tab-bar growth-vault-tabs">
        <button className={`tab-btn${tab === 'browse' ? ' active' : ''}`} onClick={() => setTab('browse')}>Browse</button>
        <button className={`tab-btn${tab === 'mine' ? ' active' : ''}`} onClick={() => setTab('mine')}>My Postings ({myOpps.length})</button>
        <button className={`tab-btn${tab === 'interests' ? ' active' : ''}`} onClick={() => setTab('interests')}>My Interests ({myInterests.length})</button>
        {canModerate && <button className={`tab-btn${tab === 'moderation' ? ' active' : ''}`} onClick={() => setTab('moderation')}>Moderation{modQueue.length > 0 ? ` (${modQueue.length})` : ''}</button>}
      </div>

      {tab === 'browse' && (
        <div id="growth-vault-browse" className="growth-vault-categories" style={{ marginBottom: 16 }}>
          <div className="growth-vault-section-heading"><div><span>Discover opportunities</span><strong>What are you looking for?</strong></div><p>Choose a category or use the filters to find business requirements relevant to you.</p></div>
          {/* No per-category counts shown — there's no aggregate-count
              endpoint backing this yet, and a fabricated or stale number
              would be worse than none. Add real counts here once the
              backend can supply them. */}
          <div className="growth-vault-category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10 }}>
            {CATEGORIES.map(c => {
              const active = filters.category === c
              const color = CATEGORY_COLORS[c] || '#64748b'
              return (
                <div key={c} className={`card growth-vault-category${active ? ' active' : ''}`} onClick={() => { const next = { ...filters, category: active ? '' : c }; setFilters(next) }}
                  style={{ cursor: 'pointer', textAlign: 'center', padding: '16px 10px', border: active ? `2px solid ${color}` : '1px solid var(--nx-line)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, margin: '0 auto 8px', display: 'grid', placeItems: 'center', background: `${color}22`, color }}>
                    <FontAwesomeIcon icon={CATEGORY_ICONS[c] || faTag}/>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-ink)' }}>{c}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'browse' && (
        <div className="card growth-vault-filters" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 10 }}>
            <select value={filters.industry} onChange={e => setFilters({ ...filters, industry: e.target.value })}>
              <option value="">All Industries</option>
              {INDUSTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Geography" value={filters.geography} onChange={e => setFilters({ ...filters, geography: e.target.value })}/>
            <input placeholder="Min budget" type="number" value={filters.budget_min} onChange={e => setFilters({ ...filters, budget_min: e.target.value })}/>
            <input placeholder="Max budget" type="number" value={filters.budget_max} onChange={e => setFilters({ ...filters, budget_max: e.target.value })}/>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="Search title or description…" value={filters.q} onChange={e => setFilters({ ...filters, q: e.target.value })} onKeyDown={e => e.key === 'Enter' && fetchBrowse()} style={{ flex: 1 }}/>
            <button className="btn btn-p btn-sm" onClick={fetchBrowse}><FontAwesomeIcon icon={faMagnifyingGlass} className="mr-1.5"/>Search</button>
          </div>
        </div>
      )}

      {tab === 'browse' && (
        loadingBrowse ? <Loading label="Loading opportunities…"/> : error ? <ApiError message={error} onRetry={fetchBrowse}/> :
        items.length === 0 ? <Empty label="No opportunities match your filters"/> : (
          <div className="opportunity-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
            {items.map(o => (
              <OpportunityCard key={o.id} opp={o} isOwner={o.created_by === me?.id} myInterestState={myInterestMap[o.id]}
                onExpressInterest={openInterest} onReport={openReport} onManage={openManage}/>
            ))}
          </div>
        )
      )}

      {tab === 'mine' && (
        loadingMine ? <Loading label="Loading your postings…"/> :
        myOpps.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--nx-muted)' }}>
            <div style={{ marginBottom: 8 }}>You haven't posted any opportunities yet.</div>
            <button className="btn btn-p btn-sm" onClick={() => { setForm(emptyForm); setShowCreate(true) }}>+ Post Opportunity</button>
          </div>
        ) : (
          <div className="opportunity-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
            {myOpps.map(o => (
              <OpportunityCard key={o.id} opp={o} isOwner={true} onExpressInterest={() => {}} onReport={() => {}} onManage={openManage}/>
            ))}
          </div>
        )
      )}

      {tab === 'interests' && (
        loadingInterests ? <Loading label="Loading…"/> :
        myInterests.length === 0 ? <Empty label="You haven't expressed interest in anything yet"/> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myInterests.map((i: any) => (
              <div key={i.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{i.opportunity?.title || 'Opportunity'}</div>
                  {i.note && <div style={{ fontSize: 12, color: 'var(--nx-muted)', marginTop: 2 }}>Your note: {i.note}</div>}
                </div>
                <span className="badge b-blue" style={{ flexShrink: 0 }}>{INTEREST_STATE_LABEL[i.state] || i.state}</span>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'moderation' && canModerate && (
        loadingMod ? <Loading label="Loading queue…"/> :
        modQueue.length === 0 ? <Empty label="No pending reports"/> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {modQueue.map((r: any) => (
              <div key={r.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{r.opportunity?.title || 'Opportunity'}</div>
                    <div style={{ fontSize: 12, color: 'var(--nx-muted)', marginTop: 4 }}>Reported by {r.user?.name || 'Member'}</div>
                    <div style={{ fontSize: 13, marginTop: 8, color: 'var(--nx-ink)' }}>{r.reason}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-g btn-sm" onClick={() => moderate(r.id, 'dismiss')}>Dismiss</button>
                    <button className="btn btn-sm" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }} onClick={() => moderate(r.id, 'remove_opportunity')}>Remove Listing</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Create/post modal */}
      {showCreate && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal modal-lg">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}><FontAwesomeIcon icon={faBriefcase} className="mr-1.5"/>Post an Opportunity</h3>
            <div className="fg"><label>Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Looking for a logistics partner in South India"/></div>
            <div className="fg"><label>Description</label><textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></div>
            <div className="form-grid">
              <div className="fg">
                <label>Category *</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="fg">
                <label>Industry</label>
                <select value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}>
                  <option value="">Any</option>
                  {INDUSTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="fg"><label>Geography</label><input value={form.geography} onChange={e => setForm({ ...form, geography: e.target.value })} placeholder="City / region / country"/></div>
              <div className="fg"><label>Deadline</label><input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}/></div>
              <div className="fg"><label>Budget min (₹)</label><input type="number" value={form.budget_min} onChange={e => setForm({ ...form, budget_min: e.target.value })}/></div>
              <div className="fg"><label>Budget max (₹)</label><input type="number" value={form.budget_max} onChange={e => setForm({ ...form, budget_max: e.target.value })}/></div>
              <div className="fg">
                <label>Response Preference</label>
                <select value={form.response_preference} onChange={e => setForm({ ...form, response_preference: e.target.value })}>
                  <option value="message">In-app message</option>
                  <option value="call">Phone call</option>
                  <option value="meeting">Meeting</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-p" style={{ flex: 1 }} onClick={() => createOpportunity(false)} disabled={saving}>{saving ? 'Posting…' : 'Publish'}</button>
              <button className="btn btn-g" style={{ flex: 1 }} onClick={() => createOpportunity(true)} disabled={saving}>Save as Draft</button>
              <button className="btn btn-g" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Manage modal (owner) — lifecycle transitions + interested members */}
      {manageOpp && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setManageOpp(null)}>
          <div className="modal modal-lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{manageOpp.title}</h3>
                <span className={`badge ${STATUS_COLOR[manageOpp.status] || 'b-gray'}`} style={{ marginTop: 6, display: 'inline-block' }}>{STATUS_LABEL[manageOpp.status] || manageOpp.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {!editMode && !['closed_won', 'closed_lost', 'archived'].includes(manageOpp.status) && (
                  <button className="btn btn-g btn-sm" onClick={() => setEditMode(true)}>Edit</button>
                )}
                <button onClick={() => setManageOpp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nx-muted)', fontSize: 18 }}>✕</button>
              </div>
            </div>

            {editMode ? (
              <div style={{ marginBottom: 8 }}>
                <div className="fg"><label>Title *</label><input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}/></div>
                <div className="fg"><label>Description</label><textarea rows={3} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}/></div>
                <div className="form-grid">
                  <div className="fg">
                    <label>Category *</label>
                    <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                      <option value="">Select…</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="fg">
                    <label>Industry</label>
                    <select value={editForm.industry} onChange={e => setEditForm({ ...editForm, industry: e.target.value })}>
                      <option value="">Any</option>
                      {INDUSTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="fg"><label>Geography</label><input value={editForm.geography} onChange={e => setEditForm({ ...editForm, geography: e.target.value })}/></div>
                  <div className="fg"><label>Deadline</label><input type="date" value={editForm.deadline} onChange={e => setEditForm({ ...editForm, deadline: e.target.value })}/></div>
                  <div className="fg"><label>Budget min (₹)</label><input type="number" value={editForm.budget_min} onChange={e => setEditForm({ ...editForm, budget_min: e.target.value })}/></div>
                  <div className="fg"><label>Budget max (₹)</label><input type="number" value={editForm.budget_max} onChange={e => setEditForm({ ...editForm, budget_max: e.target.value })}/></div>
                  <div className="fg">
                    <label>Response Preference</label>
                    <select value={editForm.response_preference} onChange={e => setEditForm({ ...editForm, response_preference: e.target.value })}>
                      <option value="message">In-app message</option>
                      <option value="call">Phone call</option>
                      <option value="meeting">Meeting</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 18 }}>
                  <button className="btn btn-p" style={{ flex: 1 }} onClick={saveEdit} disabled={savingEdit}>{savingEdit ? 'Saving…' : 'Save Changes'}</button>
                  <button className="btn btn-g" style={{ flex: 1 }} onClick={() => setEditMode(false)}>Cancel</button>
                </div>
              </div>
            ) : (TRANSITIONS[manageOpp.status] || []).length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5 }}>Move to</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {TRANSITIONS[manageOpp.status].map((s: string) => (
                    s === 'closed_won' ? (
                      <div key={s} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input placeholder="Deal value (optional)" value={closeValue} onChange={e => setCloseValue(e.target.value)} type="number" style={{ width: 150 }}/>
                        <select value={closeCurrency} onChange={e => setCloseCurrency(e.target.value)} style={{ width: 80 }}>
                          <option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option>
                        </select>
                        <button className="btn btn-p btn-sm" onClick={() => doTransition(s)}>Close — Won</button>
                      </div>
                    ) : (
                      <button key={s} className="btn btn-g btn-sm" onClick={() => doTransition(s)}>{STATUS_LABEL[s]}</button>
                    )
                  ))}
                </div>
              </div>
            )}

            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5 }}>
              Interested Members ({manageInterests.length})
            </div>
            {manageLoading ? <Loading label="Loading…"/> : manageInterests.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--nx-muted)', textAlign: 'center', padding: '20px 0' }}>No one has expressed interest yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {manageInterests.map((i: any) => (
                  <div key={i.id} className="card-dark" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{i.user?.name || 'Member'}</div>
                      <span className="badge b-blue">{INTEREST_STATE_LABEL[i.state] || i.state}</span>
                    </div>
                    {i.note && <div style={{ fontSize: 12, color: 'var(--nx-muted)' }}>{i.note}</div>}
                    {i.company_name && <div style={{ fontSize: 11, color: 'var(--nx-muted)' }}><FontAwesomeIcon icon={faBuilding} className="mr-1"/>{i.company_name}</div>}
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      {INTEREST_STATES.filter(s => s !== i.state).map(s => (
                        <button key={s} className="btn btn-g btn-xs" onClick={() => setInterestState(i.id, s)}>{INTEREST_STATE_LABEL[s]}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Express interest modal */}
      {interestOpp && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setInterestOpp(null)}>
          <div className="modal">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Express Interest</h3>
            <p style={{ fontSize: 12, color: 'var(--nx-muted)', marginBottom: 14 }}>{interestOpp.title}</p>
            <div className="fg"><label>Note to the owner</label><textarea rows={4} value={interestNote} onChange={e => setInterestNote(e.target.value)} placeholder="Why are you a good fit? What are you offering?"/></div>
            <div className="fg"><label>Company (optional)</label><input value={interestCompany} onChange={e => setInterestCompany(e.target.value)} placeholder="Your company name"/></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-p" style={{ flex: 1 }} onClick={submitInterest} disabled={expressing}>{expressing ? 'Sending…' : 'Send Interest'}</button>
              <button className="btn btn-g" style={{ flex: 1 }} onClick={() => setInterestOpp(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {reportOpp && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setReportOpp(null)}>
          <div className="modal">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}><FontAwesomeIcon icon={faFlag} className="mr-1.5"/>Report Opportunity</h3>
            <p style={{ fontSize: 12, color: 'var(--nx-muted)', marginBottom: 14 }}>{reportOpp.title}</p>
            <div className="fg"><label>What's wrong with this listing?</label><textarea rows={4} value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Describe the issue…"/></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-p" style={{ flex: 1 }} onClick={submitReport} disabled={reporting}>{reporting ? 'Submitting…' : 'Submit Report'}</button>
              <button className="btn btn-g" style={{ flex: 1 }} onClick={() => setReportOpp(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
