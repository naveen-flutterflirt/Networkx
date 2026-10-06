import type { Metadata } from "next";
import Home2Client from "./Home2Client";
import "./home2.css";

export const metadata: Metadata = {
  title: "NetworkX Home 2 | The Business Network Built for What’s Next",
  description:
    "Discover a global, AI-powered business network built to create meaningful connections, opportunities and measurable growth.",
};

export default function Home2Page() {
  return <Home2Client />;
}
