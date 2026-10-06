"use client";
import { useState, useEffect } from "react";
import { MembersAPI, PaymentsAPI, TokenStore } from "@/lib/api";
import { normalizeContact } from "@/lib/razorpay";
import { Loading, ApiError } from "@/components/shared/States";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faXmark, faCheck } from "@fortawesome/free-solid-svg-icons";

const TIER_LABELS: Record<string, string> = {
  connect: "Connect",
  growth: "Growth",
  elite: "Elite",
  city_leadership: "City Leadership",
  national: "National",
  global: "Global",
};
// Grouping (Digital/Physical) uses each tier's own `type` field from the
// API, not a hardcoded id list — a hardcoded list silently hides any
// custom tier HQ creates later.

// Renders a raw benefit-matrix cell value as it actually came back from the
// API — no reinterpretation, so it never shows something the spreadsheet
// didn't say.
function BenefitCell({ value }: { value: any }) {
  // Real fix for "green looks bullshit": ✅/❌ were raw emoji, which
  // render with their own native OS/browser styling — a bulky, glossy
  // built-in emoji look that ignores any CSS color set on them, not a
  // clean deliberate design choice. Small icon-in-a-circle badges
  // instead, same pattern already used in the marketing pricing page's
  // comparison table (compare-yes/compare-no) — colors actually chosen
  // and controlled here, not whatever the OS emoji font happens to draw.
  if (value === null || value === undefined || value === "")
    return <span style={{ color: "#4b5563" }}>—</span>;
  if (value === "✅")
    return (
      <span
        style={{
          display: "inline-flex",
          width: 20,
          height: 20,
          borderRadius: "50%",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(16,185,129,.15)",
          color: "#10b981",
        }}
      >
        <FontAwesomeIcon icon={faCheck} style={{ fontSize: 10 }} />
      </span>
    );
  if (value === "❌")
    return (
      <span
        style={{
          display: "inline-flex",
          width: 20,
          height: 20,
          borderRadius: "50%",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(239,68,68,.12)",
          color: "#ef4444",
        }}
      >
        <FontAwesomeIcon icon={faXmark} style={{ fontSize: 10 }} />
      </span>
    );
  if (typeof value === "number")
    return <span style={{ color: "#e5e7eb" }}>{Math.round(value * 100)}%</span>;
  return <span style={{ fontSize: 12, color: "#e5e7eb" }}>{value}</span>;
}

function formatDate(d: any) {
  if (!d) return null;
  try {
    // Firestore timestamps sometimes arrive as {seconds,...} or ISO strings
    // depending on serializer — handle both without guessing at a format
    // the backend never promised.
    const date =
      typeof d === "object" && d.seconds
        ? new Date(d.seconds * 1000)
        : new Date(d);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

// Loads Razorpay's checkout script once and reuses it — same script tag
// approach used by any other Razorpay-integrated page in the app.
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const existing = document.getElementById("razorpay-checkout-js");
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function MembershipPage() {
  const me = TokenStore.getUser();
  const [tiers, setTiers] = useState<any[]>([]);
  const [myMembership, setMyMembership] = useState<any | null>(null);
  const [spotlight, setSpotlight] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCompare, setShowCompare] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null); // tier id currently mid-checkout
  const [upgradeError, setUpgradeError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [tiersRes, mineRes, spotlightRes] = await Promise.all([
        MembersAPI.tiers(),
        MembersAPI.list({ page: 1, page_size: 5 }).catch(() => ({ items: [] })),
        MembersAPI.spotlight().catch(() => ({ items: [] })),
      ]);
      setTiers(tiersRes.items || tiersRes || []);
      const mine =
        (mineRes.items || mineRes || []).find(
          (m: any) => m.user_id === me?.id,
        ) || (mineRes.items || mineRes || [])[0];
      setMyMembership(mine || null);
      setSpotlight(spotlightRes.items || spotlightRes || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="page">
        <Loading label="Loading membership tiers…" />
      </div>
    );
  if (error)
    return (
      <div className="page">
        <ApiError message={error} onRetry={fetchData} />
      </div>
    );

  const featureKeys = tiers[0] ? Object.keys(tiers[0].benefits || {}) : [];
  // Physical tiers (city_leadership/national/global) are ignored for now —
  // pricing on those is still "TBD" in the source data anyway, so there's
  // nothing actionable to show a member yet. Filtering by `type` (not a
  // hardcoded id list) means this naturally includes any new Digital
  // custom tier HQ creates later.
  const digitalTiers = tiers.filter(
    (t) => (t.type || "").toLowerCase() === "digital",
  );
  const myTier = myMembership?.tier;

  const myTierIndex = digitalTiers.findIndex((t) => t.tier === myTier);

  const openCompare = () => setShowCompare(true);

  // Which currency this member's membership was priced in — fixed at
  // registration by their detected country (India -> INR, elsewhere ->
  // USD) and stored on the membership doc itself, not re-detected here.
  // Falls back to INR for any membership predating this field.
  const myCurrency = myMembership?.currency === "USD" ? "USD" : "INR";
  const tierPrice = (t: any) =>
    myCurrency === "USD"
      ? { price: t.price_usd, priceNumeric: t.price_usd_numeric }
      : { price: t.price, priceNumeric: t.price_numeric };

  // A pending (never-paid) membership needs a completely different
  // offer than an active one being upgraded: every digital tier is a
  // valid choice (not just ones ranked above the current pick — the
  // signup tier was never actually paid for), and paying for a
  // different tier than originally chosen is fine — payments/service.py's
  // _apply_payment_success sets the membership's final tier to whatever
  // was actually paid for, regardless of what it was before.
  const needsPayment = !!myMembership && myMembership.status !== "active";

  // Tiers ranked strictly above the member's current tier, in the backend's
  // own ALL_TIERS order (connect < growth < elite) — that ordering comes
  // from `digitalTiers` array position, not re-derived here, so it stays
  // correct if HQ adds a custom Digital tier.
  const upgradeOptions =
    myTierIndex >= 0 ? digitalTiers.slice(myTierIndex + 1) : [];
  const payableOptions = needsPayment ? digitalTiers : upgradeOptions;

  const handleUpgrade = async (tier: any) => {
    setUpgradeError("");
    const { priceNumeric } = tierPrice(tier);
    if (priceNumeric === null || priceNumeric === undefined) {
      setUpgradeError(
        `${TIER_LABELS[tier.tier] || tier.tier} pricing is not published yet — please reach out to your Franchise/HQ for this tier.`,
      );
      return;
    }
    setUpgrading(tier.tier);
    try {
      // amount/currency here are just for the initial request shape —
      // create_order() ignores both for membership payments and derives
      // the real chargeable amount + currency server-side from the
      // tier's live price and this member's own detected country, so
      // this can never be spoofed into a different price client-side.
      const order = await PaymentsAPI.createOrder({
        amount: priceNumeric,
        currency: myCurrency,
        reference_type: "membership",
        reference_id: tier.tier,
        plan: myMembership?.plan || "yearly",
      });

      // Manual-entry deployments (no Razorpay key configured) skip
      // checkout entirely — createOrder already marks it paid.
      if (order.status === "success") {
        await fetchData();
        setUpgrading(null);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded)
        throw new Error(
          "Could not load payment gateway — please check your connection and try again.",
        );

      // The cached user can predate the phone field (or come from the
      // pricing page's register response) — fetch it so Razorpay doesn't
      // re-ask for details we already have.
      const payer = normalizeContact(me?.phone)
        ? me
        : (await TokenStore.refreshUser()) || me;

      const rzp = new (window as any).Razorpay({
        key: order.key,
        // Real fix: this used to recompute the charge from tier.price_numeric
        // (always the INR field) instead of trusting order.amount — the
        // server-authoritative amount create_order() already derived
        // correctly for this member's own currency. Using the stale local
        // value here would have shown an Indian-priced amount in the
        // widget even for a USD member's real (server-side) USD charge.
        amount: Math.round(order.amount * 100), // paise/cents
        currency: order.currency || "INR",
        name: "NetworkX",
        description: `${needsPayment ? "Complete payment for" : "Upgrade to"} ${TIER_LABELS[tier.tier] || tier.tier}`,
        order_id: order.gateway_order_id,
        prefill: {
          name: payer?.name,
          email: payer?.email,
          contact: normalizeContact(payer?.phone),
        },
        theme: { color: "#ff5a1f" },
        handler: async (response: any) => {
          try {
            await PaymentsAPI.verify({
              payment_id: order.payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await fetchData();
          } catch (e: any) {
            setUpgradeError(
              e.message ||
                "Payment verification failed — if any amount was deducted, it will be reconciled automatically.",
            );
          } finally {
            setUpgrading(null);
          }
        },
        modal: { ondismiss: () => setUpgrading(null) },
      });
      rzp.on("payment.failed", (resp: any) => {
        setUpgradeError(
          resp?.error?.description || "Payment failed — please try again.",
        );
        setUpgrading(null);
      });
      rzp.open();
    } catch (e: any) {
      setUpgradeError(
        e.message || "Could not start the upgrade — please try again.",
      );
      setUpgrading(null);
    }
  };

  return (
    <div className="page">
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>NetworkX Membership</h2>
        <p style={{ fontSize: 13, color: "var(--nx-muted)" }}>
          Compare tiers and see exactly what your plan unlocks
        </p>
      </div>

      {myMembership && (
        <div
          className="card"
          style={{
            borderLeft: "3px solid var(--nx-orange)",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "var(--nx-muted)" }}>
              Your current tier
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "var(--nx-orange)",
              }}
            >
              {TIER_LABELS[myTier] || myTier || "Not set yet"}
            </div>
            <div
              style={{
                display: "flex",
                gap: 14,
                marginTop: 6,
                flexWrap: "wrap",
              }}
            >
              {formatDate(myMembership.joined_date) && (
                <div style={{ fontSize: 11, color: "var(--nx-muted)" }}>
                  Member since{" "}
                  <span style={{ color: "var(--nx-ink)", fontWeight: 600 }}>
                    {formatDate(myMembership.joined_date)}
                  </span>
                </div>
              )}
              {formatDate(myMembership.renewal_date) ? (
                <div style={{ fontSize: 11, color: "var(--nx-muted)" }}>
                  Valid till{" "}
                  <span style={{ color: "var(--nx-ink)", fontWeight: 600 }}>
                    {formatDate(myMembership.renewal_date)}
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "var(--nx-muted)" }}>
                  Validity not set — contact your coordinator
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {myMembership.status && (
              <span
                className={`badge ${myMembership.status === "active" ? "b-green" : myMembership.status === "warning" ? "b-yellow" : "b-red"}`}
              >
                {myMembership.status === "pending"
                  ? "payment pending"
                  : myMembership.status}
              </span>
            )}
            <button className="btn btn-sm btn-g" onClick={openCompare}>
              Compare tiers
            </button>
          </div>
        </div>
      )}

      {needsPayment && (
        <div
          className="card"
          style={{
            borderLeft: "3px solid #ef4444",
            marginBottom: 16,
            background: "rgba(239,68,68,.06)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>
            Complete your payment to unlock your dashboard
          </div>
          <div style={{ fontSize: 12.5, color: "var(--nx-muted)" }}>
            Your account is set up, but every other page stays locked until this
            is done. Pick any tier below — it doesn't have to be the one you
            originally chose.
          </div>
        </div>
      )}

      {!myMembership && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 16,
          }}
        >
          <button className="btn btn-sm btn-g" onClick={openCompare}>
            Compare tiers
          </button>
        </div>
      )}

      {spotlight.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            <FontAwesomeIcon icon={faStar} className="mr-1.5" />
            Member Spotlight
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {spotlight.map((s: any) => (
              <div
                key={s.id}
                className="card"
                style={{ minWidth: 180, flexShrink: 0, textAlign: "center" }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    margin: "0 auto 8px",
                  }}
                >
                  {s.user?.avatar_url ? (
                    <img
                      src={s.user.avatar_url}
                      alt={s.user?.name || "Member"}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    s.user?.name?.charAt(0) || "?"
                  )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {s.user?.name || "NIA Member"}
                </div>
                {s.spotlight_note && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--nx-muted)",
                      marginTop: 4,
                    }}
                  >
                    {s.spotlight_note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showCompare && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setShowCompare(false)}
        >
          <div className="modal modal-lg">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Compare tiers</h3>
              {/* Real fix: was a bare Unicode "✕" text character (U+2715).
                  Unlike the ❌ emoji used in BenefitCell above (which
                  renders as its own full-color glyph regardless of CSS),
                  a plain text symbol like this inherits color and depends
                  on the font actually having a glyph for it — inconsistent
                  across browsers/fonts, and here it was rendering
                  invisible against the button's own background. A real
                  FontAwesome icon renders as an actual SVG, not a font
                  glyph gamble — same reliable pattern already used for
                  every other close button elsewhere in this app. */}
              {/* Explicit color set directly on the icon — not relying
                  on .btn-g's inherited/CSS-variable color, since that
                  wasn't giving enough contrast against this modal's
                  dark background. */}
              <button
                className="btn btn-xs btn-g"
                onClick={() => setShowCompare(false)}
              >
                <FontAwesomeIcon
                  icon={faXmark}
                  style={{ color: "#ffffff", fontSize: 14 }}
                />
              </button>
            </div>

            <div
              style={{ overflowX: "auto", maxHeight: 420, overflowY: "auto" }}
            >
              <table className="tbl" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <th>Benefit</th>
                    {digitalTiers.map((t) => (
                      <th
                        key={t.tier}
                        style={{
                          color:
                            t.tier === myTier ? "var(--nx-orange)" : undefined,
                        }}
                      >
                        {TIER_LABELS[t.tier] || t.tier}
                        {t.tier === myTier && " (You)"}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: "var(--nx-muted)" }}>
                      Annual Fee
                    </td>
                    {digitalTiers.map((t) => (
                      <td
                        key={t.tier}
                        style={{
                          fontWeight: 700,
                          background:
                            t.tier === myTier
                              ? "rgba(255,90,31,.1)"
                              : undefined,
                        }}
                      >
                        {tierPrice(t).price}
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureKeys.map((fk) => (
                    <tr key={fk}>
                      <td
                        style={{
                          fontSize: 12,
                          color: "var(--nx-muted)",
                          maxWidth: 260,
                        }}
                      >
                        {fk}
                      </td>
                      {digitalTiers.map((t) => (
                        <td
                          key={t.tier}
                          style={{
                            background:
                              t.tier === myTier
                                ? "rgba(255,90,31,.1)"
                                : undefined,
                          }}
                        >
                          <BenefitCell value={t.benefits?.[fk]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              className="btn btn-g"
              style={{ width: "100%", marginTop: 14 }}
              onClick={() => setShowCompare(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {myMembership && payableOptions.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            {needsPayment
              ? "Choose a tier to complete your payment"
              : "Upgrade your membership"}
          </div>
          {upgradeError && (
            <div
              style={{
                fontSize: 12,
                color: "#ef4444",
                background: "rgba(255,90,90,.1)",
                border: "1px solid rgba(255,90,90,.35)",
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 10,
              }}
            >
              {upgradeError}
            </div>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(180px,220px))",
              gap: 10,
            }}
          >
            {payableOptions.map((t: any) => {
              const { price, priceNumeric } = tierPrice(t);
              const isCurrentPick = needsPayment && t.tier === myTier;
              return (
                <div
                  key={t.tier}
                  className="card"
                  style={
                    isCurrentPick
                      ? { borderColor: "var(--nx-orange)" }
                      : undefined
                  }
                >
                  <div style={{ fontSize: 14, fontWeight: 800 }}>
                    {TIER_LABELS[t.tier] || t.tier}
                    {isCurrentPick && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "var(--nx-orange)",
                          marginLeft: 6,
                        }}
                      >
                        YOUR PICK
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: "var(--nx-orange)",
                      margin: "6px 0",
                    }}
                  >
                    {priceNumeric !== null && priceNumeric !== undefined
                      ? price
                      : "TBD"}
                  </div>
                  <button
                    className="btn btn-sm btn-p"
                    style={{ width: "100%" }}
                    disabled={upgrading === t.tier}
                    onClick={() => handleUpgrade(t)}
                  >
                    {upgrading === t.tier
                      ? "Processing…"
                      : priceNumeric !== null && priceNumeric !== undefined
                        ? needsPayment
                          ? `Pay for ${TIER_LABELS[t.tier] || t.tier}`
                          : `Upgrade to ${TIER_LABELS[t.tier] || t.tier}`
                        : "Contact us"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ fontSize: 11, color: "var(--nx-muted)", marginTop: 10 }}>
        Business Hub posting and full Learning Ground access are enforced
        automatically based on your tier — everything else above is
        informational for now.
      </div>
    </div>
  );
}
