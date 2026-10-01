'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { login, loginWithOtp } from '@/lib/auth'
import { AuthAPI } from '@/lib/api'
import Header from '@/app/components/shared/Header'
import Footer from '@/app/components/shared/Footer'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope, faKey, faEye, faEyeSlash, faUsers, faLandmark,
  faCity, faSackDollar, faGift, faHandshake, faShieldHalved, faBolt,
  faXmark, faCircleCheck, faArrowLeft, faShieldHeart,
} from '@fortawesome/free-solid-svg-icons'
import { faApple } from '@fortawesome/free-brands-svg-icons'

// Login can't hard-block a paid-required account the way it blocks an
// unverified email — completing payment needs an authenticated call, so
// the token still has to be issued. Instead: known + not-active sends
// them into the dashboard shell straight to the Membership page (every
// other page there is locked by Sidebar/dashboard-layout until they
// pay) rather than out to the public pricing page — unknown/missing
// status (staff/admin have no membership doc at all, and a failed
// lookup shouldn't lock anyone out) falls through to the normal
// dashboard, same as before this existed.
function redirectPathFor(user: any): string {
  return (user?.membership_status && user.membership_status !== 'active') ? '/dashboard/membership' : '/dashboard'
}

const AV_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ff4b0a', '#14b8a6', '#ef4444']
const AV_INIT = ['RK', 'PM', 'AR', 'SP', 'VR', 'AK', 'MJ', 'SN']

const STATS = [
  { icon: faUsers,      value: '12,500+', label: 'Members' },
  { icon: faLandmark,   value: '85',      label: 'Groups' },
  { icon: faCity,       value: '28',      label: 'Cities' },
  { icon: faSackDollar, value: '₹45Cr+',  label: 'Business Generated' },
  { icon: faGift,       value: '34,200+', label: 'Referrals Exchanged' },
]

// "More useful and attractive" — a short why-join strip, reusing the same
// tone-color system (.blue/.cyan/.orange/.purple) the home page's benefit
// section uses, so the login screen isn't just a bare form for anyone who
// lands here directly instead of coming from the home page.
const WHY_JOIN = [
  { icon: faHandshake,     tone: 'blue',   text: 'Warm intros through people you already trust' },
  { icon: faBolt,          tone: 'orange', text: 'AI-matched opportunities, not a cold directory' },
  { icon: faShieldHalved,  tone: 'green',  text: 'Verified members only — a trusted community' },
]

export default function LoginPage() {
  const [tab, setTab] = useState<'password'|'otp'>('password')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStatus, setForgotStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle')
  const [forgotError, setForgotError] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  // Correct password but the email was never verified: instead of a dead-end
  // error, show what happened and let them resend the link from here.
  const [unverified, setUnverified] = useState(false)
  const [resendState, setResendState] = useState<'idle'|'sending'|'sent'|'already'|'error'>('idle')
  const [unverifiedMsg, setUnverifiedMsg] = useState('')
  const [resendMsg, setResendMsg] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  // ── Email OTP login — second sign-in method, alongside password.
  // Both key off email; there is no phone/mobile OTP.
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpStep, setOtpStep] = useState<'request'|'code'>('request')
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpErr, setOtpErr] = useState('')
  const [otpCooldown, setOtpCooldown] = useState(0)
  const otpInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (otpCooldown <= 0) return
    const t = setTimeout(() => setOtpCooldown(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [otpCooldown])

  const switchTab = (next: 'password'|'otp') => {
    setTab(next); setErr(''); setOtpErr('')
  }

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErr('')
    setUnverified(false)
    await new Promise((r) => setTimeout(r, 600))
    try {
      const user = await login(email, pw, rememberMe)
      window.location.href = redirectPathFor(user)
    } catch (e: any) {
      if (e?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverified(true)
        setResendState('idle')
        setUnverifiedMsg(e.message)
        setResendMsg('')
        setResendCooldown(Math.max(0, Number(e?.details?.retry_after) || 0))
      } else {
        setErr(e?.message || 'Invalid email or password.')
      }
    }
    setLoading(false)
  }

  const resendVerification = async () => {
    if (resendCooldown > 0 || resendState === 'sending') return
    if (!pw) { setResendState('error'); setResendMsg('Enter your password above, then tap Resend.'); return }
    setResendState('sending')
    try {
      const r: any = await AuthAPI.resendVerification(email, pw)
      if (r?.status === 'already_verified') {
        setResendState('already'); setResendMsg(r.message || 'Your email is already verified — sign in now.')
      } else {
        setResendState('sent')
        setResendMsg(r?.status === 'cooldown'
          ? 'A link was sent moments ago — check your inbox and spam folder.'
          : `We've sent a new verification link to ${email}.`)
        setResendCooldown(Math.max(1, Number(r?.retry_after) || 60))
      }
    } catch (e: any) {
      setResendState('error'); setResendMsg(e?.message || 'Could not resend the email — please try again.')
    }
  }

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpSending(true)
    setOtpErr('')
    try {
      await AuthAPI.sendOtp(otpEmail)
      setOtpStep('code')
      setOtpCooldown(30)
      setTimeout(() => otpInputRef.current?.focus(), 50)
    } catch (e: any) {
      setOtpErr(e.code === 'EMAIL_NOT_VERIFIED'
        ? `${e.message} Need it again? Try signing in with your password on the other tab — you'll get a "Resend verification email" button there.`
        : (e.message || 'Could not send the code — try again.'))
    }
    setOtpSending(false)
  }

  const resendOtp = async () => {
    if (otpCooldown > 0 || otpSending) return
    setOtpSending(true)
    setOtpErr('')
    try {
      await AuthAPI.sendOtp(otpEmail)
      setOtpCooldown(30)
      setOtpCode('')
    } catch (e: any) {
      setOtpErr(e.message || 'Could not resend the code — try again.')
    }
    setOtpSending(false)
  }

  const verifyOtpCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpVerifying(true)
    setOtpErr('')
    try {
      const user = await loginWithOtp(otpEmail, otpCode, rememberMe)
      window.location.href = redirectPathFor(user)
    } catch (e: any) {
      setOtpErr(e.message || 'That code is invalid or expired.')
    }
    setOtpVerifying(false)
  }

  const submitForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotStatus('sending')
    setForgotError('')
    try {
      await AuthAPI.forgotPassword(forgotEmail)
      setForgotStatus('sent')
    } catch (e: any) {
      setForgotStatus('error')
      setForgotError(e.message || 'Could not send reset email — try again.')
    }
  }

  return (
    <main>
      <Header />

      <div
        className="min-h-screen relative overflow-hidden text-white"
        style={{ background: 'radial-gradient(circle at 76% 40%, rgba(0,104,232,.12), transparent 36%), linear-gradient(115deg, #020914 0%, var(--night) 48%, #03101d 100%)' }}
      >
        {/* Bug fix: gridTemplateColumns was set via inline style, which
            ALWAYS overrides a CSS class regardless of specificity or media
            query — so the max-[1180px]:grid-cols-1 class right next to it
            was never actually able to take effect at any screen width,
            including phones. The form column's 380px MINIMUM width was
            therefore permanently forcing horizontal overflow on any screen
            narrower than ~840px total. Moved into a real Tailwind
            arbitrary-value grid-cols-[...] class instead, so the
            max-[1180px]: breakpoint can actually override it as intended. */}
        <div className="max-w-[1200px] mx-auto relative z-[1] min-h-screen grid gap-7 items-start p-[150px_26px_40px] grid-cols-[minmax(0,1.25fr)_minmax(380px,460px)] max-[1180px]:grid-cols-1 max-[1180px]:p-[110px_18px_24px] max-[540px]:p-[100px_12px_20px]">

          {/* ── LEFT: hero copy ─────────────────────────────────────── */}
          <section className="min-w-0 p-[8px_4px_8px_18px] max-[1180px]:order-1">
            <h1 className="text-[clamp(40px,4.8vw,66px)] leading-[.99] tracking-[-2px] font-extrabold mb-6 max-[720px]:text-[clamp(34px,10vw,48px)]">
              Conversations to<br/>Collaborations<br/>
              <em className="not-italic text-orange">Meet, Connect & Grow</em>
            </h1>

            <p className="max-w-[560px] text-[17px] leading-[1.72] mb-7 text-[#e0e5eb] max-[720px]:text-[15px]">
              Connect with business leaders, exchange referrals, attend exclusive events, and grow your business — city by city, group by group.
            </p>

            {/* Why join — tone-colored, matches the home page's icon system */}
            <div className="flex flex-col gap-3 mb-8">
              {WHY_JOIN.map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-white/[.06] ${item.tone}`}>
                    <FontAwesomeIcon icon={item.icon}/>
                  </span>
                  <span className="text-sm text-[#e0e5eb]">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap mb-8">
              <div className="flex items-center">
                {AV_INIT.map((av, i) => (
                  <div key={i}
                    className="w-[42px] h-[42px] rounded-full border-2 border-[var(--night)] flex items-center justify-center text-white text-[11px] font-bold relative"
                    style={{ background: AV_COLORS[i], zIndex: AV_INIT.length - i, marginLeft: i === 0 ? 0 : -12 }}>
                    {av}
                  </div>
                ))}
              </div>
              <div className="min-w-0">
                <div className="text-base font-bold text-white">Trusted by <span className="text-orange">12,500+</span> professionals</div>
                <div className="mt-1 text-sm text-[#e0e5eb]/70">★★★★★ <strong className="text-amber-400 font-extrabold">4.9</strong>/5 rating</div>
              </div>
            </div>

            {/* <div className="grid grid-cols-5 gap-3 max-[1400px]:grid-cols-3 max-[720px]:grid-cols-2 max-[540px]:grid-cols-1">
              {STATS.map((item) => (
                <div key={item.label} className="min-h-[120px] rounded-[18px] p-[16px_12px] text-center bg-[linear-gradient(180deg,rgba(18,20,36,.92),rgba(12,14,27,.88))] border border-white/[.08]">
                  <FontAwesomeIcon icon={item.icon} className="text-lg mb-2 text-white/80"/>
                  <div className="text-base font-extrabold text-white">{item.value}</div>
                  <div className="mt-1 text-[11px] leading-[1.4] text-white/[.42]">{item.label}</div>
                </div>
              ))}
            </div> */}
          </section>

          {/* ── RIGHT: login form ───────────────────────────────────── */}
          <section className="w-full max-w-[410px] justify-self-end max-[1180px]:justify-self-center" id="login-form">
            <div className="w-full rounded-[24px] p-[28px] bg-[linear-gradient(165deg,rgba(17,20,34,.97),rgba(10,12,22,.98))] border border-white/[.09] shadow-[0_24px_70px_rgba(0,0,0,.36),inset_0_1px_0_rgba(255,255,255,.04)]">
              <div className="flex items-center gap-3 mb-5">
                <span className="flex-shrink-0 w-11 h-11 rounded-[13px] flex items-center justify-center bg-[linear-gradient(135deg,#ff5c12,#ef3900)] shadow-[0_8px_20px_rgba(255,75,10,.28)]">
                  <FontAwesomeIcon icon={faShieldHeart} className="text-white text-lg"/>
                </span>
                <div className="min-w-0">
                  <div className="text-[21px] font-extrabold text-white leading-tight">Welcome back</div>
                  <div className="text-[12.5px] text-white/[.44]">Sign in to your NetworkX account</div>
                </div>
              </div>

              <div className="relative flex gap-1 p-1 rounded-xl mb-5 bg-white/[.04] border border-white/[.06]">
                <span aria-hidden="true"
                  className="absolute top-1 bottom-1 rounded-[10px] bg-[linear-gradient(135deg,#ff5c12,#ef3900)] shadow-[0_4px_14px_rgba(255,75,10,.3)] transition-transform duration-200 ease-out"
                  style={{ width: 'calc(50% - 4px)', transform: tab === 'otp' ? 'translateX(calc(100% + 8px))' : 'translateX(0)' }}/>
                <button
                  className={`relative z-[1] flex-1 border-none rounded-[10px] py-2.5 px-2 text-[13px] font-bold cursor-pointer transition-colors duration-150 ${tab === 'password' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                  onClick={() => switchTab('password')} type="button">
                  <FontAwesomeIcon icon={faKey} className="mr-1.5"/> Password
                </button>
                <button
                  className={`relative z-[1] flex-1 border-none rounded-[10px] py-2.5 px-2 text-[13px] font-bold cursor-pointer transition-colors duration-150 ${tab === 'otp' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                  onClick={() => switchTab('otp')} type="button">
                  <FontAwesomeIcon icon={faEnvelope} className="mr-1.5"/> Email OTP
                </button>
              </div>

              {tab === 'password' ? (
                <>
                  {err ? <div className="mb-3.5 p-[10px_12px] rounded-xl text-xs text-red-300 bg-red-500/[.12] border border-red-500/[.28]">{err}</div> : null}
                  {unverified ? (
                    <div role="alert" className="mb-3.5 p-[12px_14px] rounded-xl text-xs bg-amber-400/[.09] border border-amber-400/[.32] text-amber-100">
                      <div className="flex items-center gap-2 font-bold text-[13px] mb-1.5 text-amber-200">
                        <FontAwesomeIcon icon={faEnvelope}/> Verify your email to continue
                      </div>
                      <p className="leading-relaxed mb-2 text-white/75">{unverifiedMsg}</p>
                      <ul className="mb-3 pl-4 list-disc leading-relaxed text-white/60">
                        <li>Check your <strong className="text-white/80">spam or junk</strong> folder too.</li>
                        <li>The link works for 24 hours; only the newest one is valid.</li>
                        <li>Already clicked it? Press <strong className="text-white/80">Sign In</strong> again.</li>
                      </ul>
                      <button type="button" onClick={resendVerification}
                        disabled={resendCooldown > 0 || resendState === 'sending'}
                        className="w-full rounded-lg border border-amber-300/40 bg-amber-400/[.14] px-3 py-2.5 text-xs font-bold text-amber-100 cursor-pointer hover:bg-amber-400/[.22] disabled:opacity-60 disabled:cursor-not-allowed">
                        {resendState === 'sending' ? 'Sending…'
                          : resendCooldown > 0 ? `Resend available in ${resendCooldown}s`
                          : 'Resend verification email'}
                      </button>
                      {resendState === 'sent' && <p className="mt-2 flex items-center gap-1.5 text-emerald-300"><FontAwesomeIcon icon={faCircleCheck}/> {resendMsg}</p>}
                      {resendState === 'already' && <p className="mt-2 flex items-center gap-1.5 text-emerald-300"><FontAwesomeIcon icon={faCircleCheck}/> {resendMsg}</p>}
                      {resendState === 'error' && <p className="mt-2 text-red-300">{resendMsg}</p>}
                    </div>
                  ) : null}
                  <form onSubmit={doLogin}>
                      <div className="mb-3">
                        <label className="block text-xs font-bold text-white/[.64] mb-1.5">Email Address</label>
                        <input
                          className="w-full border border-white/[.12] rounded-xl px-3.5 py-3 bg-white/[.045] text-white text-sm outline-none focus:border-orange focus:shadow-[0_0_0_4px_rgba(255,75,10,.12)] placeholder:text-white/[.26]"
                          type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required/>
                      </div>
                      <div className="mb-3">
                        <label className="block text-xs font-bold text-white/[.64] mb-1.5">Password</label>
                        <div className="relative">
                          <input
                            className="w-full border border-white/[.12] rounded-xl px-3.5 py-3 pr-11 bg-white/[.045] text-white text-sm outline-none focus:border-orange focus:shadow-[0_0_0_4px_rgba(255,75,10,.12)] placeholder:text-white/[.26]"
                            type={showPw ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Enter your password" required/>
                          <button type="button" onClick={() => setShowPw(s => !s)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 bg-transparent border-none cursor-pointer">
                            <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye}/>
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer select-none whitespace-nowrap flex-shrink-0">
                          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="accent-orange flex-shrink-0"/> Remember me
                        </label>
                        <button type="button" onClick={() => { setShowForgot(true); setForgotStatus('idle'); setForgotEmail(email) }}
                          className="border-none bg-transparent text-orange text-xs font-bold cursor-pointer whitespace-nowrap flex-shrink-0">Forgot Password?</button>
                      </div>
                      <button type="submit" disabled={loading} className="button w-full justify-center text-base font-bold !min-h-[58px] disabled:opacity-70 disabled:cursor-not-allowed">
                        {loading ? 'Signing In…' : 'Sign In'} <span>→</span>
                      </button>
                      {/* <div className="flex items-center gap-2.5 my-4">
                        <span className="flex-1 h-px bg-white/[.08]"/>
                        <em className="not-italic text-xs text-white/30">or</em>
                        <span className="flex-1 h-px bg-white/[.08]"/>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 max-[720px]:grid-cols-1">
                        <button type="button" className="button button-secondary justify-center">
                          <strong className="text-[#4285f4] mr-1">G</strong> Google
                        </button>
                        <button type="button" className="button button-secondary justify-center">
                          <FontAwesomeIcon icon={faApple} className="mr-1.5"/> Apple
                        </button>
                      </div> */}
                  </form>
                </>
              ) : (
                <>
                  {otpErr ? <div className="mb-3.5 p-[10px_12px] rounded-xl text-xs text-red-300 bg-red-500/[.12] border border-red-500/[.28]">{otpErr}</div> : null}
                  {otpStep === 'request' ? (
                    <form onSubmit={requestOtp}>
                      <p className="text-xs text-white/[.44] mb-4 leading-relaxed">We'll email you a 6-digit code — no password needed.</p>
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-white/[.64] mb-1.5">Email Address</label>
                        <input
                          className="w-full border border-white/[.12] rounded-xl px-3.5 py-3 bg-white/[.045] text-white text-sm outline-none focus:border-orange focus:shadow-[0_0_0_4px_rgba(255,75,10,.12)] placeholder:text-white/[.26]"
                          type="email" value={otpEmail} onChange={(e) => setOtpEmail(e.target.value)} placeholder="your@email.com" required autoFocus/>
                      </div>
                      <button type="submit" disabled={otpSending} className="button w-full justify-center text-base font-bold !min-h-[58px] disabled:opacity-70 disabled:cursor-not-allowed">
                        {otpSending ? 'Sending Code…' : 'Send Code'} <span>→</span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={verifyOtpCode}>
                      <button type="button" onClick={() => { setOtpStep('request'); setOtpCode(''); setOtpErr('') }}
                        className="flex items-center gap-1.5 border-none bg-transparent text-white/40 hover:text-white/70 text-xs font-semibold cursor-pointer mb-3.5 p-0">
                        <FontAwesomeIcon icon={faArrowLeft}/> Change email
                      </button>
                      <p className="text-xs text-white/[.44] mb-4 leading-relaxed">
                        Enter the 6-digit code sent to <strong className="text-white/80">{otpEmail}</strong>.
                      </p>
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-white/[.64] mb-1.5">Verification Code</label>
                        <input
                          ref={otpInputRef}
                          className="w-full border border-white/[.12] rounded-xl px-3.5 py-3 bg-white/[.045] text-white text-[22px] font-bold tracking-[.5em] text-center outline-none focus:border-orange focus:shadow-[0_0_0_4px_rgba(255,75,10,.12)] placeholder:text-white/[.2] placeholder:tracking-normal placeholder:text-sm placeholder:font-normal"
                          inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                          value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="······" required autoFocus/>
                      </div>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer select-none whitespace-nowrap flex-shrink-0">
                          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="accent-orange flex-shrink-0"/> Remember me
                        </label>
                        <button type="button" onClick={resendOtp} disabled={otpCooldown > 0 || otpSending}
                          className="border-none bg-transparent text-orange text-xs font-bold cursor-pointer whitespace-nowrap flex-shrink-0 disabled:text-white/25 disabled:cursor-not-allowed">
                          {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : (otpSending ? 'Resending…' : 'Resend Code')}
                        </button>
                      </div>
                      <button type="submit" disabled={otpVerifying || otpCode.length !== 6} className="button w-full justify-center text-base font-bold !min-h-[58px] disabled:opacity-70 disabled:cursor-not-allowed">
                        {otpVerifying ? 'Verifying…' : 'Verify & Sign In'} <span>→</span>
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ── Forgot Password — real flow, wired to AuthAPI.forgotPassword ── */}
      {showForgot && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowForgot(false)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            {forgotStatus === 'sent' ? (
              <div className="text-center py-2">
                <FontAwesomeIcon icon={faCircleCheck} className="text-green text-4xl mb-3"/>
                <div className="text-lg font-bold text-white mb-1.5">Check your email</div>
                <p className="text-sm text-white/50 mb-5">We've sent a password reset link to <strong className="text-white">{forgotEmail}</strong>.</p>
                <button className="button w-full justify-center text-base font-bold !min-h-[58px]" onClick={() => setShowForgot(false)}>Close</button>
              </div>
            ) : (
              <form onSubmit={submitForgotPassword}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-lg font-bold text-white">Reset your password</div>
                  <button type="button" onClick={() => setShowForgot(false)} className="border-none bg-transparent text-white/40 hover:text-white/70 cursor-pointer">
                    <FontAwesomeIcon icon={faXmark}/>
                  </button>
                </div>
                <p className="text-xs text-white/50 mb-4">Enter your email and we'll send you a link to reset your password.</p>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-white/[.64] mb-1.5">Email Address</label>
                  <input
                    className="w-full border border-white/[.12] rounded-xl px-3.5 py-3 bg-white/[.045] text-white text-sm outline-none focus:border-orange placeholder:text-white/[.26]"
                    type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="your@email.com" required autoFocus/>
                </div>
                {forgotStatus === 'error' && (
                  <div className="mb-4 p-[10px_12px] rounded-xl text-xs text-red-300 bg-red-500/[.12] border border-red-500/[.28]">{forgotError}</div>
                )}
                <button type="submit" disabled={forgotStatus === 'sending'} className="button w-full justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                  {forgotStatus === 'sending' ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}
