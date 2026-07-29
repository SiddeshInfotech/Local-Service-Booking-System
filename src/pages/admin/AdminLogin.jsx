import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ShieldCheck, LogIn, Loader2, Sparkles, Sun, Moon } from 'lucide-react';
import InputField from '../../components/InputField';
import fixoraLogo from '../../assets/images/fixora_logo.png';
import adminIllustration from '../../assets/images/admin_login_illustration.png';
import { API_BASE_URL, setAdminTokens } from '../../api';
import { useTheme } from '../../contexts/ThemeContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackType, setFeedbackType] = useState('success'); // 'success' | 'error'
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes('@') || password.length < 4) {
      setFeedbackType('error');
      setFeedbackMsg('Invalid email address or password length must be at least 4 characters.');
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.status) {
        setAdminTokens(data.access_token, data.refresh_token, data.admin);
        setFeedbackType('success');
        setFeedbackMsg(`Welcome, ${data.admin.full_name}! Initializing secure session...`);
        setTimeout(() => navigate('/admin/dashboard'), 800);
      } else {
        setFeedbackType('error');
        setFeedbackMsg(data.message || 'Login failed. Check your credentials.');
      }
    } catch {
      setFeedbackType('error');
      setFeedbackMsg('Unable to connect to the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 bg-[var(--color-primary-bg)] overflow-hidden select-none">
      
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)] border border-transparent hover:border-[var(--color-border-subtle)] transition-colors z-[100]"
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Background Decorative Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#D4AF37]/3 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '6s' }} />

      <div className="relative z-10 w-full max-w-5xl bg-[var(--color-secondary-bg)]/90 border border-[#D4AF37]/18 rounded-[32px] overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-[0_0_60px_-12px_rgba(212,175,55,0.15)] backdrop-blur-xl transition-all duration-500">

        {/* Left Panel */}
        <div className="relative hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[var(--color-secondary-bg)] via-[var(--color-primary-bg)] to-[var(--color-secondary-bg)] border-r border-[#D4AF37]/10">
          {/* Orbital Glows */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-56 h-56 bg-[#D4AF37]/3 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />

          {/* Top: logo + brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <img
                src={fixoraLogo}
                alt="Fixora Logo"
                className="h-24 w-auto object-contain"
              />
              <div>
                <p className="text-[#D4AF37] text-xs font-semibold tracking-widest uppercase mt-1">Admin Portal</p>
              </div>
            </div>
            <h2 className="text-3xl font-black text-[var(--color-text-primary)] leading-snug">
              Secure Admin<br />
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F4C542] bg-clip-text text-transparent">Control Panel</span>
            </h2>
            <p className="text-[var(--color-text-secondary)] mt-4 text-sm leading-relaxed">
              Real-time monitoring, service moderation, customer & provider registries, analytics, and platform controls from one centralized panel.
            </p>
          </div>

          {/* Bottom: feature list */}
          <div className="relative z-10 flex flex-col gap-3.5">
            {[
              'Manage customers & providers',
              'Approve & block service providers',
              'Monitor bookings & reviews',
              'View platform reports & analytics',
            ].map((item, idx) => (
              <div key={item} className="flex items-center gap-3 text-sm text-[var(--color-text-primary)] group">
                <div className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/50 flex-shrink-0 group-hover:scale-125 transition-transform" />
                <span className="transition-colors group-hover:text-[var(--color-text-primary)]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-[var(--color-secondary-bg)]/40">

          <div className="flex items-center gap-3 mb-4 md:hidden">
            <img
              src={fixoraLogo}
              alt="Fixora Logo"
              className="h-20 w-auto object-contain"
            />
            <span className="text-[#D4AF37] text-sm font-semibold tracking-widest uppercase">Admin Portal</span>
          </div>

          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-1 tracking-tight">Welcome Back</h2>
          <p className="text-[var(--color-text-secondary)] text-sm mb-8">Restricted access — authorized personnel only</p>

          {/* Floating alert notifications */}
          {feedbackMsg && (
            <div className={`mb-6 p-4 rounded-2xl border text-sm flex items-center gap-3 animate-fade-in ${
              feedbackType === 'success' 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              <Sparkles size={16} className="flex-shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <InputField
              label="Admin Email"
              id="admin-email"
              type="email"
              required
              placeholder="admin@fixora.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              rightElement={<Mail size={18} className="text-[var(--color-text-secondary)]" />}
              className="focus-within:ring-2 focus-within:ring-[#D4AF37]/20"
            />

            <InputField
              label="Password"
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              className="focus-within:ring-2 focus-within:ring-[#D4AF37]/20"
            />

            <div className="flex justify-between items-center text-xs sm:text-sm mt-1">
              <label className="flex items-center gap-2 text-[var(--color-text-secondary)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#D4AF37]/20 bg-[var(--color-secondary-bg)] text-[#D4AF37] focus:ring-[#D4AF37]/20 transition-all cursor-pointer"
                />
                Remember Me
              </label>
              <button 
                type="button" 
                onClick={() => {
                  setFeedbackType('error');
                  setFeedbackMsg('Self-serve password resets are disabled for administrative security. Contact IT.');
                }} 
                className="text-[#D4AF37] hover:text-[#F4C542] transition-colors font-medium text-right bg-transparent border-none cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (feedbackMsg && feedbackType === 'success')}
              className="w-full bg-[#D4AF37] hover:bg-[#F4C542] text-[#111111] font-bold py-3.5 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg shadow-gold-accent/15 hover:shadow-gold-accent/25"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Login as Admin</span>
                </>
              )}
            </button>

          </form>

          <div className="mt-8 space-y-2 text-center sm:text-left text-sm text-[var(--color-text-secondary)]">
            <p>
              Not an admin?{' '}
              <Link to="/customer/login" className="text-[#D4AF37] hover:text-[#F4C542] transition-colors font-medium">
                Customer Login
              </Link>
              {' '}or{' '}
              <Link to="/provider/login" className="text-[#D4AF37] hover:text-[#F4C542] transition-colors font-medium">
                Provider Portal
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
