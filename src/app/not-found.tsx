import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <header className="site-header">
        <a href="/" className="logo-link" aria-label="NetworkX home">
          <img
            src="/brand/networkx-logo-header.png"
            alt="NetworkX"
            width={620}
            height={100}
          />
        </a>
      </header>

      <section
        className="hero"
        style={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px 24px",
        }}
      >
        <div className="section-kicker orange">ERROR 404</div>
        <h1 style={{ margin: "12px 0" }}>
          This Page
          <br />
          <span>Couldn&apos;t Be Found</span>
        </h1>
        <p
          className="hero-description"
          style={{ maxWidth: 480, margin: "16px auto 32px" }}
        >
          The page you're looking for may have been moved, renamed, or doesn't
          exist. Let's get you back on track.
        </p>
        <div className="hero-actions">
          <Link className="button" href="/">
            Back to Home <span>↗</span>
          </Link>
          <a
            className="button button-secondary"
            href="mailto:hello@networkxcircle.com"
          >
            Contact Support
          </a>
        </div>
      </section>
    </main>
  );
}
