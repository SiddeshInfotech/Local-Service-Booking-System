import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import InputField from '../components/InputField';
import customerRegisterIllustration from '../assets/images/customer_register_illustration.png';
import fixoraLogo from '../assets/images/fixora_logo.png';

const CustomerRegister = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Interaction Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedbackMsg('');
    setErrorMsg('');

    if (!role) {
      setErrorMsg('Please select your role.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setFeedbackMsg('Registration successful! Welcome to Fixora.');
      setFullName('');
      setEmail('');
      setPhone('');
      setRole('');
      setPassword('');
      setConfirmPassword('');
    }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      
      {feedbackMsg && (
        <div className="mb-6 p-4 rounded-xl bg-blue-950/40 border border-blue-800/40 text-blue-300 text-sm max-w-6xl w-full text-center">
          {feedbackMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-sm max-w-6xl w-full text-center">
          {errorMsg}
        </div>
      )}

      {/* Main split card */}
      <div className="w-full max-w-6xl bg-[#131b2e]/30 border border-zinc-800/80 rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 shadow-2xl backdrop-blur-md">

        {/* Left Side: Full-bleed Illustration Panel */}
        <div className="relative hidden lg:block overflow-hidden min-h-[520px]">
          <img
            src={customerRegisterIllustration}
            alt="Customer Registration Illustration"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/30 to-transparent" />
          {/* Logo pinned to the top-left */}
          <div className="absolute top-8 left-8">
            <img
              src={fixoraLogo}
              alt="Fixora Logo"
              className="h-14 w-auto object-contain drop-shadow-lg"
            />
          </div>
          {/* Caption at the bottom */}
          <div className="absolute bottom-8 left-8 right-8">
            <h2 className="text-2xl font-bold text-white tracking-tight leading-snug drop-shadow-md">
              Join Fixora 🚀
            </h2>
            <p className="text-white/70 mt-2 text-sm leading-relaxed drop-shadow-md">
              Create your account and start booking trusted local services instantly.
            </p>
          </div>
        </div>

        {/* Right Side: Account Creation Form Card */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-[#0B1220]/45">
          
          {/* Mobile-only logo */}
          <div className="lg:hidden mb-6">
            <img
              src={fixoraLogo}
              alt="Fixora Logo"
              className="h-12 w-auto object-contain"
            />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-1">
            Create Account
          </h2>
          <p className="text-zinc-500 text-sm mb-6">
            Sign up to continue
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            <InputField
              label="Full Name"
              id="fullName"
              required
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <InputField
              label="Email Address"
              id="email"
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <InputField
              label="Phone Number"
              id="phone"
              type="tel"
              required
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            {/* Select Role Dropdown */}
            <div className="flex flex-col w-full">
              <label htmlFor="role" className="text-gray-300 font-medium text-sm sm:text-base">
                Select Role <span className="text-blue-500">*</span>
              </label>
              <select
                id="role"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-3 bg-[#262626] border border-gray-700 rounded-xl text-white outline-none mt-2 cursor-pointer focus:border-blue-500 transition duration-300"
              >
                <option value="" disabled>Choose Role</option>
                <option value="customer" className="bg-[#111827]">Customer</option>
                <option value="provider" className="bg-[#111827]">Service Provider</option>
              </select>
            </div>

            <InputField
              label="Password"
              id="password"
              type="password"
              required
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <InputField
              label="Confirm Password"
              id="confirmPassword"
              type="password"
              required
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition duration-300 cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>

          </form>

          {/* OR divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <span className="relative z-10 px-4 bg-[#111827] text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              OR
            </span>
          </div>

          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={() => setFeedbackMsg('Google Sign-up process initiated (Demo Mode)...')}
            className="flex items-center justify-center gap-3 w-full py-2.5 bg-white hover:bg-zinc-100 text-black font-semibold rounded-xl transition duration-300 cursor-pointer active:scale-[0.98] text-sm"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Sign up with Google</span>
          </button>

          <p className="text-center mt-6 text-sm text-zinc-400">
            Already have an account?{' '}
            <Link to="/customer/login" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors underline underline-offset-4">
              Login Here
            </Link>
          </p>

        </div>

      </div>
    </div>
  );
};

export default CustomerRegister;
