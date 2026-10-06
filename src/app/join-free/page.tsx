"use client";
import { useState, useEffect } from "react";
import Header from "@/app/components/shared/Header";
import Footer from "@/app/components/shared/Footer";
import { MembersAPI, TokenStore } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faArrowRight,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { Country } from "country-state-city";

// Deliberately separate from /pricing and PricingClient.tsx, with zero
// dependency on tier_config/price_usd_numeric (the data that broke twice
// on the main pricing page) — this page only ever calls two things:
// MembersAPI.pricingRegion() to confirm eligibility (pure IP-geolocation
// + the Super Admin toggle, no tier pricing involved at all) and
// MembersAPI.register() with tier hardcoded to "elite" so every feature
// is unlocked, matching the "enable all features for now" requirement.
// register_member() independently re-verifies both the country and the
// toggle server-side regardless of what this page believes — this
// page's own check is only for what to SHOW the visitor, never the
// actual security boundary.
//
// Real fix: the first version used .card/.fg classes and var(--nx-*)
// tokens copied from franchise-apply/page.tsx — those only exist in
// dashboard-globals.css, which is loaded under /dashboard/* only. On a
// public page like this one they resolve to nothing, so every input
// fell back to the browser's raw unstyled default. Inline styles here
// instead, using globals.css's real public-page tokens (--night/--panel/
// --ink/--muted/--line/--orange) — the same ones PricingClient.tsx's
// RegisterModal already uses successfully.
const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  country: "",
  city: "",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid rgba(255,255,255,.15)",
  borderRadius: 8,
  fontSize: 13,
  background: "rgba(255,255,255,.05)",
  color: "#fff",
  outline: "none",
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 4,
};

const countries = Country.getAllCountries();

export default function JoinFreePage() {
  const [checking, setChecking] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [countryCode, setCountryCode] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<"active" | "pending" | null>(null);

  useEffect(() => {
    MembersAPI.pricingRegion()
      .then((r: any) => {
        setEligible(!!r?.free_signup_enabled);
        // Same IP-geolocation call this page already made for the
        // eligibility check — reused here to default the Country field
        // instead of leaving a visitor from, say, the US staring at an
        // empty "Select country…" dropdown. Still fully editable; this
        // never affects what register_member() actually verifies
        // server-side, same as the eligibility check itself.
        if (r?.country) {
          const detected = countries.find((c) => c.isoCode === r.country);
          if (detected) {
            setCountryCode(detected.isoCode);
            setForm((f) => ({ ...f, country: detected.name }));
          }
        }
      })
      .catch(() => setEligible(false))
      .finally(() => setChecking(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.password.trim() ||
      !form.country.trim() ||
      !form.city.trim()
    ) {
      setError("All fields are required");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const reg = await MembersAPI.register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        country: form.country.trim(),
        city: form.city.trim(),
        tier: "elite",
      });
      TokenStore.setTokens(reg.access_token, reg.refresh_token, true);
      TokenStore.setUser(reg.user, true);
      // Almost always "active" — the eligibility check above already
      // confirmed the offer is live for this visitor. Handled anyway in
      // case something changed between page-load and submit (Super
      // Admin turned the toggle off mid-session, etc.) rather than
      // assuming success always means free.
      setResult(
        reg.user?.membership_status === "active" ? "active" : "pending",
      );
    } catch (e: any) {
      setError(e.message || "Something went wrong — please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "var(--night, #020a16)", minHeight: "100vh" }}>
      <Header />
      {/* Real fix: .site-header (globals.css) is position:absolute, so it
          takes zero space in normal document flow — it doesn't push this
          div down at all, it just overlays whatever renders at the top.
          Every page using <Header/> has to manually reserve room for it;
          PricingClient.tsx's .pricing-hero does this with 90px top
          padding, matched here instead of the 60px that let this content
          render underneath the header/nav. */}
      <div
        style={{
          minHeight: "70vh",
          padding: "130px 20px 60px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: 440, width: "100%" }}>
          {checking ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 0",
                color: "var(--muted, #98a8bc)",
                fontSize: 13,
              }}
            >
              Checking availability…
            </div>
          ) : result === "active" ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12, color: "#10b981" }}>
                <FontAwesomeIcon icon={faCircleCheck} />
              </div>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--ink, #f7f9fc)",
                  marginBottom: 8,
                }}
              >
                You're in — free, full access.
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted, #98a8bc)",
                  marginBottom: 8,
                }}
              >
                Your NetworkX membership is active, no payment needed. One more
                step — we've sent a verification link to your email.
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--muted, #98a8bc)",
                  marginBottom: 20,
                }}
              >
                <strong>Check your spam or junk folder too</strong> if you don't
                see it — the dashboard unlocks once you verify.
              </p>
              <a
                className="button"
                href="/dashboard"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                Go to Dashboard <FontAwesomeIcon icon={faArrowRight} />
              </a>
            </div>
          ) : result === "pending" ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12, color: "#10b981" }}>
                <FontAwesomeIcon icon={faCircleCheck} />
              </div>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--ink, #f7f9fc)",
                  marginBottom: 8,
                }}
              >
                Account created.
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted, #98a8bc)",
                  marginBottom: 20,
                }}
              >
                The free offer isn't available for your account right now — head
                to your dashboard to complete membership.
              </p>
              <a
                className="button"
                href="/dashboard"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                Go to Dashboard <FontAwesomeIcon icon={faArrowRight} />
              </a>
            </div>
          ) : !eligible ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--ink, #f7f9fc)",
                  marginBottom: 8,
                }}
              >
                This offer isn't available right now
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted, #98a8bc)",
                  marginBottom: 20,
                }}
              >
                Free membership is only available outside India, for a limited
                time. Head to our regular plans instead.
              </p>
              <a
                className="button"
                href="/pricing"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                See NetworkX Plans <FontAwesomeIcon icon={faArrowRight} />
              </a>
            </div>
          ) : (
            <>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "var(--ink, #f7f9fc)",
                  marginBottom: 6,
                }}
              >
                Join NetworkX — free.
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted, #98a8bc)",
                  marginBottom: 24,
                }}
              >
                Full access to the community — no payment, no card, available
                for a limited time outside India.
              </p>

              {error && (
                <div
                  style={{
                    background: "rgba(255,90,90,.1)",
                    border: "1px solid rgba(255,90,90,.35)",
                    color: "#ef4444",
                    padding: "10px 14px",
                    borderRadius: 10,
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  {error}
                </div>
              )}

              <form
                onSubmit={submit}
                style={{
                  background: "var(--panel, #071728)",
                  border: "1px solid var(--line, rgba(112,153,198,.17))",
                  borderRadius: 16,
                  padding: 24,
                }}
              >
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={inputStyle}
                    placeholder="Your name"
                  />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Email *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="you@company.com"
                  />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Phone *</label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Password *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      required
                      type={showPw ? "text" : "password"}
                      minLength={8}
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      style={{ ...inputStyle, paddingRight: 40 }}
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--muted, #98a8bc)",
                      }}
                    >
                      <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Country *</label>
                  <select
                    required
                    value={countryCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setCountryCode(code);
                      setForm({
                        ...form,
                        country: Country.getCountryByCode(code)?.name || "",
                      });
                    }}
                    style={inputStyle}
                  >
                    {/* Real fix: color:#fff on the <select> cascades into
                        every <option>, but the OPEN dropdown list renders
                        with the browser's own native (usually white/light)
                        background — not this page's dark theme — so white
                        text landed on a white list, invisible. Each
                        <option> needs its own explicit dark background +
                        light text; inputStyle's color alone isn't enough
                        once the list itself opens. */}
                    <option
                      value=""
                      style={{ background: "#0b1220", color: "#fff" }}
                    >
                      Select country…
                    </option>
                    {countries.map((c) => (
                      <option
                        key={c.isoCode}
                        value={c.isoCode}
                        style={{ background: "#0b1220", color: "#fff" }}
                      >
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>City *</label>
                  <input
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    style={inputStyle}
                    placeholder="e.g. New York"
                  />
                </div>
                <button
                  type="submit"
                  className="button"
                  disabled={saving}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {saving ? (
                    "Creating account…"
                  ) : (
                    <>
                      Get Started Free <FontAwesomeIcon icon={faArrowRight} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
