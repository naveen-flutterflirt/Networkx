"use client";

import { useState } from "react";

const faqs = [
  {
    question:
      "What makes NetworkX different from other networking communities?",
    answer:
      "NetworkX goes beyond traditional networking by combining AI-powered matchmaking, global member discovery, business opportunities, Deals, mentorship and investor access, learning resources, travel networking, events, CRM tools and growth intelligence in one business ecosystem. The goal is not just to help you meet more people, but to help you discover more relevant connections and opportunities.",
  },
  {
    question: "Who can join NetworkX?",
    answer:
      "NetworkX is designed for a broad business community including professionals, entrepreneurs, business owners, founders, solopreneurs, womenpreneurs, consultants, mentors, investors and industry leaders who want to build meaningful business relationships and grow their network.",
  },
  {
    question: "Is NetworkX only for entrepreneurs and founders?",
    answer:
      "No. NetworkX is built for professionals, business owners, solopreneurs, womenpreneurs, entrepreneurs, founders and other growth-focused individuals across industries. You do not need to be a founder to become part of the community.",
  },
  {
    question: "How does AI matchmaking work?",
    answer:
      "NetworkX uses information such as your industry, location, expertise, interests, business goals and networking preferences to recommend relevant members, opportunities and communities. AI helps reduce random networking and makes discovery more focused, while the final decision to connect always remains with you.",
  },
  {
    question: "Can I connect with members in other cities or countries?",
    answer:
      "Yes. NetworkX is designed for both local and global networking. You can discover relevant members across cities, countries and industries, while travel-networking features are designed to help you identify useful connections in places you plan to visit.",
  },
  {
    question: "What are the membership options?",
    answer:
      "NetworkX offers multiple annual membership levels based on the depth of access you need. Plans may provide different levels of access to community networking, AI features, opportunities, learning, visibility, events and premium benefits. You can compare the latest plans and inclusions on the Membership page.",
  },
  {
    question: "How does NetworkX help me find relevant business opportunities?",
    answer:
      "NetworkX brings together member-posted business requirements, collaboration opportunities, referrals, Deals and AI-powered recommendations in one ecosystem. Based on your profile, industry, location and interests, the platform helps you discover opportunities that may be more relevant to your business instead of relying only on manual search.",
  },
  {
    question: "How do Business Opportunities and Deals work?",
    answer:
      "The Opportunities section allows eligible members to discover or post genuine business requirements, partnership needs and collaboration opportunities. The Deals section enables members to share exclusive offers, benefits and discounts with the NetworkX community. Access and posting rights may vary by membership plan.",
  },
  {
    question: "Is the mobile app included in membership?",
    answer:
      "Mobile platform access is available with eligible NetworkX memberships, subject to the features included in your selected plan and availability in your region. The app is designed to provide access to networking, opportunities, events, communication and other NetworkX tools on the go.",
  },
  {
    question: "Are there physical networking events as well?",
    answer:
      "Yes. NetworkX combines digital networking with online sessions, training, community activities and selected physical networking events and summits. Event access, invitations and benefits may vary by country, city and membership plan.",
  },
  {
    question: "Can I upgrade my membership later?",
    answer:
      "Yes. Members can generally move to a higher membership level as their networking and business needs grow. The applicable upgrade amount, additional benefits and billing adjustment will be shown at the time of upgrade.",
  },
  {
    question: "How does regional/global pricing work?",
    answer:
      "NetworkX may offer regional pricing based on the member’s country or market. The relevant price, currency and applicable taxes will be displayed before payment, allowing NetworkX to maintain appropriate pricing for different markets while providing access to the same global ecosystem.",
  },
];

const highlights = [
  {
    icon: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />,
    icon2: <circle cx="9" cy="7" r="4" />,
    icon3: <polyline points="16 11 18 13 22 9" />,
    title: "Built for Business",
    copy: "Entrepreneurs, professionals & growth-focused companies",
  },
  {
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    title: "Trusted & Secure",
    copy: "Your privacy and data security are our priority",
  },
  {
    icon: <circle cx="12" cy="12" r="10" />,
    icon2: <line x1="2" y1="12" x2="22" y2="12" />,
    icon3: (
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    ),
    title: "Global Community",
    copy: "Connect across 9+ countries and 59+ industry verticals",
  },
  {
    icon: <rect x="3" y="11" width="18" height="10" rx="2" />,
    icon2: <circle cx="12" cy="5" r="2" />,
    icon3: <path d="M12 7v4" />,
    title: "AI-Powered",
    copy: "Intelligent matchmaking that saves you time",
  },
];

function FaqAccordion({ item, index }: { item: any; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        border: isOpen
          ? "1px solid rgba(168,110,69,0.3)"
          : "1px solid transparent",
      }}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
          <span
            style={{ color: "#a86e45", fontWeight: "800", fontSize: "16px" }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3
            style={{
              fontSize: "15px",
              fontWeight: "700",
              color: "#131b23",
              margin: 0,
              lineHeight: "1.4",
            }}
          >
            {item.question}
          </h3>
        </div>
        <div
          style={{
            color: "#a86e45",
            flexShrink: 0,
            transition: "transform 0.3s ease",
            transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
      </div>

      {isOpen && (
        <div
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(168,110,69,0.1)",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#687787",
              lineHeight: "1.6",
              margin: 0,
            }}
          >
            {item.answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function HomeFaqSection() {
  return (
    <section
      id="faqs"
      style={{
        padding: "120px 40px",
        background: "#fffcf8",
        fontFamily: "sans-serif",
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
              Frequently Asked Questions
            </span>
            <div
              style={{ width: "40px", height: "2px", background: "#a86e45" }}
            ></div>
          </div>
          <h2
            style={{
              fontSize: "48px",
              fontWeight: "800",
              lineHeight: "1.05",
              color: "#131b23",
              marginBottom: "20px",
              letterSpacing: "-0.02em",
            }}
          >
            Everything You May Want to
            <br />
            Know <span style={{ color: "#a86e45" }}>Before Joining</span>
          </h2>
          <p style={{ fontSize: "16px", color: "#687787", margin: 0 }}>
            Clear answers to the most common questions about NetworkX.
          </p>
        </header>

        {/* Highlights */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: "80px",
          }}
        >
          {highlights.map((item) => (
            <div
              key={item.title}
              style={{
                background: "#fff",
                borderRadius: "20px",
                padding: "32px 24px",
                textAlign: "center",
                flex: "1 1 250px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "#faefe3",
                  color: "#a86e45",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {item.icon}
                  {item.icon2}
                  {item.icon3}
                </svg>
              </div>
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
          ))}
        </div>

        {/* FAQ Grid */}
        <div
          style={{
            display: "flex",
            gap: "40px",
            flexWrap: "wrap",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              flex: "1 1 450px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {faqs.slice(0, 6).map((item, index) => (
              <FaqAccordion key={index} item={item} index={index} />
            ))}
          </div>
          <div
            style={{
              flex: "1 1 450px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {faqs.slice(6, 12).map((item, index) => (
              <FaqAccordion key={index + 6} item={item} index={index + 6} />
            ))}
          </div>
        </div>

        {/* Support Aside */}
        <aside className="max-w-[1000px] mx-auto mt-12 md:mt-20 bg-[#131b23] rounded-3xl p-6 sm:p-8 md:p-[40px_60px] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8 shadow-[0_20px_40px_rgba(19,27,35,0.15)]">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-2xl bg-white/5 text-[#f3ce95] flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 md:w-8 md:h-8"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div>
              <h3 className="text-lg md:text-[20px] font-extrabold text-white mb-1">
                Still have questions?
              </h3>
              <p className="text-xs md:text-[14px] text-[#a5afba] m-0">
                Our team is here to help you.
              </p>
            </div>
          </div>
          <a
            href="mailto:hello@networkxcircle.com?subject=NetworkX%20Support"
            className="inline-flex items-center gap-3 bg-[#f3ce95] text-[#131b23] px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold text-sm md:text-[15px] no-underline transition-colors hover:bg-[#e6c085] border-none w-full md:w-auto justify-center"
          >
            Contact Support
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
        </aside>
      </div>
    </section>
  );
}
