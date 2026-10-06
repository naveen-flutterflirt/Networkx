"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import InsightCard from "@/app/components/InsightCard";
import { insights } from "@/app/data/insights";

export default function HomeInsightsSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canBack, setCanBack] = useState(false);
  const [canForward, setCanForward] = useState(true);

  const syncControls = () => {
    const track = trackRef.current;
    if (!track) return;
    setCanBack(track.scrollLeft > 8);
    setCanForward(track.scrollLeft + track.clientWidth < track.scrollWidth - 8);
  };

  useEffect(() => {
    syncControls();
    const handleResize = () => syncControls();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const move = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(".insight-card");
    track.scrollLeft +=
      direction * ((card?.offsetWidth ?? track.clientWidth) + 24);
  };

  return (
    <section
      className="home-insights"
      id="insights"
      aria-labelledby="home-insights-title"
    >
      <header className="home-insights-header">
        <div className="home-insights-eyebrow">
          <i />
          Insights &amp; Ideas
          <i />
        </div>
        <h2 id="home-insights-title">
          Ideas to Help You Network
          <br />
          Smarter and <span>Grow Faster</span>
        </h2>
        <p>
          Practical insights on networking, AI, business growth,
          <br /> opportunities, leadership and global collaboration.
        </p>
      </header>

      <div className="home-insights-carousel">
        <button
          className="insight-arrow previous"
          type="button"
          aria-label="Show previous insights"
          disabled={!canBack}
          onClick={() => move(-1)}
        >
          ‹
        </button>
        <div
          className="insights-track"
          ref={trackRef}
          tabIndex={0}
          onScroll={syncControls}
          aria-label="NetworkX insights carousel"
        >
          {insights.map((insight) => (
            <InsightCard insight={insight} key={insight.slug} />
          ))}
        </div>
        <button
          className="insight-arrow next"
          type="button"
          aria-label="Show next insights"
          disabled={!canForward}
          onClick={() => move(1)}
        >
          ›
        </button>
      </div>

      <div className="insights-progress" aria-hidden="true">
        <i className={!canBack ? "active" : ""} />
        <i className={canBack && canForward ? "active" : ""} />
        <i className={!canForward ? "active" : ""} />
      </div>

      <aside className="insights-cta-bar">
        <span className="insights-cta-icon" aria-hidden="true">
          ▤
        </span>
        <div>
          <h3>Stay Ahead with Insights That Inspire Growth</h3>
          <p>
            Explore strategies, stories and expert perspectives from the
            NetworkX community.
          </p>
        </div>
        <Link href="/resources">
          Explore All Insights <span>→</span>
        </Link>
      </aside>
    </section>
  );
}
