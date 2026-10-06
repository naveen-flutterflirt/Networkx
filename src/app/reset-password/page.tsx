"use client";

import { useEffect, useState } from "react";
import { AuthAPI } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faTriangleExclamation,
  faLock,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState<
    "form" | "submitting" | "success" | "error" | "missing-token"
  >("form");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    if (!t) {
      setStatus("missing-token");
      return;
    }
    setToken(t);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (pw !== confirmPw) {
      setMessage("Passwords don't match.");
      return;
    }
    setStatus("submitting");
    setMessage("");
    try {
      const res: any = await AuthAPI.resetPassword(token, pw);
      setStatus("success");
      setMessage(res.message || "Password reset successfully.");
    } catch (e: any) {
      setStatus("error");
      setMessage(e.message || "This reset link is invalid or has expired.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--panel)",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: "100%",
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 16,
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "var(--ink)",
            marginBottom: 24,
          }}
        >
          NetworkX
        </div>

        {status === "missing-token" && (
          <>
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              style={{ fontSize: 36, color: "#f43f5e", marginBottom: 16 }}
            />
            <div
              style={{
                color: "var(--ink)",
                fontSize: 17,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Invalid Link
            </div>
            <div
              style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}
            >
              This reset link is missing its token — please use the link from
              your email.
            </div>
            <a
              href="/login"
              style={{
                display: "inline-block",
                background: "var(--blue)",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
                padding: "12px 28px",
                borderRadius: 8,
              }}
            >
              Go to Login
            </a>
          </>
        )}

        {(status === "form" || status === "submitting") && (
          <>
            <FontAwesomeIcon
              icon={faLock}
              style={{ fontSize: 30, color: "var(--blue)", marginBottom: 12 }}
            />
            <div
              style={{
                color: "var(--ink)",
                fontSize: 17,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Reset Your Password
            </div>
            <div
              style={{
                color: "var(--muted)",
                fontSize: 13.5,
                marginBottom: 24,
              }}
            >
              Choose a new password for your NetworkX account.
            </div>

            <form onSubmit={submit} style={{ textAlign: "left" }}>
              <label
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "var(--muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                New Password
              </label>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="At least 8 characters"
                  style={{
                    width: "100%",
                    padding: "11px 40px 11px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                    background: "var(--panel-2, transparent)",
                    color: "var(--ink)",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    cursor: "pointer",
                  }}
                >
                  <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} />
                </button>
              </div>

              <label
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "var(--muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Confirm New Password
              </label>
              <input
                type={showPw ? "text" : "password"}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Re-enter your new password"
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  background: "var(--panel-2, transparent)",
                  color: "var(--ink)",
                  fontSize: 14,
                  boxSizing: "border-box",
                  marginBottom: 14,
                }}
                required
              />

              {message && (
                <div
                  style={{ color: "#f43f5e", fontSize: 13, marginBottom: 14 }}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                style={{
                  width: "100%",
                  background: "var(--blue)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  padding: "12px 28px",
                  borderRadius: 8,
                  cursor: status === "submitting" ? "default" : "pointer",
                  opacity: status === "submitting" ? 0.7 : 1,
                }}
              >
                {status === "submitting" ? "Resetting…" : "Reset Password"}
              </button>
            </form>
          </>
        )}

        {status === "success" && (
          <>
            <FontAwesomeIcon
              icon={faCircleCheck}
              style={{ fontSize: 36, color: "#27d86d", marginBottom: 16 }}
            />
            <div
              style={{
                color: "var(--ink)",
                fontSize: 17,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Password Reset
            </div>
            <div
              style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}
            >
              {message}
            </div>
            <a
              href="/login"
              style={{
                display: "inline-block",
                background: "var(--blue)",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
                padding: "12px 28px",
                borderRadius: 8,
              }}
            >
              Continue to Login
            </a>
          </>
        )}

        {status === "error" && (
          <>
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              style={{ fontSize: 36, color: "#f43f5e", marginBottom: 16 }}
            />
            <div
              style={{
                color: "var(--ink)",
                fontSize: 17,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Reset Failed
            </div>
            <div
              style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}
            >
              {message}
            </div>
            <a
              href="/login"
              style={{
                display: "inline-block",
                background: "var(--blue)",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
                padding: "12px 28px",
                borderRadius: 8,
              }}
            >
              Back to Login
            </a>
          </>
        )}
      </div>
    </div>
  );
}
