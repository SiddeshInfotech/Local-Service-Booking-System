import React, { useState } from 'react';
import { UserPlus, Send, ChevronDown } from 'lucide-react';
import InputField from '../components/InputField';
import providerRegisterIllustration from '../assets/images/provider_register_illustration.png';
import fixoraLogo from '../assets/images/fixora_logo.png';
import { API_BASE_URL } from '../config';

const ProviderRegister = () => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [service, setService] = useState('');
  const [experience, setExperience] = useState('');
  const [description, setDescription] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [idProof, setIdProof] = useState(null);

  // Interaction Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const serviceCategories = [
    'Electrician',
    'Plumber',
    'Carpenter',
    'Cleaning & Sanitation',
    'Appliance Repair',
    'Painter',
    'HVAC & Air Conditioning',
    'Pest Control',
    'Gardening & Landscaping'
  ];

  const cities = ['Dhule', 'Shirpur', 'Nashik', 'Mumbai', 'Pune', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedbackMsg('');
    setErrorMsg('');

    if (!city) {
      setErrorMsg('Please select your city.');
      return;
    }
    if (!service) {
      setErrorMsg('Please select your service.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/provider/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          email,
          password,
          city,
          service,          // backend maps this string to category_id
          experience,
          description,
          // File names for reference (actual file upload endpoint can be added later)
          profile_image: profilePhoto ? profilePhoto.name : null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status) {
        setFeedbackMsg(data.message || 'Registration successful! Please check your email to verify your account.');
        setFullName('');
        setPhone('');
        setEmail('');
        setPassword('');
        setCity('');
        setService('');
        setExperience('');
        setDescription('');
        setProfilePhoto(null);
        setIdProof(null);
      } else {
        setErrorMsg(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Unable to connect to the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 bg-black text-white">

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
        <div className="relative hidden lg:block overflow-hidden min-h-[600px]">
          <img
            src={providerRegisterIllustration}
            alt="Provider Registration Illustration"
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
            <h2 className="text-2xl font-bold text-[#D4AF37] tracking-tight leading-snug drop-shadow-md">
              Become a Service Provider
            </h2>
            <p className="text-white/70 mt-2 text-sm leading-relaxed drop-shadow-md">
              Join Fixora and start getting local service bookings instantly.
            </p>
          </div>
        </div>

        {/* Right Side: Provider Registration Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-[#0B1220]/45">

          {/* Mobile-only logo */}
          <div className="lg:hidden mb-6">
            <img
              src={fixoraLogo}
              alt="Fixora Logo"
              className="h-12 w-auto object-contain"
            />
          </div>
          
          <h2 className="text-2xl font-bold text-[#D4AF37] flex items-center gap-2.5 mb-8">
            <UserPlus size={24} className="text-[#D4AF37]" />
            <span className="text-[#D4AF37]">Provider Registration</span>
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Row 1: Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField
                label="Full Name"
                id="fullName"
                required
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <InputField
                label="Phone Number"
                id="phone"
                type="tel"
                required
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* Row 2: Email, Password & City */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="sm:col-span-1">
                <InputField
                  label="Email Address"
                  id="email"
                  type="email"
                  required
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="sm:col-span-1">
                <InputField
                  label="Password"
                  id="password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* City Dropdown */}
              <div className="flex flex-col w-full">
                <label htmlFor="city" className="text-gray-300 font-medium text-sm sm:text-base">
                  City <span className="text-[#D4AF37]">*</span>
                </label>
                <div className="relative flex items-center mt-2 w-full">
                  <select
                    id="city"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-3 pr-10 bg-[#262626] border border-gray-700 rounded-xl text-white outline-none appearance-none cursor-pointer focus:border-blue-500 transition duration-300 text-sm"
                  >
                    <option value="" disabled>Select City</option>
                    {cities.map((c) => (
                      <option key={c} value={c} className="bg-zinc-950">
                        {c}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 text-zinc-500 pointer-events-none flex items-center justify-center">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Select Service Dropdown */}
            <div className="flex flex-col w-full">
              <label htmlFor="service" className="text-gray-300 font-medium text-sm sm:text-base">
                Select Your Service <span className="text-[#D4AF37]">*</span>
              </label>
              <div className="relative flex items-center mt-2 w-full">
                <select
                  id="service"
                  required
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full p-3 pr-10 bg-[#262626] border border-gray-700 rounded-xl text-white outline-none appearance-none cursor-pointer focus:border-blue-500 transition duration-300 text-sm"
                >
                  <option value="" disabled>Choose Service</option>
                  {serviceCategories.map((cat) => (
                    <option key={cat} value={cat} className="bg-zinc-950">
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 text-zinc-500 pointer-events-none flex items-center justify-center">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>

            {/* Row 4: Experience */}
            <div>
              <InputField
                label="Experience (Years)"
                id="experience"
                type="number"
                required
                placeholder="e.g. 3 Years"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>

            {/* Row 5: Upload Photo & ID Proof */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="flex flex-col w-full">
                <label className="text-gray-300 font-medium text-sm">
                  Upload Profile Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePhoto(e.target.files[0] || null)}
                  className="block w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 bg-[#262626] border border-gray-700 rounded-xl p-2.5 mt-2 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="flex flex-col w-full">
                <label className="text-gray-300 font-medium text-sm">
                  Upload ID Proof
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setIdProof(e.target.files[0] || null)}
                  className="block w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 bg-[#262626] border border-gray-700 rounded-xl p-2.5 mt-2 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

            </div>

            {/* Row 6: Service Description */}
            <div className="flex flex-col w-full">
              <label htmlFor="description" className="text-gray-300 font-medium text-sm sm:text-base">
                Service Description
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="Describe your service skills..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-[#262626] border border-gray-700 rounded-xl text-white placeholder-zinc-500 outline-none mt-2 focus:border-blue-500 transition duration-300 resize-none text-sm"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              <Send size={16} />
              <span>{isSubmitting ? 'Registering...' : 'Register as Provider'}</span>
            </button>

            {/* Disclaimer */}
            <p className="text-zinc-500 text-xs text-center">
              By registering, you agree to Fixora{' '}
              <a href="#" className="text-[#D4AF37] hover:text-[#F4C542] hover:underline">Terms & Conditions</a>{' '}
              and{' '}
              <a href="#" className="text-[#D4AF37] hover:text-[#F4C542] hover:underline">Privacy Policy</a>.
            </p>

          </form>

        </div>

      </div>
    </div>
  );
};

export default ProviderRegister;
