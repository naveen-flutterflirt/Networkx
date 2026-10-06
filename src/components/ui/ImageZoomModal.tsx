"use client";
// Click-to-enlarge lightbox. Pass a single image or an array for a
// left/right browsable gallery (Deal Corner's multi-photo offers).
import { useState, useEffect } from "react";

export default function ImageZoomModal({
  images,
  startIndex = 0,
  onClose,
}: {
  images: string[];
  startIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight")
        setIndex((i) => Math.min(images.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  if (!images.length) return null;

  return (
    <div
      className="overlay"
      style={{ background: "rgba(0,0,0,.88)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          position: "relative",
          maxWidth: "90vw",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: -40,
            right: 0,
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: 28,
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
        <img
          src={images[index]}
          alt=""
          style={{
            maxWidth: "90vw",
            maxHeight: "80vh",
            objectFit: "contain",
            borderRadius: 8,
            boxShadow: "0 20px 60px rgba(0,0,0,.6)",
          }}
        />
        {images.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              className="btn btn-g btn-sm"
              disabled={index === 0}
              onClick={() => setIndex((i) => i - 1)}
            >
              ← Prev
            </button>
            <span style={{ color: "#fff", fontSize: 13 }}>
              {index + 1} / {images.length}
            </span>
            <button
              className="btn btn-g btn-sm"
              disabled={index === images.length - 1}
              onClick={() => setIndex((i) => i + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
