"use client";

import { useEffect, useState } from "react";
import { AuthAPI } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faTriangleExclamation,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setMessage(
        "This verification link is missing its token — please use the link from your email.",
      );
      return;
    }
    AuthAPI.verifyEmail(token)
      .then((res: any) => {
        setStatus("success");
        setMessage(res.message || "Email verified successfully.");
      })
      .catch((e: any) => {
        setStatus("error");
        setMessage(
          e.message || "This verification link is invalid or has expired.",
        );
      });
  }, []);

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

        {status === "verifying" && (
          <>
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              style={{ fontSize: 36, color: "var(--blue)", marginBottom: 16 }}
            />
            <div style={{ color: "var(--muted)", fontSize: 15 }}>
              Verifying your email…
            </div>
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
              Email Verified
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
              Verification Failed
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
              Go to Login
            </a>
          </>
        )}
      </div>
    </div>
  );
}
