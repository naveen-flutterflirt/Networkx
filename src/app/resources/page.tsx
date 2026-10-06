import type { Metadata } from "next";
import Link from "next/link";
import InsightCard from "@/app/components/InsightCard";
import Header from "@/app/components/shared/Header";
import Footer from "@/app/components/shared/Footer";
import { insights } from "@/app/data/insights";

export const metadata: Metadata = {
  title: "Insights for Smarter Networking and Business Growth | NetworkX",
  description:
    "Explore practical perspectives on AI, networking, global opportunities, partnerships and business growth.",
  alternates: { canonical: "/resources" },
};

export default function InsightsIndexPage() {
  const categories = Array.from(
    new Set(insights.map((insight) => insight.category)),
  );
  return (
    <main className="insights-page">
      <Header />
      <section className="insights-index-hero">
        <div className="insights-index-eyebrow">Insights &amp; Ideas</div>
        <h1>
          Insights for Smarter Networking
          <br />
          and <span>Business Growth</span>
        </h1>
        <p>
          Explore practical perspectives on AI, networking, global
          opportunities, partnerships and business growth.
        </p>
        <div className="insights-categories" aria-label="Insight categories">
          {categories.map((category) => (
            <span key={category}>{category}</span>
          ))}
        </div>
      </section>
      <section
        className="insights-index-grid"
        aria-label="All NetworkX insights"
      >
        {insights.map((insight) => (
          <InsightCard insight={insight} key={insight.slug} />
        ))}
      </section>
      <section className="insights-index-cta">
        <div>
          <span>Learn. Build. Evolve.</span>
          <h2>Turn better ideas into better connections.</h2>
        </div>
        <Link href="/pricing">Join NetworkX →</Link>
      </section>
      <Footer />
    </main>
  );
}
