"use client";
// "Link Company" autocomplete — typing a name either finds an existing
// company card or offers "+ Create Company", avoiding duplicate records.
import { useState, useEffect, useRef } from "react";
import { CompaniesAPI } from "@/lib/api";

interface Props {
  value: string; // company_id
  currentName?: string; // pre-seed display (e.g. existing profile.company)
  onChange: (companyId: string, company: any) => void;
  label?: string;
  placeholder?: string;
}

export default function CompanyPicker({
  value,
  currentName,
  onChange,
  label,
  placeholder,
}: Props) {
  const [query, setQuery] = useState(currentName || "");
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<any | null>(
    currentName ? { id: value, name: currentName } : null,
  );
  const [err, setErr] = useState("");
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
    if (query.length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(timer.current);
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await CompaniesAPI.search({ q: query, limit: 8 });
        setResults(res.items || res || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query]);

  const pick = (company: any) => {
    setSelected(company);
    setQuery(company.name);
    setOpen(false);
    setErr("");
    onChange(company.id, company);
  };

  const createAndPick = async () => {
    const name = query.trim();
    if (!name) return;
    setCreating(true);
    setErr("");
    try {
      const company = await CompaniesAPI.create({ name });
      pick(company);
    } catch (e: any) {
      // Backend blocks exact-name duplicates — surface that as "use the match instead"
      setErr(e.message || "Could not create company");
    } finally {
      setCreating(false);
    }
  };

  const clear = () => {
    setSelected(null);
    setQuery("");
    setResults([]);
    setErr("");
    onChange("", null);
  };

  const exactMatch = results.some(
    (r) => r.name.toLowerCase() === query.trim().toLowerCase(),
  );

  return (
    <div className="fg" ref={ref} style={{ position: "relative" }}>
      {label && <label>{label}</label>}
      <div style={{ position: "relative" }}>
        <input
          value={selected ? selected.name : query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (selected) setSelected(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || "Search for your company…"}
        />
        {(selected || query) && (
          <button
            onClick={clear}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {selected && (
        <div
          style={{
            marginTop: 4,
            padding: "6px 10px",
            background: "rgba(39,216,109,.1)",
            borderRadius: 8,
            border: "1px solid rgba(39,216,109,.3)",
            fontSize: 12,
            color: "#7be3a4",
          }}
        >
          🏢 Linked to <strong>{selected.name}</strong>
          {selected.member_count
            ? ` · ${selected.member_count} member${selected.member_count === 1 ? "" : "s"}`
            : ""}
        </div>
      )}
      {err && (
        <div style={{ marginTop: 4, fontSize: 12, color: "#ff9d9d" }}>
          {err}
        </div>
      )}

      {open && !selected && query.length >= 2 && (
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
          }}
        >
          {loading && (
            <div
              style={{
                padding: "12px 14px",
                fontSize: 13,
                color: "var(--nx-muted)",
              }}
            >
              Searching…
            </div>
          )}
          {!loading &&
            results.map((c) => (
              <div
                key={c.id}
                onClick={() => pick(c)}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--nx-line)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,.04)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    🏢 {c.name}
                  </div>
                  {c.industry && (
                    <div style={{ fontSize: 11, color: "var(--nx-muted)" }}>
                      {c.industry}
                      {c.city ? ` · ${c.city}` : ""}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 10, color: "var(--nx-muted)" }}>
                  {c.member_count || 0} member{c.member_count === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          {!loading && !exactMatch && (
            <div
              onClick={createAndPick}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: 13,
                color: "var(--nx-orange)",
                fontWeight: 600,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,.04)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {creating ? "Creating…" : `+ Create "${query.trim()}"`}
            </div>
          )}
          {!loading && results.length === 0 && exactMatch && (
            <div
              style={{
                padding: "8px 14px",
                fontSize: 11,
                color: "var(--nx-muted)",
              }}
            >
              Select the match above
            </div>
          )}
        </div>
      )}
    </div>
  );
}
