"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const storyPages = [
  [
    {
      group: "Tech Innovators",
      icon: "people",
      tone: "blue",
      quote:
        "NetworkX helped me connect with founders and investors who truly believe in our vision.",
      name: "Arjun Mehta",
      role: "Co-founder, Finwise",
      photo: "/images/community/arjun-mehta.png",
    },
    {
      group: "Entrepreneurs Hub",
      icon: "briefcase",
      tone: "orange",
      quote:
        "The best community for entrepreneurs. The learning, support and opportunities are unmatched.",
      name: "Neha Iyer",
      role: "Product Leader",
      photo: "/images/community/neha-iyer.png",
    },
    {
      group: "Global Leaders",
      icon: "globe",
      tone: "green",
      quote:
        "A global network with local impact. Proud to be part of such a meaningful platform.",
      name: "Michael Chen",
      role: "CEO, BuildGrid",
      photo: "/images/community/michael-chen.png",
    },
  ],
  [
    {
      group: "Women in Business",
      icon: "people",
      tone: "blue",
      quote:
        "The introductions are thoughtful, relevant and built around shared ambition—not just contact lists.",
      name: "Priya Shah",
      role: "Founder, Northstar Labs",
      photo: "/images/community/priya-shah.jpg",
    },
    {
      group: "Growth Collective",
      icon: "briefcase",
      tone: "orange",
      quote:
        "NetworkX turned one trusted conversation into a partnership that opened an entirely new market.",
      name: "Daniel Roberts",
      role: "Growth Director, Altura",
      photo: "/images/community/daniel-roberts.jpg",
    },
    {
      group: "Future Builders",
      icon: "globe",
      tone: "green",
      quote:
        "I found collaborators across cities who shared our values and moved from ideas to action quickly.",
      name: "Omar Khan",
      role: "Managing Partner, Vertex",
      photo: "/images/community/omar-khan.jpg",
    },
  ],
];

export default function StoriesCarousel() {
  const [page, setPage] = useState(0);
  const [mobile, setMobile] = useState(false);
  const touchStart = useRef<number | null>(null);
  const allStories = useMemo(() => storyPages.flat(), []);
  const pageCount = mobile ? allStories.length : storyPages.length;
  const visibleStories = mobile ? [allStories[page]] : storyPages[page];
  const showPage = (nextPage: number) =>
    setPage((nextPage + pageCount) % pageCount);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const sync = () => {
      setMobile(query.matches);
      setPage(0);
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return (
    <div
      className="story-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="NetworkX member stories"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") showPage(page - 1);
        if (event.key === "ArrowRight") showPage(page + 1);
      }}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const distance =
          (event.changedTouches[0]?.clientX ?? touchStart.current) -
          touchStart.current;
        if (Math.abs(distance) > 45) showPage(page + (distance < 0 ? 1 : -1));
        touchStart.current = null;
      }}
    >
      <div className="story-grid" aria-live="polite">
        {visibleStories.map((story) => (
          <article
            className={`story-card ${story.tone}`}
            key={`${page}-${story.name}`}
          >
            <span className={`story-tag ${story.tone}`}>
              <i className={`story-tag-icon ${story.icon}`} aria-hidden="true">
                <b />
              </i>
              {story.group}
            </span>
            <blockquote>
              <b>“</b>
              <span>{story.quote}</span>
            </blockquote>
            <div className="person">
              <img
                src={story.photo}
                alt={`Portrait of ${story.name}`}
                width={480}
                height={480}
              />
              <span>
                <strong>{story.name}</strong>
                <small>{story.role}</small>
              </span>
            </div>
          </article>
        ))}
      </div>
      <div className="story-controls">
        <button
          className="story-arrow"
          type="button"
          onClick={() => showPage(page - 1)}
          aria-label="Show previous member stories"
        >
          ←
        </button>
        <div className="story-dots" aria-label="Choose testimonial page">
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              className={index === page ? "active" : ""}
              onClick={() => showPage(index)}
              aria-label={`Show member stories page ${index + 1}`}
              aria-current={index === page ? "true" : undefined}
            />
          ))}
        </div>
        <button
          className="story-arrow"
          type="button"
          onClick={() => showPage(page + 1)}
          aria-label="Show next member stories"
        >
          →
        </button>
      </div>
    </div>
  );
}
