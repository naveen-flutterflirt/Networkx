"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { ReactNode } from "react";

interface PageHeroStat {
  icon?: IconDefinition;
  value: string | number;
  label: string;
}

interface PageHeroProps {
  icon: IconDefinition;
  kicker: string;
  title: string;
  description: string;
  stats?: PageHeroStat[];
  search?: {
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
  };
  aside?: ReactNode;
}

// Generic premium-style header for member pages — icon box + kicker + title
// + description, with optional stat pills and a search bar. NOT used on
// the main dashboard (/dashboard), which keeps its own custom .dash-hero
// with the world-map graphic — this is for every other member page.
export default function PageHero({
  icon,
  kicker,
  title,
  description,
  stats,
  search,
  aside,
}: PageHeroProps) {
  return (
    <div className="page-hero">
      <div className="page-hero-left">
        <div className="page-hero-kicker">{kicker}</div>
        <div className="page-hero-title">
          <FontAwesomeIcon icon={icon} />
          <span>{title}</span>
        </div>
        <div className="page-hero-desc">{description}</div>
        {search && (
          <div className="page-hero-search">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <input
              placeholder={search.placeholder}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
            />
          </div>
        )}
        {stats && stats.length > 0 && (
          <div className="page-hero-stats">
            {stats.map((s, i) => (
              <div key={i} className="page-hero-stat">
                {s.icon && <FontAwesomeIcon icon={s.icon} />}
                <span>
                  <strong>{s.value}</strong> {s.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {aside || (
        <div className="page-hero-icon-box">
          <FontAwesomeIcon icon={icon} />
        </div>
      )}
    </div>
  );
}
