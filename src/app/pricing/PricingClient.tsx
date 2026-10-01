'use client'
import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/app/components/shared/Header";
import Footer from "@/app/components/shared/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faCheck, faXmark, faEye, faEyeSlash, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { MembersAPI, TerritoriesAPI, PaymentsAPI, TokenStore, ContributionAPI } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";
// Deliberately NOT a static top-level import — country-state-city ships
// its entire worldwide city database (150,000+ cities, ~8MB minified) in
// one JS module. A static import here put that 8MB in EVERY visitor's
// /pricing page load, even the majority who never click Register. Loaded
// dynamically inside RegisterModal instead (see its own useEffect below),
// so it's only fetched once someone actually opens the registration form.

// Note: page-level `export const metadata` was removed — this file is now
// 'use client' (needed for the registration/payment flow's state and the
// Razorpay widget), and Next.js doesn't allow a client component to also
// export metadata. If the <title>/description need to stay exact, they
// should move to a small server-only pricing/layout.tsx wrapping this
// page instead — flagging this rather than silently dropping the SEO tags.

type Plan = {
  name: string;
  tierId: string;       // real backend tier id — "connect" | "growth" | "elite"
  price: string;        // live display price, e.g. "₹4,999" or "$99" — currency depends on the visitor's detected country
  priceNumeric: number | null;  // live numeric amount actually charged — null means not purchasable yet (HQ hasn't set a price)
  currency: "INR" | "USD";
  audience: string;
  description: string;
  popular?: boolean;
  features: string[];
};

// Marketing copy only — name/audience/description/features stay curated
// text. This is NOT the source of which tiers show as cards anymore
// (see PricingPage below) — it's just copy to attach to whichever
// tiers the live API says are type:"Digital". A tier id with no entry
// here still renders, using a plain generic fallback, so a brand-new
// digital tier HQ creates shows up immediately without a frontend
// code change — that was the actual gap: the previous version's fixed
// 3-tier-id array meant a new tier could never appear here at all,
// only the price within the existing 3 cards ever updated live.
const PLAN_COPY: Record<string, { audience: string; description: string; features: string[]; popular?: boolean }> = {
  connect: {
    audience: "Best for individuals",
    description: "Build your trusted business network and access the essential NetworkX community tools.",
    features: ["Community introductions", "WhatsApp digital community", "Mobile app and NetworkX CRM", "Referral chapters", "Free learning courses", "Membership card and sticker", "Business Hub view access", "Monthly live training"],
  },
  growth: {
    audience: "Best for growing businesses",
    description: "Unlock intelligent matching, opportunities and full learning access to accelerate your growth.",
    popular: true,
    features: ["Everything in Connect", "AI member matching", "Co-founder matchmaking", "Deals Corner and investor circles", "Member spotlight opportunities", "Full LMS course access", "Business Hub view and post", "Free state summit invitations"],
  },
  elite: {
    audience: "Best for serious founders",
    description: "A premium membership for ambitious founders seeking visibility, access and deeper collaboration.",
    features: ["Everything in Growth", "Priority founder positioning", "Speaking opportunity selection", "Full learning access", "Complete membership merchandise", "Business Hub view and post", "National summit benefits", "GeM portal support add-on"],
  },
};

// Keep the public purchase page usable during a temporary API outage.
// Successful API responses still replace these with HQ-managed values.
// India-only — used while the live tiers API hasn't responded yet, and
// only ever shown to a visitor we haven't yet confirmed is outside India
// (see isIndia's default of true in PricingClient below).
const FALLBACK_PLANS: Plan[] = [
  {tierId:'connect', name:'Connect', price:'₹1,999', priceNumeric:1999, currency:'INR', ...PLAN_COPY.connect},
  {tierId:'growth', name:'Growth', price:'₹4,999', priceNumeric:4999, currency:'INR', ...PLAN_COPY.growth},
  {tierId:'elite', name:'Elite', price:'₹9,999', priceNumeric:9999, currency:'INR', ...PLAN_COPY.elite},
];
const FALLBACK_REFERRAL_PRICES: Record<string, number> = {connect:1799, growth:4299, elite:8999};

// Same tier, two independently-priced currencies — which one to read
// depends on the visitor's detected country, not the tier itself.
// Referral discounting (see PricingClient below) is an India-only
// mechanic and never applies to the USD price.
function planFromLiveTier(t: any, isIndia: boolean): Plan {
  const copy = PLAN_COPY[t.tier] || { audience: "NetworkX membership", description: "A NetworkX membership tier.", features: Object.keys(t.benefits || {}).slice(0, 8) };
  const displayName = t.tier.split("_").map((w: string) => w[0].toUpperCase() + w.slice(1)).join(" ");
  return {
    name: displayName,
    tierId: t.tier,
    price: isIndia ? (t.price || "—") : (t.price_usd || "—"),
    priceNumeric: isIndia ? (t.price_numeric ?? null) : (t.price_usd_numeric ?? null),
    currency: isIndia ? "INR" : "USD",
    audience: copy.audience,
    description: copy.description,
    features: copy.features,
    popular: !!copy.popular,
  };
}

type ComparisonRow = { feature: string; connect: boolean | string; growth: boolean | string; elite: boolean | string };

const comparisonGroups: { title: string; rows: ComparisonRow[] }[] = [
  {
    title: "Community & Networking",
    rows: [
      { feature: "Introductions posted in the community", connect: true, growth: true, elite: true },
      { feature: "WhatsApp digital community", connect: true, growth: true, elite: true },
      { feature: "Mobile app access", connect: true, growth: true, elite: true },
      { feature: "NetworkX CRM — meetings and follow-ups", connect: true, growth: true, elite: true },
      { feature: "Referral chapters", connect: true, growth: true, elite: true },
      { feature: "AI member matching", connect: false, growth: true, elite: true },
      { feature: "Co-founder matchmaking", connect: false, growth: true, elite: true },
      { feature: "Deals Corner — member offers and discounts", connect: false, growth: true, elite: true },
      { feature: "Investor reachout and VC circles", connect: false, growth: true, elite: true },
      { feature: "Member Spotlight on the app", connect: false, growth: true, elite: true },
      { feature: "Speaking opportunities", connect: false, growth: "Selection", elite: "Selection" },
    ],
  },
  {
    title: "Learning, Membership & Business Tools",
    rows: [
      { feature: "Online learning sessions with certificate", connect: "Free courses", growth: "Full access", elite: "Full access" },
      { feature: "Membership card / 25 business cards", connect: "Included", growth: "Included", elite: "Included" },
      { feature: "NetworkX member sticker", connect: "Included", growth: "Included", elite: "Included" },
      { feature: "Round-neck NetworkX T-shirt", connect: "Buy", growth: "Included", elite: "Included" },
      { feature: "NetworkX official pin", connect: "Buy", growth: "Included", elite: "Included" },
      { feature: "Business Hub requirement posts", connect: "View only", growth: "View & post", elite: "View & post" },
      { feature: "Monthly online live training", connect: "Included", growth: "Included", elite: "Included" },
    ],
  },
  {
    title: "Events & Founder Access",
    rows: [
      { feature: "National Summit invitation benefit", connect: "25%", growth: "50%", elite: "50%" },
      { feature: "State Summit invitations", connect: "50%", growth: "Included", elite: "Included" },
      { feature: "Pitch practice — online", connect: "Paid", growth: "Paid", elite: "Paid" },
      { feature: "Annual Award Night", connect: "Paid", growth: "Paid", elite: "Paid" },
      { feature: "GeM portal support app", connect: false, growth: false, elite: "Paid add-on" },
    ],
  },
];

function Value({ value }: { value: boolean | string }) {
  if (value === true) return <span className="compare-yes" aria-label="Included"><FontAwesomeIcon icon={faCheck} /></span>;
  if (value === false) return <span className="compare-no" aria-label="Not included"><FontAwesomeIcon icon={faXmark} /></span>;
  return <span className="compare-text">{value}</span>;
}

// ── Registration + payment modal ──────────────────────────────────────────
// Was a bare mailto: link before — no actual signup or payment existed
// for a visitor choosing a plan on this page at all.
function RegisterModal({ plan, onClose, referralCode, referrerName }: { plan: Plan; onClose: () => void; referralCode?: string; referrerName?: string }) {
  const [territories, setTerritories] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [territoryId, setTerritoryId] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [city, setCity] = useState("");
  const [step, setStep] = useState<"form" | "paying" | "success">("form");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  // Referral price for THIS specific plan, if a referral is attributed
  // and this tier has referral pricing enabled. Purely for display
  // before payment — the actual charged amount is already correctly
  // enforced server-side in create_order() regardless of what's shown
  // here, but showing the wrong price before payment would be a
  // confusing, broken-feeling experience even though it's not an
  // actual security issue.
  const [referralPrice, setReferralPrice] = useState<number | null>(null);
  useEffect(() => {
    if (!referralCode) return;
    ContributionAPI.referralPricingPublic().then((econ: any) => {
      const tierEcon = econ[plan.tierId];
      if (tierEcon && tierEcon.enabled) setReferralPrice(tierEcon.referral_price);
    }).catch(() => {});
  }, [referralCode, plan.tierId]);

  // Loaded once, when the modal actually mounts — see the note by the
  // top-of-file import comment. Deliberately imports the country/state
  // SUBMODULES directly, not the package's own index barrel
  // ("country-state-city") — that barrel does
  // `import Country from './country'; import State from './state';
  // import City from './city';` unconditionally, so even a dynamic
  // import("country-state-city") still pulls in city.js's 8MB
  // city.json as part of that one chunk, regardless of only
  // destructuring Country/State from the resolved module afterward.
  // Importing "country-state-city/lib/country" and ".../state"
  // directly bundles only their own (93KB + 554KB) data. City is a
  // free-text input below instead, matching join-free/page.tsx.
  const [csc, setCsc] = useState<{ Country: any; State: any } | null>(null);
  useEffect(() => {
    Promise.all([
      import("country-state-city/lib/country"),
      import("country-state-city/lib/state"),
    ]).then(([countryMod, stateMod]) => setCsc({ Country: countryMod.default, State: stateMod.default }));
  }, []);

  // Same IP-geolocation call the parent pricing page already made for
  // its India/USD pricing decision (60s-cached by MembersAPI.pricingRegion
  // itself, so this is a cache hit, not a second real request) — reused
  // here to default this modal's own Country field instead of leaving it
  // on "Select country…" every time. Only applies if the visitor hasn't
  // already picked one (e.g. this resolves after they started typing).
  // Waits on csc since it needs Country.getAllCountries() to resolve the
  // detected ISO code to a real entry.
  useEffect(() => {
    if (!csc) return;
    MembersAPI.pricingRegion().then((r: any) => {
      if (r?.country && !countryCode) {
        const detected = csc.Country.getAllCountries().find((c: any) => c.isoCode === r.country);
        if (detected) setCountryCode(detected.isoCode);
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csc]);

  const displayPrice = referralPrice ?? plan.priceNumeric;
  const countries: any[] = csc ? csc.Country.getAllCountries() : [];
  const states: any[] = csc && countryCode ? csc.State.getStatesOfCountry(countryCode) : [];
  const locationSelectStyle = {width:'100%',padding:'10px 12px',border:'1px solid rgba(255,255,255,.15)',borderRadius:8,fontSize:13,background:'#111d2d',color:'#fff',outline:'none'};

  // Lock background scroll while this modal is open — it's rendered
  // conditionally by the parent ({selectedPlan && <RegisterModal/>}),
  // so this component only ever exists in the DOM while open, meaning
  // an empty-deps effect correctly locks on mount and its cleanup
  // correctly restores on close/unmount, with no extra prop needed.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, []);

  useEffect(() => {
    TerritoriesAPI.public().then((r: any) => setTerritories(r.items || r)).catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Real fix: this used to be `if (!plan.priceNumeric)`, which also
    // blocks a genuinely free ($0) plan — 0 is falsy, but it's not the
    // same thing as "no price set yet" (null/undefined, HQ hasn't
    // published one). Only the latter should actually block submission.
    if (plan.priceNumeric === null || plan.priceNumeric === undefined) { setErr("This plan isn't available for online purchase yet — please contact our team directly."); return; }
    setErr(""); setLoading(true);
    try {
      // 1. Create the account + a pending membership on this tier.
      const selectedCountry = csc?.Country.getCountryByCode(countryCode);
      const selectedState = csc?.State.getStateByCodeAndCountry(stateCode, countryCode);
      const matchingTerritory = territories.find((t:any) => {
        const territoryCity = String(t.city || t.name || '').toLowerCase();
        return territoryCity === city.toLowerCase();
      });
      const reg = await MembersAPI.register({
        name, email, phone, password,
        country: selectedCountry?.name,
        state: selectedState?.name,
        city,
        territory_id: matchingTerritory?.id || territoryId || undefined,
        tier: plan.tierId,
        referral_code: referralCode || undefined,
      });
      // Treat a successful registration exactly like a normal login —
      // same tokens, same storage — so the payment call right after
      // this is a normal authenticated request, not a special case.
      TokenStore.setTokens(reg.access_token, reg.refresh_token, true);
      TokenStore.setUser(reg.user, true);

      // The free-signup path (and any tier HQ has genuinely priced at 0)
      // is already active — register_member() only leaves a membership
      // "pending" when something is actually owed. Skip straight to
      // success instead of asking Razorpay to open a $0 checkout, which
      // it isn't built to handle.
      if (reg.user?.membership_status === "active") {
        setStep("success");
        return;
      }

      // 2. Real order via the same Razorpay flow already used
      // elsewhere in the app (Events, Store) — reference_type
      // "membership" is what payments/service.py's
      // _apply_payment_success already knows how to activate.
      setStep("paying");
      const order = await PaymentsAPI.createOrder({
        amount: displayPrice,
        plan: "yearly",
        reference_type: "membership",
        reference_id: plan.tierId,
      });

      await openRazorpayCheckout({
        order,
        description: `NetworkX ${plan.name} Membership`,
        memberName: name,
        memberEmail: email,
        memberPhone: phone,
        onSuccess: () => {
          // The cached user object still carries step 1's pre-payment
          // membership_status ("pending") — patch it to "active" now so
          // the "Go to Dashboard" link right below, and any status-based
          // gate on that page, see the membership as paid without
          // waiting for a fresh login.
          const cachedUser = TokenStore.getUser();
          if (cachedUser) {
            TokenStore.setUser({ ...cachedUser, membership_status: "active", membership_tier: plan.tierId }, true);
          }
          setStep("success");
        },
        onFailure: (e) => { setErr(e.message); setStep("form"); },
      });
    } catch (e: any) {
      setErr(e.message || "Something went wrong");
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(0,0,0,.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{
        maxWidth: 440, width: "100%", maxHeight: "88vh", overflowY: "auto",
        background: "var(--night-2, #0b1220)", color: "var(--ink, #fff)",
        border: "1px solid var(--line, rgba(112,153,198,.17))",
        borderRadius: 16, padding: 24,
        boxShadow: "0 24px 60px rgba(0,0,0,.5)",
      }}>
        {step === "success" ? (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <FontAwesomeIcon icon={faCheck} style={{ fontSize: 40, color: "var(--green)", marginBottom: 12 }} />
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Welcome to NetworkX!</div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>Your {plan.name} membership is active. One more step — we've sent a verification link to your email.</p>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}><strong>Check your spam or junk folder too</strong> if you don't see it — the dashboard unlocks once you verify.</p>
            <a className="button" style={{ width: "100%", justifyContent: "center" }} href="/dashboard">Go to Dashboard <FontAwesomeIcon icon={faArrowRight} className="ml-1" /></a>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>Join {plan.name}</div>
                {/* Real update: shows the actual referral-discounted
                    price when one applies (spec section 29's "Member-
                    Referred Joining Benefit" example), instead of
                    always showing the normal price even when a
                    referral is attributed. */}
                {referralPrice != null ? (
                  <div style={{ fontSize: 13 }}>
                    <span style={{ color: "var(--muted)", textDecoration: "line-through", marginRight: 6 }}>{plan.price}</span>
                    <span style={{ color: "#10b981", fontWeight: 700 }}>₹{referralPrice.toLocaleString('en-IN')}</span>
                    <span style={{ color: "var(--muted)" }}> / year</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>{plan.price} / year</div>
                )}
              </div>
              <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            {referralCode && (
              <div style={{background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.3)',borderRadius:10,padding:'10px 14px',marginTop:12,fontSize:12}}>
                You've been invited to NetworkX by <strong>{referrerName}</strong>{referralPrice != null ? ' — your member-referred joining benefit is applied above.' : '.'}
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" style={{width:'100%',padding:'10px 12px',border:'1px solid rgba(255,255,255,.15)',borderRadius:8,fontSize:13,background:'rgba(255,255,255,.05)',color:'#fff',outline:'none'}} />
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" style={{width:'100%',padding:'10px 12px',border:'1px solid rgba(255,255,255,.15)',borderRadius:8,fontSize:13,background:'rgba(255,255,255,.05)',color:'#fff',outline:'none'}} />
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+91 98765 43210" style={{width:'100%',padding:'10px 12px',border:'1px solid rgba(255,255,255,.15)',borderRadius:8,fontSize:13,background:'rgba(255,255,255,.05)',color:'#fff',outline:'none'}} />
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters" style={{width:'100%',paddingRight:40,padding:'10px 12px',border:'1px solid rgba(255,255,255,.15)',borderRadius:8,fontSize:13,background:'rgba(255,255,255,.05)',color:'#fff',outline:'none'}} />
                <button type="button" onClick={() => setShowPw((s) => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                  <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:states.length?'1fr 1fr':'1fr',gap:10,marginTop:10}}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Country</label>
                <select value={countryCode} onChange={(e)=>{setCountryCode(e.target.value);setStateCode('');setCity('');setTerritoryId('')}} required style={locationSelectStyle}>
                  <option value="">Select country…</option>
                  {countries.map(country=><option key={country.isoCode} value={country.isoCode}>{country.flag} {country.name}</option>)}
                </select>
              </div>
              {states.length > 0 && <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>State / Province</label>
                <select value={stateCode} onChange={(e)=>{setStateCode(e.target.value);setCity('');setTerritoryId('')}} required style={locationSelectStyle}>
                  <option value="">Select state…</option>
                  {states.map(state=><option key={state.isoCode} value={state.isoCode}>{state.name}</option>)}
                </select>
              </div>}
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>City</label>
              <input value={city} onChange={(e)=>setCity(e.target.value)} required placeholder="e.g. New York" style={locationSelectStyle} />
            </div>
            {err && <div style={{ marginTop: 12, fontSize: 12, color: "#ef4444" }}>{err}</div>}
            <button type="submit" disabled={loading} className="button" style={{ width: "100%", justifyContent: "center", marginTop: 18 }}>
              {step === "paying" ? <><FontAwesomeIcon icon={faSpinner} className="mr-1.5 animate-spin" />Opening payment…</> : loading ? "Creating account…" : <>Continue to Payment <FontAwesomeIcon icon={faArrowRight} className="ml-1" /></>}
            </button>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 10, textAlign: "center" }}>You'll be redirected to Razorpay to complete payment securely.</p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function PricingClient() {
  const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [referrerName, setReferrerName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralPrices, setReferralPrices] = useState<Record<string, number>>({});
  // Defaults to India (the safe direction — real ₹ pricing) until the
  // pricing-region check below confirms otherwise, so an Indian visitor
  // is never even briefly shown a USD price meant for someone else. The
  // free-signup offer itself now lives on its own separate page
  // (/join-free) with zero dependency on tier_config/price_usd data —
  // this page only ever shows the normal INR/USD tier picker.
  const [isIndia, setIsIndia] = useState(true);

  useEffect(() => {
    MembersAPI.pricingRegion().then((r: any) => setIsIndia(r?.is_india !== false)).catch(() => {});
  }, []);

  useEffect(() => {
    // Referral discounting is an India-only mechanic — referral_price on
    // record, and the whole referral-economics config, are INR amounts.
    const isReferralCheckout = window.location.pathname.startsWith('/join/plans');
    if (!isReferralCheckout || !isIndia) { setReferralCode(''); setReferrerName(''); setReferralPrices({}); return; }
    const queryCode = new URLSearchParams(window.location.search).get('code') || '';
    const cookieCode = document.cookie.match(/(?:^|; )nx_referral_code=([^;]*)/)?.[1] || '';
    const cookieName = document.cookie.match(/(?:^|; )nx_referral_name=([^;]*)/)?.[1] || '';
    const code = queryCode || decodeURIComponent(cookieCode);
    if (!code) return;
    // The invite page has already validated the code and stored the resolved
    // member name. Show that context immediately while refreshing it from API.
    setReferralCode(code);
    if (cookieName) setReferrerName(decodeURIComponent(cookieName));
    setReferralPrices(FALLBACK_REFERRAL_PRICES);
    ContributionAPI.resolveCode(code).then((result:any) => {
      if (!result.valid) { setReferralCode(''); setReferrerName(''); setReferralPrices({}); return; }
      setReferralCode(code);
      setReferrerName(result.referrer_name);
      return ContributionAPI.referralPricingPublic();
    }).then((economics:any) => {
      if (!economics) return;
      const prices: Record<string,number> = {};
      Object.entries(economics).forEach(([tier, config]:[string,any]) => {
        if (config?.enabled && config?.referral_price != null) prices[tier] = config.referral_price;
      });
      setReferralPrices(prices);
    }).catch(()=>{});
  }, [isIndia]);

  useEffect(() => {
    // Real fix: cards are now built FROM the live response's
    // type:"Digital" tiers, not merged into a fixed hardcoded array of
    // 3 tier ids. A new digital tier HQ creates via the admin screen
    // appears here automatically on next load — the previous version
    // could only ever update the price shown inside 3 fixed cards,
    // never add or remove a card, which was the actual hardcoding
    // being asked about. Physical tiers (city_leadership/national/
    // global) are filtered out here since they're not self-service
    // purchasable — confirmed via the real `type` field the backend
    // already tracks per tier, not a guess about tier id naming.
    MembersAPI.tiersPublic().then((r: any) => {
      const live: any[] = r.items || r;
      const digital = live.filter((t) => t.type === "Digital");
      if (digital.length) setPlans(digital.map((t) => planFromLiveTier(t, isIndia)));
    }).catch(() => setPlans(FALLBACK_PLANS));
  }, [isIndia]);

  return (
    <main className="pricing-page">
      <Header />

      <section className="pricing-hero">
        <div className="pricing-kicker">{referralCode ? 'MEMBER INVITATION' : 'MEMBERSHIP PLANS'}</div>
        <h1>{referralCode ? <>Choose your invited<br /><em>membership plan.</em></> : <>Choose the plan that<br /><em>moves you forward.</em></>}</h1>
        <p>Start building meaningful business relationships today. Every NetworkX plan includes the core community experience, with more intelligence, access and visibility as you grow.</p>
        {referrerName && <div style={{display:'inline-flex',marginTop:20,padding:'10px 16px',borderRadius:999,border:'1px solid rgba(16,185,129,.38)',background:'rgba(16,185,129,.1)',color:'#d8fff0',fontSize:13}}>Invitation from <strong style={{marginLeft:4}}>{referrerName}</strong> · Member joining prices applied</div>}
        <div className="annual-pill">Annual membership · One simple payment</div>
      </section>

      <section className="pricing-cards" aria-label="NetworkX membership plans">
        {plans.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 40, color: "var(--muted)" }}>No membership plans are available right now — please check back soon.</div>
        ) : plans.map((plan) => (
          <article className={`pricing-card${plan.popular ? " popular" : ""}`} key={plan.name}>
            {plan.popular && <span className="popular-badge">Most Popular</span>}
            <div className="plan-name">{plan.name}</div>
            <div className="plan-price"><strong>{referralPrices[plan.tierId] != null ? `₹${referralPrices[plan.tierId].toLocaleString('en-IN')}` : plan.price}</strong><span>/ year</span></div>
            {referralPrices[plan.tierId] != null && <div style={{fontSize:12,color:'#8fa0b2',marginTop:5}}>Member-referred price · <span style={{textDecoration:'line-through'}}>{plan.price}</span></div>}
            <p>{plan.description}</p>
            <div className="plan-audience">{plan.audience}</div>
            <button
              type="button"
              className={`button plan-button${plan.popular ? "" : " button-secondary"}`}
              onClick={() => setSelectedPlan(plan)}
              disabled={plan.priceNumeric === null}
            >
              {plan.priceNumeric === null ? "Contact us" : `Choose ${plan.name}`}<FontAwesomeIcon icon={faArrowRight} />
            </button>
            <ul>{plan.features.map((feature) => <li key={feature}><span><FontAwesomeIcon icon={faCheck} /></span>{feature}</li>)}</ul>
          </article>
        ))}
      </section>

      <section className="comparison-section">
        <div className="comparison-heading"><div className="pricing-kicker">COMPARE BENEFITS</div><h2>Everything, side by side.</h2><p>Review the complete membership benefits and choose the access level that matches your ambitions.</p></div>
        <div className="comparison-scroll" role="region" aria-label="Scrollable plan comparison" tabIndex={0}>
          <table>
            <thead><tr><th>Benefits</th><th>Connect<br /><span>{plans.find(p=>p.tierId==='connect')?.price}</span></th><th className="growth-column">Growth<br /><span>{plans.find(p=>p.tierId==='growth')?.price}</span><em>Most Popular</em></th><th>Elite<br /><span>{plans.find(p=>p.tierId==='elite')?.price}</span></th></tr></thead>
            <tbody>
              {comparisonGroups.map((group) => (
                <FragmentGroup key={group.title} title={group.title} rows={group.rows} />
              ))}
              <tr className="best-for-row"><th>Best for</th><td>Individuals</td><td>Growing businesses</td><td>Serious founders</td></tr>
            </tbody>
          </table>
        </div>
        <p className="comparison-note">Membership benefits, event access and paid add-ons may be subject to availability and selection criteria.</p>
      </section>

      <section className="pricing-cta">
        <div><span>READY TO JOIN?</span><h2>Your next opportunity starts with one connection.</h2><p>Choose your NetworkX membership and start building what's next.</p></div>
        <a className="button" href="mailto:hello@networkxcircle.com">Talk to our team <FontAwesomeIcon icon={faArrowRight} /></a>
      </section>

      <Footer />

      {selectedPlan && <RegisterModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} referralCode={referralCode || undefined} referrerName={referrerName || undefined} />}
    </main>
  );
}

function FragmentGroup({ title, rows }: { title: string; rows: ComparisonRow[] }) {
  return (
    <>
      <tr className="comparison-group"><th colSpan={4}>{title}</th></tr>
      {rows.map((row) => <tr key={row.feature}><th>{row.feature}</th><td><Value value={row.connect} /></td><td><Value value={row.growth} /></td><td><Value value={row.elite} /></td></tr>)}
    </>
  );
}
