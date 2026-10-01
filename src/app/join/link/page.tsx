'use client'
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Header from "@/app/components/shared/Header"
import Footer from "@/app/components/shared/Footer"
import { ContributionAPI } from "@/lib/api"

// Real, single destination file for Firebase's { "source": "/join/**",
// "destination": "/join/link/index.html" } rewrite — same proven
// pattern already used for /resources/article, necessary because this
// is a static export and referral codes are generated dynamically
// (can't pre-build a static page per code at build time the way a
// fixed set of blog slugs can be). Firebase serves this file's content
// while the browser's address bar stays at the real requested URL
// (confirmed against Firebase's own docs earlier this project), so
// usePathname() below still correctly reads whatever code the visitor
// actually opened.
const COOKIE_NAME = "nx_referral_code"
const COOKIE_NAME_ATTR = "nx_referral_name"
const ATTRIBUTION_DAYS = 30 // spec section 24 — configurable server-side too, but the cookie's own expiry needs a client-side value regardless

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

export default function JoinLinkShell() {
  const pathname = usePathname()
  const router = useRouter()
  const [state, setState] = useState<"loading" | "valid" | "invalid">("loading")
  const [referrerName, setReferrerName] = useState("")
  const [referrerInfo, setReferrerInfo] = useState<{profession?: string, company?: string, city?: string, bio?: string, avatarUrl?: string}>({})

  useEffect(() => {
    const clean = (pathname || "").replace(/\/+$/, "")
    const parts = clean.split("/").filter(Boolean)
    const pathCode = parts[parts.length - 1] || ""

    // Local-dev testing fallback — the Firebase rewrite that makes
    // /join/ANYCODE resolve to this file only exists on deployed
    // Firebase Hosting, not on `next dev` (localhost:3000 knows nothing
    // about firebase.json). Without this, the only way to reach this
    // page locally is literally at /join/link, where the path's last
    // segment is just the word "link" — not a real code. Checking
    // ?code= as a fallback means localhost:3000/join/link?code=XXX
    // works for local testing, while production keeps using the real
    // /join/XXX path shape via the Firebase rewrite as primary.
    const searchCode = new URLSearchParams(window.location.search).get("code") || ""
    const code = (pathCode && pathCode !== "link") ? pathCode : searchCode

    if (!code) { setState("invalid"); return }

    ContributionAPI.resolveCode(code).then((res: any) => {
      if (!res.valid) { setState("invalid"); return }
      setReferrerName(res.referrer_name)
      setReferrerInfo({
        profession: res.referrer_profession,
        company: res.referrer_company,
        city: res.referrer_city,
        bio: res.referrer_bio,
        avatarUrl: res.referrer_avatar_url,
      })
      setState("valid")

      // First-valid-referral-wins (spec section 24) — only set the
      // cookie if one doesn't already exist. A visitor who clicked one
      // member's link, browsed around, then opened a second member's
      // link later should keep the FIRST attribution, not silently
      // switch to whichever link they opened most recently.
      if (!getCookie(COOKIE_NAME)) {
        setCookie(COOKIE_NAME, code, ATTRIBUTION_DAYS)
        setCookie(COOKIE_NAME_ATTR, res.referrer_name, ATTRIBUTION_DAYS)
      }
    }).catch(() => setState("invalid"))
  }, [pathname])

  return (
    <main>
      <Header />
      <div style={{minHeight:"60vh",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"140px 24px 80px"}}>
        <div style={{maxWidth:520,width:"100%",textAlign:"center"}}>
          {state === "loading" && <p style={{color:"var(--muted)"}}>Loading…</p>}
          {state === "invalid" && (
            <>
              <h1 style={{fontSize:28,fontWeight:800,marginBottom:12}}>This invite link isn't valid</h1>
              <p style={{color:"var(--muted)",marginBottom:24}}>It may have expired or been typed incorrectly. You can still explore NetworkX membership directly.</p>
              <a className="button" href="/pricing">View Membership Plans</a>
            </>
          )}
          {state === "valid" && (
            <>
              <h1 style={{fontSize:28,fontWeight:800,marginBottom:24}}>You've been invited to NetworkX</h1>

              {/* Real redesign — was just centered text stacked directly
                  on the page with no visual separation, and repeated the
                  referrer's name twice (once here, once in the CTA copy
                  below). Now a proper bordered card, matching the site's
                  own .card treatment used everywhere else, with real
                  hierarchy: avatar+name prominent, profession/company
                  secondary, city as a small pill, bio visually set apart
                  as a quote rather than another plain line of text. */}
              <div style={{
                background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.1)",
                borderRadius:16, padding:"32px 28px", marginBottom:28, textAlign:"center",
              }}>
                <div style={{
                  width:72,height:72,borderRadius:"50%",margin:"0 auto 16px",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  background:"linear-gradient(135deg,#ff5c12,#ef3900)",color:"#fff",
                  fontSize:26,fontWeight:800,boxShadow:"0 8px 20px rgba(255,92,18,.3)",
                  overflow:"hidden",
                }}>
                  {referrerInfo.avatarUrl
                    ? <img src={referrerInfo.avatarUrl} alt={referrerName} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : (referrerName.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase() || "NX")}
                </div>
                <div style={{fontSize:19,fontWeight:800,marginBottom:6}}>{referrerName}</div>
                {(referrerInfo.profession || referrerInfo.company) && (
                  <div style={{fontSize:14,color:"var(--muted)",marginBottom:10}}>
                    {[referrerInfo.profession, referrerInfo.company].filter(Boolean).join(" at ")}
                  </div>
                )}
                {referrerInfo.city && (
                  <div style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,color:"var(--muted)",
                    background:"rgba(255,255,255,.06)",padding:"4px 12px",borderRadius:999,marginBottom:referrerInfo.bio?18:0}}>
                    📍 {referrerInfo.city}
                  </div>
                )}
                {referrerInfo.bio && (
                  <p style={{
                    fontSize:13,color:"var(--muted)",fontStyle:"italic",margin:"18px 0 0",
                    paddingLeft:14,borderLeft:"2px solid rgba(255,92,18,.5)",textAlign:"left",lineHeight:1.6,
                  }}>"{referrerInfo.bio}"</p>
                )}
              </div>

              <p style={{color:"var(--muted)",marginBottom:24,fontSize:15,lineHeight:1.6}}>
                You'll get an exclusive member-referred joining benefit when you join NetworkX through this invitation.
              </p>
              <button className="button" onClick={()=>{
                const clean = (pathname || '').replace(/\/+$/, '')
                const pathCode = clean.split('/').filter(Boolean).pop() || ''
                const code = pathCode !== 'link' ? pathCode : new URLSearchParams(window.location.search).get('code') || ''
                router.push(`/join/plans?code=${encodeURIComponent(code)}`)
              }}>View My Invited Prices</button>
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}
