import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, MessageSquare, Headphones, Building } from 'lucide-react';

/* ─── InView hook ─── */
const useInView = (threshold = 0.15) => {
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
  const hidden = { up: 'opacity-0 translate-y-10', left: 'opacity-0 -translate-x-10', right: 'opacity-0 translate-x-10', scale: 'opacity-0 scale-95' }[dir] || 'opacity-0 translate-y-10';
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${inView ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : hidden} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

const contactCards = [
  { icon: Mail, title: 'Email Support', value: 'support@fixora.com', sub: 'We reply within 2 business hours', href: 'mailto:support@fixora.com', label: 'Send Email' },
  { icon: Phone, title: 'Helpline', value: '+1 (800) 555-0199', sub: 'Available 24×7 for urgent queries', href: 'tel:+18005550199', label: 'Call Now' },
  { icon: MessageSquare, title: 'Live Chat', value: 'Start Conversation', sub: 'Instant response from our team', href: '#', label: 'Open Chat' },
];

const faqs = [
  { q: 'How quickly can I get a professional?', a: 'Most bookings are matched within 30 minutes. For urgent requests, we offer same-day service in all covered cities.' },
  { q: 'How do I report a service issue?', a: 'Email support@fixora.com or use the in-app "Report Issue" feature. We investigate and resolve all complaints within 24 hours.' },
  { q: 'Can I request a specific provider?', a: 'Yes! If you\'ve had a great experience with a provider, you can select them directly from your booking history for future jobs.' },
  { q: 'What if I need to cancel or reschedule?', a: 'Free cancellation up to 2 hours before the booking. Rescheduling is always free with no penalty, anytime.' },
  { q: 'Is my payment information secure?', a: 'Absolutely. All transactions are processed through 256-bit encrypted payment gateways. We never store card data on our servers.' },
];

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }, 5000);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-sans overflow-x-hidden selection:bg-[#D4AF37]/30 selection:text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Outfit', sans-serif; }
        .contact-gold-shimmer {
          background: linear-gradient(90deg, #D4AF37 0%, #FFE89C 35%, #FFF9E0 50%, #FFE89C 70%, #D4AF37 100%);
          background-size: 250% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: cGoldShimmer 5s linear infinite;
        }
        @keyframes cGoldShimmer {
          0% { background-position: -250% center; }
          100% { background-position: 250% center; }
        }
        .glass-contact {
          background: rgba(18,18,18,0.7);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(212,175,55,0.15);
        }
        .contact-card {
          border: 1px solid rgba(212,175,55,0.12);
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        .contact-card:hover {
          border-color: rgba(212,175,55,0.5);
          box-shadow: 0 8px 40px rgba(212,175,55,0.12);
          transform: translateY(-6px);
        }
        .contact-input {
          background: rgba(26,29,35,0.8);
          border: 1px solid rgba(212,175,55,0.22);
          transition: all 0.3s ease;
          color: white;
        }
        .contact-input:focus {
          outline: none;
          border-color: #D4AF37;
          box-shadow: 0 0 0 3px rgba(212,175,55,0.08);
        }
        .contact-input::placeholder { color: rgba(161,161,170,0.6); }
        .gold-submit {
          background: linear-gradient(135deg, #F4C542 0%, #D4AF37 55%, #BCA032 100%);
          color: #0D0D0D; font-weight: 800;
          box-shadow: 0 4px 20px rgba(212,175,55,0.28);
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .gold-submit:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 30px rgba(212,175,55,0.5);
        }
        .faq-item {
          border: 1px solid rgba(212,175,55,0.1);
          transition: all 0.35s ease;
        }
        .faq-item:hover { border-color: rgba(212,175,55,0.3); }
        @keyframes successPop {
          0% { transform: scale(0.85); opacity: 0; }
          70% { transform: scale(1.04); }
          100% { transform: scale(1); opacity: 1; }
        }
        .success-pop { animation: successPop 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      {/* ─── HERO ─── */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#D4AF37]/4 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimSection dir="up" delay={0}>
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-contact border border-[#D4AF37]/25 w-max mx-auto mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">Get in Touch</span>
            </div>
          </AnimSection>
          <AnimSection dir="up" delay={100}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight mb-5">
              We're here to{' '}
              <span className="contact-gold-shimmer">help you</span>
            </h1>
          </AnimSection>
          <AnimSection dir="up" delay={200}>
            <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Whether you have a question about a booking, need support with a service, or want to become a provider — our team is ready to respond.
            </p>
          </AnimSection>
        </div>
      </section>

      {/* ─── CONTACT CARDS ─── */}
      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {contactCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <AnimSection key={c.title} dir="up" delay={i * 80}>
                <div className="glass-contact contact-card rounded-3xl p-7 flex flex-col gap-4 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={22} className="text-[#D4AF37]" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-white font-bold text-sm mb-1">{c.title}</h3>
                    <p className="text-[#D4AF37] font-semibold text-sm mb-1">{c.value}</p>
                    <p className="text-zinc-500 text-xs leading-relaxed">{c.sub}</p>
                  </div>
                  <a href={c.href}
                    className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider hover:gap-3 transition-all">
                    {c.label} <span>→</span>
                  </a>
                </div>
              </AnimSection>
            );
          })}
        </div>
      </section>

      {/* ─── FORM + INFO ─── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">

          {/* Form — 3 cols */}
          <AnimSection dir="left" className="lg:col-span-3">
            <div className="glass-contact rounded-[32px] p-8 sm:p-10">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Send us a message</h2>
              <p className="text-zinc-500 text-sm mb-8">We'll get back to you within 2 business hours.</p>

              {submitted ? (
                <div className="success-pop flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-20 h-20 rounded-full bg-[#D4AF37]/15 flex items-center justify-center">
                    <CheckCircle size={40} className="text-[#D4AF37]" />
                  </div>
                  <h3 className="text-xl font-black text-white">Message Sent!</h3>
                  <p className="text-zinc-400 text-sm text-center">Our team will respond to your query within 2 business hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block mb-2">Full Name *</label>
                      <input name="name" value={form.name} onChange={handleChange} required
                        placeholder="Your full name"
                        className="contact-input w-full rounded-xl px-4 py-3.5 text-sm" />
                    </div>
                    <div>
                      <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block mb-2">Email Address *</label>
                      <input name="email" type="email" value={form.email} onChange={handleChange} required
                        placeholder="your@email.com"
                        className="contact-input w-full rounded-xl px-4 py-3.5 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block mb-2">Subject *</label>
                    <input name="subject" value={form.subject} onChange={handleChange} required
                      placeholder="How can we help you?"
                      className="contact-input w-full rounded-xl px-4 py-3.5 text-sm" />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block mb-2">Message *</label>
                    <textarea name="message" rows="5" value={form.message} onChange={handleChange} required
                      placeholder="Describe your query in detail..."
                      className="contact-input w-full rounded-xl px-4 py-3.5 text-sm resize-none" />
                  </div>
                  <button type="submit"
                    className="gold-submit w-full py-4 rounded-full text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2.5 cursor-pointer">
                    <Send size={14} /> Send Message
                  </button>
                </form>
              )}
            </div>
          </AnimSection>

          {/* Info — 2 cols */}
          <AnimSection dir="right" className="lg:col-span-2 space-y-5">
            <div className="glass-contact rounded-3xl p-7 contact-card">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center">
                  <Building size={18} className="text-[#D4AF37]" />
                </div>
                <h3 className="text-white font-bold text-sm">Our Office</h3>
              </div>
              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <MapPin size={15} className="text-[#D4AF37] flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-400 text-sm leading-relaxed">100 Service Plaza, Suite 400,<br />New York, NY 10001</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={15} className="text-[#D4AF37] flex-shrink-0" />
                  <span className="text-zinc-400 text-sm">+1 (800) 555-0199</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={15} className="text-[#D4AF37] flex-shrink-0" />
                  <span className="text-zinc-400 text-sm">support@fixora.com</span>
                </div>
              </div>
            </div>

            <div className="glass-contact rounded-3xl p-7 contact-card">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center">
                  <Clock size={18} className="text-[#D4AF37]" />
                </div>
                <h3 className="text-white font-bold text-sm">Support Hours</h3>
              </div>
              <div className="space-y-3">
                {[
                  { day: 'Monday – Friday', hrs: '9:00 AM – 8:00 PM' },
                  { day: 'Saturday', hrs: '10:00 AM – 6:00 PM' },
                  { day: 'Sunday & Holidays', hrs: 'Emergency only' },
                ].map(h => (
                  <div key={h.day} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                    <span className="text-zinc-400 text-xs">{h.day}</span>
                    <span className="text-white text-xs font-semibold">{h.hrs}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 text-xs font-semibold">24×7 for emergency bookings</span>
                </div>
              </div>
            </div>

            <div className="glass-contact rounded-3xl p-7 contact-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center">
                  <Headphones size={18} className="text-[#D4AF37]" />
                </div>
                <h3 className="text-white font-bold text-sm">Become a Provider</h3>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed mb-4">Join our network of verified professionals and grow your service business with guaranteed work.</p>
              <Link to="/provider/register">
                <button className="gold-submit px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer">
                  Apply Now →
                </button>
              </Link>
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-24 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimSection dir="up" className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 w-max mx-auto mb-5">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">FAQ</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Common <span className="contact-gold-shimmer">Questions</span>
            </h2>
          </AnimSection>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <AnimSection key={i} dir="up" delay={i * 60}>
                <div className="glass-contact faq-item rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer"
                  >
                    <span className="text-white text-sm font-semibold pr-4">{faq.q}</span>
                    <span className={`text-[#D4AF37] text-lg font-bold flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5 border-t border-white/5 pt-4">
                      <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
