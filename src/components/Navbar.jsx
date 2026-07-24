import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LayoutDashboard, LogOut } from 'lucide-react';
import fixoraLogo from '../assets/images/fixora_logo.png';
import { clearAuth, getRole } from '../api';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const loginRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [authRole, setAuthRole] = useState(null);

  const authRoutes = [
    '/customer/login',
    '/customer/register',
    '/provider/login',
    '/provider/register'
  ];
  const isAuthRoute = authRoutes.includes(location.pathname);

  /* Scroll glass effect */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    fn(); // run on mount
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* Close login dropdown on outside click */
  useEffect(() => {
    const fn = (e) => {
      if (loginRef.current && !loginRef.current.contains(e.target)) setLoginOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  /* Close mobile menu on route change */
  useEffect(() => {
    setMobileOpen(false);
    setLoginOpen(false);
    setAuthRole(getRole());
  }, [location.pathname]);

  /* Sync auth state on mount */
  useEffect(() => { setAuthRole(getRole()); }, []);

  const handleLogout = () => {
    clearAuth();
    setAuthRole(null);
    navigate('/');
  };

  const navLinks = [
    { name: 'Home',            path: '/' },
    { name: 'Services',        path: '/services' },
    { name: 'About Us',        path: '/about' },
    { name: 'Contact Us',      path: '/contact' },
    { name: 'Terms & Policies', path: '/terms' },
  ];

  const loginLinks = [
    { name: 'Customer Login',    path: '/customer/login' },
    { name: 'Customer Register', path: '/customer/register' },
    { name: 'Provider Login',    path: '/provider/login' },
    { name: 'Provider Register', path: '/provider/register' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* ── Global styles (scoped to navbar usage) ── */}
      <style>{`
        .fixora-navbar-glass {
          background: rgba(15, 17, 21, 0.92);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
        }
        .fixora-login-dropdown {
          background: rgba(18, 18, 18, 0.96);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(212, 175, 55, 0.22);
        }
        @keyframes navFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nav-fade-in { animation: navFadeIn 0.25s ease both; }

        .nav-gold-btn {
          background: linear-gradient(135deg, #F4C542 0%, #D4AF37 55%, #BCA032 100%);
          color: #0D0D0D;
          font-weight: 800;
          box-shadow: 0 4px 20px rgba(212,175,55,0.28);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nav-gold-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 30px rgba(212,175,55,0.5);
          background: linear-gradient(135deg, #FFE89C 0%, #F4C542 55%, #D4AF37 100%);
        }
      `}</style>

      <header
        className={`${isAuthRoute ? 'sticky' : 'fixed'} top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || isAuthRoute
            ? 'fixora-navbar-glass shadow-2xl shadow-black/80 border-b border-[#D4AF37]/20'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* ── Logo ── */}
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <img
                src={fixoraLogo}
                alt="Fixora Logo"
                className="h-16 w-auto object-contain transition-all duration-300 group-hover:opacity-85 group-hover:scale-105"
              />
            </Link>

            {/* ── Desktop Nav Links ── */}
            <nav className="hidden xl:flex items-center gap-7 lg:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-medium tracking-wide transition-all duration-300 hover:translate-y-[-1px] relative ${
                    isActive(link.path)
                      ? 'text-[#D4AF37] after:content-[""] after:absolute after:bottom-[-6px] after:left-0 after:right-0 after:h-[2px] after:bg-[#D4AF37] after:rounded-full'
                      : 'text-zinc-300 hover:text-[#D4AF37]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* ── Desktop Right: Auth-aware ── */}
            <div className="hidden xl:flex items-center gap-3">
              {authRole && (authRole === 'customer' || authRole === 'provider') ? (
                <>
                  <Link
                    to="/services"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all border border-white/10"
                  >
                    Services
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest nav-gold-btn cursor-pointer"
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="relative" ref={loginRef}>
                  <button
                    onClick={() => setLoginOpen((v) => !v)}
                    className="nav-gold-btn px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer relative overflow-hidden"
                  >
                    <span>Login</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-300 ${loginOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {loginOpen && (
                    <div className="absolute right-0 top-full mt-3 w-56 fixora-login-dropdown rounded-2xl p-2.5 shadow-2xl z-50 nav-fade-in">
                      <div className="px-3 py-2 border-b border-[#D4AF37]/10 mb-1.5">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                          Account Portal
                        </p>
                      </div>
                      {loginLinks.map((l) => (
                        <Link
                          key={l.path}
                          to={l.path}
                          onClick={() => setLoginOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all group ${
                            location.pathname === l.path
                              ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-semibold'
                              : 'text-zinc-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] group-hover:scale-125 transition-transform flex-shrink-0" />
                          {l.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Mobile Hamburger ── */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="xl:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

          </div>
        </div>

        {/* ── Mobile Drawer ── */}
        {mobileOpen && (
          <div className="xl:hidden fixora-navbar-glass border-t border-[#D4AF37]/15 px-4 pt-3 pb-6 space-y-1 nav-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                    : 'text-zinc-300 hover:text-[#D4AF37] hover:bg-white/5'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="border-t border-[#D4AF37]/10 pt-4 mt-2">
              {authRole && (authRole === 'customer' || authRole === 'provider') ? (
                <div className="flex justify-end">
                  <button
                    onClick={() => { setMobileOpen(false); handleLogout(); }}
                    className="w-full py-2.5 text-center text-xs font-bold rounded-xl bg-[#D4AF37] hover:bg-[#F4C542] text-[#111111] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut size={12} /> Sign Out
                  </button>
                </div>
              ) : (
                <>
                  <p className="px-3 text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Portal Access</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/customer/login"
                      onClick={() => setMobileOpen(false)}
                      className="py-2.5 text-center text-xs font-semibold rounded-xl bg-[#1A1D23] hover:bg-[#232831] text-zinc-300 transition-colors"
                    >
                      Customer Login
                    </Link>
                    <Link
                      to="/provider/login"
                      onClick={() => setMobileOpen(false)}
                      className="py-2.5 text-center text-xs font-bold rounded-xl bg-[#D4AF37] hover:bg-[#F4C542] text-[#111111] transition-colors"
                    >
                      Provider Login
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
