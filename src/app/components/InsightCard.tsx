import Image from "next/image";
import Link from "next/link";
import type { Insight } from "@/app/data/insights";

const categoryClass: Record<string, string> = {
  "AI & Technology": "ai",
  Networking: "networking",
  "Global Growth": "global",
  "Global Networking": "global",
  "Business Growth": "growth",
};

export default function InsightCard({ insight }: { insight: Insight }) {
  return (
    <article className="insight-card">
      <Link
        className="insight-card-image"
        href={`/resources/${insight.slug}`}
        aria-label={`Read ${insight.title}`}
      >
        <Image
          src={insight.cover}
          alt={`${insight.title} cover illustration`}
          fill
          sizes="(max-width: 640px) 88vw, (max-width: 1024px) 48vw, 390px"
        />
      </Link>
      <div className="insight-card-body">
        <span
          className={`insight-category ${categoryClass[insight.category] ?? "ai"}`}
        >
          <i aria-hidden="true" />
          {insight.category}
        </span>
        <h3>
          <Link href={`/resources/${insight.slug}`}>{insight.title}</Link>
        </h3>
        <p>{insight.excerpt}</p>
      </div>
      <footer>
        <span className="insight-time">
          <i aria-hidden="true" />
          {insight.readingTime}
        </span>
        <Link href={`/resources/${insight.slug}`}>
          Read Article <b aria-hidden="true">→</b>
        </Link>
      </footer>
    </article>
  );
}
