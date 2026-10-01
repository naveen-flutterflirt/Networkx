import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Header from "@/app/components/shared/Header";
import Footer from "@/app/components/shared/Footer";
import { faArrowRight, faBell, faBolt, faBrain, faChartLine, faGrip, faLocationDot, faMobileScreenButton, faPlaneDeparture, faRobot, faShieldHalved, faTags, faUser, faUserGroup, faUsers, faUserTie, faVault, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import NewsletterForm from "@/app/components/NewsletterForm";
import HomeFaqSection from "@/app/components/HomeFaqSection";
import HomeInsightsSection from "@/app/components/HomeInsightsSection";
import HomeFinalCtaSection from "@/app/components/HomeFinalCtaSection";
import Section5OnlineBusinessCommunity from "@/app/components/Section5OnlineBusinessCommunity";
import "./intelligent-section.css";
import "./growth-intelligence.css";
import "./mobile-network-section.css";
import "./section5-online-business-community.css";
import "./home-impact.css";
import "./home-membership-section.css";
import "./home-faq-section.css";
import "./home-hero-final.css";
import "./home-insights-section.css";
import "./home-final-cta-section.css";

type LocalImageProps = React.ComponentPropsWithoutRef<"img"> & {
  priority?: boolean;
};

// Local previews serve bundled assets directly. This avoids depending on the
// Cloudflare Images binding, which is only available in the hosted runtime.
function Image({ priority, ...props }: LocalImageProps) {
  return <img {...props} fetchPriority={priority ? "high" : undefined} />;
}

const benefits = [
  { icon: faBrain, tone: "blue", title: "AI Matchmaking", copy: "Connect with the right members, opportunities, and collaborators based on your goals." },
  { icon: faUserTie, tone: "orange", title: "Investor & Mentor Connect", copy: "Access guidance from experts and discover funding opportunities within the ecosystem." },
  { icon: faPlaneDeparture, tone: "blue", title: "Networking While Travelling", copy: "Find relevant members in the cities you visit and build meaningful business relationships anywhere." },
  { icon: faVault, tone: "orange", title: "Business Growth Vault", copy: "Access SOPs, templates, frameworks, planning tools, and curated business resources." },
];

const metrics = [
  { icon: faRobot, title: "AI Growth Advisor", copy: "Your personal AI growth companion that recommends the next best actions, connections, opportunities, events and learning based on your goals.", tone: "blue" },
  { icon: faChartLine, title: "AI Opportunity Intelligence", copy: "Identifies emerging business possibilities, relevant demand and potential opportunities based on your industry, location and NetworkX activity.", tone: "cyan" },
  { icon: faUserGroup, title: "Smart Recommendations", copy: "Get personalised suggestions for members, communities, events, opportunities and resources most relevant to you.", tone: "purple" },
  { icon: faBell, title: "Opportunity Alerts", copy: "Receive timely alerts when relevant business requirements, collaborations, referrals or opportunities match your profile and interests.", tone: "orange" },
  { icon: faTags, title: "Deals Corner", copy: "Discover exclusive member offers, special business deals and benefits available across the NetworkX ecosystem.", tone: "blue" },
];

const heroProofItems = [
  { icon: "/images/hero-final/icon-countries.svg", value: "9+", label: "Countries", copy: "Global presence", tone: "blue" },
  { icon: "/images/hero-final/icon-industries.svg", value: "59+", label: "Industry Verticals", copy: "Diverse business ecosystem", tone: "orange" },
  { icon: "/images/hero-final/icon-growth-intelligence.svg", value: "Growth Intelligence", label: "", copy: "Intelligent connections that drive growth", tone: "green" },
  { icon: "/images/hero-final/icon-infinite.svg", value: "Infinite", label: "Opportunities", copy: "For you and your business", tone: "purple" },
];

const appFeatures = [
  { icon: faBolt, tone: "cyan", title: "Real-Time Opportunities", copy: "Stay updated on relevant opportunities, referrals, deals and member activity." },
  { icon: faBrain, tone: "purple", title: "AI on the Go", copy: "Access personalised recommendations, growth insights and intelligent connections wherever you are." },
  { icon: faUsers, tone: "green", title: "Connect Anywhere", copy: "Discover members, message connections and continue networking across cities and countries." },
  { icon: faGrip, tone: "orange", title: "Everything in One App", copy: "Networking, opportunities, events, learning, deals and business tools in one seamless experience." },
];

const impactStories = [
  { name: "Ananya Sharma", role: "Founder, GrowthBridge", location: "Mumbai, India", industry: "Marketing & Strategy", quote: "Through NetworkX, I connected with a business partner who helped us launch a joint campaign. That one connection turned into a valuable collaboration and helped us grow our client base.", outcome: "Partnership Started", portrait: "/images/section-6/ananya-sharma.png", outcomeIcon: "/images/section-6/icon-partnership.svg" },
  { name: "Michael Carter", role: "CEO, NorthPeak Consulting", location: "Austin, USA", industry: "Business Consulting", quote: "NetworkX helped me connect with decision-makers I wouldn’t have reached otherwise. Those conversations opened the door to exploring opportunities in a completely new market.", outcome: "Entered a New Market", portrait: "/images/section-6/michael-carter.png", outcomeIcon: "/images/section-6/icon-market.svg" },
  { name: "Omar Al Farsi", role: "Business Development Professional", location: "Dubai, UAE", industry: "Investment & Partnerships", quote: "NetworkX helped me connect with relevant business leaders and potential strategic partners beyond my existing network. It opened up conversations that would have otherwise taken much longer to initiate.", outcome: "Strategic Connections", portrait: "/images/section-6/omar-al-farsi.png", outcomeIcon: "/images/section-6/icon-strategic.svg" },
];

const impactProof = [
  { value: "9+", label: "Countries", icon: "/images/section-6/icon-countries.svg" },
  { value: "59+", label: "Industry Verticals", icon: "/images/section-6/icon-industries.svg" },
  { value: "Growing", label: "Global Community", icon: "/images/section-6/icon-community.svg" },
  { value: "Infinite", label: "Opportunities", icon: "/images/section-6/icon-infinite.svg" },
];

const membershipPlans = [
  {
    id: "connect",
    title: "Connect",
    subtitle: "Start your journey",
    icon: "/images/section-7/icon-connect.svg",
    badgeIcon: "/images/section-7/icon-community-access.svg",
    badge: "Community Access",
    indiaPrice: "₹1,999",
    globalPrice: "$99",
    description: "Build your global network, access the community and discover relevant opportunities.",
    bestFor: "Professionals & individuals starting their NetworkX journey.",
    cta: "Explore Connect",
  },
  {
    id: "growth",
    title: "Growth",
    subtitle: "Accelerate your growth",
    icon: "/images/section-7/icon-growth.svg",
    badgeIcon: "/images/section-7/icon-ai-opportunities.svg",
    badge: "AI Matchmaking + Opportunities",
    indiaPrice: "₹4,999",
    globalPrice: "$249",
    description: "Unlock AI matchmaking, opportunities, visibility, learning and business-growth tools.",
    bestFor: "Growing businesses & active networkers.",
    cta: "Explore Growth",
    featured: true,
  },
  {
    id: "elite",
    title: "Elite",
    subtitle: "Lead. Influence. Scale.",
    icon: "/images/section-7/icon-elite.svg",
    badgeIcon: "/images/section-7/icon-priority.svg",
    badge: "Priority Access + Premium Visibility",
    indiaPrice: "₹9,999",
    globalPrice: "$499",
    description: "Get priority positioning, curated access, premium events and exclusive NetworkX benefits.",
    bestFor: "Business leaders & growth-focused founders.",
    cta: "Explore Elite",
  },
];

const membershipTrust = [
  { icon: "/images/section-7/icon-annual.svg", title: "Annual membership", copy: "One simple payment, 12 months of access" },
  { icon: "/images/section-7/icon-secure.svg", title: "Secure checkout", copy: "Your data is safe with us" },
  { icon: "/images/section-7/icon-regional.svg", title: "Regional pricing available", copy: "Plans tailored for your region" },
];

export default function Home() {
  return (
    <main className="home-page">
      <Header />

      <section className="hero hero-final" id="top">
        <div className="hero-final-inner">
          <div className="hero-final-copy">
            <div className="hero-final-badge">
              <Image src="/images/hero-final/icon-ai-spark.svg" alt="" width={24} height={24} />
              <span>AI-Powered</span><i />
              <span>Global</span><i />
              <span>Built for Business Growth</span>
            </div>
            <h1>World’s First<br />AI-Powered<br />Business Growth<br /><em>Community</em></h1>
            <h2>Learn. <span>Build.</span> Evolve.</h2>
            <p>NetworkX is an intelligent global business ecosystem that helps professionals, entrepreneurs and businesses discover the right people, opportunities, mentors, investors and resources to grow.</p>
            <div className="hero-final-actions">
              <Link className="button" href="/pricing">Join NetworkX <Image src="/images/hero-final/icon-arrow.svg" alt="" width={18} height={18} /></Link>
              <a className="button button-secondary" href="#about">Explore How It Works <Image src="/images/hero-final/icon-arrow.svg" alt="" width={18} height={18} /></a>
            </div>
            <div className="hero-final-trust">
              <div className="hero-final-avatars" aria-label="NetworkX business leaders">
                {[1, 2, 3].map((member) => <Image key={member} src={`/images/hero-final/trust-member-0${member}.png`} alt={`NetworkX business leader ${member}`} width={52} height={52} />)}
              </div>
              <div className="hero-final-rating">
                <strong>Trusted by Business Leaders Worldwide</strong>
                <div><span aria-label="4.9 out of 5 stars">{Array.from({ length: 5 }, (_, index) => <Image key={index} src="/images/hero-final/icon-star.svg" alt="" width={20} height={20} />)}</span><b>4.9</b><small>/ 5 rating</small></div>
              </div>
            </div>
          </div>

          <div className="hero-final-map" aria-label="NetworkX global intelligent connection map">
            <div className="hero-final-map-art">
              <Image src="/images/hero/network-map-transparent-v4.png" alt="" width={2400} height={1351} priority />
            </div>

            <span className="hero-map-node hero-map-node-canada blue" aria-hidden="true"><FontAwesomeIcon icon={faUser} /></span>
            <span className="hero-map-node hero-map-node-london orange" aria-hidden="true"><FontAwesomeIcon icon={faUser} /></span>
            <span className="hero-map-node hero-map-node-dubai orange" aria-hidden="true"><FontAwesomeIcon icon={faUser} /></span>

            <div className="hero-map-callout hero-map-callout-canada">
              <span className="blue" aria-hidden="true"><FontAwesomeIcon icon={faUser} /></span>
              <p><strong>Relevant Match</strong><b>Found in Canada</b></p>
            </div>
            <div className="hero-map-callout hero-map-callout-london">
              <span className="orange" aria-hidden="true"><FontAwesomeIcon icon={faLocationDot} /></span>
              <p><strong>Opportunity in</strong><b>London</b></p>
            </div>
            <div className="hero-map-callout hero-map-callout-dubai">
              <span className="orange" aria-hidden="true"><FontAwesomeIcon icon={faLocationDot} /></span>
              <p><strong>Opportunity in</strong><b>Dubai</b></p>
            </div>

            <a className="hero-final-ai-card" href="#solutions" aria-label="Explore AI Matchmaking">
              <span className="hero-final-ai-icon" aria-hidden="true"><Image src="/images/hero-final/icon-ai-brain.svg" alt="" width={74} height={74} /></span>
              <span className="hero-final-ai-copy"><strong>AI Matchmaking</strong><small>Discover the people, opportunities and relationships most relevant to your growth.</small></span>
              <span className="hero-final-ai-arrow" aria-hidden="true">›</span>
            </a>
          </div>

          <div className="hero-final-proof" aria-label="NetworkX global network highlights">
            {heroProofItems.map((item) => (
              <article className={item.tone} key={item.value}>
                <Image src={item.icon} alt="" width={66} height={66} />
                <div><strong>{item.value}</strong>{item.label && <span>{item.label}</span>}<p>{item.copy}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="intelligent-section section-shell" id="about">
        <div className="intelligent-intro">
          <div className="intelligent-kicker">What makes NetworkX different</div>
          <h2><span>An Intelligent</span><span>Networking Experience</span><span>Unlike Anything the</span><span>World Has Seen Before</span></h2>
          <p>NetworkX combines AI, business opportunities, mentorship, investor access, and practical tools into one intelligent growth ecosystem designed for modern professionals and entrepreneurs.</p>
          <a className="button intelligent-cta" href="#solutions">Explore Features <span>›</span></a>
        </div>
        <div className="intelligent-grid">
          {benefits.map((item) => (
            <article className={`intelligent-card ${item.tone}`} key={item.title}>
              <span className="intelligent-icon" aria-hidden="true">
                <FontAwesomeIcon icon={item.icon} />
              </span>
              <div className="intelligent-card-copy"><h3>{item.title}</h3><i /><p>{item.copy}</p></div>
              <span className="intelligent-node-mark" aria-hidden="true"><i /><b /></span>
            </article>
          ))}
        </div>
      </section>

      <section className="growth-intelligence section-shell" aria-label="NetworkX growth intelligence features">
        <div className="growth-copy">
          <div className="growth-kicker">NetworkX Growth Intelligence <FontAwesomeIcon icon={faWandMagicSparkles} /></div>
          <h2>Smarter Opportunities.<br /><span>Faster Growth.</span></h2>
          <i className="growth-accent" aria-hidden="true" />
          <p>NetworkX goes beyond connecting people. Its intelligent growth engine continuously analyses your profile, goals, activity and network to recommend the next best actions, uncover relevant opportunities and help you grow more strategically.</p>
          <div className="growth-personalised"><span aria-hidden="true"><FontAwesomeIcon icon={faUsers} /></span><p>Personalised by your <strong>business, industry,<br className="growth-note-break" /> location, goals</strong> and <strong>activity.</strong></p></div>
        </div>
        <div className="growth-grid">
          {metrics.map((item) => <article className={`growth-card ${item.tone}`} key={item.title}><span className="growth-icon" aria-hidden="true"><FontAwesomeIcon icon={item.icon} /></span><h3>{item.title}</h3><p>{item.copy}</p><em /></article>)}
        </div>
        <div className="growth-wave" aria-hidden="true"><i /><b /></div>
      </section>

      <section className="mobile-network-section" id="solutions">
        <div className="mobile-showcase" aria-label="NetworkX mobile app experience">
          <div className="mobile-orbit mobile-orbit-orange" /><div className="mobile-orbit mobile-orbit-blue" />
          <div className="mobile-floor-rings" aria-hidden="true" />
          <div className="mobile-phone mobile-phone-left"><Image src="/images/app/explore.jpg" alt="NetworkX opportunities and global discovery screen" width={563} height={1000} /></div>
          <div className="mobile-phone mobile-phone-main"><Image src="/images/app/growth.jpg" alt="NetworkX AI growth dashboard" width={474} height={1000} /></div>
          <div className="mobile-phone mobile-phone-right"><Image src="/images/app/network.jpg" alt="NetworkX member network screen" width={563} height={1000} /></div>
        </div>
        <div className="mobile-network-copy">
          <div className="mobile-network-kicker"><FontAwesomeIcon icon={faMobileScreenButton} /> NetworkX. Anytime. Anywhere.</div>
          <h2>Your Business Network.<br /><span>Always With You.</span></h2>
          <p>Access your connections, opportunities, AI recommendations, events, deals and business insights wherever you go — all from the <strong>Network<span>X</span></strong> mobile app.</p>
          <div className="mobile-feature-grid">
            {appFeatures.map((item) => <article key={item.title}><span className={`mobile-feature-icon ${item.tone}`} aria-hidden="true"><FontAwesomeIcon icon={item.icon} /></span><div><h3>{item.title}</h3><p>{item.copy}</p></div></article>)}
          </div>
          <div className="store-row"><a className="store-badge apple-store" href="#contact" aria-label="Download NetworkX on the App Store"><b className="apple-mark" aria-hidden="true" /><span><small>Download on the</small><strong>App Store</strong></span></a><a className="store-badge play-store" href="#contact" aria-label="Get NetworkX on Google Play"><b className="play-mark" aria-hidden="true" /><span><small>GET IT ON</small><strong>Google Play</strong></span></a></div>
          <div className="mobile-trust-line"><FontAwesomeIcon icon={faShieldHalved} /><span>Secure. Reliable. Built for Business.</span></div>
        </div>
      </section>

      <Section5OnlineBusinessCommunity />

      <section className="h2-impact" id="member-stories">
        <div className="h2-impact-map" aria-hidden="true"><Image src="/images/section-6/global-network-visual.png" alt="" width={456} height={360} /></div>
        <div className="h2-impact-grid" aria-hidden="true" />
        <header className="h2-impact-header">
          <div className="h2-impact-eyebrow"><i />Real members. Real impact.<i /></div>
          <h2>Connections That Created<br /><span>Real Business Outcomes</span></h2>
          <p>See how NetworkX members are building meaningful relationships, discovering opportunities<br className="h2-impact-desktop-break" /> and creating business across cities, industries and countries.</p>
        </header>
        <div className="h2-impact-stories">
          {impactStories.map((story) => (
            <article className="h2-impact-card" key={story.name}>
              <div className="h2-impact-portrait"><Image src={story.portrait} alt={`${story.name}, ${story.role}`} width={204} height={416} /></div>
              <div className="h2-impact-copy">
                <div>
                  <h3>{story.name}</h3>
                  <p className="h2-impact-role">{story.role}</p>
                  <p className="h2-impact-meta"><Image src="/images/section-6/icon-location.svg" alt="" width={18} height={18} />{story.location}</p>
                  <p className="h2-impact-meta"><Image src="/images/section-6/icon-industry.svg" alt="" width={18} height={18} />{story.industry}</p>
                </div>
                <blockquote><span aria-hidden="true">“</span><p>{story.quote}</p></blockquote>
                <div className="h2-impact-outcome"><Image src={story.outcomeIcon} alt="" width={27} height={27} /><span>{story.outcome}</span></div>
              </div>
            </article>
          ))}
        </div>
        <a className="h2-impact-cta" href="mailto:hello@networkxcircle.com?subject=NetworkX%20Member%20Stories">View More Member Stories <FontAwesomeIcon icon={faArrowRight} /></a>
        <div className="h2-impact-proof">
          {impactProof.map((item) => <article key={item.label}><Image src={item.icon} alt="" width={72} height={72} /><div><strong>{item.value}</strong><span>{item.label}</span></div></article>)}
        </div>
      </section>

      <section className="membership-section" id="membership" aria-labelledby="membership-title">
        <header className="membership-header">
          <div className="membership-eyebrow"><i />Membership<i /></div>
          <h2 id="membership-title">Choose How You Want to <span>Grow</span></h2>
          <p>Select the plan that fits where you are today and unlock powerful tools,<br className="membership-desktop-break" /> global connections and real opportunities to grow your business.</p>
          <div className="membership-price-notice">
            <Image src="/images/section-7/icon-globe.svg" alt="" width={28} height={28} />
            <span>Global plans start from <strong>$99/year</strong></span>
            <i aria-hidden="true" />
            <span>Regional pricing applies.</span>
            <Image src="/images/section-7/icon-info.svg" alt="" width={24} height={24} />
          </div>
          <small>Prices shown may vary by country. Local taxes may apply.</small>
        </header>

        <div className="membership-plan-grid">
          {membershipPlans.map((plan) => (
            <article className={`membership-plan membership-plan-${plan.id}${plan.featured ? " is-featured" : ""}`} key={plan.id}>
              {plan.featured && <div className="membership-popular">Most Popular</div>}
              <div className="membership-plan-top">
                <div className="membership-plan-identity">
                  <Image src={plan.icon} alt="" width={66} height={66} />
                  <div><h3>{plan.title}</h3><p>{plan.subtitle}</p></div>
                </div>
                <div className="membership-plan-badge">
                  <Image src={plan.badgeIcon} alt="" width={23} height={23} />
                  <span>{plan.badge}</span>
                </div>
              </div>
              <div className="membership-prices" aria-label={`${plan.title} annual pricing`}>
                <div><span>India price</span><p><strong>{plan.indiaPrice}</strong><small>/ year</small></p></div>
                <div><span>Global price</span><p><strong>{plan.globalPrice}</strong><small>/ year</small></p></div>
              </div>
              <p className="membership-description">{plan.description}</p>
              <div className="membership-best-for">
                <strong><Image src={plan.badgeIcon} alt="" width={23} height={23} />Best for</strong>
                <p>{plan.bestFor}</p>
              </div>
              <a className="membership-plan-cta" href="/pricing" aria-label={`${plan.cta} membership plan`}><span>{plan.cta}</span><FontAwesomeIcon icon={faArrowRight} /></a>
            </article>
          ))}
        </div>

        <a className="membership-compare" href="/pricing">
          <Image src="/images/section-7/icon-compare.svg" alt="" width={62} height={62} />
          <span><strong>Compare All Membership Benefits</strong><small>See the complete feature breakdown and benefits across all plans.</small></span>
          <FontAwesomeIcon icon={faArrowRight} />
        </a>

        <div className="membership-trust" aria-label="Membership assurances">
          {membershipTrust.map((item) => (
            <article key={item.title}><Image src={item.icon} alt="" width={52} height={52} /><div><strong>{item.title}</strong><span>{item.copy}</span></div></article>
          ))}
        </div>
      </section>

      <HomeFaqSection />

      <HomeInsightsSection />

      <HomeFinalCtaSection />

      <Footer />
    </main>
  );
}