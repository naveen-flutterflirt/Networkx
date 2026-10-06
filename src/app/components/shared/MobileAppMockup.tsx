import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowRight, faBell, faBriefcase, faCalendarDay, faChartLine, 
  faChevronRight, faEye, faHouse, faMagnifyingGlass, faNetworkWired, 
  faUser, faUserPlus, faUsers 
} from '@fortawesome/free-solid-svg-icons';

type MockupType = 'explore' | 'growth' | 'network';

export default function MobileAppMockup({ type }: { type: MockupType }) {
  // We use inline styles that strictly use global variables (var(--panel), var(--ink), var(--muted), var(--line), var(--orange))
  // so it correctly matches light/dark modes natively instead of hardcoded images.
  
  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: 'var(--panel)',
    color: 'var(--ink)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'sans-serif',
    overflow: 'hidden',
    position: 'relative'
  };

  const headerStyle: React.CSSProperties = {
    padding: '24px 20px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--line)'
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px 24px 24px',
    borderTop: '1px solid var(--line)',
    background: 'var(--panel)'
  };

  const navItem = (icon: any, label: string, active: boolean) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: active ? 'var(--orange)' : 'var(--muted)', fontSize: '10px' }}>
      <FontAwesomeIcon icon={icon} style={{ fontSize: '18px' }} />
      <span>{label}</span>
    </div>
  );

  const cardStyle: React.CSSProperties = {
    background: 'var(--night)',
    border: '1px solid var(--line)',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
  };

  if (type === 'growth') {
    return (
      <div style={baseStyle}>
        <div style={headerStyle}>
          <div style={{ fontSize: '18px', fontWeight: 800 }}>Network<span style={{ color: 'var(--orange)' }}>X</span></div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <FontAwesomeIcon icon={faBell} style={{ color: 'var(--muted)' }} />
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--line)', display: 'grid', placeItems: 'center' }}>
              <FontAwesomeIcon icon={faUser} style={{ fontSize: '12px', color: 'var(--muted)' }} />
            </div>
          </div>
        </div>
        <div style={contentStyle}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px' }}>Hi, Rahul 👋</h1>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>Here's your Growth Dashboard</p>
          </div>

          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, var(--night), var(--panel))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>Growth Score</div>
              <div style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-1px' }}>782<span style={{ fontSize: '16px', color: 'var(--muted)', fontWeight: 500 }}>/1000</span></div>
              <div style={{ fontSize: '13px', color: 'var(--orange)', fontWeight: 600, marginBottom: '16px' }}>You're growing fast! 🔥</div>
              <button style={{ background: 'transparent', border: '1px solid var(--orange)', color: 'var(--orange)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>View Insights <FontAwesomeIcon icon={faArrowRight} style={{marginLeft: '4px'}}/></button>
            </div>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '8px solid var(--line)', borderTopColor: 'var(--orange)', borderRightColor: 'var(--orange)', display: 'grid', placeItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800 }}>78%</div>
                <div style={{ fontSize: '9px', color: 'var(--muted)' }}>of potential</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '12px', marginBottom: '8px' }}>
                <FontAwesomeIcon icon={faUsers} /> Connections
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>248</div>
              <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>▲ 18% <span style={{color: 'var(--muted)'}}>vs last month</span></div>
            </div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '12px', marginBottom: '8px' }}>
                <FontAwesomeIcon icon={faUserPlus} /> Referrals
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>32</div>
              <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>▲ 23% <span style={{color: 'var(--muted)'}}>vs last month</span></div>
            </div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '12px', marginBottom: '8px' }}>
                <FontAwesomeIcon icon={faCalendarDay} /> Events Attended
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>14</div>
              <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>▲ 7% <span style={{color: 'var(--muted)'}}>vs last month</span></div>
            </div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '12px', marginBottom: '8px' }}>
                <FontAwesomeIcon icon={faEye} /> Profile Views
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>1.2K</div>
              <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>▲ 31% <span style={{color: 'var(--muted)'}}>vs last month</span></div>
            </div>
          </div>

          <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--line)', display: 'grid', placeItems: 'center', color: 'var(--orange)' }}>
                <FontAwesomeIcon icon={faBriefcase} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Business Opportunities</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800 }}>9</span>
                  <span style={{ fontSize: '11px', color: '#10b981' }}>▲ 29% <span style={{color: 'var(--muted)'}}>vs last month</span></span>
                </div>
              </div>
            </div>
            <FontAwesomeIcon icon={faChevronRight} style={{ color: 'var(--muted)' }} />
          </div>
        </div>
        <div style={navStyle}>
          {navItem(faHouse, 'Home', false)}
          {navItem(faNetworkWired, 'Network', false)}
          {navItem(faCalendarDay, 'Events', false)}
          {navItem(faChartLine, 'Growth', true)}
          {navItem(faUser, 'Profile', false)}
        </div>
      </div>
    );
  }

  // Fallback for explore/network left/right side screens
  return (
    <div style={baseStyle}>
      <div style={headerStyle}>
        <div style={{ fontSize: '18px', fontWeight: 800 }}>Network<span style={{ color: 'var(--orange)' }}>X</span></div>
      </div>
      <div style={contentStyle}>
        <div style={{ fontSize: '24px', fontWeight: 800 }}>{type === 'explore' ? 'Explore Global' : 'Your Network'}</div>
        <div style={{ position: 'relative' }}>
          <FontAwesomeIcon icon={faMagnifyingGlass} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted)' }} />
          <input type="text" placeholder="Search people, chapters..." style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--night)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--line)' }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ width: '60%', height: '14px', background: 'var(--line)', borderRadius: '4px', marginBottom: '8px' }}></div>
                <div style={{ width: '40%', height: '10px', background: 'var(--line)', borderRadius: '4px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={navStyle}>
        {navItem(faHouse, 'Home', false)}
        {navItem(faNetworkWired, 'Network', type === 'network')}
        {navItem(faCalendarDay, 'Events', false)}
        {navItem(faChartLine, 'Growth', false)}
        {navItem(faUser, 'Profile', false)}
      </div>
    </div>
  );
}
