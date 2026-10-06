import type { CSSProperties } from "react";

const assetRoot = "/images/section-5-online";

const topRoles = [
  { label: "Professionals", icon: "icon-professionals.svg", tone: "orange" },
  { label: "Entrepreneurs", icon: "icon-entrepreneurs.svg", tone: "blue" },
  { label: "Business Owners", icon: "icon-business-owners.svg", tone: "green" },
  { label: "Mentors", icon: "icon-mentors.svg", tone: "purple" },
  { label: "Investors", icon: "icon-investors.svg", tone: "gold" },
  { label: "Industry Experts", icon: "icon-industry-experts.svg", tone: "cyan" },
];

const bottomPillars = [
  {
    title: "Diverse by Design",
    copy: "Different industries, markets and professional backgrounds.",
    icon: "icon-diverse.svg",
    tone: "blue",
  },
  {
    title: "Business-First Community",
    copy: "Built around meaningful professional relationships and opportunities.",
    icon: "icon-business-first.svg",
    tone: "orange",
  },
  {
    title: "Global Reach. Local Relevance.",
    copy: "Connect globally while discovering people relevant to your city, industry and goals.",
    icon: "icon-global-reach.svg",
    tone: "green",
  },
];

export default function Section5OnlineBusinessCommunity() {
  return (
    <section id="community" style={{ padding: '120px 40px', background: '#fdfaf6', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
        
        {/* Top Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '60px', marginBottom: '80px' }}>
          
          {/* Left Text */}
          <div style={{ flex: '1', maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '2px', background: '#a86e45' }}></div>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#a86e45', letterSpacing: '1.5px', textTransform: 'uppercase' }}>A Global Business Community</span>
            </div>
            <h2 style={{ fontSize: '48px', fontWeight: '800', lineHeight: '1.05', color: '#131b23', marginBottom: '24px', letterSpacing: '-0.02em' }}>
              Built Across<br />
              Countries.<br />
              Connected Across<br />
              Industries.<br />
              <span style={{ color: '#a86e45' }}>United by Growth.</span>
            </h2>
            <p style={{ fontSize: '16px', color: '#687787', lineHeight: '1.6', marginBottom: '40px' }}>
              NetworkX brings professionals, entrepreneurs, business owners, mentors, investors and industry experts together in one trusted online business ecosystem.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <a href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: '#131b23', color: '#fff', padding: '16px 32px', borderRadius: '12px', fontWeight: '600', fontSize: '15px', textDecoration: 'none', boxShadow: '0 8px 20px rgba(19,27,35,0.15)' }}>
                Join the Community
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', marginLeft: '12px' }}>
                  {/* Fake avatars for effect */}
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ccc', marginLeft: '-12px', border: '2px solid #fdfaf6', overflow: 'hidden' }}><img src="/images/app/explore.jpg" style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/></div>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ddd', marginLeft: '-12px', border: '2px solid #fdfaf6', overflow: 'hidden' }}><img src="/images/app/growth.jpg" style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/></div>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eee', marginLeft: '-12px', border: '2px solid #fdfaf6', overflow: 'hidden' }}><img src="/images/app/network.jpg" style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/></div>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#faefe3', marginLeft: '-12px', border: '2px solid #fdfaf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#a86e45' }}>+10K</div>
                </div>
                <div style={{ fontSize: '12px', color: '#687787', lineHeight: '1.4' }}>
                  Professionals<br/>already joined
                </div>
              </div>
            </div>
          </div>

          {/* Right Visuals */}
          <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Top roles strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', width: '100%' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }}></div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#131b23', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Who NetworkX Is For</div>
              <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }}></div>
            </div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: 'Professionals', color: '#f26d4b', icon: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path> },
                { label: 'Entrepreneurs', color: '#4b7cf2', icon: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon> },
                { label: 'Business Owners', color: '#10a34b', icon: <rect x="3" y="11" width="18" height="10" rx="2"></rect> },
                { label: 'Mentors', color: '#8a4bf5', icon: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path> },
                { label: 'Investors', color: '#e09824', icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline> },
                { label: 'Industry Experts', color: '#249ce0', icon: <circle cx="12" cy="12" r="10"></circle> }
              ].map(role => (
                <div key={role.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {role.icon}
                    </svg>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#131b23' }}>{role.label}</span>
                </div>
              ))}
            </div>
            
            {/* Map Reference Image */}
            <img src="/images/section-5-online/section5-mosaic-reference.png" alt="Global Network" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Stats Pill */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '40px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.04)', marginBottom: '40px', flexWrap: 'wrap', gap: '24px' }}>
          {[
            { stat: '9+', title: 'Countries', desc: 'Growing international presence', icon: <circle cx="12" cy="12" r="10"></circle> },
            { stat: '50+', title: 'Industries', desc: 'Businesses across diverse sectors', icon: <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect> },
            { stat: '10K+', title: 'Members', desc: 'Professionals, entrepreneurs and experts', icon: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path> },
            { stat: 'Global + Local', title: 'Connections', desc: 'Relevant opportunities wherever you operate', icon: <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path> }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#faefe3', color: '#8a5a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon}
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#a86e45', marginBottom: '2px' }}>{item.stat}</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#131b23', marginBottom: '2px' }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: '#687787', lineHeight: '1.4', maxWidth: '160px' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Pillars */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px', paddingTop: '40px', borderTop: '1px solid rgba(168,110,69,0.15)', flexWrap: 'wrap' }}>
          {[
            { title: 'Diverse by Design', desc: 'Different industries, markets and professional backgrounds.', icon: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path> },
            { title: 'Business-First Community', desc: 'Built around meaningful professional relationships and opportunities.', icon: <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect> },
            { title: 'Global Reach, Local Relevance', desc: 'Connect globally while discovering people relevant to your city, industry and goals.', icon: <circle cx="12" cy="12" r="10"></circle> }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '16px', flex: '1 1 300px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#faefe3', color: '#8a5a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon}
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#131b23', marginBottom: '4px' }}>{item.title}</div>
                <div style={{ fontSize: '13px', color: '#687787', lineHeight: '1.5' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
