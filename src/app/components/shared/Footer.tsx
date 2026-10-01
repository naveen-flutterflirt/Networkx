import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faInstagram, faLinkedinIn, faTwitter } from "@fortawesome/free-brands-svg-icons";
import NewsletterForm from "@/app/components/NewsletterForm";

type LocalImageProps = React.ComponentPropsWithoutRef<"img"> & {
  priority?: boolean;
};

function Image({ priority, ...props }: LocalImageProps) {
  return <img {...props} fetchPriority={priority ? "high" : undefined} />;
}

// Real, shared site footer — extracted verbatim from the home page's
// inline markup (the only place with the actual full footer: newsletter
// signup, social links, full 6-column grid). about/pricing each had
// their own separate, much simpler footer instead (no newsletter, no
// social row, 4 links) — this replaces those with the real one for
// consistency. insights pages had no footer at all.
//
// Same fix as Header.tsx: same-page hash anchors (#solutions, #contact,
// etc.) only work correctly when rendered ON the home page itself — on
// any other page they'd just look for that id on the CURRENT page and
// find nothing. Prefixed with "/" so they navigate back to the home
// page's sections regardless of which page this footer is rendered on.
export default function Footer() {
  return (
    <footer id="contact">
      <div className="footer-grid">
        <div className="footer-brand">
          <Image src="/brand/networkx-logo-header.png" alt="NetworkX" width={620} height={100} />
          <p>The global business networking platform that connects people, ideas and opportunities to build a better future.</p>
          <div className="social-row">
            <a href="/#contact" aria-label="NetworkX on LinkedIn"><FontAwesomeIcon icon={faLinkedinIn} /></a>
            <a href="/#contact" aria-label="NetworkX on Twitter"><FontAwesomeIcon icon={faTwitter} /></a>
            <a href="/#contact" aria-label="NetworkX on Facebook"><FontAwesomeIcon icon={faFacebookF} /></a>
            <a href="/#contact" aria-label="NetworkX on Instagram"><FontAwesomeIcon icon={faInstagram} /></a>
          </div>
        </div>
        <div><strong>Platform</strong><a href="/#solutions">Explore</a><Link href="/about">How It Works</Link><a href="/#solutions">Mobile App</a><Link href="/pricing">Pricing</Link><a href="/#resources">AI Features</a></div>
        <div><strong>Community</strong><a href="/#community">Communities</a><a href="/#community">Events</a><a href="/#community">Chapters</a><a href="/#contact">Become a Host</a><a href="/#community">Member Stories</a></div>
        <div><strong>Resources</strong><Link href="/resources">Blog</Link><Link href="/resources">Guides</Link><Link href="/resources">Webinars</Link><a href="/#contact">Help Center</a><a href="/#contact">Support</a></div>
        <div><strong>Company</strong><Link href="/about">About Us</Link><a href="/#contact">Careers</a><a href="/#contact">Press</a><a href="/#contact">Partners</a><a href="/#contact">Contact Us</a></div>
        <div className="newsletter"><strong>Newsletter</strong><p>Subscribe to get the latest updates and opportunities.</p><NewsletterForm /></div>
      </div>
      <div className="footer-bottom"><span>© 2026 NetworkX. All rights reserved.</span><div><a href="/#contact">Privacy Policy</a><a href="/#contact">Terms of Service</a><a href="/#contact">Cookie Policy</a></div></div>
    </footer>
  );
}
