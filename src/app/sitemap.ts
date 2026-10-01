import type { MetadataRoute } from "next";
import { insights } from "@/app/data/insights";

const siteUrl = "https://www.networkxcircle.com";
const apiUrl = (process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let circles: any[] = [];
  try {
    const response = await fetch(`${apiUrl}/v1/circles/public-index`, { next: { revalidate: 3600 } });
    if (response.ok) {
      const payload = await response.json();
      circles = (payload?.data?.items || []).filter((circle: any) => circle.public_slug);
    }
  } catch {
    // Keep the rest of the sitemap available during a temporary API outage.
  }

  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: .7 },
    { url: `${siteUrl}/pricing`, changeFrequency: "monthly", priority: .8 },
    { url: `${siteUrl}/community`, changeFrequency: "weekly", priority: .8 },
    { url: `${siteUrl}/resources`, changeFrequency: "weekly", priority: .8 },
    ...circles.map((circle) => ({
      url: `${siteUrl}/community/${circle.public_slug}`,
      lastModified: circle.updated_at ? new Date(circle.updated_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: .8,
    })),
    ...insights.map((insight) => ({ url: `${siteUrl}/resources/${insight.slug}`, changeFrequency: "monthly" as const, priority: .7 })),
  ];
}
