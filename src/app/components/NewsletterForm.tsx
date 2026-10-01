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
      <form className="newsletter-form flex" onSubmit={subscribe}>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-label="Email address" placeholder="Enter your email" required />
        <button type="submit" aria-label="Subscribe" disabled={state === "loading"}>
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
      <p className={`newsletter-status ${state}`} role="status" aria-live="polite">{message}</p>
    </>
  );
}
