"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faUpload,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebook,
  faInstagram,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { SocialAutomationAPI } from "@/lib/api";

type PostType = "video" | "marketing";

const VIDEO_PLATFORMS = [
  { key: "facebook", label: "Facebook", icon: faFacebook, color: "#1877f2" },
  { key: "instagram", label: "Instagram", icon: faInstagram, color: "#e1306c" },
  { key: "youtube", label: "YouTube", icon: faYoutube, color: "#ff0000" },
] as const;

const MARKETING_PLATFORMS = [
  { key: "facebook", label: "Facebook", icon: faFacebook, color: "#1877f2" },
  { key: "instagram", label: "Instagram", icon: faInstagram, color: "#e1306c" },
  {
    key: "youtube_community",
    label: "YouTube Community (copy-paste)",
    icon: faYoutube,
    color: "#ff0000",
  },
] as const;

export default function NewSocialPostPage() {
  const router = useRouter();
  const [postType, setPostType] = useState<PostType>("video");

  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [tone, setTone] = useState("");
  const [generateThumbnail, setGenerateThumbnail] = useState(false);
  const [targets, setTargets] = useState<Record<string, boolean>>({
    facebook: true,
    instagram: true,
    youtube: true,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const platforms =
    postType === "marketing" ? MARKETING_PLATFORMS : VIDEO_PLATFORMS;

  // Switching type swaps which platform keys are even valid (e.g.
  // "youtube" -> "youtube_community") — reset to that type's defaults
  // rather than carrying over stale/invalid keys.
  useEffect(() => {
    setTargets(
      postType === "marketing"
        ? { facebook: true, instagram: true, youtube_community: false }
        : { facebook: true, instagram: true, youtube: true },
    );
  }, [postType]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (postType === "video" && !file) {
      setError("Choose a video file first");
      return;
    }
    if (postType === "marketing" && !notes.trim()) {
      setError("Describe what this post should be about first");
      return;
    }
    const selectedTargets = Object.keys(targets).filter((k) => targets[k]);
    if (selectedTargets.length === 0) {
      setError("Select at least one platform to generate content for");
      return;
    }
    setError("");
    setUploading(true);
    try {
      let draft;
      if (postType === "video") {
        const { upload_url, storage_path, content_type } =
          await SocialAutomationAPI.getVideoUploadUrl({
            filename: file!.name,
            content_type: file!.type || "video/mp4",
          });
        await fetch(upload_url, {
          method: "PUT",
          headers: { "Content-Type": content_type || file!.type },
          body: file,
        });
        draft = await SocialAutomationAPI.createDraft({
          post_type: "video",
          storage_path,
          filename: file!.name,
          content_type: content_type || file!.type,
          size_bytes: file!.size,
          source_notes: notes,
        });
      } else {
        draft = await SocialAutomationAPI.createDraft({
          post_type: "marketing",
          source_notes: notes,
          link_url: linkUrl.trim() || undefined,
        });
      }
      // Generate right away so the review page opens with content already
      // in place — if this fails (AI outage, etc.), the draft itself was
      // already created successfully, so still navigate there; the review
      // page's own Generate panel (shown whenever a draft has no content
      // yet) lets the admin retry without losing anything.
      try {
        await SocialAutomationAPI.generateContent(draft.id, {
          target_platforms: selectedTargets,
          tone: tone || undefined,
          generate_thumbnail: generateThumbnail,
        });
      } catch {
        /* handled by the review page's own Generate panel */
      }
      router.push(
        `/dashboard/super/social-automation/draft/?draftId=${draft.id}`,
      );
    } catch (e: any) {
      setError(e.message || "Could not create the draft");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page">
      <Link
        href="/dashboard/super/social-automation"
        style={{
          fontSize: 12,
          color: "var(--nx-muted)",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <FontAwesomeIcon icon={faArrowLeft} /> Back to Social Automation
      </Link>
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
        New Post
      </h2>
      <p style={{ fontSize: 13, color: "var(--nx-muted)", marginBottom: 18 }}>
        {postType === "video"
          ? "Upload the finished video, pick platforms and tone, then Continue generates the copy right away — no AI video generation happens here."
          : "Describe what to post about, pick platforms and tone, then Continue generates the caption and image right away. No video needed."}
      </p>

      {error && (
        <div
          style={{
            background: "rgba(255,90,90,.1)",
            border: "1px solid rgba(255,90,90,.3)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 14,
            color: "#ef4444",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div className="tab-bar" style={{ maxWidth: 520, marginBottom: 16 }}>
        <button
          type="button"
          className={`tab-btn${postType === "video" ? " active" : ""}`}
          onClick={() => setPostType("video")}
        >
          Video post
        </button>
        <button
          type="button"
          className={`tab-btn${postType === "marketing" ? " active" : ""}`}
          onClick={() => setPostType("marketing")}
        >
          Marketing post (image + link)
        </button>
      </div>

      <form
        onSubmit={submit}
        className="card"
        style={{ maxWidth: 520, padding: 24 }}
      >
        {postType === "video" ? (
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Video file *
            </label>
            <input
              required={postType === "video"}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && (
              <div
                style={{ fontSize: 12, color: "var(--nx-muted)", marginTop: 6 }}
              >
                {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Link (optional)
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://networkxcircle.com/pricing"
              style={{ width: "100%" }}
            />
            <div
              style={{ fontSize: 11, color: "var(--nx-muted)", marginTop: 4 }}
            >
              Included in the Facebook caption directly; Instagram doesn't
              support clickable links in captions, so it's referenced as "link
              in bio" there instead.
            </div>
          </div>
        )}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            {postType === "video"
              ? "Notes for the AI (context, key points, tone)"
              : "What should this post be about? *"}
          </label>
          <textarea
            required={postType === "marketing"}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder={
              postType === "video"
                ? "e.g. This is a highlight reel from our September chapter meetup — focus on the networking energy, mention it's open to all members."
                : "e.g. Announcing our new Dubai chapter launch — first meetup is October 12th, open to all members and prospective members."
            }
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Generate content for *
          </label>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {platforms.map((p) => (
              <label
                key={p.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                }}
              >
                <input
                  type="checkbox"
                  checked={!!targets[p.key]}
                  onChange={(e) =>
                    setTargets((t) => ({ ...t, [p.key]: e.target.checked }))
                  }
                />
                <FontAwesomeIcon icon={p.icon} style={{ color: p.color }} />{" "}
                {p.label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Tone (optional)
          </label>
          <input
            placeholder="e.g. energetic, professional, warm"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        {postType === "marketing" ? (
          <div
            style={{ fontSize: 12, color: "var(--nx-muted)", marginBottom: 20 }}
          >
            An image (OpenAI) is generated automatically for every marketing
            post — it's the post itself, not an optional thumbnail.
          </div>
        ) : (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            <input
              type="checkbox"
              checked={generateThumbnail}
              onChange={(e) => setGenerateThumbnail(e.target.checked)}
            />{" "}
            Generate a thumbnail (OpenAI) — used as the cover/thumbnail on
            Facebook, Instagram &amp; YouTube alike
          </label>
        )}

        <button
          type="submit"
          className="btn btn-p"
          disabled={uploading || (postType === "video" ? !file : !notes.trim())}
        >
          {uploading ? (
            postType === "video" ? (
              "Uploading & generating…"
            ) : (
              "Generating…"
            )
          ) : postType === "video" ? (
            <>
              <FontAwesomeIcon icon={faUpload} className="mr-1.5" />
              Upload &amp; Generate
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faWandMagicSparkles} className="mr-1.5" />
              Generate
            </>
          )}
        </button>
      </form>
    </div>
  );
}
