'use client'
import { useState } from 'react'

const STATS = [
  { icon: '👥', value: '12,500+', label: 'Members' },
  { icon: '🏛', value: '85', label: 'Groups' },
  { icon: '🌍', value: '28', label: 'Cities' },
  { icon: '💰', value: '₹45Cr+', label: 'Business Generated' },
  { icon: '🔁', value: '34,200+', label: 'Referrals Exchanged' },
]

const CHANGING_FEATURES = [
  { icon: '🤝', title: 'Meaningful Connections', desc: 'Find and connect with the right people across industries, locations, and interests.' },
  { icon: '🎯', title: 'Smarter Networking', desc: 'AI-powered recommendations help you build valuable relationships faster.' },
  { icon: '🌐', title: 'Global Opportunities', desc: 'Discover business opportunities, partnerships, and collaborations worldwide.' },
  { icon: '🛡️', title: 'Trusted Community', desc: 'A verified, safe, and inclusive community built on trust and value.' },
]

const INTELLIGENCE_FEATURES = [
  { icon: '👥', title: 'AI Matchmaking', desc: 'Find high-fit people based on your goals, interests and business needs.', color: '#168fff' },
  { icon: '✨', title: 'Smart Recommendations', desc: 'Discover relevant members, communities, events and opportunities.', color: '#00bff8' },
  { icon: '✈️', title: 'Travel Connect', desc: 'Meet trusted professionals wherever your work and travel take you.', color: 'var(--nx-orange)' },
  { icon: '🔔', title: 'Opportunity Alerts', desc: 'Get timely signals for partnerships, referrals and new leads.', color: '#b15cff' },
  { icon: '🔁', title: 'Trusted Introductions', desc: 'Turn shared connections into warmer, more meaningful conversations.', color: '#27d86d' },
]

const APP_FEATURES = [
  { icon: '🔔', title: 'Stay Updated', desc: 'Real-time updates on messages, events and opportunities.' },
  { icon: '✏️', title: 'Smart Experience', desc: 'AI-driven insights and personalized recommendations.' },
  { icon: '📈', title: 'Grow On The Go', desc: 'Access tools and resources to grow your business anytime.' },
  { icon: '🔒', title: 'Seamless & Secure', desc: 'Enterprise-grade security for a safe networking experience.' },
]

// Testimonial copy carried over as-is from the approved design handover —
// marketing placeholder content, not member data pulled from the app.
const TESTIMONIALS = [
  { tag: 'Tech Innovators', tagColor: '#168fff', quote: 'NetworkX helped me connect with founders and investors who truly believe in our vision.', name: 'Arjun Mehta', role: 'Co-founder, Finwise', photo: '/images/community/arjun-mehta.png' },
  { tag: 'Entrepreneurs Hub', tagColor: 'var(--nx-orange)', quote: 'The best community for entrepreneurs. The learning, support and opportunities are unmatched.', name: 'Neha Iyer', role: 'Product Leader', photo: '/images/community/neha-iyer.png' },
  { tag: 'Global Leaders', tagColor: '#27d86d', quote: 'A global network with local impact. Proud to be part of such a meaningful platform.', name: 'Michael Chen', role: 'CEO, BuildGrid', photo: '/images/community/michael-chen.png' },
]

const FOOTER_COLS = [
  { title: 'Platform', links: ['Explore', 'How It Works', 'Mobile App', 'Pricing', 'AI Features'] },
  { title: 'Community', links: ['Communities', 'Events', 'Chapters', 'Become a Host', 'Member Stories'] },
  { title: 'Resources', links: ['Blog', 'Guides', 'Webinars', 'Help Center', 'Support'] },
  { title: 'Company', links: ['About Us', 'Careers', 'Press', 'Partners', 'Contact Us'] },
]

export default function HomePage() {
  const [testimonialIdx, setTestimonialIdx] = useState(0)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const goto = (path: string) => { window.location.href = path }

  return (
    <div style={{background:'var(--nx-warm-white)', color:'var(--nx-charcoal)', minHeight:'100vh'}}>
      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 40px',borderBottom:'1px solid var(--nx-line)',position:'sticky',top:0,background:'var(--nx-warm-white)',zIndex:50}}>
        <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:20}}>Network<span style={{color:'var(--nx-orange)'}}>X</span></div>
        <div style={{display:'flex',gap:28,fontSize:14,fontWeight:600}}>
          <a href="#home" style={{color:'var(--nx-orange)'}}>Home</a>
          <a href="#about" style={{color:'var(--nx-ink)',opacity:.8}}>About</a>
          <a href="#solutions" style={{color:'var(--nx-ink)',opacity:.8}}>Solutions</a>
          <a href="#community" style={{color:'var(--nx-ink)',opacity:.8}}>Community</a>
          <a href="#resources" style={{color:'var(--nx-ink)',opacity:.8}}>Resources</a>
          <a href="#pricing" style={{color:'var(--nx-ink)',opacity:.8}}>Pricing</a>
          <a href="#contact" style={{color:'var(--nx-ink)',opacity:.8}}>Contact</a>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-g btn-sm" onClick={()=>goto('/login')}>Log in</button>
          <button className="btn btn-p btn-sm" onClick={()=>goto('/login')}>Join NetworkX →</button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section id="home" style={{background:'var(--nx-navy)',padding:'64px 40px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:40,alignItems:'center'}}>
        <div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:44,fontWeight:800,lineHeight:1.15,color:'#fff',marginBottom:16}}>
            The World's Smartest Online Business <span style={{color:'var(--nx-orange)'}}>Network</span>
          </h1>
          <p style={{fontSize:16,fontWeight:600,color:'var(--nx-muted)',marginBottom:12}}>Learn. Build. Evolve.</p>
          <p style={{fontSize:14,color:'var(--nx-muted)',lineHeight:1.7,marginBottom:24,maxWidth:460}}>
            NetworkX is a global business networking platform that helps professionals, entrepreneurs and organizations build meaningful connections, discover opportunities and grow together.
          </p>
          <div style={{display:'flex',gap:12,marginBottom:28}}>
            <button className="btn btn-p" onClick={()=>goto('/login')}>Join NetworkX →</button>
            <button className="btn btn-dark" onClick={()=>document.getElementById('changing')?.scrollIntoView({behavior:'smooth'})}>Explore Network</button>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{display:'flex'}}>
              {['RK','PM','AR','SP','VR','AK','SN'].map((initials,i)=>(
                <div key={i} className="av" style={{width:30,height:30,fontSize:10,marginLeft:i>0?-8:0,border:'2px solid var(--nx-navy)',background:['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#00bff8','#b15cff'][i]}}>{initials}</div>
              ))}
            </div>
            <div style={{fontSize:12,color:'var(--nx-muted)'}}>
              Trusted by <strong style={{color:'var(--nx-orange)'}}>12,500+ professionals</strong><br/>
              <span style={{color:'#fbbf24'}}>★★★★★</span> 4.9/5 rating
            </div>
          </div>
        </div>
        <div>
          <img src="/images/hero/network-map-v2.jpg" alt="NetworkX global reach" style={{width:'100%',borderRadius:16,marginBottom:16}}/>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
            {STATS.map(s=>(
              <div key={s.label} style={{background:'var(--nx-panel)',borderRadius:10,padding:'10px 6px',textAlign:'center'}}>
                <div style={{fontSize:16}}>{s.icon}</div>
                <div style={{fontSize:13,fontWeight:800,color:'#fff'}}>{s.value}</div>
                <div style={{fontSize:9,color:'var(--nx-muted)'}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHANGING THE WAY ────────────────────────────────────────── */}
      <section id="changing" style={{padding:'64px 40px',background:'#f8fafc'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1.4fr',gap:48,alignItems:'start',maxWidth:1100,margin:'0 auto'}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:'var(--nx-blue)',marginBottom:8,letterSpacing:1}}>HOW NETWORKX IS</div>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:30,fontWeight:800,marginBottom:14,color:'var(--nx-navy)'}}>Changing the Way the World Does Business</h2>
            <p style={{fontSize:14,color:'#6b7280',lineHeight:1.7}}>NetworkX combines human connection with smart technology to create a trusted ecosystem where relationships turn into real opportunities.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'28px 32px'}}>
            {CHANGING_FEATURES.map(f=>(
              <div key={f.title}>
                <div style={{width:44,height:44,borderRadius:12,background:'#eaf0ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,marginBottom:12}}>{f.icon}</div>
                <div style={{fontWeight:700,fontSize:15,marginBottom:6,color:'var(--nx-navy)'}}>{f.title}</div>
                <div style={{fontSize:13,color:'#6b7280',lineHeight:1.6}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NETWORKX INTELLIGENCE ───────────────────────────────────── */}
      <section id="solutions" style={{padding:'64px 40px',background:'var(--nx-navy)'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--nx-orange)',marginBottom:8,letterSpacing:1}}>NETWORKX INTELLIGENCE</div>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:30,fontWeight:800,color:'#fff',marginBottom:12}}>Smarter Features. Better Connections.</h2>
          <p style={{fontSize:14,color:'var(--nx-muted)',maxWidth:520,marginBottom:32,lineHeight:1.7}}>Purpose-built tools help you discover the right people, act on relevant opportunities and build relationships that move business forward.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16}}>
            {INTELLIGENCE_FEATURES.map(f=>(
              <div key={f.title} style={{background:'var(--nx-panel)',border:'1px solid var(--nx-line)',borderRadius:14,padding:18}}>
                <div style={{width:40,height:40,borderRadius:10,background:`${f.color}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,marginBottom:14}}>{f.icon}</div>
                <div style={{fontWeight:700,fontSize:13,color:'#fff',marginBottom:6}}>{f.title}</div>
                <div style={{fontSize:11,color:'var(--nx-muted)',lineHeight:1.6}}>{f.desc}</div>
                <div style={{height:2,width:28,background:f.color,borderRadius:2,marginTop:14}}/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOBILE APP ──────────────────────────────────────────────── */}
      <section style={{padding:'64px 40px',background:'var(--nx-navy)',borderTop:'1px solid var(--nx-line)'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:48,alignItems:'center',maxWidth:1100,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
            <img src="/images/app/network.jpg" alt="NetworkX app" style={{width:'100%',borderRadius:12}}/>
            <img src="/images/app/explore.jpg" alt="NetworkX app explore" style={{width:'100%',borderRadius:12,marginTop:24}}/>
            <img src="/images/app/growth.jpg" alt="NetworkX app growth" style={{width:'100%',borderRadius:12}}/>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:'var(--nx-blue)',marginBottom:8,letterSpacing:1}}>MOBILE-FIRST. ALWAYS CONNECTED.</div>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:28,fontWeight:800,color:'#fff',marginBottom:24}}>Your Network. In Your Pocket.</h2>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px 24px',marginBottom:24}}>
              {APP_FEATURES.map(f=>(
                <div key={f.title} style={{display:'flex',gap:10}}>
                  <div style={{fontSize:18}}>{f.icon}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:'#fff'}}>{f.title}</div>
                    <div style={{fontSize:11,color:'var(--nx-muted)',lineHeight:1.5}}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:10}}>
              <button className="btn btn-dark btn-sm">📱 App Store</button>
              <button className="btn btn-dark btn-sm">▶ Google Play</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI SECTION ──────────────────────────────────────────────── */}
      <section style={{padding:'64px 40px',background:'#f8fafc'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:48,alignItems:'center',maxWidth:1100,margin:'0 auto'}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:'var(--nx-blue)',marginBottom:8,letterSpacing:1}}>AI-POWERED NETWORKING</div>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:26,fontWeight:800,color:'var(--nx-navy)',marginBottom:12}}>Intelligence That Builds Better Connections</h2>
            <p style={{fontSize:14,color:'#6b7280',lineHeight:1.7,marginBottom:20}}>NetworkX AI understands your goals and helps you connect with people, content and opportunities that matter most.</p>
            <button className="btn btn-g btn-sm">Learn more about AI →</button>
          </div>
          <img src="/images/ai/networkx-x4.png" alt="NetworkX AI" style={{width:'100%',borderRadius:16}}/>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────── */}
      <section id="community" style={{padding:'64px 40px'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--nx-orange)',marginBottom:8,letterSpacing:1}}>COMMUNITIES THAT THRIVE</div>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:30,fontWeight:800,marginBottom:12,color:'var(--nx-navy)'}}>Built by Members. Powered by Purpose.</h2>
          <p style={{fontSize:14,color:'#6b7280',maxWidth:480,marginBottom:24,lineHeight:1.7}}>From tech innovators to sustainability leaders, our communities are where ideas spark, connections grow and impact happens.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,marginBottom:20}}>
            {TESTIMONIALS.map((t,i)=>(
              <div key={t.name} className="card" style={{opacity:i===testimonialIdx?1:.4,transition:'opacity .2s'}}>
                <span className="badge" style={{background:`${t.tagColor}18`,color:t.tagColor,marginBottom:12,display:'inline-block'}}>{t.tag}</span>
                <div style={{fontSize:22,color:'#d1d5db',marginBottom:6}}>&ldquo;</div>
                <p style={{fontSize:13,color:'#374151',lineHeight:1.7,marginBottom:16}}>{t.quote}</p>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <img src={t.photo} alt={t.name} style={{width:36,height:36,borderRadius:'50%',objectFit:'cover'}}/>
                  <div>
                    <div style={{fontWeight:700,fontSize:13}}>{t.name}</div>
                    <div style={{fontSize:11,color:'#9ca3af'}}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',justifyContent:'center',gap:10}}>
            <button className="btn btn-g btn-xs" onClick={()=>setTestimonialIdx(i=>Math.max(0,i-1))}>←</button>
            {TESTIMONIALS.map((_,i)=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:i===testimonialIdx?'var(--nx-orange)':'#d1d5db',alignSelf:'center'}}/>)}
            <button className="btn btn-g btn-xs" onClick={()=>setTestimonialIdx(i=>Math.min(TESTIMONIALS.length-1,i+1))}>→</button>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section style={{padding:'0 40px 64px'}}>
        <div style={{maxWidth:1100,margin:'0 auto',background:'linear-gradient(135deg,var(--nx-navy),#0a2338)',borderRadius:24,padding:'48px 56px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:800,color:'#fff',marginBottom:8}}>Ready to Grow Your Network<br/>and Your Business?</h2>
            <p style={{fontSize:13,color:'var(--nx-muted)'}}>Join thousands of professionals and organizations already building what's next.</p>
          </div>
          <div style={{display:'flex',gap:10,flexShrink:0}}>
            <button className="btn btn-p" onClick={()=>goto('/login')}>Join NetworkX →</button>
            <button className="btn btn-dark" id="contact" onClick={()=>window.location.href='mailto:hello@networkx.com'}>Contact Sales</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer id="resources" style={{background:'var(--nx-navy)',padding:'48px 40px 24px'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'1.4fr repeat(4,1fr)',gap:32,marginBottom:32}}>
            <div>
              <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:18,color:'#fff',marginBottom:10}}>Network<span style={{color:'var(--nx-orange)'}}>X</span></div>
              <p style={{fontSize:12,color:'var(--nx-muted)',lineHeight:1.6}}>The global business networking platform that connects people, ideas and opportunities to build a better future.</p>
            </div>
            {FOOTER_COLS.map(col=>(
              <div key={col.title} id={col.title==='Company'?'about':undefined}>
                <div style={{fontSize:12,fontWeight:700,color:'#fff',marginBottom:12}}>{col.title}</div>
                {col.links.map(l=><div key={l} style={{fontSize:12,color:'var(--nx-muted)',marginBottom:8,cursor:'pointer'}} onClick={()=>l==='Become a Host' && (window.location.href='/franchise-apply')}>{l}</div>)}
              </div>
            ))}
          </div>
          <div style={{borderTop:'1px solid var(--nx-line)',paddingTop:16,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'#fff',marginBottom:8}}>Newsletter</div>
            {subscribed ? (
              <div style={{fontSize:12,color:'#7be3a4'}}>✅ Subscribed — thanks!</div>
            ) : (
              <div style={{display:'flex',gap:6,maxWidth:280}}>
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email" style={{fontSize:12}}/>
                <button className="btn btn-p btn-sm" onClick={()=>email.includes('@') && setSubscribed(true)}>→</button>
              </div>
            )}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--nx-muted)'}}>
            <span>© 2026 NetworkX. All rights reserved.</span>
            <div style={{display:'flex',gap:16}}>
              <span>Privacy Policy</span><span>Terms of Service</span><span>Cookie Policy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
