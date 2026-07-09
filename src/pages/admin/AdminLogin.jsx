import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ShieldCheck, LogIn } from 'lucide-react';
import InputField from '../../components/InputField';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMsg('');
    setTimeout(() => {
      setIsSubmitting(false);
      setFeedbackMsg('Admin authenticated (Demo Mode)! Redirecting to Dashboard...');
      setEmail('');
      setPassword('');
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 bg-[#0b111e]">

      {feedbackMsg && (
        <div className="mb-6 p-4 rounded-xl bg-blue-950/40 border border-blue-800/40 text-blue-300 text-sm max-w-5xl w-full text-center">
          {feedbackMsg}
        </div>
      )}

      <div className="w-full max-w-5xl bg-[#131b2e]/30 border border-zinc-800/80 rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-2xl backdrop-blur-md">

        {/* Left Panel */}
        <div className="relative hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[#0B1220] via-[#0d1a35] to-[#111b38] border-r border-zinc-800/60">
          {/* Glow */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-56 h-56 bg-blue-500/8 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />

          {/* Top: shield icon + brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <ShieldCheck size={24} className="text-blue-400" />
              </div>
              <div>
                <p className="text-white font-bold text-lg tracking-tight leading-none">Fixora</p>
                <p className="text-blue-400 text-xs font-medium tracking-widest uppercase">Admin Portal</p>
              </div>
            </div>
            <h2 className="text-3xl font-black text-white leading-snug">
              Secure Admin<br />
              <span className="text-blue-400">Control Panel</span>
            </h2>
            <p className="text-zinc-400 mt-4 text-sm leading-relaxed">
              Manage customers, providers, bookings, services, and platform analytics from one place.
            </p>
          </div>

          {/* Bottom: feature chips */}
          <div className="relative z-10 flex flex-col gap-3">
            {[
              'Manage customers & providers',
              'Approve & block service providers',
              'Monitor bookings & reviews',
              'View platform reports & analytics',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-[#0B1220]/45">

          <div className="flex items-center gap-2 mb-2 md:hidden">
            <ShieldCheck size={20} className="text-blue-400" />
            <span className="text-blue-400 text-sm font-semibold tracking-widest uppercase">Admin Portal</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-1">Admin Login</h2>
          <p className="text-zinc-500 text-sm mb-8">Restricted access — authorized personnel only</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <InputField
              label="Admin Email"
              id="admin-email"
              type="email"
              required
              placeholder="admin@fixora.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              rightElement={<Mail size={18} className="text-zinc-500" />}
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
                  className="text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <div className="flex justify-between items-center text-sm mt-1">
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500/20"
                />
                Remember Me
              </label>
              <Link to="/forgot-password" className="text-blue-500 hover:text-blue-400 transition-colors">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              <LogIn size={16} />
              <span>{isSubmitting ? 'Authenticating...' : 'Login as Admin'}</span>
            </button>

          </form>

          <div className="mt-8 space-y-2 text-center sm:text-left text-sm text-zinc-500">
            <p>
              Not an admin?{' '}
              <Link to="/customer/login" className="text-blue-500 hover:text-blue-400 transition-colors font-medium">
                Customer Login
              </Link>
              {' '}or{' '}
              <Link to="/provider/login" className="text-blue-500 hover:text-blue-400 transition-colors font-medium">
                Provider Login
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
