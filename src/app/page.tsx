import React from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faApple, faGooglePlay } from "@fortawesome/free-brands-svg-icons";
import Header from "@/app/components/shared/Header";
import Footer from "@/app/components/shared/Footer";
import MobileAppMockup from "@/app/components/shared/MobileAppMockup";
import {
  faArrowRight,
  faBell,
  faBolt,
  faBrain,
  faChartLine,
  faGrip,
  faLocationDot,
  faMobileScreenButton,
  faPlaneDeparture,
  faRobot,
  faShieldHalved,
  faTags,
  faUser,
  faUserGroup,
  faUsers,
  faUserTie,
  faVault,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import NewsletterForm from "@/app/components/NewsletterForm";
import HomeFaqSection from "@/app/components/HomeFaqSection";
import HomeInsightsSection from "@/app/components/HomeInsightsSection";
import HomeFinalCtaSection from "@/app/components/HomeFinalCtaSection";

import "./intelligent-section.css";
import "./growth-intelligence.css";
import "./mobile-network-section.css";

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
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#7a4b27"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path>
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path>
      </svg>
    ),
    title: "AI Matchmaking",
    copy: "Connect with the right people, opportunities, and collaborations based on your goals.",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#7a4b27"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <polygon points="19 7 20.5 10 24 10.5 21.5 13 22 16.5 19 15 16 16.5 16.5 13 14 10.5 17.5 10"></polygon>
      </svg>
    ),
    title: "Investor & Mentor Connect",
    copy: "Access guidance from experts and discover funding opportunities within the ecosystem.",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#7a4b27"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6l-1 2.6c-.2.5.1 1 .6 1.1l7.3 1.8-3.4 3.4-3.5-.8c-.4-.1-.8.2-1 .5l-1 2.3c-.2.4.1.9.5 1l4.8 1.5 1.5 4.8c.1.4.6.7 1 .5l2.3-1c.3-.2.6-.6.5-1l-.8-3.5 3.4-3.4 1.8 7.3c.1.5.6.8 1.1.6l2.6-1c.4-.2.7-.6.6-1.1z"></path>
      </svg>
    ),
    title: "Networking While Travelling",
    copy: "Find relevant members in the cities you visit and build meaningful business relationships anywhere.",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#7a4b27"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    ),
    title: "Business Growth Vault",
    copy: "Access SOPs, templates, frameworks, planning tools and curated business resources.",
  },
];

const metrics = [
  {
    icon: faRobot,
    title: "AI Growth Advisor",
    copy: "Your personal AI growth companion that recommends the next best actions, connections, opportunities, events and learning based on your goals.",
    tone: "blue",
  },
  {
    icon: faChartLine,
    title: "AI Opportunity Intelligence",
    copy: "Identifies emerging business possibilities, relevant demand and potential opportunities based on your industry, location and NetworkX activity.",
    tone: "cyan",
  },
  {
    icon: faUserGroup,
    title: "Smart Recommendations",
    copy: "Get personalised suggestions for members, communities, events, opportunities and resources most relevant to you.",
    tone: "purple",
  },
  {
    icon: faBell,
    title: "Opportunity Alerts",
    copy: "Receive timely alerts when relevant business requirements, collaborations, referrals or opportunities match your profile and interests.",
    tone: "orange",
  },
  {
    icon: faTags,
    title: "Deals Corner",
    copy: "Discover exclusive member offers, special business deals and benefits available across the NetworkX ecosystem.",
    tone: "blue",
  },
];

const heroProofItems = [
  {
    icon: "/images/hero-final/icon-countries.svg",
    value: "9+",
    label: "Countries",
    copy: "Global presence",
    tone: "blue",
  },
  {
    icon: "/images/hero-final/icon-industries.svg",
    value: "59+",
    label: "Industry Verticals",
    copy: "Diverse business ecosystem",
    tone: "orange",
  },
  {
    icon: "/images/hero-final/icon-growth-intelligence.svg",
    value: "Growth Intelligence",
    label: "",
    copy: "Intelligent connections that drive growth",
    tone: "green",
  },
  {
    icon: "/images/hero-final/icon-infinite.svg",
    value: "Infinite",
    label: "Opportunities",
    copy: "For you and your business",
    tone: "purple",
  },
];

const appFeatures = [
  {
    icon: faBolt,
    tone: "cyan",
    title: "Real-Time Opportunities",
    copy: "Stay updated on relevant opportunities, referrals, deals and member activity.",
  },
  {
    icon: faBrain,
    tone: "purple",
    title: "AI on the Go",
    copy: "Access personalised recommendations, growth insights and intelligent connections wherever you are.",
  },
  {
    icon: faUsers,
    tone: "green",
    title: "Connect Anywhere",
    copy: "Discover members, message connections and continue networking across cities and countries.",
  },
  {
    icon: faGrip,
    tone: "orange",
    title: "Everything in One App",
    copy: "Networking, opportunities, events, learning, deals and business tools in one seamless experience.",
  },
];

const impactStories = [
  {
    name: "Ananya Sharma",
    role: "Founder, GrowthBridge",
    location: "Mumbai, India",
    industry: "Marketing & Strategy",
    quote:
      "Through NetworkX, I connected with a business partner who helped us launch a joint campaign. That one connection turned into a valuable collaboration and helped us grow our client base.",
    outcome: "Partnership Started",
    portrait: "/images/section-6/ananya-sharma.png",
    outcomeIcon: "/images/section-6/icon-partnership.svg",
  },
  {
    name: "Michael Carter",
    role: "CEO, NorthPeak Consulting",
    location: "Austin, USA",
    industry: "Business Consulting",
    quote:
      "NetworkX helped me connect with decision-makers I wouldn’t have reached otherwise. Those conversations opened the door to exploring opportunities in a completely new market.",
    outcome: "Entered a New Market",
    portrait: "/images/section-6/michael-carter.png",
    outcomeIcon: "/images/section-6/icon-market.svg",
  },
  {
    name: "Omar Al Farsi",
    role: "Business Development Professional",
    location: "Dubai, UAE",
    industry: "Investment & Partnerships",
    quote:
      "NetworkX helped me connect with relevant business leaders and potential strategic partners beyond my existing network. It opened up conversations that would have otherwise taken much longer to initiate.",
    outcome: "Strategic Connections",
    portrait: "/images/section-6/omar-al-farsi.png",
    outcomeIcon: "/images/section-6/icon-strategic.svg",
  },
];

const impactProof = [
  {
    value: "9+",
    label: "Countries",
    icon: "/images/section-6/icon-countries.svg",
  },
  {
    value: "59+",
    label: "Industry Verticals",
    icon: "/images/section-6/icon-industries.svg",
  },
  {
    value: "Growing",
    label: "Global Community",
    icon: "/images/section-6/icon-community.svg",
  },
  {
    value: "Infinite",
    label: "Opportunities",
    icon: "/images/section-6/icon-infinite.svg",
  },
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
    description:
      "Build your global network, access the community and discover relevant opportunities.",
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
    description:
      "Unlock AI matchmaking, opportunities, visibility, learning and business-growth tools.",
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
    description:
      "Get priority positioning, curated access, premium events and exclusive NetworkX benefits.",
    bestFor: "Business leaders & growth-focused founders.",
    cta: "Explore Elite",
  },
];

const membershipTrust = [
  {
    icon: "/images/section-7/icon-annual.svg",
    title: "Annual membership",
    copy: "One simple payment, 12 months of access",
  },
  {
    icon: "/images/section-7/icon-secure.svg",
    title: "Secure checkout",
    copy: "Your data is safe with us",
  },
  {
    icon: "/images/section-7/icon-regional.svg",
    title: "Regional pricing available",
    copy: "Plans tailored for your region",
  },
];

export default function Home() {
  return (
    <main
      className="home-page"
      style={{
        minHeight: "100vh",
        width: "100%",
        margin: 0,
        padding: 0,
        backgroundColor: "#fffcf8",
      }}
    >
      <Header />

      <section
        className="hero"
        id="top"
        style={{
          position: "relative",
          minHeight: "800px",
          display: "flex",
          flexDirection: "column",
          color: "#1a1a1a",
          paddingTop: "100px",
          borderBottom: "none",
          overflow: "hidden",
          backgroundColor: "#fffcf8",
        }}
      >
        {/* The background image with a gradient blend fading from solid background color on left to transparent on right */}
        <div
          className="hero-bg-layer"
          style={{
            position: "absolute",
            top: "44px",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
          }}
        ></div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            padding: "0 clamp(16px, 4vw, 40px)",
            boxSizing: "border-box",
          }}
        >
          <div style={{ width: "100%", maxWidth: "1300px", display: "flex", flexWrap: "wrap" }}>
            <div style={{ maxWidth: "640px", paddingTop: "clamp(30px, 6vw, 60px)" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 18px",
                  background: "#faefe3",
                  borderRadius: "999px",
                  fontSize: "14px",
                  fontWeight: "700",
                  marginBottom: "32px",
                  color: "#131b23",
                }}
              >
                <span style={{ color: "#a36d42", fontSize: "16px" }}>✦</span>{" "}
                AI-Powered Global Network
              </div>

              <h1
                className="text-[clamp(40px,8vw,65px)] max-[768px]:text-[36px] max-[540px]:text-[32px] max-[380px]:text-[26px]"
                style={{
                  lineHeight: "0.95",
                  fontWeight: "800",
                  marginBottom: "28px",
                  letterSpacing: "-0.04em",
                  color: "#071018",
                  wordWrap: "break-word",
                }}
              >
                Meet the Right People for
                <span style={{ display: "block", marginTop: "12px", whiteSpace: "normal" }}>
                  {" "}
                  <span style={{ color: "#a36d42" }}>Real Opportunities</span>
                </span>
              </h1>

              <p
                style={{
                  fontSize: "18px",
                  lineHeight: "1.45",
                  color: "#687787",
                  marginBottom: "35px",
                  maxWidth: "580px",
                  fontWeight: "400",
                }}
              >
                NetworkX helps professionals, entrepreneurs and businesses
                discover the right people, opportunities, mentors and resources
                — powered by AI.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "clamp(8px, 2vw, 16px)",
                  alignItems: "center",
                  flexWrap: "nowrap",
                  marginBottom: "50px",
                }}
              >
                <Link
                  href="/pricing"
                  style={{
                    background: "#a36d42",
                    color: "#fff",
                    padding: "clamp(10px, 2.5vw, 16px) clamp(16px, 4vw, 32px)",
                    borderRadius: "clamp(8px, 2vw, 12px)",
                    fontWeight: "600",
                    fontSize: "clamp(14px, 3vw, 16px)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "clamp(6px, 1.5vw, 12px)",
                    boxShadow: "0 8px 24px rgba(163, 109, 66, 0.25)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Get Started Free{" "}
                  <span style={{ fontSize: "clamp(16px, 3.5vw, 20px)", fontWeight: "300" }}>→</span>
                </Link>
                <a
                  href="#how-it-works"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "clamp(8px, 2vw, 14px)",
                    fontWeight: "600",
                    fontSize: "clamp(14px, 3vw, 16px)",
                    color: "#071018",
                    background: "#fff",
                    padding: "clamp(8px, 2.5vw, 14px) clamp(14px, 4vw, 28px)",
                    borderRadius: "clamp(8px, 2vw, 12px)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      border: "2.5px solid #071018",
                    }}
                  >
                    <svg
                      width="10"
                      height="12"
                      viewBox="0 0 10 12"
                      fill="#071018"
                      style={{ marginLeft: "2px" }}
                    >
                      <path d="M0 12V0L10 6L0 12Z" />
                    </svg>
                  </span>
                  Watch How It Works
                </a>
              </div>
            </div>

            <div style={{ position: "relative", flex: 1 }}>
              {/* Background image handles the right side visuals */}
            </div>
          </div>
        </div>
      </section>

      {/* How NetworkX Works Section overlay */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          padding: "0 40px",
          marginTop: "-80px",
          marginBottom: "80px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "#fffcf8",
            width: "100%",
            maxWidth: "1300px",
            borderRadius: "24px",
            padding: "40px 50px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.06)",
            border: "1px solid rgba(168, 110, 69, 0.1)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: "800",
                color: "#8a8a8a",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              How NetworkX Works
            </div>
            <h2
              style={{
                fontSize: "clamp(24px, 5vw, 32px)",
                fontWeight: "800",
                color: "#131b23",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              From Your Profile to{" "}
              <span style={{ color: "#a86e45" }}>Real Connections</span>
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 lg:gap-4 w-full">
            {[
              {
                step: 1,
                title: "1. Create Your Profile",
                desc: "Tell us about your skills, goals and what you're looking for.",
                color: "#faefe3",
                iconColor: "#7a4b27",
                icon: (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <line x1="19" y1="8" x2="19" y2="14"></line>
                    <line x1="22" y1="11" x2="16" y2="11"></line>
                  </svg>
                ),
              },
              {
                step: 2,
                title: "2. Get AI Matches",
                desc: "Our AI finds the most relevant people and opportunities for you.",
                color: "#f3e8ff",
                iconColor: "#8a4bf5",
                icon: (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path>
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path>
                  </svg>
                ),
              },
              {
                step: 3,
                title: "3. Connect & Collaborate",
                desc: "Build meaningful relationships and start conversations.",
                color: "#e6f7ed",
                iconColor: "#10a34b",
                icon: (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    <circle
                      cx="8"
                      cy="11"
                      r="1.5"
                      fill="currentColor"
                      stroke="none"
                    />
                    <circle
                      cx="12"
                      cy="11"
                      r="1.5"
                      fill="currentColor"
                      stroke="none"
                    />
                    <circle
                      cx="16"
                      cy="11"
                      r="1.5"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                ),
              },
              {
                step: 4,
                title: "4. Grow Together",
                desc: "Turn connections into opportunities and success.",
                color: "#faefe3",
                iconColor: "#7a4b27",
                icon: (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                ),
              },
            ].map((item, idx) => (
              <React.Fragment key={item.step}>
                <div
                  className="flex-1 flex items-center gap-4 w-full lg:w-auto"
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: "60px",
                      height: "60px",
                      borderRadius: "16px",
                      background: item.color,
                      color: item.iconColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: "15px",
                        fontWeight: "700",
                        marginBottom: "4px",
                        color: "#131b23",
                        whiteSpace: "normal",
                      }}
                    >
                      {item.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#687787",
                        lineHeight: "1.4",
                        margin: 0,
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
                {idx < 3 && (
                  <div className="hidden lg:block text-[#b5c0cc] px-2 shrink-0">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <section
        id="about"
        className="bg-[#fcf8f3] px-5 lg:px-10 py-16 lg:py-[120px]"
      >
        <div className="max-w-[1300px] mx-auto flex flex-col lg:flex-row gap-10 lg:gap-[80px] items-center lg:items-stretch w-full">
          {/* Left Column */}
          <div className="flex-1 w-full lg:max-w-[500px]">
            <div
              style={{
                fontSize: "11px",
                fontWeight: "800",
                color: "#8a8a8a",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}
            >
              What Makes NetworkX Different
            </div>
            <div
              style={{
                width: "48px",
                height: "3px",
                background:
                  "linear-gradient(to right, #a86e45 50%, #e9dbcf 50%)",
                marginTop: "12px",
                marginBottom: "24px",
              }}
            ></div>
            <h2
              style={{
                fontSize: "clamp(30px, 6vw, 42px)",
                fontWeight: "800",
                lineHeight: "1.05",
                color: "#131b23",
                marginBottom: "24px",
                letterSpacing: "-0.03em",
              }}
            >
              An Intelligent
              <br />
              <span style={{ color: "#a86e45" }}>Networking Experience</span>
              <br />
              Unlike Anything the
              <br />
              World Has Seen Before
            </h2>
            <p
              style={{
                fontSize: "15px",
                color: "#687787",
                lineHeight: "1.6",
                marginBottom: "40px",
              }}
            >
              NetworkX combines AI, business opportunities, mentorship, investor
              access, and practical tools into one intelligent growth ecosystem
              designed for modern professionals and entrepreneurs.
            </p>
            <a
              href="#solutions"
              className="bg-[#131b23] hover:bg-[#2a323c] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                color: "#fff",
                padding: "16px 32px",
                borderRadius: "12px",
                fontWeight: "600",
                fontSize: "15px",
                textDecoration: "none",
              }}
            >
              Explore Features
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#a36d42"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>

          {/* Right Column - Grid */}
          <div className="flex-[1.2] w-full grid grid-cols-1 sm:grid-cols-2 gap-5">
            {benefits.map((item, index) => (
              <div
                key={item.title}
                className="bg-[#fffcf8] rounded-[20px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-start sm:gap-5 relative overflow-hidden"
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: "56px",
                    height: "56px",
                    borderRadius: "14px",
                    background: "#faefe3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "800",
                      color: "#131b23",
                      marginBottom: "8px",
                    }}
                  >
                    {item.title}
                  </h3>
                  <div
                    style={{
                      width: "24px",
                      height: "2px",
                      background: "#a86e45",
                      marginBottom: "16px",
                    }}
                  ></div>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#687787",
                      lineHeight: "1.5",
                      margin: 0,
                    }}
                  >
                    {item.copy}
                  </p>
                </div>
                {/* Decorative background lines/nodes in bottom right */}
                <svg
                  style={{
                    position: "absolute",
                    bottom: "16px",
                    right: "16px",
                    opacity: 0.4,
                  }}
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                >
                  <path
                    d="M10 40 L25 30 L35 35 L45 15"
                    stroke="#a86e45"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="10" cy="40" r="2" fill="#a86e45" />
                  <circle cx="25" cy="30" r="2" fill="#a86e45" />
                  <circle cx="35" cy="35" r="2" fill="#a86e45" />
                  <circle cx="45" cy="15" r="2" fill="#a86e45" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="growth-intelligence"
        className="px-5 lg:px-10 py-16 lg:py-[120px] bg-gradient-to-br from-[#fffcf8] via-[#f6e8d6] to-[#faefe3] relative overflow-hidden"
      >
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-10 lg:gap-10 items-start lg:items-center w-full">
          {/* Left Column */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div
              style={{
                fontSize: "11px",
                fontWeight: "800",
                color: "#a86e45",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "24px",
              }}
            >
              NETWORKX GROWTH INTELLIGENCE
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                <line x1="16" y1="8" x2="2" y2="22"></line>
                <line x1="17.5" y1="15" x2="9" y2="15"></line>
              </svg>
            </div>
            <h2
              style={{
                fontSize: "clamp(32px, 6vw, 46px)",
                fontWeight: "800",
                lineHeight: "1.05",
                color: "#131b23",
                marginBottom: "20px",
                letterSpacing: "-0.03em",
              }}
            >
              Smarter
              <br />
              Opportunities.
              <br />
              <span style={{ color: "#a86e45" }}>Faster Growth.</span>
            </h2>
            <div
              style={{
                width: "40px",
                height: "3px",
                background: "#a86e45",
                marginBottom: "24px",
              }}
            ></div>
            <p
              style={{
                fontSize: "15px",
                color: "#556370",
                lineHeight: "1.6",
                marginBottom: "40px",
              }}
            >
              NetworkX connects people, ideas and opportunities with the power
              of AI. Get personalised recommendations, discover relevant
              opportunities and take the next best action to grow your career or
              business strategically.
            </p>
            <div
              style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "#faefe3",
                  color: "#8a5a3a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "#131b23",
                  lineHeight: "1.5",
                  margin: 0,
                }}
              >
                Personalised by your{" "}
                <strong>
                  business, industry,
                  <br />
                  location, goals
                </strong>{" "}
                and <strong>activity.</strong>
              </p>
            </div>
          </div>

          {/* Right Column - 5 Cards */}
          <div className="flex-1 w-full flex flex-row gap-4 overflow-x-auto pb-4 snap-x lg:overflow-visible">
            {[
              {
                theme: "dark",
                title: "AI Growth Advisor",
                desc: "Your personal AI growth companion that recommends the next best opportunities, actions and connections based on your goals.",
                icon: (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4" />
                    <line x1="8" y1="16" x2="8.01" y2="16" />
                    <line x1="16" y1="16" x2="16.01" y2="16" />
                  </svg>
                ),
              },
              {
                theme: "light",
                title: "AI Opportunity\nIntelligence",
                desc: "Discover emerging business opportunities, relevant demands and potential collaborations based on your industry, location and network activity.",
                icon: (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 17 9 11 13 15 21 7"></polyline>
                    <polyline points="14 7 21 7 21 14"></polyline>
                  </svg>
                ),
              },
              {
                theme: "dark",
                title: "Smart\nRecommendations",
                desc: "Get personalised suggestions for members, communities, events, open services and resources most relevant to you.",
                icon: (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                ),
              },
              {
                theme: "light",
                title: "Opportunity Alerts",
                desc: "Receive timely alerts when relevant business opportunities, requirements, events or collaborations match your profile and interests.",
                icon: (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                ),
              },
              {
                theme: "dark",
                title: "Deals Corner",
                desc: "Discover exclusive member offers, special deals, discounts and benefits available across the NetworkX ecosystem.",
                icon: (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                  </svg>
                ),
              },
            ].map((card, idx) => (
              <div
                key={idx}
                className="shrink-0 w-[260px] lg:w-auto lg:flex-1 rounded-2xl p-[30px_16px] lg:p-[40px_16px] text-center snap-start"
                style={{
                  background:
                    card.theme === "dark"
                      ? "linear-gradient(180deg, #221c18 0%, #110e0c 100%)"
                      : "#fffdfa",
                  color: card.theme === "dark" ? "#fff" : "#131b23",
                  boxShadow:
                    card.theme === "light"
                      ? "0 10px 30px rgba(0,0,0,0.03)"
                      : "0 10px 30px rgba(0,0,0,0.15)",
                  border:
                    card.theme === "light"
                      ? "1px solid rgba(168,110,69,0.1)"
                      : "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    margin: "0 auto 24px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      card.theme === "dark"
                        ? "radial-gradient(circle, rgba(168,110,69,0.3) 0%, rgba(0,0,0,0) 70%)"
                        : "radial-gradient(circle, rgba(168,110,69,0.15) 0%, rgba(255,255,255,0) 70%)",
                    border:
                      card.theme === "dark"
                        ? "1px solid rgba(168,110,69,0.5)"
                        : "1px solid rgba(168,110,69,0.2)",
                    color: card.theme === "dark" ? "#fbece1" : "#8a5a3a",
                  }}
                >
                  {card.icon}
                </div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: "800",
                    marginBottom: "16px",
                    whiteSpace: "pre-line",
                    lineHeight: "1.3",
                  }}
                >
                  {card.title}
                </h3>
                <div
                  style={{
                    width: "24px",
                    height: "2px",
                    background: "#a86e45",
                    margin: "0 auto 16px",
                  }}
                ></div>
                <p
                  style={{
                    fontSize: "12px",
                    color: card.theme === "dark" ? "#a5afba" : "#687787",
                    lineHeight: "1.6",
                    margin: 0,
                  }}
                >
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mobile-network-section" id="solutions">
        <div
          className="mobile-showcase"
          aria-label="NetworkX mobile app experience"
        >
          <div className="mobile-orbit mobile-orbit-orange" />
          <div className="mobile-orbit mobile-orbit-blue" />
          <div className="mobile-floor-rings" aria-hidden="true" />
          <div className="mobile-phone mobile-phone-left">
            <MobileAppMockup type="explore" />
          </div>
          <div className="mobile-phone mobile-phone-main">
            <MobileAppMockup type="growth" />
          </div>
          <div className="mobile-phone mobile-phone-right">
            <MobileAppMockup type="network" />
          </div>
        </div>
        <div className="mobile-network-copy">
          <div className="mobile-network-kicker">
            <FontAwesomeIcon icon={faMobileScreenButton} /> NetworkX. Anytime.
            Anywhere.
          </div>
          <h2>
            Your Business Network.
            <br />
            <span>Always With You.</span>
          </h2>
          <p>
            Access your connections, opportunities, AI recommendations, events,
            deals and business insights wherever you go — all from the{" "}
            <strong>
              Network<span>X</span>
            </strong>{" "}
            mobile app.
          </p>
          <div className="mobile-feature-grid">
            {appFeatures.map((item) => (
              <article key={item.title}>
                <span
                  className={`mobile-feature-icon ${item.tone}`}
                  aria-hidden="true"
                >
                  <FontAwesomeIcon icon={item.icon} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="flex flex-nowrap items-center justify-center sm:justify-start gap-2 sm:gap-4 w-full mt-7">
            <a
              className="flex-1 flex min-w-0 items-center justify-center p-2 sm:p-3 border border-[#89909a] rounded-lg transition-colors hover:bg-[#131b23] hover:text-[#fffcf8] group text-[var(--ink)]"
              href="#contact"
              aria-label="Download NetworkX on the App Store"
            >
              <FontAwesomeIcon icon={faApple} className="text-[clamp(24px,6vw,38px)] text-[var(--ink)] group-hover:text-[#fffcf8] transition-colors" />
              <span className="flex flex-col ml-1.5 sm:ml-2.5">
                <small className="text-[clamp(7px,2vw,10px)] leading-none uppercase">Download on the</small>
                <strong className="text-[clamp(12px,3.5vw,19px)] font-semibold leading-tight mt-0.5">App Store</strong>
              </span>
            </a>
            <a
              className="flex-1 flex min-w-0 items-center justify-center p-2 sm:p-3 border border-[#89909a] rounded-lg transition-colors hover:bg-[#131b23] hover:text-[#fffcf8] group text-[var(--ink)]"
              href="#contact"
              aria-label="Get NetworkX on Google Play"
            >
              <FontAwesomeIcon icon={faGooglePlay} className="text-[clamp(22px,5vw,32px)] text-[var(--ink)] group-hover:text-[#fffcf8] transition-colors" />
              <span className="flex flex-col ml-1.5 sm:ml-2.5">
                <small className="text-[clamp(7px,2vw,10px)] leading-none uppercase">GET IT ON</small>
                <strong className="text-[clamp(12px,3.5vw,19px)] font-semibold leading-tight mt-0.5">Google Play</strong>
              </span>
            </a>
          </div>
          <div className="mobile-trust-line">
            <FontAwesomeIcon icon={faShieldHalved} />
            <span>Secure. Reliable. Built for Business.</span>
          </div>
        </div>
      </section>



      <section
        id="member-stories"
        style={{
          padding: "120px 40px",
          background: "#ffffff",
          position: "relative",
        }}
      >
        <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
          {/* Header */}
          <header style={{ textAlign: "center", marginBottom: "80px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{ width: "40px", height: "2px", background: "#a86e45" }}
              ></div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  color: "#a86e45",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                }}
              >
                Real members. Real impact.
              </span>
              <div
                style={{ width: "40px", height: "2px", background: "#a86e45" }}
              ></div>
            </div>
            <h2
              style={{
                fontSize: "clamp(32px, 6vw, 48px)",
                fontWeight: "800",
                lineHeight: "1.05",
                color: "#131b23",
                marginBottom: "20px",
                letterSpacing: "-0.02em",
              }}
            >
              Connections That Created
              <br />
              <span style={{ color: "#a86e45" }}>Real Business Outcomes</span>
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "#687787",
                margin: 0,
                lineHeight: "1.6",
              }}
            >
              See how NetworkX members are building meaningful relationships,
              discovering opportunities
              <br className="h2-impact-desktop-break" /> and creating business
              across cities, industries and countries.
            </p>
          </header>

          {/* Stories Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "40px",
              marginBottom: "60px",
            }}
          >
            {impactStories.map((story) => (
              <article
                key={story.name}
                style={{
                  background: "#fffcf8",
                  borderRadius: "24px",
                  overflow: "hidden",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Image Header with Details */}
                <div
                  style={{
                    background: "#faefe3",
                    height: "280px",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                  }}
                >
                  {/* Portrait */}
                  <div style={{ position: "relative", width: "50%", height: "100%" }}>
                    <Image
                      src={story.portrait}
                      alt={story.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                      }}
                    />
                  </div>
                  {/* Identity Details in the Gap */}
                  <div
                    style={{
                      width: "50%",
                      padding: "32px 24px 32px 16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: "800",
                        color: "#131b23",
                        marginBottom: "4px",
                        lineHeight: 1.2,
                      }}
                    >
                      {story.name}
                    </h3>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#a86e45",
                        fontWeight: "700",
                        marginBottom: "16px",
                        lineHeight: 1.4,
                      }}
                    >
                      {story.role}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#687787",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ flexShrink: 0 }}
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span style={{ lineHeight: 1.3 }}>{story.location}</span>
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#687787",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ flexShrink: 0 }}
                        >
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                        <span style={{ lineHeight: 1.3 }}>{story.industry}</span>
                      </span>
                    </div>
                  </div>
                </div>
                {/* Card Body */}
                <div
                  style={{
                    padding: "32px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  <div style={{ marginBottom: "24px", position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        top: "-10px",
                        left: "-10px",
                        fontSize: "clamp(40px, 8vw, 60px)",
                        color: "rgba(168,110,69,0.1)",
                        fontFamily: "serif",
                        lineHeight: 1,
                      }}
                    >
                      "
                    </span>
                    <p
                      style={{
                        fontSize: "15px",
                        color: "#131b23",
                        fontStyle: "italic",
                        lineHeight: "1.7",
                        margin: 0,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {story.quote}
                    </p>
                  </div>
                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: "24px",
                      borderTop: "1px solid rgba(168,110,69,0.15)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#a86e45",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Outcome
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "#fff",
                        padding: "8px 16px",
                        borderRadius: "24px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: "#faefe3",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Image
                          src={story.outcomeIcon}
                          alt=""
                          width={12}
                          height={12}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "800",
                          color: "#131b23",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {story.outcome}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center", marginBottom: "80px" }}>
            <a
              href="mailto:hello@networkxcircle.com?subject=NetworkX%20Member%20Stories"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                background: "#131b23",
                color: "#fff",
                padding: "16px 32px",
                borderRadius: "12px",
                fontWeight: "600",
                fontSize: "15px",
                textDecoration: "none",
                boxShadow: "0 8px 20px rgba(19,27,35,0.15)",
              }}
            >
              View More Member Stories
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>

          {/* Proof Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 justify-center border-t border-[rgba(0,0,0,0.05)] pt-10 sm:pt-[60px] w-full">
            {impactProof.map((item) => (
              <div
                key={item.label}
                className="flex flex-col xl:flex-row items-center text-center xl:text-left gap-2 xl:gap-4 bg-[#fffcf8] p-4 xl:p-[20px_32px] rounded-[24px] xl:rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
              >
                <div className="w-10 h-10 xl:w-12 xl:h-12 shrink-0 rounded-full bg-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <Image src={item.icon} alt="" width={24} height={24} className="w-5 h-5 xl:w-6 xl:h-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] xl:text-[20px] font-extrabold text-[#131b23] leading-[1.2]">
                    {item.value}
                  </div>
                  <div className="text-[11px] xl:text-[13px] text-[#687787] font-semibold mt-0.5 leading-tight">
                    {item.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="membership-section"
        id="membership"
        aria-labelledby="membership-title"
      >
        <header className="membership-header">
          <div className="membership-eyebrow">
            <i />
            Membership
            <i />
          </div>
          <h2 id="membership-title">
            Choose How You Want to <span>Grow</span>
          </h2>
          <p>
            Select the plan that fits where you are today and unlock powerful
            tools,
            <br className="membership-desktop-break" /> global connections and
            real opportunities to grow your business.
          </p>
        </header>

        <div className="membership-plan-grid">
          {membershipPlans.map((plan) => (
            <article
              className={`membership-plan membership-plan-${plan.id}${plan.featured ? " is-featured" : ""}`}
              key={plan.id}
            >
              {plan.featured && (
                <div className="membership-popular">Most Popular</div>
              )}
              <div className="membership-plan-top">
                <div className="membership-plan-identity">
                  <Image src={plan.icon} alt="" width={66} height={66} />
                  <div>
                    <h3>{plan.title}</h3>
                    <p>{plan.subtitle}</p>
                  </div>
                </div>
              </div>
              <div
                className="membership-prices"
                aria-label={`${plan.title} annual pricing`}
                style={{ gridTemplateColumns: '1fr' }}
              >
                <div style={{ border: 'none', paddingLeft: 0 }}>
                  <p>
                    <strong>{plan.globalPrice}</strong>
                    <small>/ year</small>
                  </p>
                </div>
              </div>
              <p className="membership-description">{plan.description}</p>
              <div className="membership-best-for">
                <strong>
                  <Image src={plan.badgeIcon} alt="" width={23} height={23} />
                  Best for
                </strong>
                <p>{plan.bestFor}</p>
              </div>
              <a
                className="membership-plan-cta"
                href="/pricing"
                aria-label={`${plan.cta} membership plan`}
              >
                <span>{plan.cta}</span>
                <FontAwesomeIcon icon={faArrowRight} />
              </a>
            </article>
          ))}
        </div>

        <a className="membership-compare" href="/pricing">
          <Image
            src="/images/section-7/icon-compare.svg"
            alt=""
            width={62}
            height={62}
          />
          <span>
            <strong>Compare All Membership Benefits</strong>
            <small>
              See the complete feature breakdown and benefits across all plans.
            </small>
          </span>
          <FontAwesomeIcon icon={faArrowRight} />
        </a>

        <div className="membership-trust" aria-label="Membership assurances">
          {membershipTrust.map((item) => (
            <article key={item.title}>
              <Image src={item.icon} alt="" width={52} height={52} />
              <div>
                <strong>{item.title}</strong>
                <span>{item.copy}</span>
              </div>
            </article>
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
