"use client";

import { FormEvent, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

type SubmissionState = "idle" | "loading" | "success" | "error";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}/api/v1/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error("Subscription failed");

      setEmail("");
      setState("success");
      setMessage("You’re on the NetworkX list.");
    } catch {
      setState("error");
      setMessage("Please try again when the API is available.");
    }
  }

  return (
    <>
      <form onSubmit={subscribe} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-label="Email address" placeholder="Enter your email" required 
          style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', padding: '12px 16px', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
        />
        <button type="submit" aria-label="Subscribe" disabled={state === "loading"}
          style={{ width: '48px', height: '48px', flexShrink: 0, background: '#f3ce95', border: 'none', borderRadius: '8px', color: '#131b23', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
      <p style={{ fontSize: '13px', marginTop: '8px', color: state === 'error' ? '#ff6b6b' : '#a5afba' }} role="status" aria-live="polite">{message}</p>
    </>
  );
}
