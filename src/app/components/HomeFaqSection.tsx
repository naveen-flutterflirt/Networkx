"use client";

/* eslint-disable @next/next/no-img-element */

const highlights = [
  {
    icon: "/images/section-8/icon-business-leaders.svg",
    title: "Built for Business Leaders",
    copy: "Entrepreneurs, professionals & growth-focused companies",
  },
  {
    icon: "/images/section-8/icon-trusted-secure.svg",
    title: "Trusted & Secure",
    copy: "Your privacy and data security are our priority",
  },
  {
    icon: "/images/section-8/icon-global-community.svg",
    title: "Global Community",
    copy: "Connect across 9+ countries and 59+ industry verticals",
  },
  {
    icon: "/images/section-8/icon-ai-powered.svg",
    title: "AI-Powered",
    copy: "Intelligent matchmaking that saves you time",
  },
];

const faqs = [
  {
    question: "What makes NetworkX different from other networking communities?",
    answer: "NetworkX goes beyond traditional networking by combining AI-powered matchmaking, global member discovery, business opportunities, Deals, mentorship and investor access, learning resources, travel networking, events, CRM tools and growth intelligence in one business ecosystem. The goal is not just to help you meet more people, but to help you discover more relevant connections and opportunities.",
  },
  {
    question: "Who can join NetworkX?",
    answer: "NetworkX is designed for a broad business community including professionals, entrepreneurs, business owners, founders, solopreneurs, womenpreneurs, consultants, mentors, investors and industry leaders who want to build meaningful business relationships and grow their network.",
  },
  {
    question: "Is NetworkX only for entrepreneurs and founders?",
    answer: "No. NetworkX is built for professionals, business owners, solopreneurs, womenpreneurs, entrepreneurs, founders and other growth-focused individuals across industries. You do not need to be a founder to become part of the community.",
  },
  {
    question: "How does AI matchmaking work?",
    answer: "NetworkX uses information such as your industry, location, expertise, interests, business goals and networking preferences to recommend relevant members, opportunities and communities. AI helps reduce random networking and makes discovery more focused, while the final decision to connect always remains with you.",
  },
  {
    question: "Can I connect with members in other cities or countries?",
    answer: "Yes. NetworkX is designed for both local and global networking. You can discover relevant members across cities, countries and industries, while travel-networking features are designed to help you identify useful connections in places you plan to visit.",
  },
  {
    question: "What are the membership options?",
    answer: "NetworkX offers multiple annual membership levels based on the depth of access you need. Plans may provide different levels of access to community networking, AI features, opportunities, learning, visibility, events and premium benefits. You can compare the latest plans and inclusions on the Membership page.",
  },
  {
    question: "How does NetworkX help me find relevant business opportunities?",
    answer: "NetworkX brings together member-posted business requirements, collaboration opportunities, referrals, Deals and AI-powered recommendations in one ecosystem. Based on your profile, industry, location and interests, the platform helps you discover opportunities that may be more relevant to your business instead of relying only on manual search.",
  },
  {
    question: "How do Business Opportunities and Deals work?",
    answer: "The Opportunities section allows eligible members to discover or post genuine business requirements, partnership needs and collaboration opportunities. The Deals section enables members to share exclusive offers, benefits and discounts with the NetworkX community. Access and posting rights may vary by membership plan.",
  },
  {
    question: "Is the mobile app included in membership?",
    answer: "Mobile platform access is available with eligible NetworkX memberships, subject to the features included in your selected plan and availability in your region. The app is designed to provide access to networking, opportunities, events, communication and other NetworkX tools on the go.",
  },
  {
    question: "Are there physical networking events as well?",
    answer: "Yes. NetworkX combines digital networking with online sessions, training, community activities and selected physical networking events and summits. Event access, invitations and benefits may vary by country, city and membership plan.",
  },
  {
    question: "Can I upgrade my membership later?",
    answer: "Yes. Members can generally move to a higher membership level as their networking and business needs grow. The applicable upgrade amount, additional benefits and billing adjustment will be shown at the time of upgrade.",
  },
  {
    question: "How does regional/global pricing work?",
    answer: "NetworkX may offer regional pricing based on the member’s country or market. The relevant price, currency and applicable taxes will be displayed before payment, allowing NetworkX to maintain appropriate pricing for different markets while providing access to the same global ecosystem.",
  },
];

function FaqColumn({ start, end, column }: { start: number; end: number; column: 0 | 1 }) {
  return (
    <div className="faq-column">
      {faqs.slice(start, end).map((item, localIndex) => {
        const index = start + localIndex;
        const number = String(index + 1).padStart(2, "0");
        const answerId = `faq-answer-${column}-${index}`;

        return (
          <details className="faq-item" key={item.question}>
            <summary className="faq-question" aria-controls={answerId}>
              <span className="faq-number" aria-hidden="true">{number}</span>
              <span>{item.question}</span>
              <img src="/images/section-8/icon-plus.svg" alt="" width="24" height="24" />
            </summary>
            <div className="faq-answer" id={answerId}>
              <p>{item.answer}</p>
            </div>
          </details>
        );
      })}
    </div>
  );
}

export default function HomeFaqSection() {
  return (
    <section className="faq-section" id="faqs" aria-labelledby="faq-title">
      <header className="faq-header">
        <div className="faq-badge"><img src="/images/section-8/icon-faq.svg" alt="" width="22" height="22" />FAQs</div>
        <h2 id="faq-title">Everything You May Want to<br />Know <span>Before Joining</span></h2>
        <p>Clear answers to the most common questions about <span>NetworkX</span></p>
      </header>

      <div className="faq-highlights" aria-label="Why people choose NetworkX">
        {highlights.map((item) => (
          <article key={item.title}>
            <img src={item.icon} alt="" width="64" height="64" />
            <div><h3>{item.title}</h3><p>{item.copy}</p></div>
          </article>
        ))}
      </div>

      <div className="faq-grid">
        <FaqColumn start={0} end={6} column={0} />
        <FaqColumn start={6} end={12} column={1} />
      </div>

      <aside className="faq-support" aria-label="NetworkX support">
        <div className="faq-support-intro">
          <img src="/images/section-8/icon-question.svg" alt="" width="68" height="68" />
          <div><h3>Still have questions?</h3><p>We’re here to help you.</p></div>
        </div>
        <div className="faq-support-team">
          <div className="faq-support-avatars" aria-label="NetworkX support team">
            {[1, 2, 3].map((member) => <img key={member} src={`/images/section-8/support-member-0${member}.png`} alt={`NetworkX support team member ${member}`} width="56" height="56" />)}
          </div>
          <p>Our team will get back to you as soon as possible.</p>
        </div>
        <a href="mailto:hello@networkxcircle.com?subject=NetworkX%20Support">Contact Support <img src="/images/section-8/icon-arrow.svg" alt="" width="20" height="20" /></a>
      </aside>
    </section>
  );
}
