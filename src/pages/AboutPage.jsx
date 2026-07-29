import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Users, TrendingUp, Star, Award, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import MahimImg from '../assets/images/Mahim sir.png';
import AryanImg from '../assets/images/aryan.png';

/* ─── InView hook ─── */
const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

const AnimSection = ({ children, className = '', delay = 0, dir = 'up' }) => {
  const [ref, inView] = useInView();
  const hidden = { up: 'opacity-0 translate-y-10', left: 'opacity-0 -translate-x-10', right: 'opacity-0 translate-x-10', scale: 'opacity-0 scale-95' }[dir] || 'opacity-0 translate-y-10';
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${inView ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : hidden} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

const team = [
  { name: 'Mahim Dosi', role: 'CEO & Co-Founder', desc: 'Former McKinsey consultant who saw the gap in home service quality. Drives Fixora\'s vision for transparent, premium-tier home care.', img: MahimImg },
  { name: 'Dhanashree Nerkar', role: 'CTO & Co-Founder', desc: 'Ex-Amazon engineer. Architects the intelligent matching algorithms and SaaS infrastructure that power real-time bookings.', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop' },
  { name: 'Aryan Harwani', role: 'Head of Operations and Design ', desc: 'Led nationwide field operations for UrbanClap. Oversees provider onboarding, vetting protocols, and quality benchmarks.', img: AryanImg },
];

const values = [
  { icon: ShieldCheck, title: 'Integrity First', desc: 'We verify every provider through background checks, skill assessments, and reference validation before they reach your home.' },
  { icon: Star, title: 'Premium Quality', desc: 'We refuse to compromise on quality. Every service delivered meets a five-star standard backed by our Quality Guarantee.' },
  { icon: Users, title: 'Community Driven', desc: 'We empower local skilled professionals to build dignified, sustainable livelihoods by connecting them to quality work.' },
  { icon: TrendingUp, title: 'Radical Transparency', desc: 'Clear, upfront pricing. No surprise add-ons. No hidden charges. What you see is exactly what you pay.' },
  { icon: Clock, title: 'Always On-Time', desc: 'We respect your schedule. Our matching system ensures a verified pro is dispatched promptly, every single time.' },
  { icon: Award, title: 'Accountable Excellence', desc: 'Every job comes with our quality assurance. If not satisfied, we make it right — no questions asked.' },
];

const stats = [
  { label: 'Happy Customers', value: '15,000+' },
  { label: 'Verified Professionals', value: '1,200+' },
  { label: 'Cities Covered', value: '28' },
  { label: 'Services Completed', value: '50,000+' },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-[var(--color-primary-bg)] text-[var(--color-text-primary)] font-sans overflow-x-hidden selection:bg-[#D4AF37]/30 selection:text-[var(--color-text-primary)]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Outfit', sans-serif; }
        .about-gold-shimmer {
          background: linear-gradient(90deg, #D4AF37 0%, #FFE89C 35%, #FFF9E0 50%, #FFE89C 70%, #D4AF37 100%);
          background-size: 250% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: aboutGoldShimmer 5s linear infinite;
        }
        @keyframes aboutGoldShimmer {
          0% { background-position: -250% center; }
          100% { background-position: 250% center; }
        }
        .glass-card-about {
          background: var(--color-card-bg);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--color-border-subtle);
        }
        .gold-filled-about {
          background: linear-gradient(135deg, #F4C542 0%, #D4AF37 55%, #BCA032 100%);
          color: #0D0D0D; font-weight: 800;
          box-shadow: 0 4px 20px rgba(212,175,55,0.28);
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .gold-filled-about:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 30px rgba(212,175,55,0.5);
        }
        .outline-gold-about {
          border: 1.5px solid rgba(212,175,55,0.5);
          color: #D4AF37;
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .outline-gold-about:hover {
          background: rgba(212,175,55,0.08);
          border-color: #D4AF37;
          transform: translateY(-2px);
        }
        .value-card {
          border: 1px solid rgba(212,175,55,0.12);
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        .value-card:hover {
          border-color: rgba(212,175,55,0.5);
          box-shadow: 0 8px 40px rgba(212,175,55,0.12);
          transform: translateY(-6px);
        }
        .team-card {
          border: 1px solid rgba(212,175,55,0.12);
          transition: all 0.45s cubic-bezier(0.16,1,0.3,1);
        }
        .team-card:hover {
          border-color: rgba(212,175,55,0.45);
          box-shadow: 0 12px 50px rgba(212,175,55,0.18);
          transform: translateY(-8px);
        }
        .team-card:hover img {
          transform: scale(1.06);
        }
        .team-card img { transition: transform 0.6s cubic-bezier(0.16,1,0.3,1); }
      `}</style>

      {/* ─── HERO ─── */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#D4AF37]/4 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 left-[10%] w-[400px] h-[400px] bg-[#D4AF37]/3 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-20 right-[8%] w-[350px] h-[350px] bg-[#D4AF37]/3 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimSection dir="up" delay={0}>
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-card-about border border-[#D4AF37]/25 w-max mx-auto mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" style={{ animation: 'dotPulse 2.5s infinite' }} />
              <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">Our Story</span>
            </div>
          </AnimSection>

          <AnimSection dir="up" delay={100}>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.08] tracking-tight mb-6">
              Built for the{' '}
              <span className="about-gold-shimmer">Modern Homeowner</span>
            </h1>
          </AnimSection>

          <AnimSection dir="up" delay={200}>
            <p className="text-[var(--color-text-secondary)] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Fixora was born from a simple frustration — finding a trustworthy, skilled professional for your home shouldn't feel like a gamble. We built the platform we always wished existed.
            </p>
          </AnimSection>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="py-16 border-y border-[#D4AF37]/10 bg-[var(--color-primary-bg)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <AnimSection key={s.label} dir="scale" delay={i * 80}>
                <div className="text-center">
                  <p className="text-3xl sm:text-4xl font-black text-[var(--color-text-primary)] mb-1">{s.value}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] font-semibold uppercase tracking-widest">{s.label}</p>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MISSION ─── */}
      <section className="py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimSection dir="left">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 w-max">
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">Our Mission</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">
                Trust, built into every{' '}
                <span className="about-gold-shimmer">service interaction</span>
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm sm:text-base leading-relaxed">
                We believe every homeowner deserves access to verified, skilled professionals without the uncertainty that's plagued the home service industry for decades. Our vetting process, real-time transparency tools, and quality guarantees make that possible at scale.
              </p>
              <ul className="space-y-3">
                {['Background-verified professionals only', 'Real-time booking & live tracking', 'Transparent, upfront pricing', '30-day workmanship guarantee'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[var(--color-text-primary)]">
                    <CheckCircle size={16} className="text-[#D4AF37] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </AnimSection>

          <AnimSection dir="right">
            <div className="relative">
              <div className="glass-card-about rounded-[32px] p-8 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#D4AF37]/6 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#D4AF37]/4 rounded-full blur-3xl" />
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border-subtle)]">
                    <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 flex items-center justify-center">
                      <ShieldCheck size={20} className="text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-[var(--color-text-primary)] font-bold text-sm">Quality Promise</p>
                      <p className="text-[var(--color-text-secondary)] text-xs">Every booking guaranteed</p>
                    </div>
                  </div>
                  {[
                    { label: 'Provider Verification Rate', value: '100%', color: '#D4AF37' },
                    { label: 'Customer Satisfaction', value: '98.4%', color: '#34d399' },
                    { label: 'On-Time Arrival', value: '96.2%', color: '#60a5fa' },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-[var(--color-text-secondary)] font-medium">{m.label}</span>
                        <span className="text-xs font-black" style={{ color: m.color }}>{m.value}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--color-overlay-subtle)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000"
                          style={{ width: m.value, background: `linear-gradient(90deg, ${m.color}88, ${m.color})` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ─── VALUES ─── */}
      <section className="py-24 bg-[var(--color-primary-bg)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.03)_0%,_transparent_65%)] pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimSection dir="up" className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 w-max mx-auto mb-5">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">Our Values</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--color-text-primary)] leading-tight">
              Principles we{' '}
              <span className="about-gold-shimmer">never compromise on</span>
            </h2>
          </AnimSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <AnimSection key={v.title} dir="up" delay={i * 80}>
                  <div className="glass-card-about value-card rounded-3xl p-7 h-full flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={22} className="text-[#D4AF37]" />
                    </div>
                    <h3 className="text-[var(--color-text-primary)] font-bold text-base">{v.title}</h3>
                    <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed flex-grow">{v.desc}</p>
                  </div>
                </AnimSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── TEAM ─── */}
      <section className="py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <AnimSection dir="up" className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 w-max mx-auto mb-5">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">The Team</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--color-text-primary)]">
            People behind{' '}
            <span className="about-gold-shimmer">Fixora</span>
          </h2>
        </AnimSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-5xl w-full mx-auto">
          {team.map((member, i) => (
            <AnimSection key={member.name} dir="up" delay={i * 80} className="h-full">
              <div className="glass-card-about team-card rounded-3xl overflow-hidden flex flex-col h-full w-full">
                <div className="overflow-hidden h-56 w-full bg-[var(--color-secondary-bg)] shrink-0">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover object-[50%_15%]" />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-[var(--color-text-primary)] font-bold text-sm mb-0.5">{member.name}</h3>
                  <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-wider mb-3">{member.role}</p>
                  <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed flex-grow">{member.desc}</p>
                </div>
              </div>
            </AnimSection>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <AnimSection dir="scale" className="max-w-4xl mx-auto">
          <div className="glass-card-about rounded-[40px] p-12 text-center border border-[#D4AF37]/20 relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-56 h-56 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black text-[var(--color-text-primary)] mb-4">
                Ready to experience{' '}
                <span className="about-gold-shimmer">Fixora quality?</span>
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm sm:text-base mb-8 max-w-lg mx-auto">
                Join thousands of homeowners who've made the switch to verified, premium home services.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/services">
                  <button className="gold-filled-about px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2.5 cursor-pointer">
                    Book a Service <ArrowRight size={15} />
                  </button>
                </Link>
                <Link to="/contact">
                  <button className="outline-gold-about px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest cursor-pointer">
                    Contact Us
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </AnimSection>
      </section>
    </div>
  );
};

export default AboutPage;
