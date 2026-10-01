import type { CSSProperties } from "react";

const assetRoot = "/images/section-5-online";

const topRoles = [
  { label: "Professionals", icon: "icon-professionals.svg", tone: "orange" },
  { label: "Entrepreneurs", icon: "icon-entrepreneurs.svg", tone: "blue" },
  { label: "Business Owners", icon: "icon-business-owners.svg", tone: "green" },
  { label: "Mentors", icon: "icon-mentors.svg", tone: "purple" },
  { label: "Investors", icon: "icon-investors.svg", tone: "gold" },
  { label: "Industry Experts", icon: "icon-industry-experts.svg", tone: "cyan" },
];

const bottomPillars = [
  {
    title: "Diverse by Design",
    copy: "Different industries, markets and professional backgrounds.",
    icon: "icon-diverse.svg",
    tone: "blue",
  },
  {
    title: "Business-First Community",
    copy: "Built around meaningful professional relationships and opportunities.",
    icon: "icon-business-first.svg",
    tone: "orange",
  },
  {
    title: "Global Reach. Local Relevance.",
    copy: "Connect globally while discovering people relevant to your city, industry and goals.",
    icon: "icon-global-reach.svg",
    tone: "green",
  },
];

export default function Section5OnlineBusinessCommunity() {
  return (
    <section className="s5-community" id="community" aria-labelledby="s5-community-title">
      <div className="s5-community-inner">
        <div className="s5-community-top">
          <div className="s5-community-intro">
            <div className="s5-community-eyebrow"><i />A global business community<i /></div>
            <h2 id="s5-community-title">
              Built Across Countries.<br />
              Connected Across Industries.<br />
              <span>United by Growth.</span>
            </h2>
            <p>NetworkX brings professionals, entrepreneurs, business owners, mentors, investors and industry experts together in one trusted online business ecosystem.</p>
          </div>

          <div className="s5-role-wrap">
            <div className="s5-role-caption"><i />Who NetworkX is for<i /></div>
            <div className="s5-role-grid" aria-label="Who NetworkX is for">
              {topRoles.map((role) => (
                <article className={`s5-role s5-tone-${role.tone}`} key={role.label}>
                  <span
                    className="s5-role-icon"
                    aria-hidden="true"
                    style={{ "--s5-role-icon": `url(${assetRoot}/${role.icon})` } as CSSProperties}
                  >
                    <i />
                  </span>
                  <h3>{role.label}</h3>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="s5-mosaic-reference-wrap" aria-label="A diverse global NetworkX business community">
          <img
            className="s5-mosaic-reference"
            src={`${assetRoot}/section5-mosaic-reference.png`}
            alt="NetworkX professionals from diverse countries and industries in one online business community"
          />
          <div className="s5-mosaic-metric s5-metric-countries">
            <img src={`${assetRoot}/icon-industry-experts.svg`} alt="" /><strong>9+</strong><b>Countries</b><span>Growing international presence</span>
          </div>
          <div className="s5-mosaic-metric s5-metric-industries">
            <img src={`${assetRoot}/icon-business-owners.svg`} alt="" /><strong>59+</strong><b>Industry Verticals</b><span>Businesses across diverse sectors</span>
          </div>
          <div className="s5-mosaic-metric s5-metric-local">
            <img src={`${assetRoot}/icon-global-reach.svg`} alt="" /><strong>Global + Local</strong><span>Relevant connections wherever you operate</span>
          </div>
          <div className="s5-mosaic-metric s5-metric-community">
            <img src={`${assetRoot}/icon-community.svg`} alt="" /><strong>One Online Business Community</strong><span>Professionals · Entrepreneurs · Business Owners<br />Mentors · Investors · Industry Experts</span>
          </div>
        </div>

        <div className="s5-pillar-strip">
          {bottomPillars.map((pillar) => (
            <article key={pillar.title} className={`s5-tone-${pillar.tone}`} style={{ "--s5-pillar-icon": `url(${assetRoot}/${pillar.icon})` } as CSSProperties}>
              <span aria-hidden="true"><i /></span>
              <div><h3>{pillar.title}</h3><p>{pillar.copy}</p></div>
            </article>
          ))}
        </div>

        <div className="s5-community-closing">
          <i /><span aria-hidden="true"><img src={`${assetRoot}/icon-community.svg`} alt="" /></span>
          <strong>Real People. Diverse Businesses. Shared Ambition. <em>One NetworkX.</em></strong><i />
        </div>
      </div>
    </section>
  );
}
