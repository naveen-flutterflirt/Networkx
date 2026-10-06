export type Insight = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly category: string;
  readonly readingTime: string;
  readonly excerpt: string;
  readonly primaryKeyword: string;
  readonly secondaryKeywords: readonly string[];
  readonly seoTitle: string;
  readonly metaDescription: string;
  readonly cover: string;
  readonly ogImage: string;
  readonly h1: string;
};

export const insights = [
  {
    id: "01",
    slug: "how-ai-is-changing-business-networking",
    title: "How AI Is Changing Business Networking",
    category: "AI & Technology",
    readingTime: "6 min read",
    excerpt:
      "Discover how AI matchmaking is helping professionals find the right people, opportunities and partnerships faster than ever.",
    primaryKeyword: "AI business networking",
    secondaryKeywords: [
      "AI networking platform",
      "AI matchmaking for business",
      "business networking technology",
      "intelligent networking",
    ],
    seoTitle: "How AI Is Changing Business Networking | NetworkX",
    metaDescription:
      "Learn how AI is transforming business networking through smarter matchmaking, relevant recommendations and more intelligent opportunity discovery.",
    cover: "/assets/insights/cover-ai-business-networking.png",
    ogImage: "/assets/insights/og-ai-business-networking.jpg",
    h1: "How AI Is Changing Business Networking",
  },
  {
    id: "02",
    slug: "right-business-connections-matter-more",
    title:
      "Why the Right Business Connections Matter More Than More Connections",
    category: "Networking",
    readingTime: "5 min read",
    excerpt:
      "It’s not about quantity, it’s about quality. Learn how meaningful connections drive growth, trust and long-term success.",
    primaryKeyword: "business connections",
    secondaryKeywords: [
      "meaningful business relationships",
      "quality networking",
      "strategic networking",
      "business relationship building",
    ],
    seoTitle: "Why the Right Business Connections Matter More | NetworkX",
    metaDescription:
      "Learn why quality business connections often matter more than a large contact list and how strategic relationships can create better opportunities.",
    cover: "/assets/insights/cover-right-business-connections.png",
    ogImage: "/assets/insights/og-right-business-connections.jpg",
    h1: "Why the Right Business Connections Matter More Than More Connections",
  },
  {
    id: "03",
    slug: "build-business-opportunities-across-cities-countries",
    title: "How to Build Business Opportunities Across Cities and Countries",
    category: "Global Growth",
    readingTime: "7 min read",
    excerpt:
      "Break boundaries and unlock global opportunities. Learn how to expand your network beyond borders and create new business possibilities.",
    primaryKeyword: "global business opportunities",
    secondaryKeywords: [
      "international business networking",
      "cross-border networking",
      "global business connections",
      "expand business internationally",
    ],
    seoTitle:
      "How to Build Global Business Opportunities Across Markets | NetworkX",
    metaDescription:
      "Learn how to create business opportunities across cities and countries through strategic networking, local relevance and cross-border collaboration.",
    cover: "/assets/insights/cover-global-business-opportunities.png",
    ogImage: "/assets/insights/og-global-business-opportunities.jpg",
    h1: "How to Build Business Opportunities Across Cities and Countries",
  },
  {
    id: "04",
    slug: "ai-matchmaking-business-connections",
    title:
      "How AI Matchmaking Can Help You Find the Right Business Connections",
    category: "AI & Technology",
    readingTime: "6 min read",
    excerpt:
      "See how AI can use goals, industry, location and intent to surface more relevant business connections.",
    primaryKeyword: "AI matchmaking for business",
    secondaryKeywords: [
      "AI business matchmaking",
      "intelligent networking",
      "business networking AI",
      "professional matchmaking",
      "AI networking platform",
      "relevant business connections",
    ],
    seoTitle:
      "AI Matchmaking for Business: Find Better Connections Faster | NetworkX",
    metaDescription:
      "Discover how AI matchmaking can help professionals find relevant business connections, collaborators, mentors and opportunities based on goals, industry and location.",
    cover: "/assets/insights/cover-ai-matchmaking-business-connections.png",
    ogImage: "/assets/insights/og-ai-matchmaking-business-connections.jpg",
    h1: "How AI Matchmaking Can Help You Find the Right Business Connections",
  },
  {
    id: "05",
    slug: "business-networking-while-travelling",
    title: "How to Network Effectively When Travelling for Business",
    category: "Global Networking",
    readingTime: "6 min read",
    excerpt:
      "Turn business travel into a smarter networking opportunity by discovering relevant people before you arrive.",
    primaryKeyword: "business networking while travelling",
    secondaryKeywords: [
      "network while travelling",
      "business travel networking",
      "networking in another city",
      "international networking",
      "meet business people while travelling",
      "global professional networking",
    ],
    seoTitle:
      "Business Networking While Travelling: Meet the Right People | NetworkX",
    metaDescription:
      "Learn how to find relevant professionals, business owners and potential collaborators when travelling to another city or country for business.",
    cover: "/assets/insights/cover-business-networking-while-travelling.png",
    ogImage: "/assets/insights/og-business-networking-while-travelling.jpg",
    h1: "How to Network Effectively When Travelling for Business",
  },
  {
    id: "06",
    slug: "turn-business-networking-into-opportunities",
    title: "How to Turn Business Networking Into Real Opportunities",
    category: "Business Growth",
    readingTime: "7 min read",
    excerpt:
      "Move beyond collecting contacts and learn how relationships can lead to referrals, collaborations, partnerships and opportunities.",
    primaryKeyword: "business networking opportunities",
    secondaryKeywords: [
      "business networking strategy",
      "generate business through networking",
      "networking opportunities",
      "business referrals",
      "strategic partnerships",
      "professional networking",
    ],
    seoTitle:
      "How to Turn Business Networking Into Real Opportunities | NetworkX",
    metaDescription:
      "Learn how professionals can move beyond exchanging contacts and turn business networking into partnerships, referrals, collaborations and opportunities.",
    cover: "/assets/insights/cover-turn-networking-into-opportunities.png",
    ogImage: "/assets/insights/og-turn-networking-into-opportunities.jpg",
    h1: "How to Turn Business Networking Into Real Opportunities",
  },
] as const satisfies readonly Insight[];

export function getInsight(slug: string) {
  return insights.find((insight) => insight.slug === slug);
}
