import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebookF,
  faInstagram,
  faLinkedinIn,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
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
    <footer
      id="contact"
      style={{
        background: "var(--night)",
        color: "var(--muted)",
        fontFamily: "sans-serif",
      }}
    >
      <div className="footer-top">
        {/* Brand Column */}
        <div style={{ flex: "1 1 320px", maxWidth: "320px" }}>
          <Image
            src="/brand/networkx-logo-header.png"
            alt="NetworkX Logo"
            width={200}
            height={50}
            style={{ height: "48px", width: "auto", filter: "invert(1) hue-rotate(180deg)" }}
          />
          <p
            style={{
              fontSize: "14px",
              lineHeight: "1.6",
              marginTop: "16px",
              marginBottom: "32px",
            }}
          >
            The global business networking platform that connects people, ideas
            and opportunities to build a better future.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <a
              href="/#contact"
              aria-label="NetworkX on LinkedIn"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "var(--panel)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              <FontAwesomeIcon icon={faLinkedinIn} style={{ width: "16px" }} />
            </a>
            <a
              href="/#contact"
              aria-label="NetworkX on Twitter"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "var(--panel)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              <FontAwesomeIcon icon={faTwitter} style={{ width: "16px" }} />
            </a>
            <a
              href="/#contact"
              aria-label="NetworkX on Facebook"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "var(--panel)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              <FontAwesomeIcon icon={faFacebookF} style={{ width: "16px" }} />
            </a>
            <a
              href="/#contact"
              aria-label="NetworkX on Instagram"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "var(--panel)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              <FontAwesomeIcon icon={faInstagram} style={{ width: "16px" }} />
            </a>
          </div>
        </div>

        {/* Links Columns */}
        {/* Links Columns */}
        <div className="footer-links-grid">
          <div className="footer-link-col">
            <div style={{ marginBottom: "24px" }}>
              <strong
                style={{
                  color: "var(--ink)",
                  fontSize: "15px",
                  fontWeight: "700",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Platform
              </strong>
              <div
                style={{
                  width: "24px",
                  height: "2px",
                  background: "var(--orange)",
                }}
              ></div>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <a
                href="/#solutions"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Explore
              </a>
              <Link
                href="/about"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                How It Works
              </Link>
              <a
                href="/#solutions"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Mobile App
              </a>
              <Link
                href="/pricing"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Pricing
              </Link>
              <a
                href="/#resources"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                AI Features
              </a>
            </div>
          </div>

          <div className="footer-link-col">
            <div style={{ marginBottom: "24px" }}>
              <strong
                style={{
                  color: "var(--ink)",
                  fontSize: "15px",
                  fontWeight: "700",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Community
              </strong>
              <div
                style={{
                  width: "24px",
                  height: "2px",
                  background: "var(--orange)",
                }}
              ></div>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <a
                href="/#community"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Communities
              </a>
              <a
                href="/#community"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Events
              </a>
              <a
                href="/#community"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Chapters
              </a>
              <a
                href="/#contact"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Become a Host
              </a>
              <a
                href="/#community"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Member Stories
              </a>
            </div>
          </div>

          <div className="footer-link-col">
            <div style={{ marginBottom: "24px" }}>
              <strong
                style={{
                  color: "var(--ink)",
                  fontSize: "15px",
                  fontWeight: "700",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Resources
              </strong>
              <div
                style={{
                  width: "24px",
                  height: "2px",
                  background: "var(--orange)",
                }}
              ></div>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <Link
                href="/resources"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Blog
              </Link>
              <Link
                href="/resources"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Guides
              </Link>
              <Link
                href="/resources"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Webinars
              </Link>
              <a
                href="/#contact"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Help Center
              </a>
              <a
                href="/#contact"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Support
              </a>
            </div>
          </div>

          <div className="footer-link-col">
            <div style={{ marginBottom: "24px" }}>
              <strong
                style={{
                  color: "var(--ink)",
                  fontSize: "15px",
                  fontWeight: "700",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Company
              </strong>
              <div
                style={{
                  width: "24px",
                  height: "2px",
                  background: "var(--orange)",
                }}
              ></div>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <Link
                href="/about"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                About Us
              </Link>
              <a
                href="/#contact"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Careers
              </a>
              <a
                href="/#contact"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Press
              </a>
              <a
                href="/#contact"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Partners
              </a>
              <a
                href="/#contact"
                style={{
                  color: "var(--muted)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>

        {/* Newsletter Column */}
        {/* Newsletter Column */}
        <div className="footer-newsletter">
          <div style={{ marginBottom: "24px" }}>
            <strong
              style={{
                color: "var(--ink)",
                fontSize: "15px",
                fontWeight: "700",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Newsletter
            </strong>
            <div
              style={{
                width: "24px",
                height: "2px",
                background: "var(--orange)",
              }}
            ></div>
          </div>
          <p
            style={{
              fontSize: "14px",
              lineHeight: "1.6",
              marginBottom: "24px",
              color: "var(--muted)",
            }}
          >
            Subscribe to get the latest updates and opportunities.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--line)" }}>
        <div className="footer-bottom">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span>© 2026 NetworkX. All rights reserved.</span>
            <span style={{ color: "var(--muted)" }}>Scenic Creek Way, Leesburg, Virginia 20176</span>
          </div>
          <div className="footer-bottom-links">
            <a
              href="/#contact"
              style={{ color: "var(--muted)", textDecoration: "none" }}
            >
              Privacy Policy
            </a>
            <div style={{ width: "1px", background: "var(--line)" }}></div>
            <a
              href="/#contact"
              style={{ color: "var(--muted)", textDecoration: "none" }}
            >
              Terms of Service
            </a>
            <div style={{ width: "1px", background: "var(--line)" }}></div>
            <a
              href="/#contact"
              style={{ color: "var(--muted)", textDecoration: "none" }}
            >
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
