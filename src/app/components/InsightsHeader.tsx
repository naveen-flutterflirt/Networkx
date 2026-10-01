import Image from "next/image";
import Link from "next/link";

export default function InsightsHeader() {
  return (
    <header className="insights-site-header">
      <Link href="/" aria-label="NetworkX home"><Image src="/brand/networkx-logo-header.png" alt="NetworkX" width={620} height={100} priority /></Link>
      <nav aria-label="Insights navigation"><Link href="/">Home</Link><Link href="/resources">Insights</Link><Link href="/pricing">Membership</Link><Link href="/about">About</Link></nav>
      <Link className="insights-join" href="/pricing">Join NetworkX <span>↗</span></Link>
    </header>
  );
}
