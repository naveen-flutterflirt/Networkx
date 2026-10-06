import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/app/components/shared/Header";
import Footer from "@/app/components/shared/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faGlobe,
  faLocationDot,
  faQuoteLeft,
} from "@fortawesome/free-solid-svg-icons";

export const metadata: Metadata = {
  title: "About Us & Team | NetworkX",
  description:
    "Meet the global founders and international team building NetworkX.",
};

const founders = [
  {
    name: "Jordan Miles",
    role: "Co-founder & Chief Executive Officer",
    location: "New York, USA",
    region: "AMERICAS",
    image:
      "https://images.pexels.com/photos/5060563/pexels-photo-5060563.jpeg?auto=compress&cs=tinysrgb&w=1200",
    focus: "Business strategy, community growth and global partnerships.",
  },
  {
    name: "Maya Thompson",
    role: "Co-founder & Chief Community Officer",
    location: "Austin, USA",
    region: "AMERICAS",
    image:
      "https://images.pexels.com/photos/4872067/pexels-photo-4872067.jpeg?auto=compress&cs=tinysrgb&w=1200",
    focus: "Member experience, inclusive communities and founder success.",
  },
  {
    name: "Kenji Nakamura",
    role: "Co-founder & Chief Product Officer",
    location: "Singapore, Asia",
    region: "ASIA PACIFIC",
    image:
      "https://images.pexels.com/photos/8101728/pexels-photo-8101728.jpeg?auto=compress&cs=tinysrgb&w=1200",
    focus: "AI matchmaking, product innovation and trusted digital identity.",
  },
];

const SHOW_FOUNDING_TEAM = false;

const locations = [
  { flag: "🇺🇸", city: "New York", country: "USA", note: "Global headquarters" },
  {
    flag: "🇬🇧",
    city: "London",
    country: "United Kingdom",
    note: "Europe community",
  },
  {
    flag: "🇦🇪",
    city: "Dubai",
    country: "United Arab Emirates",
    note: "Middle East hub",
  },
  { flag: "🇦🇺", city: "Sydney", country: "Australia", note: "Oceania network" },
  {
    flag: "🇮🇳",
    city: "Mumbai",
    country: "India",
    note: "South Asia community",
  },
  {
    flag: "🇸🇬",
    city: "Singapore",
    country: "Singapore",
    note: "Asia Pacific hub",
  },
  {
    flag: "🇨🇦",
    city: "Toronto",
    country: "Canada",
    note: "North America network",
  },
  {
    flag: "🇩🇪",
    city: "Berlin",
    country: "Germany",
    note: "Continental Europe",
  },
  {
    flag: "🇿🇦",
    city: "Cape Town",
    country: "South Africa",
    note: "Africa community",
  },
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <Header />

      <section className="about-hero">
        <div className="about-hero-copy">
          <div className="about-kicker">ABOUT NETWORKX</div>
          <h1>
            Born global.
            <br />
            Built <em>human.</em>
          </h1>
          <p>
            NetworkX is building the world&apos;s most trusted online business
            network—where ambitious people meet the right collaborators,
            opportunities and communities, wherever they are.
          </p>
          <div className="about-hero-actions">
            {SHOW_FOUNDING_TEAM && (
              <a className="button" href="#team">
                Meet our founders <FontAwesomeIcon icon={faArrowRight} />
              </a>
            )}
            <Link className="button" href="/#community">
              Explore the community
            </Link>
          </div>
          <div className="about-proof">
            <strong>9</strong>
            <span>international hubs</span>
            <i />
            <strong>5</strong>
            <span>continents connected</span>
          </div>
        </div>
        <div className="about-hero-photo">
          <img
            src="https://images.pexels.com/photos/36765727/pexels-photo-36765727/free-photo-of-diverse-business-team-in-modern-office.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="International business team collaborating in a modern office"
          />
          <div className="about-photo-caption">
            <FontAwesomeIcon icon={faGlobe} />
            <span>
              <b>One network. Many perspectives.</b>Connecting founders and
              professionals across borders.
            </span>
          </div>
        </div>
      </section>

      <section className="about-story">
        <div>
          <div className="about-kicker">WHY WE EXIST</div>
          <h2>Business grows faster when the right people find each other.</h2>
        </div>
        <div className="about-story-copy">
          <p>
            Traditional networking is often limited by geography, closed circles
            and chance encounters. NetworkX removes those barriers with
            intelligent discovery and communities designed around real business
            intent.
          </p>
          <p>
            We combine technology with human trust—so every introduction has
            context, every community has purpose, and every member has a genuine
            opportunity to contribute.
          </p>
        </div>
      </section>

      {SHOW_FOUNDING_TEAM && (
        <section className="founders-section" id="team">
          <div className="section-heading about-centered">
            <div className="about-kicker">FOUNDING TEAM</div>
            <h2>
              Global experience.
              <br />
              One shared ambition.
            </h2>
            <p>
              Three founders from two continents, united by the belief that
              better relationships build better businesses.
            </p>
          </div>
          <div className="founders-grid">
            {founders.map((founder) => (
              <article className="founder-card" key={founder.name}>
                <div className="founder-photo">
                  <img
                    src={founder.image}
                    alt={`${founder.name}, ${founder.role}`}
                    loading="lazy"
                  />
                  <span>{founder.region}</span>
                </div>
                <div className="founder-info">
                  <h3>{founder.name}</h3>
                  <strong>{founder.role}</strong>
                  <div className="founder-location">
                    <FontAwesomeIcon icon={faLocationDot} />
                    {founder.location}
                  </div>
                  <p>{founder.focus}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="global-section">
        <div className="global-intro">
          <div className="about-kicker">OUR GLOBAL NETWORK</div>
          <h2>
            Local communities.
            <br />
            <em>Worldwide momentum.</em>
          </h2>
          <p>
            Our teams and community leaders bring local market knowledge to a
            network designed for borderless collaboration.
          </p>
        </div>
        <div className="locations-grid">
          {locations.map((location) => (
            <article className="location-card" key={location.country}>
              <span className="location-flag">{location.flag}</span>
              <div>
                <h3>{location.city}</h3>
                <strong>{location.country}</strong>
                <p>{location.note}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-values">
        <div className="about-values-quote">
          <FontAwesomeIcon icon={faQuoteLeft} />
          <blockquote>
            We are not building another directory of contacts. We are building a
            place where every connection has the potential to move someone
            forward.
          </blockquote>
          <span>— The NetworkX Founding Team</span>
        </div>
        <div className="values-list">
          <article>
            <span>01</span>
            <h3>Human first</h3>
            <p>
              Technology should make relationships more meaningful, not more
              transactional.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Trust by design</h3>
            <p>
              Strong communities grow through relevance, accountability and
              shared value.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Globally minded</h3>
            <p>
              Great opportunities should travel freely across cities, cultures
              and industries.
            </p>
          </article>
        </div>
      </section>

      <section className="pricing-cta about-cta">
        <div>
          <span>READY TO BUILD WHAT&apos;S NEXT?</span>
          <h2>
            Your next breakthrough
            <br />
            could start with one connection.
          </h2>
        </div>
        <Link className="button" href="/pricing">
          Join NetworkX <FontAwesomeIcon icon={faArrowRight} />
        </Link>
      </section>

      <Footer />
    </main>
  );
}
