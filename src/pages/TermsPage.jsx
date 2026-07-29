import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, Lock, Eye, ChevronDown, ArrowRight } from 'lucide-react';

/* ─── InView hook ─── */
const useInView = (threshold = 0.1) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

const AnimSection = ({ children, className = '', delay = 0, dir = 'up' }) => {
  const [ref, inView] = useInView();
  const hidden = { up: 'opacity-0 translate-y-8', left: 'opacity-0 -translate-x-8', right: 'opacity-0 translate-x-8', scale: 'opacity-0 scale-95' }[dir] || 'opacity-0 translate-y-8';
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${inView ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : hidden} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

const sections = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    icon: FileText,
    content: `By accessing or using the Fixora platform — including our website, mobile application, and any related services — you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you may not use the platform.

These terms constitute a legally binding agreement between you and Fixora Inc. We reserve the right to update these terms at any time. Continued use of the platform after changes are published constitutes acceptance of the revised terms.`,
  },
  {
    id: 'services',
    title: '2. Platform Services',
    icon: Shield,
    content: `Fixora is a technology platform that connects customers with independent, vetted service providers. Fixora does not directly provide home services; we facilitate the connection between customers and providers.

We offer the following features: service discovery and booking, provider matching algorithms, secure payment processing, real-time job tracking, review and rating systems, and customer support infrastructure.

Fixora maintains the right to modify, suspend, or discontinue any part of the platform without prior notice.`,
  },
  {
    id: 'accounts',
    title: '3. User Accounts',
    icon: Lock,
    content: `To access full platform functionality, you must create an account. You agree to provide accurate and complete information during registration and to keep your account credentials confidential.

You are solely responsible for all activity that occurs under your account. Fixora reserves the right to terminate or suspend accounts that violate these terms, engage in fraudulent behavior, or pose a risk to the safety of others on the platform.

Users must be at least 18 years of age to create an account and book services.`,
  },
  {
    id: 'bookings',
    title: '4. Bookings & Payments',
    icon: FileText,
    content: `Service bookings are confirmed once payment is received and a provider accepts the job. Prices displayed are base rates — final charges may vary depending on job complexity, materials required, or additional tasks agreed upon on-site.

Payments are processed securely through our payment partners using industry-standard encryption. Fixora does not store raw payment card data. All prices are listed in the applicable local currency and include applicable taxes where required.

Service cancellations made more than 2 hours before the scheduled start time are eligible for a full refund. Late cancellations may be subject to a cancellation fee.`,
  },
  {
    id: 'providers',
    title: '5. Provider Standards',
    icon: Shield,
    content: `Service providers on the Fixora network are independent contractors, not employees of Fixora. They undergo mandatory background verification, skills assessment, and identity validation before being approved to operate on the platform.

Providers must maintain the professional standards required by their service category, carry any required licenses or certifications, and comply with all applicable local laws and regulations.

Fixora reserves the right to remove any provider from the platform for violations of our code of conduct, safety standards, or customer complaints substantiated through review.`,
  },
  {
    id: 'privacy',
    title: '6. Privacy & Data',
    icon: Eye,
    content: `We are committed to protecting your privacy. Our full Privacy Policy details how we collect, use, and protect your personal data. Key points include:

• We collect information you provide during registration and booking.
• Location data is used to match you with nearby providers and track service progress.
• We use cookies and analytics tools to improve platform performance.
• We do not sell your personal data to third parties.
• You may request deletion of your account and associated data at any time.

By using Fixora, you consent to the data practices described in our Privacy Policy.`,
  },
  {
    id: 'liability',
    title: '7. Limitation of Liability',
    icon: Shield,
    content: `To the fullest extent permitted by applicable law, Fixora shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform or services booked through it.

Our total liability to you for any claims arising under these terms shall not exceed the amount paid by you for the specific service giving rise to the claim.

Fixora does not guarantee the quality of work performed by providers, though we maintain vetting standards and quality assurance processes designed to minimize service risks.`,
  },
  {
    id: 'contact',
    title: '8. Contact & Disputes',
    icon: FileText,
    content: `If you have questions about these terms, a billing dispute, or a service complaint, please contact us:

Email: legal@fixora.com
Support: support@fixora.com
Phone: +1 (800) 555-0199
Address: 100 Service Plaza, Suite 400, New York, NY 10001

Disputes that cannot be resolved through direct communication will be subject to binding arbitration in the jurisdiction where Fixora Inc. is incorporated, unless prohibited by applicable law.`,
  },
];

const TermsPage = () => {
  const [activeSection, setActiveSection] = useState(null);

  return (
    <div className="min-h-screen bg-[var(--color-primary-bg)] text-[var(--color-text-primary)] font-sans overflow-x-hidden selection:bg-[#D4AF37]/30 selection:text-[var(--color-text-primary)]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Outfit', sans-serif; }
        .terms-gold-shimmer {
          background: linear-gradient(90deg, #D4AF37 0%, #FFE89C 35%, #FFF9E0 50%, #FFE89C 70%, #D4AF37 100%);
          background-size: 250% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: tGoldShimmer 5s linear infinite;
        }
        @keyframes tGoldShimmer {
          0% { background-position: -250% center; }
          100% { background-position: 250% center; }
        }
        .glass-terms {
          background: var(--color-card-bg);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--color-border-subtle);
        }
        .terms-section {
          border: 1px solid rgba(212,175,55,0.1);
          transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
        }
        .terms-section:hover, .terms-section.active {
          border-color: rgba(212,175,55,0.35);
        }
        .nav-pill {
          transition: all 0.25s ease;
          border: 1px solid transparent;
        }
        .nav-pill:hover {
          background: rgba(212,175,55,0.07);
          border-color: rgba(212,175,55,0.2);
        }
        .nav-pill.active {
          background: rgba(212,175,55,0.12);
          border-color: rgba(212,175,55,0.4);
          color: #D4AF37;
        }
        .gold-submit-terms {
          background: linear-gradient(135deg, #F4C542 0%, #D4AF37 55%, #BCA032 100%);
          color: #0D0D0D; font-weight: 800;
          box-shadow: 0 4px 20px rgba(212,175,55,0.28);
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .gold-submit-terms:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 30px rgba(212,175,55,0.5);
        }
      `}</style>

      {/* ─── HERO ─── */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#D4AF37]/4 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimSection dir="up" delay={0}>
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-terms border border-[#D4AF37]/25 w-max mx-auto mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">Legal</span>
            </div>
          </AnimSection>
          <AnimSection dir="up" delay={100}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight mb-5">
              Terms &amp;{' '}
              <span className="terms-gold-shimmer">Policies</span>
            </h1>
          </AnimSection>
          <AnimSection dir="up" delay={200}>
            <p className="text-[var(--color-text-secondary)] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              These terms govern your use of the Fixora platform. Please read them carefully — they protect both you and the professionals you work with.
            </p>
          </AnimSection>
          <AnimSection dir="up" delay={300}>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[
                { icon: FileText, label: 'Terms of Service' },
                { icon: Lock, label: 'Privacy Policy' },
                { icon: Shield, label: 'Safety Standards' },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <div key={tab.label} className="flex items-center gap-2 glass-terms border border-[#D4AF37]/18 px-4 py-2.5 rounded-full text-xs text-[var(--color-text-primary)] font-medium">
                    <Icon size={13} className="text-[#D4AF37]" />
                    {tab.label}
                  </div>
                );
              })}
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ─── LAST UPDATED NOTICE ─── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <AnimSection dir="up">
          <div className="glass-terms rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-[#D4AF37]/15">
            <div className="flex items-center gap-3">
              <FileText size={16} className="text-[#D4AF37] flex-shrink-0" />
              <div>
                <p className="text-[var(--color-text-primary)] text-xs font-bold">Last Updated: January 15, 2025</p>
                <p className="text-[var(--color-text-secondary)] text-xs">These terms are effective immediately upon publication.</p>
              </div>
            </div>
            <Link to="/contact">
              <button className="text-[#D4AF37] text-xs font-bold hover:underline flex items-center gap-1.5 flex-shrink-0">
                Questions? Contact Us <ArrowRight size={12} />
              </button>
            </Link>
          </div>
        </AnimSection>
      </div>

      {/* ─── CONTENT ─── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

          {/* Sticky TOC */}
          <div className="lg:col-span-1">
            <AnimSection dir="left">
              <div className="glass-terms rounded-3xl p-5 sticky top-24">
                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-4">Contents</p>
                <nav className="space-y-1">
                  {sections.map((s, i) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      onClick={() => setActiveSection(s.id)}
                      className={`nav-pill flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs cursor-pointer block ${activeSection === s.id ? 'active' : 'text-[var(--color-text-secondary)]'}`}
                    >
                      <span className="w-1 h-1 rounded-full bg-[#D4AF37] flex-shrink-0" />
                      {s.title.replace(/^\d+\.\s/, '')}
                    </a>
                  ))}
                </nav>
              </div>
            </AnimSection>
          </div>

          {/* Sections */}
          <div className="lg:col-span-3 space-y-4">
            {sections.map((sec, i) => {
              const Icon = sec.icon;
              const isOpen = activeSection === sec.id;
              return (
                <AnimSection key={sec.id} dir="up" delay={i * 40}>
                  <div id={sec.id} className={`glass-terms terms-section rounded-3xl overflow-hidden ${isOpen ? 'active' : ''}`}>
                    <button
                      onClick={() => setActiveSection(isOpen ? null : sec.id)}
                      className="w-full flex items-center justify-between px-7 py-6 text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#D4AF37]/15 transition-colors">
                          <Icon size={18} className="text-[#D4AF37]" />
                        </div>
                        <h2 className="text-[var(--color-text-primary)] font-bold text-sm sm:text-base">{sec.title}</h2>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-[var(--color-text-secondary)] transition-transform duration-300 flex-shrink-0 ml-4 ${isOpen ? 'rotate-180 text-[#D4AF37]' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-7 pb-7 border-t border-[var(--color-border-subtle)]">
                        <div className="pt-5">
                          {sec.content.split('\n\n').map((para, pi) => (
                            <p key={pi} className={`text-[var(--color-text-secondary)] text-sm leading-relaxed ${pi > 0 ? 'mt-4' : ''}`}>
                              {para}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AnimSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--color-primary-bg)] border-t border-[#D4AF37]/10">
        <AnimSection dir="scale" className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-text-primary)] mb-3">
            Still have questions about our <span className="terms-gold-shimmer">policies?</span>
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm mb-8">Our legal and support team is available to clarify any concerns.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <button className="gold-submit-terms px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer">
                Contact Support <ArrowRight size={13} />
              </button>
            </Link>
            <Link to="/">
              <button className="px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest border border-[#D4AF37]/35 text-[#D4AF37] hover:bg-[#D4AF37]/8 hover:border-[#D4AF37]/60 transition-all cursor-pointer">
                Back to Home
              </button>
            </Link>
          </div>
        </AnimSection>
      </section>
    </div>
  );
};

export default TermsPage;
