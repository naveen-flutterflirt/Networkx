'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCompass, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react'
import { ExpansionSignalsAPI } from '@/lib/api'
import { Loading, ApiError, Empty } from '@/components/shared/States'
import ExpansionMap, { INDIA_CITY_COORDS } from '@/components/ui/ExpansionMap'

export default function HQExpansionPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any|null>(null)

  const fetchAll = async () => {
    setLoading(true); setError('')
    try { setData(await ExpansionSignalsAPI.cityDensity()) }
    catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  if (loading) return <div className="page"><Loading label="Computing expansion signals…"/></div>
  if (error) return <div className="page"><ApiError message={error} onRetry={fetchAll}/></div>

  const cities = data?.cities || []
  const unmapped = cities.filter((c: any) => !INDIA_CITY_COORDS[c.city.trim().toLowerCase()])

  return (
    <div className="page">
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:18,fontWeight:800}}><FontAwesomeIcon icon={faCompass} className="mr-1.5"/>Expansion Engine</h2>
        <p style={{fontSize:13,color:'#9ca3af'}}>Real member + prospect density by city — advisory signals only, nothing here creates a group automatically.</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
        {[
          ['Cities with Activity', data?.total_cities_with_activity||0, '#6366f1'],
          ['Cities Without a Group', data?.cities_without_a_group||0, '#f59e0b'],
          ['Suggested Expansion Cities', data?.suggested_expansion_cities?.length||0, '#10b981'],
        ].map(([l,v,c]) => (
          <div key={String(l)} style={{background:`linear-gradient(135deg,${c},${c}cc)`,borderRadius:12,padding:'14px 16px',
            boxShadow:`0 2px 4px rgba(0,0,0,.35), 0 14px 32px -10px ${c}66, inset 0 1px 0 rgba(255,255,255,.18)`}}>
            <div className="stat-num" style={{fontSize:24,fontWeight:800,color:'#fff'}}>{v}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.8)',marginTop:4}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignItems:'start'}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Member Density Map</div>
          <ExpansionMap cities={cities} onSelect={setSelected}/>
          <div style={{display:'flex',gap:14,marginTop:10,fontSize:11,color:'var(--nx-muted)',flexWrap:'wrap'}}>
            <span>🟠 Has a group</span>
            <span>🔵 No group yet</span>
            <span>🟢 Suggested expansion city</span>
          </div>
          <p style={{fontSize:11,color:'var(--nx-muted)',marginTop:8}}>
            Simplified geographic plot (real lat/lng, linearly projected) — not a traced coastline map. Dot size = member + prospect count.
          </p>
        </div>

        <div className="card">
          <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>
            {selected ? `${selected.city}${selected.state ? ', '+selected.state : ''}` : 'Click a city on the map'}
          </div>
          {selected ? (
            <div style={{display:'flex',flexDirection:'column',gap:8,fontSize:13}}>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--nx-muted)'}}>Members</span><span style={{fontWeight:700}}>{selected.member_count}</span></div>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--nx-muted)'}}>Open prospects</span><span style={{fontWeight:700}}>{selected.prospect_count}</span></div>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--nx-muted)'}}>Existing groups</span><span style={{fontWeight:700}}>{selected.group_count}</span></div>
              {selected.is_suggested_expansion && (
                <div style={{marginTop:6,padding:'8px 10px',background:'rgba(39,216,109,.1)',borderRadius:8,border:'1px solid rgba(39,216,109,.3)',fontSize:12,color:'#7be3a4'}}>
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="mr-1.5"/>{selected.member_count + selected.prospect_count} people already here, no group to join yet — worth a look.
                </div>
              )}
            </div>
          ) : (
            <p style={{fontSize:12,color:'var(--nx-muted)'}}>Select a city to see its numbers, or check the suggestions list below.</p>
          )}
        </div>
      </div>

      {data?.suggested_expansion_cities?.length > 0 && (
        <div style={{marginTop:20}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:10}}><FontAwesomeIcon icon={faWandMagicSparkles} className="mr-1.5"/>Suggested Expansion Cities</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
            {data.suggested_expansion_cities.map((c: any) => (
              <div key={c.city} className="card" style={{cursor:'pointer'}} onClick={()=>setSelected(c)}>
                <div style={{fontWeight:700,fontSize:14}}>{c.city}</div>
                <div style={{fontSize:11,color:'var(--nx-muted)',marginTop:4}}>{c.member_count} members · {c.prospect_count} open prospects</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{marginTop:20}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>All Cities With Activity</div>
        {cities.length === 0 ? <Empty label="No city data yet"/> : (
          <table className="tbl">
            <thead><tr>{['City','State','Members','Prospects','Groups','Status'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {cities.map((c: any) => (
                <tr key={c.city}>
                  <td style={{fontWeight:600}}>{c.city}</td>
                  <td style={{fontSize:12,color:'var(--nx-muted)'}}>{c.state || '—'}</td>
                  <td>{c.member_count}</td>
                  <td>{c.prospect_count}</td>
                  <td>{c.group_count}</td>
                  <td>
                    {c.is_suggested_expansion
                      ? <span className="badge b-green"><FontAwesomeIcon icon={faWandMagicSparkles} className="mr-1.5"/>Suggested</span>
                      : c.has_group ? <span className="badge b-orange">Active</span> : <span className="badge b-gray">No group</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {unmapped.length > 0 && (
          <p style={{fontSize:11,color:'var(--nx-muted)',marginTop:8}}>
            {unmapped.length} of these {unmapped.length===1?'city isn\'t':'cities aren\'t'} in the map's coordinate lookup yet (shown in the table above, just not plotted) — add {unmapped.length===1?'it':'them'} to ExpansionMap.tsx's INDIA_CITY_COORDS to place {unmapped.length===1?'a dot':'dots'} for {unmapped.length===1?'it':'them'}.
          </p>
        )}
      </div>
    </div>
  )
}
