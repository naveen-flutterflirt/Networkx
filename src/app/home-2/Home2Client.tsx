"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBars,
  faBrain,
  faBriefcase,
  faBuilding,
  faCalendar,
  faChartLine,
  faCheck,
  faChevronDown,
  faCircleNodes,
  faGlobe,
  faInfinity,
  faLightbulb,
  faMagnifyingGlass,
  faPlane,
  faStore,
  faTags,
  faUserTie,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

const problemCards = [
  { number: "01", title: "Connect Smarter", copy: "Find relevant people beyond your existing circle.", icon: faCircleNodes, mode: "connections" },
  { number: "02", title: "Discover Opportunities", copy: "Access requirements, partnerships, collaborations and referrals.", icon: faMagnifyingGlass, mode: "opportunities" },
  { number: "03", title: "Grow Continuously", copy: "Events, experts, learning and business resources in one ecosystem.", icon: faChartLine, mode: "growth" },
  { number: "04", title: "Go Global", copy: "Build meaningful relationships across markets and industries.", icon: faGlobe, mode: "global" },
];

const audienceContent = {
  Entrepreneurs: { title: "Build relationships that accelerate growth.", bullets: ["Find customers", "Find partners", "Discover opportunities", "Learn from other entrepreneurs"] },
  Professionals: { title: "Turn expertise into visibility and opportunities.", bullets: ["Grow your professional network", "Showcase expertise", "Discover collaborations", "Build personal credibility"] },
  Founders: { title: "Find the people who can move your vision forward.", bullets: ["Meet strategic partners", "Find specialist talent", "Access founder circles", "Enter new markets"] },
  "Business Owners": { title: "Create a stronger pipeline beyond your local market.", bullets: ["Generate qualified introductions", "Find trusted vendors", "Build referral channels", "Discover cross-border demand"] },
  Solopreneurs: { title: "Build a network that works like an extended team.", bullets: ["Find collaborators", "Win new clients", "Access experts", "Grow your reputation"] },
  Consultants: { title: "Turn specialist knowledge into trusted demand.", bullets: ["Showcase expertise", "Meet decision-makers", "Build referral partnerships", "Discover advisory opportunities"] },
} as const;

const testimonials = [
  { name: "Arjun Mehta", role: "Founder · India", image: "/images/community/arjun-mehta.png", quote: "One relevant introduction opened a partnership we would never have found through our existing circle." },
  { name: "Neha Iyer", role: "Product Leader · India", image: "/images/community/neha-iyer.png", quote: "NetworkX makes global discovery feel focused, human and immediately useful." },
  { name: "Michael Chen", role: "CEO · Singapore", image: "/images/community/michael-chen.png", quote: "The quality of context around every connection changes the conversation completely." },
];

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(value);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setCount(0);
      const start = performance.now();
      const duration = 1100;
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        setCount(Math.round(value * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      observer.disconnect();
    }, { threshold: 0.55 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function Home2Client() {
  const [scrolled, setScrolled] = useState(false);
  const [problemMode, setProblemMode] = useState("connections");
  const [audience, setAudience] = useState<keyof typeof audienceContent>("Entrepreneurs");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const currentAudience = audienceContent[audience];

  return (
    <main className="home2-page" id="home2-top">
      <header className={`h2-header${scrolled ? " is-scrolled" : ""}`}>
        <Link className="h2-logo" href="/home-2" aria-label="NetworkX Home 2">
          <Image src="/brand/networkx-logo-header.png" alt="NetworkX" width={620} height={100} priority />
        </Link>
        <nav className="h2-desktop-nav" aria-label="Home 2 primary navigation">
          <a href="#why">Why NetworkX</a>
          <a href="#community">Community <FontAwesomeIcon icon={faChevronDown} /></a>
          <a href="#opportunities">Opportunities</a>
          <a href="#events">Events</a>
          <a href="#membership">Membership</a>
          <a href="#ecosystem">Resources <FontAwesomeIcon icon={faChevronDown} /></a>
          <a href="#philosophy">About</a>
        </nav>
        <div className="h2-header-actions"><a className="h2-login" href="/login">Login</a><Link className="h2-btn h2-btn-primary" href="/pricing">Join NetworkX <FontAwesomeIcon icon={faArrowRight} /></Link></div>
        <details className="h2-mobile-menu">
          <summary className="h2-menu-button" aria-label="Open navigation"><FontAwesomeIcon icon={faBars} /></summary>
          <nav className="h2-mobile-nav"><a href="#why">Why NetworkX</a><a href="#community">Community</a><a href="#opportunities">Opportunities</a><a href="#events">Events</a><a href="#membership">Membership</a><a href="/login">Login</a><Link href="/pricing">Join NetworkX</Link></nav>
        </details>
      </header>

      <section className="h2-hero">
        <div className="h2-hero-glow" aria-hidden="true" />
        <div className="h2-hero-copy">
          <div className="h2-eyebrow">The next generation of business networking</div>
          <h1><span>The Business Network</span><span>Built for <em>What&apos;s Next.</em></span></h1>
          <p>Connect with ambitious professionals, discover real business opportunities and grow beyond borders — powered by community, technology and AI.</p>
          <div className="h2-actions"><Link className="h2-btn h2-btn-primary" href="/pricing">Join NetworkX <FontAwesomeIcon icon={faArrowRight} /></Link><Link className="h2-btn h2-btn-secondary" href="/pricing">Explore Memberships</Link></div>
          <div className="h2-hero-scale"><span>9+ Countries</span><i /> <span>59+ Industries</span><i /> <span>One Global Network</span></div>
          <div className="h2-trust-line">For Entrepreneurs <b>•</b> Professionals <b>•</b> Founders <b>•</b> Solopreneurs <b>•</b> Business Leaders</div>
        </div>
        <div className="h2-hero-product" aria-label="NetworkX intelligent global networking visualization">
          <div className="h2-map-stage">
            <Image src="/images/hero/network-map-v2.jpg" alt="NetworkX global member network map" width={1400} height={788} priority />
            <span className="h2-cluster cluster-india"><i />India</span><span className="h2-cluster cluster-usa"><i />USA</span><span className="h2-cluster cluster-uae"><i />UAE</span><span className="h2-cluster cluster-canada"><i />Canada</span><span className="h2-cluster cluster-australia"><i />Australia</span>
            <span className="h2-map-arc arc-one" /><span className="h2-map-arc arc-two" /><span className="h2-map-arc arc-three" />
          </div>
          <div className="h2-floating-profile fp-sarah"><Image src="/images/community/priya-shah.jpg" alt="Sarah Collins" width={54} height={54} /><span><strong>Sarah Collins</strong><small>Business Consulting</small><b>🇺🇸 USA</b></span></div>
          <div className="h2-floating-profile fp-rahul"><Image src="/images/community/arjun-mehta.png" alt="Rahul Mehta" width={54} height={54} /><span><strong>Rahul Mehta</strong><small>Manufacturing</small><b>🇮🇳 India</b></span></div>
          <div className="h2-match-card">
            <small>Opportunity Match</small><strong>94%</strong><span>High Compatibility</span><div className="h2-match-chart"><i /><i /><i /><i /><i /></div>
          </div>
          <div className="h2-match-success"><FontAwesomeIcon icon={faBrain} /><span><strong>AI Match Success</strong><small>Connecting people.<br />Creating opportunities.</small></span></div>
        </div>
      </section>

      <section className="h2-live-strip" aria-label="Live NetworkX growth metrics">
        <div className="h2-strip-title">Growing Every Connection.<br /><em>Every Day.</em></div>
        <div className="h2-live-stats">
          <div className="h2-live-stat"><FontAwesomeIcon icon={faGlobe} /><strong><AnimatedNumber value={9} suffix="+" /></strong><span>Countries</span><small>Across the globe</small></div>
          <div className="h2-live-stat"><FontAwesomeIcon icon={faBuilding} /><strong><AnimatedNumber value={59} suffix="+" /></strong><span>Industries</span><small>Diverse. Dynamic.</small></div>
          <div className="h2-live-stat"><FontAwesomeIcon icon={faUsers} /><strong>Global</strong><span>Members</span><small>Growing every day</small></div>
          <div className="h2-live-stat"><FontAwesomeIcon icon={faInfinity} /><strong>Infinite</strong><span>Opportunities</span><small>For your growth</small></div>
          <div className="h2-live-stat"><FontAwesomeIcon icon={faChartLine} /><strong>Countless</strong><span>Connections</span><small>That create impact</small></div>
        </div>
      </section>

      <section className="h2-problem h2-section" id="why">
        <div className="h2-section-intro"><span className="h2-kicker">Networking was built for yesterday.</span><h2>Network<em>X</em><br />changes that.</h2><p>Traditional networking depends on geography, introductions and chance encounters.</p><strong>NetworkX changes the way you connect, collaborate and grow.</strong></div>
        <div className="h2-problem-grid">
          {problemCards.map((card) => <article key={card.number} className={problemMode === card.mode ? "active" : ""} tabIndex={0} onMouseEnter={() => setProblemMode(card.mode)} onFocus={() => setProblemMode(card.mode)}><div><span>{card.number}</span><FontAwesomeIcon icon={card.icon} /></div><h3>{card.title}</h3><p>{card.copy}</p></article>)}
        </div>
      </section>

      <section className="h2-ecosystem h2-section" id="ecosystem">
        <div className="h2-centered"><h2>One Platform. An Entire Business Ecosystem.</h2></div>
        <div className="h2-bento">
          <article className="h2-bento-card h2-bento-ai">
            <div className="h2-ecosystem-card-head"><h3>AI-Powered Networking</h3><p>Discover people who matter.</p></div>
            <span className="h2-recommendation-label">Recommended Connections</span>
            <div className="h2-recommendations">
              <div><Image src="/images/community/arjun-mehta.png" alt="Ankit Mehta" width={46} height={46} /><p><strong>Ankit Mehta</strong><small>Manufacturing · India</small></p><b><strong>92%</strong><small>Match</small></b></div>
              <div><Image src="/images/community/priya-shah.jpg" alt="Sarah Collins" width={46} height={46} /><p><strong>Sarah Collins</strong><small>Business Consulting · USA</small></p><b><strong>89%</strong><small>Match</small></b></div>
            </div>
            <a href="#ai">Discover Connections <FontAwesomeIcon icon={faArrowRight} /></a>
          </article>
          <article className="h2-bento-card h2-bento-opps">
            <div className="h2-ecosystem-card-head"><h3>Opportunities</h3><p>Find. Connect. Grow.</p></div>
            <div className="h2-portal-list">
              <div><b><FontAwesomeIcon icon={faCircleNodes} /></b><span><strong>Looking for Digital Marketing Partner</strong><small>Mumbai · Services</small><em>12 Interested</em></span><FontAwesomeIcon icon={faArrowRight} /></div>
              <div><b><FontAwesomeIcon icon={faBriefcase} /></b><span><strong>Seeking Packaging Vendor</strong><small>Manufacturing</small><em>8 Interested</em></span><FontAwesomeIcon icon={faArrowRight} /></div>
            </div>
            <a href="#opportunities">Explore Opportunities <FontAwesomeIcon icon={faArrowRight} /></a>
          </article>
          <article className="h2-bento-card h2-bento-deals">
            <div className="h2-ecosystem-card-head"><h3>NetworkX Deals</h3><p>Exclusive offers for members.</p></div>
            <div className="h2-mini-deals">
              <span><i><FontAwesomeIcon icon={faBuilding} /></i><b>20% OFF</b><small>Business Automation</small><FontAwesomeIcon icon={faArrowRight} /></span>
              <span><i><FontAwesomeIcon icon={faTags} /></i><b>Member Exclusive</b><small>Co-working Space</small><FontAwesomeIcon icon={faArrowRight} /></span>
            </div>
            <a href="#deals">Explore Deals <FontAwesomeIcon icon={faArrowRight} /></a>
          </article>
          <article className="h2-bento-card h2-bento-global">
            <div className="h2-ecosystem-card-head"><h3>Global Community</h3><p>Across cities. Across borders.</p></div>
            <div className="h2-community-globe"><Image src="/images/hero/network-map-v2.jpg" alt="NetworkX global community" fill sizes="(max-width: 980px) 90vw, 24vw" /><span className="globe-face face-one"><Image src="/images/community/arjun-mehta.png" alt="" width={36} height={36} /></span><span className="globe-face face-two"><Image src="/images/community/neha-iyer.png" alt="" width={36} height={36} /></span><span className="globe-face face-three"><Image src="/images/community/michael-chen.png" alt="" width={36} height={36} /></span></div>
            <a href="#global">Explore Members <FontAwesomeIcon icon={faArrowRight} /></a>
          </article>
          <article className="h2-bento-card h2-bento-event">
            <div className="h2-ecosystem-card-head"><h3>Events</h3><p>Engage. Learn. Network.</p></div>
            <div className="h2-event-preview"><strong>Next NetworkX Global Mixer</strong><div className="h2-event-preview-meta"><span><b>12</b><small>AUG</small></span><span><b>7:00</b><small>PM (IST)</small></span><div className="h2-attending"><span><Image src="/images/community/arjun-mehta.png" alt="" width={40} height={40} /></span><span><Image src="/images/community/neha-iyer.png" alt="" width={40} height={40} /></span><span><Image src="/images/community/michael-chen.png" alt="" width={40} height={40} /></span><b>148 attending</b></div></div></div>
          </article>
          <article className="h2-bento-card h2-bento-profile">
            <div className="h2-ecosystem-card-head"><h3>Member Visibility</h3><p>Showcase. Connect. Grow.</p></div>
            <div className="h2-digital-profile"><Image src="/images/community/arjun-mehta.png" alt="Rahul Sharma profile" width={74} height={74} /><div><h3>Rahul Sharma</h3><p>AI Consultant · India</p><div className="h2-profile-tags"><span>Skills</span><span>Business</span><span>Opportunities</span><span>Connections</span></div></div></div>
          </article>
        </div>
      </section>

      <section className="h2-ai h2-section" id="ai">
        <div className="h2-ai-copy"><span className="h2-kicker">NetworkX intelligence</span><h2>Stop Networking Randomly.<br />Meet Who Matters.</h2><p>Our AI and member intelligence help you discover relevant people, opportunities and experiences based on what you want to achieve.</p><a className="h2-btn h2-btn-secondary" href="mailto:hello@networkxcircle.com">Experience NetworkX <FontAwesomeIcon icon={faArrowRight} /></a></div>
        <div className="h2-intelligence-orbit" aria-label="AI matching visualization">
          <div className="h2-ai-core"><strong>YOU</strong><span>X</span></div>
          <div className="h2-ai-result result-one"><b><FontAwesomeIcon icon={faUserTie} /></b><span>Potential Client<small><strong>96%</strong> Match</small></span></div>
          <div className="h2-ai-result result-two"><b><FontAwesomeIcon icon={faCircleNodes} /></b><span>Strategic Partner<small><strong>91%</strong> Match</small></span></div>
          <div className="h2-ai-result result-three"><b><FontAwesomeIcon icon={faBriefcase} /></b><span>Business Opportunity<small><strong>87%</strong> Match</small></span></div>
          <div className="h2-ai-result result-four"><b><FontAwesomeIcon icon={faLightbulb} /></b><span>Industry Expert<small><strong>84%</strong> Match</small></span></div>
          <i className="orbit-ring ring-one" /><i className="orbit-ring ring-two" />
        </div>
        <div className="h2-capabilities">
          <div><i><FontAwesomeIcon icon={faCircleNodes} /></i><span><strong>Smart Connections</strong><small>Relevant people.</small></span></div>
          <div><i><FontAwesomeIcon icon={faBrain} /></i><span><strong>Opportunity Matching</strong><small>Relevant business needs.</small></span></div>
          <div><i><FontAwesomeIcon icon={faCalendar} /></i><span><strong>Event Recommendations</strong><small>Relevant experiences.</small></span></div>
          <div><i><FontAwesomeIcon icon={faLightbulb} /></i><span><strong>Network Intelligence</strong><small>Relevant introductions.</small></span></div>
        </div>
      </section>

      <section className="h2-opportunities h2-section" id="opportunities">
        <div className="h2-opportunity-copy"><span className="h2-kicker">Business opportunities</span><h2>Don&apos;t Just Network.<br /><em>Find Business.</em></h2><ul><li>Need a technology partner?</li><li>Looking for a supplier?</li><li>Entering a new market?</li><li>Searching for a consultant?</li></ul><p>Post what you need. NetworkX helps the right members discover it.</p><a href="mailto:hello@networkxcircle.com">Explore Opportunities <FontAwesomeIcon icon={faArrowRight} /></a></div>
        <div className="h2-feed-mockup"><div className="h2-feed-top"><strong>Opportunity Feed</strong><a href="mailto:hello@networkxcircle.com">View All →</a></div><article><span className="h2-feed-icon"><FontAwesomeIcon icon={faBuilding} /></span><div><h3>Need ERP implementation partner</h3><small>Posted by Apex Manufacturing</small><div className="h2-meta-row"><span>Technology</span><span>India</span><span>Budget: ₹10L–₹25L</span></div></div><b>18<small>Interested</small></b><button type="button">View Opportunity</button></article><article><span className="h2-feed-icon green"><FontAwesomeIcon icon={faCircleNodes} /></span><div><h3>Looking for packaging manufacturer</h3><small>Posted by Green Foods</small><div className="h2-meta-row"><span>Manufacturing</span><span>Pune</span><span>Budget: ₹5L–₹15L</span></div></div><b>12<small>Interested</small></b><button type="button">View Opportunity</button></article><div className="h2-feed-metrics"><span><strong>500+</strong>Active Opportunities</span><span><strong>2,800+</strong>Members Engaged</span><span><strong>High</strong>Response Rate</span><span><strong>Real</strong>Business Outcomes</span></div></div>
      </section>

      <section className="h2-deals h2-section" id="deals">
        <div className="h2-deals-heading"><span className="h2-kicker">Membership that gives back.</span><h2>Exclusive Deals.<br />Real Business Value.</h2><p>Unlock special offers and privileges created exclusively for the NetworkX community.</p><a className="h2-btn h2-btn-primary" href="mailto:hello@networkxcircle.com">Discover Deals <FontAwesomeIcon icon={faArrowRight} /></a></div>
        <div className="h2-deal-stack"><article className="deal-business"><span>Business</span><FontAwesomeIcon icon={faStore} /><strong>25% OFF</strong><p>Business Automation Setup</p><small>NetworkX verified offer</small></article><article className="deal-travel"><span>Travel</span><FontAwesomeIcon icon={faPlane} /><strong>NetworkX Exclusive</strong><p>Member Hotel Benefits</p><small>Across selected markets</small></article><article className="deal-services"><span>Services</span><FontAwesomeIcon icon={faLightbulb} /><strong>15% OFF</strong><p>Brand Consultation</p><small>Member-to-member value</small></article></div>
      </section>

      <section className="h2-audience h2-section">
        <div className="h2-centered"><span className="h2-kicker">Who NetworkX is for</span><h2>Different Ambitions.<br /><em>One Network.</em></h2></div>
        <div className="h2-tabs" role="tablist" aria-label="NetworkX audiences">{(Object.keys(audienceContent) as Array<keyof typeof audienceContent>).map((item) => <button key={item} type="button" role="tab" aria-selected={audience === item} className={audience === item ? "active" : ""} onClick={() => setAudience(item)}>{item}</button>)}</div>
        <div className="h2-audience-panel"><div><span>{audience}</span><h3>{currentAudience.title}</h3></div><ul>{currentAudience.bullets.map((bullet) => <li key={bullet}><FontAwesomeIcon icon={faCheck} />{bullet}</li>)}</ul><div className="h2-audience-art"><FontAwesomeIcon icon={audience === "Professionals" || audience === "Consultants" ? faUserTie : faUsers} /><i /><b /></div></div>
      </section>

      <section className="h2-events h2-section" id="events">
        <div className="h2-events-copy"><span className="h2-kicker">NetworkX events</span><h2>Sometimes the Best<br /><em>Connection Happens Live.</em></h2><p>Online when distance doesn&apos;t matter. In-person when presence does.</p><div className="h2-event-types"><span>Virtual Networking</span><span>Growth Mixers</span><span>Business Clinics</span><span>Summits</span><span>Expert Conversations</span></div></div>
        <article className="h2-feature-event"><div className="h2-event-badge">Featured global event</div><div className="h2-event-date"><strong>12</strong><span>AUG<br />2026</span></div><div><small>Virtual · Global</small><h3>NetworkX Global<br />Growth Mixer</h3><p>7:00 PM IST · 148 Members Attending</p><div className="h2-event-faces"><Image src="/images/community/arjun-mehta.png" alt="" width={44} height={44} /><Image src="/images/community/neha-iyer.png" alt="" width={44} height={44} /><Image src="/images/community/michael-chen.png" alt="" width={44} height={44} /><span>+145</span></div></div><a className="h2-btn h2-btn-primary" href="mailto:hello@networkxcircle.com?subject=Reserve%20my%20spot%20for%20the%20NetworkX%20Global%20Growth%20Mixer">Reserve Your Spot <FontAwesomeIcon icon={faArrowRight} /></a></article>
      </section>

      <section className="h2-membership h2-section" id="membership">
        <div className="h2-centered"><span className="h2-kicker">Membership</span><h2>Start Where You Are.<br /><em>Grow From There.</em></h2></div>
        <div className="h2-membership-grid"><article><span>01</span><small>Connect</small><h3>Digital Access</h3><p>Enter the NetworkX ecosystem.</p><Link href="/pricing">Explore <FontAwesomeIcon icon={faArrowRight} /></Link></article><article className="featured"><span>02</span><small>Grow</small><h3>Enhanced Network</h3><p>For members actively building connections and opportunities.</p><Link href="/pricing">Explore <FontAwesomeIcon icon={faArrowRight} /></Link></article><article><span>03</span><small>Lead</small><h3>Premium Experiences</h3><p>For deeper access, visibility and curated relationships.</p><Link href="/pricing">Explore <FontAwesomeIcon icon={faArrowRight} /></Link></article></div><Link className="h2-compare-link" href="/pricing">Compare all NetworkX memberships <FontAwesomeIcon icon={faArrowRight} /></Link>
      </section>

      <section className="h2-proof h2-section">
        <div className="h2-proof-heading"><span className="h2-kicker">Built around real people</span><h2>Technology Makes the Match.<br /><em>People Create the Opportunity.</em></h2></div><div className="h2-testimonials">{testimonials.map((item) => <article key={item.name}><div className="h2-quote-mark">“</div><p>{item.quote}</p><div><Image src={item.image} alt={item.name} width={68} height={68} /><span><strong>{item.name}</strong><small>{item.role}</small></span></div></article>)}</div>
      </section>

      <section className="h2-philosophy h2-section" id="philosophy"><div className="h2-philosophy-grid"><article><span>01</span><h2>Learn.</h2><p>Gain practical knowledge from people building real businesses.</p></article><article><span>02</span><h2>Build.</h2><p>Build relationships, credibility and opportunities.</p></article><article><span>03</span><h2>Evolve.</h2><p>Grow with changing markets, technology and ambition.</p></article></div><strong>Learn. Build. <em>Evolve.</em></strong></section>

      <section className="h2-final" id="contact"><div className="h2-final-x" aria-hidden="true">X</div><div><span className="h2-kicker">Your network, upgraded</span><h2>Your Next Opportunity<br />Could Start With <em>One Connection.</em></h2><p>Join a global business community built for ambitious people who want more from their network.</p><div className="h2-final-scale">9+ Countries <i /> 59+ Industries <i /> Infinite Opportunities</div><div className="h2-actions"><Link className="h2-btn h2-btn-primary" href="/pricing">Join NetworkX <FontAwesomeIcon icon={faArrowRight} /></Link><Link className="h2-btn h2-btn-secondary" href="/pricing">Explore Memberships</Link></div><a className="h2-member-login" href="mailto:hello@networkxcircle.com?subject=NetworkX%20member%20login">Already a member? <strong>Login →</strong></a></div></section>

      <footer className="h2-footer"><Link href="/home-2"><Image src="/brand/networkx-logo-header.png" alt="NetworkX" width={620} height={100} /></Link><p>Global scale. AI-powered networking. Real business outcomes.</p><a href="mailto:hello@networkxcircle.com">hello@networkxcircle.com</a><span>© 2026 NetworkX. All rights reserved.</span></footer>
    </main>
  );
}
