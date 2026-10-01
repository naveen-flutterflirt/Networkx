'use client'
// Reusable debounced user search picker
// Real search, open to any authenticated user — was previously calling
// SuperAdminAPI.getUsers, which is super_admin-only AND never implemented
// a search param at all. Any other role got a silent 403 shown as
// "No users found" no matter what was typed; super_admin got unfiltered
// recent users. Now calls UsersAPI.search, a real endpoint every role can use.
import { useState, useEffect, useRef } from 'react'
import { UsersAPI } from '@/lib/api'

interface Props {
  value: string           // selected user id
  onChange: (id: string, user: any) => void
  placeholder?: string
  roleFilter?: string     // 'member' | 'franchise' | undefined (all)
  label?: string
  required?: boolean
  initialUser?: { id: string, name: string } | null   // pre-seed the picker when navigated here with a known recipient (e.g. "Message" button deep links)
  openToReferralsOnly?: boolean
}

export default function UserSearchPicker({ value, onChange, placeholder, roleFilter, label, required, initialUser, openToReferralsOnly }: Props) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState<any[]>([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState<any|null>(initialUser || null)
  const ref    = useRef<HTMLDivElement>(null)
  const timer  = useRef<any>(null)

  // If a caller passes initialUser after mount (e.g. deep link resolves
  // slightly later than first render), pick it up without needing a search.
  useEffect(() => {
    if (initialUser && initialUser.id !== selected?.id) setSelected(initialUser)
  }, [initialUser?.id])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced search — fires 350ms after user stops typing
  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    clearTimeout(timer.current)
    setLoading(true)
    timer.current = setTimeout(async () => {
      try {
        const params: any = { q: query, limit: 10 }
        if (roleFilter) params.role = roleFilter
        if (openToReferralsOnly) params.open_to_referrals = true
        const res = await UsersAPI.search(params)
        setResults(res.items || res)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 350)
    return () => clearTimeout(timer.current)
  }, [query, roleFilter, openToReferralsOnly])

  const pick = (user: any) => {
    setSelected(user)
    setQuery(user.name)
    setOpen(false)
    onChange(user.id, user)
  }

  const clear = () => {
    setSelected(null)
    setQuery('')
    setResults([])
    onChange('', null)
  }

  const displayValue = selected ? selected.name : query

  return (
    <div className="fg" ref={ref} style={{position:'relative'}}>
      {label && <label>{label}{required && ' *'}</label>}
      <div style={{position:'relative'}}>
        <input
          value={displayValue}
          onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) clear() }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || 'Type name, email or city to search…'}
        />
        {selected && (
          <button onClick={clear} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',
            background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:16,lineHeight:1}}>
            ✕
          </button>
        )}
      </div>

      {/* Confirmation chip */}
      {selected && (
        <div style={{marginTop:4,padding:'6px 10px',background:'rgba(39,216,109,.1)',borderRadius:8,
          border:'1px solid rgba(39,216,109,.3)',fontSize:12,color:'#15803d',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>
            ✅ <strong>{selected.name}</strong>
            {selected.email && ` · ${selected.email}`}
            {selected.city && ` · ${selected.city}`}
            {selected.role && (
              <span style={{marginLeft:6,padding:'1px 6px',borderRadius:99,background:'rgba(99,102,241,.12)',color:'#a5b4fc',fontSize:11,fontWeight:600,textTransform:'capitalize'}}>
                {selected.role.replace('_',' ')}
              </span>
            )}
          </span>
          <span style={{fontSize:10,color:'#9ca3af',fontFamily:'monospace'}}>{selected.id?.slice(0,10)}</span>
        </div>
      )}

      {/* Dropdown */}
      {open && query.length >= 2 && (
        <div style={{position:'absolute',top:'100%',left:0,right:0,background:'var(--nx-panel)',
          border:'1px solid var(--nx-line)',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,.12)',
          zIndex:999,marginTop:4,overflow:'hidden'}}>
          {loading && (
            <div style={{padding:'12px 14px',fontSize:13,color:'#9ca3af',display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:14,height:14,border:'2px solid var(--nx-line)',borderTopColor:'#6366f1',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
              Searching…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div style={{padding:'12px 14px',fontSize:13,color:'#9ca3af'}}>
              {openToReferralsOnly ? `No members open to referrals found for "${query}"` : `No users found for "${query}"`}
            </div>
          )}
          {!loading && results.map(u => (
            <div key={u.id} onClick={() => pick(u)}
              style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid #f3f4f6',
                display:'flex',justifyContent:'space-between',alignItems:'center',
                transition:'background .1s'}}
              onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,.04)')}
              onMouseLeave={e => (e.currentTarget.style.background='#fff')}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:'#6366f1',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  color:'#fff',fontSize:12,fontWeight:700,flexShrink:0}}>
                  {u.name?.charAt(0)||'?'}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{u.name}</div>
                  <div style={{fontSize:11,color:'#9ca3af'}}>{u.email} · {u.city||'—'}</div>
                </div>
              </div>
              <span style={{fontSize:10,padding:'2px 8px',borderRadius:99,fontWeight:600,
                background:'rgba(99,102,241,.12)',color:'#a5b4fc',textTransform:'capitalize'}}>
                {u.role?.replace('_',' ')||'user'}
              </span>
            </div>
          ))}
          <div style={{padding:'8px 14px',background:'rgba(255,255,255,.04)',fontSize:11,color:'#9ca3af',borderTop:'1px solid #f3f4f6'}}>
            Type at least 2 characters · Shows top 10 results
          </div>
        </div>
      )}
    </div>
  )
}
