"use client";
import { useState, useEffect } from "react";
import { ExpansionSignalsAPI, TokenStore } from "@/lib/api";
import { Loading, ApiError, Empty } from "@/components/shared/States";
import UserSearchPicker from "@/components/ui/UserSearchPicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

export default function FranchiseExpansionPage() {
  const me = TokenStore.getUser();
  const [gaps, setGaps] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRequest, setShowRequest] = useState(false);
  const [reqArea, setReqArea] = useState("");
  const [reqCapacity, setReqCapacity] = useState("45");
  const [reqNotes, setReqNotes] = useState("");
  const [hqContactId, setHqContactId] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ExpansionSignalsAPI.categoryGaps(me?.group_id);
      setGaps(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const requestText = `New Group Request\n\nArea: ${reqArea}\nTarget Capacity: ${reqCapacity}\nNotes: ${reqNotes}`;

  const copyAndGo = () => {
    // No real "propose a group" approval workflow exists yet — group
    // creation is HQ-only. messages/page.tsx only reads `to`/`name` from
    // the URL, not a pre-filled message body (checked directly before
    // relying on it) — so this copies the real request text and opens a
    // real chat with the chosen HQ contact, rather than pretending an
    // alert() sent something the way the old page did.
    navigator.clipboard.writeText(requestText);
    setCopied(true);
    setTimeout(() => {
      window.location.href = `/dashboard/messages?to=${hqContactId}`;
    }, 900);
  };

  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Expansion Signals</h2>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            Real category gaps computed from actual member data — not a
            simulation.
          </p>
        </div>
        <button className="btn btn-p" onClick={() => setShowRequest(true)}>
          + Request New Group
        </button>
      </div>

      {loading ? (
        <Loading label="Analyzing member categories…" />
      ) : error ? (
        <ApiError message={error} onRetry={fetchAll} />
      ) : (
        gaps && (
          <>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>
              Analyzed {gaps.total_members_analyzed} member
              {gaps.total_members_analyzed !== 1 ? "s" : ""} across{" "}
              {gaps.categories_tracked} tracked categories,{" "}
              {gaps.scope === "group" ? "in your group" : "network-wide"}.
            </div>

            {gaps.gaps.length === 0 ? (
              <Empty label="No significant category gaps found — good category coverage" />
            ) : (
              <div className="card">
                <div
                  style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}
                >
                  Category Gaps
                </div>
                {gaps.gaps.map((g: any, i: number) => (
                  <div
                    key={g.category}
                    style={{
                      padding: "10px 0",
                      borderBottom:
                        i < gaps.gaps.length - 1
                          ? "1px solid var(--nx-line)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {g.category}
                      </div>
                      <span
                        className={`badge ${g.gap_severity === "none" ? "b-red" : "b-yellow"}`}
                        style={{ fontSize: 10 }}
                      >
                        {g.gap_severity === "none"
                          ? "No coverage"
                          : "Under-represented"}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      {g.note}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )
      )}

      {showRequest && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setShowRequest(false)}
        >
          <div className="modal">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Request New Group
            </h3>
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>
              Group creation is HQ-only. This copies your request and opens a
              real chat with the HQ contact you pick — nothing here pretends to
              submit it automatically.
            </p>
            <div className="fg">
              <label>Area / Location</label>
              <input
                value={reqArea}
                onChange={(e) => setReqArea(e.target.value)}
                placeholder="e.g. South Delhi — Saket"
              />
            </div>
            <div className="fg">
              <label>Target Capacity</label>
              <input
                type="number"
                value={reqCapacity}
                onChange={(e) => setReqCapacity(e.target.value)}
              />
            </div>
            <div className="fg">
              <label>Notes</label>
              <textarea
                rows={3}
                value={reqNotes}
                onChange={(e) => setReqNotes(e.target.value)}
                placeholder="Why this area — category gaps, member requests you've heard about, etc."
              />
            </div>
            <UserSearchPicker
              label="Send To (HQ)"
              roleFilter="hq_admin"
              placeholder="Search HQ Admin by name…"
              value={hqContactId}
              onChange={(id) => setHqContactId(id)}
            />
            {copied && (
              <div style={{ fontSize: 12, color: "#16a34a", marginTop: 8 }}>
                <FontAwesomeIcon icon={faCircleCheck} className="mr-1" />
                Copied — opening chat…
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={copyAndGo}
                disabled={!reqArea.trim() || !hqContactId}
              >
                Copy & Message HQ
              </button>
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() => setShowRequest(false)}
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
