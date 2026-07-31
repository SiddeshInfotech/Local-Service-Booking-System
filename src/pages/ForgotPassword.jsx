import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ShieldCheck, Key, RefreshCw } from 'lucide-react';
import InputField from '../components/InputField';
import forgotPasswordIllustration from '../assets/images/forgot_password_illustration.png';
import { API_BASE_URL, fetchWithTimeout } from '../api';

const ForgotPassword = () => {
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
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/customer/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.status) {
        setSuccessMsg(data.message || 'OTP sent successfully to your registered email address.');
        // Navigate to OTP verify page, passing email via state
        setTimeout(() => {
          navigate('/customer/verify-otp', { state: { email } });
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
      className="min-h-[calc(100vh-96px)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 bg-cover bg-center bg-no-repeat relative bg-[var(--color-primary-bg)]"
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-[var(--color-primary-bg)]/50 z-0 pointer-events-none" />

      {/* Top Banner Alert Message */}
      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-gold-accent/10 border border-gold-accent/25 text-gold-accent text-sm max-w-5xl w-full text-center relative z-10 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-sm max-w-5xl w-full text-center relative z-10 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
          {errorMsg}
        </div>
      )}

      {/* Main card matching CustomerLogin UI */}
      <div className="w-full max-w-5xl glass-card rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-2xl relative z-10 transition-all duration-300">
        
        {/* Left Side: Illustration Panel */}
        <div className="relative hidden md:flex flex-col justify-between overflow-hidden min-h-[480px] bg-[var(--color-primary-bg)]">
          <div className="absolute top-0 left-0 w-80 h-80 bg-[#D4AF37]/8 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#D4AF37]/6 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 via-transparent to-[#D4AF37]/3 pointer-events-none" />

          {/* Illustration image centered */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <img
              src={forgotPasswordIllustration}
              alt="Password Recovery Illustration"
              className="w-full max-w-[320px] h-auto object-contain opacity-90 drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 0 40px rgba(212,175,55,0.15))' }}
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary-bg)]/90 via-transparent to-[var(--color-primary-bg)]/40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary-bg)]/20 via-transparent to-[var(--color-primary-bg)]/60 pointer-events-none" />

          {/* Feature pills */}
          <div className="absolute top-8 right-8 z-10 flex flex-col gap-2">
            {[
              { icon: ShieldCheck, label: 'Secure Reset' },
              { icon: Key, label: 'Email Verified' },
              { icon: RefreshCw, label: 'Quick Recovery' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 backdrop-blur-sm">
                <Icon size={12} className="text-[#D4AF37]" />
                <span className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
          
          {/* Caption / Hero Text at the bottom */}
          <div className="absolute bottom-10 left-8 right-8 z-10">
            <span className="text-gold-accent text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded bg-gold-accent/15 border border-gold-accent/30 inline-block mb-3.5 backdrop-blur-sm">
              Account Recovery
            </span>
            <h2 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight leading-tight drop-shadow-lg">
              Regain Access <br /> Securely & Instantly
            </h2>
            <p className="text-[var(--color-text-primary)] mt-2 text-sm leading-relaxed drop-shadow-md">
              Your account security is our priority. Get a reset link in seconds.
            </p>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-[var(--color-secondary-bg)]/40 backdrop-blur-md">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
            Forgot Password
          </h2>
          
          {!successMsg ? (
            <>
              <p className="text-[var(--color-text-secondary)] text-sm mb-8 text-left">
                Enter your registered email address to receive a 6-digit OTP code.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <InputField
                  label="Recovery Email"
                  id="recovery-email"
                  type="text"
                  required
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  rightElement={<Mail size={18} className="text-[var(--color-text-secondary)]" />}
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gold-accent hover:bg-gold-hover text-bg-dark font-bold py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-2 shadow-lg shadow-gold-accent/15 hover:shadow-gold-accent/25"
                >
                  {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>

              <div className="mt-8 text-center sm:text-left">
                <Link
                  to="/customer/login"
                  className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Login</span>
                </Link>
              </div>
            </>
          ) : (
            <div className="mt-6 flex flex-col gap-6 text-left">
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                We've processed your recovery request. You can check your inbox for instructions to reset your password.
              </p>
              
              <Link to="/customer/login" className="w-full">
                <button
                  type="button"
                  className="w-full bg-[var(--color-zinc-800)] hover:bg-[var(--color-zinc-700)] text-[var(--color-text-primary)] font-bold py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] shadow-lg"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Login</span>
                </button>
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
