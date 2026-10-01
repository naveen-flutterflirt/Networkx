import Link from "next/link";
import MobileNavMenu from "./MobileNavMenu";

type LocalImageProps = React.ComponentPropsWithoutRef<"img"> & {
  priority?: boolean;
};

// Same local-preview <img> shim used on the home page — avoids depending
// on the Cloudflare Images binding, which is only available in the
// hosted runtime.
function Image({ priority, ...props }: LocalImageProps) {
  return <img {...props} fetchPriority={priority ? "high" : undefined} />;
}

// Real, shared site header — extracted verbatim from the home page's
// inline markup, which was the only place with the actual header (about/
// pricing had none at all; insights used a separate, different
// InsightsHeader component). Uses relative anchors (#top, #solutions,
// etc.) for same-page sections on the home page itself; on other pages
// these correctly navigate back to the home page's sections since they
// resolve relative to whatever page is currently rendered — no change
// needed there, Next.js/browser anchor resolution handles it.
export default function Header() {
  return (
    <header className="site-header">
      <a href="/#top" className="logo-link" aria-label="NetworkX home">
        <Image src="/brand/networkx-logo-header.png" alt="NetworkX" width={620} height={100} priority />
      </a>
      <nav className="desktop-nav" aria-label="Primary navigation">
        <a href="/#top">Home</a>
        <Link href="/about">About</Link>
        <a href="/#solutions">Solutions</a>
        <a href="/#community">Community</a>
        <Link href="/resources">Resources</Link>
        <Link href="/pricing">Pricing</Link>
        <a href="/#contact">Contact</a>
      </nav>
      <div className="header-actions">
        <a className="login-link" href="/login">Log in</a>
        <Link className="button button-small" href="/pricing">Join NetworkX <span>↗</span></Link>
      </div>
      <MobileNavMenu />
    </header>
  );
}
