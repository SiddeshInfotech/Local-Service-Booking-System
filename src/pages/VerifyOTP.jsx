import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, RefreshCw, Key } from 'lucide-react';
import { API_BASE_URL } from '../config';

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine role from path: /customer/verify-otp or /provider/verify-otp
  const role = location.pathname.startsWith('/provider') ? 'provider' : 'customer';
  const email = location.state?.email || '';

  useEffect(() => {
    // If no email passed, redirect back to forgot password
    if (!email) {
      navigate(role === 'provider' ? '/provider/forgot-password' : '/customer/forgot-password');
    }
    // Auto focus first input
    inputRefs.current[0]?.focus();
  }, [email, navigate, role]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setErrorMsg('');

    // Auto advance to next field
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      pasted.split('').forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setErrorMsg('Please enter all 6 digits of your OTP.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/${role}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString }),
      });
      const data = await res.json();

      if (res.ok && data.status) {
        setSuccessMsg('OTP verified! Redirecting to reset password...');
        setTimeout(() => {
          navigate(`/${role}/reset-password`, {
            state: { email, otp: otpString }
          });
        }, 1200);
      } else {
        setErrorMsg(data.message || 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setErrorMsg('Server connection failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/${role}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.status) {
        setSuccessMsg('A new OTP has been sent to your email.');
        setResendCooldown(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setErrorMsg(data.message || 'Failed to resend OTP.');
      }
    } catch {
      setErrorMsg('Server connection failed. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const backLink = role === 'provider' ? '/provider/forgot-password' : '/customer/forgot-password';

  return (
    <div
      className="min-h-[calc(100vh-96px)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative"
      style={{ background: 'linear-gradient(135deg, #0F1115 0%, #1A1D23 100%)' }}
    >
      <div className="absolute inset-0 bg-[#0F1115]/50 z-0 pointer-events-none" />

      {/* Banner Messages */}
      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-gold-accent/10 border border-gold-accent/25 text-gold-accent text-sm max-w-md w-full text-center relative z-10 backdrop-blur-md">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-sm max-w-md w-full text-center relative z-10 backdrop-blur-md">
          {errorMsg}
        </div>
      )}

      <div className="w-full max-w-md glass-card rounded-3xl shadow-2xl relative z-10">
        <div className="p-8 sm:p-12 flex flex-col items-center">

          {/* Icon badge */}
          <div className="w-16 h-16 rounded-2xl bg-gold-accent/10 border border-gold-accent/25 flex items-center justify-center mb-6">
            <ShieldCheck size={32} className="text-gold-accent" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-2 text-center">Verify OTP</h2>
          <p className="text-zinc-400 text-sm mb-2 text-center">
            Enter the 6-digit code sent to
          </p>
          <p className="text-gold-accent font-semibold text-sm mb-8 text-center truncate max-w-[280px]">
            {email}
          </p>

          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-6">
            {/* OTP Input Boxes */}
            <div className="flex gap-3 justify-center" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-11 h-14 text-center text-xl font-bold rounded-xl border bg-zinc-900/80 text-white outline-none transition-all duration-200 
                    ${digit ? 'border-gold-accent/60 bg-gold-accent/5 shadow-[0_0_12px_rgba(212,175,55,0.15)]' : 'border-zinc-700/60'} 
                    focus:border-gold-accent focus:bg-gold-accent/5 focus:shadow-[0_0_16px_rgba(212,175,55,0.2)]`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otp.join('').length !== 6}
              className="w-full bg-gold-accent hover:bg-gold-hover text-bg-dark font-bold py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 shadow-lg shadow-gold-accent/15 hover:shadow-gold-accent/25"
            >
              <Key size={16} />
              {isSubmitting ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-6 text-center">
            <p className="text-zinc-500 text-sm mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending}
              className="inline-flex items-center gap-2 text-sm text-gold-accent hover:text-gold-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} className={isResending ? 'animate-spin' : ''} />
              {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : isResending ? 'Sending...' : 'Resend OTP'}
            </button>
          </div>

          {/* Back link */}
          <div className="mt-8">
            <Link
              to={backLink}
              className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
