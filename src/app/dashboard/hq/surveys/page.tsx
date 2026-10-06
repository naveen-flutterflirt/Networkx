"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBullhorn,
  faChartBar,
  faPen,
  faSquareCheck,
  faStar,
  faCircleCheck,
  faHashtag,
  faClipboard,
  faPenToSquare,
  faArrowRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { SurveysAPI } from "@/lib/api";

type QuestionType =
  "text" | "multiple_choice" | "rating" | "yes_no" | "poll" | "number";

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options: string[]; // for multiple_choice and poll
}

const Q_TYPES: {
  value: QuestionType;
  label: string;
  icon: any;
  desc: string;
}[] = [
  {
    value: "text",
    label: "Text Answer",
    icon: faPen,
    desc: "Open-ended written response",
  },
  {
    value: "multiple_choice",
    label: "Multiple Choice",
    icon: faSquareCheck,
    desc: "Pick one or more options",
  },
  {
    value: "poll",
    label: "Poll",
    icon: faChartBar,
    desc: "Quick vote with options",
  },
  {
    value: "rating",
    label: "Rating Scale",
    icon: faStar,
    desc: "1–5 or 1–10 star rating",
  },
  {
    value: "yes_no",
    label: "Yes / No",
    icon: faCircleCheck,
    desc: "Simple binary choice",
  },
  { value: "number", label: "Number", icon: faHashtag, desc: "Numeric input" },
];

function newQuestion(): Question {
  return {
    id: Math.random().toString(36).slice(2),
    type: "text",
    text: "",
    required: true,
    options: ["Option 1", "Option 2"],
  };
}

export default function HQSurveysPage() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [responses, setResponses] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Survey form
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("All Members");
  const [dueDate, setDueDate] = useState("");
  const [questions, setQuestions] = useState<Question[]>([newQuestion()]);
  const [sendNow, setSendNow] = useState(false);

  const fetchSurveys = async (p = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await SurveysAPI.list({ page: p, page_size: 20 });
      setSurveys(res.items || res);
      setHasMore(res.has_more || false);
      setPage(p);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys(1);
  }, []);

  const openCreate = () => {
    setTitle("");
    setTarget("All Members");
    setDueDate("");
    setQuestions([newQuestion()]);
    setSendNow(false);
    setEditing(null);
    setShowCreate(true);
  };

  const openEdit = (s: any) => {
    setTitle(s.title || "");
    setTarget(s.target || "All Members");
    setDueDate(s.due_date ? s.due_date.split("T")[0] : "");
    // Parse stored questions or create one from old format
    try {
      const qs =
        typeof s.questions === "string"
          ? s.questions
            ? [
                {
                  id: "q1",
                  type: "text" as QuestionType,
                  text: s.questions,
                  required: true,
                  options: [],
                },
              ]
            : [newQuestion()]
          : Array.isArray(s.questions)
            ? s.questions
            : [newQuestion()];
      setQuestions(qs);
    } catch {
      setQuestions([newQuestion()]);
    }
    setEditing(s);
    setShowCreate(true);
  };

  const openResults = async (s: any) => {
    setSelected(s);
    setResponses(null);
    try {
      const r = await SurveysAPI.responses(s.id);
      setResponses(r);
    } catch {}
  };

  // Question helpers
  const addQuestion = () => setQuestions((qs) => [...qs, newQuestion()]);
  const removeQuestion = (id: string) =>
    setQuestions((qs) => qs.filter((q) => q.id !== id));
  const updateQuestion = (id: string, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const addOption = (id: string) =>
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === id
          ? { ...q, options: [...q.options, `Option ${q.options.length + 1}`] }
          : q,
      ),
    );
  const removeOption = (qid: string, idx: number) =>
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qid
          ? { ...q, options: q.options.filter((_, i) => i !== idx) }
          : q,
      ),
    );
  const updateOption = (qid: string, idx: number, val: string) =>
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qid
          ? { ...q, options: q.options.map((o, i) => (i === idx ? val : o)) }
          : q,
      ),
    );

  const saveSurvey = async () => {
    if (!title || questions.some((q) => !q.text)) return;
    setSaving(true);
    try {
      const payload = {
        title,
        target,
        due_date: dueDate || undefined,
        questions,
        status: sendNow ? "sent" : "draft",
        response_count: 0,
      };
      if (editing) {
        await SurveysAPI.update(editing.id, payload);
        setMsg("✅ Survey updated!");
      } else {
        await SurveysAPI.create(payload);
        setMsg(
          "✅ Survey " + (sendNow ? "created and sent!" : "saved as draft!"),
        );
      }
      setShowCreate(false);
      fetchSurveys(1);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const sendSurvey = async (id: string) => {
    try {
      await SurveysAPI.send(id, { target: "all" });
      setMsg("✅ Survey sent!");
      fetchSurveys(page);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    }
  };

  const deleteSurvey = async (id: string) => {
    if (!confirm("Delete this survey? This cannot be undone.")) return;
    try {
      await SurveysAPI.delete(id);
      setMsg("✅ Survey deleted");
      fetchSurveys(page);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    }
  };

  const active = surveys.filter(
    (s) => s.status === "sent" || s.status === "active",
  ).length;
  const completed = surveys.filter((s) => s.status === "completed").length;

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
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Surveys</h2>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            Create polls, surveys and feedback forms across all roles
          </p>
        </div>
        <button className="btn btn-p" onClick={openCreate}>
          + Create Survey
        </button>
      </div>

      {msg && (
        <div
          className="toast-in"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            borderRadius: 10,
            marginBottom: 12,
            fontSize: 13,
            background: msg.startsWith("✅")
              ? "rgba(39,216,109,.1)"
              : "rgba(255,90,90,.1)",
            color: msg.startsWith("✅") ? "#16a34a" : "#ef4444",
            border: `1px solid ${msg.startsWith("✅") ? "rgba(39,216,109,.35)" : "rgba(255,90,90,.35)"}`,
          }}
        >
          {msg}
          <button
            style={{
              flexShrink: 0,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
            }}
            onClick={() => setMsg("")}
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          { l: "Total", v: surveys.length, c: "#6366f1" },
          { l: "Active", v: active, c: "#10b981" },
          { l: "Completed", v: completed, c: "#9ca3af" },
        ].map((s) => (
          <div
            key={s.l}
            style={{
              background: `linear-gradient(135deg,${s.c},${s.c}cc)`,
              borderRadius: 12,
              padding: "14px 12px",
              boxShadow: `0 2px 4px rgba(0,0,0,.35), 0 14px 32px -10px ${s.c}66, inset 0 1px 0 rgba(255,255,255,.18)`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>
              {s.v}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,.75)",
                marginTop: 4,
              }}
            >
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div
          style={{
            background: "rgba(255,90,90,.1)",
            border: "1px solid rgba(255,90,90,.3)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 12,
            color: "#ef4444",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Survey list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="card"
              style={{ height: 100, background: "rgba(255,255,255,.06)" }}
            />
          ))
        ) : surveys.length === 0 ? (
          <div
            className="card"
            style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>
              <FontAwesomeIcon icon={faClipboard} />
            </div>
            <div style={{ marginBottom: 12 }}>No surveys yet</div>
            <button className="btn btn-p btn-sm" onClick={openCreate}>
              Create First Survey
            </button>
          </div>
        ) : (
          surveys.map((s) => {
            const pct =
              s.response_count && s.total_targets
                ? Math.round((s.response_count / s.total_targets) * 100)
                : 0;
            const qCount = Array.isArray(s.questions)
              ? s.questions.length
              : s.questions
                ? 1
                : 0;
            return (
              <div key={s.id} className="card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {s.title}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}
                    >
                      {qCount} question{qCount !== 1 ? "s" : ""} ·{" "}
                      {s.target || "All Members"}
                      {s.due_date
                        ? ` · Due ${new Date(s.due_date).toLocaleDateString()}`
                        : ""}
                    </div>
                  </div>
                  <span
                    className={`badge ${s.status === "completed" ? "b-gray" : s.status === "sent" || s.status === "active" ? "b-green" : "b-yellow"}`}
                    style={{ textTransform: "capitalize", flexShrink: 0 }}
                  >
                    {s.status || "draft"}
                  </span>
                </div>
                {s.response_count > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div className="prog">
                      <div className="prog-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div
                      style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}
                    >
                      {s.response_count} responses · {pct}% response rate
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    className="btn btn-g btn-sm"
                    onClick={() => openResults(s)}
                  >
                    <FontAwesomeIcon icon={faChartBar} className="mr-1.5" />
                    Results
                  </button>
                  <button
                    className="btn btn-g btn-sm"
                    style={{ color: "#6366f1" }}
                    onClick={() => openEdit(s)}
                  >
                    <FontAwesomeIcon icon={faPenToSquare} className="mr-1" />
                    Edit
                  </button>
                  {s.status === "draft" && (
                    <button
                      className="btn btn-p btn-sm"
                      onClick={() => sendSurvey(s.id)}
                    >
                      <FontAwesomeIcon icon={faBullhorn} className="mr-1.5" />
                      Send Now
                    </button>
                  )}
                  {s.status === "sent" && (
                    <button
                      className="btn btn-g btn-sm"
                      onClick={() => sendSurvey(s.id)}
                    >
                      <FontAwesomeIcon icon={faBullhorn} className="mr-1.5" />
                      Resend
                    </button>
                  )}
                  <button
                    className="btn btn-g btn-sm"
                    style={{ color: "#ef4444" }}
                    onClick={() => deleteSurvey(s.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          justifyContent: "center",
          marginTop: 12,
        }}
      >
        <button
          className="btn btn-g btn-sm"
          disabled={page === 1}
          onClick={() => fetchSurveys(page - 1)}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-1.5" />
          Prev
        </button>
        <span style={{ padding: "6px 12px", fontSize: 13, color: "#9ca3af" }}>
          Page {page}
        </span>
        <button
          className="btn btn-g btn-sm"
          disabled={!hasMore}
          onClick={() => fetchSurveys(page + 1)}
        >
          Next <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
        </button>
      </div>

      {/* ── RESULTS MODAL ────────────────────────────────────────────── */}
      {selected && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="modal modal-lg">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              {selected.title}
            </h3>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>
              {Array.isArray(selected.questions)
                ? selected.questions.length
                : 1}{" "}
              questions · {selected.target} · {responses?.response_count || 0}{" "}
              responses
            </div>
            {/* Show per-question results */}
            {Array.isArray(selected.questions) &&
              selected.questions.map((q: Question, qi: number) => (
                <div
                  key={q.id}
                  style={{
                    background: "rgba(255,255,255,.04)",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}
                  >
                    Q{qi + 1}. {q.text}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    {q.type === "rating" ? "Average rating: — · " : ""}
                    {responses?.response_count || 0} responses
                  </div>
                  {(q.type === "multiple_choice" || q.type === "poll") &&
                    q.options.map((opt, oi) => (
                      <div key={oi} style={{ marginTop: 6 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            marginBottom: 2,
                          }}
                        >
                          <span>{opt}</span>
                          <span style={{ color: "#9ca3af" }}>0%</span>
                        </div>
                        <div
                          style={{
                            height: 6,
                            background: "var(--nx-line)",
                            borderRadius: 99,
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              background: "#6366f1",
                              borderRadius: 99,
                              width: "0%",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            {!selected.questions && (
              <div
                style={{ textAlign: "center", color: "#9ca3af", padding: 24 }}
              >
                No responses yet
              </div>
            )}
            <button
              className="btn btn-g"
              style={{ width: "100%", marginTop: 4 }}
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ──────────────────────────────────────── */}
      {showCreate && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div
            className="modal modal-lg"
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              {editing ? `Edit Survey — ${editing.title}` : "+ Create Survey"}
            </h3>

            {/* Basic info */}
            <div className="form-grid">
              <div className="fg" style={{ gridColumn: "1/-1" }}>
                <label>Survey Title *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q2 Member Satisfaction Survey"
                />
              </div>
              <div className="fg">
                <label>Target Audience</label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  {[
                    "All Members",
                    "All Franchise Owners",
                    "HQ Admins",
                    "Everyone",
                  ].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Questions */}
            <div style={{ marginTop: 16, marginBottom: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  Questions ({questions.length})
                </div>
                <button className="btn btn-g btn-sm" onClick={addQuestion}>
                  + Add Question
                </button>
              </div>

              {questions.map((q, qi) => (
                <div
                  key={q.id}
                  style={{
                    background: "rgba(255,255,255,.04)",
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    border: "1px solid var(--nx-line)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#9ca3af",
                      }}
                    >
                      Q{qi + 1}
                    </span>
                    <div
                      style={{ display: "flex", gap: 6, alignItems: "center" }}
                    >
                      <label
                        style={{
                          fontSize: 12,
                          color: "#9ca3af",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) =>
                            updateQuestion(q.id, { required: e.target.checked })
                          }
                        />
                        Required
                      </label>
                      {questions.length > 1 && (
                        <button
                          onClick={() => removeQuestion(q.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ef4444",
                            fontSize: 16,
                            lineHeight: 1,
                          }}
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question type selector */}
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      marginBottom: 10,
                    }}
                  >
                    {Q_TYPES.map((qt) => (
                      <button
                        key={qt.value}
                        onClick={() => updateQuestion(q.id, { type: qt.value })}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 99,
                          border: "1px solid",
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 600,
                          background: q.type === qt.value ? "#6366f1" : "#fff",
                          color: q.type === qt.value ? "#fff" : "#6b7280",
                          borderColor:
                            q.type === qt.value ? "#6366f1" : "var(--nx-line)",
                        }}
                      >
                        <FontAwesomeIcon icon={qt.icon} className="mr-1" />
                        {qt.label}
                      </button>
                    ))}
                  </div>

                  {/* Question text */}
                  <input
                    value={q.text}
                    onChange={(e) =>
                      updateQuestion(q.id, { text: e.target.value })
                    }
                    placeholder={`Enter your ${Q_TYPES.find((t) => t.value === q.type)?.label || "question"} here…`}
                    style={{
                      marginBottom:
                        q.type === "multiple_choice" || q.type === "poll"
                          ? 8
                          : 0,
                    }}
                  />

                  {/* Options for MCQ/Poll */}
                  {(q.type === "multiple_choice" || q.type === "poll") && (
                    <div style={{ marginTop: 8 }}>
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            marginBottom: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              color: "#9ca3af",
                              width: 20,
                              flexShrink: 0,
                            }}
                          >
                            {oi + 1}.
                          </span>
                          <input
                            value={opt}
                            onChange={(e) =>
                              updateOption(q.id, oi, e.target.value)
                            }
                            style={{ flex: 1 }}
                          />
                          {q.options.length > 2 && (
                            <button
                              onClick={() => removeOption(q.id, oi)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#9ca3af",
                                fontSize: 14,
                              }}
                            >
                              <FontAwesomeIcon icon={faXmark} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        className="btn btn-g btn-sm"
                        onClick={() => addOption(q.id)}
                      >
                        + Add Option
                      </button>
                    </div>
                  )}

                  {/* Rating scale */}
                  {q.type === "rating" && (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 8,
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>
                        Scale:
                      </span>
                      {[5, 10].map((n) => (
                        <button
                          key={n}
                          onClick={() =>
                            updateQuestion(q.id, { options: [String(n)] })
                          }
                          style={{
                            padding: "2px 10px",
                            borderRadius: 99,
                            border: "1px solid",
                            cursor: "pointer",
                            fontSize: 12,
                            background:
                              q.options[0] === String(n) ||
                              (!q.options[0] && n === 5)
                                ? "#6366f1"
                                : "#fff",
                            color:
                              q.options[0] === String(n) ||
                              (!q.options[0] && n === 5)
                                ? "#fff"
                                : "#6b7280",
                            borderColor:
                              q.options[0] === String(n) ||
                              (!q.options[0] && n === 5)
                                ? "#6366f1"
                                : "var(--nx-line)",
                          }}
                        >
                          1–{n} <FontAwesomeIcon icon={faStar} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Send options */}
            <div
              style={{
                background: "rgba(0,191,248,.08)",
                borderRadius: 10,
                padding: 12,
                marginBottom: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  Send immediately after {editing ? "saving" : "creating"}?
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  Or save as draft and send later
                </div>
              </div>
              <button
                onClick={() => setSendNow(!sendNow)}
                style={{
                  width: 48,
                  height: 26,
                  borderRadius: 99,
                  border: "none",
                  cursor: "pointer",
                  background: sendNow ? "#10b981" : "var(--nx-line)",
                  position: "relative",
                  transition: "background .2s",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "var(--nx-panel)",
                    position: "absolute",
                    top: 3,
                    transition: "left .2s",
                    left: sendNow ? "24px" : "4px",
                    boxShadow: "0 1px 4px rgba(0,0,0,.2)",
                  }}
                />
              </button>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={saveSurvey}
                disabled={saving || !title || questions.some((q) => !q.text)}
              >
                {saving
                  ? "Saving…"
                  : editing
                    ? sendNow
                      ? "Save & Send"
                      : "Save Changes"
                    : sendNow
                      ? "Create & Send"
                      : "Save as Draft"}
              </button>
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() => setShowCreate(false)}
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
