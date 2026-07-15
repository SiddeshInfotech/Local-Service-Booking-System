import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, User, Lock } from 'lucide-react';
import InputField from '../components/InputField';
import customerLoginIllustration from '../assets/images/customer_login_illustration.png';
import fixoraLogo from '../assets/images/fixora_logo.png';
import { API_BASE_URL } from '../config';

const CustomerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Interaction Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // Show verified success message if redirected from email link
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      setFeedbackMsg('Email verified successfully! You can now log in.');
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMsg('');
    setErrorMsg('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.status) {
        // Store auth tokens and user info
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('role', 'customer');
        setFeedbackMsg(`Welcome back, ${data.user.full_name}! Redirecting...`);
        setEmail('');
        setPassword('');
        // Navigate to customer dashboard
        setTimeout(() => navigate('/services'), 800);
      } else {
        // Show a more helpful message for unverified email
        if (response.status === 403) {
          setErrorMsg('Your email is not verified. Please check your inbox and click the verification link.');
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


      {/* Main card matching the visual aspect ratio and background of the image */}
      <div className="w-full max-w-5xl bg-[#131b2e]/30 border border-zinc-800/80 rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-2xl backdrop-blur-md">

        {/* Left Side: Full-bleed Illustration Panel */}
        <div className="relative hidden md:block overflow-hidden min-h-[480px]">
          <img
            src={customerLoginIllustration}
            alt="Customer Login Illustration"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Subtle gradient overlay so the panel blends into the card */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/30 to-transparent" />

          {/* Caption at the bottom */}
          <div className="absolute bottom-8 left-8 right-8">
            <h2 className="text-2xl font-bold text-white tracking-tight leading-snug drop-shadow-md">
              Welcome Back to Fixora
            </h2>
            <p className="text-white/70 mt-2 text-sm leading-relaxed drop-shadow-md">
              Login to book trusted local services near you.
            </p>
          </div>
        </div>

        {/* Right Side: Actual Actionable Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-[#0B1220]/45">

          <h2 className="text-3xl font-bold text-white mb-1">
            Login
          </h2>
          <p className="text-zinc-500 text-sm mb-8">
            Access your Fixora account
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

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

            {/* Forgot Password link */}
            <div className="flex justify-end -mt-2">
              <Link to="/customer/forgot-password" className="text-sm text-[#D4AF37] hover:text-[#F4C542] transition-colors">
                Forgot Password?
              </Link>
            </div>

            {/* Small purple user silhouette icon above button */}
            <div className="text-purple-500 flex justify-start -mb-2 mt-1">
              <User size={18} className="stroke-[2.5]" />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {isSubmitting ? 'Signing in...' : 'Login \u2192'}
            </button>

          </form>

          {/* Navigation Links */}
          <div className="mt-8 space-y-3 text-center sm:text-left text-sm text-zinc-400">
            <p>
              Don't have an account?{' '}
              <Link to="/customer/register" className="text-blue-500 hover:text-blue-400 transition-colors font-medium">
                Register
              </Link>
            </p>
            <p>
              Are you a service provider?{' '}
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

export default CustomerLogin;
