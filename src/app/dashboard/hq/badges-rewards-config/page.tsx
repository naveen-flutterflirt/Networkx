'use client'
import { useState, useEffect } from 'react'
import { ContributionAPI, TokenStore } from '@/lib/api'
import { Loading, ApiError } from '@/components/shared/States'

// HQ-only config screen for the Badges & Rewards system (spec section
// 57) — status thresholds, contribution weights, referral economics per
// tier, and the attribution/wallet-release windows. Deliberately one
// flat screen, not a multi-step wizard — spec explicitly says "No daily
// operational admin work should be required," so this exists for
// occasional tuning, not routine use.
export default function BadgesRewardsConfigPage() {
  const me = TokenStore.getUser()
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState<string|null>(null)
  const [msg, setMsg] = useState('')

  const fetchConfig = async () => {
    setLoading(true); setError('')
    try { setConfig(await ContributionAPI.getConfig()) }
    catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchConfig() }, [])

  const saveSection = async (key: string, body: any) => {
    setSaving(key); setMsg('')
    try {
      await ContributionAPI.updateConfig(key, body)
      setMsg(`✅ ${key.replace(/_/g,' ')} updated`)
      await fetchConfig()
    } catch (e: any) { setMsg('❌ ' + e.message) }
    finally { setSaving(null) }
  }

  if (me?.role !== 'hq_admin' && me?.role !== 'super_admin') {
    return <div className="page"><div className="card" style={{textAlign:'center',padding:40}}>Only HQ Admin can access this page.</div></div>
  }
  if (loading) return <div className="page"><Loading label="Loading configuration…"/></div>
  if (error) return <div className="page"><ApiError message={error} onRetry={fetchConfig}/></div>
  if (!config) return null

  const updateLevel = (i: number, field: string, value: any) => {
    const levels = [...config.status_levels]
    levels[i] = { ...levels[i], [field]: field === 'min_score' ? Number(value) : value }
    setConfig({ ...config, status_levels: levels })
  }

  const updateWeight = (key: string, value: string) => {
    setConfig({ ...config, weights: { ...config.weights, [key]: Number(value) } })
  }

  const updateEconomics = (tier: string, field: string, value: any) => {
    setConfig({
      ...config,
      referral_economics: {
        ...config.referral_economics,
        [tier]: { ...config.referral_economics[tier], [field]: field === 'enabled' ? value : Number(value) },
      },
    })
  }

  return (
    <div className="page">
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:18,fontWeight:800}}>Badges & Rewards Configuration</h2>
        <p style={{fontSize:13,color:'var(--nx-muted)'}}>All values here are live and affect real member calculations immediately on save.</p>
      </div>

      {msg && (
        <div style={{padding:'10px 14px',borderRadius:10,marginBottom:16,fontSize:13,
          background:msg.startsWith('✅')?'rgba(39,216,109,.1)':'rgba(255,90,90,.1)',
          color:msg.startsWith('✅')?'#16a34a':'#ef4444'}}>{msg}</div>
      )}

      {/* NetworkX Status thresholds */}
      <div className="card" style={{marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>NetworkX Status Levels</div>
        {config.status_levels.map((lvl: any, i: number) => (
          <div key={i} style={{display:'grid',gridTemplateColumns:'40px 1fr 140px',gap:10,alignItems:'center',marginBottom:8}}>
            <span style={{fontSize:12,color:'var(--nx-muted)',textAlign:'center'}}>{lvl.order}</span>
            <input value={lvl.status} onChange={e=>updateLevel(i,'status',e.target.value)} style={{fontSize:13}}/>
            <input type="number" value={lvl.min_score} onChange={e=>updateLevel(i,'min_score',e.target.value)} placeholder="Min score" style={{fontSize:13}}/>
          </div>
        ))}
        <button className="btn btn-p btn-sm" onClick={()=>saveSection('status_levels', {levels: config.status_levels})} disabled={saving==='status_levels'}>
          {saving==='status_levels'?'Saving…':'Save Status Levels'}
        </button>
      </div>

      {/* Contribution weights */}
      <div className="card" style={{marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Contribution Weights</div>
        <div className="form-grid">
          {Object.entries(config.weights).map(([key, value]: [string, any]) => (
            <div key={key} className="fg">
              <label>{key.replace(/_/g,' ')}</label>
              <input type="number" value={value} onChange={e=>updateWeight(key, e.target.value)}/>
            </div>
          ))}
        </div>
        <button className="btn btn-p btn-sm" onClick={()=>saveSection('weights', config.weights)} disabled={saving==='weights'}>
          {saving==='weights'?'Saving…':'Save Weights'}
        </button>
      </div>

      {/* Referral economics per tier */}
      <div className="card" style={{marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Referral Economics</div>
        <div style={{overflowX:'auto'}}>
          <table className="tbl">
            <thead><tr>{['Tier','Normal Price','Referral Price','New Member Benefit','Referrer Wallet Credit','Enabled'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {Object.entries(config.referral_economics).map(([tier, econ]: [string, any]) => (
                <tr key={tier}>
                  <td style={{fontWeight:700,textTransform:'capitalize'}}>{tier}</td>
                  <td><input type="number" value={econ.normal_price} onChange={e=>updateEconomics(tier,'normal_price',e.target.value)} style={{width:100,fontSize:12}}/></td>
                  <td><input type="number" value={econ.referral_price} onChange={e=>updateEconomics(tier,'referral_price',e.target.value)} style={{width:100,fontSize:12}}/></td>
                  <td><input type="number" value={econ.new_member_benefit} onChange={e=>updateEconomics(tier,'new_member_benefit',e.target.value)} style={{width:100,fontSize:12}}/></td>
                  <td><input type="number" value={econ.referrer_wallet_credit} onChange={e=>updateEconomics(tier,'referrer_wallet_credit',e.target.value)} style={{width:100,fontSize:12}}/></td>
                  <td><input type="checkbox" checked={econ.enabled} onChange={e=>updateEconomics(tier,'enabled',e.target.checked)}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn btn-p btn-sm" style={{marginTop:12}} onClick={()=>saveSection('referral_economics', config.referral_economics)} disabled={saving==='referral_economics'}>
          {saving==='referral_economics'?'Saving…':'Save Referral Economics'}
        </button>
      </div>

      {/* Attribution + wallet release window */}
      <div className="card">
        <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Attribution & Wallet Release</div>
        <div className="form-grid">
          <div className="fg">
            <label>Referral attribution window (days)</label>
            <input type="number" value={config.attribution.attribution_window_days}
              onChange={e=>setConfig({...config, attribution:{...config.attribution, attribution_window_days:Number(e.target.value)}})}/>
          </div>
          <div className="fg">
            <label>Wallet release period (days)</label>
            <input type="number" value={config.attribution.wallet_release_days}
              onChange={e=>setConfig({...config, attribution:{...config.attribution, wallet_release_days:Number(e.target.value)}})}/>
          </div>
        </div>
        <button className="btn btn-p btn-sm" onClick={()=>saveSection('attribution', config.attribution)} disabled={saving==='attribution'}>
          {saving==='attribution'?'Saving…':'Save Attribution Settings'}
        </button>
      </div>
    </div>
  )
}
