"use client";
import { useState, useEffect } from "react";
import Header from "@/app/components/shared/Header";
import Footer from "@/app/components/shared/Footer";
import { BlogAPI } from "@/lib/api";

export default function BlogListPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    BlogAPI.publicList({ page_size: 30 })
      .then(({ items }: any) => setPosts(items || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: "var(--night, #020a16)", minHeight: "100vh" }}>
      <Header />
      <div
        style={{ padding: "130px 20px 80px", maxWidth: 1100, margin: "0 auto" }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: "var(--orange, #ff4b0a)",
            marginBottom: 12,
          }}
        >
          NetworkX Blog
        </div>
        <h1
          style={{
            fontSize: "clamp(28px,4vw,42px)",
            color: "var(--ink, #f7f9fc)",
            marginBottom: 40,
            letterSpacing: -0.5,
          }}
        >
          Insights &amp; stories from the NetworkX community
        </h1>

        {loading ? (
          <div style={{ color: "var(--muted, #98a8bc)", fontSize: 13 }}>
            Loading…
          </div>
        ) : posts.length === 0 ? (
          <div style={{ color: "var(--muted, #98a8bc)", fontSize: 13 }}>
            No posts yet — check back soon.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            {posts.map((p) => (
              <a
                key={p.id}
                href={p.public_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                  background: "var(--panel, #071728)",
                  border: "1px solid var(--line, rgba(112,153,198,.17))",
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                {p.cover_image_url && (
                  <img
                    src={p.cover_image_url}
                    alt={p.title}
                    style={{
                      width: "100%",
                      height: 170,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                )}
                <div style={{ padding: 20 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--ink, #f7f9fc)",
                      marginBottom: 8,
                    }}
                  >
                    {p.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--muted, #98a8bc)",
                      lineHeight: 1.6,
                    }}
                  >
                    {p.excerpt}
                  </div>
                  {p.published_at && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--muted, #98a8bc)",
                        marginTop: 12,
                      }}
                    >
                      {new Date(p.published_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
