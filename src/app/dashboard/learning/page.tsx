"use client";
import { Loading } from "@/components/shared/States";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBookOpen,
  faGraduationCap,
  faBriefcase,
  faBullseye,
  faChartLine,
  faSackDollar,
  faBullhorn,
  faLaptop,
  faScaleBalanced,
  faCommentDots,
  faSeedling,
  faBook,
  faFileLines,
  faPlay,
  faClapperboard,
  faCircleQuestion,
  faCircleCheck,
  faHourglassHalf,
  faDownload,
  faCircleXmark,
  faStar,
  faClock,
  faArrowRight,
  faScroll,
  faTrash,
  faClipboard,
  faCircleInfo,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LearningAPI, TokenStore } from "@/lib/api";
import { Pagination } from "@/components/shared/Pagination";
import PageHero from "@/components/shared/PageHero";

// Real video player (Plyr) for private course videos — loaded from CDN,
// same technique already proven in this codebase for Razorpay checkout
// (see lib/razorpay.ts's loadRazorpayScript). No new npm dependency
// added, so there's no risk of shipping code against a package that
// was never actually installed in the real project. Plyr progressively
// enhances the existing native <video> element — same file, same
// <source>, just better controls (speed, better mobile UI, etc.)
// instead of the bare browser-default player.
let plyrScriptPromise: Promise<void> | null = null;
function loadPlyr(): Promise<void> {
  if (typeof window === "undefined")
    return Promise.reject(new Error("Not in browser"));
  if ((window as any).Plyr) return Promise.resolve();
  if (plyrScriptPromise) return plyrScriptPromise;
  plyrScriptPromise = new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.plyr.io/3.7.8/plyr.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://cdn.plyr.io/3.7.8/plyr.js";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Could not load video player — check your connection"));
    document.body.appendChild(script);
  });
  return plyrScriptPromise;
}
import UserSearchPicker from "@/components/ui/UserSearchPicker";

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Business",
  "Leadership",
  "Sales",
  "Finance",
  "Marketing",
  "Technology",
  "Legal",
  "Communication",
  "Personal Development",
];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const ICONS: Record<string, any> = {
  Business: faBriefcase,
  Leadership: faBullseye,
  Sales: faChartLine,
  Finance: faSackDollar,
  Marketing: faBullhorn,
  Technology: faLaptop,
  Legal: faScaleBalanced,
  Communication: faCommentDots,
  "Personal Development": faSeedling,
};
const LESSON_TYPES = [
  {
    value: "text",
    label: "Article / Text",
    icon: faFileLines,
    desc: "Written content, notes",
  },
  {
    value: "youtube",
    label: "YouTube Video",
    icon: faPlay,
    desc: "Embed a YouTube link",
  },
  {
    value: "video",
    label: "Private Video",
    icon: faClapperboard,
    desc: "Upload to Firebase Storage",
  },
  {
    value: "pdf",
    label: "PDF Document",
    icon: faBook,
    desc: "PDF file or Google Drive link",
  },
  {
    value: "quiz",
    label: "Quiz",
    icon: faCircleQuestion,
    desc: "Multiple choice questions",
  },
];

// ─── YouTube embed helper ──────────────────────────────────────────────────
function getYouTubeId(url: string) {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^?&\s]+)/,
  );
  return m ? m[1] : null;
}

// ─── Minimal markdown renderer for lesson text (matches the editor's
// toolbar in curriculum/page.tsx: **bold**, *italic*, ## heading,
// - bullets, [text](url) links). Intentionally small/dependency-free —
// only handles what the editor's own toolbar produces, not full
// CommonMark. Only HQ Admins can author lesson content (scope.is_hq on
// the backend), so this isn't rendering arbitrary user HTML — it stays
// text-to-JSX the whole way, never dangerouslySetInnerHTML, so there's
// no injection surface regardless.
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const inline = (s: string, keyBase: string) => {
    const parts: any[] = [];
    let rest = s;
    let i = 0;
    const linkRe = /\[([^\]]+)\]\(([^)]+)\)/;
    const boldRe = /\*\*([^*]+)\*\*/;
    const italicRe = /\*([^*]+)\*/;
    while (rest.length) {
      const link = rest.match(linkRe);
      const bold = rest.match(boldRe);
      const italic = rest.match(italicRe);
      const candidates = [link, bold, italic].filter(
        Boolean,
      ) as RegExpMatchArray[];
      if (!candidates.length) {
        parts.push(rest);
        break;
      }
      const next = candidates.reduce((a, b) => (a.index! <= b.index! ? a : b));
      if (next.index! > 0) parts.push(rest.slice(0, next.index));
      if (next === link)
        parts.push(
          <a
            key={`${keyBase}-${i++}`}
            href={link![2]}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--nx-blue)" }}
          >
            {link![1]}
          </a>,
        );
      else if (next === bold)
        parts.push(<strong key={`${keyBase}-${i++}`}>{bold![1]}</strong>);
      else parts.push(<em key={`${keyBase}-${i++}`}>{italic![1]}</em>);
      rest = rest.slice(next.index! + next[0].length);
    }
    return parts;
  };
  const out: any[] = [];
  let listBuf: string[] = [];
  const flushList = (key: string) => {
    if (listBuf.length) {
      out.push(
        <ul key={key} style={{ paddingLeft: 20, margin: "8px 0" }}>
          {listBuf.map((li, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              {inline(li, `${key}-li-${i}`)}
            </li>
          ))}
        </ul>,
      );
      listBuf = [];
    }
  };
  lines.forEach((line, i) => {
    if (line.startsWith("## ")) {
      flushList(`ul-${i}`);
      out.push(
        <h3
          key={i}
          style={{ fontSize: 16, fontWeight: 700, margin: "14px 0 6px" }}
        >
          {inline(line.slice(3), `h-${i}`)}
        </h3>,
      );
    } else if (line.startsWith("- ")) {
      listBuf.push(line.slice(2));
    } else if (line.trim() === "") {
      flushList(`ul-${i}`);
      out.push(<div key={i} style={{ height: 8 }} />);
    } else {
      flushList(`ul-${i}`);
      out.push(
        <p key={i} style={{ margin: "0 0 8px" }}>
          {inline(line, `p-${i}`)}
        </p>,
      );
    }
  });
  flushList("ul-end");
  return out;
}

// ─── Lesson player component ──────────────────────────────────────────────
function LessonPlayer({
  lesson,
  onComplete,
}: {
  lesson: any;
  onComplete: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [urlError, setUrlError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const plyrRef = useRef<any>(null);

  useEffect(() => {
    if (lesson.type === "video" && !streamUrl) {
      setLoading(true);
      LearningAPI.streamUrl(lesson.id)
        .then((r: any) => {
          setStreamUrl(r.url || null);
          if (r.error) setUrlError(r.error);
        })
        .catch((e: any) => setUrlError(e.message))
        .finally(() => setLoading(false));
    }
  }, [lesson.id]);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;
    let cancelled = false;
    loadPlyr()
      .then(() => {
        if (cancelled || !videoRef.current) return;
        plyrRef.current = new (window as any).Plyr(videoRef.current, {
          controls: [
            "play-large",
            "play",
            "progress",
            "current-time",
            "duration",
            "mute",
            "volume",
            "settings",
            "fullscreen",
          ],
          settings: ["speed"],
          ratio: "16:9",
        });
      })
      .catch((e: any) => setUrlError(e.message));
    return () => {
      cancelled = true;
      if (plyrRef.current) {
        plyrRef.current.destroy();
        plyrRef.current = null;
      }
    };
  }, [streamUrl, lesson.id]);

  const ytId =
    lesson.type === "youtube" ? getYouTubeId(lesson.content || "") : null;

  return (
    <div>
      {lesson.type === "youtube" && ytId && (
        <>
          <div
            style={{
              position: "relative",
              paddingBottom: "56.25%",
              borderRadius: 10,
              overflow: "hidden",
              marginBottom: 8,
              background: "var(--nx-ink)",
            }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?rel=0`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
              }}
              allowFullScreen
              title={lesson.title}
            />
          </div>
          <div
            style={{ fontSize: 11, color: "var(--nx-muted)", marginBottom: 16 }}
          >
            If this shows "Video unavailable — Playback on other websites has
            been disabled," that's a restriction set by the video's owner on
            YouTube itself, not an issue with this page — a different video (or
            one with embedding enabled) is needed.
          </div>
        </>
      )}
      {lesson.type === "youtube" && !ytId && (
        <div
          style={{
            padding: 24,
            background: "rgba(255,90,90,.1)",
            borderRadius: 10,
            marginBottom: 16,
            color: "#ef4444",
            fontSize: 13,
          }}
        >
          Invalid YouTube URL: {lesson.content}
        </div>
      )}

      {lesson.type === "video" && (
        <div
          style={{
            borderRadius: 10,
            overflow: "hidden",
            marginBottom: 16,
            background: "var(--nx-ink)",
          }}
        >
          {loading ? (
            <div
              style={{
                height: 280,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ color: "#fff", fontSize: 13 }}>
                <FontAwesomeIcon icon={faHourglassHalf} className="mr-1.5" />
                Loading secure video…
              </div>
            </div>
          ) : streamUrl ? (
            <video
              ref={videoRef}
              controls
              onEnded={onComplete}
              playsInline
              style={{
                width: "100%",
                display: "block",
                background: "var(--nx-ink)",
              }}
            >
              <source src={streamUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div
              style={{
                height: 280,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                color: "#9ca3af",
                textAlign: "center",
              }}
            >
              {urlError ? (
                urlError
              ) : (
                <>
                  <FontAwesomeIcon icon={faClapperboard} className="mr-1.5" />
                  Video not available yet
                </>
              )}
            </div>
          )}
        </div>
      )}

      {lesson.type === "pdf" && lesson.pdf_url && (
        <div style={{ marginBottom: 16 }}>
          <iframe
            src={lesson.pdf_url}
            style={{
              width: "100%",
              height: 500,
              border: "none",
              borderRadius: 10,
            }}
            title={lesson.title}
          />
          <a
            href={lesson.pdf_url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              marginTop: 8,
              fontSize: 12,
              color: "#6366f1",
            }}
          >
            <FontAwesomeIcon icon={faDownload} className="mr-1.5" />
            Open PDF in new tab
          </a>
        </div>
      )}

      {lesson.type === "text" && lesson.content && (
        <div
          style={{
            background: "rgba(255,255,255,.04)",
            borderRadius: 10,
            padding: 20,
            marginBottom: 16,
            fontSize: 14,
            lineHeight: 1.8,
            color: "#cbd5e1",
          }}
        >
          {renderMarkdown(lesson.content)}
        </div>
      )}

      {lesson.type === "quiz" && (
        <QuizPlayer lesson={lesson} onPass={onComplete} />
      )}

      {!["video", "quiz"].includes(lesson.type) && !lesson.completed && (
        <button
          className="btn btn-p"
          onClick={onComplete}
          style={{ width: "100%" }}
        >
          <FontAwesomeIcon icon={faCircleCheck} className="mr-1.5" />
          Mark as Complete
        </button>
      )}
      {lesson.completed && (
        <div
          style={{
            textAlign: "center",
            padding: "12px",
            background: "rgba(39,216,109,.1)",
            borderRadius: 10,
            color: "#16a34a",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          <FontAwesomeIcon icon={faCircleCheck} className="mr-1.5" />
          Lesson Completed
        </div>
      )}
    </div>
  );
}

// ─── Simple quiz player ────────────────────────────────────────────────────
function QuizPlayer({ lesson, onPass }: { lesson: any; onPass: () => void }) {
  const questions = lesson.quiz_questions || [];
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  if (!questions.length)
    return (
      <div
        style={{
          padding: 24,
          background: "rgba(255,255,255,.04)",
          borderRadius: 10,
          color: "#9ca3af",
          textAlign: "center",
        }}
      >
        No quiz questions yet
      </div>
    );

  const submit = () => {
    let correct = 0;
    questions.forEach((q: any, i: number) => {
      if (answers[i] === q.correct_index) correct++;
    });
    const sc = Math.round((correct / questions.length) * 100);
    setScore(sc);
    setSubmitted(true);
    if (sc >= 70) onPass();
  };

  return (
    <div>
      {questions.map((q: any, i: number) => (
        <div
          key={i}
          style={{
            background: "rgba(255,255,255,.04)",
            borderRadius: 10,
            padding: 14,
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            Q{i + 1}. {q.question}
          </div>
          {q.options.map((opt: string, j: number) => {
            const isSelected = answers[i] === j;
            const isCorrect = submitted && j === q.correct_index;
            const isWrong = submitted && isSelected && j !== q.correct_index;
            return (
              <div
                key={j}
                onClick={() => !submitted && setAnswers({ ...answers, [i]: j })}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  marginBottom: 6,
                  cursor: submitted ? "default" : "pointer",
                  border: `1px solid ${isCorrect ? "#10b981" : isWrong ? "#ef4444" : isSelected ? "#6366f1" : "var(--nx-line)"}`,
                  background: isCorrect
                    ? "rgba(39,216,109,.1)"
                    : isWrong
                      ? "rgba(255,90,90,.1)"
                      : isSelected
                        ? "rgba(22,143,255,.1)"
                        : "var(--nx-panel2)",
                  fontSize: 13,
                }}
              >
                {isCorrect && (
                  <FontAwesomeIcon icon={faCircleCheck} className="mr-1" />
                )}
                {isWrong && (
                  <FontAwesomeIcon icon={faCircleXmark} className="mr-1" />
                )}
                {opt}
              </div>
            );
          })}
        </div>
      ))}
      {!submitted ? (
        <button
          className="btn btn-p"
          style={{ width: "100%" }}
          onClick={submit}
          disabled={Object.keys(answers).length < questions.length}
        >
          Submit Quiz
        </button>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: 16,
            background:
              score >= 70 ? "rgba(39,216,109,.1)" : "rgba(255,90,90,.1)",
            borderRadius: 10,
            color: score >= 70 ? "#16a34a" : "#ef4444",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 800 }}>{score}%</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            {score >= 70 ? (
              <>
                <FontAwesomeIcon icon={faStar} className="mr-1.5" />
                Passed! Moving to next lesson…
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCircleXmark} className="mr-1.5" />
                Score 70%+ to pass. Try again.
              </>
            )}
          </div>
          {score < 70 && (
            <button
              className="btn btn-g btn-sm"
              style={{ marginTop: 8 }}
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
            >
              Retry Quiz
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Star rating input ────────────────────────────────────────────────
function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{
            fontSize: 24,
            cursor: "pointer",
            color: (hover || value) >= n ? "#f59e0b" : "var(--nx-line)",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ─── Category accent colors + default emoji covers (for member-facing
// course cards). Real uploaded course.image_url always wins; this is
// only the fallback for courses nobody has added a cover photo to yet,
// styled as a full-bleed tile (matching the reference design) instead
// of a small corner icon so cardless courses don't look unfinished.
const CATEGORY_COLORS: Record<string, string> = {
  Business: "#6366f1",
  Leadership: "#ff4b0a",
  Sales: "#10b981",
  Finance: "#f59e0b",
  Marketing: "#ec4899",
  Technology: "#0ea5e9",
  Legal: "#8b5cf6",
  Communication: "#14b8a6",
  "Personal Development": "#f97316",
};
const CATEGORY_EMOJI: Record<string, string> = {
  Business: "🤝",
  Leadership: "🧭",
  Sales: "📈",
  Finance: "💰",
  Marketing: "📢",
  Technology: "💻",
  Legal: "⚖️",
  Communication: "💬",
  "Personal Development": "🎨",
};

// ─── Course card (member view) ──────────────────────────────────────────────
// Replaces the admin-only table for non-HQ/super-admin members: a browsable
// grid with cover image, category/level chips, rating, progress, and a
// single primary action (Enroll / Continue / Review) — matches the
// "Learning Ground" card layout members expect, while canManage users still
// get the dense table with inline edit/delete/curriculum controls.
function CourseCard({
  course,
  enrolled,
  myProg,
  enrolling,
  onEnroll,
  onOpen,
  onRate,
}: {
  course: any;
  enrolled: boolean;
  myProg: any;
  enrolling: boolean;
  onEnroll: () => void;
  onOpen: () => void;
  onRate?: () => void;
}) {
  const accent = CATEGORY_COLORS[course.category] || "#6366f1";
  const emoji = CATEGORY_EMOJI[course.category] || "📘";
  const progress = myProg?.progress || 0;
  return (
    <div
      className="card learning-course-card"
      style={{
        padding: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {course.image_url ? (
        <img
          src={course.image_url}
          alt={course.title}
          style={{ width: "100%", height: 120, objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: 120,
            background: `linear-gradient(135deg,${accent}40,${accent}14)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
          }}
        >
          {emoji}
        </div>
      )}

      <div
        style={{
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          flex: 1,
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 99,
              background: `${accent}22`,
              color: accent,
            }}
          >
            {course.category || "General"}
          </span>
          {course.level && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 99,
                background: "var(--nx-panel2)",
                color: "var(--nx-muted)",
              }}
            >
              {course.level}
            </span>
          )}
        </div>

        <div>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>
            {course.title}
          </div>
          <div style={{ fontSize: 12, color: "var(--nx-muted)", marginTop: 2 }}>
            by {course.instructor || "NIA Team"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            fontSize: 11,
            color: "var(--nx-muted)",
          }}
        >
          {course.duration && (
            <span>
              <FontAwesomeIcon icon={faClock} className="mr-1" />
              {course.duration}
            </span>
          )}
          {course.lessons > 0 && (
            <span>
              <FontAwesomeIcon icon={faBook} className="mr-1" />
              {course.lessons} lessons
            </span>
          )}
        </div>

        {course.rating_count > 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
            }}
          >
            <FontAwesomeIcon icon={faStar} style={{ color: "#f59e0b" }} />
            <span style={{ fontWeight: 700 }}>{course.avg_rating}</span>
            <span style={{ color: "var(--nx-muted)" }}>
              / 5.0 ({course.rating_count})
            </span>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "var(--nx-muted)" }}>
            No ratings yet
          </div>
        )}

        {enrolled && progress > 0 && (
          <div>
            <div className="prog">
              <div
                className="prog-fill"
                style={{
                  width: `${progress}%`,
                  background: myProg?.completed
                    ? "#10b981"
                    : "var(--nx-orange)",
                }}
              />
            </div>
            <div
              style={{ fontSize: 10, color: "var(--nx-muted)", marginTop: 3 }}
            >
              {progress}% complete
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "auto",
            paddingTop: 6,
          }}
        >
          <span
            style={{
              fontWeight: 800,
              fontSize: 14,
              color: course.price === 0 ? "#10b981" : "var(--nx-ink)",
            }}
          >
            {course.price === 0
              ? "Free"
              : "₹" + (course.price || 0).toLocaleString()}
          </span>
          {enrolled ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button className="btn btn-p btn-sm" onClick={onOpen}>
                {myProg?.completed ? (
                  <>
                    <FontAwesomeIcon icon={faScroll} className="mr-1" />
                    Review
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlay} className="mr-1" />
                    Continue
                  </>
                )}
              </button>
              {onRate && (
                <button className="btn btn-g btn-sm" onClick={onRate}>
                  <FontAwesomeIcon icon={faStar} />
                </button>
              )}
              {myProg?.completed && (
                <span className="badge b-green" style={{ fontSize: 9 }}>
                  <FontAwesomeIcon icon={faGraduationCap} />
                </span>
              )}
            </div>
          ) : (
            <button
              className="btn btn-p btn-sm"
              disabled={enrolling}
              onClick={onEnroll}
            >
              {enrolling
                ? "…"
                : course.price === 0
                  ? "Enroll Free"
                  : "Buy Course"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Feedback modal ────────────────────────────────────────────────────────
// Was entirely missing — courses had no rating/review system at all,
// enrolled or not. Only reachable once enrolled (matches the backend's
// own enrollment gate on submit_feedback), pre-fills with the member's
// existing review if they already left one so resubmitting reads as
// "edit your review" rather than accidentally duplicating it.
function FeedbackModal({
  course,
  onClose,
  onSubmitted,
}: {
  course: any;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    LearningAPI.myFeedback(course.id)
      .then((existing: any) => {
        if (existing) {
          setRating(existing.rating || 0);
          setComment(existing.comment || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [course.id]);

  const submit = async () => {
    if (!rating) {
      setErr("Pick a star rating first");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      await LearningAPI.submitFeedback(course.id, { rating, comment });
      onSubmitted();
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
          Rate "{course.title}"
        </h3>
        <p style={{ fontSize: 12, color: "var(--nx-muted)", marginBottom: 14 }}>
          Your feedback helps other members and the course creator.
        </p>
        {loading ? (
          <Loading label="Loading…" />
        ) : (
          <>
            <div className="fg">
              <label>Your rating</label>
              <StarInput value={rating} onChange={setRating} />
            </div>
            <div className="fg">
              <label>Comment (optional)</label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you think of this course?"
              />
            </div>
            {err && (
              <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>
                {err}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={submit}
                disabled={saving}
              >
                {saving ? "Saving…" : "Submit Feedback"}
              </button>
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LearningPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [coursePage, setCoursePage] = useState(1);
  const [courseTotal, setCourseTotal] = useState<number | null>(0);
  const [courseHasMore, setCourseHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"all" | "mine" | "player">("all");
  const [catFilter, setCatFilter] = useState("");
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [selected, setSelected] = useState<any | null>(null); // course detail
  const [showCreate, setShowCreate] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [feedbackCourse, setFeedbackCourse] = useState<any | null>(null);

  // Course player state
  const [playerCourse, setPlayerCourse] = useState<any | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any | null>(null);
  const [sectLoading, setSectLoading] = useState(false);

  const me = TokenStore.getUser();
  const canManage = me?.role === "hq_admin" || me?.role === "super_admin";
  const emptyForm = {
    title: "",
    instructor: "",
    category: "Business",
    level: "Beginner",
    duration: "",
    lessons: 0,
    price: 0,
    description: "",
    is_free: true,
    image_url: "",
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchAll(1);
  }, [catFilter]);

  const ranFromUrlRef = useRef(false);
  useEffect(() => {
    if (ranFromUrlRef.current || loading) return;
    const courseId = new URLSearchParams(window.location.search).get("course");
    if (!courseId) return;
    const course = [...courses, ...myCourses].find((c) => c.id === courseId);
    if (course) {
      ranFromUrlRef.current = true;
      openPlayer(course);
    }
  }, [loading, courses, myCourses]);

  const fetchAll = async (p = 1) => {
    setLoading(true);
    setError("");
    try {
      const pageSize = catFilter ? 100 : 12;
      const [all, mine] = await Promise.all([
        LearningAPI.courses({ page: catFilter ? 1 : p, page_size: pageSize }),
        LearningAPI.myCourses(),
      ]);
      setCourses(all.items || all);
      setCourseTotal(all.total ?? null);
      setCourseHasMore(all.has_more || false);
      setCoursePage(catFilter ? 1 : p);
      setMyCourses(mine.items || mine);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const enroll = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      await LearningAPI.enroll(courseId);
      setMsg("✅ Enrolled! Starting course…");
      await fetchAll();
      const course = courses.find((c) => c.id === courseId);
      if (course) openPlayer(course);
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setEnrolling(null);
    }
  };

  const openPlayer = async (course: any) => {
    setPlayerCourse(course);
    setSectLoading(true);
    setTab("player");
    setActiveLesson(null);
    router.replace(`/dashboard/learning?course=${course.id}`);
    try {
      const res = await LearningAPI.sections(course.id);
      const sects = res.sections || [];
      setSections(sects);
      for (const sec of sects) {
        const first = (sec.lessons || []).find((l: any) => !l.completed);
        if (first) {
          setActiveLesson(first);
          break;
        }
      }
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setSectLoading(false);
    }
  };

  const completeLesson = async (lessonId: string) => {
    try {
      const res = await LearningAPI.completeLesson(lessonId);
      setMsg(`✅ Lesson complete! Progress: ${res.progress}%`);
      if (playerCourse) {
        const updated = await LearningAPI.sections(playerCourse.id);
        setSections(updated.sections || []);
        setActiveLesson((prev: any) =>
          prev ? { ...prev, completed: true } : prev,
        );
        if (res.course_complete) {
          setMsg("🎓 Course Complete! Certificate earned!");
          await fetchAll();
        }
      }
    } catch (e: any) {
      setMsg("❌ " + e.message);
    }
  };

  // Image upload for the create/edit course forms, same signed-URL
  // pattern already used for lesson videos/Deal Corner/Store, just a
  // different (public, not private-video) upload endpoint.
  const uploadCourseImage = async (file: File, target: "create" | "edit") => {
    setUploadingImg(true);
    try {
      const { upload_url, public_url } =
        await LearningAPI.getCourseImageUploadUrl({
          filename: file.name,
          content_type: file.type,
        });
      await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (target === "create")
        setForm((f) => ({ ...f, image_url: public_url }));
      else setEditingCourse((c: any) => ({ ...c, image_url: public_url }));
      setMsg("✅ Image uploaded!");
    } catch (e: any) {
      setMsg("❌ Upload failed: " + e.message);
    } finally {
      setUploadingImg(false);
    }
  };

  const enrolledIds = new Set(myCourses.map((m: any) => m.course_id));
  const enrolledCount = myCourses.length;
  const completedCount = myCourses.filter((m: any) => m.completed).length;
  const inProgress = myCourses.filter(
    (m: any) => !m.completed && m.progress > 0,
  ).length;
  const filteredCourses = catFilter
    ? courses.filter((c) => c.category === catFilter)
    : courses;

  const allLessons = sections.flatMap((s) => s.lessons || []);
  const completedLess = allLessons.filter((l) => l.completed).length;
  const playerProgress = allLessons.length
    ? Math.round((completedLess / allLessons.length) * 100)
    : 0;

  return (
    <div className="page learning-page">
      {/* ── COURSE PLAYER VIEW ──────────────────────────────────────────── */}
      {tab === "player" && playerCourse && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <button
              className="btn btn-g btn-sm"
              onClick={() => {
                setTab("all");
                setPlayerCourse(null);
                setSections([]);
                router.replace("/dashboard/learning");
              }}
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-1.5" />
              Back
            </button>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
                {playerCourse.title}
              </h2>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                by {playerCourse.instructor || "NIA Team"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>Progress</div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 18,
                  color: "var(--nx-orange)",
                }}
              >
                {playerProgress}%
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                height: 6,
                background: "rgba(255,255,255,.06)",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "var(--nx-orange)",
                  borderRadius: 99,
                  width: `${playerProgress}%`,
                  transition: "width .5s",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "#9ca3af",
                marginTop: 4,
              }}
            >
              <span>
                {completedLess}/{allLessons.length} lessons complete
              </span>
              {playerProgress === 100 && (
                <span
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <span style={{ color: "#10b981", fontWeight: 700 }}>
                    <FontAwesomeIcon
                      icon={faGraduationCap}
                      className="mr-1.5"
                    />
                    Course Complete!
                  </span>
                  <button
                    className="btn btn-p btn-xs"
                    onClick={() => setFeedbackCourse(playerCourse)}
                  >
                    <FontAwesomeIcon icon={faStar} className="mr-1" />
                    Rate this course
                  </button>
                </span>
              )}
            </div>
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
                background:
                  msg.startsWith("✅") || msg.startsWith("🎓")
                    ? "rgba(39,216,109,.1)"
                    : "rgba(255,90,90,.1)",
                color:
                  msg.startsWith("✅") || msg.startsWith("🎓")
                    ? "#16a34a"
                    : "#ef4444",
                border: `1px solid ${msg.startsWith("✅") || msg.startsWith("🎓") ? "rgba(39,216,109,.35)" : "rgba(255,90,90,.35)"}`,
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

          <div
            className="lp-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "300px 1fr",
              gap: 16,
              alignItems: "start",
            }}
          >
            <div
              className="lp-curriculum"
              style={{
                background: "var(--nx-panel)",
                borderRadius: 12,
                border: "1px solid var(--nx-line)",
                overflow: "hidden",
                position: "sticky",
                top: 80,
              }}
            >
              <div
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid var(--nx-line)",
                  fontWeight: 700,
                  fontSize: 13,
                  background: "rgba(255,255,255,.04)",
                }}
              >
                <FontAwesomeIcon icon={faBook} className="mr-1.5" />
                Curriculum
              </div>
              {sectLoading ? (
                <Loading label="Loading lessons…" />
              ) : sections.length === 0 ? (
                <div
                  style={{
                    padding: 24,
                    textAlign: "center",
                    color: "#9ca3af",
                    fontSize: 13,
                  }}
                >
                  No lessons yet
                  {canManage && (
                    <>
                      <br />
                      <button
                        className="btn btn-p btn-sm"
                        style={{ marginTop: 8 }}
                        onClick={() =>
                          (window.location.href = `/dashboard/learning/curriculum?courseId=${playerCourse.id}`)
                        }
                      >
                        Build Curriculum
                      </button>
                    </>
                  )}
                </div>
              ) : (
                sections.map((sec, si) => (
                  <div key={sec.id}>
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "rgba(255,255,255,.04)",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--nx-muted)",
                        borderBottom: "1px solid var(--nx-line)",
                        borderTop: si > 0 ? "2px solid var(--nx-line)" : "none",
                      }}
                    >
                      Section {si + 1}: {sec.title}
                    </div>
                    {(sec.lessons || []).map((l: any, li: number) => {
                      const isActive = activeLesson?.id === l.id;
                      const lType = LESSON_TYPES.find(
                        (t) => t.value === l.type,
                      );
                      return (
                        <div
                          key={l.id}
                          onClick={() => setActiveLesson(l)}
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            background: isActive
                              ? "rgba(22,143,255,.1)"
                              : l.completed
                                ? "rgba(39,216,109,.1)"
                                : "transparent",
                            borderBottom: "1px solid var(--nx-line)",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            borderLeft: isActive
                              ? "3px solid #6366f1"
                              : l.completed
                                ? "3px solid #10b981"
                                : "3px solid transparent",
                          }}
                        >
                          <div style={{ fontSize: 14, flexShrink: 0 }}>
                            <FontAwesomeIcon
                              icon={
                                l.completed
                                  ? faCircleCheck
                                  : isActive
                                    ? faPlay
                                    : lType?.icon || faFileLines
                              }
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: isActive ? 700 : 500,
                                color: isActive
                                  ? "#4338ca"
                                  : l.completed
                                    ? "#15803d"
                                    : "var(--nx-ink)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {li + 1}. {l.title}
                            </div>
                            {l.duration_min > 0 && l.type !== "quiz" && (
                              <div style={{ fontSize: 10, color: "#9ca3af" }}>
                                <FontAwesomeIcon
                                  icon={faClock}
                                  className="mr-1"
                                />
                                {l.duration_min} min
                              </div>
                            )}
                          </div>
                          {l.is_preview &&
                            !enrolledIds.has(playerCourse.id) && (
                              <span
                                style={{
                                  fontSize: 9,
                                  padding: "1px 5px",
                                  borderRadius: 99,
                                  background: "rgba(255,75,10,.1)",
                                  color: "#c2410c",
                                  fontWeight: 700,
                                }}
                              >
                                FREE
                              </span>
                            )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              {canManage && sections.length > 0 && (
                <div
                  style={{ padding: 12, borderTop: "1px solid var(--nx-line)" }}
                >
                  <button
                    className="btn btn-g btn-sm"
                    style={{ width: "100%" }}
                    onClick={() =>
                      (window.location.href = `/dashboard/learning/curriculum?courseId=${playerCourse.id}`)
                    }
                  >
                    <FontAwesomeIcon icon={faBook} className="mr-1.5" />
                    Edit Curriculum
                  </button>
                </div>
              )}
            </div>

            <div className="lp-main">
              {!activeLesson ? (
                <div
                  style={{
                    background: "var(--nx-panel)",
                    borderRadius: 12,
                    padding: 40,
                    textAlign: "center",
                    border: "1px solid var(--nx-line)",
                  }}
                >
                  <div style={{ fontSize: 40, marginBottom: 12 }}>
                    <FontAwesomeIcon
                      icon={ICONS[playerCourse.category] || faBook}
                    />
                  </div>
                  <h3
                    style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}
                  >
                    {playerCourse.title}
                  </h3>
                  <p
                    style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}
                  >
                    {playerCourse.description}
                  </p>
                  {sections.length > 0 && (
                    <button
                      className="btn btn-p"
                      onClick={() => setActiveLesson(sections[0]?.lessons?.[0])}
                    >
                      Start Learning{" "}
                      <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
                    </button>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    background: "var(--nx-panel)",
                    borderRadius: 12,
                    padding: 20,
                    border: "1px solid var(--nx-line)",
                  }}
                >
                  <div
                    style={{
                      marginBottom: 16,
                      paddingBottom: 12,
                      borderBottom: "1px solid var(--nx-line)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>
                        <FontAwesomeIcon
                          icon={
                            LESSON_TYPES.find(
                              (t) => t.value === activeLesson.type,
                            )?.icon || faFileLines
                          }
                        />
                      </span>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                        {activeLesson.title}
                      </h3>
                      {activeLesson.completed && (
                        <span
                          className="badge b-green"
                          style={{ fontSize: 10 }}
                        >
                          <FontAwesomeIcon
                            icon={faCircleCheck}
                            className="mr-1"
                          />
                          Done
                        </span>
                      )}
                    </div>
                    {activeLesson.duration_min > 0 &&
                      activeLesson.type !== "quiz" && (
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>
                          <FontAwesomeIcon icon={faClock} className="mr-1" />
                          {activeLesson.duration_min} min estimated
                        </span>
                      )}
                  </div>
                  <LessonPlayer
                    key={activeLesson.id}
                    lesson={activeLesson}
                    onComplete={() => completeLesson(activeLesson.id)}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 16,
                      paddingTop: 12,
                      borderTop: "1px solid var(--nx-line)",
                    }}
                  >
                    <button
                      className="btn btn-g btn-sm"
                      onClick={() => {
                        const flat = sections.flatMap((s) => s.lessons || []);
                        const idx = flat.findIndex(
                          (l) => l.id === activeLesson.id,
                        );
                        if (idx > 0) setActiveLesson(flat[idx - 1]);
                      }}
                    >
                      <FontAwesomeIcon icon={faArrowLeft} className="mr-1.5" />
                      Previous
                    </button>
                    <button
                      className="btn btn-p btn-sm"
                      onClick={() => {
                        const flat = sections.flatMap((s) => s.lessons || []);
                        const idx = flat.findIndex(
                          (l) => l.id === activeLesson.id,
                        );
                        if (idx < flat.length - 1)
                          setActiveLesson(flat[idx + 1]);
                      }}
                    >
                      Next{" "}
                      <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN VIEW (All Courses + My Learning) ─────────────────────── */}
      {tab !== "player" && (
        <>
          <div className="learning-hero">
            <PageHero
              icon={faBookOpen}
              kicker="Learn & Level Up"
              title="Learning Ground"
              description={
                canManage
                  ? "Manage the course catalog — build curriculum, track engagement, add new courses."
                  : "Self-paced courses, certifications, and business education — build skills that grow your business."
              }
              stats={
                canManage
                  ? [
                      {
                        icon: faBook,
                        value: courses.length,
                        label: "Total courses",
                      },
                      {
                        icon: faTag,
                        value: CATEGORIES.length,
                        label: "Categories",
                      },
                    ]
                  : [
                      {
                        icon: faBook,
                        value: courses.length,
                        label: "Available",
                      },
                      {
                        icon: faGraduationCap,
                        value: enrolledCount,
                        label: "Enrolled",
                      },
                      {
                        icon: faClock,
                        value: inProgress,
                        label: "In progress",
                      },
                      {
                        icon: faCircleCheck,
                        value: completedCount,
                        label: "Completed",
                      },
                    ]
              }
            />
            <img
              src="/visuals/dashboard-learning-3d.jpg"
              alt=""
              aria-hidden="true"
            />
            {canManage && (
              <button
                className="btn btn-p learning-add-course"
                onClick={() => {
                  setForm(emptyForm);
                  setShowCreate(true);
                }}
              >
                + Add Course
              </button>
            )}
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
                background:
                  msg.startsWith("✅") || msg.startsWith("🎓")
                    ? "rgba(39,216,109,.1)"
                    : "rgba(255,90,90,.1)",
                color:
                  msg.startsWith("✅") || msg.startsWith("🎓")
                    ? "#16a34a"
                    : "#ef4444",
                border: `1px solid ${msg.startsWith("✅") || msg.startsWith("🎓") ? "rgba(39,216,109,.35)" : "rgba(255,90,90,.35)"}`,
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
          {error && (
            <div className="learning-error">
              <span>
                <strong>Courses couldn’t be loaded.</strong>
                {error}
              </span>
              <button
                className="btn btn-g btn-sm"
                onClick={() => fetchAll(coursePage)}
              >
                Try again
              </button>
            </div>
          )}

          {/* My Learning only makes sense for someone taking courses —
              admins/HQ manage the catalog, they don't enroll, so they only
              ever see the one "All Courses" view (no tab bar needed for a
              single tab). */}
          {!canManage && (
            <div className="tab-bar learning-tabs">
              <button
                className={`tab-btn${tab === "all" ? " active" : ""}`}
                onClick={() => setTab("all")}
              >
                All Courses ({filteredCourses.length})
              </button>
              <button
                className={`tab-btn${tab === "mine" ? " active" : ""}`}
                onClick={() => setTab("mine")}
              >
                My Learning ({enrolledCount})
              </button>
            </div>
          )}

          {tab === "all" && (
            <div
              className="learning-category-filters"
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 14,
              }}
            >
              <button
                className={`btn btn-sm ${catFilter === "" ? "btn-p" : "btn-g"}`}
                onClick={() => setCatFilter("")}
              >
                All
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={`btn btn-sm ${catFilter === c ? "btn-p" : "btn-g"}`}
                  onClick={() => setCatFilter(c)}
                >
                  <FontAwesomeIcon
                    icon={ICONS[c] || faBook}
                    className="mr-1.5"
                  />
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* All Courses — table for HQ/super admins (inline edit/delete/
              curriculum actions), card grid for regular members */}
          {tab === "all" &&
            (loading ? (
              <div className="card">
                <Loading label="Loading courses…" />
              </div>
            ) : filteredCourses.length === 0 ? (
              <div
                className="card learning-empty-state"
                style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>
                  <FontAwesomeIcon icon={faBook} />
                </div>
                <div>
                  {catFilter
                    ? `No courses in "${catFilter}" yet`
                    : "No courses yet"}
                </div>
                {canManage && (
                  <button
                    className="btn btn-p btn-sm"
                    style={{ marginTop: 12 }}
                    onClick={() => setShowCreate(true)}
                  >
                    Add First Course
                  </button>
                )}
              </div>
            ) : (
              <>
                {canManage ? (
                  <div
                    className="card"
                    style={{ padding: 0, overflow: "hidden" }}
                  >
                    <table className="tbl">
                      <thead>
                        <tr>
                          {[
                            "Course",
                            "Instructor",
                            "Duration",
                            "Rating",
                            "Price",
                            "Status",
                            "",
                          ].map((h) => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCourses.map((c) => {
                          const isEnrolled = enrolledIds.has(c.id);
                          const myProg = myCourses.find(
                            (m: any) => m.course_id === c.id,
                          );
                          return (
                            <tr key={c.id}>
                              <td>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  {c.image_url ? (
                                    <img
                                      src={c.image_url}
                                      alt={c.title}
                                      style={{
                                        width: 40,
                                        height: 40,
                                        objectFit: "cover",
                                        borderRadius: 8,
                                        flexShrink: 0,
                                      }}
                                    />
                                  ) : (
                                    <span
                                      style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 8,
                                        background: "var(--nx-panel2)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 16,
                                        color: "var(--nx-muted)",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <FontAwesomeIcon
                                        icon={ICONS[c.category] || faBook}
                                      />
                                    </span>
                                  )}
                                  <div>
                                    <div
                                      style={{ fontSize: 13, fontWeight: 600 }}
                                    >
                                      {c.title}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: "var(--nx-muted)",
                                      }}
                                    >
                                      {c.category || "General"}
                                      {c.level ? ` · ${c.level}` : ""}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ fontSize: 12 }}>
                                {c.instructor || "NIA Team"}
                              </td>
                              <td
                                style={{
                                  fontSize: 12,
                                  color: "var(--nx-muted)",
                                }}
                              >
                                {c.duration && (
                                  <div>
                                    <FontAwesomeIcon
                                      icon={faClock}
                                      className="mr-1"
                                    />
                                    {c.duration}
                                  </div>
                                )}
                                {c.lessons > 0 && (
                                  <div>{c.lessons} lessons</div>
                                )}
                              </td>
                              <td>
                                {c.rating_count > 0 ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                  >
                                    <FontAwesomeIcon
                                      icon={faStar}
                                      style={{ color: "#f59e0b", fontSize: 12 }}
                                    />
                                    <span
                                      style={{ fontSize: 12, fontWeight: 600 }}
                                    >
                                      {c.avg_rating}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: "var(--nx-muted)",
                                      }}
                                    >
                                      ({c.rating_count})
                                    </span>
                                  </div>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: "var(--nx-muted)",
                                    }}
                                  >
                                    No ratings yet
                                  </span>
                                )}
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontWeight: 700,
                                    fontSize: 13,
                                    color:
                                      c.price === 0
                                        ? "#10b981"
                                        : "var(--nx-ink)",
                                  }}
                                >
                                  {c.price === 0
                                    ? "Free"
                                    : "₹" + (c.price || 0).toLocaleString()}
                                </span>
                              </td>
                              <td>
                                {isEnrolled ? (
                                  <div>
                                    <span className="badge b-green">
                                      Enrolled
                                    </span>
                                    {myProg && myProg.progress > 0 && (
                                      <div
                                        style={{
                                          fontSize: 10,
                                          color: "var(--nx-muted)",
                                          marginTop: 3,
                                        }}
                                      >
                                        {myProg.progress}% complete
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: "var(--nx-muted)",
                                    }}
                                  >
                                    Not enrolled
                                  </span>
                                )}
                              </td>
                              <td>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 4,
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  {isEnrolled ? (
                                    <button
                                      className="btn btn-p btn-sm"
                                      onClick={() => openPlayer(c)}
                                    >
                                      {myProg?.completed ? (
                                        <>
                                          <FontAwesomeIcon
                                            icon={faScroll}
                                            className="mr-1"
                                          />
                                          Review
                                        </>
                                      ) : (
                                        <>
                                          <FontAwesomeIcon
                                            icon={faPlay}
                                            className="mr-1"
                                          />
                                          Continue
                                        </>
                                      )}
                                    </button>
                                  ) : (
                                    <button
                                      className="btn btn-p btn-sm"
                                      disabled={enrolling === c.id}
                                      onClick={() => enroll(c.id)}
                                    >
                                      {enrolling === c.id
                                        ? "…"
                                        : "Enroll & Start"}
                                    </button>
                                  )}
                                  <>
                                    <button
                                      className="btn btn-xs btn-g"
                                      style={{ color: "#8b5cf6" }}
                                      onClick={() =>
                                        (window.location.href = `/dashboard/learning/curriculum?courseId=${c.id}`)
                                      }
                                      title="Build curriculum"
                                    >
                                      📋
                                    </button>
                                    <button
                                      className="btn btn-xs btn-g"
                                      style={{ color: "#6366f1" }}
                                      onClick={() => setEditingCourse({ ...c })}
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      className="btn btn-xs btn-g"
                                      style={{ color: "#ef4444" }}
                                      onClick={async () => {
                                        if (!confirm(`Delete "${c.title}"?`))
                                          return;
                                        try {
                                          await LearningAPI.deleteCourse(c.id);
                                          setMsg("✅ Deleted");
                                          fetchAll(coursePage);
                                        } catch (e: any) {
                                          setMsg("❌ " + e.message);
                                        }
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                  </>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div
                    className="learning-course-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill,minmax(260px,1fr))",
                      gap: 16,
                    }}
                  >
                    {filteredCourses.map((c) => (
                      <CourseCard
                        key={c.id}
                        course={c}
                        enrolled={enrolledIds.has(c.id)}
                        myProg={myCourses.find(
                          (m: any) => m.course_id === c.id,
                        )}
                        enrolling={enrolling === c.id}
                        onEnroll={() => enroll(c.id)}
                        onOpen={() => openPlayer(c)}
                      />
                    ))}
                  </div>
                )}
                {!catFilter && (
                  <Pagination
                    page={coursePage}
                    pageSize={12}
                    total={courseTotal}
                    hasMore={courseHasMore}
                    loading={loading}
                    onPageChange={fetchAll}
                  />
                )}
              </>
            ))}

          {/* My Learning tab — same CourseCard grid as All Courses, so both
              tabs share one visual language instead of card-grid vs
              plain-list. */}
          {tab === "mine" &&
            (myCourses.length === 0 ? (
              <div
                className="card learning-empty-state"
                style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>
                  <FontAwesomeIcon icon={faBookOpen} />
                </div>
                <div style={{ marginBottom: 8 }}>No courses enrolled yet</div>
                <button
                  className="btn btn-p btn-sm"
                  onClick={() => setTab("all")}
                >
                  Browse Courses
                </button>
              </div>
            ) : (
              <div
                className="learning-course-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
                  gap: 16,
                }}
              >
                {myCourses.map((m: any) => {
                  const course =
                    courses.find((c) => c.id === m.course_id) || m.course || {};
                  return (
                    <CourseCard
                      key={m.id}
                      course={course}
                      enrolled={true}
                      myProg={m}
                      enrolling={false}
                      onEnroll={() => {}}
                      onOpen={() => openPlayer(course)}
                      onRate={() => setFeedbackCourse(course)}
                    />
                  );
                })}
              </div>
            ))}
        </>
      )}

      {feedbackCourse && (
        <FeedbackModal
          course={feedbackCourse}
          onClose={() => setFeedbackCourse(null)}
          onSubmitted={() => {
            setMsg("✅ Thanks for your feedback!");
            fetchAll(coursePage);
          }}
        />
      )}

      {/* ── CREATE COURSE MODAL ──────────────────────────────────────── */}
      {showCreate && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div className="modal modal-lg">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              + New Course
            </h3>
            <div className="form-grid">
              <div className="fg" style={{ gridColumn: "1/-1" }}>
                <label>Course Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. GST & Taxation for Business Owners"
                />
              </div>
              <div className="fg">
                <label>Instructor *</label>
                <input
                  value={form.instructor}
                  onChange={(e) =>
                    setForm({ ...form, instructor: e.target.value })
                  }
                  placeholder="Name or organization"
                />
              </div>
              <div className="fg">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label>Level</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                >
                  {LEVELS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label>Total Duration</label>
                <input
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                  placeholder="e.g. 4 hours"
                />
              </div>
              <div className="fg">
                <label
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <input
                    type="checkbox"
                    checked={form.is_free}
                    onChange={(e) =>
                      setForm({ ...form, is_free: e.target.checked, price: 0 })
                    }
                  />
                  Free Course
                </label>
                {!form.is_free && (
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: Number(e.target.value) })
                    }
                    placeholder="Price ₹"
                  />
                )}
              </div>
            </div>
            <div className="fg">
              <label>Cover Image</label>
              {form.image_url ? (
                <div
                  style={{
                    position: "relative",
                    marginBottom: 8,
                    width: "fit-content",
                  }}
                >
                  <img
                    src={form.image_url}
                    alt="Course cover"
                    style={{
                      width: 160,
                      height: 90,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-g btn-xs"
                    style={{ position: "absolute", top: 4, right: 4 }}
                    onClick={() => setForm({ ...form, image_url: "" })}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingImg}
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    uploadCourseImage(e.target.files[0], "create")
                  }
                />
              )}
              {uploadingImg && (
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
            <div className="fg">
              <label>Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="What will members learn? Who is this for?"
              />
            </div>
            <div
              style={{
                background: "rgba(0,191,248,.08)",
                borderRadius: 10,
                padding: "10px 14px",
                marginTop: 4,
                marginBottom: 14,
                fontSize: 12,
                color: "#0369a1",
              }}
            >
              <FontAwesomeIcon icon={faCircleInfo} className="mr-1.5" />
              After creating, use the{" "}
              <FontAwesomeIcon icon={faClipboard} className="mx-1" /> button to
              build curriculum (sections & lessons)
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={async () => {
                  if (!form.title || !form.instructor) return;
                  setSaving(true);
                  try {
                    const created = await LearningAPI.createCourse({
                      ...form,
                      price: form.is_free ? 0 : Number(form.price),
                    });
                    setShowCreate(false);
                    setForm(emptyForm);
                    setMsg("✅ Course created! Now build curriculum.");
                    await fetchAll();
                    window.location.href = `/dashboard/learning/curriculum?courseId=${created.id}`;
                  } catch (e: any) {
                    setMsg("❌ " + e.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={
                  saving || uploadingImg || !form.title || !form.instructor
                }
              >
                {saving ? (
                  "Creating…"
                ) : (
                  <>
                    Create & Build Curriculum{" "}
                    <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
                  </>
                )}
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

      {/* ── EDIT COURSE MODAL ────────────────────────────────────────── */}
      {editingCourse && (
        <div
          className="overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setEditingCourse(null)
          }
        >
          <div className="modal modal-lg">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              Edit Course
            </h3>
            <div className="form-grid">
              <div className="fg" style={{ gridColumn: "1/-1" }}>
                <label>Title</label>
                <input
                  value={editingCourse.title || ""}
                  onChange={(e) =>
                    setEditingCourse({
                      ...editingCourse,
                      title: e.target.value,
                    })
                  }
                />
              </div>
              <div className="fg">
                <label>Instructor</label>
                <input
                  value={editingCourse.instructor || ""}
                  onChange={(e) =>
                    setEditingCourse({
                      ...editingCourse,
                      instructor: e.target.value,
                    })
                  }
                />
              </div>
              <div className="fg">
                <label>Category</label>
                <select
                  value={editingCourse.category || "Business"}
                  onChange={(e) =>
                    setEditingCourse({
                      ...editingCourse,
                      category: e.target.value,
                    })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label>Level</label>
                <select
                  value={editingCourse.level || "Beginner"}
                  onChange={(e) =>
                    setEditingCourse({
                      ...editingCourse,
                      level: e.target.value,
                    })
                  }
                >
                  {LEVELS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label>Duration</label>
                <input
                  value={editingCourse.duration || ""}
                  onChange={(e) =>
                    setEditingCourse({
                      ...editingCourse,
                      duration: e.target.value,
                    })
                  }
                />
              </div>
              <div className="fg">
                <label>Price (₹) — 0 for Free</label>
                <input
                  type="number"
                  value={editingCourse.price || 0}
                  onChange={(e) =>
                    setEditingCourse({
                      ...editingCourse,
                      price: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="fg">
              <label>Cover Image</label>
              {editingCourse.image_url ? (
                <div
                  style={{
                    position: "relative",
                    marginBottom: 8,
                    width: "fit-content",
                  }}
                >
                  <img
                    src={editingCourse.image_url}
                    alt="Course cover"
                    style={{
                      width: 160,
                      height: 90,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-g btn-xs"
                    style={{ position: "absolute", top: 4, right: 4 }}
                    onClick={() =>
                      setEditingCourse({ ...editingCourse, image_url: "" })
                    }
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingImg}
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    uploadCourseImage(e.target.files[0], "edit")
                  }
                />
              )}
              {uploadingImg && (
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
            <div className="fg">
              <label>Description</label>
              <textarea
                rows={3}
                value={editingCourse.description || ""}
                onChange={(e) =>
                  setEditingCourse({
                    ...editingCourse,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await LearningAPI.updateCourse(
                      editingCourse.id,
                      editingCourse,
                    );
                    setEditingCourse(null);
                    setMsg("✅ Updated!");
                    fetchAll();
                  } catch (e: any) {
                    setMsg("❌ " + e.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving || uploadingImg}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() => setEditingCourse(null)}
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
