"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faUsers,
  faFileLines,
  faPlay,
  faClapperboard,
  faBook,
  faCircleQuestion,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { LearningAPI, TokenStore } from "@/lib/api";
import UserSearchPicker from "@/components/ui/UserSearchPicker";
import { Loading, ApiError } from "@/components/shared/States";

const LESSON_TYPES = [
  { value: "text", label: "Article / Text", icon: faFileLines },
  { value: "youtube", label: "YouTube Video", icon: faPlay },
  { value: "video", label: "Private Video", icon: faClapperboard },
  { value: "pdf", label: "PDF Document", icon: faBook },
  { value: "quiz", label: "Quiz", icon: faCircleQuestion },
];

const emptyLesson = {
  title: "",
  type: "text",
  content: "",
  pdf_url: "",
  duration_min: 5,
  is_preview: false,
  quiz_questions: [] as any[],
  storage_path: "",
};

// Lightweight, dependency-free markdown editor for lesson text content.
// No new npm package added — this codebase has zero rich-text library
// installed anywhere, and adding one here without being able to run
// `npm install` against the actual project risks handing over code that
// references a package that was never actually installed. This instead
// wraps a plain textarea with a formatting toolbar that inserts
// standard markdown syntax at the cursor — genuinely better than raw
// unstyled text, with the matching renderMarkdown() in page.tsx turning
// it into real headings/bold/italic/lists/links for members reading it.
function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const textareaId = "lesson-content-editor";
  const wrap = (before: string, after: string = before) => {
    const el = document.getElementById(
      textareaId,
    ) as HTMLTextAreaElement | null;
    if (!el) return;
    const start = el.selectionStart,
      end = el.selectionEnd;
    const selected = value.slice(start, end);
    const next =
      value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    });
  };
  const linePrefix = (prefix: string) => {
    const el = document.getElementById(
      textareaId,
    ) as HTMLTextAreaElement | null;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  };
  const TOOLS = [
    {
      label: "B",
      title: "Bold",
      style: { fontWeight: 800 },
      action: () => wrap("**"),
    },
    {
      label: "I",
      title: "Italic",
      style: { fontStyle: "italic" },
      action: () => wrap("*"),
    },
    { label: "H", title: "Heading", action: () => linePrefix("## ") },
    { label: "•", title: "Bullet list", action: () => linePrefix("- ") },
    { label: "🔗", title: "Link", action: () => wrap("[", "](https://)") },
  ];
  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {TOOLS.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.title}
            className="btn btn-g btn-xs"
            style={{ minWidth: 28, ...(t.style || {}) }}
            onClick={t.action}
          >
            {t.label}
          </button>
        ))}
      </div>
      <textarea
        id={textareaId}
        rows={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your lesson content — use the toolbar above for formatting, or type markdown directly (**bold**, *italic*, ## heading, - bullet)"
      />
      <div style={{ fontSize: 10, color: "var(--nx-muted)", marginTop: 4 }}>
        Supports markdown: **bold**, *italic*, ## heading, - bullet lists,
        [links](url)
      </div>
    </div>
  );
}

function QuizBuilder({
  questions,
  onChange,
}: {
  questions: any[];
  onChange: (qs: any[]) => void;
}) {
  const addQ = () =>
    onChange([
      ...questions,
      { question: "", options: ["", "", "", ""], correct_index: 0 },
    ]);
  const updQ = (i: number, patch: any) =>
    onChange(questions.map((q, qi) => (qi === i ? { ...q, ...patch } : q)));
  const delQ = (i: number) => onChange(questions.filter((_, qi) => qi !== i));
  const updOpt = (qi: number, oi: number, val: string) =>
    updQ(qi, {
      options: questions[qi].options.map((o: string, j: number) =>
        j === oi ? val : o,
      ),
    });
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <label>Quiz Questions ({questions.length})</label>
        <button className="btn btn-g btn-sm" onClick={addQ}>
          + Add Question
        </button>
      </div>
      {questions.map((q, qi) => (
        <div
          key={qi}
          style={{
            background: "rgba(255,255,255,.04)",
            borderRadius: 10,
            padding: 12,
            marginBottom: 10,
            border: "1px solid var(--nx-line)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af" }}>
              Q{qi + 1}
            </span>
            <button
              onClick={() => delQ(qi)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#ef4444",
                fontSize: 14,
              }}
            >
              ✕
            </button>
          </div>
          <input
            value={q.question}
            onChange={(e) => updQ(qi, { question: e.target.value })}
            placeholder="Question text"
            style={{ marginBottom: 8 }}
          />
          {q.options.map((opt: string, oi: number) => (
            <div
              key={oi}
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <input
                type="radio"
                name={`q${qi}`}
                checked={q.correct_index === oi}
                onChange={() => updQ(qi, { correct_index: oi })}
                style={{ accentColor: "#10b981" }}
              />
              <input
                value={opt}
                onChange={(e) => updOpt(qi, oi, e.target.value)}
                placeholder={`Option ${oi + 1}`}
                style={{ flex: 1, fontSize: 12 }}
              />
              <span
                style={{
                  fontSize: 10,
                  color: q.correct_index === oi ? "#10b981" : "#9ca3af",
                  width: 40,
                  flexShrink: 0,
                }}
              >
                {q.correct_index === oi ? "✅ Ans" : ""}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function CourseCurriculumPage() {
  const [courseId, setCourseId] = useState<string>("");
  const me = TokenStore.getUser();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCourseId(params.get("courseId") || "");
  }, []);

  const [course, setCourse] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const [selectedItem, setSelectedItem] = useState<{
    type: "lesson" | "new-lesson" | "settings";
    sectionId?: string;
    lesson?: any;
  } | null>({ type: "settings" });
  const [lessonForm, setLessonForm] = useState<any>(emptyLesson);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showManagers, setShowManagers] = useState(false);
  const [newManagerId, setNewManagerId] = useState("");
  const [managerMsg, setManagerMsg] = useState("");

  const isOwner =
    course && (course.created_by === me?.id || me?.role === "super_admin");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [c, secRes] = await Promise.all([
        LearningAPI.getCourse(courseId),
        LearningAPI.sections(courseId),
      ]);
      setCourse(c);
      const secs = secRes.sections || [];
      setSections(secs);
      setExpandedSections(new Set(secs.map((s: any) => s.id)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchAll();
  }, [courseId]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addSection = async () => {
    if (!newSectionTitle.trim()) return;
    try {
      await LearningAPI.createSection(courseId, {
        title: newSectionTitle.trim(),
      });
      setNewSectionTitle("");
      const res = await LearningAPI.sections(courseId);
      setSections(res.sections || []);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!confirm("Delete this section and all its lessons?")) return;
    try {
      await LearningAPI.deleteSection(courseId, sectionId);
      const res = await LearningAPI.sections(courseId);
      setSections(res.sections || []);
      if (selectedItem?.sectionId === sectionId)
        setSelectedItem({ type: "settings" });
    } catch (e: any) {
      setMsg("❌ " + e.message);
    }
  };

  const selectLesson = (sectionId: string, lesson: any) => {
    setSelectedItem({ type: "lesson", sectionId, lesson });
    setLessonForm({
      title: lesson.title || "",
      type: lesson.type || "text",
      content: lesson.content || "",
      pdf_url: lesson.pdf_url || "",
      duration_min: lesson.duration_min || 5,
      is_preview: lesson.is_preview || false,
      quiz_questions: lesson.quiz_questions || [],
      storage_path: lesson.storage_path || "",
    });
  };

  const selectNewLesson = (sectionId: string) => {
    setSelectedItem({ type: "new-lesson", sectionId });
    setLessonForm(emptyLesson);
  };

  const saveLesson = async () => {
    if (!selectedItem || !lessonForm.title.trim()) {
      setMsg("❌ Lesson title is required");
      return;
    }
    setSaving(true);
    try {
      if (selectedItem.type === "lesson") {
        await LearningAPI.updateLesson(selectedItem.lesson.id, lessonForm);
      } else {
        if (selectedItem.sectionId) {
          await LearningAPI.createLesson(
            courseId,
            selectedItem.sectionId,
            lessonForm,
          );
        } else {
          setMsg("❌ Section ID is required to create a lesson");
        }
      }
      const res = await LearningAPI.sections(courseId);
      setSections(res.sections || []);
      setMsg("✅ Lesson saved!");
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm("Delete this lesson?")) return;
    try {
      await LearningAPI.deleteLesson(lessonId);
      const res = await LearningAPI.sections(courseId);
      setSections(res.sections || []);
      setSelectedItem({ type: "settings" });
    } catch (e: any) {
      setMsg("❌ " + e.message);
    }
  };

  const uploadVideo = async (file: File) => {
    setUploading(true);
    try {
      const { upload_url, storage_path } = await LearningAPI.getUploadUrl({
        filename: file.name,
        content_type: file.type,
        course_id: courseId,
      });
      await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      setLessonForm((f: any) => ({ ...f, storage_path, type: "video" }));
      setMsg("✅ Video uploaded!");
    } catch (e: any) {
      setMsg("❌ Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const addManager = async () => {
    if (!newManagerId) return;
    try {
      const res = await LearningAPI.addManager(courseId, newManagerId);
      setCourse((c: any) => ({ ...c, co_managers: res.co_managers }));
      setNewManagerId("");
      setManagerMsg("✅ Access granted");
    } catch (e: any) {
      setManagerMsg("❌ " + e.message);
    }
  };

  const removeManager = async (managerId: string) => {
    try {
      const res = await LearningAPI.removeManager(courseId, managerId);
      setCourse((c: any) => ({ ...c, co_managers: res.co_managers }));
    } catch (e: any) {
      setManagerMsg("❌ " + e.message);
    }
  };

  if (loading)
    return (
      <div className="page">
        <Loading label="Loading course…" />
      </div>
    );
  if (error)
    return (
      <div className="page">
        <ApiError message={error} onRetry={fetchAll} />
      </div>
    );
  if (!course) return null;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 56px)" }}>
      <div
        style={{
          width: 300,
          flexShrink: 0,
          borderRight: "1px solid var(--nx-line)",
          display: "flex",
          flexDirection: "column",
          background: "var(--nx-panel)",
        }}
      >
        <div style={{ padding: 16, borderBottom: "1px solid var(--nx-line)" }}>
          <button
            className="btn btn-g btn-xs"
            style={{ marginBottom: 10 }}
            onClick={() => (window.location.href = "/dashboard/learning")}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-1.5" />
            All Courses
          </button>
          <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>
            {course.title}
          </div>
          {isOwner && (
            <button
              className="btn btn-g btn-xs"
              style={{ marginTop: 8, width: "100%" }}
              onClick={() => {
                setManagerMsg("");
                setShowManagers(true);
              }}
            >
              <FontAwesomeIcon icon={faUsers} className="mr-1.5" />
              Manage Access
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          <button
            className="btn btn-sm"
            style={{
              width: "100%",
              marginBottom: 10,
              justifyContent: "flex-start",
              background:
                selectedItem?.type === "settings"
                  ? "rgba(255,75,10,.12)"
                  : "transparent",
              color:
                selectedItem?.type === "settings"
                  ? "var(--nx-orange)"
                  : "var(--nx-ink)",
              textAlign: "left",
            }}
            onClick={() => setSelectedItem({ type: "settings" })}
          >
            ⚙️ Course Settings
          </button>
          {sections.map((sec: any) => (
            <div key={sec.id} style={{ marginBottom: 6 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
                onClick={() => toggleSection(sec.id)}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--nx-muted)",
                    transform: expandedSections.has(sec.id)
                      ? "rotate(90deg)"
                      : "none",
                    transition: "transform .15s",
                  }}
                >
                  ▶
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>
                  {sec.title}
                </span>
                <span style={{ fontSize: 11, color: "var(--nx-muted)" }}>
                  {(sec.lessons || []).length}
                </span>
                {isOwner && (
                  <button
                    className="btn btn-xs btn-g"
                    style={{ color: "#ef4444" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSection(sec.id);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
              {expandedSections.has(sec.id) && (
                <div style={{ paddingLeft: 20 }}>
                  {(sec.lessons || []).map((l: any) => (
                    <div
                      key={l.id}
                      onClick={() => selectLesson(sec.id, l)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 8px",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 12,
                        background:
                          selectedItem?.type === "lesson" &&
                          selectedItem.lesson?.id === l.id
                            ? "rgba(255,75,10,.12)"
                            : "transparent",
                        color:
                          selectedItem?.type === "lesson" &&
                          selectedItem.lesson?.id === l.id
                            ? "var(--nx-orange)"
                            : "var(--nx-ink)",
                      }}
                    >
                      <span>
                        <FontAwesomeIcon
                          icon={
                            LESSON_TYPES.find((t) => t.value === l.type)
                              ?.icon || faFileLines
                          }
                        />
                      </span>
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {l.title}
                      </span>
                    </div>
                  ))}
                  {isOwner && (
                    <button
                      className="btn btn-xs btn-g"
                      style={{ width: "100%", marginTop: 4 }}
                      onClick={() => selectNewLesson(sec.id)}
                    >
                      + Add Lesson
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {isOwner && (
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <input
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="New section title…"
                style={{ fontSize: 12 }}
              />
              <button
                className="btn btn-p btn-xs"
                onClick={addSection}
                disabled={!newSectionTitle.trim()}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        {msg && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              marginBottom: 16,
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
                marginLeft: 12,
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

        {selectedItem?.type === "settings" && (
          <div className="card" style={{ maxWidth: 600 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
              Course Overview
            </div>
            <div className="form-grid" style={{ marginBottom: 12 }}>
              <div className="fg">
                <label>Category</label>
                <div style={{ fontSize: 13 }}>{course.category}</div>
              </div>
              <div className="fg">
                <label>Level</label>
                <div style={{ fontSize: 13 }}>{course.level}</div>
              </div>
              <div className="fg">
                <label>Pricing</label>
                <div style={{ fontSize: 13 }}>
                  {course.is_free ? "Free" : `₹${course.price}`}
                </div>
              </div>
              <div className="fg">
                <label>Instructor</label>
                <div style={{ fontSize: 13 }}>{course.instructor}</div>
              </div>
            </div>
            <div className="fg">
              <label>Description</label>
              <div style={{ fontSize: 13, color: "var(--nx-muted)" }}>
                {course.description}
              </div>
            </div>
            <p
              style={{ fontSize: 12, color: "var(--nx-muted)", marginTop: 16 }}
            >
              Select a lesson on the left to edit it, or add a new lesson inside
              a section.
            </p>
          </div>
        )}

        {(selectedItem?.type === "lesson" ||
          selectedItem?.type === "new-lesson") && (
          <div className="card" style={{ maxWidth: 700 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
              {selectedItem.type === "lesson" ? "Edit Lesson" : "New Lesson"}
            </div>
            <div className="fg">
              <label>Title *</label>
              <input
                value={lessonForm.title}
                onChange={(e) =>
                  setLessonForm({ ...lessonForm, title: e.target.value })
                }
              />
            </div>
            <label style={{ marginBottom: 8 }}>Lesson Type</label>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              {LESSON_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() =>
                    setLessonForm({ ...lessonForm, type: t.value })
                  }
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--nx-line)",
                    cursor: "pointer",
                    fontSize: 12,
                    background:
                      lessonForm.type === t.value
                        ? "#6366f1"
                        : "var(--nx-panel2)",
                    color:
                      lessonForm.type === t.value ? "#fff" : "var(--nx-ink)",
                  }}
                >
                  <FontAwesomeIcon icon={t.icon} className="mr-1.5" />
                  {t.label}
                </button>
              ))}
            </div>
            {lessonForm.type === "text" && (
              <div className="fg">
                <label>Content</label>
                <MarkdownEditor
                  value={lessonForm.content}
                  onChange={(v) => setLessonForm({ ...lessonForm, content: v })}
                />
              </div>
            )}
            {lessonForm.type === "youtube" && (
              <div className="fg">
                <label>YouTube URL</label>
                <input
                  value={lessonForm.content}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, content: e.target.value })
                  }
                  placeholder="https://youtube.com/watch?v=…"
                />
              </div>
            )}
            {lessonForm.type === "pdf" && (
              <div className="fg">
                <label>PDF URL</label>
                <input
                  value={lessonForm.pdf_url}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, pdf_url: e.target.value })
                  }
                />
              </div>
            )}
            {lessonForm.type === "video" && (
              <div className="fg">
                <label>Private Video</label>
                {lessonForm.storage_path ? (
                  <div style={{ fontSize: 12, color: "#7be3a4" }}>
                    <FontAwesomeIcon icon={faCircleCheck} className="mr-1" />
                    Uploaded — {lessonForm.storage_path.split("/").pop()}
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="video/*"
                      disabled={uploading}
                      onChange={(e) =>
                        e.target.files?.[0] && uploadVideo(e.target.files[0])
                      }
                    />
                    <div style={{ marginTop: 8 }}>
                      <label style={{ fontSize: 11, color: "var(--nx-muted)" }}>
                        Or paste Firebase Storage path manually:
                      </label>
                      <input
                        value={lessonForm.storage_path || ""}
                        style={{ marginTop: 4 }}
                        onChange={(e) =>
                          setLessonForm({
                            ...lessonForm,
                            storage_path: e.target.value,
                          })
                        }
                        placeholder="niaerpstorage.appspot.com/nia-learning-private/…"
                      />
                    </div>
                  </>
                )}
                {uploading && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--nx-muted)",
                      marginTop: 4,
                    }}
                  >
                    Uploading…
                  </div>
                )}
              </div>
            )}
            {lessonForm.type === "quiz" && (
              <div className="fg">
                <QuizBuilder
                  questions={lessonForm.quiz_questions}
                  onChange={(qs: any) =>
                    setLessonForm({ ...lessonForm, quiz_questions: qs })
                  }
                />
              </div>
            )}
            <div className="form-grid" style={{ marginTop: 8 }}>
              <div className="fg">
                <label>Duration (min)</label>
                <input
                  type="number"
                  value={lessonForm.duration_min}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      duration_min: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div
                className="fg"
                style={{
                  display: "flex",
                  alignItems: "center",
                  paddingTop: 20,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={lessonForm.is_preview}
                    onChange={(e) =>
                      setLessonForm({
                        ...lessonForm,
                        is_preview: e.target.checked,
                      })
                    }
                    style={{ width: "auto" }}
                  />
                  Free preview
                </label>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                className="btn btn-p"
                onClick={saveLesson}
                disabled={saving || uploading}
              >
                {saving
                  ? "Saving…"
                  : uploading
                    ? "Uploading video…"
                    : "Save Lesson"}
              </button>
              {selectedItem.type === "lesson" && (
                <button
                  className="btn btn-g"
                  style={{ color: "#ef4444" }}
                  onClick={() => deleteLesson(selectedItem.lesson.id)}
                >
                  Delete Lesson
                </button>
              )}
              <button
                className="btn btn-g"
                onClick={() => setSelectedItem({ type: "settings" })}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {showManagers && (
        <div
          className="overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setShowManagers(false)
          }
        >
          <div className="modal">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Manage Access — {course.title}
            </h3>
            <p
              style={{
                fontSize: 12,
                color: "var(--nx-muted)",
                marginBottom: 14,
              }}
            >
              Add another HQ Admin as a co-manager of this specific course.
            </p>
            {managerMsg && (
              <div
                style={{
                  fontSize: 12,
                  marginBottom: 10,
                  color: managerMsg.startsWith("✅") ? "#16a34a" : "#ef4444",
                }}
              >
                {managerMsg}
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-end",
                marginBottom: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <UserSearchPicker
                  label="Add HQ Admin"
                  roleFilter="hq_admin"
                  placeholder="Search by name…"
                  value={newManagerId}
                  onChange={(id) => setNewManagerId(id)}
                />
              </div>
              <button
                className="btn btn-p"
                onClick={addManager}
                disabled={!newManagerId}
              >
                Add
              </button>
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--nx-muted)",
                marginBottom: 8,
              }}
            >
              CURRENT CO-MANAGERS
            </div>
            {(course.co_managers || []).length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--nx-muted)" }}>
                None yet.
              </div>
            ) : (
              (course.co_managers || []).map((id: string) => (
                <div
                  key={id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--nx-line)",
                    fontSize: 13,
                  }}
                >
                  <span>{id}</span>
                  <button
                    className="btn btn-xs btn-g"
                    style={{ color: "#ef4444" }}
                    onClick={() => removeManager(id)}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
            <button
              className="btn btn-g"
              style={{ width: "100%", marginTop: 14 }}
              onClick={() => setShowManagers(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
