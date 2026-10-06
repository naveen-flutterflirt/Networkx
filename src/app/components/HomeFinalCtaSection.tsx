import Link from "next/link";

const finalCtaBenefits = [
  { title: "Global Community", tone: "blue" },
  { title: "AI-Powered Networking", tone: "cyan" },
  { title: "Regional Pricing", tone: "orange" },
  { title: "Annual Membership", tone: "violet" },
];

export default function HomeFinalCtaSection() {
  return (
    <section
      className="home-final-cta"
      id="join-networkx"
      aria-labelledby="home-final-cta-title"
    >


      <div className="home-final-cta-content">
        <div className="home-final-cta-eyebrow">
          <i />
          Your next move
          <i />
        </div>
        <h2 id="home-final-cta-title">
          <span className="home-final-cta-title-line">
            Your Next Opportunity
          </span>
          <span className="home-final-cta-title-line">
            Could Start With <em>One Connection.</em>
          </span>
        </h2>
        <p>
          Join a global business community built to help you discover
          <br className="home-final-cta-desktop-break" /> the right people,
          opportunities and resources to move forward.
        </p>

        <div className="home-final-cta-actions">
          <Link href="/pricing">
            <span>Join NetworkX</span>
            <i className="home-final-cta-arrow" aria-hidden="true" />
          </Link>
          <Link href="/pricing">
            <span>Explore Memberships</span>
            <i className="home-final-cta-arrow" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div
        className="home-final-cta-benefits"
        aria-label="NetworkX membership benefits"
      >
        {finalCtaBenefits.map((benefit) => (
          <article key={benefit.title}>
            <span
              className={`home-final-cta-benefit-icon ${benefit.tone}`}
              aria-hidden="true"
            >
              <i />
            </span>
            <strong>{benefit.title}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
