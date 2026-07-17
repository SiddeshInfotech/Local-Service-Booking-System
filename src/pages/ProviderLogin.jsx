import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Shield, Key, LogIn } from 'lucide-react';
import InputField from '../components/InputField';
import providerLoginIllustration from '../assets/images/provider_login_illustration.png';
import fixoraLogo from '../assets/images/fixora_logo.png';
import { API_BASE_URL } from '../config';

const ProviderLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Interaction Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // Show verified message if redirected from email verification link
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      setFeedbackMsg('Email verified successfully! You can now log in as a provider.');
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMsg('');
    setErrorMsg('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/provider/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.status) {
        // Store provider auth tokens and provider info
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('provider', JSON.stringify(data.provider));
        localStorage.setItem('role', 'provider');
        setFeedbackMsg(`Welcome, ${data.provider.full_name || data.provider.business_name}! Redirecting to your dashboard...`);
        setEmail('');
        setPassword('');
        // Navigate to provider dashboard
        setTimeout(() => navigate('/services'), 800);
      } else {
        if (response.status === 403) {
          setErrorMsg(data.message || 'Your account is awaiting admin approval. Please try again later.');
        } else {
          setErrorMsg(data.message || 'Login failed. Please try again.');
        }
      }
    } catch (err) {
      setErrorMsg('Unable to connect to the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-[calc(100vh-96px)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">

      {feedbackMsg && (
        <div className="mb-6 p-4 rounded-xl bg-blue-950/40 border border-blue-800/40 text-blue-300 text-sm max-w-5xl w-full text-center">
          {feedbackMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-sm max-w-5xl w-full text-center">
          {errorMsg}
        </div>
      )}


      {/* Split glass card container */}
      <div className="w-full max-w-5xl bg-[#131b2e]/30 border border-zinc-800/80 rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-2xl backdrop-blur-md">

        {/* Left Side: Full-bleed Illustration Panel */}
        <div className="relative hidden md:block overflow-hidden min-h-[480px]">
          <img
            src={providerLoginIllustration}
            alt="Provider Login Illustration"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/30 to-transparent" />

          {/* Caption at the bottom */}
          <div className="absolute bottom-8 left-8 right-8">
            <h2 className="text-2xl font-bold text-blue-400 tracking-tight leading-snug drop-shadow-md">
              Provider Portal
            </h2>
            <p className="text-white/70 mt-2 text-sm leading-relaxed drop-shadow-md">
              Manage your services, bookings, and customers on Fixora.
            </p>
          </div>
        </div>

        {/* Right Side: Actionable Login Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-[#0B1220]/45 text-left">

          <h2 className="text-3xl font-bold text-[#D4AF37] mb-1">
            Service Provider Login
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-6">

            <InputField
              label="Email Address"
              id="email"
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              rightElement={<Mail size={18} className="text-zinc-500" />}
            />

            <InputField
              label="Password"
              id="password"
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

              <Link
                to="/provider/forgot-password"
                className="text-blue-500 hover:text-blue-400 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#00a8e8] hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-2 bg-gradient-to-r from-blue-600 to-blue-500"
            >
              <LogIn size={16} />
              <span>{isSubmitting ? 'Authenticating...' : 'Login as Provider'}</span>
            </button>

          </form>

          <p className="text-center sm:text-left mt-8 text-sm text-zinc-400">
            Not a provider?{' '}
            <Link to="/provider/register" className="text-blue-500 hover:text-blue-400 transition-colors font-semibold">
              Register Here
            </Link>
          </p>

        </div>

      </div>
    </div>
  );
};

export default ProviderLogin;
