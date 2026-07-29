import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, ShieldCheck, ArrowLeft } from 'lucide-react';
import InputField from '../components/InputField';
import { API_BASE_URL } from '../config';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // Determine role from path
  const role = location.pathname.startsWith('/provider') ? 'provider' : 'customer';
  const email = location.state?.email || '';
  const otp = location.state?.otp || '';

  useEffect(() => {
    // Guard: if no email or OTP, redirect back to forgot password
    if (!email || !otp) {
      navigate(role === 'provider' ? '/provider/forgot-password' : '/customer/forgot-password');
    }
  }, [email, otp, navigate, role]);

  const validatePassword = (pw) => {
    if (pw.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.';
    if (!/[0-9]/.test(pw)) return 'Password must contain at least one number.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const pwError = validatePassword(newPassword);
    if (pwError) {
      setErrorMsg(pwError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/${role}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });
      const data = await res.json();

      if (res.ok && data.status) {
        setSuccessMsg('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate(role === 'provider' ? '/provider/login' : '/customer/login');
        }, 2000);
      } else {
        setErrorMsg(data.message || 'Password reset failed. Please try again.');
      }
    } catch {
      setErrorMsg('Server connection failed. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginLink = role === 'provider' ? '/provider/login' : '/customer/login';

  // Password strength indicator
  const getStrength = (pw) => {
    if (!pw) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: score, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { level: score, label: 'Fair', color: 'bg-yellow-500' };
    if (score === 3) return { level: score, label: 'Good', color: 'bg-blue-500' };
    return { level: score, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getStrength(newPassword);

  return (
    <div
      className="min-h-[calc(100vh-96px)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative"
      style={{ background: 'linear-gradient(135deg, var(--color-primary-bg) 0%, var(--color-secondary-bg) 100%)' }}
    >
      <div className="absolute inset-0 bg-[var(--color-primary-bg)]/50 z-0 pointer-events-none" />

      {/* Banner messages */}
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
        <div className="p-8 sm:p-12 flex flex-col">

          {/* Icon badge */}
          <div className="w-16 h-16 rounded-2xl bg-gold-accent/10 border border-gold-accent/25 flex items-center justify-center mb-6 self-center">
            <Lock size={32} className="text-gold-accent" />
          </div>

          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2 text-center">Reset Password</h2>
          <p className="text-[var(--color-text-secondary)] text-sm mb-8 text-center">
            Create a new strong password for your account.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <InputField
              label="New Password"
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {/* Password strength bar */}
            {newPassword && (
              <div className="-mt-3">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength.level ? strength.color : 'bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${
                  strength.level <= 1 ? 'text-red-400' :
                  strength.level === 2 ? 'text-yellow-400' :
                  strength.level === 3 ? 'text-blue-400' : 'text-green-400'
                }`}>
                  {strength.label} password
                </p>
              </div>
            )}

            <InputField
              label="Confirm New Password"
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              required
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus:outline-none cursor-pointer"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {/* Match indicator */}
            {confirmPassword && (
              <p className={`-mt-3 text-xs flex items-center gap-1 ${
                newPassword === confirmPassword ? 'text-green-400' : 'text-red-400'
              }`}>
                <ShieldCheck size={12} />
                {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !newPassword || !confirmPassword}
              className="w-full bg-gold-accent hover:bg-gold-hover text-bg-dark font-bold py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-2 shadow-lg shadow-gold-accent/15 hover:shadow-gold-accent/25"
            >
              <Lock size={16} />
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              to={loginLink}
              className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
