"use client";
import { useState, useEffect } from "react";
import { ProfileAPI } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faBriefcase,
  faBuilding,
  faCircleCheck,
  faHandshake,
  faLocationDot,
  faMagnifyingGlass,
  faRocket,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./PublicProfileView.module.css";

const tags = (values: unknown, limit = 8) =>
  Array.isArray(values) ? values.filter(Boolean).slice(0, limit) : [];

export default function PublicProfileView({
  identifier,
}: {
  identifier: string;
}) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!identifier) {
      setError("No profile specified");
      setLoading(false);
      return;
    }
    ProfileAPI.getPublic(identifier)
      .then(setProfile)
      .catch((e: any) => setError(e.message || "Profile not found"))
      .finally(() => setLoading(false));
  }, [identifier]);

  if (loading)
    return (
      <div className={styles.state}>
        <div className={styles.spinner} />
        <span>Loading member profile…</span>
      </div>
    );
  if (error || !profile)
    return (
      <div className={styles.state}>
        <strong>{error || "Profile not found"}</strong>
        <a href="/">
          <FontAwesomeIcon icon={faArrowLeft} /> Back to NetworkX
        </a>
      </div>
    );

  const business = profile.business_profile || {};
  const ideal = profile.ideal_customer || {};
  const intent = profile.intent || {};
  const capabilities = profile.capabilities || {};
  const markets = profile.markets || {};
  const preferences = profile.preferences || {};
  const services = tags(business.products_services);
  const help = tags(
    capabilities.tags?.length ? capabilities.tags : profile.can_help_with,
  );
  const idealTags = tags([
    ...(ideal.industries || []),
    ...(ideal.decision_makers || []),
    ...(ideal.geographies || []),
  ]);
  const lookingTypes = tags(intent.types);
  const goals = tags(profile.goals, 4);
  const socials: { label: string; url: string }[] = [
    profile.linkedin && { label: "LinkedIn", url: profile.linkedin },
    profile.website && { label: "Website", url: profile.website },
    profile.twitter && { label: "X", url: profile.twitter },
    profile.instagram && { label: "Instagram", url: profile.instagram },
    profile.facebook && { label: "Facebook", url: profile.facebook },
  ].filter(Boolean) as { label: string; url: string }[];

  return (
    <main className={styles.page}>
      <div className={styles.glow} />
      <nav className={styles.nav} aria-label="Public profile navigation">
        <a className={styles.brand} href="/">
          Network<span>X</span>
          <small>Member Profile</small>
        </a>
        <a className={styles.login} href="/login">
          Member login
        </a>
      </nav>
      <article className={styles.shell}>
        <header className={styles.cover}>
          <span>NETWORKX MEMBER PROFILE</span>
          <div className={styles.coverMark}>X</div>
        </header>
        <div className={styles.content}>
          <section className={styles.identity}>
            <div className={styles.avatar}>
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`${profile.name} profile photo`}
                />
              ) : (
                <span>{profile.name?.charAt(0) || "?"}</span>
              )}
            </div>
            <div className={styles.identityCopy}>
              <div className={styles.nameRow}>
                <h1>{profile.name}</h1>
                {profile.verified && (
                  <FontAwesomeIcon
                    icon={faCircleCheck}
                    title="NetworkX Verified"
                  />
                )}
              </div>
              <h2>
                {profile.headline || profile.profession || "NetworkX Member"}
              </h2>
              <div className={styles.meta}>
                {profile.company && (
                  <span>
                    <FontAwesomeIcon icon={faBuilding} />
                    {profile.company}
                  </span>
                )}
                <span>
                  <FontAwesomeIcon icon={faLocationDot} />
                  {profile.city || "Location not provided"}
                  {profile.country ? `, ${profile.country}` : ""}
                </span>
              </div>
            </div>
            <div className={styles.availability}>
              {profile.open_to_referrals && (
                <span className={styles.open}>
                  <FontAwesomeIcon icon={faHandshake} />
                  Open to referrals
                </span>
              )}
              {preferences.open_to_meetings && (
                <span>
                  <FontAwesomeIcon icon={faCircleCheck} />
                  Open to meetings
                </span>
              )}
            </div>
          </section>
          {profile.bio && (
            <section className={styles.about}>
              <b>ABOUT</b>
              <p>{profile.bio}</p>
            </section>
          )}
          <div className={styles.grid}>
            <section className={`${styles.panel} ${styles.looking}`}>
              <b>
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                LOOKING FOR
              </b>
              <p>
                {intent.details ||
                  profile.looking_for ||
                  "Open to relevant business introductions."}
              </p>
              {lookingTypes.length > 0 && (
                <div className={styles.neutralTags}>
                  {lookingTypes.map((item: string) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              )}
            </section>
            <section className={`${styles.panel} ${styles.help}`}>
              <b>
                <FontAwesomeIcon icon={faHandshake} />
                HOW I CAN HELP
              </b>
              {help.length > 0 ? (
                <div className={styles.orangeTags}>
                  {help.map((item: string) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              ) : (
                <p>
                  {capabilities.details ||
                    "Connect to explore how this member can help."}
                </p>
              )}
              {capabilities.details && help.length > 0 && (
                <p>{capabilities.details}</p>
              )}
            </section>
            <section className={styles.panel}>
              <b>
                <FontAwesomeIcon icon={faBriefcase} />
                SERVICES &amp; EXPERTISE
              </b>
              {services.length > 0 ? (
                <div className={styles.blueTags}>
                  {services.map((item: string) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              ) : (
                <p>
                  {business.description ||
                    profile.category ||
                    "Business expertise not added yet."}
                </p>
              )}
            </section>
            <section className={styles.panel}>
              <b>
                <FontAwesomeIcon icon={faRocket} />
                IDEAL INTRODUCTION
              </b>
              {idealTags.length > 0 && (
                <div className={styles.purpleTags}>
                  {idealTags.map((item: string) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              )}
              <p>
                {ideal.typical_requirements ||
                  "Ask this member about their ideal introduction."}
              </p>
            </section>
          </div>
          {(markets.currently_served?.length > 0 ||
            markets.wants_to_enter?.length > 0 ||
            goals.length > 0) && (
            <section className={styles.footnotes}>
              {markets.currently_served?.length > 0 && (
                <span>
                  <b>Serving:</b> {markets.currently_served.join(", ")}
                </span>
              )}
              {markets.wants_to_enter?.length > 0 && (
                <span>
                  <b>Expanding to:</b> {markets.wants_to_enter.join(", ")}
                </span>
              )}
              {goals.length > 0 && (
                <span>
                  <b>Networking goals:</b> {goals.join(", ")}
                </span>
              )}
            </section>
          )}
          <footer className={styles.footer}>
            <div className={styles.socials}>
              {socials.map((item) => (
                <a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label} ↗
                </a>
              ))}
            </div>
            <a className={styles.cta} href="/login">
              Join NetworkX to Connect <FontAwesomeIcon icon={faArrowRight} />
            </a>
          </footer>
        </div>
      </article>
      <p className={styles.privacy}>
        Only information this member chose to make visible is shown here.
      </p>
    </main>
  );
}
