import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faInstagram, faLinkedinIn, faTwitter } from "@fortawesome/free-brands-svg-icons";
import { faBell, faCity, faGift, faHandshake, faLandmark, faPlane, faSackDollar, faStar, faUsers, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import NewsletterForm from "@/app/components/NewsletterForm";
import StoriesCarousel from "@/app/components/StoriesCarousel";

type LocalImageProps = React.ComponentPropsWithoutRef<"img"> & {
  priority?: boolean;
};

// Local previews serve bundled assets directly. This avoids depending on the
// Cloudflare Images binding, which is only available in the hosted runtime.
function Image({ priority, ...props }: LocalImageProps) {
  return <img {...props} fetchPriority={priority ? "high" : undefined} />;
}

const benefits = [
  { icon: "people", tone: "blue", title: "Meaningful Connections", copy: "Find and connect with the right people across industries, locations, and interests." },
  { icon: "target", tone: "cyan", title: "Smarter Networking", copy: "AI-powered recommendations help you build valuable relationships faster." },
  { icon: "globe", tone: "purple", title: "Global Opportunities", copy: "Discover business opportunities, partnerships, and collaborations worldwide." },
  { icon: "shield", tone: "green", title: "Trusted Community", copy: "A verified, safe, and inclusive community built on trust and value." },
];

const metrics = [
  { icon: faUsers, title: "AI Matchmaking", copy: "Find high-fit people based on your goals, interests and business needs.", tone: "cyan" },
  { icon: faWandMagicSparkles, title: "Smart Recommendations", copy: "Discover relevant members, communities, events and opportunities.", tone: "blue" },
  { icon: faPlane, title: "Travel Connect", copy: "Meet trusted professionals wherever your work and travel take you.", tone: "orange" },
  { icon: faBell, title: "Opportunity Alerts", copy: "Get timely signals for partnerships, referrals, events and new leads.", tone: "purple" },
  { icon: faHandshake, title: "Trusted Introductions", copy: "Turn shared connections into warmer, more meaningful conversations.", tone: "green" },
];

const heroMembers = ["RK", "PM", "AR", "SP", "VR", "AK", "MJ", "SN"];

const heroStats = [
  { icon: faUsers, value: "12,500+", label: "Members" },
  { icon: faLandmark, value: "85", label: "Groups" },
  { icon: faCity, value: "28", label: "Cities" },
  { icon: faSackDollar, value: "₹45Cr+", label: "Business Generated" },
  { icon: faGift, value: "34,200+", label: "Referrals Exchanged" },
];

const appFeatures = [
  { icon: "notification", tone: "cyan", title: "Stay Updated", copy: "Real-time updates on messages, events and opportunities." },
  { icon: "magic", tone: "purple", title: "Smart Experience", copy: "AI-driven insights and personalized recommendations." },
  { icon: "growth", tone: "green", title: "Grow On the Go", copy: "Access tools and resources to grow your business anytime." },
  { icon: "secure", tone: "orange", title: "Seamless & Secure", copy: "Enterprise-grade security for a safe networking experience." },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a href="#top" className="logo-link" aria-label="NetworkX home">
          <Image src="/brand/networkx-logo-header.png" alt="NetworkX" width={620} height={100} priority />
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a className="active" href="#top">Home</a>
          <a href="/about">About</a>
          <a href="#solutions">Solutions</a>
          <a href="#community">Community</a>
          <a href="#resources">Resources</a>
          <a href="/pricing">Pricing</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="header-actions">
          <a className="login-link" href="/login">Log in</a>
          <a className="button button-small" href="#contact">Join NetworkX <span>↗</span></a>
        </div>
        <details className="mobile-menu">
          <summary aria-label="Open navigation"><i /><i /></summary>
          <nav>
            <a href="#top">Home</a><a href="/about">About</a><a href="#solutions">Solutions</a><a href="#community">Community</a><a href="#resources">Resources</a><a href="/pricing">Pricing</a><a href="#contact">Contact</a><a className="mobile-join" href="#contact">Join NetworkX</a>
          </nav>
        </details>
      </header>

      <section className="hero" id="top">
        <div className="hero-map" aria-hidden="true">
          <Image src="/images/hero/network-map-v2.jpg" alt="" width={1400} height={788} priority />
        </div>
        <div className="hero-copy">
          <h1>The World&apos;s<br /><span>Smartest Online</span><br />Business <em>Network</em></h1>
          <h2>Learn. Build. Evolve.</h2>
          <p className="hero-description">NetworkX is a global business networking platform that helps professionals, entrepreneurs and organizations build meaningful connections, discover opportunities and grow together.</p>
          <div className="hero-actions">
            <a className="button" href="#contact">Join NetworkX <span>↗</span></a>
            <a className="button button-secondary" href="#about">Explore Network</a>
          </div>
          <div className="hero-proof" aria-label="NetworkX professional community statistics">
            <div className="proof-top">
              <div className="proof-avatars" aria-label="NetworkX members">
                {heroMembers.map((member) => <span key={member}>{member}</span>)}
              </div>
              <div className="proof-rating">
                <strong>Trusted by <em>12,500+</em> professionals</strong>
                <div>
                  <span className="proof-stars" aria-label="4.9 out of 5 stars">
                    <span className="proof-stars-track" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <FontAwesomeIcon icon={faStar} key={index} />)}</span>
                    <span className="proof-stars-fill" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <FontAwesomeIcon icon={faStar} key={index} />)}</span>
                  </span>
                  <b>4.9</b><small>/5 rating</small>
                </div>
              </div>
            </div>
            <div className="hero-stat-grid">
              {heroStats.map((stat) => (
                <article className="hero-stat-card" key={stat.label}>
                  <span className="hero-stat-icon" aria-hidden="true"><FontAwesomeIcon icon={stat.icon} /></span>
                  <strong>{stat.value}</strong>
                  <span className="hero-stat-label">{stat.label}</span>
                </article>
              ))}
            </div>
          </div>
        </div>
        <a className="scroll-cue" href="#about"><span>Scroll to explore</span><i /></a>
        <div className="hero-wave" aria-hidden="true">
          <span className="blue-wave">{Array.from({ length: 10 }, (_, index) => <i key={index} style={{ "--wave-offset": `${index * 8}px`, "--wave-opacity": 0.32 - index * 0.022 } as React.CSSProperties} />)}</span>
          <span className="orange-wave">{Array.from({ length: 8 }, (_, index) => <i key={index} style={{ "--wave-offset": `${index * 9}px`, "--wave-opacity": 0.36 - index * 0.03 } as React.CSSProperties} />)}</span>
        </div>
      </section>

      <section className="benefits section-shell" id="about">
        <div className="benefits-intro">
          <div className="section-kicker orange">HOW NETWORKX IS</div>
          <h2>Changing the Way the<br />World Does Business</h2>
          <p>NetworkX combines human connection with smart technology to create a trusted ecosystem where relationships turn into real opportunities.</p>
        </div>
        <div className="benefit-grid">
          {benefits.map((item) => (
            <article key={item.title}>
              <span className={`benefit-icon-shell ${item.tone}`} aria-hidden="true">
                <span className={`benefit-icon ${item.icon} ${item.tone}`}><i /><b /></span>
              </span>
              <div><h3>{item.title}</h3><p>{item.copy}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="metrics section-shell" aria-label="NetworkX intelligent networking features">
        <div className="metrics-copy"><div className="section-kicker orange">NETWORKX INTELLIGENCE</div><h2>Smarter Features.<br />Better Connections.</h2><p>Purpose-built tools help you discover the right people, act on relevant opportunities and build relationships that move business forward.</p><i className="metrics-accent" /></div>
        <div className="metrics-grid">
          {metrics.map((item) => <article className={`metric-card metric-feature-card ${item.tone}`} key={item.title}><span className="metric-icon-shell" aria-hidden="true"><FontAwesomeIcon icon={item.icon} /></span><h3>{item.title}</h3><p>{item.copy}</p><em /></article>)}
        </div>
        <div className="metrics-wave" aria-hidden="true"><i /><b /></div>
      </section>

      <section className="app-section section-shell" id="solutions">
        <div className="app-visual" aria-label="NetworkX mobile app experience">
          <div className="app-orbit orbit-one" /><div className="app-orbit orbit-two" />
          <div className="phone phone-left"><Image src="/images/app/explore.jpg" alt="NetworkX Explore Global screen" width={563} height={1000} /></div>
          <div className="phone phone-main"><Image src="/images/app/growth.jpg" alt="NetworkX Growth Dashboard" width={474} height={1000} /></div>
          <div className="phone phone-right"><Image src="/images/app/network.jpg" alt="NetworkX My Network screen" width={563} height={1000} /></div>
        </div>
        <div className="app-copy">
          <div className="section-kicker cyan">MOBILE-FIRST. ALWAYS CONNECTED.</div>
          <h2>Your Network.<br />In Your Pocket.</h2>
          <p>The NetworkX mobile app keeps you connected, informed and inspired—wherever you go.</p>
          <div className="app-feature-grid">
            {appFeatures.map((item) => <article key={item.title}><span className={`app-feature-icon-shell ${item.tone}`} aria-hidden="true"><span className={`app-feature-icon ${item.icon} ${item.tone}`}><i /><b /></span></span><div><h3>{item.title}</h3><p>{item.copy}</p></div></article>)}
          </div>
          <div className="store-row"><a className="store-badge apple-store" href="#contact" aria-label="Download NetworkX on the App Store"><b className="apple-mark" aria-hidden="true" /><span><small>Download on the</small><strong>App Store</strong></span></a><a className="store-badge play-store" href="#contact" aria-label="Get NetworkX on Google Play"><b className="play-mark" aria-hidden="true" /><span><small>GET IT ON</small><strong>Google Play</strong></span></a></div>
        </div>
      </section>

      <section className="ai-section section-shell" id="resources">
        <div className="ai-copy">
          <div className="section-kicker cyan">AI-POWERED NETWORKING</div>
          <h2>Intelligence That<br />Builds Better Connections</h2>
          <p>NetworkX AI understands your goals and helps you connect with people, content and opportunities that matter most.</p>
          <a className="button button-secondary" href="#contact">Learn more about AI <span>→</span></a>
        </div>
        <div className="ai-visual ai-image-visual">
          <Image src="/images/ai/networkx-x4.png" alt="NetworkX AI platform connecting people with intelligent matchmaking, smart opportunities, data-driven insights and automated workflows" width={1254} height={1254} />
        </div>
      </section>

      <section className="stories section-shell" id="community">
        <div className="stories-copy">
          <div className="section-kicker cyan">COMMUNITIES THAT THRIVE</div>
          <h2>Built by Members.<br />Powered by Purpose<span>.</span></h2>
          <p>From tech innovators to sustainability leaders, our communities are where ideas spark, connections grow and impact happens.</p>
          <a className="button button-secondary" href="#contact">Explore Communities <span>→</span></a>
        </div>
        <StoriesCarousel />
        <div className="stories-wave" aria-hidden="true"><i /><b /></div>
      </section>

      <section className="cta section-shell" id="contact">
        <div className="cta-icon" aria-hidden="true"><i className="cta-person cta-person-left" /><i className="cta-person cta-person-main" /><i className="cta-person cta-person-right" /></div>
        <div className="cta-copy"><h2>Ready to Grow Your Network<br />and Your Business?</h2><p>Join millions of professionals and organizations<br />already building what&apos;s next.</p></div>
        <div className="cta-actions"><a className="button" href="mailto:hello@networkxcircle.com">Join NetworkX <span>↗</span></a><a className="button button-secondary" href="mailto:hello@networkxcircle.com">Contact Sales</a></div>
        <div className="cta-wave" aria-hidden="true"><i /><b /></div>
      </section>

      <footer id="pricing">
        <div className="footer-grid">
          <div className="footer-brand"><Image src="/brand/networkx-logo-header.png" alt="NetworkX" width={620} height={100} /><p>The global business networking platform that connects people, ideas and opportunities to build a better future.</p><div className="social-row"><a href="#contact" aria-label="NetworkX on LinkedIn"><FontAwesomeIcon icon={faLinkedinIn} /></a><a href="#contact" aria-label="NetworkX on Twitter"><FontAwesomeIcon icon={faTwitter} /></a><a href="#contact" aria-label="NetworkX on Facebook"><FontAwesomeIcon icon={faFacebookF} /></a><a href="#contact" aria-label="NetworkX on Instagram"><FontAwesomeIcon icon={faInstagram} /></a></div></div>
          <div><strong>Platform</strong><a href="#solutions">Explore</a><a href="#about">How It Works</a><a href="#solutions">Mobile App</a><a href="/pricing">Pricing</a><a href="#resources">AI Features</a></div>
          <div><strong>Community</strong><a href="#community">Communities</a><a href="#community">Events</a><a href="#community">Chapters</a><a href="#contact">Become a Host</a><a href="#community">Member Stories</a></div>
          <div><strong>Resources</strong><a href="#resources">Blog</a><a href="#resources">Guides</a><a href="#resources">Webinars</a><a href="#contact">Help Center</a><a href="#contact">Support</a></div>
          <div><strong>Company</strong><a href="/about">About Us</a><a href="#contact">Careers</a><a href="#contact">Press</a><a href="#contact">Partners</a><a href="#contact">Contact Us</a></div>
          <div className="newsletter"><strong>Newsletter</strong><p>Subscribe to get the latest updates and opportunities.</p><NewsletterForm /></div>
        </div>
        <div className="footer-wave" aria-hidden="true"><i /><b /></div>
        <div className="footer-bottom"><span>© 2026 NetworkX. All rights reserved.</span><div><a href="#contact">Privacy Policy</a><a href="#contact">Terms of Service</a><a href="#contact">Cookie Policy</a></div></div>
      </footer>
    </main>
  );
}
