"use client";
// Tag-input chips (like GitHub topics), with autocomplete pulled from the
// shared tag library across the platform (see TagsAPI / backend
// modules/tags). Structured, not free text — the whole point of the gap
// this closes.
import { useState, useEffect, useRef } from "react";
import { TagsAPI } from "@/lib/api";

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  field: string; // scopes suggestions, e.g. 'can_help_with'
  placeholder?: string;
  label?: string;
  maxTags?: number;
  suggestedTags?: string[];
}

export default function TagInput({
  value,
  onChange,
  field,
  placeholder,
  label,
  maxTags = 15,
  suggestedTags = [],
}: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    { label: string; usage_count: number }[]
  >([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<any>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await TagsAPI.search({ q: query, field, limit: 8 });
        const items = (res.items || res || []) as {
          label: string;
          usage_count: number;
        }[];
        const library = suggestedTags
          .filter(
            (label) =>
              !query || label.toLowerCase().includes(query.toLowerCase()),
          )
          .map((label) => ({ label, usage_count: 0 }));
        const merged = [...library, ...items].filter(
          (item, index, all) =>
            all.findIndex(
              (other) => other.label.toLowerCase() === item.label.toLowerCase(),
            ) === index,
        );
        setSuggestions(
          merged
            .filter(
              (s) =>
                !value.some((v) => v.toLowerCase() === s.label.toLowerCase()),
            )
            .slice(0, 8),
        );
      } catch {
        setSuggestions(
          suggestedTags
            .filter(
              (label) =>
                (!query || label.toLowerCase().includes(query.toLowerCase())) &&
                !value.some((v) => v.toLowerCase() === label.toLowerCase()),
            )
            .slice(0, 8)
            .map((label) => ({ label, usage_count: 0 })),
        );
      }
    }, 250);
    return () => clearTimeout(timer.current);
  }, [query, field, suggestedTags.join("|"), value.join("|")]);

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (!t || value.length >= maxTags) return;
    if (value.some((v) => v.toLowerCase() === t.toLowerCase())) {
      setQuery("");
      return;
    }
    onChange([...value, t]);
    setQuery("");
    setSuggestions([]);
  };

  const removeTag = (tag: string) => onChange(value.filter((v) => v !== tag));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (query.trim()) addTag(query);
    } else if (e.key === "Backspace" && !query && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="fg" ref={ref} style={{ position: "relative" }}>
      {label && <label>{label}</label>}
      <div
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          padding: "7px 9px",
          border: "1px solid var(--nx-line)",
          borderRadius: 8,
          background: "var(--nx-panel2)",
          cursor: "text",
          minHeight: 38,
          alignItems: "center",
        }}
      >
        {value.map((tag) => (
          <span
            key={tag}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "2px 8px 2px 10px",
              borderRadius: 99,
              background: "rgba(255,75,10,.14)",
              border: "1px solid rgba(255,75,10,.3)",
              color: "#ff9a6e",
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {tag}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#ff9a6e",
                cursor: "pointer",
                fontSize: 13,
                lineHeight: 1,
                padding: 0,
              }}
              aria-label={`Remove ${tag}`}
            >
              ✕
            </button>
          </span>
        ))}
        {value.length < maxTags && (
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={
              value.length === 0 ? placeholder || "Type to add a tag…" : ""
            }
            style={{
              flex: 1,
              minWidth: 90,
              border: "none",
              background: "transparent",
              padding: "2px 4px",
            }}
          />
        )}
      </div>

      {open && (query.length > 0 || suggestions.length > 0) && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--nx-panel)",
            border: "1px solid var(--nx-line)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,.35)",
            zIndex: 999,
            marginTop: 4,
            overflow: "hidden",
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {suggestions.map((s) => (
            <div
              key={s.label}
              onClick={() => addTag(s.label)}
              style={{
                padding: "9px 12px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 13,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,.04)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span>🏷️ {s.label}</span>
              <span style={{ fontSize: 10, color: "var(--nx-muted)" }}>
                {s.usage_count} member{s.usage_count === 1 ? "" : "s"}
              </span>
            </div>
          ))}
          {query.trim() &&
            !suggestions.some(
              (s) => s.label.toLowerCase() === query.trim().toLowerCase(),
            ) && (
              <div
                onClick={() => addTag(query)}
                style={{
                  padding: "9px 12px",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "var(--nx-orange)",
                  borderTop: suggestions.length
                    ? "1px solid var(--nx-line)"
                    : "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,.04)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                + Add "{query.trim()}"
              </div>
            )}
        </div>
      )}
    </div>
  );
}
