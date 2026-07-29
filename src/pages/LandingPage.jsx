import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { Link } from 'react-router-dom';
import {
  Sparkles, Wrench, Snowflake, Hammer, Zap,
  ShieldCheck, DollarSign, Clock, Star,
  HelpCircle, ArrowRight, ChevronDown,
  TrendingUp, Award, Users, Calendar, Lock, CheckCircle, Eye
} from 'lucide-react';

/* ─── Intersection Observer hook ─── */
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

/* ─── Animated Counter ─── */
const Counter = ({ target, suffix = '', prefix = '', decimals = 0 }) => {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView(0.3);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const totalSteps = Math.ceil(duration / 16);
    const step = target / totalSteps;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return (
    <span ref={ref}>
      {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.round(count).toLocaleString()}{suffix}
    </span>
  );
};

/* ─── Golden Floating Particle Canvas ─── */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * (canvas.width || 1200),
      y: Math.random() * (canvas.height || 800),
      r: Math.random() * 2 + 0.4,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.55 + 0.08,
      pulse: Math.random() * Math.PI * 2,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.pulse += 0.018;
        const a = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${a})`;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }} />;
};

/* ─── Ripple Button ─── */
const RippleButton = ({ children, className = '', onClick, type = 'button', as: Tag = 'button' }) => {
  const btnRef = useRef(null);
  const handleRipple = (e) => {
    const btn = btnRef.current;
    if (!btn) return;
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;
    const rect = btn.getBoundingClientRect();
    circle.style.cssText = `
      position:absolute; border-radius:50%; pointer-events:none;
      width:${diameter}px; height:${diameter}px;
      left:${e.clientX - rect.left - radius}px;
      top:${e.clientY - rect.top - radius}px;
      background:rgba(255,255,255,0.25);
      transform:scale(0); animation:ripple-anim 0.6s linear;
    `;
    const old = btn.querySelector('.ripple-circle');
    if (old) old.remove();
    circle.className = 'ripple-circle';
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 650);
    if (onClick) onClick(e);
  };
  return (
    <button ref={btnRef} type={type} className={`relative overflow-hidden ${className}`} onClick={handleRipple}>
      {children}
    </button>
  );
};

/* ─── Animated Section Wrapper ─── */
const AnimSection = ({ children, className = '', delay = 0, dir = 'up' }) => {
  const [ref, inView] = useInView();
  const base = 'transition-all duration-700 ease-out';
  const hidden = {
    up: 'opacity-0 translate-y-10',
    left: 'opacity-0 -translate-x-10',
    right: 'opacity-0 translate-x-10',
    scale: 'opacity-0 scale-95',
    blur: 'opacity-0 blur-sm scale-98',
  }[dir] || 'opacity-0 translate-y-10';
  const visible = 'opacity-100 translate-y-0 translate-x-0 scale-100 blur-0';
  return (
    <div ref={ref} className={`${base} ${inView ? visible : hidden} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

/* ─── Animated Word-by-Word Heading ─── */
const AnimatedWords = ({ text, className = '', goldWords = [], delay = 0 }) => {
  const [ref, inView] = useInView(0.2);
  const words = text.split(' ');
  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => {
        const isGold = goldWords.includes(word.replace(/[.,!?]/g, ''));
        return (
          <span
            key={i}
            className="inline-block"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateY(0)' : 'translateY(20px)',
              transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1)`,
              transitionDelay: `${delay + i * 80}ms`,
              marginRight: i < words.length - 1 ? '0.25em' : 0,
            }}
          >
            {isGold ? (
              <span className="gold-text-shimmer relative">
                {word}
                <span className="absolute inset-0 blur-lg bg-[#D4AF37]/20 rounded-full pointer-events-none" />
              </span>
            ) : word}
          </span>
        );
      })}
    </span>
  );
};

/* ════════════════════════════════════
   LANDING PAGE COMPONENT
   ════════════════════════════════════ */
const LandingPage = () => {
  /* Mouse parallax */
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const handleMouseMove = useCallback((e) => {
    const x = (e.clientX - window.innerWidth / 2) / 50;
    const y = (e.clientY - window.innerHeight / 2) / 50;
    setMouseCoords({ x, y });
  }, []);

  /* FAQ accordion */
  const [activeFaq, setActiveFaq] = useState(null);

  /* Live booking ticker */
  const [liveBookingIdx, setLiveBookingIdx] = useState(0);
  const liveBookings = []; // Fake data removed as requested

  const services = [
    { icon: Sparkles, name: 'Cleaning', desc: 'Immaculate deep cleaning, sanitizing, and organizing for residential & commercial spaces.', price: '₹299', imgUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=500&auto=format&fit=crop' },
    { icon: Wrench, name: 'Plumbing', desc: 'Professional leak detection, plumbing fixture installation, and urgent pipe repairs.', price: '₹199', imgUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=500&auto=format&fit=crop' },
    { icon: Snowflake, name: 'AC Repair', desc: 'Swift diagnostics, deep filter cleaning, and gas recharge for optimal cooling.', price: '₹349', imgUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=500&auto=format&fit=crop' },
    { icon: Hammer, name: 'Carpenter', desc: 'Custom cabinetry, door installation, furniture assembly, and fine woodwork repair.', price: '₹249', imgUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=500&auto=format&fit=crop' },
    { icon: Zap, name: 'Electrician', desc: 'Certified household electrical wiring, switchboard setup, and fixture installations.', price: '₹149', imgUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=500&auto=format&fit=crop' },
  ];

  const whyCards = [
    { icon: ShieldCheck, title: 'Verified Professionals', desc: 'Every practitioner undergoes background checks and rigorous skill assessments.' },
    { icon: DollarSign, title: 'Transparent Pricing', desc: 'Premium services with upfront pricing and zero hidden surcharges.' },
    { icon: Clock, title: '24×7 Support', desc: 'Dedicated helpdesk available round the clock for scheduling assistance.' },
    { icon: TrendingUp, title: 'Real-time Tracking', desc: 'Clear hourly and job-specific estimates with live status updates.' },
    { icon: Calendar, title: 'Instant Booking', desc: 'Matching algorithms assign available local pros within minutes.' },
    { icon: Lock, title: 'Secure Payments', desc: 'All billing shielded with industry-standard 256-bit encryption.' },
  ];

  const steps = [
    { num: '01', title: 'Choose Service', desc: 'Browse and select from our vetted service categories.' },
    { num: '02', title: 'Book a Slot', desc: 'Pick your preferred date, time, and custom job specifications.' },
    { num: '03', title: 'Pro Arrives', desc: 'A background-checked pro arrives with tools to execute the task.' },
    { num: '04', title: 'Work Completed', desc: 'Review the project and settle payment securely.' },
  ];

  const faqData = [
    { q: 'How does Fixora guarantee service quality?', a: 'We onboard only certified professionals who undergo strict screening, identity verification, and hands-on skill evaluation. Additionally, all services are backed by our Quality Guarantee.' },
    { q: 'Can I cancel or reschedule?', a: 'Yes, cancellations and reschedules can be made free of charge up to 2 hours prior to the scheduled timing. Late cancellations may incur a minimal dispatcher fee.' },
    { q: 'What is the payment process?', a: 'We support secure online payments including UPI, Net Banking, and Credit/Debit cards. You can also pay via cash once the job is completed.' },
    { q: 'Are parts included in the starting price?', a: 'The starting price covers inspection, labor, and standard tools. Any spare parts will be quoted transparently before work begins.' },
    { q: 'How do I reach customer support?', a: 'Our support helpdesk is available 24/7 via email at support@fixora.com, call our toll-free line, or chat from your dashboard.' },
  ];

  const testimonials = [
    { name: 'Aarav Mehta', role: 'Penthouse Owner', text: 'Impeccable execution. The deep cleaning crew left my apartment spotless. The attention to detail was exceptional.', rating: 5, img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop' },
    { name: 'Riya Sen', role: 'Real Estate Developer', text: 'Fixora changed how I manage repairs. The electrician arrived on time, diagnosed the fault in 10 minutes, and resolved it safely.', rating: 5, img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop' },
    { name: 'Karan Malhotra', role: 'Business Architect', text: 'The carpenter built out our custom walk-in cabinets flawlessly. Highly skilled craftsmen who take pride in their finishing work.', rating: 5, img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop' },
  ];

  const [activeTestimonial, setActiveTestimonial] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(i => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, [testimonials.length]);

  /* Dashboard stats for animated numbers */
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const dashRef = useRef(null);
  const [realStats, setRealStats] = useState({ providers: null });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/provider`)
      .then(res => res.json())
      .then(data => {
        if (data.status && data.providers) {
          setRealStats(prev => ({ ...prev, providers: data.providers.length }));
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const el = dashRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setDashboardVisible(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const useCountUp = (target, active, decimals = 0, duration = 1500) => {
    const [val, setVal] = useState(0);
    useEffect(() => {
      if (!active) return;
      let start = 0;
      const steps = Math.ceil(duration / 16);
      const step = target / steps;
      const timer = setInterval(() => {
        start += step;
        if (start >= target) { setVal(target); clearInterval(timer); }
        else setVal(start);
      }, 16);
      return () => clearInterval(timer);
    }, [active, target, duration, decimals]);
    return decimals > 0 ? val.toFixed(decimals) : Math.round(val);
  };

  const providersVal = useCountUp(realStats.providers || 0, dashboardVisible, 0, 1200);

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[var(--color-primary-bg)] text-[var(--color-text-primary)] overflow-x-hidden font-sans relative selection:bg-[#D4AF37]/35 selection:text-[var(--color-text-primary)]"
    >

      {/* ═══ GLOBAL STYLES ═══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Outfit', sans-serif; }

        /* Ripple */
        @keyframes ripple-anim {
          to { transform: scale(4); opacity: 0; }
        }

        /* Gold shimmer */
        .gold-text-shimmer {
          background: linear-gradient(90deg, #D4AF37 0%, #FFE89C 30%, #FFF9E0 50%, #FFE89C 70%, #D4AF37 100%);
          background-size: 250% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: goldShimmer 5s linear infinite;
        }
        @keyframes goldShimmer {
          0% { background-position: -250% center; }
          100% { background-position: 250% center; }
        }

        /* Buttons */
        .gold-filled-btn {
          background: linear-gradient(135deg, #F4C542 0%, #D4AF37 55%, #BCA032 100%);
          color: #0D0D0D;
          font-weight: 700;
          box-shadow: 0 4px 20px rgba(212,175,55,0.28), 0 0 0 0 rgba(212,175,55,0);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gold-filled-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 10px 35px rgba(212,175,55,0.5), 0 0 30px rgba(212,175,55,0.2);
          background: linear-gradient(135deg, #FFE89C 0%, #F4C542 55%, #D4AF37 100%);
        }
        .gold-filled-btn:active { transform: translateY(-1px) scale(0.99); }

        .glass-outline-btn {
          background: rgba(255,255,255,0.03);
          color: #FFFFFF;
          border: 1.5px solid rgba(255,255,255,0.18);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glass-outline-btn:hover {
          border-color: #D4AF37;
          color: #D4AF37;
          background: rgba(212,175,55,0.08);
          transform: translateY(-3px);
          box-shadow: 0 6px 25px rgba(212,175,55,0.15);
        }

        /* Glass panel */
        .glass-panel-luxury {
          background: rgba(18,18,18,0.65);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(212,175,55,0.13);
        }
        [data-theme='light'] .glass-panel-luxury {
          background: var(--color-card-bg);
          border-color: var(--color-border-subtle);
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }

        /* Gold glow card */
        .gold-glow-border {
          border: 1px solid rgba(212,175,55,0.18);
          box-shadow: 0 0 18px rgba(212,175,55,0.06);
          transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gold-glow-border:hover {
          border-color: rgba(212,175,55,0.6);
          box-shadow: 0 0 30px rgba(212,175,55,0.22), inset 0 0 12px rgba(212,175,55,0.04);
          transform: translateY(-6px);
        }
        [data-theme='light'] .gold-glow-border {
          border-color: var(--color-border-subtle);
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        [data-theme='light'] .gold-glow-border:hover {
          border-color: rgba(212,175,55,0.4);
          box-shadow: 0 8px 25px rgba(212,175,55,0.15), inset 0 0 10px rgba(212,175,55,0.02);
        }

        /* Animated dots */
        .pulse-glow-dot { animation: dotGlow 2.5s cubic-bezier(0.4,0,0.6,1) infinite; }
        @keyframes dotGlow {
          0%,100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.5); }
          50% { box-shadow: 0 0 0 10px rgba(212,175,55,0); }
        }

        /* Scroll indicator */
        .scroll-down-arrow { animation: arrowBounce 2s infinite; }
        @keyframes arrowBounce {
          0%,50%,100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
          60% { transform: translateY(-4px); }
        }

        /* Orb blur */
        .orb-blur-light {
          filter: blur(120px);
          pointer-events: none;
          transition: transform 0.25s ease-out;
        }

        /* Video Ken Burns */
        @keyframes slowZoom {
          0% { transform: scale(1.03); }
          50% { transform: scale(1.10); }
          100% { transform: scale(1.03); }
        }
        .video-zoom { animation: slowZoom 28s ease-in-out infinite; }

        /* Hero fade-in on page load */
        @keyframes fadeInHero {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .hero-video-fade { animation: fadeInHero 1.2s ease-out forwards; }

        /* Floating dashboard */
        @keyframes floatingWidget {
          0%,100% { transform: translateY(0px) rotate(0.3deg); }
          50% { transform: translateY(-12px) rotate(-0.3deg); }
        }
        .floating-dashboard-widget { animation: floatingWidget 7s ease-in-out infinite; }

        .dashboard-hero-card {
          background: var(--color-card-bg);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid var(--color-border-subtle);
          box-shadow: 0 30px 80px rgba(0,0,0,0.7);
        }
        [data-theme='light'] .dashboard-hero-card {
          box-shadow: 0 20px 50px rgba(0,0,0,0.08);
        }

        .dashboard-inner-card {
          background: var(--color-hover-bg);
          border: 1px solid var(--color-border-subtle);
        }

        /* Light sweep on cards */
        .light-sweep {
          position: relative;
          overflow: hidden;
        }
        .light-sweep::before {
          content: '';
          position: absolute;
          top: 0; left: -75%;
          width: 50%; height: 100%;
          background: linear-gradient(120deg, transparent 30%, rgba(212,175,55,0.08) 50%, transparent 70%);
          transform: skewX(-15deg);
          transition: left 0s;
          pointer-events: none;
          z-index: 10;
        }
        .light-sweep:hover::before {
          left: 150%;
          transition: left 0.7s ease;
        }

        /* Vignette overlay */
        .page-vignette {
          position: fixed; inset: 0;
          background: radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.55) 100%);
          pointer-events: none;
          z-index: 9998;
        }

        /* Services card image hover */
        .img-scale-hover { transition: transform 0.7s cubic-bezier(0.16,1,0.3,1); }
        .img-scale-hover:hover { transform: scale(1.06); }

        /* Shimmer gold button secondary */
        .gold-shimmer-btn {
          background: linear-gradient(90deg, #D4AF37 0%, #FFE89C 25%, #D4AF37 50%, #BCA032 75%, #D4AF37 100%);
          background-size: 300% auto;
          animation: shimmerBtn 3.5s linear infinite;
          color: #0D0D0D;
          font-weight: 800;
        }
        @keyframes shimmerBtn {
          0% { background-position: 0% center; }
          100% { background-position: 300% center; }
        }

        /* Booking activity feed fade */
        @keyframes feedFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .feed-item { animation: feedFadeIn 0.4s ease; }

        /* Scale-in for stats */
        @keyframes scaleIn {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .scale-in { animation: scaleIn 0.5s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* Page vignette */}
      <div className="page-vignette" />

      {/* Navbar spacer — shared Navbar is rendered by App.jsx */}

      {/* ═══ HERO SECTION ═══ */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16 lg:pb-0">
        {/* Background video */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-0 video-zoom hero-video-fade"
          autoPlay loop muted playsInline
          style={{ willChange: 'transform' }}
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Dark charcoal overlay (65%) for text readability */}
        <div className="absolute inset-0 bg-[var(--color-primary-bg)]/65 z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary-bg)]/70 via-transparent to-[var(--color-primary-bg)]/20 z-[1]" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[var(--color-primary-bg)] to-transparent z-[2]" />

        {/* Parallax orbs */}
        <div className="orb-blur-light absolute top-[12%] left-[5%] w-[500px] h-[500px] rounded-full bg-[#D4AF37]/5 z-[1]"
          style={{ transform: `translate(${mouseCoords.x * 0.45}px, ${mouseCoords.y * 0.45}px)` }} />
        <div className="orb-blur-light absolute bottom-[15%] right-[5%] w-[550px] h-[550px] rounded-full bg-[#D4AF37]/4 z-[1]"
          style={{ transform: `translate(${mouseCoords.x * -0.55}px, ${mouseCoords.y * -0.55}px)` }} />

        {/* Particles */}
        <ParticleCanvas />

        {/* 2-column layout */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left column */}
          <div className="lg:col-span-7 space-y-8 flex flex-col justify-center text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-panel-luxury border border-[#D4AF37]/25 w-max"
              style={{ animation: 'feedFadeIn 0.7s ease both' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] pulse-glow-dot" />
              <span className="text-[10px] sm:text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">Premium Service Platform</span>
            </div>

            {/* Animated heading word by word */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] tracking-tight text-[var(--color-text-primary)]">
              <AnimatedWords
                text="Professional Home Services"
                goldWords={[]}
                delay={100}
                className="block"
              />
              <AnimatedWords
                text="Delivered with Trust."
                goldWords={['Delivered', 'Trust.']}
                delay={400}
                className="block"
              />
            </h1>

            <p className="text-[var(--color-text-primary)] text-sm sm:text-base lg:text-lg max-w-xl leading-relaxed"
              style={{ animation: 'feedFadeIn 0.9s 0.5s ease both' }}>
              Book trusted professionals for Cleaning, Plumbing, Electrician, Carpenter and AC Repair within minutes. Vetted. Transparent. Reliable.
            </p>

            {/* CTAs with ripple */}
            <div className="flex flex-wrap gap-4 items-center" style={{ animation: 'feedFadeIn 0.9s 0.65s ease both' }}>
              <Link to="/services">
                <RippleButton className="gold-filled-btn px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2.5 cursor-pointer">
                  <span>Book a Service</span>
                  <ArrowRight size={16} />
                </RippleButton>
              </Link>
              <a href="#services">
                <RippleButton className="glass-outline-btn px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest cursor-pointer">
                  Explore Services
                </RippleButton>
              </a>
            </div>

            {/* Trust badges */}
            <div className="pt-6 border-t border-[var(--color-border-subtle)] max-w-lg" style={{ animation: 'feedFadeIn 0.9s 0.8s ease both' }}>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: '✔', text: 'Vetted Pros' },
                  { icon: '⚡', text: 'Fast Booking' },
                  { icon: '🔒', text: 'Secure Service' },
                ].map(b => (
                  <div key={b.text} className="flex items-center gap-2 text-[var(--color-text-primary)] text-xs group">
                    <span className="text-base group-hover:scale-110 transition-transform">{b.icon}</span>
                    <span className="font-semibold">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: floating glass dashboard */}
          <div className="lg:col-span-5 flex justify-center items-center relative" ref={dashRef}>
            <div
              className="floating-dashboard-widget w-full max-w-md dashboard-hero-card rounded-[36px] p-6 relative overflow-hidden"
              style={{ transform: `perspective(800px) rotateY(${mouseCoords.x * -0.4}deg) rotateX(${mouseCoords.y * 0.3}deg)` }}
            >
              {/* Inner glow */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#D4AF37]/8 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--color-border-subtle)]">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
                  </div>
                  <span className="text-[10px] text-[var(--color-text-secondary)] font-bold uppercase tracking-widest">Live Dispatch Monitor</span>
                </div>
                <span className="text-[10px] text-[#D4AF37] font-semibold bg-[#D4AF37]/10 border border-[#D4AF37]/25 px-2.5 py-1 rounded-full uppercase">SaaS Active</span>
              </div>

              {/* Live feed */}
              <div className="mb-5">
                {liveBookings.length > 0 ? (
                  <div key={liveBookingIdx} className="feed-item p-4 rounded-2xl dashboard-inner-card">
                    <p className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-wider mb-1.5">Active Allocation</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--color-text-primary)] text-xs font-semibold">{liveBookings[liveBookingIdx].service}</span>
                      <span className="text-[var(--color-text-secondary)] text-[10px]">{liveBookings[liveBookingIdx].time}</span>
                    </div>
                    <p className="text-[var(--color-text-secondary)] text-[11px] mt-1 flex items-center gap-1">
                      <span>📍</span> {liveBookings[liveBookingIdx].location} •{' '}
                      <span className={`font-bold ${liveBookings[liveBookingIdx].status === 'Completed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {liveBookings[liveBookingIdx].status}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="feed-item p-4 rounded-2xl dashboard-inner-card flex items-center justify-center">
                    <span className="text-[var(--color-text-secondary)] text-xs font-semibold">No Active Bookings Right Now</span>
                  </div>
                )}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Satisfaction */}
                <div className="p-4 rounded-2xl dashboard-inner-card text-center">
                  <p className="text-[9px] text-[var(--color-text-secondary)] font-bold uppercase tracking-widest mb-1.5">Satisfaction</p>
                  <div className="flex justify-center items-baseline gap-0.5">
                    <span className="text-2xl font-black text-[var(--color-text-primary)]">98.4</span>
                    <span className="text-xs text-[#D4AF37] font-bold">%</span>
                  </div>
                  <div className="w-full bg-[var(--color-overlay-subtle)] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#D4AF37] to-[#FFE89C] h-full rounded-full transition-all duration-1000"
                      style={{ width: dashboardVisible ? '98.4%' : '0%' }}
                    />
                  </div>
                </div>

                {/* Response time */}
                <div className="p-4 rounded-2xl dashboard-inner-card text-center flex flex-col justify-center">
                  <p className="text-[9px] text-[var(--color-text-secondary)] font-bold uppercase tracking-widest mb-1.5">Response</p>
                  <span className="text-xl font-black text-[#D4AF37]">&lt; 30 Mins</span>
                  <p className="text-[9px] text-[var(--color-text-secondary)] mt-1 font-semibold">Avg. Allocation</p>
                </div>
              </div>

              {/* Stat row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'Bookings Today', value: '12', icon: '📅' },
                  { label: 'Avg Rating', value: '4.9⭐', icon: '' },
                  { label: 'Secured', value: '🔒 100%', icon: '' },
                ].map((s, i) => (
                  <div key={i} className="p-2.5 rounded-xl dashboard-inner-card text-center">
                    <p className="text-[9px] text-[var(--color-text-secondary)] font-semibold mb-1 leading-tight">{s.label}</p>
                    <p className="text-[11px] font-black text-[var(--color-text-primary)]">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center text-xs text-[var(--color-text-secondary)]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-[#D4AF37]" />
                  <span>Vetted Providers: <strong className="text-[var(--color-text-primary)]">{realStats.providers !== null ? providersVal : 'N/A'}</strong></span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5">
          <span className="text-[9px] text-[var(--color-text-secondary)] uppercase tracking-widest font-semibold">Scroll to explore</span>
          <div className="scroll-down-arrow w-6 h-10 border border-[#D4AF37]/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-[#D4AF37] rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══ TRUST STATS ═══ */}
      <section className="py-24 relative overflow-hidden bg-[var(--color-primary-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-5 sm:gap-6">
            {[
              { label: 'Happy Customers', target: 15000, suffix: '+', icon: Users },
              { label: 'Verified Professionals', target: 1200, suffix: '+', icon: Award },
              { label: 'Completed Services', target: 50000, suffix: '+', icon: TrendingUp },
              { label: 'Years of Experience', target: 8, suffix: '+', icon: Calendar },
              { label: 'Customer Rating', target: 4.9, suffix: '/5', icon: Star, isFloat: true },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <AnimSection key={stat.label} dir="scale" delay={i * 100}>
                  <div className="glass-panel-luxury rounded-[28px] p-6 sm:p-7 text-center border border-[#D4AF37]/15 group hover:border-[#D4AF37]/50 transition-all duration-400 light-sweep h-full flex flex-col items-center justify-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 group-hover:bg-[#D4AF37]/18 transition-all">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-black text-[#D4AF37]">
                      {stat.isFloat ? `${stat.target}${stat.suffix}` : <Counter target={stat.target} suffix={stat.suffix} />}
                    </h3>
                    <p className="text-[var(--color-text-secondary)] text-[10px] font-bold tracking-widest uppercase leading-tight">{stat.label}</p>
                  </div>
                </AnimSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ SERVICES SECTION ═══ */}
      <section id="services" className="py-24 relative bg-[var(--color-primary-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 space-y-4">
            <AnimSection dir="up">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full glass-panel-luxury border border-[#D4AF37]/20 mb-2">
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Vetted Categories</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-[var(--color-text-primary)] mt-2">
                Bespoke <span className="gold-text-shimmer">Service Offerings</span>
              </h2>
              <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm max-w-xl mx-auto leading-relaxed mt-3">
                Five core domains executed with immaculate attention to detail using industry-grade equipment.
              </p>
            </AnimSection>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {services.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <AnimSection key={svc.name} dir="up" delay={i * 90}>
                  <div className="glass-panel-luxury rounded-[32px] overflow-hidden flex flex-col h-full border border-[var(--color-border-subtle)] gold-glow-border group cursor-pointer light-sweep">
                    <div className="relative h-48 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent z-[2]" />
                      <img
                        src={svc.imgUrl}
                        alt={svc.name}
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=500&auto=format&fit=crop'; }}
                        className="w-full h-full object-cover img-scale-hover group-hover:scale-106"
                      />
                      <div className="absolute top-4 left-4 z-10 w-10 h-10 rounded-xl bg-[var(--color-modal-overlay)] backdrop-blur-md border border-[#D4AF37]/35 flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37]/70 transition-colors">
                        <Icon size={17} />
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-[#D4AF37] transition-colors">{svc.name}</h3>
                      <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed mb-5 flex-grow">{svc.desc}</p>
                      <div className="border-t border-[var(--color-border-subtle)] pt-4 flex items-center justify-between mt-auto">
                        <div>
                          <span className="text-[9px] text-[var(--color-text-secondary)] block uppercase tracking-widest font-semibold">From</span>
                          <span className="text-base font-bold text-[var(--color-text-primary)]">{svc.price}</span>
                        </div>
                        <Link to="/services" state={{ category: svc.name }}>
                          <button className="gold-filled-btn px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase cursor-pointer flex items-center gap-1 relative overflow-hidden">
                            <span>Book Now</span>
                            <ArrowRight size={10} />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </AnimSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ WHY FIXORA ═══ */}
      <section id="why-fixora" className="py-24 relative bg-[var(--color-primary-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 space-y-4">
            <AnimSection dir="up">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full glass-panel-luxury border border-[#D4AF37]/20 mb-2">
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Features</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-[var(--color-text-primary)] mt-2">
                Why Homeowners <span className="gold-text-shimmer">Choose Fixora</span>
              </h2>
              <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm max-w-xl mx-auto leading-relaxed mt-3">
                Modern tracking, strict vetting, and gold-standard domestic support.
              </p>
            </AnimSection>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <AnimSection key={card.title} dir="scale" delay={i * 80}>
                  <div className="glass-panel-luxury rounded-[28px] p-7 border border-[var(--color-border-subtle)] gold-glow-border h-full flex flex-col justify-between light-sweep group">
                    <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] mb-5 group-hover:scale-110 group-hover:bg-[#D4AF37]/18 transition-all">
                      <Icon size={19} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-[#D4AF37] transition-colors">{card.title}</h3>
                      <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed">{card.desc}</p>
                    </div>
                  </div>
                </AnimSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-24 relative bg-[var(--color-primary-bg)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20 space-y-4">
            <AnimSection dir="up">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full glass-panel-luxury border border-[#D4AF37]/20 mb-2">
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Workflow</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-[var(--color-text-primary)] mt-2">
                How <span className="gold-text-shimmer">It Works</span>
              </h2>
              <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm max-w-lg mx-auto mt-3">
                Four streamlined steps to schedule, execute, and verify your service.
              </p>
            </AnimSection>
          </div>

          <div className="relative">
            <div className="absolute left-[24px] md:left-1/2 md:-translate-x-px top-2 bottom-8 w-px bg-gradient-to-b from-[#D4AF37]/60 via-[#D4AF37]/15 to-transparent hidden sm:block" />
            <div className="space-y-12">
              {steps.map((step, i) => (
                <AnimSection key={step.num} dir={i % 2 === 0 ? 'left' : 'right'} delay={i * 100}>
                  <div className={`flex items-center gap-6 sm:gap-10 ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                    <div className={`flex-1 ${i % 2 !== 0 ? 'md:text-right' : ''}`}>
                      <div className="glass-panel-luxury rounded-3xl p-6 border border-[var(--color-border-subtle)] gold-glow-border inline-block w-full group light-sweep">
                        <span className="text-[9px] text-[#D4AF37] font-black uppercase tracking-widest mb-1.5 block">Stage {step.num}</span>
                        <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-[#D4AF37] transition-colors">{step.title}</h3>
                        <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFE89C] to-[#D4AF37] text-zinc-950 flex items-center justify-center font-black text-sm shadow-xl shadow-[#D4AF37]/15 border border-[#D4AF37]/30">
                        {step.num}
                      </div>
                    </div>
                    <div className="flex-1 hidden md:block" />
                  </div>
                </AnimSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-24 relative overflow-hidden bg-[var(--color-primary-bg)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-14">
            <AnimSection dir="up">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full glass-panel-luxury border border-[#D4AF37]/20 mb-4">
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Testimonials</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-[var(--color-text-primary)] mt-2">
                Vetted By <span className="gold-text-shimmer">Discerning Homeowners</span>
              </h2>
            </AnimSection>
          </div>

          <div className="glass-panel-luxury rounded-[32px] p-8 sm:p-12 text-center border border-[#D4AF37]/15 shadow-2xl relative overflow-hidden light-sweep">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/4 rounded-full blur-3xl pointer-events-none" />
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D4AF37]/40 mx-auto mb-6 shadow-lg shadow-[#D4AF37]/10">
              <img src={testimonials[activeTestimonial].img} alt={testimonials[activeTestimonial].name} className="w-full h-full object-cover" />
            </div>
            <div className="flex justify-center gap-1 mb-5 text-[#D4AF37]">
              {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                <Star key={i} size={15} className="fill-[#D4AF37]" />
              ))}
            </div>
            <p className="text-[var(--color-text-primary)] text-base sm:text-lg leading-relaxed mb-6 font-medium italic">
              "{testimonials[activeTestimonial].text}"
            </p>
            <p className="text-[#D4AF37] font-black text-sm uppercase tracking-widest">{testimonials[activeTestimonial].name}</p>
            <p className="text-[var(--color-text-secondary)] text-xs mt-1">{testimonials[activeTestimonial].role}</p>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                className={`h-2 rounded-full transition-all duration-400 ${activeTestimonial === i ? 'w-6 bg-[#D4AF37]' : 'w-2 bg-white/20 hover:bg-white/40'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="py-24 relative bg-[var(--color-primary-bg)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 space-y-4">
            <AnimSection dir="up">
              <h2 className="text-3xl sm:text-5xl font-black text-[var(--color-text-primary)]">
                Frequently Asked <span className="gold-text-shimmer">Questions</span>
              </h2>
              <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm mt-3">
                Immediate answers about booking, trust audits, and guarantees.
              </p>
            </AnimSection>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <AnimSection key={idx} dir="up" delay={idx * 60}>
                  <div className="glass-panel-luxury rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden transition-all duration-300 shadow-md hover:border-[#D4AF37]/20">
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-[var(--color-text-primary)] hover:text-[#D4AF37] transition-colors cursor-pointer"
                    >
                      <span className="text-sm sm:text-base flex items-center gap-3">
                        <HelpCircle size={18} className="text-[#D4AF37] shrink-0" />
                        {faq.q}
                      </span>
                      <ChevronDown size={18} className={`text-[var(--color-text-secondary)] transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-[#D4AF37]' : ''}`} />
                    </button>
                    <div className={`transition-all duration-350 ease-in-out overflow-hidden ${isOpen ? 'max-h-48 border-t border-[var(--color-border-subtle)]' : 'max-h-0'}`}>
                      <p className="p-6 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-secondary-bg)]/40">{faq.a}</p>
                    </div>
                  </div>
                </AnimSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ CTA SECTION ═══ */}
      <section className="py-24 relative overflow-hidden bg-[var(--color-primary-bg)]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D4AF37]/2 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <AnimSection dir="scale">
            <div className="glass-panel-luxury rounded-[40px] px-8 py-16 sm:py-20 border border-[#D4AF37]/20 shadow-2xl relative overflow-hidden light-sweep">
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[60px]" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[60px]" />
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[var(--color-text-primary)] leading-tight mb-5">
                Ready to Upgrade Your <br />
                <span className="gold-text-shimmer">Home Maintenance?</span>
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-10">
                Book verified professionals in under 60 seconds. Transparent pricing, dedicated support, and immaculate quality.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/services">
                  <RippleButton className="gold-filled-btn px-9 py-4 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2.5 cursor-pointer">
                    <span>Book a Service Now</span>
                    <ArrowRight size={14} />
                  </RippleButton>
                </Link>
                <Link to="/provider/register">
                  <RippleButton className="glass-outline-btn px-9 py-4 rounded-full text-xs font-black uppercase tracking-widest cursor-pointer">
                    Join as a Provider
                  </RippleButton>
                </Link>
              </div>
            </div>
          </AnimSection>
        </div>
      </section>

      {/* Footer is rendered by App.jsx */}

    </div>
  );
};

export default LandingPage;
