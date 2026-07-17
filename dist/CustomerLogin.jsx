import { useState } from "react";
import { Eye, EyeOff, Search, Bell, User } from "lucide-react";

const CustomerLogin = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-10 py-5">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
            F
          </div>
          <h1 className="text-2xl font-bold text-blue-500">Fixora</h1>
        </div>

        <div className="hidden md:flex gap-8 text-gray-300">
          <a href="#" className="hover:text-blue-500">Home</a>
          <a href="#" className="hover:text-blue-500">Services</a>
          <a href="#" className="hover:text-blue-500">About</a>
          <a href="#" className="hover:text-blue-500">Contact</a>
        </div>

        <div className="flex gap-5">
          <Search className="cursor-pointer" />
          <Bell className="cursor-pointer" />
          <User className="cursor-pointer" />
        </div>
      </nav>

      {/* Main Section */}
      <div className="flex flex-col lg:flex-row justify-center items-center px-6 py-10 gap-12">

        {/* Left Card */}
        <div className="bg-[#1a1a1a] rounded-3xl p-8 w-full max-w-md shadow-2xl">

          <h1 className="text-4xl font-bold">
            Welcome <span className="text-blue-500">Back!</span>
          </h1>

          <p className="text-gray-400 mt-3">
            Sign in to continue booking trusted local services with Fixora.
          </p>

          <div className="mt-8">

            <label className="text-gray-300">Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full mt-2 p-3 rounded-xl bg-[#262626] outline-none border border-gray-700 focus:border-blue-500"
            />

            <label className="text-gray-300 mt-5 block">
              Password
            </label>

            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full p-3 rounded-xl bg-[#262626] outline-none border border-gray-700 focus:border-blue-500"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-gray-400"
              >
                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>

            <div className="flex justify-between items-center mt-5">

              <label className="flex items-center gap-2 text-gray-400">
                <input type="checkbox"/>
                Remember Me
              </label>

              <a href="#" className="text-blue-500">
                Forgot Password?
              </a>

            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-700 transition mt-7 py-3 rounded-xl font-semibold">
              Login
            </button>

            <div className="text-center mt-6 text-gray-400">
              OR
            </div>

            <div className="grid grid-cols-2 gap-4 mt-5">

              <button className="border border-gray-700 rounded-xl py-3 hover:bg-gray-800">
                Google
              </button>

              <button className="border border-gray-700 rounded-xl py-3 hover:bg-gray-800">
                GitHub
              </button>

            </div>

            <p className="text-center mt-7 text-gray-400">
              Don't have an account?{" "}
              <span className="text-blue-500 cursor-pointer">
                Register
              </span>
            </p>

          </div>
        </div>

        {/* Right Side */}
        <div className="max-w-xl">

          <h1 className="text-6xl font-bold leading-tight">
            Local Services <br />
            <span className="text-blue-500">At Your Doorstep</span>
          </h1>

          <p className="text-gray-400 mt-6 text-lg">
            Book electricians, plumbers, carpenters, cleaners,
            mechanics and many more trusted professionals anytime,
            anywhere with Fixora.
          </p>

          <button className="mt-8 bg-blue-600 px-8 py-3 rounded-xl hover:bg-blue-700 transition">
            Explore Services
          </button>

        </div>

      </div>
    </div>
  );
};

export default CustomerLogin;