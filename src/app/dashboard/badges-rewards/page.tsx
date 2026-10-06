"use client";
import { useState, useEffect } from "react";
import { ContributionAPI, WalletAPI } from "@/lib/api";
import { Loading, ApiError } from "@/components/shared/States";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSeedling,
  faUserCheck,
  faLink,
  faPeopleGroup,
  faCrown,
  faCopy,
  faQrcode,
  faWallet,
  faClockRotateLeft,
  faCheckCircle,
  faBriefcase,
  faTag,
  faGraduationCap,
  faIdCard,
  faHandshake,
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

// ── Journey — icon per status, matches spec section 15's "show the actual
// badge artwork for every status" requirement. Order here is fixed
// left-to-right (Newcomer -> Ambassador); actual labels/thresholds are
// config-driven from ContributionAPI.me(), this is just the icon lookup.
const STATUS_ICONS: Record<string, any> = {
  Newcomer: faSeedling,
  "Active Member": faUserCheck,
  Connector: faLink,
  "Community Builder": faPeopleGroup,
  "NetworkX Ambassador": faCrown,
};
const STATUS_ORDER = [
  "Newcomer",
  "Active Member",
  "Connector",
  "Community Builder",
  "NetworkX Ambassador",
];

function formatMoney(n: number) {
  return "₹" + (n || 0).toLocaleString("en-IN");
}

export default function BadgesRewardsPage() {
  const [contribution, setContribution] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [referral, setReferral] = useState<any>(null);
  const [invitationStats, setInvitationStats] = useState<any>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyMsg, setCopyMsg] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMsg, setWithdrawMsg] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [c, w, t, r, rs] = await Promise.all([
        ContributionAPI.me(),
        WalletAPI.me(),
        WalletAPI.transactions({ page: 1, page_size: 10 }),
        ContributionAPI.referralCode(),
        // Keep the full page usable while an older backend deployment is
        // rolling over and does not expose this new route yet.
        ContributionAPI.invitationStats().catch(() => null),
      ]);
      setContribution(c);
      setWallet(w);
      setTransactions(t.items || t);
      setReferral(r);
      setInvitationStats(
        rs || {
          attributed_registrations: c.successful_member_referrals || 0,
          active_members_joined: c.successful_member_referrals || 0,
          awaiting_membership: 0,
          recent_members: [],
        },
      );
      ContributionAPI.recognition()
        .then(setRecognition)
        .catch(() => setRecognition({ city_top3: [], global_top3: [] }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const invitationUrl = () => {
    if (!referral?.referral_code) return referral?.referral_url || "";
    // `next dev` cannot serve Firebase Hosting's dynamic /join/** rewrite.
    // Keep localhost testing local and use the join shell's documented query fallback.
    if (
      typeof window !== "undefined" &&
      ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ) {
      return `${window.location.origin}/join/link?code=${encodeURIComponent(referral.referral_code)}`;
    }
    return (
      referral?.referral_url ||
      `${window.location.origin}/join/${referral.referral_code}`
    );
  };

  const copyLink = () => {
    const url = invitationUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopyMsg("Link copied!");
    setTimeout(() => setCopyMsg(""), 2000);
  };

  const shareWhatsApp = () => {
    const url = invitationUrl();
    if (!url) return;
    const text = encodeURIComponent(
      `Know someone who can benefit from NetworkX and add value to the community? Join here: ${url}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const nativeShare = () => {
    const url = invitationUrl();
    if (!url) return;
    if ((navigator as any).share) {
      (navigator as any).share({
        title: "Join NetworkX",
        text: "Know someone who can benefit from NetworkX and add value to the community?",
        url,
      });
    } else {
      copyLink();
    }
  };

  const submitWithdraw = async () => {
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) {
      setWithdrawMsg("Enter a valid amount");
      return;
    }
    setWithdrawing(true);
    setWithdrawMsg("");
    try {
      const res = await WalletAPI.withdraw({ amount: amt });
      setWithdrawMsg(
        `✅ Requested — net payout ${formatMoney(res.net_payout)}, expected in ${res.processing_time}`,
      );
      await fetchAll();
      setWithdrawAmount("");
    } catch (e: any) {
      setWithdrawMsg("❌ " + e.message);
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading)
    return (
      <div className="page">
        <Loading label="Loading your NetworkX Status…" />
      </div>
    );
  if (error)
    return (
      <div className="page">
        <ApiError message={error} onRetry={fetchAll} />
      </div>
    );
  if (!contribution || !wallet) return null;

  const displayedInvitationUrl = invitationUrl();
  const qrUrl = displayedInvitationUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(displayedInvitationUrl)}`
    : null;
  const attributedRegistrations =
    invitationStats?.attributed_registrations ?? 0;
  const activeMembersJoined = invitationStats?.active_members_joined ?? 0;
  const awaitingMembership = invitationStats?.awaiting_membership ?? 0;

  return (
    <div className="page rewards-page">
      <div className="rewards-page-heading" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Badges & Rewards</h2>
        <p style={{ fontSize: 13, color: "var(--nx-muted)" }}>
          Your NetworkX Status, contribution, wallet, and recognition — all in
          one place
        </p>
      </div>

      <div className="rewards-top-grid">
        {/* ── A. Your NetworkX Status ──────────────────────────────────── */}
        <div
          className="card rewards-status-card"
          style={{ marginBottom: 16, borderLeft: "3px solid var(--nx-orange)" }}
        >
          <div
            style={{ fontSize: 12, color: "var(--nx-muted)", marginBottom: 4 }}
          >
            Your NetworkX Status
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "var(--nx-orange)",
              marginBottom: 12,
            }}
          >
            {contribution.status}
          </div>
          {contribution.next_status ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "var(--nx-muted)",
                  marginBottom: 4,
                }}
              >
                <span>
                  {contribution.progress_pct}% towards{" "}
                  {contribution.next_status}
                </span>
              </div>
              <div className="prog">
                <div
                  className="prog-fill"
                  style={{ width: `${contribution.progress_pct}%` }}
                />
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>
              <FontAwesomeIcon icon={faCrown} className="mr-1.5" />
              You've reached the top NetworkX Status
            </div>
          )}
        </div>

        {/* ── B. Your Journey ──────────────────────────────────────────── */}
        <div className="card rewards-journey-card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
            Your Journey
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {STATUS_ORDER.map((status, i) => {
              const currentIdx = STATUS_ORDER.indexOf(contribution.status);
              const state =
                i < currentIdx
                  ? "completed"
                  : i === currentIdx
                    ? "current"
                    : "locked";
              return (
                <div
                  key={status}
                  style={{
                    minWidth: 110,
                    flexShrink: 0,
                    textAlign: "center",
                    opacity: state === "locked" ? 0.4 : 1,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      margin: "0 auto 8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      background:
                        state === "current"
                          ? "rgba(255,75,10,.15)"
                          : "var(--nx-panel2)",
                      border: `2px solid ${state === "current" ? "var(--nx-orange)" : state === "completed" ? "#10b981" : "var(--nx-line)"}`,
                      color:
                        state === "current"
                          ? "var(--nx-orange)"
                          : state === "completed"
                            ? "#10b981"
                            : "var(--nx-muted)",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={STATUS_ICONS[status] || faSeedling}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: state === "current" ? 700 : 500,
                    }}
                  >
                    {status}
                  </div>
                  {state === "completed" && (
                    <div
                      style={{ fontSize: 10, color: "#10b981", marginTop: 2 }}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                      Done
                    </div>
                  )}
                  {state === "current" && (
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--nx-orange)",
                        marginTop: 2,
                      }}
                    >
                      Current
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── C. Your Contribution ─────────────────────────────────────── */}
      <div
        className="card rewards-contribution-card"
        style={{ marginBottom: 16 }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
          Your Contribution
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
            gap: 12,
          }}
        >
          {[
            {
              icon: faHandshake,
              label: "Members Joined Through You",
              value: contribution.successful_member_referrals,
            },
            {
              icon: faBriefcase,
              label: "Business Referrals Given",
              value: contribution.business_referrals,
            },
            {
              icon: faTag,
              label: "Opportunities Shared",
              value: contribution.opportunities_published,
            },
            {
              icon: faTag,
              label: "Deals Shared",
              value: contribution.deals_published,
            },
            {
              icon: faGraduationCap,
              label: "Courses Completed",
              value: contribution.courses_completed,
            },
            {
              icon: faIdCard,
              label: "Profile Completion",
              value: `${contribution.profile_completion_percentage}%`,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                textAlign: "center",
                padding: "12px 8px",
                background: "var(--nx-panel2)",
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  color: "var(--nx-muted)",
                  marginBottom: 6,
                }}
              >
                <FontAwesomeIcon icon={s.icon} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--nx-muted)",
                  marginTop: 4,
                  lineHeight: 1.3,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Membership invitations are separate from member-to-member business referrals. */}
      {invitationStats && (
        <div
          className="card referral-progress-card rewards-referral-card"
          style={{ marginBottom: 16 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              Community Invitations
            </div>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("community-invite")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
              style={{
                border: 0,
                background: "transparent",
                padding: 0,
                fontSize: 12,
                color: "var(--nx-blue)",
                cursor: "pointer",
              }}
            >
              Invite a Member
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 12,
            }}
          >
            {[
              ["Attributed Registrations", attributedRegistrations],
              ["Active Members Joined", activeMembersJoined],
              ["Awaiting Membership", awaitingMembership],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                style={{
                  padding: 14,
                  textAlign: "center",
                  borderRadius: 12,
                  background: "rgba(255,255,255,.72)",
                  border: "1px solid rgba(255,92,18,.16)",
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--nx-muted)",
                    marginTop: 4,
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
          {invitationStats.recent_members?.length > 0 && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid var(--nx-line)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--nx-muted)",
                  marginBottom: 8,
                }}
              >
                PEOPLE WHO REGISTERED THROUGH YOUR LINK
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {invitationStats.recent_members.map((member: any) => (
                  <div
                    key={member.member_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px",
                      borderRadius: 9,
                      background: "rgba(255,255,255,.72)",
                      border: "1px solid var(--nx-line)",
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        background: "linear-gradient(135deg,#147cff,#7058ff)",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      {member.name
                        ?.split(" ")
                        .map((word: string) => word[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>
                        {member.name}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color:
                            member.status === "successful"
                              ? "#10b981"
                              : "#f59e0b",
                        }}
                      >
                        {member.status === "successful"
                          ? "Active member"
                          : "Payment pending"}
                        {member.membership_plan
                          ? ` · ${member.membership_plan}`
                          : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rewards-bottom-grid">
        {/* ── D. NetworkX Wallet ───────────────────────────────────────── */}
        <div className="card rewards-wallet-card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
            <FontAwesomeIcon icon={faWallet} className="mr-1.5" />
            NetworkX Wallet
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#10b981" }}>
                {formatMoney(wallet.available_balance)}
              </div>
              <div
                style={{ fontSize: 11, color: "var(--nx-muted)", marginTop: 2 }}
              >
                Available
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b" }}>
                {formatMoney(wallet.pending_balance)}
              </div>
              <div
                style={{ fontSize: 11, color: "var(--nx-muted)", marginTop: 2 }}
              >
                Pending
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>
                {formatMoney(wallet.lifetime_wallet_benefits)}
              </div>
              <div
                style={{ fontSize: 11, color: "var(--nx-muted)", marginTop: 2 }}
              >
                Lifetime Benefits
              </div>
            </div>
          </div>
          <button
            className="btn btn-p btn-sm"
            onClick={() => {
              setShowWithdraw(true);
              setWithdrawMsg("");
            }}
            disabled={!wallet.available_balance}
          >
            Withdraw
          </button>

          {transactions.length > 0 && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 14,
                borderTop: "1px solid var(--nx-line)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--nx-muted)",
                  marginBottom: 8,
                }}
              >
                <FontAwesomeIcon icon={faClockRotateLeft} className="mr-1.5" />
                Recent Transactions
              </div>
              {transactions.slice(0, 3).map((t: any) => (
                <div
                  key={t.transaction_id || t.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--nx-line)",
                    fontSize: 12,
                  }}
                >
                  <span>
                    {t.transaction_type === "WITHDRAWAL"
                      ? "Wallet Withdrawal"
                      : t.transaction_type === "REVERSAL"
                        ? "Credit Reversed"
                        : "Wallet Benefit"}
                  </span>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <b style={{ color: t.amount < 0 ? "#ef4444" : "#10b981" }}>
                      {t.amount < 0 ? "−" : "+"}
                      {formatMoney(Math.abs(t.amount))}
                    </b>
                    <span
                      className={`badge ${t.status === "Available" || t.status === "Paid" ? "b-green" : t.status === "Reversed" ? "b-red" : "b-yellow"}`}
                      style={{ fontSize: 10 }}
                    >
                      {t.status}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── E. Your Recognition ──────────────────────────────────────── */}
        <div
          className="card rewards-recognition-card"
          style={{ marginBottom: 16 }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
            Your Recognition
          </div>
          {!recognition ||
          (recognition.city_top3.length === 0 &&
            recognition.global_top3.length === 0) ? (
            <div
              style={{
                textAlign: "center",
                padding: 24,
                color: "var(--nx-muted)",
                fontSize: 13,
              }}
            >
              This month's Top 3 rankings haven't been calculated yet — check
              back soon.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--nx-muted)",
                    marginBottom: 8,
                  }}
                >
                  Top 3 in Your City
                </div>
                {recognition.city_top3.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--nx-muted)" }}>
                    No ranked members in your city yet.
                  </div>
                ) : (
                  recognition.city_top3.map((m: any) => (
                    <div
                      key={m.member_id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 0",
                        background:
                          m.member_id === contribution.member_id
                            ? "rgba(255,75,10,.08)"
                            : undefined,
                        borderRadius: 8,
                        paddingLeft:
                          m.member_id === contribution.member_id ? 8 : 0,
                      }}
                    >
                      <span
                        style={{ fontWeight: 800, fontSize: 13, width: 16 }}
                      >
                        {m.city_rank}
                      </span>
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: "#6366f1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {m.user?.avatar_url ? (
                          <img
                            src={m.user.avatar_url}
                            alt={m.user?.name || "Member"}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          m.user?.name?.charAt(0) || "?"
                        )}
                      </div>
                      <span style={{ fontSize: 13 }}>
                        {m.user?.name || "NetworkX Member"}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--nx-muted)",
                    marginBottom: 8,
                  }}
                >
                  Top 3 Globally
                </div>
                {recognition.global_top3.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--nx-muted)" }}>
                    No global rankings yet.
                  </div>
                ) : (
                  recognition.global_top3.map((m: any) => (
                    <div
                      key={m.member_id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 0",
                        background:
                          m.member_id === contribution.member_id
                            ? "rgba(255,75,10,.08)"
                            : undefined,
                        borderRadius: 8,
                        paddingLeft:
                          m.member_id === contribution.member_id ? 8 : 0,
                      }}
                    >
                      <span
                        style={{ fontWeight: 800, fontSize: 13, width: 16 }}
                      >
                        {m.global_rank}
                      </span>
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: "#8b5cf6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {m.user?.avatar_url ? (
                          <img
                            src={m.user.avatar_url}
                            alt={m.user?.name || "Member"}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          m.user?.name?.charAt(0) || "?"
                        )}
                      </div>
                      <span style={{ fontSize: 13 }}>
                        {m.user?.name || "NetworkX Member"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── F. Invite Someone Valuable ───────────────────────────────── */}
        <div id="community-invite" className="card rewards-invite-card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
            Invite Someone Valuable
          </div>
          <p
            style={{ fontSize: 12, color: "var(--nx-muted)", marginBottom: 16 }}
          >
            Know someone who can benefit from NetworkX and add value to the
            community?
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: qrUrl ? "1fr auto" : "1fr",
              gap: 20,
              alignItems: "start",
            }}
          >
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  readOnly
                  value={displayedInvitationUrl}
                  style={{ flex: 1, fontSize: 12 }}
                />
                <button className="btn btn-g btn-sm" onClick={copyLink}>
                  <FontAwesomeIcon icon={faCopy} className="mr-1" />
                  Copy
                </button>
              </div>
              {copyMsg && (
                <div
                  style={{ fontSize: 11, color: "#10b981", marginBottom: 10 }}
                >
                  {copyMsg}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-p btn-sm" onClick={shareWhatsApp}>
                  <FontAwesomeIcon icon={faWhatsapp} className="mr-1.5" />
                  WhatsApp
                </button>
                <button className="btn btn-g btn-sm" onClick={nativeShare}>
                  Share
                </button>
              </div>
            </div>
            {qrUrl && (
              <div style={{ textAlign: "center" }}>
                <img
                  src={qrUrl}
                  alt="Referral QR code"
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 10,
                    border: "1px solid var(--nx-line)",
                  }}
                />
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--nx-muted)",
                    marginTop: 6,
                  }}
                >
                  <FontAwesomeIcon icon={faQrcode} className="mr-1" />
                  Scan to join
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Withdraw modal ───────────────────────────────────────────── */}
      {showWithdraw && (
        <div
          className="overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setShowWithdraw(false)
          }
        >
          <div className="modal">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              Withdraw from Wallet
            </h3>
            <div className="fg">
              <label>Amount</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Up to ${formatMoney(wallet.available_balance)}`}
              />
            </div>
            {withdrawMsg && (
              <div
                style={{
                  fontSize: 12,
                  marginBottom: 10,
                  color: withdrawMsg.startsWith("✅") ? "#10b981" : "#ef4444",
                }}
              >
                {withdrawMsg}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={submitWithdraw}
                disabled={withdrawing}
              >
                {withdrawing ? "Requesting…" : "Request Withdrawal"}
              </button>
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() => setShowWithdraw(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
