"use client";
import { useState, useEffect } from "react";
import { AuthAPI, TokenStore } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelopeOpenText,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

// Same lock pattern as /dashboard/membership for unpaid accounts — this
// is the equivalent holding page for an unverified email, and the
// dashboard/layout.tsx guard + Sidebar's locked-nav-items both route
// here for the same reason. A brand-new registration (register_member())
// issues a real token immediately regardless of email_verified, and
// until this page existed nothing ever actually blocked dashboard access
// on it — only a later login attempt did.
export default function VerifyEmailPendingPage() {
  const me = getUser();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // The link in the email may be opened on a different device (or tab)
  // than the one sitting on this page. Ask the server on load and every
  // time this tab regains focus, and move on as soon as it's verified —
  // instead of waiting on a cached copy that can't know.
  useEffect(() => {
    const check = async () => {
      const fresh = await TokenStore.refreshUser();
      if (fresh && fresh.email_verified !== false) {
        window.location.href =
          fresh.membership_status && fresh.membership_status !== "active"
            ? "/dashboard/membership"
            : "/dashboard";
      }
    };
    check();
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const resend = async () => {
    setSending(true);
    setError("");
    setSent(false);
    try {
      await AuthAPI.sendVerificationEmail();
      setSent(true);
    } catch (e: any) {
      setError(e.message || "Could not resend — please try again in a moment.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page">
      <div
        className="card"
        style={{
          maxWidth: 520,
          margin: "40px auto",
          textAlign: "center",
          padding: 32,
        }}
      >
        <div
          style={{ fontSize: 40, color: "var(--nx-orange)", marginBottom: 16 }}
        >
          <FontAwesomeIcon icon={faEnvelopeOpenText} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
          Verify your email to continue
        </h2>
        <p style={{ fontSize: 13, color: "var(--nx-muted)", marginBottom: 4 }}>
          We sent a verification link to{" "}
          <strong>{me?.email || "your email address"}</strong>.
        </p>
        <p style={{ fontSize: 13, color: "var(--nx-muted)", marginBottom: 20 }}>
          <strong>Don't see it? Check your spam or junk folder too</strong> —
          verification emails sometimes land there. The rest of NetworkX stays
          locked until this is done.
        </p>

        {sent && (
          <div
            style={{
              fontSize: 12.5,
              color: "#16a34a",
              background: "rgba(39,216,109,.1)",
              border: "1px solid rgba(39,216,109,.35)",
              borderRadius: 10,
              padding: "8px 12px",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
              justifyContent: "center",
            }}
          >
            <FontAwesomeIcon icon={faCircleCheck} /> Verification email sent —
            check your inbox (and spam).
          </div>
        )}
        {error && (
          <div
            style={{
              fontSize: 12.5,
              color: "#ef4444",
              background: "rgba(255,90,90,.1)",
              border: "1px solid rgba(255,90,90,.35)",
              borderRadius: 10,
              padding: "8px 12px",
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <button
          className="btn btn-p"
          onClick={resend}
          disabled={sending}
          style={{ width: "100%" }}
        >
          {sending ? "Sending…" : "Resend verification email"}
        </button>
      </div>
    </div>
  );
}
