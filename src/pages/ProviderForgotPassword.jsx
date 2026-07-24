import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ShieldCheck, Key, RefreshCw } from 'lucide-react';
import InputField from '../components/InputField';
import { API_BASE_URL } from '../config';

const ProviderForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  const validateEmail = (emailVal) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailVal);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Email address is required.');
      return;
    }
    if (!validateEmail(email)) {
      setErrorMsg('Please enter a valid email format (e.g., user@example.com).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/provider/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.status) {
        setSuccessMsg(data.message || 'OTP sent successfully to your registered email address.');
        // Navigate to OTP verification page, passing email via state
        setTimeout(() => {
          navigate('/provider/verify-otp', { state: { email } });
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Reset request failed. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Server connection failed. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-[calc(100vh-96px)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative"
      style={{ background: 'linear-gradient(135deg, #0B1220 0%, #0f172a 100%)' }}
    >
      <div className="absolute inset-0 bg-[#0B1220]/50 z-0 pointer-events-none" />

      {/* Banner Messages */}
      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-blue-950/40 border border-blue-800/40 text-blue-300 text-sm max-w-5xl w-full text-center relative z-10 backdrop-blur-md">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-sm max-w-5xl w-full text-center relative z-10 backdrop-blur-md">
          {errorMsg}
        </div>
      )}

      {/* Main card */}
      <div className="w-full max-w-5xl bg-[#131b2e]/30 border border-zinc-800/80 rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-2xl backdrop-blur-md relative z-10">

        {/* Left Side: Decorative Panel */}
        <div className="relative hidden md:flex flex-col justify-between overflow-hidden min-h-[480px] bg-[#0B1220]">
          <div className="absolute top-0 left-0 w-80 h-80 bg-blue-600/8 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/6 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-blue-500/3 pointer-events-none" />

          {/* Feature pills */}
          <div className="absolute top-8 right-8 z-10 flex flex-col gap-2">
            {[
              { icon: ShieldCheck, label: 'Secure Reset' },
              { icon: Key, label: 'OTP Verified' },
              { icon: RefreshCw, label: 'Quick Recovery' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/25 backdrop-blur-sm">
                <Icon size={12} className="text-blue-400" />
                <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>

          {/* Caption at the bottom */}
          <div className="absolute bottom-10 left-8 right-8 z-10">
            <span className="text-blue-400 text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded bg-blue-600/15 border border-blue-500/30 inline-block mb-3.5 backdrop-blur-sm">
              Provider Account Recovery
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight drop-shadow-lg">
              Regain Access <br /> Securely & Instantly
            </h2>
            <p className="text-zinc-300 mt-2 text-sm leading-relaxed drop-shadow-md">
              Enter your registered email and we'll send a 6-digit OTP to reset your password.
            </p>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-[#0B1220]/45 text-left">
          <h2 className="text-3xl font-bold text-[#D4AF37] mb-1">
            Forgot Password
          </h2>
          <p className="text-zinc-400 text-sm mb-8 text-left">
            Enter your registered provider email to receive a 6-digit OTP.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <InputField
              label="Provider Email"
              id="provider-recovery-email"
              type="text"
              required
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              rightElement={<Mail size={18} className="text-zinc-500" />}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#00a8e8] hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-2 bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg"
            >
              {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>

          <div className="mt-8 text-center sm:text-left">
            <Link
              to="/provider/login"
              className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Provider Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderForgotPassword;
