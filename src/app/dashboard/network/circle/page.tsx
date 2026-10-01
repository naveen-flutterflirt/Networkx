'use client'

import { useCallback, useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faCircleCheck, faCopy, faCrown, faHandshake, faLocationDot, faMagnifyingGlass, faShareNodes, faUsers } from '@fortawesome/free-solid-svg-icons'
import { CirclesAPI, ConnectionsAPI, DiscoverAPI } from '@/lib/api'
import { ApiError, Empty, Loading } from '@/components/shared/States'
import { Pagination } from '@/components/shared/Pagination'
import PageHero from '@/components/shared/PageHero'

export default function CircleDirectoryPage() {
  const [circleId, setCircleId] = useState('')
  const [circleName, setCircleName] = useState('My Circle')
  const [query, setQuery] = useState('')
  const [people, setPeople] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState<string|null>(null)
  const [circle, setCircle] = useState<any|null>(null)

  const load = useCallback(async (id: string, nextPage = 1, search = '') => {
    if (!id) return
    setLoading(true); setError('')
    try {
      const result = await DiscoverAPI.search({ circle_id:id, q:search || undefined, page:nextPage, page_size:12 })
      setPeople(result.items || [])
      setTotal(result.total || 0)
      setHasMore(Boolean(result.has_more))
      setPage(nextPage)
    } catch (e:any) {
      setError(e.message || 'Could not load Circle members')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('circle_id') || ''
    setCircleId(id)
    setCircleName(params.get('circle_name') || 'My Circle')
    if (id) {
      load(id, 1)
      CirclesAPI.get(id).then(details => {
        setCircle(details)
        if (details?.name) setCircleName(details.name)
      }).catch(() => setCircle(null))
    }
    else { setError('Circle information is missing'); setLoading(false) }
  }, [load])

  const connect = async (userId:string) => {
    setBusyId(userId)
    try {
      await ConnectionsAPI.sendRequest(userId)
      setPeople(current => current.map(person => person.id === userId ? {...person, connection_status:'pending', connection_direction:'sent'} : person))
      setMessage('Connection request sent.')
    } catch (e:any) {
      setMessage(e.message || 'Could not send connection request')
    } finally {
      setBusyId(null)
    }
  }

  const leader = circle?.community_leader
  const leaderCard = leader ? people.find(person => person.id === leader.id) : null
  const leaderPhoto = leader?.avatar_url || leaderCard?.avatar_url
  const publicUrl = circle?.public_slug && typeof window!=='undefined' ? `${window.location.origin}/community/${encodeURIComponent(circle.public_slug)}` : ''

  return (
    <div className="page">
      <PageHero
        icon={faUsers}
        kicker="My Circle"
        title={circleName}
        description="Meet the active NetworkX members who belong to this Circle."
        stats={[{icon:faUsers, value:total, label:total === 1 ? 'Other member' : 'Other members'}]}
        aside={leader ? <div style={{minWidth:250,maxWidth:330,display:'flex',alignItems:'center',gap:13,padding:'13px 16px',border:'1px solid rgba(251,191,36,.4)',borderRadius:16,background:'linear-gradient(135deg,rgba(8,32,72,.94),rgba(22,69,130,.92))',boxShadow:'0 12px 28px rgba(0,0,0,.18)'}}>
          <div style={{width:62,height:62,borderRadius:'50%',overflow:'hidden',display:'grid',placeItems:'center',flexShrink:0,color:'#fff',fontSize:22,fontWeight:850,background:'linear-gradient(135deg,#f59e0b,#ff5c12)',border:'3px solid rgba(251,191,36,.85)',boxShadow:'0 0 0 4px rgba(245,158,11,.14)'}}>
            {leaderPhoto ? <img src={leaderPhoto} alt={leader.name||'Community Leader'} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : (leader.name?.charAt(0)||'L')}
          </div>
          <div style={{minWidth:0}}><div style={{display:'flex',alignItems:'center',gap:6,color:'#fbbf24',fontSize:10,fontWeight:900,textTransform:'uppercase',letterSpacing:'.09em'}}><FontAwesomeIcon icon={faCrown}/> Community Leader</div><div style={{color:'#fff',fontSize:16,fontWeight:850,marginTop:4,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{leader.name}</div><div style={{color:'#b9cbe4',fontSize:11,marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{[leader.designation||leaderCard?.profession,leader.company||leaderCard?.company].filter(Boolean).join(' · ')||'NetworkX Member'}</div></div>
        </div> : undefined}
      />

      <div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap',marginBottom:14}}><button className="btn btn-g btn-sm" onClick={()=>window.location.href='/dashboard/network'}><FontAwesomeIcon icon={faArrowLeft} className="mr-1.5"/>Back to My Network</button>{publicUrl&&<div style={{display:'flex',gap:7}}><button className="btn btn-g btn-sm" onClick={async()=>{await navigator.clipboard.writeText(publicUrl);setMessage('Public Circle link copied.')}}><FontAwesomeIcon icon={faCopy}/> Copy public link</button><a className="btn btn-g btn-sm" href={`https://wa.me/?text=${encodeURIComponent(`Meet ${circle.name} on NetworkX\n${publicUrl}`)}`} target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faShareNodes}/> Share</a></div>}</div>

      {message && <div className="card" style={{marginBottom:14,padding:'10px 14px',fontSize:13}}>{message}</div>}

      <form className="card" style={{display:'flex',gap:8,marginBottom:16}} onSubmit={event=>{event.preventDefault();load(circleId,1,query)}}>
        <div style={{position:'relative',flex:1}}>
          <FontAwesomeIcon icon={faMagnifyingGlass} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#6b7280'}}/>
          <input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search members in this Circle…" style={{width:'100%',paddingLeft:38}}/>
        </div>
        <button className="btn btn-p" type="submit">Search</button>
      </form>

      {loading ? <Loading label="Loading Circle members…"/> :
       error ? <ApiError message={error} onRetry={()=>load(circleId,page,query)}/> :
       people.length === 0 ? <Empty label="No other active members are in this Circle yet"/> : (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
            {people.map(person => (
              <article key={person.id} className="card" style={{textAlign:'center'}}>
                <div style={{width:62,height:62,borderRadius:'50%',overflow:'hidden',display:'grid',placeItems:'center',margin:'0 auto 10px',background:'#6366f1',color:'#fff',fontSize:22,fontWeight:800}}>
                  {person.avatar_url ? <img src={person.avatar_url} alt={person.name || 'Member'} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : (person.name?.charAt(0) || '?')}
                </div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontWeight:800}}>
                  {person.name || 'Member'}{person.verified && <FontAwesomeIcon icon={faCircleCheck} className="text-green"/>}
                </div>
                {circle?.community_leader_user_id===person.id && <div style={{display:'inline-flex',alignItems:'center',gap:5,marginTop:7,padding:'4px 8px',borderRadius:99,color:'#b45309',background:'#fff3d6',fontSize:10,fontWeight:850,textTransform:'uppercase',letterSpacing:'.04em'}}><FontAwesomeIcon icon={faCrown}/> Circle Leader</div>}
                <div style={{fontSize:12,color:'#6b7280',marginTop:3}}>{person.profession || person.company || '—'}</div>
                <div style={{fontSize:11,color:'#9ca3af',margin:'7px 0 12px'}}><FontAwesomeIcon icon={faLocationDot} className="mr-1"/>{person.city || '—'}{person.country ? `, ${person.country}` : ''}</div>
                <div style={{display:'flex',gap:7}}>
                  <button className="btn btn-p btn-sm" style={{flex:1}} disabled={['connected','pending'].includes(person.connection_status)||busyId===person.id} onClick={()=>connect(person.id)}>
                    <FontAwesomeIcon icon={faHandshake} className="mr-1.5"/>{person.connection_status === 'connected' ? 'Connected' : person.connection_status === 'pending' ? 'Requested' : busyId===person.id ? 'Sending…' : 'Connect'}
                  </button>
                  <button className="btn btn-g btn-sm" onClick={()=>window.location.href=`/dashboard/messages?to=${person.id}&name=${encodeURIComponent(person.name || '')}`}>Message</button>
                </div>
              </article>
            ))}
          </div>
          <Pagination page={page} pageSize={12} total={total} hasMore={hasMore} loading={loading} onPageChange={next=>load(circleId,next,query)}/>
        </>
      )}
    </div>
  )
}
