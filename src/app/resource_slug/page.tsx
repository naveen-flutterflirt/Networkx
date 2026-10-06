"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import InsightCard from "@/app/components/InsightCard";
import InsightsHeader from "@/app/components/InsightsHeader";
import Header from "@/app/components/shared/Header";
import Footer from "@/app/components/shared/Footer";
import { insightContent } from "@/app/data/insight-content";
import { getInsight, insights } from "@/app/data/insights";
// Direct import rather than relying on resources/layout.tsx's own import
// to cascade down to this nested route — explicit here so this page's
// styling doesn't depend on that inheritance actually happening.
import "../home-insights-section.css";
import "./insights.css";

const siteUrl = "https://www.networkxcircle.com";

// Real, single destination file for Firebase's { "source": "/resources/**",
// "destination": "/resources/article/index.html" } rewrite. A rewrite MUST
// point at a file that genuinely exists (confirmed directly against
// Firebase's own docs) — this route (no [slug] segment, so no
// generateStaticParams needed) IS that one real file, existing at
// out/resources/article/index.html after build, regardless of how many
// articles exist or get added later without a rebuild.
//
// How the slug is recovered: Firebase serving this file's CONTENT does
// NOT change the browser's address bar — per Firebase's own docs, "the
// browser returns the actual content of the specified destination file
// instead of an HTTP redirect." So usePathname() below still correctly
// reads whatever the visitor actually typed/clicked
// (/resources/right-business-connections-matter-more), even though
// Firebase is physically serving THIS file's content for it.
//
// Real tradeoff, explicitly accepted: this can't produce distinct
// per-article <title>/meta/OG tags the way the old generateMetadata()
// server version could — those need real server rendering per URL,
// which static export + this one-shell-for-everything approach doesn't
// have. document.title is still updated client-side below as a partial
// mitigation (helps the browser tab for real visitors), but that won't
// reach search crawlers or social-media link unfurling the way real
// per-page <head> tags would.
export default function InsightArticleShell() {
  const pathname = usePathname();
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    // trailingSlash:true means this can arrive as ".../slug/" — strip
    // it, then take the last real segment as the slug.
    const clean = (pathname || "").replace(/\/+$/, "");
    const parts = clean.split("/").filter(Boolean);
    setSlug(parts[parts.length - 1] || null);
  }, [pathname]);

  const insight:
    { title: string; seoTitle?: string; [key: string]: any } | undefined = slug
    ? getInsight(slug)
    : undefined;
  const content = slug ? insightContent[slug] : undefined;

  useEffect(() => {
    if (insight) document.title = insight.seoTitle || insight.title;
  }, [insight]);

  // Still loading the real pathname on first client render — avoid a
  // flash of "not found" before usePathname() has resolved.
  if (slug === null) {
    return (
      <main className="insights-page insight-article-page">
        <InsightsHeader />
        <div style={{ padding: "120px 24px", textAlign: "center" }}>
          Loading…
        </div>
        <Footer />
      </main>
    );
  }

  if (!insight || !content) {
    return (
      <main className="insights-page insight-article-page">
        <InsightsHeader />
        <div style={{ padding: "120px 24px", textAlign: "center" }}>
          <h1>Article not found</h1>
          <p>
            We couldn't find that resource.{" "}
            <Link href="/resources">Browse all resources →</Link>
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  const related = insights.filter((item) => item.slug !== slug).slice(0, 3);
  const canonical = `${siteUrl}/resources/${insight.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: insight.h1,
    description: insight.metaDescription,
    image: `${siteUrl}${insight.ogImage}`,
    author: { "@type": "Organization", name: "NetworkX" },
    publisher: {
      "@type": "Organization",
      name: "NetworkX",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/brand/networkx-logo-header.png`,
      },
    },
    mainEntityOfPage: canonical,
  };

  return (
    <main className="insights-page insight-article-page">
      <InsightsHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <article className="insight-article">
        <nav className="insight-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/resources">Resources</Link>
          <span>/</span>
          <b>{insight.category}</b>
        </nav>
        <header className="insight-article-header">
          <span className="insight-article-category">{insight.category}</span>
          <h1>{insight.h1}</h1>
          <p>{insight.excerpt}</p>
          <div>
            <span>By NetworkX</span>
            <i /> <span>{insight.readingTime}</span>
          </div>
        </header>
        <div className="insight-article-cover">
          <Image
            src={insight.cover}
            alt={`${insight.title} cover illustration`}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 1080px"
          />
        </div>
        <div className="insight-article-body">
          {content.map((section, index) => (
            <section key={`${section.heading ?? "introduction"}-${index}`}>
              {section.heading && <h2>{section.heading}</h2>}
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.list && (
                <ul>
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {section.emphasis && <blockquote>{section.emphasis}</blockquote>}
            </section>
          ))}
          <nav
            className="insight-topic-links"
            aria-label="Explore NetworkX features"
          >
            <span>Explore related NetworkX experiences</span>
            <div>
              <Link href="/#solutions">AI matchmaking</Link>
              <Link href="/#global-community">Global community</Link>
              <Link href="/#membership">Memberships</Link>
            </div>
          </nav>
          <aside className="insight-inline-cta">
            <span>Explore NetworkX</span>
            <h2>
              Build smarter connections and discover relevant opportunities.
            </h2>
            <Link href="/#membership">Explore Memberships →</Link>
          </aside>
        </div>
      </article>
      <section className="related-insights">
        <header>
          <span>Keep exploring</span>
          <h2>Related resources</h2>
        </header>
        <div>
          {related.map((item) => (
            <InsightCard insight={item} key={item.slug} />
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
